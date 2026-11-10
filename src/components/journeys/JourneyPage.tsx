import type { Locale } from '@/i18n/routing';
import { Link, getPathname } from '@/i18n/navigation';
import { Price } from '@/components/Price';
import { JourneyImage } from '@/components/tour-system/JourneyImage';
import { LeadButton } from '@/components/leads/LeadProvider';
import { LeadForm } from '@/components/leads/LeadForm';
import { TourCard } from '@/components/home-sales/TourCard';
import { TrackedWhatsApp } from '@/components/nav/TrackedWhatsApp';
import { NavLinkItem } from '@/components/nav/NavLinkItem';
import type { NavLeaf } from '@/components/nav/types';
import type { HomeLocale } from '@/components/home-sales/copy';
import { approved } from '@/lib/journeys/curation';
import type { JourneyLive } from '@/lib/journeys/data';
import { JOURNEYS, JOURNEY_UI, journeyLocale, type JourneyKey } from '@/lib/journeys/registry';

import { JourneyViewTracker } from './JourneyViewTracker';

/**
 * Shared layout for the six traveller-type "journeys" pages — Phase A
 * structure (2026-11-10):
 *   1 Hero (approved image) · eyebrow = journey label · literary H1 · dek
 *   2 Facts row (Length · Route · Pace · Best season · Suits · From) + Plan my trip + WhatsApp
 *   3 "Two or three ways we'd do it" — approved tour cards + "See all … →" hub link
 *   4 The essay (text unchanged), split under approved subheadings, + operator note
 *   5 Before you go — the guide/journal links + four planning links (no product link)
 *   6 End block — existing heading, new body + response time, inline form, WhatsApp, AI link (not JA)
 *   7 Related styles — "Also suits you if…"
 * Owner-proposed items (hero, tours, subheadings, short facts, ES/JA titles)
 * render only once approved in src/lib/journeys/curation.ts.
 */

/** An in-essay link to a homepage anchor, e.g. "Desert & quiet" → /#desert-and-quiet. */
export interface JourneyHashLink {
  text: string;
  hash: string;
}
/** An in-essay link to a real route, e.g. "Coming back" → /journeys/coming-back. */
export interface JourneyRouteLink {
  text: string;
  href: string;
}
/** An in-essay link to an external site, e.g. "Sillage" → https://sillage-egypte.com/. */
export interface JourneyExternalLink {
  text: string;
  url: string;
}
/** An essay paragraph is either plain text or a run of text + inline links. */
export type EssayParagraph =
  | string
  | Array<string | JourneyHashLink | JourneyRouteLink | JourneyExternalLink>;

export interface JourneyContent {
  meta: { title: string; description: string };
  masthead: {
    eyebrow: string;
    headlineLead: string;
    headlineAccent: string;
    standfirst: string;
  };
  essay: EssayParagraph[];
  operatorNote: { label: string; body: string };
  spine: { heading: string; rows: Array<{ label: string; value: string }> };
  weave: { heading: string; items: Array<{ label: string; href: string; sentence: string }> };
  journal: { heading: string; card: { title: string; deck: string; href: string } };
  close: { heading: string; body: string; ctaLabel: string; ctaHref: string };
  crossRef: { lead: string; linkText: string; hash: string };
}

/**
 * A journey page's copy across locales. EN is always present (it is the
 * canonical source and the fallback); routes select `content[locale] ?? content.en`.
 */
export type LocalizedJourney = { en: JourneyContent } & Partial<Record<Locale, JourneyContent>>;

const FACT_LABELS = {
  en: ['Length', 'Route', 'Pace', 'Best season', 'Suits'],
  es: ['Duración', 'Ruta', 'Ritmo', 'Mejor época', 'Ideal para'],
  ja: ['日数', 'ルート', 'ペース', 'ベストシーズン', 'おすすめの方'],
} as const;
const FROM_LABEL = { en: 'From', es: 'Desde', ja: '料金' } as const;

/** Weave links that are products (single-segment slugs) move to the tour cards. */
const NON_PRODUCT_ROOTS = new Set(['/nile-cruises', '/hotels']);
const isProductHref = (href: string) => /^\/[^/]+$/.test(href) && !NON_PRODUCT_ROOTS.has(href);

