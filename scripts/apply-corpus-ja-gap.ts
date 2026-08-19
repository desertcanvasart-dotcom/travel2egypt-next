/**
 * Close the JA corpus gap — owner instruction 2026-08-19 ("All figures in
 * section A are correct. Add the translation if it is missing anywhere."):
 * the 4 documents found EN(+ES)-only in the fresh-instance census:
 *
 *   wp-page-77776                              travelTip "Distances Between Egyptian Cities"
 *   hotel.naama-bay-hotel-and-resort           hotel
 *   hotel.park-regency-sharm-el-sheikh-resort  hotel
 *   wp-page-131814                             hotel "Sandrose Hotel Bahariya"
 *
 * JA renderings were drafted by four parallel agents against block-keyed EN
 * dumps (city-name glossary enforced; Park Regency reuses the established
 * katakana name from orphan wp-page-63623, whose fate stays a separate
 * owner decision). This script VALIDATES before writing:
 *   - output block keys must match the EN source keys 1:1, in order;
 *   - numeric gate: the digit multiset of each JA block must equal its EN
 *     block's (after stripping thousands separators; EN number-words like
 *     "three"/"an hour and a half" are whitelisted per-block via NUMWORDS).
 * Any violation prints and blocks that DOC from applying (never partial).
 *
 * Writes: ja items appended to title/name, summary, slug (romaji), body.
 * Direct publish patch (owner pre-authorized). Backup of all 4 docs first.
 * Idempotent: docs already carrying ja body are skipped.
 *
 *   Dry run (default): npx tsx scripts/apply-corpus-ja-gap.ts
 *   Apply:             npx tsx scripts/apply-corpus-ja-gap.ts --apply
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const APPLY = process.argv.includes('--apply');
const SCRATCH =
  '/private/tmp/claude-501/-Users-islamhussein-t2e/1f3629dd-ca79-4b8a-b147-420943744503/scratchpad';

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

const JOBS = [
  // allowDraft: drafts.wp-page-77776 is a STALE July-4 draft translating the
  // OLD article (87-block JA vs the current 198-block EN, rewritten June 12)
  // plus an unshipped heroImage. Patching the published doc is safe (drafts
  // don't shadow the live site); the stale draft is flagged to the owner —
  // publishing it from Studio would REVERT the June rewrite.
  { id: 'wp-page-77776', file: 'tip-distances', titleField: 'title', allowDraft: true },
  { id: 'hotel.naama-bay-hotel-and-resort', file: 'hotel-naama', titleField: 'name', allowDraft: false },
  { id: 'hotel.park-regency-sharm-el-sheikh-resort', file: 'hotel-park-regency', titleField: 'name', allowDraft: false },
  // wp-page-131814 (Sandrose Bahariya) HELD 2026-08-19: the live EN body
  // carries wrong-hotel debris from ~block 20 on (Sonesta St. George Luxor —
  // Nile views, 280 rooms, Spazzo/Miyako/Serapis). Translating it would
  // propagate the bug ×3. Owner decides the strip first; the drafted JA of
  // the correct part is in scratchpad hotel-sandrose-ja.json.
] as const;

/** English number-words that legitimately become digits in JA. */
const NUMWORDS: Array<[RegExp, string[]]> = [
  [/\ban hour and a half\b/gi, ['1']],
  [/\bhalf an hour\b/gi, ['30']],
  [/\bone\b/gi, ['1']], [/\btwo\b/gi, ['2']], [/\bthree\b/gi, ['3']],
  [/\bfour\b/gi, ['4']], [/\bfive\b/gi, ['5']], [/\bsix\b/gi, ['6']],
  [/\bseven\b/gi, ['7']], [/\beight\b/gi, ['8']], [/\bnine\b/gi, ['9']],
  [/\bten\b/gi, ['10']], [/\beleven\b/gi, ['11']], [/\btwelve\b/gi, ['12']],
  [/\bfifteen\b/gi, ['15']], [/\btwenty\b/gi, ['20']], [/\bthirty\b/gi, ['30']],
  [/\bsingle\b/gi, ['1']], [/\btwice\b/gi, ['2']], [/\bhalf\b/gi, ['30']],
  // JA writes month names as digits (November → 11月)
  [/\bJanuary\b/g, ['1']], [/\bFebruary\b/g, ['2']], [/\bMarch\b/g, ['3']],
  [/\bApril\b/g, ['4']], [/\bMay\b/g, ['5']], [/\bJune\b/g, ['6']],
  [/\bJuly\b/g, ['7']], [/\bAugust\b/g, ['8']], [/\bSeptember\b/g, ['9']],
  [/\bOctober\b/g, ['10']], [/\bNovember\b/g, ['11']], [/\bDecember\b/g, ['12']],
  // more word-numbers found in this corpus
  [/\bthousand\b/gi, ['1000']], [/\ban hour\b/gi, ['1']], [/\bboth\b/gi, ['2']],
  [/\bthirteen\b/gi, ['13']], [/\bfourteen\b/gi, ['14']], [/\bsixteen\b/gi, ['16']],
  [/\bseventeen\b/gi, ['17']], [/\beighteen\b/gi, ['18']], [/\bnineteen\b/gi, ['19']],
  [/\bfirst\b/gi, ['1']], [/\bsecond\b/gi, ['2']], [/\bthird\b/gi, ['3']],
  [/\bfourth\b/gi, ['4']], [/\bfifth\b/gi, ['5']],
  // abbreviated months ("Nov 2020")
  [/\bJan\b/g, ['1']], [/\bFeb\b/g, ['2']], [/\bMar\b/g, ['3']], [/\bApr\b/g, ['4']],
  [/\bJun\b/g, ['6']], [/\bJul\b/g, ['7']], [/\bAug\b/g, ['8']], [/\bSept?\b/g, ['9']],
  [/\bOct\b/g, ['10']], [/\bNov\b/g, ['11']], [/\bDec\b/g, ['12']],
];

