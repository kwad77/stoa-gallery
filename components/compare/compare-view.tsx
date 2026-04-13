"use client";

import clsx from "clsx";

import type { OrdoEvent } from "@/lib/events";
import type { ArchiveManifest } from "@/lib/archive";

interface Side {
  manifest: ArchiveManifest;
  events: OrdoEvent[];
}

interface IterRow {
  id: string;
  role?: string;
  startIdx?: number;
  endIdx?: number;
  conflict?: boolean;
}

function deriveIters(events: OrdoEvent[]): IterRow[] {
  const map = new Map<string, IterRow>();
  events.forEach((e, idx) => {
    const iid = (e as { iter_id?: string }).iter_id;
    if (!iid) return;
    const row = map.get(iid) ?? { id: iid };
    if (e.type === "iter-spawned" || e.type === "iter-start") {
      row.startIdx = row.startIdx ?? idx;
      const r = (e as { role?: string }).role;
      if (r) row.role = r;
    }
    if (e.type === "iter-merged" || e.type === "iter-end") row.endIdx = idx;
    if (e.type === "merge-conflict") row.conflict = true;
    map.set(iid, row);
  });
  return Array.from(map.values()).sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true })
  );
}

export function CompareView({ a, b }: { a: Side; b: Side }) {
  const itersA = deriveIters(a.events);
  const itersB = deriveIters(b.events);
  const roles = Array.from(
    new Set([...itersA, ...itersB].map((r) => r.role ?? "—"))
  );

  const totalA = Math.max(a.events.length, 1);
  const totalB = Math.max(b.events.length, 1);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <SideCol title="A" side={a} iters={itersA} total={totalA} />
      <SideCol title="B" side={b} iters={itersB} total={totalB} tint="iter" />

      <aside className="md:col-span-2 rounded-md border border-border bg-panel p-4">
        <h3 className="text-xs font-mono text-muted uppercase tracking-wider mb-3">
          role overlap
        </h3>
        <div className="grid grid-cols-[100px_1fr_1fr] gap-2 text-xs font-mono items-center">
          <div className="text-muted">role</div>
          <div className="text-accent">A</div>
          <div className="text-iter">B</div>
          {roles.map((role) => {
            const inA = itersA.some((r) => (r.role ?? "—") === role);
            const inB = itersB.some((r) => (r.role ?? "—") === role);
            return (
              <RoleRow key={role} role={role} inA={inA} inB={inB} />
            );
          })}
        </div>
      </aside>
    </div>
  );
}

function SideCol({
  title,
  side,
  iters,
  total,
  tint = "accent"
}: {
  title: string;
  side: Side;
  iters: IterRow[];
  total: number;
  tint?: "accent" | "iter";
}) {
  return (
    <div className="rounded-md border border-border bg-panel p-4">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <div>
          <div className={clsx("text-xs font-mono tracking-widest", tint === "accent" ? "text-accent" : "text-iter")}>
            {title}
          </div>
          <div className="font-semibold truncate max-w-md">
            {side.manifest.prompt || side.manifest.run_id}
          </div>
        </div>
        <div className="text-[10px] font-mono text-muted text-right">
          ordo {side.manifest.ordo_version}
          <br />
          {new Date(side.manifest.created_at).toLocaleString()}
        </div>
      </div>

      <ul className="space-y-2">
        {iters.map((it) => {
          const leftPct = it.startIdx !== undefined ? (it.startIdx / total) * 100 : 0;
          const rightPct = Math.min(
            100,
            ((it.endIdx ?? total) / total) * 100
          );
          return (
            <li
              key={it.id}
              className="grid grid-cols-[60px_80px_1fr] gap-2 items-center text-xs font-mono"
            >
              <span className={tint === "accent" ? "text-accent" : "text-iter"}>
                {it.id}
              </span>
              <span className="text-muted truncate">{it.role ?? "—"}</span>
              <div className="relative h-3 w-full rounded bg-border/30 overflow-hidden">
                <div
                  className={clsx(
                    "absolute top-0 bottom-0",
                    it.conflict ? "bg-err/60" : "bg-ok/60"
                  )}
                  style={{ left: `${leftPct}%`, width: `${Math.max(1, rightPct - leftPct)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 text-[11px] text-muted font-mono flex justify-between">
        <span>
          {iters.length} iter{iters.length === 1 ? "" : "s"} · {side.events.length} events
        </span>
        <span>${side.manifest.total_cost_usd.toFixed(4)}</span>
      </div>
    </div>
  );
}

function RoleRow({ role, inA, inB }: { role: string; inA: boolean; inB: boolean }) {
  return (
    <>
      <div className="text-muted">{role}</div>
      <div className={inA ? "text-accent" : "text-muted/50"}>
        {inA ? "● present" : "○ absent"}
      </div>
      <div className={inB ? "text-iter" : "text-muted/50"}>
        {inB ? "● present" : "○ absent"}
      </div>
    </>
  );
}
