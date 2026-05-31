import Image from 'next/image';

import { Link } from '@/i18n/navigation';
import { urlFor } from '@/sanity/lib/image';

export interface ArticleCardData {
  _id: string;
  language?: string;
  title: string;
  slug: string;
  deck?: string;
  publishedAt?: string;
  updatedAt?: string;
  heroImage?: { asset?: unknown; alt?: string } | null;
  category?: { name?: string; slug?: string } | null;
  author?: { name?: string; slug?: string; photo?: { asset?: unknown } | null } | null;
}

interface Props {
  article: ArticleCardData;
  /** "lead" gives the card more vertical room and shows the deck. */
  variant?: 'compact' | 'lead';
  locale: string;
}

export function ArticleCard({ article, variant = 'compact', locale }: Props) {
  const wide = variant === 'lead';
  const heroUrl = article.heroImage?.asset
    ? wide
      ? urlFor(article.heroImage).width(1600).height(2000).quality(82).url()
      : urlFor(article.heroImage).width(800).height(1000).quality(80).url()
    : null;

  const displayDate = article.updatedAt ?? article.publishedAt;
  const dateLabel = displayDate
    ? new Date(displayDate).toLocaleDateString(
        locale === 'ja' ? 'ja-JP' : locale === 'es' ? 'es-ES' : 'en-US',
        { year: 'numeric', month: 'long', day: 'numeric' }
      )
    : null;

  // Brand spec (Section 4): aspect 4/5 vertical, no borders, no shadows.
  // Whitespace and typography do the work. Subtle hover scale 1.03 on image.
  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group block transition-transform duration-500 hover:-translate-y-0.5"
    >
      <div className="mb-6 aspect-[4/5] overflow-hidden bg-limestone-deep">
        {heroUrl ? (
          <Image
            src={heroUrl}
            alt={article.heroImage?.alt || article.title}
            width={wide ? 1600 : 800}
            height={wide ? 2000 : 1000}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      <div className="mb-3 flex items-center gap-3 font-sans text-xs font-medium uppercase tracking-[0.12em] text-night-soft">
        {article.category?.name && <span>{article.category.name}</span>}
        {article.category?.name && dateLabel && (
          <span className="h-[3px] w-[3px] rounded-full bg-night-soft" aria-hidden />
        )}
        {dateLabel && <span className="font-serif italic normal-case tracking-normal">{dateLabel}</span>}
      </div>
      <h3
        className={
          wide
            ? 'mb-3 font-serif text-3xl font-medium leading-tight text-night transition-colors group-hover:text-faience md:text-4xl'
            : 'mb-2 font-serif text-2xl font-medium leading-tight text-night transition-colors group-hover:text-faience'
        }
      >
        {article.title}
      </h3>
      {article.deck && (
        <p
          className={
            wide
              ? 'mb-3 font-serif text-lg italic leading-relaxed text-night-soft'
              : 'line-clamp-3 text-[0.9375rem] leading-relaxed text-night-soft'
          }
        >
          {article.deck}
        </p>
      )}
      {article.author?.name && (
        <p className="font-serif text-sm italic text-night-soft">
          {article.author.name}
        </p>
      )}
    </Link>
  );
}
