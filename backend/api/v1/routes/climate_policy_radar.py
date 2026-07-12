"""Climate Policy Stringency -- national climate-law / NDC extract + scorer.

DATA STATUS (verified 2026-07-05):
  - Checked https://climatepolicyradar.org and https://app.climatepolicyradar.org
    directly: neither exposes a public developer API. The app site lists
    methodology docs, a codebook and a support contact
    (support@climatepolicyradar.org), but no API reference, key-request flow,
    or developer portal.
  - Checked their GitHub org (github.com/climatepolicyradar) and Hugging Face
    org (huggingface.co/ClimatePolicyRadar): access is via OPEN DATASET
    EXPORTS, not a live API --
      * `climatepolicyradar/open-data` (GitHub) -- helper notebooks for
        loading their bulk exports.
      * `ClimatePolicyRadar/all-document-text-data` (Hugging Face) -- full
        text of every document in their corpus (world climate laws + NDCs;
        same underlying data as Climate Change Laws of the World / CCLW).
      * `ClimatePolicyRadar/national-climate-targets` (Hugging Face) --
        annotated passages (net-zero / reduction-target / other mentions)
        per country, built for training classifiers, not a clean target
        registry -- confirmed via its dataset card (2,610 annotated
        passages, 203 net-zero mentions, inconsistent binding-status
        labeling).
  - CONCLUSION: no live API exists (their own site describes an API as
    upcoming, not yet available). Per platform policy this module therefore
    ships a SMALL, HAND-AUTHORED SEEDED EXTRACT of real national climate
    laws / NDC pledges -- verifiable enactment dates, legally-binding
    status, target years and sectoral coverage -- for a spread of major
    economies, plus a fully transparent, documented stringency-scoring
    formula computed from those real inputs (no black-box score).
    REFRESH FROM the Hugging Face `national-climate-targets` dataset or the
    `climatepolicyradar/open-data` bulk export if/when a live API ships.

Scoring formula (0-100, computed from the fields below -- see `_score()`):
  binding_points   (0-40) -- how the target is legally anchored:
      enacted_law            = 40   (target set in an enacted, binding statute)
      policy_plan_embedded   = 20   (target embedded in a legally-adopted plan,
                                     e.g. a 5-year plan, but not a dedicated
                                     climate statute with an enforcement path)
      ndc_pledge_only        = 15   (an international NDC/COP pledge with no
                                     domestic binding law behind it)
      none_or_superseded     = 0    (no current binding domestic or
                                     international commitment)
  ambition_points  (0-30) -- linear interpolation of target_year between
      2035 (30 pts, most ambitious seeded case) and 2070 (0 pts), i.e.
      30 * (2070 - target_year) / (2070 - 2035), clamped to [0, 30].
      Known modeling simplification (stated openly): this axis is driven by
      target_year alone and does not distinguish a net-zero target from a
      partial-reduction target sharing the same year.
  interim_points   (0-15) -- whether a legally binding interim (e.g. 2030/
      2035) milestone exists:
      binding_interim             = 15
      planned_interim_non_binding = 8
      none                        = 0
  coverage_points  (0-15) -- sectoral/gas coverage of the target:
      economy_wide_all_gases      = 15
      economy_wide_with_carveout  = 10  (e.g. NZ's biogenic-methane carve-out)
      partial_or_aspirational     = 5

Endpoints:
  GET /api/v1/climate-policy/status      -- data-source status + investigation notes
  GET /api/v1/climate-policy/countries   -- all seeded countries + computed scores
  GET /api/v1/climate-policy/country/{iso3} -- single country detail + score
"""
from __future__ import annotations

import threading
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import requests
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/v1/climate-policy", tags=["Climate Policy Stringency"])

