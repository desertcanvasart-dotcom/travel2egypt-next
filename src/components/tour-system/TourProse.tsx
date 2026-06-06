import Image from 'next/image';
import { PortableText, type PortableTextComponents } from '@portabletext/react';

import { pickLocalized } from '@/sanity/lib/i18n';
import { urlFor } from '@/sanity/lib/image';
import type { Locale } from '@/i18n/routing';

/**
 * Portable-text renderer for the tour-system editorial bodies (journey-1/2/3).
 * Emits the EXACT reference markup so the scoped `.lvl-*` CSS styles it:
 *   - first `normal` paragraph → <p class="lead"> (drop cap)
 *   - h2 block → <h2>
 *   - pullQuote → <div class="pull"><p>…</p></div>
 *   - definitionList → <ul class="defs"><li><span class="d-name">…</span>…</ul>
 *   - conciergeNote / operatorNote → <div class="note"> (gold-ruled aside)
 *
 * `noteLabel` is the localized "Concierge note" eyebrow. The renderer is a pure
 * server component — no hooks.
 */

type Loc = string | Array<{ _key: string; value: string }> | null | undefined;

function read(value: Loc, locale: Locale): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return (pickLocalized<string>(value, locale) ?? '') as string;
}

const NOTE_LABELS: Record<string, string> = {
  en: 'Concierge note',
  es: 'Nota del concierge',
  ja: 'コンシェルジュより',
};

export function TourProse({ value, locale }: { value: unknown; locale: Locale }) {
  if (!value || !Array.isArray(value)) return null;

  // Tag the first `normal` block so it gets the drop-cap `.lead` class.
  let leadAssigned = false;
  const blocks = value as Array<Record<string, unknown>>;
  const firstNormalKey = (() => {
    for (const b of blocks) {
      if (b._type === 'block' && (b.style === 'normal' || b.style === undefined)) {
        return b._key as string;
      }
    }
    return undefined;
  })();

  const components: PortableTextComponents = {
    block: {
      normal: ({ value: block, children }) => {
        const isLead = !leadAssigned && (block as { _key?: string })._key === firstNormalKey;
        if (isLead) leadAssigned = true;
        return <p className={isLead ? 'lead' : undefined}>{children}</p>;
      },
      // The reference single-tour body uses ONE large Cormorant heading level for
      // every section ("The day, hour by hour", "What's included", …). Render h2
      // AND any h3/h4 the migrated body carries at that same large level, so no
      // section heading falls back to the small/italic default.
      h2: ({ children }) => <h2>{children}</h2>,
      h3: ({ children }) => <h2>{children}</h2>,
      h4: ({ children }) => <h2>{children}</h2>,
    },
    types: {
      image: ({ value: v }) => {
        const img = v as { asset?: { _ref?: string }; alt?: Loc; caption?: Loc };
        if (!img?.asset?._ref) return null;
        const url = urlFor(img).width(1400).quality(85).url();
        // Preserve the asset's aspect ratio (ref ends in "-WxH-ext").
        const dims = img.asset._ref.match(/-(\d+)x(\d+)-/);
        const w = dims ? Number(dims[1]) : 1400;
        const h = dims ? Number(dims[2]) : 900;
        const alt = read(img.alt, locale);
        const caption = read(img.caption, locale);
        return (
          <figure className="prose-figure">
            <Image
              src={url}
              alt={alt}
              width={w}
              height={h}
              sizes="(max-width: 760px) 100vw, 720px"
            />
            {caption && <figcaption>{caption}</figcaption>}
          </figure>
        );
      },
      pullQuote: ({ value: v }) => {
        const quote = read((v as { quote?: Loc }).quote, locale);
        if (!quote) return null;
        return (
          <div className="pull">
            <p>{quote}</p>
          </div>
        );
      },
      definitionList: ({ value: v }) => {
        const items = (Array.isArray((v as { items?: unknown[] }).items)
          ? (v as { items: Array<Record<string, unknown>> }).items
          : []
        ).filter(Boolean);
        if (items.length === 0) return null;
        return (
          <ul className="defs">
            {items.map((row, i) => {
              const term = read(row.term as Loc, locale);
              const desc = read(row.description as Loc, locale);
              if (!term && !desc) return null;
              return (
                <li key={(row._key as string) ?? i}>
                  <span className="d-name">{term}</span>
                  <span className="d-desc">{desc}</span>
                </li>
              );
            })}
          </ul>
        );
      },
      conciergeNote: ({ value: v }) => {
        const body = (v as { body?: unknown }).body;
        if (!body) return null;
        return (
          <div className="note">
            <span className="t2e-kicker">{NOTE_LABELS[locale] ?? NOTE_LABELS.en}</span>
            <PortableText value={body as never} />
          </div>
        );
      },
      operatorNote: ({ value: v }) => {
        const body = (v as { body?: unknown }).body;
        if (!body) return null;
        return (
          <div className="note">
            <span className="t2e-kicker">{NOTE_LABELS[locale] ?? NOTE_LABELS.en}</span>
            <PortableText value={body as never} />
          </div>
        );
      },
    },
    marks: {
      externalLink: ({ children, value: v }) => (
        <a href={(v as { href?: string })?.href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      ),
    },
  };

  return <PortableText value={value} components={components} />;
}
