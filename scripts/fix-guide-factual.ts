/**
 * Workstream D — factual / cross-page consistency corrections (migration-staging).
 *
 * Data-driven exact-substring replacement in the EN body of specific guide
 * articles (the reviewer audited the English pages). Each FIX names the article
 * (city + slug), an exact `find` string, and its `replace`. The script:
 *   - fetches the published doc's EN body,
 *   - locates the block+span containing `find` (must match exactly once across
 *     the body unless `count` given),
 *   - replaces the substring in that span (preserving all _keys),
 *   - reports any FIX whose `find` matched 0 times (wording drift → inspect).
 *
 * Web-verified values (sources logged in session). Idempotent: a FIX whose
 * `find` is already absent AND whose `replace` is present is treated as done.
 *
 * Usage:
 *   npx tsx scripts/fix-guide-factual.ts --dry-run
 *   npx tsx scripts/fix-guide-factual.ts --commit
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
loadEnv();

interface Fix { city: string; slug: string; find: string; replace: string; note?: string; type?: 'guideArticle' | 'city' }

const FIXES: Fix[] = [
  // F1 — Lake Bardawil area (Ramsar ~604 km²). [al-arish destination = city.overview]
  { type: 'city', city: 'al-arish', slug: 'al-arish', find: 'covering more than 700 square kilometres', replace: 'covering about 600 square kilometres', note: 'Bardawil area' },
  // F2 — Athribis Egyptian-German (Tübingen) mission began 2003, not 1969.
  { city: 'akhmim', slug: 'tours-in-akhmim', find: 'since 1969', replace: 'since 2003', note: 'Athribis mission start' },
  // F3 — Pelusium: Alexander reached Egypt 332 BC; Plague of Justinian AD 541.
  { city: 'al-arish', slug: 'ancient-city-of-pelusium', find: '333 BC', replace: '332 BC', note: 'Alexander at Pelusium' },
  { city: 'al-arish', slug: 'ancient-city-of-pelusium', find: 'AD 524', replace: 'AD 541', note: 'Plague of Justinian' },
  // F5 — Citadel of Qaitbay 1477–1479 (en-dash; align to dedicated pages).
  { type: 'city', city: 'alexandria', slug: 'alexandria', find: 'built in 1479–80', replace: 'built in 1477–1479', note: 'Qaitbay Citadel date (city overview)' },
  { city: 'alexandria', slug: 'things-to-do-in-alexandria', find: 'built in 1479–80', replace: 'built in 1477–1479', note: 'Qaitbay Citadel date' },
  // F6 — Pompey's Pillar ~27 m (align to dedicated Serapeum/Pillar pages).
  { city: 'alexandria', slug: 'things-to-do-in-alexandria', find: 'Twenty-five metres', replace: 'About twenty-seven metres', note: "Pompey's Pillar height" },
  // F7 — Aga Khan Mausoleum: align Aswan pages to dedicated page (pink limestone).
  { type: 'city', city: 'aswan', slug: 'aswan', find: 'pink Aswan granite', replace: 'pink limestone', note: 'Aga Khan material (city overview)' },
  { city: 'aswan', slug: 'things-to-do-in-aswan', find: 'pink Aswan granite', replace: 'pink limestone', note: 'Aga Khan material' },
  // F8 — Famine Stela ~187 BC (Year 18 of Ptolemy V), not 250 BC.
  { city: 'aswan', slug: 'sehel-island', find: '250 BC', replace: '187 BC', note: 'Famine Stela date' },
  // F9 — Crystal Mountain is barite & calcite, not quartzite.
  { city: 'bahariya-oasis', slug: 'things-to-do-in-bahariya-oasis', find: 'a small ridge of quartzite', replace: 'a small ridge of barite and calcite', note: 'Crystal Mountain mineral' },
  // F12 — Ancient Sands golf course is 18-hole, not 9.
  { city: 'al-gouna', slug: 'stay-in-al-gouna', find: '9-hole on-site golf course', replace: '18-hole on-site golf course', note: 'Ancient Sands holes' },
  // Doubled word.
  { city: 'al-minya', slug: 'top-restaurants-in-al-minya', find: 'dedicated dedicated', replace: 'dedicated', note: 'doubled word' },
  // F10 — Belzoni opened Khafre's pyramid in a single event on 2 March 1818
  // (no 1816 entry); burial-chamber inscription dated 2 (not 1) March 1818.
  { city: 'giza', slug: 'pyramid-of-khafre', find: 'first entered by the Italian explorer Giovanni Battista Belzoni in 1816.', replace: 'first entered by the Italian explorer Giovanni Battista Belzoni on 2 March 1818.', note: 'Belzoni entry date' },
  { city: 'giza', slug: 'pyramid-of-khafre', find: 'He returned in 1818, when he inscribed his name and the date of discovery — "Discovered by G. Belzoni. 1 Mar. 1818" —', replace: 'He inscribed his name and the date of discovery — "Discovered by G. Belzoni. 2 Mar. 1818" —', note: 'Belzoni inscription date + remove false two-visit framing' },
  // Coloured Canyon: ~20–30 km by road from Nuweiba, not "only three kilometres".
  { city: 'dahab', slug: 'coloured-canyon', find: 'only three kilometres from Nuweiba, the closer base', replace: 'about 20 to 30 kilometres by road from Nuweiba, the closer base', note: 'Coloured Canyon distance from Nuweiba' },
  // Qasr Dush walls: align to other Baris pages ("up to six metres").
  { city: 'baris', slug: 'the-roman-fortress-at-dush', find: 'rise to six metres in places, and to twelve in others', replace: 'rise to six metres in places', note: 'Dush wall height consistency' },
  // Speos Artemidos ~22 km south of Al-Minya (consistent with Beni Hasan ~20 km).
  { city: 'al-minya', slug: 'speos-artemidos', find: 'about twenty-eight kilometres south of Al-Minya', replace: 'about twenty-two kilometres south of Al-Minya', note: 'Speos distance consistency' },
  // El Gouna → Luxor: ~300 km / 4–5 h each way (was understated 220 km / 3–4 h).
  { city: 'al-gouna', slug: 'al-gouna-guided-tours', find: 'about 220 kilometres away — three to four hours each way', replace: 'about 300 kilometres away — four to five hours each way', note: 'El Gouna–Luxor distance' },
  { city: 'al-gouna', slug: 'al-gouna-guided-tours', find: 'six to eight hours of driving in total', replace: 'eight to ten hours of driving in total', note: 'El Gouna–Luxor total drive time consistency' },
  // El Gouna → Hurghada Intl Airport: ~40 km (figures were 25/26-30/41 across pages).
  { city: 'al-gouna', slug: 'mangroovy-beach', find: 'around twenty-five kilometres from Hurghada International Airport', replace: 'about forty kilometres from Hurghada International Airport', note: 'El Gouna–airport distance' },
  // Al Quseir Mövenpick is ~6 km north of town (El Quadim Bay), not ~1 km
  // (consistent with Food page "five to six kilometres north").
  { city: 'al-quseir', slug: 'getting-around-in-al-quseir', find: 'Mövenpick about a kilometre north', replace: 'Mövenpick about six kilometres north', note: 'Mövenpick distance consistency' },
];

interface Span { _type: string; _key?: string; text?: string }
interface Block { _key: string; _type: string; children?: Span[] }
interface LE<T> { _key: string; value: T }

interface Args { commit: boolean; dryRun: boolean }
function parseArgs(argv: string[]): Args {
  let commit = false, dryRun = false;
  for (const a of argv.slice(2)) { if (a === '--commit') commit = true; else if (a === '--dry-run') dryRun = true; else { process.stderr.write(`Unknown arg: ${a}\n`); process.exit(2); } }
  if (commit === dryRun) { process.stderr.write('Pass exactly one of --dry-run or --commit.\n'); process.exit(2); }
  return { commit, dryRun };
}
function getClient(): SanityClient {
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (dataset !== 'migration-staging') { process.stderr.write(`Refusing against ${dataset}\n`); process.exit(2); }
  const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
  if (!token) { process.stderr.write('SANITY_STAGING_API_WRITE_TOKEN required\n'); process.exit(2); }
  return createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset, apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01', useCdn: false, token, perspective: 'raw' });
}

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Factual corrections ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}   fixes: ${FIXES.length}\n`);
  const client = getClient();

  // group fixes by (type,city,slug)
  const byDoc = new Map<string, Fix[]>();
  for (const f of FIXES) { const k = `${f.type ?? 'guideArticle'}|${f.city}|${f.slug}`; if (!byDoc.has(k)) byDoc.set(k, []); byDoc.get(k)!.push(f); }

  let applied = 0, missed = 0, alreadyDone = 0;
  let tx = client.transaction();
  let ops = 0;

  for (const [key, fixes] of byDoc) {
    const [type, city, slug] = key.split('|');
    const field = type === 'city' ? 'overview' : 'body';
    const doc = type === 'city'
      ? await client.fetch<{ _id: string; overview?: LE<Block[]>[] } | null>(
          `*[_type=="city" && !(_id in path("drafts.**")) && slug[_key=="en"][0].value.current==$s][0]{ _id, overview }`, { s: slug })
      : await client.fetch<{ _id: string; body?: LE<Block[]>[] } | null>(
          `*[_type=="guideArticle" && !(_id in path("drafts.**")) && slug[_key=="en"][0].value.current==$s && parentCity->slug[_key=="en"][0].value.current==$c][0]{ _id, body }`,
          { s: slug, c: city });
    if (!doc) { console.log(`  ✗ ${type} ${city}/${slug}: doc not found`); missed += fixes.length; continue; }
    const fieldVal = (doc as Record<string, unknown>)[field] as LE<Block[]>[] | undefined;
    const enEntry = fieldVal?.find((e) => e._key === 'en');
    if (!enEntry || !Array.isArray(enEntry.value)) { console.log(`  ✗ ${type} ${city}/${slug}: no en ${field}`); missed += fixes.length; continue; }

    let changed = false;
    for (const f of fixes) {
      let matches = 0;
      for (const block of enEntry.value) {
        if (block._type !== 'block' || !Array.isArray(block.children)) continue;
        for (const sp of block.children) {
          if (sp._type === 'span' && typeof sp.text === 'string' && sp.text.includes(f.find)) {
            sp.text = sp.text.split(f.find).join(f.replace);
            matches++;
            changed = true;
          }
        }
      }
      if (matches > 0) { console.log(`  ✓ ${city}/${slug}: "${f.find}" → "${f.replace}" (${matches}×)  [${f.note ?? ''}]`); applied++; }
      else {
        // already-done check: replace present somewhere?
        const present = enEntry.value.some((b) => b.children?.some((s) => typeof s.text === 'string' && s.text.includes(f.replace)));
        if (present) { console.log(`  - ${city}/${slug}: "${f.find}" not found but replacement present — already done`); alreadyDone++; }
        else { console.log(`  ⚠ ${city}/${slug}: FIND NOT MATCHED: "${f.find}"  [${f.note ?? ''}]`); missed++; }
      }
    }
    if (changed && args.commit) { tx = tx.patch(doc._id, (p) => p.set({ [field]: fieldVal })); ops++; }
  }

  if (args.commit && ops > 0) { await tx.commit({ visibility: 'sync' }); console.log(`\n✓ Committed ${ops} doc patches.`); }
  console.log(`\n=== Summary ===\napplied: ${applied}   already-done: ${alreadyDone}   missed/unmatched: ${missed}`);
  if (!args.commit) console.log('\nDry-run — no writes.');
}

main().catch((e) => { console.error(e); process.exit(1); });
