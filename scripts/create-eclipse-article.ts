/**
 * Create the trilingual (EN/ES/JA) blog feature "The 2027 Total Solar Eclipse"
 * from the owner-supplied markdown in ~/Documents/new blogs, following the
 * site's native article pattern: three `article` docs (one per language, each
 * with its own localized slug) linked by one `translation.metadata` doc, plus a
 * house `author` byline. Converts each markdown body to Portable Text, wiring
 * accurate internal links to internationalized targets (city guides + the Siwa
 * adventure guide). Publishes directly (createOrReplace) and writes a restore
 * backup.
 *
 *   npx tsx scripts/create-eclipse-article.ts --dry-run
 *   npx tsx scripts/create-eclipse-article.ts --commit
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();
function die(m: string): never { process.stderr.write(`error: ${m}\n`); process.exit(2); }
const commit = process.argv.includes('--commit');
if (!commit && !process.argv.includes('--dry-run')) die('pass --dry-run or --commit');

const SRC = {
  en: '/Users/islamhussein/Documents/new blogs/en/total-solar-eclipse-egypt-2027 (1).md',
  es: '/Users/islamhussein/Documents/new blogs/es/total-solar-eclipse-egypt-2027_es_2026-07.md',
  ja: '/Users/islamhussein/Documents/new blogs/ja/total-solar-eclipse-egypt-2027_ja_2026-07.md',
} as const;
type Lang = keyof typeof SRC;
const LANGS: Lang[] = ['en', 'es', 'ja'];

function getClient(): SanityClient {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (dataset !== 'production') die('production only');
  const token = process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
  if (!projectId || !token) die('missing projectId/token');
  return createClient({ projectId, dataset, apiVersion: '2024-12-01', useCdn: false, token, perspective: 'raw' });
}

// ── unique keys ──────────────────────────────────────────────────────────
let kc = 0;
const key = (p: string) => `${p}${(kc++).toString(36)}`;

// ── config ───────────────────────────────────────────────────────────────
const SLUGS: Record<Lang, string> = {
  en: 'total-solar-eclipse-egypt-2027',
  es: 'eclipse-solar-total-egipto-2027',
  ja: 'kaiki-nisshoku-rukusoru-2027',
};
const HERO_ASSET = 'image-0f24d97dccc38badb5798d997665ebef5fe80ea4-2000x1078-jpg';
const HERO: Record<Lang, { alt: string; caption: string }> = {
  en: {
    alt: 'Luxor Temple floodlit gold against a black night sky, its pylon and colonnade rising beside the minaret of the Abu al-Haggag mosque.',
    caption: 'Night over Luxor Temple — the darkness the 2027 eclipse will bring to Upper Egypt at midday.',
  },
  es: {
    alt: 'El templo de Luxor iluminado en dorado contra un cielo nocturno negro, con su pilono y su columnata junto al minarete de la mezquita de Abu al-Haggag.',
    caption: 'La noche sobre el templo de Luxor: la oscuridad que el eclipse de 2027 traerá al Alto Egipto al mediodía.',
  },
  ja: {
    alt: '夜の黒い空を背に金色にライトアップされたルクソール神殿。塔門と列柱、そしてアブー・アル＝ハッガーグ・モスクの尖塔が並ぶ。',
    caption: 'ルクソール神殿の夜——2027年の日食が真昼の上エジプトにもたらす闇。',
  },
};
const AUTHOR_ID = 'author.travel2egypt-editorial';
const AUTHOR_BIO: Record<Lang, string> = {
  en: "Travel2Egypt's editorial team writes the journal — practical, first-hand guidance to travelling in Egypt, drawn from more than two decades arranging journeys along the Nile and across the deserts.",
  es: 'El equipo editorial de Travel2Egypt escribe el diario: orientación práctica y de primera mano para viajar por Egipto, fruto de más de dos décadas organizando viajes por el Nilo y los desiertos.',
  ja: 'Travel2Egyptの編集チームがこのジャーナルを綴っています。ナイル川と砂漠をめぐる旅を二十年以上にわたって手がけてきた経験にもとづく、エジプト旅行の実践的で確かな案内です。',
};
const AUTHOR_ROLE: Record<Lang, string> = { en: 'Editorial Team', es: 'Equipo editorial', ja: '編集チーム' };

const CATEGORY_REF = 'category-destination-depth';
const LUXOR_CITY = 'wp-page-58877';
const CAIRO_CITY = 'wp-page-83284';
const ASWAN_CITY = 'wp-page-58758';
const ADVENTURE_GUIDE = 'wp-page-112945'; // guideArticle: Adventure Activities in Siwa Oasis

// Internal-link anchors, applied to the FIRST matching normal block, in order.
// Each target is an internationalized doc → one ref resolves per-locale.
const LINKS: Record<Lang, Array<{ anchor: string; ref: string }>> = {
  en: [
    { anchor: 'Luxor', ref: LUXOR_CITY },
    { anchor: 'adventure travel guide', ref: ADVENTURE_GUIDE },
    { anchor: 'Cairo', ref: CAIRO_CITY },
    { anchor: 'Aswan', ref: ASWAN_CITY },
  ],
  es: [
    { anchor: 'Luxor', ref: LUXOR_CITY },
    { anchor: 'guía de viaje de aventura', ref: ADVENTURE_GUIDE },
    { anchor: 'El Cairo', ref: CAIRO_CITY },
    { anchor: 'Asuán', ref: ASWAN_CITY },
  ],
  ja: [
    { anchor: 'ルクソール', ref: LUXOR_CITY },
    { anchor: 'アドベンチャー・トラベルのガイド', ref: ADVENTURE_GUIDE },
    { anchor: 'カイロ', ref: CAIRO_CITY },
    { anchor: 'アスワン', ref: ASWAN_CITY },
  ],
};

// Link-placeholder markers to strip from prose (targetless ones just vanish).
const MARKER_RE = /\s*[\[［][^\]］]*(?:link|enlace|リンク)[^\]］]*[\]］]/gi;

// ── markdown → structured lines ────────────────────────────────────────────
function bodyContent(raw: string): string {
  const noFront = raw.replace(/^﻿?---\n[\s\S]*?\n---\n/, '');
  const cut = noFront.indexOf('\n---');           // end of the Meta title/desc preamble
  return cut === -1 ? noFront : noFront.slice(cut + 4);
}
const JA_GLOSS = 'The Sun Will Go Out Over Thebes';
function isSeparator(l: string): boolean {
  return l === '---' || /^[·・]\s*[·・]\s*[·・]$/.test(l) || /^—.*—$/.test(l)
    || l === JA_GLOSS || l.startsWith('最終更新');
}

interface Span { _key: string; _type: 'span'; text: string; marks: string[] }
interface MarkDef { _key: string; _type: 'internalLink'; reference: { _ref: string; _type: 'reference' } }
interface Block { _key: string; _type: 'block'; style: string; markDefs: MarkDef[]; children: Span[] }

/** Inline **strong** / *em* → spans. */
function inline(text: string): Span[] {
  const out: Span[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ _key: key('s'), _type: 'span', text: text.slice(last, m.index), marks: [] });
    out.push({ _key: key('s'), _type: 'span', text: m[1] ?? m[2], marks: [m[1] != null ? 'strong' : 'em'] });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ _key: key('s'), _type: 'span', text: text.slice(last), marks: [] });
  return out.length ? out : [{ _key: key('s'), _type: 'span', text, marks: [] }];
}

