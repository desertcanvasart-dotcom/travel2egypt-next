import { EditorialHeroStats } from '../EditorialHeroStats';

/**
 * Type-led archive masthead: kicker / edition, title, italic tagline. No hero.
 * Content is CMS-authored; nothing here is item-specific. An optional `stats`
 * spec list resolves the hero's blank right side (bottom-right on desktop,
 * stacked on mobile).
 */
export function ArchiveHeader({
  kicker,
  title,
  tagline,
  stats,
}: {
  kicker?: string;
  title: string;
  tagline?: string;
  stats?: Array<{ label: string; value: string | number }>;
}) {
  return (
    <header className="flex flex-col gap-10 border-b border-rule py-14 md:flex-row md:items-end md:justify-between md:gap-12 md:py-16">
      <div className="min-w-0">
        {kicker && (
          <p className="mb-6 font-sans text-xs font-medium uppercase tracking-[0.2em] text-gold-ink">
            {kicker}
          </p>
        )}
        <h1 className="max-w-[14ch] font-serif text-[clamp(3rem,7vw,6rem)] font-normal leading-[0.98] tracking-[-0.01em] text-faience">
          {title}
        </h1>
        {tagline && (
          <p className="mt-7 max-w-[680px] font-serif text-[clamp(1.375rem,2.4vw,1.875rem)] italic leading-snug text-night-soft">
            {tagline}
          </p>
        )}
      </div>
      {stats && <EditorialHeroStats stats={stats} />}
    </header>
  );
}
