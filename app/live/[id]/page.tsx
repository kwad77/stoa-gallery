import { LiveReplayClient } from "@/components/live/live-replay-client";

export const dynamic = "force-dynamic";

/**
 * Live-watch surface for an in-progress run. Same UX as /run/[id]
 * (plan tree, orchestra lane, timeline, scrubber) but:
 *   - events stream in via SSE instead of loading from events.ndjson
 *   - a LIVE badge pulses until the broker emits `end`
 *   - the cursor auto-advances, scrub nukes "follow live" like YouTube
 *
 * No manifest loaded server-side — we don't know the final cost yet.
 * The client infers what it can from the event stream.
 */
export default function LivePage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-semibold tracking-tight">
            Live replay
          </h1>
          <div className="font-mono text-xs text-muted">
            run <span className="text-accent">{params.id}</span>
          </div>
        </div>
        <p className="text-sm text-muted mt-2 max-w-2xl">
          Subscribing to <code className="font-mono">/api/live/{params.id}/stream</code>.
          Frames appear as the producer emits them. Scrub to rewind; click{" "}
          <strong>Follow live</strong> to re-attach to the head.
        </p>
      </header>

      <LiveReplayClient runId={params.id} />
    </div>
  );
}
