import Image from 'next/image';

import { urlFor } from '@/sanity/lib/image';

export interface GalleryImage {
  _key?: string;
  asset?: unknown;
  alt?: string;
  caption?: string;
  credit?: string;
}

interface Props {
  images: GalleryImage[];
  title?: string;
}

export function Gallery({ images, title }: Props) {
  const valid = images.filter((img) => Boolean(img?.asset));
  if (valid.length === 0) return null;

  return (
    <section className="mt-16 border-t border-line pt-12">
      {title && (
        <h2 className="mb-6 font-serif text-3xl font-medium text-ink">{title}</h2>
      )}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {valid.map((img, idx) => {
          const url = urlFor(img).width(900).height(675).quality(80).url();
          return (
            <figure key={img._key ?? idx} className="space-y-2">
              <div className="aspect-[4/3] overflow-hidden bg-cream-deep">
                <Image
                  src={url}
                  alt={img.alt ?? ''}
                  width={900}
                  height={675}
                  className="h-full w-full object-cover"
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                />
              </div>
              {(img.caption || img.credit) && (
                <figcaption className="text-xs leading-relaxed text-ink-muted">
                  {img.caption && <span className="text-ink-soft">{img.caption}</span>}
                  {img.caption && img.credit && <span> · </span>}
                  {img.credit && <span className="italic">{img.credit}</span>}
                </figcaption>
              )}
            </figure>
          );
        })}
      </div>
    </section>
  );
}
