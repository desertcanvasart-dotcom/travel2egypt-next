/**
 * Sample slugs currently classified as section: 'others'.
 * Surfaces them so we can verify the section assignment is reasonable
 * before tightening (or relaxing) the fallback rule.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyPageBySlug } from './wp-classifier.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, 'migration/.cache');

const file = readdirSync(CACHE).find((f) => f.startsWith('_pages__lang_en'))!;
const pages: Array<{ id: number; slug: string }> = JSON.parse(
  readFileSync(join(CACHE, file), 'utf8')
);

const others: Array<{ slug: string; reason: string; parent?: string }> = [];
for (const p of pages) {
  const c = classifyPageBySlug(p.slug);
  if (c.inferredSection === 'others') {
    others.push({ slug: p.slug, reason: c.reason, parent: c.inferredParentCity });
  }
}

console.log(`Total in section "others": ${others.length}\n`);

// Group by reason (shows which rule produced the assignment)
const byReason = new Map<string, typeof others>();
for (const o of others) {
  const key = o.reason.replace(/"\w[\w-]*"/g, '"…"').replace(/→ \w[\w-]+/g, '→ …');
  if (!byReason.has(key)) byReason.set(key, []);
  byReason.get(key)!.push(o);
}

console.log('=== Reason groups ===');
for (const [k, arr] of [...byReason.entries()].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  ${arr.length.toString().padStart(4)}  ${k}`);
}

console.log('\n=== Random sample of 50 slugs in "others" ===');
const shuffled = [...others].sort(() => Math.random() - 0.5).slice(0, 50);
shuffled.sort((a, b) => a.slug.localeCompare(b.slug));
for (const o of shuffled) {
  const p = o.parent ? ` [parent=${o.parent}]` : '';
  console.log(`  ${o.slug}${p}`);
}

console.log('\n=== Sample grouped by reason ===');
for (const [reason, arr] of [...byReason.entries()].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`\n--- ${reason} (${arr.length} total) ---`);
  for (const o of arr.slice(0, 10)) {
    const p = o.parent ? ` [${o.parent}]` : '';
    console.log(`  ${o.slug}${p}`);
  }
}
