#!/usr/bin/env python3
"""Phase 1 redirect rows for migration/redirect-map.csv (the site's one redirect mechanism).

  redirects.py plan                 print the rows the plan produces (no writes)
  redirects.py apply                write them into the CSV (idempotent)
  redirects.py activate --task N    turn task N's "ship after publish" comment rows
                                    into live rows (after the owner has published
                                    the merged target), repointing chains
  redirects.py activate-cross-domain --task N
                                    same for a commented cross-domain move, once the
                                    destination URL returns 200

After apply/activate run `npm run redirect-map:regenerate` and
`npm run test:redirect-map-integrity`.

Plan: docs/phase1/redirect-plan.json, a list of
  {"task": "6", "source": "/blog/…", "target": "/travel-tips/…", "mode": "live"}
  mode: live | after-publish | cross-domain (target is an absolute URL; EN only)
  optional "targets": {"es": "/es/…", "ja": null}  per-locale override (null = no row: report)

Every locale version of a source (real ES/JA URLs from docs/phase1/inventory.csv)
gets its own row to the same locale's target, never to another language.
Existing rows that point at a Phase 1 source are repointed to the final target
when that source goes live, so there are no chains. Legacy rows whose source is a
locale-less ES/JA slug (e.g. /blog/vacaciones-inolvidables-en-egipto) go to that
locale's target.
"""
import argparse
import csv
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ptmd  # noqa: E402

ROOT = ptmd.ROOT
CSV = os.path.join(ROOT, "migration/redirect-map.csv")
PLAN = os.path.join(ROOT, "docs/phase1/redirect-plan.json")
INVENTORY = os.path.join(ROOT, "docs/phase1/inventory.csv")
HEADER = "from_url,to_path,locale,status_code,legacy_wp_id,priority_score"
PENDING = "# PHASE1-SHIP-AFTER-PUBLISH task={task}: "
CROSS = "# PHASE1-CROSS-DOMAIN task={task} (ships only when {url} returns 200): "


def source_urls():
    """(task, EN brief url) -> {locale: live url} from the inventory."""
    out = {}
    for r in csv.DictReader(open(INVENTORY)):
        if r["role"] != "source" and r["role"] != "update":
            continue
        out.setdefault(r["brief_url"], {})[r["locale"]] = r["url"]
    return out


def target_url(site, target, locale):
    kind, val = site.resolve(target, locale)
    return site.url[(val, locale)] if kind == "ref" else val


def build_rows(plan, site):
    srcs = source_urls()
    rows, notes = [], []
    for p in plan:
        by_loc = srcs.get(p["source"])
        if not by_loc and p["mode"] == "cross-domain":
            by_loc = {"en": p["source"]}
        if not by_loc:
            raise SystemExit(f"{p['source']}: not in inventory")
        for loc in ptmd.LOCALES:
            src = by_loc.get(loc)
            if (not src or "(none)" in src) and p["mode"] == "cross-domain":
                notes.append(f"task {p['task']}: {p['source']} {loc} version needs its own decision; not redirected")
                continue
            if not src or "(none)" in src:
                notes.append(f"task {p['task']}: {p['source']} has no {loc} version")
                continue
            if p["mode"] == "cross-domain":
                if loc != "en" and loc not in (p.get("targets") or {}):
                    notes.append(f"task {p['task']}: {src} ({loc}) needs its own decision; not redirected")
                    continue
                tgt = (p.get("targets") or {}).get(loc, p["target"])
            elif loc in (p.get("targets") or {}):
                tgt = p["targets"][loc]
                if tgt is None:
                    notes.append(f"task {p['task']}: {src} ({loc}) has no target in {loc}; not redirected")
                    continue
            else:
                tgt = target_url(site, p["target"], loc)
            rows.append({"task": p["task"], "mode": p["mode"], "source": src, "target": tgt, "locale": loc,
                         "en_source": p["source"]})
    return rows, notes


def row_line(r):
    return f"{r['source']},{r['target']},{r['locale']},301,,0.00"


def load_csv():
    lines = open(CSV).read().split("\n")
    assert lines[0] == HEADER, "unexpected CSV header"
    return [l for l in lines[1:] if l != ""]


def norm(path):
    path = path.replace("https://travel2egypt.org", "")
    return path.rstrip("/") or "/"


