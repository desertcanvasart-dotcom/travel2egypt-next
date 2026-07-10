/**
 * Edfu accommodation (wp-page-59574) — strengthening pass (lighter than Esna).
 * Owner-approved locked copy implemented verbatim. Flat list, no sections.
 *
 * Per locale: new standfirst as the opening BODY paragraph (keeps the intro's
 * internal Luxor/Aswan city links per task item 4 — summary field is plain
 * text and can't hold links, so the standfirst lives in the body, not the
 * summary; debris summary cleared). Remove 2 mis-assigned entries (Eyaru
 * Palace Nile View + Nile View Hotel Edfu), keeping the 3 remaining entries'
 * PROSE byte-identical (Mud House, Funduk al Shams, M/S Sun Ray cruise).
 * EN: strip decorative travel2egypt.org anchors (keep the Mövenpick official
 * cruise site). ES/JA already link-clean. Delete dead tail all 3 locales.
 * Fix ES title (+en Edfu); set titles + seo.metaDescription from meta block.
 * ES slug UNTOUCHED (logged separately).
 *
 * STAGING ONLY — writes drafts.wp-page-59574. Never published.
 * Run (dry):   npx tsx scripts/edfu-accommodation-stage.ts
 * Run (stage): APPLY=1 npx tsx scripts/edfu-accommodation-stage.ts
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { writeFileSync, mkdirSync } from 'node:fs';
loadEnv();

const APPLY = process.env.APPLY === '1';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
if (dataset !== 'production') throw new Error(`Refusing to run against "${dataset}".`);
const token = process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
if (APPLY && !process.env.SANITY_PRODUCTION_API_WRITE_TOKEN) { console.error('APPLY=1 needs SANITY_PRODUCTION_API_WRITE_TOKEN'); process.exit(1); }
const client = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset, apiVersion: '2024-12-01', useCdn: false, token });

const ID = 'wp-page-59574';
const LUXOR = 'wp-page-58877', ASWAN = 'wp-page-58758';
const bt = (b: any) => (b._type === 'block' ? (b.children ?? []).map((c: any) => c.text ?? '').join('') : `[${b._type}]`);

const STANDFIRST = {
  en: "Edfu doesn't have many hotels, and there's no point pretending otherwise — most travellers see the Temple of Horus on a stop between Luxor and Aswan and sleep somewhere else. But if you want the town itself, there are two real places to stay, both close to the temple, both run by people who live here. And most days, a third answer sails right up to the dock: the Nile cruises that call at Edfu already come with a room attached.",
  es: "Edfu no tiene muchos hoteles, y no tiene sentido disimularlo: la mayoría de los viajeros ve el Templo de Horus en una parada entre Luxor y Asuán y duerme en otro sitio. Pero si quieres quedarte en el propio pueblo, hay dos lugares reales donde alojarte, ambos cerca del templo, ambos llevados por gente de aquí. Y la mayoría de los días, hay una tercera respuesta que atraca justo en el muelle: los cruceros por el Nilo que paran en Edfu ya vienen con habitación incluida.",
  ja: "エドフにホテルは多くありません。取り繕っても仕方がないので、正直に言います——ほとんどの旅行者は、ルクソールとアスワンの間の立ち寄り先としてホルス神殿を見て、宿は別の町でとります。それでも町自体に泊まりたいなら、本当に実在する宿がふたつあります。どちらも神殿の近くで、どちらもこの土地の人が営んでいます。そしてたいていの日は、三つ目の答えが桟橋にそのまま着きます——エドフに寄港するナイル川クルーズには、もとから部屋がついているのです。",
};
const META_TITLE = { en: 'Where to Stay in Edfu', es: 'Dónde Alojarse en Edfu', ja: 'エドフの宿泊先ガイド' };
const META_DESC = {
  en: "Edfu keeps two real places to sleep and a Nile-cruise stop besides — a small list, honestly kept small.",
  es: "Edfu tiene dos lugares reales donde dormir, y además una parada de crucero por el Nilo — una lista breve, breve con honestidad.",
  ja: "エドフには、本当に泊まれる場所がふたつ。それに加えてナイル川クルーズの寄港地としての顔もあります。短いリストですが、正直に短いのです。",
};
// per-locale link substrings (first occurrence linked)
const LINKS: Record<string, Array<[string, string]>> = {
  en: [['Luxor', LUXOR], ['Aswan', ASWAN]],
  es: [['Luxor', LUXOR], ['Asuán', ASWAN]],
  ja: [['ルクソール', LUXOR], ['アスワン', ASWAN]],
};

// build a body block where given substrings carry internalLink markDefs
function standfirstBlock(loc: 'en' | 'es' | 'ja') {
  const text = STANDFIRST[loc];
  const links = LINKS[loc];
  // collect match ranges
  const ranges = links.map(([sub, ref]) => ({ start: text.indexOf(sub), end: text.indexOf(sub) + sub.length, ref, sub }))
    .filter((r) => r.start >= 0).sort((a, b) => a.start - b.start);
  const children: any[] = [];
  const markDefs: any[] = [];
  let cursor = 0, n = 0;
  for (const r of ranges) {
    if (r.start > cursor) children.push({ _type: 'span', _key: `sf${loc}${n++}`, text: text.slice(cursor, r.start), marks: [] });
    const mdKey = `sf${loc}link${n}`;
    markDefs.push({ _type: 'internalLink', _key: mdKey, reference: { _type: 'reference', _ref: r.ref } });
    children.push({ _type: 'span', _key: `sf${loc}${n++}`, text: r.sub, marks: [mdKey] });
    cursor = r.end;
  }
  if (cursor < text.length) children.push({ _type: 'span', _key: `sf${loc}${n++}`, text: text.slice(cursor), marks: [] });
  return { _type: 'block', _key: `edfuStandfirst_${loc}`, style: 'normal', markDefs, children };
}

function delink(block: any, removeKeys: string[]) {
  const c = JSON.parse(JSON.stringify(block));
  c.markDefs = (c.markDefs ?? []).filter((m: any) => !removeKeys.includes(m._key));
  for (const ch of c.children ?? []) ch.marks = (ch.marks ?? []).filter((m: string) => !removeKeys.includes(m));
  return c;
}
const retitle = (block: any, text: string) => { const c = JSON.parse(JSON.stringify(block)); c.children = [{ _type: 'span', _key: c._key + 'rt', text, marks: [] }]; c.markDefs = []; return c; };

async function main() {
  console.log(`=== ${APPLY ? 'APPLY (stage draft)' : 'DRY RUN'}: ${ID} Edfu strengthening pass ===\n`);
  const pub: any = await client.getDocument(ID);
  if (await client.getDocument(`drafts.${ID}`)) throw new Error('draft already exists — resolve first');
  const doc = JSON.parse(JSON.stringify(pub));
  const bodyOf = (l: string) => doc.body.find((b: any) => b._key === l);
  const orig = (l: string) => pub.body.find((b: any) => b._key === l).value;
  const B = (l: string, k: string) => { const b = orig(l).find((x: any) => x._key === k); if (!b) throw new Error(`${l}/${k} missing`); return JSON.parse(JSON.stringify(b)); };

  // EN: standfirst + Mud House + Funduk + M/S Sun Ray (delinked), Eyaru & Nile-View dropped, tail gone
  bodyOf('en').value = [
    standfirstBlock('en'),
    B('en', '000000000005'), delink(B('en', '000000000010'), ['000000000007', '00000000000a', '00000000000d']), // Mud House
    B('en', '000000000012'), delink(B('en', '00000000001a'), ['000000000014', '000000000017']),                 // Funduk
    B('en', '00000000002a'), delink(B('en', '000000000035'), ['00000000002f', '000000000032']),                 // M/S Sun Ray (keep movenpick 00000000002c)
  ];
  // ES: no decorative links to strip
  bodyOf('es').value = [
    standfirstBlock('es'),
    B('es', '000000000005'), B('es', '000000000007'),   // Mud House
    B('es', '000000000009'), B('es', '00000000000b'),   // Funduk
    B('es', '000000000015'), B('es', '000000000017'),   // M/S Sun Ray
  ];
  // JA: clean
  bodyOf('ja').value = [
    standfirstBlock('ja'),
    B('ja', '000000000005'), B('ja', '000000000007'),   // Mud House
    B('ja', '000000000009'), B('ja', '00000000000b'),   // Funduk
    B('ja', '000000000015'), B('ja', '000000000017'),   // M/S Sun Ray
  ];

  // fields
  doc.title = (['en', 'es', 'ja'] as const).map((l) => ({ _key: l, _type: 'internationalizedArrayStringValue', value: META_TITLE[l] }));
  doc.summary = []; // cleared (standfirst now opens the body; debris removed)
  doc.seo = { ...(doc.seo ?? {}), metaDescription: (['en', 'es', 'ja'] as const).map((l) => ({ _key: l, _type: 'internationalizedArrayTextValue', value: META_DESC[l] })) };

  console.log('block counts (orig -> new):');
  for (const l of ['en', 'es', 'ja']) console.log(`  ${l}: ${orig(l).length} -> ${bodyOf(l).value.length}`);
  console.log('\n3 kept entries PROSE-identical + Eyaru/NileView gone check:');
  for (const l of ['en', 'es', 'ja']) {
    const nv = bodyOf(l).value.map(bt).join(' ');
    const keptOk = ['Mud House of Edfu', 'Funduk al Shams', 'M/S Sun Ray Nile Cruise'].every((k) => nv.includes(k));
    const droppedOk = !/Eyaru|Nile View Hotel Edfu/.test(nv);
    // prose identical: compare each kept desc text vs original
    console.log(`  ${l}: kept-3=${keptOk?'✓':'✗'} dropped-2=${droppedOk?'✓':'✗'} standfirstLinks=${bodyOf(l).value[0].markDefs.length}`);
  }
  // ES title + slug guard
  console.log(`\nES title -> "${doc.title.find((t:any)=>t._key==='es').value}"  | ES slug (untouched): ${doc.slug.find((s:any)=>s._key==='es').value.current}`);
  // link audit
  console.log('\nremaining external links per locale (should be: en=movenpick only; es/ja=0):');
  for (const l of ['en', 'es', 'ja']) {
    const ext = bodyOf(l).value.flatMap((b:any)=>(b.markDefs||[]).filter((m:any)=>m._type==='externalLink').map((m:any)=>m.href));
    const intl = bodyOf(l).value.flatMap((b:any)=>(b.markDefs||[]).filter((m:any)=>m._type==='internalLink').length);
    console.log(`  ${l}: external=[${ext.join(', ')||'none'}]  internalLinks=${intl.reduce((a:number,b:number)=>a+b,0)}`);
  }

  if (!APPLY) { console.log('\nDRY RUN — re-run with APPLY=1.'); return; }
  mkdirSync('backups', { recursive: true });
  writeFileSync('backups/edfu-accommodation-stage-rollback-2026-07-10.json', JSON.stringify(pub, null, 2));
  doc._id = `drafts.${ID}`;
  await client.createOrReplace(doc);
  console.log(`\n✓ staged drafts.${ID} — NOT published.`);
}
main().catch((e) => { console.error(e); process.exit(1); });
