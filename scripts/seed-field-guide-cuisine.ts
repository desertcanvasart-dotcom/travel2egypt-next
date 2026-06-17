/**
 * Seed Field Guide No. 04 — "Egypt, On a Plate" — into Sanity.
 *
 * Editorial glossary of Egyptian cuisine. Each section uses the new
 * `dishes` array (extension of the fieldGuide schema introduced with
 * this guide) — discrete entries with name + description + optional
 * per-entry operator note. Section 1 is `emphasized: true` so the
 * "What to eat in your first 24 hours" advice carries hairline rules.
 *
 *   pnpm tsx scripts/seed-field-guide-cuisine.ts
 *   pnpm tsx scripts/seed-field-guide-cuisine.ts --commit
 */

import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { createClient, type SanityClient } from '@sanity/client';

loadEnv({ path: path.resolve(process.cwd(), '.env') });

const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ufallvd2';
const DOC_ID = 'fieldGuide-egyptian-cuisine';

const commit = process.argv.includes('--commit');

function die(msg: string): never {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

function getClient(): SanityClient {
  const isProd = DATASET === 'production';
  const token = isProd
    ? process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ||
      process.env.SANITY_API_WRITE_TOKEN
    : process.env.SANITY_STAGING_API_WRITE_TOKEN ||
      process.env.SANITY_API_WRITE_TOKEN;
  if (!token) die(`No write token in env for dataset "${DATASET}"`);
  return createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
    token,
    useCdn: false,
  });
}

const en = (value: string) => [{ _key: 'en', value }];
const enSlug = (current: string) => [
  { _key: 'en', value: { _type: 'slug' as const, current } },
];

// ── Intro ───────────────────────────────────────────────────────────────
const INTRO = `Egyptian cuisine is one of the oldest continuously cooked food traditions in the world — the staple of fava beans (ful) appears in pharaonic tomb paintings, koshari combines ingredients that trace different empires' arrivals, and the bread (aish) is still baked in the same shape it was thousands of years ago. Most travelers eat the wrong version of all of it.

The wrong version isn't bad food. It's hotel buffet food, tourist-strip food, the safe-bet international menus that exist because operators assume foreigners want them. What follows is the short list of what to seek out instead, where to find it, and how to eat it the way Egyptians do.`;

// ── Glossary entries (per section) ──────────────────────────────────────
type Entry = { name: string; description: string; operatorNote?: string };

const FIRST_24H: Entry[] = [
  {
    name: 'Koshari',
    description: `Egypt's national dish. Rice, macaroni, lentils, chickpeas, fried onions, tomato sauce, garlic vinegar. Eaten by mixing everything thoroughly before the first bite, then adding the chili oil (shaṭṭa) and garlic vinegar to taste. Vegan by accident. Cheap by design — invented during British occupation as a way to combine available imported and local ingredients.`,
    operatorNote: `Koshari Abou Tarek in downtown Cairo is the canonical version, but most neighborhood koshari shops are excellent. Avoid hotel restaurant versions — they're usually a flattened approximation.`,
  },
  {
    name: 'Ful medames',
    description: `Slow-cooked fava beans, served with olive oil, lemon, cumin, and bread. Breakfast staple eaten by scooping with bread, not a spoon.`,
    operatorNote: `Ful is breakfast food. Order it at a ful and falafel place in the morning, with fresh aish baladi bread, eggs, and tahini on the side.`,
  },
  {
    name: 'Aish baladi',
    description: `Egyptian flatbread. The word aish literally means "life" in Egyptian Arabic. Eaten with everything.`,
    operatorNote: `The bread you'll be served at any decent local restaurant is the bread Egyptians have eaten for thousands of years. Hotel bread is not. Seek out the local version.`,
  },
];

