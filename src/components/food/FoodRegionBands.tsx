import { Link } from '@/i18n/navigation';
import { ArchiveCard } from '@/components/archive/ArchiveCard';
import type { ArchiveItem } from '@/components/archive/types';

/**
 * The /food hub's region-organised index. Geographic bands render as photo-card
 * grids in journey order (Cairo → the coast → the Nile south → the far oases);
 * the non-geographic `all-egypt` practical bucket renders LAST as a visually
 * quieter closing band (a plain link list, no photography). Empty bands are
 * filtered out by the caller, so nothing renders a "coming soon" placeholder.
 */
export interface FoodBand {
  key: string;
  /** Optional small eyebrow above the band title. Geographic bands omit it — the
   *  journey is carried by the hub title and band order, not a repeated motif. */
  eyebrow?: string;
  /** Localized region label. */
  label: string;
  items: ArchiveItem[];
  /** The quieter closing treatment (Egypt-wide practicals). */
  quiet?: boolean;
}

export function FoodRegionBands({ bands }: { bands: FoodBand[] }) {
  const geographic = bands.filter((b) => !b.quiet);
  const quiet = bands.filter((b) => b.quiet);

  return (
    <div className="pt-20 md:pt-24">
      {geographic.map((band) => (
        <section key={band.key} className="mb-24 md:mb-28">
          <div className="mb-12">
            {band.eyebrow && (
              <p className="font-sans text-xs font-medium uppercase tracking-[0.2em] text-gold-ink">
                {band.eyebrow}
              </p>
            )}
            <h2 className="mt-4 font-serif text-[clamp(2rem,3.6vw,3.125rem)] font-normal leading-[1.02] tracking-[-0.01em] text-faience">
              {band.label}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-x-9 gap-y-12 sm:grid-cols-2 md:grid-cols-3">
            {band.items.map((item) => (
              <ArchiveCard key={item._id} item={item} size="default" />
            ))}
          </div>
        </section>
      ))}

      {quiet.map((band) => (
        <section key={band.key} className="mt-4 border-t border-rule pt-14 md:pt-16">
          <p className="font-sans text-xs font-medium uppercase tracking-[0.2em] text-night-soft">
            {band.eyebrow}
          </p>
          <h2 className="mt-3 font-serif text-2xl font-normal leading-tight text-night md:text-3xl">
            {band.label}
          </h2>
          <ul className="mt-8 grid grid-cols-1 gap-x-12 gap-y-5 sm:grid-cols-2">
            {band.items.map((item) => {
              const format = item.facets.find((f) => f.key === 'format')?.label;
              return (
                <li key={item._id} className="border-b border-rule pb-4">
                  <Link href={item.href} className="group block">
                    <h3 className="font-serif text-xl font-normal leading-snug text-night transition-colors group-hover:text-gold-ink">
                      {item.title}
                    </h3>
                    {format && (
                      <p className="mt-1 font-sans text-[0.6875rem] uppercase tracking-[0.14em] text-night-soft">
                        {format}
                      </p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
