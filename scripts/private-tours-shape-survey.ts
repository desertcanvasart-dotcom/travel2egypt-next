/**
 * READ-ONLY survey of the private day tours: which carry an in-body "The shape
 * of the day" section, what heading/label variants they use, whether the
 * structured shapeOfDay / conciergeNote fields are set, concierge-style closing
 * paragraphs still in the body, price-ish debris, and masthead-vs-body duration
 * mismatches. No writes.
 *
 *   npx tsx scripts/private-tours-shape-survey.ts
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: 'production',
  apiVersion: '2024-12-01',
  useCdn: false,
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  perspective: 'raw',
});

const HEADING_RE = /^(the shape of the (day|journey)|la forma del (d[ií]a|viaje)|この一日の(輪郭|かたち)|一日の(かたち|輪郭)|旅の(輪郭|形))$/i;
const LABEL_RE = /^(Where|Ruta|D[oó]nde|どこへ|行程|ルート|Duration|Duraci[oó]n|所要時間|日数|Character|Car[aá]cter|行程の性格|性格|Pace|Ritmo|ペース|Dato|From|Desde|目安)\s*[·:：]/u;
const CONCIERGE_RE: Record<string, RegExp> = {
  en: /not the other way around|(built|shaped) around your (party|group)|concierge/i,
  es: /no al rev[eé]s|concierge|conserje/i,
  ja: /ご一行|コンシェルジュ|組み立て|組み直/,
};
const PRICE_RE = /(From\s*[€$¥]|Desde\s*[€$]|Three tiers|Tres niveles|三つの料金|entrance[- ]fee bundle|tiered pricing|precios? escalonad|料金は三段階)/i;

type Block = { _key: string; style?: string; children?: Array<{ text?: string }> };
type LocaleBody = { _key: string; value?: Block[] };
const text = (b: Block) => (b.children ?? []).map((s) => s.text ?? '').join('');

async function main() {
  const docs: Array<{
    _id: string;
    slug?: string;
    body?: LocaleBody[];
    shapeOfDay?: Record<string, Array<{ _key: string; value?: string }>>;
    conciergeNote?: Array<{ _key: string; value?: string }>;
    durationLabel?: Array<{ _key: string; value?: string }>;
  }> = await client.fetch(
    `*[_type == "tour" && type == "dayTour" && tourMode == "private" && !(_id in path("drafts.**"))]{
      _id, "slug": slug[_key=="en"][0].value.current, body, shapeOfDay, conciergeNote, durationLabel
    } | order(_id asc)`,
  );
  console.log(`private day tours (published): ${docs.length}\n`);

  let withShapeBody = 0, withShapeField = 0, withNoteField = 0, withNoteBody = 0, withPrice = 0, durMismatch = 0;
  const headingVariants = new Map<string, number>();
  const labelVariants = new Map<string, number>();
  const nonLabelAfterHeading = new Map<string, number>();

  for (const doc of docs) {
    const flags: string[] = [];
    const hasShapeField = ['where', 'duration', 'character'].some(
      (k) => (doc.shapeOfDay?.[k] ?? []).some((v) => v.value),
    );
    if (hasShapeField) withShapeField += 1;
    const hasNoteField = (doc.conciergeNote ?? []).some((v) => v.value);
    if (hasNoteField) withNoteField += 1;

    let shapeInBody = false, noteInBody = false, priceInBody = false, mismatch = false;
    for (const lb of doc.body ?? []) {
      const blocks = lb.value ?? [];
      const idx = blocks.findIndex((b) => HEADING_RE.test(text(b).trim()));
      if (idx !== -1) {
        shapeInBody = true;
        headingVariants.set(text(blocks[idx]).trim(), (headingVariants.get(text(blocks[idx]).trim()) ?? 0) + 1);
        for (let i = idx + 1; i < blocks.length; i++) {
          const t = text(blocks[i]).trim();
          if (LABEL_RE.test(t)) {
            labelVariants.set(t.split(/[·:：]/)[0].trim() + ` [${lb._key}]`, (labelVariants.get(t.split(/[·:：]/)[0].trim() + ` [${lb._key}]`) ?? 0) + 1);
          } else {
            const snip = `${lb._key}: ${t.slice(0, 90)}`;
            nonLabelAfterHeading.set(snip, (nonLabelAfterHeading.get(snip) ?? 0) + 1);
            break;
          }
        }
        // EN duration mismatch check
        if (lb._key === 'en') {
          const row = blocks.slice(idx + 1).map((b) => text(b).trim()).find((t) => /^Duration\s*·/.test(t));
          const label = doc.durationLabel?.find((l) => l._key === 'en')?.value;
          const n = (s: string) => (s.match(/(\d+(?:[–\-~〜]\d+)?)\s*(?:hrs|hours|h\b)/i) || [])[1];
          if (row && label && n(label) && n(row) && n(label) !== n(row)) { mismatch = true; }
        }
      }
      const last = blocks[blocks.length - 1];
      if (last && (CONCIERGE_RE[lb._key] ?? CONCIERGE_RE.en).test(text(last))) noteInBody = true;
      if (blocks.some((b) => PRICE_RE.test(text(b)))) priceInBody = true;
    }
    if (shapeInBody) { withShapeBody += 1; flags.push('shape-in-body'); }
    if (noteInBody) { withNoteBody += 1; flags.push(hasNoteField ? 'note-in-body(+FIELD SET)' : 'note-in-body'); }
    if (priceInBody) { withPrice += 1; flags.push('price-ish-in-body'); }
    if (mismatch) { durMismatch += 1; flags.push('DURATION-MISMATCH'); }
    if (flags.length) console.log(`■ ${doc.slug ?? doc._id}${hasShapeField ? ' [shapeField✓]' : ''}: ${flags.join(', ')}`);
  }

  console.log(`\nsummary: shape-in-body ${withShapeBody} · shapeOfDay field set ${withShapeField} · conciergeNote field set ${withNoteField} · note-in-body ${withNoteBody} · price-ish-in-body ${withPrice} · duration mismatches ${durMismatch}`);
  console.log('\nheading variants:', Object.fromEntries(headingVariants));
  console.log('\nlabel rows seen:', Object.fromEntries(labelVariants));
  console.log('\nfirst non-label row after heading (section terminator):');
  for (const [k, v] of nonLabelAfterHeading) console.log(`  ${v}× ${k}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
