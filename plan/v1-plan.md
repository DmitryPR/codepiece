# CodePiece — v1 plan (agent implementation)

Pre-review roadmap for implementers and coding agents. Follow **[`docs/TECHNICAL.md`](../docs/TECHNICAL.md)** for stack choices; align product behavior with **[`docs/SPEC.md`](../docs/SPEC.md)** and **[`docs/GUARDRAILS.md`](../docs/GUARDRAILS.md)**. **Docker Compose production rollout** lives in **[`PRODUCTION.md`](PRODUCTION.md)**.

This file is the **named execution plan** for the hackathon slice (file name **`v1-plan.md`**). **`docs/AGENTS.md`** treats it as the primary checklist; **[`FEATURES.md`](FEATURES.md)** tracks what shipped vs the product spec and what is backlog.

## Purpose and constraints

**In scope (this plan)**

- Swipe UX (like / skip) with persistence.
- Users, swipes, and “seen” cards in a simple relational store.
- TypeScript-only ingestion: **`bun run scan`** **writes** scan memory and **`Card`** rows to **SQLite** (**`CODEPIECE_DB`**, Bun **`bun:sqlite`** / Next **`better-sqlite3`** on the same file); the **Next.js** app **reads** **Cards** for the feed and **writes** **ratings/swipes** (and users) to the **same database** when code is rated.

**Explicitly defer**

- **Any OAuth** (Google, GitHub, etc.) — anonymous/session users only.
- Matching users to owners/committers, messaging, or contact flows.
- Parsers for languages other than TypeScript.
- ML ranking or distributed job queues (see **“Out of scope in this repo”** in [`docs/TECHNICAL.md`](../docs/TECHNICAL.md)).
- **Production Docker image + Compose rollout** — tracked in **[`PRODUCTION.md`](PRODUCTION.md)** (dev **`docker compose`** remains in **[`README.md`](../README.md)**).

## Target architecture

```mermaid
flowchart LR
  web[NextApp_API]
  db[(SQLite_CODEPIECE_DB)]
  cli[Bun_scan_CLI]
  mem[scan_memory]
  repo[TargetRepo]
  cli --> repo
  cli --> mem
  cli -->|"upsert_Card_rows"| db
  web -->|"read_Cards"| db
  web -->|"write_swipes_users"| db
```

- **Next.js** hosts the UI and **Route Handlers** (or `/api/*`). It **reads** **Card** rows from **SQLite** for the feed; it **writes** **swipe/rating** rows (and **User** rows) when the user rates a snippet. It **does not** run the repo scanner or mutate **Card** rows.
- **`bun run scan`** is a **Bun** CLI run **locally** against `TARGET_REPO`. It **writes** to the **same database** as the app (**`CODEPIECE_DB`** SQLite path): (1) **scan memory** (JSON file) and (2) **`Card`** upserts — the **snippet index** for the feed. No remote ingestion service.
- Until a scan has populated **Card** rows, `/api/cards/next` may return empty; document this in the README quick start.

## Data model (minimal)

Implement with one ORM/query layer (**Drizzle** here). **Bun scanner and Next.js must share one SQLite file** via **`CODEPIECE_DB`**.

| Entity | Fields (conceptual) |
|--------|---------------------|
| **User** | `id`, optional display label, `created_at` — **no OAuth**; no verified external identity |
| **Card** | Stable `id`; `source_path`; `symbol_name`; `snippet_text`; `line_start` / `line_end`; `context_summary` (JSDoc first line or machine-labeled heuristic); **provenance** per GUARDRAILS: `repo_url` or `repo_label`, `license` (string / SPDX when known), optional `commit_sha` |
| **Swipe** | `user_id`, `card_id`, `action` (`like` \| `skip`), `created_at` |
| **Snippet memo** | `user_id`, `card_id`, `body` (plain text, max **600** code points) — **shipped**; optional per **(user, card)** |
| **Seen / feed** | Derive “seen” from **swipes** only (`pickNextCard` excludes swiped `card_id`s). Optional `user_card_seen` for impressions without a swipe — backlog ([`docs/SPEC.md`](../docs/SPEC.md), [`FEATURES.md`](FEATURES.md)) |

## Ingestion pipeline (TypeScript, this plan)

1. Walk the target repo tree from a **local path** (env e.g. **`TARGET_REPO`**), i.e. a clone on disk next to or anywhere on the developer machine — **not** fetched over the network by the scanner.
2. **Exclude** `node_modules`, `dist`, `build`, `.git`, and obvious generated paths/patterns (`*.generated.ts`, etc.).
3. Parse **`.ts` first**; defer **`.tsx`** to a follow-up if JSX adds noise ([`docs/TECHNICAL.md`](../docs/TECHNICAL.md)).
4. Use **TypeScript compiler API** or **ts-morph** to collect **functions** and **methods** with body **under ~200 lines**; skip oversize symbols; on parse failure, record skip reason in scan memory.
5. **Context**: prefer JSDoc or first line of a leading block comment; otherwise a short heuristic from name + signature, stored with a flag or prefix so UI can label it as non-author docs.
6. **Idempotency**: use scan memory + content hash so unchanged files are not fully reprocessed every run.
7. **Persist cards**: for each accepted symbol, **upsert** a **Card** row into **SQLite** via **`CODEPIECE_DB`** (snippet text, path, lines, context, provenance). This **fills the feed index**; Next.js **selects** from these rows only.

