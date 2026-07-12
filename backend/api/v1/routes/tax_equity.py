"""
Tax Equity & Transferability Engine — US IRA Monetization
==========================================================
NX2-13 (`/tax-equity-transferability`). Partnership-flip tax-equity
economics vs direct credit transfer under the Inflation Reduction Act,
plus sale-leaseback / inverted-lease structure menu, §50 recapture &
DRO / §704(b) capital-account tracking, bonus-depreciation phase-down,
§6418 transfer-market depth and a sustainability×financial overlay
(effective $/tCO2e of the federal tax subsidy).

REAL IRA PARAMETERS (labeled, IRC basis)
----------------------------------------
- ITC (IRC §48 / §48E): base 6%, ×5 = 30% when prevailing-wage &
  apprenticeship (PWA) requirements are met. Adders: energy community
  +10pp (+2pp without PWA), domestic content +10pp (+2pp without PWA).
- PTC (IRC §45 / §45Y): base 0.3 ¢/kWh, ×5 = 1.5 ¢/kWh (1992$) with PWA,
  inflation-adjusted — the 2024 IRS-published rate is 2.75 ¢/kWh
  ($27.50/MWh). Energy-community and domestic-content adders are each
  +10% OF THE CREDIT AMOUNT (multiplicative), not percentage points.
  Credit runs 10 years from placed-in-service.
- MACRS 5-year (IRC §168, half-year convention) percentages:
  20 / 32 / 19.2 / 11.52 / 11.52 / 5.76 over 6 tax years.
- BONUS DEPRECIATION (IRC §168(k), TCJA phase-down as amended):
  100% (2022) / 80% (2023) / 60% (2024) / 40% (2025) / 20% (2026) /
  0% (2027+). OBBBA (P.L. 119-21, enacted July 2025) RESTORED 100%
  bonus for qualified property acquired after Jan 19 2025 — offered as
  an explicit labeled toggle (apply_obbba_100pct_bonus) rather than
  silently applied; confirm against final regulations for your facts.
- ITC basis reduction (IRC §50(c)(3)): depreciable basis is reduced by
  50% of the ITC claimed (partnership / direct ownership). In an
  INVERTED LEASE the lessee instead includes 50% of the ITC in income
  ratably over 5 years (§50(d)(5)) — no basis reduction.
- ITC RECAPTURE (IRC §50(a)(1)): the credit vests 20% per full year
  over 5 years. Disposition (or cessation of qualified use) after y
  FULL years claws back (100 − 20·y)% of the credit:
      end of yr1 → 80%, yr2 → 60%, yr3 → 40%, yr4 → 20%, yr5+ → 0%.
  (Statutory bands are phrased "less than y full years"; here the
  schedule is keyed on completed vesting years — documented.)
- Transferability (IRC §6418): credits may be sold once, for cash, to an
  unrelated party; proceeds are tax-free to the seller and
  non-deductible to the buyer. Market pricing ~$0.90-0.95 per $1.00 of
  credit per market commentary — APPROXIMATE, user-editable; a
  hand-authored size/type/vintage discount table is served at
  /ref/transfer-market.

FLIP SOLVER (documented)
------------------------
Year-by-year after-tax allocation model:
  revenue_t = generation × PPA price × (1+esc)^(t-1);  opex escalated alike
  taxable_t = revenue_t − opex_t − dep_t   (depreciation per the chosen
              schedule: MACRS 5-yr, bonus + MACRS remainder, or straight line)
  tax_t     = taxable_t × tax_rate           (negative = benefit; both
              partners assumed to have full tax appetite — labeled)
  credits_t = ITC in year 1, or inflation-adjusted PTC in years 1-10
  partnership after-tax value_t = (revenue_t − opex_t) − tax_t + credits_t
The TE investor funds te_investment_pct × capex at t=0 and receives
pre-flip_alloc % of every year's after-tax value (single allocation applied
to cash and tax items — documented simplification of the §704(b) waterfall).
FLIP YEAR = the FIRST year t at which the IRR of the TE flow vector
[−I0, f1 … ft] (computed by bisection on (1+irr)) reaches the target
after-tax IRR. From t+1 the allocation switches to the post-flip share.
Sponsor flows are the complement plus the initial equity gap.

CAPITAL ACCOUNTS & DRO (documented partnership-accounting simplification)
-------------------------------------------------------------------------
A §704(b) BOOK capital-account roll for the TE partner is tracked
alongside (informational — it does not feed back into the cash flows,
preserving the documented single-allocation model):
  CapAcct_0 = TE investment
  CapAcct_t = CapAcct_{t-1} + alloc×book income_t − alloc×cash distributed_t
              (year 1 additionally − alloc × 50%·ITC, the §50(c)(3)
               capital-account adjustment)
Book income is taken equal to taxable income (no book/tax disparity
modeled — labeled). The DEFICIT-RESTORATION-OBLIGATION cap is
dro_cap_pct × TE investment: in any year where the roll would breach
−cap, the excess loss that a §704(b) partnership would reallocate to
the sponsor is reported and the year flagged (reallocation shown, not
re-priced — documented simplification).

STRUCTURE MENU (POST /structures — simplified but real structures)
------------------------------------------------------------------
1. PARTNERSHIP FLIP — as above.
2. SALE-LEASEBACK — sponsor sells the project at FMV (capex × (1+step-up),
   the §50(d)(4) 3-month-window FMV step-up) to the tax-equity lessor and
   leases it back at a LEVEL RENT solved by bisection so the lessor's
   after-tax IRR (rent×(1−tax) + dep shield + year-1 ITC on FMV basis,
   basis reduced by 50% ITC) meets its target. Sponsor: sale proceeds
   (gain taxed at close — simplification) minus rent, rent deductible,
   no depreciation.
3. INVERTED LEASE (lease pass-through) — sponsor-lessor keeps ownership
   and FULL depreciation (no §50(c)(3) haircut); TE-lessee takes the ITC
   via the pass-through election, includes 50% of the ITC in income
   ratably over 5 years (§50(d)(5)) and receives a revenue strip for the
   lease term. The TE prepaid-rent investment is solved by bisection to
   its target IRR.
Each structure reports sponsor IRR/NPV, TE IRR (solved to target),
complexity and recapture exposure, and the subsidy intensity ($/tCO2e).

TRANSFERABILITY COMPARISON + MARKET DEPTH
------------------------------------------
Same project, no TE partner: sponsor funds 100% of capex, keeps all cash,
all depreciation (requires own tax appetite — flagged), and sells the
credits at $X per $1.00 (§6418). ITC → single year-1 payment;
PTC → ten annual sales. A hand-authored discount table (credit type ×
size tier × vintage), insurance-wrap cost, forward-vs-spot commitment
comparison and a HYBRID (flip + transfer of a credit carve-out, re-solved
end-to-end) are reported.

SUSTAINABILITY × FINANCIAL OVERLAY (documented)
-----------------------------------------------
Effective $/tCO2e of the federal tax subsidy = PV(credits + depreciation
tax shield, at the user subsidy discount rate) ÷ lifetime avoided
emissions (generation × user grid intensity × horizon). Domestic-content
and energy-community qualification checklists (real IRA criteria,
summarized and labeled) are served at /ref/adder-checklists.

Registered in server.py with prefix /api/v1/tax-equity.
"""
from __future__ import annotations

from typing import List, Literal, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/tax-equity", tags=["Tax Equity & Transferability"])

# ---------------------------------------------------------------------------
# Real IRA constants (transparent — served at /ref/ira-parameters)
# ---------------------------------------------------------------------------
MACRS_5YR_PCT = [20.0, 32.0, 19.2, 11.52, 11.52, 5.76]  # IRC §168(b), half-year convention

# IRC §168(k) bonus-depreciation phase-down (TCJA as amended) — REAL rates.
BONUS_PHASEDOWN_PCT = {2022: 100.0, 2023: 80.0, 2024: 60.0, 2025: 40.0, 2026: 20.0, 2027: 0.0}
OBBBA_NOTE = (
    "OBBBA (P.L. 119-21, enacted July 2025) restored 100% bonus depreciation for qualified "
    "property acquired after Jan 19 2025 — offered here as an explicit toggle "
    "(apply_obbba_100pct_bonus) rather than silently applied; confirm eligibility (acquisition "
    "date, binding-contract rules) against final regulations for your facts."
)

# IRC §50(a)(1) ITC recapture — credit vests 20%/yr over 5 years. Keyed on
# COMPLETED vesting years at disposition (documented convention: statutory
# bands are phrased 'less than y full years').
ITC_RECAPTURE_SCHEDULE_PCT = {0: 100.0, 1: 80.0, 2: 60.0, 3: 40.0, 4: 20.0, 5: 0.0}

