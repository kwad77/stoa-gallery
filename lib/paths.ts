import path from "node:path";

/**
 * Runtime path helpers. Paths anchor on `GALLERY_DATA_DIR` when set
 * (production / Fly volume mount), otherwise on the repo root. This
 * lets the same code run locally with filesystem storage AND in
 * production with a persistent volume, with zero code changes.
 */
export const REPO_ROOT = process.cwd();
export const IS_STATIC = process.env.NEXT_PUBLIC_GALLERY_STATIC === "1";
export const BASE_PATH = process.env.GALLERY_BASE_PATH || "";

/** Root for all runtime-persistent state. Overridable in prod. */
export const DATA_ROOT = process.env.GALLERY_DATA_DIR || REPO_ROOT;

/**
 * Where unpacked .ordo-run archives live. In static mode the prebuild
 * script has copied them under public/runs/ so Next's static export can
 * emit them as public assets.
 */
export const RUNS_DIR = IS_STATIC
  ? path.join(REPO_ROOT, "public", "runs")
  : path.join(DATA_ROOT, ".runs");

/** Vendored slot schemas (written by `stoa bundle-contracts`). */
export const CONTRACTS_DIR = path.join(REPO_ROOT, "contracts");

/** Append-only family-events log emitted by gallery. */
export const EVIDENCE_DIR = path.join(DATA_ROOT, "evidence");
export const FAMILY_EVENTS_LOG = path.join(
  EVIDENCE_DIR,
  "family-events.ndjson"
);

export function runDir(runId: string): string {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(runId)) {
    throw new Error(`invalid run id: ${runId}`);
  }
  return path.join(RUNS_DIR, runId);
}

/** Public-facing base URL (sent to producers so they know where to push live events). */
export const PUBLIC_BASE_URL =
  process.env.GALLERY_PUBLIC_URL || "http://localhost:3000";
