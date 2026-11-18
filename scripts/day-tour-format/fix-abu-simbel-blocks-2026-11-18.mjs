/**
 * Abu Simbel by Car: one block figure across the site (owner's plane-tour open item 3,
 * 18 Nov: "one figure across the site, matching the car tour"). The car tour's essay said
 * "approximately two thousand blocks"; the two temples were cut into about 1,040 blocks
 * (Great Temple c. 807, Small Temple c. 235), so both pages now say "more than a thousand",
 * as the plane tour already did. EN / ES / JA, the one sentence each.
 *
 *   node --env-file=<.env> scripts/day-tour-format/fix-abu-simbel-blocks-2026-11-18.mjs           # dry run
 *   node --env-file=<.env> scripts/day-tour-format/fix-abu-simbel-blocks-2026-11-18.mjs --apply
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';

const DOC_ID = 'tour.private-tour-abu-simble-by-bus-from-aswan';
const FIX = {
  en: ['000000000029', 'approximately two thousand blocks', 'more than a thousand blocks'],
  es: ['00000000002b', 'aproximadamente dos mil bloques', 'más de mil bloques'],
  ja: ['00000000001b', '約二千個のブロック', '千個以上のブロック'],
};
const apply = process.argv.includes('--apply');
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });
const doc = await client.getDocument(DOC_ID);
if (!doc) throw new Error(`${DOC_ID} not found`);
const body = doc.body.map((row) => {
  const f = FIX[row._key];
  if (!f) return row;
  const [key, find, repl] = f;
  return {
    ...row,
    value: row.value.map((b) => {
      if (b._key !== key) return b;
      if (b.children.length !== 1) throw new Error(`${row._key} ${key}: expected one text run`);
      const t = b.children[0].text;
      if (!t.includes(find)) { if (t.includes(repl)) return b; throw new Error(`${row._key} ${key}: "${find}" not found`); }
      console.log(`${row._key} ${key}: "${find}" → "${repl}"`);
      return { ...b, children: [{ ...b.children[0], text: t.replace(find, repl) }] };
    }),
  };
});
if (apply) {
  await writeRollback(client, [DOC_ID], 'before-abu-simbel-blocks');
  await client.patch(DOC_ID).set({ body }).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else console.log('dry run (pass --apply to write production)');
