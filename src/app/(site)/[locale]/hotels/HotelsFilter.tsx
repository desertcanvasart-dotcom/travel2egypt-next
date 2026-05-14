'use client';

import { useSearchParams } from 'next/navigation';

import { useRouter, usePathname } from '@/i18n/navigation';

interface CityOption {
  slug: string;
  name: string;
}

interface CategoryOption {
  value: string;
  label: string;
}

interface Labels {
  filterCity: string;
  filterCategory: string;
  filterAll: string;
}

interface Props {
  cityOptions: CityOption[];
  categoryOptions: CategoryOption[];
  labels: Labels;
}

export function HotelsFilter({ cityOptions, categoryOptions, labels }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentCity = searchParams.get('city') ?? 'all';
  const currentCategory = searchParams.get('category') ?? 'all';

  function update(key: 'city' | 'category', value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') params.delete(key);
    else params.set(key, value);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex flex-col gap-6 border-y border-line py-6 md:flex-row md:items-center md:gap-10">
      <div className="flex items-center gap-4">
        <span className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
          {labels.filterCategory}
        </span>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => update('category', 'all')}
            className={
              currentCategory === 'all'
                ? 'rounded-full bg-ink px-4 py-1.5 text-xs font-medium text-paper'
                : 'rounded-full border border-line px-4 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-ink'
            }
          >
            {labels.filterAll}
          </button>
          {categoryOptions.map(({ value, label }) => {
            const active = currentCategory === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => update('category', value)}
                className={
                  active
                    ? 'rounded-full bg-ink px-4 py-1.5 text-xs font-medium text-paper'
                    : 'rounded-full border border-line px-4 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-ink'
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {cityOptions.length > 0 && (
        <div className="flex items-center gap-4">
          <label
            htmlFor="hotel-city-filter"
            className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted"
          >
            {labels.filterCity}
          </label>
          <select
            id="hotel-city-filter"
            value={currentCity}
            onChange={(e) => update('city', e.target.value)}
            className="cursor-pointer appearance-none rounded-full border border-line bg-transparent py-1.5 pl-4 pr-8 text-xs font-medium text-ink-soft transition-colors hover:text-ink"
          >
            <option value="all">{labels.filterAll}</option>
            {cityOptions.map((city) => (
              <option key={city.slug} value={city.slug}>
                {city.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
