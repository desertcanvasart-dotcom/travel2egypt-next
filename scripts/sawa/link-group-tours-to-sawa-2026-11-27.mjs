/**
 * Group day tours booked on Sawa (owner, 27 Nov 2026): each Travel2Egypt group tour that runs on
 * sawa.tours (our group-tours site) gets `sawaUrl`, and its booking buttons then go to the same tour
 * on Sawa instead of opening our enquiry form (needs the code from feat/sawa-group-linkout).
 *
 * SHIP DATE 14 Dec 2026, not before: the buying-path freeze runs to 13 Dec (measurement read on
 * 14 Dec). Run AFTER the code PR is merged and deployed.
 *
 * Price: Sawa's price is read LIVE from each Sawa page at run time (its JSON-LD TouristTrip
 * offers.lowPrice = the price with a full group of 8, the same From rule as our own tours) and
 * written as priceFrom. Sawa shows one price in every language, so guideLanguagePrices is removed.
 * The page keeps its own title, copy, URL and indexing.
 *
 *   node --env-file=<.env> scripts/sawa/link-group-tours-to-sawa-2026-11-27.mjs            # dry run
 *   node --env-file=<.env> scripts/sawa/link-group-tours-to-sawa-2026-11-27.mjs --apply    # write production
 *   ... --only <t2e-slug>                                                                    # one tour
 *   ... --undo   # remove sawaUrl again (prices: restore from the rollback snapshot)
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';

// Travel2Egypt EN slug → Sawa tour (checked 27 Nov 2026 against sawa.tours/sitemap.xml).
const MAP = {
  'pyramids-of-giza-and-sphinx-group-day-tour': 'tour/giza-uncovered-pyramids-sphinx-stories-from-cairo',
  'memphis-saqqara-and-dahshur-group-day-tour': 'tour/memphis-saqqara-dahshur-birth-pyramid-from-cairo',
  'fayoum-meidum-hawara-pyramids-group-day-tour': 'tour/fayoum-oasis-meidum-hawara-pyramids-full-day-tour-from-cairo',
  'alexandria-catacombs-pompeys-pillar-group-day-tour-from-cairo': 'tour/cairo-to-alexandria-mediterranean-day-tour',
  'grand-west-bank-group-day-tour-luxor': 'tour/grand-west-bank-tombs-temples-deir-el-medina-from-luxor',
  'esna-edfu-kom-ombo-temples-group-day-tour-from-luxor': 'tour/luxor-to-aswan-esna-edfu-kom-ombo-temple-road',
  'abu-simbel-temples-day-tour-from-aswan': 'tour/aswan-to-abu-simbel-temples-ramses-ii-nefertari',
  'dolphin-house-shared-snorkeling-day-from-hurghada': 'tour/dolphin-house-adventure-snorkeling-wild-dolphins-from-hurghada',
  // HELD: Sawa's Dendera & Abydos leaves from Luxor, ours from Hurghada. Owner to confirm it is the
  // same trip before this line is switched on.
  // 'dendera-and-abydos-temple-day-tour-from-hurghada': 'tour/dendera-abydos-far-temples-north-luxor',
};

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const undo = args.includes('--undo');
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const token = process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN;
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token, useCdn: false });

async function sawaPrice(path) {
  const url = `https://sawa.tours/${path}`;
  const res = await fetch(url, { headers: { 'user-agent': 'travel2egypt-sawa-link/1.0' } });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const html = await res.text();
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    const graph = JSON.parse(m[1])['@graph'] ?? [];
    const trip = graph.find((n) => n['@type'] === 'TouristTrip' && n.url === url);
    const low = trip?.offers?.lowPrice;
    if (typeof low === 'number' && low > 0) return { url, low, high: trip.offers.highPrice, name: trip.name };
  }
  throw new Error(`${url}: no TouristTrip offers.lowPrice in the page`);
}

const entries = Object.entries(MAP).filter(([s]) => !only || s === only);
if (only && entries.length === 0) throw new Error(`--only ${only}: not in MAP`);
const plan = [];
for (const [slug, path] of entries) {
  const doc = await client.fetch(
    '*[_type == "tour" && !(_id in path("drafts.**")) && slug[_key == "en"][0].value.current == $slug][0]{_id, tourMode, type, priceFrom, guideLanguagePrices, sawaUrl, "title": title[_key == "en"][0].value}',
    { slug },
  );
  if (!doc) throw new Error(`${slug}: no published tour`);
  if (doc.tourMode !== 'group') throw new Error(`${slug}: tourMode is ${doc.tourMode}, not group`);
  if (await client.getDocument(`drafts.${doc._id}`)) console.log(`  note: drafts.${doc._id} exists (left as it is)`);
  if (undo) {
    plan.push({ doc, set: null });
    console.log(`UNDO ${slug}: remove sawaUrl ${doc.sawaUrl ?? '(none)'}`);
    continue;
  }
  const s = await sawaPrice(path);
  plan.push({ doc, set: { sawaUrl: s.url, priceFrom: s.low } });
  console.log(`${slug}\n  ${doc.title}\n  → ${s.url} (${s.name})\n  From: €${doc.priceFrom ?? '—'} (ES/JA ${JSON.stringify(doc.guideLanguagePrices ?? null)}) → €${s.low} (Sawa, group of 8; up to €${s.high})`);
}

if (!apply) {
  console.log(`\ndry run: ${plan.length} tour(s). Pass --apply to write production (on/after 14 Dec 2026, after the code is deployed).`);
  process.exit(0);
}
await writeRollback(client, plan.map((p) => p.doc._id), undo ? 'before-sawa-unlink' : 'before-sawa-link');
for (const { doc, set } of plan) {
  const tx = client.patch(doc._id);
  if (set) await tx.set(set).unset(['guideLanguagePrices']).commit();
  else await tx.unset(['sawaUrl']).commit();
  console.log(`APPLIED ${doc._id}`);
}
