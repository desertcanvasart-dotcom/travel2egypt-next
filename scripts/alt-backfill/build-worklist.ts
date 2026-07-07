import { createClient } from '@sanity/client';
import { readFileSync, writeFileSync } from 'node:fs';

// minimal .env parse (only the keys we need)
const env: Record<string, string> = {};
for (const line of readFileSync('/Users/islamhussein/t2e/.env', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ufallvd2',
  dataset: env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-12-01',
  token: env.SANITY_PRODUCTION_API_WRITE_TOKEN || env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

async function main() {
const rows: any[] = await client.fetch(`
*[defined(heroImage.asset) && !(_id in path("drafts.**"))]{
  "id": _id, "type": _type,
  "ref": heroImage.asset._ref,
  "url": heroImage.asset->url,
  "w": heroImage.asset->metadata.dimensions.width,
  "h": heroImage.asset->metadata.dimensions.height,
  "lang": coalesce(language, "—"),
  "slug": coalesce(slug[_key=="en"][0].value.current, slug.current),
  "ctx": coalesce(title[_key=="en"][0].value, title, name[_key=="en"][0].value, name),
  "hasAlt": defined(heroImage.alt) && (coalesce(heroImage.alt[_key=="en"][0].value, heroImage.alt) != "")
}`);

// dedupe by asset ref
const byRef = new Map<string, any>();
for (const r of rows) {
  if (!byRef.has(r.ref)) {
    byRef.set(r.ref, {
      ref: r.ref, url: r.url, w: r.w, h: r.h,
      altMode: r.type === 'article' ? 'string' : 'localized',
      done: false,
      docs: [],
    });
  }
  byRef.get(r.ref).docs.push({ id: r.id, type: r.type, lang: r.lang, slug: r.slug, ctx: r.ctx, hasAlt: r.hasAlt });
}

const entries = [...byRef.values()];
const out = { builtFrom: rows.length, distinctAssets: entries.length, entries };
writeFileSync('/private/tmp/claude-501/-Users-islamhussein-t2e/5e23d53e-3e9f-4209-b183-1d60cdabe3f8/scratchpad/alt/worklist.json', JSON.stringify(out, null, 2));

// summaries only (keep console small)
const byType: Record<string, number> = {};
const byMode: Record<string, number> = {};
let docsWithAlt = 0;
for (const r of rows) { byType[r.type] = (byType[r.type] || 0) + 1; if (r.hasAlt) docsWithAlt++; }
for (const e of entries) byMode[e.altMode] = (byMode[e.altMode] || 0) + 1;
console.log('hero docs total:', rows.length, '| docs already with EN alt:', docsWithAlt);
console.log('distinct hero assets:', entries.length);
console.log('distinct assets by altMode:', byMode);
console.log('hero docs by type:', byType);
}
main();
