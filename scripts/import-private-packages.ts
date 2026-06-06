/**
 * Import private-package content (title + summary + body, en/es/ja) from the
 * authoritative source .md files, matching the marriott reference format, and
 * unset the legacy days[] grid in the same write.
 *
 * Source folders (exact, note JA trailing space):
 *   ~/Downloads/All 3 langs/en/tours/private packages
 *   ~/Downloads/All 3 langs/es/tours/private packages
 *   ~/Downloads/All 3 langs/ja/tours/private packages   (trailing space)
 *
 * Reuses marked + htmlToPortableText (same pipeline as prior tour imports).
 * Overwrites title/summary/body from source; unsets days[]; touches nothing else.
 *
 *   tsx scripts/import-private-packages.ts                 # plan all
 *   tsx scripts/import-private-packages.ts --only=<slug>   # plan one
 *   tsx scripts/import-private-packages.ts --only=<slug> --commit
 *   tsx scripts/import-private-packages.ts --commit        # write all
 */
import { createClient } from '@sanity/client';
import { marked } from 'marked';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { htmlToPortableText } from './wp-import-html.js';

const COMMIT = process.argv.includes('--commit');
const ONLY = (process.argv.find((a) => a.startsWith('--only=')) || '').split('=')[1] || null;
const HOME = os.homedir();
const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8').split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] as [string, string]; })
);
const c = createClient({ projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID, dataset: env.NEXT_PUBLIC_SANITY_DATASET, apiVersion: '2024-12-01', token: env.SANITY_STAGING_API_WRITE_TOKEN || env.SANITY_API_WRITE_TOKEN, useCdn: false });

const DIRS: Record<'en' | 'es' | 'ja', string> = {
  en: path.join(HOME, 'Downloads/All 3 langs/en/tours/private packages'),
  es: path.join(HOME, 'Downloads/All 3 langs/es/tours/private packages'),
  ja: path.join(HOME, 'Downloads/All 3 langs/ja/tours/private packages '), // trailing space
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
function fmField(fm: string, k: string): string | null {
  const m = fm.match(new RegExp('^' + k + ':\\s*(.*)$', 'm'));
  return m ? (m[1].trim().replace(/^"|"$/g, '').trim() || null) : null;
}
function parseMd(file: string) {
  const txt = fs.readFileSync(file, 'utf8');
  const fmMatch = txt.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!fmMatch) return null;
  const fm = fmMatch[1];
  let body = fmMatch[2];
  // Strip a leading Meta block — English or Japanese — up to the first standalone ---
  const enMeta = body.match(/^\s*\*\*Meta Title:?\*\*[\s\S]*?\*\*Meta Description:?\*\*[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
  const jaMeta = body.match(/^\s*\*\*メタタイトル：?\*\*[\s\S]*?\*\*メタディスクリプション：?\*\*[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
  if (enMeta) body = enMeta[1];
  else if (jaMeta) body = jaMeta[1];
  return { slug: fmField(fm, 'slug'), title: fmField(fm, 'title'), description: fmField(fm, 'description'), body: body.trim() };
}
function indexDir(dir: string) {
  const o: Record<string, ReturnType<typeof parseMd>> = {};
  for (const f of walk(dir)) { const p = parseMd(f); if (p?.slug) o[p.slug] = p; }
  return o;
}
const idx = { en: indexDir(DIRS.en), es: indexDir(DIRS.es), ja: indexDir(DIRS.ja) };

async function main() {
  let slugs = Object.keys(idx.en);
  if (ONLY) slugs = slugs.filter((s) => s === ONLY);
  const docs = await c.fetch(
    `*[_type=="tour" && type=="package" && tourMode=="private" && !(_id in path("drafts.**")) && slug[_key=="en"][0].value.current in $s]{ _id, "slug":slug[_key=="en"][0].value.current, "nDays":count(days) }`,
    { s: slugs }
  );
  const bySlug = Object.fromEntries(docs.map((d: any) => [d.slug, d]));
  const ops: any[] = [];
  for (const slug of slugs) {
    const d = bySlug[slug];
    if (!d) { console.log(`⚠ ${slug}: no Sanity private-package match — SKIP`); continue; }
    const title: any[] = [], summary: any[] = [], body: any[] = [];
    const missing: string[] = [];
    for (const loc of ['en', 'es', 'ja'] as const) {
      const m = idx[loc][slug];
      if (!m) { missing.push(loc); continue; }
      if (m.title) title.push({ _key: loc, value: m.title });
      if (m.description) summary.push({ _key: loc, value: m.description });
      const html = marked.parse(m.body, { async: false }) as string;
      const { blocks } = htmlToPortableText(html, { locale: loc });
      body.push({ _key: loc, _type: 'object', value: blocks });
    }
    if (missing.length) { console.log(`⚠ ${slug}: missing source for [${missing.join(',')}] — SKIP`); continue; }
    ops.push({ id: d._id, slug, hadDays: d.nDays || 0, patch: { title, summary, body }, blockCounts: body.map((b) => `${b._key}:${b.value.length}`).join(' ') });
  }
  console.log(`\nPlan: ${ops.length} private packages (${ONLY ? 'pilot' : 'all'})`);
  ops.forEach((o) => console.log(`  ${o.slug}  | blocks ${o.blockCounts} | days→unset:${o.hadDays}`));

  if (!COMMIT) { console.log('\n[PLAN ONLY] pass --commit to write.'); return; }
  const BATCH = 10; let done = 0;
  for (let i = 0; i < ops.length; i += BATCH) {
    let tx = c.transaction();
    for (const o of ops.slice(i, i + BATCH)) tx = tx.patch(o.id, (p) => p.set(o.patch).unset(['days']));
    await tx.commit({ visibility: 'sync' });
    done += ops.slice(i, i + BATCH).length;
    console.log(`  committed ${done}/${ops.length}`);
  }
  console.log(`\n[DONE] imported ${done} private packages (title+summary+body set, days unset).`);
}
main().catch((e) => { console.error(e); process.exit(1); });
