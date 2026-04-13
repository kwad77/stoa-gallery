"use client";

import { isOrchestraKind, severityOf, type OrdoEvent } from "@/lib/events";
import clsx from "clsx";
import { useEffect, useRef } from "react";

interface Props {
  events: OrdoEvent[];
}

export function Timeline({ events }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Scroll to the bottom as new events arrive (the cursor advances).
    ref.current?.scrollTo({ top: ref.current.scrollHeight });
  }, [events.length]);

  return (
    <div
      ref={ref}
      className="rounded-md border border-border bg-panel font-mono text-xs max-h-[420px] overflow-y-auto"
    >
      {events.length === 0 ? (
        <div className="p-6 text-muted">no events yet — press ▶ play</div>
      ) : (
        <ul className="divide-y divide-border">
          {events.map((e, i) => (
            <li key={i} className="px-3 py-2 flex gap-3 hover:bg-border/30">
              <span className="text-muted w-12 tabular-nums">{i + 1}</span>
              <span
                className={clsx(
                  "w-32 truncate",
                  isOrchestraKind(e) ? "text-iter" : "text-accent",
                  severityOf(e) === "err" && "text-err",
                  severityOf(e) === "ok" && "text-ok"
                )}
              >
                {e.type}
              </span>
              <span className="flex-1 text-ink/70 truncate">
                {summarize(e)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function summarize(e: OrdoEvent): string {
  switch (e.type) {
    case "run-start":
      return `prompt="${((e as { prompt?: string }).prompt || "").slice(0, 80)}"`;
    case "iter-start":
    case "iter-spawned": {
      const r = (e as { role?: string }).role;
      const id = (e as { iter_id?: string }).iter_id;
      return `${id} ${r ? `(${r})` : ""}`.trim();
    }
    case "iter-end":
    case "iter-merged": {
      const id = (e as { iter_id?: string }).iter_id;
      const sha = (e as { merge_sha?: string }).merge_sha;
      return `${id}${sha ? ` → ${sha.slice(0, 7)}` : ""}`;
    }
    case "merge-conflict": {
      const f = (e as { files?: string[] }).files ?? [];
      return `files=${f.length} [${f.slice(0, 2).join(", ")}${
        f.length > 2 ? "…" : ""
      }]`;
    }
    case "run-finalized": {
      const b = (e as { base_branch?: string }).base_branch;
      const c = (e as { iter_count?: number }).iter_count;
      return `merged ${c} iter${c === 1 ? "" : "s"} into ${b}`;
    }
    case "done": {
      const cost = (e as { cost_usd?: number }).cost_usd;
      return cost !== undefined ? `cost=$${cost.toFixed(4)}` : "";
    }
    default: {
      const keys = Object.keys(e).filter((k) => k !== "type");
      const pick = keys.slice(0, 3).map((k) => {
        const v = (e as Record<string, unknown>)[k];
        const str = typeof v === "string" ? v : JSON.stringify(v);
        return `${k}=${String(str).slice(0, 20)}`;
      });
      return pick.join(" ");
    }
  }
}
