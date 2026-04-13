/**
 * In-memory live-event-stream broker.
 *
 * Producers POST NDJSON rows to /api/live/<run-id>/publish.
 * Consumers subscribe to /api/live/<run-id>/stream via SSE.
 *
 * Frames are kept in a ring buffer (capped at LIVE_BUFFER_MAX) per
 * run so a late subscriber can replay what's happened since the run
 * started. On finalize the buffer persists for LIVE_RETENTION_MS so
 * stragglers can still consume, then it's reaped.
 *
 * Scope: single-process. A multi-replica deploy would front this with
 * Redis pub/sub or Cloudflare Durable Objects. For the first
 * deployment (single Fly machine) this is enough.
 */

import { EventEmitter } from "node:events";

import type { OrdoEvent } from "./events";

const LIVE_BUFFER_MAX = 2000; // events
const LIVE_RETENTION_MS = 30_000; // after done, keep stream alive 30s

export interface LiveFrame {
  /** ISO timestamp the frame hit the broker. */
  receivedAt: string;
  /** Raw ordo-events row OR a pre-enveloped SCP event. */
  event: OrdoEvent | Record<string, unknown>;
}

interface LiveRun {
  runId: string;
  frames: LiveFrame[];
  emitter: EventEmitter;
  startedAt: string;
  endedAt?: string;
  reapTimer?: NodeJS.Timeout;
}

declare global {
  // eslint-disable-next-line no-var
  var __galleryLiveRuns: Map<string, LiveRun> | undefined;
}

function runs(): Map<string, LiveRun> {
  if (!globalThis.__galleryLiveRuns) {
    globalThis.__galleryLiveRuns = new Map<string, LiveRun>();
  }
  return globalThis.__galleryLiveRuns;
}

export function openRun(runId: string): LiveRun {
  const existing = runs().get(runId);
  if (existing) {
    // Producer reconnected (rare but possible). Cancel any pending reap.
    if (existing.reapTimer) {
      clearTimeout(existing.reapTimer);
      existing.reapTimer = undefined;
    }
    existing.endedAt = undefined;
    return existing;
  }
  const run: LiveRun = {
    runId,
    frames: [],
    emitter: new EventEmitter(),
    startedAt: new Date().toISOString()
  };
  run.emitter.setMaxListeners(0);
  runs().set(runId, run);
  return run;
}

export function publishFrame(
  runId: string,
  event: OrdoEvent | Record<string, unknown>
): LiveFrame {
  const run = openRun(runId);
  const frame: LiveFrame = {
    receivedAt: new Date().toISOString(),
    event
  };
  run.frames.push(frame);
  if (run.frames.length > LIVE_BUFFER_MAX) {
    run.frames.splice(0, run.frames.length - LIVE_BUFFER_MAX);
  }
  run.emitter.emit("frame", frame);

  const kind = (event as { type?: string }).type;
  if (kind === "done" || kind === "run-finalized") {
    endRun(runId, kind);
  }
  return frame;
}

export function endRun(runId: string, reason: string): void {
  const run = runs().get(runId);
  if (!run) return;
  if (run.endedAt) return; // already ended
  run.endedAt = new Date().toISOString();
  run.emitter.emit("end", { reason, ts: run.endedAt });
  run.reapTimer = setTimeout(() => {
    runs().delete(runId);
  }, LIVE_RETENTION_MS);
}

export function subscribe(
  runId: string,
  opts?: { replay?: boolean }
): {
  past: LiveFrame[];
  emitter: EventEmitter;
  ended: boolean;
} {
  const run = openRun(runId);
  const past = opts?.replay === false ? [] : [...run.frames];
  return { past, emitter: run.emitter, ended: Boolean(run.endedAt) };
}

export function getRunSnapshot(runId: string): {
  runId: string;
  frameCount: number;
  startedAt: string;
  endedAt?: string;
} | null {
  const run = runs().get(runId);
  if (!run) return null;
  return {
    runId: run.runId,
    frameCount: run.frames.length,
    startedAt: run.startedAt,
    endedAt: run.endedAt
  };
}

export function listActiveRuns(): string[] {
  return Array.from(runs().keys());
}
