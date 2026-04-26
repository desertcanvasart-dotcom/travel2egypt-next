import { PortableText, type PortableTextComponents } from '@portabletext/react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { urlFor } from '@/sanity/lib/image';

const OPERATOR_NOTE_LABELS: Record<string, Record<string, string>> = {
  en: {
    honest: 'Honest take',
    caution: 'Watch out',
    insider: 'Insider tip',
    context: 'Worth knowing',
  },
  es: {
    honest: 'Opinión honesta',
    caution: 'Cuidado',
    insider: 'Consejo del operador',
    context: 'Vale la pena saberlo',
  },
  ja: {
    honest: '正直な所見',
    caution: '注意点',
    insider: '内部情報',
    context: '知っておくべきこと',
  },
};

interface BodyProps {
  value: any;
  locale: 'en' | 'es' | 'ja';
}

export function Body({ value, locale }: BodyProps) {
  if (!value) return null;

  const components: PortableTextComponents = {
    types: {
      image: ({ value }) => {
        if (!value?.asset?._ref) return null;
        const url = urlFor(value).width(1400).quality(85).url();
        return (
          <figure className="my-10">
            <Image
              src={url}
              alt={value.alt || ''}
              width={1400}
              height={900}
              className="rounded-md"
            />
            {value.caption && (
              <figcaption className="mt-3 text-sm italic text-ink-muted">
                {value.caption}
              </figcaption>
            )}
          </figure>
        );
      },
      operatorNote: ({ value }) => {
        const tone = value.tone || 'honest';
        const label = OPERATOR_NOTE_LABELS[locale]?.[tone] ?? '';
        const className = tone === 'honest'
          ? 'operator-note'
          : `operator-note operator-note--${tone}`;
        return (
          <aside className={className}>
            <div className="operator-note__label">{label}</div>
            <div>
              <PortableText value={value.body} components={baseComponents} />
            </div>
          </aside>
        );
      },
    },
    marks: {
      externalLink: ({ children, value }) => (
        <a
          href={value?.href}
          target={value?.newTab ? '_blank' : undefined}
          rel={value?.newTab ? 'noopener noreferrer' : undefined}
        >
          {children}
        </a>
      ),
      internalLink: ({ children }) => {
        // In a fuller implementation this would resolve the reference into
        // a localized URL via the concierge link map / type-aware router.
        // For now we render the link text without a href so editors see it
        // works structurally; wire up resolution before launch.
        return <span className="underline decoration-orange-pale">{children}</span>;
      },
    },
  };

  return <PortableText value={value} components={components} />;
}

const baseComponents: PortableTextComponents = {
  marks: {
    externalLink: ({ children, value }) => (
      <a href={value?.href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
  },
};
