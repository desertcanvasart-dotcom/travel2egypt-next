import { createClient } from '@sanity/client';
import { readFileSync, writeFileSync } from 'node:fs';

const env: Record<string, string> = {};
for (const line of readFileSync('/Users/islamhussein/t2e/.env', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ufallvd2',
  dataset: env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-12-01',
  token: env.SANITY_PRODUCTION_API_WRITE_TOKEN || env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});
const APPLY = process.argv.includes('--apply');

// Per distinct image: EN/ES/JA descriptions (image-first, <=125 chars, British spelling).
const ALT: Record<string, { en: string; es: string; ja: string }> = {
  cairoSunset: {
    en: "Cairo's skyline silhouetted at sunset, the Cairo Tower and a traffic-filled bridge crossing the Nile",
    es: 'El perfil de El Cairo recortado al atardecer, con la Torre de El Cairo y un puente lleno de tráfico sobre el Nilo',
    ja: '夕暮れにシルエットとなるカイロの街並み。カイロタワーと、車で混み合うナイル川の橋。',
  },
  gizaCamels: {
    en: 'Three camels with riders crossing the desert before the pyramids at Giza under a cloudy sky',
    es: 'Tres camellos con jinetes cruzan el desierto ante las pirámides de Guiza bajo un cielo nublado',
    ja: '曇り空の下、ギザのピラミッドの前を騎手を乗せた三頭のラクダが砂漠を横切る。',
  },
  saltedFish: {
    en: 'Salted fish and skewered meat rolls on wooden boards with herbs, chillies, limes and salt',
    es: 'Pescado salado y rollitos de carne en brochetas sobre tablas de madera con hierbas, chiles, limas y sal',
    ja: '木の板に並ぶ塩漬けの魚と串刺しの肉ロール。ハーブ、唐辛子、ライム、塩を添えて。',
  },
  sharmBeach: {
    en: 'Sandy Red Sea beach with thatched umbrellas, turquoise water, moored boats and swimmers at Sharm El Sheikh',
    es: 'Playa de arena del mar Rojo con sombrillas de paja, aguas turquesas, barcos y bañistas en Sharm el-Sheij',
    ja: '紅海の砂浜。茅葺きのパラソル、ターコイズブルーの海、停泊する船、泳ぐ人々（シャルム・エル・シェイク）。',
  },
  felucca: {
    en: 'A felucca sailing boat with passengers on the Nile at sunset, the sun glowing behind its tall sail',
    es: 'Una faluca con pasajeros navega por el Nilo al atardecer, con el sol brillando tras su alta vela',
    ja: '夕暮れのナイル川を行く、乗客を乗せたフェルッカ帆船。高い帆の向こうに太陽が輝く。',
  },
  mummy: {
    en: 'An ancient Egyptian mummy in aged linen wrappings displayed in a glass museum case',
    es: 'Una momia egipcia antigua con vendajes de lino envejecido, expuesta en una vitrina de museo',
    ja: 'ガラスの展示ケースに納められた、古びた亜麻布に包まれた古代エジプトのミイラ。',
  },
  siwaLodge: {
    en: 'View from a mud-brick lodge terrace over a desert oasis village with palm saplings and a rocky outcrop',
    es: 'Vista desde la terraza de un albergue de adobe sobre un pueblo de oasis en el desierto',
    ja: '日干しレンガの宿のテラスから望む砂漠のオアシス集落。',
  },
};

// Per document: language + [blockKey, imageKey] pairs.
const DOCS: { id: string; lang: 'en' | 'es' | 'ja'; blocks: [string, keyof typeof ALT][] }[] = [
  { id: 'wp-post-144441-es', lang: 'es', blocks: [['000000000023','cairoSunset'],['000000000065','gizaCamels'],['0000000000c0','saltedFish'],['000000000168','sharmBeach'],['00000000018d','felucca']] },
  { id: 'wp-post-257609-en', lang: 'en', blocks: [['000000000026','cairoSunset'],['00000000006e','gizaCamels'],['0000000000c9','saltedFish'],['000000000179','sharmBeach'],['00000000019e','felucca']] },
  { id: 'wp-post-257611-ja', lang: 'ja', blocks: [['000000000023','cairoSunset'],['000000000065','gizaCamels'],['0000000000c0','saltedFish'],['000000000168','sharmBeach'],['00000000018d','felucca']] },
  { id: 'wp-post-144544-es', lang: 'es', blocks: [['0000000000ab','mummy']] },
  { id: 'wp-post-172608-ja', lang: 'ja', blocks: [['0000000000df','mummy']] },
  { id: 'wp-post-87870-en',  lang: 'en', blocks: [['0000000000b3','mummy']] },
  { id: 'wp-post-236678-en', lang: 'en', blocks: [['53dda9272c04','siwaLodge']] },
];

async function main() {
  // rollback snapshot of current alts
  const snap: any[] = await client.fetch(
    `*[_id in $ids]{_id, "imgs": body[_type=="image"]{ "key": _key, "oldAlt": alt }}`,
    { ids: DOCS.map((d) => d.id) }
  );
  writeFileSync('/Users/islamhussein/t2e/backups/inline-alt-rollback.json', JSON.stringify(snap, null, 2));
  console.log(`rollback snapshot written for ${snap.length} docs.`);

  let sets = 0;
  for (const d of DOCS) for (const [, ] of d.blocks) sets++;
  console.log(`planned alt sets: ${sets} across ${DOCS.length} docs.`);
  if (!APPLY) {
    for (const d of DOCS) for (const [bk, ak] of d.blocks) console.log(`  ${d.id} [${bk}] <- (${d.lang}) ${ALT[ak][d.lang]}`);
    console.log('DRY RUN — pass --apply to write.');
    return;
  }

  let ok = 0, err = 0; const errors: string[] = [];
  for (const d of DOCS) {
    const patch = client.patch(d.id);
    for (const [bk, ak] of d.blocks) patch.set({ [`body[_key=="${bk}"].alt`]: ALT[ak][d.lang] });
    try { await patch.commit(); ok += d.blocks.length; }
    catch (e: any) { err += d.blocks.length; errors.push(`${d.id}: ${e.message}`); }
  }
  console.log(`APPLIED. alt sets ok: ${ok}, errored: ${err}`);
  for (const e of errors) console.log('  ERR', e);
}
main();
