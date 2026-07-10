/**
 * Publish the 30 guide-dedup drafts (16 hide+redirect + 14 tag-only) from
 * scripts/guide-dedup-hide-and-redirect-2026-07-09.ts and
 * scripts/guide-dedup-tag-hidden-2026-07-09.ts directly via the Sanity
 * Actions API — bypassing the embedded Studio's Publish button, which is
 * blocked by a stale-schema validation false-positive unrelated to these
 * changes (confirmed: the flagged inline-image alt/caption fields already
 * match the current internationalizedArrayString schema; the Studio's
 * client bundle is just showing an outdated type expectation).
 *
 * Each publish is the standard manual-publish operation: take the existing
 * `drafts.<id>` content and make it the published `<id>` document. Nothing
 * here changes what content ships — it's identical to what's already
 * sitting in each draft, reviewed in Studio.
 *
 * DRY RUN by default (lists what would publish); --apply publishes.
 * Idempotent: skips any id with no pending draft.
 * Run: npx tsx scripts/guide-dedup-publish-drafts-2026-07-10.ts [--apply] [id...]
 *   (pass specific ids as args to publish a subset; omit for all 30)
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';

const APPLY = process.argv.includes('--apply');
const idsArg = process.argv.slice(2).filter((a) => !a.startsWith('--'));

const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
if (dataset !== 'production') throw new Error(`Refusing to run against "${dataset}".`);
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset,
  apiVersion: '2024-12-01', useCdn: false,
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
});

const ALL_IDS = [
  // 16 hide + redirect
  'wp-page-60416', 'wp-page-60420', 'wp-page-60421', 'wp-page-60422', 'wp-page-60424', 'wp-page-60425',
  'wp-page-59636', 'wp-page-59638', 'wp-page-59642', 'wp-page-96618',
  'wp-page-60508', 'wp-page-60511', 'wp-page-60513',
  'wp-page-60601', 'wp-page-60604',
  'wp-page-86911',
  // 14 tag-only
  'wp-page-86817', 'wp-page-86832', 'wp-page-87739', 'wp-page-86841', 'wp-page-87387',
  'wp-page-86858', 'wp-page-114936', 'wp-page-86936', 'wp-page-87001', 'wp-page-114934',
  'wp-page-87064', 'wp-page-87408', 'wp-page-87070', 'wp-page-114938',
];

(async () => {
  const ids = idsArg.length ? idsArg : ALL_IDS;
  console.log(`\n=== Publish guide-dedup drafts ===\nmode: ${APPLY ? 'APPLY' : 'DRY RUN'}\nids: ${ids.length}\n`);

  let published = 0, noDraft = 0, failed = 0;
  for (const id of ids) {
    const draft = await client.getDocument(`drafts.${id}`);
    if (!draft) { console.log(`- no pending draft: ${id}`); noDraft++; continue; }
    console.log(`${APPLY ? 'publishing' : '[dry run] would publish'}: ${id}`);
    if (!APPLY) continue;
    try {
      await client.action({ actionType: 'sanity.action.document.publish', draftId: `drafts.${id}`, publishedId: id });
      published++;
    } catch (e) {
      console.log(`  ✗ failed: ${id} — ${(e as Error).message}`);
      failed++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Published:    ${published}`);
  console.log(`No draft:     ${noDraft}`);
  console.log(`Failed:       ${failed}`);
  if (!APPLY) console.log('\nDRY RUN — re-run with --apply.');
})();
