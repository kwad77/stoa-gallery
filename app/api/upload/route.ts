import { NextResponse } from "next/server";

import { ensureRunsDir, persistRun, unpackArchive } from "@/lib/archive";
import { appendFamilyEvent, envelope } from "@/lib/envelope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB local-dev cap

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("archive");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "missing 'archive' field (expected multipart file)" },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `archive exceeds local cap of ${MAX_SIZE_BYTES} bytes` },
        { status: 413 }
      );
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const unpacked = await unpackArchive(buf);

    await ensureRunsDir();
    const dir = await persistRun(unpacked);

    const ev = envelope({
      kind: "gallery.run.uploaded",
      runId: unpacked.runId,
      provenance: { agent: "gallery-upload-route" },
      payload: {
        bytes: buf.length,
        iter_count: unpacked.manifest.iter_count,
        ordo_version: unpacked.manifest.ordo_version,
        source_filename: file.name,
        visibility: "local"
      }
    });
    await appendFamilyEvent(ev);

    return NextResponse.json({
      runId: unpacked.runId,
      bytes: buf.length,
      path: dir,
      replayUrl: `/run/${unpacked.runId}`
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