IRA_PARAMETERS = {
    "label": "Real IRA statutory parameters (IRC §48/§45/§168/§50(c)(3)/§6418) — rates as enacted; "
             "PTC dollar figure is the IRS 2024 inflation-adjusted published rate.",
    "itc": {
        "statute": "IRC §48 / §48E (Investment Tax Credit)",
        "base_rate_pct": 6.0,
        "pwa_multiplier": 5.0,
        "base_rate_with_pwa_pct": 30.0,
        "energy_community_adder_pp": {"with_pwa": 10.0, "without_pwa": 2.0},
        "domestic_content_adder_pp": {"with_pwa": 10.0, "without_pwa": 2.0},
        "max_stack_pct": 50.0,
        "basis_reduction": "Depreciable basis reduced by 50% of ITC claimed (IRC §50(c)(3))",
        "recapture": "5-yr vesting at 20%/yr (IRC §50(a)(1)) — see recapture schedule in /flip output",
    },
    "ptc": {
        "statute": "IRC §45 / §45Y (Production Tax Credit)",
        "base_rate_2024_usd_mwh": 27.50,
        "note": "0.3 ¢/kWh base ×5 with PWA, inflation-adjusted; 2.75 ¢/kWh published for 2024",
        "duration_years": 10,
        "energy_community_adder_pct_of_credit": 10.0,
        "domestic_content_adder_pct_of_credit": 10.0,
    },
    "macrs_5yr_pct": MACRS_5YR_PCT,
    "bonus_depreciation_phasedown_pct": BONUS_PHASEDOWN_PCT,
    "obbba_note": OBBBA_NOTE,
    "itc_recapture_schedule_pct": ITC_RECAPTURE_SCHEDULE_PCT,
    "transferability": {
        "statute": "IRC §6418",
        "market_price_range_per_dollar": [0.90, 0.95],
        "note": "One-time sale for cash to unrelated party; tax-free to seller, non-deductible to buyer. "
                "Range per market commentary (2023-2025 broker reports) — APPROXIMATE.",
    },
    "federal_corporate_tax_rate_pct": 21.0,
}

# ---------------------------------------------------------------------------
# §6418 transfer-market discount table — HAND-AUTHORED market-observation
# basis (2023-2025 broker/market commentary), APPROXIMATE, transparent.
# PTC prices tighter than ITC (no recapture / basis-step diligence risk);
# larger deals price tighter (fixed diligence cost amortized).
# ---------------------------------------------------------------------------
TRANSFER_MARKET_TABLE = {
    "label": "Hand-authored §6418 transfer-pricing observation table — market commentary basis "
             "(2023-2025 broker reports), APPROXIMATE and user-overridable; not a quote.",
    "rows": [
        {"credit": "ITC", "size_tier": "<$25M",    "price_per_dollar": 0.905},
        {"credit": "ITC", "size_tier": "$25-100M", "price_per_dollar": 0.925},
        {"credit": "ITC", "size_tier": ">$100M",   "price_per_dollar": 0.940},
        {"credit": "PTC", "size_tier": "<$25M",    "price_per_dollar": 0.925},
        {"credit": "PTC", "size_tier": "$25-100M", "price_per_dollar": 0.945},
        {"credit": "PTC", "size_tier": ">$100M",   "price_per_dollar": 0.955},
    ],
    "vintage_adjustment_per_dollar": {
        "spot_current_year": 0.0,
        "forward_next_year": -0.015,
        "forward_2plus_years": -0.025,
    },
    "notes": [
        "PTC strips price tighter than ITC — no recapture exposure and no basis/step-up diligence.",
        "Size tiers reflect fixed diligence/legal cost amortization; sub-$25M deals clear wider.",
        "Forward commitments (next-vintage credits) clear ~1.5c back of spot; 2+ years ~2.5c back — "
        "buyers price delivery risk and their own tax-capacity forecast.",
        "ITC recapture/qualification insurance wraps typically run ~100-300bp of credit face "
        "(hand-authored range) and materially tighten achievable pricing for sub-scale sellers.",
    ],
}

# Domestic-content & energy-community qualification checklists — REAL IRA
# criteria, summarized and labeled (statutes + IRS notices cited).
ADDER_CHECKLISTS = {
    "label": "Real IRA adder-qualification criteria, summarized (statutes / IRS notices cited) — "
             "a screening checklist, not tax advice.",
    "domestic_content": {
        "statute": "IRC §45(b)(9) / §48(a)(12); IRS Notice 2023-38 (as updated by Notice 2024-41)",
        "adder": "+10pp ITC (with PWA; +2pp without) / +10% of PTC",
        "checklist": [
            "100% of structural steel & iron manufactured in the US (melted & poured standard).",
            "Manufactured products: 'adjusted percentage' of total manufactured-product cost is "
            "US-manufactured — 40% for projects beginning construction pre-2025, stepping to 55% "
            "for construction beginning after 2026 (offshore wind: 20% stepping to 55%).",
            "Certification statement filed with the return for the year the project is placed in service.",
            "Cost basis for the percentage test is the manufacturer's direct material + labor cost "
            "(Notice 2023-38 safe-harbor categories commonly used).",
        ],
    },
    "energy_community": {
        "statute": "IRC §45(b)(11) / §48(a)(14); IRS Notice 2023-29 (as updated)",
        "adder": "+10pp ITC (with PWA; +2pp without) / +10% of PTC",
        "checklist": [
            "Brownfield site (CERCLA §101(39) definition), OR",
            "Statistical area with ≥0.17% direct fossil-fuel employment (or ≥25% fossil local tax "
            "revenue) AND unemployment at or above the prior-year national average, OR",
            "Census tract (or adjoining tract) with a coal mine closed after 1999 or a coal-fired "
            "generating unit retired after 2009.",
            "Test date: generally the placed-in-service date (ITC) or each year of the credit period "
            "(PTC) — beginning-of-construction safe harbor available (Notice 2023-29).",
        ],
    },
}


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

DepreciationMethod = Literal["macrs_5yr", "bonus", "straight_line"]


class FlipRequest(BaseModel):
    # Project
    capex_musd: float = Field(180.0, gt=0, description="Total capex, $M")
    itc_eligible_pct: float = Field(95.0, ge=0, le=100, description="Share of capex that is ITC-eligible basis")
    credit_mode: Literal["itc", "ptc"] = "itc"
    # ITC adders (IRC §48)
    prevailing_wage_met: bool = Field(True, description="PWA requirements met (×5 multiplier)")
    energy_community: bool = Field(False, description="+10pp ITC / +10% PTC adder")
    domestic_content: bool = Field(False, description="+10pp ITC / +10% PTC adder")
    # PTC (IRC §45)
    ptc_rate_usd_mwh: float = Field(27.50, ge=0, description="PTC $/MWh (2024 published, editable)")
    ptc_inflation_pct: float = Field(2.0, ge=0, le=10, description="Annual inflation adjustment for PTC")
    # Operations
    annual_generation_mwh: float = Field(420_000, gt=0, description="P50 annual generation, MWh")
    use_p90_generation: bool = Field(
        False, description="Run the model at P90 generation (P50 × p90_factor) — flows to revenue AND credit volume")
    p90_factor: float = Field(
        0.88, gt=0, le=1, description="P90/P50 generation ratio (hand-authored default 0.88 — editable)")
    ppa_price_usd_mwh: float = Field(48.0, gt=0)
    revenue_escalation_pct: float = Field(1.5, ge=-5, le=10)
    annual_opex_musd: float = Field(3.2, ge=0)
    opex_escalation_pct: float = Field(2.0, ge=-5, le=10)
    # Tax
    tax_rate_pct: float = Field(21.0, ge=0, le=60, description="Combined effective tax rate (21% federal default)")
    depreciation_method: DepreciationMethod = Field(
        "macrs_5yr", description="MACRS 5-yr (default) | bonus (§168(k) phase-down + MACRS remainder) | straight line")
    placed_in_service_year: int = Field(
        2026, ge=2022, le=2030, description="Placed-in-service year — drives the §168(k) bonus phase-down rate")
    apply_obbba_100pct_bonus: bool = Field(
        False, description="Apply the OBBBA (P.L. 119-21, 2025) 100% bonus restoration — labeled toggle, "
                           "confirm acquisition-date eligibility against final regs")
    straight_line_years: int = Field(
        12, ge=5, le=30, description="Straight-line recovery period (12-yr ADS-style default for solar)")
    subsidy_discount_rate_pct: float = Field(
        7.0, ge=0, le=25, description="Discount rate for NPV-of-tax-benefits, PTC PV and $/tCO2e metrics")
    # Tax-equity structure
    te_target_irr_pct: float = Field(7.5, gt=0, le=30, description="TE investor target after-tax IRR")
    te_investment_pct_of_capex: float = Field(40.0, gt=0, le=100)
    preflip_te_alloc_pct: float = Field(99.0, ge=50, le=100)
    postflip_te_alloc_pct: float = Field(5.0, ge=0, le=50)
    analysis_years: int = Field(20, ge=6, le=35)
    dro_cap_pct_of_investment: float = Field(
        25.0, ge=0, le=100, description="Deficit-restoration-obligation cap as % of TE investment "
                                        "(documented §704(b) simplification)")
    disposition_year: Optional[int] = Field(
        None, ge=1, le=35, description="Optional disposition scenario — end-of-year sale triggering §50(a)(1) "
                                       "ITC recapture (full scenario table always returned)")
    # Transferability
    transfer_price_per_dollar: float = Field(
        0.92, ge=0.5, le=1.0,
        description="Credit sale price per $1.00 (§6418) — ~0.90-0.95 per market commentary, approximate")
    insurance_wrap_pct_of_credit: float = Field(
        1.25, ge=0, le=10, description="Recapture/qualification insurance wrap cost, % of credit face "
                                       "(hand-authored ~1-3% range, labeled)")
    hybrid_transfer_pct: float = Field(
        25.0, ge=0, le=100, description="Hybrid illustration: % of credits carved out of the flip and sold "
                                        "under §6418 (flip re-solved end-to-end)")
    # Sustainability × financial
    grid_intensity_tco2_mwh: float = Field(
        0.38, ge=0, le=2, description="Displaced-grid emissions intensity, tCO2e/MWh — drives avoided "
                                      "emissions and the $/tCO2e subsidy metric (user input, labeled)")


