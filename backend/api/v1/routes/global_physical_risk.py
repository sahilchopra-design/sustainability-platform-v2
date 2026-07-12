"""
API Routes: Global Physical Risk Engine — Composite Digital-Twin Overlay
==========================================================================
POST /api/v1/global-physical-risk/point-profile      — Full multi-hazard profile for one point
POST /api/v1/global-physical-risk/portfolio-profile   — Batch profile for up to 200 locations
GET  /api/v1/global-physical-risk/region-summary      — Aggregate hazard stats over a bounding box
GET  /api/v1/global-physical-risk/coverage-stats      — Digital-twin build progress per hazard layer

This is the composite layer ABOVE the single-layer point queries in
`api/v1/routes/spatial.py`. It queries all 5 global hazard grids
(earthquake, cyclone, wildfire, flood, sea-level-rise) for a point/region and
returns a documented, transparent 0-100 composite physical risk score — see
`services/global_physical_risk_engine.py` for the exact normalization and
weighting formulas.

`ref_protected_areas` is out of scope here (empty pending WDPA license).
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from db.base import get_db
from services.global_physical_risk_engine import (
    get_point_hazard_profile,
    get_region_summary,
    get_coverage_stats,
    build_risk_narrative,
)

router = APIRouter(prefix="/api/v1/global-physical-risk", tags=["Global Physical Risk (Digital Twin)"])


# ---------------------------------------------------------------------------
# Request Models
# ---------------------------------------------------------------------------

class PointProfileRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lon: float = Field(..., ge=-180, le=180, description="Longitude")
    radius_km: float = Field(25.0, ge=0.1, le=200.0, description="Fallback search radius (km) when the point is not contained in any zone polygon")


class PortfolioLocation(BaseModel):
    id: str = Field(..., description="Caller-supplied identifier for this location (e.g. asset ID)")
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)


class PortfolioProfileRequest(BaseModel):
    locations: List[PortfolioLocation] = Field(..., min_length=1, max_length=200)
    radius_km: float = Field(25.0, ge=0.1, le=200.0)


# ---------------------------------------------------------------------------
# POST /point-profile
# ---------------------------------------------------------------------------

@router.post(
    "/point-profile",
    summary="Full multi-hazard composite physical risk profile for a single point",
    description=(
        "Queries all 5 global hazard layers (earthquake, cyclone, wildfire, flood, "
        "sea-level-rise) for the given lat/lon, returns raw zone data + a normalized "
        "0-100 score per hazard, a weighted composite score (re-normalized over "
        "whichever hazards actually have data), a data_availability breakdown showing "
        "which layers were populated vs. empty, and a plain-language risk narrative. "
        "Never errors on missing data — a location with zero populated hazard layers "
        "returns composite_score=null with a clear explanatory note."
    ),
)
def point_profile(req: PointProfileRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    try:
        profile = get_point_hazard_profile(db, lat=req.lat, lon=req.lon, radius_km=req.radius_km)
        profile["risk_narrative"] = build_risk_narrative(profile)
        return profile
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Global physical risk query error: {exc}") from exc


# ---------------------------------------------------------------------------
# POST /portfolio-profile
# ---------------------------------------------------------------------------

@router.post(
    "/portfolio-profile",
    summary="Batch multi-hazard composite profile for a portfolio of locations (max 200)",
    description=(
        "Runs point-profile logic for each location in the batch (capped at 200 per "
        "request) and returns per-location composite scores plus a portfolio-level "
        "summary (avg/max composite, count with any hazard data). Each location's "
        "profile independently reports its own data_availability — a single missing "
        "layer for one asset never affects another asset's score."
    ),
)
def portfolio_profile(req: PortfolioProfileRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    results: List[Dict[str, Any]] = []
    composite_scores: List[float] = []

    for loc in req.locations:
        try:
            profile = get_point_hazard_profile(db, lat=loc.lat, lon=loc.lon, radius_km=req.radius_km)
            profile["risk_narrative"] = build_risk_narrative(profile)
            profile["id"] = loc.id
            results.append(profile)
            if profile.get("composite_score") is not None:
                composite_scores.append(profile["composite_score"])
        except Exception as exc:
            results.append({
                "id": loc.id,
                "latitude": loc.lat,
                "longitude": loc.lon,
                "error": str(exc),
                "composite_score": None,
            })

    return {
        "count": len(results),
        "results": results,
        "portfolio_summary": {
            "locations_with_composite_score": len(composite_scores),
            "locations_without_data": len(results) - len(composite_scores),
            "avg_composite_score": round(sum(composite_scores) / len(composite_scores), 1) if composite_scores else None,
            "max_composite_score": round(max(composite_scores), 1) if composite_scores else None,
            "min_composite_score": round(min(composite_scores), 1) if composite_scores else None,
        },
    }


# ---------------------------------------------------------------------------
# GET /region-summary
# ---------------------------------------------------------------------------

@router.get(
    "/region-summary",
    summary="Aggregate hazard statistics over a bounding box",
    description=(
        "Returns per-hazard cell counts, average/max raw driver values, and an "
        "approximate region-average composite score for a bounding box "
        "(min_lon, min_lat, max_lon, max_lat). Intended for portfolio/regional "
        "overview screens — use /point-profile for per-asset precision."
    ),
)
def region_summary(
    min_lon: float = Query(..., ge=-180, le=180),
    min_lat: float = Query(..., ge=-90, le=90),
    max_lon: float = Query(..., ge=-180, le=180),
    max_lat: float = Query(..., ge=-90, le=90),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    if min_lon >= max_lon or min_lat >= max_lat:
        raise HTTPException(status_code=422, detail="min_lon/min_lat must be strictly less than max_lon/max_lat")
    try:
        return get_region_summary(db, min_lon=min_lon, min_lat=min_lat, max_lon=max_lon, max_lat=max_lat)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Region summary query error: {exc}") from exc


# ---------------------------------------------------------------------------
# GET /coverage-stats
# ---------------------------------------------------------------------------

@router.get(
    "/coverage-stats",
    summary="Digital-twin build progress — row counts + spatial extent per hazard layer",
    description=(
        "Reports row counts, spatial extent (min/max lat/lon with data), distinct "
        "country coverage, and last-updated timestamp for each of the 5 hazard "
        "reference tables. This is the 'how much of the global digital twin is "
        "built' metric — poll this to track sibling ingestion pipeline progress."
    ),
)
def coverage_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    try:
        return get_coverage_stats(db)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Coverage stats query error: {exc}") from exc
