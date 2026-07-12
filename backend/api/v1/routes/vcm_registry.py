"""VCM Cross-Registry Tracker -- registry-level voluntary carbon market aggregates.

DATA STATUS (verified 2026-07-04):
  - CarbonPlan OffsetsDB has a real API at https://offsets-db.fly.dev (FastAPI,
    /projects, /credits, /charts/*) BUT every data endpoint is gated behind an
    `X-API-KEY` header (403 without one; confirmed via openapi.json security
    schemes + direct probes). Its S3 parquet mirror
    (carbonplan-offsets-db.s3.us-west-2.amazonaws.com) also returns 403.
  - Berkeley VROD is an Excel bulk download (no API).
  => Per platform policy this module therefore serves a HAND-AUTHORED REAL
     AGGREGATE EXTRACT: approximate cumulative issuance/retirement volumes and
     category mixes by registry, compiled from public registry disclosures,
     Berkeley Voluntary Registry Offsets Database releases and CarbonPlan
     OffsetsDB public reporting. Figures are order-of-magnitude-faithful
     approximations (Mt CO2e), NOT registry-reconciled numbers.
     REFRESH FROM BERKELEY VROD / CARBONPLAN OFFSETSDB FOR PRODUCTION.

If an OffsetsDB API key is ever provisioned, set OFFSETS_DB_API_KEY in the
environment: /status will report it and the module can be upgraded to a live
proxy over /charts/credits_by_category etc.

Endpoints (GET-only public reference data):
  GET /api/v1/vcm-registry/summary     -- market-wide KPIs + extract metadata
  GET /api/v1/vcm-registry/registries  -- per-registry aggregates + category mix
  GET /api/v1/vcm-registry/annual      -- issuance/retirement by year by registry
  GET /api/v1/vcm-registry/status      -- upstream OffsetsDB availability check
"""

from __future__ import annotations

import os
import threading
import time

import requests
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/vcm-registry", tags=["vcm-registry"])

EXTRACT_PROVENANCE = {
    "kind": "real aggregate extract (hand-authored, approximate)",
    "compiled": "2026-07-04",
    "data_as_of": "circa end-2025",
    "units": "Mt CO2e (million tonnes)",
    "sources": [
        "Berkeley Voluntary Registry Offsets Database (VROD) public releases",
        "CarbonPlan OffsetsDB public reporting (API is key-gated; verified 403 without X-API-KEY on 2026-07-04)",
        "Registry public dashboards: Verra, Gold Standard, ACR, CAR, ART TREES, Puro.earth",
    ],
    "caveat": (
        "Approximate registry-level aggregates for analytics context only — "
        "refresh from Berkeley VROD / CarbonPlan OffsetsDB for production."
    ),
    "live": False,
}

# ── The extract ───────────────────────────────────────────────────────────────
# cumulative_issued_mt / cumulative_retired_mt: approximate lifetime totals.
# categories: approximate share (%) of cumulative issuance by project category.

REGISTRIES = [
    {
        "key": "verra",
        "name": "Verra (VCS)",
        "operator": "Verra — Verified Carbon Standard",
        "cumulative_issued_mt": 1420.0,
        "cumulative_retired_mt": 790.0,
        "projects_approx": 2100,
        "first_major_issuance_year": 2009,
        "scope": "Largest VCM registry; global, all major project types",
        "categories": {
            "Forestry & Land Use": 47, "Renewable Energy": 33,
            "Chemical & Industrial": 7, "Household & Community": 6,
            "Agriculture": 4, "Waste Management": 2, "Other": 1,
        },
    },
    {
        "key": "gold_standard",
        "name": "Gold Standard",
        "operator": "Gold Standard for the Global Goals",
        "cumulative_issued_mt": 340.0,
        "cumulative_retired_mt": 215.0,
        "projects_approx": 1450,
        "first_major_issuance_year": 2008,
        "scope": "SDG-co-benefit focus; strong cookstove/renewables base",
        "categories": {
            "Renewable Energy": 54, "Household & Community": 33,
            "Forestry & Land Use": 8, "Waste Management": 3,
            "Agriculture": 1, "Other": 1,
        },
    },
    {
        "key": "acr",
        "name": "ACR",
        "operator": "American Carbon Registry (Winrock / Environmental Resources Trust)",
        "cumulative_issued_mt": 280.0,
        "cumulative_retired_mt": 135.0,
        "projects_approx": 330,
        "first_major_issuance_year": 2008,
        "scope": "US-centric; large IFM forestry + ODS destruction volumes",
        "categories": {
            "Forestry & Land Use": 52, "Chemical & Industrial": 27,
            "Waste Management": 14, "Agriculture": 4, "Other": 3,
        },
    },
    {
        "key": "car",
        "name": "CAR",
        "operator": "Climate Action Reserve",
        "cumulative_issued_mt": 215.0,
        "cumulative_retired_mt": 120.0,
        "projects_approx": 700,
        "first_major_issuance_year": 2009,
        "scope": "North America protocols (forestry, ODS, livestock, landfill)",
        "categories": {
            "Forestry & Land Use": 51, "Chemical & Industrial": 22,
            "Agriculture": 12, "Waste Management": 12, "Other": 3,
        },
    },
    {
        "key": "art",
        "name": "ART TREES",
        "operator": "Architecture for REDD+ Transactions (Winrock)",
        "cumulative_issued_mt": 42.0,
        "cumulative_retired_mt": 7.0,
        "projects_approx": 5,
        "first_major_issuance_year": 2021,
        "scope": "Jurisdictional REDD+ only (e.g. Guyana); CORSIA-eligible",
        "categories": {"Forestry & Land Use": 100},
    },
    {
        "key": "puro",
        "name": "Puro.earth",
        "operator": "Puro.earth (Nasdaq)",
        "cumulative_issued_mt": 1.9,
        "cumulative_retired_mt": 0.9,
        "projects_approx": 150,
        "first_major_issuance_year": 2020,
        "scope": "Durable/engineered CDR only (biochar-dominant CORCs)",
        "categories": {"Engineered CDR": 100},
    },
]

