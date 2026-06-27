"""Ingest the SBTi company target catalogue (entity records).

Source: Science Based Targets initiative (public companies-taking-action export).
Local file: frontend/src/data/sbti-companies.json (10,711 companies). Feeds
net-zero tracker, Paris-alignment, transition-finance, and portfolio temperature
modules with REAL validated/committed corporate targets.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _base import load_records, DATA_DIR  # noqa: E402

SRC = os.path.join(DATA_DIR, "sbti-companies.json")


def rows():
    with open(SRC, "r", encoding="utf-8-sig") as f:
        data = json.load(f)
    for c in data.get("companies", []):
        # compact keys: n=name i=isin l=location r=region s=sector c=commitment y=targetYear
        yield {
            "ref": str(c.get("i") or c.get("n")),
            "name": c.get("n"),
            "category": c.get("c"),          # e.g. "1.5°C", "Net-Zero", "Committed"
            "country": c.get("l"),
            "payload": {
                "isin": c.get("i"), "region": c.get("r"), "sector": c.get("s"),
                "commitment": c.get("c"), "target_year": c.get("y"),
            },
        }


if __name__ == "__main__":
    load_records(
        "sbti", rows(),
        name="SBTi Companies Taking Action", provider="Science Based Targets initiative",
        license="Public (SBTi)", url="https://sciencebasedtargets.org/companies-taking-action",
        cadence="static",
    )
