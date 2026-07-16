/**
 * READ-ONLY resolver for the 724 distinct visible raw travel2egypt.org URLs.
 * Match order: static alias > redirect-map > wpUrl exact > per-locale slug.
 * Output: resolution plan JSON (url -> new root-relative path | UNRESOLVED).
 */
const fs = require('fs');
const { createClient } = require('@sanity/client');
require('dotenv').config();

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2024-12-01',
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN,
  useCdn: false,
});

const visibleDocs = require('./visible-docs.json');

function norm(u) {
  let s = String(u).trim();
  s = s.replace(/^https?:\/\/(www\.)?travel2egypt\.org/i, '');
  s = s.split('#')[0].split('?')[0];
  try { s = decodeURIComponent(s); } catch {}
  if (!s.startsWith('/')) s = '/' + s;
  if (s.length > 1 && s.endsWith('/')) s = s.slice(0, -1);
  return s.toLowerCase();
}

function urlLocale(p) {
  if (p.startsWith('/es/') || p === '/es') return 'es';
  if (p.startsWith('/ja/') || p === '/ja') return 'ja';
  return 'en';
}

// Root-relative route for a resolved doc, in the URL's locale, falling back to EN.
function routeFor(doc, locale) {
  const slugFor = (locKey) => (doc.slugs || []).find((s) => s._key === locKey)?.current;
  const pick = () => slugFor(locale) || slugFor('en');
  const prefix = locale === 'en' ? '' : `/${locale}`;
  const citySlug = () =>
    (doc.citySlugs || []).find((s) => s._key === locale)?.current ||
    (doc.citySlugs || []).find((s) => s._key === 'en')?.current;
  switch (doc._type) {
    case 'guideArticle': {
      const c = citySlug(); const s = pick();
      return c && s ? `${prefix}/guide/${c}/${s}` : null;
    }
    case 'city': { const s = pick(); return s ? `${prefix}/guide/${s}` : null; }
    case 'tour':
    case 'tourLanding':
    case 'editorialPage': { const s = pick(); return s ? `${prefix}/${s}` : null; }
    case 'travelTip': { const s = pick(); return s ? `${prefix}/travel-tips/${s}` : null; }
    case 'nileCruise': { const s = pick(); return s ? `${prefix}/nile-cruises/${s}` : null; }
    case 'hotel': { const s = pick(); return s ? `${prefix}/hotels/${s}` : null; }
    case 'article': { const s = doc.flatSlug; return s ? `${prefix}/blog/${s}` : null; }
    default: return null;
  }
}

const STATIC_ALIASES = {
  '/contact-us': '/contact',
  '/es/contact-us': '/es/contact',
  '/contact': '/contact',
  '/egypt-travel-packages': '/egypt-travel-packages',
  '/es/egypt-travel-packages': '/es/egypt-travel-packages',
  '/': '/',
  '/es': '/es',
  '/ja': '/ja',
};

