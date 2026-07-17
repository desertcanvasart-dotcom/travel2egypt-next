/**
 * Round-2 resolver for the 552 unresolved visible raw-link URLs. READ-ONLY.
 * Tiers:
 *   cityTopic — /<city>-travel-guide/<topic>, /es/guia-…-de-<city>/<topic>,
 *               /ja/<city>旅行ガイド/<topic>: resolve city, then match topic
 *               against that city's guideArticles (slug+title tokens/bigrams).
 *   cityFlat  — flat URL that IS a city guide page → /guide/<citySlug>
 *   flat      — flat URL matched against all linkable docs' slugs+titles.
 * Acceptance: best score ≥ 0.72 AND (unique best or gap to 2nd ≥ 0.25).
 */
const fs = require('fs');
const { createClient } = require('/Users/islamhussein/t2e/node_modules/@sanity/client');
require('/Users/islamhussein/t2e/node_modules/dotenv').config({ path: '/Users/islamhussein/t2e/.env' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2024-12-01',
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN,
  useCdn: false,
});

const plan = require('./resolution-plan.json');
const unresolved = plan.filter((x) => !x.to);

// ---------- text similarity (mirrors scripts/audit-imported-links.ts) ----------
const STOP = new Set('the of in on at a an and or to for with from by la el los las de del un una y en al es lo su tour tours guide guia oasis travel'.split(' '));
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const tokens = (s) => new Set(norm(s).split(/[^a-z0-9]+/).filter((t) => t.length >= 3 && !STOP.has(t)));
const bigrams = (s) => { const out = new Set(); const t = s.replace(/[\s・-]/g, ''); for (let i = 0; i < t.length - 1; i++) out.add(t.slice(i, i + 2)); return out; };
const overlap = (a, b) => { if (!a.size || !b.size) return 0; let n = 0; for (const x of a) if (b.has(x)) n++; return n / Math.min(a.size, b.size); };
function sim(a, b) {
  if (!a || !b) return 0;
  const latin = /[a-zA-Z]{3,}/.test(a);
  if (latin) return overlap(tokens(a), tokens(b));
  const x = a.replace(/[\s・-]/g, ''), y = b.replace(/[\s・-]/g, '');
  if (x && y && (y.includes(x) || x.includes(y))) return 1;
  return overlap(bigrams(a), bigrams(b));
}

function urlLocale(p) { return p.startsWith('/es/') ? 'es' : p.startsWith('/ja/') ? 'ja' : 'en'; }

