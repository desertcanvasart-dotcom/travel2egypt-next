/**
 * Hotels bulk import — EN/ES/JA MD corpus → migration-staging.
 *
 * Source: /Users/islamhussein/Downloads/All 3 langs/{en,es,ja}/hotels/
 *
 * Operator-confirmed decisions (session, 2026-05-28):
 *   • For 5 BRAND-CHANGE rebrands: rename Sanity slug to new brand,
 *     add 301 from old slug → new (×3 locales).
 *   • For other slug-rename cases (21): keep Sanity slug (legacy WP
 *     URL SEO preservation), update content under existing _id.
 *   • Promote 5 hidden guideArticles to hotel docs (delete source,
 *     create hotel, add /guide/<city>/<slug> → /hotels/<slug> redirect
 *     ×3 locales).
 *   • Ignore tropitel-naama-bay-sharm (JA-only file, no EN — defer).
 *
 * Refuses to run against any dataset other than migration-staging.
 * Idempotent.
 *
 * Usage:
 *   npx tsx scripts/bulk-import-hotels-md.ts --dry-run
 *   npx tsx scripts/bulk-import-hotels-md.ts --commit
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { readdirSync, readFileSync, appendFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { marked } from 'marked';

import { htmlToPortableText } from './wp-import-html.js';

loadEnv();

const CORPUS_ROOT = '/Users/islamhussein/Downloads/All 3 langs';
const LOG_PATH = resolve(process.cwd(), 'migration/bulk-upload-log.jsonl');
const REDIRECT_CSV_PATH = resolve(process.cwd(), 'migration/redirect-map.csv');
const LOCALES = ['en', 'es', 'ja'] as const;
type Locale = (typeof LOCALES)[number];

// ──────────────────────────────────────────────────────────────────────────
// Mapping tables
// ──────────────────────────────────────────────────────────────────────────

/**
 * Derived-filename slug → canonical Sanity slug. Only contains entries where
 * the filename slug differs from the canonical (i.e. EN MD slug ≠ Sanity slug,
 * or JA brand-rename ≠ canonical).
 */
const FILENAME_TO_CANONICAL: Record<string, string> = {
  // ── EN MD renames where Sanity slug wins (legacy WP URL SEO) ───────────
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

  // ── JA brand-rename mappings ───────────────────────────────────────────
  // (JA file → final canonical slug; e.g. JA still says Sofitel but the
  //  canonical post-rebrand slug is the new Mandarin Oriental slug.)
  'sofitel-legend-old-cataract': 'mandarin-oriental-old-cataract-aswan',
  'sofitel-pavillon-winter-luxor': 'mandarin-oriental-winter-palace-luxor',
  'grand-nile-tower-hotel-cairo': 'hilton-cairo-grand-nile',
  'sharm-dreams-resort': 'jaz-sharm-dreams-resort',

  // ── JA cosmetic renames (different naming, same hotel) ─────────────────
  'helnan-palestine-hotel': 'helnan-palestine-hotel-alexandria',
  'le-passage-cairo-hotel': 'le-passage-cairo-hotel-and-casino',
  'naama-bay-promenade-resort': 'naama-bay-promenade-beach-resort-by-accor',
  'semiramis-intercontinental': 'intercontinental-cairo-semiramis',
};

/**
 * Brand-change rename plan: old Sanity slug → new canonical slug. For each
 * entry the importer (a) patches the existing Sanity doc's slug, (b) adds
 * a 301 redirect (×3 locales) from the old hotels URL to the new.
 */
const SANITY_SLUG_RENAMES: Record<string, string> = {
  'sofitel-legend-old-cataract':        'mandarin-oriental-old-cataract-aswan',
  'sofitel-pavillon-winter-luxor':      'mandarin-oriental-winter-palace-luxor',
  'grand-nile-tower-hotel-cairo':       'hilton-cairo-grand-nile',
  'sharm-dreams-resort-sharm-el-sheikh':'jaz-sharm-dreams-resort',
  'four-seasons-resort-sharm-alsheikh': 'the-four-seasons-at-sharm',
};

/**
 * 5 hidden guideArticles being promoted to hotel docs. Operator-confirmed
 * 2026-05-28 — the source guideArticles are deleted and a redirect from
 * /guide/<city>/<old-slug> → /hotels/<new-slug> is added (×3 locales).
 */
