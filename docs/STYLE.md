# Visual & UX style

This document is the north star for UI work in this project. It complements **[`SPEC.md`](SPEC.md)**, **[`TECHNICAL.md`](TECHNICAL.md)**, and other docs in this folder.

## Brand identity & logo

**Logo asset:** [`public/brand/codepiece-logo.png`](../public/brand/codepiece-logo.png) — full wordmark with icon (**curly brace** + **interlocking puzzle pieces**). Used in the app header ([`app/app-shell.tsx`](../app/app-shell.tsx)): link to **`/`**, **`alt="CodePiece"`**, scaled height **~42px** (width follows aspect ratio).

**Logo-on-black:** The master artwork is designed on **deep black** (`#000000`). On non-black headers, the PNG’s own background still reads as brand-correct; avoid placing the full wordmark on busy patterns.

### Brand palette (from logo)

Use these for **marketing**, **splash**, or **accent experiments** — existing app themes (**classic** / **harmony** / **elegance**) stay the default chrome; pull from here when you want alignment with the logo.

| Role | Approx. hex | Notes |
|------|-------------|--------|
| **Blue → cyan (Code / structure)** | `#1e90ff` → `#00e5ff` | “Code” side of wordmark; brace gradient; primary technical accent family. |
| **Orange → amber (highlights)** | `#ff6b35` → `#ffd166` | Top puzzle piece; warm CTAs or highlights paired with blues. |
| **Purple → magenta (Piece / module)** | `#7c3aed` → `#e879f9` | Lower puzzle piece; “piece” / module emphasis. |
| **Deep black (canvas)** | `#000000` | Logo backdrop; strongest brand contrast. |

### Style cues from logo

- **Gradients:** Smooth linear blends (blue↔cyan on structure; orange↔purple on puzzle/wordmark tail). Prefer **subtle** gradients in UI — one accent gradient is enough; do not compete with code blocks.
- **Shape:** **Rounded** forms (brace, puzzle tabs). Prefer **border-radius** on buttons and panels consistent with existing **`--cp-*`** themes.
- **Typography (marketing):** Modern **sans-serif**, slightly **oblique** for energy; in-app chrome stays **system UI** unless we introduce a dedicated display font later.
- **Motifs:** **Modular** / **interlocking** — optional future illustration or empty states; keep the **swipe deck** visually calm per **Principles** below.

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
