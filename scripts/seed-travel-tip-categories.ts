/**
 * Seed the 6 `travelTipCategory` documents into migration-staging.
 *
 * Pre-flight prerequisite for session 6.5b's `travelTip` writes: the
 * 17–18 country-level travelTips landed in 6.5b reference these category
 * docs by `_id`, so they must exist first.
 *
 * Pattern derives from `scripts/seed.ts:2154-2178` (createOrReplace with
 * full editorial content + i18n helpers) but targets migration-staging
 * via `SANITY_STAGING_API_WRITE_TOKEN` rather than production. Idempotent:
 * re-runs overwrite with the same canonical content.
 *
 * Run: `npm run seed:travel-tip-categories`.
 *
 * Editorial content locked in session 6.5a Phase 1.2 (Islam approval
 * 2026-05-03). Names + slugs + EN descriptions per the locked table in
 * `migration/known-issues.md` "Session 6.5a close" (forthcoming) and the
 * 1.2 surface. ES/JA descriptions intentionally deferred — the
 * `internationalizedArrayText` schema treats absent locales as untranslated;
 * editorial Studio work post-cutover (or session 6.5b) populates them.
 *
 * Sister-script note: `scripts/seed.ts` is the production-targeted seed for
 * city-guide demo content. `ensureMigrationStagingSeed` in
 * `scripts/wp-import.ts` populates the legacy-archive author + 2
 * editorialCategory docs into staging at every wp-import run via
 * `createIfNotExists`. This script keeps the travelTipCategory docs as a
 * standalone unit so they can be re-seeded without running a full import.
 */

import 'dotenv/config';
import { createClient } from '@sanity/client';

const REQUIRED_DATASET = 'migration-staging';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
const dataset = process.env.SANITY_STAGING_DATASET ?? REQUIRED_DATASET;

if (!projectId) {
  console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID');
  process.exit(1);
}
if (!token) {
  console.error(
    'Missing SANITY_STAGING_API_WRITE_TOKEN. See migration/MIGRATION_MAPPING.md §1 for the staging token setup. Do NOT reuse SANITY_API_WRITE_TOKEN (the production token).'
  );
  process.exit(1);
}
if (dataset !== REQUIRED_DATASET) {
  console.error(
    `Refusing to seed: SANITY_STAGING_DATASET="${dataset}" but this script only writes to "${REQUIRED_DATASET}". Belt-and-braces on top of env.ts's check.`
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2024-10-01',
  useCdn: false,
  perspective: 'raw',
});

const i18nName = (en: string, es: string, ja: string) => [
  { _key: 'en', value: en },
  { _key: 'es', value: es },
  { _key: 'ja', value: ja },
];

const i18nSlug = (en: string, es: string, ja: string) => [
  { _key: 'en', _type: 'object', value: { _type: 'slug', current: en } },
  { _key: 'es', _type: 'object', value: { _type: 'slug', current: es } },
  { _key: 'ja', _type: 'object', value: { _type: 'slug', current: ja } },
];

/**
 * EN-only description. ES/JA entries intentionally absent; the
 * internationalizedArrayText schema treats missing locales as untranslated.
 * Editorial Studio fills ES/JA post-write.
 */
const enOnlyDescription = (en: string) => [{ _key: 'en', value: en }];

interface SeedDoc {
  _id: string;
  _type: 'travelTipCategory';
  name: ReturnType<typeof i18nName>;
  slug: ReturnType<typeof i18nSlug>;
  description: ReturnType<typeof enOnlyDescription>;
  orderRank: number;
}

const docs: SeedDoc[] = [
  {
    _id: 'travelTipCategory-getting-around',
    _type: 'travelTipCategory',
    name: i18nName('Getting around', 'Cómo desplazarse', '移動と交通'),
    slug: i18nSlug('getting-around', 'como-desplazarse', 'getting-around'),
    description: enOnlyDescription(
      'The infrastructure of moving through Egypt — airports, internal flights, drivers, the math of when each makes sense.'
    ),
    orderRank: 10,
  },
  {
    _id: 'travelTipCategory-practical-essentials',
    _type: 'travelTipCategory',
    name: i18nName('Practical essentials', 'Lo práctico', '実用情報'),
    slug: i18nSlug('practical-essentials', 'lo-practico', 'practical-essentials'),
    description: enOnlyDescription(
      'The flat-fact inventory of how Egypt works on the ground — power, water, language, signal, time.'
    ),
    orderRank: 20,
  },
  {
    _id: 'travelTipCategory-culture-and-money',
    _type: 'travelTipCategory',
    name: i18nName('Culture and custom', 'Cultura y costumbre', '文化と慣習'),
    slug: i18nSlug('culture-and-money', 'cultura-y-costumbre', 'culture-and-money'),
    description: enOnlyDescription(
      'Tipping, bargaining, etiquette — the social fabric that determines whether a transaction feels generous or extracted.'
    ),
    orderRank: 30,
  },
  {
    _id: 'travelTipCategory-when-to-go',
    _type: 'travelTipCategory',
    name: i18nName('When to go', 'Cuándo viajar', 'いつ訪れるか'),
    slug: i18nSlug('when-to-go', 'cuando-viajar', 'when-to-go'),
    description: enOnlyDescription(
      "Seasons, religious calendar, the months we recommend and the months we don't."
    ),
    orderRank: 40,
  },
  {
    _id: 'travelTipCategory-food',
    _type: 'travelTipCategory',
    name: i18nName('Food', 'Gastronomía', '食'),
    slug: i18nSlug('food', 'gastronomia', 'food'),
    description: enOnlyDescription(
      "What Egyptian cooking actually is — the long lunch, the bread, where to eat the things tourists don't usually see."
    ),
    orderRank: 50,
  },
  {
    _id: 'travelTipCategory-traveler-segments',
    _type: 'travelTipCategory',
    name: i18nName('For specific travelers', 'Para viajeros específicos', '旅行者別の覚書'),
    slug: i18nSlug('traveler-segments', 'viajeros-especificos', 'traveler-segments'),
    description: enOnlyDescription(
      "Solo women, vegetarians, travelers with mobility needs — what changes about the trip when you're not the assumed default."
    ),
    orderRank: 60,
  },
];

async function main(): Promise<void> {
  process.stderr.write(
    `[seed:travel-tip-categories] dataset=${dataset} writing ${docs.length} travelTipCategory docs...\n`
  );
  for (const doc of docs) {
    await client.createOrReplace(doc as any);
    process.stderr.write(`  ✓ ${doc._id}\n`);
  }
  process.stderr.write(`[seed:travel-tip-categories] done.\n`);
}

main().catch((err: Error) => {
  process.stderr.write(`[seed:travel-tip-categories] FATAL: ${err.message}\n`);
  process.exit(1);
});
