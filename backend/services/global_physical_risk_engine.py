"""
Global Physical Risk Engine — Composite Digital-Twin Overlay
==============================================================
This module sits ONE LAYER ABOVE the single-layer PostGIS point queries in
`api/v1/routes/spatial.py`. Where `spatial.py` answers "does this point fall
inside a flood zone / wildfire zone / etc.", this engine answers the harder
question: "given everything we know about this point across ALL five global
hazard grids, what is a single, transparent, defensible physical-risk score?"

Hazard tables consumed (populated by sibling ingestion pipelines — this module
is READ-ONLY against them):
  ref_earthquake_zones  (zone_id, risk_level, country_iso3, zone_boundary,
                          max_magnitude_50yr, event_count_50yr, data_source)
  ref_cyclone_zones     (zone_id, risk_level, basin, country_iso3, zone_boundary,
                          max_wind_speed_kt, track_density_50yr, data_source)
  ref_wildfire_zones    (zone_id, risk_level, scenario, country_iso3, zone_boundary,
                          fwi_mean, data_source)
  ref_flood_zones       (zone_id, return_period_y, scenario, country_iso3, zone_boundary,
                          max_depth_m, data_source)
  ref_sea_level_zones   (zone_id, slr_scenario, horizon_year, country_iso3, zone_boundary,
                          slr_m, data_source)

`ref_protected_areas` is intentionally NOT part of this engine — it stays
empty pending a WDPA license decision and is out of scope for hazard scoring.

Every table may be empty or partially populated at any given time (this is a
live, incrementally-built digital twin). Every function in this module is
written to degrade gracefully: a missing/empty hazard layer is reported as
"no data" — never coerced to a fabricated score of 0 (which would silently
imply "no risk", which is a false claim, not the same as "no data").

---------------------------------------------------------------------------
NORMALIZATION FORMULAS (0-100 per-hazard score, higher = more exposed)
---------------------------------------------------------------------------
Every formula below is a documented, deterministic function of the raw grid
attributes actually stored in the reference tables — no randomness, no
hidden lookups. All component scores are clamped to [0, 1] before scaling so
one extreme input cannot silently zero out or blow up the composite.

1) EARTHQUAKE  (from max_magnitude_50yr, event_count_50yr)
   magnitude_component = clamp(max_magnitude_50yr / 9.0, 0, 1)      [9.0 Mw ~ largest
                                                                       instrumentally recorded]
   frequency_component = clamp(event_count_50yr / 100.0, 0, 1)      [100+ events/50yr in a
                                                                       zone saturates the score]
   earthquake_score = 100 * (0.70 * magnitude_component + 0.30 * frequency_component)
   Rationale: magnitude dominates seismic damage potential (PGA scales
   exponentially with Mw), frequency is a secondary "how often does this
   happen" modifier. If max_magnitude_50yr is null but risk_level is present,
   falls back to RISK_LEVEL_FALLBACK_SCORE.

2) CYCLONE  (from max_wind_speed_kt, track_density_50yr)
   wind_component    = clamp(max_wind_speed_kt / 200.0, 0, 1)       [200kt >> Cat-5 threshold
                                                                       (137kt), saturates above
                                                                       strongest observed storms]
   density_component = clamp(track_density_50yr / 50.0, 0, 1)      [50+ tracks/50yr within the
                                                                       zone saturates the score]
   cyclone_score = 100 * (0.65 * wind_component + 0.35 * density_component)
   Rationale: peak wind speed (Saffir-Simpson-aligned) is the primary driver
   of cyclone damage; track density captures return-frequency risk.

3) WILDFIRE  (from fwi_mean, else risk_level)
   If fwi_mean present:
       wildfire_score = 100 * clamp(fwi_mean / 50.0, 0, 1)
       [Canadian Fire Weather Index: >38 = "extreme" fire danger; 50 is used
        as the saturation ceiling, i.e. FWI 50 -> score 100]
   Else falls back to RISK_LEVEL_FALLBACK_SCORE keyed off risk_level.

4) FLOOD  (from max_depth_m, return_period_y — shorter return period +
   higher depth = higher score)
   depth_component = clamp(max_depth_m / 5.0, 0, 1)                 [5m+ inundation depth
                                                                       saturates the score]
   aep             = 1.0 / return_period_y                          [Annual Exceedance
                                                                       Probability; a 10yr
                                                                       return period -> AEP 0.10]
   frequency_component = clamp(aep / 0.10, 0, 1)                    [AEP >= 0.10 (i.e. RP <=10yr)
                                                                       saturates the score]
   flood_score = 100 * (0.60 * depth_component + 0.40 * frequency_component)
   Rationale: depth drives direct physical damage; shorter return period
   means the event recurs more often, compounding expected loss.

5) SEA LEVEL RISE  (from slr_m, horizon_year — nearer horizon + higher SLR
   = higher score)
   slr_component      = clamp(slr_m / 1.5, 0, 1)                    [1.5m SLR is a widely used
                                                                       high-end 2100 projection
                                                                       ceiling (IPCC AR6 SSP5-8.5)]
   years_out          = max(horizon_year - CURRENT_YEAR, 0)
   proximity_component = clamp(1 - years_out / 100.0, 0, 1)         [a 2126 horizon -> proximity
                                                                       0; "now" -> proximity 1]
   sea_level_score = 100 * (0.60 * slr_component + 0.40 * proximity_component)
   Rationale: magnitude of projected rise is primary; a nearer horizon for a
   given magnitude of SLR represents a more urgent, higher-confidence threat
   (near-term projections carry less scenario uncertainty than 2100+ ones).

RISK_LEVEL_FALLBACK_SCORE (used only when the primary numeric driver is
NULL for a matched zone, so a real matched row is never silently dropped):
   extreme/very_high -> 90, high -> 70, moderate/medium -> 45,
   low -> 20, minimal/very_low -> 5, unknown/other -> 50 (neutral midpoint)

---------------------------------------------------------------------------
COMPOSITE SCORE
---------------------------------------------------------------------------
Default weights are EQUAL across the five hazards (20% each). Rationale:
there is no platform-wide, cross-peril authoritative severity ranking (e.g.
"cyclone always matters more than flood") that would justify unequal
weights as a universal default — equal weighting is the most defensible,
least-opinionated default, and is fully overridable via the `weights` param
for teams that want a portfolio- or sector-specific weighting scheme.

CRITICAL: composite re-normalizes weights over only the hazards that
actually have data. Missing hazards are EXCLUDED from the weighted average,
never treated as a 0 (a 0 would silently and incorrectly assert "no risk of
this type here" for a hazard we simply have no data on yet).

   composite = sum(weight_h * score_h for h in available_hazards)
               / sum(weight_h for h in available_hazards)

If zero hazards have data, composite_score is None (not 0, not an error).

---------------------------------------------------------------------------
Author's note: this is a scoring/aggregation layer only. It does not itself
ingest data — the six PostGIS reference tables are populated by sibling
ingestion pipelines and may be partially or fully empty at any time this
module runs. All queries are defensive: COUNT-then-fetch patterns are
avoided in favor of simply handling empty result sets, and no query ever
raises for an empty table.
"""
from __future__ import annotations

