/**
 * Page health — Playwright (owner, 19 Nov 2026: "Yes, go").
 *
 * Opens a fixed set of sample pages — one per page type, in English, Spanish and
 * Japanese, at phone and desktop width — and checks what a visitor would notice:
 * the page loads, nothing spills off the side, images load, the title and (on a
 * product) the price and the booking button show. Every page is screenshotted
 * for the design-review gallery (reports/page-health/gallery.html).
 *
 * It runs against a deployed site — production by default — because CI cannot
 * build the site (no Sanity/Supabase secrets there):
 *   npm run test:pages                                   # travel2egypt.org
 *   T2E_BASE_URL=http://localhost:3000 npm run test:pages # your `npm run dev`
 */
import { defineConfig, devices } from '@playwright/test';

const baseURL = (process.env.T2E_BASE_URL ?? 'https://travel2egypt.org').replace(/\/$/, '');

export default defineConfig({
  testDir: './e2e',
  outputDir: './reports/page-health/results',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  // Gentle on the live site: a few pages at a time.
  workers: process.env.CI ? 3 : 4,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: './reports/page-health/html', open: 'never' }],
    ['./e2e/gallery-reporter.ts', { outputFile: './reports/page-health/gallery.html' }],
  ],
  use: {
    baseURL,
    // No custom request header: it went to third parties too, and Sentry and
    // Cloudflare refused it (CORS), which blocked their scripts during a run.
    // Analytics are answered empty in the spec, so checker visits never count.
    screenshot: 'off',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 900 } } },
  ],
});
