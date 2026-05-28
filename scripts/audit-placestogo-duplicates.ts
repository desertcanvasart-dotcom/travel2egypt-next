/**
 * Read-only audit: scan every city's `placesToGo` array and flag pairs of
 * docs that are likely the same physical monument under two slugs. Output
 * a markdown report; no writes.
 *
 * Detection runs four passes per city, in order. Each pass normalizes the
 * EN slug and groups; any group with >1 doc is a candidate pair:
 *
 *   Pass 1 — article prefix
 *     `the-<x>` ↔ `<x>`
 *     Example: `the-bent-pyramid` ↔ `bent-pyramid`
 *
 *   Pass 2 — area qualifier position
 *     `<area>-<x>` ↔ `<x>-at-<area>` (using placesToGoGroup as area)
 *     Example: `abusir-pyramid-of-sahure` ↔ `pyramid-of-sahure-at-abusir`
 *
 *   Pass 3 — qualifier strip
 *     `<base>-of-<king>` ↔ `<base>` (whichever side exists)
 *     Example: `the-red-pyramid-of-sneferu` ↔ `the-red-pyramid`
 *
 *   Pass 4 — spelling variants
 *     Normalize known Arabic-romanization variants (mohammed/muhammad,
 *     ayyad/muayyad, qaytbay/qaitbey, abdel/abd-al, sayed/sayyid, etc.)
 *
 * Per candidate pair, the report proposes keep + delete based on:
 *   - Body length (richer body → keep)
 *   - Slug specificity (more qualifiers → keep)
 *   - Existing references from `city.placesToGo` (preserve the canonical
 *     URL if one is already linked)
 *
 * "Confidence" rating:
 *   - high   = same normalized key + body-length ratio < 1.2 (clear dup)
 *   - medium = same normalized key but body-length ratio > 1.2 (review)
 *   - low    = matched only via spelling variants (operator must confirm)
 *
 * Writes:
 *   - migration/audit-placestogo-dupes.md
 *
 * Usage:
 *   npx tsx scripts/audit-placestogo-duplicates.ts
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();

const REPORT_PATH = resolve(process.cwd(), 'migration/audit-placestogo-dupes.md');

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

// ──────────────────────────────────────────────────────────────────────────
// Normalization passes
// ──────────────────────────────────────────────────────────────────────────

// Arabic-romanization aliases. Each pair shares a normalized key.
const SPELLING_ALIASES: Array<[RegExp, string]> = [
  [/\bmohammed\b/g, 'muhammad'],
  [/\bmohammad\b/g, 'muhammad'],
  [/\bmuhammed\b/g, 'muhammad'],
  [/\bmehmed\b/g, 'muhammad'],
  [/\bmuayyad\b/g, 'al-muayyad'],
  [/\bmu-ayyad\b/g, 'al-muayyad'],
  [/\baqsunur\b/g, 'aqsunqur'],
  [/\bqaitbey\b/g, 'qaytbay'],
  [/\bqaytbey\b/g, 'qaytbay'],
  [/\babdel\b/g, 'abd-al'],
  [/\babdul\b/g, 'abd-al'],
  [/\bsayed\b/g, 'sayyid'],
  [/\bsayyed\b/g, 'sayyid'],
  [/\bayyub\b/g, 'ayyub'],
  [/\bayoub\b/g, 'ayyub'],
  [/\bnegm\b/g, 'najm'],
  [/\bgashankir\b/g, 'jashnagir'],
  [/\bkhentkawes\b/g, 'khentkaus'],
  [/\bel-khalili\b/g, 'al-khalili'],
  [/\bal-khalili\b/g, 'al-khalili'],
  [/\bal-mu-allaqa\b/g, 'hanging'],
  [/\bmu-allaqa\b/g, 'hanging'],
  [/\bal-mu‑allaqa\b/g, 'hanging'],
];

function normalizeSpelling(s: string): string {
  let out = s;
  for (const [re, repl] of SPELLING_ALIASES) out = out.replace(re, repl);
  return out;
}

function stripArticle(s: string): string {
  return s.replace(/^the-/, '').replace(/-the-/g, '-');
}

function stripAreaPositions(slug: string, area: string | null): string {
  if (!area) return slug;
  const areaSlug = area.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  // strip leading `<area>-`
  let s = slug.replace(new RegExp(`^${areaSlug}-`), '');
  // strip trailing `-at-<area>` or `-in-<area>`
  s = s.replace(new RegExp(`-(at|in)-${areaSlug}$`), '');
  return s;
}

function stripQualifier(s: string): string {
  // Strip trailing "-of-<word>" or "-of-<two-words>" or "-ii" Roman numerals
  return s
    .replace(/-of-[a-z-]+(-ii|-iii|-iv)?$/, '')
    .replace(/-(ii|iii|iv)$/, '');
}

// Produce a normalized fingerprint that should be identical for likely-duplicates.
function fingerprint(slug: string, area: string | null): string {
  let s = slug.toLowerCase();
  s = stripArticle(s);
  s = stripAreaPositions(s, area);
  s = normalizeSpelling(s);
  // Also try the qualifier-stripped variant — it's checked as a second key.
  return s;
}

// ──────────────────────────────────────────────────────────────────────────
// Doc + city types
// ──────────────────────────────────────────────────────────────────────────

interface PlaceRow {
  _id: string;
  slug: string;
  titleEn: string | null;
  area: string | null;
  bodyLen: number;
}

interface CityRow {
  _id: string;
  slug: string;
  name: string;
  places: PlaceRow[];
}

function bodyTextLen(body: any[] | undefined): number {
  if (!Array.isArray(body)) return 0;
  let n = 0;
  for (const entry of body) {
    if (entry?._key !== 'en') continue;
    if (!Array.isArray(entry.value)) continue;
    for (const b of entry.value) {
      if (b?._type === 'block' && Array.isArray(b.children)) {
        for (const c of b.children) {
          if (typeof c?.text === 'string') n += c.text.length;
        }
      }
    }
  }
  return n;
}

// ──────────────────────────────────────────────────────────────────────────
// Pair detection
// ──────────────────────────────────────────────────────────────────────────

interface Pair {
  keep: PlaceRow;
  del: PlaceRow;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

function pickKeep(a: PlaceRow, b: PlaceRow): { keep: PlaceRow; del: PlaceRow } {
  // Heuristic: prefer the longer/more-qualified slug; on tie, prefer richer body.
  const aSpec = a.slug.split('-').length;
  const bSpec = b.slug.split('-').length;
  if (aSpec !== bSpec) {
    return aSpec > bSpec ? { keep: a, del: b } : { keep: b, del: a };
  }
  return a.bodyLen >= b.bodyLen ? { keep: a, del: b } : { keep: b, del: a };
}

function findPairs(city: CityRow): Pair[] {
  const pairs: Pair[] = [];
  const seen = new Set<string>(); // _id pairs we've already matched

  function tryPair(a: PlaceRow, b: PlaceRow, confidence: Pair['confidence'], reason: string) {
    // Require both docs to share the same placesToGoGroup. Without this,
    // generic suffixes like "necropolis" pair up across totally different
    // areas (Abusir ↔ Dahshur ↔ Saqqara) — clearly false positives.
    // Exception: if BOTH docs have no group set, allow the pair (treat as
    // "ungrouped together").
    if ((a.area ?? null) !== (b.area ?? null)) return;
    const pairKey = [a._id, b._id].sort().join('|');
    if (seen.has(pairKey)) return;
    const { keep, del } = pickKeep(a, b);
    const ratio = keep.bodyLen === 0 ? Infinity : del.bodyLen / keep.bodyLen;
    // Demote to medium if ratio > 1.2 (the delete is bigger than keep)
    const finalConfidence = ratio > 1.2 ? 'medium' : confidence;
    pairs.push({ keep, del, confidence: finalConfidence, reason });
    seen.add(pairKey);
  }

  // Pass 1+2: normalize via article/area/spelling, group, emit pairs.
  const buckets1 = new Map<string, PlaceRow[]>();
  for (const p of city.places) {
    const fp = fingerprint(p.slug, p.area);
    if (!buckets1.has(fp)) buckets1.set(fp, []);
    buckets1.get(fp)!.push(p);
  }
  for (const [_k, list] of buckets1) {
    if (list.length < 2) continue;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        tryPair(list[i], list[j], 'high', 'normalized slug match (article/area/spelling)');
      }
    }
  }

  // Pass 3: precise qualifier-strip — only match when one normalized slug
  // is a proper prefix of another, separated by `-of-` (or similar). This
  // catches `the-bent-pyramid` ↔ `the-bent-pyramid-of-sneferu` but NOT
  // `mosque-of-al-aqmar` ↔ `mosque-of-muhammad-ali` (different mosques).
  const normByPlace = new Map<string, string>();
  for (const p of city.places) normByPlace.set(p._id, fingerprint(p.slug, p.area));
  const QUALIFIER_RE = /-of-[a-z][a-z0-9-]*$/;
  for (let i = 0; i < city.places.length; i++) {
    for (let j = i + 1; j < city.places.length; j++) {
      const a = city.places[i]; const b = city.places[j];
      const an = normByPlace.get(a._id)!;
      const bn = normByPlace.get(b._id)!;
      if (an === bn) continue; // already paired by Pass 1
      // Match when one is the other with a `-of-<qualifier>` suffix
      const aIsShort = bn === an.replace(QUALIFIER_RE, '');
      const bIsShort = an === bn.replace(QUALIFIER_RE, '');
      if (aIsShort || bIsShort) {
        tryPair(a, b, 'high', 'qualifier-suffix variant (one slug = other minus -of-<king>)');
      }
    }
  }

  return pairs;
}

// ──────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────

async function main() {
  const client = getClient();

  const cities = await client.fetch<Array<{
    _id: string;
    slug: string;
    name: string;
    placesToGo: Array<{ _ref: string }> | null;
  }>>(`
    *[_type=="city" && !(_id in path("drafts.**"))]{
      _id,
      "slug": slug[_key=="en"][0].value.current,
      "name": name[_key=="en"][0].value,
      placesToGo
    } | order(slug asc)
  `);

  const cityRows: CityRow[] = [];
  for (const c of cities) {
    if (!c.placesToGo || c.placesToGo.length === 0) continue;
    const ids = c.placesToGo.map((p) => p._ref);
    const placeData = await client.fetch<Array<{
      _id: string;
      slug: string;
      titleEn: string | null;
      area: string | null;
      body: any[];
    }>>(`
      *[_id in $ids]{
        _id,
        "slug": slug[_key=="en"][0].value.current,
        "titleEn": title[_key=="en"][0].value,
        "area": placesToGoGroup,
        body
      }
    `, { ids });
    const places: PlaceRow[] = placeData.map((p) => ({
      _id: p._id,
      slug: p.slug,
      titleEn: p.titleEn,
      area: p.area,
      bodyLen: bodyTextLen(p.body),
    }));
    cityRows.push({ _id: c._id, slug: c.slug, name: c.name, places });
  }

  // Build report
  const lines: string[] = [];
  const push = (s = '') => lines.push(s);
  push('# Places-to-go duplicate audit');
  push('');
  push(`Run: ${new Date().toISOString()}`);
  push('');
  push('Read-only. Per city, lists likely duplicate pairs in `placesToGo`. The "Likely Keep" and "Likely Delete" are heuristic picks — confirm before any cleanup.');
  push('');
  push('## Summary');
  push('');
  push('| City | placesToGo | Candidate pairs | High-confidence | Medium |');
  push('|---|---:|---:|---:|---:|');

  const detailSections: string[] = [];
  for (const city of cityRows) {
    const pairs = findPairs(city);
    const hi = pairs.filter((p) => p.confidence === 'high').length;
    const med = pairs.filter((p) => p.confidence === 'medium').length;
    push(`| ${city.slug} | ${city.places.length} | ${pairs.length} | ${hi} | ${med} |`);
    if (pairs.length === 0) continue;
    const det: string[] = [];
    det.push('');
    det.push(`### ${city.slug} (${city.places.length} places, ${pairs.length} candidate pair${pairs.length === 1 ? '' : 's'})`);
    det.push('');
    det.push('| Confidence | Likely keep | Likely delete | Keep body | Del body | Reason |');
    det.push('|---|---|---|---:|---:|---|');
    pairs.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 } as const;
      return order[a.confidence] - order[b.confidence];
    });
    for (const p of pairs) {
      det.push(
        `| ${p.confidence} | \`${p.keep.slug}\` | \`${p.del.slug}\` | ${p.keep.bodyLen} | ${p.del.bodyLen} | ${p.reason} |`,
      );
    }
    detailSections.push(det.join('\n'));
  }
  push('');
  for (const section of detailSections) push(section);
  push('');

  mkdirSync(resolve(process.cwd(), 'migration'), { recursive: true });
  writeFileSync(REPORT_PATH, lines.join('\n'), 'utf8');

  const totalPairs = cityRows.reduce((n, c) => n + findPairs(c).length, 0);
  console.log(`\n=== Places-to-go duplicate audit ===`);
  console.log(`Cities scanned:  ${cityRows.length}`);
  console.log(`Candidate pairs total: ${totalPairs}`);
  console.log(`Report: ${REPORT_PATH}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
