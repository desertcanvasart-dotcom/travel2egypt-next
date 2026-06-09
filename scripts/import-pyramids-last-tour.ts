/**
 * Import the authored "Approaching the Pyramids" content into wp-page-156539.
 *
 * Background (2026-06-07): tour wp-page-156539 ("10-Day Egypt Travel Journey
 * Through History") had a thin, un-rewritten legacy body (and a Portuguese ES
 * slot). The operator supplied the proper EN/ES/JA editorial markdown for this
 * tour. This script parses those files with the SAME pipeline the canonical
 * bulk importer uses (frontmatter strip → marked → htmlToPortableText) and
 * patches title / summary / body in place, per locale.
 *
 * Conservative: only title, summary, body are written. The existing slug,
 * type, tourMode, discriminators, structured sidebar fields (durationDays,
 * price, …) and migration metadata are left untouched — so the live URL and
 * pricing card do not change.
 *
 * Usage:
 *   tsx scripts/import-pyramids-last-tour.ts            # dry-run (default)
 *   tsx scripts/import-pyramids-last-tour.ts --commit   # write
 */

import 'dotenv/config';
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { marked } from 'marked';
import { htmlToPortableText } from './wp-import-html.js';

const REQUIRED_DATASET = 'migration-staging';
const TARGET_ID = 'wp-page-156539';
const SRC_DIR = '/Users/islamhussein/Desktop/10-Day Egypt Travel Journey Through History - OpenClaw';
const FILES = { en: 'en.md', es: 'es.md', ja: 'ja.md' } as const;
type Locale = keyof typeof FILES;
const LOCALES = Object.keys(FILES) as Locale[];

const COMMIT = process.argv.includes('--commit');
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
const dataset = process.env.NEXT_PUBLIC_SANITY_STAGING_DATASET ?? REQUIRED_DATASET;
if (!projectId || !token) { console.error('Missing project id / write token'); process.exit(1); }
if (dataset !== REQUIRED_DATASET) { console.error(`Refusing: dataset=${dataset}`); process.exit(1); }

const client = createClient({ projectId, dataset, token, apiVersion: '2024-10-01', useCdn: false, perspective: 'raw' });

interface Parsed { title: string; description: string; body: string }

function parseMd(raw: string): Parsed {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) throw new Error('no frontmatter');
  const fm: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^"|"$/g, '').trim();
  }
  let body = m[2];
  // Strip any leaked "**Meta Title:** … **Meta Description:** … ---" block (defensive; these files are already clean).
  const meta = body.match(/^\s*\*\*Meta Title:?\*\*[\s\S]*?\*\*Meta Description:?\*\*[\s\S]*?\r?\n---\r?\n([\s\S]*)$/i);
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

    const heads = blocks.filter((b: any) => /^h[1-4]$/.test(b.style || '')).length;
    console.log(`[${loc}] title: ${p.title}`);
    console.log(`      summary: ${p.description.slice(0, 70)}…`);
    console.log(`      body: ${blocks.length} blocks (${heads} headings)  first: "${(blocks[0]?.children || []).map((c: any) => c.text).join('').slice(0, 60)}"`);
  }

  if (!COMMIT) { console.log('\nDRY-RUN — no writes. Re-run with --commit.'); return; }

  await client.patch(TARGET_ID).set({ title: titleArr, summary: summaryArr, body: bodyArr }).commit();
  console.log(`\n✓ Patched ${TARGET_ID} (title, summary, body) for ${LOCALES.join('/')}.`);
}

main().catch((e) => { console.error('\nFAILED:', e); process.exit(1); });
