"""Ingest World Bank indicators via the public API (country x year x metric).

Source: https://api.worldbank.org/v2 (CC-BY 4.0, no key). Stable economic
indicators used to normalise sovereign / PCAF / financed-emissions modules
(GDP, GDP per capita, population). Network-dependent; fails soft.
"""
import json
import os
import sys
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _base import load_points, to_float  # noqa: E402

INDICATORS = {
    "NY.GDP.MKTP.CD": ("gdp_current_usd", "US$"),
    "NY.GDP.PCAP.CD": ("gdp_per_capita_usd", "US$/capita"),
    "SP.POP.TOTL": ("population", "persons"),
    "NY.GNP.PCAP.CD": ("gni_per_capita_usd", "US$/capita"),
}
DATE = "2010:2023"
API = "https://api.worldbank.org/v2/country/all/indicator/{code}?format=json&per_page=20000&date=" + DATE


def rows():
    for code, (metric, unit) in INDICATORS.items():
        try:
            with urllib.request.urlopen(API.format(code=code), timeout=40) as resp:
                payload = json.loads(resp.read())
        except Exception as e:  # network blocked / archived code — skip this indicator
            print(f"  [warn] worldbank {code} skipped: {type(e).__name__} {str(e)[:80]}")
            continue
        if not isinstance(payload, list) or len(payload) < 2 or not payload[1]:
            print(f"  [warn] worldbank {code}: no data rows")
            continue
        for r in payload[1]:
            iso = (r.get("countryiso3code") or "").strip()
            if len(iso) != 3:
                continue
            v = to_float(r.get("value"))
            if v is None:
                continue
            try:
                y = int(r.get("date"))
            except (TypeError, ValueError):
                continue
            yield {"entity_code": iso, "entity_name": (r.get("country") or {}).get("value"),
                   "year": y, "metric": metric, "value": v, "unit": unit}


if __name__ == "__main__":
    load_points(
        "worldbank", rows(),
        name="World Bank Development Indicators", provider="World Bank",
        license="CC-BY 4.0", url="https://data.worldbank.org",
        cadence="annual", meta={"indicators": list(INDICATORS), "date": DATE},
    )
