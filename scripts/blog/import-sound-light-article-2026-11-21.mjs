/**
 * One native trilingual Destination Depth article by Faris Hussein, from the
 * owner's locked copy (review/locked/blog/, byte-for-byte copies of the owner's
 * files of 21 Nov 2026):
 *
 *   "Egypt's Sound and Light Shows"   article.egypt-sound-light-shows-{en,es,ja} + tmeta.egypt-sound-light-shows
 *
 * Same pattern as the Hawara / Fayoum batch (import-hawara-fayoum-articles-2026-11-21.mjs):
 * one `article` doc per language, linked by one `translation.metadata` doc;
 * Markdown → Portable Text via scripts/blog/md-to-pt.mjs.
 *
 * The "Sit or walk" table has FOUR columns; definitionList has term / note /
 * description. Mapping: col 1 → term, col 2 → note, cols 3 + 4 → description,
 * joined by " · " (TABLE_JOIN). All four cells stay verbatim; the join mark is the
 * only added character, and the header row is the first row (as in the Hawara batch).
 *
 *   node --env-file=/Users/islamhussein/t2e/.env scripts/blog/import-sound-light-article-2026-11-21.mjs              # dry run
 *   npx tsx --env-file=/Users/islamhussein/t2e/.env scripts/blog/import-sound-light-article-2026-11-21.mjs --preview <out.json>
 *   (--apply exists but is for the owner: needs --flags-approved; NOT run by the PR author.)
 *
 * --preview renders each new doc through the real articleBySlugQuery (groq-js,
 * in memory) and lists every resolved link. Nothing is written without --apply.
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';
import { parseArticle, makeKeys, blockText, TABLE_JOIN } from './md-to-pt.mjs';

const ROOT = new URL('../../', import.meta.url);
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const LANGS = ['en', 'es', 'ja'];

/* ── Refs (checked in production 21 Nov 2026) ─────────────────────────── */
const AUTHOR = 'author.faris-hussein';
const CATEGORY = 'category-destination-depth'; // Destination Depth · Destino en profundidad · 訪問先を深く知る
const CITIES = ['wp-page-58854' /* Giza */, 'wp-page-58877' /* Luxor */, 'wp-page-58758' /* Aswan */];
const GIZA_CITY = 'wp-page-58854';
const T = {
  giza: 'wp-page-110952', // The Giza Sound & Light Show: An Evening at the Pyramids
  karnak: 'tour.sound-light-show-at-karnak-temple-in-luxor',
  philae: 'wp-page-88604', // Philae Temple Sound & Light Show, Aswan
};
// Blog articles are one doc per language: each locale links its OWN article.
const LAKE_NASSER = { en: 'wp-post-145378-en', es: 'wp-post-155359-es', ja: 'wp-post-170181-ja' };

const PIECE = {
  id: 'egypt-sound-light-shows',
  locked: {
    en: 'review/locked/blog/egypt-sound-and-light-shows.md',
    es: 'review/locked/blog/egypt-sound-and-light-shows-es.md',
    ja: 'review/locked/blog/egypt-sound-and-light-shows-ja.md',
  },
  // Philae Temple floodlit in amber against a black sky (3000×2000): the asset already in the
  // dataset as the Philae Sound & Light tour hero. Looked at 21 Nov: pylon towers with reliefs.
  heroAsset: 'image-6ea47d5af7562bd20aee6f366ac947671332b13a-3000x2000-jpg',
  hero: {
    en: {
      alt: 'The pylon towers of Philae Temple and the buildings behind them, floodlit in amber against a black night sky.',
      caption: 'Philae Temple floodlit at night.',
    },
    es: {
      alt: 'Las torres del pilono del templo de Philae y los edificios que hay detrás, iluminados en ámbar contra un cielo nocturno negro.',
      caption: 'El templo de Philae iluminado de noche.',
    },
    ja: {
      alt: '黒い夜空を背に、琥珀色に照らされたフィラエ神殿の塔門と、その奥の建物。',
      caption: '夜に照らされたフィラエ神殿。',
    },
  },
  endTours: [T.giza, T.karnak, T.philae],
};

const articleId = (l) => `article.${PIECE.id}-${l}`;
const ref = (_ref, extra = {}) => ({ _type: 'reference', _ref, ...extra });

