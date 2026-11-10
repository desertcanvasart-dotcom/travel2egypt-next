/**
 * Lake Nasser merge (2026-11-10): writes the owner-locked copy in
 * docs/lake-nasser-merge/lake-nasser-cruise{,-es,-ja}.md to the surviving post
 * in each language, sets the author/dates/SEO, and adds the structured FAQ.
 * The text is parsed straight from the locked files (Canon Gate A); nothing
 * is retyped. The byline line is not copied into the body.
 *
 * Also creates the author document for Faris Hussein if it is missing.
 * Usage (from the repo root): node scripts/lake-nasser-merge-content.mjs [--apply] [--json]
 */
import 'dotenv/config';
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const APPLY = process.argv.includes('--apply');
// --drafts: stage on drafts.<id> only (copied from the published doc), for a
// local preview before approval. The live site reads published documents only.
const DRAFTS = process.argv.includes('--drafts');
const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });

const AUTHOR_ID = 'author.faris-hussein';
const UPDATED_AT = '2026-11-10T10:00:00.000Z';
const POSTS = {
  en: { id: 'wp-post-145378-en', file: 'lake-nasser-cruise.md',
    metaTitle: 'Lake Nasser Cruise: What It Is and How to Choose One',
    metaDescription: 'Drowned Nubia, rescued temples and Abu Simbel from the water. What a Lake Nasser cruise really is, plus nights, direction, season and what to confirm before booking.' },
  es: { id: 'wp-post-155359-es', file: 'lake-nasser-cruise-es.md',
    metaTitle: 'Crucero por el lago Nasser: qué es y cómo elegirlo',
    metaDescription: 'La Nubia sumergida, templos rescatados y Abu Simbel desde el agua. Qué es un crucero por el lago Nasser y cómo elegirlo: noches, sentido, temporada y qué confirmar.' },
  ja: { id: 'wp-post-170181-ja', file: 'lake-nasser-cruise-ja.md',
    metaTitle: 'ナセル湖クルーズとは何か、そしてどう選ぶか',
    metaDescription: '水に沈んだヌビア、救出された神殿、水上から見るアブ・シンベル。ナセル湖クルーズの本質と選び方――日数、進む向き、季節、予約前の確認事項まで。' },
};
const FAQ_HEADINGS = { en: 'Frequently asked questions', es: 'Preguntas frecuentes', ja: 'よくある質問' };

// ── Markdown → Portable Text (only what the files use: ## / ### / - / **bold**) ──
let keyN = 0;
const key = (lang) => `ln${lang}${(keyN++).toString(36).padStart(4, '0')}`;
function spans(text, lang) {
  const out = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ _type: 'span', _key: key(lang), text: text.slice(last, m.index), marks: [] });
    out.push({ _type: 'span', _key: key(lang), text: m[1], marks: ['strong'] });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ _type: 'span', _key: key(lang), text: text.slice(last), marks: [] });
  return out;
}
const block = (text, lang, style = 'normal', listItem) => ({
  _type: 'block', _key: key(lang), style, markDefs: [], children: spans(text, lang),
  ...(listItem ? { listItem, level: 1 } : {}),
});

