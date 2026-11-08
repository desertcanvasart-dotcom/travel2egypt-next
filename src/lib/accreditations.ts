import { groq } from 'next-sanity';

import { client } from '@/sanity/lib/client';

/**
 * Licence + accreditation — read ONLY from the Sanity siteSettings document
 * (ministryLicenceNumber, etaaMember, iataNumber). Fix round 2 (2026-11-08):
 *
 *  - Travel2Egypt is operated by Capital Travel Service, which holds ONE
 *    Egyptian Ministry of Tourism licence. ETAA membership comes with that
 *    licence automatically — it is a membership, never a second number.
 *    Never render "ETAA <number>".
 *  - Three approved strings per locale (Short / Full / Legal), below. Every
 *    licence mention on the site uses one of them.
 *  - The IATA item renders exactly as before ("IATA <number>").
 */
export interface Accreditations {
  ministryLicenceNumber?: string | null;
  etaaMember?: boolean | null;
  iataNumber?: string | null;
}

export const accreditationsProjection = 'ministryLicenceNumber, etaaMember, iataNumber';

export const accreditationsQuery = groq`*[_type == "siteSettings"][0]{ ${accreditationsProjection} }`;

export async function getAccreditations(): Promise<Accreditations> {
  return (await client.fetch<Accreditations | null>(accreditationsQuery)) ?? {};
}

const clean = (v?: string | null) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const loc = (l: string) => (l === 'es' || l === 'ja' ? l : 'en');

/** SHORT — hero proof row, badges, cards, trust strips. */
export function licenceShort(a: Accreditations | null | undefined, locale: string): string | null {
  const n = clean(a?.ministryLicenceNumber);
  if (!n) return null;
  return {
    en: `Ministry of Tourism licence ${n}`,
    es: `Licencia del Ministerio de Turismo n.º ${n}`,
    ja: `観光省ライセンス番号 ${n}`,
  }[loc(locale)];
}

/** FULL — footer accreditation line, About, Contact, Terms. */
export function licenceFull(a: Accreditations | null | undefined, locale: string): string | null {
  const n = clean(a?.ministryLicenceNumber);
  if (!n) return null;
  const etaa = a?.etaaMember === true;
  return {
    en: `Licensed by the Egyptian Ministry of Tourism, licence no. ${n}${etaa ? ' · ETAA member' : ''}`,
    es: `Con licencia del Ministerio de Turismo de Egipto, n.º ${n}${etaa ? ' · Miembro de ETAA' : ''}`,
    ja: `エジプト観光省認可（ライセンス番号 ${n}）${etaa ? '· ETAA 会員' : ''}`,
  }[loc(locale)];
}

/** LEGAL — footer copyright line ({year} stays dynamic). */
export function licenceLegal(a: Accreditations | null | undefined, locale: string, year: number): string {
  const n = clean(a?.ministryLicenceNumber);
  const l = loc(locale);
  if (!n) {
    return { en: `© ${year} Travel2Egypt · Operated by Capital Travel Service`, es: `© ${year} Travel2Egypt · Operado por Capital Travel Service`, ja: `© ${year} Travel2Egypt · 運営：Capital Travel Service` }[l];
  }
  return {
    en: `© ${year} Travel2Egypt · Operated by Capital Travel Service, Ministry of Tourism licence ${n}`,
    es: `© ${year} Travel2Egypt · Operado por Capital Travel Service, licencia del Ministerio de Turismo n.º ${n}`,
    ja: `© ${year} Travel2Egypt · 運営：Capital Travel Service（観光省ライセンス番号 ${n}）`,
  }[l];
}

/** The IATA item, unchanged from round 1 ("IATA <number>"), or null. */
export function iataItem(a: Accreditations | null | undefined): string | null {
  const i = clean(a?.iataNumber);
  return i ? `IATA ${i}` : null;
}

/** ETAA's public company page for the licence (link target only — never shown as text). */
export function licenceVerifyUrl(a: Accreditations | null | undefined): string | null {
  const n = clean(a?.ministryLicenceNumber);
  return n ? `https://www.etaa-egypt.org/SitePages/CompanyDetailsEn.aspx?licc=${encodeURIComponent(n)}` : null;
}

/**
 * Sanity rich text (About, Contact, Responsible Travel, Terms) carries
 * {licenceFull} / {licenceShort} / {ministryLicenceNumber} / {iataNumber} in
 * span text and {licenceVerifyUrl} in link hrefs; this fills them from
 * siteSettings at render time so no number lives in content. Returns a deep
 * copy; unknown tokens are left untouched.
 */
export function applyAccreditationTokens<T>(value: T, a: Accreditations | null | undefined, locale: string): T {
  const map: Record<string, string> = {
    '{licenceFull}': licenceFull(a, locale) ?? '',
    '{licenceShort}': licenceShort(a, locale) ?? '',
    '{ministryLicenceNumber}': clean(a?.ministryLicenceNumber) ?? '',
    '{iataNumber}': clean(a?.iataNumber) ?? '',
    '{licenceVerifyUrl}': licenceVerifyUrl(a) ?? '',
    // Round-1 tokens, kept so content published before round 2 still renders
    // during the switch-over; scripts/round2-licence-content-2026-11-08.mjs
    // replaces them in Sanity right after deploy.
    '{etaaNumber}': clean(a?.ministryLicenceNumber) ?? '',
    '{etaaUrl}': licenceVerifyUrl(a) ?? '',
  };
  const sub = (s: string) => Object.entries(map).reduce((acc, [k, v]) => acc.split(k).join(v), s);
  const walk = (o: unknown): unknown => {
    if (typeof o === 'string') return o.includes('{') ? sub(o) : o;
    if (Array.isArray(o)) return o.map(walk);
    if (o && typeof o === 'object') return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, walk(v)]));
    return o;
  };
  return walk(value) as T;
}