EXTRACT_PROVENANCE = {
    "kind": "real seeded extract (hand-authored, verifiable facts) + documented formula score",
    "compiled": "2026-07-05",
    "live_api_exists": False,
    "investigation": [
        "climatepolicyradar.org / app.climatepolicyradar.org -- no public API; "
        "methodology docs + codebook + support contact only",
        "github.com/climatepolicyradar/open-data -- bulk-export helper notebooks, not an API",
        "huggingface.co/datasets/ClimatePolicyRadar/all-document-text-data -- full corpus text export",
        "huggingface.co/datasets/ClimatePolicyRadar/national-climate-targets -- annotated passages "
        "for classifier training, not a clean target registry",
    ],
    "refresh_path": (
        "Replace with the Hugging Face `national-climate-targets` dataset or the "
        "`climatepolicyradar/open-data` bulk export once ingested; or switch this "
        "module to a live proxy if/when Climate Policy Radar ships its API."
    ),
    "live": False,
}

BINDING_POINTS = {"enacted_law": 40, "policy_plan_embedded": 20, "ndc_pledge_only": 15, "none_or_superseded": 0}
INTERIM_POINTS = {"binding_interim": 15, "planned_interim_non_binding": 8, "none": 0}
COVERAGE_POINTS = {"economy_wide_all_gases": 15, "economy_wide_with_carveout": 10, "partial_or_aspirational": 5}
AMBITION_MIN_YEAR, AMBITION_MAX_YEAR, AMBITION_MAX_POINTS = 2035, 2070, 30.0

