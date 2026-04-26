/**
 * Generates the site-default OpenGraph image at public/og-default.png.
 *
 * 1200×630 PNG, brand cream background, ink wordmark, orange T2E badge.
 * Editors can override per-site by uploading siteSettings.defaultOgImage
 * in the Studio; this is the absolute final fallback.
 *
 * Run: node scripts/make-og-default.mjs
 */

import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <style>
      .ink { fill: #1f1408; }
      .orange { fill: #d97706; }
      .paper { fill: #faf6ef; }
      .ink-soft { fill: #4a3925; }
      .serif { font-family: 'Cormorant Garamond', 'EB Garamond', Georgia, serif; }
      .sans { font-family: 'Public Sans', system-ui, sans-serif; }
    </style>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" class="paper"/>

  <!-- Top bar (subtle) -->
  <rect x="0" y="0" width="1200" height="6" class="orange" opacity="0.85"/>

  <!-- T2E badge -->
  <circle cx="120" cy="120" r="48" class="ink"/>
  <text x="120" y="135" text-anchor="middle" class="sans" font-size="24" font-weight="700" fill="#d97706" letter-spacing="2">T2E</text>

  <!-- Wordmark -->
  <text x="200" y="135" font-family="Cormorant Garamond, EB Garamond, Georgia, serif" font-size="60" font-weight="600" fill="#1f1408">Travel2Egypt</text>

  <!-- Headline -->
  <text x="120" y="340" class="serif" font-size="72" font-weight="500" fill="#1f1408">Egypt, with judgment.</text>

  <!-- Subhead -->
  <text x="120" y="410" class="serif" font-size="32" font-style="italic" fill="#4a3925">An Egyptian operator since 1995.</text>

  <!-- Bottom signal: accreditations -->
  <text x="120" y="560" class="sans" font-size="18" font-weight="600" fill="#4a3925" letter-spacing="3">JATA · IATA · ASTA · 30 YEARS OPERATING</text>

  <!-- Right-side decorative pyramid silhouette -->
  <g transform="translate(900, 200)" opacity="0.12">
    <polygon points="0,300 150,0 300,300" class="ink"/>
    <polygon points="180,300 280,150 380,300" class="ink"/>
    <polygon points="320,300 380,200 440,300" class="ink"/>
  </g>
</svg>`;

const outPath = resolve(process.cwd(), 'public', 'og-default.png');

const buffer = await sharp(Buffer.from(svg))
  .png({ quality: 90 })
  .toBuffer();

writeFileSync(outPath, buffer);
console.log(`✓ wrote ${outPath} (${(buffer.byteLength / 1024).toFixed(1)} KB)`);
