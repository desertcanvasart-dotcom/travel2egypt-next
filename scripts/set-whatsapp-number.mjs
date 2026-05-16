#!/usr/bin/env node
/**
 * Session 37 — Populate siteSettings.contact.whatsapp.
 *
 * The field existed in the schema but was never migrated. Entity detail
 * pages (tours/hotels/packages/nile-cruises) data-gate their secondary
 * "WhatsApp inquiry" CTA on this value — without it, those pages render
 * only a single CTA. Number is the locked brand fact from the session 37
 * brief: +20 115 801 1600.
 *
 * Usage:
 *   node scripts/set-whatsapp-number.mjs            # dry-run
 *   node scripts/set-whatsapp-number.mjs --commit   # write to Sanity
 */
import { createClient } from '@sanity/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function findEnv(start) {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, '.env');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error('Could not locate a .env file');
}
const env = Object.fromEntries(
  fs.readFileSync(findEnv(ROOT), 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => {
    const i = l.indexOf('=');
    return [l.slice(0, i), l.slice(i + 1).replace(/^['"]|['"]$/g, '')];
  })
);
const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const COMMIT = process.argv.includes('--commit');
const WHATSAPP = '+201158011600';

const before = await client.fetch('*[_id=="siteSettings"][0].contact');
console.log('Mode:', COMMIT ? 'COMMIT' : 'DRY-RUN');
console.log('contact before:', JSON.stringify(before));

if (!COMMIT) {
  console.log(`Would set contact.whatsapp = "${WHATSAPP}". Re-run with --commit.`);
  process.exit(0);
}

await client.patch('siteSettings').set({ 'contact.whatsapp': WHATSAPP }).commit();
const after = await client.fetch('*[_id=="siteSettings"][0].contact');
console.log('contact after: ', JSON.stringify(after));
