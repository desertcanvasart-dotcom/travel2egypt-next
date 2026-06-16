import type { ReactNode } from 'react';

interface SiloCardProps {
  /** Big gold numeral in the card head */
  number: number;
  /** Pill tag, e.g. "Step", "Collapsed". Marked gold via `tagAccent` */
  tag: string;
  tagAccent?: boolean;
  /** Inline SVG silhouette — the polygon/path artwork rendered in `.fg-silo` */
  silo: ReactNode;
  /** Card name, e.g. "Khufu" */
  name: string;
  /** Italic gold epithet beneath the name */
  epithet: string;
  /** Meta line — supports markup so locale/dynasty can be bolded inline */
  meta: ReactNode;
  /** Body description; supports inline `<span className="gold">…</span>` */
  description: ReactNode;
}

/**
 * One card in the numbered grid. Head (numeral + tag), silhouette SVG,
 * name, epithet, meta line, description. Layout matches the reference
 * pyramids-decoded.html .card block exactly.
 */
export function SiloCard({
  number,
  tag,
  tagAccent,
  silo,
  name,
  epithet,
  meta,
  description,
}: SiloCardProps) {
  return (
    <article className="fg-card">
      <div className="fg-card__head">
        <span className="fg-num">{number}</span>
        <span className={tagAccent ? 'fg-tag fg-tag--true' : 'fg-tag'}>
          {tag}
        </span>
      </div>
      <div className="fg-silo">{silo}</div>
      <h2 className="fg-card__name">{name}</h2>
      <p className="fg-card__epithet">{epithet}</p>
      <p className="fg-meta">{meta}</p>
      <p className="fg-card__desc">{description}</p>
    </article>
  );
}
