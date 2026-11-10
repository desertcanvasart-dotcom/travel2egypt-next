import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Price } from '@/components/Price';
import { JsonLd } from '@/components/JsonLd';
import { LeadButton } from '@/components/leads/LeadProvider';
import { LeadForm } from '@/components/leads/LeadForm';
import { buildBreadcrumbList, buildItemListSchema } from '@/lib/structured-data';
import { isChatEnabled } from '@/lib/concierge/chatEnabled';
import { WHATSAPP_LINK } from '@/lib/concierge/constants';
import { FloatingConcierge } from '@/components/FloatingConcierge';
import { TourProse } from '@/components/tour-system/TourProse';
import { withoutRetiredSections } from '@/components/tour-system/retiredEssaySections';
import { MastheadStats } from '@/components/tour-system/MastheadStats';
import { TourCard } from '@/components/home-sales/TourCard';
import type { SalesProduct } from '@/components/home-sales/query';
import type { HomeLocale } from '@/components/home-sales/copy';

import { PackagesIndex, type HubRow } from './PackagesIndex';

import '@/styles/tour-system.css';
import '@/styles/home-sales.css';
import '@/styles/packages-hub.css';

/**
 * Packages hub — /egypt-travel-packages (owner spec, 2026-11-09). Order:
 * hero → most-booked (the homepage's six cards) → themes with "from" prices →
 * the full index (prices, budget filter, sort) → how our journeys work (the
 * former intro essay, moved down) → inline itinerary form → footband.
 * The small-group hub keeps the older PackageCategoryView.
 */

export interface HubPackage {
  _id: string;
  enSlug: string;
  slug: string;
  title: string;
  durationDays?: number | null;
  durationLabel?: string | null;
  priceFrom?: number | null;
  theme?: { _id: string; name?: string } | null;
}

export interface HubThemeLanding {
  slug?: string;
  themeId?: string;
  themeName?: string;
  note?: string;
}

export interface HubArchive {
  title?: string;
  editorByline?: { kicker?: string; heading?: string; intro?: string } | null;
  essay?: unknown;
}

const minEur = (xs: Array<number | null | undefined>) => {
  const v = xs.filter((n): n is number => typeof n === 'number' && n > 0);
  return v.length ? Math.min(...v) : null;
};

