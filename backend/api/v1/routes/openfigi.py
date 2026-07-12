"""
Instrument Identifier Mapper — thin proxy over the OpenFIGI /v3/mapping API
============================================================================
Prefix: /api/v1/openfigi
Tags:   OpenFIGI Instrument Mapping

Upstream: https://api.openfigi.com/v3/mapping — free, keyless at a low rate
limit; an optional free API key (env var OPENFIGI_API_KEY, sent as header
X-OPENFIGI-APIKEY) raises the limit. Verified live 2026-07-05:

  POST /v3/mapping  body: [{"idType": "ID_ISIN", "idValue": "US0378331005"}]
    -> 200 [{"data": [{"figi": "BBG000B9XRY4", "name": "APPLE INC",
                        "ticker": "AAPL", "exchCode": "US", ...}, ...]}]

Facts established by LIVE calls against the real API during this build
(no key configured) — do not assume these without re-verifying if the
upstream changes:

  - Real idType values confirmed live: ID_ISIN, ID_CUSIP, TICKER (an
    invalid idType, e.g. "ID_BOGUS", returns 200 with
    [{"error": "Invalid value for idType."}] — OpenFIGI validates
    per-job, not per-request, so a bad idType does not fail the whole
    batch). OpenFIGI's docs list further idTypes (ID_SEDOL, ID_WERTPAPIER,
    ID_BB, ID_BB_UNIQUE, ID_CINS, ID_CUSIP_8_CHR, BASE_TICKER, ...) that
    were NOT exercised live here; ALLOWED_ID_TYPES below is intentionally
    restricted to the three verified.
  - Unkeyed per-request batch cap is 10 mapping jobs: sending 11 jobs
    returned HTTP 413 "Request may only contain 10 mapping jobs." Sending
    10 or fewer succeeds. This module enforces UNKEYED_BATCH_CAP = 10.
  - Unkeyed rate limit observed via response headers on a normal 200:
    `ratelimit-policy: 25;w=60`, i.e. 25 requests per rolling 60s window
    per IP — NOT per-key documentation, an actually-observed header.
  - A keyed batch cap of 100/request and a materially higher keyed rate
    limit are documented by OpenFIGI's public docs, but were NOT verified
    live here (no API key was available during this build) — treated as
    a documented-not-verified assumption; KEYED_BATCH_CAP below is set
    from that documentation and should be re-confirmed once a real key
    is configured.

This module performs no computation on OpenFIGI data beyond field slimming
and response batching; it is a thin proxy with an in-process TTL cache (FIGI
mappings are stable identifiers, so a long TTL is safe).
"""

from __future__ import annotations

import os
import threading
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import requests
from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from db.base import get_db

router = APIRouter(prefix="/api/v1/openfigi", tags=["OpenFIGI Instrument Mapping"])

OPENFIGI_BASE = "https://api.openfigi.com/v3/mapping"
OPENFIGI_API_KEY_ENV = "OPENFIGI_API_KEY"
_TIMEOUT = 20

# Verified live 2026-07-05 (see module docstring). Keep restricted to what
# was actually exercised against the real API rather than the full
# documented idType list.
ALLOWED_ID_TYPES = {"ID_ISIN", "ID_CUSIP", "TICKER"}

UNKEYED_BATCH_CAP = 10   # verified live: 11 jobs -> HTTP 413
KEYED_BATCH_CAP = 100    # documented by OpenFIGI, NOT independently verified (no key available)

_CACHE_TTL = 24 * 3600   # 24h — FIGI mappings are stable identifiers
_CACHE_MAX = 4096

_cache: Dict[Tuple, Tuple[float, Any]] = {}
_cache_lock = threading.Lock()


class MappingJob(BaseModel):
    id_type: str = Field(..., description="OpenFIGI idType — one of: " + ", ".join(sorted(ALLOWED_ID_TYPES)))
    id_value: str = Field(..., min_length=1, max_length=64)
    exch_code: Optional[str] = Field(None, description="Optional exchange code to disambiguate (e.g. 'US')")


class OpenFigiUpstreamError(Exception):
    def __init__(self, status: int, detail: str):
        self.status = status
        self.detail = detail


