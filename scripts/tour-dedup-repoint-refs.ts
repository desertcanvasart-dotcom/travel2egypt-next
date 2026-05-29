/**
 * Re-points inbound references from retired old tour docs to their replacements,
 * so the old docs can be unpublished without breaking inbound links.
 *
 * References are inline `internalLink` annotations in portable-text bodies
 * (markDefs). We deep-walk each referencing doc, rewrite every reference._ref
 * that targets a retired doc to its mapped replacement, and write the whole
 * document back via createOrReplace — preserving every _key (we never touch the
 * MCP patch/markdown tools, which can regenerate keys).
 *
 * SET A old -> corpus tour id.   SET B old -> landing/tour id.
 * SET C ("delete entirely") has NO replacement and is intentionally excluded;
 * any inbound links to those are reported as MANUAL.
 *
 * DRY RUN by default. Pass --apply to write.
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();

const APPLY = process.argv.includes('--apply');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_STAGING_API_WRITE_TOKEN,
});

// old_en_slug -> target_en_slug  (SET A corpus twins + SET B landing/tour targets)
const TARGET_BY_OLD_SLUG: Record<string, string> = {
  // SET A
  'abu-simbel-by-plane-from-aswan': 'abu-simble-by-plane-from-aswan',
  'abu-simbel-car-day-tour-from-aswan': 'private-tour-abu-simble-by-bus-from-aswan',
  'alexandria-day-tour': 'alexandria-catacombs-pompeys-pillar-group-day-tour-from-cairo',
  'aswan-city-tour-from-marsa-alam-small-group-tour': 'aswan-city-tour-from-marsa-alam',
  'cairo-day-tour-from-alexandria': 'alexandria-to-cairo-private-day-tour-of-giza-pyramids-sphinx-egyptian-museum-khan-el-khalili',
  'group-trip-to-cairo-by-bus-from-hurghada': 'cairo-by-bus-group-day-tour-from-hurghada',
  'shared-snorkeling-day-at-giftun-island': 'giftun-island-shared-snorkeling-day-from-hurghada',
  'dendera-and-abydos-temples-tour-from-safaga': 'dendera-and-abydos-temples-day-tour',
  'desert-quad-bike-safari-from-hurghada': 'desert-quad-bike-safari-to-bedouin-village-from-hurghada',
  'group-day-tour-of-the-pyramids-and-sphinx': 'pyramids-of-giza-and-sphinx-group-day-tour',
  'karnak-luxor-temples-and-museum-day-tour': 'day-tour-to-karnak-luxor-temples-luxor-museum',
  'luxor-full-day-tour-from-hurghada': 'luxor-day-tour-from-hurghadafull-day',
  'group-tour-luxor-hurghada': 'luxor-highlights-group-day-tour-from-hurghada',
  'abu-simbel-temples-day-tour': 'abu-simbel-temples-day-tour-from-aswan',
  'private-snorkeling-adventure-in-marsa-alam': 'group-snorkeling-adventure-in-marsa-alam',
  'marsa-alam-to-cairo-small-group-tour-full-day-by-plane': 'marsa-alam-to-cairo-full-day-tour-by-plane',
  'memphis-saqqara-dahshur-tour-from-alexandria': 'private-day-trip-to-memphis-saqqara-and-dahshur-from-alexandria',
  'mount-sinai-sunrise-trek': 'mount-sinai-sunrise-trek-group-day-tour',
  'private-car-transfer-from-aswan-to-luxor': 'private-tour-transfer-from-aswan-to-luxor-by-bus',
  'esna-edfu-kom-ombo-day-tour': 'esna-edfu-kom-ombo-temples-group-day-tour-from-luxor',
  'group-day-tour-to-memphis-saqqara-and-dahshur': 'memphis-saqqara-and-dahshur-group-day-tour',
  'dendera-and-abydos-temples-from-hurghada': 'dendera-and-abydos-temple-day-tour-from-hurghada',
  'private-tour-transfer-from-luxor-to-hurghada-by-car': 'private-tour-transfer-from-luxor-to-hurghada-by-bus',
  'pyramids-of-giza-sphinx-memphis-and-saqqara-tour': 'private-tour-pyramids-of-giza-sphinx-memphis-and-saqqara',
  'pyramids-of-giza-sphinx-egyptian-museum-khan-el-khalili-tour': 'private-tour-pyramids-of-giza-sphinx-egyptian-museum-and-khan-el-khalili-bazaar',
  'snorkeling-sea-trip-in-sharm-el-sheikh': 'diving-sea-trip-in-sharm-el-sheikh',
  'temples-of-time-day-tour-to-nubian-temples-from-aswan': 'nubian-temples-day-tour-from-aswan',
  'desert-rides-hurghada-quad-bike-adventure': 'hurghada-quad-bike-tour',
  'the-grand-west-bank-tour': 'grand-west-bank-group-day-tour-luxor',
  'cairo-group-tour': 'private-tour-pyramids-of-giza-sphinx-egyptian-museum-and-khan-el-khalili-bazaar',
  'day-tour-to-visit-cairo-from-alexandria': 'alexandria-to-cairo-private-day-tour-of-giza-pyramids-sphinx-egyptian-museum-khan-el-khalili',
  'bahariya-oasis-and-white-desert-3-day-tour': 'the-white-desert-and-djara-cave',
  'half-day-tour-of-luxor-karnak-temples': 'day-tour-to-karnak-luxor-temples-luxor-museum',
  'fayoum-oasis-and-beni-suef-pyramids-tour': 'fayoum-meidum-hawara-pyramids-group-day-tour',
  'dendera-and-abydos-temple-tour-hurghada': 'dendera-and-abydos-temple-day-tour-from-hurghada',
  'group-day-tour-to-kom-ombo-and-edfu-temples-from-aswan': 'esna-edfu-kom-ombo-temples-group-day-tour-from-luxor',
  'private-tour-valley-of-kings-temples-day-tour': 'grand-west-bank-group-day-tour-luxor',
  // SET B
  '11-day-luxor-to-cairo-egypt-nile-cruise-vacation': 'egypt-group-tours-from-usa-canada',
  '12-day-red-sea-desert-friends-escape': 'egypt-and-the-red-sea-paradise',
  'group-day-trip-to-cairo-from-safaga': 'hurghada-small-group-day-tours',
  'group-day-tour-to-cairo-from-al-gouna': 'hurghada-small-group-day-tours',
  '5-days-cairo-luxor-romance-edition': 'marriott-mena-house-4-days-stay',
  '9-days-cairo-st-catherine-sharm-el-sheikh': '11-day-explore-egypt-and-red-sea-tour',
  '9-days-red-sea-desert-escape': 'multiday-adventure-and-safari-tours',
  'cairo-in-3-days-insider-edition-solo-traveller': 'the-elegant-cairo-4-days-tour',
  'desert-oasis-siwa-retreat-solo-traveller': '3-day-siwa-journey-from-alexandria',
  'nile-in-5-days-luxor-aswan-solo-traveller': '5-day-river-cruise-from-luxor',
  // SET D: doc-backed "unpublish & redirect" (es/ja null). The other SET D
  // sources are legacy URLs with no Sanity doc → redirect-only, nothing to repoint.
  'nile-love-journey-luxor-aswan': '5-day-river-cruise-from-luxor',
  // SET D reversal: the freshly-authored nubian-life tour became canonical, so
  // the old private-tour-nubian-village doc is now the duplicate → consolidate
  // into the new tour.
  'private-tour-nubian-village-with-motor-boat': 'nubian-life-private-nubian-village-and-nile-tour-with-motor-boat',
};

// SET C: retired with no replacement. Inbound links reported as MANUAL.
const SET_C_OLD_SLUGS = new Set([
  'luxor-to-cairo-egypt-nile-cruise-vacation', 'egypt-nile-cruise-vacation-from-india',
  '18-day-grand-egypt-holiday-package', '8-day-customized-aswan-travel-deal',
  'egypt-escape-4-day-cairo-travel-package-from-australia', '4-day-cairo-travel-package',
  '10-day-romantic-egypt-travel-deals', '3-days-cairo-highlights-for-friends',
]);

async function idForSlug(en: string): Promise<string | null> {
  const d = await client.fetch<{ _id: string } | null>(
    `*[!(_id in path("drafts.**")) && slug[_key=="en"][0].value.current==$s][0]{_id}`,
    { s: en }
  );
  return d?._id ?? null;
}

/** Recursively rewrite reference._ref values found inside internalLink nodes. */
function repointInternalLinks(
  node: unknown,
  map: Map<string, string>,
  manual: Set<string>,
): number {
  let changed = 0;
  if (Array.isArray(node)) {
    for (const item of node) changed += repointInternalLinks(item, map, manual);
    return changed;
  }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, any>;
    if (obj._type === 'internalLink' && obj.reference && typeof obj.reference._ref === 'string') {
      const oldRef = obj.reference._ref as string;
      const newRef = map.get(oldRef);
      if (newRef) {
        obj.reference._ref = newRef;
        changed++;
      } else if (manual.has(oldRef)) {
        // SET C target — no replacement; leave as-is and let caller report.
      }
    }
    for (const k of Object.keys(obj)) {
      if (k === 'reference' && obj._type === 'internalLink') continue; // handled above
      changed += repointInternalLinks(obj[k], map, manual);
    }
  }
  return changed;
}

