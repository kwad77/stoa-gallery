import { NextResponse } from "next/server";

import { readRunFile } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const url = new URL(req.url);
  const p = url.searchParams.get("p");
  if (!p) {
    return NextResponse.json({ error: "missing ?p=" }, { status: 400 });
  }
  try {
    const buf = await readRunFile(params.id, p);
    if (!buf) return new NextResponse("not found", { status: 404 });
    const ct = p.endsWith(".json")
      ? "application/json"
      : p.endsWith(".md")
      ? "text/markdown; charset=utf-8"
      : p.endsWith(".ndjson")
      ? "application/x-ndjson; charset=utf-8"
      : "text/plain; charset=utf-8";
    return new NextResponse(new Uint8Array(buf), {
      headers: { "content-type": ct, "cache-control": "no-store" }
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }
}