/* ── Links written in the copy → targets ──────────────────────────────── */
// The copy carries the live EN URL in all three locales, and the ES/JA files already point
// at the ES/JA tour URLs. All three forms of each tour map to the same (internationalized) doc.
const TOUR_PATHS = {
  '/the-giza-sound-and-light-show-experience': T.giza,
  '/es/el-espectaculo-de-luz-y-sonido-de-guiza-una-velada-en-las-piramides': T.giza,
  '/ja/giza-no-hikari-to-oto-no-sho-piramiddo-de-sugosu-ichiya': T.giza,
  '/sound-light-show-at-karnak-temple-in-luxor': T.karnak,
  '/es/luz-y-sonido-en-karnak': T.karnak,
  '/ja/yoru-no-karunakku-rukusoru-no-hikari-to-oto-no-sho': T.karnak,
  '/private-tour-sound-light-show-at-philae-temple': T.philae,
  '/es/luz-y-sonido-en-el-templo-de-philae': T.philae,
  '/ja/firae-shinden-hikari-to-oto-no-sho-asuwan': T.philae,
};
const linkLog = []; // { lang, url, text, target, kind }
function linkResolver(lang) {
  return (url, text) => {
    let target = null;
    let def = null;
    const site = url.match(/^https:\/\/travel2egypt\.org(\/[^?#]*)$/);
    if (site) {
      const path = site[1].replace(/\/$/, '');
      if (TOUR_PATHS[path]) target = TOUR_PATHS[path];
      else if (path === '/guide/giza') target = GIZA_CITY;
      else if (path === '/blog/lake-nasser-cruise') target = LAKE_NASSER[lang] ?? null; // own-language article only
      else throw new Error(`${lang}: no mapping for ${url}`);
      if (target) def = { _type: 'internalLink', reference: ref(target) };
    } else if (/^https?:\/\//.test(url)) {
      target = url;
      def = { _type: 'externalLink', href: url, newTab: true };
    } else throw new Error(`${lang}: unexpected link ${url}`);
    linkLog.push({ lang, url, text, target: target ?? 'DROPPED (text kept)', kind: def?._type ?? 'none' });
    return def;
  };
}

/* ── Build ────────────────────────────────────────────────────────────── */
const built = {}; // lang → { doc, fm, sourceLines }
const verbatim = []; // [strings, lockedFile, allow]
for (const l of LANGS) {
  const raw = readFileSync(new URL(PIECE.locked[l], ROOT), 'utf8');
  const key = makeKeys(`sl${l}`);
  const { fm, h1, body, faq, consumed, sourceLines } = parseArticle(raw, { key, resolveLink: linkResolver(l) });
  if (fm.locale && fm.locale !== l) throw new Error(`${PIECE.locked[l]}: locale ${fm.locale} ≠ ${l}`);
  if (h1 !== fm.title) throw new Error(`${PIECE.locked[l]}: H1 ≠ front-matter title`);
  if (consumed !== sourceLines.length) throw new Error(`${PIECE.locked[l]}: ${sourceLines.length - consumed} line(s) not converted`);
  for (const k of ['title', 'slug', 'metaTitle', 'metaDescription']) if (!fm[k]) throw new Error(`${PIECE.locked[l]}: front matter lacks ${k}`);
  if (fm.category !== 'Destination Depth' || fm.author !== 'Faris Hussein') throw new Error(`${PIECE.locked[l]}: category/author ≠ Destination Depth / Faris Hussein`);
  const deckFrom = fm.standfirst ? 'standfirst' : 'metaDescription';

  const hero = PIECE.heroAsset
    ? { _type: 'image', asset: ref(PIECE.heroAsset), alt: PIECE.hero[l].alt, caption: PIECE.hero[l].caption }
    : null;
  const doc = {
    _id: articleId(l),
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
    relatedCities: CITIES.map((c) => ({ _key: key('rc'), ...ref(c) })),
    relatedArticles: [{ _key: key('ra'), ...ref(LAKE_NASSER[l]) }],
    endTours: PIECE.endTours.map((t) => ({ _key: key('et'), ...ref(t) })),
    seo: { metaTitle: fm.metaTitle, metaDescription: fm.metaDescription },
  };
  built[l] = { doc, fm, deckFrom, sourceLines };

  // Table rows: the four source cells, recovered from term / note / description.
  const cellsOf = (r) => [r.term, r.note, ...r.description.split(TABLE_JOIN)];
  // Verbatim: every reader-visible string, and every block line-for-line.
  const strings = [doc.title, doc.deck, doc.seo.metaTitle, doc.seo.metaDescription,
    ...body.flatMap((b) => (b._type === 'definitionList' ? b.items.flatMap(cellsOf) : b.children.map((c) => c.text))),
    ...faq.flatMap((f) => [f.question, ...f.answer.flatMap((b) => b.children.map((c) => c.text))])];
  const allow = hero ? { [hero.alt]: 'hero alt (written in this PR, owner to approve)', [hero.caption]: 'hero caption (written in this PR, owner to approve)' } : {};
  verbatim.push([[...strings, ...(hero ? [hero.alt, hero.caption] : [])], [PIECE.locked[l]], allow]);
  const lines = new Set(sourceLines);
  const outLines = [...body.flatMap((b) => (b._type === 'definitionList' ? b.items.map((r) => cellsOf(r).join(' | ')) : [blockText(b)])),
    ...faq.flatMap((f) => [f.question, ...f.answer.map(blockText)])];
  const tableLines = new Set(sourceLines.filter((s) => s.startsWith('|')).map((s) => s.replace(/^\|\s*|\s*\|$/g, '').split('|').map((c) => c.trim()).join(' | ')));
  const bad = outLines.filter((t) => !lines.has(t) && !tableLines.has(t));
  if (bad.length) throw new Error(`${l}: ${bad.length} block(s) differ from their source line:\n  ${bad.join('\n  ')}`);
}

/* ── Gates ────────────────────────────────────────────────────────────── */
const flags = await contentGate({ locked: LANGS.map((l) => [PIECE.locked[l], l]), apply, args });
for (const [strings, files, allow] of verbatim) verbatimPreflight(strings, files, allow);

// Numeric gate: the three languages share one structure, so compare block by block.
const flat = (l) => {
  const { doc } = built[l];
  return {
    title: doc.title, deck: doc.deck, metaTitle: doc.seo.metaTitle, metaDescription: doc.seo.metaDescription,
    ...Object.fromEntries(doc.body.map((b, i) => [`b${i}`, blockText(b)])),
    ...Object.fromEntries(doc.faq.flatMap((f, i) => [[`q${i}`, f.question], [`a${i}`, f.answer.map(blockText).join(' ')]])),
  };
};
// Keys checked by hand (21 Nov), pair by pair: same figures, the gate misreads the form —
// EN number words it splits or skips ("forty-five" → 40,5; "seventy-five" → 70,5; "thirty-seven"
// → 30,7; "both" / "second" / "three"), ES "las dos" (= both) and "febrero" / "noviembre a marzo"
// (months, 2 / 11 / 3), JA "2回ともスピーカー" (both), "第1回" (the first show), "3つ" (three),
// "2月" (February), "11月から3月" (November to March), "代わりの予定" (= a second plan, no figure).
const SAME_MEANING = {
  es: ['b27', 'b28', 'b47', 'b54', 'b55', 'b64', 'b69', 'a2'],
  ja: ['b7', 'b11', 'b18', 'b37', 'b47', 'b52', 'b54', 'b55'],
};
const numericFails = [];
for (const l of ['es', 'ja']) {
  const en = flat('en'), lc = flat(l);
  if (built.en.doc.body.length !== built[l].doc.body.length || built.en.doc.faq.length !== built[l].doc.faq.length) {
    throw new Error(`${l} has ${built[l].doc.body.length} blocks / ${built[l].doc.faq.length} FAQ vs EN ${built.en.doc.body.length} / ${built.en.doc.faq.length}`);
  }
  for (const k of SAME_MEANING[l]) { delete en[k]; delete lc[k]; console.log(`numeric gate (${l}): ${k} checked by hand (same meaning)`); }
  try { numericGate(en, lc, l, { quiet: true }); console.log(`numeric gate (${l}): ${Object.keys(en).length} strings, every figure matches EN`); }
  catch (e) { numericFails.push(`${l}/${e.message}`); }
}
if (numericFails.length) {
  console.log(`\nNUMERIC GATE — for hand check (add the key to SAME_MEANING once confirmed):\n${numericFails.join('\n')}`);
  if (apply) throw new Error('numeric gate: unresolved mismatches; --apply refused');
}

/* ── Report ───────────────────────────────────────────────────────────── */
console.log(`\n=== blog: Egypt's Sound and Light Shows ===  mode: ${apply ? 'APPLY' : previewOut ? 'preview' : 'dry run'}`);
for (const l of LANGS) {
  const { doc, deckFrom } = built[l];
  const kind = (b) => (b._type === 'definitionList' ? 'table' : b.listItem ? 'bullet' : b.style);
  const styles = doc.body.reduce((a, b) => ((a[kind(b)] = (a[kind(b)] ?? 0) + 1), a), {});
  console.log(`\n[${doc._id}]  /${l === 'en' ? '' : `${l}/`}blog/${doc.slug.current}`);
  console.log(`  title   ${doc.title}`);
  console.log(`  deck    (${deckFrom}) ${doc.deck}`);
  console.log(`  seo     ${doc.seo.metaTitle} · ${doc.seo.metaDescription.length} chars`);
  console.log(`  body    ${doc.body.length} blocks ${JSON.stringify(styles)} · FAQ ${doc.faq.length}`);
  console.log(`  hero    ${doc.heroImage ? `${doc.heroImage.asset._ref}\n          alt: ${doc.heroImage.alt}\n          caption: ${doc.heroImage.caption}` : 'NONE (owner to choose; --apply needs --allow-no-hero)'}`);
  console.log(`  tours   ${doc.endTours.map((t) => t._ref).join(', ')}`);
  console.log(`  related ${doc.relatedArticles.map((t) => t._ref).join(', ')} · cities ${CITIES.join(', ')} · category ${CATEGORY} · author ${AUTHOR}`);
}
console.log('\nLinks written in the copy:');
for (const x of linkLog) console.log(`  ${x.lang}  ${x.url}  →  ${x.target}  (${x.kind})`);

const tmeta = () => ({
  _id: `tmeta.${PIECE.id}`,
  _type: 'translation.metadata',
  schemaTypes: ['article'],
  translations: LANGS.map((l) => ({ _key: l, _type: 'internationalizedArrayReferenceValue', value: ref(articleId(l)) })),
});

/* ── Preview: the real article query, in memory ───────────────────────── */
if (previewOut) {
  const client = getClient();
  const newDocs = [...LANGS.map((l) => ({ ...built[l].doc, publishedAt: '2026-11-21T09:00:00Z' })), tmeta()];
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
  for (const l of LANGS) {
    const slug = built[l].doc.slug.current;
    const r = await (await evaluate(gparse(articleBySlugQuery), { dataset, params: { slug, locale: l } })).get();
    if (!r) throw new Error(`preview: ${l} not found by articleBySlugQuery`);
    const links = r.body.flatMap((b) => (b.markDefs ?? []).map((m) => {
      const text = b.children.filter((c) => c.marks?.includes(m._key)).map((c) => c.text).join('');
      if (m._type === 'externalLink') return { text, href: m.href };
      const h = resolveInternalLinkHref(m.ref);
      const lang = m.ref?.language ?? l;
      return { text, href: h ? (lang === 'en' ? h : `/${lang}${h}`) : null, target: m.reference._ref };
    }));
    out[l] = {
      title: r.title, slug: r.slug, deck: r.deck, author: r.author?.name ?? r.author, category: r.category ?? r.categoryTrail,
      hero: r.heroImage ?? null, primaryCity: r.primaryCity, endTours: (r.endTours ?? []).map((t) => `${t.title} — /${l === 'en' ? '' : `${l}/`}${t.slug} — from ${t.priceFrom}`),
      relatedCities: r.relatedCities, relatedArticles: r.relatedArticles,
      faq: (r.faq ?? []).map((f) => f.question), links,
      bodyHeadings: r.body.filter((b) => /^h[2-4]$/.test(b.style)).map((b) => `${b.style} ${blockText(b)}`),
    };
    console.log(`\n  ${l}: ${r.title}\n    category: ${JSON.stringify(r.categoryTrail?.name)} · city ${r.primaryCity?.name} · endTours ${(r.endTours ?? []).length}/3 · FAQ ${(r.faq ?? []).length}`);
    for (const t of out[l].endTours) console.log(`    tour  ${t}`);
    for (const x of links) console.log(`    link  "${x.text}" → ${x.href ?? 'NO HREF (target not published yet)'}`);
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`\npreview → ${previewOut}`);
}

/* ── Apply (owner only) ───────────────────────────────────────────────── */
function getClient() {
  const token = process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
  if (process.env.NEXT_PUBLIC_SANITY_DATASET !== 'production' || !token) throw new Error('needs the production dataset + token (--env-file)');
  return createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, dataset: 'production', apiVersion: '2024-12-01', useCdn: false, token, perspective: 'raw' });
}

if (apply) {
  if (!PIECE.heroAsset && !args.includes('--allow-no-hero')) {
    throw new Error('no hero image set (PIECE.heroAsset is null). Set it, or pass --allow-no-hero.');
  }
  if (flags.length && !args.includes('--flags-approved')) throw new Error('superlative flags await owner approval');
  const client = getClient();
  // Slugs must be free in their language.
  for (const l of LANGS) {
    const { doc } = built[l];
    const clash = await client.fetch('*[_type == "article" && language == $l && slug.current == $s && !(_id in [$id, "drafts." + $id])][0]._id', { l, s: doc.slug.current, id: doc._id });
    if (clash) throw new Error(`${doc._id}: slug ${doc.slug.current} already used by ${clash}`);
  }
  const ids = [...LANGS.map(articleId), `tmeta.${PIECE.id}`];
  const existing = await client.fetch('*[_id in $ids]._id', { ids });
  if (existing.length) await writeRollback(client, existing, 'before-sound-light-article');
  const now = new Date().toISOString();
  let tx = client.transaction();
  for (const l of LANGS) tx = tx.createOrReplace({ ...built[l].doc, publishedAt: now });
  tx = tx.createOrReplace(tmeta());
  await tx.commit({ visibility: 'async' });
  console.log(`\nAPPLIED to production: ${ids.join(', ')}`);
} else if (!previewOut) console.log('\ndry run — nothing written (preview: --preview <out.json>; write: --apply --flags-approved)');
