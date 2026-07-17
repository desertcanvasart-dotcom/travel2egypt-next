import { Link } from '@/i18n/navigation';

import type { NavigatorConfig } from './types';

/**
 * Optional "choose by destination" section — a bordered city grid linking to
 * per-city sub-pages. Config-driven and reusable: any archive that supplies a
 * navigator config gets it; archives that don't (hotels, the city sub-pages
 * themselves) omit it. Hairline grid via a 1px gap over a rule-colored bg.
 */
export function ArchiveNavigator({ config }: { config: NavigatorConfig }) {
  if (config.items.length === 0) return null;
  return (
    <section className="border-y border-rule py-20 md:py-22">
      <div className="mb-11">
        <h2 className="font-serif text-[clamp(2rem,3.6vw,2.625rem)] font-normal leading-none text-faience">
          {config.heading}
        </h2>
        {config.intro && (
          <p className="mt-3 max-w-[460px] font-serif text-lg italic text-night-soft">
            {config.intro}
          </p>
        )}
      </div>
      <ul className="grid grid-cols-1 gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
        {config.items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="flex h-full items-baseline justify-between gap-4 bg-paper px-7 py-7 transition-colors hover:bg-limestone-warm"
            >
              <span>
                <span className="block font-serif text-2xl font-normal text-night">
                  {item.cityName}
                </span>
                {item.note && (
                  <span className="mt-1 block font-sans text-[0.8125rem] leading-snug text-night-soft">
                    {item.note}
                  </span>
                )}
              </span>
              <span className="shrink-0 whitespace-nowrap font-sans text-xs tracking-[0.06em] text-gold-ink">
                {item.countLabel}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
