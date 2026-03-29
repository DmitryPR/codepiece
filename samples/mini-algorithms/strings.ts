/**
 * Reverse a string by code units (fine for ASCII demos).
 */
export function reverseString(s: string): string {
  return [...s].reverse().join('');
}

/**
 * Case-insensitive ASCII palindrome check (ignores spaces).
 */
export function isPalindromeLoose(s: string): boolean {
  const norm = s.toLowerCase().replace(/\s+/g, '');
  return norm === reverseString(norm);
}
