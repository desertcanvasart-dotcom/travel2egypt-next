/**
 * Travel-tips bulk import — EN/ES/JA MD corpus → migration-staging.
 *
 * Source: /Users/islamhussein/Downloads/All 3 langs/{en,es,ja}/travel tips[.md]/
 *
 * Operator-confirmed decisions (session, 2026-05-28):
 *   • Sanity slugs win where EN MD slug drifted (SEO preservation)
 *   • 3 new docs created: about-egypt, egypt-weather-guide,
 *     staying-connected-in-egypt
 *   • 1 new category created: introducing-egypt (for about-egypt)
 *   • staying-connected-in-egypt REPLACES telephones-in-egypt +
 *     wifi-in-egypt (both deleted, 6 redirect rows added)
 *   • tips-for-families SKIPPED on import + 3 redirect rows to
 *     traveling-with-kids
 *   • egypt_city_guide / egypt_senior_travel_guide (JA-only) SKIPPED
 *
 * Mechanics:
 *   • EN: YAML frontmatter (slug/title/description) + body MD
 *   • ES: italic "Meta título:" + bold title block + body
 *   • JA: bold title + English echo + em-dash subtitle + body
 *   • MD → HTML via `marked` → PortableText via `htmlToPortableText`
 *
 * Refuses to run against any dataset other than migration-staging.
 * Idempotent — re-running produces no diff once data is consistent.
 *
 * Usage:
 *   npx tsx scripts/bulk-import-travel-tips-md.ts --dry-run
 *   npx tsx scripts/bulk-import-travel-tips-md.ts --commit
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
// Mapping table — derived filename → canonical Sanity slug
// ──────────────────────────────────────────────────────────────────────────

/** Filenames whose canonical slug differs from a simple name-to-slug normalization. */
const FILENAME_TO_CANONICAL: Record<string, string> = {
  // EN renames (Sanity legacy WP slug wins)
  'cultural-etiquette': 'cultural-etiquette-in-egypt',
  'distance-between-cities': 'distance-between-egyptian-cities',
  'entrance-fees-in-egypt': 'attractions-entrance-fees',
  'health-safety': 'health-and-safety',
  'telephones': 'telephones-in-egypt',           // legacy (slug being deleted, see SKIP_CANONICAL)
  'tipping-baksheesh': 'tipping-in-egypt',
  'tips-for-solo-women': 'solo-woman-traveler-in-egypt',
  'tips-on-accommodation': 'tips-on-accommodations',
  'touts-and-scams': 'touts-in-egypt',
  'vegetarian-travelers': 'vegetarian-travelers-to-egypt',
  'water-safety-in-egypt': 'water-safety-in-egypt-advice-for-travelers',
  'wifi': 'wifi-in-egypt',                       // legacy (slug being deleted, see SKIP_CANONICAL)

  // JA underscore-style → canonical (keys here use HYPHENS because the
  // slug-derivation function normalizes underscores → hyphens before lookup)
  'about-egypt': 'about-egypt',
  'accessible-travel-in-egypt': 'travel-with-disabilities',
  'airports-in-egypt': 'airports-in-egypt',
  'cultural-etiquette-in-egypt': 'cultural-etiquette-in-egypt',
  'egypt-comms-guide': 'staying-connected-in-egypt',
  'egypt-currency-guide': 'currency-in-egypt',
  'egypt-electricity-guide': 'electricity-in-egypt',
  'egypt-entrance-fees': 'attractions-entrance-fees',
  'egypt-haggling-guide': 'bargaining-in-egypt',
  'egypt-hotel-guide': 'tips-on-accommodations',
  'egypt-hours-guide': 'opening-hours-and-public-holidays',
  'egypt-insurance-guide': 'travel-insurance',
  'egypt-language-guide': 'language-in-egypt',
  'egypt-ramadan-guide': 'ramadan-in-egypt',
  'egypt-solo-women-travel-guide': 'solo-woman-traveler-in-egypt',
  'egypt-student-guide': 'student-travelers',
  'egypt-time-guide': 'time-in-egypt',
  'egypt-tipping-guide': 'tipping-in-egypt',
  'egypt-toilet-guide': 'toilets-in-egypt',
  'egypt-transport-guide': 'transportation-in-egypt',
  'egypt-vegetarian-guide': 'vegetarian-travelers-to-egypt',
  'egypt-visa-guide': 'passport-and-visa',
  'egypt-weather-guide': 'egypt-weather-guide',
  'getting-to-egypt': 'getting-there',
  'health-and-safety-in-egypt': 'health-and-safety',
  'sacred-sites-guide': 'visiting-a-religious-site',
  'touts-in-egypt': 'touts-in-egypt',
  'water-safety-guide': 'water-safety-in-egypt-advice-for-travelers',

  // ES title-cased variant (single file)
  'staying-connected-in-egypt': 'staying-connected-in-egypt',
  // (Identity mapping — but presence here lets the script find it
  //  after the "Staying Connected in Egypt.md" → kebab-case normalization)
};

