/**
 * Sentry — edge runtime init (middleware + edge routes). Loaded from
 * `instrumentation.ts` `register()` when `NEXT_RUNTIME === 'edge'` (Session 11).
 *
 * Same cookieless / no-PII policy as the server config; kept minimal for the
 * Edge bundle. Dormant until `SENTRY_DSN` is set.
 */
import * as Sentry from '@sentry/nextjs';

import { scrubEvent } from '@/lib/monitoring/sentryScrub';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  sendDefaultPii: false,
  tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
    ? Number(process.env.SENTRY_TRACES_SAMPLE_RATE)
    : 0.1,
  environment: process.env.NODE_ENV,
  beforeSend: scrubEvent,
  debug: false,
});
