/**
 * Replace blog (article) hero images from a folder of files named by slug.
 *
 *   npx tsx scripts/alt-backfill/replace-blog-heroes.ts                 # audit translation groups only
 *   npx tsx scripts/alt-backfill/replace-blog-heroes.ts <folder>        # dry-run: match files -> article groups
 *   npx tsx scripts/alt-backfill/replace-blog-heroes.ts <folder> --apply# upload + repoint heroImage on all 3 langs
 *
 * Filenames: "<slug>.<ext>" where <slug> matches an article slug in ANY language
 * (typically the EN slug). One image is applied to the whole EN/ES/JA group.
 * On apply: uploads the asset once, sets heroImage.asset on every group member,
 * resets hotspot/crop, and CLEARS stale alt/caption/credit (regenerated later).
 * Rollback snapshot of prior heroImage written to backups/.
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
const folder = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
const APPLY = process.argv.includes('--apply');
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const ONLY = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',').map((s) => s.trim())) : null;

type Art = { _id: string; language: string; slug: string };

async function buildGroups() {
  const arts: Art[] = await client.fetch(
    `*[_type=="article" && !(_id in path("drafts.**"))]{_id, language, "slug": slug.current}`
  );
  const titles: { _id: string; title: string }[] = await client.fetch(
    `*[_type=="article" && language=="en" && !(_id in path("drafts.**"))]{_id, title}`
  );
  const metas: { translations: string[] }[] = await client.fetch(
    `*[_type=="translation.metadata"]{"translations": translations[].value._ref}`
  );
  // group id -> member article ids
  const groupOf = new Map<string, string[]>(); // articleId -> full member list
  for (const m of metas) {
    const members = (m.translations || []).filter(Boolean);
    if (members.length === 0) continue;
    for (const id of members) groupOf.set(id, members);
  }
  // slug (any lang) -> articleId
  const bySlug = new Map<string, string>();
  const byId = new Map<string, Art>();
  for (const a of arts) {
    byId.set(a._id, a);
    if (a.slug) bySlug.set(a.slug.toLowerCase(), a._id);
  }
  // slugified EN title -> articleId (fallback for title-cased filenames)
  const byTitleSlug = new Map<string, string>();
  for (const t of titles) {
    if (t.title) byTitleSlug.set(slugify(t.title), t._id);
  }
  // resolve group members restricted to article docs; fall back to self if no meta
  const resolveGroup = (id: string): string[] => {
    const g = groupOf.get(id);
    const members = (g && g.length ? g : [id]).filter((x) => byId.has(x));
    return members.length ? members : [id];
  };
  return { arts, bySlug, byTitleSlug, byId, resolveGroup };
}

/** Approved explicit overrides: slugify(filename base) -> target article slug. */
const EDGE_MAP: Record<string, string> = {
  'the-grand-egyptian-museum-2026-insider-guide': 'the-grand-egyptian-museum-2024-insider-guide',
  'eco-lodges-in-egypt-ecolodges-in-egypt': 'eco-lodges-in-egypt',
  'siwas-historical-landmarks-siwa-oasis-historical-landmarks': 'siwas-historical-landmarks',
};

