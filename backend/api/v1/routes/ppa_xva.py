"""
PPA XVA Engine — full XVA suite on long-dated Power Purchase Agreements
========================================================================
NX2-12 (`/ppa-xva-engine`). Contract-level counterparty-credit valuation
adjustments for corporate/IPP PPAs — the contract-level complement to the
bank-book XVA in banking_risk.

METHOD (fully deterministic — no PRNG anywhere in this module)
--------------------------------------------------------------
1. Merchant-price lattice
   A DETERMINISTIC recombining binomial lattice (Cox-Ross-Rubinstein
   parameterisation) of the merchant power price, annual steps:
       u = exp(sigma * sqrt(dt)),  d = 1/u,  dt = 1 year
       p = (exp(mu * dt) - d) / (u - d)      (risk-neutral-style drift prob,
                                              clamped to [0.001, 0.999] with a
                                              clamp flag surfaced in output)
   Node price at step t, up-count j:  S(t,j) = S0 * u^j * d^(t-j)
   Node probability:                  P(t,j) = C(t,j) * p^j * (1-p)^(t-j)
   The lattice recombines, so step t has exactly t+1 nodes — every number is
   reproducible from the inputs alone.

2. Mark-to-market at each node
   The node price is treated as the flat forward for the remaining delivery
   term (documented approximation). Remaining contracted volume at end of
   year t is annual_volume * (tenor - t). MtM to the FIXED-PRICE RECEIVER
   (the generator/seller) at node (t,j):
       MtM = (fixed_price - S(t,j)) * annual_volume * annuity(tenor - t, r)
   where annuity(n, r) = sum_{k=1..n} (1+r)^-k discounts the remaining
   deliveries. `holder` flips the sign: the offtaker/buyer holds
   (S - fixed) * volume.

3. Exposure profiles
   EE_t  = sum_j P(t,j) * max(MtM(t,j), 0)     (expected positive exposure)
   ENE_t = sum_j P(t,j) * max(-MtM(t,j), 0)    (expected negative exposure)
   PFE_q(t) = q-quantile of the node exposure distribution max(MtM, 0):
   the smallest node exposure e such that P(exposure <= e) >= q, taken over
   the exact lattice probabilities (95th and 99th percentiles reported).
   By construction PFE99 >= PFE95 at every period (quantile monotonicity).

4. CSA / collateral (threshold, MTA, rounding, one-way/two-way, haircuts)
   With CSA threshold K, minimum transfer amount MTA and rounding lot R,
   the collateral CALLED at a node (when the CSA obliges the counterparty
   to post — two-way, or one-way in our favour) is
       c(t,j) = floor(max(MtM - K, 0) / R) * R   (call waived when < MTA)
   valued after a collateral-type haircut h (CRE22-style standard
   supervisory haircut basis, hand-authored table, approximate):
       collateralised exposure = max(min(MtM, MtM - c*(1-h) + addon), 0)
       MPR add-on(t,j) = S(t,j) * annual_volume * sigma * sqrt(m / 365)
   (one year of deliveries as the margin-period notional proxy — labeled).
   With MTA = R = h = 0 this reduces exactly to the original
   max(min(MtM, K + addon), 0) cap. A margin-period-of-risk sensitivity
   table (5/10/20 days) is always computed.

5. Credit curves — static
   Hand-authored cumulative-PD table by rating — "derived from published
   rating-agency long-term corporate default studies — approximate"
   (S&P / Moody's global corporate average cumulative default rates,
   1981-2023 vintage studies, rounded). Linear interpolation between
   tabulated tenors; beyond 20y the last 15y->20y marginal hazard is held
   constant; cumulative PD capped at 99%.
       marginal PD_t = CPD(t) - CPD(t-1)

6. Credit curves — rating transitions (time-varying PD)
   A hand-authored ANNUAL RATING-MIGRATION MATRIX (agency-study basis:
   long-term average one-year corporate transition rates per published
   S&P/Moody's studies, rounded, NR withdrawals reallocated to the
   diagonal — APPROXIMATE). The start-rating state vector is propagated
   pi_t = pi_{t-1} * M (D absorbing); cumulative PD_mig(t) = pi_t[D].
   The engine always reports the migration-based curve NEXT TO the static
   curve and the CVA under each; `use_rating_transitions` switches which
   one drives the headline CVA (default False = static, preserving the
   original behaviour).

7. CVA / DVA (unilateral, discrete)
       CVA = sum_t EE_t  * marginalPD_cpty(t) * (1 - R_cpty) * DF_t
       DVA = sum_t ENE_t * marginalPD_own(t)  * (1 - R_own)  * DF_t
       DF_t = (1 + r)^-t
   Survival-probability cross-terms are omitted (first-order approximation,
   standard for indicative desk calculations; conservative for CVA).

8. FULL XVA STACK (documented desk-level proxies, all labeled)
   FVA  = FCA - FBA;  FCA = sum_t EE_coll_t * s_f * DF_t,
                      FBA = sum_t ENE_t     * s_f * DF_t
          with s_f the funding spread (bps input). Funded exposure is the
          RESIDUAL (post-collateral) positive exposure; FVA is exactly
          LINEAR in the funding spread by construction.
   KVA  = sum_t Capital_t * cost_of_capital * DF_t   (proxy, labeled)
          Capital_t = 8% * RW * EAD_t
          EAD_t = alpha * (RC_t + PFE_addon_t)  — SA-CCR-style with the real
          Basel alpha = 1.4 (CRE52.1). RC_t proxied by EE_coll_t (labeled —
          SA-CCR RC is a t0 quantity; here rolled along the profile), and
          PFE_addon_t = SF_electricity * S0 * annual_volume * (tenor - t)
          * MF, SF_electricity = 40% per the CRE52 commodity supervisory
          factor table (electricity bucket), MF = 1 unmargined or
          1.5*sqrt(MPR/250) capped at 1 when margined (CRE52.48/52.52 basis).
   MVA  = sum_t IM * s_f * DF_t when the CSA carries initial margin
          (IM input; note emitted when IM = 0).
   ColVA= sum_t E[collateral balance]_t * s_c * DF_t, s_c the collateral
          remuneration spread (bps — OIS vs contractual collateral rate).
   Total XVA stack waterfall: CVA - DVA + FVA + KVA + MVA + ColVA.

9. Wrong-way risk (WWR)
   Qualitative flag + adjustable EE multiplier as before:
       CVA_wwr = sum_t EE_t * (1 + wwr_correlation) * mPD_t * (1-R) * DF_t
   RENEWABLE-PPA-SPECIFIC channel, quantified: high renewables output
   depresses merchant prices (merit-order effect), so a fixed-price-
   receiving generator's exposure peaks exactly in high-RES/low-price
   states. The user's RES-output/price correlation rho maps to an EE
   uplift via   multiplier(rho) = 1 + KAPPA_RES_WWR * rho   with
   KAPPA_RES_WWR = 0.5 — a HAND-AUTHORED pass-through scaling (labeled
   model assumption, not a calibrated copula). A full sweep of rho in
   [0, 1] is returned for charting.

10. Netting sets (POST /netting)
   Two-three PPAs with the SAME counterparty on the SAME merchant-price
   lattice (single price factor — documented). Per period:
       gross EE_t = sum_i E[max(MtM_i, 0)]
       net EE_t   = E[max(sum_i MtM_i, 0)]
   Node-wise max(sum x_i, 0) <= sum max(x_i, 0), so net <= gross at EVERY
   period — asserted at runtime. Netting benefit % = 1 - CVA_net/CVA_gross,
   guaranteed in [0, 100].

11. Sustainability x financial overlay
   Counterparty TRANSITION-RISK adjustment: user transition-readiness
   score (0-100, higher = better prepared) maps to a PD multiplier
       pd_mult = 1 + (50 - score) / 100        (score 0 -> 1.5x,
                                                50 -> 1.0x, 100 -> 0.5x)
   — a HAND-AUTHORED, clearly-labeled mapping (not a calibrated model);
   CVA is linear in marginal PD so the adjusted CVA = CVA * pd_mult
   (first-order, cumulative-PD cap ignored — documented). A "green CSA"
   panel describes sustainability-linked collateral terms (qualitative).

Registered in server.py with prefix /api/v1/ppa-xva.
"""
from __future__ import annotations

