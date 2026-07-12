"""
Weather & Climate Data — Open-Meteo integration
================================================
Prefix: /api/v1/open-meteo
Tags:   Open-Meteo Weather & Climate

Upstream: Open-Meteo (https://open-meteo.com) — real global weather
observations/forecasts, a real historical (archive) weather record, and
real downscaled CMIP6 climate-model output per lat/lon.

FREE-VS-PAID BOUNDARY (verified live 2026-07-05 against
https://open-meteo.com/en/pricing and https://open-meteo.com/en/docs — this
changes, re-verify before purchase):

    Free tier (keyless):
        - 10,000 calls/day, ALL APIs technically reachable (Forecast,
          Historical Weather/Archive, Climate/CMIP6, Ensemble, ...).
        - Licensed for NON-COMMERCIAL use only.
    Standard  — $29/mo (this platform's one recommended purchase, see
        docs/DATA_SOURCES_AMPLIFICATION.md):
        - Commercial use permitted, 1M calls/month.
        - Covers ONLY the core Forecast API (current/forecast weather).
        - Historical Weather, Climate (CMIP6) and Ensemble APIs are
          EXPLICITLY EXCLUDED from Standard (confirmed on the pricing page).
    Professional — $99/mo:
        - Adds commercial-licensed Historical Weather API, Climate API
          (CMIP6) and Ensemble API. 5M calls/month.
    Enterprise — custom, >$99/mo: >50M calls/month, custom solutions.

    ==> Practical read for this platform: the $29/mo Standard tier only
    unlocks a *commercial* /current-weather. /historical-extremes and
    /climate-projection are genuinely callable today on the free, keyless,
    non-commercial tier (real data, useful for internal testing/demo/
    calibration) but would need the $99/mo Professional tier — not the
    $29/mo Standard tier — to be licensed for a paying-customer-facing
    production feature.

Auth: OPEN_METEO_API_KEY env var.
    - When set: requests go to Open-Meteo's "customer-" prefixed commercial
      hosts with ?apikey=... (Open-Meteo's real commercial auth convention).
      If the key's plan does not include the requested API (e.g. a Standard
      key calling Historical/Climate), Open-Meteo returns 403; this router
      catches that and gracefully falls back to the free keyless host,
      clearly labeling the response so the tier gap is visible to the user.
    - When unset: requests still go out for REAL data on the free keyless
      hosts — response is labeled "free-tier-live" (non-commercial) so the
      frontend can render the correct Live/Demo-style badge.
    This module never fabricates weather or climate data: every response is
    live (commercial or free-tier) or, only on upstream failure, a stale
    cached entry (flagged `stale: true`) or a 502 — no synthetic numbers.

Upstream hosts (verified live 2026-07-05):
    Forecast (current weather):
        free:       https://api.open-meteo.com/v1/forecast
        commercial: https://customer-api.open-meteo.com/v1/forecast
    Historical Weather (archive):
        free:       https://archive-api.open-meteo.com/v1/archive
        commercial: https://customer-archive-api.open-meteo.com/v1/archive
    Climate (CMIP6 downscaled projections):
        free:       https://climate-api.open-meteo.com/v1/climate
        commercial: https://customer-climate-api.open-meteo.com/v1/climate
        Coverage: 1950-01-01 through 2050-01-01. 7 models available:
            CMCC_CM2_VHR4, FGOALS_f3_H, HiRAM_SIT_HR, MRI_AGCM3_2_S,
            EC_Earth3P_HR, MPI_ESM1_2_XR, NICAM16_8S.
        IMPORTANT VERIFIED FINDING: this endpoint's `scenario` concept is NOT
        an SSP-switchable parameter — live testing (passing scenario=ssp585,
        scenario=totally_bogus_value) shows Open-Meteo silently ignores any
        `scenario` value and always returns the same single HighResMIP
        model trajectory (documentation states it tracks "RCP8.5 as far as
        possible within CMIP6"). This router still accepts a `scenario`
        query param for UI/NGFS-terminology consistency with the rest of the
        platform, but it does NOT change the upstream query — the response
        says so explicitly (`upstream_scenario_selectable: false`) so this is
        never misrepresented as real scenario-conditioned data.
"""
from __future__ import annotations

