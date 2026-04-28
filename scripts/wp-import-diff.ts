/**
 * city UPDATE safety net — Components 1, 2, 3 entry script.
 *
 * Per session 5 DOC 3 / Application Handover v3 spec:
 *   • Per-locale unified diffs (Component 1)
 *   • Reference-integrity report (Component 2)
 *   • Fingerprint comparison + circuit breaker (Component 3)
 *
 * Runs the city mapper without writing to Sanity, fetches existing Sanity
 * state, applies the Q3 unified merge rule (`scripts/wp-import/merge.ts`),
 * and emits artifacts to `migration/.diffs/`.
 *
 * Usage:
 *   npm run wp-import-diff -- --filter-by-template destination-hub --slug-pattern '*-travel-guide' --limit 5
 *   npm run wp-import-diff -- --filter-by-template destination-hub --slug-pattern '*-travel-guide' --adversarial
 *
 * Flags:
 *   --filter-by-template  same as wp-import; defaults to destination-hub for session 5
 *   --slug-pattern        glob-lite pattern (see wp-import.ts compileSlugPattern)
 *   --limit N             cap output set
 *   --adversarial         pick 5-sample adversarially (cairo + oldest/newest/longest/shortest)
 *   --rate N              WP REST req/sec (default 4)
 *
 * Output:
 *   migration/.diffs/city-<slug>-{en|es|ja}.diff   — per-locale unified diffs
 *   migration/.diffs/city-diff-summary.md          — aggregate summary
 *   migration/.diffs/city-references.md            — refs report (Component 2)
 *   migration/.diffs/.approved-shapes/<hash>.json  — saved fingerprints (after Step 7)
 *
 * No Sanity writes. The fingerprint-save step is gated on Islam approval and
 * only happens via a separate `scripts/wp-import-diff-approve.ts` (TBD), or
 * a flag on this script (`--approve-shapes`) post-Step-6.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { SanityClient } from '@sanity/client';

import { classifyPageBySlug, type PageType } from './wp-classifier.js';
import { loadEnv } from './wp-import/env.js';
import { WpClient } from './wp-import/wp-client.js';
import { makeSanityClient } from './wp-import/sanity.js';
import { mapCity } from './wp-import/mappers/city.js';
import { mergeCityDoc, type SanityDoc } from './wp-import/merge.js';
import { emitDiff } from './wp-import/diff-emit.js';
import { fingerprint, fingerprintHash, loadApprovedShapes, type Fingerprint } from './wp-import/fingerprint.js';
import { emptyStats, logEvent } from './wp-import/log.js';
import { assembleLocaleGroup } from './wp-import.js';
import type { CliOptions, WpEntityLite } from './wp-import/types.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIFFS_DIR = join(ROOT, 'migration/.diffs');
const APPROVED_DIR = join(DIFFS_DIR, '.approved-shapes');

interface DiffCli {
  filterByTemplate: PageType;
  slugPattern?: string;
  limit?: number;
  adversarial: boolean;
  rate: number;
}

/** Slug-pattern matcher (mirrored from wp-import.ts). */
function compileSlugPattern(pattern: string): (slug: string) => boolean {
  const startsWildcard = pattern.startsWith('*');
  const endsWildcard = pattern.endsWith('*');
  const core = pattern.replace(/^\*/, '').replace(/\*$/, '');
  if (core.includes('*')) {
    process.stderr.write(`[wp-import-diff] --slug-pattern: only one leading and/or trailing '*' supported, got "${pattern}"\n`);
    process.exit(2);
  }
  if (startsWildcard && endsWildcard) return (s) => s.includes(core);
  if (startsWildcard) return (s) => s.endsWith(core);
  if (endsWildcard) return (s) => s.startsWith(core);
  return (s) => s === core;
}

function parseCli(argv: string[]): DiffCli {
  const opts: DiffCli = { filterByTemplate: 'destination-hub', adversarial: false, rate: 4 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case '--filter-by-template': opts.filterByTemplate = next() as PageType; break;
      case '--slug-pattern': opts.slugPattern = next(); break;
      case '--limit': opts.limit = Number(next()); break;
      case '--adversarial': opts.adversarial = true; break;
      case '--rate': opts.rate = Number(next()); break;
      case '-h':
      case '--help':
        process.stderr.write('Usage: see header comment in scripts/wp-import-diff.ts\n');
        process.exit(0);
      default:
        process.stderr.write(`[wp-import-diff] unknown flag: ${a}\n`);
        process.exit(2);
    }
  }
  return opts;
}