import math
from typing import List, Literal, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/ppa-xva", tags=["PPA XVA Engine"])

# ---------------------------------------------------------------------------
# Hand-authored rating-based cumulative PD table (%, by tenor in years).
# Basis: published rating-agency long-term global corporate average cumulative
# default rates (S&P 1981-2023 / Moody's 1983-2023 studies) — rounded and
# APPROXIMATE; hand-authored for transparency, not a licensed data feed.
# ---------------------------------------------------------------------------
PD_TENORS_YEARS = [1, 2, 3, 5, 7, 10, 15, 20]

CUMULATIVE_PD_TABLE_PCT = {
    "AAA": [0.01, 0.03, 0.13, 0.35, 0.51, 0.70, 0.90, 1.10],
    "AA":  [0.02, 0.06, 0.12, 0.30, 0.50, 0.75, 1.05, 1.35],
    "A":   [0.05, 0.13, 0.22, 0.45, 0.72, 1.20, 1.90, 2.60],
    "BBB": [0.15, 0.40, 0.70, 1.50, 2.30, 3.50, 5.20, 6.80],
    "BB":  [0.60, 1.90, 3.40, 6.50, 9.10, 12.50, 16.50, 19.50],
    "B":   [3.30, 7.80, 11.70, 17.50, 21.50, 25.00, 29.50, 32.50],
    "CCC": [28.30, 38.00, 44.00, 50.50, 54.50, 58.00, 61.00, 63.00],
}

PD_TABLE_LABEL = (
    "Hand-authored cumulative PD curve derived from published rating-agency "
    "long-term corporate default studies (S&P Global 1981-2023 / Moody's "
    "1983-2023 average cumulative default rates) — APPROXIMATE, rounded; "
    "linear interpolation between tenors, last marginal hazard extrapolated "
    "beyond 20y, cumulative PD capped at 99%."
)

Rating = Literal["AAA", "AA", "A", "BBB", "BB", "B", "CCC"]
Holder = Literal["generator", "offtaker"]
CsaType = Literal["two_way", "one_way_cpty_posts", "one_way_we_post", "none"]
CollateralType = Literal["cash", "government_bonds", "corporate_bonds", "equities"]

# ---------------------------------------------------------------------------
# Hand-authored ANNUAL rating-migration matrix (%, row = from, col = to).
# Basis: long-term average one-year global corporate transition rates per
# published S&P/Moody's studies — ROUNDED AND APPROXIMATE; NR (withdrawn)
# probability reallocated to the diagonal so every row sums to exactly 100.
# D is absorbing. Hand-authored for transparency, not a licensed data feed.
# ---------------------------------------------------------------------------
MIGRATION_STATES = ["AAA", "AA", "A", "BBB", "BB", "B", "CCC", "D"]

MIGRATION_MATRIX_PCT = {
    "AAA": [89.40, 9.60, 0.70, 0.15, 0.10, 0.03, 0.01, 0.01],
    "AA":  [0.55, 90.05, 8.50, 0.60, 0.15, 0.10, 0.02, 0.03],
    "A":   [0.03, 1.80, 92.00, 5.40, 0.45, 0.20, 0.05, 0.07],
    "BBB": [0.01, 0.12, 3.60, 91.20, 4.00, 0.70, 0.15, 0.22],
    "BB":  [0.01, 0.04, 0.20, 5.20, 84.50, 8.20, 0.85, 1.00],
    "B":   [0.00, 0.03, 0.12, 0.25, 5.10, 84.00, 6.00, 4.50],
    "CCC": [0.00, 0.00, 0.10, 0.20, 0.70, 12.00, 60.00, 27.00],
    "D":   [0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 100.00],
}

MIGRATION_LABEL = (
    "Hand-authored annual rating-migration matrix — long-term average one-year "
    "corporate transition rates per published S&P/Moody's agency studies, rounded "
    "and APPROXIMATE (NR withdrawals reallocated to the diagonal; D absorbing). "
    "Cumulative PD_mig(t) = start-rating state vector propagated t years, D mass."
)

# ---------------------------------------------------------------------------
# SA-CCR (CRE52) constants used by the KVA proxy — real Basel parameters,
# applied in a documented simplified profile roll (labeled proxy).
# ---------------------------------------------------------------------------
SA_CCR_ALPHA = 1.4                    # CRE52.1 — the real Basel alpha
SA_CCR_COMMODITY_SF_PCT = {           # CRE52 commodity supervisory factors
    "electricity": 40.0,              # electricity bucket
    "oil_gas": 18.0,
    "metals": 18.0,
    "agricultural": 18.0,
    "other": 18.0,
}
SA_CCR_LABEL = (
    "SA-CCR-style EAD = alpha x (RC + PFE add-on) with the real Basel alpha = 1.4 "
    "and the CRE52 commodity supervisory-factor table (electricity 40%). RC is "
    "proxied by the residual expected exposure along the profile and the add-on by "
    "SF x S0 x remaining contracted volume x MF — a documented PROXY, not a full "
    "SA-CCR netting-set calculation."
)

