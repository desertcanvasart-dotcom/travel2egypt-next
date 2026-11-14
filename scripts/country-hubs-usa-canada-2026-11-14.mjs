// Owner-locked 2026-11-14 ("Lock it, build them"):
// review/content/country-hubs-usa-canada-2026-11-14-en.md — EN only.
// node scripts/country-hubs-usa-canada-2026-11-14.mjs [--apply] [--publish]
// Copy is parsed straight from the locked file (written text == locked text).
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { createClient } from '@sanity/client';

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2025-02-19',
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN,
  useCdn: false,
});
const apply = process.argv.includes('--apply');
const publish = process.argv.includes('--publish');
const curly = (s) => s.replace(/'/g, '’');
const SRC = readFileSync('review/content/country-hubs-usa-canada-2026-11-14-en.md', 'utf8');
if (!SRC.includes('LOCKED by owner')) { console.error('not locked'); process.exit(1); }

const GROUP = 'tour.11-day-egypt-group-tour-cairo-red-sea-nile';
const HUBS = {
  usa: { slug: 'egypt-tours-from-usa', theme: 'From the USA', range: [7, 14], featured: [GROUP, 'wp-page-89558', 'wp-page-156539'], guide: 'wp-post-135096-en' },
  canada: { slug: 'egypt-tours-from-canada', theme: 'From Canada', range: [10, 14], featured: [GROUP, 'wp-page-156539', 'wp-page-89524'], guide: 'wp-post-155033-en' },
};
const field = (s, n) => (s.match(new RegExp(`\\*\\*${n}:\\*\\* (.+)`)) ?? [])[1]?.trim();
for (const [k, h] of Object.entries(HUBS)) {
  const a = SRC.indexOf(`## Hub ${k === 'usa' ? 1 : 2}: \`/${h.slug}\``);
  const b = SRC.indexOf('\n## ', a + 5);
  const s = SRC.slice(a, b);
  Object.assign(h, {
    metaTitle: field(s, 'SEO title'), metaDescription: field(s, 'Meta description'), title: field(s, 'H1'),
    summary: field(s, 'Lede'), whyHeading: field(s, 'Heading'),
    why: s.split('\n').filter((l) => l.startsWith('> ') && l.length > 2).map((l) => l.slice(2).trim()),
    faq: [...s.matchAll(/^\d\. \*\*(.+?)\*\* (.+)$/gm)].map((m) => [m[1], m[2]]),
  });
  for (const f of ['metaTitle', 'metaDescription', 'title', 'summary', 'whyHeading']) if (!h[f]) throw new Error(`parse ${k}.${f}`);
  if (h.why.length !== 3 || h.faq.length !== 3) throw new Error(`parse ${k} why/faq ${h.why.length}/${h.faq.length}`);
}
console.log('parsed locked copy for usa, canada');

let n = 0;
const key = (p) => `${p}${(n++).toString(36)}`;
const en = (v, t = 'internationalizedArrayStringValue') => [{ _key: 'en', _type: t, value: curly(v) }];
const block = (t, style = 'normal') => ({ _key: key('b'), _type: 'block', style, markDefs: [], children: [{ _key: key('s'), _type: 'span', marks: [], text: curly(t) }] });
const tx = c.transaction();
for (const [k, h] of Object.entries(HUBS)) {
  const pool = await c.fetch(`*[_type=="tour" && type=="package" && tourMode=="private" && !(_id in path("drafts.**")) && durationDays >= $a && durationDays <= $b] | order(durationDays asc, _createdAt desc)._id`, { a: h.range[0], b: h.range[1] });
  for (const f of h.featured) if (!(await c.getDocument(f))) throw new Error(`featured ${f} missing`);
  const ordered = [...h.featured, ...pool.filter((id) => !h.featured.includes(id))];
  if (await c.fetch(`count(*[_type in ["tour","tourLanding","tourCategory"] && slug[_key=="en"][0].value.current==$s && !(_id in path("drafts.**"))])`, { s: h.slug })) throw new Error(`slug taken ${h.slug}`);
  tx.createOrReplace({ _id: `theme-country-${k}`, _type: 'theme', name: [{ _key: 'en', value: h.theme }], slug: [{ _key: 'en', value: { _type: 'slug', current: `country-${k}` } }], orderRank: 200 });
  tx.createOrReplace({
    _id: `drafts.tourLanding.${h.slug}`, _type: 'tourLanding',
    category: { _type: 'reference', _ref: 'tourCategory.private-package' },
    themeRef: { _type: 'reference', _ref: `theme-country-${k}` },
    title: en(h.title), summary: en(h.summary),
    slug: [{ _key: 'en', _type: 'object', value: { _type: 'slug', current: h.slug } }],
    intro: [{ _key: 'en', value: [block(h.whyHeading, 'h2'), ...h.why.map((t) => block(t))] }],
    faq: h.faq.map(([q, a], i) => ({ _key: `faq-${k}-${i + 1}`, _type: 'landingFaqItem', question: en(q), answer: [{ _key: 'en', value: [block(a)] }] })),
    relatedTours: ordered.map((id) => ({ _key: key('t'), _type: 'reference', _ref: id })),
    journalRefs: [{ _key: key('j'), _type: 'reference', _ref: h.guide }],
    seo: { metaTitle: en(h.metaTitle), metaDescription: en(h.metaDescription, 'internationalizedArrayTextValue') },
  });
  console.log(`[${k}] /${h.slug}: ${ordered.length} tours (${h.range.join('–')} days + group), "${h.title}"`);
}
if (apply) console.log('committed', (await tx.commit()).transactionId);
else if (!publish) console.log('dry run — pass --apply');
if (publish) for (const h of Object.values(HUBS)) {
  const id = `tourLanding.${h.slug}`;
  console.log('published', id, (await c.action({ actionType: 'sanity.action.document.publish', draftId: `drafts.${id}`, publishedId: id })).transactionId);
}
