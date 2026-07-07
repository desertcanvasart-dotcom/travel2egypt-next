import type { PricePage } from '@/data/prices';

/**
 * PriceManifest — the attraction ticket table on the price-page series.
 *
 * Replaces the flattened WP-migration bullet lists (rendered elsewhere via
 * splitPriceRegion) with the designed table per the approved mock
 * (price-manifest-mock): serif site names, tabular numerals, hours in the UI
 * face, governorate kickers, a verification stamp, and the two fixed
 * footnote paragraphs. Server-rendered, no client JS, no sorting/filtering/
 * currency machinery — by design.
 *
 * COPY: the title, stamp pattern, and footnote paragraphs are OWNER-LOCKED
 * strings from the mock — do not edit. Per-row notes are owner-authored in
 * the data map. The `checked` date is owner-supplied with the verified data.
 *
 * DATA: prices/names are owner-verified; hours are legacy-sourced and
 * unverified (owner's explicit call) — rows without hours render an em dash.
 */

interface Props {
  page: PricePage;
}

export default function PriceManifest({ page }: Props) {
  return (
    <div className="price-manifest">
      <div className="price-manifest__head">
        <div className="price-manifest__title">Tickets &amp; opening hours</div>
        <div className="price-manifest__checked">
          Checked <b>{page.checked}</b>
        </div>
      </div>

      {page.sections.map((section) => (
        <div key={section.kicker}>
          <div className="price-manifest__gov">{section.kicker}</div>
          <table>
            <thead>
              <tr>
                <th>Site</th>
                <th>Adult</th>
                <th>Student</th>
                <th>Hours</th>
              </tr>
            </thead>
            <tbody>
              {section.rows.map((row) => (
                <tr key={row.site}>
                  <td className="site">
                    {row.site}
                    {row.note && <span className="note">{row.note}</span>}
                  </td>
                  <td className="num" data-label="Adult">
                    <span className="cur">EGP</span>
                    {row.adult}
                  </td>
                  <td className="num student" data-label="Student">
                    <span className="cur">EGP</span>
                    {row.student}
                  </td>
                  <td className="hours">{row.hours ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div className="price-manifest__foot">
        <p>
          Egypt revises its antiquities fees often, usually ahead of the
          winter season — treat these as accurate at the date above, and
          expect the direction of change to be upward. Student prices need an
          ISIC card, and &quot;hours&quot; means the gate: last entry is
          generally 45 minutes before it.
        </p>
        <p>
          On our private tours, this table is our problem rather than yours —
          tickets are arranged and included as listed on each itinerary.
        </p>
      </div>
    </div>
  );
}
