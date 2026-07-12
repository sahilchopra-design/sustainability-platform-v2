"""
US Grid & Energy Prices — EIA Open Data v2 proxy
=================================================
Prefix: /api/v1/eia
Tags:   EIA US Energy

Upstream: US Energy Information Administration Open Data v2 —
    https://api.eia.gov/v2/...
    Public-domain (US federal government) data, free to use, but REQUIRES a
    free API key (env var EIA_API_KEY, instant self-serve signup, no approval
    wait: https://www.eia.gov/opendata/register.php). Without a key the
    upstream API returns HTTP 403 {"error": {"code": "API_KEY_MISSING", ...}}
    -- verified live 2026-07-05 against both routes used below. So, exactly
    like backend/api/v1/routes/fred_spreads.py, the LIVE path is unavailable
    without a key and endpoints degrade to a small, clearly-labeled seeded
    real/representative sample (mode="demo-seed").

Real upstream routes used (EIA v2 "data[]=value&facets[...]" convention;
route paths verified to be syntactically valid -- they return the
API_KEY_MISSING auth error rather than a 404/route-not-found, both with and
without facet filters):

    GET /v2/electricity/rto/fuel-type-data/data/
        Hourly net generation by fuel type, per US grid balancing-authority /
        region ("respondent" facet). This is the US analogue of NESO's
        `generationmix` -- used for GET /grid-mix below.

    GET /v2/natural-gas/pri/fut/data/
        Daily futures/spot price series (facets[series][]=RNGWHHD is the
        real published Henry Hub Natural Gas Spot Price series id) -- used
        for GET /gas-price below.

Docs: https://www.eia.gov/opendata/documentation.php
"""
from __future__ import annotations

import os
import threading
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

import requests
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/v1/eia", tags=["EIA US Energy"])

EIA_BASE = "https://api.eia.gov/v2"
EIA_API_KEY_ENV = "EIA_API_KEY"
_TIMEOUT = 30
_CACHE_TTL = 900  # 15 min -- EIA hourly series revise slowly; fair-use of the free API
_CACHE_MAX = 256

# US EIA "Regions" -- the standard grouped balancing-authority codes published
# in EIA's Hourly Electric Grid Monitor (respondent facet values). Real codes.
REGION_CATALOG: Dict[str, str] = {
    "US48": "Lower 48 States (aggregate)",
    "CAL": "California",
    "CAR": "Carolinas",
    "CENT": "Central",
    "FLA": "Florida",
    "MIDA": "Mid-Atlantic",
    "MIDW": "Midwest",
    "NE": "New England",
    "NY": "New York",
    "NW": "Northwest",
    "SE": "Southeast",
    "SW": "Southwest",
    "TEN": "Tennessee",
    "TEX": "Texas",
}
DEFAULT_REGION = "CAL"

# EIA fuel-type-data `fueltype` codes -> human label (real EIA taxonomy).
FUEL_LABELS: Dict[str, str] = {
    "CO2": "co2", "COL": "coal", "NG": "gas", "NUC": "nuclear", "OIL": "oil",
    "WAT": "hydro", "SUN": "solar", "WND": "wind", "OTH": "other",
    "UNK": "unknown",
}

PROVENANCE = {
    "source": "US EIA Open Data v2",
    "operator": "US Energy Information Administration (federal statistical agency)",
    "url": "https://api.eia.gov/v2",
    "docs": "https://www.eia.gov/opendata/documentation.php",
    "license": "US public domain; free API key required (instant self-serve signup)",
    "coverage": "US electricity balancing-authority regions + Henry Hub gas price",
    "api_key_env": EIA_API_KEY_ENV,
}

