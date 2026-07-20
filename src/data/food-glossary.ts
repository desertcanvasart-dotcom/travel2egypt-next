/**
 * Food transliteration glossary — the single source of truth for how every
 * Egyptian dish / ingredient is spelled across the site.
 *
 * ONE canonical romanized spelling per term, site-wide (EN + ES prose). JA
 * shows the fixed katakana form with the romanization in parentheses on first
 * mention (rendered automatically — authors never annotate manually). ES only
 * carries a `es` value when it genuinely diverges from the romanization; it
 * usually doesn't (Spanish keeps the romanized Arabic).
 *
 * Governance:
 *  - Keys are stable, slug-safe ids. Never rename a key once an article ships
 *    with it (the `dishes[]` field and the CI spelling lint both key off these).
 *  - To add a dish: add it here FIRST, then it becomes selectable in Studio's
 *    `foodArticle.dishes[]` dropdown and passes the import-time + CI lint checks.
 *  - `romanization` is the exact string that must appear in EN/ES body prose.
 *
 * Katakana provenance: all thirteen forms are owner-approved (2026-07-20) and
 * carry `jaConfirmed: true`. A native reviewer gives them a final pass before
 * the first JA article publishes, but they are good to build against now.
 * Two were corrected from the first proposal on owner review:
 *   - dukkah → デュカ (established JA food-media form; ドッカ read as invented).
 *     Stricter-transliteration alternative would be ドゥッカ; owner chose デュカ.
 *   - tagella → タゲッラ (Amazigh hard "g"; the earlier タジェッラ added a "j").
 */

export interface FoodTerm {
  /** Canonical romanized spelling — must appear verbatim in EN/ES prose. */
  romanization: string;
  /** Fixed JA katakana form. Rendered with romanization in parens on first mention. */
  ja: string;
  /** ES spelling, only when it diverges from `romanization` (usually it doesn't). */
  es?: string;
  /** True once the katakana form is owner/translator-confirmed. */
  jaConfirmed: boolean;
}

export const FOOD_GLOSSARY = {
  koshari: { romanization: 'koshari', ja: 'コシャリ', jaConfirmed: true },
  taameya: { romanization: "ta'ameya", ja: 'ターメイヤ', jaConfirmed: true },
  molokhia: { romanization: 'molokhia', ja: 'モロヘイヤ', jaConfirmed: true },
  sayadeya: { romanization: 'sayadeya', ja: 'サヤディーヤ', jaConfirmed: true },
  feteer: { romanization: 'feteer', ja: 'フィティール', jaConfirmed: true },
  ful: { romanization: 'ful', ja: 'フール', jaConfirmed: true },
  // Owner keeps オム・アリ for romanization consistency with "Om Ali". JA sources
  // also write ウンム・アリ (from classical "Umm Ali") — do NOT "fix" to that
  // without owner sign-off; the divergence from romanization is deliberate.
  'om-ali': { romanization: 'Om Ali', ja: 'オム・アリ', jaConfirmed: true },
  hawawshi: { romanization: 'hawawshi', ja: 'ハワウシ', jaConfirmed: true },
  dukkah: { romanization: 'dukkah', ja: 'デュカ', jaConfirmed: true },
  'samna-baladi': { romanization: 'samna baladi', ja: 'サムナ・バラディ', jaConfirmed: true },
  'kebda-eskandarani': { romanization: 'kebda Eskandarani', ja: 'ケブダ・エスカンダラーニ', jaConfirmed: true },
  zarb: { romanization: 'zarb', ja: 'ザルブ', jaConfirmed: true },
  tagella: { romanization: 'tagella', ja: 'タゲッラ', jaConfirmed: true },
} satisfies Record<string, FoodTerm>;

export type FoodGlossaryKey = keyof typeof FOOD_GLOSSARY;

/** All canonical keys — feeds the Studio `dishes[]` dropdown and the CI lint. */
export const FOOD_GLOSSARY_KEYS = Object.keys(FOOD_GLOSSARY) as FoodGlossaryKey[];

/** Studio dropdown options: { title: romanization, value: key }. */
export const FOOD_GLOSSARY_OPTIONS = FOOD_GLOSSARY_KEYS.map((key) => ({
  title: FOOD_GLOSSARY[key].romanization,
  value: key,
}));

export function isFoodGlossaryKey(key: string): key is FoodGlossaryKey {
  return Object.prototype.hasOwnProperty.call(FOOD_GLOSSARY, key);
}
