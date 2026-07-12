"""
SLB Structurer — Sustainability-Linked Bond calibration & step-up valuation (NX2-05)
====================================================================================
Prefix: /api/v1/slb-structuring
Tags:   SLB Structuring

POST /calibrate          — SPT ambition assessment vs sector decarbonization pathway
                           + coupon step-up valuation (prob-weighted digital annuity)
GET  /ref/pathways       — hand-authored sector decarbonization-pathway slope table
                           (cited basis per row; approximate — refresh for production)
GET  /ref/spo-checklist  — ICMA Sustainability-Linked Bond Principles (June 2023,
                           with June 2024 updates) five core components, real structure

Methodology (all documented, all parameters exposed in the request/response):

1. SPT implied annual reduction (geometric / CAGR convention):
       r_spt = 1 - (SPT_value / baseline_value) ^ (1 / (target_year - baseline_year))
   expressed in %/yr. Compared against the sector pathway slope s (%/yr).

2. Ambition gap (percentage points per year):
       gap = r_spt - s
   Verdict thresholds (stated convention, editable):
       gap >= +0.50 pp/yr  -> "ahead of pathway"
       |gap| < 0.50 pp/yr  -> "aligned with pathway"
       gap <= -0.50 pp/yr  -> "behind pathway"

3. Probability of missing the SPT — LABELED MODEL ASSUMPTION, not market data.
   Logistic mapping of the ambition gap (harder target => higher miss probability):
       p_miss = p_floor + (p_cap - p_floor) / (1 + exp(-(gap - midpoint_pp) / slope_pp))
   Defaults: p_floor=0.05, p_cap=0.95, midpoint_pp=1.0, slope_pp=0.75.
   Rationale: an SPT aligned with the sector pathway (gap=0) maps to ~0.24 miss
   probability (consistent with published SLB step-up trigger studies showing a
   minority-but-material share of targets missed); an SPT 2pp/yr more aggressive
   than the pathway maps to ~0.76. Monotonically INCREASING in ambition: a more
   demanding target is more likely to be missed, so the step-up option is worth
   more. All four parameters are request-overridable.

4. Step-up valuation (digital-option annuity, annual coupons, flat discounting):
       PV(step-up per 100 face) = p_miss * (step_up_bp / 100) * A_stepped
       A_stepped = sum of DF(t_i) over coupon dates t_i whose payment calendar
                   year falls strictly AFTER the SPT target observation year
       DF(t) = (1 + discount_rate) ^ -t
   Basis-point value of the SLB feature (running-spread equivalent over the
   full remaining life): bp_equiv = PV_per_100 / (0.01 * A_full).

Every number in the response traces to an input, this documented math, or the
labeled reference table below. No PRNG anywhere.
"""
from __future__ import annotations

import math
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/slb-structuring", tags=["SLB Structuring"])

# ---------------------------------------------------------------------------
# Hand-authored sector decarbonization-pathway slope table.
# LABELED REFERENCE: approximate annual emissions-intensity reduction slopes
# distilled from published pathway sources (basis cited per row). These are
# hand-authored planning values, NOT a live pathway feed — refresh for
# production against the primary sources cited.
# ---------------------------------------------------------------------------
SECTOR_PATHWAYS: List[Dict[str, Any]] = [
    {"sector": "power_generation", "label": "Power generation",
     "slope_pct_per_yr": 7.0, "metric": "tCO2e/MWh (scope 1)",
     "basis": "IEA NZE 2023 power-sector CO2 intensity decline to 2030 (~-7%/yr); SBTi power SDA 1.5C"},
    {"sector": "steel", "label": "Iron & steel",
     "slope_pct_per_yr": 3.0, "metric": "tCO2e/t crude steel (scope 1+2)",
     "basis": "IEA NZE 2023 steel intensity trajectory (~-2.5 to -3%/yr); TPI below-2C benchmark"},
    {"sector": "cement", "label": "Cement",
     "slope_pct_per_yr": 2.5, "metric": "tCO2e/t cementitious (scope 1+2)",
     "basis": "IEA NZE / GCCA 2050 roadmap (~-2 to -3%/yr to 2030); SBTi cement guidance"},
    {"sector": "aluminium", "label": "Aluminium",
     "slope_pct_per_yr": 3.5, "metric": "tCO2e/t aluminium (scope 1+2)",
     "basis": "IAI 1.5C scenario / Mission Possible Partnership (~-3 to -4%/yr)"},
    {"sector": "aviation", "label": "Aviation",
     "slope_pct_per_yr": 3.0, "metric": "gCO2e/RTK (scope 1)",
     "basis": "SBTi aviation guidance (1.5C intensity ~-3%/yr to 2035); ICAO LTAG mid case"},
    {"sector": "shipping", "label": "Shipping",
     "slope_pct_per_yr": 3.5, "metric": "gCO2e/dwt-nm (AER, scope 1)",
     "basis": "IMO 2023 GHG Strategy indicative checkpoints (-20-30% by 2030 vs 2008); Poseidon Principles"},
    {"sector": "oil_gas", "label": "Oil & gas",
     "slope_pct_per_yr": 2.0, "metric": "tCO2e/boe (scope 1+2, operated)",
     "basis": "IEA NZE upstream scope 1+2 intensity (~-2%/yr ex-methane step-change); OGCI ambition"},
    {"sector": "chemicals", "label": "Chemicals",
     "slope_pct_per_yr": 2.5, "metric": "tCO2e/t product (scope 1+2)",
     "basis": "IEA NZE chemicals trajectory (~-2 to -3%/yr to 2030)"},
    {"sector": "real_estate", "label": "Real estate",
     "slope_pct_per_yr": 5.5, "metric": "kgCO2e/m2/yr (scope 1+2, whole building)",
     "basis": "CRREM v2 1.5C pathways (commercial, global avg ~-5 to -7%/yr)"},
    {"sector": "autos", "label": "Automotive (fleet)",
     "slope_pct_per_yr": 6.0, "metric": "gCO2/km new-fleet WLTP (use-phase)",
     "basis": "EU fleet CO2 standards 2025/2030 steps (~-6%/yr implied); SBTi transport SDA"},
    {"sector": "food_agri", "label": "Food & agriculture (FLAG)",
     "slope_pct_per_yr": 2.5, "metric": "tCO2e/t product (FLAG scope 1+2+land)",
     "basis": "SBTi FLAG guidance (~-2.5 to -3%/yr intensity to 2030)"},
    {"sector": "general_corporate", "label": "General corporate (cross-sector)",
     "slope_pct_per_yr": 4.2, "metric": "tCO2e absolute or economic intensity (scope 1+2)",
     "basis": "SBTi Corporate Net-Zero Standard cross-sector absolute contraction (-4.2%/yr linear, 1.5C)"},
]
_PATHWAY_BY_SECTOR = {p["sector"]: p for p in SECTOR_PATHWAYS}

PATHWAY_TABLE_LABEL = (
    "Hand-authored sector decarbonization-pathway slopes — approximate annual "
    "intensity-reduction rates distilled from the cited published sources "
    "(IEA NZE 2023, SBTi SDA/CSA/FLAG, CRREM v2, IMO 2023 GHG Strategy, TPI, "
    "EU fleet standards). Editable planning reference, NOT a live pathway feed — "
    "refresh against primary sources for production use."
)

