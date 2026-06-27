"""Ingest BRSR Core records for India's top listed companies.

Reuses the curated dataset embedded in backend/scripts/seed_brsr_data.py
(25 Nifty/BSE500 companies, FY2024 — P1-P9 principle scores, BRSR Core KPIs,
Scope 1/2/3, social & governance). Feeds India ESG / BRSR / sovereign-India
modules with real SEBI-framework company disclosures.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))          # _base
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # backend/scripts -> seed_brsr_data
from _base import load_records  # noqa: E402
from seed_brsr_data import COMPANIES  # noqa: E402  (module is __main__-guarded, import-safe)


def rows():
    for c in COMPANIES:
        yield {
            "ref": c.get("cin") or c.get("nse_symbol") or c.get("entity_name"),
            "name": c.get("entity_name"),
            "category": c.get("sector") or "BRSR Core",
            "country": "India",
            "payload": c,
        }


if __name__ == "__main__":
    load_records(
        "brsr", rows(),
        name="BRSR Core — India Top Listed", provider="SEBI BRSR framework (curated)",
        license="Public-domain derived (company BRSR filings)",
        url="https://www.sebi.gov.in", cadence="annual",
    )
