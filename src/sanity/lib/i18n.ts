/**
 * GROQ helpers for localized content.
 *
 * We use the `internationalized-array` plugin pattern, which stores localized
 * fields as arrays of objects shaped like:
 *
 *   [
 *     { _key: 'en', value: 'Cairo' },
 *     { _key: 'es', value: 'El Cairo' },
 *     { _key: 'ja', value: 'カイロ' }
 *   ]
 *
 * To extract the right value for a locale, we use `coalesce` to fall back to
 * the EN value if the requested locale is missing. This is critical for
 * progressive content rollout — pages should never break because translation
 * has not happened yet, they should just show EN fallback content.
 *
 * For document-level i18n (used on `article` only), the document itself has a
 * `language` field and we filter at query time. See `articleQueries.ts`.
 */

import type { Locale } from '@/i18n/routing';

export const DEFAULT_LOCALE: Locale = 'en';

/**
 * GROQ snippet to extract a localized string field with EN fallback.
 *
 * Usage in a GROQ query:
 *   *[_type=='city' && slug.current==$slug][0]{
 *     "name": ${localizedField('name', locale)},
 *     "summary": ${localizedField('summary', locale)}
 *   }
 */
export const localizedField = (field: string, locale: Locale) =>
  `coalesce(${field}[_key=="${locale}"].value, ${field}[_key=="${DEFAULT_LOCALE}"].value)`;

/**
 * GROQ snippet for a localized slug field.
 *
 * Slugs are stored as an array of `slug` objects, one per locale:
 *   [
 *     { _key: 'en', value: { current: 'cairo' } },
 *     { _key: 'es', value: { current: 'el-cairo' } },
 *     { _key: 'ja', value: { current: 'カイロ' } }
 *   ]
 */
export const localizedSlug = (field: string, locale: Locale) =>
  `coalesce(${field}[_key=="${locale}"].value.current, ${field}[_key=="${DEFAULT_LOCALE}"].value.current)`;

/**
 * Helper to extract a localized string client-side from a raw
 * internationalized-array value (when you don't want to project it in GROQ).
 */
export function pickLocalized<T = string>(
  field: Array<{ _key: string; value: T }> | null | undefined,
  locale: Locale
): T | null {
  if (!field || !Array.isArray(field)) return null;
  const match = field.find((entry) => entry._key === locale);
  if (match) return match.value;
  const fallback = field.find((entry) => entry._key === DEFAULT_LOCALE);
  return fallback ? fallback.value : null;
}
