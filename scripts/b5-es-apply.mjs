/**
 * B5 Spanish batch (2026-11-09): writes the owner-locked copy in
 * docs/b5-copy-es-draft-2026-11-09.md to Sanity (ES fields only). Verbatim
 * pre-flight (Canon Gate A). Usage: node scripts/b5-es-apply.mjs [--apply]
 */
import 'dotenv/config';
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const APPLY = process.argv.includes('--apply');
const locked = fs.readFileSync('docs/b5-copy-es-draft-2026-11-09.md', 'utf8');
if (!/Status: LOCKED/.test(locked)) throw new Error('copy file is not LOCKED');
const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });

const MT = 'metaTitle', MD = 'metaDescription';
// [docId, seo field, new ES string]
const SEO = [
  ['tourLanding.nile-cruise-holidays', MT, 'Viaje a Egipto con crucero por el Nilo'],
  ['tourLanding.nile-cruise-holidays', MD, 'Viajes privados por Egipto con un tramo de crucero por el Nilo entre Asuán y Luxor, combinado con El Cairo y otros destinos. Tú eliges el barco.'],
  ['wp-page-89015', MT, 'Viaje romántico por Egipto: 10 días para dos'],
  ['wp-page-89015', MD, 'Diez días privados para dos: El Cairo, Luxor, el Nilo, Asuán y Alejandría, con la faluca en Elefantina y el templo de Luxor iluminado de noche.'],
  ['wp-page-88992', MT, 'Viaje a Egipto con Abu Simbel: 10 días'],
  ['wp-page-88992', MD, 'Diez días privados en torno a Abu Simbel: Saqqara y Dahshur, Asuán y los templos nubios, Kom Ombo y Edfu hasta Luxor, y un final en Alejandría.'],
  ['tourLanding.egypt-and-the-red-sea', MT, 'Viaje a Egipto y el mar Rojo'],
  ['tourLanding.egypt-luxury-holidays', MT, 'Viaje de lujo a Egipto, en privado'],
  ['wp-page-136519', MT, 'Viaje a Egipto 7 días: El Cairo y crucero'],
  ['wp-page-136519', MD, 'Siete días privados: El Cairo, el tren nocturno al sur, tres noches de crucero entre Asuán y Luxor y una jornada final en los templos tebanos.'],
  ['wp-page-153242', MT, 'Egipto en 4 días: tour privado por El Cairo'],
  ['wp-page-153242', MD, 'Cuatro días privados en El Cairo: la pirámide escalonada de Saqqara, Guiza, el Gran Museo Egipcio y la ciudad copta e islámica.'],
  ['wp-page-89558', MT, 'Viaje a Egipto 8 días: Egipto esencial'],
  ['wp-page-89558', MD, 'Ocho días privados por cuatro ciudades: la meseta de Guiza, Alejandría junto al Mediterráneo, Abu Simbel y Asuán, y los templos y tumbas de Luxor.'],
];
const INTRO_FIX = { id: 'wp-page-89015', from: 'el Luxor Temple iluminado por la noche', to: 'el templo de Luxor iluminado por la noche' };

const strings = [...SEO.map((s) => s[2]), INTRO_FIX.to];
const bad = strings.filter((v) => !locked.includes(v));
if (bad.length) { console.error('PRE-FLIGHT FAILED:', bad); process.exit(1); }
console.log(`pre-flight OK: ${strings.length} strings match the locked copy`);

const itemType = (f) => (f === MT ? 'internationalizedArrayStringValue' : 'internationalizedArrayTextValue');
let tx = c.transaction(), n = 0;
for (const base of [...new Set([...SEO.map((s) => s[0]), INTRO_FIX.id])]) {
  for (const id of [base, `drafts.${base}`]) {
    const doc = await c.fetch(`*[_id==$id][0]{_id, seo, "sumEs": summary[_key=="es"][0].value}`, { id });
    if (!doc) continue;
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
      // A Sanity patch holds one insert; a second would replace the first, so
      // each insert goes in its own patch.
      else if (cur === undefined) tx = tx.patch(c.patch(id).insert('after', `seo.${f}[-1]`, [item]));
      else p = p.set({ [`seo.${f}[_key=="es"].value`]: v });
    }
    if (base === INTRO_FIX.id && doc.sumEs) {
      const next = doc.sumEs.replace(INTRO_FIX.from, INTRO_FIX.to);
      console.log(`\n${id} · summary [es]\n  - ${doc.sumEs}\n  + ${next}`);
      if (next !== doc.sumEs) { changed = true; p = p.set({ 'summary[_key=="es"].value': next }); }
      else console.log('  (unchanged)');
    }
    if (changed) { tx = tx.patch(p); n++; }
  }
}
if (APPLY && n) { const r = await tx.commit({ autoGenerateArrayKeys: false }); console.log('\ncommitted', r.results.length, 'docs'); }
else console.log(`\n${n} docs to patch ${APPLY ? '' : '(dry run — pass --apply)'}`);
