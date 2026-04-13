#!/usr/bin/env node
// Seed the local gallery with a bundled demo .ordo-run archive. The
// archive is synthetic but schema-valid and uses orchestra-mode event
// kinds, so the replay UI renders the orchestra lane end-to-end.
//
// Writes to .runs/<run-id>/ directly (no HTTP upload needed).

import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const RUN_ID = "01KGALLERYDEMO00000000ORDO";
const LEGACY_ID = "r-2026-04-13-001";

const prompt =
  "add gzip compression to the /api/events route and cover with a test";
const planner_model = "claude-opus-4-6";

const planIters = [
  { id: "i-1", role: "Surveyor", depends_on: [], notes: "map the request path" },
  { id: "i-2", role: "Author", depends_on: ["i-1"], notes: "write the compression middleware" },
  { id: "i-3", role: "Auditor", depends_on: ["i-2"], notes: "review + extend the test" }
];

const events = [
  {
    type: "run-start",
    run_id: RUN_ID,
    ts: "2026-04-13T05:50:00Z",
    prompt
  },
  {
    type: "iter-spawned",
    run_id: RUN_ID,
    iter_id: "i-1",
    role: "Surveyor",
    worktree_path: ".atrium/work/demo/i-1",
    shell_command: "claude -p 'map the request path'",
    cwd: ".atrium/work/demo/i-1",
    ts: "2026-04-13T05:50:02Z"
  },
  {
    type: "iter-end",
    run_id: RUN_ID,
    iter_id: "i-1",
    ts: "2026-04-13T05:50:40Z",
    cost_usd: 0.0041
  },
  {
    type: "iter-merged",
    run_id: RUN_ID,
    iter_id: "i-1",
    merged_into: "atrium/run/demo",
    merge_sha: "a1b2c3d4e5f607182939",
    files_count: 1,
    ts: "2026-04-13T05:50:41Z"
  },
  {
    type: "iter-spawned",
    run_id: RUN_ID,
    iter_id: "i-2",
    role: "Author",
    worktree_path: ".atrium/work/demo/i-2",
    shell_command: "claude -p 'write the compression middleware'",
    cwd: ".atrium/work/demo/i-2",
    ts: "2026-04-13T05:50:45Z"
  },
  {
    type: "iter-end",
    run_id: RUN_ID,
    iter_id: "i-2",
    ts: "2026-04-13T05:52:10Z",
    cost_usd: 0.0083
  },
  {
    type: "iter-merged",
    run_id: RUN_ID,
    iter_id: "i-2",
    merged_into: "atrium/run/demo",
    merge_sha: "b2c3d4e5f60718293940",
    files_count: 2,
    ts: "2026-04-13T05:52:11Z"
  },
  {
    type: "iter-spawned",
    run_id: RUN_ID,
    iter_id: "i-3",
    role: "Auditor",
    worktree_path: ".atrium/work/demo/i-3",
    shell_command: "claude -p 'review the middleware, extend tests'",
    cwd: ".atrium/work/demo/i-3",
    ts: "2026-04-13T05:52:15Z"
  },
  {
    type: "iter-end",
    run_id: RUN_ID,
    iter_id: "i-3",
    ts: "2026-04-13T05:52:55Z",
    cost_usd: 0.0062
  },
  {
    type: "iter-merged",
    run_id: RUN_ID,
    iter_id: "i-3",
    merged_into: "atrium/run/demo",
    merge_sha: "c3d4e5f607182939404a",
    files_count: 1,
    ts: "2026-04-13T05:52:56Z"
  },
  {
    type: "run-finalized",
    run_id: RUN_ID,
    base_branch: "main",
    merged_sha: "d4e5f607182939404a5b",
    iter_count: 3,
    ts: "2026-04-13T05:52:58Z"
  },
  {
    type: "done",
    run_id: RUN_ID,
    ts: "2026-04-13T05:52:59Z",
    cost_usd: 0.0186,
    status: "ok"
  }
];

const diffBody = `diff --git a/app/api/events/route.ts b/app/api/events/route.ts
index 1111111..2222222 100644
--- a/app/api/events/route.ts
+++ b/app/api/events/route.ts
@@ -1,4 +1,10 @@
 import { NextResponse } from "next/server";
+import { gzipSync } from "node:zlib";

 export async function GET() {
-  return NextResponse.json({ events: [] });
+  const body = JSON.stringify({ events: [] });
+  const gz = gzipSync(body);
+  return new NextResponse(gz, {
+    headers: { "content-encoding": "gzip", "content-type": "application/json" }
+  });
 }
`;

const planFile = JSON.stringify(
  {
    prompt,
    planner_model,
    iters: planIters
  },
  null,
  2
);
const eventsNdjson = events.map((e) => JSON.stringify(e)).join("\n") + "\n";

const contents = [
  "manifest.json",
  "events.ndjson",
  "plan.json",
  "diffs/i-2.diff"
];

const plainSource = eventsNdjson + planFile + diffBody;
const sha256OfContents =
  "sha256:" + crypto.createHash("sha256").update(plainSource).digest("hex");

const manifest = {
  format_version: "0.1.0",
  ordo_version: "0.0.2",
  run_id: RUN_ID,
  legacy_run_id: LEGACY_ID,
  created_at: "2026-04-13T05:53:00Z",
  iter_count: 3,
  total_cost_usd: 0.0186,
  prompt,
  planner_model,
  models_used: ["claude-opus-4-6", "claude-sonnet-4-6"],
  sha256_of_contents: sha256OfContents,
  contents
};

const runRoot = path.resolve(process.cwd(), ".runs", RUN_ID);
if (existsSync(runRoot)) rmSync(runRoot, { recursive: true, force: true });
mkdirSync(runRoot, { recursive: true });
mkdirSync(path.join(runRoot, "diffs"), { recursive: true });

writeFileSync(path.join(runRoot, "manifest.json"), JSON.stringify(manifest, null, 2));
writeFileSync(path.join(runRoot, "events.ndjson"), eventsNdjson);
writeFileSync(path.join(runRoot, "plan.json"), planFile);
writeFileSync(path.join(runRoot, "diffs/i-2.diff"), diffBody);

console.log(`✓ seeded demo run at ${runRoot}`);
console.log(`  replay at http://localhost:3000/run/${RUN_ID}`);
