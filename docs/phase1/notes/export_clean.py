#!/usr/bin/env python3
"""Export published blog articles as clean, standard Markdown (Phase 1 Step 4).

Read-only: GROQ queries only, never writes to Sanity.

  python3 docs/phase1/notes/export_clean.py sillage     # Task 12
  python3 docs/phase1/notes/export_clean.py budget      # Task 18

Links become absolute https://travel2egypt.org URLs in the linked document's
own locale (an ES post linking to an ES post keeps the /es/... URL). Headings,
lists, bold and italic are standard Markdown. Images become ![alt](cdn url).
Hotel names (Task 18) and prices get [VERIFY] markers when --verify is set.
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, os.path.join(ROOT, "scripts/phase1"))
import ptmd  # noqa: E402

BASE = "https://travel2egypt.org"
CDN = "https://cdn.sanity.io/images/ufallvd2/production/"

SILLAGE = [
    ("egypt-luxury-travel", "https://sillage-egypte.com/journal/is-luxury-egypt-worth-it"),
    ("the-luxurious-egyptian-vacation", "https://sillage-egypte.com/journal/is-luxury-egypt-worth-it"),
    ("luxury-resorts-in-egypt", "https://sillage-egypte.com/journal/best-luxury-resorts-red-sea"),
    ("egypt-luxury-beach-resorts", "https://sillage-egypte.com/journal/best-luxury-resorts-red-sea"),
    ("luxury-nile-cruise", "https://sillage-egypte.com/journal/best-luxury-nile-cruises"),
    ("boutique-nile-cruises-in-egypt", "https://sillage-egypte.com/journal/best-luxury-nile-cruises"),
    ("experiencing-egypt-aboard-the-oberoi-zahra", "https://sillage-egypte.com/journal/best-luxury-nile-cruises"),
    ("historical-hotels-in-egypt", "https://sillage-egypte.com/journal/historic-hotels-of-egypt"),
    ("boutique-hotels-in-egypt", "https://sillage-egypte.com/journal/luxury-villas-egypt"),
    ("how-to-choose-the-right-egyptian-airport-for-your-private-flight",
     "https://sillage-egypte.com/journal/private-jet-and-helicopter-egypt"),
    ("a-helicopter-adventure-over-the-pyramids-and-nile",
     "https://sillage-egypte.com/journal/private-jet-and-helicopter-egypt"),
    ("exclusive-access-to-the-giza-pyramid", "https://sillage-egypte.com/journal/pyramids-without-crowds"),
]

PROJ = ('{_id,_type,language,title,deck,"slug":slug.current,publishedAt,updatedAt,_updatedAt,'
        '"wpModifiedAt":migration.wpModifiedAt,"wpUrl":migration.wpUrl,heroImage,body,'
        '"metaDescription":seo.metaDescription,'
        '"category":category->{_id,"title":name[_key=="en"][0].value,"slug":slug[_key=="en"][0].value.current}}')


def cdn_url(ref):
    m = re.match(r"image-([0-9a-f]+)-(\d+x\d+)-(\w+)$", ref or "")
    return f"{CDN}{m.group(1)}-{m.group(2)}.{m.group(3)}" if m else None


def locale_url(site, doc_id, locale):
    if site.type.get(doc_id) == "article":
        p = site.url.get((doc_id, site.article_lang.get(doc_id)))
    else:
        p = site.url.get((doc_id, locale)) or site.url.get((doc_id, "en"))
    return BASE + p if p else None


def esc(t):
    t = re.sub(r"([\\*_\[\]<>`])", r"\\\1", t)
    return t.replace("\n", "  \n")


def inline(block, site, locale, unresolved):
    defs = {d["_key"]: d for d in block.get("markDefs") or []}
    spans = []
    for c in block.get("children") or []:
        if c.get("_type") != "span" or not c.get("text"):
            continue
        m = tuple(c.get("marks") or [])
        if spans and spans[-1][1] == m:
            spans[-1] = (spans[-1][0] + c["text"], m)
        else:
            spans.append((c["text"], m))

    def deco(text, marks):
        lead = re.match(r"^\s*", text).group(0)
        trail = re.search(r"\s*$", text).group(0)
        core = text.strip()
        if not core:
            return text
        s = esc(core)
        if "em" in marks:
            s = f"*{s}*"
        if "strong" in marks:
            s = f"**{s}**"
        return lead + s + trail

    out, i = [], 0
    while i < len(spans):
        text, marks = spans[i]
        link = next((m for m in marks if m in defs), None)
        if not link:
            out.append(deco(text, marks))
            i += 1
            continue
        group = []
        while i < len(spans) and link in spans[i][1]:
            group.append(spans[i])
            i += 1
        inner = "".join(deco(t, [m for m in ms if m != link]) for t, ms in group)
        d = defs[link]
        if d["_type"] == "internalLink":
            ref = (d.get("reference") or {}).get("_ref")
            url = locale_url(site, ref, locale)
            if not url:
                unresolved.append(ref)
                url = f"ref:{ref}"
        else:
            url = d.get("href") or ""
            if url.startswith("/"):
                url = BASE + url
        out.append(f"[{inner}]({url})")
    return "".join(out)


def to_md(doc, site, locale):
    lines, images, unresolved = [], [], []
    prev_list = False
    for b in doc.get("body") or []:
        if b.get("_type") == "image":
            ref = (b.get("asset") or {}).get("_ref")
            images.append({"role": "body", "block_key": b.get("_key"), "asset_ref": ref,
                           "alt": b.get("alt") or "", "caption": b.get("caption") or "", "url": cdn_url(ref)})
            md = f"![{(b.get('alt') or '').replace(']', '')}]({cdn_url(ref)})"
            if b.get("caption"):
                md += f"\n\n*{esc(b['caption'])}*"
            is_list = False
        elif b.get("_type") == "block":
            text = inline(b, site, locale, unresolved).strip()
            if not text:
                continue
            style = b.get("style") or "normal"
            is_list = bool(b.get("listItem"))
            if is_list:
                ind = "  " * ((b.get("level") or 1) - 1)
                md = ind + ("- " if b["listItem"] == "bullet" else "1. ") + text
            elif style in ("h2", "h3", "h4"):
                md = "#" * int(style[1]) + " " + text
            elif style == "blockquote":
                md = "> " + text
            else:
                md = text
        else:
            md = f"<!-- unsupported block {b.get('_type')} {b.get('_key')} -->"
            is_list = False
        if lines:
            lines.append("\n" if (is_list and prev_list) else "\n\n")
        lines.append(md)
        prev_list = is_list
    return "".join(lines) + "\n", images, unresolved


def yq(v):
    if v is None:
        return "null"
    return json.dumps(v, ensure_ascii=False)


def front_matter(doc, site, images, extra):
    hero = doc.get("heroImage") or {}
    href = (hero.get("asset") or {}).get("_ref")
    all_imgs = []
    if href:
        all_imgs.append({"role": "hero", "asset_ref": href, "alt": hero.get("alt") or "",
                         "caption": hero.get("caption") or "", "url": cdn_url(href)})
    all_imgs += images
    fm = ["---",
          f"title: {yq(doc['title'])}",
          f"deck: {yq(doc.get('deck'))}",
          f"meta_description: {yq(doc.get('metaDescription'))}",
          f"original_url: {yq(locale_url(site, doc['_id'], doc['language']))}",
          f"language: {doc['language']}",
          f"slug: {yq(doc['slug'])}",
          f"published_at: {yq(doc.get('publishedAt'))}",
          f"updated_at: {yq(doc.get('updatedAt'))}  # article.updatedAt (unset on all these posts)",
          f"wp_modified_at: {yq(doc.get('wpModifiedAt'))}  # last WordPress edit, from migration metadata",
          f"sanity_updated_at: {yq(doc.get('_updatedAt'))}  # last Sanity write (includes migration edits)",
          f"legacy_wp_url: {yq(doc.get('wpUrl'))}",
          f"sanity_id: {doc['_id']}"]
    for k, v in extra.items():
        fm.append(f"{k}: {yq(v)}")
    cat = doc.get("category") or {}
    fm.append(f"category: {yq((cat.get('title') or '') + ' (' + (cat.get('slug') or '') + ')')}")
    fm.append("images:")
    if not all_imgs:
        fm[-1] = "images: []"
    for im in all_imgs:
        fm.append(f"  - role: {im['role']}")
        if im.get("block_key"):
            fm.append(f"    block_key: {im['block_key']}")
        fm.append(f"    asset_ref: {im['asset_ref']}")
        fm.append(f"    alt: {yq(im['alt'])}")
        if im.get("caption"):
            fm.append(f"    caption: {yq(im['caption'])}")
        fm.append(f"    url: {im['url']}")
    fm.append("---")
    return "\n".join(fm) + "\n\n"


PRICE_RE = re.compile(
    r"((?:US\s?\$|\$|€|£|EGP\s?|E£\s?|LE\s?)\s?\d[\d,.]*(?:\s?(?:[-–]|to)\s?(?:US\s?\$|\$|€|£|EGP\s?|E£\s?|LE\s?)?\d[\d,.]*)?"
    r"(?:\s?(?:USD|EGP|EUR|dollars?|pounds?|euros?))?"
    r"|\d[\d,.]*(?:\s?(?:[-–]|to)\s?\d[\d,.]*)?\s?(?:USD|EGP|EUR|US dollars|dollars|euros|ドル|米ドル|ユーロ|エジプトポンド|dólares|euros|libras egipcias))")


def mark_prices(md):
    out = []
    for line in md.split("\n"):
        if line.startswith("![") or line.startswith("#"):
            out.append(line)
            continue
        out.append(PRICE_RE.sub(lambda m: m.group(0) + " [VERIFY: price]", line))
    return "\n".join(out)


# The post names no budget hotel and quotes no price (checked 2026-09-26). The only
# property named in any locale is the Mena House (as the high-end contrast).
HOTEL_NAMES = ["Marriott Mena House", "Mena House", "メナハウス"]


def mark_hotels(md):
    out = []
    for line in md.split("\n"):
        if line.startswith("#"):
            # a heading that is itself a hotel name
            if any(h in line for h in HOTEL_NAMES):
                line += " [VERIFY: name, still operating]"
            out.append(line)
            continue
        for h in HOTEL_NAMES:
            if h in line:
                line = line.replace(h, h + " [VERIFY: name, still operating]", 1)
                break
        out.append(line)
    return "\n".join(out)


def fetch_group(en_slug):
    return ptmd.groq('*[_type=="article" && language=="en" && slug.current==$s && !(_id in path("drafts.**"))][0]'
                     '{"en":_id,"tr":*[_type=="translation.metadata" && references(^._id)][0]'
                     '.translations[]{_key,"id":value._ref}}', s=en_slug)


def fetch_doc(doc_id):
    return ptmd.groq(f'*[_id==$id][0]{PROJ}', id=doc_id)


def main():
    mode = sys.argv[1]
    site = ptmd.Site()
    report = []
    if mode == "sillage":
        outdir = os.path.join(ROOT, "docs/phase1/export/sillage")
        os.makedirs(outdir, exist_ok=True)
        for en_slug, dest in SILLAGE:
            g = fetch_group(en_slug)
            ids = {t["_key"]: t["id"] for t in g["tr"]}
            for loc in ("en", "es", "ja"):
                if loc not in ids:
                    report.append(f"MISSING {loc} {en_slug}")
                    continue
                doc = fetch_doc(ids[loc])
                body, images, unresolved = to_md(doc, site, loc)
                extra = {"en_slug": en_slug,
                         "planned_sillage_destination": dest if loc == "en" else (
                             f"{dest}  # EN destination; Sillage ES equivalent TBC" if loc == "es" else
                             "none: Sillage has no Japanese. Decision needed (see docs/phase1/notes/task12.md)"),
                         "translation_group": ids}
                fname = f"{en_slug}.md" if loc == "en" else f"{en_slug}.{loc}.md"
                with open(os.path.join(outdir, fname), "w") as f:
                    f.write(front_matter(doc, site, images, extra))
                    f.write(f"# {esc(doc['title'])}\n\n")
                    f.write(body)
                report.append(f"{fname}\t{ids[loc]}\t{doc['slug']}\timages={len(images)+1}\tunresolved={unresolved}")
    elif mode == "budget":
        outdir = os.path.join(ROOT, "docs/phase1/export")
        os.makedirs(outdir, exist_ok=True)
        ids = {"en": "wp-post-152394-en", "es": "wp-post-153543-es", "ja": "wp-post-167171-ja"}
        for loc, did in ids.items():
            doc = fetch_doc(did)
            body, images, unresolved = to_md(doc, site, loc)
            n_price = len(PRICE_RE.findall(body))
            body = mark_hotels(mark_prices(body))
            extra = {"planned_destination": "affordegypt.com (URL not yet decided; redirect not added)",
                     "translation_group": ids,
                     "verify_note": ("Hotel names carry [VERIFY: name, still operating]; prices carry [VERIFY: price]. "
                                            "The post has no hotel-by-hotel headings and no prices; the only named "
                                            "property is the Mena House (high-end contrast).")}
            fname = "budget-hotels-near-the-pyramids" + ("" if loc == "en" else "." + loc) + ".md"
            with open(os.path.join(outdir, fname), "w") as f:
                f.write(front_matter(doc, site, images, extra))
                f.write(f"# {esc(doc['title'])}\n\n")
                f.write(body)
            report.append(f"{fname}\t{did}\t{doc['slug']}\timages={len(images)+1}\tprices={n_price}\tunresolved={unresolved}")
    print("\n".join(report))


if __name__ == "__main__":
    main()