function parseBody(raw: string): Block[] {
  const blocks: Block[] = [];
  for (let line of bodyContent(raw).split('\n')) {
    line = line.replace(/\s+$/, '').replace(/^\s+/, '');
    if (!line || isSeparator(line)) continue;

    // heading: markdown #.. or whole-line bold (optionally ■/●); FAQ questions end in ?/？ → h3
    const md = line.match(/^#{1,4}\s+(.+)$/);
    const bold = line.match(/^\*\*\s*(?:[■●]\s*)?(.+?)\s*\*\*$/);
    if (md || bold) {
      const txt = (md ? md[1] : bold![1]).trim();
      const isFaqQ = /[?？]$/.test(txt);
      blocks.push({ _key: key('b'), _type: 'block', style: isFaqQ ? 'h3' : 'h2', markDefs: [], children: [{ _key: key('s'), _type: 'span', text: txt, marks: [] }] });
      continue;
    }
    const clean = line.replace(MARKER_RE, '').replace(/\s{2,}/g, ' ').trim();
    if (!clean) continue;
    blocks.push({ _key: key('b'), _type: 'block', style: 'normal', markDefs: [], children: inline(clean) });
  }
  return blocks;
}

/** Attach an internalLink to the first `normal` block containing `anchor` (once). */
function injectLink(blocks: Block[], anchor: string, ref: string): boolean {
  for (const b of blocks) {
    if (b.style !== 'normal') continue;
    const idx = b.children.findIndex((s) => s.marks.length === 0 && s.text.includes(anchor));
    if (idx === -1) continue;
    const s = b.children[idx];
    const at = s.text.indexOf(anchor);
    const before = s.text.slice(0, at);
    const after = s.text.slice(at + anchor.length);
    const md: MarkDef = { _key: key('m'), _type: 'internalLink', reference: { _ref: ref, _type: 'reference' } };
    const mid: Span = { _key: key('s'), _type: 'span', text: anchor, marks: [md._key] };
    const repl: Span[] = [];
    if (before) repl.push({ _key: key('s'), _type: 'span', text: before, marks: [] });
    repl.push(mid);
    if (after) repl.push({ _key: key('s'), _type: 'span', text: after, marks: [] });
    b.children.splice(idx, 1, ...repl);
    b.markDefs.push(md);
    return true;
  }
  return false;
}

function frontmatter(raw: string): Record<string, string> {
  const m = raw.match(/^﻿?---\n([\s\S]*?)\n---\n/);
  const out: Record<string, string> = {};
  if (m) for (const l of m[1].split('\n')) {
    const kv = l.match(/^(\w+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
  }
  return out;
}

// ── build docs ─────────────────────────────────────────────────────────────
const PUBLISHED_AT = '2026-07-19T09:00:00Z';

function buildArticle(lang: Lang) {
  const raw = readFileSync(SRC[lang], 'utf8');
  const fm = frontmatter(raw);
  const body = parseBody(raw);
  const linked: string[] = [], missed: string[] = [];
  for (const { anchor, ref } of LINKS[lang]) (injectLink(body, anchor, ref) ? linked : missed).push(anchor);
  return {
    doc: {
      _id: `article.total-solar-eclipse-egypt-2027-${lang}`,
      _type: 'article',
      language: lang,
      title: fm.title,
      slug: { _type: 'slug', current: SLUGS[lang] },
      deck: fm.description,
      category: { _ref: CATEGORY_REF, _type: 'reference' },
      author: { _ref: AUTHOR_ID, _type: 'reference' },
      publishedAt: PUBLISHED_AT,
      featured: false,
      body,
      heroImage: {
        _type: 'image',
        asset: { _ref: HERO_ASSET, _type: 'reference' },
        alt: HERO[lang].alt,
        caption: HERO[lang].caption,
      },
      relatedCities: [{ _key: key('rc'), _ref: LUXOR_CITY, _type: 'reference' }],
      seo: { metaTitle: fm.title, metaDescription: fm.description },
    },
    stats: { blocks: body.length, headings: body.filter((b) => b.style !== 'normal').length, linked, missed, title: fm.title, slug: SLUGS[lang] },
  };
}

const authorDoc = {
  _id: AUTHOR_ID,
  _type: 'author',
  name: 'Travel2Egypt Editorial',
  slug: { _type: 'slug', current: 'travel2egypt-editorial' },
  role: LANGS.map((l) => ({ _key: l, _type: 'internationalizedArrayStringValue', value: AUTHOR_ROLE[l] })),
  bio: LANGS.map((l) => ({
    _key: l, _type: 'object',
    value: [{ _key: key('b'), _type: 'block', style: 'normal', markDefs: [], children: [{ _key: key('s'), _type: 'span', text: AUTHOR_BIO[l], marks: [] }] }],
  })),
  yearsInOperation: 23,
};

const built = LANGS.map(buildArticle);
const tmeta = {
  _id: 'tmeta.total-solar-eclipse-egypt-2027',
  _type: 'translation.metadata',
  schemaTypes: ['article'],
  translations: LANGS.map((l, i) => ({
    _key: l, _type: 'internationalizedArrayReferenceValue',
    value: { _ref: built[i].doc._id, _type: 'reference' },
  })),
};

console.log(`\n=== create eclipse article ===  mode: ${commit ? 'COMMIT' : 'dry-run'}`);
for (let i = 0; i < LANGS.length; i++) {
  const s = built[i].stats;
  console.log(`\n[${LANGS[i]}] "${s.title}"  /blog/${s.slug}`);
  console.log(`   blocks: ${s.blocks} (headings ${s.headings}) | links wired: ${s.linked.join(', ') || 'none'}${s.missed.length ? ` | ANCHOR NOT FOUND: ${s.missed.join(', ')}` : ''}`);
}

const allDocs = [authorDoc, ...built.map((b) => b.doc), tmeta];
writeFileSync(resolve(process.cwd(), 'migration/eclipse-article-2027-backup.json'),
  JSON.stringify({ createdAt: PUBLISHED_AT, docs: allDocs }, null, 2), 'utf8');

if (!commit) { console.log(`\nDry-run complete. ${allDocs.length} docs prepared (author + 3 articles + tmeta). Backup written.`); process.exit(0); }

(async () => {
  const client = getClient();
  let tx = client.transaction();
  for (const d of allDocs) tx = tx.createOrReplace(d as any);
  await tx.commit({ visibility: 'async' });
  console.log(`\nPublished ${allDocs.length} docs: author + ${built.length} articles + translation.metadata.`);
  for (const b of built) console.log(`   ${b.doc._id}  →  /blog/${b.stats.slug}`);
})().catch((e) => { console.error(e); process.exit(1); });
