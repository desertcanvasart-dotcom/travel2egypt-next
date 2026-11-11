import { groq } from 'next-sanity';

import { client } from '@/sanity/lib/client';
import { guidePrice, guidePriced, guidePriceParam, guidePricedParam } from '@/sanity/lib/guidePrice';

/**
 * Priced tour blocks inside articles and guides (fix round 3, Task C,
 * 2026-11-08). An article can name up to three products for an inline block
 * (rendered after a chosen H2) and up to three for an end block. When the end
 * list is empty, up to three published, priced products tagged with the
 * article's city are chosen automatically — never airport transfers, shows /
 * evening entertainment or group multi-day holidays, unless the article is
 * about them. Fewer than two candidates → no block. Inline blocks are only
 * ever hand-picked.
 */

export interface ArticleTour {
  _id: string;
  slug: string;
  title: string;
  type?: string | null;
  tourMode?: string | null;
  priceFrom?: number | null;
  /** ES/JA: the price is the Spanish/Japanese-speaking-guide price. */
  guidePriced?: boolean | null;
  durationDays?: number | null;
  durationHours?: number | null;
  heroImage?: { asset?: unknown; alt?: string } | null;
}

/** GROQ projection for one product, localized. */
export const articleTourProjection = (locale: string) => `{
  _id,
  "slug": coalesce(slug[_key=="${locale}"][0].value.current, slug[_key=="en"][0].value.current),
  "title": coalesce(title[_key=="${locale}"][0].value, title[_key=="en"][0].value, ""),
  type, tourMode, "priceFrom": ${guidePrice(locale)}, "guidePriced": ${guidePriced(locale)}, durationDays, durationHours,
  heroImage{ ..., "alt": coalesce(alt[_key=="${locale}"][0].value, alt[_key=="en"][0].value, "") }
}`;

/** Same projection, for queries that pass the locale as $locale. */
export const articleTourProjectionParam = `{
  _id,
  "slug": coalesce(slug[_key==$locale][0].value.current, slug[_key=="en"][0].value.current),
  "title": coalesce(title[_key==$locale][0].value, title[_key=="en"][0].value, ""),
  type, tourMode, "priceFrom": ${guidePriceParam}, "guidePriced": ${guidePricedParam}, durationDays, durationHours,
  heroImage{ ..., "alt": coalesce(alt[_key==$locale][0].value, alt[_key=="en"][0].value, "") }
}`;

export const pickedToursProjectionParam = (field: string) =>
  `"${field}": ${field}[@->priceFrom > 0 && @->hidden != true]->${articleTourProjectionParam}`;

/** Hand-picked refs → only published, priced, visible products, in order. */
export const pickedToursProjection = (field: string, locale: string) =>
  `"${field}": ${field}[@->priceFrom > 0 && @->hidden != true]->${articleTourProjection(locale)}`;

const EXCLUDE = {
  transfers: /airport|transfer|traslado|送迎/i,
  shows: /\bshow\b|tanoura|tannoura|sound[- ]and[- ]light|belly|nightlife|evening|dinner cruise|espect[aá]culo|ショー/i,
};

/** Auto-select up to 3 priced products for a city when no end tours are set. */
export async function fallbackTours(opts: {
  cityIds: string[];
  locale: string;
  articleTopic: string;
  excludeIds?: string[];
}): Promise<ArticleTour[]> {
  if (!opts.cityIds.length) return [];
  // Small places borrow their base city's products (ranked after their own).
  const searchIds = [...new Set([...opts.cityIds, ...opts.cityIds.flatMap((id) => NEARBY[id] ?? [])])];
  const raw = await client.fetch<Array<{ p: ArticleTour; enSlug?: string; firstCity?: string; cityRefs?: string[] }>>(
    groq`*[_type == "tour" && !(_id in path("drafts.**")) && hidden != true && priceFrom > 0
      && count((cities[]._ref)[@ in $searchIds]) > 0
      && !(_id in $excludeIds)] | order(_updatedAt desc)[0...150]{
        "p": ${articleTourProjection(opts.locale)},
        "enSlug": slug[_key=="en"][0].value.current,
        "firstCity": cities[0]._ref,
        "cityRefs": cities[]._ref
      }`,
    { searchIds, excludeIds: opts.excludeIds ?? [] },
  );
  const rows = rankByTopic(raw, opts.articleTopic, opts.cityIds);
  const topic = opts.articleTopic;
  const keepTransfers = EXCLUDE.transfers.test(topic);
  const keepShows = EXCLUDE.shows.test(topic);
  const keepGroupHolidays = /group|grupo|グループ/i.test(topic);
  const ok = rows.filter((p) => {
    const text = `${p.slug} ${p.title}`;
    if (!keepTransfers && EXCLUDE.transfers.test(text)) return false;
    if (!keepShows && EXCLUDE.shows.test(text)) return false;
    if (!keepGroupHolidays && p.type === 'package' && p.tourMode === 'group') return false;
    return true;
  });
  // Already ranked by topic → best three.
  return ok.length >= 2 ? ok.slice(0, 3) : [];
}

