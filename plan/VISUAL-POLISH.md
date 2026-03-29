# Implementation Plan: Visual polish (STYLE.md alignment)

Format follows **[`agents/planner.md`](../agents/planner.md)** (planner agent spec).

## Overview

Bring the UI closer to **`docs/STYLE.md`**: shared radius and elevation tokens, calmer editor-like cards, stroke icons instead of emoji in chrome and empty states, accessible focus rings, and doc fixes so the style guide matches the app (logo size, theme boot).

## Requirements

- Honor **minimal first** and **code-editor cards** — one accent, subtle depth, no noisy gradients.
- **Icons:** stroke-based, ~2px, round caps; **no emoji** for primary chrome (per STYLE).
- **Tokens:** reusable `--cp-radius-*` and card shadow for consistency across home, swipe, stats panel.
- **A11y:** visible `:focus-visible` on interactive controls.
- **Docs:** `STYLE.md` reflects header logo height and inline head theme script.

## Architecture Changes

| Area | File | Change |
|------|------|--------|
| Tokens | `app/globals.css` | `--cp-radius-sm/md/lg`, `--cp-card-elev`, body font smoothing, focus-visible rules |
| Chrome | `app/app-shell.tsx` | `StatsIcon` SVG replaces emoji on Stats button |
| Swipe | `app/swipe-client.tsx` | Base card `box-shadow` + drag hints; empty-state hero SVGs |
| Home | `app/home-client.tsx` | Error color `var(--cp-error)`; optional radius tokens on key surfaces |
| Layout | `app/(app)/page.tsx`, `app/(app)/swipe/page.tsx` | Responsive horizontal padding via `clamp` |
| Spec | `docs/STYLE.md` | Logo ~64px; theme boot wording |

## Implementation Steps

### Phase 1: Foundations (globals + docs)

1. **Design tokens** (`app/globals.css`)
   - Action: Define `--cp-radius-sm|md|lg` on `:root`; on `body` set `--cp-card-elev: 0 6px 32px var(--cp-shadow)` (inherits themed shadow).
   - Why: One place to tune roundness and card lift per STYLE “rounded forms / subtle depth”.
   - Dependencies: None
   - Risk: Low

2. **Body & focus** (`app/globals.css`)
   - Action: `-webkit-font-smoothing: antialiased`; `a, button, select, textarea, input:focus-visible` outline using accent mix.
   - Why: Crisper type; keyboard navigation visible without heavy rings.
   - Dependencies: Step 1
   - Risk: Low — may need `outline: none` only where custom focus exists (none today)

3. **STYLE.md accuracy** (`docs/STYLE.md`)
   - Action: Header logo height **~64px**; replace “beforeInteractive script” with **inline `<head>` script** in `layout.tsx`.
   - Why: Single source of truth for implementers.
   - Dependencies: None
   - Risk: Low

### Phase 2: Components

4. **Stats button icon** (`app/app-shell.tsx`)
   - Action: Add small `StatsIcon` SVG (bar chart, stroke 2); remove 📊 from button label text or keep word “Stats” only with icon.
   - Why: Matches STYLE “stroke-based icons … no emoji for primary actions”.
   - Dependencies: None
   - Risk: Low

5. **Swipe card elevation** (`app/swipe-client.tsx`)
   - Action: Default `boxShadow: var(--cp-card-elev)` on the main `article`; combine with existing inset drag hint via comma-separated shadows when dragging.
   - Why: Card reads as elevated surface without competing with code.
   - Dependencies: Step 1
   - Risk: Low

6. **Empty deck hero** (`app/swipe-client.tsx` — `EmptyDeckWelcome`)
   - Action: Replace ✓ / 👋 emoji with decorative SVG (e.g. large stroke check in circle, simple “deck” or wave motif) with `aria-hidden`.
   - Why: Cohesive with Copy/Memo icons; still friendly.
   - Dependencies: None
   - Risk: Low

7. **Home error token** (`app/home-client.tsx`)
   - Action: Use `var(--cp-error)` instead of undefined `--cp-danger`.
   - Why: Correct theme mapping in all three palettes.
   - Dependencies: None
   - Risk: Low

8. **Page gutters** (`app/(app)/page.tsx`, `app/(app)/swipe/page.tsx`)
   - Action: `padding: clamp(16px, 4vw, 24px)` on `<main>`.
   - Why: Better small-screen margins without new components.
   - Dependencies: None
   - Risk: Low

## Testing Strategy

- Manual: Home, Swipe (with card + empty deck), open Stats panel — check themes **classic / harmony / elegance** for contrast and focus tab order.
- No new automated tests required (visual-only).

## Risks & Mitigations

- **Risk:** Stacked `box-shadow` on swipe card looks muddy on some themes.
  - Mitigation: Keep default elev subtle; inset hint only while dragging.

## Success Criteria

- [x] No emoji in header Stats control; empty-state hero uses SVG decoration.
- [x] Swipe card has consistent resting shadow; drag hint still readable.
- [x] Focus-visible visible on links, buttons, selects, textareas.
- [x] `STYLE.md` matches header logo and theme boot implementation.
- [x] Home error styling uses `--cp-error` on all themes.