interface PromoteSpec { guideArticleId: string; oldSlug: string; city: string }
const PROMOTE_FROM_GUIDE_ARTICLE: Record<string, PromoteSpec> = {
  'dusit-thani-lake-view':        { guideArticleId: 'wp-page-63832', oldSlug: 'dusit-thani-lake-view-cairo',        city: 'cairo' },
  'ghaliet-siwa-ecolodge':        { guideArticleId: 'wp-page-64034', oldSlug: 'ghaliet-ecolodge-siwa',              city: 'siwa-oasis' },
  'shamsiya-camp-dakhla-oasis':   { guideArticleId: 'wp-page-64048', oldSlug: 'shamsiya-camp-dakhla-oasis',         city: 'dakhla-oasis' },
  'al-tabuna-camp-dakhla-oasis':  { guideArticleId: 'wp-page-64054', oldSlug: 'al-tabuna-camp-el-dakhla-oasis',     city: 'dakhla-oasis' },
  'la-maison-bleue-el-gouna':     { guideArticleId: 'wp-page-77016', oldSlug: 'la-maison-bleue-el-gouna',           city: 'al-gouna' },
};

/** JA-only filenames to skip on import per operator decision. */
const SKIP_FILENAMES = new Set<string>([
  'tropitel-naama-bay-sharm', // JA-only, defer until EN MD exists
]);

// ──────────────────────────────────────────────────────────────────────────
// Args + client
// ──────────────────────────────────────────────────────────────────────────

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

// ──────────────────────────────────────────────────────────────────────────
// Filename → canonical slug derivation
// ──────────────────────────────────────────────────────────────────────────

function deriveBaseSlug(filename: string): string {
  let s = filename.replace(/\.md$/i, '');
  s = s.replace(/_(en|es|ja)_\d{4}-\d{2}$/i, '');
  return s.toLowerCase();
}

function canonicalize(filename: string): string {
  const base = deriveBaseSlug(filename);
  return FILENAME_TO_CANONICAL[base] ?? base;
}

// ──────────────────────────────────────────────────────────────────────────
// Per-locale parsers (re-used patterns from travel-tips import)
// ──────────────────────────────────────────────────────────────────────────

interface Parsed {
  title: string;
  description: string;
  city: string | null;
  body: string;
}

function parseEn(raw: string): Parsed | null {
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!fm) return null;
  const meta: Record<string, string> = {};
  for (const line of fm[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].replace(/^"|"$/g, '').trim();
  }
  let body = fm[2];
  // Strip leading "**Meta Title:** ... **Meta Description:** ... ---" block
  const stripped = body.match(/^\s*\*\*Meta Title:?\*\*[\s\S]*?\*\*Meta Description:?\*\*[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
  if (stripped) body = stripped[1];
  return {
    title: meta.title ?? '',
    description: meta.description ?? '',
    city: meta.city ? meta.city.trim() || null : null,
    body: body.trim(),
  };
}

function parseEs(raw: string): Parsed | null {
  const lines = raw.split(/\r?\n/);
  let titleEs = ''; let descEs = '';
  const tMatch = raw.match(/^\s*\*Meta t[ií]tulo:\s*([\s\S]*?)\*/m);
  if (tMatch) titleEs = tMatch[1].trim();
  const dMatch = raw.match(/^\s*\*Meta descripci[oó]n:\s*([\s\S]*?)\*/m);
  if (dMatch) descEs = dMatch[1].trim();
  // body starts after the dash-bracketed standfirst OR after the 3rd bold line
  let bodyStart = 0; let boldCount = 0; let foundDash = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('**') && line.endsWith('**') && line.length > 4) boldCount++;
    if (line.startsWith('—') && line.endsWith('—') && line.length > 4) foundDash = true;
    if (foundDash) { bodyStart = i + 1; break; }
    if (boldCount >= 3 && line === '') bodyStart = i + 1;
  }
  const body = lines.slice(bodyStart).join('\n').trim();
  if (!titleEs && !descEs && body.length < 100) return null;
  return { title: titleEs, description: descEs, city: null, body };
}

