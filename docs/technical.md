# CodePiece — technical notes

Companion to [`SPEC.md`](SPEC.md) and [`GUARDRAILS.md`](GUARDRAILS.md). This describes how we intend to implement the first version without over-scoping the hackathon.

## Simplicity: auth and scanning

- **No OAuth** — no Google, GitHub, or other social login for v1. Use an **anonymous session** (cookie + server-side `user` row) or a single local “player” record. Optional **display name** is fine; do not verify identities.
- **Scanning is local** — the scanner runs **on the same machine** where you work, against a **filesystem path** to a cloned repo (e.g. `TARGET_REPO=/path/to/clone`). There is no hosted crawler or remote ingestion service in v1.

## Runtime and local development

- The project should **run locally with minimal friction**. **Bun** is an acceptable (and preferred) runtime for scripts, tooling, and the API layer where it simplifies setup and matches team preference.
- **TypeScript** is the default language for application code (server, ingestion, shared types). Keep the toolchain boring: one package manager/runtime story, clear `package.json` / `bunfig` as needed.

## UI

- Use a **small Next.js** surface: one or a few pages, card stack + swipe, minimal styling. No requirement for a large component library in v1.
- The UI talks to a **simple backend API** (same repo or adjacent package) rather than embedding heavy business logic in client-only code.

## Data storage

**Write path vs read path**

- **`bun run scan`** (Bun) **writes** into the database: **Card** rows (and optionally scan-memory tables), using the same **`DATABASE_URL`** (or equivalent) as the app.
- The **running Next.js** app **only reads** that database for cards, users, and swipes (Route Handlers / server code). It does not run the repo scanner.

Pick **Postgres** or any **lightweight relational** store (**SQLite** is fine). Both are valid for v1; Postgres pairs naturally with Docker Compose, SQLite with a single file on disk.

- Use one **simple database** for:
  - **Cards** — one row per showable snippet; **inserted/updated only by the Bun scanner**. Next.js **reads** them for `/api/cards/next` (and similar). This table is the **index of what can appear** in the swipe feed.
  - **Users** — minimal profile only (e.g. id + optional display label). **No OAuth**; no verified GitHub link required for v1.
  - **Ratings / swipes** — which user liked or skipped which card, timestamps if useful.
  - **Seen cards** — enough to avoid showing the same snippet again (or to power recommendations later).
- Keep a **small schema** — not a distributed data platform.
- Scanner and Next.js must share the **same `DATABASE_URL`** so a successful scan immediately **materializes** the card index the running app can serve.

## Docker

- **Docker Compose** is mainly for **app + database** (Next.js API/UI + SQLite/Postgres). The **scanner CLI** can run on the **host** with `bun run scan` pointing at a local clone path, or mount that path into a one-off container — keep scanning **local to your checkout**, not a separate cloud service.
- Developers should be able to run **`docker compose up`** (or the documented equivalent) and hit the Next.js URL without OAuth secrets or provider apps.

## Code ingestion and “cards”

- **Scanning** should stay **simple** and **local**: walk a directory tree under a path you control (your clone), parse TypeScript (see below), extract candidate **functions** (and small methods) for cards.
- **Do not** prioritize or ingest **generated** code: skip common output paths (`dist/`, `build/`, `*.generated.ts`, vendor bundles, etc.) and heuristics for generated markers where cheap.
- **Size cap**: prefer snippets from **functions under ~200 lines** so cards stay readable and “fun” rather than wall-of-code.
- **Context**: attach a **short, automatic summary** of what the symbol does when feasible (e.g. leading comment, JSDoc first line, or a one-line heuristic from the signature and name). Keep it honest — label machine-derived text as such if it is not human-written docs.

## Languages

- **v1: TypeScript only** (`.ts` / `.tsx` with sensible handling of JSX noise — e.g. focus on `.ts` first if parsing `.tsx` is noisy).
- **Later**: add parsers or tree-sitter grammars for more languages using the same card pipeline and DB shape.

## Bun scan CLI: memory + card index

Running **`bun run scan`** (local Bun) should do **both** of the following in one tool, writing to **Postgres or your chosen lightweight DB** (same connection the Next.js app uses):

1. **Scan memory** — update a **memory file** or **DB table** of **processed** vs **skipped** files/symbols (path, reason: too large, generated, parse error, etc.) with **deterministic keys** (repo id + file path + content hash or commit SHA) so reruns are idempotent.
2. **Card index** — **insert or upsert** rows in the **`Card`** table. That is the authoritative **index of snippets to show**; until the scan has run (or after a fresh DB), the feed may be empty.

The Next.js app **reads** these rows; it never parses repos on the server for ingestion. **Card** rows come only from this Bun CLI (for v1).

## Scan memory (idempotent ingestion)

- The memory artifact (JSON alongside the project, or rows in **Postgres / SQLite**) records what was already scanned and what was skipped. It works together with content hashing so unchanged files are not fully re-mined on every run.

## What we are not building in v1

- No OAuth or third-party identity providers.
- No remote / SaaS scanning pipeline — only local path-based scans.
- No distributed job queue unless you outgrow a single process.
- No ML ranking beyond simple aggregates (unless you explicitly add it later).
- No complex monorepo orchestration beyond what Docker and one compose file need.

## See also

- **[`SPEC.md`](SPEC.md)** — product behavior and goals.  
- **[`GUARDRAILS.md`](GUARDRAILS.md)** — license, privacy, and UX constraints that affect implementation choices.  
- **[`../plan/INITIAL.md`](../plan/INITIAL.md)** — agent implementation plan (v1).
