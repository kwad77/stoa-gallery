"use client";

import clsx from "clsx";

import type { OrdoEvent } from "@/lib/events";

interface IterRow {
  id: string;
  role?: string;
  spawnedAt?: number;
  mergedAt?: number;
  conflict?: boolean;
}

interface Props {
  iters: IterRow[];
  cursor: number;
  events: OrdoEvent[];
}

/**
 * Orchestra mode visualization. Each iter is one row. The row's lifecycle
 * is split into [spawned → merged] against the event cursor: grey before
 * spawn, iter-colored while running, ok-colored after merge, err-colored
 * if the iter hit merge-conflict.
 */
export function OrchestraLane({ iters, cursor, events }: Props) {
  if (iters.length === 0) return null;
  const total = events.length || 1;

  return (
    <section className="space-y-2">
      <h2 className="text-xs text-muted uppercase tracking-wider flex items-center gap-2">
        orchestra
        <span className="text-[10px] text-iter bg-iter/10 border border-iter/30 rounded px-1.5 py-0.5">
          {iters.length} iter{iters.length === 1 ? "" : "s"}
        </span>
      </h2>
      <div className="rounded-md border border-border bg-panel p-3 space-y-2">
        {iters.map((iter) => {
          const state = iterState(iter, cursor);
          return (
            <div
              key={iter.id}
              className="grid grid-cols-[80px_80px_1fr_60px] items-center gap-3 font-mono text-xs"
            >
              <span className="text-accent">{iter.id}</span>
              <span className="text-muted truncate">{iter.role ?? "—"}</span>
              <LaneBar
                total={total}
                spawnedAt={iter.spawnedAt}
                mergedAt={iter.mergedAt}
                cursor={cursor}
                state={state}
              />
              <span
                className={clsx(
                  "text-right uppercase tracking-wider text-[10px]",
                  state === "pending" && "text-muted",
                  state === "running" && "text-iter",
                  state === "merged" && "text-ok",
                  state === "conflict" && "text-err"
                )}
              >
                {state}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

type IterState = "pending" | "running" | "merged" | "conflict";

function iterState(iter: IterRow, cursor: number): IterState {
  if (iter.conflict && iter.spawnedAt !== undefined && cursor > iter.spawnedAt) {
    return "conflict";
  }
  if (iter.mergedAt !== undefined && cursor > iter.mergedAt) return "merged";
  if (iter.spawnedAt !== undefined && cursor > iter.spawnedAt) return "running";
  return "pending";
}

function LaneBar({
  total,
  spawnedAt,
  mergedAt,
  cursor,
  state
}: {
  total: number;
  spawnedAt?: number;
  mergedAt?: number;
  cursor: number;
  state: IterState;
}) {
  const start = spawnedAt ?? 0;
  const end = mergedAt ?? total;
  const pct = (n: number) => `${Math.min(100, Math.max(0, (n / total) * 100))}%`;
  const fillColor =
    state === "conflict"
      ? "bg-err/60"
      : state === "merged"
      ? "bg-ok/60"
      : state === "running"
      ? "bg-iter/60"
      : "bg-border/60";
  const cursorVisible = cursor <= total;
  return (
    <div className="relative h-4 w-full rounded bg-border/30 overflow-hidden">
      <div
        className={clsx("absolute top-0 bottom-0", fillColor)}
        style={{ left: pct(start), width: `calc(${pct(end)} - ${pct(start)})` }}
      />
      {cursorVisible && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-accent"
          style={{ left: pct(cursor) }}
        />
      )}
    </div>
  );
}
