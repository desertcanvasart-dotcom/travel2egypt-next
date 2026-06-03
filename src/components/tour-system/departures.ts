/**
 * Departures apparatus for group packages (journey-group-single). Pure helpers,
 * no rendering — the view maps these to markup + i18n. End dates are derived
 * from the trip duration; the row price is the base price, lifted by the peak
 * percentage on peak-flagged dates; price is null ("On inquiry") when no base
 * price is set (the peak flag stays dormant until then).
 */

export interface RawDeparture {
  startDate?: string; // ISO yyyy-mm-dd
  isPeak?: boolean;
  status?: string | null;
  placesLeft?: number | null;
}

export interface DepartureRow {
  startISO: string;
  dateRange: string; // "3–11 Oct 2026"
  shortDate: string; // "3 Oct" (for the rail "then …" line)
  status?: string | null; // guaranteed | few | available | soldout | onrequest
  placesLeft?: number | null;
  /** Per-person price in EUR, or null → "On inquiry" (no base price yet). */
  price: number | null;
  isPeak: boolean;
  isPast: boolean;
  isSoldOut: boolean;
}

function parseUTC(iso: string): Date | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function monthShort(d: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }).format(d);
}

export function formatDateRange(startISO: string, durationDays: number, locale: string): string {
  const start = parseUTC(startISO);
  if (!start) return '';
  const days = Number.isFinite(durationDays) && durationDays > 1 ? durationDays : 1;
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + days - 1);

  const sD = start.getUTCDate();
  const eD = end.getUTCDate();
  const sM = monthShort(start, locale);
  const eM = monthShort(end, locale);
  const sY = start.getUTCFullYear();
  const eY = end.getUTCFullYear();

  if (sY === eY && start.getUTCMonth() === end.getUTCMonth()) return `${sD}–${eD} ${eM} ${eY}`;
  if (sY === eY) return `${sD} ${sM} – ${eD} ${eM} ${eY}`;
  return `${sD} ${sM} ${sY} – ${eD} ${eM} ${eY}`;
}

function shortDate(startISO: string, locale: string): string {
  const d = parseUTC(startISO);
  if (!d) return '';
  return `${d.getUTCDate()} ${monthShort(d, locale)}`;
}

function priceFor(dep: RawDeparture, basePrice: number | null | undefined, upliftPct: number): number | null {
  if (typeof basePrice !== 'number' || !Number.isFinite(basePrice)) return null;
  if (dep.isPeak) return Math.round(basePrice * (1 + upliftPct / 100));
  return basePrice;
}

export interface DeparturesModel {
  rows: DepartureRow[]; // chronological, all dates
  count: number;
  next: DepartureRow | null; // soonest still-upcoming date
  upcomingAfterNext: DepartureRow[]; // the rest of the future dates, chronological
  hasFuture: boolean;
}

/**
 * Build the departures model. `now` is injected (build time) so the soonest
 * FUTURE date is selected deterministically; a departure counts as upcoming
 * until its derived end date has passed.
 */
export function buildDepartures(
  departures: RawDeparture[] | null | undefined,
  opts: { durationDays: number; basePrice?: number | null; peakUpliftPct?: number | null; locale: string; now: Date },
): DeparturesModel {
  const upliftPct = typeof opts.peakUpliftPct === 'number' ? opts.peakUpliftPct : 30;
  const nowMs = opts.now.getTime();

  const rows: DepartureRow[] = (departures ?? [])
    .filter((d): d is RawDeparture & { startDate: string } => Boolean(d?.startDate && parseUTC(d.startDate)))
    .map((d) => {
      const start = parseUTC(d.startDate)!;
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + Math.max(1, opts.durationDays) - 1);
      return {
        startISO: d.startDate,
        dateRange: formatDateRange(d.startDate, opts.durationDays, opts.locale),
        shortDate: shortDate(d.startDate, opts.locale),
        status: d.status ?? null,
        placesLeft: typeof d.placesLeft === 'number' ? d.placesLeft : null,
        price: priceFor(d, opts.basePrice, upliftPct),
        isPeak: Boolean(d.isPeak),
        isPast: end.getTime() < nowMs,
        isSoldOut: d.status === 'soldout',
      };
    })
    .sort((a, b) => a.startISO.localeCompare(b.startISO));

  const future = rows.filter((r) => !r.isPast && !r.isSoldOut);
  const next = future[0] ?? null;
  const upcomingAfterNext = next ? future.filter((r) => r.startISO !== next.startISO) : [];

  return { rows, count: rows.length, next, upcomingAfterNext, hasFuture: future.length > 0 };
}
