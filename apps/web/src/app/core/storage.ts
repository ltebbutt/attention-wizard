/** SHOW-01/02: the single gate in front of localStorage. `?fresh` (showcase mode)
 *  makes the app memory-only — no reads, no writes, reload wipes everything. */
export const SHOWCASE =
  typeof location !== 'undefined' && new URLSearchParams(location.search).has('fresh');

export function storageGet(key: string): string | null {
  if (SHOWCASE) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // sandboxed contexts
  }
}

export function storageSet(key: string, value: string): void {
  if (SHOWCASE) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* sandboxed contexts: session-only */
  }
}

export function storageRemove(key: string): void {
  if (SHOWCASE) return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
