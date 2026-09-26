"""Portable Text <-> Markdown for Phase 1 drafting.

The Markdown is line-based and exists so that merged copy can be written and
reviewed as plain files (the canon's "locked copy"), then staged into Sanity
drafts by stage.py. It is not CommonMark. One block per line:

  ## Heading / ### / ####      h2 / h3 / h4
  > text                       blockquote
  - item / 1. item             bullet / numbered list item (2 spaces per extra level)
  ::: keep KEY                 reuse a non-text block (image, note, list, ...) by _key
  ::: keep DOC_ID:KEY          ... from another document (e.g. an image from a source post)
  ::: note TONE                new operator note (tone: honest|caution|insider|context),
  paragraph lines              closed by a line ':::'
  :::
  anything else                a normal paragraph

Inline: **bold**, *italic*, <u>underline</u>, <br> (soft line break),
[text](/en/path) internal link, [text](ref:DOC_ID) internal link by id,
[text](https://...) external link. Backslash escapes the next character.

Link paths are written as the EN URL in every locale's file (`/blog/is-egypt-safe`);
the importer resolves them to the locale's own document (articles through their
translation.metadata group) or to the localized static route.

Blocks whose Markdown is unchanged are reused verbatim (same _key, same span
structure), so a Studio diff shows only what really changed.
"""
from __future__ import annotations

import copy
import hashlib
import json
import os
import re
import subprocess
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
API = "https://ufallvd2.api.sanity.io/v2024-01-01"
DATASET = "production"
CACHE = os.path.join(ROOT, "scripts/phase1/.cache")
LOCALES = ["en", "es", "ja"]
DECOS = ["strong", "em", "underline"]
DECO_MD = {"strong": "**", "em": "*", "underline": None}
INTERNAL_TYPES = {"city", "guideArticle", "tour", "travelTip", "article", "wikiPerson",
                  "wikiMonument", "wikiDynasty", "wikiDeity", "hotel", "nileCruise"}


# ── Sanity HTTP ──────────────────────────────────────────────────────────────

def groq(query, perspective="raw", **params):
    args = ["curl", "-sS", "--fail-with-body", "-G", f"{API}/data/query/{DATASET}",
            "--data-urlencode", f"query={query}", "--data-urlencode", f"perspective={perspective}"]
    for k, v in params.items():
        args += ["--data-urlencode", f"${k}={json.dumps(v)}"]
    out = json.loads(subprocess.check_output(args))
    if "error" in out:
        raise RuntimeError(out["error"])
    return out["result"]


def mutate(mutations, dry_run=True):
    url = f"{API}/data/mutate/{DATASET}?returnIds=true&visibility=sync"
    if dry_run:
        url += "&dryRun=true"
    out = subprocess.run(["curl", "-sS", "-X", "POST", url, "-H", "Content-Type: application/json",
                          "--data-binary", "@-"], input=json.dumps({"mutations": mutations}).encode(),
                         capture_output=True, check=True)
    res = json.loads(out.stdout)
    if "error" in res:
        raise RuntimeError(json.dumps(res["error"])[:2000])
    return res


def http_status(path):
    url = "https://travel2egypt.org" + urllib.parse.quote(path, safe="/-_.~")
    return subprocess.check_output(["curl", "-sS", "-o", "/dev/null", "-w", "%{http_code}", url]).decode()


# ── Site index (URL <-> document per locale) ─────────────────────────────────

def _routing_static():
    """Static route leaves from src/i18n/routing.ts: {en_path: {locale: path}}."""
    src = open(os.path.join(ROOT, "src/i18n/routing.ts")).read()
    out = {}
    for m in re.finditer(r"'(/[^']*)':\s*\{\s*en:\s*'([^']+)',\s*es:\s*'([^']+)',\s*ja:\s*'([^']+)'", src):
        out[m.group(1)] = {"en": m.group(2), "es": m.group(3), "ja": m.group(4)}
    for m in re.finditer(r"'(/[^']*)':\s*'(/[^']*)'", src):
        out.setdefault(m.group(1), {l: m.group(2) for l in LOCALES})
    return out