## API surface (minimal)

| Method | Path | Purpose |
|--------|------|--------|
| `POST` | `/api/users` | Lazy-create anonymous user (cookie/session); optional display name only — **no OAuth** |
| `GET` | `/api/cards/next` | Session cookie; returns next unseen **Card** (or empty); includes **`memo`** when present |
| `POST` | `/api/swipes` | JSON: `cardId`, `action` (`like` \| `skip`); **persists** the rating/swipe row in the DB for the current user |
| `PUT` | `/api/cards/memo` | JSON: `cardId`, `body` (optional plain text, max **600** Unicode code points); upsert or clear per **(user, card)** |
| `GET` | `/api/dashboard/stats` | Session-scoped aggregates: your likes/skips/memos, **topByLikes** (your per-card like counts), global **cards** count |

Cookie or opaque session id for `userId` is enough. No third-party auth tokens. **Every swipe must be stored** so the feed and feedback loop stay consistent with [`docs/SPEC.md`](../docs/SPEC.md).

## UI work

- Single **Next.js** page: monospace **code** block, **context** line, **attribution** footer (repo, license, path) per [`docs/GUARDRAILS.md`](../docs/GUARDRAILS.md).
- **Swipe**: pointer/touch gestures plus **left/right buttons** for accessibility.
- On swipe success, fetch **next** card from the API.
- **Stats:** header **Stats** control opens a panel with KPIs and **your** ranked liked snippets (same data as **`GET /api/dashboard/stats`**); after a **like**, the list refetches and the row for that card is **highlighted** (order may change).
- **Memo + copy:** title-row controls — **copy** snippet text, **memo** popover (**Save** → **`PUT /api/cards/memo`**). Optional **Library** sidebar lists the same top-by-likes preview as in the Stats panel.

## Runtime: Bun vs Next

Prefer **Bun** for the scanner CLI and any standalone scripts ([`docs/TECHNICAL.md`](../docs/TECHNICAL.md)). **Next.js** dev/build/start run via **Node** through **`bun run`**; do not block the hackathon on toolchain edge cases.

## Agent execution order (checklist)

1. **Scaffold** the repo: `package.json`, `tsconfig`, flat `src/` (or minimal `apps/web` only if you split later — prefer flat if it stays simpler).
2. **Database**: schema + migrations; **SQLite** file — single **`CODEPIECE_DB`** for scanner (Bun) and Next (Node).
3. **Scanner CLI** (`bun run scan`): **scan memory** + **Card** upserts (Bun **writes** cards only).
4. **Ingest**: run scanner locally against `TARGET_REPO` — start with **[`samples/mini-algorithms/`](../samples/mini-algorithms/)**, then optionally **[Lugriz/typescript-algorithms](https://github.com/Lugriz/typescript-algorithms)** (see [`samples/README.md`](../samples/README.md)); confirm **Card** count increases and `/api/cards/next` returns data.
5. **API** routes: user lazy-create, next card, **`POST /api/swipes`** **persisting** ratings to the DB; verify with **curl** or a tiny test script.
6. **Next.js** page: card display + swipe + API integration (swipe calls API so ratings are stored).

## Implementation status

Items **1–6** are implemented: scaffold, **Drizzle** + **SQLite** on **`CODEPIECE_DB`** (**`bun:sqlite`** / **`better-sqlite3`**), scanner CLI (memory + card upserts), ingest against **`TARGET_REPO`**, API routes (**`/api/users`**, **`/api/cards/next`**, **`/api/swipes`**, **`/api/cards/memo`**, **`/api/dashboard/stats`**), Next.js swipe UI (**pointer drag** + **Skip/Like** buttons, **attribution** footer incl. optional **short commit SHA**, **heuristic** context called out per ingestion rules), **snippet memos**, and **session dashboard stats** (header panel + library sidebar). **`bun run seed:samples`** loads demo cards. **Package manager:** **Bun** only. **Automated checks:** `bun test` and `bun run build` (see [`docs/TEST-SPEC.md`](../docs/TEST-SPEC.md)).

**Implementation map and backlog:** **[`FEATURES.md`](FEATURES.md)** — what this repository **implements** vs **[`docs/SPEC.md`](../docs/SPEC.md)**, **partial** areas, **deferred** work, and **optional polish** (`.tsx` ingestion, display name in UI, Drizzle migrations beyond **`INIT_SQL`**, keyboard shortcuts).

**Dev Compose** (bind-mounted **`docker-compose.yml`**) and **README** Docker notes are for local use only. **Production Compose + image + rollout** are **not** done yet — see **[`PRODUCTION.md`](PRODUCTION.md)**.

## See also

- **[`FEATURES.md`](FEATURES.md)** — shipped vs **SPEC**, partial areas, backlog, optional polish  
- [`docs/SPEC.md`](../docs/SPEC.md) — product goals and mechanics  
- [`docs/GUARDRAILS.md`](../docs/GUARDRAILS.md) — license, privacy, UX limits  
- [`docs/TECHNICAL.md`](../docs/TECHNICAL.md) — stack and ingestion rules  
- **[`PRODUCTION.md`](PRODUCTION.md)** — Docker Compose production rollout roadmap  
