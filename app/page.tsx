import { listRuns } from "@/lib/store";
import Link from "next/link";

import { HeroAnimation } from "@/components/landing/hero-animation";
import { IS_STATIC } from "@/lib/paths";

export const dynamic = IS_STATIC ? "force-static" : "force-dynamic";

export default async function Home() {
  const runs = await listRuns();

  return (
    <div className="space-y-16">
      <section className="grid md:grid-cols-[1.1fr_1fr] gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-iter/40 bg-iter/5 px-3 py-1 text-[10px] font-mono text-iter uppercase tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full bg-iter animate-pulse" />
            New · Live SSE · Fork · OG
          </div>
          <h1 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">
            Every AI coding run
            <br />
            <span className="text-accent">should be a URL.</span>
          </h1>
          <p className="mt-4 text-muted max-w-xl text-[15px] leading-relaxed">
            Upload an{" "}
            <code className="font-mono text-accent">.ordo-run</code> archive,
            get a scrubbable replay — plan tree, orchestra timeline, diffs,
            cost. Live mode streams while the run is happening. Every run
            ships with a <strong className="text-ink">Fork</strong> button
            that turns it into a reusable plan template.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/run/01KTHENIGHTWEBUILTGALLERY"
              className="inline-flex items-center gap-2 rounded-md border border-accent bg-accent/15 px-4 py-2.5 text-sm text-accent hover:bg-accent/25"
            >
              ▶ Watch Gallery replay its own birth
            </Link>
            <Link
              href="/featured"
              className="inline-flex items-center rounded-md border border-border px-4 py-2.5 text-sm text-muted hover:text-ink hover:border-ink"
            >
              Featured runs
            </Link>
            <Link
              href="/upload"
              className="inline-flex items-center rounded-md border border-border px-4 py-2.5 text-sm text-muted hover:text-ink hover:border-ink"
            >
              Upload yours
            </Link>
          </div>
          <div className="mt-6 text-[11px] font-mono text-muted">
            Part of the <span className="text-accent">Stoa</span> family ·{" "}
            <a
              href="https://github.com/kwad77/stoa/blob/main/docs/GALLERY-SPEC.md"
              target="_blank"
              rel="noreferrer"
              className="hover:text-ink"
            >
              GALLERY-SPEC
            </a>{" "}
            · SCP v1
          </div>
        </div>
        <div className="rounded-lg border border-border bg-panel p-4 shadow-[0_0_0_1px_rgba(122,162,247,0.1)]">
          <HeroAnimation />
          <div className="mt-3 text-[11px] font-mono text-muted flex justify-between">
            <span>orchestra / live preview</span>
            <span>loops every 10s</span>
          </div>
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-4">
        <FeatureCard
          title="Share"
          subtitle="ordo gallery share"
          body="One command on your machine turns a finished run into a public URL with a dynamic OG image. Tweet it."
          href="/featured"
        />
        <FeatureCard
          title="Live"
          subtitle="/live/[id]"
          body="SSE stream while the run is happening. Orchestra lane fills in frame by frame. Follow-live pins to the head like YouTube."
          href="/run/01KTHENIGHTWEBUILTGALLERY"
        />
        <FeatureCard
          title="Fork"
          subtitle="/api/runs/[id]/fork"
          body="Every run's prompt + planner model + roster overlay exports as a stoa-validate-clean .stoa-template.yaml. ordo run --template ./that.yaml in your repo."
          href="/featured"
        />
      </section>

      <section>
        <h2 className="text-lg font-mono tracking-tight mb-3">
          <span className="text-muted">$</span> ls .runs/
        </h2>
        <p className="text-xs text-muted mb-4 font-mono">
          tip: run <code className="text-accent">npm run seed:all</code> to drop demo + featured + ouroboros fixtures.
        </p>
        {runs.length === 0 ? (
          <div className="rounded-md border border-border bg-panel p-6 text-sm text-muted">
            No runs yet. Upload one above, or run{" "}
            <code className="font-mono text-accent">pnpm seed:demo</code> to
            drop the bundled orchestra-mode demo into <code>./.runs</code>.
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border bg-panel">
            {runs.map((r) => (
              <li key={r.runId}>
                <Link
                  href={`/run/${r.runId}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-border/40"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-sm truncate">
                      {r.prompt || r.runId}
                    </div>
                    <div className="text-xs text-muted mt-1 flex gap-3">
                      <span>{r.runId}</span>
                      <span>·</span>
                      <span>{r.iterCount} iters</span>
                      <span>·</span>
                      <span>${r.totalCostUsd.toFixed(4)}</span>
                      <span>·</span>
                      <span>{new Date(r.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <span className="text-muted font-mono text-xs">→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function FeatureCard({
  title,
  subtitle,
  body,
  href
}: {
  title: string;
  subtitle: string;
  body: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-md border border-border bg-panel p-5 hover:border-accent transition"
    >
      <div className="flex items-baseline gap-3">
        <span className="text-ink font-semibold tracking-tight">{title}</span>
        <code className="text-[11px] text-muted font-mono">{subtitle}</code>
      </div>
      <p className="mt-2 text-sm text-muted leading-relaxed">{body}</p>
      <div className="mt-3 text-xs font-mono text-accent opacity-0 group-hover:opacity-100 transition">
        try it →
      </div>
    </Link>
  );
}
