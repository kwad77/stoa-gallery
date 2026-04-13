import Link from "next/link";
import fs from "node:fs/promises";
import path from "node:path";

import { REPO_ROOT } from "@/lib/paths";

interface FeaturedEntry {
  runId: string;
  title: string;
  blurb: string;
  tags: string[];
  featured_on?: string;
  curator?: string;
}

export const metadata = {
  title: "Featured runs — Gallery",
  description:
    "Hand-curated Ordo runs worth watching. Every entry is a scrub-able replay with a one-click fork."
};

export const dynamic = "force-dynamic";

async function loadFeatured(): Promise<FeaturedEntry[]> {
  try {
    const raw = await fs.readFile(
      path.join(REPO_ROOT, "content", "featured.json"),
      "utf-8"
    );
    const parsed = JSON.parse(raw) as { runs: FeaturedEntry[] };
    return parsed.runs ?? [];
  } catch {
    return [];
  }
}

export default async function FeaturedPage() {
  const entries = await loadFeatured();
  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">Featured runs</h1>
        <p className="mt-3 text-muted max-w-2xl">
          Hand-curated runs that show what orchestra mode can do. Each is a
          real replay you can scrub, fork, and run in your own repo. Good
          starting point if "give me a prompt template for X" is what
          brought you here.
        </p>
      </section>

      {entries.length === 0 ? (
        <div className="rounded-md border border-border bg-panel p-6 text-sm text-muted">
          No featured runs yet. Run{" "}
          <code className="font-mono text-accent">pnpm seed:demo</code> or
          upload one via <code className="font-mono text-accent">/upload</code>.
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {entries.map((e) => (
            <li
              key={e.runId}
              className="rounded-md border border-border bg-panel p-5 space-y-2 hover:border-accent transition"
            >
              <div className="flex items-baseline gap-3">
                <Link
                  href={`/run/${e.runId}`}
                  className="font-semibold tracking-tight hover:text-accent"
                >
                  {e.title}
                </Link>
                <span className="ml-auto text-[10px] uppercase tracking-wider text-muted font-mono">
                  {e.featured_on ?? ""}
                </span>
              </div>
              <p className="text-sm text-muted">{e.blurb}</p>
              <div className="flex flex-wrap gap-1 pt-1">
                {e.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-mono rounded border border-border px-1.5 py-0.5 text-muted"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex gap-3 pt-2 text-xs font-mono">
                <Link href={`/run/${e.runId}`} className="text-accent hover:underline">
                  watch
                </Link>
                <a
                  href={`/api/runs/${e.runId}/fork`}
                  download
                  className="text-iter hover:underline"
                >
                  fork
                </a>
                <Link href={`/live/${e.runId}`} className="text-warn hover:underline">
                  live
                </Link>
                {e.curator && (
                  <span className="ml-auto text-muted">
                    curated by {e.curator}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
