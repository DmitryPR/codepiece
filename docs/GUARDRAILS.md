# CodePiece — product guardrails (what not to do)

Companion to [`SPEC.md`](SPEC.md). These constraints protect users, contributors, and the integrity of the product. They are intentionally conservative; you can revisit them if the product scope changes.

## User experience and trust

- **Do not** optimize for endless, mindless swiping alone. If the loop has no learning payoff (context, explanation, or next step), it is entertainment without the stated goal.
- **Do not** hide what a swipe means. Likes, skips, and any downstream effects (matching, notifications) must be understandable before users commit.
- **Do not** use shame, streak-loss punishment, or manipulative urgency (“your rank drops in 1 hour”) to drive engagement.
- **Do not** present dislikes or low ratings as public humiliation for authors or repos. Aggregate and anonymize where scores are shown.

## Privacy, safety, and social features

- **Do not** expose real identities, emails, or exact locations by default from “matching” with owners or committers. Opt-in and clear consent only.
- **Do not** enable unsolicited direct contact without both sides agreeing to a channel you control (or a disclosed third party) and easy block/report.
- **Do not** build matching or messaging for minors without age gates and policies appropriate to your jurisdiction.
- **Do not** retain detailed behavioral logs longer than you need for the stated learning and ranking goals; define retention and stick to it.

## Code, licensing, and attribution

- **Do not** ship snippets without **license visibility** and **source attribution** (repo, path, commit or tag when possible). Users and authors must see provenance on every card.
- **Do not** treat “public on GitHub” as unlimited rights to redistribute. Respect licenses (copyleft, no-derivatives, etc.) and exclude or gate incompatible code.
- **Do not** strip copyright headers or SPDX identifiers when displaying code.

## Ratings and “good code”

- **Do not** publish a single leaderboard of “best developers” from swipe data. That invites brigading and misreads popularity for skill.
- **Do not** train or sell behavioral models on swipe streams without explicit, separate consent if you ever go that route.
- **Do not** let raw swipe counts dominate quality without guards (spam accounts, bot swipes, novelty bias toward short or flashy snippets).

## Security and abuse

- **Do not** execute user-submitted or scraped code in users’ browsers or on your servers without a hardened sandbox and a clear threat model.
- **Do not** treat embedded snippets as trusted HTML; sanitize rendering to prevent XSS.
- **Snippet memos** (user-authored notes on a card): store and display as **plain text** only; enforce a **hard length cap** (product: **600 characters**); never interpret as HTML or markdown unless you add a vetted, locked-down renderer later.
- **Do not** ignore reports of harassment, doxxing, or non-consensual use of someone’s code in the product.

## Scope (especially for a hackathon)

- **Do not** block shipping a thin vertical slice because the full matching graph, messaging, and global rating system are unfinished. Guardrails limit harm; they do not require building everything at once.
- **Do not** reinterpret these guardrails as “no metrics.” Instrument what you need to learn; just avoid the harmful patterns above.