/** Programmatic entry point. Used by wp-import.ts when `--dry-run-diff-only`
 * is set, and by main() below when this script is invoked directly. */
export async function runDiff(cli: DiffCli): Promise<void> {
  const env = loadEnv();
  process.stderr.write(`[wp-import-diff] dataset=${env.sanityDataset} template=${cli.filterByTemplate} slug-pattern=${cli.slugPattern ?? '(none)'} adversarial=${cli.adversarial}\n`);
  if (!existsSync(DIFFS_DIR)) mkdirSync(DIFFS_DIR, { recursive: true });

  const sanity = makeSanityClient(env);
  const wp = new WpClient(env, cli.rate);

  // ── 1. Enumerate + classify + filter destination-hubs.
  process.stderr.write(`[wp-import-diff] enumerating EN pages...\n`);
  const params = { lang: 'en', _fields: 'id,slug,date,modified,modified_gmt,link,parent,template,categories,tags,featured_media,title' };
  const allPages = await wp.getPaginated<WpEntityLite>('/wp-json/wp/v2/pages', params);
  let candidates = allPages
    .map((p) => ({ p, c: classifyPageBySlug(p.slug) }))
    .filter((x) => x.c.type === cli.filterByTemplate);
  if (cli.slugPattern) {
    const m = compileSlugPattern(cli.slugPattern);
    candidates = candidates.filter((x) => m(x.p.slug));
  }
  process.stderr.write(`[wp-import-diff] candidates after template + slug filter: ${candidates.length}\n`);

  // ── 2. Adversarial selection (oldest WP modified, newest, longest body, shortest body, plus cairo if present).
  let selected = candidates;
  if (cli.adversarial) {
    selected = await selectAdversarial(wp, candidates);
  }
  if (cli.limit) selected = selected.slice(0, cli.limit);
  process.stderr.write(`[wp-import-diff] selected for diff: ${selected.length}\n`);
  for (const s of selected) {
    process.stderr.write(`  • ${s.p.id} ${s.p.slug} (mod=${(s.p as { modified?: string }).modified?.slice(0, 10) ?? '?'})\n`);
  }

  // ── 3. Per-doc: build LocaleGroup → mapCity (dry) → fetch existing → merge → emit diff + fingerprint.
  const stats = emptyStats(['--diff-only']);
  const summaryRows: Array<{ slug: string; docId: string; summaryLine: string; fingerprintHash: string; novel: boolean; createMode: boolean }> = [];
  const approvedShapes = loadApprovedShapes(APPROVED_DIR);
  const targetDocIds: string[] = [];
  for (const { p } of selected) {
    try {
      const group = await assembleLocaleGroup(wp, 'pages', p, { ...DUMMY_CLI, dryRun: true } as CliOptions, stats);
      if (!group) {
        process.stderr.write(`  ! ${p.slug}: no locale group, skipping\n`);
        continue;
      }
      // Mapper produces the WP-derived doc — pass dryRun so it does not look up
      // the existing seed _id; we want a deterministic candidate _id and we'll
      // resolve to the existing _id ourselves below.
      const result = await mapCity(sanity, wp, group, { dryRun: true });
      const wpDoc = result.docs[0] as SanityDoc;
      const enSlug = decodeURIComponent(group.en.slug);

      // Fetch existing Sanity state. Two probes: by _id (deterministic), and
      // by EN slug (covers seed cities pre-dating migration).
      const existing = await fetchExistingCity(sanity, wpDoc._id as string, enSlug);

      // Merge.
      const { merged, perFieldChanges } = mergeCityDoc(existing, wpDoc);
      const mergedDocId = merged._id as string;
      targetDocIds.push(mergedDocId);

      // Emit per-locale diffs to disk.
      const diff = emitDiff(existing, wpDoc, merged, perFieldChanges, enSlug);
      for (const sec of diff.sections) {
        if (!sec.text) continue;
        const path = join(DIFFS_DIR, `city-${enSlug}-${sec.scope}.diff`);
        writeFileSync(path, sec.text + '\n');
      }
      // Even if no changes in any section, emit a marker file so the absence is visible.
      if (diff.sections.every((s) => !s.text)) {
        const path = join(DIFFS_DIR, `city-${enSlug}-NOOP.diff`);
        writeFileSync(path, `# No diff — ${enSlug} (${mergedDocId}) is structurally identical pre- and post-merge.\n`);
      }

      // Fingerprint.
      const fp = fingerprint(perFieldChanges, merged, existing === null);
      const hash = fingerprintHash(fp);
      const novel = !approvedShapes.has(hash);
      summaryRows.push({ slug: enSlug, docId: mergedDocId, summaryLine: diff.summaryLine, fingerprintHash: hash, novel, createMode: existing === null });

      process.stderr.write(`  ✓ ${enSlug} → ${mergedDocId} (fp=${hash}${novel ? ' NOVEL' : ' approved'})\n`);
    } catch (e) {
      process.stderr.write(`  ✗ ${p.slug}: ${(e as Error).message}\n`);
      logEvent({ level: 'error', wpId: p.id, message: `diff failed for ${p.slug}: ${(e as Error).message}` });
    }
  }

  // ── 4. Reference-integrity report (Component 2).
  await emitReferencesReport(sanity, targetDocIds);

  // ── 5. Aggregate summary + circuit breaker.
  emitAggregateSummary(summaryRows);
  process.stderr.write(`[wp-import-diff] done. summary → migration/.diffs/city-diff-summary.md\n`);
}

