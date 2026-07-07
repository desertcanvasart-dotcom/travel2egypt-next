/**
 * Complete the ticket-price cross-link mesh: all 12 pages link the other 11.
 *
 * - Legacy 9 pages (en/es/ja bodies): append bullets for the 3 pages created
 *   2026-07-07 (Esna, Edfu, Siwa) after the last existing cross-link bullet,
 *   using each locale's established anchor formula:
 *     en: "Price Table for Attractions in X"
 *     es: "Tabla de precios de las atracciones en X"
 *     ja: "Xの観光地料金表"
 * - New 3 pages (empty bodies): create an EN body with the Minya-convention
 *   "Explore Other Cities" h3 + 11 sibling bullets. ES/JA render it via the
 *   body EN-fallback; link URLs localize through the internalLink projection.
 *
 * Idempotent: bullets are only added for siblings not already linked.
 * Snapshots to backups/price-mesh-links-2026-07-07/.
 *   Dry run: npx tsx scripts/mesh-price-page-links.ts
 *   Apply:   npx tsx scripts/mesh-price-page-links.ts --apply
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const TOKEN = process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
const APPLY = process.argv.includes('--apply');
if (!TOKEN) { console.error('missing write token'); process.exit(1); }
const client = createClient({ projectId:'ufallvd2', dataset:'production', apiVersion:'2024-10-01', token: TOKEN, useCdn:false });

const PAGES: Record<string, { en: string; es: string; ja: string }> = {
  'wp-page-72292': { en: 'Alexandria', es: 'Alejandría', ja: 'アレクサンドリア' },
  'wp-page-72364': { en: 'Al Minya & Asyut', es: 'Al Minya y Asyut', ja: 'アル・ミニヤとアスユート' },
  'wp-page-72314': { en: 'Aswan', es: 'Asuán', ja: 'アスワン' },
  'wp-page-72323': { en: 'Beni Suef', es: 'Beni Suef', ja: 'ベニ・スエフ' },
  'wp-page-72325': { en: 'Cairo', es: 'El Cairo', ja: 'カイロ' },
  'wp-page-72327': { en: 'Giza', es: 'Guiza', ja: 'ギザ' },
  'wp-page-72343': { en: 'Luxor', es: 'Luxor', ja: 'ルクソール' },
  'wp-page-72338': { en: 'Qena', es: 'Qena', ja: 'ケナ' },
  'wp-page-72336': { en: 'Sohag', es: 'Sohag', ja: 'ソハグ' },
  'guideArticle.esna.ticket-prices-for-attractions-in-esna': { en: 'Esna', es: 'Esna', ja: 'エスナ' },
  'guideArticle.edfu.ticket-prices-for-attractions-in-edfu': { en: 'Edfu', es: 'Edfu', ja: 'エドフ' },
  'guideArticle.siwa-oasis.ticket-prices-for-attractions-in-siwa': { en: 'Siwa', es: 'Siwa', ja: 'シワ' },
};
const NEW_IDS = Object.keys(PAGES).filter((k) => k.startsWith('guideArticle.'));
const ANCHOR = {
  en: (n: string) => `Price Table for Attractions in ${n}`,
  es: (n: string) => `Tabla de precios de las atracciones en ${n}`,
  ja: (n: string) => `${n}の観光地料金表`,
} as const;

type Locale = 'en' | 'es' | 'ja';
interface Span { _type: string; _key: string; text?: string; marks?: string[] }
interface MarkDef { _type: string; _key: string; reference?: { _ref: string } }
interface Block { _type: string; _key: string; style?: string; listItem?: string; level?: number; children?: Span[]; markDefs?: MarkDef[] }

function linkBullet(target: string, text: string): Block {
  const short = target.replace(/[^a-z0-9]/gi, '').slice(-10);
  return {
    _type: 'block', _key: `mesh${short}`, style: 'normal', listItem: 'bullet', level: 1,
    children: [{ _type: 'span', _key: `mesh${short}s`, text, marks: [`mesh${short}m`] }],
    markDefs: [{ _type: 'internalLink', _key: `mesh${short}m`, reference: { _ref: target } }],
  };
}

async function main() {
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);
  const dir = path.join(process.cwd(), 'backups', 'price-mesh-links-2026-07-07');
  if (APPLY && !existsSync(dir)) mkdirSync(dir, { recursive: true });
  const allIds = Object.keys(PAGES);

  for (const id of allIds) {
    const doc: { _id: string; body?: Array<{ _key: string; value?: Block[] }> } | null =
      await client.fetch(`*[_id==$id][0]{ _id, body }`, { id });
    if (!doc) { console.log(`MISSING ${id}`); continue; }
    const isNew = NEW_IDS.includes(id);
    const locales: Locale[] = isNew ? ['en'] : ['en', 'es', 'ja'];
    const body = doc.body ?? [];

    for (const locale of locales) {
      let lang = body.find((b) => b._key === locale);
      const blocks: Block[] = lang?.value ? [...lang.value] : [];
      const linked = new Set(
        blocks.flatMap((b) => (b.markDefs ?? []))
          .filter((m) => m._type === 'internalLink' && m.reference && allIds.includes(m.reference._ref))
          .map((m) => m.reference!._ref),
      );
      const missing = allIds.filter((t) => t !== id && !linked.has(t));
      if (!missing.length) { continue; }

      const additions = missing.map((t) => linkBullet(t, ANCHOR[locale](PAGES[t][locale])));
      let next: Block[];
      if (isNew && blocks.length === 0) {
        next = [
          { _type: 'block', _key: 'meshhead', style: 'h3',
            children: [{ _type: 'span', _key: 'meshheads', text: 'Explore Other Cities', marks: [] }], markDefs: [] },
          ...additions,
        ];
      } else {
        // insert after the LAST existing sibling-link bullet
        let lastIdx = -1;
        blocks.forEach((b, i) => {
          if ((b.markDefs ?? []).some((m) => m._type === 'internalLink' && m.reference && allIds.includes(m.reference._ref) && b.listItem === 'bullet')) lastIdx = i;
        });
        if (lastIdx < 0) lastIdx = blocks.length - 1;
        next = [...blocks.slice(0, lastIdx + 1), ...additions, ...blocks.slice(lastIdx + 1)];
      }
      console.log(`${id} [${locale}]  +${additions.length} (${missing.map((m) => PAGES[m].en).join(', ')})`);
      if (APPLY) {
        writeFileSync(path.join(dir, `${id.replace(/[^a-z0-9.-]/gi, '_')}.${locale}.json`), JSON.stringify(blocks, null, 1));
        if (lang) {
          await client.patch(id).set({ [`body[_key=="${locale}"].value`]: next }).commit();
        } else {
          await client.patch(id).setIfMissing({ body: [] })
            .insert('after', 'body[-1]', [{ _key: locale, _type: 'object', value: next }]).commit();
        }
      }
    }
  }
  console.log('\ndone.');
}
main().catch((e) => { console.error(e); process.exit(1); });
