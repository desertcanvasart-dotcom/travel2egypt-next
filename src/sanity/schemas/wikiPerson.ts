import { defineField, defineType } from 'sanity';
import { UserIcon } from '@sanity/icons';

import { localizedSlugField, localizedPortableTextField } from './_helpers';

export const wikiPersonSchema = defineType({
  name: 'wikiPerson',
  title: 'Wiki — Person',
  type: 'document',
  icon: UserIcon,
  description:
    'Pharaohs, queens, consorts, viziers, priests, foreign rulers. URL: /wiki/people/[slug]',
  groups: [
    { name: 'identity', title: 'Identity', default: true },
    { name: 'reign', title: 'Reign' },
    { name: 'content', title: 'Content' },
    { name: 'connections', title: 'Connections' },
    { name: 'family', title: 'Family' },
    { name: 'media', title: 'Media' },
    { name: 'meta', title: 'Meta' },
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      description: 'The most common form per language. "Hatshepsut" / "Hatshepsut" / "ハトシェプスト".',
      type: 'internationalizedArrayString',
      group: 'identity',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      ...localizedSlugField(),
      group: 'identity',
    } as any),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      group: 'identity',
      options: {
        list: [
          { title: 'Pharaoh', value: 'pharaoh' },
          { title: 'Queen', value: 'queen' },
          { title: 'Consort', value: 'consort' },
          { title: 'Vizier', value: 'vizier' },
          { title: 'High Priest / Priestess', value: 'priest' },
          { title: 'Noble', value: 'noble' },
          { title: 'Foreign ruler', value: 'foreign-ruler' },
          { title: 'Architect / artisan', value: 'artisan' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'alternateNames',
      title: 'Alternate names / transliterations',
      description:
        'Add every spelling variant: throne names, birth names, transliterations across languages, common modern variants. Used for search and SEO.',
      type: 'array',
      group: 'identity',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'dynasty',
      title: 'Dynasty',
      type: 'reference',
      to: [{ type: 'wikiDynasty' }],
      group: 'reign',
    }),
    defineField({
      name: 'reignStartYear',
      title: 'Reign start (numeric)',
      description: 'Negative for BCE.',
      type: 'number',
      group: 'reign',
    }),
    defineField({
      name: 'reignEndYear',
      title: 'Reign end (numeric)',
      type: 'number',
      group: 'reign',
    }),
    defineField({
      name: 'reignDisplay',
      title: 'Reign (display)',
      description: 'Human-readable. E.g. "c. 1479–1458 BCE".',
      type: 'internationalizedArrayString',
      group: 'reign',
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'internationalizedArrayText',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField(
      localizedPortableTextField('body', {
        title: 'Body',
        group: 'content',
      }) as any
    ),
    defineField({
      name: 'predecessor',
      title: 'Predecessor',
      type: 'reference',
      to: [{ type: 'wikiPerson' }],
      group: 'family',
    }),
    defineField({
      name: 'successor',
      title: 'Successor',
      type: 'reference',
      to: [{ type: 'wikiPerson' }],
      group: 'family',
    }),
    defineField({
      name: 'spouse',
      title: 'Spouse(s)',
      type: 'array',
      group: 'family',
      of: [{ type: 'reference', to: [{ type: 'wikiPerson' }] }],
    }),
    defineField({
      name: 'parents',
      title: 'Parents',
      type: 'array',
      group: 'family',
      of: [{ type: 'reference', to: [{ type: 'wikiPerson' }] }],
    }),
    defineField({
      name: 'children',
      title: 'Children',
      type: 'array',
      group: 'family',
      of: [{ type: 'reference', to: [{ type: 'wikiPerson' }] }],
    }),
    defineField({
      name: 'notableMonuments',
      title: 'Notable monuments',
      description: 'Temples, statues, and other monuments associated with this person (commissioned by them or made for them).',
      type: 'array',
      group: 'connections',
      of: [{ type: 'reference', to: [{ type: 'wikiMonument' }] }],
    }),
    defineField({
      name: 'burialSite',
      title: 'Burial site',
      description: "The person's tomb or burial monument.",
      type: 'reference',
      to: [{ type: 'wikiMonument' }],
      group: 'connections',
    }),
    defineField({
      name: 'relatedArticles',
      title: 'Related articles',
      type: 'array',
      group: 'connections',
      of: [{ type: 'reference', to: [{ type: 'article' }] }],
    }),
    defineField({
      name: 'relatedTours',
      title: 'Related tours',
      type: 'array',
      group: 'connections',
      of: [{ type: 'reference', to: [{ type: 'tour' }] }],
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'localizedImage',
      group: 'media',
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      group: 'media',
      of: [{ type: 'localizedImage' }],
    }),
    defineField({
      name: 'featured',
      title: 'Featured on /wiki landing',
      description:
        'Tick to surface this person in the wiki landing page\'s "Browse by person" preview section.',
      type: 'boolean',
      group: 'meta',
      initialValue: false,
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'meta',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      role: 'role',
      reign: 'reignDisplay',
      media: 'heroImage',
    },
    prepare({ title, role, reign, media }) {
      const titleEn = Array.isArray(title)
        ? title.find((t: any) => t._key === 'en')?.value
        : title;
      const reignEn = Array.isArray(reign)
        ? reign.find((r: any) => r._key === 'en')?.value
        : reign;
      return {
        title: titleEn || 'Untitled person',
        subtitle: [role, reignEn].filter(Boolean).join(' · '),
        media,
      };
    },
  },
});
