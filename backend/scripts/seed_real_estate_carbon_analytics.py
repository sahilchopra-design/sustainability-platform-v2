"""Idempotent seed for ep_recarb1_properties — ports the module's former hardcoded data.

1. Export the page's hardcoded constant to backend/scripts/data/real_estate_carbon_analytics.json
   (a JS array of objects). Each object MUST have a stable 'ref' business key.
2. Run:  python backend/scripts/seed_real_estate_carbon_analytics.py
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.base import SessionLocal
from db.models.real_estate_carbon_analytics import RealEstateCarbonAnalyticsProperty

DATA = os.path.join(os.path.dirname(__file__), "data", "real_estate_carbon_analytics.json")


def run():
    with open(DATA, "r", encoding="utf-8") as f:
        rows = json.load(f)
    db = SessionLocal()
    try:
        for row in rows:
            ref = str(row.get("ref") or row.get("id") or row.get("name"))
            db.query(RealEstateCarbonAnalyticsProperty).filter(RealEstateCarbonAnalyticsProperty.ref == ref).delete()  # idempotent
            known = {"ref", "name", "category", "value"}
            db.add(RealEstateCarbonAnalyticsProperty(
                ref=ref,
                name=row.get("name"),
                category=row.get("category"),
                value=row.get("value"),
                payload={k: v for k, v in row.items() if k not in known},
            ))
        db.commit()
        print(f"[OK] seeded {len(rows)} rows into ep_recarb1_properties")
    finally:
        db.close()


if __name__ == "__main__":
    run()