# ---------------------------------------------------------------------------
# ICMA SLB Principles — five core components (real structure, June 2023 SLBP
# with June 2024 updates). Checklist items paraphrase the published principles.
# ---------------------------------------------------------------------------
SPO_CHECKLIST: List[Dict[str, Any]] = [
    {
        "component": 1,
        "name": "Selection of Key Performance Indicators (KPIs)",
        "items": [
            "KPI is relevant, core and material to the issuer's overall business",
            "KPI is of high strategic significance to current and/or future operations",
            "KPI is measurable / quantifiable on a consistent methodological basis",
            "KPI is externally verifiable",
            "KPI can be benchmarked (external references / definitions used where possible)",
            "Clear definition disclosed: scope, perimeter, calculation methodology, baseline",
        ],
    },
    {
        "component": 2,
        "name": "Calibration of Sustainability Performance Targets (SPTs)",
        "items": [
            "SPT represents a material improvement beyond business-as-usual trajectory",
            "SPT is compared to a benchmark: issuer's own past performance (>=3yr track record recommended)",
            "SPT is compared to peers / sector average where available",
            "SPT is referenced to science / official pathways (e.g. sectoral decarbonization pathways, Paris alignment)",
            "Target observation date(s), trigger event(s) and timelines are clearly defined",
            "Disclosure of strategy, key levers and expected contribution of each lever to achieve the SPT",
        ],
    },
    {
        "component": 3,
        "name": "Bond Characteristics",
        "items": [
            "Financial/structural impact of trigger clearly described (coupon step-up, redemption premium, etc.)",
            "Variation is commensurate and meaningful relative to the issuer's original bond financial characteristics",
            "Fallback mechanisms defined if SPT cannot be calculated/observed (e.g. methodology change, M&A)",
            "Language addressing recalculation of baseline in exceptional events",
        ],
    },
    {
        "component": 4,
        "name": "Reporting",
        "items": [
            "Up-to-date information on KPI performance published at least annually",
            "Verification assurance report relative to the SPT published at least annually and for trigger-relevant dates",
            "Information enabling investors to monitor SPT ambition (e.g. updated benchmarks, restatements)",
        ],
    },
    {
        "component": 5,
        "name": "Verification",
        "items": [
            "Independent external verification of KPI performance vs each SPT, at least annually",
            "Verification by qualified external reviewer (auditor / environmental consultant)",
            "Verification made publicly available",
            "(Recommended) Pre-issuance second-party opinion on framework alignment with the SLBP",
        ],
    },
]

# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class LogisticParams(BaseModel):
    """Parameters of the documented logistic p(miss) mapping — MODEL ASSUMPTION."""
    p_floor: float = Field(0.05, ge=0.0, le=1.0, description="Lower asymptote of p(miss)")
    p_cap: float = Field(0.95, ge=0.0, le=1.0, description="Upper asymptote of p(miss)")
    midpoint_pp: float = Field(1.0, description="Ambition gap (pp/yr) at which p(miss) is halfway between floor and cap")
    slope_pp: float = Field(0.75, gt=0.0, description="Logistic scale (pp/yr); smaller = steeper")


class CalibrateRequest(BaseModel):
    kpi_name: str = Field("Scope 1+2 GHG intensity", description="KPI description")
    kpi_unit: str = Field("tCO2e/$M revenue", description="KPI unit")
    baseline_year: int = Field(..., ge=1990, le=2100)
    baseline_value: float = Field(..., gt=0, description="KPI value in the baseline year")
    spt_target_year: int = Field(..., ge=1990, le=2100)
    spt_target_value: float = Field(..., gt=0, description="KPI value committed at the SPT observation year (must be < baseline for a reduction KPI)")
    sector: Optional[str] = Field(None, description="Sector key from GET /ref/pathways (sets pathway slope)")
    pathway_slope_pct_per_yr: Optional[float] = Field(
        None, gt=0,
        description="Override sector pathway slope (%/yr reduction). Required if sector omitted/unknown.")
    coupon_step_up_bp: float = Field(25.0, ge=0, description="Coupon step-up if SPT missed (bp per annum)")
    observation_date: date = Field(..., description="Valuation date (t=0 for discounting)")
    bond_tenor_years: int = Field(..., ge=1, le=50, description="Remaining bond tenor from observation date (annual coupons assumed)")
    coupon_pct: float = Field(..., ge=0, description="Bond coupon (% p.a., pre step-up) — echoed for context")
    issue_size_mn: float = Field(..., gt=0, description="Bond size (millions)")
    discount_rate_pct: float = Field(4.0, ge=0, description="Flat annual discount rate for the annuity (% p.a.)")
    ambition_band_pp: float = Field(0.5, gt=0, description="Verdict band: |gap| < band => 'aligned' (pp/yr, stated convention)")
    logistic: LogisticParams = Field(default_factory=LogisticParams)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/ref/pathways")
