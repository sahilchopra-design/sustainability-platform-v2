"""
Facility Emissions Attribution — Climate TRACE proxy
====================================================
Prefix: /api/v1/climate-trace
Tags:   Facility Emissions Attribution

Proxies the FREE, KEYLESS Climate TRACE v6 API (https://api.climatetrace.org/v6)
for facility/source-level emissions, licensed CC-BY 4.0. Endpoints:

  GET /definitions    — sector + country pick-lists for the UI filters
  GET /facilities     — asset search by country + sector, normalised to
                        {name, owner, country, sector, asset_type, co2e_tyr, ...}

Data is real, measured/estimated facility emissions from Climate TRACE — no
PRNG, no fabrication. An in-process TTL cache keeps repeat queries off the API.
"""

from __future__ import annotations

import time
import threading
from typing import Any, Dict, List, Optional, Tuple

import requests
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/v1/climate-trace", tags=["Facility Emissions Attribution"])

CT_BASE = "https://api.climatetrace.org/v6"

# ── In-process TTL cache ─────────────────────────────────────────────────────
_CACHE: Dict[str, Tuple[float, Any]] = {}
_CACHE_LOCK = threading.Lock()
_TTL_SECONDS = 60 * 60 * 12  # 12h — Climate TRACE snapshots are annual/monthly


def _cache_get(key: str) -> Optional[Any]:
    with _CACHE_LOCK:
        hit = _CACHE.get(key)
        if hit and (time.time() - hit[0]) < _TTL_SECONDS:
            return hit[1]
        if hit:
            _CACHE.pop(key, None)
    return None


def _cache_put(key: str, value: Any) -> None:
    with _CACHE_LOCK:
        _CACHE[key] = (time.time(), value)


def _ct_get(path: str, params: Optional[List[Tuple[str, Any]]] = None) -> Any:
    try:
        r = requests.get(f"{CT_BASE}/{path}", params=params or [], timeout=45)
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Climate TRACE request failed: {exc}")
    if r.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Climate TRACE returned {r.status_code}")
    return r.json()


@router.get("/definitions")
def definitions() -> Dict[str, Any]:
    """Sector + country pick-lists (cached) for the frontend filter controls."""
    cached = _cache_get("definitions")
    if cached is not None:
        return {**cached, "cached": True}
    sectors = _ct_get("definitions/sectors")
    countries = _ct_get("definitions/countries")
    result = {
        "source": "Climate TRACE v6 (api.climatetrace.org)",
        "license": "CC-BY 4.0",
        "sectors": sectors,
        "countries": countries,
        "cached": False,
    }
    _cache_put("definitions", result)
    return result


def _co2e_of(asset: Dict[str, Any]) -> float:
    """Pull the 100-yr CO2e total from an asset's EmissionsSummary."""
    best = 0.0
    for e in asset.get("EmissionsSummary", []) or []:
        if e.get("Gas") == "co2e_100yr":
            return float(e.get("EmissionsQuantity") or 0.0)
        best = max(best, float(e.get("EmissionsQuantity") or 0.0))
    return best


def _owner_of(asset: Dict[str, Any]) -> str:
    owners = asset.get("Owners") or []
    if owners:
        # De-duplicate — Climate TRACE repeats the majority owner per gas.
        names = list(dict.fromkeys(o.get("CompanyName") for o in owners if o.get("CompanyName")))
        if names:
            return names[0] if len(names) == 1 else f"{names[0]} (+{len(names)-1})"
    return asset.get("ReportingEntity") or "—"


@router.get("/facilities")
def facilities(
    country: str = Query(..., min_length=2, max_length=3, description="ISO alpha-3 country (e.g. POL)"),
    sector: str = Query(..., description="Climate TRACE sector key (e.g. power)"),
    year: int = Query(2024, ge=2015, le=2024, description="Emissions year"),
    limit: int = Query(100, ge=1, le=500),
) -> Dict[str, Any]:
    """
    Return facility-level emissions for a country + sector, normalised for the
    attribution table. Real Climate TRACE asset records.
    """
    cache_key = f"{country.upper()}:{sector}:{year}:{limit}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return {**cached, "cached": True}

    params = [
        ("countries", country.upper()),
        ("sectors", sector),
        ("year", year),
        ("limit", limit),
    ]
    data = _ct_get("assets", params)
    assets = data.get("assets", []) if isinstance(data, dict) else (data or [])

    facilities_out: List[Dict[str, Any]] = []
    for a in assets:
        co2e = _co2e_of(a)
        cap = None
        activity = None
        for e in a.get("EmissionsSummary", []) or []:
            if e.get("Gas") == "co2e_100yr":
                cap = e.get("Capacity")
                activity = e.get("Activity")
                break
        facilities_out.append({
            "id": a.get("Id"),
            "name": a.get("Name") or "Unnamed asset",
            "owner": _owner_of(a),
            "country": a.get("Country"),
            "sector": a.get("Sector"),
            "asset_type": a.get("AssetType") or "—",
            "co2e_tyr": round(co2e),
            "capacity": cap,
            "activity": activity,
        })
    facilities_out.sort(key=lambda f: f["co2e_tyr"], reverse=True)
    total = sum(f["co2e_tyr"] for f in facilities_out)

    result = {
        "source": "Climate TRACE v6 assets API (api.climatetrace.org/v6/assets)",
        "license": "CC-BY 4.0",
        "query": {"country": country.upper(), "sector": sector, "year": year},
        "facility_count": len(facilities_out),
        "total_co2e_tyr": total,
        "facilities": facilities_out,
        "cached": False,
    }
    _cache_put(cache_key, result)
    return result


@router.get("/health")
def ct_health() -> Dict[str, Any]:
    """Lightweight upstream check for the Climate TRACE proxy."""
    try:
        r = requests.get(f"{CT_BASE}/definitions/sectors", timeout=15)
        return {"ok": r.status_code == 200, "upstream_status": r.status_code}
    except Exception as exc:  # pragma: no cover
        return {"ok": False, "error": str(exc)}
