/**
 * Page health: what a visitor would notice, per sample page × language × width.
 *
 * Fails (red) on: the page not loading (not 200), no Spanish/Japanese version linked,
 * no visible title (h1), content wider than the screen (sideways scrolling), a broken
 * image, or — on a product — no price or no primary booking button.
 *
 * Notes only (shown in the report and the gallery, never red): tap targets smaller than
 * 24 × 24 px on a phone, and errors in the browser console. These are design findings
 * to review, not breakages.
 */
import { test, expect, type Page } from '@playwright/test';
import { PAGES, LOCALES, MIN_TAP, type Locale } from './pages';

async function localeUrl(page: Page, en: string, locale: Locale): Promise<string> {
  if (locale === 'en') return en;
  const res = await page.request.get(en);
  expect(res.status(), `English page ${en}`).toBe(200);
  const html = await res.text();
  const m = html.match(new RegExp(`hrefLang="${locale}" href="([^"]+)"`, 'i'));
  expect(m, `${en} links no ${locale} version (hreflang)`).not.toBeNull();
  return new URL(m![1]).pathname;
}

/** Scroll to the bottom in steps so lazy images load, then back to the top. */
async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    const step = Math.max(400, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
}

// The checker is not a visitor: no Google Analytics / Tag Manager, no Meta pixel and
// no page-view beacon (/api/pv), so the live site's numbers stay clean.
test.beforeEach(async ({ page }) => {
  // Answered empty rather than aborted: an abort shows as a console error on every page.
  await page.route(/googletagmanager\.com|google-analytics\.com|analytics\.google\.com|connect\.facebook\.net|facebook\.com\/tr/, (r) => r.fulfill({ status: 204, body: '' }));
  await page.route('**/api/pv**', (r) => r.fulfill({ status: 204, body: '' }));
});

for (const sample of PAGES) {
  for (const locale of LOCALES) {
    test(`${sample.label} · ${locale}`, async ({ page }, testInfo) => {
      const consoleErrors: string[] = [];
      page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });

      const path = await localeUrl(page, sample.en, locale);
      testInfo.annotations.push({ type: 'url', description: path });
      const res = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(res?.status(), `${path} status`).toBe(200);
      await scrollThrough(page);

      // The screenshot first, so the gallery has it even when a check below fails.
      // JPEG at CSS scale keeps the gallery small (phones render at 2.6× otherwise).
      await testInfo.attach('page', { body: await page.screenshot({ fullPage: true, type: 'jpeg', quality: 60, scale: 'css' }), contentType: 'image/jpeg' });

      // Title.
      await expect(page.locator('h1').first(), 'visible page title (h1)').toBeVisible();

      // Nothing wider than the screen.
      const overflow = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const wide = [...document.querySelectorAll<HTMLElement>('body *')]
          .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.right > vw + 1 && getComputedStyle(el).position !== 'fixed'; })
          .filter((el) => !el.closest('[data-allow-overflow], .t2e-scroll-x, [style*="overflow-x"]'))
          .slice(0, 5)
          .map((el) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''} (right edge ${Math.round(el.getBoundingClientRect().right)}px)`);
        return { scroll: document.documentElement.scrollWidth, vw, wide };
      });
      expect.soft(overflow.scroll, `page scrolls sideways (${overflow.scroll}px wide on a ${overflow.vw}px screen): ${overflow.wide.join('; ')}`).toBeLessThanOrEqual(overflow.vw + 1);

      // Images that tried to load and failed.
      const broken = await page.evaluate(() =>
        [...document.images].filter((img) => img.complete && img.naturalWidth === 0 && img.currentSrc).map((img) => img.currentSrc.slice(0, 160)));
      expect.soft(broken, 'broken images').toEqual([]);

      // Product: price and the primary booking button.
      if (sample.product) {
        await expect.soft(page.locator('.pdp-sticky__price, .t2e-dd-price, [class*="price"]').first(), 'a price on the page').toBeAttached();
        await expect.soft(page.locator('.cta-btn--primary').first(), 'the primary booking button').toBeAttached();
      }

      // Notes (never red).
      if (testInfo.project.name === 'phone') {
        const small = await page.evaluate((min) =>
          [...document.querySelectorAll<HTMLElement>('a[href], button, [role="button"], input, select')]
            .filter((el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && (r.width < min || r.height < min) && !el.closest('p, li > p'); })
            .slice(0, 8)
            .map((el) => `"${(el.innerText || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 30)}" ${Math.round(el.getBoundingClientRect().width)}×${Math.round(el.getBoundingClientRect().height)}`), MIN_TAP);
        if (small.length) testInfo.annotations.push({ type: 'note: small tap targets', description: small.join(' · ') });
      }
      if (consoleErrors.length) testInfo.annotations.push({ type: 'note: console errors', description: [...new Set(consoleErrors)].slice(0, 5).join(' · ') });
    });
  }
}
