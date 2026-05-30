/**
 * PHASE 2 — Nile-cruise body/name text corrections.
 *
 * Companion to fix-cruise-data.ts (which handled the structured leaf fields:
 * capacity / tier / type). This script applies the prose edits enumerated in
 * "All 3 langs/Nile Cruises/Nile Cruises - Edits" — bringing the article text
 * into line with the corrected numbers.
 *
 * Mechanics: we read the COMPLETE body (and name) objects, mutate only the
 * `.text` of matching child spans in place, and write the whole field back via
 * raw @sanity/client. Because every block/span object is round-tripped verbatim
 * (only `.text` changes), all `_key`/`_type`/`marks`/`markDefs`/`style` survive
 * — this is the safe path vs the MCP _key-regeneration pitfall.
 *
 * Each find string must live wholly inside ONE span. Dry-run reports how many
 * spans matched per edit; a 0-match edit is flagged so it can be fixed before
 * committing. migration-staging only. Dry-run by default; pass --commit.
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();

type Rep = { find: string; replace: string };
type NameRep = { locale: string; find: string; replace: string };
type DocEdit = {
  id: string;
  label: string;
  capacity?: number; // optional leaf re-set
  name?: NameRep[];
  body?: Record<string, Rep[]>; // locale -> replacements
};

const EM = '—'; // U+2014 em dash
const EN = '–'; // U+2013 en dash

const EDITS: DocEdit[] = [
  // ── 1. Adelaïde — 12→10 rooms; correct breakdown (EN only; ES/JA correct) ──
  {
    id: 'wp-page-83685',
    label: 'Adelaïde Dahabiya',
    name: [{ locale: 'en', find: '12 Rooms', replace: '10 Rooms' }],
    body: {
      en: [
        { find: 'twelve rooms in total', replace: 'ten rooms in total' },
        {
          find: 'two Panoramic Suites and ten Luxury Rooms',
          replace: 'two Panoramic Suites, two Deluxe Suites, and six Luxury Rooms',
        },
        { find: 'across twelve guests', replace: 'across twenty guests' },
      ],
    },
  },

  // ── 2. Viking Aton — duplicated "between" typo (EN only) ──
  {
    id: 'nileCruise.viking-aton-nile-cruise',
    label: 'Viking Aton',
    body: {
      en: [
        {
          find: `in between between Luxor and Aswan`,
          replace: `between Luxor and Aswan`,
        },
      ],
    },
  },

  // ── 3. AmaDahlia — 36+16/72 → 34/68 (all 3 locales) ──
  {
    id: 'nileCruise.amawaterways-amadahlia-nile-cruise',
    label: 'AmaWaterways AmaDahlia',
    body: {
      // Numbers are bold spans split out of the paragraph; match span-exact.
      // The dek rep runs first so the bare "72 guests" rep below only hits the body span.
      en: [
        { find: `Nile ship ${EM} 72 guests`, replace: `Nile ship ${EM} 68 guests` },
        { find: '72 guests', replace: '68 guests' },
        { find: '36 staterooms and 16 suites', replace: '34 staterooms' },
      ],
      es: [
        { find: '72 pasajeros', replace: '68 pasajeros' },
        { find: '36 camarotes y 16 suites', replace: '34 camarotes' },
      ],
      ja: [
        { find: '36室のステートルームと16室のスイート', replace: '34室のステートルーム' },
        { find: '定員72名', replace: '定員68名' },
      ],
    },
  },

  // ── 4. Swiss Inn Radamis II — 65 → 72 (operator) EN + ES lead figure ──
  {
    id: 'wp-page-64053',
    label: 'Swiss Inn Radamis II',
    body: {
      en: [
        {
          find: 'The ship carries 65 cabins across several categories',
          replace: 'The ship carries 72 cabins across several categories',
        },
      ],
      es: [
        { find: 'lo presentan con 65 cabinas', replace: 'lo presentan con 72 cabinas' },
      ],
    },
  },

  // ── 5. Al Kahila — state ~70 (66+4); drop "unconfirmed" framing ──
  {
    id: 'wp-page-64459',
    label: 'M/S Al Kahila',
    body: {
      en: [
        {
          find: 'What it does confirm is a mid-to-upper-range vessel with a fitness centre',
          replace:
            `The Al Kahila carries around 70 rooms ${EM} 66 cabins and 4 suites, the same layout as its sister ship the Al-Jamila ${EM} and is a mid-to-upper-range vessel with a fitness centre`,
        },
        {
          find: `Without a confirmed cabin count, the Al Kahila cannot be positioned precisely within the Luxor${EN}Aswan fleet. The Sabena Group operator context`,
          replace: `At around 70 rooms, the Al Kahila sits in the mid-to-upper range of the Luxor${EN}Aswan fleet. The Sabena Group operator context`,
        },
      ],
      es: [
        {
          find: 'habla de 68 camarotes dobles y 4 suites',
          replace: 'habla de 66 camarotes dobles y 4 suites',
        },
      ],
      ja: [
        {
          find: '68のデラックスキャビンと4つのスイート',
          replace: '66のデラックスキャビンと4つのスイート',
        },
      ],
    },
  },

  // ── 6. Al-Jamila — add 66+4 (~70) to EN article (ES/JA already state it) ──
  {
    id: 'wp-page-64278',
    label: 'M/S Al-Jamila',
    body: {
      en: [
        {
          find: 'Cabins have French windows facing the river, individually controlled air conditioning, satellite television, Wi-Fi, minibar, safe, bathtub and shower, and tea and coffee facilities.',
          replace:
            `The Al-Jamila carries 66 cabins and 4 suites ${EM} around 70 rooms in total, the same layout as its sister ship the Al Kahila. Cabins have French windows facing the river, individually controlled air conditioning, satellite television, Wi-Fi, minibar, safe, bathtub and shower, and tea and coffee facilities.`,
        },
      ],
    },
  },

  // ── 7. Amwaj Livingstone — add 62 breakdown to EN article (ES/JA have it) ──
  {
    id: 'wp-page-64104',
    label: 'M/S Amwaj Livingstone',
    body: {
      en: [
        {
          find: 'The ship is a mid-range Nile cruiser. Cabins have French windows or balconies facing the river,',
          replace:
            'The ship is a mid-range Nile cruiser carrying 62 rooms — 46 standard cabins, 12 junior suites, 2 executive suites, and 2 royal suites. Cabins have French windows or balconies facing the river,',
        },
      ],
    },
  },

  // ── 8. Sun Ray — confirm 66 (matches ES/JA); drop "unconfirmed"; reset cap ──
  {
    id: 'wp-page-64331',
    label: 'Mövenpick M/S Sun Ray',
    capacity: 66, // was provisionally set 64 in Phase 1; ES/JA articles say 66
    body: {
      en: [
        {
          find: 'Whether the Sun Ray carries suites, and in what configuration, is also unconfirmed.',
          replace:
            `The Sun Ray carries 66 cabins and suites, in line with its Mövenpick fleet siblings on the Luxor${EN}Aswan run.`,
        },
      ],
    },
  },
];

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  useCdn: false,
  token: process.env.SANITY_STAGING_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
});

/** Replace `find`→`replace` in any single span that contains it. Returns count. */
function applyToBody(body: any[], locale: string, reps: Rep[]): { changed: boolean; report: string[] } {
  const report: string[] = [];
  let changed = false;
  const entry = (body || []).find((b: any) => b._key === locale);
  if (!entry || !Array.isArray(entry.value)) {
    reps.forEach((r) => report.push(`    [${locale}] ✗ no body for locale (find: "${r.find.slice(0, 40)}…")`));
    return { changed, report };
  }
  for (const r of reps) {
    let hits = 0;
    for (const block of entry.value) {
      if (block._type !== 'block' || !Array.isArray(block.children)) continue;
      for (const span of block.children) {
        if (typeof span.text === 'string' && span.text.includes(r.find)) {
          span.text = span.text.split(r.find).join(r.replace);
          hits++;
          changed = true;
        }
      }
    }
    report.push(
      `    [${locale}] ${hits > 0 ? '✓' : '✗ NOT FOUND'} (${hits})  "${r.find.slice(0, 50)}${r.find.length > 50 ? '…' : ''}"`
    );
  }
  return { changed, report };
}

