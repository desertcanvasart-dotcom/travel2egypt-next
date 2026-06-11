/**
 * Seed / verify the `conciergeLinkMap` singleton in a target Sanity dataset.
 *
 * The concierge link map is team-curated content that does NOT migrate from WP,
 * so it must be created per dataset. The runtime reads it from the ACTIVE
 * dataset (dev = migration-staging, prod = production), so production deep-
 * linking is dark until the singleton is curated in `production` — this script
 * is the pre-launch (S12) step that seeds it, plus a --dry-run that verifies
 * each intended target without writing.
 *
 * Targets are referenced by stable `_id` (the WP-import id is consistent across
 * datasets; SLUGS are not — never assume a migration-staging slug exists in
 * production, which is exactly what --dry-run checks).
 *
 * Usage:
 *   tsx scripts/seed-concierge-link-map.ts --dataset=production --dry-run
 *   tsx scripts/seed-concierge-link-map.ts --dataset=production           # writes
 *
 * Token: SANITY_SEED_TOKEN || SANITY_API_WRITE_TOKEN (prod) ||
 *        SANITY_STAGING_API_WRITE_TOKEN (staging). Read-only for --dry-run.
 */
import { createClient } from 'next-sanity';

import { resolveEntryUrl, type RawLinkEntry } from '@/lib/linkMap/resolve';

interface Seed {
  id: string;
  canonicalName: string;
  aliases: string[];
}

// The 6 verified seeds (see the Link Map session). Targets by stable _id.
// Aliases avoid cross-language homographs. Expand/curate in Studio after seeding.
const SEEDS: Seed[] = [
  { id: 'wp-page-252642', canonicalName: 'Kom Ombo', aliases: ['Temple of Kom Ombo', 'Kom Ombo Temple', 'Templo de Kom Ombo'] },
  { id: 'wp-page-59234', canonicalName: 'the Unfinished Obelisk', aliases: ['Unfinished Obelisk', 'Obelisco inacabado'] },
  { id: 'wp-page-59233', canonicalName: 'the Nubian Museum', aliases: ['Nubian Museum', 'Museo Nubio'] },
  { id: 'wp-page-59227', canonicalName: 'Elephantine Island', aliases: ['Elephantine', 'Isla Elefantina'] },
  { id: 'wp-page-59228', canonicalName: 'the Temple of Kalabsha', aliases: ['Kalabsha', 'Kalabsha Temple', 'Templo de Kalabsha'] },
  { id: 'guideArticle.abu-simbel.the-great-temple-of-abu-simbel', canonicalName: 'the Great Temple of Abu Simbel', aliases: ['Great Temple of Abu Simbel', 'Gran Templo de Abu Simbel'] },
];

const NOTE = 'seed entry — verify before launch';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : undefined;
}

const dataset = arg('--dataset') ?? process.env.SEED_DATASET ?? 'migration-staging';
const dryRun = process.argv.includes('--dry-run');
const token =
  process.env.SANITY_SEED_TOKEN ||
  (dataset === 'production' ? process.env.SANITY_API_WRITE_TOKEN : process.env.SANITY_STAGING_API_WRITE_TOKEN) ||
  process.env.SANITY_API_WRITE_TOKEN;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ufallvd2',
  dataset,
  apiVersion: '2024-10-01',
  token,
  useCdn: false,
  perspective: 'published',
});

const TARGET_QUERY = `*[_id == $id][0]{
  _type,
  "en": slug[_key=="en"][0].value.current,
  "es": slug[_key=="es"][0].value.current,
  "cityEn": parentCity->slug[_key=="en"][0].value.current,
  "cityEs": parentCity->slug[_key=="es"][0].value.current
}`;

interface Resolved {
  seed: Seed;
  exists: boolean;
  type: string | null;
  enUrl: string | null;
  esUrl: string | null;
  verdict: 'OK' | 'OK (ES omit)' | 'FAIL';
  reason: string;
}

async function resolveSeed(seed: Seed): Promise<Resolved> {
  const d = (await client.fetch(TARGET_QUERY, { id: seed.id })) as
    | { _type: string; en?: string; es?: string; cityEn?: string; cityEs?: string }
    | null;
  if (!d) return { seed, exists: false, type: null, enUrl: null, esUrl: null, verdict: 'FAIL', reason: 'doc _id not found in dataset' };
  const raw = (locale: 'en' | 'es'): RawLinkEntry => ({
    type: d._type,
    slug: locale === 'en' ? d.en : d.es,
    parentCitySlug: locale === 'en' ? d.cityEn : d.cityEs,
  });
  const enUrl = resolveEntryUrl(raw('en'), 'en');
  const esUrl = resolveEntryUrl(raw('es'), 'es');
  let verdict: Resolved['verdict'] = 'OK';
  let reason = '';
  if (!enUrl) {
    verdict = 'FAIL';
    reason = !d.en ? 'no EN slug' : `off-scope/non-indexable type ${d._type}`;
  } else if (!esUrl) {
    verdict = 'OK (ES omit)';
    reason = 'no ES slug → omitted in ES (EN-only link)';
  }
  return { seed, exists: true, type: d._type, enUrl, esUrl, verdict, reason };
}

async function run() {
  console.log(`\nconciergeLinkMap seed — dataset="${dataset}" ${dryRun ? '(DRY-RUN, no writes)' : '(WRITE)'}\n`);
  const resolved: Resolved[] = [];
  for (const s of SEEDS) resolved.push(await resolveSeed(s));

  for (const r of resolved) {
    const tag = r.verdict === 'FAIL' ? '✗' : r.verdict === 'OK (ES omit)' ? '!' : '✓';
    console.log(`  ${tag} ${r.seed.canonicalName.padEnd(34)} ${r.verdict.padEnd(13)} ${r.enUrl ?? '—'}${r.reason ? `  (${r.reason})` : ''}`);
  }
  const ok = resolved.filter((r) => r.verdict !== 'FAIL');
  const fails = resolved.filter((r) => r.verdict === 'FAIL');
  console.log(`\n  ${ok.length}/${resolved.length} resolvable; ${fails.length} would be skipped (FAIL).`);

  if (dryRun) {
    console.log(`\n  DRY-RUN — nothing written.${fails.length ? ' Resolve the FAILs (slug/id drift) before the write run.' : ' All targets present; safe to write.'}`);
    return;
  }

  const entries = ok.map((r, i) => ({
    _key: `seed${i}`,
    canonicalName: r.seed.canonicalName,
    aliases: r.seed.aliases,
    target: { _type: 'reference', _ref: r.seed.id },
    notes: NOTE,
  }));
  await client.createOrReplace({ _id: 'conciergeLinkMap', _type: 'conciergeLinkMap', entries });
  console.log(`\n  WROTE conciergeLinkMap with ${entries.length} entries to "${dataset}".`);
}

run().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
