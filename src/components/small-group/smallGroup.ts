/**
 * Small-group hub helpers (owner spec, 2026-11-10). Pure, client-safe and
 * unit-tested (src/lib/__tests__/small-group.test.ts).
 *
 * Nothing here invents product facts: dates come from the product's
 * `departures[]` (Sanity), the route from the product's own localized title,
 * the region from `originRegion`.
 */
import { isOffered, type RawDeparture } from '@/components/tour-system/departures';

export type SgLocale = 'en' | 'es' | 'ja';

/** Short region badges, keyed by the tour's `originRegion` value. */
export const REGION_LABELS: Record<string, Record<SgLocale, string>> = {
  'japan-east-asia': { en: 'Japan & East Asia', es: 'Japón y Asia oriental', ja: '日本・東アジア' },
  'uk-europe': { en: 'UK & Europe', es: 'Reino Unido y Europa', ja: '英国・ヨーロッパ' },
  'usa-canada': { en: 'USA & Canada', es: 'EE. UU. y Canadá', ja: '米国・カナダ' },
  'australia-oceania': { en: 'Australia & Oceania', es: 'Australia y Oceanía', ja: 'オーストラリア・オセアニア' },
};

export function regionLabel(region: string | null | undefined, locale: SgLocale): string | null {
  return (region && REGION_LABELS[region]?.[locale]) || null;
}

/**
 * The next `max` departure dates still offered (see isOffered: after today,
 * and more than DEPARTURE_CUTOFF_DAYS (14) days away unless marked booked; sold-out dates skipped),
 * formatted per language: en "14 Jan", es "14 ene", ja "1月14日". Past
 * dates never appear; an empty list means "ask us".
 */
export function nextDepartureLabels(
  departures: RawDeparture[] | null | undefined,
  locale: SgLocale,
  now: Date,
  max = 3,
  maxGroup?: number | null,
): string[] {
  const fmt = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : locale, {
    day: 'numeric',
    month: locale === 'ja' ? 'long' : 'short',
    timeZone: 'UTC',
  });
  return (departures ?? [])
    .filter((d): d is RawDeparture & { startDate: string } => typeof d?.startDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d.startDate))
    .filter((d) => d.status !== 'soldout' && isOffered(d, { now, maxGroup }))
    .map((d) => d.startDate.slice(0, 10))
    .sort()
    .filter((iso, i, all) => all.indexOf(iso) === i)
    .slice(0, max)
    .map((iso) => fmt.format(new Date(`${iso}T00:00:00Z`)).replace(/\.$/, ''));
}

/**
 * Route stops from the product's own title — the part after the ":" / "：" /
 * "——": "9-Day Egypt Group Tour: Cairo, Abu Simbel & the Nile" →
 * [Cairo, Abu Simbel, the Nile]. ES drops the trailing "en 9 días"; JA drops
 * a leading "そして" and a trailing "へ". Fewer than two stops → [] (no route).
 */
export function routeFromTitle(title: string | null | undefined): string[] {
  if (!title) return [];
  const parts = title.split(/:|：|——/);
  if (parts.length < 2) return [];
  const tail = parts[parts.length - 1]
    .trim()
    .replace(/\s+en\s+\d+\s+días?$/i, '');
  const stops = tail
    .split(/\s*,\s*|\s*、\s*|\s+&\s+|\s+and\s+|\s+y\s+|\s+e\s+/)
    .map((s) => s.trim().replace(/^そして/, '').replace(/へ$/, '').trim())
    .filter(Boolean);
  return stops.length >= 2 ? stops : [];
}
