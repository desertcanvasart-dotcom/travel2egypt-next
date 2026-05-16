#!/usr/bin/env node
/**
 * Session 39 — Create FAQ content: 7 faqCategory docs + 24 faqEntry docs.
 *
 * Source copy: migration/content/faq-prep.md (operator polished, FINAL).
 * Visa fee corrected to USD 30 per operator instruction in the session 39
 * brief (prep file still said USD 25).
 *
 * Usage:
 *   node scripts/import-faq.mjs            # dry-run
 *   node scripts/import-faq.mjs --commit   # write to Sanity
 */
import { createClient } from '@sanity/client';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function findEnv(start) {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, '.env');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error('Could not locate a .env file walking up from ' + start);
}
const envPath = findEnv(ROOT);
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => {
    const i = l.indexOf('=');
    return [l.slice(0, i), l.slice(i + 1).replace(/^['"]|['"]$/g, '')];
  })
);
const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});
const COMMIT = process.argv.includes('--commit');

const k = () => randomBytes(6).toString('hex');

/** Build a PT block. Supports **bold**, *italic*, [text](url) links. */
function ptBlock(text, style = 'normal', listItem) {
  const markDefs = [];
  const spans = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) spans.push({ text: text.slice(last, m.index), marks: [] });
    if (m[1] !== undefined) {
      const key = k();
      const href = m[2];
      const inPlace = href.startsWith('mailto:') || href.startsWith('tel:');
      markDefs.push({ _type: 'externalLink', _key: key, href, newTab: !inPlace });
      spans.push({ text: m[1], marks: [key] });
    } else if (m[3] !== undefined) {
      spans.push({ text: m[3], marks: ['strong'] });
    } else if (m[4] !== undefined) {
      spans.push({ text: m[4], marks: ['em'] });
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) spans.push({ text: text.slice(last), marks: [] });
  if (spans.length === 0) spans.push({ text, marks: [] });
  const block = {
    _type: 'block',
    _key: k(),
    style,
    markDefs,
    children: spans.map((s) => ({ _type: 'span', _key: k(), text: s.text, marks: s.marks })),
  };
  if (listItem) {
    block.listItem = listItem;
    block.level = 1;
  }
  return block;
}
const p = (t) => ptBlock(t);
const li = (t) => ptBlock(t, 'normal', 'bullet');
const num = (t) => ptBlock(t, 'normal', 'number');

const i18nText = (value) => [{ _key: 'en', value }];
const i18nPt = (blocks) => [{ _key: 'en', _type: 'object', value: blocks }];
const slugField = (current) => [{ _key: 'en', value: { _type: 'slug', current } }];

// ── Categories ──────────────────────────────────────────────────
const CATEGORIES = [
  { slug: 'planning-your-visit', name: 'Planning Your Visit' },
  { slug: 'money-and-payments', name: 'Money & Payments' },
  { slug: 'health-and-safety', name: 'Health & Safety' },
  { slug: 'practical-essentials', name: 'Practical Essentials' },
  { slug: 'culture-and-language', name: 'Culture & Language' },
  { slug: 'avoiding-hassles', name: 'Avoiding Hassles' },
  { slug: 'booking-with-travel2egypt', name: 'Booking with Travel2Egypt' },
];