def _slug(slugs, locale):
    if isinstance(slugs, dict):
        return slugs.get("current")
    by = {s.get("_key"): ((s.get("value") or {}).get("current")) for s in slugs or []}
    return by.get(locale) or by.get("en")


class Site:
    def __init__(self, refresh=False):
        os.makedirs(CACHE, exist_ok=True)
        path = os.path.join(CACHE, "site-index.json")
        if refresh or not os.path.exists(path):
            data = groq('{"docs": *[_type in $types && !(_id in path("drafts.**"))]'
                        '{_id,_type,slug,"parent":parentCity->slug,hidden},'
                        '"articles": *[_type=="article" && !(_id in path("drafts.**"))]{_id,language,"slug":slug.current},'
                        '"tmeta": *[_type=="translation.metadata" && !(_id in path("drafts.**"))]'
                        '{"t":translations[]{_key,"r":value._ref}}}',
                        types=sorted(INTERNAL_TYPES | {"fieldGuide"}))
            json.dump(data, open(path, "w"))
        data = json.load(open(path))
        self.static = _routing_static()
        self.by_path = {}   # (locale, path) -> doc id (localized path)
        self.url = {}       # (doc id, locale) -> path
        self.type = {}
        self.hidden = set()
        self.article_lang = {}
        self.group = {}     # article id -> {locale: id}
        for a in data["articles"]:
            self.type[a["_id"]] = "article"
            self.article_lang[a["_id"]] = a["language"]
            p = ("" if a["language"] == "en" else "/" + a["language"]) + "/blog/" + (a["slug"] or "")
            self.by_path[(a["language"], p)] = a["_id"]
            self.url[(a["_id"], a["language"])] = p
        for m in data["tmeta"]:
            g = {t["_key"]: t["r"] for t in m["t"] or [] if t["r"] in self.type}
            for i in g.values():
                self.group[i] = g
        for d in data["docs"]:
            self.type[d["_id"]] = d["_type"]
            if d.get("hidden"):
                self.hidden.add(d["_id"])
            for l in LOCALES:
                pre = "" if l == "en" else "/" + l
                s = _slug(d.get("slug"), l)
                if not s:
                    continue
                t = d["_type"]
                if t == "travelTip":
                    p = f"{pre}/travel-tips/{s}"
                elif t == "city":
                    p = f"{pre}/guide/{s}"
                elif t == "guideArticle":
                    c = _slug(d.get("parent"), l)
                    if not c:
                        continue
                    p = f"{pre}/guide/{c}/{s}"
                elif t == "fieldGuide":
                    p = f"{pre}/resources/{s}"
                elif t == "tour":
                    p = f"{pre}/{s}"
                else:
                    continue
                self.by_path.setdefault((l, p), d["_id"])
                self.url[(d["_id"], l)] = p

    def resolve(self, path, locale):
        """EN (or already-localized) path -> ('ref', id) | ('href', path). Raises on unknown."""
        path = path.split("#")[0].rstrip("/") or "/"
        pre = "" if locale == "en" else "/" + locale
        if locale != "en" and (path == pre or path.startswith(pre + "/")):
            if (locale, path) in self.by_path:
                return self._as_link(self.by_path[(locale, path)], locale)
            bare = path[len(pre):] or "/"
            for en, leaves in self.static.items():
                if leaves[locale] == bare:
                    return ("href", path)
            raise KeyError(f"unknown {locale} path {path}")
        if ("en", path) in self.by_path:
            en_id = self.by_path[("en", path)]
            if locale == "en":
                return self._as_link(en_id, "en")
            if self.type[en_id] == "article":
                loc_id = self.group.get(en_id, {}).get(locale)
                if not loc_id:
                    raise KeyError(f"no {locale} version of article {path}")
                return self._as_link(loc_id, locale)
            return self._as_link(en_id, locale)
        if path in self.static:
            return ("href", pre + self.static[path][locale])
        if path == "/":
            return ("href", pre or "/")
        raise KeyError(f"unknown path {path}")

    def _as_link(self, doc_id, locale):
        if self.type.get(doc_id) in INTERNAL_TYPES:
            return ("ref", doc_id)
        return ("href", self.url[(doc_id, locale)])

    def path_for_ref(self, doc_id, locale):
        """Readable path for an internalLink, or None if that path wouldn't resolve back to it."""
        cands = []
        if self.type.get(doc_id) == "article":
            en_id = self.group.get(doc_id, {}).get("en")
            if en_id:
                cands.append(self.url.get((en_id, "en")))
            cands.append(self.url.get((doc_id, self.article_lang.get(doc_id))))
        else:
            cands += [self.url.get((doc_id, "en")), self.url.get((doc_id, locale))]
        for p in cands:
            if not p:
                continue
            try:
                if self.resolve(p, locale) == ("ref", doc_id):
                    return p
            except KeyError:
                pass
        return None


