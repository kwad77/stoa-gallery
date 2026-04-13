import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gallery — Replay Ordo Runs",
  description:
    "Upload a .ordo-run archive, scrub through the plan tree, NDJSON event stream, diffs, and costs. Local-first; your data never leaves the machine."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-ink">
        <header className="border-b border-border">
          <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
            <Link href="/" className="font-mono text-lg tracking-tight">
              <span className="text-accent">stoa</span>
              <span className="text-muted"> / </span>
              <span>gallery</span>
            </Link>
            <nav className="text-sm text-muted flex gap-6">
              <Link href="/" className="hover:text-ink">Home</Link>
              <Link href="/featured" className="hover:text-ink">Featured</Link>
              <Link href="/compare" className="hover:text-ink">Compare</Link>
              <Link href="/upload" className="hover:text-ink">Upload</Link>
              <a
                href="https://github.com/kwad77/stoa/blob/main/docs/GALLERY-SPEC.md"
                className="hover:text-ink"
                target="_blank"
                rel="noreferrer"
              >
                Spec
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
        <footer className="border-t border-border mt-20">
          <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-muted font-mono">
            gallery v0.1.0-local · running against file-backed store
            <span className="mx-2">·</span>
            <a
              href="https://github.com/kwad77/stoa"
              className="hover:text-ink"
              target="_blank"
              rel="noreferrer"
            >
              part of the Stoa family
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
