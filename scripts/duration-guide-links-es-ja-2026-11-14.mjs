// Owner-approved 2026-11-14 (ES/JA duration hubs: "link the ES/JA itinerary guides").
// Links EXISTING words (no copy change) in the ES/JA itinerary guides to the hubs.
// node scripts/duration-guide-links-es-ja-2026-11-14.mjs [--apply]
import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { createClient } from '@sanity/client';

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN,
  useCdn: false,
});
const apply = process.argv.includes('--apply');
const H = (s) => `tourLanding.${s}`;
const [D4, D7, D10, D14] = ['4', '7', '10', '14'].map((n) => H(`${n}-days-egypt-tours`));
// [doc, block _key (null = first normal block containing phrase), exact phrase, hub]
const OPS = [
  ['wp-post-155189-es', '000000000007', 'cuatro días', D4],
  ['wp-post-144448-es', '00000000000b', 'siete días', D7],
  ['wp-post-144444-es', '000000000001', 'Diez días', D10],
  ['wp-post-144451-es', '000000000001', 'Dos semanas', D14],
  ['wp-post-144449-es', '000000000023', 'Cuatro días', D4],
  ['wp-post-144449-es', '000000000039', 'Siete días', D7],
  ['wp-post-144449-es', '000000000051', 'Diez días', D10],
  ['wp-post-144449-es', '000000000067', 'Quince días', D14],
  ['wp-post-249572-ja', '000000000007', '四日間', D4],
  ['wp-post-249659-ja', '00000000000b', '7日間', D7],
  ['wp-post-249309-ja', '000000000001', '10日間', D10],
  ['wp-post-249675-ja', '000000000003', '二週間', D14],
  ['wp-post-249691-ja', '00000000001f', '4日間', D4],
  ['wp-post-249691-ja', '000000000033', '7日間', D7],
  ['wp-post-249691-ja', '000000000047', '10日間', D10],
  ['wp-post-249691-ja', '00000000005b', '15日間', D14],
];
const key = () => randomBytes(6).toString('hex');
const docs = {};
for (const [id, bk, phrase, hub] of OPS) {
  if (!(await c.getDocument(hub))) throw new Error(`${hub} not published`);
  if (await c.getDocument(`drafts.${id}`)) throw new Error(`${id} has a draft`);
  const d = (docs[id] ??= await c.getDocument(id));
  if (JSON.stringify(d.body).includes(`"_ref":"${hub}"`)) { console.log(`${id}: already links ${hub}`); continue; }
  const bi = d.body.findIndex((b) => b._type === 'block' && b.style === 'normal' && (bk ? b._key === bk : true)
    && b.children.some((s) => !s.marks?.length && s.text.includes(phrase)));
  if (bi < 0) throw new Error(`${id}: no unmarked "${phrase}" in ${bk ?? 'any block'}`);
  const blk = d.body[bi];
  const si = blk.children.findIndex((s) => !s.marks?.length && s.text.includes(phrase));
  const sp = blk.children[si]; const at = sp.text.indexOf(phrase); const mk = key();
  const parts = [
    sp.text.slice(0, at) && { ...sp, _key: key(), text: sp.text.slice(0, at) },
    { _key: key(), _type: 'span', marks: [mk], text: phrase },
    sp.text.slice(at + phrase.length) && { ...sp, _key: key(), text: sp.text.slice(at + phrase.length) },
  ].filter(Boolean);
  const next = { ...blk, children: [...blk.children.slice(0, si), ...parts, ...blk.children.slice(si + 1)], markDefs: [...(blk.markDefs ?? []), { _key: mk, _type: 'internalLink', reference: { _type: 'reference', _ref: hub } }] };
  if (next.children.map((s) => s.text).join('') !== blk.children.map((s) => s.text).join('')) throw new Error('text drift');
  d.body[bi] = next;
  console.log(`${id} ${blk._key}: "${phrase}" → ${hub}`);
}
if (!apply) { console.log('dry run — pass --apply'); process.exit(0); }
const tx = c.transaction();
for (const [id, d] of Object.entries(docs)) tx.patch(id, (p) => p.set({ body: d.body }).ifRevisionId(d._rev));
console.log('committed', (await tx.commit()).transactionId);
