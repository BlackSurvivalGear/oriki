#!/usr/bin/env python3
"""ORÍKÌ public AI news ingestion.

Aggregates curated RSS/Atom feeds plus optional public news APIs. Images are
read from RSS media fields first and article OpenGraph metadata second. API
credentials are read only from environment variables and are never written to
the frontend. The workflow keeps source URLs and requires review before merge.
"""
from __future__ import annotations

import hashlib
import html
import json
import os
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NEWS_JSON = ROOT / "data" / "news.json"
NEWS_JS = ROOT / "news.js"
AUTO_JS = ROOT / "auto-intelligence.js"

FEEDS = [
    ("OpenAI", "https://openai.com/news/rss.xml", "OPENAI"),
    ("Google", "https://blog.google/feed/", "GOOGLE"),
    ("Google DeepMind", "https://deepmind.google/blog/feed/basic/", "DEEPMIND"),
    ("Hugging Face", "https://huggingface.co/blog/feed.xml", "HUGGING FACE"),
    ("TechCrunch", "https://techcrunch.com/tag/artificial-intelligence/feed/", "TECHCRUNCH"),
    ("VentureBeat", "https://venturebeat.com/category/ai/feed/", "VENTUREBEAT"),
    ("MIT Technology Review", "https://www.technologyreview.com/feed/", "MITTR"),
    ("The Verge", "https://www.theverge.com/rss/index.xml", "THE VERGE"),
    ("MIT News AI", "https://news.mit.edu/rss/topic/artificial-intelligence2", "MIT NEWS"),
    ("arXiv AI", "http://export.arxiv.org/rss/cs.AI", "ARXIV"),
    ("IEEE Spectrum AI", "https://spectrum.ieee.org/feeds/topic/artificial-intelligence.rss", "IEEE"),
    ("Microsoft AI", "https://blogs.microsoft.com/ai/feed/", "MICROSOFT"),
    ("Meta AI", "https://ai.meta.com/blog/rss/", "META"),
]

RELEASE_TERMS = re.compile(
    r"\b(introducing|introduces|launch|launches|launched|release|released|available|announcing|announced|new model|new ai|new system|agent|foundation model|open model|reasoning model|generative|artificial intelligence|ai)\b",
    re.I,
)

NS = {
    "media": "http://search.yahoo.com/mrss/",
    "content": "http://purl.org/rss/1.0/modules/content/",
    "dc": "http://purl.org/dc/elements/1.1/",
}


def fetch(url: str, timeout: int = 20) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "ORIKI-AI-NewsBot/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return response.read()


def clean(text: str) -> str:
    text = html.unescape(text or "")
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", text)).strip()


def first_image(item: ET.Element) -> str:
    for el in item.findall("media:content", NS) + item.findall("media:thumbnail", NS):
        url = el.attrib.get("url", "")
        if url and url.startswith("http"):
            return url
    for el in item.findall("enclosure"):
        url = el.attrib.get("url", "")
        kind = el.attrib.get("type", "")
        if url.startswith("http") and (kind.startswith("image/") or re.search(r"\.(?:jpe?g|png|webp)(?:\?|$)", url, re.I)):
            return url
    return ""


def og_image(url: str) -> str:
    """Best-effort OpenGraph image fallback; failure never blocks ingestion."""
    try:
        raw = fetch(url, timeout=8).decode("utf-8", "ignore")[:350_000]
        for pattern in (
            r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)',
            r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
            r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)',
        ):
            match = re.search(pattern, raw, re.I)
            if match:
                return urllib.parse.urljoin(url, html.unescape(match.group(1)))
    except Exception:
        pass
    return ""


