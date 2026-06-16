'use client';

import { useState } from 'react';

import { Link } from '@/i18n/navigation';

export interface CategoryRow {
  id: string;
  name: string;
  durKey: string;
  durLabel: string;
  cityName: string;
  citySlug: string;
  href: string;
}

interface CategoryIndexProps {
  rows: CategoryRow[];
  /** Omit (or pass []) on the single-city variant — the city facet is then hidden. */
  cityOptions?: Array<{ value: string; label: string }>;
  lengthOptions: Array<{ value: string; label: string }>;
  /**
   * 'category' (default): city + length facets, row is name · duration · city · arrow.
   * 'single': length facet only, row is name · duration · arrow (no city/theme column).
   * 'package': length facet only, row is name · duration · theme · arrow (third
   *   column shown, but no per-theme facet — theme is the navigator's job).
   *   The theme label is carried in `cityName`. Same component + CSS.
   */
  variant?: 'category' | 'single' | 'package';
  labels: {
    cityLabel?: string;
    lengthLabel: string;
    allCity?: string;
    anyLength: string;
    lengthHint: string;
    empty: string;
  };
}

/**
 * Shared index — reference `.filters` over a `.trow` row list, client-side
 * filtering. Matches journey-1-category.html. The L2 single-city variant
 * reuses the exact same markup/CSS: it just hides the city facet and drops
 * the city column (the row is name · duration · arrow).
 */
export function CategoryIndex({ rows, cityOptions = [], lengthOptions, variant = 'category', labels }: CategoryIndexProps) {
  const [city, setCity] = useState<string | null>(null);
  const [length, setLength] = useState<string | null>(null);
  // City facet only on the full category index; the third column (city/theme)
  // shows on every variant except the bare single-city subcategory index.
  const showCityFacet = variant === 'category';
  const showThirdCol = variant !== 'single';

  const filtered = rows.filter(
    (r) => (!showCityFacet || city == null || r.citySlug === city) && (length == null || r.durKey === length)
  );

  // Length facet is dynamic: only buckets that actually occur in `rows` are
  // offered, and the whole facet is dropped when fewer than two remain — one
  // option is nothing to filter by.
  const presentLengths = new Set(rows.map((r) => r.durKey));
  const visibleLengthOptions = lengthOptions.filter((o) => presentLengths.has(o.value));
  const showLengthFacet = visibleLengthOptions.length >= 2;

  return (
    <>
      {showCityFacet && (
        <div className="filters">
          <span className="filter-label">{labels.cityLabel}</span>
          <button
            type="button"
            className={city == null ? 'filter on' : 'filter'}
            onClick={() => setCity(null)}
          >
            {labels.allCity}
          </button>
          {cityOptions.map((o) => (
            <button
              key={o.value}
              type="button"
              className={city === o.value ? 'filter on' : 'filter'}
              onClick={() => setCity(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
      {showLengthFacet && (
        <div className="filters">
          <span className="filter-label">{labels.lengthLabel}</span>
          <button
            type="button"
            className={length == null ? 'filter on' : 'filter'}
            onClick={() => setLength(null)}
          >
            {labels.anyLength}
          </button>
          {visibleLengthOptions.map((o) => (
            <button
              key={o.value}
              type="button"
              className={length === o.value ? 'filter on' : 'filter'}
              onClick={() => setLength(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
      <p className="range-hint">{labels.lengthHint}</p>
      <div className="rows">
        {filtered.length === 0 ? (
          <p className="range-hint">{labels.empty}</p>
        ) : (
          filtered.map((r) => (
            <Link key={r.id} className="trow" href={r.href}>
              <div className="tr-name">{r.name}</div>
              <div className="tr-dur">{r.durLabel}</div>
              {/* Single-city (subcategory) index has no third column. The category
                  index shows city; the package index shows theme (carried in
                  cityName). Both render name · duration · {city|theme} · arrow. */}
              {showThirdCol && <div className="tr-city">{r.cityName}</div>}
              <div className="tr-arrow">→</div>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
