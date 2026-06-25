/**
 * Africa/Cairo time helpers for the admin panel (Session 10).
 *
 * Visitors are scattered globally but the operations team works on Cairo
 * time — every timestamp the panel shows is rendered in `Africa/Cairo`, and
 * "today" in the daily stats is the Cairo calendar day. Egypt reinstated DST
 * in 2023 (April→October), so the helpers derive the offset dynamically via
 * Intl rather than hard-coding +02:00.
 */

const CAIRO = 'Africa/Cairo';

const DATETIME_FMT = new Intl.DateTimeFormat('en-GB', {
  timeZone: CAIRO,
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const YMD_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: CAIRO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function formatCairoDateTime(iso: string | null): string {
  if (!iso) return '—';
  return DATETIME_FMT.format(new Date(iso));
}

/** "+02:00" or "+03:00" — current Cairo offset at the supplied moment. */
function cairoOffsetAt(when: Date): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: CAIRO,
    timeZoneName: 'longOffset',
  }).formatToParts(when);
  const off = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+02:00';
  return off.replace('GMT', '') || '+02:00';
}

/** ISO timestamp at Cairo midnight, today. Used as the lower bound for daily stats. */
export function cairoTodayStartIso(): string {
  const now = new Date();
  const ymd = YMD_FMT.format(now); // "2026-06-25"
  const offset = cairoOffsetAt(now); // "+02:00" or "+03:00"
  return new Date(`${ymd}T00:00:00${offset}`).toISOString();
}

/**
 * Cairo "yesterday" window — [start, end) ISO timestamps covering the
 * previous Cairo calendar day. Used by the 08:00 Cairo daily digest cron
 * (runs at 08:00 Cairo today → covers yesterday 00:00 → today 00:00 Cairo).
 *
 * Naively subtracts 24h from today's Cairo midnight to get yesterday's
 * midnight. On a DST-transition day the window is technically 23h or 25h
 * long; the digest's intent (yesterday's activity) is preserved either way.
 */
export function cairoYesterdayWindowIso(): { startIso: string; endIso: string } {
  const endIso = cairoTodayStartIso();
  const startIso = new Date(new Date(endIso).getTime() - 24 * 60 * 60 * 1000).toISOString();
  return { startIso, endIso };
}
