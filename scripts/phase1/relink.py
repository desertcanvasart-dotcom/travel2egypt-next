#!/usr/bin/env python3
"""Phase 1 Step 5: repoint inbound references to retired sources, as drafts.

  relink.py plan              list every reference to a Phase 1 source and its new target
  relink.py backup            save the referencing documents to docs/phase1/backup/
  relink.py check|write       build drafts (check = dry run)

Sources and targets come from docs/phase1/redirect-plan.json (modes live and
after-publish; cross-domain moves are listed, not changed). Each link goes to the
target in the language of the body it sits in, which also fixes the existing EN
bodies that link to ES posts. A code-route target (e.g. /guide) becomes an
external link with a relative href. In `journalRefs` (tour "Read before you
choose", article or guideArticle only) a reference whose target is another type,
or is already listed, is removed.

A document with an existing draft is edited on top of that draft, so pending
work is kept. translation.metadata references are left alone (see retire.py).
"""
import argparse
import copy
import json
import re
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ptmd  # noqa: E402
import stage  # noqa: E402

ROOT = ptmd.ROOT
PLAN = os.path.join(ROOT, "docs/phase1/redirect-plan.json")
LOG = os.path.join(ROOT, "docs/phase1/relink-log.json")


def source_map(site, exclude):
    """source doc id -> plan entry (only tasks whose redirects are planned in-site)."""
    import csv
    inv = list(csv.DictReader(open(os.path.join(ROOT, "docs/phase1/inventory.csv"))))
    plan = json.load(open(PLAN))
    by_src = {p["source"]: p for p in plan}
    out = {}
    for r in inv:
        p = by_src.get(r["brief_url"])
        if r["role"] != "source" or not p or not r["sanity_id"]:
            continue
        for i in r["sanity_id"].split():
            out[i] = p
    listed = {}
    for p in plan:
        if p["mode"] == "cross-domain":
            # EN ids of cross-domain posts; ES/JA via translation group
            try:
                kind, en_id = site.resolve(p["source"], "en")
            except KeyError:
                continue
            for i in site.group.get(en_id, {en_id: en_id}).values() if site.group.get(en_id) else [en_id]:
                listed[i] = p
    return {k: v for k, v in out.items() if v["task"] not in exclude and v["mode"] != "cross-domain"}, listed


def find_refs(ids):
    docs = ptmd.groq('*[references($ids) && _type != "translation.metadata"]', ids=sorted(ids))
    return docs


HREF_RE = re.compile(r"^(?:https?://(?:www\.)?(?:travel2egypt\.org|travel2egypt1\.wpenginepowered\.com))?"
                     r"(/(?:(?:es|ja)/)?(?:blog/|travel-tips/)?[^/?#]+)/?(?:[?#].*)?$")


def href_index(site, smap):
    """Source URL path (any locale, with or without /blog/) -> plan entry."""
    import csv
    inv = list(csv.DictReader(open(os.path.join(ROOT, "docs/phase1/inventory.csv"))))
    plan = {p["source"]: p for p in json.load(open(PLAN))}
    live = {p["source"] for p in smap.values()}
    idx = {}
    for r in inv:
        p = plan.get(r["brief_url"])
        if r["role"] != "source" or not p or p["source"] not in live or "(none)" in r["url"]:
            continue
        slug = r["url"].rstrip("/").split("/")[-1]
        pre = "" if r["locale"] == "en" else "/" + r["locale"]
        for form in (r["url"], f"{pre}/{slug}", f"/blog/{slug}", f"/{slug}", f"/es/blog/{slug}",
                     f"/ja/blog/{slug}", f"/es/{slug}", f"/ja/{slug}"):
            idx.setdefault(form, p)
    return idx


def edit_doc(doc, smap, site, notes, hidx=None):
    """Return (new_doc, changes). Walks every Portable Text block in the document."""
    d = copy.deepcopy(doc)
    changes = []
    hidx = hidx or {}

    def retarget(p, loc):
        try:
            return site.resolve(p["target"], loc)
        except KeyError as e:
            notes.append(f"{doc['_id']}: {p['target']} has no {loc} version ({e}); link left as is")
            return None

    def fix_block(b, loc, where):
        for md in b.get("markDefs") or []:
            text = "".join(c.get("text", "") for c in b.get("children", []) if md.get("_key") in (c.get("marks") or []))
            if md.get("_type") == "internalLink":
                ref = (md.get("reference") or {}).get("_ref")
                if ref not in smap:
                    continue
                res = retarget(smap[ref], loc)
                if not res:
                    continue
                kind, val = res
                cross = site.article_lang.get(ref) not in (None, loc)
                if kind == "ref":
                    md["reference"] = {"_type": "reference", "_ref": val}
                else:
                    for k in list(md):
                        if k != "_key":
                            del md[k]
                    md.update({"_type": "externalLink", "href": val, "newTab": False})
                changes.append(f"{where}[{loc}] “{text}”: {ref} → {val}" + (" (was a cross-language link)" if cross else ""))
            elif md.get("_type") == "externalLink":
                href = md.get("href") or ""
                m = HREF_RE.match(href)
                if not m or m.group(1).rstrip("/") not in hidx:
                    continue
                res = retarget(hidx[m.group(1).rstrip("/")], loc)
                if not res:
                    continue
                kind, val = res
                path = site.url[(val, loc)] if kind == "ref" else val
                md["href"] = path
                md["newTab"] = False
                md.pop("_pendingInternalRef", None)
                changes.append(f"{where}[{loc}] “{text}”: {href} → {path}")

    def walk(o, loc, where):
        if isinstance(o, dict):
            if o.get("_type") == "block":
                fix_block(o, loc, where)
            for k, v in o.items():
                walk(v, loc, where if where else k)
        elif isinstance(o, list):
            for x in o:
                if isinstance(x, dict) and x.get("_key") in ptmd.LOCALES and isinstance(x.get("value"), list):
                    walk(x["value"], x["_key"], where)
                else:
                    walk(x, loc, where)

    top_loc = d.get("language", "en")
    for k, v in d.items():
        if k.startswith("_") or k == "journalRefs":
            continue
        walk(v, top_loc, k)

    if isinstance(d.get("journalRefs"), list):
        keep = []
        present = {r.get("_ref") for r in d["journalRefs"]}
        for r in d["journalRefs"]:
            if r.get("_ref") not in smap:
                keep.append(r)
                continue
            p = smap[r["_ref"]]
            try:
                kind, val = site.resolve(p["target"], "en")
            except KeyError:
                kind, val = "href", None
            if kind == "ref" and site.type.get(val) in ("article", "guideArticle") and val not in present:
                keep.append({**r, "_ref": val})
                present.add(val)
                changes.append(f"journalRefs: {r['_ref']} → {val}")
            else:
                changes.append(f"journalRefs: removed {r['_ref']} (target {p['target']} "
                               f"{'already listed' if val in present else 'is not an article/guide page'})")
        d["journalRefs"] = keep
    return d, changes


