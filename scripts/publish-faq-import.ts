/**
 * Publish the FAQ-migration drafts — owner instruction 2026-08-19:
 * "publish the 5 categories and the safe drafts".
 *
 * Scope comes from the import ledger (migration/faq-import-created-2026-08-19.json):
 *  - the 5 draft faqCategory docs, published FIRST (entries reference them);
 *  - every draft faqEntry EXCEPT the 9 needsReview/VERIFY items, which stay
 *    drafts pending owner fact-check;
 *  - afterwards, the _weak flag is stripped from published entries' category
 *    refs (it existed only because the categories were draft-only at import).
 *
 * Publishing uses the Actions API (same effect as the Studio Publish button).
 * Idempotent: already-published docs are skipped.
 *
 *   Dry run (default): npx tsx scripts/publish-faq-import.ts
 *   Apply:             npx tsx scripts/publish-faq-import.ts --apply
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const APPLY = process.argv.includes('--apply');

const token =
  process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error('Missing SANITY_PRODUCTION_API_WRITE_TOKEN');
  process.exit(1);
}
const c = createClient({
  projectId: 'ufallvd2',
  dataset: 'production',
  apiVersion: '2024-12-01',
  token,
  useCdn: false,
});

async function publish(draftId: string) {
  const publishedId = draftId.replace(/^drafts\./, '');
  await c.action({
    actionType: 'sanity.action.document.publish',
    draftId,
    publishedId,
  } as never);
}

async function main() {
  console.log(`\n=== Publish FAQ import — ${APPLY ? 'APPLY' : 'DRY RUN'} ===\n`);
  const ledger = JSON.parse(
    readFileSync(path.join(process.cwd(), 'migration/faq-import-created-2026-08-19.json'), 'utf8')
  );
  // Hold list derived from the SOURCE, not the ledger — the ledger's
  // needsReview array was regenerated on a partial re-run and missed two
  // VERIFY items created in the first run (drone rules, alcohol rules).
  const src = JSON.parse(
    readFileSync(path.join(process.cwd(), 'migration/faq-migration-source-2026-08-19.json'), 'utf8')
  );
  const hold = new Set<string>();
  for (const w of src.waves)
    for (const cat of w.categories)
      for (const f of cat.faqs)
        if (f.needsReview) hold.add(`drafts.faq-entry-${f._key}`);
  const categories: string[] = ledger.created.filter((id: string) => id.includes('faq-category-'));
  const entries: string[] = ledger.created.filter(
    (id: string) => id.includes('faq-entry-') && !hold.has(id)
  );
  const heldCount = ledger.created.filter((id: string) => hold.has(id)).length;

  console.log(`categories: ${categories.length} | safe entries: ${entries.length} | held (VERIFY): ${heldCount}\n`);

  let published = 0;
  let skipped = 0;
  for (const group of [categories, entries]) {
    for (const draftId of group) {
      const publishedId = draftId.replace(/^drafts\./, '');
      const [draftExists, pubExists] = await Promise.all([
        c.fetch<boolean>(`defined(*[_id==$id][0]._id)`, { id: draftId }),
        c.fetch<boolean>(`defined(*[_id==$id][0]._id)`, { id: publishedId }),
      ]);
      if (!draftExists && pubExists) { console.log(`  • DONE  ${publishedId} already published`); skipped++; continue; }
      if (!draftExists) { console.log(`  ✗ SKIP  ${draftId} — draft missing`); skipped++; continue; }
      console.log(`  ✓ PUBLISH ${publishedId}`);
      if (APPLY) await publish(draftId);
      published++;
    }
  }

  // Strengthen refs: published entries whose category ref still carries _weak.
  const weak: string[] = await c.fetch(
    `*[_type=='faqEntry' && !(_id in path('drafts.**')) && category._weak == true]._id`
  );
  console.log(`\nweak category refs on published entries: ${weak.length}`);
  for (const id of weak) {
    console.log(`  ✓ STRENGTHEN ${id}`);
    if (APPLY) {
      const ref = await c.fetch<{ _ref: string }>(`*[_id==$id][0].category`, { id });
      await c.patch(id).set({ category: { _type: 'reference', _ref: ref._ref } }).commit();
    }
  }

  console.log(`\n${APPLY ? 'Applied' : 'Dry run'}: ${published} published, ${skipped} skipped, ${heldCount} held as drafts (VERIFY).`);
}

main().catch((err) => { console.error(err); process.exit(1); });
