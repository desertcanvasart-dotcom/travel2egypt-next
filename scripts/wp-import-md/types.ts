/**
 * Types for the MD-content import tool (Phase 3c — s56).
 */

import type { PtBlock } from '../wp-import-html.js';

export const LOCALES = ['en', 'es', 'ja'] as const;
export type Locale = (typeof LOCALES)[number];

export const KINDS = [
  'signature',
  'attraction',
  'transport-to',
  'transport-around',
  'accommodation',
  'food',
  'tours',
  'events',
  'climate',
  'heritage',
  'overview',
] as const;
export type Kind = (typeof KINDS)[number];

export const SECTIONS = [
  'introducing',
  'plan-your-trip',
  'while-you-are-there',
  'places-to-go',
  'others',
] as const;
export type Section = (typeof SECTIONS)[number];

/** Front-matter fields after parsing + validation. */
export interface FmFields {
  slug: string;
  city: string;
  kind: Kind;
  locale: Locale;
  title: string;
  description: string;
  heroImage?: string;
  excerpt?: string;
  keywords?: string[];
  lastUpdated?: string;
}

/** Validation error — file path + line is best-effort, message is required. */
export interface ValidationError {
  file: string;
  line?: number;
  field?: string;
  message: string;
}

/** A parsed source file in one locale. */
export interface ParsedFile {
  filePath: string;
  fm: FmFields;
  body: string;
}

/** One slug × city, grouped across locales. */
export interface LocaleTriplet {
  city: string;
  slug: string;
  files: Partial<Record<Locale, ParsedFile>>;
}

/** Per-file result of the import step. */
export type ImportStatus = 'created' | 'updated' | 'noop' | 'skipped' | 'failed';

export interface ImportResult {
  filePath: string;
  city: string;
  slug: string;
  locales: Locale[];
  status: ImportStatus;
  reason?: string;
  warnings: string[];
}

/** Image-upload metadata returned by the uploader. */
export interface UploadedImage {
  assetId: string;
  filename: string;
  sourcePath: string;
}

/** PT body, per-locale, ready for the writer. */
export interface I18nPtBody {
  _key: Locale;
  _type: 'object';
  value: PtBlock[];
}
