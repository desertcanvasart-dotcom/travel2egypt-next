import { defineField } from 'sanity';

/**
 * Priced tour blocks for guides, blog articles and wiki monuments (fix round
 * 3, Task C, 2026-11-08). `localized` = the document holds every language
 * (city, guideArticle, wikiMonument) so headings are per-language strings;
 * blog articles are one document per language, so headings are plain.
 */
export function relatedToursFields({ localized, group }: { localized: boolean; group?: string }) {
  const str = localized ? 'internationalizedArrayString' : 'string';
  const tourRefs = (name: string, title: string, description: string) =>
    defineField({
      name,
      title,
      type: 'array',
      group,
      description,
      of: [{ type: 'reference', to: [{ type: 'tour' }] }],
      validation: (r) => r.max(3),
    });
  return [
    tourRefs('inlineTours', 'Inline tours (max 3)', 'Priced tour row shown inside the article, after the H2 named below. Only appears when set here.'),
    defineField({
      name: 'inlineAfterHeading',
      title: 'Inline tours: after which H2',
      type: str,
      group,
      description: 'Exact H2 text (a leading "■" and capitalisation are ignored). No match = no inline block.',
    }),
    defineField({ name: 'inlineHeading', title: 'Inline tours: heading', type: str, group }),
    tourRefs(
      'endTours',
      'End tours (max 3)',
      'Shown before the footer. Empty = up to 3 priced tours from the same city are picked automatically (no transfers, shows or group holidays).',
    ),
    defineField({ name: 'endHeading', title: 'End tours: heading', type: str, group }),
  ];
}
