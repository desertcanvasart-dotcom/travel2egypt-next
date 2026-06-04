import { getTranslations } from 'next-intl/server';
import { Fragment, type ReactNode } from 'react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

import { JourneyImage } from './JourneyImage';
import { FloatingConcierge } from '../FloatingConcierge';

export interface GuideCity {
  _id: string;
  guideRegion?: string;
  guideTier?: string;
  guideTierLabel?: string;
  guideOrder?: number;
  guideDek?: string;
  guideBestFor?: string;
  guideTime?: string;
  guideHonestNote?: string;
  name: string;
  nameEn?: string;
  slug: string;
  heroImage?: { asset?: unknown; alt?: string } | null;
}

interface GuideRegionDef {
  key?: string;
  name?: string;
  lede?: string;
}

export interface GuideArchiveSettings {
  guideLead?: string[];
  guideFirstTrip?: string;
  guideWays?: Array<{ title?: string; body?: string }>;
  guideRegions?: GuideRegionDef[];
  guideManifesto?: Array<{ bold?: string; text?: string }>;
  guideSignoff?: string[];
}

const TIER_CLASS: Record<string, string> = {
  essential: 't-ess',
  exceptional: 't-exc',
  worth: 't-worth',
  skip: 't-skip',
};
const TIER_DEFAULT: Record<string, string> = {
  essential: 'Essential',
  exceptional: 'Exceptional',
  worth: 'Worth it',
  skip: 'Skip unless',
};
const TIER_RANK: Record<string, number> = { essential: 0, exceptional: 1, worth: 2, skip: 3 };

const tierClass = (t?: string) => `tier ${TIER_CLASS[t ?? ''] ?? 't-none'}`;
const tierLabel = (c: GuideCity) => c.guideTierLabel || TIER_DEFAULT[c.guideTier ?? ''] || '';
const rank = (c: GuideCity) => TIER_RANK[c.guideTier ?? ''] ?? 4;

/** Render text with the named cities linked (the "first trip" pointer). Uses a
 * plain locale-aware anchor (not the client Link) so it renders in SSR. */