/**
 * Places with few or no products of their own → their base city (by Sanity
 * city _id; slugs in comments). Giza has 2 products because Pyramids tours
 * are tagged Cairo; El Gouna's are Luxor trips, its islands sail from Hurghada.
 */
const CAIRO = 'wp-page-83284', HURGHADA = 'wp-page-58859', LUXOR = 'wp-page-58877', ASWAN = 'wp-page-58758';
const SHARM = 'wp-page-58927', MARSA_ALAM = 'wp-page-58885', ALEXANDRIA = 'wp-page-58750', BAHARIYA = 'wp-page-58769';
const NEARBY: Record<string, string[]> = {
  'wp-page-58854': [CAIRO], // giza
  'wp-page-58530': [CAIRO], // al-fayoum
  'wp-page-58731': [CAIRO], // wadi-el-natrun
  'wp-page-58776': [CAIRO], // beni-suef
  'wp-page-58740': [HURGHADA], // al-gouna
  'wp-page-58920': [HURGHADA], // safaga
  'wp-page-58688': [MARSA_ALAM], // al-quseir
  'wp-page-59436': [SHARM], // dahab
  'wp-page-58892': [SHARM], // nuweiba
  'wp-page-58939': [SHARM], // taba
  'wp-page-58844': [LUXOR], // esna
  'wp-page-58902': [LUXOR], // qena
  'wp-page-58937': [LUXOR], // sohag
  'wp-page-58090': [LUXOR], // akhmim
  'wp-page-58841': [ASWAN, LUXOR], // edfu
  'wp-page-58875': [ASWAN], // kom-ombo
  'wp-page-56813': [ASWAN], // abu-simbel
  'wp-page-58915': [ALEXANDRIA], // rosetta-rasheed
  'wp-page-58849': [BAHARIYA], // farafra-oasis
};

/** Generic words that say nothing about which product fits. */
const STOP = new Set(
  ('the and for with from into your what when where which why how are was its this that guide travel trip trips tour tours ' +
    'day days private egypt egypt’s egypts egyptian best top things visit visiting complete ultimate full half night nights ' +
    'del los las una para por con que como más desde guía viaje viajes excursión excursiones egipto día días tour privado').split(' '),
);
/** Topic words that should also find products named differently. */
const SYNONYMS: Record<string, string[]> = {
  sphinx: ['pyramids', 'giza'], pyramid: ['pyramids'], pyramids: ['pyramids'], cheops: ['pyramids'], khufu: ['pyramids'],
  tutankhamun: ['valley', 'west', 'bank'], tut: ['valley', 'west', 'bank'], tuts: ['valley', 'west', 'bank'],
  tomb: ['valley', 'west', 'bank'], tombs: ['valley', 'west', 'bank'], kings: ['valley', 'west', 'bank'],
  valley: ['valley', 'west', 'bank'], hatshepsut: ['west', 'bank'], pharaohs: ['valley', 'pyramids'],
  mummies: ['museum'], museum: ['museum'], gem: ['museum'], hieroglyphs: ['temple', 'temples'],
  diving: ['diving', 'snorkeling', 'snorkelling'], snorkeling: ['snorkeling', 'snorkelling'], reef: ['snorkeling', 'diving'],
  island: ['island', 'islands', 'snorkeling', 'boat'], islands: ['island', 'islands', 'snorkeling'],
  bazaar: ['khan', 'bazaar'], market: ['bazaar', 'khan'], coptic: ['coptic', 'old'], islamic: ['islamic', 'citadel', 'mosque'],
  nubian: ['nubian', 'village'], nubia: ['nubian'], felucca: ['felucca'], balloon: ['balloon'], desert: ['desert', 'safari'],
  pirámides: ['pyramids'], pirámide: ['pyramids'], esfinge: ['pyramids'], tumbas: ['valley'], museo: ['museum'],
};

