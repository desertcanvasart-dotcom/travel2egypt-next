'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LocaleError({ error, reset }: Props) {
  useEffect(() => {
    // Report to Sentry (Session 11; no-op until SENTRY_DSN is set, PII scrubbed
    // in beforeSend) and surface in the dev console.
    Sentry.captureException(error);
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-24">
      <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.15em] text-orange-deep">
        Something went wrong
      </p>
      <h1 className="mb-4 font-serif text-4xl font-medium text-ink">
        We couldn&rsquo;t load this page
      </h1>
      <p className="mb-8 font-serif text-lg italic leading-relaxed text-ink-soft">
        It&rsquo;s probably temporary. Try again, and if it keeps happening, the
        page may have moved.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-orange px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-orange-deep"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-full border border-ink px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
        >
          Back to homepage
        </a>
      </div>
    </div>
  );
}
