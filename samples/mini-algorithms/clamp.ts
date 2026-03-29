/**
 * Constrain `value` to the inclusive range `[min, max]`.
 */
export function clamp(value: number, min: number, max: number): number {
  if (min > max) return clamp(value, max, min);
  return Math.min(max, Math.max(min, value));
}

/** True if `value` lies in `[min, max]` (inclusive). */
export function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}