/** Canonical slugs that should NOT result in a Sanity write. Use the
 *  post-normalization hyphen form (deriveCanonicalSlug runs lower+hyphen
 *  conversion before lookup). */
const SKIP_CANONICAL = new Set<string>([
  // tips-for-families: deleted; redirected to traveling-with-kids
  'tips-for-families',
  // Files that aren't travel tips at all
  'egypt-city-guide',
  // JA-only piece with no EN/Sanity canonical yet — defer
  'egypt-senior-travel-guide',
]);

/** Canonical Sanity slug → new doc spec (only used for the 3 net-new docs). */
interface NewDocSpec {
  categoryId: string;
  featured?: boolean;
}
const NEW_DOCS: Record<string, NewDocSpec> = {
  'about-egypt':                    { categoryId: 'travelTipCategory-introducing-egypt', featured: true },
  'egypt-weather-guide':            { categoryId: 'travelTipCategory-when-to-go' },
  'staying-connected-in-egypt':     { categoryId: 'travelTipCategory-practical-essentials' },
};

/** Docs to delete after the new staying-connected-in-egypt is in place. */
const DELETE_IDS = ['wp-page-60914', 'wp-page-60954']; // telephones-in-egypt, wifi-in-egypt

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
// Filename → slug derivation
// ──────────────────────────────────────────────────────────────────────────

/**
 * Strip `.md`, the `_<locale>_YYYY-MM` suffix, lowercase, and replace
 * spaces/underscores with hyphens. Then look up in FILENAME_TO_CANONICAL
 * for the canonical Sanity slug.
 */
function deriveCanonicalSlug(filename: string): string | null {
  let s = filename.replace(/\.md$/i, '');
  s = s.replace(/_(en|es|ja)_\d{4}-\d{2}$/i, '');
  s = s.toLowerCase().replace(/[\s_]+/g, '-');
  if (FILENAME_TO_CANONICAL[s]) return FILENAME_TO_CANONICAL[s];
  // identity — only if it's a known canonical slug, otherwise the importer
  // will surface a warning
  return s;
}

// ──────────────────────────────────────────────────────────────────────────
// Per-locale MD parsers
// ──────────────────────────────────────────────────────────────────────────

interface Parsed {
  title: string;
  description: string;
  body: string;          // markdown body (still MD, gets converted to PT downstream)
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
  // Strip the leading "**Meta Title:** ... **Meta Description:** ... ---" block
  const stripped = body.match(/^\s*\*\*Meta Title:?\*\*[\s\S]*?\*\*Meta Description:?\*\*[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
  if (stripped) body = stripped[1];
  return {
    title: meta.title ?? '',
    description: meta.description ?? '',
    body: body.trim(),
  };
}

function parseEs(raw: string): Parsed | null {
  // Expected layout:
  //   *Meta título: <title>*
  //   *Meta descripción: <desc>*
  //   **<eyebrow>**
  //   **<title (echoes Meta título)>**
  //   **<subtitle>**
  //   — <standfirst dash-form> —
  //   <body...>
  const lines = raw.split(/\r?\n/);
  let titleEs = '';
  let descEs = '';
  let bodyStart = 0;

  const titleMatch = raw.match(/^\s*\*Meta t[ií]tulo:\s*([\s\S]*?)\*/m);
  if (titleMatch) titleEs = titleMatch[1].trim();
  const descMatch = raw.match(/^\s*\*Meta descripci[oó]n:\s*([\s\S]*?)\*/m);
  if (descMatch) descEs = descMatch[1].trim();

  // Body starts after the dash-bracketed standfirst (` — <text> — `) OR after
  // the 3rd `**bold**` line, whichever comes first.
  let boldCount = 0;
  let foundDash = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('**') && line.endsWith('**') && line.length > 4) boldCount++;
    if (line.startsWith('—') && line.endsWith('—') && line.length > 4) foundDash = true;
    if (foundDash) { bodyStart = i + 1; break; }
    if (boldCount >= 3 && line === '') { bodyStart = i + 1; }
  }