# CRE22-style standard supervisory collateral haircuts — hand-authored,
# APPROXIMATE (comprehensive-approach haircut basis, rounded).
COLLATERAL_HAIRCUTS_PCT = {
    "cash": 0.0,
    "government_bonds": 2.0,
    "corporate_bonds": 6.0,
    "equities": 20.0,
}
HAIRCUT_LABEL = (
    "CRE22-style standard supervisory haircut basis — hand-authored, rounded, "
    "APPROXIMATE (cash 0%, sovereigns ~2%, IG corporates ~6%, main-index "
    "equities ~20%). Collateral value = amount called x (1 - haircut)."
)

KAPPA_RES_WWR = 0.5  # hand-authored RES-correlation -> EE-uplift pass-through (labeled)


def _cumulative_pd(rating: str, t: float) -> float:
    """Cumulative PD (decimal) at year t: linear interp on the hand-authored
    table; flat-hazard extrapolation beyond the last tabulated tenor."""
    curve = CUMULATIVE_PD_TABLE_PCT[rating]
    tenors = PD_TENORS_YEARS
    if t <= 0:
        return 0.0
    if t <= tenors[0]:
        return curve[0] / 100.0 * (t / tenors[0])
    if t >= tenors[-1]:
        # extrapolate with the last-segment marginal hazard, cap at 99 %
        last_haz = (curve[-1] - curve[-2]) / (tenors[-1] - tenors[-2])
        return min((curve[-1] + last_haz * (t - tenors[-1])) / 100.0, 0.99)
    for i in range(1, len(tenors)):
        if t <= tenors[i]:
            w = (t - tenors[i - 1]) / (tenors[i] - tenors[i - 1])
            return (curve[i - 1] + w * (curve[i] - curve[i - 1])) / 100.0
    return curve[-1] / 100.0  # unreachable


def _migration_cumulative_pds(rating: str, horizon: int) -> List[float]:
    """Cumulative PD (decimal) per year 1..horizon from the hand-authored
    annual migration matrix: state vector propagated pi_t = pi_{t-1} * M,
    cumulative PD(t) = D-state mass at t. Deterministic matrix powers."""
    m = [[MIGRATION_MATRIX_PCT[s][c] / 100.0 for c in range(len(MIGRATION_STATES))]
         for s in MIGRATION_STATES]
    pi = [1.0 if s == rating else 0.0 for s in MIGRATION_STATES]
    out: List[float] = []
    for _ in range(horizon):
        pi = [sum(pi[i] * m[i][j] for i in range(len(pi))) for j in range(len(pi))]
        out.append(min(pi[-1], 0.99))
    return out


def _exposure_quantile(nodes: List[tuple], q: float) -> float:
    """q-quantile of the node exposure distribution [(exposure, prob), ...]:
    smallest exposure e with P(exposure <= e) >= q (exact lattice probs)."""
    ordered = sorted(nodes, key=lambda x: x[0])
    cum = 0.0
    for e, prob in ordered:
        cum += prob
        if cum >= q - 1e-12:
            return e
    return ordered[-1][0] if ordered else 0.0


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class CvaRequest(BaseModel):
    # Contract terms
    fixed_price_usd_mwh: float = Field(55.0, gt=0, description="PPA fixed price $/MWh")
    annual_volume_mwh: float = Field(250_000, gt=0, description="Contracted annual volume, MWh")
    tenor_years: int = Field(15, ge=1, le=30, description="Remaining PPA tenor, years")
    holder: Holder = Field(
        "generator",
        description="Whose exposure: 'generator' receives fixed (MtM = fixed - price); "
                    "'offtaker' pays fixed (MtM = price - fixed).",
    )
    # Merchant price lattice parameters (deterministic binomial — no PRNG)
    current_merchant_price_usd_mwh: float = Field(48.0, gt=0)
    annual_drift_pct: float = Field(1.0, ge=-20, le=20, description="Annual merchant price drift %")
    annual_vol_pct: float = Field(22.0, gt=0, le=100, description="Annual merchant price volatility %")
    # Credit inputs
    counterparty_rating: Rating = Field("BBB")
    own_rating: Rating = Field("BBB", description="Own rating for the symmetric DVA leg")
    recovery_rate: float = Field(0.40, ge=0, le=1, description="Counterparty recovery rate (LGD = 1-R)")
    own_recovery_rate: float = Field(0.40, ge=0, le=1)
    discount_rate_pct: float = Field(4.5, ge=0, le=25, description="Flat risk-free discount rate %")
    use_rating_transitions: bool = Field(
        False, description="Drive headline CVA from the hand-authored annual migration matrix "
                           "(time-varying PD) instead of the static curve — both always reported")
    # Collateral / CSA depth
    collateral_threshold_usd: float = Field(
        5_000_000, ge=0,
        description="CSA threshold $ — exposure above this is collateralised",
    )
    margin_period_days: int = Field(10, ge=0, le=90, description="Margin period of risk, days")
    mta_usd: float = Field(0, ge=0, description="Minimum transfer amount $ — calls below this are waived")
    rounding_usd: float = Field(0, ge=0, description="Collateral rounding lot $ (calls rounded DOWN)")
    csa_type: CsaType = Field(
        "two_way",
        description="CSA direction: two_way, one_way_cpty_posts (protects us), "
                    "one_way_we_post (no CVA benefit), none (uncollateralised)")
    collateral_type: CollateralType = Field(
        "cash", description="Collateral asset — drives the CRE22-style haircut (labeled table)")
    initial_margin_usd: float = Field(
        0, ge=0, description="Initial margin under the CSA, $ — funds the MVA leg when > 0")
    netting_agreement: bool = Field(False, description="Contract sits under a netting master agreement (qualitative)")
    # XVA stack economics
    funding_spread_bps: float = Field(
        120.0, ge=0, le=1000, description="Own funding spread over risk-free, bps — FVA/MVA driver")
    cost_of_capital_pct: float = Field(
        10.0, ge=0, le=30, description="Hurdle rate on regulatory capital — KVA driver")
    capital_risk_weight_pct: float = Field(
        100.0, ge=0, le=1250, description="Counterparty risk weight for the KVA capital proxy (100% unrated corporate)")
    colva_spread_bps: float = Field(
        15.0, ge=-200, le=200, description="Collateral remuneration spread (contractual rate vs OIS), bps — ColVA driver")
    # Wrong-way risk
    counterparty_is_merchant_utility: bool = Field(
        True, description="Counterparty credit is driven by merchant power prices (WWR trigger)")
    wwr_correlation: float = Field(
        0.25, ge=0, le=1,
        description="WWR correlation multiplier on EE — MODEL ASSUMPTION, not calibrated")
    res_output_price_correlation: float = Field(
        0.6, ge=0, le=1,
        description="RES-output vs merchant-price correlation (merit-order channel) — "
                    "maps to an EE uplift via 1 + 0.5 x rho (hand-authored pass-through, labeled)")
    # Sustainability x financial
    counterparty_transition_score: float = Field(
        50.0, ge=0, le=100,
        description="Counterparty climate-transition readiness score, 0-100 (higher = better). "
                    "PD multiplier = 1 + (50 - score)/100 — hand-authored mapping, labeled")


