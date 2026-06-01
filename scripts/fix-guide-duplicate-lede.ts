/**
 * Remove the duplicated opening sentence from guideArticle bodies.
 *
 * Context (editorial review, 2026-06-01): on ~606 published guideArticle
 * pages the italic lede under the title (the `summary` field) is a verbatim
 * copy of the FIRST body block. The detail page renders `summary` as the lede
 * and then the body repeats it word-for-word.
 *
 * `summary` and `body` are independent, per-locale fields:
 *   - summary: internationalizedArrayText  -> [{_key:'en', value:'...'}, ...]
 *   - body:    localized portable text     -> [{_key:'en', value:[blocks]}, ...]
 *
 * `summary` is still wanted as the listing/card teaser, so the fix is to keep
 * `summary` and DROP the duplicated first body block (per locale). The body
 * then flows from its second block, with the summary serving as the sole lede.
 *
 * Matching rule (conservative): for each locale we only drop body[0] when its
 * plain text EQUALS summary[locale] after trimming. Cases where summary merely
 * *starts with* body[0] (mostly legacy off-brand docs whose summary mashes the
 * title + intro) are NOT touched — they are reported for separate handling.
 *
 * Usage:
 *   tsx scripts/fix-guide-duplicate-lede.ts            # dry-run (default)
 *   tsx scripts/fix-guide-duplicate-lede.ts --commit   # write changes
 */

import 'dotenv/config';
import { createClient } from '@sanity/client';
import { writeFileSync } from 'node:fs';

const REQUIRED_DATASET = 'migration-staging';
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
const dataset = process.env.NEXT_PUBLIC_SANITY_STAGING_DATASET ?? REQUIRED_DATASET;
const COMMIT = process.argv.includes('--commit');

if (!projectId) {
  console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID');
  process.exit(1);
}
if (!token) {
  console.error('Missing SANITY_STAGING_API_WRITE_TOKEN');
  process.exit(1);
}
if (dataset !== REQUIRED_DATASET) {
  console.error(`Refusing: dataset=${dataset} but this script only writes to ${REQUIRED_DATASET}.`);
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2024-10-01',
  useCdn: false,
  perspective: 'raw',
});

const LOCALES = ['en', 'es', 'ja'] as const;
type Locale = (typeof LOCALES)[number];

interface Span { _type: string; text?: string }
interface Block { _key: string; _type: string; style?: string; children?: Span[] }
interface LocaleArrEntry<T> { _key: string; value: T }
interface GuideDoc {
  _id: string;
  summary?: LocaleArrEntry<string>[];
  body?: LocaleArrEntry<Block[]>[];
}

/** Plain text of a portable-text block (all spans joined). */
function blockText(block: Block | undefined): string | null {
  if (!block || block._type !== 'block' || !Array.isArray(block.children)) return null;
  return block.children
    .filter((c) => c._type === 'span' && typeof c.text === 'string')
    .map((c) => c.text as string)
    .join('');
}

function getLocaleValue<T>(arr: LocaleArrEntry<T>[] | undefined, loc: string): T | undefined {
  return arr?.find((e) => e._key === loc)?.value;
}

async function main() {
  console.log(`Dataset: ${dataset}   Mode: ${COMMIT ? 'COMMIT' : 'DRY-RUN'}\n`);

  const docs: GuideDoc[] = await client.fetch(
    `*[_type == "guideArticle" && !(_id in path("drafts.**"))]{ _id, summary, body }`
  );
  console.log(`Fetched ${docs.length} published guideArticle docs\n`);

  let docsModified = 0;
  let blocksRemoved = 0;
  const perLocale: Record<Locale, number> = { en: 0, es: 0, ja: 0 };
  const startsWithNotEqual: Array<{ _id: string; locale: string; summaryLen: number; bodyLen: number }> = [];
  const samples: Array<{ _id: string; locale: string; removed: string }> = [];

  const BATCH = 50;
  let committed = 0;
  let modifiedQueue: Array<{ _id: string; body: LocaleArrEntry<Block[]>[] }> = [];

  async function flush() {
    if (!modifiedQueue.length) return;
    if (COMMIT) {
      const tx = client.transaction();
      for (const m of modifiedQueue) tx.patch(m._id, (p) => p.set({ body: m.body }));
      await tx.commit();
    }
    modifiedQueue = [];
  }

  for (const d of docs) {
    if (!d.body) continue;
    let changed = false;
    const newBody = d.body.map((entry) => ({ ...entry }));

    for (const loc of LOCALES) {
      const summary = getLocaleValue(d.summary, loc);
      if (!summary || !summary.trim()) continue;
      const entryIdx = newBody.findIndex((e) => e._key === loc);
      if (entryIdx === -1) continue;
      const blocks = newBody[entryIdx].value;
      if (!Array.isArray(blocks) || blocks.length === 0) continue;

      const first = blockText(blocks[0]);
      if (first == null) continue;

      const a = first.trim();
      const b = summary.trim();
      if (a === b) {
        // Exact duplicate — drop the first body block for this locale.
        // Guard: never empty a body (keep the lede if it is the only block).
        if (blocks.length <= 1) {
          startsWithNotEqual.push({ _id: d._id, locale: loc, summaryLen: b.length, bodyLen: a.length });
          continue;
        }
        newBody[entryIdx] = { ...newBody[entryIdx], value: blocks.slice(1) };
        changed = true;
        blocksRemoved++;
        perLocale[loc]++;
        if (samples.length < 6 && loc === 'en') {
          samples.push({ _id: d._id, locale: loc, removed: a.slice(0, 120) });
        }
      } else if (b.startsWith(a) || a.startsWith(b)) {
        // Partial overlap — report, do not touch.
        startsWithNotEqual.push({ _id: d._id, locale: loc, summaryLen: b.length, bodyLen: a.length });
      }
    }

    if (changed) {
      docsModified++;
      modifiedQueue.push({ _id: d._id, body: newBody });
      if (modifiedQueue.length >= BATCH) {
        await flush();
      }
      committed++;
      if (committed % 50 === 0) process.stdout.write(`\r  processed ${committed}`);
    }
  }
  await flush();
  console.log('\n');

  console.log('=== Summary ===');
  console.log(`Docs modified:            ${docsModified}`);
  console.log(`Body blocks removed:      ${blocksRemoved}`);
  console.log(`  en / es / ja:           ${perLocale.en} / ${perLocale.es} / ${perLocale.ja}`);
  console.log(`Partial-overlap (skipped, reported): ${startsWithNotEqual.length}`);

  console.log('\n=== Samples (en, removed first block) ===');
  for (const s of samples) console.log(`  [${s._id}] "${s.removed}..."`);

  if (startsWithNotEqual.length) {
    const reportPath = 'migration/guide-lede-partial-overlap.csv';
    const csv = ['doc_id,locale,summary_len,body0_len']
      .concat(startsWithNotEqual.map((s) => `${s._id},${s.locale},${s.summaryLen},${s.bodyLen}`))
      .join('\n');
    writeFileSync(reportPath, csv + '\n');
    console.log(`\n=== Partial-overlap docs (NOT modified) → ${reportPath} (${startsWithNotEqual.length}) ===`);
    console.log('  (mostly es/ja where summary is a truncated copy of body[0]; dropping would lose content)');
  }

  if (!COMMIT) console.log('\nDRY-RUN only. Re-run with --commit to write.');
}

main().catch((err) => {
  console.error('\nFAILED:', err);
  process.exit(1);
});
