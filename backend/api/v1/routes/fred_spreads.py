"""
Credit Spread Climate Monitor — FRED ICE BofA OAS series proxy
==============================================================
Prefix: /api/v1/fred-spreads
Tags:   FRED Credit Spreads

Upstream: FRED (Federal Reserve Bank of St. Louis) —
    https://api.stlouisfed.org/fred/series/observations
    Free API, but REQUIRES a free API key (env var FRED_API_KEY). Without a
    key the LIVE path is unavailable and the endpoints degrade to a small,
    clearly-labeled seeded real historical sample (mode="demo-seed") so the
    frontend still renders with a "Demo Data" badge.

Series used are REAL ICE BofA US Corporate/High-Yield Option-Adjusted Spread
indices published on FRED (rating-bucket OAS, in percentage points):

    BAMLC0A0CM    ICE BofA US Corporate Master OAS               (IG aggregate)
    BAMLC0A1CAAA  ICE BofA US Corporate AAA OAS
    BAMLC0A2CAA   ICE BofA US Corporate AA OAS
    BAMLC0A3CA    ICE BofA US Corporate A OAS
    BAMLC0A4CBBB  ICE BofA US Corporate BBB OAS
    BAMLH0A0HYM2  ICE BofA US High Yield Master II OAS           (HY aggregate)
    BAMLH0A1HYBB  ICE BofA US High Yield BB OAS
    BAMLH0A2HYB   ICE BofA US High Yield B OAS
    BAMLH0A3HYC   ICE BofA US High Yield CCC & Lower OAS

FRED does not publish free *sector* OAS series, so the frontend's
transition-risk join maps platform sector transition scores onto this real
rating-bucket OAS curve via a documented sector→rating-migration table (the
spread curve itself is real market data; the sector mapping is a stated model
assumption, not fabricated data).
"""
from __future__ import annotations

import os
import threading
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import requests
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/v1/fred-spreads", tags=["FRED Credit Spreads"])

FRED_BASE = "https://api.stlouisfed.org/fred/series/observations"
FRED_API_KEY_ENV = "FRED_API_KEY"
_TIMEOUT = 30
_CACHE_TTL = 6 * 3600
_CACHE_MAX = 512

# Real ICE BofA OAS series on FRED (id -> human label / rating bucket / class)
CATALOG: Dict[str, Dict[str, str]] = {
    "BAMLC0A0CM":   {"label": "US Corporate Master (IG)", "bucket": "IG-Aggregate", "grade": "IG"},
    "BAMLC0A1CAAA": {"label": "US Corporate AAA",         "bucket": "AAA",          "grade": "IG"},
    "BAMLC0A2CAA":  {"label": "US Corporate AA",          "bucket": "AA",           "grade": "IG"},
    "BAMLC0A3CA":   {"label": "US Corporate A",           "bucket": "A",            "grade": "IG"},
    "BAMLC0A4CBBB": {"label": "US Corporate BBB",         "bucket": "BBB",          "grade": "IG"},
    "BAMLH0A0HYM2": {"label": "US High Yield Master II",  "bucket": "HY-Aggregate", "grade": "HY"},
    "BAMLH0A1HYBB": {"label": "US High Yield BB",         "bucket": "BB",           "grade": "HY"},
    "BAMLH0A2HYB":  {"label": "US High Yield B",          "bucket": "B",            "grade": "HY"},
    "BAMLH0A3HYC":  {"label": "US High Yield CCC & Lower","bucket": "CCC",          "grade": "HY"},
}
DEFAULT_IDS = ["BAMLC0A0CM", "BAMLC0A4CBBB", "BAMLH0A0HYM2", "BAMLH0A3HYC"]

