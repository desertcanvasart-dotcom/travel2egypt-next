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
  /** Theme name — shown in the third column on the single-city variant. */
  theme?: string;
  href: string;
}

interface CategoryIndexProps {
  rows: CategoryRow[];
  /** Omit (or pass []) on the single-city variant — the city facet is then hidden. */
  cityOptions?: Array<{ value: string; label: string }>;
  lengthOptions: Array<{ value: string; label: string }>;
  /**
   * 'category' (default): city + length facets, third column = city.
   * 'single': length facet only, third column = theme. Same component + CSS.
   */
  variant?: 'category' | 'single';
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
 * reuses the exact same markup/CSS: it just hides the city facet and shows
 * the tour theme in the third column instead of the city.
 */
export function CategoryIndex({ rows, cityOptions = [], lengthOptions, variant = 'category', labels }: CategoryIndexProps) {
  const [city, setCity] = useState<string | null>(null);
  const [length, setLength] = useState<string | null>(null);
  const single = variant === 'single';

  const filtered = rows.filter(
    (r) => (single || city == null || r.citySlug === city) && (length == null || r.durKey === length)
  );

  return (
    <>
      {!single && (
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
      <div className="filters">
        <span className="filter-label">{labels.lengthLabel}</span>
        <button
          type="button"
          className={length == null ? 'filter on' : 'filter'}
          onClick={() => setLength(null)}
        >
          {labels.anyLength}
        </button>
        {lengthOptions.map((o) => (
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
      <p className="range-hint">{labels.lengthHint}</p>
      <div className="rows">
        {filtered.length === 0 ? (
          <p className="range-hint">{labels.empty}</p>
        ) : (
          filtered.map((r) => (
            <Link key={r.id} className="trow" href={r.href}>
              <div className="tr-name">{r.name}</div>
              <div className="tr-dur">{r.durLabel}</div>
              <div className="tr-city">{single ? (r.theme ?? '') : r.cityName}</div>
              <div className="tr-arrow">→</div>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
