/**
 * READ-ONLY re-verification of the raw travel2egypt.org link state (2026-07-29).
 * Input: scripts/raw-links-remaining.json (fresh audit-raw-links run).
 * Splits hits into moot (hidden / redirected-away pages) vs user-visible,
 * then checks every visible href path against: static aliases, the redirect
 * map, and native new-site routes. Anything in none of those buckets breaks
 * at DNS cutover.
 * Output: scripts/raw-link-recheck-2026-07-29.json + console summary.
 */
const fs = require('fs');
const { createClient } = require('@sanity/client');
require('dotenv').config();

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2024-12-01',
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const audit = require('./raw-links-remaining.json');

function norm(u) {
  let s = String(u).trim();
  s = s.replace(/^https?:\/\/(www\.)?travel2egypt\.org/i, '');
  s = s.split('#')[0].split('?')[0];
  try { s = decodeURIComponent(s); } catch {}
  if (!s.startsWith('/')) s = '/' + s;
  if (s.length > 1 && s.endsWith('/')) s = s.slice(0, -1);
  return s.toLowerCase();
}

async function main() {
  // 1. Visibility of the 354 carrier docs.
  const ids = audit.perDoc.map((d) => d._id);
  const carriers = await client.fetch(
    `*[_id in $ids]{_id, _type, hidden, "wpSlug": slug.current}`,
    { ids }
  );
  const carrierById = new Map(carriers.map((c) => [c._id, c]));

  // Redirect map: normalized from-paths.
  const csv = fs.readFileSync(__dirname + '/../migration/redirect-map.csv', 'utf8');
  const mapFrom = new Set();
  for (const line of csv.split('\n').slice(1)) {
    const from = line.split(',')[0];
    if (from) mapFrom.add(norm(from));
  }

  // 2. Classify carriers. wikiMonument pages are all redirect-mapped away
  //    (never render); hidden docs never render.
  const buckets = { wikiMonument: 0, hidden: 0, visible: 0 };
  const visibleDocs = [];
  for (const d of audit.perDoc) {
    const c = carrierById.get(d._id);
    if (!c) { buckets.hidden += d.count; continue; }
    if (c._type === 'wikiMonument') { buckets.wikiMonument += d.count; continue; }
    if (c.hidden === true) { buckets.hidden += d.count; continue; }
    buckets.visible += d.count;
    visibleDocs.push(d);
  }

  // 3. Native-route lookup: every slug that resolves on the new site.
  const routable = await client.fetch(`
    *[!(_id in path('drafts.**')) && _type in ['guideArticle','city','tour','tourLanding','editorialPage','travelTip','nileCruise','hotel','article'] && hidden != true]{
      _type,
      "slugs": select(
        defined(slug[]) => slug[]{_key, "current": value.current},
        defined(slug.current) => [{"_key": coalesce(language,'en'), "current": slug.current}],
        []
      ),
      "citySlugs": parentCity->slug[]{_key, "current": value.current}
    }`);
  const nativePaths = new Set(['/', '/es', '/ja', '/blog', '/es/blog', '/ja/blog',
    '/contact', '/faq', '/plan-your-tour', '/private-day-tours', '/group-day-tours',
    '/egypt-travel-packages', '/nile-cruises', '/hotels', '/travel-tips']);
  for (const loc of ['es', 'ja'])
    for (const p of ['contact','faq','plan-your-tour','private-day-tours','group-day-tours','egypt-travel-packages','nile-cruises','hotels','travel-tips'])
      nativePaths.add(`/${loc}/${p}`);
  for (const d of routable) {
    for (const s of d.slugs || []) {
      if (!s.current) continue;
      const loc = s._key || 'en';
      const prefix = loc === 'en' ? '' : `/${loc}`;
      const slug = s.current.toLowerCase();
      switch (d._type) {
        case 'guideArticle': {
          const c = (d.citySlugs || []).find((x) => x._key === loc)?.current
            || (d.citySlugs || []).find((x) => x._key === 'en')?.current;
          if (c) nativePaths.add(`${prefix}/guide/${c.toLowerCase()}/${slug}`);
          break;
        }
        case 'city': nativePaths.add(`${prefix}/guide/${slug}`); break;
        case 'travelTip': nativePaths.add(`${prefix}/travel-tips/${slug}`); break;
        case 'nileCruise': nativePaths.add(`${prefix}/nile-cruises/${slug}`); break;
        case 'hotel': nativePaths.add(`${prefix}/hotels/${slug}`); break;
        case 'article': nativePaths.add(`${prefix}/blog/${slug}`); break;
        default: nativePaths.add(`${prefix}/${slug}`);
      }
    }
  }

  // 4. Check every visible href.
  const tally = { native: 0, redirectMap: 0, mailto: 0, BROKEN: 0 };
  const broken = new Map(); // path -> {count, urls:Set, docs:Set}
  for (const d of visibleDocs) {
    for (const h of d.hrefs) {
      const p = norm(h.href);
      let klass;
      if (p.startsWith('/mailto:')) klass = 'mailto';
      else if (nativePaths.has(p)) klass = 'native';
      else if (mapFrom.has(p)) klass = 'redirectMap';
      else klass = 'BROKEN';
      tally[klass]++;
      if (klass === 'BROKEN') {
        if (!broken.has(p)) broken.set(p, { count: 0, urls: new Set(), docs: new Set() });
        const b = broken.get(p);
        b.count++; b.urls.add(h.href); b.docs.add(d._id);
      }
    }
  }

  console.log('Carrier instance buckets:', JSON.stringify(buckets, null, 2));
  console.log('Visible docs:', visibleDocs.length);
  console.log('Visible href classification:', JSON.stringify(tally, null, 2));
  console.log('\nBROKEN distinct paths:', broken.size);
  const rows = [...broken.entries()].sort((a, b) => b[1].count - a[1].count)
    .map(([p, b]) => ({ path: p, count: b.count, urls: [...b.urls], docs: [...b.docs] }));
  rows.slice(0, 40).forEach((r) => console.log(String(r.count).padStart(4), r.path, ' [' + r.docs.slice(0, 3).join(', ') + (r.docs.length > 3 ? ', …' : '') + ']'));

  fs.writeFileSync(__dirname + '/raw-link-recheck-2026-07-29.json',
    JSON.stringify({ buckets, tally, broken: rows, visibleDocIds: visibleDocs.map((d) => d._id) }, null, 2));
  console.log('\nWrote raw-link-recheck-2026-07-29.json');
}

main().catch((e) => { console.error(e); process.exit(1); });
