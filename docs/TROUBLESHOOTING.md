# CodePiece — troubleshooting

Fixes for common local and Docker issues. Everyday commands stay in **[README.md](../README.md)**; stack details in **[TECHNICAL.md](TECHNICAL.md)**.

## Bun not found

Install Bun from **[bun.com/docs/installation](https://bun.com/docs/installation)** and add it to your **`PATH`** (**[Add Bun to your PATH](https://bun.com/docs/installation#add-bun-to-your-path)**). This repo expects **`bun install`** / **`bun.lock`** — do not use npm, yarn, or pnpm for installs here.

## Port already in use (`EADDRINUSE`)

Another process is bound to the dev port (default **4000**).

- **macOS / Linux:** `lsof -i :4000` then `kill <pid>` (or `kill -9 <pid>` if needed).
- **One-off different port** (dev):  
  `bun run dev -- -p <port>`  
  Example: `bun run dev -- -p 3001`
- **Production server:**  
  `bun run start -- -p <port>`
- **Change the default permanently:** edit the **`dev`** and **`start`** scripts in [`package.json`](../package.json).

## Dev server: Webpack instead of Turbopack

Default **`bun run dev`** uses **Turbopack**. If you need the classic bundler (rare compatibility issues), run:

```bash
bun run dev:webpack
```

## Docker: hot reload or edits not showing

The repo bind-mounts your tree into **`oven/bun:1`**. **[`docker-compose.yml`](../docker-compose.yml)** sets **`WATCHPACK_POLLING`** and **`CHOKIDAR_USEPOLLING`** so file watching works on Docker Desktop (macOS/Windows).

If the UI still does not refresh:

```bash
docker compose restart web
```

After **`package.json`** / lockfile changes, recreate the container:

```bash
docker compose up --force-recreate
```

Run **`bun run scan`** on the **host** with **`CODEPIECE_DB=data/codepiece.db`** so the container sees the same SQLite file as in **`./data`**.

## Empty feed / scan skipped everything

Cards come only from **`bun run scan`**. If **`data/scan-memory.json`** says files are already processed but the DB has no (or old) rows, force a re-upsert:

```bash
bun run seed:samples
```

or:

```bash
TARGET_REPO=./samples/mini-algorithms bun run scan -- --force
```

See **`SCAN_FORCE`** in **[TECHNICAL.md](TECHNICAL.md)** (environment variables).

## UI stuck on “Loading…” or swipes not firing

Recent fixes live in **`app/swipe-client.tsx`** (session bootstrap after **`POST /api/users`**, pointer handling so **Skip/Like** still receive clicks). **Hard-refresh** the browser (**Cmd+Shift+R** / **Ctrl+Shift+R**). If cookies are blocked for localhost, allow them for this origin.

## Production bundle locally

```bash
bun run build
bun run start
```

Hosted deploy is not automated in this repo — see **[`plan/PRODUCTION.md`](../plan/PRODUCTION.md)**.

## See also

- **[README.md](../README.md)** — quick start, build and run  
- **[TEST-SPEC.md](TEST-SPEC.md)** — tests and manual smoke  
- **[TECHNICAL.md](TECHNICAL.md)** — env vars, SQLite, Docker overview  