function parseJa(raw: string): Parsed | null {
  const lines = raw.split(/\r?\n/);
  let titleJa = ''; let descJa = ''; let bodyStart = 0;
  let foundTitle = false; let foundDash = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!foundTitle) {
      const m = line.match(/^\*\*(.+?)\*\*$/);
      if (m) { titleJa = m[1].trim(); foundTitle = true; continue; }
    }
    if (foundTitle && !foundDash) {
      const m = line.match(/^[—-]\s*(.+?)\s*[—-]$/);
      if (m) { descJa = m[1].trim(); foundDash = true; bodyStart = i + 1; break; }
    }
  }
  if (!foundDash) {
    bodyStart = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().match(/^\*\*.+\*\*$/)) { bodyStart = i + 1; break; }
    }
  }
  const body = lines.slice(bodyStart).join('\n').trim();
  if (!titleJa && body.length < 100) return null;
  return { title: titleJa, description: descJa, city: null, body };
}

// ──────────────────────────────────────────────────────────────────────────
// Walk corpus
// ──────────────────────────────────────────────────────────────────────────

function findLocaleFolder(locale: Locale): string | null {
  const variants = [
    join(CORPUS_ROOT, locale, 'hotels'),
    join(CORPUS_ROOT, locale, 'hotels '),
  ];
  for (const p of variants) if (existsSync(p) && statSync(p).isDirectory()) return p;
  return null;
}

interface PerLocale { title: string; description: string; city: string | null; bodyPt: any[] }
interface Record_ {
  canonicalSlug: string;
  perLocale: Partial<Record<Locale, PerLocale>>;
  sourceFiles: Partial<Record<Locale, string>>;
}

