import { subscribe, endRun } from "@/lib/live";
import type { LiveFrame } from "@/lib/live";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Subscribe endpoint for the live-event-stream slot.
 *
 * GET /api/live/<run-id>/stream with Accept: text/event-stream
 *
 * Server-Sent Events wire:
 *   event: frame
 *   data: {...ordo-events row...}
 *
 *   event: end
 *   data: {"reason":"done","ts":"..."}
 *
 * The replay of buffered frames happens first, then real-time frames
 * stream until the broker closes the run (on `done`/`run-finalized`
 * plus a 30s drain window).
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const runId = params.id;
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(runId)) {
    return new Response("invalid run id", { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Initial retry hint so clients reconnect reasonably.
      controller.enqueue(encoder.encode(`retry: 3000\n\n`));

      const { past, emitter, ended } = subscribe(runId);
      // Replay buffered frames first.
      for (const frame of past) {
        send("frame", frame.event);
      }
      if (ended) {
        send("end", { reason: "already-ended" });
        controller.close();
        return;
      }

      const onFrame = (frame: LiveFrame) => send("frame", frame.event);
      const onEnd = (payload: { reason: string; ts: string }) => {
        send("end", payload);
        try { controller.close(); } catch { /* already closed */ }
      };
      emitter.on("frame", onFrame);
      emitter.on("end", onEnd);

      // Keep-alive ping every 15s so proxies don't close the idle socket.
      const ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keep-alive ${Date.now()}\n\n`));
        } catch {
          clearInterval(ping);
        }
      }, 15000);

      // Clean up listeners when the consumer disconnects.
      // @ts-expect-error — closed signal is on the underlying controller in node
      controller.signal?.addEventListener?.("abort", () => {
        emitter.off("frame", onFrame);
        emitter.off("end", onEnd);
        clearInterval(ping);
      });
    }
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
      connection: "keep-alive"
    }
  });
}
