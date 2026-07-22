/**
 * One-off content fix: tour.pyramids-of-giza-and-sphinx-group-day-tour
 * (owner review 2026-07-22, three numbered fixes + duration decision).
 *
 *  1. groupSize 4–12 (masthead GROUP stat) — this tour only.
 *  2. Solar Boat museum removed from all three bodies (it moved to the GEM;
 *     the on-site Giza boat museum is gone — stale claim).
 *  3. Body "shape of the day" prose sections REMOVED; authored shapeOfDay
 *     {where,duration,character} takes over in the styled sidebar card.
 *  +  Duration corrected Full day ~8 hrs → Half day (durationHours 5 lands in
 *     the category "Half day" facet; labels say ~5–6 hrs; JA keeps its
 *     door-to-door 6–7 h framing). Owner-approved 2026-07-22.
 *  +  ES diacritics fixed in the closing line (exageración/allí/por qué).
 *
 * Backup of the full doc is written to backups/ before the patch.
 *   npx tsx scripts/fix-giza-group-tour.ts
 */
import { writeFileSync } from 'node:fs';

import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();

const ID = 'tour.pyramids-of-giza-and-sphinx-group-day-tour';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: 'production',
  apiVersion: '2024-12-01',
  useCdn: false,
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  perspective: 'raw',
});

type Span = { _type: string; text?: string; [k: string]: unknown };
type Block = { _key: string; children?: Span[]; [k: string]: unknown };
type LocaleBody = { _key: string; value: Block[] };

/** Replace an exact substring across a block's spans (single-span blocks here). */
function editBlock(blocks: Block[], key: string, from: string, to: string): void {
  const block = blocks.find((b) => b._key === key);
  if (!block?.children) throw new Error(`block ${key} not found`);
  const span = block.children.find((s) => typeof s.text === 'string' && s.text.includes(from));
  if (!span) throw new Error(`text not found in block ${key}: ${from.slice(0, 40)}…`);
  span.text = span.text!.replace(from, to);
}

const i18n = (en: string, es: string, ja: string) => [
  { _key: 'en', _type: 'internationalizedArrayStringValue', value: en },
  { _key: 'es', _type: 'internationalizedArrayStringValue', value: es },
  { _key: 'ja', _type: 'internationalizedArrayStringValue', value: ja },
];

async function main() {
  const doc = await client.getDocument(ID);
  if (!doc) throw new Error('doc not found');

  const stamp = new Date().toISOString().slice(0, 10);
  const backupPath = `backups/giza-group-tour-before-fix-${stamp}.json`;
  writeFileSync(backupPath, JSON.stringify(doc, null, 2));
  console.log('backup →', backupPath);

  const body = doc.body as LocaleBody[];
  const en = body.find((b) => b._key === 'en')!;
  const es = body.find((b) => b._key === 'es')!;
  const ja = body.find((b) => b._key === 'ja')!;

  // ── 2. Solar Boat removals ────────────────────────────────────────────────
  editBlock(
    en.value,
    '000000000013',
    'Optional inside-pyramid entry, camel or horse rides, and the Solar Boat museum are available',
    'Optional inside-pyramid entry and camel or horse rides are available',
  );
  editBlock(
    es.value,
    '000000000013',
    'La entrada al interior de las pirámides, los paseos en camello o caballo y el museo de la Barca Solar son opcionales, se contratan',
    'La entrada al interior de las pirámides y los paseos en camello o caballo son opcionales, se contratan',
  );
  editBlock(ja.value, '00000000001a', '内部入場や太陽の船博物館を組み込みたい', '内部入場を組み込みたい');

  // ── ES closing-line diacritics (was: exageracion / alli / por que) ────────
  editBlock(
    es.value,
    '00000000002b',
    'Guiza no necesita exageracion. Basta estar alli para entender por que sigue',
    'Guiza no necesita exageración. Basta estar allí para entender por qué sigue',
  );

  // ── 3. Remove the in-body "shape of the day" sections ────────────────────
  const drop = (lb: LocaleBody, keys: string[]) => {
    const before = lb.value.length;
    lb.value = lb.value.filter((b) => !keys.includes(b._key));
    if (lb.value.length !== before - keys.length) throw new Error(`drop mismatch for ${lb._key}`);
  };
  drop(en, ['00000000001d', '00000000001f', '000000000021', '000000000023']);
  drop(es, ['00000000001d', '00000000001f', '000000000021', '000000000023', '000000000025', '000000000029']);
  drop(ja, ['00000000000f', '000000000011', '000000000013', '000000000015']);

  // ── Patch (atomic) ────────────────────────────────────────────────────────
  await client
    .patch(ID)
    .set({
      body,
      durationHours: 5,
      durationLabel: i18n('Half day · ~5–6 hrs', 'Medio día · ~5–6 h', '半日・約6〜7時間'),
      groupSize: i18n('4–12 guests', '4–12 personas', '4〜12名'),
      shapeOfDay: {
        where: i18n(
          'Cairo → Giza Plateau (Khufu, Khafre and Menkaure pyramids, panorama viewpoint, Great Sphinx and valley temple) → Cairo',
          'El Cairo → meseta de Guiza (pirámides de Keops, Kefrén y Micerinos, mirador panorámico, Gran Esfinge y templo del valle) → El Cairo',
          'カイロ → ギザ高原（大ピラミッド／パノラマ・ポイント／カフラー王の河岸神殿／大スフィンクス） → カイロへ戻る',
        ),
        duration: i18n(
          'Half day · ≈5–6 hours',
          'Medio día · ≈5–6 horas',
          '半日（ドアtoドアでおよそ6〜7時間／高原滞在2〜3時間）',
        ),
        character: i18n(
          'Shared small-group departure (4–12) · licensed Egyptologist guide · air-conditioned vehicle · timed to reach the plateau before the coaches and the heat',
          'Salida compartida en grupo reducido (4–12) · guía egiptólogo colegiado · vehículo climatizado · caminatas sobre terreno irregular · llegada antes de los autocares y del calor',
          '乗合の小グループ出発（4〜12名）・冷房付き車両・ライセンスを持つエジプト学ガイド・午前の早めの到着で団体バスを避ける',
        ),
      },
    })
    .commit();

  console.log('patched', ID);

  // Read-back
  const check = await client.fetch(
    `*[_id == $id][0]{durationHours,
      "label": durationLabel[_key=="en"][0].value,
      "group": groupSize[_key=="en"][0].value,
      "shapeChar": shapeOfDay.character[_key=="en"][0].value,
      "solarMentions": count(body[].value[][pt::text(@) match "*Solar Boat*" || pt::text(@) match "*Barca Solar*" || pt::text(@) match "*太陽の船*"]),
      "enBlocks": count(body[_key=="en"][0].value), "esBlocks": count(body[_key=="es"][0].value), "jaBlocks": count(body[_key=="ja"][0].value)}`,
    { id: ID },
  );
  console.log('read-back:', JSON.stringify(check, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
