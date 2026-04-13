import fs from "node:fs/promises";
import path from "node:path";

import { RUNS_DIR, runDir } from "./paths";
import type { ArchiveManifest } from "./archive";

export interface RunSummary {
  runId: string;
  prompt: string;
  iterCount: number;
  totalCostUsd: number;
  createdAt: string;
  ordoVersion: string;
}

export async function listRuns(): Promise<RunSummary[]> {
  try {
    const entries = await fs.readdir(RUNS_DIR, { withFileTypes: true });
    const summaries: RunSummary[] = [];
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const manifestPath = path.join(RUNS_DIR, e.name, "manifest.json");
      try {
        const raw = await fs.readFile(manifestPath, "utf-8");
        const m = JSON.parse(raw) as ArchiveManifest;
        summaries.push({
          runId: m.run_id,
          prompt: m.prompt || "",
          iterCount: m.iter_count,
          totalCostUsd: m.total_cost_usd,
          createdAt: m.created_at,
          ordoVersion: m.ordo_version
        });
      } catch {
        // Skip malformed entries — probably a partial upload.
      }
    }
    summaries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return summaries;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

export async function loadManifest(runId: string): Promise<ArchiveManifest | null> {
  try {
    const raw = await fs.readFile(path.join(runDir(runId), "manifest.json"), "utf-8");
    return JSON.parse(raw) as ArchiveManifest;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export async function readRunFile(runId: string, rel: string): Promise<Buffer | null> {
  // Guard against path traversal.
  const safe = path.normalize(rel).replace(/^([/\\])+/, "");
  if (safe.includes("..")) throw new Error("invalid path");
  try {
    return await fs.readFile(path.join(runDir(runId), safe));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export async function listRunFiles(runId: string): Promise<string[]> {
  const root = runDir(runId);
  const out: string[] = [];
  async function walk(dir: string, prefix: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const abs = path.join(dir, e.name);
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.isDirectory()) await walk(abs, rel);
      else out.push(rel);
    }
  }
  try {
    await walk(root, "");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
  return out.sort();
}
