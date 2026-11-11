import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

import { TourProse } from './TourProse';
import { withoutRetiredSections } from './retiredEssaySections';
import { JsonLd } from '@/components/JsonLd';
import { Price } from '@/components/Price';
import { buildBreadcrumbList, buildItemListSchema } from '@/lib/structured-data';
import { getRates } from '@/lib/fx';
import { MastheadStats } from './MastheadStats';
import { FloatingConcierge } from '../FloatingConcierge';
import { DayHubList } from '@/components/day-hubs/DayHubList';
import { DayHubEnd } from '@/components/day-hubs/DayHubEnd';
import { buildDayHub, cityOptionsFor, dayCardRenderer, responseTimeFull } from '@/components/day-hubs/buildDayHub';
import {
  HOME_DAY_SLUGS,
  NILE_KEYS,
  cityKeyFor,
  isRedSea,
  minPrice,
  primaryCity,
  type RawHubTour,
} from '@/components/day-hubs/dayHubData';
import '@/styles/tour-system.css';
import '@/styles/home-sales.css';
import '@/styles/day-hubs.css';

interface RawTour {
  _id: string;
  enSlug?: string;
  title: string;
  slug: string;
  summary?: string;
  tourMode?: string;
  priceFrom?: number | null;
  durationDays?: number;
  durationHours?: number;
  durationLabel?: string;
  heroImage?: { asset?: unknown; alt?: string } | null;
  cities?: Array<{ _id: string; name: string; slug: string; enSlug?: string }>;
}

export interface CategoryArchiveDoc {
  kicker?: string;
  title?: string;
  tagline?: string;
  editorByline?: { kicker?: string; heading?: string; intro?: string } | null;
  essay?: unknown;
  featured?: { tour?: RawTour | null } | null;
  editorsPicks?: RawTour[] | null;
  navigator?: {
    heading?: string;
    intro?: string;
    items?: Array<{
      note?: string;
      landing?: { slug?: string; cityId?: string; cityName?: string } | null;
    }>;
  } | null;
}

/** A navigator destination, used by the group page (the private page sources
 * its navigator from the dayToursArchive singleton instead). */
export interface CategoryNavLanding {
  slug?: string;
  cityId?: string;
  cityName?: string;
  note?: string;
}