def _api_key() -> str:
    return os.environ.get(OPENFIGI_API_KEY_ENV, "").strip()


def _batch_cap() -> int:
    return KEYED_BATCH_CAP if _api_key() else UNKEYED_BATCH_CAP


def _cache_key(job: MappingJob) -> Tuple:
    return (job.id_type, job.id_value.strip().upper(), (job.exch_code or "").strip().upper())


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


def _slim_match(m: dict) -> dict:
    return {
        "figi": m.get("figi"),
        "composite_figi": m.get("compositeFIGI"),
        "share_class_figi": m.get("shareClassFIGI"),
        "name": m.get("name"),
        "ticker": m.get("ticker"),
        "exch_code": m.get("exchCode"),
        "security_type": m.get("securityType"),
        "security_type2": m.get("securityType2"),
        "market_sector": m.get("marketSector"),
        "security_description": m.get("securityDescription"),
    }


def _call_openfigi(jobs: List[dict]) -> List[dict]:
    """POST a batch (<= current cap) of raw OpenFIGI job dicts. Returns the
    raw per-job response list (each item is {"data": [...]} or {"error": str})."""
    headers = {"Content-Type": "application/json"}
    key = _api_key()
    if key:
        headers["X-OPENFIGI-APIKEY"] = key
    try:
        resp = requests.post(OPENFIGI_BASE, json=jobs, headers=headers, timeout=_TIMEOUT)
    except requests.RequestException as exc:
        raise OpenFigiUpstreamError(503, f"OpenFIGI API unreachable: {exc}") from exc
    if resp.status_code == 429:
        raise OpenFigiUpstreamError(429, "OpenFIGI rate limit exceeded (unkeyed cap: 25 req/60s) — retry shortly or set OPENFIGI_API_KEY.")
    if resp.status_code == 413:
        raise OpenFigiUpstreamError(413, resp.text or "OpenFIGI batch too large.")
    if not resp.ok:
        raise OpenFigiUpstreamError(502, f"OpenFIGI API returned HTTP {resp.status_code}: {resp.text[:300]}")
    return resp.json()


def _map_jobs(jobs: List[MappingJob]) -> List[dict]:
    """Map a list of MappingJob -> per-job result dict, using the TTL cache
    and batching only the cache misses to the real API (chunked at the
    current batch cap)."""
    for j in jobs:
        if j.id_type not in ALLOWED_ID_TYPES:
            raise HTTPException(
                status_code=422,
                detail=f"Unsupported id_type '{j.id_type}'. Verified-live values: {sorted(ALLOWED_ID_TYPES)}.",
            )

    results: List[Optional[dict]] = [None] * len(jobs)
    miss_indices: List[int] = []
    for i, j in enumerate(jobs):
        cached = _cache_get(_cache_key(j))
        if cached is not None:
            results[i] = {**cached, "cache": "hit"}
        else:
            miss_indices.append(i)

    cap = _batch_cap()
    for start in range(0, len(miss_indices), cap):
        chunk_idx = miss_indices[start:start + cap]
        raw_jobs = []
        for i in chunk_idx:
            j = jobs[i]
            job_dict: Dict[str, Any] = {"idType": j.id_type, "idValue": j.id_value}
            if j.exch_code:
                job_dict["exchCode"] = j.exch_code
            raw_jobs.append(job_dict)
        try:
            raw_results = _call_openfigi(raw_jobs)
        except OpenFigiUpstreamError as exc:
            raise HTTPException(status_code=exc.status, detail=exc.detail)
        for pos, i in enumerate(chunk_idx):
            raw = raw_results[pos] if pos < len(raw_results) else {"error": "No response from upstream."}
            j = jobs[i]
            if "error" in raw:
                entry = {
                    "id_type": j.id_type, "id_value": j.id_value,
                    "matches": [], "error": raw["error"],
                }
            else:
                entry = {
                    "id_type": j.id_type, "id_value": j.id_value,
                    "matches": [_slim_match(m) for m in raw.get("data", [])], "error": None,
                }
            _cache_put(_cache_key(j), entry)
            results[i] = {**entry, "cache": "miss"}

    return [r for r in results if r is not None]


