/**
 * Apply the owner's Giza ruling to the private day tours whose masthead
 * durationLabel disagrees with the authored duration now living on the
 * shapeOfDay card (promoted from the body by private-tours-shape-promote.ts):
 * the AUTHORED copy wins. For each mismatched tour:
 *
 *   - durationHours := lower bound of the authored EN hour range (drives the
 *     Half/Full/Extended length facet: <=5 half, >=11 extended, else full)
 *   - durationLabel := house-style label carrying the authored range, all three
 *     locales (EN "Half day · ~5–6 hrs", ES "Medio día · ~5–6 h",
 *     JA "半日・約5〜6時間"; bare "~2–3 hrs" style when the lower bound <= 3,
 *     matching the existing show/transfer labels)
 *
 * Precedent: scripts/fix-nubian-duration.mts (owner's Giza ruling, 3a8b58e).
 * Tours whose label already agrees with the authored range are untouched.
 *
 *   npx tsx scripts/private-tours-duration-reconcile.ts --dry-run | --commit
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

type I18nString = Array<{ _key: string; _type?: string; value?: string }>;

const NUM = '(?:\\d+(?:\\.\\d+)?)';
const WORD: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
};
const WORD_ALT = Object.keys(WORD).join('|');
// Digit form: "≈9–10 hours", "2–2.5 hours", "18 hours". Word form: "eight to
// nine hours", "twelve to fourteen hours", "Eight-hour". Minutes never match.
const DIGIT_RE = new RegExp(`(${NUM})(?:\\s*[–\\-~〜]\\s*(${NUM}))?\\s*(?:hrs|hours|h\\b)`, 'ig');
const WORD_RE = new RegExp(`\\b(${WORD_ALT})(?:[ -]to[ -](${WORD_ALT}))?[ -]hours?\\b`, 'ig');
// A figure is a LEG, not the day's total, when its immediate context says so.
const LEG_RE = /each way|round-trip|of driv|driving|drive time/i;
const DAYS_RE = /\btwo days\b|\bovernight\b/i;

/** First hour figure in the authored EN duration that plausibly means the
 *  day's total — decimal bounds rounded half-up for the label. */
function parseHours(authored: string): { lo: number; hi: number | null } | null {
  const cands: Array<{ index: number; len: number; lo: number; hi: number | null }> = [];
  for (const m of authored.matchAll(DIGIT_RE)) {
    cands.push({ index: m.index!, len: m[0].length, lo: parseFloat(m[1]), hi: m[2] ? parseFloat(m[2]) : null });
  }
  for (const m of authored.matchAll(WORD_RE)) {
    cands.push({ index: m.index!, len: m[0].length, lo: WORD[m[1].toLowerCase()], hi: m[2] ? WORD[m[2].toLowerCase()] : null });
  }
  cands.sort((a, b) => a.index - b.index);
  for (const c of cands) {
    const ctx = authored.slice(Math.max(0, c.index - 18), c.index + c.len + 16);
    if (LEG_RE.test(ctx)) continue;
    const lo = Math.round(c.lo);
    const hi = c.hi === null ? null : Math.round(c.hi);
    return { lo, hi: hi !== null && hi !== lo ? hi : null };
  }
  return null;
}

const BUCKET_WORD: Record<'half' | 'full' | 'extended', { en: string; es: string; ja: string }> = {
  half: { en: 'Half day', es: 'Medio día', ja: '半日' },
  full: { en: 'Full day', es: 'Día completo', ja: '終日' },
  extended: { en: 'Extended', es: 'Jornada larga', ja: '延長' },
};

function labels(lo: number, hi: number | null) {
  const bucket: 'half' | 'full' | 'extended' = lo <= 5 ? 'half' : lo >= 11 ? 'extended' : 'full';
  const range = hi ? `${lo}–${hi}` : `${lo}`;
  const rangeJa = hi ? `${lo}〜${hi}` : `${lo}`;
  const bare = lo <= 3; // house style: short shows/transfers carry no bucket word
  const w = BUCKET_WORD[bucket];
  return {
    bucket,
    en: bare ? `~${range} hrs` : `${w.en} · ~${range} hrs`,
    es: bare ? `~${range} h` : `${w.es} · ~${range} h`,
    ja: bare ? `約${rangeJa}時間` : `${w.ja}・約${rangeJa}時間`,
  };
}

const i18n = (en: string, es: string, ja: string): I18nString => [
  { _key: 'en', _type: 'internationalizedArrayStringValue', value: en },
  { _key: 'es', _type: 'internationalizedArrayStringValue', value: es },
  { _key: 'ja', _type: 'internationalizedArrayStringValue', value: ja },
];

async function main() {
  const docs: Array<{
    _id: string;
    durationHours?: number;
    durationLabel?: I18nString;
    shapeOfDay?: { duration?: I18nString };
  }> = await client.fetch(
    `*[_type == "tour" && type == "dayTour" && tourMode == "private" && !(_id in path("drafts.**")) && defined(shapeOfDay.duration)]{
      _id, durationHours, durationLabel, shapeOfDay { duration }
    } | order(_id asc)`,
  );
  console.log(`mode: ${dryRun ? 'DRY-RUN' : 'COMMIT'} — ${docs.length} private tours with an authored card duration\n`);
  const stamp = new Date().toISOString().slice(0, 10);
  let touched = 0;
  const skippedNoParse: string[] = [];

  for (const doc of docs) {
    const authored = doc.shapeOfDay?.duration?.find((v) => v._key === 'en')?.value;
    const label = doc.durationLabel?.find((v) => v._key === 'en')?.value;
    if (!authored) continue;
    if (DAYS_RE.test(authored)) {
      skippedNoParse.push(`${doc._id}: authored "${authored}" is a multi-DAY duration — label "${label ?? '—'}" left for the owner`);
      continue;
    }
    const parsed = parseHours(authored);
    if (!parsed) {
      skippedNoParse.push(`${doc._id}: authored "${authored}" has no usable total-hours figure — label "${label ?? '—'}" left as is`);
      continue;
    }
    const { lo, hi } = parsed;
    const next = labels(lo, hi);
    if (label === next.en) continue; // masthead already agrees with the authored copy
    const oldBucket = typeof doc.durationHours === 'number'
      ? (doc.durationHours <= 5 ? 'half' : doc.durationHours >= 11 ? 'extended' : 'full')
      : '—';
    touched += 1;

    console.log(`■ ${doc._id}`);
    console.log(`   authored: ${authored}`);
    console.log(`   label:    "${label ?? '—'}" → "${next.en}" / "${next.es}" / "${next.ja}"`);
    console.log(`   hours:    ${doc.durationHours ?? '—'} → ${lo}${oldBucket !== next.bucket ? `   (facet ${oldBucket} → ${next.bucket})` : ''}`);

    if (!dryRun) {
      writeFileSync(
        `backups/${doc._id.replace(/[^a-z0-9-]/gi, '_')}-before-duration-reconcile-${stamp}.json`,
        JSON.stringify({ _id: doc._id, durationHours: doc.durationHours, durationLabel: doc.durationLabel }, null, 2),
      );
      await client.patch(doc._id).set({ durationHours: lo, durationLabel: i18n(next.en, next.es, next.ja) }).commit();
      console.log('   patched ✓');
    }
    console.log('');
  }

  if (skippedNoParse.length) {
    console.log(`\nno hour figure in authored duration — left untouched (${skippedNoParse.length}):`);
    for (const s of skippedNoParse) console.log(`  ${s}`);
  }
  console.log(`\n${dryRun ? 'would touch' : 'patched'} ${touched} tour(s)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
