# CodePiece — feature backlog (SPEC gaps and future work)

Single place for **product and UX work** that goes beyond the shipped **v1** checklist in **[`INITIAL.md`](INITIAL.md)**. It maps **[`docs/SPEC.md`](../docs/SPEC.md)** to the current codebase: what is **missing**, **partial**, or **deferred on purpose**.

**How this fits**

- **[`docs/SPEC.md`](../docs/SPEC.md)** — long-term intent and mechanics (broader than v1).
- **[`INITIAL.md`](INITIAL.md)** — **v1 execution contract** (what was built for the hackathon slice).
- **This file** — backlog for **post-v1** and **SPEC-shaped** work that is not yet implemented.
- **[`PRODUCTION.md`](PRODUCTION.md)** — **deploy / ops** (image, Compose, CI), not user-facing features.

When **SPEC** and **INITIAL** disagree, **INITIAL + [`docs/GUARDRAILS.md`](../docs/GUARDRAILS.md)** still govern **what ships in v1**. Use **FEATURES** to queue **next** work; update this doc when you commit to a scope.

```mermaid
flowchart LR
  spec[docs_SPEC]
  initial[plan_INITIAL_v1]
  features[plan_FEATURES_backlog]
  prod[plan_PRODUCTION_ops]
  spec --> initial
  initial --> features
  prod -.->|"parallel track"| features
```

## From SPEC — not implemented or only partial

### Matching (owners / committers)

- **SPEC:** “Match users with code owners / committers” for learning or collaboration.
- **Now:** **Explicitly out of v1** in [`INITIAL.md`](INITIAL.md) — no OAuth, no contact flows.
- **Backlog:** Future **epic** only: opt-in identity, consent, channels that satisfy **[`docs/GUARDRAILS.md`](../docs/GUARDRAILS.md)** (privacy, no unsolicited contact). No implementation until there is an explicit product decision.

### Learning feedback loop (history, what was seen / liked)

- **SPEC:** Store history of viewed code; track likes, dislikes, and what was already seen.
- **Now:** Every **like/skip** is stored in **`swipes`**; **[`pickNextCard`](../src/lib/feed.ts)** excludes cards the user has already **swiped** (`notInArray` on swipe `card_id`s). There is **no** impression-only “seen without swipe” table, **no** history or “your likes” UI, **no** export of a learning trail.
- **Backlog:** Optional **`user_card_seen`** (or analytics events) if you need feed logic without a final swipe; UI for **session history** or **saved likes**; teaching aids (e.g. “why this snippet”) tied to GUARDRAILS.

### Internal rating system (“good” / popular code)

- **SPEC:** System to judge which code is good, popular, or valuable.
- **Partially shipped:** **`GET /api/dashboard/stats`** ([`app/api/dashboard/stats/route.ts`](../app/api/dashboard/stats/route.ts)) returns **snippet-level** aggregates (totals, **with memo** count, **top snippets by like count**) from SQLite via [`dashboard-stats.ts`](../src/lib/dashboard-stats.ts). The **topbar Stats** panel ([`app/app-shell.tsx`](../app/app-shell.tsx)) shows these metrics; after a **like**, the list **refetches** and the row can **reorder** (highlighted row, no motion animations). Rows show **symbol + `repo_label` + path** only (GUARDRAILS: no author leaderboard).
- **Still random feed:** Next card order remains **`RANDOM()`** in [`feed.ts`](../src/lib/feed.ts) — the dashboard does **not** change **`pickNextCard`**.
- **Backlog:** Spam / novelty guards; optional **score-biased** feed once product explicitly opts in; richer history UI.

### Discovery (“attractive or high-quality” surfacing)

- **SPEC:** Surface attractive or high-quality code.
- **Now:** “Quality” is mostly **ingestion** heuristics (size limits, JSDoc/heuristic context, path filters) — not a scored feed.
- **Backlog:** Connect discovery to **internal ratings** and safer ranking when that layer exists.

### Snippet memo (600-character personal note per card)

- **SPEC:** Users can leave an optional **memo** on a snippet — max **600** Unicode **code points**, private-by-default for **(user, card)**.
- **Shipped:** Table **`snippet_memos`** ([`src/db/schema.ts`](../src/db/schema.ts), [`init-sql.ts`](../src/db/init-sql.ts)); **`PUT /api/cards/memo`** ([`app/api/cards/memo/route.ts`](../app/api/cards/memo/route.ts)); **`memo`** on **`GET /api/cards/next`**; UI **copy icon** then **memo (lined-note) icon** on the card title row opens a **popover** with **textarea + Save** ([`app/swipe-client.tsx`](../app/swipe-client.tsx)); validation in [`src/lib/memo.ts`](../src/lib/memo.ts); **`getMemoBody` / `setMemoBody`** in [`src/lib/feed.ts`](../src/lib/feed.ts).
- **Follow-ups (optional):** rate limits; listing “all my memos”; grapheme-cluster length if you need stricter emoji counting than code points.

## From INITIAL — optional / later (implementation polish)

These were listed under **“Optional / later (not blocking v1)”** in [`INITIAL.md`](INITIAL.md); details stay here so **FEATURES** is the **single backlog index**.

- **`.tsx`** ingestion (JSX noise vs `.ts`-only v1).
- **Display name** on **`POST /api/users`** surfaced in the **UI** (API may already accept it).
- Formal **Drizzle migration** artifacts beyond runtime **`INIT_SQL`** in [`src/db/init-sql.ts`](../src/db/init-sql.ts).
- **Keyboard** shortcuts for like / skip (accessibility / power users).

## Platform / ops (not product features)

Production **Dockerfile**, **`compose.prod.yml`**, **CI** image push, **scan job** pattern, backups — tracked in **[`PRODUCTION.md`](PRODUCTION.md)**. Do not mix that checklist with user-facing **FEATURES** above; link both from **[`README.md`](../README.md)** when documenting releases.

## Shipped UX (swipe card)

- **`user-select: none`** on the draggable card so pointer-drag does not highlight text (copy is intentional via control only).
- **Copy** — duplicate-sheet **icon** on the title row (before memo) copies **`snippet_text`** ([`app/swipe-client.tsx`](../app/swipe-client.tsx) — `CopySnippetButton`, Clipboard API + `execCommand` fallback).
- **Personal memo** — **memo icon** to the right of **Copy**, popover **textarea** with **`n/600`**, **Save** → **`PUT /api/cards/memo`**; memo popover and controls excluded from swipe pointer capture.

## See also

- [`docs/SPEC.md`](../docs/SPEC.md) — product goals and mechanics  
- [`docs/GUARDRAILS.md`](../docs/GUARDRAILS.md) — constraints (especially social, ratings, attribution)  
- [`INITIAL.md`](INITIAL.md) — v1 scope and **implementation status**  
- [`PRODUCTION.md`](PRODUCTION.md) — production Compose rollout  
- [`docs/TECHNICAL.md`](../docs/TECHNICAL.md) — stack, DB, ingestion  
- [`docs/AGENTS.md`](../docs/AGENTS.md) — read order for implementers  
