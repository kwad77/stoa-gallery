"use client";

import { useState } from "react";
import clsx from "clsx";

interface Props {
  runId: string;
  files: string[];
}

export function DiffPanel({ runId, files }: Props) {
  const diffs = files.filter(
    (f) => f.endsWith(".diff") || f.endsWith(".patch")
  );

  if (diffs.length === 0) {
    return (
      <div className="rounded-md border border-border bg-panel p-3 font-mono text-xs text-muted">
        no diffs in this archive
      </div>
    );
  }

  return (
    <ul className="rounded-md border border-border bg-panel divide-y divide-border">
      {diffs.map((path) => (
        <DiffRow key={path} runId={runId} path={path} />
      ))}
    </ul>
  );
}

function DiffRow({ runId, path }: { runId: string; path: string }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState<string | null>(null);

  async function toggle() {
    if (!open && body === null) {
      const res = await fetch(`/api/runs/${runId}/file?p=${encodeURIComponent(path)}`);
      setBody(res.ok ? await res.text() : `error: ${res.status}`);
    }
    setOpen(!open);
  }

  return (
    <li>
      <button
        onClick={toggle}
        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-border/30 font-mono text-xs"
      >
        <span className="text-muted w-4">{open ? "▾" : "▸"}</span>
        <span className="text-accent flex-1 truncate text-left">{path}</span>
      </button>
      {open && (
        <pre className="px-3 pb-3 font-mono text-[11px] leading-tight overflow-auto max-h-[420px] whitespace-pre">
          {(body ?? "").split("\n").map((line, i) => (
            <div
              key={i}
              className={clsx(
                line.startsWith("+") && !line.startsWith("+++")
                  ? "text-ok bg-ok/5"
                  : line.startsWith("-") && !line.startsWith("---")
                  ? "text-err bg-err/5"
                  : line.startsWith("@@")
                  ? "text-iter"
                  : "text-ink/70"
              )}
            >
              {line || "\u00a0"}
            </div>
          ))}
        </pre>
      )}
    </li>
  );
}