# ── Export: Portable Text -> Markdown ────────────────────────────────────────

VERIFY_RE = re.compile(r"\[VERIFY[^\[\]]*\]")


def _esc(text):
    """Escape markup characters; [VERIFY: ...] placeholders stay literal."""
    parts = []
    last = 0
    for m in VERIFY_RE.finditer(text):
        parts.append(_esc_plain(text[last:m.start()]))
        parts.append(m.group(0).replace("*", "\\*").replace("<", "\\<").replace("\n", "<br>"))
        last = m.end()
    parts.append(_esc_plain(text[last:]))
    return "".join(parts)


def _esc_plain(text):
    text = re.sub(r"([\\*\[\]<])", r"\\\1", text)
    return text.replace("\n", "<br>")


def _norm_spans(block):
    """Merge adjacent spans with identical marks; drop empty spans. Returns [(text, marks)]."""
    out = []
    for c in block.get("children") or []:
        if c.get("_type") != "span":
            raise ValueError(f"inline object {c.get('_type')} not supported")
        t = c.get("text") or ""
        m = tuple(c.get("marks") or [])
        if not t:
            continue
        if out and out[-1][1] == m:
            out[-1] = (out[-1][0] + t, m)
        else:
            out.append((t, m))
    return out


def _link_target(md, site, locale):
    if md["_type"] == "internalLink":
        ref = (md.get("reference") or {}).get("_ref")
        p = site.path_for_ref(ref, locale) if site and ref else None
        target = p or f"ref:{ref}"
        extras = {k: v for k, v in md.items() if k not in ("_key", "_type", "reference")}
        if (md.get("reference") or {}).keys() - {"_ref", "_type"}:
            extras["reference"] = md["reference"]
    elif md["_type"] == "externalLink":
        target = md.get("href") or ""
        if target.startswith("/"):
            target = "href:" + target
        extras = {k: v for k, v in md.items() if k not in ("_key", "_type", "href")}
        if extras.get("newTab") is (not target.startswith("href:")) and len(extras) == 1:
            extras = {}
        elif "newTab" not in extras:
            extras["newTab"] = None
    else:
        raise ValueError(f"markDef {md['_type']} not supported")
    return target + (" " + json.dumps(json.dumps(extras, ensure_ascii=False, sort_keys=True), ensure_ascii=False) if extras else "")


def inline_md(block, site=None, locale="en"):
    defs = {d["_key"]: d for d in block.get("markDefs") or []}
    spans = _norm_spans(block)
    out = []
    i = 0
    while i < len(spans):
        text, marks = spans[i]
        link = next((m for m in marks if m in defs), None)
        unknown = [m for m in marks if m not in defs and m not in DECOS]
        if unknown:
            raise ValueError(f"unknown marks {unknown}")
        if link:
            j = i
            group = []
            while j < len(spans) and link in spans[j][1]:
                group.append(spans[j])
                j += 1
            inner = _decorate([(t, [m for m in ms if m != link]) for t, ms in group])
            out.append(f"[{inner}]({_link_target(defs[link], site, locale)})")
            i = j
        else:
            out.append(_decorate([(text, list(marks))]))
            i += 1
    return "".join(out)


