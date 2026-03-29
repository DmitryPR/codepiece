# codepiece-hackathon

Hackathon workspace for **CodePiece** — a swipe-based game for discovering and rating code snippets.

This repo uses **[Bun](https://bun.com)** as the **package manager** and runtime for scripts: **`bun install`**, **`bun test`**, **`bun run scan`**, and **`bun run`** for Next.js. Do not use npm, yarn, or pnpm for installs (they will not respect **`bun.lock`**).

1. **Install Bun** — follow the official **[Installation](https://bun.com/docs/installation)** guide (install script, Homebrew tap `oven-sh/bun/bun`, Docker image, etc.).
2. **`command not found: bun`** — see **[`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md)** (Bun **`PATH`**).

## Quick start

The feed reads **Card** rows created only by **`bun run scan`**. Until you scan at least once, **`/api/cards/next`** may return nothing useful.

```bash
bun install
bun run seed:samples
bun run dev
```

Open **[http://localhost:4000](http://localhost:4000)**. Optional env vars (**`CODEPIECE_DB`**, **`SCAN_MEMORY_PATH`**, **`REPO_LABEL`**) are listed in **[`docs/TECHNICAL.md`](docs/TECHNICAL.md)**. If the feed stays empty after a scan, see **[`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md)**.

## Build and run

From the **repo root**:

```bash
bun install
```

**Development** (default port **4000**, **Turbopack**, hot reload / Fast Refresh):

```bash
bun run dev
```

**Production** (optimized bundle, then serve):

```bash
bun run build
bun run start
```

`bun run build` type-checks, lints (Next defaults), and writes **`.next/`**; **`bun run start`** serves that build. Stop the server with **Ctrl+C**.

Use the **same `CODEPIECE_DB`** for **`bun run scan`**, **`bun run dev`**, and **`bun run start`** (default **`data/codepiece.db`**). SQLite is opened via **Bun** or **Node** depending on the process — see **[`docs/TECHNICAL.md`](docs/TECHNICAL.md)**.

**Inspect the DB (read-only):** **`bun run db:stats`** prints row counts (**users**, **cards**, **swipes**), swipe totals by **action**, per-user swipe counts, **cards** grouped by **`repo_label`**, SQLite logical size, and on-disk sizes for the main file, **WAL**, and **shm**. Uses **`CODEPIECE_DB`**; fails fast if the path is **`:memory:`** or missing.

**Ports, Docker file-watching, `scan --force`, and other fixes:** **[`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md)**.

### Docker (optional)

**[`docker-compose.yml`](docker-compose.yml)** runs **Next.js dev** in **`oven/bun:1`** with the repo and **`./data`** mounted; port **4000**. **`docker compose up`**, then open **[http://localhost:4000](http://localhost:4000)**. Run **`bun run scan`** on the **host** with **`CODEPIECE_DB=data/codepiece.db`** so cards share the same DB file. Details (hot reload, restarts): **[`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md)**.

---

```bash
bun --version
bun test
```

### Docs

- **[`docs/COMMANDS.md`](docs/COMMANDS.md)** — **`bun run …`** cheat sheet (agents: start with **`docs/AGENTS.md`**)  
- **[`docs/TEST-SPEC.md`](docs/TEST-SPEC.md)** — test commands and DB/runtime notes  
- **[`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md)** — ports, Docker, scan, UI quirks  
- **[`docs/SPEC.md`](docs/SPEC.md)** — product specification  
- **[`docs/GUARDRAILS.md`](docs/GUARDRAILS.md)** — what not to do (product guardrails)  
- **[`docs/TECHNICAL.md`](docs/TECHNICAL.md)** — stack, storage, ingestion, Docker overview  
- **[`plan/INITIAL.md`](plan/INITIAL.md)** — v1 feature / agent implementation plan  
- **[`plan/PRODUCTION.md`](plan/PRODUCTION.md)** — Docker Compose production rollout  
- **[`docs/AGENTS.md`](docs/AGENTS.md)** — how to use these docs as a coding agent  

## Sample scan targets

- **[`samples/`](samples/)** — bundled **`samples/mini-algorithms/`** (small `.ts` files) for local **`TARGET_REPO`** testing with **`bun run scan`**.  
- For a large real corpus, clone **[Lugriz/typescript-algorithms](https://github.com/Lugriz/typescript-algorithms)** and point **`TARGET_REPO`** at that path (see [`samples/README.md`](samples/README.md)).
