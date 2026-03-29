# CodePiece — troubleshooting

Fixes for common local and Docker issues. Everyday commands stay in **[README.md](../README.md)**; stack details in **[TECHNICAL.md](TECHNICAL.md)**.

## Bun not found

Install Bun from **[bun.com/docs/installation](https://bun.com/docs/installation)** and add it to your **`PATH`** (**[Add Bun to your PATH](https://bun.com/docs/installation#add-bun-to-your-path)**). This repo expects **`bun install`** / **`bun.lock`** — do not use npm, yarn, or pnpm for installs here.

## Localhost does not respond, spins forever, or “can’t connect”

1. **URL and port** — This project serves on **port 4000**, not Next’s default **3000**. Open **[http://localhost:4000](http://localhost:4000)** after **`bun run dev`** prints **Ready**.
2. **Server running** — From the repo root run **`bun run dev`** and wait until the terminal shows **Ready** (first Turbopack compile can take several seconds).
3. **Quick listen check** — **`curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:4000/`** should print **`200`** once the app is up. If **connection refused**, nothing is bound to **4000** (start **`bun run dev`** or **`docker compose up`**). If **`/`** returns **500** or the page is blank, try a clean dev cache: **`bun run dev:fresh`** (see **Turbopack dev: stale `.next` cache** below).
4. **Stale or zombie process on 4000** — Another app (or an old Node) may be holding the port or returning errors. See **Port already in use** below to find and stop it, then start **`bun run dev`** again.

## Port already in use (`EADDRINUSE`)

The app is meant to run on **port 4000** only (`bun run dev`, `bun run start`, and Docker all use **4000**).

- **macOS / Linux:** `lsof -i :4000` then `kill <pid>` (or `kill -9 <pid>` if needed) so **`bun run dev`** can bind again.
- **Windows (PowerShell):** `Get-NetTCPConnection -LocalPort 4000` / Task Manager, or restart after closing the other process.
- **Change the port** (not recommended — docs and compose assume **4000**): edit the **`-p 4000`** flags in the **`dev`**, **`dev:fresh`**, and **`start`** scripts in [`package.json`](../package.json) and the **`ports`** mapping in [`docker-compose.yml`](../docker-compose.yml) together.

## Turbopack dev: stale `.next` cache (500 on `/` or odd errors)

**`bun run dev`** uses **Turbopack** (hot reload / Fast Refresh). If the dev cache gets confused — e.g. after **switching branches** while the server is running, **stopping mid-compile**, or **changing `next.config` / dependencies** — you may see **500**s, missing-module errors, or a **blank** page (Next’s FOUC guard hides the body).

### Fix

Stop the dev server, clear the cache, start again:

```bash
bun run dev:fresh
```

Or manually: **`rm -rf .next`** then **`bun run dev`**.

## HTTP 500 in the browser or from `/api/*`

Routes log **`[GET /api/...]`** / **`[POST /api/...]`** and the error in the **terminal where `bun run dev` is running**. Failed API calls often return JSON like **`{ "error": "..." }`** — open DevTools → **Network**, select the red request, **Response**.

| Symptom | What to try |
|--------|-------------|
| **500 on `/`** or weird module errors | **`bun run dev:fresh`** (stale Turbopack / `.next` cache). |
| Error mentions **better-sqlite3**, **bindings**, or **NODE_MODULE_VERSION** | From the repo root run **`bun install`** so the native addon matches your Node version. |
| **SQLITE_BUSY** or database locked | Two processes writing the same **`CODEPIECE_DB`** (e.g. scan + dev, or two dev servers). Use one writer or separate DB paths. |
| **500 only in dev**, prod seems fine | Compare **`bun run build && bun run start`** vs **`bun run dev`**; if prod works, prefer **`dev:fresh`** in dev. |

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

## Internal Server Error / `no such table` after `git pull`

The app applies **`INIT_SQL`** (including new tables like **`snippet_memos`**) on **every** `getDb()` call for the cached connection, so you usually **do not** need a manual migration or **`drizzle-kit push`**.

If you still see errors: **restart** **`bun run dev`** (or the Docker web service). As a last resort, run **`bun run db:push`** against your **`CODEPIECE_DB`** file so Drizzle aligns the file with [`src/db/schema.ts`](../src/db/schema.ts).

## Empty feed / scan skipped everything

Cards come only from **`bun run scan`**. If **`data/scan-memory.json`** says files are already processed but the DB has no (or old) rows, force a re-upsert:

```bash
bun run seed:samples
```

or:

```bash
REPO_LABEL=TheAlgorithms/TypeScript TARGET_REPO=./samples/the-algorithms-typescript bun run scan -- --force
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

- **[COMMANDS.md](COMMANDS.md)** — **`bun run …`** scripts (quick reference)  
- **[README.md](../README.md)** — quick start, build and run  
- **[TEST-SPEC.md](TEST-SPEC.md)** — tests and manual smoke  
- **[TECHNICAL.md](TECHNICAL.md)** — env vars, SQLite, Docker overview  
