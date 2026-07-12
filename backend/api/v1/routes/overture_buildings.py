"""
API Routes: Overture Maps Building Footprints — real per-building exposure data
=================================================================================
GET /api/v1/overture-buildings/footprints — real building footprints (height,
    floor count, class, footprint area, centroid) in a bounding box, queried
    live from Overture Maps' public keyless S3 Parquet buckets (no hosted
    query API exists — see backend/services/overture_buildings_service.py for
    the full access-method / partition-scheme writeup).

This feeds the SAME replacement-value -> physical-risk-pricing pipeline the
Asset-Level Exposure Explorer already uses for its 26-building hand-authored
sample, as a "query real footprints near a location" additive option.

Because Overture's buildings theme has no spatial partitioning at the S3-key
level (confirmed live: a flat list of 512 part files under
theme=buildings/type=building/, no bbox/quadkey subdirectories), a genuinely
complete bbox query must open every part file's footer. This is slow (~1-2
minutes cold) so the underlying service caches results and enforces a
per-request timeout with graceful fallback (`source_unavailable: true`,
never a 5xx) — see `scan_complete` / `files_scanned` in the response for how
much of the bucket a given answer actually covers.
"""
from __future__ import annotations

from fastapi import APIRouter, Query

from services.overture_buildings_service import query_buildings_bbox, PROVENANCE

router = APIRouter(prefix="/api/v1/overture-buildings", tags=["Overture Buildings"])


@router.get(
    "/footprints",
    summary="Real Overture building footprints in a bounding box (live, keyless S3 Parquet)",
    description=(
        "Queries Overture Maps' public buildings theme (anonymous S3 Parquet, no API key) "
        "for real building footprints intersecting the given bounding box. Returns height, "
        "floor count, class, approximate footprint area (m2) and centroid per building. "
        "A cold query over an unindexed area can take up to `timeout_seconds` (default 45s, "
        "max 240s) because Overture has no spatial partitioning in the S3 key structure — "
        "every part file's footer must be checked. Results (and partial-scan state) are "
        "cached in-process so repeat queries for the same area are fast. On timeout or "
        "upstream failure this returns an empty list with `source_unavailable: true` rather "
        "than an error."
    ),
)
def footprints(
    min_lon: float = Query(..., ge=-180, le=180),
    min_lat: float = Query(..., ge=-90, le=90),
    max_lon: float = Query(..., ge=-180, le=180),
    max_lat: float = Query(..., ge=-90, le=90),
    limit: int = Query(200, ge=1, le=2000),
    timeout_seconds: float = Query(45.0, ge=5, le=480, description="Per-request scan budget"),
) -> dict:
    if min_lon >= max_lon or min_lat >= max_lat:
        return {
            "buildings": [], "count": 0, "source_unavailable": True,
            "scan_complete": False, "files_scanned": 0, "files_total": 0,
            "error": "min_lon/min_lat must be less than max_lon/max_lat",
            "provenance": PROVENANCE,
        }
    return query_buildings_bbox(
        min_lon=min_lon, min_lat=min_lat, max_lon=max_lon, max_lat=max_lat,
        limit=limit, timeout_seconds=timeout_seconds,
    )
