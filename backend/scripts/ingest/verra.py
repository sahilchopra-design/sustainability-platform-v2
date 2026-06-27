"""Ingest the Verra registry project catalogue (entity records).

Source: Verra Registry (public). Local file: frontend/src/data/verraRegistryData.json
(819 projects). Feeds VCM integrity, carbon-credit, and CDR/nature modules with
REAL registered projects (type, standard, status, country, co-benefits).
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _base import load_records, DATA_DIR  # noqa: E402

SRC = os.path.join(DATA_DIR, "verraRegistryData.json")


def rows():
    with open(SRC, "r", encoding="utf-8-sig") as f:
        data = json.load(f)
    for p in data:
        yield {
            "ref": str(p.get("id") or p.get("name")),
            "name": p.get("name"),
            "category": p.get("family") or p.get("cluster") or p.get("project_type"),
            "country": p.get("country"),
            "payload": p,
        }


if __name__ == "__main__":
    load_records(
        "verra", rows(),
        name="Verra Registry Projects", provider="Verra (VCS/CCB)",
        license="Public registry data", url="https://registry.verra.org",
        cadence="static",
    )
