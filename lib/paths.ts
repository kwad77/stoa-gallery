import path from "node:path";

/**
 * Runtime path helpers. All paths anchor on the gallery repo root (the
 * directory containing package.json). This file is imported by both
 * server components and API routes.
 */
export const REPO_ROOT = process.cwd();

/** Where unpacked .ordo-run archives live. Gitignored. */
export const RUNS_DIR = path.join(REPO_ROOT, ".runs");

/** Vendored slot schemas (written by `stoa bundle-contracts`). */
export const CONTRACTS_DIR = path.join(REPO_ROOT, "contracts");

/** Append-only family-events log emitted by gallery. */
export const EVIDENCE_DIR = path.join(REPO_ROOT, "evidence");
export const FAMILY_EVENTS_LOG = path.join(
  EVIDENCE_DIR,
  "family-events.ndjson"
);

export function runDir(runId: string): string {
  // Runs are sha/ulid-ish; only allow what an ordo-run ID can contain.
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(runId)) {
    throw new Error(`invalid run id: ${runId}`);
  }
  return path.join(RUNS_DIR, runId);
}
