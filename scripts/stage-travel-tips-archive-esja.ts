/**
 * Stage ES/JA for the travelTipsArchive singleton (owner report 2026-08-19:
 * /es/travel-tips and /ja/travel-tips hero + essay render English).
 *
 * The doc was EN-only in every editorial field: kicker, mastTitle, tagline,
 * essayHeading, essay (2 paragraphs + conciergeNote), cornerstone.dek, and
 * the 6 department intros. (Department CATEGORY names were already
 * trilingual — tipCategory docs localized in the ES/JA tour extension.)
 *
 * Renderings inline below (Canon: EN source of truth, natural-prose
 * reworkings, ES impersonal-editorial, JA formal; mastTitle reuses the
 * approved nav names Consejos de viaje / 旅のヒント). The essay's "About
 * Egypt" mention stays in English deliberately — it names the cornerstone
 * tip card, whose title still renders EN (tips corpus is the remaining
 * ES/JA backlog); a translated mention would mismatch the card it points at.
 *
 * DRAFT ONLY — owner reviews and publishes from Studio.
 *
 *   Dry run (default): npx tsx scripts/stage-travel-tips-archive-esja.ts
 *   Apply:             npx tsx scripts/stage-travel-tips-archive-esja.ts --apply
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';

const APPLY = process.argv.includes('--apply');

const token =
  process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error('Missing SANITY_PRODUCTION_API_WRITE_TOKEN');
  process.exit(1);
}
const c = createClient({
  projectId: 'ufallvd2',
  dataset: 'production',
  apiVersion: '2024-12-01',
  token,
  useCdn: false,
});

const STR = {
  kicker: {
    es: 'Antes del viaje · Edición №7',
    ja: 'ご出発の前に · 第7版',
  },
  mastTitle: {
    es: 'Consejos de viaje',
    ja: '旅のヒント',
  },
  tagline: {
    es: 'Las preguntas que surgen antes de cada primer viaje a Egipto — respondidas con sencillez, tal como las responderíamos en privado.',
    ja: '初めてのエジプト旅行の前に必ず出てくる疑問——シンプルに、私たちが個別にお答えするのと同じようにお答えします。',
  },
  essayHeading: {
    es: 'Cómo usar esta página.',
    ja: 'このページの使い方',
  },
};

const ESSAY = {
  es: {
    p1: 'Estas son las respuestas que más damos antes de un primer viaje: el andamiaje práctico que permite que el resto del viaje trate de Egipto y no de la logística. Visados, dinero, vestimenta, desplazamientos: se resuelven una vez y se olvidan.',
    p2: 'Para un primer contacto con el país, el punto de partida es «About Egypt». En caso contrario, basta con ir directamente al departamento que haga falta: el índice completo de todos los consejos está al final.',
    note: 'Si la pregunta no aparece aquí, basta con preguntarnos. Los detalles prácticos son la parte fácil de acertar con un poco de conocimiento local.',
  },
  ja: {
    p1: 'これらは、初めてのご旅行の前に私たちが最もよくお伝えしている答えです——旅の残りの時間をロジスティクスではなくエジプトそのものに使うための、実務的な土台です。ビザ、お金、服装、移動手段。一度整理してしまえば、あとは忘れてかまいません。',
    p2: 'エジプトが初めての方は、まず「About Egypt」からどうぞ。そうでない方は、必要なセクションに直接お進みください——すべてのヒントの索引はページの最後にあります。',
    note: 'お探しの質問が見つからない場合は、遠慮なくお尋ねください。実務的な細部は、少しの現地知識があれば簡単に解決できる部分です。',
  },
};

const DEK = {
  es: 'Cómo es realmente el país — geografía, historia, idioma y los ritmos de la vida cotidiana — antes de llegar.',
  ja: '地理、歴史、言語、日々の暮らしのリズム——到着する前に知っておきたい、この国の実際の姿。',
};

/** Department intros, in the doc's array order (EN shown for the reviewer). */
const DEPT_INTROS: Array<{ en: string; es: string; ja: string }> = [
  {
    en: 'Visas, money, connectivity, health — the handful of things to settle before you go.',
    es: 'Visados, dinero, conectividad, salud: el puñado de cosas que conviene dejar resueltas antes de salir.',
    ja: 'ビザ、お金、通信、健康——出発前に整えておきたいいくつかのこと。',
  },
  {
    en: 'Trains, domestic flights, taxis and apps — moving between the cities without friction.',
    es: 'Trenes, vuelos internos, taxis y aplicaciones: moverse entre ciudades sin fricciones.',
    ja: '鉄道、国内線、タクシーとアプリ——都市間の移動を滞りなく。',
  },
  {
    en: 'Dress, tipping, Ramadan, and the small courtesies that make the days smoother.',
    es: 'Vestimenta, propinas, Ramadán y las pequeñas cortesías que hacen los días más llevaderos.',
    ja: '服装、チップ、ラマダン、そして日々を円滑にする小さな心遣い。',
  },
  {
    en: 'Season by season — heat, crowds, and the windows worth planning around.',
    es: 'Estación por estación: calor, afluencia y las ventanas que merece la pena planificar.',
    ja: '季節ごとの暑さと混雑、そして計画する価値のある時期。',
  },
  {
    en: 'What to eat, what to drink, and how to do both well.',
    es: 'Qué comer, qué beber y cómo hacer bien ambas cosas.',
    ja: '何を食べ、何を飲み、その両方をどう楽しむか。',
  },
  {
    en: 'Families, solo travellers, accessibility — tips for the way you actually travel.',
    es: 'Familias, quienes viajan solos, accesibilidad: consejos para la manera real de viajar de cada uno.',
    ja: 'ご家族、おひとりでの旅、アクセシビリティ——実際の旅のかたちに合わせたヒント。',
  },
];

