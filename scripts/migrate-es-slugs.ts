/**
 * ES slug migration — localize the Spanish slug field for docs that still
 * carry the English-fallback slug (slug.es === slug.en) by slugifying the
 * existing Spanish title.
 *
 * Mirrors scripts/migrate-ja-romaji-slugs.ts in shape (dry-run / --commit,
 * per-type configs, override-first, collision gating, CSV + jsonl audit),
 * but ES needs no transliteration — slugify() is synchronous and matches
 * the house convention observed in already-localized slugs:
 *   - NFD diacritic strip (á→a, ñ→n, ü→u), lowercase
 *   - every word kept incl. stopwords (de/la/el/y), no truncation
 *   - non-alphanumeric runs → single hyphen, trimmed
 *
 * SAFETY: scope is restricted to docs whose ES slug === EN slug (pure
 * fallback). Already-localized or hand-tuned ES slugs (slug.es != slug.en)
 * are never touched. nileCruise/hotel have no ES titles → empty scope.
 *
 * Usage:
 *   npx tsx scripts/migrate-es-slugs.ts --type tour            (dry-run)
 *   npx tsx scripts/migrate-es-slugs.ts --type tour --commit   (apply)
 *   npx tsx scripts/migrate-es-slugs.ts --type tour --only=<id>
 *
 * Reads migration/es-slug-overrides.json keyed by Sanity _id (value: string
 * slug or { slug, reason }). Override consulted first; slugify fallback.
 *
 * Writes:
 *   - migration/.cache/es-slug-{type}-{timestamp}.csv  (dry-run + commit)
 *   - migration/migration-log.jsonl                    (append, on --commit)
 *   - Sanity migration-staging dataset                 (on --commit)
 */