class ExposurePoint(BaseModel):
    year: int
    ee_uncollateralized: float
    ee_collateralized: float
    ene: float
    pfe_95: float
    pfe_99: float
    expected_collateral: float
    marginal_pd_cpty: float
    cumulative_pd_cpty: float
    marginal_pd_cpty_migration: float
    cumulative_pd_cpty_migration: float
    marginal_pd_own: float
    discount_factor: float
    lattice_nodes: int
    price_low: float
    price_high: float
    expected_price: float


class CvaResponse(BaseModel):
    ee_profile: List[ExposurePoint]
    cva_uncollateralized: float
    cva_collateralized: float
    cva_wwr_adjusted: float
    dva: float
    net_bilateral_adjustment_uncoll: float
    net_bilateral_adjustment_coll: float
    peak_ee: float
    peak_ee_year: int
    epe_time_avg: float
    contract_notional_usd: float
    # PFE profile summary
    peak_pfe_95: float
    peak_pfe_95_year: int
    peak_pfe_99: float
    peak_pfe_99_year: int
    pfe_95_at_1y: float
    pfe_99_at_1y: float
    # Full XVA stack
    fva: float
    fca: float
    fba: float
    kva: float
    mva: float
    colva: float
    total_xva: float
    xva_waterfall: List[dict]
    kva_detail: dict
    mva_note: str
    # CSA depth
    csa_terms: dict
    mpr_sensitivity: List[dict]
    collateral_haircut_note: str
    # Rating transitions
    rating_transition: dict
    # Sustainability x financial
    transition_risk_adjustment: dict
    green_csa_note: str
    renewable_wwr: dict
    wrong_way_risk_flag: bool
    wrong_way_risk_note: str
    netting_note: str
    lattice: dict
    method_notes: List[str]


# ---------------------------------------------------------------------------
# Core calculation
# ---------------------------------------------------------------------------

def _collateral_called(mtm: float, threshold: float, mta: float, rounding: float,
                       cpty_posts: bool) -> float:
    """Collateral the counterparty must post at a node under the CSA:
    excess over threshold, waived below MTA, rounded DOWN to the lot."""
    if not cpty_posts:
        return 0.0
    c = max(mtm - threshold, 0.0)
    if c < mta:
        return 0.0
    if rounding > 0:
        c = math.floor(c / rounding) * rounding
    return c