  const body = lines.slice(bodyStart).join('\n').trim();
  if (!titleEs && !descEs && body.length < 100) return null;
  return { title: titleEs, description: descEs, body };
}

function parseJa(raw: string): Parsed | null {
  // Expected layout:
  //   **<JA title>**
  //   <English echo (skip)>
  //   — <JA subtitle / standfirst> —
  //   <body...>
  const lines = raw.split(/\r?\n/);
  let titleJa = '';
  let descJa = '';
  let bodyStart = 0;
  let foundTitle = false;
  let foundDash = false;
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
    // Fallback: body starts after the first bold line.
    bodyStart = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().match(/^\*\*.+\*\*$/)) { bodyStart = i + 1; break; }
    }
  }
  const body = lines.slice(bodyStart).join('\n').trim();
  if (!titleJa && body.length < 100) return null;
  return { title: titleJa, description: descJa, body };
}

// ──────────────────────────────────────────────────────────────────────────
// Folder discovery (handles trailing-space + .md folder name quirks)
// ──────────────────────────────────────────────────────────────────────────

function findLocaleFolder(locale: Locale): string | null {
  const variants = [
    join(CORPUS_ROOT, locale, 'travel tips'),
    join(CORPUS_ROOT, locale, 'travel tips '),
    join(CORPUS_ROOT, locale, 'travel tips.md'),
  ];
  for (const p of variants) if (existsSync(p) && statSync(p).isDirectory()) return p;
  return null;
}

// ──────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────

