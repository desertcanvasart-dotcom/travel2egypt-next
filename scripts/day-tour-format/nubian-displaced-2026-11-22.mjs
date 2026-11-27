/** Nubian Museum page: the displaced-people figure is "more than 100,000" (owner, 22 Nov); the reconstructed tomb facade and the
 *  fortification wall are confirmed in the museum's current displays, so those essay sentences stay as they are.
 *    node --env-file=<.env> scripts/day-tour-format/nubian-displaced-2026-11-22.mjs [--apply] */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';
const ID = 'wp-page-88599';
const apply = process.argv.includes('--apply');
const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN });
const doc = await c.getDocument(ID);
if (await c.getDocument(`drafts.${ID}`)) throw new Error('draft exists');
const FIX = { en: ['relocation of roughly 100,000 people', 'relocation of more than 100,000 people'], es: ['realojo de unas 100.000 personas', 'realojo de más de 100.000 personas'], ja: ['およそ10万人の人々を', '10万人を超える人々を'] };
let n = 0;
const body = doc.body.map((row) => {
  const [f, r] = FIX[row._key] ?? [];
  if (!f) return row;
  return { ...row, value: row.value.map((b) => ({ ...b, children: (b.children ?? []).map((ch) => { if (ch.text?.includes(f)) { n++; return { ...ch, text: ch.text.replace(f, r) }; } return ch; }) })) };
});
console.log(`replaced in ${n} language(s)`);
if (!apply) process.exit(0);
if (n !== 3 && !doc.body.some((r) => JSON.stringify(r).includes('more than 100,000'))) throw new Error('expected 3');
await writeRollback(c, [ID], 'displaced');
await c.patch(ID).set({ body }).commit();
console.log('applied');
