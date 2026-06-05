/**
 * Fill missing es/ja for tour TITLES (8) and the 3 clean package SUMMARIES that
 * were coalescing to English on the listing pages. Preserves existing locale
 * values; only fills the missing one(s). EN untouched.
 *
 * NOTE: ~25 other tour summaries are truncated/low-quality WP imports (broken
 * mid-sentence EN). Those are intentionally NOT translated here — they need an
 * EN content-repair pass first; see reports/tour-i18n-flagged-summaries.md.
 *
 * migration-staging. Dry-run by default; --commit to write.
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

// id → { title?: {es?, ja?}, summary?: {es?, ja?} }  (only the missing locales)
const T: Record<string, { title?: Partial<Record<'es' | 'ja', string>>; summary?: Partial<Record<'es' | 'ja', string>> }> = {
  'tour.10-day-egypt-group-tour-cairo-nile-red-sea': {
    title: { ja: '10日間エジプト・グループツアー：カイロ、ナイル、紅海' },
    summary: { ja: 'バランスのとれた10日間のグループの旅。カイロの博物館とモスク、アスワンからルクソールまで3泊のナイル川クルーズ、そしてハルガダの紅海。' },
  },
  'tour.11-day-egypt-group-tour-cairo-red-sea-nile': {
    title: { ja: '11日間エジプト・グループツアー：カイロ、紅海、ナイル' },
    summary: { ja: '大西洋を越えて訪れる旅行者のための、ゆとりある11日間のグループの旅。カイロでゆっくりと始め、早めに紅海でひと休みし、アスワンまで4泊のナイル川クルーズを存分に。' },
  },
  'tour.9-day-egypt-group-tour-cairo-abu-simbel-nile': {
    title: { ja: '9日間エジプト・グループツアー：カイロ、アブ・シンベル、ナイル' },
    summary: { ja: 'カイロからナイルへと巡る、落ち着いた9日間のグループの旅。アブ・シンベルでは珍しい一泊を取り、音と光のショーと日の出の神殿を。' },
  },
  'wp-page-158052': { title: { es: 'Viajes a Egipto desde el Reino Unido' } },
  'wp-page-238357': { title: { es: '5 días – Edición romántica: El Cairo y Luxor', ja: '5日間 – カイロ＆ルクソール ロマンス・エディション' } },
  'wp-page-238371': { title: { es: 'Viaje de amor por el Nilo — Luxor y Asuán', ja: 'ナイル・ラブ・ジャーニー — ルクソールとアスワン' } },
  'wp-page-238461': { title: { es: '3 días – Lo mejor de El Cairo para amigos', ja: '3日間 – 友だちと巡るカイロのハイライト' } },
  'wp-page-238546': { title: { es: 'El Cairo en 3 días — Edición experta (viajero en solitario)', ja: '3日間で巡るカイロ — インサイダー・エディション（おひとり旅）' } },
};

const merge = (existing: Array<{ _key: string; value: string }> | null, fill: Partial<Record<'es' | 'ja', string>>) => {
  const byKey = new Map((existing ?? []).map((e) => [e._key, e.value]));
  for (const [k, v] of Object.entries(fill)) if (!byKey.has(k)) byKey.set(k, v!);
  const order = ['en', 'es', 'ja'];
  return [...byKey.entries()]
    .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
    .map(([_key, value]) => ({ _key, _type: 'object', value }));
};

async function main() {
  console.log(`seed-tour-title-summary-i18n — ${COMMIT ? 'COMMIT' : 'DRY RUN'} — dataset=${client.config().dataset}\n`);
  let n = 0;
  for (const [id, spec] of Object.entries(T)) {
    const cur = await client.fetch<{ title?: any[]; summary?: any[] } | null>(`*[_id==$id][0]{ title, summary }`, { id });
    if (!cur) { console.warn(`  ! ${id} not found`); continue; }
    const set: Record<string, unknown> = {};
    if (spec.title) set.title = merge(cur.title ?? null, spec.title);
    if (spec.summary) set.summary = merge(cur.summary ?? null, spec.summary);
    const fields = Object.keys(set).join('+');
    console.log(`  ${COMMIT ? '✓' : '·'} ${id} (${fields})`);
    if (COMMIT) await client.patch(id).set(set).commit({ autoGenerateArrayKeys: false });
    n++;
  }
  console.log(`\n${n} tours ${COMMIT ? 'patched' : 'previewed'}. ${COMMIT ? 'DONE.' : 'Re-run with --commit.'}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
