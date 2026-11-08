/**
 * Bulk-tag attractions with their `placesToGoGroup` sub-group label so the
 * sidebar can cluster them. Per-city rules, slug-pattern matching, dry-run
 * default.
 *
 * Cities handled:
 *   - cairo:  Coptic Cairo | Islamic Cairo | Pharaonic Cairo
 *   - giza:   Giza Plateau | Saqqara | Dahshur | Abusir | Abu Rawash |
 *             Zawyet el-Aryan | Memphis | Hawara | Other
 *
 * Easy to extend with more cities by adding rule blocks below.
 *
 * Usage:
 *   npx tsx scripts/tag-placestogo-groups.ts --dry-run [--city=cairo]
 *   npx tsx scripts/tag-placestogo-groups.ts --commit
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { appendFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();

const LOG_PATH = resolve(process.cwd(), 'migration/bulk-upload-log.jsonl');

interface Args { commit: boolean; dryRun: boolean; cityFilter: string | null }
function parseArgs(argv: string[]): Args {
  let commit = false; let dryRun = false; let cityFilter: string | null = null;
  for (const a of argv.slice(2)) {
    if (a === '--commit') commit = true;
    else if (a === '--dry-run') dryRun = true;
    else if (a.startsWith('--city=')) cityFilter = a.slice(7);
    else die(`Unknown arg: ${a}`);
  }
  if (commit === dryRun) die('Pass exactly one of --dry-run or --commit.');
  return { commit, dryRun, cityFilter };
}
function die(msg: string): never { process.stderr.write(`error: ${msg}\n`); process.exit(2); }

function getClient(): SanityClient {
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (dataset !== 'migration-staging') die(`Refusing against ${dataset}`);
  const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
  if (!token) die('SANITY_STAGING_API_WRITE_TOKEN required');
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
    useCdn: false, token, perspective: 'raw',
  });
}

function appendLog(entry: Record<string, unknown>): void {
  mkdirSync(resolve(process.cwd(), 'migration'), { recursive: true });
  appendFileSync(LOG_PATH, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n', 'utf8');
}

// ──────────────────────────────────────────────────────────────────────────
// Classification rules
// ──────────────────────────────────────────────────────────────────────────

type Classifier = (slug: string, title: string | null) => string | null;

const RULES: Record<string, Classifier> = {
  cairo: (slug, title) => {
    const s = slug.toLowerCase();
    const t = (title ?? '').toLowerCase();

    // Coptic indicators (check first — some slugs have "church" + "saint" overlap)
    if (
      /coptic|hanging-church|abu-serga|saint-barbara|saint-sergius|babylon|roman-tower|ben-ezra|synagogue|church-of-st|church-of-saint/.test(s) ||
      /coptic|abu serga|babylon|roman tower|synagogue/.test(t)
    ) return 'Coptic Cairo';

    // Pharaonic / Ancient Egyptian
    if (
      /egyptian-museum|egyptian-textile-museum/.test(s) ||
      /pharaonic|ancient egyptian/.test(t)
    ) return 'Pharaonic Cairo';

    // Islamic indicators (most Cairo attractions fall here — broad net)
    if (
      /mosque|madrasa|madrassa|sultan|wikala|sabil|kuttab|complex|khanqah|mausoleum|fatimid|muizz|ghuriyya|ghouri|barquq|qaytbay|qalawun|qaitbey|baybars|muhammad-ali|muhammed-ali|aqsunqur|aqsunur|harrawi|suhaymi|khan-el-khalili|khan-al-khalili|bein-al-qasreen|midan-al-hussein|khayrbek|hussein|al-azhar|citadel-of-saladin|gawhara|northern-enclosure|northern-walls|northern-cemetery|bab-|amir-|beit-|ibn-tulun|islamic-art|gayer-anderson|mevlevi|mawlawiyya|al-aqmar|al-hakim|amr-ibn-al-as|aslam-al-silahdar|al-mu-ayyad|al-muayyad/.test(s) ||
      /mosque|madrasa|sultan|wikala|sabil|khanqah|mausoleum|fatimid|islamic/.test(t)
    ) return 'Islamic Cairo';

    return null; // operator review
  },

  giza: (slug, _title) => {
    const s = slug.toLowerCase();
    // Order matters — most-specific area suffixes first
    if (/saqqara|imhotep|tomb-of-mereruka|tomb-of-general-horemheb/.test(s)) return 'Saqqara';
    if (/abusir|sahure|neferirkare|niuserre|khentkawes|khentkaus|ptahshepses/.test(s)) return 'Abusir';
    if (/abu-rawash|djedefre/.test(s)) return 'Abu Rawash';
    if (/zawyet-el-aryan|khaba/.test(s)) return 'Zawyet el-Aryan';
    // Dahshur: bent/red/black/northern/white pyramids of Sneferu + Amenemhat II
    if (/dahshur|bent-pyramid|red-pyramid|black-pyramid|northern-pyramid|white-pyramid|sneferu|amenemhat/.test(s)) return 'Dahshur';
    if (/memphis|mit-rahina/.test(s)) return 'Memphis';
    // Tanis and Bubastis are Delta sites (Sharqia), not Giza — never group them here.
    if (/giza-plateau|giza-sound|great-pyramid|solar-boat|khufu|khafre|menkaure|sphinx/.test(s)) return 'Giza Plateau';
    return null;
  },

  luxor: (slug, _title) => {
    const s = slug.toLowerCase();
    if (/valley-of-the-kings|valley-of-the-queens|deir-el-madina|ramesseum|colossi-of-memnon|el-assasif|el-khokha|sheikh-abd-el-qurna|madinat-habu|hatshepsut|west-bank/.test(s)) return 'West Bank';
    if (/karnak|luxor-temple|luxor-museum|avenue-of-sphinxes|east-bank/.test(s)) return 'East Bank';
    return null;
  },

  aswan: (slug, _title) => {
    const s = slug.toLowerCase();
    if (/elephantine|sehel|botanical-garden|kitcheners-island/.test(s)) return 'Nile Islands';
    if (/saint-simeon|st-simeon|tombs-of-the-nobles|aga-khan/.test(s)) return 'West Bank';
    if (/kalabsha|philae|isis-temple/.test(s)) return 'Lake Nasser';
    if (/aswan-high-dam|local-market|aswan-museum|unfinished-obelisk|nubian-museum/.test(s)) return 'East Bank';
    return null;
  },

  alexandria: (slug, _title) => {
    const s = slug.toLowerCase();
    if (/catacombs|pompeys-pillar|serapeum|roman-theatre|anfushi|greco-roman|pharos|necropolis/.test(s)) return 'Greco-Roman';
    if (/qaitbey-fort|al-mursi|abu-al-abbas/.test(s)) return 'Islamic / Coastal';
    if (/bibliotheca|national-museum|royal-(palaces|family|jewellery)/.test(s)) return 'Modern';
    return null;
  },

  'farafra-oasis': (slug, _title) => {
    const s = slug.toLowerCase();
    if (/white-desert|crystal-mountain|hidden-valley|sand-volcano|ghard|aqabat/.test(s)) return 'White Desert';
    if (/qasr-al-farafra|fortress|badr|palm-groves/.test(s)) return 'Farafra Town';
    if (/el-qaf|off-road|road-to-dakhla/.test(s)) return 'Routes';
    return null;
  },

  'al-fayoum': (slug, _title) => {
    const s = slug.toLowerCase();
    if (/pyramid-of-(hawara|al-lahun)|kom-ushim|karanis|medinet-madi|biahmu/.test(s)) return 'Ancient Sites';
    if (/wadi-(al|el)-rayan|wadi-al-hittan|waterwheels/.test(s)) return 'Nature';
    if (/hanging-mosque|mosque-of-qaitbey/.test(s)) return 'Town';
    return null;
  },

  qena: (slug, _title) => {
    const s = slug.toLowerCase();
    // Almost all Qena attractions are sub-parts of the Dendera Temple Complex.
    if (/dendera|hathor|chapel-of-the-disc|hypostyle-hall|nectanebo-mammisi|roman-mammisi|temple-precinct|cleopatra-and-caesarion|hathor-and-bes|osiris-chapels|zodiac/.test(s)) return 'Dendera Temple Complex';
    return null;
  },

  'marsa-alam': (slug, _title) => {
    const s = slug.toLowerCase();
    if (/sataya-reef|abu-dabbab|hamata-islands|sharm-el-luli/.test(s)) return 'Reefs and Beaches';
    if (/wadi-el-(gemal|gamal)|camel-market|shalateen|port-ghalib|town-of-marsa-alam/.test(s)) return 'Land';
    return null;
  },

  'siwa-oasis': (slug, _title) => {
    const s = slug.toLowerCase();
    if (/shali|siwa-house-museum/.test(s)) return 'Town / Heritage';
    if (/temple-of-the-oracle|mountain-of-the-dead/.test(s)) return 'Temples and Tombs';
    if (/cleopatra-s-pool|fatnas|salt-lakes/.test(s)) return 'Springs and Lakes';
    if (/great-sand-sea|dakrour/.test(s)) return 'Desert';
    return null;
  },

  'saint-catherine': (slug, _title) => {
    const s = slug.toLowerCase();
    if (/saint-catherine-monastery|library-of-the-monastery|fatimid-mosque/.test(s)) return 'Monastery Complex';
    if (/mount-sinai|jebel-musa|saint-catherine-mountain/.test(s)) return 'Mountains';
    if (/serabit-el-khadim|al-hakim/.test(s)) return 'Outlying Sites';
    return null;
  },

  'abu-simbel': (slug, _title) => {
    const s = slug.toLowerCase();
    if (/the-great-temple|the-small-temple|great-temple-of-ramses|small-temple-of-hathor/.test(s)) return 'Abu Simbel Complex';
    if (/temple-of-amada|temple-of-derr|qasr-ibrim|lake-nasser/.test(s)) return 'Lake Nasser Temples';
    return null;
  },

  'al-minya': (slug, _title) => {
    const s = slug.toLowerCase();
    if (/beni-hasan|speos-artemidos|tell-el-amarna|amarna/.test(s)) return 'East Bank';
    if (/el-ashmunein|ashmunein|tuna-el-gebel|tuna-al-gebel/.test(s)) return 'West Bank';
    return null;
  },

  'wadi-el-natrun': (slug, _title) => {
    const s = slug.toLowerCase();
    if (/monastery|paromeos|baramus|syrian|surian|pishoy|bishoi|macarius|deir/.test(s)) return 'Monasteries';
    return null;
  },

  'bahariya-oasis': (slug, _title) => {
    const s = slug.toLowerCase();
    if (/al-qasr-village|bawiti|el-hayz|el-haiz/.test(s)) return 'Towns and Villages';
    if (/crystal-mountain|valley-of-the-golden-mummies|black-desert|english-mountain|salt-lake/.test(s)) return 'Sites of Interest';
    return null;
  },

  hurghada: (slug, _title) => {
    const s = slug.toLowerCase();
    if (/abu-nuhas|giftun|straits-of-gubal|gota-abu-ramada|carless-reef|small-giftun|big-giftun/.test(s)) return 'Diving Sites';
    if (/hurghada-aquarium|hurghada-marina|el-dahar|sahl-hasheesh|el-gouna/.test(s)) return 'Onshore';
    return null;
  },

  'kharga-oasis': (slug, _title) => {
    const s = slug.toLowerCase();
    if (/hibis-temple|fortress-and-temple-at-nadura|nadura|qasr-el-ghueita|qasr-al-ghueita|cemetery-of-el-bagawat|bagawat|qasr-el-zayan|qasr-al-zayan/.test(s)) return 'Ancient Sites';
    if (/kharga-cultural-museum|kharga-museum/.test(s)) return 'Town';
    return null;
  },

  'al-arish': (slug, _title) => {
    const s = slug.toLowerCase();
    if (/bardawil-lake|protected-area-of-zaranik|zaranik/.test(s)) return 'Coast and Lagoons';
    if (/ancient-city-of-pelusium|pelusium|fortress-of-al-arish/.test(s)) return 'Historic Sites';
    return null;
  },

  asyut: (slug, _title) => {
    const s = slug.toLowerCase();
    if (/convent-of-the-holy-virgin|dorunka|monastery/.test(s)) return 'Coptic';
    if (/necropolis-of-meir|tomb-of-khety/.test(s)) return 'Ancient';
    return null;
  },

  'beni-suef': (slug, _title) => {
    const s = slug.toLowerCase();
    if (/dishasha|ehnasya|meidum|pyramid/.test(s)) return 'Ancient Sites';
    return null;
  },

  dahab: (slug, _title) => {
    const s = slug.toLowerCase();
    if (/blue-hole|abu-galum/.test(s)) return 'Diving Sites';
    if (/coloured-canyon|colored-canyon/.test(s)) return 'Land';
    return null;
  },

  'kom-ombo': (slug, _title) => {
    const s = slug.toLowerCase();
    if (/gebel-el-silsila|khnum-temple|speos-of-horemheb|temple-of-kom-ombo/.test(s)) return 'Ancient Sites';
    return null;
  },

  sohag: (slug, _title) => {
    const s = slug.toLowerCase();
    if (/abydos/.test(s)) return 'Ancient';
    if (/red-monastery|white-monastery/.test(s)) return 'Coptic';
    return null;
  },
};

interface Row { _id: string; slug: string; title: string | null; current: string | null }

async function tagCity(client: SanityClient, citySlug: string, classifier: Classifier, args: Args): Promise<void> {
  const rows = await client.fetch<Row[]>(
    `*[_type=="guideArticle" && !(_id in path("drafts.**")) && kind=="attraction" && parentCity->slug[_key=="en"][0].value.current==$c]{
      _id, "slug": slug[_key=="en"][0].value.current, "title": title[_key=="en"][0].value, "current": placesToGoGroup
    } | order(slug asc)`,
    { c: citySlug },
  );
  console.log(`\n=== ${citySlug} — ${rows.length} attractions ===`);

  const proposals: Array<{ row: Row; group: string | null; reason: 'new' | 'overwrite' | 'noop' }> = [];
  for (const r of rows) {
    const proposed = classifier(r.slug, r.title);
    let reason: 'new' | 'overwrite' | 'noop';
    if (!proposed) reason = r.current ? 'noop' : 'noop';
    else if (!r.current) reason = 'new';
    else if (r.current === proposed) reason = 'noop';
    else reason = 'overwrite';
    proposals.push({ row: r, group: proposed, reason });
  }

  const buckets: Record<string, Row[]> = {};
  for (const p of proposals) {
    const k = p.group ?? '(untagged)';
    if (!buckets[k]) buckets[k] = [];
    buckets[k].push(p.row);
  }
  for (const [k, v] of Object.entries(buckets).sort()) {
    console.log(`  ${k.padEnd(20)}  ${v.length} attractions`);
    for (const r of v.slice(0, 3)) console.log(`    · ${r.slug}`);
    if (v.length > 3) console.log(`    … +${v.length - 3} more`);
  }

  const toWrite = proposals.filter((p) => p.reason === 'new' || p.reason === 'overwrite');
  console.log(`  → write: ${toWrite.length}  (new=${proposals.filter((p) => p.reason === 'new').length}, overwrite=${proposals.filter((p) => p.reason === 'overwrite').length}, noop=${proposals.filter((p) => p.reason === 'noop').length})`);

  if (args.dryRun) return;

  if (toWrite.length === 0) {
    console.log('  (nothing to write)');
    return;
  }

  // Batch in a single transaction
  let tx = client.transaction();
  for (const p of toWrite) {
    tx = tx.patch(p.row._id, (pp) => pp.set({ placesToGoGroup: p.group! }));
  }
  await tx.commit({ visibility: 'sync' });
  for (const p of toWrite) appendLog({ phase: 'CLEANUP-tag-group', _id: p.row._id, slug: p.row.slug, group: p.group, reason: p.reason });
  console.log(`  ✓ wrote ${toWrite.length} tags`);
}

async function main() {
  const args = parseArgs(process.argv);
  const client = getClient();
  console.log(`mode: ${args.commit ? 'COMMIT' : 'dry-run'}${args.cityFilter ? `  city: ${args.cityFilter}` : ''}`);
  for (const [city, fn] of Object.entries(RULES)) {
    if (args.cityFilter && args.cityFilter !== city) continue;
    await tagCity(client, city, fn, args);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
