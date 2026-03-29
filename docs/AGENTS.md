# Guidance for LLM and automated implementers

This file orients coding agents: **what to read first**, **which docs override others**, and **how agent-friendly** each document is.

## Cursor rules, skills, and agents (in this repo)

This project vendors selected material from **[everything-claude-code](https://github.com/affaan-m/everything-claude-code)** (MIT). **Use it** when working here:

| Path (repo root) | When to use |
|------------------|-------------|
| **[`../.cursor/rules/`](../.cursor/rules/)** | **Always** — Cursor loads `alwaysApply` rules; treat them as baseline engineering expectations. |
| **[`../.cursor/skills/`](../.cursor/skills/)** | When the task matches: **`bun-runtime`**, **`nextjs-turbopack`**, **`documentation-lookup`**, etc. Open the relevant **`SKILL.md`** and follow it. |
| **[`../agents/`](../agents/)** | When planning, reviewing TypeScript, or other flows those files describe. |

**Precedence:** **`GUARDRAILS.md`**, **`plan/INITIAL.md`**, and **`TEST-SPEC.md`** override generic upstream guidance for this product (e.g. coverage or E2E gates that are **not** enforced in CI here yet, or hackathon scope limits).

The editor workspace may still include a **sibling** checkout of **everything-claude-code** for diffing or updates—**do not** merge its whole tree into the app; refresh **this repo’s** copies only when intentionally syncing.

## Recommended read order

0. **[`COMMANDS.md`](COMMANDS.md)** — **copy-paste `bun run …` reference** (dev, scan, tests, DB). Read this first when you need to run or verify anything. Lives in **`docs/`** with the rest of the agent-oriented docs.
0a. **`../.cursor/rules/`** — effective immediately via Cursor; skim so you do not fight **`alwaysApply`** constraints.
1. **[`../plan/INITIAL.md`](../plan/INITIAL.md)** — implementation checklist, API sketch, data model. **Primary execution contract for v1 features.**
2. **[`../plan/FEATURES.md`](../plan/FEATURES.md)** — **after INITIAL**, skim when planning **beyond v1**: SPEC gaps (matching, ratings, learning loop), optional polish, and how they differ from what is shipped.
3. **[`TECHNICAL.md`](TECHNICAL.md)** — stack details: **Bun** as package manager, **`bun:sqlite`** / **`better-sqlite3`** on **`CODEPIECE_DB`**, Bun scanner vs Next.js, env table, who writes Cards vs swipes, local scanning.
4. **[`../plan/PRODUCTION.md`](../plan/PRODUCTION.md)** — when changing **Docker / deploy / rollout** (prod image, **`compose.prod.yml`**, CI). **Not** required for core feature work.
5. **[`GUARDRAILS.md`](GUARDRAILS.md)** — hard constraints (attribution, XSS, no dark patterns). Apply to UI and data you store on **Card** rows.
6. **[`SPEC.md`](SPEC.md)** — product intent and long-term features. **Do not implement everything here in v1** (see conflicts below).

## Authority and scope (avoid scope creep)

| Topic | v1 source of truth |
|--------|-------------------|
| What to build now | **`plan/INITIAL.md`** + **`TECHNICAL.md`** |
| Post-v1 / SPEC-shaped backlog | **`plan/FEATURES.md`** (after v1 checklist is satisfied) |
| Matching owners/committers, messaging | **Out of scope** (in SPEC narrative but deferred in plan) |
| OAuth | **Out of scope** — anonymous session only |
| Card ingestion | **Bun CLI** only; Next.js **reads** Cards, **writes** swipes |
| Production Docker / rollout | **`plan/PRODUCTION.md`** ( **`plan/INITIAL.md`** is feature-only) |
| ECC-derived rules / skills / `agents/` | Apply as above; **GUARDRAILS**, **INITIAL**, **TEST-SPEC** win on conflicts |

If **`SPEC.md`** and **`plan/INITIAL.md`** disagree on features, **follow the plan** for v1 and leave SPEC items as future work.

## Per-file suitability for LLMs

### [`COMMANDS.md`](COMMANDS.md) — **fast lookup**

- Single table of **`package.json`** scripts + minimal env + typical **`bun`** flows. **Does not** replace **TECHNICAL** or **TEST-SPEC** for deep detail.

### [`plan/INITIAL.md`](../plan/INITIAL.md) — **strong**

- Ordered checklist, tables, API list, mermaid diagram, explicit in/out of scope.
- Env vars are summarized in **[`TECHNICAL.md`](TECHNICAL.md)**. **`TARGET_REPO`** quick default: [`samples/mini-algorithms/`](../samples/mini-algorithms/) (see [`samples/README.md`](../samples/README.md)).

### [`plan/FEATURES.md`](../plan/FEATURES.md) — **backlog index**

- Maps **[`SPEC.md`](SPEC.md)** to **gaps** (matching, internal ratings, learning UI) and mirrors **optional/later** items from **INITIAL**. Use when the task is **not** on the v1 checklist.

### [`TECHNICAL.md`](TECHNICAL.md) — **strong**

- Clear **who writes what** (Bun vs Next.js), DB choices, scanning rules.
- **Gap:** No copy-paste schema DDL — entities are described in prose + plan table; agents must translate to migrations.

### [`../plan/PRODUCTION.md`](../plan/PRODUCTION.md) — **deploy roadmap**

- **Prod** Dockerfile, **`compose.prod.yml`**, CI push, volume backups, scan job pattern. Dev **`docker-compose.yml`** stays in **README** / **TECHNICAL**.

### [`GUARDRAILS.md`](GUARDRAILS.md) — **strong for constraints, weak for tasks**

- Excellent as a **checklist before shipping** (rendering, attribution, no leaderboard of devs).
- Many bullets assume social/matching features you are **not** building yet; agents should still enforce **code display**, **license/path on cards**, and **no `dangerouslySetInnerHTML`** for snippets.

### [`SPEC.md`](SPEC.md) — **good for intent, risky as sole spec**

- Clear user story and mechanics.
- **Risk:** Describes matching, internal rating system, and “services” broadly — agents may over-implement. **Always cross-check with INITIAL.**

### [`README.md`](../README.md) — **index + quick start**

- **Quick start** (scan → dev) and **Build and run**; **TECHNICAL** for env; **TROUBLESHOOTING** for ports, Docker, and scan edge cases.

## Suggested agent workflow

1. Honor **`../.cursor/rules/`** and pull in **`../.cursor/skills/`** when the task fits (Bun, Next/Turbopack, doc lookup).
2. Use **`docs/COMMANDS.md`** when running **dev**, **scan**, **tests**, or **db:stats** / **db:push** so flags and env match the repo.
3. Implement in the order of **`plan/INITIAL.md`** checklist.
4. After each vertical slice, re-read **GUARDRAILS** for anything touching displayed code or user data.
5. When unsure whether a SPEC feature is v1, **default to omit** unless INITIAL lists it; confirm against **`plan/FEATURES.md`** for queued post-v1 work.

## See also

- **[`COMMANDS.md`](COMMANDS.md)** · **[`SPEC.md`](SPEC.md)** · **[`GUARDRAILS.md`](GUARDRAILS.md)** · **[`TECHNICAL.md`](TECHNICAL.md)** · **[`TROUBLESHOOTING.md`](TROUBLESHOOTING.md)** · **[`../plan/INITIAL.md`](../plan/INITIAL.md)** · **[`../plan/FEATURES.md`](../plan/FEATURES.md)** · **[`../plan/PRODUCTION.md`](../plan/PRODUCTION.md)**
