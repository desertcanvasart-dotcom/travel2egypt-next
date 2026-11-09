# FAQ draft: four landing pages (9 Nov 2026)

Phase B5, the FAQ part. The landing pages already have an FAQ section that shows below the tour list and sends Google FAQ markup (`LandingFaq`). It shows only when questions exist, and none do yet.

**Status: DRAFT — awaiting owner approval.** Once you approve it, this file is locked (Canon Gate A), and the staging script writes only strings that byte-match it.

## How it was built

- **Questions** are real searches from Search Console (`https://travel2egypt.org/` property, last 16 months, question-style searches). Impressions are shown in brackets.
- **Answers** use only facts already published on the site: the cruise, dahabiya, family and Western Desert guides, and the products listed on each page. The source is named under each answer.
- **Style:** no prices and no unverified superlatives. Each answer is 40–80 words, so it can stand alone in Google.

## Language

English only for now. As the code stands, an English-only FAQ would also appear **in English** on the Spanish and Japanese pages, because the question falls back to English. This PR fixes that (two lines in `queries.ts`): an FAQ item shows only in the languages it has been written in. Spanish and Japanese follow once the English is approved.

---

## 1. Nile cruise holidays (`/nile-cruise-holidays`)

**When is the best time for a Nile cruise?**
*(best time to go to egypt nile cruise 524, best time for nile cruise 446, best time to cruise the nile 200 and similar: about 1,400 in total)*

> You can cruise the Nile all year. November to February is the easiest stretch: comfortable days at Luxor and Aswan, cool evenings on deck. December and January are also the busiest, so November and February balance weather and crowds best. March and April are very good too. From May to September, days in Luxor and Aswan often pass 40°C, so sightseeing moves to early morning.

*Source: The Best Time to Cruise the Nile (`/blog/best-time-to-cruise-the-nile`).*

**How long is a Nile cruise?**
*(how long is a nile cruise 52, how does a nile cruise work 20)*

> The standard cruise between Luxor and Aswan runs three, four or seven nights. Our trips pair a three- or four-night cruise with Cairo, and a night or two in Luxor or Aswan lets the big sites breathe. For the whole river, there are longer passages: 13 days from Cairo to Luxor, 11 from Luxor to Cairo and 14 from Aswan to Cairo.

*Source: The Definitive Guide to a Nile Cruise; the 7-Day Egypt Tour (three nights) and the 9-Day Family Tour (four nights); the 13-, 11- and 14-day cruise products.*

**What is included in a Nile cruise?**
*(what is included in a nile cruise 40, what is included in nile cruise 35)*

> A Nile cruise usually includes your cabin, three meals a day, guided visits to the sites on the itinerary, and transfers. Drinks are often extra, and alcohol almost always is. Entrance fees vary between operators, so each of our trips lists what is included and what isn't, in writing, before you book.

*Source: What's Included in a Nile Cruise Package (`/blog/what-is-included-in-nile-cruise-packages`).*

⚠️ Please confirm that "each of our trips lists what is included and what isn't, in writing, before you book" matches how you work. If it doesn't, I'll cut that sentence.

**Should I cruise from Luxor to Aswan, or Aswan to Luxor?**
*(nile cruise luxor to aswan / aswan to luxor: route searches)*

> Either way, you see the same core sites: Karnak and the Valley of the Kings at Luxor, Edfu and Kom Ombo on the way, and Philae at Aswan. What changes is the order and the flow of the days. Choose the direction that fits your flights and the rest of your trip.

*Source: What's Included in a Nile Cruise Package, "The basic route".*

**What is the difference between a Nile cruise ship and a dahabiya?**
*(what is a dahabiya 234)*

> A cruise ship covers Luxor to Aswan in three or four nights, with more cabins, a restaurant and a sun deck. A dahabiya is a small traditional sailing boat with a handful of cabins. It takes five to seven nights over the same stretch and stops at quieter sites such as Esna, Elkab and Gebel el-Silsila.

*Source: Dahabiya Nile Cruises (`/blog/dahabiya-nile-cruises-wind-powered-journey`); the Definitive Guide.*

---

## 2. Dahabiya (`/authentic-dahabiya-nile-cruise`)

**What is a dahabiya?**
*(what is a dahabiya 234)*

> A dahabiya is a small cruise boat built on the traditional two-masted Nile sailing boat, carrying a few passengers. In the nineteenth century, boats like these took travellers up the Nile. Today's dahabiyas have modern cabins with private bathrooms and climate control, but keep the old pace: small, quiet and close to the riverbank.

