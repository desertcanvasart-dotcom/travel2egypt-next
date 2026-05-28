/**
 * Articles bulk import — EN/ES/JA MD corpus → migration-staging.
 *
 * Source: /Users/islamhussein/Downloads/All 3 langs/{en,es,ja}/articles/
 *
 * KEY SCHEMA NOTE: the `article` doc type uses DOC-LEVEL i18n (one Sanity
 * doc per locale, linked via `migration.wpId`), unlike the other doc
 * types in this codebase which use field-level i18n. Each canonical MD
 * slug therefore maps to 1-3 Sanity docs (one per locale that has MD
 * source). Existing siblings are discovered by:
 *   1. Find EN doc by canonical EN slug (or rename map)
 *   2. Pull migration.wpId off that doc
 *   3. Look up ES + JA docs with the same wpPostId
 *
 * Operator-confirmed (2026-05-28):
 *   • Sanity slug wins for souq-bab-el-louk → souq-bab-el-louk-cairos-fresh-market
 *   • Fix typo: rename Sanity 4-day-egypt-travel-itnarary → 4-day-egypt-travel-itinerary
 *     (+ 301 redirect ×3 locales)
 *   • Consolidate: rename Sanity month-by-month-guide-to-egypt
 *     → best-time-to-visit-egypt (+ 301 redirect ×3 locales)
 *   • ES + JA Sanity slugs stay as-is (operator-localized URLs); we only
 *     update title/deck/body content
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
const REDIRECT_CSV_PATH = resolve(process.cwd(), 'migration/redirect-map.csv');
const LOCALES = ['en', 'es', 'ja'] as const;
type Locale = (typeof LOCALES)[number];

// ──────────────────────────────────────────────────────────────────────────
// Mapping tables
// ──────────────────────────────────────────────────────────────────────────

/** MD-filename slug → canonical Sanity EN slug. Use HYPHENS after
 *  normalization. Only entries where MD slug differs from canonical. */
const FILENAME_TO_CANONICAL: Record<string, string> = {
  'souq-bab-el-louk': 'souq-bab-el-louk-cairos-fresh-market',
};

/** Stale duplicate Sanity slugs that have a NEWER correct-spelled sibling
 *  in Sanity. The MD content lands on the canonical (correct) sibling;
 *  these stale docs (EN + their ES/JA siblings) are DELETED, with 301
 *  redirects added from each locale's stale URL to the canonical URL.
 *
 *  Format: old (stale) EN slug → canonical (kept) EN slug.
 *  Discovered during dry-run audit 2026-05-28: both spellings exist as
 *  distinct Sanity docs (different wp-post-*-en IDs) — likely WP cruft
 *  where the same content was published twice under different slugs. */
const STALE_DUPLICATE_DELETIONS: Record<string, string> = {
  '4-day-egypt-travel-itnarary':   '4-day-egypt-travel-itinerary',
  'month-by-month-guide-to-egypt': 'best-time-to-visit-egypt',
};

const SKIP_FILENAMES = new Set<string>(['.ds_store']); // macOS junk

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
// Slug derivation
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
// Per-locale parsers (mirror of prior migrations)
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
// Folder discovery
// ──────────────────────────────────────────────────────────────────────────

function findLocaleFolder(locale: Locale): string | null {
  const variants = [
    join(CORPUS_ROOT, locale, 'articles'),
    join(CORPUS_ROOT, locale, 'articles '),
  ];
  for (const p of variants) if (existsSync(p) && statSync(p).isDirectory()) return p;
  return null;
}

// ──────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────

