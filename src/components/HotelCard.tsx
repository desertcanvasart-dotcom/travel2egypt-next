import Image from 'next/image';

import { Link } from '@/i18n/navigation';
import { urlFor } from '@/sanity/lib/image';

export interface HotelCardData {
  _id: string;
  name: string;
  slug: string;
  category?: 'standard' | 'deluxe' | 'luxury' | 'boutique';
  starRating?: number;
  summary?: string;
  heroImage?: { asset?: unknown; alt?: string } | null;
  city?: { _id: string; name: string; slug: string } | null;
}

interface Props {
  hotel: HotelCardData;
}

const CATEGORY_LABEL: Record<NonNullable<HotelCardData['category']>, string> = {
  standard: 'Standard',
  deluxe: 'Deluxe',
  luxury: 'Luxury',
  boutique: 'Boutique',
};

export function HotelCard({ hotel }: Props) {
  const heroUrl = hotel.heroImage?.asset
    ? urlFor(hotel.heroImage).width(800).height(1000).quality(80).url()
    : null;
  const stars = hotel.starRating && hotel.starRating >= 1 && hotel.starRating <= 5
    ? '★'.repeat(Math.round(hotel.starRating))
    : null;
  const categoryLabel = hotel.category ? CATEGORY_LABEL[hotel.category] : null;

  return (
    <Link
      href={`/hotels/${hotel.slug}`}
      className="group block transition-transform duration-500 hover:-translate-y-0.5"
    >
      <div className="mb-5 aspect-[4/5] overflow-hidden bg-limestone-deep">
        {heroUrl ? (
          <Image
            src={heroUrl}
            alt={hotel.heroImage?.alt || hotel.name}
            width={800}
            height={1000}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      <div className="mb-2 flex flex-wrap items-center gap-3 font-sans text-xs font-medium uppercase tracking-[0.12em] text-night-soft">
        {categoryLabel && <span>{categoryLabel}</span>}
        {stars && (
          <>
            <span className="h-[3px] w-[3px] rounded-full bg-night-soft" aria-hidden />
            <span className="tracking-normal text-orange-deep" aria-label={`${hotel.starRating} stars`}>{stars}</span>
          </>
        )}
        {hotel.city?.name && (
          <>
            <span className="h-[3px] w-[3px] rounded-full bg-night-soft" aria-hidden />
            <span className="font-serif italic normal-case tracking-normal">{hotel.city.name}</span>
          </>
        )}
      </div>
      <h3 className="mb-2 font-serif text-2xl font-medium leading-tight text-night transition-colors group-hover:text-faience">
        {hotel.name}
      </h3>
      {hotel.summary && (
        <p className="line-clamp-3 text-[0.9375rem] leading-relaxed text-night-soft">
          {hotel.summary}
        </p>
      )}
    </Link>
  );
}
