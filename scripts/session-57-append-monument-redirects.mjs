import 'dotenv/config';
import { createClient } from '@sanity/client';
import { readFileSync, writeFileSync } from 'node:fs';

/**
 * Session 57 — Phase 3d step E: append 134 × 3 = 402 monument redirect rows.
 *
 * The /wiki/monuments/[slug] route lives at app/(site)/[locale]/wiki/monuments,
 * so all 3 locales (en/es/ja) serve it. Per s55 precedent (one CSV row per
 * locale), we emit 3 rows per monument with locale-prefixed source +
 * destination (EN unprefixed; ES/JA prefixed) using each monument's per-
 * locale slug (falling back to EN when an ES/JA slug is missing — matches
 * the route's own generateStaticParams fallback).
 *
 * Direct CSV append. s55 regenerator preserves baseline rows whose from_url
 * isn't in the inventory CSV, so a subsequent `npm run redirect-map:regenerate`
 * rolls the 402 monument rows through to redirect-map.generated.ts unchanged.
 *
 * Run: node scripts/session-57-append-monument-redirects.mjs [--dry-run]
 */

const DRY_RUN = process.argv.includes('--dry-run');

const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
if (!token) {
  console.error('Missing SANITY_STAGING_API_WRITE_TOKEN');
  process.exit(1);
}

const client = createClient({
  projectId: 'ufallvd2',
  dataset: 'migration-staging',
  apiVersion: '2024-12-01',
  token,
  useCdn: false,
});

const CSV_PATH = 'migration/redirect-map.csv';
const LOCALES = ['en', 'es', 'ja'];

function localePrefix(locale) {
  return locale === 'en' ? '' : `/${locale}`;
}

function csvEscape(s) {
  // Mirror the existing CSV: no quoting; slugs are URL-safe so no commas.
  return s;
}

async function main() {
  const monuments = await client.fetch(
    `*[_type == "wikiMonument" && !(_id in path("drafts.**"))]{
       _id,
       "citySlug": city->slug[_key=="en"][0].value.current,
       "slugs": slug[]{ _key, "current": value.current }
     }`
  );
  console.log(`[s57-redirects] wikiMonument count: ${monuments.length}`);

  // Build expected rows.
  const rows = [];
  for (const m of monuments) {
    const enSlug = m.slugs?.find((s) => s._key === 'en')?.current;
    if (!enSlug || !m.citySlug) {
      console.warn(`[s57-redirects] skip ${m._id}: missing en slug or city slug`);
      continue;
    }
    for (const loc of LOCALES) {
      const localeSlug = m.slugs.find((s) => s._key === loc)?.current ?? enSlug;
      const prefix = localePrefix(loc);
      const fromUrl = `https://travel2egypt.org${prefix}/wiki/monuments/${localeSlug}/`;
      const toPath = `${prefix}/guide/${m.citySlug}/${localeSlug}`;
      rows.push({
        from_url: fromUrl,
        to_path: toPath,
        locale: loc,
        status_code: 301,
        legacy_wp_id: '',
        priority_score: '0.00',
      });
    }
  }
  console.log(`[s57-redirects] generated rows: ${rows.length}`);

  // Read existing CSV; skip rows whose (from_url, locale) key already exists.
  const csv = readFileSync(CSV_PATH, 'utf8');
  const lines = csv.split(/\r?\n/);
  const header = lines.shift();
  const dataLines = lines.filter((l) => l.length > 0);
  const existingKeys = new Set();
  for (const line of dataLines) {
    const [fu, , loc] = line.split(',');
    existingKeys.add(`${loc} ${fu}`);
  }

  const newRows = rows.filter((r) => !existingKeys.has(`${r.locale} ${r.from_url}`));
  console.log(`[s57-redirects] existing CSV rows: ${dataLines.length}, new to append: ${newRows.length}`);

  if (DRY_RUN) {
    console.log('[dry-run] first 5 new rows:');
    for (const r of newRows.slice(0, 5)) {
      console.log(`  ${r.from_url} → ${r.to_path} (${r.locale})`);
    }
    console.log(`[dry-run] would write CSV with ${dataLines.length + newRows.length} data rows total`);
    return;
  }

  const appendedLines = newRows.map((r) =>
    [csvEscape(r.from_url), csvEscape(r.to_path), r.locale, r.status_code, r.legacy_wp_id, r.priority_score].join(',')
  );
  const out = header + '\n' + [...dataLines, ...appendedLines].join('\n') + '\n';
  writeFileSync(CSV_PATH, out);
  console.log(`[s57-redirects] wrote ${CSV_PATH}: ${dataLines.length + newRows.length} data rows`);
  console.log(`[s57-redirects] Next step: run \`npm run redirect-map:regenerate -- --diff\` to refresh generated.ts`);
}

main().catch((e) => {
  console.error(`[s57-redirects] FATAL: ${e.message}`);
  process.exit(1);
});
