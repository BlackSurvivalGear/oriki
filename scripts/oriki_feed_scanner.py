#!/usr/bin/env python3
"""ORÍKÌ public-feed scanner.

No API keys are required. The scanner reads public RSS/Atom feeds, keeps a
small curated news cache, and prepares conservative AI candidates for human
review through a GitHub PR. It never publishes or merges a PR itself.
"""
from __future__ import annotations

import hashlib
import json
import re
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
    ("arXiv AI", "http://export.arxiv.org/rss/cs.AI", "ARXIV"),
]

RELEASE_TERMS = re.compile(
    r"\b(introducing|introduces|launch|launches|launched|release|released|available|announcing|announced|new model|new ai|new system|agent|foundation model|open model|reasoning model|generative)\b",
    re.I,
)


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "ORIKI-AI-NewsBot/1.0"})
    with urllib.request.urlopen(req, timeout=20) as response:
        return response.read()


def clean(text: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", text or "")).strip()


def parse_feed(raw: bytes, source: str, source_tag: str) -> list[dict]:
    root = ET.fromstring(raw)
    items = []
    atom_ns = "{http://www.w3.org/2005/Atom}"
    rss_items = root.findall(".//item")
    if rss_items:
        for item in rss_items[:20]:
            title = clean(item.findtext("title", ""))
            link = clean(item.findtext("link", ""))
            summary = clean(item.findtext("description", ""))
            date = clean(item.findtext("pubDate", ""))
            items.append((title, link, summary, date))
    else:
        for item in root.findall(f".//{atom_ns}entry")[:20]:
            title = clean(item.findtext(f"{atom_ns}title", ""))
            link_el = item.find(f"{atom_ns}link")
            link = link_el.attrib.get("href", "") if link_el is not None else ""
            summary = clean(item.findtext(f"{atom_ns}summary", "") or item.findtext(f"{atom_ns}content", ""))
            date = clean(item.findtext(f"{atom_ns}published", "") or item.findtext(f"{atom_ns}updated", ""))
            items.append((title, link, summary, date))

    output = []
    for title, link, summary, date in items:
        if not title or not link:
            continue
        if source_tag not in {"ARXIV"} and not RELEASE_TERMS.search(title + " " + summary):
            continue
        category = "RESEARCH" if source_tag == "ARXIV" else "NEW RELEASES"
        if any(word in title.lower() for word in ("model", "gemini", "gpt", "claude", "llm", "reasoning")):
            category = "MODELS"
        elif any(word in title.lower() for word in ("research", "study", "paper", "science")):
            category = "RESEARCH"
        output.append({
            "id": "feed-" + hashlib.sha1(link.encode()).hexdigest()[:12],
            "title": title,
            "source": source,
            "date": date[:40] or datetime.now(timezone.utc).date().isoformat(),
            "category": category,
            "summary": summary[:420],
            "url": link,
            "related": [],
        })
    return output


def candidate_from(item: dict, source: str) -> dict:
    title = item["title"]
    # Conservative: the candidate is deliberately marked for human review.
    name = re.sub(r"^(introducing|announcing|launching|new)\s+", "", title, flags=re.I)
    name = re.split(r"[—–:]", name, maxsplit=1)[0].strip()
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")[:48] or item["id"]
    cid = "auto-" + hashlib.sha1(item["url"].encode()).hexdigest()[:12]
    return {
        "id": cid,
        "name": name.upper(),
        "provider": source,
        "type": "AI Platform",
        "category": "Auto-detected",
        "capabilities": [],
        "purposes": [],
        "description": item["summary"] or title,
        "url": item["url"],
        "status": "AUTO-DETECTED",
        "source": item["url"],
        "detectedDate": datetime.now(timezone.utc).date().isoformat(),
        "slug": slug,
    }


def main() -> None:
    news = json.loads(NEWS_JSON.read_text(encoding="utf-8")) if NEWS_JSON.exists() else []
    by_id = {item["id"]: item for item in news}
    candidates: dict[str, dict] = {}
    failures = []

    for source, url, tag in FEEDS:
        try:
            for item in parse_feed(fetch(url), source, tag):
                by_id[item["id"]] = item
                if source != "arXiv AI" and tag != "ARXIV" and RELEASE_TERMS.search(item["title"]):
                    c = candidate_from(item, source)
                    candidates[c["id"]] = c
        except Exception as exc:  # one bad feed must not break the entire scan
            failures.append(f"{source}: {exc}")

    merged_news = sorted(by_id.values(), key=lambda x: str(x.get("date", "")), reverse=True)[:120]
    NEWS_JSON.write_text(json.dumps(merged_news, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    NEWS_JS.write_text("window.ORIKI_NEWS = " + json.dumps(merged_news, indent=2, ensure_ascii=False) + ";\n", encoding="utf-8")
    AUTO_JS.write_text("window.ORIKI_AUTO_INTELLIGENCE = " + json.dumps(list(candidates.values()), indent=2, ensure_ascii=False) + ";\n", encoding="utf-8")

    if failures:
        print("Feed warnings:")
        for failure in failures:
            print(" -", failure)
    print(f"ORÍKÌ scan complete: {len(merged_news)} news items, {len(candidates)} auto-detected candidates.")


if __name__ == "__main__":
    main()
