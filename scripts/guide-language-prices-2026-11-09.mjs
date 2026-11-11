/**
 * Guide-language prices (owner decision 2026-11-09).
 *
 * Rule: a Spanish-speaking guide costs $25 more per group per guided day, a
 * Japanese-speaking guide $40 more. Prices on the site are per person with two
 * sharing, so each person's share is half: $12.50 (ES) / $20 (JA) per guided
 * day. Prices are stored in EUR; the supplement is converted from USD at the
 * day's ECB rate (the rate the site displays with).
 *
 * Guided days: day tour = 1; package = length − arrival − departure
 * (minimum 1; 2-day packages count both days). Every figure is reviewed by the
 * owner before anything is written.
 *
 *   node scripts/guide-language-prices-2026-11-09.mjs            → writes the review CSV
 *   node scripts/guide-language-prices-2026-11-09.mjs --import <reviewed.csv> [--write]
 *        imports the es_eur / ja_eur columns as approved (dry run without --write;
 *        backup to backups/guide-prices-before-<date>.json)
 */
import 'dotenv/config';
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });

// Today's ECB reference rates (the site's live rates), falling back to the
// old fixed rates if the feed can't be reached.
const fx = await fetch('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD,JPY')
  .then((r) => (r.ok ? r.json() : null))
  .catch(() => null);
const USD_PER_EUR = fx?.rates?.USD ?? 1.08;
const JPY_PER_EUR = fx?.rates?.JPY ?? 170;
console.log(`rates: ${fx ? `ECB ${fx.date}` : 'fallback'}: EUR 1 = USD ${USD_PER_EUR}, JPY ${JPY_PER_EUR}`);
const PER_GROUP_DAY_USD = { es: 25, ja: 40 };
const SHARING = 2;
const perPersonDayEur = (l) => PER_GROUP_DAY_USD[l] / SHARING / USD_PER_EUR;

const usd = (eur) => Math.round((eur * USD_PER_EUR) / 10) * 10;
const jpy = (eur) => Math.round((eur * JPY_PER_EUR) / 1000) * 1000;

function guidedDays(t) {
  if (t.type === 'dayTour') return 1;
  const d = t.durationDays ?? 0;
  if (d <= 0) return null;
  return d <= 2 ? d : Math.max(1, d - 2);
}

const NO_GUIDE = /transfer|balloon|stay|sound-and-light|show|dinner|snorkel|diving|quad|horse|camel-ride|spa|airport/i;

function flags(t, days) {
  const f = [];
  if (t.tourMode === 'group') f.push('small-group departure: a shared guide, so the per-group fee and 2-sharing split may not apply');
  if (NO_GUIDE.test(t.slug)) f.push('check: may not involve a guide');
  if (t.type === 'package' && (t.durationDays ?? 0) <= 2) f.push('2-day package: counted both days');
  if (days === null) f.push('no duration set: guided days unknown, prices left blank');
  if (t.guideLanguagePrices?.es || t.guideLanguagePrices?.ja) f.push('already has guide prices');
  return f.join('; ');
}

const q = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;

if (!process.argv.includes('--import')) {
  const tours = await c.fetch(`*[_type=="tour" && !(_id in path("drafts.**")) && priceFrom > 0]{
    _id, type, tourMode, durationDays, priceFrom, guideLanguagePrices,
    "slug": slug[_key=="en"][0].value.current, "title": title[_key=="en"][0].value
  } | order(type asc, tourMode desc, durationDays asc, title asc)`);
  const rows = [['id', 'title', 'url', 'type', 'mode', 'days', 'guided_days', 'en_eur', 'es_eur', 'ja_eur', 'en_usd', 'es_usd', 'ja_usd', 'ja_jpy_on_site', 'notes']];
  for (const t of tours) {
    const days = guidedDays(t);
    const es = days === null ? '' : Math.round(t.priceFrom + days * perPersonDayEur('es'));
    const ja = days === null ? '' : Math.round(t.priceFrom + days * perPersonDayEur('ja'));
    rows.push([
      t._id, t.title, `https://travel2egypt.org/${t.slug}`, t.type === 'dayTour' ? 'day tour' : 'package', t.tourMode ?? '',
      t.durationDays ?? (t.type === 'dayTour' ? 1 : ''), days ?? '',
      t.priceFrom, es, ja, usd(t.priceFrom), es === '' ? '' : usd(es), ja === '' ? '' : usd(ja), ja === '' ? '' : jpy(ja),
      flags(t, days),
    ]);
  }
  const out = 'docs/guide-language-prices-review-2026-11-09.csv';
  fs.writeFileSync(out, rows.map((r) => r.map(q).join(',')).join('\n') + '\n');
  const flagged = rows.slice(1).filter((r) => r[14]).length;
  console.log(`${rows.length - 1} tours → ${out} (${flagged} flagged for review)`);
  console.log(`per person per guided day: ES €${perPersonDayEur('es').toFixed(2)} ($12.50), JA €${perPersonDayEur('ja').toFixed(2)} ($20)`);
  process.exit(0);
}

// ── Import the reviewed CSV ───────────────────────────────────────────────
const file = process.argv[process.argv.indexOf('--import') + 1];
const write = process.argv.includes('--write');
const parse = (line) => {
  const out = []; let cur = ''; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') inQ = false; else cur += ch; }
    else if (ch === '"') inQ = true; else if (ch === ',') { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur); return out;
};
const [head, ...lines] = fs.readFileSync(file, 'utf8').trim().split('\n').map(parse);
const col = (n) => head.indexOf(n);
const patches = [];
for (const r of lines) {
  const id = r[col('id')];
  const es = r[col('es_eur')] === '' ? null : Number(r[col('es_eur')]);
  const ja = r[col('ja_eur')] === '' ? null : Number(r[col('ja_eur')]);
  if ((es !== null && !(es > 0)) || (ja !== null && !(ja > 0))) throw new Error(`bad price on ${id}`);
  if (es === null && ja === null) continue;
  patches.push([id, { ...(es !== null ? { es } : {}), ...(ja !== null ? { ja } : {}) }]);
}
console.log(`${patches.length} tours to update`);
if (!write) { console.log('dry run — pass --write'); process.exit(0); }
const ids = patches.map(([id]) => id);
const before = await c.fetch(`*[_id in $ids]{_id, priceFrom, guideLanguagePrices}`, { ids });
fs.mkdirSync('backups', { recursive: true });
fs.writeFileSync(`backups/guide-prices-before-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(before, null, 2));
for (let i = 0; i < patches.length; i += 50) {
  const tx = c.transaction();
  for (const [id, gp] of patches.slice(i, i + 50)) tx.patch(id, (p) => p.set({ guideLanguagePrices: { _type: 'object', ...gp } }));
  await tx.commit();
}
console.log('written', patches.length);
