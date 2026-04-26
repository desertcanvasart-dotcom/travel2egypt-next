import Image from 'next/image';

import { Link } from '@/i18n/navigation';
import { urlFor } from '@/sanity/lib/image';

export interface TourCardData {
  _id: string;
  type?: string;
  dayTourMode?: 'private' | 'group';
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
    ? urlFor(tour.heroImage).width(800).height(560).quality(80).url()
    : null;
  const primaryCity = tour.cities?.[0]?.name;
  const duration = tour.durationLabel || (tour.durationDays ? `${tour.durationDays} day${tour.durationDays === 1 ? '' : 's'}` : null);

  return (
    <Link href={`/tours/${tour.slug}`} className="group block">
      <div className="mb-3 aspect-[4/3] overflow-hidden rounded-lg bg-cream-deep">
        {heroUrl ? (
          <Image
            src={heroUrl}
            alt={tour.heroImage?.alt || tour.title}
            width={800}
            height={560}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : null}
      </div>
      <div className="mb-1 flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-orange-deep">
        {duration && <span>{duration}</span>}
        {tour.dayTourMode && (
          <>
            <span className="text-line">·</span>
            <span>{tour.dayTourMode === 'private' ? 'Private' : 'Group'}</span>
          </>
        )}
        {primaryCity && (
          <>
            <span className="text-line">·</span>
            <span className="text-ink-muted">{primaryCity}</span>
          </>
        )}
      </div>
      <h3 className="mb-1 font-serif text-xl text-ink group-hover:text-orange-deep">
        {tour.title}
      </h3>
      {tour.summary && (
        <p className="line-clamp-3 text-sm text-ink-soft">{tour.summary}</p>
      )}
    </Link>
  );
}
