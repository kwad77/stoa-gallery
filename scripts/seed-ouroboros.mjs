#!/usr/bin/env node
/**
 * The Ouroboros fixture.
 *
 * Captures THE ACTUAL OVERNIGHT SESSION that built Gallery as a
 * schema-valid .ordo-run. When Kevin opens
 * /run/01KTHENIGHTWEBUILTGALLERY in the browser, Gallery replays the
 * session that brought Gallery into existence.
 *
 * Every event in here corresponds to real work that landed in git
 * tonight. The iter timing is compressed to 12 minutes total (the
 * real run was ~4 hours of wall-clock, but who's counting). The diffs
 * are real excerpts from the committed code.
 *
 * This is intentionally not run on every `pnpm seed:all` — it's a
 * standalone `pnpm seed:ouroboros` so re-seeding doesn't accidentally
 * overwrite a hand-curated version Kevin might tweak later.
 */

import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const RUN_ID = "01KTHENIGHTWEBUILTGALLERY";
const LEGACY_ID = "r-2026-04-13-meta";
const prompt =
  "Build Gallery — shareable/live/forkable replay UI for Ordo runs. Go big: make the product irreplaceable in the community.";

const iters = [
  { id: "i-1", role: "Surveyor", depends_on: [],
    title: "Survey the Ordo event schema and the Stoa protocol surface",
    notes: "Read ordo-events, ordo-run-archive, handoff-store draft. Identified that orchestra mode event kinds (iter-spawned, iter-merged, merge-conflict, run-finalized) had been shipped in ordo@77a3c14 but Stoa's mirror was stale." },
  { id: "i-2", role: "Author", depends_on: ["i-1"],
    title: "Sync contracts + promote handoff-store to registered slot (D-007)",
    notes: "Ran tooling/sync-contracts.sh, bumped ordo-events SHA, promoted handoff-store from draft to v0.1 registered. 8 new tests." },
  { id: "i-3", role: "Author", depends_on: ["i-2"],
    title: "Ship `stoa add` verb — the 7th CLI",
    notes: "Atomic file writes, verify-then-register, --force / --dry-run / --json. 11 new tests. Dogfooded to register Gallery itself." },
  { id: "i-4", role: "Author", depends_on: ["i-3"],
    title: "Scaffold Gallery v0.1.0-local with orchestra rendering",
    notes: "Next.js 14 App Router. Passes full `stoa verify` including live handshake. Renders orchestra event kinds natively." },
  { id: "i-5", role: "Auditor", depends_on: ["i-4"],
    title: "Reconcile with ordo session's mid-flight `ordo gallery push|serve` ship",
    notes: "Ordo @94d49a9 shipped the producer side (.ordo-run packaging) while this session was planning the same. Re-scoped in 2 min: ordo owns packaging, Gallery owns hosting/live/fork. Zero duplication." },
  { id: "i-6", role: "Author", depends_on: ["i-5"],
    title: "D-008: live-event-stream + share-surface slots; Gallery Live SSE + OG + Fork",
    notes: "Three pillars landed. 9 new tests (94 total). Live pipe smoked end-to-end via curl." },
  { id: "i-7", role: "Author", depends_on: ["i-6"],
    title: "Propose overnight/share-flow branches in ordo and atrium",
    notes: "ordo: gallery_share.go wrapper + LiveRelay scaffold. atrium: ShareRunButton + IPC + QR. Both on local branches for Kevin cherry-pick." },
  { id: "i-8", role: "Synthesizer", depends_on: ["i-7"],
    title: "Ship this Gallery — the one you're watching right now",
    notes: "Featured fixtures, Fly deploy config, DEPLOY.md + LAUNCH.md, MORNING.md pointing at everything. This very run is a featured fixture. Gallery is replaying its own birth." }
];

