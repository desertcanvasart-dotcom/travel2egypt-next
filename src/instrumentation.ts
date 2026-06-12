/**
 * Next.js instrumentation hook — runs once per server process on boot.
 *
 * Used (Session 9) to reconcile Autoura brief deliveries left stuck by a
 * restart. The delivery chain is Node-only (uses `node:crypto`, the service-role
 * DB client, setTimeout backoff) and must never enter the Edge bundle — this
 * app has `middleware.ts`, so instrumentation is compiled for the Edge runtime
 * too. The `process.env.NEXT_RUNTIME === 'nodejs'` POSITIVE guard around the
 * dynamic import is the form Next's webpack plugin recognizes and strips from
 * the Edge build (an early-return negation is not eliminated and pulls the
 * chain into Edge, which then can't resolve `node:crypto`).
 *
 * Best-effort: a reconcile failure must never block server startup.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { reconcileStuckBriefs } = await import('@/lib/concierge/autoura/reconcile');
      await reconcileStuckBriefs();
    } catch (err) {
      console.error('[concierge] startup reconcile skipped (error):', err);
    }
  }
}
