import type { NextRequest } from 'next/server';

import { SESSION_COOKIE_NAME, SESSION_COOKIE_MAX_AGE_SECONDS } from './constants';

/**
 * Pure session-cookie crypto + attributes — NO database import, so this is
 * safe to use from Edge middleware (the S4 resume handler) as well as Node
 * route handlers. `ensureSession` (which hits Postgres) stays in session.ts.
 *
 * Cookie value: `<uuid>.<hmac-sha256-hex(uuid, SESSION_COOKIE_SECRET)>`.
 * Web Crypto (`crypto.subtle`) so the same signing runs in Node + Edge;
 * `subtle.verify` is constant-time (replaces node:crypto timingSafeEqual).
 */

function secret(): string {
  const s = process.env.SESSION_COOKIE_SECRET;
  if (!s) throw new Error('SESSION_COOKIE_SECRET must be set');
  return s;
}

const encoder = new TextEncoder();
let keyPromise: Promise<CryptoKey> | null = null;
let keyForSecret: string | null = null;

function hmacKey(): Promise<CryptoKey> {
  const s = secret();
  if (!keyPromise || keyForSecret !== s) {
    keyForSecret = s;
    keyPromise = crypto.subtle.importKey(
      'raw',
      encoder.encode(s),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify'],
    );
  }
  return keyPromise;
}

function bytesToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> | null {
  if (hex.length === 0 || hex.length % 2 !== 0 || /[^0-9a-f]/i.test(hex)) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

async function sign(id: string): Promise<string> {
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(), encoder.encode(id));
  return bytesToHex(sig);
}

export async function buildCookieValue(cookieId: string): Promise<string> {
  return `${cookieId}.${await sign(cookieId)}`;
}

/** Returns the verified cookie uuid, or null for missing/malformed/tampered. */
export async function verifyCookieValue(value: string | undefined): Promise<string | null> {
  if (!value) return null;
  const dot = value.lastIndexOf('.');
  if (dot <= 0 || dot === value.length - 1) return null;
  const id = value.slice(0, dot);
  const macBytes = hexToBytes(value.slice(dot + 1));
  if (!macBytes) return null;
  const ok = await crypto.subtle.verify('HMAC', await hmacKey(), macBytes, encoder.encode(id));
  return ok ? id : null;
}

/**
 * Cookie attributes per the locked decisions: HttpOnly, Secure, SameSite=Lax,
 * 30-day max-age, parent-domain `.travel2egypt.org` only when actually served
 * there (a foreign Domain attribute is rejected on localhost / the Railway
 * preview host). `secure` relaxed in dev for plain-http localhost.
 */
export async function sessionCookie(req: NextRequest, cookieId: string) {
  const host = req.headers.get('host')?.split(':')[0].toLowerCase() ?? '';
  const onSiteDomain = host === 'travel2egypt.org' || host.endsWith('.travel2egypt.org');
  return {
    name: SESSION_COOKIE_NAME,
    value: await buildCookieValue(cookieId),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
    ...(onSiteDomain ? { domain: '.travel2egypt.org' } : {}),
  };
}

/**
 * Expire the session cookie (Session 8 delete-my-conversation). Same name /
 * path / domain attributes as `sessionCookie` so the browser actually clears
 * it (a mismatched domain leaves a stale cookie behind), with `maxAge: 0`.
 */
export function expireSessionCookie(req: NextRequest) {
  const host = req.headers.get('host')?.split(':')[0].toLowerCase() ?? '';
  const onSiteDomain = host === 'travel2egypt.org' || host.endsWith('.travel2egypt.org');
  return {
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
    ...(onSiteDomain ? { domain: '.travel2egypt.org' } : {}),
  };
}
