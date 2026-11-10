import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { JsonLd } from '@/components/JsonLd';
import { buildStaticMetadata } from '@/lib/seo';
import { absoluteUrl, buildBreadcrumbList, buildPageArticleSchema } from '@/lib/structured-data';
import { client } from '@/sanity/lib/client';
import { siteSettingsQuery } from '@/sanity/lib/queries';
import { getNavData } from '@/lib/nav/navData';
import { getRates } from '@/lib/fx';
import { convertPrice, defaultCurrencyForLocale, formatConverted } from '@/lib/currency';
import { isChatEnabled } from '@/lib/concierge/chatEnabled';
import { approved } from '@/lib/journeys/curation';
import { getJourneysLive } from '@/lib/journeys/data';
import { JOURNEYS, journeyLocale, type JourneyKey } from '@/lib/journeys/registry';
import type { NavLeaf } from '@/components/nav/types';

import { JourneyPage, type LocalizedJourney } from './JourneyPage';

/**
 * One route implementation for the six journey pages (Phase A). Each
 * /journeys/<slug>/page.tsx is two lines: its key and its content module.
 */
interface Props {
  params: Promise<{ locale: string }>;
}

/** "From $1,780" in the locale's default currency, for the meta description. */
async function fromForMeta(eur: number, locale: string): Promise<string> {
  const { rates } = await getRates();
  const ccy = defaultCurrencyForLocale(locale);
  const amount = formatConverted(convertPrice(eur, ccy, rates), ccy, locale);
  return locale === 'ja' ? `${amount}〜。` : locale === 'es' ? `Desde ${amount}.` : `From ${amount}.`;
}

export function journeyMetadata(key: JourneyKey, content: LocalizedJourney) {
  return async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const lc = locale as Locale;
    const L = journeyLocale(lc);
    const c = content[lc] ?? content.en;
    const ap = approved(key, L);
    const live = (await getJourneysLive(lc))[key];
    // EN title per spec §6; ES/JA once approved (until then the current title).
    const title = L === 'en' ? `${JOURNEYS[key].titleEn} | Travel2Egypt` : (ap.title ?? c.meta.title);
    const description = live.fromEur ? `${c.meta.description} ${await fromForMeta(live.fromEur, L)}` : c.meta.description;
    return buildStaticMetadata({
      locale: lc,
      path: JOURNEYS[key].path,
      title,
      description,
      availableLocales: Object.keys(content) as Locale[],
      defaultOgImage: live.hero,
    });
  };
}

export function journeyPage(key: JourneyKey, content: LocalizedJourney) {
  return async function Page({ params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);
    const lc = locale as Locale;
    const L = journeyLocale(lc);
    const c = content[lc] ?? content.en;
    const def = JOURNEYS[key];

    const [live, nav, settings, tNav] = await Promise.all([
      getJourneysLive(lc),
      getNavData(lc),
      client.fetch<{ responseTimeFull?: string | null } | null>(siteSettingsQuery(lc)),
      getTranslations({ locale, namespace: 'nav' }),
    ]);

    // "Before you go" planning links reuse the navigation's targets.
    const navLeaves = new Map<string, NavLeaf>();
    for (const m of nav.menus) for (const g of m.groups) for (const i of g.items) navLeaves.set(i.id, i);
    const planningLinks = ['best_time', 'how_many_days', 'costs', 'visa']
      .map((id) => navLeaves.get(id))
      .filter((x): x is NavLeaf => Boolean(x));

    const me = live[key];
    const itemList =
      me.tours.length > 0
        ? {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: def.label[L],
            itemListElement: me.tours.map((t, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: absoluteUrl(`/${t.href}`, lc),
              name: t.title,
            })),
          }
        : null;

    return (
      <>
        <JsonLd
          data={[
            buildPageArticleSchema({ title: c.meta.title, description: c.meta.description, path: def.path }, lc),
            buildBreadcrumbList(
              [
                { name: tNav('home'), path: '/' },
                { name: def.label[L], path: def.path },
              ],
              lc,
            ),
            ...(itemList ? [itemList] : []),
          ]}
        />
        <JourneyPage
          journey={key}
          content={c}
          locale={lc}
          live={live}
          planningLinks={planningLinks}
          whatsappHref={nav.whatsappHref}
          whatsappAria={nav.whatsappAria}
          responseTimeFull={settings?.responseTimeFull ?? ''}
          aiConcierge={L !== 'ja' && isChatEnabled()}
        />
      </>
    );
  };
}
