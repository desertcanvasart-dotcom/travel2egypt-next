/**
 * Climate signature ES/JA draft fill — writes machine-translated `es`/`ja`
 * editorial slots into src/data/climate/index.ts for all 41 cities.
 *
 * ⚠️ THESE ARE CLAUDE-DRAFTED TRANSLATIONS, NOT PROFESSIONAL/OWNER-AUTHORED
 * ONES. The climate editorial copy was previously flagged "owner-authored,
 * LOCKED — never draft these strings" (see the file's own header, prior to
 * this run). The owner explicitly authorized a Claude draft here as a
 * starting point for native-speaker review — same pattern already used for
 * the JA legal-page draft (scripts/ja-legal-concierge-draft.ts).
 *
 * This script does NOT flip the locale render gate. The weather-page hero
 * stays EN-only (`kind=='climate' && locale=='en'` in
 * src/app/(site)/[locale]/guide/[citySlug]/[slug]/page.tsx) until a native
 * speaker + the owner review and approve the es/ja copy.
 *
 * Numeric-claim gate: every gapText/troughText/caption number+°  in es/ja
 * must match the corresponding EN string exactly (translations must preserve
 * every figure verbatim, per the owner-fill README's instruction) — this
 * script asserts that before writing anything.
 *
 * Idempotent guard: aborts if a city's editorial block already has es/ja.
 *
 * Run:  npx tsx scripts/climate-esja-draft-fill.ts
 */
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';

const SRC_PATH = 'src/data/climate/index.ts';
const TRANSLATIONS_PATH = 'docs/climate-esja-draft-translations.json';
const CSV_PATH = 'docs/climate-signature-copy-ES-JA-template-2026-07-08.csv';

type Field = 'descriptors' | 'gapText' | 'troughText' | 'caption' | 'seasonLabel';
const FIELDS: Field[] = ['descriptors', 'gapText', 'troughText', 'caption', 'seasonLabel'];

type Translations = Record<string, Record<Field, { es: string; ja: string }>>;

const translations: Translations = JSON.parse(readFileSync(TRANSLATIONS_PATH, 'utf8'));

// every '°' or '℃'-marked number token, incl. the '−2°' minus-sign case
const NUM_RE = /[−-]?\d+(?:[.,]\d+)?[°℃]/g;
function numbers(text: string): string[] {
  return (text.match(NUM_RE) ?? []).map((s) => s.replace('℃', '°').replace('−', '-'));
}

function jsLiteral(text: string): string {
  if (text.includes("'") || text.includes('"') || text.includes('\\')) {
    throw new Error(`unexpected quote/backslash in translated string: ${text}`);
  }
  return `'${text}'`;
}

function buildLocaleObject(indent: string, values: Record<Field, string>): string {
  const inner = `${indent}  `;
  return (
    `{\n` +
    FIELDS.map((f) => {
      if (f === 'caption') {
        return `${inner}${f}:\n${inner}  ${jsLiteral(values[f])},`;
      }
      return `${inner}${f}: ${jsLiteral(values[f])},`;
    }).join('\n') +
    `\n${indent}},`
  );
}

let src = readFileSync(SRC_PATH, 'utf8');
const cities = Object.keys(translations);
let insertCount = 0;

for (const slug of cities) {
  const bareAnchor = `\n  ${slug}: {`;
  const quotedAnchor = `\n  '${slug}': {`;
  const anchorIdx = src.includes(bareAnchor)
    ? src.indexOf(bareAnchor)
    : src.indexOf(quotedAnchor);
  if (anchorIdx === -1) throw new Error(`city anchor not found: ${slug}`);

  const editorialIdx = src.indexOf('\n    editorial: {\n      en: {', anchorIdx);
  if (editorialIdx === -1) throw new Error(`editorial/en block not found for: ${slug}`);

  // en block's own close is the FIRST "\n      }," after the en anchor
  const enCloseIdx = src.indexOf('\n      },', editorialIdx + 1);
  if (enCloseIdx === -1) throw new Error(`en close not found for: ${slug}`);
  const enCloseEnd = enCloseIdx + '\n      },'.length;

  // guard against double-run: the next 40 chars shouldn't already say es:/ja:
  const already = src.slice(enCloseEnd, enCloseEnd + 60);
  if (already.includes('es:') || already.includes('ja:')) {
    throw new Error(`${slug} already has es/ja — aborting (idempotent guard)`);
  }

  // extract EN block text to run the numeric-claim gate against
  const enBlockStart = editorialIdx + '\n    editorial: {\n      en: {'.length;
  const enBlockText = src.slice(enBlockStart, enCloseIdx);

  const t = translations[slug];
  for (const f of FIELDS) {
    if (f === 'gapText' || f === 'troughText' || f === 'caption') {
      // pull this field's EN value out of the block via a small per-field regex
      const fieldRe =
        f === 'caption'
          ? /caption:\s*\n\s*'([^']*(?:\\'[^']*)*)'/
          : new RegExp(`${f}: '([^']*(?:\\\\'[^']*)*)'`);
      const m = enBlockText.match(fieldRe);
      if (!m) continue; // shouldn't happen given the schema, but don't block on it
      const enNums = numbers(m[1]).sort();
      const esNums = numbers(t[f].es).sort();
      const jaNums = numbers(t[f].ja).sort();
      const mismatch = (arr: string[]) => JSON.stringify(arr) !== JSON.stringify(enNums);
      if (mismatch(esNums)) {
        throw new Error(
          `numeric-claim gate FAILED for ${slug}.${f} (es): en=${enNums} es=${esNums}`
        );
      }
      if (mismatch(jaNums)) {
        throw new Error(
          `numeric-claim gate FAILED for ${slug}.${f} (ja): en=${enNums} ja=${jaNums}`
        );
      }
    }
  }

  const esBlock = `\n      es: ${buildLocaleObject('      ', {
    descriptors: t.descriptors.es,
    gapText: t.gapText.es,
    troughText: t.troughText.es,
    caption: t.caption.es,
    seasonLabel: t.seasonLabel.es,
  })}`;
  const jaBlock = `\n      ja: ${buildLocaleObject('      ', {
    descriptors: t.descriptors.ja,
    gapText: t.gapText.ja,
    troughText: t.troughText.ja,
    caption: t.caption.ja,
    seasonLabel: t.seasonLabel.ja,
  })}`;

  src = src.slice(0, enCloseEnd) + esBlock + jaBlock + src.slice(enCloseEnd);
  insertCount++;
}

