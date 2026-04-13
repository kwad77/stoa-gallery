"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { OrdoEvent } from "@/lib/events";
import { parseNdjson } from "@/lib/events";
import { Timeline } from "@/components/replay/timeline";
import { OrchestraLane } from "@/components/replay/orchestra-lane";
import { Scrubber } from "@/components/replay/scrubber";

/**
 * Live replay client — subscribes to SSE, auto-advances the cursor,
 * drops the user into "follow" mode (pinned to head). Manual scrub
 * detaches from follow; "Follow live" re-attaches.
 */
export function LiveReplayClient({ runId }: { runId: string }) {
  const [events, setEvents] = useState<OrdoEvent[]>([]);
  const [cursor, setCursor] = useState(0);
  const [following, setFollowing] = useState(true);
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const source = new EventSource(`/api/live/${runId}/stream`);
    sourceRef.current = source;
    source.addEventListener("frame", (e: MessageEvent) => {
      try {
        const row = JSON.parse(e.data) as OrdoEvent;
        // If the frame is SCP-enveloped (v:1), unwrap its payload when
        // that payload looks like an ordo-events row. Otherwise treat
        // the envelope kind as the type.
        let ordoRow: OrdoEvent;
        const rowAny = row as Record<string, unknown>;
        if (rowAny.v === 1 && typeof rowAny.payload === "object" && rowAny.payload !== null) {
          const inner = rowAny.payload as Record<string, unknown>;
          if (typeof inner.type === "string") {
            ordoRow = inner as unknown as OrdoEvent;
          } else {
            ordoRow = {
              type: String(rowAny.kind ?? "envelope"),
              ...rowAny
            } as OrdoEvent;
          }
        } else {
          ordoRow = row;
        }
        setEvents((prev) => [...prev, ordoRow]);
      } catch {
        /* skip bad frames */
      }
    });
    source.addEventListener("end", () => setEnded(true));
    source.onerror = () => {
      // Built-in auto-reconnect runs; surface the state to the user.
      setError("stream interrupted; reconnecting…");
    };
    return () => {
      source.close();
      sourceRef.current = null;
    };
  }, [runId]);

  // Follow-mode: keep the cursor pinned to the head while frames arrive.
  useEffect(() => {
    if (following) setCursor(events.length);
  }, [events.length, following]);

  const visible = useMemo(() => events.slice(0, cursor), [events, cursor]);
  const iters = useMemo(() => deriveIters(events), [events]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <LiveBadge ended={ended} frameCount={events.length} />
        {!following && !ended && (
          <button
            onClick={() => setFollowing(true)}
            className="rounded-md border border-accent bg-accent/10 px-3 py-1 text-xs text-accent hover:bg-accent/20"
          >
            ▼ Follow live
          </button>
        )}
        {error && (
          <span className="text-xs text-warn font-mono">{error}</span>
        )}
      </div>

      <Scrubber
        total={events.length}
        cursor={cursor}
        playing={false}
        onSeek={(n) => {
          setCursor(n);
          setFollowing(n >= events.length);
        }}
        onPlayToggle={() => setFollowing((f) => !f)}
      />

      <OrchestraLane iters={iters} cursor={cursor} events={events} />

      <section className="space-y-3">
        <h2 className="text-xs text-muted uppercase tracking-wider">
          timeline ({visible.length}/{events.length}{ended ? "" : " streaming…"})
        </h2>
        <Timeline events={visible} />
      </section>
    </div>
  );
}

function LiveBadge({
  ended,
  frameCount
}: {
  ended: boolean;
  frameCount: number;
}) {
  if (ended) {
    return (
      <span className="inline-flex items-center gap-2 rounded-md border border-muted/50 bg-panel px-3 py-1 text-xs font-mono text-muted">
        <span className="h-2 w-2 rounded-full bg-muted" />
        ENDED · {frameCount} frames
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-err/50 bg-err/10 px-3 py-1 text-xs font-mono text-err">
      <span className="h-2 w-2 rounded-full bg-err animate-pulse" />
      LIVE · {frameCount}
    </span>
  );
}

function deriveIters(events: OrdoEvent[]) {
  interface R { id: string; role?: string; spawnedAt?: number; mergedAt?: number; conflict?: boolean }
  const map = new Map<string, R>();
  events.forEach((e, idx) => {
    const iid = (e as { iter_id?: string }).iter_id;
    if (!iid) return;
    const row = map.get(iid) ?? { id: iid };
    if (e.type === "iter-spawned" || e.type === "iter-start") {
      row.spawnedAt = row.spawnedAt ?? idx;
      const r = (e as { role?: string }).role;
      if (r) row.role = r;
    }
    if (e.type === "iter-merged" || e.type === "iter-end") row.mergedAt = idx;
    if (e.type === "merge-conflict") row.conflict = true;
    map.set(iid, row);
  });
  return Array.from(map.values()).sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true })
  );
}
