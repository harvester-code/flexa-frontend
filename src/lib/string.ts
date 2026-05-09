/**
 * "word_phrase" → "Word Phrase" (replaces underscores, capitalizes each word)
 * Used for display labels from API keys.
 */
export function titleCaseWords(str: string): string {
  if (!str) return '';
  return str
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * "hello WORLD" → "Hello world" (first char upper, rest lowercased)
 */
export function sentenceCase(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Only capitalizes if the entire string is already lowercase.
 * Preserves intentional mixed-case inputs (e.g. "iPhone").
 */
export function capitalizeIfAllLower(str: string): string {
  if (!str) return '';
  if (str !== str.toLowerCase()) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
