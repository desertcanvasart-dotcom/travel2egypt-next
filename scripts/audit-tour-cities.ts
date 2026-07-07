/**
 * Read-only audit: find tours whose `cities` reference likely doesn't match the
 * tour's actual content (like ramasside-tours pointing at Cairo while the copy
 * is all Sharm). Heuristic, for human review — makes no writes.
 *
 * Flags:
 *   MISMATCH        referenced city name absent from title+summary, AND a
 *                   different city's name IS present  (strong signal)
 *   NO_CITY         no cities reference at all (blank "WHERE")
 *   REF_NOT_IN_TEXT referenced city absent from text, no other city found (weak)
 *
 *   tsx scripts/audit-tour-cities.ts
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  useCdn: false,
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
});

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

async function main() {
  const cities = await client.fetch<Array<{ _id: string; name: string | null }>>(
    `*[_type=="city" && !(_id in path("drafts.**"))]{ _id, "name": name[_key=="en"][0].value }`
  );
  const cityById = new Map(cities.map((c) => [c._id, c.name ?? c._id]));
  // Only match reasonably specific city names (avoid 1-2 char noise).
  const matchable = cities.filter((c) => c.name && c.name.length >= 4);

  const tours = await client.fetch<Array<{ _id: string; slug: string | null; title: string | null; summary: string | null; refs: string[] | null }>>(
    `*[_type=="tour" && !(_id in path("drafts.**"))]{
      _id, "slug": slug[_key=="en"][0].value.current,
      "title": title[_key=="en"][0].value, "summary": summary[_key=="en"][0].value,
      "refs": cities[]._ref
    }`
  );

  const rows: Array<{ flag: string; slug: string; detail: string }> = [];
  for (const t of tours) {
    const text = norm(`${t.title ?? ''} ${t.summary ?? ''}`);
    const refs = t.refs ?? [];
    if (refs.length === 0) {
      rows.push({ flag: 'NO_CITY', slug: t.slug ?? t._id, detail: `"${t.title ?? ''}"` });
      continue;
    }
    const refNames = refs.map((r) => cityById.get(r) ?? r);
    const refInText = refNames.some((n) => typeof n === 'string' && text.includes(norm(n)));
    if (refInText) continue; // referenced city is mentioned — looks consistent
    const otherHits = matchable.filter((c) => !refs.includes(c._id) && text.includes(norm(c.name!))).map((c) => c.name!);
    if (otherHits.length > 0) {
      rows.push({ flag: 'MISMATCH', slug: t.slug ?? t._id, detail: `ref=[${refNames.join(', ')}] but content mentions [${[...new Set(otherHits)].join(', ')}] — "${t.title ?? ''}"` });
    } else {
      rows.push({ flag: 'REF_NOT_IN_TEXT', slug: t.slug ?? t._id, detail: `ref=[${refNames.join(', ')}] — "${t.title ?? ''}"` });
    }
  }

  const order = { MISMATCH: 0, NO_CITY: 1, REF_NOT_IN_TEXT: 2 } as Record<string, number>;
  rows.sort((a, b) => order[a.flag] - order[b.flag]);
  console.log(`Audited ${tours.length} published tours; ${cities.length} cities.\n`);
  for (const f of ['MISMATCH', 'NO_CITY', 'REF_NOT_IN_TEXT']) {
    const sub = rows.filter((r) => r.flag === f);
    console.log(`=== ${f} (${sub.length}) ===`);
    for (const r of sub) console.log(`  ${r.slug}\n      ${r.detail}`);
    console.log();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