@router.post("/cva", response_model=CvaResponse, summary="Full XVA stack (CVA/DVA/FVA/KVA/MVA/ColVA) on a PPA via deterministic binomial price lattice")
def compute_cva(req: CvaRequest) -> CvaResponse:
    """See module docstring for the full documented method. Deterministic:
    identical inputs always produce identical outputs (no PRNG)."""
    sigma = req.annual_vol_pct / 100.0
    mu = req.annual_drift_pct / 100.0
    r = req.discount_rate_pct / 100.0
    dt = 1.0
    n = req.tenor_years

    u = math.exp(sigma * math.sqrt(dt))
    d = 1.0 / u
    if u == d:
        raise HTTPException(status_code=422, detail="Volatility too small — lattice degenerate")
    p_raw = (math.exp(mu * dt) - d) / (u - d)
    p = min(max(p_raw, 0.001), 0.999)
    p_clamped = abs(p - p_raw) > 1e-12

    sign = 1.0 if req.holder == "generator" else -1.0
    cpty_posts = req.csa_type in ("two_way", "one_way_cpty_posts")
    haircut = COLLATERAL_HAIRCUTS_PCT[req.collateral_type] / 100.0
    s_f = req.funding_spread_bps / 10_000.0
    s_c = req.colva_spread_bps / 10_000.0
    coc = req.cost_of_capital_pct / 100.0
    rw = req.capital_risk_weight_pct / 100.0
    sf_elec = SA_CCR_COMMODITY_SF_PCT["electricity"] / 100.0

    def annuity(years_remaining: int) -> float:
        return sum((1.0 + r) ** -k for k in range(1, years_remaining + 1))

    def exposures_at(t: int, mpr_days: int):
        """Node sweep at year t for a given MPR: returns (ee, ee_coll, ene,
        expected_collateral, exposure_nodes[(exp, prob)], prices, exp_price)."""
        remaining = n - t
        ann = annuity(remaining)
        mpr_years = mpr_days / 365.0
        ee = ee_c = ene = ecoll = exp_price = 0.0
        prices, exp_nodes = [], []
        for j in range(t + 1):
            price = req.current_merchant_price_usd_mwh * (u ** j) * (d ** (t - j))
            prob = math.comb(t, j) * (p ** j) * ((1.0 - p) ** (t - j))
            prices.append(price)
            exp_price += prob * price
            mtm = sign * (req.fixed_price_usd_mwh - price) * req.annual_volume_mwh * ann
            pos = max(mtm, 0.0)
            neg = max(-mtm, 0.0)
            # CSA: collateral called (threshold/MTA/rounding/direction), haircut-valued
            called = _collateral_called(mtm, req.collateral_threshold_usd,
                                        req.mta_usd, req.rounding_usd, cpty_posts)
            eff_coll = called * (1.0 - haircut)
            # Residual exposure incl. margin-period move (labeled approximation)
            mpr_addon = price * req.annual_volume_mwh * sigma * math.sqrt(mpr_years)
            pos_coll = max(min(mtm, mtm - eff_coll + mpr_addon), 0.0)
            ee += prob * pos
            ee_c += prob * pos_coll
            ene += prob * neg
            ecoll += prob * eff_coll
            exp_nodes.append((pos, prob))
        return ee, ee_c, ene, ecoll, exp_nodes, prices, exp_price

    # Migration-based cumulative PD paths (always computed for comparison)
    cpd_mig_cpty = _migration_cumulative_pds(req.counterparty_rating, n)

    profile: List[ExposurePoint] = []
    cva_uncoll = cva_coll = cva_wwr = dva = 0.0
    cva_uncoll_mig = cva_coll_mig = 0.0
    fca = fba = kva = mva = colva = 0.0
    peak_ee, peak_ee_year, epe_sum = 0.0, 0, 0.0
    peak_pfe95, peak_pfe95_yr, peak_pfe99, peak_pfe99_yr = 0.0, 0, 0.0, 0
    pfe95_1y = pfe99_1y = 0.0
    mpr_cva = {5: 0.0, 10: 0.0, 20: 0.0}
    kva_capital_path: List[dict] = []

    cpd_prev_cpty = 0.0
    cpd_prev_own = 0.0
    cpd_prev_mig = 0.0
    lgd_cpty = 1.0 - req.recovery_rate
    lgd_own = 1.0 - req.own_recovery_rate

    for t in range(1, n + 1):
        ee, ee_c, ene, ecoll, exp_nodes, prices, exp_price = exposures_at(t, req.margin_period_days)

        pfe95 = _exposure_quantile(exp_nodes, 0.95)
        pfe99 = _exposure_quantile(exp_nodes, 0.99)
        # Structural guarantee (quantile monotonicity) — asserted at runtime:
        assert pfe99 >= pfe95 - 1e-9, f"PFE quantile monotonicity violated at year {t}"
        if t == 1:
            pfe95_1y, pfe99_1y = pfe95, pfe99
        if pfe95 > peak_pfe95:
            peak_pfe95, peak_pfe95_yr = pfe95, t
        if pfe99 > peak_pfe99:
            peak_pfe99, peak_pfe99_yr = pfe99, t

        cpd_cpty = _cumulative_pd(req.counterparty_rating, t)
        cpd_own = _cumulative_pd(req.own_rating, t)
        cpd_mig = cpd_mig_cpty[t - 1]
        mpd_cpty = max(cpd_cpty - cpd_prev_cpty, 0.0)
        mpd_own = max(cpd_own - cpd_prev_own, 0.0)
        mpd_mig = max(cpd_mig - cpd_prev_mig, 0.0)
        cpd_prev_cpty, cpd_prev_own, cpd_prev_mig = cpd_cpty, cpd_own, cpd_mig

        df = (1.0 + r) ** -t

        cva_uncoll += ee * mpd_cpty * lgd_cpty * df
        cva_coll += ee_c * mpd_cpty * lgd_cpty * df
        cva_wwr += ee * (1.0 + req.wwr_correlation) * mpd_cpty * lgd_cpty * df
        cva_uncoll_mig += ee * mpd_mig * lgd_cpty * df
        cva_coll_mig += ee_c * mpd_mig * lgd_cpty * df
        dva += ene * mpd_own * lgd_own * df

        # ── XVA stack legs (documented proxies) ─────────────────────────────
        fca += ee_c * s_f * df                       # funded residual exposure
        fba += ene * s_f * df
        colva += ecoll * s_c * df                    # expected collateral balance
        mva += req.initial_margin_usd * s_f * df
        # KVA: SA-CCR-style EAD along the profile (labeled proxy)
        remaining_vol = req.annual_volume_mwh * (n - t)
        mf = 1.0 if not cpty_posts else min(1.0, 1.5 * math.sqrt(max(req.margin_period_days, 1) / 250.0))
        pfe_addon_reg = sf_elec * req.current_merchant_price_usd_mwh * remaining_vol * mf
        ead_t = SA_CCR_ALPHA * (ee_c + pfe_addon_reg)
        capital_t = 0.08 * rw * ead_t
        kva += capital_t * coc * df
        kva_capital_path.append({
            "year": t, "ead_usd": round(ead_t, 2), "capital_usd": round(capital_t, 2),
            "pfe_addon_usd": round(pfe_addon_reg, 2),
        })

        # MPR sensitivity (5/10/20d) on the collateralised CVA
        for m_days in mpr_cva:
            _, ee_c_m, _, _, _, _, _ = exposures_at(t, m_days)
            mpr_cva[m_days] += ee_c_m * mpd_cpty * lgd_cpty * df

        if ee > peak_ee:
            peak_ee, peak_ee_year = ee, t
        epe_sum += ee

        profile.append(ExposurePoint(
            year=t,
            ee_uncollateralized=round(ee, 2),
            ee_collateralized=round(ee_c, 2),
            ene=round(ene, 2),
            pfe_95=round(pfe95, 2),
            pfe_99=round(pfe99, 2),
            expected_collateral=round(ecoll, 2),
            marginal_pd_cpty=round(mpd_cpty, 6),
            cumulative_pd_cpty=round(cpd_cpty, 6),
            marginal_pd_cpty_migration=round(mpd_mig, 6),
            cumulative_pd_cpty_migration=round(cpd_mig, 6),
            marginal_pd_own=round(mpd_own, 6),
            discount_factor=round(df, 6),
            lattice_nodes=t + 1,
            price_low=round(min(prices), 2),
            price_high=round(max(prices), 2),
            expected_price=round(exp_price, 2),
        ))

    # ── Headline CVA basis: static curve (default) or migration matrix ──────
    if req.use_rating_transitions:
        cva_uncoll_head, cva_coll_head = cva_uncoll_mig, cva_coll_mig
    else:
        cva_uncoll_head, cva_coll_head = cva_uncoll, cva_coll

    fva = fca - fba
    total_xva = cva_coll_head - dva + fva + kva + mva + colva

    # ── WWR narrative + renewable-specific sweep ─────────────────────────────
    wwr_active = req.counterparty_is_merchant_utility and req.holder == "generator"
    if wwr_active:
        wwr_note = (
            "WRONG-WAY RISK: counterparty is a merchant utility and the exposure holder is the "
            "fixed-price receiver (generator) — exposure is largest exactly when merchant power "
            "prices fall, the same state that deteriorates a merchant buyer's credit. The "
            f"WWR-adjusted CVA scales EE by (1 + {req.wwr_correlation:.2f}) — an adjustable model "
            "assumption, not a calibrated correlation."
        )
    elif req.counterparty_is_merchant_utility:
        wwr_note = (
            "Counterparty is a merchant utility but the exposure holder is the offtaker: exposure "
            "grows when prices RISE, which generally supports merchant-utility credit — this is "
            "right-way rather than wrong-way risk; the multiplier output is shown for sensitivity only."
        )
    else:
        wwr_note = (
            "Counterparty credit not flagged as merchant-power-price driven — no structural WWR "
            "channel identified; the multiplier output is shown for sensitivity only."
        )

    res_rho = req.res_output_price_correlation
    res_mult = 1.0 + KAPPA_RES_WWR * res_rho
    renewable_wwr = {
        "narrative": (
            "Renewable-PPA-specific WWR channel (merit-order effect): hours of high renewables "
            "output depress merchant prices, so a fixed-price-receiving generator's positive MtM "
            "peaks exactly in high-RES/low-price states. If the counterparty is a merchant buyer, "
            "its credit weakens in the same states — exposure and default probability rise together."
        ),
        "res_output_price_correlation": res_rho,
        "kappa_pass_through": KAPPA_RES_WWR,
        "ee_multiplier": round(res_mult, 4),
        "cva_res_wwr_adjusted": round(cva_uncoll * res_mult, 2),
        "label": ("EE multiplier = 1 + kappa x rho with kappa = 0.5 — HAND-AUTHORED pass-through "
                  "scaling (model assumption, not a calibrated copula)."),
        "sweep": [
            {
                "rho": round(rho_i / 10.0, 1),
                "ee_multiplier": round(1.0 + KAPPA_RES_WWR * rho_i / 10.0, 3),
                "cva": round(cva_uncoll * (1.0 + KAPPA_RES_WWR * rho_i / 10.0), 2),
            }
            for rho_i in range(0, 11)
        ],
    }

    # ── Sustainability x financial: transition-score PD adjustment ──────────
    score = req.counterparty_transition_score
    pd_mult = 1.0 + (50.0 - score) / 100.0
    transition_risk_adjustment = {
        "counterparty_transition_score": score,
        "pd_multiplier": round(pd_mult, 4),
        "mapping": "PD multiplier = 1 + (50 - score)/100  (score 0 -> 1.5x, 50 -> 1.0x, 100 -> 0.5x)",
        "label": ("HAND-AUTHORED transition-readiness -> PD mapping, clearly a model assumption — "
                  "CVA is linear in marginal PD, so adjusted CVA = CVA x multiplier (first-order; "
                  "cumulative-PD cap ignored)."),
        "cva_uncollateralized_adjusted": round(cva_uncoll_head * pd_mult, 2),
        "cva_collateralized_adjusted": round(cva_coll_head * pd_mult, 2),
        "delta_vs_base_usd": round(cva_coll_head * (pd_mult - 1.0), 2),
    }

    green_csa_note = (
        "GREEN CSA (qualitative): sustainability-linked collateral terms seen in recent CSAs include "
        "(i) threshold/spread ratchets tied to the counterparty's decarbonisation KPIs (threshold "
        "tightens if targets are missed), (ii) eligible-collateral schedules that admit green bonds "
        "at reduced haircuts, and (iii) margin-rate rebates funded by sustainability-linked loan "
        "mechanics. None of these change the maths above unless the ratchet triggers — model the "
        "trigger by re-running with the tightened threshold/haircut."
    )

    netting_note = (
        "Netting master agreement flagged: for a single PPA there is nothing to net against, so the "
        "numbers here are unchanged — use POST /api/v1/ppa-xva/netting to analyse a 2-3 contract "
        "netting set against the same counterparty (netted vs gross EE and the netting benefit %)."
        if req.netting_agreement else
        "No netting agreement: exposure is gross by construction for this single contract. "
        "POST /api/v1/ppa-xva/netting quantifies what a master agreement would save."
    )

    notional = req.fixed_price_usd_mwh * req.annual_volume_mwh * n

    xva_waterfall = [
        {"component": "CVA", "value": round(cva_coll_head, 2),
         "note": "counterparty credit (collateralised, headline basis)"},
        {"component": "DVA", "value": round(-dva, 2), "note": "own credit (benefit)"},
        {"component": "FVA", "value": round(fva, 2),
         "note": f"funding, {req.funding_spread_bps:.0f}bp spread (FCA - FBA)"},
        {"component": "KVA", "value": round(kva, 2),
         "note": f"capital, SA-CCR-style proxy at {req.cost_of_capital_pct:.0f}% CoC"},
        {"component": "MVA", "value": round(mva, 2),
         "note": "initial-margin funding" if req.initial_margin_usd > 0 else "no IM under CSA — nil"},
        {"component": "ColVA", "value": round(colva, 2),
         "note": f"collateral remuneration spread {req.colva_spread_bps:.0f}bp"},
        {"component": "Total XVA", "value": round(total_xva, 2), "note": "CVA - DVA + FVA + KVA + MVA + ColVA"},
    ]

    mva_note = (
        f"MVA = sum IM x funding spread x DF = {mva:,.0f} USD on IM of {req.initial_margin_usd:,.0f}."
        if req.initial_margin_usd > 0 else
        "CSA carries no initial margin (IM = 0) — MVA is nil. If the CSA moves to IM (e.g. a cleared "
        "or UMR-style schedule), MVA = sum_t IM x funding spread x DF_t; set initial_margin_usd to size it."
    )

    method_notes = [
        "Deterministic recombining CRR binomial lattice, annual steps — no PRNG anywhere.",
        f"u={u:.5f}, d={d:.5f}, p={p:.5f}" + (" (CLAMPED — drift inconsistent with vol at this step size)" if p_clamped else ""),
        "Node price treated as flat forward for remaining deliveries (approximation).",
        "CVA = Σ EE_t × marginal PD_t × (1−R) × DF_t; DVA symmetric on ENE with own rating.",
        "PFE95/99 = exact lattice quantiles of node exposure max(MtM,0) per period; PFE99 ≥ PFE95 by construction.",
        "CSA: collateral called = floor(max(MtM−threshold,0)/rounding)×rounding, waived < MTA, valued at (1−haircut); "
        f"residual exposure includes the σ√(MPR) margin-period add-on (MPR={req.margin_period_days}d — approximation). "
        f"CSA type: {req.csa_type}; collateral: {req.collateral_type} (haircut {COLLATERAL_HAIRCUTS_PCT[req.collateral_type]:.1f}%).",
        "FVA = Σ (EE_coll − ENE) legs × funding spread × DF — linear in the spread by construction.",
        SA_CCR_LABEL,
        PD_TABLE_LABEL,
        MIGRATION_LABEL,
        "Survival-probability cross-terms omitted (first-order, conservative for CVA).",
        f"Headline CVA basis: {'migration matrix (time-varying PD)' if req.use_rating_transitions else 'static curve'} — both reported.",
    ]

    return CvaResponse(
        ee_profile=profile,
        cva_uncollateralized=round(cva_uncoll_head, 2),
        cva_collateralized=round(cva_coll_head, 2),
        cva_wwr_adjusted=round(cva_wwr, 2),
        dva=round(dva, 2),
        net_bilateral_adjustment_uncoll=round(cva_uncoll_head - dva, 2),
        net_bilateral_adjustment_coll=round(cva_coll_head - dva, 2),
        peak_ee=round(peak_ee, 2),
        peak_ee_year=peak_ee_year,
        epe_time_avg=round(epe_sum / n, 2),
        contract_notional_usd=round(notional, 2),
        peak_pfe_95=round(peak_pfe95, 2),
        peak_pfe_95_year=peak_pfe95_yr,
        peak_pfe_99=round(peak_pfe99, 2),
        peak_pfe_99_year=peak_pfe99_yr,
        pfe_95_at_1y=round(pfe95_1y, 2),
        pfe_99_at_1y=round(pfe99_1y, 2),
        fva=round(fva, 2),
        fca=round(fca, 2),
        fba=round(fba, 2),
        kva=round(kva, 2),
        mva=round(mva, 2),
        colva=round(colva, 2),
        total_xva=round(total_xva, 2),
        xva_waterfall=xva_waterfall,
        kva_detail={
            "label": SA_CCR_LABEL,
            "alpha": SA_CCR_ALPHA,
            "supervisory_factor_electricity_pct": SA_CCR_COMMODITY_SF_PCT["electricity"],
            "risk_weight_pct": req.capital_risk_weight_pct,
            "cost_of_capital_pct": req.cost_of_capital_pct,
            "capital_ratio_pct": 8.0,
            "capital_path": kva_capital_path,
        },
        mva_note=mva_note,
        csa_terms={
            "csa_type": req.csa_type,
            "counterparty_posts_to_us": cpty_posts,
            "threshold_usd": req.collateral_threshold_usd,
            "mta_usd": req.mta_usd,
            "rounding_usd": req.rounding_usd,
            "margin_period_days": req.margin_period_days,
            "collateral_type": req.collateral_type,
            "haircut_pct": COLLATERAL_HAIRCUTS_PCT[req.collateral_type],
            "initial_margin_usd": req.initial_margin_usd,
            "note": ("One-way CSA in our favour — counterparty posts, we do not." if req.csa_type == "one_way_cpty_posts"
                     else "One-way CSA against us — we post, no CVA benefit (collateralised = uncollateralised on the CVA leg)." if req.csa_type == "one_way_we_post"
                     else "No CSA — fully uncollateralised." if req.csa_type == "none"
                     else "Two-way CSA — symmetric posting above the threshold."),
        },
        mpr_sensitivity=[
            {"mpr_days": m_days, "cva_collateralized": round(v, 2),
             "delta_vs_base": round(v - cva_coll, 2)}
            for m_days, v in sorted(mpr_cva.items())
        ],
        collateral_haircut_note=HAIRCUT_LABEL,
        rating_transition={
            "label": MIGRATION_LABEL,
            "start_rating": req.counterparty_rating,
            "drives_headline": req.use_rating_transitions,
            "cva_uncoll_static": round(cva_uncoll, 2),
            "cva_uncoll_migration": round(cva_uncoll_mig, 2),
            "cva_coll_static": round(cva_coll, 2),
            "cva_coll_migration": round(cva_coll_mig, 2),
            "delta_migration_vs_static_uncoll": round(cva_uncoll_mig - cva_uncoll, 2),
            "curve_comparison": [
                {"year": t, "cum_pd_static": round(_cumulative_pd(req.counterparty_rating, t), 6),
                 "cum_pd_migration": round(cpd_mig_cpty[t - 1], 6)}
                for t in range(1, n + 1)
            ],
        },
        transition_risk_adjustment=transition_risk_adjustment,
        green_csa_note=green_csa_note,
        renewable_wwr=renewable_wwr,
        wrong_way_risk_flag=wwr_active,
        wrong_way_risk_note=wwr_note,
        netting_note=netting_note,
        lattice={
            "type": "recombining_binomial_CRR",
            "steps": n,
            "dt_years": dt,
            "u": round(u, 6),
            "d": round(d, 6),
            "p_up": round(p, 6),
            "p_clamped": p_clamped,
            "deterministic": True,
        },
        method_notes=method_notes,
    )


