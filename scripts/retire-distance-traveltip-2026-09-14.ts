/**
 * Retire the duplicate "Distances Between Egyptian Cities" travelTip.
 *
 * Founder call 2026-09-14: "keep the app route, redirect the travel tip to it."
 * Two live, self-canonical pages covered one subject —
 *   KEEPER    /distance-between-egyptian-cities        (app route,
 *             src/app/(site)/[locale]/distance-between-egyptian-cities/page.tsx,
 *             declared in routing.ts; same English leaf in all three locales)
 *   RETIRED   /travel-tips/distance-between-egyptian-cities and its ES/JA
 *             localized leaves (travelTip wp-page-77776)
 *
 * travelTip has no `hidden` field, and both the travel-tips index query and the
 * sitemap list every published travelTip. Leaving the doc published would keep
 * three sitemap entries pointing at URLs that 301 — the "Page with redirect"
 * warning we have spent this session clearing. So the doc is UNPUBLISHED: the
 * published version is deleted and its content preserved as a draft, plus a
 * rollback JSON written before any write. Nothing is destroyed.
 *
 * Inbound references checked: 0.
 *
 *   npx tsx scripts/retire-distance-traveltip-2026-09-14.ts --dry-run | --commit
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
loadEnv();

const DOC_ID = 'wp-page-77776';
const DRAFT_ID = `drafts.${DOC_ID}`;
const KEEPER = '/distance-between-egyptian-cities';

const commit = process.argv.includes('--commit');
if (!commit && !process.argv.includes('--dry-run')) { console.error('pass --dry-run or --commit'); process.exit(2); }

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: 'production',
  apiVersion: '2024-12-01', useCdn: false, perspective: 'raw',
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
});

(async () => {
  const doc = await client.getDocument(DOC_ID);
  if (!doc) throw new Error(`${DOC_ID} not found — already retired?`);
  const inbound: { _id: string }[] = await client.fetch(`*[references($id)]{_id}`, { id: DOC_ID });
  if (inbound.length) throw new Error(`ABORT: ${inbound.length} inbound reference(s) must be repointed first: ${inbound.map((r) => r._id).join(', ')}`);

  const slugs = (doc as { slug?: { _key: string; value: { current: string } }[] }).slug ?? [];
  console.log(`retiring ${DOC_ID} — slugs: ${slugs.map((s) => `${s._key}:${s.value.current}`).join(' · ')}`);
  console.log(`keeper: ${KEEPER} (app route, unchanged)`);
  console.log(`inbound references: 0`);

  const dir = resolve(process.cwd(), 'backups'); if (!existsSync(dir)) mkdirSync(dir);
  const path = resolve(dir, `distance-traveltip-before-retire-2026-09-14.json`);
  writeFileSync(path, JSON.stringify({ retiredAt: new Date().toISOString(), keeper: KEEPER, publishedDoc: doc }, null, 2));
  console.log(`rollback written: ${path}`);

  if (!commit) { console.log('\ndry-run: no write. Would create the draft copy, then delete the published doc.'); return; }

  // Preserve content as a draft, then remove the published version in one transaction.
  const draft = { ...(doc as Record<string, unknown>), _id: DRAFT_ID };
  delete (draft as Record<string, unknown>)._rev;
  await client.transaction().createOrReplace(draft as never).delete(DOC_ID).commit();
  console.log(`\nUNPUBLISHED: content preserved at ${DRAFT_ID}; published ${DOC_ID} deleted.`);
  console.log('It now leaves the travel-tips index and the sitemap. Redirect rows send its three URLs to the keeper.');
})().catch((e) => { console.error(e); process.exit(1); });
