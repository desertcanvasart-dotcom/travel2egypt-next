/**
 * The old-format day tours outside the Red Sea resorts (owner, 28 Nov 2026: "group 1, the day tours" of
 * review/old-format-tours-2026-11-28.md), rebuilt in the day-tour format, EN + ES + JA. Each page is updated IN
 * PLACE: same _id and slugs (URLs unchanged), hero, cities, tourMode and relatedTours untouched.
 *
 * Copy: review/locked/<slug>.md, .es.md, .ja.md (day-tour naming), audit notes in <slug>.changes.md.
 * Group tours (booked on Sawa from 14 Dec, PR #413): the price already on the page is Sawa's 4-traveller rate and
 * is kept; their last section ("Book this trip") is not written until the Sawa link-out ships, as with the group
 * packages. Private tours: config `price` 'keep' | 'unset' (owner rule 27 Nov: a missing price never blocks).
 * The old essay is hidden from "More about this day" (every block in skipRefs): it described the old product.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-old-daytours-2026-11-28.mjs [--only <slug>] [--drafts]   # dry run
 *   node --env-file=<.env> scripts/day-tour-format/import-old-daytours-2026-11-28.mjs [--only <slug>] --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { existsSync, readFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';
import { TOURS } from './import-old-daytours-2026-11-28.config.mjs';

const LANGS = ['en', 'es', 'ja'];
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const drafts = args.includes('--drafts');
if (apply && drafts) throw new Error('--drafts is for dry runs only');
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });

const PANEL = { en: { pickup: 'Pickup', lunch: 'Lunch' }, es: { pickup: 'Recogida', lunch: 'Almuerzo' }, ja: { pickup: 'お迎え', lunch: '昼食' } };
const PERIOD = { Morning: 'morning', Midday: 'midday', Afternoon: 'afternoon', Evening: 'evening', 'Early morning': 'morning', Mañana: 'morning', Mediodía: 'midday', Tarde: 'afternoon', Noche: 'evening', 'A primera hora': 'morning', 朝: 'morning', 早朝: 'morning', 午前: 'morning', 昼: 'midday', 午後: 'afternoon', 夕方: 'evening', 夜: 'evening' };
const EXTRA_TICKET = /extra ticket|ticket extra|entrada (aparte|extra)|entradas extra|別途(入場券|チケット)|追加の入場券/i;

const clean = (s) => s.replace(/[ \t　]+$/gm, '').trim();
const plain = (s) => clean(s.replace(/\*\*|\*/g, ''));
const sections = (md) => md.split(/\n## /).slice(1).map((s) => { const [h, ...rest] = s.split('\n'); return { h: h.trim(), text: rest.join('\n') }; });
const paras = (t) => t.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && p !== '---');
const bullets = (t) => t.split('\n').filter((l) => l.startsWith('- ')).map((l) => clean(l.slice(2)));
const SEP = /\s+[·・]\s+|・/;

