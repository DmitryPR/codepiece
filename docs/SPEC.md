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
- **[`technical.md`](technical.md)** — implementation stack, database, ingestion, Docker.  
- **[`../plan/INITIAL.md`](../plan/INITIAL.md)** — agent implementation plan (v1).
