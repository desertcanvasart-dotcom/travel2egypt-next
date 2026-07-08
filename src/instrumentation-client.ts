/**
 * Sentry — browser init (Session 11). Next 15 loads this file automatically on
 * the client (replaces the legacy `sentry.client.config.ts`).
 *
 * COOKIELESS by design: Session Replay is the only browser feature that would
 * set cookies / local storage, and it is deliberately NOT enabled (no
 * `replayIntegration`, sample rates left at 0). Default error + performance
 * capture sets no cookies. Session tracking sends in-memory envelopes only.
 *
 * The client DSN must reach the browser, so it uses `NEXT_PUBLIC_SENTRY_DSN`
 * (a Sentry DSN is a public ingest key, not a secret). Dormant until set.
 * PII is scrubbed in `beforeSend` (shared with server/edge) and
 * `sendDefaultPii: false` keeps IPs off by default.
 */
import * as Sentry from '@sentry/nextjs';

import { scrubEvent } from '@/lib/monitoring/sentryScrub';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  sendDefaultPii: false,
  // COOKIELESS: keep Sentry's default integrations (error/breadcrumb/global
  // handlers) but do NOT add `replayIntegration` — Session Replay is the only
  // browser feature that sets cookies / local storage. Do not add it without
  // revisiting the cookieless requirement. (Passing `integrations: []` would
  // wrongly strip the defaults and break error capture, so it is omitted.)
  tracesSampleRate: process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
    ? Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE)
    : 0.1,
  environment: process.env.NODE_ENV,
  beforeSend: scrubEvent,
  debug: false,
});

// Instrument App Router client-side navigations for tracing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
