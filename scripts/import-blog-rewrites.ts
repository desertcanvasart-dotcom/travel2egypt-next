/**
 * Overwrite existing blog `article` docs with rewritten MD from
 * "/Users/islamhussein/Desktop/New Blog Posts" (en/es/ja).
 *
 * Blog articles use DOCUMENT-LEVEL i18n: one doc per language, with localized
 * es/ja slugs, linked by translation.metadata. The .md frontmatter `slug` is
 * always the EN slug, so es/ja files CANNOT be matched by slug. Instead:
 *   en file slug → en doc (by slug.current) → its translation.metadata group
 *   → es/ja doc _ids → overwrite each with the matching-language file.
 *
 * Per the confirmed decisions, each override replaces ONLY:
 *   - title  = frontmatter `title`
 *   - deck   = frontmatter `description`
 *   - body   = markdown → portable text (leading H1 stripped)
 * Everything else (slug/URL, language, dates, category, author, hero, seo,
 * translation links) is left untouched.
 *
 * Two posts whose file slug differs from the live slug are mapped explicitly.
 * `nmec-cairo` has no es file (skipped for es).
 *
 * Usage:
 *   npx tsx scripts/import-blog-rewrites.ts --dry-run
 *   npx tsx scripts/import-blog-rewrites.ts --commit
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import matter from 'gray-matter';
import { mdToPortableText } from './wp-import-md/md-to-pt.js';
import type { Locale } from './wp-import-md/types.js';

loadEnv();

const SRC = '/Users/islamhussein/Desktop/New Blog Posts';
const LOCALES: Locale[] = ['en', 'es', 'ja'];

// File-slug → en doc _id, for files whose slug differs from the live en slug.
const EN_ID_OVERRIDE: Record<string, string> = {
  'nmec-cairo': 'wp-post-239081-en',
  'souq-bab-el-louk': 'wp-post-153153-en',
};

interface Args { commit: boolean; dryRun: boolean }
function parseArgs(argv: string[]): Args {
  let commit = false, dryRun = false;
  for (const a of argv.slice(2)) { if (a === '--commit') commit = true; else if (a === '--dry-run') dryRun = true; else { process.stderr.write(`Unknown arg: ${a}\n`); process.exit(2); } }
  if (commit === dryRun) { process.stderr.write('Pass exactly one of --dry-run or --commit.\n'); process.exit(2); }
  return { commit, dryRun };
}
function getClient(): SanityClient {
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (dataset !== 'migration-staging') { process.stderr.write(`Refusing against ${dataset}\n`); process.exit(2); }
  const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
  if (!token) { process.stderr.write('SANITY_STAGING_API_WRITE_TOKEN required\n'); process.exit(2); }
  return createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset, apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01', useCdn: false, token, perspective: 'raw' });
}

/** Read a lang dir → map of slug → file path. Prefers frontmatter `slug`,
 * falling back to the filename (minus the `-<loc>` suffix) when it's empty. */
function indexDir(loc: Locale): Map<string, string> {
  const dir = join(SRC, loc);
  const map = new Map<string, string>();
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.md')) continue;
    const raw = readFileSync(join(dir, f), 'utf8');
    let slug = String(matter(raw).data.slug ?? '').trim();
    if (!slug) slug = f.replace(new RegExp(`-${loc}\\.md$`), '').replace(/\.md$/, '');
    if (slug) map.set(slug, join(dir, f));
  }
  return map;
}