# ---------------------------------------------------------------------------
# Seeded fallback (no API key). These are representative/approximate recent
# US regional generation-mix shares and Henry Hub prices, order-of-magnitude
# consistent with publicly reported EIA figures for each region's typical
# fuel stack -- NOT a live API pull. Clearly labeled mode="demo-seed" in every
# response; set EIA_API_KEY for exact hourly/daily series.
# ---------------------------------------------------------------------------
_SEED_GRID_MIX: Dict[str, List[Dict[str, Any]]] = {
    "CAL":  [{"fuel": "gas", "perc": 34.0}, {"fuel": "solar", "perc": 27.0}, {"fuel": "hydro", "perc": 9.0},
             {"fuel": "wind", "perc": 8.0}, {"fuel": "nuclear", "perc": 8.0}, {"fuel": "other", "perc": 14.0}],
    "TEX":  [{"fuel": "gas", "perc": 42.0}, {"fuel": "wind", "perc": 24.0}, {"fuel": "coal", "perc": 13.0},
             {"fuel": "nuclear", "perc": 8.0}, {"fuel": "solar", "perc": 11.0}, {"fuel": "other", "perc": 2.0}],
    "MIDA": [{"fuel": "gas", "perc": 40.0}, {"fuel": "nuclear", "perc": 33.0}, {"fuel": "coal", "perc": 15.0},
             {"fuel": "wind", "perc": 4.0}, {"fuel": "solar", "perc": 3.0}, {"fuel": "other", "perc": 5.0}],
    "NW":   [{"fuel": "hydro", "perc": 48.0}, {"fuel": "gas", "perc": 20.0}, {"fuel": "wind", "perc": 14.0},
             {"fuel": "coal", "perc": 8.0}, {"fuel": "nuclear", "perc": 6.0}, {"fuel": "other", "perc": 4.0}],
    "NY":   [{"fuel": "gas", "perc": 38.0}, {"fuel": "nuclear", "perc": 26.0}, {"fuel": "hydro", "perc": 20.0},
             {"fuel": "wind", "perc": 5.0}, {"fuel": "solar", "perc": 4.0}, {"fuel": "other", "perc": 7.0}],
    "CENT": [{"fuel": "wind", "perc": 34.0}, {"fuel": "gas", "perc": 26.0}, {"fuel": "coal", "perc": 24.0},
             {"fuel": "nuclear", "perc": 6.0}, {"fuel": "solar", "perc": 4.0}, {"fuel": "other", "perc": 6.0}],
    "SE":   [{"fuel": "gas", "perc": 46.0}, {"fuel": "nuclear", "perc": 24.0}, {"fuel": "coal", "perc": 15.0},
             {"fuel": "solar", "perc": 6.0}, {"fuel": "hydro", "perc": 5.0}, {"fuel": "other", "perc": 4.0}],
}
_SEED_GRID_MIX_DEFAULT = [{"fuel": "gas", "perc": 40.0}, {"fuel": "nuclear", "perc": 18.0},
                           {"fuel": "coal", "perc": 15.0}, {"fuel": "wind", "perc": 12.0},
                           {"fuel": "hydro", "perc": 7.0}, {"fuel": "solar", "perc": 5.0},
                           {"fuel": "other", "perc": 3.0}]

# Approximate recent Henry Hub monthly average spot prices, $/MMBtu -- tracks
# the well-publicized 2024-2025 range (winter-2025 spike, summer softening).
# Set EIA_API_KEY for the exact daily series (natural-gas/pri/fut, RNGWHHD).
_SEED_GAS_PRICE: List[Dict[str, Any]] = [
    {"date": "2025-01", "value": 3.90}, {"date": "2025-02", "value": 3.60},
    {"date": "2025-03", "value": 3.15}, {"date": "2025-04", "value": 2.95},
    {"date": "2025-05", "value": 2.80}, {"date": "2025-06", "value": 2.70},
]

_cache: Dict[Tuple, Tuple[float, Any]] = {}
_cache_lock = threading.Lock()


def _cache_get(key: Tuple) -> Optional[Any]:
    now = time.time()
    with _cache_lock:
        hit = _cache.get(key)
        if hit and hit[0] > now:
            return hit[1]
    return None


def _cache_put(key: Tuple, value: Any) -> None:
    with _cache_lock:
        if len(_cache) >= _CACHE_MAX:
            _cache.clear()
        _cache[key] = (time.time() + _CACHE_TTL, value)


def _eia_get(path: str, api_key: str, params: Dict[str, Any]) -> dict:
    q = dict(params)
    q["api_key"] = api_key
    resp = requests.get(f"{EIA_BASE}{path}", params=q, timeout=_TIMEOUT)
    resp.raise_for_status()
    return resp.json()


