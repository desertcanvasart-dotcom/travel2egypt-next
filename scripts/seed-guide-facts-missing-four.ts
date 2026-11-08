/**
 * Fill the four /guide archive cards left without a facts block.
 *
 * seed-guide-i18n.ts localized 42 guide cities; four that carry a guideRegion
 * were never in its table and render as a bare title + image on /guide:
 *   siwa-oasis, al-wadi-al-gadid, al-fayoum, wadi-el-natrun
 *
 * Seeds the same four fields the rest of the archive uses, EN/ES/JA:
 *   guideDek (Text), guideBestFor (String), guideTime (String),
 *   guideHonestNote (Text)
 *
 * guideTier / guideOrder are deliberately left null — these four sit after the
 * ranked cities in their region, which is where they belong.
 *
 * Dry-run by default; pass --commit to write.
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();

const COMMIT = process.argv.includes('--commit');
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

type Tri = [string, string, string]; // [en, es, ja]
const S = (v: Tri) => [
  { _key: 'en', _type: 'internationalizedArrayStringValue', value: v[0] },
  { _key: 'es', _type: 'internationalizedArrayStringValue', value: v[1] },
  { _key: 'ja', _type: 'internationalizedArrayStringValue', value: v[2] },
];
const T = (v: Tri) => [
  { _key: 'en', _type: 'internationalizedArrayTextValue', value: v[0] },
  { _key: 'es', _type: 'internationalizedArrayTextValue', value: v[1] },
  { _key: 'ja', _type: 'internationalizedArrayTextValue', value: v[2] },
];

interface CityRow { dek: Tri; bestFor: Tri; time: Tri; honest: Tri }

const CITIES: Record<string, CityRow> = {
  'siwa-oasis': {
    dek: [`Berber Egypt near the Libyan frontier — springs, salt lakes, and the oracle Alexander crossed the desert to consult.`,
      `El Egipto bereber cerca de la frontera libia: manantiales, lagos salados y el oráculo que Alejandro cruzó el desierto para consultar.`,
      `リビア国境に近いベルベルのエジプト——泉と塩湖、そしてアレクサンドロスが砂漠を越えて訪ねた神託の地。`],
    bestFor: [`Siwi Berber culture, the Oracle temple, salt lakes and sand sea`,
      `la cultura bereber siwi, el templo del Oráculo, lagos salados y mar de arena`,
      `シーワのベルベル文化、神託の神殿、塩湖と砂の海`],
    time: [`three nights, plus the drive`, `tres noches, más el viaje por carretera`, `三泊、加えて道中の時間`],
    honest: [`No airport and a long road in — which is exactly why it is still itself.`,
      `Sin aeropuerto y con una larga carretera de entrada: por eso sigue siendo lo que es.`,
      `空港はなく、入るには長い道のり——だからこそ、今も昔のままでいられる。`],
  },
  'al-wadi-al-gadid': {
    dek: [`The New Valley itself — the governorate that holds Kharga, Dakhla and Farafra, and two-fifths of Egypt.`,
      `El Nuevo Valle en sí: la gobernación que abarca Jarga, Dajla y Farafra, y dos quintas partes de Egipto.`,
      `新渓谷県そのもの——ハルガ、ダフラ、ファラフラを抱え、エジプトの五分の二を占める。`],
    bestFor: [`reading the oasis chain as one route`,
      `entender la cadena de oasis como una sola ruta`,
      `オアシスの連なりを一本の道として捉えること`],
    time: [`a week, if you drive the whole chain`, `una semana, si recorres toda la cadena`, `全行程を走るなら一週間`],
    honest: [`A governorate, not a town — you come for its oases, not for a place by this name.`,
      `Es una gobernación, no un pueblo: se viene por sus oasis, no por un lugar con este nombre.`,
      `町ではなく県の名だ。目当てはその中のオアシスであって、この名の場所ではない。`],
  },
  'al-fayoum': {
    dek: [`A lake, a waterfall and a valley of fossil whales — the desert day out closest to Cairo.`,
      `Un lago, una cascada y un valle de ballenas fósiles: la escapada al desierto más cercana a El Cairo.`,
      `湖と滝、そしてクジラの化石が眠る谷——カイロから最も近い砂漠への一日。`],
    bestFor: [`Lake Qarun, Wadi El Rayan, the fossil whales of Wadi Al Hitan, Tunis village pottery`,
      `el lago Qarun, Wadi El Rayan, las ballenas fósiles de Wadi Al Hitan, la cerámica de Tunis`,
      `カルーン湖、ワディ・エル・ラヤン、ワディ・アル・ヒタンのクジラ化石、トゥニス村の陶器`],
    time: [`a long day, better as an overnight`, `un día largo, mejor con noche`, `丸一日、できれば一泊`],
    honest: [`Close enough to rush, good enough not to.`,
      `Está lo bastante cerca para hacerlo con prisa, y es lo bastante bueno para no hacerlo.`,
      `日帰りで急げる近さだが、急がないだけの価値がある。`],
  },
  'wadi-el-natrun': {
    dek: [`Four working monasteries in the natron valley, just off the Cairo–Alexandria desert road.`,
      `Cuatro monasterios en activo en el valle del natrón, junto a la carretera del desierto El Cairo–Alejandría.`,
      `ナトロンの谷に今も生きる四つの修道院。カイロ〜アレクサンドリアの砂漠道路のすぐ脇にある。`],
    bestFor: [`Coptic monasticism, the desert fathers, the natron lakes`,
      `el monacato copto, los padres del desierto, los lagos de natrón`,
      `コプトの修道制、砂漠の師父たち、ナトロン湖`],
    time: [`a half day, on the way north`, `medio día, de camino al norte`, `北へ向かう途中に半日`],
    honest: [`A pilgrimage stop rather than a detour for everyone — check visiting hours and fasting seasons first.`,
      `Una parada de peregrinación más que un desvío para todos: consulta antes los horarios de visita y los tiempos de ayuno.`,
      `巡礼の立ち寄り先であって、誰にでも勧める寄り道ではない。拝観時間と断食期をまず確認したい。`],
  },
};

async function main() {
  console.log(`seed-guide-facts-missing-four — ${COMMIT ? 'COMMIT' : 'DRY RUN'} — dataset=${client.config().dataset}\n`);

  let n = 0;
  for (const [slug, row] of Object.entries(CITIES)) {
    const ids = await client.fetch<string[]>(
      `*[_type=="city" && slug[_key=="en"][0].value.current==$slug]._id`, { slug });
    if (!ids.length) { console.warn(`  ! city not found: ${slug}`); continue; }
    const set: Record<string, unknown> = {
      guideDek: T(row.dek),
      guideBestFor: S(row.bestFor),
      guideTime: S(row.time),
      guideHonestNote: T(row.honest),
    };
    for (const id of ids) {
      if (COMMIT) await client.patch(id, { set }).commit({ autoGenerateArrayKeys: false });
    }
    n++;
    console.log(`  ${COMMIT ? '✓' : '·'} ${slug} → ${ids.join(', ')}`);
    console.log(`      dek      ${row.dek[0]}`);
    console.log(`      bestFor  ${row.bestFor[0]}`);
    console.log(`      time     ${row.time[0]}`);
    console.log(`      honest   ${row.honest[0]}\n`);
  }
  console.log(`${n} cities ${COMMIT ? 'patched' : 'previewed'}. ${COMMIT ? 'DONE.' : 'Re-run with --commit to write.'}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