COUNTRIES: List[Dict[str, Any]] = [
    {"iso3": "EUU", "country_name": "European Union", "is_bloc": True,
     "law_or_pledge_name": "European Climate Law (Regulation (EU) 2021/1119)",
     "enacted_or_announced": "2021-07", "binding_tier": "enacted_law",
     "target_type": "net_zero", "target_year": 2050,
     "interim_tier": "binding_interim", "interim_desc": "-55% net GHG by 2030 vs 1990 ('Fit for 55'), binding",
     "coverage_tier": "economy_wide_all_gases",
     "notes": "Supranational regulation directly applicable in all EU member states.",
     "source": "Regulation (EU) 2021/1119 (EU Climate Law)"},
    {"iso3": "GBR", "country_name": "United Kingdom", "is_bloc": False,
     "law_or_pledge_name": "Climate Change Act 2008 (2050 Target Amendment Order 2019)",
     "enacted_or_announced": "2019-06", "binding_tier": "enacted_law",
     "target_type": "net_zero", "target_year": 2050,
     "interim_tier": "binding_interim", "interim_desc": "Legally binding rolling 5-year carbon budgets",
     "coverage_tier": "economy_wide_all_gases", "notes": None,
     "source": "Climate Change Act 2008; 2019 net-zero amendment order"},
    {"iso3": "DEU", "country_name": "Germany", "is_bloc": False,
     "law_or_pledge_name": "Bundes-Klimaschutzgesetz (Federal Climate Change Act), amended 2021",
     "enacted_or_announced": "2021-08", "binding_tier": "enacted_law",
     "target_type": "net_zero", "target_year": 2045,
     "interim_tier": "binding_interim", "interim_desc": "-65% by 2030 vs 1990 (enacted, brought forward from -55% "
                                                        "after the 2021 Federal Constitutional Court ruling)",
     "coverage_tier": "economy_wide_all_gases",
     "notes": "Also bound by the overlying EU Climate Law.", "source": "Bundes-Klimaschutzgesetz (KSG), 2021 amendment"},
    {"iso3": "FRA", "country_name": "France", "is_bloc": False,
     "law_or_pledge_name": "Loi Energie-Climat (Energy-Climate Law, Loi n. 2019-1147)",
     "enacted_or_announced": "2019-11", "binding_tier": "enacted_law",
     "target_type": "net_zero", "target_year": 2050,
     "interim_tier": "binding_interim", "interim_desc": "Carbon budgets ('budgets carbone') set under the Energy "
                                                        "Code; -40% by 2030 vs 1990 objective",
     "coverage_tier": "economy_wide_all_gases",
     "notes": "Also bound by the overlying EU Climate Law.", "source": "Loi n. 2019-1147 relative a l'energie et au climat"},
    {"iso3": "SWE", "country_name": "Sweden", "is_bloc": False,
     "law_or_pledge_name": "Climate Act (Klimatlagen 2017:720) + Climate Policy Framework",
     "enacted_or_announced": "2018-01", "binding_tier": "enacted_law",
     "target_type": "net_zero", "target_year": 2045,
     "interim_tier": "binding_interim", "interim_desc": "-63% by 2030 vs 1990 (territorial, within the framework)",
     "coverage_tier": "economy_wide_all_gases",
     "notes": "Also bound by the overlying EU Climate Law.", "source": "Klimatlagen (2017:720)"},
    {"iso3": "DNK", "country_name": "Denmark", "is_bloc": False,
     "law_or_pledge_name": "Climate Act (Klimalov)",
     "enacted_or_announced": "2020-06", "binding_tier": "enacted_law",
     "target_type": "net_zero", "target_year": 2050,
     "interim_tier": "binding_interim", "interim_desc": "70% reduction by 2030 vs 1990 (legally binding)",
     "coverage_tier": "economy_wide_all_gases",
     "notes": "Also bound by the overlying EU Climate Law.", "source": "Klimalov (Climate Act) 2020"},
    {"iso3": "ESP", "country_name": "Spain", "is_bloc": False,
     "law_or_pledge_name": "Ley 7/2021 de cambio climatico y transicion energetica",
     "enacted_or_announced": "2021-05", "binding_tier": "enacted_law",
     "target_type": "net_zero", "target_year": 2050,
     "interim_tier": "binding_interim", "interim_desc": "-23% by 2030 vs 1990 (binding)",
     "coverage_tier": "economy_wide_all_gases",
     "notes": "Also bound by the overlying EU Climate Law.", "source": "Ley 7/2021"},
    {"iso3": "NZL", "country_name": "New Zealand", "is_bloc": False,
     "law_or_pledge_name": "Climate Change Response (Zero Carbon) Amendment Act 2019",
     "enacted_or_announced": "2019-11", "binding_tier": "enacted_law",
     "target_type": "net_zero", "target_year": 2050,
     "interim_tier": "binding_interim", "interim_desc": "Three legally binding emissions budgets "
                                                        "(2022-25, 2026-30, 2031-35)",
     "coverage_tier": "economy_wide_with_carveout",
     "notes": "Excludes biogenic methane from the 2050 net-zero target, which instead has a separate, weaker "
              "target of 24-47% reduction by 2050 vs 2017.",
     "source": "Climate Change Response (Zero Carbon) Amendment Act 2019"},
    {"iso3": "JPN", "country_name": "Japan", "is_bloc": False,
     "law_or_pledge_name": "Act on Promotion of Global Warming Countermeasures (amended 2021)",
     "enacted_or_announced": "2021-05", "binding_tier": "enacted_law",
     "target_type": "net_zero", "target_year": 2050,
     "interim_tier": "planned_interim_non_binding",
     "interim_desc": "-46% by 2030 vs 2013, set via the Cabinet-decided Basic Energy Plan/NDC, not a "
                     "statute-level numeric target",
     "coverage_tier": "economy_wide_all_gases", "notes": None,
     "source": "Act on Promotion of Global Warming Countermeasures, 2021 amendment"},
    {"iso3": "KOR", "country_name": "South Korea", "is_bloc": False,
     "law_or_pledge_name": "Framework Act on Carbon Neutrality and Green Growth",
     "enacted_or_announced": "2021-09", "binding_tier": "enacted_law",
     "target_type": "net_zero", "target_year": 2050,
     "interim_tier": "binding_interim", "interim_desc": "Statute mandates at least 35% reduction from 2018 "
                                                        "levels by 2030",
     "coverage_tier": "economy_wide_all_gases", "notes": None,
     "source": "Framework Act on Carbon Neutrality and Green Growth (effective 2022-03)"},
    {"iso3": "CAN", "country_name": "Canada", "is_bloc": False,
     "law_or_pledge_name": "Canadian Net-Zero Emissions Accountability Act",
     "enacted_or_announced": "2021-06", "binding_tier": "enacted_law",
     "target_type": "net_zero", "target_year": 2050,
     "interim_tier": "binding_interim", "interim_desc": "Act mandates 5-year interim targets, first: "
                                                        "40-45% below 2005 levels by 2030",
     "coverage_tier": "economy_wide_all_gases",
     "notes": "An accountability/process law (mandates target-setting + reporting) rather than a direct cap.",
     "source": "Canadian Net-Zero Emissions Accountability Act"},
    {"iso3": "CHL", "country_name": "Chile", "is_bloc": False,
     "law_or_pledge_name": "Ley Marco de Cambio Climatico (Law 21.455)",
     "enacted_or_announced": "2022-06", "binding_tier": "enacted_law",
     "target_type": "net_zero", "target_year": 2050,
     "interim_tier": "binding_interim", "interim_desc": "Establishes sectoral emissions budgets "
                                                        "('presupuestos sectoriales'), first covering 2020-2030",
     "coverage_tier": "economy_wide_all_gases", "notes": None, "source": "Ley 21.455"},
    {"iso3": "CHE", "country_name": "Switzerland", "is_bloc": False,
     "law_or_pledge_name": "Climate and Innovation Act (Klimaschutzgesetz), approved by national referendum",
     "enacted_or_announced": "2023-06", "binding_tier": "enacted_law",
     "target_type": "net_zero", "target_year": 2050,
     "interim_tier": "binding_interim", "interim_desc": "-65% by 2035, -75% by 2040 vs 1990 (legislated)",
     "coverage_tier": "economy_wide_all_gases", "notes": None, "source": "Klimaschutzgesetz (2023 referendum)"},
    {"iso3": "IRL", "country_name": "Ireland", "is_bloc": False,
     "law_or_pledge_name": "Climate Action and Low Carbon Development (Amendment) Act 2021",
     "enacted_or_announced": "2021-07", "binding_tier": "enacted_law",
     "target_type": "net_zero", "target_year": 2050,
     "interim_tier": "binding_interim", "interim_desc": "Legally binding 5-year carbon budgets + sectoral "
                                                        "emissions ceilings",
     "coverage_tier": "economy_wide_all_gases",
     "notes": "Also bound by the overlying EU Climate Law.", "source": "Climate Action and Low Carbon Development (Amendment) Act 2021"},
    {"iso3": "FIN", "country_name": "Finland", "is_bloc": False,
     "law_or_pledge_name": "Climate Change Act (Ilmastolaki 423/2022)",
     "enacted_or_announced": "2022-07", "binding_tier": "enacted_law",
     "target_type": "net_zero", "target_year": 2035,
     "interim_tier": "binding_interim", "interim_desc": "-60% by 2030, -80% by 2040 vs 1990 (legislated)",
     "coverage_tier": "economy_wide_all_gases",
     "notes": "Also bound by the overlying EU Climate Law; one of the most ambitious legislated target years "
              "globally.", "source": "Ilmastolaki 423/2022"},
    {"iso3": "USA", "country_name": "United States", "is_bloc": False,
     "law_or_pledge_name": "None enacted federally; historical 2050 net-zero commitment was a non-binding "
                           "NDC/executive-branch goal (Executive Order 14008, 2021)",
     "enacted_or_announced": "n/a (policy only)", "binding_tier": "none_or_superseded",
     "target_type": "none", "target_year": None,
     "interim_tier": "none", "interim_desc": "No current binding domestic target",
     "coverage_tier": "partial_or_aspirational",
     "notes": "The US formally re-initiated withdrawal from the Paris Agreement in Jan 2025 (effective ~1 year "
              "later per Article 28); the prior 2050 target is treated here as superseded and excluded from "
              "scoring. Historical reference only: pre-withdrawal NDC target year was 2050.",
     "historical_target_year_pre_withdrawal": 2050,
     "source": "Executive Order 14008 (2021); 2025 Paris Agreement withdrawal notice"},
    {"iso3": "CHN", "country_name": "China", "is_bloc": False,
     "law_or_pledge_name": "2060 carbon-neutrality pledge (announced UNGA, Sept 2020), incorporated into the "
                           "14th Five-Year Plan (2021-2025)",
     "enacted_or_announced": "2020-09", "binding_tier": "policy_plan_embedded",
     "target_type": "net_zero", "target_year": 2060,
     "interim_tier": "planned_interim_non_binding",
     "interim_desc": "14th Five-Year Plan carbon-intensity reduction targets (intensity-based, not an "
                     "absolute cap)",
     "coverage_tier": "partial_or_aspirational",
     "notes": "Primarily CO2/carbon-intensity framed rather than a comprehensive absolute multi-gas "
              "economy-wide cap.",
     "source": "Xi Jinping UNGA address, Sept 2020; 14th Five-Year Plan"},
    {"iso3": "IND", "country_name": "India", "is_bloc": False,
     "law_or_pledge_name": "Net-zero-by-2070 pledge ('Panchamrit'), announced COP26, Nov 2021",
     "enacted_or_announced": "2021-11", "binding_tier": "ndc_pledge_only",
     "target_type": "net_zero", "target_year": 2070,
     "interim_tier": "none", "interim_desc": "Updated NDC (Aug 2022) sets 2030 targets (50% non-fossil "
                                             "capacity, -45% emissions intensity vs 2005) as international "
                                             "pledges, not domestic statute",
     "coverage_tier": "partial_or_aspirational", "notes": None,
     "source": "COP26 announcement, Nov 2021; India's updated NDC, Aug 2022"},
    {"iso3": "BRA", "country_name": "Brazil", "is_bloc": False,
     "law_or_pledge_name": "Updated NDC reaffirming climate-neutrality-by-2050; base law is the National "
                           "Policy on Climate Change (Law 12.187/2009)",
     "enacted_or_announced": "2009 (base law); 2023-2024 (NDC updates)", "binding_tier": "ndc_pledge_only",
     "target_type": "net_zero", "target_year": 2050,
     "interim_tier": "none", "interim_desc": "2030 NDC targets (37%/50% reduction vs 2005) are international "
                                             "pledges, not enacted domestic statute",
     "coverage_tier": "economy_wide_all_gases",
     "notes": "NDC is explicitly economy-wide including LULUCF, even though the domestic base law does not "
              "itself fix a net-zero year.",
     "source": "Law 12.187/2009; Brazil's updated NDC"},
    {"iso3": "MEX", "country_name": "Mexico", "is_bloc": False,
     "law_or_pledge_name": "General Climate Change Law (amended) -- aspirational 50% reduction by 2050 vs 2000",
     "enacted_or_announced": "2012 (base law, amended since)", "binding_tier": "policy_plan_embedded",
     "target_type": "reduction_target", "target_year": 2050,
     "interim_tier": "none", "interim_desc": "No separate legally binding interim milestone beyond the "
                                             "single 2050 figure",
     "coverage_tier": "partial_or_aspirational",
     "notes": "No legislated net-zero year -- the law sets a partial (50%) reduction target framed as "
              "aspirational/indicative rather than enforceable. Ambition axis uses target_year regardless of "
              "target_type (stated modeling simplification).",
     "source": "Ley General de Cambio Climatico (amended)"},
    {"iso3": "NOR", "country_name": "Norway", "is_bloc": False,
     "law_or_pledge_name": "Climate Change Act (Klimaloven)",
     "enacted_or_announced": "2017-06", "binding_tier": "enacted_law",
     "target_type": "reduction_target", "target_year": 2050,
     "interim_tier": "binding_interim", "interim_desc": "Legislated 2030 target: at least 55% reduction vs 1990",
     "coverage_tier": "economy_wide_all_gases",
     "notes": "Target is framed as a 90-95% reduction vs 1990, not officially 'net zero'. Norway has also "
              "pledged (separately, as a political declaration not enacted in the Climate Change Act) to be "
              "carbon-neutral by 2030 largely via international emissions trading/offsets -- excluded from "
              "this score as a non-legislated aspiration.",
     "source": "Klimaloven (Climate Change Act) 2017"},
]

