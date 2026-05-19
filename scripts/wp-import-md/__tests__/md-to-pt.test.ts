/**
 * MD → HTML → PT bridge tests.
 *
 * Snapshot-style: assert key shapes (block types, image asset refs) rather
 * than exact byte equality.
 */

import { mdToPortableText } from '../md-to-pt.js';
import type { UploadedImage } from '../types.js';
import { makeAsserter } from './_assert.js';

export async function run(): Promise<boolean> {
const { ok, eq, done } = makeAsserter('md-to-pt');

// Plain paragraphs + headings
{
  const md = `## A heading\n\nA paragraph with **bold** text.\n`;
  const { blocks } = mdToPortableText(md, { locale: 'en', imageMap: new Map() });
  ok(blocks.length >= 2, 'at least 2 blocks (heading + paragraph)');
  ok(
    blocks.some((b) => b._type === 'block' && (b as any).style === 'h2'),
    'h2 block present'
  );
  ok(
    blocks.some((b) => b._type === 'block' && (b as any).style === 'normal'),
    'normal block present'
  );
}

// Image resolution via attachmentResolver hook
{
  const md = `Some text.\n\n![hero alt](./images/foo.jpg)\n`;
  const imageMap = new Map<string, UploadedImage>([
    ['./images/foo.jpg', { assetId: 'image-fake123', filename: 'foo.jpg', sourcePath: '/abs/foo.jpg' }],
  ]);
  const { blocks } = mdToPortableText(md, { locale: 'en', imageMap });
  const imageBlock = blocks.find((b) => b._type === 'image') as any;
  ok(!!imageBlock, 'image block emitted');
  eq(imageBlock?.asset?._ref, 'image-fake123', 'image block carries resolved asset _ref');
}

// Unknown image → _pendingImage (resolver returned null)
{
  const md = `![alt](./images/missing.jpg)\n`;
  const { blocks } = mdToPortableText(md, { locale: 'en', imageMap: new Map() });
  const imageBlock = blocks.find((b) => b._type === 'image') as any;
  ok(!!imageBlock, 'image block emitted for unresolved ref');
  ok(imageBlock?._pendingImage !== undefined, 'unresolved image carries _pendingImage marker');
}

// JA locale dispatch — pipeline accepts JA without throwing
{
  const md = `# 王家の谷\n\n本文の内容です。`;
  const { blocks } = mdToPortableText(md, { locale: 'ja', imageMap: new Map() });
  ok(blocks.length > 0, 'JA content produces blocks');
}

return done();
}