function parse(lang, file) {
  const md = fs.readFileSync(`docs/lake-nasser-merge/${file}`, 'utf8').replace(/\r\n/g, '\n');
  const lines = md.split('\n');
  const title = lines[0].replace(/^# /, '').trim();
  const deck = lines[2].trim().replace(/^\*(.*)\*$/, '$1');
  if (!/^\*(By|Por|文：)/.test(lines[4].trim())) throw new Error(`${file}: byline not on line 5`);
  if (lines[6].trim() !== '---') throw new Error(`${file}: separator not on line 7`);
  const rest = lines.slice(7);
  const faqAt = rest.findIndex((l) => l.trim() === `## ${FAQ_HEADINGS[lang]}`);
  if (faqAt < 0) throw new Error(`${file}: FAQ heading not found`);
  const body = [];
  for (const raw of rest.slice(0, faqAt)) {
    const l = raw.trim();
    if (!l) continue;
    if (l.startsWith('### ')) throw new Error(`${file}: unexpected H3 in body`);
    if (l.startsWith('## ')) body.push(block(l.slice(3), lang, 'h2'));
    else if (l.startsWith('- ')) body.push(block(l.slice(2), lang, 'normal', 'bullet'));
    else body.push(block(l, lang));
  }
  const faq = [];
  let cur = null;
  for (const raw of rest.slice(faqAt + 1)) {
    const l = raw.trim();
    if (!l) continue;
    if (l.startsWith('### ')) { cur = { _type: 'articleFaqItem', _key: key(lang), question: l.slice(4), answer: [] }; faq.push(cur); }
    else if (cur) cur.answer.push(block(l, lang));
    else throw new Error(`${file}: text before first FAQ question`);
  }
  return { title, deck, body, faq };
}

const parsed = {};
for (const [lang, p] of Object.entries(POSTS)) {
  parsed[lang] = parse(lang, p.file);
  const { body, faq } = parsed[lang];
  const h2 = body.filter((b) => b.style === 'h2').length;
  const li = body.filter((b) => b.listItem).length;
  const bold = body.flatMap((b) => b.children).filter((s) => s.marks.includes('strong')).length;
  console.log(`${lang}: "${parsed[lang].title}" · ${body.length} blocks · ${h2} H2 · ${li} list items · ${bold} bold · ${faq.length} FAQ`);
  if (h2 !== 14 || li !== 9 || faq.length !== 5) throw new Error(`${lang}: structure check failed`);
}
if (process.argv.includes('--json')) fs.writeFileSync('/tmp/lake-nasser-parsed.json', JSON.stringify(parsed, null, 1));

// Verbatim check: every text run must appear in the locked file.
for (const [lang, p] of Object.entries(POSTS)) {
  const md = fs.readFileSync(`docs/lake-nasser-merge/${p.file}`, 'utf8');
  const runs = [parsed[lang].title, parsed[lang].deck,
    ...parsed[lang].body.flatMap((b) => b.children.map((s) => s.text)),
    ...parsed[lang].faq.flatMap((f) => [f.question, ...f.answer.flatMap((b) => b.children.map((s) => s.text))])];
  const bad = runs.filter((t) => !md.includes(t));
  if (bad.length) throw new Error(`${lang}: ${bad.length} runs not in the locked file`);
}
console.log('pre-flight OK: every text run matches the locked files');

let tx = c.transaction(), n = 0;
const author = await c.fetch(`*[_id==$id][0]._id`, { id: AUTHOR_ID });
if (!author) {
  console.log(`create ${AUTHOR_ID} (Faris Hussein)`);
  tx = tx.createIfNotExists({ _id: AUTHOR_ID, _type: 'author', name: 'Faris Hussein', slug: { _type: 'slug', current: 'faris-hussein' } });
  n++;
}
for (const [lang, p] of Object.entries(POSTS)) {
  const cur = await c.fetch(`*[_id==$id][0]{title, publishedAt, "author": author._ref, "cat": category._ref, "hero": heroImage.asset._ref}`, { id: p.id });
  if (!cur) throw new Error(`missing ${p.id}`);
  if (!cur.publishedAt.startsWith('2024-09-03')) throw new Error(`${p.id}: unexpected publishedAt ${cur.publishedAt}`);
  console.log(`\n${p.id} [${lang}]\n  title: ${cur.title} → ${parsed[lang].title}\n  author: ${cur.author} → ${AUTHOR_ID}\n  category: ${cur.cat} (kept: Nile Cruise)\n  hero: kept\n  updatedAt → ${UPDATED_AT}\n  seo.metaTitle → ${p.metaTitle}`);
  const patch = {
    title: parsed[lang].title,
    deck: parsed[lang].deck,
    body: parsed[lang].body,
    faq: parsed[lang].faq,
    author: { _type: 'reference', _ref: AUTHOR_ID },
    updatedAt: UPDATED_AT,
    'seo.metaTitle': p.metaTitle,
    'seo.metaDescription': p.metaDescription,
  };
  if (DRAFTS) {
    const pub = await c.fetch(`*[_id==$id][0]`, { id: p.id });
    const { _rev, _updatedAt, _createdAt, ...rest } = pub;
    tx = tx.createOrReplace({ ...rest, _id: `drafts.${p.id}` });
    tx = tx.patch(c.patch(`drafts.${p.id}`).setIfMissing({ seo: {} }).set(patch));
    n++;
    continue;
  }
  tx = tx.patch(c.patch(p.id).setIfMissing({ seo: {} }).set(patch));
  n++;
  // Keep an open Studio draft in step, if one exists.
  if (await c.fetch(`count(*[_id==$d])`, { d: `drafts.${p.id}` })) {
    tx = tx.patch(c.patch(`drafts.${p.id}`).setIfMissing({ seo: {} }).set(patch)); n++;
  }
}
if (APPLY) { const r = await tx.commit({ autoGenerateArrayKeys: false }); console.log('\ncommitted', r.results.length, 'mutations'); }
else console.log(`\n${n} mutations (dry run — pass --apply)`);
