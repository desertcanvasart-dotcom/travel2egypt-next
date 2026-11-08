#!/usr/bin/env python3
"""Publish Phase 1 drafts the way Studio does (Sanity Actions API, publish action).

  publish.py plan  ID...     show what would be published (no writes)
  publish.py write ID...     publish each drafts.<ID>; logs to docs/phase1/published.json

Refuses a draft that still contains a [VERIFY: …] placeholder, and one whose draft
revision changed between the check and the publish (ifDraftRevisionId).
"""
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ptmd  # noqa: E402

LOG = os.path.join(ptmd.ROOT, "docs/phase1/published.json")
URL = "https://ufallvd2.api.sanity.io/v2025-02-19/data/actions/" + ptmd.DATASET


def act(actions):
    out = subprocess.run(["curl", "-sS", "-X", "POST", URL, "-H", "Content-Type: application/json",
                          "--data-binary", "@-"], input=json.dumps({"actions": actions}).encode(),
                         capture_output=True, check=True)
    res = json.loads(out.stdout)
    if "error" in res:
        raise RuntimeError(json.dumps(res["error"])[:2000])
    return res


def main():
    cmd, ids = sys.argv[1], sys.argv[2:]
    log = json.load(open(LOG)) if os.path.exists(LOG) else {}
    for i in ids:
        d = ptmd.groq("*[_id==$d][0]", d="drafts." + i)
        if not d:
            print(f"skip {i}: no draft")
            continue
        if "[VERIFY" in json.dumps(d, ensure_ascii=False):
            print(f"REFUSE {i}: draft contains [VERIFY]")
            continue
        if cmd == "plan":
            print(f"would publish {i} ({d['_type']}, draft rev {d['_rev']})")
            continue
        res = act([{"actionType": "sanity.action.document.publish", "draftId": "drafts." + i,
                    "publishedId": i, "ifDraftRevisionId": d["_rev"]}])
        log[i] = {"type": d["_type"], "draft_rev": d["_rev"], "transaction": res.get("transactionId"),
                  "date": "2026-09-26"}
        print(f"published {i} {res.get('transactionId')}")
        with open(LOG, "w") as f:
            json.dump(log, f, ensure_ascii=False, indent=1)
            f.write("\n")


if __name__ == "__main__":
    main()