def ref_pathways() -> Dict[str, Any]:
    """Sector decarbonization-pathway slope table (hand-authored, cited basis per row)."""
    return {
        "label": PATHWAY_TABLE_LABEL,
        "count": len(SECTOR_PATHWAYS),
        "pathways": SECTOR_PATHWAYS,
        "units": "slope_pct_per_yr = annual reduction rate of the sector benchmark intensity metric (%/yr)",
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/ref/spo-checklist")
def ref_spo_checklist() -> Dict[str, Any]:
    """ICMA Sustainability-Linked Bond Principles — five core components checklist."""
    return {
        "standard": "ICMA Sustainability-Linked Bond Principles (June 2023, incl. June 2024 updates)",
        "note": "Item wording paraphrases the published principles for checklist use; consult the ICMA text for legal drafting.",
        "components": SPO_CHECKLIST,
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/calibrate")
def calibrate(req: CalibrateRequest) -> Dict[str, Any]:
    """SPT ambition assessment vs sector pathway + coupon step-up valuation."""
    # ── Input validation beyond Pydantic ────────────────────────────────────
    n_years = req.spt_target_year - req.baseline_year
    if n_years <= 0:
        raise HTTPException(422, "spt_target_year must be after baseline_year")
    if req.spt_target_value >= req.baseline_value:
        raise HTTPException(
            422,
            "spt_target_value must be below baseline_value (this endpoint models "
            "reduction KPIs; an increasing KPI is not an emissions-reduction SPT).")
    if req.logistic.p_cap <= req.logistic.p_floor:
        raise HTTPException(422, "logistic.p_cap must exceed logistic.p_floor")

    # ── Pathway slope resolution ────────────────────────────────────────────
    pathway_row = _PATHWAY_BY_SECTOR.get(req.sector) if req.sector else None
    if req.pathway_slope_pct_per_yr is not None:
        slope = float(req.pathway_slope_pct_per_yr)
        slope_source = "user override"
    elif pathway_row:
        slope = float(pathway_row["slope_pct_per_yr"])
        slope_source = f"ref/pathways[{req.sector}] — {pathway_row['basis']}"
    else:
        raise HTTPException(
            422,
            f"Unknown sector '{req.sector}' and no pathway_slope_pct_per_yr override. "
            f"See GET /ref/pathways for valid sector keys.")

    # ── 1) SPT implied annual reduction (geometric / CAGR) ─────────────────
    ratio = req.spt_target_value / req.baseline_value
    r_spt = (1.0 - ratio ** (1.0 / n_years)) * 100.0  # %/yr

    # ── 2) Ambition gap + verdict ───────────────────────────────────────────
    gap = r_spt - slope  # pp/yr; positive = more ambitious than pathway
    band = req.ambition_band_pp
    if gap >= band:
        verdict = "ahead"
    elif gap <= -band:
        verdict = "behind"
    else:
        verdict = "aligned"

    # ── 3) p(miss) — documented logistic MODEL ASSUMPTION ──────────────────
    lg = req.logistic
    z = (gap - lg.midpoint_pp) / lg.slope_pp
    p_miss = lg.p_floor + (lg.p_cap - lg.p_floor) / (1.0 + math.exp(-z))

    # ── 4) Step-up valuation ────────────────────────────────────────────────
    y = req.discount_rate_pct / 100.0
    obs_year_frac = req.observation_date.year + (req.observation_date.timetuple().tm_yday - 1) / 365.25
    T = int(req.bond_tenor_years)
    schedule: List[Dict[str, Any]] = []
    a_full = 0.0
    a_stepped = 0.0
    step_cash_per_100 = req.coupon_step_up_bp / 100.0  # bp on 100 face, per annum
    for i in range(1, T + 1):
        t = float(i)                       # years from observation date (annual coupons)
        pay_year = obs_year_frac + t       # calendar year of payment
        df = (1.0 + y) ** (-t)
        stepped = pay_year > (req.spt_target_year + 1.0)  # paid after the target-year observation is verifiable
        a_full += df
        if stepped:
            a_stepped += df
        schedule.append({
            "period": i,
            "t_years": t,
            "payment_calendar_year": round(pay_year, 2),
            "discount_factor": round(df, 6),
            "in_step_up_window": stepped,
            "expected_step_up_cash_per_100": round(p_miss * step_cash_per_100 if stepped else 0.0, 6),
            "pv_expected_step_up_per_100": round((p_miss * step_cash_per_100 * df) if stepped else 0.0, 6),
        })

    pv_per_100 = p_miss * step_cash_per_100 * a_stepped
    value_mn = pv_per_100 / 100.0 * req.issue_size_mn
    bp_equiv = (pv_per_100 / (0.01 * a_full)) if a_full > 0 else 0.0

    # ── Trajectory arrays (period-by-period, for the UI chart) ──────────────
    trajectory = []
    for yr in range(req.baseline_year, req.spt_target_year + 1):
        k = yr - req.baseline_year
        issuer_path = req.baseline_value * (ratio ** (k / n_years))          # geometric baseline→SPT
        sector_path = req.baseline_value * ((1.0 - slope / 100.0) ** k)      # sector slope applied to same baseline
        trajectory.append({
            "year": yr,
            "issuer_target_path": round(issuer_path, 4),
            "sector_pathway_path": round(sector_path, 4),
        })
    on_track_value = None
    if req.baseline_year <= obs_year_frac <= req.spt_target_year:
        k = obs_year_frac - req.baseline_year
        on_track_value = round(req.baseline_value * (ratio ** (k / n_years)), 4)

    return {
        "inputs": req.model_dump(mode="json"),
        "ambition": {
            "spt_implied_annual_reduction_pct": round(r_spt, 3),
            "sector_pathway_slope_pct": round(slope, 3),
            "pathway_slope_source": slope_source,
            "ambition_gap_pp_per_yr": round(gap, 3),
            "verdict": verdict,
            "verdict_bands": {
                "ahead": f"gap >= +{band} pp/yr",
                "aligned": f"|gap| < {band} pp/yr",
                "behind": f"gap <= -{band} pp/yr",
            },
            "math": (
                f"r_spt = 1 - ({req.spt_target_value}/{req.baseline_value})^(1/{n_years}) "
                f"= {r_spt:.3f}%/yr; gap = {r_spt:.3f} - {slope:.3f} = {gap:.3f} pp/yr"
            ),
        },
        "probability_of_miss": {
            "p_miss": round(p_miss, 4),
            "model": "logistic (MODEL ASSUMPTION, not market data)",
            "formula": "p_miss = p_floor + (p_cap - p_floor) / (1 + exp(-(gap - midpoint_pp)/slope_pp))",
            "parameters": lg.model_dump(),
            "monotonicity": (
                "p_miss is INCREASING in the ambition gap: a more ambitious SPT "
                "(faster required reduction than the sector pathway) is harder to "
                "achieve, so the miss probability — and hence the step-up option "
                "value — is higher."
            ),
        },
        "step_up_valuation": {
            "formula": "PV_per_100 = p_miss × (step_up_bp/100) × A_stepped;  DF(t)=(1+y)^-t, annual coupons",
            "p_miss": round(p_miss, 4),
            "step_up_bp": req.coupon_step_up_bp,
            "discount_rate_pct": req.discount_rate_pct,
            "annuity_factor_full_life": round(a_full, 4),
            "annuity_factor_step_up_window": round(a_stepped, 4),
            "step_up_window_rule": (
                "step-up applies to coupons whose payment calendar year falls after "
                "spt_target_year + 1 (target observed at target-year end, verified, "
                "then applied to subsequent coupons) — stated convention"
            ),
            "pv_per_100_face": round(pv_per_100, 4),
            "value_mn": round(value_mn, 4),
            "bp_running_equivalent": round(bp_equiv, 3),
            "bp_running_equivalent_note": (
                "PV_per_100 / (0.01 × A_full): the flat running spread over the full "
                "remaining life with the same PV as the contingent step-up"
            ),
            "schedule": schedule,
        },
        "trajectory": trajectory,
        "on_track_check": {
            "observation_date": req.observation_date.isoformat(),
            "on_track_kpi_value": on_track_value,
            "note": ("geometric interpolation of the issuer baseline→SPT path at the "
                     "observation date; None if observation date outside baseline→target window"),
        },
        "engine": "slb_structuring (documented closed-form; no simulation, no PRNG)",
        "computed_at": datetime.now(timezone.utc).isoformat(),
    }


# ===========================================================================
# EXTENDED STRUCTURING SUITE (multi-KPI, step-down/call, history calibration,
# ambition analytics / MACC, SPO pre-assessment).
# All additions follow the same doctrine as /calibrate: documented closed-form
# math, every parameter user-overridable, hand-authored reference data labeled
# as such, and NO PRNG anywhere.
# ===========================================================================

# ---------------------------------------------------------------------------
# Hand-authored benchmark table of published SLB step-up structures.
# LABELED REFERENCE: summarized from public issuer disclosures / prospectus
# coverage of widely reported SLB issues. Approximate — verify against the
# original prospectus before external use.
# ---------------------------------------------------------------------------
SLB_STEP_UP_BENCHMARKS: List[Dict[str, Any]] = [
    {"issuer": "Enel", "year": 2019, "structure": "coupon step-up", "step_bp": 25,
     "kpi": "Renewable installed capacity share (>=55% by 2021)",
     "note": "First-ever SLB (USD 1.5bn); set the 25bp single-step market convention"},
    {"issuer": "Enel", "year": 2020, "structure": "coupon step-up", "step_bp": 25,
     "kpi": "Scope 1 GHG intensity (g CO2/kWh) vs SBTi-certified target",
     "note": "General-purpose SDG-linked framework rolled across the curve at 25bp"},
    {"issuer": "Novartis", "year": 2020, "structure": "coupon step-up", "step_bp": 25,
     "kpi": "Patient access targets (innovative & flagship programs)",
     "note": "First healthcare SLB (EUR 1.85bn); social KPI, 25bp step"},
    {"issuer": "Chanel", "year": 2020, "structure": "redemption premium", "step_bp": 50,
     "kpi": "Scope 1+2 absolute reduction; renewable electricity share",
     "note": "Premium paid at maturity instead of coupon step (50-75bp by tranche)"},
    {"issuer": "Tesco", "year": 2021, "structure": "coupon step-up", "step_bp": 25,
     "kpi": "Scope 1+2 absolute GHG reduction vs 2015 baseline",
     "note": "EUR 750m; single observation, 25bp"},
    {"issuer": "Public Power Corp (PPC)", "year": 2021, "structure": "coupon step-up", "step_bp": 50,
     "kpi": "Scope 1 absolute CO2 reduction (lignite phase-down)",
     "note": "50bp step — above-convention step for a high-carbon transition issuer"},
    {"issuer": "H&M", "year": 2021, "structure": "coupon step-up (multi-KPI)", "step_bp": 25,
     "kpi": "Scope 1+2 + scope 3 intensity + recycled materials share",
     "note": "Multi-KPI structure with the aggregate step allocated across KPIs"},
]
SLB_BENCHMARK_LABEL = (
    "Hand-authored extract of widely reported SLB step-up structures, summarized "
    "from public issuer disclosures. Market convention: a single 25bp coupon "
    "step-up applying from the observation date to maturity dominates issuance; "
    "50bp+ appears for high-carbon transition issuers; redemption-premium "
    "variants exist (e.g. Chanel). Approximate — verify against the original "
    "prospectus before external use."
)


@router.get("/ref/step-up-benchmarks")
def ref_step_up_benchmarks() -> Dict[str, Any]:
    """Published SLB step-up structures (hand-authored, labeled)."""
    return {
        "label": SLB_BENCHMARK_LABEL,
        "count": len(SLB_STEP_UP_BENCHMARKS),
        "benchmarks": SLB_STEP_UP_BENCHMARKS,
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
    }


# ---------------------------------------------------------------------------
# Shared helpers for the extended endpoints (same math as /calibrate)
# ---------------------------------------------------------------------------


def _logistic_p_miss(gap_pp: float, lg: LogisticParams) -> float:
    """Documented logistic p(miss) mapping (identical form to /calibrate)."""
    z = (gap_pp - lg.midpoint_pp) / lg.slope_pp
    return lg.p_floor + (lg.p_cap - lg.p_floor) / (1.0 + math.exp(-z))


def _resolve_slope(sector: Optional[str], override: Optional[float]) -> tuple:
    row = _PATHWAY_BY_SECTOR.get(sector) if sector else None
    if override is not None:
        return float(override), "user override"
    if row:
        return float(row["slope_pct_per_yr"]), f"ref/pathways[{sector}] — {row['basis']}"
    raise HTTPException(
        422, f"Unknown sector '{sector}' and no pathway_slope_pct_per_yr override. "
             f"See GET /ref/pathways for valid sector keys.")


def _spt_gap(baseline_year: int, baseline_value: float, target_year: int,
             target_value: float, slope: float) -> Dict[str, float]:
    n = target_year - baseline_year
    if n <= 0:
        raise HTTPException(422, "spt_target_year must be after baseline_year")
    if target_value >= baseline_value:
        raise HTTPException(422, "spt_target_value must be below baseline_value (reduction KPI)")
    r_spt = (1.0 - (target_value / baseline_value) ** (1.0 / n)) * 100.0
    return {"n_years": n, "r_spt": r_spt, "gap": r_spt - slope}


def _annuities(observation_date: date, tenor_years: int, discount_rate_pct: float,
               spt_target_year: int) -> Dict[str, float]:
    """A_full and A_stepped under the /calibrate window rule
    (step-up applies to coupons paid in calendar years > target_year + 1)."""
    y = discount_rate_pct / 100.0
    obs = observation_date.year + (observation_date.timetuple().tm_yday - 1) / 365.25
    a_full = a_stepped = 0.0
    for i in range(1, int(tenor_years) + 1):
        df = (1.0 + y) ** (-float(i))
        a_full += df
        if obs + i > (spt_target_year + 1.0):
            a_stepped += df
    return {"a_full": a_full, "a_stepped": a_stepped, "obs_year_frac": obs}


def _norm_cdf(x: float) -> float:
    """Standard normal CDF via math.erf (closed-form, no PRNG)."""
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))


