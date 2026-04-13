import { loadManifest } from "@/lib/store";

export const runtime = "nodejs";
export const contentType = "image/svg+xml";
export const size = { width: 1200, height: 630 };
export const alt = "Ordo run replay";

/**
 * Dynamic OG image for a run page. Rendered on demand when a social
 * platform hits /run/<id> and reads the <meta property="og:image">.
 * This is the tweet-worthy surface — every shared URL previews with
 * prompt, iter count, cost, and ordo version baked into a PNG.
 *
 * Runs on nodejs (not edge) so we can read the local filesystem for
 * the manifest. The tradeoff: ~200ms cold start vs edge's ~20ms;
 * acceptable for share traffic (cached by platforms anyway).
 */
/**
 * SVG-based OG image. @vercel/og's bundled font loader has a Windows
 * path bug (file:// URL construction that fails on drive letters), so
 * we emit an SVG with inline system fonts instead. Twitter/Slack/LinkedIn
 * all accept SVG as OG image; platforms cache it. On Linux we could
 * switch to ImageResponse + PNG later without changing the route shape.
 */
export default async function OpengraphImage({
  params
}: {
  params: { id: string };
}) {
  const manifest = await loadManifest(params.id);

  const prompt =
    (manifest?.prompt || "Ordo run").slice(0, 130) +
    ((manifest?.prompt?.length || 0) > 130 ? "…" : "");
  const iters = manifest?.iter_count ?? 0;
  const cost = manifest?.total_cost_usd ?? 0;
  const ordoVer = manifest?.ordo_version ?? "";

  const svg = renderSvg({
    prompt,
    iters: String(iters),
    cost: `$${cost.toFixed(4)}`,
    mode: iters > 0 ? "orchestra" : "run",
    ordoVer
  });

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=3600"
    }
  });
}

function renderSvg(v: {
  prompt: string;
  iters: string;
  cost: string;
  mode: string;
  ordoVer: string;
}): string {
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  // Word-wrap the prompt into up to 3 lines of ~56 chars.
  const words = v.prompt.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > 56 && cur) {
      lines.push(cur);
      cur = w;
      if (lines.length >= 3) break;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (lines.length < 3 && cur) lines.push(cur);
  const wrapped = lines.slice(0, 3);

  const promptTspans = wrapped
    .map((line, i) => {
      const y = 270 + i * 72;
      return `<text x="72" y="${y}" fill="#e9ecf3" font-size="60" font-weight="600" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif">${esc(line)}</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b0d12"/>
      <stop offset="100%" stop-color="#141827"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>

  <text x="72" y="108" fill="#8892a6" font-size="28" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">
    <tspan fill="#7aa2f7">stoa</tspan> / <tspan fill="#e9ecf3">gallery</tspan>
  </text>
  ${
    v.ordoVer
      ? `<g transform="translate(${1200 - 72 - 220}, 80)">
    <rect x="0" y="0" width="220" height="44" rx="8" fill="#12151d" stroke="#1f2433" stroke-width="1"/>
    <text x="110" y="30" fill="#bb9af7" font-size="22" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" text-anchor="middle">ordo ${esc(v.ordoVer)}</text>
  </g>`
      : ""
  }

  ${promptTspans}

  <g transform="translate(72, 530)">
    <text x="0" y="0" fill="#8892a6" font-size="22" letter-spacing="2" font-family="system-ui, sans-serif">ITERS</text>
    <text x="0" y="52" fill="#e9ecf3" font-size="52" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">${esc(v.iters)}</text>
  </g>
  <g transform="translate(260, 530)">
    <text x="0" y="0" fill="#8892a6" font-size="22" letter-spacing="2" font-family="system-ui, sans-serif">COST</text>
    <text x="0" y="52" fill="#e9ecf3" font-size="52" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">${esc(v.cost)}</text>
  </g>
  <g transform="translate(520, 530)">
    <text x="0" y="0" fill="#8892a6" font-size="22" letter-spacing="2" font-family="system-ui, sans-serif">MODE</text>
    <text x="0" y="52" fill="#bb9af7" font-size="52" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">${esc(v.mode)}</text>
  </g>

  <text x="${1200 - 72}" y="588" fill="#8892a6" font-size="22" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" text-anchor="end">scrub · fork · watch live</text>
</svg>`;
}
