/**
 * Luxor "Top Restaurants" (wp-page-60657) — STAGE B (EN only): replace the
 * summary/standfirst + 18 restaurant descriptions + 3 Additional-Dining
 * bullets + the Note with owner-authored LOCKED copy (verbatim from
 * luxor-restaurants-stage-b-copy-en.md). ES/JA are a later batch.
 *
 * Verbatim implementation — this script does not author or paraphrase; every
 * string below is transcribed from the owner artifact (hard-wraps unwrapped to
 * single spaces). Each target block is guarded by a known legacy fragment so
 * the script aborts rather than overwrite the wrong block.
 *
 * As-Sahaby Lane keeps the Stage-A internal Luxor Temple link, re-anchored onto
 * the "Luxor Temple" phrase in the new copy (same markDef, same target).
 * Additional-Dining bullet names are left UNBOLDED (flagged for owner).
 *
 * Gated: DRY RUN default; APPLY=1 stages drafts.<id> + snapshot. Never
 * publishes. Refuses if a draft already exists unless FORCE=1.
 *
 * Run (dry):    npx tsx scripts/luxor-restaurants-stage-b-en.ts
 * Run (stage):  APPLY=1 npx tsx scripts/luxor-restaurants-stage-b-en.ts
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { writeFileSync, mkdirSync } from 'node:fs';
loadEnv();

const ID = 'wp-page-60657';
const LUXOR_TEMPLE = 'guideArticle.luxor.the-luxor-temple';
const APPLY = process.env.APPLY === '1';
const FORCE = process.env.FORCE === '1';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
if (dataset !== 'production') throw new Error(`Refusing to run against "${dataset}".`);
const token =
  (APPLY ? process.env.SANITY_PRODUCTION_API_WRITE_TOKEN : undefined) ||
  process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
if (APPLY && !process.env.SANITY_PRODUCTION_API_WRITE_TOKEN) {
  console.error('APPLY=1 requires SANITY_PRODUCTION_API_WRITE_TOKEN'); process.exit(1);
}
const client = createClient({ projectId: 'ufallvd2', dataset, apiVersion: '2024-12-01', token, useCdn: false });

const STANDFIRST =
  'Luxor eats better than its reputation suggests. Alongside the temples runs a dining scene that spans Egyptian home cooking, the hotel restaurants of the old Nile establishments, and a surprising spread of international kitchens — Italian, Indian, Thai — on both banks of the river. This is the map of it, East Bank and West.';

// blockKey -> { guard: legacy substring that must be present, text: new prose }
const REPL: Record<string, { guard: string; text: string }> = {
  // East Bank
  '00000000000f': { guard: 'authentic Egyptian experience awaits at Sofra', text: 'Egyptian cooking in a restored old house, with a rooftop terrace and traditional decor. One of the longest-standing sit-down Egyptian restaurants on the East Bank.' },
  '000000000013': { guard: 'relaxed café known for its international dishes', text: 'A relaxed café with an international menu — pastas, grilled meats — and jazz on the sound system. Geared to casual, unhurried meals.' },
  // 00000000001a (As-Sahaby) handled separately — keeps the Luxor Temple link
  '000000000021': { guard: 'traditional Egyptian feast served in a communal', text: 'Traditional Egyptian food served communally. Dinner from 7 pm; the bar opens an hour earlier.' },
  '000000000028': { guard: 'Located at the Hilton Hotel', text: 'Inside the Hilton, an Asian kitchen spanning Indian, Thai and Chinese in a minimalist setting.' },
  '00000000002c': { guard: 'cozy, expat-favorite restaurant', text: "A small place serving British and European comfort food — a long-time favorite among Luxor's expat residents." },
  '000000000030': { guard: 'quaint bistro mixing Egyptian and European', text: 'A bistro in El Karnak mixing Egyptian and European dishes, with a rustic, provincial feel.' },
  '000000000034': { guard: 'family-friendly restaurant serves a mix', text: 'Egyptian and British classics in a family-friendly room; known for a Sunday roast-style lunch.' },
  '00000000003b': { guard: 'Situated in the Sheraton Hotel', text: 'The Italian restaurant inside the Sheraton, with a retro dining room and live music.' },
  '000000000042': { guard: 'Nestled inside the iconic Old Winter Palace', text: "The formal dining room of the Old Winter Palace, serving Mediterranean-French and Egyptian cuisine. A dress code applies, and it's the most formal option on this list." },
  '000000000046': { guard: 'Located in the St. Joseph area', text: 'Indian cooking with a few British dishes alongside, in the St. Joseph area.' },
  '00000000004d': { guard: 'local favorite for its roasted chicken', text: 'A no-frills local kitchen doing roast chicken, pizza and kushari, in generous portions.' },
  '000000000054': { guard: 'Specializing in kushari', text: 'A kushari specialist — the Egyptian street dish of rice, pasta, lentils and spiced tomato sauce. A quick, filling stop.' },
  // West Bank
  '00000000005d': { guard: 'Set in a romantic setting, Al-Moudira', text: 'Mediterranean and Lebanese cooking in the hotel of the same name, known for its setting. Reservations recommended.' },
  '000000000061': { guard: 'family-run eatery with an outdoor terrace', text: 'A family-run place with an outdoor terrace, serving Egyptian grills and pigeon. Homemade mango sorbet for dessert.' },
  '000000000068': { guard: 'Enjoy panoramic views of the Nile and Luxor Temple', text: 'Egyptian and international dishes with a terrace looking across the Nile toward Luxor Temple.' },
  '00000000006f': { guard: 'molokhiyya and mahshi kurumb', text: 'Egyptian home cooking — molokhiyya, mahshi — on the West Bank, with views across the river to the Luxor skyline.' },
  '000000000073': { guard: 'unique blend of Indian and Chinese cuisine', text: 'Indian and Chinese cooking in a laid-back room, with sheesha after dinner.' },
  // Additional Dining bullets (names left unbolded — flagged)
  '000000000078': { guard: 'Fruit & Vegetable Souq', text: 'Fruit & Vegetable Souq — the place to pick up fresh produce.' },
  '00000000007b': { guard: 'Arkwrights Gourmet Food', text: 'Arkwrights Gourmet Food — a shop for picnic supplies and imported goods.' },
  '000000000081': { guard: 'Cheap Eats', text: "Cheap Eats — Luxor's streets carry plenty of bakeries and small local eateries for budget meals." },
  // Note
  '000000000088': { guard: 'do not serve alcohol', text: "A few practical things worth knowing: many Luxor restaurants don't serve alcohol or take credit cards, so carry some cash. Dining hours generally run from around 9 am to midnight." },
};

const AS_SAHABY_KEY = '00000000001a';
const AS_SAHABY = { pre: 'A lively spot near ', link: 'Luxor Temple', post: ' serving Egyptian dishes alongside pizzas and salads, with alfresco tables overlooking the street.' };

const blockText = (b: any) => (b.children ?? []).map((s: any) => s.text ?? '').join('');
const span = (key: string, text: string, marks: string[] = []) => ({ _type: 'span', _key: key, text, marks });
// Source-standard typography: every straight single quote in this EN copy is a
// possessive/contraction apostrophe -> curly right single quote, matching the
// retained h3 headings (Gerda's Garden) and site typography. No opening single
// quotes occur in the copy, so a blanket replace is correct here.
const curly = (s: string) => s.replace(/'/g, '’');

async function main() {
  const pub: any = await client.getDocument(ID);
  if (!pub) throw new Error('no published doc');
  const draft: any = await client.getDocument(`drafts.${ID}`);
  if (draft && !FORCE) { console.error(`drafts.${ID} exists — refusing (clean-draft rule). FORCE=1 to override.`); process.exit(1); }

  const doc = JSON.parse(JSON.stringify(pub));
  const fail: string[] = []; const log: string[] = [];

  // summary.en
  const sEn = (doc.summary ?? []).find((e: any) => e._key === 'en');
  if (!sEn) fail.push('summary.en missing');
  else { log.push(`SUMMARY.en replaced (${(sEn.value || '').length} -> ${STANDFIRST.length} chars)`); sEn.value = curly(STANDFIRST); }

  const en = (doc.body ?? []).find((e: any) => e._key === 'en');
  if (!en) throw new Error('no en body');
  const byKey = new Map<string, any>(en.value.map((b: any) => [b._key, b]));

  // plain replacements
  for (const [key, { guard, text }] of Object.entries(REPL)) {
    const b = byKey.get(key);
    if (!b) { fail.push(`block ${key} MISSING`); continue; }
    const cur = blockText(b);
    if (!cur.includes(guard)) { fail.push(`block ${key} guard fail (want "${guard}", got "${cur.slice(0, 40)}…")`); continue; }
    b.children = [span(`${key}s0`, curly(text))];
    b.markDefs = [];
    log.push(`REPLACE ${key} (${cur.length} -> ${text.length})`);
  }

  // As-Sahaby: keep the internal Luxor Temple link, re-anchored
  {
    const b = byKey.get(AS_SAHABY_KEY);
    if (!b) fail.push(`As-Sahaby ${AS_SAHABY_KEY} MISSING`);
    else {
      const cur = blockText(b);
      if (!cur.includes('near Luxor Temple')) fail.push(`As-Sahaby guard fail`);
      const md = (b.markDefs ?? []).find((m: any) => m._type === 'internalLink' && m.reference?._ref === LUXOR_TEMPLE);
      if (!md) fail.push(`As-Sahaby internal Luxor Temple markDef missing (Stage A not applied?)`);
      else {
        b.markDefs = [md];
        b.children = [
          span(`${AS_SAHABY_KEY}s0`, curly(AS_SAHABY.pre)),
          span(`${AS_SAHABY_KEY}s1`, curly(AS_SAHABY.link), [md._key]),
          span(`${AS_SAHABY_KEY}s2`, curly(AS_SAHABY.post)),
        ];
        log.push(`REPLACE ${AS_SAHABY_KEY} (As-Sahaby) + kept int link on "Luxor Temple"`);
      }
    }
  }

  console.log(`\n=== ${APPLY ? 'APPLY (staging draft)' : 'DRY RUN'} — ${ID} STAGE B (EN) ===`);
  console.log(log.join('\n'));
  if (fail.length) { console.error(`\n✗ ${fail.length} GUARD FAILURES — aborting:\n  ` + fail.join('\n  ')); process.exit(1); }
  console.log(`\nTotal EN edits: summary + ${Object.keys(REPL).length} blocks + As-Sahaby = ${Object.keys(REPL).length + 2}`);

  if (!APPLY) { console.log('\nDRY RUN — set APPLY=1 to stage the draft.'); return; }
  mkdirSync('backups', { recursive: true });
  writeFileSync('backups/luxor-restaurants-stage-b-en-rollback.json', JSON.stringify(pub, null, 2));
  await client.createOrReplace({ ...doc, _id: `drafts.${ID}` });
  console.log(`\n✓ staged drafts.${ID}. Snapshot: backups/luxor-restaurants-stage-b-en-rollback.json (NOT published)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
