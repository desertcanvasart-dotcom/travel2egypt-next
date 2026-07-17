/**
 * Chase old-site 301 Locations through the exact resolver tiers.
 * For each parked URL whose old-site 301 Location resolves (redirect-map,
 * wpUrl, locale-variant, unique per-locale slug), the ORIGINAL raw URL can be
 * re-pointed to that resolved new-site path. READ-ONLY.
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

const locations = require('./parked-301-locations.json');

function norm(u) {
  let s = String(u).trim();
  s = s.replace(/^https?:\/\/(www\.)?travel2egypt\.org/i, '');
  s = s.split('#')[0].split('?')[0];
  try { s = decodeURIComponent(s); } catch {}
  if (!s.startsWith('/')) s = '/' + s;
  if (s.length > 1 && s.endsWith('/')) s = s.slice(0, -1);
  return s.toLowerCase();
}
function urlLocale(p) { return p.startsWith('/es/') || p === '/es' ? 'es' : p.startsWith('/ja/') || p === '/ja' ? 'ja' : 'en'; }

async function main() {
  const csv = fs.readFileSync('/Users/islamhussein/t2e/migration/redirect-map.csv', 'utf8');
  const mapFrom = new Map();
  for (const line of csv.split('\n').slice(1)) {
    const cols = line.split(',');
    if (cols[0] && cols[1]) mapFrom.set(norm(cols[0]), cols[1]);
  }
  const docs = await client.fetch(`
    *[!(_id in path('drafts.**')) && hidden != true && _type in ['guideArticle','city','tour','tourLanding','editorialPage','travelTip','nileCruise','hotel','article']]{
      _id, _type, language,
      "wpUrl": migration.wpUrl,
      "slugs": slug[]{_key, "current": value.current},
      "flatSlug": slug.current,
      "citySlugs": parentCity->slug[]{_key, "current": value.current}
    }`);
  const byWp = new Map(), bySlug = new Map();
  for (const d of docs) {
    if (d.wpUrl) { const k = norm(d.wpUrl); (byWp.get(k) || byWp.set(k, []).get(k)).push(d); }
    for (const s of d.slugs || []) { const k = `${s._key}:${(s.current || '').toLowerCase()}`; (bySlug.get(k) || bySlug.set(k, []).get(k)).push(d); }
    if (d.flatSlug) { const k = `${d.language || 'en'}:${d.flatSlug.toLowerCase()}`; (bySlug.get(k) || bySlug.set(k, []).get(k)).push(d); }
  }
  const slugOf = (d, loc) => (d.slugs || []).find((s) => s._key === loc)?.current || (d.slugs || []).find((s) => s._key === 'en')?.current || d.flatSlug;
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

  const out = [];
  const tally = {};
  for (const item of locations) {
    if (!item.location) continue;
    const p = norm(item.location);
    const loc = urlLocale(p);
    let method = 'unchased', to = null, note = '';
    if (mapFrom.has(p)) { method = 'redirectMap'; to = mapFrom.get(p); }
    else if (byWp.has(p)) {
      const c = byWp.get(p);
      if (c.length === 1) { method = 'wpUrl'; to = routeFor(c[0], loc); note = c[0]._id; }
      else { const bl = c.filter((x) => (x.language || 'en') === loc); if (bl.length === 1) { method = 'wpUrlLocale'; to = routeFor(bl[0], loc); note = bl[0]._id; } }
    }
    if (!to) {
      const seg = p.split('/').filter(Boolean).pop();
      const cands = [...new Map((bySlug.get(`${loc}:${seg}`) || []).map((c) => [c._id, c])).values()];
      if (cands.length === 1) { method = 'slug'; to = routeFor(cands[0], loc); note = cands[0]._id; }
    }
    tally[to ? method : 'unchased'] = (tally[to ? method : 'unchased'] || 0) + 1;
    out.push({ url: item.url, path: item.path, location: item.location, locPath: p, locale: loc, count: item.count, method: to ? method : 'unchased', to, note });
  }
  console.log('tally:', JSON.stringify(tally));
  const ok = out.filter((x) => x.to);
  console.log('chased-resolved:', ok.length, 'URLs /', ok.reduce((s, x) => s + x.count, 0), 'instances');
  fs.writeFileSync(__dirname + '/chase-301-plan.json', JSON.stringify(out, null, 2));
  console.log('unchased samples:');
  out.filter((x) => !x.to).slice(0, 15).forEach((x) => console.log(' ', x.count, x.path, '=>', x.locPath));
}

main().catch((e) => { console.error(e); process.exit(1); });
