"""Infra Private-Debt Portfolio Analytics — deterministic book-level engine.

Route prefix: /api/v1/infra-portfolio      (NX2-03 Infra Debt Portfolio Manager)

Endpoints
---------
POST /analyze       — full book analytics from a positions ledger:
                        * per-position expected cash-flow projection (coupon +
                          straight-line amortisation from terms) and the
                          portfolio cash-flow ladder;
                        * reinvestment horizon-return (documented convention);
                        * analytic one-factor Vasicek/ASRF credit VaR (EL,
                          VaR99, VaR99.9, UL decomposition, capital multiple);
                        * concentration analytics (HHI by sector / country /
                          single name, largest-N shares, granularity note);
                        * migration-adjusted pricing (alpha vs rating-implied
                          spread when a bucket-OAS map is supplied);
                        * financed-emissions overlay (PCAF-proxy intensities,
                          intensity-vs-spread OLS + R², green/transition/
                          neutral classification mix, Paris-alignment share).
POST /ngfs-overlay  — climate x credit core: reads the seeded NGFS Phase 5
                      extract (same file as /api/v1/ngfs-extract), maps each
                      scenario's carbon price + GDP impact at an anchor year
                      into sector-level PD multipliers via the documented
                      sensitivity table below (LABELED MODEL ASSUMPTION), and
                      reprices EL / VaR99 / VaR99.9 for all six scenarios.
GET  /ref/mappings  — every hand-authored table used by the engine (PD table,
                      NGFS sector sensitivities, PCAF-proxy intensities,
                      sector classification), each with its stated basis.

METHODOLOGY (all deterministic, no PRNG anywhere)
-------------------------------------------------
Cash flows      : annual-pay; year t coupon = coupon_pct x outstanding(t);
                  outstanding amortises straight-line at amort_pct_per_yr % of
                  ORIGINAL notional per year (0 = bullet); remaining principal
                  repays at maturity. Calendar years from `as_of_year`.
Horizon return  : cash flows received before the horizon H are reinvested to H
                  at the reinvestment rate; the remaining position is valued at
                  H by discounting its residual cash flows at the discount
                  rate. Annualised horizon return = (V_H / MV_0)^(1/H) - 1.
                  MV_0 = PV of all cash flows at the discount rate. Documented
                  screening convention (flat curves, no defaults in the base
                  cash-flow view — credit is priced separately below).
Credit VaR      : analytic one-factor Vasicek / Basel ASRF. Conditional PD at
                  confidence q:
                      PD_q = Phi( (Phi^-1(PD) + sqrt(rho) * Phi^-1(q)) / sqrt(1 - rho) )
                  VaR_q = sum_i EAD_i x LGD x PD_q,i ;  EL = sum_i EAD_i x LGD x PD_i ;
                  UL_q = VaR_q - EL ; capital multiple = UL_99.9 / EL.
                  Single asset correlation rho input, default 0.24 — labeled:
                  Basel-convention asset correlation for project finance /
                  specialised lending (upper corporate band; supervisory
                  slotting treats PF near the 24% high-correlation end).
                  Phi from math.erf; Phi^-1 via Peter Acklam's rational
                  approximation (max |rel err| ~1.15e-9; same accuracy class as
                  AS-241/PPND16 — cited in _inv_norm below).
                  ASRF assumes an infinitely granular book — single-name
                  concentration is NOT captured; the /analyze response pairs
                  the VaR block with an explicit granularity note + HHI.
Concentration   : HHI = sum(share_i^2) x 10000 on notional shares (0-10000
                  scale; >2500 concentrated / >1500 moderate — DoJ-style
                  screening bands, labeled). Largest-1/3/5 shares included.
Pricing alpha   : book spread_bp = (coupon - base_rate) x 100 (funding-curve
                  proxy, user base rate). Rating-implied spread = bucket OAS
                  (pass the live ICE BofA OAS join from the frontend).
                  alpha_bp = book spread - rating-implied spread; book alpha is
                  the notional-weighted mean. Public corporate OAS is an
                  imperfect proxy for private infra debt (illiquidity premium
                  not split out) — stated model assumption.
Financed CO2e   : PCAF-style proxy — financed emissions_i = notional_$M x
                  intensity (tCO2e per $M of debt outstanding). True PCAF
                  attribution divides borrower emissions by EVIC/total debt;
                  private PF capital structures are rarely public, so the
                  per-$M-debt intensity IS the attribution (attribution factor
                  1.0 on the instrument) — LABELED PROXY. Sector default
                  intensities are hand-authored order-of-magnitude conventions
                  (see /ref/mappings); supply per-position overrides for real
                  reporting. Intensity-vs-spread OLS: y = spread_bp,
                  x = intensity; slope / intercept / R² answer "does the book
                  price carbon risk?".
NGFS overlay    : PD multiplier(sector, scenario) =
                      clip( 1 + beta_cp x CP(s, anchor)/100 + beta_gdp x max(0, -GDP(s, anchor)), 0.4, 4.0 )
                  CP in USD/tCO2e and GDP impact in % from the seeded NGFS
                  Phase 5 extract (IIASA Scenario Explorer, CC BY 4.0) at the
                  anchor year (default 2035, region World). beta_cp / beta_gdp
                  are the hand-authored sector sensitivities in
                  NGFS_SECTOR_SENSITIVITY (LABELED MODEL ASSUMPTION, shown
                  in-UI): fossil-demand-exposed transport carries positive
                  carbon-price beta; contracted renewables carry a small
                  negative beta (merchant power upside under carbon pricing);
                  all sectors carry a macro (GDP) beta. Transition risk only —
                  physical/chronic risk is NOT modeled here. Stressed PDs are
                  capped at 99%. EL / VaR are then recomputed per scenario with
                  the same ASRF machinery.
PD source       : hand-authored cumulative PD table (rating x tenor, linear
                  interpolation), consistent with published project-finance
                  default studies (Moody's PF bank-loan study; S&P annual PF
                  studies) — APPROXIMATE, labeled; per-position pd_pct override
                  supported for licensed study data.
"""

