import { NextResponse } from "next/server";

import { loadManifest, readRunFile } from "@/lib/store";
import { buildPlanTemplate, toYaml } from "@/lib/fork";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Fork endpoint: serves a `.stoa-template.yaml` derived from the run's
 * manifest + plan. The downloaded file validates against Stoa's
 * plan-template schema (with the D-008 origin_run_id +
 * origin_share_url extensions) and can be fed into `ordo run
 * --template <file>` immediately.
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const manifest = await loadManifest(params.id);
  if (!manifest) {
    return NextResponse.json({ error: "run not found" }, { status: 404 });
  }

  let plan: unknown = undefined;
  const planBuf = await readRunFile(params.id, "plan.json");
  if (planBuf) {
    try {
      plan = JSON.parse(planBuf.toString("utf-8"));
    } catch {
      /* ignore; template still valid without plan */
    }
  }

  const template = buildPlanTemplate({ manifest, plan });
  const yamlBody = toYaml(template);
  const filename = `${(template.metadata as { id: string }).id}.stoa-template.yaml`;

  return new NextResponse(yamlBody, {
    headers: {
      "content-type": "application/yaml; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store"
    }
  });
}
