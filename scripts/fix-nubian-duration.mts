import { createClient } from '@sanity/client';
import { config } from 'dotenv';
config({ path: '/Users/islamhussein/t2e/.env' });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: 'production', apiVersion: '2024-12-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN, perspective: 'raw' });
const i18n = (en: string, es: string, ja: string) => [
  { _key: 'en', _type: 'internationalizedArrayStringValue', value: en },
  { _key: 'es', _type: 'internationalizedArrayStringValue', value: es },
  { _key: 'ja', _type: 'internationalizedArrayStringValue', value: ja },
];
await c.patch('tour.nubian-temples-day-tour-from-aswan').set({
  durationHours: 5,
  durationLabel: i18n('Half day · ~5–6 hrs', 'Medio día · ~5–6 h', '半日・約5〜6時間'),
}).commit();
console.log('nubian temples → half day (durationHours 5)');
