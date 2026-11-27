/**
 * Group day tours booked on Sawa (owner, 27 Nov 2026): each Travel2Egypt group tour that runs on
 * sawa.tours (our group-tours site) gets `sawaUrl`, and its booking buttons then go to the same tour
 * on Sawa instead of opening our enquiry form (needs the code from feat/sawa-group-linkout).
 *
 * SHIP DATE 14 Dec 2026, not before: the buying-path freeze runs to 13 Dec (measurement read on
 * 14 Dec). Run AFTER the code PR is merged and deployed.
 *
 * Price (owner, 27 Nov): Sawa's rate for 4 travellers, the GoAhead minimum. It is read LIVE from
 * each Sawa page at run time (JSON-LD TouristTrip offers.highPrice = the 4-seat tier; Sawa's tiers
 * fall from 4 to 8 seats, e.g. Giza €43 for 4 → €29 for 8) and written as priceFrom. Sawa shows one price in every language, so guideLanguagePrices is removed.
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
  // Group packages (owner, 27 Nov: they follow Sawa's trips; rebuilt 28 Nov, PR #414).
  '9-day-egypt-group-tour-cairo-abu-simbel-nile': 'package/egypt-in-depth-9-day-nile-cruise-cairo',
  // 12-day: switch on once Sawa's "Egypt End to End" has the owner's changes (dahabiya, Abu Simbel by air, Karnak on Day 7).
  //   '12-day-egypt-group-tour-cairo-dahabiya-red-sea': 'package/egypt-end-to-end-cairo-nile-cruise-hurghada-12-days',
  // 10-day: once it is created on Sawa.
  //   '10-day-egypt-group-tour-cairo-nile-red-sea'
  // Owner, 27 Nov: Esna, Edfu & Kom Ombo above is the same trip as Sawa's Luxor → Aswan road.
  //
  // Owner, 27 Nov: every T2E group tour not yet on Sawa will be created there. Add each line here
  // once its Sawa page exists (the script checks the page and reads its price):
  //   'dendera-and-abydos-temple-day-tour-from-hurghada'  (NOT Sawa's Dendera & Abydos from Luxor, a different trip)
  //   'luxor-highlights-group-day-tour-from-hurghada'
  //   'cairo-by-bus-group-day-tour-from-hurghada'
  //   'dolphins-dance-group-shared-seas-full-day-snorkeling-tour'
  //   'giftun-island-shared-snorkeling-day-from-hurghada'
  //   'safaga-to-luxor-full-day-group-ancient-city-adventure'
  //   'group-snorkeling-adventure-in-marsa-alam'  (our page is a private product today: needs group copy + tourMode group)
  //   'nubian-temples-day-tour-from-aswan'
  //   'dahab-blue-hole-desert-snorkel-group-day-tour-from-sharm'
  //   'jerusalem-dead-sea-bethlehem-group-day-tour-from-sharm'
  //   'mount-sinai-sunrise-trek-group-day-tour'
  //   'mount-sinai-and-st-catherine-full-day-tour-from-sharm'
};

// The owner-approved "Book this trip" paragraph (27 Nov), the same in every group package.
const BOOK_THIS_TRIP = {
  en: 'This tour runs as a shared departure on Sawa, our group-tours site. Pick a date, hold a seat at no cost, and pay once the date has four travellers. If no date suits you, you can propose your own.',
  es: 'Este tour sale como salida compartida en Sawa, nuestra web de tours en grupo. Elige una fecha, reserva tu plaza sin coste y paga cuando la fecha tenga cuatro viajeros. Si ninguna fecha te viene bien, puedes proponer la tuya.',
  ja: 'このツアーは、当社のグループツアー専用サイトSawaで、他の参加者と同じ出発日に参加する形で催行します。日程を選んで無料で席を確保し、その日程の参加者が4名に達した時点でお支払いください。ご都合の合う日程がない場合は、ご希望の日程をご提案いただけます。',
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
    const four = trip?.offers?.highPrice;
    if (typeof four === 'number' && four > 0) return { url, four, eight: low, name: trip.name };
  }
  throw new Error(`${url}: no TouristTrip offers.highPrice in the page`);
}

const entries = Object.entries(MAP).filter(([s]) => !only || s === only);
if (only && entries.length === 0) throw new Error(`--only ${only}: not in MAP`);
const plan = [];
for (const [slug, path] of entries) {
  const doc = await client.fetch(
    '*[_type == "tour" && !(_id in path("drafts.**")) && slug[_key == "en"][0].value.current == $slug][0]{_id, tourMode, type, priceFrom, guideLanguagePrices, sawaUrl, itineraryIntro, "deps": count(departures), "title": title[_key == "en"][0].value}',
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
  plan.push({ doc, set: { sawaUrl: s.url, priceFrom: s.four } });
  if (doc.type === 'package') console.log(`  package: ${doc.deps ?? 0} departure date(s) removed; "Book this trip" text written`);
  console.log(`${slug}\n  ${doc.title}\n  → ${s.url} (${s.name})\n  From: €${doc.priceFrom ?? '—'} (ES/JA ${JSON.stringify(doc.guideLanguagePrices ?? null)}) → €${s.four} (Sawa, group of 4; €${s.eight} with 8)`);
}

if (!apply) {
  console.log(`\ndry run: ${plan.length} tour(s). Pass --apply to write production (on/after 14 Dec 2026, after the code is deployed).`);
  process.exit(0);
}
await writeRollback(client, plan.map((p) => p.doc._id), undo ? 'before-sawa-unlink' : 'before-sawa-link');
for (const { doc, set } of plan) {
  const tx = client.patch(doc._id);
  if (set && doc.type === 'package') {
    // Dates live on Sawa; the approved "Book this trip" paragraph (review/locked/*-group-*.md, last section) goes in
    // the itinerary's closing block.
    const intro = (doc.itineraryIntro ?? []).map((it) => ({ ...it, makeItYoursIntro: BOOK_THIS_TRIP[it.lang] ?? it.makeItYoursIntro }));
    await tx.set({ ...set, itineraryIntro: intro, departures: [] }).unset(['guideLanguagePrices']).commit();
  } else if (set) await tx.set(set).unset(['guideLanguagePrices']).commit();
  else await tx.unset(['sawaUrl']).commit();
  console.log(`APPLIED ${doc._id}`);
}
