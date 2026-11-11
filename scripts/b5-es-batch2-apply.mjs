/**
 * B5 Spanish batch 2 (2026-11-10): writes the owner-locked copy in
 * docs/b5-copy-es-batch2-draft-2026-11-10.md to Sanity (ES fields only).
 * Verbatim pre-flight (Canon Gate A).
 * Usage (from the repo root): node scripts/b5-es-batch2-apply.mjs [--apply]
 */
import 'dotenv/config';
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const APPLY = process.argv.includes('--apply');
const locked = fs.readFileSync('docs/b5-copy-es-batch2-draft-2026-11-10.md', 'utf8');
if (!/Status: LOCKED/.test(locked)) throw new Error('copy file is not LOCKED');
const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });

const MT = 'metaTitle', MD = 'metaDescription';
const SEO = [
  ['wp-page-90326', MT, 'Crucero de El Cairo a Luxor: 13 días'],
  ['wp-page-90326', MD, 'Trece días privados por el Nilo de El Cairo a Luxor: primero la meseta de Guiza y luego, rumbo sur, los templos y tumbas del Egipto Medio hasta Karnak.'],
  ['wp-page-89177', MT, 'Crucero de Luxor a El Cairo: 11 días'],
  ['wp-page-89177', MD, 'Once días privados por el Nilo de Luxor a El Cairo: primero Karnak y luego, rumbo norte, los templos y tumbas del Egipto Medio hasta llegar a Guiza.'],
  ['tourLanding.egypt-family-holidays', MT, 'Viaje a Egipto con niños: viajes en familia'],
  ['tourLanding.multiday-adventure-and-safari-tours', MT, 'Safari por el desierto de Egipto: aventura'],
  ['wp-page-88170', MT, 'Valle de los Reyes: excursión privada'],
  ['wp-page-88170', MD, 'Un día privado en la orilla oeste de Luxor: los valles de los Reyes y de las Reinas, los Colosos de Memnón, Hatshepsut, Medinet Habu y Deir el-Medina.'],
  ['wp-page-129996', MT, 'Pesca en el lago Nasser: safari de 3 días'],
  ['wp-page-129996', MD, 'Tres días privados de pesca a bordo en el lago Nasser, tras la perca del Nilo y el pez tigre, con guías nubios y ninguna otra embarcación a la vista.'],
  ['wp-page-156421', MT, 'Viaje a Egipto 9 días: El Cairo, Luxor, Asuán'],
  ['wp-page-156421', MD, 'Nueve días privados: Guiza y El Cairo antiguo, las dos orillas de Luxor, un crucero por el Nilo hasta Asuán por Edfu y Kom Ombo, y Saqqara al final.'],
  ['wp-page-156539', MT, 'Viaje a Egipto 10 días con Abu Simbel'],
  ['wp-page-156539', MD, 'Diez días privados que terminan en Guiza: los barrios antiguos de El Cairo, Alejandría, el sur nubio y Abu Simbel, Luxor en ambas orillas y las pirámides.'],
  ['wp-page-86836', MT, 'Viaje a Egipto 11 días: Nilo y mar Rojo'],
  ['wp-page-86836', MD, 'Once días privados con ritmo familiar: la meseta de Guiza, Abu Simbel, las dos orillas de Luxor y unos días en el mar Rojo para cerrar el viaje.'],
  ['wp-page-112993', MT, 'Viaje a Egipto 12 días en familia'],
  ['wp-page-112993', MD, 'Doce días privados con ritmo familiar: las pirámides y bazares de El Cairo, tres noches en el mar Rojo y cuatro de crucero por el Nilo de Luxor a Asuán.'],
  ['wp-page-113004', MT, 'Egipto en familia y de lujo: 14 días'],
  ['wp-page-113004', MD, 'Catorce días privados con ritmo familiar y hoteles y crucero de categoría alta: Guiza, el Nilo de Asuán a Luxor, cuatro noches en el mar Rojo y El Cairo.'],
];
const SUMMARIES = {
  'wp-page-156421': 'Nueve días privados: El Cairo y Guiza, un vuelo a Luxor, un crucero por el Nilo rumbo sur por Edfu y Kom Ombo hasta Asuán, el tren nocturno de vuelta, y Saqqara y El Cairo antiguo para cerrar.',
  'tourLanding.authentic-dahabiya-nile-cruise': 'Navega el Nilo de Egipto en una pequeña dahabiya tradicional — doce huéspedes como máximo, tramos a vela y escalas en templos a los que los grandes cruceros no llegan.',
};

const strings = [...SEO.map((s) => s[2]), ...Object.values(SUMMARIES)];
const bad = strings.filter((v) => !locked.includes(v));
if (bad.length) { console.error('PRE-FLIGHT FAILED:', bad); process.exit(1); }
console.log(`pre-flight OK: ${strings.length} strings match the locked copy`);

const itemType = (f) => (f === MT ? 'internationalizedArrayStringValue' : 'internationalizedArrayTextValue');
let tx = c.transaction(), n = 0;
for (const base of [...new Set([...SEO.map((s) => s[0]), ...Object.keys(SUMMARIES)])]) {
  for (const id of [base, `drafts.${base}`]) {
    const doc = await c.fetch(`*[_id==$id][0]{_id, seo, summary}`, { id });
    if (!doc) { if (id === base) throw new Error(`missing ${id}`); continue; }
    let p = c.patch(id), changed = false;
    if (!doc.seo) p = p.setIfMissing({ seo: { _type: 'seo' } });
    for (const [, f, v] of SEO.filter((s) => s[0] === base)) {
      const arr = doc.seo?.[f];
      const cur = Array.isArray(arr) ? arr.find((i) => i._key === 'es')?.value : undefined;
      console.log(`\n${id} · seo.${f} [es]\n  - ${cur ?? '(empty)'}\n  + ${v}`);
      if (cur === v) { console.log('  (unchanged)'); continue; }
      changed = true;
      const item = { _key: 'es', _type: itemType(f), value: v };
      if (!Array.isArray(arr)) p = p.set({ [`seo.${f}`]: [item] });
      // A Sanity patch holds one insert; each insert goes in its own patch.
      else if (cur === undefined) tx = tx.patch(c.patch(id).insert('after', `seo.${f}[-1]`, [item]));
      else p = p.set({ [`seo.${f}[_key=="es"].value`]: v });
    }
    if (SUMMARIES[base]) {
      const cur = Array.isArray(doc.summary) ? doc.summary.find((i) => i._key === 'es')?.value : undefined;
      console.log(`\n${id} · summary [es]\n  - ${cur ?? '(empty)'}\n  + ${SUMMARIES[base]}`);
      if (cur === undefined) throw new Error(`no es summary on ${id}`);
      if (cur !== SUMMARIES[base]) { changed = true; p = p.set({ 'summary[_key=="es"].value': SUMMARIES[base] }); }
    }
    if (changed) { tx = tx.patch(p); n++; }
  }
}
if (APPLY && n) { const r = await tx.commit({ autoGenerateArrayKeys: false }); console.log('\ncommitted', r.results.length, 'mutations'); }
else console.log(`\n${n} docs to patch ${APPLY ? '' : '(dry run — pass --apply)'}`);
