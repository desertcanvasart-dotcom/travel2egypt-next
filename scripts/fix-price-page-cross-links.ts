/**
 * Price-page series: repair the "Explore Other Cities" cross-link bullets.
 *
 * Every ticket-price page carries a 12-bullet list of sibling price pages.
 * State before this fix: 7 pages x3 locales point at raw legacy
 * http://travel2egypt.org/... URLs; Alexandria/Giza EN are a half-fixed mix
 * (internal hrefs, internalLink refs, dead "/guide" stubs, one NOLINK self);
 * 3 targets (Al Sharqia, Western Desert, Red Sea & Sinai) no longer exist
 * anywhere and have no redirects.
 *
 * Fix per page x locale (owner instruction 2026-07-06):
 *   - DROP bullets for the 3 dead regional pages and the page's own self-link.
 *   - REWIRE the remaining sibling bullets as internalLink annotations to the
 *     sibling doc (renderer resolves + localizes the URL per locale).
 *   - Anchor text preserved verbatim per locale. Nothing else in the body is
 *     touched. Only bullets whose link/text matches the ticket-price pattern
 *     are considered.
 *
 * Snapshots per doc+locale to backups/price-explore-links-2026-07-06/.
 *   Dry run: npx tsx scripts/fix-price-page-cross-links.ts
 *   Apply:   npx tsx scripts/fix-price-page-cross-links.ts --apply
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const TOKEN = process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
const APPLY = process.argv.includes('--apply');
if (!TOKEN) { console.error('missing write token'); process.exit(1); }
const client = createClient({ projectId:'ufallvd2', dataset:'production', apiVersion:'2024-10-01', token: TOKEN, useCdn:false });

// slug fragment (as it appears in hrefs) -> target doc id; null = dead page.
const TARGETS: Record<string, string | null> = {
  'ticket-prices-for-attractions-in-alexandria': 'wp-page-72292',
  'ticket-prices-for-attractions-in-al-minya-asyut': 'wp-page-72364',
  'ticket-prices-for-attractions-in-al-minya': 'wp-page-72364', // historic short slug
  'ticket-prices-for-attractions-in-aswan': 'wp-page-72314',
  'ticket-prices-for-attractions-in-beni-suef': 'wp-page-72323',
  'ticket-prices-for-attractions-in-cairo': 'wp-page-72325',
  'ticket-prices-for-attractions-in-giza': 'wp-page-72327',
  'ticket-prices-for-attractions-in-sohag': 'wp-page-72336',
  'ticket-prices-for-attractions-in-qena': 'wp-page-72338',
  'ticket-prices-for-attractions-in-luxor': 'wp-page-72343',
  'ticket-prices-for-attractions-in-al-sharqia': null,
  'ticket-prices-for-attractions-in-western-desert': null,
  'ticket-prices-for-attractions-in-red-sea-sinai': null,
};
// EN anchor-text fallback for bullets with no usable link (e.g. Giza's self).
const EN_TEXT_TARGET: Record<string, string | null> = {
  'alexandria': 'wp-page-72292', 'al minya & asyut': 'wp-page-72364',
  'aswan': 'wp-page-72314', 'beni suef': 'wp-page-72323', 'cairo': 'wp-page-72325',
  'giza': 'wp-page-72327', 'sohag': 'wp-page-72336', 'qena': 'wp-page-72338',
  'luxor': 'wp-page-72343', 'al sharqia': null, 'western desert': null, 'red sea & sinai': null,
};
// JA bullets carry percent-encoded Japanese-slug hrefs; classify by the
// anchor pattern "<city>の観光地料金表" instead.
const JA_TEXT_TARGET: Record<string, string | null> = {
  'アレクサンドリア': 'wp-page-72292', 'アル・ミニヤとアスユート': 'wp-page-72364',
  'アスワン': 'wp-page-72314', 'ベニ・スエフ': 'wp-page-72323', 'カイロ': 'wp-page-72325',
  'ギザ': 'wp-page-72327', 'ソハグ': 'wp-page-72336', 'ケナ': 'wp-page-72338',
  'ルクソール': 'wp-page-72343', 'アル・シャルキヤ': null, '西部砂漠': null, '紅海・シナイ': null,
};
const DOC_IDS = ['wp-page-72364','wp-page-72292','wp-page-72314','wp-page-72323','wp-page-72325','wp-page-72327','wp-page-72343','wp-page-72338','wp-page-72336'];

type Span = { _type: string; _key: string; text?: string; marks?: string[] };
type MarkDef = { _type: string; _key: string; href?: string; reference?: { _ref: string } };
type Block = { _type: string; _key: string; listItem?: string; style?: string; children?: Span[]; markDefs?: MarkDef[] };

function classify(b: Block, selfId: string, locale: string): { action: 'drop'|'rewire'; target?: string } | null {
  const text = (b.children ?? []).map((c) => c.text ?? '').join('').trim();
  const md = (b.markDefs ?? []).find((m) => m.href || m.reference);
  let target: string | null | undefined;
  if (md?.href) {
    const frag = md.href.match(/ticket-prices-for-attractions-in-[a-z-]+/)?.[0];
    if (frag && frag in TARGETS) target = TARGETS[frag];
    else if (md.href === '/guide' && locale === 'en') target = EN_TEXT_TARGET[text.replace(/^price table for attractions in /i, '').toLowerCase()] ?? undefined;
  } else if (md?.reference?._ref) {
    const ref = md.reference._ref;
    if (DOC_IDS.includes(ref)) target = ref;
  }
  if (target === undefined && /^price table for attractions in /i.test(text)) {
    target = EN_TEXT_TARGET[text.replace(/^price table for attractions in /i, '').toLowerCase()];
  }
  if (target === undefined && text.endsWith('の観光地料金表')) {
    target = JA_TEXT_TARGET[text.slice(0, -'の観光地料金表'.length)];
  }
  if (target === undefined) return null;          // not a cross-link bullet
  if (target === null) return { action: 'drop' };  // dead page
  if (target === selfId) return { action: 'drop' }; // self-link
  return { action: 'rewire', target };
}

async function main() {
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);
  const dir = path.join(process.cwd(), 'backups', 'price-explore-links-2026-07-06');
  if (APPLY && !existsSync(dir)) mkdirSync(dir, { recursive: true });

  for (const id of DOC_IDS) {
    const ids = [id, `drafts.${id}`];
    const docs: Array<{ _id: string; body: Array<{ _key: string; value: Block[] }> }> =
      await client.fetch(`*[_id in $ids]{ _id, body }`, { ids });
    for (const doc of docs) {
      for (const lang of doc.body ?? []) {
        const locale = lang._key;
        const blocks = lang.value ?? [];
        let dropped = 0, rewired = 0;
        const next: Block[] = [];
        for (const b of blocks) {
          if (b._type !== 'block' || b.listItem !== 'bullet') { next.push(b); continue; }
          const c = classify(b, id, locale);
          if (!c) { next.push(b); continue; }
          if (c.action === 'drop') { dropped++; continue; }
          const text = (b.children ?? []).map((s) => s.text ?? '').join('');
          const mk = `xl${c.target!.replace(/[^0-9]/g, '')}`;
          next.push({
            ...b,
            children: [{ _type: 'span', _key: `${b._key}s`, text, marks: [mk] }],
            markDefs: [{ _type: 'internalLink', _key: mk, reference: { _ref: c.target! } } as MarkDef],
          });
          rewired++;
        }
        if (dropped + rewired === 0) continue;
        console.log(`${doc._id} [${locale}]  rewired ${rewired}, dropped ${dropped}`);
        if (APPLY) {
          writeFileSync(path.join(dir, `${doc._id.replace(/[^a-z0-9.-]/gi,'_')}.${locale}.json`), JSON.stringify(blocks, null, 1));
          await client.patch(doc._id).set({ [`body[_key=="${locale}"].value`]: next }).commit();
        }
      }
    }
  }
  console.log('\ndone.');
}
main().catch((e) => { console.error(e); process.exit(1); });
