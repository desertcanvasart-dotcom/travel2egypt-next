/**
 * Solar Boat stale-claim fix — 8 tours, all 3 locales (owner-approved 2026-07-29,
 * from docs/solar-boat-triage-2026-07-29.csv "fix all 8 tours").
 *
 * The Khufu Solar Boat moved to the Grand Egyptian Museum (Aug 2021); the
 * on-site Giza boat museum was dismantled. Treatment per triage:
 *  - Descriptive itinerary prose: rewrite the sentence to keep the boat's
 *    story and place it at the GEM (all 8 tours already reference the GEM
 *    or its collections elsewhere).
 *  - wp-page-86851 (no GEM stop in itinerary): REMOVE the museum sentence +
 *    the "and Solar Boat" route-line entries (Giza group-tour precedent).
 *  - wp-page-89602 (legacy marketing copy): remove the "visit the Solar Boat
 *    Museum" stop from day-4 lines (tour visits the GEM on day 9).
 *  - wp-page-89619: published version ONLY — the owner's WIP draft is a full
 *    rewrite and is NOT touched (its own stale mention reported separately).
 *
 * Mechanics: span-level text replacement addressed by _key paths; each edit
 * must match exactly one span corpus-wide or the run aborts. Full-doc
 * backups before writing. Usage: node <script> [--apply]
 */
const fs = require('fs');
const { createClient } = require('@sanity/client');
require('dotenv').config();

const APPLY = process.argv.includes('--apply');
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2024-12-01',
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN,
  useCdn: false,
});

