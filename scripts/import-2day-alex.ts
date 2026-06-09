/**
 * Import the authored "Alexandria in a Day" content into wp-page-145910.
 *
 * Operator supplied EN/ES/JA markdown for this tour (2day-alex folder). Per
 * instruction: ignore the slugs in the files (they're inconsistent across
 * locales) and keep the slugs already on the existing doc. Only title /
 * summary / body are written; slug, type, tourMode, days, and structured
 * fields are left untouched.
 *
 * Uses the canonical pipeline (frontmatter strip → marked → htmlToPortableText)
 * and strips the leaked **Meta Title/Description** header in BOTH English and
 * Japanese (メタタイトル／メタディスクリプション) so nothing leaks into the body.
 *
 * Patches every existing instance (published + draft) of the target.
 *
 * Usage:
 *   tsx scripts/import-2day-alex.ts            # dry-run (default)
 *   tsx scripts/import-2day-alex.ts --commit   # write
 */

import 'dotenv/config';
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { marked } from 'marked';
import { htmlToPortableText } from './wp-import-html.js';

const REQUIRED_DATASET = 'migration-staging';
const TARGET_ID = 'wp-page-145910';
const SRC_DIR = '/Users/islamhussein/Desktop/10-Day Egypt Travel Journey Through History - OpenClaw/2day-alex';
const FILES = {
  en: 'private-tour-2-day-trip-to-alexandria-from-cairo.md',
  es: 'private-tour-2-day-trip-to-alexandria-from-cairo-es-.md',
  ja: 'private-tour-2-day-trip-to-alexandria-from-cairo_ja_2026-05.md',
} as const;
type Locale = keyof typeof FILES;
const LOCALES = Object.keys(FILES) as Locale[];

const COMMIT = process.argv.includes('--commit');
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
const dataset = process.env.NEXT_PUBLIC_SANITY_STAGING_DATASET ?? REQUIRED_DATASET;
if (!projectId || !token) { console.error('Missing project id / write token'); process.exit(1); }
if (dataset !== REQUIRED_DATASET) { console.error(`Refusing: dataset=${dataset}`); process.exit(1); }

const client = createClient({ projectId, dataset, token, apiVersion: '2024-10-01', useCdn: false, perspective: 'raw' });

// Strip a leading "**Meta Title:** … **Meta Description:** … ---" block (EN or JA labels).
const META_BLOCK_RE = /^\s*\*\*(?:Meta Title|メタタイトル)[:：]?\*\*[\s\S]*?\*\*(?:Meta Description|メタディスクリプション)[:：]?\*\*[\s\S]*?\r?\n---\r?\n([\s\S]*)$/i;

function parseMd(raw: string): { title: string; description: string; body: string } {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\s*\r?\n([\s\S]*)$/);
  if (!m) throw new Error('no frontmatter');
  const fm: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^"|"$/g, '').trim();
  }
  let body = m[2];
  const meta = body.match(META_BLOCK_RE);
  if (meta) body = meta[1];
  if (!fm.title) throw new Error('no title in frontmatter');
  return { title: fm.title, description: fm.description ?? '', body: body.trim() };
}

async function main() {
  console.log(`Target: ${TARGET_ID}   Dataset: ${dataset}   Mode: ${COMMIT ? 'COMMIT' : 'DRY-RUN'}\n`);

  const titleArr: any[] = [];
  const summaryArr: any[] = [];
  const bodyArr: any[] = [];

  for (const loc of LOCALES) {
    const raw = readFileSync(join(SRC_DIR, FILES[loc]), 'utf8');
    const p = parseMd(raw);
    const html = marked.parse(p.body, { async: false }) as string;
    const { blocks } = htmlToPortableText(html, { locale: loc });
    titleArr.push({ _key: loc, _type: 'object', value: p.title });
    if (p.description) summaryArr.push({ _key: loc, _type: 'object', value: p.description });
    bodyArr.push({ _key: loc, _type: 'object', value: blocks });

    const firstText = (blocks[0]?.children || []).map((c: any) => c.text).join('');
    const leak = blocks.some((b: any) => /メタタイトル|Meta Title|メタディスクリプション|Meta Description/.test((b.children || []).map((c: any) => c.text).join('')));
    const heads = blocks.filter((b: any) => /^h[1-4]$/.test(b.style || '')).length;
    console.log(`[${loc}] title: ${p.title}`);
    console.log(`      body: ${blocks.length} blocks (${heads} headings)  first: "${firstText.slice(0, 56)}"  meta-leak: ${leak ? 'YES ⚠️' : 'none'}`);
  }

  // existing instances (published + draft)
  const ids = [TARGET_ID, `drafts.${TARGET_ID}`];
  const present: Array<{ _id: string }> = await client.fetch(`*[_id in $ids]{ _id }`, { ids });
  console.log(`\nInstances to patch: ${present.map((p) => p._id).join(', ') || '(none)'}`);

  if (!COMMIT) { console.log('\nDRY-RUN — no writes. Re-run with --commit.'); return; }

  const tx = client.transaction();
  for (const p of present) tx.patch(p._id, (op) => op.set({ title: titleArr, summary: summaryArr, body: bodyArr }));
  await tx.commit();
  console.log(`\n✓ Patched ${present.length} instance(s) of ${TARGET_ID} (title, summary, body) for ${LOCALES.join('/')}.`);
}

main().catch((e) => { console.error('\nFAILED:', e); process.exit(1); });
