import { groq } from 'next-sanity';

import { client } from './client';
import { routing, type Locale } from '@/i18n/routing';

/**
 * Translation slug resolution for document-internationalized types.
 *
 * The @sanity/document-internationalization plugin links per-language
 * documents through a separate `translation.metadata` document whose
 * `translations` array holds one reference per locale, keyed by `_key` =
 * locale id. This helper reads that metadata doc and returns a
 * { locale → slug } map for the caller to seed into the client-side
 * TranslationContext.
 *
 * Provider pattern is the standard going forward — every new translatable
 * entity type (tour, monument, city when migrated, etc.) should use this
 * helper from its server-component page and wrap children in
 * <TranslationProvider>. Do NOT add new /api/locale-resolve/* routes; the
 * existing city route is legacy and will migrate to this pattern when
 * city translation work is next touched.
 */

type Translations = Partial<Record<Locale, string>>;

const translationSlugsQuery = groq`
  *[_type == "translation.metadata" && references($docId)][0]{
    "translations": translations[]{
      "language": _key,
      "slug": value->slug.current,
      "documentLanguage": value->language
    }
  }
`;

interface TranslationRow {
  language: string | null;
  slug: string | null;
  documentLanguage: string | null;
}

interface TranslationMetadata {
  translations: TranslationRow[] | null;
}

/**
 * Fetch the { locale → slug } map for a translatable document.
 *
 * Returns only locales that actually have a translation. Callers should
 * treat absent keys as "no translation available in that locale" and
 * disable the corresponding switcher option.
 *
 * If no translation.metadata document exists (e.g. an orphan single-locale
 * doc), returns an empty object. The caller's own current-locale slug is
 * the responsibility of the page, not this helper.
 */
export async function fetchTranslationSlugs(
  docId: string
): Promise<Translations> {
  const meta = await client.fetch<TranslationMetadata | null>(
    translationSlugsQuery,
    { docId }
  );

  const result: Translations = {};
  if (!meta?.translations) return result;

  for (const row of meta.translations) {
    if (!row.slug) continue;
    const locale = (row.language ?? row.documentLanguage) as Locale | null;
    if (!locale || !routing.locales.includes(locale)) continue;
    if (row.language && row.documentLanguage && row.language !== row.documentLanguage) {
      // Defensive: surface any drift between the metadata _key and the
      // referenced document's language field. Doesn't block — _key wins.
      // eslint-disable-next-line no-console
      console.warn(
        `[translations] metadata _key "${row.language}" != document.language "${row.documentLanguage}" for slug "${row.slug}"`
      );
    }
    result[locale] = row.slug;
  }

  return result;
}