# ---------------------------------------------------------------------------
# 1) Multi-KPI structuring — POST /structure-multi
# ---------------------------------------------------------------------------

class MultiKpi(BaseModel):
    kpi_name: str = Field("Scope 1+2 GHG intensity")
    kpi_unit: str = Field("tCO2e/$M revenue")
    baseline_year: int = Field(..., ge=1990, le=2100)
    baseline_value: float = Field(..., gt=0)
    spt_target_year: int = Field(..., ge=1990, le=2100)
    spt_target_value: float = Field(..., gt=0)
    sector: Optional[str] = None
    pathway_slope_pct_per_yr: Optional[float] = Field(None, gt=0)
    coupon_step_up_bp: float = Field(25.0, ge=0, description="Step-up attached to THIS KPI (bp p.a.)")
    logistic: Optional[LogisticParams] = Field(None, description="Per-KPI override; defaults to request-level logistic")


class StructureMultiRequest(BaseModel):
    kpis: List[MultiKpi] = Field(..., min_length=1, max_length=3)
    observation_date: date
    bond_tenor_years: int = Field(..., ge=1, le=50)
    issue_size_mn: float = Field(..., gt=0)
    discount_rate_pct: float = Field(4.0, ge=0)
    ambition_band_pp: float = Field(0.5, gt=0)
    logistic: LogisticParams = Field(default_factory=LogisticParams)
    joint_trigger: bool = Field(
        False,
        description="False: each KPI's step-up triggers independently (expected "
                    "cost = sum of per-KPI values). True: the FULL combined "
                    "step-up applies only if ALL KPIs are missed; "
                    "p_joint = product of per-KPI p(miss) under a DOCUMENTED "
                    "INDEPENDENCE ASSUMPTION between KPI outcomes.")


@router.post("/structure-multi")
def structure_multi(req: StructureMultiRequest) -> Dict[str, Any]:
    """Up to 3 KPIs, each with its own SPT / step-up / pathway; combined
    valuation under independent triggers and (optionally) a joint trigger."""
    per_kpi: List[Dict[str, Any]] = []
    a_full_ref = None
    for k in req.kpis:
        slope, slope_src = _resolve_slope(k.sector, k.pathway_slope_pct_per_yr)
        g = _spt_gap(k.baseline_year, k.baseline_value, k.spt_target_year, k.spt_target_value, slope)
        lg = k.logistic or req.logistic
        if lg.p_cap <= lg.p_floor:
            raise HTTPException(422, "logistic.p_cap must exceed logistic.p_floor")
        p = _logistic_p_miss(g["gap"], lg)
        ann = _annuities(req.observation_date, req.bond_tenor_years, req.discount_rate_pct, k.spt_target_year)
        a_full_ref = ann["a_full"]
        pv = p * (k.coupon_step_up_bp / 100.0) * ann["a_stepped"]
        band = req.ambition_band_pp
        verdict = "ahead" if g["gap"] >= band else ("behind" if g["gap"] <= -band else "aligned")
        per_kpi.append({
            "kpi_name": k.kpi_name, "kpi_unit": k.kpi_unit,
            "spt_implied_annual_reduction_pct": round(g["r_spt"], 3),
            "pathway_slope_pct": round(slope, 3), "pathway_slope_source": slope_src,
            "ambition_gap_pp_per_yr": round(g["gap"], 3), "verdict": verdict,
            "p_miss": round(p, 4), "step_up_bp": k.coupon_step_up_bp,
            "annuity_step_up_window": round(ann["a_stepped"], 4),
            "pv_per_100_face": round(pv, 4),
            "bp_running_equivalent": round(pv / (0.01 * ann["a_full"]) if ann["a_full"] > 0 else 0.0, 3),
            "_p_raw": p, "_a_stepped": ann["a_stepped"], "_step_bp": k.coupon_step_up_bp,
        })

    pv_indep = sum(k["_p_raw"] * (k["_step_bp"] / 100.0) * k["_a_stepped"] for k in per_kpi)
    p_joint = 1.0
    for k in per_kpi:
        p_joint *= k["_p_raw"]
    pv_joint = sum(p_joint * (k["_step_bp"] / 100.0) * k["_a_stepped"] for k in per_kpi)
    for k in per_kpi:  # strip internals
        k.pop("_p_raw"), k.pop("_a_stepped"), k.pop("_step_bp")

    a_full = a_full_ref or 1.0
    out: Dict[str, Any] = {
        "inputs": req.model_dump(mode="json"),
        "per_kpi": per_kpi,
        "combined_independent": {
            "assumption": "each KPI triggers its own step-up independently; expected cost is the SUM of per-KPI probability-weighted values",
            "pv_per_100_face": round(pv_indep, 4),
            "value_mn": round(pv_indep / 100.0 * req.issue_size_mn, 4),
            "bp_running_equivalent": round(pv_indep / (0.01 * a_full), 3),
        },
        "combined_joint": {
            "enabled": req.joint_trigger,
            "assumption": ("joint trigger: the full combined step-up applies only if ALL "
                           "KPIs are missed; p_joint = PRODUCT of per-KPI p(miss) — an "
                           "explicit INDEPENDENCE ASSUMPTION between KPI outcomes (real-world "
                           "decarbonization KPIs are typically positively correlated, which "
                           "would RAISE p_joint toward min(p_i); the independent product is "
                           "therefore a documented lower bound under this model)"),
            "p_joint": round(p_joint, 6),
            "pv_per_100_face": round(pv_joint, 4),
            "value_mn": round(pv_joint / 100.0 * req.issue_size_mn, 4),
            "bp_running_equivalent": round(pv_joint / (0.01 * a_full), 3),
        },
        "structural_check": {
            "joint_leq_sum_of_independent": pv_joint <= pv_indep + 1e-12,
            "why": "p_joint = prod(p_i) <= p_i for every i, so each joint term is <= its independent counterpart",
        },
        "engine": "slb_structuring /structure-multi (closed-form; no PRNG)",
        "computed_at": datetime.now(timezone.utc).isoformat(),
    }
    return out


