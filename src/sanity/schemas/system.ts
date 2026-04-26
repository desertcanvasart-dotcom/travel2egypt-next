import { defineField, defineType } from 'sanity';
import {
  StarIcon,
  CogIcon,
  LinkIcon,
} from '@sanity/icons';

export const trustBadgeSchema = defineType({
  name: 'trustBadge',
  title: 'Trust badge',
  type: 'document',
  icon: StarIcon,
  description: 'JATA, IATA, ASTA, TripAdvisor, Kayak, "30+ Years" — the badges that anchor trust strips.',
  fields: [
    defineField({
      name: 'name',
      title: 'Internal name',
      description: 'Short identifier. Same across locales.',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'label',
      title: 'Display label',
      description: 'Text shown next to or under the badge.',
      type: 'internationalizedArrayString',
    }),
    defineField({
      name: 'image',
      title: 'Badge image / logo',
      type: 'image',
      options: { hotspot: false },
    }),
    defineField({
      name: 'linkUrl',
      title: 'Link URL',
      description: 'Optional outbound link (e.g. TripAdvisor profile).',
      type: 'url',
    }),
    defineField({
      name: 'contextNote',
      title: 'Context note',
      description: 'Tooltip or aria-label text.',
      type: 'internationalizedArrayString',
    }),
  ],
  preview: {
    select: { title: 'name', media: 'image' },
    prepare({ title, media }) {
      return { title, media };
    },
  },
});

/**
 * Singleton — there is only ever one siteSettings document.
 * The Studio structure config enforces this.
 */
export const siteSettingsSchema = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  icon: CogIcon,
  groups: [
    { name: 'identity', title: 'Identity', default: true },
    { name: 'navigation', title: 'Navigation' },
    { name: 'sisterBrands', title: 'Sister brands' },
    { name: 'trust', title: 'Trust' },
    { name: 'contact', title: 'Contact' },
  ],
  fields: [
    defineField({
      name: 'siteName',
      title: 'Site name',
      type: 'internationalizedArrayString',
      group: 'identity',
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'internationalizedArrayString',
      group: 'identity',
    }),
    defineField({
      name: 'defaultOgImage',
      title: 'Default social-share image',
      description:
        '1200×630 image used as the absolute final fallback when a page has no SEO image and no hero image. Branded wordmark works best.',
      type: 'image',
      group: 'identity',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', type: 'string' }),
      ],
    }),
    defineField({
      name: 'logo',
      title: 'Brand logo',
      description:
        'Square or wide brand logo. Used in Schema.org Organization markup, Google Knowledge Panel, and as a fallback for share cards when no other image is set.',
      type: 'image',
      group: 'identity',
      options: { hotspot: false },
      fields: [
        defineField({ name: 'alt', type: 'string' }),
      ],
    }),
    defineField({
      name: 'address',
      title: 'Postal address',
      description:
        'Used in Schema.org Organization markup. Free-text streetAddress is fine; addressLocality and country are required for valid markup.',
      type: 'object',
      group: 'identity',
      fields: [
        defineField({ name: 'streetAddress', title: 'Street address', type: 'string' }),
        defineField({
          name: 'addressLocality',
          title: 'City',
          type: 'string',
          initialValue: 'Cairo',
        }),
        defineField({ name: 'addressRegion', title: 'Region / governorate', type: 'string' }),
        defineField({ name: 'postalCode', title: 'Postal code', type: 'string' }),
        defineField({
          name: 'addressCountry',
          title: 'Country (ISO 3166-1 alpha-2)',
          type: 'string',
          initialValue: 'EG',
        }),
      ],
    }),
    defineField({
      name: 'knowsAbout',
      title: 'Topics the operator is authoritative on',
      description:
        'Drives Schema.org `knowsAbout` on the Organization markup — important for AI-search citation (ChatGPT, Perplexity, Claude). Add the topics you want to be cited as a source for.',
      type: 'array',
      group: 'identity',
      of: [{ type: 'string' }],
      initialValue: [
        'Egyptian travel',
        'Nile cruises',
        'Egyptology',
        'Cairo tours',
        'Luxor tours',
        'Aswan tours',
        'Pyramids of Giza',
        'Ancient Egyptian history',
        'Pharaonic monuments',
        'Red Sea travel',
        'Egypt travel planning',
      ],
    }),
    defineField({
      name: 'headerNav',
      title: 'Header navigation',
      type: 'array',
      group: 'navigation',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'internationalizedArrayString',
            }),
            defineField({
              name: 'href',
              title: 'URL or path',
              type: 'string',
            }),
          ],
          preview: {
            select: { title: 'label', subtitle: 'href' },
            prepare({ title, subtitle }) {
              const en = Array.isArray(title)
                ? title.find((t: any) => t._key === 'en')?.value
                : title;
              return { title: en, subtitle };
            },
          },
        },
      ],
    }),
    defineField({
      name: 'footerNav',
      title: 'Footer navigation',
      type: 'array',
      group: 'navigation',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'sectionLabel',
              title: 'Section label',
              type: 'internationalizedArrayString',
            }),
            defineField({
              name: 'links',
              title: 'Links',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    defineField({
                      name: 'label',
                      type: 'internationalizedArrayString',
                    }),
                    defineField({ name: 'href', type: 'string' }),
                  ],
                },
              ],
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'sisterBrands',
      title: 'Sister brands',
      description: 'AffordEgypt, Soléi, and any future portfolio brands.',
      type: 'array',
      group: 'sisterBrands',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'name', type: 'string' }),
            defineField({ name: 'url', type: 'url' }),
            defineField({
              name: 'description',
              type: 'internationalizedArrayString',
              description: 'One-line "what this brand is for".',
            }),
            defineField({
              name: 'logo',
              type: 'image',
              options: { hotspot: false },
            }),
          ],
          preview: {
            select: { title: 'name', media: 'logo' },
          },
        },
      ],
    }),
    defineField({
      name: 'defaultTrustBadges',
      title: 'Default trust badges',
      description: 'Badges shown by default in the trust strip across the site.',
      type: 'array',
      group: 'trust',
      of: [{ type: 'reference', to: [{ type: 'trustBadge' }] }],
    }),
    defineField({
      name: 'contact',
      title: 'Contact',
      type: 'object',
      group: 'contact',
      fields: [
        defineField({ name: 'email', type: 'string' }),
        defineField({ name: 'phone', type: 'string' }),
        defineField({
          name: 'whatsapp',
          title: 'WhatsApp number (E.164 format)',
          type: 'string',
          description: 'E.g. +201234567890',
        }),
        defineField({
          name: 'address',
          type: 'internationalizedArrayText',
        }),
      ],
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social profiles',
      description:
        'All public profile URLs. These power the Schema.org `sameAs` array — Google uses sameAs to link the site to its social presence in the Knowledge Panel, and AI search engines use it to verify authority.',
      type: 'object',
      group: 'contact',
      fields: [
        defineField({ name: 'facebook', type: 'url' }),
        defineField({ name: 'instagram', type: 'url' }),
        defineField({ name: 'youtube', type: 'url' }),
        defineField({ name: 'linkedin', type: 'url' }),
        defineField({ name: 'twitter', title: 'X / Twitter', type: 'url' }),
        defineField({
          name: 'tripadvisor',
          title: 'TripAdvisor profile',
          type: 'url',
        }),
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Site settings' };
    },
  },
});

