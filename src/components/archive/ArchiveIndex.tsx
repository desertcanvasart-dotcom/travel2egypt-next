'use client';

import { useSearchParams } from 'next/navigation';

import { useRouter, usePathname } from '@/i18n/navigation';

import type { ArchiveItem, FacetFilterGroup } from './types';
import { bucketKeyForValue } from './types';
import { FacetBadgeLine } from './ArchiveCard';

interface Labels {
  kicker: string;
  title: string;
  intro: string;
  all: string;
  empty: string;
}

interface ViewProps {
  items: ArchiveItem[];
  filters: FacetFilterGroup[];
  labels: Labels;
  /** Current selection per paramKey (defaults to 'all'). */
  selected: Record<string, string>;
  /** Filter handler. Omitted in the static fallback → buttons are inert. */
  onSelect?: (paramKey: string, value: string) => void;
}

function matches(item: ArchiveItem, filters: FacetFilterGroup[], selected: Record<string, string>) {
  return filters.every((group) => {
    const sel = selected[group.paramKey];
    if (!sel || sel === 'all') return true;
    // Range facet: bucket the item's numeric value (falling back to its
    // pre-bucketed key). Exact facets are unchanged.
    if (group.kind === 'range' && group.buckets) {
      const facet = item.facets.find((f) => f.key === group.key);
      if (!facet) return false;
      const bucketKey =
        typeof facet.numericValue === 'number'
          ? bucketKeyForValue(group.buckets, facet.numericValue)
          : facet.value;
      return bucketKey === sel;
    }
    return item.facets.some((f) => f.key === group.key && f.value === sel);
  });
}

/**
 * Presentational index — header + faceted filter pills + dense rows. Pure
 * function of `selected`; no hooks, so it doubles as the Suspense fallback
 * (rendered server-side with everything unfiltered, keeping the rows in the
 * static HTML). The client `ArchiveIndex` supplies `selected` + `onSelect`.
 */
export function ArchiveIndexView({ items, filters, labels, selected, onSelect }: ViewProps) {
  const filtered = items.filter((item) => matches(item, filters, selected));

  return (
    <section className="border-t border-rule py-20 md:py-24">
      <div className="mb-10 border-b border-rule pb-7">
        <p className="mb-3 font-sans text-xs font-medium uppercase tracking-[0.2em] text-sand-warm">
          {labels.kicker}
        </p>
        <h2 className="font-serif text-[clamp(2.25rem,4vw,2.75rem)] font-normal leading-none text-faience">
          {labels.title}
        </h2>
        <p className="mt-3 max-w-[420px] font-serif text-lg italic text-night-soft">
          {labels.intro}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col gap-5">
        {filters.map((group) => {
          const current = selected[group.paramKey] ?? 'all';
          return (
            <div key={group.key} className="flex flex-col gap-2">
              <div role="group" aria-label={group.label} className="flex flex-wrap items-center gap-2">
                <span className="mr-2 font-sans text-xs uppercase tracking-[0.14em] text-night-soft">
                  {group.label}
                </span>
                <FilterButton
                  label={group.allLabel ?? labels.all}
                  active={current === 'all'}
                  onClick={onSelect ? () => onSelect(group.paramKey, 'all') : undefined}
                />
                {group.options.map((opt) => (
                  <FilterButton
                    key={opt.value}
                    label={opt.label}
                    active={current === opt.value}
                    onClick={onSelect ? () => onSelect(group.paramKey, opt.value) : undefined}
                  />
                ))}
              </div>
              {group.hint && (
                <p className="font-serif text-sm italic text-night-soft">{group.hint}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Rows */}
      {filtered.length === 0 ? (
        <p className="border-t border-rule py-10 font-serif text-lg italic text-night-soft">
          {labels.empty}
        </p>
      ) : (
        <div className="border-t border-rule">
          {filtered.map((item) => (
            <a
              key={item._id}
              href={item.href}
              className="group flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-rule py-5 transition-[padding,background] duration-200 hover:bg-limestone-warm hover:px-3.5"
            >
              <span className="min-w-[55%] flex-1 font-serif text-xl font-normal leading-tight text-night sm:min-w-0">
                {item.title}
              </span>
              <FacetBadgeLine facets={item.facets} className="shrink-0" />
              <span
                aria-hidden
                className="ml-auto font-serif text-xl text-night-soft transition-transform duration-200 group-hover:translate-x-1.5 group-hover:text-night"
              >
                →
              </span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Client index — reads/writes the URL query params and feeds selection into
 * ArchiveIndexView. Must be rendered inside a <Suspense> boundary (useSearchParams
 * triggers a CSR bailout during static prerender); ArchiveTemplate provides it.
 */
export function ArchiveIndex({
  items,
  filters,
  labels,
}: {
  items: ArchiveItem[];
  filters: FacetFilterGroup[];
  labels: Labels;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selected: Record<string, string> = {};
  for (const group of filters) {
    selected[group.paramKey] = searchParams.get(group.paramKey) ?? 'all';
  }

  function update(paramKey: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') params.delete(paramKey);
    else params.set(paramKey, value);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <ArchiveIndexView items={items} filters={filters} labels={labels} selected={selected} onSelect={update} />
  );
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? 'rounded-full border border-night bg-night px-4 py-1.5 font-sans text-[0.8125rem] text-paper'
          : 'rounded-full border border-rule px-4 py-1.5 font-sans text-[0.8125rem] text-night-soft transition-colors hover:border-night hover:text-night'
      }
    >
      {label}
    </button>
  );
}
