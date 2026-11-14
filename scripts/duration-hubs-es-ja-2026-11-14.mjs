// Owner-approved 2026-11-14 ("Approve, publish both"):
// review/content/duration-hubs-and-faq-2026-11-14-es-ja.md
// Adds ES + JA to the 4 duration hubs (+ theme names), parsing the copy straight
// from the approved file (so written text == approved text), with a numeric gate.
// node scripts/duration-hubs-es-ja-2026-11-14.mjs [--apply]
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { createClient } from '@sanity/client';

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN,
  useCdn: false,
});
const apply = process.argv.includes('--apply');
const SRC = readFileSync('review/content/duration-hubs-and-faq-2026-11-14-es-ja.md', 'utf8');
if (!SRC.includes('APPROVED by owner')) { console.error('not approved'); process.exit(1); }

// ── Parse ───────────────────────────────────────────────────────────────
const table = {}; // hub → {es:{slug,theme}, ja:{slug,theme}}
for (const m of SRC.matchAll(/^\| (4|7|10|14) \| `([^`]+)` \| `([^`]+)` \| ([^|]+) \| ([^|]+) \|$/gm)) {
  table[m[1]] = { es: { slug: m[2], theme: m[4].trim() }, ja: { slug: m[3], theme: m[5].trim() } };
}
const section = (loc) => { const a = SRC.indexOf(`\n## ${loc.toUpperCase()}\n`); const b = SRC.indexOf('\n---', a + 5); return SRC.slice(a, b < 0 ? SRC.indexOf('\n## Notes', a) : b); };
const field = (s, name) => (s.match(new RegExp(`\\*\\*${name}:\\*\\* (.+)`)) ?? [])[1]?.trim();
const quotes = (s) => s.split('\n').filter((l) => l.startsWith('> ') && l.length > 2).map((l) => l.slice(2).trim());
const faqs = (s) => [...s.matchAll(/^\d\. \*\*(.+?)\*\* (.+?)(?: \*\(Both links.*)?$/gm)].map((m) => [m[1], m[2]]);
const HUB_ORDER = ['4', '7', '10', '14'];
const data = {};
for (const loc of ['es', 'ja']) {
  const s = section(loc);
  const parts = s.split(/\n### /).slice(1);
  data[loc] = { hubs: {}, durFaq: faqs(parts.find((p) => p.startsWith('FAQ of the duration hubs'))) };
  HUB_ORDER.forEach((h, i) => {
    const p = parts[i];
    data[loc].hubs[h] = {
      metaTitle: field(p, 'SEO title'), metaDescription: field(p, 'Meta description'), title: field(p, 'H1'),
      summary: field(p, 'Lede'), whyHeading: field(p, 'Heading'), why: quotes(p),
    };
  });
}
// ── Gates ───────────────────────────────────────────────────────────────
let bad = 0;
for (const loc of ['es', 'ja']) for (const h of HUB_ORDER) {
  const x = data[loc].hubs[h];
  for (const [k, v] of Object.entries(x)) if (!v || (Array.isArray(v) && v.length !== 3)) { console.error(`PARSE ${loc}/${h}.${k}`, v); bad++; }
  if (!table[h]?.[loc]?.slug) { console.error(`PARSE table ${h}`); bad++; }
}
for (const loc of ['es', 'ja']) if (data[loc].durFaq.length !== 3) { console.error(`PARSE ${loc} faq`, data[loc].durFaq.length); bad++; }
const NUM = { // figures that must appear per hub (numeric gate vs EN)
  es: { 4: ['tres a cinco', 'cinco días'], 7: ['siete u ocho', 'dos o tres', 'cuatro o cinco'], 10: ['nueve a once', 'once días'], 14: ['doce a quince', 'tres días'] },
  ja: { 4: ['3〜5日間'], 7: ['7〜8日間', '2〜3日', '4〜5日'], 10: ['9〜11日間', '11日間'], 14: ['12〜15日間', '3日'] },
};
for (const loc of ['es', 'ja']) for (const h of HUB_ORDER) {
  const all = JSON.stringify(data[loc].hubs[h]);
  for (const n of NUM[loc][h]) if (!all.includes(n)) { console.error(`NUMERIC ${loc}/${h}: missing ${n}`); bad++; }
}
if (!JSON.stringify(data.es.durFaq).includes('30 %') || !JSON.stringify(data.ja.durFaq).includes('30％')) { console.error('NUMERIC faq 30%'); bad++; }
if (bad) process.exit(1);
console.log('parse + numeric gate: OK');

// ── Write ───────────────────────────────────────────────────────────────
let n = 0;
const block = (loc, text, style = 'normal') => ({ _key: `${loc}b${(n++).toString(36)}`, _type: 'block', style, markDefs: [], children: [{ _key: `${loc}s${(n++).toString(36)}`, _type: 'span', marks: [], text }] });
const add = (arr, loc, value, type) => [...(arr ?? []).filter((i) => i._key !== loc), { _key: loc, ...(type ? { _type: type } : {}), value }];
const SLUG = { 4: '4-days-egypt-tours', 7: '7-days-egypt-tours', 10: '10-days-egypt-tours', 14: '14-days-egypt-tours' };
const tx = c.transaction();
for (const h of HUB_ORDER) {
  const id = `tourLanding.${SLUG[h]}`;
  const d = await c.getDocument(id);
  if (!d) throw new Error(`${id} missing`);
  if (await c.getDocument(`drafts.${id}`)) throw new Error(`${id} has a draft`);
  const p = { title: d.title, summary: d.summary, intro: d.intro, slug: d.slug, 'seo.metaTitle': d.seo.metaTitle, 'seo.metaDescription': d.seo.metaDescription, faq: d.faq.map((f) => ({ ...f })) };
  for (const loc of ['es', 'ja']) {
    const x = data[loc].hubs[h];
    p.title = add(p.title, loc, x.title, 'internationalizedArrayStringValue');
    p.summary = add(p.summary, loc, x.summary, 'internationalizedArrayStringValue');
    p.intro = add(p.intro, loc, [block(loc, x.whyHeading, 'h2'), ...x.why.map((t) => block(loc, t))]);
    p.slug = add(p.slug, loc, { _type: 'slug', current: table[h][loc].slug }, 'object');
    p['seo.metaTitle'] = add(p['seo.metaTitle'], loc, x.metaTitle, 'internationalizedArrayStringValue');
    p['seo.metaDescription'] = add(p['seo.metaDescription'], loc, x.metaDescription, 'internationalizedArrayTextValue');
    p.faq = p.faq.map((f, i) => ({ ...f, question: add(f.question, loc, data[loc].durFaq[i][0], 'internationalizedArrayStringValue'), answer: add(f.answer, loc, [block(loc, data[loc].durFaq[i][1])]) }));
    console.log(`[${h}] ${loc} /${loc}/${table[h][loc].slug} — ${x.title}`);
  }
  tx.patch(id, (q) => q.set(p));
  const th = await c.getDocument(`theme-duration-${h}`);
  tx.patch(th._id, (q) => q.set({ name: [...th.name.filter((x) => x._key === 'en'), { _key: 'es', value: table[h].es.theme }, { _key: 'ja', value: table[h].ja.theme }] }));
}
// slug collisions
for (const loc of ['es', 'ja']) for (const h of HUB_ORDER) {
  const hit = await c.fetch(`*[_type in ["tour","tourLanding","tourCategory"] && slug[_key==$l][0].value.current==$s && _id != $id]._id`, { l: loc, s: table[h][loc].slug, id: `tourLanding.${SLUG[h]}` });
  if (hit.length) throw new Error(`slug collision ${loc} ${table[h][loc].slug}: ${hit}`);
}
if (!apply) { console.log('dry run — pass --apply'); process.exit(0); }
console.log('committed', (await tx.commit()).transactionId);
