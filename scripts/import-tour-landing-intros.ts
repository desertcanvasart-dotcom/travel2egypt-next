/**
 * Import editorial intro copy (+ SEO) into tourLanding documents.
 *
 * Source: "/Users/islamhussein/Desktop/tour category pages texts", three
 * sub-trees (group day tours, private day tours, private packages), each with
 * en/es/ja markdown files carrying frontmatter (slug,title,description) and a
 * lightly-marked body (** ** headers prefixed ■, `· · ·` dividers, *italic*).
 *
 * For each tourLanding doc we set:
 *   intro  → internationalizedArray [{_key, value: PortableText[]}] for en/es/ja
 *   seo    → { metaTitle[], metaDescription[] } from frontmatter title/description
 *
 * Day-tour docs already carry legacy WP intro — this REPLACES it (operator
 * approved). Package docs start empty. summary is left untouched.
 *
 * Reversible: client.patch().set() only, visibility async, no deletes.
 * migration-staging only. Dry-run by default; pass --commit to write.
 * Pass --preview=<docId> to dump converted blocks for one doc as JSON.
 */
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();

const SRC = '/Users/islamhussein/Desktop/tour category pages texts';
const LOCALES = ['en', 'es', 'ja'] as const;
type Locale = (typeof LOCALES)[number];

// ── file→doc mapping ─────────────────────────────────────────────
// dir = sub-tree folder; base = filename stem (day-tour EN has no suffix,
// package EN does); suffixed = whether es/ja files use _<loc>_2026-05.
interface MapEntry { docId: string; dir: string; base: string; enHasSuffix: boolean; }

const GROUP_CITIES = ['aswan', 'cairo', 'hurghada', 'luxor', 'marsa-alam', 'sharm-el-sheikh'];
const PRIVATE_CITIES = ['al-gouna', 'alexandria', 'aswan', 'cairo', 'hurghada', 'luxor', 'marsa-alam', 'safaga', 'sharm-el-sheikh'];

// package folder → tourLanding _id (theme slugs differ from folder names)
const PACKAGE_MAP: Record<string, string> = {
  'adventure': 'tourLanding.multiday-adventure-and-safari-tours',
  'dahabiya-nile-cruise': 'tourLanding.authentic-dahabiya-nile-cruise',
  'egypt-and-the-red-sea': 'tourLanding.egypt-and-the-red-sea',
  'egypt-family-holidays': 'tourLanding.egypt-family-holidays',
  'egypt-in-depth-tours': 'tourLanding.egypt-in-depth',
  'egypt-luxury-holidays': 'tourLanding.egypt-luxury-holidays',
  'egypt-on-the-go': 'tourLanding.egypt-on-the-go',
  'hassle-free-egypt': 'tourLanding.hassle-free-egypt',
  'nile-cruise-holidays': 'tourLanding.nile-cruise-holidays',
  'special-interest-tours': 'tourLanding.special-interest-tours',
};

const MAP: MapEntry[] = [
  ...GROUP_CITIES.map((c) => ({
    docId: `tourLanding.${c}-small-group-day-tours`,
    dir: 'group day tours',
    base: `${c}-small-group-day-tours`,
    enHasSuffix: false,
  })),
  ...PRIVATE_CITIES.map((c) => ({
    docId: `tourLanding.${c}-private-day-tours`,
    dir: 'private day tours',
    base: `${c}-private-day-tours`,
    enHasSuffix: false,
  })),
  ...Object.entries(PACKAGE_MAP).map(([folder, docId]) => ({
    docId,
    dir: `private packages/${folder}`,
    base: folder,
    enHasSuffix: true,
  })),
];

function filePath(e: MapEntry, loc: Locale): string {
  if (loc === 'en' && !e.enHasSuffix) return resolve(SRC, e.dir, 'en', `${e.base}.md`);
  // day-tour es/ja live in <dir>/<loc>/<base>_<loc>_2026-05.md;
  // packages live flat in <dir>/<base>_<loc>_2026-05.md
  const subdir = e.dir.startsWith('private packages') ? '' : `${loc}`;
  const fname = `${e.base}_${loc}_2026-05.md`;
  return subdir ? resolve(SRC, e.dir, subdir, fname) : resolve(SRC, e.dir, fname);
}

// ── frontmatter + body parse ─────────────────────────────────────
interface Parsed { title: string; description: string; body: string; }
function parseFile(path: string): Parsed {
  const raw = readFileSync(path, 'utf8');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error(`No frontmatter in ${path}`);
  const fm = m[1];
  const body = m[2];
  const get = (k: string) => {
    const mm = fm.match(new RegExp(`^${k}:\\s*(.*)$`, 'm'));
    if (!mm) return '';
    let v = mm[1].trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    return v;
  };
  return { title: get('title'), description: get('description'), body };
}

