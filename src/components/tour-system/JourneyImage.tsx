import Image from 'next/image';

import { urlFor } from '@/sanity/lib/image';
import { objectPositionFromHotspot } from '@/lib/hotspot';

/**
 * Image container for the tour-system designs. Renders the reference
 * `.t2e-visual` block (grain overlay applied via CSS ::after). Aspect ratio is
 * set by the consuming class (e.g. `tour-visual`, `tour-img`, `feature`,
 * `choice-visual`). When the Sanity image is missing it renders a tonal
 * placeholder at the SAME box so layout never shifts.
 *
 * Cropping is hotspot/crop-aware. Surfaces with a fixed aspect ratio pass
 * `ratio` (width / height); we then ask the Sanity image-URL builder for an
 * image at exactly that ratio, so the editor's crop rectangle and hotspot
 * decide what survives the crop — not a blind CSS centre-crop. Full-bleed
 * surfaces (the hero) omit `ratio` because the box ratio is viewport-driven;
 * there we steer the CSS cover-crop with `object-position` from the hotspot.
 */

interface SanityHotspot {
  x?: number;
  y?: number;
}

interface JourneyImageSource {
  asset?: unknown;
  alt?: string;
  hotspot?: SanityHotspot | null;
  crop?: unknown;
}

interface JourneyImageProps {
  image?: JourneyImageSource | null;
  alt?: string;
  /** Maps to the consuming element's aspect-ratio class. */
  className?: string;
  /** Responsive `sizes` for the Next optimizer. */
  sizes?: string;
  /** Source width requested from Sanity (≈2× rendered width for retina). */
  widthHint?: number;
  /**
   * Target aspect ratio (width / height) of the box this image fills. When set,
   * Sanity returns a hotspot-cropped image already at this ratio so CSS cover is
   * a no-op. Omit for full-bleed (viewport-ratio) surfaces like the hero.
   */
  ratio?: number;
  priority?: boolean;
}

export function JourneyImage({
  image,
  alt,
  className = '',
  sizes = '100vw',
  widthHint = 1400,
  ratio,
  priority = false,
}: JourneyImageProps) {
  const cls = `t2e-visual ${className}`.trim();
  const hasAsset = Boolean(image?.asset);

  if (!hasAsset) {
    return <div className={`${cls} t2e-visual--placeholder`} aria-hidden />;
  }

  let builder = urlFor(image as never).width(widthHint).quality(82).auto('format');
  // Fixed-ratio surfaces: bake the crop in Sanity (hotspot-aware) so the
  // returned image matches the box and CSS cover never re-crops it.
  if (ratio) {
    builder = builder.height(Math.round(widthHint / ratio)).fit('crop');
  }
  const src = builder.url();

  // Full-bleed surfaces still rely on CSS cover; steer it toward the hotspot.
  // Fixed-ratio surfaces bake the crop server-side, so they skip this.
  const objectPosition = !ratio
    ? objectPositionFromHotspot(image?.hotspot)
    : undefined;

  return (
    <div className={cls}>
      <Image
        src={src}
        alt={alt ?? image?.alt ?? ''}
        fill
        sizes={sizes}
        priority={priority}
        style={{ objectFit: 'cover', objectPosition }}
      />
    </div>
  );
}
