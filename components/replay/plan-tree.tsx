"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";

import { fileUrl } from "@/lib/client-paths";

interface Props {
  runId: string;
  files: string[];
}

interface PlanNode {
  id: string;
  role?: string;
  depends_on?: string[];
  [k: string]: unknown;
}

export function PlanTree({ runId, files }: Props) {
  const [plan, setPlan] = useState<PlanNode[] | null>(null);
  const [raw, setRaw] = useState<string | null>(null);

  useEffect(() => {
    const planFile = files.find((f) => /plan(\.json)?$/.test(f));
    if (!planFile) return;
    (async () => {
      const res = await fetch(fileUrl(runId, planFile));
      if (!res.ok) return;
      const text = await res.text();
      setRaw(text);
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) setPlan(parsed);
        else if (parsed && Array.isArray(parsed.iters)) setPlan(parsed.iters);
      } catch {
        /* fall back to raw */
      }
    })();
  }, [runId, files]);

  if (plan && plan.length) {
    return (
      <ol className="rounded-md border border-border bg-panel p-3 space-y-1 font-mono text-xs">
        {plan.map((node, i) => (
          <li key={node.id ?? i} className="flex gap-2">
            <span className="text-accent w-10">{node.id ?? `i-${i}`}</span>
            <span className="text-muted w-20 truncate">{node.role ?? "—"}</span>
            <span className="text-ink/70 truncate flex-1">
              {node.depends_on && node.depends_on.length > 0
                ? `deps: ${node.depends_on.join(", ")}`
                : "no deps"}
            </span>
          </li>
        ))}
      </ol>
    );
  }
  if (raw) {
    return (
      <pre className="rounded-md border border-border bg-panel p-3 font-mono text-xs text-ink/70 overflow-auto max-h-80">
        {raw.slice(0, 4000)}
      </pre>
    );
  }
  return (
    <div className="rounded-md border border-border bg-panel p-3 font-mono text-xs text-muted">
      no plan file in archive
    </div>
  );
}
