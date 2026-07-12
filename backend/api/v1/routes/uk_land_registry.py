"""
HM Land Registry Price Paid Data — thin proxy to the real linked-data API
==========================================================================
Prefix: /api/v1/uk-land-registry
Tags:   UK Land Registry Price Paid

Upstream (verified LIVE/keyless 2026-07-05):
    https://landregistry.data.gov.uk/data/ppi/transaction-record.json
    HM Land Registry Price Paid Data — every residential property sale in
    England and Wales since 1995 (full completed-transaction register),
    served as a SPARQL-backed linked-data API with a REST-ish ".json" view.
    Open Government Licence v3.0 — explicitly permitted for commercial use.
    No API key, no signup.

Response shape observed live (2026-07-05) — NOT the flat JSON you'd guess
from the field names; it is a linked-data-api envelope:

    {
      "format": "linked-data-api", "version": "0.2",
      "result": {
        "items": [
          {
            "pricePaid": 35000,
            "transactionDate": "Fri, 17 May 1996",   # RFC-ish string, NOT ISO
            "transactionId": "702EF0D1-...",
            "newBuild": false,
            "estateType": {"prefLabel": [{"_value": "Freehold", ...}], ...},
            "propertyType": {"prefLabel": [{"_value": "terraced", ...}], ...},
            "propertyAddress": {
              "postcode": "WA2 8SN", "paon": "ROSEMOUNT COTTAGE", "saon": "3",
              "street": "GOLBORNE ROAD", "locality": "WINWICK",
              "town": "WARRINGTON", "district": "WARRINGTON", "county": "WARRINGTON"
            },
          }, ...
        ],
        "page": 0, "itemsPerPage": <n>, "startIndex": 1,
      }
    }

Query params confirmed live against the real endpoint (2026-07-05):
    propertyAddress.postcode=<FULL POSTCODE, URL-encoded>   -- EXACT match only;
        outcodes / partial postcodes return zero results (tested "NR3" -> 0 items,
        "NR3 3XP" -> 10 items). Callers must pass a complete postcode.
    propertyAddress.town=<TOWN>                              -- works, case-sensitive
        upstream value (we upper-case it defensively).
    propertyAddress.district=<DISTRICT>                       -- works (untested here
        but same shape as .town per the API's RDF property list).
    min-transactionDate=YYYY-MM-DD / max-transactionDate=YYYY-MM-DD -- both work,
        confirmed against a postcode+date-range combination.
    _page=<n>, _pageSize=<n>                                  -- pagination.

Rate limit / pagination behavior — OBSERVED LIVE (2026-07-05), not documented
anywhere upstream, so this is empirical:
    _pageSize is silently CAPPED AT 200 items per page regardless of the value
    requested. Measured: _pageSize=50/100/150/200 returned exactly that many
    items; _pageSize=250/300/1000/5000 all returned only 200. There is no
    published rate-limit header or 429 behavior observed in ad hoc testing
    (dozens of sequential requests over a few minutes returned 200 every time),
    but the endpoint is a public SPARQL-backed service with no documented SLA,
    so this proxy is deliberately polite: HARD_PAGE_CAP=200 (matches the
    observed ceiling), MAX_TRANSACTIONS hard cap per request, a short in-process
    TTL cache, and a real requests timeout.
"""
from __future__ import annotations

import threading
import time
from datetime import date
from typing import Optional

import requests
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/v1/uk-land-registry", tags=["UK Land Registry Price Paid"])

LR_BASE = "https://landregistry.data.gov.uk/data/ppi/transaction-record.json"
HARD_PAGE_CAP = 200          # observed live ceiling — the API ignores _pageSize above this
MAX_TRANSACTIONS = 1_000     # politeness cap: at most 5 pages per request
REQUEST_TIMEOUT_S = 30

# ---------------------------------------------------------------------------
# In-process TTL cache (be polite to the free public endpoint)
# ---------------------------------------------------------------------------
_CACHE_TTL_S = 6 * 3600
_CACHE_MAX_ENTRIES = 256
_cache: dict[tuple, tuple[float, dict]] = {}
_cache_lock = threading.Lock()


def _cache_get(key: tuple) -> Optional[dict]:
    with _cache_lock:
        hit = _cache.get(key)
        if hit and hit[0] > time.time():
            return hit[1]
        if hit:
            _cache.pop(key, None)
    return None


def _cache_put(key: tuple, value: dict) -> None:
    with _cache_lock:
        if len(_cache) >= _CACHE_MAX_ENTRIES:
            oldest = min(_cache, key=lambda k: _cache[k][0])
            _cache.pop(oldest, None)
        _cache[key] = (time.time() + _CACHE_TTL_S, value)


def _label(node: Optional[dict]) -> Optional[str]:
    """Pull the human label out of a linked-data-api {"prefLabel": [{"_value": ...}]} node."""
    if not node:
        return None
    for key in ("prefLabel", "label"):
        vals = node.get(key)
        if vals and isinstance(vals, list) and vals[0].get("_value"):
            return vals[0]["_value"]
    return None


