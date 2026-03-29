# codepiece-hackathon

Hackathon workspace for **CodePiece** — a swipe-based game for discovering and rating code snippets.

This repo uses **[Bun](https://bun.com)** as the **package manager** and runtime for scripts: **`bun install`**, **`bun test`**, **`bun run scan`**, and **`bun run`** for Next.js. Do not use npm, yarn, or pnpm for installs (they will not respect **`bun.lock`**).

1. **Install Bun** — follow the official **[Installation](https://bun.com/docs/installation)** guide (install script, Homebrew tap `oven-sh/bun/bun`, Docker image, etc.).
2. **`command not found: bun`** — add Bun to your shell **`PATH`** as in **[Add Bun to your PATH](https://bun.com/docs/installation#add-bun-to-your-path)** (for example `export BUN_INSTALL="$HOME/.bun"` and `export PATH="$BUN_INSTALL/bin:$PATH"` after the curl installer, or use the path your package manager prints).

## Quick start

The feed reads **Card** rows created only by **`bun run scan`**. Until you scan at least once, **`/api/cards/next`** may return nothing useful.

```bash
bun install
bun run seed:samples
bun run dev
```

See **`bun run scan -- --force`** and **`SCAN_FORCE`** in **[`docs/TECHNICAL.md`](docs/TECHNICAL.md)** when the DB is empty but scan memory still says “processed.”

Then open **[http://localhost:4000](http://localhost:4000)**. Optional env vars: **`CODEPIECE_DB`** (default **`data/codepiece.db`**), **`SCAN_MEMORY_PATH`**, **`REPO_LABEL`** — see **[`docs/TECHNICAL.md`](docs/TECHNICAL.md)**.

## Build and run

From the **repo root**:

```bash
bun install
```

**Development** (hot reload / HMR):

```bash
bun run dev
```

This runs **Next.js dev** with **Turbopack** (fast refresh for React components and quick rebuilds when you edit files under **`app/`**, **`src/`**, etc.). When it prints *Ready*, open **[http://localhost:4000](http://localhost:4000)**. Save a file and the browser should update without a full reload (Fast Refresh); **Route Handlers** and server code typically recompile on the next request.

If you need the classic Webpack dev server instead (e.g. troubleshooting), use **`bun run dev:webpack`**.

**Rebuild the production bundle and run it locally** (“redeploy” on your machine):

```bash
bun run build
bun run start
```

Stop with **Ctrl+C**. There is no hosted deploy wired in this repo yet — see **[`plan/PRODUCTION.md`](plan/PRODUCTION.md)** for a Compose-based production image plan.

**Production** (optimized bundle):

```bash
bun run build
bun run start
```

Same default URL: **[http://localhost:4000](http://localhost:4000)**. Scripts use **`-p 4000`** in [`package.json`](package.json) so this app stays off port **3000**. For a one-off port: **`bun run dev -- -p 3000`** or **`bun run start -- -p 3000`**. To change the default permanently, edit the **`dev`** and **`start`** scripts there.

`bun run build` runs **`next build`**: type-checks, lints (Next defaults), and writes output under **`.next/`**. It does not start a server; **`bun run start`** runs **`next start`** against that build.

Use the **same `CODEPIECE_DB`** for `bun run scan`, `bun run dev`, and `bun run start` so cards and swipes share one **SQLite** file (default: **`data/codepiece.db`**). The stack uses **Bun’s built-in SQLite** where the process runs on Bun and **`better-sqlite3`** for the Next.js server on Node — same file, same schema (see **[`docs/TECHNICAL.md`](docs/TECHNICAL.md)**).

### Docker (optional)

No custom image: Compose uses **`oven/bun:1`**, mounts the repo and **`./data`**, and runs **`bun install`** then **`bun run dev`** (port **4000**, **`--turbopack`**, host **`0.0.0.0`**).

```bash
docker compose up
```

**Hot reload in Docker:** Edits on your machine appear in the container via the bind mount. **`WATCHPACK_POLLING`** / **`CHOKIDAR_USEPOLLING`** are enabled in **[`docker-compose.yml`](docker-compose.yml)** so file watching works reliably on macOS/Windows Docker Desktop. If changes still don’t show, restart with **`docker compose restart web`**.

Open **[http://localhost:4000](http://localhost:4000)**. Run **`bun run scan`** on the **host** with **`CODEPIECE_DB=data/codepiece.db`** so cards land in the same SQLite file the container reads.

**Refresh the dev container** after dependency changes (reinstall + dev server):

```bash
docker compose up --build --force-recreate
```

(`--build` is a no-op for this file-only image; **`--force-recreate`** restarts the service.)

Then:

```bash
bun --version
bun test
```

- **[`docs/TEST-SPEC.md`](docs/TEST-SPEC.md)** — test commands and DB/runtime notes  
- **[`docs/SPEC.md`](docs/SPEC.md)** — product specification  
- **[`docs/GUARDRAILS.md`](docs/GUARDRAILS.md)** — what not to do (product guardrails)  
- **[`docs/TECHNICAL.md`](docs/TECHNICAL.md)** — stack, storage, ingestion, Docker  
- **[`plan/INITIAL.md`](plan/INITIAL.md)** — v1 feature / agent implementation plan  
- **[`plan/PRODUCTION.md`](plan/PRODUCTION.md)** — Docker Compose production rollout (image, prod compose, CI)  
- **[`docs/AGENTS.md`](docs/AGENTS.md)** — how to use these docs as a coding agent  

## Sample scan targets

- **[`samples/`](samples/)** — bundled **`samples/mini-algorithms/`** (small `.ts` files) for local **`TARGET_REPO`** testing with **`bun run scan`**.  
- For a large real corpus, clone **[Lugriz/typescript-algorithms](https://github.com/Lugriz/typescript-algorithms)** and point **`TARGET_REPO`** at that path (see [`samples/README.md`](samples/README.md)).
