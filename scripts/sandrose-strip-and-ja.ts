/**
 * Sandrose Hotel Bahariya (wp-page-131814) — strip the wrong-hotel debris,
 * then apply the parked Japanese (owner instruction 2026-08-19: "Strip the
 * Sonesta blocks and apply the Sandrose Japanese").
 *
 * The live body carried a Sonesta St. George LUXOR template from the
 * "Hotel Facilities" heading onward (Nile location, 280 rooms, on-site
 * bank, Spazzo/Miyako/Serapis outlets) — WP-import debris, present in both
 * EN (blocks 19–70 of 71) and ES (blocks 19–68 of 69; same boundary,
 * different _keys). Kept: blocks 0–18 — the genuine Sandrose content
 * (facts, About, and the Bahariya location/distance rows).
 *
 * Then adds ja: katakana name, clean summary, romaji slug, and the 19
 * kept blocks' JA renderings (numeric-gated against their EN pairs).
 *
 * Write mechanics per house rules: ALL unsets in ONE combined .unset()
 * call in its own commit (chained unsets replace each other; set+unset in
 * one patch drops the unset), then the ja sets in a second commit.
 * Backup first. Idempotent.
 *
 *   Dry run (default): npx tsx scripts/sandrose-strip-and-ja.ts
 *   Apply:             npx tsx scripts/sandrose-strip-and-ja.ts --apply
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const APPLY = process.argv.includes('--apply');
const ID = 'wp-page-131814';
const KEEP_COUNT = 19; // blocks 0–18 in BOTH locales; debris starts at the
// "Hotel Facilities" / "Instalaciones hoteleras" h3 (index 19) in each.
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

/** Sentinels that must be true of the first stripped block per locale. */
const STRIP_SENTINEL: Record<string, RegExp> = {
  en: /^Hotel Facilities$/,
  es: /^Instalaciones hoteleras$/,
};
/** Wrong-hotel markers that must NOT survive the strip. */
const DEBRIS = /Sonesta|Spazzo|Miyako|Serapis|280 (Rooms|habitaciones)/i;

const text = (b: any) => (b.children ?? []).map((s: any) => s.text ?? '').join('').trim();
const digits = (t: string) =>
  (t.replace(/(\d),(\d)/g, '$1$2').match(/\d+/g) ?? []).sort().join(' ');

