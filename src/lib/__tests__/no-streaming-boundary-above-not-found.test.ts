/**
 * Regression guard for soft 404s.
 *
 * A `loading.tsx` above a page that calls `notFound()` (or `redirect()`) makes
 * Next.js flush the layout shell first; the not-found UI then streams into the
 * boundary and the response carries HTTP 200 (a redirect degrades to a
 * client-side hop). Search engines file those as "Soft 404". Every route that
 * can 404 or redirect must therefore have no loading boundary in its ancestor
 * chain — see PR "fix(seo): restore wiki monument pages + real 404s".
 *
 * Run: npm run test:no-streaming-boundary
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const APP = resolve(process.cwd(), 'src/app/(site)/[locale]');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name === 'page.tsx') out.push(p);
  }
  return out;
}

const offenders: string[] = [];
let checked = 0;
for (const page of walk(APP)) {
  const src = readFileSync(page, 'utf8');
  if (!/\bnotFound\(\)|\bredirect\(/.test(src)) continue;
  checked += 1;
  let dir = dirname(page);
  while (dir.startsWith(APP)) {
    const loading = join(dir, 'loading.tsx');
    if (existsSync(loading)) offenders.push(`${relative(process.cwd(), page)} <- ${relative(process.cwd(), loading)}`);
    dir = dirname(dir);
  }
}

assert.ok(checked > 5, `expected to find notFound()/redirect() pages (got ${checked})`);
assert.deepEqual(offenders, [], `loading.tsx above a notFound()/redirect() page:\n  ${offenders.join('\n  ')}`);
console.log(`No streaming boundary above ${checked} notFound()/redirect() pages.`);