class FlipYearRow(BaseModel):
    year: int
    revenue_musd: float
    opex_musd: float
    pretax_cash_musd: float
    depreciation_musd: float
    taxable_income_musd: float
    tax_musd: float
    credits_musd: float
    after_tax_value_musd: float
    te_alloc_pct: float
    te_cf_musd: float
    sponsor_cf_musd: float
    te_cumulative_irr_pct: Optional[float]


class FlipResponse(BaseModel):
    flip_year: Optional[int]
    flip_achieved: bool
    te_irr_at_flip_pct: Optional[float]
    te_full_horizon_irr_pct: Optional[float]
    sponsor_irr_flip_structure_pct: Optional[float]
    sponsor_irr_transfer_structure_pct: Optional[float]
    te_investment_musd: float
    sponsor_equity_musd: float
    gross_credit_musd: float
    itc_rate_applied_pct: Optional[float]
    ptc_effective_rate_usd_mwh: Optional[float]
    depreciable_basis_musd: float
    yearly: List[FlipYearRow]
    transferability: dict
    # ── depth additions (all additive) ──────────────────────────────────────
    recapture: dict
    capital_accounts: dict
    depreciation_comparison: dict
    transfer_market: dict
    ptc_detail: Optional[dict]
    sustainability: dict
    solver_notes: List[str]


# ---------------------------------------------------------------------------
# IRR by bisection (documented deterministic solver — no PRNG)
# ---------------------------------------------------------------------------

def _irr(flows: List[float], lo: float = -0.95, hi: float = 5.0, tol: float = 1e-7) -> Optional[float]:
    """Bisection IRR. Returns None when no sign change exists in [lo, hi]
    (e.g., all-negative cumulative flows early in the flip scan)."""
    def npv(rate: float) -> float:
        return sum(cf / (1.0 + rate) ** t for t, cf in enumerate(flows))
    f_lo, f_hi = npv(lo), npv(hi)
    if f_lo * f_hi > 0:
        return None
    for _ in range(200):
        mid = (lo + hi) / 2.0
        f_mid = npv(mid)
        if abs(f_mid) < tol:
            return mid
        if f_lo * f_mid < 0:
            hi = mid
        else:
            lo, f_lo = mid, f_mid
    return (lo + hi) / 2.0


def _npv(flows: List[float], rate: float) -> float:
    """NPV with flows[0] at t=0 (deterministic)."""
    return sum(cf / (1.0 + rate) ** t for t, cf in enumerate(flows))


def _depreciation_schedule(method: str, basis: float, pis_year: int,
                           obbba: bool, sl_years: int) -> List[float]:
    """Depreciation schedule ($M per tax year) for the chosen method:
      macrs_5yr      — IRC §168 5-yr half-year-convention percentages
      bonus          — §168(k) first-year bonus at the TCJA phase-down rate
                       (or 100% under the labeled OBBBA toggle), remainder
                       through the MACRS 5-yr schedule
      straight_line  — basis / sl_years for sl_years years (ADS-style)"""
    if method == "macrs_5yr":
        return [basis * p / 100.0 for p in MACRS_5YR_PCT]
    if method == "bonus":
        bonus_pct = 100.0 if obbba else BONUS_PHASEDOWN_PCT.get(min(max(pis_year, 2022), 2027), 0.0)
        b = basis * bonus_pct / 100.0
        rest = basis - b
        sched = [rest * p / 100.0 for p in MACRS_5YR_PCT]
        sched[0] += b
        return sched
    # straight_line
    return [basis / sl_years] * sl_years


def _table_transfer_price(credit_mode: str, gross_credit_musd: float) -> dict:
    """Auto-select the hand-authored §6418 table price by credit type & size."""
    kind = "ITC" if credit_mode == "itc" else "PTC"
    tier = "<$25M" if gross_credit_musd < 25 else ("$25-100M" if gross_credit_musd <= 100 else ">$100M")
    row = next(r for r in TRANSFER_MARKET_TABLE["rows"] if r["credit"] == kind and r["size_tier"] == tier)
    return {"credit": kind, "size_tier": tier, "price_per_dollar": row["price_per_dollar"]}


# ---------------------------------------------------------------------------
# Core flip model (shared by /flip and /structures — behavior-preserving
# refactor of the original solve_flip body)
# ---------------------------------------------------------------------------

def _flip_core(req: FlipRequest) -> dict:
    """Year-by-year after-tax model + flip scan. Deterministic — no PRNG.
    Returns every intermediate needed by /flip and /structures."""
    tax_rate = req.tax_rate_pct / 100.0
    n = req.analysis_years
    gen_mwh = req.annual_generation_mwh * (req.p90_factor if req.use_p90_generation else 1.0)

    # ── Credit sizing (real IRA parameters, labeled) ────────────────────────
    itc_rate_pct: Optional[float] = None
    ptc_eff: Optional[float] = None
    eligible_basis = req.capex_musd * req.itc_eligible_pct / 100.0

    if req.credit_mode == "itc":
        base = 30.0 if req.prevailing_wage_met else 6.0
        adder = (10.0 if req.prevailing_wage_met else 2.0)
        itc_rate_pct = base \
            + (adder if req.energy_community else 0.0) \
            + (adder if req.domestic_content else 0.0)
        gross_itc = eligible_basis * itc_rate_pct / 100.0
        depreciable_basis = req.capex_musd - 0.5 * gross_itc  # IRC §50(c)(3)
    else:
        ptc_eff = req.ptc_rate_usd_mwh * (1.0
                                          + (0.10 if req.energy_community else 0.0)
                                          + (0.10 if req.domestic_content else 0.0))
        gross_itc = 0.0
        depreciable_basis = req.capex_musd  # no §50(c)(3) haircut for PTC

    dep_sched = _depreciation_schedule(req.depreciation_method, depreciable_basis,
                                       req.placed_in_service_year, req.apply_obbba_100pct_bonus,
                                       req.straight_line_years)

    # ── Year-by-year partnership after-tax value ────────────────────────────
    revenue, opex, dep, taxable, tax, credits, atv = [], [], [], [], [], [], []
    total_credits = 0.0
    for t in range(1, n + 1):
        rev_t = (gen_mwh * req.ppa_price_usd_mwh / 1e6) \
            * (1.0 + req.revenue_escalation_pct / 100.0) ** (t - 1)
        opx_t = req.annual_opex_musd * (1.0 + req.opex_escalation_pct / 100.0) ** (t - 1)
        dep_t = dep_sched[t - 1] if t <= len(dep_sched) else 0.0
        taxable_t = rev_t - opx_t - dep_t
        tax_t = taxable_t * tax_rate  # negative = benefit (full tax appetite assumed, labeled)
        if req.credit_mode == "itc":
            cred_t = gross_itc if t == 1 else 0.0
        else:
            cred_t = (gen_mwh * ptc_eff / 1e6) \
                * (1.0 + req.ptc_inflation_pct / 100.0) ** (t - 1) if t <= 10 else 0.0
        atv_t = (rev_t - opx_t) - tax_t + cred_t
        revenue.append(rev_t); opex.append(opx_t); dep.append(dep_t)
        taxable.append(taxable_t); tax.append(tax_t); credits.append(cred_t); atv.append(atv_t)
        total_credits += cred_t

    # ── Flip scan: first year TE cumulative IRR ≥ target at pre-flip alloc ──
    te_inv = req.capex_musd * req.te_investment_pct_of_capex / 100.0
    pre = req.preflip_te_alloc_pct / 100.0
    post = req.postflip_te_alloc_pct / 100.0
    target = req.te_target_irr_pct / 100.0

    flip_year: Optional[int] = None
    te_irr_at_flip: Optional[float] = None
    cum_irrs: List[Optional[float]] = []
    te_flows_scan = [-te_inv]
    for t in range(1, n + 1):
        te_flows_scan.append(atv[t - 1] * pre)
        irr_t = _irr(te_flows_scan)
        cum_irrs.append(irr_t)
        if flip_year is None and irr_t is not None and irr_t >= target:
            flip_year, te_irr_at_flip = t, irr_t

    # ── Final allocation with the flip applied ──────────────────────────────
    te_flows = [-te_inv]
    sponsor_flows = [-(req.capex_musd - te_inv)]
    allocs = []
    for t in range(1, n + 1):
        alloc = pre if (flip_year is None or t <= flip_year) else post
        allocs.append(alloc)
        te_flows.append(atv[t - 1] * alloc)
        sponsor_flows.append(atv[t - 1] * (1.0 - alloc))

    return {
        "tax_rate": tax_rate, "n": n, "gen_mwh": gen_mwh,
        "itc_rate_pct": itc_rate_pct, "ptc_eff": ptc_eff, "eligible_basis": eligible_basis,
        "gross_itc": gross_itc, "depreciable_basis": depreciable_basis, "dep_sched": dep_sched,
        "revenue": revenue, "opex": opex, "dep": dep, "taxable": taxable, "tax": tax,
        "credits": credits, "atv": atv, "total_credits": total_credits,
        "te_inv": te_inv, "pre": pre, "post": post, "target": target,
        "flip_year": flip_year, "te_irr_at_flip": te_irr_at_flip, "cum_irrs": cum_irrs,
        "te_flows": te_flows, "sponsor_flows": sponsor_flows, "allocs": allocs,
        "te_full_irr": _irr(te_flows), "sponsor_irr_flip": _irr(sponsor_flows),
    }


