# CodePiece — production rollout plan (Docker Compose)

How to take the app from **local / hackathon dev** to a **repeatable Compose-based deployment**. This doc is the target checklist for production hardening; the **[`INITIAL.md`](INITIAL.md)** plan stays focused on feature implementation.

**Product and stack context:** [`docs/SPEC.md`](../docs/SPEC.md), [`docs/TECHNICAL.md`](../docs/TECHNICAL.md), [`docs/GUARDRAILS.md`](../docs/GUARDRAILS.md).

## Current baseline (dev)

- **[`docker-compose.yml`](../docker-compose.yml)** — **`oven/bun:1`**, bind-mounted source, named volume for **`node_modules`**, **`./data` → `/data`**, command **`bun install && bun run dev`**. **No `docker build`.** Good for contributors; **not** a production image.
- **Scanner** — run **`bun run scan`** on a host (or future job container) with the **same `CODEPIECE_DB`** path the app uses so **Card** rows exist.

## Production goals

| Area | Target |
|------|--------|
| **Image** | Immutable image built in CI: **`bun run build`** (Next.js), then a **slim Node** (or Bun) runtime serving **`next start`** or **standalone** output; **Linux**-native **`better-sqlite3`** built in the image. |
| **Compose** | **`docker compose -f compose.prod.yml up -d`** (or similar): **`web`** only or **`web` + reverse proxy**; **no** bind-mounted source in prod. |
| **Storage** | **Named volume** (or host path) for **`/data`** holding **`codepiece.db`** (+ WAL/SHM); backups and restore documented. |
| **Config** | **`CODEPIECE_DB`**, **`PORT`**, **`NODE_ENV=production`** via **env file** or orchestrator secrets; no OAuth secrets in v1. |
| **Ingestion** | **Job** pattern: scheduled or manual **`bun run scan`** (or dedicated image) with **`TARGET_REPO`** mounted read-only and **shared `CODEPIECE_DB` volume** with **`web`**, or run scan before deploy and ship a seeded volume (trade-off: freshness vs simplicity). |
| **Rollout** | **Build → tag → push registry → pull on host → `up -d` → smoke** (`curl` health or `/`); document rollback (previous image tag + same volume). |

## Suggested execution order

1. **Production Dockerfile** — multi-stage: install deps, **`bun run build`**, copy **`.next/standalone`** (requires **`output: 'standalone'`** in **`next.config`**) + static assets + **`server.js`**; **Node 22 slim** runner; install **build deps** only in builder if **`better-sqlite3`** compiles from source on your platform.
2. **`compose.prod.yml`** (new file) — **`build:`** or **`image:`** from registry; **volume** `codepiece-data:/data`; **`environment`**: `CODEPIECE_DB=/data/codepiece.db`, `PORT=4000`, `HOSTNAME=0.0.0.0`; **`restart: unless-stopped`**; **healthcheck** (e.g. `wget -qO- http://127.0.0.1:4000/` or Node one-liner).
3. **CI** — on tag or `main`: **`docker build`**, push **`ghcr.io/.../codepiece:tag`** (or your registry); optional **`bun test`** gate before build.
4. **Host rollout** — document: `docker compose -f compose.prod.yml pull && docker compose -f compose.prod.yml up -d`; preserve **`codepiece-data`** across deploys.
5. **Scan + prod** — document **one** supported flow (e.g. admin runs scan on server with volume mounted at **`./data`**, or CI job that commits nothing but updates DB volume via sidecar — pick the simplest operable story).
6. **Optional** — **Caddy** / **nginx** in Compose for TLS termination; **read-only** rootfs where practical; log driver.

## Out of scope for this plan (unless you expand it)

- Managed **Postgres** / hosted DB (stack is **SQLite file** today).
- Kubernetes manifests (Compose-first).
- OAuth and multi-tenant auth.

## See also

- **[`INITIAL.md`](INITIAL.md)** — v1 feature checklist (implementation).  
- **[`README.md`](../README.md)** — local dev, **`docker compose`** (dev file), **`bun run seed:samples`**.  
- **[`docs/TECHNICAL.md`](../docs/TECHNICAL.md)** — **`CODEPIECE_DB`**, Bun vs Node SQLite drivers.