function digits(text: string): string[] {
  const t = text
    .replace(/(\d),(\d)/g, '$1$2')
    .replace(/(\d):00\b/g, '$1') // 4:00 am → JA 午前4時 drops the :00
    .replace(/(\d+)時間半/g, '$1.5時間'); // JA 1時間半 = EN 1.5 hours
  return (t.match(/\d+/g) ?? []).sort();
}
function digitsEnWithWords(text: string): { base: string[]; optional: string[] } {
  const base = digits(text);
  const optional: string[] = [];
  for (const [re, ds] of NUMWORDS) {
    const m = text.match(re);
    if (m) for (let i = 0; i < m.length; i++) optional.push(...ds);
  }
  return { base, optional: optional.sort() };
}

/** JA digits must equal EN digits plus any subset of the word-derived extras. */
function gate(enText: string, jaText: string): string | null {
  const ja = digits(jaText);
  const { base, optional } = digitsEnWithWords(enText);
  const jaCount = new Map<string, number>();
  for (const d of ja) jaCount.set(d, (jaCount.get(d) ?? 0) + 1);
  for (const d of base) {
    const n = jaCount.get(d) ?? 0;
    if (n === 0) return `missing ${d}`;
    jaCount.set(d, n - 1);
  }
  const optCount = new Map<string, number>();
  for (const d of optional) optCount.set(d, (optCount.get(d) ?? 0) + 1);
  for (const [d, n] of jaCount) {
    if (n <= 0) continue;
    if ((optCount.get(d) ?? 0) < n) return `extra ${d}×${n}`;
  }
  return null;
}