# ---------------------------------------------------------------------------
# Depth blocks (recapture / capital accounts / depreciation NPV / transfer
# market / PTC / sustainability) — all documented, deterministic
# ---------------------------------------------------------------------------

def _recapture_block(req: FlipRequest, core: dict) -> dict:
    """IRC §50(a)(1) recapture schedule + disposition scenarios."""
    gross_itc = core["gross_itc"]
    schedule = [
        {"full_years_elapsed": y, "vested_pct": 100.0 - pct, "recapture_pct": pct,
         "recapture_musd": round(gross_itc * pct / 100.0, 3)}
        for y, pct in ITC_RECAPTURE_SCHEDULE_PCT.items()
    ]
    scenarios = []
    for y in range(1, 7):
        pct = ITC_RECAPTURE_SCHEDULE_PCT.get(min(y, 5), 0.0)
        scenarios.append({
            "disposition_end_of_year": y,
            "recapture_pct": pct,
            "recapture_musd": round(gross_itc * pct / 100.0, 3),
            "note": "fully vested — no recapture" if pct == 0 else
                    f"{pct:.0f}% of the ITC clawed back ({100 - pct:.0f}% vested at {min(y,5)} full years)",
        })
    chosen = None
    if req.disposition_year is not None and req.credit_mode == "itc":
        pct = ITC_RECAPTURE_SCHEDULE_PCT.get(min(req.disposition_year, 5), 0.0)
        chosen = {
            "disposition_end_of_year": req.disposition_year,
            "recapture_pct": pct,
            "recapture_musd": round(gross_itc * pct / 100.0, 3),
        }
    return {
        "statute": "IRC §50(a)(1) — 5-year vesting at 20%/yr; recapture % = 100 − 20 × completed vesting years",
        "convention": "Disposition at END of year y = y full vesting years elapsed (statutory bands are "
                      "phrased 'less than y full years') — documented",
        "applies": req.credit_mode == "itc",
        "gross_itc_musd": round(gross_itc, 3),
        "schedule": schedule,
        "disposition_scenarios": scenarios,
        "chosen_scenario": chosen,
        "note": ("PTC has NO investment recapture — credits accrue on production; the schedule is shown "
                 "for reference only." if req.credit_mode == "ptc" else
                 "In a flip the TE partner typically holds recapture indemnities from the sponsor; in a "
                 "§6418 transfer the BUYER bears recapture (§6418(g)(3)) — hence insurance wraps."),
    }


def _capital_account_block(req: FlipRequest, core: dict) -> dict:
    """§704(b) BOOK capital-account roll for the TE partner + DRO cap check.
    Informational — does not feed back into cash flows (documented)."""
    te_inv, allocs = core["te_inv"], core["allocs"]
    dro_cap = te_inv * req.dro_cap_pct_of_investment / 100.0
    cap = te_inv
    rows, total_realloc, first_breach = [], 0.0, None
    for t in range(1, core["n"] + 1):
        alloc = allocs[t - 1]
        book_income = core["taxable"][t - 1] * alloc          # book = tax (labeled)
        cash_dist = (core["revenue"][t - 1] - core["opex"][t - 1]) * alloc
        itc_adj = 0.5 * core["gross_itc"] * alloc if (t == 1 and req.credit_mode == "itc") else 0.0
        proposed = cap + book_income - cash_dist - itc_adj
        realloc = 0.0
        if proposed < -dro_cap:
            realloc = -dro_cap - proposed                     # excess loss a §704(b) deal reallocates
            proposed = -dro_cap
            total_realloc += realloc
            if first_breach is None:
                first_breach = t
        rows.append({
            "year": t, "te_alloc_pct": round(alloc * 100.0, 1),
            "book_income_musd": round(book_income, 3),
            "cash_distributed_musd": round(cash_dist, 3),
            "itc_basis_adjustment_musd": round(-itc_adj, 3),
            "loss_reallocated_musd": round(realloc, 3),
            "capital_account_musd": round(proposed, 3),
            "dro_breach": realloc > 0,
        })
        cap = proposed
    return {
        "label": "§704(b) BOOK capital-account roll (book income = taxable income, single allocation — "
                 "documented partnership-accounting simplification). Informational: the roll and DRO "
                 "reallocation are REPORTED, not re-priced into the cash flows.",
        "te_initial_capital_musd": round(te_inv, 3),
        "dro_cap_musd": round(dro_cap, 3),
        "dro_cap_pct_of_investment": req.dro_cap_pct_of_investment,
        "rows": rows,
        "first_dro_breach_year": first_breach,
        "total_loss_reallocated_musd": round(total_realloc, 3),
        "note": ("DRO cap binds from year "
                 f"{first_breach} — a real deal would reallocate {total_realloc:.2f} $M of losses to the "
                 "sponsor (or use a larger DRO / stop-loss allocations), reducing the TE partner's tax "
                 "benefits and pushing the flip later." if first_breach else
                 "Capital account never breaches the DRO cap — loss allocations sustainable as modeled."),
    }


def _depreciation_comparison_block(req: FlipRequest, core: dict) -> dict:
    """MACRS vs bonus vs straight-line: full schedules + NPV of the
    depreciation TAX SHIELD at the subsidy discount rate. At any positive
    discount rate NPV(bonus) ≥ NPV(MACRS) ≥ NPV(straight-line): same total
    shield, strictly earlier timing."""
    basis, r = core["depreciable_basis"], req.subsidy_discount_rate_pct / 100.0
    tax_rate = core["tax_rate"]
    out = {}
    for method in ("macrs_5yr", "bonus", "straight_line"):
        sched = _depreciation_schedule(method, basis, req.placed_in_service_year,
                                       req.apply_obbba_100pct_bonus, req.straight_line_years)
        shield = [d * tax_rate for d in sched]
        npv = sum(s / (1.0 + r) ** t for t, s in enumerate(shield, start=1))
        out[method] = {
            "schedule_musd": [round(d, 3) for d in sched],
            "year1_pct_of_basis": round(sched[0] / basis * 100.0, 2) if basis > 0 else 0.0,
            "total_shield_musd": round(sum(shield), 3),
            "npv_tax_shield_musd": round(npv, 3),
        }
    bonus_rate = 100.0 if req.apply_obbba_100pct_bonus else \
        BONUS_PHASEDOWN_PCT.get(min(max(req.placed_in_service_year, 2022), 2027), 0.0)
    return {
        "label": "Full-schedule NPV of the depreciation tax shield (dep × tax rate) at the "
                 f"{req.subsidy_discount_rate_pct:.1f}% subsidy discount rate — schedules NOT truncated "
                 "to the analysis horizon (documented; the flip model itself truncates).",
        "method_in_model": req.depreciation_method,
        "bonus_rate_applied_pct": bonus_rate,
        "bonus_phasedown_pct": BONUS_PHASEDOWN_PCT,
        "obbba_note": OBBBA_NOTE,
        "obbba_applied": req.apply_obbba_100pct_bonus,
        "methods": out,
        "ordering_note": "NPV(bonus) ≥ NPV(MACRS 5-yr) ≥ NPV(straight-line) at any positive discount "
                         "rate — identical total shield, strictly accelerated timing.",
    }


