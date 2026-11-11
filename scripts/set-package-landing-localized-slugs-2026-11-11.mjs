// Owner-approved 2026-11-11: ES/JA slugs for the 10 package theme landings
// (they had only an EN slug, so /es and /ja served the English URL).
// Run from repo root AFTER the redirect PR deploys:
//   node scripts/set-package-landing-localized-slugs-2026-11-11.mjs [--apply]
import 'dotenv/config';
import { createClient } from '@sanity/client';

const M = {
  'egypt-on-the-go': ['egipto-en-marcha', 'ejiputo-on-za-go'],
  'egypt-and-the-red-sea': ['egipto-y-el-mar-rojo', 'ejiputo-to-kokai'],
  'egypt-family-holidays': ['vacaciones-en-familia-en-egipto', 'ejiputo-kazoku-ryoko'],
  'egypt-luxury-holidays': ['vacaciones-de-lujo-en-egipto', 'ejiputo-ragujuarii-ryoko'],
  'hassle-free-egypt': ['egipto-sin-complicaciones', 'tema-irazu-no-ejiputo'],
  'egypt-in-depth': ['egipto-en-profundidad', 'ejiputo-fukabori-tsua'],
  'multiday-adventure-and-safari-tours': ['tours-de-aventura-y-safari', 'adobencha-safari-tsua'],
  'nile-cruise-holidays': ['vacaciones-en-crucero-por-el-nilo', 'nairu-kuruzu-no-kyuka'],
  'special-interest-tours': ['tours-de-interes-especial', 'tokubetsu-kanshin-tsua'],
  'authentic-dahabiya-nile-cruise': ['crucero-autentico-en-dahabiya-por-el-nilo', 'honkaku-dahabiya-nairu-kuruzu'],
};
const apply = process.argv.includes('--apply');
const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, dataset: 'production', apiVersion: '2024-01-01',
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN, useCdn: false,
});
const item = (k, v) => ({ _key: k, _type: 'object', value: { _type: 'slug', current: v } });
const tx = c.transaction();
for (const [en, [es, ja]] of Object.entries(M)) {
  for (const id of [`tourLanding.${en}`, `drafts.tourLanding.${en}`]) {
    const doc = await c.getDocument(id);
    if (!doc) continue;
    const enSlug = doc.slug?.find((s) => s._key === 'en')?.value?.current;
    if (enSlug !== en) throw new Error(`${id}: EN slug is ${enSlug}`);
    const slug = [...doc.slug.filter((s) => s._key === 'en'), item('es', es), item('ja', ja)];
    console.log(`${id}: es=${es} ja=${ja}`);
    tx.patch(id, (p) => p.set({ slug }));
  }
}
if (apply) { const r = await tx.commit(); console.log('committed', r.transactionId); } else console.log('dry run (pass --apply)');