// ── Entries ─────────────────────────────────────────────────────
// Each: { cat, slug, question, answer: [blocks] }
const ENTRIES = [
  {
    cat: 'planning-your-visit',
    slug: 'when-is-the-best-time-to-visit-egypt',
    question: 'When is the best time to visit Egypt?',
    answer: [
      p('October through April is the sweet spot for most travelers. Temperatures are comfortable (20-30°C / 68-86°F), and the climate works for everything from Cairo sightseeing to desert excursions to Nile cruises.'),
      p('Within that window:'),
      li('**November to February** — coolest and busiest. Christmas/New Year is peak season; book months ahead and expect higher rates.'),
      li('**March-April and October** — shoulder months. Warm but not hot, lighter crowds, often the best balance.'),
      p('**May to September** is hot, especially in Upper Egypt (Luxor, Aswan, Abu Simbel) where afternoon temperatures regularly hit 40°C+. Not impossible — locals do it — but expect to plan around mornings and evenings, with afternoons reserved for shade or pool.'),
      p('If you want specifics for your dates, we can shape an itinerary around the realities of that season.'),
    ],
  },
  {
    cat: 'planning-your-visit',
    slug: 'do-i-need-a-visa-for-egypt',
    question: 'Do I need a visa for Egypt?',
    answer: [
      p('Most travelers do. Three paths depending on nationality:'),
      li('**e-Visa** (recommended for most) — apply online at the official portal before travel. USD 30 for single-entry, processed in days. Avoids airport queues.'),
      li('**Visa on arrival** — many nationalities can buy a visa for USD 30 cash at major airports. Quick but adds 20-40 minutes to your arrival.'),
      li('**Visa exemption** — citizens of certain countries can enter without a visa for short stays. Check current rules for your passport.'),
      p('Passport validity: at least 6 months from the date of entry, regardless of visa type.'),
      p('A recent initiative allows travelers flying directly into Luxor or Aswan airports (May-October) to enter visa-free. Worth checking if your itinerary fits.'),
      p('Always verify on the [official Egyptian e-Visa portal](https://visa2egypt.gov.eg/) — rules and fees change.'),
    ],
  },
  {
    cat: 'money-and-payments',
    slug: 'what-currency-does-egypt-use',
    question: 'What currency does Egypt use, and how should I pay for things?',
    answer: [
      p('The Egyptian Pound (EGP). Cash is still king for most day-to-day purchases — taxis, tipping, small shops, local markets. Larger hotels, restaurants, and tourist shops accept credit cards (Visa and Mastercard widely; Amex less so).'),
      p('ATMs are common in cities and tourist areas; you can withdraw EGP with international cards. Bring some USD or EUR as backup, exchangeable at hotels, banks, or official exchange offices. Avoid street money-changers.'),
      p('Carry small bills constantly. Tipping is expected, taxi drivers rarely have change for large notes, and many small purchases will cost less than the smallest bill in your wallet.'),
    ],
  },
  {
    cat: 'money-and-payments',
    slug: 'are-credit-cards-accepted-everywhere',
    question: 'Are credit cards accepted everywhere?',
    answer: [
      p('In Cairo, Luxor, Aswan, and Red Sea resort cities: most hotels, mid-range and upscale restaurants, and larger shops accept Visa and Mastercard. Amex less so.'),
      p("Where cards don't work or work unreliably:"),
      li('Local markets and souks'),
      li('Small restaurants and cafes'),
      li('Taxis (almost always cash)'),
      li('Tipping (always cash)'),
      li('Some museum entrance booths (varies)'),
      li('Smaller cities and oases'),
      p('Plan for cash for the everyday stuff. Use cards for major hotel bills, larger meals, and substantial purchases.'),
    ],
  },
  {
    cat: 'money-and-payments',
    slug: 'how-does-tipping-work-in-egypt',
    question: 'How does tipping work in Egypt?',
    answer: [
      p("Tipping (*baksheesh*) is woven into daily life and isn't optional in most service contexts. Some rough guidelines:"),
      li("**Restaurants** — 10% if service isn't included; check the bill, sometimes it's added automatically"),
      li('**Hotel housekeeping** — EGP 20-50 per day, left in the room'),
      li('**Bellboy / porter** — EGP 20-50 per bag'),
      li('**Drivers** — EGP 50-100 per day for a private driver'),
      li('**Guides** — EGP 200-500+ per day, depending on length and quality'),
      li('**Restroom attendants, parking helpers, etc.** — EGP 5-10'),
      p('Carry small bills constantly. Trying to break a large note for a tip is a frequent and avoidable frustration.'),
    ],
  },
  {
    cat: 'money-and-payments',
    slug: 'how-much-should-i-budget-per-day',
    question: 'How much should I budget per day?',
    answer: [
      p('Highly variable. Rough orders of magnitude in USD per person per day, excluding flights to Egypt:'),
      li("**Budget traveler** — USD 30-60 (hostels, public transport, local food). Doable, but you'll miss most of why people come to Egypt."),
      li('**Mid-range** — USD 100-180 (3-4 star hotels, private guide for site visits, mix of local and tourist restaurants). What most independent travelers spend.'),
      li('**Comfort / Boutique** — USD 200-400 (4-5 star hotels, private guides and drivers, better restaurants, Nile cruise mid-tier cabin).'),
      li('**Luxury** — USD 500-1500+ (5-star hotels, dahabiya cruises, private boats, premium guides).'),
      p("This excludes the cost of organized tours and big-ticket experiences (hot air balloon, Abu Simbel day trips, etc.). If you're traveling with us, your itinerary includes most operational costs — your daily out-of-pocket is mainly meals, tips, and discretionary purchases."),
    ],
  },
  {
    cat: 'health-and-safety',
    slug: 'is-egypt-safe-to-travel-right-now',
    question: 'Is Egypt safe to travel right now?',
    answer: [
      p('Generally yes, for the parts travelers actually go. Tourist areas have a heavy police and tourism-security presence, and incidents involving foreign visitors are rare.'),
      p('Practical guidance:'),
      li("Avoid border areas (Sinai's interior beyond Sharm el-Sheikh, Western Desert near the Libya border, parts of South Egypt near Sudan)"),
      li("Stay aware of current advisories from your country's foreign office"),
      li('Use common-sense precautions for petty theft (crowded markets, public transport)'),
      li('Follow guide recommendations on demonstrations or political gatherings — avoid them'),
      p("Egypt is not Switzerland, but it's also not what international headlines sometimes suggest. Hundreds of thousands of travelers visit annually without incident."),
    ],
  },
  {
    cat: 'health-and-safety',
    slug: 'what-vaccinations-do-i-need-for-egypt',
    question: 'What vaccinations do I need for Egypt?',
    answer: [
      p('No mandatory vaccinations for entry from most countries. Standard travel recommendations:'),
      li('Routine vaccines up to date (tetanus, MMR, diphtheria)'),
      li('Hepatitis A (recommended)'),
      li('Typhoid (recommended for travelers eating outside major hotels)'),
      li('Hepatitis B (recommended for longer stays)'),
      p("Consult your country's travel health authority or a travel medicine clinic 4-6 weeks before departure for current guidance."),
      p("If you're coming from a country with active yellow fever transmission, you may need to show a yellow fever certificate on arrival."),
    ],
  },
  {
    cat: 'health-and-safety',
    slug: 'can-i-drink-the-tap-water-in-egypt',
    question: 'Can I drink the tap water in Egypt?',
    answer: [
      p("We don't recommend it. Egyptian tap water is chemically treated and considered safe for locals, but most visitors react poorly to it within a day or two."),
      p('Use bottled water for drinking and brushing teeth. Most hotels provide bottled water in rooms; supermarkets sell large bottles cheaply. Ice in upscale restaurants and hotels is generally made from filtered water; in street stalls and small establishments, skip it.'),
      p("Coffee, tea, and hot beverages from reputable places are fine — boiling kills what tap-water filtering doesn't."),
    ],
  },
  {
    cat: 'practical-essentials',
    slug: 'can-i-get-a-sim-card-in-egypt',
    question: 'Can I get a SIM card or mobile data in Egypt?',
    answer: [
      p('Yes, easily. Three main carriers — Vodafone, Orange, Etisalat — all sell tourist SIM cards at major airports immediately after arrival, and at storefronts throughout cities. Expect to pay USD 10-20 for a SIM with several GB of data valid for a week or two.'),
      p("You'll need your passport for registration. Coverage is good in cities and along the Nile Valley; expect gaps in remote desert areas (which most travelers visit with guides who have their own communication)."),
      p('eSIM options work for compatible phones — Airalo and similar services activate before you arrive.'),
    ],
  },
  {
    cat: 'practical-essentials',
    slug: 'what-time-zone-is-egypt',
    question: 'What time zone is Egypt?',
    answer: [
      p('Egypt is on Eastern European Time (UTC+2) year-round. Daylight saving time is observed April through October, putting the country at UTC+3 during those months.'),
      p('For practical purposes: 7 hours ahead of New York, 2 hours ahead of London, 6 hours behind Tokyo (most of the year).'),
    ],
  },
  {
    cat: 'practical-essentials',
    slug: 'are-there-restrictions-on-photography',
    question: 'Are there restrictions on photography?',
    answer: [
      p('Yes, in specific places:'),
      li('**Inside tombs and certain museums** — usually prohibited; sometimes a paid photo permit is available. Flash is almost always banned (damages pigments).'),
      li('**Military and government buildings** — never photograph these.'),
      li('**Airports, bridges, ports** — avoid.'),
      li("**People** — ask before photographing locals, especially women, children, and religious figures. Many will say yes; many won't. Respect the answer."),
      p('Camera rules inside the Pyramids vary by site; check at the ticket desk. Outside (the Giza plateau) is generally fine.'),
      p('When in doubt, look for a "no photo" sign or ask your guide.'),
    ],
  },
  {
    cat: 'practical-essentials',
    slug: 'can-i-bring-a-drone-to-egypt',
    question: 'Can I bring a drone to Egypt?',
    answer: [
      p('Generally, no. Drone use in Egypt requires permits that are nearly impossible for tourists to obtain. Customs may confiscate drones on arrival.'),
      p('Even where flying is technically allowed, never operate drones near:'),
      li('Historical sites'),
      li('Military installations'),
      li('Government buildings'),
      li('Crowds'),
      p('Unauthorized drone use can result in fines, equipment seizure, or arrest. Unless you have explicit permission arranged in advance through official channels (with documentation in hand), leave the drone at home.'),
    ],
  },
  {
    cat: 'practical-essentials',
    slug: 'whats-the-legal-drinking-age',
    question: "What's the legal drinking age?",
    answer: [
      p('21 years old for purchase and public consumption. Alcohol is widely available in hotels, restaurants licensed to serve it, and dedicated alcohol shops (Drinkies, Cheers) in cities.'),
      p('During Ramadan, alcohol sales are restricted to non-Muslims at hotels and licensed establishments. Outside hotels and resorts, public consumption of alcohol is uncommon and best avoided.'),
    ],
  },
  {
    cat: 'culture-and-language',
    slug: 'whats-the-dress-code',
    question: "What's the dress code?",
    answer: [
      p('Egypt is predominantly Muslim and conservative outside resort areas. Modesty is appreciated everywhere and required at religious sites.'),
      li('**Sightseeing in cities and towns** — shoulders and knees covered for both men and women. Light, loose clothing works for the heat.'),
      li('**Mosques** — women cover hair (a scarf is often provided); both genders cover shoulders, arms, legs. Remove shoes before entering.'),
      li('**Churches and monasteries** — similar coverage to mosques.'),
      li('**Resort areas** (Sharm El Sheikh, Hurghada, El Gouna) — beachwear is fine in resorts and on beaches; cover up when leaving the resort area.'),
      li('**Nile cruises** — relaxed dress on board; respectful clothing for shore excursions to temples.'),
      p('Practical recommendation for women: a lightweight scarf in your day bag covers most situations.'),
    ],
  },
  {
    cat: 'culture-and-language',
    slug: 'how-widely-is-english-spoken',
    question: 'How widely is English spoken?',
    answer: [
      p('Widely in tourism contexts — hotels, restaurants in tourist zones, guides, tour operators, larger shops. Less so outside these contexts.'),
      p("In Upper Egypt towns and outside Cairo's central districts, English fluency drops sharply. Knowing a few Arabic phrases helps — both practically and as a courtesy."),
      p('Your guide (if traveling with a tour) will handle most language interactions. If traveling independently in non-tourist areas, expect to use translation apps, gestures, and patience.'),
    ],
  },
  {
    cat: 'culture-and-language',
    slug: 'what-are-some-useful-arabic-phrases',
    question: 'What are some useful Arabic phrases?',
    answer: [
      p('A short, high-value list:'),
      li('**Hello** — *Salaam alaikum* (response: *Wa alaikum salaam*)'),
      li('**Thank you** — *Shukran*'),
      li('**No, thank you** — *La shukran* (essential for politely declining persistent vendors)'),
      li('**Please** — *Min fadlak* (to a man), *Min fadlik* (to a woman)'),
      li('**Yes / No** — *Aywa / La*'),
      li('**How much?** — *Bikam?*'),
      li('**Too expensive** — *Ghali awi*'),
      li('**Excuse me / Sorry** — *Aasif* (for men), *Aasifa* (for women)'),
      li('**Where is...?** — *Fayn...?*'),
      li('**Good morning** — *Sabah el kheir*'),
      p('Egyptians appreciate any effort to use Arabic, even badly. A few words go a long way.'),
    ],
  },
  {
    cat: 'culture-and-language',
    slug: 'whats-the-basic-cultural-etiquette',
    question: "What's the basic cultural etiquette?",
    answer: [
      p('A short list of things that matter:'),
      li('**Greet warmly** — handshakes between men, between women, or between same-sex friends. Cross-gender handshakes only if the other person initiates.'),
      li('**Use your right hand** for eating, giving, and receiving — the left is considered unclean in traditional contexts.'),
      li('**Remove shoes when entering homes** and all mosques. Some Coptic churches as well.'),
      li("**Don't photograph people without asking**, especially women and children."),
      li('**Public affection is conservative** — hand-holding is fine for married couples; kissing and embracing in public are not.'),
      li('**During Ramadan**, eating, drinking, and smoking in public during daylight hours is impolite. Restaurants stay open for tourists but be discreet.'),
      li('**Gratitude matters** — *shukran* and a smile open doors.'),
    ],
  },
  {
    cat: 'avoiding-hassles',
    slug: 'how-do-i-avoid-tourist-scams',
    question: 'How do I avoid tourist scams?',
    answer: [
      p('A few practical defenses:'),
      li('**Agree on prices before** any service starts — taxi, carriage, felucca, market vendor.'),
      li('**Don\'t believe "your hotel is closed"** or "your tour bus is around the corner" from strangers near tourist sites. Common diversion tactic.'),
      li('**At the airport, trust your pre-booked transfer** — drivers claiming Uber or your transfer "isn\'t allowed" are trying to redirect you.'),
      li('**Don\'t accept unsolicited "help"** with luggage, photos, or directions from strangers — they\'ll expect payment.'),
      li('**A confident "la shukran" while walking** is more effective than engaging.'),
      li('**Use reputable operators for tours and transfers** — the small premium over street-arranged services pays for itself in not getting scammed.'),
      p("Most Egyptians you'll meet are warm, hospitable, and honest. The small minority who target tourists is concentrated in known places (airport arrivals, the Pyramids plaza, Khan el-Khalili entrance, Luxor's east-bank corniche). Stay alert there; relax elsewhere."),
    ],
  },
  {
    cat: 'booking-with-travel2egypt',
    slug: 'how-does-booking-with-travel2egypt-work',
    question: 'How does booking with Travel2Egypt work?',
    answer: [
      p('Our model is consultation-based, not e-commerce. There\'s no "Add to Cart" or instant booking.'),
      p('**The process:**'),
      num('**You tell us what you want** — through our planning conversation, WhatsApp, or email. The more honest you are about budget, pace, and interests, the better the proposal.'),
      num('**We propose** — a tailored itinerary with specific hotels, ground operators, and pricing. Usually within 8 PM Cairo time the same day if you write before 1 PM, or by 10 AM Cairo time the next morning otherwise. Seven days a week.'),
      num('**We refine together** — usually 1-3 rounds of adjustments until the trip fits.'),
      num('**You confirm with a 20% deposit** to lock in the booking and supplier reservations.'),
      num('**Final balance due 31 days before departure** (or full payment if booking within 30 days).'),
      num('**We deliver** — pre-trip prep, on-the-ground support, post-trip follow-up.'),
      p("You're working with the same person from inquiry through trip, not handed off to a junior agent."),
    ],
  },
  {
    cat: 'booking-with-travel2egypt',
    slug: 'whats-the-cancellation-policy',
    question: "What's the cancellation policy?",
    answer: [
      p("Cancellations must be in writing and confirmed by us. The deposit is non-refundable from the moment it's paid."),
      p('If you cancel after deposit:'),
      li('**46+ days before departure** — we retain the deposit only.'),
      li('**30-45 days before departure** — we retain 50% of total booking cost or the deposit, whichever is greater.'),
      li('**Less than 30 days before departure** — we retain 100% of all amounts paid.'),
      p("Some components — flights, certain Nile cruise cabins, special-arrangement experiences — may be 100% non-refundable from the moment they're issued. We flag this clearly in your proposal so you know what's recoverable and what isn't before you commit."),
      p('**Travel insurance covering trip cancellation is strongly recommended.** Most policies cover medical, weather, and personal emergencies. We can recommend providers.'),
      p("If we cancel a trip (rare, but possible for force-majeure reasons), you receive a full refund of recoverable amounts or transfer credit to a new date. We're not responsible for costs you've incurred separately — flights to Egypt, visa fees, insurance — so insurance covers you on both sides."),
    ],
  },
  {
    cat: 'booking-with-travel2egypt',
    slug: 'how-and-when-do-i-pay',
    question: 'How and when do I pay?',
    answer: [
      p('**Deposit: 20% per person** to confirm the booking. Some components may require higher deposits — we tell you in the proposal.'),
      p('**Balance: due 31 days before departure.** If you book within 30 days of departure, full payment is due at booking.'),
      p('**Payment methods:** Bank transfer (preferred for larger amounts), credit card (Visa, Mastercard, Amex via secure payment link), or wire transfer. Egyptian pounds, USD, EUR, GBP accepted.'),
      p('**Currency:** Trip prices are quoted in USD by default. Conversion to your preferred currency is available; we lock the rate at the time of deposit so exchange-rate movement doesn\'t affect your final cost.'),
      p('**No hidden charges.** Pricing in our proposals is final and complete, including all the operational costs we control. Things outside our control (visa fees, tips to staff, optional purchases) are itemized separately so you know what\'s covered and what isn\'t.'),
    ],
  },
  {
    cat: 'booking-with-travel2egypt',
    slug: 'when-does-your-team-respond-to-inquiries',
    question: 'When does your team respond to inquiries?',
    answer: [
      p('Inquiries received before **1:00 PM Cairo time** get a proposal back by **8:00 PM Cairo time the same day**.'),
      p('Inquiries received after 1:00 PM get a proposal back by **10:00 AM Cairo time the next morning**.'),
      p('This commitment runs seven days a week, including holidays. We honor it.'),
      p("If you need to talk through something complex, mention that in your inquiry — we'll often set up a WhatsApp or video call instead of going straight to written proposal, especially for trips with intricate logistics."),
    ],
  },
  {
    cat: 'booking-with-travel2egypt',
    slug: 'why-dont-you-publish-prices-on-your-website',
    question: "Why don't you publish prices on your website?",
    answer: [
      p('Because every trip we organize is genuinely different.'),
      p('A "10-day Egypt tour" can range from USD 1,500 per person (budget, group, basic hotels) to USD 25,000 per person (private dahabiya, top-tier hotels, exclusive site access). Publishing one price per itinerary template would mean either misleading travelers or building such broad ranges they\'re useless.'),
      p('Instead, you tell us what you actually want — pace, comfort level, interests, group size, dates — and we quote a specific price for the trip that fits. Usually within 24 hours, often faster. No upsell pressure, no add-ons buried in fine print.'),
      p("If you want a rough order of magnitude before committing to a full proposal, just ask. We'll give you a range based on what you've described."),
    ],
  },
];

