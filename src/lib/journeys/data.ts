import 'server-only';

import { cache } from 'react';
import { groq } from 'next-sanity';

import { client } from '@/sanity/lib/client';
import type { SalesProduct } from '@/components/home-sales/query';

import { approved } from './curation';
import { JOURNEY_KEYS, JOURNEYS, journeyLocale, type JourneyKey } from './registry';

/**
 * Live data for the journey surfaces (journey pages, /journeys, homepage
 * cards, nav, related styles, product "Part of"). Only APPROVED curation is
 * read (curation.ts `needsReview: false`), so nothing proposed renders.
 *
 * `fromEur` = the lowest priceFrom among the journey's approved tours — the
 * same figure on the facts row, homepage card, nav and related styles. Null
 * until a journey's tours are approved (callers keep their old source).
 */
export interface JourneyTour extends SalesProduct {
  route?: string | null;
  why?: string | null;
}
export interface JourneyLive {
  key: JourneyKey;
  fromEur: number | null;
  tours: JourneyTour[];
  /** This language's slug of the paired hub, and its full catalogue size. */
  hubHref: string;
  hubCount: number;
  hero: { asset: { _type: 'reference'; _ref: string }; alt: string } | null;
}

const query = groq`{
  "products": *[_type == "tour" && !(_id in path("drafts.**")) && slug[_key=="en"][0].value.current in $slugs]{
    "slug": slug[_key=="en"][0].value.current,
    "href": coalesce(slug[_key==$locale][0].value.current, slug[_key=="en"][0].value.current),
    "title": coalesce(title[_key==$locale][0].value, title[_key=="en"][0].value, ""),
    type, priceFrom, durationDays, durationHours,
    "cityNames": cities[]->{ "n": coalesce(name[_key==$locale][0].value, name[_key=="en"][0].value) }.n,
    heroImage{ ..., "alt": coalesce(alt[_key==$locale][0].value, alt[_key=="en"][0].value, "") }
  },
  "hubs": *[_id in $hubIds]{
    _id,
    "slug": coalesce(slug[_key==$locale][0].value.current, slug[_key=="en"][0].value.current),
    "n": count(*[_type == "tour" && type == "package" && tourMode == "private" && !(_id in path("drafts.**")) && theme._ref == ^.themeRef._ref])
  }
}`;

/** "Cairo · Aswan · Luxor" — only when the product lists 2+ cities (a lone
 *  city would misstate a multi-city route; many products list just one). */
function routeLine(names?: Array<string | null> | null): string | null {
  const n = (names ?? []).filter((x): x is string => Boolean(x));
  return n.length >= 2 ? n.join(' · ') : null;
}

export const getJourneysLive = cache(async (locale: string): Promise<Record<JourneyKey, JourneyLive>> => {
  const L = journeyLocale(locale);
  const ap = Object.fromEntries(JOURNEY_KEYS.map((k) => [k, approved(k, L)])) as Record<JourneyKey, ReturnType<typeof approved>>;
  const slugs = [...new Set(JOURNEY_KEYS.flatMap((k) => ap[k].tours.map((t) => t.slug)))];
  const hubIds = JOURNEY_KEYS.map((k) => JOURNEYS[k].hubId);
  let data: { products: Array<JourneyTour & { cityNames?: Array<string | null> | null }>; hubs: Array<{ _id: string; slug: string; n: number }> } = {
    products: [],
    hubs: [],
  };
  try {
    data = await client.fetch(query, { slugs, hubIds, locale: L });
  } catch (err) {
    console.error('[journeys] live data fetch failed:', err);
  }
  const bySlug = new Map(
    data.products.map(({ cityNames, ...p }) => [p.slug, { ...p, route: routeLine(cityNames) } as JourneyTour]),
  );
  const hubById = new Map(data.hubs.map((h) => [h._id, h]));
  const out = {} as Record<JourneyKey, JourneyLive>;
  for (const k of JOURNEY_KEYS) {
    const a = ap[k];
    // Approved order is kept; a pick that is unpublished or unpriced drops out.
    const tours: JourneyTour[] = [];
    for (const t of a.tours) {
      const p = bySlug.get(t.slug);
      if (p && typeof p.priceFrom === 'number' && p.priceFrom > 0) tours.push({ ...p, why: t.why });
    }
    const prices = tours.map((t) => t.priceFrom as number);
    const hub = hubById.get(JOURNEYS[k].hubId);
    out[k] = {
      key: k,
      fromEur: prices.length ? Math.min(...prices) : null,
      tours,
      hubHref: `/${hub?.slug ?? JOURNEYS[k].hubSlug}`,
      hubCount: hub?.n ?? 0,
      hero: a.hero ? { asset: { _type: 'reference', _ref: a.hero.asset }, alt: a.hero.alt } : null,
    };
  }
  return out;
});

/** Journeys whose APPROVED picks include this product (EN slug). */
export function journeysForProduct(slug: string): JourneyKey[] {
  return JOURNEY_KEYS.filter((k) => approved(k, 'en').tours.some((t) => t.slug === slug));
}

/**
 * The "from" price each journey's card shows (homepage, /journeys): the
 * approved tours' minimum once approved, else the homepage card's existing
 * source (STYLE_CARDS: a product's price or an owner-stated figure).
 */
export const getJourneyCardPrices = cache(async (locale: string): Promise<Record<JourneyKey, number | null>> => {
  const { STYLE_CARDS } = await import('@/components/home-sales/config');
  const live = await getJourneysLive(locale);
  const slugs = STYLE_CARDS.map((c) => c.priceSlug).filter((s): s is string => Boolean(s));
  let rows: Array<{ slug: string; priceFrom?: number | null }> = [];
  try {
    rows = await client.fetch(
      groq`*[_type == "tour" && !(_id in path("drafts.**")) && slug[_key=="en"][0].value.current in $slugs]{ "slug": slug[_key=="en"][0].value.current, priceFrom }`,
      { slugs },
    );
  } catch (err) {
    console.error('[journeys] card price fetch failed:', err);
  }
  const out = {} as Record<JourneyKey, number | null>;
  for (const k of JOURNEY_KEYS) {
    const card = STYLE_CARDS.find((c) => c.href === JOURNEYS[k].path);
    const fallback = card?.priceSlug ? (rows.find((r) => r.slug === card.priceSlug)?.priceFrom ?? null) : (card?.ownerFromEur ?? null);
    out[k] = live[k].fromEur ?? fallback;
  }
  return out;
});