def _transfer_market_block(req: FlipRequest, core: dict) -> dict:
    """§6418 depth: table price, insurance wrap, forward vs spot, hybrid."""
    total_credits = core["total_credits"]
    table = _table_transfer_price(req.credit_mode, total_credits)
    wrap = req.insurance_wrap_pct_of_credit / 100.0
    vint = TRANSFER_MARKET_TABLE["vintage_adjustment_per_dollar"]
    spot = table["price_per_dollar"]
    fwd1 = spot + vint["forward_next_year"]
    fwd2 = spot + vint["forward_2plus_years"]

    # Hybrid: carve x% of credits out of the partnership and sell under §6418.
    # The flip is RE-SOLVED end-to-end on the reduced-credit ATV; carve-out
    # proceeds (net of wrap) go to the sponsor in the year generated.
    x = req.hybrid_transfer_pct / 100.0
    hyb_price = max(spot - wrap, 0.0)
    atv_h = [core["atv"][t] - core["credits"][t] * x for t in range(core["n"])]
    te_flows_scan = [-core["te_inv"]]
    flip_h, cum = None, None
    for t in range(1, core["n"] + 1):
        te_flows_scan.append(atv_h[t - 1] * core["pre"])
        cum = _irr(te_flows_scan)
        if flip_h is None and cum is not None and cum >= core["target"]:
            flip_h = t
    te_flows_h = [-core["te_inv"]]
    sp_flows_h = [-(req.capex_musd - core["te_inv"])]
    for t in range(1, core["n"] + 1):
        alloc = core["pre"] if (flip_h is None or t <= flip_h) else core["post"]
        te_flows_h.append(atv_h[t - 1] * alloc)
        sp_flows_h.append(atv_h[t - 1] * (1.0 - alloc) + core["credits"][t - 1] * x * hyb_price)
    te_irr_h, sp_irr_h = _irr(te_flows_h), _irr(sp_flows_h)

    return {
        "table": TRANSFER_MARKET_TABLE,
        "auto_selected": table,
        "user_price_per_dollar": req.transfer_price_per_dollar,
        "insurance_wrap": {
            "cost_pct_of_credit": req.insurance_wrap_pct_of_credit,
            "cost_musd": round(total_credits * wrap, 3),
            "net_price_after_wrap": round(req.transfer_price_per_dollar - wrap, 4),
            "note": "ITC wraps cover recapture + qualification risk (buyer bears recapture under "
                    "§6418(g)(3)); PTC deals rarely need wraps — hand-authored ~1-3% cost range, labeled.",
        },
        "forward_vs_spot": {
            "spot_price": round(spot, 4),
            "forward_next_year_price": round(fwd1, 4),
            "forward_2plus_years_price": round(fwd2, 4),
            "spot_proceeds_musd": round(total_credits * spot, 3),
            "forward_next_year_proceeds_musd": round(total_credits * fwd1, 3),
            "note": "Forward commitments lock buyer tax capacity early at a ~1.5-2.5c concession "
                    "(vintage table above) — valuable for PTC strips where ten annual sales create "
                    "re-marketing risk; spot maximizes price but bears placement risk each vintage.",
        },
        "hybrid": {
            "label": f"HYBRID: partnership flip + §6418 transfer of {req.hybrid_transfer_pct:.0f}% of credits "
                     f"(sold at spot table price − wrap = {hyb_price:.4f}/$1.00). Flip re-solved end-to-end.",
            "credits_transferred_musd": round(total_credits * x, 3),
            "sponsor_proceeds_musd": round(total_credits * x * hyb_price, 3),
            "flip_year": flip_h,
            "te_irr_pct": round(te_irr_h * 100.0, 2) if te_irr_h is not None else None,
            "sponsor_irr_pct": round(sp_irr_h * 100.0, 2) if sp_irr_h is not None else None,
            "note": "Carving credits out of the partnership pushes the flip later (TE earns them back "
                    "through cash/tax items) but converts credit value to day-1-adjacent sponsor cash — "
                    "used when TE capacity is scarce or the sponsor wants smaller TE tranches.",
        },
    }


def _ptc_detail_block(req: FlipRequest, core: dict) -> Optional[dict]:
    """PTC depth: inflation mechanics, 10-yr PV, P50/P90 output sensitivity."""
    if req.credit_mode != "ptc":
        return None
    r = req.subsidy_discount_rate_pct / 100.0
    ptc_eff = core["ptc_eff"]
    p50 = req.annual_generation_mwh
    p90 = p50 * req.p90_factor

    def stream(gen):
        rows = []
        pv = 0.0
        for t in range(1, 11):
            rate_t = ptc_eff * (1.0 + req.ptc_inflation_pct / 100.0) ** (t - 1)
            cred = gen * rate_t / 1e6
            df = (1.0 + r) ** -t
            pv += cred * df
            rows.append({"year": t, "rate_usd_mwh": round(rate_t, 3), "credit_musd": round(cred, 3),
                         "pv_musd": round(cred * df, 3)})
        return rows, pv

    rows50, pv50 = stream(p50)
    rows90, pv90 = stream(p90)
    return {
        "mechanics": "IRC §45: base 0.3 ¢/kWh (1992$) ×5 with PWA = 1.5 ¢/kWh, inflation-adjusted by the "
                     "GDP price deflator and rounded — 2024 IRS-published full rate 2.75 ¢/kWh ($27.50/MWh). "
                     f"Model escalates the effective rate at the user's {req.ptc_inflation_pct:.1f}%/yr; "
                     "adders are +10% OF the credit each (multiplicative).",
        "effective_rate_usd_mwh": round(ptc_eff, 3),
        "discount_rate_pct": req.subsidy_discount_rate_pct,
        "p50_stream": rows50,
        "pv_10yr_p50_musd": round(pv50, 3),
        "pv_10yr_p90_musd": round(pv90, 3),
        "p90_factor": req.p90_factor,
        "p50_generation_mwh": p50,
        "p90_generation_mwh": round(p90, 0),
        "pv_at_risk_p50_vs_p90_musd": round(pv50 - pv90, 3),
        "model_basis": "P90" if req.use_p90_generation else "P50",
        "note": "Unlike the ITC, PTC value is OUTPUT-CONTINGENT: a P90 year cuts credit volume "
                "one-for-one with generation — the P50→P90 PV delta above is the credit-stream "
                "value at risk to resource/availability downside.",
    }


def _sustainability_block(req: FlipRequest, core: dict) -> dict:
    """Effective $/tCO2e of the federal tax subsidy (documented):
    PV(credits + depreciation tax shield, at the subsidy discount rate)
    ÷ lifetime avoided emissions (generation × grid intensity × horizon)."""
    r = req.subsidy_discount_rate_pct / 100.0
    pv_credits = sum(c / (1.0 + r) ** t for t, c in enumerate(core["credits"], start=1))
    pv_dep_shield = sum(d * core["tax_rate"] / (1.0 + r) ** t for t, d in enumerate(core["dep"], start=1))
    avoided_t = core["gen_mwh"] * req.grid_intensity_tco2_mwh * core["n"]   # tCO2e over horizon
    wrap = req.insurance_wrap_pct_of_credit / 100.0
    pv_credits_transfer = sum(c * max(req.transfer_price_per_dollar - wrap, 0.0) / (1.0 + r) ** t
                              for t, c in enumerate(core["credits"], start=1))

    def per_t(pv_musd):
        return round(pv_musd * 1e6 / avoided_t, 2) if avoided_t > 0 else None

    return {
        "label": "Effective $/tCO2e of the federal tax subsidy = PV(tax benefits at the "
                 f"{req.subsidy_discount_rate_pct:.1f}% subsidy discount rate) ÷ lifetime avoided "
                 "emissions (generation × user grid intensity × horizon) — DOCUMENTED metric; grid "
                 "intensity is a user input, not a measured baseline.",
        "grid_intensity_tco2_mwh": req.grid_intensity_tco2_mwh,
        "annual_generation_mwh_basis": round(core["gen_mwh"], 0),
        "generation_basis": "P90" if req.use_p90_generation else "P50",
        "horizon_years": core["n"],
        "lifetime_avoided_tco2e": round(avoided_t, 0),
        "pv_credits_musd": round(pv_credits, 3),
        "pv_depreciation_shield_musd": round(pv_dep_shield, 3),
        "pv_total_tax_benefits_musd": round(pv_credits + pv_dep_shield, 3),
        "subsidy_usd_per_tco2e": {
            "flip_full_monetization": per_t(pv_credits + pv_dep_shield),
            "transfer_credits_at_market": per_t(pv_credits_transfer + pv_dep_shield),
            "credits_only": per_t(pv_credits),
        },
        "adder_checklists_ref": "/api/v1/tax-equity/ref/adder-checklists",
        "adder_status": {
            "domestic_content_claimed": req.domestic_content,
            "energy_community_claimed": req.energy_community,
            "prevailing_wage_met": req.prevailing_wage_met,
        },
        "note": "Transfer leaks (1 − price + wrap) of credit face to the buyer/insurer, so its $/tCO2e "
                "delivered to the project is lower than the flip's — the DIFFERENCE is monetization "
                "friction, not a change in the federal expenditure.",
    }


