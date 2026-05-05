import Image from 'next/image';

import { Link } from '@/i18n/navigation';
import { urlFor } from '@/sanity/lib/image';

export interface TravelTipCardData {
  _id: string;
  title: string;
  slug: string;
  summary?: string;
  category?: { name?: string; slug?: string } | null;
  heroImage?: { asset?: unknown; alt?: string } | null;
}

interface Props {
  tip: TravelTipCardData;
  /** "featured" gives more vertical room and renders the deck italic. "compact" is sidebar-shaped. */
  variant?: 'default' | 'featured' | 'compact';
  locale: string;
}

export function TravelTipCard({ tip, variant = 'default' }: Props) {
  if (variant === 'compact') {
    return (
      <Link
        href={`/travel-tips/${tip.slug}`}
        className="group block py-2 transition-colors"
      >
        {tip.category?.name && (
          <p className="mb-1 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-night-soft">
            {tip.category.name}
          </p>
        )}
        <p className="font-serif text-base leading-snug text-night transition-colors group-hover:text-faience">
          {tip.title}
        </p>
      </Link>
    );
  }

  const wide = variant === 'featured';
  const heroUrl = tip.heroImage?.asset
    ? wide
      ? urlFor(tip.heroImage).width(1200).height(900).quality(82).url()
      : urlFor(tip.heroImage).width(800).height(600).quality(80).url()
    : null;

  return (
    <Link
      href={`/travel-tips/${tip.slug}`}
      className="group block transition-transform duration-500 hover:-translate-y-0.5"
    >
      <div
        className={`mb-5 overflow-hidden bg-limestone-deep ${
          wide ? 'aspect-[4/3]' : 'aspect-[4/5]'
        }`}
      >
        {heroUrl ? (
          <Image
            src={heroUrl}
            alt={tip.heroImage?.alt || tip.title}
            width={wide ? 1200 : 800}
            height={wide ? 900 : 1000}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      {tip.category?.name && (
        <p className="mb-2 font-sans text-xs font-medium uppercase tracking-[0.12em] text-night-soft">
          {tip.category.name}
        </p>
      )}
      <h3
        className={
          wide
            ? 'mb-3 font-serif text-3xl font-medium leading-tight text-night transition-colors group-hover:text-faience md:text-4xl'
            : 'mb-2 font-serif text-2xl font-medium leading-tight text-night transition-colors group-hover:text-faience'
        }
      >
        {tip.title}
      </h3>
      {tip.summary && (
        <p
          className={
            wide
              ? 'font-serif text-lg italic leading-relaxed text-night-soft'
              : 'line-clamp-3 text-[0.9375rem] leading-relaxed text-night-soft'
          }
        >
          {tip.summary}
        </p>
      )}
    </Link>
  );
}