# EU member states (among the sovereign-corporate-bridge's 37 countries) that
# don't have their own dedicated entry above -- the EU Climate Law applies to
# them directly as a supranational regulation.
EU_FALLBACK_ISO3 = {"NLD", "POL", "CZE", "HUN", "ROU", "PRT", "GRC", "AUT", "BEL", "ITA"}

_BY_ISO3 = {c["iso3"]: c for c in COUNTRIES}


def _score(rec: Dict[str, Any]) -> Dict[str, Any]:
    binding_pts = BINDING_POINTS[rec["binding_tier"]]
    year = rec.get("target_year")
    if year:
        ambition_pts = max(0.0, min(AMBITION_MAX_POINTS,
                            AMBITION_MAX_POINTS * (AMBITION_MAX_YEAR - year) / (AMBITION_MAX_YEAR - AMBITION_MIN_YEAR)))
    else:
        ambition_pts = 0.0
    interim_pts = INTERIM_POINTS[rec["interim_tier"]]
    coverage_pts = COVERAGE_POINTS[rec["coverage_tier"]]
    total = binding_pts + ambition_pts + interim_pts + coverage_pts
    return {
        "binding_points": binding_pts, "ambition_points": round(ambition_pts, 1),
        "interim_points": interim_pts, "coverage_points": coverage_pts,
        "stringency_score": round(total, 1),
    }


