/**
 * The licensed company that operates Travel2Egypt (owner, 2026-09-26).
 * Shown in the footer and emitted as Organization.legalName / the ETAA
 * credential in structured data; the contact page (Sanity) carries the same.
 */
export const LEGAL_NAME = 'Capital Travel Service';
export const LEGAL_ADDRESS = '1 Farouk Mahmoud St, Giza, Cairo';
export const ETAA_LICENCE_NUMBER = '2179';
/** Ministry of Tourism licence — the same number ETAA lists (owner, 2026-11-08). */
export const MINISTRY_LICENCE_NUMBER = ETAA_LICENCE_NUMBER;
/** IATA agency number (owner, 2026-11-08). */
export const IATA_NUMBER = '9022839';
export const ETAA_LICENCE_URL =
  'https://www.etaa-egypt.org/SitePages/CompanyDetailsEn.aspx?licc=2179';

/**
 * Tripadvisor listing + score (read off the live listing 2026-11-08: 4.9,
 * 87 reviews; owner confirmed 87). Update both numbers together, by hand,
 * when the listing moves — never scrape or invent. Shown as text only: no
 * aggregateRating in Organization JSON-LD (self-served ratings on an
 * organisation are ignored by Google and read as manipulative).
 */
export const TRIPADVISOR_URL =
  'https://www.tripadvisor.com/Attraction_Review-g294201-d17406742-Reviews-Travel2Egypt-Cairo_Cairo_Governorate.html';
export const TRIPADVISOR_RATING = '4.9';
export const TRIPADVISOR_REVIEW_COUNT = 87;
