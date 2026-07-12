"""Grid Carbon Intelligence -- thin proxy over the UK NESO Carbon Intensity API.

Upstream: https://api.carbonintensity.org.uk  (National Energy System Operator)
  - Free, keyless, licensed CC-BY 4.0 ("Carbon Intensity API, National Energy
    System Operator"). Verified live 2026-07-04.
  - Exact upstream paths used (all verified to respond 200):
      GET /intensity                          -> current half-hour national intensity
      GET /generation                         -> current national generation mix
      GET /intensity/{from}/fw48h             -> 48h forward national forecast
      GET /regional                           -> current intensity + mix for 17 regions
                                                 (region ids 1-14 = DNO regions,
                                                  15/16/17 = England/Scotland/Wales)

Endpoints exposed (GET-only, genuinely public reference data -- CC-BY):
  GET /api/v1/grid-carbon/current    -- national intensity now + generation mix
  GET /api/v1/grid-carbon/forecast   -- 48-96h forward forecast (2x fw48h calls)
  GET /api/v1/grid-carbon/regional   -- current snapshot for the 14 DNO regions

All responses carry a `provenance` block and are cached in-process with a short
TTL so the upstream API is not hammered (NESO asks for fair use). If upstream
is unreachable and a stale cache entry exists, the stale entry is served with
`stale: true`; otherwise a 502 is raised so the frontend can fall back to its
clearly-labeled static snapshot.

── GLOBAL EXTENSION (additive; all of the above is unchanged) ────────────────
This module now also exposes a small unified "global grid mix" surface that
fans out to two more real, free-registration data sources so the Grid Carbon
Intelligence page is no longer GB-only:

    GET /api/v1/grid-carbon/global/sources        -- per-source Live/Demo status
    GET /api/v1/grid-carbon/global/mix?source=&region=  -- unified generation
                                                             mix, one of:
        source=GB  region ignored             -> UK NESO  (this module, keyless)
        source=US  region=<EIA region code>   -> backend/api/v1/routes/eia_energy.py
        source=EU  region=<ENTSO-E country>   -> backend/api/v1/routes/entsoe_grid.py

Each of the three sources is independently live/keyless-vs-key-gated; the
`/global/mix` response reports which mode served the request so the frontend
can show a per-source Live/Demo badge. GB stays keyless/live as before; US
(EIA) and EU (ENTSO-E) each degrade to their own labeled seeded sample when
their respective env var (EIA_API_KEY / ENTSOE_API_TOKEN) is not set -- see
those modules for details.
"""

from __future__ import annotations

import threading
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import requests
from fastapi import APIRouter, HTTPException, Query

from api.v1.routes.eia_energy import (
    EIA_API_KEY_ENV,
    REGION_CATALOG as EIA_REGION_CATALOG,
    grid_mix as _eia_grid_mix,
    status as _eia_status,
)
from api.v1.routes.entsoe_grid import (
    COUNTRY_CATALOG as ENTSOE_COUNTRY_CATALOG,
    ENTSOE_API_TOKEN_ENV,
    generation_mix as _entsoe_generation_mix,
    status as _entsoe_status,
)

router = APIRouter(prefix="/api/v1/grid-carbon", tags=["grid-carbon"])

NESO_BASE = "https://api.carbonintensity.org.uk"
_HEADERS = {"Accept": "application/json", "User-Agent": "RiskAnalyticsPlatform/1.0 (grid-carbon proxy)"}
_TIMEOUT = 20

PROVENANCE = {
    "source": "UK NESO Carbon Intensity API",
    "operator": "National Energy System Operator (NESO), with University of Oxford",
    "url": "https://api.carbonintensity.org.uk",
    "docs": "https://carbon-intensity.github.io/api-definitions/",
    "license": "CC-BY 4.0 (free, keyless)",
    "coverage": "Great Britain electricity grid (national + 14 DNO regions)",
    "live": True,
}

# ── In-process TTL cache (serve-stale-on-error) ──────────────────────────────
_TTL_CURRENT = 120       # seconds — NESO updates every half-hour; 2 min is generous
_TTL_FORECAST = 900      # 15 min — forecast revisions are slow-moving
_TTL_REGIONAL = 300      # 5 min

_cache: dict[str, tuple[float, Any]] = {}
_cache_lock = threading.Lock()


def _fetch_json(url: str) -> Any:
    resp = requests.get(url, headers=_HEADERS, timeout=_TIMEOUT)
    resp.raise_for_status()
    return resp.json()


