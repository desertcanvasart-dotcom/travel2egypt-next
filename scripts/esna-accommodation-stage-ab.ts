/**
 * Esna accommodation (wp-page-59607) — Stage A+B combined reframe.
 * Owner-approved locked copy (standfirst / frames / meta) implemented verbatim.
 *
 * Per locale: reorder to Esna-first, drop Eyaru (mis-located — Luxor-area
 * hotel), retitle the two sections + add frame lines, set new standfirst
 * (summary) + meta (seo.metaDescription) + title, strip decorative
 * travel2egypt.org links (keeping hotel official-site + Wikipedia links),
 * delete dead tail / nav crumbs / pending image / EN promo footer. ES gets
 * the Esna's-Own-Stays section authored for the first time.
 *
 * The 5 Luxor hotel entries keep their PROSE byte-for-byte; the only change
 * to them is decorative-link delinking (flagged in output).
 *
 * STAGING ONLY — writes drafts.wp-page-59607, never published.
 * Run (dry):   npx tsx scripts/esna-accommodation-stage-ab.ts
 * Run (stage): APPLY=1 npx tsx scripts/esna-accommodation-stage-ab.ts
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

const ID = 'wp-page-59607';
const bt = (b: any) => (b._type === 'block' ? (b.children ?? []).map((c: any) => c.text ?? '').join('') : `[${b._type}]`);

// ---- locked copy ----
const STANDFIRST = {
  en: "Esna itself keeps only a few places to sleep — a family-run guesthouse, a boat-suite moored at the town, nothing more. For most travellers that's not a problem: Esna is a stop, not a base, and Luxor is forty-five minutes north with every kind of hotel this guide covers. The third answer, and often the best one, is the river itself — the Nile cruises and dahabiyas that lock through Esna most days already come with a bed attached.",
  es: "Esna en sí conserva solo unos pocos lugares donde dormir —una pensión familiar, una suite flotante amarrada en el pueblo, poco más—. Para la mayoría de los viajeros no es un problema: Esna es una parada, no una base, y Luxor está a cuarenta y cinco minutos al norte con todo tipo de hotel que cubre esta guía. La tercera respuesta, y a menudo la mejor, es el propio río: los cruceros y dahabiyas que cruzan la esclusa de Esna casi a diario ya vienen con cama incluida.",
  ja: "エスナ自体には、泊まれる場所がわずかしかありません——家族経営の宿がひとつ、町に係留された船上スイートがひとつ、それだけです。ほとんどの旅行者にとって、これは問題になりません。エスナは拠点ではなく、通過点だからです。ルクソールなら北へ45分、このガイドが扱うあらゆるタイプのホテルが揃っています。そして三つ目の答え——しばしば最良の答え——は川そのもの。ほぼ毎日エスナの水門を通るナイル川クルーズやダハビーヤには、もとから寝床がついています。",
};
const META_TITLE = { en: 'Where to Stay in Esna', es: 'Dónde Alojarse en Esna', ja: 'エスナの宿泊先ガイド' };
const META_DESC = {
  en: "Esna keeps a handful of its own guesthouses; for everything beyond that, Luxor is forty-five minutes north — and the Nile cruises that lock through Esna daily are their own answer entirely.",
  es: "Esna tiene un puñado de alojamientos propios; para todo lo demás, Luxor está a cuarenta y cinco minutos al norte — y los cruceros que cruzan la esclusa de Esna a diario son, en sí mismos, otra respuesta.",
  ja: "エスナには、独自の宿がわずかながらあります。それ以外を求めるなら、ルクソールが北へ45分。そして毎日エスナの水門を通るナイル川クルーズも、それ自体がひとつの答えです。",
};
const OWN_STAYS_HEADING = { en: "Esna's Own Stays", es: 'Alojamientos propios de Esna', ja: 'エスナ自体の宿' };
const OWN_STAYS_FRAME = { en: 'Two real options in Esna itself:', es: 'Dos opciones reales en la propia Esna:', ja: 'エスナに実在する宿はふたつ:' };
const LUXOR_HEADING = { en: 'For Everything Else, Luxor', es: 'Para todo lo demás, Luxor', ja: 'それ以外なら、ルクソールへ' }; // ⚠ JA authored (copy didn't specify) — FLAG
const LUXOR_FRAME = {
  en: 'Five hotels worth the drive, from colonial-era grand to boutique quiet.',
  es: 'Cinco hoteles que valen el trayecto, desde el lujo colonial hasta la calma boutique.',
  ja: '車を走らせる価値のある五軒。植民地時代の風格あるホテルから、静かなブティックホテルまで。',
};

const span = (key: string, text: string) => ({ _type: 'span', _key: key, text, marks: [] });
const mkBlock = (key: string, style: string, text: string) => ({ _type: 'block', _key: key, style, markDefs: [], children: [span(key + 's', text)] });

// delink: remove given markDef keys from a block (keep text + other marks/official links)
function delink(block: any, removeKeys: string[]) {
  const clone = JSON.parse(JSON.stringify(block));
  clone.markDefs = (clone.markDefs ?? []).filter((m: any) => !removeKeys.includes(m._key));
  for (const c of clone.children ?? []) c.marks = (c.marks ?? []).filter((m: string) => !removeKeys.includes(m));
  return clone;
}

// ES re-authored descriptions (owner-approved go-ahead; established re-authoring register)
const ES_LITTLE_PHARAOH = {
  heading: 'Little Pharaoh Guesthouse',
  desc: 'Cerca del Templo de Khnum, esta pensión sencilla y acogedora refleja el ritmo pausado de Esna y la calidez de su gente. Ofrece habitaciones limpias, una azotea compartida con vistas al templo y buena comida casera local.',
  bullets: ['Desayuno egipcio tradicional incluido', 'A pocos pasos del templo y del mercado antiguo', 'Wi-Fi gratis, bicicletas y habitaciones de estilo local'],
};
const ES_AZHAR = {
  heading: 'Azhar Dahabiya Luxury Suites (amarrada en Esna)',
  desc: 'El encanto de una dahabiya privada sin necesidad de zarpar. Estas suites amarradas ofrecen una decoración elegante, vistas serenas al Nilo y un servicio personalizado en un entorno boutique.',
  bullets: ['Tratamientos de spa y salón en la azotea', 'Ideal para escapadas románticas o viajes en familia', 'Desayuno y cena a bordo incluidos'],
};

const byKey = (arr: any[], k: string) => { const b = arr.find((x) => x._key === k); if (!b) throw new Error(`block ${k} not found`); return JSON.parse(JSON.stringify(b)); };
const retitle = (block: any, text: string) => { const c = JSON.parse(JSON.stringify(block)); c.children = [span(c._key + 'rt', text)]; c.markDefs = []; return c; };

async function main() {
  console.log(`=== ${APPLY ? 'APPLY (stage draft)' : 'DRY RUN'}: ${ID} Stage A+B reframe ===\n`);
  const pub: any = await client.getDocument(ID);
  if (await client.getDocument(`drafts.${ID}`)) throw new Error('draft already exists — resolve first');
  const doc = JSON.parse(JSON.stringify(pub));
  const bodyOf = (loc: string) => doc.body.find((b: any) => b._key === loc);
  const origOf = (loc: string) => pub.body.find((b: any) => b._key === loc).value;

  // ---------- EN ----------
  {
    const o = origOf('en');
    const B = (k: string) => byKey(o, k);
    const luxorEntries = [ // 5 entries, prose must stay identical; some delinked
      B('000000000011'), B('000000000013'), B('000000000015'), B('000000000017'), B('000000000019'), B('00000000001e'), // Sofitel
      B('000000000020'), B('000000000022'), B('000000000024'), B('000000000026'), B('000000000028'), B('00000000002d'), // Hilton
      B('00000000002f'), B('000000000031'), B('000000000033'), B('000000000035'), B('000000000037'), B('00000000003c'), // Pavillon
      B('00000000003e'), delink(B('000000000043'), ['000000000040']), B('000000000045'), B('000000000047'), B('000000000049'), B('00000000004e'), // Steigenberger (delink Esna→day-tour)
      B('000000000050'), delink(B('000000000055'), ['000000000052']), B('000000000057'), B('000000000059'), delink(B('00000000005d'), ['00000000005b']), B('000000000062'), // Al Moudira (delink 2)
    ];
    const esnaStays = [
      B('000000000066'), B('00000000006b'), B('00000000006d'), B('00000000006f'), B('000000000071'), // Little Pharaoh (keep Khnum wiki link)
      B('000000000073'), B('000000000075'), B('000000000077'), B('000000000079'), B('00000000007b'), // Azhar Dahabiya
    ];
    bodyOf('en').value = [
      retitle(B('000000000064'), OWN_STAYS_HEADING.en),       // "Esna's Own Stays" (h3)
      mkBlock('enOwnFrame', 'normal', OWN_STAYS_FRAME.en),
      ...esnaStays,
      retitle(B('00000000000b'), LUXOR_HEADING.en),           // "For Everything Else, Luxor" (h3)
      mkBlock('enLuxFrame', 'normal', LUXOR_FRAME.en),
      ...luxorEntries,
    ];
  }

  // ---------- ES (rebuild; add Esna stays authored) ----------
  {
    const o = origOf('es');
    const B = (k: string) => byKey(o, k);
    const luxorEntries = [
      B('000000000005'), delink(B('00000000000a'), ['000000000007']), B('00000000000c'), delink(B('000000000011'), ['00000000000e']), B('000000000013'), B('000000000018'), // Sofitel
      B('00000000001a'), delink(B('000000000022'), ['00000000001c', '00000000001f']), B('000000000024'), B('000000000026'), B('000000000028'), B('00000000002d'), // Hilton
      B('00000000002f'), delink(B('000000000037'), ['000000000031', '000000000034']), B('000000000039'), delink(B('00000000003e'), ['00000000003b']), B('000000000040'), B('000000000045'), // Pavillon
      B('000000000047'), delink(B('00000000004f'), ['000000000049', '00000000004c']), B('000000000051'), delink(B('000000000056'), ['000000000053']), delink(B('00000000005b'), ['000000000058']), B('000000000060'), // Steigenberger
      B('000000000062'), delink(B('000000000067'), ['000000000064']), B('000000000069'), B('00000000006b'), B('00000000006d'), B('000000000072'), // Al Moudira
    ];
    // ES "Resumen" closing block ([32-33]) DELETED per owner — its "Luxor is the
    // perfect base to explore Esna" framing is the exact inverted logic this
    // reframe fixes; EN/JA have no equivalent (parity).
    const esEsnaStays = [
      mkBlock('esLP_h', 'h2', ES_LITTLE_PHARAOH.heading),
      mkBlock('esLP_d', 'normal', ES_LITTLE_PHARAOH.desc),
      ...ES_LITTLE_PHARAOH.bullets.map((t, i) => ({ ...mkBlock(`esLP_b${i}`, 'normal', t), listItem: 'bullet', level: 1 })),
      mkBlock('esAZ_h', 'h2', ES_AZHAR.heading),
      mkBlock('esAZ_d', 'normal', ES_AZHAR.desc),
      ...ES_AZHAR.bullets.map((t, i) => ({ ...mkBlock(`esAZ_b${i}`, 'normal', t), listItem: 'bullet', level: 1 })),
    ];
    bodyOf('es').value = [
      mkBlock('esOwnH', 'h2', OWN_STAYS_HEADING.es),
      mkBlock('esOwnFrame', 'normal', OWN_STAYS_FRAME.es),
      ...esEsnaStays,
      mkBlock('esLuxH', 'h2', LUXOR_HEADING.es),
      mkBlock('esLuxFrame', 'normal', LUXOR_FRAME.es),
      ...luxorEntries,
    ];
  }

  // ---------- JA (no decorative links to strip) ----------
  {
    const o = origOf('ja');
    const B = (k: string) => byKey(o, k);
    const esnaStays = [
      B('000000000049'), B('00000000004b'), B('00000000004d'), B('00000000004f'), B('000000000051'), // Little Pharaoh
      B('000000000053'), B('000000000055'), B('000000000057'), B('000000000059'), B('00000000005b'), // Azhar
    ];
    const luxorEntries = [
      B('00000000000b'), B('00000000000d'), B('00000000000f'), B('000000000011'), B('000000000013'), B('000000000015'), // Sofitel
      B('000000000017'), B('000000000019'), B('00000000001b'), B('00000000001d'), B('00000000001f'), B('000000000021'), // Hilton
      B('000000000023'), B('000000000025'), B('000000000027'), B('000000000029'), B('00000000002b'), B('00000000002d'), // Pavillon
      B('00000000002f'), B('000000000031'), B('000000000033'), B('000000000035'), B('000000000037'), B('000000000039'), // Steigenberger
      B('00000000003b'), B('00000000003d'), B('00000000003f'), B('000000000041'), B('000000000043'), B('000000000045'), // Al Moudira
    ];
    bodyOf('ja').value = [
      retitle(B('000000000047'), OWN_STAYS_HEADING.ja),   // エスナ自体の宿 (h2)
      mkBlock('jaOwnFrame', 'normal', OWN_STAYS_FRAME.ja),
      ...esnaStays,
      retitle(B('000000000007'), LUXOR_HEADING.ja),       // それ以外なら、ルクソールへ (h2, AUTHORED)
      mkBlock('jaLuxFrame', 'normal', LUXOR_FRAME.ja),
      ...luxorEntries,
    ];
  }

  // ---------- fields ----------
  const iv = (m: Record<string, string>) => (['en', 'es', 'ja'] as const).map((l) => ({ _key: l, _type: 'internationalizedArrayTextValue', value: m[l] }));
  doc.title = (['en', 'es', 'ja'] as const).map((l) => ({ _key: l, _type: 'internationalizedArrayStringValue', value: META_TITLE[l] }));
  doc.summary = iv(STANDFIRST);
  doc.seo = { ...(doc.seo ?? {}), metaDescription: iv(META_DESC) };

  // ---------- report + guards ----------
  console.log('block counts (orig -> new):');
  for (const l of ['en', 'es', 'ja']) console.log(`  ${l}: ${origOf(l).length} -> ${bodyOf(l).value.length}`);

  // byte-identical PROSE guard on the 5 Luxor entries (per locale)
  const proseOf = (blocks: any[], startText: string, count: number) => {
    const i = blocks.findIndex((b: any) => bt(b) === startText);
    return blocks.slice(i, i + count).map(bt).join('');
  };
  const checks: Array<[string, string, number]> = [
    ['en', 'Sofitel Winter Palace Luxor', 30], ['es', 'Sofitel Winter Palace Luxor', 30], ['ja', 'Sofitel Winter Palace Luxor', 30],
  ];
  console.log('\nLuxor-entries PROSE identical check (Sofitel→AlMoudira run):');
  for (const [loc] of checks) {
    const origBlocks = origOf(loc);
    const newBlocks = bodyOf(loc).value;
    const oi = origBlocks.findIndex((b: any) => bt(b) === 'Sofitel Winter Palace Luxor');
    const ni = newBlocks.findIndex((b: any) => bt(b) === 'Sofitel Winter Palace Luxor');
    const oRun = origBlocks.slice(oi, oi + 30).map(bt).join('');
    const nRun = newBlocks.slice(ni, ni + 30).map(bt).join('');
    console.log(`  ${loc}: ${oRun === nRun ? '✓ prose identical' : '✗ PROSE DIFFERS'}`);
  }

  // "three / 三" survivor check
  console.log('\n"three/tres/三"(property-count) survivor scan:');
  for (const l of ['en', 'es', 'ja']) {
    const txt = bodyOf(l).value.map(bt).join(' ') + ' ' + (doc.summary.find((s: any) => s._key === l)?.value ?? '');
    const hits = txt.match(/\bthree\b|\btres\b|三[つ軒]/gi) ?? [];
    console.log(`  ${l}: ${hits.length ? hits.join(', ') + '  (note: 三つ目/third = the THIRD OPTION=cruises, intended)' : 'none'}`);
  }

  if (!APPLY) { console.log('\nDRY RUN — re-run with APPLY=1 to stage.'); return; }
  mkdirSync('backups', { recursive: true });
  writeFileSync('backups/esna-accommodation-stage-ab-rollback-2026-07-10.json', JSON.stringify(pub, null, 2));
  doc._id = `drafts.${ID}`;
  await client.createOrReplace(doc);
  console.log(`\n✓ staged drafts.${ID} — NOT published.`);
}
main().catch((e) => { console.error(e); process.exit(1); });
