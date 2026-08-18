/**
 * Aswan hero: alt + caption describe an image that is not there.
 *
 * The live hero (image-d1ea845c…-3000x1320, "nile-in-aswan.jpg") is a
 * river-level view of the Nile with black granite outcrops and a green fringe
 * on the far bank below bare desert dunes. The stored alt/caption describe an
 * AERIAL view with "a riverside hotel on a green island" and "feluccas under
 * sail" — none of which appear in the image.
 *
 * Rewrites alt + caption EN/ES/JA to describe the actual image.
 * Entry _type is "object", matching all 138 city hero alt entries in the
 * corpus (not internationalizedArrayStringValue).
 *
 * Published doc ONLY — the drafts.wp-page-58758 copy is deliberately left
 * untouched (owner decision, 2026-07-30). It still carries the old alt, so
 * publishing that draft would reintroduce this bug.
 *
 * Dry-run by default; pass --commit to write.
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();

const COMMIT = process.argv.includes('--commit');
const DOC_ID = 'wp-page-58758'; // aswan, published
const EXPECTED_ASSET = 'image-d1ea845cbe3493814f75636a596941e1cccb88d2-3000x1320-jpg';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

type Tri = [string, string, string]; // [en, es, ja]
const L = (v: Tri) => [
  { _key: 'en', _type: 'object', value: v[0] },
  { _key: 'es', _type: 'object', value: v[1] },
  { _key: 'ja', _type: 'object', value: v[2] },
];

const alt: Tri = [
  `The Nile at Aswan, with black granite outcrops and a fringe of green along the far bank below bare desert dunes`,
  `El Nilo a su paso por Asuán, con afloramientos de granito negro y una franja verde en la orilla opuesta, bajo dunas desnudas del desierto`,
  `アスワンのナイル川。対岸には黒い花崗岩の岩塊と緑の木立が連なり、その上に裸の砂丘が広がる`,
];

const caption: Tri = [
  `At Aswan the desert comes down to the water — dune and granite along the far bank.`,
  `En Asuán el desierto llega hasta el agua: duna y granito en la orilla opuesta.`,
  `アスワンでは砂漠が水際まで迫る——対岸に連なる砂丘と黒い花崗岩。`,
];

async function main() {
  console.log(`fix-aswan-hero-alt — ${COMMIT ? 'COMMIT' : 'DRY RUN'} — dataset=${client.config().dataset}\n`);

  const doc: any = await client.getDocument(DOC_ID);
  if (!doc) throw new Error(`${DOC_ID} not found`);

  const ref = doc.heroImage?.asset?._ref;
  if (ref !== EXPECTED_ASSET) {
    throw new Error(`hero asset changed since this fix was written.\n  expected ${EXPECTED_ASSET}\n  found    ${ref}\nRe-view the image before rewriting its alt.`);
  }

  const show = (label: string, arr: any[]) =>
    (arr ?? []).forEach((e: any) => console.log(`    ${label} ${e._key}: ${e.value}`));

  console.log('  BEFORE');
  show('alt    ', doc.heroImage?.alt);
  show('caption', doc.heroImage?.caption);
  console.log('\n  AFTER');
  show('alt    ', L(alt));
  show('caption', L(caption));

  if (COMMIT) {
    await client
      .patch(DOC_ID, { set: { 'heroImage.alt': L(alt), 'heroImage.caption': L(caption) } })
      .commit({ autoGenerateArrayKeys: false });
    console.log('\n✓ patched (published only; drafts.' + DOC_ID + ' untouched)');
  } else {
    console.log('\nRe-run with --commit to write.');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
