/**
 * Per-locale unified-diff emitter for the city safety net.
 *
 * Inputs: existing Sanity doc (or null), WP-derived doc (mapper output),
 *         and the merged result from `mergeCityDoc`.
 *
 * Output: a list of per-locale diff strings + an aggregate summary line.
 *
 * The diff format is line-based unified-diff over canonical JSON. Each
 * field-level i18n locale slot is split into its own diff section so the
 * 5-sample human review can scan locale-by-locale. Document-level fields
 * (non-i18n) appear in a "global" section.
 *
 * The diff is the human-readable side of the safety net. The fingerprint
 * (see `fingerprint.ts`) is the machine-readable side that drives auto-
 * approval at the 5→69 scaling step.
 */

import { canonicalize, type SanityDoc, type I18nEntry, type PerFieldChange } from './merge.js';

export type Locale = 'en' | 'es' | 'ja';
const LOCALES: readonly Locale[] = ['en', 'es', 'ja'] as const;

export interface DiffSection {
  /** Section heading: "global" or one of "en", "es", "ja". */
  scope: 'global' | Locale;
  /** Unified diff text. Empty string when no changes in scope. */
  text: string;
  /** Number of changed lines (additions + deletions) for triage sorting. */
  changedLines: number;
}

export interface DiffOutput {
  /** Sanity doc id, e.g. "wp-page-83284". */
  docId: string;
  /** EN slug for human-readable file naming. */
  enSlug: string;
  /** Per-locale + global diff sections. */
  sections: DiffSection[];
  /** Summary one-liner for the aggregate report. */
  summaryLine: string;
}

/** Build per-locale diffs by partitioning each i18n field's value into
 *  per-locale slots. Non-i18n fields go into the "global" section. */
export function emitDiff(
  existing: SanityDoc | null,
  wp: SanityDoc,
  merged: SanityDoc,
  perFieldChanges: PerFieldChange[],
  enSlug: string,
): DiffOutput {
  const docId = (merged._id as string) ?? (wp._id as string) ?? 'unknown';

  // Bucket fields per scope.
  const i18nFields = new Set<string>();
  for (const c of perFieldChanges) {
    if (c.outcome === 'i18n-merged' || c.localesTouched) i18nFields.add(c.field);
  }
  // Also detect i18n shape from values directly (handles unchanged i18n).
  for (const k of Object.keys(merged)) {
    const v = merged[k];
    if (Array.isArray(v) && v.length > 0 && v.every((e) => e && typeof e === 'object' && '_key' in e)) {
      i18nFields.add(k);
    }
  }

  const sections: DiffSection[] = [];

  // Global section: all non-i18n top-level fields, plus the WP-vs-merged
  // shape itself (which becomes the diff against existing).
  const globalExisting: Record<string, unknown> = {};
  const globalMerged: Record<string, unknown> = {};
  for (const k of new Set([...(existing ? Object.keys(existing) : []), ...Object.keys(merged)])) {
    if (i18nFields.has(k)) continue;
    if (existing) globalExisting[k] = existing[k];
    globalMerged[k] = merged[k];
  }
  const globalDiff = unifiedDiff(canonicalize(globalExisting), canonicalize(globalMerged), 'before', 'after');
  sections.push({ scope: 'global', text: globalDiff.text, changedLines: globalDiff.changedLines });

  // Per-locale sections.
  for (const loc of LOCALES) {
    const beforeSlot: Record<string, unknown> = {};
    const afterSlot: Record<string, unknown> = {};
    for (const f of i18nFields) {
      const ev = existing ? localeSlot(existing[f], loc) : undefined;
      const mv = localeSlot(merged[f], loc);
      if (ev !== undefined) beforeSlot[f] = ev;
      if (mv !== undefined) afterSlot[f] = mv;
    }
    const ld = unifiedDiff(canonicalize(beforeSlot), canonicalize(afterSlot), `before:${loc}`, `after:${loc}`);
    sections.push({ scope: loc, text: ld.text, changedLines: ld.changedLines });
  }

  // Summary line.
  const counts: Record<string, number> = {};
  for (const c of perFieldChanges) {
    counts[c.outcome] = (counts[c.outcome] ?? 0) + 1;
  }
  const summaryParts = Object.keys(counts).sort().map((k) => `${k}=${counts[k]}`);
  const totalLines = sections.reduce((a, s) => a + s.changedLines, 0);
  const summaryLine = `${enSlug} (${docId}) — ${summaryParts.join(', ')} — ${totalLines} changed line(s)`;

  return { docId, enSlug, sections, summaryLine };
}

/** Extract a single locale slot's value from an i18n array, or undefined. */
function localeSlot(value: unknown, locale: Locale): unknown {
  if (!Array.isArray(value)) return undefined;
  const e = value.find((x) => x && typeof x === 'object' && (x as I18nEntry)._key === locale) as I18nEntry | undefined;
  return e?.value;
}

/** Minimal line-based unified diff. Only correct enough for our canonical-JSON
 * inputs: deterministic order, stable formatting, modest size (~few hundred
 * lines per doc). Avoids npm dep. */
export function unifiedDiff(
  before: string,
  after: string,
  beforeLabel = 'before',
  afterLabel = 'after',
): { text: string; changedLines: number } {
  if (before === after) return { text: '', changedLines: 0 };
  const a = before.split('\n');
  const b = after.split('\n');
  // LCS-based diff. O(n*m) — fine for our scale.
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (a[i] === b[j]) dp[i][j] = dp[i + 1][j + 1] + 1;
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: string[] = [`--- ${beforeLabel}`, `+++ ${afterLabel}`];
  let i = 0;
  let j = 0;
  let changed = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      out.push(`  ${a[i]}`);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push(`- ${a[i]}`);
      i++;
      changed++;
    } else {
      out.push(`+ ${b[j]}`);
      j++;
      changed++;
    }
  }
  while (i < m) {
    out.push(`- ${a[i++]}`);
    changed++;
  }
  while (j < n) {
    out.push(`+ ${b[j++]}`);
    changed++;
  }
  return { text: out.join('\n'), changedLines: changed };
}
