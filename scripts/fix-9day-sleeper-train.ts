/**
 * One-off content fix: 9-Day Egypt Group Tour — Day 2/3 transport correction.
 *
 * Change: instead of flying to Aswan on Day 3, the group boards the overnight
 * sleeper train at Giza Station on the evening of Day 2, sleeps on board, reaches
 * Aswan on the morning of Day 3, and drives straight from the station to Abu
 * Simbel. The Temple of Philae stop is dropped (operator decision 2026-06).
 *
 * Edits the EN/ES/JA `body` arrays in place by setting only the affected text
 * leaves (block keys, marks and all other blocks preserved). Idempotent.
 *
 * Usage:  tsx scripts/fix-9day-sleeper-train.ts --dry-run
 *         tsx scripts/fix-9day-sleeper-train.ts --commit
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();

const DOC_ID = 'tour.9-day-egypt-group-tour-cairo-abu-simbel-nile';

interface Edit { loc: 'en' | 'es' | 'ja'; block: string; child: number; label: string; text: string }

const EDITS: Edit[] = [
  // ── EN ──────────────────────────────────────────────────────────────────
  { loc: 'en', block: '000000000018', child: 0, label: 'D2 header',
    text: 'Day 2 — Giza, the Grand Egyptian Museum, and the Night Train to Aswan' },
  { loc: 'en', block: '00000000001c', child: 0, label: 'D2 afternoon → board train',
    text: "The afternoon crosses to the Grand Egyptian Museum, which stands beside the plateau and opened fully on 1 November 2025. This is where the complete Tutankhamun collection now lives — the gold mask, the nested coffins, the gilded shrines, displayed together for the first time. Having seen the older Tahrir museum's broad collection yesterday, the contrast lands: the same civilisation, told once through its accumulated depth and once through its single most famous tomb. In the early evening, the group transfers to Giza Station to board the overnight sleeper train to Aswan, with dinner served on board as the train heads south." },
  { loc: 'en', block: '000000000021', child: 3, label: 'D2 overnight',
    text: ' Sleeper train to Aswan' },
  { loc: 'en', block: '000000000023', child: 0, label: 'D3 header',
    text: 'Day 3 — Arrival in Aswan and the Drive to Abu Simbel' },
  { loc: 'en', block: '000000000025', child: 0, label: 'D3 arrival line',
    text: 'The sleeper train reaches Aswan in the morning.' },
  { loc: 'en', block: '000000000027', child: 0, label: 'D3 drive to Abu Simbel',
    text: 'Breakfast is served on board as the train completes its run. From Aswan station, the group sets out by private vehicle for Abu Simbel — around three and a half to four hours south along the shore of Lake Nasser, through open Nubian desert.' },
  { loc: 'en', block: '000000000074', child: 0, label: 'route row',
    text: 'Where · Cairo → Aswan → Abu Simbel → Nile cruise (Kom Ombo / Edfu) → Luxor → Memphis / Saqqara / Dahshur → Cairo' },

  // ── ES ──────────────────────────────────────────────────────────────────
  { loc: 'es', block: '00000000001a', child: 0, label: 'D2 header',
    text: 'Día 2 — Guiza, el Gran Museo Egipcio y el tren nocturno a Asuán' },
  { loc: 'es', block: '00000000001e', child: 0, label: 'D2 afternoon → board train',
    text: 'Por la tarde se cruza al Gran Museo Egipcio, que se levanta junto a la meseta y abrió completamente el 1 de noviembre de 2025. Aquí vive ahora la colección íntegra de Tutankamón —la máscara de oro, los sarcófagos encajados, las capillas doradas— expuesta toda junta por primera vez. Después de haber visto ayer la colección amplia del museo de Tahrir, el contraste resuena: una misma civilización contada una vez por su profundidad acumulada y otra por su tumba más célebre. Al caer la tarde, el grupo se traslada a la estación de Guiza para tomar el tren nocturno con literas rumbo a Asuán; la cena se sirve a bordo mientras el tren avanza hacia el sur.' },
  { loc: 'es', block: '000000000023', child: 3, label: 'D2 overnight',
    text: ' Tren nocturno a Asuán' },
  { loc: 'es', block: '000000000025', child: 0, label: 'D3 header',
    text: 'Día 3 — Llegada a Asuán y traslado a Abu Simbel' },
  { loc: 'es', block: '000000000027', child: 0, label: 'D3 arrival line',
    text: 'El tren nocturno llega a Asuán a primera hora de la mañana.' },
  { loc: 'es', block: '000000000029', child: 0, label: 'D3 drive to Abu Simbel',
    text: 'Tras el desayuno a bordo, el grupo sale directamente desde la estación de Asuán y conduce hacia el sur, hasta Abu Simbel —unas tres horas y media a cuatro horas siguiendo la orilla del lago Nasser, a través del desierto abierto de Nubia.' },
  { loc: 'es', block: '000000000076', child: 0, label: 'route row',
    text: 'Dónde · El Cairo → Asuán → Abu Simbel → Crucero por el Nilo (Kom Ombo / Edfu) → Luxor → Menfis / Saqqara / Dahshur → El Cairo' },

  // ── JA ──────────────────────────────────────────────────────────────────
  { loc: 'ja', block: '000000000019', child: 0, label: 'D2 header',
    text: '2日目——ギザ、大エジプト博物館、そしてアスワンへの夜行列車' },
  { loc: 'ja', block: '00000000001d', child: 0, label: 'D2 afternoon → board train',
    text: '午後は、台地のすぐ隣に立つ大エジプト博物館（GEM）へ。2025年11月1日に全面開館したこの博物館は、いまやツタンカーメンのコレクション一式——黄金のマスク、入れ子の棺、金箔の厨子——が初めて一堂に会する場所です。前日にタハリールの博物館で文明全体の厚みに触れたあとだからこそ、その対比が際立ちます。同じ文明を、一方では積み重なった奥行きで、もう一方では最も名高い一つの墓で語る——その両面です。夕方にはギザ駅へ移動し、アスワン行きの夜行寝台列車に乗車します。列車が南へ進むあいだ、車内で夕食をおとりください。' },
  { loc: 'ja', block: '000000000021', child: 2, label: 'D2 overnight',
    text: '宿泊：夜行寝台列車（アスワンへ）' },
  { loc: 'ja', block: '000000000023', child: 0, label: 'D3 header',
    text: '3日目——アスワン到着とアブ・シンベルへのドライブ' },
  { loc: 'ja', block: '000000000025', child: 0, label: 'D3 arrival line',
    text: '夜行列車は早朝にアスワンに到着します。' },
  { loc: 'ja', block: '000000000027', child: 0, label: 'D3 drive to Abu Simbel',
    text: '車内で朝食をとったのち、アスワン駅からそのまま専用車でアブ・シンベルへ向かいます。ナセル湖の岸沿いに、開けたヌビアの砂漠を南へ約3時間半〜4時間のドライブです。' },
  { loc: 'ja', block: '00000000006d', child: 0, label: 'route row',
    text: 'ルート · カイロ → アスワン → アブ・シンベル → ナイル川クルーズ（コム・オンボ／エドフ） → ルクソール → メンフィス／サッカラ／ダハシュール → カイロ' },
];

function getClient(): SanityClient {
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (dataset !== 'migration-staging') { process.stderr.write(`Refusing against dataset=${dataset}\n`); process.exit(2); }
  const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
  if (!token) { process.stderr.write('SANITY_STAGING_API_WRITE_TOKEN required\n'); process.exit(2); }
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
    useCdn: false, token, perspective: 'raw',
  });
}

const pathOf = (e: Edit) => `body[_key=="${e.loc}"].value[_key=="${e.block}"].children[${e.child}].text`;

async function readCurrent(client: SanityClient, e: Edit): Promise<string | null> {
  return client.fetch(
    `*[_id==$id][0].body[_key==$loc][0].value[_key==$block][0].children[$child].text`,
    { id: DOC_ID, loc: e.loc, block: e.block, child: e.child },
  );
}

async function main() {
  const commit = process.argv.includes('--commit');
  const dryRun = process.argv.includes('--dry-run');
  if (commit === dryRun) { process.stderr.write('Pass exactly one of --dry-run or --commit.\n'); process.exit(2); }

  const client = getClient();
  console.log(`\n=== 9-day sleeper-train fix — ${commit ? 'COMMIT' : 'dry-run'} ===\n`);

  // Validate every path resolves to a real leaf before touching anything.
  let ok = true;
  for (const e of EDITS) {
    const cur = await readCurrent(client, e);
    const status = cur == null ? '✗ PATH NOT FOUND' : 'ok';
    if (cur == null) ok = false;
    console.log(`[${e.loc}] ${e.label}  (${e.block}.children[${e.child}])  ${status}`);
    console.log(`    - was: ${cur == null ? '—' : JSON.stringify(String(cur).slice(0, 70))}`);
    console.log(`    + new: ${JSON.stringify(e.text.slice(0, 70))}`);
  }
  if (!ok) { console.log('\nOne or more paths did not resolve — aborting, no writes.'); process.exit(1); }

  if (dryRun) { console.log('\nDry-run — no writes.'); return; }

  let tx = client.patch(DOC_ID);
  for (const e of EDITS) tx = tx.set({ [pathOf(e)]: e.text });
  await tx.commit({ visibility: 'sync' });
  console.log(`\n✓ Committed ${EDITS.length} text edits.`);

  // Verify
  let verified = 0;
  for (const e of EDITS) {
    const cur = await readCurrent(client, e);
    if (cur === e.text) verified++;
    else console.log(`  ! mismatch [${e.loc}] ${e.label}: ${JSON.stringify(String(cur).slice(0, 60))}`);
  }
  console.log(`✓ Verified ${verified}/${EDITS.length} edits match.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
