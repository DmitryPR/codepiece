# Guidance for LLM and automated implementers

This file orients coding agents: **what to read first**, **which docs override others**, and **how agent-friendly** each document is.

## Recommended read order

1. **[`../plan/INITIAL.md`](../plan/INITIAL.md)** — implementation checklist, API sketch, data model. **Primary execution contract for v1 features.**
2. **[`TECHNICAL.md`](TECHNICAL.md)** — stack details: **Bun** as package manager, **`bun:sqlite`** / **`better-sqlite3`** on **`CODEPIECE_DB`**, Bun scanner vs Next.js, env table, who writes Cards vs swipes, local scanning.
3. **[`../plan/PRODUCTION.md`](../plan/PRODUCTION.md)** — when changing **Docker / deploy / rollout** (prod image, **`compose.prod.yml`**, CI). **Not** required for core feature work.
4. **[`GUARDRAILS.md`](GUARDRAILS.md)** — hard constraints (attribution, XSS, no dark patterns). Apply to UI and data you store on **Card** rows.
5. **[`SPEC.md`](SPEC.md)** — product intent and long-term features. **Do not implement everything here in v1** (see conflicts below).

## Authority and scope (avoid scope creep)

| Topic | v1 source of truth |
|--------|-------------------|
| What to build now | **`plan/INITIAL.md`** + **`TECHNICAL.md`** |
| Matching owners/committers, messaging | **Out of scope** (in SPEC narrative but deferred in plan) |
| OAuth | **Out of scope** — anonymous session only |
| Card ingestion | **Bun CLI** only; Next.js **reads** Cards, **writes** swipes |
| Production Docker / rollout | **`plan/PRODUCTION.md`** ( **`plan/INITIAL.md`** is feature-only) |

If **`SPEC.md`** and **`plan/INITIAL.md`** disagree on features, **follow the plan** for v1 and leave SPEC items as future work.

## Per-file suitability for LLMs

### [`plan/INITIAL.md`](../plan/INITIAL.md) — **strong**

- Ordered checklist, tables, API list, mermaid diagram, explicit in/out of scope.
- Env vars are summarized in **[`TECHNICAL.md`](TECHNICAL.md)**. **`TARGET_REPO`** quick default: [`samples/mini-algorithms/`](../samples/mini-algorithms/) (see [`samples/README.md`](../samples/README.md)).

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

- **Quick start** (scan → dev) and **Build and run**; link to **TECHNICAL** for env details.

## Suggested agent workflow

1. Implement in the order of **`plan/INITIAL.md`** checklist.
2. After each vertical slice, re-read **GUARDRAILS** for anything touching displayed code or user data.
3. When unsure whether a SPEC feature is v1, **default to omit** unless INITIAL lists it.

## See also

- **[`SPEC.md`](SPEC.md)** · **[`GUARDRAILS.md`](GUARDRAILS.md)** · **[`TECHNICAL.md`](TECHNICAL.md)** · **[`../plan/INITIAL.md`](../plan/INITIAL.md)** · **[`../plan/PRODUCTION.md`](../plan/PRODUCTION.md)**
