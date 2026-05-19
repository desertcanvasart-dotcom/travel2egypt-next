import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

import { redirects as generatedRedirects } from './migration/redirect-map.generated';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  serverExternalPackages: ['@sanity/client'],
  images: {
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
