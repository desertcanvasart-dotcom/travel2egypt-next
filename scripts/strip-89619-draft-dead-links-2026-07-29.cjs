/**
 * Strip the 4 dead decorative links from drafts.wp-page-89619 (2026-07-29).
 * Each is 404 on the old WP site AND has no new-site home — the corpus
 * sweep's owner-approved strip class. markDef removed + mark reference
 * cleaned from spans; anchor TEXT is kept. The 5th residual raw link
 * (horse-carriage market tour, still 200 on the old site, no 1:1 home)
 * is left for the owner's rewrite.
 *
 * Usage: node <script> [--apply]
 */
const fs = require('fs');
const { createClient } = require('@sanity/client');
require('dotenv').config();

const APPLY = process.argv.includes('--apply');
const ID = 'drafts.wp-page-89619';
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2024-12-01',
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN,
  useCdn: false,
});

const DEAD = [
  'https://travel2egypt.org/es/guia-de-viaje-de-sohag/civilizaciones-antiguas/',
  'https://travel2egypt.org/es/guia-de-viaje-de-dahab/viaje-culinario-2/',
  'https://travel2egypt.org/es/guia-de-viaje-de-rosetta-rasheed/descubrimientos/',
  'https://travel2egypt.org/es/guia-de-safaga/lo-esencial-para-viajar/',
];

// Find blocks whose markDefs include a dead href; return block path + info.
function* blocks(node, path) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      const ch = node[i];
      const seg = ch && typeof ch === 'object' && ch._key ? `[_key=="${ch._key}"]` : `[${i}]`;
      yield* blocks(ch, path + seg);
    }
    return;
  }
  if (Array.isArray(node.markDefs) && node.markDefs.some((m) => DEAD.includes(m.href))) {
    yield { block: node, path };
  }
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('_')) continue;
    yield* blocks(v, `${path}.${k}`);
  }
}

async function main() {
  const draft = await client.getDocument(ID);
  if (!draft) { console.error('ABORT: draft gone.'); process.exit(1); }

  const sets = {};
  const unsets = [];
  let found = 0;
  for (const { block, path } of blocks(draft, '')) {
    const base = path.replace(/^\./, '');
    for (const md of block.markDefs.filter((m) => DEAD.includes(m.href))) {
      found++;
      console.log('strip:', md.href, '\n  block', base, 'markDef', md._key);
      unsets.push(`${base}.markDefs[_key=="${md._key}"]`);
      for (const span of block.children || []) {
        if ((span.marks || []).includes(md._key)) {
          sets[`${base}.children[_key=="${span._key}"].marks`] = span.marks.filter((m) => m !== md._key);
          console.log('  clean mark on span', span._key, JSON.stringify(span.text.slice(0, 60)));
        }
      }
    }
  }
  console.log(`\ndead links found: ${found} (expected 4) | sets: ${Object.keys(sets).length} | unsets: ${unsets.length}`);
  if (found !== 4) { console.error('ABORT: unexpected count.'); process.exit(1); }

  if (!APPLY) { console.log('Dry run — re-run with --apply.'); return; }

  fs.writeFileSync(__dirname + '/../backups/strip-89619-draft-dead-links-rollback-2026-07-29.json', JSON.stringify(draft, null, 2));
  await client.patch(ID).set(sets).unset(unsets).commit();
  console.log('Patched. Verifying…');
  const after = await client.getDocument(ID);
  const s = JSON.stringify(after);
  const remaining = s.match(/https?:\\?\/\\?\/(www\.)?travel2egypt\.org[^"]*/g) || [];
  console.log('raw travel2egypt.org links remaining in draft:', remaining.length);
  remaining.forEach((r) => console.log(' ', r.replace(/\\\//g, '/')));
}

main().catch((e) => { console.error(e); process.exit(1); });
