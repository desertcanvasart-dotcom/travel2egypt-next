/**
 * Promote in-body "The shape of the day" sections to the authored shapeOfDay
 * sidebar card across the PRIVATE day tours — same treatment the group corpus
 * got in scripts/group-tours-shape-promote.ts (owner 2026-07-22). Per locale
 * body: find the shape heading, consume its label rows (Where/Duration/
 * Character/Pace + ES/JA equivalents incl. the private-corpus variants ルート,
 * 一日の輪郭), build shapeOfDay{where,duration,character} from the values
 * VERBATIM (pace folds into character), remove heading+rows from the body,
 * keep all other prose.
 *
 * Price rows (From/Desde/目安) are REMOVED from the body per the owner's
 * price-only-on-the-card ruling, and their values are reported (+ written to
 * backups/private-shape-price-rows-<date>.csv) as candidates for the owner's
 * priceFrom backlog — never silently discarded, never auto-set.
 *
 * Duration labels/hours are NOT touched — masthead-vs-body mismatches are
 * REPORTED for the owner. Backups per doc; dry-run prints everything.
 *
 *   npx tsx scripts/private-tours-shape-promote.ts --dry-run | --commit
 */
import { writeFileSync } from 'node:fs';

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

const HEADINGS = [
  'The shape of the day',
  'La forma del día',
  'La forma del dia',
  'この一日の輪郭',
  'この一日のかたち',
  '一日のかたち',
  '一日の輪郭',
];

/** label prefix → shape slot ('pace' folds into character; 'drop' = discard;
 *  'price' = discard from body but report for the priceFrom backlog). */
const LABELS: Array<[RegExp, 'where' | 'duration' | 'character' | 'pace' | 'drop' | 'price']> = [
  [/^Where\s*·\s*/u, 'where'],
  [/^Ruta\s*·\s*/u, 'where'],
  [/^Dónde\s*·\s*/u, 'where'],
  [/^Donde\s*·\s*/u, 'where'],
  [/^どこへ\s*·\s*/u, 'where'],
  [/^行程\s*·\s*/u, 'where'],
  [/^ルート\s*·\s*/u, 'where'],
  [/^Duration\s*·\s*/u, 'duration'],
  [/^Duración\s*·\s*/u, 'duration'],
  [/^Duracion\s*·\s*/u, 'duration'],
  [/^所要時間\s*·\s*/u, 'duration'],
  [/^Character\s*·\s*/u, 'character'],
  [/^Carácter\s*·\s*/u, 'character'],
  [/^Caracter\s*·\s*/u, 'character'],
  [/^行程の性格\s*·\s*/u, 'character'],
  [/^性格\s*·\s*/u, 'character'],
  [/^Pace\s*·\s*/u, 'pace'],
  [/^Ritmo\s*·\s*/u, 'pace'],
  [/^ペース\s*·\s*/u, 'pace'],
  [/^Dato\s*·\s*/u, 'drop'], // Giza-ES-style "Field · Detail" pseudo-header
  [/^From\s*·\s*/u, 'price'],
  [/^Desde\s*·\s*/u, 'price'],
  [/^目安\s*[·—]\s*/u, 'price'],
];

type Block = { _key: string; children?: Array<{ text?: string }>; [k: string]: unknown };
type LocaleBody = { _key: string; value: Block[] };

const text = (b: Block) => (b.children ?? []).map((s) => s.text ?? '').join('');

function extract(lb: LocaleBody): {
  shape: Partial<Record<'where' | 'duration' | 'character', string>>;
  prices: string[];
} | null {
  const idx = lb.value.findIndex((b) => HEADINGS.includes(text(b).trim()));
  if (idx === -1) return null;
  const shape: Partial<Record<'where' | 'duration' | 'character', string>> = {};
  let pace: string | null = null;
  const prices: string[] = [];
  const removedKeys: string[] = [lb.value[idx]._key];
  for (let i = idx + 1; i < lb.value.length; i++) {
    const t = text(lb.value[i]).trim();
    const hit = LABELS.find(([re]) => re.test(t));
    if (!hit) break; // first non-label row ends the section; everything after stays
    const [re, slot] = hit;
    const value = t.replace(re, '').trim();
    if (slot === 'pace') pace = value;
    else if (slot === 'price') prices.push(value);
    else if (slot !== 'drop') shape[slot] = value;
    removedKeys.push(lb.value[i]._key);
  }
  if (pace) shape.character = shape.character ? `${shape.character} · ${pace}` : pace;
  if (!shape.where && !shape.duration && !shape.character) return null;
  lb.value = lb.value.filter((b) => !removedKeys.includes(b._key));
  return { shape, prices };
}

