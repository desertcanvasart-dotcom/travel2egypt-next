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
 * Katakana provenance:
 *  - Batch 1 (13 terms): owner-approved 2026-07-20, `jaConfirmed: true`. Two were
 *    corrected on owner review — dukkah → デュカ (established JA food-media form;
 *    ドッカ read as invented; stricter alt ドゥッカ), tagella → タゲッラ (Amazigh
 *    hard "g"; earlier タジェッラ added a "j").
 *  - Batch 2 (16 terms, from the research field guide): owner-approved 2026-07-20,
 *    `jaConfirmed: true`. Amended on review: kahk カフク→カハク (pharyngeal ḥ → ハ).
 *    fesikh カ carries a native-review note (シ vs スィ for the middle s).
 * A native reviewer gives all 29 forms a final pass before the first JA article
 * publishes, but all are good to build against now.
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
  /**
   * Known variant spellings (e.g. the research base's transliterations) that are
   * NOT canonical. The glossary stays SSOT (decision D5): these exist so the
   * (deferred) spelling lint can flag "did you mean <canonical>?" in authored
   * prose. Match case-insensitively.
   */
  aliases?: string[];
}

export const FOOD_GLOSSARY = {
  // ── Batch 1 — owner-confirmed 2026-07-20 (jaConfirmed: true) ──
  koshari: { romanization: 'koshari', ja: 'コシャリ', jaConfirmed: true, aliases: ['koshary'] },
  taameya: { romanization: "ta'ameya", ja: 'ターメイヤ', jaConfirmed: true, aliases: ["ta'amiya", 'taamiya'] },
  molokhia: { romanization: 'molokhia', ja: 'モロヘイヤ', jaConfirmed: true, aliases: ['molokhiya'] },
  sayadeya: { romanization: 'sayadeya', ja: 'サヤディーヤ', jaConfirmed: true },
  feteer: { romanization: 'feteer', ja: 'フィティール', jaConfirmed: true },
  ful: { romanization: 'ful', ja: 'フール', jaConfirmed: true },
  // Owner keeps オム・アリ for romanization consistency with "Om Ali". JA sources
  // also write ウンム・アリ (from classical "Umm Ali") — do NOT "fix" to that
  // without owner sign-off; the divergence from romanization is deliberate.
  'om-ali': { romanization: 'Om Ali', ja: 'オム・アリ', jaConfirmed: true, aliases: ['Umm Ali', 'umm-ali'] },
  hawawshi: { romanization: 'hawawshi', ja: 'ハワウシ', jaConfirmed: true },
  // dukkah = the dry NUT-AND-SPICE condiment (hazelnut/coriander/cumin/sesame).
  // NOT `dakka` (batch 2) — the koshari garlic-vinegar SAUCE. Keep distinct forever.
  dukkah: { romanization: 'dukkah', ja: 'デュカ', jaConfirmed: true },
  'samna-baladi': { romanization: 'samna baladi', ja: 'サムナ・バラディ', jaConfirmed: true },
  'kebda-eskandarani': { romanization: 'kebda Eskandarani', ja: 'ケブダ・エスカンダラーニ', jaConfirmed: true, aliases: ['kebda Iskandarani'] },
  zarb: { romanization: 'zarb', ja: 'ザルブ', jaConfirmed: true },
  tagella: { romanization: 'tagella', ja: 'タゲッラ', jaConfirmed: true },

  // ── Batch 2 — from the research field guide. Owner-approved 2026-07-20
  //    (jaConfirmed: true). Amended on review: kahk カフク→カハク. The full-glossary
  //    native-reviewer pass still happens before the first JA article publishes. ──
  taliya: { romanization: "ta'liya", ja: 'タリーヤ', jaConfirmed: true },
  tasbeeka: { romanization: 'tasbeeka', ja: 'タスビーカ', jaConfirmed: true },
  mahshi: { romanization: 'mahshi', ja: 'マハシ', jaConfirmed: true },
  fatta: { romanization: 'fatta', ja: 'ファッタ', jaConfirmed: true },
  torshi: { romanization: 'torshi', ja: 'トルシー', jaConfirmed: true },
  shatta: { romanization: 'shatta', ja: 'シャッタ', jaConfirmed: true },
  mish: { romanization: 'mish', ja: 'ミシュ', jaConfirmed: true },
  karkadeh: { romanization: 'karkadeh', ja: 'カルカデ', jaConfirmed: true },
  wika: { romanization: 'wika', ja: 'ウィーカ', jaConfirmed: true },
  'eish-shamsi': { romanization: "'eish shamsi", ja: 'エーシュ・シャムシ', jaConfirmed: true },
  // native review: シ vs スィ for the s (フェスィーフ / フェセーフ possible). The フ-final for خ is correct.
  fesikh: { romanization: 'fesikh', ja: 'フェシーフ', jaConfirmed: true, aliases: ['feseekh'] },
  termis: { romanization: 'termis', ja: 'テルミス', jaConfirmed: true },
  // kahk: كحك carries pharyngeal ḥ → ハ (not フ, which is the خ convention as in シャイフ).
  kahk: { romanization: 'kahk', ja: 'カハク', jaConfirmed: true },
  qatayef: { romanization: 'qatayef', ja: 'カタイフ', jaConfirmed: true },
  kunafa: { romanization: 'kunafa', ja: 'クナーファ', jaConfirmed: true },
  // dakka = the koshari garlic-vinegar SAUCE. NOT `dukkah` above (the dry
  // nut-and-spice condiment). Different things; the glossary keeps them apart.
  // (ダッカ is also JA for Dhaka — the first-mention romanization gloss disambiguates.)
  dakka: { romanization: 'dakka', ja: 'ダッカ', jaConfirmed: true },
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

/**
 * Variant spelling (lower-cased) → canonical key. Ready for the deferred
 * spelling lint's "did you mean <canonical>?" check; unused at runtime today.
 */
export const FOOD_ALIAS_TO_KEY: Record<string, FoodGlossaryKey> = Object.fromEntries(
  FOOD_GLOSSARY_KEYS.flatMap((key) =>
    ((FOOD_GLOSSARY[key] as FoodTerm).aliases ?? []).map(
      (alias) => [alias.toLowerCase(), key] as const,
    ),
  ),
);
