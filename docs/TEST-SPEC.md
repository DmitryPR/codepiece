# CodePiece — test specification (execution)

How to run tests and what each suite proves. Use this while implementing or reviewing changes.

## Commands

Install Bun using the official **[Installation](https://bun.com/docs/installation)** guide. If the shell cannot find `bun`, configure **`PATH`** per **[Add Bun to your PATH](https://bun.com/docs/installation#add-bun-to-your-path)**.

| Command | Purpose |
|---------|--------|
| `bun install` | Install dependencies (run once after clone). **Use Bun only** — not npm/yarn/pnpm (see [`TECHNICAL.md`](TECHNICAL.md)). |
| `bun test` | Full suite: scanner unit tests, DB integration, Next API route tests. |
| `bun run test:scan` | `src/scan` + `src/lib` (scanner + `card-id` unit tests). |
| `bun run test:web` | Only `tests/web/**/*.test.ts`. |
| `bun run scan` | CLI smoke (requires `TARGET_REPO` and writable `CODEPIECE_DB` / default `data/`). |
| `bun run seed:samples` | Loads **`samples/mini-algorithms`** into **`data/codepiece.db`** with **`--force`** (handy after an empty DB + existing scan memory). |
| `bun run db:stats` | Read-only SQLite summary (**`CODEPIECE_DB`**): counts, swipes by action, per-user swipes, cards by **`repo_label`**, file sizes. |

For **complete** local verification before a PR:

```bash
bun install
bun test
bun run build
```

**`bun run build`** runs **`next build`**: typecheck, lint, and write the production bundle to **`.next/`**. It does not open a URL. To run the built app, use **`bun run start`** and open **[http://localhost:4000](http://localhost:4000)** (port **4000** in [`package.json`](../package.json)). Port conflicts and dev issues: **[`TROUBLESHOOTING.md`](TROUBLESHOOTING.md)**.

**Optional CLI smoke** (writes under `data/` unless you override **`CODEPIECE_DB`**):

```bash
bun run seed:samples
```

Or: `TARGET_REPO=./samples/mini-algorithms bun run scan -- --force` if you need **`--force`** explicitly.

## Environment used in tests

- **`bun test`** runs under the **Bun** runtime: the DB layer uses **`bun:sqlite`** (see [`src/db/client.ts`](../src/db/client.ts)). **`next build` / `next dev`** run on **Node** and use **`better-sqlite3`**. Both hit the same schema and SQL.
- **`CODEPIECE_DB=:memory:`** — set inside tests so SQLite is isolated; do not rely on `data/codepiece.db` in CI.
- **`TARGET_REPO`** — only required for manual `bun run scan` or optional e2e (not required for `bun test`).
- Full env reference: **[`TECHNICAL.md`](TECHNICAL.md)** (“Environment variables”).

## Scanner tests (`src/scan/*.test.ts`)

| File | Covers |
|------|--------|
| `paths.test.ts` | Path ignore rules (`node_modules`, `dist`, `.d.ts`), directory walk, content hash, LICENSE hint. |
| `extract.test.ts` | ts-morph extraction: JSDoc context, line limit (~200 LOC), class methods. |
| `memory.test.ts` | JSON scan-memory load/save roundtrip. |
| `run-scan.test.ts` | End-to-end: temp tree → `runScan()` → rows in **`cards`** table (`:memory:` DB). |

## Library tests

| File | Covers |
|------|--------|
| `src/lib/card-id.test.ts` | Deterministic card id hashing (`repo + path + symbol`). |

## Next.js / API tests (`tests/web/*.test.ts`)

| File | Covers |
|------|--------|
| `api-routes.test.ts` | **Route handlers** imported directly: seed `:memory:` DB + `GET /api/cards/next` (cookie session) + `POST /api/swipes` persistence + empty deck after swipe + 400 on bad action. |

These tests **do not** start the HTTP server; they call `GET`/`POST` exported functions with `Request` objects.

## UI

The swipe UI (`app/swipe-client.tsx`) is thin; API tests cover the contract it depends on. Optional follow-up: Playwright or component tests with `happy-dom` — not required for v1 in this repo.

## Manual smoke (after scan + dev)

1. `bun run seed:samples` (or `TARGET_REPO=./samples/mini-algorithms bun run scan -- --force`)
2. `bun run dev` (port **4000**, Turbopack). **`EADDRINUSE`** or stale dev cache: **[`TROUBLESHOOTING.md`](TROUBLESHOOTING.md)**.
3. Open **[http://localhost:4000](http://localhost:4000)** — a card should appear; Like/Skip should succeed in the network tab.

## Docker (optional manual check)

1. `docker compose up` (see **[README.md](../README.md)**).
2. On the **host**, with the same DB path the container uses: `TARGET_REPO=./samples/mini-algorithms CODEPIECE_DB=data/codepiece.db bun run scan`
3. Reload the app in the browser. Hot reload / restarts: **[`TROUBLESHOOTING.md`](TROUBLESHOOTING.md)**.

## See also

- [`COMMANDS.md`](COMMANDS.md) — **`bun run …`** scripts (quick reference).  
- [`TECHNICAL.md`](TECHNICAL.md) — stack, DB ownership, environment variables.  
- [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) — ports, Docker, scan, UI.  
- [`plan/INITIAL.md`](../plan/INITIAL.md) — feature checklist and **Implementation status**.  
- [`plan/PRODUCTION.md`](../plan/PRODUCTION.md) — production Docker / Compose rollout (not covered by automated tests here).  
- [`AGENTS.md`](AGENTS.md) — doc read order for implementers.