import datetime as _dt
from typing import Any, Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

# ---------------------------------------------------------------------------
# Constants — normalization ceilings & weights (see module docstring above)
# ---------------------------------------------------------------------------

CURRENT_YEAR = _dt.date.today().year

RISK_LEVEL_FALLBACK_SCORE: Dict[str, float] = {
    "extreme": 90.0,
    "very_high": 90.0,
    "high": 70.0,
    "moderate": 45.0,
    "medium": 45.0,
    "low": 20.0,
    "minimal": 5.0,
    "very_low": 5.0,
}
_RISK_LEVEL_NEUTRAL = 50.0  # unrecognized risk_level string -> neutral midpoint, not 0

DEFAULT_HAZARD_WEIGHTS: Dict[str, float] = {
    "earthquake": 0.20,
    "cyclone": 0.20,
    "wildfire": 0.20,
    "flood": 0.20,
    "sea_level": 0.20,
}

HAZARD_TABLES: Dict[str, str] = {
    "earthquake": "ref_earthquake_zones",
    "cyclone": "ref_cyclone_zones",
    "wildfire": "ref_wildfire_zones",
    "flood": "ref_flood_zones",
    "sea_level": "ref_sea_level_zones",
}


def _clamp01(x: float) -> float:
    if x is None:
        return 0.0
    return max(0.0, min(1.0, x))


