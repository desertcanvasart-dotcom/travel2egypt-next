import '../../globals.css';
import '@/styles/tour-system.css';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale, getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { fontVariables } from '@/app/fonts';
import { routing, type Locale } from '@/i18n/routing';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { JsonLd } from '@/components/JsonLd';
import { CookieConsent } from '@/components/CookieConsent';
import { ConsentProvider } from '@/lib/consent';
import { client } from '@/sanity/lib/client';
import { siteSettingsQuery } from '@/sanity/lib/queries';
import { buildOrganizationSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
  title: 'Travel2Egypt',
  description: 'Egypt travel, with judgment. An Egyptian operator since 2003.',
};

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

  // Client components (the cookie consent UI) read translations from this
  // provider — server components resolve them directly, so messages must be
  // passed explicitly for the client tree to have them.
  const messages = await getMessages();

  return (
    <html lang={locale} className={fontVariables}>
      <body>
        <JsonLd data={orgSchema} />
        <NextIntlClientProvider messages={messages}>
          <ConsentProvider>
            <Header locale={locale as Locale} />
            <main>{children}</main>
            <Footer locale={locale as Locale} />
            <CookieConsent />
          </ConsentProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
