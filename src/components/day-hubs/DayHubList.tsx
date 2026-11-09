'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { LeadButton } from '@/components/leads/LeadProvider';

/**
 * Day-tour hub list (owner spec, 2026-11-09). One component for /tours,
 * /private-day-tours, /group-day-tours and the Nile Valley city hubs:
 * Mode / City / Length / Budget filters, sort, result count, URL state
 * (?mode=&city=&length=&budget=&sort=), the empty state, and the Red Sea
 * section below the main list. Cards are rendered on the server and passed
 * in by id; this component only orders and filters them.
 */

export interface DayHubItem {
  id: string;
  /** Primary-city filter key ('cairo-giza', 'luxor', … or a Red Sea slug). */
  city: string;
  redSea: boolean;
  mode: 'private' | 'group' | '';
  length: 'half' | 'full' | 'extended';
  /** Stored EUR price (null = price on request). */
  eur: number | null;
  /** Price in the budget labels' currency. */
  budgetValue: number | null;
  /** Hours, for "Duration: shortest first". */
  duration: number;
  /** Position in the Recommended order. */
  rank: number;
}

const LENGTHS = ['half', 'full', 'extended'] as const;
const BUDGETS = ['lt100', '100-200', '200+'] as const;
const SORTS = ['recommended', 'price_asc', 'price_desc', 'duration'] as const;
type Budget = (typeof BUDGETS)[number];
type Sort = (typeof SORTS)[number];

function inBudget(v: number | null, b: Budget, [lo, hi]: [number, number]) {
  if (v == null) return false;
  if (b === 'lt100') return v < lo;
  if (b === '100-200') return v >= lo && v < hi;
  return v >= hi;
}

