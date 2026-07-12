"""
API Routes: Wildfire Hazard Grid Status
================================================
GET /api/v1/wildfire-risk/status  — row count + coverage stats for ref_wildfire_zones
GET /api/v1/wildfire-risk/point   — hazard data for the grid cell containing (or nearest
                                     to, if the point falls in an ocean/unmapped cell)
                                     a given lat/lon

Backed by ref_wildfire_zones, populated by ingestion/wildfire_grid_ingester.py from the
real GWIS/EFFIS MCD64A1 burned-area bulk dataset (JRC/Copernicus, keyless), aggregated
onto a 2deg x 2deg land grid, with an optional NASA FIRMS per-cell detection-density
enrichment layer (active only when NASA_FIRMS_MAP_KEY is set). See that ingester's module
docstring for full methodology, including the documented risk-tiering thresholds, the
country-level resolution limitation, and exactly what `fwi_mean` does and does not
represent (it is a documented 0-10 burned-area-derived proxy, NOT the physical Canadian
Fire Weather Index).

Note: the general-purpose POST /api/v1/spatial/point/hazards endpoint (spatial.py) also
queries ref_wildfire_zones as one of four hazard layers for a point; this router adds a
wildfire-specific status/coverage view and a single-hazard point lookup with the same
nearest-fallback convention used by usgs_earthquake.py.
"""
from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from db.base import get_db

router = APIRouter(prefix="/api/v1/wildfire-risk", tags=["Wildfire Hazard Grid"])


@router.get(
    "/status",
    summary="Row count, coverage bounds and aggregate stats for ref_wildfire_zones",
)
def wildfire_risk_status(db: Session = Depends(get_db)):
    try:
        stats = db.execute(text("""
            SELECT
                COUNT(*)                                          AS row_count,
                MIN(ST_YMin(zone_boundary))                        AS min_lat,
                MAX(ST_YMax(zone_boundary))                        AS max_lat,
                MIN(ST_XMin(zone_boundary))                        AS min_lon,
                MAX(ST_XMax(zone_boundary))                        AS max_lon,
                COUNT(DISTINCT country_iso3)                       AS countries_covered,
                ROUND(AVG(fwi_mean)::NUMERIC, 3)                   AS global_mean_fwi_proxy,
                MAX(fwi_mean)                                      AS max_fwi_proxy,
                COUNT(*) FILTER (WHERE risk_level = 'extreme')     AS extreme_zones,
                COUNT(*) FILTER (WHERE risk_level = 'high')        AS high_zones,
                COUNT(*) FILTER (WHERE risk_level = 'moderate')    AS moderate_zones,
                COUNT(*) FILTER (WHERE risk_level = 'low')         AS low_zones,
                MAX(scenario)                                      AS scenario_sample,
                MAX(data_source)                                   AS data_source_sample
            FROM ref_wildfire_zones
        """)).mappings().one()

        return {
            "row_count": stats["row_count"],
            "coverage": {
                "min_lat": stats["min_lat"],
                "max_lat": stats["max_lat"],
                "min_lon": stats["min_lon"],
                "max_lon": stats["max_lon"],
                "countries_covered": stats["countries_covered"],
            },
            "global_mean_fwi_proxy": (
                float(stats["global_mean_fwi_proxy"]) if stats["global_mean_fwi_proxy"] is not None else None
            ),
            "max_fwi_proxy": (
                float(stats["max_fwi_proxy"]) if stats["max_fwi_proxy"] is not None else None
            ),
            "risk_level_counts": {
                "extreme": stats["extreme_zones"],
                "high": stats["high_zones"],
                "moderate": stats["moderate_zones"],
                "low": stats["low_zones"],
            },
            "scenario": stats["scenario_sample"],
            "data_source": stats["data_source_sample"],
            "note": (
                "Populated by ingestion/wildfire_grid_ingester.py from the real GWIS/EFFIS "
                "MCD64A1 burned-area bulk dataset, aggregated onto a 2x2 deg land grid. "
                "fwi_mean is a documented 0-10 burned-area-derived proxy, NOT the physical "
                "Canadian Fire Weather Index -- see the ingester's module docstring. "
                "Returns zeroed stats if the ingester has not yet been run."
            ),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Wildfire risk status error: {exc}") from exc


@router.get(
    "/point",
    summary="Wildfire hazard for the grid cell containing (or nearest to) a lat/lon point",
)
def wildfire_risk_point(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
    db: Session = Depends(get_db),
):
    params: Dict[str, Any] = {"lat": lat, "lng": lon}
    try:
        row = db.execute(text("""
            SELECT zone_id, risk_level, scenario, country_iso3, fwi_mean, data_source,
                   ST_XMin(zone_boundary) AS min_lon, ST_YMin(zone_boundary) AS min_lat,
                   ST_XMax(zone_boundary) AS max_lon, ST_YMax(zone_boundary) AS max_lat
            FROM ref_wildfire_zones
            WHERE ST_Within(
                ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
                zone_boundary
            )
            LIMIT 1
        """), params).mappings().first()

        if row:
            result = dict(row)
            result["match_type"] = "contains"
            result["latitude"] = lat
            result["longitude"] = lon
            return result

        # No land cell contains this point (open ocean, or a small
        # island/coastline missed by the ingester's land mask) -- fall back
        # to the nearest populated cell by centroid distance.
        nearest = db.execute(text("""
            SELECT zone_id, risk_level, scenario, country_iso3, fwi_mean, data_source,
                   ST_XMin(zone_boundary) AS min_lon, ST_YMin(zone_boundary) AS min_lat,
                   ST_XMax(zone_boundary) AS max_lon, ST_YMax(zone_boundary) AS max_lat,
                   ST_Distance(
                       ST_Centroid(zone_boundary),
                       ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)
                   ) AS distance_deg
            FROM ref_wildfire_zones
            ORDER BY distance_deg
            LIMIT 1
        """), params).mappings().first()

        if not nearest:
            raise HTTPException(
                status_code=404,
                detail="ref_wildfire_zones has no rows -- run the wildfire grid ingester first",
            )

        result = dict(nearest)
        result["match_type"] = "nearest_fallback"
        result["latitude"] = lat
        result["longitude"] = lon
        return result
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Wildfire risk point query error: {exc}") from exc