def _with_score(rec: Dict[str, Any]) -> Dict[str, Any]:
    return {**rec, "score": _score(rec)}


@router.get("/countries")
def countries() -> dict:
    out = [_with_score(c) for c in COUNTRIES]
    out.sort(key=lambda c: c["score"]["stringency_score"], reverse=True)
    return {"count": len(out), "countries": out, "provenance": EXTRACT_PROVENANCE}


@router.get("/country/{iso3}")
def country(iso3: str) -> dict:
    code = iso3.strip().upper()
    rec = _BY_ISO3.get(code)
    if rec is None and code in EU_FALLBACK_ISO3:
        rec = {**_BY_ISO3["EUU"], "iso3": code,
               "notes": f"{code} is an EU member state; the EU Climate Law (Regulation (EU) 2021/1119) applies "
                        "directly. This country may also have its own supplementary national climate "
                        "legislation not itemized in this seeded extract."}
    if rec is None:
        raise HTTPException(status_code=404,
                             detail=f"No seeded climate-policy entry for '{iso3}'. See /api/v1/climate-policy/countries.")
    return {**_with_score(rec), "provenance": EXTRACT_PROVENANCE}


# ── Upstream availability check (mirrors vcm_registry.py's honesty pattern) ──

_status_cache: Dict[str, tuple] = {}
_status_lock = threading.Lock()
_STATUS_TTL = 600


