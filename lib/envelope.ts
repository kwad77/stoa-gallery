import fs from "node:fs/promises";
import path from "node:path";

import { EVIDENCE_DIR, FAMILY_EVENTS_LOG } from "./paths";

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** Crockford-base32 ULID. 26 chars, 48 bits timestamp + 80 bits random. */
export function ulid(): string {
  const ts = BigInt(Date.now());
  const rand = BigInt("0x" + cryptoBytesHex(10));
  let combined = (ts << 80n) | rand;
  let s = "";
  for (let i = 0; i < 26; i++) {
    s = ALPHABET[Number(combined & 0x1fn)] + s;
    combined >>= 5n;
  }
  return s;
}

function cryptoBytesHex(n: number): string {
  const buf = new Uint8Array(n);
  // Node always has globalThis.crypto in modern versions.
  globalThis.crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

export interface EnvelopeInput {
  kind: string;           // e.g. "gallery.run.uploaded"
  runId: string;
  payload?: unknown;
  parentId?: string;
  provenance?: Record<string, string | undefined>;
}

export interface Envelope {
  v: 1;
  id: string;
  ts: string;
  component: "gallery";
  kind: string;
  runId: string;
  parentId?: string;
  provenance?: Record<string, string>;
  payload?: unknown;
}

export function envelope(input: EnvelopeInput): Envelope {
  const out: Envelope = {
    v: 1,
    id: ulid(),
    ts: new Date().toISOString(),
    component: "gallery",
    kind: input.kind,
    runId: input.runId
  };
  if (input.parentId) out.parentId = input.parentId;
  if (input.provenance) {
    const p: Record<string, string> = {};
    for (const [k, v] of Object.entries(input.provenance)) {
      if (typeof v === "string") p[k] = v;
    }
    if (Object.keys(p).length) out.provenance = p;
  }
  if (input.payload !== undefined) out.payload = input.payload;
  return out;
}

export async function appendFamilyEvent(ev: Envelope): Promise<void> {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.appendFile(FAMILY_EVENTS_LOG, JSON.stringify(ev) + "\n", "utf-8");
}