export async function CategoryView({
  archive,
  tours,
  navLandings,
  mode = 'private',
  locale,
}: {
  archive: CategoryArchiveDoc | null;
  tours: RawTour[];
  /** Group navigator destinations. Omitted on the private page (archive-sourced). */
  navLandings?: CategoryNavLanding[];
  mode?: 'private' | 'group';
  locale: Locale;
}) {
  const t = await getTranslations('dayTours');
  const tArchive = await getTranslations('archive');
  const tNav = await getTranslations('nav');
  const ts = await getTranslations('tourSystem');
  const th = await getTranslations('dayHub');
  const isGroup = mode === 'group';
  const hubPath = isGroup ? '/group-day-tours' : '/private-day-tours';
  const hub = hubPath.slice(1);

  // ── Day-tour hub rebuild (owner spec, 2026-11-09). Order: hero (+ "from"
  // line) → Where will you be? → Most booked → Every day (filters, sort, Red
  // Sea section last) → editorial → inline itinerary form → footband. Nile
  // Valley first; Red Sea products stay published and linked, in their own
  // section at the bottom. ──
  const [fx, rtFull] = await Promise.all([getRates(), responseTimeFull(locale)]);
  const hubTours = tours as RawHubTour[];
  const { items, cards, sorted, budgetEdges } = await buildDayHub(hubTours, { locale, hub, rates: fx.rates });
  const nileTours = hubTours.filter((tr) => !isRedSea(primaryCity(tr).key));
  const lowestNile = minPrice(nileTours);
  const [heroBefore, heroAfter] = (th.raw('heroFrom') as string).split('{price}');
  const [tileBefore, tileAfter] = (th.raw('tileFrom') as string).split('{price}');

  // ── Where will you be? The private page sources its navigator from the
  // dayToursArchive singleton; the group page passes city landings. Nile
  // Valley cities become tiles with a "from" price; Red Sea cities collapse
  // into one text line that jumps to the Red Sea section. ──
  const navSource: CategoryNavLanding[] = navLandings
    ? navLandings
    : (archive?.navigator?.items ?? []).map((it) => ({
        slug: it.landing?.slug,
        cityId: it.landing?.cityId,
        cityName: it.landing?.cityName,
        note: it.note,
      }));
  const navItems = navSource
    .filter((it) => it.slug && it.cityId)
    .map((it) => {
      const cityTours = hubTours.filter((tr) => tr.cities?.some((c) => c._id === it.cityId));
      const cityRef = hubTours.flatMap((tr) => tr.cities ?? []).find((c) => c._id === it.cityId);
      return {
        id: it.cityId!,
        cityName: it.cityName ?? '',
        note: it.note,
        redSea: isRedSea(cityKeyFor(cityRef?.enSlug ?? it.slug?.replace(/-(private|small-group)-day-tours$/, ''))),
        countLabel: t('cityTourCount', { count: cityTours.length }),
        fromEur: minPrice(cityTours),
        href: `/${it.slug}`,
      };
    });
  // Nile Valley order: Cairo & Giza, Luxor, Aswan, Alexandria, then others.
  const tileRank = (id: string) => {
    const ref = hubTours.flatMap((tr) => tr.cities ?? []).find((c) => c._id === id);
    const i = (NILE_KEYS as readonly string[]).indexOf(cityKeyFor(ref?.enSlug));
    return i === -1 ? NILE_KEYS.length : i;
  };
  const nileTiles = navItems.filter((n) => !n.redSea).sort((a, b) => tileRank(a.id) - tileRank(b.id));
  const hasRedSea = items.some((i) => i.redSea);

  // ── Most booked: the homepage day-tour products in this page's mode. ──
  const byEnSlug = new Map(hubTours.map((tr) => [tr.enSlug, tr]));
  const renderCard = await dayCardRenderer(locale);
  const mostBooked = HOME_DAY_SLUGS.map((s) => byEnSlug.get(s))
    .filter((tr): tr is RawHubTour => Boolean(tr) && tr!.tourMode === mode)
    .slice(0, 6);

  const cityOpts = await cityOptionsFor(hubTours, locale);

  // ── Copy. Private uses the dayToursArchive doc fields (with i18n fallbacks);
  // group reads the `grpDayCat*` set. ──
  const c = isGroup
    ? {
        crumb: ts('grpDayCatTitle'),
        mastKicker: ts('grpDayCatMastKicker'),
        mastTitle: ts('grpDayCatTitle'),
        mastTag: ts('grpDayCatDeck'),
        whyHeading: ts('grpDayCatWhyHeading'),
        whyNote: ts('grpDayCatWhyNote'),
        navTitle: ts('grpDayCatNavTitle'),
        indexTitle: ts('grpDayCatIndexTitle'),
        indexTitleEm: ts('grpDayCatIndexTitleEm'),
        indexIntro: ts('grpDayCatIndexIntro'),
        footSeasonLabel: ts('grpDayCatFootSeasonLabel'),
        footSeasonBody: ts('grpDayCatFootSeasonBody'),
        statAxis: ts('dayCatStatCities'),
        statCount: ts('grpDayCatStatTours'),
      }
    : {
        crumb: archive?.title ?? t('landingTitle'),
        mastKicker: archive?.kicker ?? ts('mastKicker'),
        mastTitle: archive?.title ?? t('landingTitle'),
        mastTag: archive?.tagline ?? t('landingDeck'),
        whyHeading: archive?.editorByline?.heading ?? ts('whyHeading'),
        whyNote: archive?.editorByline?.intro ?? ts('whyNote'),
        navTitle: archive?.navigator?.heading ?? ts('navTitle'),
        indexTitle: ts('indexTitle'),
        indexTitleEm: ts('indexTitleEm'),
        indexIntro: t('indexIntro'),
        footSeasonLabel: t('footInSeasonLabel'),
        footSeasonBody: t('footInSeasonBody'),
        statAxis: ts('dayCatStatCities'),
        statCount: ts('dayCatStatTours'),
      };
  const heroStats = [
    { label: c.statAxis, value: navItems.length },
    { label: c.statCount, value: tours.length },
    { label: ts('catStatSince'), value: 1993 },
  ];
  // ItemList: the main (Nile Valley) list only, in the Recommended order.
  const itemListTours = sorted.filter((tr) => !isRedSea(primaryCity(tr).key));

  return (
    <div className="tour-doc lvl-category lvl-dayhub">
      <JsonLd
        data={[
          buildBreadcrumbList(
            [
              { name: tNav('home'), path: '/' },
              { name: c.crumb, path: hubPath },
            ],
            locale,
          ),
          buildItemListSchema(itemListTours, locale),
        ]}
      />
      <div className="t2e-wrap">
        <nav className="t2e-crumb" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/">{tNav('home')}</Link></li>
            <li>{tNav('services')}</li>
            <li>{c.crumb}</li>
          </ol>
        </nav>

        <header className="masthead dh-mast">
          <div className="mast-lead">
            <span className="t2e-kicker">{c.mastKicker}</span>
            <h1 className="mast-title">{c.mastTitle}</h1>
            <p className="mast-tag">{c.mastTag}</p>
            {lowestNile && (
              <p className="dh-from">
                {heroBefore}
                <Price eur={lowestNile} />
                {heroAfter}
              </p>
            )}
          </div>
          <MastheadStats stats={heroStats} />
        </header>
      </div>

      {nileTiles.length > 0 && (
        <section className="navigator dh-nav">
          <div className="t2e-wrap">
            <div className="t2e-section-head">
              <div>
                <span className="t2e-kicker">{isGroup ? ts('grpDayCatNavKicker') : ts('navKicker')}</span>
                <h2>{c.navTitle}</h2>
              </div>
              {archive?.navigator?.intro && <p>{archive.navigator.intro}</p>}
            </div>
            <div className="city-grid">
              {nileTiles.map((n) => (
                <Link key={n.id} className="city" href={n.href}>
                  <span>
                    <span className="c-name">{n.cityName}</span>
                    {n.note && <span className="c-note">{n.note}</span>}
                  </span>
                  <span className="c-count">
                    {n.countLabel}
                    {n.fromEur ? (
                      <span className="c-from">
                        {tileBefore}
                        <Price eur={n.fromEur} />
                        {tileAfter}
                      </span>
                    ) : null}
                  </span>
                </Link>
              ))}
            </div>
            {hasRedSea && (
              <p className="dh-redsea-line">
                <a href="#red-sea">{th('redSeaLine')}</a>
              </p>
            )}
          </div>
        </section>
      )}

      {mostBooked.length > 0 && (
        <section className="dh-mb" aria-labelledby="h-dh-mb">
          <div className="t2e-wrap">
            <div className="t2e-section-head">
              <div>
                <span className="t2e-kicker">{th('mbKicker')}</span>
                <h2 id="h-dh-mb">{th('mbTitle')}</h2>
              </div>
            </div>
            <div className="lvl-home lvl-sales">
              <ul className="dcards">
                {mostBooked.map((tr) => renderCard(tr, { listName: 'day_hub_most_booked', hub }))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <section className="index dh-index" id="every-day">
        <div className="t2e-wrap">
          <div className="t2e-section-head">
            <div>
              <span className="t2e-kicker">{tArchive('theIndex')}</span>
              <h2>{c.indexTitle} <em>{c.indexTitleEm}</em></h2>
            </div>
            <p>{c.indexIntro}</p>
          </div>
          <DayHubList
            items={items}
            cards={cards}
            budgetEdges={budgetEdges}
            cityOptions={{ nile: cityOpts.nile, redSea: cityOpts.redSea }}
            cityAliases={cityOpts.aliases}
            lengthLabels={{ label: t('filterLength'), any: t('anyLength'), half: t('lengthHalf'), full: t('lengthFull'), extended: t('lengthExtended') }}
            lengthNote={t('lengthHint')}
            hub={hub}
          />
        </div>
      </section>

      <section className="editorial dh-how">
        <div className="t2e-wrap intro-grid">
          <aside className="byline">
            <span className="t2e-kicker">{th('howKicker')}</span>
            <h3>{c.whyHeading}</h3>
            <p>{c.whyNote}</p>
          </aside>
          <article className="article">
            {archive?.essay ? (
              <TourProse value={withoutRetiredSections(archive.essay)} locale={locale} />
            ) : isGroup ? (
              ts('grpDayCatEssay')
                .split('\n\n')
                .map((para, i) => (
                  <p key={i} className={i === 0 ? 'lead' : undefined}>
                    {para}
                  </p>
                ))
            ) : null}
          </article>
        </div>
      </section>

      <DayHubEnd locale={locale} hub={hub} responseTimeFull={rtFull} />

      <section className="t2e-footband">
        <div className="t2e-wrap t2e-footband-grid">
          <div>
            <h4>{c.footSeasonLabel}</h4>
            <div className="t2e-season">
              <p>{c.footSeasonBody}</p>
            </div>
          </div>
          <div>
            <h4>{ts('beforeYouChoose')}</h4>
            <ul>
              <li><Link href="/hotel-grade-concept">{ts('footHowPrivate')}<small>{ts('footHowPrivateSub')}</small></Link></li>
              <li><Link href={isGroup ? '/private-day-tours' : '/group-day-tours'}>{ts('footPrivateOrGroup')}<small>{ts('footPrivateOrGroupSub')}</small></Link></li>
              <li><Link href="/distance-between-egyptian-cities">{ts('footCityDistances')}<small>{ts('footCityDistancesSub')}</small></Link></li>
              <li><Link href={isGroup ? '/private-day-tours' : '/group-day-tours'}>{isGroup ? ts('grpDayCatFootSeePrivate') : ts('footSeeGroup')}</Link></li>
            </ul>
          </div>
        </div>
      </section>

      <FloatingConcierge />
    </div>
  );
}
