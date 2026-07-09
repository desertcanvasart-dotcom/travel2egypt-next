/**
 * Backfill the `summary` field (EN) on the 13 guideArticle docs confirmed to
 * be genuinely unique content — NOT orphaned WP-migration duplicates. Of the
 * original 47 docs missing a summary, 34 turned out to be duplicates of an
 * already-complete counterpart doc (same disease as the tour-dedup project,
 * never run for guideArticle content) — those are a separate unpublish+
 * redirect follow-up, NOT handled here.
 *
 * ⚠️ CLAUDE-DRAFTED, staged as Sanity DRAFTS — this script never publishes.
 * Each summary was written from the doc's actual body content, matching the
 * site's existing one-sentence declarative voice (see examples like
 * "Rosetta is usually better visited than slept in."). Needs owner review
 * before publish, same pattern as the JA legal / climate / price-manifest
 * drafts this session.
 *
 * Idempotent guard: aborts per-doc if a summary already exists on the draft.
 * DRY RUN by default; --apply stages drafts. Backs up prior state to backups/.
 * Run: npx tsx scripts/backfill-guide-summaries-2026-07-09.ts [--apply]
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';
import { writeFileSync, mkdirSync } from 'node:fs';

const APPLY = process.argv.includes('--apply');
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
if (dataset !== 'production') throw new Error(`Refusing to run against "${dataset}".`);
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset,
  apiVersion: '2024-12-01', useCdn: false,
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
});

const rows: { id: string; summary: string }[] = [
  { id: 'guideArticle.alexandria.the-national-museum', summary: "Alexandria's National Museum condenses four different eras of the city — Pharaonic, Greco-Roman, Coptic, Islamic — into one restored consulate building." },
  { id: 'guideArticle.cairo.the-hanging-church', summary: 'The Hanging Church takes its name literally — built over the old Roman Water Gate of Babylon, with a floor panel that still looks down on it.' },
  { id: 'guideArticle.saint-catherine.mosque-of-al-hakim-be-amr-allah', summary: "The Mosque of Al-Hakim sits just steps from St. Catherine's Monastery — a nine-century-old arrangement, not a modern one." },
  { id: 'wp-page-59655', summary: 'The 310-kilometre road into Dakhla from Farafra changes character twice before you arrive.' },
  { id: 'wp-page-61927', summary: "Tropitel Naama Bay is a four-star resort built around Sharm's original tourist strip, with its own dive centre on site." },
  { id: 'wp-page-155767', summary: 'Fayoum packs fossil valleys, salt lakes, flamingos, and a 40-million-year-old sea into one short escape from Cairo.' },
  { id: 'wp-page-145987', summary: 'This is the one Sharm El Sheikh excursion that leaves Egypt entirely — Jerusalem, the Dead Sea, and Bethlehem in a single long day.' },
  { id: 'wp-page-72292', summary: "Alexandria's attractions span Ptolemaic tombs, Roman theatres, and a city that sank into the sea — each with its own ticket." },
  { id: 'wp-page-72314', summary: 'Nowhere in Aswan costs more to see than Abu Simbel, and nothing else here comes close.' },
  { id: 'wp-page-72327', summary: "Giza's fees rise with proximity — seeing the plateau costs one thing, climbing inside a pyramid costs another." },
  { id: 'wp-page-72336', summary: "Sohag's ticket prices are unusually gentle for a governorate that includes Abydos." },
  { id: 'wp-page-72343', summary: "Luxor's ticket list runs the length of the West Bank and back, from a modest tomb to the Valley of the Kings' priciest chamber." },
  { id: 'wp-page-72364', summary: "Al Minya and Asyut's sites carry some of Upper Egypt's most modest entrance fees." },
];

function mkSummaryField(text: string) {
  return [{ _key: 'en', _type: 'internationalizedArrayTextValue', value: text }];
}

(async () => {
  const backup: Record<string, unknown> = {};
  let staged = 0, skipExisting = 0, notFound = 0;
  for (const r of rows) {
    const pub = await client.getDocument(r.id);
    if (!pub) { console.log(`✗ not found: ${r.id}`); notFound++; continue; }
    const draftId = `drafts.${r.id}`;
    const existing = await client.getDocument(draftId);
    const base: any = existing ?? pub;
    const currentSummary = (base.summary ?? []).find((s: any) => s._key === 'en')?.value;
    if (currentSummary) {
      console.log(`⚠ skip (already has summary): ${r.id}`);
      skipExisting++;
      continue;
    }
    backup[r.id] = { hadDraft: !!existing, summaryBefore: base.summary ?? null };
    console.log(`${APPLY ? 'staging' : '[dry run] would stage'}: ${r.id} -> "${r.summary}"`);
    if (!APPLY) continue;
    const doc = JSON.parse(JSON.stringify(base));
    doc._id = draftId;
    doc.summary = [...(doc.summary ?? []).filter((s: any) => s._key !== 'en'), { _key: 'en', _type: 'internationalizedArrayTextValue', value: r.summary }];
    await client.createOrReplace(doc);
    staged++;
  }
  console.log(`\nrows=${rows.length} staged=${staged} skipExisting=${skipExisting} notFound=${notFound}`);
  if (!APPLY) { console.log('DRY RUN — re-run with --apply'); return; }
  mkdirSync('backups', { recursive: true });
  const bpath = 'backups/guide-summaries-backfill-rollback-2026-07-09.json';
  writeFileSync(bpath, JSON.stringify(backup, null, 2));
  console.log(`backup → ${bpath}`);
  console.log(`✓ staged ${staged} drafts — NOT published. Review in Studio, then publish.`);
})();