def parse_feed(raw: bytes, source: str, source_tag: str) -> list[dict]:
    root = ET.fromstring(raw)
    rows = []
    atom_ns = "{http://www.w3.org/2005/Atom}"
    rss_items = root.findall(".//item")
    if rss_items:
        for item in rss_items[:25]:
            rows.append({
                "title": clean(item.findtext("title", "")),
                "link": clean(item.findtext("link", "")),
                "summary": clean(item.findtext("description", "")),
                "date": clean(item.findtext("pubDate", "")),
                "image": first_image(item),
            })
    else:
        for item in root.findall(f".//{atom_ns}entry")[:25]:
            title = clean(item.findtext(f"{atom_ns}title", ""))
            link_el = item.find(f"{atom_ns}link")
            link = link_el.attrib.get("href", "") if link_el is not None else ""
            rows.append({
                "title": title,
                "link": link,
                "summary": clean(item.findtext(f"{atom_ns}summary", "") or item.findtext(f"{atom_ns}content", "")),
                "date": clean(item.findtext(f"{atom_ns}published", "") or item.findtext(f"{atom_ns}updated", "")),
                "image": "",
            })

    output = []
    for row in rows:
        title, link = row["title"], row["link"]
        if not title or not link:
            continue
        if source_tag != "ARXIV" and not RELEASE_TERMS.search(title + " " + row["summary"]):
            continue
        category = classify(title, source_tag)
        output.append({
            "id": "feed-" + hashlib.sha1(link.encode()).hexdigest()[:12],
            "title": title,
            "source": source,
            "date": row["date"][:80] or datetime.now(timezone.utc).isoformat(),
            "category": category,
            "summary": row["summary"][:500],
            "url": link,
            "image": row["image"],
            "related": [],
        })
    return output


def classify(title: str, tag: str) -> str:
    t = title.lower()
    if any(x in t for x in ("africa", "african", "nigeria", "kenya", "ghana", "south africa")):
        return "AFRICA"
    if any(x in t for x in ("policy", "regulation", "law", "government", "act")):
        return "POLICY"
    if any(x in t for x in ("robot", "robotics")):
        return "ROBOTICS"
    if any(x in t for x in ("open source", "open-source", "github", "hugging face")):
        return "OPEN SOURCE"
    if tag == "ARXIV" or any(x in t for x in ("research", "study", "paper", "science")):
        return "RESEARCH"
    if any(x in t for x in ("model", "gemini", "gpt", "claude", "llm", "reasoning")):
        return "MODELS"
    if any(x in t for x in ("business", "funding", "investment", "acquire", "acquisition")):
        return "BUSINESS"
    if any(x in t for x in ("tool", "app", "platform", "agent")):
        return "TOOLS"
    return "NEW RELEASES"


def api_items() -> tuple[list[dict], list[str]]:
    items: list[dict] = []
    failures: list[str] = []
    query = '"artificial intelligence" OR "generative AI" OR "AI model"'

    gnews_key = os.getenv("GNEWS_API_KEY")
    if gnews_key:
        try:
            url = "https://gnews.io/api/v4/search?" + urllib.parse.urlencode({"q": query, "lang": "en", "max": 50, "apikey": gnews_key})
            payload = json.loads(fetch(url).decode("utf-8"))
            for article in payload.get("articles", []):
                items.append(api_item(article.get("title"), article.get("description"), article.get("url"), article.get("image"), article.get("publishedAt"), article.get("source", {}).get("name", "GNews")))
        except Exception as exc:
            failures.append(f"GNews: {exc}")

    newsapi_key = os.getenv("NEWSAPI_API_KEY")
    if newsapi_key:
        try:
            url = "https://newsapi.org/v2/everything?" + urllib.parse.urlencode({"q": query, "language": "en", "pageSize": 50, "sortBy": "publishedAt", "apiKey": newsapi_key})
            payload = json.loads(fetch(url).decode("utf-8"))
            for article in payload.get("articles", []):
                items.append(api_item(article.get("title"), article.get("description"), article.get("url"), article.get("urlToImage"), article.get("publishedAt"), article.get("source", {}).get("name", "NewsAPI")))
        except Exception as exc:
            failures.append(f"NewsAPI: {exc}")

    guardian_key = os.getenv("GUARDIAN_API_KEY")
    if guardian_key:
        try:
            url = "https://content.guardianapis.com/search?" + urllib.parse.urlencode({"q": "artificial intelligence", "section": "technology", "order-by": "newest", "page-size": 50, "show-fields": "thumbnail,trailText", "api-key": guardian_key})
            payload = json.loads(fetch(url).decode("utf-8"))
            for article in payload.get("response", {}).get("results", []):
                fields = article.get("fields", {})
                items.append(api_item(article.get("webTitle"), fields.get("trailText"), article.get("webUrl"), fields.get("thumbnail"), article.get("webPublicationDate"), "The Guardian"))
        except Exception as exc:
            failures.append(f"Guardian API: {exc}")

    # GDELT DOC is public and requires no API key.
    try:
        url = "https://api.gdeltproject.org/api/v2/doc/doc?" + urllib.parse.urlencode({"query": query, "mode": "artlist", "format": "json", "maxrecords": 50, "sort": "datedesc"})
        payload = json.loads(fetch(url).decode("utf-8"))
        for article in payload.get("articles", []):
            items.append(api_item(article.get("title"), article.get("seendate"), article.get("url"), article.get("socialimage"), article.get("seendate"), article.get("domain", "GDELT")))
    except Exception as exc:
        failures.append(f"GDELT: {exc}")

    return [x for x in items if x.get("title") and x.get("url")], failures