from __future__ import annotations

import json
import math
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator

router = APIRouter(prefix="/api/v1/infra-portfolio", tags=["Infra Debt Portfolio Analytics"])

AS_OF_YEAR_DEFAULT = 2026

# ── Hand-authored cumulative PD table (%, rating x tenor) ────────────────────
# APPROXIMATE — consistent with Moody's "Default and Recovery Rates for Project
# Finance Bank Loans" and S&P annual PF default studies (marginal rates decline
# with seasoning; 10y cumulative sits between corporate IG and HY equivalents).
# Same table the NX2-03 page displays. Replace with licensed data for production.
PD_TENORS = [1, 3, 5, 7, 10]
PD_TABLE: Dict[str, List[float]] = {
    "BBB+": [0.10, 0.45, 0.90, 1.40, 2.00],
    "BBB":  [0.16, 0.65, 1.30, 2.00, 2.90],
    "BBB-": [0.25, 1.00, 1.95, 2.95, 4.20],
    "BB+":  [0.45, 1.70, 3.20, 4.70, 6.50],
    "BB":   [0.70, 2.60, 4.80, 6.90, 9.30],
    "BB-":  [1.10, 3.90, 7.00, 9.90, 13.00],
    "B+":   [1.80, 6.00, 10.30, 14.00, 17.80],
    "B":    [2.60, 8.40, 13.90, 18.40, 22.70],
    "CCC":  [4.50, 13.00, 20.00, 25.50, 30.50],
}

# ── NGFS sector sensitivities (LABELED MODEL ASSUMPTION, shown in-UI) ────────
# beta_cp : PD-multiplier points per $100/tCO2e scenario carbon price.
# beta_gdp: PD-multiplier points per 1% scenario GDP loss.
# Rationale (hand-authored): demand-exposed fossil-adjacent transport highest
# (aviation fuel-cost pass-through + demand destruction; road fuel-price
# elasticity); availability-based social and rate-based networks low;
# contracted renewables slightly NEGATIVE carbon-price beta (carbon pricing
# lifts merchant tails / re-contracting values).
NGFS_SECTOR_SENSITIVITY: Dict[str, Dict[str, float]] = {
    "airport":      {"beta_cp": 0.22,  "beta_gdp": 0.06},
    "toll road":    {"beta_cp": 0.12,  "beta_gdp": 0.05},
    "social":       {"beta_cp": 0.01,  "beta_gdp": 0.03},
    "transmission": {"beta_cp": -0.02, "beta_gdp": 0.02},
    "wind":         {"beta_cp": -0.05, "beta_gdp": 0.02},
    "solar":        {"beta_cp": -0.05, "beta_gdp": 0.02},
}
NGFS_SENSITIVITY_BASIS = (
    "Hand-authored sector sensitivities (LABELED MODEL ASSUMPTION): PD multiplier = "
    "1 + beta_cp x carbon_price/100 + beta_gdp x max(0, -GDP impact %), clipped to [0.4, 4.0]. "
    "Fossil-demand-exposed transport carries positive carbon-price beta; contracted renewables a small "
    "negative beta; every sector a macro beta. Transition-risk channel only — physical risk not modeled."
)
_MULT_FLOOR, _MULT_CAP = 0.4, 4.0

