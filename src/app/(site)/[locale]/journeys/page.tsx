import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { JsonLd } from '@/components/JsonLd';
import { Price } from '@/components/Price';
import { JourneyImage } from '@/components/tour-system/JourneyImage';
import { LeadForm } from '@/components/leads/LeadForm';
import { TrackedWhatsApp } from '@/components/nav/TrackedWhatsApp';
import { HOME_COPY, type HomeLocale } from '@/components/home-sales/copy';
import { buildStaticMetadata } from '@/lib/seo';
import { absoluteUrl, buildBreadcrumbList } from '@/lib/structured-data';
import { client } from '@/sanity/lib/client';
import { siteSettingsQuery } from '@/sanity/lib/queries';
import { getNavData } from '@/lib/nav/navData';
import { getJourneyCardPrices, getJourneysLive } from '@/lib/journeys/data';
import { JOURNEY_KEYS, JOURNEYS, JOURNEY_UI, journeyLocale } from '@/lib/journeys/registry';

import '@/styles/journeys.css';

/**
 * /journeys — the travel-styles overview (journey pages Phase A §7.2): six
 * cards (approved hero, label, the homepage card's one-line promise, from
 * price, "Explore this style →"), then the end block with the itinerary form.
 */
interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const ui = JOURNEY_UI[journeyLocale(locale)];
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/journeys',
    title: `${ui.indexTitle} | Travel2Egypt`,
    description: ui.indexDescription,
    availableLocales: ['en', 'es', 'ja'],
  });
}

export default async function JourneysIndex({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lc = locale as Locale;
  const L = journeyLocale(lc);
  const ui = JOURNEY_UI[L];
  const home = HOME_COPY[L as HomeLocale];
  const [live, prices, nav, settings, tNav] = await Promise.all([
    getJourneysLive(lc),
    getJourneyCardPrices(lc),
    getNavData(lc),
    client.fetch<{ responseTimeFull?: string | null } | null>(siteSettingsQuery(lc)),
    getTranslations({ locale, namespace: 'nav' }),
  ]);
  const sep = L === 'ja' ? '' : ' ';

  return (
    <article className="journey-doc journeys-index" lang={locale}>
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: ui.indexH1,
            itemListElement: JOURNEY_KEYS.map((k, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: absoluteUrl(JOURNEYS[k].path, lc),
              name: JOURNEYS[k].label[L],
            })),
          },
          buildBreadcrumbList(
            [
              { name: tNav('home'), path: '/' },
              { name: ui.indexH1, path: '/journeys' },
            ],
            lc,
          ),
        ]}
      />
      <header className="masthead">
        <div className="wrap">
          <h1>{ui.indexH1}</h1>
          <p className="standfirst">{ui.indexIntro}</p>
        </div>
      </header>

      <section className="section journeys-grid-sec">
        <div className="wrap wrap--wide">
          <ul className="journeys-grid">
            {JOURNEY_KEYS.map((k) => {
              const j = JOURNEYS[k];
              const hero = live[k].hero;
              const eur = prices[k];
              return (
                <li key={k}>
                  <Link href={j.path as never} className="jcard">
                    {hero && (
                      <span className="jcard-img">
                        <JourneyImage image={hero} alt={hero.alt} widthHint={760} ratio={3 / 2} sizes="(max-width:620px) 90vw, 360px" />
                      </span>
                    )}
                    <span className="jcard-body">
                      <span className="jcard-label">{j.label[L]}</span>
                      <span className="jcard-line">{home.styles.cards[j.path]?.line}</span>
                      {eur ? (
                        <span className="jcard-from">
                          {L === 'ja' ? (
                            <>
                              <Price eur={eur} />〜
                            </>
                          ) : (
                            ui.from('\u0000')
                              .split('\u0000')
                              .flatMap((part, i) => (i === 0 ? [part] : [<Price key="p" eur={eur} />, part]))
                          )}
                        </span>
                      ) : null}
                      <span className="jcard-cta">{ui.explore}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="section close" aria-labelledby="h-journeys-close">
        <div className="wrap">
          <h2 id="h-journeys-close">{home.close.h2}</h2>
          <p>
            {ui.closeBody}
            {settings?.responseTimeFull ? `${sep}${settings.responseTimeFull}` : ''}
          </p>
          {/* Page ends with the inline form: the footer action band hides (Footer.tsx). */}
          <span data-end-form hidden />
          <div className="journey-form">
            <LeadForm source="journeys_index" locale={locale} tone="light" headingId="h-journeys-close" />
          </div>
          <p className="close-alt">
            <TrackedWhatsApp href={nav.whatsappHref} aria={nav.whatsappAria} location="journeys_index">
              WhatsApp +20 155 177 2258 →
            </TrackedWhatsApp>
          </p>
        </div>
      </section>
    </article>
  );
}
