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
    ? urlFor(item.heroImage).width(700).height(450).quality(80).url()
    : null;

  return (
    <Link href={href} className="group block">
      <div className="mb-3 aspect-[4/3] overflow-hidden rounded-lg bg-cream-deep">
        {heroUrl ? (
          <Image
            src={heroUrl}
            alt={item.heroImage?.alt || item.title || ''}
            width={700}
            height={450}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : null}
      </div>
      <h3 className="mb-1 font-serif text-xl text-ink group-hover:text-orange-deep">
        {item.title}
      </h3>
      {item.summary && (
        <p className="line-clamp-3 text-sm text-ink-soft">{item.summary}</p>
      )}
    </Link>
  );
}
