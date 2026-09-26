#!/usr/bin/env python3
"""Phase 1: unpublish retired sources, only after their redirects are live.

  retire.py check --task N    what would happen (default; writes nothing)
  retire.py write --task N    do it

For every source document of task N (all locales, from docs/phase1/inventory.csv):
  1. its URL on https://travel2egypt.org must already answer 301/308 to the
     planned target; otherwise the task is refused (brief rule 2);
  2. no published document other than translation.metadata may still reference
     it (publish the Step 5 relink drafts first);
  3. translation.metadata references to it are made weak (`_weak: true`), because
     strong references block unpublishing; the language grouping is kept;
  4. it is unpublished the way Studio does it: the published content is kept as
     drafts.<id> (unless a draft exists) and the published version is removed.
     Nothing is deleted outright, and the backup in docs/phase1/backup/ remains.
"""
import argparse
import csv
import json
import os
import subprocess
import sys
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ptmd  # noqa: E402

ROOT = ptmd.ROOT


def live_location(path):
    url = "https://travel2egypt.org" + urllib.parse.quote(path, safe="/-_.~")
    out = subprocess.check_output(["curl", "-sS", "-o", "/dev/null", "-w", "%{http_code} %{redirect_url}", url]).decode()
    code, _, loc = out.partition(" ")
    return code, urllib.parse.unquote(loc.replace("https://travel2egypt.org", "")).rstrip("/")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["check", "write"])
    ap.add_argument("--task", required=True)
    a = ap.parse_args()
    rows = [r for r in csv.DictReader(open(os.path.join(ROOT, "docs/phase1/inventory.csv")))
            if r["task"] == a.task and r["role"] == "source" and r["sanity_id"]]
    redirect = {}
    for line in open(os.path.join(ROOT, "migration/redirect-map.csv")):
        if line.startswith("#") or line.startswith("from_url"):
            continue
        c = line.strip().split(",")
        redirect[(c[0].replace("https://travel2egypt.org", "").rstrip("/"), c[2])] = c[1]
    problems, mutations = [], []
    for r in rows:
        doc_id = r["sanity_id"]
        want = redirect.get((r["url"], r["locale"]))
        if not want:
            problems.append(f"{r['url']}: no live row in migration/redirect-map.csv")
            continue
        code, loc = live_location(r["url"])
        if code not in ("301", "308") or loc != want:
            problems.append(f"{r['url']}: production answers {code} {loc or ''}, expected a redirect to {want}")
            continue
        refs = ptmd.groq('*[references($id) && !(_id in path("drafts.**"))]{_id,_type}', id=doc_id)
        blockers = [x for x in refs if x["_type"] != "translation.metadata"]
        if blockers:
            problems.append(f"{doc_id}: still referenced by {', '.join(x['_id'] for x in blockers)}")
            continue
        for m in [x for x in refs if x["_type"] == "translation.metadata"]:
            full = ptmd.groq("*[_id == $id][0]", id=m["_id"])
            for t in full.get("translations") or []:
                if t["value"].get("_ref") == doc_id and not t["value"].get("_weak"):
                    mutations.append({"patch": {"id": m["_id"], "set": {
                        f'translations[_key=="{t["_key"]}"].value._weak': True}}})
        pub = ptmd.groq("*[_id == $id][0]", id=doc_id)
        draft = ptmd.groq("*[_id == $id][0]", id="drafts." + doc_id)
        if not pub:
            problems.append(f"{doc_id}: already unpublished")
            continue
        if not draft:
            keep = {k: v for k, v in pub.items() if k not in ("_rev", "_updatedAt", "_createdAt")}
            keep["_id"] = "drafts." + doc_id
            mutations.append({"createIfNotExists": keep})
        mutations.append({"delete": {"id": doc_id}})
    for p in problems:
        print("✗", p)
    if problems:
        sys.exit("refused: fix the problems above first (nothing written)")
    for m in mutations:
        k = next(iter(m))
        print("·", k, m[k].get("id") or m[k].get("_id"))
    res = ptmd.mutate(mutations, dry_run=(a.cmd == "check"))
    print("dry run ok" if a.cmd == "check" else "done", res.get("transactionId"))


if __name__ == "__main__":
    main()
