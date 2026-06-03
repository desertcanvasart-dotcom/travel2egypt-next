import type { StructureBuilder, StructureResolver } from 'sanity/structure';
import {
  EarthGlobeIcon,
  ComposeIcon,
  HelpCircleIcon,
  CalendarIcon,
  HomeIcon,
  CogIcon,
  CommentIcon,
  LinkIcon,
  MasterDetailIcon,
  WarningOutlineIcon,
  FilterIcon,
} from '@sanity/icons';

import {
  byCityChild,
  byEnumChild,
  byRefChild,
  workflowFilterItem,
  MISSING,
} from './helpers';

/**
 * Custom Studio structure. Replaces the default "list every type
 * alphabetically" desk with a navigable hierarchy.
 *
 * Session 19 enhancements (on top of the session-pre-19 baseline):
 *   - By-city navigation for tour, hotel, guideArticle (41 cities each)
 *   - By-discriminator facets: tour.type, tour.tourMode, hotel.category,
 *     nileCruise.type, nileCruise.tier, guideArticle.section,
 *     travelTip.category
 *   - "Needing review" workflow nodes surfacing operator-Studio editorial
 *     backlogs as native Studio navigation rather than requiring
 *     audit-report cross-reference. Filters target the migration meta
 *     fields populated by the WP import (migration.cityResolution,
 *     migration.categoryResolution, migration.typeInference) plus
 *     content gaps (empty body / summary, missing hero).
 *
 * All existing structure nodes are preserved (flat lists kept for power
 * users); the new nodes are additive.
 */

// Tour-mode enum (schema-defined).
const TOUR_MODE_VALUES = [
  { value: 'private', title: 'Private' },
  { value: 'group', title: 'Group' },
];

// hotel.category enum.
const HOTEL_CATEGORY_VALUES = [
  { value: 'standard', title: 'Standard' },
  { value: 'deluxe', title: 'Deluxe' },
  { value: 'luxury', title: 'Luxury' },
  { value: 'boutique', title: 'Boutique' },
];

// nileCruise.type enum.
const CRUISE_TYPE_VALUES = [
  { value: 'cruise-ship', title: 'Cruise ship' },
  { value: 'dahabiya', title: 'Dahabiya' },
  { value: 'felucca', title: 'Felucca' },
];

// nileCruise.tier enum.
const CRUISE_TIER_VALUES = [
  { value: 'standard', title: 'Standard' },
  { value: 'deluxe', title: 'Deluxe' },
  { value: 'luxury', title: 'Luxury' },
  { value: 'boutique', title: 'Boutique' },
];

// guideArticle.section enum (matches the 5 city-guide nav sections).
const GUIDE_SECTION_VALUES = [
  { value: 'introducing', title: 'Introducing' },
  { value: 'plan-your-trip', title: 'Plan your trip' },
  { value: 'while-you-are-there', title: 'While you are there' },
  { value: 'places-to-go', title: 'Places to go' },
  { value: 'others', title: 'Others' },
];

