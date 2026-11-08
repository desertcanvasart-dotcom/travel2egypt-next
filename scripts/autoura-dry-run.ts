/**
 * getAutoura multi-tenant dry-run verifier (S13 pivot) — reusable, WRITES NOTHING.
 *
 * Exercises the live platform endpoint using the app's OWN signer + payload
 * transform (serialize-once-then-sign), in three steps:
 *   1. GET  /api/webhooks/concierge — health + published test vector; assert
 *      our signer reproduces the platform's expected digest byte-for-byte.
 *   2. POST dry-run (X-Autoura-Dry-Run: true) per brand — the platform
 *      verifies the real signature, validates the payload, and previews the
 *      brand→tenant mapping WITHOUT storing anything.
 *   3. Report per-brand routing: mapped tenant, or unmapped (422) — the
 *      platform must map all four brand keys before cutover.
 *
 *   npx tsx scripts/autoura-dry-run.ts [--url https://getautoura.net/api/webhooks/concierge]
 *
 * Secret: AUTOURA_WEBHOOK_SECRET from .env — must equal the platform's
 * CONCIERGE_WEBHOOK_SECRET (a 401 on step 2 means they differ).
 */
import { config as loadEnv } from 'dotenv';

import { ROUTED_BRANDS, type RoutedBrand } from '../src/lib/concierge/brands';
import { toAutouraPayload } from '../src/lib/concierge/autoura/payload';
import {
  buildSignedHeaders,
  signConciergePayload,
} from '../src/lib/concierge/autoura/sign';
import type { BriefPayload } from '../src/types/concierge';

loadEnv();

const argUrl = process.argv.indexOf('--url');
const URL_ =
  argUrl > -1
    ? process.argv[argUrl + 1]
    : process.env.AUTOURA_WEBHOOK_URL || 'https://getautoura.net/api/webhooks/concierge';
const SECRET = process.env.AUTOURA_WEBHOOK_SECRET;

function syntheticBrief(): BriefPayload {
  return {
    complete: true,
    visitor: {
      name: '[dry-run] Verification Probe',
      email: null,
      phone: null,
      preferred_contact: null,
      timezone: 'Africa/Cairo',
      nationality: null,
      origin_city: null,
    },
    trip: {
      travelers_count: 2,
      travelers_detail: '[dry-run] synthetic — not a real enquiry',
      dates_specific: null,
      dates_window: null,
      length_days: null,
      international_flights: null,
      destinations: ['Cairo'],
    },
    preferences: { comfort_level: null, interests: [], must_see: [], must_avoid: [] },
    constraints: { dietary: null, mobility: null, religious: null, medical: null },
    brief_summary: '[dry-run] end-to-end signing + tenant-mapping verification. Not a lead.',
    follow_up_window: null,
    routed_brand: 'travel2egypt',
    routing_reason: null,
  };
}

async function main() {
  if (!SECRET) throw new Error('AUTOURA_WEBHOOK_SECRET missing from env');
  console.log(`endpoint: ${URL_}\n`);

  // ── 1. GET: health + test vector ──────────────────────────────────────────
  const health = (await (await fetch(URL_)).json()) as {
    status?: string;
    secrets_configured?: number;
    test_vector?: { secret: string; timestamp: number; body: string; expected_signature_header: string };
  };
  console.log(`GET health: status=${health.status} secrets_configured=${health.secrets_configured}`);
  const tv = health.test_vector;
  if (tv) {
    const ours = `t=${tv.timestamp},v1=${signConciergePayload(tv.secret, tv.timestamp, tv.body)}`;
    const match = ours === tv.expected_signature_header;
    console.log(`test vector: ${match ? '✓ our signer reproduces the platform digest' : `✗ MISMATCH\n  ours:   ${ours}\n  theirs: ${tv.expected_signature_header}`}`);
    if (!match) process.exit(1);
  }

  // ── 2. dry-run per brand ──────────────────────────────────────────────────
  for (const brand of ROUTED_BRANDS as readonly RoutedBrand[]) {
    const payload = toAutouraPayload(
      syntheticBrief(),
      {
        sessionId: null,
        conversationId: `dryrun-${brand}`,
        submittedAt: new Date().toISOString(),
        promptVersion: 'dry-run',
        language: 'en',
        briefRevision: 1,
        isUpdate: false,
        brand,
      },
      [],
    );
    const rawBody = JSON.stringify(payload);
    const headers = {
      ...buildSignedHeaders({
        secret: SECRET,
        rawBody,
        nowSeconds: Math.floor(Date.now() / 1000),
        requestId: crypto.randomUUID(),
      }),
      'Content-Type': 'application/json',
      'X-Autoura-Dry-Run': 'true',
    };
    const res = await fetch(URL_, { method: 'POST', headers, body: rawBody });
    const body = (await res.json().catch(() => null)) as {
      routing?: { tenant_id?: string; via?: string };
      code?: string;
      error?: string;
    } | null;
    if (res.status === 200 && body?.routing) {
      console.log(`brand=${brand.padEnd(12)} ✓ 200 → tenant=${body.routing.tenant_id} (via ${body.routing.via})`);
    } else {
      console.log(`brand=${brand.padEnd(12)} ✗ ${res.status} code=${body?.code ?? '—'} ${body?.error ?? ''}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
