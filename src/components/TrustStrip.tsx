/**
 * TrustStrip — "Why travellers trust us" on /plan-your-tour (rebuilt
 * 2026-11-08, owner spec). Four plain items, all from the site's single
 * sources so nothing can drift from the homepage proof row or the footer:
 *   - the Tripadvisor rating + review count (lib/company, same text as the
 *     homepage proof row) linked to our review page;
 *   - the short licence string (siteSettings → licenceShort);
 *   - "Guiding since 1993";
 *   - IATA, exactly as the footer renders it (iataItem).
 * KAYAK was removed (it linked to Kayak's Hurghada guide — not a recognition),
 * as were the decorative dots and the "30+ years" counter.
 */

import { TRIPADVISOR_URL } from '@/lib/company';

const DM = 'font-[family-name:var(--font-dm-sans)]';

export function TrustStrip({
  heading,
  tripadvisor,
  tripadvisorAria,
  items,
}: {
  heading: string;
  /** e.g. "4.9 on Tripadvisor (87 reviews)" — the ★ is added here. */
  tripadvisor: string;
  tripadvisorAria: string;
  /** Remaining items in order (licence, guiding since, IATA); empties are dropped. */
  items: Array<string | null | undefined>;
}) {
  const rest = items.filter((x): x is string => Boolean(x));
  return (
    <div className="mx-auto max-w-[920px] px-6">
      <p
        className={`${DM} mb-3 text-center text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-ink-muted`}
      >
        {heading}
      </p>
      <ul className={`${DM} flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[0.875rem] text-night`}>
        <li>
          <a
            href={TRIPADVISOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={tripadvisorAria}
            className="no-underline hover:opacity-70"
          >
            <span aria-hidden className="text-[#b89456]">★</span> {tripadvisor}
          </a>
        </li>
        {rest.map((x) => (
          <li key={x} className="before:mr-6 before:text-[#b89456] before:content-['·']">
            {x}
          </li>
        ))}
      </ul>
    </div>
  );
}
