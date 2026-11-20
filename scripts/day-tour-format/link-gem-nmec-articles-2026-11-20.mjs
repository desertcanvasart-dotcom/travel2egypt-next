/**
 * Links the "Grand Egyptian Museum" and "National Museum of Egyptian Civilisation" site names on the
 * day-tour and itinerary pages to the blog articles about them (owner, 20 Nov: "we actually have this
 * page", /blog/the-grand-egyptian-museum). Each locale's row links that locale's own article (the
 * articles are one document per language, joined by translation.metadata):
 *
 *   GEM   en wp-post-216669-en /blog/the-grand-egyptian-museum
 *         es wp-post-249194-es /es/blog/el-gran-museo-egipcio-la-puerta-monumental-de-egipto-al-pasado
 *         ja wp-post-249210-ja /ja/blog/dai-ejiputo-hakubutsukan
 *   NMEC  en wp-post-239081-en /blog/national-museum-of-egyptian
 *         es wp-post-240565-es /es/blog/museo-nacional-de-la-civilizacion-egipcia
 *         ja wp-post-240706-ja /ja/blog/kairo-kokuritsu-ejiputo-bummei-hakubutsukan-nmec
 *
 * Only site rows that have NO link yet are set (an existing guide link is never replaced). Scans
 * every published tour's dayTimeline[].stops[].sites[] and itineraryDays[].sites[]. The links
 * render once the query change in this PR is deployed (articles keep a plain slug.current); before
 * that the site name simply shows without a link, as today.
 *
 *   node --env-file=<.env> scripts/day-tour-format/link-gem-nmec-articles-2026-11-20.mjs           # dry run
 *   node --env-file=<.env> scripts/day-tour-format/link-gem-nmec-articles-2026-11-20.mjs --apply
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';

const apply = process.argv.includes('--apply');
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN });

const ARTICLE = {
  gem: { en: 'wp-post-216669-en', es: 'wp-post-249194-es', ja: 'wp-post-249210-ja' },
  nmec: { en: 'wp-post-239081-en', es: 'wp-post-240565-es', ja: 'wp-post-240706-ja' },
};
// Site names as the locked copy writes them (whole-name matches only).
const WHICH = (name) => {
  const n = name.trim();
  if (/^(the )?Grand Egyptian Museum( \(GEM\))?$|^Gran Museo Egipcio( \(GEM\))?$|^大エジプト博物館（?(GEM)?）?$/i.test(n)) return 'gem';
  if (/^(the )?National Museum of Egyptian Civili[sz]ation( \(NMEC\))?$|^NMEC$|^Museo Nacional de la Civilización Egipcia( \(NMEC\))?$|^国立エジプト文明博物館（?(NMEC)?）?$/i.test(n)) return 'nmec';
  return null;
};

// The articles must exist, be published, and be in the language they are used for.
const ids = Object.values(ARTICLE).flatMap((m) => Object.values(m));
const docs = await client.fetch('*[_id in $ids]{_id, language, "slug": slug.current}', { ids });
for (const [kind, m] of Object.entries(ARTICLE)) for (const [l, id] of Object.entries(m)) {
  const d = docs.find((x) => x._id === id);
  if (!d || d.language !== l || !d.slug) throw new Error(`${kind} ${l}: ${id} missing, unpublished or not ${l}`);
}

const tours = await client.fetch('*[_type == "tour" && !(_id in path("drafts.**")) && (count(dayTimeline[].stops[].sites[]) > 0 || count(itineraryDays[].sites[]) > 0)]{_id, "t": title[_key=="en"][0].value, dayTimeline, itineraryDays}');
const plan = [];
for (const t of tours) {
  const set = {};
  const seen = [];
  const link = (site, lang, path) => {
    const kind = WHICH(site.name ?? '');
    if (!kind) return site;
    if (site.guideRef?._ref) { seen.push(`  keep  ${path}: «${site.name}» already → ${site.guideRef._ref}`); return site; }
    const ref = ARTICLE[kind][lang];
    if (!ref) { seen.push(`  skip  ${path}: «${site.name}» row has no language`); return site; }
    seen.push(`  link  ${path}: «${site.name}» → ${ref}`);
    return { ...site, guideRef: { _type: 'reference', _ref: ref, _weak: true } };
  };
  if (t.dayTimeline?.length) {
    const next = t.dayTimeline.map((p) => ({ ...p, stops: (p.stops ?? []).map((s) => (s.sites ? { ...s, sites: s.sites.map((x) => link(x, p.lang, `dayTimeline ${p.lang} ${p._key}/${s._key}`)) } : s)) }));
    if (JSON.stringify(next) !== JSON.stringify(t.dayTimeline)) set.dayTimeline = next;
  }
  if (t.itineraryDays?.length) {
    const next = t.itineraryDays.map((d) => (d.sites ? { ...d, sites: d.sites.map((x) => link(x, d.lang, `itineraryDays ${d.lang} day ${d.day}`)) } : d));
    if (JSON.stringify(next) !== JSON.stringify(t.itineraryDays)) set.itineraryDays = next;
  }
  if (seen.length) plan.push({ id: t._id, t: t.t, set, seen });
}
for (const p of plan) { console.log(`${p.id} — ${p.t}${Object.keys(p.set).length ? '' : ' (nothing to write)'}`); for (const s of p.seen) console.log(s); }
const writes = plan.filter((p) => Object.keys(p.set).length);
console.log(`\n${writes.length} documents to write, ${writes.reduce((n, p) => n + p.seen.filter((s) => s.startsWith('  link')).length, 0)} site links`);
if (!apply) { console.log('dry run (--apply writes production)'); process.exit(0); }
if (await client.fetch('count(*[_id in $ids])', { ids: writes.map((p) => `drafts.${p.id}`) })) throw new Error('a draft exists for one of these tours — handle it first');
await writeRollback(client, writes.map((p) => p.id), 'before-link-gem-nmec-articles');
for (const p of writes) await client.patch(p.id).set(p.set).commit();
console.log(`APPLIED to ${writes.length} documents`);
