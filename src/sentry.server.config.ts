/**
 * Sentry — server (Node.js runtime) init. Loaded from `instrumentation.ts`
 * `register()` when `NEXT_RUNTIME === 'nodejs'` (Session 11).
 *
 * Dormant until `SENTRY_DSN` is set (owner supplies at S12/Railway); with no DSN
 * `Sentry.init` is a no-op and nothing is sent. PII is scrubbed in `beforeSend`
 * (see sentryScrub.ts) with `sendDefaultPii: false` as the first line of defense.
 */
import * as Sentry from '@sentry/nextjs';

import { scrubEvent } from '@/lib/monitoring/sentryScrub';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  // No PII: never attach IP, cookies, or request bodies. Scrubbed again in
  // beforeSend for defense in depth.
  sendDefaultPii: false,
  // Low, tunable trace sampling — status codes + response times, no content.
  tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
    ? Number(process.env.SENTRY_TRACES_SAMPLE_RATE)
    : 0.1,
  environment: process.env.NODE_ENV,
  beforeSend: scrubEvent,
  // Keep the SDK quiet in logs; no Spotlight in prod.
  debug: false,
});