interface FileContent { title: string; deck: string; body: unknown[]; blocks: number }
function buildFromFile(path: string, loc: Locale): FileContent {
  const { data, content } = matter(readFileSync(path, 'utf8'));
  let bodyMd = content.trim();

  // Title: frontmatter `title`, else the leading "# H1".
  let title = String(data.title ?? '').trim();
  const h1 = /^#\s+(.+)$/m.exec(bodyMd);
  if (h1) bodyMd = bodyMd.replace(h1[0], '').trim();
  if (!title && h1) title = h1[1].trim();

  // Deck: frontmatter `description`, else a leading "*italic*" lede line
  // (the no-frontmatter nmec es/ja files use this) — strip it from the body.
  let deck = String(data.description ?? '').trim();
  if (!deck) {
    const it = /^\*([^*\n].*?)\*\s*$/m.exec(bodyMd);
    if (it) { deck = it[1].trim(); bodyMd = bodyMd.replace(it[0], '').trim(); }
  }

  const { blocks } = mdToPortableText(bodyMd, { locale: loc, pageTitle: title, imageMap: new Map() });
  return { title, deck, body: blocks, blocks: blocks.length };
}

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Blog rewrites import ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);
  const client = getClient();

  const files: Record<Locale, Map<string, string>> = { en: indexDir('en'), es: indexDir('es'), ja: indexDir('ja') };
  console.log(`Files: en=${files.en.size} es=${files.es.size} ja=${files.ja.size}`);

  // Map: en slug → { en/es/ja doc ids } via translation.metadata.
  const groups = await client.fetch<Array<{ slug: string; enId: string; trans: Array<{ l: string; id: string }> }>>(
    `*[_type=="article" && language=="en" && !(_id in path("drafts.**"))]{
       "slug": slug.current, "enId": _id,
       "trans": *[_type=="translation.metadata" && references(^._id)][0].translations[]{ "l": value->language, "id": value._ref }
     }`);
  const bySlug = new Map<string, { en?: string; es?: string; ja?: string }>();
  const byEnId = new Map<string, { en?: string; es?: string; ja?: string }>();
  for (const g of groups) {
    const ids: { en?: string; es?: string; ja?: string } = {};
    for (const t of g.trans ?? []) if (t.l === 'en' || t.l === 'es' || t.l === 'ja') ids[t.l] = t.id;
    if (!ids.en) ids.en = g.enId;
    bySlug.set(g.slug, ids);
    byEnId.set(g.enId, ids);
  }

  let patched = 0, skippedNoDoc = 0, unmatched = 0;
  const perLang: Record<Locale, number> = { en: 0, es: 0, ja: 0 };
  const unmatchedSlugs: string[] = [];
  let tx = client.transaction();
  let ops = 0, batch = 0;
  const samples: string[] = [];

  for (const [slug, enPath] of files.en) {
    let ids = bySlug.get(slug);
    if (!ids && EN_ID_OVERRIDE[slug]) ids = byEnId.get(EN_ID_OVERRIDE[slug]);
    if (!ids) { unmatched++; unmatchedSlugs.push(slug); continue; }

    for (const loc of LOCALES) {
      const path = loc === 'en' ? enPath : files[loc].get(slug);
      const docId = ids[loc];
      if (!path) continue;          // no file for this locale (e.g. es nmec-cairo)
      if (!docId) { skippedNoDoc++; continue; }
      const fc = buildFromFile(path, loc);
      // Never wipe title/deck with an empty value — only set what we have.
      const setOps: Record<string, unknown> = { body: fc.body };
      if (fc.title) setOps.title = fc.title;
      if (fc.deck) setOps.deck = fc.deck;
      if (samples.length < 6 && loc === 'en') samples.push(`  [${slug}] → ${docId}  title="${fc.title}"  blocks=${fc.blocks}`);
      if (args.commit) {
        tx = tx.patch(docId, (p) => p.set(setOps));
        ops++; batch++;
        if (batch >= 50) { await tx.commit({ visibility: 'sync' }); tx = client.transaction(); batch = 0; }
      }
      patched++; perLang[loc]++;
    }
  }
  if (args.commit && batch > 0) await tx.commit({ visibility: 'sync' });

  console.log(`\n=== Summary ===`);
  console.log(`Docs patched:        ${patched}  (en=${perLang.en} es=${perLang.es} ja=${perLang.ja})`);
  console.log(`Skipped (no doc):    ${skippedNoDoc}`);
  console.log(`Unmatched en slugs:  ${unmatched}${unmatchedSlugs.length ? ' → ' + unmatchedSlugs.join(', ') : ''}`);
  console.log(`\nSamples (en):\n${samples.join('\n')}`);
  if (!args.commit) console.log('\nDry-run — no writes.');
  else console.log(`\n✓ Committed.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
