import { NextResponse } from "next/server";

import { publishFrame } from "@/lib/live";
import type { OrdoEvent } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Publish endpoint for the live-event-stream slot.
 *
 * Producers (ordo gallery share --live) POST one or more NDJSON rows
 * to /api/live/<run-id>/publish. Each line is parsed and broadcast to
 * all SSE subscribers of that run-id.
 *
 * content-type: application/x-ndjson (or application/json for a single
 * event or a JSON array).
 *
 * Auth: v0.1 is open (the share surface may front this with a reverse
 * proxy that validates bearer tokens). v0.2 will standardize via SCP.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const runId = params.id;
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(runId)) {
    return NextResponse.json({ error: "invalid run id" }, { status: 400 });
  }

  const ct = req.headers.get("content-type") || "";
  const body = await req.text();
  let rows: unknown[] = [];
  try {
    if (ct.includes("ndjson") || body.trim().includes("\n")) {
      rows = body
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => JSON.parse(l));
    } else if (body.trim().startsWith("[")) {
      rows = JSON.parse(body) as unknown[];
    } else if (body.trim()) {
      rows = [JSON.parse(body)];
    }
  } catch (err) {
    return NextResponse.json(
      { error: `bad body: ${err instanceof Error ? err.message : String(err)}` },
      { status: 400 }
    );
  }

  let published = 0;
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    publishFrame(runId, row as OrdoEvent);
    published++;
  }
  return NextResponse.json({ published });
}