const words = (s: string) =>
  s
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 3 && !STOP.has(w));

/** Same word, or a shared stem of 5+ letters ("pyramid" ~ "pyramids"). */
const near = (a: string, b: string) =>
  a === b || (a.length >= 5 && b.length >= 5 && (a.startsWith(b.slice(0, 5)) && b.startsWith(a.slice(0, 5))));

/**
 * Rank candidates for an article (A2/A3, 2026-11-09). Previously the newest
 * products won, so a Sphinx article showed an Alexandria day trip and a
 * 13-day cruise. Order now:
 *   1. products sharing topic words with the article (title + slug, plus a few
 *      synonyms: Sphinx → pyramids),
 *   2. products tagged with the article's own city (before nearby-city ones),
 *      and whose main city it is,
 *   3. day tours and short trips before long packages,
 *   4. most recently updated (the old order) as the tie-break.
 */
export function rankByTopic(
  rows: Array<{ p: ArticleTour; enSlug?: string; firstCity?: string; cityRefs?: string[] }>,
  topic: string,
  cityIds: string[] = [],
): ArticleTour[] {
  const topicWords = words(topic);
  const wanted = new Set([...topicWords, ...topicWords.flatMap((w) => SYNONYMS[w] ?? [])]);
  const productWords = rows.map((r) => words(`${r.p.title} ${r.p.slug} ${r.enSlug ?? ''}`));
  const has = (i: number, w: string) => productWords[i].some((pw) => near(w, pw));
  // A word most candidates share ("cairo" in "…from-cairo") says little.
  const weight = new Map(
    [...wanted].map((w) => [w, rows.filter((_, i) => has(i, w)).length > rows.length / 3 ? 2 : 10]),
  );
  const score = (r: (typeof rows)[number], i: number) => {
    let s = 0;
    for (const w of wanted) if (has(i, w)) s += weight.get(w)!;
    if (r.firstCity && r.firstCity === cityIds[0]) s += 3;
    if ((r.cityRefs ?? []).some((id) => cityIds.includes(id))) s += 4; // own city before a nearby one
    if (r.p.type === 'dayTour') s += 2;
    else if ((r.p.durationDays ?? 0) <= 4) s += 1;
    else if ((r.p.durationDays ?? 0) > 8) s -= 5; // a 13-day trip only on a topic match
    return s;
  };
  return rows
    .map((r, i) => ({ p: r.p, s: score(r, i), i }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.p);
}

/** Normalize an H2 for matching ("■ Cuánto tiempo quedarse" → "cuánto tiempo quedarse"). */
export const normHeading = (s: string) =>
  s.replace(/^[^\p{L}\p{N}]+/u, '').replace(/\s+/g, ' ').trim().toLowerCase();

type PTBlock = { _type?: string; style?: string; children?: Array<{ text?: string }> };

/**
 * Split a Portable Text body after the section that starts with the given H2:
 * [blocks up to the next H2, the rest]. No match → null (no inline block).
 */
export function splitAfterSection<T extends PTBlock>(body: T[] | null | undefined, heading?: string | null): [T[], T[]] | null {
  if (!body?.length || !heading?.trim()) return null;
  const target = normHeading(heading);
  const text = (b: T) => (b.children ?? []).map((c) => c.text ?? '').join('');
  const i = body.findIndex((b) => b._type === 'block' && b.style === 'h2' && normHeading(text(b)) === target);
  if (i < 0) return null;
  let j = body.findIndex((b, k) => k > i && b._type === 'block' && b.style === 'h2');
  if (j < 0) j = body.length;
  return [body.slice(0, j), body.slice(j)];
}
