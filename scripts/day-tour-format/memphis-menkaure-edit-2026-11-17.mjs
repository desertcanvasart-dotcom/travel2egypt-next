/**
 * Giza, Memphis & Saqqara: the essay no longer says Menkaure is the pyramid
 * you enter. Owner approved the proposed edit on 17 Nov (standing rule:
 * inside Khafre or Menkaure, subject to site rules). EN as proposed; ES/JA
 * built from the locked ES/JA panel wording. One text run per language.
 *
 *   node --env-file=<.env> scripts/day-tour-format/memphis-menkaure-edit-2026-11-17.mjs [--apply]
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';

const ID = 'tour.private-tour-pyramids-of-giza-sphinx-memphis-and-saqqara';
const EDITS = {
  en: ['000000000017', 'dates to around 2510 BC and is the one you enter:', 'dates to around 2510 BC. Khafre or Menkaure is the one you enter, depending on site rules on the day:'],
  es: ['000000000019', 'data de en torno a 2510 a. C. y es la que se puede penetrar:', 'data de en torno a 2510 a. C. Kefrén o Micerinos es la que se visita por dentro, según las normas del recinto ese día:'],
  ja: ['00000000001d', 'は紀元前2510年ごろのもので、内部に入れるのはこれです——', 'は紀元前2510年ごろのものです。内部に入るのはカフラー王またはメンカウラー王のピラミッドで、当日の遺跡の規則によります——'],
};
const apply = process.argv.includes('--apply');
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const doc = await client.getDocument(ID);
const body = doc.body.map((row) => {
  const e = EDITS[row._key];
  if (!e) return row;
  const [key, find, repl] = e;
  return {
    ...row,
    value: row.value.map((b) => {
      if (b._key !== key) return b;
      const i = b.children.findIndex((c) => c.text.includes(find));
      if (i < 0) throw new Error(`${row._key} ${key}: text not found in one run`);
      const children = b.children.map((c, j) => (j === i ? { ...c, text: c.text.replace(find, repl) } : c));
      console.log(`${row._key}: …${children[i].text.slice(0, 220)}…`);
      return { ...b, children };
    }),
  };
});
if (apply) {
  await writeRollback(client, [ID], 'before-menkaure-edit');
  await client.patch(ID).set({ body }).commit();
  console.log(`APPLIED to production ${ID}`);
} else console.log('dry run');
