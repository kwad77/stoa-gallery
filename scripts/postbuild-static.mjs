#!/usr/bin/env node
/**
 * Restore the server-only routes that prebuild-static.mjs stashed.
 * Runs whether the build succeeded or failed (invoke via `node
 * scripts/postbuild-static.mjs` at the end of the build script, OR
 * run `git checkout .` to restore from HEAD if something explodes).
 */

import { existsSync, renameSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const MAPPING = {
  "_stash_app__api": "app/api",
  "_stash_app__live__[id]": "app/live/[id]",
  "_stash_app__run__[id]__opengraph-image.tsx": "app/run/[id]/opengraph-image.tsx",
  "_stash_app__compare__go": "app/compare/go"
};

let restored = 0;
for (const [stashed, original] of Object.entries(MAPPING)) {
  const src = path.join(ROOT, stashed);
  const dst = path.join(ROOT, original);
  if (!existsSync(src)) continue;
  if (existsSync(dst)) {
    rmSync(dst, { recursive: true, force: true });
  }
  renameSync(src, dst);
  restored++;
  console.log(`  restored ${original}`);
}

// Also catch any _stash_* that we didn't enumerate (schema drift).
for (const entry of readdirSync(ROOT)) {
  if (entry.startsWith("_stash_")) {
    console.warn(`  WARNING: orphan stash ${entry} — restore manually or 'git checkout .' then 'rm -rf ${entry}'`);
  }
}

console.log(`\nrestored ${restored} routes.`);