# ── PCAF-proxy sector intensities (tCO2e per $M debt outstanding, labeled) ───
# HAND-AUTHORED order-of-magnitude conventions for screening: renewables near
# zero operational scope-1/2; networks moderate (losses + SF6); social low;
# roads high (scope-3 vehicle use often attributed in infra frameworks);
# airports highest (facilitated aviation). NOT reporting-grade — override
# per position with borrower data for PCAF submissions.
SECTOR_INTENSITY_TCO2E_PER_MUSD: Dict[str, float] = {
    "solar": 15.0, "wind": 20.0, "transmission": 45.0,
    "social": 30.0, "toll road": 220.0, "airport": 550.0,
}

# ── Sector classification defaults (documented screening convention) ─────────
SECTOR_CLASSIFICATION: Dict[str, str] = {
    "solar": "green", "wind": "green",
    "transmission": "transition", "social": "transition",
    "toll road": "neutral", "airport": "neutral",
}
CLASSIFICATION_BASIS = (
    "Sector default classification (screening convention, override per position): renewables = green "
    "(EU-taxonomy-aligned activities), enabling networks + availability-based social = transition, "
    "demand-exposed transport = neutral. Paris-alignment share = green notional share (strict) and "
    "green+transition share (broad) — both reported, labeled conventions rather than a formal PACTA/SBTi test."
)

_RATINGS = list(PD_TABLE.keys())


# ---------------------------------------------------------------------------
# Math helpers (deterministic, closed-form)
# ---------------------------------------------------------------------------

def _norm_cdf(x: float) -> float:
    """Standard normal CDF via math.erf (double precision)."""
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))


def _inv_norm(p: float) -> float:
    """Inverse standard normal CDF — Peter Acklam's rational approximation.

    Coefficients from Acklam (2003), "An algorithm for computing the inverse
    normal cumulative distribution function"; max relative error ~1.15e-9 —
    the same accuracy class as Wichura's AS-241 (PPND16). Deterministic.
    """
    if not (0.0 < p < 1.0):
        raise ValueError("p must be in (0, 1)")
    a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
         1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00]
    b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
         6.680131188771972e+01, -1.328068155288572e+01]
    c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
         -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00]
    d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
         3.754408661907416e+00]
    p_low, p_high = 0.02425, 1.0 - 0.02425
    if p < p_low:
        q = math.sqrt(-2.0 * math.log(p))
        return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / \
               ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1.0)
    if p > p_high:
        q = math.sqrt(-2.0 * math.log(1.0 - p))
        return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / \
               ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1.0)
    q = p - 0.5
    r = q * q
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / \
           (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1.0)


def _cum_pd_pct(rating: str, horizon_years: float) -> Optional[float]:
    """Linear interpolation of the cumulative PD table (%) at the horizon."""
    row = PD_TABLE.get(rating)
    if row is None:
        return None
    h = max(1.0, min(float(horizon_years), 10.0))
    if h <= PD_TENORS[0]:
        return row[0]
    for i in range(1, len(PD_TENORS)):
        if h <= PD_TENORS[i]:
            t0, t1 = PD_TENORS[i - 1], PD_TENORS[i]
            return row[i - 1] + (row[i] - row[i - 1]) * (h - t0) / (t1 - t0)
    return row[-1]


def _vasicek_conditional_pd(pd: float, rho: float, q: float) -> float:
    """Basel ASRF conditional PD at confidence q (pd, rho, q all decimals)."""
    pd = min(max(pd, 1e-9), 0.999999)
    return _norm_cdf((_inv_norm(pd) + math.sqrt(rho) * _inv_norm(q)) / math.sqrt(1.0 - rho))


