"""Ingest the full BRSR dataset from the DME Supabase project (ynxmxgjdivriakhxxptk).

Pulls via the PostgREST REST API (same path the platform's esg_data_quality route
uses) and loads into the main reference-data layer:
  * dme_brsr_companies   -> reference_data_records  source_key='brsr'   (~1,323 cos)
  * dme_brsr_core_metrics-> reference_data_points    source_key='brsr_metrics'

Replaces the earlier 25-company local seed with the real SEBI Top-1000 universe.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _base import load_records, load_points, to_float, rest_fetch_all  # noqa: E402

# Uses the shared DME PostgREST helper. Set the key in the environment first:
#   export DME_SUPABASE_KEY=<anon-or-service-role key>


def fetch_all(table, select="*"):
    return rest_fetch_all(table, select=select)


METRIC_UNITS = {
    "scope1_tco2e": "tCO2e", "scope2_tco2e": "tCO2e", "scope3_tco2e": "tCO2e",
    "scope12_intensity": "tCO2e/unit", "scope12_intensity_per_turnover": "tCO2e/INR",
    "scope3_per_turnover": "tCO2e/INR", "total_energy_consumption": "GJ",
    "energy_intensity_per_turnover": "GJ/INR", "water_withdrawal_kl": "kL",
    "water_consumption_kl": "kL", "water_discharged_kl": "kL",
    "total_waste_generated": "MT", "hazardous_waste": "MT",
    "waste_recycled": "MT", "waste_reused": "MT", "turnover_inr": "INR",
}


def company_rows(companies):
    for c in companies:
        yield {
            "ref": c.get("cin"),
            "name": c.get("company_name"),
            "category": c.get("sector_description") or c.get("sector_nace"),
            "country": "India",
            "payload": {
                "sector_nace": c.get("sector_nace"), "is_listed": c.get("is_listed"),
                "years_reported": c.get("years_reported"),
                "first_report_year": c.get("first_report_year"),
                "last_report_year": c.get("last_report_year"),
                "city": c.get("city"), "state": c.get("state"),
            },
        }


def metric_points(metrics, name_by_cin):
    for m in metrics:
        cin = m.get("cin")
        if not cin:
            continue
        try:
            year = int(m.get("year"))
        except (TypeError, ValueError):
            continue
        for col, unit in METRIC_UNITS.items():
            v = to_float(m.get(col))
            if v is None:
                continue
            yield {"entity_code": cin, "entity_name": name_by_cin.get(cin, cin),
                   "year": year, "metric": col, "value": v, "unit": unit}


if __name__ == "__main__":
    print("fetching dme_brsr_companies ...")
    companies = fetch_all("dme_brsr_companies",
                          select="cin,company_name,sector_nace,sector_description,is_listed,years_reported,first_report_year,last_report_year,city,state")
    load_records(
        "brsr", company_rows(companies),
        name="BRSR Companies — SEBI Top 1000 (DME)", provider="SEBI BRSR filings (A² DME store)",
        license="Public-domain (SEBI filings)", url="https://www.sebi.gov.in", cadence="annual",
    )

    name_by_cin = {c.get("cin"): c.get("company_name") for c in companies}
    print("fetching dme_brsr_core_metrics ...")
    metrics = fetch_all("dme_brsr_core_metrics")
    load_points(
        "brsr_metrics", metric_points(metrics, name_by_cin),
        name="BRSR Core Metrics (DME)", provider="SEBI BRSR filings (A² DME store)",
        license="Public-domain (SEBI filings)", url="https://www.sebi.gov.in", cadence="annual",
        meta={"metrics": list(METRIC_UNITS)},
    )
