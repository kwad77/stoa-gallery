#!/usr/bin/env node
// Seed the two extra featured-run fixtures beyond the canonical
// orchestra demo. Each is schema-valid (ordo-run-archive) but
// synthetic — zero external calls. Kevin can replace any of these
// with a real captured .ordo-run later.

import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const FIXTURES = [
  {
    runId: "01KFEATUREREFACTOR000000001",
    legacy: "r-2026-04-13-002",
    prompt: "migrate ReactDOM.render to createRoot across the frontend",
    planner_model: "claude-opus-4-6",
    models_used: ["claude-opus-4-6"],
    iter_count: 1,
    total_cost_usd: 0.0112,
    created_at: "2026-04-13T04:12:00Z",
    events: [
      { type: "run-start", prompt: "migrate ReactDOM.render to createRoot across the frontend" },
      { type: "iter-spawned", iter_id: "i-1", role: "Author", worktree_path: ".atrium/work/refactor/i-1", shell_command: "claude -p 'sweep'", cwd: "." },
      { type: "iter-end", iter_id: "i-1", cost_usd: 0.0112 },
      { type: "iter-merged", iter_id: "i-1", merged_into: "atrium/run/refactor", merge_sha: "d4e5f6071829", files_count: 23 },
      { type: "run-finalized", base_branch: "main", merged_sha: "e5f607182939", iter_count: 1 },
      { type: "done", cost_usd: 0.0112, status: "ok" }
    ],
    diffs: [
      {
        path: "diffs/i-1.diff",
        body: `diff --git a/src/index.tsx b/src/index.tsx
index a1b2c3d..e4f5a6b 100644
--- a/src/index.tsx
+++ b/src/index.tsx
@@ -1,10 +1,8 @@
 import React from "react";
-import ReactDOM from "react-dom";
+import { createRoot } from "react-dom/client";
 import App from "./App";

-ReactDOM.render(
-  <React.StrictMode><App /></React.StrictMode>,
-  document.getElementById("root")
-);
+const root = createRoot(document.getElementById("root")!);
+root.render(<React.StrictMode><App /></React.StrictMode>);
`
      }
    ],
    plan: {
      prompt: "migrate ReactDOM.render to createRoot across the frontend",
      planner_model: "claude-opus-4-6",
      iters: [{ id: "i-1", role: "Author", depends_on: [], notes: "sweep + test" }]
    }
  },
  {
    runId: "01KFEATUREDOCS000000000DEMO",
    legacy: "r-2026-04-13-003",
    prompt: "generate package-level docs for internal/orchestra and internal/scheduler",
    planner_model: "claude-opus-4-6",
    models_used: ["claude-opus-4-6", "claude-sonnet-4-6"],
    iter_count: 2,
    total_cost_usd: 0.0437,
    created_at: "2026-04-13T02:55:00Z",
    events: [
      { type: "run-start", prompt: "generate package-level docs for internal/orchestra and internal/scheduler" },
      { type: "iter-spawned", iter_id: "i-1", role: "Author", worktree_path: ".atrium/work/docs/i-1", shell_command: "claude -p 'write docs'", cwd: "." },
      { type: "iter-end", iter_id: "i-1", cost_usd: 0.0292 },
      { type: "iter-merged", iter_id: "i-1", merged_into: "atrium/run/docs", merge_sha: "aabbccddeeff", files_count: 14 },
      { type: "iter-spawned", iter_id: "i-2", role: "Synthesizer", worktree_path: ".atrium/work/docs/i-2", shell_command: "claude -p 'stitch nav'", cwd: "." },
      { type: "iter-end", iter_id: "i-2", cost_usd: 0.0145 },
      { type: "iter-merged", iter_id: "i-2", merged_into: "atrium/run/docs", merge_sha: "112233445566", files_count: 1 },
      { type: "run-finalized", base_branch: "main", merged_sha: "778899aabbcc", iter_count: 2 },
      { type: "done", cost_usd: 0.0437, status: "ok" }
    ],
    diffs: [],
    plan: {
      prompt: "generate package-level docs for internal/orchestra and internal/scheduler",
      planner_model: "claude-opus-4-6",
      iters: [
        { id: "i-1", role: "Author", depends_on: [], notes: "per-package doc.md" },
        { id: "i-2", role: "Synthesizer", depends_on: ["i-1"], notes: "build nav index" }
      ]
    }
  }
];

const runsDir = path.resolve(process.cwd(), ".runs");
mkdirSync(runsDir, { recursive: true });

for (const f of FIXTURES) {
  const dir = path.join(runsDir, f.runId);
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  if (f.diffs.length) mkdirSync(path.join(dir, "diffs"), { recursive: true });

  const eventsFull = f.events.map((e, idx) => ({
    ts: new Date(Date.parse(f.created_at) + idx * 8000).toISOString(),
    run_id: f.runId,
    ...e
  }));
  const ndjson = eventsFull.map((e) => JSON.stringify(e)).join("\n") + "\n";

  const planText = JSON.stringify(f.plan, null, 2);
  const diffBodies = f.diffs.map((d) => d.body).join("");
  const shaSource = ndjson + planText + diffBodies;
  const sha = "sha256:" + crypto.createHash("sha256").update(shaSource).digest("hex");

  const contents = ["manifest.json", "events.ndjson", "plan.json", ...f.diffs.map((d) => d.path)];
  const manifest = {
    format_version: "0.1.0",
    ordo_version: "0.1.0",
    run_id: f.runId,
    legacy_run_id: f.legacy,
    created_at: f.created_at,
    iter_count: f.iter_count,
    total_cost_usd: f.total_cost_usd,
    prompt: f.prompt,
    planner_model: f.planner_model,
    models_used: f.models_used,
    sha256_of_contents: sha,
    contents
  };

  writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));
  writeFileSync(path.join(dir, "events.ndjson"), ndjson);
  writeFileSync(path.join(dir, "plan.json"), planText);
  for (const d of f.diffs) {
    writeFileSync(path.join(dir, d.path), d.body);
  }
  console.log(`✓ seeded featured run ${f.runId}`);
}

console.log("");
console.log("  Featured demos ready. http://localhost:3000/featured");