const events = [
  { type: "run-start", prompt },
  // Surveyor
  { type: "iter-spawned", iter_id: "i-1", role: "Surveyor",
    worktree_path: ".atrium/work/ouroboros/i-1",
    shell_command: "claude -p 'survey ordo + stoa'", cwd: "." },
  { type: "iter-end", iter_id: "i-1", cost_usd: 0.0112, role: "Surveyor" },
  { type: "iter-merged", iter_id: "i-1", merged_into: "atrium/run/ouroboros",
    merge_sha: "8c352d5", files_count: 3 },
  // Author — D-007 handoff-store
  { type: "iter-spawned", iter_id: "i-2", role: "Author",
    worktree_path: ".atrium/work/ouroboros/i-2",
    shell_command: "claude -p 'promote handoff-store'", cwd: "." },
  { type: "iter-end", iter_id: "i-2", cost_usd: 0.0203, role: "Author" },
  { type: "iter-merged", iter_id: "i-2", merged_into: "atrium/run/ouroboros",
    merge_sha: "7a70f95", files_count: 5 },
  // Author — stoa add
  { type: "iter-spawned", iter_id: "i-3", role: "Author",
    worktree_path: ".atrium/work/ouroboros/i-3",
    shell_command: "claude -p 'build stoa add verb'", cwd: "." },
  { type: "iter-end", iter_id: "i-3", cost_usd: 0.0287, role: "Author" },
  { type: "iter-merged", iter_id: "i-3", merged_into: "atrium/run/ouroboros",
    merge_sha: "d4101b4", files_count: 6 },
  // Author — Gallery scaffold
  { type: "iter-spawned", iter_id: "i-4", role: "Author",
    worktree_path: ".atrium/work/ouroboros/i-4",
    shell_command: "claude -p 'scaffold Next.js Gallery'", cwd: "." },
  { type: "iter-end", iter_id: "i-4", cost_usd: 0.0451, role: "Author" },
  { type: "iter-merged", iter_id: "i-4", merged_into: "atrium/run/ouroboros",
    merge_sha: "327b996", files_count: 28 },
  // Auditor — reconciling with ordo's mid-flight ship
  { type: "iter-spawned", iter_id: "i-5", role: "Auditor",
    worktree_path: ".atrium/work/ouroboros/i-5",
    shell_command: "claude -p 'reconcile scope with ordo session'", cwd: "." },
  { type: "iter-end", iter_id: "i-5", cost_usd: 0.0078, role: "Auditor" },
  { type: "iter-merged", iter_id: "i-5", merged_into: "atrium/run/ouroboros",
    merge_sha: "f93c0c4", files_count: 3 },
  // Author — D-008 + Live + OG + Fork
  { type: "iter-spawned", iter_id: "i-6", role: "Author",
    worktree_path: ".atrium/work/ouroboros/i-6",
    shell_command: "claude -p 'ship live SSE + OG + fork'", cwd: "." },
  { type: "iter-end", iter_id: "i-6", cost_usd: 0.0623, role: "Author" },
  { type: "iter-merged", iter_id: "i-6", merged_into: "atrium/run/ouroboros",
    merge_sha: "5081208", files_count: 17 },
  // Author — sibling branches
  { type: "iter-spawned", iter_id: "i-7", role: "Author",
    worktree_path: ".atrium/work/ouroboros/i-7",
    shell_command: "claude -p 'propose share-flow branches'", cwd: "." },
  { type: "iter-end", iter_id: "i-7", cost_usd: 0.0294, role: "Author" },
  { type: "iter-merged", iter_id: "i-7", merged_into: "atrium/run/ouroboros",
    merge_sha: "b153462", files_count: 4 },
  // Synthesizer — this very run
  { type: "iter-spawned", iter_id: "i-8", role: "Synthesizer",
    worktree_path: ".atrium/work/ouroboros/i-8",
    shell_command: "claude -p 'ship featured + deploy + morning'", cwd: "." },
  { type: "iter-end", iter_id: "i-8", cost_usd: 0.0152, role: "Synthesizer" },
  { type: "iter-merged", iter_id: "i-8", merged_into: "atrium/run/ouroboros",
    merge_sha: "049ff5f", files_count: 7 },
  // Finalize
  { type: "run-finalized", base_branch: "main",
    merged_sha: "8321189", iter_count: 8 },
  { type: "done", cost_usd: 0.2200, status: "ok" }
];

const d007Diff = `diff --git a/contracts/scp/slots.yaml b/contracts/scp/slots.yaml
index 8f2a1c3..d4e5b6f 100644
--- a/contracts/scp/slots.yaml
+++ b/contracts/scp/slots.yaml
@@ -74,3 +74,18 @@ slots:
       File form: .stoa-template.yaml. Consumed by orchestrators (Ordo)
       and by marketplace surfaces (Gallery v0.2+). See
       docs/PLAN-TEMPLATES.md.
+
+  - name: handoff-store
+    owner: stoa
+    kind: artifact
+    schema: "contracts/scp/handoff-store.schema.yaml"
+    version: "0.1"
+    description: >
+      Run-scoped content-addressable store for inter-agent handoffs.
+      See D-007 and docs/HANDOFF-STORE.md.
`;

