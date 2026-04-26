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
      ? urlFor(article.heroImage).width(1600).height(900).quality(82).url()
      : urlFor(article.heroImage).width(800).height(560).quality(80).url()
    : null;

  const dateLabel = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(
        locale === 'ja' ? 'ja-JP' : locale === 'es' ? 'es-ES' : 'en-US',
        { year: 'numeric', month: 'long', day: 'numeric' }
      )
    : null;

  return (
    <Link href={`/blog/${article.slug}`} className="group block">
      <div
        className={
          wide
            ? 'mb-6 aspect-[16/9] overflow-hidden rounded-lg bg-cream-deep'
            : 'mb-4 aspect-[4/3] overflow-hidden rounded-lg bg-cream-deep'
        }
      >
        {heroUrl ? (
          <Image
            src={heroUrl}
            alt={article.heroImage?.alt || article.title}
            width={wide ? 1600 : 800}
            height={wide ? 900 : 560}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      <div className="mb-2 flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-orange-deep">
        {article.category?.name && <span>{article.category.name}</span>}
        {dateLabel && (
          <>
            <span className="text-line">·</span>
            <span className="text-ink-muted">{dateLabel}</span>
          </>
        )}
      </div>
      <h3
        className={
          wide
            ? 'mb-3 font-serif text-3xl font-medium leading-tight text-ink group-hover:text-orange-deep md:text-4xl'
            : 'mb-2 font-serif text-xl font-medium leading-tight text-ink group-hover:text-orange-deep'
        }
      >
        {article.title}
      </h3>
      {article.deck && (
        <p
          className={
            wide
              ? 'mb-3 font-serif text-lg italic leading-relaxed text-ink-soft'
              : 'line-clamp-3 text-sm text-ink-soft'
          }
        >
          {article.deck}
        </p>
      )}
      {article.author?.name && (
        <p className="text-xs uppercase tracking-wider text-ink-muted">
          {article.author.name}
        </p>
      )}
    </Link>
  );
}