def _ols(xs: List[float], ys: List[float]) -> Optional[dict]:
    """Simple OLS y = a + b x with R² (deterministic closed form)."""
    n = len(xs)
    if n < 2:
        return None
    mx, my = sum(xs) / n, sum(ys) / n
    sxx = sum((x - mx) ** 2 for x in xs)
    if sxx <= 1e-12:
        return None
    sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    b = sxy / sxx
    a = my - b * mx
    ss_tot = sum((y - my) ** 2 for y in ys)
    ss_res = sum((y - (a + b * x)) ** 2 for x, y in zip(xs, ys))
    r2 = (1.0 - ss_res / ss_tot) if ss_tot > 1e-12 else None
    return {"intercept": a, "slope": b, "r2": r2, "n": n}


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class PositionIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    sector: str = Field(..., description="solar | wind | transmission | airport | toll road | social (free text allowed; unknown sectors use neutral defaults)")
    country: str = Field("", max_length=60)
    rating: str = Field(..., description=f"One of {_RATINGS}")
    notional_m: float = Field(..., gt=0, le=100000, description="Outstanding notional, $M")
    coupon_pct: float = Field(..., ge=0, le=30)
    maturity_year: int = Field(..., ge=2026, le=2070)
    amort_pct_per_yr: float = Field(0.0, ge=0, le=100, description="Straight-line amortisation, % of ORIGINAL notional per year (0 = bullet)")
    contracted_pct: Optional[float] = Field(None, ge=0, le=100)
    pd_pct: Optional[float] = Field(None, ge=0, le=100, description="Cumulative PD override at the EL horizon, % (else PD table)")
    intensity_tco2e_per_musd: Optional[float] = Field(None, ge=0, le=100000, description="Financed-emissions intensity override, tCO2e/$M debt (else sector PCAF-proxy default)")
    classification: Optional[str] = Field(None, description="green | transition | neutral (else sector default)")

    @field_validator("rating")
    @classmethod
    def _rating_known(cls, v):
        if v not in PD_TABLE:
            raise ValueError(f"rating must be one of {_RATINGS}")
        return v

    @field_validator("classification")
    @classmethod
    def _class_known(cls, v):
        if v is not None and v not in ("green", "transition", "neutral"):
            raise ValueError("classification must be green | transition | neutral")
        return v


class AnalyzeRequest(BaseModel):
    positions: List[PositionIn] = Field(..., min_length=1, max_length=500)
    as_of_year: int = Field(AS_OF_YEAR_DEFAULT, ge=2024, le=2060)
    base_rate_pct: float = Field(4.25, ge=0, le=25, description="Funding-curve proxy for spread decomposition (user input)")
    discount_rate_pct: float = Field(6.0, gt=0, le=30, description="Flat discount rate for PV / horizon valuation")
    reinvestment_rate_pct: float = Field(4.0, ge=0, le=30, description="Reinvestment rate for cash flows received before the horizon")
    horizon_years: int = Field(5, ge=1, le=10, description="EL/VaR + horizon-return horizon")
    lgd_pct: float = Field(25.0, ge=0, le=100, description="Basis: Moody's PF ultimate recoveries ~75-80% senior secured")
    asset_correlation: float = Field(
        0.24, gt=0, lt=1,
        description="Single Vasicek asset correlation. 0.24 labeled: Basel-convention high band for project finance / specialised lending.",
    )
    bucket_oas_pp: Optional[Dict[str, float]] = Field(
        None,
        description="Optional letter-bucket OAS map in percentage points, e.g. {'BBB': 1.2, 'BB': 2.6, 'B': 3.4} — pass the live ICE BofA join to enable migration-adjusted pricing alpha.",
    )


class NgfsOverlayRequest(AnalyzeRequest):
    anchor_year: int = Field(2035, description="NGFS anchor year: one of 2025/2030/2035/2040/2045/2050")
    region: str = Field("World", description="NGFS region: World | EU | US | CN")

    @field_validator("anchor_year")
    @classmethod
    def _anchor(cls, v):
        if v not in (2025, 2030, 2035, 2040, 2045, 2050):
            raise ValueError("anchor_year must be one of 2025/2030/2035/2040/2045/2050")
        return v


# ---------------------------------------------------------------------------
# Core shared computations
# ---------------------------------------------------------------------------

def _letter(rating: str) -> str:
    return "BBB" if rating.startswith("BBB") else ("BB" if rating.startswith("BB") else "B")


def _position_cashflows(p: PositionIn, as_of_year: int) -> List[dict]:
    """Annual coupon + straight-line amortisation cash flows (documented)."""
    ttm = max(1, p.maturity_year - as_of_year)
    amort = min(p.amort_pct_per_yr / 100.0, 1.0 / ttm if ttm > 0 else 1.0)  # cannot amortise past maturity
    out = []
    outstanding = p.notional_m
    for t in range(1, ttm + 1):
        coupon = outstanding * p.coupon_pct / 100.0
        principal = p.notional_m * amort if t < ttm else outstanding
        principal = min(principal, outstanding)
        out.append({"t": t, "year": as_of_year + t, "coupon_m": coupon, "principal_m": principal,
                    "total_m": coupon + principal})
        outstanding -= principal
        if outstanding <= 1e-9:
            break
    return out


def _pv(cashflows: List[dict], rate_pct: float) -> float:
    r = rate_pct / 100.0
    return sum(cf["total_m"] / (1.0 + r) ** cf["t"] for cf in cashflows)


