/**
 * Giza Pyramids & GEM (wp-page-239597), ES: leave the two lines after the
 * closing line out of the "More about this day" expander (owner, 17 Nov):
 * "Guiza impresiona. El museo ayuda…" and "Esta es una ruta abierta…".
 * The essay text itself is not edited.
 *
 *   node --env-file=<.env> scripts/day-tour-format/gem-es-skip-trailing-2026-11-17.mjs [--apply]
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';

const ID = 'wp-page-239597';
const SKIP = ['00000000003f', '000000000042'];
const apply = process.argv.includes('--apply');
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const doc = await client.getDocument(ID);
const es = doc.body.find((b) => b._key === 'es').value;
for (const k of SKIP) {
  const b = es.find((x) => x._key === k);
  if (!b) throw new Error(`ES block ${k} missing`);
  console.log(`skip ${k}: ${b.children.map((c) => c.text).join('')}`);
}
const intro = doc.dayTourIntro.map((r) => (r.lang === 'es' ? { ...r, skipRefs: [...new Set([...(r.skipRefs ?? []), ...SKIP])] } : r));
if (apply) {
  await writeRollback(client, [ID], 'before-gem-es-skip');
  await client.patch(ID).set({ dayTourIntro: intro }).commit();
  console.log(`APPLIED to production ${ID}`);
} else console.log('dry run');
