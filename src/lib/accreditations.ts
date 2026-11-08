import { groq } from 'next-sanity';

import { client } from '@/sanity/lib/client';

/**
 * Licence + accreditation numbers — read ONLY from the Sanity siteSettings
 * document (fields ministryLicenceNumber, etaaNumber, iataNumber). No number
 * is hard-coded anywhere else (homepage fix round 1, 2026-11-08). An empty
 * value means that item is not rendered.
 */
export interface Accreditations {
  ministryLicenceNumber?: string | null;
  etaaNumber?: string | null;
  iataNumber?: string | null;
}

export const accreditationsProjection = 'ministryLicenceNumber, etaaNumber, iataNumber';

export const accreditationsQuery = groq`*[_type == "siteSettings"][0]{ ${accreditationsProjection} }`;

export async function getAccreditations(): Promise<Accreditations> {
  return (await client.fetch<Accreditations | null>(accreditationsQuery)) ?? {};
}

const clean = (v?: string | null) => (typeof v === 'string' && v.trim() ? v.trim() : null);

const LABELS: Record<string, { ministry: (n: string) => string; etaa: (n: string) => string; iata: (n: string) => string }> = {
  en: { ministry: (n) => `Ministry of Tourism licence ${n}`, etaa: (n) => `ETAA member ${n}`, iata: (n) => `IATA ${n}` },
  es: { ministry: (n) => `Licencia del Ministerio de Turismo ${n}`, etaa: (n) => `Miembro de ETAA ${n}`, iata: (n) => `IATA ${n}` },
  ja: { ministry: (n) => `観光省ライセンス${n}`, etaa: (n) => `ETAA会員 ${n}`, iata: (n) => `IATA ${n}` },
};

/** The items that have values, in display order, localized. */
export function accreditationItems(a: Accreditations | null | undefined, locale: string): string[] {
  const l = LABELS[locale] ?? LABELS.en;
  const out: string[] = [];
  const m = clean(a?.ministryLicenceNumber);
  const e = clean(a?.etaaNumber);
  const i = clean(a?.iataNumber);
  if (m) out.push(l.ministry(m));
  if (e) out.push(l.etaa(e));
  if (i) out.push(l.iata(i));
  return out;
}

/** The single strongest credential for a one-item slot (hero proof row). */
export function primaryCredential(a: Accreditations | null | undefined, locale: string): string | null {
  const l = LABELS[locale] ?? LABELS.en;
  const m = clean(a?.ministryLicenceNumber);
  if (m) return l.ministry(m);
  const e = clean(a?.etaaNumber);
  return e ? l.etaa(e) : null;
}

/** ETAA's public company-details page for this number, or null. */
export function etaaUrl(a: Accreditations | null | undefined): string | null {
  const e = clean(a?.etaaNumber);
  return e ? `https://www.etaa-egypt.org/SitePages/CompanyDetailsEn.aspx?licc=${encodeURIComponent(e)}` : null;
}

/**
 * Sanity rich text can carry {etaaNumber} / {ministryLicenceNumber} /
 * {iataNumber} in span text and {etaaUrl} in link hrefs (the Contact page
 * does). This swaps them for the siteSettings values at render time, so the
 * numbers still live in one place. Returns a deep copy; unknown tokens and
 * non-text nodes are left untouched.
 */
export function applyAccreditationTokens<T>(value: T, a: Accreditations | null | undefined): T {
  const map: Record<string, string> = {
    '{etaaNumber}': clean(a?.etaaNumber) ?? '',
    '{ministryLicenceNumber}': clean(a?.ministryLicenceNumber) ?? '',
    '{iataNumber}': clean(a?.iataNumber) ?? '',
    '{etaaUrl}': etaaUrl(a) ?? '',
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
