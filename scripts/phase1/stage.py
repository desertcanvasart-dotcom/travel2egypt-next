#!/usr/bin/env python3
"""Phase 1 drafting CLI. Reads locked copy files and stages them as Sanity drafts.

  stage.py export DOC_ID [--from draft|published] [--field body] [--locale en]
      Print a document's rich-text field as Phase 1 Markdown (see ptmd.py).
  stage.py resolve PATH LOCALE
      Show what a link path resolves to in a locale.
  stage.py check COPY_DIR...        (default for a bare dir)
      Build the draft from COPY_DIR/spec.json and run every gate. Writes nothing.
  stage.py write COPY_DIR...
      Same gates, then write drafts.<id> (never publishes). Saves the prior
      draft state to docs/phase1/rollback/ first.

spec.json:
  {
    "doc": "wp-post-216669-en",          published document id
    "task": "1",
    "base": "published",                  build on the published version ("draft" = build on the existing draft)
    "existing_draft": "replace-ok: <why>" required when a draft already exists and base is "published"
    "fields": {"title": "...", "seo.metaDescription": "...", "updatedAt": "2026-09-26T00:00:00Z"},
    "localized_fields": {"title": {"en": "...", "es": "..."}},
    "bodies": {"body": "body.md"}  or  {"body": {"en": "body.en.md", "es": ..., "ja": ...}},
    "pools": ["wp-post-131153-en"]        documents whose blocks '::: keep DOC:KEY' may reuse
  }
"""
import argparse
import copy
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ptmd  # noqa: E402

ROOT = ptmd.ROOT
BACKUP = os.path.join(ROOT, "docs/phase1/backup")
ROLLBACK = os.path.join(ROOT, "docs/phase1/rollback")
STAGED_LOG = os.path.join(ROOT, "docs/phase1/staged.json")

BANNED = [r"\bnestled\b", r"hidden gem", r"must-visit", r"breathtaking", r"bucket[- ]list",
          r"vibrant tapestry", r"look no further", r"\bembark\b"]
US_SPELLINGS = {r"\btravelers?\b": "traveller", r"\btraveled\b": "travelled", r"\btraveling\b": "travelling",
                r"\bcolou?r\b(?<!colour)": None, r"\bcolor": "colour", r"\bcenter": "centre",
                r"\bfavorite": "favourite", r"\bneighborhood": "neighbourhood", r"\bcatalog\b": "catalogue",
                r"\bharbor": "harbour", r"\bhonor": "honour", r"\bflavor": "flavour", r"\btheater": "theatre",
                r"\bmeters?\b": "metre", r"\bkilometers?\b": "kilometre", r"\bprogram\b": "programme",
                r"\bjewelry\b": "jewellery", r"\bgray\b": "grey", r"\bcozy\b": "cosy", r"\bpajamas\b": "pyjamas",
                r"\bdefense\b": "defence", r"\blicense\b(?= to)": None, r"\bmold\b": "mould"}
META_MAX = 155


def fetch(doc_id):
    docs = ptmd.groq("*[_id in [$id, $did]]", id=doc_id, did="drafts." + doc_id)
    pub = next((d for d in docs if d["_id"] == doc_id), None)
    draft = next((d for d in docs if d["_id"] == "drafts." + doc_id), None)
    return pub, draft


def manifest_rev(doc_id):
    try:
        for m in json.load(open(os.path.join(BACKUP, "manifest.json"))):
            if m["_id"] == doc_id:
                return m["_rev"]
    except FileNotFoundError:
        pass
    p = os.path.join(BACKUP, doc_id + ".json")
    return json.load(open(p)).get("_rev") if os.path.exists(p) else None


def field_locales(doc, field):
    v = doc.get(field)
    return isinstance(v, list) and v and isinstance(v[0], dict) and "value" in v[0] and isinstance(v[0]["value"], list)


def set_path(doc, dotted, value):
    parts = dotted.split(".")
    cur = doc
    for p in parts[:-1]:
        if not isinstance(cur.get(p), dict):
            cur[p] = {"_type": p} if p == "seo" and doc["_type"] != "article" else {}
        cur = cur[p]
    cur[parts[-1]] = value


def get_path(doc, dotted):
    cur = doc
    for p in dotted.split("."):
        if not isinstance(cur, dict):
            return None
        cur = cur.get(p)
    return cur


DEFAULT_LOC_TYPE = {"title": "internationalizedArrayStringValue", "metaTitle": "internationalizedArrayStringValue",
                    "summary": "internationalizedArrayTextValue", "metaDescription": "internationalizedArrayTextValue"}


