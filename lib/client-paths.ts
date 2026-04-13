/**
 * URL helpers for client components. Two modes:
 *
 *   - server (npm run dev / Fly deploy): fetches go to /api/... routes.
 *   - static (GitHub Pages): fetches go to pre-generated static files
 *     under /runs/<id>/... which the prebuild script stages in public/.
 *
 * Using NEXT_PUBLIC_GALLERY_STATIC so the branch is compile-time
 * trivial — the dev bundle won't carry unused branches.
 */

const IS_STATIC = process.env.NEXT_PUBLIC_GALLERY_STATIC === "1";
const BASE_PATH = process.env.NEXT_PUBLIC_GALLERY_BASE_PATH || "";

export function eventsUrl(runId: string): string {
  return IS_STATIC
    ? `${BASE_PATH}/runs/${runId}/events.ndjson`
    : `/api/runs/${runId}/events`;
}

export function fileUrl(runId: string, rel: string): string {
  return IS_STATIC
    ? `${BASE_PATH}/runs/${runId}/${rel}`
    : `/api/runs/${runId}/file?p=${encodeURIComponent(rel)}`;
}

export function forkUrl(runId: string): string {
  return IS_STATIC
    ? `${BASE_PATH}/runs/${runId}/fork.yaml`
    : `/api/runs/${runId}/fork`;
}

export const isStaticBuild = IS_STATIC;
