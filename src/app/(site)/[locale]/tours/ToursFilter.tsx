'use client';

import { useSearchParams } from 'next/navigation';

import { useRouter, usePathname } from '@/i18n/navigation';

interface CityOption {
  slug: string;
  name: string;
}

interface Labels {
  filterMode: string;
  filterCity: string;
  filterAll: string;
  filterPrivate: string;
  filterGroup: string;
}

interface Props {
  cityOptions: CityOption[];
  labels: Labels;
}

export function ToursFilter({ cityOptions, labels }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentMode = searchParams.get('mode') ?? 'all';
  const currentCity = searchParams.get('city') ?? 'all';

  function update(key: 'mode' | 'city', value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') params.delete(key);
    else params.set(key, value);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  const modes: Array<{ value: string; label: string }> = [
    { value: 'all', label: labels.filterAll },
    { value: 'private', label: labels.filterPrivate },
    { value: 'group', label: labels.filterGroup },
  ];

  return (
    <div className="flex flex-col gap-6 border-y border-line py-6 md:flex-row md:items-center md:gap-10">
      <div className="flex items-center gap-4">
        <span className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
          {labels.filterMode}
        </span>
        <div className="flex gap-1">
          {modes.map(({ value, label }) => {
            const active = currentMode === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => update('mode', value)}
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
            htmlFor="city-filter"
            className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted"
          >
            {labels.filterCity}
          </label>
          <select
            id="city-filter"
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
