/**
 * A5 straggler fill: add the missing localized slug to the 4 published tours
 * that never got one (all have proper localized TITLES; the slug just wasn't
 * generated during the corpus slug migration, because these docs had no ja/es
 * slug at all — so migrate-ja-romaji-slugs, which only re-slugs docs that
 * ALREADY have a ja slug, skipped them).
 *
 * Purely ADDITIVE: these tours were never reachable at a localized URL (no slug
 * = no /ja or /es route resolves), so there is NO old URL to redirect from —
 * adding the slug simply makes the localized page reachable. No redirect rows.
 *
 * ja slug ← titleToRomajiSlug(jaTitle)   (same util as the corpus migration)
 * es slug ← esSlugify(esTitle)
 *
 * Run (preview):  npx tsx scripts/journey-straggler-localized-slugs.ts
 * Run (apply):    npx tsx scripts/journey-straggler-localized-slugs.ts --apply
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';
import { writeFileSync, mkdirSync, readFileSync, appendFileSync } from 'node:fs';

import { initRomaji, titleToRomajiSlug } from './wp-import/mappers/_romaji.js';

// Inlined verbatim from scripts/migrate-es-slugs.ts (importing that module would
// execute its top-level main() + staging-only guard).
function esSlugify(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics
    .replace(/[ºª]/g, '') // º ª ordinals
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token =
  process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;

if (dataset !== 'production') {
  throw new Error(`Refusing to run against dataset "${dataset}" — A5 targets production.`);
}
if (!projectId || !token) {
  console.error('Missing project id or production write token');
  process.exit(1);
}

const APPLY = process.argv.includes('--apply');
const STAMP = '2026-07-08';
const client = createClient({ projectId, dataset, apiVersion: '2024-12-01', token, useCdn: false });

// The 4 stragglers and which locale each is missing.
const TARGETS: { id: string; locale: 'ja' | 'es' }[] = [
  { id: 'tour.9-day-egypt-group-tour-cairo-abu-simbel-nile', locale: 'ja' },
  { id: 'tour.10-day-egypt-group-tour-cairo-nile-red-sea', locale: 'ja' },
  { id: 'tour.11-day-egypt-group-tour-cairo-red-sea-nile', locale: 'ja' },
  { id: 'wp-page-158052', locale: 'es' },
];

interface SlugItem {
  _key: string;
  _type?: string;
  value?: { _type?: string; current?: string };
}

async function main() {
  await initRomaji();

  const plan: { id: string; locale: string; title: string; proposed: string; note: string }[] = [];
  const patches: { id: string; slug: SlugItem[]; locale: 'ja' | 'es'; enSlug: string; newSlug: string }[] = [];

  for (const t of TARGETS) {
    const doc = await client.fetch<{ _id: string; slug?: SlugItem[]; title?: SlugItem[] }>(
      `*[_id == $id][0]{_id, slug, title}`,
      { id: t.id },
    );
    if (!doc) {
      plan.push({ id: t.id, locale: t.locale, title: '(doc not found)', proposed: '', note: 'SKIP: missing doc' });
      continue;
    }
    const slug = [...(doc.slug ?? [])];
    const existing = slug.find((s) => s._key === t.locale)?.value?.current;
    if (existing) {
      plan.push({ id: t.id, locale: t.locale, title: '', proposed: existing, note: 'SKIP: slug already set' });
      continue;
    }
    // title items are {_key, value: <string>} for internationalizedArrayString
    const titleVal =
      (doc.title as unknown as { _key: string; value: string }[] | undefined)?.find((s) => s._key === t.locale)?.value ?? '';
    const proposed = t.locale === 'ja' ? await titleToRomajiSlug(titleVal) : esSlugify(titleVal);
    if (!proposed) {
      plan.push({ id: t.id, locale: t.locale, title: titleVal, proposed: '', note: 'SKIP: empty proposed slug' });
      continue;
    }
    // collision guard: no other tour may already own this localized slug
    const collision = await client.fetch<number>(
      `count(*[_type=="tour" && _id != $id && slug[_key==$loc][0].value.current == $s])`,
      { id: t.id, loc: t.locale, s: proposed },
    );
    if (collision > 0) {
      plan.push({ id: t.id, locale: t.locale, title: titleVal, proposed, note: `SKIP: collides with ${collision} tour(s)` });
      continue;
    }
    const enSlug = slug.find((s) => s._key === 'en')?.value?.current ?? '';
    slug.push({ _key: t.locale, _type: 'object', value: { _type: 'slug', current: proposed } });
    patches.push({ id: t.id, slug, locale: t.locale, enSlug, newSlug: proposed });
    const redirectNote = enSlug ? ` (+redirect /${t.locale}/${enSlug} → /${t.locale}/${proposed})` : ' (no en slug — no redirect)';
    plan.push({ id: t.id, locale: t.locale, title: titleVal, proposed, note: `READY${redirectNote}` });
  }

  console.log('\nA5 straggler localized-slug plan:');
  for (const p of plan) console.log(`  [${p.locale}] ${p.id}\n        title: ${p.title}\n        slug:  ${p.proposed}  — ${p.note}`);
  console.log(`\n${patches.length} ready to apply, ${plan.length - patches.length} skipped.`);

  if (!APPLY) {
    console.log('\nPreview only. Re-run with --apply to write.');
    return;
  }
  if (!patches.length) {
    console.log('\nNothing to apply.');
    return;
  }

  mkdirSync('backups', { recursive: true });
  const backup: Record<string, unknown> = {};
  for (const p of patches) backup[p.id] = await client.fetch(`*[_id == $id][0]{_id, slug}`, { id: p.id });
  const backupPath = `backups/a5-straggler-slugs-rollback-${STAMP}.json`;
  writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`Backup → ${backupPath} (${patches.length} docs)`);

  for (const p of patches) {
    await client.patch(p.id).set({ slug: p.slug }).commit({ visibility: 'async' });
    console.log(`✓ ${p.id}: localized slug added`);
  }

  // Redirect rows: the tour was reachable at /<locale>/<en-slug> via the
  // slug-lookup EN fallback (queries.ts) while its localized slug was null.
  // Adding the localized slug moves it to /<locale>/<new-slug>, so the old
  // en-fallback URL must 301. Path-form + priority 50 mirrors gen-ja/gen-es.
  const CSV_PATH = 'migration/redirect-map.csv';
  const csvText = readFileSync(CSV_PATH, 'utf8');
  const rows: string[] = [];
  for (const p of patches) {
    if (!p.enSlug) continue;
    const src = `/${p.locale}/${p.enSlug}`;
    if (csvText.includes(`\n${src},`) || csvText.startsWith(`${src},`)) {
      console.log(`– redirect ${src} already present, skipping`);
      continue;
    }
    rows.push(`${src},/${p.locale}/${p.newSlug},${p.locale},301,,50.00`);
  }
  if (rows.length) {
    appendFileSync(CSV_PATH, rows.join('\n') + '\n', 'utf8');
    console.log(`Appended ${rows.length} redirect row(s) to ${CSV_PATH}. Run: npm run redirect-map:regenerate`);
  }
  console.log(`\nApplied ${patches.length} slug(s) + ${rows.length} redirect(s). Rollback: ${backupPath} (+ git for CSV)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
