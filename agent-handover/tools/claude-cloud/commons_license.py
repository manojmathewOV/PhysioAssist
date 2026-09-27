"""Wikimedia Commons helpers for public test clips.

  python3 commons_license.py search "arm raise exercise" "knee bend"
  python3 commons_license.py info "File:Example.webm"

Prints licence, author and URL so provenance can be recorded before a clip is used.
"""
import json, sys, time, urllib.error, urllib.parse, urllib.request

UA = "PhysioAssistFixtureBot/0.1 (test-fixture search; contact via repo manojmathewOV/PhysioAssist)"


def get(params, tries=6):
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({**params, "format": "json", "maxlag": "5"})
    for i in range(tries):
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            wait = int(e.headers.get("Retry-After", 0) or 0) or 20 * (i + 1)
            print(f"  HTTP {e.code}, waiting {wait}s", file=sys.stderr)
            time.sleep(wait)
    raise SystemExit("gave up")


def search(queries):
    for q in queries:
        d = get({"action": "query", "list": "search", "srsearch": f"{q} filetype:video", "srnamespace": 6, "srlimit": 15})
        print("==", q)
        for r in d["query"]["search"]:
            print("  ", r["title"], r.get("size"))
        time.sleep(5)


def info(titles):
    d = get({"action": "query", "titles": "|".join(titles), "prop": "imageinfo",
             "iiprop": "url|size|mime|sha1|extmetadata|mediatype",
             "iiextmetadatafilter": "LicenseShortName|LicenseUrl|Artist|Credit|UsageTerms|AttributionRequired|ImageDescription"})
    for p in d["query"]["pages"].values():
        ii = p.get("imageinfo", [{}])[0]
        m = ii.get("extmetadata", {})
        v = lambda k: (m.get(k, {}).get("value") or "")[:160]
        print("==", p["title"])
        print("   url:", ii.get("url"))
        print("   size:", ii.get("size"), ii.get("width"), "x", ii.get("height"), ii.get("mime"), "dur", ii.get("duration"))
        print("   license:", v("LicenseShortName"), v("LicenseUrl"))
        print("   artist:", v("Artist"))


if __name__ == "__main__":
    {"search": search, "info": info}[sys.argv[1]](sys.argv[2:])