async function main() {
  // ---------- load corpus ----------
  const docs = await client.fetch(`
    *[!(_id in path('drafts.**')) && hidden != true && _type in ['guideArticle','city','tour','tourLanding','editorialPage','travelTip','nileCruise','hotel','article']]{
      _id, _type, language,
      "slugs": slug[]{_key, "current": value.current},
      "flatSlug": slug.current,
      "titles": title[]{_key, value},
      "flatTitle": select(defined(title) && !defined(title[0]._key) => title, null),
      "cityRef": parentCity._ref,
      "citySlugs": parentCity->slug[]{_key, "current": value.current}
    }`);
  const cities = docs.filter((d) => d._type === 'city');
  const guidesByCity = new Map();
  for (const g of docs.filter((d) => d._type === 'guideArticle' && d.cityRef)) {
    if (!guidesByCity.has(g.cityRef)) guidesByCity.set(g.cityRef, []);
    guidesByCity.get(g.cityRef).push(g);
  }
  console.log('corpus docs:', docs.length, '| cities:', cities.length);

  const slugOf = (d, loc) => (d.slugs || []).find((s) => s._key === loc)?.current || (d.slugs || []).find((s) => s._key === 'en')?.current || d.flatSlug;
  const titleOf = (d, loc) => (d.titles || []).find((t) => t._key === loc)?.value || (d.titles || []).find((t) => t._key === 'en')?.value || d.flatTitle || '';
  const citySlugOf = (d, loc) => (d.citySlugs || []).find((s) => s._key === loc)?.current || (d.citySlugs || []).find((s) => s._key === 'en')?.current;

  function routeFor(d, loc) {
    const prefix = loc === 'en' ? '' : `/${loc}`;
    const s = slugOf(d, loc);
    if (!s) return null;
    switch (d._type) {
      case 'guideArticle': { const c = citySlugOf(d, loc); return c ? `${prefix}/guide/${c}/${s}` : null; }
      case 'city': return `${prefix}/guide/${s}`;
      case 'tour': case 'tourLanding': case 'editorialPage': return `${prefix}/${s}`;
      case 'travelTip': return `${prefix}/travel-tips/${s}`;
      case 'nileCruise': return `${prefix}/nile-cruises/${s}`;
      case 'hotel': return `${prefix}/hotels/${s}`;
      case 'article': return `${prefix}/blog/${d.flatSlug}`;
      default: return null;
    }
  }

  // ---------- city resolution ----------
  function stripCityPart(seg, loc) {
    let s = decodeURIComponent(seg);
    if (loc === 'en') s = s.replace(/-travel-guide$/, '').replace(/-guide$/, '');
    if (loc === 'es') s = s.replace(/^guia-de-viajes?-de(l)?-/, '').replace(/^guia-de(l)?-/, '').replace(/^guia-/, '');
    if (loc === 'ja') s = s.replace(/旅行ガイド$/, '').replace(/ガイド$/, '');
    return s;
  }
  function findCity(cityPart, loc) {
    let best = null, bestScore = 0, second = 0;
    for (const c of cities) {
      let sc = 0;
      for (const key of ['en', 'es', 'ja']) {
        const sl = (c.slugs || []).find((s) => s._key === key)?.current;
        const ti = (c.titles || []).find((t) => t._key === key)?.value;
        if (sl) sc = Math.max(sc, sim(cityPart, sl));
        if (ti) sc = Math.max(sc, sim(cityPart, ti));
      }
      if (sc > bestScore) { second = bestScore; bestScore = sc; best = c; }
      else if (sc > second) second = sc;
    }
    return bestScore >= 0.7 && (bestScore - second >= 0.2 || bestScore === 1) ? best : null;
  }

  // ---------- matching ----------
  function bestMatch(cands, query, loc) {
    let best = null, bestScore = 0, second = 0;
    for (const d of cands) {
      let sc = 0;
      for (const key of [loc, 'en', 'es', 'ja']) {
        const sl = (d.slugs || []).find((s) => s._key === key)?.current || (key === (d.language || 'en') ? d.flatSlug : null);
        const ti = (d.titles || []).find((t) => t._key === key)?.value || (key === 'en' ? d.flatTitle : null);
        if (sl) sc = Math.max(sc, sim(query, sl));
        if (ti) sc = Math.max(sc, sim(query, ti));
      }
      if (sc > bestScore) { second = bestScore; bestScore = sc; best = d; }
      else if (sc > second) second = sc;
    }
    const ok = bestScore >= 0.72 && (bestScore - second >= 0.25 || bestScore >= 0.95 && second < 0.95);
    return ok ? { doc: best, score: bestScore, second } : { doc: null, score: bestScore, second };
  }

  const out = [];
  for (const u of unresolved) {
    const p = decodeURIComponent(u.path);
    const loc = urlLocale(p);
    const segs = p.split('/').filter(Boolean).filter((s) => s !== 'es' && s !== 'ja');
    let method = 'parked', to = null, note = '', score = 0;

    if (segs.length === 2) {
      const city = findCity(stripCityPart(segs[0], loc), loc);
      if (city) {
        const cands = guidesByCity.get(city._id) || [];
        const m = bestMatch(cands, segs[1], loc);
        if (m.doc) { method = 'cityTopic'; to = routeFor(m.doc, loc); note = m.doc._id; score = m.score; }
        else { note = `city=${city._id} topicBest=${m.score.toFixed(2)}/${m.second.toFixed(2)}`; }
      } else note = 'city unresolved: ' + segs[0];
    } else if (segs.length === 1) {
      // city page itself?
      const asCity = findCity(stripCityPart(segs[0], loc), loc);
      if (asCity && sim(stripCityPart(segs[0], loc), slugOf(asCity, loc) || '') >= 0.8 && /guia|travel-guide|旅行ガイド|guide/.test(segs[0])) {
        method = 'cityFlat'; to = routeFor(asCity, loc); note = asCity._id; score = 1;
      } else {
        const m = bestMatch(docs, segs[0], loc);
        if (m.doc) { method = 'flat'; to = routeFor(m.doc, loc); note = m.doc._id; score = m.score; }
        else { note = `flatBest=${m.score.toFixed(2)}/${m.second.toFixed(2)}`; }
      }
    } else note = 'multi-seg';

    out.push({ url: u.url, path: p, locale: loc, count: u.count, method, to, note, score });
  }

  const resolved = out.filter((x) => x.to);
  const tally = {};
  for (const x of out) tally[x.method] = (tally[x.method] || 0) + 1;
  console.log('tally:', JSON.stringify(tally));
  console.log('resolved URLs:', resolved.length, '| instances:', resolved.reduce((s, x) => s + x.count, 0));
  fs.writeFileSync(__dirname + '/round2-plan.json', JSON.stringify(out, null, 2));
  console.log('wrote round2-plan.json');
}

main().catch((e) => { console.error(e); process.exit(1); });
