import { ArchiveCard } from './ArchiveCard';
import type { ArchiveCollection } from './types';

/**
 * A curated, repeatable collection block: kicker + title + italic intro + a
 * derived meta line, then item cards in one of three layout variants. Editors
 * pick the variant per collection so the page rhythm varies.
 *
 * The meta line ("4 properties · Cairo · Giza · Aswan") is derived generically:
 * the item count plus the distinct labels of facets rendered as 'text' (place).
 */
export function ThemedCollection({
  kicker,
  collection,
  itemNoun,
}: {
  kicker: string;
  collection: ArchiveCollection;
  /** Pluralized noun for the meta line, e.g. "properties" / "tours". */
  itemNoun: string;
}) {
  const { title, intro, variant, items } = collection;
  if (items.length === 0) return null;

  const places = Array.from(
    new Set(
      items
        .flatMap((i) => i.facets.filter((f) => f.render === 'text').map((f) => f.label))
        .filter(Boolean)
    )
  );

  const gridClass =
    variant === 'lead'
      ? 'grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr]'
      : variant === 'pair'
        ? 'grid-cols-1 md:grid-cols-2'
        : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';

  const cardSize = (i: number): 'default' | 'lead' | 'wide' => {
    if (variant === 'lead') return i === 0 ? 'lead' : 'default';
    if (variant === 'pair') return 'wide';
    return 'default';
  };

  return (
    <div className="mb-24 md:mb-28">
      <div className="mb-12 grid grid-cols-1 items-end gap-8 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <div>
          <p className="font-sans text-xs font-medium uppercase tracking-[0.2em] text-gold-ink">
            {kicker}
          </p>
          <h3 className="mt-4 font-serif text-[clamp(2rem,3.6vw,3.125rem)] font-normal leading-[1.02] tracking-[-0.01em] text-faience">
            {title}
          </h3>
        </div>
        <div>
          {intro && (
            <p className="max-w-[560px] font-serif text-xl italic leading-snug text-night-soft">
              {intro}
            </p>
          )}
          <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 font-sans text-[0.6875rem] uppercase tracking-[0.14em] text-night-soft">
            <span>
              {items.length} {itemNoun}
            </span>
            {places.length > 0 && <span>{places.join(' · ')}</span>}
          </p>
        </div>
      </div>

      <div className={`grid gap-x-9 gap-y-12 ${gridClass}`}>
        {items.map((item, i) => (
          <ArchiveCard key={item._id} item={item} size={cardSize(i)} />
        ))}
      </div>
    </div>
  );
}
