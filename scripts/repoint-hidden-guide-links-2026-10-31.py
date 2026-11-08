"""Repoint internalLink refs that target hidden guideArticles (2026-10-31).

Superseded duplicate guideArticles are hidden (their routes 404 or redirect),
but body internalLinks still referenced them. Using
migration/hidden-guide-link-repoint-2026-10-31.json (hidden id -> the
migration.supersededBy keeper), rewrite each such reference to its keeper.
Documents are fetched fresh, backed up, and written with ifRevisionID.

  python3 scripts/repoint-hidden-guide-links-2026-10-31.py            # dry run
  python3 scripts/repoint-hidden-guide-links-2026-10-31.py --commit   # write
"""
import importlib.util
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_spec = importlib.util.spec_from_file_location(
    'links', os.path.join(ROOT, 'scripts/repair-own-site-links-2026-10-31.py'))
links = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(links)


def transform(node, rmap, stats):
    changed = False
    if isinstance(node, list):
        for item in node:
            changed |= transform(item, rmap, stats)
    elif isinstance(node, dict):
        ref = node.get('reference') if node.get('_type') == 'internalLink' else None
        if isinstance(ref, dict) and ref.get('_ref') in rmap:
            ref['_ref'] = rmap[ref['_ref']]
            stats['repoint'] += 1
            changed = True
        for v in node.values():
            changed |= transform(v, rmap, stats)
    return changed


def main():
    commit = '--commit' in sys.argv
    rmap = json.load(open(os.path.join(ROOT, 'migration/hidden-guide-link-repoint-2026-10-31.json')))['map']
    ids = links.query('*[references($ids)]._id', {'ids': list(rmap)})
    docs = []
    for i in range(0, len(ids), 150):
        docs += links.query('*[_id in $ids]', {'ids': ids[i:i + 150]})

    stats = {'repoint': 0}
    plan = []
    for d in docs:
        if d['_id'] in rmap:
            continue
        before = json.loads(json.dumps(d))
        if not transform(d, rmap, stats):
            continue
        fields = {k: v for k, v in d.items()
                  if not k.startswith('_') and json.dumps(v, sort_keys=True) != json.dumps(before.get(k), sort_keys=True)}
        plan.append((before, fields))

    pub = sum(1 for d, _ in plan if not d['_id'].startswith('drafts.'))
    print(f'docs to patch: {len(plan)} (published {pub}, drafts {len(plan) - pub}); links repointed {stats["repoint"]}')
    if not commit:
        print('dry run — pass --commit to write')
        return

    backup = os.path.join(ROOT, 'backups/hidden-guide-links-before-repoint-2026-10-31.json')
    with open(backup, 'w', encoding='utf-8') as f:
        json.dump([d for d, _ in plan], f, ensure_ascii=False)
    print('backup:', backup)

    ok, skipped = 0, []
    for d, fields in plan:
        body = json.dumps({'mutations': [{'patch': {'id': d['_id'], 'ifRevisionID': d['_rev'], 'set': fields}}]},
                          ensure_ascii=False)
        try:
            links.curl(['-X', 'POST', f'{links.API}/mutate/production'], body)
            ok += 1
        except RuntimeError as e:
            skipped.append((d['_id'], str(e)[:160]))
    print(f'written {ok}, skipped {len(skipped)}')
    for s in skipped:
        print('  SKIP', *s)


if __name__ == '__main__':
    main()
