import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { buildStaticMetadata } from '@/lib/seo';
import { FieldGuideShell, FieldMasthead } from '@/components/resources';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'resources.arabic' });
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/resources/arabic-lightly',
    title: t('metaTitle'),
    description: t('metaDescription'),
  });
}

/**
 * Each phrase row carries the Arabic script (RTL), the romanized
 * pronunciation (scholarly transliteration with macrons), the English
 * meaning, and an optional sub-note for cultural shading.
 *
 * Data is kept in TypeScript constants — not i18n — because:
 *   - The Arabic script and the romanized form are language-independent.
 *   - English meanings ship as v1 per the spec ("DO NOT add ES/JA
 *     translations of meanings yet"); when ES/JA land they'll likely
 *     move into Sanity as part of the deferred fieldGuide schema.
 */
type Phrase = {
  arabic: string;
  romanized: string;
  meaning: string;
  note?: string;
};

type Section = {
  id: string;
  /** Operator note rendered as a sidebar; omitted = no note for this section. */
  hasOperatorNote: boolean;
  phrases: Phrase[];
};

const SECTIONS: Section[] = [
  {
    id: 'greetings',
    hasOperatorNote: true,
    phrases: [
      {
        arabic: 'السلام عليكم',
        romanized: 'As-salāmu ʿalaykum',
        meaning: 'peace be upon you',
        note: 'The standard reply: Wa ʿalaykum as-salām — "and upon you peace."',
      },
      {
        arabic: 'مرحباً',
        romanized: 'Marḥaban',
        meaning: 'hello',
        note: 'Casual register; safe with anyone.',
      },
      {
        arabic: 'صباح الخير',
        romanized: 'Ṣabāḥ al-khayr',
        meaning: 'good morning',
        note: 'Reply: Ṣabāḥ an-nūr — "morning of light." Used until noon.',
      },
      {
        arabic: 'مساء الخير',
        romanized: 'Masāʾ al-khayr',
        meaning: 'good evening',
        note: 'Reply: Masāʾ an-nūr — "evening of light." Afternoon onward.',
      },
      {
        arabic: 'إزيك / إزيِك',
        romanized: 'Izzayyak / Izzayyik',
        meaning: 'how are you (m / f)',
        note: 'Egyptian dialect — you won\'t hear the textbook Kayfa ḥāluk? much in Cairo.',
      },
      {
        arabic: 'كويس، الحمد لله',
        romanized: 'Kwayyis, ḥamdulillāh',
        meaning: 'good, thanks be to god',
        note: 'The reply to "how are you," regardless of how you actually feel.',
      },
    ],
  },
  {
    id: 'market',
    hasOperatorNote: true,
    phrases: [
      { arabic: 'بكام؟ / بكام ده؟', romanized: 'Bikām? / Bikām dah?', meaning: 'how much? / how much is this?' },
      { arabic: 'خالص! / مش كويس السعر', romanized: 'Khāliṣ! / Mish kwayyis as-siʿr', meaning: 'too much! / not a good price' },
      { arabic: 'ممكن أقل؟', romanized: 'Mumkin aqall?', meaning: 'can it be less?' },
      { arabic: 'مش لازم', romanized: 'Mish lāzim', meaning: 'not necessary / I don\'t need it' },
      {
        arabic: 'لا شكراً',
        romanized: 'Lā shukran',
        meaning: 'no thank you',
        note: 'The polite refusal — works for vendors, food offers, anyone.',
      },
      {
        arabic: 'خلاص',
        romanized: 'Khalāṣ',
        meaning: 'done / enough',
        note: 'Closes a bargaining round; signals you\'ve decided.',
      },
    ],
  },
  {
    id: 'restaurant',
    hasOperatorNote: true,
    phrases: [
      {
        arabic: 'لذيذ / لذيذ جداً',
        romanized: 'Lazīz / Lazīz giddan',
        meaning: 'delicious / very delicious',
        note: 'The right thing to say after the first bite. Vendors light up.',
      },
      {
        arabic: 'بدون',
        romanized: 'Bidūn',
        meaning: 'without',
        note: 'E.g. bidūn shaṭṭa — without chili.',
      },
      {
        arabic: 'حار / شطة',
        romanized: 'Ḥārr / Shaṭṭa',
        meaning: 'hot / spicy',
        note: 'Ḥārr is temperature-hot; shaṭṭa is specifically chili-hot.',
      },
      {
        arabic: 'معلش',
        romanized: 'Maʾalaysh',
        meaning: 'no worries / it\'s nothing / sorry',
        note: 'See note below — this word does the most work in Egypt.',
      },
      { arabic: 'الحساب، من فضلك', romanized: 'Al-ḥisāb, min faḍlak', meaning: 'the bill, please' },
      {
        arabic: 'تمام',
        romanized: 'Tamām',
        meaning: 'perfect / fine',
        note: 'Affirmation for anything; also "I\'m good."',
      },
    ],
  },
  {
    id: 'driver',
    hasOperatorNote: false,
    phrases: [
      {
        arabic: 'يلا',
        romanized: 'Yallā',
        meaning: 'let\'s go',
        note: 'Universal; used to start anything from a walk to a meal.',
      },
      { arabic: 'من هنا', romanized: 'Min hina', meaning: 'this way' },
      { arabic: 'ممكن نوقف؟', romanized: 'Mumkin nuqaf?', meaning: 'can we stop?' },
      { arabic: 'شكراً', romanized: 'Shukran', meaning: 'thank you' },
      { arabic: 'شكراً جداً', romanized: 'Shukran giddan', meaning: 'thank you very much' },
      {
        arabic: 'لا شكراً',
        romanized: 'Lā shukran',
        meaning: 'no thank you',
        note: 'For refusing food, drinks, gifts. Will be offered again — refusing twice is normal.',
      },
    ],
  },
  {
    id: 'cultural',
    hasOperatorNote: true,
    phrases: [
      {
        arabic: 'إن شاء الله',
        romanized: 'In shāʾ Allāh',
        meaning: 'god willing',
        note: 'Used by Muslims AND Christians. Cultural, not religious — softer than "hopefully."',
      },
      {
        arabic: 'الحمد لله',
        romanized: 'Ḥamdulillāh',
        meaning: 'thanks be to god',
        note: 'After good news, after eating, after recovery from illness. Constant.',
      },
      {
        arabic: 'ما شاء الله',
        romanized: 'Mā shāʾ Allāh',
        meaning: 'what god has willed',
        note: 'Said when complimenting — particularly children — to ward off the evil eye.',
      },
      { arabic: 'مبروك', romanized: 'Mabrūk', meaning: 'congratulations' },
      {
        arabic: 'الله كريم',
        romanized: 'Allāh kareem',
        meaning: 'god is generous',
        note: 'Said when accepting that something isn\'t possible. Equivalent to "fingers crossed."',
      },
    ],
  },
  {
    id: 'yesNo',
    hasOperatorNote: false,
    phrases: [
      {
        arabic: 'أيوه / نعم',
        romanized: 'Aywa / Naʿam',
        meaning: 'yes / yes',
        note: 'Aywa is everyday casual; Naʿam is formal or respectful (especially to elders).',
      },
      { arabic: 'لا', romanized: 'Lā', meaning: 'no' },
      { arabic: 'ممكن؟', romanized: 'Mumkin?', meaning: 'may I? / is it possible?' },
      { arabic: 'معلش، مش دلوقتي', romanized: 'Maʿalish, mush dilwaʾti', meaning: 'sorry, not now' },
      { arabic: 'من فضلك / من فضلِك', romanized: 'Min faḍlak / Min faḍlik', meaning: 'please (m / f)' },
      { arabic: 'لا مش ممكن', romanized: 'Lā mush mumkin', meaning: 'no, that\'s not possible' },
    ],
  },
];

