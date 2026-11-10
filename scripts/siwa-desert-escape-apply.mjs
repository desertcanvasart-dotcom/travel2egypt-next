/**
 * Siwa Desert Escape (2026-11-10): replaces /siwa-oasis-adventure-tour
 * (wp-page-113061) with the owner's copy, parsed from the locked file
 * docs/siwa-desert-escape/siwa-desert-escape-<lang>.md (Canon Gate A).
 * Writes that language's fields only; the shared fields (duration, group
 * size, price) are written with English. The address is unchanged.
 * Usage (from the repo root): node scripts/siwa-desert-escape-apply.mjs --lang=en [--apply]
 */
import 'dotenv/config';
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const APPLY = process.argv.includes('--apply');
const LANG = (process.argv.find((a) => a.startsWith('--lang=')) || '--lang=en').split('=')[1];
const ID = 'wp-page-113061';
const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });

const md = fs.readFileSync(`docs/siwa-desert-escape/siwa-desert-escape-${LANG}.md`, 'utf8').replace(/\r\n/g, '\n');
// --check-draft: parse an unapproved draft in a dry run (never with --apply).
const CHECK_DRAFT = process.argv.includes('--check-draft');
if (CHECK_DRAFT && APPLY) throw new Error('--check-draft cannot be combined with --apply');
if (!/Status: LOCKED/.test(md) && !CHECK_DRAFT) throw new Error('copy file is not LOCKED');
const SEO = {
  es: {
    metaTitle: 'Tour al oasis de Siwa desde El Cairo: 4 días',
    metaDescription: 'Cuatro días privados desde El Cairo: el manantial de Cleopatra y un lago salado, un día de patrimonio con guía y un 4×4 hacia el Gran Mar de Arena.',
  },
  ja: {
    metaTitle: 'カイロ発シワ・オアシス4日間の旅',
    metaDescription: 'カイロ発のプライベート4日間。クレオパトラの泉と塩湖での浮遊体験、ガイド付きの遺産巡り、4WDで向かうグレート・サンド・シー。',
  },
  en: {
    metaTitle: 'Siwa Oasis Tour from Cairo: 4 Days',
    metaDescription: 'A private 4-day Siwa journey from Cairo: Cleopatra Spring, a salt lake float, a guided heritage day and a 4×4 into the Great Sand Sea.',
  },
};

// ── Parse the locked file ─────────────────────────────────────────────
const lines = md.split('\n');
const title = lines[0].replace(/^# /, '').trim();
const summary = lines.find((l) => /^(Summary|Resumen|概要):/.test(l)).replace(/^[^:]+:\s*/, '').trim();
// Sections: "## Heading" up to the next "## " (the trailing notes table is excluded).
const sections = [];
for (const l of lines) {
  if (l.startsWith('## ')) sections.push({ h: l.slice(3).trim(), lines: [] });
  else if (sections.length) sections[sections.length - 1].lines.push(l);
}
const sec = (re) => { const s = sections.find((x) => re.test(x.h)); if (!s) throw new Error(`section ${re} missing`); return s; };

let k = 0;
const key = () => `sde${LANG}${(k++).toString(36).padStart(4, '0')}`;
function spans(text) {
  const out = []; const re = /\*\*(.+?)\*\*/g; let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ _type: 'span', _key: key(), text: text.slice(last, m.index), marks: [] });
    out.push({ _type: 'span', _key: key(), text: m[1], marks: ['strong'] });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ _type: 'span', _key: key(), text: text.slice(last), marks: [] });
  return out;
}
const block = (text, style = 'normal', listItem) => ({ _type: 'block', _key: key(), style, markDefs: [], children: spans(text), ...(listItem ? { listItem, level: 1 } : {}) });
function toBlocks(ls, { h3AsH2 = false } = {}) {
  const out = [];
  for (const raw of ls) {
    const l = raw.trim();
    if (!l || l === '---') continue;
    if (l.startsWith('### ')) out.push(block(l.slice(4), h3AsH2 ? 'h2' : 'h3'));
    else if (l.startsWith('- ')) out.push(block(l.slice(2), 'normal', 'bullet'));
    else out.push(block(l));
  }
  return out;
}
const bullets = (s) => s.lines.map((l) => l.trim()).filter((l) => l.startsWith('- ')).map((l) => l.slice(2));

