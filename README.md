# codepiece-hackathon

Hackathon workspace for **CodePiece** — a swipe-based game for discovering and rating code snippets. Visual direction and palette: **[`docs/STYLE.md`](docs/STYLE.md)**.

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

Wait until the terminal shows **Ready**, then open **[http://localhost:4000](http://localhost:4000)**. This app uses **port 4000** only — **`http://localhost:3000`** will not respond unless you changed the scripts yourself. Optional env vars (**`CODEPIECE_DB`**, **`SCAN_MEMORY_PATH`**, **`REPO_LABEL`**) are listed in **[`docs/TECHNICAL.md`](docs/TECHNICAL.md)**. If the feed stays empty after a scan, see **[`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md)**.

## Build and run

From the **repo root**:

```bash
bun install
```

**Development** (port **4000** only, **Turbopack**, hot reload / Fast Refresh):

```bash
bun run dev
```

**Production** (optimized bundle, then serve):

```bash
bun run build
bun run start
```

`bun run build` type-checks, lints (Next defaults), and writes **`.next/`**; **`bun run start`** serves that build on **port 4000**. Stop the server with **Ctrl+C**.

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

- **[`AGENTS.md`](AGENTS.md)** (repo root) — shortcut to agent guidance; full text in **`docs/AGENTS.md`**  
- **[`docs/COMMANDS.md`](docs/COMMANDS.md)** — **`bun run …`** cheat sheet (agents: start with **`docs/AGENTS.md`**)  
- **[`docs/TEST-SPEC.md`](docs/TEST-SPEC.md)** — test commands and DB/runtime notes  
- **[`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md)** — ports, Docker, scan, UI quirks  
- **[`docs/SPEC.md`](docs/SPEC.md)** — product specification  
- **[`docs/GUARDRAILS.md`](docs/GUARDRAILS.md)** — what not to do (product guardrails)  
- **[`docs/TECHNICAL.md`](docs/TECHNICAL.md)** — stack, storage, ingestion, Docker overview  
- **[`docs/AGENTS.md`](docs/AGENTS.md)** — how to use these docs as a coding agent (includes **plan/** read order for implementers)  
- **[`plan/v1-plan.md`](plan/v1-plan.md)** — execution checklist and API surface

### AI tooling (Cursor / agents)

Parts of this repo are **adapted from [everything-claude-code](https://github.com/affaan-m/everything-claude-code)** (MIT — upstream agent harness patterns for Claude Code, Cursor, and related tools):

| Location | Role |
|----------|------|
| **[`.cursor/rules/`](.cursor/rules/)** | Project rules (e.g. coding style, testing expectations). |
| **[`.cursor/skills/`](.cursor/skills/)** | Optional workflows (e.g. Bun runtime, Next.js Turbopack, documentation lookup). |
| **[`agents/`](agents/)** | Subagent-style prompts (e.g. planner, TypeScript reviewer). |

Use them together with **`docs/AGENTS.md`** (or root **`AGENTS.md`**). CodePiece-specific docs (**`docs/GUARDRAILS.md`**, **`plan/v1-plan.md`**, **`docs/TEST-SPEC.md`**) win if anything conflicts with generic upstream guidance.

## Sample scan targets

- **[`samples/`](samples/)** — bundled **`samples/mini-algorithms/`** (small `.ts` files) for local **`TARGET_REPO`** testing with **`bun run scan`**.  
- For a large real corpus, clone **[Lugriz/typescript-algorithms](https://github.com/Lugriz/typescript-algorithms)** and point **`TARGET_REPO`** at that path (see [`samples/README.md`](samples/README.md)).
