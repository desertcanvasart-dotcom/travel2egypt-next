/**
 * Create the 10 Private Packages theme tourLanding docs. EN slugs locked
 * to legacy WP URLs (operator-confirmed session 48). No source content
 * to migrate — bodies stay empty placeholders for the editor pass.
 *
 * Notable asymmetry: theme.dahabiya-nile-cruise has Sanity slug
 *   `dahabiya-nile-cruise` but its landing page slug is
 *   `authentic-dahabiya-nile-cruise` (matches WP). This is intentional —
 *   theme slug is internal; landing slug locks SEO.
 *
 * Idempotent.
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { appendFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();
const LOG_PATH = resolve(process.cwd(), 'migration/bulk-upload-log.jsonl');

interface ThemeSpec {
  themeId: string;          // existing theme doc _id
  themeSlug: string;        // internal theme key
  landingSlug: string;      // WP-locked landing URL
  enTitle: string;
  enSummary: string;
}

const THEMES: ThemeSpec[] = [
  { themeId: 'theme-egypt-in-depth',         themeSlug: 'egypt-in-depth',          landingSlug: 'egypt-in-depth',
    enTitle: 'Egypt In-Depth Tours',
    enSummary: 'Multi-region private journeys that unpack Egypt’s history layer by layer — from the Old Kingdom pyramids to Coptic Cairo and the temples of the South.' },
  { themeId: 'theme-luxury',                 themeSlug: 'luxury',                  landingSlug: 'egypt-luxury-holidays',
    enTitle: 'Egypt Luxury Holidays',
    enSummary: 'Private Egypt itineraries paired with premium hotels, dahabiya cruises, and concierge-led access — for travelers who want comfort built into the journey.' },
  { themeId: 'theme-family-egypt',           themeSlug: 'family-egypt',            landingSlug: 'egypt-family-holidays',
    enTitle: 'Egypt Family Holidays',
    enSummary: 'Egypt itineraries paced for families — half-day starts, child-friendly guides, and accommodations that work for multi-generational parties.' },
  { themeId: 'theme-hassle-free',            themeSlug: 'hassle-free',             landingSlug: 'hassle-free-egypt',
    enTitle: 'Hassle-Free Egypt',
    enSummary: 'Egypt’s essentials in one shorter, lower-commitment package — built for first-time travelers who want a guided introduction without a two-week itinerary.' },
  { themeId: 'theme-nile-cruise',            themeSlug: 'nile-cruise',             landingSlug: 'nile-cruise-holidays',
    enTitle: 'Nile Cruise Holidays',
    enSummary: 'Egypt itineraries built around a Nile cruise leg — Aswan to Luxor (or longer) on a traditional river boat, paired with Cairo and other destinations.' },
  { themeId: 'theme-dahabiya-nile-cruise',   themeSlug: 'dahabiya-nile-cruise',    landingSlug: 'authentic-dahabiya-nile-cruise',
    enTitle: 'Authentic Dahabiya Nile Cruise',
    enSummary: 'Sail Egypt’s Nile on a small traditional dahabiya — twelve guests at most, wind-powered legs, and stops at temples the larger cruisers can’t reach.' },
  { themeId: 'theme-egypt-on-the-go',        themeSlug: 'egypt-on-the-go',         landingSlug: 'egypt-on-the-go',
    enTitle: 'Egypt On the Go',
    enSummary: 'Tighter Egypt itineraries for travelers with limited time — efficient routing through the essential sites without sacrificing operator-quality guiding.' },
  { themeId: 'theme-egypt-red-sea',          themeSlug: 'egypt-and-the-red-sea',   landingSlug: 'egypt-and-the-red-sea',
    enTitle: 'Egypt and the Red Sea',
    enSummary: 'Combined Egypt itineraries that pair the Nile and pharaonic sites with a Red Sea coastal stay — Sharm El Sheikh, Hurghada, or Marsa Alam diving and relaxation.' },
  { themeId: 'theme-special-interest',       themeSlug: 'special-interest',        landingSlug: 'special-interest-tours',
    enTitle: 'Special Interest Tours',
    enSummary: 'Egypt itineraries built around a specific interest — Coptic heritage, Islamic architecture, Egyptology field study, photography, birding, or astronomy.' },
  { themeId: 'theme-adventure',              themeSlug: 'adventure',               landingSlug: 'multiday-adventure-and-safari-tours',
    enTitle: 'Multi-day Adventure & Safari Tours',
    enSummary: 'Egypt itineraries leaning into the country’s deserts and frontiers — White Desert overnights, Siwa Oasis crossings, Bedouin camping, and 4×4 safari traverses.' },
];

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

function buildDoc(spec: ThemeSpec) {
  return {
    _id: `tourLanding.${spec.landingSlug}`,
    _type: 'tourLanding' as const,
    category: { _type: 'reference', _ref: 'tourCategory.private-package' },
    themeRef: { _type: 'reference', _ref: spec.themeId },
    title: [{ _key: 'en', _type: 'object', value: spec.enTitle }],
    slug: [{ _key: 'en', _type: 'object', value: { _type: 'slug', current: spec.landingSlug } }],
    summary: [{ _key: 'en', _type: 'object', value: spec.enSummary }],
    migration: { wpUrl: `https://travel2egypt.org/${spec.landingSlug}/` },
  };
}

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Create 10 theme tourLanding docs ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);
  const client = getClient();

  // Verify all theme docs exist
  const themeIds = THEMES.map((t) => t.themeId);
  const themesFound = await client.fetch<Array<{ _id: string }>>(`*[_id in $ids]{ _id }`, { ids: themeIds });
  const themeSet = new Set(themesFound.map((d) => d._id));
  const missing = themeIds.filter((id) => !themeSet.has(id));
  if (missing.length) die(`Missing theme docs: ${missing.join(', ')}`);

  const targetIds = THEMES.map((t) => `tourLanding.${t.landingSlug}`);
  const existing = await client.fetch<Array<{ _id: string }>>(`*[_id in $ids]{ _id }`, { ids: targetIds });
  const haveSet = new Set(existing.map((d) => d._id));
  const toCreate = THEMES.filter((t) => !haveSet.has(`tourLanding.${t.landingSlug}`));

  console.log(`Plan: create ${toCreate.length}  · already exist ${haveSet.size}`);
  for (const t of THEMES) {
    const have = haveSet.has(`tourLanding.${t.landingSlug}`);
    console.log(`  ${have ? '-' : '+'} /${t.landingSlug.padEnd(40)} theme=${t.themeSlug}`);
  }

  if (args.dryRun) { console.log('\nDry-run — no writes.'); return; }
  if (toCreate.length === 0) { console.log('Nothing to do.'); return; }

  let tx = client.transaction();
  for (const t of toCreate) tx = tx.create(buildDoc(t) as any);
  await tx.commit({ visibility: 'sync' });

  for (const t of toCreate) {
    appendLog({
      phase: 'S48-tourLanding-theme-create',
      _id: `tourLanding.${t.landingSlug}`,
      themeRef: t.themeId,
      landingSlug: t.landingSlug,
    });
  }
  console.log(`✓ Created ${toCreate.length} theme landing docs.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
