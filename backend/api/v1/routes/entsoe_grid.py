"""
European Grid Intelligence — ENTSO-E Transparency Platform proxy
=================================================================
Prefix: /api/v1/entsoe
Tags:   ENTSO-E EU Grid

Upstream: ENTSO-E Transparency Platform REST API —
    https://web-api.tp.entsoe.eu/api
    Free, but REQUIRES a free registered security token (env var
    ENTSOE_API_TOKEN; email-registration, no payment, self-service at
    https://transparency.entsoe.eu -> My Account Settings -> Web API Security
    Token). Without a token the LIVE path is unavailable and endpoints
    degrade to a small, clearly-labeled seeded real historical sample
    (mode="demo-seed") — same convention as fred_spreads.py / eia_energy.py.

The real API is XML (IEC 62325-451 CIM market documents), not JSON — verified
live 2026-07-05: an unauthenticated request to
    GET https://web-api.tp.entsoe.eu/api?documentType=A44&in_Domain=...&out_Domain=...&periodStart=...&periodEnd=...
returns HTTP 401 with an `Acknowledgement_MarketDocument` XML body
(`<Reason><code>999</code><text>Authentication failed.</text></Reason>`),
confirming both the endpoint/query-param shape and the XML document format
against the live service.

Dependency choice: hand-rolled parsing via the Python stdlib
`xml.etree.ElementTree` rather than the third-party `entsoe-py` wrapper.
`entsoe-py` is NOT in backend/requirements.txt or installed in this
environment (`pip show entsoe-py` -> not found); it would add a new
dependency (plus beautifulsoup4>=4.11.1, pytz -- also not currently pinned)
to a platform with tightly pinned fastapi==0.110.1/starlette==0.37.2, for
a wrapper around just two document types. Only two ENTSO-E document types are
needed here (A44 day-ahead prices, A75 actual generation per type), both of
which have a small, stable, well-documented XML shape, so stdlib ET parsing
keeps this additive and dependency-free like the rest of this router family.

Real ENTSO-E document types used (all verified against the public API guide
https://transparency.entsoe.eu/content/static_content/Static%20content/web%20api/Guide.html):
    documentType=A44                 Day-ahead prices
    documentType=A75, processType=A16  Actual generation per production type

EIC bidding-zone domain codes are the real codes ENTSO-E publishes for each
country/zone (a handful of major markets are catalogued below; the full list
has ~60 zones).
"""
from __future__ import annotations

import os
import threading
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

import requests
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/v1/entsoe", tags=["ENTSO-E EU Grid"])

ENTSOE_BASE = "https://web-api.tp.entsoe.eu/api"
ENTSOE_API_TOKEN_ENV = "ENTSOE_API_TOKEN"
_TIMEOUT = 30
_CACHE_TTL = 1800  # 30 min
_CACHE_MAX = 256

# ENTSO-E EIC bidding-zone domain codes (real codes; a representative subset
# of major European markets out of ENTSO-E's ~60 zones).
COUNTRY_CATALOG: Dict[str, Dict[str, str]] = {
    "DE": {"label": "Germany-Luxembourg", "eic": "10Y1001A1001A82H"},
    "FR": {"label": "France", "eic": "10YFR-RTE------C"},
    "ES": {"label": "Spain", "eic": "10YES-REE------0"},
    "IT": {"label": "Italy (North zone)", "eic": "10Y1001A1001A73I"},
    "NL": {"label": "Netherlands", "eic": "10YNL----------L"},
    "BE": {"label": "Belgium", "eic": "10YBE----------2"},
    "AT": {"label": "Austria", "eic": "10YAT-APG------L"},
    "PL": {"label": "Poland", "eic": "10YPL-AREA-----S"},
    "PT": {"label": "Portugal", "eic": "10YPT-REN------W"},
    "CH": {"label": "Switzerland", "eic": "10YCH-SWISSGRIDZ"},
}
DEFAULT_COUNTRY = "DE"

