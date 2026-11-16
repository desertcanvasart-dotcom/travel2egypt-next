import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { PortableText } from '@portabletext/react';

import type { Locale } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { pathFromDoc, type SitemapDocType } from '@/lib/path-from-doc';
import { TourProse } from '../tour-system/TourProse';
import { MoreAbout } from './MoreAbout';

/**
 * Multi-day itinerary format (owner brief, 2026-11-16). Renders, in order:
 * opening · Why this route works · Your {n} days (numbered day blocks with
 * practical rows and a "More about this stop" expander holding the unchanged
 * essay passages) · closing line · Your stay and travel · Included and extra
 * · Is this journey for you? · Make it yours. Inputs are owner-approved only
 * (the query returns `itineraryFormat` only when the intro and every day in
 * this language are approved).
 */

type Block = { _key?: string; _type?: string; style?: string };

export interface ItinSite {
  name: string;
  ref?: { _type?: string; slug?: string | null; citySlug?: string | null } | null;
}
export interface ItinDay {
  day: number;
  place?: string | null;
  title: string;
  body?: unknown[] | null;
  segments?: Array<{ label?: string | null; heading?: string | null; text: string }> | null;
  sites?: ItinSite[] | null;
  overnight?: string | null;
  meals?: Array<{ meal: 'breakfast' | 'lunch' | 'dinner'; label?: string | null; note?: string | null }> | null;
  travel?: string | null;
  pace?: string | null;
  optional?: Array<{ text: string; cost?: string | null; exclusionRef?: string | null }> | null;
  narrativeRefs?: string[] | null;
  continuesInDay?: number | null;
}
export interface ItinIntro {
  opening?: string | null;
  whyRoute?: string | null;
  whyRouteRefs?: string[] | null;
  closingLine?: string | null;
  closingRef?: string | null;
  stayAndTravel?: { hotels?: string | null; river?: string | null; train?: string | null; flight?: string | null; camp?: string | null; road?: string | null; everyDay?: string | null } | null;
  fitFor?: string[] | null;
  worthKnowing?: string[] | null;
  makeItYoursIntro?: string | null;
}
export interface ItineraryFormatData {
  intro: ItinIntro;
  days: ItinDay[];
}

/** True when the approved data covers every day 1..n of the product. */
export function itineraryFormatReady(f: ItineraryFormatData | null | undefined, durationDays: number): f is ItineraryFormatData {
  if (!f || !f.intro || !Array.isArray(f.days) || f.days.length === 0) return false;
  if (durationDays > 0 && f.days.length !== durationDays) return false;
  return f.days.every((d, i) => d.day === i + 1 && !!d.title);
}

