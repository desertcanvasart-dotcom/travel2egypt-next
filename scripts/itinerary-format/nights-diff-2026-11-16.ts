/**
 * Read-only: which products' panel Nights row changes with the computed
 * count (2026-11-16)? Replays the old and the new PackageView logic per
 * language over production data.
 *   npx tsx --env-file=<.env> scripts/itinerary-format/nights-diff-2026-11-16.ts
 */
import { createClient } from '@sanity/client';
import { countNights, nightParts } from '../../src/lib/products/nights';

async function main() {
const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
type Row = { lang: string; day: number; overnight?: string; needsReview?: boolean; overnightNeedsReview?: boolean };
const docs: Array<{ _id: string; slug: string; durationDays?: number; type?: string; tourMode?: string; rows?: Row[]; days?: Array<{ acc?: Array<{ _key: string; value?: string }> | string }> }> = await c.fetch(
  `*[_type=="tour" && !(_id in path("drafts.**")) && type != "dayTour"]{_id, "slug": slug[_key=="en"][0].value.current, durationDays, type, tourMode, "rows": itineraryDays, "days": days[]{ "acc": accommodation }}`,
);
const CRUISE_RE = /cruise|nile|dahabiya|river|boat|felucca/i;
const W = { en: { hotel: (n: number) => `${n} hotel`, train: (n: number) => `${n} sleeper train`, river: (n: number) => `${n} on the river`, camp: (n: number) => `${n} in camp` } };
const out: string[] = [];
for (const d of docs) {
  for (const L of ['en', 'es', 'ja']) {
    const rows = (d.rows ?? []).filter((r) => r.lang === L).sort((a, b) => a.day - b.day);
    const acc = (d.days ?? []).map((x) => (Array.isArray(x.acc) ? x.acc.find((v) => v._key === L)?.value ?? x.acc.find((v) => v._key === 'en')?.value : x.acc)).filter(Boolean) as string[];
    const days = (d.days ?? []).length;
    const dur = d.durationDays ?? days;
    // OLD
    const oldItin = rows.length > 0 && rows.every((r) => r.needsReview === false && r.overnightNeedsReview === false) ? rows : [];
    const oldCovers = oldItin.length > 0 && oldItin.length === dur;
    const oldNights = oldCovers ? oldItin.filter((r) => r.overnight).length : dur > 0 ? dur - 1 : 0;
    const oldRiver = oldCovers ? oldItin.filter((r) => r.overnight && CRUISE_RE.test(r.overnight)).length : acc.filter((a) => CRUISE_RE.test(a)).length;
    const oldSplit = oldRiver > 0 && oldNights > 0 ? `${Math.max(oldNights - oldRiver, 0)} hotel · ${oldRiver} on the river` : '';
    // NEW
    const newItin = rows.length > 0 && rows.every((r) => r.overnightNeedsReview === false) ? rows : [];
    const covers = newItin.length > 0 && newItin.length === dur;
    let counts = covers ? countNights(newItin.map((r) => r.overnight)) : null;
    if (!counts && acc.length) { const k = countNights(acc); const total = dur > 0 ? dur - 1 : k.total; counts = { ...k, hotel: Math.max(total - k.train - k.river - k.camp, 0), total }; }
    const newNights = counts ? counts.total : dur > 0 ? dur - 1 : 0;
    const parts = counts ? nightParts(counts) : [];
    const newSplit = parts.length > 1 ? parts.map((p) => W.en[p.kind](p.n)).join(' · ') : '';
    if (oldSplit !== newSplit || oldNights !== newNights) out.push(`| ${d.slug} | ${L} | ${oldNights} nights; ${oldSplit || '—'} | ${newNights} nights; ${newSplit || '—'} |`);
  }
}
console.log(`${docs.length} multi-day products checked; ${out.length} product-language rows change (split shown in EN words).\n`);
console.log('| product | lang | before (Duration nights; Nights row) | after |\n|---|---|---|---|');
console.log(out.join('\n'));
}
main();
