/**
 * The licensed company that operates Travel2Egypt (owner, 2026-09-26).
 * Shown in the footer and emitted as Organization.legalName / the ETAA
 * credential in structured data; the contact page (Sanity) carries the same.
 */
export const LEGAL_NAME = 'Capital Travel Service';
export const LEGAL_ADDRESS = '1 Farouk Mahmoud St, Giza, Cairo';
// Licence / ETAA / IATA numbers are NOT here: they live in Sanity
// siteSettings and are read through src/lib/accreditations.ts.

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
