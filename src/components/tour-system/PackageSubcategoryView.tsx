import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

import { JourneyImage } from './JourneyImage';
import { TourProse } from './TourProse';
import { packageBucketKey } from './lengthBucket';
import { CategoryIndex, type CategoryRow } from './CategoryIndex';
import { ConciergeOpenButton } from './ConciergeOpenButton';
import { isChatEnabled } from '@/lib/concierge/chatEnabled';
import { FloatingConcierge } from '../FloatingConcierge';

const WHATSAPP = 'https://wa.me/201158011600';

// Below this many journeys, the page takes the sparse path: lead with the
// single journey as the featured piece and OMIT the side-grid + the index
// entirely (no empty frames, no single-row index). At >= this, both switch on.
const GRID_THRESHOLD = 3;

interface RawPackage {
  _id: string;
  title: string;
  slug: string;
  summary?: string;
  durationDays?: number;
  durationHours?: number;
  durationLabel?: string;
  heroImage?: { asset?: unknown; alt?: string } | null;
}

interface MoodCard {
  eyebrow?: string;
  title?: string;
  body?: string;
  bullets?: string[];
  jumpLabel?: string;
  image?: { asset?: unknown; alt?: string } | null;
}

export interface PackageSubcategoryDoc {
  _id: string;
  title: string;
  slug: string;
  summary?: string;
  intro?: unknown;
  ctaContext?: string;
  heroImage?: { asset?: unknown; alt?: string } | null;
  category?: { key?: string; title?: string; slug?: string } | null;
  themeRef?: { _id: string; name?: string; slug?: string } | null;
  originRegion?: string;
  facts?: Array<{ label?: string; value?: string }> | null;
  heroNote?: string;
  editorByline?: { kicker?: string; heading?: string; intro?: string; mini?: string } | null;
  moodChooser?: { heading?: string; intro?: string; cards?: MoodCard[] } | null;
  orientation?: {
    baseLabel?: string;
    baseName?: string;
    stops?: Array<{ name?: string; sub?: string; time?: string; effort?: string }>;
    copyKicker?: string;
    copyHeading?: string;
    copyBody?: string;
    effort?: Array<{ label?: string; value?: string }>;
  } | null;
  tourPresentation?: Array<{ tourId?: string; label?: string; featured?: boolean; why?: string }> | null;
  journalRefs?: Array<{ _id: string; _type?: string; title?: string; slug?: string; summary?: string; kicker?: string }> | null;
  tours?: RawPackage[];
}

