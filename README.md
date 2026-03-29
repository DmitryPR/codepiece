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

- **[`docs/SPEC.md`](docs/SPEC.md)** — product specification  
- **[`docs/GUARDRAILS.md`](docs/GUARDRAILS.md)** — what not to do (product guardrails)  
- **[`docs/TECHNICAL.md`](docs/TECHNICAL.md)** — stack, storage, ingestion, Docker  
- **[`plan/INITIAL.md`](plan/INITIAL.md)** — agent implementation plan (v1, pre-review)  
- **[`docs/AGENTS.md`](docs/AGENTS.md)** — how to use these docs as a coding agent  

## Sample scan targets

- **[`samples/`](samples/)** — bundled **`samples/mini-algorithms/`** (small `.ts` files) for local **`TARGET_REPO`** testing once `bun run scan` exists.  
- For a large real corpus, clone **[Lugriz/typescript-algorithms](https://github.com/Lugriz/typescript-algorithms)** and point **`TARGET_REPO`** at that path (see [`samples/README.md`](samples/README.md)).