export async function PackagesHubView({
  archive,
  packages,
  themes,
  featured,
  responseTimeFull,
  budgetRate,
  locale,
}: {
  archive: HubArchive | null;
  packages: HubPackage[];
  themes: HubThemeLanding[];
  /** The homepage "Egypt tours" products, in the homepage's order. */
  featured: Array<{ slug: string; p: SalesProduct }>;
  responseTimeFull?: string | null;
  /** EUR → the budget labels' currency (USD en, EUR es, JPY ja), today's rate. */
  budgetRate: number;
  locale: Locale;
}) {
  const t = await getTranslations('packagesHub');
  const ts = await getTranslations('tourSystem');
  const tNav = await getTranslations('nav');
  const tArchive = await getTranslations('archive');
  const isJa = locale === 'ja';
  const conciergeOn = !isJa && isChatEnabled();
  const title = archive?.title ?? ts('pkgCatTitle');

  const dayLabel = (p: HubPackage) =>
    p.durationLabel || (typeof p.durationDays === 'number' ? ts('pkgCatDayCount', { count: p.durationDays }) : '');

  // Hero counters — unique journeys (same-titled duplicates count once) and
  // the lowest "from" price among them.
  const uniqueCount = new Set(packages.map((p) => p.title.trim().toLowerCase())).size;
  const lowest = minEur(packages.map((p) => p.priceFrom));
  const stats = [
    { label: t('statJourneys'), value: uniqueCount },
    { label: t('statFrom'), value: lowest ? isJa ? <><Price eur={lowest} />〜</> : <Price eur={lowest} /> : 0 },
    { label: t('statSince'), value: t('statSinceValue') },
  ];

  // Themes: count + lowest price per theme, from the same package list.
  const themeItems = themes
    .filter((l) => l.slug && l.themeName)
    .map((l) => {
      const inTheme = packages.filter((p) => p.theme?._id === l.themeId);
      return {
        id: l.themeId ?? l.slug!,
        name: l.themeName!,
        note: l.note,
        count: inTheme.length,
        fromEur: minEur(inTheme.map((p) => p.priceFrom)),
        href: inTheme.length > 0 ? `/${l.slug}` : undefined,
      };
    });
  const [themeFromBefore, themeFromAfter] = t.raw('themeFrom').split('{price}') as [string, string];

  const rows: HubRow[] = packages
    .filter((p) => p.slug)
    .map((p) => ({
      id: p._id,
      slug: p.enSlug,
      name: p.title,
      href: `/${p.slug}`,
      days: typeof p.durationDays === 'number' ? p.durationDays : null,
      durLabel: dayLabel(p),
      theme: p.theme?.name ?? '',
      eur: p.priceFrom && p.priceFrom > 0 ? p.priceFrom : null,
      budgetValue: p.priceFrom && p.priceFrom > 0 ? p.priceFrom * budgetRate : null,
    }));

  const fillerSpan = (3 - ((themeItems.length + 1) % 3)) % 3;

  return (
    <div className="tour-doc lvl-category lvl-hub" lang={locale}>
      <JsonLd
        data={[
          buildBreadcrumbList(
            [
              { name: tNav('home'), path: '/' },
              { name: title, path: '/egypt-travel-packages' },
            ],
            locale,
          ),
          buildItemListSchema(
            packages.map((p) => ({ ...p, slug: p.slug })),
            locale,
          ),
        ]}
      />

      {/* 1. HERO */}
      <div className="t2e-wrap">
        <nav className="t2e-crumb" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/">{tNav('home')}</Link></li>
            <li>{t('crumbTours')}</li>
            <li>{title}</li>
          </ol>
        </nav>
        <header className="masthead hub-mast">
          <div className="mast-lead">
            <span className="t2e-kicker">{ts('pkgCatMastKicker')}</span>
            <h1 className="mast-title">{title}</h1>
            <p className="mast-tag">{t('dek')}</p>
            <div className="hub-cta">
              <LeadButton source="packages_hub" className="hub-btn">
                {t('primary')} <span aria-hidden>→</span>
              </LeadButton>
              <a className="hub-text-link" href="#every-journey">{t('secondary')}</a>
            </div>
          </div>
          <MastheadStats stats={stats} />
        </header>
      </div>

      {/* 2. MOST-BOOKED — the homepage's six cards, same list and order. */}
      {featured.length > 0 && (
        <section className="hub-sec hub-mb" aria-labelledby="h-most-booked">
          <div className="t2e-wrap">
            <div className="t2e-section-head">
              <div>
                <span className="t2e-kicker">{t('mbKicker')}</span>
                <h2 id="h-most-booked">{t('mbTitle')}</h2>
              </div>
              <p>{t('mbIntro')}</p>
            </div>
            <div className="lvl-home lvl-sales">
              <ul className="pcards">
                {featured.map(({ slug, p }) => (
                  <TourCard
                    key={slug}
                    slug={slug}
                    p={p}
                    locale={locale as HomeLocale}
                    listName="packages_most_booked"
                    source="packages_hub"
                  />
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* 3. THEMES */}
      {themeItems.length > 0 && (
        <section className="navigator">
          <div className="t2e-wrap">
            <div className="t2e-section-head">
              <div>
                <span className="t2e-kicker">{ts('pkgCatNavKicker')}</span>
                <h2>{ts('pkgCatNavTitle')} <em>{ts('pkgCatNavTitleEm')}</em></h2>
              </div>
              <p>{ts('pkgCatNavIntro')}</p>
            </div>
            <div className="city-grid">
              {themeItems.map((c) => {
                const inner = (
                  <>
                    <span>
                      <span className="c-name">{c.name}</span>
                      {c.note && <span className="c-note">{c.note}</span>}
                    </span>
                    <span className="c-count">
                      {ts('pkgCatThemeCount', { count: c.count })}
                      {c.fromEur ? (
                        <span className="c-from">
                          {themeFromBefore}
                          <Price eur={c.fromEur} />
                          {themeFromAfter}
                        </span>
                      ) : null}
                    </span>
                  </>
                );
                return c.href ? (
                  <Link key={c.id} className="city" href={c.href}>{inner}</Link>
                ) : (
                  <div key={c.id} className="city" aria-disabled="true">{inner}</div>
                );
              })}
              <div className="city city--cta" style={{ ['--cta-span' as string]: fillerSpan + 1 }}>
                <span>
                  <span className="c-name">{t('notSure')}</span>
                  <LeadButton source="packages_hub" className="hub-link c-cta-action">
                    {t('notSureAction')}
                  </LeadButton>
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. EVERY JOURNEY */}
      <section className="index" id="every-journey" style={{ scrollMarginTop: 80 }}>
        <div className="t2e-wrap">
          <div className="t2e-section-head">
            <div>
              <span className="t2e-kicker">{tArchive('theIndex')}</span>
              <h2>{ts('pkgCatIndexTitle')} <em>{ts('pkgCatIndexTitleEm')}</em></h2>
            </div>
            <p>{t('indexIntro')}</p>
          </div>
          <PackagesIndex
            rows={rows}
            budgetEdges={isJa ? [250000, 400000, 600000] : [1500, 2500, 4000]}
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

      {/* 5. HOW OUR JOURNEYS WORK — the former intro, unchanged, minus "How to use this page". */}
      <section className="editorial hub-how">
        <div className="t2e-wrap intro-grid">
          <aside className="byline">
            <span className="t2e-kicker">{t('howKicker')}</span>
            <h3>{archive?.editorByline?.heading ?? ts('pkgCatWhyHeading')}</h3>
            <p>{archive?.editorByline?.intro ?? ts('pkgCatWhyNote')}</p>
          </aside>
          <article className="article">
            <TourProse value={withoutRetiredSections(archive?.essay)} locale={locale} />
          </article>
        </div>
      </section>

      {/* 6. END BLOCK — the homepage's inline itinerary form. */}
      <section className="hub-close" id="itinerary" aria-labelledby="h-hub-close">
        <div className="lvl-home lvl-sales">
          <div className="plan sales-close">
            <div className="wrap close-grid">
              <div>
                <span className="kicker">{t('closeKicker')}</span>
                <h2 id="h-hub-close">{t('closeTitle')}</h2>
                <p className="sub">
                  {t('closeFree')}
                  {isJa ? '' : ' '}
                  {responseTimeFull}
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
                      {t('closeExploring')} <Link href="/plan-your-tour">{t('closeConcierge')}</Link>
                    </li>
                  )}
                </ul>
              </div>
              <span data-end-form hidden />
              <LeadForm source="packages_hub" tone="dark" headingId="h-hub-close" locale={locale} />
            </div>
          </div>
        </div>
      </section>

      {/* 7. FOOTBAND — unchanged. */}
      <section className="t2e-footband">
        <div className="t2e-wrap t2e-footband-grid">
          <div>
            <h4>{ts('pkgCatFootSeasonLabel')}</h4>
            <div className="t2e-season">
              <p>{ts('pkgCatFootSeasonBody')}</p>
            </div>
          </div>
          <div>
            <h4>{ts('beforeYouChoose')}</h4>
            <ul>
              <li><Link href="/faq">{ts('pkgCatFootPrivateGroup')}<small>{ts('pkgCatFootPrivateGroupSub')}</small></Link></li>
              <li><Link href="/guide">{ts('pkgCatFootDays')}<small>{ts('pkgCatFootDaysSub')}</small></Link></li>
              <li><Link href="/nile-cruises">{ts('pkgCatFootCruise')}<small>{ts('pkgCatFootCruiseSub')}</small></Link></li>
            </ul>
          </div>
        </div>
      </section>

      <FloatingConcierge />
    </div>
  );
}
