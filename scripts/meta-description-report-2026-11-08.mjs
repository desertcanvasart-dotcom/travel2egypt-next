/**
 * Fix round 3, Task B — REPORT ONLY (2026-11-08). For every guide (city +
 * guideArticle), blog article and wiki page, per locale: the effective meta
 * description (what <meta name="description"> renders) and the visible intro,
 * flagged when they contain legacy boilerplate, end with "…", are <70 or >170
 * characters, or are duplicated across pages. Writes
 * docs/meta-description-report-2026-11-08.csv. Changes nothing.
 */
import 'dotenv/config';
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: true });
const LOCALES = ['en', 'es', 'ja'];
const pre = (l) => (l === 'en' ? '' : `/${l}`);
const v = (arr, l) => (Array.isArray(arr) ? (arr.find((x) => x._key === l)?.value ?? null) : null);
const pub = '!(_id in path("drafts.**")) && hidden != true';

const rows = [];
const add = (url, locale, kind, meta, intro) => rows.push({ url, locale, kind, meta: (meta ?? '').trim(), intro: (intro ?? '').trim() });

const cities = await c.fetch(`*[_type=="city" && ${pub}]{slug, summary, dek, seoDescription, seo}`);
const cityById = {};
for (const d of cities) for (const l of LOCALES) {
  const s = v(d.slug, l) ? v(d.slug, l).current : null;
  if (!s) continue;
  add(`${pre(l)}/guide/${s}`, l, 'guide', v(d.seoDescription, l) || v(d.seo?.metaDescription, l) || v(d.summary, l), v(d.dek, l) || v(d.summary, l));
}
const gas = await c.fetch(`*[_type=="guideArticle" && ${pub}]{slug, summary, dek, seoDescription, seo, "city": parentCity->slug}`);
for (const d of gas) for (const l of LOCALES) {
  const s = v(d.slug, l)?.current, cs = (v(d.city, l) ?? v(d.city, 'en'))?.current;
  if (!s || !cs) continue;
  add(`${pre(l)}/guide/${cs}/${s}`, l, 'guide', v(d.seoDescription, l) || v(d.seo?.metaDescription, l) || v(d.summary, l), v(d.dek, l) || v(d.summary, l));
}
const arts = await c.fetch(`*[_type=="article" && ${pub}]{language, "slug": slug.current, deck, seo}`);
for (const d of arts) {
  if (!d.slug || !LOCALES.includes(d.language)) continue;
  const meta = (typeof d.seo?.metaDescription === 'string' ? d.seo.metaDescription : v(d.seo?.metaDescription, d.language)) || d.deck;
  add(`${pre(d.language)}/blog/${d.slug}`, d.language, 'blog', meta, d.deck);
}
for (const [type, seg] of [['wikiMonument', 'monuments'], ['wikiDeity', 'deities'], ['wikiPerson', 'people'], ['wikiDynasty', 'dynasties']]) {
  const docs = await c.fetch(`*[_type==$type && ${pub}]{slug, summary, seo}`, { type });
  for (const d of docs) for (const l of LOCALES) {
    const s = v(d.slug, l)?.current;
    if (!s) continue;
    add(`${pre(l)}/wiki/${seg}/${s}`, l, 'wiki', v(d.seo?.metaDescription, l) || v(d.summary, l), v(d.summary, l));
  }
}

const BOILER = /dive into|enriched|beacon|embark on|discover the|welcome to|nestled|tapestry/i;
const count = {};
for (const r of rows) if (r.meta) count[`${r.locale}|${r.meta}`] = (count[`${r.locale}|${r.meta}`] ?? 0) + 1;
const out = [['url', 'locale', 'type', 'issues', 'meta_length', 'meta_description', 'visible_intro']];
const tally = {};
for (const r of rows) {
  const issues = [];
  const m = r.meta;
  if (!m) issues.push('missing');
  else {
    if (BOILER.test(m)) issues.push(`boilerplate:${m.match(BOILER)[0].toLowerCase()}`);
    if (/(…|\.\.\.)\s*$/.test(m)) issues.push('ends-with-ellipsis');
    if (m.length < 70) issues.push('under-70');
    if (m.length > 170) issues.push('over-170');
    if (count[`${r.locale}|${m}`] > 1) issues.push(`duplicate×${count[`${r.locale}|${m}`]}`);
  }
  if (r.intro && r.intro !== m && BOILER.test(r.intro)) issues.push('intro-boilerplate');
  if (!issues.length) continue;
  for (const i of issues) tally[i.split(':')[0].replace(/×\d+/, '')] = (tally[i.split(':')[0].replace(/×\d+/, '')] ?? 0) + 1;
  out.push([r.url, r.locale, r.kind, issues.join(' '), m.length, m, r.intro === m ? '(same as meta)' : r.intro]);
}
const csv = out.map((row) => row.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n') + '\n';
fs.writeFileSync('docs/meta-description-report-2026-11-08.csv', csv);
console.log('pages checked', rows.length, '| flagged', out.length - 1);
console.log(tally);
