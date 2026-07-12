"""
UN Comtrade Trade-Flow Proxy — thin proxy over the Comtrade "preview" tier
===========================================================================
Prefix: /api/v1/un-comtrade
Tags:   UN Comtrade Trade Flows

Upstream: https://comtradeapi.un.org/public/v1/preview/C/{freq}/HS — free,
keyless "preview" tier of the official UN Comtrade API. Verified live
2026-07-05:

  GET .../preview/C/A/HS?reporterCode=842&partnerCode=0&period=2022&cmdCode=7208
    -> 200, 4 records (import/export/re-export/domestic-export flow codes)
       for US steel (HS 7208) vs World, real cifvalue/fobvalue in USD.

Real, OBSERVED constraints of the free preview tier (not assumed from docs
— hit directly during this build):

  - Exactly ONE period per request: requesting 5 comma-joined years
    ("period=2018,2019,2020,2021,2022") returns HTTP 200 with a JSON error
    body {"error": "Maximum number of periods for preview is 1", ...} — NOT
    an HTTP error status, so this module treats that error field as a
    request-time failure regardless of the outer HTTP status.
  - Rate-limited tightly enough to hit 429 ("Rate limit is exceeded. Try
    again in 2 seconds.") after only a handful of rapid successive calls
    with no visible Retry-After/ratelimit-* headers on this endpoint (unlike
    OpenFIGI) — this module treats 429 as a soft/expected condition and
    degrades the caller to the seeded-extract-only path rather than
    surfacing a hard error, via the in-process TTL cache below plus a
    documented "one live call per pattern" contract for its one consumer
    (the CBAM Trade Exposure Mapper page).
  - reporterCode/partnerCode are UN M49 numeric country codes, NOT ISO
    alpha-2 — e.g. USA=842, EU aggregate=97 (verified live: reporterCode=97
    returns real EU-aggregate steel export data), World=0. The full
    reference list is public and keyless at
    https://comtradeapi.un.org/files/v1/app/reference/Reporters.json but is
    not fetched by this module; a small static ISO2->M49 table for the
    countries actually used by the CBAM Trade Exposure Mapper page is kept
    in REPORTER_M49 below (standard ISO 3166-1 numeric codes, which is what
    Comtrade's non-group reporterCodes are).
  - No API key exists or is needed for this tier; there is nothing to
    "upgrade" to short of Comtrade's paid "bulk" tier, so there is no
    Live/Demo distinction analogous to fred_spreads.py's key-gating — this
    proxy is either live or it errors (429/5xx), and the ONE consumer page
    is responsible for falling back to its existing seeded extract on error
    (documented there, not here).
"""

from __future__ import annotations

import threading
import time
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple

import requests
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/v1/un-comtrade", tags=["UN Comtrade Trade Flows"])

COMTRADE_BASE = "https://comtradeapi.un.org/public/v1/preview/C"
_TIMEOUT = 25
_CACHE_TTL = 12 * 3600   # 12h — annual trade aggregates don't change intra-day; be gentle on the free tier
_CACHE_MAX = 512

_cache: Dict[Tuple, Tuple[float, Any]] = {}
_cache_lock = threading.Lock()

# Standard ISO 3166-1 numeric codes == UN Comtrade reporterCode/partnerCode
# for individual countries; 97 = EU (Comtrade's own aggregate group code,
# not an ISO code); 0 = World. Covers the origins used by the CBAM Trade
# Exposure Mapper page (frontend/src/features/cbam-trade-exposure-mapper).
REPORTER_M49: Dict[str, int] = {
    "WORLD": 0, "EU": 97,
    "US": 842, "GB": 826, "TR": 792, "IN": 699, "KR": 410, "CN": 156,
    "UA": 804, "JP": 392, "TW": 490,  # Taiwan reported under Comtrade's "Other Asia, nes" group (490)
    "VN": 704, "RU": 643, "NO": 578, "AE": 784, "IS": 352, "MZ": 508,
    "BH": 48, "DZ": 12, "EG": 818, "MA": 504, "TN": 788, "TT": 780,
    "NG": 566, "OM": 512, "BA": 70, "RS": 688, "ME": 499, "MK": 807,
}


class ComtradeUpstreamError(Exception):
    def __init__(self, status: int, detail: str):
        self.status = status
        self.detail = detail


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


