/**
 * JA title-match tier: match Japanese-script location slugs against docs'
 * JA titles (containment / bigram). Unique best ≥ 0.85 accepted. READ-ONLY.
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

const chase = require('./chase-301-plan.json');
const unchasedJa = chase.filter((x) => !x.to && /[぀-ヿ一-鿿]/.test(x.locPath));

const clean = (s) => s.replace(/[\s・、。「」（）()：:\-–—]/g, '');
const bigrams = (s) => { const o = new Set(); const t = clean(s); for (let i = 0; i < t.length - 1; i++) o.add(t.slice(i, i + 2)); return o; };
const overlap = (a, b) => { if (!a.size || !b.size) return 0; let n = 0; for (const x of a) if (b.has(x)) n++; return n / Math.min(a.size, b.size); };
function jsim(a, b) {
  const x = clean(a), y = clean(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  if (y.includes(x) || x.includes(y)) return 0.97;
  return overlap(bigrams(a), bigrams(b));
}

async function main() {
  const docs = await client.fetch(`
    *[!(_id in path('drafts.**')) && hidden != true && _type in ['guideArticle','city','tour','tourLanding','editorialPage','travelTip','nileCruise','hotel','article']]{
      _id, _type, language,
      "jaTitle": title[_key=='ja'][0].value,
      "flatTitle": select(!defined(title[0]._key) => title, null),
      "jaSlug": slug[_key=='ja'][0].value.current,
      "enSlug": slug[_key=='en'][0].value.current,
      "flatSlug": slug.current,
      "jaCity": parentCity->slug[_key=='ja'][0].value.current,
      "enCity": parentCity->slug[_key=='en'][0].value.current
    }`);
  const jaDocs = docs.filter((d) => d.jaTitle || (d.language === 'ja' && d.flatTitle));
  console.log('docs with JA titles:', jaDocs.length);

  function routeFor(d) {
    const s = d.jaSlug || d.enSlug || d.flatSlug;
    if (!s) return null;
    switch (d._type) {
      case 'guideArticle': { const c = d.jaCity || d.enCity; return c ? `/ja/guide/${c}/${s}` : null; }
      case 'city': return `/ja/guide/${s}`;
      case 'tour': case 'tourLanding': case 'editorialPage': return `/ja/${s}`;
      case 'travelTip': return `/ja/travel-tips/${s}`;
      case 'nileCruise': return `/ja/nile-cruises/${s}`;
      case 'hotel': return `/ja/hotels/${s}`;
      case 'article': return `/ja/blog/${d.flatSlug}`;
      default: return null;
    }
  }

  const out = [];
  for (const u of unchasedJa) {
    const q = decodeURIComponent(u.locPath).split('/').filter(Boolean).pop();
    let best = null, bestScore = 0, second = 0;
    for (const d of jaDocs) {
      const t = d.jaTitle || d.flatTitle;
      const sc = jsim(q, t);
      if (sc > bestScore) { second = bestScore; bestScore = sc; best = d; }
      else if (sc > second) second = sc;
    }
    const ok = bestScore >= 0.85 && (bestScore - second >= 0.1 || bestScore === 1);
    out.push({ url: u.url, path: u.path, count: u.count, query: q, to: ok ? routeFor(best) : null, score: bestScore, second, target: best ? best._id + ' "' + (best.jaTitle || best.flatTitle) + '"' : '' });
  }
  const ok = out.filter((x) => x.to);
  console.log('JA-title resolved:', ok.length, '/', unchasedJa.length);
  fs.writeFileSync(__dirname + '/ja-title-plan.json', JSON.stringify(out, null, 2));
  for (const x of out) console.log((x.to ? 'OK  ' : 'MISS'), x.score.toFixed(2) + '/' + x.second.toFixed(2), x.query, '=>', x.to || x.target);
}

main().catch((e) => { console.error(e); process.exit(1); });
