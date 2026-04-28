/**
 * Diff fingerprint extraction and approved-shape matching.
 *
 * The fingerprint captures the *structural* signature of a diff — which
 * fields changed, which locale slots, which content types — without the
 * specific content. Two cities with identical fingerprints are
 * structurally interchangeable from a review standpoint: if Islam
 * approves one, the other auto-approves.
 *
 * This is the "structural reduction" methodology rule applied: human
 * review at scale (>5-10 items) gates only on novel fingerprints.
 *
 * Persisted at `migration/.diffs/.approved-shapes/<hash>.json`.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { canonicalize, type PerFieldChange, type SanityDoc } from './merge.js';

export interface Fingerprint {
  /** Sorted list of fields and their merge outcomes. The composite key. */
  fieldOutcomes: Array<{ field: string; outcome: PerFieldChange['outcome']; localesTouched?: string[] }>;
  /** Top-level field types (`string`, `number`, `array`, `object`, `null`). */
  fieldTypes: Record<string, string>;
  /** Whether this is a CREATE-first run (existing was null). */
  createMode: boolean;
  /** Optional human-readable category label. NOT part of the hash — purely
   * metadata for the approved-shapes inspection. Set by retrofit step or by
   * future approval workflows. */
  description?: string;
}

/** Extract a structural fingerprint from a diff outcome. */
export function fingerprint(
  perFieldChanges: PerFieldChange[],
  merged: SanityDoc,
  createMode: boolean,
): Fingerprint {
  const fieldOutcomes = perFieldChanges
    .map((c) => ({
      field: c.field,
      outcome: c.outcome,
      ...(c.localesTouched ? { localesTouched: [...c.localesTouched].sort() } : {}),
    }))
    .sort((a, b) => a.field.localeCompare(b.field));
  const fieldTypes: Record<string, string> = {};
  for (const k of Object.keys(merged)) {
    fieldTypes[k] = typeOf(merged[k]);
  }
  return { fieldOutcomes, fieldTypes, createMode };
}

/** Stable hash of a fingerprint — used as the filename of the approved-shape
 * record. SHA-256 hex truncated to 16 chars (collision risk negligible at
 * our scale).
 *
 * Uses `canonicalize()` to deterministically order keys at every level. The
 * earlier implementation used `JSON.stringify(fp, Object.keys(fp).sort())`
 * — the second argument was misused as a replacer ARRAY, which filters
 * recursively to only keys named in the array, stripping all nested content
 * (fieldTypes/fieldOutcomes detail). That bug made every fingerprint hash
 * to the same value regardless of structural content. Fixed in session 5
 * during the Path A integration test, surfaced as a real collision between
 * Cairo (with orderRank, no hero) and Wadi-al-Natron (with hero, no
 * orderRank) producing the same hash.
 */
export function fingerprintHash(fp: Fingerprint): string {
  // Exclude `description` from the hash — it's metadata, not part of the
  // structural signature. Two fingerprints with identical shape but
  // different descriptions hash to the same value (which is what the
  // approval gate wants).
  const { description: _omit, ...rest } = fp;
  void _omit;
  const canonical = canonicalize(rest as unknown as SanityDoc);
  return createHash('sha256').update(canonical).digest('hex').slice(0, 16);
}

/** Load all approved-shape fingerprints from disk. Empty map on first run. */
export function loadApprovedShapes(approvedDir: string): Map<string, Fingerprint> {
  const out = new Map<string, Fingerprint>();
  if (!existsSync(approvedDir)) return out;
  for (const file of readdirSync(approvedDir)) {
    if (!file.endsWith('.json')) continue;
    const hash = file.replace(/\.json$/, '');
    try {
      const data = JSON.parse(readFileSync(join(approvedDir, file), 'utf8')) as Fingerprint;
      out.set(hash, data);
    } catch (e) {
      process.stderr.write(`[fingerprint] failed to load ${file}: ${(e as Error).message}\n`);
    }
  }
  return out;
}

/** Persist an approved fingerprint to disk. Idempotent — re-saves identical
 * content if hash already exists. */
export function saveApprovedShape(approvedDir: string, fp: Fingerprint): string {
  if (!existsSync(approvedDir)) mkdirSync(approvedDir, { recursive: true });
  const hash = fingerprintHash(fp);
  const path = join(approvedDir, `${hash}.json`);
  writeFileSync(path, JSON.stringify(fp, null, 2));
  return hash;
}

function typeOf(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}
