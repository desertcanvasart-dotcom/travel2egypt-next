/**
 * Multi-day "from" prices (owner spec, 2026-11-10): a product counts towards a
 * multi-day "from" figure (packages hub counter, theme cards, nav length
 * prices) only when it really is a multi-day trip. Excluded:
 *   - a stored duration under 2 days (or none), and
 *   - a product whose EN title or summary says it is one day ("in a day",
 *     "day tour", "one-day"), whatever its stored duration — e.g. "Alexandria
 *     in a Day…" is stored as 2 days.
 * "Two-Day Tour" does not match: "day tour" must not follow a hyphen.
 *
 * The product stays listed; only the computation skips it. Client-safe.
 */

/** GROQ projection fragment: the EN title and summary the check reads. */
export const ONE_DAY_CHECK_FIELDS = `"enTitle": title[_key=="en"][0].value, "enSummary": summary[_key=="en"][0].value`;

const ONE_DAY_TEXT = [/\bin a (single )?day\b/i, /(^|[^-\w])day[- ]tours?\b/i, /\b(one|1|single)[- ]day\b/i];

export interface OneDayCheck {
  durationDays?: number | null;
  enTitle?: string | null;
  enSummary?: string | null;
}

export function isOneDayProduct(p: OneDayCheck): boolean {
  if (!(typeof p.durationDays === 'number' && p.durationDays >= 2)) return true;
  const text = `${p.enTitle ?? ''}\n${p.enSummary ?? ''}`;
  return ONE_DAY_TEXT.some((re) => re.test(text));
}

/** The products that may set a multi-day "from" price. */
export function multiDayOnly<T extends OneDayCheck>(rows: T[]): T[] {
  return rows.filter((r) => !isOneDayProduct(r));
}