def _decorate(spans):
    out = []
    for text, marks in spans:
        opened = [m for m in DECOS if m in marks]
        pre = "".join("<u>" if m == "underline" else DECO_MD[m] for m in opened)
        post = "".join("</u>" if m == "underline" else DECO_MD[m] for m in reversed(opened))
        out.append(pre + _esc(text) + post)
    return "".join(out)


def block_md(b, site=None, locale="en"):
    """One PT block -> list of Markdown lines, or None if the block must be kept by key."""
    if b.get("_type") == "operatorNote":
        return note_md(b, site, locale)
    if b.get("_type") != "block":
        return None
    style = b.get("style") or "normal"
    try:
        text = _edge_esc(inline_md(b, site, locale))
    except ValueError:
        return None
    if b.get("listItem"):
        if style != "normal" or b["listItem"] not in ("bullet", "number"):
            return None
        ind = "  " * ((b.get("level") or 1) - 1)
        return f"{ind}{'- ' if b['listItem'] == 'bullet' else '1. '}{_lead_esc(text)}"
    if style == "normal":
        return _lead_esc(text) if text else None
    if style in ("h2", "h3", "h4"):
        return "#" * int(style[1]) + " " + text
    if style == "blockquote":
        return "> " + text
    return None


def note_md(b, site=None, locale="en"):
    """Operator note with plain-paragraph body -> '::: note TONE' ... ':::', else None."""
    if set(b.keys()) - {"_type", "_key", "tone", "body"}:
        return None
    lines = []
    for x in b.get("body") or []:
        if x.get("_type") != "block" or x.get("listItem") or (x.get("style") or "normal") != "normal":
            return None
        line = block_md(x, site, locale)
        if line is None:
            return None
        lines.append(line)
    if not lines:
        return None
    return "\n".join([f"::: note {b.get('tone') or 'honest'}"] + lines + [":::"])


def _lead_esc(text):
    if re.match(r"(#|>|- |\d+\. |:::)", text):
        text = "\\" + text
    return text


def _edge_esc(text):
    """Leading/trailing spaces survive line trimming as <sp>."""
    m = re.match(r"^( *)(.*?)( *)$", text, re.S)
    return "<sp>" * len(m.group(1)) + m.group(2) + "<sp>" * len(m.group(3))


def export(blocks, site=None, locale="en"):
    lines = []
    prev_list = False
    for b in blocks or []:
        md = block_md(b, site, locale)
        if md is None:
            md = f"::: keep {b['_key']}"
        is_list = b.get("_type") == "block" and bool(b.get("listItem")) and not md.startswith(":::")
        if lines:
            lines.append("\n" if (is_list and prev_list) else "\n\n")
        lines.append(md)
        prev_list = is_list
    return "".join(lines) + "\n"


# ── Import: Markdown -> Portable Text ────────────────────────────────────────

def _key(seed):
    return hashlib.sha1(seed.encode()).hexdigest()[:12]


class ImportError_(Exception):
    pass


