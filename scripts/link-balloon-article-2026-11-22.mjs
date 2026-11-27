/**
 * Link the three balloon journal articles to the merged balloon tour (owner, 22 Nov: "add the link from the article to
 * the tour page"). One short paragraph after the conclusion paragraph in each article, with an internal link to the
 * keeper tour wp-page-133463. The articles are the pages Google actually shows for balloon queries (998 + 196 + 81
 * impressions in 3 months), the tour pages get almost none.
 *
 *   node --env-file=<.env> scripts/link-balloon-article-2026-11-22.mjs           # dry run
 *   node --env-file=<.env> scripts/link-balloon-article-2026-11-22.mjs --apply
 */
import { createClient } from '@sanity/client';
import { writeRollback } from './lib/content-gates.mjs';

const TOUR = 'wp-page-133463';
const apply = process.argv.includes('--apply');
const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN });

// [article, block to insert after, text before the link, link text, text after]
const PLAN = [
  ['wp-post-133066-en', '000000000069', 'Our own ', 'Luxor hot-air balloon flights', ', at sunrise or after sunrise with a licensed Luxor balloon company, are on the tour page.'],
  ['wp-post-144438-es', '00000000006d', 'Nuestros ', 'vuelos en globo en Luxor', ', al amanecer o después del amanecer y con una empresa de globos de Luxor con licencia, están en la página del tour.'],
  ['wp-post-170254-ja', '00000000005d', '当社の', 'ルクソール熱気球フライト', 'は、日の出の便と日の出後の便があり、ライセンスを持つルクソールの熱気球会社と運航しています。詳しくはツアーのページをご覧ください。'],
];
const tour = await c.getDocument(TOUR);
if (!tour || tour.hidden) throw new Error('tour missing or hidden');
const textOf = (b) => (b.children ?? []).map((x) => x.text).join('');
const ids = [];
const tx = c.transaction();
for (const [id, after, pre, link, post] of PLAN) {
  const d = await c.getDocument(id);
  if (!d) throw new Error(`${id} missing`);
  if (await c.getDocument(`drafts.${id}`)) throw new Error(`drafts.${id} exists`);
  if (JSON.stringify(d.body).includes(`"_ref":"${TOUR}"`)) { console.log(`${id}: already links the tour, skipped`); continue; }
  const i = d.body.findIndex((b) => b._key === after);
  if (i < 0) throw new Error(`${id}: block ${after} missing`);
  const mk = `bln${id.slice(-2)}`;
  const block = {
    _type: 'block', _key: `bl${id.slice(-2)}tour01`, style: 'normal',
    markDefs: [{ _key: mk, _type: 'internalLink', reference: { _type: 'reference', _ref: TOUR } }],
    children: [{ _type: 'span', _key: 's1', text: pre, marks: [] }, { _type: 'span', _key: 's2', text: link, marks: [mk] }, { _type: 'span', _key: 's3', text: post, marks: [] }],
  };
  console.log(`${id}: after "${textOf(d.body[i]).slice(0, 60)}…" → ${pre}[${link}]${post}`);
  ids.push(id);
  tx.patch(id, (p) => p.insert('after', `body[_key=="${after}"]`, [block]));
}
if (!apply) { console.log('dry run'); process.exit(0); }
if (ids.length) { await writeRollback(c, ids, 'balloon-article-link'); await tx.commit(); }
console.log('applied', ids.length);
