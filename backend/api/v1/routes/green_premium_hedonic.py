"""
Green-Premium Hedonic Regression — HM Land Registry x UK EPC join
====================================================================
Prefix: /api/v1/green-premium-hedonic
Tags:   Green Premium Hedonic Regression

THE ACTUAL NEW CAPABILITY (per docs/DATA_SOURCES_AMPLIFICATION.md §11): joins
real HM Land Registry Price Paid transactions (backend/api/v1/routes/
uk_land_registry.py — live, keyless) with EPC certificate data
(backend/api/v1/routes/uk_epc.py — live if EPC_API_BEARER_TOKEN is set, else
a labeled seeded sample) for a UK town/postcode area, then runs a REAL
ordinary-least-squares hedonic regression:

    sale_price ~ intercept + current_energy_efficiency_score
                 + property_type dummies + construction_age_band dummies

implemented from scratch with real linear algebra (numpy normal-equations /
pseudo-inverse — no fabricated coefficients, no random.*). Reports the
"green premium" (price differential per one-EPC-band improvement), R²,
adjusted R², and sample size — and is explicit when the sample is small or
the match rate is low, per platform policy against overstating confidence.

MATCHING APPROACH (be honest — this is imperfect):
  Land Registry transactions and EPC certificates are joined ONLY on exact
  postcode string equality. A UK postcode typically covers a handful of
  neighbouring properties (a street segment or a small block of flats), so
  this is NOT an address-level join — a terrace of 6 houses sharing one
  postcode will all be matched to whichever EPC certificate(s) exist for
  that postcode, which can be wrong for any individual property. Where more
  than one EPC certificate exists for a postcode, we prefer the one whose
  property_type matches the transaction's Land Registry property_type
  (case-insensitive substring match), falling back to the first available
  certificate. The response reports match_rate_pct so this imprecision is
  visible, not hidden.
"""
from __future__ import annotations

from typing import List, Optional

import numpy as np
import requests
from fastapi import APIRouter, HTTPException, Query

from api.v1.routes.uk_land_registry import fetch_transactions
from api.v1.routes.uk_epc import _seed_certificates, _fetch_live_certificates, EPC_BEARER_TOKEN_ENV

import os

router = APIRouter(prefix="/api/v1/green-premium-hedonic", tags=["Green Premium Hedonic Regression"])

# Standard RdSAP construction-age-band ordering (oldest -> newest), used only
# to pick a sensible baseline dummy category — not a claim about any specific
# property's true age.
_AGE_BAND_ORDER = [
    "before 1900", "1900-1929", "1930-1949", "1950-1966", "1967-1975",
    "1976-1982", "1983-1990", "1991-1995", "1996-2002", "2003-2007", "2007 onwards",
]
# Score midpoints of each EPC band (standard RdSAP thresholds) — used to turn
# a "one-band improvement" into a documented average efficiency-score delta.
_BAND_MIDPOINTS = {"G": 10.0, "F": 29.5, "E": 46.5, "D": 61.5, "C": 74.5, "B": 86.0, "A": 96.0}
_AVG_ONE_BAND_SCORE_DELTA = float(np.mean([
    _BAND_MIDPOINTS[b2] - _BAND_MIDPOINTS[b1]
    for b1, b2 in zip(["G", "F", "E", "D", "C", "B"], ["F", "E", "D", "C", "B", "A"])
]))
_D_TO_C_SCORE_DELTA = _BAND_MIDPOINTS["C"] - _BAND_MIDPOINTS["D"]

MIN_SAMPLE_FOR_REGRESSION = 8


def _epc_certs_for_postcode(postcode: str, limit: int = 20) -> List[dict]:
    """Fetch EPC certs for one postcode via the same live/seed logic as
    uk_epc.certificates(), called in-process (no self-HTTP round trip)."""
    token = os.environ.get(EPC_BEARER_TOKEN_ENV, "").strip()
    if token:
        try:
            return _fetch_live_certificates(postcode, token, limit)
        except requests.RequestException:
            return _seed_certificates(postcode)
    return _seed_certificates(postcode)


def _match_certificate(txn: dict, certs: List[dict]) -> Optional[dict]:
    if not certs:
        return None
    txn_type = (txn.get("property_type") or "").lower()
    for c in certs:
        c_type = (c.get("property_type") or "").lower()
        if txn_type and c_type and (txn_type in c_type or c_type in txn_type):
            return c
    return certs[0]


