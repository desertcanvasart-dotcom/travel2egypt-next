/**
 * Enumerate every Sanity image asset under 3000px wide that is
 * referenced by at least one published document, and write a CSV
 * worklist to images-under-3000px.csv.
 *
 *   pnpm tsx scripts/audit-images-under-3000px.ts
 */

import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { createClient } from '@sanity/client';

loadEnv({ path: path.resolve(process.cwd(), '.env') });

const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ufallvd2';

const TOKEN =
  process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ||
  process.env.SANITY_API_WRITE_TOKEN ||
  process.env.NEXT_PUBLIC_SANITY_API_READ_TOKEN ||
  '';

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: '2024-12-01',
  token: TOKEN || undefined,
  useCdn: false,
});

type Row = {
  _id: string;
  originalFilename: string | null;
  width: number;
  height: number;
  url: string;
  size: number | null;
  mimeType: string | null;
  refCount: number;
  sampleReferrers: Array<{ _type: string; _id: string; title: string | null }>;
};

const QUERY = `
  *[_type == "sanity.imageAsset"
    && metadata.dimensions.width < 3000
    && count(*[!(_id in path("drafts.**")) && _type != "sanity.imageAsset" && references(^._id)]) > 0
  ] | order(metadata.dimensions.width asc) {
    _id,
    originalFilename,
    "width": metadata.dimensions.width,
    "height": metadata.dimensions.height,
    url,
    size,
    mimeType,
    "refCount": count(*[!(_id in path("drafts.**")) && _type != "sanity.imageAsset" && references(^._id)]),
    "sampleReferrers": *[!(_id in path("drafts.**")) && _type != "sanity.imageAsset" && references(^._id)][0...3]{
      _type, _id,
      "title": coalesce(
        title[_key=="en"][0].value,
        title,
        name[_key=="en"][0].value,
        name,
        slug[_key=="en"][0].value.current,
        slug.current,
        ""
      )
    }
  }
`;

function csvEscape(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function run() {
  if (!TOKEN) {
    console.error('No Sanity token in env. Set SANITY_PRODUCTION_API_WRITE_TOKEN or SANITY_API_WRITE_TOKEN.');
    process.exit(1);
  }
  console.log(`\n— Image audit (< 3000px wide, referenced) —`);
  console.log(`  dataset:  ${DATASET}`);
  console.log(`  fetching…`);

  const rows: Row[] = await client.fetch(QUERY);
  console.log(`  rows:     ${rows.length}`);

  const HEADER = [
    'width',
    'height',
    'filename',
    'asset_id',
    'mime',
    'size_bytes',
    'ref_count',
    'sample_refs',
    'url',
  ];

  const out = [HEADER.join(',')];
  for (const r of rows) {
    const sample = (r.sampleReferrers ?? [])
      .map((ref) => `${ref._type}:${ref.title || ref._id}`)
      .join(' | ');
    out.push(
      [
        r.width,
        r.height,
        csvEscape(r.originalFilename),
        r._id,
        csvEscape(r.mimeType),
        r.size,
        r.refCount,
        csvEscape(sample),
        csvEscape(r.url),
      ].join(','),
    );
  }

  const filePath = path.resolve(process.cwd(), 'images-under-3000px.csv');
  fs.writeFileSync(filePath, out.join('\n') + '\n');
  console.log(`  ✓ wrote ${filePath}`);

  // Quick distribution summary so the user can eyeball severity
  const buckets = { '<1000': 0, '1000-1499': 0, '1500-1999': 0, '2000-2499': 0, '2500-2999': 0 };
  for (const r of rows) {
    if (r.width < 1000) buckets['<1000']++;
    else if (r.width < 1500) buckets['1000-1499']++;
    else if (r.width < 2000) buckets['1500-1999']++;
    else if (r.width < 2500) buckets['2000-2499']++;
    else buckets['2500-2999']++;
  }
  console.log(`\n  Width distribution:`);
  for (const [k, v] of Object.entries(buckets)) console.log(`    ${k.padEnd(10)} ${v}`);

  // Top doctypes referencing these images
  const typeCount = new Map<string, number>();
  for (const r of rows) {
    for (const ref of r.sampleReferrers ?? []) {
      typeCount.set(ref._type, (typeCount.get(ref._type) ?? 0) + 1);
    }
  }
  const topTypes = [...typeCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  console.log(`\n  Top referring doc types:`);
  for (const [t, c] of topTypes) console.log(`    ${t.padEnd(28)} ${c}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