async function main() {
  console.log(`\n=== Sandrose strip + JA — ${APPLY ? 'APPLY' : 'DRY RUN'} ===\n`);
  const doc = await c.getDocument(ID);
  if (!doc) throw new Error('doc not found');
  const draftExists = await c.fetch<boolean>(`defined(*[_id=='drafts.${ID}'][0]._id)`);
  if (draftExists) throw new Error('draft exists — clean-draft rule');

  const backupDir = path.join(process.cwd(), 'backups');
  mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `sandrose-strip-rollback-2026-08-19.json`);
  writeFileSync(backupPath, JSON.stringify(doc, null, 2));
  console.log(`Backup → ${path.relative(process.cwd(), backupPath)}\n`);

  const alreadyJa = (doc.body ?? []).some((b: { _key: string }) => b._key === 'ja');

  // 1. Collect debris paths per locale, with sentinel guards.
  const unsetPaths: string[] = [];
  for (const loc of ['en', 'es']) {
    const blocks = (doc.body ?? []).find((x: any) => x._key === loc)?.value ?? [];
    if (blocks.length <= KEEP_COUNT) { console.log(`  • ${loc}: already stripped (${blocks.length} blocks)`); continue; }
    const first = text(blocks[KEEP_COUNT]);
    if (!STRIP_SENTINEL[loc].test(first)) throw new Error(`${loc} sentinel mismatch at index ${KEEP_COUNT}: "${first}"`);
    const kept = blocks.slice(0, KEEP_COUNT);
    if (kept.some((b: any) => DEBRIS.test(text(b)))) throw new Error(`${loc}: debris marker inside KEPT range`);
    const debris = blocks.slice(KEEP_COUNT);
    if (!debris.some((b: any) => DEBRIS.test(text(b)))) throw new Error(`${loc}: no debris marker in strip range — wrong boundary?`);
    console.log(`  ✓ ${loc}: strip ${debris.length} blocks (keep ${kept.length}) — from "${first}"`);
    unsetPaths.push(...debris.map((b: any) => `body[_key=="${loc}"].value[_key=="${b._key}"]`));
  }

  // 2. JA payload from the parked agent output — kept keys only, gated.
  const src = JSON.parse(readFileSync(`${SCRATCH}/hotel-sandrose.json`, 'utf8'));
  const ja = JSON.parse(readFileSync(`${SCRATCH}/hotel-sandrose-ja.json`, 'utf8'));
  const keptSrc = src.blocks.slice(0, KEEP_COUNT);
  const jaByKey = new Map<string, string>(ja.blocks.map((b: any) => [b.key, b.text]));
  let bad = 0;
  for (const sb of keptSrc) {
    const jt = jaByKey.get(sb.key);
    if (jt === undefined) throw new Error(`ja missing block ${sb.key}`);
    if (digits(sb.text) !== digits(jt)) {
      bad++;
      console.log(`   ⚠ numeric mismatch ${sb.key}: EN[${digits(sb.text)}] JA[${digits(jt)}]\n      EN: ${sb.text.slice(0, 70)}\n      JA: ${jt.slice(0, 70)}`);
    }
  }
  if (bad > 0) throw new Error(`${bad} numeric-gate violations on kept blocks`);
  console.log(`  ✓ ja: ${keptSrc.length} kept blocks pass the numeric gate`);

  const enStyles = new Map<string, string>(
    ((doc.body ?? []).find((x: any) => x._key === 'en')?.value ?? []).map((b: any) => [b._key, b.style ?? 'normal'])
  );
  const jaBody = keptSrc.map((sb: any, i: number) => ({
    _type: 'block',
    _key: `jasandrose${i}`,
    style: enStyles.get(sb.key) ?? 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: `jasandrose${i}s`, marks: [], text: jaByKey.get(sb.key)! }],
  }));
  const add = (arr: any[], value: unknown) => [...(arr ?? []), { _key: 'ja', value }];

  console.log(`\n  plan: unset ${unsetPaths.length} debris blocks → then set ja (name: ${ja.jaName} | slug: ${ja.jaSlug} | ${jaBody.length} blocks${alreadyJa ? ' — SKIP, ja exists' : ''})`);

  if (APPLY) {
    if (unsetPaths.length) {
      await c.patch(ID).unset(unsetPaths).commit(); // ONE combined unset, own commit
      console.log('  committed strip');
    }
    if (!alreadyJa) {
      const fresh = await c.getDocument(ID); // re-read post-strip
      await c
        .patch(ID)
        .set({
          name: add(fresh!.name, ja.jaName),
          summary: add(fresh!.summary, ja.jaSummary),
          slug: add(fresh!.slug, { _type: 'slug', current: ja.jaSlug }),
          body: add(fresh!.body, jaBody),
        })
        .commit({ autoGenerateArrayKeys: false });
      console.log('  committed ja');
    }
    const check = await c.fetch(
      `*[_id=='${ID}'][0]{'en': count(body[_key=='en'][0].value), 'es': count(body[_key=='es'][0].value), 'ja': count(body[_key=='ja'][0].value), 'debris': length(pt::text(body[_key=='en'][0].value)) }`
    );
    const enText = await c.fetch(`pt::text(*[_id=='${ID}'][0].body[_key=='en'][0].value)`);
    console.log(`  post: en ${check.en} / es ${check.es} / ja ${check.ja} blocks | debris markers left: ${DEBRIS.test(enText)}`);
  }
  console.log(`\n${APPLY ? 'Applied.' : 'Dry run complete. Re-run with --apply.'}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
