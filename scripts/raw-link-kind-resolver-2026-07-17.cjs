/**
 * Kind-keyword resolver over all remaining triage URLs. READ-ONLY.
 * - city-guide-topic URLs: city from segment 1, kind from segment 2 keywords
 * - flat URLs: kind keywords + trailing city alias
 * Target only when that city has exactly ONE page of that kind.
 * Everything else falls back per approved policy (city guide root; tours →
 * packages/day-tours index) — emitted separately for redirect rows only.
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

const buckets = require('./triage-remaining.json');

const KIND_PATTERNS = [
  ['climate', /clima|tiempo|cuando-visitar|mejor-momento|mejor-epoca|best-time|weather|天気|気候|気温|ベストシーズン/],
  ['transport-around', /como-moverse|moverse-en|getting-around|move-around|移動手段|の移動/],
  ['transport-to', /como-llegar|como-ir|getting-to|how-to-get|how-to-go|交通手段|行き方|への行き方/],
  ['accommodation', /hoteles|alojamiento|alojarse|donde-dormir|hospedarse|hotels|where-to-stay|宿泊/],
  ['food', /gastronomia|donde-comer|sabores|restaurantes|comida|culinar|dining|food|グルメ|料理|食事/],
  ['heritage', /historia|antecedentes-historicos|history|歴史/],
  ['tours', /tours|excursiones|recorridos|ツアー/],
  ['things-to-do', /que-hacer|cosas-que-hacer|actividades|things-to-do|アクティビティ|やるべきこと/],
  ['events', /eventos|fiestas|festivales|events|イベント|祭り/],
  ['signature', /solo-aqui|unicamente-en|only-in|solo-(?!viaj)/],
];

function urlLocale(p) { return p.startsWith('/es/') ? 'es' : p.startsWith('/ja/') ? 'ja' : 'en'; }

async function main() {
  const cities = await client.fetch(`
    *[_type=='city' && !(_id in path('drafts.**'))]{
      _id,
      "en": slug[_key=='en'][0].value.current, "es": slug[_key=='es'][0].value.current, "ja": slug[_key=='ja'][0].value.current,
      "titles": title[]{_key, value},
      "articles": *[_type=='guideArticle' && !(_id in path('drafts.**')) && hidden != true && parentCity._ref == ^._id]{
        kind, "en": slug[_key=='en'][0].value.current, "es": slug[_key=='es'][0].value.current, "ja": slug[_key=='ja'][0].value.current
      }
    }`);
  console.log('cities:', cities.length);

  // city alias table: slugs + normalized title variants
  const aliases = [];
  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  for (const c of cities) {
    const names = new Set([c.en, c.es, c.ja].filter(Boolean).map(norm));
    for (const t of c.titles || []) if (t.value) names.add(norm(t.value).replace(/\s+/g, '-'));
    // common variants
    for (const n of [...names]) {
      names.add(n.replace(/^el-|^la-|^oasis-de-|^el-oasis-de-/, ''));
      names.add(n.replace(/-oasis$/, ''));
    }
    aliases.push({ city: c, names: [...names].filter((n) => n && n.length >= 3) });
  }
  // JA city names (Japanese script) from titles
  const findCity = (text) => {
    const t = norm(decodeURIComponent(text));
    let best = null, bestLen = 0;
    for (const a of aliases) for (const n of a.names) {
      if (t.includes(n) && n.length > bestLen) { best = a.city; bestLen = n.length; }
    }
    return best;
  };

  const cityRoot = (c, loc) => {
    const s = c[loc] || c.en;
    return (loc === 'en' ? '' : `/${loc}`) + `/guide/${s}`;
  };
  const kindPage = (c, kind, loc) => {
    const pages = (c.articles || []).filter((a) => a.kind === kind);
    if (pages.length !== 1) return null;
    const s = pages[0][loc] || pages[0].en;
    if (!s) return null;
    return (loc === 'en' ? '' : `/${loc}`) + `/guide/${c[loc] || c.en}/${s}`;
  };

  const out = { kindResolved: [], cityFallback: [], tourFallback: [], other: [] };
  for (const [bucket, arr] of Object.entries(buckets)) {
    for (const e of arr) {
      const p = decodeURIComponent(e.path);
      const loc = urlLocale(p);
      const segs = p.split('/').filter(Boolean).filter((s) => s !== 'es' && s !== 'ja');
      let city = null, kindSrc = '';
      if (bucket === 'city-guide-topic') { city = findCity(segs[0]); kindSrc = segs[1] || ''; }
      else if (bucket === 'flat-localized' || bucket === 'flat-en') { kindSrc = segs[0] || ''; city = findCity(segs[0]); }
      let kind = null;
      for (const [k, re] of KIND_PATTERNS) { if (re.test(norm(kindSrc)) || re.test(kindSrc)) { kind = k; break; } }

      if (city && kind) {
        const to = kindPage(city, kind, loc);
        if (to) { out.kindResolved.push({ ...e, locale: loc, to, kind, city: city.en, bucket }); continue; }
      }
      if (bucket === 'city-guide-topic' && city) { out.cityFallback.push({ ...e, locale: loc, to: cityRoot(city, loc), city: city.en }); continue; }
      // tour-ish flats: day/package words
      if (/excursion|tour|crucero|viaje-de|dias|day|paquete|traslado|safari|snorkel|ツアー|クルーズ/i.test(norm(p)) && bucket !== 'category') {
        out.tourFallback.push({ ...e, locale: loc });
        continue;
      }
      out.other.push({ ...e, locale: loc, bucket, cityGuess: city ? city.en : null, kindGuess: kind });
    }
  }
  for (const [k, arr] of Object.entries(out)) {
    console.log('==', k, ':', arr.length, 'URLs /', arr.reduce((s, x) => s + x.count, 0), 'instances');
  }
  fs.writeFileSync(__dirname + '/kind-resolution.json', JSON.stringify(out, null, 2));
  console.log('\nkindResolved samples:');
  out.kindResolved.slice(0, 25).forEach((x) => console.log(' ', x.count, x.path, '=>', x.to));
  console.log('\nother (needs hand look):');
  out.other.forEach((x) => console.log(' ', x.count, `[${x.bucket}]`, x.path, x.cityGuess ? `(city:${x.cityGuess})` : ''));
}

main().catch((e) => { console.error(e); process.exit(1); });
