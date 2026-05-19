/**
 * Cross-locale validation for a LocaleTriplet.
 *
 * Per-file (frontmatter-shape) validation lives in frontmatter.ts. This
 * module runs the orchestrator-level checks once a triplet is assembled:
 *
 *   - EN file is required. Triplets missing EN are skipped (with a warning
 *     for any orphan ES/JA siblings).
 *   - slug, city, kind must match across all present locales.
 *   - EN-only is acceptable but flagged (locale-incomplete; log-only).
 */

import type { LocaleTriplet, ValidationError } from './types.js';
import { LOCALES } from './types.js';

export interface CrossLocaleResult {
  errors: ValidationError[];
  /** Locales that the triplet is missing (subset of {es, ja}). EN missing → triplet skipped entirely. */
  missingLocales: ('es' | 'ja')[];
  /** True when the EN sibling is missing — caller should skip writing this triplet. */
  skipNoEn: boolean;
}

export function crossLocaleValidate(triplet: LocaleTriplet): CrossLocaleResult {
  const errors: ValidationError[] = [];
  const missingLocales: ('es' | 'ja')[] = [];
  let skipNoEn = false;

  const presentLocales = LOCALES.filter((loc) => triplet.files[loc]);
  if (presentLocales.length === 0) {
    return { errors, missingLocales: ['es', 'ja'], skipNoEn: true };
  }

  // EN required.
  if (!triplet.files.en) {
    skipNoEn = true;
    const orphans = presentLocales.map((l) => triplet.files[l]!.filePath).join(', ');
    errors.push({
      file: orphans,
      message: `orphan locale(s) [${presentLocales.join(',')}] without EN sibling for ${triplet.city}/${triplet.slug} — skipping`,
    });
    return { errors, missingLocales, skipNoEn };
  }

  // slug / city / kind must agree across siblings.
  const en = triplet.files.en.fm;
  for (const loc of ['es', 'ja'] as const) {
    const f = triplet.files[loc];
    if (!f) {
      missingLocales.push(loc);
      continue;
    }
    if (f.fm.slug !== en.slug) {
      errors.push({
        file: f.filePath,
        field: 'slug',
        message: `slug "${f.fm.slug}" does not match EN sibling "${en.slug}"`,
      });
    }
    if (f.fm.city !== en.city) {
      errors.push({
        file: f.filePath,
        field: 'city',
        message: `city "${f.fm.city}" does not match EN sibling "${en.city}"`,
      });
    }
    if (f.fm.kind !== en.kind) {
      errors.push({
        file: f.filePath,
        field: 'kind',
        message: `kind "${f.fm.kind}" does not match EN sibling "${en.kind}"`,
      });
    }
  }

  return { errors, missingLocales, skipNoEn };
}