*Source: Dahabiya Nile Cruises.*

**Does a dahabiya sail only by wind?**
*(how eco-friendly are the luxury cruises on the nile 67, eco-friendly dahabiyas 79)*

> No. A dahabiya uses its sails when the wind allows. When the schedule, safety, wind direction or river conditions require it, a tugboat or an engine takes over. A trustworthy operator tells you this up front.

*Source: Dahabiya Nile Cruises.*

**How long is a dahabiya cruise?**

> Most dahabiyas sail between Luxor and Aswan, and take five to seven nights over a stretch a large ship covers in three or four. The extra time goes to quieter stops such as Esna, Elkab and Gebel el-Silsila. The dahabiya trips on this page are seven days long.

*Source: Dahabiya Nile Cruises; the dahabiya products listed on the page (all 7 days).*

**When is the best time for a dahabiya cruise?**
*(best time for nile cruise and variants)*

> Spring and autumn suit a dahabiya best. March and April, and late October into November, bring easy temperatures for days spent on deck. November to February is also comfortable but busier. Dahabiyas have few cabins, so book well ahead for winter.

*Source: The Best Time to Cruise the Nile, "Spring" and "The boat type also shifts the timing".*

---

## 3. Family holidays (`/egypt-family-holidays`)

**Is Egypt good for a family holiday with children?**
*(best egypt family vacations 366, best place to visit in egypt with family 98)*

> Yes, if it is paced for children. The pyramids, the Valley of the Kings and the Nile make a strong impression at any age. Heat, traffic and the distances between sites are real, so a family trip works best with fewer sites a day, early starts and rest in the middle of the day.

*Source: Before a First Family Trip to Egypt (`/blog/tips-for-first-time-family-visitors-to-egypt`).*

**What is a good itinerary for a first family trip to Egypt?**

> For a first trip, Cairo, Luxor and the Red Sea work best. Cairo and Giza give you the pyramids and the Grand Egyptian Museum. Luxor shows ancient Egypt at its most complete, on both banks of the Nile. A few days in Hurghada or Sharm El Sheikh at the end give the children beach time after the temples.

*Source: Before a First Family Trip to Egypt, "Three Egypts seen on family travel".*

**When is the best time to visit Egypt with kids?**

> November to March. The days are comfortable for walking the sites, and evenings are cool. In early October some days are still hot, and from May to September Luxor and Aswan often pass 40°C. That is hard going for small children.

*Source: The Best Time to Cruise the Nile, "The shoulder: October" and "Summer".*

**How do you plan sightseeing around children in Cairo?**

> Visit the pyramids at Giza as early in the morning as you can, before the heat and the crowds. At the Grand Egyptian Museum, pick a few themes children enjoy, such as Tutankhamun, animals and gods, rather than trying to see everything. Leave Islamic Cairo and Khan el-Khalili for the late afternoon, when walking is easier.

*Source: Before a First Family Trip to Egypt, "Cairo: short, dense, early".*

---

## 4. Desert and adventure (`/multiday-adventure-and-safari-tours`)

**When is the best time for a desert safari in Egypt?**
*(best time for egypt desert safari 57)*

> Autumn to spring. Daytime heat is gentler and camping is easier. Winter nights in the desert get properly cold, so bring a warm layer. Summer is very hot, and long drives and desert camping become hard going.

*Source: Egypt's Western Desert (`/blog/the-western-desert-in-egypt`), "Season and gear".*

**How many days do I need for the White Desert or Siwa?**
*(what desert is in egypt 24, what deserts are in egypt 20)*

> From Cairo, Bahariya and the White Desert work as a one- or two-night trip, with the Black Desert, Crystal Mountain and a night camping in the White Desert. Siwa is much farther: allow at least three or four nights, including the drive.

*Source: Egypt's Western Desert.*

**Do I need a permit for the Western Desert?**

> For some areas, yes. Permits, checkpoints, open routes and camping rules change with the season and the area, especially in the deep desert and near the borders. On our desert trips, local partners confirm the current conditions before departure.

*Source: Egypt's Western Desert, "Safety and permits"; the landing's own copy on its Bedouin partners.*

⚠️ Please confirm the last sentence matches how the desert trips run.

---

## Not in this batch

- **Luxury and the day-tour hubs:** the searches there are thinner or not questions. "Can you visit the pyramids from Sharm el Sheikh" (1,264) is a real question, but it belongs on the Sharm day-tour pages. That can be a later round.
- **Lake Nasser:** "best lake nasser cruise" (124) waits for your decision on the two blog posts.
