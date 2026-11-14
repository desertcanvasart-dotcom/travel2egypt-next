// Owner-approved 2026-11-14 ("Approve as written"):
// review/seo/striking-distance-2026-11-14-en.md, section B (B3, B5, B6).
// Adds an internalLink mark on EXISTING words only — no copy changes.
// node scripts/striking-distance-links-2026-11-14.mjs [--apply] [--only=B3,B6]
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
const only = (process.argv.find((a) => a.startsWith('--only=')) ?? '').slice(7).split(',').filter(Boolean);

const ZAHRA = 'wp-page-64250'; // nileCruise oberoi-zahra-nile-cruise
const SIWA_TOUR = 'wp-page-113061'; // tour siwa-oasis-adventure-tour
const DAHABIYA_HUB = 'tourLanding.authentic-dahabiya-nile-cruise';

// kind: 'plain' = article (top-level body), 'i18n' = body[_key=="en"].value
const OPS = [
  { group: 'B3', id: 'wp-post-1427-en', kind: 'plain', block: '00000000000f', phrase: 'Oberoi Zahra', target: ZAHRA },
  { group: 'B6', id: 'wp-page-113521', kind: 'i18n', block: '000000000005', phrase: 'Siwa', target: SIWA_TOUR },
  { group: 'B6', id: 'wp-page-155539', kind: 'i18n', block: '000000000007', phrase: 'Siwa', target: SIWA_TOUR },
  { group: 'B6', id: 'wp-page-160129', kind: 'i18n', block: 'enb1', phrase: 'Siwa', target: SIWA_TOUR },
  { group: 'B6', id: 'hotel.adr-re-amellal-ecolodge-siwa', kind: 'i18n', block: '00000000001f', phrase: 'Siwa', target: SIWA_TOUR },
  { group: 'B6', id: 'hotel.ghaliet-siwa-ecolodge', kind: 'i18n', block: '000000000013', phrase: 'Siwa', target: SIWA_TOUR },
  { group: 'B6', id: 'wp-page-64075', kind: 'i18n', block: '000000000005', phrase: 'Siwa Oasis', target: SIWA_TOUR },
  // B5 — needs the tourLanding link target (PR deploy) before it renders.
  { group: 'B5', id: 'wp-post-111586-en', kind: 'plain', block: '00000000000b', phrase: 'dahabiya', target: DAHABIYA_HUB },
  { group: 'B5', id: 'tour.7-days-luxury-dahabiya-nile-cruise', kind: 'i18n', block: null, phrase: 'dahabiya', target: DAHABIYA_HUB },
  { group: 'B5', id: 'tour.7-days-luxury-dahabiya-cruise-on-the-nile', kind: 'i18n', block: null, phrase: 'dahabiya', target: DAHABIYA_HUB },
];

const key = () => randomBytes(6).toString('hex');
const tx = c.transaction();
let planned = 0;

for (const op of OPS.filter((o) => !only.length || only.includes(o.group))) {
  for (const id of [op.id, `drafts.${op.id}`]) {
    const d = await c.getDocument(id);
    if (!d) { if (id === op.id) throw new Error(`missing ${id}`); continue; }
    const blocks = op.kind === 'plain' ? d.body : d.body.find((x) => x._key === 'en').value;
    if (JSON.stringify(blocks).includes(`"_ref":"${op.target}"`)) { console.log(`${id}: already links to ${op.target} — skip`); continue; }
    // First normal block (or the named one) with an unmarked span containing the phrase as a whole word.
    const rx = new RegExp(`\\b${op.phrase}\\b`);
    const blk = blocks.find((b) => b._type === 'block' && (op.block ? b._key === op.block : b.style === 'normal')
      && b.children?.some((s) => !s.marks?.length && rx.test(s.text)));
    if (!blk) throw new Error(`${id}: no unmarked "${op.phrase}" in ${op.block ?? 'any normal block'}`);
    const si = blk.children.findIndex((s) => !s.marks?.length && rx.test(s.text));
    const span = blk.children[si];
    const at = span.text.search(rx);
    const mk = key();
    const parts = [
      span.text.slice(0, at) && { ...span, _key: key(), text: span.text.slice(0, at) },
      { _key: key(), _type: 'span', marks: [mk], text: op.phrase },
      span.text.slice(at + op.phrase.length) && { ...span, _key: key(), text: span.text.slice(at + op.phrase.length) },
    ].filter(Boolean);
    const next = {
      ...blk,
      children: [...blk.children.slice(0, si), ...parts, ...blk.children.slice(si + 1)],
      markDefs: [...(blk.markDefs ?? []), { _key: mk, _type: 'internalLink', reference: { _type: 'reference', _ref: op.target } }],
    };
    // Copy unchanged except the link: verify the block text is identical.
    const txt = (b) => b.children.map((s) => s.text).join('');
    if (txt(next) !== txt(blk)) throw new Error(`${id}: text drift`);
    const path = op.kind === 'plain' ? `body[_key=="${blk._key}"]` : `body[_key=="en"].value[_key=="${blk._key}"]`;
    console.log(`${op.group} ${id} ${blk._key}: link "${op.phrase}" → ${op.target}\n    …${span.text.slice(Math.max(0, at - 40), at + op.phrase.length + 40)}…`);
    tx.patch(id, (p) => p.set({ [path]: next }));
    planned++;
  }
}
if (apply && planned) console.log('committed', (await tx.commit()).transactionId);
else console.log(`${planned} patch(es) planned — ${apply ? 'nothing to do' : 'dry run, pass --apply'}`);
