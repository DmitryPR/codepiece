# CodePiece — troubleshooting

Fixes for common local and Docker issues. Everyday commands stay in **[README.md](../README.md)**; stack details in **[TECHNICAL.md](TECHNICAL.md)**.

## Bun not found

Install Bun from **[bun.com/docs/installation](https://bun.com/docs/installation)** and add it to your **`PATH`** (**[Add Bun to your PATH](https://bun.com/docs/installation#add-bun-to-your-path)**). This repo expects **`bun install`** / **`bun.lock`** — do not use npm, yarn, or pnpm for installs here.

## Port already in use (`EADDRINUSE`)

The app is meant to run on **port 4000** only (`bun run dev`, `bun run start`, and Docker all use **4000**).

- **macOS / Linux:** `lsof -i :4000` then `kill <pid>` (or `kill -9 <pid>` if needed) so **`bun run dev`** can bind again.
- **Windows (PowerShell):** `Get-NetTCPConnection -LocalPort 4000` / Task Manager, or restart after closing the other process.
- **Change the port** (not recommended — docs and compose assume **4000**): edit the **`-p 4000`** flags in the **`dev`**, **`dev:webpack`**, and **`start`** scripts in [`package.json`](../package.json) and the **`ports`** mapping in [`docker-compose.yml`](../docker-compose.yml) together.

## Dev server: Webpack instead of Turbopack

Default **`bun run dev`** uses **Turbopack**. If you need the classic bundler (rare compatibility issues), run:

```bash
bun run dev:webpack
```

## Next dev: `Cannot find module './NNN.js'` (500 on `/` or APIs)

### Why it happens (it is not your app code)

With **`next dev`** using the **Webpack** bundler (script **`dev:webpack`**), Next writes many small numbered chunks under **`.next/server`**. Fast Refresh and incremental compiles update the **webpack runtime manifest** (which chunk IDs to load). Sometimes that manifest and the files on disk get **out of sync**: the runtime still **`require`s `./331.js`**, but that file was already removed or renamed in a later compile. Then any route that touches that bundle throws **`MODULE_NOT_FOUND`**, you often get **500**, and Next’s **`body { display: none }`** FOUC guard can leave the page **blank**.

Typical triggers: **many hot reloads**, **stopping the server mid-compile**, **switching git branches** while dev is running, or **editing `next.config` / dependencies** without a clean rebuild. Default **`bun run dev`** uses **Turbopack**, which uses a different pipeline and **this class of bug is much rarer** than with **`bun run dev:webpack`**.

### Fix

Stop the dev server, delete the cache, start again:

```bash
rm -rf .next
bun run dev
```

Or one step (same as above):

```bash
bun run dev:fresh
```

If you **must** use Webpack:

```bash
bun run dev:webpack:fresh
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

- **[COMMANDS.md](COMMANDS.md)** — **`bun run …`** scripts (quick reference)  
- **[README.md](../README.md)** — quick start, build and run  
- **[TEST-SPEC.md](TEST-SPEC.md)** — tests and manual smoke  
- **[TECHNICAL.md](TECHNICAL.md)** — env vars, SQLite, Docker overview  
