import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

import { JourneyImage } from './JourneyImage';
import { TourProse } from './TourProse';
import { bucketKey } from './lengthBucket';
import { CategoryIndex, type CategoryRow } from './CategoryIndex';
import { MastheadStats } from './MastheadStats';
import { isChatEnabled } from '@/lib/concierge/chatEnabled';
import { FloatingConcierge } from '../FloatingConcierge';

const WHATSAPP = 'https://wa.me/201158011600';

interface RawTour {
  _id: string;
  title: string;
  slug: string;
  summary?: string;
  tourMode?: string;
  durationDays?: number;
  durationHours?: number;
  durationLabel?: string;
  heroImage?: { asset?: unknown; alt?: string } | null;
  cities?: Array<{ _id: string; name: string; slug: string }>;
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
  const isGroup = mode === 'group';

  // Concierge CTA rides the site's one lever (CHAT_ENABLED).
  const conciergeHref = isChatEnabled() ? '/plan-your-tour' : '/contact';

  const bucketLabel = (key: string) =>
    key === 'half' ? t('lengthHalf') : key === 'extended' ? t('lengthExtended') : t('lengthFull');

  // ── Editor's picks: always 1 lead + 2 sides, tours of THIS bucket's mode only.
  // Curated `editorsPicks` first, then the `featured` tour, then top up from the
  // (already mode-scoped) tours list so the 3-card grid never collapses even when
  // curation is short or empty. Off-mode tours are filtered out so a mis-curated
  // tour can never appear on the wrong page. ──
  const isMine = (tr?: RawTour | null): tr is RawTour => Boolean(tr) && tr!.tourMode === mode;
  const pickTours: RawTour[] = [];
  const seenPicks = new Set<string>();
  const curatedCount = (archive?.editorsPicks ?? []).filter(isMine).length;
  // Group has no curated picks and sparse hero coverage; surface the few tours
  // that DO carry a hero first so the marquee's prominent lead card isn't a
  // placeholder. Private keeps its archive-curated order untouched.
  const topUp = isGroup
    ? [...tours].sort((a, b) => Number(Boolean(b.heroImage?.asset)) - Number(Boolean(a.heroImage?.asset)))
    : tours;
  for (const tr of [
    ...(archive?.editorsPicks ?? []),
    archive?.featured?.tour ?? null,
    ...topUp,
  ]) {
    if (!isMine(tr) || seenPicks.has(tr._id)) continue;
    seenPicks.add(tr._id);
    pickTours.push(tr);
    if (pickTours.length === 3) break;
  }
  if (curatedCount < 3) {
    // eslint-disable-next-line no-console
    console.warn(
      `[${isGroup ? 'group-day-tours' : 'private-day-tours'}] editor's picks: only ${curatedCount} ${mode} tour(s) curated in dayToursArchive.editorsPicks; ` +
        `topped up to ${pickTours.length} from featured + recent ${mode} tours. Curate 3 in Studio for editorial control.`,
    );
  }
  const lead = pickTours[0];
  const sides = pickTours.slice(1, 3);

  const pickCard = (tour: RawTour, isLead: boolean) => {
    const durLabel = tour.durationLabel || bucketLabel(bucketKey(tour));
    const cityName = tour.cities?.[0]?.name;
    return (
      <Link key={tour._id} className={isLead ? 'tour tour--lead' : 'tour'} href={`/${tour.slug}`}>
        <JourneyImage
          image={tour.heroImage}
          alt=""
          className="tour-visual"
          sizes={isLead ? '(max-width:980px) 100vw, 470px' : '(max-width:980px) 100vw, 314px'}
          widthHint={isLead ? 940 : 630}
          ratio={isLead ? 3 / 4 : 4 / 5}
        />
        <div className="tour-badge">
          <span className="dur">{durLabel}</span>
          {cityName && <span>· {cityName}</span>}
        </div>
        <h4 className="tour-name">{tour.title}</h4>
        {tour.summary && <p className="tour-desc">{tour.summary}</p>}
      </Link>
    );
  };

