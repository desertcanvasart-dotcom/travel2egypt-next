#!/usr/bin/env python3
"""Phase 1 Step 1: back up every source/target document and rebuild the inventory.

Read-only. Queries Sanity `production` with the raw perspective (published and
draft documents), writes each document verbatim to docs/phase1/backup/, and
rewrites docs/phase1/inventory.csv with real IDs, per-locale slugs and live
status codes from travel2egypt.org.

Input: scripts/phase1-urls.json ([task, role, url] rows).
Run:   python3 scripts/phase1-snapshot.py
"""
import csv
import json
import os
import subprocess
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API = "https://ufallvd2.api.sanity.io/v2024-01-01/data/query/production"
SITE = "https://travel2egypt.org"
LOCALES = ["en", "es", "ja"]
BACKUP_DIR = os.path.join(ROOT, "docs/phase1/backup")

# Static (code) routes and their localized leaves, from src/i18n/routing.ts.
STATIC = {
    "/egypt-travel-packages": {
        "en": "/egypt-travel-packages",
        "es": "/paquetes-de-viaje-a-egipto",
        "ja": "/ejiputo-ryoko-pakkeeji",
    },
    "/journeys/first-time-in-egypt": {
        "en": "/journeys/first-time-in-egypt",
        "es": "/journeys/primera-vez-en-egipto",
        "ja": "/journeys/hajimete-no-ejiputo",
    },
    "/guide": {"en": "/guide", "es": "/guide", "ja": "/guide"},
}


def groq(query, **params):
    args = ["curl", "-sS", "-G", API, "--data-urlencode", f"query={query}",
            "--data-urlencode", "perspective=raw"]
    for k, v in params.items():
        args += ["--data-urlencode", f"${k}={json.dumps(v)}"]
    out = json.loads(subprocess.check_output(args))
    if "error" in out:
        raise RuntimeError(out["error"])
    return out["result"]


def status(path):
    url = SITE + urllib.parse.quote(path, safe="/-_.~")
    out = subprocess.check_output(
        ["curl", "-sS", "-o", "/dev/null", "-w", "%{http_code} %{redirect_url}", url]
    ).decode().strip()
    code, _, loc = out.partition(" ")
    loc = urllib.parse.unquote(loc.replace(SITE, "")) if loc else ""
    return code, loc


def published_id(doc_id):
    return doc_id[len("drafts."):] if doc_id.startswith("drafts.") else doc_id


def loc_slug(slugs, locale):
    """Localized slug array → (slug, fell_back_to_en)."""
    by = {s.get("_key"): (s.get("value") or {}).get("current") for s in slugs or []}
    if by.get(locale):
        return by[locale], False
    return by.get("en"), True


def prefix(locale):
    return "" if locale == "en" else f"/{locale}"


saved = {}


def backup(doc):
    saved[doc["_id"]] = doc
    with open(os.path.join(BACKUP_DIR, doc["_id"] + ".json"), "w") as f:
        json.dump(doc, f, ensure_ascii=False, indent=2)
        f.write("\n")


def split(docs):
    """Group raw docs (published + drafts) by published id."""
    groups = {}
    for d in docs:
        groups.setdefault(published_id(d["_id"]), []).append(d)
    return groups


def resolve_blog(slug):
    en = groq('*[_type=="article" && slug.current==$s]', s=slug)
    rows = []
    if not en:
        return [dict(locale=l, url=f"{prefix(l)}/blog/{slug}" if l == "en" else f"{prefix(l)}/blog/(none)",
                     ids="", draft="", exists="no", notes="no article with this slug (published or draft)")
                for l in LOCALES]
    for d in en:
        backup(d)
    en_ids = sorted({published_id(d["_id"]) for d in en})
    metas = groq('*[_type=="translation.metadata" && count(translations[value._ref in $ids]) > 0]', ids=en_ids)
    for m in metas:
        backup(m)
    by_locale = {}
    for m in metas:
        for t in m.get("translations") or []:
            by_locale.setdefault(t["_key"], set()).add(t["value"]["_ref"])
    by_locale.setdefault("en", set()).update(en_ids)
    meta_note = f"translation.metadata: {', '.join(sorted(m['_id'] for m in metas)) or 'none'}"
    for l in LOCALES:
        ids = sorted(by_locale.get(l, set()))
        docs = groq('*[_id in $ids || _id in $dids]', ids=ids, dids=["drafts." + i for i in ids]) if ids else []
        for d in docs:
            backup(d)
        groups = split(docs)
        slugs = sorted({(d.get("slug") or {}).get("current") for d in docs if (d.get("slug") or {}).get("current")})
        pub = [i for i in groups if any(not d["_id"].startswith("drafts.") for d in groups[i])]
        drafts = [i for i in groups if any(d["_id"].startswith("drafts.") for d in groups[i])]
        wrong_lang = [d["_id"] for d in docs if d.get("language") != l]
        notes = [meta_note]
        if len(groups) > 1:
            notes.append(f"{len(groups)} docs for this locale")
        if wrong_lang:
            notes.append(f"language field mismatch on {', '.join(wrong_lang)}")
        pub_slugs = sorted({(d.get("slug") or {}).get("current") for d in docs
                            if not d["_id"].startswith("drafts.") and (d.get("slug") or {}).get("current")})
        url_slugs = pub_slugs or slugs
        if len(url_slugs) > 1:
            notes.append(f"slugs: {', '.join(url_slugs)}")
        rows.append(dict(
            locale=l,
            url=f"{prefix(l)}/blog/{url_slugs[0]}" if url_slugs else f"{prefix(l)}/blog/(none)",
            ids=" ".join(sorted(groups)),
            draft="yes" if drafts else "no",
            exists="published" if pub else ("draft only" if drafts else "no"),
            notes="; ".join(notes),
        ))
    return rows


