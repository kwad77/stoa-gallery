#!/usr/bin/env node
// Gallery's SCP handshake. Invoked per stoa.component.yaml:
//   spec.describe.command = "node scripts/stoa-describe.mjs"
// Emits a ComponentDescription response matching the shape stoa verify's
// check 4 (handshake round-trip) expects. Exits 0 on success.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { randomBytes } from "node:crypto";
import yaml from "js-yaml";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const manifestPath = path.join(repoRoot, "stoa.component.yaml");

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function ulid() {
  const ts = BigInt(Date.now());
  const rand = BigInt("0x" + randomBytes(10).toString("hex"));
  let combined = (ts << 80n) | rand;
  let s = "";
  for (let i = 0; i < 26; i++) {
    s = ALPHABET[Number(combined & 0x1fn)] + s;
    combined >>= 5n;
  }
  return s;
}

try {
  const manifestText = readFileSync(manifestPath, "utf-8");
  const manifest = yaml.load(manifestText);
  if (!manifest || typeof manifest !== "object" || !manifest.metadata) {
    throw new Error("stoa.component.yaml did not parse as an object");
  }
  const response = {
    apiVersion: "stoa/v1",
    kind: "ComponentDescription",
    manifest,
    instance: {
      id: ulid(),
      startedAt: new Date().toISOString()
    },
    health: {
      status: "ok",
      detail: "local-first; no external dependencies"
    },
    runtime: {
      component: "gallery",
      mode: "local-first",
      node: process.version
    }
  };
  process.stdout.write(JSON.stringify(response) + "\n");
  process.exit(0);
} catch (err) {
  process.stderr.write(
    JSON.stringify({
      apiVersion: "stoa/v1",
      kind: "ComponentDescription",
      health: { status: "down", detail: err instanceof Error ? err.message : String(err) }
    }) + "\n"
  );
  process.exit(1);
}