import os
import threading
import time
from datetime import datetime, timedelta, timezone
from statistics import mean
from typing import Any, Dict, List, Optional, Tuple

import requests
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/v1/open-meteo", tags=["Open-Meteo Weather & Climate"])

OPEN_METEO_API_KEY_ENV = "OPEN_METEO_API_KEY"
_TIMEOUT = 30

FORECAST_FREE = "https://api.open-meteo.com/v1/forecast"
FORECAST_COMMERCIAL = "https://customer-api.open-meteo.com/v1/forecast"
ARCHIVE_FREE = "https://archive-api.open-meteo.com/v1/archive"
ARCHIVE_COMMERCIAL = "https://customer-archive-api.open-meteo.com/v1/archive"
CLIMATE_FREE = "https://climate-api.open-meteo.com/v1/climate"
CLIMATE_COMMERCIAL = "https://customer-climate-api.open-meteo.com/v1/climate"

CLIMATE_MODELS = [
    "CMCC_CM2_VHR4", "FGOALS_f3_H", "HiRAM_SIT_HR", "MRI_AGCM3_2_S",
    "EC_Earth3P_HR", "MPI_ESM1_2_XR", "NICAM16_8S",
]
DEFAULT_CLIMATE_MODELS = ["MRI_AGCM3_2_S", "EC_Earth3P_HR", "MPI_ESM1_2_XR"]
CLIMATE_COVERAGE_START_YEAR = 1950
CLIMATE_COVERAGE_END_YEAR = 2050
MAX_PROJECTION_YEARS = 40  # response-time / payload guardrail, documented below

NGFS_SCENARIOS = ["orderly", "disorderly", "hot_house"]

# ---------------------------------------------------------------------------
# In-process TTL cache with serve-stale-on-upstream-error (grid_carbon.py
# convention). TTLs: current weather changes fast but an hour is reasonable
# for this use case; historical/climate data is effectively static once
# published, so a much longer TTL avoids re-hitting the free-tier daily quota.
# ---------------------------------------------------------------------------
_TTL_CURRENT = 3600          # 1 hour
_TTL_HISTORICAL = 24 * 3600  # 24 hours
_TTL_CLIMATE = 7 * 24 * 3600  # 7 days

_cache: Dict[str, Tuple[float, Any]] = {}
_cache_lock = threading.Lock()
_CACHE_MAX = 1024


def _cache_get(key: str) -> Optional[Any]:
    now = time.time()
    with _cache_lock:
        hit = _cache.get(key)
        if hit and hit[0] > now:
            return hit[1]
    return None


def _cache_put(key: str, value: Any, ttl: int) -> None:
    with _cache_lock:
        if len(_cache) >= _CACHE_MAX:
            _cache.clear()
        _cache[key] = (time.time() + ttl, value)


def _cache_get_stale(key: str) -> Optional[Any]:
    """Return a cached value regardless of expiry (used only on upstream failure)."""
    with _cache_lock:
        hit = _cache.get(key)
    return hit[1] if hit else None


def _api_key() -> str:
    return os.environ.get(OPEN_METEO_API_KEY_ENV, "").strip()