const capitalize = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export function JourneyPage({
  journey,
  content: c,
  locale,
  live,
  planningLinks,
  whatsappHref,
  whatsappAria,
  responseTimeFull,
  aiConcierge,
}: {
  journey: JourneyKey;
  content: JourneyContent;
  locale: Locale;
  /** Live data for every journey (this one + related styles). */
  live: Record<JourneyKey, JourneyLive>;
  /** Best time · How many days · What Egypt costs · Passport & visa (nav targets). */
  planningLinks: NavLeaf[];
  whatsappHref: string;
  whatsappAria: string;
  responseTimeFull: string;
  /** EN/ES with the chat on: "Still exploring? Ask our AI concierge →". */
  aiConcierge: boolean;
}) {
  const L = journeyLocale(locale);
  const ui = JOURNEY_UI[L];
  const def = JOURNEYS[journey];
  const me = live[journey];
  const ap = approved(journey, L);
  const sep = L === 'ja' ? '' : ' ';

  const hashHref = (hash: string) => `${getPathname({ href: '/', locale })}#${hash}`;

  const renderParagraph = (para: EssayParagraph, key: number) => {
    if (typeof para === 'string') return <p key={key}>{para}</p>;
    return (
      <p key={key}>
        {para.map((seg, i) => {
          if (typeof seg === 'string') return seg;
          if ('url' in seg)
            return (
              <a key={i} href={seg.url} target="_blank" rel="noopener noreferrer">
                {seg.text}
              </a>
            );
          if ('href' in seg)
            return (
              <Link key={i} href={seg.href}>
                {seg.text}
              </Link>
            );
          return (
            <a key={i} href={hashHref(seg.hash)}>
              {seg.text}
            </a>
          );
        })}
      </p>
    );
  };

  // § 2 — facts: approved short values, else the current "Shape of the trip"
  // text (rows 0–4; row 5 "How it begins" is retired — spec §3).
  const rows = c.spine.rows;
  const factValues = ap.facts
    ? [ap.facts.length, ap.facts.route, ap.facts.pace, ap.facts.season, ap.facts.suits]
    : rows.slice(0, 5).map((r) => capitalize(r.value));
  const subheadAt = new Map(ap.subheadings.map((s) => [s.beforeParagraph, s.text]));
  const guideLinks = c.weave.items.filter((i) => !isProductHref(i.href));
  const formPrefill = { kind: 'trip' as const, journey };

  return (
    <article className="journey-doc" lang={locale}>
      <JourneyViewTracker journey={journey} />

      {/* § 1 — Hero */}
      {me.hero && (
        <figure className="journey-hero">
          <JourneyImage image={me.hero} alt={me.hero.alt} widthHint={2400} priority direct />
        </figure>
      )}
      <header className="masthead">
        <div className="wrap">
          <span className="eyebrow">{def.label[L]}</span>
          <h1>
            {c.masthead.headlineLead} <em>{c.masthead.headlineAccent}</em>
          </h1>
          <p className="standfirst">{c.masthead.standfirst}</p>
        </div>
      </header>

      {/* § 2 — Facts row */}
      <section className="journey-facts" aria-label={c.spine.heading}>
        <div className="wrap wrap--wide">
          <dl className="facts-row">
            {factValues.map((v, i) => (
              <div key={i}>
                <dt>{FACT_LABELS[L][i]}</dt>
                <dd>{v}</dd>
              </div>
            ))}
            {me.fromEur ? (
              <div className="facts-from">
                <dt>{FROM_LABEL[L]}</dt>
                <dd>
                  {L === 'ja' ? (
                    <>
                      <Price eur={me.fromEur} />〜
                    </>
                  ) : (
                    <Price eur={me.fromEur} />
                  )}
                </dd>
              </div>
            ) : null}
          </dl>
          <div className="facts-actions">
            <LeadButton
              source="journey_facts"
              prefill={formPrefill}
              className="j-btn j-btn--primary"
              openEvent={{ name: 'form_open', params: { form_location: 'journey_facts', location: 'journey_facts', journey } }}
            >
              {ui.planMyTrip}
            </LeadButton>
            <TrackedWhatsApp href={whatsappHref} aria={whatsappAria} location="journey_facts" className="j-btn j-btn--ghost">
              {ui.whatsapp}
            </TrackedWhatsApp>
          </div>
        </div>
      </section>

      {/* § 3 — Approved tours */}
      {me.tours.length > 0 && (
        <section className="section journey-tours lvl-sales" aria-labelledby={`h-tours-${journey}`}>
          <div className="wrap wrap--wide">
            <h2 id={`h-tours-${journey}`}>{ui.toursH2}</h2>
            <ul className="pcards">
              {me.tours.map((t) => (
                <TourCard
                  key={t.slug}
                  slug={t.slug}
                  p={t}
                  locale={L as HomeLocale}
                  listName="journey_tours"
                  source="journey_facts"
                  route={t.route}
                  why={t.why}
                  journey={journey}
                />
              ))}
            </ul>
            {me.hubCount > 0 && (
              <p className="see-all">
                <Link href={me.hubHref as never}>{ui.seeAll(me.hubCount, def.styleNoun, def.label[L])}</Link>
              </p>
            )}
          </div>
        </section>
      )}

      {/* § 4 — The essay (unchanged text) + operator note */}
      <section className="essay">
        <div className="wrap">
          {c.essay.map((para, i) => (
            <div key={i} className="essay-part">
              {subheadAt.has(i) && <h2 className="essay-h">{subheadAt.get(i)}</h2>}
              {renderParagraph(para, i)}
            </div>
          ))}
          <aside className="operator-note">
            <div className="operator-note__label">{c.operatorNote.label}</div>
            <div className="operator-note__body">
              <p>{c.operatorNote.body}</p>
            </div>
          </aside>
        </div>
      </section>

      {/* § 5 — Before you go */}
      <section className="section">
        <div className="wrap">
          <h2>{ui.beforeYouGo}</h2>
          {guideLinks.map((item) => (
            <div className="weave-item" key={item.href}>
              <Link href={item.href}>{item.label}</Link>
              <p>{item.sentence}</p>
            </div>
          ))}
          <div className="weave-item">
            <Link href={c.journal.card.href}>{c.journal.card.title}</Link>
            <p>{c.journal.card.deck}</p>
          </div>
          <ul className="planning-links">
            {planningLinks.map((l, i) => (
              <li key={l.id}>
                <NavLinkItem item={l} menu="footer" group={`journey_${journey}_before`} position={i} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* § 6 — End block: existing heading, new body, inline form, WhatsApp */}
      <section className="section close" aria-labelledby={`h-close-${journey}`}>
        <div className="wrap">
          <h2 id={`h-close-${journey}`}>{c.close.heading}</h2>
          <p>
            {ui.closeBody}
            {responseTimeFull ? `${sep}${responseTimeFull}` : ''}
          </p>
          {/* Page ends with the inline form: the footer action band hides (Footer.tsx). */}
          <span data-end-form hidden />
          <div className="journey-form">
            <LeadForm source="journey_end" prefill={formPrefill} locale={locale} tone="light" headingId={`h-close-${journey}`} />
          </div>
          <p className="close-alt">
            <TrackedWhatsApp href={whatsappHref} aria={whatsappAria} location="journey_end">
              WhatsApp +20 155 177 2258 →
            </TrackedWhatsApp>
          </p>
          {aiConcierge && ui.aiConcierge && (
            <p className="close-alt">
              <a href={`${getPathname({ href: '/plan-your-tour', locale })}#concierge`}>{ui.aiConcierge}</a>
            </p>
          )}
        </div>
      </section>

      {/* § 7 — Related styles */}
      <nav className="section related-styles" aria-labelledby={`h-related-${journey}`}>
        <div className="wrap">
          <h2 id={`h-related-${journey}`}>{ui.related}</h2>
          <ul>
            {def.related.map((k) => (
              <li key={k}>
                <Link href={JOURNEYS[k].path as never}>
                  <span className="rs-label">{JOURNEYS[k].label[L]}</span>
                  {live[k].fromEur ? (
                    <span className="rs-from">
                      {L === 'ja' ? (
                        <>
                          <Price eur={live[k].fromEur} />〜
                        </>
                      ) : (
                        <>
                          {FROM_LABEL[L].toLowerCase()} <Price eur={live[k].fromEur} />
                        </>
                      )}
                    </span>
                  ) : null}
                  <span aria-hidden="true"> →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </article>
  );
}
