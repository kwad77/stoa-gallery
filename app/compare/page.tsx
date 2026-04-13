import Link from "next/link";

import { listRuns } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Compare runs — Gallery",
  description:
    "Which model / prompt / roster is better on this task? Drop two runs, get a side-by-side orchestra view with cost and time delta."
};

export default async function ComparePage() {
  const runs = await listRuns();
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">
          Compare two runs
        </h1>
        <p className="mt-3 text-muted max-w-2xl">
          Which model is better on this task? Which prompt got fewer iters?
          Which planner budget was worth the spend? Paste two run IDs,
          get a side-by-side orchestra view with cost and time delta.
          Empirical answers for the "which LLM" question, with a URL.
        </p>
      </section>
      <section className="rounded-md border border-border bg-panel p-5">
        <h2 className="text-sm font-mono text-muted uppercase tracking-wider mb-3">
          Pick two runs
        </h2>
        {runs.length < 2 ? (
          <p className="text-muted text-sm">
            Need at least two runs. Try{" "}
            <code className="font-mono text-accent">npm run seed:all</code>.
          </p>
        ) : (
          <form action="/compare/go" className="flex flex-wrap gap-3 items-end">
            <Picker name="a" runs={runs} label="Run A" />
            <span className="text-muted text-xl mb-2">↔</span>
            <Picker name="b" runs={runs} label="Run B" />
            <button
              formAction={runs.length >= 2 ? undefined : undefined}
              className="ml-auto rounded-md border border-accent bg-accent/10 px-4 py-2 text-sm text-accent hover:bg-accent/20"
            >
              Compare →
            </button>
          </form>
        )}
      </section>

      <section className="text-xs text-muted font-mono leading-relaxed">
        Shortcut: hit{" "}
        <code className="text-accent">/compare/&lt;runA&gt;/&lt;runB&gt;</code>{" "}
        directly. Tweetable. Dev-loggable.
      </section>

      {runs.length >= 2 && (
        <section>
          <h2 className="text-sm font-mono text-muted uppercase tracking-wider mb-3">
            Suggested pairs
          </h2>
          <ul className="space-y-2">
            {pairs(runs.slice(0, 4)).map(([a, b]) => (
              <li key={`${a.runId}-${b.runId}`}>
                <Link
                  href={`/compare/${a.runId}/${b.runId}`}
                  className="inline-flex items-center gap-3 rounded-md border border-border bg-panel px-3 py-2 text-xs font-mono hover:border-accent"
                >
                  <span className="text-accent truncate max-w-[220px]">
                    {a.prompt || a.runId.slice(0, 12)}
                  </span>
                  <span className="text-muted">↔</span>
                  <span className="text-iter truncate max-w-[220px]">
                    {b.prompt || b.runId.slice(0, 12)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Picker({
  name,
  runs,
  label
}: {
  name: string;
  runs: Awaited<ReturnType<typeof listRuns>>;
  label: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-mono text-muted">
      {label}
      <select
        name={name}
        defaultValue={runs[name === "a" ? 0 : 1]?.runId}
        className="rounded-md border border-border bg-bg px-3 py-2 text-sm text-ink min-w-[280px]"
      >
        {runs.map((r) => (
          <option key={r.runId} value={r.runId}>
            {(r.prompt || r.runId).slice(0, 80)}
          </option>
        ))}
      </select>
    </label>
  );
}

function pairs<T>(arr: T[]): [T, T][] {
  const out: [T, T][] = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      out.push([arr[i], arr[j]]);
    }
  }
  return out.slice(0, 6);
}
