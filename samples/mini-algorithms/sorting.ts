/**
 * In-place insertion sort (stable, O(n²) — educational only).
 */
export function insertionSort(arr: number[]): void {
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = key;
  }
}

/**
 * Return a sorted copy using insertion sort (does not mutate input).
 */
export function sortedCopy(values: number[]): number[] {
  const out = [...values];
  insertionSort(out);
  return out;
}
