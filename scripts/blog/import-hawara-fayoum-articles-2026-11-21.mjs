/**
 * Two native trilingual History articles by Faris Hussein, from the owner's
 * locked copy (review/locked/blog/, byte-for-byte copies of the owner's files
 * of 21 Nov 2026):
 *
 *   "Egypt’s Lost Labyrinth at Hawara"   article.hawara-labyrinth-{en,es,ja}  + tmeta.hawara-labyrinth
 *   "The Fayoum Portraits"               article.fayoum-portraits-{en,es,ja}  + tmeta.fayoum-portraits
 *
 * Pattern = the 2027 eclipse article (scripts/create-eclipse-article.ts): one
 * `article` doc per language with its own slug/deck/body/heroImage, linked by
 * one `translation.metadata` doc. Markdown → Portable Text: scripts/blog/md-to-pt.mjs
 * (the eclipse converter, extended for links, lists, the FAQ field and tables).
 *
 * Gates (docs/content-canon.md): content-lint on the six locked files, the
 * verbatim pre-flight on every string written (plus a line-for-line check that
 * no source line is dropped or altered), and the numeric gate ES/JA vs EN.
 *
 *   node --env-file=/Users/islamhussein/t2e/.env scripts/blog/import-hawara-fayoum-articles-2026-11-21.mjs              # dry run
 *   npx tsx --env-file=/Users/islamhussein/t2e/.env scripts/blog/import-hawara-fayoum-articles-2026-11-21.mjs --preview <out.json>
 *   node --env-file=… scripts/blog/import-hawara-fayoum-articles-2026-11-21.mjs --apply --flags-approved [--only hawara|fayoum] [--allow-no-hero]
 *
 * --preview renders each new doc through the real articleBySlugQuery (groq-js,
 * in memory: the new docs + the production docs they reference) and lists every
 * resolved link. Nothing is written to Sanity except with --apply.
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';
import { parseArticle, injectLink, makeKeys, blockText, stripMd } from './md-to-pt.mjs';

const ROOT = new URL('../../', import.meta.url);
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const LANGS = ['en', 'es', 'ja'];

/* ── Shared refs (checked in production 21 Nov 2026) ──────────────────── */
const AUTHOR = 'author.faris-hussein';
const CATEGORY = 'wp-category-72'; // History · Historia · 歴史 (leaf; parent category-destination)
const FAYOUM_CITY = 'wp-page-58530'; // Al Fayoum

// Guide pages (internationalized: one ref resolves per locale).
const G = {
  hawara: 'guideArticle.al-fayoum.the-pyramid-of-hawara',
  lahun: 'guideArticle.al-fayoum.the-pyramid-of-al-lahun',
  black: 'guideArticle.giza.the-black-pyramid',
  meidum: 'guideArticle.beni-suef.pyramid-of-meidum',
  egyptianMuseum: 'guideArticle.cairo.egyptian-museum-of-antiquities', // the Tahrir museum
  bibAlex: 'guideArticle.alexandria.bibliotheca-alexandrina',
};
const T = {
  meidumHawaraPrivate: 'wp-page-87835',
  meidumHawaraGroup: 'tour.fayoum-meidum-hawara-pyramids-group-day-tour',
  fayoumDesert: 'wp-page-156014', // /fayoum-desert-adventure (package)
  gizaMuseum: 'tour.private-tour-pyramids-of-giza-sphinx-egyptian-museum-and-khan-el-khalili-bazaar',
  museumCopticMuizz: 'wp-page-87729',
};
// Blog articles are one doc per language: each locale links its OWN sibling.
const ARTICLE = {
  'middle-kingdom-pharaohs': { en: 'wp-post-116015-en', es: 'wp-post-144345-es', ja: 'wp-post-170093-ja' },
  'best-ecolodges-in-fayoum': { en: 'wp-post-135204-en', es: 'wp-post-144453-es', ja: 'wp-post-172477-ja' },
};

