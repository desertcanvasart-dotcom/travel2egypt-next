import { defineField, defineType } from 'sanity';
import { ImageIcon } from '@sanity/icons';

export const localizedImageSchema = defineType({
  name: 'localizedImage',
  title: 'Image with localized caption',
  type: 'image',
  icon: ImageIcon,
  options: { hotspot: true },
  fields: [
    defineField({
      name: 'alt',
      title: 'Alt text',
      description:
        'Required for accessibility and SEO. Describe what the image shows, not what it is.',
      type: 'internationalizedArrayString',
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      description: 'Optional. Editorial caption shown beneath the image.',
      type: 'internationalizedArrayString',
    }),
    defineField({
      name: 'credit',
      title: 'Credit',
      description: 'Photographer or source credit. Same across locales.',
      type: 'string',
    }),
  ],
});