// Text edits: old strings copied verbatim from production blocks (2026-07-29
// dump). Apostrophes written as ’ but matched tolerantly against ' too; the
// replacement adopts whichever style the matched span actually uses.
const EDITS = [
  // ── tour.8-days-best-of-egypt-tour-package (block 00000000000d) ──
  {
    id: 'tour.8-days-best-of-egypt-tour-package', blockKey: '00000000000d',
    old: 'The Solar Boat Museum holds one of the cedar vessels buried beside Khufu’s pyramid — dismantled into 1,224 pieces, recovered intact, and reassembled in a purpose-built gallery beside the pyramid.',
    new: 'One of the cedar solar boats buried beside Khufu’s pyramid — dismantled into 1,224 pieces, recovered intact, and reassembled — is now displayed in its own gallery at the Grand Egyptian Museum on the edge of the plateau.',
  },
  {
    id: 'tour.8-days-best-of-egypt-tour-package', blockKey: '00000000000d',
    old: 'El Museo de la Barca Solar conserva uno de los buques de cedro enterrados junto a la pirámide de Keops —desmontado en 1224 piezas, recuperado intacto y reensamblado en una galería construida a propósito junto a la pirámide.',
    new: 'Uno de los buques de cedro enterrados junto a la pirámide de Keops —desmontado en 1224 piezas, recuperado intacto y reensamblado— se exhibe ahora en una galería propia del Gran Museo Egipcio, al borde de la meseta.',
  },
  {
    id: 'tour.8-days-best-of-egypt-tour-package', blockKey: '00000000000d',
    old: '太陽の船博物館にはクフ王のピラミッドのそばに埋められた杉の船一隻——1,224の部材に解体され、無傷で発見され、専用ギャラリーで再組立てされた船——が収まっています。',
    new: 'クフ王のピラミッドのそばに埋められた杉の船一隻——1,224の部材に解体され、無傷で発見され、再組立てされた船——は、いまはギザ台地の縁の大エジプト博物館の専用ギャラリーに収まっています。',
  },
  // ── wp-page-86851 Elegant Cairo: removal (no GEM stop in this itinerary) ──
  {
    id: 'wp-page-86851', blockKey: '000000000015',
    old: ' The Solar Boat Museum, beside the Great Pyramid, holds the reconstructed cedar vessel buried beside Khufu around 2500 BC — one of the oldest intact ships in existence.',
    new: '',
  },
  {
    id: 'wp-page-86851', blockKey: '000000000015',
    old: ' El Museo de la Barca Solar, junto a la Gran Pirámide, alberga la embarcación de cedro reconstruida enterrada al lado de Keops hacia el 2500 a. C. — uno de los barcos intactos más antiguos que existen.',
    new: '',
  },
  {
    id: 'wp-page-86851', blockKey: '000000000015',
    old: '大ピラミッドのすぐ脇にある太陽の船博物館には、紀元前2500年頃にクフ王の傍らに埋葬された、復元された杉材の船——現存最古級の無傷の船舶——が収められています。',
    new: '',
  },
  { id: 'wp-page-86851', blockKey: '000000000027', old: 'Giza plateau and Solar Boat', new: 'Giza plateau' },
  { id: 'wp-page-86851', blockKey: '000000000027', old: 'meseta de Guiza y Barca Solar', new: 'meseta de Guiza' },
  { id: 'wp-page-86851', blockKey: '000000000027', old: 'ギザ高原と太陽の船博物館', new: 'ギザ高原' },
  // ── wp-page-89015 Love on the Nile (block 000000000033) ──
  {
    id: 'wp-page-89015', blockKey: '000000000033',
    old: 'The Solar Boat Museum houses a funerary barque discovered dismantled in a pit at the base of Khufu’s pyramid in 1954 — reassembled, it is 43 metres long, made of Lebanese cedar, and remarkably intact after 4,500 years.',
    new: 'The funerary barque discovered dismantled in a pit at the base of Khufu’s pyramid in 1954 — 43 metres long, made of Lebanese cedar, and remarkably intact after 4,500 years — is now reassembled at the Grand Egyptian Museum on the edge of the plateau.',
  },
  {
    id: 'wp-page-89015', blockKey: '000000000033',
    old: 'El Museo de la Barca Solar alberga una barca funeraria descubierta desmontada en una fosa en la base de la pirámide de Keops en 1954 —reensamblada, mide 43 metros de largo, está hecha de cedro libanés y es notablemente íntegra después de 4500 años—.',
    new: 'La barca funeraria descubierta desmontada en una fosa en la base de la pirámide de Keops en 1954 —de 43 metros de largo, hecha de cedro libanés y notablemente íntegra después de 4500 años— se exhibe hoy reensamblada en el Gran Museo Egipcio, al borde de la meseta.',
  },
  {
    id: 'wp-page-89015', blockKey: '000000000033',
    old: '太陽の船博物館は、1954年にクフ王ピラミッド基部のピットで解体状態で発見された葬礼用の船を収めます——再組立てされた船は全長43メートル、レバノン杉製、4500年経ったいまもめざましく無傷です。',
    new: '1954年にクフ王ピラミッド基部のピットで解体状態で発見された葬礼用の船——全長43メートル、レバノン杉製、4500年経ったいまもめざましく無傷——は、いまはギザ台地の縁の大エジプト博物館に再組立てされて収まっています。',
  },
  // ── wp-page-89452 Holy Family Trail (block 00000000000f) ──
  {
    id: 'wp-page-89452', blockKey: '00000000000f',
    old: 'The Solar Boat Museum on the south side of the Great Pyramid holds the reconstructed cedar vessel buried beside Khufu’s tomb, dismantled into 1,224 pieces and recovered in 1954.',
    new: 'The cedar vessel buried beside Khufu’s tomb — dismantled into 1,224 pieces and recovered in 1954 — is now displayed at the Grand Egyptian Museum on the edge of the plateau.',
  },
  {
    id: 'wp-page-89452', blockKey: '00000000000f',
    old: 'El Museo de la Barca Solar, al sur de la Gran Pirámide, custodia la embarcación de cedro reconstruida que fue enterrada junto a la tumba de Keops, desmontada en 1.224 piezas y recuperada en 1954.',
    new: 'La embarcación de cedro que fue enterrada junto a la tumba de Keops —desmontada en 1.224 piezas y recuperada en 1954— se exhibe hoy en el Gran Museo Egipcio, al borde de la meseta.',
  },
  {
    id: 'wp-page-89452', blockKey: '00000000000f',
    old: '大ピラミッドの南側にある太陽の船博物館には、クフ王の墓のそばに埋められていたレバノン杉の船が再構成して収められています。1,224の部材に解体された状態で1954年に発見されたものです。',
    new: 'クフ王の墓のそばに埋められていたレバノン杉の船は、1,224の部材に解体された状態で1954年に発見され、いまはギザ台地の縁の大エジプト博物館に再構成して収められています。',
  },
  // ── wp-page-89524 13-Day (block 000000000023) ──
  {
    id: 'wp-page-89524', blockKey: '000000000023',
    old: 'The Solar Boat Museum at the foot of the Great Pyramid holds one of the cedar vessels buried for the pharaoh’s afterlife.',
    new: 'One of the cedar vessels buried beside the Great Pyramid for the pharaoh’s afterlife is now displayed at the Grand Egyptian Museum on the edge of the plateau.',
  },
  {
    id: 'wp-page-89524', blockKey: '000000000023',
    old: 'El Museo de la Barca Solar, al pie de la Gran Pirámide, conserva uno de los buques de cedro enterrados para el más allá del faraón.',
    new: 'Uno de los buques de cedro enterrados junto a la Gran Pirámide para el más allá del faraón se exhibe hoy en el Gran Museo Egipcio, al borde de la meseta.',
  },
  {
    id: 'wp-page-89524', blockKey: '000000000023',
    old: '大ピラミッド南麓の太陽の船博物館にはファラオの来世のために埋められた杉の船一隻が収まります。',
    new: '大ピラミッドのそばにファラオの来世のために埋められていた杉の船一隻は、いまはギザ台地の縁の大エジプト博物館に収まっています。',
  },
  // ── wp-page-89558 8-Day Essential (block 00000000000f) ──
  {
    id: 'wp-page-89558', blockKey: '00000000000f',
    old: 'The Solar Boat Museum at the base of Khufu’s pyramid holds the reconstructed cedar vessel buried beside the pyramid around 2500 BC, disassembled into 1,224 pieces and reassembled after its excavation in 1954.',
    new: 'The cedar vessel buried beside Khufu’s pyramid around 2500 BC — disassembled into 1,224 pieces and recovered in its 1954 excavation — is now reassembled at the Grand Egyptian Museum on the edge of the plateau.',
  },
  {
    id: 'wp-page-89558', blockKey: '00000000000f',
    old: 'El Museo de la Barca Solar en la base de la pirámide de Keops conserva el buque de cedro reconstruido enterrado junto a ella hacia 2500 a. C., desmontado en 1224 piezas y reensamblado tras su excavación en 1954.',
    new: 'El buque de cedro enterrado junto a la pirámide de Keops hacia 2500 a. C. —desmontado en 1224 piezas y recuperado en su excavación de 1954— se exhibe hoy reensamblado en el Gran Museo Egipcio, al borde de la meseta.',
  },
  {
    id: 'wp-page-89558', blockKey: '00000000000f',
    old: 'クフ王ピラミッドの麓の太陽の船博物館は、紀元前2500年ごろにピラミッドのそばに埋められた杉の船を収めます——1,224の部材に解体され、1954年の発掘ののち再組立てされました。',
    new: '紀元前2500年ごろにクフ王ピラミッドのそばに埋められた杉の船——1,224の部材に解体され、1954年に発掘——は、いまはギザ台地の縁の大エジプト博物館で再組立てされて展示されています。',
  },
  // ── wp-page-89602 Timeless Wonders: remove the day-4 museum stop ──
  {
    id: 'wp-page-89602', blockKey: '000000000006',
    old: 'Revel in a unique camel ride, visit the intriguing Solar Boat Museum, and delve into the ancient cities of ',
    new: 'Revel in a unique camel ride and delve into the ancient cities of ',
  },
  {
    id: 'wp-page-89602', blockKey: '000000000001',
    old: 'Enjoy a camel ride, visit the Solar Boat Museum, and explore the ancient cities of ',
    new: 'Enjoy a camel ride and explore the ancient cities of ',
  },
  // ── wp-page-89619 Pharaohs' Legacy (published only; same day continues to GEM) ──
  {
    id: 'wp-page-89619', blockKey: '000000000039',
    old: 'The Solar Boat Museum alongside the Great Pyramid holds the remarkably preserved cedar boat found dismantled in a pit at the base of the pyramid in 1954, intended to carry the king into the afterlife.',
    new: 'The remarkably preserved cedar boat found dismantled in a pit at the base of the pyramid in 1954 — intended to carry the king into the afterlife — is now displayed at the Grand Egyptian Museum, where this day continues after the plateau.',
  },
  {
    id: 'wp-page-89619', blockKey: '000000000039',
    old: 'El Museo de la Barca Solar junto a la Gran Pirámide conserva el barco de cedro extraordinariamente conservado encontrado desmontado en una fosa en la base de la pirámide en 1954, destinado a llevar al rey al más allá.',
    new: 'El barco de cedro extraordinariamente conservado, encontrado desmontado en una fosa en la base de la pirámide en 1954 y destinado a llevar al rey al más allá, se exhibe hoy en el Gran Museo Egipcio, la siguiente parada de la jornada tras la meseta.',
  },
  {
    id: 'wp-page-89619', blockKey: '000000000039',
    old: '大ピラミッドのそばの太陽の船博物館は、1954年にピラミッド基部のピットで解体状態で発見された、めざましく保存状態のよい杉の船を収めます——王を来世に運ぶための船です。',
    new: '1954年にピラミッド基部のピットで解体状態で発見された、めざましく保存状態のよい杉の船——王を来世に運ぶための船——は、いまはこの日このあと訪れる大エジプト博物館に収まっています。',
  },
];

