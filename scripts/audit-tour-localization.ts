/**
 * Read-only audit: find tours where a field has EN content but is missing the
 * ES and/or JA translation (so the localized page falls back to English).
 * Focus on the structured "rail" fields most likely authored EN-only.
 *
 *   tsx scripts/audit-tour-localization.ts
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

// Each field: en/es/ja presence booleans.
const f = (path: string) =>
  `{"en": defined(${path}[_key=="en"][0].value), "es": defined(${path}[_key=="es"][0].value), "ja": defined(${path}[_key=="ja"][0].value)}`;
// priceTiers: a locale is "present" only if every tier has a name in that locale.
const tier = `{
  "has": count(priceTiers) > 0,
  "en": count(priceTiers) > 0 && count(priceTiers[!defined(name[_key=="en"][0].value)]) == 0,
  "es": count(priceTiers) > 0 && count(priceTiers[!defined(name[_key=="es"][0].value)]) == 0,
  "ja": count(priceTiers) > 0 && count(priceTiers[!defined(name[_key=="ja"][0].value)]) == 0
}`;

const FIELDS = ['title', 'summary', 'body', 'shapeWhere', 'shapeDuration', 'shapeCharacter', 'priceTiers', 'priceNote', 'includedItems', 'notIncludedItems', 'conciergeNote', 'accessNote', 'audienceNote', 'timelineDesc', 'groupSize', 'effortLevel', 'departsFrom', 'durationLabel'];

async function main() {
  const tours = await client.fetch<any[]>(`*[_type=="tour" && !(_id in path("drafts.**"))]{
    "slug": slug[_key=="en"][0].value.current, type,
    "title": ${f('title')}, "summary": ${f('summary')}, "body": ${f('body')},
    "shapeWhere": ${f('shapeOfDay.where')}, "shapeDuration": ${f('shapeOfDay.duration')}, "shapeCharacter": ${f('shapeOfDay.character')},
    "priceTiers": ${tier}, "priceNote": ${f('priceNote')},
    "includedItems": ${f('includedItems')}, "notIncludedItems": ${f('notIncludedItems')},
    "conciergeNote": ${f('conciergeNote')}, "accessNote": ${f('accessNote')}, "audienceNote": ${f('audienceNote')},
    "timelineDesc": ${f('timeline[0].description')},
    "groupSize": ${f('groupSize')}, "effortLevel": ${f('effortLevel')}, "departsFrom": ${f('departsFrom')}, "durationLabel": ${f('durationLabel')}
  }`);

  console.log(`Audited ${tours.length} published tours (${tours.filter(t=>t.type==='dayTour').length} day tours, ${tours.filter(t=>t.type==='package').length} packages).\n`);
  console.log('Field               | EN | EN&noES | EN&noJA');
  console.log('--------------------|----|---------|--------');
  const gapTours = new Set<string>();
  for (const field of FIELDS) {
    let en = 0, noEs = 0, noJa = 0;
    for (const t of tours) {
      const v = t[field]; if (!v) continue;
      const hasEn = field === 'priceTiers' ? v.en : v.en;
      if (!hasEn) continue;
      en++;
      if (!v.es) { noEs++; }
      if (!v.ja) { noJa++; if (field !== 'title' && field !== 'summary' && field !== 'body') gapTours.add(t.slug); }
    }
    console.log(`${field.padEnd(19)} | ${String(en).padStart(2)} | ${String(noEs).padStart(7)} | ${String(noJa).padStart(7)}`);
  }
  console.log(`\nDay/package tours with >=1 structured-field JA gap: ${gapTours.size}`);
  // Sample the worst-affected (most gaps) for illustration
  const ranked = tours.map(t => {
    const gaps = FIELDS.filter(field => { const v=t[field]; return v && v.en && !v.ja && !['title','summary','body'].includes(field); });
    return { slug: t.slug, type: t.type, gaps };
  }).filter(r => r.gaps.length>0).sort((a,b)=>b.gaps.length-a.gaps.length);
  console.log('\nTop 15 by gap count:');
  for (const r of ranked.slice(0,15)) console.log(`  [${r.gaps.length}] ${r.slug} (${r.type}) — ${r.gaps.join(', ')}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