// ── inline markdown (**strong**, *em*) → portable-text spans ──────
let keySeq = 0;
const k = (p: string) => `${p}${(keySeq++).toString(36)}`;

interface Span { _type: 'span'; _key: string; text: string; marks: string[]; }
function inlineSpans(text: string): Span[] {
  const spans: Span[] = [];
  // tokenize on ** ... ** (strong) and * ... * (em), non-greedy
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

/** Convert a markdown body to portable-text blocks. */
function toPortableText(body: string, title: string, enTitle: string): any[] {
  const lines = body.split(/\r?\n/);
  const out: any[] = [];
  let titleDropped = false;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    // drop the leading bold title line (duplicates the H1)
    if (!titleDropped && line === `**${title}**`) { titleDropped = true; continue; }
    // drop the English-gloss line some JA files carry under the localized title
    if (line === enTitle || line === `**${enTitle}**`) continue;
    // drop authoring footer
    if (/^last updated:/i.test(line) || /^最終更新|^última actualización/i.test(line)) continue;
    // divider
    if (line === '· · ·') { out.push(block('normal', [{ _type: 'span', _key: k('s'), text: '· · ·', marks: [] }])); continue; }
    // section header: **■ X**  or  ■ X
    const hdr = line.match(/^\*\*\s*■\s*(.+?)\s*\*\*$/) || line.match(/^■\s*(.+)$/);
    if (hdr) { out.push(block('h2', [{ _type: 'span', _key: k('s'), text: hdr[1].trim(), marks: [] }])); continue; }
    // whole-line italic (em-dash subtitle or closing literary line)
    const isDashSubtitle = /^—\s.*\s—$/.test(line);
    const isWholeItalic = /^\*[^*].*[^*]\*$/.test(line) && !line.slice(1, -1).includes('*');
    if (isDashSubtitle) { out.push(block('normal', [{ _type: 'span', _key: k('s'), text: line, marks: ['em'] }])); continue; }
    if (isWholeItalic) { out.push(block('normal', [{ _type: 'span', _key: k('s'), text: line.slice(1, -1), marks: ['em'] }])); continue; }
    // normal paragraph with inline marks
    out.push(block('normal', inlineSpans(line)));
  }
  // strip a dangling trailing divider (originally preceded "Last updated")
  while (out.length && out[out.length - 1].children?.[0]?.text === '· · ·') out.pop();
  return out;
}

// ── Sanity ───────────────────────────────────────────────────────
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  useCdn: false,
  token: process.env.SANITY_STAGING_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
});

async function main() {
  const commit = process.argv.includes('--commit');
  const previewArg = process.argv.find((a) => a.startsWith('--preview='));
  if (process.env.NEXT_PUBLIC_SANITY_DATASET !== 'migration-staging') {
    throw new Error(`Refusing to run against dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}".`);
  }

  const logRows: string[] = [];
  let written = 0;

  for (const e of MAP) {
    // verify files exist
    const missing = LOCALES.filter((l) => !existsSync(filePath(e, l)));
    if (missing.length) { console.warn(`! ${e.docId}: missing ${missing.join(',')} — skipped`); continue; }

    const enTitle = parseFile(filePath(e, 'en')).title;
    const intro: any[] = [];
    const metaTitle: any[] = [];
    const metaDescription: any[] = [];
    for (const loc of LOCALES) {
      const p = parseFile(filePath(e, loc));
      intro.push({ _key: loc, value: toPortableText(p.body, p.title, enTitle) });
      metaTitle.push({ _type: 'internationalizedArrayStringValue', _key: loc, value: p.title });
      metaDescription.push({ _type: 'internationalizedArrayTextValue', _key: loc, value: p.description });
    }

    if (previewArg && previewArg.split('=')[1] === e.docId) {
      console.log(JSON.stringify({ docId: e.docId, intro }, null, 2));
    }

    const blockCounts = intro.map((i) => `${i._key}:${i.value.length}`).join(' ');
    logRows.push(`${e.docId}  blocks[${blockCounts}]`);

    if (commit) {
      await client
        .patch(e.docId)
        .set({ intro, 'seo.metaTitle': metaTitle, 'seo.metaDescription': metaDescription })
        .commit({ visibility: 'async', autoGenerateArrayKeys: false });
      written++;
    }
  }

  console.log('\nTour-landing intro import');
  console.log(logRows.join('\n'));
  console.log(`\n  docs processed: ${logRows.length}`);
  console.log(commit ? `  WRITTEN: ${written}` : '  DRY RUN (no writes). Re-run with --commit to apply.');
}

main().catch((e) => { console.error(e); process.exit(1); });
