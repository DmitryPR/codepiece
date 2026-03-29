# Visual & UX style

This document is the north star for UI work in this project. It complements **[`SPEC.md`](SPEC.md)**, **[`TECHNICAL.md`](TECHNICAL.md)**, and other docs in this folder.

## Themes (user-selectable)

Three palettes are available from the header **Theme** control, persisted under **`localStorage['cp-theme']`**. Valid values: **`classic`** | **`harmony`** | **`elegance`**. **Default** (no saved value): **`classic`** (**Original**) — **`CP_THEME_DEFAULT`** in **`app/theme-context.tsx`**, **`:root`** in **`app/globals.css`**, and the boot script in **`app/layout.tsx`** stay aligned.

**`html[data-cp-theme="…"]`** selects variables in **`app/globals.css`**. A **`beforeInteractive`** script applies the saved theme before paint.

| `data-cp-theme` | Label in UI | Source |
|-----------------|-------------|--------|
| `classic` | Original (default) | First-ship dark UI (blue accent, green copy/saved, red errors / skip hint) |
| `harmony` | Monochrome | *Monochrome Harmony* (PDF) |
| `elegance` | Black & gold | *Black & Gold Elegance* (PDF) |

React state is synced in **`app/theme-context.tsx`**; the picker lives in **`app/theme-picker.tsx`**.

Shared semantics beyond base colors: **`--cp-body-bg`** (page behind cards; defaults to **`--cp-bg-deep`**), **`--cp-error`**, **`--cp-success`**, **`--cp-success-bg`**, **`--cp-swipe-skip`** (left-swipe inset). PDF themes map success/error to the accent family; **classic** uses distinct green and red.

**Implementation:** `app/globals.css` defines semantic **`--cp-*`** per theme. Swipe like hint uses **`color-mix(…, var(--cp-accent), …)`**; skip hint uses **`var(--cp-swipe-skip)`**. Derived tokens include **`--cp-border`**, **`--cp-border-input`**, **`--cp-icon-muted`**, **`--cp-accent-subtle`**, **`--cp-accent-tint`**, **`--cp-on-accent`**, **`--cp-overlay`**, and **`--cp-shadow`**.

## Palette: Original (classic) — default

Approximates the UI before PDF palettes: Twitter-adjacent dark grays, **`#1d9bf0`** primary actions / memo, **`#6ee7b7`** / **`#1a3d2e`** for copy/saved, **`#f87171`** for errors and skip-swipe hint. Page **`#0f1419`**, code wells **`#0b0d0f`**, cards **`#16181c`**.

## Palette: Monochrome Harmony

**Source:** *Monochrome Harmony* (PDF).

| Role | Hex | Notes |
|------|-----|--------|
| Deep background | `#242423` | Page, recessed code blocks, popover backdrop tone |
| Surface / chrome | `#333533` | Cards, side panel, elevated panels |
| Primary text | `#E8EDDF` | Body copy, labels |
| Muted / line | `#CFDBD5` | Borders, secondary text, skip-swipe hint (with alpha) |
| Accent | `#F5CB5C` | Primary CTA (Like), active memo, highlights, success ticks, like-swipe hint, emphasis errors |

## Palette: Black & Gold Elegance

**Source:** *Black & Gold Elegance* (PDF).

| Role | Hex | Notes |
|------|-----|--------|
| Deep background | `#000000` | Page, deepest panels |
| Surface / chrome | `#14213D` | Cards, side panel, elevated panels |
| Primary text | `#E5E5E5` | Body copy, labels |
| Muted / line | `#E5E5E5` | Borders and skip-swipe hint (mixed with surface / transparency); white `#FFFFFF` used in mixes for inputs |
| Accent | `#FCA311` | Primary CTA, memo active, highlights, like-swipe hint |

## Principles

**Minimal first.** Prefer fewer elements, neutral chrome, and clear typography over decoration. Every visual choice should earn its place: hierarchy, affordance, or a small moment of delight.

**Code-editor cards.** Snippet cards should feel like a focused editor surface: dark panes (`--cp-bg-deep` inside `--cp-surface`), subtle borders, monospace (or monospace-like) code blocks, and **one** warm accent (`--cp-accent`). Think “readable tool,” not “social feed chrome.”

**A fun touch, not a theme park.** Delight comes from small, intentional details: copy/memo controls that feel crisp, swipe hints that read clearly (accent = like; skip uses **`--cp-swipe-skip`** — muted in PDF themes, red in **classic**), a quick “Saved” or “Copied”. Avoid heavy motion, noisy gradients, or mascot-level whimsy that competes with the code.

## Concrete cues

- **Surfaces:** Page uses **`--cp-body-bg`** (falls back to **`--cp-bg-deep`**); recessed areas and header strip use **`--cp-bg-deep`**; cards/panels use **`--cp-surface`**. Borders from **`--cp-border`** / **`--cp-border-input`**.
- **Type:** System UI for chrome; code stays in `<pre>` / monospace. Keep labels short.
- **Icons:** Stroke-based, ~2px weight, round caps and joins—same family as the copy control. No emoji for primary actions.
- **Accent:** Sparingly—`--cp-accent` for primary actions and memo; **`--cp-swipe-skip`** for left-swipe feedback; **`--cp-error`** / **`--cp-success`** where appropriate.

When in doubt, simplify. If a new pattern doesn’t look at home next to a code editor, reconsider it.
