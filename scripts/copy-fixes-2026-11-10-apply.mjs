/**
 * Copy fixes (2026-11-10), owner-locked in docs/copy-fixes-draft-2026-11-10.md:
 *  1. wp-page-156421 body[es]: Portuguese → Spanish (3 paragraphs + 5 tips).
 *  2. tourLanding.authentic-dahabiya-nile-cruise seo.metaDescription en/es/ja:
 *     drop "no engine".
 * Verbatim pre-flight (Canon Gate A). The old ES body is printed in full and
 * saved to scratch output for rollback.
 * Usage (from the repo root): node scripts/copy-fixes-2026-11-10-apply.mjs [--apply]
 */
import 'dotenv/config';
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const APPLY = process.argv.includes('--apply');
const locked = fs.readFileSync('docs/copy-fixes-draft-2026-11-10.md', 'utf8');
if (!/Status: LOCKED/.test(locked)) throw new Error('copy file is not LOCKED');
const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });

// [bold label, rest, listItem?]
const BODY = [
  ['Nueve días privados por el Egipto clásico.', ' Empiezas en El Cairo con las pirámides de Guiza y la colección del Museo Egipcio, y paseas por el bazar de Jan el-Jalili y la calle Al-Muizz.'],
  [null, 'Vuelas a Luxor para recorrer sus dos orillas: el Valle de los Reyes en la occidental y los templos de Karnak y Luxor en la oriental. Después embarcas en un crucero por el Nilo rumbo sur hacia Asuán, con paradas en los templos de Edfu y Kom Ombo.'],
  [null, 'En Asuán visitas el templo de Philae y tomas el tren nocturno de vuelta a El Cairo. El viaje termina en Menfis y Saqqara, con la pirámide escalonada, y en El Cairo copto, con la Iglesia Colgante y la sinagoga Ben Ezra.'],
  ['Calzado cómodo:', ' caminarás mucho, sobre todo en los yacimientos arqueológicos.', 'bullet'],
  ['Protección solar:', ' lleva gafas de sol, crema solar y sombrero.', 'bullet'],
  ['Respeto cultural:', ' viste con recato al visitar lugares religiosos y prepárate para descalzarte cuando te lo pidan.', 'bullet'],
  ['Conexión:', ' el wifi puede ser limitado en algunos lugares; descarga antes las aplicaciones y la información que necesites.', 'bullet'],
  ['Recogida en el hotel:', ' espera en el vestíbulo 15 minutos antes de la salida prevista cada día.', 'bullet'],
];
const MD = {
  en: 'The Nile under sail where the wind allows — a handful of cabins and the moorings the big boats can’t reach. The traditional sailing form of the Nile, restored for the modern voyage.',
  es: 'El Nilo a vela cuando el viento lo permite — un puñado de camarotes y los fondeos a los que los grandes barcos no pueden llegar. La forma tradicional de navegar el Nilo, restaurada para el viaje moderno.',
  ja: '風があれば帆で進むナイル川——ごく限られたキャビンと、大型船がたどり着けない停泊地。ナイル川を航行してきた伝統的な帆船の形が、現代の航海のために蘇りました。',
};

const lines = [...BODY.map(([b, r]) => (b ? `> **${b}**${r}` : `> ${r}`)), ...Object.values(MD).map((v) => `**New:** ${v}`)];
const bad = lines.filter((l) => !locked.includes(l));
if (bad.length) { console.error('PRE-FLIGHT FAILED:', bad); process.exit(1); }
console.log(`pre-flight OK: ${lines.length} strings match the locked copy`);

const blocks = BODY.map(([b, r, li], i) => {
  const k = `es9d-${i}`;
  const children = [];
  if (b) children.push({ _key: `${k}-s0`, _type: 'span', marks: ['strong'], text: b });
  children.push({ _key: `${k}-s1`, _type: 'span', marks: [], text: r.replace(/^ /, b ? ' ' : '') });
  return { _key: k, _type: 'block', style: 'normal', markDefs: [], children, ...(li ? { listItem: li, level: 1 } : {}) };
});

let tx = c.transaction(), n = 0;
// 1. ES body
for (const id of ['wp-page-156421', 'drafts.wp-page-156421']) {
  const doc = await c.fetch(`*[_id==$id][0]{_id, "es": body[_key=="es"][0].value}`, { id });
  if (!doc) { if (id === 'wp-page-156421') throw new Error('missing doc'); continue; }
  const oldText = (doc.es || []).map((b) => (b.children || []).map((k) => k.text).join('')).join('\n');
  if (oldText === blocks.map((b) => b.children.map((k) => k.text).join('')).join('\n')) { console.log(`${id}: body[es] already applied`); continue; }
  if (!/você|Egito/.test(oldText)) throw new Error(`${id}: body[es] is not the Portuguese text — refusing`);
  fs.writeFileSync(`${process.env.TMPDIR || '/tmp'}/rollback-${id}-body-es.json`, JSON.stringify(doc.es));
  console.log(`\n${id} · body[es]\n  - ${oldText.slice(0, 120)}…\n  + ${blocks.map((b) => b.children.map((k) => k.text).join('')).join('\n    ')}`);
  tx = tx.patch(c.patch(id).set({ 'body[_key=="es"].value': blocks }));
  n++;
}
// 2. Dahabiya meta description
for (const id of ['tourLanding.authentic-dahabiya-nile-cruise', 'drafts.tourLanding.authentic-dahabiya-nile-cruise']) {
  const doc = await c.fetch(`*[_id==$id][0]{_id, "md": seo.metaDescription}`, { id });
  if (!doc) continue;
  let p = c.patch(id), changed = false;
  for (const [lang, v] of Object.entries(MD)) {
    const cur = doc.md?.find((x) => x._key === lang)?.value;
    console.log(`\n${id} · seo.metaDescription [${lang}]\n  - ${cur}\n  + ${v}`);
    if (cur === undefined) throw new Error(`${id}: no ${lang} description`);
    if (cur !== v) { p = p.set({ [`seo.metaDescription[_key=="${lang}"].value`]: v }); changed = true; }
  }
  if (changed) { tx = tx.patch(p); n++; }
}
if (APPLY && n) { const r = await tx.commit({ autoGenerateArrayKeys: false }); console.log('\ncommitted', r.results.length, 'docs'); }
else console.log(`\n${n} docs to patch ${APPLY ? '' : '(dry run — pass --apply)'}`);
