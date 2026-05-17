#!/usr/bin/env node
/**
 * Session 42 — Update the existing editorial-page-about doc with v2 copy.
 *
 * UPDATES (patches) the doc created in session 38 — same _id, _type, kind,
 * slug. Replaces heroHeading + sections + bottom CTA; removes the v1 hero
 * subhead and hero CTA. Uploads the team photo and embeds it at the top of
 * section 4.
 *
 * Source: migration/content/about-prep.md (v2). Photo:
 * migration/content/about-team-photo.jpg.
 *
 * Usage:
 *   node scripts/update-about-v2.mjs            # dry-run
 *   node scripts/update-about-v2.mjs --commit   # upload photo + patch doc
 */
import { createClient } from '@sanity/client';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function findEnv(start) {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    const c = path.join(dir, '.env');
    if (fs.existsSync(c)) return c;
    const p = path.dirname(dir);
    if (p === dir) break;
    dir = p;
  }
  throw new Error('Could not locate a .env file');
}
const env = Object.fromEntries(
  fs.readFileSync(findEnv(ROOT), 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => {
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
const PHOTO = path.join(ROOT, 'migration/content/about-team-photo.jpg');
const PHOTO_ALT =
  'Travel2Egypt team — Egyptologist guides, drivers, and operations staff across Cairo, Aswan, and Luxor';
const WHATSAPP_HREF =
  'https://wa.me/201158011600?text=' +
  encodeURIComponent(
    'Hi Islam, I read your About page and would like to start a conversation about a trip to Egypt.'
  );

const k = () => randomBytes(6).toString('hex');

/** PT block. Supports **bold**, *italic*, [text](url). Root-relative and
 *  mailto/tel links open in place; other links open in a new tab. */
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
      const inPlace =
        href.startsWith('/') || href.startsWith('mailto:') || href.startsWith('tel:');
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
const p = (t) => ptBlock(t);
const i18nText = (value) => [{ _key: 'en', value }];
const i18nPt = (blocks) => [{ _key: 'en', _type: 'object', value: blocks }];

function imageBlock(assetRef) {
  return {
    _type: 'image',
    _key: k(),
    asset: { _type: 'reference', _ref: assetRef },
    alt: i18nText(PHOTO_ALT),
  };
}

// ── Section copy — from migration/content/about-prep.md (v2) ──
function buildSections(assetRef) {
  return [
    {
      _key: k(),
      _type: 'section',
      heading: i18nText('An Aswan childhood'),
      body: i18nPt([
        p(
          'I grew up in Aswan in the 1980s. The Nile was a half-block from our door, and the granite hills above the city were where children went when they wanted to be alone. I learned the cataracts before I learned arithmetic. The Nubian families on Elephantine Island were our neighbors, and the felucca captains knew my father by name.'
        ),
      ]),
    },
    {
      _key: k(),
      _type: 'section',
      heading: i18nText('Thirty years of work'),
      body: i18nPt([
        p(
          'I started guiding visitors in 1993. I was twenty, and I knew the temples better than the textbook. The first group I took to Philae had no idea what they were looking at, and by the end of the morning I understood something that has shaped the next thirty years of my work: most people arrive in Egypt with the wrong expectations. The country they have read about and the country they are standing in are not the same place. Part of the work of a guide — and later, a tour operator — is to gently bridge that distance.'
        ),
        p(
          'By the late 1990s I was running marketing for a Cairo-based operator. In 2003 I registered my own company, Travel2Egypt. Over the next decade we opened branches in Tokyo, Damascus, and Amman. We had staff in four countries and routes that ran across the Middle East.'
        ),
      ]),
    },
    {
      _key: k(),
      _type: 'section',
      heading: i18nText('A deliberate decision'),
      body: i18nPt([
        p(
          'Then several things happened at once. The Syrian war closed our Damascus office. The Jordan branch became difficult to justify. The Egyptian tourism economy shifted under our feet during the years after 2011, and the model that had worked at scale stopped working. Around the same time, my health required me to make some choices about how to spend my time.'
        ),
        p(
          'I made a deliberate decision to step back to a smaller operation. Online-only. Founder-led. The travelers we work with now reach me directly. The trips we plan are not pulled from a catalog. The guides we use are people I have known for fifteen or twenty years.'
        ),
      ]),
    },
    {
      _key: k(),
      _type: 'section',
      heading: i18nText('How we work now'),
      body: i18nPt([
        imageBlock(assetRef),
        p(
          'The team photograph above is most of the people who actually deliver these trips: Egyptologist guides, drivers, operations staff in Cairo and Aswan and Luxor. We are licensed by the Egyptian Travel Agents Association, which most travelers will not care about, but which matters when something goes wrong on the ground. In thirty years of work in Egyptian tourism, the things that go wrong are not the things you can prepare for in advance. They are handled by people who know the country, the regulations, and each other.'
        ),
        p(
          'Travel2Egypt now operates at a deliberately small scale. We plan roughly a hundred and thirty distinct trips a year, almost all of them built around the specific traveler rather than fitted to a template. We do not run scheduled departures. We do not bulk-book hotels. We do not sell add-ons. The work is closer to what a private travel adviser does than what an online tour platform does, and it produces a different kind of trip.'
        ),
      ]),
    },
    {
      _key: k(),
      _type: 'section',
      heading: i18nText('An invitation'),
      body: i18nPt([
        p(
          'What we do is plan journeys in Egypt and walk travelers through them. [The journal](/blog) is where we share what we have learned about traveling in this country well. [The tour pages](/tours) show some of what we currently offer, though most trips begin as a conversation rather than as a booking. When you are ready to talk through a trip of your own, you can reach me directly.'
        ),
        p('*— Islam Hussein, Founder, Travel2Egypt*'),
      ]),
    },
  ];
}

function wordCount(sections) {
  let n = 0;
  for (const s of sections) {
    for (const b of s.body[0].value) {
      if (b._type !== 'block') continue;
      for (const c of b.children) n += (c.text || '').trim().split(/\s+/).filter(Boolean).length;
    }
  }
  return n;
}

const previewSections = buildSections('image-PENDING-UPLOAD');
const linkCount = previewSections
  .flatMap((s) => s.body[0].value)
  .reduce((a, b) => a + (b.markDefs ? b.markDefs.length : 0), 0);
const imageBlocks = previewSections
  .flatMap((s) => s.body[0].value)
  .filter((b) => b._type === 'image').length;

// Old body word count, for the dry-run before/after.
let oldWords = 'n/a';
try {
  const old = await client.fetch(
    '*[_id==$id][0].sections[].body[_key=="en"][0].value[].children[].text',
    { id: DOC_ID }
  );
  if (Array.isArray(old)) {
    oldWords = old.join(' ').trim().split(/\s+/).filter(Boolean).length;
  }
} catch {
  /* ignore */
}

console.log(`Mode: ${COMMIT ? 'COMMIT' : 'DRY-RUN'}`);
console.log(`Dataset: ${env.NEXT_PUBLIC_SANITY_DATASET}`);
console.log(`Doc _id: ${DOC_ID}  (patch — no new doc created)`);
console.log(`Sections: ${previewSections.length}`);
previewSections.forEach((s, i) => {
  const blocks = s.body[0].value;
  console.log(
    `  ${i + 1}. ${s.heading[0].value.padEnd(24)} ${blocks.length} block(s)` +
      `${blocks.some((b) => b._type === 'image') ? '  [has image]' : ''}`
  );
});
console.log(`Image blocks in section 4: ${imageBlocks}`);
console.log(`Inline links in section 5: ${linkCount}`);
console.log(`Word count — new body: ${wordCount(previewSections)}  | old body: ${oldWords}`);
console.log(`Bottom CTA: "Reach me on WhatsApp" -> ${WHATSAPP_HREF}`);
console.log(`Hero: heading "About"; subhead REMOVED; hero CTA REMOVED`);

if (!COMMIT) {
  console.log('\nRe-run with --commit to upload the photo and patch the doc.');
  process.exit(0);
}

// ── Commit: upload photo, then patch ──
const asset = await client.assets.upload('image', fs.createReadStream(PHOTO), {
  filename: 'about-team-photo.jpg',
  title: 'About page team photo',
});
console.log(`\nUploaded asset: ${asset._id}`);

const sections = buildSections(asset._id);
await client
  .patch(DOC_ID)
  .set({
    heroHeading: i18nText('About'),
    sections,
    bottomCtaPrimary: { label: i18nText('Reach me on WhatsApp'), href: WHATSAPP_HREF },
    lastUpdated: '2026-05-17',
  })
  .unset([
    'heroSubhead',
    'heroPrimaryCta',
    'heroSecondaryCta',
    'bottomCtaHeading',
    'bottomCtaBody',
    'bottomCtaSecondary',
  ])
  .commit({ visibility: 'sync' });

console.log(`=== Patched ${DOC_ID} — asset _id: ${asset._id} ===`);