# ---------------------------------------------------------------------------
# 2) Step-down + issuer-call interaction — POST /step-down-call
# ---------------------------------------------------------------------------

class CallDate(BaseModel):
    years_from_observation: int = Field(..., ge=1, le=50, description="Call date as whole years from the observation/valuation date (coupon dates)")
    call_price: float = Field(100.0, ge=90, le=130, description="Call price per 100 face")


class StepDownCallRequest(BaseModel):
    p_miss: float = Field(..., ge=0, le=1, description="Miss probability (from /calibrate, /calibrate-history or user)")
    coupon_pct: float = Field(..., ge=0, description="Base coupon (% p.a.)")
    step_up_bp: float = Field(25.0, ge=0, description="Coupon step-up if SPT missed (bp)")
    step_down_bp: float = Field(0.0, ge=0, description="Coupon step-DOWN if SPT met (bp); 0 = step-up-only")
    spt_target_year: int = Field(..., ge=1990, le=2100)
    observation_date: date
    bond_tenor_years: int = Field(..., ge=1, le=50)
    discount_rate_pct: float = Field(4.0, ge=0)
    issue_size_mn: float = Field(..., gt=0)
    market_price_per_100: float = Field(100.0, gt=1, le=400)
    call_schedule: List[CallDate] = Field(default_factory=list, max_length=10)


@router.post("/step-down-call")
def step_down_call(req: StepDownCallRequest) -> Dict[str, Any]:
    """Two-way (step-up/step-down) coupon structures plus the issuer's
    call-to-avoid-step-up incentive.

    Documented conventions:
    - Expected issuer cost of the ESG feature per 100 face:
          E[cost] = p_miss*(up_bp/100)*A_w  -  (1-p_miss)*(down_bp/100)*A_w
      (A_w = stepped-window annuity under the /calibrate window rule). A
      step-down strictly reduces expected cost vs the step-up-only structure.
    - Yield-to-call at call date k (stepped path, i.e. conditional on a miss):
      bisection solve of  price = sum_{t<=k} c_up*DF_y(t) + call_price*DF_y(k).
      Yield-to-maturity solves the same on the full stepped path with 100
      redemption. c_up = coupon + step-up within the stepped window.
    - Call-to-avoid-step-up incentive at call date k (per 100 face):
          incentive_k = p_miss * [ (up_bp/100) * A_w(t>k)  -  (call_price-100)*DF(k) ]
      i.e. the probability-weighted PV of stepped coupons avoided by calling,
      net of the call premium, discounted at the flat rate. Refinancing at the
      unchanged base yield is assumed (stated simplification).
    """
    p = req.p_miss
    ann = _annuities(req.observation_date, req.bond_tenor_years, req.discount_rate_pct, req.spt_target_year)
    a_w, obs = ann["a_stepped"], ann["obs_year_frac"]
    y = req.discount_rate_pct / 100.0
    T = int(req.bond_tenor_years)

    up_cost = p * (req.step_up_bp / 100.0) * a_w
    down_benefit = (1.0 - p) * (req.step_down_bp / 100.0) * a_w
    net_cost = up_cost - down_benefit

    # Expected coupon path + stepped (miss) path
    path = []
    for i in range(1, T + 1):
        in_w = (obs + i) > (req.spt_target_year + 1.0)
        exp_cpn = req.coupon_pct + ((p * req.step_up_bp - (1.0 - p) * req.step_down_bp) / 100.0 if in_w else 0.0)
        stepped_cpn = req.coupon_pct + (req.step_up_bp / 100.0 if in_w else 0.0)
        path.append({"period": i, "payment_calendar_year": round(obs + i, 2),
                     "in_step_window": in_w,
                     "expected_coupon_pct": round(exp_cpn, 4),
                     "stepped_coupon_pct": round(stepped_cpn, 4)})

    def _solve_yield(flows: List[tuple], price: float) -> float:
        lo, hi = -0.5, 2.0
        def f(r):
            return sum(cf * (1.0 + r) ** (-t) for t, cf in flows) - price
        flo, fhi = f(lo), f(hi)
        if flo * fhi > 0:
            raise HTTPException(422, "yield solver bracket failure — check price/coupon inputs")
        for _ in range(200):
            mid = 0.5 * (lo + hi)
            fm = f(mid)
            if abs(fm) < 1e-10:
                return mid
            if flo * fm < 0:
                hi = mid
            else:
                lo, flo = mid, fm
        return 0.5 * (lo + hi)

    stepped_flows = [(float(r["period"]), r["stepped_coupon_pct"]) for r in path]
    stepped_flows[-1] = (stepped_flows[-1][0], stepped_flows[-1][1] + 100.0)
    ytm_stepped = _solve_yield(stepped_flows, req.market_price_per_100)

    call_rows = []
    best = None
    for cd in sorted(req.call_schedule, key=lambda c: c.years_from_observation):
        k = cd.years_from_observation
        if k > T:
            continue
        flows_k = [(float(r["period"]), r["stepped_coupon_pct"]) for r in path if r["period"] < k]
        flows_k.append((float(k), (path[k - 1]["stepped_coupon_pct"]) + cd.call_price))
        ytc = _solve_yield(flows_k, req.market_price_per_100)
        a_w_after_k = sum((1.0 + y) ** (-float(i)) for i in range(1, T + 1)
                          if (obs + i) > (req.spt_target_year + 1.0) and i > k)
        df_k = (1.0 + y) ** (-float(k))
        incentive = p * ((req.step_up_bp / 100.0) * a_w_after_k - (cd.call_price - 100.0) * df_k)
        row = {
            "years_from_observation": k, "call_price": cd.call_price,
            "yield_to_call_stepped_pct": round(ytc * 100.0, 4),
            "yield_to_maturity_stepped_pct": round(ytm_stepped * 100.0, 4),
            "ytc_minus_ytm_bp": round((ytc - ytm_stepped) * 1e4, 2),
            "stepped_annuity_after_call": round(a_w_after_k, 4),
            "call_to_avoid_step_up_incentive_per_100": round(incentive, 4),
            "incentive_value_mn": round(incentive / 100.0 * req.issue_size_mn, 4),
        }
        call_rows.append(row)
        if best is None or incentive > best["call_to_avoid_step_up_incentive_per_100"]:
            best = row

    return {
        "inputs": req.model_dump(mode="json"),
        "expected_cost": {
            "formula": "E[cost]/100 = p*(up/100)*A_w - (1-p)*(down/100)*A_w  (documented two-way structure)",
            "pv_step_up_cost_per_100": round(up_cost, 4),
            "pv_step_down_benefit_per_100": round(down_benefit, 4),
            "net_expected_cost_per_100": round(net_cost, 4),
            "step_up_only_cost_per_100": round(up_cost, 4),
            "net_cost_mn": round(net_cost / 100.0 * req.issue_size_mn, 4),
            "structural_check": {
                "step_down_reduces_cost_vs_step_up_only": net_cost <= up_cost + 1e-12,
                "why": "the step-down term enters with a negative sign and (1-p), down_bp, A_w are all >= 0",
            },
            "annuity_step_window": round(a_w, 4),
        },
        "coupon_paths": path,
        "call_analysis": {
            "convention": ("YTC solved by bisection on the STEPPED coupon path (conditional on a "
                           "miss) at each call date vs stepped-path YTM; incentive_k = p_miss * "
                           "[PV of stepped coupons avoided after k - call premium PV]; refinancing "
                           "at the unchanged base yield assumed (stated simplification)"),
            "yield_to_maturity_stepped_pct": round(ytm_stepped * 100.0, 4),
            "calls": call_rows,
            "best_call": best,
            "reading": ("a POSITIVE incentive means that, following a miss, calling at that date "
                        "and refinancing saves more step-up coupon PV than the call premium costs — "
                        "the SLB's step-up bite is weakened by the embedded call"),
        },
        "engine": "slb_structuring /step-down-call (closed-form + bisection; no PRNG)",
        "computed_at": datetime.now(timezone.utc).isoformat(),
    }