def _parse_inline(s, site, locale, key_seed, errors):
    """Returns (children, markDefs)."""
    spans = []
    defs = []
    active = []
    buf = []
    link = None

    def flush():
        if buf:
            marks = [m for m in DECOS if m in active]
            if link:
                marks.append(link)
            spans.append(("".join(buf), marks))
            buf.clear()

    i = 0
    n = len(s)
    while i < n:
        c = s[i]
        if c == "\\" and i + 1 < n:
            buf.append(s[i + 1])
            i += 2
            continue
        if s.startswith("<sp>", i):
            buf.append(" ")
            i += 4
            continue
        if s.startswith("<br>", i):
            buf.append("\n")
            i += 4
            continue
        if s.startswith("<u>", i) or s.startswith("</u>", i):
            flush()
            if "underline" in active:
                active.remove("underline")
            else:
                active.append("underline")
            i += 3 if s.startswith("<u>", i) else 4
            continue
        if s.startswith("**", i):
            flush()
            active.remove("strong") if "strong" in active else active.append("strong")
            i += 2
            continue
        if c == "*":
            flush()
            active.remove("em") if "em" in active else active.append("em")
            i += 1
            continue
        if c == "[" and s.startswith("[VERIFY", i):
            j = s.find("]", i)
            if j < 0:
                errors.append(f"unclosed placeholder at {s[i:i+40]!r}")
                j = n - 1
            buf.append(s[i:j + 1])
            i = j + 1
            continue
        if c == "[" and link is None:
            # find the closing ]( at depth 0, honouring escapes
            j = i + 1
            while j < n:
                if s[j] == "\\":
                    j += 2
                    continue
                if s[j] == "]":
                    break
                j += 1
            if j >= n or not s.startswith("](", j):
                errors.append(f"unclosed link at {s[i:i+40]!r}")
                buf.append(c)
                i += 1
                continue
            k = j + 2
            m = re.match(r"([^\s)]+)(?:\s+(\"(?:[^\"\\]|\\.)*\"))?\)", s[k:])
            if not m:
                errors.append(f"bad link target at {s[k:k+60]!r}")
                buf.append(c)
                i += 1
                continue
            target, title = m.group(1), m.group(2)
            extras = json.loads(json.loads(title)) if title else {}
            mdef = _make_link(target, extras, site, locale, errors)
            flush()
            mdef["_key"] = _key(f"{key_seed}/l{len(defs)}")
            defs.append(mdef)
            link = mdef["_key"]
            inner_children, _ = None, None
            # parse inner text with the link active
            inner = s[i + 1:j]
            sub_spans, sub_defs = _parse_inline(inner, site, locale, key_seed + "/in", errors)
            for sp in sub_spans:
                spans.append((sp["text"], [m for m in sp["marks"]] + [link]))
            link = None
            i = k + m.end()
            continue
        buf.append(c)
        i += 1
    flush()
    if active:
        errors.append(f"unbalanced markers {active} in {s[:60]!r}")
    children = [{"_type": "span", "_key": _key(f"{key_seed}/s{idx}"), "text": t, "marks": ms}
                for idx, (t, ms) in enumerate(spans)] or [
        {"_type": "span", "_key": _key(f"{key_seed}/s0"), "text": "", "marks": []}]
    # _parse_inline is used recursively for link text: return spans as dicts
    return children, defs


def _make_link(target, extras, site, locale, errors):
    if target.startswith("href:"):
        md = {"_type": "externalLink", "href": target[5:], "newTab": False}
    elif target.startswith("ref:"):
        md = {"_type": "internalLink", "reference": {"_type": "reference", "_ref": target[4:]}}
    elif target.startswith("/"):
        try:
            kind, val = site.resolve(target, locale)
        except KeyError as e:
            errors.append(f"link {target}: {e}")
            kind, val = "href", target
        if kind == "ref":
            md = {"_type": "internalLink", "reference": {"_type": "reference", "_ref": val}}
        else:
            md = {"_type": "externalLink", "href": val, "newTab": False}
    else:
        md = {"_type": "externalLink", "href": target, "newTab": True}
    if "reference" in extras and md["_type"] == "internalLink":
        md["reference"] = extras.pop("reference")
    for k, v in extras.items():
        if v is None:
            md.pop(k, None)
        else:
            md[k] = v
    return md


def _block_from_line(line, site, locale, seed, errors):
    style, list_item, level, text = "normal", None, None, line
    m = re.match(r"^(#{2,4}) (.*)$", line)
    if m:
        style, text = "h" + str(len(m.group(1))), m.group(2)
    elif line.startswith("> "):
        style, text = "blockquote", line[2:]
    else:
        m = re.match(r"^( *)(- |1\. )(.*)$", line)
        if m:
            if len(m.group(1)) % 2:
                errors.append(f"odd list indent: {line[:50]!r}")
            list_item = "bullet" if m.group(2) == "- " else "number"
            level = len(m.group(1)) // 2 + 1
            text = m.group(3)
    children, defs = _parse_inline(text, site, locale, seed, errors)
    b = {"_type": "block", "_key": _key(seed), "style": style, "markDefs": defs, "children": children}
    if list_item:
        b["listItem"] = list_item
        b["level"] = level
    return b


