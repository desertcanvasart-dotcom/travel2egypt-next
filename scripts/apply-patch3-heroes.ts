/**
 * Apply the patch3 hero images to their matching docs in PRODUCTION.
 *
 *   Source: Desktop/.../img-depo/rest of tours/3/patch1/<slug>.jpg
 *   Target: the `tour` OR `hotel` doc whose slug == <filename minus .jpg>.
 *
 * Same mechanics as apply-patch1-tour-heroes.ts: resolve by slug (no assumed
 * _id), upload to the production asset CDN, set heroImage (localizedImage) on
 * the published doc (+ draft sibling if any), write a rollback log first.
 *
 * Note: this batch's folder is labelled "tours" but 2 files are HOTELS
 * (cairo-hotel-pyramids, 8-pickalbatros-palace-sharm-aqua-park) — they resolve
 * to hotel docs and are set the same way. No hotspot/alt set (center crop).
 *
 *   Dry run (default): npx tsx scripts/apply-patch3-heroes.ts
 *   Apply:             npx tsx scripts/apply-patch3-heroes.ts --apply
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ufallvd2';
const TOKEN =
  process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ||
  process.env.SANITY_API_WRITE_TOKEN;
const DIR =
  '/Users/islamhussein/Desktop/Projects/T2E/img-depo/rest of tours/3/patch1';
const APPLY = process.argv.includes('--apply');

if (!TOKEN) {
  console.error('Missing SANITY_PRODUCTION_API_WRITE_TOKEN / SANITY_API_WRITE_TOKEN.');
  process.exit(1);
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: 'production',
  apiVersion: '2024-10-01',
  token: TOKEN,
  useCdn: false,
  perspective: 'raw',
});

// Resolve a slug to a tour/hotel doc — both published and draft rows.
const resolveQuery = `*[
  _type in ["tour","hotel"] &&
  (slug[_key=="en"][0].value.current == $slug || slug.current == $slug)
]{ _id, _type, "hero": heroImage }`;

interface Hit { _id: string; _type: string; hero: unknown }

async function main() {
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'} · dataset: production\n`);
  const files = readdirSync(DIR).filter((f) => /\.jpe?g$/i.test(f)).sort();
  const rollback: Array<Record<string, unknown>> = [];
  const problems: string[] = [];
  let ok = 0;

  for (const file of files) {
    const slug = file.replace(/\.jpe?g$/i, '');
    const hits: Hit[] = await client.fetch(resolveQuery, { slug });
    const published = hits.find((h) => !h._id.startsWith('drafts.'));
    const draft = hits.find((h) => h._id.startsWith('drafts.'));

    if (!published && !draft) {
      problems.push(`NO tour/hotel for slug "${slug}" (${file})`);
      continue;
    }
    const baseId = published?._id ?? draft!._id.replace(/^drafts\./, '');
    const draftId = draft?._id ?? null;
    const docType = (published ?? draft!)._type;
    const hadHero = Boolean(published?.hero ?? draft?.hero);

    let newAssetId: string | undefined;
    if (APPLY) {
      const asset = await client.assets.upload('image', readFileSync(path.join(DIR, file)), {
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
    console.log(`${APPLY ? 'set ' : 'ok  '} ${docType.padEnd(5)} ${slug}  ->  ${baseId}${draftId ? ' (+draft)' : ''}${hadHero ? '  [REPLACED existing hero]' : ''}`);
  }

  console.log(`\n${ok}/${files.length} mapped (${rollback.filter((r) => r.docType === 'tour').length} tours, ${rollback.filter((r) => r.docType === 'hotel').length} hotels).`);
  if (problems.length) { console.log('PROBLEMS:'); for (const p of problems) console.log('  - ' + p); }

  if (APPLY) {
    const logPath = path.join(process.cwd(), 'backups', 'patch3-heroes-rollback.json');
    writeFileSync(logPath, JSON.stringify(rollback, null, 2));
    console.log(`\nRollback log written: ${logPath}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
