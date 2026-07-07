import { createClient } from '@sanity/client';
import { readFileSync, writeFileSync } from 'node:fs';
const DIR = '/private/tmp/claude-501/-Users-islamhussein-t2e/5e23d53e-3e9f-4209-b183-1d60cdabe3f8/scratchpad/alt';
const env: Record<string, string> = {};
for (const line of readFileSync('/Users/islamhussein/t2e/.env', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ufallvd2',
  dataset: env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-12-01', token: env.SANITY_PRODUCTION_API_WRITE_TOKEN, useCdn: false, perspective: 'drafts' as any,
});
async function main() {
  const rows: any[] = await client.fetch(`*[defined(heroImage.asset) && !(_id in path("drafts.**"))]{
    "id":_id, "type":_type, "ref":heroImage.asset._ref, "url":heroImage.asset->url,
    "slug":coalesce(slug[_key=="en"][0].value.current, slug.current),
    "ctx":coalesce(title[_key=="en"][0].value, title, name[_key=="en"][0].value, name),
    "altEN":coalesce(heroImage.alt[_key=="en"][0].value, heroImage.alt),
    "altES":heroImage.alt[_key=="es"][0].value, "altJA":heroImage.alt[_key=="ja"][0].value,
    "capEN":coalesce(heroImage.caption[_key=="en"][0].value, heroImage.caption)
  }`);
  const wl = JSON.parse(readFileSync(`${DIR}/worklist.json`, 'utf8'));
  const inScope = new Set(wl.entries.map((e: any) => e.ref));
  const byRef = new Map<string, any>();
  for (const r of rows) {
    if (!inScope.has(r.ref)) continue;
    const cur = byRef.get(r.ref);
    if (!cur || (!cur.altEN && r.altEN)) byRef.set(r.ref, r); // prefer a row that has text
  }
  const flags = JSON.parse(readFileSync(`${DIR}/mismatch-flags.json`, 'utf8'));
  const flagByRef = new Map(flags.map((f: any) => [f.ref, f.flag]));
  const out = [...byRef.values()].map(r => ({ ...r, flag: flagByRef.get(r.ref) || '' }));
  writeFileSync(`${DIR}/review.json`, JSON.stringify(out));
  console.log('review rows (distinct assets):', out.length, '| with text:', out.filter(r => r.altEN).length, '| flagged:', out.filter(r => r.flag).length);
}
main();
