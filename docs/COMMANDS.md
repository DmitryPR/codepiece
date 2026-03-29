# CodePiece — commands (cheat sheet)

Run from the **repository root** with **[Bun](https://bun.com)**. Install: **`bun install`** (Bun only — not npm/yarn/pnpm).

| Command | What it does |
|--------|----------------|
| `bun install` | Install dependencies (`bun.lock`). |
| `bun run dev` | Next.js dev on **4000** only, Turbopack + hot reload. |
| `bun run dev:webpack` | Dev on **4000** only, Webpack instead of Turbopack. |
| `bun run build` | Production build → `.next/` (typecheck + Next lint). |
| `bun run start` | Serve production build on **4000** only. |
| `bun run scan` | Scan **`TARGET_REPO`**; writes **cards** + scan memory. Set **`TARGET_REPO`** (path to a repo or tree). |
| `bun run seed:samples` | Scan **`samples/mini-algorithms`** with **`--force`** into the DB (quick local data). |
| `bun run db:stats` | Read-only SQLite report (users, cards, swipes, **`snippet_memos`**, breakdowns, file sizes). Respects **`CODEPIECE_DB`**. |
| `bun run db:push` | **Drizzle Kit** — push **`src/db/schema.ts`** to the SQLite file (**`CODEPIECE_DB`**). Use when the schema changes; normal dev creates tables via **`INIT_SQL`** on first open. |
| `bun test` | Full test suite. |
| `bun run test:scan` | Scanner + `src/lib` tests only. |
| `bun run test:web` | `tests/web` only. |

## Environment (minimal)

| Variable | Role | Default |
|----------|------|---------|
| **`CODEPIECE_DB`** | SQLite file path | `data/codepiece.db` |
| **`TARGET_REPO`** | Tree to scan (`bun run scan`) | (required for scan unless using **`seed:samples`**) |

Full env table: **[`TECHNICAL.md`](TECHNICAL.md)**. Ports, Docker, **`scan --force`**: **[`TROUBLESHOOTING.md`](TROUBLESHOOTING.md)**. Tests: **[`TEST-SPEC.md`](TEST-SPEC.md)**.

## Typical flows

**Local app with sample cards**

```bash
bun install
bun run seed:samples
bun run dev
```

**Verify before a PR**

```bash
bun install
bun test
bun run build
```

**Inspect database**

```bash
bun run db:stats
```
