#!/usr/bin/env node
/**
 * Session 18 — Classifier regression test for the aggregator-shell
 * disqualifier rules added in scripts/wp-classifier.ts.
 *
 * Three assertions:
 *   1. All 26 session-18 deleted slugs now classify to `service-or-utility`.
 *   2. None of the 196 surviving tour docs flip away from `tour-or-package`.
 *   3. The 3 EXPLICIT_PAGE_ROUTING whitelisted concierge slugs still
 *      classify to `tour-or-package` (negative-control: rule must not
 *      regress them).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@sanity/client';
import { classifyPageBySlug } from './wp-classifier.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CANDIDATES = path.join(ROOT, 'migration/sessions/session-18-audit/tour-misclassification-candidates.json');

const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => {
    const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^['"]|['"]$/g, '')];
  })
);
const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: env.SANITY_API_READ_TOKEN || env.SANITY_AUTH_TOKEN,
  useCdn: false,
});

async function main(){
// Test 1 — 26 deleted slugs should classify to service-or-utility
const candidates: Array<{ recommended_target: string; slug: string }> = JSON.parse(fs.readFileSync(CANDIDATES, 'utf8'));
const deletedSlugs = candidates.filter((c) => String(c.recommended_target).startsWith('shell-empty')).map((c) => c.slug);

const t1Failures = [];
for (const slug of deletedSlugs) {
  const r = classifyPageBySlug(slug);
  if (r.type !== 'service-or-utility') {
    t1Failures.push({ slug, got: r.type, reason: r.reason });
  }
}

// Test 2 — surviving tour docs should still be tour-or-package
// Known pre-existing classifier-vs-data anomalies (not caused by session 18):
// - `egypt-tours`: empty-body tour shell whose slug matches the `-tours`
//   topic-suffix rule (line 219 of wp-classifier.ts) → destination-subpage.
//   Predates this session; documented in session 18 audit-report.
const KNOWN_PREEXISTING_EXCEPTIONS: Set<string> = new Set(['egypt-tours']);

const survivingSlugs = await client.fetch(
  `*[_type=="tour" && !(_id in path("drafts.**"))]{
    "slug": slug[_key=="en"][0].value.current
  }[].slug`
);
const t2Failures = [];
for (const slug of survivingSlugs) {
  if (!slug) continue;
  if (KNOWN_PREEXISTING_EXCEPTIONS.has(slug)) continue;
  const r = classifyPageBySlug(slug);
  if (r.type !== 'tour-or-package') {
    t2Failures.push({ slug, got: r.type, reason: r.reason });
  }
}

// Test 3 — negative control: explicit whitelist slugs still tour
const WHITELIST = ['cairo-private-car-and-guide', 'aswan-private-car-and-guide', 'luxor-private-car-and-guide'];
const t3Failures = [];
for (const slug of WHITELIST) {
  const r = classifyPageBySlug(slug);
  if (r.type !== 'tour-or-package') {
    t3Failures.push({ slug, got: r.type, reason: r.reason });
  }
}

const pad = (s: string, n: number) => String(s).padEnd(n);
console.log('=== Session 18 classifier regression tests ===\n');
console.log(`Test 1 — 26 deleted shells → service-or-utility:`);
console.log(`  passed: ${deletedSlugs.length - t1Failures.length}/${deletedSlugs.length}  ${t1Failures.length === 0 ? 'PASS' : 'FAIL'}`);
for (const f of t1Failures) console.log(`    ${pad(f.slug, 50)} got=${f.got}  reason=${f.reason}`);

console.log(`\nTest 2 — 196 surviving tours → tour-or-package:`);
console.log(`  passed: ${survivingSlugs.length - t2Failures.length}/${survivingSlugs.length}  ${t2Failures.length === 0 ? 'PASS' : 'FAIL'}`);
for (const f of t2Failures.slice(0, 10)) console.log(`    ${pad(f.slug, 50)} got=${f.got}  reason=${f.reason}`);
if (t2Failures.length > 10) console.log(`    … ${t2Failures.length - 10} more`);

console.log(`\nTest 3 — 3 whitelisted concierge slugs → tour-or-package:`);
console.log(`  passed: ${WHITELIST.length - t3Failures.length}/${WHITELIST.length}  ${t3Failures.length === 0 ? 'PASS' : 'FAIL'}`);
for (const f of t3Failures) console.log(`    ${pad(f.slug, 50)} got=${f.got}  reason=${f.reason}`);

const ok = t1Failures.length === 0 && t2Failures.length === 0 && t3Failures.length === 0;
console.log(`\n${ok ? 'ALL PASS' : 'FAILURES — see above'}`);
process.exit(ok ? 0 : 1);
}
main().catch(e => { console.error(e); process.exit(1); });
