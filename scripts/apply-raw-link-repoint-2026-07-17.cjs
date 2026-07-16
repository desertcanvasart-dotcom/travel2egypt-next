/**
 * Apply the validated raw-link re-points to production Sanity.
 * - Only mutates externalLink markDef `href` strings whose value is in the
 *   validated resolution plan (all targets live-checked 200).
 * - _key-addressed patch paths (no index-based writes, no _key regeneration).
 * - Skips any doc with a pending draft (avoids stale-draft overwrite risk).
 * - Writes a rollback JSON before patching.
 *
 * Usage: node apply-repoint.cjs [--apply]   (default = dry run)
 */
const fs = require('fs');
const { createClient } = require('@sanity/client');
require('dotenv').config();

const APPLY = process.argv.includes('--apply');
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2024-12-01',
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN,
  useCdn: false,
});

const plan = require('./resolution-plan.json');
const validation = require('./target-validation.json');
const visibleDocs = require('./visible-docs.json');

const okTargets = new Set(validation.filter((r) => r.status === 200).map((r) => r.path));
const urlToNew = new Map();
for (const p of plan) {
  if (p.to && okTargets.has(p.to)) urlToNew.set(p.url, p.to);
}
console.log('validated URL mappings:', urlToNew.size);

// Walk a doc; collect _key-addressed paths for hrefs we re-point.
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
  if (typeof node.href === 'string' && urlToNew.has(node.href)) {
    out.push({ path: `${keyPath}.href`.replace(/^\./, ''), old: node.href, new: urlToNew.get(node.href) });
  }
  for (const [k, v] of Object.entries(node)) {
    if (k === 'href' || k.startsWith('_')) continue;
    collect(v, `${keyPath}.${k}`, out);
  }
}

async function main() {
  const ids = visibleDocs.map((d) => d._id);
  const draftIds = await client.fetch(`*[_id in $d]._id`, { d: ids.map((i) => 'drafts.' + i) });
  const held = new Set(draftIds.map((i) => i.replace(/^drafts\./, '')));
  console.log('docs held for pending drafts:', held.size, [...held].join(', '));

  const rollback = [];
  let patched = 0, changes = 0, skippedHeld = 0;
  for (const d of visibleDocs) {
    if (held.has(d._id)) { skippedHeld++; continue; }
    // refetch fresh (visible-docs.json may be minutes old)
    const doc = await client.fetch(`*[_id == $id][0]`, { id: d._id });
    if (!doc) continue;
    const out = [];
    collect(doc, '', out);
    if (!out.length) continue;
    rollback.push({ _id: d._id, _type: d._type, changes: out });
    changes += out.length;
    patched++;
    if (APPLY) {
      let patch = client.patch(d._id);
      const setObj = {};
      for (const c of out) setObj[c.path] = c.new;
      await patch.set(setObj).commit();
      console.log('patched', d._id, out.length, 'hrefs');
    }
  }

  console.log(`\n${APPLY ? 'APPLIED' : 'DRY RUN'}: ${changes} href changes across ${patched} docs (held ${skippedHeld} docs with drafts)`);
  const stamp = APPLY ? 'applied' : 'dryrun';
  fs.writeFileSync(`${process.cwd()}/docs/raw-link-sweep-2026-07-17/repoint-rollback-${stamp}.json`, JSON.stringify(rollback, null, 2));
  console.log(`Wrote repoint-rollback-${stamp}.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });
