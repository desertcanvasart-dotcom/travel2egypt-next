/**
 * One-off salvage for 3 JA group-package files that ship WITHOUT frontmatter
 * (their EN/ES siblings have it). The bulk importer keys on frontmatter slug,
 * so these never merged. Their translated bodies are complete — here we attach
 * them to the known docs by EN slug.
 *
 *   • JA slug   = EN slug (convention: tour slugs are identical across locales)
 *   • JA title  = first bold line of the file
 *   • JA body   = whole file → HTML → PortableText
 *
 * Refuses to run against any dataset other than migration-staging.
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { readFileSync } from 'node:fs';
import { marked } from 'marked';
import { htmlToPortableText } from './wp-import-html.js';

loadEnv();

const ROOT = '/Users/islamhussein/Downloads/All 3 langs/ja/tours/group packages';
const TARGETS: Array<{ slug: string; file: string }> = [
  { slug: '10-day-egypt-group-tour-cairo-nile-red-sea', file: `${ROOT}/UK & Europe/10-day-egypt-group-tour-cairo-nile-red-sea_ja_2026-05.md` },
  { slug: '11-day-egypt-group-tour-cairo-red-sea-nile', file: `${ROOT}/USA & Canada/11-day-egypt-group-tour-cairo-red-sea-nile_ja_2026-05.md` },
  { slug: '9-day-egypt-group-tour-cairo-abu-simbel-nile', file: `${ROOT}/Japan & East Asia/9-day-egypt-group-tour-cairo-abu-simbel-nile_ja_2026-05.md` },
];

function firstBoldTitle(raw: string): string {
  const m = raw.match(/^\s*\*\*(.+?)\*\*/m);
  if (!m) throw new Error('no bold title line found');
  return m[1].trim();
}

async function main() {
  const commit = process.argv.includes('--commit');
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (dataset !== 'migration-staging') { console.error(`Refusing against ${dataset}`); process.exit(2); }
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
    useCdn: false, token: process.env.SANITY_STAGING_API_WRITE_TOKEN!, perspective: 'raw',
  });

  for (const t of TARGETS) {
    const _id = `tour.${t.slug}`;
    const raw = readFileSync(t.file, 'utf8');
    const title = firstBoldTitle(raw);
    const html = marked.parse(raw, { async: false }) as string;
    const { blocks } = htmlToPortableText(html, { locale: 'ja' });

    const doc = await client.fetch<{ title: any[]; slug: any[]; body: any[] } | null>(
      `*[_id==$id][0]{title,slug,body}`, { id: _id },
    );
    if (!doc) { console.warn(`! ${_id} not found — skipping`); continue; }

    const upsert = (arr: any[] | undefined, value: unknown) => {
      const next = (arr ?? []).filter((x: any) => x._key !== 'ja');
      next.push({ _key: 'ja', _type: 'object', value });
      return next;
    };
    const sets = {
      title: upsert(doc.title, title),
      slug: upsert(doc.slug, { _type: 'slug', current: t.slug }),
      body: upsert(doc.body, blocks),
    };

    console.log(`${commit ? 'PATCH' : 'dry'} ${_id}\n  title: ${title}\n  body blocks: ${blocks.length}`);
    if (commit) await client.patch(_id).set(sets).commit({ visibility: 'async' });
  }
  console.log(commit ? '\n✓ done' : '\nDry-run — no writes (pass --commit).');
}

main().catch((e) => { console.error(e); process.exit(1); });