def _position_pd(p: PositionIn, horizon_years: int, as_of_year: int) -> float:
    """Cumulative PD (decimal) at min(horizon, ttm): override or table."""
    ttm = max(1, p.maturity_year - as_of_year)
    h = min(horizon_years, ttm)
    if p.pd_pct is not None:
        return min(p.pd_pct / 100.0, 0.99)
    return min((_cum_pd_pct(p.rating, h) or 0.0) / 100.0, 0.99)


def _asrf_block(eads: List[float], pds: List[float], lgd: float, rho: float) -> dict:
    """EL / VaR99 / VaR99.9 / UL / capital multiple for a heterogeneous book."""
    el = sum(e * lgd * pd for e, pd in zip(eads, pds))
    var99 = sum(e * lgd * _vasicek_conditional_pd(pd, rho, 0.99) for e, pd in zip(eads, pds))
    var999 = sum(e * lgd * _vasicek_conditional_pd(pd, rho, 0.999) for e, pd in zip(eads, pds))
    return {
        "el_m": round(el, 2),
        "var99_m": round(var99, 2),
        "var999_m": round(var999, 2),
        "ul99_m": round(var99 - el, 2),
        "ul999_m": round(var999 - el, 2),
        "capital_multiple": round((var999 - el) / el, 2) if el > 1e-9 else None,
    }


def _hhi(shares_pct: List[float]) -> float:
    """HHI on percentage shares (0-10000 scale)."""
    return sum(s * s for s in shares_pct)