def _normalize(item: dict) -> dict:
    addr = item.get("propertyAddress") or {}
    return {
        "transaction_id": item.get("transactionId"),
        "price_paid_gbp": item.get("pricePaid"),
        "transaction_date": item.get("transactionDate"),   # upstream's own string form, e.g. "Fri, 17 May 1996"
        "new_build": item.get("newBuild"),
        "estate_type": _label(item.get("estateType")),
        "property_type": _label(item.get("propertyType")),
        "paon": addr.get("paon"),
        "saon": addr.get("saon"),
        "street": addr.get("street"),
        "locality": addr.get("locality"),
        "town": addr.get("town"),
        "district": addr.get("district"),
        "county": addr.get("county"),
        "postcode": addr.get("postcode"),
    }


def fetch_transactions(
    postcode: Optional[str] = None,
    town: Optional[str] = None,
    district: Optional[str] = None,
    min_date: Optional[str] = None,
    max_date: Optional[str] = None,
    limit: int = 200,
) -> tuple[list[dict], bool]:
    """Page through the live Land Registry linked-data API.

    Returns (normalized_records, truncated) where truncated is True if `limit`
    was reached and more records may exist upstream (no total count is
    returned by this endpoint the way OpenFEMA/openfema_claims.py does, so we
    can only report whether we stopped early, not the true total).
    """
    limit = min(limit, MAX_TRANSACTIONS)
    params_base: dict = {}
    if postcode:
        params_base["propertyAddress.postcode"] = postcode.strip().upper()
    if town:
        params_base["propertyAddress.town"] = town.strip().upper()
    if district:
        params_base["propertyAddress.district"] = district.strip().upper()
    if min_date:
        params_base["min-transactionDate"] = min_date
    if max_date:
        params_base["max-transactionDate"] = max_date

    records: list[dict] = []
    page = 0
    truncated = False
    while len(records) < limit:
        page_size = min(HARD_PAGE_CAP, limit - len(records))
        params = {**params_base, "_pageSize": page_size, "_page": page}
        resp = requests.get(LR_BASE, params=params, timeout=REQUEST_TIMEOUT_S)
        resp.raise_for_status()
        payload = resp.json()
        items = payload.get("result", {}).get("items", [])
        if not items:
            break
        records.extend(_normalize(i) for i in items)
        if len(items) < page_size:
            break
        page += 1
        if page >= (MAX_TRANSACTIONS // HARD_PAGE_CAP) + 1:
            truncated = True
            break
    if len(records) >= limit:
        truncated = True
    return records[:limit], truncated


# ---------------------------------------------------------------------------
# GET /transactions
# ---------------------------------------------------------------------------

@router.get(
    "/transactions",
    summary="Real HM Land Registry Price Paid transactions (live proxy)",
    description=(
        "Thin proxy to the real, free, keyless HM Land Registry Price Paid Data "
        "linked-data API (landregistry.data.gov.uk). Filter by an exact postcode "
        "and/or a town/district and/or a transaction-date window. At least one "
        "of postcode/town/district must be given — the upstream API has no "
        "'give me everything' mode we're willing to page through. "
        "Note: postcode matching upstream is EXACT (no outcode/partial match)."
    ),
)
def transactions(
    postcode: Optional[str] = Query(None, description="Full UK postcode, e.g. 'NR3 3XP'"),
    town: Optional[str] = Query(None, description="Town name as recorded by Land Registry, e.g. 'NORWICH'"),
    district: Optional[str] = Query(None, description="District name as recorded by Land Registry"),
    min_date: Optional[str] = Query(None, description="YYYY-MM-DD earliest transaction date (inclusive)"),
    max_date: Optional[str] = Query(None, description="YYYY-MM-DD latest transaction date (inclusive)"),
    limit: int = Query(200, ge=1, le=MAX_TRANSACTIONS, description=f"Max records to fetch (politeness cap {MAX_TRANSACTIONS})"),
) -> dict:
    if not (postcode or town or district):
        raise HTTPException(status_code=422, detail="Provide at least one of postcode, town, district.")
    for d in (min_date, max_date):
        if d:
            try:
                date.fromisoformat(d)
            except ValueError:
                raise HTTPException(status_code=422, detail=f"Invalid date '{d}', expected YYYY-MM-DD")

    cache_key = (postcode, town, district, min_date, max_date, limit)
    cached = _cache_get(cache_key)
    if cached is not None:
        return {**cached, "cache": "hit"}

    try:
        records, truncated = fetch_transactions(postcode, town, district, min_date, max_date, limit)
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"HM Land Registry API unreachable: {exc}") from exc

    result = {
        "query": {"postcode": postcode, "town": town, "district": district, "min_date": min_date, "max_date": max_date, "limit": limit},
        "count": len(records),
        "truncated": truncated,
        "transactions": records,
        "source": {
            "dataset": "HM Land Registry Price Paid Data",
            "endpoint": LR_BASE,
            "license": "Open Government Licence v3.0 — commercial use explicitly permitted",
            "coverage": "Residential property sales in England & Wales since 1995",
            "note": "Postcode filtering is exact-match only; _pageSize is capped at 200 by the upstream API regardless of requested value.",
        },
        "cache": "miss",
    }
    _cache_put(cache_key, result)
    return result