def _risk_level_score(risk_level: Optional[str]) -> float:
    if not risk_level:
        return _RISK_LEVEL_NEUTRAL
    return RISK_LEVEL_FALLBACK_SCORE.get(str(risk_level).strip().lower(), _RISK_LEVEL_NEUTRAL)


# ---------------------------------------------------------------------------
# Per-hazard scoring functions (pure — operate on already-fetched row dicts)
# ---------------------------------------------------------------------------

def score_earthquake(row: Dict[str, Any]) -> Dict[str, Any]:
    magnitude = row.get("max_magnitude_50yr")
    events = row.get("event_count_50yr")
    if magnitude is not None:
        magnitude_component = _clamp01(float(magnitude) / 9.0)
        frequency_component = _clamp01(float(events or 0) / 100.0)
        score = 100.0 * (0.70 * magnitude_component + 0.30 * frequency_component)
        formula = "0.70*clamp(max_magnitude_50yr/9.0)+0.30*clamp(event_count_50yr/100.0)"
    else:
        score = _risk_level_score(row.get("risk_level"))
        formula = "fallback: risk_level lookup (max_magnitude_50yr was NULL)"
    return {"score": round(score, 1), "formula": formula}


def score_cyclone(row: Dict[str, Any]) -> Dict[str, Any]:
    wind = row.get("max_wind_speed_kt")
    density = row.get("track_density_50yr")
    if wind is not None:
        wind_component = _clamp01(float(wind) / 200.0)
        density_component = _clamp01(float(density or 0) / 50.0)
        score = 100.0 * (0.65 * wind_component + 0.35 * density_component)
        formula = "0.65*clamp(max_wind_speed_kt/200.0)+0.35*clamp(track_density_50yr/50.0)"
    else:
        score = _risk_level_score(row.get("risk_level"))
        formula = "fallback: risk_level lookup (max_wind_speed_kt was NULL)"
    return {"score": round(score, 1), "formula": formula}


def score_wildfire(row: Dict[str, Any]) -> Dict[str, Any]:
    fwi = row.get("fwi_mean")
    if fwi is not None:
        score = 100.0 * _clamp01(float(fwi) / 50.0)
        formula = "100*clamp(fwi_mean/50.0)"
    else:
        score = _risk_level_score(row.get("risk_level"))
        formula = "fallback: risk_level lookup (fwi_mean was NULL)"
    return {"score": round(score, 1), "formula": formula}


def score_flood(row: Dict[str, Any]) -> Dict[str, Any]:
    depth = row.get("max_depth_m")
    return_period = row.get("return_period_y")
    if depth is not None and return_period:
        depth_component = _clamp01(float(depth) / 5.0)
        aep = 1.0 / float(return_period)
        frequency_component = _clamp01(aep / 0.10)
        score = 100.0 * (0.60 * depth_component + 0.40 * frequency_component)
        formula = (
            "0.60*clamp(max_depth_m/5.0)+0.40*clamp((1/return_period_y)/0.10)"
        )
    elif depth is not None:
        # return period missing — score on depth alone, documented degradation
        depth_component = _clamp01(float(depth) / 5.0)
        score = 100.0 * depth_component
        formula = "depth-only: 100*clamp(max_depth_m/5.0) (return_period_y was NULL)"
    else:
        score = _RISK_LEVEL_NEUTRAL
        formula = "fallback: neutral midpoint (max_depth_m and return_period_y both NULL)"
    return {"score": round(score, 1), "formula": formula}


def score_sea_level(row: Dict[str, Any]) -> Dict[str, Any]:
    slr = row.get("slr_m")
    horizon = row.get("horizon_year")
    if slr is not None:
        slr_component = _clamp01(float(slr) / 1.5)
        years_out = max(float(horizon) - CURRENT_YEAR, 0.0) if horizon else 100.0
        proximity_component = _clamp01(1.0 - years_out / 100.0)
        score = 100.0 * (0.60 * slr_component + 0.40 * proximity_component)
        formula = "0.60*clamp(slr_m/1.5)+0.40*clamp(1-((horizon_year-{})/100.0))".format(CURRENT_YEAR)
    else:
        score = _RISK_LEVEL_NEUTRAL
        formula = "fallback: neutral midpoint (slr_m was NULL)"
    return {"score": round(score, 1), "formula": formula}