const STAPLES: Entry[] = [
  {
    name: "Ta'meya",
    description: `Egyptian falafel, made with fava beans (not chickpeas like Levantine falafel). Bright green inside.`,
    operatorNote: `The fava-bean base is what makes ta'meya distinctly Egyptian. Levantine falafel is also delicious but it's not the same dish.`,
  },
  {
    name: 'Molokhia',
    description: `Soup of finely chopped jute leaves, garlic, coriander, meat or chicken. Slightly thick, slightly slimy texture (this is intentional).`,
    operatorNote: `The texture takes getting used to. Many travelers love it on the second try. Don't form an opinion on the first bite.`,
  },
  {
    name: 'Mahshi',
    description: `Stuffed vegetables — cabbage leaves, vine leaves, zucchini, peppers — filled with seasoned rice. Home cooking; restaurant versions are often inferior.`,
    operatorNote: `The best mahshi is in Egyptian homes. If your guide invites you to lunch, accept.`,
  },
  {
    name: 'Bamya',
    description: `Okra stew, usually with tomato and meat. A standard weekday lunch at home and a fixture on every neighborhood menu.`,
  },
  {
    name: 'Fatta',
    description: `Celebration dish of rice, bread soaked in broth, meat, and a tomato-garlic-vinegar sauce. Served at weddings, religious holidays, and other special occasions — not casual fare.`,
  },
  {
    name: 'Hawawshi',
    description: `Spiced ground meat baked inside aish baladi bread until the crust crisps. A Cairo specialty, eaten by hand and best straight from the oven.`,
  },
];

const BREAD_GRAINS_DAIRY: Entry[] = [
  {
    name: 'Aish baladi',
    description: `The whole-wheat flatbread covered above — the everyday Egyptian bread, eaten with breakfast, lunch, and dinner.`,
  },
  {
    name: 'Aish shami',
    description: `Levantine-style white pita. Also common, especially in Cairo restaurants that lean toward a regional menu.`,
  },
  {
    name: 'Gibna domiati',
    description: `Soft white cheese named for the Nile Delta city of Damietta. Mild, slightly salty, served at breakfast with bread and olives.`,
  },
  {
    name: 'Mish',
    description: `Fermented cheese, traditionally preserved in clay jars for months. Sharp, pungent, and an acquired taste — but a real one once acquired.`,
    operatorNote: `Mish is the kind of thing Egyptian grandmothers make at home. Most restaurants don't serve it. If a family offers it to you, try a little.`,
  },
  {
    name: 'Labneh',
    description: `Strained yogurt, served at breakfast with olive oil, za'atar, and bread. The standard Levantine breakfast spread is alive and well in Egypt too.`,
  },
];

const DRINKS: Entry[] = [
  {
    name: 'Karkadeh',
    description: `Hibiscus tea, served hot in winter and iced in summer. Egypt's most distinctive drink — deep red, tart, and slightly floral.`,
    operatorNote: `Karkadeh is also slightly blood-pressure-lowering, so go easy in heat.`,
  },
  {
    name: 'Sahlab',
    description: `Hot, thick, milky drink made from orchid tuber starch, topped with cinnamon, coconut, and chopped nuts. A winter drink, sold from carts on cold evenings.`,
    operatorNote: `Don't expect sahlab outside the cold months. It's seasonal in a way many travelers don't realize.`,
  },
  {
    name: 'Sobia',
    description: `Coconut-and-rice drink, often associated with Ramadan. Sweet, creamy, served cold from large copper urns at iftar.`,
  },
  {
    name: 'Asab',
    description: `Fresh sugar cane juice, pressed at street stands. Sweet, grassy, and at its best from a clean stand on a hot afternoon.`,
    operatorNote: `Watch the stand press it in front of you. The clean stands are obvious; trust your eyes.`,
  },
  {
    name: 'Shai',
    description: `Egyptian tea. Black, brewed strong, served in small glasses with significant sugar — unless you specify bidūn sukkar (without sugar). Drunk everywhere, all day.`,
  },
  {
    name: 'Ahwa',
    description: `Turkish coffee. Ordered by sweetness level: sāda (no sugar), ʿar-rīḥa (lightly sweet), mazbūṭ (medium), ziyāda (very sweet).`,
    operatorNote: `Mazbūṭ is the safe default if you're unsure.`,
  },
];