function applyToName(name: any[], reps: NameRep[]): { changed: boolean; report: string[] } {
  const report: string[] = [];
  let changed = false;
  for (const r of reps) {
    const item = (name || []).find((n: any) => n._key === r.locale);
    if (item && typeof item.value === 'string' && item.value.includes(r.find)) {
      item.value = item.value.split(r.find).join(r.replace);
      changed = true;
      report.push(`    name[${r.locale}] ✓ "${r.find}" → "${r.replace}"`);
    } else {
      report.push(`    name[${r.locale}] ✗ NOT FOUND ("${r.find}")`);
    }
  }
  return { changed, report };
}

async function main() {
  const commit = process.argv.includes('--commit');
  if (process.env.NEXT_PUBLIC_SANITY_DATASET !== 'migration-staging') {
    throw new Error(`Refusing to run against dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}".`);
  }

  let totalWrites = 0;
  let missing = 0;

  for (const edit of EDITS) {
    const targets = [edit.id, `drafts.${edit.id}`];
    console.log(`\n• ${edit.label}  (${edit.id})`);

    for (const target of targets) {
      const doc = await client.fetch(`*[_id == $id][0]{_id, name, body}`, { id: target });
      if (!doc) {
        if (!target.startsWith('drafts.')) console.log(`    (published not found?!)`);
        continue;
      }
      const isDraft = target.startsWith('drafts.');
      const set: Record<string, any> = {};
      let docChanged = false;
      const lines: string[] = [];

      if (edit.name) {
        const { changed, report } = applyToName(doc.name || [], edit.name);
        report.forEach((l) => lines.push(l));
        if (changed) { set.name = doc.name; docChanged = true; }
        report.forEach((l) => { if (l.includes('NOT FOUND')) missing++; });
      }
      if (edit.body) {
        for (const [loc, reps] of Object.entries(edit.body)) {
          const { changed, report } = applyToBody(doc.body || [], loc, reps);
          report.forEach((l) => lines.push(l));
          if (changed) docChanged = true;
          report.forEach((l) => { if (l.includes('NOT FOUND') || l.includes('no body')) missing++; });
        }
        if (docChanged && edit.body) set.body = doc.body;
      }
      if (edit.capacity !== undefined) {
        set.capacity = edit.capacity;
        lines.push(`    capacity → ${edit.capacity}`);
        docChanged = true;
      }

      console.log(`  ${isDraft ? 'draft' : 'published'} [${target}]`);
      lines.forEach((l) => console.log(l));

      if (commit && docChanged) {
        await client.patch(target).set(set).commit({ visibility: 'async' });
        totalWrites++;
        console.log(`    → written`);
      }
    }
  }

  console.log(`\n${EDITS.length} docs processed. ${missing} unmatched find(s).`);
  if (commit) console.log(`  WRITTEN (${totalWrites} doc-patches).`);
  else console.log('  DRY RUN. Re-run with --commit once all finds show ✓.');
}

main().catch((e) => { console.error(e); process.exit(1); });
