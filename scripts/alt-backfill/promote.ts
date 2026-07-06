import { createClient } from '@sanity/client';
import { readFileSync, writeFileSync } from 'node:fs';

const env: Record<string, string> = {};
for (const line of readFileSync('/Users/islamhussein/t2e/.env', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ufallvd2',
  dataset: env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-12-01',
  token: env.SANITY_PRODUCTION_API_WRITE_TOKEN || env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const APPLY = process.argv.includes('--apply');

async function main() {
  const drafts: any[] = await client.fetch(
    `*[_id in path("drafts.**") && defined(heroImage.alt)]{_id, "alt": heroImage.alt, "caption": heroImage.caption}`
  );
  const pubIds = drafts.map((d) => d._id.replace(/^drafts\./, ''));
  const pubs: any[] = await client.fetch(
    `*[_id in $ids]{_id, "alt": heroImage.alt, "caption": heroImage.caption}`,
    { ids: pubIds }
  );
  const pubById = new Map(pubs.map((p) => [p._id, p]));

  // rollback snapshot: current published alt/caption for exactly these ids
  const snapshot = pubs.map((p) => ({ _id: p._id, alt: p.alt ?? null, caption: p.caption ?? null }));
  writeFileSync(
    '/Users/islamhussein/t2e/backups/alt-promote-rollback.json',
    JSON.stringify({ takenBeforeApply: true, ids: pubIds, snapshot }, null, 2)
  );

  const alreadyHadAlt = pubs.filter((p) => p.alt).length;
  console.log(`drafts w/ alt: ${drafts.length} | published targets: ${pubs.length} | published already had alt: ${alreadyHadAlt}`);
  console.log(`rollback snapshot written for ${snapshot.length} docs.`);

  if (!APPLY) {
    console.log('DRY RUN — pass --apply to write. No changes made.');
    return;
  }

  let ok = 0, err = 0;
  const errors: string[] = [];
  let tx = client.transaction();
  let n = 0;
  const flush = async () => {
    if (n === 0) return;
    try { await tx.commit({ autoGenerateArrayKeys: false }); ok += n; }
    catch (e: any) { err += n; errors.push(e.message); }
    tx = client.transaction();
    n = 0;
  };
  for (const d of drafts) {
    const pubId = d._id.replace(/^drafts\./, '');
    if (!pubById.has(pubId)) continue;
    const set: any = {};
    if (d.alt !== undefined) set['heroImage.alt'] = d.alt;
    if (d.caption !== undefined) set['heroImage.caption'] = d.caption;
    if (Object.keys(set).length === 0) continue;
    tx = tx.patch(pubId, (p) => p.set(set));
    n++;
    if (n >= 50) await flush();
  }
  await flush();
  console.log(`APPLIED. patched published docs ok: ${ok}, errored: ${err}`);
  for (const e of errors.slice(0, 10)) console.log('  ERR', e);
}
main();
