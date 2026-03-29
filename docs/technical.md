# CodePiece — technical notes

Companion to [`SPEC.md`](SPEC.md) and [`GUARDRAILS.md`](GUARDRAILS.md). This describes how we intend to implement the first version without over-scoping the hackathon.

## Runtime and local development

- The project should **run locally with minimal friction**. **Bun** is an acceptable (and preferred) runtime for scripts, tooling, and the API layer where it simplifies setup and matches team preference.
- **TypeScript** is the default language for application code (server, ingestion, shared types). Keep the toolchain boring: one package manager/runtime story, clear `package.json` / `bunfig` as needed.

## UI

- Use a **small Next.js** surface: one or a few pages, card stack + swipe, minimal styling. No requirement for a large component library in v1.
- The UI talks to a **simple backend API** (same repo or adjacent package) rather than embedding heavy business logic in client-only code.

## Data storage

- Use a **simple database** for:
  - **Users** — minimal profile; optional **link to GitHub username** (store the handle as a string, verify via OAuth or “enter your GitHub username” only if you accept impersonation risk for demos).
  - **Ratings / swipes** — which user liked or skipped which card, timestamps if useful.
  - **Seen cards** — enough to avoid showing the same snippet again (or to power recommendations later).
- SQLite (file or volume) is enough for v1; Postgres in Docker is fine if you want one `docker compose` stack that matches production-shaped habits. The point is: **relational, small schema**, not a distributed data platform.

## Docker

- **Docker Compose** (or a single Dockerfile + compose) should **run the whole thing**: app server, database if not SQLite-in-volume, and any worker used for scanning. Avoid a dozen optional services.
- Developers should be able to run **`docker compose up`** (or the documented equivalent) and hit the Next.js URL without manual secret hunting for a demo.

## Code ingestion and “cards”

- **Scanning** should stay **simple**: walk a repository tree, parse TypeScript (see below), extract candidate **functions** (and small methods) for cards.
- **Do not** prioritize or ingest **generated** code: skip common output paths (`dist/`, `build/`, `*.generated.ts`, vendor bundles, etc.) and heuristics for generated markers where cheap.
- **Size cap**: prefer snippets from **functions under ~200 lines** so cards stay readable and “fun” rather than wall-of-code.
- **Context**: attach a **short, automatic summary** of what the symbol does when feasible (e.g. leading comment, JSDoc first line, or a one-line heuristic from the signature and name). Keep it honest — label machine-derived text as such if it is not human-written docs.

## Languages

- **v1: TypeScript only** (`.ts` / `.tsx` with sensible handling of JSX noise — e.g. focus on `.ts` first if parsing `.tsx` is noisy).
- **Later**: add parsers or tree-sitter grammars for more languages using the same card pipeline and DB shape.

## Scan memory (idempotent ingestion)

- Maintain a **small, explicit memory file** (or table) of **what was already scanned** and **what was skipped** (path, reason: too large, generated, unsupported extension, parse error). This avoids reprocessing unchanged files on every run and makes debugging ingestion easy.
- Format can be JSON or SQLite rows; key is **deterministic keys** (repo id + file path + optional commit SHA or content hash).

## What we are not building in v1

- No distributed job queue unless you outgrow a single process.
- No ML ranking beyond simple aggregates (unless you explicitly add it later).
- No complex monorepo orchestration beyond what Docker and one compose file need.

## See also

- **[`SPEC.md`](SPEC.md)** — product behavior and goals.  
- **[`GUARDRAILS.md`](GUARDRAILS.md)** — license, privacy, and UX constraints that affect implementation choices.
