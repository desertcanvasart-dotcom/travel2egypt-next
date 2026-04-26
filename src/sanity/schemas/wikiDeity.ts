import { defineField, defineType } from 'sanity';
import { StarIcon } from '@sanity/icons';

import { localizedSlugField, localizedPortableTextField } from './_helpers';

export const wikiDeitySchema = defineType({
  name: 'wikiDeity',
  title: 'Wiki — Deity',
  type: 'document',
  icon: StarIcon,
  description: 'Egyptian gods and goddesses. URL: /wiki/deities/[slug]',
  groups: [
    { name: 'identity', title: 'Identity', default: true },
    { name: 'content', title: 'Content' },
    { name: 'connections', title: 'Connections' },
    { name: 'media', title: 'Media' },
    { name: 'meta', title: 'Meta' },
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      description: '"Horus" / "Hor" / "ホルス".',
      type: 'internationalizedArrayString',
      group: 'identity',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      ...localizedSlugField(),
      group: 'identity',
    } as any),
    defineField({
      name: 'alternateNames',
      title: 'Alternate names / transliterations',
      type: 'array',
      group: 'identity',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'domain',
      title: 'Domain',
      description: 'Brief description: "Sky god, falcon-headed" / "Goddess of the home, falcon".',
      type: 'internationalizedArrayString',
      group: 'identity',
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
    defineField(
      localizedPortableTextField('iconography', {
        title: 'Iconography',
        description: 'How the deity is typically depicted.',
        group: 'content',
      }) as any
    ),
    defineField({
      name: 'primaryCultCenters',
      title: 'Primary cult centers',
      type: 'array',
      group: 'connections',
      of: [{ type: 'reference', to: [{ type: 'city' }] }],
    }),
    defineField({
      name: 'associatedMonuments',
      title: 'Associated monuments',
      type: 'array',
      group: 'connections',
      of: [{ type: 'reference', to: [{ type: 'wikiMonument' }] }],
    }),
    defineField({
      name: 'associatedDeities',
      title: 'Associated deities',
      description: 'Family, consorts, or thematically related gods.',
      type: 'array',
      group: 'connections',
      of: [{ type: 'reference', to: [{ type: 'wikiDeity' }] }],
    }),
    defineField({
      name: 'relatedArticles',
      title: 'Related articles',
      type: 'array',
      group: 'connections',
      of: [{ type: 'reference', to: [{ type: 'article' }] }],
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
        'Tick to surface this deity in the wiki landing page\'s "Browse by deity" preview section.',
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
      domain: 'domain',
      media: 'heroImage',
    },
    prepare({ title, domain, media }) {
      const titleEn = Array.isArray(title)
        ? title.find((t: any) => t._key === 'en')?.value
        : title;
      const domainEn = Array.isArray(domain)
        ? domain.find((d: any) => d._key === 'en')?.value
        : domain;
      return {
        title: titleEn || 'Untitled deity',
        subtitle: domainEn,
        media,
      };
    },
  },
});