def import_md(md, site, locale, pool, key_ns, pools_by_doc=None):
    """Markdown -> PT blocks.

    pool: blocks available for reuse (the base document's field in this locale).
    pools_by_doc: {doc_id: [blocks]} for '::: keep DOC:KEY'.
    Returns (blocks, errors).
    """
    errors = []
    by_md = {}
    by_key = {}
    for b in pool or []:
        by_key[b["_key"]] = b
        line = block_md(b, site, locale)
        if line is not None:
            by_md.setdefault(line, []).append(b)
    used = set()
    out = []
    lines = md.split("\n")
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        i += 1
        if not line.strip():
            continue
        seed = f"{key_ns}/{len(out)}/{line}"
        if line.startswith("::: keep "):
            ref = line[len("::: keep "):].strip()
            if ":" in ref:
                doc, k = ref.rsplit(":", 1)
                src = {b["_key"]: b for b in (pools_by_doc or {}).get(doc, [])}
            else:
                doc, k, src = None, ref, by_key
            if k not in src:
                errors.append(f"keep: no block {ref}")
                continue
            b = copy.deepcopy(src[k])
            if b["_key"] in used:
                b["_key"] = _key(seed)
            used.add(b["_key"])
            out.append(b)
            continue
        if line.startswith("::: note"):
            tone = line[len("::: note"):].strip() or "honest"
            start = i
            if tone not in ("honest", "caution", "insider", "context"):
                errors.append(f"bad note tone {tone}")
            body = []
            while i < len(lines) and lines[i].strip() != ":::":
                if lines[i].strip():
                    body.append(_block_from_line(lines[i].rstrip(), site, locale, f"{seed}/{len(body)}", errors))
                i += 1
            if i >= len(lines):
                errors.append("unclosed ::: note")
            i += 1
            note_text = "\n".join([line] + [l.rstrip() for l in lines[start:i - 1] if l.strip()] + [":::"])
            cands = [b for b in by_md.get(note_text, []) if b["_key"] not in used]
            if cands:
                b = copy.deepcopy(cands[0])
                used.add(b["_key"])
                out.append(b)
                continue
            for bb in body:
                if bb.get("listItem") or bb["style"] != "normal" or any(
                        d["_type"] != "externalLink" and d["_type"] != "internalLink" for d in bb["markDefs"]):
                    errors.append("operator note may only hold plain paragraphs")
            nk = _key(seed)
            while nk in used:
                nk = _key(nk)
            used.add(nk)
            out.append({"_type": "operatorNote", "_key": nk, "tone": tone, "body": body})
            continue
        if line.startswith(":::"):
            errors.append(f"unknown directive {line!r}")
            continue
        cands = [b for b in by_md.get(line, []) if b["_key"] not in used]
        if cands:
            b = copy.deepcopy(cands[0])
            used.add(b["_key"])
            out.append(b)
            continue
        b = _block_from_line(line, site, locale, seed, errors)
        while b["_key"] in used:
            b["_key"] = _key(b["_key"])
        used.add(b["_key"])
        out.append(b)
    return out, errors


def normalize_md(md):
    lines = [l.rstrip() for l in md.strip().split("\n")]
    out = []
    for l in lines:
        if not l and out and not out[-1]:
            continue
        out.append(l)
    return "\n".join(out) + "\n"


# ── Localized array helpers ──────────────────────────────────────────────────

def loc_get(arr, locale):
    for e in arr or []:
        if e.get("_key") == locale:
            return e.get("value")
    return None


def loc_set(arr, locale, value, default_type):
    arr = copy.deepcopy(arr) if arr else []
    for e in arr:
        if e.get("_key") == locale:
            e["value"] = value
            return arr
    t = next((e.get("_type") for e in arr if e.get("_type")), default_type)
    arr.append({"_key": locale, "_type": t, "value": value})
    arr.sort(key=lambda e: LOCALES.index(e["_key"]) if e["_key"] in LOCALES else 9)
    return arr