export function DayHubList({
  items,
  cards,
  budgetEdges,
  showMode = false,
  cityOptions,
  cityAliases = {},
  lengthLabels,
  lengthNote,
  showRedSeaSection = true,
  redSeaCta,
  emptySource = 'day_tour_hub',
  hub,
}: {
  items: DayHubItem[];
  cards: Record<string, ReactNode>;
  budgetEdges: [number, number];
  showMode?: boolean;
  /** Omit on city hubs (the hub fixes the city). */
  cityOptions?: { nile: Array<{ value: string; label: string }>; redSea: Array<{ value: string; label: string }> };
  /** Legacy / localized city values → filter key (e.g. giza → cairo-giza). */
  cityAliases?: Record<string, string>;
  lengthLabels: { label: string; any: string; half: string; full: string; extended: string };
  lengthNote?: string;
  showRedSeaSection?: boolean;
  /** Rendered after the Red Sea intro (unused for now). */
  redSeaCta?: ReactNode;
  emptySource?: 'day_tour_hub';
  hub: string;
}) {
  const t = useTranslations('dayHub');
  const [mode, setMode] = useState<'private' | 'group' | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [length, setLength] = useState<string | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [sort, setSort] = useState<Sort>('recommended');
  // Write to the URL only after the visitor changes something, so reading the
  // incoming query (deep links, reloads) can never be overwritten by defaults.
  const [touched, setTouched] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const cityKeys = useMemo(
    () => new Set([...(cityOptions?.nile ?? []), ...(cityOptions?.redSea ?? [])].map((o) => o.value)),
    [cityOptions],
  );

  // URL → state, once (window.location: the page stays static).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const m = q.get('mode');
    if (showMode && (m === 'private' || m === 'group')) setMode(m);
    const rawCity = q.get('city');
    if (rawCity && cityOptions) {
      const key = cityAliases[rawCity] ?? (rawCity === 'giza' || rawCity === 'cairo' ? 'cairo-giza' : rawCity);
      if (cityKeys.has(key)) setCity(key);
    }
    const l = q.get('length');
    if (l && (LENGTHS as readonly string[]).includes(l)) setLength(l);
    const b = q.get('budget');
    if (b && (BUDGETS as readonly string[]).includes(b)) setBudget(b as Budget);
    const s = q.get('sort');
    if (s && (SORTS as readonly string[]).includes(s)) setSort(s as Sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // state → URL (replaceState: no history entry per click).
  useEffect(() => {
    if (!touched) return;
    const url = new URL(window.location.href);
    const set = (k: string, v: string | null) => (v ? url.searchParams.set(k, v) : url.searchParams.delete(k));
    set('mode', mode);
    set('city', city);
    set('length', length);
    set('budget', budget);
    set('sort', sort === 'recommended' ? null : sort);
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  }, [touched, mode, city, length, budget, sort]);

  const cityIsRedSea = city != null && (cityOptions?.redSea ?? []).some((o) => o.value === city);
  const passes = (it: DayHubItem) =>
    (!mode || it.mode === mode) &&
    (!length || it.length === length) &&
    (!budget || inBudget(it.budgetValue, budget, budgetEdges));
  const order = (a: DayHubItem, b: DayHubItem) => {
    if (sort === 'recommended') return a.rank - b.rank;
    if (sort === 'duration') return a.duration - b.duration || a.rank - b.rank;
    if (a.eur == null && b.eur == null) return a.rank - b.rank;
    if (a.eur == null) return 1;
    if (b.eur == null) return -1;
    return sort === 'price_asc' ? a.eur - b.eur : b.eur - a.eur;
  };

  // Main list: Nile Valley only, unless a Red Sea city is selected.
  const main = items
    .filter((it) => (city ? it.city === city : !it.redSea) && passes(it))
    .sort(order);
  const redSea = showRedSeaSection && !city ? items.filter((it) => it.redSea && passes(it)).sort(order) : [];

  const presentLengths = new Set(items.map((i) => i.length));
  const lengthOpts = LENGTHS.filter((l) => presentLengths.has(l));

  const pill = (on: boolean, label: string, onClick: () => void, key?: string) => (
    <button
      key={key ?? label}
      type="button"
      className={on ? 'filter on' : 'filter'}
      aria-pressed={on}
      onClick={() => {
        setTouched(true);
        onClick();
      }}
    >
      {label}
    </button>
  );

  return (
    <div ref={rootRef} className="day-hub-list">
      <div className="dh-controls">
        {showMode && (
          <div className="filters" role="group" aria-label={t('modeLabel')}>
            <span className="filter-label">{t('modeLabel')}</span>
            {pill(mode == null, t('modeAll'), () => setMode(null), 'm-all')}
            {pill(mode === 'private', t('modePrivate'), () => setMode('private'), 'm-p')}
            {pill(mode === 'group', t('modeGroup'), () => setMode('group'), 'm-g')}
          </div>
        )}
        {cityOptions && (
          <div className="filters" role="group" aria-label={t('cityLabel')}>
            <span className="filter-label">{t('cityLabel')}</span>
            {pill(city == null, t('cityAll'), () => setCity(null), 'c-all')}
            {cityOptions.nile.map((o) => pill(city === o.value, o.label, () => setCity(o.value), o.value))}
            {cityOptions.redSea.length > 0 && (
              <span className="dh-divider" role="separator">
                {t('redSeaDivider')}
              </span>
            )}
            {cityOptions.redSea.map((o) => pill(city === o.value, o.label, () => setCity(o.value), o.value))}
          </div>
        )}
        {lengthOpts.length >= 2 && (
          <div className="filters" role="group" aria-label={lengthLabels.label}>
            <span className="filter-label">{lengthLabels.label}</span>
            {pill(length == null, lengthLabels.any, () => setLength(null), 'l-any')}
            {lengthOpts.map((l) => pill(length === l, lengthLabels[l], () => setLength(l), l))}
          </div>
        )}
        {lengthNote && <p className="range-hint">{lengthNote}</p>}
        <div className="filters" role="group" aria-label={t('budgetLabel')}>
          <span className="filter-label">{t('budgetLabel')}</span>
          {pill(budget == null, t('budgetAny'), () => setBudget(null), 'b-any')}
          {pill(budget === 'lt100', t('budgetLt100'), () => setBudget('lt100'))}
          {pill(budget === '100-200', t('budget100'), () => setBudget('100-200'))}
          {pill(budget === '200+', t('budget200'), () => setBudget('200+'))}
        </div>
        <div className="dh-bar">
          <p className="dh-count" aria-live="polite">
            {t('count', { n: main.length })}
          </p>
          <label className="dh-sort">
            <span className="filter-label">{t('sortLabel')}</span>
            <select
              value={sort}
              onChange={(e) => {
                setTouched(true);
                setSort(e.target.value as Sort);
              }}
            >
              <option value="recommended">{t('sortRecommended')}</option>
              <option value="price_asc">{t('sortPriceAsc')}</option>
              <option value="price_desc">{t('sortPriceDesc')}</option>
              <option value="duration">{t('sortDuration')}</option>
            </select>
          </label>
        </div>
      </div>

      {main.length === 0 ? (
        <p className="dh-empty">
          {t('empty')}{' '}
          <LeadButton source={emptySource} prefill={{ hub }} className="dh-link">
            {t('emptyAction')}
          </LeadButton>
        </p>
      ) : (
        <div className="lvl-home lvl-sales">
          <ul className="dcards dh-grid">{main.map((it) => cards[it.id])}</ul>
        </div>
      )}

      {redSea.length > 0 && (
        <section className="dh-redsea" id="red-sea" aria-labelledby="h-red-sea">
          <div className="t2e-section-head">
            <div>
              <h2 id="h-red-sea">{t('redSeaTitle')}</h2>
            </div>
            <p>{t('redSeaIntro')}</p>
          </div>
          {redSeaCta}
          <div className="lvl-home lvl-sales">
            <ul className="dcards dh-grid">{redSea.map((it) => cards[it.id])}</ul>
          </div>
        </section>
      )}
    </div>
  );
}
