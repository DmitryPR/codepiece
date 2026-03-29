# Guidance for LLM and automated implementers

This file orients coding agents: **what to read first**, **which docs override others**, and **how agent-friendly** each document is.

**Root shortcut:** the repo-root **[`../AGENTS.md`](../AGENTS.md)** file points here. **Default verification** (below) is the **only** place that lists post-change commands — keep it aligned with **`TEST-SPEC.md`**; do not copy those commands into the root **`AGENTS.md`**.

## Cursor rules, skills, and agents (in this repo)

This project vendors selected material from **[everything-claude-code](https://github.com/affaan-m/everything-claude-code)** (MIT). **Use it** when working here:

| Path (repo root) | When to use |
|------------------|-------------|
| **[`../.cursor/rules/`](../.cursor/rules/)** | **Always** — Cursor loads `alwaysApply` rules; treat them as baseline engineering expectations. |
| **[`../.cursor/skills/`](../.cursor/skills/)** | When the task matches: **`bun-runtime`**, **`nextjs-turbopack`**, **`documentation-lookup`**, etc. Open the relevant **`SKILL.md`** and follow it. |
| **[`../agents/`](../agents/)** | When planning, reviewing TypeScript, or other flows those files describe. |

**Precedence:** **`GUARDRAILS.md`**, **`plan/v1-plan.md`**, and **`TEST-SPEC.md`** override generic upstream guidance for this product (e.g. coverage or E2E gates that are **not** enforced in CI here yet, or hackathon scope limits).

The editor workspace may still include a **sibling** checkout of **everything-claude-code** for diffing or updates—**do not** merge its whole tree into the app; refresh **this repo’s** copies only when intentionally syncing.

## Recommended read order

0. **[`COMMANDS.md`](COMMANDS.md)** — **copy-paste `bun run …` reference** (dev, scan, tests, DB). Read this first when you need to run or verify anything. Lives in **`docs/`** with the rest of the agent-oriented docs.
0a. **`../.cursor/rules/`** — effective immediately via Cursor; skim so you do not fight **`alwaysApply`** constraints.
1. **[`../plan/v1-plan.md`](../plan/v1-plan.md)** — implementation checklist, API sketch, data model. **Primary execution contract** for the hackathon slice.
2. **[`../plan/FEATURES.md`](../plan/FEATURES.md)** — **after the plan**, read for **what this repo already implements** vs **[`SPEC.md`](SPEC.md)**, plus **backlog** (gaps, optional polish). Use when mapping product ideas to code or scoping new work.
3. **[`TECHNICAL.md`](TECHNICAL.md)** — stack details: **Bun** as package manager, **`bun:sqlite`** / **`better-sqlite3`** on **`CODEPIECE_DB`**, Bun scanner vs Next.js, env table, who writes Cards vs swipes, local scanning.
4. **[`../plan/PRODUCTION.md`](../plan/PRODUCTION.md)** — when changing **Docker / deploy / rollout** (prod image, **`compose.prod.yml`**, CI). **Not** required for core feature work.
5. **[`GUARDRAILS.md`](GUARDRAILS.md)** — hard constraints (attribution, XSS, no dark patterns). Apply to UI and data you store on **Card** rows.
6. **[`SPEC.md`](SPEC.md)** — product intent and long-term features. **Do not implement everything here** without checking the plan and **FEATURES** (see conflicts below).

## Default verification

Unless **`TEST-SPEC.md`** or the task explicitly says otherwise, after substantive code changes run from the **repo root**:

```bash
bun test
bun run build
```

Details and isolation notes: **[`TEST-SPEC.md`](TEST-SPEC.md)**.

## Authority and scope (avoid scope creep)

| Topic | Source of truth |
|--------|-----------------|
| What to build for this slice | **`plan/v1-plan.md`** + **`TECHNICAL.md`** |
| Implemented vs SPEC + backlog | **`plan/FEATURES.md`** (shipped behavior, partial areas, deferred work) |
| Matching owners/committers, messaging | **Out of scope** (in SPEC narrative but deferred in the plan) |
| OAuth | **Out of scope** — anonymous session only |
| Card ingestion | **Bun CLI** only; Next.js **reads** Cards, **writes** swipes |
| Production Docker / rollout | **`plan/PRODUCTION.md`** (**`v1-plan.md`** is feature implementation only) |
| ECC-derived rules / skills / `agents/` | Apply as above; **GUARDRAILS**, **v1-plan**, **TEST-SPEC** win on conflicts |

If **`SPEC.md`** and **`plan/v1-plan.md`** disagree on features, **follow the plan** for this repository and leave extra SPEC items for **FEATURES** backlog.

## Per-file suitability for LLMs

### [`COMMANDS.md`](COMMANDS.md) — **fast lookup**

- Single table of **`package.json`** scripts + minimal env + typical **`bun`** flows. **Does not** replace **TECHNICAL** or **TEST-SPEC** for deep detail.

### [`plan/v1-plan.md`](../plan/v1-plan.md) — **strong**

- Ordered checklist, tables, API list, mermaid diagram, explicit in/out of scope.
- Env vars are summarized in **[`TECHNICAL.md`](TECHNICAL.md)**. **`TARGET_REPO`** quick default for **`seed:samples`**: [`samples/the-algorithms-typescript/`](../samples/the-algorithms-typescript/) (see [`samples/README.md`](../samples/README.md)).

### [`plan/FEATURES.md`](../plan/FEATURES.md) — **implementation map + backlog**

- **[`SPEC.md`](SPEC.md)** stays high level; **FEATURES** lists **what is built**, what is **only partial** relative to the spec, and what is **not implemented**. Optional polish from **`v1-plan.md`** is indexed here too. Use with **v1-plan** for checklist work and with **SPEC** for product questions.

### [`TECHNICAL.md`](TECHNICAL.md) — **strong**

- Clear **who writes what** (Bun vs Next.js), DB choices, scanning rules.
- **Gap:** No copy-paste schema DDL — entities are described in prose + plan table; agents must translate to migrations.

### [`../plan/PRODUCTION.md`](../plan/PRODUCTION.md) — **deploy roadmap**

- **Prod** Dockerfile, **`compose.prod.yml`**, CI push, volume backups, scan job pattern. Dev **`docker-compose.yml`** stays in **README** / **TECHNICAL**.

### [`GUARDRAILS.md`](GUARDRAILS.md) — **strong for constraints, weak for tasks**

- Excellent as a **checklist before shipping** (rendering, attribution, no leaderboard of devs).
- Many bullets assume social/matching features you are **not** building yet; agents should still enforce **code display**, **license/path on cards**, and **no `dangerouslySetInnerHTML`** for snippets.

### [`SPEC.md`](SPEC.md) — **good for intent, risky as sole spec**

- Clear user story and mechanics; **high level only** — no implementation inventory.
- **Risk:** Describes matching, internal rating system, and “services” broadly — agents may over-implement. **Cross-check with `v1-plan.md`** and **`plan/FEATURES.md`** (what is already built vs backlog).

### [`README.md`](../README.md) — **index + quick start**

- **Quick start** (scan → dev) and **Build and run**; **TECHNICAL** for env; **TROUBLESHOOTING** for ports, Docker, and scan edge cases.

## Suggested agent workflow

1. Honor **`../.cursor/rules/`** and pull in **`../.cursor/skills/`** when the task fits (Bun, Next/Turbopack, doc lookup).
2. Use **`docs/COMMANDS.md`** when running **dev**, **scan**, **tests**, or **db:stats** / **db:push** so flags and env match the repo.
3. Implement in the order of **`plan/v1-plan.md`** checklist.
4. After each vertical slice, re-read **GUARDRAILS** for anything touching displayed code or user data.
5. Follow **Default verification** when you change behavior or types.
6. When unsure whether a SPEC item is in scope, **default to omit** unless **`v1-plan.md`** lists it; confirm **`plan/FEATURES.md`** for what is already shipped vs backlog.

## See also

- **[`COMMANDS.md`](COMMANDS.md)** · **[`SPEC.md`](SPEC.md)** · **[`GUARDRAILS.md`](GUARDRAILS.md)** · **[`TECHNICAL.md`](TECHNICAL.md)** · **[`TROUBLESHOOTING.md`](TROUBLESHOOTING.md)** · **[`../plan/v1-plan.md`](../plan/v1-plan.md)** · **[`../plan/FEATURES.md`](../plan/FEATURES.md)** · **[`../plan/PRODUCTION.md`](../plan/PRODUCTION.md)** · **[`../AGENTS.md`](../AGENTS.md)**
