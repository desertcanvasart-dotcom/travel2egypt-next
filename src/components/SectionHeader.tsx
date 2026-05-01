import { Link } from '@/i18n/navigation';

/**
 * Section header — recurring publishing-grade device.
 *
 * Per migration/.brand-inputs/travel2egypt-brand-inputs.md Sections 4-5:
 *   - Italic Roman numeral (i. ii. iii. iv.) prefix in faience.
 *   - Optional italic accent in title (color: faience).
 *   - Right-aligned section link with arrow + bottom-border underline.
 *   - Border-bottom rule line; optional italic subtitle below.
 *
 * Title supports rich content: pass a string or pass JSX with <em>
 * elements for italic faience accents.
 *
 *     <SectionHeader
 *       num="i"
 *       title={<>Travel <em>Guide</em></>}
 *       link={{ href: '/guide', label: 'All destinations' }}
 *       subtitle="Forty-one cities, in honest order."
 *     />
 */

interface SectionHeaderProps {
  /** Roman numeral text shown in italic faience before the title (e.g. "i", "ii", "iii"). Omit for no number. */
  num?: string;
  /** Section title. Use <em> for italic faience accent words. */
  title: React.ReactNode;
  /** Right-aligned link with arrow. */
  link?: {
    href: string;
    label: string;
  };
  /** Optional italic subtitle below the rule line. */
  subtitle?: React.ReactNode;
  /** As `h2` by default; override for nested sections. */
  as?: 'h2' | 'h3';
  className?: string;
}

export function SectionHeader({
  num,
  title,
  link,
  subtitle,
  as: Heading = 'h2',
  className,
}: SectionHeaderProps) {
  return (
    <>
      <div className={`section-header${className ? ` ${className}` : ''}`}>
        <Heading className="section-title">
          {num && <span className="section-num">{num}.</span>}
          {title}
        </Heading>
        {link && (
          <Link href={link.href} className="section-link">
            {link.label} →
          </Link>
        )}
      </div>
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
    </>
  );
}
