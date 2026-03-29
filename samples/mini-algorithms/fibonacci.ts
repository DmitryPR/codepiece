/**
 * Fibonacci using iterative O(n) time and O(1) space.
 * F(0)=0, F(1)=1. Returns 0 for negative n.
 */
export function fibonacci(n: number): number {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  let a = 0;
  let b = 1;
  for (let i = 2; i <= n; i++) {
    const next = a + b;
    a = b;
    b = next;
  }
  return b;
}

/**
 * Naive recursive Fibonacci — small n only; useful as a second card target.
 */
export function fibonacciRecursive(n: number): number {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  return fibonacciRecursive(n - 1) + fibonacciRecursive(n - 2);
}