const SWEETS: Entry[] = [
  {
    name: 'Basbousa',
    description: `Semolina cake soaked in sugar syrup, often topped with coconut and a single almond. Dense, sweet, and reliably good across the country.`,
  },
  {
    name: 'Konafa',
    description: `Thin pastry strands wrapped around a sweet filling — cheese, cream, or nuts — and soaked in syrup. The cheese version is the classic and the one most travelers underrate.`,
  },
  {
    name: 'Umm Ali',
    description: `Bread pudding with milk, nuts, and raisins. The apocryphal story: named after a sultan's wife who celebrated a rival's death by ordering this dish distributed across Egypt.`,
    operatorNote: `The story is probably apocryphal. The pudding is real and excellent.`,
  },
  {
    name: 'Mahallabia',
    description: `Milk pudding scented with rose water and topped with pistachios. Cooler and lighter than the syrup-soaked sweets — a good close to a heavy meal.`,
  },
  {
    name: 'Roz bi laban',
    description: `Rice pudding. The home-kitchen dessert. Served warm or cold, dusted with cinnamon.`,
  },
];

const WHERE_TO_EAT: Entry[] = [
  {
    name: 'Cairo',
    description: `Koshari (Abou Tarek and the neighborhood shops), hawawshi from a Cairo bakery, and the full breakfast spread — ful, ta'meya, eggs, gibna, fresh aish baladi. The downtown koshari counters and the old-quarter ful and falafel shops are the canonical experiences.`,
  },
  {
    name: 'Alexandria',
    description: `Seafood. The Mediterranean coast tradition is distinct from inland Egypt — fish grilled whole with cumin, garlic, and lemon, eaten with bread and tahini at simple harbour-side restaurants.`,
  },
  {
    name: 'Aswan and Upper Egypt',
    description: `Nubian cuisine — distinct from the rest of Egypt. Slow-cooked stews, freshwater fish from the Nile, and hibiscus (karkadeh) which is particularly associated with Aswan.`,
  },
  {
    name: 'Siwa',
    description: `Desert cuisine. Dates, olives, and abud — a date-stuffed bread baked in the embers of a wood fire. Lamb is the meat of choice; tea and karkadeh are the social rhythm.`,
  },
];

const DIETARY: Entry[] = [
  {
    name: 'Vegetarian and vegan',
    description: `Easier than most travelers expect. Koshari, ful, ta'meya, vegetarian mahshi, meatless molokhia, and the entire bread-cheese-labneh breakfast spread are vegetarian or veganizable. Egypt has a long Coptic tradition of meatless fasting cooking that translates directly into everyday options.`,
  },
  {
    name: 'Halal',
    description: `Assumed default. Most restaurants outside the hotel zones are halal without needing to be advertised as such.`,
  },
  {
    name: 'Pork',
    description: `Rare. Available in some hotel restaurants and in Christian-area delis, but not on standard menus.`,
  },
  {
    name: 'Alcohol',
    description: `Available in licensed restaurants, hotels, and tourist zones — not in most local eateries. Egyptian beer (Stella, Sakara) and Egyptian wine (Omar Khayyam, Grand Marquis) exist and are decent.`,
  },
  {
    name: 'Tap water',
    description: `Don't drink it. Bottled water is universal and cheap. Ice in tourist restaurants is generally fine; skip it in street-food contexts.`,
  },
];

// ── Closing ─────────────────────────────────────────────────────────────
const CLOSING = `Egyptian food rewards the traveler who treats it as a cuisine rather than a buffet. The hotel version is usually a flattened approximation; the real version is in the neighborhood ful shop, the downtown koshari counter, the family lunch you're invited to halfway through your trip.

The list above is a starting point. The good version is found by asking your guide where they actually eat — and trusting the answer.`;

// ── Document assembly ──────────────────────────────────────────────────
const dishes = (specs: Entry[], keyPrefix: string) =>
  specs.map((d, i) => ({
    _key: `${keyPrefix}-${i}`,
    _type: 'dishEntry',
    name: en(d.name),
    description: en(d.description),
    operatorNote: d.operatorNote ? en(d.operatorNote) : undefined,
  }));

