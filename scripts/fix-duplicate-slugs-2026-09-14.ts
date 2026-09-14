/**
 * Sitemap duplicate-<loc> fix (2026-09-14). The live sitemap carried three
 * duplicate URLs, each caused by two published docs sharing a localized slug:
 *
 *   1. wikiMonument wp-page-59624 (Temple of Khnum at ESNA, keeper of the slug)
 *      and wp-page-60639 (Khnum Temple at KOM OMBO) both used
 *      es `templo-de-khnum-2` / ja `クヌム神殿`. The Kom Ombo page was
 *      unreachable in ES/JA. Fix: give Kom Ombo its own ES/JA slugs, following
 *      the corpus convention for place-qualified names
 *      (es `la-tumba-de-khety-ii-en-asyut`, ja `アスユートのケティ2世の墓`).
 *
 *   2. guideArticle guideArticle.dahab.coloured-canyon (keeper: 6.4k-char body,
 *      7 inbound refs) and wp-page-59458 "The Colored Canyon" (US-spelling
 *      duplicate, 1.8k-char body) both used ja `karado-kyanion`. EN/ES 301
 *      rows for the duplicate already exist in migration/redirect-map.csv
 *      (colored-canyon → coloured-canyon); the JA URLs are identical, so no
 *      redirect row is possible or needed. Fix: retire the duplicate with the
 *      same soft-archive mechanism as scripts/guide-dedup-hide-and-redirect-
 *      2026-07-09.ts (hidden + migration.reviewFlag + migration.supersededBy),
 *      and repoint its single inbound internalLink (wp-post-209810-es) to the
 *      keeper. guideArticleBySlugQuery now excludes hidden docs, so the JA URL
 *      resolves to the keeper unambiguously.
 *
 * Writes go straight to the PUBLISHED docs (no drafts exist for any of the
 * three, verified before writing) using the production write token, exactly
 * like the other one-off production fixes in scripts/. Backups of the three
 * docs are written to backups/ before any write.
 *
 * DRY RUN by default; --apply writes. --verify re-runs the sitemap query and
 * asserts there are no duplicate (locale, path) pairs left.
 *   npx tsx scripts/fix-duplicate-slugs-2026-09-14.ts [--apply] [--verify]
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';
import { mkdirSync, writeFileSync } from 'node:fs';

const APPLY = process.argv.includes('--apply');
const VERIFY = process.argv.includes('--verify');
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
if (dataset !== 'production') throw new Error(`Refusing to run against "${dataset}".`);
const token = process.env.SANITY_PRODUCTION_API_WRITE_TOKEN;
if (!token) throw new Error('SANITY_PRODUCTION_API_WRITE_TOKEN required');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset,
  apiVersion: '2024-12-01',
  useCdn: false,
  perspective: 'raw',
  token,
});

const DATE = '2026-09-14';
const REVIEW_FLAG = 'superseded-duplicate';

// Pair 1 — monuments
const KOM_OMBO_KHNUM = 'wp-page-60639';
const ESNA_KHNUM = 'wp-page-59624';
const KOM_OMBO_ES_SLUG = 'templo-de-khnum-en-kom-ombo';
const KOM_OMBO_JA_SLUG = 'コム・オンボのクヌム神殿';

// Pair 2 — guide articles
const CANYON_KEEPER = 'guideArticle.dahab.coloured-canyon';
const CANYON_DUPLICATE = 'wp-page-59458';
const CANYON_REFERENCER = 'wp-post-209810-es';
const CANYON_REF_BLOCK_KEY = '00000000002b';
const CANYON_REF_MARKDEF_KEY = 'kg4p9ujogosk';

type SlugRow = { _key: string; current: string | null };
const slugOf = (rows: SlugRow[] | undefined, key: string) =>
  rows?.find((r) => r._key === key)?.current ?? null;

async function preflight() {
  const r = await client.fetch<{
    drafts: string[];
    kob: { slugs: SlugRow[] } | null;
    esna: { slugs: SlugRow[] } | null;
    esTaken: number;
    jaTaken: number;
    dup: { hidden: boolean | null; slugs: SlugRow[]; migration: Record<string, unknown> | null } | null;
    keeper: { _id: string } | null;
    refBlocks: number;
    refMark: { reference: { _ref: string } | null } | null;
    seeAlsoDup: string[];
  }>(
    `{
      "drafts": *[_id in [$dkob, $ddup, $dref, $dkeeper]]._id,
      "kob": *[_id == $kob][0]{ "slugs": slug[]{ _key, "current": value.current } },
      "esna": *[_id == $esna][0]{ "slugs": slug[]{ _key, "current": value.current } },
      "esTaken": count(*[_type == "wikiMonument" && $esSlug in slug[].value.current]),
      "jaTaken": count(*[_type == "wikiMonument" && $jaSlug in slug[].value.current]),
      "dup": *[_id == $dup][0]{ hidden, migration, "slugs": slug[]{ _key, "current": value.current } },
      "keeper": *[_id == $keeper][0]{ _id },
      "refBlocks": count(*[_id == $ref][0].body[_key == $blockKey]),
      "refMark": *[_id == $ref][0].body[_key == $blockKey][0].markDefs[_key == $markKey][0]{ reference },
      "seeAlsoDup": *[references($dup) && _id != $ref]._id
    }`,
    {
      dkob: `drafts.${KOM_OMBO_KHNUM}`, ddup: `drafts.${CANYON_DUPLICATE}`,
      dref: `drafts.${CANYON_REFERENCER}`, dkeeper: `drafts.${CANYON_KEEPER}`,
      kob: KOM_OMBO_KHNUM, esna: ESNA_KHNUM, esSlug: KOM_OMBO_ES_SLUG, jaSlug: KOM_OMBO_JA_SLUG,
      dup: CANYON_DUPLICATE, keeper: CANYON_KEEPER, ref: CANYON_REFERENCER,
      blockKey: CANYON_REF_BLOCK_KEY, markKey: CANYON_REF_MARKDEF_KEY,
    }
  );

  const problems: string[] = [];
  if (r.drafts.length) problems.push(`drafts exist (patch would be shadowed): ${r.drafts.join(', ')}`);
  if (!r.kob) problems.push(`${KOM_OMBO_KHNUM} not found`);
  if (!r.esna) problems.push(`${ESNA_KHNUM} not found`);
  if (r.kob && r.esna) {
    const es = slugOf(r.kob.slugs, 'es'), ja = slugOf(r.kob.slugs, 'ja');
    if (es !== slugOf(r.esna.slugs, 'es') || ja !== slugOf(r.esna.slugs, 'ja')) {
      problems.push(`Kom Ombo / Esna slugs no longer collide (es=${es}, ja=${ja}) — already fixed?`);
    }
  }
  if (r.esTaken) problems.push(`ES slug ${KOM_OMBO_ES_SLUG} already taken`);
  if (r.jaTaken) problems.push(`JA slug ${KOM_OMBO_JA_SLUG} already taken`);
  if (!r.dup) problems.push(`${CANYON_DUPLICATE} not found`);
  if (r.dup?.hidden === true) problems.push(`${CANYON_DUPLICATE} already hidden`);
  if (!r.keeper) problems.push(`${CANYON_KEEPER} not found`);
  if (r.refBlocks !== 1) problems.push(`block key ${CANYON_REF_BLOCK_KEY} matches ${r.refBlocks} blocks in ${CANYON_REFERENCER} (need exactly 1)`);
  if (r.refMark?.reference?._ref !== CANYON_DUPLICATE) problems.push(`markDef ${CANYON_REF_MARKDEF_KEY} does not point at ${CANYON_DUPLICATE} (got ${r.refMark?.reference?._ref})`);
  if (r.seeAlsoDup.length) problems.push(`unexpected extra inbound refs to ${CANYON_DUPLICATE}: ${r.seeAlsoDup.join(', ')}`);

  console.log('preflight:', JSON.stringify({
    komOmbo: r.kob?.slugs, esna: r.esna?.slugs,
    duplicate: { hidden: r.dup?.hidden ?? null, slugs: r.dup?.slugs, reviewFlag: r.dup?.migration?.reviewFlag ?? null },
    referencerMark: r.refMark,
  }, null, 1));
  if (problems.length) {
    console.error('\nPREFLIGHT FAILED:\n - ' + problems.join('\n - '));
    process.exit(1);
  }
}

async function backup() {
  mkdirSync('backups', { recursive: true });
  for (const id of [KOM_OMBO_KHNUM, CANYON_DUPLICATE, CANYON_REFERENCER]) {
    const doc = await client.getDocument(id);
    if (!doc) throw new Error(`backup: ${id} not found`);
    const path = `backups/${id}-before-dup-slug-fix-${DATE}.json`;
    writeFileSync(path, JSON.stringify(doc, null, 2));
    console.log(`backup written: ${path}`);
  }
}

async function apply() {
  // 1. Kom Ombo Khnum: own ES/JA slugs (leaf sets — _key preserved).
  await client
    .patch(KOM_OMBO_KHNUM)
    .set({
      'slug[_key=="es"].value.current': KOM_OMBO_ES_SLUG,
      'slug[_key=="ja"].value.current': KOM_OMBO_JA_SLUG,
    })
    .commit();
  console.log(`patched ${KOM_OMBO_KHNUM}: es=${KOM_OMBO_ES_SLUG} ja=${KOM_OMBO_JA_SLUG}`);

  // 2. Retire the Colored Canyon duplicate (soft archive, July mechanism).
  await client
    .patch(CANYON_DUPLICATE)
    .set({
      hidden: true,
      'migration.reviewFlag': REVIEW_FLAG,
      'migration.supersededBy': CANYON_KEEPER,
    })
    .commit();
  console.log(`patched ${CANYON_DUPLICATE}: hidden=true, supersededBy=${CANYON_KEEPER}`);

  // 3. Repoint the one inbound internalLink to the keeper (leaf-only _ref).
  await client
    .patch(CANYON_REFERENCER)
    .set({
      [`body[_key=="${CANYON_REF_BLOCK_KEY}"].markDefs[_key=="${CANYON_REF_MARKDEF_KEY}"].reference._ref`]: CANYON_KEEPER,
    })
    .commit();
  console.log(`patched ${CANYON_REFERENCER}: markDef ${CANYON_REF_MARKDEF_KEY} → ${CANYON_KEEPER}`);
}

async function verify() {
  // Same doc set the sitemap emits; assert no (locale, path) collides.
  const docs = await client.fetch<Array<{ _id: string; _type: string; slugs: SlugRow[]; parentCity: SlugRow[] | null }>>(
    `*[_type in ["city","guideArticle","tour","travelTip","wikiMonument","hotel","nileCruise","tourLanding","editorialCategory","fieldGuide"]
      && !(_id in path("drafts.**")) && !(_type == "guideArticle" && hidden == true)]{
      _id, _type, "slugs": slug[]{ _key, "current": value.current },
      "parentCity": select(_type == "guideArticle" => parentCity->slug[]{ _key, "current": value.current }, null)
    }`
  );
  const seen = new Map<string, string>();
  const dups: string[] = [];
  for (const d of docs) {
    for (const loc of ['en', 'es', 'ja']) {
      const slug = slugOf(d.slugs, loc) ?? slugOf(d.slugs, 'en');
      if (!slug) continue;
      const city = d.parentCity ? (slugOf(d.parentCity, loc) ?? slugOf(d.parentCity, 'en')) : '';
      const key = `${loc}|${d._type}|${city}|${slug}`;
      const prev = seen.get(key);
      if (prev) dups.push(`${key}: ${prev} + ${d._id}`);
      else seen.set(key, d._id);
    }
  }
  console.log(`verify: ${docs.length} docs, ${dups.length} duplicate (locale,type,path) pairs`);
  for (const d of dups) console.log('  DUP ' + d);
  if (dups.length) process.exit(1);
}

(async () => {
  console.log(`=== duplicate-slug fix — mode: ${APPLY ? 'APPLY' : 'DRY RUN'} ===`);
  if (VERIFY && !APPLY) { await verify(); return; }
  await preflight();
  if (!APPLY) { console.log('\ndry run only — pass --apply to write.'); return; }
  await backup();
  await apply();
  await verify();
})().catch((e) => { console.error(e); process.exit(1); });
