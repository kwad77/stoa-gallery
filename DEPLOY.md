# Deploying Gallery

Two paths. The first is the intended one.

## Fly.io (recommended — single command)

**Why Fly:** cheapest persistent volume + simplest zero-config SSR runtime. `fly.toml` in this repo is ready.

```bash
# One-time setup (5 minutes)
brew install flyctl           # or winget install fly.io.fly
fly auth login

# In this directory
fly launch --copy-config --name stoa-gallery --no-deploy
fly volumes create gallery_data --size 3 --region iad
fly secrets set GALLERY_PUBLIC_URL=https://stoa-gallery.fly.dev
fly deploy

# Gallery is now live at https://stoa-gallery.fly.dev
```

Cost: ~$2/mo for the shared-cpu-1x + 3 GB volume. Scales to zero when idle.

## Docker / self-host

```bash
docker build -t stoa-gallery .
docker run --rm -p 3000:3000 \
  -e GALLERY_DATA_DIR=/data \
  -e GALLERY_PUBLIC_URL=http://localhost:3000 \
  -v gallery_data:/data \
  stoa-gallery
```

## Configuration

| Env | Default | Purpose |
|---|---|---|
| `GALLERY_DATA_DIR` | `process.cwd()` | Where `.runs/` and `evidence/` live. Set to a mounted volume in prod. |
| `GALLERY_PUBLIC_URL` | `http://localhost:3000` | Baked into OG tags, fork breadcrumbs, live URLs. Must match the external URL. |
| `PORT` | `3000` | Node.js server port. |

## Smoke test after deploy

```bash
# Describe handshake (SCP check 4)
curl https://stoa-gallery.fly.dev/api/stoa/describe | jq .runtime

# Upload demo archive from a dev machine
cd stoa && bash tooling/stoa-gallery-smoke.sh https://stoa-gallery.fly.dev

# Expected: replay URL, fork URL, OG image all 200.
```

## Post-deploy: wire `ordo gallery share --to`

On your dev machine:

```bash
export ORDO_GALLERY_URL=https://stoa-gallery.fly.dev
ordo run "add gzip to /api/events"
ordo gallery share $(ordo ls --latest --json | jq -r .run_id)
# https://stoa-gallery.fly.dev/run/01K...
```

And Atrium's Settings → Gallery URL → paste, then every finished run exposes "Share this run" → copy link → tweet.

## Scaling notes

- The SSE live broker is **single-process**. If you scale to >1 machine:
  - Easy: pin publishers and subscribers to the same region via Fly region stickiness.
  - Better: swap `lib/live.ts` for Upstash Redis Pub/Sub (10-line change; the broker interface is small on purpose).
- The SQLite/flat-file store fits on a single volume. If you outgrow it, swap `lib/store.ts` for a Supabase or Neon Postgres adapter. `GALLERY_STORE=supabase` env gate is ready.
- OG images are computed per request and cached for 1h at `s-maxage`. If traffic spikes, add a Fly edge cache (a couple lines in `fly.toml`).

## Rollback

```bash
fly releases
fly releases rollback <version>
# or
fly deploy --image <previous-image-sha>
```

Volume contents survive rollbacks.
