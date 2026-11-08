/**
 * Homepage fix round 1, item 4 (2026-11-08) — licence/accreditation numbers
 * live ONLY in siteSettings.
 *
 *   node scripts/accreditations-settings-2026-11-08.mjs settings   → siteSettings: etaaNumber=2179, ministry/IATA unset
 *   node scripts/accreditations-settings-2026-11-08.mjs contact    → Contact page: drop JATA + ASTA lines (owner, 2026-11-08)
 *   node scripts/accreditations-settings-2026-11-08.mjs tokens     → Contact page: "2179" → {etaaNumber}, ETAA href → {etaaUrl}
 *                                                                     (run ONLY after the token-rendering code is live)
 * Add --write to apply; default is a dry run. Pre-change contact page backed
 * up to backups/editorial-page-contact-2026-11-08.json on first write.
 */
import 'dotenv/config';
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });
const [mode] = process.argv.slice(2);
const write = process.argv.includes('--write');
const CONTACT = 'editorial-page-contact';

if (mode === 'settings') {
  console.log('siteSettings → etaaNumber "2179"; unset ministryLicenceNumber, iataNumber');
  if (write) await c.patch('siteSettings').set({ etaaNumber: '2179' }).unset(['ministryLicenceNumber', 'iataNumber']).commit();
} else if (mode === 'contact' || mode === 'tokens') {
  const doc = await c.fetch(`*[_id == $id][0]`, { id: CONTACT });
  const backup = 'backups/editorial-page-contact-2026-11-08.json';
  if (write && !fs.existsSync(backup)) fs.writeFileSync(backup, JSON.stringify(doc, null, 2));
  const p = c.patch(CONTACT);
  if (mode === 'contact') {
    for (const key of ['fc41014c810b', '2cb2dc393fb4']) {
      const path = `sections[_key=="b977c08f393c"].body[_key=="en"].value[_key=="${key}"]`;
      console.log('unset', path);
      p.unset([path]);
    }
  } else {
    const sets = {
      'sections[_key=="bf7aca1f37f6"].body[_key=="en"].value[_key=="c1a3"].children[_key=="c1a6"].text': '{etaaNumber}',
      'sections[_key=="bf7aca1f37f6"].body[_key=="en"].value[_key=="c1a3"].markDefs[_key=="c1a4"].href': '{etaaUrl}',
      'sections[_key=="b977c08f393c"].body[_key=="en"].value[_key=="e3ae29717463"].children[_key=="c1b2"].text': 'licence no. {etaaNumber}',
      'sections[_key=="b977c08f393c"].body[_key=="en"].value[_key=="e3ae29717463"].markDefs[_key=="c1b0"].href': '{etaaUrl}',
    };
    for (const [k, v] of Object.entries(sets)) console.log('set', k, '=', v);
    p.set(sets);
  }
  if (write) await p.commit();
} else {
  console.log('usage: settings | contact | tokens  [--write]');
}
console.log(write ? 'written' : 'dry run');
