import Image from 'next/image';

import { urlFor } from '@/sanity/lib/image';

/**
 * Image container for the tour-system designs. Renders the reference
 * `.t2e-visual` block (grain overlay applied via CSS ::after). Aspect ratio is
 * set by the consuming class (e.g. `tour-visual`, `tour-img`, `feature`,
 * `choice-visual`). When the Sanity image is missing it renders a tonal
 * placeholder at the SAME box so layout never shifts.
 */

interface JourneyImageProps {
  image?: { asset?: unknown; alt?: string } | null;
  alt?: string;
  /** Maps to the consuming element's aspect-ratio class. */
  className?: string;
  /** Responsive `sizes` for the Next optimizer. */
  sizes?: string;
  /** Source width requested from Sanity (≈2× rendered width for retina). */
  widthHint?: number;
  priority?: boolean;
}

export function JourneyImage({
  image,
  alt,
  className = '',
  sizes = '100vw',
  widthHint = 1400,
  priority = false,
}: JourneyImageProps) {
  const cls = `t2e-visual ${className}`.trim();
  const hasAsset = Boolean(image && (image as { asset?: unknown }).asset);

  if (!hasAsset) {
    return <div className={`${cls} t2e-visual--placeholder`} aria-hidden />;
  }

  const src = urlFor(image as never)
    .width(widthHint)
    .quality(82)
    .auto('format')
    .url();

  return (
    <div className={cls}>
      <Image
        src={src}
        alt={alt ?? (image as { alt?: string }).alt ?? ''}
        fill
        sizes={sizes}
        priority={priority}
        style={{ objectFit: 'cover' }}
      />
    </div>
  );
}
