import { PortableText, type PortableTextComponents } from '@portabletext/react';
import type { ComponentProps } from 'react';

import { Body, getBodyComponents } from '@/components/Body';
import type { Locale } from '@/i18n/routing';
import {
  annotateKatakanaFirstMentions,
  injectSectionDividers,
} from '@/lib/food-ja-presentation';

/**
 * Food article body. EN/ES render through the shared <Body> unchanged. JA gets
 * the section's presentation layer: automatic katakana first-mention glosses,
 * `· · ·` section dividers, and (via the `.food-body-ja` class the page puts on
 * the prose container + globals.css) the `■` heading prefix. All of it is
 * render-time — the markdown stays plain.
 *
 * Renders wrapper-less (a fragment) so the blocks stay direct children of the
 * `.prose-editorial` container and keep its `> * + *` vertical rhythm.
 */
export function FoodArticleBody({ value, locale }: { value: unknown; locale: Locale }) {
  if (!value) return null;

  if (locale !== 'ja' || !Array.isArray(value)) {
    return <Body value={value} locale={locale} />;
  }

  const processed = injectSectionDividers(
    annotateKatakanaFirstMentions(value),
  ) as ComponentProps<typeof PortableText>['value'];

  const base = getBodyComponents('ja');
  const components: PortableTextComponents = {
    ...base,
    types: {
      ...base.types,
      foodDivider: () => (
        <div className="food-section-divider" aria-hidden>
          · · ·
        </div>
      ),
    },
  };

  return <PortableText value={processed} components={components} />;
}