/**
 * Concierge link map — singleton.
 *
 * Maps the canonical place names the AI agent says ("Tomb of Petosiris at
 * Tuna el-Gebel", "Karnak Temple") to their corresponding Sanity documents
 * so the agent can deep-link into the site reliably. Editable by the team
 * as new content is added or the agent's vocabulary expands.
 *
 * The agent's system prompt teaches it canonical names; this map turns
 * those names into URLs.
 */
export const conciergeLinkMapSchema = defineType({
  name: 'conciergeLinkMap',
  title: 'Concierge link map',
  type: 'document',
  icon: LinkIcon,
  description:
    'Maps canonical place names used by the AI concierge to their site URLs. Maintained by the team; the agent reads this to construct deep links.',
  fields: [
    defineField({
      name: 'entries',
      title: 'Entries',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'canonicalName',
              title: 'Canonical name (as the agent says it)',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'aliases',
              title: 'Aliases / alternate spellings',
              type: 'array',
              of: [{ type: 'string' }],
            }),
            defineField({
              name: 'target',
              title: 'Target document',
              type: 'reference',
              to: [
                { type: 'city' },
                { type: 'guideArticle' },
                { type: 'tour' },
                { type: 'wikiMonument' },
                { type: 'wikiPerson' },
                { type: 'wikiDynasty' },
                { type: 'wikiDeity' },
                { type: 'travelTip' },
                { type: 'article' },
                { type: 'hotel' },
                { type: 'nileCruise' },
              ],
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'notes',
              title: 'Notes',
              description: 'Internal notes for the team.',
              type: 'text',
              rows: 2,
            }),
          ],
          preview: {
            select: {
              name: 'canonicalName',
              targetTitle: 'target.name',
              targetType: 'target._type',
            },
            prepare({ name, targetTitle, targetType }) {
              const targetEn = Array.isArray(targetTitle)
                ? targetTitle.find((t: any) => t._key === 'en')?.value
                : targetTitle;
              return {
                title: name,
                subtitle: targetEn ? `→ ${targetType}: ${targetEn}` : `→ ${targetType}`,
              };
            },
          },
        },
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Concierge link map' };
    },
  },
});