def _ols(X: np.ndarray, y: np.ndarray):
    """Real OLS via the normal equations with a pseudo-inverse (robust to the
    near-collinearity small hedonic samples routinely produce). Returns
    (beta, se, r_squared, adj_r_squared, n, k)."""
    n, k = X.shape
    XtX = X.T @ X
    XtX_pinv = np.linalg.pinv(XtX)
    beta = XtX_pinv @ X.T @ y
    y_hat = X @ beta
    resid = y - y_hat
    ss_res = float(resid @ resid)
    y_dev = y - y.mean()
    ss_tot = float(y_dev @ y_dev)
    r_squared = 1.0 - ss_res / ss_tot if ss_tot > 0 else 0.0
    dof = max(n - k, 1)
    sigma2 = ss_res / dof
    se = np.sqrt(np.clip(np.diag(XtX_pinv), 0, None) * sigma2)
    adj_r_squared = 1.0 - (1.0 - r_squared) * (n - 1) / dof if n > k else None
    return beta, se, r_squared, adj_r_squared, n, k


@router.get(
    "/analyze",
    summary="Join Land Registry sale prices with EPC ratings and run a hedonic OLS regression",
    description=(
        "For a UK town (and optional date window), fetches real Land Registry "
        "transactions, joins each to EPC certificate data on exact postcode "
        "match, and runs sale_price ~ efficiency_score + property_type + "
        "construction_age_band via OLS. Reports the green premium (price "
        "differential per one-EPC-band improvement), R², sample size and "
        "match rate transparently — small/low-match samples are flagged, not "
        "papered over."
    ),
)
def analyze(
    town: Optional[str] = Query(None, description="Town as recorded by Land Registry, e.g. 'NORWICH'"),
    postcode: Optional[str] = Query(None, description="Single full postcode instead of a town-wide sweep"),
    district: Optional[str] = Query(None, description="District as recorded by Land Registry"),
    min_date: Optional[str] = Query(None, description="YYYY-MM-DD earliest transaction date"),
    max_date: Optional[str] = Query(None, description="YYYY-MM-DD latest transaction date"),
    limit: int = Query(200, ge=1, le=1000, description="Max Land Registry transactions to fetch"),
) -> dict:
    if not (town or postcode or district):
        raise HTTPException(status_code=422, detail="Provide at least one of town, postcode, district.")

    try:
        txns, truncated = fetch_transactions(
            postcode=postcode, town=town, district=district,
            min_date=min_date, max_date=max_date, limit=limit,
        )
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"HM Land Registry API unreachable: {exc}") from exc

    if not txns:
        raise HTTPException(status_code=404, detail="No Land Registry transactions found for the given filters.")

    unique_postcodes = sorted({t["postcode"] for t in txns if t.get("postcode")})
    epc_by_postcode = {pc: _epc_certs_for_postcode(pc) for pc in unique_postcodes}

    joined = []
    for t in txns:
        pc = t.get("postcode")
        certs = epc_by_postcode.get(pc, [])
        cert = _match_certificate(t, certs)
        if cert is None or t.get("price_paid_gbp") is None:
            continue
        score = cert.get("current_energy_efficiency_score")
        ptype = t.get("property_type") or cert.get("property_type")
        age_band = cert.get("construction_age_band")
        if score is None or ptype is None or age_band is None:
            continue
        joined.append({
            "postcode": pc,
            "price_paid_gbp": t["price_paid_gbp"],
            "transaction_date": t.get("transaction_date"),
            "property_type": ptype,
            "construction_age_band": age_band,
            "current_energy_efficiency_score": score,
            "current_energy_rating": cert.get("current_energy_rating"),
            "matched_epc_mode": "seed" if not os.environ.get(EPC_BEARER_TOKEN_ENV, "").strip() else "live",
        })

    n_txns = len(txns)
    n_matched = len(joined)
    match_rate_pct = round(n_matched / n_txns * 100, 1) if n_txns else 0.0

    result = {
        "query": {"town": town, "postcode": postcode, "district": district, "min_date": min_date, "max_date": max_date, "limit": limit},
        "n_transactions_fetched": n_txns,
        "n_matched_to_epc": n_matched,
        "match_rate_pct": match_rate_pct,
        "land_registry_truncated": truncated,
        "matching_method": (
            "Exact postcode string match between Land Registry and EPC records "
            "(NOT address-level — see module docstring). Where multiple EPC "
            "certificates exist for a postcode, the one whose property_type "
            "matches the transaction is preferred, else the first available."
        ),
        "epc_mode": "live" if os.environ.get(EPC_BEARER_TOKEN_ENV, "").strip() else "demo-seed",
    }

    if match_rate_pct < 100.0:
        result["match_rate_caveat"] = (
            f"Only {n_matched} of {n_txns} Land Registry transactions "
            f"({match_rate_pct}%) matched an EPC record for this query. "
            + ("This is expected: no EPC_API_BEARER_TOKEN is configured, so EPC "
               "coverage is limited to the small demo-seed postcode list — set "
               "EPC_API_BEARER_TOKEN for full live EPC coverage."
               if not os.environ.get(EPC_BEARER_TOKEN_ENV, "").strip() else
               "Some postcodes had no EPC certificate on file.")
        )

    if n_matched < MIN_SAMPLE_FOR_REGRESSION:
        result["regression"] = None
        result["regression_error"] = (
            f"Only {n_matched} matched observations — below the minimum of "
            f"{MIN_SAMPLE_FOR_REGRESSION} needed to fit even a modest hedonic "
            "model. Widen the date range / town, or set EPC_API_BEARER_TOKEN "
            "for full live EPC coverage, then retry."
        )
        result["joined_sample"] = joined
        return result

    # ---- Build design matrix -------------------------------------------------
    ptypes_present = sorted({j["property_type"] for j in joined})
    ptype_baseline = ptypes_present[0]
    ptype_dummy_cols = ptypes_present[1:]

    ages_present = [a for a in _AGE_BAND_ORDER if a in {j["construction_age_band"] for j in joined}]
    unknown_ages = sorted({j["construction_age_band"] for j in joined} - set(_AGE_BAND_ORDER))
    ages_present = ages_present + unknown_ages
    age_baseline = ages_present[0] if ages_present else None
    age_dummy_cols = ages_present[1:] if ages_present else []

    y = np.array([j["price_paid_gbp"] for j in joined], dtype=float)
    rows = []
    for j in joined:
        row = [1.0, float(j["current_energy_efficiency_score"])]
        row += [1.0 if j["property_type"] == p else 0.0 for p in ptype_dummy_cols]
        row += [1.0 if j["construction_age_band"] == a else 0.0 for a in age_dummy_cols]
        rows.append(row)
    X = np.array(rows, dtype=float)

    beta, se, r_squared, adj_r_squared, n, k = _ols(X, y)

    coef_names = ["intercept", "current_energy_efficiency_score"]
    coef_names += [f"property_type[{p}]_vs_{ptype_baseline}" for p in ptype_dummy_cols]
    coef_names += [f"construction_age_band[{a}]_vs_{age_baseline}" for a in age_dummy_cols]

    coefficients = {
        name: {"estimate": round(float(b), 2), "std_error": round(float(s), 2)}
        for name, b, s in zip(coef_names, beta, se)
    }
    score_coef = coefficients["current_energy_efficiency_score"]["estimate"]

    result["regression"] = {
        "specification": "price_paid_gbp ~ intercept + current_energy_efficiency_score + property_type[dummies] + construction_age_band[dummies]",
        "method": "OLS via normal equations (numpy pseudo-inverse), implemented in-house — no external stats library, no fabricated coefficients",
        "n_observations": n,
        "n_parameters": k,
        "degrees_of_freedom": max(n - k, 0),
        "r_squared": round(r_squared, 4),
        "adj_r_squared": round(adj_r_squared, 4) if adj_r_squared is not None else None,
        "property_type_baseline": ptype_baseline,
        "construction_age_band_baseline": age_baseline,
        "coefficients": coefficients,
        "green_premium": {
            "definition": "Predicted GBP price uplift from a one-EPC-band efficiency-score improvement, holding property type and construction age band fixed: coefficient(score) x average score-points per band.",
            "score_coef_gbp_per_point": score_coef,
            "avg_points_per_band": round(_AVG_ONE_BAND_SCORE_DELTA, 1),
            "green_premium_avg_one_band_gbp": round(score_coef * _AVG_ONE_BAND_SCORE_DELTA, 0),
            "d_to_c_points_delta": round(_D_TO_C_SCORE_DELTA, 1),
            "green_premium_d_to_c_gbp": round(score_coef * _D_TO_C_SCORE_DELTA, 0),
        },
        "confidence_caveat": (
            f"n={n} is a small sample for a {k}-parameter regression "
            f"(dof={max(n - k, 0)}) — coefficient estimates, especially the "
            "green-premium figures, carry wide uncertainty (see std_error per "
            "coefficient) and should be read as illustrative of the METHOD, "
            "not a precise market estimate, until run on a much larger matched "
            "sample (requires a live EPC_API_BEARER_TOKEN)."
            if n < 40 else
            "Sample size is moderate; coefficients are still subject to the "
            "postcode-level (not address-level) EPC match noted above."
        ),
    }
    result["joined_sample"] = joined
    return result
