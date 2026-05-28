/**
 * Nile cruises bulk import — EN/ES/JA MD corpus → migration-staging.
 *
 * Source: /Users/islamhussein/Downloads/All 3 langs/{en,es,ja}/{cruises,cruise}/
 *   (JA folder is "cruise" singular, EN/ES "cruises" plural)
 *
 * Operator-confirmed decisions (2026-05-28):
 *   • All slug renames: Sanity slug wins (legacy WP URL SEO preservation).
 *     No brand-change redirects needed — these are operator-prefix /
 *     suffix variations, not real rebrands.
 *   • Preserve Sanity technical fields (type, cruiseRoute, tier, capacity,
 *     poweredBy, etc.) on upserts — only update name/slug/summary/body.
 *   • adela-de-dahabiya MD → adelaide-dahabiya Sanity (same boat).
 *   • the-nile-goddess-cruise → NEW (different boat from m-s-moon-goddess).
 *
 * For new doc creates: derive `type` (dahabiya | cruise-ship) and
 * `cruiseRoute` (nile | lake-nasser) from name/slug heuristics. Editor
 * can refine in Studio.
 *
 * Refuses to run against any dataset other than migration-staging.
 * Idempotent.
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
const LOCALES = ['en', 'es', 'ja'] as const;
type Locale = (typeof LOCALES)[number];

// ──────────────────────────────────────────────────────────────────────────
// Mapping table — derived filename slug → canonical Sanity slug
// (Only entries where MD slug differs from Sanity slug. All canonicals
//  preserve Sanity legacy WP URL for SEO.)
// ──────────────────────────────────────────────────────────────────────────

const FILENAME_TO_CANONICAL: Record<string, string> = {
  // Confirmed by operator: same boat under naming variation
  'adela-de-dahabiya': 'adelaide-dahabiya',

  // Boats with "-nile-cruise" or operator prefix variations (Sanity wins)
  'm-s-amwaj-livingstone': 'm-s-amwaj-livingstone-nile-cruise',
  'm-s-mayfair-nile-cruise': 'm-s-mayfair',
  'm-s-minerva-nile-cruise': 'm-s-steigenberger-minerva-nile-cruise',
  'm-s-nubian-sea-lake-nasser': 'm-s-nubian-sea-lake-nasser-cruise',
  'm-s-omar-el-khayam': 'm-s-steigenberger-omar-el-khayam',
  'm-s-sonesta-st-george': 'm-s-sonesta-st-george-nile-cruise',
  'm-s-sonesta-star-goddess': 'm-s-sonesta-star-goddess-nile-cruise',
  'm-venpick-m-s-darakum': 'movenpick-ms-darakum-nile-cruise',
  'm-venpick-m-s-hamees': 'movenpick-ms-hamees-nile-cruise',
  'm-venpick-m-s-royal-lotus': 'movenpick-ms-royal-lotus-nile-cruise',
  'm-venpick-m-s-sun-ray': 'movenpick-ms-sun-ray-nile-cruise',
  'm-venpick-prince-abbas': 'movenpick-prince-abbas-cruise',
  'sb-feddya-dahabiya': 'movenpick-sb-feddya-dahabiya',
  'amirat-dahabiya': 'sonesta-amirat-dahabiya',
  'nour-el-nil-assouan': 'nour-el-nil-assouan-dahabiya',
  'meroe-dahabiya': 'nour-el-nil-meroe-dahabiya',
  'nour-el-nil-el-nil-dahabiya': 'el-nil-dahabiya',
  'y-s-alexander-the-great': 'm-s-alexander-the-great-nile-cruise',
  'swiss-inn-radamis-ii': 'swiss-inn-radamis-ii-nile-cruise',
  'steigenberger-legacy-nile-cruise': 'm-s-steigenberger-legacy-nile-cruise',
};

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
// Slug derivation + heuristics for new-doc defaults
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

/** Detect cruise type from slug/name. Schema requires 'type' on creates. */
function deriveType(slug: string, title: string): 'dahabiya' | 'cruise-ship' | 'felucca' {
  const hay = `${slug} ${title}`.toLowerCase();
  if (hay.includes('felucca')) return 'felucca';
  if (hay.includes('dahabiya')) return 'dahabiya';
  return 'cruise-ship';
}