_SCORERS = {
    "earthquake": score_earthquake,
    "cyclone": score_cyclone,
    "wildfire": score_wildfire,
    "flood": score_flood,
    "sea_level": score_sea_level,
}


# ---------------------------------------------------------------------------
# Raw zone lookups — one per hazard. Mirrors spatial.py's exact SQL pattern:
# ST_Within(ST_SetSRID(ST_MakePoint(:lng,:lat),4326), zone_boundary).
# Falls back to nearest-within-radius (ST_DWithin + ST_Distance) if the point
# is not contained in any polygon — grid cells may not tile every coordinate
# exactly, so containment-miss should not be conflated with "no data".
# ---------------------------------------------------------------------------

def _fetch_earthquake_zone(db: Session, lat: float, lng: float, radius_m: float) -> Optional[Dict[str, Any]]:
    params = {"lat": lat, "lng": lng, "radius_m": radius_m}
    row = db.execute(text("""
        SELECT zone_id, risk_level, country_iso3, max_magnitude_50yr,
               event_count_50yr, data_source, 0.0 AS distance_km
        FROM ref_earthquake_zones
        WHERE ST_Within(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), zone_boundary)
        LIMIT 1
    """), params).mappings().first()
    if row:
        return dict(row)
    row = db.execute(text("""
        SELECT zone_id, risk_level, country_iso3, max_magnitude_50yr,
               event_count_50yr, data_source,
               (ST_Distance(
                   zone_boundary::GEOGRAPHY,
                   ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::GEOGRAPHY
               ) / 1000.0)::NUMERIC(10,2) AS distance_km
        FROM ref_earthquake_zones
        WHERE ST_DWithin(
            zone_boundary::GEOGRAPHY,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::GEOGRAPHY,
            :radius_m
        )
        ORDER BY distance_km
        LIMIT 1
    """), params).mappings().first()
    return dict(row) if row else None


def _fetch_cyclone_zone(db: Session, lat: float, lng: float, radius_m: float) -> Optional[Dict[str, Any]]:
    params = {"lat": lat, "lng": lng, "radius_m": radius_m}
    row = db.execute(text("""
        SELECT zone_id, risk_level, basin, country_iso3, max_wind_speed_kt,
               track_density_50yr, data_source, 0.0 AS distance_km
        FROM ref_cyclone_zones
        WHERE ST_Within(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), zone_boundary)
        LIMIT 1
    """), params).mappings().first()
    if row:
        return dict(row)
    row = db.execute(text("""
        SELECT zone_id, risk_level, basin, country_iso3, max_wind_speed_kt,
               track_density_50yr, data_source,
               (ST_Distance(
                   zone_boundary::GEOGRAPHY,
                   ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::GEOGRAPHY
               ) / 1000.0)::NUMERIC(10,2) AS distance_km
        FROM ref_cyclone_zones
        WHERE ST_DWithin(
            zone_boundary::GEOGRAPHY,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::GEOGRAPHY,
            :radius_m
        )
        ORDER BY distance_km
        LIMIT 1
    """), params).mappings().first()
    return dict(row) if row else None


def _fetch_wildfire_zone(db: Session, lat: float, lng: float, radius_m: float) -> Optional[Dict[str, Any]]:
    params = {"lat": lat, "lng": lng, "radius_m": radius_m}
    row = db.execute(text("""
        SELECT zone_id, risk_level, scenario, country_iso3, fwi_mean,
               data_source, 0.0 AS distance_km
        FROM ref_wildfire_zones
        WHERE ST_Within(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), zone_boundary)
        LIMIT 1
    """), params).mappings().first()
    if row:
        return dict(row)
    row = db.execute(text("""
        SELECT zone_id, risk_level, scenario, country_iso3, fwi_mean, data_source,
               (ST_Distance(
                   zone_boundary::GEOGRAPHY,
                   ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::GEOGRAPHY
               ) / 1000.0)::NUMERIC(10,2) AS distance_km
        FROM ref_wildfire_zones
        WHERE ST_DWithin(
            zone_boundary::GEOGRAPHY,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::GEOGRAPHY,
            :radius_m
        )
        ORDER BY distance_km
        LIMIT 1
    """), params).mappings().first()
    return dict(row) if row else None


