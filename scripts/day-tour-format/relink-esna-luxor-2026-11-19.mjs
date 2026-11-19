/**
 * Hard-coded links to the old addresses of "Esna and El Kab Day Tour from Luxor" (wp-page-88167),
 * which import-esna-el-kab-silsila-luxor-2026-11-19.mjs moves to its new slugs. Open items §4.1–4.2.
 *
 * Links that reference the document by `_ref` (wikiMonument wp-page-59624 and guideArticle
 * wp-page-86841, "Esna Temple", repointed to it on 19 Nov by retire-el-kab-esna-2026-11-19.mjs) keep
 * working through the slug change and are not touched. Links written as text (markDefs[].href) to
 * an old address would still work through the 301s (migration/redirect-map.*), but are updated to
 * the final address here, so no link goes through a redirect:
 *
 *   EN  /esna-temple-and-el-kab-day-tour-from-luxor                       → /esna-el-kab-and-gebel-silsila-from-luxor
 *   ES  /es/esna-y-el-kab-desde-luxor (and the older /es/ addresses)      → /es/esna-el-kab-y-gebel-silsila-desde-luxor
 *   JA  /ja/rukusoru-hatsu-esuna-eru-kabu-higaeri-tsua-shinden-haka         → /ja/rukusoru-hatsu-esuna-eru-kabu-geberu-shirushira
 *
 * The scan reads every document (all ~3,900, a page of 500 at a time) and lists every `href` that
 * names an old address. Only `href`s change (link text, `_key`s and the migration's
 * `_pendingInternalRef.wpUrl` notes are left alone). Drafts are listed, never written.
 * The 19 Nov scan found 12 published links (4 EN, 8 ES; several ES ones are old auto-links on
 * unrelated words, e.g. "del tiempo hasta las", listed in the PR) and 3 in drafts.
 *
 * Run AFTER the import (refuses --apply until the new EN slug is live); a rollback of every
 * document it changes is written first.
 *
 *   node --env-file=<.env> scripts/day-tour-format/relink-esna-luxor-2026-11-19.mjs           # dry run
 *   node --env-file=<.env> scripts/day-tour-format/relink-esna-luxor-2026-11-19.mjs --apply
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';

const DOC_ID = 'wp-page-88167';
const NEW = {
  en: '/esna-el-kab-and-gebel-silsila-from-luxor',
  es: '/es/esna-el-kab-y-gebel-silsila-desde-luxor',
  ja: '/ja/rukusoru-hatsu-esuna-eru-kabu-geberu-shirushira',
};
// Old addresses (path part), per locale. The ES and JA EN-slug paths and the old WordPress ES
// address all 301 to the tour too.
const OLD = [
  ['es', /^\/es\/(esna-y-el-kab-desde-luxor|esna-temple-and-el-kab-day-tour-from-luxor|las-orillas-del-tiempo-excursion-de-un-dia-a-esna-y-el-kab-desde-luxor)\/?$/],
  ['ja', /^\/ja\/(rukusoru-hatsu-esuna-eru-kabu-higaeri-tsua-shinden-haka|esna-temple-and-el-kab-day-tour-from-luxor)\/?$/],
  ['en', /^\/esna-temple-and-el-kab-day-tour-from-luxor\/?$/],
];
const apply = process.argv.includes('--apply');
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });

const localeOf = (href) => {
  const m = String(href).match(/^(?:https?:\/\/(?:www\.)?travel2egypt\.org)?(\/[^?#]*)([?#].*)?$/);
  if (!m) return null;
  const hit = OLD.find(([, rx]) => rx.test(m[1]));
  return hit ? { locale: hit[0], suffix: m[2] ?? '' } : null;
};
// Every `href` in a document that names an old address, as a Sanity patch path.
const hrefHits = (o, p = '', out = []) => {
  if (Array.isArray(o)) o.forEach((x, i) => hrefHits(x, `${p}[${x?._key ? `_key=="${x._key}"` : i}]`, out));
  else if (o && typeof o === 'object') {
    if (typeof o.href === 'string') { const h = localeOf(o.href); if (h) out.push({ path: `${p}.href`, from: o.href, to: NEW[h.locale] + h.suffix }); }
    for (const [k, v] of Object.entries(o)) if (k !== 'href') hrefHits(v, p ? `${p}.${k}` : k, out);
  }
  return out;
};
// The link's words, for the report.
const linkText = (doc, path) => {
  const m = path.match(/^(.*)\.markDefs\[_key=="([^"]+)"\]\.href$/);
  if (!m) return '';
  const block = m[1].split(/\.(?![^[]*\])/).reduce((o, seg) => {
    const s = seg.match(/^([^[]+)((?:\[[^\]]+\])*)$/);
    let v = o?.[s[1]];
    for (const [, k] of s[2].matchAll(/\[_key=="([^"]+)"\]/g)) v = v?.find((x) => x._key === k);
    return v;
  }, doc);
  return (block?.children ?? []).filter((c) => (c.marks ?? []).includes(m[2])).map((c) => c.text).join('');
};

const plan = [], draftHits = [];
let start = '', scanned = 0;
for (;;) {
  const page = await client.fetch('*[_id > $start] | order(_id) [0...500]', { start });
  if (!page.length) break;
  for (const d of page) {
    scanned++;
    for (const h of hrefHits(d)) {
      const row = { id: d._id, type: d._type, hidden: !!d.hidden, title: [d.title].flat().find((t) => t?._key === 'en' || t?._key === 'es')?.value ?? '', text: linkText(d, h.path), ...h };
      (d._id.startsWith('drafts.') ? draftHits : plan).push(row);
    }
  }
  start = page[page.length - 1]._id;
}
console.log(`scanned ${scanned} documents`);
for (const p of plan) console.log(`  ${p.id} (${p.type}${p.hidden ? ', hidden' : ''}) "${p.title}" · link "${p.text}"\n      ${p.path}\n      ${p.from} → ${p.to}`);
console.log(`${plan.length} published link(s) to update`);
for (const p of draftHits) console.log(`  NOT TOUCHED (draft): ${p.id} (${p.type}) link "${p.text}" ${p.from} → would be ${p.to}`);
const withDraft = [];
for (const id of new Set(plan.map((p) => p.id))) if (await client.getDocument(`drafts.${id}`)) withDraft.push(id);
if (withDraft.length) console.log(`  note: ${withDraft.join(', ')} also has an unpublished draft (left as it is; publishing it later would bring the old link back, which still 301s)`);

if (apply) {
  const tour = await client.getDocument(DOC_ID);
  if (tour?.slug?.find((s) => s._key === 'en')?.value.current !== NEW.en.slice(1)) throw new Error('run the import first (the new slug is not live yet)');
  if (!plan.length) { console.log('nothing to update'); process.exit(0); }
  const ids = [...new Set(plan.map((p) => p.id))];
  await writeRollback(client, ids, 'before-relink-esna-luxor');
  const tx = client.transaction();
  for (const id of ids) tx.patch(id, (q) => q.set(Object.fromEntries(plan.filter((p) => p.id === id).map((p) => [p.path, p.to]))));
  await tx.commit();
  console.log(`APPLIED: ${plan.length} link(s) in ${ids.length} document(s)`);
} else console.log('dry run (pass --apply after the import to write production)');
