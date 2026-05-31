/**
 * Targeted import — MS Historia boutique Nile cruise (EN/ES/JA).
 *
 * Why standalone (not bulk-import-cruises-md.ts): the bulk importer re-upserts
 * EVERY cruise from the source MD corpus, and those source files still hold the
 * pre-correction numbers (e.g. AmaDahlia "72 guests / 36+16"), so a full run would
 * clobber the Phase-2 prose fixes made directly in Sanity. This touches only Historia.
 *
 * Source: /Users/islamhussein/Downloads/All 3 langs/historia/historia-boutique-nile-cruise_{en,es,ja}_2026-05.md
 * These files use YAML frontmatter for all three locales (title, description), so we
 * parse frontmatter uniformly rather than the corpus parseEs (inline "*Meta título:*").
 * Body PT is produced via the identical marked → htmlToPortableText pipeline.
 *
 * Creates nileCruise.historia-boutique-nile-cruise (type=cruise-ship, route=nile,
 * capacity=46, tier=luxury) and deletes the orphaned junk draft drafts.wp-page-65217
 * (old WP import was a different property; no redirects/references point to it).
 *
 * migration-staging only. Dry-run by default; pass --commit.
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { readFileSync } from 'node:fs';
import { marked } from 'marked';
import { htmlToPortableText } from './wp-import-html.js';

loadEnv();

const DIR = '/Users/islamhussein/Downloads/All 3 langs/historia';
const SLUG = 'historia-boutique-nile-cruise';
const NEW_ID = `nileCruise.${SLUG}`;
const OLD_JUNK_DRAFT = 'drafts.wp-page-65217';
const LOCALES = ['en', 'es', 'ja'] as const;
type Locale = (typeof LOCALES)[number];

function parse(raw: string): { title: string; description: string; body: string } {
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!fm) throw new Error('no frontmatter');
  const meta: Record<string, string> = {};
  for (const line of fm[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].replace(/^"|"$/g, '').trim();
  }
  return { title: meta.title ?? '', description: meta.description ?? '', body: fm[2].trim() };
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  useCdn: false,
  token: process.env.SANITY_STAGING_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  perspective: 'raw',
});

async function main() {
  const commit = process.argv.includes('--commit');
  if (process.env.NEXT_PUBLIC_SANITY_DATASET !== 'migration-staging')
    throw new Error(`Refusing dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}".`);

  const nameArr: any[] = [], slugArr: any[] = [], summaryArr: any[] = [], bodyArr: any[] = [];
  for (const loc of LOCALES) {
    const raw = readFileSync(`${DIR}/historia-boutique-nile-cruise_${loc}_2026-05.md`, 'utf8');
    const { title, description, body } = parse(raw);
    const html = marked.parse(body, { async: false }) as string;
    const { blocks } = htmlToPortableText(html, { locale: loc });
    if (title) nameArr.push({ _key: loc, _type: 'object', value: title });
    slugArr.push({ _key: loc, _type: 'object', value: { _type: 'slug', current: SLUG } });
    if (description) summaryArr.push({ _key: loc, _type: 'object', value: description });
    bodyArr.push({ _key: loc, _type: 'object', value: blocks });
    console.log(`  [${loc}] title="${title}" summary=${description.length}c body=${blocks.length} blocks`);
  }

  const doc = {
    _id: NEW_ID,
    _type: 'nileCruise',
    name: nameArr,
    slug: slugArr,
    summary: summaryArr,
    body: bodyArr,
    type: 'cruise-ship',
    cruiseRoute: 'nile',
    capacity: 46,
    tier: 'luxury',
    migration: { wpUrl: `https://travel2egypt.org/${SLUG}/` },
  };

  console.log(`\nPlan: createOrReplace ${NEW_ID}; delete ${OLD_JUNK_DRAFT}`);
  if (!commit) { console.log('\nDRY RUN. Re-run with --commit.'); return; }

  await client.transaction()
    .createOrReplace(doc as any)
    .delete(OLD_JUNK_DRAFT)
    .commit({ visibility: 'async' });
  console.log(`\n✓ Created ${NEW_ID} (published) and removed junk draft ${OLD_JUNK_DRAFT}.`);
}
main().catch((e) => { console.error(e); process.exit(1); });