# ---------------------------------------------------------------------------
# Seeded real historical fallback (monthly OAS, percentage points).
# Approximate month-end values that track the published ICE BofA OAS indices
# through the 2020 COVID spike, 2021 tights, 2022 widening and 2023-25 range.
# Labeled mode="demo-seed" — set FRED_API_KEY for exact daily/monthly series.
# ---------------------------------------------------------------------------
_SEED_MONTHS = [
    "2020-01", "2020-03", "2020-06", "2020-09", "2020-12",
    "2021-03", "2021-06", "2021-09", "2021-12",
    "2022-03", "2022-06", "2022-09", "2022-12",
    "2023-03", "2023-06", "2023-09", "2023-12",
    "2024-03", "2024-06", "2024-09", "2024-12",
    "2025-03", "2025-06",
]
_SEED_VALUES_ANCHOR: Dict[str, List[float]] = {
    "BAMLC0A0CM":   [1.01, 3.73, 1.55, 1.36, 0.98, 0.91, 0.85, 0.87, 0.92,
                     1.16, 1.55, 1.58, 1.30, 1.38, 1.28, 1.25, 1.04,
                     0.91, 0.94, 0.89, 0.83, 0.90, 0.86],
    "BAMLC0A4CBBB": [1.37, 4.88, 2.06, 1.79, 1.30, 1.20, 1.12, 1.15, 1.21,
                     1.52, 2.02, 2.05, 1.68, 1.80, 1.66, 1.62, 1.34,
                     1.18, 1.22, 1.16, 1.08, 1.17, 1.12],
    "BAMLH0A0HYM2": [3.60, 8.77, 6.44, 5.17, 3.86, 3.10, 3.21, 3.15, 3.10,
                     3.43, 5.69, 5.43, 4.69, 4.55, 4.05, 3.94, 3.34,
                     3.12, 3.21, 3.05, 2.87, 3.22, 2.95],
    "BAMLH0A3HYC":  [8.30, 17.90, 12.10, 10.60, 8.30, 6.80, 7.20, 7.40, 7.00,
                     7.20, 10.90, 11.60, 10.50, 10.20, 9.30, 9.60, 8.60,
                     7.90, 8.20, 7.60, 6.90, 7.80, 7.20],
}
# The 5 single-notch IG/HY buckets (AAA/AA/A/BB/B) are DERIVED from the 4 anchor
# series above by a fixed, documented scaling ratio — not independently sourced
# history. Ratios are set so the resulting curve is monotone in credit quality
# (AAA < AA < IG-aggregate < A < BBB < BB < HY-aggregate < B < CCC) across every
# anchor month, which real ICE BofA OAS curves also satisfy. This exists only to
# give the demo-seed fallback full 9-bucket coverage (e.g. for the sector/rating
# OLS regression) when no FRED_API_KEY is set — set FRED_API_KEY for the exact
# independently-published series.
_SEED_DERIVED_RATIO: Dict[str, Tuple[str, float]] = {
    "BAMLC0A1CAAA": ("BAMLC0A4CBBB", 0.55),   # AAA ≈ 0.55x BBB
    "BAMLC0A2CAA":  ("BAMLC0A4CBBB", 0.68),   # AA  ≈ 0.68x BBB
    "BAMLC0A3CA":   ("BAMLC0A4CBBB", 0.82),   # A   ≈ 0.82x BBB
    "BAMLH0A1HYBB": ("BAMLH0A0HYM2", 0.80),   # BB  ≈ 0.80x HY aggregate
    "BAMLH0A2HYB":  ("BAMLH0A0HYM2", 1.25),   # B   ≈ 1.25x HY aggregate
}
_SEED_VALUES: Dict[str, List[float]] = {
    **_SEED_VALUES_ANCHOR,
    **{
        sid: [round(v * ratio, 3) for v in _SEED_VALUES_ANCHOR[anchor]]
        for sid, (anchor, ratio) in _SEED_DERIVED_RATIO.items()
    },
}

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


def _fetch_fred_series(series_id: str, api_key: str, observation_start: str) -> List[dict]:
    """Fetch one FRED series (monthly) -> [{date, value}] with numeric values only."""
    params = {
        "series_id": series_id,
        "api_key": api_key,
        "file_type": "json",
        "frequency": "m",              # month-average, keeps payloads compact
        "observation_start": observation_start,
    }
    resp = requests.get(FRED_BASE, params=params, timeout=_TIMEOUT)
    resp.raise_for_status()
    obs = resp.json().get("observations", [])
    out = []
    for o in obs:
        v = o.get("value")
        if v in (None, ".", ""):
            continue
        try:
            out.append({"date": o["date"][:7], "value": round(float(v), 3)})
        except (ValueError, KeyError):
            continue
    return out


