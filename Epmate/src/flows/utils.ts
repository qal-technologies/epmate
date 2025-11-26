/**
 * Flow Utilities
 */

/**
 * Creates a unique ID for a node.
 * @param parentId - The ID of the parent node.
 * @param name - The name of the node.
 * @returns The unique ID for the node.
 */
export function makeId(parentId: string | null, name: string) {
  if (!name || typeof name !== 'string')
    throw new Error('[Flow] Child name must be a non-empty string.');
  return parentId ? `${parentId}.${name}` : name;
}

/**
 * Infers the parent of a node.
 * @param parentName - The name of the parent to infer.
 * @returns The ID of the inferred parent, or null if it could not be inferred.
 */
export function inferParent(parentName?: string | null): string | null {
  if (parentName) return parentName;
  // This is a placeholder for more sophisticated parent inference logic.
  // For now, we assume that if no parent is specified, it's a root-level operation.
  return null;
}

/**
 * Runs a function with a timeout.
 * @param fn - The function to run.
 * @param timeoutMs - The timeout in milliseconds.
 * @param fallback - The fallback value to return if the function times out.
 * @returns The result of the function or the fallback value.
 */
export async function runWithTimeout<T>(
  fn: () => Promise<T> | T,
  timeoutMs: number,
  fallback: T,
): Promise<T> {
  return new Promise(async resolve => {
    const timer = setTimeout(() => {
      console.warn(`[Flow] lifecycle function timed out after ${timeoutMs}ms.`);
      resolve(fallback);
    }, timeoutMs);

    try {
      const result = await fn();
      clearTimeout(timer);
      resolve(result);
    } catch (err) {
      console.error('[Flow] lifecycle function error:', err);
      clearTimeout(timer);
      resolve(fallback);
    }
  });
}
