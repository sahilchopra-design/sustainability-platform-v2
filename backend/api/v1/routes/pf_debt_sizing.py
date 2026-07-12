"""
Project Finance Debt Sizer — multi-metric sculpted debt sizing solver
=====================================================================
Prefix: /api/v1/pf-debt-sizing
Tags:   PF Debt Sizing

The generic sculpting solver referenced by NEXT_USE_CASES_2.md row #2.
Sector-specific project-finance pages (hydrogen / BESS / geothermal / CCUS)
model sector economics; THIS module is the lender-grade generic sizing engine.

Core sculpting methodology (implemented in the /size handler)
-------------------------------------------------------------
1.  CFADS is either supplied directly (period-by-period arrays, P50 and P90)
    or derived from generation / price / opex parameters for both probability
    cases (annual periods).
2.  Per-period target DSCR is blended by revenue mix:
        target_t = w_t * DSCR_contracted + (1 - w_t) * DSCR_merchant
    where w_t = contracted share of gross revenue in period t.
3.  Sculpted debt service:
        DS_t = CFADS_sizing_t / target_t          (floored at 0)
    where CFADS_sizing is the P50 or P90 case per `sizing_basis`.
4.  Maximum DSCR-supportable debt is the present value of the sculpted debt
    service at the debt interest rate:
        D_DSCR = sum_t DS_t / (1 + r)^t
    (PV identity: a schedule paying exactly DS_t amortises D_DSCR to zero
    at final maturity when interest accrues at r.)
5.  MULTI-METRIC CONSTRAINTS (optional targets; each produces its own max
    debt and the binding = min over all provided constraints):
        LLCR at close = PV(CFADS_sizing, t=1..tenor, at r) / D
          =>  D_LLCR = PV(CFADS_sizing over tenor) / target_LLCR
        PLCR at close = PV(CFADS_sizing, t=1..project life, at r) / D
          =>  D_PLCR = PV(CFADS_sizing over life) / target_PLCR
    Gearing cap: D_gear = max_gearing_pct * capex.
    Debt = min(D_DSCR, D_LLCR?, D_PLCR?, D_gear); the binding constraint is
    reported. If a non-DSCR constraint binds, DS_t is scaled proportionally
    (DSCRs then exceed target uniformly). Per period, LLCR_t / PLCR_t are
    computed on the final schedule as PV of remaining CFADS over the opening
    balance; the per-period binding metric = argmin of (ratio / target)
    headroom across the metrics with targets.
6.  Schedule construction per period:
        interest_t  = r * B_{t-1}
        principal_t = min(DS_t - interest_t, B_{t-1})
        sweep_t     = cash_sweep_pct * max(0, CFADS_t - DS_actual_t),
                      capped at the remaining balance (prepayment)
        B_t         = B_{t-1} - principal_t - sweep_t
    DSCR_t is reported on both P50 and P90 CFADS against actual debt service.
7.  DSRA: target_t = dsra_months/12 * next period's scheduled debt service,
    funded at close (equity-funded in this model) and released as debt
    amortises; movements flow through the sponsor equity cash flow.
8.  Sponsor P50 equity IRR: CF_0 = -(capex - debt + DSRA_0);
    CF_t = CFADS_P50_t - DS_actual_t - sweep_t - dDSRA_t  (post-tenor periods
    receive full CFADS). Solved by bisection on NPV.

Extension modules (each optional; documented in its own section below)
----------------------------------------------------------------------
TRANCHING   Senior + mezzanine simultaneous sizing. Mezz DS_t is sculpted on
            RESIDUAL CFADS (CFADS_sizing_t - senior DS_t) at the (higher)
            mezz target DSCR; mezz debt = PV(mezz DS) at the MEZZ rate,
            capped so senior+mezz <= max_total_gearing * capex. The senior
            schedule is untouched, so senior DSCRs are unchanged by adding
            mezz. Blended cost = balance-weighted coupon. Attachment /
            detachment expressed as % of capex, with coverage at each level.
MINI-PERM   Balloon at year k: balloon = scheduled closing balance at k from
            the senior schedule. Assumed refi at (rate + refi_spread_bps),
            an INPUT ASSUMPTION (labeled). Refi-risk metric =
            balloon / PV(post-balloon CFADS over refi tenor at refi rate) —
            <= 1 means post-balloon CFADS PV covers the balloon.
            Hard mini-perm: balloon must refi (annuity at refi rate; post-
            refi min DSCR reported). Soft mini-perm: 100% cash sweep after
            year k instead of a legal balloon; payoff year simulated.
FX          Revenue ccy vs debt ccy. FX path = flat drift or per-year array
            (USER ASSUMPTION, labeled — no forecast is fabricated). Hedged
            share locks the closing spot on that fraction of CFADS:
                CFADS_debt_t = CFADS_t * (h*fx_0 + (1-h)*fx_t)
            Sizing runs on FX-converted CFADS; a stressed-DSCR table applies
            additional user depreciation shocks to the UNHEDGED share only.
BREAKEVENS  Bisection solvers on the FINAL schedule (debt service held
            fixed): (a) uniform CFADS haircut %, (b) merchant price (derive
            mode), (c) all-in interest rate (balance path held, interest
            recomputed) — each solved for min-DSCR = 1.00 (default) and the
            lock-up covenant.
SUSTAIN.    Green/SLL overlay: margin ratchet (+/- ratchet_bps) on an
            emissions-intensity KPI path vs target path; green-loan margin
            benefit input (LABELED market-observation range, not a market
            feed); sustainability-adjusted blended cost. Carbon cost line
            (emissions x user carbon price path) deducted from CFADS and the
            debt RE-SIZED => "carbon-stressed debt capacity" + delta.
LENDER RPT  Flat exportable summary rows (section/metric/value/basis) of all
            sizing metrics, covenants, tranches, breakevens, FX and
            sustainability KPIs — rendered and CSV-exported by the frontend.

All numbers trace to inputs — no PRNG, no fabricated data. The benchmark
reference table is hand-authored market convention, labeled as such.
"""
from __future__ import annotations

import logging
from typing import Dict, List, Literal, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, model_validator

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/pf-debt-sizing", tags=["PF Debt Sizing"])

HOURS_PER_YEAR = 8760.0


# ─────────────────────────────────────────────────────────────────────────────
# Request models
# ─────────────────────────────────────────────────────────────────────────────
class DeriveCfadsParams(BaseModel):
    """Derive annual CFADS (P50 and P90) from generation + price + opex."""
    capacity_mw: float = Field(gt=0, description="Installed capacity, MW")
    capacity_factor_p50: float = Field(gt=0, lt=1, description="P50 net capacity factor (fraction)")
    capacity_factor_p90: float = Field(gt=0, lt=1, description="P90 net capacity factor (fraction)")
    degradation_pct_yr: float = Field(default=0.4, ge=0, lt=5, description="Annual output degradation, % per year")
    curtailment_pct: float = Field(default=3.0, ge=0, lt=50, description="Curtailment loss, % of gross generation")

    contracted_price_usd_mwh: float = Field(gt=0, description="PPA / contracted strike, USD/MWh")
    contracted_escalation_pct: float = Field(default=2.0, ge=0, lt=15, description="Contracted price escalation, %/yr")
    contracted_tenor_years: int = Field(ge=0, le=40, description="Years of contracted offtake from COD")
    contracted_volume_share_pct: float = Field(default=100.0, ge=0, le=100,
                                               description="Share of volume sold under contract during PPA tenor, %")

    merchant_price_usd_mwh: float = Field(ge=0, description="Merchant capture price, USD/MWh (year 1)")
    merchant_escalation_pct: float = Field(default=2.0, ge=0, lt=15, description="Merchant price escalation, %/yr")

    opex_usd_yr: float = Field(ge=0, description="Year-1 fixed O&M + other opex, USD")
    opex_escalation_pct: float = Field(default=2.0, ge=0, lt=15, description="Opex escalation, %/yr")

    tax_rate_pct: float = Field(default=0.0, ge=0, lt=60,
                                description="Cash tax rate applied to (revenue - opex - straight-line depreciation). "
                                            "0 = pre-tax CFADS. Interest shield deliberately ignored (conservative, "
                                            "avoids sizing circularity).")
    project_life_years: int = Field(default=25, ge=1, le=50, description="Operating life = number of CFADS periods")

    @model_validator(mode="after")
    def _p90_below_p50(self):
        if self.capacity_factor_p90 >= self.capacity_factor_p50:
            raise ValueError("capacity_factor_p90 must be below capacity_factor_p50")
        return self


