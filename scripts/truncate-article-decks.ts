/**
 * Truncate `article.deck` in the migration-staging dataset.
 *
 * Context: the WP→Sanity importer stuffed full article body content into the
 * `deck` (standfirst) field for ~167 articles. The schema expects deck to be
 * one short sentence (~70-200 chars). On the /blog featured-lead card the
 * deck has no line-clamp, so the full body renders as ~1,500 words of italic
 * serif prose. This script truncates each long deck to its first sentence
 * (or first + second if first is very short), hard-capping at 280 chars.
 *
 * - Skips docs where deck is null/undefined or already < 300 chars.
 * - Preserves any existing migration.reviewFlag.
 * - Sets migration.reviewFlag = "deck-truncated" when the truncated result
 *   looks off (length < 20 or > 300 — only the latter would happen if a doc
 *   bypassed the hard-cap; tracked defensively).
 * - Batched via client.transaction() in groups of 50.
 */

import 'dotenv/config';
import { createClient } from '@sanity/client';

const REQUIRED_DATASET = 'migration-staging';
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
const dataset = process.env.SANITY_STAGING_DATASET ?? REQUIRED_DATASET;

if (!projectId) {
  console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID');
  process.exit(1);
}
if (!token) {
  console.error('Missing SANITY_STAGING_API_WRITE_TOKEN');
  process.exit(1);
}
if (dataset !== REQUIRED_DATASET) {
  console.error(
    `Refusing: dataset=${dataset} but this script only writes to ${REQUIRED_DATASET}.`
  );
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

const SHORT_THRESHOLD = 300;
const MIN_SENTENCE = 30;
const HARD_CAP = 280;
const FLAG_NAME = 'deck-truncated';

// Abbreviations that end in '.' but do not terminate a sentence.
const ABBREV = new Set([
  'dr', 'mr', 'mrs', 'ms', 'st', 'mt', 'sr', 'jr', 'vs', 'etc',
  'lt', 'col', 'gen', 'ft', 'inc', 'ltd', 'co', 'no', 'prof',
  'rev', 'hon', 'rep', 'sen', 'gov', 'pres', 'dept',
  'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec',
]);

function firstSentence(text: string): { sentence: string; hardCapped: boolean } {
  const re = /[.!?](\s+|$)/g;
  const ends: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const endIdx = m.index; // index of the . ! or ?
    // Walk back to extract the preceding word (letters only).
    let j = endIdx - 1;
    while (j >= 0 && /[A-Za-zÀ-ÿ]/.test(text[j])) j--;
    const word = text.slice(j + 1, endIdx).toLowerCase();
    if (ABBREV.has(word)) continue;
    ends.push(endIdx);
  }

  if (ends.length === 0) {
    // No sentence boundary at all — fall back to hard-cap.
    if (text.length > HARD_CAP) {
      return { sentence: text.slice(0, HARD_CAP).trimEnd() + '...', hardCapped: true };
    }
    return { sentence: text.trim(), hardCapped: false };
  }

  let cut = ends[0] + 1;
  let sentence = text.slice(0, cut).trim();

  if (sentence.length < MIN_SENTENCE && ends.length > 1) {
    cut = ends[1] + 1;
    sentence = text.slice(0, cut).trim();
  }

  if (sentence.length > HARD_CAP) {
    sentence = sentence.slice(0, HARD_CAP).trimEnd() + '...';
    return { sentence, hardCapped: true };
  }

  return { sentence, hardCapped: false };
}

interface ArticleDoc {
  _id: string;
  language?: string;
  deck?: string;
  migration?: { reviewFlag?: string };
}

const SAMPLE_IDS = new Set([
  'wp-post-243401-en',
  'wp-post-166926-en',
  'wp-post-144414-es',
]);

