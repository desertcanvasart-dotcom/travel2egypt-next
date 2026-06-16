import { defineField, defineType } from 'sanity';
import { StarIcon } from '@sanity/icons';

import { localizedSlugField } from './_helpers';

/**
 * Deity — a node in the Egyptian Gods family tree (/resources/egyptian-gods).
 *
 * Distinct from `wikiDeity` (a long-form wiki article on a deity, currently
 * dormant). This document is *lean*: only the fields the family-tree
 * visualization and its side panel need. No Portable Text body, no gallery.
 *
 * Tree position is derived from `treeRole` + `isOnSpine` in the frontend
 * layout logic — DO NOT add free-form x/y coordinate fields here. Adding
 * a new deity should not require visually re-positioning the tree.
 */
export const deitySchema = defineType({
  name: 'deity',
  title: 'Deity (Family Tree)',
  type: 'document',
  icon: StarIcon,
  description:
    'A deity node on /resources/egyptian-gods. Tree position is derived from treeRole + isOnSpine — no manual coordinates.',
  groups: [
    { name: 'identity', title: 'Identity', default: true },
    { name: 'domain', title: 'Domain & iconography' },
    { name: 'geography', title: 'Geography' },
    { name: 'story', title: 'Story & relationships' },
    { name: 'editorial', title: 'Operator notes' },
    { name: 'layout', title: 'Tree layout' },
    { name: 'meta', title: 'Meta' },
  ],
  fields: [
    // ── Identity ──────────────────────────────────────────────────────
    defineField({
      name: 'name',
      title: 'Name',
      description: '"Osiris" / "Osiris" / "オシリス".',
      type: 'internationalizedArrayString',
      group: 'identity',
      validation: (Rule) =>
        Rule.required().custom((value: any) => {
          if (!value || !Array.isArray(value)) return 'Name is required';
          const en = value.find((v: any) => v._key === 'en');
          if (!en?.value) return 'English name is required';
          return true;
        }),
    }),
    defineField({
      ...localizedSlugField({
        description:
          'URL slug for each locale (kebab-case ASCII, e.g. "osiris", "horus-the-younger"). EN required; ES/JA fall back to EN. Edit the EN name first, then click Generate.',
      }),
      group: 'identity',
    } as any),
    defineField({
      name: 'transliteration',
      title: 'Transliteration',
      description:
        'Scholarly Egyptian transliteration (e.g. "Wsjr" for Osiris). One value across all locales — scholarly convention is locale-independent.',
      type: 'string',
      group: 'identity',
    }),
    defineField({
      name: 'hieroglyphicSpelling',
      title: 'Hieroglyphic spelling',
      description:
        'The hieroglyph sequence. Unicode hieroglyphs if they render correctly in your editor; otherwise leave blank for Phase 2 image upload.',
      type: 'string',
      group: 'identity',
    }),
    defineField({
      name: 'portraitImage',
      title: 'Portrait image',
      description:
        'The illustrated portrait shown on the tree node and in the side panel. Phase 1 will render a placeholder if empty.',
      type: 'localizedImage',
      group: 'identity',
    }),

    // ── Domain & iconography ──────────────────────────────────────────
    defineField({
      name: 'domain',
      title: 'Domain',
      description:
        'One to two sentences. The deity\'s sphere of influence. "God of the afterlife, resurrection, and agricultural renewal. Ruler of the underworld after his death and resurrection."',
      type: 'internationalizedArrayText',
      group: 'domain',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'iconography',
      title: 'Iconography',
      description:
        'Operator-grade prose on how to recognize this deity in temple reliefs. The most useful field for travellers in the field.',
      type: 'internationalizedArrayText',
      group: 'domain',
    }),
    defineField({
      name: 'sacredAnimal',
      title: 'Sacred animal',
      description: '"Falcon" / "Jackal". Leave blank for deities with no animal form (Atum, Ma\'at).',
      type: 'internationalizedArrayString',
      group: 'domain',
    }),

    // ── Geography ─────────────────────────────────────────────────────
    defineField({
      name: 'primaryCultCenter',
      title: 'Primary cult center',
      description:
        'The city where this deity\'s main cult was based. Leave blank for folk deities (Bes) and pan-Egyptian gods with no single center.',
      type: 'reference',
      group: 'geography',
      to: [{ type: 'city' }],
    }),
    defineField({
      name: 'whereYoullSeeThem',
      title: "Where you'll see them",
      description:
        'Specific temples and rooms — actionable for a traveller. "The entire temple complex at Edfu is dedicated to him; the inner sanctuary holds his cult statue. He also appears prominently at Kom Ombo..."',
      type: 'internationalizedArrayText',
      group: 'geography',
    }),

    // ── Story & relationships ─────────────────────────────────────────
    defineField({
      name: 'keyMyth',
      title: 'Key myth',
      description:
        'ONE sentence maximum. Editorial rule — this is a tree, not a mythology encyclopedia. "Murdered by his brother Set, dismembered, and reassembled by his sister-wife Isis — became ruler of the afterlife."',
      type: 'internationalizedArrayText',
      group: 'story',
    }),
    defineField({
      name: 'parents',
      title: 'Parents',
      description: 'Usually 0, 1, or 2 entries. References to other deity documents.',
      type: 'array',
      group: 'story',
      of: [{ type: 'reference', to: [{ type: 'deity' }] }],
      validation: (Rule) => Rule.max(2),
    }),
    defineField({
      name: 'spouse',
      title: 'Spouse',
      description: 'Reference to another deity document. Leave blank if none.',
      type: 'reference',
      group: 'story',
      to: [{ type: 'deity' }],
    }),
    defineField({
      name: 'children',
      title: 'Children',
      type: 'array',
      group: 'story',
      of: [{ type: 'reference', to: [{ type: 'deity' }] }],
    }),
    defineField({
      name: 'siblings',
      title: 'Notable siblings',
      description:
        'Only populate if the sibling relationship is *notable* (e.g. the four children of Geb and Nut). Don\'t redundantly add siblings the schema can derive from shared parents.',
      type: 'array',
      group: 'story',
      of: [{ type: 'reference', to: [{ type: 'deity' }] }],
    }),

    // ── Operator notes ────────────────────────────────────────────────
    defineField({
      name: 'commonConfusions',
      title: 'Common confusions',
      description:
        'The brutally honest "you\'ll mix this up with X" field — the page\'s editorial signature. "Often confused with Hathor, who shares cow iconography. Isis usually wears a throne-shaped crown (her name is the hieroglyph for \'throne\'); Hathor wears a sun disk between cow\'s horns."',
      type: 'internationalizedArrayText',
      group: 'editorial',
    }),
    defineField({
      name: 'regionalVariants',
      title: 'Regional variants',
      description:
        'For deities that differ meaningfully between cult centers (e.g. Sobek at Kom Ombo vs Memphis). Optional.',
      type: 'internationalizedArrayText',
      group: 'editorial',
    }),

    // ── Tree layout ───────────────────────────────────────────────────
    defineField({
      name: 'treeRole',
      title: 'Tree role',
      description:
        'Drives the deity\'s position on the family tree visualization. Spine generations (primordial → fourth) run down the centre; everything else orbits.',
      type: 'string',
      group: 'layout',
      options: {
        layout: 'dropdown',
        list: [
          { title: 'Primordial (Nun, Atum/Ra)', value: 'primordial' },
          { title: 'First generation (Shu, Tefnut)', value: 'firstGeneration' },
          { title: 'Second generation (Geb, Nut)', value: 'secondGeneration' },
          {
            title: 'Third generation (Osiris, Isis, Set, Nephthys)',
            value: 'thirdGeneration',
          },
          {
            title: 'Fourth generation (Horus, Anubis, Wepwawet)',
            value: 'fourthGeneration',
          },
          {
            title: "Solar child (Ma'at, Hathor, Bastet, Sekhmet)",
            value: 'solarChild',
          },
          {
            title: 'Alternate creator (Ptah, Khnum, Amun)',
            value: 'alternateCreator',
          },
          { title: 'Independent (Sobek, Thoth)', value: 'independent' },
          { title: 'Folk deity (Bes, Taweret)', value: 'folkDeity' },
          { title: 'Experimental (Aten)', value: 'experimental' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'isOnSpine',
      title: 'On the Heliopolitan spine',
      description:
        'True for the eleven spine deities (Nun, Atum/Ra, Shu, Tefnut, Geb, Nut, Osiris, Isis, Set, Nephthys, Horus). They render larger and more prominently.',
      type: 'boolean',
      group: 'layout',
      initialValue: false,
    }),

    // ── Meta (Phase-2 SEO prep) ───────────────────────────────────────
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
      role: 'treeRole',
      media: 'portraitImage',
    },
    prepare({ title, domain, role, media }) {
      const titleEn = Array.isArray(title)
        ? title.find((t: any) => t._key === 'en')?.value
        : title;
      const domainEn = Array.isArray(domain)
        ? domain.find((d: any) => d._key === 'en')?.value
        : domain;
      return {
        title: titleEn || 'Untitled deity',
        subtitle: role ? `${role} — ${(domainEn || '').slice(0, 60)}` : domainEn,
        media,
      };
    },
  },
});