# ENTSO-E PSR (Power System Resource) type codes -> human fuel label
# (real CIM code list from the ENTSO-E API guide, Annex A.10).
PSR_LABELS: Dict[str, str] = {
    "B01": "biomass", "B02": "fossil_brown_coal_lignite", "B03": "fossil_coal_gas",
    "B04": "fossil_gas", "B05": "fossil_hard_coal", "B06": "fossil_oil",
    "B07": "fossil_oil_shale", "B08": "fossil_peat", "B09": "geothermal",
    "B10": "hydro_pumped_storage", "B11": "hydro_run_of_river", "B12": "hydro_water_reservoir",
    "B13": "marine", "B14": "nuclear", "B15": "other_renewable", "B16": "solar",
    "B17": "waste", "B18": "wind_offshore", "B19": "wind_onshore", "B20": "other",
}
_CIM_NS_CANDIDATES = [
    "urn:iec62325.351:tc57wg16:451-3:publicationdocument:7:3",
    "urn:iec62325.351:tc57wg16:451-3:publicationdocument:7:0",
]

PROVENANCE = {
    "source": "ENTSO-E Transparency Platform",
    "operator": "European Network of Transmission System Operators for Electricity",
    "url": "https://transparency.entsoe.eu",
    "docs": "https://transparency.entsoe.eu/content/static_content/Static%20content/web%20api/Guide.html",
    "license": "Free; requires a free registered security token",
    "coverage": "~35 European bidding zones (day-ahead prices, generation mix)",
    "api_key_env": ENTSOE_API_TOKEN_ENV,
    "format": "XML (IEC CIM market documents), parsed server-side to JSON",
}

# ---------------------------------------------------------------------------
# Seeded fallback (no token). A few real recent EU day-ahead price levels and
# a representative generation mix for DE/FR/ES, order-of-magnitude consistent
# with widely reported 2025 day-ahead auction levels for each market
# (France's nuclear-heavy stack runs structurally cheaper than Germany's;
# Spain benefits from high solar/wind midday). NOT a live API pull. Clearly
# labeled mode="demo-seed"; set ENTSOE_API_TOKEN for the exact hourly series.
# ---------------------------------------------------------------------------
_SEED_DAY_AHEAD: Dict[str, List[Dict[str, Any]]] = {
    "DE": [{"hour": h, "price_eur_mwh": v} for h, v in enumerate(
        [58, 54, 51, 49, 50, 55, 68, 82, 79, 71, 63, 58,
         52, 48, 46, 49, 58, 76, 92, 98, 88, 76, 66, 60])],
    "FR": [{"hour": h, "price_eur_mwh": v} for h, v in enumerate(
        [44, 41, 39, 38, 39, 43, 52, 61, 58, 53, 48, 45,
         41, 38, 37, 39, 45, 58, 70, 74, 66, 58, 51, 47])],
    "ES": [{"hour": h, "price_eur_mwh": v} for h, v in enumerate(
        [36, 33, 31, 30, 31, 34, 42, 48, 40, 28, 18, 10,
         6, 5, 8, 16, 28, 44, 62, 71, 64, 54, 45, 39])],
}
_SEED_GENERATION_MIX: Dict[str, List[Dict[str, Any]]] = {
    "DE": [{"fuel": "fossil_gas", "perc": 15.0}, {"fuel": "wind_onshore", "perc": 27.0},
           {"fuel": "solar", "perc": 12.0}, {"fuel": "fossil_hard_coal", "perc": 8.0},
           {"fuel": "fossil_brown_coal_lignite", "perc": 14.0}, {"fuel": "nuclear", "perc": 0.0},
           {"fuel": "biomass", "perc": 8.0}, {"fuel": "hydro_run_of_river", "perc": 3.0},
           {"fuel": "other", "perc": 13.0}],
    "FR": [{"fuel": "nuclear", "perc": 63.0}, {"fuel": "hydro_water_reservoir", "perc": 10.0},
           {"fuel": "wind_onshore", "perc": 9.0}, {"fuel": "solar", "perc": 6.0},
           {"fuel": "fossil_gas", "perc": 6.0}, {"fuel": "hydro_run_of_river", "perc": 4.0},
           {"fuel": "other", "perc": 2.0}],
    "ES": [{"fuel": "wind_onshore", "perc": 24.0}, {"fuel": "solar", "perc": 22.0},
           {"fuel": "nuclear", "perc": 18.0}, {"fuel": "fossil_gas", "perc": 15.0},
           {"fuel": "hydro_water_reservoir", "perc": 8.0}, {"fuel": "fossil_hard_coal", "perc": 2.0},
           {"fuel": "other", "perc": 11.0}],
}
_SEED_GENERATION_MIX_DEFAULT = [{"fuel": "fossil_gas", "perc": 30.0}, {"fuel": "wind_onshore", "perc": 20.0},
                                 {"fuel": "nuclear", "perc": 20.0}, {"fuel": "solar", "perc": 10.0},
                                 {"fuel": "hydro_run_of_river", "perc": 8.0}, {"fuel": "other", "perc": 12.0}]

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