/* ── The two articles ─────────────────────────────────────────────────── */
const PIECES = {
  hawara: {
    id: 'hawara-labyrinth',
    locked: { en: 'review/locked/blog/hawara-labyrinth.md', es: 'review/locked/blog/hawara-labyrinth-es.md', ja: 'review/locked/blog/hawara-labyrinth-ja.md' },
    // Real Hawara pyramid photo (mudbrick core, the Labyrinth field in front).
    heroAsset: 'image-4391fffc2a740426714800cc304f6a9423eaeb01-2752x1536-jpg',
    hero: {
      en: {
        alt: 'The eroded mudbrick pyramid of Amenemhat III at Hawara under a clear blue sky, with low sandy mounds and hollows across the ground in front of it.',
        caption: 'The pyramid of Amenemhat III at Hawara, with the Labyrinth field in front of it.',
      },
      es: {
        alt: 'La pirámide de adobe erosionada de Amenemhat III en Hawara bajo un cielo azul despejado, con montículos bajos y hondonadas de arena en el terreno de delante.',
        caption: 'La pirámide de Amenemhat III en Hawara, con el campo del Laberinto delante.',
      },
      ja: {
        alt: '澄んだ青空の下、風化したハワラのアメンエムハト3世の日干しれんがのピラミッド。手前には低い砂の盛り上がりとくぼみが広がる。',
        caption: 'ハワラのアメンエムハト3世のピラミッドと、その手前に広がる迷宮の跡地。',
      },
    },
    // First plain mention of a place that has its own guide page (body only; never adds words).
    names: {
      en: [
        { within: 'started again at Hawara', anchor: 'Hawara', ref: G.hawara },
        { anchor: 'Black Pyramid', ref: G.black },
        { within: 'Lahun, the pyramid', anchor: 'Lahun', ref: G.lahun },
        { within: 'Meidum, the collapsed', anchor: 'Meidum', ref: G.meidum },
      ],
      es: [
        { within: 'volvió a empezar en Hawara', anchor: 'Hawara', ref: G.hawara },
        { anchor: 'Pirámide Negra', ref: G.black },
        { within: 'Lahun, la pirámide', anchor: 'Lahun', ref: G.lahun },
        { within: 'Meidum, la pirámide derrumbada', anchor: 'Meidum', ref: G.meidum },
      ],
      ja: [
        { within: 'ハワラでやり直しました', anchor: 'ハワラ', ref: G.hawara },
        { anchor: '黒ピラミッド', ref: G.black },
        { within: 'ピラミッド、ラフーン', anchor: 'ラフーン', ref: G.lahun },
        { within: '崩れたピラミッド、メイドゥーム', anchor: 'メイドゥーム', ref: G.meidum },
      ],
    },
    // Priced tour row before the footer (max 3). The two Meidum & Hawara days visit the site;
    // the Fayoum desert package is the "two-day Fayoum circuit" the article names.
    endTours: [T.meidumHawaraPrivate, T.meidumHawaraGroup, T.fayoumDesert],
  },
  fayoum: {
    id: 'fayoum-portraits',
    locked: { en: 'review/locked/blog/fayoum-portraits.md', es: 'review/locked/blog/fayoum-portraits-es.md', ja: 'review/locked/blog/fayoum-portraits-ja.md' },
    // Owner's image (21 Nov, Desktop/fayum-portrait.png, 1536×1024), uploaded as JPG. A mummy portrait
    // in the Fayoum style; the caption names no museum or sitter.
    heroAsset: 'image-5760587d85c73cd462eee95ccd9b0ceb48725cc3-1536x1024-jpg',
    hero: {
      en: {
        alt: 'A painted mummy portrait of a young woman with dark curly hair, a gilded wreath, gold earrings and a red mantle, on an arched wooden panel.',
        caption: 'A mummy portrait in the Fayoum style: painted on wood, made to lie over the face of the dead.',
      },
      es: {
        alt: 'Un retrato de momia pintado de una mujer joven de pelo oscuro y rizado, con corona dorada, pendientes de oro y manto rojo, sobre una tabla de madera de remate curvo.',
        caption: 'Un retrato de momia al estilo de El Fayum: pintado sobre madera, para cubrir el rostro del difunto.',
      },
      ja: {
        alt: '上部が丸い木の板に描かれたミイラ肖像画。黒い巻き毛に金の冠、金の耳飾り、赤い外衣をまとった若い女性。',
        caption: 'ファイユーム様式のミイラ肖像画。木の板に描かれ、亡くなった人の顔の上に置かれました。',
      },
    },
    names: {
      en: [
        { anchor: 'Egyptian Museum in Tahrir', ref: G.egyptianMuseum },
        { within: 'Antiquities Museum of the Bibliotheca Alexandrina', anchor: 'Bibliotheca Alexandrina', ref: G.bibAlex },
        { anchor: 'pyramid of Amenemhat III', ref: G.hawara },
      ],
      es: [
        { anchor: 'Museo Egipcio de Tahrir', ref: G.egyptianMuseum },
        { within: 'Museo de Antigüedades de la Bibliotheca Alexandrina', anchor: 'Bibliotheca Alexandrina', ref: G.bibAlex },
        { anchor: 'pirámide de Amenemhat III', ref: G.hawara },
      ],
      ja: [
        { anchor: 'タハリールのエジプト考古学博物館', ref: G.egyptianMuseum },
        { within: 'アレクサンドリア図書館の考古学博物館', anchor: 'アレクサンドリア図書館', ref: G.bibAlex },
        { anchor: 'アメンエムハト3世のピラミッド', ref: G.hawara },
      ],
    },
    // Hawara (where the portraits were found) + the two live private days that include the Tahrir museum.
    endTours: [T.meidumHawaraPrivate, T.gizaMuseum, T.museumCopticMuizz],
  },
};
const PIECE_KEYS = only ? [only] : Object.keys(PIECES);
if (only && !PIECES[only]) throw new Error(`--only ${only}: expected ${Object.keys(PIECES).join(' | ')}`);

