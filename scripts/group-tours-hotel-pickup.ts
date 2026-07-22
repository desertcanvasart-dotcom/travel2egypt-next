/**
 * Group day tours: meeting point → hotel pickup (owner decision 2026-07-22:
 * "no meeting point, all departures will be from a customer's hotel and back
 * to the same place again … in the group day tour section").
 *
 * Walks EVERY string in each group day tour doc (summary, body spans,
 * timeline, included items … — sweep-all-fields rule) and rewrites the
 * meeting-point sentences to hotel-pickup phrasing, per locale. Specific
 * sentence rewrites run first; generic fallbacks catch stragglers; the run
 * FAILS if any meeting-point phrase survives, so nothing slips through.
 * The named meeting hotel on the Luxor West Bank tour (Aracan Eatabe) is
 * dropped entirely. Backups per doc in backups/.
 *
 *   npx tsx scripts/group-tours-hotel-pickup.ts --dry-run | --commit
 */
import { writeFileSync } from 'node:fs';

import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();

const dryRun = !process.argv.includes('--commit');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: 'production',
  apiVersion: '2024-12-01',
  useCdn: false,
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  perspective: 'raw',
});

/** Ordered — most specific first. Applied as plain substring replacements. */
const REPLACEMENTS: Array<[string, string]> = [
  // EN — departures
  ['Early morning departure from the meeting point in central Aswan', 'Early morning pickup from your hotel in Aswan'],
  ['Morning departure from the meeting point in central Aswan', 'Morning pickup from your hotel in Aswan'],
  ['Morning departure from the meeting point in Luxor', 'Morning pickup from your hotel in Luxor'],
  ['09:00 departure from the meeting point at the Aracan Eatabe Luxor Hotel on the Corniche', '09:00 pickup from your hotel in Luxor'],
  ['09:00 departure from the meeting point in central Cairo', '09:00 pickup from your hotel in Cairo'],
  ['09:00 departure from the meeting point', '09:00 pickup from your hotel'],
  // EN — returns
  ['Return drive to the East Bank meeting point. Drop-off in the late afternoon.', 'Return drive to the East Bank. Drop-off at your hotel in the late afternoon.'],
  ['Drop-off at the meeting point', 'Drop-off at your hotel'],
  ['back at the meeting point', 'back at your hotel'],
  // EN — generic last resort
  ['the meeting point', 'your hotel'],

  // ES — salidas
  ['Salida muy temprana desde el punto de encuentro en el centro de Asuán', 'Salida muy temprana con recogida en su hotel de Asuán'],
  ['Salida matutina desde el punto de encuentro en el centro de Asuán', 'Salida matutina con recogida en su hotel de Asuán'],
  ['Salida matutina desde el punto de encuentro en Luxor', 'Salida matutina con recogida en su hotel de Luxor'],
  ['09:00 salida desde el punto de encuentro en el hotel Aracan Eatabe Luxor, en la corniche', '09:00 recogida en su hotel de Luxor'],
  ['09:00 salida desde el punto de encuentro en el centro de El Cairo', '09:00 recogida en su hotel de El Cairo'],
  ['09:00 salida desde el punto de encuentro', '09:00 recogida en su hotel'],
  // ES — regresos
  ['Regreso por carretera al punto de encuentro de la orilla oriental. Llegada al final de la tarde.', 'Regreso a la orilla oriental. Llegada a su hotel al final de la tarde.'],
  ['Llegada al punto de encuentro', 'Llegada a su hotel'],
  ['regresado al punto de encuentro', 'regresado a su hotel'],
  ['de vuelta en el punto de encuentro', 'de vuelta en su hotel'],
  // ES — generic last resort
  ['al punto de encuentro', 'a su hotel'],
  ['el punto de encuentro', 'su hotel'],

  // JA — belt-and-suspenders (no known mentions; GROQ hits were tokenizer noise)
  ['集合場所', 'ご宿泊のホテル'],
  ['ミーティングポイント', 'ご宿泊のホテル'],
];

const RESIDUAL = /meeting point|punto de encuentro|集合場所|ミーティングポイント|Aracan/i;

interface Change { path: string; before: string; after: string }

/** Recursively rewrite matching strings; returns the list of edits made. */
function walk(node: unknown, path: string, changes: Change[]): unknown {
  if (typeof node === 'string') {
    let out = node;
    for (const [from, to] of REPLACEMENTS) if (out.includes(from)) out = out.split(from).join(to);
    if (out !== node) changes.push({ path, before: node, after: out });
    return out;
  }
  if (Array.isArray(node)) return node.map((v, i) => walk(v, `${path}[${i}]`, changes));
  if (node && typeof node === 'object') {
    const o = node as Record<string, unknown>;
    for (const k of Object.keys(o)) {
      if (k === '_id' || k === '_ref' || k === '_type' || k === '_key' || k === 'slug') continue;
      o[k] = walk(o[k], `${path}.${k}`, changes);
    }
    return o;
  }
  return node;
}

async function main() {
  const ids: string[] = await client.fetch(
    `*[_type == "tour" && type == "dayTour" && tourMode == "group" && !(_id in path("drafts.**"))]._id`,
  );
  console.log(`mode: ${dryRun ? 'DRY-RUN' : 'COMMIT'} — ${ids.length} group day tours\n`);

  const stamp = new Date().toISOString().slice(0, 10);
  let touched = 0;
  const failures: string[] = [];

  for (const id of ids) {
    const doc = await client.getDocument(id);
    if (!doc) continue;

    const changes: Change[] = [];
    const mutated = walk(structuredClone(doc), id, changes) as Record<string, unknown>;
    if (changes.length === 0) continue;

    // Guard: nothing may survive the rewrite.
    const residual = JSON.stringify(mutated).match(RESIDUAL);
    if (residual) failures.push(`${id}: residual "${residual[0]}"`);

    touched += 1;
    console.log(`■ ${id} — ${changes.length} edit(s)`);
    for (const c of changes) {
      console.log(`   ${c.path.replace(id, '')}`);
      console.log(`   − ${c.before.slice(0, 110)}`);
      console.log(`   + ${c.after.slice(0, 110)}`);
    }

    if (!dryRun) {
      writeFileSync(`backups/${id.replace(/[^a-z0-9-]/gi, '_')}-before-hotel-pickup-${stamp}.json`, JSON.stringify(doc, null, 2));
      const { _id, _rev, _createdAt, _updatedAt, ...fields } = mutated;
      await client.patch(id).set(fields).commit();
      console.log('   patched ✓');
    }
    console.log('');
  }

  if (failures.length) {
    console.error('RESIDUAL MATCHES — extend REPLACEMENTS:', failures);
    process.exit(1);
  }
  console.log(`${dryRun ? 'would touch' : 'patched'} ${touched} tour(s); residual scan clean.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
