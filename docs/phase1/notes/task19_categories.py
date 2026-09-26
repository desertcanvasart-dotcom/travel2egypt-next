#!/usr/bin/env python3
"""Task 19: build docs/phase1/categories-proposal.csv and categories-redirects.csv (read-only).

  python3 docs/phase1/notes/task19_categories.py

Reads published EN articles, their categories and ES/JA versions from Sanity (GROQ only),
applies the hand-made PROPOSED map below, and writes the two CSVs.
"""
import collections
import csv
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, os.path.join(ROOT, "scripts/phase1"))
import ptmd  # noqa: E402

# Proposed categories: key -> (EN name, EN slug, ES name, ES slug, JA name, JA slug)
CATS = {
    "PLAN": ("Planning & Itineraries", "planning-and-itineraries", "Planificación e itinerarios",
             "planificacion-e-itinerarios", "旅の計画と旅程", "planning-and-itineraries"),
    "PRAC": ("Practical Egypt", "practical-egypt", "Egipto práctico", "egipto-practico",
             "旅の実用情報", "practical-egypt"),
    "NILE": ("The Nile", "the-nile", "El Nilo", "el-nilo", "ナイル", "the-nile"),
    "SITES": ("Sites & Monuments", "sites-and-monuments", "Sitios y monumentos", "sitios-y-monumentos",
              "遺跡とモニュメント", "sites-and-monuments"),
    "HIST": ("History & Egyptology", "history-and-egyptology", "Historia y egiptología",
             "historia-y-egiptologia", "歴史とエジプト学", "history-and-egyptology"),
    "CITY": ("Cairo & the Cities", "cairo-and-the-cities", "El Cairo y las ciudades", "el-cairo-y-las-ciudades",
             "カイロと都市", "cairo-and-the-cities"),
    "DESERT": ("Desert, Oases & Sinai", "desert-oases-and-sinai", "Desierto, oasis y Sinaí",
               "desierto-oasis-y-sinai", "砂漠・オアシス・シナイ", "desert-oases-and-sinai"),
    "REDSEA": ("Red Sea & Diving", "red-sea-and-diving", "Mar Rojo y buceo", "mar-rojo-y-buceo",
               "紅海とダイビング", "red-sea-and-diving"),
    "CULT": ("Culture & Food", "culture-and-food", "Cultura y gastronomía", "cultura-y-gastronomia",
             "文化と食", "culture-and-food"),
}

