/** Event types mirrored from ordo's docs/event-schema.json. Types are a
 * superset — unknown events render as "raw NDJSON row" so forward-compat
 * is automatic. Orchestra-mode kinds are first-class. */

export type OrdoEvent =
  | { type: "run-start"; run_id: string; ts: string; prompt?: string }
  | { type: "iter-start"; run_id: string; iter_id: string; role?: string; ts: string }
  | { type: "iter-end"; run_id: string; iter_id: string; ts: string; cost_usd?: number }
  | { type: "iter-spawned"; run_id: string; iter_id: string; role?: string; worktree_path: string; shell_command: string; cwd: string; ts?: string }
  | { type: "iter-merged"; run_id: string; iter_id: string; merged_into: string; merge_sha: string; files_count?: number; ts?: string }
  | { type: "merge-conflict"; run_id: string; iter_id: string; worktree_path: string; files: string[]; staging_sha?: string; iter_sha?: string; ts?: string }
  | { type: "run-finalized"; run_id: string; base_branch: string; merged_sha: string; iter_count: number; ts?: string }
  | { type: "done"; run_id: string; ts: string; cost_usd?: number; status?: string }
  | { type: string; run_id?: string; iter_id?: string; ts?: string; [k: string]: unknown };

export function parseNdjson(raw: string): OrdoEvent[] {
  const out: OrdoEvent[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      out.push(JSON.parse(trimmed) as OrdoEvent);
    } catch {
      // Skip unparseable lines; surface the raw text as a pseudo-event.
      out.push({ type: "parse-error", raw: trimmed } as OrdoEvent);
    }
  }
  return out;
}

export function iterOf(ev: OrdoEvent): string | undefined {
  return (ev as { iter_id?: string }).iter_id;
}

export function isOrchestraKind(ev: OrdoEvent): boolean {
  return (
    ev.type === "iter-spawned" ||
    ev.type === "iter-merged" ||
    ev.type === "merge-conflict" ||
    ev.type === "run-finalized"
  );
}

export function severityOf(ev: OrdoEvent): "ok" | "warn" | "err" | "info" {
  if (ev.type === "merge-conflict") return "err";
  if (ev.type === "iter-merged" || ev.type === "run-finalized") return "ok";
  if (ev.type === "iter-spawned") return "info";
  return "info";
}
