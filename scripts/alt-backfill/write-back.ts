import { createClient } from '@sanity/client';
import { readFileSync, writeFileSync } from 'node:fs';

const DIR = '/private/tmp/claude-501/-Users-islamhussein-t2e/5e23d53e-3e9f-4209-b183-1d60cdabe3f8/scratchpad/alt';

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

function loc(en: string, es: string, ja: string) {
  return [
    { _key: 'en', _type: 'object', value: en },
    { _key: 'es', _type: 'object', value: es },
    { _key: 'ja', _type: 'object', value: ja },
  ];
}

async function main() {
  const wl = JSON.parse(readFileSync(`${DIR}/worklist.json`, 'utf8'));
  const gen = JSON.parse(readFileSync(`${DIR}/gen.json`, 'utf8')) as any[];
  const byRef = new Map(wl.entries.map((e: any) => [e.ref, e]));

  let docCount = 0, assetCount = 0;
  const errors: string[] = [];

  for (const g of gen) {
    const e: any = byRef.get(g.ref);
    if (!e) { errors.push(`no worklist entry for ${g.ref}`); continue; }
    for (const d of e.docs) {
      const draftId = `drafts.${d.id}`;
      try {
        const pub = await client.getDocument(d.id);
        if (pub) {
          const { _rev, _updatedAt, _createdAt, ...rest } = pub as any;
          await client.createIfNotExists({ ...rest, _id: draftId });
        }
        let altVal: any, capVal: any;
        if (e.altMode === 'string') {
          const lang = ['en', 'es', 'ja'].includes(d.lang) ? d.lang : 'en';
          altVal = g[`alt_${lang}`];
          capVal = g[`cap_${lang}`];
        } else {
          altVal = loc(g.alt_en, g.alt_es, g.alt_ja);
          capVal = loc(g.cap_en, g.cap_es, g.cap_ja);
        }
        await client.patch(draftId).set({ 'heroImage.alt': altVal, 'heroImage.caption': capVal }).commit({ autoGenerateArrayKeys: false });
        docCount++;
      } catch (err: any) {
        errors.push(`${d.id}: ${err.message}`);
      }
    }
    e.done = true;
    assetCount++;
  }

  writeFileSync(`${DIR}/worklist.json`, JSON.stringify(wl, null, 2));
  const remaining = wl.entries.filter((e: any) => !e.done).length;
  console.log(`Wrote ${assetCount} assets -> ${docCount} draft docs. Errors: ${errors.length}. Remaining undone: ${remaining}/${wl.entries.length}`);
  for (const er of errors.slice(0, 20)) console.log('  ERR', er);
}
main();