# ---------------------------------------------------------------------------
# Netting sets — 2-3 PPAs, same counterparty, same merchant-price factor
# ---------------------------------------------------------------------------

class NettedPpaContract(BaseModel):
    label: str = Field("PPA", max_length=60)
    fixed_price_usd_mwh: float = Field(55.0, gt=0)
    annual_volume_mwh: float = Field(250_000, gt=0)
    tenor_years: int = Field(15, ge=1, le=30)
    holder: Holder = Field("generator", description="Our side of this contract — opposing directions allowed")


class NettingRequest(BaseModel):
    contracts: List[NettedPpaContract] = Field(
        ..., min_length=2, max_length=3,
        description="2-3 PPAs facing the SAME counterparty on the same merchant-price factor")
    current_merchant_price_usd_mwh: float = Field(48.0, gt=0)
    annual_drift_pct: float = Field(1.0, ge=-20, le=20)
    annual_vol_pct: float = Field(22.0, gt=0, le=100)
    counterparty_rating: Rating = Field("BBB")
    recovery_rate: float = Field(0.40, ge=0, le=1)
    discount_rate_pct: float = Field(4.5, ge=0, le=25)


class NettingPeriod(BaseModel):
    year: int
    gross_ee: float
    net_ee: float
    netting_benefit_pct: float


