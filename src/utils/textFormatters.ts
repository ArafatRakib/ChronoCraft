/**
 * Utilities for text capitalization and string formatting
 */

const PRESERVED_ACRONYMS = new Set([
  'HIIT',
  'AMRAP',
  'EMOM',
  'TABATA',
  'WOD',
  'HR',
  'BPM',
  'RPM',
  'CSV',
  'PDF',
  'API',
  'AI',
]);

/**
 * Capitalizes the first letter of each word in a string,
 * while preserving acronyms like HIIT, AMRAP, EMOM, CSV.
 */
export function capitalizeWords(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  return trimmed
    .split(/\s+/)
    .map((word) => {
      if (!word) return '';
      const upper = word.toUpperCase();
      if (PRESERVED_ACRONYMS.has(upper)) {
        return upper;
      }
      // If it contains numbers or symbols (e.g. 20s/10s or 5k), capitalize leading letter if alphabet
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Capitalizes just the first letter of a sentence or label
 */
export function capitalizeFirst(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
