#!/usr/bin/env python3
"""Repoint links in English content that use a JA/ES blog slug on an EN route
(/blog/<ja-or-es-slug>, which 404s) to the same post's English version.
A link whose post has no English version is unlinked (text kept).

  fix-en-crosslang-links.py check|write   (write logs docs/en-crosslang-links/changes.json)
"""
import json, os, re, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'phase1'))
import ptmd  # noqa: E402

LOG = os.path.join(ptmd.ROOT, 'docs/en-crosslang-links/changes.json')
LOCALISED = ["city", "guideArticle", "travelTip", "wikiMonument", "wikiPerson", "wikiDynasty",
             "wikiDeity", "tour", "hotel", "nileCruise"]


def index():
    arts = ptmd.groq('*[_type=="article" && !(_id in path("drafts.**"))]{_id,language,"slug":slug.current}')
    by_slug = {}
    for a in arts:
        by_slug.setdefault(a['slug'], []).append(a)
    en_slug = {a['_id']: a['slug'] for a in arts if a['language'] == 'en'}
    group = {}
    for t in ptmd.groq('*[_type=="translation.metadata"]{translations[]{_key,"id":value._ref}}'):
        ids = {x['_key']: x['id'] for x in t['translations'] or [] if x.get('id')}
        for i in ids.values():
            group.setdefault(i, {}).update(ids)
    return by_slug, en_slug, group


def target(href, by_slug, en_slug, group):
    """(kind, new_href) for a wrong-language link, else None."""
    p = re.sub(r'^https?://(www\.)?travel2egypt\.org', '', href or '').split('?')[0].split('#')[0].rstrip('/')
    m = re.match(r'^/blog/([^/]+)$', p) or re.match(r'^/([^/]+)$', p)
    if not m:
        return None
    docs = by_slug.get(m.group(1), [])
    if not docs or any(a['language'] == 'en' for a in docs):
        return None
    en = group.get(docs[0]['_id'], {}).get('en')
    return ('repoint', '/blog/' + en_slug[en]) if en in en_slug else ('unlink', None)


def fix_blocks(blocks, idx, rec):
    for b in blocks if isinstance(blocks, list) else []:
        if not isinstance(b, dict):
            continue
        drop = []
        for md in b.get('markDefs') or []:
            t = target(md.get('href'), *idx)
            if not t:
                continue
            if t[0] == 'repoint':
                rec.append({'block': b.get('_key'), 'from': md['href'], 'to': t[1]})
                md['href'] = t[1]
            else:
                rec.append({'block': b.get('_key'), 'from': md['href'], 'to': None})
                drop.append(md['_key'])
        if drop:
            b['markDefs'] = [m for m in b['markDefs'] if m['_key'] not in drop]
            for c in b.get('children') or []:
                c['marks'] = [m for m in c.get('marks') or [] if m not in drop]
        for v in b.values():
            if isinstance(v, list) and v and isinstance(v[0], dict) and v is not b.get('markDefs') \
                    and v is not b.get('children'):
                fix_blocks(v, idx, rec)


def main():
    cmd = sys.argv[1]
    idx = index()
    docs = ptmd.groq(f'''*[_type in {json.dumps(LOCALISED)} || (_type=="article" && language=="en")]''')
    muts, log = [], []
    for d in docs:
        sets, recs = {}, []
        if d['_type'] == 'article':
            fields = {'body': d.get('body')}
        else:
            fields = {k: v for k, v in d.items() if isinstance(v, list) and v and isinstance(v[0], dict)
                      and v[0].get('_key') in ('en', 'es', 'ja') and 'value' in v[0]}
        for f, val in fields.items():
            if d['_type'] == 'article':
                r = []
                fix_blocks(val, idx, r)
            else:
                en = next((x for x in val if x.get('_key') == 'en'), None)
                r = []
                if en and isinstance(en.get('value'), list):
                    fix_blocks(en['value'], idx, r)
            if r:
                sets[f] = val
                recs += [{**x, 'field': f} for x in r]
        if d['_type'] == 'tour' and d.get('days'):
            r = []
            for day in d['days']:
                for k, v in day.items():
                    if isinstance(v, list) and v and isinstance(v[0], dict) and v[0].get('_key') == 'en':
                        en = next((x for x in v if x.get('_key') == 'en'), None)
                        if en and isinstance(en.get('value'), list):
                            fix_blocks(en['value'], idx, r)
            if r:
                sets['days'] = d['days']
                recs += [{**x, 'field': 'days'} for x in r]
        if sets:
            muts.append({'patch': {'id': d['_id'], 'ifRevisionID': d['_rev'], 'set': sets}})
            log.append({'doc': d['_id'], 'rev_before': d['_rev'], 'links': recs})
    n = sum(len(l['links']) for l in log)
    un = sum(1 for l in log for x in l['links'] if x['to'] is None)
    print(f"{len(log)} documents ({sum(1 for l in log if l['doc'].startswith('drafts.'))} drafts), "
          f"{n} links ({n - un} repointed, {un} unlinked)")
    for k in range(0, len(muts), 25):
        res = ptmd.mutate(muts[k:k + 25], dry_run=(cmd != 'write'))
        if cmd == 'write':
            print('batch', k // 25 + 1, res.get('transactionId'))
    if cmd == 'write':
        with open(LOG, 'w') as f:
            json.dump(log, f, ensure_ascii=False, indent=1)
            f.write('\n')
    print('dry run ok' if cmd != 'write' else 'done')


if __name__ == '__main__':
    main()
