/**
 * Replace the CONTENT (title, summary, body) of a tour doc with new en/es/ja
 * markdown. Hero image, slug, and structured fields are left untouched. The
 * on-site slug is kept — any `slug:` in the markdown frontmatter is IGNORED.
 *
 * Body markdown -> portable text via the canonical md-to-pt converter (tables
 * flatten to bullet lists; `#` -> h2, `####` -> h4).
 *
 *   tsx scripts/import-tour-content.ts preview --slug <slug> --dir <folder>
 *   tsx scripts/import-tour-content.ts apply   --slug <slug> --dir <folder>   # -> draft
 *   tsx scripts/import-tour-content.ts publish --slug <slug>
 *
 * <folder> must contain en/<*.md>, es/<*.md>, ja/<*.md> (one .md per locale).
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { mdToPortableText } from './wp-import-md/md-to-pt.js';
import type { Locale } from './wp-import-md/types.js';

loadEnv();
const CMD = process.argv[2] ?? 'preview';
const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const SLUG = arg('slug');
const DIR = arg('dir');
const PRICE = arg('price'); // optional: replace the "€X" placeholder with "€<price>"
const LOCALES: Locale[] = ['en', 'es', 'ja'];

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  useCdn: false,
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
});

function mdFile(loc: Locale): string {
  const sub = join(DIR!, loc);
  const md = readdirSync(sub).find((f) => f.endsWith('.md'));
  if (!md) throw new Error(`No .md in ${sub}`);
  return join(sub, md);
}

function parse(file: string): { title: string; description: string; body: string } {
  const raw = readFileSync(file, 'utf8');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) throw new Error(`No frontmatter in ${file}`);
  const fm = m[1];
  const grab = (key: string) => {
    const mm = fm.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
    if (!mm) throw new Error(`Missing ${key} in ${file}`);
    return mm[1].trim().replace(/^["']|["']$/g, '');
  };
  return { title: grab('title'), description: grab('description'), body: m[2].trim() };
}

function build() {
  const intl = (key: Locale, value: string) => ({ _key: key, _type: 'internationalizedArrayStringValue', value });
  const title: any[] = [], summary: any[] = [], body: any[] = [];
  const previews: Record<string, any> = {};
  for (const loc of LOCALES) {
    const { title: t, description: d, body: rawMd } = parse(mdFile(loc));
    // Optional: fill the "€X" price placeholder with the operator-supplied amount.
    const md = PRICE ? rawMd.replace(/€X/g, `€${PRICE}`) : rawMd;
    const { blocks, stats } = mdToPortableText(md, { locale: loc, imageMap: new Map() });
    title.push(intl(loc, t));
    summary.push(intl(loc, d));
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

async function resolveId(): Promise<string> {
  if (!SLUG) throw new Error('--slug required');
  const id = await client.fetch<string | null>(
    `*[!(_id in path("drafts.**")) && _type=="tour" && slug[_key=="en"][0].value.current==$s][0]._id`,
    { s: SLUG }
  );
  if (!id) throw new Error(`No published tour with slug ${SLUG}`);
  return id;
}

async function main() {
  console.log(`import-tour-content — ${CMD} (slug=${SLUG ?? '-'})\n`);

  if (CMD === 'preview') {
    const { previews } = build();
    for (const loc of LOCALES) {
      const p = previews[loc];
      console.log(`================ ${loc.toUpperCase()} ================`);
      console.log(`TITLE   : ${p.t}`);
      console.log(`SUMMARY : ${p.d}`);
      console.log(`BODY (${p.blocks.length} blocks, tablesFlattened=${p.stats.tablesFlattened}, images=${p.stats.images}):`);
      console.log(renderBlocks(p.blocks));
      console.log();
    }
    return;
  }

  if (CMD === 'apply') {
    const baseId = await resolveId();
    const { title, summary, body } = build();
    const published = await client.getDocument(baseId);
    const draftId = `drafts.${baseId}`;
    await client.createIfNotExists({ ...(published as any), _id: draftId });
    await client.patch(draftId).set({ title, summary, body }).commit({ visibility: 'sync' });
    console.log(`Wrote title/summary/body to ${draftId} (3 locales). Not yet published.`);
    return;
  }

  if (CMD === 'publish') {
    const baseId = await resolveId();
    const draftId = `drafts.${baseId}`;
    const draft = await client.getDocument(draftId);
    if (!draft) throw new Error('no draft to publish');
    const { _id, _rev, ...rest } = draft as any;
    await client.transaction().createOrReplace({ ...rest, _id: baseId }).delete(draftId).commit({ visibility: 'sync' });
    console.log(`Published ${baseId} and cleared draft.`);
    return;
  }

  throw new Error('usage: preview|apply|publish --slug <slug> [--dir <folder>]');
}
main().catch((e) => { console.error(e); process.exit(1); });