export default async function ArabicLightlyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('resources.arabic');

  return (
    <FieldGuideShell>
      <FieldMasthead
        number={t('kicker')}
        region={t('region')}
        tagSummary={t('tagSummary')}
        title={
          <>
            {t('titlePrefix')} <em>{t('titleAccent')}</em>
          </>
        }
        standfirst={
          <>
            {t('standfirstLead')} <em>{t('standfirstAccent')}</em>
          </>
        }
      />

      <section className="afa-intro">
        <p>{t('intro1')}</p>
        <p>{t('intro2')}</p>
      </section>

      {SECTIONS.map((section) => (
        <section key={section.id} className="afa-section" aria-labelledby={`afa-${section.id}`}>
          <h2 id={`afa-${section.id}`} className="afa-section__label">
            {t(`sections.${section.id}.title`)}
          </h2>
          <ol className="afa-phrases">
            {section.phrases.map((p, i) => (
              <li key={i} className="afa-phrase">
                <span className="afa-arabic" lang="ar" dir="rtl">
                  {p.arabic}
                </span>
                <span className="afa-romanized">{p.romanized}</span>
                <span className="afa-meaning">{p.meaning}</span>
                {p.note ? <span className="afa-phrase__note">{p.note}</span> : null}
              </li>
            ))}
          </ol>
          {section.hasOperatorNote ? (
            <aside className="afa-operator-note">
              {t(`sections.${section.id}.operatorNote`)}
            </aside>
          ) : null}
        </section>
      ))}

      <section className="afa-warning" aria-labelledby="afa-warning-label">
        <h2 id="afa-warning-label" className="afa-warning__label">
          {t('warningTitle')}
        </h2>
        <p className="afa-warning__body">{t('warning')}</p>
      </section>

      <section className="afa-closing">
        <p>{t('closing')}</p>
      </section>

      <footer className="afa-colophon">
        <span className="fg-wordmark">
          Travel<span>2</span>Egypt
        </span>
        <p>{t('colophonNote')}</p>
      </footer>
    </FieldGuideShell>
  );
}
