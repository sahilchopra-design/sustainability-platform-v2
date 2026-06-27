"""Ingest the CSRD entity registry (EU large undertakings) into reference records.

Source: the existing csrd_entity_registry table (real EU entities — HSBC,
Deutsche Bank, Zurich, BNP, EDP, Orsted, RWE, ...). Feeds CSRD/ESRS, SFDR, and
EU-banking/energy modules with real reporting-entity master data.
"""
import os
import sys
from decimal import Decimal

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _base import load_records  # noqa: E402
from db.base import SessionLocal  # noqa: E402
from sqlalchemy import text  # noqa: E402

COLS = [
    "id", "legal_name", "trading_name", "lei", "isin", "ticker", "country_iso",
    "jurisdiction", "primary_sector", "sector_subtype", "nace_code", "gics_sector",
    "gics_industry", "is_large_undertaking", "is_listed_sme", "employee_count",
    "net_turnover_meur",
]


def _clean(v):
    return float(v) if isinstance(v, Decimal) else v


def rows():
    db = SessionLocal()
    try:
        res = db.execute(text(f"SELECT {', '.join(COLS)} FROM csrd_entity_registry ORDER BY legal_name")).fetchall()
        for r in res:
            d = {c: _clean(v) for c, v in zip(COLS, r)}
            yield {
                "ref": d.get("lei") or d.get("isin") or d.get("legal_name"),
                "name": d.get("legal_name"),
                "category": d.get("gics_sector") or d.get("primary_sector"),
                "country": d.get("country_iso"),
                "payload": {k: v for k, v in d.items() if k != "id"},
            }
    finally:
        db.close()


if __name__ == "__main__":
    load_records(
        "csrd", rows(),
        name="CSRD Entity Registry (EU)", provider="A² Intelligence (public EU filings)",
        license="Public-domain derived", url="https://finance.ec.europa.eu/csrd",
        cadence="annual",
    )