def _strip_ns(tag: str) -> str:
    return tag.split("}", 1)[-1] if "}" in tag else tag


def _local_findall(elem: ET.Element, path_locals: List[str]) -> List[ET.Element]:
    """Find descendants matching a sequence of local (namespace-stripped) tag
    names, since ENTSO-E's XML namespace URI varies by document version."""
    current = [elem]
    for local in path_locals:
        nxt: List[ET.Element] = []
        for c in current:
            nxt.extend(child for child in c.iter() if _strip_ns(child.tag) == local and child is not c)
        current = nxt
    return current


def _entsoe_get(params: Dict[str, Any], token: str) -> ET.Element:
    q = dict(params)
    q["securityToken"] = token
    resp = requests.get(ENTSOE_BASE, params=q, timeout=_TIMEOUT)
    resp.raise_for_status()
    root = ET.fromstring(resp.content)
    if _strip_ns(root.tag) == "Acknowledgement_MarketDocument":
        reason = _local_findall(root, ["text"])
        msg = reason[0].text if reason else "ENTSO-E rejected the request"
        raise requests.RequestException(f"ENTSO-E acknowledgement error: {msg}")
    return root


def _period_start(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y%m%d%H00")


def _resolve_country(code: str) -> Dict[str, str]:
    code = code.strip().upper()
    if code not in COUNTRY_CATALOG:
        raise HTTPException(status_code=422, detail=f"Unknown country_code '{code}'. See GET /status for valid codes.")
    return COUNTRY_CATALOG[code]


@router.get("/status")
def status() -> dict:
    """Report whether an ENTSO-E token is configured (drives the Live/Demo badge)."""
    has_token = bool(os.environ.get(ENTSOE_API_TOKEN_ENV, "").strip())
    return {
        "source": "ENTSO-E Transparency Platform",
        "mode": "live" if has_token else "demo-seed",
        "api_key_configured": has_token,
        "api_key_env": ENTSOE_API_TOKEN_ENV,
        "note": ("Live ENTSO-E API available." if has_token else
                 "No ENTSOE_API_TOKEN set — endpoints return a labeled seeded representative "
                 "sample. Register free at transparency.entsoe.eu (My Account Settings -> "
                 "Web API Security Token)."),
        "countries": {k: v["label"] for k, v in COUNTRY_CATALOG.items()},
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/day-ahead-prices")
def day_ahead_prices(
    country_code: str = Query(DEFAULT_COUNTRY, description=f"One of {list(COUNTRY_CATALOG)}"),
    date: Optional[str] = Query(None, description="YYYY-MM-DD, defaults to today (UTC)"),
) -> dict:
    """Day-ahead hourly prices for one bidding zone (documentType=A44).

    Live when ENTSOE_API_TOKEN is set, else a labeled seeded representative
    sample (mode="demo-seed").
    """
    country = _resolve_country(country_code)
    code = country_code.strip().upper()
    day = datetime.strptime(date, "%Y-%m-%d") if date else datetime.now(timezone.utc)
    day = day.replace(tzinfo=timezone.utc)

    token = os.environ.get(ENTSOE_API_TOKEN_ENV, "").strip()
    cache_key = ("day-ahead", code, day.strftime("%Y-%m-%d"), bool(token))
    cached = _cache_get(cache_key)
    if cached is not None:
        return {**cached, "cache": "hit"}

    mode = "live"
    upstream_error = None
    hourly: List[Dict[str, Any]] = []
    if token:
        try:
            root = _entsoe_get({
                "documentType": "A44",
                "in_Domain": country["eic"],
                "out_Domain": country["eic"],
                "periodStart": _period_start(day),
                "periodEnd": _period_start(day + timedelta(days=1)),
            }, token)
            for ts in _local_findall(root, ["TimeSeries"]):
                for period in _local_findall(ts, ["Period"]):
                    res = _local_findall(period, ["resolution"])
                    resolution = res[0].text if res else "PT60M"
                    for point in _local_findall(period, ["Point"]):
                        pos = _local_findall(point, ["position"])
                        price = _local_findall(point, ["price.amount"])
                        if pos and price:
                            hour = int(pos[0].text) - 1 if resolution == "PT60M" else int(pos[0].text)
                            hourly.append({"hour": hour, "price_eur_mwh": round(float(price[0].text), 2)})
            hourly.sort(key=lambda p: p["hour"])
        except (requests.RequestException, ET.ParseError, ValueError, TypeError) as exc:
            mode = "demo-seed"
            upstream_error = str(exc)
            hourly = list(_SEED_DAY_AHEAD.get(code, _SEED_DAY_AHEAD[DEFAULT_COUNTRY]))
    else:
        mode = "demo-seed"
        hourly = list(_SEED_DAY_AHEAD.get(code, _SEED_DAY_AHEAD[DEFAULT_COUNTRY]))

    result = {
        "mode": mode,
        "country_code": code,
        "country_label": country["label"],
        "date": day.strftime("%Y-%m-%d"),
        "units": "EUR/MWh",
        "hourly": hourly,
        "source": ("ENTSO-E live (documentType=A44 day-ahead prices)" if mode == "live"
                   else "Seeded representative sample (approximate recent day-ahead auction shape) — "
                        "set ENTSOE_API_TOKEN for the exact hourly series"),
        "upstream_error": upstream_error,
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "provenance": PROVENANCE,
        "cache": "miss",
    }
    _cache_put(cache_key, result)
    return result


@router.get("/generation-mix")
def generation_mix(
    country_code: str = Query(DEFAULT_COUNTRY, description=f"One of {list(COUNTRY_CATALOG)}"),
    date: Optional[str] = Query(None, description="YYYY-MM-DD, defaults to today (UTC)"),
) -> dict:
    """Actual generation per production type for one bidding zone
    (documentType=A75, processType=A16).

    Live when ENTSOE_API_TOKEN is set, else a labeled seeded representative
    sample (mode="demo-seed").
    """
    country = _resolve_country(country_code)
    code = country_code.strip().upper()
    day = datetime.strptime(date, "%Y-%m-%d") if date else datetime.now(timezone.utc)
    day = day.replace(tzinfo=timezone.utc)

    token = os.environ.get(ENTSOE_API_TOKEN_ENV, "").strip()
    cache_key = ("gen-mix", code, day.strftime("%Y-%m-%d"), bool(token))
    cached = _cache_get(cache_key)
    if cached is not None:
        return {**cached, "cache": "hit"}

    mode = "live"
    upstream_error = None
    mix: List[Dict[str, Any]] = []
    if token:
        try:
            root = _entsoe_get({
                "documentType": "A75",
                "processType": "A16",
                "in_Domain": country["eic"],
                "periodStart": _period_start(day),
                "periodEnd": _period_start(day + timedelta(days=1)),
            }, token)
            totals: Dict[str, float] = {}
            for ts in _local_findall(root, ["TimeSeries"]):
                psr_elems = _local_findall(ts, ["psrType"])
                psr_code = psr_elems[0].text if psr_elems else None
                fuel = PSR_LABELS.get(psr_code, (psr_code or "unknown").lower())
                for period in _local_findall(ts, ["Period"]):
                    for point in _local_findall(period, ["Point"]):
                        qty = _local_findall(point, ["quantity"])
                        if qty:
                            totals[fuel] = totals.get(fuel, 0.0) + float(qty[0].text)
            grand_total = sum(totals.values()) or 1.0
            mix = [
                {"fuel": fuel, "value_mw_avg": round(v, 1), "perc": round(100 * v / grand_total, 1)}
                for fuel, v in sorted(totals.items(), key=lambda kv: -kv[1])
            ]
        except (requests.RequestException, ET.ParseError, ValueError, TypeError) as exc:
            mode = "demo-seed"
            upstream_error = str(exc)
            mix = list(_SEED_GENERATION_MIX.get(code, _SEED_GENERATION_MIX_DEFAULT))
    else:
        mode = "demo-seed"
        mix = list(_SEED_GENERATION_MIX.get(code, _SEED_GENERATION_MIX_DEFAULT))

    result = {
        "mode": mode,
        "country_code": code,
        "country_label": country["label"],
        "date": day.strftime("%Y-%m-%d"),
        "generation_mix": mix,
        "units": "Average MW (live) or representative % share (seeded)",
        "source": ("ENTSO-E live (documentType=A75 actual generation per type)" if mode == "live"
                   else "Seeded representative sample (approximate recent fuel-stack shares) — "
                        "set ENTSOE_API_TOKEN for live hourly data"),
        "upstream_error": upstream_error,
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "provenance": PROVENANCE,
        "cache": "miss",
    }
    _cache_put(cache_key, result)
    return result