def lint_text(where, text, locale, warnings):
    for pat in BANNED:
        if re.search(pat, text, re.I):
            warnings.append(f"{where}: banned phrase /{pat}/")
    if locale == "en":
        for pat, fix in US_SPELLINGS.items():
            if fix and re.search(pat, text, re.I):
                for m in re.finditer(pat, text, re.I):
                    warnings.append(f"{where}: US spelling '{m.group(0)}' (→ {fix})")


def build(copy_dir, site, strict_links=True):
    spec = json.load(open(os.path.join(copy_dir, "spec.json")))
    doc_id = spec["doc"]
    errors, warnings, info = [], [], []
    pub, draft = fetch(doc_id)
    if not pub:
        errors.append(f"{doc_id}: no published document")
        return spec, None, draft, errors, warnings, info
    want = manifest_rev(doc_id)
    if want and pub["_rev"] != want:
        errors.append(f"{doc_id}: published _rev {pub['_rev']} differs from backup {want}; re-run the backup first")
    if draft:
        if spec.get("base") == "draft":
            info.append("building on the existing draft")
        elif not str(spec.get("existing_draft", "")).startswith("replace-ok"):
            errors.append(f"{doc_id}: a draft already exists ({draft['_updatedAt']}); set base or existing_draft")
    base = copy.deepcopy(draft if (spec.get("base") == "draft" and draft) else pub)
    pools = {}
    for pid in spec.get("pools", []):
        p, d = fetch(pid)
        src = p or d
        if not src:
            errors.append(f"pool {pid} not found")
            continue
        blocks = []
        for f in ("body", "overview", "visitorInfo"):
            v = src.get(f)
            if field_locales(src, f):
                for e in v:
                    blocks += e["value"]
            elif isinstance(v, list):
                blocks += v
        pools[pid] = blocks
    out = copy.deepcopy(base)
    is_article = out["_type"] == "article"
    doc_locale = out.get("language", "en")

    for dotted, value in (spec.get("fields") or {}).items():
        set_path(out, dotted, value)
        if isinstance(value, str):
            lint_text(dotted, value, doc_locale, warnings)
            if dotted.endswith("metaDescription"):
                check_meta(dotted, value, errors)

    for dotted, per in (spec.get("localized_fields") or {}).items():
        arr = get_path(out, dotted)
        for loc, value in per.items():
            arr = ptmd.loc_set(arr, loc, value, DEFAULT_LOC_TYPE.get(dotted.split(".")[-1], "internationalizedArrayStringValue"))
            lint_text(f"{dotted}[{loc}]", value, loc, warnings)
            if dotted.endswith("metaDescription"):
                check_meta(f"{dotted}[{loc}]", value, errors)
        set_path(out, dotted, arr)

    verify = []
    for field, files in (spec.get("bodies") or {}).items():
        per_loc = {doc_locale: files} if isinstance(files, str) else files
        for loc, fname in per_loc.items():
            md = ptmd.normalize_md(open(os.path.join(copy_dir, fname)).read())
            if field_locales(base, field) or not is_article:
                pool = ptmd.loc_get(base.get(field), loc) or []
            else:
                pool = base.get(field) or []
            blocks, errs = ptmd.import_md(md, site, loc, pool, f"{doc_id}/{field}/{loc}", pools)
            errors += [f"{fname}: {e}" for e in errs]
            back = ptmd.normalize_md(ptmd.export(blocks, site, loc))
            if back != md:
                a, b = md.split("\n"), back.split("\n")
                n = next((i for i in range(min(len(a), len(b))) if a[i] != b[i]), min(len(a), len(b)))
                errors.append(f"{fname}: verbatim pre-flight failed at line {n + 1}: "
                              f"{(a[n] if n < len(a) else '<eof>')[:120]!r} vs {(b[n] if n < len(b) else '<eof>')[:120]!r}")
            if is_article and not field_locales(base, field):
                out[field] = blocks
            else:
                out[field] = ptmd.loc_set(out.get(field), loc, blocks, "internationalizedArrayValue")
                # keep the existing entry _type of localized PT arrays
            if out["_type"] in ("travelTip", "guideArticle", "fieldGuide") and any(
                    b.get("_type") == "operatorNote" for b in blocks):
                errors.append(f"{fname}: {out['_type']}.{field} does not accept operator notes (schema)")
            lint_text(fname, md, loc, warnings)
            verify += [(fname, m) for m in re.findall(r"\[VERIFY[^\]]*\]", md.replace("\\[", "[").replace("\\]", "]"))]
            link_checks(blocks, fname, site, errors, warnings, strict_links)
            removed = [b["_key"] for b in pool if b["_key"] not in {x["_key"] for x in blocks}]
            info.append(f"{fname}: {len(blocks)} blocks ({len(pool)} before; {len(removed)} base blocks dropped)")
    for f, m in verify:
        info.append(f"VERIFY {f}: {m}")
    return spec, out, draft, errors, warnings, info