# ---------------------------------------------------------------------------
# /flip — original endpoint, now delegating to _flip_core (+ depth blocks)
# ---------------------------------------------------------------------------

@router.post("/flip", response_model=FlipResponse, summary="Partnership-flip solver + §6418 transferability comparison (+ recapture/DRO/bonus-dep/transfer-market/PTC/sustainability depth)")
def solve_flip(req: FlipRequest) -> FlipResponse:
    """See module docstring: year-by-year after-tax allocation, flip year =
    first year the TE investor's cumulative after-tax IRR (bisection) meets
    the target; then allocations switch. Deterministic — no PRNG."""
    core = _flip_core(req)
    n, atv = core["n"], core["atv"]
    revenue, opex, dep = core["revenue"], core["opex"], core["dep"]
    taxable, tax, credits = core["taxable"], core["tax"], core["credits"]
    flip_year, cum_irrs = core["flip_year"], core["cum_irrs"]
    total_credits, te_inv = core["total_credits"], core["te_inv"]
    itc_rate_pct, ptc_eff = core["itc_rate_pct"], core["ptc_eff"]

    yearly: List[FlipYearRow] = []
    for t in range(1, n + 1):
        alloc = core["allocs"][t - 1]
        yearly.append(FlipYearRow(
            year=t,
            revenue_musd=round(revenue[t - 1], 3),
            opex_musd=round(opex[t - 1], 3),
            pretax_cash_musd=round(revenue[t - 1] - opex[t - 1], 3),
            depreciation_musd=round(dep[t - 1], 3),
            taxable_income_musd=round(taxable[t - 1], 3),
            tax_musd=round(tax[t - 1], 3),
            credits_musd=round(credits[t - 1], 3),
            after_tax_value_musd=round(atv[t - 1], 3),
            te_alloc_pct=round(alloc * 100.0, 1),
            te_cf_musd=round(atv[t - 1] * alloc, 3),
            sponsor_cf_musd=round(atv[t - 1] * (1.0 - alloc), 3),
            te_cumulative_irr_pct=round(cum_irrs[t - 1] * 100.0, 2) if cum_irrs[t - 1] is not None else None,
        ))

    # ── Transferability structure (§6418): sponsor keeps all, sells credits ─
    transfer_flows = [-req.capex_musd]
    transfer_proceeds = 0.0
    for t in range(1, n + 1):
        proceeds_t = credits[t - 1] * req.transfer_price_per_dollar
        transfer_proceeds += proceeds_t
        # sponsor keeps cash + tax benefits (needs own tax appetite), sells credit
        transfer_flows.append((revenue[t - 1] - opex[t - 1]) - tax[t - 1] + proceeds_t)
    sponsor_irr_transfer = _irr(transfer_flows)

    transfer_discount = total_credits * (1.0 - req.transfer_price_per_dollar)
    transferability = {
        "structure": "Direct credit sale under IRC §6418 — no tax-equity partner",
        "transfer_price_per_dollar": req.transfer_price_per_dollar,
        "price_label": "~$0.90-0.95 per $1.00 seen in market commentary — APPROXIMATE, editable",
        "gross_credits_musd": round(total_credits, 3),
        "net_transfer_proceeds_musd": round(transfer_proceeds, 3),
        "discount_cost_musd": round(transfer_discount, 3),
        "timing": ("Single payment at/around placed-in-service (year 1)" if req.credit_mode == "itc"
                   else "Ten annual credit sales as PTCs are generated (years 1-10)"),
        "sponsor_irr_pct": round(sponsor_irr_transfer * 100.0, 2) if sponsor_irr_transfer is not None else None,
        "complexity_note": (
            "Transfer: simpler docs (purchase agreement + registration), no partnership accounting, "
            "but sponsor must monetise MACRS depreciation itself (requires tax appetite) and bears "
            "recapture/indemnity via insurance. Flip: full monetisation of credits AND depreciation "
            "through the TE partner, at the cost of §704(b) partnership complexity, HLBV accounting "
            "and a negotiated buyout."
        ),
    }

    solver_notes = [
        "Flip year = first year the IRR (bisection, 200 iterations, tol 1e-7) of the TE flow vector "
        f"[-I0, f1..ft] at the {req.preflip_te_alloc_pct:.0f}% pre-flip allocation reaches the "
        f"{req.te_target_irr_pct:.2f}% target; allocations then switch to {req.postflip_te_alloc_pct:.0f}%.",
        "Single allocation percentage applied to cash and tax items — documented simplification of the "
        "§704(b) waterfall (real deals often split cash and tax allocations).",
        "Both partners assumed to have full, immediate tax appetite (losses/credits used in year generated).",
        {"macrs_5yr": "MACRS 5-year: 20/32/19.2/11.52/11.52/5.76 (IRC §168, half-year convention).",
         "bonus": f"Bonus depreciation (§168(k)): year-1 bonus at the phase-down rate for PIS "
                  f"{req.placed_in_service_year}" + (" with OBBBA 100% restoration applied (labeled toggle)"
                                                     if req.apply_obbba_100pct_bonus else "") +
                  ", remainder through the MACRS 5-yr schedule.",
         "straight_line": f"Straight-line over {req.straight_line_years} years (ADS-style, editable)."
         }[req.depreciation_method],
    ]
    if req.use_p90_generation:
        solver_notes.append(
            f"Model run at P90 generation = P50 × {req.p90_factor:.2f} — flows to revenue AND credit volume.")
    if req.credit_mode == "itc":
        solver_notes.append(
            f"ITC {itc_rate_pct:.0f}% on eligible basis {core['eligible_basis']:.1f} $M "
            f"(base {'30% with PWA' if req.prevailing_wage_met else '6% without PWA'}"
            + (", +energy community" if req.energy_community else "")
            + (", +domestic content" if req.domestic_content else "")
            + "); depreciable basis reduced by 50% of ITC (IRC §50(c)(3)).")
    else:
        solver_notes.append(
            f"PTC effective {ptc_eff:.2f} $/MWh (base {req.ptc_rate_usd_mwh:.2f} 2024 published"
            + (", +10% energy community" if req.energy_community else "")
            + (", +10% domestic content" if req.domestic_content else "")
            + f"), inflation-adjusted {req.ptc_inflation_pct:.1f}%/yr, 10 years (IRC §45).")
    if flip_year is None:
        solver_notes.append(
            "FLIP NOT ACHIEVED within the analysis horizon — TE cumulative IRR never reached the target; "
            "all years shown at the pre-flip allocation. Lower the target IRR, raise allocations, or "
            "extend the horizon.")

    return FlipResponse(
        flip_year=flip_year,
        flip_achieved=flip_year is not None,
        te_irr_at_flip_pct=round(core["te_irr_at_flip"] * 100.0, 2) if core["te_irr_at_flip"] is not None else None,
        te_full_horizon_irr_pct=round(core["te_full_irr"] * 100.0, 2) if core["te_full_irr"] is not None else None,
        sponsor_irr_flip_structure_pct=round(core["sponsor_irr_flip"] * 100.0, 2) if core["sponsor_irr_flip"] is not None else None,
        sponsor_irr_transfer_structure_pct=round(sponsor_irr_transfer * 100.0, 2) if sponsor_irr_transfer is not None else None,
        te_investment_musd=round(te_inv, 3),
        sponsor_equity_musd=round(req.capex_musd - te_inv, 3),
        gross_credit_musd=round(total_credits, 3),
        itc_rate_applied_pct=itc_rate_pct,
        ptc_effective_rate_usd_mwh=round(ptc_eff, 2) if ptc_eff is not None else None,
        depreciable_basis_musd=round(core["depreciable_basis"], 3),
        yearly=yearly,
        transferability=transferability,
        recapture=_recapture_block(req, core),
        capital_accounts=_capital_account_block(req, core),
        depreciation_comparison=_depreciation_comparison_block(req, core),
        transfer_market=_transfer_market_block(req, core),
        ptc_detail=_ptc_detail_block(req, core),
        sustainability=_sustainability_block(req, core),
        solver_notes=solver_notes,
    )


