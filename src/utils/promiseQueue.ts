/**
 * Serializes async operations: each enqueued operation starts only after the
 * previous one settles, whether it resolved or rejected. Pure module with no
 * runtime dependencies so it can load under plain `node --test`.
 */
export interface PromiseQueue {
  enqueue<T>(operation: () => Promise<T>): Promise<T>;
}

export function createPromiseQueue(): PromiseQueue {
  let tail: Promise<unknown> = Promise.resolve();
  return {
    enqueue<T>(operation: () => Promise<T>): Promise<T> {
      const result = tail.then(operation, operation);
      tail = result.then(
        () => undefined,
        () => undefined,
      );
      return result;
    },
  };
}
