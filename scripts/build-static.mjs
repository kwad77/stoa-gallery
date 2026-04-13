#!/usr/bin/env node
// Orchestrates the static build: prebuild -> next build -> postbuild.
// Ensures postbuild always runs so we don't leave stashed dirs behind.

import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const env = {
  ...process.env,
  NEXT_PUBLIC_GALLERY_STATIC: "1",
  NEXT_PUBLIC_GALLERY_BASE_PATH:
    process.env.NEXT_PUBLIC_GALLERY_BASE_PATH ?? "/stoa-gallery"
};

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: "inherit", env, cwd: ROOT, shell: true, ...opts });
  return res.status ?? 1;
}

// 1) prebuild
let rc = run("node", ["scripts/prebuild-static.mjs"]);
if (rc !== 0) process.exit(rc);

// 2) next build (catch rc so postbuild still runs)
const buildRc = run("npx", ["--no-install", "next", "build"]);

// 3) postbuild
const postRc = run("node", ["scripts/postbuild-static.mjs"]);

if (buildRc !== 0) {
  console.error(`\nnext build failed (rc=${buildRc}); stashed routes restored.`);
  process.exit(buildRc);
}
if (postRc !== 0) {
  console.error(`\npostbuild failed (rc=${postRc}); inspect _stash_* dirs and 'git checkout .' to restore.`);
  process.exit(postRc);
}
console.log("\n✓ static build complete. Output in out/. Preview with: npx serve out");
