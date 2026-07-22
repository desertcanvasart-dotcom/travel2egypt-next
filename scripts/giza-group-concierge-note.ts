/**
 * Giza group tour: promote the body's closing tailoring paragraph to the
 * structured `conciergeNote` field so it renders with the same styled note
 * design (kicker + note box) private tours use (owner request 2026-07-22).
 * Each locale's own concierge-flavored closer moves; the blocks leave the body.
 *   npx tsx scripts/giza-group-concierge-note.ts
 */
import { writeFileSync } from 'node:fs';

import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();

const ID = 'tour.pyramids-of-giza-and-sphinx-group-day-tour';
/** locale → the body block _key that becomes the concierge note. */
const MOVE: Record<string, string> = {
  en: '00000000002a', // "A natural pairing with the new Grand Egyptian Museum…"
  es: '00000000002e', // "Esta es una ruta abierta…"
  ja: '00000000001a', // "これは出発点であり、固定パッケージではありません…"
};

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: 'production',
  apiVersion: '2024-12-01',
  useCdn: false,
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  perspective: 'raw',
});

async function main() {
  const doc = await client.getDocument(ID);
  if (!doc) throw new Error('doc not found');
  writeFileSync(
    `backups/giza-group-tour-before-concierge-note-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify(doc, null, 2),
  );

  const body = doc.body as Array<{ _key: string; value: Array<{ _key: string; children?: Array<{ text?: string }> }> }>;
  const note: Array<{ _key: string; _type: string; value: string }> = [];

  for (const [locale, blockKey] of Object.entries(MOVE)) {
    const lb = body.find((b) => b._key === locale);
    const block = lb?.value.find((b) => b._key === blockKey);
    const text = block?.children?.map((s) => s.text ?? '').join('');
    if (!text) throw new Error(`${locale}: block ${blockKey} not found or empty`);
    note.push({ _key: locale, _type: 'internationalizedArrayStringValue', value: text });
    lb!.value = lb!.value.filter((b) => b._key !== blockKey);
    console.log(`${locale}: → conciergeNote (${text.slice(0, 60)}…)`);
  }

  await client.patch(ID).set({ body, conciergeNote: note }).commit();
  console.log('patched ✓');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
