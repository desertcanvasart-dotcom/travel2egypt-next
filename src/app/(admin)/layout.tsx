import '../globals.css';

/**
 * Admin route-group layout (Session 10).
 *
 * The admin reviewer panel sits at `/admin`, outside `(site)/[locale]`, so it
 * is not locale-prefixed and uses neither next-intl nor the marketing chrome.
 * Mirrors `(studio)` in scope — a separate top-level HTML wrapper — but with
 * the site's own globals so the panel matches the brand design system.
 */
export const metadata = {
  title: 'Concierge Admin · Travel2Egypt',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
