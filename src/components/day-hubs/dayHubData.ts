import { DAY_TOUR_CITIES } from '@/components/home-sales/config';
import { bucketKey } from '@/components/tour-system/lengthBucket';

/**
 * Day-tour hubs (owner spec, 2026-11-09): city grouping and the
 * "Recommended" order, shared by /tours, /private-day-tours,
 * /group-day-tours and the Nile Valley city hubs.
 *
 * Business rule: the company sells Nile Valley day tours. Red Sea excursions
 * stay published and linked, but are never listed first or mixed into the
 * Nile Valley lists.
 */

/** City filter keys, in display order (EN city slugs, except the merged Cairo & Giza). */
export const NILE_KEYS = ['cairo-giza', 'luxor', 'aswan', 'alexandria'] as const;
export const RED_SEA_SLUGS = new Set([
  'hurghada',
  'sharm-el-sheikh',
  'marsa-alam',
  'al-gouna',
  'el-gouna',
  'safaga',
  'makadi',
  'makadi-bay',
  'soma-bay',
  'dahab',
]);

/** Cairo and Giza are one filter option; product data is unchanged. */
export function cityKeyFor(enSlug?: string | null): string {
  if (!enSlug) return '';
  if (enSlug === 'cairo' || enSlug === 'giza') return 'cairo-giza';
  return enSlug;
}

export const isRedSea = (cityKey: string) => RED_SEA_SLUGS.has(cityKey);

export interface RawHubTour {
  _id: string;
  enSlug?: string;
  slug: string;
  title: string;
  summary?: string | null;
  tourMode?: string | null;
  durationDays?: number | null;
  durationHours?: number | null;
  durationLabel?: string | null;
  priceFrom?: number | null;
  heroImage?: { asset?: unknown; alt?: string } | null;
  cities?: Array<{ _id: string; name: string; slug: string; enSlug?: string }> | null;
}

/** The product's primary city (its first tagged city), as a filter key. */
export function primaryCity(t: RawHubTour): { key: string; name: string; localSlug: string } {
  const c = t.cities?.[0];
  return { key: cityKeyFor(c?.enSlug ?? c?.slug), name: c?.name ?? '', localSlug: c?.slug ?? '' };
}

/** Homepage day-tour list rank (by EN slug), in the homepage's order. */
const HOME_RANK = new Map<string, number>(
  DAY_TOUR_CITIES.flatMap((c) => c.tours.map((t) => t.slug)).map((slug, i) => [slug, i]),
);

/** The homepage day-tour products, in the homepage's order (EN slugs). */
export const HOME_DAY_SLUGS: string[] = DAY_TOUR_CITIES.flatMap((c) => c.tours.map((t) => t.slug));

const nileRank = (key: string) => {
  const i = (NILE_KEYS as readonly string[]).indexOf(key);
  return i === -1 ? NILE_KEYS.length : i; // other Nile Valley places after Alexandria
};

/**
 * Recommended order: Nile Valley cities first (Cairo & Giza, Luxor, Aswan,
 * Alexandria, then other places); within a city, homepage-listed products in
 * homepage order, then the rest by price low → high, unpriced last. Red Sea
 * products come after everything (they render in their own section).
 */
export function recommendedCompare(a: RawHubTour, b: RawHubTour): number {
  const ca = primaryCity(a).key;
  const cb = primaryCity(b).key;
  const ra = isRedSea(ca) ? 1 : 0;
  const rb = isRedSea(cb) ? 1 : 0;
  if (ra !== rb) return ra - rb;
  if (!ra) {
    const d = nileRank(ca) - nileRank(cb);
    if (d !== 0) return d;
    if (ca !== cb) return ca.localeCompare(cb);
  } else if (ca !== cb) {
    return ca.localeCompare(cb);
  }
  const ha = HOME_RANK.get(a.enSlug ?? '');
  const hb = HOME_RANK.get(b.enSlug ?? '');
  if (ha != null || hb != null) {
    if (ha == null) return 1;
    if (hb == null) return -1;
    return ha - hb;
  }
  const pa = a.priceFrom && a.priceFrom > 0 ? a.priceFrom : null;
  const pb = b.priceFrom && b.priceFrom > 0 ? b.priceFrom : null;
  if (pa == null && pb == null) return a.title.localeCompare(b.title);
  if (pa == null) return 1;
  if (pb == null) return -1;
  return pa - pb;
}

/** Length bucket: the existing hubs' rule (lengthBucket.ts), unchanged. */
export function lengthKey(t: RawHubTour): 'half' | 'full' | 'extended' {
  return bucketKey({
    title: t.title,
    slug: t.slug,
    durationHours: t.durationHours ?? undefined,
    durationDays: t.durationDays ?? undefined,
  });
}

/** Duration in hours, for "Duration: shortest first". */
export function durationSortValue(t: RawHubTour): number {
  if (typeof t.durationHours === 'number') return t.durationHours;
  if (typeof t.durationDays === 'number') return t.durationDays * 24;
  return 9999;
}

export const minPrice = (tours: RawHubTour[]) => {
  const v = tours.map((t) => t.priceFrom).filter((n): n is number => typeof n === 'number' && n > 0);
  return v.length ? Math.min(...v) : null;
};

/** The budget labels' currency and bucket edges per language (per person). */
export const BUDGET: Record<string, { ccy: string; edges: [number, number] }> = {
  en: { ccy: 'USD', edges: [100, 200] },
  es: { ccy: 'EUR', edges: [100, 200] },
  ja: { ccy: 'JPY', edges: [15000, 30000] },
};
