/**
 * Complex of Sultan Qalawun — full rewrite stage (2026-07-17, founder-directed).
 *
 * Doc: guideArticle.cairo.madrassa-mausoleum-of-qalawun
 * Old state: EN 8-block keyword-stuffed lede, ES/JA 81-block divergent
 * imports, seo misdating the complex to "the 12th century", no hero.
 *
 * Sources (locked copy, parsed VERBATIM — the script builds blocks straight
 * from the files, so drift is structurally impossible):
 *   EN — ~/Documents/Codex/2026-07-17/…/Complex of Sultan Qalawun.md
 *        (founder's sourced research, islamicart.museumwnf.org)
 *   ES — ~/Desktop/complejo-del-sultan-qalawun-ES.md   (Claude reworking,
 *   JA — ~/Desktop/sultan-qalawun-fukugotai-JA.md       for founder review)
 *
 * Parsing: line 'Meta title:' → seo.metaTitle; 'Meta description:' →
 * seo.metaDescription; '# ' H1 SKIPPED (template renders title as H1);
 * '## ' → h2 block; other non-empty lines → normal paragraphs; the
 * '*Created: … | Updated: …*' footer SKIPPED (WP-style date-stamp debris).
 *
 * Titles (staged; founder confirms at HOLD):
 *   EN "Complex of Sultan Al-Mansur Qalawun" (founder's instruction,
 *      normalized: stray leading space + trailing period removed)
 *   ES "Complejo del Sultán Al-Mansur Qalawun"
 *   JA "スルタン・カラーウーン複合体" (short-form; アル＝マンスール carried in standfirst)
 * Slugs (staged): en complex-of-sultan-al-mansur-qalawun ·
 *   es complejo-del-sultan-qalawun · ja surutan-karaun-fukugotai
 *   (old slugs 301'd + existing wiki-row targets retargeted — see the
 *   redirect-map change in the same branch).
 *
 * Stages to drafts.<id> only — publish happens after founder approval.
 * Usage: npx tsx scripts/qalawun-complex-rewrite-stage.ts
 */
import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN,
  useCdn: false,
});

const ID = 'guideArticle.cairo.madrassa-mausoleum-of-qalawun';
const SOURCES = {
  en: '/Users/islamhussein/Documents/Codex/2026-07-17/https-islamicart-museumwnf-org-database-item/outputs/Complex of Sultan Qalawun.md',
  es: '/Users/islamhussein/Desktop/complejo-del-sultan-qalawun-ES.md',
  ja: '/Users/islamhussein/Desktop/sultan-qalawun-fukugotai-JA.md',
};
const TITLES = {
  en: 'Complex of Sultan Al-Mansur Qalawun',
  es: 'Complejo del Sultán Al-Mansur Qalawun',
  ja: 'スルタン・カラーウーン複合体',
};
const SLUGS = {
  en: 'complex-of-sultan-al-mansur-qalawun',
  es: 'complejo-del-sultan-qalawun',
  ja: 'surutan-karaun-fukugotai',
};

let kc = 0;
const K = (loc: string) => `q${loc}${(kc++).toString(36)}`;

function parseMd(path: string, loc: string) {
  const lines = fs.readFileSync(path, 'utf8').split('\n');
  let metaTitle = '', metaDescription = '';
  const blocks: any[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('Meta title:')) { metaTitle = line.slice('Meta title:'.length).trim(); continue; }
    if (line.startsWith('Meta description:')) { metaDescription = line.slice('Meta description:'.length).trim(); continue; }
    if (line.startsWith('# ')) continue; // H1 — template renders the title
    if (/^\*Created:.*\*$/.test(line)) continue; // date-stamp footer — debris
    if (line.startsWith('## ')) {
      blocks.push({ _type: 'block', _key: K(loc), style: 'h2', markDefs: [], children: [{ _type: 'span', _key: K(loc), text: line.slice(3).trim(), marks: [] }] });
    } else {
      blocks.push({ _type: 'block', _key: K(loc), style: 'normal', markDefs: [], children: [{ _type: 'span', _key: K(loc), text: line, marks: [] }] });
    }
  }
  if (!metaTitle || !metaDescription || blocks.length < 10) {
    throw new Error(`parse sanity failed for ${loc}: metaTitle=${!!metaTitle} metaDesc=${!!metaDescription} blocks=${blocks.length}`);
  }
  return { metaTitle, metaDescription, blocks };
}

async function main() {
  const parsed = {
    en: parseMd(SOURCES.en, 'en'),
    es: parseMd(SOURCES.es, 'es'),
    ja: parseMd(SOURCES.ja, 'ja'),
  };
  for (const [loc, p] of Object.entries(parsed)) {
    const h2s = p.blocks.filter((b) => b.style === 'h2').length;
    console.log(`${loc}: ${p.blocks.length} blocks (${h2s} h2) | metaTitle "${p.metaTitle.slice(0, 50)}…"`);
  }
  // structural parity: same number of h2 sections in all locales
  const h2Counts = Object.values(parsed).map((p) => p.blocks.filter((b) => b.style === 'h2').length);
  if (new Set(h2Counts).size !== 1) throw new Error('h2 section count differs across locales: ' + h2Counts.join('/'));

  const pub: any = await client.getDocument(ID);
  if (!pub) throw new Error('published doc not found');
  fs.writeFileSync('backups/qalawun-complex-pre-rewrite-2026-07-17.json', JSON.stringify(pub, null, 2));
  console.log('rollback written: backups/qalawun-complex-pre-rewrite-2026-07-17.json');

  const loc3 = (f: (l: 'en' | 'es' | 'ja') => any) =>
    (['en', 'es', 'ja'] as const).map((l) => ({ _key: l, ...f(l) }));

  const draft = {
    ...pub,
    _id: 'drafts.' + ID,
    title: loc3((l) => ({ value: TITLES[l] })),
    slug: loc3((l) => ({ value: { _type: 'slug', current: SLUGS[l] } })),
    summary: [],
    seo: {
      ...(pub.seo || {}),
      metaTitle: loc3((l) => ({ _type: 'internationalizedArrayStringValue', value: parsed[l].metaTitle })),
      metaDescription: loc3((l) => ({ _type: 'internationalizedArrayTextValue', value: parsed[l].metaDescription })),
    },
    body: loc3((l) => ({ value: parsed[l].blocks })),
  };
  await client.createOrReplace(draft);
  console.log('Staged drafts.' + ID + ' — HOLD for founder approval (publish is a separate step)');
  console.log('  old slugs:', JSON.stringify((pub.slug || []).map((s: any) => s._key + ':' + s.value.current)));
  console.log('  new slugs:', JSON.stringify(SLUGS));
}
main().catch((e) => { console.error(e); process.exit(1); });