def api_item(title: str, summary: str, url: str, image: str, date: str, source: str) -> dict:
    return {
        "id": "feed-" + hashlib.sha1(str(url).encode()).hexdigest()[:12],
        "title": clean(title),
        "source": clean(source) or "Public News API",
        "date": date or datetime.now(timezone.utc).isoformat(),
        "category": classify(title or "", "API"),
        "summary": clean(summary)[:500],
        "url": url,
        "image": image or "",
        "related": [],
    }


def candidate_from(item: dict, source: str) -> dict:
    title = item["title"]
    name = re.sub(r"^(introducing|announcing|launching|new)\s+", "", title, flags=re.I)
    name = re.split(r"[—–:]", name, maxsplit=1)[0].strip()
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")[:48] or item["id"]
    cid = "auto-" + hashlib.sha1(item["url"].encode()).hexdigest()[:12]
    return {"id": cid, "name": name.upper(), "provider": source, "type": "AI Platform", "category": "Auto-detected", "capabilities": [], "purposes": [], "description": item["summary"] or title, "url": item["url"], "status": "AUTO-DETECTED", "source": item["url"], "detectedDate": datetime.now(timezone.utc).date().isoformat(), "slug": slug}


def load_existing_candidates() -> dict[str, dict]:
    if not AUTO_JS.exists():
        return {}
    raw = AUTO_JS.read_text(encoding="utf-8")
    match = re.search(r"window\.ORIKI_AUTO_INTELLIGENCE\s*=\s*(\[.*\]);?\s*$", raw, re.S)
    if not match:
        return {}
    try:
        return {item["id"]: item for item in json.loads(match.group(1)) if item.get("id")}
    except (json.JSONDecodeError, KeyError, TypeError):
        return {}


def main() -> None:
    news = json.loads(NEWS_JSON.read_text(encoding="utf-8")) if NEWS_JSON.exists() else []
    by_id = {item["id"]: item for item in news}
    candidates = load_existing_candidates()
    failures = []

    for source, url, tag in FEEDS:
        try:
            for item in parse_feed(fetch(url), source, tag):
                by_id[item["id"]] = item
                if not item.get("image") and len(by_id) <= 45:
                    item["image"] = og_image(item["url"])
                if source != "arXiv AI" and RELEASE_TERMS.search(item["title"]):
                    c = candidate_from(item, source)
                    candidates[c["id"]] = c
        except Exception as exc:
            failures.append(f"{source}: {exc}")

    api_news, api_failures = api_items()
    failures.extend(api_failures)
    for item in api_news:
        by_id[item["id"]] = item
        if not item.get("image") and len(by_id) <= 45:
            item["image"] = og_image(item["url"])

    merged_news = sorted(by_id.values(), key=lambda x: str(x.get("date", "")), reverse=True)[:180]
    NEWS_JSON.write_text(json.dumps(merged_news, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    NEWS_JS.write_text("window.ORIKI_NEWS = " + json.dumps(merged_news, indent=2, ensure_ascii=False) + ";\n", encoding="utf-8")
    AUTO_JS.write_text("window.ORIKI_AUTO_INTELLIGENCE = " + json.dumps(list(candidates.values()), indent=2, ensure_ascii=False) + ";\n", encoding="utf-8")

    if failures:
        print("Feed/API warnings:")
        for failure in failures:
            print(" -", failure)
    print(f"ORÍKÌ scan complete: {len(merged_news)} news items, {len(candidates)} auto-detected candidates.")


if __name__ == "__main__":
    main()