// ── Build docs ──────────────────────────────────────────────────
const catDocs = CATEGORIES.map((c, i) => ({
  _id: `faq-category-${c.slug}`,
  _type: 'faqCategory',
  name: i18nText(c.name),
  slug: slugField(c.slug),
  orderRank: i + 1,
}));

const catOrderRank = {};
const entryDocs = ENTRIES.map((e) => {
  catOrderRank[e.cat] = (catOrderRank[e.cat] || 0) + 1;
  return {
    _id: `faq-entry-${e.slug}`,
    _type: 'faqEntry',
    question: i18nText(e.question),
    answer: i18nPt(e.answer),
    category: { _type: 'reference', _ref: `faq-category-${e.cat}` },
    orderRank: catOrderRank[e.cat],
  };
});

console.log(`Mode: ${COMMIT ? 'COMMIT' : 'DRY-RUN'}`);
console.log(`Env: ${envPath}`);
console.log(`Dataset: ${env.NEXT_PUBLIC_SANITY_DATASET}`);
console.log(`Categories: ${catDocs.length}  Entries: ${entryDocs.length}`);
console.log('');
for (const c of CATEGORIES) {
  const inCat = ENTRIES.filter((e) => e.cat === c.slug);
  console.log(`  ${c.name.padEnd(28)} (${inCat.length})`);
  for (const e of inCat) {
    const blocks = e.answer;
    const lists = blocks.filter((b) => b.listItem).length;
    const links = blocks.reduce((a, b) => a + b.markDefs.length, 0);
    console.log(`    - ${e.slug.padEnd(46)} ${blocks.length} blk, ${lists} list, ${links} link`);
  }
}

// Sample dry-run output: first 2 categories + first 5 entries.
if (!COMMIT) {
  console.log('\n--- SAMPLE (first 2 categories) ---');
  console.log(JSON.stringify(catDocs.slice(0, 2), null, 1));
  console.log('\n--- SAMPLE (first 5 entries, answer block summary) ---');
  for (const d of entryDocs.slice(0, 5)) {
    const blocks = d.answer[0].value;
    console.log(`${d._id}  ->  category ${d.category._ref}, orderRank ${d.orderRank}`);
    for (const b of blocks) {
      const txt = b.children.map((c) => c.text).join('');
      const tag = b.listItem ? `[${b.listItem}]` : `[${b.style}]`;
      console.log(`   ${tag} ${txt.slice(0, 78)}${txt.length > 78 ? '…' : ''}`);
    }
  }
  console.log('\nRe-run with --commit to write to Sanity.');
  process.exit(0);
}

const all = [...catDocs, ...entryDocs];
let tx = client.transaction();
for (const d of all) tx = tx.createOrReplace(d);
await tx.commit({ visibility: 'sync' });
console.log(`\n=== Wrote ${catDocs.length} categories + ${entryDocs.length} entries ===`);