export const structure: StructureResolver = (S: StructureBuilder, context) =>
  S.list()
    .title('Travel2Egypt')
    .items([
      // ── Editorial (the journal) ──
      S.listItem()
        .title('Journal')
        .icon(ComposeIcon)
        .child(
          S.list()
            .title('Journal')
            .items([
              S.documentTypeListItem('article').title('Articles'),
              S.documentTypeListItem('editorialCategory').title('Categories'),
              S.documentTypeListItem('author').title('Authors'),
            ])
        ),

      // ── Tours & packages ──
      S.listItem()
        .title('Tours & packages')
        .icon(EarthGlobeIcon)
        .child(
          S.list()
            .title('Tours & packages')
            .items([
              // Flat lists (preserved for power users)
              S.listItem()
                .title('All tours')
                .schemaType('tour')
                .child(S.documentTypeList('tour').title('All tours')),
              S.listItem()
                .title('Day tours')
                .schemaType('tour')
                .child(
                  S.documentTypeList('tour')
                    .title('Day tours')
                    .filter('_type == "tour" && type == "dayTour"')
                ),
              S.listItem()
                .title('Packages')
                .schemaType('tour')
                .child(
                  S.documentTypeList('tour')
                    .title('Packages')
                    .filter('_type == "tour" && type == "package"')
                ),

              // ── Category landing pages (the four hub docs) — the editorial
              //    shell for /private-day-tours, /egypt-travel-packages, etc.
              //    This is where editorByline + editor's picks are curated.
              //    Previously unreachable from the desk. ──
              S.listItem()
                .title('Category landing pages (hubs)')
                .icon(MasterDetailIcon)
                .child(
                  S.documentTypeList('tourCategory')
                    .title('Category landing pages')
                    .child((docId) =>
                      S.document().documentId(docId).schemaType('tourCategory')
                    )
                ),

              S.divider(),

              // ── Day tours: facets ──
              S.listItem()
                .title('Day tours by city')
                .icon(FilterIcon)
                .child(
                  byCityChild(S, context, {
                    schemaType: 'tour',
                    cityRefField: 'cities',
                    isArray: true,
                    extraFilter: 'type == "dayTour"',
                    perCityTitlePrefix: 'Day tours',
                  })
                ),
              S.listItem()
                .title('Day tours by theme')
                .icon(FilterIcon)
                .child(
                  byRefChild(S, context, {
                    schemaType: 'tour',
                    refField: 'theme',
                    refTarget: 'theme',
                    extraFilter: 'type == "dayTour"',
                    perBucketTitlePrefix: 'Day tours',
                  })
                ),
              S.listItem()
                .title('Day tours by mode')
                .icon(FilterIcon)
                .child(
                  byEnumChild(S, {
                    schemaType: 'tour',
                    field: 'tourMode',
                    values: TOUR_MODE_VALUES,
                    extraFilter: 'type == "dayTour"',
                    perBucketTitlePrefix: 'Day tours',
                  })
                ),

              S.divider(),

              // ── Subcategory landing pages (tourLanding) — the city × track
              //    and theme/origin landings rendered by SubcategoryTemplate.
              //    Previously unreachable from the desk. ──
              S.listItem()
                .title('Subcategory landings')
                .icon(MasterDetailIcon)
                .child(
                  S.list()
                    .title('Subcategory landings')
                    .items([
                      S.listItem()
                        .title('All landing pages')
                        .schemaType('tourLanding')
                        .child(S.documentTypeList('tourLanding').title('All landing pages')),
                      S.divider(),
                      S.listItem()
                        .title('By track')
                        .icon(FilterIcon)
                        .child(
                          byRefChild(S, context, {
                            schemaType: 'tourLanding',
                            refField: 'category',
                            refTarget: 'tourCategory',
                            refDisplayQuery: 'coalesce(title[_key=="en"][0].value, title)',
                            perBucketTitlePrefix: 'Landings',
                          })
                        ),
                    ])
                ),

              // ── Day tours: needing review ──
              S.listItem()
                .title('Day tours — needing review')
                .icon(WarningOutlineIcon)
                .child(
                  S.list()
                    .title('Day tours — needing review')
                    .items([
                      workflowFilterItem(S, {
                        id: 'review-tour-daytour-default-cairo',
                        title: 'Needs city verification (default-cairo)',
                        schemaType: 'tour',
                        filter:
                          'type == "dayTour" && migration.cityResolution == "default-cairo"',
                      }),
                      workflowFilterItem(S, {
                        id: 'review-tour-daytour-missing-body',
                        title: 'Missing body content',
                        schemaType: 'tour',
                        filter: `type == "dayTour" && ${MISSING.bodyEn}`,
                      }),
                      workflowFilterItem(S, {
                        id: 'review-tour-daytour-missing-hero',
                        title: 'Missing hero image',
                        schemaType: 'tour',
                        filter: `type == "dayTour" && ${MISSING.hero}`,
                      }),
                      workflowFilterItem(S, {
                        id: 'review-tour-daytour-missing-summary',
                        title: 'Missing summary',
                        schemaType: 'tour',
                        filter: `type == "dayTour" && ${MISSING.summaryEn}`,
                      }),
                      workflowFilterItem(S, {
                        id: 'review-tour-daytour-missing-duration-hours',
                        title: 'Needs duration hours',
                        schemaType: 'tour',
                        filter: 'type == "dayTour" && !defined(durationHours)',
                      }),
                      workflowFilterItem(S, {
                        id: 'review-tour-daytour-missing-slug-es',
                        title: 'Missing Spanish slug',
                        schemaType: 'tour',
                        filter: 'type == "dayTour" && !defined(slug[_key=="es"][0].value.current)',
                      }),
                      workflowFilterItem(S, {
                        id: 'review-tour-daytour-missing-slug-ja',
                        title: 'Missing Japanese slug',
                        schemaType: 'tour',
                        filter: 'type == "dayTour" && !defined(slug[_key=="ja"][0].value.current)',
                      }),
                    ])
                ),

              S.divider(),

              // ── Packages: facets ──
              S.listItem()
                .title('Packages by city')
                .icon(FilterIcon)
                .child(
                  byCityChild(S, context, {
                    schemaType: 'tour',
                    cityRefField: 'cities',
                    isArray: true,
                    extraFilter: 'type == "package"',
                    perCityTitlePrefix: 'Packages',
                  })
                ),
              S.listItem()
                .title('Packages by theme')
                .icon(FilterIcon)
                .child(
                  byRefChild(S, context, {
                    schemaType: 'tour',
                    refField: 'theme',
                    refTarget: 'theme',
                    extraFilter: 'type == "package"',
                    perBucketTitlePrefix: 'Packages',
                  })
                ),
              S.listItem()
                .title('Packages by mode')
                .icon(FilterIcon)
                .child(
                  byEnumChild(S, {
                    schemaType: 'tour',
                    field: 'tourMode',
                    values: TOUR_MODE_VALUES,
                    extraFilter: 'type == "package"',
                    perBucketTitlePrefix: 'Packages',
                  })
                ),

              // ── Packages: needing review ──
              S.listItem()
                .title('Packages — needing review')
                .icon(WarningOutlineIcon)
                .child(
                  S.list()
                    .title('Packages — needing review')
                    .items([
                      workflowFilterItem(S, {
                        id: 'review-tour-package-default-cairo',
                        title: 'Needs city verification (default-cairo)',
                        schemaType: 'tour',
                        filter:
                          'type == "package" && migration.cityResolution == "default-cairo"',
                      }),
                      workflowFilterItem(S, {
                        id: 'review-tour-package-missing-body',
                        title: 'Missing body content',
                        schemaType: 'tour',
                        filter: `type == "package" && ${MISSING.bodyEn}`,
                      }),
                      workflowFilterItem(S, {
                        id: 'review-tour-package-missing-hero',
                        title: 'Missing hero image',
                        schemaType: 'tour',
                        filter: `type == "package" && ${MISSING.hero}`,
                      }),
                      workflowFilterItem(S, {
                        id: 'review-tour-package-missing-summary',
                        title: 'Missing summary',
                        schemaType: 'tour',
                        filter: `type == "package" && ${MISSING.summaryEn}`,
                      }),
                      workflowFilterItem(S, {
                        id: 'review-tour-package-missing-slug-es',
                        title: 'Missing Spanish slug',
                        schemaType: 'tour',
                        filter: 'type == "package" && !defined(slug[_key=="es"][0].value.current)',
                      }),
                      workflowFilterItem(S, {
                        id: 'review-tour-package-missing-slug-ja',
                        title: 'Missing Japanese slug',
                        schemaType: 'tour',
                        filter: 'type == "package" && !defined(slug[_key=="ja"][0].value.current)',
                      }),
                    ])
                ),

              S.divider(),
              S.documentTypeListItem('theme').title('Package themes'),
            ])
        ),

      // ── Travel guide & cities ──
      S.listItem()
        .title('Travel guide')
        .icon(EarthGlobeIcon)
        .child(
          S.list()
            .title('Travel guide')
            .items([
              S.documentTypeListItem('city').title('Cities'),
              S.documentTypeListItem('guideArticle').title('All guide articles'),
              S.divider(),
              S.listItem()
                .title('Guide articles by city')
                .icon(FilterIcon)
                .child(
                  byCityChild(S, context, {
                    schemaType: 'guideArticle',
                    cityRefField: 'parentCity',
                    isArray: false,
                    perCityTitlePrefix: 'Guide articles',
                  })
                ),
              S.listItem()
                .title('Guide articles by section')
                .icon(FilterIcon)
                .child(
                  byEnumChild(S, {
                    schemaType: 'guideArticle',
                    field: 'section',
                    values: GUIDE_SECTION_VALUES,
                    perBucketTitlePrefix: 'Guide articles',
                  })
                ),
              S.listItem()
                .title('Guide articles — needing review')
                .icon(WarningOutlineIcon)
                .child(
                  S.list()
                    .title('Guide articles — needing review')
                    .items([
                      workflowFilterItem(S, {
                        id: 'review-guide-missing-section',
                        title: 'Missing section assignment',
                        schemaType: 'guideArticle',
                        filter: '!defined(section)',
                      }),
                      workflowFilterItem(S, {
                        id: 'review-guide-missing-parent-city',
                        title: 'Missing parent city',
                        schemaType: 'guideArticle',
                        filter: '!defined(parentCity)',
                      }),
                      workflowFilterItem(S, {
                        id: 'review-guide-missing-body',
                        title: 'Missing body content',
                        schemaType: 'guideArticle',
                        filter: MISSING.bodyEn,
                      }),
                      workflowFilterItem(S, {
                        id: 'review-guide-missing-hero',
                        title: 'Missing hero image',
                        schemaType: 'guideArticle',
                        filter: MISSING.hero,
                      }),
                    ])
                ),
            ])
        ),

      // ── Travel tips ──
      S.listItem()
        .title('Travel tips')
        .icon(HelpCircleIcon)
        .child(
          S.list()
            .title('Travel tips')
            .items([
              S.documentTypeListItem('travelTip').title('All tips'),
              S.listItem()
                .title('Tips by category')
                .icon(FilterIcon)
                .child(
                  byRefChild(S, context, {
                    schemaType: 'travelTip',
                    refField: 'category',
                    refTarget: 'travelTipCategory',
                    perBucketTitlePrefix: 'Tips',
                  })
                ),
              S.divider(),
              S.documentTypeListItem('travelTipCategory').title('Categories'),
            ])
        ),

      // ── Wiki ──
      // Surgical defer (session 31): only wikiMonument ships in v1.
      // The other three sub-types — wikiDynasty, wikiPerson, wikiDeity —
      // have 0 docs each and their /wiki/(deities|dynasties|people)
      // routes render Coming Soon. Their schemas are kept registered (for
      // PT internalLink reference targets and forward compatibility), but
      // hidden from Studio nav until v2 editorial fills them.
      // To restore: uncomment the three deferred lines below.
      S.listItem()
        .title('Egypt Wiki')
        .icon(CalendarIcon)
        .child(
          S.list()
            .title('Egypt Wiki')
            .items([
              S.documentTypeListItem('wikiMonument').title('Monuments (Temples, Tombs, Pyramids)'),
              // S.documentTypeListItem('wikiDynasty').title('Dynasties'),
              // S.documentTypeListItem('wikiPerson').title('People (Pharaohs, Queens, etc.)'),
              // S.documentTypeListItem('wikiDeity').title('Deities'),
            ])
        ),

      // ── Hotels & cruises ──
      S.listItem()
        .title('Hotels & cruises')
        .icon(HomeIcon)
        .child(
          S.list()
            .title('Hotels & cruises')
            .items([
              S.documentTypeListItem('hotel').title('All hotels'),
              S.listItem()
                .title('Hotels by city')
                .icon(FilterIcon)
                .child(
                  byCityChild(S, context, {
                    schemaType: 'hotel',
                    cityRefField: 'city',
                    isArray: false,
                    perCityTitlePrefix: 'Hotels',
                  })
                ),
              S.listItem()
                .title('Hotels by category')
                .icon(FilterIcon)
                .child(
                  byEnumChild(S, {
                    schemaType: 'hotel',
                    field: 'category',
                    values: HOTEL_CATEGORY_VALUES,
                    perBucketTitlePrefix: 'Hotels',
                  })
                ),
              S.listItem()
                .title('Hotels — needing review')
                .icon(WarningOutlineIcon)
                .child(
                  S.list()
                    .title('Hotels — needing review')
                    .items([
                      workflowFilterItem(S, {
                        id: 'review-hotel-default-standard',
                        title: 'Needs category review (default-standard)',
                        schemaType: 'hotel',
                        filter: 'migration.categoryResolution == "default-standard"',
                      }),
                      workflowFilterItem(S, {
                        id: 'review-hotel-missing-body',
                        title: 'Missing body content',
                        schemaType: 'hotel',
                        filter: MISSING.bodyEn,
                      }),
                      workflowFilterItem(S, {
                        id: 'review-hotel-missing-hero',
                        title: 'Missing hero image',
                        schemaType: 'hotel',
                        filter: MISSING.hero,
                      }),
                    ])
                ),

              S.divider(),

              S.documentTypeListItem('nileCruise').title('All Nile cruises'),
              S.listItem()
                .title('Nile cruises by type')
                .icon(FilterIcon)
                .child(
                  byEnumChild(S, {
                    schemaType: 'nileCruise',
                    field: 'type',
                    values: CRUISE_TYPE_VALUES,
                    perBucketTitlePrefix: 'Nile cruises',
                  })
                ),
              S.listItem()
                .title('Nile cruises by tier')
                .icon(FilterIcon)
                .child(
                  byEnumChild(S, {
                    schemaType: 'nileCruise',
                    field: 'tier',
                    values: CRUISE_TIER_VALUES,
                    perBucketTitlePrefix: 'Nile cruises',
                  })
                ),
              S.listItem()
                .title('Nile cruises — needing review')
                .icon(WarningOutlineIcon)
                .child(
                  S.list()
                    .title('Nile cruises — needing review')
                    .items([
                      workflowFilterItem(S, {
                        id: 'review-cruise-default-type',
                        title: 'Needs type verification (default-cruise-ship)',
                        schemaType: 'nileCruise',
                        filter: 'migration.typeInference == "default-cruise-ship"',
                      }),
                      workflowFilterItem(S, {
                        id: 'review-cruise-missing-tier',
                        title: 'Needs tier assignment',
                        schemaType: 'nileCruise',
                        filter: '!defined(tier)',
                      }),
                      workflowFilterItem(S, {
                        id: 'review-cruise-missing-body',
                        title: 'Missing body content',
                        schemaType: 'nileCruise',
                        filter: MISSING.bodyEn,
                      }),
                      workflowFilterItem(S, {
                        id: 'review-cruise-missing-hero',
                        title: 'Missing hero image',
                        schemaType: 'nileCruise',
                        filter: MISSING.hero,
                      }),
                      workflowFilterItem(S, {
                        id: 'review-cruise-missing-powered-by',
                        title: 'Needs propulsion type',
                        schemaType: 'nileCruise',
                        filter: '!defined(poweredBy) || count(poweredBy) == 0',
                      }),
                      workflowFilterItem(S, {
                        id: 'review-cruise-missing-departure-city',
                        title: 'Needs departure city',
                        schemaType: 'nileCruise',
                        filter: '!defined(departureCity)',
                      }),
                      workflowFilterItem(S, {
                        id: 'review-cruise-missing-itinerary',
                        title: 'Needs itinerary',
                        schemaType: 'nileCruise',
                        filter: '!defined(itinerary) || count(itinerary) == 0',
                      }),
                    ])
                ),
            ])
        ),

      // ── Trust & traveler stories ──
      S.listItem()
        .title('Reviews & trust')
        .icon(CommentIcon)
        .child(
          S.list()
            .title('Reviews & trust')
            .items([
              S.documentTypeListItem('travelerStory').title('Traveler stories'),
              S.documentTypeListItem('trustBadge').title('Trust badges'),
            ])
        ),

      // ── FAQ ──
      S.listItem()
        .title('FAQ')
        .icon(CommentIcon)
        .child(
          S.list()
            .title('FAQ')
            .items([
              S.documentTypeListItem('faqEntry').title('Entries'),
              S.documentTypeListItem('faqCategory').title('Categories'),
            ])
        ),

      // ── Pages ──
      S.listItem()
        .title('Pages')
        .icon(MasterDetailIcon)
        .child(
          S.list()
            .title('Pages')
            .items([
              S.documentTypeListItem('editorialPage').title('Editorial pages'),
              S.documentTypeListItem('page').title('Generic pages'),
              S.documentTypeListItem('legalPage').title('Legal pages'),
            ])
        ),

      S.divider(),

      // ── Singletons ──
      S.listItem()
        .title('Site settings')
        .icon(CogIcon)
        .child(
          S.editor()
            .id('siteSettings')
            .schemaType('siteSettings')
            .documentId('siteSettings')
        ),
      S.listItem()
        .title('Concierge link map')
        .icon(LinkIcon)
        .child(
          S.editor()
            .id('conciergeLinkMap')
            .schemaType('conciergeLinkMap')
            .documentId('conciergeLinkMap')
        ),
    ]);
