import Image from 'next/image';

import { Link } from '@/i18n/navigation';
import { urlFor } from '@/sanity/lib/image';

export interface GuideRefCardData {
  _id: string;
  _type: string;
  title?: string;
  slug?: string;
  summary?: string;
  heroImage?: { asset?: unknown; alt?: string } | null;
  parentCity?: { slug?: string } | null;
}

interface Props {
  item: GuideRefCardData;
}

export function GuideRefCard({ item }: Props) {
  const href =
    item._type === 'guideArticle'
      ? `/guide/${item.parentCity?.slug ?? ''}/${item.slug ?? ''}`
      : `/guide/${item.slug ?? ''}`;

  const heroUrl = item.heroImage?.asset
    ? urlFor(item.heroImage).width(700).height(875).quality(80).url()
    : null;

  return (
    <Link
      href={href}
      className="group block transition-transform duration-500 hover:-translate-y-0.5"
    >
      <div className="mb-5 aspect-[4/5] overflow-hidden bg-limestone-deep">
        {heroUrl ? (
          <Image
            src={heroUrl}
            alt={item.heroImage?.alt || item.title || ''}
            width={700}
            height={875}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      <h3 className="mb-2 font-serif text-2xl font-medium leading-tight text-night transition-colors group-hover:text-faience">
        {item.title}
      </h3>
      {item.summary && (
        <p className="line-clamp-3 text-[0.9375rem] leading-relaxed text-night-soft">
          {item.summary}
        </p>
      )}
    </Link>
  );
}
