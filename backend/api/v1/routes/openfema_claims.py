"""
API Routes: OpenFEMA NFIP Redacted Claims — Empirical Flood Loss Calibrator
============================================================================
GET /api/v1/openfema/claims-summary?state=XX  — Server-side aggregation of REAL
    NFIP flood insurance claims from the free, keyless OpenFEMA API:
    claim counts, total/mean paid loss, severity percentiles (P10-P99),
    loss histogram, by-year series, top flood events.
GET /api/v1/openfema/states                   — Valid state/territory codes.

Upstream dataset (verified live 2026-07-04):
    https://www.fema.gov/api/open/v2/FimaNfipClaims
    FEMA NFIP Redacted Claims v2 — ~2.72M records, refreshed monthly
    (lastDataSetRefresh 2026-06-01). Public domain (OpenFEMA Terms &
    Conditions); no API key required. This product uses the FEMA OpenFEMA
    API, but is not endorsed by FEMA.

Field names verified against live records:
    state, yearOfLoss, dateOfLoss, floodEvent,
    amountPaidOnBuildingClaim, amountPaidOnContentsClaim,
    amountPaidOnIncreasedCostOfComplianceClaim

Politeness: results are cached in-process (simple TTL dict, 6h) and each
summary fetches at most `max_records` rows (default 20,000 = 2 pages of the
API's 10,000-row page cap), most-recent loss years first. When a state has
more matching claims than the cap (e.g. FL), the response flags
`sample_truncated: true` and reports which loss years the sample covers.
"""
from __future__ import annotations

import threading
import time
from typing import Optional

import requests
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/v1/openfema", tags=["OpenFEMA NFIP Claims"])

OPENFEMA_BASE = "https://www.fema.gov/api/open/v2/FimaNfipClaims"
SELECT_FIELDS = (
    "yearOfLoss,amountPaidOnBuildingClaim,amountPaidOnContentsClaim,"
    "amountPaidOnIncreasedCostOfComplianceClaim,floodEvent"
)
PAGE_SIZE = 10_000          # OpenFEMA v2 max $top per request
MAX_RECORDS_HARD_CAP = 50_000
REQUEST_TIMEOUT_S = 90

# US states + DC + NFIP-participating territories
VALID_STATES = {
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI",
    "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN",
    "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH",
    "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA",
    "WV", "WI", "WY", "PR", "VI", "GU", "AS", "MP",
}

# Fixed severity bins for the empirical loss histogram (USD, per paid claim)
HISTOGRAM_BINS = [
    (0, 5_000, "$0–5k"),
    (5_000, 10_000, "$5–10k"),
    (10_000, 25_000, "$10–25k"),
    (25_000, 50_000, "$25–50k"),
    (50_000, 100_000, "$50–100k"),
    (100_000, 250_000, "$100–250k"),
    (250_000, 500_000, "$250–500k"),
    (500_000, 1_000_000, "$500k–1M"),
    (1_000_000, float("inf"), ">$1M"),
]

# ---------------------------------------------------------------------------
# In-process TTL cache (be polite to the free API)
# ---------------------------------------------------------------------------
_CACHE_TTL_S = 6 * 3600
_CACHE_MAX_ENTRIES = 128
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
            # Drop the oldest-expiring entry
            oldest = min(_cache, key=lambda k: _cache[k][0])
            _cache.pop(oldest, None)
        _cache[key] = (time.time() + _CACHE_TTL_S, value)


# ---------------------------------------------------------------------------
# Upstream fetch + aggregation
# ---------------------------------------------------------------------------

def _fetch_claims(state: str, start_year: int, end_year: int, max_records: int):
    """Page through OpenFEMA NFIP claims for a state/year window.

    Returns (records, total_matching_count). Most recent loss years first so a
    truncated sample is biased toward current exposure, not the 1970s.
    """
    filt = f"state eq '{state}' and yearOfLoss ge {start_year} and yearOfLoss le {end_year}"
    records: list[dict] = []
    total_count: Optional[int] = None
    skip = 0
    while len(records) < max_records:
        top = min(PAGE_SIZE, max_records - len(records))
        params = {
            "$filter": filt,
            "$select": SELECT_FIELDS,
            "$top": top,
            "$skip": skip,
            "$orderby": "yearOfLoss desc",
            "$format": "json",
        }
        if total_count is None:
            params["$inlinecount"] = "allpages"
        resp = requests.get(OPENFEMA_BASE, params=params, timeout=REQUEST_TIMEOUT_S)
        resp.raise_for_status()
        payload = resp.json()
        if total_count is None:
            total_count = payload.get("metadata", {}).get("count")
        batch = payload.get("FimaNfipClaims", [])
        records.extend(batch)
        skip += len(batch)
        if len(batch) < top or (total_count is not None and skip >= total_count):
            break
    return records, (total_count if total_count is not None else len(records))


def _percentile(sorted_vals: list[float], p: float) -> float:
    """Linear-interpolated percentile on a pre-sorted list."""
    if not sorted_vals:
        return 0.0
    k = (len(sorted_vals) - 1) * p / 100.0
    f = int(k)
    c = min(f + 1, len(sorted_vals) - 1)
    return sorted_vals[f] + (sorted_vals[c] - sorted_vals[f]) * (k - f)


