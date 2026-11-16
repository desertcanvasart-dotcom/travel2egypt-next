/**
 * Content canon gates (docs/content-canon.md), as code:
 *  - Gate A-2  verbatimPreflight: every string a script is about to write must
 *    byte-match the founder-locked copy (apostrophe-normalized). Mismatch = abort.
 *  - Gate D-13 writeRollback: the document as it is now is written to
 *    migration/rollback/ BEFORE any production write.
 *  - Part III-6 curly: EN uses typographic apostrophes; straight ones are
 *    normalized before publish.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const ROOT = new URL('../../', import.meta.url);

/** Straight → typographic apostrophes (EN). Only apostrophes occur in this copy. */
export const curly = (s) => (typeof s === 'string' ? s.replace(/'/g, '’') : s);

/** Deep-apply `curly` to every string value of the rows in `lang` (keys and refs untouched). */
const STRUCTURAL = new Set(['_key', '_type', '_ref', '_weak', 'lang', 'source', 'period', 'cost', 'meal', 'exclusionRef', 'seeSection', 'closingRef', 'time', 'status', 'style', 'listItem']);
// Enum values (a segment's or meal's machine label) are data, not copy.
const ENUM = new Set(['morning', 'midday', 'afternoon', 'evening', 'breakfast', 'lunch', 'dinner', 'extraTicket', 'extraCost', 'included', 'notIncluded', 'unknown']);
export function curlyRows(rows, lang = 'en') {
  const walk = (v, k) => {
    if (typeof v === 'string') return STRUCTURAL.has(k) || ENUM.has(v) ? v : curly(v);
    if (Array.isArray(v)) return v.map((x) => walk(x, k));
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([kk, vv]) => [kk, walk(vv, kk)]));
    return v;
  };
  return (rows ?? []).map((r) => (r?.lang === lang ? walk(r) : r));
}

/**
 * Every human-readable string in the rows of `lang` (what a reader will see).
 * Pass `unchanged` (the same field's current rows) to check only what this run changes.
 */
export function visibleStrings(rows, lang, unchanged) {
  const before = unchanged ? new Set(visibleStrings(unchanged, lang)) : null;
  const out = [];
  const SKIP = new Set([...STRUCTURAL, 'narrativeRefs', 'whyRouteRefs', 'skipRefs']);
  const walk = (v, k) => {
    if (SKIP.has(k)) return;
    if (typeof v === 'string') { if (!ENUM.has(v)) out.push(v); }
    else if (Array.isArray(v)) v.forEach((x) => walk(x, k));
    else if (v && typeof v === 'object') Object.entries(v).forEach(([kk, vv]) => walk(vv, kk));
  };
  for (const r of rows ?? []) if (r?.lang === lang) walk(r, '');
  return before ? out.filter((x) => !before.has(x)) : out;
}

const norm = (s) =>
  s
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\*\*|\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Gate A-2. `lockedFiles`: repo-relative paths of the locked copy (.md or .json;
 * for .json every string value counts). `allow`: { string: 'where it is locked' }
 * for the few strings locked elsewhere (e.g. a label given in the brief).
 * Throws listing every mismatch; writes nothing.
 */
export function verbatimPreflight(strings, lockedFiles, allow = {}) {
  const locked = lockedFiles
    .map((f) => {
      const raw = readFileSync(new URL(f, ROOT), 'utf8');
      if (!f.endsWith('.json')) return raw;
      const vals = [];
      const walk = (v) => (typeof v === 'string' ? vals.push(v) : v && typeof v === 'object' && Object.values(v).forEach(walk));
      walk(JSON.parse(raw));
      return vals.join('\n');
    })
    .map(norm)
    .join('\n');
  const allowed = new Set(Object.keys(allow).map(norm));
  const bad = [...new Set(strings.filter((s) => s && s.trim()))].filter((s) => !allowed.has(norm(s)) && !locked.includes(norm(s)));
  if (bad.length) {
    throw new Error(`Verbatim pre-flight FAILED: ${bad.length} string(s) not in the locked copy (${lockedFiles.join(', ')}):\n  - ${bad.join('\n  - ')}`);
  }
  console.log(`verbatim pre-flight: ${strings.length} strings match the locked copy`);
}

/** Gate D-13. Writes each document's current state before a write; returns the paths. */
export async function writeRollback(client, ids, label) {
  const dir = new URL('migration/rollback/', ROOT);
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const paths = [];
  for (const id of ids) {
    const doc = await client.getDocument(id);
    if (!doc) throw new Error(`rollback: ${id} not found`);
    const p = new URL(`${id}.${label}.${stamp}.json`, dir);
    writeFileSync(p, JSON.stringify(doc, null, 1));
    paths.push(p.pathname);
  }
  console.log(`rollback written first:\n  ${paths.join('\n  ')}`);
  return paths;
}

/**
 * Content lint + numeric gate in the staging pre-flight (content prompt §3, canon III.2).
 * `locked`: [[repo-relative file, lang], …] — every locked copy file the run reads.
 * `numeric`: { en, loc, lang } keyed strings to compare figure by figure (ES/JA runs).
 * Aborts on any lint ABORT or numeric mismatch. Superlative flags (no tier) block
 * --apply until the owner approves them (pass --flags-approved after that OK).
 */
export async function contentGate({ locked = [], numeric = null, apply = false, args = process.argv.slice(2) }) {
  const { lintLocked } = await import('../content-lint/index.mjs');
  const { numericGate } = await import('../content-lint/numeric-gate.mjs');
  const flags = lintLocked(locked);
  if (numeric) numericGate(numeric.en, numeric.loc, numeric.lang);
  if (apply && flags.length && !args.includes('--flags-approved')) {
    throw new Error(`${flags.length} superlative flag(s) await owner approval (canon II.3 as amended 2026-11-16). Add them to docs/established-superlatives.md, frame them as ours, or pass --flags-approved once the owner has approved them.`);
  }
  return flags;
}
