/**
 * Landing FAQs (2026-11-09): writes the owner-locked Q&A in
 * docs/landing-faq-draft-2026-11-09.md to tourLanding.faq (EN only). The
 * items are parsed straight from the locked file, so every string is
 * byte-identical to it (Canon Gate A). The script refuses to overwrite an
 * existing, different FAQ.
 * Usage (from the repo root): node scripts/landing-faq-apply.mjs [--apply]
 */
import 'dotenv/config';
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const APPLY = process.argv.includes('--apply');
const locked = fs.readFileSync('docs/landing-faq-draft-2026-11-09.md', 'utf8');
if (!/Status: LOCKED/.test(locked)) throw new Error('copy file is not LOCKED');
const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });

// Parse: "## N. Name (`/slug`)" sections → "**Question?**" + "> answer".
const pages = [];
for (const sec of locked.split(/^## (?=\d+\. )/m).slice(1)) {
  const slug = sec.match(/^\d+\. .*?\(`\/([a-z0-9-]+)`\)/)?.[1];
  if (!slug) throw new Error('section without slug: ' + sec.slice(0, 60));
  const qa = [];
  const lines = sec.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const q = lines[i].match(/^\*\*(.+\?)\*\*$/)?.[1];
    if (!q) continue;
    const a = lines.slice(i + 1).find((l) => l.startsWith('> '));
    if (!a) throw new Error('no answer for ' + q);
    qa.push({ q, a: a.slice(2) });
  }
  pages.push({ id: `tourLanding.${slug}`, slug, qa });
}
const total = pages.reduce((n, p) => n + p.qa.length, 0);
if (pages.length !== 4 || total !== 16) throw new Error(`expected 4 pages / 16 items, parsed ${pages.length} / ${total}`);
console.log(`parsed 4 pages, ${total} items from the locked file`);

const toItems = (p) => p.qa.map(({ q, a }, i) => {
  const k = `${p.slug.slice(0, 12)}-${i + 1}`;
  return {
    _key: `faq-${k}`,
    _type: 'landingFaqItem',
    question: [{ _key: 'en', _type: 'internationalizedArrayStringValue', value: q }],
    answer: [{ _key: 'en', value: [{ _key: `${k}-b0`, _type: 'block', style: 'normal', markDefs: [], children: [{ _key: `${k}-s0`, _type: 'span', marks: [], text: a }] }] }],
  };
});

let tx = c.transaction(), n = 0;
for (const p of pages) {
  const items = toItems(p);
  for (const id of [p.id, `drafts.${p.id}`]) {
    const doc = await c.fetch(`*[_id==$id][0]{_id, faq}`, { id });
    if (!doc) { if (id === p.id) throw new Error(`missing ${id}`); continue; }
    if (Array.isArray(doc.faq) && doc.faq.length) {
      // Compare the EN text only: Sanity re-orders object keys on save, and
      // later locales (ES) are added to the same items, so a JSON compare
      // reports a false mismatch on re-runs.
      const enText = (list) => list.map((it) => [
        it.question?.find((x) => x._key === 'en')?.value,
        it.answer?.find((x) => x._key === 'en')?.value?.map((b) => (b.children || []).map((s) => s.text).join('')).join('\n'),
      ]);
      if (JSON.stringify(enText(doc.faq)) === JSON.stringify(enText(items))) { console.log(`${id}: already applied`); continue; }
      throw new Error(`${id} already has a different FAQ — not overwriting`);
    }
    console.log(`\n${id} · faq (${items.length})`);
    for (const { q, a } of p.qa) console.log(`  Q ${q}\n    ${a.slice(0, 90)}…`);
    tx = tx.patch(c.patch(id).set({ faq: items }));
    n++;
  }
}
if (APPLY && n) { const r = await tx.commit({ autoGenerateArrayKeys: false }); console.log('\ncommitted', r.results.length, 'docs'); }
else console.log(`\n${n} docs to patch ${APPLY ? '' : '(dry run — pass --apply)'}`);
