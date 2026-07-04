import type { Locale } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';

/**
 * Shared layout for the traveller-type "journeys" pages.
 *
 * Extracted from the first-time build (which keeps its own bespoke component,
 * untouched) so subsequent pages — coming-back and the rest — share one
 * layout. Markup and class names are identical to FirstTimeInEgypt, scoped
 * under `.journey-doc` (see src/styles/journeys.css, imported by each route).
 * All copy is data on the `content` object; nothing here is page-specific.
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
/**
 * An in-essay link to an external site, e.g. "Sillage" → https://sillage-egypte.com/.
 * Rendered as a native <a target="_blank" rel="noopener noreferrer">, matching the
 * sister-brand strip in Footer.tsx. Added for /journeys/travelling-in-style (the only
 * page with an outbound sister-brand mention); the five earlier pages carry no external
 * segments, so their rendering is unchanged.
 */
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

export function JourneyPage({
  content: c,
  locale,
}: {
  content: JourneyContent;
  locale: Locale;
}) {
  // Locale-aware homepage hash — native <a> so the browser scrolls to the
  // anchor (App Router Link is unreliable for hashes), mirroring JourneysMenu.
  const hashHref = (hash: string) => (locale === 'en' ? `/#${hash}` : `/${locale}#${hash}`);

  const renderParagraph = (para: EssayParagraph, key: number) => {
    if (typeof para === 'string') return <p key={key}>{para}</p>;
    return (
      <p key={key}>
        {para.map((seg, i) => {
          if (typeof seg === 'string') return seg;
          // External link (e.g. "Sillage") → native <a> opening in a new tab,
          // matching the sister-brand strip in Footer.tsx. Checked first so it
          // wins over the route/hash branches below.
          if ('url' in seg)
            return (
              <a key={i} href={seg.url} target="_blank" rel="noopener noreferrer">
                {seg.text}
              </a>
            );
          // Route link (e.g. "Coming back") → locale-aware next-intl Link;
          // hash link (e.g. "Desert & quiet" → #anchor) → native <a> so the
          // browser scrolls to the anchor.
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

  return (
    <article className="journey-doc" lang={locale}>
      {/* § 1 — Masthead */}
      <header className="masthead">
        <div className="wrap">
          <span className="eyebrow">{c.masthead.eyebrow}</span>
          <h1>
            {c.masthead.headlineLead} <em>{c.masthead.headlineAccent}</em>
          </h1>
          <p className="standfirst">{c.masthead.standfirst}</p>
        </div>
      </header>

      {/* § 2 — The essay + operator note */}
      <section className="essay">
        <div className="wrap">
          {c.essay.map((para, i) => renderParagraph(para, i))}
          <aside className="operator-note">
            <div className="operator-note__label">{c.operatorNote.label}</div>
            <div className="operator-note__body">
              <p>{c.operatorNote.body}</p>
            </div>
          </aside>
        </div>
      </section>

      {/* § 3 — The shape of the trip (fact spine) */}
      <section className="section">
        <div className="wrap">
          <h2>{c.spine.heading}</h2>
          <div className="spine-box">
            {c.spine.rows.map((row) => (
              <div className="spine-row" key={row.label}>
                <span className="spine-label">{row.label}</span>
                <span className="spine-value">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* § 4 — Where this usually leads (curated weave) */}
      <section className="section">
        <div className="wrap">
          <h2>{c.weave.heading}</h2>
          {c.weave.items.map((item) => (
            <div className="weave-item" key={item.href}>
              <Link href={item.href}>{item.label}</Link>
              <p>{item.sentence}</p>
            </div>
          ))}
        </div>
      </section>

      {/* § 5 — One journal thread (single featured piece) */}
      <section className="section">
        <div className="wrap">
          <h2>{c.journal.heading}</h2>
          <div className="journal-card">
            <Link href={c.journal.card.href}>{c.journal.card.title}</Link>
            <p>{c.journal.card.deck}</p>
          </div>
        </div>
      </section>

      {/* § 6 — The concierge close */}
      <section className="section close">
        <div className="wrap">
          <h2>{c.close.heading}</h2>
          <p>{c.close.body}</p>
          <Link href={c.close.ctaHref} className="cta">
            <span>{c.close.ctaLabel}</span>
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* § 7 — The quiet cross-reference */}
      <section className="cross-ref">
        <div className="wrap">
          {c.crossRef.lead}
          <a href={hashHref(c.crossRef.hash)}>{c.crossRef.linkText} →</a>
        </div>
      </section>
    </article>
  );
}
