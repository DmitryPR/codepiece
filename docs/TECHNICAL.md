# CodePiece — technical notes

Companion to [`SPEC.md`](SPEC.md) and [`GUARDRAILS.md`](GUARDRAILS.md). This describes how the **shipped app** in this repository is implemented without over-scoping the hackathon.

## Simplicity: auth and scanning

- **No OAuth** — no Google, GitHub, or other social login in this app. Use an **anonymous session** (cookie + server-side `user` row) or a single local “player” record. Optional **display name** is fine; do not verify identities.
- **Scanning is local** — the scanner runs **on the same machine** where you work, against a **filesystem path** to a cloned repo (e.g. `TARGET_REPO=/path/to/clone`). There is no hosted crawler or remote ingestion service in the current design.

## Sample projects for testing

- **In-repo:** [`samples/the-algorithms-typescript/`](../samples/the-algorithms-typescript/) — vendored snapshot of **[TheAlgorithms/TypeScript](https://github.com/TheAlgorithms/TypeScript)** (MIT); provenance in **[`CODEPIECE.md`](../samples/the-algorithms-typescript/CODEPIECE.md)**. **`bun run seed:samples`** uses **`TARGET_REPO=./samples/the-algorithms-typescript`** and **`REPO_LABEL=TheAlgorithms/TypeScript`**. See [`samples/README.md`](../samples/README.md).
- **External:** clone any TS tree (e.g. **[Lugriz/typescript-algorithms](https://github.com/Lugriz/typescript-algorithms)**) and set **`TARGET_REPO`**; still exclude `node_modules` / build output per ingestion rules.

## Runtime and local development

- **Bun** is the **package manager** for this repo: use **`bun install`**, **`bun run`**, and **`bun test`** only (do not use npm, yarn, or pnpm for installs — they will not match **`bun.lock`**). Install Bun from **[bun.com/docs/installation](https://bun.com/docs/installation)**; if the shell cannot find `bun`, see **[Add Bun to your PATH](https://bun.com/docs/installation#add-bun-to-your-path)**.
- **TypeScript** is the default for application code (server, ingestion, shared types). The scanner and tests run on **Bun**; **Next.js** dev/build/start use **Node** via the `next` CLI while still invoked through **`bun run`**.

## UI

- Use a **small Next.js** surface: one or a few pages, card stack + swipe, minimal styling. No requirement for a large component library for the current UI.
- The UI talks to a **simple backend API** (same repo or adjacent package) rather than embedding heavy business logic in client-only code.

## Data storage

### Environment variables

| Variable | Used by | Purpose | Default |
|----------|---------|---------|---------|
| **`CODEPIECE_DB`** | Next.js, `bun run scan` | SQLite database file path (`:memory:` allowed in tests) | `data/codepiece.db` |
| **`TARGET_REPO`** | `bun run scan` only | Absolute or relative path to the tree to scan | *(required for scan)* |
| **`SCAN_MEMORY_PATH`** | `bun run scan` | JSON scan-memory file for idempotent reruns | `data/scan-memory.json` |
| **`REPO_LABEL`** | `bun run scan` | Short provenance label stored on **Card** rows | basename of `TARGET_REPO` |
| **`SCAN_FORCE`** | `bun run scan` | Set to **`1`** or **`true`** to ignore “already processed” scan memory and re-upsert **Cards** (same as **`--force`**) | off |

CLI: **`bun run scan -- --force`** (after **`TARGET_REPO=...`**) reprocesses all files; use when the DB was deleted or replaced but **`data/scan-memory.json`** still says “processed”.

**Storage stack:** one **SQLite** file behind **`CODEPIECE_DB`**. Under **Bun**, the app uses **`bun:sqlite`** (built-in, fast path). Under **Node** (Next.js server), the same file is opened with **`better-sqlite3`**. Same schema and path; pick the driver by runtime. **`bun run db:stats`** opens that file **read-only** (Bun) and prints row counts, swipe breakdowns, and on-disk **WAL** / **shm** sizes — see **[README.md](../README.md)**.

**Who writes what**

- **`bun run scan`** (Bun) **writes** **Card** rows (and updates scan memory on disk) into the DB configured by **`CODEPIECE_DB`**. It does not record user ratings.
- The **running Next.js** app (Route Handlers / server code) **reads** **Card** rows to build the feed (`/api/cards/next`, **`/api/cards/browse`**, etc.) and **writes** **ratings / swipes** (and **User** rows) when someone likes or skips — each rating is **persisted in the same database**. It does **not** run the repo scanner or insert **Card** rows. It also **reads/writes** per-user **snippet memos** (optional private note per card, max **600** Unicode code points): table **`snippet_memos`**, **`PUT /api/cards/memo`**, and **`memo`** on **`GET /api/cards/next`** when a card is returned. It **reads/writes** optional **`users.focus_repo_label`** (focus repository for the swipe feed) via **`GET`/`PUT /api/queue`** (see [`src/lib/queue.ts`](../src/lib/queue.ts)). **`GET /api/dashboard/stats`** (same session cookie as other routes) returns counts for **that user only** (likes, skips, memos, ranked list of cards **they** liked — grouped by swipe row count per card), plus **snippets in deck** (total **`cards`** in the DB). Symbol, repo label, path only — no developer identity; see [`src/lib/dashboard-stats.ts`](../src/lib/dashboard-stats.ts).

- Use one **simple SQLite database** (file-backed) for:
  - **Cards** — one row per showable snippet; **inserted/updated only by the Bun scanner**. Next.js **reads** them for `/api/cards/next` (and similar). This table is the **index of what can appear** in the swipe feed.
  - **Users** — minimal profile only (e.g. id + optional display label); **created by Next.js** on first visit / lazy signup. **No OAuth**; no verified GitHub link in this design.
  - **Ratings / swipes** — which user liked or skipped which card, timestamps if useful; **inserted by Next.js** when the user swipes (e.g. `POST /api/swipes`), not by the Bun scanner.
  - **Snippet memos** — optional **plain-text** note per **(user, card)**; **Next.js** only (`PUT /api/cards/memo`, upsert or clear when empty).
  - **Focus repo** — optional **`repo_label`** on the **user** row (**`users.focus_repo_label`**); **Next.js** only; **`GET`/`PUT /api/queue`**; when set, **`GET /api/cards/next`** prefers unswiped cards in that repo, then falls back to the global unswiped deck (see [`plan/FEATURES.md`](../plan/FEATURES.md)). Legacy **`user_card_queue`** is cleared when saving focus and is unused by the feed.
  - **Seen cards** — enough to avoid showing the same snippet again (or to power recommendations later).
- Keep a **small schema** — not a distributed data platform.
- Scanner and Next.js must share the **same database** (the same **`CODEPIECE_DB`** file) so scans **materialize** cards the app can show, and swipes from the app **land in the same DB** as those cards.

## Docker

- **Dev:** **`docker-compose.yml`** runs **Next.js dev** inside **`oven/bun:1`** with the project and **`./data`** bind-mounted — no separate DB container. The **scanner CLI** should run on the **host** with **`CODEPIECE_DB=data/codepiece.db`** (or the same path the container uses) so **Cards** and the app share one SQLite file. Alternatively mount your clone and run scan in a one-off container; keep scanning **local to your checkout**, not a separate cloud service.
- **Production** image + **`compose.prod.yml`** + rollout steps are outlined in **[`plan/PRODUCTION.md`](../plan/PRODUCTION.md)** (not implemented in the dev compose file).
- Developers should be able to run **`docker compose up`** (dev file) and hit the Next.js URL without OAuth secrets or provider apps.

## Code ingestion and “cards”

- **Scanning** should stay **simple** and **local**: walk a directory tree under a path you control (your clone), parse TypeScript (see below), extract candidate **functions** (and small methods) for cards.
- **Do not** prioritize or ingest **generated** code: skip common output paths (`dist/`, `build/`, `*.generated.ts`, vendor bundles, etc.) and heuristics for generated markers where cheap.
- **Size cap**: prefer snippets from **functions under ~200 lines** so cards stay readable and “fun” rather than wall-of-code.
- **Context**: attach a **short, automatic summary** of what the symbol does when feasible (e.g. leading comment, JSDoc first line, or a one-line heuristic from the signature and name). Keep it honest — label machine-derived text as such if it is not human-written docs.

## Languages

- **TypeScript only** in the shipped ingestion pipeline (`.ts` / `.tsx` with sensible handling of JSX noise — e.g. focus on `.ts` first if parsing `.tsx` is noisy).
- **Later**: add parsers or tree-sitter grammars for more languages using the same card pipeline and DB shape.

## Bun scan CLI: memory + card index

Running **`bun run scan`** (local Bun) should do **both** of the following in one tool, writing to the **same `CODEPIECE_DB`** SQLite database as the Next.js app:

1. **Scan memory** — update the **JSON memory file** with **processed** vs **skipped** files/symbols (path, reason: too large, generated, parse error, etc.) and **deterministic keys** (repo id + file path + content hash or commit SHA) so reruns are idempotent.
2. **Card index** — **insert or upsert** rows in the **`Card`** table. That is the authoritative **index of snippets to show**; until the scan has run (or after a fresh DB), the feed may be empty.

The Next.js app **reads** **Card** rows for the feed; it **never** inserts or updates **Card** rows and never parses repos for ingestion. **Card** rows come only from this Bun CLI in the current architecture. **Ratings** are **written** by Next.js when users swipe.

## Scan memory (idempotent ingestion)

- The memory artifact is a **JSON file** (default **`SCAN_MEMORY_PATH`**) recording what was already scanned and what was skipped. It works together with content hashing so unchanged files are not fully re-mined on every run.

## Out of scope in this repository

- No OAuth or third-party identity providers.
- No remote / SaaS scanning pipeline — only local path-based scans.
- No distributed job queue unless you outgrow a single process.
- No ML ranking beyond simple aggregates (unless you explicitly add it later).
- No complex monorepo orchestration beyond what Docker and one compose file need.

## See also

- **[`COMMANDS.md`](COMMANDS.md)** — **`bun run …`** scripts and typical flows (quick reference).  
- **[`SPEC.md`](SPEC.md)** — product behavior and goals (high level).  
- **[`../plan/FEATURES.md`](../plan/FEATURES.md)** — what this repo implements vs the spec, partial areas, backlog.  
- **[`GUARDRAILS.md`](GUARDRAILS.md)** — license, privacy, and UX constraints that affect implementation choices.  
- **[`TROUBLESHOOTING.md`](TROUBLESHOOTING.md)** — ports, Docker, scan, UI.  
- **[`../plan/v1-plan.md`](../plan/v1-plan.md)** — execution checklist and plan.  
- **[`../plan/PRODUCTION.md`](../plan/PRODUCTION.md)** — Docker Compose production rollout.  
- **[`AGENTS.md`](AGENTS.md)** — read order and scope rules for LLM / automated implementers.