class NettingResponse(BaseModel):
    profile: List[NettingPeriod]
    cva_gross: float
    cva_net: float
    netting_benefit_pct: float
    standalone_cva: List[dict]
    peak_gross_ee: float
    peak_net_ee: float
    method_notes: List[str]


@router.post("/netting", response_model=NettingResponse, summary="Netting-set analysis — netted vs gross EE for 2-3 PPAs with the same counterparty")
def compute_netting(req: NettingRequest) -> NettingResponse:
    """Single merchant-price factor (documented): all contracts are marked on
    the SAME lattice node, so netted MtM at a node is the plain sum. Node-wise
    max(sum, 0) <= sum(max, 0) guarantees net EE <= gross EE at every period —
    asserted at runtime. Deterministic — no PRNG."""
    sigma = req.annual_vol_pct / 100.0
    mu = req.annual_drift_pct / 100.0
    r = req.discount_rate_pct / 100.0
    u = math.exp(sigma * math.sqrt(1.0))
    d = 1.0 / u
    p = min(max((math.exp(mu) - d) / (u - d), 0.001), 0.999)
    n = max(c.tenor_years for c in req.contracts)
    lgd = 1.0 - req.recovery_rate

    def annuity(years_remaining: int) -> float:
        return sum((1.0 + r) ** -k for k in range(1, years_remaining + 1))

    profile: List[NettingPeriod] = []
    cva_gross = cva_net = 0.0
    standalone = [0.0] * len(req.contracts)
    peak_gross = peak_net = 0.0
    cpd_prev = 0.0

    for t in range(1, n + 1):
        gross_ee = net_ee = 0.0
        per_contract_ee = [0.0] * len(req.contracts)
        for j in range(t + 1):
            price = req.current_merchant_price_usd_mwh * (u ** j) * (d ** (t - j))
            prob = math.comb(t, j) * (p ** j) * ((1.0 - p) ** (t - j))
            mtms = []
            for i, c in enumerate(req.contracts):
                if t >= c.tenor_years:
                    mtms.append(0.0)
                    continue
                sgn = 1.0 if c.holder == "generator" else -1.0
                ann = annuity(c.tenor_years - t)
                mtm = sgn * (c.fixed_price_usd_mwh - price) * c.annual_volume_mwh * ann
                mtms.append(mtm)
            for i, mtm in enumerate(mtms):
                pos = max(mtm, 0.0)
                gross_ee += prob * pos
                per_contract_ee[i] += prob * pos
            net_ee += prob * max(sum(mtms), 0.0)

        # Structural guarantee: net <= gross at every period (see docstring)
        assert net_ee <= gross_ee + 1e-6, f"netting invariant violated at year {t}"

        cpd = _cumulative_pd(req.counterparty_rating, t)
        mpd = max(cpd - cpd_prev, 0.0)
        cpd_prev = cpd
        df = (1.0 + r) ** -t
        cva_gross += gross_ee * mpd * lgd * df
        cva_net += net_ee * mpd * lgd * df
        for i in range(len(req.contracts)):
            standalone[i] += per_contract_ee[i] * mpd * lgd * df

        peak_gross = max(peak_gross, gross_ee)
        peak_net = max(peak_net, net_ee)
        benefit_t = (1.0 - net_ee / gross_ee) * 100.0 if gross_ee > 1e-9 else 0.0
        profile.append(NettingPeriod(
            year=t, gross_ee=round(gross_ee, 2), net_ee=round(net_ee, 2),
            netting_benefit_pct=round(min(max(benefit_t, 0.0), 100.0), 2),
        ))

    benefit = (1.0 - cva_net / cva_gross) * 100.0 if cva_gross > 1e-9 else 0.0
    benefit = min(max(benefit, 0.0), 100.0)

    return NettingResponse(
        profile=profile,
        cva_gross=round(cva_gross, 2),
        cva_net=round(cva_net, 2),
        netting_benefit_pct=round(benefit, 2),
        standalone_cva=[
            {"label": c.label, "holder": c.holder, "tenor_years": c.tenor_years,
             "cva": round(standalone[i], 2)}
            for i, c in enumerate(req.contracts)
        ],
        peak_gross_ee=round(peak_gross, 2),
        peak_net_ee=round(peak_net, 2),
        method_notes=[
            "Single merchant-price factor: all contracts marked on the same lattice node (documented).",
            "Net EE_t = E[max(Σ MtM_i, 0)]; gross EE_t = Σ E[max(MtM_i, 0)]; net ≤ gross per period is a "
            "node-wise identity (max(Σx,0) ≤ Σmax(x,0)) and is asserted at runtime.",
            "Netting benefit % = 1 − CVA_net/CVA_gross ∈ [0, 100] by construction.",
            "Opposing directions (generator vs offtaker legs) maximise offset; same-direction contracts net "
            "only through tenor/volume differences.",
            PD_TABLE_LABEL,
        ],
    )