def _fetch_flood_zone(db: Session, lat: float, lng: float, radius_m: float) -> Optional[Dict[str, Any]]:
    params = {"lat": lat, "lng": lng, "radius_m": radius_m}
    # Prefer the shortest (most severe) return period among containing polygons.
    row = db.execute(text("""
        SELECT zone_id, return_period_y, scenario, country_iso3, max_depth_m,
               data_source, 0.0 AS distance_km
        FROM ref_flood_zones
        WHERE ST_Within(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), zone_boundary)
        ORDER BY return_period_y ASC NULLS LAST
        LIMIT 1
    """), params).mappings().first()
    if row:
        return dict(row)
    row = db.execute(text("""
        SELECT zone_id, return_period_y, scenario, country_iso3, max_depth_m, data_source,
               (ST_Distance(
                   zone_boundary::GEOGRAPHY,
                   ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::GEOGRAPHY
               ) / 1000.0)::NUMERIC(10,2) AS distance_km
        FROM ref_flood_zones
        WHERE ST_DWithin(
            zone_boundary::GEOGRAPHY,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::GEOGRAPHY,
            :radius_m
        )
        ORDER BY distance_km
        LIMIT 1
    """), params).mappings().first()
    return dict(row) if row else None


def _fetch_sea_level_zone(db: Session, lat: float, lng: float, radius_m: float) -> Optional[Dict[str, Any]]:
    params = {"lat": lat, "lng": lng, "radius_m": radius_m}
    row = db.execute(text("""
        SELECT zone_id, slr_scenario, horizon_year, country_iso3, slr_m,
               data_source, 0.0 AS distance_km
        FROM ref_sea_level_zones
        WHERE ST_Within(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), zone_boundary)
        ORDER BY horizon_year ASC NULLS LAST
        LIMIT 1
    """), params).mappings().first()
    if row:
        return dict(row)
    row = db.execute(text("""
        SELECT zone_id, slr_scenario, horizon_year, country_iso3, slr_m, data_source,
               (ST_Distance(
                   zone_boundary::GEOGRAPHY,
                   ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::GEOGRAPHY
               ) / 1000.0)::NUMERIC(10,2) AS distance_km
        FROM ref_sea_level_zones
        WHERE ST_DWithin(
            zone_boundary::GEOGRAPHY,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::GEOGRAPHY,
            :radius_m
        )
        ORDER BY distance_km
        LIMIT 1
    """), params).mappings().first()
    return dict(row) if row else None


_FETCHERS = {
    "earthquake": _fetch_earthquake_zone,
    "cyclone": _fetch_cyclone_zone,
    "wildfire": _fetch_wildfire_zone,
    "flood": _fetch_flood_zone,
    "sea_level": _fetch_sea_level_zone,
}