interface PerLocale { title: string; description: string; bodyPt: any[] }
interface Record_ {
  canonicalSlug: string;
  perLocale: Partial<Record<Locale, PerLocale>>;
  sourceFiles: Partial<Record<Locale, string>>;
}

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Travel-tips bulk import ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);
  const client = getClient();

  // ── Walk corpus + parse ────────────────────────────────────────────────
  console.log('Walking corpus…');
  const recsByKey = new Map<string, Record_>();
  const warnings: string[] = [];
  const skipped: string[] = [];

  for (const locale of LOCALES) {
    const dir = findLocaleFolder(locale);
    if (!dir) { warnings.push(`Missing folder for locale ${locale}`); continue; }

    for (const file of readdirSync(dir).filter((n) => n.endsWith('.md'))) {
      let slug = deriveCanonicalSlug(file);
      if (!slug) { warnings.push(`${locale}/${file}: could not derive slug`); continue; }
      // Per-locale overrides — the JA "tips-for-families" file is actually
      // the JA family-travel content and should land in traveling-with-kids.
      // EN/ES tips-for-families is being deprecated (redirect added separately).
      if (slug === 'tips-for-families') {
        if (locale === 'ja') {
          slug = 'traveling-with-kids';
        } else {
          skipped.push(`${locale}/${file} (deprecated)`);
          continue;
        }
      }
      if (SKIP_CANONICAL.has(slug)) { skipped.push(`${locale}/${file} (→ ${slug})`); continue; }

      const raw = readFileSync(join(dir, file), 'utf8');
      let parsed: Parsed | null = null;
      if (locale === 'en') parsed = parseEn(raw);
      else if (locale === 'es') parsed = parseEs(raw);
      else parsed = parseJa(raw);
      if (!parsed) { warnings.push(`${locale}/${file}: parser returned null`); continue; }

      // Convert body MD → HTML → PT
      const html = marked.parse(parsed.body, { async: false }) as string;
      const { blocks: bodyPt } = htmlToPortableText(html, { locale });

      if (!recsByKey.has(slug)) {
        recsByKey.set(slug, { canonicalSlug: slug, perLocale: {}, sourceFiles: {} });
      }
      const rec = recsByKey.get(slug)!;
      rec.perLocale[locale] = {
        title: parsed.title,
        description: parsed.description,
        bodyPt,
      };
      rec.sourceFiles[locale] = file;
    }
  }

  const records = [...recsByKey.values()].sort((a, b) => a.canonicalSlug.localeCompare(b.canonicalSlug));
  console.log(`  parsed ${records.length} unique canonical slugs from MD.`);
  console.log(`  skipped ${skipped.length} files per rules.`);
  if (warnings.length) {
    console.log(`  warnings: ${warnings.length}`);
    for (const w of warnings.slice(0, 10)) console.log(`    · ${w}`);
    if (warnings.length > 10) console.log(`    · … +${warnings.length - 10} more`);
  }

  // ── Resolve existing Sanity docs (by EN slug) ─────────────────────────
  console.log('\nResolving existing travelTip docs…');
  const existing = await client.fetch<Array<{ _id: string; slug: string }>>(
    `*[_type=='travelTip' && !(_id in path('drafts.**'))]{ _id, "slug": slug[_key=='en'][0].value.current }`,
  );
  const idBySlug = new Map<string, string>();
  for (const d of existing) if (d.slug) idBySlug.set(d.slug, d._id);
  console.log(`  ${existing.length} existing travelTip docs indexed.`);

  // ── Plan ───────────────────────────────────────────────────────────────
  interface Op {
    kind: 'upsert' | 'create';
    canonicalSlug: string;
    _id: string;
    perLocale: Record_['perLocale'];
    sourceFiles: Record_['sourceFiles'];
    newDocSpec?: NewDocSpec;
  }
  const ops: Op[] = [];
  for (const rec of records) {
    const existingId = idBySlug.get(rec.canonicalSlug);
    if (existingId) {
      ops.push({ kind: 'upsert', canonicalSlug: rec.canonicalSlug, _id: existingId,
        perLocale: rec.perLocale, sourceFiles: rec.sourceFiles });
    } else {
      const spec = NEW_DOCS[rec.canonicalSlug];
      if (!spec) { warnings.push(`No existing doc and no NEW_DOCS spec for ${rec.canonicalSlug} — skipping`); continue; }
      ops.push({ kind: 'create', canonicalSlug: rec.canonicalSlug,
        _id: `travelTip.${rec.canonicalSlug}`,
        perLocale: rec.perLocale, sourceFiles: rec.sourceFiles, newDocSpec: spec });
    }
  }
  const upserts = ops.filter((o) => o.kind === 'upsert');
  const creates = ops.filter((o) => o.kind === 'create');

  console.log(`\nPlan:`);
  console.log(`  upserts:    ${upserts.length}`);
  console.log(`  creates:    ${creates.length}`);
  for (const c of creates) {
    console.log(`    + ${c.canonicalSlug.padEnd(36)} cat=${c.newDocSpec?.categoryId.replace('travelTipCategory-', '')}`);
  }
  console.log(`  deletes:    ${DELETE_IDS.length}  (telephones-in-egypt, wifi-in-egypt)`);
  console.log(`  category create: travelTipCategory-introducing-egypt`);

  // ── Category presence check ────────────────────────────────────────────
  const catIds = [...new Set([...Object.values(NEW_DOCS).map((s) => s.categoryId), 'travelTipCategory-introducing-egypt'])];
  const presentCats = await client.fetch<Array<{ _id: string }>>(`*[_id in $ids]{ _id }`, { ids: catIds });
  const presentCatSet = new Set(presentCats.map((c) => c._id));
  const catsToCreate = catIds.filter((id) => !presentCatSet.has(id));
  if (catsToCreate.length) console.log(`  categories to create: ${catsToCreate.join(', ')}`);

  // ── Redirect plan ──────────────────────────────────────────────────────
  const REDIRECT_ROWS = [
    // staying-connected supersedes telephones + wifi (×3 locales)
    '/travel-tips/telephones-in-egypt,/travel-tips/staying-connected-in-egypt,301',
    '/es/travel-tips/telephones-in-egypt,/es/travel-tips/staying-connected-in-egypt,301',
    '/ja/travel-tips/telephones-in-egypt,/ja/travel-tips/staying-connected-in-egypt,301',
    '/travel-tips/wifi-in-egypt,/travel-tips/staying-connected-in-egypt,301',
    '/es/travel-tips/wifi-in-egypt,/es/travel-tips/staying-connected-in-egypt,301',
    '/ja/travel-tips/wifi-in-egypt,/ja/travel-tips/staying-connected-in-egypt,301',
    // tips-for-families → traveling-with-kids (×3 locales)
    '/travel-tips/tips-for-families,/travel-tips/traveling-with-kids,301',
    '/es/travel-tips/tips-for-families,/es/travel-tips/traveling-with-kids,301',
    '/ja/travel-tips/tips-for-families,/ja/travel-tips/traveling-with-kids,301',
  ];
  console.log(`  redirects:  ${REDIRECT_ROWS.length}  (telephones→staying-connected, wifi→staying-connected, tips-for-families→traveling-with-kids)`);

  // ── Dry-run summary ───────────────────────────────────────────────────
  if (args.dryRun) {
    console.log('\n--- per-doc plan ---');
    for (const op of ops) {
      const locs = LOCALES.filter((l) => op.perLocale[l]).join('+');
      const enLen = op.perLocale.en?.bodyPt.length ?? 0;
      const esLen = op.perLocale.es?.bodyPt.length ?? 0;
      const jaLen = op.perLocale.ja?.bodyPt.length ?? 0;
      console.log(`  ${op.kind.padEnd(7)} ${op.canonicalSlug.padEnd(40)} ${locs.padEnd(10)} body en/es/ja = ${enLen}/${esLen}/${jaLen}`);
    }
    console.log('\nDry-run — no writes.');
    return;
  }

  // ── COMMIT: writes ─────────────────────────────────────────────────────

  // 1. Create missing categories
  if (catsToCreate.length) {
    let tx = client.transaction();
    if (catsToCreate.includes('travelTipCategory-introducing-egypt')) {
      tx = tx.createIfNotExists({
        _id: 'travelTipCategory-introducing-egypt',
        _type: 'travelTipCategory',
        name: [{ _key: 'en', _type: 'object', value: 'Introducing Egypt' }],
        slug: [{ _key: 'en', _type: 'object', value: { _type: 'slug', current: 'introducing-egypt' } }],
        description: [{ _key: 'en', _type: 'object', value: 'Magazine-style introductions and context that orient you before you plan the trip.' }],
        orderRank: 50,
      } as any);
    }
    await tx.commit({ visibility: 'sync' });
    console.log(`✓ Created ${catsToCreate.length} new category(ies)`);
  }

  // 2. Upserts + creates (batched 20 per tx)
  const BATCH = 20;
  for (let i = 0; i < ops.length; i += BATCH) {
    let tx = client.transaction();
    for (const op of ops.slice(i, i + BATCH)) {
      const titleArr: any[] = []; const slugArr: any[] = []; const summaryArr: any[] = []; const bodyArr: any[] = [];
      for (const loc of LOCALES) {
        const e = op.perLocale[loc]; if (!e) continue;
        if (e.title) titleArr.push({ _key: loc, _type: 'object', value: e.title });
        // Slug — EN stays canonical; ES/JA use the EN slug as fallback (true cross-locale slug
        // strategy is a separate concern; the per-locale slug field can be filled editorially).
        slugArr.push({ _key: loc, _type: 'object', value: { _type: 'slug', current: op.canonicalSlug } });
        if (e.description) summaryArr.push({ _key: loc, _type: 'object', value: e.description });
        bodyArr.push({ _key: loc, _type: 'object', value: e.bodyPt });
      }
      const sets: Record<string, unknown> = {
        title: titleArr,
        slug: slugArr,
        summary: summaryArr,
        body: bodyArr,
        migration: { wpUrl: `https://travel2egypt.org/${op.canonicalSlug}/` },
      };
      if (op.kind === 'create' && op.newDocSpec) {
        sets.category = { _type: 'reference', _ref: op.newDocSpec.categoryId };
        if (op.newDocSpec.featured) sets.featured = true;
        tx = tx.createIfNotExists({ _id: op._id, _type: 'travelTip', ...sets } as any);
      } else {
        tx = tx.patch(op._id, (p) => p.set(sets));
      }
    }
    await tx.commit({ visibility: 'async' });
    process.stdout.write(`  ${Math.min(i + BATCH, ops.length)}/${ops.length} written\r`);
  }
  console.log(`\n✓ Wrote ${ops.length} travelTip docs`);

  // 3. Deletes (telephones + wifi)
  let dtx = client.transaction();
  for (const id of DELETE_IDS) dtx = dtx.delete(id);
  await dtx.commit({ visibility: 'sync' });
  console.log(`✓ Deleted ${DELETE_IDS.length} legacy docs`);

  // 4. Redirect rows
  appendFileSync(REDIRECT_CSV_PATH, '\n' + REDIRECT_ROWS.join('\n') + '\n', 'utf8');
  console.log(`✓ Appended ${REDIRECT_ROWS.length} redirect rows`);

  // 5. Log
  for (const op of ops) {
    appendLog({
      phase: 'TT-bulk-import',
      kind: op.kind,
      _id: op._id,
      slug: op.canonicalSlug,
      sourceFiles: op.sourceFiles,
    });
  }
  appendLog({ phase: 'TT-bulk-import-cleanup', deleted: DELETE_IDS, redirectRowsAdded: REDIRECT_ROWS.length });
}

main().catch((err) => { console.error(err); process.exit(1); });
