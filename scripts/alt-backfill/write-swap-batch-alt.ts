/**
 * Write regenerated EN/ES/JA alt + caption onto the localizedImage heroes of
 * the 2026-07-06 hero-swap batch (guideArticle + travelTip — the
 * internationalizedArrayString shape, NOT the blog plain-string shape).
 *
 *   npx tsx scripts/alt-backfill/write-swap-batch-alt.ts <gen-dir>          # dry-run
 *   npx tsx scripts/alt-backfill/write-swap-batch-alt.ts <gen-dir> --apply
 *
 * <gen-dir> holds gen-*.json files: arrays of
 *   { _id, alt_en, cap_en, alt_es, cap_es, alt_ja, cap_ja } | { _id, error }.
 *
 * Sets heroImage.alt / heroImage.caption ([{_key, _type:'object', value}]) on
 * the published doc AND its draft sibling if one exists. Skips entries with
 * `error` or any empty string (no partial locale writes). Rollback snapshot:
 * backups/hero-swaps-2026-07-06/alt-rollback.json.
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const TOKEN =
  process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ||
  process.env.SANITY_API_WRITE_TOKEN;
const APPLY = process.argv.includes('--apply');
const genDir = process.argv[2];
if (!genDir || !TOKEN) {
  console.error('usage: write-swap-batch-alt.ts <gen-dir> [--apply]  (+ write token in env)');
  process.exit(1);
}

const client = createClient({
  projectId: 'ufallvd2',
  dataset: 'production',
  apiVersion: '2024-10-01',
  token: TOKEN,
  useCdn: false,
});

interface Gen {
  _id: string;
  alt_en?: string; cap_en?: string;
  alt_es?: string; cap_es?: string;
  alt_ja?: string; cap_ja?: string;
  error?: string;
}

const loc = (en: string, es: string, ja: string) => [
  { _key: 'en', _type: 'object', value: en },
  { _key: 'es', _type: 'object', value: es },
  { _key: 'ja', _type: 'object', value: ja },
];

async function main() {
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);
  const gens: Gen[] = readdirSync(genDir)
    .filter((f) => /^gen-\d+\.json$/.test(f))
    .flatMap((f) => JSON.parse(readFileSync(path.join(genDir, f), 'utf8')));
  console.log(`gen rows: ${gens.length}`);

  const skipped: string[] = [];
  const rollback: Array<{ docId: string; draftId: string | null; oldAlt: unknown; oldCap: unknown }> = [];
  let written = 0;

  for (const g of gens) {
    const fields = [g.alt_en, g.cap_en, g.alt_es, g.cap_es, g.alt_ja, g.cap_ja];
    if (g.error || fields.some((v) => !v || !v.trim())) {
      skipped.push(`${g._id}: ${g.error ?? 'incomplete locales'}`);
      continue;
    }
    const ids = [g._id, `drafts.${g._id}`];
    const docs: Array<{ _id: string; alt: unknown; cap: unknown }> = await client.fetch(
      `*[_id in $ids]{ _id, "alt": heroImage.alt, "cap": heroImage.caption }`,
      { ids },
    );
    const published = docs.find((d) => !d._id.startsWith('drafts.'));
    const draft = docs.find((d) => d._id.startsWith('drafts.'));
    if (!published) {
      skipped.push(`${g._id}: published doc missing`);
      continue;
    }
    const patch = {
      'heroImage.alt': loc(g.alt_en!, g.alt_es!, g.alt_ja!),
      'heroImage.caption': loc(g.cap_en!, g.cap_es!, g.cap_ja!),
    };
    if (APPLY) {
      await client.patch(published._id).set(patch).commit();
      if (draft) await client.patch(draft._id).set(patch).commit();
    }
    rollback.push({
      docId: published._id,
      draftId: draft?._id ?? null,
      oldAlt: published.alt ?? null,
      oldCap: published.cap ?? null,
    });
    written += 1;
    console.log(`${APPLY ? 'set ' : 'ok  '} ${g._id}${draft ? ' (+draft)' : ''}  "${g.alt_en!.slice(0, 60)}…"`);
  }

  console.log(`\n${written} ${APPLY ? 'written' : 'ready'}, ${skipped.length} skipped.`);
  for (const s of skipped) console.log('  SKIP ' + s);

  if (APPLY) {
    const logPath = path.join(process.cwd(), 'backups', 'hero-swaps-2026-07-06', 'alt-rollback.json');
    writeFileSync(logPath, JSON.stringify(rollback, null, 2));
    console.log(`Rollback log: ${logPath}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
