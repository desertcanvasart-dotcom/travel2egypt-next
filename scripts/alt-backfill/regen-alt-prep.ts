/**
 * Emit the file -> translation-group mapping for blog hero alt regeneration.
 * Reuses the same matching logic as replace-blog-heroes.ts.
 *
 *   npx tsx scripts/alt-backfill/regen-alt-prep.ts <folder> <out.json>
 *
 * Output: array of { file, enSlug, docs: [{ id, language, slug }] }
 * one entry per matched image (162). Unmatched/no-image files are skipped
 * (those are the known edge cases handled separately).
 */
import { createClient } from '@sanity/client';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

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

const IMG_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.tiff']);
const dir = process.argv[2];
const out = process.argv[3];
if (!dir || !out) { console.error('usage: regen-alt-prep.ts <folder> <out.json>'); process.exit(1); }

const EDGE_MAP: Record<string, string> = {
  'the-grand-egyptian-museum-2026-insider-guide': 'the-grand-egyptian-museum-2024-insider-guide',
  'eco-lodges-in-egypt-ecolodges-in-egypt': 'eco-lodges-in-egypt',
  'siwas-historical-landmarks-siwa-oasis-historical-landmarks': 'siwas-historical-landmarks',
};

function slugify(s: string): string {
  return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function stripExts(filename: string): string {
  let b = filename;
  while (IMG_EXT.has(extname(b).toLowerCase())) b = basename(b, extname(b));
  return b;
}

type Art = { _id: string; language: string; slug: string };

async function main() {
  const arts: Art[] = await client.fetch(
    `*[_type=="article" && !(_id in path("drafts.**"))]{_id, language, "slug": slug.current}`
  );
  const titles: { _id: string; title: string }[] = await client.fetch(
    `*[_type=="article" && language=="en" && !(_id in path("drafts.**"))]{_id, title}`
  );
  const metas: { translations: string[] }[] = await client.fetch(
    `*[_type=="translation.metadata"]{"translations": translations[].value._ref}`
  );
  const groupOf = new Map<string, string[]>();
  for (const m of metas) {
    const members = (m.translations || []).filter(Boolean);
    for (const id of members) groupOf.set(id, members);
  }
  const bySlug = new Map<string, string>();
  const byId = new Map<string, Art>();
  for (const a of arts) { byId.set(a._id, a); if (a.slug) bySlug.set(a.slug.toLowerCase(), a._id); }
  const byTitleSlug = new Map<string, string>();
  for (const t of titles) if (t.title) byTitleSlug.set(slugify(t.title), t._id);
  const resolveGroup = (id: string): string[] => {
    const g = groupOf.get(id);
    const members = (g && g.length ? g : [id]).filter((x) => byId.has(x));
    return members.length ? members : [id];
  };
  const matchFile = (filename: string): string | null => {
    const base = stripExts(filename);
    const direct = base.toLowerCase();
    if (bySlug.has(direct)) return bySlug.get(direct)!;
    const sl = slugify(base);
    if (EDGE_MAP[sl] && bySlug.has(EDGE_MAP[sl])) return bySlug.get(EDGE_MAP[sl])!;
    if (bySlug.has(sl)) return bySlug.get(sl)!;
    if (byTitleSlug.has(sl)) return byTitleSlug.get(sl)!;
    return null;
  };

  let files = readdirSync(dir).filter((f) => IMG_EXT.has(extname(f).toLowerCase()) && statSync(join(dir, f)).isFile());
  const claimed = new Set<string>();
  const result: any[] = [];
  for (const f of files) {
    const id = matchFile(f);
    if (!id) continue;
    const group = resolveGroup(id);
    const enId = group.find((i) => byId.get(i)?.language === 'en') || id;
    if (claimed.has(enId)) continue;
    claimed.add(enId);
    result.push({
      file: f,
      enSlug: byId.get(enId)?.slug,
      docs: group.map((i) => ({ id: i, language: byId.get(i)?.language, slug: byId.get(i)?.slug })),
    });
  }
  writeFileSync(out, JSON.stringify(result, null, 2));
  console.log(`wrote ${result.length} group mappings -> ${out}`);
  const langHist: Record<number, number> = {};
  for (const r of result) langHist[r.docs.length] = (langHist[r.docs.length] || 0) + 1;
  console.log('group sizes:', langHist);
}
main().catch((e) => { console.error(e); process.exit(1); });
