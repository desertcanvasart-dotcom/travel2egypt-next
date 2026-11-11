/**
 * Siwa Desert Escape is 4 days: rename the ES/JA addresses that still say 3
 * (owner, 10 Nov 2026). Run AFTER the redirects old→new are deployed.
 *  - tour wp-page-113061 slug[es], slug[ja]
 *  - internal hrefs to the old ES/JA addresses anywhere in content
 * Usage (from the repo root): node scripts/siwa-slug-4-days-2026-11-10.mjs [--apply]
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';

const APPLY = process.argv.includes('--apply');
const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });
const ID = 'wp-page-113061';
const SLUGS = {
  es: ['excursion-de-aventura-de-3-dias-al-encantador-oasis-de-siwa', 'excursion-de-aventura-de-4-dias-al-encantador-oasis-de-siwa'],
  ja: ['3-nichikan-no-miwaku-teki-na-shiwa-oashisu-boken-tsua', '4-nichikan-no-miwaku-teki-na-shiwa-oashisu-boken-tsua'],
};

let tx = c.transaction(), n = 0;
for (const id of [ID, `drafts.${ID}`]) {
  const doc = await c.fetch(`*[_id==$id][0]{slug}`, { id });
  if (!doc) continue;
  const set = {};
  for (const [lang, [from, to]] of Object.entries(SLUGS)) {
    const cur = doc.slug?.find((s) => s._key === lang)?.value?.current;
    console.log(`${id} slug[${lang}]: ${cur} → ${to}`);
    if (cur === to) continue;
    if (cur !== from) throw new Error(`${id}: unexpected ${lang} slug ${cur}`);
    set[`slug[_key=="${lang}"].value.current`] = to;
  }
  if (Object.keys(set).length) { tx = tx.patch(c.patch(id).set(set)); n++; }
}
// Content links to the old addresses (relative or absolute, any trailing slash).
const docs = await c.fetch(`*[!(_type in ["sanity.imageAsset","sanity.fileAsset"]) && _id != $id && _id != $d]`, { id: ID, d: `drafts.${ID}` });
for (const doc of docs) {
  let s = JSON.stringify(doc), k = 0;
  for (const [lang, [from, to]] of Object.entries(SLUGS)) {
    const re = new RegExp(`"href":"(https://travel2egypt\\.org)?/${lang}/${from}/?"`, 'g');
    s = s.replace(re, () => { k++; return `"href":"/${lang}/${to}"`; });
  }
  if (!k) continue;
  const next = JSON.parse(s); const set = {};
  for (const key of Object.keys(next)) if (!key.startsWith('_') && JSON.stringify(next[key]) !== JSON.stringify(doc[key])) set[key] = next[key];
  console.log(`${doc._id}: ${k} link(s)`);
  tx = tx.patch(c.patch(doc._id).set(set)); n++;
}
if (APPLY && n) { const r = await tx.commit({ autoGenerateArrayKeys: false }); console.log('committed', r.results.length, 'docs'); }
else console.log(`${n} docs to patch ${APPLY ? '' : '(dry run — pass --apply)'}`);
