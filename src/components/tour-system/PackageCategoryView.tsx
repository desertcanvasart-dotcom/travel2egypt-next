import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

import { JourneyImage } from './JourneyImage';
import { TourProse } from './TourProse';
import { packageBucketKey } from './lengthBucket';
import { CategoryIndex, type CategoryRow } from './CategoryIndex';
import { ConciergeOpenButton } from './ConciergeOpenButton';
import { FloatingConcierge } from '../FloatingConcierge';

const WHATSAPP = 'https://wa.me/201158011600';

interface RawPackage {
  _id: string;
  title: string;
  slug: string;
  summary?: string;
  tourMode?: string;
  durationDays?: number;
  durationLabel?: string;
  heroImage?: { asset?: unknown; alt?: string } | null;
  theme?: { _id: string; name?: string; slug?: string } | null;
}

export interface PackageCategoryDoc {
  title?: string;
  tagline?: string;
  editorByline?: { kicker?: string; heading?: string; intro?: string } | null;
  essay?: unknown;
  editorsPicks?: RawPackage[] | null;
}

export interface PackageThemeLanding {
  slug?: string;
  themeId?: string;
  themeName?: string;
  note?: string;
}

export async function PackageCategoryView({
  archive,
  packages,
  themeLandings,
  locale,
}: {
  archive: PackageCategoryDoc | null;
  packages: RawPackage[];
  themeLandings: PackageThemeLanding[];
  locale: Locale;
}) {
  const tArchive = await getTranslations('archive');
  const tNav = await getTranslations('nav');
  const ts = await getTranslations('tourSystem');

  const dayLabel = (pkg: RawPackage) =>
    pkg.durationLabel ||
    (typeof pkg.durationDays === 'number' ? ts('pkgCatDayCount', { count: pkg.durationDays }) : '');

  // ── Editor's picks: always 1 lead + 2 sides. Curated `editorsPicks` first,
  // then top up from the (already private-scoped) package list so the 3-card
  // grid never collapses. No price is ever shown on a pick. ──
  const pickList: RawPackage[] = [];
  const seen = new Set<string>();
  const curatedCount = (archive?.editorsPicks ?? []).filter(Boolean).length;
  for (const p of [...(archive?.editorsPicks ?? []), ...packages]) {
    if (!p || seen.has(p._id)) continue;
    seen.add(p._id);
    pickList.push(p);
    if (pickList.length === 3) break;
  }
  if (curatedCount < 3) {
    // eslint-disable-next-line no-console
    console.warn(
      `[egypt-travel-packages] editor's picks: only ${curatedCount} package(s) curated in ` +
        `tourCategory.private-package.editorsPicks; topped up to ${pickList.length} from recent ` +
        `private packages. Curate 3 in Studio for editorial control.`,
    );
  }
  const lead = pickList[0];
  const sides = pickList.slice(1, 3);

  const pickCard = (pkg: RawPackage, isLead: boolean) => {
    const themeName = pkg.theme?.name;
    const dur = dayLabel(pkg);
    return (
      <Link key={pkg._id} className={isLead ? 'tour tour--lead' : 'tour'} href={`/${pkg.slug}`}>
        <JourneyImage
          image={pkg.heroImage}
          alt={pkg.title}
          className="tour-visual"
          sizes={isLead ? '(max-width:980px) 100vw, 470px' : '(max-width:980px) 100vw, 314px'}
          widthHint={isLead ? 940 : 630}
        />
        <div className="tour-badge">
          {dur && <span className="dur">{dur}</span>}
          {themeName && <span>· {themeName}</span>}
        </div>
        <h4 className="tour-name">{pkg.title}</h4>
        {pkg.summary && <p className="tour-desc">{pkg.summary}</p>}
      </Link>
    );
  };

  // ── Navigator: the theme landings, each with its REAL published-package
  // count derived from the package list. Every theme renders; a theme with 0
  // packages would render without a link (none today — all 10 have packages). ──
  const countFor = (themeId?: string) =>
    themeId ? packages.filter((p) => p.theme?._id === themeId).length : 0;
  const navItems = themeLandings
    .filter((l) => l.slug && l.themeName)
    .map((l) => {
      const count = countFor(l.themeId);
      return {
        id: l.themeId ?? l.slug!,
        name: l.themeName!,
        note: l.note,
        count,
        countLabel: ts('pkgCatThemeCount', { count }),
        href: count > 0 ? `/${l.slug}` : undefined,
      };
    });

  // ── Index rows — name · duration · theme · arrow, length facet only. NO price
  // (the 3-level rule: prices live on the single-package page, not the index). ──
  const rows: CategoryRow[] = packages
    .filter((p) => p.slug)
    .map((p) => ({
      id: p._id,
      name: p.title,
      durKey: packageBucketKey(p.durationDays),
      durLabel: dayLabel(p),
      cityName: p.theme?.name ?? '',
      citySlug: p.theme?.slug ?? '',
      href: `/${p.slug}`,
    }));
  const lengthOptions = [
    { value: 'le5', label: ts('pkgCatLenLe5') },
    { value: '6to9', label: ts('pkgCatLen6to9') },
    { value: '10to14', label: ts('pkgCatLen10to14') },
    { value: '15plus', label: ts('pkgCatLen15plus') },
  ];

  // Byline (sticky "why" aside) — heading + note are REQUIRED content; doc wins,
  // localized copy is the never-blank fallback.
  const bylineKicker = archive?.editorByline?.kicker ?? ts('pkgCatWhyKicker');
  const bylineHeading = archive?.editorByline?.heading ?? ts('pkgCatWhyHeading');
  const bylineNote = archive?.editorByline?.intro ?? ts('pkgCatWhyNote');

  return (
    <div className="tour-doc lvl-category">
      <div className="t2e-wrap">
        <nav className="t2e-crumb" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/">{tNav('home')}</Link></li>
            <li>{tNav('services')}</li>
            <li>{archive?.title ?? ts('pkgCatTitle')}</li>
          </ol>
        </nav>

        <header className="masthead">
          <span className="t2e-kicker">{ts('pkgCatMastKicker')}</span>
          <h1 className="mast-title">{archive?.title ?? ts('pkgCatTitle')}</h1>
          {archive?.tagline && <p className="mast-tag">{archive.tagline}</p>}
        </header>
      </div>

      <section className="editorial">
        <div className="t2e-wrap intro-grid">
          <aside className="byline">
            <span className="t2e-kicker">{bylineKicker}</span>
            <h3>{bylineHeading}</h3>
            <p>{bylineNote}</p>
          </aside>
          <article className="article">
            <TourProse value={archive?.essay} locale={locale} />
          </article>
        </div>
      </section>

      {navItems.length > 0 && (
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
              {navItems.map((c) =>
                c.href ? (
                  <Link key={c.id} className="city" href={c.href}>
                    <span>
                      <span className="c-name">{c.name}</span>
                      {c.note && <span className="c-note">{c.note}</span>}
                    </span>
                    <span className="c-count">{c.countLabel}</span>
                  </Link>
                ) : (
                  <div key={c.id} className="city" aria-disabled="true">
                    <span>
                      <span className="c-name">{c.name}</span>
                      {c.note && <span className="c-note">{c.note}</span>}
                    </span>
                    <span className="c-count">{c.countLabel}</span>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>
      )}

      {lead && (
        <section className="picks">
          <div className="t2e-wrap">
            <div className="t2e-section-head">
              <div>
                <span className="t2e-kicker">{ts('pkgCatPicksKicker')}</span>
                <h2>{ts('pkgCatPicksTitle')} <em>{ts('pkgCatPicksTitleEm')}</em></h2>
              </div>
              <p>{ts('pkgCatPicksIntro')}</p>
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
              <h2>{ts('pkgCatIndexTitle')} <em>{ts('pkgCatIndexTitleEm')}</em></h2>
            </div>
            <p>{ts('pkgCatIndexIntro')}</p>
          </div>
          <CategoryIndex
            rows={rows}
            lengthOptions={lengthOptions}
            variant="package"
            labels={{
              lengthLabel: ts('pkgCatLenLabel'),
              anyLength: ts('pkgCatLenAny'),
              lengthHint: ts('pkgCatLenHint'),
              empty: tArchive('emptyState'),
            }}
          />
        </div>
      </section>

      <section className="concierge-cta">
        <div className="t2e-wrap">
          <div className="cta-inner">
            <span className="t2e-kicker">{ts('pkgCatCtaKicker')}</span>
            <h2>{ts('pkgCatCtaTitle')} <em>{ts('pkgCatCtaTitleEm')}</em></h2>
            <p>{ts('pkgCatCtaBody')}</p>
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