def _seed_series(series_id: str) -> List[dict]:
    vals = _SEED_VALUES.get(series_id)
    if not vals:
        return []
    return [{"date": m, "value": v} for m, v in zip(_SEED_MONTHS, vals)]


@router.get("/status")
def status() -> dict:
    """Report whether a FRED key is configured (drives the Live/Demo badge)."""
    has_key = bool(os.environ.get(FRED_API_KEY_ENV, "").strip())
    return {
        "source": "FRED (St. Louis Fed) — ICE BofA US OAS indices",
        "mode": "live" if has_key else "demo-seed",
        "api_key_configured": has_key,
        "api_key_env": FRED_API_KEY_ENV,
        "note": ("Live FRED series available." if has_key else
                 "No FRED_API_KEY set — endpoints return a labeled seeded real "
                 "historical sample. Get a free key at fredaccount.stlouisfed.org."),
        "seed_coverage": {"from": _SEED_MONTHS[0], "to": _SEED_MONTHS[-1], "seeded_ids": list(_SEED_VALUES.keys())},
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/catalog")
def catalog() -> dict:
    """Real ICE BofA OAS series available (id, label, rating bucket, grade)."""
    return {
        "count": len(CATALOG),
        "series": [{"id": k, **v} for k, v in CATALOG.items()],
        "default_ids": DEFAULT_IDS,
        "units": "Option-adjusted spread, percentage points",
        "source": "ICE BofA indices via FRED — https://fred.stlouisfed.org",
    }


@router.get("/series")
def series(
    ids: str = Query(",".join(DEFAULT_IDS), description="Comma-separated FRED series ids (see /catalog)"),
    observation_start: str = Query("2020-01-01", description="YYYY-MM-DD earliest observation"),
) -> dict:
    """Return OAS time series for the requested ids. Live from FRED when
    FRED_API_KEY is set, else a labeled seeded real sample (mode=demo-seed)."""
    requested = [s.strip() for s in ids.split(",") if s.strip()]
    unknown = [s for s in requested if s not in CATALOG]
    if unknown:
        raise HTTPException(status_code=422, detail=f"Unknown series id(s): {unknown}. See GET /catalog.")
    if not requested:
        requested = list(DEFAULT_IDS)

    api_key = os.environ.get(FRED_API_KEY_ENV, "").strip()
    cache_key = ("series", tuple(requested), observation_start, bool(api_key))
    cached = _cache_get(cache_key)
    if cached is not None:
        return {**cached, "cache": "hit"}

    out_series = []
    mode = "live"
    if api_key:
        try:
            for sid in requested:
                obs = _fetch_fred_series(sid, api_key, observation_start)
                out_series.append({"id": sid, **CATALOG[sid], "observations": obs})
        except requests.RequestException as exc:
            # Degrade gracefully to seed on upstream failure
            mode = "demo-seed"
            out_series = [{"id": sid, **CATALOG[sid], "observations": _seed_series(sid)} for sid in requested]
            _seed_err = str(exc)
        else:
            _seed_err = None
    else:
        mode = "demo-seed"
        out_series = [{"id": sid, **CATALOG[sid], "observations": _seed_series(sid)} for sid in requested]
        _seed_err = None

    result = {
        "mode": mode,
        "series": out_series,
        "units": "Option-adjusted spread, percentage points",
        "source": ("FRED live (ICE BofA OAS)" if mode == "live"
                   else "Seeded real historical sample (approximate month-end ICE BofA OAS) — "
                        "set FRED_API_KEY for exact series"),
        "upstream_error": _seed_err,
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "cache": "miss",
    }
    _cache_put(cache_key, result)
    return result
