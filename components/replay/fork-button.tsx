"use client";

export function ForkButton({ runId }: { runId: string }) {
  return (
    <a
      href={`/api/runs/${runId}/fork`}
      className="inline-flex items-center rounded-md border border-iter bg-iter/10 px-3 py-1.5 text-xs text-iter hover:bg-iter/20 font-mono"
      download
      title="Download a .stoa-template.yaml forked from this run"
    >
      ⑂ Fork
    </a>
  );
}
