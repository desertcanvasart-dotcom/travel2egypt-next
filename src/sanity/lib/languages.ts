/**
 * Locales supported by the Sanity i18n plugins.
 *
 * Keep this in sync with src/i18n/routing.ts. EN is the default and the
 * fallback locale for every field. ES and JA are translated as content is
 * created or migrated.
 *
 * If Finnish is reintroduced, add { id: 'fi', title: 'Finnish' } here AND
 * to the routing config — both must stay aligned.
 */
export const SUPPORTED_LANGUAGES = [
  { id: 'en', title: 'English' },
  { id: 'es', title: 'Spanish' },
  { id: 'ja', title: 'Japanese' },
] as const;

export const DEFAULT_LANGUAGE = 'en';

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]['id'];
