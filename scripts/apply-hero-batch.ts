/**
 * Generic hero-image batch applier (PRODUCTION).
 *
 *   npx tsx scripts/apply-hero-batch.ts --dir "<abs folder>" --log <name> [--apply]
 *
 * Reads every *.jpg in --dir, resolves each filename's literal slug to a
 * `tour` OR `hotel` doc, uploads to the production asset CDN, and sets
 * heroImage (localizedImage) on the published doc (+ draft sibling if any).
 * Files whose slug doesn't resolve are SKIPPED and reported (never forced).
 * Writes backups/<log>-rollback.json before applying. Dry-run by default.
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const argVal = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const DIR = argVal('--dir');
const LOG = argVal('--log') || 'hero-batch';
const APPLY = args.includes('--apply');

const TOKEN =
  process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ||
  process.env.SANITY_API_WRITE_TOKEN;

if (!DIR) { console.error('Missing --dir <abs folder>'); process.exit(1); }
if (!TOKEN) { console.error('Missing SANITY_PRODUCTION_API_WRITE_TOKEN / SANITY_API_WRITE_TOKEN.'); process.exit(1); }

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ufallvd2',
  dataset: 'production',
  apiVersion: '2024-10-01',
  token: TOKEN,
  useCdn: false,
  perspective: 'raw',
});

const resolveQuery = `*[
  _type in ["tour","hotel","nileCruise"] &&
  (slug[_key=="en"][0].value.current == $slug || slug.current == $slug)
]{ _id, _type, "hero": heroImage }`;

interface Hit { _id: string; _type: string; hero: unknown }

async function main() {
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'} · dataset: production · dir: ${DIR}\n`);
  // Dedupe by slug so two files for the same page (e.g. foo.jpg + foo.jpeg)
  // don't double-set one doc. Prefer .jpg over .jpeg; report the dropped ones.
  const extRank = (f: string) => (/\.jpg$/i.test(f) ? 0 : 1);
  const allFiles = readdirSync(DIR!)
    .filter((f) => /\.jpe?g$/i.test(f))
    .sort((a, b) => {
      const sa = a.replace(/\.jpe?g$/i, '');
      const sb = b.replace(/\.jpe?g$/i, '');
      return sa < sb ? -1 : sa > sb ? 1 : extRank(a) - extRank(b);
    });
  const files: string[] = [];
  const dupSkipped: string[] = [];
  const seenSlug = new Set<string>();
  for (const f of allFiles) {
    const slug = f.replace(/\.jpe?g$/i, '');
    if (seenSlug.has(slug)) { dupSkipped.push(f); continue; }
    seenSlug.add(slug);
    files.push(f);
  }

  const rollback: Array<Record<string, unknown>> = [];
  const skipped: string[] = [];
  let ok = 0;

  for (const file of files) {
    const slug = file.replace(/\.jpe?g$/i, '');
    const hits: Hit[] = await client.fetch(resolveQuery, { slug });
    const published = hits.find((h) => !h._id.startsWith('drafts.'));
    const draft = hits.find((h) => h._id.startsWith('drafts.'));

    if (!published && !draft) {
      skipped.push(file);
      console.log(`SKIP  ${file}  ->  no tour/hotel with slug "${slug}"`);
      continue;
    }
    const baseId = published?._id ?? draft!._id.replace(/^drafts\./, '');
    const draftId = draft?._id ?? null;
    const docType = (published ?? draft!)._type;
    const hadHero = Boolean(published?.hero ?? draft?.hero);

    let newAssetId: string | undefined;
    if (APPLY) {
      const asset = await client.assets.upload('image', readFileSync(path.join(DIR!, file)), {
        filename: file,
        contentType: 'image/jpeg',
      });
      newAssetId = asset._id;
      const heroImage = { _type: 'localizedImage', asset: { _type: 'reference', _ref: asset._id } };
      if (published) await client.patch(baseId).set({ heroImage }).commit();
      if (draftId) await client.patch(draftId).set({ heroImage }).commit();
    }

    rollback.push({ file, slug, docType, docId: baseId, draftId, oldHeroPublished: published?.hero ?? null, oldHeroDraft: draft?.hero ?? null, newAssetId });
    ok += 1;
    console.log(`${APPLY ? 'set ' : 'ok  '} ${docType.padEnd(5)} ${slug}  ->  ${baseId}${draftId ? ' (+draft)' : ''}${hadHero ? '  [REPLACED]' : ''}`);
  }

  const byType = (t: string) => rollback.filter((r) => r.docType === t).length;
  console.log(`\n${ok}/${files.length} mapped (${byType('tour')} tours, ${byType('hotel')} hotels, ${byType('nileCruise')} cruises).`);
  if (skipped.length) console.log(`unresolved (${skipped.length}): ${skipped.join(', ')}`);
  if (dupSkipped.length) console.log(`same-slug duplicates skipped (${dupSkipped.length}): ${dupSkipped.join(', ')}`);

  if (APPLY) {
    const logPath = path.join(process.cwd(), 'backups', `${LOG}-rollback.json`);
    writeFileSync(logPath, JSON.stringify(rollback, null, 2));
    console.log(`\nRollback log written: ${logPath}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
