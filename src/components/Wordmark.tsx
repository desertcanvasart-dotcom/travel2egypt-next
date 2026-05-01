import { Link } from '@/i18n/navigation';

/**
 * Travel2Egypt wordmark.
 *
 * Per migration/.brand-inputs/travel2egypt-brand-inputs.md Section 6:
 *   "Travel2Egypt" — single word, no space, with "2" italicized in
 *   faience color. The "2" replaces "to" in "Travel to Egypt" and is
 *   the brand's only consistent visual mark.
 *
 * Sizes:
 *   - header: 1.5rem (default)
 *   - footer: 1.75rem
 *   - hero contexts: scale via the `size` prop
 *
 * Renders as a link to "/" by default; pass `asHeading` for the footer
 * context where the wordmark sits as the brand block heading.
 */

type WordmarkSize = 'header' | 'footer' | 'hero';

interface WordmarkProps {
  size?: WordmarkSize;
  asHeading?: boolean;
  className?: string;
}

const SIZE_CLASS: Record<WordmarkSize, string> = {
  header: 'text-[1.5rem]',
  footer: 'text-[1.75rem]',
  hero: 'text-[clamp(2rem,4vw,3rem)]',
};

export function Wordmark({
  size = 'header',
  asHeading = false,
  className,
}: WordmarkProps) {
  const inner = (
    <>
      Travel
      <span className="font-serif italic text-faience mx-[0.05em]">2</span>
      Egypt
    </>
  );

  const baseClass =
    `font-serif font-medium tracking-[-0.01em] text-night ${SIZE_CLASS[size]}` +
    (className ? ` ${className}` : '');

  if (asHeading) {
    return <span className={baseClass}>{inner}</span>;
  }

  return (
    <Link href="/" className={baseClass} aria-label="Travel2Egypt — home">
      {inner}
    </Link>
  );
}