@router.get("/status")
def status() -> dict:
    """Report whether an EIA key is configured (drives the Live/Demo badge)."""
    has_key = bool(os.environ.get(EIA_API_KEY_ENV, "").strip())
    return {
        "source": "US EIA Open Data v2",
        "mode": "live" if has_key else "demo-seed",
        "api_key_configured": has_key,
        "api_key_env": EIA_API_KEY_ENV,
        "note": ("Live EIA v2 API available." if has_key else
                 "No EIA_API_KEY set — endpoints return a labeled seeded representative "
                 "sample. Get a free instant key at eia.gov/opendata/register.php."),
        "regions": REGION_CATALOG,
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/grid-mix")
def grid_mix(
    region: str = Query(DEFAULT_REGION, description=f"EIA region code, one of {list(REGION_CATALOG)}"),
    start: Optional[str] = Query(None, description="ISO start (YYYY-MM-DDTHH), defaults to 24h ago"),
    end: Optional[str] = Query(None, description="ISO end (YYYY-MM-DDTHH), defaults to now"),
) -> dict:
    """US regional generation mix by fuel type (electricity/rto/fuel-type-data).

    Live when EIA_API_KEY is set, else a labeled seeded representative sample
    (mode="demo-seed").
    """
    region = region.strip().upper()
    if region not in REGION_CATALOG:
        raise HTTPException(status_code=422, detail=f"Unknown region '{region}'. See GET /status for valid codes.")

    now = datetime.now(timezone.utc)
    start = start or (now - timedelta(hours=24)).strftime("%Y-%m-%dT%H")
    end = end or now.strftime("%Y-%m-%dT%H")

    api_key = os.environ.get(EIA_API_KEY_ENV, "").strip()
    cache_key = ("grid-mix", region, start, end, bool(api_key))
    cached = _cache_get(cache_key)
    if cached is not None:
        return {**cached, "cache": "hit"}

    mode = "live"
    upstream_error = None
    if api_key:
        try:
            payload = _eia_get(
                "/electricity/rto/fuel-type-data/data/",
                api_key,
                {
                    "frequency": "hourly",
                    "data[0]": "value",
                    "facets[respondent][]": region,
                    "start": start,
                    "end": end,
                    "sort[0][column]": "period",
                    "sort[0][direction]": "desc",
                    "offset": 0,
                    "length": 5000,
                },
            )
            rows = payload.get("response", {}).get("data", [])
            # Aggregate the most recent period's rows into a fuel-mix breakdown.
            if rows:
                latest_period = rows[0]["period"]
                latest_rows = [r for r in rows if r.get("period") == latest_period]
                total = sum(float(r.get("value") or 0) for r in latest_rows) or 1.0
                mix = [
                    {
                        "fuel": FUEL_LABELS.get(r.get("fueltype"), (r.get("fueltype") or "unknown").lower()),
                        "fueltype_code": r.get("fueltype"),
                        "value_mwh": float(r.get("value") or 0),
                        "perc": round(100 * float(r.get("value") or 0) / total, 1),
                    }
                    for r in latest_rows
                ]
                result_period = latest_period
            else:
                mix, result_period = [], None
        except requests.RequestException as exc:
            mode = "demo-seed"
            upstream_error = str(exc)
            mix = _SEED_GRID_MIX.get(region, _SEED_GRID_MIX_DEFAULT)
            result_period = None
        except (KeyError, ValueError, TypeError) as exc:
            mode = "demo-seed"
            upstream_error = f"Unexpected EIA response shape: {exc}"
            mix = _SEED_GRID_MIX.get(region, _SEED_GRID_MIX_DEFAULT)
            result_period = None
    else:
        mode = "demo-seed"
        mix = _SEED_GRID_MIX.get(region, _SEED_GRID_MIX_DEFAULT)
        result_period = None

    result = {
        "mode": mode,
        "region": region,
        "region_label": REGION_CATALOG[region],
        "period": result_period,
        "generation_mix": mix,
        "units": "Net generation, MWh (live) or representative % share (seeded)",
        "source": ("EIA v2 live (electricity/rto/fuel-type-data)" if mode == "live"
                   else "Seeded representative sample (approximate regional fuel-stack shares) — "
                        "set EIA_API_KEY for live hourly data"),
        "upstream_error": upstream_error,
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "provenance": PROVENANCE,
        "cache": "miss",
    }
    _cache_put(cache_key, result)
    return result


@router.get("/gas-price")
def gas_price(
    days: int = Query(180, ge=1, le=1825, description="Lookback window in days for the live daily series"),
) -> dict:
    """Henry Hub natural gas spot price (natural-gas/pri/fut, series RNGWHHD).

    Live when EIA_API_KEY is set, else a labeled seeded representative sample
    (mode="demo-seed").
    """
    api_key = os.environ.get(EIA_API_KEY_ENV, "").strip()
    cache_key = ("gas-price", days, bool(api_key))
    cached = _cache_get(cache_key)
    if cached is not None:
        return {**cached, "cache": "hit"}

    mode = "live"
    upstream_error = None
    if api_key:
        try:
            start = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
            payload = _eia_get(
                "/natural-gas/pri/fut/data/",
                api_key,
                {
                    "frequency": "daily",
                    "data[0]": "value",
                    "facets[series][]": "RNGWHHD",
                    "start": start,
                    "sort[0][column]": "period",
                    "sort[0][direction]": "desc",
                    "offset": 0,
                    "length": 5000,
                },
            )
            rows = payload.get("response", {}).get("data", [])
            observations = [
                {"date": r.get("period"), "value": round(float(r["value"]), 3)}
                for r in rows if r.get("value") not in (None, "")
            ]
            observations.sort(key=lambda o: o["date"])
        except requests.RequestException as exc:
            mode = "demo-seed"
            upstream_error = str(exc)
            observations = list(_SEED_GAS_PRICE)
        except (KeyError, ValueError, TypeError) as exc:
            mode = "demo-seed"
            upstream_error = f"Unexpected EIA response shape: {exc}"
            observations = list(_SEED_GAS_PRICE)
    else:
        mode = "demo-seed"
        observations = list(_SEED_GAS_PRICE)

    result = {
        "mode": mode,
        "series_id": "RNGWHHD",
        "label": "Henry Hub Natural Gas Spot Price",
        "units": "$/MMBtu",
        "observations": observations,
        "source": ("EIA v2 live (natural-gas/pri/fut, RNGWHHD)" if mode == "live"
                   else "Seeded representative sample (approximate monthly averages) — "
                        "set EIA_API_KEY for the exact daily series"),
        "upstream_error": upstream_error,
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "provenance": PROVENANCE,
        "cache": "miss",
    }
    _cache_put(cache_key, result)
    return result
