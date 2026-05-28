/**
 * Patch hotel.city refs that weren't set or were set wrong because EN MD
 * frontmatter uses short city slugs that don't match Sanity's canonical
 * city slugs (e.g. siwa → siwa-oasis, dakhla → dakhla-oasis,
 * el-gouna → al-gouna, kharga → kharga-oasis, soma-bay → hurghada).
 *
 * Re-walks EN hotels MD, derives canonical hotel slug (same logic as the
 * bulk-import script), maps MD-frontmatter city to Sanity city slug,
 * resolves city _id, patches the hotel doc if the city ref is missing or
 * doesn't match.
 *
 * Idempotent.
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { readdirSync, readFileSync, appendFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

loadEnv();
const LOG_PATH = resolve(process.cwd(), 'migration/bulk-upload-log.jsonl');
const EN_DIR = '/Users/islamhussein/Downloads/All 3 langs/en/hotels';

/** EN MD city slug → canonical Sanity city slug */
const CITY_ALIAS: Record<string, string> = {
  'siwa': 'siwa-oasis',
  'dakhla': 'dakhla-oasis',
  'el-gouna': 'al-gouna',
  'kharga': 'kharga-oasis',
  'soma-bay': 'hurghada', // Soma Bay is a Hurghada-area resort cluster; closest city match
};

/** EN MD hotel-filename slug → canonical Sanity hotel slug (subset of the
 *  table in bulk-import-hotels-md.ts — only the entries that actually exist
 *  as EN MD filenames). */
const FILENAME_TO_CANONICAL: Record<string, string> = {
  'badawiya-dakhla-hotel': 'badawiya-hotel-el-dakhla-oasis',
  'cairo-marriott-hotel-casino': 'cairo-marriott-hotel-and-omar-khayyam-casino',
  'cairo-pyramids-hotel': 'cairo-hotel-pyramids',
  'fayrouz-resort-sharm-el-sheikh': 'sharm-el-sheikh-fayrouz-resort',
  'four-seasons-first-residence': 'four-seasons-hotel-cairo-first-residence',
  'four-seasons-nile-plaza-hotel': 'four-seasons-hotel-cairo-nile-plaza',
  'helnan-royal-palestine-hotel-montazah-gardens': 'helnan-palestine-hotel-alexandria',
  'hilton-alexandria-corniche': 'hilton-alexandria-corniche-hotel',
  'hurghada-marriott-resort': 'hurghada-marriott-red-sea-resort',
  'm-venpick-resort-aswan': 'movenpick-resort-aswan',
  'm-venpick-resort-spa-el-gouna': 'movenpick-resort-spa-el-gouna',
  'maritim-jolie-ville-kings-island-hotel': 'maritim-jolie-ville-kings-island-luxor',
  'marriott-mena-house-hotel': 'marriott-mena-house-hotel-cairo',
  'renaissance-sharm-el-sheikh': 'renaissance-sharm-el-sheikh-resort',
  'royal-maxim-palace-kempinski': 'royal-maxim-palace-kempinski-cairo',
  'sol-y-mar-pioneers-al-kharga': 'sol-y-mar-pioneers-hotel-al-kharga-oasis',
  'steigenberger-nile-palace-hotel': 'steigenberger-nile-palace-luxor-hotel',
  'sunrise-montemare-resort-grand-select': 'sunrise-montemare-resort',
  'the-four-seasons-san-stefano': 'the-four-seasons-hotel-san-stephano',
  'the-nile-ritz-carlton-hotel': 'the-nile-ritz-carlton',
  'westin-cairo-golf-resort-spa': 'westin-cairo-golf-resort-and-spa',
};

interface Args { commit: boolean; dryRun: boolean }
function parseArgs(argv: string[]): Args {
  let commit = false; let dryRun = false;
  for (const a of argv.slice(2)) {
    if (a === '--commit') commit = true;
    else if (a === '--dry-run') dryRun = true;
    else die(`Unknown arg: ${a}`);
  }
  if (commit === dryRun) die('Pass exactly one of --dry-run or --commit.');
  return { commit, dryRun };
}
function die(msg: string): never { process.stderr.write(`error: ${msg}\n`); process.exit(2); }

function getClient(): SanityClient {
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (dataset !== 'migration-staging') die(`Refusing against ${dataset}`);
  const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
  if (!token) die('SANITY_STAGING_API_WRITE_TOKEN required');
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
    useCdn: false, token, perspective: 'raw',
  });
}