const DUMMY_CLI: CliOptions = {
  dryRun: true,
  type: 'page',
  language: 'en',
  continueOnError: false,
  verbose: false,
  phase: 'import',
  includeJunk: false,
  rescrapeHreflang: false,
  rate: 4,
};

/** Adversarial 5-sample selection per DOC 3 step 3:
 *  cairo (if present) + oldest WP modified + newest + longest body + shortest body. */
async function selectAdversarial<C>(
  wp: WpClient,
  candidates: Array<{ p: WpEntityLite; c: C }>
): Promise<Array<{ p: WpEntityLite; c: C }>> {
  if (candidates.length <= 5) return candidates;
  // Need body length — fetch lite bodies. Limit to candidates set; we already have date/modified.
  process.stderr.write(`[wp-import-diff] fetching body lengths for adversarial selection (${candidates.length} pages)...\n`);
  const enriched = await Promise.all(
    candidates.map(async (c) => {
      try {
        const full = await wp.getJson<{ content?: { rendered: string } }>(
          `/wp-json/wp/v2/pages/${c.p.id}?context=edit&_fields=content`
        );
        const len = full.content?.rendered?.length ?? 0;
        return { ...c, bodyLen: len };
      } catch {
        return { ...c, bodyLen: 0 };
      }
    })
  );

  const byMod = [...enriched].sort((a, b) => ((a.p as { modified?: string }).modified ?? '').localeCompare((b.p as { modified?: string }).modified ?? ''));
  const byLen = [...enriched].sort((a, b) => a.bodyLen - b.bodyLen);
  const cairo = enriched.find((e) => e.p.slug === 'cairo-travel-guide');

  const picks = new Map<number, typeof enriched[0]>();
  if (cairo) picks.set(cairo.p.id, cairo);
  picks.set(byMod[0].p.id, byMod[0]); // oldest
  picks.set(byMod[byMod.length - 1].p.id, byMod[byMod.length - 1]); // newest
  picks.set(byLen[0].p.id, byLen[0]); // shortest
  picks.set(byLen[byLen.length - 1].p.id, byLen[byLen.length - 1]); // longest

  return [...picks.values()].map(({ bodyLen, ...rest }) => rest);
}

/** Look up existing city by deterministic _id first, then by EN slug. */
async function fetchExistingCity(sanity: SanityClient, candidateId: string, enSlug: string): Promise<SanityDoc | null> {
  // Try by _id.
  const byId = await sanity.fetch<SanityDoc | null>(`*[_id == $id][0]`, { id: candidateId });
  if (byId) return byId;
  // Try by EN slug (catches Phase-1 seed cities pre-dating migration).
  const bySlug = await sanity.fetch<SanityDoc | null>(
    `*[_type == "city" && slug[_key=="en"][0].value.current == $slug][0]`,
    { slug: enSlug }
  );
  return bySlug ?? null;
}