def _fetch_preview(reporter_code: int, partner_code: int, period: str, cmd_code: str, freq: str) -> dict:
    params = {
        "reporterCode": reporter_code,
        "partnerCode": partner_code,
        "period": period,
        "cmdCode": cmd_code,
    }
    url = f"{COMTRADE_BASE}/{freq}/HS"
    try:
        resp = requests.get(url, params=params, timeout=_TIMEOUT)
    except requests.RequestException as exc:
        raise ComtradeUpstreamError(503, f"UN Comtrade API unreachable: {exc}") from exc
    if resp.status_code == 429:
        raise ComtradeUpstreamError(429, "UN Comtrade preview-tier rate limit exceeded — retry in a few seconds.")
    if not resp.ok:
        raise ComtradeUpstreamError(502, f"UN Comtrade API returned HTTP {resp.status_code}: {resp.text[:300]}")
    data = resp.json()
    if isinstance(data, dict) and data.get("error"):
        # Comtrade returns 200 + an "error" field for request-shape problems
        # (e.g. multi-period requests) rather than a non-2xx status.
        raise ComtradeUpstreamError(422, str(data["error"]))
    return data


def _slim_record(rec: dict) -> dict:
    return {
        "flow_code": rec.get("flowCode"),               # M=import, X=export, RX=re-export, DX=domestic export
        "reporter_code": rec.get("reporterCode"),
        "partner_code": rec.get("partnerCode"),
        "period": rec.get("period"),
        "cmd_code": rec.get("cmdCode"),
        "net_weight_kg": rec.get("netWgt"),
        "qty": rec.get("qty"),
        "qty_unit_code": rec.get("qtyUnitCode"),
        "trade_value_usd": rec.get("primaryValue"),
        "cif_value_usd": rec.get("cifvalue"),
        "fob_value_usd": rec.get("fobvalue"),
        "is_estimated": rec.get("isNetWgtEstimated"),
    }


@router.get("/reporters")
def reporters() -> dict:
    """Small static ISO2->M49 reporter/partner code table for the countries
    the CBAM Trade Exposure Mapper page actually uses (see module docstring
    for why this isn't the full Comtrade reference list)."""
    return {"codes": REPORTER_M49, "note": "M49 numeric codes; 97=EU aggregate, 0=World (Comtrade group codes, not ISO)."}


@router.get("/trade-flow")
def trade_flow(
    reporter: str = Query(..., description="ISO2 reporter code (e.g. 'EU', 'US') or raw M49 numeric string"),
    partner: str = Query("WORLD", description="ISO2 partner/origin code (e.g. 'TR', 'CN') or raw M49 numeric string; default WORLD"),
    period: str = Query(..., description="Single year, e.g. '2022' (preview tier allows exactly ONE period per request)"),
    hs_code: str = Query(..., min_length=2, max_length=10, description="HS commodity code, e.g. '7208' (steel)"),
    freq: str = Query("A", pattern="^[AM]$", description="'A' annual or 'M' monthly"),
) -> dict:
    """
    Thin proxy to UN Comtrade's free/keyless preview tier for one
    reporter/partner/period/HS-code trade flow. Real constraints of this
    tier (verified live, see module docstring): exactly one period per
    call, tight undocumented rate limiting (429), reporter/partner codes
    are Comtrade M49 numbers (ISO2 is accepted here and translated via
    REPORTER_M49 for convenience).
    """
    reporter_code = REPORTER_M49.get(reporter.strip().upper())
    if reporter_code is None:
        if not reporter.strip().isdigit():
            raise HTTPException(status_code=422, detail=f"Unknown reporter '{reporter}'. See GET /reporters or pass a raw M49 numeric code.")
        reporter_code = int(reporter.strip())

    partner_code = REPORTER_M49.get(partner.strip().upper())
    if partner_code is None:
        if not partner.strip().isdigit():
            raise HTTPException(status_code=422, detail=f"Unknown partner '{partner}'. See GET /reporters or pass a raw M49 numeric code.")
        partner_code = int(partner.strip())

    if "," in period or ";" in period:
        raise HTTPException(status_code=422, detail="Preview tier allows exactly one period per request (verified live) — pass a single year.")

    cache_key = ("trade-flow", reporter_code, partner_code, period, hs_code, freq)
    cached = _cache_get(cache_key)
    if cached is not None:
        return {**cached, "cache": "hit"}

    try:
        raw = _fetch_preview(reporter_code, partner_code, period, hs_code, freq)
    except ComtradeUpstreamError as exc:
        raise HTTPException(status_code=exc.status, detail=exc.detail)

    records = raw.get("data", []) or []
    result = {
        "reporter": reporter, "reporter_code": reporter_code,
        "partner": partner, "partner_code": partner_code,
        "period": period, "hs_code": hs_code, "freq": freq,
        "count": len(records),
        "records": [_slim_record(r) for r in records],
        "source": "UN Comtrade comtradeapi.un.org/public/v1/preview (free, keyless preview tier)",
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "cache": "miss",
    }
    _cache_put(cache_key, result)
    return result
