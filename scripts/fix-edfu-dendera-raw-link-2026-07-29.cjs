/**
 * Fix the last broken user-visible raw travel2egypt.org link (2026-07-29 recheck).
 * wp-page-59571 (guide/edfu/edfu-historical-guide, EN body) links to
 * http://travel2egypt.org/tours/private-tour-dendera-and-abydos-by-bus/ —
 * no doc answers to that slug and no redirect row covers it. The old WP site
 * 301s it to /dendera-and-abydos-temples-from-luxor/ (live tour wp-page-88178),
 * so that is the authoritative target.
 *
 * Same mechanics as apply-raw-link-repoint-2026-07-17: href string only,
 * _key-addressed path, skip if a pending draft exists, rollback JSON first.
 *
 * Usage: node scripts/fix-edfu-dendera-raw-link-2026-07-29.cjs [--apply]
 */
const fs = require('fs');
const { createClient } = require('@sanity/client');
require('dotenv').config();

const APPLY = process.argv.includes('--apply');
const DOC_ID = 'wp-page-59571';
const OLD_HREF = 'http://travel2egypt.org/tours/private-tour-dendera-and-abydos-by-bus/';
const NEW_HREF = '/dendera-and-abydos-temples-from-luxor';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2024-12-01',
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN,
  useCdn: false,
});

function collect(node, keyPath, out) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((child, i) => {
      const seg = child && typeof child === 'object' && child._key
        ? `[_key=="${child._key}"]`
        : `[${i}]`;
      collect(child, keyPath + seg, out);
    });
    return;
  }
  if (node.href === OLD_HREF) {
    out.push(`${keyPath}.href`.replace(/^\./, ''));
  }
  for (const [k, v] of Object.entries(node)) {
    if (k === 'href' || k.startsWith('_')) continue;
    collect(v, `${keyPath}.${k}`, out);
  }
}

async function main() {
  // A pending draft exists (owner heroImage edit, 2026-07-26) whose body is
  // identical to published. Patch BOTH versions so the fix neither waits on
  // nor clobbers the draft. Abort if the draft body has since diverged.
  const draftDoc = await client.getDocument(`drafts.${DOC_ID}`);
  const pubDoc = await client.getDocument(DOC_ID);
  if (draftDoc && JSON.stringify(draftDoc.body) !== JSON.stringify(pubDoc.body)) {
    console.error(`ABORT: draft body differs from published for ${DOC_ID} — hand-resolve first.`);
    process.exit(1);
  }
  const target = await client.fetch(
    `*[_type == "tour" && slug[_key=="en"][0].value.current == "dendera-and-abydos-temples-from-luxor" && !(_id in path('drafts.**'))][0]{_id, hidden}`
  );
  if (!target || target.hidden === true) {
    console.error('ABORT: target tour not live.');
    process.exit(1);
  }
  console.log('target tour live:', target._id);

  const paths = [];
  collect(pubDoc, '', paths);
  console.log(`href occurrences found (published): ${paths.length}`);
  paths.forEach((p) => console.log(' ', p));
  if (!paths.length) { console.log('Nothing to do.'); return; }

  if (!APPLY) { console.log('\nDry run — re-run with --apply to patch.'); return; }

  fs.writeFileSync(
    __dirname + `/../backups/edfu-dendera-raw-link-rollback-2026-07-29.json`,
    JSON.stringify({ _id: DOC_ID, paths, oldHref: OLD_HREF, doc: pubDoc, draft: draftDoc }, null, 2)
  );
  for (const id of draftDoc ? [DOC_ID, `drafts.${DOC_ID}`] : [DOC_ID]) {
    let patch = client.patch(id);
    for (const p of paths) patch = patch.set({ [p]: NEW_HREF });
    await patch.commit();
    console.log('Patched', id);
  }
  console.log('Verifying…');
  for (const id of draftDoc ? [DOC_ID, `drafts.${DOC_ID}`] : [DOC_ID]) {
    const after = await client.getDocument(id);
    const leftover = [];
    collect(after, '', leftover);
    console.log(id, leftover.length === 0 ? 'VERIFIED: 0 occurrences remain.' : `WARNING: ${leftover.length} still present!`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
