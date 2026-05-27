/** Client-safe route helpers (no fs imports). */

export function ideaPath(ref: string): string {
  return `/ideas/${encodeURIComponent(ref)}`;
}

/** Opens chat with @mention prefilled for this team ref. */
export function chatMentionPath(ref: string): string {
  return `/chat?ref=${encodeURIComponent(ref)}`;
}

export function normalizeThesisRef(ref: string): string {
  return decodeURIComponent(ref).trim().toUpperCase();
}
