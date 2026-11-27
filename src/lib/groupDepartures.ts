/**
 * Group departures calendar — every scheduled group departure across the
 * published group tours, in date order, grouped by month (owner, 2026-11-24).
 * Pure and unit-tested (src/lib/__tests__/group-departures.test.ts).
 *
 * Nothing here invents a date or a price: dates come from each tour's
 * `departures[]` (Sanity) through the same buildDepartures/isOffered rules the
 * tour pages use (after today; hidden 14 days before the start unless the date
 * has bookings; sold-out dates stay visible but marked), and the per-person
 * price is the tour's own base price, lifted on peak-flagged dates.
 */
import { buildDepartures, type RawDeparture } from '@/components/tour-system/departures';

export interface CalendarTour {
  _id: string;
  title: string;
  /** This language's slug (the link target). */
  href: string;
  durationDays?: number | null;
  /** Per-person price in EUR (the guide-language price where one is set). */
  priceFrom?: number | null;
  peakUpliftPct?: number | null;
  maxGroup?: number | null;
  /** Fixed dates, private guiding (long Nile cruises). */
  privateGuiding?: boolean | null;
  departures?: RawDeparture[] | null;
}

export interface CalendarRow {
  key: string;
  startISO: string;
  dateRange: string;
  status: string | null;
  placesLeft: number | null;
  price: number | null;
  isPeak: boolean;
  isSoldOut: boolean;
  tourId: string;
  title: string;
  href: string;
  days: number | null;
  /** True: the dates are fixed but the guiding, car and sightseeing are private to the party. */
  isPrivate: boolean;
}

export interface CalendarMonth {
  /** yyyy-mm, used as the anchor id. */
  key: string;
  label: string;
  rows: CalendarRow[];
}

export function buildCalendar(tours: CalendarTour[], opts: { now: Date; locale: string }): CalendarMonth[] {
  const rows: CalendarRow[] = [];
  for (const t of tours) {
    if (!t.href) continue;
    const days = typeof t.durationDays === 'number' && t.durationDays > 0 ? t.durationDays : null;
    const model = buildDepartures(t.departures, {
      durationDays: days ?? 1,
      basePrice: t.priceFrom,
      peakUpliftPct: t.peakUpliftPct,
      maxGroup: t.maxGroup,
      locale: opts.locale,
      now: opts.now,
    });
    for (const r of model.rows) {
      if (r.isPast) continue;
      rows.push({
        key: `${t._id}-${r.startISO}`,
        startISO: r.startISO,
        dateRange: r.dateRange,
        status: r.status ?? null,
        placesLeft: r.placesLeft ?? null,
        price: r.price,
        isPeak: r.isPeak,
        isSoldOut: r.isSoldOut,
        tourId: t._id,
        title: t.title,
        href: t.href,
        days,
        isPrivate: Boolean(t.privateGuiding),
      });
    }
  }
  rows.sort((a, b) => a.startISO.localeCompare(b.startISO) || a.title.localeCompare(b.title));

  const fmt = new Intl.DateTimeFormat(opts.locale, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const months: CalendarMonth[] = [];
  for (const r of rows) {
    const key = r.startISO.slice(0, 7);
    let m = months[months.length - 1];
    if (!m || m.key !== key) {
      m = { key, label: fmt.format(new Date(`${key}-01T00:00:00Z`)), rows: [] };
      months.push(m);
    }
    m.rows.push(r);
  }
  return months;
}
