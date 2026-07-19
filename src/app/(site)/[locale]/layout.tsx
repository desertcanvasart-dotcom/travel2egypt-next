import '../../globals.css';
import '@/styles/tour-system.css';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale, getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { fontVariables } from '@/app/fonts';
import { routing, type Locale } from '@/i18n/routing';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { JsonLd } from '@/components/JsonLd';
import { CookieConsent } from '@/components/CookieConsent';
import { ConsentProvider } from '@/lib/consent';
import { CurrencyProvider } from '@/lib/currency-context';
import { defaultCurrencyForLocale } from '@/lib/currency';
import { client } from '@/sanity/lib/client';
import { siteSettingsQuery } from '@/sanity/lib/queries';
import {
  buildOrganizationSchema,
  buildFounderPersonSchema,
} from '@/lib/structured-data';

export const metadata: Metadata = {
  title: 'Travel2Egypt',
  description: 'Egypt travel, with judgment. An Egyptian operator since 2003.',
};

// ISR for the whole public site. Pages are statically rendered, then
// regenerated in the background at most once per this window — so Sanity
// content edits appear without a redeploy. (`@sanity/client` is a
// serverExternalPackage, so its reads bypass Next's fetch cache; this
// segment-level revalidate is what drives refresh.) Inherited by every
// page under (site)/[locale]. Raise it post-cutover to cut regeneration.
export const revalidate = 60;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const siteSettings = await client.fetch(siteSettingsQuery(locale as Locale));
  const orgSchema = buildOrganizationSchema(siteSettings ?? {});
  // Founder Person is emitted as a sibling JSON-LD when configured. Its
  // @id is referenced from the Organization's `founder` property so
  // crawlers join the two entities. Returns null when no founder is
  // configured in siteSettings; we render just the Organization in that
  // case.
  const founderSchema = buildFounderPersonSchema(siteSettings?.founder ?? null);
  const orgGraph = founderSchema ? [orgSchema, founderSchema] : orgSchema;

  // Client components (the cookie consent UI) read translations from this
  // provider — server components resolve them directly, so messages must be
  // passed explicitly for the client tree to have them.
  const messages = await getMessages();
  const tNav = await getTranslations('nav');

  return (
    <html lang={locale} className={fontVariables}>
      <body>
        <a href="#main" className="skip-link">
          {tNav('skipToContent')}
        </a>
        <JsonLd data={orgGraph} />
        <NextIntlClientProvider messages={messages}>
          <ConsentProvider>
            <CurrencyProvider defaultCurrency={defaultCurrencyForLocale(locale)}>
              <Header locale={locale as Locale} />
              <main id="main">{children}</main>
              <Footer locale={locale as Locale} />
              <CookieConsent />
            </CurrencyProvider>
          </ConsentProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
