import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

import { JourneyImage } from './JourneyImage';
import { TourProse } from './TourProse';
import { CategoryIndex, type CategoryRow } from './CategoryIndex';
import { ConciergeOpenButton } from './ConciergeOpenButton';
import { FloatingConcierge } from '../FloatingConcierge';

const WHATSAPP = 'https://wa.me/201158011600';

interface RawTour {
  _id: string;
  title: string;
  slug: string;
  summary?: string;
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

/** Half/full/extended bucket — UI affordance, mirrors the route's logic. */
function bucketKey(tour: RawTour): string {
  if (typeof tour.durationHours === 'number') {
    if (tour.durationHours <= 5) return 'half';
    if (tour.durationHours >= 11) return 'extended';
    return 'full';
  }
  if (typeof tour.durationDays === 'number' && tour.durationDays >= 2) return 'extended';
  const text = `${tour.title ?? ''} ${tour.slug ?? ''}`.toLowerCase();
  if (/\b(two|three|2|3)[ -]?days?\b|overnight|by road/.test(text)) return 'extended';
  if (/half[ -]?day|sunrise|sunset|balloon|by night|morning only/.test(text)) return 'half';
  return 'full';
}

export async function CategoryView({
  archive,
  tours,
  locale,
}: {
  archive: CategoryArchiveDoc | null;
  tours: RawTour[];
  locale: Locale;
}) {
  const t = await getTranslations('dayTours');
  const tArchive = await getTranslations('archive');
  const tNav = await getTranslations('nav');
  const ts = await getTranslations('tourSystem');

  const bucketLabel = (key: string) =>
    key === 'half' ? t('lengthHalf') : key === 'extended' ? t('lengthExtended') : t('lengthFull');

  // ── Editor's picks: lead + 2 sides (editorsPicks, else featured + nothing) ──
  const pickTours: RawTour[] = (archive?.editorsPicks ?? []).filter(Boolean);
  if (pickTours.length === 0 && archive?.featured?.tour) pickTours.push(archive.featured.tour);
  const lead = pickTours[0];
  const sides = pickTours.slice(1, 3);

  const pickCard = (tour: RawTour, isLead: boolean) => {
    const durLabel = tour.durationLabel || bucketLabel(bucketKey(tour));
    const cityName = tour.cities?.[0]?.name;
    return (
      <Link key={tour._id} className={isLead ? 'tour tour--lead' : 'tour'} href={`/${tour.slug}`}>
        <JourneyImage
          image={tour.heroImage}
          alt={tour.title}
          className="tour-visual"
          sizes={isLead ? '(max-width:980px) 100vw, 470px' : '(max-width:980px) 100vw, 314px'}
          widthHint={isLead ? 940 : 630}
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

  // ── Navigator ──
  const navItems = (archive?.navigator?.items ?? [])
    .filter((it) => it.landing?.slug && it.landing?.cityId)
    .map((it) => {
      const count = tours.filter((tr) => tr.cities?.some((c) => c._id === it.landing!.cityId)).length;
      return {
        id: it.landing!.cityId!,
        cityName: it.landing!.cityName ?? '',
        note: it.note,
        countLabel: t('cityTourCount', { count }),
        href: `/${it.landing!.slug}`,
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

  const hasEditorial = Boolean(archive?.essay) || Boolean(archive?.editorByline?.heading);

  return (
    <div className="tour-doc lvl-category">
      <div className="t2e-wrap">
        <nav className="t2e-crumb" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/">{tNav('home')}</Link></li>
            <li>{tNav('services')}</li>
            <li>{archive?.title ?? t('landingTitle')}</li>
          </ol>
        </nav>

        <header className="masthead">
          <span className="t2e-kicker">{archive?.kicker ?? ts('mastKicker')}</span>
          <h1 className="mast-title">{archive?.title ?? t('landingTitle')}</h1>
          <p className="mast-tag">{archive?.tagline ?? t('landingDeck')}</p>
        </header>
      </div>

      {hasEditorial && (
        <section className="editorial">
          <div className="t2e-wrap intro-grid">
            <aside className="byline">
              <span className="t2e-kicker">{archive?.editorByline?.kicker ?? ts('whyKicker')}</span>
              {archive?.editorByline?.heading && <h3>{archive.editorByline.heading}</h3>}
              {archive?.editorByline?.intro && <p>{archive.editorByline.intro}</p>}
            </aside>
            <article className="article">
              <TourProse value={archive?.essay} locale={locale} />
            </article>
          </div>
        </section>
      )}

      {navItems.length > 0 && (
        <section className="navigator">
          <div className="t2e-wrap">
            <div className="t2e-section-head">
              <div>
                <span className="t2e-kicker">{ts('navKicker')}</span>
                <h2>{archive?.navigator?.heading ?? ts('navTitle')}</h2>
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
                <span className="t2e-kicker">{ts('picksKicker')}</span>
                <h2>{ts('picksTitle')} <em>{ts('picksTitleEm')}</em></h2>
              </div>
              <p>{ts('picksIntro')}</p>
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
              <h2>{ts('indexTitle')} <em>{ts('indexTitleEm')}</em></h2>
            </div>
            <p>{t('indexIntro')}</p>
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
            <span className="t2e-kicker">{ts('ctaKicker')}</span>
            <h2>{ts('ctaTitleL1')} <em>{ts('ctaTitleL1Em')}</em></h2>
            <p>{ts('ctaBodyL1')}</p>
            <div className="cta-buttons">
              <ConciergeOpenButton className="cta-btn cta-btn--primary">
                {ts('ctaPrimary')} →
              </ConciergeOpenButton>
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
            <h4>{t('footInSeasonLabel')}</h4>
            <div className="t2e-season">
              <p>{t('footInSeasonBody')}</p>
            </div>
          </div>
          <div>
            <h4>{ts('beforeYouChoose')}</h4>
            <ul>
              <li><Link href="/hotel-grade-concept">{ts('footHowPrivate')}<small>{ts('footHowPrivateSub')}</small></Link></li>
              <li><Link href="/group-day-tours">{ts('footPrivateOrGroup')}<small>{ts('footPrivateOrGroupSub')}</small></Link></li>
              <li><Link href="/distance-between-egyptian-cities">{ts('footCityDistances')}<small>{ts('footCityDistancesSub')}</small></Link></li>
            </ul>
          </div>
        </div>
      </section>

      <FloatingConcierge />
    </div>
  );
}
