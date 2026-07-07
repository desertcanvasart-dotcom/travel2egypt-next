/**
 * Retire the duplicate "Islamic Insights: The Grand Islamic Cairo Day Tour"
 * (wp-page-89348, slug grand-islamic-cairo-day-tour) and 301-redirect it to the
 * richer keeper "The Grand Islamic Cairo Day Tour: Six Centuries in One Day"
 * (wp-page-87839, slug the-grand-islamic-day-tour). The old doc has 0 inbound
 * references, so no repointing is needed.
 *
 * Two subcommands; DRY RUN unless --apply is passed:
 *   redirects   append en/es/ja 301 rows to migration/redirect-map.csv (LOCAL file
 *               only; idempotent). Row format matches tour-dedup-apply-redirects.ts.
 *   unpublish   reversible unpublish of the old doc (createIfNotExists draft +
 *               delete published) — a PRODUCTION write.
 *
 *   tsx scripts/retire-grand-islamic-cairo.ts redirects            # preview rows
 *   tsx scripts/retire-grand-islamic-cairo.ts redirects --apply    # write rows
 *   tsx scripts/retire-grand-islamic-cairo.ts unpublish            # preview
 *   tsx scripts/retire-grand-islamic-cairo.ts unpublish --apply    # delete published
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { readFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

loadEnv();
const CMD = process.argv[2];
const APPLY = process.argv.includes('--apply');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET, // production
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  useCdn: false,
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
});

const CSV = join(process.cwd(), 'migration/redirect-map.csv');
const HOST = 'https://travel2egypt.org';
const PRIORITY = '50.00';

const OLD_EN = 'grand-islamic-cairo-day-tour';
const KEEPER_EN = 'the-grand-islamic-day-tour';

const SLUGS = `{ "id": _id, "en": slug[_key=="en"][0].value.current, "es": slug[_key=="es"][0].value.current, "ja": slug[_key=="ja"][0].value.current }`;
type Doc = { id: string; en: string | null; es: string | null; ja: string | null };
const bySlug = (en: string) =>
  client.fetch<Doc | null>(`*[!(_id in path("drafts.**")) && slug[_key=="en"][0].value.current==$s][0]${SLUGS}`, { s: en });
const wpId = (id: string) => id.match(/wp-page-(\d+)/)?.[1] ?? '';

async function redirects() {
  const [oldD, tgt] = await Promise.all([bySlug(OLD_EN), bySlug(KEEPER_EN)]);
  if (!oldD || !tgt) throw new Error(`missing old=${!!oldD} keeper=${!!tgt}`);
  const legacy = wpId(oldD.id);
  const locales: Array<['en' | 'es' | 'ja', string | null, string]> = [
    ['en', oldD.en, `/${tgt.en}`],
    ['es', oldD.es, `/es/${tgt.es ?? tgt.en}`],
    ['ja', oldD.ja, `/ja/${tgt.ja ?? tgt.en}`],
  ];
  const existingSources = new Set(
    readFileSync(CSV, 'utf8').split(/\r?\n/).slice(1).filter(Boolean).map((l) => l.split(',')[0])
  );
  const rows: string[] = [];
  for (const [loc, oldSlug, dest] of locales) {
    if (!oldSlug) continue;
    const from = `${HOST}${loc === 'en' ? '' : `/${loc}`}/${oldSlug}/`;
    if (existingSources.has(from)) { console.log(`  skip (present) ${from}`); continue; }
    const row = [from, dest, loc, '301', legacy, PRIORITY].join(',');
    rows.push(row);
    console.log(`  + ${row}`);
  }
  if (!rows.length) { console.log('No new rows.'); return; }
  if (!APPLY) { console.log(`\nDRY RUN — ${rows.length} row(s) would be appended. Pass --apply to write.`); return; }
  appendFileSync(CSV, rows.join('\n') + '\n');
  console.log(`\nAppended ${rows.length} rows. Next: npm run redirect-map:regenerate`);
}

async function unpublish() {
  const old = await bySlug(OLD_EN);
  if (!old) { console.log('old not published (already retired?)'); return; }
  const inbound = await client.fetch<number>(`count(*[!(_id in path("drafts.**")) && references($id)])`, { id: old.id });
  console.log(`old=${old.id} inbound refs=${inbound}`);
  if (inbound > 0) { console.log('ABORT: inbound refs present — repoint first.'); return; }
  if (!APPLY) { console.log('DRY RUN — would unpublish (draft preserved). Pass --apply.'); return; }
  const published = await client.getDocument(old.id);
  const { _id, _rev, ...rest } = published as any;
  await client.transaction().createIfNotExists({ ...rest, _id: `drafts.${old.id}` }).delete(old.id).commit({ visibility: 'async' });
  console.log(`unpublished ${old.id} (draft kept for rollback)`);
}

async function main() {
  console.log(`${CMD} — ${APPLY ? 'APPLY' : 'DRY RUN'} (dataset=${client.config().dataset})`);
  if (CMD === 'redirects') return redirects();
  if (CMD === 'unpublish') return unpublish();
  throw new Error('usage: redirects|unpublish [--apply]');
}
main().catch((e) => { console.error(e); process.exit(1); });
