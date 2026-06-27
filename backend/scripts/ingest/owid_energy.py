"""Ingest Our World in Data — Energy (country x year x metric).

Source: https://github.com/owid/energy-data (CC-BY 4.0). Local file:
frontend/src/data/owid-energy-data.csv. Feeds energy-transition, renewables,
green-hydrogen, and power-sector finance modules with REAL energy-mix figures.
"""
import csv
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _base import load_points, to_float, DATA_DIR  # noqa: E402

CSV = os.path.join(DATA_DIR, "owid-energy-data.csv")
YEAR_FROM = 1990

METRICS = {
    "renewables_share_energy": "%",
    "renewables_share_elec": "%",
    "low_carbon_share_energy": "%",
    "low_carbon_share_elec": "%",
    "fossil_share_energy": "%",
    "fossil_share_elec": "%",
    "solar_share_elec": "%",
    "wind_share_elec": "%",
    "hydro_share_elec": "%",
    "nuclear_share_elec": "%",
    "energy_per_capita": "kWh/capita",
    "electricity_demand_per_capita": "kWh/capita",
    "primary_energy_consumption": "TWh",
    "electricity_generation": "TWh",
    "greenhouse_gas_emissions": "MtCO2e",
}


def rows():
    with open(CSV, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        present = [m for m in METRICS if m in reader.fieldnames]
        for r in reader:
            iso = (r.get("iso_code") or "").strip()
            if not iso:
                continue
            try:
                y = int(r.get("year"))
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
        "owid_energy", rows(),
        name="OWID Energy", provider="Our World in Data / Ember / EI Statistical Review",
        license="CC-BY 4.0", url="https://github.com/owid/energy-data",
        cadence="annual", meta={"year_from": YEAR_FROM, "metrics": list(METRICS)},
    )
