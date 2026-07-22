/**
 * import:food — the Food section's markdown importer.
 *
 * Authoring contract (see the step-5 report / frontmatter spec):
 *   - Files are named `<slug>.<locale>.md`, locale ∈ {en,es,ja}. The slug and
 *     locale come from the FILENAME (not frontmatter). Images sit in a sibling
 *     dir referenced by relative path.
 *   - YAML frontmatter carries the structured fields; the markdown body becomes
 *     Portable Text (marked → HTML → wp-import-html pipeline, localeShape
 *     'string' because foodArticle is document-per-locale like `article`).
 *
 * Model: doc-per-locale foodArticle drafts + an idempotent `tmeta.<slug>`
 * joiner (document-internationalization). Everything lands as a DRAFT — the EN
 * write upserts onto the seeded stub's id (drafts.foodArticle.<slug>.en), never
 * a duplicate; publishing stays a human act in Studio.
 *
 * Reserved-namespace note: the joiner id is `tmeta.<slug>`, NEVER
 * `translation.metadata.*` (that namespace is reserved — see the precedent in
 * scripts/create-eclipse-article.ts and migration/known-issues.md lesson 30).
 * Its refs point at the BASE (published) ids `foodArticle.<slug>.<locale>`, so
 * hreflang/language-switch resolve once a human publishes the drafts.
 *
 *   npx tsx scripts/import-food.ts --dir content/food --dry-run
 *   npx tsx scripts/import-food.ts --dir content/food --commit
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import matter from 'gray-matter';
import { marked } from 'marked';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

import { htmlToPortableText } from './wp-import-html.js';
import { uploadLocalImage, preuploadImages } from './wp-import-md/image-uploader.js';
import { FOOD_GLOSSARY_KEYS, isFoodGlossaryKey } from '../src/data/food-glossary.js';

loadEnv();

function die(m: string): never {
  process.stderr.write(`error: ${m}\n`);
  process.exit(2);
}

// ── CLI ──
const argv = process.argv.slice(2);
const commit = argv.includes('--commit');
if (!commit && !argv.includes('--dry-run')) die('pass --dry-run or --commit');
const dirArg = argv[argv.indexOf('--dir') + 1];
const DIR = resolve(process.cwd(), dirArg && !dirArg.startsWith('--') ? dirArg : 'content/food');
const dryRun = !commit;

function getClient(): SanityClient {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (dataset !== 'production') die('production only');
  const token = process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
  if (!projectId || !token) die('missing projectId/token');
  // 'raw' so we read our own drafts back when assembling the tmeta joiner.
  return createClient({ projectId, dataset, apiVersion: '2024-12-01', useCdn: false, token, perspective: 'raw' });
}

type Locale = 'en' | 'es' | 'ja';
const FORMATS = new Set(['biography', 'generations', 'route', 'practical']);
const REGIONS = new Set(['cairo', 'alexandria-coast', 'nile-south', 'oases-sinai', 'all-egypt']);
const DEFAULT_AUTHOR_SLUG = 'travel2egypt-editorial';

interface ParsedFile {
  file: string;
  absPath: string;
  slug: string;
  locale: Locale;
  fm: Record<string, unknown>;
  body: string;
}

function parseFilename(filename: string): { slug: string; locale: Locale } | null {
  const m = /^(.+)\.(en|es|ja)\.md$/.exec(filename);
  return m ? { slug: m[1], locale: m[2] as Locale } : null;
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}
/** Coerce a YAML date/string to an ISO datetime. */
function toIso(v: unknown): string | undefined {
  if (!v) return undefined;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'string') {
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  }
  return undefined;
}
/** Coerce a YAML date/string to a YYYY-MM-DD date. */
function toDate(v: unknown): string | undefined {
  const iso = toIso(v);
  return iso ? iso.slice(0, 10) : undefined;
}

