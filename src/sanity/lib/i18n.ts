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
  `coalesce(${field}[_key=="${locale}"][0].value, ${field}[_key=="${DEFAULT_LOCALE}"][0].value)`;

/**
 * Locale-STRICT variant — returns the value ONLY for the current locale, with
 * NO en fallback (so the result is null when the field isn't populated for this
 * locale).
 *
 * Use this for DUAL-SOURCE fields that ALSO have an i18n chrome key, where the
 * consuming view resolves `strictValue ?? i18nKey`. With the en-coalescing
 * `localizedField`, an unpopulated es/ja returns a truthy en string that
 * short-circuits the `??` and MASKS the (already-translated) i18n value. The
 * strict variant returns null instead, so the view falls through to i18n — while
 * a genuinely locale-populated Sanity value still wins (editor override kept).
 *
 * Do NOT use for Sanity-ONLY fields (essays, taglines without an i18n key):
 * those must keep coalescing to en until localized.
 */
export const localizedFieldStrict = (field: string, locale: Locale) =>
  `${field}[_key=="${locale}"][0].value`;

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
  `coalesce(${field}[_key=="${locale}"][0].value.current, ${field}[_key=="${DEFAULT_LOCALE}"][0].value.current)`;

/**
 * Portable-text body projection that also resolves `internalLink` markDefs
 * to a small payload (`_type` + `slug` + auxiliary fields needed for URL
 * construction). Apply this in any body GROQ where editors might use
 * inline internal links — without it, the renderer has no way to build the
 * destination URL.
 *
 * Usage:
 *   "body": ${portableTextBodyProjection('body', locale)}
 *
 * Articles use document-level i18n and a top-level `body` (not localized
 * arrays); for those, use `articleBodyMarkProjection` directly inside the
 * existing `body[]{ ... }` projection.
 */
export const portableTextBodyProjection = (field: string, locale: Locale) => `
  coalesce(${field}[_key=="${locale}"][0].value, ${field}[_key=="${DEFAULT_LOCALE}"][0].value, [])[]{
    ...,
    markDefs[]{
      ...,
      _type == "internalLink" => {
        ...,
        "ref": reference->{
          _type,
          "tourType": select(_type == "tour" => type, null),
          "slug": select(
            _type == "article" => slug.current,
            coalesce(slug[_key=="${locale}"][0].value.current, slug[_key=="en"][0].value.current)
          ),
          "parentCitySlug": select(
            _type == "guideArticle" => coalesce(
              parentCity->slug[_key=="${locale}"][0].value.current,
              parentCity->slug[_key=="en"][0].value.current
            ),
            null
          )
        }
      }
    }
  }
`;

/**
 * For document-level i18n bodies (articles), inject this inside the
 * existing `body[]{...}` projection to resolve internal links.
 */
export const articleBodyMarkProjection = (locale: Locale) => `
  ...,
  markDefs[]{
    ...,
    _type == "internalLink" => {
      ...,
      "ref": reference->{
        _type,
        "tourType": select(_type == "tour" => type, null),
        "slug": select(
          _type == "article" => slug.current,
          coalesce(slug[_key=="${locale}"][0].value.current, slug[_key=="en"][0].value.current)
        ),
        "parentCitySlug": select(
          _type == "guideArticle" => coalesce(
            parentCity->slug[_key=="${locale}"][0].value.current,
            parentCity->slug[_key=="en"][0].value.current
          ),
          null
        )
      }
    }
  }
`;

/**
 * Resolve a Sanity reference (already projected via the helpers above) to
 * a locale-relative path. Returns null if the type is unknown — callers
 * should render the link text without an anchor in that case.
 *
 * Note: returned paths are *relative* to the locale prefix. Pass through
 * the i18n Link component (from @/i18n/navigation), which adds the
 * /es or /ja prefix automatically.
 */
export interface ResolvableRef {
  _type: string;
  slug?: string;
  tourType?: 'dayTour' | 'package' | null;
  parentCitySlug?: string | null;
}

export function resolveInternalLinkHref(ref: ResolvableRef | null | undefined): string | null {
  if (!ref || !ref._type || !ref.slug) return null;
  switch (ref._type) {
    case 'city':
      return `/guide/${ref.slug}`;
    case 'guideArticle':
      return ref.parentCitySlug
        ? `/guide/${ref.parentCitySlug}/${ref.slug}`
        : null;
    case 'tour':
      // Tours and packages are canonical at the site root (see pathFromDoc);
      // /tours/* and /packages/* only 308 there.
      return `/${ref.slug}`;
    case 'article':
      return `/blog/${ref.slug}`;
    case 'foodArticle':
      return `/food/${ref.slug}`;
    case 'wikiPerson':
      return `/wiki/people/${ref.slug}`;
    case 'wikiMonument':
      return `/wiki/monuments/${ref.slug}`;
    case 'wikiDynasty':
      return `/wiki/dynasties/${ref.slug}`;
    case 'wikiDeity':
      return `/wiki/deities/${ref.slug}`;
    case 'travelTip':
      return `/travel-tips/${ref.slug}`;
    case 'hotel':
      return `/hotels/${ref.slug}`;
    case 'nileCruise':
      return `/nile-cruises/${ref.slug}`;
    default:
      return null;
  }
}

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
