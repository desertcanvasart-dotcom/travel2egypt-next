/**
 * Localize the day-tour landing (subcategory) editor bylines to es + ja.
 * These are Sanity-only editorial fields (no i18n fallback), so they coalesced
 * to English on /es and /ja. EN preserved verbatim; es/ja are AI drafts for
 * team review. Patches editorByline.heading + editorByline.intro on the 15
 * region-less landings (and their drafts where present).
 *
 * migration-staging only. Backup exists. Dry-run by default; --commit to write.
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();
const COMMIT = process.argv.includes('--commit');
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  token: process.env.SANITY_STAGING_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  perspective: 'published',
  useCdn: false,
});

type Tri = [string, string, string]; // en, es, ja
const arr = (v: Tri) => [
  { _key: 'en', _type: 'object', value: v[0] },
  { _key: 'es', _type: 'object', value: v[1] },
  { _key: 'ja', _type: 'object', value: v[2] },
];

// Per-city heading (shared by private + small-group of the same city).
const HEAD: Record<string, Tri> = {
  'al-gouna': ['El Gouna is a town built on lagoons — calm water by day, the desert just behind it.',
    'El Gouna es una ciudad construida sobre lagunas: aguas tranquilas de día, y el desierto justo detrás.',
    'エル・グーナはラグーンの上に築かれた町。昼は穏やかな水面、すぐ背後には砂漠が広がります。'],
  'alexandria': ['Alexandria faces the sea, and remembers a different Egypt.',
    'Alejandría mira al mar y recuerda otro Egipto.',
    'アレクサンドリアは海に面し、もう一つのエジプトを記憶しています。'],
  'aswan': ['Aswan is where Egypt slows down and turns Nubian.',
    'Asuán es donde Egipto baja el ritmo y se vuelve nubio.',
    'アスワンは、エジプトが歩みをゆるめ、ヌビアへと表情を変える場所です。'],
  'cairo': ['Cairo is not one city. It is five centuries stacked on a single floodplain.',
    'El Cairo no es una sola ciudad: son cinco siglos apilados sobre una misma llanura aluvial.',
    'カイロは一つの街ではありません。ひとつの氾濫原の上に、五世紀が積み重なっています。'],
  'hurghada': ['Hurghada is a base, not a destination — the best days start by leaving it.',
    'Hurgada es una base, no un destino: los mejores días empiezan saliendo de ella.',
    'ハルガダは目的地ではなく拠点です——最良の一日は、ここを離れることから始まります。'],
  'luxor': ['Luxor is the largest open-air museum on earth, and you cannot see it in a morning.',
    'Luxor es el mayor museo al aire libre del mundo, y no se puede ver en una mañana.',
    'ルクソールは世界最大の野外博物館。一朝で見て回ることはできません。'],
  'marsa-alam': ['Marsa Alam is the quiet south: reef and desert, with almost no one on either.',
    'Marsa Alam es el sur tranquilo: arrecife y desierto, casi sin nadie en ninguno de los dos.',
    'マルサ・アラムは静かな南。サンゴ礁も砂漠も、人影はほとんどありません。'],
  'safaga': ['Safaga is a working Red Sea port; most travellers come for one day and head inland.',
    'Safaga es un puerto en activo del mar Rojo; la mayoría de los viajeros viene un día y se adentra tierra adentro.',
    'サファガは現役の紅海の港。多くの旅行者は一日だけ訪れ、内陸へと向かいます。'],
  'sharm': ['Sharm is not one destination. It is three different doors.',
    'Sharm no es un solo destino: son tres puertas distintas.',
    'シャルムは一つの目的地ではありません。三つの異なる扉です。'],
};

// Per-doc intro (varies by private vs small-group).
const INTRO: Record<string, Tri> = {
  'tourLanding.al-gouna-private-day-tours': [
    'Use this page to decide whether your day is on the water, out in the desert, or away to the sights — then pick the private day that matches your pace.',
    'Usa esta página para decidir si tu día transcurre en el agua, en el desierto o de excursión a los grandes lugares; luego elige el día privado que se ajuste a tu ritmo.',
    '水上で過ごすか、砂漠へ出るか、名所へ足を延ばすか——このページで一日の過ごし方を決め、あなたのペースに合うプライベートな一日をお選びください。'],
  'tourLanding.alexandria-private-day-tours': [
    'Use this page to decide whether your day is Greco-Roman, Mediterranean, or literary — then pick the private day that fits a single coastal outing.',
    'Usa esta página para decidir si tu día es grecorromano, mediterráneo o literario; luego elige el día privado que encaje en una sola salida a la costa.',
    'ギリシア・ローマの一日か、地中海の一日か、文学をたどる一日か——このページで選び、海辺への日帰りにふさわしいプライベートな一日をお選びください。'],
  'tourLanding.aswan-private-day-tours': [
    'Use this page to decide between the island temples, the river by felucca, and the road to Abu Simbel — then pick the private day that suits your time.',
    'Usa esta página para elegir entre los templos de las islas, el río en faluca y la carretera a Abu Simbel; luego elige el día privado que mejor se ajuste a tu tiempo.',
    '島の神殿、ファルーカで巡るナイル、アブ・シンベルへの道——このページで選び、ご滞在の時間に合うプライベートな一日をお選びください。'],
  'tourLanding.aswan-small-group-day-tours': [
    'Use this page to decide between the island temples, the river by felucca, and the road to Abu Simbel — then pick the small-group day that suits your time.',
    'Usa esta página para elegir entre los templos de las islas, el río en faluca y la carretera a Abu Simbel; luego elige el día en grupo reducido que mejor se ajuste a tu tiempo.',
    '島の神殿、ファルーカで巡るナイル、アブ・シンベルへの道——このページで選び、ご滞在の時間に合う少人数グループの一日をお選びください。'],
  'tourLanding.cairo-private-day-tours': [
    'Use this page to decide whether your day belongs to the Pyramids, Islamic Cairo, or the museums — then pick the private day that fits the hours you have.',
    'Usa esta página para decidir si tu día es para las pirámides, el Cairo islámico o los museos; luego elige el día privado que se ajuste a las horas de que dispones.',
    'ピラミッドの一日か、イスラム地区の一日か、博物館の一日か——このページで決め、お持ちの時間に合うプライベートな一日をお選びください。'],
  'tourLanding.cairo-small-group-day-tours': [
    'Use this page to decide whether your day belongs to the Pyramids, Islamic Cairo, or the museums — then pick the small-group day that fits the hours you have.',
    'Usa esta página para decidir si tu día es para las pirámides, el Cairo islámico o los museos; luego elige el día en grupo reducido que se ajuste a las horas de que dispones.',
    'ピラミッドの一日か、イスラム地区の一日か、博物館の一日か——このページで決め、お持ちの時間に合う少人数グループの一日をお選びください。'],
  'tourLanding.hurghada-private-day-tours': [
    'Use this page to decide whether your day goes out to the reef, inland to the desert, or south to the monasteries — then pick the private day that matches your energy.',
    'Usa esta página para decidir si tu día sale al arrecife, tierra adentro al desierto o al sur hacia los monasterios; luego elige el día privado que vaya con tu energía.',
    'サンゴ礁へ出るか、内陸の砂漠へ向かうか、南の修道院をめざすか——このページで決め、あなたの体力に合うプライベートな一日をお選びください。'],
  'tourLanding.hurghada-small-group-day-tours': [
    'Use this page to decide whether your day goes out to the reef, inland to the desert, or south to the monasteries — then pick the small-group day that matches your energy.',
    'Usa esta página para decidir si tu día sale al arrecife, tierra adentro al desierto o al sur hacia los monasterios; luego elige el día en grupo reducido que vaya con tu energía.',
    'サンゴ礁へ出るか、内陸の砂漠へ向かうか、南の修道院をめざすか——このページで決め、あなたの体力に合う少人数グループの一日をお選びください。'],
  'tourLanding.luxor-private-day-tours': [
    "Use this page to choose between the east bank's temples and the west bank's tombs — then pick the private day that matches your pace and the heat.",
    'Usa esta página para elegir entre los templos de la orilla este y las tumbas de la orilla oeste; luego elige el día privado que se ajuste a tu ritmo y al calor.',
    '東岸の神殿か、西岸の墓所か——このページで選び、あなたのペースと暑さに合うプライベートな一日をお選びください。'],
  'tourLanding.luxor-small-group-day-tours': [
    "Use this page to choose between the east bank's temples and the west bank's tombs — then pick the small-group day that matches your pace and the heat.",
    'Usa esta página para elegir entre los templos de la orilla este y las tumbas de la orilla oeste; luego elige el día en grupo reducido que se ajuste a tu ritmo y al calor.',
    '東岸の神殿か、西岸の墓所か——このページで選び、あなたのペースと暑さに合う少人数グループの一日をお選びください。'],
  'tourLanding.marsa-alam-private-day-tours': [
    'Use this page to decide between the southern reefs, the dolphin houses, and the desert tracks — then pick the private day that fits your stay.',
    'Usa esta página para elegir entre los arrecifes del sur, las casas de los delfines y las pistas del desierto; luego elige el día privado que encaje en tu estancia.',
    '南のサンゴ礁、イルカの集まる入り江、砂漠の道——このページで選び、ご滞在に合うプライベートな一日をお選びください。'],
  'tourLanding.marsa-alam-small-group-day-tours': [
    'Use this page to decide between the southern reefs, the dolphin houses, and the desert tracks — then pick the small-group day that fits your stay.',
    'Usa esta página para elegir entre los arrecifes del sur, las casas de los delfines y las pistas del desierto; luego elige el día en grupo reducido que encaje en tu estancia.',
    '南のサンゴ礁、イルカの集まる入り江、砂漠の道——このページで選び、ご滞在に合う少人数グループの一日をお選びください。'],
  'tourLanding.safaga-private-day-tours': [
    'Use this page to decide whether your day stays on the coast or runs to Luxor and the Nile — then pick the private day that fits your time ashore.',
    'Usa esta página para decidir si tu día se queda en la costa o se acerca a Luxor y el Nilo; luego elige el día privado que se ajuste a tu tiempo en tierra.',
    '海岸で過ごすか、ルクソールとナイルへ足を延ばすか——このページで決め、上陸時間に合うプライベートな一日をお選びください。'],
  'tourLanding.sharm-el-sheikh-private-day-tours': [
    'Use this page to decide whether your free day belongs to the reef, the mountain, or the Bedouin interior — then pick the private day that matches your energy.',
    'Usa esta página para decidir si tu día libre es para el arrecife, la montaña o el interior beduino; luego elige el día privado que vaya con tu energía.',
    '自由な一日を、サンゴ礁か、山か、ベドウィンの内陸か——このページで決め、あなたの体力に合うプライベートな一日をお選びください。'],
  'tourLanding.sharm-el-sheikh-small-group-day-tours': [
    'Use this page to decide whether your day belongs to the reef, the mountain, or the Bedouin interior — then pick the small-group day that matches your energy.',
    'Usa esta página para decidir si tu día es para el arrecife, la montaña o el interior beduino; luego elige el día en grupo reducido que vaya con tu energía.',
    'サンゴ礁か、山か、ベドウィンの内陸か——このページで一日を決め、あなたの体力に合う少人数グループの一日をお選びください。'],
};

const cityOf = (id: string) => {
  const s = id.replace('tourLanding.', '').replace(/-(private|small-group)-day-tours$/, '');
  return s === 'sharm-el-sheikh' ? 'sharm' : s;
};

async function main() {
  console.log(`seed-landing-byline-i18n — ${COMMIT ? 'COMMIT' : 'DRY RUN'} — dataset=${client.config().dataset}\n`);
  let n = 0;
  for (const [id, intro] of Object.entries(INTRO)) {
    const city = cityOf(id);
    const head = HEAD[city];
    if (!head) { console.warn(`  ! no heading for ${id} (city ${city})`); continue; }
    const en = await client.fetch<{ h?: string; i?: string } | null>(
      `*[_id==$id][0]{ "h": editorByline.heading[_key=="en"][0].value, "i": editorByline.intro[_key=="en"][0].value }`, { id });
    if (!en?.h) { console.warn(`  ! ${id} has no en heading — skip`); continue; }
    // sanity: preserve the live EN verbatim (use it, not our copy, in case of drift)
    const headTri: Tri = [en.h, head[1], head[2]];
    const introTri: Tri = [en.i ?? intro[0], intro[1], intro[2]];
    const set = { 'editorByline.heading': arr(headTri), 'editorByline.intro': arr(introTri) };
    // patch published + draft if it exists
    const targets = [id];
    const draftExists = await client.fetch<boolean>(`defined(*[_id==$d][0]._id)`, { d: 'drafts.' + id });
    if (draftExists) targets.push('drafts.' + id);
    for (const t of targets) {
      console.log(`  ${COMMIT ? '✓' : '·'} ${t}`);
      if (COMMIT) await client.patch(t).set(set).commit({ autoGenerateArrayKeys: false });
    }
    n++;
  }
  console.log(`\n${n} landings ${COMMIT ? 'patched' : 'previewed'} (heading + intro, es+ja). ${COMMIT ? 'DONE.' : 'Re-run with --commit.'}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