class MezzanineParams(BaseModel):
    """Mezzanine tranche sized on residual CFADS after senior debt service."""
    target_dscr: float = Field(default=2.00, gt=1.0, le=10.0,
                               description="Mezz target DSCR on RESIDUAL CFADS (CFADS - senior DS). "
                                           "Higher than senior targets by construction of subordination.")
    interest_rate_pct: float = Field(gt=0, lt=40, description="Mezz all-in fixed rate, % (above senior by market convention)")
    tenor_years: Optional[int] = Field(default=None, ge=1, le=35,
                                       description="Mezz tenor; default = senior tenor (pari passu maturity)")
    max_total_gearing_pct: float = Field(default=90.0, gt=0, le=98, description="Cap on (senior + mezz) / capex, %")


class MiniPermParams(BaseModel):
    """Mini-perm / balloon-refi structure analysed on the sized senior schedule."""
    balloon_year: int = Field(default=7, ge=2, le=12, description="Balloon maturity year (typical mini-perm 5-7)")
    refi_spread_bps: float = Field(default=75.0, ge=-200, le=1000,
                                   description="ASSUMED spread-at-refi over the current all-in rate, bps (user assumption, labeled)")
    refi_tenor_years: Optional[int] = Field(default=None, ge=1, le=30,
                                            description="Refi amortisation tenor; default = original tenor - balloon year")


class FxParams(BaseModel):
    """Multi-currency: revenue currency vs debt currency (user FX path, labeled assumption)."""
    revenue_currency: str = Field(default="LOCAL", max_length=10)
    debt_currency: str = Field(default="USD", max_length=10)
    fx_initial: float = Field(default=1.0, gt=0, description="Debt-ccy per revenue-ccy at financial close")
    fx_annual_drift_pct: float = Field(default=0.0, ge=-25, le=25,
                                       description="Flat annual FX drift, %/yr (negative = revenue ccy depreciates). USER ASSUMPTION.")
    fx_path: Optional[List[float]] = Field(default=None,
                                           description="Per-year debt-ccy per revenue-ccy (overrides drift). USER ASSUMPTION — "
                                                       "no FX forecast is fabricated by this engine.")
    hedged_share_pct: float = Field(default=0.0, ge=0, le=100,
                                    description="Share of CFADS locked at closing spot via FX hedge, %")
    stress_depreciation_pcts: List[float] = Field(default=[10.0, 20.0, 30.0],
                                                  description="Additional depreciation shocks applied to the UNHEDGED share for the stressed-DSCR table")

    @model_validator(mode="after")
    def _valid_path(self):
        if self.fx_path is not None:
            if len(self.fx_path) < 1 or any(x <= 0 for x in self.fx_path):
                raise ValueError("fx_path values must be positive")
        if len(self.stress_depreciation_pcts) > 8:
            raise ValueError("at most 8 FX stress points")
        return self


class SustainabilityParams(BaseModel):
    """Green/SLL loan overlay + carbon-cost-stressed debt capacity."""
    # Emissions-intensity KPI path (any consistent unit, e.g. tCO2e/GWh) vs target
    emissions_intensity_initial: Optional[float] = Field(default=None, ge=0, description="Year-1 emissions intensity KPI")
    emissions_intensity_decline_pct_yr: float = Field(default=0.0, ge=-20, le=50, description="Annual intensity decline, %/yr")
    emissions_intensity_path: Optional[List[float]] = Field(default=None, description="Per-year intensity KPI (overrides initial+decline)")
    emissions_intensity_target: Optional[float] = Field(default=None, ge=0, description="Flat SPT target for the KPI")
    emissions_intensity_target_path: Optional[List[float]] = Field(default=None, description="Per-year SPT target path (overrides flat)")
    ratchet_bps: float = Field(default=5.0, ge=0, le=100,
                               description="SLL two-way margin ratchet: -bps when KPI <= target, +bps when missed "
                                           "(typical observed range 2.5-10 bps; user input)")
    green_loan_margin_benefit_bps: float = Field(default=0.0, ge=0, le=50,
                                                 description="Green-loan pricing benefit vs vanilla, bps. LABELED market observation: "
                                                             "'greenium' studies report ~0-10 bps for loans — this is a user input, not a feed.")
    # Carbon cost line: emissions x user carbon price path, deducted from CFADS
    carbon_price_initial: Optional[float] = Field(default=None, ge=0, description="Year-1 carbon price, USD/tCO2e (user path)")
    carbon_price_growth_pct_yr: float = Field(default=0.0, ge=-10, le=30, description="Carbon price growth, %/yr")
    carbon_price_path: Optional[List[float]] = Field(default=None, description="Per-year carbon price, USD/tCO2e (overrides initial+growth)")
    emissions_tco2e_yr: Optional[float] = Field(default=None, ge=0, description="Flat annual emissions, tCO2e")
    emissions_tco2e_path: Optional[List[float]] = Field(default=None, description="Per-year emissions, tCO2e (overrides flat)")


class SizeRequest(BaseModel):
    capex_usd: float = Field(gt=0, description="Total project cost (uses excl. DSRA), USD")

    # CFADS: supply arrays directly OR derive from parameters (exactly one path)
    cfads_p50: Optional[List[float]] = Field(default=None, description="Annual P50 CFADS, USD, period 1..N")
    cfads_p90: Optional[List[float]] = Field(default=None,
                                             description="Annual P90 CFADS. If omitted with pasted P50, P90=P50 (flagged).")
    contracted_share_pct: Optional[float] = Field(default=None, ge=0, le=100,
                                                  description="Paste mode: scalar contracted-revenue share, %")
    contracted_share_by_period: Optional[List[float]] = Field(default=None,
                                                              description="Paste mode: per-period contracted share, % (overrides scalar)")
    derive: Optional[DeriveCfadsParams] = None

    # Sizing parameters
    target_dscr_contracted: float = Field(default=1.30, gt=1.0, le=5.0, description="Target DSCR on contracted revenue")
    target_dscr_merchant: float = Field(default=1.80, gt=1.0, le=8.0, description="Target DSCR on merchant revenue")
    target_llcr: Optional[float] = Field(default=None, gt=1.0, le=8.0,
                                         description="Target LLCR at close (optional). When set, D_LLCR = PV(CFADS over tenor)/target "
                                                     "joins the binding-constraint set.")
    target_plcr: Optional[float] = Field(default=None, gt=1.0, le=10.0,
                                         description="Target PLCR at close (optional). When set, D_PLCR = PV(CFADS over life)/target "
                                                     "joins the binding-constraint set.")
    sizing_basis: Literal["p50", "p90"] = Field(default="p50", description="CFADS case used for sculpting")
    max_gearing_pct: float = Field(default=75.0, gt=0, le=95, description="Max debt / capex, %")
    tenor_years: int = Field(ge=1, le=35, description="Debt tenor (fully amortising), years")
    interest_rate_pct: float = Field(gt=0, lt=30, description="All-in fixed rate (base + margin), %")
    dsra_months: int = Field(default=6, ge=0, le=24, description="DSRA target, months of forward debt service")
    cash_sweep_pct: float = Field(default=0.0, ge=0, le=100, description="% of post-debt-service cash swept to prepay")
    lockup_dscr: float = Field(default=1.15, gt=0.5, le=3.0,
                               description="Distribution lock-up covenant used by the breakeven panel and lender report")

    # Extension modules (all optional; legacy requests are bit-identical)
    mezzanine: Optional[MezzanineParams] = None
    mini_perm: Optional[MiniPermParams] = None
    fx: Optional[FxParams] = None
    sustainability: Optional[SustainabilityParams] = None

    @model_validator(mode="after")
    def _one_cfads_path(self):
        if (self.cfads_p50 is None) == (self.derive is None):
            raise ValueError("Provide exactly one of: cfads_p50 array, or derive parameters")
        if self.cfads_p50 is not None:
            if len(self.cfads_p50) < self.tenor_years:
                raise ValueError(f"cfads_p50 has {len(self.cfads_p50)} periods but tenor is {self.tenor_years} years")
            if self.cfads_p90 is not None and len(self.cfads_p90) != len(self.cfads_p50):
                raise ValueError("cfads_p90 must have same length as cfads_p50")
            if self.contracted_share_by_period is not None and len(self.contracted_share_by_period) != len(self.cfads_p50):
                raise ValueError("contracted_share_by_period must have same length as cfads_p50")
        if self.derive is not None and self.derive.project_life_years < self.tenor_years:
            raise ValueError("derive.project_life_years must be >= tenor_years")
        if self.mini_perm is not None and self.mini_perm.balloon_year >= self.tenor_years:
            raise ValueError("mini_perm.balloon_year must be < tenor_years")
        return self