def _table_is_empty(db: Session, table: str) -> bool:
    try:
        n = db.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
        return not n
    except Exception:
        # Defensive: if the table doesn't exist yet / errors, treat as "no data"
        # rather than raising — a sibling agent's table may not be created yet.
        db.rollback()
        return True


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_point_hazard_profile(db: Session, lat: float, lon: float, radius_km: float = 25.0) -> Dict[str, Any]:
    """
    Query all 5 hazard tables for the zone containing (or nearest within
    radius_km of) the given point, and return raw zone data + normalized
    0-100 score per hazard. Never raises for empty tables — reports
    `data_availability` per hazard instead.
    """
    radius_m = radius_km * 1000.0
    hazards: Dict[str, Any] = {}
    data_availability: Dict[str, Any] = {}
    hazard_scores: Dict[str, float] = {}

    for hazard, table in HAZARD_TABLES.items():
        if _table_is_empty(db, table):
            hazards[hazard] = None
            data_availability[hazard] = {
                "table": table,
                "table_populated": False,
                "zone_matched": False,
                "note": "Reference table has zero rows — sibling ingestion pipeline has not yet populated this layer.",
            }
            continue

        try:
            row = _FETCHERS[hazard](db, lat, lon, radius_m)
        except Exception as exc:
            db.rollback()
            hazards[hazard] = None
            data_availability[hazard] = {
                "table": table,
                "table_populated": True,
                "zone_matched": False,
                "note": f"Query error (treated as no-data): {exc}",
            }
            continue

        if row is None:
            hazards[hazard] = None
            data_availability[hazard] = {
                "table": table,
                "table_populated": True,
                "zone_matched": False,
                "note": f"Table has data but no zone contains/is within {radius_km}km of this point.",
            }
            continue

        scored = _SCORERS[hazard](row)
        hazards[hazard] = {**row, "score_0_100": scored["score"], "score_formula": scored["formula"]}
        hazard_scores[hazard] = scored["score"]
        data_availability[hazard] = {
            "table": table,
            "table_populated": True,
            "zone_matched": True,
            "matched_via": "containment" if row.get("distance_km") == 0.0 else "nearest_within_radius",
            "distance_km": float(row.get("distance_km") or 0.0),
        }

    composite = get_composite_score(hazard_scores)

    return {
        "latitude": lat,
        "longitude": lon,
        "radius_km": radius_km,
        "hazards": hazards,
        "hazard_scores_0_100": hazard_scores,
        "data_availability": data_availability,
        "hazards_with_data": sorted(hazard_scores.keys()),
        "hazards_missing_data": sorted(set(HAZARD_TABLES.keys()) - set(hazard_scores.keys())),
        **composite,
    }


def get_composite_score(hazard_scores: Dict[str, float], weights: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
    """
    Weighted composite over whichever hazards have data. Missing hazards are
    excluded and the remaining weights are re-normalized to sum to 1.0 — a
    missing hazard is NEVER treated as a 0 score.

    Default weights: equal-weight (20% each of the 5 hazards) — see module
    docstring for rationale. Pass `weights` to override (need not sum to 1;
    re-normalized automatically over the available subset).
    """
    weights = weights or DEFAULT_HAZARD_WEIGHTS
    available = {h: s for h, s in hazard_scores.items() if s is not None}

    if not available:
        return {
            "composite_score": None,
            "composite_weights_used": {},
            "composite_note": "No hazard layers had data for this point — composite score is undefined, not zero.",
        }

    weight_subset = {h: weights.get(h, DEFAULT_HAZARD_WEIGHTS.get(h, 0.0)) for h in available}
    total_weight = sum(weight_subset.values())
    if total_weight <= 0:
        # degenerate: fall back to equal weighting over the available subset
        weight_subset = {h: 1.0 for h in available}
        total_weight = float(len(available))

    normalized_weights = {h: w / total_weight for h, w in weight_subset.items()}
    composite = sum(available[h] * normalized_weights[h] for h in available)

    return {
        "composite_score": round(composite, 1),
        "composite_weights_used": {h: round(w, 4) for h, w in normalized_weights.items()},
        "composite_note": (
            f"Weighted average over {len(available)}/{len(HAZARD_TABLES)} hazard layers with data; "
            f"weights re-normalized to sum to 1.0 over the available subset."
        ),
    }


def build_risk_narrative(profile: Dict[str, Any]) -> str:
    """Plain-language narrative summarizing a point's hazard profile."""
    scores = profile.get("hazard_scores_0_100", {}) or {}
    missing = profile.get("hazards_missing_data", [])

    if not scores:
        base = "No physical hazard data is currently available for this location across any of the 5 global hazard layers."
        if missing:
            base += f" Layers not yet populated: {', '.join(missing)}."
        return base

    def _tier(score: float) -> str:
        if score >= 75:
            return "severe"
        if score >= 55:
            return "elevated"
        if score >= 30:
            return "moderate"
        return "low"

    ranked = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)
    tiers = {h: _tier(s) for h, s in ranked}

    notable = [h for h, t in tiers.items() if t in ("severe", "elevated")]
    labels = {
        "earthquake": "seismic",
        "cyclone": "cyclone",
        "wildfire": "wildfire",
        "flood": "flood",
        "sea_level": "sea-level-rise",
    }

    if notable:
        parts = [f"{tiers[h]} {labels[h]}" for h in notable]
        sentence = "This location shows " + ", ".join(parts) + " exposure"
        others = [h for h in scores if h not in notable]
        if others:
            other_parts = [f"{labels[h]} ({tiers[h]})" for h in others]
            sentence += "; " + ", ".join(other_parts) + " risk is comparatively lower"
        sentence += "."
    else:
        sentence = "This location shows low physical hazard exposure across all measured layers."

    if missing:
        missing_labels = ", ".join(labels[h] for h in missing)
        sentence += f" Data is not yet available for: {missing_labels}."

    composite = profile.get("composite_score")
    if composite is not None:
        sentence += f" Composite physical risk score: {composite}/100 (over {len(scores)} of 5 hazard layers)."

    return sentence


