// Owner-locked 2026-11-14: review/content/christmas-new-year-page-2026-11-14-en.md
//  - winter guide links to the Christmas landing ("Christmas and New Year departures →"),
//    placed after its Coptic Christmas section;
//  - its WordPress-filler meta description is cleared (the deck takes over).
// node scripts/winter-guide-christmas-link-2026-11-14.mjs [--apply]
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
const ID = 'wp-post-154927-en'; // /blog/egypt-winter-holidays
const AFTER = '000000000077'; // last paragraph of "Coptic Christmas"
const TARGET = 'tourLanding.christmas-and-new-year-in-egypt';
const TEXT = 'Christmas and New Year departures →';
const FILLER = 'Experience unforgettable Egypt Winter Holidays';

if (!readFileSync('review/content/christmas-new-year-page-2026-11-14-en.md', 'utf8').includes(TEXT)) {
  console.error('PRE-FLIGHT MISMATCH: link text not in locked file'); process.exit(1);
}
if (!(await c.getDocument(TARGET))) throw new Error(`${TARGET} is not published yet — publish the landing first`);
const d = await c.getDocument(ID);
if (await c.getDocument(`drafts.${ID}`)) throw new Error('a draft exists — resolve it first');
if (JSON.stringify(d.body).includes(`"_ref":"${TARGET}"`)) { console.log('link already present'); process.exit(0); }
const at = d.body.findIndex((b) => b._key === AFTER);
if (at < 0) throw new Error('anchor block not found');
if (!String(d.seo?.metaDescription ?? '').startsWith(FILLER)) throw new Error(`unexpected meta: ${d.seo?.metaDescription}`);

const block = {
  _key: 'xmaslink1', _type: 'block', style: 'normal',
  markDefs: [{ _key: 'xmasref1', _type: 'internalLink', reference: { _type: 'reference', _ref: TARGET } }],
  children: [{ _key: 'xmasspan1', _type: 'span', marks: ['xmasref1'], text: TEXT }],
};
console.log(`insert after ${AFTER}: "${TEXT}" → ${TARGET}`);
console.log(`seo.metaDescription: "${d.seo.metaDescription.slice(0, 60)}…" → "" (deck takes over)`);
if (!apply) { console.log('dry run — pass --apply'); process.exit(0); }
const r = await c.patch(ID)
  .insert('after', `body[_key=="${AFTER}"]`, [block])
  .set({ 'seo.metaDescription': '' })
  .commit();
console.log('committed', r._rev);
