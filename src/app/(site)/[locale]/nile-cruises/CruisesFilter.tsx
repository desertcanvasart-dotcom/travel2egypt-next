'use client';

import { useSearchParams } from 'next/navigation';

import { useRouter, usePathname } from '@/i18n/navigation';

interface Option {
  value: string;
  label: string;
}

interface Labels {
  filterType: string;
  filterTier: string;
  filterAll: string;
}

interface Props {
  typeOptions: Option[];
  tierOptions: Option[];
  labels: Labels;
}

export function CruisesFilter({ typeOptions, tierOptions, labels }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentType = searchParams.get('type') ?? 'all';
  const currentTier = searchParams.get('tier') ?? 'all';

  function update(key: 'type' | 'tier', value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') params.delete(key);
    else params.set(key, value);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  function renderGroup(
    key: 'type' | 'tier',
    label: string,
    current: string,
    options: Option[]
  ) {
    return (
      <div className="flex items-center gap-4">
        <span className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
          {label}
        </span>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => update(key, 'all')}
            className={
              current === 'all'
                ? 'rounded-full bg-ink px-4 py-1.5 text-xs font-medium text-paper'
                : 'rounded-full border border-line px-4 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-ink'
            }
          >
            {labels.filterAll}
          </button>
          {options.map(({ value, label: optionLabel }) => {
            const active = current === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => update(key, value)}
                className={
                  active
                    ? 'rounded-full bg-ink px-4 py-1.5 text-xs font-medium text-paper'
                    : 'rounded-full border border-line px-4 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-ink'
                }
              >
                {optionLabel}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 border-y border-line py-6 md:flex-row md:items-center md:gap-10">
      {renderGroup('type', labels.filterType, currentType, typeOptions)}
      {tierOptions.length > 0 &&
        renderGroup('tier', labels.filterTier, currentTier, tierOptions)}
    </div>
  );
}
