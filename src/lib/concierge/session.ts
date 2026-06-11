import type { NextRequest } from 'next/server';

import { conciergeDb } from '@/lib/supabase/server';

import { verifyCookieValue } from './cookie';

// Re-export the pure cookie helpers (now in ./cookie, DB-free for Edge
// middleware use) so existing importers of session.ts keep working.
export { buildCookieValue, verifyCookieValue, sessionCookie } from './cookie';

/**
 * Anonymous concierge sessions. The signed-cookie crypto lives in ./cookie
 * (Web Crypto, Node + Edge); this module adds the Postgres-bound resolution.
 *
 * SESSION_COOKIE_SECRET is long-lived; rotating it invalidates every live
 * session. A tampered cookie is treated as ABSENT (fresh session), never an
 * error. ip_hash / user_agent_hash are keyed HMACs (Session 7) — captured on
 * create and back-filled on the first authenticated turn after S7 ships, never
 * the raw IP (see ipHash.ts). Callers pass the already-hashed values.
 */

export interface ConciergeSession {
  /** concierge.sessions.id — FK target for conversations. */
  rowId: string;
  /** The uuid inside the cookie (sessions.cookie_id). */
  cookieId: string;
  /** True when freshly minted — the caller must set the cookie on its response. */
  isNew: boolean;
  /** The session's captured email, if any (Gate 1 / brief flow). */
  email: string | null;
}

/**
 * Resolve the request's session. Valid cookie → touch `last_active_at` and
 * return it. Missing/tampered cookie (or a signed id whose row vanished) →
 * mint a new session row, unless `createIfMissing: false` (read-only
 * endpoints return null instead of minting rows for every crawler hit).
 */
export async function ensureSession(
  req: NextRequest,
  opts: {
    locale?: string;
    createIfMissing?: boolean;
    /** Keyed HMAC of the IP / UA (Session 7) — already hashed; never raw. */
    ipHash?: string | null;
    userAgentHash?: string | null;
  } = {},
): Promise<ConciergeSession | null> {
  const db = conciergeDb();
  const cookieId = await verifyCookieValue(req.cookies.get('t2e_session_id')?.value);

  if (cookieId) {
    const { data, error } = await db
      .from('sessions')
      .select('id, email, ip_hash')
      .eq('cookie_id', cookieId)
      .maybeSingle();
    if (error) throw new Error(`session lookup failed: ${error.message}`);
    if (data) {
      // Touch last_active_at; back-fill the keyed hashes the first time we
      // have them on an existing (pre-S7) session row.
      const patch: { last_active_at: string; ip_hash?: string; user_agent_hash?: string | null } = {
        last_active_at: new Date().toISOString(),
      };
      if (!data.ip_hash && opts.ipHash) {
        patch.ip_hash = opts.ipHash;
        patch.user_agent_hash = opts.userAgentHash ?? null;
      }
      await db.from('sessions').update(patch).eq('id', data.id);
      return { rowId: data.id, cookieId, isNew: false, email: data.email };
    }
  }

  if (opts.createIfMissing === false) return null;

  const freshId = crypto.randomUUID();
  const { data, error } = await db
    .from('sessions')
    .insert({
      cookie_id: freshId,
      locale: opts.locale ?? 'en',
      ip_hash: opts.ipHash ?? null,
      user_agent_hash: opts.userAgentHash ?? null,
    })
    .select('id')
    .single();
  if (error || !data) {
    throw new Error(`session create failed: ${error?.message ?? 'no row returned'}`);
  }
  return { rowId: data.id, cookieId: freshId, isNew: true, email: null };
}
