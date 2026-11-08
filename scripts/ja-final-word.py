#!/usr/bin/env python3
"""Replace the untranslated JA closing heading "Final Word" / "■ Final Word" with
"最後に" / "■ 最後に" in JA body/overview, and drop italics (canon: JA has no
italics) from the paragraphs of that closing section. Published docs and drafts.

  ja-final-word.py check|write
Writes docs/ja-final-word/changes.json (doc, rev, block keys, span keys) for rollback.
"""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'phase1'))
import ptmd  # noqa: E402

NEW = {'Final Word': '最後に', '■ Final Word': '■ 最後に'}
LOG = os.path.join(ptmd.ROOT, 'docs/ja-final-word/changes.json')


def fix(blocks):
    rec, i = [], 0
    while i < len(blocks):
        b = blocks[i]
        kids = b.get('children') or []
        text = ''.join(c.get('text', '') for c in kids)
        if b.get('style') in ('h2', 'h3') and text.strip() in NEW and len(kids) == 1:
            kids[0]['text'] = NEW[text.strip()]
            r = {'heading': b['_key'], 'old': text, 'unitalicised': []}
            j = i + 1
            while j < len(blocks) and blocks[j].get('style') not in ('h1', 'h2', 'h3'):
                for c in blocks[j].get('children') or []:
                    if 'em' in (c.get('marks') or []):
                        c['marks'] = [m for m in c['marks'] if m != 'em']
                        r['unitalicised'].append([blocks[j]['_key'], c['_key']])
                j += 1
            rec.append(r)
            i = j
        else:
            i += 1
    return rec


def main():
    cmd = sys.argv[1]
    docs = ptmd.groq('''*[_type in ["city","guideArticle","travelTip","wikiMonument"]
      && (count(body[_key=="ja"][0].value[pt::text(@) match "Final Word"]) > 0
       || count(overview[_key=="ja"][0].value[pt::text(@) match "Final Word"]) > 0)]{_id,_rev,
      "body":body[_key=="ja"][0].value, "overview":overview[_key=="ja"][0].value}''')
    log, muts = [], []
    for d in docs:
        sets, recs = {}, {}
        for field in ('body', 'overview'):
            if d.get(field):
                r = fix(d[field])
                if r:
                    sets[f'{field}[_key=="ja"].value'] = d[field]
                    recs[field] = r
        if sets:
            muts.append({'patch': {'id': d['_id'], 'ifRevisionID': d['_rev'], 'set': sets}})
            log.append({'doc': d['_id'], 'rev_before': d['_rev'], 'changes': recs})
    heads = sum(len(r) for l in log for r in l['changes'].values())
    spans = sum(len(x['unitalicised']) for l in log for r in l['changes'].values() for x in r)
    print(f'{len(log)} documents ({sum(1 for l in log if l["doc"].startswith("drafts."))} drafts), '
          f'{heads} headings, {spans} italic spans')
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