# Approximate annual issuance and retirement by registry (Mt CO2e). Pre-2016
# activity is rolled into the "pre_2016" row so annual rows + pre_2016 sum to
# the cumulative totals above.
ANNUAL = {
    "years": [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
    "issued_mt": {
        "verra":         [40, 60, 85, 120, 150, 255, 170, 160, 150, 140],
        "gold_standard": [12, 15, 18, 22, 28, 45, 40, 42, 44, 45],
        "acr":           [8, 10, 14, 20, 28, 42, 38, 35, 30, 28],
        "car":           [10, 12, 14, 16, 18, 25, 22, 20, 18, 16],
        "art":           [0, 0, 0, 0, 0, 12, 21, 0, 5, 4],
        "puro":          [0, 0, 0, 0, 0.05, 0.1, 0.2, 0.35, 0.5, 0.7],
    },
    "retired_mt": {
        "verra":         [20, 25, 35, 55, 75, 115, 100, 95, 90, 95],
        "gold_standard": [5, 7, 9, 12, 16, 28, 30, 32, 33, 35],
        "acr":           [4, 5, 7, 9, 12, 18, 17, 16, 15, 14],
        "car":           [5, 6, 7, 8, 10, 14, 13, 12, 11, 10],
        "art":           [0, 0, 0, 0, 0, 0, 0, 1, 3, 3],
        "puro":          [0, 0, 0, 0, 0, 0.03, 0.08, 0.15, 0.25, 0.35],
    },
    "pre_2016_issued_mt": {
        "verra": 90, "gold_standard": 29, "acr": 27, "car": 44, "art": 0, "puro": 0,
    },
    "pre_2016_retired_mt": {
        "verra": 85, "gold_standard": 8, "acr": 18, "car": 24, "art": 0, "puro": 0,
    },
}


# ── Routes ────────────────────────────────────────────────────────────────────


@router.get("/summary")
def summary() -> dict:
    total_issued = sum(r["cumulative_issued_mt"] for r in REGISTRIES)
    total_retired = sum(r["cumulative_retired_mt"] for r in REGISTRIES)
    return {
        "registry_count": len(REGISTRIES),
        "total_issued_mt": round(total_issued, 1),
        "total_retired_mt": round(total_retired, 1),
        "overall_retirement_rate_pct": round(total_retired / total_issued * 100, 1) if total_issued else 0,
        "provenance": EXTRACT_PROVENANCE,
    }


@router.get("/registries")
def registries() -> dict:
    out = []
    for r in REGISTRIES:
        issued, retired = r["cumulative_issued_mt"], r["cumulative_retired_mt"]
        out.append({
            **r,
            "retirement_rate_pct": round(retired / issued * 100, 1) if issued else 0,
            "outstanding_mt": round(issued - retired, 1),
        })
    return {"registries": out, "provenance": EXTRACT_PROVENANCE}


@router.get("/annual")
def annual() -> dict:
    return {"annual": ANNUAL, "provenance": EXTRACT_PROVENANCE}


# ── Upstream availability check (cached) ─────────────────────────────────────

_status_cache: dict[str, tuple[float, dict]] = {}
_status_lock = threading.Lock()
_STATUS_TTL = 600


@router.get("/status")
def upstream_status() -> dict:
    """Report whether the (key-gated) CarbonPlan OffsetsDB API is reachable."""
    now = time.time()
    with _status_lock:
        hit = _status_cache.get("status")
        if hit and hit[0] > now:
            return hit[1]
    api_key_configured = bool(os.environ.get("OFFSETS_DB_API_KEY"))
    reachable = False
    detail = ""
    try:
        resp = requests.get(
            "https://offsets-db.fly.dev/health",
            headers={"User-Agent": "RiskAnalyticsPlatform/1.0"},
            timeout=10,
        )
        reachable = resp.status_code == 200
        detail = f"HTTP {resp.status_code}"
    except Exception as exc:  # noqa: BLE001
        detail = f"unreachable: {exc}"
    result = {
        "offsets_db_api": "https://offsets-db.fly.dev",
        "reachable": reachable,
        "detail": detail,
        "data_endpoints_key_gated": True,
        "api_key_configured": api_key_configured,
        "note": (
            "All OffsetsDB data endpoints require an X-API-KEY header. "
            "This module serves a hand-authored real aggregate extract until a key is provisioned."
        ),
    }
    with _status_lock:
        _status_cache["status"] = (now + _STATUS_TTL, result)
    return result