def check_meta(where, value, errors):
    if len(value) > META_MAX:
        errors.append(f"{where}: {len(value)} characters (max {META_MAX})")
    if re.match(r"\s*(explore|embark|discover)\b", value, re.I):
        errors.append(f"{where}: opens with a banned verb")


_status_cache = {}


def link_checks(blocks, where, site, errors, warnings, strict):
    def walk(bs):
        for b in bs:
            if b.get("_type") == "operatorNote":
                walk(b.get("body") or [])
            for d in b.get("markDefs") or []:
                if d["_type"] == "internalLink":
                    ref = (d.get("reference") or {}).get("_ref")
                    if ref not in site.type:
                        errors.append(f"{where}: internal link to unknown/unpublished {ref}")
                    elif ref in site.hidden:
                        errors.append(f"{where}: internal link to hidden {ref}")
                elif d["_type"] == "externalLink" and (d.get("href") or "").startswith("/"):
                    h = d["href"]
                    if h not in _status_cache:
                        _status_cache[h] = ptmd.http_status(h)
                    if _status_cache[h] != "200":
                        (errors if strict else warnings).append(f"{where}: {h} returns {_status_cache[h]}")
                elif d["_type"] == "externalLink" and "travel2egypt.org" in (d.get("href") or ""):
                    warnings.append(f"{where}: absolute travel2egypt.org link {d['href']}")
    walk(blocks)


def write(spec, out, draft, dry):
    doc_id = spec["doc"]
    os.makedirs(ROLLBACK, exist_ok=True)
    new = {k: v for k, v in out.items() if k not in ("_rev", "_updatedAt", "_createdAt", "_system")}
    new["_id"] = "drafts." + doc_id
    if not dry:
        with open(os.path.join(ROLLBACK, doc_id + ".prior-draft.json"), "w") as f:
            json.dump(draft, f, ensure_ascii=False, indent=2)
            f.write("\n")
    res = ptmd.mutate([{"createOrReplace": new}], dry_run=dry)
    if not dry:
        log = json.load(open(STAGED_LOG)) if os.path.exists(STAGED_LOG) else {}
        log[doc_id] = {"task": spec.get("task"), "draft": new["_id"], "transaction": res.get("transactionId")}
        with open(STAGED_LOG, "w") as f:
            json.dump(log, f, ensure_ascii=False, indent=2, sort_keys=True)
            f.write("\n")
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["export", "resolve", "check", "write"])
    ap.add_argument("args", nargs="+")
    ap.add_argument("--from", dest="src", default="published", choices=["published", "draft"])
    ap.add_argument("--field", default=None)
    ap.add_argument("--locale", default=None)
    ap.add_argument("--refresh-index", action="store_true")
    a = ap.parse_args()
    site = ptmd.Site(refresh=a.refresh_index)
    if a.cmd == "export":
        pub, draft = fetch(a.args[0])
        doc = draft if a.src == "draft" else pub
        if not doc:
            sys.exit(f"no {a.src} version of {a.args[0]}")
        field = a.field or ("overview" if doc["_type"] == "city" else "body")
        if field_locales(doc, field):
            for e in doc[field]:
                if a.locale and e["_key"] != a.locale:
                    continue
                print(f"<!-- {doc['_id']} {field} [{e['_key']}] -->")
                print(ptmd.export(e["value"], site, e["_key"]))
        else:
            loc = doc.get("language", "en")
            print(f"<!-- {doc['_id']} {field} [{loc}] -->")
            print(ptmd.export(doc.get(field) or [], site, loc))
        return
    if a.cmd == "resolve":
        print(site.resolve(a.args[0], a.args[1]))
        return
    failed = False
    for d in a.args:
        spec, out, draft, errors, warnings, info = build(d, site)
        print(f"== {d} ({spec['doc']})")
        for i in info:
            print("  ·", i)
        for w in warnings:
            print("  ! warning:", w)
        for e in errors:
            print("  ✗", e)
        if errors:
            failed = True
            continue
        res = write(spec, out, draft, dry=(a.cmd == "check"))
        print("  ✓", "dry run ok" if a.cmd == "check" else f"written drafts.{spec['doc']}", res.get("transactionId", ""))
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
