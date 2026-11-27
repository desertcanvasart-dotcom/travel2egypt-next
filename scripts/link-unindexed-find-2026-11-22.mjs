/**
 * FIND step (read-only): in-content internal links for the 16 real pages that Google crawled but chose not to
 * index ("Crawled – currently not indexed", GSC export 22 Nov 2026). For each (target page, language Google
 * flagged) it looks for an unmarked, natural mention of the page's topic in other PUBLISHED docs of the same
 * language that do not link to the target yet. Output: a JSON file of candidates to review (APPLY is a
 * separate script, link-unindexed-apply-2026-11-22.mjs).
 *
 *   node --env-file=<.env> scripts/link-unindexed-find-2026-11-22.mjs <out.json>
 */
import { createClient } from '@sanity/client';
import { writeFileSync } from 'node:fs';

const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-05-23', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false, perspective: 'published' });
const OUT = process.argv[2] ?? 'link-candidates.json';

// [target _id, language Google flagged, aliases (longest first), sameCity?: only docs about the target's city]
const TARGETS = [
  ['guideArticle.abu-simbel.the-great-temple-of-abu-simbel', 'en', ['Great Temple of Abu Simbel', "Abu Simbel's Great Temple", 'Great Temple at Abu Simbel']],
  ['wp-page-60788', 'en', ['Temple of Seti I at Abydos', 'Abydos Temple', 'Temple of Abydos']],
  ['tour.royal-seascope-submarine-hurghada', 'en', ['Royal Seascope Semi-Submarine', 'Royal Seascope', 'Hurghada semi-submarine', 'semi-submarine']],
  ['wp-page-63552', 'en', ['Hilton Luxor Resort & Spa', 'Hilton Luxor']],
  ['wp-page-60797', 'ja', ['バラムス修道院', 'パロメオス修道院']],
  ['wp-page-72314', 'es', ['precios de las entradas a las atracciones de Asuán', 'precios de las entradas de Asuán'], true],
  ['tourLanding.authentic-dahabiya-nile-cruise', 'ja', ['本格ダハビーヤのナイル・クルーズ', 'ダハビーヤのナイル・クルーズ', 'ダハビーヤ・クルーズ']],
  ['hotel.taziry-ecolodge-siwa-safari', 'es', ['Taziry Ecolodge', 'Taziry']],
  ['wp-page-59165', 'ja', ['アレクサンドリアで見るべきこと', 'アレクサンドリアの見どころ']],
  ['guideArticle.beni-suef.ehnasya-el-medina', 'ja', ['イフナシヤ・エル・メディーナ', 'イフナシヤ・エル・メディナ']],
  ['guideArticle.giza.pyramid-of-djedefre-at-abu-rawash', 'es', ['pirámide de Dyedefra en Abu Rawash', 'Pirámide de Dyedefra', 'pirámide de Dyedefra']],
  ['guideArticle.saint-catherine.serabit-el-khadim', 'en', ['Serabit el-Khadim', 'Serabit el-Khadem']],
  ['guideArticle.bahariya-oasis.valley-of-the-golden-mummies', 'es', ['Valle de las Momias Doradas', 'valle de las momias doradas']],
  ['wp-page-58573', 'es', ['mejor época para visitar Al Fayoum', 'mejor época para visitar El Fayum', 'clima de Al Fayoum'], true],
  ['wp-page-90326', 'es', ['Pasaje real del Nilo', 'crucero de 13 días de El Cairo a Luxor']],
  ['wp-page-88972', 'en', ['8-Day Luxor Retreat', 'Luxor Retreat']],
];

const SOURCE_TYPES = ['guideArticle', 'wikiMonument', 'article', 'tour', 'tourLanding', 'travelTip', 'hotel'];
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const spanText = (b) => (b.children ?? []).map((x) => x.text ?? '').join('');
const out = [];
for (const [tid, loc, aliases, sameCity] of TARGETS) {
  const t = await c.getDocument(tid);
  if (!t) { console.log('MISSING target', tid); continue; }
  const tcity = (await c.fetch('coalesce(*[_id==$id][0].parentCity->slug[_key=="en"][0].value.current, *[_id==$id][0].cities[0]->slug[_key=="en"][0].value.current)', { id: tid })) ?? null;
  const docs = await c.fetch(`*[_type in $types && !(_id in path("drafts.**")) && _id != $tid && !(defined(language) && language != $loc)]{_id, _type, language, hidden, "city": coalesce(parentCity->slug[_key=="en"][0].value.current, cities[0]->slug[_key=="en"][0].value.current), body}`, { types: SOURCE_TYPES, tid, loc });
  let n = 0;
  for (const d of docs) {
    if (d.hidden) continue;
    if (sameCity && tcity && d.city !== tcity) continue;
    const rows = Array.isArray(d.body) && d.body[0]?._key && Array.isArray(d.body[0].value) ? d.body.filter((r) => r._key === loc).map((r) => r.value) : d.language === loc ? [d.body] : [];
    for (const blocks of rows) {
      if (!Array.isArray(blocks)) continue;
      if (JSON.stringify(blocks).includes(`"_ref":"${tid}"`)) continue; // already links the target
      let found = false;
      for (const b of blocks) {
        if (found) break;
        if (b._type !== 'block' || (b.style && b.style !== 'normal')) continue;
        for (const [si, s] of (b.children ?? []).entries()) {
          if (s.marks?.length) continue;
          for (const a of aliases) {
            const rx = loc === 'ja' ? new RegExp(esc(a)) : new RegExp(`(?<![\\p{L}\\p{N}])${esc(a)}(?![\\p{L}\\p{N}])`, 'u');
            const m = rx.exec(s.text ?? '');
            if (!m) continue;
            out.push({ target: tid, loc, source: d._id, sourceType: d._type, sourceCity: d.city, targetCity: tcity, block: b._key, span: si, phrase: a, matched: m[0], context: spanText(b).slice(Math.max(0, spanText(b).indexOf(m[0]) - 60), spanText(b).indexOf(m[0]) + m[0].length + 60) });
            found = true; n++; break;
          }
          if (found) break;
        }
      }
    }
  }
  console.log(`${tid.slice(0, 52).padEnd(52)} ${loc} cityTarget=${tcity} → ${n} candidate(s)`);
}
writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log('total', out.length, '→', OUT);