@router.get("/status")
def status() -> dict:
    """Report whether an OpenFIGI key is configured (drives the Live/Demo badge)."""
    has_key = bool(_api_key())
    return {
        "source": "OpenFIGI api.openfigi.com/v3/mapping (free; keyless at low rate limit)",
        "mode": "live-keyed" if has_key else "live-unkeyed",
        "api_key_configured": has_key,
        "api_key_env": OPENFIGI_API_KEY_ENV,
        "batch_cap": _batch_cap(),
        "unkeyed_rate_limit_observed": "25 requests / 60s (ratelimit-policy header, observed live 2026-07-05)",
        "note": ("Keyed batch cap (100) and higher rate limit per OpenFIGI docs — not independently "
                 "verified in this build (no key available)." if has_key else
                 "No OPENFIGI_API_KEY set — calls still hit the real API (no demo/seed fallback exists "
                 "for this endpoint), capped at 10 mapping jobs/request and ~25 requests/60s. "
                 "Get a free key at openfigi.com/api to raise both."),
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/map")
def map_identifiers(jobs: List[MappingJob] = Body(..., min_length=1, max_length=200)) -> dict:
    """
    Map a batch of instrument identifiers (ISIN / CUSIP / ticker) to FIGI +
    security metadata via the real OpenFIGI API. Batches larger than the
    current cap (10 unkeyed, 100 keyed-documented) are chunked into multiple
    upstream calls transparently.
    """
    results = _map_jobs(jobs)
    return {
        "mode": "live-keyed" if _api_key() else "live-unkeyed",
        "count": len(results),
        "results": results,
        "source": "OpenFIGI api.openfigi.com/v3/mapping",
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/isin-to-issuer/{isin}")
def isin_to_issuer(isin: str, db: Session = Depends(get_db)) -> dict:
    """
    Instrument -> issuer identification chain: FIGI (instrument-level,
    OpenFIGI) chained into LEI (entity-level, GLEIF) for the same ISIN.

    Step 1 — OpenFIGI /map for the ISIN -> FIGI + security metadata
             (exchange, ticker, security type).
    Step 2 — GLEIF /lei-records?filter[isin] (via the existing
             GET /api/v1/gleif/resolve-by-isin/{isin} endpoint in
             gleif_graph.py, called directly as a function — not modified
             here) -> issuer LEI entity, if GLEIF has a record linking this
             ISIN to an LEI.

    Either half can independently succeed or fail: a security can have a
    FIGI with no LEI-linked issuer (GLEIF's ISIN mapping table is far from
    complete), or vice versa. Both outcomes are reported rather than
    collapsing to a single error.
    """
    isin = isin.strip().upper()
    if len(isin) != 12 or not isin.isalnum():
        raise HTTPException(status_code=422, detail="ISIN must be a 12-character alphanumeric code")

    # --- Step 1: FIGI / security metadata (this module's own /map logic) ---
    figi_result = _map_jobs([MappingJob(id_type="ID_ISIN", id_value=isin)])[0]

    # --- Step 2: LEI / issuer entity, chained via the existing GLEIF route ---
    issuer_entity: Optional[dict] = None
    issuer_error: Optional[str] = None
    try:
        from api.v1.routes.gleif_graph import resolve_by_isin as _gleif_resolve_by_isin
        gleif_resp = _gleif_resolve_by_isin(isin, db)
        issuer_entity = gleif_resp.get("entity")
    except HTTPException as exc:
        issuer_error = exc.detail if exc.status_code == 404 else f"GLEIF lookup failed ({exc.status_code}): {exc.detail}"
    except ImportError as exc:  # pragma: no cover — gleif_graph.py always present in this repo
        issuer_error = f"GLEIF resolver unavailable: {exc}"

    return {
        "isin": isin,
        "instrument": {
            "figi_matches": figi_result["matches"],
            "figi_error": figi_result["error"],
            "source": "OpenFIGI api.openfigi.com/v3/mapping",
        },
        "issuer": {
            "entity": issuer_entity,
            "resolved": issuer_entity is not None,
            "error": issuer_error,
            "source": "GLEIF api.gleif.org/api/v1 filter[isin] (via /api/v1/gleif/resolve-by-isin)",
        },
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
    }