export async function PackageSubcategoryView({
  doc,
  locale,
  mode = 'private',
}: {
  doc: PackageSubcategoryDoc;
  locale: Locale;
  mode?: 'private' | 'group';
}) {
  const tNav = await getTranslations('nav');
  const ts = await getTranslations('tourSystem');

  // Concierge CTA rides the site's one lever (CHAT_ENABLED).
  const conciergeHref = isChatEnabled() ? '/plan-your-tour' : '/contact';
  const tArchive = await getTranslations('archive');

  const isGroup = mode === 'group';
  const hub = isGroup ? '/small-group-travel-packages' : '/egypt-travel-packages';
  // Axis label: region for group (short, from originRegion), theme for private.
  const axisName = isGroup
    ? // ICU `select` keys must be identifiers (no hyphens), so map the region
      // value (japan-east-asia → japan_east_asia) before the lookup.
      ts('pkgGroupRegionLabel', { region: (doc.originRegion ?? '').replace(/-/g, '_') })
    : doc.themeRef?.name ?? doc.title;
  const heroKicker = isGroup ? ts('pkgGroupSubHeroKicker') : ts('pkgSubHeroKicker');
  const breadcrumb = isGroup ? ts('pkgGroupSubBreadcrumb') : ts('pkgSubBreadcrumb');
  const trackLabel = isGroup ? ts('pkgGroupSubTrackLabel') : ts('pkgSubTrackLabel');
  const heroImage = doc.heroImage ?? null;

  const presById = new Map((doc.tourPresentation ?? []).filter((p) => p.tourId).map((p) => [p.tourId!, p]));
  const packages = doc.tours ?? [];
  const featured = packages.find((p) => presById.get(p._id)?.featured) ?? packages[0];
  const sides = packages.filter((p) => p._id !== featured?._id).slice(0, 4);

  // Sparse path: a thin catalogue (< 3) leads with the single featured piece
  // and drops the side-grid + the whole index — no empty frames.
  const isSparse = packages.length < GRID_THRESHOLD;

  const dayLabel = (p: RawPackage) =>
    p.durationLabel ||
    (typeof p.durationDays === 'number' ? ts('pkgCatDayCount', { count: p.durationDays }) : '');

  const tourCard = (p: RawPackage, isFeatured: boolean) => {
    const pres = presById.get(p._id);
    const meta = [dayLabel(p), trackLabel].filter(Boolean).join(' · ');
    return (
      <Link key={p._id} className={isFeatured ? 'tour-card featured' : 'tour-card'} href={`/${p.slug}`}>
        <JourneyImage
          image={p.heroImage}
          alt=""
          className="tour-img"
          sizes={isFeatured ? '(max-width:980px) 100vw, 649px' : '(max-width:980px) 100vw, 245px'}
          widthHint={isFeatured ? 1300 : 560}
          ratio={isFeatured ? (isSparse ? 16 / 9 : 4 / 5) : 1}
        />
        <div className="tour-content">
          {pres?.label && <span className="label">{pres.label}</span>}
          {meta && <div className="meta">{meta}</div>}
          <h3>{p.title}</h3>
          {p.summary && <p>{p.summary}</p>}
          {pres?.why && <p className="why">{pres.why}</p>}
        </div>
      </Link>
    );
  };

  const facts = (doc.facts ?? []).filter((f) => f.label || f.value);
  const mood = doc.moodChooser;
  const moodCards = (mood?.cards ?? []).filter((c) => c.title);
  const orient = doc.orientation;
  const orientStops = (orient?.stops ?? []).filter((s) => s.name);
  const journal = (doc.journalRefs ?? []).filter((j) => j.title);

  const indexRows: CategoryRow[] = packages
    .filter((p) => p.slug)
    .map((p) => ({
      id: p._id,
      name: p.title,
      durKey: packageBucketKey(p.durationDays),
      durLabel: dayLabel(p),
      cityName: '',
      citySlug: '',
      href: `/${p.slug}`,
    }));
  const lengthOptions = [
    { value: 'le5', label: ts('pkgCatLenLe5') },
    { value: '6to9', label: ts('pkgCatLen6to9') },
    { value: '10to14', label: ts('pkgCatLen10to14') },
    { value: '15plus', label: ts('pkgCatLen15plus') },
  ];

  const quizPrompts = [ts('quizQ1'), ts('quizQ2'), ts('quizQ3'), ts('quizQ4')];

  return (
    <div className="tour-doc lvl-subcategory">
      <header className="hero">
        <div className="bg">
          <JourneyImage image={heroImage} alt="" className="" sizes="100vw" widthHint={2560} priority />
        </div>
        <div className="t2e-wrap hero-grid">
          <div>
            <span className="t2e-kicker">{heroKicker} · {axisName}</span>
            <h1>{doc.title}</h1>
            {doc.summary && <p className="hero-dek">{doc.summary}</p>}
          </div>
          {(facts.length > 0 || doc.heroNote) && (
            <aside className="hero-card" aria-label="Quick facts">
              {facts.length > 0 && (
                <div className="facts">
                  {facts.map((f, i) => (
                    <div className="fact" key={i}>
                      <small>{f.label}</small>
                      <strong>{f.value}</strong>
                    </div>
                  ))}
                </div>
              )}
              {doc.heroNote && <p className="note">{doc.heroNote}</p>}
            </aside>
          )}
        </div>
      </header>

      <div className="t2e-wrap">
        <nav className="t2e-crumb" aria-label="Breadcrumb" style={{ paddingBottom: 25 }}>
          <ol>
            <li><Link href="/">{tNav('home')}</Link></li>
            <li><Link href={hub}>{breadcrumb}</Link></li>
            <li>{axisName}</li>
          </ol>
        </nav>
      </div>

      <main>
        {(doc.intro || doc.editorByline?.heading) && (
          <section className="editorial">
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

        {/* FLAGSHIP — chooser. Renders only when authored; omitted cleanly otherwise. */}
        {moodCards.length > 0 && (
          <section className="choose">
            <div className="t2e-wrap">
              <div className="t2e-section-head">
                <h2>{mood?.heading ?? ts('moodHeading', { city: axisName })}</h2>
                {mood?.intro && <p>{mood.intro}</p>}
              </div>
              <div className="choice-grid">
                {moodCards.map((c, i) => (
                  <a className="choice" href="#tours" key={i}>
                    <div>
                      <JourneyImage image={c.image} alt="" className="choice-visual" sizes="(max-width:980px) 100vw, 370px" widthHint={740} ratio={4 / 3} />
                      {c.eyebrow && <span className="t2e-eyebrow">{c.eyebrow}</span>}
                      <h3>{c.title}</h3>
                      {c.body && <p>{c.body}</p>}
                    </div>
                    <div>
                      {c.bullets && c.bullets.length > 0 && (
                        <ul>{c.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
                      )}
                      {c.jumpLabel && <div className="jump">{c.jumpLabel}</div>}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FLAGSHIP — orientation spine. Renders only when authored. */}
        {orientStops.length > 0 && (
          <section className="orient">
            <div className="t2e-wrap orient-grid">
              <div className="spine">
                {orient?.baseLabel && <div className="base">{orient.baseLabel}</div>}
                {orient?.baseName && <div className="base-name">{orient.baseName}</div>}
                {orientStops.map((s, i) => (
                  <div className="stop" key={i}>
                    <div>
                      <div className="s-name">{s.name}</div>
                      {s.sub && <div className="s-sub">{s.sub}</div>}
                    </div>
                    <div className="s-time">
                      {s.time}
                      {s.effort && <small>{s.effort}</small>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="orient-copy">
                {orient?.copyKicker && <span className="t2e-kicker">{orient.copyKicker}</span>}
                {orient?.copyHeading && <h2>{orient.copyHeading}</h2>}
                {orient?.copyBody && <p>{orient.copyBody}</p>}
                {orient?.effort && orient.effort.length > 0 && (
                  <ul className="effort">
                    {orient.effort.map((e, i) => (
                      <li key={i}>
                        <strong>{e.label}</strong>
                        <span>{e.value}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        )}

        {featured && (
          <section className="tours" id="tours">
            <div className="t2e-wrap">
              <div className="t2e-section-head">
                <h2>{ts('pkgSubToursTitle')} <em>{ts('pkgSubToursEm')}</em></h2>
                <p>{ts('pkgSubToursIntro')}</p>
              </div>
              {/* Sparse (< 3): the featured piece stands alone, full-width — no
                  empty side column. >= 3: featured + the 2×2 side-grid. */}
              <div className={isSparse ? 'tour-layout solo' : 'tour-layout'}>
                {tourCard(featured, true)}
                {!isSparse && (
                  <div className="side-tours">
                    {sides.map((p) => tourCard(p, false))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Complete index — only once the catalogue is deep enough to warrant
            it (>= 3). A single-row index would be an empty frame, so it's omitted. */}
        {!isSparse && (
          <section className="index">
            <div className="t2e-wrap">
              <div className="t2e-section-head">
                <div>
                  <span className="t2e-kicker">{tArchive('theIndex')}</span>
                  <h2>{ts('pkgSubIndexTitle')} <em>{axisName}.</em></h2>
                </div>
                <p>{ts('pkgSubIndexIntro', { theme: axisName })}</p>
              </div>
              <CategoryIndex
                variant="single"
                rows={indexRows}
                lengthOptions={lengthOptions}
                labels={{
                  lengthLabel: ts('pkgCatLenLabel'),
                  anyLength: ts('pkgCatLenAny'),
                  lengthHint: ts('pkgSubIndexHint'),
                  empty: tArchive('emptyState'),
                }}
              />
            </div>
          </section>
        )}

        {journal.length > 0 && (
          <section className="journal">
            <div className="t2e-wrap">
              <div className="t2e-section-head">
                <h2>{ts('journalTitle')} <em>{ts('journalTitleEm')}</em></h2>
                <p>{ts('journalIntro')}</p>
              </div>
              <div className="journal-grid">
                {journal.slice(0, 3).map((j) => {
                  const href = j._type === 'guideArticle' ? `/guide/${j.slug}` : `/blog/${j.slug}`;
                  return (
                    <Link key={j._id} href={href}>
                      {j.kicker && <small>{j.kicker}</small>}
                      <h3>{j.title}</h3>
                      {j.summary && <p>{j.summary}</p>}
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        <section className="concierge-cta">
          <div className="t2e-wrap cta-grid">
            <div className="cta-copy">
              <span className="t2e-kicker">{ts('pkgCatCtaKicker')}</span>
              <h2>{ts('pkgCatCtaTitle')} <em>{ts('pkgCatCtaTitleEm')}</em></h2>
              <p>{ts('pkgCatCtaBody')}</p>
              <div className="cta-actions">
                <Link className="btn btn-primary" href={conciergeHref}>{doc.ctaContext || ts('ctaAskConcierge')} →</Link>
                <a className="btn btn-ghost" href={WHATSAPP} target="_blank" rel="noopener noreferrer">{ts('ctaWhatsapp')} →</a>
              </div>
            </div>
            <div className="quiz">
              <h3>{ts('quizHeading')}</h3>
              {quizPrompts.map((q, i) => (
                <ConciergeOpenButton key={i}>{q}</ConciergeOpenButton>
              ))}
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
                <li><Link href={hub}>{ts('pkgSubPairsAll')}<small>{ts('pkgSubPairsAllSub')}</small></Link></li>
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
