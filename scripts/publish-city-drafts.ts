/**
 * Publish city drafts that hold a hero image not yet on the published doc.
 *
 * Cities have drafts.<id> with heroImage set, but the published doc is
 * missing it, so the front end (which reads published) shows no image.
 * This promotes each draft to published.
 *
 * Mechanics per city (mirrors Studio "Publish"):
 *   1. createOrReplace the published doc with the draft's content
 *      (stripping the `drafts.` _id prefix).
 *   2. delete the draft.
 *
 * Safety:
 *   - Refuses to run against any dataset other than migration-staging.
 *   - Dry-run by default; --commit required to write.
 *   - Skips drafts that do not actually carry a heroImage (e.g. nuweiba,
 *     soft-archived in Phase 3e). Pass --include-no-hero to override.
 *   - Prints a per-city plan (what other fields changed in the draft vs
 *     published) so you can spot unexpected co-edits before publishing.
 *
 * Usage:
 *   npx tsx scripts/publish-city-drafts.ts --dry-run
 *   npx tsx scripts/publish-city-drafts.ts --commit
 */
import { createClient, type SanityClient, type SanityDocument } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();

interface Args {
  commit: boolean;
  dryRun: boolean;
  includeNoHero: boolean;
}

function parseArgs(argv: string[]): Args {
  let commit = false;
  let dryRun = false;
  let includeNoHero = false;
  for (const arg of argv.slice(2)) {
    if (arg === '--commit') commit = true;
    else if (arg === '--dry-run') dryRun = true;
    else if (arg === '--include-no-hero') includeNoHero = true;
    else die(`Unknown argument: ${arg}`);
  }
  if (commit === dryRun) {
    die('Pass exactly one of --dry-run or --commit.');
  }
  return { commit, dryRun, includeNoHero };
}

function die(msg: string): never {
  process.stderr.write(`error: ${msg}\n`);
  process.exit(2);
}

function getClient(_forWrites: boolean): SanityClient {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (!projectId || !dataset) {
    die('NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET must be set in .env');
  }
  if (dataset !== 'migration-staging') {
    die(`Refusing to run against dataset "${dataset}". This script operates on migration-staging only.`);
  }
  // Drafts are token-gated for reads as well, so the token is required in
  // dry-run mode too — without it the script sees zero drafts.
  // migration-staging uses a separate token from production.
  const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
  if (!token) {
    die('SANITY_STAGING_API_WRITE_TOKEN must be set in .env (drafts cannot be read without it).');
  }
  return createClient({
    projectId,
    dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
    useCdn: false,
    token,
    perspective: 'raw',
  });
}

interface DraftRow {
  _id: string;
  heroImageRef: string | null;
  slug: string | null;
  publishedHeroRef: string | null;
  changedFields: string[];
}

const SCOPE_QUERY = `*[_type == "city" && _id in path("drafts.**")]{
  _id,
  "heroImageRef": heroImage.asset._ref,
  "slug": slug[_key=="en"][0].value.current,
  "publishedHeroRef": *[_id == string::split(^._id, "drafts.")[1]][0].heroImage.asset._ref,
  "draftKeys":     array::unique(string::split(string::join(@ {...}, ""), "")) // placeholder, replaced below
} | order(slug asc)`;

// We need a field-diff to warn about co-edits. The trick: fetch the full
// draft and full published, then diff keys whose serialized JSON differs.
const FULL_QUERY = `{
  "drafts":    *[_type == "city" && _id in path("drafts.**")] | order(_id asc),
  "published": *[_type == "city" && !(_id in path("drafts.**"))] | order(_id asc),
}`;

function publishedIdOf(draftId: string): string {
  return draftId.replace(/^drafts\./, '');
}

function diffKeys(draft: SanityDocument, published: SanityDocument | undefined): string[] {
  const skip = new Set(['_id', '_rev', '_createdAt', '_updatedAt', '_system']);
  const keys = new Set<string>([
    ...Object.keys(draft),
    ...(published ? Object.keys(published) : []),
  ]);
  const changed: string[] = [];
  for (const k of keys) {
    if (skip.has(k)) continue;
    const a = JSON.stringify((draft as Record<string, unknown>)[k] ?? null);
    const b = JSON.stringify((published as Record<string, unknown> | undefined)?.[k] ?? null);
    if (a !== b) changed.push(k);
  }
  return changed.sort();
}

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Publish city drafts (heroImage promotion) ===`);
  console.log(`mode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);

  const client = getClient(args.commit);
  const { drafts, published } = await client.fetch<{
    drafts: SanityDocument[];
    published: SanityDocument[];
  }>(FULL_QUERY);

  const publishedById = new Map(published.map((p) => [p._id, p]));

  const rows: DraftRow[] = drafts.map((d) => {
    const pubId = publishedIdOf(d._id);
    const pub = publishedById.get(pubId);
    const draftHero = (d.heroImage as { asset?: { _ref?: string } } | undefined)?.asset?._ref ?? null;
    const pubHero = (pub?.heroImage as { asset?: { _ref?: string } } | undefined)?.asset?._ref ?? null;
    const slugArr = (d.slug as Array<{ _key: string; value: { current: string } }> | undefined) ?? [];
    const enSlug = slugArr.find((s) => s._key === 'en')?.value?.current ?? null;
    return {
      _id: d._id,
      heroImageRef: draftHero,
      publishedHeroRef: pubHero,
      slug: enSlug,
      changedFields: diffKeys(d, pub),
    };
  });

  const toPublish = rows.filter((r) => args.includeNoHero || r.heroImageRef);
  const skipped = rows.filter((r) => !args.includeNoHero && !r.heroImageRef);

  console.log(`drafts found:           ${rows.length}`);
  console.log(`will publish:           ${toPublish.length}`);
  console.log(`skipped (no heroImage): ${skipped.length}\n`);

  if (skipped.length) {
    console.log('Skipped:');
    for (const r of skipped) console.log(`  - ${r.slug ?? r._id}`);
    console.log('');
  }

  console.log('Plan:');
  for (const r of toPublish) {
    const newHero = r.publishedHeroRef ? '' : '  [+heroImage]';
    const co = r.changedFields.filter((k) => k !== 'heroImage');
    const coTag = co.length ? `  co-edits: ${co.join(', ')}` : '';
    console.log(`  - ${r.slug ?? r._id}${newHero}${coTag}`);
  }
  console.log('');

  if (args.dryRun) {
    console.log('Dry run — no writes. Re-run with --commit to apply.');
    return;
  }

  const draftById = new Map(drafts.map((d) => [d._id, d]));
  let ok = 0;
  let failed = 0;
  for (const r of toPublish) {
    const draft = draftById.get(r._id);
    if (!draft) {
      console.error(`! missing draft body for ${r._id}`);
      failed++;
      continue;
    }
    const pubId = publishedIdOf(r._id);
    const { _id, _rev, _createdAt, _updatedAt, ...rest } = draft as SanityDocument & {
      _createdAt?: string;
      _updatedAt?: string;
    };
    const newDoc = { _id: pubId, ...rest };
    try {
      await client
        .transaction()
        .createOrReplace(newDoc as SanityDocument)
        .delete(r._id)
        .commit({ visibility: 'async' });
      console.log(`✓ ${r.slug ?? r._id}`);
      ok++;
    } catch (err) {
      console.error(`✗ ${r.slug ?? r._id}: ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\nDone. published=${ok} failed=${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