def get_region_summary(db: Session, min_lon: float, min_lat: float, max_lon: float, max_lat: float) -> Dict[str, Any]:
    """
    Aggregate hazard stats over a bounding box: per-hazard zone counts and
    average/max raw driver values, plus an approximate composite computed
    from those per-hazard averages. Intended for portfolio/regional views,
    not per-asset precision (use get_point_hazard_profile per asset for that).
    """
    bbox_params = {"min_lon": min_lon, "min_lat": min_lat, "max_lon": max_lon, "max_lat": max_lat}
    bbox_sql = "ST_MakeEnvelope(:min_lon, :min_lat, :max_lon, :max_lat, 4326)"

    hazard_summaries: Dict[str, Any] = {}
    hazard_avg_scores: Dict[str, float] = {}

    queries = {
        "earthquake": (
            "ref_earthquake_zones",
            f"""
            SELECT COUNT(*) AS cell_count,
                   AVG(max_magnitude_50yr) AS avg_max_magnitude_50yr,
                   MAX(max_magnitude_50yr) AS max_max_magnitude_50yr,
                   AVG(event_count_50yr) AS avg_event_count_50yr
            FROM ref_earthquake_zones
            WHERE ST_Intersects(zone_boundary, {bbox_sql})
            """,
        ),
        "cyclone": (
            "ref_cyclone_zones",
            f"""
            SELECT COUNT(*) AS cell_count,
                   AVG(max_wind_speed_kt) AS avg_max_wind_speed_kt,
                   MAX(max_wind_speed_kt) AS max_max_wind_speed_kt,
                   AVG(track_density_50yr) AS avg_track_density_50yr
            FROM ref_cyclone_zones
            WHERE ST_Intersects(zone_boundary, {bbox_sql})
            """,
        ),
        "wildfire": (
            "ref_wildfire_zones",
            f"""
            SELECT COUNT(*) AS cell_count,
                   AVG(fwi_mean) AS avg_fwi_mean,
                   MAX(fwi_mean) AS max_fwi_mean
            FROM ref_wildfire_zones
            WHERE ST_Intersects(zone_boundary, {bbox_sql})
            """,
        ),
        "flood": (
            "ref_flood_zones",
            f"""
            SELECT COUNT(*) AS cell_count,
                   AVG(max_depth_m) AS avg_max_depth_m,
                   MAX(max_depth_m) AS max_max_depth_m,
                   AVG(return_period_y) AS avg_return_period_y
            FROM ref_flood_zones
            WHERE ST_Intersects(zone_boundary, {bbox_sql})
            """,
        ),
        "sea_level": (
            "ref_sea_level_zones",
            f"""
            SELECT COUNT(*) AS cell_count,
                   AVG(slr_m) AS avg_slr_m,
                   MAX(slr_m) AS max_slr_m,
                   MIN(horizon_year) AS min_horizon_year
            FROM ref_sea_level_zones
            WHERE ST_Intersects(zone_boundary, {bbox_sql})
            """,
        ),
    }

    for hazard, (table, sql) in queries.items():
        if _table_is_empty(db, table):
            hazard_summaries[hazard] = {"cell_count": 0, "table_populated": False}
            continue
        try:
            row = db.execute(text(sql), bbox_params).mappings().first()
        except Exception as exc:
            db.rollback()
            hazard_summaries[hazard] = {"cell_count": 0, "table_populated": True, "error": str(exc)}
            continue

        row_d = dict(row) if row else {}
        cell_count = int(row_d.get("cell_count") or 0)
        hazard_summaries[hazard] = {"cell_count": cell_count, "table_populated": True, **row_d}

        if cell_count > 0:
            # Build a synthetic row from averages to reuse the same per-hazard
            # scoring formulas documented above.
            if hazard == "earthquake":
                synth = {
                    "max_magnitude_50yr": row_d.get("avg_max_magnitude_50yr"),
                    "event_count_50yr": row_d.get("avg_event_count_50yr"),
                    "risk_level": None,
                }
            elif hazard == "cyclone":
                synth = {
                    "max_wind_speed_kt": row_d.get("avg_max_wind_speed_kt"),
                    "track_density_50yr": row_d.get("avg_track_density_50yr"),
                    "risk_level": None,
                }
            elif hazard == "wildfire":
                synth = {"fwi_mean": row_d.get("avg_fwi_mean"), "risk_level": None}
            elif hazard == "flood":
                synth = {
                    "max_depth_m": row_d.get("avg_max_depth_m"),
                    "return_period_y": row_d.get("avg_return_period_y"),
                }
            else:  # sea_level
                synth = {"slr_m": row_d.get("avg_slr_m"), "horizon_year": row_d.get("min_horizon_year")}

            if any(v is not None for v in synth.values()):
                scored = _SCORERS[hazard](synth)
                hazard_avg_scores[hazard] = scored["score"]
                hazard_summaries[hazard]["avg_score_0_100"] = scored["score"]

    composite = get_composite_score(hazard_avg_scores)

    return {
        "bbox": {"min_lon": min_lon, "min_lat": min_lat, "max_lon": max_lon, "max_lat": max_lat},
        "hazard_breakdown": hazard_summaries,
        "avg_composite_score": composite["composite_score"],
        "composite_weights_used": composite["composite_weights_used"],
        "composite_note": composite["composite_note"] + " (region-average composite, computed from per-hazard bbox averages, not per-cell)",
        "total_cells": sum(h.get("cell_count", 0) for h in hazard_summaries.values()),
    }


