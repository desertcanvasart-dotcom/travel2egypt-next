'use client';

import { useMemo, useState } from 'react';

import distancesData from '@/data/city-distances.json';
import type { DistanceRoute, DistancesData } from '@/data/city-distances.types';
import { Link } from '@/i18n/navigation';
import {
  computeDriveTime,
  expandToBothDirections,
  formatDistance,
  getUniqueCities,
  getUniqueRegions,
  transferSlug,
} from '@/lib/distance-utils';

type Unit = 'km' | 'mi';
type SortField = 'from' | 'to' | 'distance_km' | 'notes';
type SortDir = 'asc' | 'desc';

interface RegionLabels {
  'Nile Valley': string;
  'Eastern Desert': string;
  'Sinai Peninsula': string;
}

interface Labels {
  search: string;
  searchPlaceholder: string;
  unitLabel: string;
  speedLabel: string;
  fromLabel: string;
  toLabel: string;
  regionLabel: string;
  any: string;
  reset: string;
  resultsCount: string;
  emptyState: string;
  colFrom: string;
  colTo: string;
  colDistance: string;
  colDriveTime: string;
  colRegion: string;
  planMyTransfer: string;
  disclaimer: string;
  regions: RegionLabels;
}

const DATA = distancesData as DistancesData;
const ALL_ROUTES = expandToBothDirections(DATA.routes);
const ALL_CITIES = getUniqueCities(DATA.routes);
const ALL_REGIONS = getUniqueRegions(DATA.routes) as Array<keyof RegionLabels>;

const SPEED_MIN = 40;
const SPEED_MAX = 120;
const SPEED_DEFAULT = 100;

const REGION_PILL: Record<string, string> = {
  'Nile Valley': 'bg-faience-pale/30 text-faience-deep border-faience-pale',
  'Eastern Desert': 'bg-orange-pale/30 text-orange-deep border-orange-pale',
  'Sinai Peninsula': 'bg-cream-deep text-ink-soft border-line',
};