# ---------------------------------------------------------------------------
# 3) Historical-trajectory calibration — POST /calibrate-history
# ---------------------------------------------------------------------------

class HistoryPoint(BaseModel):
    year: int = Field(..., ge=1990, le=2100)
    value: float = Field(..., gt=0)


class CalibrateHistoryRequest(BaseModel):
    history: List[HistoryPoint] = Field(..., min_length=3, max_length=15,
                                        description="Actual KPI history (>=3 points; 5yr typical)")
    spt_target_year: int = Field(..., ge=1990, le=2100)
    spt_target_value: float = Field(..., gt=0)
    sector: Optional[str] = None
    pathway_slope_pct_per_yr: Optional[float] = Field(None, gt=0)
    logistic: LogisticParams = Field(default_factory=LogisticParams)
    blend_weight_history: float = Field(
        0.5, ge=0, le=1,
        description="Weight on the data-driven p(miss); (1-w) goes on the logistic ambition mapping. VISIBLE blend.")
    ambition_band_pp: float = Field(0.5, gt=0)


@router.post("/calibrate-history")
def calibrate_history(req: CalibrateHistoryRequest) -> Dict[str, Any]:
    """Data-driven p(miss) from the issuer's OWN KPI history, blended with the
    logistic ambition mapping (weights visible).

    Documented method:
    1. OLS on ln(KPI) vs year over the history -> trend slope b
       (trend %/yr = (e^b - 1)*100; negative = declining KPI) and residual
       std error s (dof = n-2).
    2. Extrapolate ln KPI to the target year; prediction std error
       s_proj = s * sqrt(1 + 1/n + (T - year_mean)^2 / Sxx)  (standard OLS
       prediction interval).
    3. p_hist = P(KPI_T > SPT) = Phi( (ln extrap - ln SPT) / s_proj )
       via the closed-form normal CDF (math.erf). MODEL ASSUMPTION:
       log-normal residuals around the log-linear trend.
    4. p_blend = w * p_hist + (1-w) * p_logistic(gap), with the gap computed
       from the EARLIEST history point as baseline (stated convention) and the
       sector pathway slope. All weights and parameters are in the response.
    """
    pts = sorted(req.history, key=lambda p: p.year)
    years = [float(p.year) for p in pts]
    lnv = [math.log(p.value) for p in pts]
    n = len(pts)
    if len(set(years)) != n:
        raise HTTPException(422, "duplicate years in history")
    if req.spt_target_year <= pts[-1].year:
        raise HTTPException(422, "spt_target_year must be after the last history year")

    my_, ml = sum(years) / n, sum(lnv) / n
    sxx = sum((x - my_) ** 2 for x in years)
    if sxx <= 1e-12:
        raise HTTPException(422, "history years are degenerate")
    b = sum((x - my_) * (l - ml) for x, l in zip(years, lnv)) / sxx
    a = ml - b * my_
    fitted = [a + b * x for x in years]
    resid = [l - f for l, f in zip(lnv, fitted)]
    ss_res = sum(r ** 2 for r in resid)
    dof = max(n - 2, 1)
    s = math.sqrt(ss_res / dof)
    trend_pct = (math.exp(b) - 1.0) * 100.0

    T = float(req.spt_target_year)
    ln_hat = a + b * T
    extrap = math.exp(ln_hat)
    s_proj = s * math.sqrt(1.0 + 1.0 / n + (T - my_) ** 2 / sxx)
    ln_spt = math.log(req.spt_target_value)
    if s_proj > 1e-12:
        p_hist = _norm_cdf((ln_hat - ln_spt) / s_proj)
    else:
        p_hist = 1.0 if ln_hat > ln_spt else 0.0

    # Logistic leg: baseline = earliest history point (stated convention)
    slope, slope_src = _resolve_slope(req.sector, req.pathway_slope_pct_per_yr)
    g = _spt_gap(pts[0].year, pts[0].value, req.spt_target_year, req.spt_target_value, slope)
    if req.logistic.p_cap <= req.logistic.p_floor:
        raise HTTPException(422, "logistic.p_cap must exceed logistic.p_floor")
    p_log = _logistic_p_miss(g["gap"], req.logistic)
    w = req.blend_weight_history
    p_blend = w * p_hist + (1.0 - w) * p_log

    # Chart series: history + fitted + extrapolation with +-1 s_proj band
    series = []
    for x, v, f in zip(years, [p.value for p in pts], fitted):
        series.append({"year": int(x), "actual": round(math.exp(math.log(v)), 4),
                       "trend": round(math.exp(f), 4)})
    for yr in range(pts[-1].year + 1, req.spt_target_year + 1):
        lh = a + b * yr
        sp = s * math.sqrt(1.0 + 1.0 / n + (yr - my_) ** 2 / sxx)
        series.append({"year": yr, "trend": round(math.exp(lh), 4),
                       "band_hi": round(math.exp(lh + sp), 4),
                       "band_lo": round(math.exp(lh - sp), 4)})

    band = req.ambition_band_pp
    verdict = "ahead" if g["gap"] >= band else ("behind" if g["gap"] <= -band else "aligned")

    return {
        "inputs": req.model_dump(mode="json"),
        "trend": {
            "model": "OLS on ln(KPI) vs year (documented; log-normal residual assumption)",
            "slope_ln_per_yr": round(b, 6),
            "trend_pct_per_yr": round(trend_pct, 3),
            "residual_std_ln": round(s, 6),
            "r_squared": round(1.0 - ss_res / max(sum((l - ml) ** 2 for l in lnv), 1e-12), 4),
            "n_points": n,
        },
        "extrapolation": {
            "target_year": req.spt_target_year,
            "extrapolated_kpi": round(extrap, 4),
            "spt_target_value": req.spt_target_value,
            "gap_vs_spt_pct": round((extrap / req.spt_target_value - 1.0) * 100.0, 2),
            "prediction_std_ln": round(s_proj, 6),
            "prediction_interval_note": "s_proj = s*sqrt(1 + 1/n + (T-mean)^2/Sxx) — standard OLS prediction std error",
        },
        "probability_of_miss": {
            "p_history": round(p_hist, 4),
            "p_history_formula": "Phi((ln extrap - ln SPT)/s_proj) — P(trend-projected KPI exceeds the SPT)",
            "p_logistic": round(p_log, 4),
            "p_logistic_basis": {
                "baseline": f"{pts[0].year} = {pts[0].value} (earliest history point — stated convention)",
                "spt_implied_annual_reduction_pct": round(g["r_spt"], 3),
                "pathway_slope_pct": round(slope, 3), "pathway_slope_source": slope_src,
                "ambition_gap_pp_per_yr": round(g["gap"], 3), "verdict": verdict,
            },
            "blend": {
                "weight_history": w, "weight_logistic": round(1.0 - w, 4),
                "p_blended": round(p_blend, 4),
                "formula": "p_blend = w*p_history + (1-w)*p_logistic (weights user-set, VISIBLE)",
            },
        },
        "series": series,
        "benchmarks": {"label": SLB_BENCHMARK_LABEL, "rows": SLB_STEP_UP_BENCHMARKS},
        "engine": "slb_structuring /calibrate-history (closed-form OLS + erf CDF; no PRNG)",
        "computed_at": datetime.now(timezone.utc).isoformat(),
    }


# ---------------------------------------------------------------------------
# 4) Ambition analytics: cost-of-ambition sweep, greenium vs step-up, MACC /
#    capex-linked p(miss) — POST /ambition-analytics
# ---------------------------------------------------------------------------

class MaccMeasure(BaseModel):
    name: str = Field(..., min_length=1)
    cost_usd_per_t: float = Field(..., ge=-500, le=2000, description="Abatement cost ($/tCO2e); negative = net-saving measure")
    abatement_kt_per_yr: float = Field(..., gt=0, description="Annual abatement potential (ktCO2e/yr)")


