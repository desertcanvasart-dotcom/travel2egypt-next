import { createClient } from 'next-sanity';

import { apiVersion, dataset, projectId } from '@/sanity/env';
import { isOffered, DEPARTURE_CUTOFF_DAYS, type RawDeparture } from '@/components/tour-system/departures';

/**
 * Admin departures (owner, 2026-11-11): staff mark scheduled group
 * departures as booked (status / places left), add dates and remove dates,
 * from /admin/departures instead of Sanity Studio. Server-only.
 *
 * Reads bypass the CDN so a save shows at once; writes need a Sanity write
 * token on the server (SANITY_PRODUCTION_API_WRITE_TOKEN or
 * SANITY_API_WRITE_TOKEN). Without one the page is read-only and says so.
 */

export const DEPARTURE_STATUSES = ['', 'guaranteed', 'few', 'available', 'soldout', 'onrequest'] as const;
export type DepartureStatus = (typeof DEPARTURE_STATUSES)[number];

export const STATUS_LABELS: Record<DepartureStatus, string> = {
  '': '— not marked',
  guaranteed: 'Guaranteed',
  few: 'Few places',
  available: 'Available',
  soldout: 'Sold out',
  onrequest: 'On request',
};

const writeToken = () => process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN || '';

export function canWrite(): boolean {
  return Boolean(writeToken());
}

export function adminSanity() {
  const token = writeToken() || process.env.SANITY_API_READ_TOKEN || undefined;
  return createClient({ projectId, dataset, apiVersion, useCdn: false, perspective: 'published', token });
}

export interface AdminDeparture extends RawDeparture {
  _key: string;
}

export interface AdminGroupTour {
  _id: string;
  _rev: string;
  title: string;
  slugs: Record<string, string>;
  durationDays?: number | null;
  maxGroup?: number | null;
  priceFrom?: number | null;
  basePrice?: number | null;
  peakUpliftPct?: number | null;
  departures: AdminDeparture[];
}

export const ADMIN_GROUP_TOURS_QUERY = `*[_type == "tour" && type == "package" && tourMode == "group" && !(_id in path("drafts.**"))]
  | order(durationDays asc){
    _id, _rev,
    "title": coalesce(title[_key=="en"][0].value, ""),
    "slugs": { "en": slug[_key=="en"][0].value.current, "es": slug[_key=="es"][0].value.current, "ja": slug[_key=="ja"][0].value.current },
    durationDays, maxGroup, priceFrom, basePrice, peakUpliftPct,
    "departures": coalesce(departures[]{ _key, startDate, isPeak, status, placesLeft }, [])
  }`;

export async function getGroupTours(): Promise<AdminGroupTour[]> {
  const rows = await adminSanity().fetch<AdminGroupTour[]>(ADMIN_GROUP_TOURS_QUERY);
  return rows.map((t) => ({
    ...t,
    departures: [...t.departures].sort((a, b) => String(a.startDate).localeCompare(String(b.startDate))),
  }));
}

/** What the public site does with this date today (for the admin table). */
export function siteState(dep: RawDeparture, maxGroup: number | null | undefined, now: Date): {
  label: string;
  tone: 'on' | 'off' | 'past';
} {
  const start = dep.startDate ? new Date(`${dep.startDate.slice(0, 10)}T00:00:00Z`) : null;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const days = start ? Math.round((start.getTime() - today) / 86_400_000) : -1;
  if (days < 1) return { label: 'Started / past', tone: 'past' };
  if (isOffered(dep, { now, maxGroup })) {
    return { label: days <= DEPARTURE_CUTOFF_DAYS ? `Shown (booked) · ${days} d` : `Shown · ${days} d`, tone: 'on' };
  }
  return { label: `Hidden: unbooked, ${days} d to go`, tone: 'off' };
}
