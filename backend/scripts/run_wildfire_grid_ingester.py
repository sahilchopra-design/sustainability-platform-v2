"""One-off runner for WildfireGridIngester (see ingestion/wildfire_grid_ingester.py)."""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.base import SessionLocal
from ingestion.wildfire_grid_ingester import WildfireGridIngester

if __name__ == "__main__":
    db = SessionLocal()
    try:
        ingester = WildfireGridIngester()
        result = ingester.run(db, triggered_by="manual_session_2026-07-05")
        print("=== RESULT ===")
        for k, v in result.to_dict().items():
            print(f"{k}: {v}")
        print("=== LOG ===")
        print("\n".join(result.log_lines))
    finally:
        db.close()
