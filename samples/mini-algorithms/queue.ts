/**
 * Simple FIFO queue backed by an array (amortized O(1) push/shift for demos).
 * For production you'd use a ring buffer or linked list.
 */
export class ArrayQueue<T> {
  private readonly items: T[] = [];

  /** Add an item to the tail. */
  enqueue(value: T): void {
    this.items.push(value);
  }

  /** Remove and return the head, or undefined if empty. */
  dequeue(): T | undefined {
    return this.items.shift();
  }

  /** Number of elements waiting. */
  get size(): number {
    return this.items.length;
  }

  /** Whether the queue has no elements. */
  isEmpty(): boolean {
    return this.items.length === 0;
  }
}
