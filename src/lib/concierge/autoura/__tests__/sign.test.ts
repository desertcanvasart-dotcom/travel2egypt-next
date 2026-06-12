/**
 * Autoura signing tests. Run: `npx tsx src/lib/concierge/autoura/__tests__/sign.test.ts`
 * Pure (no network) — the keystone is the receiver's published GET test vector.
 */
import {
  buildSignatureHeader,
  buildSignedHeaders,
  signConciergePayload,
  REQUEST_ID_HEADER,
  SIGNATURE_HEADER,
  TIMESTAMP_HEADER,
} from '../sign';

let pass = 0;
let fail = 0;
function eq(actual: unknown, expected: unknown, label: string) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) pass++;
  else {
    fail++;
    console.log(`FAIL: ${label}\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`);
  }
}

// ── KEYSTONE: byte-for-byte match with the receiver's published vector ──────
// travel-ops-pro app/api/webhooks/concierge GET + __tests__/concierge-webhook.test.ts.
// If this fails, our signer has drifted from Autoura's verifier — every live
// delivery would 401. Fix this before anything else.
const VEC_SECRET = 'whsec_test_concierge_autoura';
const VEC_TS = 1735732800;
const VEC_BODY = '{"conversation_id":"test-conversation","brief_revision":1}';
const VEC_DIGEST = '3cc2e7aba5b04ecf03020484f1befcdb128b1cb83f38030550591b159334db5a';

eq(signConciergePayload(VEC_SECRET, VEC_TS, VEC_BODY), VEC_DIGEST, 'KEYSTONE: published test vector digest');
eq(
  buildSignatureHeader(VEC_SECRET, VEC_TS, VEC_BODY),
  `t=${VEC_TS},v1=${VEC_DIGEST}`,
  'KEYSTONE: signature header shape t=,v1=',
);

// ── determinism + tamper sensitivity ───────────────────────────────────────
eq(
  signConciergePayload(VEC_SECRET, VEC_TS, VEC_BODY) === signConciergePayload(VEC_SECRET, VEC_TS, VEC_BODY),
  true,
  'deterministic for identical inputs',
);
eq(
  signConciergePayload(VEC_SECRET, VEC_TS, VEC_BODY + ' ') === VEC_DIGEST,
  false,
  'a single trailing byte changes the digest (raw-bytes signing)',
);
eq(
  signConciergePayload(VEC_SECRET, VEC_TS + 1, VEC_BODY) === VEC_DIGEST,
  false,
  'a different timestamp changes the digest (timestamp is signed)',
);
eq(
  signConciergePayload('wrong_secret', VEC_TS, VEC_BODY) === VEC_DIGEST,
  false,
  'a different secret changes the digest',
);

// ── buildSignedHeaders: shape + values ──────────────────────────────────────
const headers = buildSignedHeaders({
  secret: VEC_SECRET,
  rawBody: VEC_BODY,
  nowSeconds: VEC_TS,
  requestId: 'req-123',
});
eq(headers[SIGNATURE_HEADER], `t=${VEC_TS},v1=${VEC_DIGEST}`, 'signed headers: signature');
eq(headers[TIMESTAMP_HEADER], String(VEC_TS), 'signed headers: companion timestamp == t');
eq(headers[REQUEST_ID_HEADER], 'req-123', 'signed headers: request id passthrough');
eq(headers['Content-Type'], 'application/json', 'signed headers: content-type');

console.log(`\nautoura sign: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
