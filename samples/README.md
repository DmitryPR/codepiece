# Sample code for scanner testing

## 1. Bundled corpus (no clone)

The repo includes a **vendored, trimmed** copy of **[TheAlgorithms/TypeScript](https://github.com/TheAlgorithms/TypeScript)** under:

```text
samples/the-algorithms-typescript/
```

Provenance and upstream link: **[`the-algorithms-typescript/CODEPIECE.md`](the-algorithms-typescript/CODEPIECE.md)** (MIT; `test/` trees removed so only implementation `.ts` files are scanned).

From the repo root, **clear local SQLite + scan memory** (optional) and load cards into the default DB (**`data/codepiece.db`**):

```bash
bun run db:clear
bun run seed:samples
```

`REPO_LABEL` is set to **`TheAlgorithms/TypeScript`** so the app shows a stable repo name in the UI.

Equivalent manual scan:

```bash
REPO_LABEL=TheAlgorithms/TypeScript TARGET_REPO=./samples/the-algorithms-typescript bun run scan -- --force
```

(`--force` ensures **Cards** are upserted even when **`data/scan-memory.json`** already lists these files as processed.)

## 2. Other full trees (optional)

Clone any TypeScript repo locally and set **`TARGET_REPO`** (and optionally **`REPO_LABEL`**) — for example **[Lugriz/typescript-algorithms](https://github.com/Lugriz/typescript-algorithms)** for a large `src/` tree. See [`docs/TECHNICAL.md`](../docs/TECHNICAL.md) for skip rules (`node_modules`, `dist`, etc.).
