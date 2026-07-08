/* ============================================================================
 * prices/index.ts — verified attraction ticket data for the price-manifest.
 *
 * PRICES & NAMES: owner-verified sheet delivered 2026-07-07 ("Entrance
 * Fees.csv", accurate as of that date) — the "Checked July 2026" stamp
 * covers these columns. Loaded VERBATIM; do not edit values here without a
 * fresh owner verification (and update `checked` in the same commit).
 *
 * HOURS: carried over from the pages' LEGACY bullet tables by name-match —
 * NOT covered by the verification stamp (owner's explicit call, 2026-07-07).
 * Rows with no confident legacy match have no hours and render an em-dash.
 *
 * NOTES: owner-authored, verbatim from the sheet's notes column.
 *
 * Keyed by guideArticle doc id. A page absent from this map keeps its
 * current bullet rendering (the rollout gate).
 * ==========================================================================*/

export interface PriceRow {
  site: string;
  adult: string;   // EGP, as written on the owner sheet (e.g. '1,640')
  student: string;
  hours?: string;  // '08:00 – 17:00' — legacy-sourced, unverified
  note?: string;   // owner-authored italic site note
}

export interface PricePage {
  /** The verification stamp value — owner-supplied. */
  checked: string;
  sections: Array<{ kicker: string; rows: PriceRow[] }>;
  /**
   * 'en' (default): manifest renders on EN only — legacy pages keep their
   * ES/JA bullet rendering until the localized editorial batch.
   * 'all': pages CREATED for the manifest (no legacy body in any locale) —
   * an EN-chrome table beats a blank page; chrome localizes with the batch.
   */
  localeGate?: 'en' | 'all';
}

