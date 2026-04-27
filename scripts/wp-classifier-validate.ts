/**
 * One-shot validator for the expanded slug classifier.
 *
 * Loads the cached EN page list produced by scripts/wp-audit.ts and prints
 * the classification distribution + a sample of unclassified pages so we
 * can confirm we hit the ≤20% target before writing the mapping doc.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyPageBySlug, type Classification } from './wp-classifier.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, 'migration/.cache');

function loadCachedEnPages(): Array<{ id: number; slug: string; link: string }> {
  // Cache key was: pages?lang=en&_fields=...
  const file = readdirSync(CACHE).find((f) => f.startsWith('_pages__lang_en'));
  if (!file) throw new Error('No EN-pages cache file found in migration/.cache');
  return JSON.parse(readFileSync(join(CACHE, file), 'utf8'));
}

const pages = loadCachedEnPages();
console.log(`Loaded ${pages.length} EN pages from cache.\n`);

const dist = new Map<string, number>();
const confDist = new Map<string, number>();
const unclassified: Array<{ slug: string; link: string }> = [];
const sectionDist = new Map<string, number>();
const parentCityDist = new Map<string, number>();
let withParentInferred = 0;

for (const p of pages) {
  const c: Classification = classifyPageBySlug(p.slug);
  dist.set(c.type, (dist.get(c.type) || 0) + 1);
  confDist.set(`${c.type}/${c.confidence}`, (confDist.get(`${c.type}/${c.confidence}`) || 0) + 1);
  if (c.type === 'unclassified') unclassified.push({ slug: p.slug, link: p.link });
  if (c.inferredParentCity) {
    withParentInferred++;
    parentCityDist.set(c.inferredParentCity, (parentCityDist.get(c.inferredParentCity) || 0) + 1);
  }
  if (c.inferredSection) {
    sectionDist.set(c.inferredSection, (sectionDist.get(c.inferredSection) || 0) + 1);
  }
}

const N = pages.length;
const pct = (n: number) => `${((n / N) * 100).toFixed(1)}%`;

console.log('=== Type distribution ===');
for (const [t, n] of [...dist.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${t.padEnd(22)} ${String(n).padStart(4)}  ${pct(n)}`);
}

console.log('\n=== Confidence breakdown ===');
for (const [k, n] of [...confDist.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(34)} ${n}`);
}

console.log('\n=== Inferred parentCity (top 20) ===');
for (const [c, n] of [...parentCityDist.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)) {
  console.log(`  ${c.padEnd(20)} ${n}`);
}
console.log(`  TOTAL with parentCity: ${withParentInferred}  (${((withParentInferred / N) * 100).toFixed(1)}%)`);

console.log('\n=== Inferred section ===');
for (const [s, n] of [...sectionDist.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${s.padEnd(22)} ${n}`);
}

console.log(`\n=== ${unclassified.length} unclassified pages — first 50 slugs ===`);
unclassified.slice(0, 50).forEach((p) => console.log(`  ${p.slug}`));

const target = Math.ceil(N * 0.2);
console.log(`\nTarget: ≤${target} unclassified (≤20%).  Actual: ${unclassified.length} (${pct(unclassified.length)}).  ${unclassified.length <= target ? 'PASS' : 'FAIL'}`);