async function main() {
  const docs: Array<Record<string, unknown>> = await client.fetch(
    `*[_type == "tour" && type == "dayTour" && tourMode == "private" && !(_id in path("drafts.**"))] | order(_id asc)`,
  );
  console.log(`mode: ${dryRun ? 'DRY-RUN' : 'COMMIT'} — ${docs.length} tours\n`);
  const stamp = new Date().toISOString().slice(0, 10);
  let touched = 0;
  const mismatches: string[] = [];
  const priceRows: string[] = [];

  for (const doc of docs) {
    const id = doc._id as string;
    const hasShapeField = Object.values((doc.shapeOfDay as Record<string, Array<{ value?: string }>>) ?? {}).some(
      (arr) => Array.isArray(arr) && arr.some((v) => v?.value),
    );
    const body = structuredClone(doc.body) as LocaleBody[];
    const perLocale: Record<string, Partial<Record<string, string>>> = {};
    const perLocalePrices: Record<string, string[]> = {};

    for (const lb of body) {
      const res = extract(lb);
      if (res) {
        perLocale[lb._key] = res.shape;
        if (res.prices.length) perLocalePrices[lb._key] = res.prices;
      }
    }
    if (Object.keys(perLocale).length === 0) {
      console.log(`— ${id}: no in-body shape section, skipped`);
      continue;
    }
    if (hasShapeField) {
      console.log(`⚠ ${id}: shapeOfDay ALREADY SET and body section present — skipped, review by hand`);
      continue;
    }
    touched += 1;

    const slot = (name: 'where' | 'duration' | 'character') =>
      Object.entries(perLocale)
        .filter(([, s]) => s[name])
        .map(([loc, s]) => ({ _key: loc, _type: 'internationalizedArrayStringValue', value: s[name]! }));
    const shapeOfDay = { where: slot('where'), duration: slot('duration'), character: slot('character') };

    console.log(`■ ${id}`);
    for (const [loc, s] of Object.entries(perLocale)) {
      for (const [k, v] of Object.entries(s)) console.log(`   ${loc}.${k}: ${String(v).slice(0, 100)}`);
    }
    for (const [loc, ps] of Object.entries(perLocalePrices)) {
      for (const p of ps) {
        console.log(`   $ ${loc}.price-row REMOVED: ${p.slice(0, 80)}`);
        priceRows.push(`${id},${loc},"${p.replace(/"/g, '""')}"`);
      }
    }
    // Duration mismatch report (label vs authored body duration, EN only).
    const label = (doc.durationLabel as Array<{ _key: string; value: string }> | undefined)?.find((l) => l._key === 'en')?.value;
    const bodyDur = perLocale.en?.duration;
    if (label && bodyDur) {
      const n = (s: string) => (s.match(/(\d+(?:[–\-~〜]\d+)?)\s*(?:hrs|hours|h\b)/i) || [])[1];
      if (n(label) && n(bodyDur) && n(label) !== n(bodyDur)) {
        console.log(`   ⚠ DURATION MISMATCH: masthead "${label}" vs body "${bodyDur}"`);
        mismatches.push(`${id}: masthead "${label}" vs body "${bodyDur}"`);
      }
    }

    if (!dryRun) {
      writeFileSync(`backups/${id.replace(/[^a-z0-9-]/gi, '_')}-before-shape-promote-${stamp}.json`, JSON.stringify(doc, null, 2));
      await client.patch(id).set({ body, shapeOfDay }).commit();
      console.log('   patched ✓');
    }
    console.log('');
  }

  if (priceRows.length) {
    const csv = `id,locale,price_row\n${priceRows.join('\n')}\n`;
    if (!dryRun) writeFileSync(`backups/private-shape-price-rows-${stamp}.csv`, csv);
    console.log(`\nprice rows removed from bodies (${priceRows.length}) — priceFrom candidates for the owner${dryRun ? '' : ` → backups/private-shape-price-rows-${stamp}.csv`}`);
  }
  if (mismatches.length) {
    console.log(`\n⚠ duration mismatches for the owner (${mismatches.length}):`);
    for (const m of mismatches) console.log(`  ${m}`);
  }
  console.log(`\n${dryRun ? 'would touch' : 'patched'} ${touched} tour(s)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
