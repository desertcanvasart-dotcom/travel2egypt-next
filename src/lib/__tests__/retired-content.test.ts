import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
import middleware, { config, RETIRED_PATH } from '../../middleware';
import { redirects } from '../../../migration/redirect-map.generated';

async function main() {
  const removed = [
    '/fi', '/fi/', '/fi/category/places-in-egypt-fi/',
    '/fi/egyptin-hieroglyfien-ymmartaminen', '/fi/old-page.html',
    '/fi/category/test?resume=invalid', '/?s=Safari%20in%20lake%20nasser',
    '/es?s=Lake%252BNasser', '/es/?s=', '/ja/?s=%7Bsearch_term_string%7D',
    '/en?s=old-search',
    // WordPress core endpoints (776 + 122 GSC ghosts were lostpassword URLs)
    '/wp-login.php', '/wp-login.php?action=lostpassword&redirect_to=https://travel2egypt.org/x/',
    '/es/wp-login.php', '/ja/wp-login.php?action=lostpassword', '/xmlrpc.php', '/ja/xmlrpc.php',
    '/wp-admin', '/wp-admin/', '/wp-admin/admin-ajax.php', '/wp-json/wp/v2/posts',
    '/wp-content/uploads/2020/01/photo.jpg', '/es/wp-includes/js/jquery.js',
    // WordPress taxonomy + author archives
    '/category/lifestyle', '/category/luxury-stay', '/es/category/cultura/page/3/',
    '/ja/category/', '/tag/escapada-a-alejandria-y-el-cairo/844-1755-44411', '/author/admin/',
    // WordPress date archives + date permalinks
    '/2017/05/15/', '/2017/05', '/ja/2019/03/', '/2017/05/15/some-old-post/', '/es/2018/11/02/entrada.html',
    // junk-suffix crawl artefacts + planted spam playlists (GSC "Not found" export 2026-09-14)
    '/ja/ビアフム/844-1755-44411', '/es/escape-a-egipto-paquete-de-4-dias/844-1755-44411',
    '/some-old-tour/844-1755-44411/', '/upload/6868292358.m3u8', '/upload/', '/es/upload/x.m3u8',
  ];
  const retained = [
    '/', '/es', '/ja', '/guide', '/es/guide', '/ja/guide',
    '/first-time-in-egypt', '/financial', '/?utm_source=test',
    '/es?search=egypt', '/guide?s=unrelated-parameter',
    // live routes that share a word with a retired family
    '/blog/category/culture', '/es/blog/category/cultura', '/ja/blog/category/bunka', '/blog',
    '/wiki/monuments/abusir-necropolis', '/hotels', '/es/hotels', '/tours', '/2027-total-solar-eclipse-in-egypt',
    '/guide/cairo/2017', '/5-day-river-cruise-from-luxor', '/categories-of-tours', '/wp', '/wpa-tours',
    '/uploads', '/blog/upload-your-photos', '/844-1755-44411',
  ];
  for (const path of [...removed, ...retained]) {
    assert.equal(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: path }), true, path);
    const response = await middleware(new NextRequest(`https://travel2egypt.org${path}`, {
      headers: { host: 'travel2egypt.org' },
    }));
    if (removed.includes(path)) {
      assert.equal(response.status, 410, path);
      assert.equal(response.headers.get('location'), null, path);
      assert.match(response.headers.get('content-type') ?? '', /text\/html/, path);
      assert.match(await response.text(), /This page has been removed/, path);
    } else {
      assert.notEqual(response.status, 410, path);
      assert.equal(response.headers.get('x-robots-tag'), null, path);
    }
  }
  // next.config redirects run before middleware: none may intercept a retired path.
  const intercepting = redirects.filter(({ source }) => RETIRED_PATH.test(source));
  assert.deepEqual(intercepting, [], 'redirect rows intercept retired paths');
  console.log(`Retired-content regression checks passed (${removed.length} removed, ${retained.length} retained).`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
