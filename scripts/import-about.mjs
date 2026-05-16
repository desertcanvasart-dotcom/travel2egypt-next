#!/usr/bin/env node
/**
 * Session 38 — Create the About editorialPage doc.
 *
 * Source copy: migration/content/about-prep.md (operator polished, FINAL).
 * Sections are hand-mapped — same approach as Responsible Travel (s36) and
 * Contact (s37).
 *
 * Usage:
 *   node scripts/import-about.mjs            # dry-run
 *   node scripts/import-about.mjs --commit   # write to Sanity
 */
import { createClient } from '@sanity/client';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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
const DOC_ID = 'editorial-page-about';
const WHATSAPP_HERO =
  'https://wa.me/201158011600?text=' +
  encodeURIComponent("Hi Travel2Egypt, I'd like to start planning a trip.");
const WHATSAPP_BOTTOM =
  'https://wa.me/201158011600?text=' +
  encodeURIComponent(
    "Hi Travel2Egypt, I read your About page and would like to start planning a trip."
  );

const k = () => randomBytes(6).toString('hex');

/** Build a PT block. Supports **bold**, *italic*, and [text](url) links. */
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

// ── Section bodies — sourced from migration/content/about-prep.md ──

const sectionAswan = [
  ptBlock(
    "I was born in Aswan, where the Nile narrows through granite and palms, refusing to be ordinary. As a child, those waters were a presence more than a thing — the granite holding heat after sunset, Nubian houses painted in colours the desert shouldn't allow, a riverbank where everyone knew everyone. My toy boat, uneven and sun-bleached, drifted in a current older than any country."
  ),
  ptBlock(
    "One afternoon a felucca passed, full of visitors. Cameras up, faces eager. I wanted to call out — to tell them what they were missing. The names of the islands. Which side of the Nile the morning light favours. The tales only a child raised on that riverbank could know. I had no English then. I hummed a Nubian tune instead."
  ),
  ptBlock('That moment is, in a way, why I do what I do.'),
];

const sectionThirtyYears = [
  ptBlock(
    "I've spent 32 years working in Egyptian travel. I started in 1993 as a tour guide. Over the years that grew into marketing, then operations, then running a company with branches in Tokyo, Syria, and Jordan — serving travelers from markets that demand very different things from Egypt."
  ),
  ptBlock(
    "**Travel2Egypt has operated as a registered company since 2003.** After two decades of expansion, I made a deliberate decision: focus the operation. Smaller, online-first, founder-led. The Syria and Jordan branches closed. What remained was what mattered most — the direct relationships with travelers, the depth of local supplier knowledge that takes decades to build, and the freedom to choose how I work."
  ),
  ptBlock(
    "The result is a company that's smaller than it once was, but more focused. Every trip we organize is touched by someone who's spent 30 years figuring out what makes Egypt trips succeed and fail."
  ),
];

const sectionWhatItMeans = [
  ptBlock(
    "**Itineraries built around you, not us.** Most Egypt itineraries follow the same beats — pyramids, temples, a cruise, a souk. The photographs look identical because the routes are identical. We plan around how you actually want to move — slow or fast, deep or wide, alone or with family."
  ),
  ptBlock(
    "**Operators we'd send our own families to.** The Nile cruise captain we trust. The hotel that still has rooms with character. The driver who knows which mosque opens early and which one rewards the wait."
  ),
  ptBlock(
    "**The real story, not the postcard.** Every monument has two stories — the one for visitors, and the one that makes the stones come alive. You'll hear the second."
  ),
  ptBlock(
    "**Direct lines, fast answers.** When you write to us, you reach the operator. Not a junior in a call center. We respond within hours, seven days a week — by 8 PM Cairo time if you write before 1 PM, by 10 AM the next morning otherwise."
  ),
];

const sectionCredentials = [
  ptBlock("We're members of:"),
  ptBlock('**JATA** — Japan Association of Travel Agents', 'normal', 'bullet'),
  ptBlock('**IATA** — International Air Transport Association', 'normal', 'bullet'),
  ptBlock('**ASTA** — American Society of Travel Advisors', 'normal', 'bullet'),
  ptBlock('**ETAA** — Egyptian Travel Agents Association', 'normal', 'bullet'),
  ptBlock(
    'We work in English, Spanish, Japanese, Finnish, and Arabic — because Egypt is most generous when you arrive on its own terms.'
  ),
];

const sectionInvitation = [
  ptBlock(
    "From Aswan, where the Nile is most itself, to Cairo, where the city is loudest. From Elephantine's gardens to Kalabsha's silence. From a Nubian dinner to the back rooms of the souks."
  ),
  ptBlock(
    "Come see Egypt with someone who's lived its magic — not as a tourist with a checklist, but as a traveller meeting a country."
  ),
  ptBlock('*— Islam Hussein, Travel2Egypt*'),
];

const i18nText = (value) => [{ _key: 'en', value }];
const i18nPt = (blocks) => [{ _key: 'en', _type: 'object', value: blocks }];

const doc = {
  _id: DOC_ID,
  _type: 'editorialPage',
  kind: 'about',
  title: 'About',
  slug: [{ _key: 'en', value: { _type: 'slug', current: 'about' } }],
  lastUpdated: '2026-05-16',

  heroHeading: i18nText('In the heart of Egypt'),
  heroSubhead: i18nText(
    'Thirty years of Egyptian travel, focused into a small company that answers to one person.'
  ),
  heroPrimaryCta: {
    label: i18nText('Talk to us on WhatsApp'),
    href: WHATSAPP_HERO,
  },

  sections: [
    { _key: k(), _type: 'section', heading: i18nText('An Aswan childhood'), body: i18nPt(sectionAswan) },
    { _key: k(), _type: 'section', heading: i18nText('Thirty years of Egypt'), body: i18nPt(sectionThirtyYears) },
    { _key: k(), _type: 'section', heading: i18nText('What this means for your trip'), body: i18nPt(sectionWhatItMeans) },
    { _key: k(), _type: 'section', heading: i18nText('Credentials'), body: i18nPt(sectionCredentials) },
    { _key: k(), _type: 'section', heading: i18nText('An invitation'), body: i18nPt(sectionInvitation) },
  ],

  bottomCtaHeading: i18nText('Start the conversation'),
  bottomCtaBody: i18nText(
    "Tell us how you'd like to see Egypt. We'll plan the rest around you."
  ),
  bottomCtaPrimary: {
    label: i18nText('Talk to us on WhatsApp'),
    href: WHATSAPP_BOTTOM,
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
  const counts = blocks.reduce((acc, b) => {
    const key = b.listItem ? `list-${b.listItem}` : b.style;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  console.log(`  ${s.heading[0].value.padEnd(34)} ${blocks.length} blocks, ${totalChars} chars, ${JSON.stringify(counts)}`);
}
console.log(`Hero CTA:   ${doc.heroPrimaryCta.href}`);
console.log(`Bottom CTA: ${doc.bottomCtaPrimary.href}`);

if (!COMMIT) {
  console.log('Re-run with --commit to write to Sanity.');
  process.exit(0);
}

const result = await client.createOrReplace(doc, { visibility: 'sync' });
console.log(`\n=== Wrote ${result._id} ===`);
