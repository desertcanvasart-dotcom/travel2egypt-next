import type { StructureBuilder, StructureResolver } from 'sanity/structure';
import {
  EarthGlobeIcon,
  ComposeIcon,
  HelpCircleIcon,
  CalendarIcon,
  HomeIcon,
  CogIcon,
  CommentIcon,
  StarIcon,
  LinkIcon,
  TagIcon,
  DocumentIcon,
  MasterDetailIcon,
  UserIcon,
} from '@sanity/icons';

/**
 * Custom Studio structure. Replaces the default "list every type
 * alphabetically" desk with a more navigable hierarchy. Singletons
 * (siteSettings, conciergeLinkMap) appear as single items rather than
 * lists you can add documents to.
 */
export const structure: StructureResolver = (S: StructureBuilder) =>
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

      // ── Tours ──
      S.listItem()
        .title('Tours & packages')
        .icon(EarthGlobeIcon)
        .child(
          S.list()
            .title('Tours & packages')
            .items([
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
              S.documentTypeListItem('guideArticle').title('Guide sub-articles'),
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
              S.documentTypeListItem('travelTip').title('Tips'),
              S.documentTypeListItem('travelTipCategory').title('Categories'),
            ])
        ),

      // ── Wiki ──
      S.listItem()
        .title('Egypt Wiki')
        .icon(CalendarIcon)
        .child(
          S.list()
            .title('Egypt Wiki')
            .items([
              S.documentTypeListItem('wikiDynasty').title('Dynasties'),
              S.documentTypeListItem('wikiPerson').title('People (Pharaohs, Queens, etc.)'),
              S.documentTypeListItem('wikiMonument').title('Monuments (Temples, Tombs, Pyramids)'),
              S.documentTypeListItem('wikiDeity').title('Deities'),
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
              S.documentTypeListItem('hotel').title('Hotels'),
              S.documentTypeListItem('nileCruise').title('Nile cruises'),
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
              S.documentTypeListItem('page').title('Editorial pages'),
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
