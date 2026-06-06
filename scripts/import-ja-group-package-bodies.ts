/**
 * One-off: import the Japanese BODY for the 3 group-package tours.
 *
 * The JA corpus files for these 3 tours are in a rawer format than the EN/ES
 * files (no frontmatter, **bold** inner title, "**▸ N日目**" day headers, an
 * extra English-title line, a "— … —" standfirst, and "· · ·" separators).
 * This normaliser rewrites that raw markdown into the SAME shape as the clean
 * EN/ES corpus files (# inner title, *standfirst*, #### day headers) so the
 * shared marked → htmlToPortableText pipeline yields a body whose block
 * structure matches the EN/ES bodies already in Sanity.
 *
 * The write is ADDITIVE: it appends a {_key:'ja'} entry to the `body`
 * internationalised array only when none exists. EN/ES are never touched.
 *
 * Usage:  tsx scripts/import-ja-group-package-bodies.ts --dry-run
 *         tsx scripts/import-ja-group-package-bodies.ts --commit
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { readFileSync } from 'node:fs';
import { marked } from 'marked';

import { htmlToPortableText } from './wp-import-html.ts';

loadEnv();

const BASE = '/Users/islamhussein/Downloads/All 3 langs/ja/tours/group packages';
const TOURS: Array<{ enSlug: string; file: string }> = [
  { enSlug: '9-day-egypt-group-tour-cairo-abu-simbel-nile', file: `${BASE}/Japan & East Asia/9-day-egypt-group-tour-cairo-abu-simbel-nile_ja_2026-05.md` },
  { enSlug: '10-day-egypt-group-tour-cairo-nile-red-sea', file: `${BASE}/UK & Europe/10-day-egypt-group-tour-cairo-nile-red-sea_ja_2026-05.md` },
  { enSlug: '11-day-egypt-group-tour-cairo-red-sea-nile', file: `${BASE}/USA & Canada/11-day-egypt-group-tour-cairo-red-sea-nile_ja_2026-05.md` },
];

const CJK = /[぀-ヿ㐀-䶿一-鿿]/;
const isDots = (t: string) => /^[·•∙・]+(?:\s+[·•∙・]+)*$/.test(t);

/** Rewrite the raw JA markdown into the EN/ES-equivalent markdown shape. */
function normalizeJa(raw: string): string {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let phase: 'pre' | 'head' | 'body' = 'pre';

  for (const line of lines) {
    const t = line.trim();

    if (phase === 'pre') {
      if (t === '') continue;
      const m = t.match(/^\*\*(.+?)\*\*$/);          // first bold line = inner title
      out.push(m ? `# ${m[1].trim()}` : t);
      phase = 'head';
      continue;
    }

    if (phase === 'head') {
      if (t === '') { out.push(''); continue; }
      const sf = t.match(/^[—–-]\s*(.+?)\s*[—–-]$/);  // "— standfirst —" → *standfirst*
      if (sf) { out.push(`*${sf[1].trim()}*`); continue; }
      if (!CJK.test(t) && !t.startsWith('|') && t !== '---' && !isDots(t)) continue; // drop EN-title line
      out.push(line);                                  // first real CJK prose paragraph
      phase = 'body';
      continue;
    }

    // phase === 'body'
    if (t === '') { out.push(''); continue; }
    const dm = t.match(/^\*\*▸\s*(.+?)\*\*$/);          // "**▸ N日目 …**" → "#### N日目 …"
    if (dm) { out.push(`#### ${dm[1].trim()}`); continue; }
    if (/^\*\*■/.test(t)) continue;                     // drop "■ …" section labels (EN/ES have none)
    if (isDots(t)) continue;                            // drop "· · ·" separators
    out.push(line);
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function getClient(): SanityClient {
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (dataset !== 'migration-staging') { process.stderr.write(`Refusing against dataset=${dataset}\n`); process.exit(2); }
  const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
  if (!token) { process.stderr.write('SANITY_STAGING_API_WRITE_TOKEN required\n'); process.exit(2); }
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
    useCdn: false, token, perspective: 'raw',
  });
}

async function main() {
  const commit = process.argv.includes('--commit');
  const dryRun = process.argv.includes('--dry-run');
  if (commit === dryRun) { process.stderr.write('Pass exactly one of --dry-run or --commit.\n'); process.exit(2); }

  const client = getClient();
  console.log(`\n=== Import JA group-package bodies — ${commit ? 'COMMIT' : 'dry-run'} ===\n`);

  for (const { enSlug, file } of TOURS) {
    const raw = readFileSync(file, 'utf8');
    const md = normalizeJa(raw);
    const html = marked.parse(md, { async: false }) as string;
    const { blocks } = htmlToPortableText(html, { locale: 'ja' });

    const styleSeq = blocks.map((b: any) => (b._type === 'block' ? (b.style ?? 'normal') : b._type));
    const h2 = styleSeq.filter((s) => s === 'h2').length;
    const h4 = styleSeq.filter((s) => s === 'h4').length;
    console.log(`• ${enSlug}`);
    console.log(`    blocks=${blocks.length}  h2=${h2}  h4(days)=${h4}`);
    console.log(`    seq: ${styleSeq.join(' ')}`);
    console.log(`    title block: "${(blocks[0]?.children?.[0]?.text ?? '').slice(0, 40)}"`);

    // fetch all docs (published + any draft) for this slug
    const docs = await client.fetch<Array<{ _id: string; keys: string[] | null }>>(
      `*[_type=='tour' && slug[_key=='en'][0].value.current==$slug]{ _id, "keys": body[]._key }`,
      { slug: enSlug },
    );
    if (docs.length === 0) { console.log('    ! no Sanity doc found — skipping\n'); continue; }

    for (const d of docs) {
      const hasJa = (d.keys ?? []).includes('ja');
      console.log(`    doc ${d._id}: existing body locales=[${(d.keys ?? []).join(',')}]  ${hasJa ? '→ already has ja, SKIP' : '→ will append ja'}`);
      if (commit && !hasJa) {
        await client
          .patch(d._id)
          .setIfMissing({ body: [] })
          .insert('after', 'body[-1]', [{ _key: 'ja', _type: 'object', value: blocks }])
          .commit({ visibility: 'sync' });
        console.log(`      ✓ appended ja body (${blocks.length} blocks)`);
      }
    }
    console.log();
  }

  if (dryRun) console.log('Dry-run — no writes.\n');
}

main().catch((err) => { console.error(err); process.exit(1); });
