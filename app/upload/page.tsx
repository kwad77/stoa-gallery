"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.append("archive", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || `upload failed (${res.status})`);
        setBusy(false);
        return;
      }
      router.push(`/run/${body.runId}`);
    } catch (err) {
      setError(String(err));
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Upload a .ordo-run archive
        </h1>
        <p className="mt-2 text-sm text-muted">
          The archive is unzipped, its manifest validated against the
          vendored <code className="font-mono">ordo-run-archive</code> schema,
          then stored under{" "}
          <code className="font-mono text-accent">./.runs/&lt;run-id&gt;/</code>.
          Nothing leaves this machine.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="rounded-md border border-border bg-panel p-6 space-y-4"
      >
        <label className="block text-sm text-muted">
          archive (.ordo-run / .zip)
          <input
            type="file"
            accept=".ordo-run,.zip,application/zip"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            disabled={busy}
            className="mt-2 block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-accent/20 file:px-4 file:py-2 file:text-accent file:hover:bg-accent/30 disabled:opacity-50"
          />
        </label>
        {error && (
          <div className="text-sm text-err border border-err/30 bg-err/10 rounded px-3 py-2 font-mono">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={!file || busy}
          className="rounded-md border border-accent bg-accent/10 px-4 py-2 text-sm text-accent hover:bg-accent/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy ? "uploading…" : "Upload"}
        </button>
      </form>

      <div className="text-xs text-muted font-mono">
        tip: <code>pnpm seed:demo</code> seeds a bundled demo archive if
        you don't have one handy.
      </div>
    </div>
  );
}
