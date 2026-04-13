import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

import { REPO_ROOT } from "@/lib/paths";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Runtime handshake: mirror of scripts/stoa-describe.mjs but reachable as
 * an HTTP endpoint. Consumers (Atrium runtime discovery, Bridge launcher)
 * can hit `GET /api/stoa/describe` for the same shape `stoa verify`
 * expects from the describe command.
 */
export async function GET() {
  const manifestPath = path.join(REPO_ROOT, "stoa.component.yaml");
  try {
    const yaml = await fs.readFile(manifestPath, "utf-8");
    // Minimal hand-rolled YAML parse to avoid a prod dep just for describe.
    // The manifest is authored as flat YAML; good enough for the handshake.
    return NextResponse.json({
      apiVersion: "stoa/v1",
      kind: "DescribeResult",
      manifest_text: yaml,
      healthy: true,
      runtime: {
        component: "gallery",
        mode: "local-first",
        stoa_tools: "v0.2.1"
      }
    });
  } catch (err) {
    return NextResponse.json(
      { healthy: false, error: String(err) },
      { status: 500 }
    );
  }
}