def apply_rows(lines, rows, live_modes=("live",), log=print):
    """Return new CSV lines with live rows in place, pending rows commented, chains repointed."""
    live = [r for r in rows if r["mode"] in live_modes]
    pending = [r for r in rows if r["mode"] not in live_modes]
    live_sources = {(r["source"], r["locale"]): r for r in live}
    # locale-less ES/JA slugs of live sources, e.g. /blog/vacaciones-inolvidables-en-egipto
    bare = {}
    for r in live:
        if r["locale"] != "en":
            bare[r["source"][len(r["locale"]) + 1:]] = r
    out = []
    seen_live = set()
    for l in lines:
        if l.startswith("# PHASE1-"):
            body = l.split(": ", 1)[1] if ": " in l else ""
            if any(row_line(r) == body for r in live):
                continue  # being activated: dropped here, re-added as data below
            out.append(l)
            continue
        if l.startswith("#"):
            out.append(l)
            continue
        cols = l.split(",")
        frm, to, loc = norm(cols[0]), norm(cols[1]), cols[2]
        key = (frm, loc)
        if key in live_sources:
            r = live_sources[key]
            if to != r["target"]:
                log(f"replace  {l}  ->  {row_line(r)}")
            if key in seen_live:
                continue
            seen_live.add(key)
            out.append(row_line(r))
            continue
        # repoint rows that land on a live source (would be a chain)
        hit = live_sources.get((to, loc)) or next((r for (s, _), r in live_sources.items() if s == to), None)
        if frm in bare and to == norm(bare[frm]["en_source"]):
            hit = bare[frm]
        if hit:
            new = cols[:]
            new[1] = hit["target"]
            if hit["locale"] != loc and frm not in bare:
                log(f"WARNING cross-locale chain {l} (source is {hit['locale']})")
            log(f"repoint  {l}  ->  {','.join(new)}")
            out.append(",".join(new))
            continue
        out.append(l)
    for r in live:
        if (r["source"], r["locale"]) not in seen_live:
            log(f"add      {row_line(r)}")
            out.append(row_line(r))
    have = set(out)
    for r in pending:
        tpl = PENDING if r["mode"] == "after-publish" else CROSS
        line = tpl.format(task=r["task"], url=r["target"]) + row_line(r)
        if line not in have:
            log(f"comment  {line}")
            out.append(line)
    return out


def write_csv(lines):
    data = [l for l in lines if not l.startswith("#")]
    comments = [l for l in lines if l.startswith("#")]
    with open(CSV, "w") as f:
        f.write(HEADER + "\n" + "\n".join(data + comments) + "\n")


def check_targets(rows):
    bad = []
    for r in rows:
        if r["mode"] == "cross-domain":
            continue
        s = ptmd.http_status(r["target"])
        if s != "200":
            bad.append(f"{r['target']} returns {s}")
    return bad


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["plan", "apply", "activate", "activate-cross-domain"])
    ap.add_argument("--task")
    a = ap.parse_args()
    site = ptmd.Site()
    plan = json.load(open(PLAN))
    only = os.environ.get("PHASE1_TASKS")
    if only:
        plan = [p for p in plan if p["task"] in only.split(",")]
    rows, notes = build_rows(plan, site)
    for n in notes:
        print("note:", n)
    if a.cmd == "plan":
        for r in rows:
            print(r["task"], r["mode"], row_line(r))
        return
    if a.cmd.startswith("activate"):
        if not a.task:
            sys.exit("--task required")
        mode = "after-publish" if a.cmd == "activate" else "cross-domain"
        for r in rows:
            if r["task"] == a.task and r["mode"] == mode:
                r["mode"] = "live"
    bad = check_targets([r for r in rows if r["mode"] == "live"])
    if bad:
        sys.exit("targets not 200:\n  " + "\n  ".join(bad))
    new = apply_rows(load_csv(), rows)
    write_csv(new)
    print("written", CSV)
    update_audit(rows)


AUDIT = os.path.join(ROOT, "migration/seo-repairs-2026-09-22.json")


def update_audit(rows):
    """Audited aliases (test:migration-routing) whose destination is now a live
    Phase 1 source move to the final target; the old one is kept as previousDestination."""
    live = {r["source"]: r for r in rows if r["mode"] == "live"}
    d = json.load(open(AUDIT))
    n = 0
    for e in d["redirects"]:
        r = live.get(e["destination"])
        if r:
            final = r["target"]
            e["previousDestination"] = e["destination"]
            e["destination"] = final
            e["phase1"] = {"task": r["task"], "reason": "previous destination retired in Phase 1; "
                           "repointed to its final target to avoid a chain", "date": "2026-09-26"}
            n += 1
    if n:
        with open(AUDIT, "w") as f:
            json.dump(d, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"updated {n} audited aliases in {os.path.relpath(AUDIT, ROOT)}")


if __name__ == "__main__":
    main()
