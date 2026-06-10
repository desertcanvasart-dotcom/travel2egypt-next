import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

import type { NextRequest } from 'next/server';

import { conciergeDb } from '@/lib/supabase/server';

import { SESSION_COOKIE_NAME, SESSION_COOKIE_MAX_AGE_SECONDS } from './constants';

/**
 * Anonymous concierge sessions — signed `t2e_session_id` cookie.
 *
 * Cookie value: `<uuid>.<hmac-sha256-hex(uuid, SESSION_COOKIE_SECRET)>`.
 * The uuid is an opaque handle (sessions.cookie_id); the conversation
 * itself lives in Postgres. A bad signature is treated as ABSENT, not as
 * an error: tampering must never grant access to the claimed session, but
 * it also shouldn't 403 a visitor — they just get a fresh session.
 * SESSION_COOKIE_SECRET is long-lived; rotating it invalidates every
 * live session (locked decision, see brief Appendix A).
 */

function secret(): string {
  const s = process.env.SESSION_COOKIE_SECRET;
  if (!s) throw new Error('SESSION_COOKIE_SECRET must be set');
  return s;
}

function sign(id: string): string {
  return createHmac('sha256', secret()).update(id).digest('hex');
}

export function buildCookieValue(cookieId: string): string {
  return `${cookieId}.${sign(cookieId)}`;
}

/** Returns the verified cookie uuid, or null for missing/malformed/tampered. */
export function verifyCookieValue(value: string | undefined): string | null {
  if (!value) return null;
  const dot = value.lastIndexOf('.');
  if (dot <= 0 || dot === value.length - 1) return null;
  const id = value.slice(0, dot);
  const mac = value.slice(dot + 1);
  const expected = sign(id);
  if (mac.length !== expected.length) return null;
  // Compare the hex strings as bytes — equal length is guaranteed above.
  return timingSafeEqual(Buffer.from(mac), Buffer.from(expected)) ? id : null;
}

export interface ConciergeSession {
  /** concierge.sessions.id — FK target for conversations. */
  rowId: string;
  /** The uuid inside the cookie (sessions.cookie_id). */
  cookieId: string;
  /** True when freshly minted — the caller must set the cookie on its response. */
  isNew: boolean;
}

/**
 * Resolve the request's session. Valid cookie → touch `last_active_at` and
 * return it. Missing/tampered cookie (or a signed id whose row vanished) →
 * mint a new session row, unless `createIfMissing: false` (read-only
 * endpoints like GET /api/conversation return null instead of minting rows
 * for every crawler hit).
 *
 * ip_hash / user_agent_hash stay NULL until Session 7 (keyed HMAC hashing).
 */
export async function ensureSession(
  req: NextRequest,
  opts: { locale?: string; createIfMissing?: boolean } = {},
): Promise<ConciergeSession | null> {
  const db = conciergeDb();
  const cookieId = verifyCookieValue(req.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (cookieId) {
    const { data, error } = await db
      .from('sessions')
      .select('id')
      .eq('cookie_id', cookieId)
      .maybeSingle();
    if (error) throw new Error(`session lookup failed: ${error.message}`);
    if (data) {
      await db
        .from('sessions')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', data.id);
      return { rowId: data.id, cookieId, isNew: false };
    }
  }

  if (opts.createIfMissing === false) return null;

  const freshId = randomUUID();
  const { data, error } = await db
    .from('sessions')
    .insert({ cookie_id: freshId, locale: opts.locale ?? 'en' })
    .select('id')
    .single();
  if (error || !data) {
    throw new Error(`session create failed: ${error?.message ?? 'no row returned'}`);
  }
  return { rowId: data.id, cookieId: freshId, isNew: true };
}

/**
 * Cookie attributes per the locked decisions: HttpOnly, Secure, SameSite=Lax,
 * 30-day max-age, scoped to the parent domain `.travel2egypt.org` — but only
 * when actually served on that domain. On the Railway preview host or
 * localhost a foreign Domain attribute would make the browser reject the
 * cookie outright, so those get a host-only cookie. `secure` is relaxed in
 * dev for plain-http localhost.
 */
export function sessionCookie(req: NextRequest, cookieId: string) {
  const host = req.headers.get('host')?.split(':')[0].toLowerCase() ?? '';
  const onSiteDomain = host === 'travel2egypt.org' || host.endsWith('.travel2egypt.org');
  return {
    name: SESSION_COOKIE_NAME,
    value: buildCookieValue(cookieId),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
    ...(onSiteDomain ? { domain: '.travel2egypt.org' } : {}),
  };
}