function linkCities(text: string, links: Map<string, string>, locale: Locale): ReactNode[] {
  if (!text) return [];
  const prefix = (slug: string) => (locale === 'en' ? `/guide/${slug}` : `/${locale}/guide/${slug}`);
  const names = [...links.keys()].sort((a, b) => b.length - a.length);
  if (names.length === 0) return [text];
  const re = new RegExp(`(${names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  return text.split(re).map((part, i) =>
    links.has(part) ? (
      <a key={i} href={prefix(links.get(part)!)}>
        {part}
      </a>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

export async function GuideArchiveView({
  settings,
  cities,
  locale,
}: {
  settings: GuideArchiveSettings | null;
  cities: GuideCity[];
  locale: Locale;
}) {
  const t = await getTranslations('guide');
  const tNav = await getTranslations('nav');

  const lead = settings?.guideLead ?? [];
  const regions = settings?.guideRegions ?? [];
  const manifesto = (settings?.guideManifesto ?? []).filter((m) => m.bold || m.text);
  const signoff = settings?.guideSignoff ?? [];

  // Group cities by region; sort each by tier rank then guideOrder.
  const byRegion = new Map<string, GuideCity[]>();
  for (const city of cities) {
    if (!city.guideRegion) continue;
    if (!byRegion.has(city.guideRegion)) byRegion.set(city.guideRegion, []);
    byRegion.get(city.guideRegion)!.push(city);
  }
  for (const list of byRegion.values()) {
    list.sort((a, b) => rank(a) - rank(b) || (a.guideOrder ?? 100) - (b.guideOrder ?? 100));
  }

  // First-trip pointer links — the essential cities (Cairo, Luxor, Aswan order).
  // Match on the EN name — guideFirstTrip is EN even on es/ja (the fallback).
  const firstTripLinks = new Map<string, string>();
  for (const city of cities) {
    if (city.guideTier === 'essential') firstTripLinks.set(city.nameEn ?? city.name, city.slug);
  }

  const facts = (city: GuideCity) => {
    if (!city.guideBestFor && !city.guideTime && !city.guideHonestNote) return null;
    return (
      <div className="facts">
        {city.guideBestFor && (
          <div className="f"><span className="f-k">{t('factBestFor')}</span>{city.guideBestFor}</div>
        )}
        {city.guideTime && (
          <div className="f"><span className="f-k">{t('factTime')}</span>{city.guideTime}</div>
        )}
        {city.guideHonestNote && (
          <div className="honest"><span className="f-k">{t('factHonest')}</span>{city.guideHonestNote}</div>
        )}
      </div>
    );
  };

  const card = (city: GuideCity, lead: boolean) => {
    const label = tierLabel(city);
    if (lead) {
      return (
        <Link className="region-lead" href={`/guide/${city.slug}`}>
          <JourneyImage image={city.heroImage} alt={city.name} className="" sizes="(max-width:980px) 100vw, 600px" widthHint={1100} ratio={3 / 2} />
          <div className="gl-body">
            {label && <span className={tierClass(city.guideTier)}>{label}</span>}
            <h3>{city.name}</h3>
            {city.guideDek && <p className="dek">{city.guideDek}</p>}
            {facts(city)}
          </div>
        </Link>
      );
    }
    return (
      <Link className="gcard" href={`/guide/${city.slug}`}>
        <JourneyImage image={city.heroImage} alt={city.name} className="" sizes="(max-width:620px) 100vw, (max-width:980px) 50vw, 360px" widthHint={720} ratio={4 / 3} />
        {label && <span className={tierClass(city.guideTier)}>{label}</span>}
        <h4>{city.name}</h4>
        {city.guideDek && <p className="dek">{city.guideDek}</p>}
        {facts(city)}
      </Link>
    );
  };

  return (
    <div className="tour-doc lvl-guide">
      <div className="t2e-wrap">
        <nav className="t2e-crumb" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/">{tNav('home')}</Link></li>
            <li>{tNav('guide')}</li>
          </ol>
        </nav>

        <header className="masthead">
          <h1>{t('landingTitle')}</h1>
          <p className="dek">{t('landingDeck')}</p>
          {lead.length > 0 && (
            <div className="lead">
              {lead.map((para, i) => (
                <p key={i} className={i === 0 ? 'open' : undefined}>{para}</p>
              ))}
            </div>
          )}
        </header>

        {(settings?.guideWays ?? []).length > 0 && (
          <section className="ways">
            <div className="ways-head">
              <span className="t2e-kicker">{t('waysKicker')}</span>
              <h2>{t('waysTitle')}</h2>
            </div>
            <div className="ways-grid">
              {settings!.guideWays!.map((way, i) => (
                <article className="way" key={i}>
                  <div className="num">{String(i + 1).padStart(2, '0')}</div>
                  {way.title && <h3>{way.title}</h3>}
                  {way.body && (
                    <p>{i === 0 ? linkCities(way.body, firstTripLinks, locale) : way.body}</p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

      {regions.map((region) => {
        const list = region.key ? byRegion.get(region.key) ?? [] : [];
        if (list.length === 0) return null;
        const [anchor, ...rest] = list;
        return (
          <section className="region" key={region.key}>
            <div className="t2e-wrap">
              <div className="region-head">
                <h2>{region.name}</h2>
                {region.lede && <p>{region.lede}</p>}
              </div>
              {card(anchor, true)}
              {rest.length > 0 && <div className="city-grid">{rest.map((c) => <Fragment key={c._id}>{card(c, false)}</Fragment>)}</div>}
            </div>
          </section>
        );
      })}

      {manifesto.length > 0 && (
        <section className="manifesto">
          <div className="t2e-wrap">
            <div className="inner">
              <span className="t2e-kicker">{t('manifestoKicker')}</span>
              <h2>{t('manifestoTitle')}</h2>
              <div className="mlist">
                {manifesto.map((m, i) => (
                  <div className="m" key={i}>
                    {m.bold && <b>{m.bold}</b>} {m.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {signoff.length > 0 && (
        <section className="signoff">
          <div className="t2e-wrap">
            <div className="inner">
              {signoff.map((para, i) => (
                <p key={i} className={i === signoff.length - 1 ? 'last' : undefined}>{para}</p>
              ))}
            </div>
          </div>
        </section>
      )}

      <FloatingConcierge />
    </div>
  );
}
