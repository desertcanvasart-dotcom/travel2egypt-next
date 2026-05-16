#!/usr/bin/env node
/**
 * Session 37 — Create the Contact editorialPage doc.
 *
 * Action-oriented page: terse editorial sections + WhatsApp CTAs. Copy is
 * sourced directly from the session 37 brief (no separate prep .md).
 *
 * Usage:
 *   node scripts/import-contact.mjs            # dry-run
 *   node scripts/import-contact.mjs --commit   # write to Sanity
 */
import { createClient } from '@sanity/client';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// .env is gitignored and lives in the main checkout, not the worktree —
// walk up from ROOT until we find it.
function findEnv(start) {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, '.env');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error('Could not locate a .env file walking up from ' + start);
}

const envPath = findEnv(ROOT);
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => {
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
const DOC_ID = 'editorial-page-contact';
const WHATSAPP_CTA_HREF =
  'https://wa.me/201158011600?text=' +
  encodeURIComponent("Hi Travel2Egypt, I'd like to talk about planning a trip.");

const k = () => randomBytes(6).toString('hex');

/**
 * Build a PT block. Supports **bold**, *italic*, and [text](url) links.
 * Links become `externalLink` markDefs (mailto:/tel: open in-place, all
 * else in a new tab).
 */
function ptBlock(text, style = 'normal', listItem) {
  const markDefs = [];
  const spans = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) spans.push({ text: text.slice(last, m.index), marks: [] });
    if (m[1] !== undefined) {
      const key = k();
      const href = m[2];
      const inPlace = href.startsWith('mailto:') || href.startsWith('tel:');
      markDefs.push({ _type: 'externalLink', _key: key, href, newTab: !inPlace });
      spans.push({ text: m[1], marks: [key] });
    } else if (m[3] !== undefined) {
      spans.push({ text: m[3], marks: ['strong'] });
    } else if (m[4] !== undefined) {
      spans.push({ text: m[4], marks: ['em'] });
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) spans.push({ text: text.slice(last), marks: [] });
  if (spans.length === 0) spans.push({ text, marks: [] });
  const block = {
    _type: 'block',
    _key: k(),
    style,
    markDefs,
    children: spans.map((s) => ({ _type: 'span', _key: k(), text: s.text, marks: s.marks })),
  };
  if (listItem) {
    block.listItem = listItem;
    block.level = 1;
  }
  return block;
}

// ── Section bodies ──────────────────────────────────────────────

const sectionHowToReach = [
  ptBlock(
    "We're a small, founder-led team and we answer our own messages. Pick whatever's easiest for you."
  ),
  ptBlock(
    '**WhatsApp** — [+20 115 801 1600](https://wa.me/201158011600). The fastest way to reach us, and the one we recommend.',
    'normal',
    'bullet'
  ),
  ptBlock(
    '**Email** — [info@travel2egypt.org](mailto:info@travel2egypt.org).',
    'normal',
    'bullet'
  ),
  ptBlock(
    '**Phone** — [+20 115 801 1600](tel:+201158011600).',
    'normal',
    'bullet'
  ),
];

const sectionWhenYouHearBack = [
  ptBlock('We answer fast, and we hold ourselves to it:'),
  ptBlock(
    'Send an inquiry **before 1 PM Cairo time**, and you’ll have a reply by **8 PM Cairo time the same day**.',
    'normal',
    'bullet'
  ),
  ptBlock(
    'Send it **after 1 PM**, and you’ll hear back by **10 AM Cairo time the next morning**.',
    'normal',
    'bullet'
  ),
  ptBlock(
    'This commitment runs seven days a week, holidays included. It’s a promise, not an aspiration — we honor it.'
  ),
];

const sectionWhereBased = [
  ptBlock('Cairo, Egypt.'),
  ptBlock(
    'We’re Egyptian-run, founder-led, and online-focused. Islam has worked in Egyptian travel since 1993, and Travel2Egypt has been a registered company since 2003. We work in English, Spanish, Japanese, Finnish, and Arabic.'
  ),
];

const sectionAccreditations = [
  ptBlock('We’re members of the travel industry’s established bodies:'),
  ptBlock('**JATA** — Japan Association of Travel Agents', 'normal', 'bullet'),
  ptBlock('**IATA** — International Air Transport Association', 'normal', 'bullet'),
  ptBlock('**ASTA** — American Society of Travel Advisors', 'normal', 'bullet'),
  ptBlock('**ETAA** — Egyptian Travel Agents Association', 'normal', 'bullet'),
];

const i18nText = (value) => [{ _key: 'en', value }];
const i18nPt = (blocks) => [{ _key: 'en', _type: 'object', value: blocks }];

const doc = {
  _id: DOC_ID,
  _type: 'editorialPage',
  kind: 'contact',
  title: 'Contact',
  slug: [{ _key: 'en', value: { _type: 'slug', current: 'contact' } }],
  lastUpdated: '2026-05-16',

  heroHeading: i18nText('Get in touch'),
  heroSubhead: i18nText('Direct lines to the team. Real responses, fast.'),
  heroPrimaryCta: {
    label: i18nText('Talk to us on WhatsApp'),
    href: WHATSAPP_CTA_HREF,
  },

  sections: [
    {
      _key: k(),
      _type: 'section',
      heading: i18nText('How to reach us'),
      body: i18nPt(sectionHowToReach),
    },
    {
      _key: k(),
      _type: 'section',
      heading: i18nText("When you'll hear back"),
      body: i18nPt(sectionWhenYouHearBack),
    },
    {
      _key: k(),
      _type: 'section',
      heading: i18nText("Where we're based"),
      body: i18nPt(sectionWhereBased),
    },
    {
      _key: k(),
      _type: 'section',
      heading: i18nText('Accreditations'),
      body: i18nPt(sectionAccreditations),
    },
  ],

  bottomCtaHeading: i18nText('Ready when you are'),
  bottomCtaBody: i18nText(
    "Tell us what you're thinking — a rough idea is enough to start. We'll take it from there."
  ),
  bottomCtaPrimary: {
    label: i18nText('Talk to us on WhatsApp'),
    href: WHATSAPP_CTA_HREF,
  },
};

console.log(`Mode: ${COMMIT ? 'COMMIT' : 'DRY-RUN'}`);
console.log(`Env: ${envPath}`);
console.log(`Dataset: ${env.NEXT_PUBLIC_SANITY_DATASET}`);
console.log(`Doc _id: ${doc._id}`);
console.log(`Sections: ${doc.sections.length}`);
for (const s of doc.sections) {
  const blocks = s.body[0].value;
  const totalChars = blocks.reduce(
    (acc, b) => acc + b.children.reduce((a, c) => a + (c.text?.length || 0), 0),
    0
  );
  const links = blocks.reduce((acc, b) => acc + b.markDefs.length, 0);
  console.log(
    `  ${s.heading[0].value.padEnd(24)} ${blocks.length} blocks, ${totalChars} chars, ${links} links`
  );
}
console.log(`Hero CTA:   ${doc.heroPrimaryCta.href}`);
console.log(`Bottom CTA: ${doc.bottomCtaPrimary.href}`);

if (!COMMIT) {
  console.log('Re-run with --commit to write to Sanity.');
  process.exit(0);
}

const result = await client.createOrReplace(doc, { visibility: 'sync' });
console.log(`\n=== Wrote ${result._id} ===`);