function appendLog(entry: Record<string, unknown>): void {
  mkdirSync(resolve(process.cwd(), 'migration'), { recursive: true });
  appendFileSync(LOG_PATH, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n', 'utf8');
}

function deriveBaseSlug(filename: string): string {
  return filename.replace(/\.md$/i, '').toLowerCase();
}

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Fix hotel city refs ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);
  const client = getClient();

  // city slug → city _id
  const cities = await client.fetch<Array<{ _id: string; slug: string }>>(
    `*[_type=='city' && !(_id in path('drafts.**'))]{ _id, "slug": slug[_key=='en'][0].value.current }`,
  );
  const cityIdBySlug = new Map<string, string>();
  for (const c of cities) if (c.slug) cityIdBySlug.set(c.slug, c._id);

  // existing hotels (id + slug + current city ref)
  const hotels = await client.fetch<Array<{ _id: string; slug: string; cityRef: string | null }>>(
    `*[_type=='hotel' && !(_id in path('drafts.**'))]{ _id, "slug": slug[_key=='en'][0].value.current, "cityRef": city._ref }`,
  );
  const idBySlug = new Map<string, string>();
  const cityRefById = new Map<string, string | null>();
  for (const h of hotels) {
    if (h.slug) idBySlug.set(h.slug, h._id);
    cityRefById.set(h._id, h.cityRef);
  }

  // Walk EN MD, extract city per file, plan patches
  const patches: Array<{ _id: string; slug: string; oldCityRef: string | null; newCityRef: string; mdCity: string }> = [];
  const skipped: string[] = [];

  for (const file of readdirSync(EN_DIR).filter((n) => n.endsWith('.md'))) {
    const base = deriveBaseSlug(file);
    const canonical = FILENAME_TO_CANONICAL[base] ?? base;
    const raw = readFileSync(join(EN_DIR, file), 'utf8');
    const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fm) { skipped.push(`${file}: no frontmatter`); continue; }
    const cityMatch = fm[1].match(/^city:[ \t]*([^\r\n]*)$/m);
    const mdCity = cityMatch ? cityMatch[1].trim() : '';
    if (!mdCity) { skipped.push(`${file}: empty city`); continue; }
    const canonCity = CITY_ALIAS[mdCity] ?? mdCity;
    const cityId = cityIdBySlug.get(canonCity);
    if (!cityId) { skipped.push(`${file}: city "${mdCity}" → "${canonCity}" not found in Sanity`); continue; }
    const hotelId = idBySlug.get(canonical);
    if (!hotelId) { skipped.push(`${file}: hotel slug "${canonical}" not in Sanity`); continue; }
    const currentRef = cityRefById.get(hotelId) ?? null;
    if (currentRef === cityId) continue; // already correct
    patches.push({ _id: hotelId, slug: canonical, oldCityRef: currentRef, newCityRef: cityId, mdCity });
  }

  console.log(`Will patch ${patches.length} hotel city refs:`);
  for (const p of patches.slice(0, 25)) {
    console.log(`  ${p._id.padEnd(45)} ${p.slug.padEnd(40)} city: ${(p.oldCityRef ?? '(none)').padEnd(18)} → ${p.newCityRef}  [MD: ${p.mdCity}]`);
  }
  if (patches.length > 25) console.log(`  … +${patches.length - 25} more`);
  if (skipped.length) {
    console.log(`\nSkipped ${skipped.length} files:`);
    for (const s of skipped.slice(0, 10)) console.log(`  · ${s}`);
  }

  if (args.dryRun) { console.log('\nDry-run — no writes.'); return; }
  if (patches.length === 0) { console.log('Nothing to do.'); return; }

  const BATCH = 25;
  for (let i = 0; i < patches.length; i += BATCH) {
    let tx = client.transaction();
    for (const p of patches.slice(i, i + BATCH)) {
      tx = tx.patch(p._id, (pp) => pp.set({ city: { _type: 'reference', _ref: p.newCityRef } }));
    }
    await tx.commit({ visibility: 'async' });
  }
  console.log(`✓ Patched ${patches.length} city refs`);
  for (const p of patches) appendLog({ phase: 'HOTELS-fix-city-ref', _id: p._id, slug: p.slug, mdCity: p.mdCity, newCityRef: p.newCityRef });
}

main().catch((err) => { console.error(err); process.exit(1); });
