/**
 * Session 15 — Variant content uniqueness spot-check (B3 lock confirmation).
 * Read-only. Fetches 3 variant pairs and diffs structurally.
 */
import { loadEnv } from './wp-import/env.js';
import { WpClient } from './wp-import/wp-client.js';

const PAIRS: Array<[number, number, string]> = [
  [218432, 160965, '9-day-prestigious-egypt-vacation (germany vs usa)'],
  [160776, 160503, 'bahariya-and-siwa-oasis-vacation (turkey vs canada)'],
  [161041, 160059, '4-day-cairo-travel-package (spain vs india)'],
];

const COUNTRIES = ['germany', 'spain', 'usa', 'turkey', 'canada', 'australia', 'india', 'the-uk', 'the uk', 'united kingdom', 'united-kingdom'];

function normalizeText(s: string): string {
  let out = s.toLowerCase();
  for (const c of COUNTRIES) out = out.split(c).join('{C}');
  // collapse whitespace
  out = out.replace(/\s+/g, ' ').trim();
  return out;
}

interface WidgetSig { widgetType: string; textLen?: number; textHash?: string; childCount?: number; key?: string }

function widgetSignatures(blocks: any[]): WidgetSig[] {
  const out: WidgetSig[] = [];
  function rec(arr: any[]) {
    for (const b of arr) {
      if (b.widgetType) {
        const sig: WidgetSig = { widgetType: b.widgetType };
        const s = b.settings || {};
        // capture text shape, length only
        const candidates = ['editor', 'title', 'html', 'description_text', 'icon_box_description', 'caption'];
        let text = '';
        for (const k of candidates) if (typeof s[k] === 'string') text += s[k];
        if (s.tabs && Array.isArray(s.tabs)) {
          sig.childCount = s.tabs.length;
          for (const t of s.tabs) {
            text += String(t.tab_title || '') + String(t.tab_content || '');
          }
        }
        const norm = normalizeText(text);
        sig.textLen = norm.length;
        out.push(sig);
      }
      if (b.elements) rec(b.elements);
    }
  }
  rec(blocks);
  return out;
}

function diffSigs(a: WidgetSig[], b: WidgetSig[]) {
  const widgetTypesA = a.map(w => w.widgetType).join(',');
  const widgetTypesB = b.map(w => w.widgetType).join(',');
  const sameShape = widgetTypesA === widgetTypesB;
  let textLenDiffSum = 0;
  let textLenDiffMax = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const d = Math.abs((a[i].textLen ?? 0) - (b[i].textLen ?? 0));
    textLenDiffSum += d;
    if (d > textLenDiffMax) textLenDiffMax = d;
  }
  return { sameShape, widgetCountA: a.length, widgetCountB: b.length, textLenDiffSum, textLenDiffMax };
}

async function fetchPage(wp: WpClient, id: number) {
  const data: any = await (wp as any).getJson(`/wp-json/wp/v2/pages/${id}?context=edit`);
  const meta = data.meta ?? {};
  const elementorRaw = meta._elementor_data ?? '';
  let parsed: any[] = [];
  try { parsed = JSON.parse(elementorRaw); } catch {}
  return {
    id: data.id, slug: data.slug, title: data.title?.rendered ?? '',
    modified: data.modified, featured_media: data.featured_media,
    rank_math_title: meta.rank_math_title ?? '',
    rank_math_description: meta.rank_math_description ?? '',
    elementorRaw, elementorSize: elementorRaw.length,
    elementorSigs: widgetSignatures(parsed),
  };
}

async function main() {
  const env = loadEnv();
  const wp = new WpClient(env, 4);

  for (const [aId, bId, label] of PAIRS) {
    console.log(`\n=== ${label} ===`);
    const [a, b] = await Promise.all([fetchPage(wp, aId), fetchPage(wp, bId)]);
    const titleEqNormalized = normalizeText(a.title) === normalizeText(b.title);
    const featMediaEq = a.featured_media === b.featured_media;
    const seoEq = normalizeText(a.rank_math_title + '\n' + a.rank_math_description) === normalizeText(b.rank_math_title + '\n' + b.rank_math_description);
    const diff = diffSigs(a.elementorSigs, b.elementorSigs);

    console.log(`  A: ${a.id}  ${a.slug}  title: ${a.title}`);
    console.log(`  B: ${b.id}  ${b.slug}  title: ${b.title}`);
    console.log(`  title equal (country-normalized): ${titleEqNormalized}`);
    console.log(`  featured_media equal: ${featMediaEq} (A=${a.featured_media}, B=${b.featured_media})`);
    console.log(`  rank_math SEO equal (normalized): ${seoEq}`);
    console.log(`  elementor: A=${a.elementorSize}B  B=${b.elementorSize}B`);
    console.log(`  widget shape identical: ${diff.sameShape} (A=${diff.widgetCountA} widgets, B=${diff.widgetCountB} widgets)`);
    console.log(`  text-length deltas across widgets: sum=${diff.textLenDiffSum}  max-single=${diff.textLenDiffMax}`);
    const verdict = diff.sameShape && titleEqNormalized && featMediaEq && diff.textLenDiffMax < 100
      ? 'IDENTICAL (within tolerance)'
      : diff.sameShape && featMediaEq
        ? 'SHAPE IDENTICAL, TEXT DIFFERS'
        : 'STRUCTURALLY DIFFERENT';
    console.log(`  VERDICT: ${verdict}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
