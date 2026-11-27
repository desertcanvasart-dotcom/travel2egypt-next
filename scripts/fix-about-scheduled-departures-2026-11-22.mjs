/**
 * About page: "We do not run scheduled departures" is out of date (owner, 22 Nov: "we do schedule departures,
 * and we have a small group departure page"). One sentence replaced in EN/ES/JA; nothing else changes.
 *
 *   node --env-file=<.env> scripts/fix-about-scheduled-departures-2026-11-22.mjs [--apply]
 */
import { createClient } from '@sanity/client';
import { writeRollback } from './lib/content-gates.mjs';

const ID = 'editorial-page-about';
const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-05-23', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const apply = process.argv.includes('--apply');
const PAIRS = [
  ['We do not run scheduled departures.', 'We run a small number of scheduled small-group departures, and almost every other trip is built around the specific traveler.'],
  ['No tenemos salidas programadas.', 'Realizamos un pequeño número de salidas programadas en grupo reducido, y casi todos los demás viajes se construyen alrededor del viajero específico.'],
  ['私たちは定期出発を運営しません。', '少人数グループの定期出発を少数運営していますが、それ以外のほとんどの旅は、特定の旅行者のまわりに組まれます。'],
];
const d = await c.getDocument(ID);
if (!d) throw new Error('about doc not found');
if (await c.getDocument(`drafts.${ID}`)) throw new Error('about has an unpublished draft');
const sections = JSON.parse(JSON.stringify(d.sections));
let changed = 0;
const walk = (o) => {
  if (Array.isArray(o)) o.forEach(walk);
  else if (o && typeof o === 'object') {
    if (o._type === 'span' && typeof o.text === 'string') for (const [a, b] of PAIRS) {
      const n = o.text.split(a).length - 1;
      if (n === 1) { o.text = o.text.replace(a, () => b); changed++; console.log(`CHANGE  "${a}"`); }
      else if (n > 1) throw new Error(`"${a}" found ${n}×`);
    }
    for (const v of Object.values(o)) walk(v);
  }
};
walk(sections);
console.log(`${changed} change(s)`);
if (changed !== 3 && changed !== 0) throw new Error(`expected 3 changes, got ${changed}`);
if (apply && changed) {
  await writeRollback(c, [ID], 'before-about-scheduled-departures');
  await c.patch(ID).set({ sections }).ifRevisionId(d._rev).commit();
  console.log('APPLIED');
} else if (!apply) console.log('dry run (--apply writes production)');
