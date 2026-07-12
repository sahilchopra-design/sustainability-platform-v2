"""
API Routes: USGS Earthquake Seismic-Hazard Grid
================================================
GET /api/v1/usgs-earthquake/status  — row count + coverage stats for ref_earthquake_zones
GET /api/v1/usgs-earthquake/point   — hazard data for the grid cell containing (or nearest
                                       to, if the point falls in an ocean/unmapped cell)
                                       a given lat/lon

Backed by ref_earthquake_zones, populated by ingestion/usgs_earthquake_ingester.py from the
real USGS Earthquake Catalog (ANSS ComCat, keyless, public domain), aggregated onto a
2deg x 2deg land grid. See usgs_earthquake_ingester.py's module docstring for full
methodology, including the documented risk-tiering thresholds and land-mask simplification.
"""
from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from db.base import get_db

router = APIRouter(prefix="/api/v1/usgs-earthquake", tags=["USGS Earthquake Hazard"])


@router.get(
    "/status",
    summary="Row count, coverage bounds and aggregate stats for ref_earthquake_zones",
)
def usgs_earthquake_status(db: Session = Depends(get_db)):
    try:
        stats = db.execute(text("""
            SELECT
                COUNT(*)                                          AS row_count,
                MIN(ST_YMin(zone_boundary))                        AS min_lat,
                MAX(ST_YMax(zone_boundary))                        AS max_lat,
                MIN(ST_XMin(zone_boundary))                        AS min_lon,
                MAX(ST_XMax(zone_boundary))                        AS max_lon,
                COALESCE(SUM(event_count_50yr), 0)                 AS total_events_aggregated,
                MAX(max_magnitude_50yr)                            AS global_max_magnitude,
                COUNT(*) FILTER (WHERE risk_level = 'very_high')   AS very_high_zones,
                COUNT(*) FILTER (WHERE risk_level = 'high')        AS high_zones,
                COUNT(*) FILTER (WHERE risk_level = 'moderate')    AS moderate_zones,
                COUNT(*) FILTER (WHERE risk_level = 'low')         AS low_zones,
                COUNT(*) FILTER (WHERE risk_level = 'none')        AS none_zones,
                MAX(data_source)                                   AS data_source_sample
            FROM ref_earthquake_zones
        """)).mappings().one()

        return {
            "row_count": stats["row_count"],
            "coverage": {
                "min_lat": stats["min_lat"],
                "max_lat": stats["max_lat"],
                "min_lon": stats["min_lon"],
                "max_lon": stats["max_lon"],
            },
            "total_events_aggregated": stats["total_events_aggregated"],
            "global_max_magnitude": (
                float(stats["global_max_magnitude"])
                if stats["global_max_magnitude"] is not None else None
            ),
            "risk_level_counts": {
                "very_high": stats["very_high_zones"],
                "high": stats["high_zones"],
                "moderate": stats["moderate_zones"],
                "low": stats["low_zones"],
                "none": stats["none_zones"],
            },
            "data_source": stats["data_source_sample"],
            "note": (
                "Populated by ingestion/usgs_earthquake_ingester.py from the real "
                "USGS ANSS ComCat catalog aggregated onto a 2x2 deg land-only grid. "
                "Returns zeroed stats if the ingester has not yet been run."
            ),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"USGS earthquake status error: {exc}") from exc


@router.get(
    "/point",
    summary="Seismic hazard for the grid cell containing (or nearest to) a lat/lon point",
)
def usgs_earthquake_point(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
    db: Session = Depends(get_db),
):
    params: Dict[str, Any] = {"lat": lat, "lng": lon}
    try:
        row = db.execute(text("""
            SELECT zone_id, risk_level, country_iso3, max_magnitude_50yr, event_count_50yr,
                   data_source,
                   ST_XMin(zone_boundary) AS min_lon, ST_YMin(zone_boundary) AS min_lat,
                   ST_XMax(zone_boundary) AS max_lon, ST_YMax(zone_boundary) AS max_lat
            FROM ref_earthquake_zones
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
            SELECT zone_id, risk_level, country_iso3, max_magnitude_50yr, event_count_50yr,
                   data_source,
                   ST_XMin(zone_boundary) AS min_lon, ST_YMin(zone_boundary) AS min_lat,
                   ST_XMax(zone_boundary) AS max_lon, ST_YMax(zone_boundary) AS max_lat,
                   ST_Distance(
                       ST_Centroid(zone_boundary),
                       ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)
                   ) AS distance_deg
            FROM ref_earthquake_zones
            ORDER BY distance_deg
            LIMIT 1
        """), params).mappings().first()

        if not nearest:
            raise HTTPException(
                status_code=404,
                detail="ref_earthquake_zones has no rows -- run the USGS earthquake ingester first",
            )

        result = dict(nearest)
        result["match_type"] = "nearest_fallback"
        result["latitude"] = lat
        result["longitude"] = lon
        return result
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"USGS earthquake point query error: {exc}") from exc