const EN_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const ES_WORDS = ['cero', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte'];
/** "Your seven days" (EN/ES spell the number out, as the approved reference does; JA keeps digits). */
function countWord(n: number, locale: Locale): string {
  if (locale === 'en' && n >= 2 && n < EN_WORDS.length) return EN_WORDS[n];
  if (locale === 'es' && n >= 2 && n < ES_WORDS.length) return ES_WORDS[n];
  return String(n);
}

function siteHref(s: ItinSite): string | null {
  const r = s.ref;
  if (!r?._type || !r.slug) return null;
  return pathFromDoc({ type: r._type as SitemapDocType, slug: r.slug, parentCitySlug: r.citySlug ?? null });
}

function upperFirst(s: string, locale: Locale): string {
  return locale === 'ja' || !s ? s : s.charAt(0).toUpperCase() + s.slice(1);
}

export async function ItineraryFormat({
  locale,
  slug,
  data,
  essay,
  excluded,
  included,
  options,
  beforeMakeItYours,
  cta,
}: {
  locale: Locale;
  slug: string;
  data: ItineraryFormatData;
  /** The product's essay (this language), for the expanders. */
  essay: unknown;
  included: string[];
  excluded: Array<{ _key?: string; text: string; seeSection?: string | null }>;
  /** Approved "Make it your own" options. */
  options: string[];
  /** Practical info / departures / access note, between the days' sections and Make it yours. */
  beforeMakeItYours?: ReactNode;
  /** Customise + WhatsApp buttons (MidCta), rendered under Make it yours. */
  cta: ReactNode;
}) {
  const t = await getTranslations({ locale, namespace: 'productPanel' });
  const sep = locale === 'ja' ? '・' : ' · ';
  const { intro, days } = data;
  const blocks = (Array.isArray(essay) ? (essay as Block[]) : []).filter((b) => b && b._key);
  const byKey = new Map(blocks.map((b) => [b._key as string, b]));
  const pick = (keys?: string[] | null) => (keys ?? []).map((k) => byKey.get(k)).filter(Boolean) as Block[];

  // "see Day n": each Not-included row placed on a day by that day's optional extras.
  const dayOfExclusion = new Map<string, number>();
  for (const d of days) for (const o of d.optional ?? []) if (o.exclusionRef && !dayOfExclusion.has(o.exclusionRef)) dayOfExclusion.set(o.exclusionRef, d.day);

  const mealWord = (m: 'breakfast' | 'lunch' | 'dinner') =>
    m === 'breakfast' ? t('mealBreakfast') : m === 'lunch' ? t('mealLunch') : t('mealDinner');
  const segWord = (l?: string | null) =>
    l === 'morning' ? t('segMorning') : l === 'midday' ? t('segMidday') : l === 'afternoon' ? t('segAfternoon') : l === 'evening' ? t('segEvening') : '';

  const stay = intro.stayAndTravel ?? {};
  const stayRows: Array<[string, string | null | undefined]> = [
    [t('stayHotels'), stay.hotels],
    [t('stayRiver'), stay.river],
    [t('stayTrain'), stay.train],
    [t('stayFlight'), stay.flight],
    [t('stayCamp'), stay.camp],
    [t('stayRoad'), stay.road],
    [t('stayEveryDay'), stay.everyDay],
  ];
  const fit = (intro.fitFor ?? []).filter(Boolean);
  const worth = (intro.worthKnowing ?? []).filter(Boolean);
  const routeMore = pick(intro.whyRouteRefs);

  return (
    <div className="pdp-itin">
      {intro.opening && <p className="pdp-itin__opening lead">{intro.opening}</p>}

      {intro.whyRoute && (
        <section className="pdp-itin__why" aria-labelledby="pdp-why-h">
          <h2 id="pdp-why-h">{t('whyRoute')}</h2>
          <p>{intro.whyRoute}</p>
          {routeMore.length > 0 && (
            <MoreAbout label={t('moreAboutRoute')} day="route" slug={slug}>
              <TourProse value={routeMore} locale={locale} lead={false} />
            </MoreAbout>
          )}
        </section>
      )}

      <section className="pdp-days" aria-labelledby="pdp-days-h">
        <h2 id="pdp-days-h">{t('yourDays', { n: countWord(days.length, locale) })}</h2>
        <ol className="pdp-days__list">
          {days.map((d) => {
            const more = pick(d.narrativeRefs);
            const sites = (d.sites ?? []).filter((s) => s?.name);
            const meals = (d.meals ?? []).filter((m) => m?.meal);
            const mealsText = meals
              .map((m, i) => {
                const word = m.label || mealWord(m.meal);
                const w = i === 0 ? upperFirst(word, locale) : word;
                return m.note ? `${w} (${m.note})` : w;
              })
              .join(sep);
            const isLast = d.day === days.length;
            const rows: Array<[string, ReactNode]> = [];
            if (sites.length)
              rows.push([
                t('theDay'),
                sites.map((s, i) => {
                  const href = siteHref(s);
                  return (
                    <span key={i}>
                      {i > 0 && sep}
                      {href ? <Link href={href}>{s.name}</Link> : s.name}
                    </span>
                  );
                }),
              ]);
            if (d.overnight) rows.push([t('overnight'), d.overnight]);
            else if (isLast) rows.push([t('overnight'), '—']);
            if (mealsText) rows.push([t('meals'), mealsText]);
            if (d.travel) rows.push([t('travel'), d.travel]);
            if (d.pace) rows.push([t('pace'), d.pace]);
            const opts = (d.optional ?? []).filter((o) => o?.text);
            return (
              <li className="pdp-day" id={`day-${d.day}`} key={d.day}>
                <h3 className="pdp-day__h">
                  <span className="pdp-day__n">{t('dayN', { n: d.day })}</span>
                  {d.place && <span className="pdp-day__place">{sep}{d.place}</span>}
                </h3>
                <p className="pdp-day__title">{d.title}</p>
                {Array.isArray(d.segments) && d.segments.length > 0
                  ? d.segments.map((s, i) => (
                      <p key={i}>
                        <strong>{(s.heading || segWord(s.label)) + (locale === 'ja' ? '　' : '. ')}</strong>
                        {s.text}
                      </p>
                    ))
                  : Array.isArray(d.body) && d.body.length > 0 && <PortableText value={d.body as never} />}
                {rows.length > 0 && (
                  <dl className="pdp-day__rows">
                    {rows.map(([k, v], i) => (
                      <div key={i}>
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {opts.length > 0 && (
                  <div className="pdp-day__opt">
                    <p className="pdp-day__opt-h">{t('optionalToday')}</p>
                    <ul>
                      {opts.map((o, i) => (
                        <li key={i}>{o.text}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {more.length > 0 ? (
                  <MoreAbout label={t('moreAbout')} day={d.day} slug={slug}>
                    <TourProse value={more} locale={locale} lead={false} />
                  </MoreAbout>
                ) : typeof d.continuesInDay === 'number' ? (
                  <p className="pdp-day__cont">
                    <a href={`#day-${d.continuesInDay}`}>{t('continuesInDay', { n: d.continuesInDay })}</a>
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
        {intro.closingLine && (
          <p className="pdp-itin__closing">
            <em>{intro.closingLine}</em>
          </p>
        )}
      </section>

      {stayRows.some(([, v]) => v) && (
        <section className="pdp-stay" aria-labelledby="pdp-stay-h">
          <h2 id="pdp-stay-h">{t('stayTravel')}</h2>
          {stayRows
            .filter(([, v]) => v)
            .map(([k, v], i) => (
              <p key={i}>
                <strong>{k}{locale === 'ja' ? '：' : ':'}</strong> {v}
              </p>
            ))}
        </section>
      )}

      {(included.length > 0 || excluded.length > 0) && (
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
                    const day = x._key ? dayOfExclusion.get(x._key) : undefined;
                    const link =
                      typeof day === 'number' ? (
                        <a href={`#day-${day}`}>{t('seeDay', { n: day })}</a>
                      ) : x.seeSection === 'make-it-yours' ? (
                        <a href="#make-it-yours">{t('seeMakeItYours')}</a>
                      ) : null;
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
      )}

      {(fit.length > 0 || worth.length > 0) && (
        <section className="pdp-foryou" aria-labelledby="pdp-foryou-h">
          <h2 id="pdp-foryou-h">{t('forYou')}</h2>
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
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {beforeMakeItYours}

      <section className="pdp-yours" id="make-it-yours" aria-labelledby="pdp-yours-h">
        <h2 id="pdp-yours-h">{t('makeItYours')}</h2>
        {intro.makeItYoursIntro && <p>{intro.makeItYoursIntro}</p>}
        {options.length > 0 && (
          <ul>
            {options.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        )}
        {cta}
      </section>
    </div>
  );
}