# ---------------------------------------------------------------------------
# /structures — structure menu: flip vs sale-leaseback vs inverted lease
# ---------------------------------------------------------------------------

class StructureRequest(FlipRequest):
    slb_fmv_stepup_pct: float = Field(
        15.0, ge=0, le=40, description="Sale-leaseback FMV step-up over capex (§50(d)(4) 3-month-window "
                                       "FMV sale — hand-authored ~15% typical, labeled)")
    slb_lease_term_years: Optional[int] = Field(
        None, ge=5, le=35, description="Lease-back term (defaults to the analysis horizon)")
    inverted_strip_pct: float = Field(
        5.0, ge=0, le=30, description="Inverted lease: TE-lessee ongoing pre-tax cash strip, % of "
                                      "project pretax cash during the lease term (hand-authored, labeled)")
    inverted_lease_term_years: int = Field(
        7, ge=5, le=15, description="Inverted-lease term, years")


class StructureCompareResponse(BaseModel):
    partnership_flip: dict
    sale_leaseback: dict
    inverted_lease: dict
    comparison_matrix: List[dict]
    subsidy_intensity: dict
    method_notes: List[str]


def _solve_level_payment(target_irr: float, t0_flow: float, fixed_by_year: List[float],
                         payment_multiplier_by_year: List[float]) -> float:
    """Solve the level payment X (bisection) so that IRR of
    [t0_flow, fixed_t + X·mult_t ...] equals target_irr. Deterministic."""
    def npv_at(x: float) -> float:
        flows = [t0_flow] + [f + x * m for f, m in zip(fixed_by_year, payment_multiplier_by_year)]
        return _npv(flows, target_irr)
    lo, hi = 0.0, max(abs(t0_flow) * 2.0, 1.0)
    f_lo = npv_at(lo)
    f_hi = npv_at(hi)
    tries = 0
    while f_lo * f_hi > 0 and tries < 60:
        hi *= 2.0
        f_hi = npv_at(hi)
        tries += 1
    if f_lo * f_hi > 0:
        raise HTTPException(status_code=422, detail="Level-payment solver: no root — check targets/terms")
    for _ in range(200):
        mid = (lo + hi) / 2.0
        f_mid = npv_at(mid)
        if abs(f_mid) < 1e-9:
            return mid
        if f_lo * f_mid < 0:
            hi = mid
        else:
            lo, f_lo = mid, f_mid
    return (lo + hi) / 2.0