const block = (key: string, text: string) => ({
  _type: 'block',
  _key: key,
  style: 'normal',
  markDefs: [],
  children: [{ _type: 'span', _key: `${key}s`, marks: [], text }],
});

const essayValue = (loc: 'es' | 'ja') => [
  block(`tta${loc}1`, ESSAY[loc].p1),
  block(`tta${loc}2`, ESSAY[loc].p2),
  {
    _type: 'conciergeNote',
    _key: `tta${loc}3`,
    body: [block(`tta${loc}3b`, ESSAY[loc].note)],
  },
];

async function main() {
  console.log(`\n=== Stage travelTipsArchive ES/JA — ${APPLY ? 'APPLY' : 'DRY RUN'} ===\n`);
  const [doc, draftExists] = await Promise.all([
    c.getDocument('travelTipsArchive'),
    c.fetch<boolean>(`defined(*[_id=='drafts.travelTipsArchive'][0]._id)`),
  ]);
  if (!doc) throw new Error('travelTipsArchive not found');
  if (draftExists) throw new Error('draft already exists — clean-draft rule, review in Studio first');
  if ((doc.tagline ?? []).some((x: { _key: string }) => x._key === 'es')) {
    console.log('Already localized — nothing to do.');
    return;
  }
  if ((doc.departments ?? []).length !== DEPT_INTROS.length) {
    throw new Error(`department count drifted: ${(doc.departments ?? []).length} vs ${DEPT_INTROS.length}`);
  }
  // guard: department order matches the EN intros this file was authored against
  doc.departments.forEach((dep: any, i: number) => {
    const en = (dep.intro ?? []).find((x: { _key: string }) => x._key === 'en')?.value;
    if (en !== DEPT_INTROS[i].en) throw new Error(`department ${i} EN intro drifted:\n  have: ${en}`);
  });

  const addLoc = (arr: any[], es: string, ja: string) => [
    ...arr,
    { _key: 'es', value: es },
    { _key: 'ja', value: ja },
  ];

  const draft = {
    ...doc,
    _id: 'drafts.travelTipsArchive',
    kicker: addLoc(doc.kicker, STR.kicker.es, STR.kicker.ja),
    mastTitle: addLoc(doc.mastTitle, STR.mastTitle.es, STR.mastTitle.ja),
    tagline: addLoc(doc.tagline, STR.tagline.es, STR.tagline.ja),
    essayHeading: addLoc(doc.essayHeading, STR.essayHeading.es, STR.essayHeading.ja),
    essay: [...doc.essay, { _key: 'es', value: essayValue('es') }, { _key: 'ja', value: essayValue('ja') }],
    cornerstone: {
      ...doc.cornerstone,
      dek: addLoc(doc.cornerstone.dek, DEK.es, DEK.ja),
    },
    departments: doc.departments.map((dep: any, i: number) => ({
      ...dep,
      intro: addLoc(dep.intro, DEPT_INTROS[i].es, DEPT_INTROS[i].ja),
    })),
  };

  console.log('  ✓ DRAFT drafts.travelTipsArchive — kicker/mastTitle/tagline/essayHeading/essay/dek + 6 department intros ×2 locales');
  if (APPLY) {
    await c.createOrReplace(draft as never);
    console.log('  staged.');
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