def _concentration(positions: List[PositionIn]) -> dict:
    total = sum(p.notional_m for p in positions)

    def group_hhi(keyfn):
        groups: Dict[str, float] = {}
        for p in positions:
            k = keyfn(p) or "unspecified"
            groups[k] = groups.get(k, 0.0) + p.notional_m
        shares = [(k, v / total * 100.0) for k, v in groups.items()]
        shares.sort(key=lambda kv: -kv[1])
        return {
            "hhi": round(_hhi([s for _, s in shares]), 0),
            "groups": [{"name": k, "notional_m": round(v / 100.0 * total, 1), "share_pct": round(v, 2)} for k, v in shares],
        }

    by_name = group_hhi(lambda p: p.name)
    sorted_shares = [g["share_pct"] for g in by_name["groups"]]
    return {
        "by_sector": group_hhi(lambda p: p.sector),
        "by_country": group_hhi(lambda p: p.country),
        "single_name": {
            "hhi": by_name["hhi"],
            "largest_1_pct": round(sorted_shares[0], 2) if sorted_shares else None,
            "largest_3_pct": round(sum(sorted_shares[:3]), 2),
            "largest_5_pct": round(sum(sorted_shares[:5]), 2),
            "effective_n": round(10000.0 / by_name["hhi"], 1) if by_name["hhi"] else None,
        },
        "bands_note": "HHI on notional shares, 0-10000 scale: >2500 concentrated, 1500-2500 moderate (DoJ-style screening bands, labeled).",
        "granularity_note": (
            "The ASRF credit-VaR block assumes an infinitely granular portfolio — single-name concentration ADDS "
            "unmodeled UL. A first-order granularity adjustment scales with HHI/10000 (Gordy); with effective N "
            "names the add-on is roughly proportional to 1/N. Interpret VaR alongside the single-name HHI here."
        ),
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/analyze", summary="Full infra-debt book analytics (cash flows, Vasicek credit VaR, concentration, pricing alpha, financed emissions)")
def analyze(req: AnalyzeRequest) -> dict:
    lgd = req.lgd_pct / 100.0
    rho = req.asset_correlation
    H = req.horizon_years

    # ── Per-position cash flows + ladder ─────────────────────────────────────
    ladder: Dict[int, dict] = {}
    pos_out = []
    total_mv = 0.0
    horizon_value = 0.0
    reinv = req.reinvestment_rate_pct / 100.0
    disc = req.discount_rate_pct / 100.0

    eads, pds = [], []
    spreads_bp, intensities, fin_emissions = [], [], []
    class_mix: Dict[str, float] = {"green": 0.0, "transition": 0.0, "neutral": 0.0}
    total_notional = sum(p.notional_m for p in req.positions)

    for p in req.positions:
        cfs = _position_cashflows(p, req.as_of_year)
        mv = _pv(cfs, req.discount_rate_pct)
        total_mv += mv
        # Horizon value: CFs before H reinvested to H; residual CFs discounted back to H.
        hv = 0.0
        for cf in cfs:
            if cf["t"] <= H:
                hv += cf["total_m"] * (1.0 + reinv) ** (H - cf["t"])
            else:
                hv += cf["total_m"] / (1.0 + disc) ** (cf["t"] - H)
        horizon_value += hv
        for cf in cfs:
            row = ladder.setdefault(cf["year"], {"year": cf["year"], "coupon_m": 0.0, "principal_m": 0.0, "total_m": 0.0})
            row["coupon_m"] += cf["coupon_m"]
            row["principal_m"] += cf["principal_m"]
            row["total_m"] += cf["total_m"]

        pd_ = _position_pd(p, H, req.as_of_year)
        eads.append(p.notional_m)
        pds.append(pd_)

        spread_bp = (p.coupon_pct - req.base_rate_pct) * 100.0
        intensity = p.intensity_tco2e_per_musd if p.intensity_tco2e_per_musd is not None \
            else SECTOR_INTENSITY_TCO2E_PER_MUSD.get(p.sector, 100.0)
        financed = p.notional_m * intensity
        cls = p.classification or SECTOR_CLASSIFICATION.get(p.sector, "neutral")
        class_mix[cls] = class_mix.get(cls, 0.0) + p.notional_m
        spreads_bp.append(spread_bp)
        intensities.append(intensity)
        fin_emissions.append(financed)

        letter = _letter(p.rating)
        oas_pp = (req.bucket_oas_pp or {}).get(letter)
        alpha_bp = (spread_bp - oas_pp * 100.0) if oas_pp is not None else None

        pos_out.append({
            "name": p.name, "sector": p.sector, "country": p.country, "rating": p.rating,
            "letter": letter, "notional_m": p.notional_m,
            "mv_m": round(mv, 2),
            "ttm_years": max(1, p.maturity_year - req.as_of_year),
            "pd_pct": round(pd_ * 100.0, 3),
            "el_m": round(p.notional_m * lgd * pd_, 3),
            "cond_pd999_pct": round(_vasicek_conditional_pd(pd_, rho, 0.999) * 100.0, 2),
            "spread_bp": round(spread_bp, 0),
            "rating_implied_oas_bp": round(oas_pp * 100.0, 0) if oas_pp is not None else None,
            "alpha_bp": round(alpha_bp, 0) if alpha_bp is not None else None,
            "intensity_tco2e_per_musd": round(intensity, 1),
            "intensity_source": "override" if p.intensity_tco2e_per_musd is not None else "sector PCAF-proxy default (labeled)",
            "financed_emissions_tco2e": round(financed, 0),
            "classification": cls,
            "cashflows": [{k: (round(v, 2) if isinstance(v, float) else v) for k, v in cf.items()} for cf in cfs],
        })

    ladder_rows = [
        {"year": y, "coupon_m": round(r["coupon_m"], 2), "principal_m": round(r["principal_m"], 2), "total_m": round(r["total_m"], 2)}
        for y, r in sorted(ladder.items())
    ]

    horizon_return_pct = ((horizon_value / total_mv) ** (1.0 / H) - 1.0) * 100.0 if total_mv > 0 else None

    # ── Credit VaR (Vasicek/ASRF) ────────────────────────────────────────────
    var_block = _asrf_block(eads, pds, lgd, rho)
    var_block.update({
        "confidences": [0.99, 0.999],
        "asset_correlation": rho,
        "correlation_basis": (
            "Single-factor asset correlation, default 0.24 — labeled Basel convention for project finance / "
            "specialised lending (upper corporate correlation band; supervisory slotting treats PF near the "
            "high-correlation end). User-adjustable."
        ),
        "formula": "VaR_q = sum_i EAD_i x LGD x Phi((Phi^-1(PD_i) + sqrt(rho) Phi^-1(q)) / sqrt(1-rho)); EL = sum EAD x LGD x PD; UL_q = VaR_q - EL.",
        "quantile_method": "Inverse normal via Acklam rational approximation (~1.15e-9 rel. err; AS-241/PPND16 accuracy class).",
    })

    # ── Pricing alpha (migration-adjusted pricing) ───────────────────────────
    priced = [r for r in pos_out if r["alpha_bp"] is not None]
    book_alpha = (sum(r["alpha_bp"] * r["notional_m"] for r in priced) / sum(r["notional_m"] for r in priced)) if priced else None

    # ── Financed emissions block ─────────────────────────────────────────────
    total_financed = sum(fin_emissions)
    wavg_intensity = total_financed / total_notional if total_notional > 0 else None
    ols = _ols(intensities, spreads_bp)
    green_share = class_mix["green"] / total_notional * 100.0 if total_notional else 0.0
    transition_share = class_mix["transition"] / total_notional * 100.0 if total_notional else 0.0

    return {
        "inputs": {k: v for k, v in req.model_dump().items() if k != "positions"},
        "position_count": len(req.positions),
        "book": {
            "total_notional_m": round(total_notional, 1),
            "total_mv_m": round(total_mv, 2),
            "horizon_value_m": round(horizon_value, 2),
            "horizon_return_pct_pa": round(horizon_return_pct, 3) if horizon_return_pct is not None else None,
            "horizon_years": H,
        },
        "positions": pos_out,
        "cashflow_ladder": ladder_rows,
        "cashflow_methodology": (
            "Annual-pay: coupon on outstanding + straight-line amortisation (% of original notional/yr; 0 = bullet; "
            "capped at 1/ttm so principal cannot fully repay before maturity — screening convention), "
            "residual principal at maturity. Horizon return: CFs before H reinvested at the reinvestment rate to H; "
            "later CFs discounted back to H at the discount rate; annualised vs MV_0 = PV(all CFs @ discount rate). "
            "Flat-curve screening convention; defaults are priced separately in the credit block."
        ),
        "credit_var": var_block,
        "concentration": _concentration(req.positions),
        "pricing": {
            "book_alpha_bp": round(book_alpha, 0) if book_alpha is not None else None,
            "priced_positions": len(priced),
            "note": (
                "alpha_bp = (coupon - base rate) x 100 - rating-bucket OAS (pass the live ICE BofA join in bucket_oas_pp). "
                "Positive alpha = book earns spread above the rating-implied public-market level (illiquidity premium + "
                "selection); public OAS is an imperfect private-debt proxy — stated model assumption."
            ) if req.bucket_oas_pp else "Supply bucket_oas_pp (letter -> OAS pp) to enable rating-implied pricing alpha.",
        },
        "financed_emissions": {
            "total_tco2e": round(total_financed, 0),
            "wavg_intensity_tco2e_per_musd": round(wavg_intensity, 1) if wavg_intensity is not None else None,
            "intensity_vs_spread_ols": (
                {"slope_bp_per_tco2e_musd": round(ols["slope"], 4), "intercept_bp": round(ols["intercept"], 1),
                 "r2": round(ols["r2"], 3) if ols["r2"] is not None else None, "n": ols["n"]}
                if ols else None
            ),
            "classification_mix_pct": {k: round(v / total_notional * 100.0, 1) if total_notional else 0.0 for k, v in class_mix.items()},
            "paris_alignment_share_pct": {"strict_green_only": round(green_share, 1), "broad_green_plus_transition": round(green_share + transition_share, 1)},
            "methodology": (
                "PCAF-style proxy: financed emissions = notional $M x intensity (tCO2e/$M debt outstanding; attribution "
                "factor 1.0 on the instrument — LABELED PROXY, true PCAF divides borrower emissions by EVIC/total debt). "
                "Sector defaults are hand-authored order-of-magnitude conventions (see /ref/mappings); override per "
                "position for reporting. OLS answers whether wider-spread positions carry higher carbon intensity "
                "(does the book price carbon risk?)."
            ),
        },
        "determinism": "Closed-form arithmetic only (erf CDF + Acklam inverse normal); no PRNG anywhere.",
    }


# NGFS extract loader — same file the /api/v1/ngfs-extract route serves.
_NGFS_FILE = Path(__file__).resolve().parents[3] / "data" / "ngfs_phase5_extract.json"


@lru_cache(maxsize=1)
def _load_ngfs() -> dict:
    if not _NGFS_FILE.exists():
        raise FileNotFoundError(f"NGFS extract not found: {_NGFS_FILE}")
    with open(_NGFS_FILE, "r", encoding="utf-8") as fh:
        return json.load(fh)


@router.post("/ngfs-overlay", summary="NGFS Phase 5 scenario overlay — sector PD multipliers -> scenario EL / VaR across all six scenarios")
def ngfs_overlay(req: NgfsOverlayRequest) -> dict:
    try:
        extract = _load_ngfs()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))

    years: List[int] = extract["years"]
    if req.anchor_year not in years:
        raise HTTPException(status_code=422, detail=f"anchor_year must be one of {years}")
    if req.region not in {r["id"] for r in extract["regions"]}:
        raise HTTPException(status_code=422, detail=f"region must be one of {[r['id'] for r in extract['regions']]}")
    yi = years.index(req.anchor_year)

    lgd = req.lgd_pct / 100.0
    rho = req.asset_correlation
    H = req.horizon_years
    eads = [p.notional_m for p in req.positions]
    base_pds = [_position_pd(p, H, req.as_of_year) for p in req.positions]
    base_block = _asrf_block(eads, base_pds, lgd, rho)

    scenarios_out = []
    for sc in extract["scenarios"]:
        sid = sc["id"]
        cube = extract["data"].get(sid, {}).get(req.region, {})
        cp = (cube.get("carbon_price") or [None] * len(years))[yi]
        gdp = (cube.get("gdp_impact_pct") or [None] * len(years))[yi]
        if cp is None or gdp is None:
            continue
        # Documented multiplier mapping (see module docstring + /ref/mappings)
        sector_mults = {}
        for sector, s in NGFS_SECTOR_SENSITIVITY.items():
            m = 1.0 + s["beta_cp"] * cp / 100.0 + s["beta_gdp"] * max(0.0, -gdp)
            sector_mults[sector] = round(min(max(m, _MULT_FLOOR), _MULT_CAP), 3)
        stressed_pds = []
        for p, pd_ in zip(req.positions, base_pds):
            s = NGFS_SECTOR_SENSITIVITY.get(p.sector, {"beta_cp": 0.05, "beta_gdp": 0.04})  # unknown sector: mid defaults, labeled
            m = min(max(1.0 + s["beta_cp"] * cp / 100.0 + s["beta_gdp"] * max(0.0, -gdp), _MULT_FLOOR), _MULT_CAP)
            stressed_pds.append(min(pd_ * m, 0.99))
        block = _asrf_block(eads, stressed_pds, lgd, rho)
        scenarios_out.append({
            "scenario": sid,
            "scenario_name": sc.get("name", sid),
            "carbon_price_usd_t": cp,
            "gdp_impact_pct": gdp,
            "sector_pd_multipliers": sector_mults,
            **block,
            "el_delta_vs_base_m": round(block["el_m"] - base_block["el_m"], 2),
        })

    return {
        "inputs": {k: v for k, v in req.model_dump().items() if k != "positions"},
        "position_count": len(req.positions),
        "ngfs_meta": extract["_meta"],
        "anchor_year": req.anchor_year,
        "region": req.region,
        "base": base_block,
        "scenarios": scenarios_out,
        "sensitivity_table": {"per_sector": NGFS_SECTOR_SENSITIVITY, "basis": NGFS_SENSITIVITY_BASIS,
                              "clip": [_MULT_FLOOR, _MULT_CAP], "unknown_sector_default": {"beta_cp": 0.05, "beta_gdp": 0.04}},
        "methodology": (
            "PD multiplier(sector, scenario) = clip(1 + beta_cp x carbon_price/100 + beta_gdp x max(0, -GDP impact %), "
            f"{_MULT_FLOOR}, {_MULT_CAP}) at the anchor year from the seeded NGFS Phase 5 extract (IIASA Scenario "
            "Explorer, CC BY 4.0 — same file as /api/v1/ngfs-extract). Stressed PD = base PD x multiplier (cap 99%); "
            "EL/VaR re-run through the same Vasicek/ASRF block. Transition-risk channel only; the sensitivity table is "
            "a LABELED MODEL ASSUMPTION shown in-UI, not NGFS output."
        ),
    }


