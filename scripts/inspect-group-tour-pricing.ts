/**
 * Read-only inspection: do group day tours have peak pricing variation?
 *
 * Investigation for the structured-data implementation pass — needed
 * to decide whether group day tours emit Offer or AggregateOffer.
 *
 * Logic:
 *  - Pull every tour where type='dayTour' AND tourMode='group'
 *  - Report basePrice, peakUpliftPct, departures[].isPeak distribution
 *  - Conclude: uniform price (→ Offer) or variable (→ AggregateOffer)
 *
 * Same investigation for group packages, for completeness.
 */

import 'dotenv/config';
import { createClient } from '@sanity/client';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production';
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !token) {
  console.error('Missing Sanity env vars (project id or write token)');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-12-01',
  token,
  useCdn: false,
});

interface TourRow {
  _id: string;
  title?: Array<{ _key: string; value?: string }>;
  type?: string;
  tourMode?: string;
  basePrice?: number;
  peakUpliftPct?: number;
  maxGroup?: number;
  departuresCount?: number;
  peakDepartures?: number;
}

async function main() {
  const groqQuery = /* groq */ `
    *[_type == "tour" && tourMode == "group" && !(_id in path("drafts.**"))]{
      _id,
      title,
      type,
      tourMode,
      basePrice,
      peakUpliftPct,
      maxGroup,
      "departuresCount": count(departures[]),
      "peakDepartures": count(departures[isPeak == true])
    } | order(type asc, title[0].value asc)
  `;

  const rows = await client.fetch<TourRow[]>(groqQuery);

  console.log(`\nDataset: ${dataset}`);
  console.log(`Total group tours (published): ${rows.length}\n`);

  const byType: Record<string, TourRow[]> = {};
  for (const r of rows) {
    const k = r.type ?? 'unknown';
    (byType[k] ??= []).push(r);
  }

  for (const [type, items] of Object.entries(byType)) {
    console.log(`── ${type} (${items.length}) ─────────────────────────────`);
    let withBase = 0;
    let withPeakUplift = 0;
    let withPeakDepartures = 0;
    for (const r of items) {
      const enTitle = r.title?.find((t) => t._key === 'en')?.value ?? '(no en title)';
      const bp = r.basePrice != null ? `€${r.basePrice}` : '—';
      const pu = r.peakUpliftPct != null ? `+${r.peakUpliftPct}%` : '—';
      const mg = r.maxGroup ?? '—';
      const dep = r.departuresCount ?? 0;
      const peak = r.peakDepartures ?? 0;
      console.log(
        `  ${enTitle.padEnd(50).slice(0, 50)}  basePrice=${bp.padEnd(8)} peakUplift=${pu.padEnd(6)} maxGroup=${String(mg).padEnd(4)} departures=${dep} (peak=${peak})`
      );
      if (r.basePrice != null) withBase++;
      if (r.peakUpliftPct != null && r.peakUpliftPct !== 0) withPeakUplift++;
      if ((r.peakDepartures ?? 0) > 0) withPeakDepartures++;
    }
    console.log(
      `\n  Summary [${type}]: ${withBase}/${items.length} have basePrice, ` +
        `${withPeakUplift}/${items.length} have peakUpliftPct, ` +
        `${withPeakDepartures}/${items.length} have peak departures flagged.\n`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
