/**
 * Startup reconciliation for stuck Autoura deliveries (Session 9).
 *
 * The delivery worker is in-process: a brief that was mid-flight (status
 * 'pending' or 'retried') when the Railway process restarted would otherwise be
 * stranded. On boot (`instrumentation.ts`) we re-attempt those rows. This is the
 * accepted v1 recovery mechanism — reconciliation, not a durable queue.
 *
 * Safe to run on every boot because `deliverBrief` is idempotent: a row that was
 * actually received by Autoura before the crash resolves to the receiver's
 * duplicate_ignored (a 2xx) and settles as 'sent' without double-creating.
 *
 * Bounded: only `pending`/`retried` rows that have NOT already fallen back to
 * email (`email_fallback_sent = false`), capped at `limit`, processed serially
 * with a small gap so a backlog can't stampede Autoura or Supabase on boot.
 */
import { conciergeDb } from '@/lib/supabase/server';

import { deliverBrief } from './deliver';

const DEFAULT_LIMIT = 20;
const GAP_MS = 250;

export async function reconcileStuckBriefs(limit = DEFAULT_LIMIT): Promise<number> {
  const db = conciergeDb();

  const { data, error } = await db
    .from('briefs')
    .select('id')
    .in('autoura_webhook_status', ['pending', 'retried'])
    .eq('email_fallback_sent', false)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[concierge] reconcile query failed:', error.message);
    return 0;
  }
  if (!data || data.length === 0) return 0;

  console.log(`[concierge] reconciling ${data.length} stuck Autoura deliver(y/ies)`);
  let done = 0;
  for (const row of data) {
    // S13 multi-tenant pivot: brand rides in the payload (the worker loads the
    // row's delivered_brand snapshot itself), so a routed-then-crashed delivery
    // reconciles with the SAME brand automatically — no per-brand endpoint.
    // deliverBrief never throws, but guard anyway so one bad row can't halt the sweep.
    await deliverBrief(row.id).catch((err) =>
      console.error('[concierge] reconcile deliver failed for', row.id, err),
    );
    done += 1;
    if (done < data.length) await new Promise((resolve) => setTimeout(resolve, GAP_MS));
  }
  return done;
}
