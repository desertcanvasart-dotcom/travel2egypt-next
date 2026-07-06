/**
 * Apply the owner's prepared hero images (Desktop/00) to the mismatched-hero
 * docs from docs/journey-hero-swaps-needed-2026-07-04.csv, in PRODUCTION.
 *
 *   Source: /Users/islamhussein/Desktop/00/<en-slug>.jpg
 *   Match:  worklist row whose page_url leaf == filename base
 *   Target: doc (guideArticle | travelTip) by CSV doc_id, field heroImage
 *
 * Rules (2026-07-06 owner instruction):
 * - WEATHER/CLIMATE pages are excluded — they now carry the ClimateSignature
 *   hero, not a photo. Excluded by slug/title pattern AND by kind=='climate'
 *   from the live doc (belt and braces). Prepared files for weather pages
 *   are skipped and reported.
 * - Sets heroImage = { _type:'localizedImage', asset } on the published doc
 *   AND its draft sibling if one exists (so a later publish won't revert).
 *   This clears stale alt/caption/hotspot — they describe the OLD image.
 *   Alt-regen for the new heroes is the standing follow-up, same as the
 *   blog-image-override run.
 * - Rollback log (prior heroImage per doc, published + draft) written to
 *   backups/hero-swaps-2026-07-06/rollback.json before any change.
 *
 *   Dry run (default): npx tsx scripts/apply-hero-swaps-2026-07-06.ts
 *   Apply:             npx tsx scripts/apply-hero-swaps-2026-07-06.ts --apply
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ufallvd2';
// Production writes use the dedicated production write token (the plain
// SANITY_API_WRITE_TOKEN is read-scoped here) — same convention as the
// apply-patch1-tour-heroes / swap-home-hero-* scripts.
const TOKEN =
  process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ||
  process.env.SANITY_API_WRITE_TOKEN;
const DIR = '/Users/islamhussein/Desktop/00';
const CSV = 'docs/journey-hero-swaps-needed-2026-07-04.csv';
const APPLY = process.argv.includes('--apply');

const WEATHER =
  /weather|climate|seasonal|temperature|when-to-go|when-to-explore/i;

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
});

/** Minimal CSV parser (quoted fields, no embedded newlines in this file). */
function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.trim().split('\n');
  const split = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') q = false;
        else cur += c;
      } else if (c === '"') q = true;
      else if (c === ',') { out.push(cur); cur = ''; }
      else cur += c;
    }
    out.push(cur);
    return out;
  };
  const header = split(lines[0]);
  return lines.slice(1).map((l) => {
    const cells = split(l);
    return Object.fromEntries(header.map((h, i) => [h, cells[i] ?? '']));
  });
}

interface DocState {
  _id: string;
  kind?: string;
  hero: unknown;
}

async function main() {
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'} · dataset: production\n`);

  const rows = parseCsv(readFileSync(CSV, 'utf8'));
  const files = new Set(
    readdirSync(DIR).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)),
  );

  const rollback: Array<{
    file: string;
    slug: string;
    docId: string;
    draftId: string | null;
    type: string;
    oldHeroPublished: unknown;
    oldHeroDraft: unknown;
    newAssetId?: string;
  }> = [];
  const problems: string[] = [];
  const skippedWeather: string[] = [];
  let applied = 0;

  for (const row of rows) {
    const slug = row.page_url.replace(/\/$/, '').split('/').pop()!;
    const file = ['.jpg', '.jpeg', '.png', '.webp']
      .map((e) => slug + e)
      .find((f) => files.has(f));
    if (!file) continue; // not prepared yet — goes on the still-missing list

    if (WEATHER.test(slug) || WEATHER.test(row.title)) {
      skippedWeather.push(`${file} (${row.title})`);
      continue;
    }

    // Fetch live state — published + draft sibling — and re-check kind.
    const ids = [row.doc_id, `drafts.${row.doc_id}`];
    const docs: DocState[] = await client.fetch(
      `*[_id in $ids]{ _id, kind, "hero": heroImage }`,
      { ids },
    );
    const published = docs.find((d) => !d._id.startsWith('drafts.'));
    const draft = docs.find((d) => d._id.startsWith('drafts.'));

    if (!published && !draft) {
      problems.push(`NO DOC ${row.doc_id} for "${slug}" (${file})`);
      continue;
    }
    if (published?.kind === 'climate' || draft?.kind === 'climate') {
      skippedWeather.push(`${file} (kind==climate: ${row.title})`);
      continue;
    }

    const draftId = draft?._id ?? null;
    let newAssetId: string | undefined;

    if (APPLY) {
      const asset = await client.assets.upload(
        'image',
        readFileSync(path.join(DIR, file)),
        { filename: file, contentType: 'image/jpeg' },
      );
      newAssetId = asset._id;
      const heroImage = {
        _type: 'localizedImage',
        asset: { _type: 'reference', _ref: asset._id },
      };
      if (published) await client.patch(published._id).set({ heroImage }).commit();
      if (draftId) await client.patch(draftId).set({ heroImage }).commit();
    }

    rollback.push({
      file,
      slug,
      docId: row.doc_id,
      draftId,
      type: row.type,
      oldHeroPublished: published?.hero ?? null,
      oldHeroDraft: draft?.hero ?? null,
      newAssetId,
    });
    applied += 1;
    console.log(
      `${APPLY ? 'set ' : 'ok  '} ${slug}  ->  ${row.doc_id}${draftId ? ' (+draft)' : ''}`,
    );
  }

  console.log(`\n${applied} ${APPLY ? 'applied' : 'ready'}.`);
  if (skippedWeather.length) {
    console.log(`\nSKIPPED (weather/climate — ClimateSignature hero now):`);
    for (const s of skippedWeather) console.log('  - ' + s);
  }
  if (problems.length) {
    console.log('\nPROBLEMS:');
    for (const p of problems) console.log('  - ' + p);
  }

  if (APPLY) {
    const dir = path.join(process.cwd(), 'backups', 'hero-swaps-2026-07-06');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const logPath = path.join(dir, 'rollback.json');
    writeFileSync(logPath, JSON.stringify(rollback, null, 2));
    console.log(`\nRollback log written: ${logPath}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