def get_coverage_stats(db: Session) -> Dict[str, Any]:
    """
    'Digital twin build progress' metric: row counts + spatial extent
    (min/max lat/lon with data) per hazard table.
    """
    coverage: Dict[str, Any] = {}
    for hazard, table in HAZARD_TABLES.items():
        try:
            count = db.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar() or 0
        except Exception as exc:
            db.rollback()
            coverage[hazard] = {"table": table, "row_count": 0, "error": str(exc)}
            continue

        entry: Dict[str, Any] = {"table": table, "row_count": int(count)}

        if count > 0:
            try:
                extent = db.execute(text(f"""
                    SELECT
                        ST_XMin(ST_Extent(zone_boundary)) AS min_lon,
                        ST_YMin(ST_Extent(zone_boundary)) AS min_lat,
                        ST_XMax(ST_Extent(zone_boundary)) AS max_lon,
                        ST_YMax(ST_Extent(zone_boundary)) AS max_lat
                    FROM {table}
                """)).mappings().first()
                countries = db.execute(text(f"""
                    SELECT COUNT(DISTINCT country_iso3) AS n
                    FROM {table}
                    WHERE country_iso3 IS NOT NULL
                """)).scalar()
                latest = db.execute(text(f"SELECT MAX(created_at) FROM {table}")).scalar()
                entry.update({
                    "spatial_extent": dict(extent) if extent else None,
                    "distinct_countries": int(countries or 0),
                    "last_updated": latest.isoformat() if latest else None,
                })
            except Exception as exc:
                db.rollback()
                entry["extent_error"] = str(exc)
        else:
            entry.update({
                "spatial_extent": None,
                "distinct_countries": 0,
                "last_updated": None,
                "note": "Table is empty — layer not yet populated by ingestion pipeline.",
            })

        coverage[hazard] = entry

    populated_count = sum(1 for h in coverage.values() if h.get("row_count", 0) > 0)
    return {
        "hazard_layers": coverage,
        "layers_populated": populated_count,
        "layers_total": len(HAZARD_TABLES),
        "build_progress_pct": round(100.0 * populated_count / len(HAZARD_TABLES), 1),
    }
