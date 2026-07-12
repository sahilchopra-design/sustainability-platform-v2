"""
Counterparty Ownership Graph — thin proxy over the GLEIF LEI API
================================================================
Prefix: /api/v1/gleif
Tags:   GLEIF Ownership Graph

Upstream: https://api.gleif.org/api/v1 — free, keyless, CC0 1.0 (GLEIF Golden Copy).
All endpoints below were verified live on 2026-07-04:

  GET /lei-records?filter[fulltext]=<q>                  -> fuzzy search
  GET /lei-records/{lei}                                  -> single record
  GET /lei-records/{lei}/direct-parent                    -> 200 record | 404 if none reported
  GET /lei-records/{lei}/ultimate-parent                  -> 200 record | 404 if none reported
  GET /lei-records/{lei}/direct-children?page[size]=N     -> paged children (meta.pagination.total)
  GET /lei-records/{lei}/direct-parent-reporting-exception    -> reason when parent not reported
  GET /lei-records/{lei}/ultimate-parent-reporting-exception  -> reason when parent not reported

This module is a thin proxy with an in-process TTL cache (no key, no persistence);
it performs no computation on GLEIF data beyond field slimming and a bounded
direct-parent chain walk. PCAF attribution rollup math lives in the frontend
(user-entered exposures), documented there.
"""

from __future__ import annotations

import threading
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import requests
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from db.base import get_db

router = APIRouter(prefix="/api/v1/gleif", tags=["GLEIF Ownership Graph"])

GLEIF_BASE = "https://api.gleif.org/api/v1"
_HEADERS = {"Accept": "application/vnd.api+json"}
_TIMEOUT = 25          # seconds per upstream call
_CACHE_TTL = 6 * 3600  # 6h — LEI relationship data updates daily (golden copy)
_CACHE_MAX = 4096      # entries; cache is reset when full (simple + bounded)

_cache: Dict[Tuple, Tuple[float, Any]] = {}
_cache_lock = threading.Lock()


class GleifUpstreamError(Exception):
    def __init__(self, status: int, detail: str):
        self.status = status
        self.detail = detail


def _cached_get(path: str, params: Optional[Dict[str, Any]] = None) -> Optional[dict]:
    """GET against GLEIF with TTL cache. Returns parsed JSON, or None on upstream 404
    (404 is a meaningful answer for relationship endpoints: 'no parent reported')."""
    key = (path, tuple(sorted((params or {}).items())))
    now = time.time()
    with _cache_lock:
        hit = _cache.get(key)
        if hit and hit[0] > now:
            return hit[1]
    try:
        resp = requests.get(f"{GLEIF_BASE}{path}", params=params, headers=_HEADERS, timeout=_TIMEOUT)
    except requests.RequestException as exc:
        raise GleifUpstreamError(503, f"GLEIF API unreachable: {exc}") from exc
    if resp.status_code == 404:
        data: Optional[dict] = None
    elif resp.ok:
        data = resp.json()
    else:
        raise GleifUpstreamError(502, f"GLEIF API returned HTTP {resp.status_code}")
    with _cache_lock:
        if len(_cache) >= _CACHE_MAX:
            _cache.clear()
        _cache[key] = (now + _CACHE_TTL, data)
    return data


def _slim(resource: dict) -> dict:
    """Reduce a GLEIF JSON:API lei-record resource to the fields the UI needs."""
    attrs = resource.get("attributes", {})
    entity = attrs.get("entity", {}) or {}
    legal_addr = entity.get("legalAddress") or {}
    hq_addr = entity.get("headquartersAddress") or {}
    registration = attrs.get("registration", {}) or {}
    return {
        "lei": attrs.get("lei"),
        "name": ((entity.get("legalName") or {}).get("name")),
        "jurisdiction": entity.get("jurisdiction"),
        "entity_status": entity.get("status"),                 # ACTIVE / INACTIVE
        "entity_category": entity.get("category"),             # GENERAL / FUND / BRANCH ...
        "legal_form_id": ((entity.get("legalForm") or {}).get("id")),
        "legal_address": {
            "city": legal_addr.get("city"),
            "country": legal_addr.get("country"),
        },
        "headquarters_country": hq_addr.get("country"),
        "registration_status": registration.get("status"),     # ISSUED / LAPSED / RETIRED ...
        "next_renewal_date": registration.get("nextRenewalDate"),
        "managing_lou": registration.get("managingLou"),
    }


def _exception_of(lei: str, which: str) -> Optional[dict]:
    """Fetch the parent reporting-exception (why no parent is reported). 404 -> None."""
    data = _cached_get(f"/lei-records/{lei}/{which}-parent-reporting-exception")
    if not data or not data.get("data"):
        return None
    attrs = data["data"].get("attributes", {})
    return {"category": attrs.get("category"), "reason": attrs.get("reason")}


