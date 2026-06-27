"""Ingest CEDA sector emission-factor records.

Local file: frontend/src/data/ceda-2025.json (400 sectors). Feeds Scope 3 /
spend-based / supply-chain carbon modules with input-output sector definitions
and emission factors.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _base import load_records, DATA_DIR  # noqa: E402

SRC = os.path.join(DATA_DIR, "ceda-2025.json")


def rows():
    with open(SRC, "r", encoding="utf-8-sig") as f:
        data = json.load(f)
    for s in data.get("sectors", []):
        yield {
            "ref": s.get("code") or s.get("name"),
            "name": s.get("name"),
            "category": "sector",
            "country": None,
            "payload": s,
        }


if __name__ == "__main__":
    load_records(
        "ceda", rows(),
        name="CEDA Sector Emission Factors", provider="Climate & Economic Data (EEIO)",
        license="Public-domain derived", url="https://vitalmetricsgroup.com/ceda/",
        cadence="annual",
    )
