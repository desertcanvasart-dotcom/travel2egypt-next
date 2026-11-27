import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { pathFromDoc, type SitemapDocType } from '@/lib/path-from-doc';
import { MONASTERY_HOURS_TOKEN, hoursSentence, upcomingHolidays, holidaysLabel, formatClosure, saintCatherineMonastery } from '@/data/monastery-hours';

/**
 * Sections shared by the multi-day itinerary format and the day-tour format
 * (owner briefs, 2026-11-16): the sites line with guide links, Included and
 * extra, Is this … for you?, Make it yours.
 */

export interface SiteRef {
  name: string;
  ref?: { _type?: string; slug?: string | null; citySlug?: string | null } | null;
}

export function siteHref(s: SiteRef): string | null {
  const r = s.ref;
  if (!r?._type || !r.slug) return null;
  return pathFromDoc({ type: r._type as SitemapDocType, slug: r.slug, parentCitySlug: r.citySlug ?? null });
}

/** "a · b · c", each name linked to its guide page when it has one. */
export function SitesLine({ sites, locale }: { sites: SiteRef[]; locale: Locale }) {
  const sep = locale === 'ja' ? '・' : ' · ';
  return (
    <>
      {sites
        .filter((s) => s?.name)
        .map((s, i) => {
          const href = siteHref(s);
          return (
            <span key={i}>
              {i > 0 && sep}
              {href ? <Link href={href}>{s.name}</Link> : s.name}
            </span>
          );
        })}
    </>
  );
}

export interface ExclusionRow {
  _key?: string;
  text: string;
  seeSection?: string | null;
}

/**
 * Included and extra. `seeLink` returns the "see …" link for a Not-included
 * row (e.g. "see Day 2"), or null.
 */
export async function IncludedAndExtra({
  locale,
  included,
  excluded,
  seeLink,
}: {
  locale: Locale;
  included: string[];
  excluded: ExclusionRow[];
  seeLink?: (row: ExclusionRow) => ReactNode | null;
}) {
  if (included.length === 0 && excluded.length === 0) return null;
  const t = await getTranslations({ locale, namespace: 'productPanel' });
  return (
    <section className="pdp-factsblock pdp-incl-extra" aria-labelledby="pdp-incl-h">
      <h2 id="pdp-incl-h">{t('includedExtra')}</h2>
      <div className="pdp-incl">
        {included.length > 0 && (
          <div>
            <h3>{t('included')}</h3>
            <ul className="yes">
              {included.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>
        )}
        {excluded.length > 0 && (
          <div>
            <h3>{t('notIncluded')}</h3>
            <ul className="no">
              {excluded.map((x, i) => {
                const link = seeLink?.(x) ?? null;
                // "Item: see Day 2", or "Item: optional (see Day 7)" when the text already has a colon.
                const hasColon = /[:：]/.test(x.text);
                return (
                  <li key={i}>
                    {x.text}
                    {link && (hasColon ? <> ({link})</> : <>{locale === 'ja' ? '：' : ': '}{link}</>)}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

/** "Is this journey / day for you?" — A good fit if you… + Worth knowing. */
export async function ForYou({ locale, heading, fitFor, worthKnowing }: { locale: Locale; heading: string; fitFor: string[]; worthKnowing: string[] }) {
  const fit = fitFor.filter(Boolean);
  const worth = worthKnowing.filter(Boolean);
  if (!fit.length && !worth.length) return null;
  const t = await getTranslations({ locale, namespace: 'productPanel' });
  return (
    <section className="pdp-foryou" aria-labelledby="pdp-foryou-h">
      <h2 id="pdp-foryou-h">{heading}</h2>
      {fit.length > 0 && (
        <>
          <p className="pdp-foryou__h">{t('goodFit')}</p>
          <ul>
            {fit.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </>
      )}
      {worth.length > 0 && (
        <>
          <p className="pdp-foryou__h">{t('worthKnowing')}</p>
          <ul>
            {worth.map((x, i) => (
              <li key={i}>{x.includes(MONASTERY_HOURS_TOKEN) ? <MonasteryHours locale={locale} text={x} /> : x}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/** A "Worth knowing" line with the monastery marker: the hours from src/data/monastery-hours,
 *  then the holiday closures for this year and later, with the data's "checked" stamp. */
function MonasteryHours({ locale, text }: { locale: Locale; text: string }) {
  const years = upcomingHolidays();
  return (
    <>
      {text.replace(MONASTERY_HOURS_TOKEN, hoursSentence(locale))}
      {years.map(({ year, dates }) => (
        <details key={year} className="pdp-foryou__dates">
          <summary>{holidaysLabel(locale, year)}</summary>
          <p>
            {dates.map((d) => formatClosure(d, locale)).join(' · ')}
            <br />
            <small>{saintCatherineMonastery.checked[locale]}</small>
          </p>
        </details>
      ))}
    </>
  );
}

/** Make it yours: an optional intro line, the approved options, then the CTA pair. */
/** A "Make it your own" item, linked to the tour its row points at (linkRef), when it has one. */
export function OptionItem({ text, slug }: { text: string; slug?: string | null }) {
  const href = slug ? pathFromDoc({ type: 'tour', slug }) : null;
  return href ? <Link href={href}>{text}</Link> : <>{text}</>;
}

export async function MakeItYours({ locale, intro, options, optionLinks, cta, title }: { locale: Locale; intro?: string | null; options: string[]; optionLinks?: Array<string | null> | null; cta: ReactNode; title?: string }) {
  const t = await getTranslations({ locale, namespace: 'productPanel' });
  return (
    <section className="pdp-yours" id="make-it-yours" aria-labelledby="pdp-yours-h">
      {/* Approved heading set (canon III.5): the same heading as the right-column block. */}
      <h2 id="pdp-yours-h">{title ?? t('optionsTitle')}</h2>
      {intro && <p>{intro}</p>}
      {options.length > 0 && (
        <ul>
          {options.map((o, i) => (
            <li key={i}>
              <OptionItem text={o} slug={optionLinks?.[i]} />
            </li>
          ))}
        </ul>
      )}
      {cta}
    </section>
  );
}