const about = sections[0];
const body = [block(about.h, 'h2'), ...toBlocks(about.lines)];
const included = bullets(sections[1]);
const excluded = bullets(sections[2]);
const daySecs = sections.slice(3, 7);
const days = daySecs.map((s, i) => {
  const m = s.h.match(/^\D*?(\d+)\D*?—\s+(.+)$/);
  if (!m || Number(m[1]) !== i + 1) throw new Error(`bad day heading: ${s.h}`);
  return { n: i + 1, title: m[2].trim(), blocks: toBlocks(s.lines) };
});
const practical = toBlocks(sections[7].lines, { h3AsH2: true });

// Checks: structure and verbatim.
if (included.length !== 11 || excluded.length !== 6 || days.length !== 4) throw new Error(`structure: ${included.length} incl, ${excluded.length} excl, ${days.length} days`);
const runs = [title, summary, ...body.flatMap((b) => b.children.map((s) => s.text)), ...included, ...excluded,
  ...days.flatMap((d) => [d.title, ...d.blocks.flatMap((b) => b.children.map((s) => s.text))]),
  ...practical.flatMap((b) => b.children.map((s) => s.text))];
const bad = runs.filter((t) => !md.includes(t));
if (bad.length) throw new Error(`${bad.length} runs not in the locked file`);
console.log(`pre-flight OK [${LANG}]: "${title}" · ${days.length} days · ${included.length} included · ${excluded.length} not included · body ${body.length} blocks · practical ${practical.length} blocks`);

// ── Build the patch ───────────────────────────────────────────────────
const doc = await c.fetch(`*[_id==$id][0]`, { id: ID });
if (!doc) throw new Error('tour not found');
const setLoc = (arr, value, type) => {
  const list = Array.isArray(arr) ? arr.filter((x) => x._key !== LANG) : [];
  const item = { _key: LANG, value, ...(type ? { _type: type } : {}) };
  return [...list, item].sort((a, b) => ['en', 'es', 'ja'].indexOf(a._key) - ['en', 'es', 'ja'].indexOf(b._key));
};
const fact = (text) => ({ _type: 'productFact', _key: key(), lang: LANG, text, source: 'owner copy, 10 Nov 2026', needsReview: false });
const keepOther = (arr) => (Array.isArray(arr) ? arr.filter((f) => f.lang !== LANG) : []);
const oldDays = Array.isArray(doc.days) ? doc.days : [];
const newDays = days.map((d) => {
  const prev = oldDays.find((x) => x.dayNumber === d.n) || { _key: `day-${d.n}`, _type: 'tourDay', dayNumber: d.n };
  return { ...prev, dayNumber: d.n,
    title: setLoc(prev.title, d.title, 'internationalizedArrayStringValue'),
    morning: setLoc(prev.morning, d.blocks, 'object') };
});
const set = {
  title: setLoc(doc.title, title),
  summary: setLoc(doc.summary, summary, 'object'),
  body: setLoc(doc.body, body, 'object'),
  practicalInfo: setLoc(doc.practicalInfo, practical, 'object'),
  inclusions: [...keepOther(doc.inclusions), ...included.map(fact)],
  exclusions: [...keepOther(doc.exclusions), ...excluded.map(fact)],
  days: newDays,
};
if (LANG === 'en') Object.assign(set, { durationDays: 4, maxGroup: 10, priceFrom: 518 });
if (SEO[LANG]) {
  set['seo.metaTitle'] = setLoc(doc.seo?.metaTitle, SEO[LANG].metaTitle, 'internationalizedArrayStringValue');
  set['seo.metaDescription'] = setLoc(doc.seo?.metaDescription, SEO[LANG].metaDescription, 'internationalizedArrayTextValue');
}
const curTitle = doc.title?.find((x) => x._key === LANG)?.value;
console.log(`${ID} [${LANG}] title: ${curTitle} → ${title}`);
if (LANG === 'en') console.log(`  durationDays ${doc.durationDays} → 4 · maxGroup ${doc.maxGroup} → 10 · priceFrom €${doc.priceFrom} → €518`);
if (SEO[LANG]) console.log(`  seo.metaTitle → ${SEO[LANG].metaTitle} (${SEO[LANG].metaTitle.length})\n  seo.metaDescription → (${SEO[LANG].metaDescription.length} chars)`);
let tx = c.transaction().patch(c.patch(ID).setIfMissing({ seo: { _type: 'seo' } }).set(set));
const draft = await c.fetch(`count(*[_id==$d])`, { d: `drafts.${ID}` });
if (draft) console.log('  ⚠️ a Studio draft exists and is left untouched');
if (APPLY) { const r = await tx.commit({ autoGenerateArrayKeys: false }); console.log('committed', r.results.length); }
else console.log('(dry run — pass --apply)');