async function main() {
  // redirect map
  const csv = fs.readFileSync('/Users/islamhussein/t2e/migration/redirect-map.csv', 'utf8');
  const mapFrom = new Map();
  for (const line of csv.split('\n').slice(1)) {
    const cols = line.split(',');
    if (!cols[0] || !cols[1]) continue;
    mapFrom.set(norm(cols[0]), cols[1]);
  }

  // wpUrl lookup + slug lookups from production
  const docs = await client.fetch(`
    *[!(_id in path('drafts.**')) && _type in ['guideArticle','city','tour','tourLanding','editorialPage','travelTip','nileCruise','hotel','article']]{
      _id, _type, hidden,
      "wpUrl": migration.wpUrl,
      "slugs": slug[]{_key, "current": value.current},
      "flatSlug": slug.current,
      "language": language,
      "citySlugs": parentCity->slug[]{_key, "current": value.current}
    }`);
  console.log('candidate target docs:', docs.length);

  const byWp = new Map();
  const bySlug = new Map(); // "<locale>:<slug>" -> [docs]
  for (const d of docs) {
    if (d.hidden === true) continue;
    if (d.wpUrl) {
      const k = norm(d.wpUrl);
      if (!byWp.has(k)) byWp.set(k, []);
      byWp.get(k).push(d);
    }
    for (const s of d.slugs || []) {
      const k = `${s._key}:${(s.current || '').toLowerCase()}`;
      if (!bySlug.has(k)) bySlug.set(k, []);
      bySlug.get(k).push(d);
    }
    if (d.flatSlug) {
      const loc = d.language || 'en';
      const k = `${loc}:${d.flatSlug.toLowerCase()}`;
      if (!bySlug.has(k)) bySlug.set(k, []);
      bySlug.get(k).push(d);
    }
  }

  // distinct visible URLs
  const urls = new Map();
  for (const d of visibleDocs) for (const h of d.hrefs) urls.set(h.href, (urls.get(h.href) || 0) + 1);

  const plan = [];
  const tally = { alias: 0, redirectMap: 0, wpUrl: 0, slug: 0, ambiguous: 0, unresolved: 0 };
  for (const [url, count] of urls) {
    const p = norm(url);
    const loc = urlLocale(p);
    let method = null, to = null, note = '';

    if (STATIC_ALIASES[p] !== undefined) { method = 'alias'; to = STATIC_ALIASES[p]; }
    else if (mapFrom.has(p)) { method = 'redirectMap'; to = mapFrom.get(p); }
    else if (byWp.has(p)) {
      const cands = byWp.get(p);
      if (cands.length === 1) { method = 'wpUrl'; to = routeFor(cands[0], loc); note = cands[0]._id; }
      else {
        // language-variant siblings (wp-post-*-en/es/ja): pick the URL's locale
        const byLang = cands.filter((c) => (c.language || 'en') === loc);
        if (byLang.length === 1) { method = 'wpUrlLocale'; to = routeFor(byLang[0], loc); note = byLang[0]._id; }
        else { method = 'ambiguous'; note = 'wpUrl multi: ' + cands.map((c) => c._id).join('|'); }
      }
    } else {
      // per-locale slug: last path segment
      const seg = p.split('/').filter(Boolean).pop();
      const cands = bySlug.get(`${loc}:${seg}`) || [];
      const uniq = [...new Map(cands.map((c) => [c._id, c])).values()];
      if (uniq.length === 1) { method = 'slug'; to = routeFor(uniq[0], loc); note = uniq[0]._id; }
      else if (uniq.length > 1) { method = 'ambiguous'; note = 'slug multi: ' + uniq.map((c) => c._id).join('|'); }
    }

    if (method && to) tally[method] = (tally[method] || 0) + 1;
    else if (method === 'ambiguous') tally.ambiguous++;
    else { method = method || 'unresolved'; tally.unresolved++; }
    plan.push({ url, path: p, locale: loc, count, method, to, note });
  }

  const inst = (f) => plan.filter(f).reduce((s, x) => s + x.count, 0);
  console.log('\nDistinct URL tally:', JSON.stringify(tally, null, 2));
  console.log('Resolved instances  :', inst((x) => x.to));
  console.log('Ambiguous instances :', inst((x) => x.method === 'ambiguous'));
  console.log('Unresolved instances:', inst((x) => !x.to && x.method !== 'ambiguous'));

  fs.writeFileSync(process.cwd() + '/docs/raw-link-sweep-2026-07-17/resolution-plan.json', JSON.stringify(plan, null, 2));
  console.log('Wrote resolution-plan.json');

  console.log('\nSample UNRESOLVED (top 20 by count):');
  plan.filter((x) => !x.to && x.method !== 'ambiguous').sort((a, b) => b.count - a.count).slice(0, 20)
    .forEach((x) => console.log(String(x.count).padStart(4), x.path));
}

main().catch((e) => { console.error(e); process.exit(1); });
