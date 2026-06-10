import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { ConciergeDatabase } from '@/types/concierge-db';

/**
 * Server-side Supabase client for the `concierge` schema — SERVICE ROLE.
 *
 * Must only ever be imported from API route handlers / server code; the
 * service-role key bypasses RLS and must never reach a client bundle
 * (Session 11 verifies with a bundle grep). The throw below is a tripwire,
 * not the security boundary.
 *
 * The client is pinned to the `concierge` schema (`db.schema`), so table
 * names are bare: `.from('sessions')` → `concierge.sessions`. The schema
 * must also be listed under the Dashboard's "Exposed schemas" — see
 * supabase/migrations/0001_concierge_init.md.
 */
if (typeof window !== 'undefined') {
  throw new Error('lib/supabase/server.ts must never be imported client-side');
}

type ConciergeClient = SupabaseClient<ConciergeDatabase, 'concierge'>;

let cached: ConciergeClient | null = null;

/** Lazy singleton — env vars are read at first use, not at import/build time. */
export function conciergeDb(): ConciergeClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }
  cached = createClient<ConciergeDatabase, 'concierge'>(url, key, {
    db: { schema: 'concierge' },
    // No browser auth machinery — this is a stateless server credential.
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