@router.get("/status")
def status() -> dict:
    """Report Climate Policy Radar's actual access method (no live API exists)."""
    now = time.time()
    with _status_lock:
        hit = _status_cache.get("status")
        if hit and hit[0] > now:
            return hit[1]
    reachable, detail = False, ""
    try:
        resp = requests.get("https://climatepolicyradar.org", timeout=10,
                             headers={"User-Agent": "RiskAnalyticsPlatform/1.0"})
        reachable = resp.status_code == 200
        detail = f"HTTP {resp.status_code}"
    except Exception as exc:  # noqa: BLE001
        detail = f"unreachable: {exc}"
    result = {
        "source": "Climate Policy Radar",
        "mode": "seeded-real-extract",
        "live_api_exists": False,
        "site_reachable": reachable, "site_check_detail": detail,
        "seeded_countries": len(COUNTRIES),
        "note": ("No public API found at climatepolicyradar.org / app.climatepolicyradar.org as of the last "
                 "check. Data access is via open dataset exports (Hugging Face `ClimatePolicyRadar/*`, GitHub "
                 "`climatepolicyradar/open-data`), not a live REST API. This module serves a hand-authored "
                 "seeded extract with a fully documented, transparent scoring formula -- see module docstring."),
        "provenance": EXTRACT_PROVENANCE,
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }
    with _status_lock:
        _status_cache["status"] = (now + _STATUS_TTL, result)
    return result
