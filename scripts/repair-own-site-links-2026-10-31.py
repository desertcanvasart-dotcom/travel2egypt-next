"""Repair own-site links stored as externalLink marks (2026-10-31).

WordPress-era bodies carry links to travel2egypt.org as absolute externalLink
hrefs. Many now 404 or go through a redirect. Using the audited map in
migration/internal-link-repair-2026-10-31.json, this script:
  - repoints a link to its current page (stored as a relative path), or
  - unlinks it (keeps the text, drops the mark) when there is no successor.

Every document (published and drafts.*) holding an affected href is fetched
fresh, backed up, transformed, and written with ifRevisionID so a concurrent
edit is skipped rather than overwritten.

  python3 scripts/repair-own-site-links-2026-10-31.py            # dry run
  python3 scripts/repair-own-site-links-2026-10-31.py --commit   # write
"""
import json
import os
import subprocess
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API = 'https://ufallvd2.api.sanity.io/v2024-01-01/data'
HOSTS = ('https://www.travel2egypt.org', 'http://www.travel2egypt.org',
         'https://travel2egypt.org', 'http://travel2egypt.org')
LINK_TYPES = ('link', 'externalLink')


def token():
    for line in open(os.path.join(ROOT, '.env'), encoding='utf-8'):
        if line.startswith('SANITY_PRODUCTION_API_WRITE_TOKEN='):
            return line.split('=', 1)[1].strip().strip('"\'')
    sys.exit('SANITY_PRODUCTION_API_WRITE_TOKEN missing from .env')


TOKEN = token()


def curl(args, data=None):
    cmd = ['curl', '-sS', '--fail-with-body', '-H', f'Authorization: Bearer {TOKEN}'] + args
    if data is not None:
        cmd += ['-H', 'Content-Type: application/json', '--data-binary', '@-']
    out = subprocess.run(cmd, input=data, capture_output=True, text=True)
    if out.returncode:
        raise RuntimeError(out.stdout + out.stderr)
    return json.loads(out.stdout)


def query(groq, params=None):
    args = ['-G', f'{API}/query/production?perspective=raw', '--data-urlencode', f'query={groq}']
    for k, v in (params or {}).items():
        args += ['--data-urlencode', f'${k}={json.dumps(v)}']
    return curl(args)['result']


def own_path(href):
    """Decoded site path without trailing slash, or None if not an own-site link."""
    if not isinstance(href, str):
        return None
    for h in HOSTS:
        if href.startswith(h):
            href = href[len(h):] or '/'
            break
    else:
        if not href.startswith('/') or href.startswith('//'):
            return None
    path = urllib.parse.unquote(href).split('#')[0].split('?')[0]
    return path.rstrip('/') or '/'


def transform(node, amap, stats):
    """Rewrite blocks in place. Returns True if anything changed."""
    changed = False
    if isinstance(node, list):
        for item in node:
            changed |= transform(item, amap, stats)
    elif isinstance(node, dict):
        if node.get('_type') == 'block' and node.get('markDefs'):
            drop = set()
            for md in node['markDefs']:
                if md.get('_type') not in LINK_TYPES:
                    continue
                rule = amap.get(own_path(md.get('href')))
                if not rule:
                    continue
                if rule['action'] == 'repoint':
                    md['href'] = rule['to']
                    stats['repoint'] += 1
                else:
                    drop.add(md['_key'])
                    stats['unlink'] += 1
                changed = True
            if drop:
                node['markDefs'] = [m for m in node['markDefs'] if m.get('_key') not in drop]
                for ch in node.get('children', []):
                    if ch.get('marks'):
                        ch['marks'] = [m for m in ch['marks'] if m not in drop]
        for k, v in node.items():
            if k != 'markDefs':
                changed |= transform(v, amap, stats)
    return changed


def main():
    commit = '--commit' in sys.argv
    amap = json.load(open(os.path.join(ROOT, 'migration/internal-link-repair-2026-10-31.json')))['map']

    # Scan every document; transform() only touches blocks with matching marks.
    ids = query('*[!(_id in path("_.**"))]._id')
    docs, batch = [], 150
    for i in range(0, len(ids), batch):
        docs += query('*[_id in $ids]', {'ids': ids[i:i + batch]})

    stats = {'repoint': 0, 'unlink': 0}
    plan = []
    for d in docs:
        before = json.dumps(d, sort_keys=True)
        doc = json.loads(before)
        if not transform(doc, amap, stats):
            continue
        fields = {k: v for k, v in doc.items()
                  if not k.startswith('_') and json.dumps(v, sort_keys=True) != json.dumps(json.loads(before).get(k), sort_keys=True)}
        plan.append((d, fields))

    pub = sum(1 for d, _ in plan if not d['_id'].startswith('drafts.'))
    print(f'docs to patch: {len(plan)} (published {pub}, drafts {len(plan) - pub}); '
          f'links repointed {stats["repoint"]}, unlinked {stats["unlink"]}')
    if not commit:
        print('dry run — pass --commit to write')
        return

    backup = os.path.join(ROOT, 'backups/own-site-links-before-repair-2026-10-31.json')
    with open(backup, 'w', encoding='utf-8') as f:
        json.dump([d for d, _ in plan], f, ensure_ascii=False)
    print('backup:', backup)

    ok, skipped = 0, []
    for d, fields in plan:
        body = json.dumps({'mutations': [{'patch': {'id': d['_id'], 'ifRevisionID': d['_rev'], 'set': fields}}]},
                          ensure_ascii=False)
        try:
            curl(['-X', 'POST', f'{API}/mutate/production'], body)
            ok += 1
        except RuntimeError as e:
            skipped.append((d['_id'], str(e)[:160]))
    print(f'written {ok}, skipped {len(skipped)}')
    for s in skipped:
        print('  SKIP', *s)


if __name__ == '__main__':
    main()
