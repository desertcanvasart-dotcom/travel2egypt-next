/**
 * Next.js instrumentation hook — runs once per server process on boot.
 *
 * Two jobs:
 *  1. (Session 9) reconcile Autoura brief deliveries left stuck by a restart.
 *     The delivery chain is Node-only (uses `node:crypto`, the service-role DB
 *     client, setTimeout backoff) and must never enter the Edge bundle — this
 *     app has `middleware.ts`, so instrumentation is compiled for the Edge
 *     runtime too. The `process.env.NEXT_RUNTIME === 'nodejs'` POSITIVE guard
 *     around the dynamic import is the form Next's webpack plugin recognizes and
 *     strips from the Edge build (an early-return negation is not eliminated and
 *     pulls the chain into Edge, which then can't resolve `node:crypto`).
 *  2. (Session 11) load the runtime-appropriate Sentry init (cookieless,
 *     PII-scrubbed; dormant until SENTRY_DSN is set). Each config is dynamically
 *     imported behind its own positive NEXT_RUNTIME guard for the same
 *     Edge/Node bundle-separation reason.
 *
 * Best-effort: a reconcile failure must never block server startup.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
    try {
      const { reconcileStuckBriefs } = await import('@/lib/concierge/autoura/reconcile');
      await reconcileStuckBriefs();
    } catch (err) {
      console.error('[concierge] startup reconcile skipped (error):', err);
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Capture errors thrown in nested React Server Components (App Router). No-op
// until Sentry is initialized (no DSN), and PII is scrubbed via beforeSend.
export { captureRequestError as onRequestError } from '@sentry/nextjs';
