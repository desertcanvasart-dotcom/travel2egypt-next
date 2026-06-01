/**
 * Apply ES/JA legal-page translations produced by the translate-legal-pages
 * workflow. Reads /tmp/legal_translations.json (array of
 * { id, lang, title, blocks: [{ key, text }] }), merges the translated text
 * onto the AUTHORITATIVE English block structure (so _keys, heading styles,
 * and whole-block bold are preserved), and writes body[lang] + title[lang]
 * on each legalPage via @sanity/client.
 *
 * Coverage is validated per doc: every English block _key must have a
 * translation, else the run aborts (no partial/English-leaking writes).
 *
 * Usage: --dry-run | --commit
 */
import { readFileSync } from 'node:fs';
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
loadEnv();

const TRANSLATIONS = '/tmp/legal_translations.json';

interface Span { _type: string; _key?: string; text?: string; marks?: string[] }
interface Block { _key: string; _type: string; style?: string; children?: Span[]; markDefs?: unknown[] }
interface LE<T> { _key: string; value: T }
interface TransResult { id: string; lang: 'es' | 'ja'; title: string; blocks: Array<{ key: string; text: string }> }

function parseArgs(argv: string[]) {
  let commit = false, dryRun = false;
  for (const a of argv.slice(2)) { if (a === '--commit') commit = true; else if (a === '--dry-run') dryRun = true; else { process.stderr.write(`Unknown arg: ${a}\n`); process.exit(2); } }
  if (commit === dryRun) { process.stderr.write('Pass exactly one of --dry-run or --commit.\n'); process.exit(2); }
  return { commit };
}
function getClient(): SanityClient {
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (dataset !== 'migration-staging') { process.stderr.write(`Refusing against ${dataset}\n`); process.exit(2); }
  const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
  if (!token) { process.stderr.write('SANITY_STAGING_API_WRITE_TOKEN required\n'); process.exit(2); }
  return createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset, apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01', useCdn: false, token, perspective: 'raw' });
}

async function main() {
  const { commit } = parseArgs(process.argv);
  console.log(`\n=== Apply legal translations ===\nmode: ${commit ? 'COMMIT' : 'dry-run'}\n`);
  const client = getClient();

  const results = JSON.parse(readFileSync(TRANSLATIONS, 'utf8')) as TransResult[];
  console.log(`Loaded ${results.length} translation results.`);

  // group by doc id
  const byId = new Map<string, TransResult[]>();
  for (const r of results) { if (!byId.has(r.id)) byId.set(r.id, []); byId.get(r.id)!.push(r); }

  let docsWritten = 0, abort = false;
  for (const [id, langResults] of byId) {
    const doc = await client.fetch<{ title?: LE<string>[]; body?: LE<Block[]>[] } | null>(`*[_id==$id][0]{ title, body }`, { id });
    const enEntry = doc?.body?.find((e) => e._key === 'en');
    if (!enEntry || !Array.isArray(enEntry.value)) { console.log(`  ✗ ${id}: no en body`); abort = true; continue; }
    const enBlocks = enEntry.value;

    // authoritative structure: _key → { style, allBold }
    const struct = new Map<string, { style?: string; allBold: boolean }>();
    for (const b of enBlocks) {
      if (b._type !== 'block') continue;
      const spans = (b.children ?? []).filter((s) => s._type === 'span');
      const allBold = spans.length > 0 && spans.every((s) => (s.marks ?? []).includes('strong'));
      struct.set(b._key, { style: b.style, allBold });
    }

    const newBody = [...(doc!.body ?? [])];
    const newTitle = [...(doc!.title ?? [])];

    for (const r of langResults) {
      const map = new Map(r.blocks.map((b) => [b.key, b.text]));
      const missing = [...struct.keys()].filter((k) => !map.has(k));
      if (missing.length) { console.log(`  ✗ ${id} [${r.lang}]: ${missing.length} block(s) untranslated — ABORT`); abort = true; continue; }

      const value: Block[] = enBlocks.filter((b) => b._type === 'block').map((b) => {
        const s = struct.get(b._key)!;
        return {
          _key: b._key, _type: 'block', style: s.style ?? 'normal', markDefs: [],
          children: [{ _type: 'span', _key: `${b._key}0`, text: map.get(b._key)!, marks: s.allBold ? ['strong'] : [] }],
        };
      });

      // upsert body[lang] + title[lang]
      const bi = newBody.findIndex((e) => e._key === r.lang);
      if (bi >= 0) newBody[bi] = { _key: r.lang, value }; else newBody.push({ _key: r.lang, value });
      const ti = newTitle.findIndex((e) => e._key === r.lang);
      if (ti >= 0) newTitle[ti] = { _key: r.lang, value: r.title }; else newTitle.push({ _key: r.lang, value: r.title });
      console.log(`  ✓ ${id} [${r.lang}]: ${value.length} blocks, title="${r.title}"`);
    }

    if (!abort && commit) { await client.patch(id).set({ body: newBody, title: newTitle }).commit({ visibility: 'sync' }); docsWritten++; }
  }

  if (abort) { console.log('\n⚠ Aborted — fix coverage and re-run. No partial writes performed beyond docs already passed.'); process.exit(1); }
  console.log(`\n${commit ? `✓ Wrote ${docsWritten} docs.` : 'Dry-run — no writes.'}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
