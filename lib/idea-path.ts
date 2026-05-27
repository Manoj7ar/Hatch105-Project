/** Client-safe route helpers (no fs imports). */

export function ideaPath(ref: string): string {
  return `/ideas/${encodeURIComponent(ref)}`;
}

export function normalizeThesisRef(ref: string): string {
  return decodeURIComponent(ref).trim().toUpperCase();
}
