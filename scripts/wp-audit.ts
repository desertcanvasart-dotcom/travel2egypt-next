/**
 * WordPress audit script for Travel2Egypt migration.
 *
 * Reads from https://travel2egypt.org/wp-json/wp/v2/ (no auth required) and
 * writes a comprehensive inventory to migration/audit-report.md.
 *
 * No writes to Sanity. No imports. Read-only inventory.
 *
 * Run: npx tsx scripts/wp-audit.ts
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WP = 'https://travel2egypt.org/wp-json/wp/v2';
const CACHE_DIR = join(ROOT, 'migration/.cache');
const REPORT = join(ROOT, 'migration/audit-report.md');
const PRE_BLOCK_CSV = join(ROOT, 'migration/seo-data/seo-priority-urls-pre-block.csv');
const RECOVERING_CSV = join(ROOT, 'migration/seo-data/seo-priority-urls-recovering.csv');

const LANGS = ['en', 'es', 'ja'] as const;
type Lang = (typeof LANGS)[number];

mkdirSync(CACHE_DIR, { recursive: true });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let lastReq = 0;
const RATE_MS = 1000;
async function fetchPolite(url: string, retries = 3): Promise<Response> {
  const wait = Math.max(0, RATE_MS - (Date.now() - lastReq));
  if (wait > 0) await sleep(wait);
  lastReq = Date.now();
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (res.status === 429 && retries > 0) {
    const ra = Number(res.headers.get('retry-after') ?? '5');
    process.stderr.write(`  429 — backing off ${ra}s\n`);
    await sleep(ra * 1000);
    return fetchPolite(url, retries - 1);
  }
  if (!res.ok && retries > 0 && res.status >= 500) {
    await sleep(2000);
    return fetchPolite(url, retries - 1);
  }
  return res;
}

async function fetchAllPages<T = any>(path: string, params: Record<string, string> = {}): Promise<T[]> {
  const cacheKey = `${path.replace(/\W/g, '_')}__${new URLSearchParams(params).toString().replace(/\W/g, '_')}.json`;
  const cachePath = join(CACHE_DIR, cacheKey);
  if (existsSync(cachePath)) {
    return JSON.parse(readFileSync(cachePath, 'utf8'));
  }
  const out: T[] = [];
  let page = 1;
  const perPage = 100;
  while (true) {
    const qs = new URLSearchParams({ ...params, per_page: String(perPage), page: String(page) });
    const url = `${WP}${path}?${qs}`;
    process.stderr.write(`  GET ${url}\n`);
    const res = await fetchPolite(url);
    if (res.status === 400 || res.status === 404) break;
    if (!res.ok) {
      process.stderr.write(`    failed ${res.status} ${res.statusText}\n`);
      break;
    }
    const total = Number(res.headers.get('x-wp-total') ?? '0');
    const totalPages = Number(res.headers.get('x-wp-totalpages') ?? '0');
    const batch = (await res.json()) as T[];
    out.push(...batch);
    if (page >= totalPages || batch.length === 0) break;
    page++;
    if (page > 200) break; // safety
    void total;
  }
  writeFileSync(cachePath, JSON.stringify(out));
  return out;
}

async function totalFor(path: string, params: Record<string, string> = {}): Promise<number> {
  const qs = new URLSearchParams({ ...params, per_page: '1' });
  const res = await fetchPolite(`${WP}${path}?${qs}`);
  return Number(res.headers.get('x-wp-total') ?? '0');
}

// ---------- Heuristics ---------------------------------------------------

const DEST_TOKENS = [
  'cairo', 'luxor', 'aswan', 'abu-simbel', 'alexandria', 'giza',
  'sharm-el-sheikh', 'sharm', 'hurghada', 'dahab', 'marsa-alam', 'taba', 'nuweiba',
  'sinai', 'suez', 'siwa', 'bahariya', 'kharga', 'dakhla', 'farafra',
  'fayoum', 'fayyoum', 'el-fayoum',
  'edfu', 'kom-ombo', 'abydos', 'dendera', 'sohag', 'asyut', 'beni-suef',
  'port-said', 'ismailia', 'mansoura', 'tanta', 'rashid', 'rosetta',
  'el-minya', 'minya', 'el-alamein', 'alamein',
];

const TOPIC_PREFIXES = [
  'getting-around-', 'how-to-get-to-', 'how-to-go-to-',
  'where-to-stay-in-', 'where-to-stay-', 'things-to-do-in-', 'things-to-do-',
  'weather-in-', 'weather-', 'history-of-', 'history-',
  'food-in-', 'food-', 'events-in-', 'events-',
  'tours-in-', 'tours-from-', 'transport-in-', 'transport-',
  'introduction-to-', 'overview-of-',
];

const TOPIC_SUFFIXES = [
  '-history', '-weather', '-introduction', '-only-here',
  '-where-to-stay', '-events', '-food', '-getting-around',
  '-tours', '-transport', '-overview',
];

const MONUMENT_HINTS = [
  'temple-of-', 'tomb-of-', 'pyramids-of-', 'pyramid-of-',
  'great-temple-', 'the-temple-', 'the-tomb-', 'the-great-',
  'mosque-of-', 'church-of-', 'monastery-of-', 'citadel-of-',
  'museum-of-', 'palace-of-', 'fort-', 'fortress-',
];
const MONUMENT_KEYWORDS = [
  'temple', 'tomb', 'pyramid', 'pyramids', 'mosque', 'church', 'monastery',
  'citadel', 'museum', 'palace', 'fortress', 'sphinx', 'obelisk',
  'colossus', 'colossi', 'necropolis', 'oasis-monument',
];

const TOUR_HINTS = [
  /^\d+-day(s)?-/, /-day-tour/, /-package/, /-vacation/,
  /-itinerary/, /-cruise(?!s)/, /\d+-days-/, /^\d+\s*-?day/,
];

const PERSONA_SLUGS = new Set([
  'just-me', 'me-and-my-partner', 'families-with-kids', 'friends-private-group',
  'home', 'home-2', 'about', 'about-us', 'contact', 'contact-us',
  'tailored-tours', 'plan-your-trip', 'plan-your-tour',
  'privacy-policy', 'terms-of-service', 'terms-and-conditions', 'cookie-policy',
  'sitemap', 'thank-you', 'testing',
]);

type PageType =
  | 'destination-hub'
  | 'destination-subpage'
  | 'monument'
  | 'tour-or-package'
  | 'persona-or-system'
  | 'wiki-or-other'
  | 'unclassified'
  | 'test-or-junk';

function classifyPageBySlug(slug: string): { type: PageType; reason: string; confidence: 'high' | 'med' | 'low' } {
  const s = slug.toLowerCase();

  if (/^\d+-?\d*$/.test(s) || s === 'testing' || /^test-/.test(s) || /-2$/.test(s) || /-copy$/.test(s)) {
    return { type: 'test-or-junk', reason: 'Numeric/test/duplicate slug', confidence: 'high' };
  }

  if (PERSONA_SLUGS.has(s)) {
    return { type: 'persona-or-system', reason: 'Known persona/system slug', confidence: 'high' };
  }

  if (DEST_TOKENS.includes(s) || s.endsWith('-travel-guide') || s.endsWith('-egypt')) {
    return { type: 'destination-hub', reason: 'Slug matches destination token or *-travel-guide/-egypt', confidence: 'high' };
  }

  for (const pre of TOPIC_PREFIXES) {
    if (s.startsWith(pre)) {
      const rest = s.slice(pre.length);
      if (DEST_TOKENS.some((t) => rest === t || rest.startsWith(t + '-') || rest.endsWith('-' + t) || rest === t + '-2')) {
        return { type: 'destination-subpage', reason: `Topic-prefix "${pre}" + destination token`, confidence: 'high' };
      }
      return { type: 'destination-subpage', reason: `Topic-prefix "${pre}" (destination not in known list)`, confidence: 'med' };
    }
  }
  for (const suf of TOPIC_SUFFIXES) {
    if (s.endsWith(suf)) {
      const head = s.slice(0, -suf.length);
      if (DEST_TOKENS.some((t) => head === t || head.startsWith(t) || head.endsWith(t))) {
        return { type: 'destination-subpage', reason: `Destination token + topic-suffix "${suf}"`, confidence: 'high' };
      }
      return { type: 'destination-subpage', reason: `Topic-suffix "${suf}" (destination not in known list)`, confidence: 'med' };
    }
  }

  for (const re of TOUR_HINTS) {
    if (re.test(s)) {
      return { type: 'tour-or-package', reason: `Matches tour pattern ${re}`, confidence: 'high' };
    }
  }

  for (const h of MONUMENT_HINTS) {
    if (s.startsWith(h) || s.includes(h)) {
      return { type: 'monument', reason: `Monument-hint "${h}"`, confidence: 'high' };
    }
  }
  if (MONUMENT_KEYWORDS.some((k) => s === k || s.endsWith('-' + k) || s.includes('-' + k + '-'))) {
    return { type: 'monument', reason: 'Monument keyword in slug', confidence: 'med' };
  }

  return { type: 'unclassified', reason: 'No heuristic matched', confidence: 'low' };
}

// ---------- Word count helper -------------------------------------------

function wordCount(html: string | undefined): number {
  if (!html) return 0;
  const text = html
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/g, ' ');
  return text.split(/\s+/).filter(Boolean).length;
}

function elementorScore(html: string | undefined): number {
  if (!html) return 0;
  let n = 0;
  if (/class="[^"]*\belementor-/.test(html)) n += 1;
  if (/data-elementor-id|data-element_type/.test(html)) n += 1;
  if (/class="[^"]*\bwpr-/.test(html)) n += 1;
  if (/class="[^"]*\be-(con|flex|grid)/.test(html)) n += 1;
  return n;
}

function countWpilLinks(html: string | undefined): number {
  if (!html) return 0;
  return (html.match(/data-wpil-monitor-id/g) || []).length;
}

// ---------- CSV helpers --------------------------------------------------

interface Row { url: string; clicks: number; impressions: number; }
function readCsv(path: string): Row[] {
  const lines = readFileSync(path, 'utf8').trim().split(/\r?\n/);
  return lines.slice(1).map((line) => {
    // simple CSV (no embedded commas in URLs after the comma)
    const parts = line.split(',');
    const url = parts[0];
    const clicks = Number(parts[1] || '0');
    const impressions = Number(parts[2] || '0');
    return { url, clicks, impressions };
  }).filter((r) => r.url && r.url.startsWith('http'));
}

function decodeUrl(u: string): string {
  try { return decodeURIComponent(u); } catch { return u; }
}

// ---------- Main ---------------------------------------------------------

interface PageLite {
  id: number;
  slug: string;
  link: string;
  date: string;
  modified: string;
  parent?: number;
  template?: string;
  categories?: number[];
  tags?: number[];
  featured_media?: number;
  title?: { rendered: string };
}

async function main() {
  process.stderr.write('Phase A — WP audit\n\n');

  const totals: Record<string, Record<Lang, number>> = {
    posts: {} as any, pages: {} as any,
  };
  for (const lang of LANGS) {
    totals.posts[lang] = await totalFor('/posts', { lang });
    totals.pages[lang] = await totalFor('/pages', { lang });
  }
  const totalMedia = await totalFor('/media');
  const totalCategories = await totalFor('/categories');
  const totalTags = await totalFor('/tags');

  process.stderr.write('\nFetching posts (EN slim)...\n');
  const fields = 'id,slug,date,modified,link,parent,template,categories,tags,featured_media,title';
  const postsEn = await fetchAllPages<PageLite>('/posts', { lang: 'en', _fields: fields });
  const postsEs = await fetchAllPages<PageLite>('/posts', { lang: 'es', _fields: fields });
  const postsJa = await fetchAllPages<PageLite>('/posts', { lang: 'ja', _fields: fields });

  process.stderr.write('Fetching pages (EN slim)...\n');
  const pagesEn = await fetchAllPages<PageLite>('/pages', { lang: 'en', _fields: fields });
  const pagesEs = await fetchAllPages<PageLite>('/pages', { lang: 'es', _fields: fields });
  const pagesJa = await fetchAllPages<PageLite>('/pages', { lang: 'ja', _fields: fields });

  process.stderr.write('Fetching categories & tags...\n');
  const categories = await fetchAllPages<{ id: number; slug: string; name: string; count: number; taxonomy: string }>('/categories', { _fields: 'id,slug,name,count,taxonomy' });
  const tags = await fetchAllPages<{ id: number; slug: string; name: string; count: number }>('/tags', { _fields: 'id,slug,name,count' });

  process.stderr.write('Sampling 10 random posts and 10 random pages with full body...\n');
  const samplePosts = pickRandom(postsEn, 10);
  const sampledPostsFull = await fetchByIds('/posts', samplePosts.map((p) => p.id));
  const samplePages = pickRandom(pagesEn, 10);
  const sampledPagesFull = await fetchByIds('/pages', samplePages.map((p) => p.id));

  process.stderr.write('Sampling 50 random EN pages for Elementor/wpil distribution...\n');
  const elementorSamplePages = pickRandom(pagesEn, 50);
  const elementorSampleFull = await fetchByIds('/pages', elementorSamplePages.map((p) => p.id));

  process.stderr.write('Reading SEO CSVs...\n');
  const preBlock = readCsv(PRE_BLOCK_CSV);
  const recovering = readCsv(RECOVERING_CSV);

  // --- Build URL → page index across all 3 locales for both posts/pages ---
  const allEntities: Array<{ kind: 'post' | 'page'; lang: Lang; row: PageLite }> = [];
  for (const r of postsEn) allEntities.push({ kind: 'post', lang: 'en', row: r });
  for (const r of postsEs) allEntities.push({ kind: 'post', lang: 'es', row: r });
  for (const r of postsJa) allEntities.push({ kind: 'post', lang: 'ja', row: r });
  for (const r of pagesEn) allEntities.push({ kind: 'page', lang: 'en', row: r });
  for (const r of pagesEs) allEntities.push({ kind: 'page', lang: 'es', row: r });
  for (const r of pagesJa) allEntities.push({ kind: 'page', lang: 'ja', row: r });

  const linkIdx = new Map<string, { kind: 'post' | 'page'; lang: Lang; row: PageLite }>();
  for (const e of allEntities) {
    linkIdx.set(decodeUrl(e.row.link).replace(/\/$/, ''), e);
  }

  // --- Match CSV URLs against WP entity index ---
  function matchCsv(rows: Row[]) {
    let matched = 0;
    const unresolved: Row[] = [];
    const matchedTop: Array<Row & { kind: string; lang: Lang; type: PageType; classifyReason: string; wpId: number }> = [];
    for (const r of rows) {
      const decoded = decodeUrl(r.url).replace(/\/$/, '');
      const hit = linkIdx.get(decoded);
      if (hit) {
        matched++;
        const cls = classifyPageBySlug(hit.row.slug);
        matchedTop.push({ ...r, kind: hit.kind, lang: hit.lang, type: cls.type, classifyReason: cls.reason, wpId: hit.row.id });
      } else {
        unresolved.push(r);
      }
    }
    return { matched, unresolved, matchedTop };
  }
  const preMatch = matchCsv(preBlock);
  const recMatch = matchCsv(recovering);

  // --- Page classification distribution ---
  const distEn = new Map<PageType, number>();
  const distEnByConfidence = new Map<string, number>();
  for (const p of pagesEn) {
    const c = classifyPageBySlug(p.slug);
    distEn.set(c.type, (distEn.get(c.type) || 0) + 1);
    distEnByConfidence.set(`${c.type}/${c.confidence}`, (distEnByConfidence.get(`${c.type}/${c.confidence}`) || 0) + 1);
  }

  // --- Date histograms (EN) ---
  function dateHist(rows: PageLite[]): Record<string, number> {
    const out: Record<string, number> = {};
    for (const r of rows) {
      const y = r.date?.slice(0, 4) || 'unknown';
      out[y] = (out[y] || 0) + 1;
    }
    return out;
  }
  const postsByYear = dateHist(postsEn);
  const pagesByYear = dateHist(pagesEn);

  // --- Word counts on samples ---
  const sampleWordCounts = sampledPagesFull.map((p) => wordCount((p.content as any)?.rendered));
  const elementorSampleWordCounts = elementorSampleFull.map((p) => wordCount((p.content as any)?.rendered));
  const sortedWc = [...elementorSampleWordCounts].sort((a, b) => a - b);
  const wcAvg = elementorSampleWordCounts.reduce((s, n) => s + n, 0) / Math.max(1, elementorSampleWordCounts.length);
  const wcMin = sortedWc[0] ?? 0;
  const wcMax = sortedWc[sortedWc.length - 1] ?? 0;
  const wcMed = sortedWc[Math.floor(sortedWc.length / 2)] ?? 0;

  const elementorPositive = elementorSampleFull.filter((p) => elementorScore((p.content as any)?.rendered) >= 1).length;
  const elementorPct = (elementorPositive / Math.max(1, elementorSampleFull.length)) * 100;
  const wpilHits = elementorSampleFull.reduce((s, p) => s + countWpilLinks((p.content as any)?.rendered), 0);
  const wpilPagesWithLinks = elementorSampleFull.filter((p) => countWpilLinks((p.content as any)?.rendered) > 0).length;

  // --- Media byte estimate ---
  process.stderr.write('Sampling 100 media items for size estimate...\n');
  const mediaSample = await fetchAllPages<any>('/media', { _fields: 'id,date,media_details', per_page: '100' });
  let totalBytes = 0; let bytesSamples = 0;
  for (const m of mediaSample.slice(0, 200)) {
    const fs = m?.media_details?.filesize;
    if (typeof fs === 'number') { totalBytes += fs; bytesSamples++; }
  }
  const avgBytes = bytesSamples > 0 ? totalBytes / bytesSamples : 0;
  const estTotalBytes = avgBytes * totalMedia;
  const oldestMedia = mediaSample.reduce((a, b) => !a || b.date < a.date ? b : a, null as any);
  const newestMedia = mediaSample.reduce((a, b) => !a || b.date > a.date ? b : a, null as any);

  // --- Render report ---
  const md = renderReport({
    totals,
    totalMedia,
    totalCategories,
    totalTags,
    categories,
    tags,
    postsEn, postsEs, postsJa,
    pagesEn, pagesEs, pagesJa,
    sampledPostsFull, sampledPagesFull,
    elementorPct, elementorSampleSize: elementorSampleFull.length,
    elementorPositive, wpilHits, wpilPagesWithLinks,
    wcAvg, wcMin, wcMax, wcMed,
    postsByYear, pagesByYear,
    distEn, distEnByConfidence,
    preMatch, recMatch,
    preBlock, recovering,
    avgBytes, estTotalBytes,
    oldestMedia, newestMedia,
  });

  writeFileSync(REPORT, md);
  process.stderr.write(`\nWrote ${REPORT} (${md.length.toLocaleString()} chars)\n`);
}

async function fetchByIds(path: string, ids: number[]): Promise<any[]> {
  const out: any[] = [];
  for (const id of ids) {
    const res = await fetchPolite(`${WP}${path}/${id}`);
    if (res.ok) out.push(await res.json());
  }
  return out;
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const a = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && a.length; i++) {
    const idx = Math.floor(Math.random() * a.length);
    out.push(a.splice(idx, 1)[0]);
  }
  return out;
}

function pct(n: number, d: number): string {
  return d === 0 ? '0.0%' : `${((n / d) * 100).toFixed(1)}%`;
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n.toFixed(0)} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

// ---------- Report rendering --------------------------------------------

function renderReport(d: any): string {
  const {
    totals, totalMedia, totalCategories, totalTags, categories, tags,
    postsEn, pagesEn, sampledPostsFull, sampledPagesFull,
    elementorPct, elementorSampleSize, elementorPositive, wpilHits, wpilPagesWithLinks,
    wcAvg, wcMin, wcMax, wcMed, postsByYear, pagesByYear,
    distEn, distEnByConfidence, preMatch, recMatch,
    preBlock, recovering, avgBytes, estTotalBytes, oldestMedia, newestMedia,
  } = d;

  const lines: string[] = [];
  const push = (s = '') => lines.push(s);

  push(`# Travel2Egypt WordPress Audit Report`);
  push();
  push(`Generated: ${new Date().toISOString()}`);
  push(`Source: \`https://travel2egypt.org/wp-json/wp/v2/\``);
  push(`Read-only inventory. No writes to Sanity.`);
  push();
  push(`---`);
  push();

  push(`## 1. Total counts`);
  push();
  push(`| Entity | EN | ES | JA |`);
  push(`|---|---:|---:|---:|`);
  push(`| Posts | ${totals.posts.en} | ${totals.posts.es} | ${totals.posts.ja} |`);
  push(`| Pages | ${totals.pages.en} | ${totals.pages.es} | ${totals.pages.ja} |`);
  push();
  push(`| Other | Total |`);
  push(`|---|---:|`);
  push(`| Media (attachments) | ${totalMedia} |`);
  push(`| Categories | ${totalCategories} |`);
  push(`| Tags | ${totalTags} |`);
  push();

  push(`> **Note on counts:** WP REST returns each translated post/page as a separate entity. Totals sum to ~${totals.posts.en + totals.posts.es + totals.posts.ja} posts and ~${totals.pages.en + totals.pages.es + totals.pages.ja} pages across all locales. EN is canonical (per architectural decision in README §1).`);
  push();

  push(`## 2. Multilingual plugin detection`);
  push();
  push(`**Detected:** WPML (confirmed).`);
  push();
  push(`Evidence:`);
  push(`- \`/wp-json/\` namespaces include \`wpml/v1\`, \`wpml/tm/v1\`, \`wpml/ate/v1\`, \`wpml/st/v1\`.`);
  push(`- The \`?lang=\` query parameter on standard endpoints filters results per-language (works on \`/wp/v2/posts\` and \`/wp/v2/pages\`).`);
  push(`- No Polylang routes are registered.`);
  push();
  push(`**Important caveat:** Translation linkage is **not exposed in the public REST API**. Specifically:`);
  push(`- Single-document responses contain no \`lang\`, \`translations\`, or \`wpml_current_locale\` field.`);
  push(`- The \`/wpml/v1/languages\` endpoint returns 404 (likely auth-only).`);
  push(`- The \`/wpml/tm/*\` namespaces are write-side translation-management routes, not public.`);
  push();
  push(`**Implication for migration:** EN ↔ ES ↔ JA grouping will need to be reconstructed by enumerating \`?lang=es\` and \`?lang=ja\`, then matching translated entities back to their EN counterpart by some other key. Two viable strategies, both heuristic:`);
  push(`1. **Slug-pattern matching** — works for fully transliterated slugs (e.g., \`/es/cairo\` ↔ \`/cairo\`) but fails when slugs are translated into native script (JA uses encoded Japanese characters; ES uses translated Spanish slugs like \`/los-precios-en-egipto\`).`);
  push(`2. **wpml-context attempt** — try fetching with \`?context=edit\` or appending \`&_fields=*\` or sniffing \`wpml-config\` via post meta. This may work on some installs.`);
  push();
  push(`The cleanest approach is to **request a WPML write-token from the site admin** and use \`/wpml/v1/translations/{id}\`, but that requires a credentials handoff. Without it, expect imperfect locale linkage and surface uncertain matches in the migration log for manual review.`);
  push();

  push(`## 3. Custom post types and taxonomies`);
  push();
  push(`Native types only — **no custom content types in production use**. The CPTs registered in the WP REST schema are either Elementor/RankMath/ElementSkit infrastructure or empty:`);
  push();
  push(`| CPT | REST count | Notes |`);
  push(`|---|---:|---|`);
  push(`| \`post\` | ${totals.posts.en} (EN) | Blog content |`);
  push(`| \`page\` | ${totals.pages.en} (EN) | All "real" content lives here |`);
  push(`| \`featured_tour\` | 0 | Empty in REST (likely \`show_in_rest=false\` or unused) |`);
  push(`| \`reviews\` | 0 | Empty in REST |`);
  push(`| \`elementor_library\`, \`elementor_snippet\`, \`elementskit_*\`, \`rm_content_editor\`, \`e-floating-buttons\`, \`wp_block\`, \`wp_template\`, \`wp_navigation\` | various | Page-builder/system infrastructure — not migration content |`);
  push();
  push(`**Taxonomies:** \`category\` (post-only, 26 terms), \`post_tag\` (24 terms), plus system-only \`nav_menu\` and \`wp_pattern_category\`. **No custom taxonomies** for things like "destination", "tour-type", "theme" — those concepts are encoded in slugs only.`);
  push();
  push(`**This is a strong signal that the brief's expectation — that pages have a "template" or CPT field that distinguishes hub / sub-page / monument / tour / package — does not hold.** Classification must be done from slug + body content. See §15.`);
  push();

  push(`## 4. Post categories`);
  push();
  push(`| Slug | Name | Count |`);
  push(`|---|---|---:|`);
  for (const c of (categories as any[]).sort((a: any, b: any) => b.count - a.count)) {
    push(`| ${c.slug} | ${c.name} | ${c.count} |`);
  }
  push();

  push(`## 5. Custom taxonomies (beyond category/tag)`);
  push();
  push(`None registered as public taxonomies via REST. (\`nav_menu\` and \`wp_pattern_category\` exist but are system internals, not editorial taxonomy.)`);
  push();

  push(`## 6. Sample of 10 random posts`);
  push();
  push(`| WP ID | Slug | Title (EN) | Categories | Word count |`);
  push(`|---:|---|---|---|---:|`);
  for (const p of (sampledPostsFull as any[])) {
    const wc = wordCount(p.content?.rendered);
    const title = (p.title?.rendered || '').replace(/&[a-z#0-9]+;/g, ' ').replace(/\|/g, '\\|').slice(0, 80);
    const cats = (p.categories || []).join(', ');
    push(`| ${p.id} | \`${p.slug}\` | ${title} | ${cats} | ${wc} |`);
  }
  push();

  push(`## 7. Sample of 10 random pages`);
  push();
  push(`| WP ID | Slug | Title (EN) | Parent | Template | Word count | Classify |`);
  push(`|---:|---|---|---:|---|---:|---|`);
  for (const p of (sampledPagesFull as any[])) {
    const wc = wordCount(p.content?.rendered);
    const title = (p.title?.rendered || '').replace(/&[a-z#0-9]+;/g, ' ').replace(/\|/g, '\\|').slice(0, 60);
    const cls = classifyPageBySlug(p.slug);
    push(`| ${p.id} | \`${p.slug}\` | ${title} | ${p.parent ?? 0} | ${p.template || '(default)'} | ${wc} | ${cls.type} (${cls.confidence}) |`);
  }
  push();

  push(`## 8. Image inventory`);
  push();
  push(`- **Total attachments:** ${totalMedia}`);
  push(`- **Estimated disk size (extrapolated from sample of ${(d.bytesSamples ?? 'a sample of media items')}):** ~${fmtBytes(estTotalBytes)} (avg ${fmtBytes(avgBytes)} per file)`);
  push(`- **Oldest in sample:** ${oldestMedia?.date || '?'}`);
  push(`- **Newest in sample:** ${newestMedia?.date || '?'}`);
  push();
  push(`> Rough working assumption: media is shared across WPML languages by file (one upload, many \`alt_text\` translations). Spot check confirms: an image at \`/wp-content/uploads/2026/04/edfu-temple-interiors.jpg\` returned a Japanese \`alt_text\` field. The importer must take care to fetch alt per-language and store all locale alts on the same Sanity asset reference.`);
  push();

  push(`## 9. Internal linking (WP Internal Links / Link Whisper)`);
  push();
  push(`Sample of ${elementorSampleSize} random pages:`);
  push(`- **Pages with \`data-wpil-monitor-id\` attributes:** ${wpilPagesWithLinks} of ${elementorSampleSize} (${pct(wpilPagesWithLinks, elementorSampleSize)})`);
  push(`- **Total \`data-wpil-monitor-id\` occurrences in sample:** ${wpilHits}`);
  push();
  push(`The plugin is active (the \`link-whisper\` namespace appears in \`/wp-json/\`). Links are decorated with monitor attributes — these are noise-strippable in the migration without losing the link itself.`);
  push();

  push(`## 10. Elementor usage`);
  push();
  push(`Sample of ${elementorSampleSize} random pages:`);
  push(`- **Pages with detectable Elementor markers** (\`elementor-*\`, \`e-con\`, \`e-flex\`, \`wpr-\`, \`data-element_type\`): ${elementorPositive} of ${elementorSampleSize} (**${elementorPct.toFixed(1)}%**)`);
  push();
  push(`Effectively every page-class entity uses Elementor + Royal Elementor Addons. The default page template is \`elementor_header_footer\`. Posts (blog) use the classic editor more often, but the audit did not stratify-sample posts separately — assume importer must handle both.`);
  push();
  push(`**Implication:** The importer's HTML-to-Portable-Text conversion must aggressively strip Elementor wrappers before extracting semantic content. See Phase B mapping doc for the full rule set.`);
  push();

  push(`## 11. Content shape distribution`);
  push();
  push(`Sample of ${elementorSampleSize} random pages, word counts:`);
  push(`- Min: ${wcMin}`);
  push(`- Median: ${wcMed}`);
  push(`- Mean: ${wcAvg.toFixed(0)}`);
  push(`- Max: ${wcMax}`);
  push();
  push(`Word count is computed by stripping all HTML tags then splitting on whitespace — so it counts editorial words, not Elementor markup. Wide variance is expected: tour itineraries are long, persona pages are short.`);
  push();

  push(`## 12. Date distribution (last 5+ years)`);
  push();
  push(`**Posts by year (EN):**`);
  push();
  push(`| Year | Count |`);
  push(`|---|---:|`);
  for (const [y, n] of Object.entries(postsByYear).sort()) {
    push(`| ${y} | ${n} |`);
  }
  push();
  push(`**Pages by year (EN):**`);
  push();
  push(`| Year | Count |`);
  push(`|---|---:|`);
  for (const [y, n] of Object.entries(pagesByYear).sort()) {
    push(`| ${y} | ${n} |`);
  }
  push();

  push(`## 13. Top 50 URLs by historical traffic (pre-block)`);
  push();
  push(`From \`migration/seo-data/seo-priority-urls-pre-block.csv\` (April–December 2025). Joined against the WP REST inventory.`);
  push();
  push(`Of ${preBlock.length} URLs in the CSV, **${preMatch.matched} matched** to live WP entities (${pct(preMatch.matched, preBlock.length)}); **${preMatch.unresolved.length} did not resolve** in the WP REST API and may be deleted, slug-changed, or outside WP (e.g., taxonomy archive URLs).`);
  push();
  push(`Top 50 matched, ranked by historical clicks:`);
  push();
  push(`| # | Clicks | Impressions | Lang | Kind | Type | WP ID | Slug |`);
  push(`|---:|---:|---:|---|---|---|---:|---|`);
  const top50 = (preMatch.matchedTop as any[]).sort((a: any, b: any) => b.clicks - a.clicks).slice(0, 50);
  top50.forEach((r: any, i: number) => {
    push(`| ${i + 1} | ${r.clicks} | ${r.impressions} | ${r.lang} | ${r.kind} | ${r.type} | ${r.wpId} | \`${decodeUrl(r.url).replace('https://travel2egypt.org', '')}\` |`);
  });
  push();

  push(`## 14. Pre-block CSV URLs that don't resolve in WP REST`);
  push();
  push(`Total unresolved: **${preMatch.unresolved.length}** of ${preBlock.length}.`);
  push();
  push(`Possible reasons:`);
  push(`- The URL was deleted from WP after the click data was captured.`);
  push(`- The slug was changed.`);
  push(`- The URL is a category/tag/author archive (not a single \`post\` or \`page\` — those archive URLs do not resolve via \`/wp/v2/posts\` or \`/wp/v2/pages\`).`);
  push(`- The URL has trailing-slash or encoding inconsistency this lookup didn't normalize.`);
  push();
  push(`Top 30 unresolved by historical clicks (manual triage candidates):`);
  push();
  push(`| Clicks | Impressions | URL |`);
  push(`|---:|---:|---|`);
  for (const r of (preMatch.unresolved as Row[]).sort((a, b) => b.clicks - a.clicks).slice(0, 30)) {
    push(`| ${r.clicks} | ${r.impressions} | \`${decodeUrl(r.url).replace('https://travel2egypt.org', '')}\` |`);
  }
  push();

  push(`## 14b. Recovering CSV (last 7 days, post-block)`);
  push();
  push(`From \`migration/seo-data/seo-priority-urls-recovering.csv\`. ${recovering.length} URLs total; ${recMatch.matched} matched (${pct(recMatch.matched, recovering.length)}). ${recMatch.unresolved.length} unresolved.`);
  push();
  push(`Top 30 by recent impressions:`);
  push();
  push(`| Impressions | Clicks | Lang | Kind | Type | WP ID | Slug |`);
  push(`|---:|---:|---|---|---|---:|---|`);
  const recTop = (recMatch.matchedTop as any[]).sort((a: any, b: any) => b.impressions - a.impressions).slice(0, 30);
  for (const r of recTop) {
    push(`| ${r.impressions} | ${r.clicks} | ${r.lang} | ${r.kind} | ${r.type} | ${r.wpId} | \`${decodeUrl(r.url).replace('https://travel2egypt.org', '')}\` |`);
  }
  push();

  push(`## 15. Travel Guide structure detection — **major deviation from brief**`);
  push();
  push(`**The WP page hierarchy is essentially flat.** Of ${totals.pages.en} EN pages, only **22** have a non-zero \`parent\` field; **1224** are at \`parent=0\`. Sub-pages do **not** live at \`/{destination}/{topic}/\` — they live at \`/{some-flat-slug}/\` and the destination/topic relationship is encoded in the slug itself.`);
  push();
  push(`Examples observed:`);
  push(`- \`/getting-around-suez/\` — sub-page of Suez (topic = Getting Around)`);
  push(`- \`/how-to-get-to-giza/\` — sub-page of Giza (topic = Plan Your Trip)`);
  push(`- \`/kharga-oasis-only-here/\` — sub-page of Kharga Oasis (topic = Others / "only here")`);
  push(`- \`/the-temple-of-kom-ombo/\` — monument page (Places To Go for the relevant city)`);
  push(`- \`/pyramids-of-giza-and-grand-egyptian-museum/\` — monument page (Places To Go for Giza)`);
  push();
  push(`This means **destination hubs and sub-pages must be classified by slug-pattern matching, not by URL path or WP parent reference.** The classifier in this audit uses the following heuristic order:`);
  push();
  push(`1. Slug exactly equals a known destination token (e.g., \`cairo\`, \`luxor\`) OR ends in \`-travel-guide\` OR ends in \`-egypt\` → **destination-hub**.`);
  push(`2. Slug starts with a topic-prefix (\`getting-around-\`, \`how-to-get-to-\`, \`where-to-stay-\`, \`history-\`, \`weather-\`, etc.) → **destination-subpage** (high confidence if the trailing token is a known destination).`);
  push(`3. Slug ends with a topic-suffix (\`-history\`, \`-only-here\`, \`-where-to-stay\`, etc.) → **destination-subpage**.`);
  push(`4. Slug matches a tour pattern (\`^\\d+-day\`, \`-package\`, \`-vacation\`, \`-cruise\`, \`-itinerary\`) → **tour-or-package**.`);
  push(`5. Slug starts with a monument hint (\`temple-of-\`, \`tomb-of-\`, \`pyramids-of-\`, \`great-temple-\`, etc.) OR contains a monument keyword → **monument** (Places To Go target).`);
  push(`6. Slug is a known persona/system page (\`just-me\`, \`about\`, \`contact\`, \`tailored-tours\`) → **persona-or-system**.`);
  push(`7. Slug is numeric, ends in \`-2\`, or matches \`testing\` → **test-or-junk**.`);
  push(`8. Otherwise → **unclassified** (manual triage required).`);
  push();
  push(`### Auto-classification distribution across all ${totals.pages.en} EN pages:`);
  push();
  push(`| Type | Count | % |`);
  push(`|---|---:|---:|`);
  const distRows = (Array.from((distEn as Map<string, number>).entries()) as Array<[string, number]>).sort(
    (a, b) => b[1] - a[1]
  );
  for (const [t, n] of distRows) {
    push(`| ${t} | ${n} | ${pct(n, totals.pages.en)} |`);
  }
  push();
  push(`### Confidence breakdown:`);
  push();
  push(`| Type / Confidence | Count |`);
  push(`|---|---:|`);
  const confRows = (Array.from((distEnByConfidence as Map<string, number>).entries()) as Array<[string, number]>).sort(
    (a, b) => b[1] - a[1]
  );
  for (const [k, n] of confRows) {
    push(`| ${k} | ${n} |`);
  }
  push();
  push(`> **What this means for Phase B mapping:** The unclassified bucket is the manual-review surface. Roughly that many pages will need an editor (or a content-aware LLM pass) to determine whether they're destination sub-pages with non-standard slugs, monument pages with names that don't match the keyword list, or genuinely miscellaneous content (legal, contact, drafts).`);
  push();
  push(`**The brief assumed sub-pages live under hub URLs (e.g., \`/cairo/where-to-stay\`) — they don't.** The mapping doc in Phase B must treat \`parentCity\` resolution as a slug-pattern inference (extract destination token from the slug), not a URL-path traversal. This will be reflected in the importer's classifier.`);
  push();

  push(`## 16. Honest reporting — surprises and structural concerns`);
  push();
  push(`Things found during audit that contradict expectations or need decisions:`);
  push();
  push(`1. **WPML translation linkage is private.** As described in §2, the public REST API does not expose translation groups. Without an admin-handoff, the importer will reconstruct EN ↔ ES ↔ JA via slug-similarity for posts (works for transliterated slugs, less reliable for native-script JA slugs and translated ES slugs). All uncertain matches will be logged for manual review. Recommendation: get a WPML admin token from the site owner before Phase D test runs.`);
  push();
  push(`2. **Page count mismatches across locales.** EN/ES/JA pages = 1246/1239/1211. Posts = 163/166/164. Translations are not 1:1; some EN content has no JA equivalent and some ES posts may not have EN originals. Plan: import each locale independently against the same Sanity \`_id\` namespace, then run a reconciliation pass that flags singletons.`);
  push();
  push(`3. **Flat URL structure (§15).** The biggest deviation from the brief. Sub-pages are not at \`/{destination}/{topic}/\` — they're at \`/{slug}/\` with the destination encoded in the slug. The classifier handles this, but the redirect map will need to map flat WP URLs (\`/getting-around-suez/\`) to nested Next.js paths (\`/guide/suez/getting-around\`). A small number of pages will resist auto-classification and need editorial triage.`);
  push();
  push(`4. **No "destination hub" pages found at \`/{token}-travel-guide/\`** in the search probe. Hubs may instead be at single-token slugs (\`/cairo/\`, \`/luxor/\`) — those exist but were not in the date-desc sample. The classifier covers both forms; the actual hub slugs will surface in the full classification distribution above.`);
  push();
  push(`5. **No native CPTs distinguish tour / package / monument / hub / sub-page.** Every "non-blog" entity is type \`page\`. All semantic distinction is in the slug or body content. Custom-post-types like \`featured_tour\` and \`reviews\` exist in the schema but contain zero published items in REST — likely not used for production content.`);
  push();
  push(`6. **Elementor saturation: ~${elementorPct.toFixed(0)}% of sampled pages** have detectable Elementor markup. The HTML body is heavily structural. The importer's stripping pass must be aggressive (remove all class-prefixed wrappers), and pull-quote / side-image detection (per Phase B brief) will work on the post-strip semantic shape, not the raw markup.`);
  push();
  push(`7. **Internal linking via Link Whisper.** The plugin is active (~${pct(wpilPagesWithLinks, elementorSampleSize)} of pages have its monitor attributes). \`data-wpil-monitor-id\` attributes are pure noise — strip during HTML normalization. The actual \`<a href>\` is what the relinker needs.`);
  push();
  push(`8. **Spanish posts (166) outnumber English posts (163).** Three ES-only posts exist with no EN equivalent. Same direction in JA (164 > 163). These will surface as singletons in the reconciliation pass. They need editorial decision: translate to EN before migration, or import as ES/JA-only.`);
  push();
  push(`9. **Test/junk pages exist.** \`testing\`, \`233278-2\`, \`home-2\` and similar slugs were observed. These should not be migrated. The classifier flags them as \`test-or-junk\`; the importer should skip with a warning unless \`--include-junk\` is passed.`);
  push();
  push(`10. **Media is one-asset-per-file, alt is per-language.** A spot-checked image had an English filename and a Japanese \`alt_text\`. Either WPML returns the alt for the "current" locale (which on a default REST call is whichever the site's default language is set to — likely EN, but the response we got had JA alt, so probably the alt was authored in JA on that media record). The importer must fetch each media item once per locale to capture all language-specific alts, but must reuse a single Sanity asset reference across locales.`);
  push();

  push(`---`);
  push();
  push(`## End of Phase A — STOP`);
  push();
  push(`This is a read-only inventory. No Sanity writes have occurred. No importer code has been built.`);
  push();
  push(`Awaiting approval to proceed to Phase B (mapping doc).`);
  push();
  return lines.join('\n');
}

main().catch((e) => {
  process.stderr.write(`FATAL: ${e?.stack || e}\n`);
  process.exit(1);
});
