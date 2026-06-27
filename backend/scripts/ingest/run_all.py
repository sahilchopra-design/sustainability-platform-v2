"""Run every Tier-1 reference-data ingester in sequence.

    python backend/scripts/ingest/run_all.py

Each ingester is idempotent (replace-by-source_key), so re-running is safe.
A single ingester failing does not stop the others.
"""
import os
import runpy
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# brsr_dme (1,323 cos from the DME project) supersedes the local 25-company brsr.py seed.
# dme_pull is a multi-source script (sovereign ESG, EU taxonomy, IEA, SBTi sectors, ENCORE, PCAF, TPI).
INGESTERS = ["owid_co2", "owid_energy", "verra", "sbti", "worldbank", "cbam", "ceda",
             "brsr_dme", "csrd", "dme_pull"]


def main():
    ok, failed = [], []
    for name in INGESTERS:
        print(f"\n=== {name} ===")
        try:
            runpy.run_module(name, run_name="__main__")  # runs the ingester's load_* block
            ok.append(name)
        except Exception as e:
            print(f"  [FAIL] {name}: {type(e).__name__}: {str(e)[:160]}")
            failed.append(name)
    print(f"\nDONE. ok={ok} failed={failed}")


if __name__ == "__main__":
    main()