@router.post("/structures", response_model=StructureCompareResponse, summary="Structure menu — partnership flip vs sale-leaseback vs inverted lease (documented simplified mechanics)")
def compare_structures(req: StructureRequest) -> StructureCompareResponse:
    """Three real monetization structures, simplified but documented (see
    module docstring). All solvers deterministic bisection — no PRNG."""
    if req.credit_mode != "itc":
        raise HTTPException(status_code=422, detail="Structure menu models ITC monetization structures — "
                                                    "sale-leaseback / inverted lease are §48 (ITC) plays; "
                                                    "set credit_mode='itc'.")
    core = _flip_core(req)
    n, tax_rate = core["n"], core["tax_rate"]
    r_sub = req.subsidy_discount_rate_pct / 100.0
    target = core["target"]
    lease_term = req.slb_lease_term_years or n
    lease_term = min(lease_term, n)
    pretax_cash = [core["revenue"][t] - core["opex"][t] for t in range(n)]
    avoided_t = core["gen_mwh"] * req.grid_intensity_tco2_mwh * n

    # ── 1) Partnership flip (from the shared core) ──────────────────────────
    flip = {
        "mechanics": "TE partner funds a capex share, takes 99/1-style pre-flip allocations of cash + tax "
                     "items until its target IRR, then flips to a minority share (see /flip for the full "
                     "year-by-year waterfall, recapture and capital-account depth).",
        "te_capital_musd": round(core["te_inv"], 3),
        "flip_year": core["flip_year"],
        "te_irr_pct": round(core["te_full_irr"] * 100.0, 2) if core["te_full_irr"] is not None else None,
        "sponsor_irr_pct": round(core["sponsor_irr_flip"] * 100.0, 2) if core["sponsor_irr_flip"] is not None else None,
        "sponsor_npv_musd": round(_npv(core["sponsor_flows"], r_sub), 3),
        "itc_basis_musd": round(core["eligible_basis"], 3),
        "gross_itc_musd": round(core["gross_itc"], 3),
        "recapture_exposure": "TE partner bears recapture economically; sponsor indemnities standard.",
        "complexity": "HIGH — §704(b) allocations, HLBV accounting, DRO negotiation, buyout option.",
    }
    pv_flip_subsidy = sum((core["credits"][t] + core["dep"][t] * tax_rate) / (1.0 + r_sub) ** (t + 1)
                          for t in range(n))

    # ── 2) Sale-leaseback ───────────────────────────────────────────────────
    fmv = req.capex_musd * (1.0 + req.slb_fmv_stepup_pct / 100.0)
    slb_eligible = fmv * req.itc_eligible_pct / 100.0
    itc_rate = core["itc_rate_pct"] or 0.0
    slb_itc = slb_eligible * itc_rate / 100.0
    slb_basis = fmv - 0.5 * slb_itc                       # §50(c)(3) at the lessor
    slb_dep = _depreciation_schedule(req.depreciation_method, slb_basis,
                                     req.placed_in_service_year, req.apply_obbba_100pct_bonus,
                                     req.straight_line_years)
    # Lessor: -FMV at t0; year t: rent×(1-tax) + dep_t×tax + ITC(yr1). Solve level rent.
    fixed = [(slb_dep[t] if t < len(slb_dep) else 0.0) * tax_rate + (slb_itc if t == 0 else 0.0)
             for t in range(lease_term)]
    mult = [(1.0 - tax_rate)] * lease_term
    rent = _solve_level_payment(target, -fmv, fixed, mult)
    lessor_flows = [-fmv] + [fixed[t] + rent * mult[t] for t in range(lease_term)]
    lessor_irr = _irr(lessor_flows)
    # Sponsor-lessee: t0 = FMV − capex − tax on step-up gain; then (cash − rent)(1−tax);
    # after the lease term nothing is modeled (residual/repurchase ignored — documented).
    gain_tax = max(fmv - req.capex_musd, 0.0) * tax_rate
    sp_flows_slb = [fmv - req.capex_musd - gain_tax] + \
                   [(pretax_cash[t] - rent) * (1.0 - tax_rate) for t in range(lease_term)] + \
                   [0.0] * (n - lease_term)
    sp_irr_slb = _irr(sp_flows_slb)
    sp_npv_slb = _npv(sp_flows_slb, r_sub)
    sale_leaseback = {
        "mechanics": "Sponsor sells the project at FMV (capex × "
                     f"{1.0 + req.slb_fmv_stepup_pct / 100.0:.2f} — §50(d)(4) 3-month-window step-up, "
                     "hand-authored %) to the TE lessor and leases it back at a LEVEL RENT solved so the "
                     "lessor's after-tax IRR (rent + depreciation shield + year-1 ITC on the FMV basis, "
                     "basis reduced 50% of ITC) meets its "
                     f"{req.te_target_irr_pct:.1f}% target. Step-up gain taxed at close; residual/"
                     "repurchase at term ignored — DOCUMENTED simplifications.",
        "fmv_musd": round(fmv, 3),
        "itc_basis_musd": round(slb_eligible, 3),
        "gross_itc_musd": round(slb_itc, 3),
        "itc_uplift_vs_flip_musd": round(slb_itc - core["gross_itc"], 3),
        "level_rent_musd": round(rent, 3),
        "lease_term_years": lease_term,
        "te_capital_musd": round(fmv, 3),
        "te_irr_pct": round(lessor_irr * 100.0, 2) if lessor_irr is not None else None,
        "sponsor_irr_pct": round(sp_irr_slb * 100.0, 2) if sp_irr_slb is not None else None,
        "sponsor_irr_note": "Sponsor t0 flow is POSITIVE (sale proceeds exceed capex) — IRR may be "
                            "undefined/unstable; compare on NPV.",
        "sponsor_npv_musd": round(sp_npv_slb, 3),
        "recapture_exposure": "LESSOR bears §50 recapture (owner); lessee indemnities for use-cessation.",
        "complexity": "MEDIUM — true-lease tax opinion, FMV appraisal, residual/renewal mechanics.",
    }
    pv_slb_subsidy = sum(((slb_itc if t == 0 else 0.0) +
                          (slb_dep[t] if t < len(slb_dep) else 0.0) * tax_rate) / (1.0 + r_sub) ** (t + 1)
                         for t in range(max(n, len(slb_dep))))

    # ── 3) Inverted lease (lease pass-through) ─────────────────────────────
    inv_term = min(req.inverted_lease_term_years, n)
    inv_itc = core["gross_itc"]                            # ITC on eligible basis (FMV=capex — conservative, labeled)
    inv_dep = _depreciation_schedule(req.depreciation_method, req.capex_musd,   # NO §50(c)(3) haircut
                                     req.placed_in_service_year, req.apply_obbba_100pct_bonus,
                                     req.straight_line_years)
    strip = req.inverted_strip_pct / 100.0
    incl_tax = 0.5 * inv_itc / 5.0 * tax_rate              # §50(d)(5): 50% of ITC in income over 5 yrs
    te_fixed = [(inv_itc if t == 0 else 0.0)
                - (incl_tax if t < 5 else 0.0)
                + (pretax_cash[t] * strip * (1.0 - tax_rate) if t < inv_term else 0.0)
                for t in range(n)]
    te_irr_target_flows_pv = _npv([0.0] + te_fixed, target)
    prepay = te_irr_target_flows_pv                        # PV at target = solvable prepay (t0 outflow)
    if prepay <= 0:
        raise HTTPException(status_code=422, detail="Inverted-lease solver: TE flows cannot support a "
                                                    "positive prepay at the target IRR — raise the strip "
                                                    "or lower the target.")
    te_flows_inv = [-prepay] + te_fixed
    te_irr_inv = _irr(te_flows_inv)
    sp_flows_inv = [-(req.capex_musd - prepay)]
    for t in range(n):
        share = (1.0 - strip) if t < inv_term else 1.0
        cash = pretax_cash[t] * share
        dep_t = inv_dep[t] if t < len(inv_dep) else 0.0
        sp_flows_inv.append(cash - (cash - dep_t) * tax_rate)
    sp_irr_inv = _irr(sp_flows_inv)
    inverted_lease = {
        "mechanics": "Lease pass-through: sponsor-lessor keeps ownership and FULL depreciation (no "
                     "§50(c)(3) basis haircut); the TE-lessee takes the ITC via the pass-through election, "
                     "includes 50% of the ITC in income ratably over 5 years (§50(d)(5)) and receives a "
                     f"{req.inverted_strip_pct:.0f}% pre-tax cash strip for {inv_term} years. The TE "
                     "prepaid-rent investment is the PV of its flows at the target IRR (exact by "
                     "construction). ITC basis held at capex (no step-up) — conservative, labeled.",
        "te_capital_musd": round(prepay, 3),
        "gross_itc_musd": round(inv_itc, 3),
        "itc_income_inclusion_tax_musd_per_yr": round(incl_tax, 3),
        "lease_term_years": inv_term,
        "te_irr_pct": round(te_irr_inv * 100.0, 2) if te_irr_inv is not None else None,
        "sponsor_irr_pct": round(sp_irr_inv * 100.0, 2) if sp_irr_inv is not None else None,
        "sponsor_npv_musd": round(_npv(sp_flows_inv, r_sub), 3),
        "depreciation_basis_musd": round(req.capex_musd, 3),
        "recapture_exposure": "LESSEE (TE) bears ITC recapture via the income-inclusion unwind; sponsor "
                              "keeps depreciation regardless — the mildest recapture footprint of the three.",
        "complexity": "HIGH — two-entity lease structure, pass-through election (§50(d)(5) income "
                      "inclusion), rent-setting discipline for true-lease status.",
    }
    pv_inv_subsidy = sum(((inv_itc if t == 0 else 0.0) - (incl_tax if t < 5 else 0.0) +
                          (inv_dep[t] if t < len(inv_dep) else 0.0) * tax_rate) / (1.0 + r_sub) ** (t + 1)
                         for t in range(max(n, len(inv_dep))))

    def per_t(pv):
        return round(pv * 1e6 / avoided_t, 2) if avoided_t > 0 else None

    subsidy_intensity = {
        "label": "Subsidy intensity = PV(federal tax benefits delivered by the structure, at the "
                 f"{req.subsidy_discount_rate_pct:.1f}% subsidy rate) ÷ lifetime avoided emissions "
                 f"({avoided_t:,.0f} tCO2e = generation × {req.grid_intensity_tco2_mwh} tCO2e/MWh × {n}y) "
                 "— documented, user grid intensity.",
        "usd_per_tco2e": {
            "partnership_flip": per_t(pv_flip_subsidy),
            "sale_leaseback": per_t(pv_slb_subsidy),
            "inverted_lease": per_t(pv_inv_subsidy),
        },
        "pv_tax_benefits_musd": {
            "partnership_flip": round(pv_flip_subsidy, 3),
            "sale_leaseback": round(pv_slb_subsidy, 3),
            "inverted_lease": round(pv_inv_subsidy, 3),
        },
        "note": "Sale-leaseback usually shows the highest intensity — the FMV step-up enlarges both the "
                "ITC basis and the depreciable basis; the inverted lease gives up the §50(c)(3) haircut "
                "but pays it back through the lessee income inclusion.",
    }

    comparison_matrix = [
        {"structure": "Partnership flip",
         "sponsor_irr_pct": flip["sponsor_irr_pct"], "sponsor_npv_musd": flip["sponsor_npv_musd"],
         "te_irr_pct": flip["te_irr_pct"], "te_capital_musd": flip["te_capital_musd"],
         "gross_itc_musd": flip["gross_itc_musd"],
         "complexity": "High", "recapture_exposure": "TE partner (sponsor indemnity)",
         "subsidy_usd_per_tco2e": subsidy_intensity["usd_per_tco2e"]["partnership_flip"]},
        {"structure": "Sale-leaseback",
         "sponsor_irr_pct": sale_leaseback["sponsor_irr_pct"], "sponsor_npv_musd": sale_leaseback["sponsor_npv_musd"],
         "te_irr_pct": sale_leaseback["te_irr_pct"], "te_capital_musd": sale_leaseback["te_capital_musd"],
         "gross_itc_musd": sale_leaseback["gross_itc_musd"],
         "complexity": "Medium", "recapture_exposure": "Lessor (owner)",
         "subsidy_usd_per_tco2e": subsidy_intensity["usd_per_tco2e"]["sale_leaseback"]},
        {"structure": "Inverted lease",
         "sponsor_irr_pct": inverted_lease["sponsor_irr_pct"], "sponsor_npv_musd": inverted_lease["sponsor_npv_musd"],
         "te_irr_pct": inverted_lease["te_irr_pct"], "te_capital_musd": inverted_lease["te_capital_musd"],
         "gross_itc_musd": inverted_lease["gross_itc_musd"],
         "complexity": "High", "recapture_exposure": "Lessee via §50(d)(5) inclusion unwind",
         "subsidy_usd_per_tco2e": subsidy_intensity["usd_per_tco2e"]["inverted_lease"]},
    ]

    return StructureCompareResponse(
        partnership_flip=flip,
        sale_leaseback=sale_leaseback,
        inverted_lease=inverted_lease,
        comparison_matrix=comparison_matrix,
        subsidy_intensity=subsidy_intensity,
        method_notes=[
            "All three are REAL structures modeled with DOCUMENTED simplifications: level-rent and "
            "prepaid-rent solvers by deterministic bisection/PV; residuals, buyouts and book/tax "
            "disparities not modeled.",
            "Sale-leaseback: ITC + depreciation on the FMV step-up basis (§50(d)(4) window); step-up "
            "gain taxed at close; lessor basis reduced by 50% of ITC (§50(c)(3)).",
            "Inverted lease: NO basis reduction — lessee includes 50% of ITC in income over 5 years "
            "(§50(d)(5)); sponsor keeps full-basis depreciation.",
            "TE IRRs are solved TO the target by construction (rent/prepay solvers) — shown to confirm.",
            "Subsidy intensity uses the same $/tCO2e definition as /flip (user grid intensity, labeled).",
        ],
    )


# ---------------------------------------------------------------------------
# Reference endpoints (transparent, hand-authored)
# ---------------------------------------------------------------------------

@router.get("/ref/ira-parameters", summary="Real IRA statutory constants used by the flip solver (transparent)")
def ref_ira_parameters():
    return IRA_PARAMETERS


@router.get("/ref/transfer-market", summary="Hand-authored §6418 transfer-pricing table (market-observation basis, approximate)")
def ref_transfer_market():
    return TRANSFER_MARKET_TABLE


@router.get("/ref/adder-checklists", summary="Domestic-content & energy-community adder qualification checklists (real IRA criteria, summarized)")
def ref_adder_checklists():
    return ADDER_CHECKLISTS
