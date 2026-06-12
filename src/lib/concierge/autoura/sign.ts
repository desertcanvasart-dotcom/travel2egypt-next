/**
 * HMAC-SHA256 request signing for the Autoura brief webhook (Session 9).
 *
 * This is a deliberate byte-for-byte mirror of the RECEIVER's verifier
 * (travel-ops-pro `lib/concierge-webhook-auth.ts`): same signed content
 * (`${t}.${rawBody}`), same algorithm (HMAC-SHA256), same lowercase-hex
 * encoding, same `t=<unix>,v1=<hex>` header shape. The keystone test asserts
 * our digest equals the receiver's published GET test vector — if that ever
 * fails, the two implementations have drifted and delivery will 401.
 *
 * Node `crypto` (not Web Crypto): delivery runs only in the Node route handler
 * and the instrumentation reconciler — never Edge — so this never needs the
 * crypto.subtle / TypedArray path that ipHash.ts uses for middleware.
 *
 * THE signing contract that callers MUST honor: sign over the EXACT bytes you
 * send. Serialize the JSON once, sign `${t}.${thatString}`, and transmit
 * `thatString` verbatim. Re-stringifying after signing (or letting fetch
 * re-serialize an object body) changes the bytes and the receiver will reject
 * the signature. `deliver.ts` is the only caller and follows this.
 */
import { createHmac } from 'crypto';

export const SIGNATURE_HEADER = 'X-Autoura-Signature';
export const TIMESTAMP_HEADER = 'X-Autoura-Timestamp';
export const REQUEST_ID_HEADER = 'X-Request-Id';

/** Lowercase hex HMAC-SHA256 of `${timestamp}.${rawBody}`. */
export function signConciergePayload(
  secret: string,
  timestamp: number | string,
  rawBody: string,
): string {
  return createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
}

/** The full `t=<unix>,v1=<hex>` value for the `X-Autoura-Signature` header. */
export function buildSignatureHeader(
  secret: string,
  timestamp: number,
  rawBody: string,
): string {
  return `t=${timestamp},v1=${signConciergePayload(secret, timestamp, rawBody)}`;
}

/**
 * The signed headers for one delivery attempt. `requestId` changes per HTTP
 * attempt (so a retry is distinguishable from the original); the signature and
 * timestamp are computed over `rawBody`, which must be the exact transmitted
 * body. Caller supplies `nowSeconds` and `requestId` (no hidden Date/random
 * here, so the unit test is deterministic).
 */
export function buildSignedHeaders(params: {
  secret: string;
  rawBody: string;
  nowSeconds: number;
  requestId: string;
}): Record<string, string> {
  const { secret, rawBody, nowSeconds, requestId } = params;
  return {
    'Content-Type': 'application/json',
    [SIGNATURE_HEADER]: buildSignatureHeader(secret, nowSeconds, rawBody),
    [TIMESTAMP_HEADER]: String(nowSeconds),
    [REQUEST_ID_HEADER]: requestId,
  };
}
