import Image from 'next/image';

import { Link } from '@/i18n/navigation';
import { urlFor } from '@/sanity/lib/image';

import type { ArchiveItem, ItemFacet } from './types';

/**
 * Generic facet badge line (grade · stars · place). Renders each facet by its
 * `render` hint — no facet keys are hardcoded, so it works for any archive.
 */
export function FacetBadgeLine({
  facets,
  className = '',
}: {
  facets: ItemFacet[];
  className?: string;
}) {
  if (facets.length === 0) return null;
  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-xs uppercase tracking-[0.1em] text-night-soft ${className}`}
    >
      {facets.map((f) => {
        if (f.render === 'stars') {
          return (
            <span key={f.key} className="tracking-[0.1em] text-sand">
              {f.label}
            </span>
          );
        }
        if (f.render === 'text') {
          return (
            <span key={f.key} className="font-serif text-sm normal-case italic tracking-normal text-night-soft">
              <span aria-hidden className="mr-2 text-sand">·</span>
              {f.label}
            </span>
          );
        }
        return <span key={f.key}>{f.label}</span>;
      })}
    </div>
  );
}

interface Props {
  item: ArchiveItem;
  /** Card scale within a collection grid. */
  size?: 'default' | 'lead' | 'wide';
}

const ASPECT: Record<NonNullable<Props['size']>, string> = {
  default: 'aspect-[4/5]',
  lead: 'aspect-[3/4]',
  wide: 'aspect-[5/4]',
};

export function ArchiveCard({ item, size = 'default' }: Props) {
  const imageUrl = item.image?.asset
    ? urlFor(item.image).width(900).height(1125).quality(80).url()
    : null;

  return (
    <Link
      href={item.href}
      className="group block transition-opacity duration-300 hover:opacity-85"
    >
      <div className={`relative mb-5 overflow-hidden bg-limestone-deep ${ASPECT[size]}`}>
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={item.image?.alt || item.title}
            fill
            sizes={size === 'lead' ? '(max-width: 1024px) 100vw, 640px' : '(max-width: 1024px) 100vw, 380px'}
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        )}
      </div>
      <FacetBadgeLine facets={item.facets} className="mb-2.5" />
      <h4
        className={`mb-2 font-serif font-normal leading-tight text-night ${
          size === 'lead' ? 'text-3xl' : 'text-2xl'
        }`}
      >
        {item.title}
      </h4>
      {item.summary && (
        <p className="font-serif text-base italic leading-snug text-night-soft line-clamp-3">
          {item.summary}
        </p>
      )}
    </Link>
  );
}
