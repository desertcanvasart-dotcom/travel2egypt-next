/**
 * Audit internalLink annotations in portable-text bodies for mis-mapped
 * targets — READ-ONLY.
 *
 * Motivation: WP-imported links include confirmed mis-mappings (wp-page-87064
 * links "Nubian desert" to guideArticle.cairo.northern-cemetery). This script
 * scores every internalLink's anchor text against its target document's
 * title (all locales, EN fallback) and emits a review CSV ranked worst-first.
 *
 * Scoring: significant-token overlap for Latin-script anchors (accent- and
 * stopword-normalized); character-bigram overlap / containment for JA. The
 * max score across the target's locale titles is kept, so an EN anchor that
 * matches the target's ES title is not a false alarm.
 *
 * severity: no-overlap (score 0) > low (<0.5) > ok. Dangling refs are
 * reported separately. markDef keys of the WP import are zero-padded
 * sequential ("000000000007"); mention-linker keys are random — recorded as
 * key_style so the two pipelines can be told apart.
 *
 * Usage:  npx tsx scripts/audit-imported-links.ts
 * Output: docs/imported-link-audit-<date>.csv + stdout summary
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ufallvd2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-12-01',
  token: process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const STOP = new Set(
  'the of in on at a an and or to for with from by la el los las de del un una y en al es lo su tour tours guide guía guia'.split(' ')
);
const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const tokens = (s: string) =>
  new Set(norm(s).split(/[^a-z0-9]+/).filter((t) => t.length >= 3 && !STOP.has(t)));
const bigrams = (s: string) => {
  const out = new Set<string>();
  const t = s.replace(/\s/g, '');
  for (let i = 0; i < t.length - 1; i++) out.add(t.slice(i, i + 2));
  return out;
};
const overlap = <T,>(a: Set<T>, b: Set<T>) => {
  if (!a.size || !b.size) return 0;
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n / Math.min(a.size, b.size);
};

function similarity(anchor: string, title: string): number {
  const latin = /[a-zA-Z]{3,}/.test(anchor);
  if (latin) return overlap(tokens(anchor), tokens(title));
  // CJK: containment first, then bigram overlap
  const a = anchor.replace(/\s/g, ''), t = title.replace(/\s/g, '');
  if (a && t && (t.includes(a) || a.includes(t))) return 1;
  return overlap(bigrams(a), bigrams(t));
}

const titleOf = (doc: any): string[] => {
  const out: string[] = [];
  for (const field of [doc?.title, doc?.name]) {
    if (typeof field === 'string') out.push(field);
    else if (Array.isArray(field)) for (const e of field) if (e?.value) out.push(e.value);
  }
  return out;
};

async function main() {
  console.log('Fetching bodies + link targets…');
  const [guides, articles] = await Promise.all([
    client.fetch(`*[_type=='guideArticle' && !(_id in path('drafts.**')) && defined(body)]{_id, title, body}`),
    client.fetch(`*[_type=='article' && !(_id in path('drafts.**')) && defined(body)]{_id, title, language, body}`),
  ]);

  type Link = { source_id: string; source_type: string; source_title: string; locale: string; anchor: string; target_id: string; key: string; context: string };
  const links: Link[] = [];
  const collect = (blocks: any[], locale: string, source: { id: string; type: string; title: string }) => {
    for (const b of blocks ?? []) {
      if (b._type !== 'block') continue;
      for (const md of b.markDefs ?? []) {
        if (md._type !== 'internalLink' || !md.reference?._ref) continue;
        const anchor = (b.children ?? []).filter((s: any) => s.marks?.includes(md._key)).map((s: any) => s.text).join('');
        const blockText = (b.children ?? []).map((s: any) => s.text ?? '').join('');
        links.push({
          source_id: source.id, source_type: source.type, source_title: source.title, locale,
          anchor, target_id: md.reference._ref, key: md._key,
          context: blockText.slice(0, 160),
        });
      }
    }
  };
  for (const g of guides) {
    const t = (g.title ?? []).find((e: any) => e._key === 'en')?.value ?? '';
    for (const e of g.body ?? []) if (Array.isArray(e.value)) collect(e.value, e._key, { id: g._id, type: 'guideArticle', title: t });
  }
  for (const a of articles) collect(a.body, a.language ?? 'en', { id: a._id, type: 'article', title: a.title ?? '' });

  const targetIds = [...new Set(links.map((l) => l.target_id))];
  const targets = await client.fetch(`*[_id in $ids]{_id, _type, title, name}`, { ids: targetIds });
  const byId = new Map(targets.map((t: any) => [t._id, t]));

  const rows = links.map((l) => {
    const target = byId.get(l.target_id) as any;
    const titles = target ? titleOf(target) : [];
    const score = titles.length ? Math.max(...titles.map((t) => similarity(l.anchor, t))) : -1;
    const severity = !target ? 'dangling-target' : score === 0 ? 'no-overlap' : score < 0.5 ? 'low' : 'ok';
    return { ...l, target_type: target?._type ?? '?', target_title: titles[0] ?? '', score: score.toFixed(2), severity,
      key_style: /^0+\d{1,4}$/.test(l.key) ? 'wp-import' : 'other' };
  });

  rows.sort((a, b) => Number(a.score) - Number(b.score));
  const esc = (v: string | number) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  const cols = ['severity','score','key_style','locale','source_type','source_id','source_title','anchor','target_type','target_id','target_title','context'] as const;
  const date = process.env.RUN_DATE || new Date().toISOString().slice(0, 10);
  const out = resolve(process.cwd(), `docs/imported-link-audit-${date}.csv`);
  writeFileSync(out, [cols.join(','), ...rows.map((r) => cols.map((c) => esc((r as any)[c])).join(','))].join('\n') + '\n');

  const n = (s: string) => rows.filter((r) => r.severity === s).length;
  console.log(`\n${rows.length} internalLinks audited → ${out}`);
  console.log(`dangling-target: ${n('dangling-target')} | no-overlap: ${n('no-overlap')} | low: ${n('low')} | ok: ${n('ok')}`);
  console.log('\nWorst offenders (no-overlap, wp-import keys):');
  for (const r of rows.filter((r) => r.severity === 'no-overlap' && r.key_style === 'wp-import').slice(0, 15))
    console.log(`  [${r.locale}] "${r.anchor}" -> ${r.target_id} ("${r.target_title}")  in ${r.source_id}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