# ─────────────────────────────────────────────────────────────────────────────
# CFADS derivation
# ─────────────────────────────────────────────────────────────────────────────
def _derive_cfads(p: DeriveCfadsParams, merchant_price_override: Optional[float] = None):
    """Build P50/P90 CFADS and per-period contracted revenue share.
    `merchant_price_override` re-runs the identical arithmetic at a different
    year-1 merchant price (used by the merchant-price breakeven bisection)."""
    cfads_p50, cfads_p90, w_contracted, detail = [], [], [], []
    gen_p50_path = []
    m0 = p.merchant_price_usd_mwh if merchant_price_override is None else merchant_price_override
    for t in range(1, p.project_life_years + 1):
        degr = (1.0 - p.degradation_pct_yr / 100.0) ** (t - 1)
        net = (1.0 - p.curtailment_pct / 100.0) * degr
        gen50 = p.capacity_mw * p.capacity_factor_p50 * HOURS_PER_YEAR * net
        gen90 = p.capacity_mw * p.capacity_factor_p90 * HOURS_PER_YEAR * net

        c_price = p.contracted_price_usd_mwh * (1.0 + p.contracted_escalation_pct / 100.0) ** (t - 1)
        m_price = m0 * (1.0 + p.merchant_escalation_pct / 100.0) ** (t - 1)
        c_share = (p.contracted_volume_share_pct / 100.0) if t <= p.contracted_tenor_years else 0.0

        def rev(gen):
            return gen * c_share * c_price + gen * (1.0 - c_share) * m_price

        rev50, rev90 = rev(gen50), rev(gen90)
        opex = p.opex_usd_yr * (1.0 + p.opex_escalation_pct / 100.0) ** (t - 1)
        w = (gen50 * c_share * c_price / rev50) if rev50 > 0 else 0.0

        detail.append({
            "period": t, "generation_p50_mwh": round(gen50, 1), "generation_p90_mwh": round(gen90, 1),
            "contracted_price": round(c_price, 2), "merchant_price": round(m_price, 2),
            "revenue_p50": round(rev50, 0), "revenue_p90": round(rev90, 0), "opex": round(opex, 0),
            "contracted_revenue_share": round(w, 4),
        })
        cfads_p50.append(rev50 - opex)
        cfads_p90.append(rev90 - opex)
        w_contracted.append(w)
        gen_p50_path.append(gen50)
    return cfads_p50, cfads_p90, w_contracted, detail, gen_p50_path


def _apply_cash_tax(cfads: List[float], capex: float, life: int, tax_rate_pct: float) -> List[float]:
    """Simplified cash tax: rate * max(0, EBITDA - SL depreciation).
    Interest shield ignored (documented; avoids sizing circularity, conservative)."""
    if tax_rate_pct <= 0:
        return cfads
    dep = capex / life
    return [cf - max(0.0, cf - dep) * tax_rate_pct / 100.0 for cf in cfads]


# ─────────────────────────────────────────────────────────────────────────────
# IRR (bisection on NPV — robust, no external deps)
# ─────────────────────────────────────────────────────────────────────────────
def _irr(cashflows: List[float]) -> Optional[float]:
    if not cashflows or cashflows[0] >= 0:
        return None

    def npv(rate: float) -> float:
        return sum(cf / (1.0 + rate) ** i for i, cf in enumerate(cashflows))

    lo, hi = -0.95, 10.0
    f_lo, f_hi = npv(lo), npv(hi)
    if f_lo * f_hi > 0:
        return None
    for _ in range(200):
        mid = (lo + hi) / 2.0
        f_mid = npv(mid)
        if abs(f_mid) < 1e-7 * max(1.0, abs(cashflows[0])):
            return mid
        if f_lo * f_mid < 0:
            hi = mid
        else:
            lo, f_lo = mid, f_mid
    return (lo + hi) / 2.0


def _pv(flows: List[float], rate: float, start_index: int = 0) -> float:
    """PV at the START of period start_index+1 of flows[start_index:], one period per flow."""
    return sum(cf / (1.0 + rate) ** (i + 1) for i, cf in enumerate(flows[start_index:]))


def _bisect(f, lo: float, hi: float, tol: float = 1e-6, iters: int = 100) -> Optional[float]:
    """Root of f on [lo, hi] by bisection; None if no sign change."""
    f_lo, f_hi = f(lo), f(hi)
    if f_lo == 0:
        return lo
    if f_hi == 0:
        return hi
    if f_lo * f_hi > 0:
        return None
    for _ in range(iters):
        mid = (lo + hi) / 2.0
        f_mid = f(mid)
        if abs(f_mid) < tol or (hi - lo) < tol:
            return mid
        if f_lo * f_mid < 0:
            hi = mid
        else:
            lo, f_lo = mid, f_mid
    return (lo + hi) / 2.0


def _build_amort_schedule(debt: float, ds_targets: List[float], rate: float, n_ds: int,
                          cfads_for_sweep: List[float], sweep_frac: float, n_life: int):
    """Generic sculpted amortisation loop (shared by senior and mezz tranches).
    Returns (rows_raw, ds_actual) where rows_raw carry opening/interest/principal/
    sweep/closing per period 0..n_life-1."""
    rows, ds_actual = [], []
    balance = debt
    for t in range(n_life):
        opening = balance
        if t < n_ds and opening > 1e-9:
            interest = rate * opening
            sched_principal = min(max(0.0, ds_targets[t] - interest), opening)
            ds_t = interest + sched_principal
        else:
            interest = rate * opening
            sched_principal = opening if opening > 1e-9 else 0.0
            ds_t = (interest + sched_principal) if opening > 1e-9 else 0.0
        cash_after_ds = cfads_for_sweep[t] - ds_t
        sweep = min(sweep_frac * max(0.0, cash_after_ds), opening - sched_principal) if opening > 1e-9 else 0.0
        balance = opening - sched_principal - sweep
        ds_actual.append(ds_t)
        rows.append({"opening": opening, "interest": interest, "principal": sched_principal,
                     "ds": ds_t, "sweep": sweep, "closing": balance})
    return rows, ds_actual


