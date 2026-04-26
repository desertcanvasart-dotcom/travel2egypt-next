import { defineField, defineType } from 'sanity';
import { TagIcon, UserIcon } from '@sanity/icons';

import { localizedSlugField, localizedPortableTextField } from './_helpers';

export const editorialCategorySchema = defineType({
  name: 'editorialCategory',
  title: 'Editorial category',
  type: 'document',
  icon: TagIcon,
  description:
    'Categories for the journal/blog. Examples: Planning advice, Destination depth, Traveler stories, Operational transparency, The case for Egypt.',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'internationalizedArrayString',
      validation: (Rule) => Rule.required(),
    }),
    defineField(localizedSlugField() as any),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'internationalizedArrayText',
    }),
    defineField({
      name: 'orderRank',
      title: 'Display order',
      type: 'number',
      initialValue: 100,
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'localizedImage',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
    }),
  ],
  preview: {
    select: { title: 'name', media: 'heroImage' },
    prepare({ title, media }) {
      const en = Array.isArray(title)
        ? title.find((t: any) => t._key === 'en')?.value
        : title;
      return { title: en || 'Untitled category', media };
    },
  },
});

export const authorSchema = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      description: 'Real name. Not localized.',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Role',
      description: 'E.g. "Founder & lead trip designer"',
      type: 'internationalizedArrayString',
    }),
    defineField(
      localizedPortableTextField('bio', {
        title: 'Bio',
      }) as any
    ),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'yearsInOperation',
      title: 'Years operating',
      description: 'Optional. Used in author bylines and trust signals.',
      type: 'number',
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social links',
      type: 'object',
      fields: [
        defineField({ name: 'linkedin', title: 'LinkedIn', type: 'url' }),
        defineField({ name: 'twitter', title: 'Twitter / X', type: 'url' }),
        defineField({ name: 'instagram', title: 'Instagram', type: 'url' }),
      ],
    }),
  ],
  preview: {
    select: { title: 'name', media: 'photo', role: 'role' },
    prepare({ title, media, role }) {
      const roleEn = Array.isArray(role)
        ? role.find((r: any) => r._key === 'en')?.value
        : role;
      return { title, subtitle: roleEn, media };
    },
  },
});
