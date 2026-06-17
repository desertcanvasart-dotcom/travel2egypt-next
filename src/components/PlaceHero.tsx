import Image from 'next/image';

import { Link } from '@/i18n/navigation';
import { urlFor } from '@/sanity/lib/image';
import { objectPositionFromHotspot } from '@/lib/hotspot';

/**
 * Place hero — a full-bleed image with a bottom-aligned title overlay and a
 * legible top-to-bottom scrim. Reused by subcategory landings (and available
 * for guide/city pages). Falls back to a type-led header band when there's no
 * image, so the kicker + title still read.
 */
export function PlaceHero({
  image,
  alt,
  kicker,
  kickerHref,
  title,
}: {
  image?: {
    asset?: unknown;
    alt?: string;
    hotspot?: { x?: number; y?: number } | null;
  } | null;
  alt?: string;
  kicker?: string;
  kickerHref?: string;
  title: string;
}) {
  // Width-only request + hotspot-steered object-position, so the full-bleed
  // cover-crop favours the editor's focal point (matches JourneyImage).
  const url = image?.asset
    ? urlFor(image).width(2400).quality(85).auto('format').url()
    : null;
  const objectPosition = objectPositionFromHotspot(image?.hotspot);

  const kickerNode = kicker ? (
    kickerHref ? (
      <Link href={kickerHref} className="transition-colors hover:text-paper">
        {kicker}
      </Link>
    ) : (
      kicker
    )
  ) : null;

  if (!url) {
    return (
      <header className="border-b border-rule">
        <div className="mx-auto max-w-7xl px-6 pb-10 pt-20">
          {kickerNode && (
            <p className="mb-4 font-sans text-xs font-medium uppercase tracking-[0.2em] text-sand-warm">
              {kickerNode}
            </p>
          )}
          <h1 className="max-w-[18ch] font-serif text-[clamp(2.5rem,5.4vw,4.75rem)] font-normal leading-[1.0] tracking-[-0.01em] text-faience">
            {title}
          </h1>
        </div>
      </header>
    );
  }

  return (
    <header className="relative flex min-h-[clamp(380px,52vh,560px)] items-end overflow-hidden bg-night">
      <Image
        src={url}
        alt={image?.alt || alt || title}
        fill
        priority
        sizes="100vw"
        className="object-cover"
        style={{ objectPosition }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-night/75 via-night/30 to-night/5"
      />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-12 pt-24 md:pb-14">
        {kickerNode && (
          <p className="mb-4 font-sans text-xs font-medium uppercase tracking-[0.2em] text-[#E9D9B4]">
            {kickerNode}
          </p>
        )}
        <h1 className="max-w-[18ch] font-serif text-[clamp(2.5rem,5.4vw,4.75rem)] font-normal leading-[1.0] tracking-[-0.01em] text-paper">
          {title}
        </h1>
      </div>
    </header>
  );
}
