import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { internationalizedArray } from 'sanity-plugin-internationalized-array';
import { documentInternationalization } from '@sanity/document-internationalization';

import { apiVersion, projectId } from './src/sanity/env';
import { schemaTypes } from './src/sanity/schemas';
import { structure } from './src/sanity/structure';
import { SUPPORTED_LANGUAGES } from './src/sanity/lib/languages';

/**
 * Sanity Studio configuration.
 *
 * Two i18n strategies coexist here:
 *
 *  1. Field-level i18n via the `internationalized-array` plugin.
 *     Used for everything except articles. Each field that needs
 *     translation has its own array of {_key: locale, value: ...}.
 *
 *  2. Document-level i18n via the `document-internationalization` plugin.
 *     Used only for the `article` type — each language gets its own
 *     document, linked together via the plugin's reference field. This
 *     suits content that genuinely diverges across locales.
 *
 *  Both plugins read the same SUPPORTED_LANGUAGES array, so adding a new
 *  locale (e.g. reintroducing Finnish later) is a one-line change.
 */
const sharedPlugins = [
  structureTool({ structure }),
  visionTool({ defaultApiVersion: apiVersion }),

  // Field-level i18n (everything except articles)
  internationalizedArray({
    languages: SUPPORTED_LANGUAGES.map((l) => ({ id: l.id, title: l.title })),
    defaultLanguages: ['en'],
    fieldTypes: ['string', 'text'],
  }),

  // Document-level i18n (articles + food articles)
  documentInternationalization({
    supportedLanguages: SUPPORTED_LANGUAGES.map((l) => ({ id: l.id, title: l.title })),
    schemaTypes: ['article', 'foodArticle'],
  }),
];

const sharedSchema = { types: schemaTypes };

export default defineConfig([
  {
    name: 'production',
    title: 'Travel2Egypt — Production',
    projectId,
    dataset: 'production',
    basePath: '/studio/production',
    plugins: sharedPlugins,
    schema: sharedSchema,
  },
  {
    name: 'staging',
    title: 'Travel2Egypt — Migration Staging',
    projectId,
    dataset: 'migration-staging',
    basePath: '/studio/staging',
    plugins: sharedPlugins,
    schema: sharedSchema,
  },
]);