async function main() {
  console.log(`Dataset: ${dataset}`);
  console.log('Fetching all articles...');

  const docs: ArticleDoc[] = await client.fetch(
    `*[_type == "article" && !(_id in path("drafts.**"))]{
      _id, language, deck, migration
    }`
  );
  console.log(`Fetched ${docs.length} published articles\n`);

  let skippedNull = 0;
  let skippedShort = 0;
  let modified = 0;
  let flagged = 0;
  let flagSkippedExisting = 0;

  type Sample = {
    _id: string;
    language?: string;
    beforeLen: number;
    afterLen: number;
    beforePreview: string;
    after: string;
    flagged: boolean;
  };
  const samples: Sample[] = [];
  const flagDetail: Array<{ _id: string; newLen: number; reason: string }> = [];
  const truncatedHist: Record<string, number> = { lt100: 0, '100-200': 0, '200-280': 0, gt280: 0 };

  const BATCH = 50;
  const total = docs.length;
  let committed = 0;

  for (let i = 0; i < docs.length; i += BATCH) {
    const slice = docs.slice(i, i + BATCH);
    const tx = client.transaction();
    let hasOps = false;

    for (const d of slice) {
      if (!d.deck) {
        skippedNull++;
        continue;
      }
      if (d.deck.length < SHORT_THRESHOLD) {
        skippedShort++;
        continue;
      }

      const { sentence } = firstSentence(d.deck);
      const off = sentence.length < 20 || sentence.length > 300;
      const existingFlag = d.migration?.reviewFlag;
      const shouldFlag = off && !existingFlag;

      const setOps: Record<string, unknown> = { deck: sentence };
      if (shouldFlag) {
        setOps['migration.reviewFlag'] = FLAG_NAME;
      }

      tx.patch(d._id, (p) => p.set(setOps));
      hasOps = true;
      modified++;

      if (shouldFlag) {
        flagged++;
        flagDetail.push({
          _id: d._id,
          newLen: sentence.length,
          reason: sentence.length < 20 ? 'too-short' : 'too-long',
        });
      } else if (off && existingFlag) {
        flagSkippedExisting++;
      }

      if (sentence.length < 100) truncatedHist.lt100++;
      else if (sentence.length < 200) truncatedHist['100-200']++;
      else if (sentence.length <= 280) truncatedHist['200-280']++;
      else truncatedHist.gt280++;

      if (SAMPLE_IDS.has(d._id)) {
        samples.push({
          _id: d._id,
          language: d.language,
          beforeLen: d.deck.length,
          afterLen: sentence.length,
          beforePreview: d.deck.slice(0, 200),
          after: sentence,
          flagged: shouldFlag,
        });
      }
    }

    if (hasOps) {
      await tx.commit();
    }
    committed += slice.length;
    process.stdout.write(`\r  processed ${committed}/${total}`);
  }
  console.log('\n');

  console.log('=== Summary ===');
  console.log(`Total articles:                 ${docs.length}`);
  console.log(`Modified (deck truncated):      ${modified}`);
  console.log(`Skipped (null/undefined deck):  ${skippedNull}`);
  console.log(`Skipped (already short <300):   ${skippedShort}`);
  console.log(`Flagged "deck-truncated":       ${flagged}`);
  console.log(`Off but existing flag (kept):   ${flagSkippedExisting}`);
  console.log('\nTruncated-length distribution:');
  console.log(`  <100 chars:    ${truncatedHist.lt100}`);
  console.log(`  100-199 chars: ${truncatedHist['100-200']}`);
  console.log(`  200-280 chars: ${truncatedHist['200-280']}`);
  console.log(`  >280 chars:    ${truncatedHist.gt280}`);

  console.log('\n=== Samples (before/after) ===');
  for (const s of samples) {
    console.log(`\n[${s._id}] (${s.language})  ${s.beforeLen} → ${s.afterLen} chars${s.flagged ? '  [FLAGGED]' : ''}`);
    console.log(`  BEFORE (first 200): ${s.beforePreview}...`);
    console.log(`  AFTER:              ${s.after}`);
  }

  if (flagDetail.length > 0) {
    console.log('\n=== Flag detail ===');
    for (const f of flagDetail) {
      console.log(`  ${f._id}  len=${f.newLen}  reason=${f.reason}`);
    }
  }
}

main().catch((err) => {
  console.error('\nFAILED:', err);
  process.exit(1);
});
