/**
 * One-off content fix: 9-Day Egypt Group Tour — Day 4 additions.
 *
 * On the return from Abu Simbel to Aswan, the group now visits the Temple of
 * Philae and takes a felucca across to Kitchener's Island and its botanical
 * garden, before boarding the Nile cruise (operator request 2026-06). This
 * re-introduces Philae — dropped from Day 3 — in its correct place.
 *
 * Per locale (EN/ES/JA):
 *   • Day 4 header  — add Philae
 *   • Day 4 "drive back to Aswan" paragraph — rewritten to add lunch + Philae + felucca/garden
 *   • INSERT a new paragraph after it — boarding the Nile cruise that evening
 *   • route-summary row — restore "Aswan (Philae)" on the return leg
 *
 * Block keys/marks preserved; the new paragraph gets a stable descriptive _key
 * ('d4-aswan-cruise') so the insert is idempotent.
 *
 * Usage:  tsx scripts/fix-9day-day4-philae-felucca.ts --dry-run
 *         tsx scripts/fix-9day-day4-philae-felucca.ts --commit
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();

const DOC_ID = 'tour.9-day-egypt-group-tour-cairo-abu-simbel-nile';
const NEW_KEY = 'd4-aswan-cruise';

interface Set { loc: 'en' | 'es' | 'ja'; block: string; child: number; label: string; text: string }
interface Ins { loc: 'en' | 'es' | 'ja'; after: string; key: string; text: string }

const SETS: Set[] = [
  // ── EN ──
  { loc: 'en', block: '000000000030', child: 0, label: 'D4 header',
    text: 'Day 4 — Abu Simbel at Sunrise, Philae, and the Nile Cruise' },
  { loc: 'en', block: '000000000034', child: 0, label: 'D4 drive back → Philae + felucca',
    text: "After the visit, the group drives back to Aswan, reaching the city around midday for lunch. The afternoon then turns to the sights the southern leg left no time for: first the Temple of Philae, dedicated to Isis and — like Abu Simbel — rescued from the rising Nile and rebuilt on its island, reached by a short motorboat across the water. Then a felucca, the Nile's traditional lateen-sailed boat, carries the group on the current across to Kitchener's Island and its botanical garden, planted with trees and shrubs gathered from across the tropics." },
  { loc: 'en', block: '000000000074', child: 0, label: 'route row',
    text: 'Where · Cairo → Aswan → Abu Simbel → Aswan (Philae) → Nile cruise (Kom Ombo / Edfu) → Luxor → Memphis / Saqqara / Dahshur → Cairo' },

  // ── ES ──
  { loc: 'es', block: '000000000032', child: 0, label: 'D4 header',
    text: 'Día 4 — Abu Simbel al amanecer, File y el crucero por el Nilo' },
  { loc: 'es', block: '000000000036', child: 0, label: 'D4 drive back → Philae + felucca',
    text: 'Tras la visita, el grupo conduce de regreso a Asuán, adonde llega hacia el mediodía para almorzar. La tarde se dedica entonces a lo que el tramo sur no dejó tiempo de ver: primero el Templo de File, consagrado a Isis y —como Abu Simbel— rescatado de las aguas del Nilo y reconstruido en su isla, al que se accede en una breve lancha. Después, una faluca —la embarcación tradicional del Nilo, de vela latina— lleva al grupo con la corriente hasta la isla de Kitchener y su jardín botánico, plantado con árboles y arbustos reunidos de todos los trópicos.' },
  { loc: 'es', block: '000000000076', child: 0, label: 'route row',
    text: 'Dónde · El Cairo → Asuán → Abu Simbel → Asuán (File) → Crucero por el Nilo (Kom Ombo / Edfu) → Luxor → Menfis / Saqqara / Dahshur → El Cairo' },

  // ── JA ──
  { loc: 'ja', block: '00000000002f', child: 0, label: 'D4 header',
    text: '4日目——日の出のアブ・シンベル、フィラエ神殿、そしてナイル川クルーズ' },
  { loc: 'ja', block: '000000000033', child: 0, label: 'D4 drive back → Philae + felucca',
    text: '見学後は専用車でアスワンへ戻り、昼ごろに到着して昼食をとります。午後は、南へ向かう道中では時間の取れなかった見どころへ。まずはイシス女神に捧げられたフィラエ神殿。アブ・シンベルと同じく、上昇するナイルの水から救い出され、中州の島に移築された神殿で、短いモーターボートで島へ渡ります。続いて、ナイル伝統の三角帆の小舟フェルッカに乗り、流れに運ばれてキッチナー島（植物園の島）へ。熱帯各地から集められた樹木や草花が植えられた庭園です。' },
  { loc: 'ja', block: '00000000006d', child: 0, label: 'route row',
    text: 'ルート · カイロ → アスワン → アブ・シンベル → アスワン（フィラエ） → ナイル川クルーズ（コム・オンボ／エドフ） → ルクソール → メンフィス／サッカラ／ダハシュール → カイロ' },
];

const INSERTS: Ins[] = [
  { loc: 'en', after: '000000000034', key: 'd4-aswan-cruise-en',
    text: 'In the early evening, the group boards the Nile cruise moored at Aswan and settles in as the river journey begins, with dinner served on board.' },
  { loc: 'es', after: '000000000036', key: 'd4-aswan-cruise-es',
    text: 'Al caer la tarde, el grupo embarca en el crucero por el Nilo, amarrado en Asuán, y se acomoda mientras comienza la travesía, con la cena servida a bordo.' },
  { loc: 'ja', after: '000000000033', key: 'd4-aswan-cruise', // already present from first run
    text: '夕方には、アスワンに停泊するナイル川クルーズ船に乗船。船旅の始まりに身を慣らしながら、夕食を船上でおとりください。' },
];

function newBlock(key: string, text: string) {
  return { _type: 'block', _key: key, style: 'normal', markDefs: [],
    children: [{ _type: 'span', _key: `${key}-s0`, text, marks: [] }] };
}

function getClient(): SanityClient {
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (dataset !== 'migration-staging') { process.stderr.write(`Refusing against dataset=${dataset}\n`); process.exit(2); }
  const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
  if (!token) { process.stderr.write('SANITY_STAGING_API_WRITE_TOKEN required\n'); process.exit(2); }
  return createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01', useCdn: false, token, perspective: 'raw' });
}

const setPath = (s: Set) => `body[_key=="${s.loc}"].value[_key=="${s.block}"].children[${s.child}].text`;
const readLeaf = (client: SanityClient, s: Set) => client.fetch<string | null>(
  `*[_id==$id][0].body[_key==$loc][0].value[_key==$block][0].children[$child].text`,
  { id: DOC_ID, loc: s.loc, block: s.block, child: s.child });
const readNew = (client: SanityClient, loc: string, key: string) => client.fetch<string | null>(
  `*[_id==$id][0].body[_key==$loc][0].value[_key==$nk][0].children[0].text`, { id: DOC_ID, loc, nk: key });

async function main() {
  const commit = process.argv.includes('--commit');
  const dryRun = process.argv.includes('--dry-run');
  if (commit === dryRun) { process.stderr.write('Pass exactly one of --dry-run or --commit.\n'); process.exit(2); }
  const client = getClient();
  console.log(`\n=== 9-day Day-4 Philae + felucca — ${commit ? 'COMMIT' : 'dry-run'} ===\n`);

  let ok = true;
  for (const s of SETS) {
    const cur = await readLeaf(client, s);
    if (cur == null) ok = false;
    console.log(`[${s.loc}] SET ${s.label} (${s.block})  ${cur == null ? '✗ NOT FOUND' : 'ok'}`);
    console.log(`    - was: ${cur == null ? '—' : JSON.stringify(String(cur).slice(0, 64))}`);
    console.log(`    + new: ${JSON.stringify(s.text.slice(0, 64))}`);
  }
  for (const i of INSERTS) {
    const anchor = await client.fetch<string | null>(
      `*[_id==$id][0].body[_key==$loc][0].value[_key==$b][0]._key`, { id: DOC_ID, loc: i.loc, b: i.after });
    const already = await readNew(client, i.loc, i.key);
    if (anchor == null) ok = false;
    console.log(`[${i.loc}] INSERT after ${i.after} (key ${i.key})  ${anchor == null ? '✗ ANCHOR NOT FOUND' : (already ? '· already present (will skip)' : 'ok')}`);
    console.log(`    + new: ${JSON.stringify(i.text.slice(0, 64))}`);
  }
  if (!ok) { console.log('\nA path did not resolve — aborting.'); process.exit(1); }
  if (dryRun) { console.log('\nDry-run — no writes.'); return; }

  // All SETS can share one patch. Each INSERT must be its own patch — a single
  // Sanity patch holds only one insert op (chaining .insert() overwrites it).
  let setTx = client.patch(DOC_ID);
  for (const s of SETS) setTx = setTx.set({ [setPath(s)]: s.text });
  await setTx.commit({ visibility: 'sync' });
  for (const i of INSERTS) {
    const already = await readNew(client, i.loc, i.key);
    if (already) { console.log(`  · ${i.loc} insert already present — skip`); continue; }
    await client.patch(DOC_ID)
      .insert('after', `body[_key=="${i.loc}"].value[_key=="${i.after}"]`, [newBlock(i.key, i.text)])
      .commit({ visibility: 'sync' });
    console.log(`  ✓ ${i.loc} insert committed`);
  }
  console.log(`\n✓ Committed.`);

  let v = 0;
  for (const s of SETS) if ((await readLeaf(client, s)) === s.text) v++;
  let ni = 0;
  for (const i of INSERTS) if ((await readNew(client, i.loc, i.key)) === i.text) ni++;
  console.log(`✓ Verified ${v}/${SETS.length} sets and ${ni}/${INSERTS.length} inserts.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
