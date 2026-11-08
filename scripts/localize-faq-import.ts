/**
 * FAQ migration — ES/JA localization join (owner-supplied, 2026-08-19).
 *
 * Sources (copied into migration/ for the audit trail):
 *   migration/faq-migration-source-es-2026-08-19.json
 *   migration/faq-migration-source-ja-2026-08-19.json
 * Both carry the SAME `_key`s as the EN source — a clean join. Numeric-claim
 * gate ran before this script (see session log): all figure diffs are EN
 * word-numbers vs digit rendering, locale separators, or status-flagged
 * market-specific divergences (ES plug/currency notes, JA voltage + Japan
 * time-difference paragraphs) — no factual drift.
 *
 * What it does, per imported question (the 55 created by the import):
 *   - appends {_key:'es'} / {_key:'ja'} items to `question` and `answer`
 *     (EN items preserved verbatim; whole-array set via raw client with
 *     autoGenerateArrayKeys:false so keys survive);
 *   - published entries (46) are patched in place; the 9 VERIFY holds are
 *     patched on their drafts.* ids so they're trilingual when fact-checked.
 * Plus the 5 new categories get ES/JA `name` values (their slug field is
 * not routed — /faq is a single static route — so slugs stay EN).
 *
 * The 16 overlap questions are NOT touched: their live EN answers differ
 * from the migration text, and ES/JA here are renderings of the MIGRATION
 * answers — attaching them would break the one-corpus rule. They activate
 * only if the owner swaps the EN answer to the migration text.
 *
 * Idempotent: a doc whose question already has an `es` item is skipped.
 *
 *   Dry run (default): npx tsx scripts/localize-faq-import.ts
 *   Apply:             npx tsx scripts/localize-faq-import.ts --apply
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

const CATEGORY_NAMES: Record<string, { es: string; ja: string }> = {
  'faq-category-getting-around': { es: 'Desplazamientos', ja: '移動手段' },
  'faq-category-museums': { es: 'Museos', ja: '博物館' },
  'faq-category-ancient-sites': { es: 'Yacimientos', ja: '遺跡' },
  'faq-category-red-sea-and-outdoors': { es: 'Mar Rojo y naturaleza', ja: '紅海とアウトドア' },
  'faq-category-food-markets-and-living-culture': {
    es: 'Gastronomía, mercados y vida cotidiana',
    ja: '食・市場・暮らしの文化',
  },
};

function loadByKey(file: string) {
  const d = JSON.parse(readFileSync(path.join(process.cwd(), 'migration', file), 'utf8'));
  const out: Record<string, { question: string; answer: string }> = {};
  for (const w of d.waves)
    for (const cat of w.categories)
      for (const f of cat.faqs) out[f._key] = { question: f.question, answer: f.answer };
  return out;
}

function answerBlocks(key: string, locale: string, answer: string) {
  return answer
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p, i) => ({
      _type: 'block',
      _key: `${key.slice(0, 20)}${locale}b${i}`,
      style: 'normal',
      markDefs: [],
      children: [
        { _type: 'span', _key: `${key.slice(0, 20)}${locale}s${i}`, marks: [], text: p },
      ],
    }));
}

async function main() {
  console.log(`\n=== FAQ ES/JA localization — ${APPLY ? 'APPLY' : 'DRY RUN'} ===\n`);
  const es = loadByKey('faq-migration-source-es-2026-08-19.json');
  const ja = loadByKey('faq-migration-source-ja-2026-08-19.json');
  const ledger = JSON.parse(
    readFileSync(path.join(process.cwd(), 'migration/faq-import-created-2026-08-19.json'), 'utf8')
  );

  let patched = 0;
  let already = 0;
  let skipped = 0;

  // 1. Entries created by the import (46 published in place, 9 on drafts).
  const held = new Set<string>(ledger.publishState.heldAsDrafts);
  for (const createdId of ledger.created as string[]) {
    if (!createdId.includes('faq-entry-')) continue;
    const baseId = createdId.replace(/^drafts\./, '');
    const key = baseId.replace('faq-entry-', '');
    const docId = held.has(baseId) ? `drafts.${baseId}` : baseId;
    const esF = es[key];
    const jaF = ja[key];
    if (!esF || !jaF) { console.log(`  ✗ SKIP ${docId} — missing es/ja source`); skipped++; continue; }

    const doc = await c.fetch(`*[_id==$id][0]{question, answer}`, { id: docId });
    if (!doc) { console.log(`  ✗ SKIP ${docId} — doc not found`); skipped++; continue; }
    if ((doc.question ?? []).some((q: { _key: string }) => q._key === 'es')) {
      already++; continue;
    }
    const question = [
      ...doc.question,
      { _key: 'es', value: esF.question },
      { _key: 'ja', value: jaF.question },
    ];
    const answer = [
      ...doc.answer,
      { _key: 'es', value: answerBlocks(key, 'es', esF.answer) },
      { _key: 'ja', value: answerBlocks(key, 'ja', jaF.answer) },
    ];
    console.log(`  ✓ LOCALIZE ${docId}`);
    if (APPLY) {
      await c.patch(docId).set({ question, answer }).commit({ autoGenerateArrayKeys: false });
    }
    patched++;
  }

  // 2. Category names.
  console.log('\n— Categories —');
  for (const [id, names] of Object.entries(CATEGORY_NAMES)) {
    const doc = await c.fetch(`*[_id==$id][0]{name}`, { id });
    if (!doc) { console.log(`  ✗ SKIP ${id} — not found`); skipped++; continue; }
    if ((doc.name ?? []).some((n: { _key: string }) => n._key === 'es')) { already++; continue; }
    const name = [
      ...doc.name,
      { _key: 'es', value: names.es },
      { _key: 'ja', value: names.ja },
    ];
    console.log(`  ✓ LOCALIZE ${id} — "${names.es}" / "${names.ja}"`);
    if (APPLY) {
      await c.patch(id).set({ name }).commit({ autoGenerateArrayKeys: false });
    }
    patched++;
  }

  console.log(`\n${APPLY ? 'Applied' : 'Dry run'}: ${patched} docs to localize, ${already} already localized, ${skipped} skipped.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
