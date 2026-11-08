/** s47 B4 follow-up 2026-09-07: the analytics bullet said the Sentry section is "below"; it is above. One-span fix ×3 locales. */
import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, dataset: process.env.NEXT_PUBLIC_SANITY_DATASET, apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN, useCdn: false });
const fixes: Record<string, [string, string, string]> = {
  en: ['566e7cb5a6d7', 'under “Error monitoring” below', 'under “Error monitoring” above'],
  es: ['a862d3aab5ff0', 'se describe más abajo, en «Supervisión de errores»', 'se describe más arriba, en «Supervisión de errores»'],
  ja: ['a862d3aab5ff0', '下記の「エラー監視」で', '上記の「エラー監視」で'],
};
(async () => {
  const doc = await c.getDocument('legal-cookie-policy') as any;
  const tx = c.transaction();
  for (const [l, [spanKey, from, to]] of Object.entries(fixes)) {
    const blk = doc.body.find((b: any) => b._key === l).value.find((b: any) => b._key === 'a862d3aab5ff');
    const sp = blk.children.find((s: any) => s._key === spanKey);
    if (!sp.text.includes(from)) throw new Error(`${l}: expected text not found`);
    tx.patch('legal-cookie-policy', (p) => p.set({ [`body[_key=="${l}"].value[_key=="a862d3aab5ff"].children[_key=="${spanKey}"].text`]: sp.text.replace(from, to) }));
    console.log(`${l}: "${from}" -> "${to}"`);
  }
  const r = await tx.commit(); console.log('tx', r.transactionId);
})().catch((e) => { console.error(e.message); process.exit(1); });
