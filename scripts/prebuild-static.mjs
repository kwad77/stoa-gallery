#!/usr/bin/env node
/**
 * Pre-build script for the static export to GitHub Pages.
 *
 * Next.js `output: 'export'` is a strict static build — no API routes,
 * no runtime fetches to our own server. This script does the heavy
 * lifting BEFORE `next build` runs:
 *
 *   1. Copies every .runs/<id>/ tree under public/runs/<id>/ so the
 *      client can load events.ndjson / plan.json / diffs via a
 *      relative path that GH Pages serves as a static file.
 *   2. Pre-generates /public/runs/<id>/og.svg (the same SVG the
 *      dynamic opengraph-image.tsx produces at runtime).
 *   3. Pre-generates /public/runs/<id>/fork.yaml (same as the
 *      runtime /api/runs/<id>/fork route output).
 *   4. Writes /public/index.json listing every available run so the
 *      home page + featured page can enumerate without a server.
 *
 * Runs as part of `npm run build:static`. For dev mode, the live
 * server routes still handle everything dynamically.
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync, cpSync, existsSync, renameSync, rmSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const RUNS_DIR = path.join(ROOT, ".runs");
const PUBLIC_DIR = path.join(ROOT, "public");
const PUBLIC_RUNS = path.join(PUBLIC_DIR, "runs");

// GitHub Pages project sub-path for OG URLs etc. Must match basePath
// in next.config.static.mjs. Overridable via env for custom domains.
const BASE_URL = process.env.GALLERY_PUBLIC_URL || "https://kwad77.github.io/stoa-gallery";

mkdirSync(PUBLIC_RUNS, { recursive: true });

const runIds = existsSync(RUNS_DIR)
  ? readdirSync(RUNS_DIR, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name)
  : [];
if (runIds.length === 0) {
  console.error("no runs in .runs/ — run 'npm run seed:all' first");
  process.exit(1);
}

console.log(`Found ${runIds.length} runs; staging under public/runs/`);

const summaries = [];

for (const runId of runIds) {
  const src = path.join(RUNS_DIR, runId);
  const dst = path.join(PUBLIC_RUNS, runId);
  cpSync(src, dst, { recursive: true });

  const manifest = JSON.parse(readFileSync(path.join(src, "manifest.json"), "utf-8"));

  // List files in the run so client-side components can enumerate
  // without fs access.
  const files = walk(src).map((p) => path.relative(src, p).replace(/\\/g, "/")).sort();
  writeFileSync(path.join(dst, "__files.json"), JSON.stringify(files, null, 2));

  // Pre-generate the OG SVG.
  writeFileSync(path.join(dst, "og.svg"), renderOgSvg(manifest));

  // Pre-generate the fork YAML.
  writeFileSync(path.join(dst, "fork.yaml"), renderForkYaml(manifest, BASE_URL));

  summaries.push({
    runId,
    prompt: manifest.prompt || "",
    iterCount: manifest.iter_count,
    totalCostUsd: manifest.total_cost_usd,
    createdAt: manifest.created_at,
    ordoVersion: manifest.ordo_version
  });

  console.log(`  ✓ ${runId} (${files.length} files, ${manifest.iter_count} iter${manifest.iter_count === 1 ? "" : "s"})`);
}

summaries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
writeFileSync(path.join(PUBLIC_DIR, "index.json"), JSON.stringify({ runs: summaries, generated_at: new Date().toISOString() }, null, 2));

// Write a static list of compare pair permutations so /compare/[a]/[b]
// can render everything at build time.
const pairs = [];
for (let i = 0; i < summaries.length; i++) {
  for (let j = 0; j < summaries.length; j++) {
    if (i === j) continue;
    pairs.push({ a: summaries[i].runId, b: summaries[j].runId });
  }
}
writeFileSync(path.join(PUBLIC_DIR, "compare-pairs.json"), JSON.stringify({ pairs }, null, 2));

console.log(`\nStaged ${summaries.length} runs + ${pairs.length} compare pairs.`);

// Stash server-only routes so `output: 'export'` doesn't error on them.
// Restored by scripts/postbuild-static.mjs.
const SERVER_ONLY = [
  "app/api",
  "app/live/[id]",
  "app/run/[id]/opengraph-image.tsx",
  "app/compare/go"
];
for (const rel of SERVER_ONLY) {
  const src = path.join(ROOT, rel);
  if (!existsSync(src)) continue;
  const stashed = path.join(ROOT, "_stash_" + rel.replace(/[/\\]/g, "__"));
  if (existsSync(stashed)) rmSync(stashed, { recursive: true, force: true });
  renameSync(src, stashed);
  console.log(`  stashed ${rel}`);
}

console.log(`public/index.json ready.`);

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function renderOgSvg(manifest) {
  const esc = (s) => String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const prompt = (manifest.prompt || "Ordo run").slice(0, 130) +
    ((manifest.prompt?.length || 0) > 130 ? "…" : "");
  const words = prompt.split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > 56 && cur) {
      lines.push(cur); cur = w;
      if (lines.length >= 3) break;
    } else cur = (cur + " " + w).trim();
  }
  if (lines.length < 3 && cur) lines.push(cur);
  const tspans = lines.slice(0, 3).map((line, i) =>
    `<text x="72" y="${270 + i * 72}" fill="#e9ecf3" font-size="60" font-weight="600" font-family="system-ui, sans-serif">${esc(line)}</text>`
  ).join("");

  const iters = manifest.iter_count ?? 0;
  const cost = `$${(manifest.total_cost_usd ?? 0).toFixed(4)}`;
  const mode = iters > 0 ? "orchestra" : "run";
  const ordoVer = manifest.ordo_version ?? "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#0b0d12"/><stop offset="100%" stop-color="#141827"/>
  </linearGradient></defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="72" y="108" fill="#8892a6" font-size="28" font-family="ui-monospace, monospace">
    <tspan fill="#7aa2f7">stoa</tspan> / <tspan fill="#e9ecf3">gallery</tspan>
  </text>
  ${ordoVer ? `<g transform="translate(${1200 - 72 - 220}, 80)">
    <rect x="0" y="0" width="220" height="44" rx="8" fill="#12151d" stroke="#1f2433"/>
    <text x="110" y="30" fill="#bb9af7" font-size="22" font-family="ui-monospace, monospace" text-anchor="middle">ordo ${esc(ordoVer)}</text>
  </g>` : ""}
  ${tspans}
  <g transform="translate(72, 530)"><text x="0" y="0" fill="#8892a6" font-size="22" letter-spacing="2">ITERS</text><text x="0" y="52" fill="#e9ecf3" font-size="52" font-family="ui-monospace, monospace">${esc(String(iters))}</text></g>
  <g transform="translate(260, 530)"><text x="0" y="0" fill="#8892a6" font-size="22" letter-spacing="2">COST</text><text x="0" y="52" fill="#e9ecf3" font-size="52" font-family="ui-monospace, monospace">${esc(cost)}</text></g>
  <g transform="translate(520, 530)"><text x="0" y="0" fill="#8892a6" font-size="22" letter-spacing="2">MODE</text><text x="0" y="52" fill="#bb9af7" font-size="52" font-family="ui-monospace, monospace">${esc(mode)}</text></g>
  <text x="${1200 - 72}" y="588" fill="#8892a6" font-size="22" font-family="ui-monospace, monospace" text-anchor="end">scrub · fork · watch live</text>
</svg>`;
}

function renderForkYaml(manifest, baseUrl) {
  const slug = (manifest.prompt || "forked-run").split("\n")[0]
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "forked";
  const tid = `${slug}-${manifest.run_id.slice(0, 8).toLowerCase()}`;
  const q = (s) => {
    if (s === "") return '""';
    if (/^[\w./@-]+$/.test(s) && !/^(true|false|null|~|-?\d+(\.\d+)?)$/.test(s)) return s;
    return JSON.stringify(s);
  };
  const models = manifest.models_used || [];
  let roster = "";
  if (models.length > 0) {
    roster = `  roster:
    overlays:
    - role: Author
      prefer_model: ${q(models[0])}
      rationale: Inherited from the origin run's author iter.
`;
  }
  return `apiVersion: stoa/v1
kind: PlanTemplate
metadata:
  id: ${tid}
  name: ${q(`Forked: ${(manifest.prompt || manifest.run_id).slice(0, 60)}`)}
  version: 0.1.0
  description: ${q(`Forked from an Ordo run on ${manifest.created_at}. Original: ${manifest.iter_count} iters, $${(manifest.total_cost_usd || 0).toFixed(4)}.`)}
  tags:
  - fork
  - gallery
  license: MIT
  origin_run_id: ${manifest.run_id}
  origin_share_url: ${q(`${baseUrl}/run/${manifest.run_id}`)}
spec:
  prompt:
    template: ${q(manifest.prompt || "(no prompt recorded)")}
${roster}`;
}