# ─────────────────────────────────────────────────────────────────────────────
# Core solver
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/size", summary="Multi-metric (DSCR/LLCR/PLCR) sculpted debt sizing with tranching, mini-perm, FX, breakevens and sustainability overlay")
async def size_debt(req: SizeRequest):
    """Sculpt debt service off CFADS / blended target DSCR, PV to max debt,
    intersect with LLCR / PLCR / gearing constraints, build the full period
    schedule (interest, principal, sweep, DSRA, per-period DSCR/LLCR/PLCR on
    P50 and P90), then run the optional extension modules: mezzanine tranche,
    mini-perm balloon/refi, FX conversion + stress, breakeven bisections and
    the green/SLL sustainability overlay. See module docstring for math."""
    try:
        r = req.interest_rate_pct / 100.0
        sweep_frac = req.cash_sweep_pct / 100.0

        # 1) CFADS
        p90_proxy_flag = False
        gen_p50_path: Optional[List[float]] = None
        if req.derive is not None:
            cfads_p50, cfads_p90, w_contracted, derive_detail, gen_p50_path = _derive_cfads(req.derive)
            cfads_p50 = _apply_cash_tax(cfads_p50, req.capex_usd, req.derive.project_life_years, req.derive.tax_rate_pct)
            cfads_p90 = _apply_cash_tax(cfads_p90, req.capex_usd, req.derive.project_life_years, req.derive.tax_rate_pct)
        else:
            cfads_p50 = list(req.cfads_p50)
            if req.cfads_p90 is not None:
                cfads_p90 = list(req.cfads_p90)
            else:
                cfads_p90, p90_proxy_flag = list(req.cfads_p50), True
            if req.contracted_share_by_period is not None:
                w_contracted = [w / 100.0 for w in req.contracted_share_by_period]
            else:
                w_contracted = [(req.contracted_share_pct if req.contracted_share_pct is not None else 100.0) / 100.0] * len(cfads_p50)
            derive_detail = None

        n_life = len(cfads_p50)
        n = req.tenor_years

        # 1b) FX conversion (optional): revenue-ccy CFADS -> debt-ccy CFADS.
        #     CFADS_debt_t = CFADS_t * (h*fx_0 + (1-h)*fx_t). User FX path, labeled assumption.
        cfads_p50_revccy, cfads_p90_revccy = None, None
        fx_path_eff: Optional[List[float]] = None
        if req.fx is not None:
            fx = req.fx
            if fx.fx_path is not None:
                raw_path = list(fx.fx_path[:n_life]) + [fx.fx_path[-1]] * max(0, n_life - len(fx.fx_path))
            else:
                raw_path = [fx.fx_initial * (1.0 + fx.fx_annual_drift_pct / 100.0) ** t for t in range(n_life)]
            h = fx.hedged_share_pct / 100.0
            fx_path_eff = [h * fx.fx_initial + (1.0 - h) * raw_path[t] for t in range(n_life)]
            cfads_p50_revccy, cfads_p90_revccy = list(cfads_p50), list(cfads_p90)
            cfads_p50 = [cfads_p50[t] * fx_path_eff[t] for t in range(n_life)]
            cfads_p90 = [cfads_p90[t] * fx_path_eff[t] for t in range(n_life)]

        cfads_sizing = cfads_p50 if req.sizing_basis == "p50" else cfads_p90

        # 2) Blended per-period target DSCR + sculpted debt service over tenor
        target_dscr = [w_contracted[t] * req.target_dscr_contracted
                       + (1.0 - w_contracted[t]) * req.target_dscr_merchant for t in range(n)]
        ds_sculpted = [max(0.0, cfads_sizing[t]) / target_dscr[t] for t in range(n)]

        # 3) Max debt: min over DSCR PV, LLCR cap, PLCR cap, gearing cap
        debt_sculpt = sum(ds / (1.0 + r) ** (t + 1) for t, ds in enumerate(ds_sculpted))
        debt_gearing_cap = req.max_gearing_pct / 100.0 * req.capex_usd
        pv_cfads_tenor = _pv([max(0.0, cf) for cf in cfads_sizing[:n]], r)
        pv_cfads_life = _pv([max(0.0, cf) for cf in cfads_sizing], r)
        candidates: Dict[str, float] = {"dscr_sculpting": debt_sculpt, "gearing_cap": debt_gearing_cap}
        debt_llcr_cap = debt_plcr_cap = None
        if req.target_llcr is not None:
            debt_llcr_cap = pv_cfads_tenor / req.target_llcr
            candidates["llcr"] = debt_llcr_cap
        if req.target_plcr is not None:
            debt_plcr_cap = pv_cfads_life / req.target_plcr
            candidates["plcr"] = debt_plcr_cap

        binding_constraint = min(candidates, key=candidates.get)
        debt = candidates[binding_constraint]
        if debt >= debt_sculpt - 1e-9:
            ds_scaled = ds_sculpted
        else:
            scale = debt / debt_sculpt if debt_sculpt > 0 else 0.0
            ds_scaled = [ds * scale for ds in ds_sculpted]

        if debt <= 0:
            raise HTTPException(status_code=422, detail="CFADS supports no debt at the given target DSCRs")

        # 4) Build the schedule (with cash sweep as prepayment)
        rows = []
        balance = debt
        ds_actual: List[float] = []
        for t in range(n_life):
            opening = balance
            if t < n and opening > 1e-9:
                interest = r * opening
                sched_principal = min(max(0.0, ds_scaled[t] - interest), opening)
                ds_t = interest + sched_principal
            else:
                interest = r * opening
                # after tenor any residual (shouldn't exist) is paid; normally 0
                sched_principal = opening if opening > 1e-9 else 0.0
                ds_t = (interest + sched_principal) if opening > 1e-9 else 0.0
            cash_after_ds = cfads_p50[t] - ds_t
            sweep = min(sweep_frac * max(0.0, cash_after_ds), opening - sched_principal) if opening > 1e-9 else 0.0
            balance = opening - sched_principal - sweep
            ds_actual.append(ds_t)
            rows.append({
                "period": t + 1,
                "cfads_p50": round(cfads_p50[t], 2),
                "cfads_p90": round(cfads_p90[t], 2),
                "contracted_share_pct": round(w_contracted[t] * 100.0, 2) if t < len(w_contracted) else 0.0,
                "target_dscr": round(target_dscr[t], 4) if t < n else None,
                "opening_balance": round(opening, 2),
                "interest": round(interest, 2),
                "principal_scheduled": round(sched_principal, 2),
                "debt_service": round(ds_t, 2),
                "cash_sweep": round(sweep, 2),
                "closing_balance": round(balance, 2),
                "dscr_p50": round(cfads_p50[t] / ds_t, 4) if ds_t > 1e-9 else None,
                "dscr_p90": round(cfads_p90[t] / ds_t, 4) if ds_t > 1e-9 else None,
            })

        # 4b) Per-period LLCR / PLCR on the final schedule + binding metric per period.
        #     LLCR_t = PV(remaining sizing-case CFADS over the tenor) / opening balance;
        #     PLCR_t uses remaining life. Headroom = ratio / target; binding = argmin.
        per_period_binding = []
        for t in range(n_life):
            opening = rows[t]["opening_balance"]
            if opening > 1e-6 and t < n:
                llcr_t = _pv([max(0.0, cf) for cf in cfads_sizing[t:n]], r) / opening
                plcr_t = _pv([max(0.0, cf) for cf in cfads_sizing[t:]], r) / opening
                rows[t]["llcr"] = round(llcr_t, 4)
                rows[t]["plcr"] = round(plcr_t, 4)
                dscr_sizing_t = (cfads_sizing[t] / ds_actual[t]) if ds_actual[t] > 1e-9 else None
                headrooms = {}
                if dscr_sizing_t is not None and t < len(target_dscr):
                    headrooms["dscr"] = dscr_sizing_t / target_dscr[t]
                if req.target_llcr is not None:
                    headrooms["llcr"] = llcr_t / req.target_llcr
                if req.target_plcr is not None:
                    headrooms["plcr"] = plcr_t / req.target_plcr
                binding_t = min(headrooms, key=headrooms.get) if headrooms else None
                rows[t]["binding_metric"] = binding_t
                rows[t]["binding_headroom"] = round(min(headrooms.values()), 4) if headrooms else None
                if binding_t:
                    per_period_binding.append({"period": t + 1, "metric": binding_t,
                                               "headroom": rows[t]["binding_headroom"]})
            else:
                rows[t]["llcr"] = None
                rows[t]["plcr"] = None
                rows[t]["binding_metric"] = None
                rows[t]["binding_headroom"] = None

        llcr_at_close = (pv_cfads_tenor / debt) if debt > 0 else None
        plcr_at_close = (pv_cfads_life / debt) if debt > 0 else None
        llcr_series = [row["llcr"] for row in rows if row["llcr"] is not None]
        plcr_series = [row["plcr"] for row in rows if row["plcr"] is not None]

        # 5) DSRA (target = m/12 * next period's actual DS; equity-funded at close)
        m_frac = req.dsra_months / 12.0
        dsra_target = [m_frac * (ds_actual[t + 1] if t + 1 < len(ds_actual) else 0.0) for t in range(n_life)]
        dsra_initial = m_frac * ds_actual[0] if ds_actual else 0.0
        prev = dsra_initial
        for t in range(n_life):
            rows[t]["dsra_target"] = round(dsra_target[t], 2)
            rows[t]["dsra_movement"] = round(dsra_target[t] - prev, 2)  # +ve = top-up, -ve = release
            prev = dsra_target[t]

        # 6) Sponsor P50 equity IRR
        equity = req.capex_usd - debt
        eq_cf = [-(equity + dsra_initial)]
        for t in range(n_life):
            eq_cf.append(cfads_p50[t] - ds_actual[t] - rows[t]["cash_sweep"] - rows[t]["dsra_movement"])
        equity_irr = _irr(eq_cf)

        # 7) Lender P90 DSCR stats (over debt-service periods)
        dscr90 = [row["dscr_p90"] for row in rows if row["dscr_p90"] is not None]
        dscr50 = [row["dscr_p50"] for row in rows if row["dscr_p50"] is not None]

        sweep_note = None
        last_ds_period = max((row["period"] for row in rows if row["debt_service"] > 1e-9), default=0)
        if sweep_frac > 0 and last_ds_period < n:
            sweep_note = f"Cash sweep retires debt in period {last_ds_period} vs contractual tenor {n}"

        # ── EXTENSION 1: multi-metric summary ────────────────────────────────
        multi_metric = {
            "constraint_debts_usd": {k: round(v, 2) for k, v in candidates.items()},
            "targets": {"dscr_contracted": req.target_dscr_contracted, "dscr_merchant": req.target_dscr_merchant,
                        "llcr": req.target_llcr, "plcr": req.target_plcr},
            "binding_constraint": binding_constraint,
            "llcr_at_close": round(llcr_at_close, 4) if llcr_at_close is not None else None,
            "plcr_at_close": round(plcr_at_close, 4) if plcr_at_close is not None else None,
            "min_llcr": round(min(llcr_series), 4) if llcr_series else None,
            "min_plcr": round(min(plcr_series), 4) if plcr_series else None,
            "per_period_binding": per_period_binding,
            "note": "D_LLCR = PV(sizing CFADS over tenor at debt rate)/target_LLCR; D_PLCR = PV over project life/target_PLCR; "
                    "binding debt = min of all provided constraints. Per-period binding = argmin(metric/target headroom).",
        }

        # ── EXTENSION 2: mezzanine tranche on residual CFADS ─────────────────
        tranching = None
        if req.mezzanine is not None:
            mz = req.mezzanine
            rm = mz.interest_rate_pct / 100.0
            n_mz = min(mz.tenor_years or n, n_life)
            residual = [max(0.0, cfads_sizing[t] - (ds_actual[t] if t < len(ds_actual) else 0.0)) for t in range(n_mz)]
            mz_ds_sculpt = [res / mz.target_dscr for res in residual]
            mz_sculpt_debt = sum(ds / (1.0 + rm) ** (t + 1) for t, ds in enumerate(mz_ds_sculpt))
            total_cap = mz.max_total_gearing_pct / 100.0 * req.capex_usd
            mz_cap_room = max(0.0, total_cap - debt)
            if mz_sculpt_debt <= mz_cap_room:
                mz_debt, mz_binding = mz_sculpt_debt, "mezz_dscr_sculpting"
                mz_ds_targets = mz_ds_sculpt
            else:
                mz_debt, mz_binding = mz_cap_room, "total_gearing_cap"
                sc = mz_cap_room / mz_sculpt_debt if mz_sculpt_debt > 0 else 0.0
                mz_ds_targets = [ds * sc for ds in mz_ds_sculpt]
            mz_rows_raw, mz_ds_actual = _build_amort_schedule(mz_debt, mz_ds_targets, rm, n_mz,
                                                              [0.0] * n_life, 0.0, n_life)
            total_debt = debt + mz_debt
            # Coverage at each attachment level (P50 and P90, actual combined DS)
            total_ds = [ds_actual[t] + mz_ds_actual[t] for t in range(n_life)]
            tot_dscr50 = [cfads_p50[t] / total_ds[t] for t in range(n_life) if total_ds[t] > 1e-9]
            tot_dscr90 = [cfads_p90[t] / total_ds[t] for t in range(n_life) if total_ds[t] > 1e-9]
            mz_dscr_resid = [(max(0.0, cfads_p50[t] - ds_actual[t]) / mz_ds_actual[t])
                             for t in range(n_life) if mz_ds_actual[t] > 1e-9]
            blended = ((debt * r + mz_debt * rm) / total_debt * 100.0) if total_debt > 0 else None
            # Sponsor IRR with mezz (P50): mezz proceeds reduce equity; mezz DS reduces distributions
            eq_mz = req.capex_usd - total_debt
            eq_cf_mz = [-(eq_mz + dsra_initial)]
            for t in range(n_life):
                eq_cf_mz.append(cfads_p50[t] - ds_actual[t] - rows[t]["cash_sweep"] - rows[t]["dsra_movement"] - mz_ds_actual[t])
            irr_mz = _irr(eq_cf_mz)
            mz_schedule = [{
                "period": t + 1, "opening_balance": round(mz_rows_raw[t]["opening"], 2),
                "interest": round(mz_rows_raw[t]["interest"], 2), "principal": round(mz_rows_raw[t]["principal"], 2),
                "debt_service": round(mz_rows_raw[t]["ds"], 2), "closing_balance": round(mz_rows_raw[t]["closing"], 2),
                "residual_cfads_p50": round(max(0.0, cfads_p50[t] - ds_actual[t]), 2),
                "mezz_dscr_on_residual": round(max(0.0, cfads_p50[t] - ds_actual[t]) / mz_rows_raw[t]["ds"], 4) if mz_rows_raw[t]["ds"] > 1e-9 else None,
                "total_dscr_p50": round(cfads_p50[t] / total_ds[t], 4) if total_ds[t] > 1e-9 else None,
            } for t in range(n_life) if mz_rows_raw[t]["opening"] > 1e-6 or t == 0]
            tranching = {
                "senior_debt_usd": round(debt, 2),
                "mezz_debt_usd": round(mz_debt, 2),
                "mezz_sculpted_debt_usd": round(mz_sculpt_debt, 2),
                "mezz_binding_constraint": mz_binding,
                "total_debt_usd": round(total_debt, 2),
                "total_gearing_pct": round(total_debt / req.capex_usd * 100.0, 2),
                "attachment_pct_of_capex": round(debt / req.capex_usd * 100.0, 2),
                "detachment_pct_of_capex": round(total_debt / req.capex_usd * 100.0, 2),
                "blended_cost_of_debt_pct": round(blended, 3) if blended is not None else None,
                "senior_min_dscr_p50": min(dscr50) if dscr50 else None,        # unchanged by mezz (verified)
                "total_min_dscr_p50": round(min(tot_dscr50), 4) if tot_dscr50 else None,
                "total_min_dscr_p90": round(min(tot_dscr90), 4) if tot_dscr90 else None,
                "mezz_min_dscr_on_residual": round(min(mz_dscr_resid), 4) if mz_dscr_resid else None,
                "sponsor_p50_equity_irr_with_mezz_pct": round(irr_mz * 100.0, 3) if irr_mz is not None else None,
                "equity_usd_with_mezz": round(eq_mz, 2),
                "mezz_schedule": mz_schedule,
                "note": "Mezz DS_t = max(0, CFADS_sizing_t - senior DS_t) / mezz_target_DSCR; mezz debt = PV(mezz DS) at the "
                        "mezz rate; capped at max_total_gearing. Senior schedule untouched -> senior DSCRs identical.",
            }

        # ── EXTENSION 3: mini-perm / balloon refi ────────────────────────────
        mini_perm = None
        if req.mini_perm is not None:
            mp = req.mini_perm
            k = mp.balloon_year
            balloon = rows[k - 1]["closing_balance"]
            refi_rate_pct = req.interest_rate_pct + mp.refi_spread_bps / 100.0
            rr = refi_rate_pct / 100.0
            m_refi = mp.refi_tenor_years or max(1, min(n - k, n_life - k))
            m_refi = min(m_refi, n_life - k) if n_life - k >= 1 else 1
            post_cfads = cfads_p50[k:k + m_refi]
            pv_post = _pv([max(0.0, cf) for cf in post_cfads], rr)
            refi_risk = (balloon / pv_post) if pv_post > 0 else None
            # Hard mini-perm: balloon refinances into an annuity over m_refi years
            if rr > 1e-9:
                annuity = balloon * rr / (1.0 - (1.0 + rr) ** (-m_refi)) if balloon > 0 else 0.0
            else:
                annuity = balloon / m_refi if balloon > 0 else 0.0
            post_dscr = [cf / annuity for cf in post_cfads if annuity > 1e-9]
            hard = {
                "structure": "hard mini-perm (legal balloon, assumed refi)",
                "balloon_usd": round(balloon, 2),
                "refi_rate_pct_assumed": round(refi_rate_pct, 3),
                "refi_tenor_years": m_refi,
                "post_refi_annuity_ds_usd": round(annuity, 2),
                "post_refi_min_dscr_p50": round(min(post_dscr), 4) if post_dscr else None,
                "post_refi_avg_dscr_p50": round(sum(post_dscr) / len(post_dscr), 4) if post_dscr else None,
            }
            # Soft mini-perm: no legal balloon — 100% cash sweep from year k+1
            bal, payoff_year, interest_paid_soft = balloon, None, 0.0
            for t in range(k, n_life):
                if bal <= 1e-6:
                    break
                intr = r * bal  # soft mini-perm stays at the original rate (pricing step-ups excluded, documented)
                interest_paid_soft += intr
                avail = max(0.0, cfads_p50[t] - intr)
                pay = min(avail, bal)
                bal -= pay
                if bal <= 1e-6:
                    payoff_year = t + 1
                    break
            soft = {
                "structure": "soft mini-perm (100% sweep after balloon year, no legal balloon)",
                "balance_at_switch_usd": round(balloon, 2),
                "full_sweep_payoff_year": payoff_year,
                "repaid_within_life": payoff_year is not None,
                "residual_balance_at_life_end_usd": round(bal, 2) if payoff_year is None else 0.0,
            }
            mini_perm = {
                "balloon_year": k,
                "balloon_usd": round(balloon, 2),
                "balloon_pct_of_debt": round(balloon / debt * 100.0, 2) if debt > 0 else None,
                "refi_spread_bps_assumed": mp.refi_spread_bps,
                "refi_risk_metric": round(refi_risk, 4) if refi_risk is not None else None,
                "refi_risk_definition": "balloon / PV(post-balloon P50 CFADS over refi tenor at the assumed refi rate). "
                                        "<= 1.0 means post-balloon cash generation covers the balloon in PV terms; "
                                        "lower is safer. Refi rate = current all-in + user spread-at-refi (ASSUMPTION).",
                "hard_vs_soft": [hard, soft],
            }

        # ── EXTENSION 4: FX summary + stressed DSCR table ────────────────────
        fx_out = None
        if req.fx is not None and fx_path_eff is not None:
            fx = req.fx
            stress_rows = []
            for s in fx.stress_depreciation_pcts:
                h = fx.hedged_share_pct / 100.0
                # shock applies to the unhedged leg only
                if fx.fx_path is not None:
                    raw_path = list(fx.fx_path[:n_life]) + [fx.fx_path[-1]] * max(0, n_life - len(fx.fx_path))
                else:
                    raw_path = [fx.fx_initial * (1.0 + fx.fx_annual_drift_pct / 100.0) ** t for t in range(n_life)]
                eff_s = [h * fx.fx_initial + (1.0 - h) * raw_path[t] * (1.0 - s / 100.0) for t in range(n_life)]
                dscr_s = [(cfads_p50_revccy[t] * eff_s[t]) / ds_actual[t]
                          for t in range(n_life) if ds_actual[t] > 1e-9]
                stress_rows.append({
                    "depreciation_pct": s,
                    "min_dscr_p50": round(min(dscr_s), 4) if dscr_s else None,
                    "avg_dscr_p50": round(sum(dscr_s) / len(dscr_s), 4) if dscr_s else None,
                    "periods_below_1x": sum(1 for d in dscr_s if d < 1.0),
                    "periods_below_lockup": sum(1 for d in dscr_s if d < req.lockup_dscr),
                })
            fx_out = {
                "revenue_currency": fx.revenue_currency, "debt_currency": fx.debt_currency,
                "fx_initial": fx.fx_initial, "hedged_share_pct": fx.hedged_share_pct,
                "fx_path_basis": "user per-year array" if fx.fx_path is not None
                                 else f"flat drift {fx.fx_annual_drift_pct:+.2f}%/yr (USER ASSUMPTION — not a forecast)",
                "effective_fx_year1": round(fx_path_eff[0], 6),
                "effective_fx_final": round(fx_path_eff[-1], 6),
                "sizing_converted": True,
                "stressed_dscr_table": stress_rows,
                "note": "CFADS converted at h*fx_0 + (1-h)*fx_t before sizing (h = hedged share). Stress table shocks "
                        "the UNHEDGED share only, holding debt service fixed.",
            }

        # ── EXTENSION 5: breakeven panel (bisection, DS held fixed) ──────────
        ds_periods = [t for t in range(n_life) if ds_actual[t] > 1e-9]

        def _min_dscr_for_haircut(h: float) -> float:
            return min(cfads_p50[t] * (1.0 - h) / ds_actual[t] for t in ds_periods)

        def _haircut_breakeven(thr: float):
            if not ds_periods:
                return None
            if _min_dscr_for_haircut(0.0) <= thr:
                return 0.0  # already at/below threshold with no haircut
            root = _bisect(lambda h: _min_dscr_for_haircut(h) - thr, 0.0, 1.0)
            return round(root * 100.0, 3) if root is not None else None

        def _rate_min_dscr(x: float) -> float:
            # balance path held; interest recomputed at rate x on each opening balance
            vals = []
            for t in ds_periods:
                ds_x = rows[t]["principal_scheduled"] + x * rows[t]["opening_balance"]
                if ds_x > 1e-9:
                    vals.append(cfads_p50[t] / ds_x)
            return min(vals) if vals else float("inf")

        def _rate_breakeven(thr: float):
            if not ds_periods:
                return None
            if _rate_min_dscr(r) <= thr:
                return round(req.interest_rate_pct, 3)  # at/below threshold at the current rate
            if _rate_min_dscr(0.50) > thr:
                return None  # still covered at 50% — report as unbounded
            root = _bisect(lambda x: _rate_min_dscr(x) - thr, r, 0.50)
            return round(root * 100.0, 3) if root is not None else None

        def _merchant_min_dscr(price: float) -> float:
            c50, _, _, _, _ = _derive_cfads(req.derive, merchant_price_override=price)
            c50 = _apply_cash_tax(c50, req.capex_usd, req.derive.project_life_years, req.derive.tax_rate_pct)
            if fx_path_eff is not None:
                c50 = [c50[t] * fx_path_eff[t] for t in range(len(c50))]
            return min(c50[t] / ds_actual[t] for t in ds_periods)

        def _merchant_breakeven(thr: float):
            if req.derive is None or not ds_periods:
                return None
            cur = req.derive.merchant_price_usd_mwh
            if cur <= 0:
                return None
            if _merchant_min_dscr(0.0) >= thr:
                return 0.0  # covered by contracted revenue alone
            if _merchant_min_dscr(cur) <= thr:
                return round(cur, 3)  # already at/below threshold at the input price
            root = _bisect(lambda p: _merchant_min_dscr(p) - thr, 0.0, cur)
            return round(root, 3) if root is not None else None

        breakevens = {
            "method": "bisection on the FINAL schedule with debt service held fixed (rate breakeven holds the "
                      "balance path and recomputes interest). Thresholds: 1.00x default and the lock-up covenant.",
            "lockup_dscr": req.lockup_dscr,
            "cfads_haircut_pct": {"to_1_00x": _haircut_breakeven(1.0), "to_lockup": _haircut_breakeven(req.lockup_dscr)},
            "merchant_price_usd_mwh": {"to_1_00x": _merchant_breakeven(1.0), "to_lockup": _merchant_breakeven(req.lockup_dscr),
                                       "available": req.derive is not None,
                                       "note": None if req.derive is not None else "derive mode only (needs merchant price parameter)"},
            "interest_rate_pct": {"to_1_00x": _rate_breakeven(1.0), "to_lockup": _rate_breakeven(req.lockup_dscr),
                                  "note": "None = min DSCR stays above threshold even at a 50% rate (schedule is nearly all principal)"},
        }

        # ── EXTENSION 6: sustainability overlay ──────────────────────────────
        sustainability = None
        if req.sustainability is not None:
            su = req.sustainability

            def _path(scalar, growth_pct, arr, length, grow_sign=+1):
                if arr is not None:
                    return list(arr[:length]) + [arr[-1]] * max(0, length - len(arr))
                if scalar is None:
                    return None
                g = growth_pct / 100.0
                return [scalar * (1.0 + grow_sign * g) ** t for t in range(length)]

            intensity = _path(su.emissions_intensity_initial, su.emissions_intensity_decline_pct_yr,
                              su.emissions_intensity_path, n_life, grow_sign=-1)
            target_path = (_path(su.emissions_intensity_target, 0.0, su.emissions_intensity_target_path, n_life)
                           if (su.emissions_intensity_target is not None or su.emissions_intensity_target_path is not None) else None)

            ratchet_rows, avg_adj_bps = None, None
            if intensity is not None and target_path is not None:
                ratchet_rows = []
                adjs = []
                for t in range(n):
                    hit = intensity[t] <= target_path[t]
                    adj = -su.ratchet_bps if hit else +su.ratchet_bps
                    adjs.append(adj)
                    ratchet_rows.append({"period": t + 1, "intensity": round(intensity[t], 4),
                                         "target": round(target_path[t], 4), "kpi_met": hit,
                                         "margin_adjustment_bps": adj,
                                         "adjusted_rate_pct": round(req.interest_rate_pct + adj / 100.0, 4)})
                avg_adj_bps = sum(adjs) / len(adjs) if adjs else 0.0

            base_cost = req.interest_rate_pct
            if tranching is not None and tranching["blended_cost_of_debt_pct"] is not None:
                base_cost = tranching["blended_cost_of_debt_pct"]
            sust_adjusted_cost = base_cost + ((avg_adj_bps or 0.0) - su.green_loan_margin_benefit_bps) / 100.0

            # Carbon cost line: emissions x carbon price, deducted from CFADS -> re-size
            carbon = None
            price_path = _path(su.carbon_price_initial, su.carbon_price_growth_pct_yr, su.carbon_price_path, n_life)
            emissions = _path(su.emissions_tco2e_yr, 0.0, su.emissions_tco2e_path, n_life)
            if emissions is None and intensity is not None and gen_p50_path is not None:
                # derive mode fallback: intensity (tCO2e/MWh) x P50 generation
                emissions = [intensity[t] * gen_p50_path[t] for t in range(n_life)]
                emissions_basis = "intensity path x derived P50 generation (tCO2e/MWh x MWh)"
            else:
                emissions_basis = "user emissions path" if emissions is not None else None
            if price_path is not None and emissions is not None:
                cc = [price_path[t] * emissions[t] for t in range(n_life)]
                c50s = [cfads_p50[t] - cc[t] for t in range(n_life)]
                c90s = [cfads_p90[t] - cc[t] for t in range(n_life)]
                sizing_s = c50s if req.sizing_basis == "p50" else c90s
                ds_s = [max(0.0, sizing_s[t]) / target_dscr[t] for t in range(n)]
                d_dscr_s = sum(ds / (1.0 + r) ** (t + 1) for t, ds in enumerate(ds_s))
                cands_s = {"dscr_sculpting": d_dscr_s, "gearing_cap": debt_gearing_cap}
                if req.target_llcr is not None:
                    cands_s["llcr"] = _pv([max(0.0, cf) for cf in sizing_s[:n]], r) / req.target_llcr
                if req.target_plcr is not None:
                    cands_s["plcr"] = _pv([max(0.0, cf) for cf in sizing_s], r) / req.target_plcr
                bind_s = min(cands_s, key=cands_s.get)
                debt_s = max(0.0, cands_s[bind_s])
                carbon = {
                    "carbon_price_basis": "user per-year path" if su.carbon_price_path is not None
                                          else f"{su.carbon_price_initial} USD/t growing {su.carbon_price_growth_pct_yr:+.1f}%/yr (USER ASSUMPTION)",
                    "emissions_basis": emissions_basis,
                    "carbon_cost_year1_usd": round(cc[0], 2),
                    "carbon_cost_total_usd": round(sum(cc), 2),
                    "carbon_stressed_debt_capacity_usd": round(debt_s, 2),
                    "binding_constraint": bind_s,
                    "delta_vs_base_usd": round(debt_s - debt, 2),
                    "delta_vs_base_pct": round((debt_s - debt) / debt * 100.0, 3) if debt > 0 else None,
                    "note": "CFADS_t - emissions_t x carbon_price_t re-sized with identical targets/caps. Shows how much "
                            "debt capacity an internalised carbon cost would remove.",
                }

            sustainability = {
                "margin_ratchet": {
                    "available": ratchet_rows is not None,
                    "ratchet_bps": su.ratchet_bps,
                    "avg_margin_adjustment_bps": round(avg_adj_bps, 3) if avg_adj_bps is not None else None,
                    "periods_kpi_met": sum(1 for x in ratchet_rows if x["kpi_met"]) if ratchet_rows else None,
                    "periods_total": len(ratchet_rows) if ratchet_rows else None,
                    "rows": ratchet_rows,
                    "note": None if ratchet_rows is not None else "provide emissions intensity path AND target to activate the SLL ratchet",
                },
                "green_loan_margin_benefit_bps": su.green_loan_margin_benefit_bps,
                "green_benefit_basis": "USER INPUT. Labeled market observation: loan 'greenium' studies report ~0-10 bps "
                                       "for green/SLL loans vs vanilla — not a live quote.",
                "base_cost_of_debt_pct": round(base_cost, 4),
                "sustainability_adjusted_cost_of_debt_pct": round(sust_adjusted_cost, 4),
                "carbon_stress": carbon,
            }

        # ── EXTENSION 7: lender report (flat, exportable) ────────────────────
        def _row(section, metric, value, basis=""):
            return {"section": section, "metric": metric, "value": value, "basis": basis}

        lender_report = [
            _row("Sizing", "Max supportable debt (USD)", round(debt, 2), f"binding: {binding_constraint}"),
            _row("Sizing", "DSCR-sculpted debt (USD)", round(debt_sculpt, 2), "PV of sculpted DS at debt rate"),
            _row("Sizing", "Gearing cap debt (USD)", round(debt_gearing_cap, 2), f"{req.max_gearing_pct}% x capex"),
            _row("Sizing", "Gearing achieved (%)", round(debt / req.capex_usd * 100.0, 2), ""),
            _row("Sizing", "Equity (USD)", round(equity, 2), ""),
            _row("Sizing", "Tenor (yrs) / all-in rate (%)", f"{n} / {req.interest_rate_pct}", ""),
            _row("Sizing", "DSRA at close (USD)", round(dsra_initial, 2), f"{req.dsra_months} months forward DS, equity-funded"),
            _row("Covenants", "Target DSCR contracted / merchant", f"{req.target_dscr_contracted} / {req.target_dscr_merchant}", "blended per period by revenue mix"),
            _row("Covenants", "Lock-up DSCR", req.lockup_dscr, "distribution test"),
            _row("Covenants", "Target LLCR / PLCR", f"{req.target_llcr or '—'} / {req.target_plcr or '—'}", "optional sizing constraints"),
            _row("Coverage (P50)", "Min / avg DSCR", f"{min(dscr50) if dscr50 else None} / {round(sum(dscr50) / len(dscr50), 4) if dscr50 else None}", "sponsor case"),
            _row("Coverage (P90)", "Min / avg DSCR", f"{min(dscr90) if dscr90 else None} / {round(sum(dscr90) / len(dscr90), 4) if dscr90 else None}",
                 "lender case" + (" (P90=P50 proxy)" if p90_proxy_flag else "")),
            _row("Coverage", "LLCR / PLCR at close", f"{round(llcr_at_close, 4) if llcr_at_close else None} / {round(plcr_at_close, 4) if plcr_at_close else None}",
                 "PV of sizing CFADS at debt rate / debt"),
            _row("Sponsor", "P50 equity IRR (%)", round(equity_irr * 100.0, 3) if equity_irr is not None else None, "post-sweep, post-DSRA"),
            _row("Breakevens", "CFADS haircut to 1.00x (%)", breakevens["cfads_haircut_pct"]["to_1_00x"], "uniform haircut, DS fixed"),
            _row("Breakevens", "CFADS haircut to lock-up (%)", breakevens["cfads_haircut_pct"]["to_lockup"], f"lock-up {req.lockup_dscr}x"),
            _row("Breakevens", "Merchant price to 1.00x (USD/MWh)", breakevens["merchant_price_usd_mwh"]["to_1_00x"], "derive mode; 0 = covered by contract alone"),
            _row("Breakevens", "All-in rate to 1.00x (%)", breakevens["interest_rate_pct"]["to_1_00x"], "balance path held, interest recomputed"),
        ]
        if tranching is not None:
            lender_report += [
                _row("Tranching", "Senior / mezz / total debt (USD)", f"{tranching['senior_debt_usd']} / {tranching['mezz_debt_usd']} / {tranching['total_debt_usd']}", tranching["mezz_binding_constraint"]),
                _row("Tranching", "Attachment / detachment (% capex)", f"{tranching['attachment_pct_of_capex']} / {tranching['detachment_pct_of_capex']}", ""),
                _row("Tranching", "Blended cost of debt (%)", tranching["blended_cost_of_debt_pct"], "balance-weighted coupon"),
                _row("Tranching", "Total min DSCR P50 / P90", f"{tranching['total_min_dscr_p50']} / {tranching['total_min_dscr_p90']}", "senior+mezz DS"),
            ]
        if mini_perm is not None:
            lender_report += [
                _row("Mini-perm", f"Balloon at year {mini_perm['balloon_year']} (USD)", mini_perm["balloon_usd"], f"{mini_perm['balloon_pct_of_debt']}% of debt"),
                _row("Mini-perm", "Refi-risk metric", mini_perm["refi_risk_metric"], "balloon / PV(post-balloon CFADS) — <=1 covered"),
                _row("Mini-perm", "Post-refi min DSCR (hard)", mini_perm["hard_vs_soft"][0]["post_refi_min_dscr_p50"], f"refi rate {mini_perm['hard_vs_soft'][0]['refi_rate_pct_assumed']}% (assumed)"),
                _row("Mini-perm", "Full-sweep payoff year (soft)", mini_perm["hard_vs_soft"][1]["full_sweep_payoff_year"], ""),
            ]
        if fx_out is not None:
            worst = fx_out["stressed_dscr_table"][-1] if fx_out["stressed_dscr_table"] else None
            lender_report += [
                _row("FX", "Revenue / debt currency", f"{fx_out['revenue_currency']} / {fx_out['debt_currency']}", fx_out["fx_path_basis"]),
                _row("FX", "Hedged share (%)", req.fx.hedged_share_pct, "closing spot locked on hedged leg"),
                _row("FX", f"Min DSCR at worst stress ({worst['depreciation_pct']}% depn)" if worst else "Min DSCR at worst stress",
                     worst["min_dscr_p50"] if worst else None, "unhedged leg shocked, DS fixed"),
            ]
        if sustainability is not None:
            lender_report += [
                _row("Sustainability", "Sustainability-adjusted cost of debt (%)", sustainability["sustainability_adjusted_cost_of_debt_pct"],
                     f"ratchet avg {sustainability['margin_ratchet']['avg_margin_adjustment_bps']} bps - green benefit {sustainability['green_loan_margin_benefit_bps']} bps"),
            ]
            if sustainability["carbon_stress"] is not None:
                lender_report += [
                    _row("Sustainability", "Carbon-stressed debt capacity (USD)", sustainability["carbon_stress"]["carbon_stressed_debt_capacity_usd"],
                         sustainability["carbon_stress"]["carbon_price_basis"]),
                    _row("Sustainability", "Debt capacity delta (USD / %)",
                         f"{sustainability['carbon_stress']['delta_vs_base_usd']} / {sustainability['carbon_stress']['delta_vs_base_pct']}%",
                         "carbon cost deducted from CFADS, re-sized"),
                ]

        return {
            "methodology": "DSCR sculpting: DS_t = CFADS_t / target_DSCR_t (blended by contracted revenue share); "
                           "max debt = PV(DS_t) at the debt rate; capped at max gearing. See route docstring.",
            "sizing": {
                "max_supportable_debt_usd": round(debt, 2),
                "dscr_sculpted_debt_usd": round(debt_sculpt, 2),
                "gearing_cap_debt_usd": round(debt_gearing_cap, 2),
                "llcr_cap_debt_usd": round(debt_llcr_cap, 2) if debt_llcr_cap is not None else None,
                "plcr_cap_debt_usd": round(debt_plcr_cap, 2) if debt_plcr_cap is not None else None,
                "binding_constraint": binding_constraint,
                "gearing_achieved_pct": round(debt / req.capex_usd * 100.0, 2),
                "equity_usd": round(equity, 2),
                "dsra_initial_usd": round(dsra_initial, 2),
                "sizing_basis": req.sizing_basis,
                "tenor_years": n,
                "interest_rate_pct": req.interest_rate_pct,
            },
            "sponsor_case_p50": {
                "equity_irr_pct": round(equity_irr * 100.0, 3) if equity_irr is not None else None,
                "min_dscr": min(dscr50) if dscr50 else None,
                "avg_dscr": round(sum(dscr50) / len(dscr50), 4) if dscr50 else None,
            },
            "lender_case_p90": {
                "min_dscr": min(dscr90) if dscr90 else None,
                "avg_dscr": round(sum(dscr90) / len(dscr90), 4) if dscr90 else None,
                "p90_is_p50_proxy": p90_proxy_flag,
            },
            "multi_metric": multi_metric,
            "tranching": tranching,
            "mini_perm": mini_perm,
            "fx": fx_out,
            "breakevens": breakevens,
            "sustainability": sustainability,
            "lender_report": lender_report,
            "schedule": rows,
            "derive_detail": derive_detail,
            "flags": {
                "p90_proxy": p90_proxy_flag,
                "sweep_note": sweep_note,
                "tax_note": "Cash tax (if any) = rate x max(0, EBITDA - SL depreciation); interest shield ignored "
                            "(conservative, avoids sizing circularity)" if req.derive and req.derive.tax_rate_pct > 0 else None,
                "fx_note": "CFADS converted to debt currency on a USER FX path before sizing" if fx_out is not None else None,
            },
        }
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.exception("pf-debt-sizing /size error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────────────────────
# Reference benchmarks (hand-authored market conventions — labeled)
# ─────────────────────────────────────────────────────────────────────────────
_DSCR_BENCHMARKS = [
    {"contract_type": "Fully contracted solar PV (IG offtaker, 20yr+ PPA)",
     "target_dscr_contracted": 1.20, "target_dscr_merchant": None, "max_gearing_pct": 85, "typical_tenor_years": "18-22 (or PPA-1)",
     "note": "Lowest resource + revenue risk; mini-perm structures may push gearing higher with refi assumption"},
    {"contract_type": "Fully contracted onshore wind (IG offtaker)",
     "target_dscr_contracted": 1.30, "target_dscr_merchant": None, "max_gearing_pct": 80, "typical_tenor_years": "15-18",
     "note": "Higher inter-annual resource variability than solar (wider P90/P50 spread)"},
    {"contract_type": "Contracted offshore wind (CfD / IG PPA)",
     "target_dscr_contracted": 1.35, "target_dscr_merchant": None, "max_gearing_pct": 75, "typical_tenor_years": "15-18",
     "note": "Construction complexity + O&M uncertainty premium over onshore"},
    {"contract_type": "Hybrid solar 60-70% contracted / merchant tail",
     "target_dscr_contracted": 1.30, "target_dscr_merchant": 1.80, "max_gearing_pct": 75, "typical_tenor_years": "15-18",
     "note": "Blend targets by revenue mix per period — the sculpting engine on this route does exactly this"},
    {"contract_type": "Merchant-heavy renewables (<30% contracted)",
     "target_dscr_contracted": 1.35, "target_dscr_merchant": 2.00, "max_gearing_pct": 60, "typical_tenor_years": "7-12 (mini-perm)",
     "note": "Merchant curve haircuts + shorter tenor; sized on P90 with sweep"},
    {"contract_type": "Contracted thermal / availability-based (tolling, capacity)",
     "target_dscr_contracted": 1.20, "target_dscr_merchant": 1.75, "max_gearing_pct": 80, "typical_tenor_years": "12-17",
     "note": "Availability-based revenue behaves like contracted; fuel pass-through assumed"},
    {"contract_type": "Availability-based PPP / social infrastructure",
     "target_dscr_contracted": 1.15, "target_dscr_merchant": None, "max_gearing_pct": 90, "typical_tenor_years": "20-28",
     "note": "Government-grade counterparty, no volume risk — tightest DSCRs in the market"},
    {"contract_type": "BESS tolled / capacity-contracted",
     "target_dscr_contracted": 1.35, "target_dscr_merchant": 2.25, "max_gearing_pct": 70, "typical_tenor_years": "10-15",
     "note": "Degradation/augmentation reserve expected; merchant arbitrage heavily haircut"},
]

# LLCR/PLCR + structuring conventions (hand-authored, labeled — same basis as above)
_STRUCTURE_BENCHMARKS = {
    "llcr_plcr_conventions": [
        {"metric": "LLCR", "typical_target": "1.30-1.50x", "note": "PV of CFADS over the DEBT TENOR / debt; usually ~0.05-0.15x above min DSCR target"},
        {"metric": "PLCR", "typical_target": "1.50-1.80x", "note": "PV of CFADS over PROJECT LIFE / debt; captures post-tenor tail value"},
    ],
    "mezz_conventions": [
        {"item": "Mezz target DSCR (on residual CFADS)", "typical": "1.10-1.30x on TOTAL DS, i.e. ~2.0-3.0x on residual", "note": "priced 300-600 bps above senior"},
        {"item": "Detachment", "typical": "85-92% of capex", "note": "total gearing cap across the stack"},
    ],
    "mini_perm_conventions": [
        {"item": "Balloon year", "typical": "5-7", "note": "bank market construction+ramp financing"},
        {"item": "Spread at refi", "typical": "+50-150 bps assumed", "note": "user assumption in this engine — labeled, never forecast"},
    ],
    "sustainability_conventions": [
        {"item": "SLL margin ratchet", "typical": "±2.5-10 bps", "note": "two-way on KPI/SPT test (LMA SLL Principles structure)"},
        {"item": "Green loan 'greenium'", "typical": "0-10 bps", "note": "empirical studies range; input is user-set and labeled"},
    ],
    "basis_note": "Hand-authored market conventions (2023-2025 vintage term sheets) — editable starting points, NOT live quotes.",
}


@router.get("/ref/dscr-benchmarks", summary="Market-convention DSCR / gearing / tenor benchmarks by contract type")
async def dscr_benchmarks():
    return {
        "benchmarks": _DSCR_BENCHMARKS,
        "structure_benchmarks": _STRUCTURE_BENCHMARKS,
        "basis_note": "Hand-authored market-convention defaults reflecting typical project-finance term sheets "
                      "(2023-2025 vintage, IG-sponsor deals, USD/EUR markets). These are editable starting points, "
                      "NOT live market quotes — actual terms vary by sponsor, jurisdiction, and bank appetite. "
                      "Contracted DSCR applies to contracted-revenue CFADS; merchant DSCR to merchant CFADS; "
                      "the /size endpoint blends them per period by revenue mix.",
        "as_of": "2026-07 (authored)",
    }
