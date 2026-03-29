/** One-liners for the header tagline; index rotates daily (UTC) per page kind. */
export const CODING_SWIPE_TAGLINES = [
  'Swipe right on clean diffs, left on any.',
  'Hot singles in your area want to refactor this function.',
  'Left swipe = git revert, right swipe = ship it.',
  'This is not Tinder—it is linter-approved matching.',
  'If it compiles on the first try, are you even human?',
  'Commit often, swipe bolder.',
  'Warning: may contain traces of Stack Overflow.',
  'Merge conflicts: the original ghosting.',
  'Code review, but make it speed dating.',
  'Still using var? That is a brave left swipe.',
  'Semicolons optional; taste is not.',
  'I would cherry-pick your heart.',
  'Production is just a vibe check at scale.',
  'Rubber duck said this deserves a super like.',
  'Swipe right or the build stays red (kidding).',
  'From “works on my machine” to “works in my heart.”',
  'Dependencies: heavy. Emotional baggage: heavier.',
  'This card runs in O(love) time.',
  'I would merge this PR—after a quick glance.',
  'Your README had me at Hello World.',
  'Tabs, spaces, or chaos—swipe your truth.',
  'I am not lazy; I am energy-efficient compiling.',
  'Brain: REST. Heart: GraphQL feelings everywhere.',
  'It is not spaghetti; it is artisanal control flow.',
  'Swipe fast; nobody is watching the blame log.',
  'I would fork your repo and open a kindness issue.',
  'Null safety meets emotional safety.',
  'Every hero needs a tragic backtrace.',
  'You are the main branch I want to protect.',
  'Let us pair-program life decisions sometime.',
  'I would stash my weekend plans for you.',
  'Bug hunt? More like flirt hunt.',
  'Your types are strict; your heart can stay unknown.',
  'Swipe with the confidence of a Friday deploy.',
  'May your merges be fast-forward and your Mondays short.',
  'Coffee and optional chaining? My treat.',
  'Code coverage: low. Vibes: one hundred percent.',
  'Pure “works on my machine” energy—in a good way.',
  'Swipe right if this diff could babysit your servers.',
  'Left if it is another TODO from twenty-nineteen.',
  'Relationship status: it is complicated (Promise feelings).',
  'You are not wrong; you are asynchronously correct.',
  'Hot reload my heart when you smile at this card.',
  'One swipe closer to clearing emotional technical debt.',
  'Romance is not dead; it is just marked deprecated.',
  'I cannot handle you at my worst console.log—just kidding, I can.',
  'Swipe like the CI is green and the coffee is fresh.',
  'Lint your heart; we will lint the rest.',
  'Right for elegance, left for “we will fix it later.”',
  'Your stack trace led me straight here.',
] as const;

const N = CODING_SWIPE_TAGLINES.length;

/** Stable per UTC calendar day + page so SSR and hydration match. */
export function dailyCodingTagline(isSwipe: boolean): string {
  const d = new Date();
  const stamp =
    d.getUTCFullYear() * 10_000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
  const salt = isSwipe ? 0xa5a5_2b2b : 0x7eed_f00d;
  const mix = Math.imul(stamp ^ salt, 0x9e37_79b9) >>> 0;
  return CODING_SWIPE_TAGLINES[mix % N];
}
