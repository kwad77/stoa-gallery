import { notFound } from "next/navigation";
import fs from "node:fs/promises";

import { loadManifest, readRunFile } from "@/lib/store";
import { IS_STATIC, RUNS_DIR } from "@/lib/paths";
import { parseNdjson, type OrdoEvent } from "@/lib/events";
import { CompareView } from "@/components/compare/compare-view";

export const dynamic = IS_STATIC ? "force-static" : "force-dynamic";

export async function generateStaticParams() {
  try {
    const entries = await fs.readdir(RUNS_DIR, { withFileTypes: true });
    const ids = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    const out: { a: string; b: string }[] = [];
    for (const a of ids) for (const b of ids) if (a !== b) out.push({ a, b });
    return out;
  } catch {
    return [];
  }
}

export default async function ComparePairPage({
  params
}: {
  params: { a: string; b: string };
}) {
  const [ma, mb] = await Promise.all([loadManifest(params.a), loadManifest(params.b)]);
  if (!ma || !mb) notFound();
  const [ea, eb] = await Promise.all([
    readRunFile(params.a, "events.ndjson"),
    readRunFile(params.b, "events.ndjson")
  ]);
  const eventsA: OrdoEvent[] = ea ? parseNdjson(ea.toString("utf-8")) : [];
  const eventsB: OrdoEvent[] = eb ? parseNdjson(eb.toString("utf-8")) : [];

  const costDelta = mb.total_cost_usd - ma.total_cost_usd;
  const iterDelta = mb.iter_count - ma.iter_count;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Run A <span className="text-muted">↔</span> Run B
        </h1>
        <p className="mt-2 text-sm text-muted max-w-3xl">
          Side-by-side orchestra view. Lane bars share a common time
          axis so you can see at a glance which run spent more time on
          which role. Cost delta shown below — positive means B cost
          more than A.
        </p>
      </header>

      <section className="grid sm:grid-cols-4 gap-3 text-xs font-mono">
        <DeltaCard label="COST Δ" value={`${costDelta >= 0 ? "+" : ""}$${costDelta.toFixed(4)}`} good={costDelta <= 0} />
        <DeltaCard label="ITERS Δ" value={`${iterDelta >= 0 ? "+" : ""}${iterDelta}`} good={iterDelta <= 0} />
        <DeltaCard label="A" value={`${ma.iter_count} · $${ma.total_cost_usd.toFixed(4)}`} good />
        <DeltaCard label="B" value={`${mb.iter_count} · $${mb.total_cost_usd.toFixed(4)}`} good />
      </section>

      <CompareView a={{ manifest: ma, events: eventsA }} b={{ manifest: mb, events: eventsB }} />
    </div>
  );
}

function DeltaCard({
  label,
  value,
  good
}: {
  label: string;
  value: string;
  good: boolean;
}) {
  return (
    <div
      className={`rounded-md border px-3 py-2 ${
        good
          ? "border-ok/30 bg-ok/5 text-ok"
          : "border-warn/30 bg-warn/5 text-warn"
      }`}
    >
      <div className="uppercase tracking-wider text-[10px] opacity-70">{label}</div>
      <div className="mt-1">{value}</div>
    </div>
  );
}
