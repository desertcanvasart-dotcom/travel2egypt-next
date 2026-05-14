import Image from 'next/image';

import { Link } from '@/i18n/navigation';
import { urlFor } from '@/sanity/lib/image';

export interface CruiseCardData {
  _id: string;
  name: string;
  slug: string;
  type?: 'cruise-ship' | 'dahabiya' | 'felucca';
  tier?: 'standard' | 'deluxe' | 'luxury' | 'boutique';
  capacity?: number;
  summary?: string;
  heroImage?: { asset?: unknown; alt?: string } | null;
}

interface Props {
  cruise: CruiseCardData;
}

const TYPE_LABEL: Record<NonNullable<CruiseCardData['type']>, string> = {
  'cruise-ship': 'Cruise ship',
  dahabiya: 'Dahabiya',
  felucca: 'Felucca',
};

const TIER_LABEL: Record<NonNullable<CruiseCardData['tier']>, string> = {
  standard: 'Standard',
  deluxe: 'Deluxe',
  luxury: 'Luxury',
  boutique: 'Boutique',
};

export function CruiseCard({ cruise }: Props) {
  const heroUrl = cruise.heroImage?.asset
    ? urlFor(cruise.heroImage).width(800).height(1000).quality(80).url()
    : null;
  const typeLabel = cruise.type ? TYPE_LABEL[cruise.type] : null;
  const tierLabel = cruise.tier ? TIER_LABEL[cruise.tier] : null;
  const capacityLabel = cruise.capacity ? `${cruise.capacity} cabins` : null;

  return (
    <Link
      href={`/cruises/${cruise.slug}`}
      className="group block transition-transform duration-500 hover:-translate-y-0.5"
    >
      <div className="mb-5 aspect-[4/5] overflow-hidden bg-limestone-deep">
        {heroUrl ? (
          <Image
            src={heroUrl}
            alt={cruise.heroImage?.alt || cruise.name}
            width={800}
            height={1000}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      <div className="mb-2 flex flex-wrap items-center gap-3 font-sans text-xs font-medium uppercase tracking-[0.12em] text-night-soft">
        {typeLabel && <span>{typeLabel}</span>}
        {tierLabel && (
          <>
            <span className="h-[3px] w-[3px] rounded-full bg-night-soft" aria-hidden />
            <span>{tierLabel}</span>
          </>
        )}
        {capacityLabel && (
          <>
            <span className="h-[3px] w-[3px] rounded-full bg-night-soft" aria-hidden />
            <span className="font-serif italic normal-case tracking-normal">{capacityLabel}</span>
          </>
        )}
      </div>
      <h3 className="mb-2 font-serif text-2xl font-medium leading-tight text-night transition-colors group-hover:text-faience">
        {cruise.name}
      </h3>
      {cruise.summary && (
        <p className="line-clamp-3 text-[0.9375rem] leading-relaxed text-night-soft">
          {cruise.summary}
        </p>
      )}
    </Link>
  );
}