def _cached_fetch(key: str, urls: list[str], ttl: int) -> tuple[list[Any], bool]:
    """Fetch a list of upstream URLs with a shared TTL cache entry.

    Returns (payloads, stale). Serves a stale cached entry if upstream errors;
    raises HTTPException(502) only when there is nothing cached at all.
    """
    now = time.time()
    with _cache_lock:
        hit = _cache.get(key)
        if hit and hit[0] > now:
            return hit[1], False
    try:
        payloads = [_fetch_json(u) for u in urls]
    except Exception as exc:  # noqa: BLE001 — any upstream/network failure
        with _cache_lock:
            hit = _cache.get(key)
        if hit:
            return hit[1], True  # expired but better than nothing — flag stale
        raise HTTPException(
            status_code=502,
            detail=f"UK NESO Carbon Intensity API unreachable: {exc}",
        ) from exc
    with _cache_lock:
        _cache[key] = (now + ttl, payloads)
    return payloads, False


def _iso_minute(dt: datetime) -> str:
    """NESO path timestamps: ISO8601 to the minute, Z-suffixed."""
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%MZ")


# ── Routes ────────────────────────────────────────────────────────────────────


@router.get("/current")
def current_intensity() -> dict:
    """Current GB national carbon intensity + generation mix (one half-hour period)."""
    (intensity_payload, generation_payload), stale = _cached_fetch(
        "current",
        [f"{NESO_BASE}/intensity", f"{NESO_BASE}/generation"],
        _TTL_CURRENT,
    )
    period = (intensity_payload.get("data") or [{}])[0]
    gen = generation_payload.get("data") or {}
    return {
        "from": period.get("from"),
        "to": period.get("to"),
        "intensity": period.get("intensity", {}),           # {forecast, actual, index}
        "generation_mix": gen.get("generationmix", []),      # [{fuel, perc}]
        "stale": stale,
        "provenance": PROVENANCE,
    }


@router.get("/forecast")
def forecast(
    hours: int = Query(96, ge=24, le=96, description="Forward horizon in hours (24-96)"),
) -> dict:
    """Forward national intensity forecast in half-hour periods.

    NESO's fw48h endpoint returns at most 48h per call, so a 96h horizon is
    assembled from two chained fw48h calls (now, now+48h), deduplicated on the
    period start timestamp.
    """
    now_utc = datetime.now(timezone.utc)
    urls = [f"{NESO_BASE}/intensity/{_iso_minute(now_utc)}/fw48h"]
    if hours > 48:
        urls.append(f"{NESO_BASE}/intensity/{_iso_minute(now_utc + timedelta(hours=48))}/fw48h")

    payloads, stale = _cached_fetch(f"forecast:{hours}", urls, _TTL_FORECAST)

    seen: set = set()
    periods: list[dict] = []
    for payload in payloads:
        for p in payload.get("data") or []:
            start = p.get("from")
            if start in seen:
                continue
            seen.add(start)
            intensity = p.get("intensity") or {}
            periods.append({
                "from": start,
                "to": p.get("to"),
                "forecast": intensity.get("forecast"),
                "index": intensity.get("index"),
            })
    periods.sort(key=lambda p: p["from"] or "")
    periods = periods[: hours * 2]  # half-hourly periods
    return {
        "hours": hours,
        "period_minutes": 30,
        "count": len(periods),
        "periods": periods,
        "stale": stale,
        "provenance": PROVENANCE,
    }


@router.get("/regional")
def regional(
    include_aggregates: bool = Query(
        False, description="Also include the England/Scotland/Wales aggregate rows (region ids 15-17)"
    ),
) -> dict:
    """Current intensity + generation mix for the 14 GB DNO regions."""
    (payload,), stale = _cached_fetch("regional", [f"{NESO_BASE}/regional"], _TTL_REGIONAL)
    snapshot = (payload.get("data") or [{}])[0]
    regions_out = []
    for r in snapshot.get("regions") or []:
        rid = r.get("regionid")
        if rid is None:
            continue
        if rid > 14 and not include_aggregates:
            continue
        intensity = r.get("intensity") or {}
        mix = r.get("generationmix") or []
        low_carbon = sum(
            f.get("perc", 0) for f in mix if f.get("fuel") in ("wind", "solar", "hydro", "nuclear")
        )
        regions_out.append({
            "region_id": rid,
            "shortname": r.get("shortname"),
            "dno_region": r.get("dnoregion"),
            "is_aggregate": rid > 14,
            "intensity_forecast": intensity.get("forecast"),
            "index": intensity.get("index"),
            "generation_mix": mix,
            "low_carbon_perc": round(low_carbon, 1),
        })
    return {
        "from": snapshot.get("from"),
        "to": snapshot.get("to"),
        "regions": regions_out,
        "stale": stale,
        "provenance": PROVENANCE,
    }