// Structural edits for wp-page-89602's linked/bolded day-4 spans (ES/JA):
// remove the museum span entirely and mend the surrounding spans.
// _keys repeat across arrays in these WP-era docs, so bases are explicit paths.
const STRUCTURAL = [
  {
    id: 'wp-page-89602',
    base: 'days[_key=="day-4"].morning[_key=="es"].value[_key=="00000000000e"]',
    setSpans: { '000000000005': ' Disfruta de un paseo en camello' },
    unsetSpans: ['000000000007'],
    unsetMarkDefs: ['000000000006'],
  },
  {
    id: 'wp-page-89602',
    base: 'days[_key=="day-4"].morning[_key=="ja"].value[_key=="000000000007"]',
    setSpans: { '000000000004': ' を楽しみます。' },
    unsetSpans: ['000000000005', '000000000006'],
    unsetMarkDefs: [],
  },
];

const APOS = /’/g;
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const tolerant = (s) => new RegExp(escRe(s).replace(/’/g, "[’']"));

// Walk a doc building _key-addressed paths; visit every span.
function* spans(node, path) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      const child = node[i];
      const seg = child && typeof child === 'object' && child._key ? `[_key=="${child._key}"]` : `[${i}]`;
      yield* spans(child, path + seg);
    }
    return;
  }
  if (typeof node.text === 'string' && node._type === 'span') {
    yield { span: node, path };
  }
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('_')) continue;
    yield* spans(v, `${path}.${k}`);
  }
}

