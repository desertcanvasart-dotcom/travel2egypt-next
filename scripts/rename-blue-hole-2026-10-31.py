"""Rename the Dahab "Dahab Exclusives" guide page to match its URL (2026-10-31).

wp-page-59426 lives at /guide/dahab/blue-hole and its body is entirely about
the Blue Hole, but WP left it titled "Dahab Exclusives". This sets:
  - title: The Blue Hole / El Agujero Azul / ブルーホール
  - body: drops the leftover "Dahab Exclusives: …" H2 and promotes the real
    heading ("The Enigma of Dahab's Blue Hole: A Natural Wonder") to H2
  - summary: removes the "Home Dahab Exclusives …" breadcrumb debris
  - JA slug: dahabu-gentei → buru-horu (the old URL needs a redirect row)
Backed up first; written with ifRevisionID.

  python3 scripts/rename-blue-hole-2026-10-31.py            # preview
  python3 scripts/rename-blue-hole-2026-10-31.py --commit   # write
"""
import copy
import importlib.util
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_spec = importlib.util.spec_from_file_location(
    'links', os.path.join(ROOT, 'scripts/repair-own-site-links-2026-10-31.py'))
links = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(links)

DOC = 'wp-page-59426'
TITLE = {'en': 'The Blue Hole', 'es': 'El Agujero Azul', 'ja': 'ブルーホール'}
SUMMARY = {
    'en': 'Nestled along the shores of Dahab, the Blue Hole stands as an unparalleled marvel, '
          'a singular spectacle that graces our planet.',
    'es': 'Enclavado a lo largo de las costas de Dahab, el Agujero Azul se erige como una maravilla '
          'sin parangón, un espectáculo singular que adorna nuestro planeta.',
    'ja': 'ダハブの海岸に口を開けるブルーホールは、地球上でも唯一無二の自然の驚異です。',
}
JA_SLUG = 'buru-horu'


def text(block):
    return ''.join(c.get('text', '') for c in block.get('children', []))


def main():
    commit = '--commit' in sys.argv
    if links.query(f'*[_id=="drafts.{DOC}"]'):
        sys.exit('A Studio draft exists — publish or discard it first.')
    doc = links.query(f'*[_id=="{DOC}"][0]')

    title = copy.deepcopy(doc['title'])
    for t in title:
        print(f"title[{t['_key']}]: {t['value']!r} -> {TITLE[t['_key']]!r}")
        t['value'] = TITLE[t['_key']]
    summary = copy.deepcopy(doc['summary'])
    for s in summary:
        print(f"summary[{s['_key']}]: {s['value'][:70]!r}… -> {SUMMARY[s['_key']]!r}")
        s['value'] = SUMMARY[s['_key']]
    body = copy.deepcopy(doc['body'])
    for loc in body:
        blocks = loc['value']
        assert blocks[0].get('style') == 'h2' and blocks[1].get('style') == 'normal', loc['_key']
        print(f"body[{loc['_key']}]: drop H2 {text(blocks[0])[:60]!r}; promote {text(blocks[1])[:60]!r} to H2")
        blocks[1]['style'] = 'h2'
        loc['value'] = blocks[1:]
    slug = copy.deepcopy(doc['slug'])
    for s in slug:
        if s['_key'] == 'ja':
            print(f"slug[ja]: {s['value']['current']!r} -> {JA_SLUG!r}")
            s['value']['current'] = JA_SLUG

    if not commit:
        print('preview only — pass --commit to write')
        return
    backup = os.path.join(ROOT, 'backups/blue-hole-before-rename-2026-10-31.json')
    with open(backup, 'w', encoding='utf-8') as f:
        json.dump(doc, f, ensure_ascii=False, indent=1)
    print('backup:', backup)
    patch = {'title': title, 'summary': summary, 'body': body, 'slug': slug}
    links.curl(['-X', 'POST', f'{links.API}/mutate/production'],
               json.dumps({'mutations': [{'patch': {'id': DOC, 'ifRevisionID': doc['_rev'], 'set': patch}}]},
                          ensure_ascii=False))
    print('written')


if __name__ == '__main__':
    main()
