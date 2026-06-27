"""Ingest CBAM country vulnerability records.

Local file: frontend/src/data/cbam-vulnerability.json (105 countries). Feeds
CBAM analytics/compliance and trade-exposure modules with country vulnerability,
EU-market dependence, and emission-intensity figures.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _base import load_records, DATA_DIR  # noqa: E402

SRC = os.path.join(DATA_DIR, "cbam-vulnerability.json")


def rows():
    with open(SRC, "r", encoding="utf-8-sig") as f:
        data = json.load(f)
    for c in data.get("countries", []):
        yield {
            "ref": c.get("iso3") or c.get("name"),
            "name": c.get("name"),
            "category": "CBAM",
            "country": c.get("name"),
            "payload": c,
        }


if __name__ == "__main__":
    load_records(
        "cbam", rows(),
        name="CBAM Country Vulnerability", provider="A² Intelligence (public trade + EU CBAM data)",
        license="Public-domain derived", url="https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en",
        cadence="static",
    )