# ── GLOBAL EXTENSION routes (additive) ───────────────────────────────────────
# Fans out the same "grid intensity / generation mix" concept across three
# real, free-registration sources so the module is no longer GB-only. All
# existing /current, /forecast, /regional routes above are unchanged.

GLOBAL_SOURCES = {
    "GB": {"label": "Great Britain (UK NESO)", "keyed": False, "regions": None},
    "US": {"label": "United States (EIA)", "keyed": True, "regions": EIA_REGION_CATALOG},
    "EU": {"label": "European Union (ENTSO-E)", "keyed": True, "regions": {
        k: v["label"] for k, v in ENTSOE_COUNTRY_CATALOG.items()
    }},
}


@router.get("/global/sources")
def global_sources() -> dict:
    """Catalog of the three grid data sources plus their live/demo status.

    GB (NESO) is always keyless/live. US (EIA) and EU (ENTSO-E) each report
    their own mode based on EIA_API_KEY / ENTSOE_API_TOKEN, independent of
    whether NESO itself is currently reachable.
    """
    eia_stat = _eia_status()
    entsoe_stat = _entsoe_status()
    return {
        "sources": {
            "GB": {
                **GLOBAL_SOURCES["GB"],
                "mode": "live",
                "api_key_configured": True,
                "api_key_env": None,
                "note": "Keyless — always live (subject to normal upstream availability).",
            },
            "US": {
                **GLOBAL_SOURCES["US"],
                "mode": eia_stat["mode"],
                "api_key_configured": eia_stat["api_key_configured"],
                "api_key_env": EIA_API_KEY_ENV,
                "note": eia_stat["note"],
            },
            "EU": {
                **GLOBAL_SOURCES["EU"],
                "mode": entsoe_stat["mode"],
                "api_key_configured": entsoe_stat["api_key_configured"],
                "api_key_env": ENTSOE_API_TOKEN_ENV,
                "note": entsoe_stat["note"],
            },
        },
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/global/mix")
def global_mix(
    source: str = Query(..., description="One of GB | US | EU"),
    region: Optional[str] = Query(
        None, description="Required for US (EIA region code) and EU (ENTSO-E country code); ignored for GB"
    ),
) -> dict:
    """Unified generation-mix lookup spanning UK NESO (GB), EIA (US regions)
    and ENTSO-E (EU countries) behind one shape: {source, region, mode,
    generation_mix: [{fuel, perc}], provenance}.

    This does not replace /current, /regional etc. above (GB callers can keep
    using those directly) — it is an additive convenience route for the
    frontend's region/country selector.
    """
    src = (source or "").strip().upper()
    if src not in GLOBAL_SOURCES:
        raise HTTPException(status_code=422, detail=f"Unknown source '{source}'. Use one of GB, US, EU.")

    if src == "GB":
        payload = current_intensity()
        return {
            "source": "GB",
            "region": "GB",
            "region_label": GLOBAL_SOURCES["GB"]["label"],
            "mode": "demo-seed" if payload.get("stale") else "live",
            "generation_mix": payload.get("generation_mix", []),
            "extra": {"intensity": payload.get("intensity"), "from": payload.get("from"), "to": payload.get("to")},
            "provenance": payload.get("provenance"),
        }

    if src == "US":
        region_code = (region or "CAL").strip().upper()
        payload = _eia_grid_mix(region=region_code, start=None, end=None)
        return {
            "source": "US",
            "region": region_code,
            "region_label": payload.get("region_label"),
            "mode": payload.get("mode"),
            "generation_mix": payload.get("generation_mix", []),
            "extra": {"period": payload.get("period"), "upstream_error": payload.get("upstream_error")},
            "provenance": payload.get("provenance"),
        }

    # src == "EU"
    country_code = (region or "DE").strip().upper()
    payload = _entsoe_generation_mix(country_code=country_code, date=None)
    return {
        "source": "EU",
        "region": country_code,
        "region_label": payload.get("country_label"),
        "mode": payload.get("mode"),
        "generation_mix": payload.get("generation_mix", []),
        "extra": {"date": payload.get("date"), "upstream_error": payload.get("upstream_error")},
        "provenance": payload.get("provenance"),
    }
