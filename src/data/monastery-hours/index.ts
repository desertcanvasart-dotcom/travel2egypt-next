/* ============================================================================
 * monastery-hours/index.ts — Saint Catherine's Monastery: visiting hours and
 * closure days, kept as data (canon II.7: commercial facts that change every
 * year are data, not copy).
 *
 * SOURCE: the monastery's own calendar, "Holidays of the Year 2027" (published
 * 17/03/2026, stamped and signed), sent by the owner 17 Nov 2026 with the Sinai
 * package. Hours and closures are verbatim from it. CHECKED: November 2026.
 *
 * WHERE IT SHOWS: a "Worth knowing" line on a tour page may contain the marker
 * MONASTERY_HOURS_TOKEN. The page replaces it with `hoursSentence(locale)` and
 * adds the closure dates for this year and later underneath (ProductSections).
 * The sentence is the owner's locked wording (Sinai 2-day, EN/ES/JA, 17 Nov),
 * word for word — a test checks it.
 *
 * EACH YEAR: when the monastery publishes the next calendar, add the year to
 * `holidays`, check the hours, and update `checked` (en/es/ja). Nothing else.
 * When a year has passed and no later year is listed, the page still shows the
 * hours sentence, without dates.
 * ==========================================================================*/

import type { Locale } from '@/i18n/routing';

export const MONASTERY_HOURS_TOKEN = '{{saint-catherine-monastery-hours}}';

export const saintCatherineMonastery = {
  /** The verification stamp — owner-supplied calendar, checked when entered. */
  checked: { en: 'Checked November 2026', es: 'Comprobado en noviembre de 2026', ja: '2026年11月に確認' } as Record<Locale, string>,
  source: 'https://www.sinaimonastery.com',
  hours: { open: '08:45', close: '11:30' },
  /** Fridays: a later opening, and the museum is closed. */
  friday: { open: '10:45', close: '11:30', museumClosed: true },
  /** Closed every Sunday, besides the holidays below. */
  closedEveryWeek: ['sunday'] as const,
  /** Holidays when the monastery receives no visitors, by year (ISO dates). */
  holidays: {
    2027: [
      '2027-01-06', '2027-01-07', '2027-01-14', '2027-01-18', '2027-01-19', '2027-01-20', '2027-01-27',
      '2027-02-15',
      '2027-03-15', '2027-03-16', '2027-03-17',
      '2027-04-07', '2027-04-24', '2027-04-28', '2027-04-29', '2027-04-30',
      '2027-05-01', '2027-05-03', '2027-05-05',
      '2027-06-09', '2027-06-10', '2027-06-21',
      '2027-07-12',
      '2027-08-19', '2027-08-28',
      '2027-09-21', '2027-09-27',
      '2027-10-25',
      '2027-12-04', '2027-12-06', '2027-12-07', '2027-12-08', '2027-12-09',
    ],
  } as Record<number, string[]>,
};

const m = saintCatherineMonastery;

/** The hours, in the owner's locked wording (Sinai 2-day, 17 Nov 2026). */
export function hoursSentence(locale: Locale): string {
  const { open, close } = m.hours;
  const f = m.friday;
  switch (locale) {
    case 'es':
      return `El monasterio recibe visitas de ${open} a ${close}. Los viernes solo abre de ${f.open} a ${f.close}, y su museo está cerrado. Cierra los domingos y en las fiestas ortodoxas de su calendario publicado.`;
    case 'ja':
      return `修道院の見学時間は${open}〜${close}です。金曜日は${f.open}〜${f.close}のみで、博物館は閉館します。日曜日と、修道院が公表している暦の正教会の祝日は閉館です。`;
    default:
      return `The monastery receives visitors from ${open} to ${close}. On Fridays it opens only from ${f.open} to ${f.close}, and its museum is closed. It’s closed on Sundays and on the Orthodox holidays in its published calendar.`;
  }
}

/** Holiday closures in `year` and later, as ISO dates (Sundays are not listed). */
export function upcomingHolidays(today: Date = new Date()): { year: number; dates: string[] }[] {
  const y = today.getUTCFullYear();
  return Object.entries(m.holidays)
    .map(([year, dates]) => ({ year: Number(year), dates }))
    .filter((h) => h.year >= y)
    .sort((a, b) => a.year - b.year);
}

/** True when the monastery receives visitors on this date (ISO yyyy-mm-dd). */
export function isMonasteryOpen(iso: string): boolean {
  const d = new Date(`${iso}T12:00:00Z`);
  if (d.getUTCDay() === 0) return false;
  return !(m.holidays[d.getUTCFullYear()] ?? []).includes(iso);
}

/** The label above the closure dates. */
export function holidaysLabel(locale: Locale, year: number): string {
  switch (locale) {
    case 'es':
      return `Fiestas en que cierra en ${year} (además de los domingos)`;
    case 'ja':
      return `${year}年の閉館日（日曜日以外）`;
    default:
      return `Holidays it’s closed in ${year} (besides Sundays)`;
  }
}

/** A date as the page shows it: "Wed 6 Jan", "mié 6 ene", "1月6日（水）". */
export function formatClosure(iso: string, locale: Locale): string {
  const d = new Date(`${iso}T12:00:00Z`);
  const opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' };
  return new Intl.DateTimeFormat(locale === 'ja' ? 'ja-JP' : locale === 'es' ? 'es-ES' : 'en-GB', opts).format(d);
}
