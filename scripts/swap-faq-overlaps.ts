/**
 * FAQ overlap swap — owner decision 2026-08-19: for the 10 UNFLAGGED overlap
 * questions, replace the live EN answer with the owner's audited migration
 * rewrite and attach the owner-supplied ES/JA renderings (which were written
 * against the migration text — this swap is what makes them attachable).
 *
 * The live EN QUESTION wording is kept (it drives the /faq anchor ids);
 * migration ES/JA question strings are added beside it.
 *
 * The 6 VERIFY/REWRITE-flagged overlaps (visa, budget, tipping, SIM, time
 * zone, safety) are NOT here — they wait for the fact-check pass, like the
 * 9 held drafts.
 *
 * Guards: doc must exist published, have NO draft (clean-draft rule), and
 * not already carry an `es` answer (idempotency). Full backups → backups/.
 * Writes a ledger (migration/faq-overlap-swap-2026-08-19.json) that the
 * mention-linker's FAQ scope picks up for the follow-up weave.
 *
 *   Dry run (default): npx tsx scripts/swap-faq-overlaps.ts
 *   Apply:             npx tsx scripts/swap-faq-overlaps.ts --apply
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const APPLY = process.argv.includes('--apply');
const STAMP = '2026-08-19';

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

/** live published id → migration _key (the 10 clean, unflagged overlaps) */
const SWAPS: Record<string, string> = {
  'faq-entry-when-is-the-best-time-to-visit-egypt': 'when-is-the-best-time-to-visit-egypt',
  'faq-entry-what-currency-does-egypt-use': 'what-currency-is-used-in-egypt',
  'faq-entry-are-credit-cards-accepted-everywhere': 'can-i-use-credit-cards-throughout-egypt',
  'faq-entry-what-vaccinations-do-i-need-for-egypt': 'what-vaccinations-do-i-need-for-egypt',
  'faq-entry-can-i-drink-the-tap-water-in-egypt': 'can-i-drink-the-tap-water-in-egypt',
  'faq-entry-how-do-i-avoid-tourist-scams': 'how-do-i-avoid-tourist-scams-in-egypt',
  'faq-entry-are-there-restrictions-on-photography': 'are-there-restrictions-on-photography',
  'faq-entry-whats-the-dress-code': 'whats-the-dress-code-for-mosques-and-religious-sites',
  'faq-entry-how-widely-is-english-spoken': 'is-english-widely-spoken-in-egypt',
  'faq-entry-what-are-some-useful-arabic-phrases': 'what-arabic-phrases-are-worth-knowing',
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
      _key: `sw${key.slice(0, 18)}${locale}b${i}`,
      style: 'normal',
      markDefs: [],
      children: [
        { _type: 'span', _key: `sw${key.slice(0, 18)}${locale}s${i}`, marks: [], text: p },
      ],
    }));
}

async function main() {
  console.log(`\n=== FAQ overlap swap ×10 — ${APPLY ? 'APPLY' : 'DRY RUN'} ===\n`);
  const en = loadByKey('faq-migration-source-2026-08-19.json');
  const es = loadByKey('faq-migration-source-es-2026-08-19.json');
  const ja = loadByKey('faq-migration-source-ja-2026-08-19.json');

  const backupDir = path.join(process.cwd(), 'backups');
  mkdirSync(backupDir, { recursive: true });
  const ids = Object.keys(SWAPS);
  const backup = await c.fetch(`*[_id in $ids]`, { ids });
  const backupPath = path.join(backupDir, `faq-overlap-swap-rollback-${STAMP}.json`);
  writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`Backup of ${backup.length} docs → ${path.relative(process.cwd(), backupPath)}\n`);

  let swapped = 0;
  let already = 0;
  let skipped = 0;
  const done: string[] = [];

  for (const [liveId, key] of Object.entries(SWAPS)) {
    const [doc, draft] = await Promise.all([
      c.fetch(`*[_id==$id][0]{question, answer}`, { id: liveId }),
      c.fetch(`defined(*[_id==$id][0]._id)`, { id: `drafts.${liveId}` }),
    ]);
    if (!doc) { console.log(`  ✗ SKIP ${liveId} — not found`); skipped++; continue; }
    if (draft) { console.log(`  ✗ SKIP ${liveId} — draft exists (clean-draft rule)`); skipped++; continue; }
    if ((doc.answer ?? []).some((a: { _key: string }) => a._key === 'es')) {
      already++; done.push(liveId); continue;
    }
    if (!en[key] || !es[key] || !ja[key]) { console.log(`  ✗ SKIP ${liveId} — source missing for ${key}`); skipped++; continue; }

    const enItem = (doc.answer ?? []).find((a: { _key: string }) => a._key === 'en');
    if (!enItem) { console.log(`  ✗ SKIP ${liveId} — no EN answer`); skipped++; continue; }

    const question = [
      ...doc.question,
      { _key: 'es', value: es[key].question },
      { _key: 'ja', value: ja[key].question },
    ];
    const answer = [
      { _key: 'en', value: answerBlocks(key, 'en', en[key].answer) },
      { _key: 'es', value: answerBlocks(key, 'es', es[key].answer) },
      { _key: 'ja', value: answerBlocks(key, 'ja', ja[key].answer) },
    ];
    console.log(`  ✓ SWAP ${liveId}  ← ${key}`);
    if (APPLY) {
      await c.patch(liveId).set({ question, answer }).commit({ autoGenerateArrayKeys: false });
    }
    swapped++;
    done.push(liveId);
  }

  if (APPLY) {
    const ledgerPath = path.join(process.cwd(), `migration/faq-overlap-swap-${STAMP}.json`);
    writeFileSync(ledgerPath, JSON.stringify({ swapped: done, rollback: path.relative(process.cwd(), backupPath) }, null, 2));
    console.log(`\nLedger → ${path.relative(process.cwd(), ledgerPath)}`);
  }
  console.log(`\n${APPLY ? 'Applied' : 'Dry run'}: ${swapped} swapped, ${already} already done, ${skipped} skipped.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