// ──────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Hotels bulk import ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);
  const client = getClient();

  // ── Walk MD + parse ────────────────────────────────────────────────────
  console.log('Walking corpus…');
  const recsByKey = new Map<string, Record_>();
  const warnings: string[] = [];
  const skipped: string[] = [];

  for (const locale of LOCALES) {
    const dir = findLocaleFolder(locale);
    if (!dir) { warnings.push(`Missing folder for locale ${locale}`); continue; }
    for (const file of readdirSync(dir).filter((n) => n.endsWith('.md'))) {
      const base = deriveBaseSlug(file);
      if (SKIP_FILENAMES.has(base)) { skipped.push(`${locale}/${file}`); continue; }
      const canonical = canonicalize(file);

      const raw = readFileSync(join(dir, file), 'utf8');
      let parsed: Parsed | null = null;
      if (locale === 'en') parsed = parseEn(raw);
      else if (locale === 'es') parsed = parseEs(raw);
      else parsed = parseJa(raw);
      if (!parsed) { warnings.push(`${locale}/${file}: parser returned null`); continue; }

      const html = marked.parse(parsed.body, { async: false }) as string;
      const { blocks: bodyPt } = htmlToPortableText(html, { locale });

      if (!recsByKey.has(canonical)) {
        recsByKey.set(canonical, { canonicalSlug: canonical, perLocale: {}, sourceFiles: {} });
      }
      const rec = recsByKey.get(canonical)!;
      rec.perLocale[locale] = { title: parsed.title, description: parsed.description, city: parsed.city, bodyPt };
      rec.sourceFiles[locale] = file;
    }
  }
  const records = [...recsByKey.values()].sort((a, b) => a.canonicalSlug.localeCompare(b.canonicalSlug));
  console.log(`  parsed ${records.length} unique canonical slugs from MD`);
  console.log(`  skipped ${skipped.length} files per rules`);

  // ── Resolve existing Sanity hotels ─────────────────────────────────────
  const sanityHotels = await client.fetch<Array<{ _id: string; slug: string }>>(
    `*[_type=='hotel' && !(_id in path('drafts.**'))]{ _id, "slug": slug[_key=='en'][0].value.current }`,
  );
  const idBySlug = new Map<string, string>();
  for (const h of sanityHotels) if (h.slug) idBySlug.set(h.slug, h._id);
  console.log(`  ${sanityHotels.length} existing hotel docs indexed`);

  // ── Resolve city slug → city _id ───────────────────────────────────────
  const cities = await client.fetch<Array<{ _id: string; slug: string }>>(
    `*[_type=='city' && !(_id in path('drafts.**'))]{ _id, "slug": slug[_key=='en'][0].value.current }`,
  );
  const cityIdBySlug = new Map<string, string>();
  for (const c of cities) if (c.slug) cityIdBySlug.set(c.slug, c._id);

  // ── Plan ────────────────────────────────────────────────────────────────
  interface Op {
    kind: 'upsert' | 'rename-upsert' | 'create' | 'promote-create';
    canonicalSlug: string;
    _id: string;
    oldSlug?: string;             // for renames
    promoteFrom?: PromoteSpec;    // for promotions
    perLocale: Record_['perLocale'];
    sourceFiles: Record_['sourceFiles'];
  }
  const ops: Op[] = [];
  const renameRedirects: string[] = [];
  const promoteRedirects: string[] = [];

  // Build reverse-lookup: for each canonical, is there a SANITY_SLUG_RENAMES entry?
  const renameSourceByCanonical: Record<string, string> = {};
  for (const [oldSlug, newCanonical] of Object.entries(SANITY_SLUG_RENAMES)) {
    renameSourceByCanonical[newCanonical] = oldSlug;
  }

  for (const rec of records) {
    const canonical = rec.canonicalSlug;

    // Case 1: brand-change rename. Find by OLD Sanity slug, patch slug to new.
    if (renameSourceByCanonical[canonical]) {
      const oldSlug = renameSourceByCanonical[canonical];
      const existingId = idBySlug.get(oldSlug);
      if (!existingId) {
        warnings.push(`Brand-rename target ${canonical}: existing Sanity slug "${oldSlug}" not found`);
        continue;
      }
      ops.push({ kind: 'rename-upsert', canonicalSlug: canonical, _id: existingId, oldSlug,
        perLocale: rec.perLocale, sourceFiles: rec.sourceFiles });
      // Add redirects ×3 locales
      for (const loc of LOCALES) {
        const prefix = loc === 'en' ? '' : `/${loc}`;
        renameRedirects.push(`${prefix}/hotels/${oldSlug},${prefix}/hotels/${canonical},301`);
      }
      continue;
    }

    // Case 2: promotion from guideArticle.
    if (PROMOTE_FROM_GUIDE_ARTICLE[canonical]) {
      const spec = PROMOTE_FROM_GUIDE_ARTICLE[canonical];
      ops.push({ kind: 'promote-create', canonicalSlug: canonical, _id: `hotel.${canonical}`,
        promoteFrom: spec, perLocale: rec.perLocale, sourceFiles: rec.sourceFiles });
      // Add redirects: /guide/<city>/<oldSlug> → /hotels/<canonical> ×3 locales
      for (const loc of LOCALES) {
        const prefix = loc === 'en' ? '' : `/${loc}`;
        promoteRedirects.push(`${prefix}/guide/${spec.city}/${spec.oldSlug},${prefix}/hotels/${canonical},301`);
      }
      continue;
    }

    // Case 3: direct upsert if existing Sanity doc has matching slug.
    const existingId = idBySlug.get(canonical);
    if (existingId) {
      ops.push({ kind: 'upsert', canonicalSlug: canonical, _id: existingId,
        perLocale: rec.perLocale, sourceFiles: rec.sourceFiles });
      continue;
    }

    // Case 4: truly new hotel doc.
    ops.push({ kind: 'create', canonicalSlug: canonical, _id: `hotel.${canonical}`,
      perLocale: rec.perLocale, sourceFiles: rec.sourceFiles });
  }

  const byKind: Record<string, number> = {};
  for (const o of ops) byKind[o.kind] = (byKind[o.kind] ?? 0) + 1;
  console.log(`\nPlan:`);
  for (const [k, v] of Object.entries(byKind).sort()) console.log(`  ${k.padEnd(20)} ${v}`);
  console.log(`  rename-redirects:    ${renameRedirects.length}`);
  console.log(`  promote-redirects:   ${promoteRedirects.length}`);
  console.log(`  guideArticle deletes: ${ops.filter((o) => o.kind === 'promote-create').length}`);
  if (warnings.length) {
    console.log(`\nWarnings (${warnings.length}):`);
    for (const w of warnings.slice(0, 12)) console.log(`  · ${w}`);
  }

  // ── Dry-run output ──────────────────────────────────────────────────────
  if (args.dryRun) {
    console.log('\n--- per-doc plan ---');
    for (const op of ops) {
      const locs = LOCALES.filter((l) => op.perLocale[l]).join('+');
      const enLen = op.perLocale.en?.bodyPt.length ?? 0;
      const esLen = op.perLocale.es?.bodyPt.length ?? 0;
      const jaLen = op.perLocale.ja?.bodyPt.length ?? 0;
      const note = op.kind === 'rename-upsert' ? `  [rename ${op.oldSlug} → ${op.canonicalSlug}]`
                  : op.kind === 'promote-create' ? `  [promote from ${op.promoteFrom?.guideArticleId}]`
                  : '';
      console.log(`  ${op.kind.padEnd(15)} ${op.canonicalSlug.padEnd(50)} ${locs.padEnd(10)} body en/es/ja=${enLen}/${esLen}/${jaLen}${note}`);
    }
    console.log('\nDry-run — no writes.');
    return;
  }

  // ── COMMIT: writes ─────────────────────────────────────────────────────
  const BATCH = 20;
  for (let i = 0; i < ops.length; i += BATCH) {
    let tx = client.transaction();
    for (const op of ops.slice(i, i + BATCH)) {
      const nameArr: any[] = []; const slugArr: any[] = []; const summaryArr: any[] = []; const bodyArr: any[] = [];
      for (const loc of LOCALES) {
        const e = op.perLocale[loc]; if (!e) continue;
        if (e.title) nameArr.push({ _key: loc, _type: 'object', value: e.title });
        slugArr.push({ _key: loc, _type: 'object', value: { _type: 'slug', current: op.canonicalSlug } });
        if (e.description) summaryArr.push({ _key: loc, _type: 'object', value: e.description });
        bodyArr.push({ _key: loc, _type: 'object', value: e.bodyPt });
      }
      // City ref — from EN frontmatter (fallback to first available locale)
      const cityKey = op.perLocale.en?.city ?? op.perLocale.es?.city ?? op.perLocale.ja?.city
                      ?? op.promoteFrom?.city ?? null;
      const cityRef = cityKey ? cityIdBySlug.get(cityKey) : null;

      const sets: Record<string, unknown> = {
        name: nameArr,
        slug: slugArr,
        summary: summaryArr,
        body: bodyArr,
        migration: { wpUrl: `https://travel2egypt.org/${op.canonicalSlug}/` },
      };
      if (cityRef) sets.city = { _type: 'reference', _ref: cityRef };

      if (op.kind === 'create' || op.kind === 'promote-create') {
        tx = tx.createIfNotExists({ _id: op._id, _type: 'hotel', ...sets } as any);
      } else {
        // rename-upsert and upsert both patch the existing doc; rename-upsert
        // also updates the slug array (already set above to op.canonicalSlug).
        tx = tx.patch(op._id, (p) => p.set(sets));
      }
    }
    await tx.commit({ visibility: 'async' });
    process.stdout.write(`  ${Math.min(i + BATCH, ops.length)}/${ops.length} written\r`);
  }
  console.log(`\n✓ Wrote ${ops.length} hotel docs`);

  // Delete promoted guideArticles
  const promoteOps = ops.filter((o) => o.kind === 'promote-create');
  if (promoteOps.length) {
    let tx = client.transaction();
    for (const op of promoteOps) tx = tx.delete(op.promoteFrom!.guideArticleId);
    await tx.commit({ visibility: 'sync' });
    console.log(`✓ Deleted ${promoteOps.length} promoted-from guideArticles`);
  }

  // Redirects
  const allRedirects = [...renameRedirects, ...promoteRedirects];
  if (allRedirects.length) {
    appendFileSync(REDIRECT_CSV_PATH, '\n' + allRedirects.join('\n') + '\n', 'utf8');
    console.log(`✓ Appended ${allRedirects.length} redirect rows (${renameRedirects.length} brand-renames + ${promoteRedirects.length} promotions)`);
  }

  // Log
  for (const op of ops) {
    appendLog({
      phase: 'HOTELS-bulk-import', kind: op.kind, _id: op._id,
      canonical: op.canonicalSlug, oldSlug: op.oldSlug,
      promotedFrom: op.promoteFrom?.guideArticleId, sourceFiles: op.sourceFiles,
    });
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
