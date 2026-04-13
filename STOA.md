# Stoa component: gallery

This directory is a Stoa family component, scaffolded by `stoa init-component`.
See `../stoa/docs/SCP.md` for the protocol this component implements.

## Declared integration surface

- Slots consumed: ordo-run-archive
- Slots produced: family-events
- Describe command: `node dist/stoa-describe.js`

## Next steps (in order)

1. Replace `metadata.version` in `stoa.component.yaml` with your real release tag
   (the placeholder `0.0.0-draft` is semver-legal but meaningless).
2. Implement the describe command declared above. It must:
   - Execute in under the declared `timeoutMs` with no side effects.
   - Emit a single JSON document on stdout matching the SCP handshake response
     shape: `apiVersion`, `kind: ComponentDescription`, `manifest` (the current
     contents of stoa.component.yaml inlined), `instance` (with `id` and
     `startedAt`), `health.status` (`ok`, `degraded`, or `down`).
   - Exit 0 on healthy, non-zero on down.
3. For each produced slot, implement its declared endpoint. For `family-events`
   producers, wrap every emission in the SCP envelope
   (see `../stoa/contracts/scp/envelope.schema.yaml`).
4. Run `stoa verify .` and resolve every failure.
5. Add your component to `family.yaml` — locally via `stoa add`, or by PR into
   Stoa when your repo is published.

## Reference handshake response

    {
      "apiVersion": "stoa/v1",
      "kind": "ComponentDescription",
      "manifest": { /* contents of stoa.component.yaml, inlined */ },
      "instance": {
        "id": "01HXAAAAAAAAAAAAAAAAAAAAA0",
        "startedAt": "2026-04-12T00:00:00Z"
      },
      "health": { "status": "ok" }
    }

A working Python reference implementation lives at
`../stoa/tooling/tests/fixtures/valid/describe.py`. Port to your own language.