# EN slug -> (proposed key, reason). Posts leaving in Phase 1 get their key from FLAGS instead.
PROPOSED = {
    "total-solar-eclipse-egypt-2027": ("PLAN", "timing a trip around a dated event"),
    "egyptian-museum-citadel-and-khan-el-khalili-bazaar": ("CITY", "Cairo day (legacy tour page imported as a post)"),
    "travel-agency-in-egypt": ("PLAN", "choosing who plans the trip"),
    "historical-egypt-trips-for-families": ("PLAN", "family trip planning"),
    "best-ecolodges-in-fayoum": ("DESERT", "Fayoum oasis stays"),
    "a-visit-to-cairos-khan-el-khalili-bazaar": ("CITY", "Cairo district walk"),
    "8-day-egypt-tour-itinerary": ("PLAN", "itinerary"),
    "understanding-egyptian-hieroglyphs": ("HIST", "Egyptology"),
    "egypt-group-holidays-for-seniors": ("PLAN", "who's travelling"),
    "restaurants-in-zamalek": ("CULT", "eating out"),
    "1-day-giza-pyramids-itinerary": ("SITES", "how to walk the Giza plateau"),
    "the-best-egypt-travel-itineraries": ("PLAN", "itineraries by day count"),
    "stunning-road-tours-across-egypt-that-american-travelers-will-love": ("PLAN", "trip format"),
    "wellness-and-medical-tourism-in-egypt": ("PRAC", "health and wellbeing on the trip"),
    "egypt-transportation-tips": ("PRAC", "getting around"),
    "a-simple-guide-to-the-valley-of-the-kings": ("SITES", "Valley of the Kings"),
    "police-escorts-in-egypt": ("PRAC", "security logistics"),
    "must-visit-islamic-places-in-cairo": ("CITY", "Islamic Cairo"),
    "islamic-cairo-and-its-religious-significance": ("CITY", "Islamic Cairo"),
    "islamic-architectural-heritage-in-egypt": ("SITES", "reading monuments nationwide"),
    "the-story-of-bab-zuweila": ("CITY", "Islamic Cairo monument"),
    "cave-church-cairo": ("CITY", "Cairo (Mokattam)"),
    "the-pyramids-of-egypt": ("SITES", "pyramid fields"),
    "must-see-tombs-in-the-valley-of-the-kings": ("SITES", "Valley of the Kings"),
    "inside-the-great-pyramid-of-giza": ("SITES", "Giza"),
    "where-is-tutankhamun-now": ("HIST", "Tutankhamun"),
    "the-curse-of-king-tuts-tomb": ("HIST", "Tutankhamun"),
    "best-time-to-visit-egypt": ("PLAN", "when to go"),
    "what-is-included-in-nile-cruise-packages": ("NILE", "cruise planning"),
    "lake-nasser-cruise": ("NILE", "Lake Nasser cruise"),
    "the-definitive-guide-to-egypt-nile-cruise": ("NILE", "Nile cruise cornerstone"),
    "adventure-travel-guides": ("DESERT", "adventure is mostly desert and Sinai"),
    "sinai-desert-safaris": ("DESERT", "Sinai"),
    "are-there-crocodiles-in-the-nile-river": ("NILE", "the river itself"),
    "hot-air-balloons-ride-in-luxor-egypt": ("CITY", "Luxor experience"),
    "lake-nasser-cruises": ("NILE", "Lake Nasser cruise"),
    "bahariya-oasis-and-the-black-desert": ("DESERT", "Western Desert oasis"),
    "wadi-feiran": ("DESERT", "Sinai"),
    "egypt-holidays-from-japan": ("PLAN", "planning from a home country"),
    "diving-in-the-red-sea": ("REDSEA", "diving"),
    "remal-el-rayan-glamp": ("DESERT", "Fayoum desert camp (upscale; see Task 12 note)"),
    "hidden-gems-of-egypt": ("SITES", "lesser-known sites"),
    "siwa-salt-lakes": ("DESERT", "Siwa"),
    "egyptian-shawarma": ("CULT", "food"),
    "pack-for-a-dahabiya-nile-cruise-journey": ("NILE", "dahabiya trip (was under History)"),
    "cultural-travel-guides-in-egypt": ("CULT", "culture"),
    "myths-and-facts-about": ("HIST", "ancient Egypt myths"),
    "the-copts-of-egypt-guardians-of-an-ancient-faith": ("CULT", "living religious community"),
    "guardian-of-time-exploring-the-great-sphinx-of-giza": ("SITES", "Giza"),
    "a-history-buffs-guide-to-cairo": ("CITY", "Cairo"),
    "hollywood-vs-history-egypt-in-the-movies": ("HIST", "myth vs history"),
    "the-worlds-first-labour-strike": ("HIST", "Deir el-Medina history"),
    "egyptian-mummies": ("HIST", "Egyptology debate"),
    "was-king-tut-buried-in-a-pyramid": ("HIST", "Tutankhamun"),
    "the-story-of-king-tutankhamun-tomb": ("HIST", "Tutankhamun (Task 9 target)"),
    "the-western-desert-in-egypt": ("DESERT", "Western Desert"),
    "cinematic-guide-to-egypts-film-sites": ("SITES", "sites used by films"),
    "exploring-coptic-cairo": ("CITY", "Coptic Cairo"),
    "places-to-visit-in-cairo-at-night": ("CITY", "Cairo"),
    "october-escapes-discovering-egypt-in-autumn": ("PLAN", "when to go"),
    "enchanting-lakes-of-egypt": ("DESERT", "Fayoum/Western lakes and landscape"),
    "egyptian-textiles-museum": ("CITY", "al-Muizz, Cairo"),
    "safety-tips-while-diving-in-the-red-sea": ("REDSEA", "diving"),
    "sacred-places-in-egypt-temples-mosques-and-religious-sites-to-explore": ("SITES", "sacred sites nationwide"),
    "must-visit-museums-in-egypt": ("SITES", "museums"),
    "dahabiya-nile-cruises-wind-powered-journey": ("NILE", "dahabiya"),
    "family-adventures-in-egypt": ("PLAN", "family trip planning"),
    "best-family-resorts-in-egypt": ("REDSEA", "family resorts, mostly Red Sea (Task 11 target)"),
    "tips-for-first-time-family-visitors-to-egypt": ("PLAN", "family trip planning"),
    "types-of-dahabiya-boats": ("NILE", "dahabiya"),
    "ancient-egyptian-kings": ("HIST", "pharaohs"),
    "egyptian-gods": ("HIST", "religion of ancient Egypt"),
    "old-kingdom-pharaohs": ("HIST", "pharaohs"),
    "sinai-historical-sites": ("DESERT", "Sinai"),
    "middle-kingdom-pharaohs": ("HIST", "pharaohs"),
    "attractions-in-marsa-alam": ("REDSEA", "Red Sea coast"),
    "historical-egypt-travel": ("HIST", "history as a trip lens"),
    "traveling-to-egypt-in-august": ("PLAN", "when to go"),
    "experience-egypt-in-7-days": ("PLAN", "itinerary"),
    "2-weeks-egypt-tour-itinerary": ("PLAN", "itinerary"),
    "explore-egypt-in-10-days": ("PLAN", "itinerary"),
    "discover-egypt-in-9-days": ("PLAN", "itinerary"),
    "egypt-group-holidays-for-students": ("PLAN", "who's travelling"),
    "egypt-group-holidays-for-couples": ("PLAN", "who's travelling"),
    "group-tours-vs-private-tours": ("PLAN", "trip format"),
    "129-reasons-to-visit-karnak-temple": ("SITES", "Karnak"),
    "how-to-avoid-scams-at-giza-pyramids": ("PRAC", "touts and scams (Task 8)"),
    "4-day-egypt-travel-itinerary": ("PLAN", "itinerary"),
    "egypt-holidays-from-canada": ("PLAN", "planning from a home country"),
    "egypt-holidays-from-south-africa": ("PLAN", "planning from a home country"),
    "felucca-rides-in-egypt": ("NILE", "felucca"),
    "nubian-lodges-in-aswan-abu-simbel": ("NILE", "Aswan and Nubia stays"),
    "antique-market-in-cairo-the-diana-market": ("CITY", "Cairo market"),
    "how-to-dress-when-visiting-egypt": ("PRAC", "what to wear"),
    "egypt-scams-bargaining-tips": ("PRAC", "bargaining and scams"),
    "meet-the-pyramid-builders": ("HIST", "Egyptology"),
    "sphinxes-and-obelisks": ("HIST", "Egyptology"),
    "temples-tombs-and-the-queens": ("HIST", "queens"),
    "the-grand-egyptian-museum": ("SITES", "museum (Task 1 target)"),
    "national-museum-of-egyptian": ("SITES", "museum"),
    "cairo-weekend-escape-3-days-to-remember": ("PLAN", "Cairo itinerary"),
    "discover-the-hidden-treasures": ("REDSEA", "day trips from Hurghada"),
    "the-best-12-day-egypt-travel-itinerary": ("PLAN", "itinerary"),
    "personalize-your-egypt-adventure": ("PLAN", "building a trip"),
    "gourmet-dining-in-egypt": ("CULT", "food (was under Luxury Stay)"),
    "discovering-the-best-hotels-in-cairo": ("CITY", "where to stay in Cairo"),
    "eco-lodges-in-egypt": ("DESERT", "ecolodges are desert/oasis stays"),
    "the-evolution-of-food-in-egypt": ("CULT", "food history"),
    "explore-egypt-in-november": ("PLAN", "when to go"),
    "is-egypt-safe": ("PRAC", "safety (Task 2 target; was under Culture)"),
    "cairo-largest-market-ataba": ("CITY", "Cairo market"),
    "souq-bab-el-louk-cairos-fresh-market": ("CITY", "Cairo market"),
    "animals-in-ancient-egypt": ("HIST", "Egyptology"),
    "wonders-of-egypt-in-march-a-spring-adventure": ("PLAN", "when to go (EN doc body is Spanish)"),
    "alcohol-in-egypt": ("CULT", "drinking customs"),
    "egypt-in-may": ("PLAN", "when to go"),
    "visiting-egypt-in-july": ("PLAN", "when to go"),
    "why-january-is-the-perfect-month-to-visit-egypt": ("PLAN", "when to go"),
    "june-journeys-exploring-egypt-in-early-summer": ("PLAN", "when to go"),
    "discover-egypt-charm-in-february": ("PLAN", "when to go"),
    "why-you-should-visit-egypt-in-april": ("PLAN", "when to go"),
    "exploring-egypt-in-september": ("PLAN", "when to go"),
    "egypt-package-deals": ("PLAN", "packages (Task 15 target)"),
    "short-cairo-getaway-discover-the-magic-in-4-days": ("PLAN", "Cairo itinerary"),
    "cairo-and-alexandria-city-break": ("PLAN", "itinerary"),
    "egypt-winter-holidays": ("PLAN", "when to go"),
    "egypt-holidays-from-uk": ("PLAN", "planning from a home country"),
}