def _summarize(records: list[dict]) -> dict:
    """Aggregate raw claim rows into severity stats / histogram / series."""
    paid: list[float] = []
    by_year: dict[int, dict] = {}
    by_event: dict[str, dict] = {}
    for rec in records:
        amt = (
            (rec.get("amountPaidOnBuildingClaim") or 0)
            + (rec.get("amountPaidOnContentsClaim") or 0)
            + (rec.get("amountPaidOnIncreasedCostOfComplianceClaim") or 0)
        )
        year = rec.get("yearOfLoss")
        if year is not None:
            yr = by_year.setdefault(int(year), {"year": int(year), "claims": 0, "paid_claims": 0, "total_paid_usd": 0.0})
            yr["claims"] += 1
        if amt > 0:
            paid.append(float(amt))
            if year is not None:
                yr["paid_claims"] += 1
                yr["total_paid_usd"] += float(amt)
            event = (rec.get("floodEvent") or "Unnamed / non-event flooding").strip() or "Unnamed / non-event flooding"
            ev = by_event.setdefault(event, {"event": event, "paid_claims": 0, "total_paid_usd": 0.0})
            ev["paid_claims"] += 1
            ev["total_paid_usd"] += float(amt)

    paid.sort()
    n_paid = len(paid)
    total_paid = sum(paid)

    histogram = []
    for lo, hi, label in HISTOGRAM_BINS:
        count = sum(1 for v in paid if lo <= v < hi)
        histogram.append({
            "bin": label,
            "min_usd": lo,
            "max_usd": None if hi == float("inf") else hi,
            "paid_claims": count,
            "share_pct": round(count / n_paid * 100, 2) if n_paid else 0.0,
        })

    years = sorted(by_year.values(), key=lambda r: r["year"])
    for yr in years:
        yr["total_paid_usd"] = round(yr["total_paid_usd"], 2)
        yr["mean_paid_usd"] = round(yr["total_paid_usd"] / yr["paid_claims"], 2) if yr["paid_claims"] else 0.0

    top_events = sorted(by_event.values(), key=lambda e: -e["total_paid_usd"])[:10]
    for ev in top_events:
        ev["total_paid_usd"] = round(ev["total_paid_usd"], 2)
        ev["mean_paid_usd"] = round(ev["total_paid_usd"] / ev["paid_claims"], 2) if ev["paid_claims"] else 0.0

    return {
        "paid_claims": n_paid,
        "zero_paid_or_closed_without_payment": len(records) - n_paid,
        "total_paid_usd": round(total_paid, 2),
        "mean_paid_usd": round(total_paid / n_paid, 2) if n_paid else 0.0,
        "min_paid_usd": round(paid[0], 2) if paid else 0.0,
        "max_paid_usd": round(paid[-1], 2) if paid else 0.0,
        "percentiles_usd": {
            f"P{p}": round(_percentile(paid, p), 2) for p in (10, 25, 50, 75, 90, 95, 99)
        },
        "histogram": histogram,
        "by_year": years,
        "top_events": top_events,
    }


# ---------------------------------------------------------------------------
# GET /claims-summary
# ---------------------------------------------------------------------------

@router.get(
    "/claims-summary",
    summary="Empirical NFIP flood claims summary for a US state (real OpenFEMA data)",
    description=(
        "Fetches REAL NFIP Redacted Claims from the free, keyless OpenFEMA API "
        "(https://www.fema.gov/api/open/v2/FimaNfipClaims) and aggregates them "
        "server-side: paid-claim severity percentiles (P10–P99), loss histogram, "
        "by-year claim counts and paid totals, and top flood events by paid loss. "
        "Paid loss per claim = building + contents + ICC payments. "
        "Responses are cached in-process for 6h. Large states are sampled to "
        "max_records (most recent loss years first) and flagged sample_truncated."
    ),
)
def claims_summary(
    state: str = Query(..., min_length=2, max_length=2, description="US state/territory 2-letter code, e.g. FL"),
    start_year: int = Query(1990, ge=1970, le=2030, description="First yearOfLoss included"),
    end_year: int = Query(2026, ge=1970, le=2030, description="Last yearOfLoss included"),
    max_records: int = Query(20_000, ge=1_000, le=MAX_RECORDS_HARD_CAP, description="Politeness cap on rows fetched upstream"),
) -> dict:
    state = state.upper()
    if state not in VALID_STATES:
        raise HTTPException(status_code=422, detail=f"Unknown state code '{state}'. Valid: sorted 2-letter US state/territory codes.")
    if start_year > end_year:
        raise HTTPException(status_code=422, detail="start_year must be <= end_year")

    cache_key = (state, start_year, end_year, max_records)
    cached = _cache_get(cache_key)
    if cached is not None:
        return {**cached, "cache": "hit"}

    try:
        records, total_count = _fetch_claims(state, start_year, end_year, max_records)
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"OpenFEMA API unreachable: {exc}") from exc

    summary = _summarize(records)
    sample_years = [y["year"] for y in summary["by_year"]]
    result = {
        "state": state,
        "start_year": start_year,
        "end_year": end_year,
        "total_claims_matching": total_count,
        "fetched_records": len(records),
        "sample_truncated": len(records) < (total_count or 0),
        "sample_years_covered": {
            "from": min(sample_years) if sample_years else None,
            "to": max(sample_years) if sample_years else None,
        },
        **summary,
        "source": {
            "dataset": "FEMA NFIP Redacted Claims v2 (FimaNfipClaims)",
            "endpoint": OPENFEMA_BASE,
            "license": "Public domain — OpenFEMA Terms & Conditions; keyless",
            "disclaimer": "This product uses the FEMA OpenFEMA API, but is not endorsed by FEMA.",
            "note": (
                "Severity percentiles are per-claim paid-loss percentiles "
                "(building + contents + ICC), not a portfolio EP curve."
            ),
        },
        "cache": "miss",
    }
    _cache_put(cache_key, result)
    return result


# ---------------------------------------------------------------------------
# GET /states
# ---------------------------------------------------------------------------

@router.get(
    "/states",
    summary="Valid state/territory codes for /claims-summary",
)
def valid_states() -> dict:
    return {"count": len(VALID_STATES), "states": sorted(VALID_STATES)}