def resolve_localized(doc_type, section, slug, extra_filter=""):
    docs = groq(f'*[_type==$t && slug[_key=="en"][0].value.current==$s {extra_filter}]', t=doc_type, s=slug)
    return docs


def rows_for_localized(docs, build_path, what):
    for d in docs:
        backup(d)
    groups = split(docs)
    rows = []
    for l in LOCALES:
        if not groups:
            rows.append(dict(locale=l, url="", ids="", draft="", exists="no", notes=f"no {what} found"))
            continue
        pid = sorted(groups)[0]
        g = groups[pid]
        pub = next((d for d in g if not d["_id"].startswith("drafts.")), None)
        ref = pub or g[0]
        path, notes = build_path(ref, l)
        if len(groups) > 1:
            notes.append(f"{len(groups)} matching docs: {', '.join(sorted(groups))}")
        if ref.get("hidden"):
            notes.append("hidden=true")
        rows.append(dict(
            locale=l, url=path, ids=pid,
            draft="yes" if any(d["_id"].startswith("drafts.") for d in g) else "no",
            exists="published" if pub else "draft only",
            notes="; ".join(notes),
        ))
    return rows


def resolve(url):
    parts = url.strip("/").split("/")
    if url in STATIC:
        return [dict(locale=l, url=f"{prefix(l)}{STATIC[url][l]}", ids="", draft="", exists="code route",
                     notes="static route (src/i18n/routing.ts)") for l in LOCALES]
    if parts[0] == "blog":
        return resolve_blog(parts[1])
    if parts[0] == "travel-tips":
        docs = resolve_localized("travelTip", "travel-tips", parts[1])

        def path(d, l):
            s, fb = loc_slug(d.get("slug"), l)
            return f"{prefix(l)}/travel-tips/{s}", (["ES/JA slug empty, falls back to EN"] if fb and l != "en" else [])
        return rows_for_localized(docs, path, "travelTip")
    if parts[0] == "resources":
        docs = resolve_localized("fieldGuide", "resources", parts[1])

        def path(d, l):
            s, fb = loc_slug(d.get("slug"), l)
            return f"{prefix(l)}/resources/{s}", (["slug falls back to EN"] if fb and l != "en" else [])
        return rows_for_localized(docs, path, "fieldGuide")
    if parts[0] == "guide" and len(parts) == 2:
        docs = resolve_localized("city", "guide", parts[1])

        def path(d, l):
            s, fb = loc_slug(d.get("slug"), l)
            return f"{prefix(l)}/guide/{s}", (["slug falls back to EN"] if fb and l != "en" else [])
        return rows_for_localized(docs, path, "city")
    if parts[0] == "guide" and len(parts) == 3:
        docs = groq('*[_type=="guideArticle" && slug[_key=="en"][0].value.current==$s'
                    ' && parentCity->slug[_key=="en"][0].value.current==$c]{..., "_parentSlug": parentCity->slug}',
                    s=parts[2], c=parts[1])

        def path(d, l):
            c, cfb = loc_slug(d.get("_parentSlug"), l)
            s, fb = loc_slug(d.get("slug"), l)
            return f"{prefix(l)}/guide/{c}/{s}", (["slug falls back to EN"] if (fb or cfb) and l != "en" else [])
        clean = [{k: v for k, v in d.items() if k != "_parentSlug"} for d in docs]
        rows = rows_for_localized(clean, lambda d, l: path(next(x for x in docs if x["_id"] == d["_id"]), l),
                                  "guideArticle")
        return rows
    raise ValueError(url)


def main():
    os.makedirs(BACKUP_DIR, exist_ok=True)
    with open(os.path.join(ROOT, "scripts/phase1-urls.json")) as f:
        urls = json.load(f)
    out = []
    for task, role, url in urls:
        for r in resolve(url):
            if r["url"] and "(none)" not in r["url"]:
                code, loc = status(r["url"])
            else:
                code, loc = "", ""
            out.append(dict(task=task, role=role, brief_url=url, locale=r["locale"], url=r["url"],
                            sanity_id=r["ids"], exists=r["exists"], draft_exists=r["draft"],
                            status_code=code, redirects_to=loc, notes=r["notes"]))
            print(task, role, r["locale"], r["url"], r["ids"], r["exists"], code, loc)
    fields = ["task", "role", "brief_url", "locale", "url", "sanity_id", "exists", "draft_exists",
              "status_code", "redirects_to", "notes"]
    with open(os.path.join(ROOT, "docs/phase1/inventory.csv"), "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(out)
    manifest = sorted(
        ({"_id": d["_id"], "_type": d["_type"], "_rev": d.get("_rev"), "_updatedAt": d.get("_updatedAt")}
         for d in saved.values()), key=lambda x: x["_id"])
    with open(os.path.join(BACKUP_DIR, "manifest.json"), "w") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"{len(out)} inventory rows, {len(saved)} documents backed up")


if __name__ == "__main__":
    main()