const articleId = (p, l) => `article.${PIECES[p].id}-${l}`;
const ref = (_ref, extra = {}) => ({ _type: 'reference', _ref, ...extra });

/* ── Links written in the copy → targets ──────────────────────────────── */
const linkLog = []; // { piece, lang, url, text, target }
function linkResolver(piece, lang) {
  return (url, text) => {
    let target = null;
    let def = null;
    const site = url.match(/^https:\/\/travel2egypt\.org(\/[^?#]*)$/);
    if (site) {
      const path = site[1].replace(/\/$/, '');
      const blog = path.match(/^\/blog\/([^/]+)$/);
      if (blog && blog[1] === 'hawara-labyrinth') target = articleId('hawara', lang);
      else if (blog && blog[1] === 'fayoum-portraits') target = articleId('fayoum', lang);
      else if (blog && ARTICLE[blog[1]]) target = ARTICLE[blog[1]][lang] ?? null;
      else if (path === '/fayoum-desert-adventure') target = T.fayoumDesert;
      else throw new Error(`${piece}/${lang}: no mapping for ${url}`);
      // The sibling new article may be applied later: weak, so either can go first.
      const sibling = target?.startsWith('article.');
      if (target) def = { _type: 'internalLink', reference: ref(target, sibling ? { _weak: true } : {}) };
    } else if (/^https?:\/\//.test(url)) {
      target = url;
      def = { _type: 'externalLink', href: url, newTab: true };
    } else throw new Error(`${piece}/${lang}: unexpected link ${url}`);
    linkLog.push({ piece, lang, url, text, target: target ?? 'DROPPED (text kept)', kind: def?._type ?? 'none' });
    return def;
  };
}

/* ── Build ────────────────────────────────────────────────────────────── */
const built = {}; // piece → lang → { doc, stats }
const verbatim = []; // [strings, lockedFile, allow]
for (const p of PIECE_KEYS) {
  const cfg = PIECES[p];
  built[p] = {};
  for (const l of LANGS) {
    const raw = readFileSync(new URL(cfg.locked[l], ROOT), 'utf8');
    const key = makeKeys(`${p.slice(0, 2)}${l}`);
    const { fm, h1, body, faq, consumed, sourceLines } = parseArticle(raw, { key, resolveLink: linkResolver(p, l) });
    if (fm.locale && fm.locale !== l) throw new Error(`${cfg.locked[l]}: locale ${fm.locale} ≠ ${l}`);
    if (h1 !== fm.title) throw new Error(`${cfg.locked[l]}: H1 ≠ front-matter title`);
    if (consumed !== sourceLines.length) throw new Error(`${cfg.locked[l]}: ${sourceLines.length - consumed} line(s) not converted`);
    for (const k of ['title', 'slug', 'metaTitle', 'metaDescription']) if (!fm[k]) throw new Error(`${cfg.locked[l]}: front matter lacks ${k}`);
    const deckFrom = fm.standfirst ? 'standfirst' : 'metaDescription';
    const linked = [], missed = [];
    for (const n of cfg.names[l]) (injectLink(body, n, key) ? linked : missed).push(n.anchor);
    if (missed.length) throw new Error(`${p}/${l}: guide-link anchor(s) not found: ${missed.join(', ')}`);

    const hero = cfg.heroAsset
      ? { _type: 'image', asset: ref(cfg.heroAsset), alt: cfg.hero[l].alt, caption: cfg.hero[l].caption }
      : null;
    const doc = {
      _id: articleId(p, l),
      _type: 'article',
      language: l,
      title: fm.title,
      slug: { _type: 'slug', current: fm.slug },
      deck: fm[deckFrom],
      category: ref(CATEGORY),
      author: ref(AUTHOR),
      publishedAt: null, // set at --apply
      featured: false,
      body,
      faq,
      ...(hero ? { heroImage: hero } : {}),
      relatedCities: [{ _key: key('rc'), ...ref(FAYOUM_CITY) }],
      relatedArticles: Object.keys(PIECES).filter((x) => x !== p).map((x) => ({ _key: key('ra'), ...ref(articleId(x, l), { _weak: true }) })),
      endTours: cfg.endTours.map((t) => ({ _key: key('et'), ...ref(t) })),
      seo: { metaTitle: fm.metaTitle, metaDescription: fm.metaDescription },
    };
    built[p][l] = { doc, fm, deckFrom, linked, sourceLines };

    // Verbatim: every reader-visible string, and every block line-for-line.
    const strings = [doc.title, doc.deck, doc.seo.metaTitle, doc.seo.metaDescription,
      ...body.flatMap((b) => (b._type === 'definitionList' ? b.items.flatMap((r) => [r.term, r.note, r.description]) : b.children.map((c) => c.text))),
      ...faq.flatMap((f) => [f.question, ...f.answer.flatMap((b) => b.children.map((c) => c.text))])];
    const allow = hero ? { [hero.alt]: 'hero alt (written in this PR, owner to approve)', [hero.caption]: 'hero caption (written in this PR, owner to approve)' } : {};
    verbatim.push([[...strings, ...(hero ? [hero.alt, hero.caption] : [])], [cfg.locked[l]], allow]);
    const lines = new Set(sourceLines);
    const outLines = [...body.flatMap((b) => (b._type === 'definitionList' ? b.items.map((r) => `${r.term} | ${r.note} | ${r.description}`) : [blockText(b)])),
      ...faq.flatMap((f) => [f.question, ...f.answer.map(blockText)])];
    const tableLines = new Set(sourceLines.filter((s) => s.startsWith('|')).map((s) => s.replace(/^\|\s*|\s*\|$/g, '').split('|').map((c) => c.trim()).join(' | ')));
    const bad = outLines.filter((t) => !lines.has(t) && !tableLines.has(t));
    if (bad.length) throw new Error(`${p}/${l}: ${bad.length} block(s) differ from their source line:\n  ${bad.join('\n  ')}`);
  }
}

/* ── Gates ────────────────────────────────────────────────────────────── */
const lockedAll = PIECE_KEYS.flatMap((p) => LANGS.map((l) => [PIECES[p].locked[l], l]));
const flags = await contentGate({ locked: lockedAll, apply, args });
for (const [strings, files, allow] of verbatim) verbatimPreflight(strings, files, allow);

// Numeric gate: the three languages share one structure, so compare block by block.
const flat = (p, l) => {
  const { doc } = built[p][l];
  return {
    title: doc.title, deck: doc.deck, metaTitle: doc.seo.metaTitle, metaDescription: doc.seo.metaDescription,
    ...Object.fromEntries(doc.body.map((b, i) => [`b${i}`, blockText(b)])),
    ...Object.fromEntries(doc.faq.flatMap((f, i) => [[`q${i}`, f.question], [`a${i}`, f.answer.map(blockText).join(' ')]])),
  };
};
// Checked by hand (21 Nov), pair by pair: same figures, the gate misreads the form —
// EN number words it splits ("forty-five" → 40,5; "seven hundred" → 7,100; "thirteen
// hundred" → 13,100; "eighty-one" → 80), number words it does not read ("two",
// "three", "a thousand", ES "dieciocho", "ambas", "cuarenta y cinco"), Roman numerals
// ("dinastía XII", "siglo XIX", "siglos I y III"), ordinals ("Second," / "the second",
// "a second", "2つ目"), JA counters ("2度", "5月から9月" = "May to September").
const SAME_MEANING = {
  hawara: { es: ['deck', 'b2', 'b8', 'b9', 'b14', 'b20', 'b26', 'b49', 'b55', 'a3'], ja: ['b8', 'b9', 'b14', 'b19', 'b20', 'b50', 'b55'] },
  fayoum: { es: ['b2', 'b5', 'b25', 'a0'], ja: ['b2', 'b18', 'b25', 'b35', 'a0'] },
};
const numericFails = [];
for (const p of PIECE_KEYS) {
  for (const l of ['es', 'ja']) {
    const en = flat(p, 'en'), lc = flat(p, l);
    if (built[p].en.doc.body.length !== built[p][l].doc.body.length || built[p].en.doc.faq.length !== built[p][l].doc.faq.length) {
      throw new Error(`${p}: ${l} has ${built[p][l].doc.body.length} blocks / ${built[p][l].doc.faq.length} FAQ vs EN ${built[p].en.doc.body.length} / ${built[p].en.doc.faq.length}`);
    }
    for (const k of SAME_MEANING[p][l]) { delete en[k]; delete lc[k]; console.log(`numeric gate (${p}/${l}): ${k} checked by hand (same meaning)`); }
    try { numericGate(en, lc, l, { quiet: true }); console.log(`numeric gate (${p}/${l}): ${Object.keys(en).length} strings, every figure matches EN`); }
    catch (e) { numericFails.push(`${p}/${e.message}`); }
  }
}
if (numericFails.length) {
  console.log(`\nNUMERIC GATE — for hand check (add the key to SAME_MEANING once confirmed):\n${numericFails.join('\n')}`);
  if (apply) throw new Error('numeric gate: unresolved mismatches; --apply refused');
}

/* ── Report ───────────────────────────────────────────────────────────── */
console.log(`\n=== blog: Hawara Labyrinth + Fayoum Portraits ===  mode: ${apply ? 'APPLY' : previewOut ? 'preview' : 'dry run'}`);
for (const p of PIECE_KEYS) {
  for (const l of LANGS) {
    const { doc, deckFrom, linked } = built[p][l];
    const styles = doc.body.reduce((a, b) => ((a[b._type === 'definitionList' ? 'table' : b.listItem ? 'bullet' : b.style] = (a[b._type === 'definitionList' ? 'table' : b.listItem ? 'bullet' : b.style] ?? 0) + 1), a), {});
    console.log(`\n[${doc._id}]  /${l === 'en' ? '' : `${l}/`}blog/${doc.slug.current}`);
    console.log(`  title   ${doc.title}`);
    console.log(`  deck    (${deckFrom}) ${doc.deck}`);
    console.log(`  seo     ${doc.seo.metaTitle} · ${doc.seo.metaDescription.length} chars`);
    console.log(`  body    ${doc.body.length} blocks ${JSON.stringify(styles)} · FAQ ${doc.faq.length}`);
    console.log(`  hero    ${doc.heroImage ? `${doc.heroImage.asset._ref}\n          alt: ${doc.heroImage.alt}\n          caption: ${doc.heroImage.caption}` : 'NONE (owner to choose; --apply needs --allow-no-hero)'}`);
    console.log(`  guides  ${linked.join(' · ')}`);
    console.log(`  tours   ${doc.endTours.map((t) => t._ref).join(', ')}`);
    console.log(`  related ${doc.relatedArticles.map((t) => t._ref).join(', ')} · city ${FAYOUM_CITY} · category ${CATEGORY} · author ${AUTHOR}`);
    if (built[p][l].fm.reviewDate) console.log(`  note    front matter reviewDate ${built[p][l].fm.reviewDate} has no article field (not written)`);
  }
}
console.log('\nLinks written in the copy:');
for (const x of linkLog) console.log(`  ${x.piece}/${x.lang}  ${x.url}  →  ${x.target}  (${x.kind})`);

const tmeta = (p) => ({
  _id: `tmeta.${PIECES[p].id}`,
  _type: 'translation.metadata',
  schemaTypes: ['article'],
  translations: LANGS.map((l) => ({ _key: l, _type: 'internationalizedArrayReferenceValue', value: ref(articleId(p, l)) })),
});

/* ── Preview: the real article query, in memory ───────────────────────── */
if (previewOut) {
  const client = getClient();
  const newDocs = PIECE_KEYS.flatMap((p) => [...LANGS.map((l) => ({ ...built[p][l].doc, publishedAt: '2026-11-21T09:00:00Z' })), tmeta(p)]);
  const refIds = new Set();
  const walk = (v) => { if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') { if (typeof v._ref === 'string') refIds.add(v._ref); Object.values(v).forEach(walk); } };
  walk(newDocs);
  for (const d of newDocs) refIds.delete(d._id);
  const refs = await client.fetch('*[_id in $ids]', { ids: [...refIds] });
  const second = await client.fetch(
    '*[_id in $ids || (_type == "translation.metadata" && count(translations[value._ref in $ids]) > 0)]',
    { ids: refs.flatMap((r) => [r.parentCity?._ref, r.parent?._ref, ...(r.cities ?? []).map((c) => c._ref)]).filter(Boolean).concat([...refIds]) },
  );
  const dataset = [...newDocs, ...refs, ...second.filter((d) => !refs.some((r) => r._id === d._id))];
  const { articleBySlugQuery } = await import('../../src/sanity/lib/queries.ts');
  const { resolveInternalLinkHref } = await import('../../src/sanity/lib/i18n.ts');
  const out = {};
  console.log('\nPREVIEW (articleBySlugQuery via groq-js):');
  for (const p of PIECE_KEYS) for (const l of LANGS) {
    const slug = built[p][l].doc.slug.current;
    const r = await (await evaluate(gparse(articleBySlugQuery), { dataset, params: { slug, locale: l } })).get();
    if (!r) throw new Error(`preview: ${p}/${l} not found by articleBySlugQuery`);
    const links = r.body.flatMap((b) => (b.markDefs ?? []).map((m) => {
      const text = b.children.filter((c) => c.marks?.includes(m._key)).map((c) => c.text).join('');
      if (m._type === 'externalLink') return { text, href: m.href };
      const h = resolveInternalLinkHref(m.ref);
      const lang = m.ref?.language ?? l;
      return { text, href: h ? (lang === 'en' ? h : `/${lang}${h}`) : null, target: m.reference._ref };
    }));
    out[`${p}/${l}`] = {
      title: r.title, slug: r.slug, deck: r.deck, author: r.author?.name ?? r.author, category: r.category ?? r.categoryTrail,
      hero: r.heroImage ?? null, primaryCity: r.primaryCity, endTours: (r.endTours ?? []).map((t) => `${t.title} — /${l === 'en' ? '' : `${l}/`}${t.slug} — from ${t.priceFrom}`),
      faq: (r.faq ?? []).map((f) => f.question), links,
      bodyHeadings: r.body.filter((b) => /^h[2-4]$/.test(b.style)).map((b) => `${b.style} ${blockText(b)}`),
    };
    console.log(`\n  ${p}/${l}: ${r.title}\n    category: ${JSON.stringify(r.categoryTrail?.name)} · city ${r.primaryCity?.name} · endTours ${(r.endTours ?? []).length}/3 · FAQ ${(r.faq ?? []).length}`);
    for (const x of links) console.log(`    link  "${x.text}" → ${x.href ?? 'NO HREF (target not published yet)'}`);
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`\npreview → ${previewOut}`);
}

/* ── Apply ────────────────────────────────────────────────────────────── */
function getClient() {
  const token = process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
  if (process.env.NEXT_PUBLIC_SANITY_DATASET !== 'production' || !token) throw new Error('needs the production dataset + token (--env-file)');
  return createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, dataset: 'production', apiVersion: '2024-12-01', useCdn: false, token, perspective: 'raw' });
}

if (apply) {
  for (const p of PIECE_KEYS) if (!PIECES[p].heroAsset && !args.includes('--allow-no-hero')) {
    throw new Error(`${p}: no hero image set (PIECES.${p}.heroAsset is null). Set it, or pass --allow-no-hero, or --only the other piece.`);
  }
  if (flags.length && !args.includes('--flags-approved')) throw new Error('superlative flags await owner approval');
  const client = getClient();
  // Slugs must be free in their language.
  for (const p of PIECE_KEYS) for (const l of LANGS) {
    const { doc } = built[p][l];
    const clash = await client.fetch('*[_type == "article" && language == $l && slug.current == $s && !(_id in [$id, "drafts." + $id])][0]._id', { l, s: doc.slug.current, id: doc._id });
    if (clash) throw new Error(`${doc._id}: slug ${doc.slug.current} already used by ${clash}`);
  }
  const ids = PIECE_KEYS.flatMap((p) => [...LANGS.map((l) => articleId(p, l)), `tmeta.${PIECES[p].id}`]);
  const existing = await client.fetch('*[_id in $ids]._id', { ids });
  if (existing.length) await writeRollback(client, existing, 'before-hawara-fayoum-articles');
  const now = new Date().toISOString();
  let tx = client.transaction();
  for (const p of PIECE_KEYS) {
    for (const l of LANGS) tx = tx.createOrReplace({ ...built[p][l].doc, publishedAt: now });
    tx = tx.createOrReplace(tmeta(p));
  }
  await tx.commit({ visibility: 'async' });
  console.log(`\nAPPLIED to production: ${ids.join(', ')}`);
} else if (!previewOut) console.log('\ndry run — nothing written (preview: --preview <out.json>; write: --apply --flags-approved)');
