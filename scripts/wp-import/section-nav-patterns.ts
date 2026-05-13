/**
 * Single source of truth for section-nav and cross-promo cleanup patterns.
 *
 * Consumed by:
 *   - scripts/wp-import-html.ts (import-time pipeline; stripSectionNavBlocks
 *     + stripCrossPromoTail)
 *   - scripts/cleanup-section-nav-blocks.ts (one-shot Sanity mutation script
 *     for existing migration-staging data)
 *
 * When patterns are adjusted (dry-run reveals missed variants, new locales
 * added, etc.), update here only — both consumers pick up the change.
 *
 * Locked decisions captured here:
 *   - EN: SECTION_HEADER_PATTERNS_EN authored in commit 23bdd52 (Pre-Step-5b
 *     content-quality Fixes 1-5; Akhmim draft-edit context)
 *   - JA + ES: session 13 operator spec (locale-aware section-nav cleanup +
 *     cross-promo tail extension)
 */

export type Locale = 'en' | 'ja' | 'es';

export const SECTION_HEADER_PATTERNS_EN: RegExp[] = [
  /^INTRODUCING\s+[A-Z][A-Z\s\-']+$/,
  /^PLAN YOUR TRIP$/,
  /^WHILE YOU ARE THERE$/,
  /^PLACES TO GO$/,
  /^OTHERS$/,
];

export const SECTION_HEADER_PATTERNS_JA: RegExp[] = [
  /^[぀-ゟ゠-ヿ一-鿿　-〿㐀-䶿]+の紹介$/,
  /^旅行の計画$/,
  /^滞在中に$/,
  /^見どころ$/,
  /^その他$/,
];

export const SECTION_HEADER_PATTERNS_ES: RegExp[] = [
  /^PRESENTACIÓN DE [A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s\-']+$/,
  /^PLANIFICA TU VIAJE$/,
  /^MIENTRAS ESTÉS ALLÍ$/,
  /^LUGARES DONDE IR$/,
  /^OTROS$/,
];

export const SECTION_HEADER_PATTERNS_BY_LOCALE: Record<string, RegExp[]> = {
  en: SECTION_HEADER_PATTERNS_EN,
  ja: SECTION_HEADER_PATTERNS_JA,
  es: SECTION_HEADER_PATTERNS_ES,
};

/**
 * Leading title line — only EN has a separate "X TRAVEL GUIDE" leading line
 * (e.g., "AKHMIM Travel Guide") preceding the first section header in the
 * pre-cleanup pipeline. JA/ES sources don't produce this pattern; their
 * titles are stripped via stripTitleH1 / Fix 1 instead. Null skips the
 * walk-back-for-title step.
 */
export const LEADING_TITLE_LINE_RE_EN = /^[A-Z][A-Z\s\-']+\s+(?:TRAVEL\s+GUIDE|Travel\s+Guide)$/;
export const LEADING_TITLE_LINE_RE_BY_LOCALE: Record<string, RegExp | null> = {
  en: LEADING_TITLE_LINE_RE_EN,
  ja: null,
  es: null,
};

/**
 * Cross-promo "Learn more" anchor text per locale. Used by the cross-promo
 * tail detector to identify the closing block of the WP hub-template
 * next-city promotion that follows the section-nav tail.
 */
export const CROSS_PROMO_LEARN_MORE_BY_LOCALE: Record<string, RegExp> = {
  en: /^Learn\s+more$/i,
  ja: /^詳しくはこちらへ$/,
  es: /^Saber\s+más$/i,
};
