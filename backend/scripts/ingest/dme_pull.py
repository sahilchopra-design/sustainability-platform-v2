"""Config-driven ingester for high-value DME reference tables (project ynxmxgjdivriakhxxptk).

Pulls via PostgREST and loads into the shared reference-data layer. Add a table by
appending a config entry — no new code. Run:  python backend/scripts/ingest/dme_pull.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _base import rest_fetch_all, load_records, load_points, to_float  # noqa: E402

# ── POINTS sources (entity x year x metric) ───────────────────────────────────
# mode 'melt': one row already = one metric (metric_col/value_col/unit_col)
# mode 'wide': numeric columns listed in `metrics` are each emitted as a metric
POINT_SOURCES = [
    {
        "key": "sovereign_esg", "table": "dme_sovereign_esg", "mode": "melt",
        "entity": "country_code", "entity_name": "country_name", "year": "reference_year",
        "metric_col": "indicator_name", "value_col": "indicator_value", "unit_col": "indicator_unit",
        "meta": dict(name="Sovereign ESG Indicators (DME)", provider="A² DME store",
                     license="Public-domain derived", url="", cadence="annual"),
    },
    {
        "key": "country_esg", "table": "dme_country_esg_profiles", "mode": "wide",
        "entity": "country_code", "entity_name": "country_name", "year": "reference_year",
        "metrics": {
            "environmental_score": "score", "social_score": "score", "governance_score": "score",
            "composite_esg_score": "score", "climate_vulnerability_index": "index",
            "ndgain_readiness": "index", "ghg_per_capita": "tCO2e/capita",
            "renewable_energy_pct": "%", "hdi": "index", "regulatory_quality": "index",
            "green_bond_issuance_usd_bn": "US$ bn",
        },
        "meta": dict(name="Country ESG Profiles (DME)", provider="A² DME store",
                     license="Public-domain derived", url="", cadence="annual"),
    },
]

# ── RECORDS sources (entity catalogue) ────────────────────────────────────────
RECORD_SOURCES = [
    {"key": "eu_taxonomy", "table": "dme_eu_taxonomy_activities",
     "ref": "activity_id", "name": "activity_name", "category": "environmental_objective", "country": None,
     "drop": ["dnsh_criteria", "technical_screening_criteria"],
     "meta": dict(name="EU Taxonomy Activities (DME)", provider="EU Taxonomy / EFRAG",
                  license="Public", url="https://ec.europa.eu/sustainable-finance-taxonomy", cadence="static")},
    {"key": "dme_taxonomy", "table": "dme_taxonomy",
     "ref": "taxonomy_code", "name": "name", "category": "pillar", "country": None,
     "meta": dict(name="A² Materiality Taxonomy (DME)", provider="A² DME store",
                  license="Internal reference", url="", cadence="static")},
    {"key": "sbti_sector_targets", "table": "dme_sbti_sector_targets",
     "ref": "id", "name": "sector", "category": "scope", "country": None,
     "meta": dict(name="SBTi Sector Decarbonisation Targets (DME)", provider="SBTi sectoral pathways",
                  license="Public (SBTi)", url="https://sciencebasedtargets.org", cadence="static")},
    {"key": "iea_scenarios", "table": "dme_iea_scenario_pathways",
     "ref": "id", "name": "scenario_name", "category": "sector", "country": None,
     "meta": dict(name="IEA WEO Scenario Pathways (DME)", provider="IEA WEO 2023",
                  license="Public (IEA)", url="https://www.iea.org/reports/world-energy-outlook-2023", cadence="annual")},
    {"key": "encore_dependencies", "table": "dme_encore_dependencies",
     "ref": "id", "name": "impact_driver", "category": "dependency_rating", "country": None,
     "meta": dict(name="ENCORE Nature Dependencies (DME)", provider="ENCORE / TNFD",
                  license="Public (ENCORE)", url="https://encorenature.org", cadence="static")},
    {"key": "pcaf_factors", "table": "pcaf_sector_emission_factors",
     "ref": "sector_gics_code", "name": "sector_gics", "category": "geography", "country": None,
     "meta": dict(name="PCAF Sector Emission Factors (DME)", provider="PCAF Part A Table 5.4",
                  license="Public (PCAF)", url="https://carbonaccountingfinancials.com", cadence="annual")},
    {"key": "tpi_pathways", "table": "dme_tpi_carbon_pathways",
     "ref": "id", "name": "pathway_name", "category": "gics_sector", "country": None,
     "meta": dict(name="TPI Carbon Pathways (DME)", provider="Transition Pathway Initiative",
                  license="Public (TPI)", url="https://transitionpathwayinitiative.org", cadence="annual")},

    # ── CSRD / ESRS ───────────────────────────────────────────────────────────
    {"key": "esrs_datapoints", "table": "dme_esrs_datapoints",
     "ref": "id", "name": "datapoint_name", "category": "standard_code", "country": None,
     "drop": ["metadata"],
     "meta": dict(name="ESRS Datapoint Registry (DME)", provider="EFRAG ESRS",
                  license="Public (EFRAG)", url="https://www.efrag.org", cadence="static")},
    {"key": "esrs_disclosures", "table": "dme_esrs_entity_disclosures",
     "ref": "id", "name": "standard_code", "category": "disclosure_quality", "country": None,
     "drop": ["metadata"],
     "meta": dict(name="ESRS Entity Disclosures (DME)", provider="A² DME store",
                  license="Public-domain derived", url="", cadence="annual")},
    {"key": "esrs_materiality", "table": "dme_esrs_materiality_assessment",
     "ref": "id", "name": "standard_code", "category": "standard_code", "country": None,
     "drop": ["key_metrics", "risk_indicators", "metadata"],
     "meta": dict(name="ESRS Materiality Assessments (DME)", provider="A² DME store",
                  license="Public-domain derived", url="", cadence="annual")},
    {"key": "brsr_esrs_crosswalk", "table": "dme_brsr_esrs_crosswalk",
     "ref": "id", "name": "esrs_datapoint_name", "category": "esrs_standard", "country": None,
     "meta": dict(name="BRSR↔ESRS Crosswalk (DME)", provider="A² DME store",
                  license="Public-domain derived", url="", cadence="static")},

    # ── TNFD / Nature ─────────────────────────────────────────────────────────
    {"key": "tnfd", "table": "tnfd_extractions",
     "ref": "id", "name": "company_name", "category": "pillar", "country": "country",
     "drop": ["raw_response"],
     "meta": dict(name="TNFD Disclosure Extractions (DME)", provider="A² DME store (TNFD)",
                  license="Public-domain derived", url="https://tnfd.global", cadence="annual")},
    {"key": "nature_frameworks", "table": "dme_nature_frameworks",
     "ref": "framework_code", "name": "framework_name", "category": "framework_type", "country": None,
     "drop": ["key_metrics"],
     "meta": dict(name="Nature Frameworks Registry (DME)", provider="A² DME store",
                  license="Public", url="", cadence="static")},
    {"key": "encore_pressures", "table": "dme_encore_pressures",
     "ref": "id", "name": "pressure_name", "category": None, "country": None,
     "meta": dict(name="ENCORE Pressures (DME)", provider="ENCORE / TNFD",
                  license="Public (ENCORE)", url="https://encorenature.org", cadence="static")},
    {"key": "encore_ecosystem_services", "table": "dme_encore_ecosystem_services",
     "ref": "id", "name": "service_name", "category": "service_category", "country": None,
     "meta": dict(name="ENCORE Ecosystem Services (DME)", provider="ENCORE / TNFD",
                  license="Public (ENCORE)", url="https://encorenature.org", cadence="static")},
    {"key": "encore_entity_assessments", "table": "dme_encore_entity_assessments",
     "ref": "id", "name": "natural_capital_asset", "category": "data_quality", "country": None,
     "meta": dict(name="ENCORE Entity Nature Assessments (DME)", provider="ENCORE / TNFD",
                  license="Public (ENCORE)", url="https://encorenature.org", cadence="annual")},
]


def point_rows(cfg, data):
    if cfg["mode"] == "melt":
        for r in data:
            v = to_float(r.get(cfg["value_col"]))
            yr = r.get(cfg["year"])
            if v is None or yr is None:
                continue
            yield {"entity_code": r.get(cfg["entity"]), "entity_name": r.get(cfg.get("entity_name")),
                   "year": int(yr), "metric": r.get(cfg["metric_col"]), "value": v,
                   "unit": r.get(cfg.get("unit_col"))}
    else:  # wide
        for r in data:
            yr = r.get(cfg["year"])
            if yr is None:
                continue
            for col, unit in cfg["metrics"].items():
                v = to_float(r.get(col))
                if v is None:
                    continue
                yield {"entity_code": r.get(cfg["entity"]), "entity_name": r.get(cfg.get("entity_name")),
                       "year": int(yr), "metric": col, "value": v, "unit": unit}


def record_rows(cfg, data):
    known = {cfg["ref"], cfg["name"], cfg.get("category"), cfg.get("country")}
    drop = set(cfg.get("drop", [])) | {"created_at", "updated_at", "id"} - {cfg["ref"]}
    for r in data:
        payload = {k: v for k, v in r.items() if k not in known and k not in drop}
        yield {
            "ref": str(r.get(cfg["ref"])),
            "name": r.get(cfg["name"]),
            "category": r.get(cfg["category"]) if cfg.get("category") else None,
            "country": r.get(cfg["country"]) if cfg.get("country") else None,
            "payload": payload,
        }


if __name__ == "__main__":
    for cfg in POINT_SOURCES:
        try:
            print(f"fetching {cfg['table']} ...")
            data = rest_fetch_all(cfg["table"])
            load_points(cfg["key"], point_rows(cfg, data), **cfg["meta"])
        except Exception as e:
            print(f"  [FAIL] {cfg['key']}: {type(e).__name__}: {str(e)[:120]}")
    for cfg in RECORD_SOURCES:
        try:
            print(f"fetching {cfg['table']} ...")
            data = rest_fetch_all(cfg["table"])
            load_records(cfg["key"], record_rows(cfg, data), **cfg["meta"])
        except Exception as e:
            print(f"  [FAIL] {cfg['key']}: {type(e).__name__}: {str(e)[:120]}")
