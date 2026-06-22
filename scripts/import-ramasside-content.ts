/**
 * Replace the CONTENT (title, summary, body) of the ramasside-tours tour doc
 * (wp-page-146018) with the new en/es/ja markdown in /Users/islamhussein/Desktop/tours.
 * Hero image, slug, type, durationHours, cities, etc. are left untouched.
 *
 * Body markdown -> portable text via the canonical md-to-pt converter (same as
 * the site's content pipeline). Tables flatten to bullet lists (no table block
 * in the tour body schema).
 *
 *   tsx scripts/import-ramasside-content.ts preview          # print conversion, no write
 *   tsx scripts/import-ramasside-content.ts apply            # write to drafts.wp-page-146018
 *   tsx scripts/import-ramasside-content.ts publish          # publish the draft
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { readFileSync } from 'node:fs';
import { mdToPortableText } from './wp-import-md/md-to-pt.js';
import type { Locale } from './wp-import-md/types.js';

loadEnv();
const CMD = process.argv[2] ?? 'preview';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  useCdn: false,
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
});

const BASE_ID = 'wp-page-146018';
const DIR = '/Users/islamhussein/Desktop/tours';
const LOCALES: Locale[] = ['en', 'es', 'ja'];
const FILES: Record<Locale, string> = {
  en: `${DIR}/en/en.md`,
  es: `${DIR}/es/es.md`,
  ja: `${DIR}/ja/ja.md`,
};

function parse(file: string): { title: string; description: string; body: string } {
  const raw = readFileSync(file, 'utf8');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) throw new Error(`No frontmatter in ${file}`);
  const fm = m[1];
  const body = m[2].trim();
  const grab = (key: string) => {
    const mm = fm.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
    if (!mm) throw new Error(`Missing ${key} in ${file}`);
    return mm[1].trim().replace(/^["']|["']$/g, '');
  };
  return { title: grab('title'), description: grab('description'), body };
}

function build() {
  const intlString = (key: Locale, value: string) => ({ _key: key, _type: 'internationalizedArrayStringValue', value });
  const title: any[] = [];
  const summary: any[] = [];
  const body: any[] = [];
  const previews: Record<string, any> = {};
  for (const loc of LOCALES) {
    const { title: t, description: d, body: rawMd } = parse(FILES[loc]);
    // EN file left the price as a literal placeholder "€X"; ES/JA say €55.
    // Per the operator's decision, normalise EN to €55 for consistency.
    const md = loc === 'en' ? rawMd.replace('€X', '€55') : rawMd;
    const { blocks, stats } = mdToPortableText(md, { locale: loc, imageMap: new Map() });
    title.push(intlString(loc, t));
    summary.push(intlString(loc, d));
    body.push({ _key: loc, _type: 'object', value: blocks });
    previews[loc] = { t, d, blocks, stats };
  }
  return { title, summary, body, previews };
}

function renderBlocks(blocks: any[]): string {
  return blocks
    .map((b) => {
      if (b._type !== 'block') return `   [${b._type}]`;
      const text = (b.children ?? []).map((c: any) => c.text ?? '').join('');
      const prefix = b.listItem ? '   • ' : b.style && b.style !== 'normal' ? `   <${b.style}> ` : '   ';
      return prefix + text;
    })
    .join('\n');
}

async function main() {
  console.log(`ramasside content — ${CMD}\n`);
  const { title, summary, body, previews } = build();

  if (CMD === 'preview') {
    for (const loc of LOCALES) {
      const p = previews[loc];
      console.log(`================ ${loc.toUpperCase()} ================`);
      console.log(`TITLE   : ${p.t}`);
      console.log(`SUMMARY : ${p.d}`);
      console.log(`BODY (${p.blocks.length} blocks, stats: ${JSON.stringify(p.stats)}):`);
      console.log(renderBlocks(p.blocks));
      console.log();
    }
    return;
  }

  if (CMD === 'apply') {
    const published = await client.getDocument(BASE_ID);
    if (!published) throw new Error('published doc missing');
    const draftId = `drafts.${BASE_ID}`;
    await client.createIfNotExists({ ...(published as any), _id: draftId });
    await client.patch(draftId).set({ title, summary, body }).commit({ visibility: 'sync' });
    console.log(`Wrote title/summary/body to ${draftId} (3 locales). Not yet published.`);
    return;
  }

  if (CMD === 'publish') {
    const draftId = `drafts.${BASE_ID}`;
    const draft = await client.getDocument(draftId);
    if (!draft) throw new Error('no draft to publish');
    const { _id, _rev, ...rest } = draft as any;
    await client.transaction().createOrReplace({ ...rest, _id: BASE_ID }).delete(draftId).commit({ visibility: 'sync' });
    console.log(`Published ${BASE_ID} and cleared draft.`);
    return;
  }

  throw new Error('usage: preview|apply|publish');
}
main().catch((e) => { console.error(e); process.exit(1); });
