// Owner-locked 2026-11-14 (duration-hubs-2026-11-14-en.md: "each guide links back").
// Links EXISTING words in the itinerary guides to the duration hubs — no copy change.
// node scripts/duration-guide-links-2026-11-14.mjs [--apply]   (run after the hubs are published)
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
// [doc, block-text prefix, phrase, hub]
const OPS = [
  ['wp-post-152503-en', 'Even so, many people come to Egypt with only four days', 'four days', H('4-days-egypt-tours')],
  ['wp-post-136621-en', null, 'seven days', H('7-days-egypt-tours')],
  ['wp-post-136767-en', 'Ten days is not enough', 'Ten days', H('10-days-egypt-tours')],
  ['wp-post-136729-en', 'When you have two weeks in Egypt', 'two weeks', H('14-days-egypt-tours')],
  ['wp-post-136112-en', 'With 4 days', '4 days', H('4-days-egypt-tours')],
  ['wp-post-136112-en', '7 days is the shortest', '7 days', H('7-days-egypt-tours')],
  ['wp-post-136112-en', '10 days stabilises', '10 days', H('10-days-egypt-tours')],
  ['wp-post-136112-en', 'With 15 days', '15 days', H('14-days-egypt-tours')],
];
const key = () => randomBytes(6).toString('hex');
const docs = {};
for (const [id, prefix, phrase, hub] of OPS) {
  if (!(await c.getDocument(hub))) throw new Error(`${hub} not published`);
  if (await c.getDocument(`drafts.${id}`)) throw new Error(`${id} has a draft`);
  const d = (docs[id] ??= await c.getDocument(id));
  if (JSON.stringify(d.body).includes(`"_ref":"${hub}"`)) { console.log(`${id}: already links ${hub}`); continue; }
  const rx = new RegExp(`\\b${phrase}\\b`);
  const bi = d.body.findIndex((b) => b._type === 'block' && b.style === 'normal'
    && (!prefix || b.children.map((s) => s.text).join('').startsWith(prefix))
    && b.children.some((s) => !s.marks?.length && rx.test(s.text)));
  if (bi < 0) throw new Error(`${id}: no unmarked "${phrase}" (prefix ${prefix})`);
  const blk = d.body[bi];
  const si = blk.children.findIndex((s) => !s.marks?.length && rx.test(s.text));
  const sp = blk.children[si]; const at = sp.text.search(rx); const mk = key();
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
