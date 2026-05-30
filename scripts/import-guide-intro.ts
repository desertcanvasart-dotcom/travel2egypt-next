/**
 * Import the Egypt Travel Guide intro into siteSettings.guideIntro.
 *
 * Source: /Users/islamhussein/Downloads/All 3 langs/egypt-travel-guide-intro_<locale>_2026-05.md
 * Standard ATX markdown (# H1, ## H2, **bold** inline).
 *
 * Writes guideIntro = [{ _key:<locale>, value: PortableText[] }, ...] on the
 * siteSettings singleton. Reversible: client.patch().set() only, no deletes.
 * migration-staging only. Dry-run by default; pass --commit to write.
 */
import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();

const SRC_DIR = '/Users/islamhussein/Downloads/All 3 langs';
const LOCALES = ['en', 'es', 'ja'] as const;
const srcFor = (locale: string) => `${SRC_DIR}/egypt-travel-guide-intro_${locale}_2026-05.md`;

let keySeq = 0;
const k = (p: string) => `${p}${(keySeq++).toString(36)}`;

interface Span { _type: 'span'; _key: string; text: string; marks: string[]; }
function inlineSpans(text: string): Span[] {
  const spans: Span[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let mm: RegExpExecArray | null;
  while ((mm = re.exec(text))) {
    if (mm.index > last) spans.push({ _type: 'span', _key: k('s'), text: text.slice(last, mm.index), marks: [] });
    if (mm[1] !== undefined) spans.push({ _type: 'span', _key: k('s'), text: mm[1], marks: ['strong'] });
    else spans.push({ _type: 'span', _key: k('s'), text: mm[2], marks: ['em'] });
    last = re.lastIndex;
  }
  if (last < text.length) spans.push({ _type: 'span', _key: k('s'), text: text.slice(last), marks: [] });
  return spans.length ? spans : [{ _type: 'span', _key: k('s'), text, marks: [] }];
}

function block(style: string, spans: Span[]) {
  return { _type: 'block', _key: k('b'), style, markDefs: [], children: spans };
}

function parseFrontmatterBody(raw: string): string {
  const m = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/);
  return m ? m[1] : raw;
}

/** ATX markdown → portable text. Drops the H1 (duplicates the page H1) and
 *  the "Last updated:" footer. ## → h2; everything else → normal paragraphs. */
function toPortableText(body: string): any[] {
  const lines = body.split(/\r?\n/);
  const out: any[] = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^#\s/.test(line)) continue; // drop H1 (page already renders it)
    if (/^last updated:/i.test(line)) continue; // drop footer
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) { out.push(block('h2', [{ _type: 'span', _key: k('s'), text: h2[1].trim(), marks: [] }])); continue; }
    out.push(block('normal', inlineSpans(line)));
  }
  return out;
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  useCdn: false,
  token: process.env.SANITY_STAGING_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
});

async function main() {
  const commit = process.argv.includes('--commit');
  if (process.env.NEXT_PUBLIC_SANITY_DATASET !== 'migration-staging') {
    throw new Error(`Refusing to run against dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}".`);
  }

  const guideIntro = LOCALES.flatMap((locale) => {
    const src = srcFor(locale);
    if (!existsSync(src)) {
      console.log(`  skip ${locale}: no source file at ${src}`);
      return [];
    }
    const blocks = toPortableText(parseFrontmatterBody(readFileSync(src, 'utf8')));
    console.log(`guideIntro blocks (${locale}): ${blocks.length}`);
    return [{ _key: locale, value: blocks }];
  });

  const doc = await client.fetch(`*[_type == "siteSettings"][0]{_id}`);
  if (!doc?._id) throw new Error('No siteSettings document found.');

  console.log(`siteSettings _id: ${doc._id}`);

  if (commit) {
    await client.patch(doc._id).set({ guideIntro }).commit({ visibility: 'async', autoGenerateArrayKeys: false });
    console.log('\n  WRITTEN.');
  } else {
    console.log('\n  DRY RUN (no writes). Re-run with --commit to apply.');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