SILLAGE = {"egypt-luxury-travel", "the-luxurious-egyptian-vacation", "luxury-resorts-in-egypt",
           "egypt-luxury-beach-resorts", "luxury-nile-cruise", "boutique-nile-cruises-in-egypt",
           "experiencing-egypt-aboard-the-oberoi-zahra", "historical-hotels-in-egypt", "boutique-hotels-in-egypt",
           "how-to-choose-the-right-egyptian-airport-for-your-private-flight",
           "a-helicopter-adventure-over-the-pyramids-and-nile", "exclusive-access-to-the-giza-pyramid"}
AFFORD = {"budget-hotels-near-the-pyramids"}


def main():
    urls = json.load(open(os.path.join(ROOT, "scripts/phase1-urls.json")))
    retiring = {}
    for task, role, url in urls:
        if role == "source" and url.startswith("/blog/"):
            retiring[url[len("/blog/"):]] = task
    data = ptmd.groq('''{
      "cats": *[_type=="editorialCategory" && !(_id in path("drafts.**"))]{_id,"name":name[_key=="en"][0].value,
         "slugs":slug[]{_key,"c":value.current},"parent":parent._ref},
      "arts": *[_type=="article" && language=="en" && !(_id in path("drafts.**"))]{_id,"slug":slug.current,title,
         "cat":category._ref,"hasDraft":defined(*[_id=="drafts."+^._id][0]._id),
         "tr":*[_type=="translation.metadata" && references(^._id)][0].translations[]{_key,"id":value._ref}}
    }''')
    cats = {c["_id"]: c for c in data["cats"]}

    def cslug(c, loc="en"):
        s = {x["_key"]: x["c"] for x in c.get("slugs") or []}
        return s.get(loc) or s.get("en")

    rows, counts, old_to_new = [], collections.Counter(), collections.defaultdict(collections.Counter)
    missing = []
    for a in sorted(data["arts"], key=lambda a: a["slug"]):
        c = cats.get(a["cat"]) or {}
        tr = {t["_key"]: t["id"] for t in a.get("tr") or []}
        slug = a["slug"]
        if slug in SILLAGE:
            flag, key, reason = "moves-to-sillage (Task 12)", None, "leaves Travel2Egypt"
        elif slug in AFFORD:
            flag, key, reason = "moves-to-affordegypt (Task 18)", None, "leaves Travel2Egypt"
        elif slug in retiring:
            flag, key, reason = f"retired-phase1 (Task {retiring[slug]})", None, "redirected in Phase 1"
        else:
            flag = ""
            if slug not in PROPOSED:
                missing.append(slug)
                continue
            key, reason = PROPOSED[slug]
        cur = f"{c.get('name')} ({cslug(c)})" if c else "(none)"
        parent = cats.get(c.get("parent")) if c else None
        if key:
            counts[key] += 1
            old_to_new[a["cat"]][key] += 1
        rows.append({
            "sanity_id": a["_id"], "slug": slug, "title": a["title"], "current_category": cur,
            "current_root": f"{parent['name']} ({cslug(parent)})" if parent else "",
            "proposed_category": f"{CATS[key][0]} ({CATS[key][1]})" if key else "(n/a: leaves the blog)",
            "reason": reason, "es_id": tr.get("es", ""), "ja_id": tr.get("ja", ""), "phase1_flag": flag,
            "has_open_draft": "yes" if a["hasDraft"] else "",
        })
    if missing:
        sys.exit("no proposal for: " + ", ".join(missing))
    out = os.path.join(ROOT, "docs/phase1/categories-proposal.csv")
    with open(out, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)

    # Redirects: every current category URL -> the new category that receives most of its staying posts.
    FALLBACK = {  # categories whose staying posts don't decide it (0 staying, or the roots)
        "wp-category-76": None,          # Luxury Stay: 3 staying posts scatter (Cairo/Desert/Culture) -> /blog
        "wp-category-78": "PRAC",        # Safety: both posts retire in Phase 1 (Task 2, Task 17)
        "category-planning": "PLAN",
        "category-planning-advice": "PLAN",
        "category-destination": None,    # spans every destination category -> /blog
    }
    red = []
    summary = []
    for cid, c in sorted(cats.items(), key=lambda kv: cslug(kv[1])):
        if cid in FALLBACK:
            key = FALLBACK[cid]
        elif old_to_new[cid]:
            key = old_to_new[cid].most_common(1)[0][0]
        else:
            key = "PLAN"
        summary.append((cslug(c), c["name"], dict(old_to_new[cid]), key))
        for i, loc in enumerate(("en", "es", "ja")):
            pre = "" if loc == "en" else "/" + loc
            frm = f"{pre}/blog/category/{cslug(c, loc)}"
            to = f"{pre}/blog/category/{CATS[key][1 + 2 * i]}" if key else f"{pre}/blog"
            red.append({"from_url": frm, "to_path": to, "locale": loc, "status_code": 301,
                        "old_category_id": cid, "old_name": c["name"],
                        "split": "; ".join(f"{k}:{v}" for k, v in old_to_new[cid].most_common()) or "(no staying posts)"})
    with open(os.path.join(ROOT, "docs/phase1/categories-redirects.csv"), "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(red[0].keys()))
        w.writeheader()
        w.writerows(red)
    print("rows", len(rows), "staying", sum(counts.values()))
    for k in CATS:
        print(f"  {CATS[k][0]:28} {counts[k]}")
    print("flags", collections.Counter(r["phase1_flag"].split(" ")[0] for r in rows))
    for s in summary:
        print("  ", s)


if __name__ == "__main__":
    main()