function slugify(s: string): string {
  return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Strip ALL trailing image extensions (handles "name.jpg.jpg"), return the base. */
function stripExts(filename: string): string {
  let b = filename;
  while (IMG_EXT.has(extname(b).toLowerCase())) b = basename(b, extname(b));
  return b;
}

/** Resolve a filename to an article id, trying slug then slugified-title. */
function matchFile(
  filename: string,
  bySlug: Map<string, string>,
  byTitleSlug: Map<string, string>,
): { id: string; how: string } | null {
  const base = stripExts(filename);
  const direct = base.toLowerCase();
  if (bySlug.has(direct)) return { id: bySlug.get(direct)!, how: 'slug' };
  const sl = slugify(base);
  if (EDGE_MAP[sl] && bySlug.has(EDGE_MAP[sl])) return { id: bySlug.get(EDGE_MAP[sl])!, how: 'edge' };
  if (bySlug.has(sl)) return { id: bySlug.get(sl)!, how: 'slugified' };
  if (byTitleSlug.has(sl)) return { id: byTitleSlug.get(sl)!, how: 'title' };
  return null;
}

async function audit() {
  const { arts, byId, resolveGroup } = await buildGroups();
  const seen = new Set<string>();
  let triples = 0, partial = 0, singles = 0;
  const langCount: Record<string, number> = {};
  for (const a of arts) {
    if (seen.has(a._id)) continue;
    const members = resolveGroup(a._id);
    members.forEach((m) => seen.add(m));
    const langs = members.map((m) => byId.get(m)?.language).filter(Boolean).sort().join(',');
    langCount[langs] = (langCount[langs] || 0) + 1;
    if (members.length >= 3) triples++;
    else if (members.length === 2) partial++;
    else singles++;
  }
  console.log(`articles: ${arts.length} | translation groups: ${triples + partial + singles}`);
  console.log(`  full (3+ langs): ${triples} | partial (2): ${partial} | single (1): ${singles}`);
  console.log('  group language signatures:', langCount);
  console.log('\nReady. Drop hero images in a folder named "<en-slug>.<ext>" and run with that folder path.');
}

async function run(dir: string) {
  const { arts, bySlug, byTitleSlug, byId, resolveGroup } = await buildGroups();
  let files = readdirSync(dir).filter((f) => IMG_EXT.has(extname(f).toLowerCase()) && statSync(join(dir, f)).isFile());
  if (ONLY) { files = files.filter((f) => ONLY.has(f)); console.log(`--only: restricted to ${files.length} file(s).`); }
  const matched: { file: string; how: string; groupIds: string[] }[] = [];
  const unmatched: string[] = [];
  const claimed = new Set<string>(); // en-article ids already matched (dupe detection)
  for (const f of files) {
    const hit = matchFile(f, bySlug, byTitleSlug);
    if (!hit) { unmatched.push(f); continue; }
    // resolve to the EN member as the group anchor for dupe accounting
    const group = resolveGroup(hit.id);
    const enId = group.find((i) => byId.get(i)?.language === 'en') || hit.id;
    if (claimed.has(enId)) { unmatched.push(`${f} (DUPLICATE of already-matched article)`); continue; }
    claimed.add(enId);
    matched.push({ file: f, how: hit.how, groupIds: group });
  }
  console.log(`image files: ${files.length} | matched: ${matched.length} | unmatched: ${unmatched.length}`);
  const byHow: Record<string, number> = {};
  for (const m of matched) byHow[m.how] = (byHow[m.how] || 0) + 1;
  console.log('match method:', byHow);
  if (unmatched.length) { console.log('\nUNMATCHED files (no article slug/title):'); for (const u of unmatched) console.log('  -', u); }
  // articles with NO image supplied
  const enArts = arts.filter((a) => a.language === 'en');
  const missing = enArts.filter((a) => !claimed.has(a._id));
  if (missing.length) { console.log(`\nARTICLES WITH NO IMAGE SUPPLIED (${missing.length}):`); for (const a of missing) console.log('  -', a.slug); }

  if (!APPLY) { console.log('\nDRY RUN — pass --apply to upload + repoint. No changes made.'); return; }

  // rollback snapshot of current heroImage on every doc we will touch
  const touchIds = [...new Set(matched.flatMap((m) => m.groupIds))];
  const snap = await client.fetch(`*[_id in $ids]{_id, heroImage}`, { ids: touchIds });
  // Never clobber the original full-run rollback; retries write a separate file.
  const rbPath = ONLY
    ? '/Users/islamhussein/t2e/backups/blog-hero-replace-rollback-retry.json'
    : '/Users/islamhussein/t2e/backups/blog-hero-replace-rollback.json';
  writeFileSync(rbPath, JSON.stringify(snap, null, 2));
  console.log(`rollback snapshot written for ${snap.length} docs -> ${rbPath}`);

  let ok = 0, err = 0; const errors: string[] = [];
  for (const m of matched) {
    try {
      const buf = readFileSync(join(dir, m.file));
      const enId = m.groupIds.find((i) => byId.get(i)?.language === 'en');
      const cleanName = `${byId.get(enId || m.groupIds[0])?.slug || stripExts(m.file)}.jpg`;
      const asset = await client.assets.upload('image', buf, { filename: cleanName });
      for (const id of m.groupIds) {
        await client.patch(id)
          .set({ 'heroImage.asset': { _type: 'reference', _ref: asset._id } })
          .unset(['heroImage.hotspot', 'heroImage.crop', 'heroImage.alt', 'heroImage.caption', 'heroImage.credit'])
          .commit();
        ok++;
      }
    } catch (e: any) { err++; errors.push(`${m.file}: ${e.message}`); }
  }
  console.log(`APPLIED. doc patches ok: ${ok}, errored: ${err}`);
  for (const e of errors.slice(0, 15)) console.log('  ERR', e);
  console.log('\nNEXT: regenerate alt/caption for the replaced heroes (view new images -> EN/ES/JA strings).');
}

(folder ? run(folder) : audit()).catch((e) => { console.error(e); process.exit(1); });
