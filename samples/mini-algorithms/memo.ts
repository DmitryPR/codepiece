/**
 * Memoize a unary function using a Map (reference equality on args).
 */
export function memoizeUnary<A, R>(fn: (arg: A) => R): (arg: A) => R {
  const cache = new Map<A, R>();
  return (arg: A) => {
    if (cache.has(arg)) return cache.get(arg) as R;
    const r = fn(arg);
    cache.set(arg, r);
    return r;
  };
}

/**
 * Invoke `fn` at most once; later calls return the first result.
 */
export function once<T>(fn: () => T): () => T {
  let done = false;
  let value: T;
  return () => {
    if (!done) {
      value = fn();
      done = true;
    }
    return value;
  };
}
