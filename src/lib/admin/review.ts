/**
 * Reviewer notes — controlled vocabulary (Session 10).
 *
 * Per the build brief: notes are "problem categories only" (prompt drift,
 * factual error, escape hatch used, abuse, language switch issue, other) —
 * no free prose. Categories are stored in the existing `reviewer_notes`
 * `text` column as a comma-separated list of the codes below; no schema
 * change. Empty/missing → no categories selected.
 */

export const REVIEW_NOTE_CATEGORIES = [
  'prompt_drift',
  'factual_error',
  'escape_hatch_used',
  'abuse',
  'language_switch_issue',
  'other',
] as const;

export type ReviewNoteCategory = (typeof REVIEW_NOTE_CATEGORIES)[number];

export const REVIEW_NOTE_LABELS: Record<ReviewNoteCategory, string> = {
  prompt_drift: 'Prompt drift',
  factual_error: 'Factual error',
  escape_hatch_used: 'Escape hatch used',
  abuse: 'Abuse',
  language_switch_issue: 'Language switch issue',
  other: 'Other',
};

const CATEGORY_SET = new Set<ReviewNoteCategory>(REVIEW_NOTE_CATEGORIES);

export function parseReviewerNotes(raw: string | null | undefined): ReviewNoteCategory[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is ReviewNoteCategory => CATEGORY_SET.has(s as ReviewNoteCategory));
}

export function serializeReviewerNotes(categories: readonly ReviewNoteCategory[]): string {
  // De-dup and preserve declared order.
  const present = new Set(categories);
  return REVIEW_NOTE_CATEGORIES.filter((c) => present.has(c)).join(',');
}

export function isValidRating(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 5;
}
