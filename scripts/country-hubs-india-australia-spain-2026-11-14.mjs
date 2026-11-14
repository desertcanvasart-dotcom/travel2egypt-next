// Owner-locked 2026-11-14 ("Lock all three, build"):
//   review/content/country-hubs-india-australia-2026-11-14-en.md (EN)
//   review/content/country-hub-spain-2026-11-14-es.md (ES only)
// node scripts/country-hubs-india-australia-spain-2026-11-14.mjs [--apply] [--publish]
// Copy parsed straight from the locked files (written text == locked text).
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
const EN = readFileSync('review/content/country-hubs-india-australia-2026-11-14-en.md', 'utf8');
const ES = readFileSync('review/content/country-hub-spain-2026-11-14-es.md', 'utf8');
if (!EN.includes('LOCKED by owner') || !ES.includes('LOCKED by owner')) { console.error('not locked'); process.exit(1); }

const HUBS = [
  { k: 'india', loc: 'en', src: EN, heading: '## Hub 1: `/egypt-tours-from-india`', slug: 'egypt-tours-from-india', theme: 'From India', range: [7, 14],
    featured: ['wp-page-89558', 'wp-page-156539', 'wp-page-89895'], journal: ['wp-post-136112-en'] },
  { k: 'australia', loc: 'en', src: EN, heading: '## Hub 2: `/egypt-tours-from-australia`', slug: 'egypt-tours-from-australia', theme: 'From Australia', range: [7, 14],
    featured: ['tour.12-day-egypt-group-tour-cairo-dahabiya-red-sea', 'wp-page-156539', 'wp-page-113004'], journal: ['wp-post-136112-en'] },
  { k: 'spain', loc: 'es', src: ES, heading: '---', slug: 'tours-a-egipto-desde-espana', theme: 'Desde España', range: [5, 10],
    featured: ['tour.10-day-egypt-group-tour-cairo-nile-red-sea', 'wp-page-89558', 'wp-page-136566'], journal: ['wp-post-144449-es'] },
];
const field = (s, n) => (s.match(new RegExp(`\\*\\*${n}:\\*\\* (.+)`)) ?? [])[1]?.trim();
for (const h of HUBS) {
  const a = h.src.indexOf(h.heading); if (a < 0) throw new Error(`section ${h.k}`);
  const b = h.src.indexOf('\n## ', a + 5); const s = h.src.slice(a, b < 0 ? undefined : b);
  Object.assign(h, {
    metaTitle: field(s, 'SEO title'), metaDescription: field(s, 'Meta description'), title: field(s, 'H1'),
    summary: field(s, 'Lede'), whyHeading: field(s, 'Heading'),
    why: s.split('\n').filter((l) => l.startsWith('> ') && l.length > 2).map((l) => l.slice(2).trim()),
    faq: [...s.matchAll(/^\d\. \*\*(.+?)\*\* (.+)$/gm)].map((m) => [m[1], m[2]]),
  });
  for (const f of ['metaTitle', 'metaDescription', 'title', 'summary', 'whyHeading']) if (!h[f]) throw new Error(`parse ${h.k}.${f}`);
  if (h.why.length !== 3 || h.faq.length < 3) throw new Error(`parse ${h.k} why/faq ${h.why.length}/${h.faq.length}`);
}
// numeric gate (figures that must survive)
const NUM = { india: ['seven to fourteen', '30%'], australia: ['seven to fourteen', '30%'], spain: ['cinco a diez', '30 %'] };
for (const h of HUBS) { const all = JSON.stringify(h); for (const n of NUM[h.k]) if (!all.includes(n)) throw new Error(`numeric ${h.k}: ${n}`); }
console.log('parsed + numeric gate OK');

let n = 0;
const key = (p) => `${p}${(n++).toString(36)}`;
const tx = c.transaction();
for (const h of HUBS) {
  const L = h.loc;
  const v = (x, t = 'internationalizedArrayStringValue') => [{ _key: L, _type: t, value: L === 'en' ? curly(x) : x }];
  const block = (t, style = 'normal') => ({ _key: key('b'), _type: 'block', style, markDefs: [], children: [{ _key: key('s'), _type: 'span', marks: [], text: L === 'en' ? curly(t) : t }] });
  const pool = await c.fetch(`*[_type=="tour" && type=="package" && tourMode=="private" && !(_id in path("drafts.**")) && durationDays >= $a && durationDays <= $b] | order(durationDays asc, _createdAt desc)._id`, { a: h.range[0], b: h.range[1] });
  for (const f of h.featured) if (!(await c.getDocument(f))) throw new Error(`featured ${f} missing`);
  const ordered = [...h.featured, ...pool.filter((id) => !h.featured.includes(id))];
  const taken = await c.fetch(`count(*[_type in ["tour","tourLanding","tourCategory"] && slug[_key==$l][0].value.current==$s && !(_id in path("drafts.**"))])`, { l: L, s: h.slug });
  if (taken) throw new Error(`slug taken ${L}/${h.slug}`);
  tx.createOrReplace({ _id: `theme-country-${h.k}`, _type: 'theme', name: [{ _key: L, value: h.theme }], slug: [{ _key: L, value: { _type: 'slug', current: `country-${h.k}` } }], orderRank: 200 });
  tx.createOrReplace({
    _id: `drafts.tourLanding.country-${h.k}`, _type: 'tourLanding',
    category: { _type: 'reference', _ref: 'tourCategory.private-package' },
    themeRef: { _type: 'reference', _ref: `theme-country-${h.k}` },
    title: v(h.title), summary: v(h.summary),
    slug: [{ _key: L, _type: 'object', value: { _type: 'slug', current: h.slug } }],
    intro: [{ _key: L, value: [block(h.whyHeading, 'h2'), ...h.why.map((t) => block(t))] }],
    faq: h.faq.map(([q, a], i) => ({ _key: `faq-${h.k}-${i + 1}`, _type: 'landingFaqItem', question: v(q), answer: [{ _key: L, value: [block(a)] }] })),
    relatedTours: ordered.map((id) => ({ _key: key('t'), _type: 'reference', _ref: id })),
    journalRefs: h.journal.map((id) => ({ _key: key('j'), _type: 'reference', _ref: id })),
    seo: { metaTitle: v(h.metaTitle), metaDescription: v(h.metaDescription, 'internationalizedArrayTextValue') },
  });
  console.log(`[${h.k}] /${L === 'en' ? '' : L + '/'}${h.slug}: ${ordered.length} tours, ${h.faq.length} FAQs — "${h.title}"`);
}
if (apply) console.log('committed', (await tx.commit()).transactionId);
else if (!publish) console.log('dry run — pass --apply');
if (publish) for (const h of HUBS) {
  const id = `tourLanding.country-${h.k}`;
  console.log('published', id, (await c.action({ actionType: 'sanity.action.document.publish', draftId: `drafts.${id}`, publishedId: id })).transactionId);
}
