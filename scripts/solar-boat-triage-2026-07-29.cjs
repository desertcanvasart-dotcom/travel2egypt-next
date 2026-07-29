/**
 * READ-ONLY Solar Boat mention sweep + triage pre-classification (2026-07-29).
 * Context: the Khufu Solar Boat moved to the Grand Egyptian Museum (GEM);
 * the on-site Giza boat museum is closed. Any copy that claims the boat is
 * at Giza / the museum is open on-site is stale.
 *
 * Scans every published doc's portable-text spans for mention terms
 * (EN/ES/JA), captures block-level context, and pre-classifies each mention:
 *   GEM_AWARE   — block already mentions GEM / Grand Egyptian Museum / 大エジプト博物館
 *   STALE_CLAIM — block claims on-site presence (museum, "beside the pyramid",
 *                 visit/see it at Giza wording)
 *   NEUTRAL     — historical/passing mention with no location claim
 * Classification is a first pass for owner review, not a verdict.
 *
 * Output: docs/solar-boat-triage-2026-07-29.csv + summary JSON.
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

const TERM = /solar\s+boat|solar\s+barque|solar\s+ship|khufu\s+(boat|ship)|barc[ao]\s+solar|太陽の船|太陽の舟|太陽神の船/i;
const GEM = /grand\s+egyptian\s+museum|\bGEM\b|gran\s+museo\s+egipcio|大エジプト博物館|グランド・?エジプシャン・?ミュージアム/i;
const STALE = /museum|museo|博物館|beside\s+the\s+(great\s+)?pyramid|next\s+to\s+the\s+(great\s+)?pyramid|south(ern)?\s+side|junto\s+a\s+la\s+(gran\s+)?pir[aá]mide|al\s+lado\s+de\s+la\s+pir[aá]mide|ピラミッドの(そば|隣|南)/i;

// Collect text per block: walk any object that has children[] of spans,
// keeping the field path + nearest locale _key (body[_key=="es"] etc.).
function* blocks(node, path, locale) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) yield* blocks(node[i], `${path}[${i}]`, locale);
    return;
  }
  // internationalized-array item: {_key: 'en'|'es'|'ja', value: [...]}
  if (typeof node._key === 'string' && ['en', 'es', 'ja'].includes(node._key) && node.value !== undefined) {
    yield* blocks(node.value, `${path}[_key=="${node._key}"].value`, node._key);
    return;
  }
  if (Array.isArray(node.children)) {
    const text = node.children.map((c) => (typeof c.text === 'string' ? c.text : '')).join('');
    if (text) yield { text, path, locale, blockKey: node._key };
  }
  for (const [k, v] of Object.entries(node)) {
    if (k === 'children' || k.startsWith('_')) continue;
    yield* blocks(v, `${path}.${k}`, locale);
  }
}

// Plain string fields worth checking too (summary/standfirst live outside body).
function* stringFields(node, path, locale) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) yield* stringFields(node[i], `${path}[${i}]`, locale);
    return;
  }
  if (typeof node._key === 'string' && ['en', 'es', 'ja'].includes(node._key) && node.value !== undefined) {
    if (typeof node.value === 'string') { yield { text: node.value, path: `${path}[_key=="${node._key}"].value`, locale: node._key }; return; }
    yield* stringFields(node.value, `${path}[_key=="${node._key}"].value`, node._key);
    return;
  }
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('_') || k === 'children') continue;
    if (typeof v === 'string' && v.length > 30) yield { text: v, path: `${path}.${k}`, locale };
    else if (typeof v === 'object') yield* stringFields(v, `${path}.${k}`, locale);
  }
}

const csvEsc = (s) => '"' + String(s ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"';

async function main() {
  const types = ['tour', 'guideArticle', 'article', 'wikiMonument', 'travelTip', 'city', 'tourLanding', 'editorialPage', 'nileCruise', 'fieldGuide', 'hotel'];
  const rows = [];
  const docTally = new Map();
  let scanned = 0;
  for (const type of types) {
    let offset = 0;
    for (;;) {
      const docs = await client.fetch(
        `*[_type == $type && !(_id in path('drafts.**'))] | order(_id) [${offset}...${offset + 200}]{..., "titleEn": coalesce(title[_key=="en"][0].value, title), "slugEn": coalesce(slug[_key=="en"][0].value.current, slug.current)}`,
        { type }
      );
      if (!docs.length) break;
      scanned += docs.length;
      for (const doc of docs) {
        const seen = new Set();
        const mentions = [];
        for (const b of blocks(doc, '', doc.language || 'en')) {
          if (!TERM.test(b.text)) continue;
          const sig = b.path + '|' + b.text.slice(0, 40);
          if (seen.has(sig)) continue;
          seen.add(sig);
          mentions.push(b);
        }
        for (const s of stringFields(doc, '', doc.language || 'en')) {
          if (!TERM.test(s.text)) continue;
          const sig = s.path + '|' + s.text.slice(0, 40);
          if (seen.has(sig)) continue;
          seen.add(sig);
          mentions.push(s);
        }
        if (!mentions.length) continue;
        docTally.set(doc._type, (docTally.get(doc._type) || 0) + 1);
        for (const m of mentions) {
          const klass = GEM.test(m.text) ? 'GEM_AWARE' : STALE.test(m.text) ? 'STALE_CLAIM' : 'NEUTRAL';
          // trim context to the sentence(s) around the term
          const idx = m.text.search(TERM);
          const ctx = m.text.slice(Math.max(0, idx - 200), idx + 260);
          rows.push({
            _id: doc._id, _type: doc._type, hidden: doc.hidden === true,
            title: typeof doc.titleEn === 'string' ? doc.titleEn : '',
            slug: doc.slugEn || '', locale: m.locale || 'en',
            field: m.path.replace(/^\./, ''), klass, context: ctx,
          });
        }
      }
      offset += 200;
      if (docs.length < 200) break;
    }
  }

  rows.sort((a, b) => (a.klass === b.klass ? a._id.localeCompare(b._id) : a.klass.localeCompare(b.klass)));
  const header = 'class,doc_id,doc_type,hidden,locale,title,slug,field_path,context,owner_decision';
  const csv = [header, ...rows.map((r) =>
    [r.klass, r._id, r._type, r.hidden ? 'HIDDEN' : '', r.locale, csvEsc(r.title), r.slug, r.field, csvEsc(r.context), ''].join(',')
  )].join('\n');
  fs.writeFileSync(__dirname + '/../docs/solar-boat-triage-2026-07-29.csv', csv);

  const byClass = rows.reduce((m, r) => ((m[r.klass] = (m[r.klass] || 0) + 1), m), {});
  console.log('scanned published docs:', scanned);
  console.log('docs with mentions:', [...docTally.entries()].map(([t, n]) => `${t}:${n}`).join(' '));
  console.log('mentions by class:', JSON.stringify(byClass));
  console.log('hidden-doc mentions:', rows.filter((r) => r.hidden).length);
  console.log('rows:', rows.length, '→ docs/solar-boat-triage-2026-07-29.csv');
}

main().catch((e) => { console.error(e); process.exit(1); });
