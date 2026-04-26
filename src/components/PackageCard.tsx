import Image from 'next/image';

import { Link } from '@/i18n/navigation';
import { urlFor } from '@/sanity/lib/image';

export interface PackageCardData {
  _id: string;
  durationDays?: number;
  title: string;
  slug: string;
  summary?: string;
  durationLabel?: string;
  heroImage?: { asset?: unknown; alt?: string } | null;
  cities?: Array<{ _id: string; name: string; slug: string }>;
  theme?: { _id: string; name: string; slug: string } | null;
}

interface Props {
  pkg: PackageCardData;
}

export function PackageCard({ pkg }: Props) {
  const heroUrl = pkg.heroImage?.asset
    ? urlFor(pkg.heroImage).width(900).height(600).quality(80).url()
    : null;
  const duration = pkg.durationLabel || (pkg.durationDays ? `${pkg.durationDays} days` : null);
  const cityList = pkg.cities?.map((c) => c.name).filter(Boolean).join(' · ');

  return (
    <Link href={`/packages/${pkg.slug}`} className="group block">
      <div className="mb-4 aspect-[3/2] overflow-hidden rounded-lg bg-cream-deep">
        {heroUrl ? (
          <Image
            src={heroUrl}
            alt={pkg.heroImage?.alt || pkg.title}
            width={900}
            height={600}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : null}
      </div>
      {duration && (
        <p className="mb-1 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-orange-deep">
          {duration}
        </p>
      )}
      <h3 className="mb-2 font-serif text-2xl font-medium text-ink group-hover:text-orange-deep">
        {pkg.title}
      </h3>
      {cityList && (
        <p className="mb-2 font-sans text-xs uppercase tracking-wider text-ink-muted">
          {cityList}
        </p>
      )}
      {pkg.summary && (
        <p className="font-serif text-base italic leading-relaxed text-ink-soft">
          {pkg.summary}
        </p>
      )}
    </Link>
  );
}
