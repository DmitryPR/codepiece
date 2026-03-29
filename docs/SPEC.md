# CodePiece — product specification (parsed)

## One-line summary

CodePiece is a swipe-based coding trivia/game platform where users discover, rate, and learn from real code snippets.

## Core idea

A fun, Tinder-like game for exploring and learning code by swiping through code snippets.

## Goals

- Help users understand code better.
- Let them rank and evaluate code pieces.
- Turn code exploration into a game-like, engaging experience.

## How it works

### 1. Discovery

- Show users code snippets or services.
- Focus on surfacing attractive or high-quality code.

### 2. Interaction (game mechanic)

- Users swipe left or right:
  - **Right** — Like.
  - **Left** — Skip / dislike.

### Snippet memo (optional personal note)

- A user may attach a **short memo** to a snippet they are viewing — a focused personal comment or learning note (not public chat).
- **Maximum length: 600 characters** (hard cap at input and storage so answers stay concise).
- Default intent: **private to that user** for the pair **(user, snippet card)**; visibility or sharing rules are a later product decision unless explicitly opened up.
- Memos complement swipes: they capture *why* something mattered or what to revisit, without replacing like/skip.

### 3. Matching

- Match users with:
  - Code owners.
  - Committers.
- Potential uses: learning, collaboration, or discussion.

### 4. Learning feedback loop

- Store history of viewed code.
- Track:
  - What users liked or disliked.
  - What they have already seen.
- Optional **snippet memos** (see above) deepen the loop: short, capped notes tied to specific cards.

### 5. Internal rating system

- Maintain a system to determine:
  - Which code is “good.”
  - Which code is popular or valuable.

## UI concept

- Simple card-based interface.
- Each card represents one code snippet.
- Swipe interactions (Tinder-like).

## Naming note

The working name in this spec is **CodePiece**. The repository identifier is **codepiece-hackathon**.

## See also

- **[`GUARDRAILS.md`](GUARDRAILS.md)** — constraints and anti-patterns (what not to build or optimize for).  
- **[`TECHNICAL.md`](TECHNICAL.md)** — implementation stack, database, ingestion, Docker.  
- **[`../plan/v1-plan.md`](../plan/v1-plan.md)** — execution plan and checklist for this repository.  
- **[`../plan/FEATURES.md`](../plan/FEATURES.md)** — what this repository **implements** relative to this spec, and what remains **backlog**.  
- **[`../plan/PRODUCTION.md`](../plan/PRODUCTION.md)** — Docker Compose production rollout.  
- **[`AGENTS.md`](AGENTS.md)** — read order and scope for LLM implementers.
