import { listRuns } from "@/lib/store";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const runs = await listRuns();

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">
          Replay an Ordo run
        </h1>
        <p className="mt-3 text-muted max-w-2xl">
          Upload a <code className="font-mono text-accent">.ordo-run</code>{" "}
          archive and scrub through the plan tree, NDJSON event stream,
          per-file diffs, and cost total. Everything lives in{" "}
          <code className="font-mono">./.runs</code> on this machine — no
          cloud, no auth, no outbound calls.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/upload"
            className="inline-flex items-center rounded-md border border-accent bg-accent/10 px-4 py-2 text-sm text-accent hover:bg-accent/20"
          >
            Upload a .ordo-run
          </Link>
          <a
            href="https://github.com/kwad77/stoa/blob/main/docs/GALLERY-SPEC.md"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm text-muted hover:text-ink hover:border-ink"
          >
            Read the spec
          </a>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-mono tracking-tight mb-3">
          <span className="text-muted">$</span> ls .runs/
        </h2>
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
