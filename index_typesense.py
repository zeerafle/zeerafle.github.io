"""Index the built site (_site/search.json) into Typesense. Stdlib only.

TYPESENSE_INDEX_KEY  write key scoped to the collection (GitHub secret)
TYPESENSE_HOST       default: search.host from _config.yml is passed in by the workflow
TYPESENSE_COLLECTION default: temaram_pages
"""
import html
import json
import os
import sys
import time
import urllib.error
import urllib.request

HOST = os.environ["TYPESENSE_HOST"].rstrip("/")
COLLECTION = os.getenv("TYPESENSE_COLLECTION", "temaram_pages")
KEY = os.environ["TYPESENSE_INDEX_KEY"]
SRC = os.getenv("SEARCH_JSON", "_site/search.json")
MAX_CONTENT = 30000

SCHEMA = {
    "name": COLLECTION,
    "fields": [
        {"name": "title", "type": "string"},
        {"name": "kind", "type": "string", "facet": True},
        {"name": "url", "type": "string", "index": False, "optional": True},
        {"name": "content", "type": "string"},
        {"name": "build", "type": "int64"},
    ],
}


def call(method, path, body=None, raw=False):
    data = body if isinstance(body, bytes) else json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        f"{HOST}{path}",
        data=data,
        method=method,
        headers={"X-TYPESENSE-API-KEY": KEY, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        out = r.read().decode()
    return out if raw else json.loads(out)


def main():
    with open(SRC, encoding="utf-8") as f:
        docs = json.load(f)
    if not docs:
        sys.exit("search.json is empty, refusing to wipe the index")

    build = int(time.time())
    for d in docs:
        d["content"] = html.unescape(d["content"])[:MAX_CONTENT]
        d["build"] = build

    try:
        call("GET", f"/collections/{COLLECTION}")
    except urllib.error.HTTPError as e:
        if e.code != 404:
            raise
        call("POST", "/collections", SCHEMA)
        print(f"created collection {COLLECTION}")

    jsonl = "\n".join(json.dumps(d, ensure_ascii=False) for d in docs).encode()
    res = call("POST", f"/collections/{COLLECTION}/documents/import?action=upsert", jsonl, raw=True)
    results = [json.loads(line) for line in res.splitlines()]
    bad = [r for r in results if not r.get("success")]
    if bad:
        sys.exit(f"{len(bad)} documents failed: {bad[:3]}")

    # drop pages that no longer exist
    gone = call("DELETE", f"/collections/{COLLECTION}/documents?filter_by=build:<{build}")
    print(f"indexed {len(docs)} documents, removed {gone.get('num_deleted', 0)} stale")


if __name__ == "__main__":
    main()