if (insertCount !== 41) throw new Error(`expected 41 insertions, got ${insertCount}`);

// ---- update the file header to reflect the new (draft, unreviewed) state ----
const OLD_HEADER_NOTE = `EDITORIAL COPY is owner-authored and LOCKED. The \`en\` slots below are wired
 * verbatim from climate-signature-copy-en-v1.csv. \`es\`/\`ja\` are intentionally
 * empty: weather pages are EN-only at launch (the template locale-gates the
 * hero), and the ES/JA editorial batch lands later, journeys-style. Never
 * draft these strings.`;

const NEW_HEADER_NOTE = `EDITORIAL COPY: the \`en\` slots are owner-authored and LOCKED, wired verbatim
 * from climate-signature-copy-en-v1.csv — never redraft those.
 *
 * ⚠️  \`es\`/\`ja\` slots are CLAUDE-DRAFTED MACHINE TRANSLATIONS staged
 * 2026-07-09 (docs/climate-esja-draft-translations.json,
 * scripts/climate-esja-draft-fill.ts), UNREVIEWED — the owner explicitly
 * authorized this as a starting point, same as the JA legal-page draft. Do
 * not treat as authoritative. Needs a native-speaker pass (ES + JA) before
 * publish. The render gate stays EN-only (\`locale=='en'\`) in the weather
 * page until that review + the locale gate is explicitly flipped — see the
 * master to-do (project_master_todo memory) item C3.`;

if (!src.includes(OLD_HEADER_NOTE)) throw new Error('header note anchor not found — aborting before header edit');
src = src.replace(OLD_HEADER_NOTE, NEW_HEADER_NOTE);

mkdirSync('backups', { recursive: true });
copyFileSync(SRC_PATH, 'backups/climate-index-pre-esja-draft-2026-07-09.ts');
writeFileSync(SRC_PATH, src);
console.log(`✓ wrote es/ja editorial blocks for ${insertCount} cities into ${SRC_PATH}`);
console.log(`  rollback: backups/climate-index-pre-esja-draft-2026-07-09.ts`);

// ---- regenerate the owner-fill CSV with es/ja filled, for the audit trail ----
function csvField(v: string): string {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}
const csvLines = readFileSync(CSV_PATH, 'utf8').split('\n');
const header = csvLines[0];
const out = [header];
for (const line of csvLines.slice(1)) {
  if (!line.trim()) continue;
  const m = line.match(/^([a-z0-9-]+),([a-zA-Z]+),/);
  if (!m) { out.push(line); continue; }
  const [, slug, field] = m;
  const t = translations[slug]?.[field as Field];
  if (!t) { out.push(line); continue; }
  // re-parse this line properly (en may be CSV-quoted and contain commas) so
  // re-running against an already-filled CSV replaces es/ja instead of
  // appending duplicate columns
  const parsed = line.match(/^([a-z0-9-]+),([a-zA-Z]+),(".*?"|[^,]*),/);
  if (!parsed) { out.push(line); continue; }
  const enRaw = parsed[3];
  out.push(`${slug},${field},${enRaw},${csvField(t.es)},${csvField(t.ja)}`);
}
writeFileSync(CSV_PATH, out.join('\n') + '\n');
console.log(`✓ regenerated ${CSV_PATH} with es/ja filled (audit trail)`);
