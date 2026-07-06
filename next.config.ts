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
    return generatedRedirects;
  },
};

export default withNextIntl(nextConfig);
