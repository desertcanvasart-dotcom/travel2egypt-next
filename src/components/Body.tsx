import { PortableText, type PortableTextComponents } from '@portabletext/react';
import Image from 'next/image';

import { Link } from '@/i18n/navigation';
import { urlFor } from '@/sanity/lib/image';
import {
  resolveInternalLinkHref,
  pickLocalized,
  type ResolvableRef,
} from '@/sanity/lib/i18n';
import { createHeadingIdGenerator } from '@/lib/portable-text';
import type { Locale } from '@/i18n/routing';

/**
 * Single-word eyebrow shown on inline concierge-note asides. Localized so
 * the gold-ruled aside reads correctly in every locale.
 */
const CONCIERGE_NOTE_LABELS: Record<string, string> = {
  en: 'Concierge note',
  es: 'Nota del concierge',
  ja: 'コンシェルジュより',
};

type LocalizedField<T = string> = string | Array<{ _key: string; value: T }> | null | undefined;

function readLocalized(value: LocalizedField, locale: Locale): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return (pickLocalized<string>(value, locale) ?? '') as string;
}

/**
 * Operator-note tone labels — single-word eyebrow per brand-inputs Phase 2
 * plan #4. Italic faience small caps, applied via .operator-note__label.
 */
const OPERATOR_NOTE_LABELS: Record<string, Record<string, string>> = {
  en: {
    honest: 'Honest take',
    caution: 'Caution',
    insider: 'Insider tip',
    context: 'Context',
  },
  es: {
    honest: 'Opinión honesta',
    caution: 'Cuidado',
    insider: 'Consejo del operador',
    context: 'Contexto',
  },
  ja: {
    honest: '正直な所見',
    caution: '注意',
    insider: '内部情報',
    context: '背景',
  },
};

interface BodyProps {
  value: any;
  locale: 'en' | 'es' | 'ja';
}

