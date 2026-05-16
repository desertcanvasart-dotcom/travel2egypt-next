import type { DistanceRoute } from '@/data/city-distances.types';

const KM_PER_MILE = 1.609344;

/** Parse `"Xh YYm"` → total minutes. Returns NaN if unparseable. */
export function parseTimeString(s: string): number {
  const m = s.match(/^(\d+)h\s*(\d+)m$/);
  if (!m) return NaN;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Format `minutes` → `"Xh YYm"` (pad minutes to 2 digits). */
export function formatTimeFromMinutes(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

/** Drive time in `Xh YYm` from km + avg speed. */
export function computeDriveTime(distanceKm: number, speedKmh: number): string {
  if (speedKmh <= 0) return '—';
  const minutes = (distanceKm / speedKmh) * 60;
  return formatTimeFromMinutes(minutes);
}

export function kmToMi(km: number): number {
  return km / KM_PER_MILE;
}

export function formatDistance(km: number, unit: 'km' | 'mi'): string {
  const value = unit === 'mi' ? kmToMi(km) : km;
  // Round to nearest integer for clean display; 1100km ≈ 684mi reads as "684"
  return Math.round(value).toLocaleString();
}

/** Unique sorted list of region values seen in `routes`. */
export function getUniqueRegions(routes: DistanceRoute[]): string[] {
  return [...new Set(routes.map((r) => r.notes))].sort();
}

/** Unique sorted list of all cities (union of `from` and `to`). */
export function getUniqueCities(routes: DistanceRoute[]): string[] {
  const set = new Set<string>();
  for (const r of routes) {
    set.add(r.from);
    set.add(r.to);
  }
  return [...set].sort();
}

/**
 * Each source route encodes A → B; surfacing only one direction creates
 * UX gaps ("I'm in Aswan, how far to Cairo?" should resolve as easily as
 * "I'm in Cairo, how far to Aswan?"). This generates the inverse pair
 * with identical distance + region + drive time, doubling the row count.
 *
 * Caller is expected to dedupe per (from, to) if needed; the source data
 * is curated as one direction per pair, so no duplicates expected here.
 */
export function expandToBothDirections(routes: DistanceRoute[]): DistanceRoute[] {
  const out: DistanceRoute[] = [];
  for (const r of routes) {
    out.push(r);
    out.push({
      from: r.to,
      to: r.from,
      distance_km: r.distance_km,
      estimated_drive_time: r.estimated_drive_time,
      notes: r.notes,
    });
  }
  return out;
}

/** Build a deterministic transfer slug suitable for the /plan-your-tour
 *  context= query param. "Cairo" + "Sharm El-Sheikh" → "cairo-sharm-el-sheikh". */
export function transferSlug(from: string, to: string): string {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  return `${norm(from)}-${norm(to)}`;
}
