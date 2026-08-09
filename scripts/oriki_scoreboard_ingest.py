#!/usr/bin/env python3
"""Populate ORÍKÌ's scoreboard from free public benchmark data.

The first adapter uses the official SWE-bench website repository's public
leaderboard JSON. Only published benchmark values are copied; ORÍKÌ never
fabricates missing scores. The generated file is committed by the existing
review-PR workflow so Commander reviews the change before it reaches main.
"""
from __future__ import annotations

import json
import re
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "scoreboard-results.json"
SOURCE_URL = "https://raw.githubusercontent.com/SWE-bench/swe-bench.github.io/master/data/leaderboards.json"
SOURCE_PAGE = "https://github.com/SWE-bench/swe-bench.github.io/blob/master/data/leaderboards.json"

# Country is attached only when the provider identity is sufficiently clear.
# Unknown providers are left unknown rather than guessed.
PROVIDER_META = {
    "openai": ("OpenAI", "United States"),
    "anthropic": ("Anthropic", "United States"),
    "google": ("Google", "United States"),
    "deepmind": ("Google DeepMind", "United Kingdom"),
    "microsoft": ("Microsoft", "United States"),
    "meta": ("Meta", "United States"),
    "mistral": ("Mistral AI", "France"),
    "deepseek": ("DeepSeek", "China"),
    "alibaba": ("Alibaba", "China"),
    "qwen": ("Alibaba", "China"),
    "moonshot": ("Moonshot AI", "China"),
    "z.ai": ("Z.ai", "China"),
    "zhipu": ("Zhipu AI", "China"),
    "01.ai": ("01.AI", "China"),
    "minimax": ("MiniMax", "China"),
    "baichuan": ("Baichuan AI", "China"),
    "bytedance": ("ByteDance", "China"),
    "nvidia": ("NVIDIA", "United States"),
    "xai": ("xAI", "United States"),
}


def fetch_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "ORIKI-Scoreboard/1.0"})
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def provider_for(result: dict) -> tuple[str, str]:
    haystack = " ".join(str(result.get(k, "")) for k in ("name", "folder", "site", "org_logo")).lower()
    for key, meta in PROVIDER_META.items():
        if key in haystack:
            return meta
    # Keep a useful organisation label when the upstream entry provides one,
    # but never infer a country from an ambiguous model name.
    site = str(result.get("site", ""))
    host = re.sub(r"^https?://", "", site).split("/", 1)[0]
    return (host or "Unknown provider", "Unknown")


def select_results(payload: dict) -> list[dict]:
    selected: list[dict] = []
    for leaderboard in payload.get("leaderboards", []):
        name = str(leaderboard.get("name", "")).lower()
        # Prefer Verified, then include Test/Lite if present. De-duplication below
        # keeps the best published result for each model name.
        if name not in {"verified", "test", "lite"}:
            continue
        for result in leaderboard.get("results", []):
            resolved = result.get("resolved")
            try:
                score = float(resolved)
            except (TypeError, ValueError):
                continue
            if not 0 <= score <= 100:
                continue
            provider, country = provider_for(result)
            model = str(result.get("name") or result.get("folder") or "").strip()
            if not model:
                continue
            selected.append({
                "name": model,
                "provider": provider,
                "country": country,
                "type": "AI system",
                "benchmark": "SWE-bench " + leaderboard.get("name", ""),
                "capability": "softwareEngineering",
                "score": round(score, 2),
                "scores": {"softwareEngineering": round(score, 2)},
                "source": SOURCE_PAGE,
                "sourceData": SOURCE_URL,
                "verified": bool(result.get("verified", False)),
                "openSource": bool(result.get("oss", False)),
                "date": result.get("date"),
                "sources": ["swebench"],
            })
    return selected


def dedupe(rows: list[dict]) -> list[dict]:
    best: dict[tuple[str, str], dict] = {}
    priority = {"SWE-bench Verified": 3, "SWE-bench Test": 2, "SWE-bench Lite": 1}
    for row in rows:
        key = (row["name"].lower(), row["provider"].lower())
        current = best.get(key)
        if current is None or priority.get(row["benchmark"], 0) > priority.get(current["benchmark"], 0) or row["score"] > current["score"]:
            best[key] = row
    return sorted(best.values(), key=lambda r: r["score"], reverse=True)


def main() -> None:
    payload = fetch_json(SOURCE_URL)
    rows = dedupe(select_results(payload))
    models = []
    for row in rows:
        model = dict(row)
        model["orikiScore"] = None  # one benchmark dimension is not an overall score
        models.append(model)

    output = {
        "schemaVersion": "1.1",
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "notice": "Public benchmark results only. ORÍKÌ does not manufacture missing values or claim a composite score from a single benchmark.",
        "models": models,
        "sources": [{
            "id": "swebench",
            "name": "SWE-bench",
            "benchmark": "SWE-bench public leaderboard",
            "url": SOURCE_PAGE,
            "dataUrl": SOURCE_URL,
            "license": "MIT",
            "free": True,
            "retrievedAt": datetime.now(timezone.utc).isoformat(),
        }],
    }
    OUT.write_text(json.dumps(output, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"ORÍKÌ scoreboard ingestion complete: {len(models)} verified public SWE-bench rows.")


if __name__ == "__main__":
    main()
