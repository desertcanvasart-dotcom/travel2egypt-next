/**
 * Stateless resume tokens (Session 4) — "save my conversation" email links.
 *
 * Token = base64url(payload) + "." + base64url(hmac-sha256(payload)).
 * payload = {cid: <session cookie_id>, exp: <unix seconds>}. No DB table:
 * the HMAC is the integrity guarantee, the embedded exp is the lifetime
 * (30 days), and rotating RESUME_TOKEN_SECRET is the bulk-revocation lever.
 *
 * Web Crypto only (no node:crypto) so verify() runs in Edge middleware AND
 * sign() runs in the Node /api/resume route. Separate secret from the
 * session cookie (RESUME_TOKEN_SECRET) so rotating one doesn't disturb the
 * other (S4 decision 4).
 */

export const RESUME_TOKEN_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

interface ResumePayload {
  cid: string;
  exp: number;
}

function secret(): string {
  const s = process.env.RESUME_TOKEN_SECRET;
  if (!s) throw new Error('RESUME_TOKEN_SECRET must be set');
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

function b64urlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): Uint8Array<ArrayBuffer> | null {
  try {
    const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

/** Sign a resume token for a session cookie_id (default 30-day expiry). */
export async function signResumeToken(
  cid: string,
  maxAgeSeconds: number = RESUME_TOKEN_MAX_AGE_SECONDS,
  nowMs: number = Date.now(),
): Promise<string> {
  const payload: ResumePayload = {
    cid,
    exp: Math.floor(nowMs / 1000) + maxAgeSeconds,
  };
  const payloadB64 = b64urlEncode(encoder.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign(
    'HMAC',
    await hmacKey(),
    encoder.encode(payloadB64),
  );
  return `${payloadB64}.${b64urlEncode(new Uint8Array(sig))}`;
}

/**
 * Verify a resume token. Returns the session cookie_id if the signature is
 * valid AND not expired; null otherwise (tampered, malformed, or expired).
 */
export async function verifyResumeToken(
  token: string | undefined | null,
  nowMs: number = Date.now(),
): Promise<string | null> {
  if (!token) return null;
  const dot = token.indexOf('.');
  if (dot <= 0 || dot === token.length - 1) return null;
  const payloadB64 = token.slice(0, dot);
  const sigBytes = b64urlDecode(token.slice(dot + 1));
  if (!sigBytes) return null;

  // Pass the Uint8Array (TypedArray) directly — the Edge runtime's
  // SubtleCrypto rejects a bare ArrayBuffer constructed in the module realm.
  const ok = await crypto.subtle.verify('HMAC', await hmacKey(), sigBytes, encoder.encode(payloadB64));
  if (!ok) return null;

  const payloadBytes = b64urlDecode(payloadB64);
  if (!payloadBytes) return null;
  let payload: ResumePayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as ResumePayload;
  } catch {
    return null;
  }
  if (typeof payload.cid !== 'string' || typeof payload.exp !== 'number') return null;
  if (Math.floor(nowMs / 1000) > payload.exp) return null;
  return payload.cid;
}
