"""
NASA POWER client — shared fetch/cache core for the NASA POWER proxy route
(backend/api/v1/routes/nasa_power.py) AND for services that want real
location-specific resource data in-process without an HTTP round-trip back
into this same server (e.g. services/renewable_project_engine.py's optional
lat/lon path). Kept in services/ (not api/routes/) so the dependency points
the conventional direction: routes import services, not the reverse.

Upstream: https://power.larc.nasa.gov/api/temporal/daily/point (free, keyless,
global daily solar/wind/temperature; verified live 2026-07-05 -- see
api/v1/routes/nasa_power.py module docstring for the full verification note).
"""
from __future__ import annotations

import threading
import time
from datetime import datetime, timezone
from typing import Any, Optional

import requests

POWER_BASE = "https://power.larc.nasa.gov/api/temporal/daily/point"
_HEADERS = {"Accept": "application/json", "User-Agent": "RiskAnalyticsPlatform/1.0 (nasa-power client)"}
_TIMEOUT = 30
FILL_VALUE = -999.0

PROVENANCE = {
    "source": "NASA POWER (Prediction Of Worldwide Energy Resources)",
    "operator": "NASA Langley Research Center (LaRC)",
    "url": "https://power.larc.nasa.gov/",
    "docs": "https://power.larc.nasa.gov/docs/",
    "license": "Public domain (NASA open data); free, keyless",
    "coverage": "Global, ~0.5deg grid, daily (satellite + MERRA-2 reanalysis)",
    "live": True,
}

_TTL_RESOURCE = 6 * 3600
_TTL_YIELD_INPUTS = 24 * 3600

_cache: dict[tuple, tuple[float, Any]] = {}
_cache_lock = threading.Lock()


class NasaPowerError(RuntimeError):
    """Raised when NASA POWER is unreachable/returns no usable data and there
    is no stale cache to fall back on. Callers with their own default-table
    fallback (e.g. RenewableProjectEngine) should catch this."""


def _cache_get(key: tuple) -> Optional[Any]:
    with _cache_lock:
        hit = _cache.get(key)
        if hit and hit[0] > time.time():
            return hit[1]
    return None


def _cache_put(key: tuple, value: Any, ttl: int) -> None:
    with _cache_lock:
        _cache[key] = (time.time() + ttl, value)


def _fetch_power(params: dict) -> dict:
    resp = requests.get(POWER_BASE, params=params, headers=_HEADERS, timeout=_TIMEOUT)
    resp.raise_for_status()
    payload = resp.json()
    if "properties" not in payload:
        raise NasaPowerError(f"NASA POWER API error response: {payload}")
    return payload


def _valid_series(series: dict) -> list[float]:
    return [v for v in series.values() if v is not None and v != FILL_VALUE]


def fetch_resource(lat: float, lon: float, parameters: str, start: str, end: str, community: str = "RE") -> dict:
    """Raw daily series passthrough (used by the /resource route)."""
    cache_key = ("resource", round(lat, 3), round(lon, 3), parameters, start, end, community)
    cached = _cache_get(cache_key)
    if cached is not None:
        return {**cached, "cache": "hit"}

    try:
        payload = _fetch_power({
            "parameters": parameters, "community": community,
            "longitude": lon, "latitude": lat, "start": start, "end": end, "format": "JSON",
        })
    except requests.RequestException as exc:
        with _cache_lock:
            stale = _cache.get(cache_key)
        if stale:
            return {**stale[1], "cache": "stale"}
        raise NasaPowerError(f"NASA POWER API unreachable: {exc}") from exc

    param_series = payload.get("properties", {}).get("parameter", {})
    units = payload.get("parameters", {})
    result = {
        "lat": lat, "lon": lon, "start": start, "end": end, "community": community,
        "series": param_series,
        "units": {k: v.get("units") for k, v in units.items()},
        "fill_value": payload.get("header", {}).get("fill_value", FILL_VALUE),
        "cache": "miss",
        "provenance": PROVENANCE,
    }
    _cache_put(cache_key, result, _TTL_RESOURCE)
    return result


def fetch_yield_inputs(lat: float, lon: float) -> dict:
    """{avg_ghi_kwh_m2_day, avg_wind_speed_50m_ms, ...} averaged over the last
    full calendar year at (lat, lon) -- the shape renewable_ppa's yield
    calculators need. Raises NasaPowerError on hard failure (no stale cache
    available); callers with a default-table fallback should catch it.
    """
    now = datetime.now(timezone.utc)
    last_full_year = now.year - 1
    start = f"{last_full_year}0101"
    end = f"{last_full_year}1231"

    cache_key = ("yield-inputs", round(lat, 3), round(lon, 3), last_full_year)
    cached = _cache_get(cache_key)
    if cached is not None:
        return {**cached, "cache": "hit"}

    try:
        payload = _fetch_power({
            "parameters": "ALLSKY_SFC_SW_DWN,WS50M",
            "community": "RE", "longitude": lon, "latitude": lat,
            "start": start, "end": end, "format": "JSON",
        })
    except requests.RequestException as exc:
        with _cache_lock:
            stale = _cache.get(cache_key)
        if stale:
            return {**stale[1], "cache": "stale"}
        raise NasaPowerError(f"NASA POWER API unreachable: {exc}") from exc

    series = payload.get("properties", {}).get("parameter", {})
    ghi_vals = _valid_series(series.get("ALLSKY_SFC_SW_DWN", {}))
    ws50_vals = _valid_series(series.get("WS50M", {}))

    if not ghi_vals or not ws50_vals:
        raise NasaPowerError(f"NASA POWER returned no valid data for {last_full_year} at ({lat}, {lon})")

    avg_ghi_kwh_m2_day = sum(ghi_vals) / len(ghi_vals)
    avg_wind_speed_50m_ms = sum(ws50_vals) / len(ws50_vals)

    result = {
        "lat": lat, "lon": lon, "year": last_full_year,
        "avg_ghi_kwh_m2_day": round(avg_ghi_kwh_m2_day, 4),
        "avg_ghi_kwh_m2_yr": round(avg_ghi_kwh_m2_day * 365, 1),
        "avg_wind_speed_50m_ms": round(avg_wind_speed_50m_ms, 3),
        "valid_days": {"ghi": len(ghi_vals), "wind_50m": len(ws50_vals)},
        "cache": "miss",
        "provenance": PROVENANCE,
    }
    _cache_put(cache_key, result, _TTL_YIELD_INPUTS)
    return result
