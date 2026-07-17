import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

import { redirects as generatedRedirects } from './migration/redirect-map.generated';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  serverExternalPackages: ['@sanity/client'],
  experimental: {
    // Client router cache lifetimes (seconds). Next 15 defaults dynamic
    // to 0, so every back/forward navigation refetches the RSC payload
    // and briefly renders loading.tsx — the browser then restores scroll
    // against the short skeleton, clamps, and the user lands mid-page.
    // A short cache lets history navigation serve instantly from the
    // client cache with correct scroll restoration.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  async redirects() {
    // Sourced from migration/redirect-map.csv via the Phase 3b regenerator
    // (scripts/wp-import/redirect-map-regenerate.ts). CSV is canonical;
    // the .generated.ts module is the build-time-importable artifact.
    //
    // Non-ASCII sources (Japanese-script legacy slugs) must be percent-encoded:
    // Next matches redirect sources against the percent-encoded request path,
    // so raw-unicode sources never fire. CSV stays human-readable; encode here.
    const encodePath = (p: string) => (/[^\x20-\x7e]/.test(p) ? encodeURI(p) : p);
    return generatedRedirects.map((r) => ({
      ...r,
      source: encodePath(r.source),
      destination: encodePath(r.destination),
    }));
  },
};

// Sentry (Session 11). The build-time plugin is intentionally conservative and
// dormant: source-map upload only runs when SENTRY_AUTH_TOKEN + org/project are
// set (owner supplies at launch), telemetry is off, and logging is quiet. With
// no auth token the wrap is effectively inert, so the build stays warning-clean.
// Runtime error capture is driven separately by the Sentry.init configs
// (instrumentation.ts / instrumentation-client.ts) and needs only SENTRY_DSN.
export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Quiet build logs; no Sentry build telemetry.
  silent: !process.env.CI,
  telemetry: false,
  // Tree-shake Sentry's internal debug-logging out of the client bundle.
  bundleSizeOptimizations: { excludeDebugStatements: true },
  // Do not widen client file upload (keeps upload scope minimal when enabled).
  widenClientFileUpload: false,
});
