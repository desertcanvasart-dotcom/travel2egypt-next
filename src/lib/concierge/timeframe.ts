/**
 * Follow-up timeframe for the brief-completion panel (Session 4, design
 * spec §4). v4.1's commitment: requests before 1 p.m. Cairo are answered
 * the same day by 8 p.m. Cairo; after 1 p.m., by 10 a.m. Cairo the next
 * morning. We compute the concrete target instant and render it in BOTH
 * Cairo time and the visitor's browser zone.
 *
 * Pure + client-safe (uses Intl only). Returns the pieces; the panel
 * composes the localized sentence via i18n.
 */

const CAIRO = 'Africa/Cairo';

/** Offset (ms) of `timeZone` at the given instant: zoned-wall − UTC. */
function tzOffsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const map: Record<string, number> = {};
  for (const p of dtf.formatToParts(date)) {
    if (p.type !== 'literal') map[p.type] = Number(p.value);
  }
  const asUTC = Date.UTC(map.year, map.month - 1, map.day, map.hour, map.minute, map.second);
  return asUTC - date.getTime();
}

/** Absolute instant for a Cairo wall-clock time (one-step; fine off DST edges). */
function cairoWallToInstant(y: number, m: number, d: number, hour: number): Date {
  const guessUTC = Date.UTC(y, m, d, hour, 0, 0);
  const offset = tzOffsetMs(new Date(guessUTC), CAIRO);
  return new Date(guessUTC - offset);
}

export interface FollowUpTimeframe {
  /** target time in Cairo, locale-formatted, e.g. "8:00 PM" / "20:00" */
  cairoTime: string;
  /** same instant in the visitor's browser zone */
  localTime: string;
  /** 'today' | 'tomorrow' (i18n key for the day word) */
  dayKey: 'today' | 'tomorrow';
}

export function computeFollowUpTimeframe(
  locale: string,
  now: Date = new Date(),
): FollowUpTimeframe {
  // Current Cairo wall-clock parts.
  const parts: Record<string, number> = {};
  for (const p of new Intl.DateTimeFormat('en-US', {
    timeZone: CAIRO,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
  }).formatToParts(now)) {
    if (p.type !== 'literal') parts[p.type] = Number(p.value);
  }

  const beforeCutoff = parts.hour < 13;
  // before 1pm → today 20:00; otherwise → tomorrow 10:00
  const target = beforeCutoff
    ? cairoWallToInstant(parts.year, parts.month - 1, parts.day, 20)
    : cairoWallToInstant(parts.year, parts.month - 1, parts.day + 1, 10);

  const cairoTime = new Intl.DateTimeFormat(locale, {
    timeZone: CAIRO,
    hour: 'numeric',
    minute: '2-digit',
  }).format(target);
  const localTime = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(target);

  return { cairoTime, localTime, dayKey: beforeCutoff ? 'today' : 'tomorrow' };
}
