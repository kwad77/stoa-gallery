import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs/promises";
import path from "node:path";

import { listRunFiles, loadManifest } from "@/lib/store";
import { PUBLIC_BASE_URL, RUNS_DIR, IS_STATIC, BASE_PATH } from "@/lib/paths";
import { ReplayClient } from "@/components/replay/replay-client";
import { ForkButton } from "@/components/replay/fork-button";

export const dynamic = IS_STATIC ? "force-static" : "force-dynamic";

/**
 * Enumerate run IDs at build time for `output: 'export'`. In dev mode
 * Next also calls this but pads with runtime-added runs.
 */
export async function generateStaticParams() {
  try {
    const entries = await fs.readdir(RUNS_DIR, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory())
      .map((e) => ({ id: e.name }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params
}: {
  params: { id: string };
}): Promise<Metadata> {
  const manifest = await loadManifest(params.id);
  if (!manifest) return { title: "Run not found" };
  const title = `${(manifest.prompt || "Ordo run").slice(0, 80)} — Gallery`;
  const description = `Replay an Ordo run: ${manifest.iter_count} iter${
    manifest.iter_count === 1 ? "" : "s"
  }, $${manifest.total_cost_usd.toFixed(4)}, ordo ${manifest.ordo_version}. Scrub through the orchestra timeline, plan tree, and diffs.`;
  const url = `${PUBLIC_BASE_URL}/run/${params.id}`;
  const ogImage = IS_STATIC
    ? `${BASE_PATH}/runs/${params.id}/og.svg`
    : `/run/${params.id}/opengraph-image`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "Gallery · Stoa",
      type: "article",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage]
    }
  };
}

export default async function RunPage({
  params
}: {
  params: { id: string };
}) {
  const manifest = await loadManifest(params.id);
  if (!manifest) notFound();
  const files = await listRunFiles(params.id);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-semibold tracking-tight">
            {manifest.prompt || manifest.run_id}
          </h1>
          <div className="flex items-center gap-3">
            <ForkButton runId={params.id} />
            <div className="text-xs font-mono text-muted">
              run <span className="text-accent">{manifest.run_id}</span>
            </div>
          </div>
        </div>
        <dl className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <Stat label="iters" value={String(manifest.iter_count)} />
          <Stat
            label="cost"
            value={`$${manifest.total_cost_usd.toFixed(4)}`}
          />
          <Stat label="ordo" value={manifest.ordo_version} />
          <Stat
            label="created"
            value={new Date(manifest.created_at).toLocaleString()}
          />
        </dl>
      </header>

      <ReplayClient runId={params.id} manifest={manifest} files={files} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-panel px-3 py-2">
      <div className="text-muted uppercase tracking-wider text-[10px]">
        {label}
      </div>
      <div className="text-ink mt-1 truncate">{value}</div>
    </div>
  );
}
