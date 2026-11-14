// Owner-locked 2026-11-14 ("Lock all three, build"):
// review/content/itineraries-by-day-count-rewrite-2026-11-14-en.md
// Rewrites the EN "Egypt Travel Itineraries by Day Count" body block by block,
// keeping every block key and every linked phrase (and its link mark) verbatim.
// node scripts/itineraries-guide-rewrite-2026-11-14.mjs [--apply]
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
const ID = 'wp-post-136112-en';
const curly = (s) => s.replace(/'/g, '’');
const SRC = readFileSync('review/content/itineraries-by-day-count-rewrite-2026-11-14-en.md', 'utf8');
if (!SRC.includes('LOCKED by owner')) { console.error('not locked'); process.exit(1); }

const NEW = {};
for (const m of SRC.matchAll(/^`([0-9a-f]{12})` (\*\*\[h2\]\*\* )?(.+)$/gm)) NEW[m[1]] = { h2: !!m[2], text: curly(m[3].trim()) };
const DECK = curly((SRC.match(/\*\*Deck \/ summary:\*\* \*(.+?)\*/) ?? [])[1] ?? '');
if (!DECK) throw new Error('deck not parsed');

const d = await c.getDocument(ID);
if (await c.getDocument(`drafts.${ID}`)) throw new Error('draft exists');
if (Object.keys(NEW).length !== d.body.length) throw new Error(`block count ${Object.keys(NEW).length} vs ${d.body.length}`);
let k = 0;
const body = d.body.map((b) => {
  const nb = NEW[b._key];
  if (!nb) throw new Error(`no rewrite for ${b._key}`);
  if ((b.style === 'h2') !== nb.h2) throw new Error(`style mismatch ${b._key}`);
  const linked = b.children.filter((s) => s.marks?.length);
  const parts = nb.text.split(/\[\[(.+?)\]\]/); // even = plain, odd = linked phrase
  const phrases = parts.filter((_, i) => i % 2);
  if (phrases.length !== linked.length || phrases.some((p, i) => p !== linked[i].text)) {
    throw new Error(`${b._key}: linked phrases ${JSON.stringify(phrases)} ≠ ${JSON.stringify(linked.map((s) => s.text))}`);
  }
  const children = [];
  parts.forEach((p, i) => {
    if (i % 2) children.push({ ...linked[(i - 1) / 2] });
    else if (p) children.push({ _key: `rw${(k++).toString(36)}`, _type: 'span', marks: [], text: p });
  });
  return { ...b, children };
});
const old = d.body.map((b) => b.children.map((s) => s.text).join('')).join(' ').split(/\s+/).length;
const now = body.map((b) => b.children.map((s) => s.text).join('')).join(' ').split(/\s+/).length;
console.log(`blocks ${body.length} (keys + styles unchanged), links kept ${body.reduce((n, b) => n + b.children.filter((s) => s.marks?.length).length, 0)}, words ${old} → ${now}`);
console.log(`deck: "${d.deck}" → "${DECK}"; seo.metaDescription cleared`);
if (!apply) { console.log('dry run — pass --apply'); process.exit(0); }
const r = await c.patch(ID).set({ body, deck: DECK, 'seo.metaDescription': '' }).ifRevisionId(d._rev).commit();
console.log('committed', r._rev);
