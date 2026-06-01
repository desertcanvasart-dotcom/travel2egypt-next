/**
 * Import the Abusir guide pages (Giza → Places to go → Abusir) from the
 * trilingual MD corpus at "/Users/islamhussein/Downloads/All 3 langs/abusir".
 *
 * 9 topics × en/es/ja. Five OVERRIDE existing pages (title/summary/body/seo
 * replaced, slug + structural fields kept). Four are NEW guideArticles
 * (kind=attraction, section=places-to-go, placesToGoGroup="Abusir", parent=Giza)
 * added to giza.placesToGo, with sibling-convention localized slugs.
 *
 * Per the confirmed decisions:
 *   - title  = the body H1 (short heading)         e.g. "The Pyramid of Sahure"
 *   - summary= frontmatter `description`
 *   - seo    = { title: frontmatter `title` (long), description: `description` }
 *   - body   = markdown → portable text via scripts/wp-import-md/md-to-pt (H1 stripped)
 *
 * Usage:
 *   npx tsx scripts/import-abusir-pages.ts --dry-run
 *   npx tsx scripts/import-abusir-pages.ts --commit
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import matter from 'gray-matter';
import { mdToPortableText } from './wp-import-md/md-to-pt.js';
import type { Locale } from './wp-import-md/types.js';

loadEnv();

const SRC = '/Users/islamhussein/Downloads/All 3 langs/abusir';
const GIZA_ID = 'wp-page-58854';
const LOCALES: Locale[] = ['en', 'es', 'ja'];

interface Topic {
  file: string;                 // md basename (no .md)
  mode: 'override' | 'new';
  existingId?: string;          // override: doc _id (slug kept)
  slugs?: Record<Locale, string>; // new: per-locale slug
}

const TOPICS: Topic[] = [
  // ---- overrides (keep existing slugs/_ids) ----
  { file: 'pyramid-of-nyuserre', mode: 'override', existingId: 'guideArticle.giza.abusir-pyramid-of-niuserre' },
  { file: 'mastaba-of-ptahshepses-at-abusir', mode: 'override', existingId: 'guideArticle.giza.mastaba-of-ptahshepses-at-abusir' },
  { file: 'pyramid-of-khentkaus-ii', mode: 'override', existingId: 'guideArticle.giza.pyramid-of-khentkaus-ii-at-abusir' },
  { file: 'pyramid-of-neferirkare', mode: 'override', existingId: 'guideArticle.giza.pyramid-of-neferirkare-at-abusir' },
  { file: 'pyramid-of-sahure', mode: 'override', existingId: 'guideArticle.giza.pyramid-of-sahure-at-abusir' },
  // ---- new (sibling-convention slugs; localized es + ja Hepburn) ----
  { file: 'lepsius-xxiv-abusir', mode: 'new', slugs: { en: 'lepsius-xxiv-abusir', es: 'lepsius-xxiv-abusir', ja: 'abu-shiru-no-repushiusu-24' } },
  { file: 'lepsius-xxv-abusir', mode: 'new', slugs: { en: 'lepsius-xxv-abusir', es: 'lepsius-xxv-abusir', ja: 'abu-shiru-no-repushiusu-25' } },
  { file: 'pyramid-of-neferefre', mode: 'new', slugs: { en: 'pyramid-of-neferefre-at-abusir', es: 'la-piramide-de-neferefre-en-abusir', ja: 'abu-shiru-no-neferuefura-o-no-piramiddo' } },
  { file: 'unfinished-pyramid-of-shepseskare', mode: 'new', slugs: { en: 'unfinished-pyramid-of-shepseskare-at-abusir', es: 'la-piramide-inacabada-de-shepseskare-en-abusir', ja: 'abu-shiru-no-shepusesukara-o-no-piramiddo' } },
];

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

interface LE<T> { _key: string; value: T }
interface Built {
  title: LE<string>[];
  summary: LE<string>[];
  body: LE<unknown[]>[];
  seo: { title: LE<string>[]; description: LE<string>[] };
  blockCounts: Record<string, number>;
}

function buildLocalized(topic: Topic): Built {
  const title: LE<string>[] = [];
  const summary: LE<string>[] = [];
  const body: LE<unknown[]>[] = [];
  const seoTitle: LE<string>[] = [];
  const seoDesc: LE<string>[] = [];
  const blockCounts: Record<string, number> = {};

  for (const loc of LOCALES) {
    const raw = readFileSync(join(SRC, loc, `${topic.file}.md`), 'utf8');
    const { data, content } = matter(raw);
    const fmTitle = String(data.title ?? '').trim();
    const fmDesc = String(data.description ?? '').trim();

    // Extract the leading H1 as the page title, then strip it from the body.
    const h1Match = /^#\s+(.+)$/m.exec(content);
    const h1 = h1Match ? h1Match[1].trim() : fmTitle;
    const bodyMd = h1Match ? content.replace(h1Match[0], '').trim() : content.trim();

    const { blocks } = mdToPortableText(bodyMd, { locale: loc, pageTitle: h1, imageMap: new Map() });

    title.push({ _key: loc, value: h1 });
    summary.push({ _key: loc, value: fmDesc });
    body.push({ _key: loc, value: blocks });
    if (fmTitle) seoTitle.push({ _key: loc, value: fmTitle });
    if (fmDesc) seoDesc.push({ _key: loc, value: fmDesc });
    blockCounts[loc] = blocks.length;
  }
  return { title, summary, body, seo: { title: seoTitle, description: seoDesc }, blockCounts };
}

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Abusir guide import ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}   topics: ${TOPICS.length}\n`);
  const client = getClient();
  let tx = client.transaction();
  let ops = 0;
  const newRefs: Array<{ id: string; slug: string }> = [];

  for (const t of TOPICS) {
    const b = buildLocalized(t);
    const enTitle = b.title.find((x) => x._key === 'en')?.value;
    if (t.mode === 'override') {
      console.log(`✏️  override ${t.existingId}`);
      console.log(`     title.en="${enTitle}"  blocks en/es/ja=${b.blockCounts.en}/${b.blockCounts.es}/${b.blockCounts.ja}`);
      if (args.commit) {
        tx = tx.patch(t.existingId!, (p) => p.set({ title: b.title, summary: b.summary, body: b.body, seo: b.seo }));
        ops++;
      }
    } else {
      const id = `guideArticle.giza.${t.slugs!.en}`;
      const slug = LOCALES.map((loc) => ({ _key: loc, value: { _type: 'slug', current: t.slugs![loc] } }));
      console.log(`🆕 create ${id}`);
      console.log(`     title.en="${enTitle}"  slugs=${t.slugs!.en} | ${t.slugs!.es} | ${t.slugs!.ja}  blocks=${b.blockCounts.en}/${b.blockCounts.es}/${b.blockCounts.ja}`);
      newRefs.push({ id, slug: t.slugs!.en });
      if (args.commit) {
        tx = tx.createOrReplace({
          _id: id,
          _type: 'guideArticle',
          parentCity: { _type: 'reference', _ref: GIZA_ID },
          kind: 'attraction',
          section: 'places-to-go',
          placesToGoGroup: 'Abusir',
          slug,
          title: b.title,
          summary: b.summary,
          body: b.body,
          seo: b.seo,
        });
        ops++;
      }
    }
  }

  // Add the 4 new pages to giza.placesToGo (append if missing).
  if (newRefs.length) {
    const city = await client.fetch<{ placesToGo?: Array<{ _ref: string }> }>(`*[_id==$id][0]{ placesToGo }`, { id: GIZA_ID });
    const existing = new Set((city?.placesToGo ?? []).map((r) => r._ref));
    const toAdd = newRefs.filter((r) => !existing.has(r.id));
    console.log(`\nplacesToGo: ${city?.placesToGo?.length ?? 0} → +${toAdd.length} (${toAdd.map((r) => r.slug).join(', ') || 'none'})`);
    if (args.commit && toAdd.length) {
      const refs = toAdd.map((r) => ({ _type: 'reference', _ref: r.id, _key: `auto-${r.slug}` }));
      tx = tx.patch(GIZA_ID, (p) => p.setIfMissing({ placesToGo: [] }).append('placesToGo', refs));
      ops++;
    }
  }

  if (args.commit && ops > 0) { await tx.commit({ visibility: 'sync' }); console.log(`\n✓ Committed ${ops} ops.`); }
  else if (!args.commit) console.log('\nDry-run — no writes.');
}

main().catch((e) => { console.error(e); process.exit(1); });