export function Body({ value, locale }: BodyProps) {
  if (!value) return null;

  // h2s get stable, de-duplicated ids so the in-article TOC can anchor to
  // them. Must mirror extractHeadings()'s order/dedupe — both walk blocks in
  // document order and call the generator once per h2.
  const nextHeadingId = createHeadingIdGenerator();

  const components: PortableTextComponents = {
    block: {
      h2: ({ value: block, children }) => {
        const text = Array.isArray(block?.children)
          ? block.children
              .map((c) => (typeof (c as { text?: string }).text === 'string' ? (c as { text?: string }).text : ''))
              .join('')
          : '';
        return <h2 id={nextHeadingId(text)}>{children}</h2>;
      },
    },
    types: {
      conciergeNote: ({ value }) => {
        if (!value?.body) return null;
        const label = CONCIERGE_NOTE_LABELS[locale] ?? CONCIERGE_NOTE_LABELS.en;
        return (
          <aside className="concierge-note">
            <div className="concierge-note__label">{label}</div>
            <div className="concierge-note__body">
              <PortableText value={value.body} components={baseComponents} />
            </div>
          </aside>
        );
      },
      definitionList: ({ value }) => {
        const items = (Array.isArray(value?.items) ? value.items : []).filter(Boolean);
        if (items.length === 0) return null;
        return (
          <dl className="my-7 border-t border-rule">
            {items.map((row: any, i: number) => {
              const term = readLocalized(row?.term, locale);
              const desc = readLocalized(row?.description, locale);
              if (!term && !desc) return null;
              return (
                <div
                  key={row?._key ?? i}
                  className="grid grid-cols-1 gap-2 border-b border-rule py-3.5 sm:grid-cols-[130px_1fr] sm:gap-6"
                >
                  <dt className="pt-1 font-sans text-xs uppercase tracking-[0.14em] text-sand-warm">
                    {term}
                  </dt>
                  <dd className="font-sans text-[0.9375rem] leading-relaxed text-night-soft">
                    {desc}
                  </dd>
                </div>
              );
            })}
          </dl>
        );
      },
      image: ({ value }) => {
        if (!value?.asset?._ref) return null;
        const url = urlFor(value).width(1400).quality(85).url();
        // alt/caption are internationalizedArrayString in the schema;
        // readLocalized also accepts a plain string for older content.
        const alt = readLocalized(value.alt, locale);
        const caption = readLocalized(value.caption, locale);
        return (
          <figure className="my-10">
            <Image src={url} alt={alt ?? ''} width={1400} height={900} />
            {caption && (
              <figcaption className="mt-3 font-serif text-sm italic text-night-soft">
                {caption}
              </figcaption>
            )}
          </figure>
        );
      },
      pullQuote: ({ value }) => {
        const quote = readLocalized(value?.quote, locale);
        const attribution = readLocalized(value?.attribution, locale);
        const style = (value?.style as 'literary' | 'historical' | 'traveler') || 'literary';
        if (!quote) return null;
        return (
          <figure className="my-12 border-y border-rule-strong py-8">
            <blockquote className="relative font-serif text-2xl italic leading-snug text-night md:text-3xl">
              <span
                aria-hidden
                className="absolute -left-2 -top-3 font-serif italic text-faience text-[2em] leading-[0.5] md:-left-4"
              >
                &ldquo;
              </span>
              <span className="pl-6 md:pl-8">{quote}</span>
            </blockquote>
            {attribution && (
              <figcaption className="mt-5 pl-6 font-sans text-xs uppercase tracking-[0.18em] text-night-soft md:pl-8">
                {style === 'historical' ? `— ${attribution}` : attribution}
              </figcaption>
            )}
          </figure>
        );
      },
      sideImage: ({ value }) => {
        if (!value?.image?.asset?._ref) return null;
        const url = urlFor(value.image).width(640).quality(85).url();
        const alt = readLocalized(value.alt, locale);
        const caption = readLocalized(value.caption, locale);
        const alignment = (value.alignment as 'left' | 'right') || 'right';
        const floatClass =
          alignment === 'left'
            ? 'md:float-left md:mr-8 md:ml-0'
            : 'md:float-right md:ml-8 md:mr-0';
        return (
          <figure
            className={`my-6 w-full md:my-2 md:w-[320px] md:max-w-[40%] ${floatClass}`}
          >
            <Image
              src={url}
              alt={alt ?? ''}
              width={640}
              height={480}
              sizes="(max-width: 768px) 100vw, 320px"
            />
            {caption && (
              <figcaption className="mt-2 font-serif text-xs italic text-night-soft">
                {caption}
              </figcaption>
            )}
          </figure>
        );
      },
      gallery: ({ value }) => {
        const images = (Array.isArray(value?.images) ? value.images : []).filter(
          (img: any) => img?.asset?._ref,
        );
        if (images.length === 0) return null;
        const columns = value?.columns === '2' ? '2' : '3';
        const gridClass =
          columns === '2'
            ? 'sm:grid-cols-2'
            : 'sm:grid-cols-2 md:grid-cols-3';
        return (
          <div className={`my-10 grid grid-cols-1 gap-3 ${gridClass}`}>
            {images.map((img: any, i: number) => {
              const url = urlFor(img).width(800).quality(85).url();
              const alt = readLocalized(img.alt, locale);
              const caption = readLocalized(img.caption, locale);
              return (
                <figure key={img._key ?? i} className="m-0">
                  <Image src={url} alt={alt ?? ''} width={800} height={600} sizes="(max-width: 640px) 100vw, 33vw" />
                  {caption && (
                    <figcaption className="mt-2 font-serif text-xs italic text-night-soft">
                      {caption}
                    </figcaption>
                  )}
                </figure>
              );
            })}
          </div>
        );
      },
      operatorNote: ({ value }) => {
        const tone = (value.tone as keyof (typeof OPERATOR_NOTE_LABELS)['en']) || 'honest';
        const label = OPERATOR_NOTE_LABELS[locale]?.[tone] ?? '';
        const attribution = readLocalized(value?.attribution, locale);
        return (
          <aside className="operator-note">
            {label && <div className="operator-note__label">{label}</div>}
            <div className="operator-note__body">
              <PortableText value={value.body} components={baseComponents} />
            </div>
            {attribution && (
              <div className="operator-note__attribution">{attribution}</div>
            )}
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
      internalLink: ({ children, value }) => {
        // The body GROQ projection (portableTextBodyProjection /
        // articleBodyMarkProjection in @/sanity/lib/i18n) attaches a
        // `ref` payload to each internalLink markDef. If the ref is
        // missing or unresolvable we render the link text with a
        // styled underline but no href — better than a broken link.
        const ref = value?.ref as ResolvableRef | undefined;
        const href = resolveInternalLinkHref(ref);
        if (!href) {
          return (
            <span className="border-b border-rule-strong">{children}</span>
          );
        }
        return (
          <Link
            href={href}
            className="border-b border-rule-strong text-faience transition-colors hover:border-faience"
          >
            {children}
          </Link>
        );
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