function parseLocale(file, l, cfg) {
  const md = readFileSync(file, 'utf8');
  const title = plain(md.match(/^# (.+)$/m)[1]);
  const secs = sections(md);
  if (secs.length !== 7) throw new Error(`${file}: expected 7 sections, found ${secs.length} (${secs.map((s) => s.h).join(' | ')})`);
  const [panel, opening, why, day, incl, forYou, mine] = secs;
  const panelLines = panel.text.split('\n').map((x) => x.match(/^\*\*(.+?)[:：]\*\*\s*(.*)$/)).filter(Boolean).map((m) => [m[1], plain(m[2]).replace(/\s*\(ES: .*\)$/, '')]);
  const panelRows = Object.fromEntries(panelLines);
  const ownRows = panelLines.slice(1).filter(([, v]) => !/\{.*\}/.test(v)).map(([label, text]) => ({ label, text }));
  const periods = day.text.split(/\n### /).slice(1).map((chunk) => {
    const [head, ...rest] = chunk.split('\n');
    const [word, ...labelParts] = head.split(/\s*[·・]\s*/);
    // Headings that are not a time of day ("Before the flight · Almaza Airport") are shown as written (period 'label').
    const period = PERIOD[word.trim()] ?? (cfg.labelPeriods ? 'label' : null);
    if (!period || !labelParts.length) throw new Error(`${file}: unknown period heading "${head}"`);
    const stops = [];
    for (const p of paras(rest.join('\n'))) {
      if (p.startsWith('>')) continue;
      const lines = p.split('\n');
      const inc = p.match(/^\*\*(.+?)\*\*\s+([\s\S]+)$/);
      if (inc && !lines[0].endsWith('**')) { stops[stops.length - 1].includedNote = plain(`${inc[1]} ${inc[2]}`); continue; }
      const hm = lines[0].match(/^\*\*(.+)\*\*$/);
      if (!hm) throw new Error(`${file}: unexpected paragraph in "${head}": ${p.slice(0, 70)}`);
      const stop = { title: plain(hm[1]) };
      const body = [];
      for (const ln of lines.slice(1)) {
        const sm = ln.match(/^\*?(Sites|Lugares|見学地)[:：]\*?[:：]?\s*(.+)$/);
        if (sm) {
          const raw = plain(sm[2]);
          const whole = (cfg.jaSites?.[stop.title] ?? []);
          if (l === 'ja' && whole.length) { stop.sites = whole; if (whole.join('・') !== raw.replace(/\s+・\s+|\s+·\s+/g, '・')) throw new Error(`${file}: jaSites for "${stop.title}" do not match "${raw}"`); }
          else stop.sites = raw.split(l === 'ja' ? /\s*[·・]\s*/ : /\s+·\s+/).map((x) => x.trim()).filter(Boolean);
        } else if (ln.startsWith('- ')) (stop.optional ??= []).push(plain(ln.slice(2)));
        else body.push(ln);
      }
      if (body.length) stop.text = plain(body.join(' '));
      stops.push(stop);
    }
    return { period, periodLabel: period === 'label' ? plain(head) : plain(labelParts.join(l === 'ja' ? '・' : ' · ')), stops };
  });
  const sub = (t) => t.split(/\n(?=\*\*)/).map((blk) => ({ h: (blk.match(/^\*\*(.+?)\*\*/) ?? [])[1], items: bullets(blk).map(plain) })).filter((x) => x.h);
  const [inc, exc] = sub(incl.text);
  const [fit, worth] = sub(forYou.text);
  const tail = paras(mine.text);
  return {
    title, panelRows, ownRows, periods, mineHeading: mine.h,
    opening: plain(paras(opening.text)[0]), whyThisOrder: plain(paras(why.text)[0]),
    included: inc.items, excluded: exc.items, fitFor: fit.items, worthKnowing: worth.items,
    options: cfg.group ? [] : bullets(mine.text).map(plain),
    closingLine: cfg.group ? null : plain(tail[tail.length - 1]),
  };
}

// Guide links (weak): EN site name → guide article with that EN title, plus aliases.
const guides = await client.fetch('*[_type == "guideArticle" && !(_id in path("drafts.**")) && hidden != true]{_id, "t": title[_key == "en"][0].value}');
const norm = (t) => t.toLowerCase().replace(/[’']/g, '').replace(/\s*\(.*\)\s*$/, '').replace(/^the\s+/, '').trim();
const BY = new Map();
for (const g of guides.filter((x) => x.t)) for (const k of [g.t.toLowerCase(), norm(g.t), norm(g.t).replace(/ temple$/, '')]) if (!BY.has(k)) BY.set(k, g._id);
const ALIAS = {
  'Giza pyramids': 'guideArticle.giza.the-giza-plateau', 'Great Sphinx': 'guideArticle.giza.the-great-sphinx', Memphis: 'guideArticle.giza.memphis-mit-rahina', Saqqara: 'guideArticle.giza.the-saqqara-necropolis',
  'Valley of the Kings': 'guideArticle.luxor.valley-of-the-kings', 'Temple of Hatshepsut': 'guideArticle.luxor.the-mortuary-temple-of-queen-hatshepsut', 'Colossi of Memnon': 'guideArticle.luxor.the-colossi-of-memnon',
  'Temple of Horus at Edfu': 'guideArticle.edfu.edfu-temple', 'Temple of Kom Ombo': 'guideArticle.kom-ombo.the-temple-of-kom-ombo', 'Temple of Khnum': 'guideArticle.esna.the-temple-of-khnum-at-esna', Esna: 'guideArticle.esna.the-temple-of-khnum-at-esna',
  'Temple of Philae': 'guideArticle.aswan.the-philae-temple', 'Unfinished Obelisk': 'guideArticle.aswan.the-unfinished-obelisk', 'Aswan High Dam': 'wp-page-59236', 'Abu Simbel': 'guideArticle.abu-simbel.the-great-temple-of-abu-simbel', 'Great Temple of Ramses II': 'guideArticle.abu-simbel.the-great-temple-of-abu-simbel',
  'Khan El Khalili': 'guideArticle.cairo.khan-el-khalili', 'Egyptian Museum': 'guideArticle.cairo.egyptian-museum-of-antiquities',
};
const okAlias = new Set(await client.fetch('*[_id in $ids]._id', { ids: [...new Set(Object.values(ALIAS))] }));
const guideFor = (n) => (ALIAS[n] && okAlias.has(ALIAS[n]) ? ALIAS[n] : BY.get(n.toLowerCase()) ?? BY.get(norm(n)) ?? BY.get(norm(n).replace(/^temple of /, '')) ?? null);

let count = 0;
for (const [slug, cfg0] of Object.entries(TOURS)) {
  if (only && only !== slug) continue;
  // Per-tour jaSites / sameMeaning can also come from review/drafts/daytours-2026-11-28/<slug>.import.json.
  const extraFile = `review/drafts/daytours-2026-11-28/${slug}.import.json`;
  const cfg = { ...cfg0, ...(existsSync(extraFile) ? JSON.parse(readFileSync(extraFile, 'utf8')) : {}) };
  count++;
  const base = drafts ? `review/drafts/daytours-2026-11-28/${slug}` : `review/locked/${slug}`;
  const LOCKED = { en: `${base}.md`, es: `${base}.es.md`, ja: `${base}.ja.md` };
  for (const f of Object.values(LOCKED)) if (!existsSync(f)) throw new Error(`${slug}: ${f} missing`);
  const SRC = `Owner-reviewed copy "${slug}" (EN/ES/JA), 28 Nov 2026 (old-format day-tour batch).`;
  const P = Object.fromEntries(LANGS.map((l) => [l, parseLocale(LOCKED[l], l, cfg)]));
  const shape = (p) => JSON.stringify({ periods: p.periods.map((x) => [x.period, x.stops.map((s) => [!!s.text, s.sites?.length ?? 0, !!s.includedNote, s.optional?.length ?? 0])]), inc: p.included.length, exc: p.excluded.length, fit: p.fitFor.length, worth: p.worthKnowing.length, opts: p.options.length, rows: p.ownRows.length });
  for (const l of ['es', 'ja']) if (shape(P.en) !== shape(P[l])) throw new Error(`${slug} ${l} structure differs from EN:\n ${shape(P.en)}\n ${shape(P[l])}`);
  // The pickup row's label can differ (Nubian Life: "Starting point", no hotel pickup): config pickupLabel.
  const pickupLabel = (l) => cfg.pickupLabel?.[l] ?? PANEL[l].pickup;
  for (const l of LANGS) if (!P[l].panelRows[pickupLabel(l)]) throw new Error(`${slug} ${l}: no pickup row (${Object.keys(P[l].panelRows).join(', ')})`);

  const flat = (p) => ({
    opening: p.opening, why: p.whyThisOrder, closing: p.closingLine,
    ...Object.fromEntries(p.ownRows.map((r, i) => [`row${i}`, r.text])),
    ...Object.fromEntries(p.periods.flatMap((x, pi) => x.stops.flatMap((s, si) => [[`p${pi}s${si}.t`, s.title], [`p${pi}s${si}.x`, s.text], [`p${pi}s${si}.inc`, s.includedNote], ...(s.optional ?? []).map((o, i) => [`p${pi}s${si}.o${i}`, o])])).filter(([, v]) => v)),
    ...Object.fromEntries(p.included.map((t, i) => [`in${i}`, t])), ...Object.fromEntries(p.excluded.map((t, i) => [`ex${i}`, t])),
    ...Object.fromEntries(p.fitFor.map((t, i) => [`fit${i}`, t])), ...Object.fromEntries(p.worthKnowing.map((t, i) => [`wk${i}`, t])), ...Object.fromEntries(p.options.map((t, i) => [`op${i}`, t])),
  });
  for (const l of ['es', 'ja']) {
    const en = flat(P.en), lc = flat(P[l]);
    for (const k of cfg.sameMeaning?.[l] ?? []) { delete en[k]; delete lc[k]; }
    numericGate(en, lc, l);
  }

  const doc = await client.fetch('*[_type == "tour" && !(_id in path("drafts.**")) && slug[_key == "en"][0].value.current == $slug][0]', { slug });
  if (!doc) throw new Error(`${slug}: no published tour`);
  if (doc.type !== 'dayTour') throw new Error(`${slug}: type ${doc.type}`);
  if (!!cfg.group !== (doc.tourMode === 'group')) throw new Error(`${slug}: tourMode ${doc.tourMode}, config group=${!!cfg.group}`);
  if (await client.getDocument(`drafts.${doc._id}`)) throw new Error(`drafts.${doc._id} exists: handle it first`);

  function build(l) {
    const p = P[l];
    const enStops = P.en.periods.flatMap((x) => x.stops);
    let n = 0;
    const timeline = p.periods.map((x, pi) => ({
      _key: `${cfg.key}-${l}-${pi + 1}`, _type: 'dayTourPeriod', lang: l, period: x.period, periodLabel: x.periodLabel,
      stops: x.stops.map((s, si) => {
        const en = enStops[n++];
        return {
          _key: `s${pi + 1}-${si + 1}`, _type: 'dayTourStop', title: s.title, ...(s.text ? { text: s.text } : {}),
          ...(s.includedNote ? { includedNote: s.includedNote } : {}),
          ...(s.optional ? { skipGlance: true, optional: s.optional.map((text, k) => ({ _key: `o${k + 1}`, _type: 'dayTourOptional', text, cost: EXTRA_TICKET.test(en.optional[k]) ? 'extraTicket' : 'extraCost' })) } : {}),
          ...(s.sites ? { sites: s.sites.map((name, k) => { const g = guideFor(en.sites[k]); return { _key: `x${pi + 1}${si + 1}${k}`, _type: 'dayTourSite', name, ...(g ? { guideRef: { _type: 'reference', _ref: g, _weak: true } } : {}) }; }) } : {}),
        };
      }),
      source: SRC, needsReview: false,
    }));
    const fact = (list, prefix) => list.map((t, i) => ({ _key: `${cfg.key}${prefix}${i + 1}-${l}`, _type: 'productFact', lang: l, text: t, source: SRC, needsReview: false }));
    const essayKeys = (doc.body?.find((r) => r._key === l)?.value ?? []).map((b) => b._key).filter(Boolean);
    return {
      timeline,
      intro: {
        _key: `dti-${l}`, _type: 'dayTourIntro', lang: l, opening: p.opening, whyThisOrder: p.whyThisOrder,
        pickupLine: p.panelRows[pickupLabel(l)],
        panelRows: p.ownRows.map((r, i) => ({ _key: `pr${i + 1}`, _type: 'dayPanelRow', ...r })),
        lunch: { status: cfg.lunch, ...(p.panelRows[PANEL[l].lunch] ? { text: p.panelRows[PANEL[l].lunch] } : {}) },
        fitFor: p.fitFor, worthKnowing: p.worthKnowing, ...(p.closingLine ? { closingLine: p.closingLine } : {}),
        skipRefs: essayKeys, source: SRC, needsReview: false,
      },
      included: fact(p.included, 'in'), excluded: fact(p.excluded, 'ex'), options: fact(p.options, 'op'),
    };
  }
  const B = Object.fromEntries(LANGS.map((l) => [l, build(l)]));
  const loc = (field, type, m) => LANGS.map((l) => ({ ...(doc[field]?.find((t) => t._key === l) ?? { _key: l, _type: type }), value: m[l] }));
  const set = {
    title: loc('title', 'internationalizedArrayStringValue', Object.fromEntries(LANGS.map((l) => [l, P[l].title]))),
    summary: loc('summary', 'internationalizedArrayTextValue', Object.fromEntries(LANGS.map((l) => [l, P[l].opening]))),
    durationLabel: loc('durationLabel', 'internationalizedArrayStringValue', cfg.durationLabel),
    durationHours: cfg.durationHours,
    ...(cfg.group ? { groupSize: loc('groupSize', 'internationalizedArrayStringValue', { en: '4–8 guests', es: '4–8 personas', ja: '4〜8名' }) } : {}),
    dayTourIntro: LANGS.map((l) => B[l].intro),
    dayTimeline: LANGS.flatMap((l) => B[l].timeline),
    inclusions: LANGS.flatMap((l) => B[l].included),
    exclusions: LANGS.flatMap((l) => B[l].excluded),
    customisationOptions: LANGS.flatMap((l) => B[l].options),
  };
  const F = ['dayTourIntro', 'dayTimeline', 'inclusions', 'exclusions', 'customisationOptions'];
  for (const f of F) set[f] = curlyRows(set[f], 'en');
  for (const l of LANGS) {
    const rows = F.flatMap((f) => set[f].filter((r) => r.lang === l));
    verbatimPreflight([...visibleStrings(rows, l).filter((x) => !/^(dayTour|productFact)/.test(x)), P[l].title], [LOCKED[l]]);
  }
  await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });

  const unset = !cfg.group && cfg.price === 'unset' ? ['priceFrom', 'guideLanguagePrices'] : [];
  const sites = B.en.timeline.flatMap((x) => x.stops).flatMap((s) => s.sites ?? []);
  console.log(`\n== ${slug} (${doc._id}) ${cfg.group ? 'GROUP' : 'private'}`);
  console.log(`  title: ${P.en.title}\n  hours ${doc.durationHours} → ${cfg.durationHours} · lunch ${cfg.lunch} · price €${doc.priceFrom ?? '—'} ${unset.length ? 'REMOVED' : 'kept'} · sites linked ${sites.filter((s) => s.guideRef).length}/${sites.length} · essay hidden (${B.en.intro.skipRefs.length} blocks)`);
  console.log(`  timeline: ${B.en.timeline.map((x) => `${x.period}: ${x.stops.map((s) => s.title).join(' / ')}`).join(' | ')}`);
  for (const f of F) console.log(`  ${f}: ${(doc[f] ?? []).length} → ${set[f].length}`);

  if (apply) {
    await writeRollback(client, [doc._id], 'before-old-daytour-batch');
    const tx = client.patch(doc._id).set(set);
    await (unset.length ? tx.unset(unset) : tx).commit();
    console.log(`APPLIED: ${doc._id}`);
  }
}
if (only && !count) throw new Error(`--only ${only}: not in config`);
if (!apply) console.log(`\ndry run, ${count} tour(s) (pass --apply --flags-approved to write production)`);
