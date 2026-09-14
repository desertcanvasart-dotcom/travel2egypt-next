/**
 * create-giftun-islands-guide — stage the Hurghada "Giftun Islands" guideArticle
 * from founder-locked markdown (content/destinations/hurghada/giftun-islands.{en,es,ja}.md).
 *
 * Canon Gate A: locked copy → staging script with verbatim pre-flight → HOLD →
 * publish → verify. This script therefore has three modes:
 *
 *   --dry-run   parse, build, pre-flight, write the payload to backups/; no writes
 *   --commit    create/replace the DRAFT  drafts.guideArticle.hurghada.giftun-islands
 *   --publish   createOrReplace the published doc, delete the draft, append the
 *               city.placesToGo reference (rollback of the city doc captured first)
 *
 * Verbatim pre-flight: every heading/paragraph string about to be written must
 * byte-match (apostrophe-normalised) a line of the locked markdown, or abort.
 * Internal links are injected by anchor text onto known doc ids (no
 * `_pendingInternalRef` debris). Hero = existing licensed asset already used by
 * the Orange Bay charter tour (viewed + claims-tested 2026-09-14).
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import matter from 'gray-matter';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
loadEnv();

type Lang = 'en' | 'es' | 'ja';
const LANGS: Lang[] = ['en', 'es', 'ja'];
const CITY_ID = 'wp-page-58859'; // city: Hurghada
const DOC_ID = 'guideArticle.hurghada.giftun-islands';
const DRAFT_ID = `drafts.${DOC_ID}`;
const HERO_ASSET = 'image-048e1d091b0a7f8eb5f3e02d6fc3b917ad132487-3000x2000-jpg';
const SRC = (l: Lang) => resolve(process.cwd(), `content/destinations/hurghada/giftun-islands.${l}.md`);
const LINKS: Record<Lang, { anchor: string; ref: string }[]> = {
  en: [
    { anchor: 'Shared yachts', ref: 'tour.giftun-island-shared-snorkeling-day-from-hurghada' },
    { anchor: 'a private boat', ref: 'wp-page-88558' },
    { anchor: 'the wrecks of Abu Nuhas', ref: 'guideArticle.hurghada.abu-nuhas-shipwreck-sites' },
  ],
  es: [
    { anchor: 'Los yates compartidos', ref: 'tour.giftun-island-shared-snorkeling-day-from-hurghada' },
    { anchor: 'un barco privado', ref: 'wp-page-88558' },
    { anchor: 'los pecios de Abu Nuhas', ref: 'guideArticle.hurghada.abu-nuhas-shipwreck-sites' },
  ],
  ja: [
    { anchor: '乗り合いのヨット', ref: 'tour.giftun-island-shared-snorkeling-day-from-hurghada' },
    { anchor: 'プライベートボート', ref: 'wp-page-88558' },
    { anchor: 'アブ・ヌハスの沈船', ref: 'guideArticle.hurghada.abu-nuhas-shipwreck-sites' },
  ],
};

const argv = process.argv.slice(2);
const mode = argv.includes('--publish') ? 'publish' : argv.includes('--commit') ? 'commit' : argv.includes('--dry-run') ? 'dry-run' : null;
if (!mode) { console.error('usage: --dry-run | --commit | --publish'); process.exit(2); }

const key = (p: string) => `${p}${randomBytes(6).toString('hex')}`;
const norm = (s: string) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();

interface Span { _key: string; _type: 'span'; text: string; marks: string[] }
interface MarkDef { _key: string; _type: 'internalLink'; reference: { _ref: string; _type: 'reference' } }
interface Block { _key: string; _type: 'block'; style: 'normal' | 'h2'; markDefs: MarkDef[]; children: Span[] }

function parseBody(md: string): Block[] {
  const blocks: Block[] = [];
  for (const para of md.split(/\n\s*\n/)) {
    const line = para.replace(/\n/g, ' ').trim();
    if (!line) continue;
    if (/^#{1,6}\s/.test(line)) {
      if (!line.startsWith('## ')) throw new Error(`only ## headings allowed, got: ${line}`);
      blocks.push({ _key: key('b'), _type: 'block', style: 'h2', markDefs: [], children: [{ _key: key('s'), _type: 'span', text: line.slice(3).trim(), marks: [] }] });
    } else {
      blocks.push({ _key: key('b'), _type: 'block', style: 'normal', markDefs: [], children: [{ _key: key('s'), _type: 'span', text: line, marks: [] }] });
    }
  }
  return blocks;
}
function injectLink(blocks: Block[], anchor: string, ref: string): boolean {
  for (const b of blocks) {
    if (b.style !== 'normal') continue;
    const idx = b.children.findIndex((s) => s.marks.length === 0 && s.text.includes(anchor));
    if (idx === -1) continue;
    const s = b.children[idx]; const at = s.text.indexOf(anchor);
    const md: MarkDef = { _key: key('m'), _type: 'internalLink', reference: { _ref: ref, _type: 'reference' } };
    const repl: Span[] = [];
    if (at > 0) repl.push({ _key: key('s'), _type: 'span', text: s.text.slice(0, at), marks: [] });
    repl.push({ _key: key('s'), _type: 'span', text: anchor, marks: [md._key] });
    const after = s.text.slice(at + anchor.length);
    if (after) repl.push({ _key: key('s'), _type: 'span', text: after, marks: [] });
    b.children.splice(idx, 1, ...repl); b.markDefs.push(md); return true;
  }
  return false;
}
/** Verbatim pre-flight: every block's concatenated text must match one locked-copy line. */
function preflight(lang: Lang, blocks: Block[], md: string) {
  const lines = new Set(md.split(/\n\s*\n/).map((p) => norm(p.replace(/\n/g, ' ').replace(/^##\s+/, ''))).filter(Boolean));
  const bad = blocks.map((b) => norm(b.children.map((s) => s.text).join(''))).filter((t) => !lines.has(t));
  if (bad.length) { console.error(`[${lang}] VERBATIM PRE-FLIGHT FAILED for ${bad.length} block(s):\n  ${bad.join('\n  ')}`); process.exit(3); }
}

const parsed = LANGS.map((lang) => {
  const raw = readFileSync(SRC(lang), 'utf8');
  const { data: fm, content } = matter(raw);
  for (const f of ['slug', 'title', 'description', 'excerpt', 'heroAlt', 'heroCaption']) if (!fm[f]) throw new Error(`[${lang}] frontmatter missing ${f}`);
  if (fm.locale !== lang || fm.city !== 'hurghada' || fm.kind !== 'attraction') throw new Error(`[${lang}] frontmatter locale/city/kind mismatch`);
  const body = parseBody(content);
  preflight(lang, body, content);
  const linked: string[] = [], missed: string[] = [];
  for (const { anchor, ref } of LINKS[lang]) (injectLink(body, anchor, ref) ? linked : missed).push(anchor);
  if (missed.length) { console.error(`[${lang}] link anchors not found: ${missed.join(', ')}`); process.exit(4); }
  const words = body.reduce((n, b) => n + b.children.map((s) => s.text).join('').split(/\s+/).length, 0);
  return { lang, fm, body, linked, words };
});
// placesToGoGroup: empty by founder decision 2026-09-14 — untagged places render in the
// sidebar's trailing 'Other sites' list next to Hurghada Marina (alphabetical), where the owner wants it.
const group = ((parsed[0].fm.placesToGoGroup as string | undefined) ?? '').trim();
if (parsed.some((p) => ((p.fm.placesToGoGroup as string | undefined) ?? '').trim() !== group)) throw new Error('placesToGoGroup must be identical across locales (controlled token)');

const i18n = <T,>(pick: (p: typeof parsed[number]) => T) => parsed.map((p) => ({ _key: p.lang, value: pick(p) }));
const i18nObj = <T,>(pick: (p: typeof parsed[number]) => T) => parsed.map((p) => ({ _key: p.lang, _type: 'object' as const, value: pick(p) }));
const doc = {
  _id: mode === 'publish' ? DOC_ID : DRAFT_ID,
  _type: 'guideArticle',
  parentCity: { _ref: CITY_ID, _type: 'reference' },
  kind: 'attraction',
  section: 'places-to-go',
  ...(group ? { placesToGoGroup: group } : {}),
  title: i18n((p) => p.fm.title as string),
  slug: i18n((p) => ({ _type: 'slug', current: p.fm.slug as string })),
  summary: i18n((p) => p.fm.excerpt as string),
  body: i18nObj((p) => p.body),
  heroImage: {
    _type: 'localizedImage',
    asset: { _ref: HERO_ASSET, _type: 'reference' },
    alt: i18nObj((p) => p.fm.heroAlt as string),
    caption: i18nObj((p) => p.fm.heroCaption as string),
  },
  seo: { metaTitle: i18n((p) => p.fm.title as string), metaDescription: i18n((p) => p.fm.description as string) },
};

console.log(`\n=== Giftun Islands guideArticle — mode: ${mode.toUpperCase()} → ${doc._id}`);
for (const p of parsed) console.log(`  [${p.lang}] "${p.fm.title}"  slug=${p.fm.slug}  blocks=${p.body.length} (h2 ${p.body.filter((b) => b.style === 'h2').length})  words=${p.words}  links: ${p.linked.join(', ')}  meta=${(p.fm.description as string).length} chars`);

function getClient(): SanityClient {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID; const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const token = process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
  if (dataset !== 'production') throw new Error('production only'); if (!projectId || !token) throw new Error('missing projectId/token');
  return createClient({ projectId, dataset, apiVersion: '2024-12-01', useCdn: false, token, perspective: 'raw' });
}
(async () => {
  const client = getClient();
  const [existingPub, existingDraft, city, hero] = await Promise.all([
    client.getDocument(DOC_ID), client.getDocument(DRAFT_ID),
    client.fetch(`*[_id==$id][0]{_id, placesToGo}`, { id: CITY_ID }),
    client.fetch(`*[_id==$id][0]{_id, "w": metadata.dimensions.width, "h": metadata.dimensions.height}`, { id: HERO_ASSET }),
  ]);
  if (!hero || hero.w < 3000) throw new Error(`hero asset missing or below 3000px: ${JSON.stringify(hero)}`);
  const refs = LINKS.en.map((l) => l.ref).concat(CITY_ID);
  const found: string[] = await client.fetch(`*[_id in $ids]._id`, { ids: refs });
  const missingRefs = refs.filter((r) => !found.includes(r));
  if (missingRefs.length) throw new Error(`link/city refs not found: ${missingRefs.join(', ')}`);
  console.log(`  hero ${hero.w}x${hero.h} ok · all ${refs.length} refs resolve · existing published: ${existingPub ? 'YES' : 'no'} · existing draft: ${existingDraft ? 'YES' : 'no'}`);

  const backupsDir = resolve(process.cwd(), 'backups'); if (!existsSync(backupsDir)) mkdirSync(backupsDir);
  const stamp = new Date().toISOString().slice(0, 10);
  const backupPath = resolve(backupsDir, `giftun-islands-guide-${mode}-${stamp}.json`);
  writeFileSync(backupPath, JSON.stringify({ mode, at: new Date().toISOString(), rollback: { publishedBefore: existingPub ?? null, draftBefore: existingDraft ?? null, cityPlacesToGoBefore: city?.placesToGo ?? null }, payload: doc }, null, 2));
  console.log(`  rollback + payload written: ${backupPath}`);
  if (mode === 'dry-run') { console.log('\nDry-run complete. No writes.'); return; }

  if (mode === 'commit') {
    await client.createOrReplace(doc as never);
    console.log(`\nDRAFT written: ${DRAFT_ID} — review in Studio; nothing is public. Publish with --publish after approval.`);
    return;
  }
  // publish
  let tx = client.transaction().createOrReplace(doc as never);
  if (existingDraft) tx = tx.delete(DRAFT_ID);
  const already = (city?.placesToGo ?? []).some((r: { _ref: string }) => r._ref === DOC_ID);
  if (!already) tx = tx.patch(CITY_ID, (p) => p.setIfMissing({ placesToGo: [] }).append('placesToGo', [{ _key: 'auto-giftun-islands', _ref: DOC_ID, _type: 'reference' }]));
  await tx.commit();
  console.log(`\nPUBLISHED ${DOC_ID}; draft ${existingDraft ? 'deleted' : 'absent'}; city.placesToGo ${already ? 'already had' : 'appended'} the reference.`);
  console.log('Next: add redirect row /egypt-travel-guide/hurghada/while-you-are-there/places-to-go/giftun-islands → /guide/hurghada/giftun-islands, regenerate, live-verify ×3 locales.');
})().catch((e) => { console.error(e); process.exit(1); });
