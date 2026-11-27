import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { PortableText } from '@portabletext/react';

import type { Locale } from '@/i18n/routing';
import { TourProse } from '../tour-system/TourProse';
import { MoreAbout } from './MoreAbout';
import { SitesLine, IncludedAndExtra, ForYou, MakeItYours, type SiteRef } from './ProductSections';

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

export type ItinSite = SiteRef;
export interface ItinDay {
  day: number;
  place?: string | null;
  title?: string | null;
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
  stayAndTravel?: { hotels?: string | null; river?: string | null; train?: string | null; flight?: string | null; camp?: string | null; road?: string | null; arrival?: string | null; everyDay?: string | null; water?: string | null } | null;
  /** A note above the days (e.g. the cruise's sailing order). */
  daysNote?: { lead?: string | null; text?: string | null } | null;
  /** Panel rows (packages that start and end in different places). */
  pickup?: string | null;
  ends?: string | null;
  /** Rows with the locked copy's own labels (panel / Your stay and travel). */
  panelRows?: Array<{ label?: string | null; text?: string | null }> | null;
  stayRows?: Array<{ label?: string | null; text?: string | null }> | null;
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
  return f.days.every((d, i) => d.day === i + 1);
}

const EN_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const ES_WORDS = ['cero', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte'];
/** "Your seven days" (EN/ES spell the number out, as the approved reference does; JA keeps digits). */
function countWord(n: number, locale: Locale): string {
  if (locale === 'en' && n >= 2 && n < EN_WORDS.length) return EN_WORDS[n];
  if (locale === 'es' && n >= 2 && n < ES_WORDS.length) return ES_WORDS[n];
  return String(n);
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
  yoursTitle,
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
  /** Replaces the "Make it your own" heading (group trips booked on Sawa). */
  yoursTitle?: string;
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
  const stayRows: Array<[string, string | null | undefined]> = intro.stayRows?.length
    ? intro.stayRows.map((r) => [r.label ?? '', r.text])
    : [
    [t('stayHotels'), stay.hotels],
    [t('stayRiver'), stay.river],
    [t('stayTrain'), stay.train],
    [t('stayFlight'), stay.flight],
    [t('stayCamp'), stay.camp],
    [t('stayRoad'), stay.road],
    [t('stayArrival'), stay.arrival],
    [t('stayEveryDay'), stay.everyDay],
    [t('stayWater'), stay.water],
      ];
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
        {intro.daysNote?.text && (
          <p className="pdp-days__note">
            {intro.daysNote.lead && <strong>{intro.daysNote.lead} </strong>}
            {intro.daysNote.text}
          </p>
        )}
        <ol className="pdp-days__list">
          {days.map((d) => {
            const more = pick(d.narrativeRefs);
            const sites = (d.sites ?? []).filter((s) => s?.name);
            const meals = (d.meals ?? []).filter((m) => m?.meal);
            const mealsText = meals
              .map((m, i) => {
                const word = m.label || mealWord(m.meal);
                const w = i === 0 ? upperFirst(word, locale) : word;
                if (!m.note) return w;
                return locale === 'ja' ? `${w}（${m.note}）` : `${w} (${m.note})`;
              })
              .join(sep);
            const isLast = d.day === days.length;
            const rows: Array<[string, ReactNode]> = [];
            if (sites.length) rows.push([t('theDay'), <SitesLine sites={sites} locale={locale} />]);
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
                {d.title && <p className="pdp-day__title">{d.title}</p>}
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

      <IncludedAndExtra
        locale={locale}
        included={included}
        excluded={excluded}
        seeLink={(x) => {
          const day = x._key ? dayOfExclusion.get(x._key) : undefined;
          if (typeof day === 'number') return <a href={`#day-${day}`}>{t('seeDay', { n: day })}</a>;
          if (x.seeSection === 'make-it-yours') return <a href="#make-it-yours">{t('seeMakeItYours')}</a>;
          return null;
        }}
      />

      <ForYou locale={locale} heading={t('forYou')} fitFor={intro.fitFor ?? []} worthKnowing={intro.worthKnowing ?? []} />

      {beforeMakeItYours}

      <MakeItYours locale={locale} intro={intro.makeItYoursIntro} options={options} cta={cta} title={yoursTitle} />
    </div>
  );
}
