/**
 * Only in Hurghada — Mahmya is on Big Giftun (Giftun Kebir), not Little Giftun.
 * Founder-approved 2026-09-14 while publishing the Giftun Islands guide page.
 * Rewrites one span per locale (keys preserved, internalLink marks untouched),
 * guarded by the doc revision. Rollback JSON written before the write.
 *   npx tsx scripts/fix-only-in-hurghada-mahmya-2026-09-14.ts --dry-run | --commit
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
loadEnv();
const DOC = 'guideArticle.hurghada.only-in-hurghada';
const EDITS: { locale: string; block: string; span: string; from: string; to: string }[] = [
  { locale: 'en', block: '00000000001f', span: '0uaeijlt2ec9',
    from: 'Mahmya beach on Giftun Saghir is the most popular destination, with its white sand, calm shallow water, and easy reef access. Big Giftun (Giftun Kebir) is the larger and quieter island. Boat trips depart daily from ',
    to:   'Mahmya beach, on the south side of Big Giftun (Giftun Kebir), is the most popular destination, with its white sand, calm shallow water, and easy reef access. Little Giftun (Giftun Soraya) is the smaller and quieter island. Boat trips depart daily from ' },
  { locale: 'es', block: '000000000027', span: '000000000026',
    from: 'La playa de Mahmya, en la Giftun Saghir, es el destino más popular, con su arena blanca, sus aguas tranquilas y poco profundas y su fácil acceso al arrecife. La Giftun Kebir es la isla mayor y más tranquila. Las excursiones en barco salen a diario del puerto deportivo de Hurghada y de Sakkala, e incluyen normalmente esnórquel en dos o tres paradas de arrecife, comida a bordo o en la playa y el viaje de regreso.',
    to:   'La playa de Mahmya, en el lado sur de la Giftun Kebir, es el destino más popular, con su arena blanca, sus aguas tranquilas y poco profundas y su fácil acceso al arrecife. La Giftun Soraya es la isla menor y más tranquila. Las excursiones en barco salen a diario del puerto deportivo de Hurghada y de Sakkala, e incluyen normalmente esnórquel en dos o tres paradas de arrecife, comida a bordo o en la playa y el viaje de regreso.' },
  { locale: 'ja', block: '00000000002d', span: 'ynq4x87f6hhk',
    from: 'ギフトン・サギールにあるマフミヤ・ビーチが最も人気の目的地で、白砂、穏やかで浅い水、そして簡単に近づける礁を備えています。大ギフトン(ギフトン・ケビール)はより大きく静かな島です。船の遠足は',
    to:   '大ギフトン(ギフトン・ケビール)の南側にあるマフミヤ・ビーチが最も人気の目的地で、白砂、穏やかで浅い水、そして簡単に近づける礁を備えています。小ギフトン(ギフトン・ソラヤ)はより小さく静かな島です。船の遠足は' },
];
const commit = process.argv.includes('--commit');
if (!commit && !process.argv.includes('--dry-run')) { console.error('pass --dry-run or --commit'); process.exit(2); }
const client = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: 'production', apiVersion: '2024-12-01', useCdn: false, perspective: 'raw',
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN });
(async () => {
  const doc = await client.getDocument(DOC) as { _rev: string; body: { _key: string; value: { _key: string; children: { _key: string; text: string }[] }[] }[] };
  if (!doc) throw new Error('doc not found');
  writeFileSync(resolve(process.cwd(), 'backups', `only-in-hurghada-before-mahmya-fix-2026-09-14.json`), JSON.stringify(doc, null, 2));
  const patch = client.patch(DOC).ifRevisionId(doc._rev);
  for (const e of EDITS) {
    const span = doc.body.find((l) => l._key === e.locale)?.value.find((b) => b._key === e.block)?.children.find((s) => s._key === e.span);
    if (!span) throw new Error(`[${e.locale}] span not found`);
    if (span.text !== e.from) throw new Error(`[${e.locale}] PRE-FLIGHT MISMATCH — live text differs from expected:\n  live: ${span.text}`);
    patch.set({ [`body[_key=="${e.locale}"].value[_key=="${e.block}"].children[_key=="${e.span}"].text`]: e.to });
    console.log(`[${e.locale}] ok — will replace ${e.from.length} chars with ${e.to.length} chars`);
  }
  if (!commit) { console.log('dry-run: no write'); return; }
  const res = await patch.commit();
  console.log('committed, new rev', res._rev);
})().catch((e) => { console.error(e); process.exit(1); });
