/**
 * Apply the drafted trilingual concierge notes to the 98 private day tours.
 * Drafts live in scripts/private-tours-concierge-notes.json (slug-keyed,
 * drafted 2026-07-22, PENDING OWNER APPROVAL — do not run --commit before the
 * owner signs off). Only tours whose conciergeNote is currently empty are
 * patched; a tour that gained a note since drafting is reported and skipped.
 *
 *   npx tsx scripts/private-tours-concierge-notes.ts --dry-run | --commit
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();

const dryRun = !process.argv.includes('--commit');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: 'production',
  apiVersion: '2024-12-01',
  useCdn: false,
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  perspective: 'raw',
});

type Draft = { slug: string; en: string; es: string; ja: string };

const i18n = (d: Draft) => [
  { _key: 'en', _type: 'internationalizedArrayStringValue', value: d.en },
  { _key: 'es', _type: 'internationalizedArrayStringValue', value: d.es },
  { _key: 'ja', _type: 'internationalizedArrayStringValue', value: d.ja },
];

async function main() {
  const drafts: Draft[] = JSON.parse(
    readFileSync(join(__dirname, 'private-tours-concierge-notes.json'), 'utf8'),
  );
  const docs: Array<{ _id: string; slug?: string; conciergeNote?: Array<{ value?: string }> }> =
    await client.fetch(
      `*[_type == "tour" && type == "dayTour" && tourMode == "private" && !(_id in path("drafts.**"))]{
        _id, "slug": slug[_key=="en"][0].value.current, conciergeNote
      }`,
    );
  const bySlug = new Map(docs.map((d) => [d.slug, d]));
  console.log(`mode: ${dryRun ? 'DRY-RUN' : 'COMMIT'} — ${drafts.length} drafts, ${docs.length} tours\n`);
  const stamp = new Date().toISOString().slice(0, 10);
  let patched = 0;

  for (const draft of drafts) {
    const doc = bySlug.get(draft.slug);
    if (!doc) {
      console.log(`⚠ ${draft.slug}: no matching published tour — skipped`);
      continue;
    }
    if ((doc.conciergeNote ?? []).some((v) => v.value)) {
      console.log(`— ${draft.slug}: conciergeNote already set — skipped`);
      continue;
    }
    patched += 1;
    console.log(`■ ${draft.slug}\n   ${draft.en.slice(0, 90)}…`);
    if (!dryRun) {
      writeFileSync(
        `backups/${doc._id.replace(/[^a-z0-9-]/gi, '_')}-before-concierge-note-${stamp}.json`,
        JSON.stringify({ _id: doc._id, conciergeNote: doc.conciergeNote ?? null }, null, 2),
      );
      await client.patch(doc._id).set({ conciergeNote: i18n(draft) }).commit();
      console.log('   patched ✓');
    }
  }
  console.log(`\n${dryRun ? 'would patch' : 'patched'} ${patched} tour(s)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
