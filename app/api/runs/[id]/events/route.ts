import { NextResponse } from "next/server";

import { readRunFile } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const buf = await readRunFile(params.id, "events.ndjson");
  if (!buf) {
    return NextResponse.json(
      { error: `no events.ndjson in run ${params.id}` },
      { status: 404 }
    );
  }
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
