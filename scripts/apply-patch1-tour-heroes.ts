/**
 * Apply the 17 patch1 hero images to their matching `tour` documents in the
 * PRODUCTION dataset.
 *
 *   Source: Desktop/.../img-depo/rest of tours/2/patch1/<slug>.jpg
 *   Target: tour doc whose EN slug == <slug>, field heroImage (localizedImage)
 *
 * - Resolves each tour by EN slug (not by assumed _id).
 * - Uploads each JPG to the production asset CDN.
 * - Sets heroImage = { _type: 'localizedImage', asset: <ref> } on the published
 *   doc AND on its draft sibling if one exists (so a later publish won't revert).
 * - Writes a rollback log (prior heroImage per doc) before any change.
 *
 *   Dry run (default): npx tsx scripts/apply-patch1-tour-heroes.ts
 *   Apply:             npx tsx scripts/apply-patch1-tour-heroes.ts --apply
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ufallvd2';
// Production writes use the dedicated production write token (the plain
// SANITY_API_WRITE_TOKEN is read-scoped here) — same convention as the
// swap-home-hero-* scripts.
const TOKEN =
  process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ||
  process.env.SANITY_API_WRITE_TOKEN;
const DIR =
  '/Users/islamhussein/Desktop/Projects/T2E/img-depo/rest of tours/2/patch1';
const APPLY = process.argv.includes('--apply');

if (!TOKEN) {
  console.error(
    'Missing SANITY_PRODUCTION_API_WRITE_TOKEN / SANITY_API_WRITE_TOKEN.',
  );
  process.exit(1);
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: 'production',
  apiVersion: '2024-10-01',
  token: TOKEN,
  useCdn: false,
});

// file -> target EN slug. The one malformed filename is mapped explicitly to
// the cairo dinner-cruise tour (confirmed by image content + operator).
const MAP: Record<string, string> = {
  'cairo-sky-adventure.jpg': 'cairo-sky-adventure',
  'dahab-blue-hole-desert-snorkel-group-day-tour-from-sharm.jpg':
    'dahab-blue-hole-desert-snorkel-group-day-tour-from-sharm',
  'dendera-and-abydos-temple-day-tour-from-hurghada.jpg':
    'dendera-and-abydos-temple-day-tour-from-hurghada',
  'dendera-and-abydos-temples-day-tour.jpg':
    'dendera-and-abydos-temples-day-tour',
  'dolphin-house-shared-snorkeling-day-from-hurghada.jpg':
    'dolphin-house-shared-snorkeling-day-from-hurghada',
  'dolphin-show-sharm-el-sheikh.jpg': 'dolphin-show-sharm-el-sheikh',
  'dolphins-dance-group-shared-seas-full-day-snorkeling-tour.jpg':
    'dolphins-dance-group-shared-seas-full-day-snorkeling-tour',
  'egyptian-museum-citadel-and-khan-el-khalili-bazaar.jpg':
    'egyptian-museum-citadel-and-khan-el-khalili-bazaar',
  'esna-edfu-kom-ombo-temples-group-day-tour-from-luxor.jpg':
    'esna-edfu-kom-ombo-temples-group-day-tour-from-luxor',
  'fayoum-meidum-hawara-pyramids-group-day-tour.jpg':
    'fayoum-meidum-hawara-pyramids-group-day-tour',
  'giftun-island-shared-snorkeling-day-from-hurghada.jpg':
    'giftun-island-shared-snorkeling-day-from-hurghada',
  'hurghada-airport-transfer.jpg': 'hurghada-airport-transfer',
  'hurghada-quad-bike-tour.jpg': 'hurghada-quad-bike-tour',
  'nmec-royal-mummies-old-cairo.jpg': 'nmec-royal-mummies-old-cairo',
  'nmec-royal-mummies-old-cairocairo-dinner-cruise-with-belly-dancing-show.jpg':
    'cairo-dinner-cruise-with-belly-dancing-show',
  'private-tour-pyramids-of-giza-sphinx-memphis-and-saqqara.jpg':
    'private-tour-pyramids-of-giza-sphinx-memphis-and-saqqara',
  'transfer-from-hotel-to-airport.jpg': 'transfer-from-hotel-to-airport',
};

const slugQuery = `*[_type == "tour" && slug[_key=="en"][0].value.current == $slug]{
  _id, "hero": heroImage
}`;

interface Hit {
  _id: string;
  hero: unknown;
}

async function main() {
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'} · dataset: production\n`);
  const rollback: Array<{ file: string; slug: string; docId: string; draftId: string | null; oldHeroPublished: unknown; oldHeroDraft: unknown; newAssetId?: string }> = [];
  let ok = 0;
  const problems: string[] = [];

  for (const [file, slug] of Object.entries(MAP)) {
    const filePath = path.join(DIR, file);
    const hits: Hit[] = await client.fetch(slugQuery, { slug });
    const published = hits.find((h) => !h._id.startsWith('drafts.'));
    const draft = hits.find((h) => h._id.startsWith('drafts.'));

    if (!published && !draft) {
      problems.push(`NO TOUR for slug "${slug}" (file ${file})`);
      continue;
    }
    const baseId = published?._id ?? draft!._id.replace(/^drafts\./, '');
    const draftId = draft?._id ?? null;
    const hadHero = Boolean(published?.hero ?? draft?.hero);

    let newAssetId: string | undefined;
    if (APPLY) {
      const asset = await client.assets.upload('image', readFileSync(filePath), {
        filename: file,
        contentType: 'image/jpeg',
      });
      newAssetId = asset._id;
      const heroImage = {
        _type: 'localizedImage',
        asset: { _type: 'reference', _ref: asset._id },
      };
      if (published) await client.patch(baseId).set({ heroImage }).commit();
      if (draftId) await client.patch(draftId).set({ heroImage }).commit();
    }

    rollback.push({
      file,
      slug,
      docId: baseId,
      draftId,
      oldHeroPublished: published?.hero ?? null,
      oldHeroDraft: draft?.hero ?? null,
      newAssetId,
    });
    ok += 1;
    console.log(
      `${APPLY ? 'set ' : 'ok  '} ${slug}  ->  ${baseId}${draftId ? ' (+draft)' : ''}${hadHero ? '  [REPLACED existing hero]' : ''}`,
    );
  }

  console.log(`\n${ok}/${Object.keys(MAP).length} mapped.`);
  if (problems.length) {
    console.log('PROBLEMS:');
    for (const p of problems) console.log('  - ' + p);
  }

  if (APPLY) {
    const logPath = path.join(
      process.cwd(),
      'backups',
      'patch1-tour-heroes-rollback.json',
    );
    writeFileSync(logPath, JSON.stringify(rollback, null, 2));
    console.log(`\nRollback log written: ${logPath}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
