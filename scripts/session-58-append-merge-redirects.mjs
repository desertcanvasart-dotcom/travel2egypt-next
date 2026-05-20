import 'dotenv/config';
import { readFileSync, writeFileSync } from 'node:fs';

/**
 * Session 58 — Phase 3e step E: append 6 redirect rows for the merged
 * source docs' per-locale URLs → parent city.
 *
 *   /guide/nuweiba/cultural-events-in-nuweiba  → /guide/nuweiba
 *   /es/guide/nuweiba/fiestas-en-nuweiba       → /es/guide/nuweiba
 *   /ja/guide/nuweiba/nuweiba-no-o-matsuri     → /ja/guide/nuweiba
 *   /guide/safaga/annual-events-in-safaga      → /guide/safaga
 *   /es/guide/safaga/celebracion-en-safaga     → /es/guide/safaga
 *   /ja/guide/safaga/safaga-de-no-oiwai        → /ja/guide/safaga
 *
 * Idempotent: skips rows whose (from_url, locale) key already exists in
 * the CSV. After append, follow up with `npm run redirect-map:regenerate`
 * to refresh migration/redirect-map.generated.ts.
 */

const CSV_PATH = 'migration/redirect-map.csv';

const ROWS = [
  { from: 'https://travel2egypt.org/guide/nuweiba/cultural-events-in-nuweiba/', to: '/guide/nuweiba', locale: 'en' },
  { from: 'https://travel2egypt.org/es/guide/nuweiba/fiestas-en-nuweiba/', to: '/es/guide/nuweiba', locale: 'es' },
  { from: 'https://travel2egypt.org/ja/guide/nuweiba/nuweiba-no-o-matsuri/', to: '/ja/guide/nuweiba', locale: 'ja' },
  { from: 'https://travel2egypt.org/guide/safaga/annual-events-in-safaga/', to: '/guide/safaga', locale: 'en' },
  { from: 'https://travel2egypt.org/es/guide/safaga/celebracion-en-safaga/', to: '/es/guide/safaga', locale: 'es' },
  { from: 'https://travel2egypt.org/ja/guide/safaga/safaga-de-no-oiwai/', to: '/ja/guide/safaga', locale: 'ja' },
];

const csv = readFileSync(CSV_PATH, 'utf8');
const lines = csv.split(/\r?\n/);
const header = lines.shift();
const dataLines = lines.filter((l) => l.length > 0);
const existingKeys = new Set();
for (const line of dataLines) {
  const [fu, , loc] = line.split(',');
  existingKeys.add(`${loc} ${fu}`);
}

const appended = [];
for (const r of ROWS) {
  const key = `${r.locale} ${r.from}`;
  if (existingKeys.has(key)) {
    console.log(`skip (already present): ${r.from}`);
    continue;
  }
  appended.push([r.from, r.to, r.locale, 301, '', '0.00'].join(','));
}

if (appended.length === 0) {
  console.log('[s58-redirects] no new rows to append (all 6 already present).');
  process.exit(0);
}

const out = header + '\n' + [...dataLines, ...appended].join('\n') + '\n';
writeFileSync(CSV_PATH, out);
console.log(`[s58-redirects] appended ${appended.length} rows to ${CSV_PATH}`);
console.log(`[s58-redirects] Next: \`npm run redirect-map:regenerate\` to refresh generated.ts`);
