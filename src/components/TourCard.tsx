import Image from 'next/image';

import { Link } from '@/i18n/navigation';
import { urlFor } from '@/sanity/lib/image';

export interface TourCardData {
  _id: string;
  type?: string;
  tourMode?: 'private' | 'group';
  durationDays?: number;
  title: string;
  slug: string;
  summary?: string;
  durationLabel?: string;
  heroImage?: { asset?: unknown; alt?: string } | null;
  cities?: Array<{ _id: string; name: string; slug: string }>;
}

interface Props {
  tour: TourCardData;
}

export function TourCard({ tour }: Props) {
  const heroUrl = tour.heroImage?.asset
    ? urlFor(tour.heroImage).width(800).height(1000).quality(80).url()
    : null;
  const primaryCity = tour.cities?.[0]?.name;
  const duration = tour.durationLabel || (tour.durationDays ? `${tour.durationDays} day${tour.durationDays === 1 ? '' : 's'}` : null);

  return (
    <Link
      href={`/tours/${tour.slug}`}
      className="group block transition-transform duration-500 hover:-translate-y-0.5"
    >
      <div className="mb-5 aspect-[4/5] overflow-hidden bg-limestone-deep">
        {heroUrl ? (
          <Image
            src={heroUrl}
            alt={tour.heroImage?.alt || tour.title}
            width={800}
            height={1000}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      <div className="mb-2 flex flex-wrap items-center gap-3 font-sans text-xs font-medium uppercase tracking-[0.12em] text-night-soft">
        {duration && <span>{duration}</span>}
        {tour.tourMode && (
          <>
            <span className="h-[3px] w-[3px] rounded-full bg-night-soft" aria-hidden />
            <span>{tour.tourMode === 'private' ? 'Private' : 'Group'}</span>
          </>
        )}
        {primaryCity && (
          <>
            <span className="h-[3px] w-[3px] rounded-full bg-night-soft" aria-hidden />
            <span className="font-serif italic normal-case tracking-normal">{primaryCity}</span>
          </>
        )}
      </div>
      <h3 className="mb-2 font-serif text-2xl font-medium leading-tight text-night transition-colors group-hover:text-faience">
        {tour.title}
      </h3>
      {tour.summary && (
        <p className="line-clamp-3 text-[0.9375rem] leading-relaxed text-night-soft">
          {tour.summary}
        </p>
      )}
    </Link>
  );
}
