# Sample code for scanner testing

Two ways to exercise **`bun run scan`**:

## 1. Bundled mini repo (no clone)

Point **`TARGET_REPO`** at the **absolute or repo-relative path** to:

```text
samples/mini-algorithms/
```

From the repo root, the shortcut loads cards into the default DB (**`data/codepiece.db`**):

```bash
bun run seed:samples
```

Equivalent:

```bash
TARGET_REPO=./samples/mini-algorithms bun run scan -- --force
```

(`--force` ensures **Cards** are upserted even when **`data/scan-memory.json`** already lists these files as processed.)

This folder holds a few short `.ts` files with JSDoc-style context so you can validate parsing, card extraction, and DB upserts without network access.

## 2. Full algorithm corpus (recommended for realistic runs)

Clone **[Lugriz/typescript-algorithms](https://github.com/Lugriz/typescript-algorithms)** — TypeScript/JavaScript algorithms and data structures (educational, MIT-licensed, forked from the well-known javascript-algorithms curriculum).

```bash
git clone https://github.com/Lugriz/typescript-algorithms.git
TARGET_REPO=/absolute/path/to/typescript-algorithms bun run scan
```

Expect a **large** tree under `src/`; your scanner should still skip `node_modules`, `dist`, and other generated paths per [`docs/TECHNICAL.md`](../docs/TECHNICAL.md).

## Provenance

- **mini-algorithms** — small originals written for this hackathon repo to exercise the pipeline; not a verbatim copy of Lugriz.
- **Lugriz/typescript-algorithms** — third-party; respect its **LICENSE** when redistributing or quoting code outside this project.
