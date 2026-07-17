/**
 * Strip dead externalLink markDefs (target 404 on old site, no new-site home):
 * remove the markDef from its block's markDefs array and remove its _key from
 * every span's marks. Text is untouched. _key-addressed patches, rollback first.
 * Usage: node apply-strips.cjs [--apply]
 */
const fs = require('fs');
const { createClient } = require('/Users/islamhussein/t2e/node_modules/@sanity/client');
require('/Users/islamhussein/t2e/node_modules/dotenv').config({ path: '/Users/islamhussein/t2e/.env' });

const APPLY = process.argv.includes('--apply');
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2024-12-01',
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN,
  useCdn: false,
});

const stripUrls = new Set(require('./strip-plan.json').map((x) => x.url));
const visibleDocs = require('./visible-docs.json');

// Find PT blocks (objects with markDefs[] + children[]) anywhere in the doc.
function findBlocks(node, keyPath, out) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((child, i) => {
      const seg = child && typeof child === 'object' && child._key ? `[_key=="${child._key}"]` : `[${i}]`;
      findBlocks(child, keyPath + seg, out);
    });
    return;
  }
  if (Array.isArray(node.markDefs) && Array.isArray(node.children)) {
    out.push({ path: keyPath.replace(/^\./, ''), block: node });
  }
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('_')) continue;
    findBlocks(v, `${keyPath}.${k}`, out);
  }
}

async function main() {
  const ids = visibleDocs.map((d) => d._id);
  const draftIds = await client.fetch(`*[_id in $d]._id`, { d: ids.map((i) => 'drafts.' + i) });
  const held = new Set(draftIds.map((i) => i.replace(/^drafts\./, '')));

  const rollback = [];
  let docsPatched = 0, defsRemoved = 0, spansUnmarked = 0;
  for (const d of visibleDocs) {
    if (held.has(d._id)) continue;
    const doc = await client.fetch(`*[_id == $id][0]`, { id: d._id });
    if (!doc) continue;
    const blocks = [];
    findBlocks(doc, '', blocks);
    const setObj = {};
    const docLog = [];
    for (const { path, block } of blocks) {
      const deadDefs = (block.markDefs || []).filter((m) => m && typeof m.href === 'string' && stripUrls.has(m.href));
      if (!deadDefs.length) continue;
      const deadKeys = new Set(deadDefs.map((m) => m._key));
      setObj[`${path}.markDefs`] = block.markDefs.filter((m) => !deadKeys.has(m._key));
      defsRemoved += deadDefs.length;
      for (const child of block.children) {
        if (Array.isArray(child.marks) && child.marks.some((mk) => deadKeys.has(mk))) {
          setObj[`${path}.children[_key=="${child._key}"].marks`] = child.marks.filter((mk) => !deadKeys.has(mk));
          spansUnmarked++;
        }
      }
      docLog.push({ blockPath: path, removed: deadDefs, textPreserved: block.children.map((c) => c.text).join('') });
    }
    if (!Object.keys(setObj).length) continue;
    rollback.push({ _id: d._id, _type: d._type, blocks: docLog });
    docsPatched++;
    if (APPLY) {
      await client.patch(d._id).set(setObj).commit();
      console.log('stripped', d._id, docLog.length, 'blocks');
    }
  }
  console.log(`\n${APPLY ? 'APPLIED' : 'DRY RUN'}: ${defsRemoved} markDefs removed, ${spansUnmarked} spans unmarked, ${docsPatched} docs`);
  fs.writeFileSync(`${__dirname}/strip-rollback-${APPLY ? 'applied' : 'dryrun'}.json`, JSON.stringify(rollback, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
