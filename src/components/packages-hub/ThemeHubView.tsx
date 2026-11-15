import { getTranslations } from 'next-intl/server';
import { groq } from 'next-sanity';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { Price } from '@/components/Price';
import { JsonLd } from '@/components/JsonLd';
import { LeadButton } from '@/components/leads/LeadProvider';
import { LeadForm, type LeadPrefill } from '@/components/leads/LeadForm';
import { buildBreadcrumbList, buildItemListSchema } from '@/lib/structured-data';
import { isChatEnabled } from '@/lib/concierge/chatEnabled';
import { WHATSAPP_LINK } from '@/lib/concierge/constants';
import { JOURNEY_KEYS, JOURNEYS, JOURNEY_UI, journeyLocale } from '@/lib/journeys/registry';
import { getRates } from '@/lib/fx';
import { multiDayOnly } from '@/lib/products/multiDay';
import { FloatingConcierge } from '@/components/FloatingConcierge';
import { JourneyImage } from '@/components/tour-system/JourneyImage';
import { MastheadStats } from '@/components/tour-system/MastheadStats';
import { TourProse } from '@/components/tour-system/TourProse';
import { LandingFaq } from '@/components/tour-system/LandingFaq';
import type { PackageSubcategoryDoc } from '@/components/tour-system/PackageSubcategoryView';
import { TourCard } from '@/components/home-sales/TourCard';
import { FEATURED_TOURS } from '@/components/home-sales/config';
import type { SalesProduct } from '@/components/home-sales/query';
import type { HomeLocale } from '@/components/home-sales/copy';

import { PackagesIndex, type HubRow } from './PackagesIndex';

import '@/styles/tour-system.css';
import '@/styles/home-sales.css';
import '@/styles/packages-hub.css';
import '@/styles/theme-hub.css';

/**
 * Package theme pages (owner spec, 2026-11-15): the ten private-package theme
 * landings, aligned with the packages hub (/egypt-travel-packages). They keep
 * a photo hero (a theme is a mood); everything else is the hub's building
 * blocks in the hub's order:
 *   planning-advice bar → breadcrumb → photo hero (+ counters band) →
 *   featured tours (hub card) → every {theme} journey (hub index) →
 *   theme editorial (unchanged text) → FAQ → the hub's closing form → footband.
 *
 * Other private-package landings (duration, country, Christmas) and the
 * group-package landings still render through PackageSubcategoryView.
 */

/** EN slugs of the ten theme landings this template renders. */
export const THEME_HUB_SLUGS = [
  'multiday-adventure-and-safari-tours',
  'authentic-dahabiya-nile-cruise',
  'egypt-in-depth',
  'egypt-and-the-red-sea',
  'egypt-on-the-go',
  'egypt-family-holidays',
  'hassle-free-egypt',
  'egypt-luxury-holidays',
  'nile-cruise-holidays',
  'special-interest-tours',
] as const;

export function isThemeHub(allSlugs?: Array<{ _key: string; current?: string | null }> | null): boolean {
  const en = allSlugs?.find((s) => s._key === 'en')?.current;
  return Boolean(en && (THEME_HUB_SLUGS as readonly string[]).includes(en));
}

/**
 * The dek stays in the hero only while it fits two lines at 1440px (measured
 * against the hero's dek column, 2026-11-15); a longer one is shown in full
 * just below the hero instead of being cut.
 */
const DEK_MAX_CHARS: Record<string, number> = { en: 195, es: 195, ja: 100 };

/** The budget labels' currency per language: $ (en), € (es), ¥ (ja) — as on the hub. */
const BUDGET_CCY: Record<string, string> = { en: 'USD', es: 'EUR', ja: 'JPY' };

const FEATURED_COUNT = 3;

interface ThemeTour {
  _id: string;
  type?: string;
  enSlug?: string;
  slug: string;
  title: string;
  summary?: string;
  durationDays?: number | null;
  durationHours?: number | null;
  durationLabel?: string | null;
  priceFrom?: number | null;
  guidePriced?: boolean | null;
  enTitle?: string | null;
  enSummary?: string | null;
  cities?: Array<{ name?: string | null } | null> | null;
  heroImage?: { asset?: unknown; alt?: string } | null;
}

const responseTimeQuery = groq`*[_type == "siteSettings"][0]{
  "full": coalesce(responseTimeFull[_key==$locale][0].value, responseTimeFull[_key=="en"][0].value, "")
}`;

const minEur = (xs: Array<number | null | undefined>) => {
  const v = xs.filter((n): n is number => typeof n === 'number' && n > 0);
  return v.length ? Math.min(...v) : null;
};

export async function ThemeHubView({
  doc,
  enSlug,
  locale,
}: {
  doc: PackageSubcategoryDoc;
  /** The landing's EN slug: the GA4 / lead `hub` value. */
  enSlug: string;
  locale: Locale;
}) {
  const t = await getTranslations('packagesHub');
  const th = await getTranslations('themeHub');
  const ts = await getTranslations('tourSystem');
  const tNav = await getTranslations('nav');
  const tArchive = await getTranslations('archive');
  const isJa = locale === 'ja';
  const conciergeOn = !isJa && isChatEnabled();

  const [settings, fx] = await Promise.all([
    client.fetch<{ full?: string } | null>(responseTimeQuery, { locale }),
    getRates(),
  ]);
  const ccy = BUDGET_CCY[locale] ?? 'USD';
  const budgetRate = ccy === 'EUR' ? 1 : fx.rates[ccy] ?? 1;

  const hubSlug = enSlug;
  const themeName = doc.themeRef?.name ?? doc.title;
  const tours = ((doc.tours ?? []) as ThemeTour[]).filter((p) => p.slug);
  const journey = JOURNEY_KEYS.map((k) => JOURNEYS[k]).find((j) => j.hubId === doc._id) ?? null;
  const interested = th('interestedIn', { theme: themeName });
  const themePrefill: LeadPrefill = { notes: interested, hub: hubSlug };
  const hubParams = { hub: hubSlug };

  // Counters — the hub's rules: unique titles count once; "from" skips
  // products under two real days (multiDay.ts).
  const uniqueCount = new Set(tours.map((p) => p.title.trim().toLowerCase())).size;
  const lowest = minEur(multiDayOnly(tours).map((p) => p.priceFrom));
  const stats = [
    { label: t('statJourneys'), value: uniqueCount },
    { label: t('statFrom'), value: lowest ? isJa ? <><Price eur={lowest} />〜</> : <Price eur={lowest} /> : 0 },
    { label: t('statSince'), value: t('statSinceValue') },
  ];

  // Featured: the editor's featured flags first; otherwise (and to fill up to
  // three) the hub's most-booked order limited to this theme, then the index
  // order. Never hand-picked here.
  const byEn = new Map(tours.map((p) => [p.enSlug ?? p.slug, p]));
  const byId = new Map(tours.map((p) => [p._id, p]));
  const flagged = (doc.tourPresentation ?? []).filter((x) => x.featured && x.tourId).map((x) => byId.get(x.tourId!));
  const mostBooked = FEATURED_TOURS.map((f) => byEn.get(f.slug));
  const featured: ThemeTour[] = [];
  for (const p of [...flagged, ...mostBooked, ...tours]) {
    if (p && !featured.some((f) => f._id === p._id)) featured.push(p);
  }
  featured.splice(FEATURED_COUNT);

  const toCard = (p: ThemeTour): { slug: string; p: SalesProduct; route: string | null } => {
    const cities = [...new Set((p.cities ?? []).map((c) => c?.name).filter((n): n is string => Boolean(n)))];
    return {
      slug: p.enSlug ?? p.slug,
      route: cities.length ? cities.join(' · ') : null,
      p: {
        slug: p.enSlug ?? p.slug,
        href: p.slug,
        title: p.title,
        type: p.type,
        priceFrom: p.priceFrom,
        guidePriced: p.guidePriced,
        durationDays: p.durationDays,
        durationHours: p.durationHours,
        // No product image: the theme hero stands in (never an empty box).
        heroImage: p.heroImage?.asset ? p.heroImage : doc.heroImage ? { ...doc.heroImage, alt: p.title } : null,
      },
    };
  };

  const dayLabel = (p: ThemeTour) =>
    p.durationLabel || (typeof p.durationDays === 'number' ? ts('pkgCatDayCount', { count: p.durationDays }) : '');
  const rows: HubRow[] = tours.map((p) => ({
    id: p._id,
    slug: p.enSlug ?? p.slug,
    name: p.title,
    href: `/${p.slug}`,
    days: typeof p.durationDays === 'number' ? p.durationDays : null,
    durLabel: dayLabel(p),
    theme: '',
    eur: p.priceFrom && p.priceFrom > 0 ? p.priceFrom : null,
    budgetValue: p.priceFrom && p.priceFrom > 0 ? p.priceFrom * budgetRate : null,
  }));

  const dek = doc.summary?.trim() ?? '';
  const dekInHero = dek.length > 0 && dek.length <= (DEK_MAX_CHARS[locale] ?? 170);
  const crumbPackages = th('breadcrumb.tourPackages');

  return (
    <div className="tour-doc lvl-subcategory lvl-hub lvl-theme" lang={locale}>
      <JsonLd
        data={[
          // Mirrors the visible crumb. "Egypt Tours" is plain text there (as
          // on the hub) and has no page, so it is not a list item here.
          buildBreadcrumbList(
            [
              { name: tNav('home'), path: '/' },
              { name: crumbPackages, path: '/egypt-travel-packages' },
              { name: themeName, path: `/${doc.slug}` },
            ],
            locale,
          ),
          buildItemListSchema(tours, locale),
        ]}
      />

      {/* 1. Planning advice (journeys Phase A) — unchanged. */}
      {journey && (
        <p className="hub-journey-banner">
          <span className="t2e-wrap">
            <Link href={journey.path as never}>{JOURNEY_UI[journeyLocale(locale)].planning(journey.planNoun[journeyLocale(locale)])}</Link>
          </span>
        </p>
      )}

      {/* 2. Breadcrumb, above the hero. */}
      <div className="t2e-wrap">
        <nav className="t2e-crumb theme-crumb" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/">{tNav('home')}</Link></li>
            <li>{t('crumbTours')}</li>
            <li><Link href="/egypt-travel-packages">{crumbPackages}</Link></li>
            <li>{themeName}</li>
          </ol>
        </nav>
      </div>

      {/* 3. Photo hero + counters band. */}
      <header className="theme-hero">
        <div className="bg">
          <JourneyImage image={doc.heroImage} alt="" className="" sizes="100vw" widthHint={2560} priority fetchPriority="high" />
        </div>
        <div className="t2e-wrap theme-hero-inner">
          <span className="t2e-kicker">{ts('pkgSubHeroKicker')} · {themeName}</span>
          <h1>{doc.title}</h1>
          {dekInHero && <p className="theme-dek">{dek}</p>}
          <div className="hub-cta">
            <LeadButton
              source="theme_hero"
              prefill={themePrefill}
              openEvent={{ name: 'form_open', params: { form_location: 'theme_hero', ...hubParams } }}
              className="hub-btn"
            >
              {t('primary')} <span aria-hidden>→</span>
            </LeadButton>
            <a className="hub-text-link" href="#tours">{th('seeTheTours')}</a>
          </div>
        </div>
      </header>
      <div className="theme-band">
        <div className="t2e-wrap">
          {!dekInHero && dek && <p className="theme-dek-below">{dek}</p>}
          <MastheadStats stats={stats} />
        </div>
      </div>

      <main>
        {/* 4. Featured tours — the hub's card in the hub's grid. */}
        {featured.length > 0 && (
          <section className="hub-sec hub-mb theme-featured" id="tours" aria-labelledby="h-theme-featured">
            <div className="t2e-wrap">
              <div className="t2e-section-head">
                <div>
                  <h2 id="h-theme-featured">{ts('pkgSubToursTitle')} <em>{ts('pkgSubToursEm')}</em></h2>
                </div>
                <p>{ts('pkgSubToursIntro')}</p>
              </div>
              <div className="lvl-home lvl-sales">
                <ul className="pcards">
                  {featured.map((p) => {
                    const c = toCard(p);
                    return (
                      <TourCard
                        key={p._id}
                        slug={c.slug}
                        p={c.p}
                        route={c.route}
                        locale={locale as HomeLocale}
                        listName="theme_featured"
                        source="theme_hub"
                        trackParams={hubParams}
                      />
                    );
                  })}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* 5. Every {theme} journey — the hub's index. */}
        <section className="index" id="every-journey" style={{ scrollMarginTop: 80 }}>
          <div className="t2e-wrap">
            <div className="t2e-section-head">
              <div>
                <span className="t2e-kicker">{tArchive('theIndex')}</span>
                <h2>{th('everyThemeJourney', { theme: themeName })}</h2>
              </div>
              <p>{t('indexIntro')}</p>
            </div>
            <PackagesIndex
              rows={rows}
              budgetEdges={isJa ? [250000, 400000, 600000] : [1500, 2500, 4000]}
              listName="theme_index"
              trackParams={hubParams}
              leadSource="theme_hub"
              leadPrefill={themePrefill}
              labels={{
                lengthLabel: ts('pkgCatLenLabel'),
                anyLength: ts('pkgCatLenAny'),
                lengths: {
                  '3-5': ts('pkgCatLenLe5'),
                  '6-9': ts('pkgCatLen6to9'),
                  '10-14': ts('pkgCatLen10to14'),
                  '15+': ts('pkgCatLen15plus'),
                },
                budgetLabel: t('budgetLabel'),
                budgetAny: t('budgetAny'),
                budgets: {
                  lt1500: t('budgetLt1500'),
                  '1500-2500': t('budget1500'),
                  '2500-4000': t('budget2500'),
                  '4000+': t('budget4000'),
                },
                sortLabel: t('sortLabel'),
                sorts: { length: t('sortLength'), price_asc: t('sortPriceAsc'), price_desc: t('sortPriceDesc') },
                rowFrom: t.raw('rowFrom') as string,
                priceOnRequest: t('priceOnRequest'),
                empty: t('empty'),
                emptyAction: t('emptyAction'),
              }}
            />
          </div>
        </section>

        {/* 6. Theme editorial — moved below the tours, text unchanged. */}
        {(doc.intro || doc.editorByline?.heading) && (
          <section className="editorial theme-editorial">
            <div className="t2e-wrap intro-grid">
              <aside className="byline">
                <span className="t2e-kicker">{doc.editorByline?.kicker ?? ts('editorView')}</span>
                {doc.editorByline?.heading && <h3>{doc.editorByline.heading}</h3>}
                {doc.editorByline?.intro && <p>{doc.editorByline.intro}</p>}
                {doc.editorByline?.mini && <p className="mini">{doc.editorByline.mini}</p>}
              </aside>
              <article className="article">
                <TourProse value={doc.intro} locale={locale} />
              </article>
            </div>
          </section>
        )}

        {/* 7. FAQ — unchanged. */}
        <LandingFaq items={doc.faq} locale={locale} />

        {/* 8. The hub's closing section. */}
        <section className="hub-close" id="itinerary" aria-labelledby="h-theme-close">
          <div className="lvl-home lvl-sales">
            <div className="plan sales-close">
              <div className="wrap close-grid">
                <div>
                  <span className="kicker">{t('closeKicker')}</span>
                  <h2 id="h-theme-close">{t('closeTitle')}</h2>
                  <p className="sub">
                    {t('closeFree')}
                    {isJa ? '' : ' '}
                    {settings?.full}
                  </p>
                  <ul className="close-alt">
                    <li>
                      {t('closeChat')}
                      {isJa ? '' : ' '}
                      <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                        WhatsApp +20 155 177 2258
                      </a>
                    </li>
                    {conciergeOn && (
                      <li>
                        {th('closeExploring')} <Link href="/plan-your-tour">{th('closeConcierge')}</Link>
                      </li>
                    )}
                  </ul>
                </div>
                <span data-end-form hidden />
                <LeadForm source="theme_end" prefill={themePrefill} tone="dark" headingId="h-theme-close" locale={locale} />
              </div>
            </div>
          </div>
        </section>

        <section className="t2e-footband">
          <div className="t2e-wrap t2e-footband-grid">
            <div>
              <h4>{ts('pkgCatFootSeasonLabel')}</h4>
              <div className="t2e-season">
                <p>{ts('pkgCatFootSeasonBody')}</p>
              </div>
            </div>
            <div>
              <h4>{ts('pkgSubPairsLabel')}</h4>
              <ul>
                <li><Link href="/egypt-travel-packages">{ts('pkgSubPairsAll')}<small>{ts('pkgSubPairsAllSub')}</small></Link></li>
                <li><Link href="/nile-cruises">{ts('pkgSubPairsCruise')}<small>{ts('pkgSubPairsCruiseSub')}</small></Link></li>
                <li><Link href="/guide">{ts('pkgSubPairsGuide')}<small>{ts('pkgSubPairsGuideSub')}</small></Link></li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <FloatingConcierge />
    </div>
  );
}
