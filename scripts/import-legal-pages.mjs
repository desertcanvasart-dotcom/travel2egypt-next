#!/usr/bin/env node
/**
 * Session 30 — Import 4 legal pages (Terms, Privacy, Cookie, Disclaimer)
 * from operator's .docx files into Sanity migration-staging.
 *
 * Pipeline:
 *   1. macOS `textutil` already converted each .docx to .html (stored in
 *      /tmp/legal-extract/).
 *   2. This script parses each HTML, derives portable-text blocks, applies
 *      the Travel Nomad insertion to the Disclaimer, and writes to Sanity.
 *
 * Usage:
 *   node scripts/import-legal-pages.mjs            # dry-run, prints summary + samples
 *   node scripts/import-legal-pages.mjs --commit   # writes to Sanity
 */
import { createClient } from '@sanity/client';
import { parse } from 'node-html-parser';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => {
    const i = l.indexOf('=');
    return [l.slice(0, i), l.slice(i + 1).replace(/^['"]|['"]$/g, '')];
  })
);
const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const COMMIT = process.argv.includes('--commit');
const SOURCE_DIR = '/tmp/legal-extract';
const EFFECTIVE_DATE = '2026-05-16';

const DOCS = [
  { kind: 'terms',      file: 'Terms_and_Conditions.html', slug: 'terms',           title: 'Terms & Conditions', id: 'legal-terms' },
  { kind: 'privacy',    file: 'Privacy_Policy.html',       slug: 'privacy-policy',  title: 'Privacy Policy',     id: 'legal-privacy-policy' },
  { kind: 'cookies',    file: 'Cookie_Policy.html',        slug: 'cookie-policy',   title: 'Cookie Policy',      id: 'legal-cookie-policy' },
  { kind: 'disclaimer', file: 'Disclaimer.html',           slug: 'disclaimer',      title: 'Disclaimer',         id: 'legal-disclaimer' },
];

const k = () => randomBytes(6).toString('hex');

/** Convert one HTML element (paragraph or list-item content) into a children[] array of spans with marks. */
function inlineChildren(node) {
  const children = [];
  const collect = (n, marks) => {
    if (n.nodeType === 3) {
      // text
      const t = n.text;
      if (t) children.push({ _type: 'span', _key: k(), text: t, marks: [...marks] });
      return;
    }
    if (n.nodeType !== 1) return;
    const tag = n.tagName?.toLowerCase();
    const next = [...marks];
    if (tag === 'b' || tag === 'strong') next.push('strong');
    if (tag === 'i' || tag === 'em') next.push('em');
    for (const c of n.childNodes) collect(c, next);
  };
  for (const c of node.childNodes) collect(c, []);
  // Merge adjacent spans with identical marks for cleanliness.
  const merged = [];
  for (const s of children) {
    const prev = merged[merged.length - 1];
    if (prev && prev._type === 'span' && JSON.stringify(prev.marks) === JSON.stringify(s.marks)) {
      prev.text += s.text;
    } else {
      merged.push(s);
    }
  }
  return merged.filter((s) => s.text.length > 0);
}

/** Test whether a paragraph is purely a bold-only heading. */
function isHeadingParagraph(p) {
  // Filter out non-element children (whitespace text nodes between tags get stripped after trim).
  const real = p.childNodes.filter((n) => {
    if (n.nodeType === 3) return n.text.trim().length > 0;
    return n.nodeType === 1;
  });
  return real.length >= 1 && real.every((n) => n.nodeType === 1 && (n.tagName?.toLowerCase() === 'b' || n.tagName?.toLowerCase() === 'strong'));
}

function parseHtmlToBlocks(html, opts = {}) {
  const root = parse(html);
  const body = root.querySelector('body');
  const blocks = [];
  let titleSeen = false;

  for (const child of body.childNodes) {
    if (child.nodeType !== 1) continue;
    const tag = child.tagName?.toLowerCase();

    if (tag === 'p') {
      const text = child.text.trim();
      if (!text) continue; // skip empty paragraphs

      // First bold-only paragraph is the document title — skip (we set title at the doc level).
      if (!titleSeen && isHeadingParagraph(child)) {
        titleSeen = true;
        continue;
      }

      // Skip the standalone "Effective date" / "Last updated" line — represented at doc level.
      if (/^(Effective date|Last updated):/i.test(text)) {
        continue;
      }

      if (isHeadingParagraph(child)) {
        // Subsection heading → h2 (or h3 if we want a deeper level — single level for simplicity)
        blocks.push({
          _type: 'block',
          _key: k(),
          style: 'h2',
          markDefs: [],
          children: [{ _type: 'span', _key: k(), text: text, marks: [] }],
        });
      } else {
        blocks.push({
          _type: 'block',
          _key: k(),
          style: 'normal',
          markDefs: [],
          children: inlineChildren(child),
        });
      }
    } else if (tag === 'ul' || tag === 'ol') {
      const listItem = tag === 'ol' ? 'number' : 'bullet';
      for (const li of child.childNodes) {
        if (li.nodeType !== 1 || li.tagName?.toLowerCase() !== 'li') continue;
        const text = li.text.trim();
        if (!text) continue;
        blocks.push({
          _type: 'block',
          _key: k(),
          style: 'normal',
          listItem,
          level: 1,
          markDefs: [],
          children: inlineChildren(li),
        });
      }
    }
  }

  // Disclaimer-specific: inject Travel Nomad recommendation right after the
  // "Travel insurance is strongly recommended…" sentence.
  if (opts.kind === 'disclaimer') {
    const idx = blocks.findIndex((b) =>
      b.children?.some((c) => c.text?.includes('Travel insurance is strongly recommended'))
    );
    if (idx >= 0) {
      // Append a sentence to that paragraph rather than inserting a new paragraph,
      // since the recommendation is editorially part of the same point.
      const block = blocks[idx];
      const lastSpan = block.children[block.children.length - 1];
      const suffix = ' We recommend Travel Nomad as our insurance partner.';
      if (lastSpan && lastSpan._type === 'span') {
        lastSpan.text = lastSpan.text + suffix;
      } else {
        block.children.push({ _type: 'span', _key: k(), text: suffix, marks: [] });
      }
    }
  }

  return blocks;
}

const buildDocs = () => DOCS.map((meta) => {
  const html = fs.readFileSync(path.join(SOURCE_DIR, meta.file), 'utf8');
  const blocks = parseHtmlToBlocks(html, { kind: meta.kind });
  const doc = {
    _id: meta.id,
    _type: 'legalPage',
    kind: meta.kind,
    title: [{ _key: 'en', value: meta.title }],
    slug: [{ _key: 'en', value: { _type: 'slug', current: meta.slug } }],
    lastUpdated: EFFECTIVE_DATE,
    legalReviewStatus: { en: false, es: false, ja: false },
    body: [{ _key: 'en', _type: 'object', value: blocks }],
  };
  return { meta, blocks, doc };
});

const docs = buildDocs();

// Summary report.
console.log(`Mode: ${COMMIT ? 'COMMIT (writes to Sanity)' : 'DRY-RUN (no writes)'}`);
console.log(`Dataset: ${env.NEXT_PUBLIC_SANITY_DATASET}`);
console.log('');
for (const { meta, blocks, doc } of docs) {
  const blockCounts = blocks.reduce((acc, b) => {
    const key = b.listItem ? `list-${b.listItem}` : b.style;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const totalText = blocks.reduce((s, b) => s + b.children.reduce((s2, c) => s2 + (c.text?.length || 0), 0), 0);
  console.log(`${meta.id}  (${meta.kind})`);
  console.log(`  slug: /${meta.slug}`);
  console.log(`  blocks: ${blocks.length}  (${JSON.stringify(blockCounts)})`);
  console.log(`  text chars (EN body): ${totalText}`);
  console.log(`  first heading: "${blocks.find((b) => b.style === 'h2')?.children?.[0]?.text || '(none)'}"`);
  // For Disclaimer, surface the Travel Nomad line so operator can confirm.
  if (meta.kind === 'disclaimer') {
    const tn = blocks.find((b) => b.children?.some((c) => c.text?.includes('Travel Nomad')));
    console.log(`  Travel Nomad line: ${tn?.children?.map((c) => c.text).join('') || '(NOT FOUND — INSERTION FAILED)'}`);
  }
  console.log('');
}

if (!COMMIT) {
  console.log('Re-run with --commit to write these 4 documents to Sanity.');
  process.exit(0);
}

const tx = client.transaction();
for (const { doc } of docs) tx.createOrReplace(doc);
const result = await tx.commit({ visibility: 'sync' });
console.log(`\n=== Created/replaced ${docs.length} legalPage docs in transaction ${result.transactionId} ===`);
for (const { doc } of docs) console.log(`  ${doc._id}  (${doc.kind})`);