async function main() {
  console.log(`\n=== Corpus JA gap — ${APPLY ? 'APPLY' : 'DRY RUN'} ===\n`);
  const backupDir = path.join(process.cwd(), 'backups');
  mkdirSync(backupDir, { recursive: true });
  const backup = await c.fetch(`*[_id in $ids]`, { ids: JOBS.map((j) => j.id) });
  const backupPath = path.join(backupDir, 'corpus-ja-gap-rollback-2026-08-19.json');
  writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`Backup of ${backup.length} docs → ${path.relative(process.cwd(), backupPath)}\n`);

  let applied = 0;
  for (const job of JOBS) {
    const src = JSON.parse(readFileSync(`${SCRATCH}/${job.file}.json`, 'utf8'));
    const ja = JSON.parse(readFileSync(`${SCRATCH}/${job.file}-ja.json`, 'utf8'));
    const doc = await c.fetch(`*[_id==$id][0]`, { id: job.id });
    if (!doc) { console.log(`✗ SKIP ${job.id} — not found`); continue; }
    if ((doc.body ?? []).some((b: { _key: string }) => b._key === 'ja')) {
      console.log(`• DONE ${job.id} — already has ja body`); continue;
    }
    const draftExists = await c.fetch<boolean>(`defined(*[_id==$id][0]._id)`, { id: `drafts.${job.id}` });
    if (draftExists && !job.allowDraft) { console.log(`✗ SKIP ${job.id} — draft exists (clean-draft rule)`); continue; }
    if (draftExists && job.allowDraft) console.log(`  ⚠ ${job.id} has a pre-existing draft (documented stale; patching published directly)`);

    // 1. Structural parity.
    const srcKeys = src.blocks.map((b: any) => b.key).join('|');
    const jaKeys = (ja.blocks ?? []).map((b: any) => b.key).join('|');
    if (srcKeys !== jaKeys) { console.log(`✗ FAIL ${job.id} — block keys mismatch`); continue; }
    const jaTitle = ja.jaTitle ?? ja.jaName;
    if (!jaTitle || !ja.jaSummary || !ja.jaSlug) { console.log(`✗ FAIL ${job.id} — missing title/summary/slug`); continue; }

    // 2. Numeric gate per block (+ summary).
    let bad = 0;
    src.blocks.forEach((sb: any, i: number) => {
      const err = gate(sb.text, ja.blocks[i].text);
      if (err) { bad++; console.log(`   ⚠ ${job.id} block ${sb.key}: ${err}\n      EN: ${sb.text.slice(0, 90)}\n      JA: ${ja.blocks[i].text.slice(0, 90)}`); }
    });
    if (src.summary) {
      const err = gate(src.summary, ja.jaSummary);
      if (err) { bad++; console.log(`   ⚠ ${job.id} summary: ${err}`); }
    }
    if (bad > 0) { console.log(`✗ FAIL ${job.id} — ${bad} numeric-gate violations, not applied`); continue; }

    // 3. Build patch.
    const stem = job.file.replace(/[^a-z]/g, '').slice(0, 10);
    const enBlocks = (doc.body ?? []).find((b: any) => b._key === 'en')?.value ?? [];
    const styleByKey = new Map<string, { style: string; li?: string }>(
      enBlocks.map((b: any) => [b._key, { style: b.style ?? 'normal', li: b.listItem }])
    );
    const jaBody = ja.blocks.map((b: any, i: number) => {
      const st = styleByKey.get(b.key) ?? { style: 'normal' };
      return {
        _type: 'block',
        _key: `ja${stem}${i}`,
        style: st.style,
        ...(st.li ? { listItem: st.li } : {}),
        markDefs: [],
        children: [{ _type: 'span', _key: `ja${stem}${i}s`, marks: [], text: b.text }],
      };
    });
    const add = (arr: any[], value: unknown) => [...(arr ?? []), { _key: 'ja', value }];
    const patch: Record<string, unknown> = {
      [job.titleField]: add(doc[job.titleField], jaTitle),
      summary: add(doc.summary, ja.jaSummary),
      slug: add(doc.slug, { _type: 'slug', current: ja.jaSlug }),
      body: add(doc.body, jaBody),
    };
    console.log(`✓ ${APPLY ? 'APPLY' : 'WOULD APPLY'} ${job.id} — ${ja.blocks.length} blocks | ${job.titleField}: ${jaTitle} | slug: ${ja.jaSlug}`);
    if (APPLY) {
      await c.patch(job.id).set(patch).commit({ autoGenerateArrayKeys: false });
    }
    applied++;
  }
  console.log(`\n${APPLY ? 'Applied' : 'Dry run'}: ${applied}/${JOBS.length} docs.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
