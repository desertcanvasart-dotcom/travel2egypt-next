// Sanity-check probe: does the MD → HTML → PT pipeline produce valid output?
import { marked } from 'marked';
import { htmlToPortableText } from './wp-import-html.ts';

const sample = `Abu Simbel is not simply far from Aswan.

## The Temples

The Great Temple is dedicated to **Ramses II**.

- Item 1
- Item 2

A [link to Aswan](https://travel2egypt.org/aswan-travel-guide/).`;

const html = marked.parse(sample, { async: false });
console.log('HTML:\n', html, '\n');
const result = htmlToPortableText(html);
console.log('Block count:', result.blocks.length);
console.log('Block types:', result.blocks.map((b) => b._type));
console.log('Stats:', result.stats);
console.log('\nFirst block:', JSON.stringify(result.blocks[0], null, 2));