  // ── Navigator. The group page passes `navLandings` (city landings); the
  // private page sources its curated navigator from the dayToursArchive
  // singleton. Both normalise to {slug, cityId, cityName, note} and derive the
  // per-city count from the (mode-scoped) tours list — one source of truth. ──
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
      const count = tours.filter((tr) => tr.cities?.some((c) => c._id === it.cityId)).length;
      return {
        id: it.cityId!,
        cityName: it.cityName ?? '',
        note: it.note,
        countLabel: t('cityTourCount', { count }),
        href: `/${it.slug}`,
      };
    });

  // ── Index rows + facet options ──
  const rows: CategoryRow[] = tours
    .filter((tr) => tr.slug)
    .map((tr) => {
      const key = bucketKey(tr);
      return {
        id: tr._id,
        name: tr.title,
        durKey: key,
        durLabel: tr.durationLabel || bucketLabel(key),
        cityName: tr.cities?.[0]?.name ?? '',
        citySlug: tr.cities?.[0]?.slug ?? '',
        href: `/${tr.slug}`,
      };
    });
  const cityMap = new Map<string, string>();
  for (const r of rows) if (r.citySlug) cityMap.set(r.citySlug, r.cityName);
  const cityOptions = Array.from(cityMap, ([value, label]) => ({ value, label })).sort((a, b) =>
    a.label.localeCompare(b.label)
  );
  const lengthOptions = [
    { value: 'half', label: t('lengthHalf') },
    { value: 'full', label: t('lengthFull') },
    { value: 'extended', label: t('lengthExtended') },
  ];

  // ── Copy. Private uses the dayToursArchive doc fields (with i18n fallbacks);
  // group has no archive singleton, so it reads a dedicated `grpDayCat*` set in
  // the tourSystem namespace. Centralised here so the JSX stays mode-agnostic.
  // Byline heading + note are REQUIRED content — the aside must never render with
  // only its kicker, so every value resolves to copy in every locale. ──
  const c = isGroup
    ? {
        crumb: ts('grpDayCatTitle'),
        mastKicker: ts('grpDayCatMastKicker'),
        mastTitle: ts('grpDayCatTitle'),
        mastTag: ts('grpDayCatDeck'),
        whyKicker: ts('grpDayCatWhyKicker'),
        whyHeading: ts('grpDayCatWhyHeading'),
        whyNote: ts('grpDayCatWhyNote'),
        navTitle: ts('grpDayCatNavTitle'),
        picksKicker: ts('grpDayCatPicksKicker'),
        picksTitle: ts('grpDayCatPicksTitle'),
        picksTitleEm: ts('grpDayCatPicksTitleEm'),
        picksIntro: ts('grpDayCatPicksIntro'),
        indexTitle: ts('grpDayCatIndexTitle'),
        indexTitleEm: ts('grpDayCatIndexTitleEm'),
        indexIntro: ts('grpDayCatIndexIntro'),
        ctaKicker: ts('grpDayCatCtaKicker'),
        ctaTitle: ts('grpDayCatCtaTitle'),
        ctaTitleEm: ts('grpDayCatCtaTitleEm'),
        ctaBody: ts('grpDayCatCtaBody'),
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
        whyKicker: archive?.editorByline?.kicker ?? ts('whyKicker'),
        whyHeading: archive?.editorByline?.heading ?? ts('whyHeading'),
        whyNote: archive?.editorByline?.intro ?? ts('whyNote'),
        navTitle: archive?.navigator?.heading ?? ts('navTitle'),
        picksKicker: ts('picksKicker'),
        picksTitle: ts('picksTitle'),
        picksTitleEm: ts('picksTitleEm'),
        picksIntro: ts('picksIntro'),
        indexTitle: ts('indexTitle'),
        indexTitleEm: ts('indexTitleEm'),
        indexIntro: t('indexIntro'),
        ctaKicker: ts('ctaKicker'),
        ctaTitle: ts('ctaTitleL1'),
        ctaTitleEm: ts('ctaTitleL1Em'),
        ctaBody: ts('ctaBodyL1'),
        footSeasonLabel: t('footInSeasonLabel'),
        footSeasonBody: t('footInSeasonBody'),
        statAxis: ts('dayCatStatCities'),
        statCount: ts('dayCatStatTours'),
      };
  const heroStats = [
    { label: c.statAxis, value: navItems.length },
    { label: c.statCount, value: tours.length },
    { label: ts('catStatSince'), value: 2003 },
  ];
  // The editorial section always renders: the byline always has content, and the
  // essay shows when present.
  const hasEditorial = true;

  return (
    <div className="tour-doc lvl-category">
      <div className="t2e-wrap">
        <nav className="t2e-crumb" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/">{tNav('home')}</Link></li>
            <li>{tNav('services')}</li>
            <li>{c.crumb}</li>
          </ol>
        </nav>

        <header className="masthead">
          <div className="mast-lead">
            <span className="t2e-kicker">{c.mastKicker}</span>
            <h1 className="mast-title">{c.mastTitle}</h1>
            <p className="mast-tag">{c.mastTag}</p>
          </div>
          <MastheadStats stats={heroStats} />
        </header>
      </div>

      {hasEditorial && (
        <section className="editorial">
          <div className="t2e-wrap intro-grid">
            <aside className="byline">
              <span className="t2e-kicker">{c.whyKicker}</span>
              <h3>{c.whyHeading}</h3>
              <p>{c.whyNote}</p>
            </aside>
            <article className="article">
              {archive?.essay ? (
                <TourProse value={archive.essay} locale={locale} />
              ) : isGroup ? (
                // Group has no archive essay; render the i18n editorial framing so
                // the article column is never a blank frame (rules §3). First
                // paragraph carries `.lead` for the reference drop-cap.
                ts('grpDayCatEssay')
                  .split('\n\n')
                  .map((para, i) => (
                    <p key={i} className={i === 0 ? 'lead' : undefined}>
                      {para}
                    </p>
                  ))
              ) : (
                <TourProse value={archive?.essay} locale={locale} />
              )}
            </article>
          </div>
        </section>
      )}

      {navItems.length > 0 && (
        <section className="navigator">
          <div className="t2e-wrap">
            <div className="t2e-section-head">
              <div>
                <span className="t2e-kicker">{isGroup ? ts('grpDayCatNavKicker') : ts('navKicker')}</span>
                <h2>{c.navTitle}</h2>
              </div>
              {archive?.navigator?.intro && <p>{archive.navigator.intro}</p>}
            </div>
            <div className="city-grid">
              {navItems.map((c) => (
                <Link key={c.id} className="city" href={c.href}>
                  <span>
                    <span className="c-name">{c.cityName}</span>
                    {c.note && <span className="c-note">{c.note}</span>}
                  </span>
                  <span className="c-count">{c.countLabel}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {lead && (
        <section className="picks">
          <div className="t2e-wrap">
            <div className="t2e-section-head">
              <div>
                <span className="t2e-kicker">{c.picksKicker}</span>
                <h2>{c.picksTitle} <em>{c.picksTitleEm}</em></h2>
              </div>
              <p>{c.picksIntro}</p>
            </div>
            <div className="grid-lead">
              {pickCard(lead, true)}
              {sides.map((s) => pickCard(s, false))}
            </div>
          </div>
        </section>
      )}

      <section className="index">
        <div className="t2e-wrap">
          <div className="t2e-section-head">
            <div>
              <span className="t2e-kicker">{tArchive('theIndex')}</span>
              <h2>{c.indexTitle} <em>{c.indexTitleEm}</em></h2>
            </div>
            <p>{c.indexIntro}</p>
          </div>
          <CategoryIndex
            rows={rows}
            cityOptions={cityOptions}
            lengthOptions={lengthOptions}
            labels={{
              cityLabel: t('filterCity'),
              lengthLabel: t('filterLength'),
              allCity: tArchive('all'),
              anyLength: t('anyLength'),
              lengthHint: t('lengthHint'),
              empty: tArchive('emptyState'),
            }}
          />
        </div>
      </section>

      <section className="concierge-cta">
        <div className="t2e-wrap">
          <div className="cta-inner">
            <span className="t2e-kicker">{c.ctaKicker}</span>
            <h2>{c.ctaTitle} <em>{c.ctaTitleEm}</em></h2>
            <p>{c.ctaBody}</p>
            <div className="cta-buttons">
              <Link className="cta-btn cta-btn--primary" href={conciergeHref}>
                {ts('ctaPrimary')} →
              </Link>
              <a className="cta-btn cta-btn--ghost" href={WHATSAPP} target="_blank" rel="noopener noreferrer">
                {ts('ctaWhatsapp')} →
              </a>
            </div>
          </div>
        </div>
      </section>

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
