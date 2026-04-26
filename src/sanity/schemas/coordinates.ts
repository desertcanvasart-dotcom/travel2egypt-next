import { defineField, defineType } from 'sanity';
import { PinIcon } from '@sanity/icons';

export const coordinatesSchema = defineType({
  name: 'coordinates',
  title: 'Coordinates',
  type: 'object',
  icon: PinIcon,
  fields: [
    defineField({
      name: 'lat',
      title: 'Latitude',
      type: 'number',
      validation: (Rule) => Rule.min(-90).max(90),
    }),
    defineField({
      name: 'lng',
      title: 'Longitude',
      type: 'number',
      validation: (Rule) => Rule.min(-180).max(180),
    }),
  ],
});
