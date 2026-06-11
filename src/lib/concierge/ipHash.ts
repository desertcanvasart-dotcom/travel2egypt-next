import type { NextRequest } from 'next/server';

/**
 * Keyed one-way hashing for IP + User-Agent (Session 7).
 *
 * `ip_hash` / `user_agent_hash` = HMAC-SHA256(value, IP_HASH_SECRET), hex.
 * KEYED, not bare SHA-256: the IPv4 space is only 2^32, trivially
 * rainbow-tabled by a plain digest — the long-lived secret is what makes the
 * hash non-reversible. Deterministic (same value + secret → same hash) so it
 * can key a rate-limit counter, but the raw IP is never stored or logged.
 *
 * IP_HASH_SECRET is long-lived (Appendix A); rotating it resets rate-limit /
 * abuse continuity (old hashes no longer match), nothing worse.
 *
 * Web Crypto (crypto.subtle), matching cookie.ts — runs in Node route
 * handlers and the Edge runtime alike.
 */

function secret(): string {
  const s = process.env.IP_HASH_SECRET;
  if (!s) throw new Error('IP_HASH_SECRET must be set');
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
      ['sign'],
    );
  }
  return keyPromise;
}

function bytesToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** HMAC-SHA256 hex of an arbitrary value, keyed by IP_HASH_SECRET. */
export async function keyedHash(value: string): Promise<string> {
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(), encoder.encode(value));
  return bytesToHex(sig);
}

/**
 * The client IP behind Railway's proxy. `x-forwarded-for` is a comma-list
 * (client, proxy1, …) — the first entry is the originating client. Falls back
 * to `x-real-ip`. Returns null when no forwarded header is present (e.g. some
 * local dev), in which case IP-scoped limits are skipped for that request.
 *
 * The RAW value returned here must never be persisted or logged — callers hash
 * it via keyedHash() before it touches the DB.
 */
export function clientIp(req: NextRequest): string | null {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) {
    const first = fwd.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get('x-real-ip')?.trim();
  return real || null;
}

/** Hash the request's IP, or null when no IP could be determined. */
export async function hashedIp(req: NextRequest): Promise<string | null> {
  const ip = clientIp(req);
  return ip ? keyedHash(ip) : null;
}

/** Hash the request's User-Agent, or null when absent. */
export async function hashedUserAgent(req: NextRequest): Promise<string | null> {
  const ua = req.headers.get('user-agent')?.trim();
  return ua ? keyedHash(ua) : null;
}
