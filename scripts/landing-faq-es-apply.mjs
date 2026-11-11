/**
 * Landing FAQs, Spanish (2026-11-10): adds the owner-locked ES Q&A in
 * docs/landing-faq-es-draft-2026-11-10.md to the existing tourLanding.faq
 * items (written in EN on 2026-11-09), matched by position. Strings are parsed
 * straight from the locked file (Canon Gate A).
 * Usage (from the repo root): node scripts/landing-faq-es-apply.mjs [--apply]
 */
import 'dotenv/config';
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const APPLY = process.argv.includes('--apply');
const locked = fs.readFileSync('docs/landing-faq-es-draft-2026-11-10.md', 'utf8');
if (!/Status: LOCKED/.test(locked)) throw new Error('copy file is not LOCKED');
const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });

const pages = [];
for (const sec of locked.split(/^## (?=\d+\. )/m).slice(1)) {
  const slug = sec.match(/^\d+\. .*?\(`\/([a-z0-9-]+)`\)/)?.[1];
  if (!slug) throw new Error('section without slug');
  const qa = [];
  const lines = sec.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const q = lines[i].match(/^\*\*(¿.+\?)\*\*$/)?.[1];
    if (!q) continue;
    const a = lines.slice(i + 1).find((l) => l.startsWith('> '));
    if (!a) throw new Error('no answer for ' + q);
    qa.push({ q, a: a.slice(2) });
  }
  pages.push({ id: `tourLanding.${slug}`, qa });
}
const total = pages.reduce((n, p) => n + p.qa.length, 0);
if (pages.length !== 4 || total !== 16) throw new Error(`expected 4 pages / 16 items, parsed ${pages.length} / ${total}`);
console.log(`parsed 4 pages, ${total} ES items from the locked file`);

let tx = c.transaction(), n = 0;
for (const p of pages) {
  for (const id of [p.id, `drafts.${p.id}`]) {
    const doc = await c.fetch(`*[_id==$id][0]{_id, faq}`, { id });
    if (!doc) { if (id === p.id) throw new Error(`missing ${id}`); continue; }
    if (!Array.isArray(doc.faq) || doc.faq.length !== p.qa.length) throw new Error(`${id}: expected ${p.qa.length} EN items, found ${doc.faq?.length ?? 0}`);
    console.log(`\n${id}`);
    doc.faq.forEach((item, i) => {
      const { q, a } = p.qa[i];
      const en = item.question.find((x) => x._key === 'en')?.value;
      const hasQ = item.question.some((x) => x._key === 'es');
      const hasA = item.answer.some((x) => x._key === 'es');
      console.log(`  EN ${en}\n  ES ${q}${hasQ && hasA ? '  (already present)' : ''}`);
      const k = `${item._key.replace(/^faq-/, '')}-es`;
      const base = `faq[_key=="${item._key}"]`;
      // One insert per patch (a second insert on the same patch replaces the first).
      if (!hasQ) { tx = tx.patch(c.patch(id).insert('after', `${base}.question[-1]`, [{ _key: 'es', _type: 'internationalizedArrayStringValue', value: q }])); n++; }
      if (!hasA) { tx = tx.patch(c.patch(id).insert('after', `${base}.answer[-1]`, [{ _key: 'es', value: [{ _key: `${k}-b0`, _type: 'block', style: 'normal', markDefs: [], children: [{ _key: `${k}-s0`, _type: 'span', marks: [], text: a }] }] }])); n++; }
    });
  }
}
if (APPLY && n) { const r = await tx.commit({ autoGenerateArrayKeys: false }); console.log('\ncommitted', r.results.length, 'mutations'); }
else console.log(`\n${n} inserts ${APPLY ? '' : '(dry run — pass --apply)'}`);
