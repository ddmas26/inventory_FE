/**
 * Shortens `text` to at most `maxChars` characters, appending an ellipsis.
 * Cuts on the last word boundary when that doesn't discard too much of the text,
 * so names don't end mid-word where a sensible break exists.
 */
export function truncateText(text: string, maxChars: number): string {
  if (!text || maxChars <= 0 || text.length <= maxChars) {
    return text;
  }

  const slice = text.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > maxChars * 0.6 ? slice.slice(0, lastSpace) : slice;

  return `${cut.trimEnd()}…`;
}

/** True when `truncateText` would shorten the given text. */
export function isTruncated(text: string | null | undefined, maxChars: number): boolean {
  if (!text || maxChars <= 0) return false;
  return text.length > maxChars;
}
