/**
 * Hard-coded links to the old addresses of the Egyptian Museum, Coptic Cairo, Al-Muizz Street &
 * Khan El Khalili day tour (open items §4). Canon Gate D.
 *
 *   tour  wp-page-87729
 *     en  /egyptian-museum-and-bazaar-tour                                    → /egyptian-museum-coptic-cairo-al-muizz-and-khan-el-khalili
 *     es  /es/el-cairo-en-un-dia-museo-egipcio-cairo-copto-y-jan-el-jalili      → /es/museo-egipcio-cairo-copto-al-muizz-y-jan-el-jalili
 *     ja  /ja/ichi-nichi-de-meguru-kairo-ejiputo-hakubutsukan-koputokairo      → /ja/ejiputo-kokogaku-hakubutsukan-koputo-chiku-muizzu-dori-han-hariri
 *
 * References (`_ref: wp-page-87729`: related tours, hubs, cards) follow the slug by themselves and
 * are only listed. Text links (`href` strings, usually body … markDefs[].href) would still work
 * through the 301s (migration/redirect-map.*), but are updated here to the final address, keeping
 * any #fragment or ?query. The scan reads every document (paging `*[_id > $start] | order(_id)`),
 * so the dry run lists every hit in any field; only `href` fields are written. Provenance fields
 * (`wpUrl`, `_pendingInternalRef`, `migration.*`) are listed, never changed. Drafts are listed and
 * left alone (an unpublished draft is the editor's; the 301 covers it if it is published).
 *
 * Run AFTER import-museum-coptic-2026-11-19.mjs --apply: --apply refuses while the tour's slugs are
 * still the old ones (a link to the new address would 404 until then).
 *
 *   node --env-file=<.env> scripts/day-tour-format/relink-museum-coptic-2026-11-19.mjs           # dry run
 *   node --env-file=<.env> scripts/day-tour-format/relink-museum-coptic-2026-11-19.mjs --apply
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';

const TOUR = 'wp-page-87729';
const MAP = {
  en: ['egyptian-museum-and-bazaar-tour', 'egyptian-museum-coptic-cairo-al-muizz-and-khan-el-khalili'],
  es: ['el-cairo-en-un-dia-museo-egipcio-cairo-copto-y-jan-el-jalili', 'museo-egipcio-cairo-copto-al-muizz-y-jan-el-jalili'],
  ja: ['ichi-nichi-de-meguru-kairo-ejiputo-hakubutsukan-koputokairo', 'ejiputo-kokogaku-hakubutsukan-koputo-chiku-muizzu-dori-han-hariri'],
};
const OLD_RE = new RegExp(Object.values(MAP).map(([o]) => o).join('|'));
const apply = process.argv.includes('--apply');
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });

const tour = await client.getDocument(TOUR);
if (!tour) throw new Error(`${TOUR} missing`);
const slugNow = Object.fromEntries(tour.slug.map((s) => [s._key, s.value.current]));
const imported = Object.entries(MAP).every(([l, [, neu]]) => slugNow[l] === neu);

// Every string under `o` matching an old slug, with its Sanity patch path.
const hits = (o, p = '') => {
  const out = [];
  if (Array.isArray(o)) o.forEach((x, i) => out.push(...hits(x, `${p}[${x?._key ? `_key=="${x._key}"` : i}]`)));
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) out.push(...hits(v, p ? `${p}.${k}` : k));
  else if (typeof o === 'string' && OLD_RE.test(o)) out.push({ path: p, value: o });
  return out;
};
// "/es/el-cairo-…#x" → "/es/museo-…#x"; an absolute travel2egypt.org URL becomes a site path.
const target = (href) => {
  const m = href.match(/^(?:https?:\/\/(?:www\.)?travel2egypt\.org)?\/?(?:(es|ja)\/)?([^/?#]+)\/?([?#].*)?$/);
  if (!m) return null;
  const [, lc, slug, rest] = m;
  const l = Object.keys(MAP).find((k) => MAP[k][0] === slug);
  if (!l) return null;
  // A link in one locale to another locale's old slug goes to that locale's new address.
  return `${l === 'en' ? '' : `/${l}`}/${MAP[l][1]}${rest ?? ''}`;
};
// The locale of the essay row a path sits in (body[_key=="es"]…), for the report.
const rowLocale = (path) => (path.match(/^\w+\[_key=="(en|es|ja)"\]/) ?? [])[1] ?? '';
// The visible link text for a markDef path.
const linkText = (doc, path) => {
  const m = path.match(/^(.*)\.markDefs\[_key=="([^"]+)"\]\.href$/);
  if (!m) return '';
  const block = m[1].split(/\.(?![^[]*\])/).reduce((o, seg) => {
    const s = seg.match(/^([^[]+)((?:\[[^\]]+\])*)$/);
    let v = o?.[s[1]];
    for (const [, k] of s[2].matchAll(/\[_key=="([^"]+)"\]/g)) v = v?.find((x) => x._key === k);
    for (const [, i] of s[2].matchAll(/\[(\d+)\]/g)) v = v?.[Number(i)];
    return v;
  }, doc);
  return (block?.children ?? []).filter((c) => (c.marks ?? []).includes(m[2])).map((c) => c.text).join('');
};

const plan = [];
const listed = [];
let start = '';
let scanned = 0;
for (;;) {
  const page = await client.fetch('*[_id > $start] | order(_id) [0...500]', { start });
  if (!page.length) break;
  scanned += page.length;
  start = page[page.length - 1]._id;
  for (const d of page) {
    for (const h of hits(d)) {
      const field = h.path.split('.').pop().replace(/\[.*$/, '');
      const row = { id: d._id, type: d._type, locale: rowLocale(h.path), path: h.path, from: h.value, text: linkText(d, h.path) };
      const to = field === 'href' ? target(h.value) : null;
      if (to && !d._id.startsWith('drafts.') && d._id !== TOUR) plan.push({ ...row, to });
      else listed.push({ ...row, why: d._id.startsWith('drafts.') ? 'draft (left alone)' : d._id === TOUR ? 'the tour itself (the import changes its slugs; migration.wpUrl is provenance)' : field !== 'href' ? `${field} (provenance / not a link, left alone)` : 'href not recognised' });
    }
  }
}
const refs = await client.fetch('*[references($id)]{_id, _type, "title": coalesce(title[_key=="en"][0].value, name[_key=="en"][0].value, title, name)}', { id: TOUR });

console.log(`scanned ${scanned} documents; tour slugs now ${JSON.stringify(slugNow)} (import ${imported ? 'APPLIED' : 'NOT applied yet'})`);
console.log(`\nhref links to update (${plan.length}):`);
for (const p of plan) console.log(`  ${p.id} (${p.type}) ${p.locale || '-'} «${p.text}»\n    ${p.path}\n    ${p.from} → ${p.to}`);
console.log(`\nother hits, not changed (${listed.length}):`);
for (const p of listed) console.log(`  ${p.id} (${p.type}) ${p.locale || '-'} ${p.path}: ${p.from} — ${p.why}`);
console.log(`\nreferences to ${TOUR} (follow the slug, nothing to do) (${refs.length}):`);
for (const r of refs) console.log(`  ${r._id} (${r._type}) ${typeof r.title === 'string' ? r.title : ''}`);

if (apply) {
  if (!imported) throw new Error('run import-museum-coptic-2026-11-19.mjs --apply first (the new slugs are not live yet)');
  if (!plan.length) { console.log('nothing to change'); process.exit(0); }
  const ids = [...new Set(plan.map((p) => p.id))];
  await writeRollback(client, ids, 'before-relink-museum-coptic');
  const tx = client.transaction();
  for (const id of ids) tx.patch(id, (q) => q.set(Object.fromEntries(plan.filter((p) => p.id === id).map((p) => [p.path, p.to]))));
  await tx.commit();
  console.log(`APPLIED: ${plan.length} links in ${ids.length} documents`);
} else console.log('\ndry run (pass --apply after the import has been applied)');