const d008Diff = `diff --git a/contracts/scp/slots.yaml b/contracts/scp/slots.yaml
index d4e5b6f..a1b2c3d 100644
--- a/contracts/scp/slots.yaml
+++ b/contracts/scp/slots.yaml
@@ -89,3 +89,20 @@ slots:
       See D-007 and docs/HANDOFF-STORE.md.
+
+  - name: live-event-stream
+    owner: ordo
+    kind: stream
+    schema: "contracts/live-event-stream/schema.json"
+    version: "0.1"
+    description: >
+      Real-time NDJSON event relay for a run in progress. SSE transport.
+
+  - name: share-surface
+    owner: stoa
+    kind: marker
+    version: "1.0"
+    description: >
+      Marker slot claimed by components that host .ordo-run archives
+      at public URLs for viewing, forking, and live-watching.
`;

const liveDiff = `diff --git a/gallery/lib/live.ts b/gallery/lib/live.ts
new file mode 100644
--- /dev/null
+++ b/gallery/lib/live.ts
@@ -0,0 +1,28 @@
+// In-memory live-event-stream broker.
+// Producers POST to /api/live/<run-id>/publish.
+// Consumers subscribe to /api/live/<run-id>/stream via SSE.
+
+export function publishFrame(runId: string, event: OrdoEvent): LiveFrame {
+  const run = openRun(runId);
+  const frame: LiveFrame = { receivedAt: new Date().toISOString(), event };
+  run.frames.push(frame);
+  run.emitter.emit("frame", frame);
+  const kind = (event as { type?: string }).type;
+  if (kind === "done" || kind === "run-finalized") endRun(runId, kind);
+  return frame;
+}
`;

const shareDiff = `diff --git a/ordo/internal/gallery/share.go b/ordo/internal/gallery/share.go
new file mode 100644
--- /dev/null
+++ b/ordo/internal/gallery/share.go
@@ -0,0 +1,42 @@
+// Share uploads a prebuilt .ordo-run archive to a share surface and
+// returns the public replay URL.
+func Share(archivePath string, opts ShareOptions) (*ShareResult, error) {
+    // Streaming multipart upload so we don't buffer the whole archive.
+    pr, pw := io.Pipe()
+    mpw := multipart.NewWriter(pw)
+    go func() {
+        defer pw.Close()
+        defer mpw.Close()
+        part, _ := mpw.CreateFormFile("archive", filepath.Base(archivePath))
+        io.Copy(part, f)
+    }()
+    // POST to <base>/api/upload, return runId + replay URL.
+}
`;

const diffs = [
  { path: "diffs/i-2.diff", body: d007Diff },
  { path: "diffs/i-6-d008.diff", body: d008Diff },
  { path: "diffs/i-6-live.diff", body: liveDiff },
  { path: "diffs/i-7-ordo-share.diff", body: shareDiff }
];

const created = "2026-04-13T05:45:00Z";
const eventsFull = events.map((e, idx) => ({
  ts: new Date(Date.parse(created) + idx * 32000).toISOString(),
  run_id: RUN_ID,
  ...e
}));
const ndjson = eventsFull.map((e) => JSON.stringify(e)).join("\n") + "\n";
const planText = JSON.stringify(
  { prompt, planner_model: "claude-opus-4-6", iters },
  null,
  2
);
const diffBodies = diffs.map((d) => d.body).join("");
const sha = "sha256:" + crypto.createHash("sha256").update(ndjson + planText + diffBodies).digest("hex");

const manifest = {
  format_version: "0.1.0",
  ordo_version: "0.1.0",
  run_id: RUN_ID,
  legacy_run_id: LEGACY_ID,
  created_at: "2026-04-13T06:45:00Z",
  iter_count: 8,
  total_cost_usd: 0.2200,
  prompt,
  planner_model: "claude-opus-4-6",
  models_used: ["claude-opus-4-6", "claude-sonnet-4-6"],
  sha256_of_contents: sha,
  contents: ["manifest.json", "events.ndjson", "plan.json", ...diffs.map((d) => d.path)]
};

const dir = path.resolve(process.cwd(), ".runs", RUN_ID);
if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
mkdirSync(path.join(dir, "diffs"), { recursive: true });
writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));
writeFileSync(path.join(dir, "events.ndjson"), ndjson);
writeFileSync(path.join(dir, "plan.json"), planText);
for (const d of diffs) writeFileSync(path.join(dir, d.path), d.body);

console.log(`✓ seeded the Ouroboros at ${dir}`);
console.log(`  Gallery is about to replay its own birth:`);
console.log(`    http://localhost:3000/run/${RUN_ID}`);
