import { defineField, defineType } from 'sanity';
import {
  StarIcon,
  CogIcon,
  LinkIcon,
} from '@sanity/icons';

import { localizedPortableTextField } from './_helpers';

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
    { name: 'guide', title: 'Guide page' },
  ],
  fields: [
    defineField({
      ...localizedPortableTextField('guideIntro', {
        title: 'Guide page intro',
        description:
          'LEGACY. The old long-form intro essay. Decomposed into the fields below for the archive redesign; kept for reference / other surfaces.',
        group: 'guide',
      }),
    } as any),
    // ── Guide archive redesign (decomposed from guideIntro) ──
    // Localized; es/ja fall back to EN per the localization track.
    defineField({
      name: 'guideLead',
      title: 'Guide · masthead lead',
      description: 'The tight 2–3 paragraph lead under the masthead. Separate paragraphs with a blank line; the first renders as the italic opener. Localized; es/ja fall back to EN.',
      type: 'internationalizedArrayText',
      group: 'guide',
    }),
    defineField({
      name: 'guideFirstTrip',
      title: 'Guide · "first trip" pointer (legacy / v1)',
      description: 'LEGACY. Superseded by guideWays (the three-ways block).',
      type: 'text',
      rows: 2,
      group: 'guide',
    }),
    defineField({
      name: 'guideWays',
      title: 'Guide · three ways in',
      description: 'The three entry styles. First entry’s body auto-links the essential cities (Cairo, Giza, Luxor, Aswan).',
      type: 'array',
      group: 'guide',
      of: [
        {
          type: 'object',
          name: 'guideWay',
          fields: [
            defineField({ name: 'title', title: 'Title', type: 'internationalizedArrayString' }),
            defineField({ name: 'body', title: 'Body', type: 'internationalizedArrayText' }),
          ],
          preview: {
            select: { title: 'title' },
            prepare({ title }) {
              const en = Array.isArray(title) ? title.find((t: any) => t._key === 'en')?.value : title;
              return { title: en || 'Way' };
            },
          },
        },
      ],
    }),
    defineField({
      name: 'guideRegions',
      title: 'Guide · regions',
      description: 'One per region, in display order. Cities attach via their guideRegion key. The lead card is the region\'s top-ranked city.',
      type: 'array',
      group: 'guide',
      of: [
        {
          type: 'object',
          name: 'guideRegion',
          fields: [
            defineField({ name: 'key', title: 'Region key', type: 'string', description: 'Matches city.guideRegion (e.g. cairo-giza).' }),
            defineField({ name: 'name', title: 'Region name', type: 'internationalizedArrayString' }),
            defineField({ name: 'lede', title: 'Region lede', type: 'internationalizedArrayText' }),
          ],
          preview: {
            select: { title: 'name', subtitle: 'key' },
            prepare({ title, subtitle }) {
              const en = Array.isArray(title) ? title.find((t: any) => t._key === 'en')?.value : title;
              return { title: en || subtitle, subtitle };
            },
          },
        },
      ],
    }),
    defineField({
      name: 'guideManifesto',
      title: 'Guide · manifesto points',
      description: 'The distilled "won\'t do" points (~4).',
      type: 'array',
      group: 'guide',
      of: [
        {
          type: 'object',
          name: 'manifestoPoint',
          fields: [
            defineField({ name: 'bold', title: 'Lead clause (bold)', type: 'internationalizedArrayString' }),
            defineField({ name: 'text', title: 'Rest', type: 'internationalizedArrayText' }),
          ],
          preview: {
            select: { title: 'bold' },
            prepare({ title }) {
              const en = Array.isArray(title) ? title.find((t: any) => t._key === 'en')?.value : title;
              return { title: en || 'Manifesto point' };
            },
          },
        },
      ],
    }),
    defineField({
      name: 'guideSignoff',
      title: 'Guide · sign-off',
      description: 'The "Final Word" paragraphs. Separate paragraphs with a blank line; the last renders italic/gold. Localized; es/ja fall back to EN.',
      type: 'internationalizedArrayText',
      group: 'guide',
    }),
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
      name: 'founder',
      title: 'Founder',
      description:
        'Personal identity of the operator\u2019s founder. Drives Schema.org Person markup linked to the TravelAgency Organization via the founder property. Crawlers and AI agents use this to attribute the operator to a real human, which strengthens credibility and Knowledge Panel association.',
      type: 'object',
      group: 'identity',
      fields: [
        defineField({
          name: 'name',
          title: 'Full name',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'jobTitle',
          title: 'Job title',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'description',
          title: 'Description',
          description:
            'Short biographical paragraph. Appears as Person.description in JSON-LD.',
          type: 'text',
          rows: 4,
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'birthPlace',
          title: 'Birth place',
          type: 'string',
        }),
        defineField({
          name: 'knowsLanguage',
          title: 'Languages',
          description: 'Each language as a separate entry (e.g. "Arabic", "English", "Japanese").',
          type: 'array',
          of: [{ type: 'string' }],
        }),
        defineField({
          name: 'alumniOf',
          title: 'Alma mater',
          description: 'Universities or other educational institutions attended.',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({
                  name: 'name',
                  title: 'Institution name',
                  type: 'string',
                  validation: (Rule) => Rule.required(),
                }),
                defineField({
                  name: 'url',
                  title: 'URL',
                  type: 'url',
                }),
              ],
              preview: { select: { title: 'name', subtitle: 'url' } },
            },
          ],
        }),
        defineField({
          name: 'hasCredential',
          title: 'Credentials',
          description: 'Licenses and degrees. Each credential carries a category, name, and recognizing body.',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({
                  name: 'credentialCategory',
                  title: 'Category',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'License', value: 'license' },
                      { title: 'Degree', value: 'degree' },
                      { title: 'Certification', value: 'certification' },
                    ],
                    layout: 'radio',
                  },
                  validation: (Rule) => Rule.required(),
                }),
                defineField({
                  name: 'name',
                  title: 'Credential name',
                  type: 'string',
                  validation: (Rule) => Rule.required(),
                }),
                defineField({
                  name: 'recognizedBy',
                  title: 'Recognised by',
                  type: 'object',
                  fields: [
                    defineField({
                      name: 'name',
                      title: 'Organisation name',
                      type: 'string',
                      validation: (Rule) => Rule.required(),
                    }),
                    defineField({
                      name: 'url',
                      title: 'Organisation URL',
                      type: 'url',
                    }),
                  ],
                  validation: (Rule) => Rule.required(),
                }),
              ],
              preview: {
                select: { title: 'name', subtitle: 'credentialCategory' },
              },
            },
          ],
        }),
        defineField({
          name: 'sameAs',
          title: 'Same-as URLs',
          description: 'Profile URLs for this person (LinkedIn, X, personal site, etc.). Each entry must be an absolute URL.',
          type: 'array',
          of: [{ type: 'url' }],
        }),
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
              description:
                'Other phrasings the agent might use (EN and ES go in this one shared list). ' +
                'AVOID cross-language homographs — a term that is a proper noun in one language ' +
                'but a common word in the other (e.g. ES "File" = Philae, but "file" is an ' +
                'everyday English word) would wrongly link ordinary text. Prefer distinctive, ' +
                'multi-word phrasings.',
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