/** Validate one file against the contract. Returns human-readable errors. */
function validateFile(p: ParsedFile): string[] {
  const e: string[] = [];
  const where = p.file;
  const { fm, locale } = p;

  if (!str(fm.title)) e.push(`${where}: missing required "title".`);
  const format = str(fm.format);
  if (!format) e.push(`${where}: missing required "format".`);
  else if (!FORMATS.has(format)) e.push(`${where}: invalid "format": ${format}. One of: biography | generations | route | practical.`);
  const region = str(fm.region);
  if (!region) e.push(`${where}: missing required "region".`);
  else if (!REGIONS.has(region)) e.push(`${where}: invalid "region": ${region}. One of: cairo | alexandria-coast | nile-south | oases-sinai | all-egypt.`);
  if (!toIso(fm.publishedAt)) e.push(`${where}: missing or unparseable "publishedAt". Add: publishedAt: YYYY-MM-DD.`);

  // Hardening 1 — hero alt is required whenever a hero image is present, in
  // this file's own language (the alt-text invariant).
  if (str(fm.heroImage) && !str(fm.heroAlt)) {
    e.push(`${where}: "heroImage" is set but "heroAlt" is missing. Every hero needs alt text in its own language (${locale}). Add: heroAlt: <describe the image in ${locale}>.`);
  }

  // Hardening 2 — JA articles require updatedAt (the 最終更新 line derives from it).
  if (locale === 'ja' && !toIso(fm.updatedAt)) {
    e.push(`${where}: Japanese articles require "updatedAt" — the 最終更新 line is derived from it, and a JA page without it would render a broken dateline. Add: updatedAt: YYYY-MM-DD.`);
  }

  // Hardening 3 — every dishes[] key must exist in the glossary.
  const dishes = Array.isArray(fm.dishes) ? (fm.dishes as unknown[]) : fm.dishes ? [fm.dishes] : [];
  const badDishes = dishes.filter((d) => typeof d !== 'string' || !isFoodGlossaryKey(d));
  if (badDishes.length) {
    e.push(`${where}: "dishes" contains unknown glossary key(s): ${badDishes.join(', ')}. Every dish must exist in src/data/food-glossary.ts first. Known keys: ${FOOD_GLOSSARY_KEYS.join(', ')}.`);
  }

  // Venue policy — tour/lastVerified belong only to route articles.
  if (format && format !== 'route') {
    if (str(fm.tour)) e.push(`${where}: "tour" is only allowed on route articles (format is "${format}"). Evergreen formats name no venues.`);
    if (fm.lastVerified) e.push(`${where}: "lastVerified" is only allowed on route articles (format is "${format}").`);
  }

  return e;
}

function bodyToPortableText(md: string, locale: Locale, imageMap: Map<string, { assetId: string }>, pageTitle?: string) {
  marked.setOptions({ gfm: true, breaks: false });
  let html = marked.parse(md, { async: false }) as string;
  html = html.replace(/<p>\s*(<img\b[^>]*>)\s*<\/p>/gi, '$1'); // lift standalone images to block level
  const resolver = (src: string): string | null => imageMap.get(src)?.assetId ?? null;
  // localeShape 'string': foodArticle is document-per-locale, so image alt/caption are plain strings.
  const { blocks } = htmlToPortableText(html, { attachmentResolver: resolver, localeShape: 'string', locale, pageTitle });
  return blocks;
}

const draftId = (slug: string, locale: Locale) => `drafts.foodArticle.${slug}.${locale}`;
const baseId = (id: string) => id.replace(/^drafts\./, '');

/** Idempotent upsert-and-merge of the tmeta joiner. Rebuilt from the live set
 *  of locale docs each run, so re-imports never duplicate or orphan a ref. */
async function upsertTmeta(client: SanityClient, slug: string) {
  const docs = await client.fetch<Array<{ _id: string; language?: string }>>(
    `*[_type == "foodArticle" && slug.current == $slug]{ _id, language }`,
    { slug },
  );
  const byLocale = new Map<string, string>();
  for (const d of docs) {
    if (d.language) byLocale.set(d.language, baseId(d._id)); // ref the published base id
  }
  if (byLocale.size < 2) return { locales: [...byLocale.keys()], wrote: false };

  const translations = [...byLocale.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([loc, ref]) => ({
      _key: loc,
      _type: 'internationalizedArrayReferenceValue',
      // Weak reference: the joiner points at the PUBLISHED base id, but the
      // importer only ever writes drafts, so that target may not exist yet. A
      // strong ref would fail Sanity's referential-integrity check. `_weak`
      // lets the metadata reference a draft-only translation; the
      // document-internationalization plugin strengthens it on publish.
      value: {
        _type: 'reference',
        _ref: ref,
        _weak: true,
        _strengthenOnPublish: { type: 'foodArticle' },
      },
    }));
  const tmeta = { _id: `tmeta.${slug}`, _type: 'translation.metadata', schemaTypes: ['foodArticle'], translations };
  if (!dryRun) await client.createOrReplace(tmeta);
  return { locales: [...byLocale.keys()], wrote: true };
}

