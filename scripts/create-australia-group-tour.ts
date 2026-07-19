/**
 * Seed the "Egypt Group Tours from Australia & Oceania" landing:
 *   1. Create the group package tour "12-Day Egypt Group Tour: Cairo, the Nile
 *      by Dahabiya & the Red Sea" (one internationalized doc, EN/ES/JA) — type
 *      package, tourMode group, originRegion australia-oceania → it auto-appears
 *      on the landing's group-package query.
 *   2. Populate the landing: intro (page-copy main body), summary (hero
 *      subtitle), ctaContext (editor's note), relatedTours (feature the tour).
 *
 * Tour bodies are parsed from the owner markdown (EN/ES use YAML frontmatter +
 * `####` days + `**Meals:**`; JA uses `**▸ …**`/`**■ …**` + `食事：`/`宿泊：` +
 * `· · ·`). Landing copy is transcribed inline. Publishes via createOrReplace.
 *
 *   npx tsx scripts/create-australia-group-tour.ts --dry-run
 *   npx tsx scripts/create-australia-group-tour.ts --commit
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();
function die(m: string): never { process.stderr.write(`error: ${m}\n`); process.exit(2); }
const commit = process.argv.includes('--commit');
if (!commit && !process.argv.includes('--dry-run')) die('pass --dry-run or --commit');

const DIR = '/Users/islamhussein/Documents/Travel2Egypt Website Content Hub/01_CANONICAL_3_LANGS/All 3 langs/aust';
const TOUR_SRC: Record<string, string> = {
  en: `${DIR}/en/12-day-egypt-group-tour-cairo-dahabiya-red-sea.md`,
  es: `${DIR}/es/12-day-egypt-group-tour-cairo-dahabiya-red-sea_es_2026-07.md`,
  ja: `${DIR}/ja/12-day-egypt-group-tour-cairo-dahabiya-red-sea_ja_2026-07.md`,
};
type Lang = 'en' | 'es' | 'ja';
const LANGS: Lang[] = ['en', 'es', 'ja'];

function getClient(): SanityClient {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (dataset !== 'production') die('production only');
  const token = process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
  if (!projectId || !token) die('missing projectId/token');
  return createClient({ projectId, dataset, apiVersion: '2024-12-01', useCdn: false, token, perspective: 'raw' });
}

let kc = 0;
const key = (p: string) => `${p}${(kc++).toString(36)}`;

// ── config ─────────────────────────────────────────────────────────────────
const TOUR_ID = 'tour.12-day-egypt-group-tour-cairo-dahabiya-red-sea';
const LANDING_ID = 'tourLanding.egypt-group-tours-from-australia';
const EN_TITLE = '12-Day Egypt Group Tour: Cairo, the Nile by Dahabiya & the Red Sea';
const SLUGS: Record<Lang, string> = {
  en: '12-day-egypt-group-tour-cairo-dahabiya-red-sea',
  es: 'egipto-en-plenitud-el-cairo-el-nilo-en-dahabeya-y-el-mar-rojo-en-12-dias',
  ja: '12-nichikan-ejiputo-gurupu-tsua-kairo-dahabiya-kokai',
};
const PRICE_FROM = 2765;
const THEME = 'theme-egypt-in-depth';
const CITIES = ['wp-page-83284', 'wp-page-58758', 'wp-page-58877', 'wp-page-58859']; // cairo, aswan, luxor, hurghada
const HERO_ASSET = 'image-1394fe0d9e739e7ad2c5de8240a29e58d81a7819-3000x2000-jpg';
const HERO: Record<Lang, { alt: string; caption: string }> = {
  en: { alt: 'A traditional Dahabiya with red-and-white lateen sails glides down the Nile at sunset, past a palm-lined bank.', caption: 'Three nights under sail: the five-star Dahabiya on the Nile — the journey’s defining stretch.' },
  es: { alt: 'Una dahabeya tradicional de velas latinas rojas y blancas navega por el Nilo al atardecer, ante una orilla de palmeras.', caption: 'Tres noches a vela: la dahabeya de cinco estrellas en el Nilo, el tramo que define el viaje.' },
  ja: { alt: '赤と白の三角帆を張った伝統的なダハビーヤが、ヤシの並ぶ岸辺を背に、夕暮れのナイル川を進む。', caption: '帆走の3泊——ナイルを行く五つ星ダハビーヤ。この旅を定義する時間。' },
};

// JA title/summary are not in frontmatter — taken from the file's headline / subtitle.
const JA_TITLE = 'まるごとのエジプト12日間——カイロ、ダハビーヤのナイル、そして紅海へ';
const JA_SUMMARY = '二大博物館とアブ・シンベル、帆走のダハビーヤ3泊、紅海オールインクルーシブ3泊。何も追加料金にしない、まるごとのエジプト12日間。';

// ── landing copy (transcribed from the page-copy files) ──────────────────────
const LANDING_SUMMARY: Record<Lang, string> = {
  en: 'Shared-departure Egypt itineraries built for travellers from Australia and New Zealand — fixed dates worth planning a long journey around, generous itineraries, and trusted operators.',
  es: 'Itinerarios de salida compartida por Egipto, pensados para viajeros de Australia y Nueva Zelanda: fechas fijas en torno a las que planear un viaje largo, itinerarios generosos y operadores de confianza.',
  ja: 'オーストラリアとニュージーランドからの旅行者のために組んだ、乗合出発のエジプト旅程——長い旅を計画する軸になる固定日程、ゆとりある行程、信頼できる催行体制。',
};
// Editor's View sidebar box (editorByline.heading + editorByline.intro), matching siblings.
const EDITOR_HEADING: Record<Lang, string> = {
  en: 'Egypt on a schedule built for travellers from Australia and New Zealand.',
  es: 'Egipto con un calendario pensado para viajeros de Australia y Nueva Zelanda.',
  ja: 'オーストラリアとニュージーランドからの旅行者のための日程で巡るエジプト。',
};
const EDITOR_NOTE: Record<Lang, string> = {
  en: 'Use this page to find the fixed-date group departures that make sense of the long flight from Sydney, Melbourne, Auckland or Perth — then pick the one that fits your dates.',
  es: 'Use esta página para encontrar las salidas en grupo de fecha fija que dan sentido al largo vuelo desde Sídney, Melbourne, Auckland o Perth, y elija la que encaje con sus fechas.',
  ja: 'シドニー、メルボルン、オークランド、パースからの長いフライトに意味を与える、固定日程のグループ出発をこのページからお探しください。あとは、ご都合に合う日程を選ぶだけです。',
};
const LANDING_INTRO: Record<Lang, string[]> = {
  en: [
    'These are scheduled small-group journeys built for travellers coming from Australia and New Zealand. There is no non-stop flight from Oceania to Egypt — the journey runs through Dubai, Doha, Abu Dhabi or Singapore and takes the better part of a day — so a trip this far deserves a plan that is settled before you board. Departure dates are set well in advance, the itineraries run long enough to justify the distance, and you travel with a small group rather than a full coach.',
    'A group departure sits between a private tour and travelling alone. You share the cost and the company of a handful of fellow travellers while keeping a properly guided, sensibly paced route through Egypt’s essentials — the Pyramids, the Nile, Luxor and Aswan — with every transfer, hotel and ticket arranged before you arrive. The pacing matters more from this far away: after twenty hours of flying and an eight-to-nine-hour time change, the first days are built to give without exhausting.',
    'It suits first-time visitors who would rather join a ready-made departure than assemble a trip from scratch, travellers folding Egypt into a longer arc through Europe or the Middle East, and anyone whose dates are set by the calendar at home — school terms, the long summer break, the northern escape from an Australian winter. If you would prefer your own dates and your own party, a private journey fits better — tell us and we will point you there.',
  ],
  es: [
    'Estos son viajes programados en grupos reducidos, construidos para viajeros que llegan desde Australia y Nueva Zelanda. No existe un vuelo sin escalas entre Oceanía y Egipto —el trayecto pasa por Dubái, Doha, Abu Dabi o Singapur y ocupa la mayor parte de un día—, de modo que un viaje desde tan lejos merece un plan cerrado antes de embarcar. Las fechas de salida se fijan con mucha antelación, los itinerarios son lo bastante largos para justificar la distancia, y se viaja en un grupo reducido en lugar de un autocar lleno.',
    'Una salida en grupo se sitúa entre un tour privado y viajar solo. Se comparte el coste y la compañía de un puñado de compañeros de viaje, manteniendo una ruta bien guiada y de ritmo sensato por lo esencial de Egipto —las pirámides, el Nilo, Luxor y Asuán—, con cada traslado, hotel y entrada organizados antes de llegar. El ritmo importa más cuando se viene de tan lejos: tras veinte horas de vuelo y un cambio horario de ocho a nueve horas, los primeros días están construidos para dar sin agotar.',
    'Es un formato que conviene a quien visita Egipto por primera vez y prefiere sumarse a una salida ya armada antes que montar un viaje desde cero; a quien encaja Egipto dentro de un arco más largo por Europa u Oriente Medio; y a cualquiera cuyas fechas las marca el calendario de casa —los períodos escolares, las largas vacaciones de verano, la escapada al norte durante el invierno australiano. Si prefiere sus propias fechas y su propio grupo, un viaje privado encaja mejor: díganoslo y le orientaremos.',
  ],
  ja: [
    'これらは、オーストラリアとニュージーランドから訪れる旅行者のために組んだ、催行日の決まった少人数グループの旅です。オセアニアとエジプトを結ぶ直行便はありません——旅路はドバイ、ドーハ、アブダビ、あるいはシンガポールを経由し、ほぼ丸一日を要します。だからこそ、これほど遠くからの旅には、搭乗する前にすべてが定まった計画がふさわしいのです。出発日は十分な余裕をもって確定し、旅程はその距離に見合うだけの長さで組まれ、そして満員の大型バスではなく、少人数のグループで旅をします。',
    'グループ出発は、プライベートツアーと一人旅のあいだに位置します。数名の旅の仲間と費用と時間を分かち合いながら、エジプトの本質——ピラミッド、ナイル、ルクソール、アスワン——を、きちんとガイドされた無理のないペースの行程で巡り、送迎もホテルも入場券も、到着前にすべて手配されています。これほど遠くから来るときこそ、ペースはいっそう大切です。二十時間の飛行と八〜九時間の時差のあとの最初の数日は、与えはするが疲れさせないように組んであります。',
    '初めてのエジプトで、一から旅を組み立てるよりも出来上がった出発に加わりたい方。ヨーロッパや中東を巡る長い旅の弧のなかにエジプトを組み込む方。そして、学期や長い夏休み、オーストラリアの冬の北への脱出など、日程が家のカレンダーで決まっている方。この形式は、そうした方々に向いています。ご自身の日程とご自身のご一行を望まれるなら、プライベートの旅のほうが合っています——お知らせいただければ、そちらへご案内します。',
  ],
};

// ── portable-text helpers ────────────────────────────────────────────────────
interface Span { _key: string; _type: 'span'; text: string; marks: string[] }
interface Block { _key: string; _type: 'block'; style: string; markDefs: never[]; children: Span[] }

function inline(text: string): Span[] {
  const out: Span[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ _key: key('s'), _type: 'span', text: text.slice(last, m.index), marks: [] });
    out.push({ _key: key('s'), _type: 'span', text: m[1] ?? m[2], marks: [m[1] != null ? 'strong' : 'em'] });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ _key: key('s'), _type: 'span', text: text.slice(last), marks: [] });
  return out.length ? out : [{ _key: key('s'), _type: 'span', text, marks: [] }];
}
const para = (text: string, style = 'normal'): Block => ({ _key: key('b'), _type: 'block', style, markDefs: [], children: inline(text) });

const MEALS_RE = /^\*\*\s*(Meals|Comidas|Overnight|Alojamiento|食事|宿泊)\s*[:：]/;

function parseTourBody(lang: Lang): Block[] {
  let raw = readFileSync(TOUR_SRC[lang], 'utf8').replace(/\r\n/g, '\n');
  raw = raw.replace(/^﻿?---\n[\s\S]*?\n---\n/, ''); // strip YAML frontmatter (en/es)
  if (/^\s*\*\*Meta/i.test(raw)) { const cut = raw.indexOf('\n---'); if (cut !== -1) raw = raw.slice(cut + 4); }

  const blocks: Block[] = [];
  let sawHeadline = false;
  for (let line of raw.split('\n')) {
    line = line.replace(/\s+$/, '').replace(/^\s+/, '');
    line = line.replace(/\s*→\s*\*[^*]*\*\s*$/, '').trimEnd(); // strip "→ *Plan this with us*" CTA tail
    if (!line) continue;
    if (line === '---' || /^[·・]\s*[·・]\s*[·・]$/.test(line) || /^—.*—$/.test(line) || line === EN_TITLE) continue;

    // meals / overnight → normal block (bold label kept via inline)
    if (MEALS_RE.test(line)) { blocks.push(para(line)); continue; }

    // table rows
    if (/^\|.*\|$/.test(line)) {
      const cells = line.split('|').slice(1, -1).map((c) => c.trim());
      if (cells.length < 2) continue;
      const label = cells[0].replace(/\*\*/g, '').trim();
      const value = cells[1].trim();
      if (!label || !value || /^-+$/.test(label) || /^(From|Desde|目安)\b/i.test(label)) continue;
      blocks.push(para(`**${label}** — ${value}`));
      continue;
    }

    // headings
    const md = line.match(/^(#{1,6})\s+(.+)$/);
    const tri = line.match(/^\*\*\s*▸\s*(.+?)\s*\*\*$/);       // JA day
    const sq = line.match(/^\*\*\s*■\s*(.+?)\s*\*\*$/);        // JA section
    const wholeBold = line.match(/^\*\*(.+?)\*\*$/);
    if (md) { const lvl = md[1].length <= 2 ? 'h2' : 'h3'; blocks.push({ _key: key('b'), _type: 'block', style: lvl, markDefs: [], children: [{ _key: key('s'), _type: 'span', text: md[2].trim(), marks: [] }] }); sawHeadline = true; continue; }
    if (tri) { blocks.push({ _key: key('b'), _type: 'block', style: 'h3', markDefs: [], children: [{ _key: key('s'), _type: 'span', text: tri[1].trim(), marks: [] }] }); continue; }
    if (sq) { blocks.push({ _key: key('b'), _type: 'block', style: 'h2', markDefs: [], children: [{ _key: key('s'), _type: 'span', text: sq[1].trim(), marks: [] }] }); sawHeadline = true; continue; }
    if (wholeBold) { const style = sawHeadline ? 'h3' : 'h2'; sawHeadline = true; blocks.push({ _key: key('b'), _type: 'block', style, markDefs: [], children: [{ _key: key('s'), _type: 'span', text: wholeBold[1].trim(), marks: [] }] }); continue; }

    blocks.push(para(line));
  }
  return blocks;
}

