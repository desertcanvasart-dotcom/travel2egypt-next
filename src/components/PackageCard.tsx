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
    ? urlFor(pkg.heroImage).width(900).height(1125).quality(80).url()
    : null;
  const duration = pkg.durationLabel || (pkg.durationDays ? `${pkg.durationDays} days` : null);
  const cityList = pkg.cities?.map((c) => c.name).filter(Boolean).join(' · ');

  return (
    <Link
      href={`/packages/${pkg.slug}`}
      className="group block transition-transform duration-500 hover:-translate-y-0.5"
    >
      <div className="mb-6 aspect-[4/5] overflow-hidden bg-limestone-deep">
        {heroUrl ? (
          <Image
            src={heroUrl}
            alt={pkg.heroImage?.alt || pkg.title}
            width={900}
            height={1125}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      {duration && (
        <p className="mb-2 font-sans text-xs font-medium uppercase tracking-[0.12em] text-night-soft">
          {duration}
        </p>
      )}
      <h3 className="mb-3 font-serif text-3xl font-medium leading-tight text-night transition-colors group-hover:text-faience">
        {pkg.title}
      </h3>
      {cityList && (
        <p className="mb-2 font-serif text-sm italic text-faience">
          {cityList}
        </p>
      )}
      {pkg.summary && (
        <p className="font-serif text-base italic leading-relaxed text-night-soft">
          {pkg.summary}
        </p>
      )}
    </Link>
  );
}