class AmbitionAnalyticsRequest(BaseModel):
    baseline_year: int = Field(..., ge=1990, le=2100)
    baseline_value: float = Field(..., gt=0)
    spt_target_year: int = Field(..., ge=1990, le=2100)
    spt_target_value: float = Field(..., gt=0)
    sector: Optional[str] = None
    pathway_slope_pct_per_yr: Optional[float] = Field(None, gt=0)
    coupon_step_up_bp: float = Field(25.0, ge=0)
    observation_date: date
    bond_tenor_years: int = Field(..., ge=1, le=50)
    discount_rate_pct: float = Field(4.0, ge=0)
    issue_size_mn: float = Field(..., gt=0)
    logistic: LogisticParams = Field(default_factory=LogisticParams)
    greenium_bp: float = Field(-4.0, ge=-50, le=50,
                               description="Primary greenium the label earns (bp; negative = tighter funding)")
    base_annual_emissions_t: float = Field(..., gt=0, description="Issuer annual scope-covered emissions (tCO2e/yr) — converts abatement to pp/yr")
    capex_budget_mn: float = Field(0.0, ge=0, description="Decarbonization capex program size (annualized $mn/yr)")
    macc_measures: List[MaccMeasure] = Field(default_factory=list, max_length=15)
    sweep_points: int = Field(13, ge=5, le=41)
    capex_steps: int = Field(11, ge=3, le=41)


def _macc_abatement_for_budget(measures: List[MaccMeasure], budget_usd: float) -> Dict[str, Any]:
    """Merit-order MACC allocation (documented): measures sorted by $/t; the
    annualized budget buys abatement measure-by-measure at cost_per_t *
    tonnes; negative-cost measures are taken first at zero budget draw
    (they self-fund — stated convention); partial funding pro-rates tonnes."""
    ordered = sorted(measures, key=lambda m: m.cost_usd_per_t)
    remaining = budget_usd
    total_t = 0.0
    steps = []
    for m in ordered:
        tonnes = m.abatement_kt_per_yr * 1000.0
        if m.cost_usd_per_t <= 0:
            taken = tonnes
            spend = 0.0
        else:
            full_cost = m.cost_usd_per_t * tonnes
            if remaining >= full_cost:
                taken, spend = tonnes, full_cost
            elif remaining > 0:
                taken = remaining / m.cost_usd_per_t
                spend = remaining
            else:
                taken, spend = 0.0, 0.0
            remaining -= spend
        total_t += taken
        steps.append({"name": m.name, "cost_usd_per_t": m.cost_usd_per_t,
                      "potential_kt": m.abatement_kt_per_yr,
                      "funded_kt": round(taken / 1000.0, 3),
                      "spend_usd_mn": round(spend / 1e6, 3)})
    return {"total_abatement_t_per_yr": total_t, "steps": steps,
            "budget_left_usd_mn": round(max(remaining, 0.0) / 1e6, 3)}


@router.post("/ambition-analytics")
def ambition_analytics(req: AmbitionAnalyticsRequest) -> Dict[str, Any]:
    """Sustainability x financial overlay for the SLB:
    (a) cost-of-ambition curve — step-up value vs SPT stringency sweep;
    (b) greenium vs step-up combined pricing view;
    (c) capex/MACC-linked p(miss): funded abatement reduces the RESIDUAL
        ambition gap (documented convention below), monotonically lowering
        p(miss).

    Capex->trajectory convention (stated): funded annual abatement A (tCO2e/yr)
    over base emissions E converts to funded_reduction_pp = (A/E*100) /
    years_to_target — the share of the required annual reduction rate that the
    capex program already delivers; residual_gap = gap - funded_reduction_pp
    and p_miss_effective = logistic(residual_gap). Abatement-cost linkage is a
    planning approximation, not an engineering model.
    """
    slope, slope_src = _resolve_slope(req.sector, req.pathway_slope_pct_per_yr)
    if req.logistic.p_cap <= req.logistic.p_floor:
        raise HTTPException(422, "logistic.p_cap must exceed logistic.p_floor")
    g0 = _spt_gap(req.baseline_year, req.baseline_value, req.spt_target_year, req.spt_target_value, slope)
    ann = _annuities(req.observation_date, req.bond_tenor_years, req.discount_rate_pct, req.spt_target_year)
    a_w, a_full = ann["a_stepped"], ann["a_full"]

    def value_at_gap(gap_pp: float) -> Dict[str, float]:
        p = _logistic_p_miss(gap_pp, req.logistic)
        pv = p * (req.coupon_step_up_bp / 100.0) * a_w
        return {"p_miss": p, "pv_per_100": pv,
                "bp_equiv": pv / (0.01 * a_full) if a_full > 0 else 0.0}

    # (a) cost-of-ambition sweep: target value from 95% down to 40% of baseline
    sweep = []
    for i in range(req.sweep_points):
        frac = 0.95 - (0.95 - 0.40) * i / (req.sweep_points - 1)
        tv = req.baseline_value * frac
        gg = _spt_gap(req.baseline_year, req.baseline_value, req.spt_target_year, tv, slope)
        v = value_at_gap(gg["gap"])
        sweep.append({
            "spt_target_value": round(tv, 4),
            "target_vs_baseline_pct": round(frac * 100.0, 1),
            "implied_reduction_pct_per_yr": round(gg["r_spt"], 3),
            "ambition_gap_pp_per_yr": round(gg["gap"], 3),
            "p_miss": round(v["p_miss"], 4),
            "step_up_pv_per_100": round(v["pv_per_100"], 4),
            "step_up_bp_equivalent": round(v["bp_equiv"], 3),
        })

    # (b) greenium vs step-up combined pricing at the ACTUAL SPT
    v0 = value_at_gap(g0["gap"])
    net_bp = v0["bp_equiv"] + req.greenium_bp
    combined = {
        "at_actual_spt": {
            "ambition_gap_pp_per_yr": round(g0["gap"], 3),
            "p_miss": round(v0["p_miss"], 4),
            "step_up_bp_equivalent": round(v0["bp_equiv"], 3),
        },
        "greenium_bp": req.greenium_bp,
        "net_label_economics_bp": round(net_bp, 3),
        "reading": ("net = step-up running-cost equivalent + greenium (negative greenium = "
                    "funding saving). Negative net: the label SAVES the issuer money in "
                    "expectation; positive net: the contingent step-up outweighs the greenium."),
        "impact_yield_note": ("pair with the green-bond desk impact-yield metric "
                              "(tCO2e avoided per bp of greenium) for the full sustainability x pricing view"),
    }

    # (c) capex / MACC sensitivity
    years_to_target = max(req.spt_target_year - req.baseline_year, 1)
    capex_curve = []
    prev_p = None
    monotonic = True
    for i in range(req.capex_steps):
        capex_mn = req.capex_budget_mn * i / (req.capex_steps - 1) if req.capex_steps > 1 else req.capex_budget_mn
        alloc = _macc_abatement_for_budget(req.macc_measures, capex_mn * 1e6)
        funded_pp = (alloc["total_abatement_t_per_yr"] / req.base_annual_emissions_t * 100.0) / years_to_target
        residual_gap = g0["gap"] - funded_pp
        v = value_at_gap(residual_gap)
        if prev_p is not None and v["p_miss"] > prev_p + 1e-12:
            monotonic = False
        prev_p = v["p_miss"]
        capex_curve.append({
            "capex_mn_per_yr": round(capex_mn, 2),
            "funded_abatement_kt_per_yr": round(alloc["total_abatement_t_per_yr"] / 1000.0, 2),
            "funded_reduction_pp_per_yr": round(funded_pp, 4),
            "residual_gap_pp_per_yr": round(residual_gap, 4),
            "p_miss_effective": round(v["p_miss"], 4),
            "step_up_pv_per_100": round(v["pv_per_100"], 4),
        })

    full_alloc = _macc_abatement_for_budget(req.macc_measures, req.capex_budget_mn * 1e6)
    macc_sorted = sorted(req.macc_measures, key=lambda m: m.cost_usd_per_t)
    cum = 0.0
    macc_curve = []
    for m in macc_sorted:
        macc_curve.append({"name": m.name, "cost_usd_per_t": m.cost_usd_per_t,
                           "abatement_kt_per_yr": m.abatement_kt_per_yr,
                           "cum_from_kt": round(cum, 2),
                           "cum_to_kt": round(cum + m.abatement_kt_per_yr, 2)})
        cum += m.abatement_kt_per_yr

    return {
        "inputs": req.model_dump(mode="json"),
        "pathway": {"slope_pct_per_yr": round(slope, 3), "source": slope_src},
        "cost_of_ambition": {
            "sweep": sweep,
            "note": ("step-up value vs SPT stringency: tighter targets raise the implied "
                     "reduction rate, the ambition gap, p(miss) and hence the contingent "
                     "step-up cost — the issuer's 'cost of ambition' curve"),
        },
        "greenium_vs_step_up": combined,
        "capex_sensitivity": {
            "curve": capex_curve,
            "convention": ("funded_reduction_pp = (annual abatement / base emissions * 100) / "
                           "years-to-target; residual_gap = gap - funded_pp; "
                           "p_eff = logistic(residual_gap) — DOCUMENTED planning convention"),
            "structural_check": {
                "p_miss_monotonically_nonincreasing_in_capex": monotonic,
                "why": "more budget can only fund more merit-order abatement, which only lowers the residual gap; the logistic is increasing in the gap",
            },
        },
        "macc": {
            "curve": macc_curve,
            "allocation_at_full_budget": full_alloc,
            "convention": ("merit-order MACC: measures sorted by $/t; negative-cost measures "
                           "self-fund (zero budget draw — stated); partial funding pro-rates tonnes"),
        },
        "engine": "slb_structuring /ambition-analytics (closed-form; no PRNG)",
        "computed_at": datetime.now(timezone.utc).isoformat(),
    }


