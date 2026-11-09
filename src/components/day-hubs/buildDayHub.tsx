import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';

import { DayTourCard } from '@/components/home-sales/DayTourCard';
import type { Locale } from '@/i18n/routing';

import {
  NILE_KEYS,
  BUDGET,
  durationSortValue,
  isRedSea,
  lengthKey,
  primaryCity,
  recommendedCompare,
  type RawHubTour,
} from './dayHubData';
import type { DayHubItem } from './DayHubList';

/**
 * Server half of a day-tour hub list: sorts the products into the
 * Recommended order, renders one shared day-tour card per product (prices,
 * Check this date), and returns the plain filter data for <DayHubList>.
 */
export async function buildDayHub(
  tours: RawHubTour[],
  {
    locale,
    hub,
    rates,
    listName = 'day_hub_index',
    redSeaListName = 'day_hub_red_sea',
    showCity = true,
  }: {
    locale: Locale;
    /** Page slug, for GA4 `hub` and the lead. */
    hub: string;
    rates: Partial<Record<string, number>>;
    listName?: string;
    redSeaListName?: string;
    showCity?: boolean;
  },
): Promise<{ items: DayHubItem[]; cards: Record<string, ReactNode>; sorted: RawHubTour[]; budgetEdges: [number, number] }> {
  const card = await dayCardRenderer(locale);
  const budget = BUDGET[locale] ?? BUDGET.en;
  const rate = budget.ccy === 'EUR' ? 1 : rates[budget.ccy] ?? 1;
  const sorted = tours.filter((t) => t.slug).sort(recommendedCompare);
  const items: DayHubItem[] = [];
  const cards: Record<string, ReactNode> = {};
  sorted.forEach((t, i) => {
    const pc = primaryCity(t);
    const red = isRedSea(pc.key);
    const eur = t.priceFrom && t.priceFrom > 0 ? t.priceFrom : null;
    items.push({
      id: t._id,
      city: pc.key,
      redSea: red,
      mode: t.tourMode === 'private' || t.tourMode === 'group' ? t.tourMode : '',
      length: lengthKey(t),
      eur,
      budgetValue: eur == null ? null : eur * rate,
      duration: durationSortValue(t),
      rank: i,
    });
    cards[t._id] = card(t, { listName: red ? redSeaListName : listName, hub, showCity });
  });
  return { items, cards, sorted, budgetEdges: budget.edges };
}

/** One shared day-tour card per product, with this language's labels. */
export async function dayCardRenderer(locale: Locale) {
  const t = await getTranslations({ locale, namespace: 'dayHub' });
  const tp = await getTranslations({ locale, namespace: 'productPanel' });
  const fromParts = (t.raw('fromPerPerson') as string).split('{price}');
  const fromPerPerson = (price: ReactNode) => (
    <>
      {fromParts[0]}
      {price}
      {fromParts[1] ?? ''}
    </>
  );
  return (tour: RawHubTour, opts: { listName: string; hub?: string; showCity?: boolean }) => {
    const type = tour.tourMode === 'group' ? tp('typeSmallGroup') : tour.tourMode === 'private' ? tp('typePrivate') : '';
    const length =
      typeof tour.durationHours === 'number'
        ? t('hours', { n: tour.durationHours })
        : tour.durationLabel || (typeof tour.durationDays === 'number' && tour.durationDays > 1 ? tp('days', { days: tour.durationDays }) : '');
    const meta = [type, length].filter(Boolean).join(' · ');
    return (
      <DayTourCard
        key={tour._id}
        p={{ slug: tour.enSlug ?? tour.slug, href: tour.slug, title: tour.title, priceFrom: tour.priceFrom, heroImage: tour.heroImage }}
        meta={meta}
        city={opts.showCity === false ? undefined : primaryCity(tour).name}
        summary={tour.summary}
        listName={opts.listName}
        source="day_tour_hub"
        checkLabel={tp('ctaCheckDate')}
        fromPerPerson={fromPerPerson}
        priceOnRequest={tp('priceOnRequest')}
        hub={opts.hub}
      />
    );
  };
}

/** siteSettings.responseTimeFull in this language (EN fallback). */
export async function responseTimeFull(locale: Locale): Promise<string> {
  const { client } = await import('@/sanity/lib/client');
  const r = await client.fetch<string | null>(
    `*[_type == "siteSettings"][0]{ "v": coalesce(responseTimeFull[_key==$locale][0].value, responseTimeFull[_key=="en"][0].value, "") }.v`,
    { locale },
  );
  return r ?? '';
}

/**
 * City filter options: Cairo & Giza · Luxor · Aswan & Abu Simbel · Alexandria
 * (the homepage's labels), other Nile Valley places, then the Red Sea cities
 * after a divider. `aliases` maps this language's city slugs to filter keys.
 */
export async function cityOptionsFor(tours: RawHubTour[], locale: Locale) {
  const t = await getTranslations({ locale, namespace: 'dayHub' });
  const { HOME_COPY } = await import('@/components/home-sales/copy');
  const home = HOME_COPY[(locale === 'es' || locale === 'ja' ? locale : 'en') as 'en' | 'es' | 'ja'];
  const names = new Map<string, string>();
  const aliases: Record<string, string> = {};
  for (const tr of tours) {
    const pc = primaryCity(tr);
    if (!pc.key) continue;
    if (!names.has(pc.key)) names.set(pc.key, pc.name);
    if (pc.localSlug) aliases[pc.localSlug] = pc.key;
  }
  const label = (k: string) =>
    k === 'cairo-giza' ? t('cairoGiza') : home.dayTours.cities[k]?.label ?? names.get(k) ?? k;
  const present = [...names.keys()];
  const nile = [
    ...NILE_KEYS.filter((k) => names.has(k)),
    ...present.filter((k) => !isRedSea(k) && !(NILE_KEYS as readonly string[]).includes(k)).sort(),
  ].map((k) => ({ value: k, label: label(k) }));
  const redSea = present
    .filter((k) => isRedSea(k))
    .sort()
    .map((k) => ({ value: k, label: names.get(k) ?? k }));
  return { nile, redSea, aliases };
}
