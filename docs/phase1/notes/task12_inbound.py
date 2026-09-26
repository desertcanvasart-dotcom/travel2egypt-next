#!/usr/bin/env python3
"""Task 12 / 18: find every inbound link to the Sillage/AffordEgypt posts (read-only).

Usage: python3 docs/phase1/notes/task12_inbound.py DUMP.json
DUMP.json is the raw GROQ result of *[!(_type match "sanity.*")] (perspective raw).
Prints one TSV row per (linking doc, target post, link kind).
"""
import json
import re
import sys

GROUPS = {  # en slug -> {locale: (id, slug)}
}


def load_groups(docs):
    arts = {d["_id"]: d for d in docs if d.get("_type") == "article" and not d["_id"].startswith("drafts.")}
    by_slug = {(a.get("language"), (a.get("slug") or {}).get("current")): a["_id"] for a in arts.values()}
    tmeta = [d for d in docs if d.get("_type") == "translation.metadata" and not d["_id"].startswith("drafts.")]
    return arts, by_slug, tmeta


SLUGS = ["egypt-luxury-travel", "the-luxurious-egyptian-vacation", "luxury-resorts-in-egypt",
         "egypt-luxury-beach-resorts", "luxury-nile-cruise", "boutique-nile-cruises-in-egypt",
         "experiencing-egypt-aboard-the-oberoi-zahra", "historical-hotels-in-egypt", "boutique-hotels-in-egypt",
         "how-to-choose-the-right-egyptian-airport-for-your-private-flight",
         "a-helicopter-adventure-over-the-pyramids-and-nile", "exclusive-access-to-the-giza-pyramid",
         "budget-hotels-near-the-pyramids"]


def walk(node, path, hits):
    if isinstance(node, dict):
        if node.get("_type") == "reference" or "_ref" in node:
            hits.append(("ref", node.get("_ref"), path))
        for k, v in node.items():
            walk(v, path + "." + k, hits)
    elif isinstance(node, list):
        for i, v in enumerate(node):
            walk(v, f"{path}[{i}]", hits)
    elif isinstance(node, str):
        hits.append(("str", node, path))


def title_of(d):
    t = d.get("title") or d.get("name") or d.get("heading")
    if isinstance(t, list):
        t = next((x.get("value") for x in t if x.get("_key") == "en"), None) or (t[0].get("value") if t else None)
    if isinstance(t, dict):
        t = t.get("en") or next(iter(t.values()), None)
    return t


def main():
    docs = json.load(open(sys.argv[1]))["result"]
    arts, by_slug, tmeta = load_groups(docs)
    target = {}  # id -> (en slug, locale, slug)
    en_ids = {by_slug[("en", s)]: s for s in SLUGS}
    for m in tmeta:
        tr = {t["_key"]: t["value"]["_ref"] for t in m.get("translations") or []}
        if tr.get("en") in en_ids:
            for loc, i in tr.items():
                target[i] = (en_ids[tr["en"]], loc, (arts[i].get("slug") or {}).get("current"))
    slug_to = {v[2]: k for k, v in target.items()}
    slug_re = re.compile("/(" + "|".join(re.escape(x) for x in sorted(slug_to, key=len, reverse=True))
                         + r")(?=[/?#\"'\s)]|$)")
    rows = []
    for d in docs:
        if d.get("_type") == "translation.metadata":
            continue
        hits = []
        walk(d, "", hits)
        seen = set()
        for kind, val, path in hits:
            if kind == "ref" and val in target:
                if path.startswith(".category") or path.startswith(".author"):
                    continue
                key = (val, "internalLink" if ".markDefs" in path else "reference:" + path.split("[")[0].split(".")[1])
                if key in seen:
                    continue
                seen.add(key)
                rows.append((d, val, key[1], path))
            elif kind == "str" and val and "/" in val and not path.startswith(".slug") and "migration" not in path:
                for m in slug_re.finditer(val):
                    tid = slug_to[m.group(1)]
                    key = (tid, "href/string", val)
                    if key in seen:
                        continue
                    seen.add(key)
                    rows.append((d, tid, "href/string", path + " = " + val[:160]))
    print("\t".join(["doc_id", "type", "lang", "title", "links_to_id", "links_to_en_slug", "target_locale",
                     "kind", "path", "self_or_sibling"]))
    for d, tid, kind, path in rows:
        en_slug, loc, _ = target[tid]
        sib = "self" if d["_id"].replace("drafts.", "") == tid else (
            "sibling" if d["_id"].replace("drafts.", "") in target else "")
        print("\t".join(str(x) for x in [d["_id"], d.get("_type"), d.get("language") or "", title_of(d) or "",
                                          tid, en_slug, loc, kind, path, sib]))


if __name__ == "__main__":
    main()
