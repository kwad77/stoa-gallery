"use client";

import { useEffect, useMemo, useState } from "react";

import { parseNdjson, type OrdoEvent } from "@/lib/events";
import type { ArchiveManifest } from "@/lib/archive";
import { Timeline } from "./timeline";
import { Scrubber } from "./scrubber";
import { PlanTree } from "./plan-tree";
import { DiffPanel } from "./diff-panel";
import { OrchestraLane } from "./orchestra-lane";

interface Props {
  runId: string;
  manifest: ArchiveManifest;
  files: string[];
}

export function ReplayClient({ runId, manifest, files }: Props) {
  const [events, setEvents] = useState<OrdoEvent[] | null>(null);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/runs/${runId}/events`);
        if (!res.ok) {
          setError(`events.ndjson: ${res.status}`);
          return;
        }
        const raw = await res.text();
        if (cancelled) return;
        const parsed = parseNdjson(raw);
        setEvents(parsed);
        setCursor(parsed.length); // start at end; rewind to scrub
      } catch (err) {
        if (!cancelled) setError(String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [runId]);

  useEffect(() => {
    if (!playing || !events) return;
    if (cursor >= events.length) {
      setPlaying(false);
      return;
    }
    const handle = setTimeout(() => setCursor((c) => c + 1), 220);
    return () => clearTimeout(handle);
  }, [playing, cursor, events]);

  const visible = useMemo(() => events?.slice(0, cursor) ?? [], [events, cursor]);
  const iters = useMemo(() => deriveIters(events ?? []), [events]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-err/40 bg-err/10 text-err text-sm p-3 font-mono">
          {error}
        </div>
      )}

      <Scrubber
        total={events?.length ?? 0}
        cursor={cursor}
        playing={playing}
        onSeek={setCursor}
        onPlayToggle={() => setPlaying((p) => !p)}
      />

      <OrchestraLane iters={iters} cursor={cursor} events={events ?? []} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <section className="md:col-span-1 space-y-3">
          <h2 className="text-xs text-muted uppercase tracking-wider">
            plan tree
          </h2>
          <PlanTree runId={runId} files={files} />
        </section>
        <section className="md:col-span-2 space-y-3">
          <h2 className="text-xs text-muted uppercase tracking-wider">
            timeline ({visible.length}/{events?.length ?? "…"})
          </h2>
          <Timeline events={visible} />
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="text-xs text-muted uppercase tracking-wider">diffs</h2>
        <DiffPanel runId={runId} files={files} />
      </section>
    </div>
  );
}

interface IterRow {
  id: string;
  role?: string;
  spawnedAt?: number;
  mergedAt?: number;
  conflict?: boolean;
}

function deriveIters(events: OrdoEvent[]): IterRow[] {
  const map = new Map<string, IterRow>();
  events.forEach((e, idx) => {
    const iid = (e as { iter_id?: string }).iter_id;
    if (!iid) return;
    const row = map.get(iid) ?? { id: iid };
    if (e.type === "iter-spawned" || e.type === "iter-start") {
      row.spawnedAt = row.spawnedAt ?? idx;
      const role = (e as { role?: string }).role;
      if (role) row.role = role;
    }
    if (e.type === "iter-merged" || e.type === "iter-end") {
      row.mergedAt = idx;
    }
    if (e.type === "merge-conflict") row.conflict = true;
    map.set(iid, row);
  });
  return Array.from(map.values()).sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true })
  );
}
