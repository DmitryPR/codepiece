# CodePiece v1 — agent implementation plan

Pre-review roadmap for implementers and coding agents. Follow **[`docs/technical.md`](../docs/technical.md)** for stack choices; align product behavior with **[`docs/SPEC.md`](../docs/SPEC.md)** and **[`docs/GUARDRAILS.md`](../docs/GUARDRAILS.md)**.

## Purpose and constraints

**In scope (v1)**

- Swipe UX (like / skip) with persistence.
- Users, swipes, and “seen” cards in a simple relational store.
- TypeScript-only ingestion: **`bun run scan`** **writes** scan memory and **`Card`** rows to **Postgres or a lightweight DB**; the **Next.js** app **reads** **Cards** for the feed and **writes** **ratings/swipes** (and users) to the **same database** when code is rated.
- Docker Compose to run the app stack locally.

**Explicitly defer**

- **Any OAuth** (Google, GitHub, etc.) — v1 uses anonymous/session users only.
- Matching users to owners/committers, messaging, or contact flows.
- Parsers for languages other than TypeScript.
- ML ranking or distributed job queues (see technical “not in v1”).

## Target architecture

```mermaid
flowchart LR
  subgraph docker [DockerCompose]
    web[NextApp_API]
    db[(Postgres_or_lightweight_DB)]
  end
  cli[Bun_scan_CLI]
  mem[scan_memory]
  repo[TargetRepo]
  cli --> repo
  cli --> mem
  cli -->|"upsert_Card_rows"| db
  web -->|"read_Cards"| db
  web -->|"write_swipes_users"| db
```

- **Next.js** hosts the UI and **Route Handlers** (or `/api/*`). It **reads** **Card** rows from **Postgres** (or SQLite, etc.) for the feed; it **writes** **swipe/rating** rows (and **User** rows) when the user rates a snippet. It **does not** run the repo scanner or mutate **Card** rows.
- **`bun run scan`** is a **Bun** CLI run **locally** against `TARGET_REPO`. It **writes** to the **same `DATABASE_URL`** as the app: (1) **scan memory** (file or table) and (2) **`Card`** upserts — the **snippet index** for the feed. No remote ingestion service.
- Until a scan has populated **Card** rows, `/api/cards/next` may return empty; document this in the README quick start.

## Data model (minimal)

Implement with one ORM/query layer (Drizzle, Prisma, or Kysely — pick one). Use **Postgres** or **SQLite** (or similar); **Bun scanner and Next.js must share one `DATABASE_URL`**.

| Entity | Fields (conceptual) |
|--------|---------------------|
| **User** | `id`, optional display label, `created_at` — **no OAuth**; no verified external identity in v1 |
| **Card** | Stable `id`; `source_path`; `symbol_name`; `snippet_text`; `line_start` / `line_end`; `context_summary` (JSDoc first line or machine-labeled heuristic); **provenance** per GUARDRAILS: `repo_url` or `repo_label`, `license` (string / SPDX when known), optional `commit_sha` |
| **Swipe** | `user_id`, `card_id`, `action` (`like` \| `skip`), `created_at` |
| **Seen / feed** | Either derive “seen” from swipes only, or add a `user_card_seen` table if you need impressions without a final swipe — **next-card** must exclude already shown for that user ([`docs/SPEC.md`](../docs/SPEC.md)) |

## Ingestion pipeline (TypeScript v1)

1. Walk the target repo tree from a **local path** (env e.g. **`TARGET_REPO`**), i.e. a clone on disk next to or anywhere on the developer machine — **not** fetched over the network by the scanner.
2. **Exclude** `node_modules`, `dist`, `build`, `.git`, and obvious generated paths/patterns (`*.generated.ts`, etc.).
3. Parse **`.ts` first**; defer **`.tsx`** to a follow-up if JSX adds noise ([`docs/technical.md`](../docs/technical.md)).
4. Use **TypeScript compiler API** or **ts-morph** to collect **functions** and **methods** with body **under ~200 lines**; skip oversize symbols; on parse failure, record skip reason in scan memory.
5. **Context**: prefer JSDoc or first line of a leading block comment; otherwise a short heuristic from name + signature, stored with a flag or prefix so UI can label it as non-author docs.
6. **Idempotency**: use scan memory + content hash so unchanged files are not fully reprocessed every run.
7. **Persist cards**: for each accepted symbol, **upsert** a **Card** row into **Postgres / SQLite** via the shared DSN (snippet text, path, lines, context, provenance). This **fills the feed index**; Next.js **selects** from these rows only.

## API surface (minimal)

| Method | Path | Purpose |
|--------|------|--------|
| `POST` | `/api/users` | Lazy-create anonymous user (cookie/session); optional display name only — **no OAuth** |
| `GET` | `/api/cards/next` | Query param `userId` (or session); returns next unseen **Card** or empty |
| `POST` | `/api/swipes` | JSON: `cardId`, `action` (`like` \| `skip`); **persists** the rating/swipe row in the DB for the current user |

Cookie or opaque session id for `userId` is enough for v1. No third-party auth tokens. **Every swipe must be stored** so the feed and feedback loop stay consistent with [`docs/SPEC.md`](../docs/SPEC.md).

## UI work

- Single **Next.js** page: monospace **code** block, **context** line, **attribution** footer (repo, license, path) per [`docs/GUARDRAILS.md`](../docs/GUARDRAILS.md).
- **Swipe**: pointer/touch gestures plus **left/right buttons** for accessibility.
- On swipe success, fetch **next** card from the API.

## Docker and local run

- **`docker-compose.yml`**: **`web`** (Next.js) + **`db`** (Postgres) is a good default; or SQLite on a mounted volume. Same **`DATABASE_URL`** for **`bun run scan`** (writes **Cards**) and the app (**reads** **Cards**, **writes** **swipes**).
- **Flow A**: `docker compose up` — use the app in the browser.
- **Flow B**: run **`bun run scan`** on the **host** with `TARGET_REPO` pointing at your **local clone** (simplest). Alternatively mount that clone into a one-off scanner container. Scanning stays **local**; no OAuth or cloud scanner.

## Runtime: Bun vs Next

Prefer **Bun** for the scanner CLI and any standalone scripts ([`docs/technical.md`](../docs/technical.md)). If **Next.js** fails to build or run reliably under Bun in the container, use **Node** only for the Next.js build/dev stage; do not block the hackathon on toolchain edge cases.

## Agent execution order (checklist)

1. **Scaffold** the repo: `package.json`, `tsconfig`, flat `src/` (or minimal `apps/web` only if you split later — prefer flat if it stays simpler).
2. **Database**: schema + migrations; **Postgres** (e.g. in Compose) or **SQLite** file — single **`DATABASE_URL`** for both processes.
3. **Scanner CLI** (`bun run scan`): **scan memory** + **Card** upserts (Bun **writes** cards only).
4. **Ingest**: run scanner locally against `TARGET_REPO`; confirm **Card** count increases and `/api/cards/next` returns data (document in README).
5. **API** routes: user lazy-create, next card, **`POST /api/swipes`** **persisting** ratings to the DB; verify with **curl** or a tiny test script.
6. **Next.js** page: card display + swipe + API integration (swipe calls API so ratings are stored).
7. **`Dockerfile`** + **`docker-compose.yml`** + short **Quick start** in [`README.md`](../README.md).

## See also

- [`docs/SPEC.md`](../docs/SPEC.md) — product goals and mechanics  
- [`docs/GUARDRAILS.md`](../docs/GUARDRAILS.md) — license, privacy, UX limits  
- [`docs/technical.md`](../docs/technical.md) — stack and ingestion rules  
