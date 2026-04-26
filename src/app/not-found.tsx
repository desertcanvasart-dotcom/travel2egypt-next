/**
 * Root 404 — fires for paths that don't match any route group
 * (mostly random URLs that don't start with a locale or /studio).
 *
 * The site uses route groups instead of a single root layout, so this
 * file needs to provide its own <html>/<body>. Localized content lives
 * in src/app/(site)/[locale]/not-found.tsx; that one fires when a known
 * locale segment exists but the inner path is missing.
 */

import './globals.css';

export default function RootNotFound() {
  return (
    <html lang="en">
      <body className="bg-paper text-ink">
        <div className="mx-auto max-w-2xl px-6 py-24">
          <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-orange-deep">
            404
          </p>
          <h1 className="mb-4 font-serif text-4xl font-medium leading-tight text-ink md:text-5xl">
            This page wandered off the itinerary.
          </h1>
          <p className="mb-10 font-serif text-lg italic leading-relaxed text-ink-soft">
            It may have moved, been retired, or never existed in the first
            place. The journal, the travel guide, and the concierge are all
            good places to pick the trail back up.
          </p>
          <div className="border-t border-line pt-8">
            <p className="mb-4 font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Where you might be heading
            </p>
            <ul className="space-y-2 font-serif text-lg">
              <li>
                <a href="/blog" className="text-ink hover:text-orange-deep">
                  The Journal →
                </a>
              </li>
              <li>
                <a href="/guide" className="text-ink hover:text-orange-deep">
                  Travel Guide →
                </a>
              </li>
              <li>
                <a href="/tours" className="text-ink hover:text-orange-deep">
                  Day Tours →
                </a>
              </li>
              <li>
                <a
                  href="/plan-your-tour"
                  className="text-ink hover:text-orange-deep"
                >
                  Talk to our concierge →
                </a>
              </li>
            </ul>
          </div>
        </div>
      </body>
    </html>
  );
}
