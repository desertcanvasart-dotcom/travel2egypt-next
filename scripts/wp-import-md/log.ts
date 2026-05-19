/**
 * Run summary printer.
 */

import type { ImportResult, ValidationError } from './types.js';

export interface RunSummary {
  results: ImportResult[];
  validationErrors: ValidationError[];
  filesScanned: number;
  dryRun: boolean;
}

export function printRunSummary(summary: RunSummary, out: NodeJS.WritableStream = process.stdout): void {
  const counts: Record<string, number> = {
    created: 0,
    updated: 0,
    noop: 0,
    skipped: 0,
    failed: 0,
  };
  for (const r of summary.results) counts[r.status]++;

  out.write(`\n[import-content] ${summary.dryRun ? 'DRY-RUN ' : ''}summary\n`);
  out.write(`  files scanned: ${summary.filesScanned}\n`);
  out.write(`  triplets processed: ${summary.results.length}\n`);
  out.write(
    `  created=${counts.created} updated=${counts.updated} noop=${counts.noop} skipped=${counts.skipped} failed=${counts.failed}\n`
  );
  if (summary.validationErrors.length > 0) {
    out.write(`  validation errors: ${summary.validationErrors.length}\n`);
    for (const e of summary.validationErrors.slice(0, 20)) {
      out.write(`    [${e.field ?? '-'}] ${e.file}: ${e.message}\n`);
    }
    if (summary.validationErrors.length > 20) {
      out.write(`    … and ${summary.validationErrors.length - 20} more.\n`);
    }
  }
  const failedOrSkipped = summary.results.filter((r) => r.status === 'failed' || r.status === 'skipped');
  if (failedOrSkipped.length > 0) {
    out.write(`  failed/skipped detail:\n`);
    for (const r of failedOrSkipped) {
      out.write(`    [${r.status}] ${r.city}/${r.slug}: ${r.reason ?? '-'}\n`);
    }
  }
  const warnings = summary.results.flatMap((r) => r.warnings.map((w) => ({ key: `${r.city}/${r.slug}`, w })));
  if (warnings.length > 0) {
    out.write(`  warnings (${warnings.length}):\n`);
    for (const { key, w } of warnings.slice(0, 20)) {
      out.write(`    ${key}: ${w}\n`);
    }
    if (warnings.length > 20) out.write(`    … and ${warnings.length - 20} more.\n`);
  }

  out.write(
    `\n[import-content] Reminder: run \`npm run redirect-map:regenerate -- --diff\` after a successful batch\n` +
      `[import-content] to upgrade parent-fallback redirects (rule b) to specific URLs (rule a).\n`
  );
}