import { readFileSync, writeFileSync, mkdirSync, appendFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();

type EntityType = 'tour' | 'guideArticle' | 'travelTip' | 'city' | 'nileCruise' | 'hotel';

interface EntityConfig {
  type: EntityType;
  label: string;
  /** 'title' (tour/guideArticle/travelTip) or 'name' (city/nileCruise/hotel). */
  titleField: 'title' | 'name';
  patchPath: string;
}

const TYPES: EntityType[] = ['tour', 'guideArticle', 'travelTip', 'city', 'nileCruise', 'hotel'];

function configFor(type: EntityType): EntityConfig {
  const titleField: 'title' | 'name' =
    type === 'city' || type === 'nileCruise' || type === 'hotel' ? 'name' : 'title';
  return {
    type,
    label: `${type} (field-level i18n)`,
    titleField,
    patchPath: 'slug[_key=="es"].value.current',
  };
}

/** Scope: ES title present AND ES slug present AND ES slug === EN slug (fallback). */
function scopeQuery(cfg: EntityConfig): string {
  const tf = cfg.titleField;
  return `*[_type == "${cfg.type}" && !(_id in path("drafts.**"))
    && defined(${tf}[_key == "es"][0].value)
    && defined(slug[_key == "es"][0].value.current)
    && slug[_key == "es"][0].value.current == slug[_key == "en"][0].value.current]{
    _id,
    "esTitle": ${tf}[_key == "es"][0].value,
    "esSlug": slug[_key == "es"][0].value.current,
    "enSlug": slug[_key == "en"][0].value.current,
  } | order(_id asc)`;
}

/** Every existing ES slug for this type (in + out of scope) — collision surface. */
function existingEsSlugsQuery(type: EntityType): string {
  return `*[_type == "${type}" && !(_id in path("drafts.**"))
    && defined(slug[_key == "es"][0].value.current)]{
    _id, "esSlug": slug[_key == "es"][0].value.current
  }`;
}

// ─── Slugify ───────────────────────────────────────────────────────────────

export function esSlugify(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics
    .replace(/[ºª]/g, '') // º ª ordinals
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── Overrides ───────────────────────────────────────────────────────────────

interface OverrideValue { slug: string; reason?: string; }
type Overrides = Record<string, string | OverrideValue>;
const OVERRIDES_PATH = resolve(process.cwd(), 'migration/es-slug-overrides.json');

function loadOverrides(): Overrides {
  if (!existsSync(OVERRIDES_PATH)) return {};
  const raw = readFileSync(OVERRIDES_PATH, 'utf8').trim();
  return raw ? (JSON.parse(raw) as Overrides) : {};
}
function overrideSlug(ov: Overrides, id: string): string | null {
  const v = ov[id];
  if (!v) return null;
  return typeof v === 'string' ? v : v.slug;
}

// ─── Client ──────────────────────────────────────────────────────────────────

function getClient(forWrites: boolean): SanityClient {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (!projectId || !dataset) die('NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET must be set in .env');
  if (dataset !== 'migration-staging') die(`Refusing to run against dataset "${dataset}". migration-staging only.`);
  // Always use the token (read) so dry-runs see the full published set — a
  // tokenless query under-reports on this dataset, hiding collisions. Writes
  // are still gated on --commit (applyPatches only runs then).
  const token = process.env.SANITY_STAGING_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
  if (forWrites && !token) die('SANITY_STAGING_API_WRITE_TOKEN (or SANITY_API_WRITE_TOKEN) must be set for --commit.');
  return createClient({ projectId, dataset, apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01', useCdn: false, token });
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface InputDoc { _id: string; esTitle: string; esSlug: string; enSlug: string; }
interface ResultRow {
  _id: string; title: string; currentSlug: string; proposedSlug: string;
  source: 'slugify' | 'override'; flags: string[];
}

function die(msg: string): never { console.error(`\nerror: ${msg}`); process.exit(1); }

function parseArgs(argv: string[]) {
  const out: { type: EntityType; commit: boolean; only?: string } = { type: 'tour', commit: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--type') out.type = argv[++i] as EntityType;
    else if (a === '--commit') out.commit = true;
    else if (a.startsWith('--only=')) out.only = a.slice('--only='.length);
    else if (a === '--only') out.only = argv[++i];
  }
  if (!TYPES.includes(out.type)) die(`--type must be one of: ${TYPES.join(', ')}`);
  return out;
}

// ─── Proposals + collision detection ─────────────────────────────────────────

function generateProposals(docs: InputDoc[], overrides: Overrides, existingEs: Map<string, string>): ResultRow[] {
  const out: ResultRow[] = [];
  for (const d of docs) {
    const ov = overrideSlug(overrides, d._id);
    const flags: string[] = [];
    let proposed: string;
    let source: 'slugify' | 'override';
    if (ov !== null) { proposed = ov; source = 'override'; flags.push('OVERRIDE'); }
    else { proposed = esSlugify(d.esTitle); source = 'slugify'; }
    if (!proposed) flags.push('EMPTY');
    out.push({ _id: d._id, title: d.esTitle, currentSlug: d.esSlug, proposedSlug: proposed, source, flags });
  }
  // Collision detection: proposed must be unique among (other proposals that
  // actually change) ∪ (existing ES slugs of out-of-scope docs).
  const changing = out.filter((r) => r.proposedSlug && r.proposedSlug !== r.currentSlug);
  const counts = new Map<string, string[]>();
  for (const r of changing) {
    (counts.get(r.proposedSlug) ?? counts.set(r.proposedSlug, []).get(r.proposedSlug)!).push(r._id);
  }
  const scopeIds = new Set(out.map((r) => r._id));
  for (const r of changing) {
    const sameProposed = counts.get(r.proposedSlug) ?? [];
    // out-of-scope docs already holding this slug (exclude in-scope docs themselves)
    const outsideHolders = [...existingEs.entries()].filter(
      ([id, s]) => s === r.proposedSlug && !scopeIds.has(id)
    );
    if (sameProposed.length > 1 || outsideHolders.length > 0) r.flags.push('COLLISION');
  }
  return out;
}

// ─── Output ─────────────────────────────────────────────────────────────────

function truncate(s: string, max: number): string { return s.length <= max ? s : s.slice(0, max - 1) + '…'; }

function printTable(rows: ResultRow[]): void {
  console.log('\n| _id | es title (≤48) | current slug | proposed slug | source | flags |');
  console.log('|---|---|---|---|---|---|');
  for (const r of rows) {
    console.log(`| \`${r._id}\` | ${truncate(r.title.replace(/\|/g, '\\|'), 48)} | \`${truncate(r.currentSlug, 28)}\` | \`${truncate(r.proposedSlug, 40)}\` | ${r.source} | ${r.flags.join(', ') || '—'} |`);
  }
}

function writeCsv(type: EntityType, rows: ResultRow[], ts: string): string {
  const dir = resolve(process.cwd(), 'migration/.cache');
  mkdirSync(dir, { recursive: true });
  const path = resolve(dir, `es-slug-${type}-${ts}.csv`);
  const header = '_id,title,current_slug,proposed_slug,source,flags\n';
  const body = rows.map((r) => [r._id, r.title, r.currentSlug, r.proposedSlug, r.source, r.flags.join('|')]
    .map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  writeFileSync(path, header + body + '\n', 'utf8');
  return path;
}

function appendLog(entries: Array<Record<string, unknown>>): void {
  const path = resolve(process.cwd(), 'migration/migration-log.jsonl');
  appendFileSync(path, entries.map((e) => JSON.stringify({ ts: new Date().toISOString(), ...e })).join('\n') + '\n', 'utf8');
}

async function applyPatches(client: SanityClient, cfg: EntityConfig, rows: ResultRow[]) {
  let patched = 0, unchanged = 0;
  const errors: Array<{ _id: string; error: string }> = [];
  const log: Array<Record<string, unknown>> = [];
  for (const r of rows) {
    if (!r.proposedSlug || r.currentSlug === r.proposedSlug) { unchanged++; continue; }
    try {
      await client.patch(r._id).set({ [cfg.patchPath]: r.proposedSlug }).commit({ visibility: 'async' });
      patched++;
      log.push({ level: 'info', op: 'es-slug-update', type: cfg.type, _id: r._id, oldSlug: r.currentSlug, newSlug: r.proposedSlug, source: r.source });
    } catch (e) {
      const msg = (e as Error).message;
      errors.push({ _id: r._id, error: msg });
      log.push({ level: 'error', op: 'es-slug-update', type: cfg.type, _id: r._id, error: msg });
    }
  }
  if (log.length) appendLog(log);
  return { patched, unchanged, errors };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);
  const cfg = configFor(args.type);
  console.log(`\n=== ES slug migration — ${cfg.label} ===`);
  console.log(`mode: ${args.commit ? 'COMMIT' : 'dry-run'}${args.only ? `  only: ${args.only}` : ''}\n`);

  const client = getClient(args.commit);
  let docs = await client.fetch<InputDoc[]>(scopeQuery(cfg));
  if (args.only) {
    docs = docs.filter((d) => d._id === args.only);
    if (!docs.length) die(`No in-scope doc matched --only=${args.only}`);
  }

  const existingRows = await client.fetch<Array<{ _id: string; esSlug: string }>>(existingEsSlugsQuery(args.type));
  const existingEs = new Map(existingRows.map((r) => [r._id, r.esSlug]));

  const overrides = loadOverrides();
  const rows = generateProposals(docs, overrides, existingEs);

  printTable(rows);
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const csv = writeCsv(args.type, rows, ts);

  const changing = rows.filter((r) => r.proposedSlug && r.proposedSlug !== r.currentSlug);
  const collisions = rows.filter((r) => r.flags.includes('COLLISION'));
  const empties = rows.filter((r) => r.flags.includes('EMPTY'));
  const overrideCount = rows.filter((r) => r.source === 'override').length;

  console.log('\n## Stats');
  console.log(`  ${rows.length} in-scope (es slug == en fallback, es title present)`);
  console.log(`  ${changing.length} would change / ${rows.length - changing.length} already match proposed`);
  console.log(`  ${overrideCount} override / ${rows.length - overrideCount} slugify`);
  console.log(`  ${empties.length} empty proposals`);
  console.log(`  ${collisions.length} collisions`);
  console.log(`\nCSV: ${csv}`);

  if (collisions.length) {
    console.log('\n## Collisions');
    const by = new Map<string, ResultRow[]>();
    for (const c of collisions) (by.get(c.proposedSlug) ?? by.set(c.proposedSlug, []).get(c.proposedSlug)!).push(c);
    for (const [slug, group] of by) {
      console.log(`  "${slug}":`);
      for (const g of group) console.log(`    - ${g._id}  (${truncate(g.title, 48)})`);
    }
  }
  if (empties.length) {
    console.log('\n## Empty proposals (need override)');
    for (const e of empties) console.log(`    - ${e._id}  (${truncate(e.title, 48)})`);
  }

  if (!args.commit) { console.log('\nDry-run complete. Re-run with --commit to apply.'); return; }
  if (collisions.length) die('Unresolved collisions. Resolve via migration/es-slug-overrides.json before --commit.');
  if (empties.length) die('Empty proposals. Resolve via overrides before --commit.');

  console.log(`\n## Applying ${changing.length} patches…`);
  const res = await applyPatches(client, cfg, rows);
  console.log(`  patched:   ${res.patched}`);
  console.log(`  unchanged: ${res.unchanged}`);
  console.log(`  errors:    ${res.errors.length}`);
  if (res.errors.length) { for (const e of res.errors.slice(0, 10)) console.log(`    ${e._id}: ${e.error}`); process.exit(1); }
  console.log('\nLog entries appended to migration/migration-log.jsonl');
}

main().catch((e) => { console.error(e); process.exit(1); });