export function DistanceMatrix({ labels }: { labels: Labels }) {
  const [search, setSearch] = useState('');
  const [unit, setUnit] = useState<Unit>('km');
  const [speed, setSpeed] = useState(SPEED_DEFAULT);
  const [fromFilter, setFromFilter] = useState('');
  const [toFilter, setToFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('from');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const visible = useMemo(() => {
    const s = search.trim().toLowerCase();
    const filtered = ALL_ROUTES.filter((r) => {
      if (s && !r.from.toLowerCase().includes(s) && !r.to.toLowerCase().includes(s)) return false;
      if (fromFilter && r.from !== fromFilter) return false;
      if (toFilter && r.to !== toFilter) return false;
      if (regionFilter && r.notes !== regionFilter) return false;
      return true;
    });
    const sorted = filtered.slice().sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      const av = a[sortField];
      const bv = b[sortField];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
    return sorted;
  }, [search, fromFilter, toFilter, regionFilter, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setFromFilter('');
    setToFilter('');
    setRegionFilter('');
    setSortField('from');
    setSortDir('asc');
  };

  const arrow = (field: SortField) =>
    sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '';

  return (
    <div className="space-y-8">
      {/* Filter toolbar */}
      <div className="space-y-4 rounded-lg border border-line bg-cream-warm/40 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
              {labels.search}
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={labels.searchPlaceholder}
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-orange-deep focus:outline-none focus:ring-1 focus:ring-orange-pale"
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
              {labels.fromLabel}
            </span>
            <select
              value={fromFilter}
              onChange={(e) => setFromFilter(e.target.value)}
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-orange-deep focus:outline-none focus:ring-1 focus:ring-orange-pale"
            >
              <option value="">{labels.any}</option>
              {ALL_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
              {labels.toLabel}
            </span>
            <select
              value={toFilter}
              onChange={(e) => setToFilter(e.target.value)}
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-orange-deep focus:outline-none focus:ring-1 focus:ring-orange-pale"
            >
              <option value="">{labels.any}</option>
              {ALL_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
              {labels.regionLabel}
            </span>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-orange-deep focus:outline-none focus:ring-1 focus:ring-orange-pale"
            >
              <option value="">{labels.any}</option>
              {ALL_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {labels.regions[r] ?? r}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Secondary controls — unit / speed / reset */}
        <div className="flex flex-col gap-4 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <span className="mr-2 font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
                {labels.unitLabel}
              </span>
              <div className="inline-flex overflow-hidden rounded-full border border-line">
                {(['km', 'mi'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className={
                      'px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors ' +
                      (unit === u
                        ? 'bg-ink text-paper'
                        : 'bg-paper text-ink-soft hover:bg-cream-warm')
                    }
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2">
              <span className="font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
                {labels.speedLabel}
              </span>
              <input
                type="number"
                min={SPEED_MIN}
                max={SPEED_MAX}
                step={5}
                value={speed}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v)) setSpeed(Math.min(SPEED_MAX, Math.max(SPEED_MIN, v)));
                }}
                className="w-20 rounded-md border border-line bg-paper px-2 py-1 text-sm text-ink focus:border-orange-deep focus:outline-none focus:ring-1 focus:ring-orange-pale"
              />
            </label>
          </div>
          <div className="flex items-center gap-4 text-xs text-ink-muted">
            <span>{labels.resultsCount.replace('{count}', String(visible.length))}</span>
            <button
              type="button"
              onClick={resetFilters}
              className="font-semibold text-orange-deep underline-offset-2 hover:underline"
            >
              {labels.reset}
            </button>
          </div>
        </div>
      </div>

      {/* Table — desktop */}
      <div className="hidden md:block">
        {visible.length === 0 ? (
          <p className="py-16 text-center font-serif text-lg italic text-ink-muted">
            {labels.emptyState}
          </p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
                {([
                  ['from', labels.colFrom],
                  ['to', labels.colTo],
                  ['distance_km', labels.colDistance],
                  ['notes', labels.colRegion],
                ] as Array<[SortField, string]>).map(([f, label]) => (
                  <th key={f} className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort(f)}
                      className="flex items-center gap-1 transition-colors hover:text-orange-deep"
                    >
                      {label} <span aria-hidden>{arrow(f)}</span>
                    </button>
                  </th>
                ))}
                <th className="px-3 py-3">{labels.colDriveTime}</th>
                <th className="px-3 py-3" aria-label={labels.planMyTransfer} />
              </tr>
            </thead>
            <tbody>
              {visible.map((r, i) => (
                <tr
                  key={`${r.from}-${r.to}-${i}`}
                  className="border-b border-line-soft transition-colors hover:bg-cream-warm/40"
                >
                  <td className="px-3 py-3 font-serif text-base text-ink">{r.from}</td>
                  <td className="px-3 py-3 font-serif text-base text-ink">{r.to}</td>
                  <td className="px-3 py-3 tabular-nums text-ink-soft">
                    {formatDistance(r.distance_km, unit)} {unit}
                  </td>
                  <td className="px-3 py-3">
                    <RegionPill region={r.notes} label={labels.regions[r.notes as keyof RegionLabels] ?? r.notes} />
                  </td>
                  <td className="px-3 py-3 tabular-nums text-ink-soft">
                    {computeDriveTime(r.distance_km, speed)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <PlanLink route={r} label={labels.planMyTransfer} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Cards — mobile */}
      <div className="md:hidden">
        {visible.length === 0 ? (
          <p className="py-16 text-center font-serif text-lg italic text-ink-muted">
            {labels.emptyState}
          </p>
        ) : (
          <ul className="space-y-3">
            {visible.map((r, i) => (
              <li
                key={`${r.from}-${r.to}-${i}`}
                className="rounded-lg border border-line bg-paper p-4"
              >
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <p className="font-serif text-lg text-ink">
                    {r.from} <span className="text-ink-muted">→</span> {r.to}
                  </p>
                  <RegionPill region={r.notes} label={labels.regions[r.notes as keyof RegionLabels] ?? r.notes} />
                </div>
                <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-soft">
                  <div className="flex gap-1.5">
                    <dt className="font-semibold uppercase text-xs tracking-wider text-ink-muted">
                      {labels.colDistance}:
                    </dt>
                    <dd className="tabular-nums">
                      {formatDistance(r.distance_km, unit)} {unit}
                    </dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="font-semibold uppercase text-xs tracking-wider text-ink-muted">
                      {labels.colDriveTime}:
                    </dt>
                    <dd className="tabular-nums">{computeDriveTime(r.distance_km, speed)}</dd>
                  </div>
                </dl>
                <PlanLink route={r} label={labels.planMyTransfer} className="mt-3 block text-right" />
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="border-t border-line pt-6 text-center text-xs leading-relaxed text-ink-muted">
        {labels.disclaimer}
      </p>
    </div>
  );
}

function RegionPill({ region, label }: { region: string; label: string }) {
  const cls = REGION_PILL[region] ?? 'bg-cream-deep text-ink-soft border-line';
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs ${cls}`}>{label}</span>
  );
}

function PlanLink({
  route,
  label,
  className,
}: {
  route: DistanceRoute;
  label: string;
  className?: string;
}) {
  const slug = transferSlug(route.from, route.to);
  return (
    <Link
      href={`/plan-your-tour?context=transfer:${slug}`}
      className={
        'text-xs font-semibold uppercase tracking-wider text-orange-deep underline-offset-2 hover:underline ' +
        (className ?? '')
      }
    >
      {label} →
    </Link>
  );
}
