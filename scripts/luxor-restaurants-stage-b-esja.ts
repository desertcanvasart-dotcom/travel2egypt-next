/**
 * Luxor "Top Restaurants" (wp-page-60657) — STAGE B (ES + JA): replace the
 * summary/standfirst + 18 restaurant descriptions + 3 Additional-Dining
 * bullets + the Note with owner-authored LOCKED copy, read VERBATIM from the
 * owner .md artifacts (no re-typing of ES/JA prose).
 *
 * Link handling (per artifacts):
 *   ES: relocate the Luxor Temple internal link from Nile Valley (Stage A) to
 *       As-Sahaby ("Templo de Luxor"); Nile Valley becomes plain.
 *   JA: add the internal link on As-Sahaby ("ルクソール神殿"). Luxor Temple guide
 *       has a JA doc (rukusoru-shinden) so it resolves.
 * Section headings are NOT touched (flagged for owner separately).
 *
 * Each target block guarded by a legacy substring so a mismatch aborts.
 * Gated: DRY RUN default (prints every extracted string); APPLY=1 stages
 * drafts.<id> + snapshot; never publishes; refuses if a draft exists (FORCE=1).
 *
 * Run (dry):    npx tsx scripts/luxor-restaurants-stage-b-esja.ts
 * Run (stage):  APPLY=1 npx tsx scripts/luxor-restaurants-stage-b-esja.ts
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
loadEnv();

const ID = 'wp-page-60657';
const LUXOR_TEMPLE = 'guideArticle.luxor.the-luxor-temple';
const ES_MD = '/Users/islamhussein/Desktop/0/luxor-restaurants-stage-b-copy-es.md';
const JA_MD = '/Users/islamhussein/Desktop/0/luxor-restaurants-stage-b-copy-ja.md';
const APPLY = process.env.APPLY === '1';
const FORCE = process.env.FORCE === '1';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
if (dataset !== 'production') throw new Error(`Refusing to run against "${dataset}".`);
const token = (APPLY ? process.env.SANITY_PRODUCTION_API_WRITE_TOKEN : undefined) ||
  process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
if (APPLY && !process.env.SANITY_PRODUCTION_API_WRITE_TOKEN) { console.error('APPLY=1 needs SANITY_PRODUCTION_API_WRITE_TOKEN'); process.exit(1); }
const client = createClient({ projectId: 'ufallvd2', dataset, apiVersion: '2024-12-01', token, useCdn: false });

type Loc = 'es' | 'ja';

// name (as bolded in the .md)  ->  { blockKey, legacy-guard } per locale
const MAP: Record<string, Record<Loc, { k: string; g: string }>> = {
  'Sofra': { es: { k: '00000000000d', g: 'auténtica experiencia egipcia te espera' }, ja: { k: '000000000009', g: '伝統的な家屋を改装した' } },
  'Oasis Café': { es: { k: '000000000011', g: 'café relajado conocido por sus platos' }, ja: { k: '00000000000d', g: 'パスタやグリル料理などのインターナショナル' } },
  'As-Sahaby Lane': { es: { k: '000000000015', g: 'Situado cerca del Templo de Luxor' }, ja: { k: '000000000011', g: 'ルクソール神殿近くにある' } },
  'Salah Al-Deen': { es: { k: '000000000019', g: 'banquetes egipcios servidos al estilo familiar' }, ja: { k: '000000000015', g: 'エジプト伝統料理を大皿で提供する' } },
  'Silk Road': { es: { k: '00000000001d', g: 'Ubicado en el Hotel Hilton' }, ja: { k: '00000000001b', g: 'ヒルトン・ホテル内にある高級アジアン' } },
  'Puddleduck': { es: { k: '000000000021', g: 'acogedor restaurante favorito de los expatriados' }, ja: { k: '00000000001f', g: 'イギリスやヨーロッパの家庭料理' } },
  "Gerda's Garden": { es: { k: '000000000028', g: 'pintoresco bistró que fusiona cocina egipcia' }, ja: { k: '000000000025', g: 'カルナック地区にある小さなビストロ' } },
  'Jewel of the Nile': { es: { k: '00000000002c', g: 'restaurante familiar ofrece una mezcla de clásicos' }, ja: { k: '000000000029', g: '家族連れにも人気のレストラン' } },
  'La Mama': { es: { k: '000000000030', g: 'Situado en el Hotel Sheraton' }, ja: { k: '00000000002d', g: 'シェラトン・ホテル内にあるレトロ' } },
  '1886 Restaurant': { es: { k: '000000000037', g: 'Dentro del icónico Hotel Old Winter Palace' }, ja: { k: '000000000031', g: 'オールド・ウィンター・パレス・ホテル内にある格式ある' } },
  'A Taste of India': { es: { k: '00000000003b', g: 'Ubicado en la zona de St. Joseph' }, ja: { k: '000000000035', g: 'セント・ジョセフ地区に位置し' } },
  'Abu Ashraf': { es: { k: '00000000003f', g: 'popular entre los locales por su pollo asado' }, ja: { k: '000000000039', g: 'ローストチキン、ピザ、コシャリが人気' } },
  'Koshari Elzaeem': { es: { k: '000000000043', g: 'Especializado en kushari' }, ja: { k: '00000000003d', g: 'エジプトの国民食「コシャリ」の専門店' } },
  'Al-Moudira': { es: { k: '000000000049', g: 'Con un ambiente romántico, Al-Moudira' }, ja: { k: '000000000043', g: 'ロマンチックな空間で、地中海料理' } },
  'Restaurant Mohammed': { es: { k: '00000000004d', g: 'restaurante familiar con terraza al aire libre' }, ja: { k: '000000000047', g: '家族経営のレストランで、テラス席' } },
  'Nile Valley Hotel': { es: { k: '000000000054', g: 'vistas panorámicas del Nilo y el Templo de Luxor' }, ja: { k: '00000000004b', g: 'ナイル川とルクソール神殿を見渡せる' } },
  'Al-Gezira Hotel': { es: { k: '000000000058', g: 'molokhiyya y mahshi kurumb' }, ja: { k: '00000000004f', g: 'モロヘイヤやマハシ' } },
  'Memnon': { es: { k: '00000000005c', g: 'fusión única de cocina india y china' }, ja: { k: '000000000053', g: 'インド料理と中華料理を融合した' } },
};
const BULLETS: Record<Loc, { k: string; g: string }[]> = {
  es: [{ k: '000000000061', g: 'Souq de frutas y verduras' }, { k: '000000000064', g: 'Arkwrights Gourmet Food' }, { k: '000000000067', g: 'Comida económica' }],
  ja: [{ k: '000000000058', g: '新鮮な果物や野菜' }, { k: '00000000005b', g: 'ピクニック用品や輸入食品' }, { k: '00000000005e', g: 'パン屋や地元の食堂' }],
};
const NOTE: Record<Loc, { k: string; g: string }> = {
  es: { k: '00000000006b', g: 'no sirven alcohol ni aceptan' },
  ja: { k: '000000000062', g: 'アルコールの提供がなく' },
};
const AS_SAHABY_KEY: Record<Loc, string> = { es: '000000000015', ja: '000000000011' };

// ── .md parser ───────────────────────────────────────────────────────────
function parseCopy(md: string, sep: string) {
  const lines = md.split('\n');
  const join = (arr: string[]) => arr.map((l) => l.trim()).join(sep).replace(/\s+/g, (m) => (sep === ' ' ? ' ' : m)).trim();
  const isStop = (l: string) => l.trim() === '' || /^#/.test(l) || /^---/.test(l) || /^\s*-\s/.test(l) || /^\*\*/.test(l);

  const entries = new Map<string, string>();
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\*\*(.+?)\*\*\s*$/);
    if (!m) continue;
    const buf: string[] = [];
    for (let j = i + 1; j < lines.length && !isStop(lines[j]); j++) buf.push(lines[j]);
    entries.set(m[1], join(buf));
  }

  const paraAfterHeading = (re: RegExp): string => {
    const h = lines.findIndex((l) => re.test(l));
    if (h < 0) return '';
    let j = h + 1; while (j < lines.length && lines[j].trim() !== '') j++; // skip heading+continuation
    while (j < lines.length && lines[j].trim() === '') j++;
    const buf: string[] = [];
    for (; j < lines.length && lines[j].trim() !== '' && !/^---/.test(lines[j]); j++) buf.push(lines[j]);
    return join(buf);
  };
  const standfirst = paraAfterHeading(/^##\s+(Standfirst|Meta \/ standfirst)/);
  const note = paraAfterHeading(/^##\s+Note\b/);

  const bh = lines.findIndex((l) => /^##\s+Additional Dining/.test(l));
  const bullets: string[] = [];
  for (let j = bh + 1; j < lines.length; j++) {
    if (/^---/.test(lines[j]) || /^##\s/.test(lines[j])) break;
    if (lines[j].trim() === '') continue;
    if (/^\s*-\s+/.test(lines[j])) bullets.push(lines[j].replace(/^\s*-\s+/, '').trim());
    else if (bullets.length) bullets[bullets.length - 1] = join([bullets[bullets.length - 1], lines[j]]);
  }
  return { standfirst, note, bullets, entries };
}

const blockText = (b: any) => (b.children ?? []).map((s: any) => s.text ?? '').join('');
const span = (key: string, text: string, marks: string[] = []) => ({ _type: 'span', _key: key, text, marks });

async function main() {
  const copy: Record<Loc, ReturnType<typeof parseCopy>> = {
    es: parseCopy(readFileSync(ES_MD, 'utf8'), ' '),
    ja: parseCopy(readFileSync(JA_MD, 'utf8'), ''),
  };
  // parse sanity checks
  for (const loc of ['es', 'ja'] as Loc[]) {
    const c = copy[loc];
    const miss = Object.keys(MAP).filter((n) => !c.entries.get(n));
    if (miss.length) throw new Error(`[${loc}] missing entries in .md: ${miss.join(', ')}`);
    if (c.bullets.length !== 3) throw new Error(`[${loc}] expected 3 bullets, got ${c.bullets.length}`);
    if (!c.standfirst || !c.note) throw new Error(`[${loc}] standfirst/note not parsed`);
    for (const [n, t] of c.entries) if (t.includes('⟨') && n !== 'As-Sahaby Lane') throw new Error(`[${loc}] stray ⟨⟩ in ${n}`);
  }

  const pub: any = await client.getDocument(ID);
  const draft: any = await client.getDocument(`drafts.${ID}`);
  if (draft && !FORCE) { console.error(`drafts.${ID} exists — FORCE=1 to override.`); process.exit(1); }
  const doc = JSON.parse(JSON.stringify(pub));
  const fail: string[] = []; const log: string[] = [];

  for (const loc of ['es', 'ja'] as Loc[]) {
    const c = copy[loc];
    const sum = (doc.summary ?? []).find((e: any) => e._key === loc);
    if (!sum) fail.push(`[${loc}] summary missing`);
    else { sum.value = c.standfirst; log.push(`[${loc}] SUMMARY (${c.standfirst.length} chars): ${c.standfirst.slice(0, 60)}…`); }

    const body = (doc.body ?? []).find((e: any) => e._key === loc);
    const byKey = new Map<string, any>(body.value.map((b: any) => [b._key, b]));
    const put = (key: string, guard: string, newText: string, label: string) => {
      const b = byKey.get(key);
      if (!b) { fail.push(`[${loc}] ${label} block ${key} MISSING`); return; }
      if (!blockText(b).includes(guard)) { fail.push(`[${loc}] ${label} ${key} guard "${guard}" not found (got "${blockText(b).slice(0, 30)}…")`); return; }
      b.children = [span(`${key}s0`, newText)];
      b.markDefs = [];
      log.push(`[${loc}] ${label} ${key}: ${newText.slice(0, 56)}…`);
    };

    for (const [name, per] of Object.entries(MAP)) {
      const { k, g } = per[loc];
      const text = c.entries.get(name)!;
      if (name === 'As-Sahaby Lane') {
        const b = byKey.get(k);
        const parts = text.split(/⟨(.+?)⟩/); // [pre, anchor, post]
        if (parts.length !== 3) { fail.push(`[${loc}] As-Sahaby anchor split failed`); continue; }
        if (!b || !blockText(b).includes(g)) { fail.push(`[${loc}] As-Sahaby guard fail`); continue; }
        const mk = `${k}lt`;
        b.markDefs = [{ _key: mk, _type: 'internalLink', reference: { _ref: LUXOR_TEMPLE, _type: 'reference' } }];
        b.children = [span(`${k}s0`, parts[0]), span(`${k}s1`, parts[1], [mk]), span(`${k}s2`, parts[2])];
        log.push(`[${loc}] As-Sahaby ${k}: link⟨${parts[1]}⟩ + prose`);
      } else {
        put(k, g, text, name);
      }
    }
    c.bullets.forEach((t, i) => put(BULLETS[loc][i].k, BULLETS[loc][i].g, t, `bullet${i + 1}`));
    put(NOTE[loc].k, NOTE[loc].g, c.note, 'Note');
  }

  console.log(`\n=== ${APPLY ? 'APPLY (staging draft)' : 'DRY RUN'} — ${ID} STAGE B (ES+JA) ===`);
  console.log(log.join('\n'));
  if (fail.length) { console.error(`\n✗ ${fail.length} GUARD FAILURES — aborting:\n  ` + fail.join('\n  ')); process.exit(1); }

  if (!APPLY) { console.log('\nDRY RUN — set APPLY=1 to stage.'); return; }
  mkdirSync('backups', { recursive: true });
  writeFileSync('backups/luxor-restaurants-stage-b-esja-rollback.json', JSON.stringify(pub, null, 2));
  await client.createOrReplace({ ...doc, _id: `drafts.${ID}` });
  console.log(`\n✓ staged drafts.${ID}. Snapshot: backups/luxor-restaurants-stage-b-esja-rollback.json (NOT published)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