def _fetch(
    free_url: str,
    commercial_url: str,
    params: Dict[str, Any],
    cache_key: str,
    ttl: int,
) -> Dict[str, Any]:
    """Fetch one Open-Meteo endpoint following the platform's key-gated
    Live/Demo-equivalent convention, but for Open-Meteo BOTH paths hit real
    upstream data (see module docstring): keyed -> commercial host, unkeyed
    -> free/keyless host (still real, labeled non-commercial).

    Returns a dict: {mode, note, payload, stale, retrieved_at}.
    mode in {"commercial-live", "free-tier-live", "free-tier-live-fallback"}.
    """
    cached = _cache_get(cache_key)
    if cached is not None:
        return {**cached, "cache": "hit"}

    api_key = _api_key()
    mode = "free-tier-live"
    note: Optional[str] = None
    resp = None
    try:
        if api_key:
            resp = requests.get(commercial_url, params={**params, "apikey": api_key}, timeout=_TIMEOUT)
            if resp.status_code == 403:
                note = (
                    "OPEN_METEO_API_KEY is set but the upstream commercial host returned 403 Forbidden "
                    "for this endpoint. Historical Weather / Climate (CMIP6) / Ensemble APIs require the "
                    "Professional ($99/mo) tier or higher — the $29/mo Standard tier covers only the core "
                    "Forecast API. Falling back to the free, keyless, non-commercial tier so the panel "
                    "still renders real data."
                )
                resp = requests.get(free_url, params=params, timeout=_TIMEOUT)
                resp.raise_for_status()
                mode = "free-tier-live-fallback"
            else:
                resp.raise_for_status()
                mode = "commercial-live"
        else:
            resp = requests.get(free_url, params=params, timeout=_TIMEOUT)
            resp.raise_for_status()
    except requests.RequestException as exc:
        stale = _cache_get_stale(cache_key)
        if stale is not None:
            return {**stale, "cache": "stale", "stale": True}
        raise HTTPException(status_code=502, detail=f"Open-Meteo upstream unreachable: {exc}") from exc

    payload = resp.json()
    result = {
        "mode": mode,
        "note": note,
        "payload": payload,
        "stale": False,
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
    }
    _cache_put(cache_key, result, ttl)
    return {**result, "cache": "miss"}


def _mode_label(mode: str) -> str:
    return {
        "commercial-live": "Live — commercial-licensed (OPEN_METEO_API_KEY, Standard/Professional tier)",
        "free-tier-live": "Live — free-tier, non-commercial use only (set OPEN_METEO_API_KEY for licensed commercial use)",
        "free-tier-live-fallback": "Live — free-tier fallback (API key set but plan tier excludes this endpoint; see note)",
    }.get(mode, mode)


# ---------------------------------------------------------------------------
# GET /status
# ---------------------------------------------------------------------------

@router.get("/status")
def status() -> dict:
    """Report whether an Open-Meteo API key is configured and what that does
    and does not unlock (drives the Live/Demo-equivalent badge)."""
    has_key = bool(_api_key())
    return {
        "source": "Open-Meteo (open-meteo.com)",
        "api_key_configured": has_key,
        "api_key_env": OPEN_METEO_API_KEY_ENV,
        "pricing_verified_at": "2026-07-05",
        "tiers": {
            "free": {"price": "$0", "calls": "10,000/day", "commercial_use": False,
                      "apis_reachable": "all (Forecast, Historical Weather, Climate, Ensemble)"},
            "standard": {"price": "$29/mo", "calls": "1,000,000/month", "commercial_use": True,
                         "apis_included": ["Forecast (current/forecast weather)"],
                         "apis_excluded": ["Historical Weather", "Climate (CMIP6)", "Ensemble"]},
            "professional": {"price": "$99/mo", "calls": "5,000,000/month", "commercial_use": True,
                             "apis_included": ["Forecast", "Historical Weather", "Climate (CMIP6)", "Ensemble"]},
            "enterprise": {"price": "custom (>$99/mo)", "calls": ">50,000,000/month", "commercial_use": True},
        },
        "note": (
            "OPEN_METEO_API_KEY configured — /current-weather calls the commercial Standard-tier host. "
            "/historical-extremes and /climate-projection need Professional ($99/mo) for a commercial "
            "license; with only a Standard key they will 403 and gracefully fall back to the free tier."
            if has_key else
            "No OPEN_METEO_API_KEY set — all three endpoints call Open-Meteo's real free/keyless tier "
            "(genuine live data, non-commercial-use license). Set OPEN_METEO_API_KEY for commercial use "
            "(Standard $29/mo unlocks current-weather; Professional $99/mo also unlocks "
            "historical-extremes and climate-projection)."
        ),
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }


# ---------------------------------------------------------------------------
# GET /current-weather
# ---------------------------------------------------------------------------

@router.get("/current-weather")
def current_weather(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
) -> dict:
    """Real current weather conditions (temperature, precipitation, wind,
    humidity) for a lat/lon via Open-Meteo's Forecast API. Commercial-licensed
    when OPEN_METEO_API_KEY is set (Standard tier covers this endpoint);
    otherwise a real free-tier (non-commercial) call."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,precipitation,wind_speed_10m,wind_gusts_10m,relative_humidity_2m,weather_code",
        "timezone": "UTC",
    }
    cache_key = f"current:{round(lat, 3)}:{round(lon, 3)}"
    result = _fetch(FORECAST_FREE, FORECAST_COMMERCIAL, params, cache_key, _TTL_CURRENT)
    payload = result["payload"]
    current = payload.get("current", {})
    units = payload.get("current_units", {})
    return {
        "lat": payload.get("latitude", lat),
        "lon": payload.get("longitude", lon),
        "elevation_m": payload.get("elevation"),
        "observation_time": current.get("time"),
        "temperature_c": current.get("temperature_2m"),
        "precipitation_mm": current.get("precipitation"),
        "wind_speed_kmh": current.get("wind_speed_10m"),
        "wind_gusts_kmh": current.get("wind_gusts_10m"),
        "relative_humidity_pct": current.get("relative_humidity_2m"),
        "weather_code": current.get("weather_code"),
        "units": units,
        "mode": result["mode"],
        "mode_label": _mode_label(result["mode"]),
        "note": result.get("note"),
        "stale": result.get("stale", False),
        "cache": result.get("cache"),
        "source": "Open-Meteo Forecast API — https://open-meteo.com/en/docs",
        "retrieved_at": result.get("retrieved_at"),
    }


# ---------------------------------------------------------------------------
# GET /historical-extremes
# ---------------------------------------------------------------------------

def _clamp_years(start_year: int, end_year: int) -> Tuple[int, int]:
    this_year = datetime.now(timezone.utc).year
    start_year = max(1940, min(start_year, this_year))
    end_year = max(start_year, min(end_year, this_year))
    return start_year, end_year


@router.get("/historical-extremes")
def historical_extremes(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
    start_year: int = Query(2000, ge=1940, description="First year of the historical window"),
    end_year: int = Query(2024, description="Last year of the historical window"),
) -> dict:
    """Real historical max temperature/precipitation/wind extremes at a
    location, from Open-Meteo's Historical Weather (archive) API — an
    empirical physical-hazard calibration input. Free/keyless tier is
    non-commercial; OPEN_METEO_API_KEY unlocks commercial use at the
    Professional tier (Standard does NOT include this API — see /status)."""
    start_year, end_year = _clamp_years(start_year, end_year)
    if end_year - start_year > 30:
        end_year = start_year + 30  # guardrail: archive daily payload size / call latency

    yesterday = (datetime.now(timezone.utc) - timedelta(days=2)).date()
    start_date = f"{start_year}-01-01"
    end_date_candidate = f"{end_year}-12-31"
    end_date = min(end_date_candidate, yesterday.isoformat())

    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max",
        "timezone": "UTC",
    }
    cache_key = f"hist:{round(lat, 3)}:{round(lon, 3)}:{start_date}:{end_date}"
    result = _fetch(ARCHIVE_FREE, ARCHIVE_COMMERCIAL, params, cache_key, _TTL_HISTORICAL)
    payload = result["payload"]
    daily = payload.get("daily", {})
    dates: List[str] = daily.get("time", [])
    tmax: List[Optional[float]] = daily.get("temperature_2m_max", [])
    tmin: List[Optional[float]] = daily.get("temperature_2m_min", [])
    precip: List[Optional[float]] = daily.get("precipitation_sum", [])
    wind: List[Optional[float]] = daily.get("wind_speed_10m_max", [])

    def _extreme(values: List[Optional[float]], pick_max: bool = True) -> Tuple[Optional[float], Optional[str]]:
        clean = [(v, d) for v, d in zip(values, dates) if v is not None]
        if not clean:
            return None, None
        v, d = (max(clean, key=lambda x: x[0]) if pick_max else min(clean, key=lambda x: x[0]))
        return v, d

    max_temp, max_temp_date = _extreme(tmax, True)
    min_temp, min_temp_date = _extreme(tmin, False)
    max_precip, max_precip_date = _extreme(precip, True)
    max_wind, max_wind_date = _extreme(wind, True)
    clean_tmax = [v for v in tmax if v is not None]
    clean_precip = [v for v in precip if v is not None]

    return {
        "lat": payload.get("latitude", lat),
        "lon": payload.get("longitude", lon),
        "window": {"start_date": start_date, "end_date": end_date, "days_of_data": len(dates)},
        "extremes": {
            "max_temperature_c": max_temp, "max_temperature_date": max_temp_date,
            "min_temperature_c": min_temp, "min_temperature_date": min_temp_date,
            "max_daily_precipitation_mm": max_precip, "max_daily_precipitation_date": max_precip_date,
            "max_daily_wind_speed_kmh": max_wind, "max_daily_wind_speed_date": max_wind_date,
        },
        "summary": {
            "mean_daily_max_temperature_c": round(mean(clean_tmax), 2) if clean_tmax else None,
            "mean_daily_precipitation_mm": round(mean(clean_precip), 2) if clean_precip else None,
            "total_precipitation_mm": round(sum(clean_precip), 1) if clean_precip else None,
            "heatwave_days_gt_35c": sum(1 for v in tmax if v is not None and v > 35),
            "heavy_rain_days_gt_50mm": sum(1 for v in precip if v is not None and v > 50),
        },
        "units": payload.get("daily_units", {}),
        "mode": result["mode"],
        "mode_label": _mode_label(result["mode"]),
        "note": result.get("note"),
        "stale": result.get("stale", False),
        "cache": result.get("cache"),
        "source": "Open-Meteo Historical Weather (Archive) API — https://open-meteo.com/en/docs/historical-weather-api",
        "retrieved_at": result.get("retrieved_at"),
    }


# ---------------------------------------------------------------------------
# GET /climate-projection
# ---------------------------------------------------------------------------

@router.get("/climate-projection")
def climate_projection(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
    scenario: str = Query(
        "hot_house",
        description=(
            f"Platform NGFS-style label for UI consistency ({NGFS_SCENARIOS}). "
            "NOTE: Open-Meteo's Climate API does not accept a real scenario switch "
            "(verified live — see upstream_scenario_selectable in the response); this "
            "value is accepted but has no effect on the upstream query."
        ),
    ),
    start_year: int = Query(2025, description="First year of the projection window"),
    end_year: int = Query(2050, description="Last year of the projection window"),
    models: Optional[str] = Query(
        None, description=f"Comma-separated CMIP6 model ids (default {DEFAULT_CLIMATE_MODELS}). Valid: {CLIMATE_MODELS}"
    ),
) -> dict:
    """Downscaled CMIP6 climate-model projection (per-model annual summary
    stats: mean daily max/min temp, total precipitation, max daily wind) for
    a lat/lon, via Open-Meteo's Climate API. Coverage 1950-2050.

    VERIFIED FINDING (2026-07-05): this is genuinely free-tier-callable today
    (non-commercial license) but Standard ($29/mo) does NOT include this API —
    only Professional ($99/mo)+ licenses it for commercial use. See /status.
    """
    start_year = max(CLIMATE_COVERAGE_START_YEAR, start_year)
    end_year = min(CLIMATE_COVERAGE_END_YEAR, end_year)
    if end_year < start_year:
        end_year = start_year
    if end_year - start_year > MAX_PROJECTION_YEARS:
        end_year = start_year + MAX_PROJECTION_YEARS

    model_ids = [m.strip() for m in models.split(",")] if models else list(DEFAULT_CLIMATE_MODELS)
    unknown = [m for m in model_ids if m not in CLIMATE_MODELS]
    if unknown:
        raise HTTPException(status_code=422, detail=f"Unknown climate model id(s): {unknown}. Valid: {CLIMATE_MODELS}")

    start_date = f"{start_year}-01-01"
    end_date = f"{end_year}-12-31" if end_year < CLIMATE_COVERAGE_END_YEAR else "2050-01-01"

    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "models": ",".join(model_ids),
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max",
    }
    cache_key = f"climate:{round(lat, 3)}:{round(lon, 3)}:{start_date}:{end_date}:{','.join(model_ids)}"
    result = _fetch(CLIMATE_FREE, CLIMATE_COMMERCIAL, params, cache_key, _TTL_CLIMATE)
    payload = result["payload"]
    daily = payload.get("daily", {})
    dates: List[str] = daily.get("time", [])
    units = payload.get("daily_units", {})

    per_model: Dict[str, Any] = {}
    for model_id in model_ids:
        tmax = daily.get(f"temperature_2m_max_{model_id}", [])
        tmin = daily.get(f"temperature_2m_min_{model_id}", [])
        precip = daily.get(f"precipitation_sum_{model_id}", [])
        wind = daily.get(f"wind_speed_10m_max_{model_id}", [])
        clean_tmax = [v for v in tmax if v is not None]
        clean_tmin = [v for v in tmin if v is not None]
        clean_precip = [v for v in precip if v is not None]
        clean_wind = [v for v in wind if v is not None]
        n_years = max(1, (end_year - start_year + 1))
        per_model[model_id] = {
            "mean_daily_max_temperature_c": round(mean(clean_tmax), 2) if clean_tmax else None,
            "mean_daily_min_temperature_c": round(mean(clean_tmin), 2) if clean_tmin else None,
            "max_daily_max_temperature_c": round(max(clean_tmax), 2) if clean_tmax else None,
            "mean_annual_precipitation_mm": round(sum(clean_precip) / n_years, 1) if clean_precip else None,
            "max_daily_precipitation_mm": round(max(clean_precip), 2) if clean_precip else None,
            "max_daily_wind_speed_kmh": round(max(clean_wind), 2) if clean_wind else None,
            "days_of_data": len(clean_tmax),
        }

    ensemble = {}
    for metric in ["mean_daily_max_temperature_c", "mean_annual_precipitation_mm", "max_daily_wind_speed_kmh"]:
        vals = [m[metric] for m in per_model.values() if m.get(metric) is not None]
        if vals:
            ensemble[metric] = {"mean": round(mean(vals), 2), "min": round(min(vals), 2), "max": round(max(vals), 2)}

    return {
        "lat": payload.get("latitude", lat),
        "lon": payload.get("longitude", lon),
        "window": {"start_date": start_date, "end_date": end_date, "n_years": end_year - start_year + 1},
        "requested_scenario_label": scenario,
        "upstream_scenario_selectable": False,
        "upstream_scenario_note": (
            "Verified live: Open-Meteo's Climate API silently ignores any `scenario` value; it returns a "
            "single HighResMIP-derived trajectory per model (documented as tracking RCP8.5 as far as "
            "possible within CMIP6), not a real SSP1/2/3/5-switchable multi-scenario output. This field is "
            "accepted only for UI/NGFS-terminology consistency with the rest of the platform."
        ),
        "models": model_ids,
        "per_model": per_model,
        "ensemble": ensemble,
        "units": units,
        "mode": result["mode"],
        "mode_label": _mode_label(result["mode"]),
        "note": result.get("note"),
        "stale": result.get("stale", False),
        "cache": result.get("cache"),
        "source": "Open-Meteo Climate API (CMIP6 downscaled) — https://open-meteo.com/en/docs/climate-api",
        "coverage": f"{CLIMATE_COVERAGE_START_YEAR}-01-01 to {CLIMATE_COVERAGE_END_YEAR}-01-01",
        "retrieved_at": result.get("retrieved_at"),
    }