# ---------------------------------------------------------------------------
# Reference endpoints (transparent, hand-authored)
# ---------------------------------------------------------------------------

@router.get("/ref/pd-curves", summary="Rating-based cumulative PD table (transparent, hand-authored)")
def ref_pd_curves():
    return {
        "label": PD_TABLE_LABEL,
        "tenors_years": PD_TENORS_YEARS,
        "cumulative_pd_pct": CUMULATIVE_PD_TABLE_PCT,
        "interpolation": "linear between tenors; flat marginal hazard beyond 20y; cap 99%",
        "source_basis": "S&P Global / Moody's long-term corporate average cumulative default studies — approximate",
    }


@router.get("/ref/migration-matrix", summary="Hand-authored annual rating-migration matrix (agency-study basis, approximate)")
def ref_migration_matrix():
    return {
        "label": MIGRATION_LABEL,
        "states": MIGRATION_STATES,
        "annual_transition_pct": MIGRATION_MATRIX_PCT,
        "row_sums_check": {s: round(sum(MIGRATION_MATRIX_PCT[s]), 2) for s in MIGRATION_STATES},
        "usage": "pi_t = pi_{t-1} x M; cumulative PD(t) = D-state mass; D absorbing; PD capped at 99%",
    }


@router.get("/ref/sa-ccr-params", summary="SA-CCR (CRE52) parameters used by the KVA proxy — real Basel constants")
def ref_sa_ccr_params():
    return {
        "label": SA_CCR_LABEL,
        "alpha": SA_CCR_ALPHA,
        "alpha_basis": "CRE52.1 — EAD = 1.4 x (RC + PFE)",
        "commodity_supervisory_factors_pct": SA_CCR_COMMODITY_SF_PCT,
        "sf_basis": "CRE52 commodity supervisory-factor table (electricity bucket 40%)",
        "maturity_factor": "1 unmargined; margined MF = 1.5 x sqrt(MPR/250) capped at 1 (CRE52.48/52.52 basis)",
        "capital": "Capital = 8% x RW x EAD; KVA = Σ Capital_t x cost-of-capital x DF_t (proxy, labeled)",
    }


@router.get("/ref/collateral-haircuts", summary="CRE22-style standard supervisory collateral haircuts (hand-authored, approximate)")
def ref_collateral_haircuts():
    return {
        "label": HAIRCUT_LABEL,
        "haircuts_pct": COLLATERAL_HAIRCUTS_PCT,
    }
