import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

import { JourneyImage } from './JourneyImage';
import { TourProse } from './TourProse';
import { packageBucketKey } from './lengthBucket';
import { CategoryIndex, type CategoryRow } from './CategoryIndex';
import { MastheadStats } from './MastheadStats';
import { isChatEnabled } from '@/lib/concierge/chatEnabled';
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
  originRegion?: string;
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

/**
 * Navigator landing — generic over the grouping axis. Private packages group
 * by theme (axisId = theme id, matched against pkg.theme._id); group packages
 * group by origin region (axisId = originRegion, matched against pkg.originRegion).
 */
export interface PackageNavLanding {
  slug?: string;
  axisId?: string;
  name?: string;
  note?: string;
}

export async function PackageCategoryView({
  archive,
  packages,
  navLandings,
  mode = 'private',
  locale,
}: {
  archive: PackageCategoryDoc | null;
  packages: RawPackage[];
  navLandings: PackageNavLanding[];
  mode?: 'private' | 'group';
  locale: Locale;
}) {
  const tArchive = await getTranslations('archive');
  const tNav = await getTranslations('nav');
  const ts = await getTranslations('tourSystem');

  // Concierge CTA rides the site's one lever (CHAT_ENABLED).
  const conciergeHref = isChatEnabled() ? '/plan-your-tour' : '/contact';

  // Copy switches by bucket; length-bucket + count labels are shared.
  const P = mode === 'group' ? 'pkgGroupCat' : 'pkgCat';
  const k = (suffix: string) => ts(`${P}${suffix}`);
  const isGroup = mode === 'group';

  const dayLabel = (pkg: RawPackage) =>
    pkg.durationLabel ||
    (typeof pkg.durationDays === 'number' ? ts('pkgCatDayCount', { count: pkg.durationDays }) : '');

  // Axis label for a package (region name for group, theme name for private).
  const axisName = new Map(navLandings.filter((l) => l.axisId).map((l) => [l.axisId!, l.name ?? '']));
  const pkgAxisLabel = (p: RawPackage) =>
    isGroup ? axisName.get(p.originRegion ?? '') ?? '' : p.theme?.name ?? '';
  const countFor = (axisId?: string) =>
    !axisId
      ? 0
      : packages.filter((p) => (isGroup ? p.originRegion === axisId : p.theme?._id === axisId)).length;

  // ── Editor's picks: always 1 lead + 2 sides (or fewer if the bucket is tiny).
  // Curated first, then top up from the (already mode-scoped) package list. No
  // price is ever shown on a pick. ──
  const pickList: RawPackage[] = [];
  const seen = new Set<string>();
  const curatedCount = (archive?.editorsPicks ?? []).filter(Boolean).length;
  for (const p of [...(archive?.editorsPicks ?? []), ...packages]) {
    if (!p || seen.has(p._id)) continue;
    seen.add(p._id);
    pickList.push(p);
    if (pickList.length === 3) break;
  }
  if (curatedCount < Math.min(3, packages.length)) {
    // eslint-disable-next-line no-console
    console.warn(
      `[${isGroup ? 'small-group-travel-packages' : 'egypt-travel-packages'}] editor's picks: ` +
        `${curatedCount} curated; topped up to ${pickList.length} from recent packages. Curate in Studio for control.`,
    );
  }
  const lead = pickList[0];
  const sides = pickList.slice(1, 3);

  const pickCard = (pkg: RawPackage, isLead: boolean) => {
    const axis = pkgAxisLabel(pkg);
    const dur = dayLabel(pkg);
    return (
      <Link key={pkg._id} className={isLead ? 'tour tour--lead' : 'tour'} href={`/${pkg.slug}`}>
        <JourneyImage
          image={pkg.heroImage}
          alt=""
          className="tour-visual"
          sizes={isLead ? '(max-width:980px) 100vw, 470px' : '(max-width:980px) 100vw, 314px'}
          widthHint={isLead ? 940 : 630}
          ratio={isLead ? 3 / 4 : 4 / 5}
        />
        <div className="tour-badge">
          {dur && <span className="dur">{dur}</span>}
          {axis && <span>· {axis}</span>}
        </div>
        <h4 className="tour-name">{pkg.title}</h4>
        {pkg.summary && <p className="tour-desc">{pkg.summary}</p>}
      </Link>
    );
  };

  // ── Navigator: the landings, each with its REAL published count derived from
  // the package list. Every landing renders; one with 0 packages renders
  // unlinked. ──
  const navItems = navLandings
    .filter((l) => l.slug && l.name)
    .map((l) => {
      const count = countFor(l.axisId);
      return {
        id: l.axisId ?? l.slug!,
        name: l.name!,
        note: l.note,
        countLabel: ts('pkgCatThemeCount', { count }),
        href: count > 0 ? `/${l.slug}` : undefined,
      };
    });

  // ── Index rows — name · duration · axis · arrow, length facet only. NO price. ──
  const rows: CategoryRow[] = packages
    .filter((p) => p.slug)
    .map((p) => ({
      id: p._id,
      name: p.title,
      durKey: packageBucketKey(p.durationDays),
      durLabel: dayLabel(p),
      cityName: pkgAxisLabel(p),
      citySlug: '',
      href: `/${p.slug}`,
    }));
  const lengthOptions = [
    { value: 'le5', label: ts('pkgCatLenLe5') },
    { value: '6to9', label: ts('pkgCatLen6to9') },
    { value: '10to14', label: ts('pkgCatLen10to14') },
    { value: '15plus', label: ts('pkgCatLen15plus') },
  ];

  // Hero stat anchor — distinct axis values (themes / regions) + journey count,
  // both derived from the mode-scoped list so they always match what's below,
  // plus the operating-since constant.
  const axisCount = isGroup
    ? new Set(packages.map((p) => p.originRegion).filter(Boolean)).size
    : new Set(packages.map((p) => p.theme?._id).filter(Boolean)).size;
  const heroStats = [
    { label: k('StatAxis'), value: axisCount },
    { label: k('StatCount'), value: packages.length },
    { label: ts('catStatSince'), value: 2003 },
  ];

  const bylineKicker = archive?.editorByline?.kicker ?? k('WhyKicker');
  const bylineHeading = archive?.editorByline?.heading ?? k('WhyHeading');
  const bylineNote = archive?.editorByline?.intro ?? k('WhyNote');

  return (
    <div className="tour-doc lvl-category">
      <div className="t2e-wrap">
        <nav className="t2e-crumb" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/">{tNav('home')}</Link></li>
            <li>{tNav('services')}</li>
            <li>{archive?.title ?? k('Title')}</li>
          </ol>
        </nav>

        <header className="masthead">
          <div className="mast-lead">
            <span className="t2e-kicker">{k('MastKicker')}</span>
            <h1 className="mast-title">{archive?.title ?? k('Title')}</h1>
            {archive?.tagline && <p className="mast-tag">{archive.tagline}</p>}
          </div>
          <MastheadStats stats={heroStats} />
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
                <span className="t2e-kicker">{k('NavKicker')}</span>
                <h2>{k('NavTitle')} <em>{k('NavTitleEm')}</em></h2>
              </div>
              <p>{k('NavIntro')}</p>
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
              {/* Fill a ragged final row (the 3-col grid leaves the empty cells
                  showing the grey rule background) with a concierge prompt that
                  spans exactly the gap. A perfectly-full grid renders nothing. */}
              {(() => {
                const fillerSpan = (3 - (navItems.length % 3)) % 3;
                return fillerSpan > 0 ? (
                  <Link
                    className="city city--cta"
                    style={{ gridColumn: `span ${fillerSpan}` }}
                    href={conciergeHref}
                  >
                    <span>
                      <span className="c-name">{ts('navConciergeTitle')}</span>
                      <span className="c-cta-action">{ts('ctaPrimary')} →</span>
                    </span>
                  </Link>
                ) : null;
              })()}
            </div>
          </div>
        </section>
      )}

      {lead && (
        <section className="picks">
          <div className="t2e-wrap">
            <div className="t2e-section-head">
              <div>
                <span className="t2e-kicker">{k('PicksKicker')}</span>
                <h2>{k('PicksTitle')} <em>{k('PicksTitleEm')}</em></h2>
              </div>
              <p>{k('PicksIntro')}</p>
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
              <h2>{k('IndexTitle')} <em>{k('IndexTitleEm')}</em></h2>
            </div>
            <p>{k('IndexIntro')}</p>
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
            <span className="t2e-kicker">{k('CtaKicker')}</span>
            <h2>{k('CtaTitle')} <em>{k('CtaTitleEm')}</em></h2>
            <p>{k('CtaBody')}</p>
            <div className="cta-buttons">
              <Link className="cta-btn cta-btn--primary" href={conciergeHref}>
                {ts('ctaPrimary')} <span className="cta-arrow" aria-hidden>→</span>
              </Link>
              <a className="cta-btn cta-btn--ghost" href={WHATSAPP} target="_blank" rel="noopener noreferrer">
                {ts('ctaWhatsapp')} <span className="cta-arrow" aria-hidden>→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="t2e-footband">
        <div className="t2e-wrap t2e-footband-grid">
          <div>
            <h4>{k('FootSeasonLabel')}</h4>
            <div className="t2e-season">
              <p>{k('FootSeasonBody')}</p>
            </div>
          </div>
          <div>
            <h4>{ts('beforeYouChoose')}</h4>
            <ul>
              <li><Link href={isGroup ? '/egypt-travel-packages' : '/faq'}>{k('FootPrivateGroup')}<small>{k('FootPrivateGroupSub')}</small></Link></li>
              <li><Link href="/guide">{k('FootDays')}<small>{k('FootDaysSub')}</small></Link></li>
              <li><Link href="/nile-cruises">{k('FootCruise')}<small>{k('FootCruiseSub')}</small></Link></li>
            </ul>
          </div>
        </div>
      </section>

      <FloatingConcierge />
    </div>
  );
}
