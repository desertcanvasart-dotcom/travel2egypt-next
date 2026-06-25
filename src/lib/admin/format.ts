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
