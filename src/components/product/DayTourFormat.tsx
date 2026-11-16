import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { TourProse } from '../tour-system/TourProse';
import { MoreAbout } from './MoreAbout';
import { SitesLine, IncludedAndExtra, ForYou, MakeItYours, type SiteRef, type ExclusionRow } from './ProductSections';

/**
 * Day-tour format (owner brief, 2026-11-16). Renders, in order: opening ·
 * Why the day runs this way · Your day (periods of timed stops; times only
 * where the product text gives them) · More about this day (the essay,
 * unchanged, in a <details>) · Included and extra · Is this day for you? ·
 * Make it yours · closing line. Inputs are owner-approved only.
 */

type Block = { _key?: string; _type?: string; style?: string; children?: Array<{ text?: string }> };

export interface DayTourStop {
  time?: string | null;
  title: string;
  glanceLabel?: string | null;
  skipGlance?: boolean | null;
  text?: string | null;
  sites?: SiteRef[] | null;
  includedNote?: string | null;
  optional?: Array<{ text: string; cost?: string | null; note?: string | null }> | null;
}
export interface DayTourPeriod {
  period: 'morning' | 'midday' | 'afternoon' | 'evening';
  periodLabel?: string | null;
  stops?: DayTourStop[] | null;
}
export interface DayTourIntro {
  opening?: string | null;
  whyThisOrder?: string | null;
  pickupTime?: string | null;
  returnNote?: string | null;
  lunch?: { status?: 'included' | 'notIncluded' | 'unknown' | null; text?: string | null } | null;
  fitFor?: string[] | null;
  worthKnowing?: string[] | null;
  closingLine?: string | null;
  closingRef?: string | null;
}
export interface DayTourFormatData {
  intro: DayTourIntro;
  periods: DayTourPeriod[];
}

export function dayTourFormatReady(f: DayTourFormatData | null | undefined): f is DayTourFormatData {
  return !!f && !!f.intro && Array.isArray(f.periods) && f.periods.some((p) => (p.stops ?? []).length > 0);
}

/** "Your day at a glance" items: time (if sourced) · short stop name. */
export function glanceItems(f: DayTourFormatData): Array<{ time?: string | null; label: string }> {
  return f.periods.flatMap((p) => (p.stops ?? []).filter((s) => s.title && !s.skipGlance).map((s) => ({ time: s.time, label: s.glanceLabel || s.title })));
}

/** The essay for the expander: every non-empty block except the closing line (shown on its own). */
function essayForExpander(essay: unknown, closingRef?: string | null): Block[] {
  if (!Array.isArray(essay)) return [];
  return (essay as Block[]).filter((b) => {
    if (!b || (closingRef && b._key === closingRef)) return false;
    if (b._type === 'block') return (b.children ?? []).some((c) => (c.text ?? '').trim());
    return true;
  });
}

export async function DayTourFormat({
  locale,
  slug,
  data,
  essay,
  included,
  excluded,
  options,
  beforeMakeItYours,
  cta,
}: {
  locale: Locale;
  slug: string;
  data: DayTourFormatData;
  essay: unknown;
  included: string[];
  excluded: ExclusionRow[];
  options: string[];
  beforeMakeItYours?: ReactNode;
  cta: ReactNode;
}) {
  const t = await getTranslations({ locale, namespace: 'productPanel' });
  const sep = locale === 'ja' ? '・' : ' · ';
  const colon = locale === 'ja' ? '：' : ': ';
  const { intro, periods } = data;
  const periodWord = (p: string) =>
    p === 'morning' ? t('dtMorning') : p === 'midday' ? t('dtMidday') : p === 'afternoon' ? t('dtAfternoon') : t('dtEvening');
  const more = essayForExpander(essay, intro.closingRef);

  return (
    <div className="pdp-itin pdp-daytour">
      {intro.opening && <p className="pdp-itin__opening lead">{intro.opening}</p>}

      {intro.whyThisOrder && (
        <section className="pdp-itin__why" aria-labelledby="pdp-why-h">
          <h2 id="pdp-why-h">{t('whyThisOrder')}</h2>
          <p>{intro.whyThisOrder}</p>
        </section>
      )}

      <section className="pdp-dayline" aria-labelledby="pdp-day-h">
        <h2 id="pdp-day-h">{t('yourDay')}</h2>
        {periods.map((p, pi) => (
          <div className="pdp-period" key={pi}>
            <h3 className="pdp-period__h">
              {periodWord(p.period)}
              {p.periodLabel && <span className="pdp-day__place">{sep}{p.periodLabel}</span>}
            </h3>
            <ol className="pdp-stops">
              {(p.stops ?? []).map((s, si) => {
                const sites = (s.sites ?? []).filter((x) => x?.name);
                const opts = (s.optional ?? []).filter((o) => o?.text);
                return (
                  <li className="pdp-stop" key={si}>
                    <p className="pdp-stop__h">
                      {s.time && <span className="pdp-stop__time">{s.time}{sep}</span>}
                      {s.title}
                    </p>
                    {s.text && <p>{s.text}</p>}
                    {sites.length > 0 && (
                      <p className="pdp-stop__sites">
                        <em>{t('sites')}{colon}</em>
                        <SitesLine sites={sites} locale={locale} />
                      </p>
                    )}
                    {s.includedNote && <p className="pdp-stop__incl">{s.includedNote}</p>}
                    {opts.length > 0 && (
                      <ul className="pdp-stop__opt">
                        {opts.map((o, i) => (
                          <li key={i}>
                            {o.text}
                            {o.note ? ` ${o.note}` : ''}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
        {more.length > 0 && (
          <MoreAbout label={t('moreAboutDay')} day={1} slug={slug}>
            <TourProse value={more} locale={locale} lead={false} />
          </MoreAbout>
        )}
      </section>

      <IncludedAndExtra locale={locale} included={included} excluded={excluded} />

      <ForYou locale={locale} heading={t('dayForYou')} fitFor={intro.fitFor ?? []} worthKnowing={intro.worthKnowing ?? []} />

      {beforeMakeItYours}

      <MakeItYours locale={locale} options={options} cta={cta} />

      {intro.closingLine && (
        <p className="pdp-itin__closing">
          <em>{intro.closingLine}</em>
        </p>
      )}
    </div>
  );
}
