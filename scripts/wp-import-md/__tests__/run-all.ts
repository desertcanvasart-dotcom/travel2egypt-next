/**
 * Aggregate runner for the MD-import test suite.
 * Each test module exports `run(): Promise<boolean>`; this runner awaits
 * them sequentially and exits non-zero if any returned false.
 */

import { run as frontmatter } from './frontmatter.test.js';
import { run as kindToSection } from './kind-to-section.test.js';
import { run as walker } from './walker.test.js';
import { run as validate } from './validate.test.js';
import { run as mdToPt } from './md-to-pt.test.js';
import { run as imageUploader } from './image-uploader.test.js';
import { run as writer } from './writer.test.js';

async function main(): Promise<void> {
  const modules: Array<[string, () => Promise<boolean> | boolean]> = [
    ['frontmatter', frontmatter],
    ['kind-to-section', kindToSection],
    ['walker', walker],
    ['validate', validate],
    ['md-to-pt', mdToPt],
    ['image-uploader', imageUploader],
    ['writer', writer],
  ];
  let anyFailed = false;
  for (const [, fn] of modules) {
    const ok = await fn();
    if (!ok) anyFailed = true;
  }
  if (anyFailed) {
    process.stdout.write('\n[test:import-md] FAIL\n');
    process.exit(1);
  }
  process.stdout.write('\n[test:import-md] all modules passed\n');
}

main().catch((err) => {
  process.stderr.write(`[test:import-md] FATAL: ${err instanceof Error ? err.stack : String(err)}\n`);
  process.exit(1);
});
