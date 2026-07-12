"""
API Routes: NOAA IBTrACS Tropical Cyclone Hazard Grid
======================================================
GET /api/v1/cyclone-risk/status  — row count + coverage stats for ref_cyclone_zones
GET /api/v1/cyclone-risk/point   — hazard data for the grid cell containing (or nearest
                                    to, within a bounded radius) a given lat/lon

Backed by ref_cyclone_zones, populated by ingestion/ibtracs_cyclone_ingester.py from the
real NOAA IBTrACS v04r01 best-track archive (since 1980, all basins, keyless, public
domain), aggregated onto a 2deg x 2deg grid spanning the real tropical-cyclone latitude
band (roughly -45 to +45). See ibtracs_cyclone_ingester.py's module docstring for full
methodology, including the Saffir-Simpson-consistent risk-tiering thresholds.

Unlike a land-hazard grid, this layer intentionally includes open-ocean cells (track
density over open water matters for shipping/coastal exposure too) but is still bounded
to the real cyclone-forming latitude band, so points well outside that band (e.g.
continental interior at >45deg latitude) correctly resolve to "no data" rather than a
misleading distant nearest-cell match.
"""
from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from db.base import get_db

router = APIRouter(prefix="/api/v1/cyclone-risk", tags=["NOAA IBTrACS Cyclone Hazard"])

# A point further than this from the nearest populated grid-cell centroid (in
# degrees -- roughly matches a couple of 2deg grid cells) is treated as having
# no meaningful cyclone-track data nearby, rather than silently snapping to a
# far-away cell. This is what keeps the authenticity check honest: a
# continental-interior point well outside the -45..+45 band (or just isolated
# from any real recorded storm track) reports "none" instead of borrowing a
# distant ocean cell's hazard data.
NEAREST_FALLBACK_MAX_DEG = 5.0


@router.get(
    "/status",
    summary="Row count, coverage bounds and aggregate stats for ref_cyclone_zones",
)
def cyclone_status(db: Session = Depends(get_db)):
    try:
        stats = db.execute(text("""
            SELECT
                COUNT(*)                                          AS row_count,
                MIN(ST_YMin(zone_boundary))                        AS min_lat,
                MAX(ST_YMax(zone_boundary))                        AS max_lat,
                MIN(ST_XMin(zone_boundary))                        AS min_lon,
                MAX(ST_XMax(zone_boundary))                        AS max_lon,
                COALESCE(SUM(track_density_50yr), 0)               AS total_track_points_aggregated,
                MAX(max_wind_speed_kt)                             AS global_max_wind_speed_kt,
                COUNT(*) FILTER (WHERE risk_level = 'extreme')     AS extreme_zones,
                COUNT(*) FILTER (WHERE risk_level = 'very_high')   AS very_high_zones,
                COUNT(*) FILTER (WHERE risk_level = 'high')        AS high_zones,
                COUNT(*) FILTER (WHERE risk_level = 'moderate')    AS moderate_zones,
                COUNT(*) FILTER (WHERE risk_level = 'low')         AS low_zones,
                COUNT(*) FILTER (WHERE risk_level = 'none')        AS none_zones,
                MAX(data_source)                                   AS data_source_sample
            FROM ref_cyclone_zones
        """)).mappings().one()

        basin_rows = db.execute(text("""
            SELECT basin, COUNT(*) AS zone_count
            FROM ref_cyclone_zones
            WHERE basin IS NOT NULL
            GROUP BY basin
            ORDER BY zone_count DESC
        """)).mappings().all()

        return {
            "row_count": stats["row_count"],
            "coverage": {
                "min_lat": stats["min_lat"],
                "max_lat": stats["max_lat"],
                "min_lon": stats["min_lon"],
                "max_lon": stats["max_lon"],
            },
            "total_track_points_aggregated": stats["total_track_points_aggregated"],
            "global_max_wind_speed_kt": (
                float(stats["global_max_wind_speed_kt"])
                if stats["global_max_wind_speed_kt"] is not None else None
            ),
            "risk_level_counts": {
                "extreme": stats["extreme_zones"],
                "very_high": stats["very_high_zones"],
                "high": stats["high_zones"],
                "moderate": stats["moderate_zones"],
                "low": stats["low_zones"],
                "none": stats["none_zones"],
            },
            "basin_counts": {r["basin"]: r["zone_count"] for r in basin_rows},
            "data_source": stats["data_source_sample"],
            "note": (
                "Populated by ingestion/ibtracs_cyclone_ingester.py from the real NOAA "
                "IBTrACS v04r01 best-track archive (since 1980) aggregated onto a 2x2 deg "
                "grid across the real tropical-cyclone latitude band. Returns zeroed stats "
                "if the ingester has not yet been run."
            ),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Cyclone risk status error: {exc}") from exc


@router.get(
    "/point",
    summary="Cyclone hazard for the grid cell containing (or nearest to) a lat/lon point",
)
def cyclone_point(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
    db: Session = Depends(get_db),
):
    params: Dict[str, Any] = {"lat": lat, "lng": lon}
    try:
        row = db.execute(text("""
            SELECT zone_id, risk_level, basin, country_iso3,
                   max_wind_speed_kt, track_density_50yr, data_source,
                   ST_XMin(zone_boundary) AS min_lon, ST_YMin(zone_boundary) AS min_lat,
                   ST_XMax(zone_boundary) AS max_lon, ST_YMax(zone_boundary) AS max_lat
            FROM ref_cyclone_zones
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

        # No populated cell directly contains this point. Look for the
        # nearest one, but only accept it within a bounded radius --
        # otherwise this is a genuine no-data point (e.g. a continental
        # interior location well outside the -45..+45 tropical-cyclone
        # latitude band) and should be reported as such, not silently
        # matched to a distant, unrelated ocean cell.
        nearest = db.execute(text("""
            SELECT zone_id, risk_level, basin, country_iso3,
                   max_wind_speed_kt, track_density_50yr, data_source,
                   ST_XMin(zone_boundary) AS min_lon, ST_YMin(zone_boundary) AS min_lat,
                   ST_XMax(zone_boundary) AS max_lon, ST_YMax(zone_boundary) AS max_lat,
                   ST_Distance(
                       ST_Centroid(zone_boundary),
                       ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)
                   ) AS distance_deg
            FROM ref_cyclone_zones
            ORDER BY distance_deg
            LIMIT 1
        """), params).mappings().first()

        if not nearest or nearest["distance_deg"] is None or nearest["distance_deg"] > NEAREST_FALLBACK_MAX_DEG:
            return {
                "latitude": lat,
                "longitude": lon,
                "match_type": "no_data",
                "risk_level": "none",
                "zone_id": None,
                "basin": None,
                "max_wind_speed_kt": None,
                "track_density_50yr": 0,
                "data_source": None,
                "note": (
                    "No recorded IBTrACS cyclone track data within "
                    f"{NEAREST_FALLBACK_MAX_DEG} deg of this point -- likely outside the "
                    "real tropical-cyclone latitude band (~-45 to +45) or no storms "
                    "recorded nearby since 1980."
                ),
            }

        result = dict(nearest)
        result["match_type"] = "nearest_fallback"
        result["latitude"] = lat
        result["longitude"] = lon
        return result
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Cyclone risk point query error: {exc}") from exc
