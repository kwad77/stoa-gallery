import fs from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";

import { RUNS_DIR, runDir } from "./paths";
import { validateArchiveManifest } from "./schema";

export interface ArchiveManifest {
  format_version: string;
  ordo_version: string;
  run_id: string;
  legacy_run_id: string;
  created_at: string;
  iter_count: number;
  total_cost_usd: number;
  prompt?: string;
  planner_model?: string;
  models_used?: string[];
  sha256_of_contents: string;
  contents: string[];
  [key: string]: unknown;
}

export interface UnpackedRun {
  runId: string;
  manifest: ArchiveManifest;
  files: Map<string, Buffer>;
}

/** Unpack a .ordo-run / zip buffer in memory. Validates manifest.json. */
export async function unpackArchive(buf: Buffer): Promise<UnpackedRun> {
  const zip = await JSZip.loadAsync(buf);
  const manifestEntry = zip.file("manifest.json");
  if (!manifestEntry) {
    throw new Error("archive is missing manifest.json at its root");
  }
  const manifestText = await manifestEntry.async("string");
  let manifest: ArchiveManifest;
  try {
    manifest = JSON.parse(manifestText) as ArchiveManifest;
  } catch (err) {
    throw new Error(`manifest.json is not valid JSON: ${err}`);
  }
  const validation = await validateArchiveManifest(manifest);
  if (!validation.ok) {
    throw new Error(
      `archive manifest failed schema: ${(validation.errors || []).join("; ")}`
    );
  }
  if (!manifest.run_id) {
    throw new Error("manifest.run_id is missing");
  }

  const files = new Map<string, Buffer>();
  const entries: [string, JSZip.JSZipObject][] = [];
  zip.forEach((name, entry) => {
    if (!entry.dir) entries.push([name, entry]);
  });
  for (const [name, entry] of entries) {
    const content = await entry.async("nodebuffer");
    files.set(name, content);
  }

  return { runId: manifest.run_id, manifest, files };
}

/** Persist an unpacked run to disk under .runs/<runId>/. Atomic-ish. */
export async function persistRun(unpacked: UnpackedRun): Promise<string> {
  const dir = runDir(unpacked.runId);
  const tmp = `${dir}.tmp-${Date.now()}`;
  try {
    await fs.mkdir(tmp, { recursive: true });
    for (const [rel, buf] of unpacked.files) {
      const dst = path.join(tmp, rel);
      await fs.mkdir(path.dirname(dst), { recursive: true });
      await fs.writeFile(dst, buf);
    }
    // Replace any existing run dir with the new one. On overwrite we
    // remove the old dir first (best-effort).
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch {
      // ignore
    }
    await fs.rename(tmp, dir);
  } catch (err) {
    // Clean up the temp dir if anything failed.
    await fs.rm(tmp, { recursive: true, force: true }).catch(() => {});
    throw err;
  }
  return dir;
}

export async function ensureRunsDir(): Promise<void> {
  await fs.mkdir(RUNS_DIR, { recursive: true });
}
