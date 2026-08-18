import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { client } from '@/sanity/lib/client';
import { otherTrackLandingSlugQuery } from '@/sanity/lib/queries';
import type { Locale } from '@/i18n/routing';

import { JourneyImage } from './JourneyImage';
import { TourProse } from './TourProse';
import { bucketKey } from './lengthBucket';
import { CategoryIndex, type CategoryRow } from './CategoryIndex';
import { ConciergeOpenButton } from './ConciergeOpenButton';
import { isChatEnabled } from '@/lib/concierge/chatEnabled';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbList, buildItemListSchema } from '@/lib/structured-data';
import { LandingFaq, type LandingFaqItem } from './LandingFaq';
import { FloatingConcierge } from '../FloatingConcierge';
import '@/styles/tour-system.css';

import { WHATSAPP_LINK as WHATSAPP } from '@/lib/concierge/constants';

interface RawTour {
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

export interface SubcategoryDoc {
  faq?: LandingFaqItem[];
  _id: string;
  title: string;
  slug: string;
  summary?: string;
  intro?: unknown;
  ctaContext?: string;
  heroImage?: { asset?: unknown; alt?: string } | null;
  category?: { key?: string } | null;
  destinationCity?: {
    _id: string;
    name: string;
    slug: string;
    heroImage?: { asset?: unknown; alt?: string } | null;
  } | null;
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
  tours?: RawTour[];
}

const OTHER_TRACK: Record<string, string> = {
  'private-day-tour': 'group-day-tour',
  'group-day-tour': 'private-day-tour',
};

export async function SubcategoryView({ doc, locale }: { doc: SubcategoryDoc; locale: Locale }) {
  const t = await getTranslations('subcategory');
  const tNav = await getTranslations('nav');
  const ts = await getTranslations('tourSystem');

  // Concierge CTA rides the site's one lever (CHAT_ENABLED).
  const conciergeHref = isChatEnabled() ? '/plan-your-tour' : '/contact';
  const tDay = await getTranslations('dayTours');
  const tArchive = await getTranslations('archive');

  const trackKey = doc.category?.key ?? 'private-day-tour';
  const isGroup = trackKey === 'group-day-tour';
  const trackLabel = isGroup ? t('trackGroup') : t('trackPrivate');
  const heroKicker = isGroup ? t('heroKickerGroup') : t('heroKickerPrivate');
  const cityName = doc.destinationCity?.name ?? '';
  // s47 audit (2026-08-18): the city×track landings had no structured data.
  // Breadcrumb mirrors the visible crumb (hub level linked to the track hub).
  const hubPath = isGroup ? '/group-day-tours' : '/private-day-tours';
  const breadcrumbSchema = buildBreadcrumbList(
    [
      { name: tNav('home'), path: '/' },
      { name: trackLabel, path: hubPath },
      { name: doc.title, path: `/${doc.slug}` },
    ],
    locale,
  );
  const itemListSchema = buildItemListSchema(doc.tours ?? [], locale);
  const citySlug = doc.destinationCity?.slug ?? '';
  const heroImage = doc.heroImage ?? doc.destinationCity?.heroImage ?? null;

  // Other-track landing for the cross-link.
  const otherKey = OTHER_TRACK[trackKey];
  const other =
    otherKey && doc.destinationCity?._id
      ? await client.fetch<{ slug?: string } | null>(otherTrackLandingSlugQuery(locale), {
          otherKey,
          cityId: doc.destinationCity._id,
        })
      : null;

  // Tours: pick featured + sides, decorated with editorial label/why.
  const presById = new Map((doc.tourPresentation ?? []).filter((p) => p.tourId).map((p) => [p.tourId!, p]));
  const tours = doc.tours ?? [];
  const featuredTour = tours.find((tr) => presById.get(tr._id)?.featured) ?? tours[0];
  // 3 tours total: the featured lead + 2 stacked side cards. The full catalogue
  // lives in the "Every {city} day" index right below, so the cap loses nothing.
  const sideTours = tours.filter((tr) => tr._id !== featuredTour?._id).slice(0, 2);

  const tourCard = (tour: RawTour, featured: boolean) => {
    const pres = presById.get(tour._id);
    const meta = [tour.durationLabel, trackLabel].filter(Boolean).join(' · ');
    return (
      <Link key={tour._id} className={featured ? 'tour-card featured' : 'tour-card'} href={`/${tour.slug}`}>
        <JourneyImage
          image={tour.heroImage}
          alt=""
          className="tour-img"
          sizes={featured ? '(max-width:980px) 100vw, 649px' : '(max-width:980px) 100vw, 520px'}
          widthHint={featured ? 1300 : 1040}
          ratio={featured ? 4 / 5 : 16 / 9}
        />
        <div className="tour-content">
          {pres?.label && <span className="label">{pres.label}</span>}
          {meta && <div className="meta">{meta}</div>}
          <h3>{tour.title}</h3>
          {tour.summary && <p>{tour.summary}</p>}
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

  // ── "Every {city} day" index — the COMPLETE catalogue for this city/track.
  // doc.tours already holds every private-Sharm day tour (the curated grid above
  // is a subset of it), so the index lists all of them, curated included.
  const bucketLabel = (key: string) =>
    key === 'half' ? tDay('lengthHalf') : key === 'extended' ? tDay('lengthExtended') : tDay('lengthFull');
  const indexRows: CategoryRow[] = tours
    .filter((tr) => tr.slug)
    .map((tr) => {
      const key = bucketKey(tr);
      return {
        id: tr._id,
        name: tr.title,
        durKey: key,
        durLabel: tr.durationLabel || bucketLabel(key),
        cityName: '',
        citySlug: '',
        href: `/${tr.slug}`,
      };
    });
  const lengthOptions = [
    { value: 'half', label: tDay('lengthHalf') },
    { value: 'full', label: tDay('lengthFull') },
    { value: 'extended', label: tDay('lengthExtended') },
  ];

  const quizPrompts = [ts('quizQ1'), ts('quizQ2'), ts('quizQ3'), ts('quizQ4')];

  return (
    <div className="tour-doc lvl-subcategory">
      <JsonLd data={[breadcrumbSchema, itemListSchema]} />
      <header className="hero">
        <div className="bg">
          <JourneyImage
            image={heroImage}
            alt=""
            className=""
            sizes="100vw"
            widthHint={2560}
            priority
          />
        </div>
        <div className="t2e-wrap hero-grid">
          <div>
            <span className="t2e-kicker">{heroKicker} · {cityName}</span>
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
            <li>{t('breadcrumbDayTours')}</li>
            <li>{trackLabel}</li>
            <li>{cityName}</li>
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

        {moodCards.length > 0 && (
          <section className="choose">
            <div className="t2e-wrap">
              <div className="t2e-section-head">
                <h2>{mood?.heading ?? ts('moodHeading', { city: cityName })}</h2>
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

        <section className="tours" id="tours">
          <div className="t2e-wrap">
            <div className="t2e-section-head">
              <h2>{ts('toursTitle')} <em>{ts('toursTitleEm')}</em></h2>
              <p>{ts('toursIntro')}</p>
            </div>
            <div className="tour-layout">
              {featuredTour && tourCard(featuredTour, true)}
              <div className="side-tours">
                {sideTours.map((tr) => tourCard(tr, false))}
              </div>
            </div>
          </div>
        </section>

        <section className="index">
          <div className="t2e-wrap">
            <div className="t2e-section-head">
              <div>
                <span className="t2e-kicker">{ts('cityIndexKicker')}</span>
                <h2>{ts('cityIndexTitle', { city: cityName })} <em>{ts('cityIndexTitleEm')}</em></h2>
              </div>
              <p>{ts('cityIndexIntro', { city: cityName })}</p>
            </div>
            <CategoryIndex
              variant="single"
              rows={indexRows}
              lengthOptions={lengthOptions}
              labels={{
                lengthLabel: tDay('filterLength'),
                anyLength: tDay('anyLength'),
                lengthHint: tDay('lengthHint'),
                empty: tArchive('emptyState'),
              }}
            />
          </div>
        </section>

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
              <span className="t2e-kicker">{ts('ctaKickerL2')}</span>
              <h2>{ts('ctaTitleL2', { city: cityName })} <em>{ts('ctaTitleL2Em')}</em></h2>
              <p>{ts('ctaBodyL2')}</p>
              <div className="cta-actions">
                <Link className="btn btn-primary" href={conciergeHref}>{doc.ctaContext || ts('ctaAskConcierge')} <span className="cta-arrow" aria-hidden>→</span></Link>
                <a className="btn btn-ghost" href={WHATSAPP} target="_blank" rel="noopener noreferrer">{ts('ctaWhatsapp')} <span className="cta-arrow" aria-hidden>→</span></a>
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
              <h4>{t('footInSeasonLabel')}</h4>
              <div className="t2e-season">
                <p>{t('footInSeasonBody')}</p>
              </div>
            </div>
            <div>
              <h4>{t('aroundCity', { city: cityName })}</h4>
              <ul>
                <li><Link href={citySlug ? `/guide/${citySlug}` : '/guide'}>{t('crosslinkCityGuide', { city: cityName })}<small>{t('crosslinkGuideKicker')}</small></Link></li>
                <li><Link href="/hotels">{t('crosslinkHotels', { city: cityName })}<small>{t('crosslinkHotelsKicker')}</small></Link></li>
                {other?.slug && (
                  <li>
                    <Link href={`/${other.slug}`}>
                      {isGroup ? t('crosslinkOtherPrivate', { city: cityName }) : t('crosslinkOtherGroup', { city: cityName })}
                      <small>{t('crosslinkOtherKicker')}</small>
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </section>

        <LandingFaq items={doc.faq} locale={locale} />
      </main>

      <FloatingConcierge />
    </div>
  );
}
