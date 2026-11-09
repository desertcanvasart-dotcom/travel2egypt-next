'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { Price } from '@/components/Price';
import { LeadButton } from '@/components/leads/LeadProvider';
import { track } from '@/lib/analytics';
import { Link } from '@/i18n/navigation';

/**
 * Packages hub index (2026-11-09): every private multi-day journey with its
 * "from" price, a Length and a Budget filter, and a sort. Filters and sort
 * live in the URL (?length=6-9&budget=1500-2500&sort=price_asc) so a filtered
 * view can be linked; ?length= from the homepage quick finder keeps working.
 */

export interface HubRow {
  id: string;
  slug: string;
  name: string;
  href: string;
  days: number | null;
  durLabel: string;
  theme: string;
  /** Stored EUR "from" price (null = price on request). */
  eur: number | null;
  /** The same price in the budget labels' currency (USD en, EUR es, JPY ja). */
  budgetValue: number | null;
}

const LENGTHS = [
  { key: '3-5', test: (d: number) => d <= 5 },
  { key: '6-9', test: (d: number) => d >= 6 && d <= 9 },
  { key: '10-14', test: (d: number) => d >= 10 && d <= 14 },
  { key: '15+', test: (d: number) => d >= 15 },
] as const;
const LENGTH_ALIASES: Record<string, string> = { '15 ': '15+', '15': '15+', le5: '3-5', '6to9': '6-9', '10to14': '10-14', '15plus': '15+' };

export const BUDGETS = ['lt1500', '1500-2500', '2500-4000', '4000+'] as const;
type Budget = (typeof BUDGETS)[number];
const SORTS = ['length', 'price_asc', 'price_desc'] as const;
type Sort = (typeof SORTS)[number];

function inBudget(v: number | null, b: Budget, edges: [number, number, number]): boolean {
  if (v == null) return false;
  const [a, m, z] = edges;
  if (b === 'lt1500') return v < a;
  if (b === '1500-2500') return v >= a && v < m;
  if (b === '2500-4000') return v >= m && v < z;
  return v >= z;
}

export function PackagesIndex({
  rows,
  budgetEdges,
  labels,
}: {
  rows: HubRow[];
  /** Bucket edges in the labels' currency, e.g. [1500, 2500, 4000] or [250000, 400000, 600000]. */
  budgetEdges: [number, number, number];
  labels: {
    lengthLabel: string;
    anyLength: string;
    lengths: Record<string, string>;
    budgetLabel: string;
    budgetAny: string;
    budgets: Record<Budget, string>;
    sortLabel: string;
    sorts: Record<Sort, string>;
    rowFrom: string;
    priceOnRequest: string;
    empty: string;
    emptyAction: string;
  };
}) {
  const [length, setLength] = useState<string | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [sort, setSort] = useState<Sort>('length');
  const rootRef = useRef<HTMLDivElement | null>(null);
  const ready = useRef(false);

  const presentLengths = useMemo(
    () => new Set<string>(rows.flatMap((r) => (r.days ? LENGTHS.filter((l) => l.test(r.days!)).map((l) => l.key) : []))),
    [rows],
  );

  // Read state from the URL once (window.location, so the static page needs no
  // Suspense boundary). A deep link with any filter scrolls the index into view.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const rawLen = q.get('length');
    const len = rawLen ? (LENGTH_ALIASES[rawLen] ?? rawLen) : null;
    const b = q.get('budget');
    const s = q.get('sort');
    if (len && presentLengths.has(len)) setLength(len);
    if (b && (BUDGETS as readonly string[]).includes(b)) setBudget(b as Budget);
    if (s && (SORTS as readonly string[]).includes(s)) setSort(s as Sort);
    if (rawLen || b || s) rootRef.current?.scrollIntoView({ block: 'start' });
    ready.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Write state back to the URL (replaceState: no history entry per click).
  useEffect(() => {
    if (!ready.current) return;
    const url = new URL(window.location.href);
    const set = (k: string, v: string | null) => (v ? url.searchParams.set(k, v) : url.searchParams.delete(k));
    set('length', length);
    set('budget', budget);
    set('sort', sort === 'length' ? null : sort);
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  }, [length, budget, sort]);

  const lenTest = LENGTHS.find((l) => l.key === length)?.test;
  const filtered = rows.filter(
    (r) => (!lenTest || (r.days != null && lenTest(r.days))) && (!budget || inBudget(r.budgetValue, budget, budgetEdges)),
  );
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'length') return (a.days ?? 999) - (b.days ?? 999);
    // Unpriced journeys always last.
    if (a.eur == null && b.eur == null) return (a.days ?? 999) - (b.days ?? 999);
    if (a.eur == null) return 1;
    if (b.eur == null) return -1;
    return sort === 'price_asc' ? a.eur - b.eur : b.eur - a.eur;
  });

  const [fromBefore, fromAfter] = labels.rowFrom.split('{price}');
  const lengthOptions = LENGTHS.filter((l) => presentLengths.has(l.key));

  return (
    <div ref={rootRef} className="category-index hub-index" style={{ scrollMarginTop: 96 }}>
      <div className="hub-controls">
        {lengthOptions.length >= 2 && (
          <div className="filters" role="group" aria-label={labels.lengthLabel}>
            <span className="filter-label">{labels.lengthLabel}</span>
            <button type="button" className={length == null ? 'filter on' : 'filter'} aria-pressed={length == null} onClick={() => setLength(null)}>
              {labels.anyLength}
            </button>
            {lengthOptions.map((o) => (
              <button
                key={o.key}
                type="button"
                className={length === o.key ? 'filter on' : 'filter'}
                aria-pressed={length === o.key}
                onClick={() => setLength(o.key)}
              >
                {labels.lengths[o.key]}
              </button>
            ))}
          </div>
        )}
        <div className="filters" role="group" aria-label={labels.budgetLabel}>
          <span className="filter-label">{labels.budgetLabel}</span>
          <button type="button" className={budget == null ? 'filter on' : 'filter'} aria-pressed={budget == null} onClick={() => setBudget(null)}>
            {labels.budgetAny}
          </button>
          {BUDGETS.map((b) => (
            <button key={b} type="button" className={budget === b ? 'filter on' : 'filter'} aria-pressed={budget === b} onClick={() => setBudget(b)}>
              {labels.budgets[b]}
            </button>
          ))}
        </div>
        <label className="hub-sort">
          <span className="filter-label">{labels.sortLabel}</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {labels.sorts[s]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="rows">
        {sorted.length === 0 ? (
          <p className="hub-empty">
            {labels.empty}{' '}
            <LeadButton source="packages_hub" className="hub-link">
              {labels.emptyAction}
            </LeadButton>
          </p>
        ) : (
          sorted.map((r) => (
            <Link
              key={r.id}
              className="trow hub-row"
              href={r.href}
              onClick={() => track('select_item', { item_list_name: 'packages_index', item_id: r.slug })}
            >
              <div className="tr-name">{r.name}</div>
              <div className="tr-dur">{r.durLabel}</div>
              <div className="tr-city">{r.theme}</div>
              <div className="tr-price">
                {r.eur ? (
                  <>
                    {fromBefore}
                    <Price eur={r.eur} />
                    {fromAfter}
                  </>
                ) : (
                  <span className="tr-por">{labels.priceOnRequest}</span>
                )}
              </div>
              <div className="tr-arrow">→</div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
