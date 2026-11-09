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
  const rows = await client.fetch<ArticleTour[]>(
    groq`*[_type == "tour" && !(_id in path("drafts.**")) && hidden != true && priceFrom > 0
      && count((cities[]._ref)[@ in $cityIds]) > 0
      && !(_id in $excludeIds)] | order(_updatedAt desc)[0...40]${articleTourProjection(opts.locale)}`,
    { cityIds: opts.cityIds, excludeIds: opts.excludeIds ?? [] },
  );
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
  // Mix: day tours first, then multi-day, keeping recency order within each.
  const day = ok.filter((p) => p.type === 'dayTour');
  const multi = ok.filter((p) => p.type !== 'dayTour');
  const picked = [...day.slice(0, 2), ...multi.slice(0, 1)];
  for (const p of [...day.slice(2), ...multi.slice(1)]) if (picked.length < 3) picked.push(p);
  return picked.length >= 2 ? picked.slice(0, 3) : [];
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
