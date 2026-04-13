# Gallery

> **Status: v0.1.0-local** — third SCP family component. Third real app after Ordo and Atrium. Local-first; no cloud dependencies.

**Upload a `.ordo-run` archive. Get a URL. The URL plays back the run — plan tree, NDJSON event timeline with scrub controls, per-file diffs, cost total.** Everything lives in `./.runs` on your machine.

*Part of the [Stoa family](https://github.com/kwad77/stoa). Plays back runs produced by [Ordo](https://github.com/kwad77/ordo). Full spec at [`../stoa/docs/GALLERY-SPEC.md`](../stoa/docs/GALLERY-SPEC.md).*

---

## Why this exists

Two components designed alongside SCP (Ordo + Atrium) are not the same as SCP being tested by an arbitrary consumer. Gallery is the **forcing function** for that test — the first family app that only knows the contract, not the contract's designers.

## What it does today

- **Home page** lists runs under `.runs/`.
- **Upload endpoint** (`/api/upload`) accepts a `.ordo-run` / `.zip` multipart, unzips in-memory, validates `manifest.json` against the vendored `ordo-run-archive` schema, and persists under `.runs/<run-id>/`.
- **Replay page** (`/run/[id]`) renders:
  - **Orchestra lane** — one row per iter showing spawned → running → merged state against the event cursor. Conflict state surfaces in red. Driven by the new `iter-spawned` / `iter-merged` / `merge-conflict` / `run-finalized` event kinds from ordo's Terminal Orchestra pivot.
  - **Plan tree** — iter IDs, roles, `depends_on` edges.
  - **Event timeline** — NDJSON rows with play / pause / step / scrub.
  - **Diff panel** — collapsed per-file diffs with +/- coloring.
- **Describe handshake** via `node scripts/stoa-describe.mjs` — returns the SCP `ComponentDescription` shape. Also reachable at `GET /api/stoa/describe` for runtime peer discovery.
- **Family-events log** — every upload appends a `gallery.run.uploaded` envelope to `evidence/family-events.ndjson`. Verifiable with `stoa probe --events-file <path>`.

## One-command local boot

```bash
npm install
npm run seed:demo        # drops a bundled orchestra-mode demo into .runs/
npm run dev              # http://localhost:3000
# open /run/01KGALLERYDEMO00000000ORDO
```

## SCP conformance

This repo passes `stoa verify` fully — including the live handshake. Registered in the family's `family.yaml` via `stoa add`.

```bash
# From the stoa repo:
python ../stoa/dist/stoa.pyz verify ../gallery
# Check 1: manifest.schema      OK
# Check 2: slots.consumes       OK  (ordo-run-archive, handoff-store)
# Check 3: slots.produces       OK  (family-events, ui-surface)
# Check 4: handshake            OK  (node scripts/stoa-describe.mjs, ~47ms)
# PASS
```

The `handoff-store` slot was promoted from draft to registered v0.1 in Stoa under [D-007](https://github.com/kwad77/stoa/blob/main/docs/DECISIONS.md) on 2026-04-13. Gallery is its first declared consumer; Ordo's pilot (`ORDO_HANDOFF_STORE=1`) is the first producer.

## Architecture (v0.1.0-local)

```
gallery/
├── app/
│   ├── layout.tsx              dark Stoa-family shell
│   ├── page.tsx                home — list of runs in .runs/
│   ├── upload/page.tsx         drag-and-drop-able upload UI
│   ├── run/[id]/page.tsx       replay shell (RSC)
│   └── api/
│       ├── upload/route.ts             multipart -> unzip -> validate -> persist
│       ├── runs/[id]/events/route.ts   NDJSON stream for the timeline
│       ├── runs/[id]/file/route.ts     safe path-scoped file read (plan, diffs)
│       └── stoa/describe/route.ts      runtime handshake surface
├── components/replay/
│   ├── replay-client.tsx       orchestrates cursor + playing state
│   ├── scrubber.tsx            play / pause / step / range
│   ├── timeline.tsx            NDJSON rows, orchestra kinds colored
│   ├── orchestra-lane.tsx      iter lifecycle bars against cursor
│   ├── plan-tree.tsx           iters + deps from plan.json
│   └── diff-panel.tsx          collapsed per-file +/- diff viewer
├── lib/
│   ├── archive.ts              JSZip unpack + persistRun (atomic rename)
│   ├── schema.ts               Ajv validator over vendored ordo-run-archive
│   ├── store.ts                filesystem-backed run lookup + listing
│   ├── events.ts               OrdoEvent types + NDJSON parser
│   ├── envelope.ts             SCP envelope emitter + ULIDs
│   └── paths.ts                repo-root-anchored constants
├── scripts/
│   ├── stoa-describe.mjs       SCP handshake entry point
│   └── seed-demo-run.mjs       write demo .ordo-run/ tree into .runs
├── contracts/                  vendored by `stoa bundle-contracts`
│   ├── ordo-run-archive/
│   └── handoff-store/
├── stoa.component.yaml         canonical SCP manifest
└── STOA.md                     onboarding stub from `stoa init-component`
```

## What's not here yet

v0.1.0-local focuses on the proof. Intentionally out of scope tonight:

- **Cloud storage / Supabase adapter** — scaffold-grade stubs; env-gated via `GALLERY_STORE`.
- **GitHub OAuth** — not needed for local; add when publishing shares.
- **Vercel deploy** — a deployment target is a Kevin decision, not a 3 AM decision.
- **Embedded xterm.js** for orchestra iters — matches the GALLERY-SPEC v0.3 out-of-scope.
- **Search / tags / feeds** — v0.2 concern; Gallery explicitly ships narrow first.

## Scripts

| Script | Does |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Prod build |
| `npm run start` | Serve the prod build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run stoa:describe` | Runs the handshake locally |
| `npm run stoa:verify` | Full `stoa verify .` via the bundled zipapp |
| `npm run stoa:bundle` | Re-vendor consumed slot schemas |
| `npm run seed:demo` | Drop a synthetic orchestra-mode demo run into `.runs/` |

## License

MIT. Matching the rest of the family.