@router.get("/ping")
def ping() -> dict:
    """Cheap upstream health check (cached). Used by the frontend Live/Demo badge."""
    try:
        data = _cached_get("/lei-records", {"page[size]": 1})
        ok = bool(data and data.get("data") is not None)
    except GleifUpstreamError:
        ok = False
    return {
        "source": "GLEIF api.gleif.org/api/v1 (free, keyless, CC0 1.0)",
        "reachable": ok,
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/search")
def search(
    q: str = Query(..., min_length=2, max_length=120, description="Entity name (fuzzy fulltext)"),
    limit: int = Query(15, ge=1, le=50),
) -> dict:
    """Fuzzy-search LEI records via GLEIF filter[fulltext]."""
    try:
        data = _cached_get("/lei-records", {"filter[fulltext]": q, "page[size]": limit})
    except GleifUpstreamError as exc:
        raise HTTPException(status_code=exc.status, detail=exc.detail)
    records = (data or {}).get("data", []) or []
    total = ((data or {}).get("meta", {}).get("pagination", {}) or {}).get("total")
    return {
        "query": q,
        "total": total,
        "results": [_slim(r) for r in records],
        "source": "GLEIF api.gleif.org/api/v1 (CC0 1.0)",
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/entity/{lei}")
def entity(
    lei: str,
    children_limit: int = Query(50, ge=1, le=200),
) -> dict:
    """LEI record + direct/ultimate parent + bounded direct-parent chain walk +
    first page of direct children (+ total count) + reporting exceptions."""
    lei = lei.strip().upper()
    if len(lei) != 20 or not lei.isalnum():
        raise HTTPException(status_code=422, detail="LEI must be a 20-character alphanumeric code")

    try:
        rec = _cached_get(f"/lei-records/{lei}")
        if not rec or not rec.get("data"):
            raise HTTPException(status_code=404, detail=f"LEI {lei} not found in GLEIF")

        result: Dict[str, Any] = {"entity": _slim(rec["data"])}

        # Direct + ultimate parent (404 upstream => not reported)
        dp = _cached_get(f"/lei-records/{lei}/direct-parent")
        up = _cached_get(f"/lei-records/{lei}/ultimate-parent")
        result["direct_parent"] = _slim(dp["data"]) if dp and dp.get("data") else None
        result["ultimate_parent"] = _slim(up["data"]) if up and up.get("data") else None

        # If no parent reported, surface the RR-CDF reporting-exception reason
        result["direct_parent_exception"] = None if result["direct_parent"] else _exception_of(lei, "direct")
        result["ultimate_parent_exception"] = None if result["ultimate_parent"] else _exception_of(lei, "ultimate")

        # Bounded parent-chain walk: entity -> direct parent -> its direct parent ...
        # (max 8 hops; cycle-guarded). Ordered bottom-up (nearest parent first).
        chain: List[dict] = []
        seen = {lei}
        cursor = lei
        for _ in range(8):
            hop = _cached_get(f"/lei-records/{cursor}/direct-parent")
            if not hop or not hop.get("data"):
                break
            parent = _slim(hop["data"])
            if not parent["lei"] or parent["lei"] in seen:
                break
            chain.append(parent)
            seen.add(parent["lei"])
            cursor = parent["lei"]
        result["parent_chain"] = chain

        # First page of direct children + authoritative total
        ch = _cached_get(f"/lei-records/{lei}/direct-children", {"page[size]": children_limit})
        ch_items = (ch or {}).get("data", []) or []
        ch_total = ((ch or {}).get("meta", {}).get("pagination", {}) or {}).get("total", 0)
        result["direct_children"] = {
            "total": ch_total,
            "returned": len(ch_items),
            "items": [_slim(c) for c in ch_items],
        }

        result["source"] = "GLEIF api.gleif.org/api/v1 (free, keyless, CC0 1.0) — RR-CDF relationship records"
        result["retrieved_at"] = datetime.now(timezone.utc).isoformat()
        return result

    except GleifUpstreamError as exc:
        raise HTTPException(status_code=exc.status, detail=exc.detail)


# ═══════════════════════════════════════════════════════════════════════════
# Just-in-time pre-population — live typeahead + single-record upsert into
# the local entity_lei golden-record cache (see services/gleif_upsert.py).
# These endpoints exist because entity_resolution_service.py's cross-module
# resolver ONLY ever queries the local entity_lei cache, which is populated
# solely by the capped (10,000 records/run), blind, country-filtered weekly
# ingester (ingestion/gleif_ingester.py) — a real entity can be missing
# purely because the crawl never happened to reach it. A single live GLEIF
# lookup here immediately feeds that cache so the gap self-heals.
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/typeahead")
def typeahead(
    q: str = Query(..., min_length=2, max_length=120, description="Partial entity name"),
    limit: int = Query(15, ge=1, le=50),
    db: Session = Depends(get_db),
) -> dict:
    """
    Live typeahead-as-you-type via GLEIF /fuzzycompletions?field=entity.legalName.

    Chosen over /autocompletions after live A/B testing both (2026-07-05,
    query="Siemens"): /fuzzycompletions links every single completion to a
    real lei-records id, while /autocompletions frequently returns bare
    free-text completions ("SIEMENS AS", "Siemens TOO") with NO lei-records
    relationship at all -- unusable for a typeahead meant to pre-populate an
    LEI, since there'd be nothing to link to for a chunk of the results.

    entity_status_hint is populated from the LOCAL entity_lei cache when the
    completion's LEI happens to already be cached (cheap: one batched query
    for the whole result page); GLEIF's fuzzycompletions response itself
    carries no status field, so it's null otherwise -- call /entity/{lei}
    for authoritative live status.
    """
    try:
        data = _cached_get(
            "/fuzzycompletions",
            {"field": "entity.legalName", "q": q, "page[size]": limit},
        )
    except GleifUpstreamError as exc:
        raise HTTPException(status_code=exc.status, detail=exc.detail)

    completions = (data or {}).get("data", []) or []
    parsed = []
    for item in completions:
        rel = (item.get("relationships") or {}).get("lei-records") or {}
        lei = (rel.get("data") or {}).get("id")
        parsed.append({"value": (item.get("attributes") or {}).get("value"), "lei": lei})

    leis = [p["lei"] for p in parsed if p["lei"]]
    status_by_lei: Dict[str, Optional[str]] = {}
    if leis:
        rows = db.execute(
            text("SELECT lei, status FROM entity_lei WHERE lei = ANY(:leis)"),
            {"leis": leis},
        ).fetchall()
        status_by_lei = {r[0]: r[1] for r in rows}

    return {
        "query": q,
        "results": [
            {**p, "entity_status_hint": status_by_lei.get(p["lei"])}
            for p in parsed
        ],
        "source": "GLEIF api.gleif.org/api/v1 /fuzzycompletions (CC0 1.0)",
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/resolve-by-isin/{isin}")
def resolve_by_isin(
    isin: str,
    db: Session = Depends(get_db),
) -> dict:
    """
    Live GLEIF lookup by ISIN (filter[isin]) + immediate upsert of the match
    into the local entity_lei golden table (JIT pre-population — not just a
    passthrough). 404 if GLEIF has no LEI record for this ISIN.
    """
    isin = isin.strip().upper()
    if len(isin) != 12 or not isin.isalnum():
        raise HTTPException(status_code=422, detail="ISIN must be a 12-character alphanumeric code")

    try:
        data = _cached_get("/lei-records", {"filter[isin]": isin, "page[size]": 1})
    except GleifUpstreamError as exc:
        raise HTTPException(status_code=exc.status, detail=exc.detail)

    records = (data or {}).get("data", []) or []
    if not records:
        raise HTTPException(status_code=404, detail=f"No GLEIF LEI record found for ISIN {isin}")

    from services.gleif_upsert import upsert_lei_record

    raw = records[0]
    upserted_row = upsert_lei_record(db, raw)

    return {
        "isin": isin,
        "entity": _slim(raw),
        "upserted_into_entity_lei": bool(upserted_row),
        "source": "GLEIF api.gleif.org/api/v1 filter[isin] (CC0 1.0)",
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/resolve-by-bic/{bic}")
def resolve_by_bic(
    bic: str,
    db: Session = Depends(get_db),
) -> dict:
    """
    Live GLEIF lookup by BIC (filter[bic]) + immediate upsert into entity_lei.
    404 if GLEIF has no LEI record for this BIC.

    NOTE (verified live 2026-07-05): GLEIF requires the FULL BIC including
    branch/XXX suffix (e.g. "DEUTDEFFXXX") -- the bare 8-char bank BIC
    ("DEUTDEFF") returns zero results even for a real, well-known bank.
    """
    bic = bic.strip().upper()
    if not (8 <= len(bic) <= 11) or not bic.isalnum():
        raise HTTPException(status_code=422, detail="BIC must be 8-11 alphanumeric characters")

    try:
        data = _cached_get("/lei-records", {"filter[bic]": bic, "page[size]": 1})
    except GleifUpstreamError as exc:
        raise HTTPException(status_code=exc.status, detail=exc.detail)

    records = (data or {}).get("data", []) or []
    if not records:
        raise HTTPException(status_code=404, detail=f"No GLEIF LEI record found for BIC {bic}")

    from services.gleif_upsert import upsert_lei_record

    raw = records[0]
    upserted_row = upsert_lei_record(db, raw)

    return {
        "bic": bic,
        "entity": _slim(raw),
        "upserted_into_entity_lei": bool(upserted_row),
        "source": "GLEIF api.gleif.org/api/v1 filter[bic] (CC0 1.0)",
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
    }
