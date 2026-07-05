/**
 * Bulk publisher for mention-linker drafts — the PUBLISH step of the
 * internal-linking workflow. Publishes ONLY drafts this pipeline created,
 * verified by three independent checks per document:
 *
 *   1. Body text identity — the draft's concatenated span text equals the
 *      current published version's, in every locale (links change markDefs
 *      and span boundaries, never text).
 *   2. Non-body identity — every other field deep-equals the current
 *      published version (our drafts are byte copies outside body).
 *   3. Untouched draft — the draft's _updatedAt still equals the published
 *      _updatedAt (our createOrReplace preserved it; any Studio edit bumps
 *      it), so owner-edited drafts are never bulk-published.
 *
 * Anything failing a check is skipped and reported for manual review.
 * Publishing = transaction[createOrReplace(published ← draft), delete(draft)],
 * with the prior published doc snapshotted to backups/ first.
 *
 * DRY RUN by default; PUBLISH=1 to execute.
 *
 * Usage:
 *   npx tsx scripts/mention-link-publish.ts --ids <file-with-doc-ids>          # dry run
 *   PUBLISH=1 npx tsx scripts/mention-link-publish.ts --ids <file>             # publish
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { readFileSync, writeFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();

const PUBLISH = process.env.PUBLISH === '1';
const WRITE_TOKEN = process.env.SANITY_PRODUCTION_API_WRITE_TOKEN;
if (PUBLISH && !WRITE_TOKEN) {
  console.error('PUBLISH=1 requires SANITY_PRODUCTION_API_WRITE_TOKEN.');
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ufallvd2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-12-01',
  token: (PUBLISH ? WRITE_TOKEN : undefined) || process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const argIdx = process.argv.indexOf('--ids');
if (argIdx === -1 || !process.argv[argIdx + 1]) {
  console.error('Missing --ids <file with one doc id per line>');
  process.exit(1);
}
const ids = [...new Set(readFileSync(resolve(process.cwd(), process.argv[argIdx + 1]), 'utf8').trim().split('\n').filter(Boolean))];

/** Concatenated body span text per locale entry — link edits never change this. */
function bodyText(doc: any): string {
  return JSON.stringify(
    (doc?.body ?? []).map((e: any) =>
      (Array.isArray(e.value) ? e.value : [e]).map((b: any) => (b.children ?? []).map((s: any) => s.text ?? '').join('')).join('|')
    )
  );
}
/** Everything except body and volatile system fields. */
function nonBody(doc: any): string {
  const { body, _rev, _updatedAt, _id, ...rest } = doc ?? {};
  return JSON.stringify(rest, Object.keys(rest).sort());
}

async function main() {
  const date = new Date().toISOString().slice(0, 10);
  const backupDir = resolve(process.cwd(), `backups/mention-links-published-${date}`);
  if (PUBLISH) mkdirSync(backupDir, { recursive: true });

  let published = 0;
  const skips: Record<string, string[]> = {};
  const skip = (reason: string, id: string) => (skips[reason] = [...(skips[reason] ?? []), id]);

  for (const id of ids) {
    const [draft, pub] = await Promise.all([client.getDocument(`drafts.${id}`), client.getDocument(id)]);
    if (!draft) { skip('no-draft', id); continue; }
    if (!pub) { skip('no-published', id); continue; }
    if (draft._updatedAt !== pub._updatedAt) { skip('draft-edited-by-owner', id); continue; }
    if (bodyText(draft) !== bodyText(pub)) { skip('body-text-differs', id); continue; }
    if (nonBody(draft) !== nonBody(pub)) { skip('non-body-fields-differ', id); continue; }

    if (PUBLISH) {
      writeFileSync(`${backupDir}/${id.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`, JSON.stringify(pub, null, 2));
      appendFileSync(`${backupDir}/manifest.txt`, `${id}\n`);
      const { _rev, _updatedAt, ...content } = draft as any;
      await client.transaction().createOrReplace({ ...content, _id: id }).delete(`drafts.${id}`).commit();
      console.log(`  PUBLISHED ${id}`);
    } else {
      console.log(`  would publish ${id}`);
    }
    published++;
  }

  console.log(`\n${PUBLISH ? 'Published' : 'Would publish'}: ${published} of ${ids.length} docs`);
  for (const [reason, list] of Object.entries(skips))
    console.log(`Skipped (${reason}): ${list.length}${reason === 'no-draft' ? '' : ' — ' + list.join(', ')}`);
  if (PUBLISH) console.log(`Snapshots of prior published docs: ${backupDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