const doc = {
  _id: DOC_ID,
  _type: 'fieldGuide',
  title: en('Egypt,'),
  titleAccent: en('On a Plate'),
  slug: enSlug('egyptian-cuisine'),
  seriesNumber: 'No. 04',
  order: 40,
  region: en('Egypt, end to end'),
  tagSummary: en('Egyptian Cuisine'),
  standfirstLead: en('Egyptian food is older than the Pharaohs.'),
  standfirstAccent: en(
    "Here's what to seek out, how to eat it properly, and where the good version is found.",
  ),
  intro: en(INTRO),
  sections: [
    {
      _key: 'first24h',
      _type: 'section',
      title: en('What to eat in your first 24 hours'),
      body: en(
        `The single most important advice in this guide. Most travelers' first food experience in Egypt is a hotel buffet, which is unrepresentative of the cuisine. Three things to seek out on Day 1 instead.`,
      ),
      dishes: dishes(FIRST_24H, 'first24h'),
      emphasized: true,
    },
    {
      _key: 'staples',
      _type: 'section',
      title: en('The staples'),
      body: en(
        `The dishes that recur across regions and meals. None of them are tourist food; all of them are how Egyptians actually eat.`,
      ),
      dishes: dishes(STAPLES, 'staples'),
      emphasized: false,
    },
    {
      _key: 'breadGrainsDairy',
      _type: 'section',
      title: en('Bread, grains, and dairy'),
      body: en(
        `The everyday foundation. The bread is the bread the country has eaten for thousands of years; the cheeses are mostly fresh, mostly white, mostly served with bread and oil.`,
      ),
      dishes: dishes(BREAD_GRAINS_DAIRY, 'bgd'),
      emphasized: false,
    },
    {
      _key: 'drinks',
      _type: 'section',
      title: en('Drinks'),
      body: en(
        `The drinks worth seeking out — hot and cold, sweet and bitter, every-day and seasonal.`,
      ),
      dishes: dishes(DRINKS, 'drinks'),
      emphasized: false,
    },
    {
      _key: 'sweets',
      _type: 'section',
      title: en('Sweets'),
      body: en(
        `The dessert tradition is substantial. This is a short list of the ones most worth pursuing — soaked syrup pastries, milk puddings, and one bread pudding with a story attached.`,
      ),
      dishes: dishes(SWEETS, 'sweets'),
      emphasized: false,
    },
    {
      _key: 'whereToEat',
      _type: 'section',
      title: en('What to eat where'),
      body: en(
        `A brief pairing of dishes with the cities and regions where they're notable. Most of Egyptian cuisine is national, but a handful of dishes belong to a place.`,
      ),
      dishes: dishes(WHERE_TO_EAT, 'where'),
      emphasized: false,
    },
    {
      _key: 'dietary',
      _type: 'section',
      title: en('Dietary notes for travelers'),
      body: en(
        `The practical section — what's easy, what's not, and what to skip.`,
      ),
      dishes: dishes(DIETARY, 'dietary'),
      emphasized: false,
    },
  ],
  closing: en(CLOSING),
  colophonNote: en(
    'Field guide · the good version is found by asking · ask your guide where they actually eat',
  ),
  seo: {
    metaTitle: en('Egypt, On a Plate — A Working Glossary of Egyptian Food'),
    metaDescription: en(
      "Egyptian food is older than the Pharaohs. Here's what to seek out, how to eat it properly, and where the good version is found.",
    ),
  },
};

async function run() {
  const mode = commit ? 'COMMIT' : 'DRY-RUN';
  console.log(`\n— Egypt, On a Plate seed (${mode}) —`);
  console.log(`  dataset:  ${DATASET}`);
  console.log(`  doc:      ${DOC_ID}`);
  console.log(`  slug:     egyptian-cuisine`);
  console.log(`  sections: ${doc.sections.length}`);
  const totalDishes = doc.sections.reduce(
    (n, s) => n + ((s as any).dishes?.length ?? 0),
    0,
  );
  console.log(`  entries:  ${totalDishes}\n`);

  if (!commit) {
    console.log(`(dry-run — re-run with --commit to write)`);
    return;
  }

  const client = getClient();
  await client.createOrReplace(doc as any);
  console.log(`  ✓ ${DOC_ID}`);
  console.log(`\nDone.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
