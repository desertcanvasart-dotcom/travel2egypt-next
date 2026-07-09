import type { PricePage } from '@/data/prices';

/**
 * PriceManifest — the attraction ticket table on the price-page series.
 *
 * Replaces the flattened WP-migration bullet lists (rendered elsewhere via
 * splitPriceRegion) with the designed table per the authoritative v2 mock
 * (price-manifest-mock-v2-integrated — surfaceless, ruled; supersedes v1's
 * card treatment): no surface, no border, no component title. A 2px navy
 * rule with the right-aligned CHECKED stamp opens the manifest; governorate
 * kickers, serif site names, tabular numerals, hours in the UI face; a
 * second 2px rule closes it above the two footnote paragraphs. The page's
 * existing section headings do the introducing. Server-rendered, no client
 * JS, no sorting/filtering/currency machinery — by design.
 *
 * COPY: the EN stamp pattern and footnote paragraphs are OWNER-LOCKED
 * strings from the mock — never redraft those. `es`/`ja` chrome below are
 * CLAUDE-DRAFTED MACHINE TRANSLATIONS (staged 2026-07-09,
 * docs/price-manifest-esja-draft-translations.json), same
 * draft-then-review pattern as the climate signature (see
 * src/data/climate/index.ts) — needs a native-speaker pass before treating
 * as final. Per-row notes and governorate kickers are separate, still-EN,
 * owner-authored data in src/data/prices/index.ts (out of scope here).
 *
 * DATA: prices/names are owner-verified; hours are legacy-sourced and
 * unverified (owner's explicit call) — rows without hours render an em dash.
 */

type ChromeLocale = 'en' | 'es' | 'ja';

interface Chrome {
  stampLabel: string;
  headerSite: string;
  headerAdult: string;
  headerStudent: string;
  headerHours: string;
  footnote1: string;
  footnote2: string;
}

const CHROME: Record<ChromeLocale, Chrome> = {
  en: {
    stampLabel: 'Checked',
    headerSite: 'Site',
    headerAdult: 'Adult',
    headerStudent: 'Student',
    headerHours: 'Hours',
    footnote1:
      'Egypt revises its antiquities fees often, usually ahead of the winter season — treat these as accurate at the date above, and expect the direction of change to be upward. Student prices need an ISIC card, and "hours" means the gate: last entry is generally 45 minutes before it.',
    footnote2:
      'On our private tours, this table is our problem rather than yours — tickets are arranged and included as listed on each itinerary.',
  },
  es: {
    stampLabel: 'Verificado',
    headerSite: 'Lugar',
    headerAdult: 'Adulto',
    headerStudent: 'Estudiante',
    headerHours: 'Horario',
    footnote1:
      'Egipto revisa con frecuencia las tarifas de sus sitios arqueológicos, normalmente antes de la temporada de invierno — considera estos precios exactos en la fecha indicada arriba, y espera que cualquier cambio sea al alza. Los precios de estudiante requieren un carné ISIC, y «horario» se refiere a la puerta: la última entrada suele ser 45 minutos antes del cierre.',
    footnote2:
      'En nuestros tours privados, esta tabla es cosa nuestra y no tuya — las entradas se gestionan y se incluyen tal como se indica en cada itinerario.',
  },
  ja: {
    stampLabel: '確認日',
    headerSite: '場所',
    headerAdult: '大人',
    headerStudent: '学生',
    headerHours: '営業時間',
    footnote1:
      'エジプトでは古代遺跡の入場料がしばしば改定されます。通常は冬のシーズンを前にした時期です——これらの価格は上記の日付時点で正確なものとしてお考えください。また、値上げの方向で変わることが多い点にもご留意ください。学生料金にはISICカード(国際学生証)が必要です。また「営業時間」はゲートの時間を指し、通常は閉門の45分前が最終入場となります。',
    footnote2:
      '当社のプライベートツアーでは、この表の内容はお客様ではなく私たちが対応するものです——チケットの手配は各旅程に記載の通り、すべて含まれています。',
  },
};

// The single `checked` date currently shared by every price page (per
// docs/localized-copy-templates-README-2026-07-08.md); falls back to the
// raw EN string for any future date this map hasn't been extended for.
const CHECKED_DATE: Record<string, Partial<Record<'es' | 'ja', string>>> = {
  'July 2026': { es: 'julio de 2026', ja: '2026年7月' },
};

interface Props {
  page: PricePage;
  locale: string;
}

export default function PriceManifest({ page, locale }: Props) {
  const chromeLocale: ChromeLocale =
    locale === 'es' || locale === 'ja' ? locale : 'en';
  const t = CHROME[chromeLocale];
  const checked =
    CHECKED_DATE[page.checked]?.[chromeLocale as 'es' | 'ja'] ?? page.checked;

  return (
    <div className="price-manifest">
      <div className="price-manifest__top">
        <div className="price-manifest__checked">
          {t.stampLabel} <b>{checked}</b>
        </div>
      </div>

      {page.sections.map((section) => (
        <div key={section.kicker}>
          <div className="price-manifest__gov">{section.kicker}</div>
          <table>
            <thead>
              <tr>
                <th>{t.headerSite}</th>
                <th>{t.headerAdult}</th>
                <th>{t.headerStudent}</th>
                <th>{t.headerHours}</th>
              </tr>
            </thead>
            <tbody>
              {section.rows.map((row) => (
                <tr key={row.site}>
                  <td className="site">
                    {row.site}
                    {row.note && <span className="note">{row.note}</span>}
                  </td>
                  <td className="num" data-label={t.headerAdult}>
                    <span className="cur">EGP</span>
                    {row.adult}
                  </td>
                  <td className="num student" data-label={t.headerStudent}>
                    <span className="cur">EGP</span>
                    {row.student}
                  </td>
                  <td className="hours">
                    {row.hours ?? <span className="dash">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div className="price-manifest__bottom">
        <p>{t.footnote1}</p>
        <p>{t.footnote2}</p>
      </div>
    </div>
  );
}
