import { notFound } from "next/navigation";

import { listRunFiles, loadManifest } from "@/lib/store";
import { ReplayClient } from "@/components/replay/replay-client";

export const dynamic = "force-dynamic";

/**
 * Embed mode — no global chrome, minimal header, intended for iframe
 * drop-ins in blog posts. Consumers just need:
 *
 *   <iframe
 *     src="https://stoa-gallery.fly.dev/embed/01K..."
 *     style="width:100%;height:640px;border:0"
 *     allow="clipboard-write"
 *   />
 */
export const metadata = {
  robots: { index: false } // embeds shouldn't appear as canonical pages
};

export default async function EmbedPage({
  params
}: {
  params: { id: string };
}) {
  const manifest = await loadManifest(params.id);
  if (!manifest) notFound();
  const files = await listRunFiles(params.id);

  return (
    <div className="space-y-4">
      <header className="flex items-baseline justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="font-semibold tracking-tight truncate">
            {manifest.prompt || manifest.run_id}
          </div>
          <div className="text-[11px] font-mono text-muted">
            {manifest.iter_count} iter{manifest.iter_count === 1 ? "" : "s"} ·
            {" "}${manifest.total_cost_usd.toFixed(4)} · ordo {manifest.ordo_version}
          </div>
        </div>
        <a
          href={`/run/${params.id}`}
          target="_parent"
          className="text-[11px] font-mono rounded border border-accent/40 bg-accent/10 px-2 py-1 text-accent hover:bg-accent/20"
        >
          open full
        </a>
      </header>
      <ReplayClient runId={params.id} manifest={manifest} files={files} />
    </div>
  );
}