/** Component 2: reference-integrity report. Walks all doc types with refs to
 * city, surfaces inbound counts per target city _id. */
async function emitReferencesReport(sanity: SanityClient, targetDocIds: string[]): Promise<void> {
  const lines: string[] = ['# city reference-integrity report\n', `Targeted city _ids in this diff: ${targetDocIds.length}`, ''];
  if (targetDocIds.length === 0) {
    lines.push('_No targeted cities — nothing to check._');
  } else {
    lines.push(`| Target city _id | Inbound: tour | Inbound: guideArticle.parentCity | Inbound: other |`);
    lines.push(`|---|---:|---:|---:|`);
    for (const id of targetDocIds) {
      const tourRefs = await sanity.fetch<number>(
        `count(*[_type == "tour" && references($id)])`,
        { id }
      );
      const guideRefs = await sanity.fetch<number>(
        `count(*[_type == "guideArticle" && parentCity._ref == $id])`,
        { id }
      );
      const otherRefs = await sanity.fetch<number>(
        `count(*[_type != "tour" && _type != "guideArticle" && references($id)])`,
        { id }
      );
      lines.push(`| ${id} | ${tourRefs} | ${guideRefs} | ${otherRefs} |`);
    }
    lines.push('');
    lines.push('_The Q3 merge rule prevents removal/rename, so inbound refs should remain valid after writes. This report is the verification baseline._');
  }
  writeFileSync(join(DIFFS_DIR, 'city-references.md'), lines.join('\n') + '\n');
}

/** Aggregate summary + circuit breaker. */
function emitAggregateSummary(
  rows: Array<{ slug: string; docId: string; summaryLine: string; fingerprintHash: string; novel: boolean; createMode: boolean }>
): void {
  const total = rows.length;
  const novel = rows.filter((r) => r.novel).length;
  const novelPct = total === 0 ? 0 : (novel / total) * 100;
  const breakerTripped = total >= 10 && novelPct > 30;

  const lines: string[] = [
    '# city diff summary',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Targeted cities: ${total}`,
    `Novel structures (no approved fingerprint): ${novel} (${novelPct.toFixed(1)}%)`,
    '',
  ];
  if (breakerTripped) {
    lines.push('## ⚠️ Circuit breaker tripped');
    lines.push('');
    lines.push(`Novel-structure rate ${novelPct.toFixed(1)}% exceeds the 30% threshold over a sample of ${total}. Per the safety-net spec, halt and review the sample-selection itself before proceeding to individual novel-structure review. 30%+ novel suggests the approved-shape set is unrepresentative.`);
    lines.push('');
  }
  lines.push('## Per-city summary');
  lines.push('');
  lines.push('| Slug | Doc ID | Mode | Fingerprint | Status | Summary |');
  lines.push('|---|---|---|---|---|---|');
  for (const r of rows) {
    const status = r.novel ? '🔍 NOVEL — needs review' : '✅ approved-shape match';
    const mode = r.createMode ? 'CREATE' : 'UPDATE';
    lines.push(`| \`${r.slug}\` | \`${r.docId}\` | ${mode} | \`${r.fingerprintHash}\` | ${status} | ${r.summaryLine} |`);
  }
  lines.push('');
  lines.push('## How to proceed');
  lines.push('');
  if (total <= 10) {
    lines.push('At this sample size (≤10), every entry should be human-reviewed. The fingerprint hashes will be saved to `migration/.diffs/.approved-shapes/` only after explicit Islam approval.');
  } else if (breakerTripped) {
    lines.push('Circuit breaker tripped (see above). Do NOT proceed to individual reviews — surface the sample-selection question first.');
  } else {
    lines.push(`Of ${total} cities, ${novel} are novel-structure and need individual review. The remaining ${total - novel} match an approved fingerprint and auto-approve.`);
  }
  writeFileSync(join(DIFFS_DIR, 'city-diff-summary.md'), lines.join('\n') + '\n');
}

async function main(): Promise<void> {
  const cli = parseCli(process.argv.slice(2));
  await runDiff(cli);
}

const __thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] === __thisFile) {
  main().catch((e) => {
    process.stderr.write(`[wp-import-diff] uncaught: ${(e as Error).stack}\n`);
    process.exit(1);
  });
}

void ROOT;
