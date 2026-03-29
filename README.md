# codepiece-hackathon

Hackathon workspace for **CodePiece** — a swipe-based game for discovering and rating code snippets.

This repo uses **[Bun](https://bun.com)** for dependency installs, `bun test`, and `bun run scan`.

1. **Install Bun** — follow the official **[Installation](https://bun.com/docs/installation)** guide (install script, Homebrew tap `oven-sh/bun/bun`, npm, Docker, etc.).
2. **`command not found: bun`** — add Bun to your shell **`PATH`** as in **[Add Bun to your PATH](https://bun.com/docs/installation#add-bun-to-your-path)** (for example `export BUN_INSTALL="$HOME/.bun"` and `export PATH="$BUN_INSTALL/bin:$PATH"` after the curl installer, or use the path your package manager prints).

Then:

```bash
bun --version
bun install
bun test
bun run dev
```

### `bun run build` (production build)

`bun run build` runs **`next build`**. It:

- Type-checks the project and lints (per Next.js defaults).
- Compiles the **Next.js App Router** app (`app/`) into an optimized production bundle under **`.next/`**.

It does **not** start a server; it only produces the build output.

To **serve** that build locally:

```bash
bun run start   # runs `next start`
```

**Default port is [4000](http://localhost:4000)** (`next dev` / `next start` use **`-p 4000`** in `package.json`) so this app stays off **3000**, where many other Next.js or React apps run. That is a common convention for local side projects, not a framework requirement.

To use another port for one run: **`bun run dev -- -p 3000`** or **`bun run start -- -p 3000`**. To change the default, edit the **`dev`** and **`start`** scripts in [`package.json`](package.json).

Use the **same `CODEPIECE_DB`** for `bun run scan`, `bun run dev`, and `bun run start` so cards and swipes share one SQLite file (default: **`data/codepiece.db`** relative to the repo root).

- **[`docs/TEST-SPEC.md`](docs/TEST-SPEC.md)** — test commands and DB/runtime notes  
- **[`docs/SPEC.md`](docs/SPEC.md)** — product specification  
- **[`docs/GUARDRAILS.md`](docs/GUARDRAILS.md)** — what not to do (product guardrails)  
- **[`docs/TECHNICAL.md`](docs/TECHNICAL.md)** — stack, storage, ingestion, Docker  
- **[`plan/INITIAL.md`](plan/INITIAL.md)** — agent implementation plan (v1, pre-review)  
- **[`docs/AGENTS.md`](docs/AGENTS.md)** — how to use these docs as a coding agent  

## Sample scan targets

- **[`samples/`](samples/)** — bundled **`samples/mini-algorithms/`** (small `.ts` files) for local **`TARGET_REPO`** testing once `bun run scan` exists.  
- For a large real corpus, clone **[Lugriz/typescript-algorithms](https://github.com/Lugriz/typescript-algorithms)** and point **`TARGET_REPO`** at that path (see [`samples/README.md`](samples/README.md)).