@router.get("/ref/mappings", summary="Hand-authored reference tables (PD, NGFS sensitivities, PCAF-proxy intensities, classification) with bases")
def ref_mappings() -> dict:
    return {
        "pd_table_pct": {"tenors_years": PD_TENORS, "by_rating": PD_TABLE,
                         "basis": "Hand-authored, consistent with Moody's PF bank-loan and S&P annual PF default studies — APPROXIMATE, labeled; linear interpolation between tenors."},
        "ngfs_sector_sensitivity": {"per_sector": NGFS_SECTOR_SENSITIVITY, "basis": NGFS_SENSITIVITY_BASIS, "clip": [_MULT_FLOOR, _MULT_CAP]},
        "pcaf_proxy_intensity_tco2e_per_musd": {"per_sector": SECTOR_INTENSITY_TCO2E_PER_MUSD,
                                                "basis": "Hand-authored order-of-magnitude screening conventions (attribution factor 1.0 on the instrument — labeled PCAF proxy, not reporting-grade)."},
        "sector_classification": {"per_sector": SECTOR_CLASSIFICATION, "basis": CLASSIFICATION_BASIS},
        "asset_correlation_default": {"value": 0.24, "basis": "Basel-convention high band for project finance / specialised lending."},
        "note": "Every table is hand-authored and labeled; replace with licensed study data / borrower-reported emissions for production.",
    }