function frontmatter(lang: Lang): { title: string; description: string } {
  const raw = readFileSync(TOUR_SRC[lang], 'utf8');
  const m = raw.match(/^﻿?---\n([\s\S]*?)\n---\n/);
  const out: Record<string, string> = {};
  if (m) for (const l of m[1].split('\n')) { const kv = l.match(/^(\w+):\s*(.*)$/); if (kv) out[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim(); }
  return { title: out.title ?? '', description: out.description ?? '' };
}

// ── build ────────────────────────────────────────────────────────────────────
const titleOf: Record<Lang, string> = { en: '', es: '', ja: JA_TITLE };
const summaryOf: Record<Lang, string> = { en: '', es: '', ja: JA_SUMMARY };
for (const l of ['en', 'es'] as Lang[]) { const fm = frontmatter(l); titleOf[l] = fm.title; summaryOf[l] = fm.description; }

const iaStr = (v: Record<Lang, string>) => LANGS.map((l) => ({ _key: l, _type: 'internationalizedArrayStringValue', value: v[l] }));
const objArr = (v: Record<Lang, string>) => LANGS.map((l) => ({ _key: l, _type: 'object', value: v[l] }));
const bodyByLang = Object.fromEntries(LANGS.map((l) => [l, parseTourBody(l)])) as Record<Lang, Block[]>;

const tourDoc = {
  _id: TOUR_ID,
  _type: 'tour',
  type: 'package',
  tourMode: 'group',
  originRegion: 'australia-oceania',
  durationDays: 12,
  priceFrom: PRICE_FROM,
  theme: { _ref: THEME, _type: 'reference' },
  cities: CITIES.map((c) => ({ _key: key('c'), _ref: c, _type: 'reference' })),
  title: objArr(titleOf),
  slug: LANGS.map((l) => ({ _key: l, _type: 'object', value: { _type: 'slug', current: SLUGS[l] } })),
  summary: objArr(summaryOf),
  body: LANGS.map((l) => ({ _key: l, _type: 'object', value: bodyByLang[l] })),
  heroImage: {
    _type: 'image',
    asset: { _ref: HERO_ASSET, _type: 'reference' },
    alt: objArr({ en: HERO.en.alt, es: HERO.es.alt, ja: HERO.ja.alt }),
    caption: objArr({ en: HERO.en.caption, es: HERO.es.caption, ja: HERO.ja.caption }),
  },
};

const landingPatch = {
  summary: LANGS.map((l) => ({ _key: l, _type: 'internationalizedArrayTextValue', value: LANDING_SUMMARY[l] })),
  editorByline: { heading: iaStr(EDITOR_HEADING), intro: iaStr(EDITOR_NOTE) },
  intro: LANGS.map((l) => ({ _key: l, value: LANDING_INTRO[l].map((p) => para(p)) })),
  relatedTours: [{ _key: key('rt'), _ref: TOUR_ID, _type: 'reference' }],
};

console.log(`\n=== create Australia group tour ===  mode: ${commit ? 'COMMIT' : 'dry-run'}`);
for (const l of LANGS) console.log(`[${l}] "${titleOf[l]}"  /${SLUGS[l]}  | body blocks: ${bodyByLang[l].length} (h2 ${bodyByLang[l].filter((b) => b.style === 'h2').length}, h3 ${bodyByLang[l].filter((b) => b.style === 'h3').length})`);
console.log(`price €${PRICE_FROM} | theme ${THEME} | cities ${CITIES.length} | hero ${HERO_ASSET.slice(0, 20)}…`);
console.log(`landing: intro ${LANGS.map((l) => LANDING_INTRO[l].length).join('/')} paras, summary+cta set, relatedTours→tour`);

writeFileSync(resolve(process.cwd(), 'migration/australia-group-tour-backup.json'), JSON.stringify({ tourDoc, landingPatch }, null, 2), 'utf8');

if (!commit) { console.log('\nDry-run complete. Backup written.'); process.exit(0); }

(async () => {
  const client = getClient();
  await client.transaction()
    .createOrReplace(tourDoc as any)
    .patch(LANDING_ID, (p) => p.set(landingPatch))
    .commit({ visibility: 'async' });
  console.log(`\nPublished tour ${TOUR_ID} + patched landing ${LANDING_ID}.`);
  console.log(`  EN /${SLUGS.en}  ·  ES /${SLUGS.es}  ·  JA /${SLUGS.ja}`);
})().catch((e) => { console.error(e); process.exit(1); });
