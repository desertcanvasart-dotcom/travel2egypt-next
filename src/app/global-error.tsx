'use client';

/**
 * Root global error boundary (Session 11). Catches errors thrown in the root
 * layout / RSC tree that the per-locale `error.tsx` cannot reach, and reports
 * them to Sentry (no-op until SENTRY_DSN is set; PII scrubbed in beforeSend).
 *
 * global-error must render its own <html>/<body> because it replaces the root
 * layout when it fires.
 */
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Georgia, "Times New Roman", serif',
          color: '#1a1a1a',
          background: '#faf8f4',
        }}
      >
        <div style={{ maxWidth: '32rem', padding: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 500, marginBottom: '0.75rem' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: '#555', marginBottom: '1.5rem' }}>
            It&rsquo;s probably temporary. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              borderRadius: '9999px',
              border: 'none',
              background: '#d2691e',
              color: '#fff',
              padding: '0.75rem 1.5rem',
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