// Find the parent block (by blockKey) containing a span — for scoping edits.
function blockKeyOf(path) {
  const m = [...path.matchAll(/\[_key=="([^"]+)"\]/g)];
  return m.length >= 2 ? m[m.length - 2][1] : null;
}

async function main() {
  const ids = [...new Set([...EDITS.map((e) => e.id), ...STRUCTURAL.map((e) => e.id)])];
  const docs = {};
  for (const id of ids) docs[id] = await client.getDocument(id);

  // Plan text edits
  const plan = []; // {id, path, oldText, newText}
  let errors = 0;
  for (const e of EDITS) {
    const doc = docs[e.id];
    const re = tolerant(e.old);
    const hits = [];
    for (const { span, path } of spans(doc, '')) {
      // `path` already ends at the span itself (…children[_key=="X"])
      if (!path.includes(`[_key=="${e.blockKey}"]`)) continue;
      if (re.test(span.text)) hits.push({ span, path });
    }
    if (hits.length === 0) {
      // Tolerate re-runs: skip if the replacement text is already in place.
      const newRe = tolerant((e.new || ' ').replace(APOS, '’'));
      const applied = e.new === ''
        ? true // removal: absence of the old text is the applied state
        : [...spans(doc, '')].some(({ span, path }) =>
            path.includes(`[_key=="${e.blockKey}"]`) && (newRe.test(span.text) || span.text.includes(e.new.replace(APOS, "'"))));
      if (applied) { console.log(`  (already applied) [${e.id}] ${e.old.slice(0, 50)}…`); continue; }
      console.error(`✗ ${e.id} block ${e.blockKey}: no match and not applied — "${e.old.slice(0, 60)}…"`);
      errors++;
      continue;
    }
    if (hits.length > 1) {
      console.error(`✗ ${e.id} block ${e.blockKey}: expected 1 span match, got ${hits.length} — "${e.old.slice(0, 60)}…"`);
      errors++;
      continue;
    }
    const { span, path } = hits[0];
    const usesAscii = !span.text.includes('’') && span.text.includes("'");
    const newText = usesAscii ? e.new.replace(APOS, "'") : e.new;
    plan.push({
      id: e.id,
      path: `${path}.text`.replace(/^\./, ''),
      value: span.text.replace(re, newText).replace(/  +/g, ' '),
      summary: `${e.old.slice(0, 50)}… → ${(newText || '(removed)').slice(0, 50)}…`,
    });
  }

  // Plan structural edits
  const structuralOps = []; // {id, sets: {path: value}, unsets: [paths]}
  for (const s of STRUCTURAL) {
    const sets = {};
    for (const [k, v] of Object.entries(s.setSpans)) sets[`${s.base}.children[_key=="${k}"].text`] = v;
    const unsets = [
      ...s.unsetSpans.map((k) => `${s.base}.children[_key=="${k}"]`),
      ...s.unsetMarkDefs.map((k) => `${s.base}.markDefs[_key=="${k}"]`),
    ];
    structuralOps.push({ id: s.id, sets, unsets });
  }

  if (errors) { console.error(`\nABORT: ${errors} edit(s) failed to match.`); process.exit(1); }

  console.log(`Planned text edits: ${plan.length} (expected 26)`);
  for (const p of plan) console.log(`  [${p.id}] ${p.summary}\n      @ ${p.path}`);
  console.log(`Structural ops: ${structuralOps.length} (expected 2)`);

  if (!APPLY) { console.log('\nDry run — re-run with --apply to write.'); return; }

  const backupPath = __dirname + '/../backups/solar-boat-8tours-rollback-2026-07-29.json';
  if (fs.existsSync(backupPath)) console.log('Backup already exists — keeping the original pre-change snapshot.');
  else fs.writeFileSync(backupPath, JSON.stringify(docs, null, 2));
  console.log('Applying…');

  for (const id of ids) {
    let patch = client.patch(id);
    let ops = 0;
    for (const p of plan.filter((x) => x.id === id)) { patch = patch.set({ [p.path]: p.value }); ops++; }
    // .unset() REPLACES the patch's unset list (it does not append) — build one combined call.
    const allSets = {};
    const allUnsets = [];
    for (const s of structuralOps.filter((x) => x.id === id)) {
      Object.assign(allSets, s.sets);
      allUnsets.push(...s.unsets);
      ops += Object.keys(s.sets).length + s.unsets.length;
    }
    if (Object.keys(allSets).length) patch = patch.set(allSets);
    if (allUnsets.length) patch = patch.unset(allUnsets);
    await patch.commit();
    console.log(`patched ${id} (${ops} ops)`);
  }

  // Post-verify: no stale museum phrases remain in the 8 published docs.
  console.log('\nVerifying…');
  const STALE = /Solar Boat Museum|Museo de la Barca Solar|Museo del Barco Solar|太陽の船博物館|and Solar Boat|y Barca Solar/;
  let clean = true;
  for (const id of ids) {
    const after = await client.getDocument(id);
    const bad = [];
    for (const { span, path } of spans(after, '')) if (STALE.test(span.text)) bad.push(path);
    if (bad.length) { clean = false; console.error(`✗ ${id}: stale text remains at`, bad); }
    else console.log(`✓ ${id} clean`);
  }
  console.log(clean ? '\nALL 8 TOURS VERIFIED CLEAN.' : '\nSTALE TEXT REMAINS — check output.');
}

main().catch((e) => { console.error(e); process.exit(1); });
