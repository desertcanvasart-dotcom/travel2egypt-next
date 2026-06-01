/**
 * Type-led archive masthead: kicker / edition, title, italic tagline. No hero.
 * Content is CMS-authored; nothing here is item-specific.
 */
export function ArchiveHeader({
  kicker,
  title,
  tagline,
}: {
  kicker?: string;
  title: string;
  tagline?: string;
}) {
  return (
    <header className="border-b border-rule py-14 md:py-16">
      {kicker && (
        <p className="mb-6 font-sans text-xs font-medium uppercase tracking-[0.2em] text-sand-warm">
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
    </header>
  );
}