async function main() {
  if (!existsSync(DIR) || !statSync(DIR).isDirectory()) die(`--dir not found: ${DIR}`);

  const files = readdirSync(DIR).filter((f) => /\.(en|es|ja)\.md$/.test(f));
  if (!files.length) die(`no <slug>.<locale>.md files in ${DIR}`);

  const parsed: ParsedFile[] = [];
  for (const file of files) {
    const fp = parseFilename(file);
    if (!fp) continue;
    const absPath = join(DIR, file);
    const raw = readFileSync(absPath, 'utf8');
    const { data, content } = matter(raw);
    parsed.push({ file, absPath, slug: fp.slug, locale: fp.locale, fm: data as Record<string, unknown>, body: content });
  }

  console.log(`\n=== import:food ===  mode: ${commit ? 'COMMIT' : 'dry-run'}  dir: ${DIR}  files: ${parsed.length}`);

  // ── Validate everything first; refuse the run on any error (no partial writes) ──
  const errors: string[] = [];
  for (const p of parsed) errors.push(...validateFile(p));

  // Cross-locale consistency for shared slugs.
  const bySlug = new Map<string, ParsedFile[]>();
  for (const p of parsed) (bySlug.get(p.slug) ?? bySlug.set(p.slug, []).get(p.slug)!).push(p);
  for (const [slug, group] of bySlug) {
    for (const field of ['format', 'region'] as const) {
      const vals = new Set(group.map((g) => str(g.fm[field])));
      if (vals.size > 1) errors.push(`${slug}: "${field}" differs across locales (${[...vals].join(', ')}). It must match.`);
    }
  }

  if (errors.length) {
    console.error(`\n✗ Refusing to import — ${errors.length} problem(s):\n`);
    for (const e of errors) console.error(`  • ${e}`);
    console.error('\nNothing was written. Fix the files and re-run.');
    process.exit(1);
  }
  console.log('✓ Validation passed.');

  const client = getClient();

  // Resolve authors + tours referenced (by slug) up front.
  const authorCache = new Map<string, string>();
  async function resolveAuthor(slug: string): Promise<string> {
    if (authorCache.has(slug)) return authorCache.get(slug)!;
    const id = await client.fetch<string | null>(`*[_type == "author" && slug.current == $slug][0]._id`, { slug });
    if (!id) die(`author "${slug}" not found. Create it in Studio or set a valid "author" slug in frontmatter.`);
    authorCache.set(slug, id);
    return id;
  }

  const touchedSlugs = new Set<string>();
  for (const p of parsed) {
    const { fm, locale, slug, body, absPath } = p;
    const dir = dirname(absPath);

    // Images: hero (frontmatter path) + inline body images, hash-deduped.
    let heroImage: Record<string, unknown> | undefined;
    const heroPath = str(fm.heroImage);
    if (heroPath) {
      const up = await uploadLocalImage(resolve(dir, heroPath), client, { dryRun });
      heroImage = {
        _type: 'image',
        asset: { _type: 'reference', _ref: up.assetId },
        alt: str(fm.heroAlt),
        ...(str(fm.heroCaption) ? { caption: str(fm.heroCaption) } : {}),
        ...(str(fm.heroCredit) ? { credit: str(fm.heroCredit) } : {}),
      };
    }
    const imageMap = await preuploadImages(body, dir, client, { dryRun });
    const bodyPt = bodyToPortableText(body, locale, imageMap, str(fm.title));

    const authorId = await resolveAuthor(str(fm.author) ?? DEFAULT_AUTHOR_SLUG);
    const format = str(fm.format)!;

    let tourRef: { _type: string; _ref: string } | undefined;
    if (format === 'route' && str(fm.tour)) {
      const tourId = await client.fetch<string | null>(
        `*[_type == "tour" && slug[_key=="en"][0].value.current == $slug][0]._id`,
        { slug: str(fm.tour) },
      );
      if (!tourId) die(`${p.file}: tour "${str(fm.tour)}" not found (by EN slug).`);
      tourRef = { _type: 'reference', _ref: tourId };
    }

    const dishes = (Array.isArray(fm.dishes) ? fm.dishes : fm.dishes ? [fm.dishes] : []) as string[];
    const seo: Record<string, unknown> = {};
    if (str(fm.metaTitle)) seo.metaTitle = str(fm.metaTitle);
    if (str(fm.metaDescription)) seo.metaDescription = str(fm.metaDescription);

    const doc = {
      _id: draftId(slug, locale),
      _type: 'foodArticle',
      language: locale,
      title: str(fm.title),
      slug: { _type: 'slug', current: slug },
      format,
      region: str(fm.region),
      ...(str(fm.deck) ? { deck: str(fm.deck) } : {}),
      author: { _type: 'reference', _ref: authorId },
      publishedAt: toIso(fm.publishedAt),
      ...(toIso(fm.updatedAt) ? { updatedAt: toIso(fm.updatedAt) } : {}),
      ...(dishes.length ? { dishes } : {}),
      ...(heroImage ? { heroImage } : {}),
      ...(tourRef ? { tour: tourRef } : {}),
      ...(format === 'route' && toDate(fm.lastVerified) ? { lastVerified: toDate(fm.lastVerified) } : {}),
      body: bodyPt,
      ...(Object.keys(seo).length ? { seo } : {}),
      migration: { source: 'import-food', migratedAt: new Date().toISOString() },
    };

    if (!dryRun) await client.createOrReplace(doc as never);
    touchedSlugs.add(slug);
    console.log(
      `  ${dryRun ? '(dry) ' : ''}${doc._id}  [${format}/${doc.region}]  body:${bodyPt.length} blocks  hero:${heroImage ? 'yes' : 'no'}  dishes:${dishes.length}`,
    );
  }

  // ── tmeta joiner per touched slug ──
  for (const slug of touchedSlugs) {
    const r = await upsertTmeta(client, slug);
    if (r.wrote) console.log(`  ${dryRun ? '(dry) ' : ''}tmeta.${slug}  ←  [${r.locales.sort().join(', ')}]`);
    else console.log(`  tmeta.${slug}  skipped (single locale: ${r.locales.join(', ') || 'none'})`);
  }

  console.log(`\n${dryRun ? 'Dry-run complete — no writes.' : `✓ Imported ${parsed.length} file(s) as drafts. Publish in Studio.`}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