/** Detect cruise route. Lake-Nasser cruises serve the Abu Simbel route. */
function deriveRoute(slug: string, title: string, body: string): 'nile' | 'lake-nasser' {
  const hay = `${slug} ${title} ${body.slice(0, 600)}`.toLowerCase();
  if (hay.includes('lake nasser') || hay.includes('lake-nasser') || hay.includes('abu simbel')) {
    return 'lake-nasser';
  }
  return 'nile';
}

// ──────────────────────────────────────────────────────────────────────────
// Per-locale parsers (mirror of travel-tips / hotels)
// ──────────────────────────────────────────────────────────────────────────

interface Parsed { title: string; description: string; body: string }

function parseEn(raw: string): Parsed | null {
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!fm) return null;
  const meta: Record<string, string> = {};
  for (const line of fm[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].replace(/^"|"$/g, '').trim();
  }
  let body = fm[2];
  const stripped = body.match(/^\s*\*\*Meta Title:?\*\*[\s\S]*?\*\*Meta Description:?\*\*[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
  if (stripped) body = stripped[1];
  return { title: meta.title ?? '', description: meta.description ?? '', body: body.trim() };
}

function parseEs(raw: string): Parsed | null {
  const lines = raw.split(/\r?\n/);
  let titleEs = ''; let descEs = '';
  const tMatch = raw.match(/^\s*\*Meta t[ií]tulo:\s*([\s\S]*?)\*/m);
  if (tMatch) titleEs = tMatch[1].trim();
  const dMatch = raw.match(/^\s*\*Meta descripci[oó]n:\s*([\s\S]*?)\*/m);
  if (dMatch) descEs = dMatch[1].trim();
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
  return { title: titleEs, description: descEs, body };
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
  return { title: titleJa, description: descJa, body };
}

// ──────────────────────────────────────────────────────────────────────────
// Folder discovery — handles cruises (plural) vs cruise (singular)
// ──────────────────────────────────────────────────────────────────────────

function findLocaleFolder(locale: Locale): string | null {
  const variants = [
    join(CORPUS_ROOT, locale, 'cruises'),
    join(CORPUS_ROOT, locale, 'cruise'),
    join(CORPUS_ROOT, locale, 'cruises '),
    join(CORPUS_ROOT, locale, 'cruise '),
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
  console.log(`\n=== Nile cruises bulk import ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);
  const client = getClient();

  console.log('Walking corpus…');
  const recsByKey = new Map<string, Record_>();
  const warnings: string[] = [];

  for (const locale of LOCALES) {
    const dir = findLocaleFolder(locale);
    if (!dir) { warnings.push(`Missing folder for ${locale}`); continue; }
    for (const file of readdirSync(dir).filter((n) => n.endsWith('.md'))) {
      const canonical = canonicalize(file);
      const raw = readFileSync(join(dir, file), 'utf8');
      let parsed: Parsed | null = null;
      if (locale === 'en') parsed = parseEn(raw);
      else if (locale === 'es') parsed = parseEs(raw);
      else parsed = parseJa(raw);
      if (!parsed) { warnings.push(`${locale}/${file}: parser null`); continue; }

      const html = marked.parse(parsed.body, { async: false }) as string;
      const { blocks: bodyPt } = htmlToPortableText(html, { locale });

      if (!recsByKey.has(canonical)) {
        recsByKey.set(canonical, { canonicalSlug: canonical, perLocale: {}, sourceFiles: {} });
      }
      const rec = recsByKey.get(canonical)!;
      rec.perLocale[locale] = { title: parsed.title, description: parsed.description, bodyPt };
      rec.sourceFiles[locale] = file;
    }
  }
  const records = [...recsByKey.values()].sort((a, b) => a.canonicalSlug.localeCompare(b.canonicalSlug));
  console.log(`  parsed ${records.length} unique canonical slugs from MD`);

  // Existing Sanity cruises
  const sanity = await client.fetch<Array<{ _id: string; slug: string }>>(
    `*[_type=='nileCruise' && !(_id in path('drafts.**'))]{ _id, "slug": slug[_key=='en'][0].value.current }`,
  );
  const idBySlug = new Map<string, string>();
  for (const h of sanity) if (h.slug) idBySlug.set(h.slug, h._id);
  console.log(`  ${sanity.length} existing nileCruise docs indexed`);

  // Plan
  interface Op {
    kind: 'upsert' | 'create';
    canonicalSlug: string;
    _id: string;
    perLocale: Record_['perLocale'];
    sourceFiles: Record_['sourceFiles'];
  }
  const ops: Op[] = [];
  for (const rec of records) {
    const existingId = idBySlug.get(rec.canonicalSlug);
    if (existingId) {
      ops.push({ kind: 'upsert', canonicalSlug: rec.canonicalSlug, _id: existingId,
        perLocale: rec.perLocale, sourceFiles: rec.sourceFiles });
    } else {
      ops.push({ kind: 'create', canonicalSlug: rec.canonicalSlug, _id: `nileCruise.${rec.canonicalSlug}`,
        perLocale: rec.perLocale, sourceFiles: rec.sourceFiles });
    }
  }
  const upserts = ops.filter((o) => o.kind === 'upsert').length;
  const creates = ops.filter((o) => o.kind === 'create').length;
  console.log(`\nPlan: ${upserts} upserts · ${creates} creates`);
  if (warnings.length) {
    console.log(`Warnings: ${warnings.length}`);
    for (const w of warnings.slice(0, 8)) console.log(`  · ${w}`);
  }

  if (args.dryRun) {
    console.log('\n--- per-doc plan ---');
    for (const op of ops) {
      const locs = LOCALES.filter((l) => op.perLocale[l]).join('+');
      const lens = LOCALES.map((l) => op.perLocale[l]?.bodyPt.length ?? 0).join('/');
      const en = op.perLocale.en;
      const newDocBits = op.kind === 'create' && en
        ? `  [new: type=${deriveType(op.canonicalSlug, en.title)}, route=${deriveRoute(op.canonicalSlug, en.title, en.bodyPt.map((b: any) => b._type === 'block' ? (b.children?.map((c: any) => c.text).join('') ?? '') : '').join(' ').slice(0, 600))}]`
        : '';
      console.log(`  ${op.kind.padEnd(7)} ${op.canonicalSlug.padEnd(46)} ${locs.padEnd(10)} body=${lens}${newDocBits}`);
    }
    console.log('\nDry-run — no writes.');
    return;
  }

  // COMMIT
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
      const sets: Record<string, unknown> = {
        name: nameArr,
        slug: slugArr,
        summary: summaryArr,
        body: bodyArr,
        migration: { wpUrl: `https://travel2egypt.org/${op.canonicalSlug}/` },
      };
      if (op.kind === 'create') {
        // Derive type + route from EN content for required fields
        const en = op.perLocale.en;
        const bodyText = (en?.bodyPt ?? []).map((b: any) =>
          b._type === 'block' ? (b.children?.map((c: any) => c.text).join('') ?? '') : ''
        ).join(' ').slice(0, 600);
        sets.type = deriveType(op.canonicalSlug, en?.title ?? '');
        sets.cruiseRoute = deriveRoute(op.canonicalSlug, en?.title ?? '', bodyText);
        tx = tx.createIfNotExists({ _id: op._id, _type: 'nileCruise', ...sets } as any);
      } else {
        // Upserts: only patch name/slug/summary/body + migration. Sanity's
        // technical fields (type/tier/capacity/etc.) are preserved.
        tx = tx.patch(op._id, (p) => p.set(sets));
      }
    }
    await tx.commit({ visibility: 'async' });
    process.stdout.write(`  ${Math.min(i + BATCH, ops.length)}/${ops.length} written\r`);
  }
  console.log(`\n✓ Wrote ${ops.length} nileCruise docs`);

  for (const op of ops) {
    appendLog({ phase: 'CRUISES-bulk-import', kind: op.kind, _id: op._id, canonical: op.canonicalSlug, sourceFiles: op.sourceFiles });
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