# ---------------------------------------------------------------------------
# 5) SPO pre-assessment — POST /spo-preassessment
# ---------------------------------------------------------------------------

class SpoPreassessmentRequest(BaseModel):
    # Materiality (SLBP component 1)
    kpi_core_business: bool = Field(..., description="KPI relevant, core and material to the business")
    kpi_measurable: bool = Field(..., description="Measurable on a consistent methodological basis")
    kpi_externally_verifiable: bool = Field(...)
    kpi_benchmarkable: bool = Field(...)
    # Ambition (component 2)
    ambition_gap_pp_per_yr: float = Field(..., description="From /calibrate or /calibrate-history")
    history_years_disclosed: int = Field(0, ge=0, le=30, description=">=3yr track record recommended by the SLBP")
    spt_beyond_bau: bool = Field(..., description="SPT represents material improvement beyond business-as-usual")
    observation_dates_defined: bool = Field(...)
    # Verification plan (component 5)
    annual_external_verification: bool = Field(...)
    qualified_reviewer: bool = Field(...)
    verification_public: bool = Field(...)
    pre_issuance_spo_planned: bool = Field(...)
    # Structure & reporting (components 3-4)
    step_up_meaningful: bool = Field(..., description="Variation commensurate/meaningful (25bp single-step market convention as anchor)")
    fallback_mechanisms_defined: bool = Field(...)
    annual_reporting: bool = Field(...)
    ambition_band_pp: float = Field(0.5, gt=0)


def _rag(score: float) -> str:
    return "GREEN" if score >= 75.0 else ("AMBER" if score >= 50.0 else "RED")


@router.post("/spo-preassessment")
def spo_preassessment(req: SpoPreassessmentRequest) -> Dict[str, Any]:
    """Structured SPO pre-assessment against the ICMA SLBP five components.
    Scoring scheme (stated convention, not an official SPO methodology):
    - Materiality  = mean of 4 booleans x 100                     (weight 0.25)
    - Ambition     = pathway base (ahead 90 / aligned 70 / behind 35)
                     + 5 if >=3y history + 5 if beyond-BAU
                     + 5 if observation dates defined, capped 100  (weight 0.35)
    - Verification = mean of 4 booleans x 100                     (weight 0.25)
    - Structure & reporting = mean of 3 booleans x 100            (weight 0.15)
    RAG: >=75 GREEN, >=50 AMBER, <50 RED.
    """
    mat_flags = [req.kpi_core_business, req.kpi_measurable,
                 req.kpi_externally_verifiable, req.kpi_benchmarkable]
    materiality = sum(mat_flags) / len(mat_flags) * 100.0

    band = req.ambition_band_pp
    gap = req.ambition_gap_pp_per_yr
    if gap >= band:
        amb, amb_verdict = 90.0, "ahead of pathway"
    elif gap <= -band:
        amb, amb_verdict = 35.0, "behind pathway"
    else:
        amb, amb_verdict = 70.0, "aligned with pathway"
    if req.history_years_disclosed >= 3:
        amb += 5.0
    if req.spt_beyond_bau:
        amb += 5.0
    if req.observation_dates_defined:
        amb += 5.0
    ambition = min(amb, 100.0)

    ver_flags = [req.annual_external_verification, req.qualified_reviewer,
                 req.verification_public, req.pre_issuance_spo_planned]
    verification = sum(ver_flags) / len(ver_flags) * 100.0

    sr_flags = [req.step_up_meaningful, req.fallback_mechanisms_defined, req.annual_reporting]
    structure_reporting = sum(sr_flags) / len(sr_flags) * 100.0

    weights = {"materiality": 0.25, "ambition": 0.35, "verification": 0.25, "structure_reporting": 0.15}
    overall = (materiality * weights["materiality"] + ambition * weights["ambition"]
               + verification * weights["verification"] + structure_reporting * weights["structure_reporting"])

    dims = {
        "materiality": {"score": round(materiality, 1), "rag": _rag(materiality),
                        "basis": "SLBP component 1 — KPI selection (4 checks)"},
        "ambition": {"score": round(ambition, 1), "rag": _rag(ambition),
                     "basis": f"SLBP component 2 — pathway verdict '{amb_verdict}' (gap {gap:+.2f} pp/yr) + history/BAU/observation add-ons"},
        "verification": {"score": round(verification, 1), "rag": _rag(verification),
                         "basis": "SLBP component 5 — verification plan (4 checks)"},
        "structure_reporting": {"score": round(structure_reporting, 1), "rag": _rag(structure_reporting),
                                "basis": "SLBP components 3-4 — bond characteristics & reporting (3 checks)"},
    }
    gaps = []
    if not req.kpi_core_business:
        gaps.append("KPI not evidenced as core/material — SPO providers weight this heavily")
    if not req.kpi_externally_verifiable:
        gaps.append("KPI must be externally verifiable (SLBP component 1)")
    if req.history_years_disclosed < 3:
        gaps.append("Disclose >=3 years of KPI history (SLBP component 2 recommendation)")
    if gap <= -band:
        gaps.append("SPT sits behind the sector decarbonization pathway — ambition challenge likely")
    if not req.annual_external_verification:
        gaps.append("Annual external verification is a REQUIRED SLBP element")
    if not req.fallback_mechanisms_defined:
        gaps.append("Define fallback/recalculation mechanics (methodology change, M&A)")
    if not req.step_up_meaningful:
        gaps.append("Step-up must be commensurate and meaningful (25bp single-step is the market anchor)")

    return {
        "inputs": req.model_dump(mode="json"),
        "dimensions": dims,
        "weights": weights,
        "overall": {"score": round(overall, 1), "rag": _rag(overall),
                    "thresholds": ">=75 GREEN, >=50 AMBER, <50 RED (stated convention)"},
        "priority_gaps": gaps,
        "disclaimer": ("Structured pre-assessment against the ICMA SLBP five components using a "
                       "STATED scoring convention — this is a desk pre-screen, not an SPO. "
                       "Engage an accredited second-party-opinion provider for issuance."),
        "engine": "slb_structuring /spo-preassessment (deterministic scoring; no PRNG)",
        "computed_at": datetime.now(timezone.utc).isoformat(),
    }