export const priceData: Record<string, PricePage> = {
  // ── Alexandria ──
  'wp-page-72292': {
    checked: 'July 2026',
    sections: [
      { kicker: 'Alexandria Governorate', rows: [
        { site: 'Serapeum of Alexandria', adult: '250', student: '150', hours: '09:00 – 17:00' },
        { site: 'Catacombs', adult: '250', student: '150', hours: '09:00 – 17:00' },
        { site: 'Alexandria National Museum', adult: '270', student: '160', hours: '09:00 – 17:00' },
        { site: 'Qaitbay Citadel', adult: '250', student: '150', hours: '09:00 – 17:00' },
        { site: 'Ancient Roman Theatre', adult: '250', student: '150', hours: '09:00 – 17:00' },
        { site: 'Royal Jewellery Museum', adult: '270', student: '160', hours: '09:00 – 17:00' },
        { site: 'Graeco-Roman Museum', adult: '450', student: '250', hours: '09:00 – 17:00' },
      ] },
    ],
  },
  // ── Al Minya & Asyut ──
  'wp-page-72364': {
    checked: 'July 2026',
    sections: [
      { kicker: 'Minya Governorate', rows: [
        { site: 'Fraser Tombs', adult: '150', student: '100', hours: '08:00 – 16:00' },
        { site: 'Zawyet Sultan', adult: '150', student: '100', hours: '08:00 – 16:00' },
        { site: 'Amarna', adult: '250', student: '150', hours: '08:00 – 16:00' },
        { site: 'Malawy Museum', adult: '170', student: '110', hours: '08:00 – 16:00' },
        { site: 'Beni Hassan Tomb', adult: '250', student: '150', hours: '08:00 – 16:00' },
        { site: 'Tuna el-Gebel', adult: '250', student: '150', hours: '08:00 – 16:00' },
      ] },
      { kicker: 'Asyut Governorate', rows: [
        { site: 'Meir Monumental Tombs', adult: '150', student: '100' },
        { site: 'Alhammamya Tombs', adult: '150', student: '100', hours: '07:00 – 17:00' },
      ] },
    ],
  },
  // ── Aswan ──
  'wp-page-72314': {
    checked: 'July 2026',
    sections: [
      { kicker: 'Aswan Governorate', rows: [
        { site: 'Abu Simbel Temple', adult: '872', student: '495', hours: '05:00 – 17:00' },
        { site: 'Philae Temple', adult: '600', student: '325', hours: '07:00 – 16:00' },
        { site: 'Kom Ombo Temple', adult: '500', student: '275', hours: '07:00 – 16:00' },
        { site: 'Unfinished Obelisk', adult: '270', student: '160', hours: '07:00 – 16:00' },
        { site: 'Nubia Museum', adult: '450', student: '250', hours: '09:00 – 16:00 (Tue & Fri to 17:00)' },
        { site: 'Temple Of Amada', adult: '200', student: '125', hours: '07:00 – 16:00' },
        { site: 'Temple Of Wadi El-Sebua', adult: '200', student: '125', hours: '07:00 – 16:00' },
        { site: 'Temple of Kalabsha', adult: '250', student: '150', hours: '07:00 – 16:00' },
        { site: 'Elkab Tombs', adult: '250', student: '150', hours: '07:00 – 16:00' },
        { site: 'Samaan Monastery', adult: '150', student: '100', hours: '07:00 – 16:00' },
        { site: 'Air Dome', adult: '250', student: '150', hours: '07:00 – 16:00' },
        { site: 'High Dam', adult: '300', student: '150', hours: '07:00 – 17:00' },
        { site: 'Elephantine Island', adult: '250', student: '150', hours: '07:00 – 16:00' },
        { site: 'Sehel Island', adult: '150', student: '100', hours: '07:00 – 16:00' },
        { site: 'Gebel al-Silsila', adult: '150', student: '100', hours: '07:00 – 16:00' },
      ] },
    ],
  },
  // ── Beni Suef ──
  'wp-page-72323': {
    checked: 'July 2026',
    sections: [
      { kicker: 'Beni Suef Governorate', rows: [
        { site: 'The Pyramids of Meidum', adult: '200', student: '125' },
      ] },
    ],
  },
  // ── Cairo ──
  'wp-page-72325': {
    checked: 'July 2026',
    sections: [
      { kicker: 'Cairo Governorate', rows: [
        { site: 'Egyptian Museum', adult: '600', student: '325', hours: '09:00 – 17:00' },
        { site: 'Coptic Museum', adult: '330', student: '190', hours: '09:00 – 17:00' },
        { site: 'Salah Eldin Citadel', adult: '600', student: '325', hours: '09:00 – 17:00' },
        { site: 'Islamic art museum', adult: '390', student: '220', hours: '09:00 – 17:00' },
        { site: 'Baron Empain Palace', adult: '270', student: '160', hours: '09:00 – 17:00' },
        { site: 'Prince Mohamed Aly Palace', adult: '270', student: '160', hours: '09:00 – 17:00' },
        { site: 'National Museum of Egyptian Civilization', adult: '600', student: '350', hours: '09:00 – 17:00' },
        { site: 'Royal Chariots Museum', adult: '350', student: '200', hours: '09:00 – 17:00' },
        { site: 'Elmoez street', adult: '270', student: '160', hours: '09:00 – 17:00' },
        { site: 'Bab Zuwaila', adult: '150', student: '100', hours: '09:00 – 17:00' },
        { site: 'House of suhaym', adult: '270', student: '160', hours: '09:00 – 17:00' },
        { site: 'Wasila Historical House', adult: '150', student: '100', hours: '09:00 – 17:00' },
        { site: 'House of al-Harawy', adult: '150', student: '100', hours: '09:00 – 17:00' },
        { site: 'Sabiel Nafesa Al-Bayda', adult: '110', student: '80', hours: '09:00 – 17:00' },
        { site: 'Gamal El-Din El-Zahabi house', adult: '80', student: '65', hours: '09:00 – 17:00' },
        { site: 'Al Ghuri Dome', adult: '200', student: '125', hours: '09:00 – 17:00' },
        { site: 'Wikala Of Al-Guri', adult: '150', student: '100', hours: '09:00 – 17:00' },
        { site: 'Gayer Anderson Museum', adult: '150', student: '100', hours: '09:00 – 17:00' },
        { site: 'Mosque- Madrassa Sultan Hassan & Refai Mosque', adult: '270', student: '160', hours: '09:00 – 17:00' },
        { site: 'Mary\'s Tree', adult: '170', student: '110', hours: '09:00 – 17:00' },
        { site: 'Al Matariyyah Obelisk', adult: '250', student: '150', hours: '09:00 – 17:00' },
        { site: 'Rawda Island Nilometer', adult: '170', student: '110', hours: '09:00 – 17:00' },
      ] },
    ],
  },
  // ── Giza ──
  'wp-page-72327': {
    checked: 'July 2026',
    sections: [
      { kicker: 'Giza Governorate', rows: [
        { site: 'Giza plateau', adult: '750', student: '400', hours: '08:00 – 17:00' },
        { site: 'Saqqara Monuments', adult: '650', student: '350', hours: '08:00 – 17:00' },
        { site: 'Dahshur', adult: '250', student: '150', hours: '08:00 – 17:00' },
        { site: 'grand egyptian museum (GEM)', adult: '1,640', student: '850', hours: '09:00 – 17:00' },
        { site: 'Memphis', adult: '250', student: '150', hours: '08:00 – 17:00' },
      ] },
    ],
  },
  // ── Luxor ──
  'wp-page-72343': {
    checked: 'July 2026',
    sections: [
      { kicker: 'Luxor Governorate', rows: [
        { site: 'Luxor Temple', adult: '550', student: '300', hours: '06:00 – 21:00' },
        { site: 'Karnak Temple', adult: '650', student: '350', hours: '06:00 – 17:00' },
        { site: 'Hatshepsut Temple', adult: '490', student: '270', hours: '06:00 – 17:00' },
        { site: 'Deir El Madina – Tomb of Pashdo', adult: '170', student: '110', hours: '06:00 – 17:00', note: 'Sub-ticket of Deir El Madina — sold per tomb on booking page.' },
        { site: 'Deir El Madina – Deir El Medina', adult: '270', student: '160', hours: '06:00 – 17:00', note: 'Sub-ticket of Deir El Madina — sold per tomb on booking page.' },
        { site: 'Valley Of Kings', adult: '800', student: '425', hours: '06:00 – 17:00' },
        { site: 'Luxor Museum', adult: '450', student: '250', hours: '09:00 – 14:00, 17:00 – 21:00' },
        { site: 'Medinet Habu', adult: '270', student: '160', hours: '06:00 – 17:00' },
        { site: 'Mummification museum', adult: '270', student: '160', hours: '09:00 – 17:00' },
        { site: 'Ramesseum', adult: '270', student: '160', hours: '06:00 – 17:00' },
        { site: 'Tombs Of The Nobles – Rekhmire & Senn', adult: '170', student: '110', hours: '06:00 – 17:00', note: 'Sub-ticket of Tombs of the Nobles — sold per tomb on booking page.' },
        { site: 'Tombs Of The Nobles – Nakht & Menna', adult: '250', student: '150', hours: '06:00 – 17:00', note: 'Sub-ticket of Tombs of the Nobles — sold per tomb on booking page.' },
        { site: 'Tombs Of The Nobles – Khonsu', adult: '170', student: '110', hours: '06:00 – 17:00', note: 'Sub-ticket of Tombs of the Nobles — sold per tomb on booking page.' },
        { site: 'Tombs Of The Nobles – Gurnet Murai', adult: '170', student: '110', hours: '06:00 – 17:00', note: 'Sub-ticket of Tombs of the Nobles — sold per tomb on booking page.' },
        { site: 'Tombs Of The Nobles – Ramose', adult: '250', student: '150', hours: '06:00 – 17:00', note: 'Sub-ticket of Tombs of the Nobles — sold per tomb on booking page.' },
        { site: 'Tombs Of The Nobles – El Khokha', adult: '170', student: '110', hours: '06:00 – 17:00', note: 'Sub-ticket of Tombs of the Nobles — sold per tomb on booking page.' },
        { site: 'Tombs Of The Nobles – Abo Naga Arm North', adult: '170', student: '110', hours: '06:00 – 17:00', note: 'Sub-ticket of Tombs of the Nobles — sold per tomb on booking page.' },
        { site: 'Tombs Of The Nobles – Abo Naga Arm South', adult: '100', student: '75', hours: '06:00 – 17:00', note: 'Sub-ticket of Tombs of the Nobles — sold per tomb on booking page.' },
        { site: 'Tombs Of The Nobles – Seti The First Temple', adult: '250', student: '150', hours: '06:00 – 17:00', note: 'Sub-ticket of Tombs of the Nobles — sold per tomb on booking page.' },
        { site: 'Valley Of The Queens', adult: '270', student: '160', hours: '06:00 – 17:00' },
        { site: 'Carter House', adult: '270', student: '160', hours: '06:00 – 17:00' },
        { site: 'Mernpetah', adult: '150', student: '100', hours: '06:00 – 17:00' },
        { site: 'Deir El-shelwit', adult: '150', student: '100', hours: '06:00 – 17:00' },
        { site: 'El Assasif', adult: '250', student: '150', hours: '06:00 – 17:00' },
        { site: 'Tomb of pabasa', adult: '150', student: '100', hours: '06:00 – 17:00' },
        { site: 'El-Tod Temple', adult: '150', student: '100', hours: '06:00 – 17:00' },
        { site: 'Al-Mualla Tombs', adult: '150', student: '100', hours: '06:00 – 17:00' },
        { site: 'Mut Temple', adult: '250', student: '150', hours: '06:00 – 17:00' },
      ] },
    ],
  },
  // ── Qena ──
  'wp-page-72338': {
    checked: 'July 2026',
    sections: [
      { kicker: 'Qena Governorate', rows: [
        { site: 'Dandarah Temple', adult: '350', student: '200', hours: '07:00 – 17:00' },
        { site: 'Prince Youssef Palace', adult: '150', student: '100', hours: '07:00 – 17:00' },
      ] },
    ],
  },
  // ── Sohag ──
  'wp-page-72336': {
    checked: 'July 2026',
    sections: [
      { kicker: 'Sohag Governorate', rows: [
        { site: 'El Hawawish', adult: '200', student: '125', hours: '09:00 – 17:00' },
        { site: 'Merit Amun Temple', adult: '170', student: '110' },
        { site: 'Sohag National Museum', adult: '200', student: '125', hours: '09:00 – 17:00' },
        { site: 'Sheikh Hamad Area', adult: '200', student: '125', hours: '09:00 – 17:00' },
        { site: 'Abydos Temple', adult: '310', student: '180' },
        { site: 'Shunet El Zebib', adult: '150', student: '100' },
      ] },
    ],
  },
  // ── Pages created FOR the manifest 2026-07-07 (no legacy body; owner
  //    instruction "let's add Esna, Edfu & Siwa only"). Kickers name the
  //    sites' actual governorates. localeGate 'all' — see PricePage docs. ──
  'guideArticle.esna.ticket-prices-for-attractions-in-esna': {
    checked: 'July 2026',
    localeGate: 'all',
    sections: [
      { kicker: 'Luxor Governorate', rows: [
        { site: 'Esna Temple', adult: '250', student: '150' },
      ] },
    ],
  },
  'guideArticle.edfu.ticket-prices-for-attractions-in-edfu': {
    checked: 'July 2026',
    localeGate: 'all',
    sections: [
      { kicker: 'Aswan Governorate', rows: [
        { site: 'The Temple Of Horus', adult: '600', student: '325' },
      ] },
    ],
  },
  'guideArticle.siwa-oasis.ticket-prices-for-attractions-in-siwa': {
    checked: 'July 2026',
    localeGate: 'all',
    sections: [
      { kicker: 'Matrouh Governorate', rows: [
        { site: 'Temple of Aghurmi in Siwa', adult: '170', student: '110' },
        { site: 'Tombs of Gabal al-Mawta', adult: '170', student: '110' },
      ] },
    ],
  },
};

/* Verified rows for cities with NO price page yet (kept for the record —
 * nothing renders these until such pages exist): sharm-el-sheikh, hurghada,
 * esna, edfu, ismailia, rossetta, kafr el-shiekh, al-sharqia (Tanis), siwa. */
export const unplacedRows: Array<PriceRow & { city: string }> = [
  { site: 'Sharm El Sheikh Museum', adult: '250', student: '150', city: 'sharm-el-sheikh' },
  { site: 'Hurghada Museum', adult: '350', student: '200', city: 'hurghada' },
  { site: 'Suez canal Museum', adult: '350', student: '200', city: 'ismailia' },
  { site: 'Rosetta City Monuments', adult: '170', student: '110', city: 'rossetta' },
  { site: 'Kafr al-Sheikh Museum', adult: '270', student: '160', city: 'kafr el-shiekh' },
  { site: 'Tanis (San al-Hagar)', adult: '170', student: '110', city: 'al-sharqia' },
];
