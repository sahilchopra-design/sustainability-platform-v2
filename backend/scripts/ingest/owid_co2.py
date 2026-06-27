"""Ingest Our World in Data — CO2 & Greenhouse Gas Emissions (country x year x metric).

Source: https://github.com/owid/co2-data  (CC-BY 4.0). Local file:
frontend/src/data/owid-co2-data.csv. Feeds Paris-alignment, sovereign ESG,
Scope/financed-emissions, transition-risk modules with REAL emissions figures.
"""
import csv
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _base import load_points, to_float, DATA_DIR  # noqa: E402

CSV = os.path.join(DATA_DIR, "owid-co2-data.csv")
YEAR_FROM = 1990

# metric column -> unit (only columns that exist are emitted)
METRICS = {
    "co2": "MtCO2",
    "co2_per_capita": "tCO2/capita",
    "co2_per_gdp": "kgCO2/$",
    "share_global_co2": "%",
    "cumulative_co2": "MtCO2",
    "co2_including_luc": "MtCO2",
    "total_ghg": "MtCO2e",
    "ghg_per_capita": "tCO2e/capita",
    "methane": "MtCO2e",
    "nitrous_oxide": "MtCO2e",
    "coal_co2": "MtCO2",
    "oil_co2": "MtCO2",
    "gas_co2": "MtCO2",
    "cement_co2": "MtCO2",
    "temperature_change_from_co2": "degC",
    "population": "persons",
    "gdp": "int$",
}


def rows():
    with open(CSV, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        present = [m for m in METRICS if m in reader.fieldnames]
        for r in reader:
            iso = (r.get("iso_code") or "").strip()
            if not iso:                       # skip pure aggregates without an ISO/OWID code
                continue
            y = r.get("year")
            try:
                y = int(y)
            except (TypeError, ValueError):
                continue
            if y < YEAR_FROM:
                continue
            name = r.get("country")
            for m in present:
                v = to_float(r.get(m))
                if v is None:
                    continue
                yield {"entity_code": iso, "entity_name": name, "year": y,
                       "metric": m, "value": v, "unit": METRICS[m]}


if __name__ == "__main__":
    load_points(
        "owid_co2", rows(),
        name="OWID CO2 & GHG Emissions",
        provider="Our World in Data / Global Carbon Project",
        license="CC-BY 4.0", url="https://github.com/owid/co2-data",
        cadence="annual",
        meta={"year_from": YEAR_FROM, "metrics": list(METRICS)},
    )
