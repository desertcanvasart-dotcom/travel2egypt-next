import type { Locale } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';

import { firstTimeContent as c } from './firstTimeContent';

/**
 * /journeys/first-time-in-egypt — the first traveller-type page.
 *
 * Server component. All copy is the locked module `firstTimeContent`; the
 * layout composes existing design-system pieces (the global .operator-note
 * block, the tour fact-box grammar via .spine-*, ConciergeCTA-style close),
 * scoped under `.journey-doc` (see src/styles/journeys.css, imported by the
 * route). The masthead headline is the homepage signature construction
 * (plain line + italic line, navy).
 */
export function FirstTimeInEgypt({ locale }: { locale: Locale }) {
  // Locale-aware homepage hash for the cross-reference — native <a> so the
  // browser scrolls to the anchor (App Router Link is unreliable for hashes),
  // mirroring JourneysMenu.
  const homeHash =
    locale === 'en' ? `/#${c.crossRef.hash}` : `/${locale}#${c.crossRef.hash}`;

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
          {c.essay.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
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
          <a href={homeHash}>{c.crossRef.linkText} →</a>
        </div>
      </section>
    </article>
  );
}
