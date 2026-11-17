/**
 * Giza, Memphis & Saqqara in the day-tour format, EN + ES + JA together
 * (canon VI.3). Supersedes the EN-only 2026-11-16 import.
 *
 *  - EN: the prepared data module (giza-memphis-saqqara.data.mjs), unchanged.
 *  - ES / JA: parsed from the owner's locked files (17 Nov,
 *    review/locked/giza-memphis-saqqara-day-tour.{es,ja}.md) onto the EN
 *    structure, stop by stop; every string word-for-word (Gate A-2).
 *  - Title (the owner's new title, ×3), durationHours 8.5 and the duration
 *    labels (×3, as the locked panels write them).
 *  - Essay (Gate A.3), the owner's three approved corrections (open items,
 *    16 Nov) in all three languages; trailing lines after the closing line
 *    (EN "camel ride is included", ES call-to-action lines, JA concierge line)
 *    are left out of the expander via skipRefs, not edited.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-giza-memphis-saqqara-2026-11-17.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-giza-memphis-saqqara-2026-11-17.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-giza-memphis-saqqara-2026-11-17.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';
import { DOC_ID, LOCKED_EN, TIMELINE_EN, INTRO_EN, INCLUDED_EN, NOT_INCLUDED_EN, OPTIONS_EN, GUIDE_IDS, DURATION_HOURS } from './giza-memphis-saqqara.data.mjs';

const ROOT = new URL('../../', import.meta.url);
const LOCKED = { en: LOCKED_EN, es: 'review/locked/giza-memphis-saqqara-day-tour.es.md', ja: 'review/locked/giza-memphis-saqqara-day-tour.ja.md' };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (17 Nov 2026, ready for upload).`;

/* ── Parse an ES/JA locked file onto the EN structure ─────────────────── */
const clean = (s) => s.replace(/[ \t]+$/gm, '').trim();
const sections = (md) => md.split(/\n## /).slice(1).map((s) => { const [h, ...rest] = s.split('\n'); return { h: h.trim(), text: rest.join('\n') }; });
const paras = (t) => t.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && p !== '---');
const bullets = (t) => t.split('\n').filter((l) => l.startsWith('- ')).map((l) => clean(l.slice(2)));
function parseLocale(l) {
  const md = readFileSync(new URL(LOCKED[l], ROOT), 'utf8');
  const title = clean(md.match(/^# (.+)$/m)[1]);
  const [panel, opening, why, day, incl, forYou, mine] = sections(md);
  const panelRows = Object.fromEntries(panel.text.split('\n').map((x) => x.match(/^\*\*(.+?)[:：]\*\*\s*(.*)$/)).filter(Boolean).map((m) => [m[1], m[2].trim()]));
  const periods = day.text.split(/\n### /).slice(1).map((chunk) => {
    const [head, ...rest] = chunk.split('\n');
    const periodLabel = clean(head.replace(/^[^·・]+[·・]\s*/, ''));
    const stops = [];
    for (const p of paras(rest.join('\n'))) {
      if (p.startsWith('>')) continue;
      const lines = p.split('\n');
      const inc = p.match(/^\*\*(.+?)\*\*\s+([\s\S]+)$/);
      if (inc && !lines[0].endsWith('**')) {
        // "**Inside a pyramid (included).** text" → the previous stop's includedNote, as one string.
        stops[stops.length - 1].includedNote = clean(`${inc[1]} ${inc[2]}`);
        continue;
      }
      const hm = lines[0].match(/^\*\*(.+)\*\*$/);
      if (!hm) throw new Error(`${l}: unexpected paragraph in "${periodLabel}": ${p.slice(0, 60)}`);
      const tm = hm[1].match(/^(\d\d:\d\d)\s*[·・]\s*(.+)$/);
      const stop = { ...(tm ? { time: tm[1], title: clean(tm[2]) } : { title: clean(hm[1]) }) };
      const body = [];
      for (const ln of lines.slice(1)) {
        const sm = ln.match(/^\*?(Lugares|見学地)[:：]\*?[:：]?\s*(.+)$/);
        if (sm) stop.sites = sm[2].split(l === 'ja' ? '・' : ' · ').map((x) => x.trim());
        else if (ln.startsWith('- ')) (stop.optional ??= []).push(clean(ln.slice(2)));
        else body.push(ln);
      }
      if (body.length) stop.text = clean(body.join(' '));
      stops.push(stop);
    }
    return { periodLabel, stops };
  });
  const sub = (t) => t.split(/\n(?=\*\*)/).map((blk) => ({ h: (blk.match(/^\*\*(.+?)\*\*/) ?? [])[1], items: bullets(blk) })).filter((x) => x.h);
  const [inc, exc] = sub(incl.text);
  const [fit, worth] = sub(forYou.text);
  const tail = paras(mine.text);
  return {
    title, panelRows, periods,
    opening: clean(paras(opening.text)[0]),
    whyThisOrder: clean(paras(why.text)[0]),
    included: inc.items, excluded: exc.items, fitFor: fit.items, worthKnowing: worth.items,
    options: bullets(mine.text),
    closingLine: clean(tail[tail.length - 1].replace(/^\*(.*)\*$/, '$1')),
  };
}

const P = { es: parseLocale('es'), ja: parseLocale('ja') };
const LUNCH = { es: 'Almuerzo', ja: '昼食' };
const DURATION_LABEL = { en: 'Full day · ~8½ hrs', es: 'Día completo · ~8½ h', ja: '終日・約8時間半' };
const TITLE = { en: 'Giza, Memphis & Saqqara: Private Day Tour' };

/* ── Build the ES/JA rows on the EN structure ─────────────────────────── */
function buildLocale(l) {
  const p = P[l];
  if (p.periods.length !== TIMELINE_EN.length) throw new Error(`${l}: ${p.periods.length} periods, EN has ${TIMELINE_EN.length}`);
  const timeline = TIMELINE_EN.map((en, pi) => {
    const lp = p.periods[pi];
    if (lp.stops.length !== en.stops.length) throw new Error(`${l} period ${pi + 1}: ${lp.stops.length} stops, EN has ${en.stops.length}`);
    return {
      ...en,
      _key: `dt-${l}-${pi + 1}`,
      lang: l,
      periodLabel: lp.periodLabel,
      stops: en.stops.map((s, si) => {
        const ls = lp.stops[si];
        if ((s.time ?? null) !== (ls.time ?? null)) throw new Error(`${l} p${pi + 1}s${si + 1}: time ${ls.time} ≠ EN ${s.time}`);
        if (!!s.text !== !!ls.text || !!s.includedNote !== !!ls.includedNote || (s.sites?.length ?? 0) !== (ls.sites?.length ?? 0) || (s.optional?.length ?? 0) !== (ls.optional?.length ?? 0)) {
          throw new Error(`${l} p${pi + 1}s${si + 1} ("${ls.title}"): structure differs from EN`);
        }
        return {
          ...s,
          title: ls.title,
          ...(s.text ? { text: ls.text } : {}),
          ...(s.includedNote ? { includedNote: ls.includedNote } : {}),
          ...(s.sites ? { sites: s.sites.map((x, k) => ({ ...x, name: ls.sites[k] })) } : {}),
          ...(s.optional
            ? {
                optional: s.optional.map((o, i) => {
                  const t = ls.optional[i];
                  if (!o.note) return { ...o, text: t };
                  // EN keeps the welfare line as a note: split after the first sentence.
                  const m = l === 'ja' ? t.match(/^(.+?。)(.+)$/) : t.match(/^(.+?\.)\s+(.+)$/);
                  return { ...o, text: m[1], note: m[2] };
                }),
              }
            : {}),
        };
      }),
      source: SRC(l),
      needsReview: false,
    };
  });
  const intro = {
    ...INTRO_EN,
    _key: `dti-${l}`,
    lang: l,
    opening: p.opening,
    whyThisOrder: p.whyThisOrder,
    lunch: { ...INTRO_EN.lunch, text: p.panelRows[LUNCH[l]] },
    fitFor: p.fitFor,
    worthKnowing: p.worthKnowing,
    closingLine: p.closingLine,
    source: SRC(l),
    needsReview: false,
  };
  const fact = (list, prefix) => list.map((t, i) => ({ _key: `${prefix}${i + 1}-${l}`, _type: 'productFact', lang: l, text: t, source: SRC(l), needsReview: false }));
  for (const [a, b, n] of [[p.included, INCLUDED_EN, 'included'], [p.excluded, NOT_INCLUDED_EN, 'not included'], [p.options, OPTIONS_EN, 'options'], [p.fitFor, INTRO_EN.fitFor, 'fit'], [p.worthKnowing, INTRO_EN.worthKnowing, 'worth']]) {
    if (a.length !== b.length) throw new Error(`${l} ${n}: ${a.length} rows, EN has ${b.length}`);
  }
  return { timeline, intro, included: fact(p.included, 'msin'), excluded: fact(p.excluded, 'msout'), options: fact(p.options, 'msopt') };
}
const B = { es: buildLocale('es'), ja: buildLocale('ja') };

/* ── Numeric gate: ES/JA figures equal EN, string by string ──────────── */
const flatTimeline = (rows) => Object.fromEntries(rows.flatMap((p, pi) => p.stops.flatMap((s, si) => [
  [`p${pi}s${si}.text`, s.text], [`p${pi}s${si}.inc`, s.includedNote], ...(s.optional ?? []).map((o, i) => [`p${pi}s${si}.o${i}`, o.text]),
])).filter(([, v]) => v));
const flat = (tl, intro, inc, exc) => ({ ...flatTimeline(tl), opening: intro.opening, why: intro.whyThisOrder, ...Object.fromEntries(inc.map((r, i) => [`in${i}`, r.text ?? r])), ...Object.fromEntries(exc.map((r, i) => [`ex${i}`, r.text ?? r])) });
const enFlat = flat(TIMELINE_EN, INTRO_EN, INCLUDED_EN, NOT_INCLUDED_EN);
for (const l of ['es', 'ja']) numericGate(enFlat, flat(B[l].timeline, B[l].intro, B[l].included, B[l].excluded), l);

/* ── Document ─────────────────────────────────────────────────────────── */
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const doc = await client.getDocument(DOC_ID);
if (!doc) throw new Error(`${DOC_ID} not found`);
const essay = (l) => doc.body?.find((b) => b._key === l)?.value ?? [];
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');

// Closing line block and trailing lines per language.
const CLOSING_REF = { en: '00000000003b', es: '00000000003d', ja: '000000000041' };
const SKIP = { en: ['000000000049'], es: ['00000000004d', '000000000050'], ja: ['00000000004f'] };
for (const l of ['en', 'es', 'ja']) {
  const keys = new Set(essay(l).map((b) => b._key));
  for (const k of [CLOSING_REF[l], ...SKIP[l]]) if (!keys.has(k)) throw new Error(`${l}: essay block ${k} missing`);
}

// Essay corrections (owner-approved, open items 16 Nov). [block key, exact text to find, replacement].
const FIX = {
  en: [
    ['000000000011', 'built across roughly seventy years — from around 2560 to 2490 BC —', 'built across roughly eighty years, around 2500 BC,'],
    ['00000000001f', null, ' A camel ride is available as an extra.'],
  ],
  es: [
    ['000000000013', 'a lo largo de aproximadamente setenta años —desde alrededor de 2560 a 2490 a. C.—', 'a lo largo de aproximadamente ochenta años, hacia el 2500 a. C.,'],
    ['000000000021', null, ' El paseo en camello está disponible como extra.'],
  ],
  ja: [
    ['000000000017', 'おおよそ70年——紀元前2560年ごろから2490年ごろ——にわたって', '紀元前2500年ごろ、おおよそ80年のあいだに'],
    ['000000000025', null, 'ラクダ乗りは別料金のオプションです。'],
  ],
};
// "The painted mastaba tombs are an optional extra on this tour." directly before the mastaba paragraph.
const MASTABA = {
  en: ['000000000033', 'The painted mastaba tombs are an optional extra on this tour.'],
  es: ['000000000035', 'Las mastabas pintadas son un extra opcional en esta excursión.'],
  ja: ['000000000039', '彩色マスタバ墳は、このツアーではオプション（別料金）です。'],
};
const para = (key, text) => ({ _key: key, _type: 'block', style: 'normal', markDefs: [], children: [{ _key: `${key}s`, _type: 'span', text, marks: [] }] });
const body = (doc.body ?? []).map((row) => {
  const l = row._key;
  if (!FIX[l]) return row;
  let blocks = row.value.map((b) => {
    const f = FIX[l].find(([k]) => k === b._key);
    if (!f) return b;
    const [, find, repl] = f;
    const before = textOf(b);
    if (find && !before.includes(find)) throw new Error(`${l} ${b._key}: text to correct not found`);
    if (!find && before.includes(repl.trim())) return b; // already corrected
    const spans = b.children.map((c) => ({ ...c }));
    if (find) {
      const i = spans.findIndex((c) => c.text.includes(find));
      if (i < 0) throw new Error(`${l} ${b._key}: correction spans several text runs`);
      spans[i].text = spans[i].text.replace(find, repl);
    } else spans[spans.length - 1].text += repl;
    return { ...b, children: spans };
  });
  const [mk, mtext] = MASTABA[l];
  if (!blocks.some((b) => textOf(b) === mtext)) {
    const at = blocks.findIndex((b) => b._key === mk);
    if (at < 0) throw new Error(`${l}: mastaba paragraph ${mk} missing`);
    blocks = [...blocks.slice(0, at), para(`mastaba-${l}`, mtext), ...blocks.slice(at)];
  }
  return { ...row, value: blocks };
});

const others = (rows, keep) => (rows ?? []).filter((r) => !['en', 'es', 'ja'].includes(r.lang) || keep(r));
const ok = (rows) => rows.map((r) => ({ ...r, needsReview: false }));
const introEn = { ...INTRO_EN, closingRef: CLOSING_REF.en, skipRefs: SKIP.en, needsReview: false };
const set = {
  title: (doc.title ?? []).map((t) => ({ ...t, value: t._key === 'en' ? TITLE.en : P[t._key]?.title ?? t.value })),
  durationLabel: (doc.durationLabel ?? []).map((t) => ({ ...t, value: DURATION_LABEL[t._key] ?? t.value })),
  durationHours: DURATION_HOURS,
  dayTourIntro: [introEn, ...['es', 'ja'].map((l) => ({ ...B[l].intro, closingRef: CLOSING_REF[l], skipRefs: SKIP[l] }))],
  dayTimeline: [...ok(TIMELINE_EN), ...B.es.timeline, ...B.ja.timeline],
  inclusions: [...ok(INCLUDED_EN), ...B.es.included, ...B.ja.included],
  exclusions: [...ok(NOT_INCLUDED_EN), ...B.es.excluded, ...B.ja.excluded],
  customisationOptions: [...ok(OPTIONS_EN), ...B.es.options, ...B.ja.options],
  body,
};
for (const f of ['dayTourIntro', 'dayTimeline', 'inclusions', 'exclusions', 'customisationOptions']) set[f] = curlyRows(set[f], 'en');

/* ── Gates ────────────────────────────────────────────────────────────── */
for (const l of ['en', 'es', 'ja']) {
  const rows = ['dayTourIntro', 'dayTimeline', 'inclusions', 'exclusions', 'customisationOptions'].flatMap((f) => set[f].filter((r) => r.lang === l));
  const strings = [...visibleStrings(rows, l), set.title.find((t) => t._key === l).value];
  verbatimPreflight(strings, [LOCKED[l]]);
}
await contentGate({ locked: ['en', 'es', 'ja'].map((l) => [LOCKED[l], l]), apply });

for (const f of Object.keys(set)) {
  if (f === 'body') continue;
  const v = set[f];
  console.log(`${f}: ${Array.isArray(v) ? `${(doc[f] ?? []).length} → ${v.length} rows` : `${JSON.stringify(doc[f])} → ${JSON.stringify(v)}`}`);
}
for (const l of ['en', 'es', 'ja']) {
  console.log(`title ${l}: ${doc.title.find((t) => t._key === l).value} → ${set.title.find((t) => t._key === l).value}`);
  const after = set.body.find((r) => r._key === l).value;
  const changed = after.filter((b) => textOf(b) !== textOf(essay(l).find((x) => x._key === b._key) ?? {}));
  for (const b of changed) console.log(`essay ${l} ${b._key}: ${textOf(b).slice(0, 160)}…`);
}

if (previewOut) {
  const refs = await client.fetch(`*[_id in $ids]`, { ids: GUIDE_IDS });
  const cityIds = [...new Set([...refs.map((r) => r.parentCity?._ref), ...(doc.cities ?? []).map((c) => c._ref)].filter(Boolean))];
  const cities = await client.fetch(`*[_id in $ids]`, { ids: cityIds });
  const dataset = [{ ...doc, ...set }, ...refs, ...cities];
  const { tourBySlugQuery } = await import('../../src/sanity/lib/queries.ts');
  const out = {};
  for (const l of ['en', 'es', 'ja']) {
    const slug = doc.slug.find((s) => s._key === l).value.current;
    const r = await (await evaluate(gparse(tourBySlugQuery(l)), { dataset, params: { slug } })).get();
    out[l] = Object.fromEntries(['title', 'approvedInclusions', 'approvedExclusionRows', 'approvedOptions', 'dayTourFormat', 'durationHours'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  await writeRollback(client, [DOC_ID], 'before-memphis-import-3lang');
  await client.patch(DOC_ID).set(set).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (pass --apply --flags-approved to write production)');