/** Count any reference._ref (anywhere) equal to one of the given ids, split by internalLink vs other. */
function auditRefs(node: unknown, ids: Set<string>, acc: { link: number; other: number }, inLink = false): void {
  if (Array.isArray(node)) { for (const i of node) auditRefs(i, ids, acc, inLink); return; }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, any>;
    const nowInLink = inLink || obj._type === 'internalLink';
    if (typeof obj._ref === 'string' && ids.has(obj._ref)) {
      if (nowInLink) acc.link++; else acc.other++;
    }
    for (const k of Object.keys(obj)) auditRefs(obj[k], ids, acc, nowInLink);
  }
}

async function main() {
  console.log(APPLY ? '*** APPLY MODE ***' : '--- DRY RUN (pass --apply to write) ---');

  // Resolve old-id -> new-id and old-id sets.
  const idMap = new Map<string, string>(); // oldId -> newId
  const manualIds = new Set<string>(); // SET C old ids
  for (const [oldSlug, tgtSlug] of Object.entries(TARGET_BY_OLD_SLUG)) {
    const [oldId, newId] = await Promise.all([idForSlug(oldSlug), idForSlug(tgtSlug)]);
    if (!oldId) { console.error(`!! old missing: ${oldSlug}`); continue; }
    if (!newId) { console.error(`!! target missing: ${tgtSlug}`); continue; }
    idMap.set(oldId, newId);
  }
  for (const s of SET_C_OLD_SLUGS) { const id = await idForSlug(s); if (id) manualIds.add(id); }

  const allOldIds = new Set<string>([...idMap.keys(), ...manualIds]);

  // Find every published doc referencing any retired old id.
  const referencing = await client.fetch<Array<{ _id: string; _type: string }>>(
    `*[!(_id in path("drafts.**")) && references($ids)]{_id, _type}`,
    { ids: [...allOldIds] }
  );
  console.log(`Referencing docs: ${referencing.length}`);

  let docsToWrite = 0, totalLinks = 0, manualHits = 0;
  for (const { _id } of referencing) {
    const doc = await client.getDocument(_id);
    if (!doc) continue;
    // Audit for non-internalLink refs (would need manual handling).
    const audit = { link: 0, other: 0 };
    auditRefs(doc, allOldIds, audit);
    const manualAudit = { link: 0, other: 0 };
    auditRefs(doc, manualIds, manualAudit);

    const changed = repointInternalLinks(doc, idMap, manualIds);
    totalLinks += changed;
    if (manualAudit.link > 0) manualHits += manualAudit.link;
    const notes: string[] = [];
    if (audit.other > 0) notes.push(`NON-LINK-REFS=${audit.other}`);
    if (manualAudit.link > 0) notes.push(`SET-C-LINKS=${manualAudit.link}(manual)`);
    if (changed > 0 || notes.length) {
      console.log(`  ${_id} [${(doc as any)._type}] repoint=${changed} ${notes.join(' ')}`);
    }
    if (changed > 0) {
      docsToWrite++;
      if (APPLY) await client.createOrReplace(doc as any);
    }
  }

  console.log(`\nDocs ${APPLY ? 'rewritten' : 'to rewrite'}=${docsToWrite} internalLinks-repointed=${totalLinks} SET-C-links-left=${manualHits}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