interface PerLocaleContent { title: string; description: string; bodyPt: any[] }
interface Record_ {
  canonicalSlug: string;
  perLocale: Partial<Record<Locale, PerLocaleContent>>;
  sourceFiles: Partial<Record<Locale, string>>;
}

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Articles bulk import ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);
  const client = getClient();

  // ── Walk MD + parse ────────────────────────────────────────────────────
  console.log('Walking corpus…');
  const recsByKey = new Map<string, Record_>();
  const warnings: string[] = [];
  const skipped: string[] = [];

  for (const locale of LOCALES) {
    const dir = findLocaleFolder(locale);
    if (!dir) { warnings.push(`Missing folder for ${locale}`); continue; }
    for (const file of readdirSync(dir).filter((n) => n.endsWith('.md'))) {
      if (SKIP_FILENAMES.has(file.toLowerCase())) { skipped.push(`${locale}/${file}`); continue; }
      const canonical = canonicalize(file);
      const raw = readFileSync(join(dir, file), 'utf8');
      // Articles use YAML frontmatter for ALL 3 locales (unlike travel-tips /
      // hotels / cruises where ES + JA use bold-block format).
      let parsed: Parsed | null = parseEn(raw);
      // Suppress unused-warning for the other parsers (kept for parity / future use)
      void parseEs; void parseJa; void locale;
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
  console.log(`  skipped ${skipped.length} junk files`);

  // ── Resolve existing Sanity articles ──────────────────────────────────
  // All EN/ES/JA docs with their wpPostId so we can find siblings.
  const allArticles = await client.fetch<Array<{ _id: string; slug: string; language: string; wpPostId: number | string | null }>>(
    `*[_type=='article' && !(_id in path('drafts.**'))]{ _id, "slug": slug.current, language, "wpPostId": migration.wpId }`,
  );
  const enBySlug = new Map<string, { _id: string; wpPostId: number | string | null }>();
  const docsByWpPostId: Record<string, { en?: string; es?: string; ja?: string }> = {};
  for (const a of allArticles) {
    if (a.language === 'en' && a.slug) enBySlug.set(a.slug, { _id: a._id, wpPostId: a.wpPostId });
    if (a.wpPostId) {
      const key = String(a.wpPostId);
      if (!docsByWpPostId[key]) docsByWpPostId[key] = {};
      if (a.language === 'en' || a.language === 'es' || a.language === 'ja') {
        docsByWpPostId[key][a.language as 'en'|'es'|'ja'] = a._id;
      }
    }
  }
  console.log(`  ${enBySlug.size} EN articles indexed (by slug)`);

  // ── Plan ───────────────────────────────────────────────────────────────
  interface Op {
    canonicalSlug: string;
    enId: string;
    esId: string | null;
    jaId: string | null;
    perLocale: Record_['perLocale'];
    sourceFiles: Record_['sourceFiles'];
  }
  const ops: Op[] = [];

  for (const rec of records) {
    const canonical = rec.canonicalSlug;
    const enEntry = enBySlug.get(canonical);
    if (!enEntry) {
      warnings.push(`No EN Sanity doc for canonical slug "${canonical}"`);
      continue;
    }
    // Resolve sibling ES + JA docs by wpId (migration field that links siblings)
    const wpId = enEntry.wpPostId;
    const sibs = wpId ? docsByWpPostId[String(wpId)] : {};
    const esId = sibs?.es ?? null;
    const jaId = sibs?.ja ?? null;
    ops.push({
      canonicalSlug: canonical, enId: enEntry._id, esId, jaId,
      perLocale: rec.perLocale, sourceFiles: rec.sourceFiles,
    });
  }

  // Build the duplicate-deletion plan. For each STALE_DUPLICATE_DELETIONS
  // entry, find the stale doc + its siblings, mark for delete, and queue
  // 3-locale redirects to the canonical URL.
  interface DeleteOp { staleEnId: string; staleEsId: string | null; staleJaId: string | null; staleSlug: string; canonicalSlug: string }
  const deleteOps: DeleteOp[] = [];
  const renameRedirects: string[] = [];
  for (const [staleSlug, canonical] of Object.entries(STALE_DUPLICATE_DELETIONS)) {
    const stale = enBySlug.get(staleSlug);
    if (!stale) continue; // already cleaned up
    const wpId = stale.wpPostId;
    const sibs = wpId ? docsByWpPostId[String(wpId)] : {};
    deleteOps.push({
      staleEnId: stale._id,
      staleEsId: sibs?.es ?? null,
      staleJaId: sibs?.ja ?? null,
      staleSlug,
      canonicalSlug: canonical,
    });
    for (const loc of LOCALES) {
      const prefix = loc === 'en' ? '' : `/${loc}`;
      renameRedirects.push(`${prefix}/blog/${staleSlug},${prefix}/blog/${canonical},301`);
    }
  }
  const directUpserts = ops.length;
  const renames = 0;
  console.log(`\nPlan:`);
  console.log(`  upserts:              ${directUpserts}`);
  console.log(`  duplicate deletions:  ${deleteOps.length} EN docs + their ES/JA siblings`);
  console.log(`  redirect rows:        ${renameRedirects.length}`);
  void renames;
  if (warnings.length) {
    console.log(`\nWarnings (${warnings.length}):`);
    for (const w of warnings.slice(0, 8)) console.log(`  · ${w}`);
  }

  // ── Dry-run ─────────────────────────────────────────────────────────────
  if (args.dryRun) {
    console.log('\n--- duplicate-deletion plan ---');
    for (const d of deleteOps) {
      console.log(`  DELETE  ${d.staleSlug.padEnd(40)} → ${d.canonicalSlug}`);
      console.log(`          en=${d.staleEnId}  es=${d.staleEsId ?? '(none)'}  ja=${d.staleJaId ?? '(none)'}`);
    }
    console.log('\n--- per-canonical upsert sample (first 8) ---');
    for (const op of ops.slice(0, 8)) {
      const lens = LOCALES.map((l) => op.perLocale[l]?.bodyPt.length ?? 0).join('/');
      const sibBits = `EN=${op.enId} ES=${op.esId ?? '(no sib)'} JA=${op.jaId ?? '(no sib)'}`;
      console.log(`  ${op.canonicalSlug.padEnd(50)} body en/es/ja=${lens}`);
      console.log(`      ${sibBits}`);
    }
    if (ops.length > 8) console.log(`  … +${ops.length - 8} more (omitted)`);
    console.log('\nDry-run — no writes.');
    return;
  }

  // ── COMMIT ────────────────────────────────────────────────────────────
  const BATCH = 25;
  let writes = 0;
  for (let i = 0; i < ops.length; i += BATCH) {
    let tx = client.transaction();
    for (const op of ops.slice(i, i + BATCH)) {
      const en = op.perLocale.en;
      const es = op.perLocale.es;
      const ja = op.perLocale.ja;

      // EN doc — patch + (if rename) update slug
      if (en) {
        const enSets: Record<string, unknown> = {
          title: en.title,
          'slug.current': op.canonicalSlug,
          deck: en.description,
          body: en.bodyPt,
        };
        tx = tx.patch(op.enId, (p) => p.set(enSets));
        writes++;
      }
      // ES doc — patch but KEEP its existing ES slug
      if (es && op.esId) {
        tx = tx.patch(op.esId, (p) => p.set({
          title: es.title || undefined,
          deck: es.description || undefined,
          body: es.bodyPt,
        }));
        writes++;
      }
      // JA doc — same; keep existing JA slug
      if (ja && op.jaId) {
        tx = tx.patch(op.jaId, (p) => p.set({
          title: ja.title || undefined,
          deck: ja.description || undefined,
          body: ja.bodyPt,
        }));
        writes++;
      }
    }
    await tx.commit({ visibility: 'async' });
    process.stdout.write(`  batch ${Math.min(i + BATCH, ops.length)}/${ops.length}  (${writes} doc-patches)\r`);
  }
  console.log(`\n✓ Patched ${writes} article docs (across 3 locales)`);

  // ── Duplicate deletions (run AFTER upserts so the stale docs are no
  //    longer canonical for any MD source)
  if (deleteOps.length) {
    let dtx = client.transaction();
    let delCount = 0;
    for (const d of deleteOps) {
      dtx = dtx.delete(d.staleEnId); delCount++;
      if (d.staleEsId) { dtx = dtx.delete(d.staleEsId); delCount++; }
      if (d.staleJaId) { dtx = dtx.delete(d.staleJaId); delCount++; }
    }
    try {
      await dtx.commit({ visibility: 'sync' });
      console.log(`✓ Deleted ${delCount} stale duplicate docs (${deleteOps.length} EN + ${delCount - deleteOps.length} siblings)`);
    } catch (e: any) {
      console.log(`⚠ Duplicate deletion failed (likely existing references): ${e?.message ?? e}`);
      console.log('  → Run finish-articles-cleanup.ts manually to clean up.');
    }
  }

  // Append redirect rows
  if (renameRedirects.length) {
    appendFileSync(REDIRECT_CSV_PATH, '\n' + renameRedirects.join('\n') + '\n', 'utf8');
    console.log(`✓ Appended ${renameRedirects.length} redirect rows`);
  }

  // Log
  for (const op of ops) {
    appendLog({
      phase: 'ARTICLES-bulk-import',
      canonical: op.canonicalSlug,
      enId: op.enId, esId: op.esId, jaId: op.jaId,
      sourceFiles: op.sourceFiles,
    });
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