def find_href_docs(hidx):
    """Documents (published and drafts) with an externalLink href to a source path, from a dataset export."""
    out = subprocess.run(["curl", "-sS", f"{ptmd.API}/data/export/{ptmd.DATASET}"], capture_output=True, check=True).stdout
    hits = []
    for line in out.decode().splitlines():
        d = json.loads(line)
        if d.get("_type", "").startswith("sanity.") or d.get("_type") == "translation.metadata":
            continue
        for h in re.findall(r'"href":\s*"([^"]*)"', line):
            m = HREF_RE.match(h)
            if m and m.group(1).rstrip("/") in hidx:
                hits.append(d)
                break
    return hits


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["plan", "backup", "check", "write"])
    ap.add_argument("--exclude-task", action="append", default=[])
    a = ap.parse_args()
    site = ptmd.Site()
    smap, listed = source_map(site, set(a.exclude_task))
    hidx = href_index(site, smap)
    docs = find_refs(set(smap) | set(listed)) + find_href_docs(hidx)
    seen = set()
    docs = [x for x in docs if not (x["_id"] in seen or seen.add(x["_id"]))]
    pubs = {d["_id"]: d for d in docs if not d["_id"].startswith("drafts.")}
    drafts = {d["_id"][7:]: d for d in docs if d["_id"].startswith("drafts.")}
    # documents that reference only via draft still count: include their published versions
    for i in drafts:
        if i not in pubs:
            p, _ = stage.fetch(i)
            pubs[i] = p or drafts[i]  # draft-only documents are fixed too
    if a.cmd == "backup":
        for i, p in pubs.items():
            for doc in (p, drafts.get(i)):
                if doc:
                    json.dump(doc, open(os.path.join(stage.BACKUP, doc["_id"] + ".json"), "w"), ensure_ascii=False, indent=2)
        print(f"backed up {len(pubs)} documents (+{len(drafts)} drafts)")
        return
    log = {}
    notes = []
    listed_hits = []
    mutations = []
    for i in sorted(pubs):
        base = drafts.get(i) or pubs[i]
        new, changes = edit_doc(base, smap, site, notes, hidx)
        # cross-domain (Task 12/18) references: list only
        for ref in listed:
            if ref in json.dumps(base):
                listed_hits.append(f"{i} ({base['_type']}) links to {ref} (task {listed[ref]['task']}): not changed")
        if not changes:
            continue
        log[i] = {"type": base["_type"], "built_on": "existing draft" if i in drafts else "published",
                  "changes": changes}
        new = {k: v for k, v in new.items() if k not in ("_rev", "_updatedAt", "_createdAt", "_system")}
        new["_id"] = "drafts." + i
        mutations.append((i, new, drafts.get(i)))
    for i, entry in log.items():
        print(f"== {i} ({entry['type']}, built on {entry['built_on']})")
        for c in entry["changes"]:
            print("   ", c)
    for n in notes:
        print("note:", n)
    for h in listed_hits:
        print("listed:", h)
    if a.cmd == "plan":
        return
    for i, new, prior in mutations:
        want = stage.manifest_rev(i) or (os.path.exists(os.path.join(stage.BACKUP, "drafts." + i + ".json")) or None)
        if want is None:
            sys.exit(f"{i}: not backed up; run `relink.py backup` first")
        if a.cmd == "write":
            with open(os.path.join(stage.ROLLBACK, i + ".prior-draft.json"), "w") as f:
                json.dump(prior, f, ensure_ascii=False, indent=2)
        res = ptmd.mutate([{"createOrReplace": new}], dry_run=(a.cmd == "check"))
        print(("dry run ok " if a.cmd == "check" else "written ") + new["_id"], res.get("transactionId"))
    if a.cmd == "write":
        json.dump({"documents": log, "notes": notes, "listed_not_changed": listed_hits},
                  open(LOG, "w"), ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
