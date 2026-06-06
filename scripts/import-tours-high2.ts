/**
 * Phase 3 Tours batch — import the 6 HIGH-confidence tours (es+ja summary + body)
 * via an EXPLICIT corpus-slug map. Reuses the canonical MD→HTML→PortableText
 * conversion (marked + htmlToPortableText). Additive: fills es/ja only where the
 * locale value is null/empty; never overwrites; never touches en. raw @sanity/client.
 *
 * Run:  tsx scripts/import-tours-high.ts            (plan only)
 *       tsx scripts/import-tours-high.ts --commit   (write)
 */
import { createClient } from '@sanity/client';
import { marked } from 'marked';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { htmlToPortableText } from './wp-import-html.js';

const COMMIT = process.argv.includes('--commit');
const HOME = os.homedir();
const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8').split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] as [string, string]; })
);
const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-12-01',
  token: env.SANITY_STAGING_API_WRITE_TOKEN || env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

// Sanity EN slug → corpus frontmatter slug (explicit, signed-off)
const MAP: Array<{ sanity: string; corpus: string }> = [
  { sanity: '18-day-grand-egypt-holiday-package', corpus: 'tour-of-egypt' },
  { sanity: 'bahariya-and-siwa-oasis-vacation', corpus: 'desert-horizons-7-day-bahariya-siwa-oasis-tour' },
  { sanity: 'shared-seas-full-day-snorkeling-tour', corpus: 'dolphin-house-shared-snorkeling-day-from-hurghada' },
];

const LOC_DIR: Record<'es' | 'ja', string> = {
  es: path.join(HOME, 'Downloads/All 3 langs/es/tours'),
  ja: path.join(HOME, 'Downloads/All 3 langs/ja/tours'),
};

function walk(dir: string, acc: string[] = []): string[] {
  let ents: fs.Dirent[] = [];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.md')) acc.push(p);
  }
  return acc;
}

function parseFrontmatter(raw: string): { fm: Record<string, string>; rest: string } | null {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return null;
  const fm: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^"|"$/g, '').trim();
  }
  return { fm, rest: m[2] };
}
function parseMd(raw: string) {
  const parsed = parseFrontmatter(raw);
  if (!parsed) return null;
  const { fm, rest } = parsed;
  if (!fm.slug) return null;
  let body = rest;
  const metaMatch = body.match(/^\s*\*\*Meta Title:?\*\*[\s\S]*?\*\*Meta Description:?\*\*[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
  if (metaMatch) body = metaMatch[1];
  return { slug: fm.slug, title: fm.title ?? '', description: fm.description ?? '', body: body.trim() };
}

// index each locale tree by frontmatter slug
const index: Record<'es' | 'ja', Map<string, string[]>> = { es: new Map(), ja: new Map() };
for (const loc of ['es', 'ja'] as const) {
  for (const file of walk(LOC_DIR[loc])) {
    const parsed = parseMd(fs.readFileSync(file, 'utf8'));
    if (!parsed?.slug) continue;
    const arr = index[loc].get(parsed.slug) ?? [];
    arr.push(file);
    index[loc].set(parsed.slug, arr);
  }
}

const hasNonEmpty = (arr: any[] | undefined, key: string) =>
  Array.isArray(arr) && arr.some((i) => i._key === key && i.value != null &&
    (typeof i.value === 'string' ? i.value.trim() : (Array.isArray(i.value) ? i.value.length : true)));

async function main() {
  const ops: Array<{ id: string; patch: any; slug: string; sample: any }> = [];
  for (const { sanity, corpus } of MAP) {
    const doc = await client.fetch(
      `*[_type=="tour" && !(_id in path("drafts.**")) && slug[_key=="en"][0].value.current==$s][0]{_id, summary, body}`,
      { s: sanity }
    );
    if (!doc) { console.log(`⚠ ${sanity}: Sanity doc not found — SKIP`); continue; }

    const patch: any = {};
    const sample: any = { slug: sanity };
    for (const loc of ['es', 'ja'] as const) {
      const files = index[loc].get(corpus) ?? [];
      if (files.length === 0) { console.log(`⚠ ${sanity}: no ${loc} corpus file for "${corpus}" — SKIP ${loc}`); continue; }
      if (files.length > 1) { console.log(`⚠ ${sanity}: MULTIPLE ${loc} files for "${corpus}" (${files.map((f) => f.replace(HOME, '~')).join(', ')}) — SKIP ${loc} for safety`); continue; }
      const parsed = parseMd(fs.readFileSync(files[0], 'utf8'))!;
      const html = marked.parse(parsed.body, { async: false }) as string;
      const { blocks } = htmlToPortableText(html, { locale: loc });

      // summary (additive) — {_key,value} convention (no _type), accumulate across locales
      if (parsed.description && !hasNonEmpty(doc.summary, loc)) {
        const baseSum = patch.summary ?? doc.summary ?? [];
        patch.summary = [...baseSum.filter((i: any) => i._key !== loc), { _key: loc, value: parsed.description }];
        sample[`summary_${loc}`] = parsed.description;
      } else if (hasNonEmpty(doc.summary, loc)) {
        console.log(`  · ${sanity} summary[${loc}] already set — skip (additive)`);
      }
      // body (additive) — body items carry _type:'object' (existing convention)
      if (blocks.length && !hasNonEmpty(doc.body, loc)) {
        const baseBody = patch.body ?? doc.body ?? [];
        patch.body = [...baseBody.filter((i: any) => i._key !== loc), { _key: loc, _type: 'object', value: blocks }];
        sample[`body_${loc}_blocks`] = blocks.length;
      } else if (hasNonEmpty(doc.body, loc)) {
        console.log(`  · ${sanity} body[${loc}] already set — skip (additive)`);
      }
    }
    if (Object.keys(patch).length) ops.push({ id: doc._id, patch, slug: sanity, sample });
  }

  console.log(`\nPlan: ${ops.length} tours to patch`);
  for (const o of ops) {
    console.log(`• ${o.slug}: ${Object.keys(o.patch).join('+')} | es-sum:${o.sample.summary_es ? 'y' : '-'} ja-sum:${o.sample.summary_ja ? 'y' : '-'} es-body:${o.sample.body_es_blocks ?? '-'} ja-body:${o.sample.body_ja_blocks ?? '-'}`);
  }

  if (!COMMIT) { console.log('\n[PLAN ONLY] pass --commit to write.'); return; }
  let tx = client.transaction();
  for (const o of ops) tx = tx.patch(o.id, (p) => p.set(o.patch));
  await tx.commit({ visibility: 'sync' });
  console.log(`\n[DONE] patched ${ops.length} tours.`);
}


main().catch((e) => { console.error(e); process.exit(1); });
