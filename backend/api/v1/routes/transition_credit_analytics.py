"""
Transition Credit Analytics — deep sustainability x financial credit engine
===========================================================================
Prefix: /api/v1/transition-credit
Tags:   Transition Credit Analytics

Server-side heavy math for the Energy Transition Credit Portal (NX2-15):

1.  PD TERM STRUCTURE & MULTI-PERIOD EL
    Hand-authored cumulative 1-10y PD curves per rating (approximating the
    S&P Global "Default, Transition and Recovery" 1981-2023 global corporate
    cumulative default tables; anchors at 1/3/5/7/10y, linearly interpolated
    in between — labeled approximate). Marginal & conditional PDs, and
    IFRS 9-style ECL: stage-1 12-month ECL vs stage-2 lifetime ECL with
    mid-year discounting at the effective interest rate and an EAD
    amortization profile (bullet / linear / custom).

2.  CLIMATE-ADJUSTED TRANSITION MATRIX
    Hand-authored baseline annual rating-migration matrix (approximating the
    S&P 1981-2023 NR-adjusted global corporate average one-year transition
    rates; the default column matches this desk's 1-yr PD ladder exactly).
    Climate-stress overlay: NGFS scenario -> sector downgrade-intensity
    multiplier (documented judgment-based mapping in the spirit of ECB/NGFS
    climate stress-test practice, editable per request) -> every downgrade
    cell (incl. default) x multiplier, diagonal re-absorbed so each row sums
    to 1 (asserted) -> multi-year rating-distribution evolution via matrix
    powers -> scenario-conditional lifetime EL.

3.  FINANCED EMISSIONS / PCAF
    Per-exposure attribution (outstanding / EVIC, or outstanding / total
    equity + debt — PCAF Standard Part A options), PCAF data-quality ladder
    (1-5, criteria returned), portfolio absolute + intensity financed
    emissions, WACI, and an attribution-weighted temperature-alignment (ITR)
    proxy with hand-authored sector default ITRs (labeled).

4.  SUSTAINABILITY-ADJUSTED PRICING
    Climate-adjusted RAROC (user scenario probabilities x scenario-
    conditional annualized EL), carbon-cost-adjusted margin (NGFS scenario
    carbon price x absorbed share -> interest-coverage erosion -> notch
    downgrade via a documented coverage elasticity -> adjusted PD), green
    supporting / penalizing risk-weight sensitivity panel (policy-debate
    what-if, labeled), and sustainability-linked margin-ratchet valuation.

5.  PORTFOLIO MODE + TCFD/ISSB DISCLOSURE
    Book-level EL / RAROC / financed emissions, scenario-conditional book EL
    across all six NGFS scenarios, intensity-vs-margin OLS (does pricing
    reflect transition risk?), sector/rating HHI concentration, and a
    TCFD/ISSB-style metrics panel (financed emissions, WACI, carbon-related
    assets share, climate-VaR proxy = scenario EL range).

Determinism: NO PRNG anywhere — every figure is a documented closed-form
mapping of the inputs and the hand-authored reference tables below, all of
which are exposed via the /ref/* endpoints.

NGFS carbon prices are read from the same seeded Phase 5 extract served by
/api/v1/ngfs-extract (backend/data/ngfs_phase5_extract.json, IIASA Scenario
Explorer, CC BY 4.0 — approximate seeded extract, labeled).
"""
from __future__ import annotations

import json
import logging
import math
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Literal, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/transition-credit", tags=["Transition Credit Analytics"])

_NGFS_FILE = Path(__file__).resolve().parents[3] / "data" / "ngfs_phase5_extract.json"

# ─────────────────────────────────────────────────────────────────────────────
# Reference tables (hand-authored, labeled — all exposed via /ref/*)
# ─────────────────────────────────────────────────────────────────────────────
RATINGS = ["AAA", "AA", "A", "BBB", "BB", "B", "CCC", "D"]
NON_DEFAULT = RATINGS[:-1]
D_IDX = len(RATINGS) - 1

# Cumulative PD anchors (%, years 1/3/5/7/10). Hand-authored approximation of
# the S&P Global Ratings "Default, Transition, and Recovery" study, global
# corporates 1981-2023 cumulative default rates. Year-1 values match the
# portal's 1-yr PD ladder. Linearly interpolated for years 2/4/6/8/9.
PD_ANCHOR_YEARS = [1, 3, 5, 7, 10]
CUM_PD_ANCHORS_PCT: Dict[str, List[float]] = {
    "AAA": [0.02, 0.13, 0.33, 0.49, 0.66],
    "AA":  [0.03, 0.12, 0.30, 0.48, 0.68],
    "A":   [0.06, 0.21, 0.42, 0.66, 1.06],
    "BBB": [0.17, 0.75, 1.44, 2.08, 2.94],
    "BB":  [0.65, 3.14, 5.83, 7.98, 10.51],
    "B":   [3.30, 10.50, 15.50, 19.00, 22.50],
    "CCC": [26.50, 38.50, 44.00, 47.00, 50.00],
}

# Baseline annual migration matrix (%, from-rating rows x to-rating columns,
# order AAA..CCC,D). Hand-authored approximation of the S&P 1981-2023
# NR-adjusted global corporate average one-year transition matrix. The default
# column equals the portal's 1-yr PD ladder (AAA 0.02 ... CCC 26.50). Each raw
# row sums to exactly 100.00; rows are re-normalized to machine precision on
# load and the row-stochastic property is asserted.
BASELINE_MATRIX_PCT: List[List[float]] = [
    # AAA     AA      A      BBB    BB     B      CCC    D
    [89.84,  9.35,  0.55,  0.05,  0.11,  0.03,  0.05,  0.02],   # AAA
    [ 0.51, 90.66,  8.10,  0.50,  0.06,  0.11,  0.03,  0.03],   # AA
    [ 0.03,  1.72, 92.04,  5.54,  0.44,  0.10,  0.07,  0.06],   # A
    [ 0.01,  0.10,  3.51, 91.34,  3.98,  0.65,  0.24,  0.17],   # BBB
    [ 0.01,  0.03,  0.12,  5.03, 85.94,  7.13,  1.09,  0.65],   # BB
    [ 0.00,  0.02,  0.08,  0.16,  5.13, 84.42,  6.89,  3.30],   # B
    [ 0.00,  0.00,  0.10,  0.36,  0.87, 12.94, 59.23, 26.50],   # CCC
    [ 0.00,  0.00,  0.00,  0.00,  0.00,  0.00,  0.00, 100.00],  # D (absorbing)
]

# NGFS scenario x climate-exposure-class downgrade-intensity multipliers.
# Hand-authored judgment overlay in the spirit of NGFS/ECB climate stress-test
# practice: the multiplier scales every downgrade probability (incl. default)
# in the borrower's row; the diagonal absorbs the difference (documented in
# stress_matrix). >1 = transition/physical risk raises downgrade intensity;
# <1 = orderly-transition tailwind for green generators. Editable per request.
SCENARIO_IDS = ["net_zero_2050", "below_2c", "delayed_transition", "fragmented_world", "ndcs", "current_policies"]
CLASS_MULTIPLIERS: Dict[str, Dict[str, float]] = {
    #                    green  mixed  neutral fossil fossil_high
    "net_zero_2050":      {"green": 0.85, "mixed": 1.15, "neutral": 1.00, "fossil": 2.20, "fossil_high": 3.00},
    "below_2c":           {"green": 0.90, "mixed": 1.10, "neutral": 1.00, "fossil": 1.60, "fossil_high": 2.10},
    "delayed_transition": {"green": 1.10, "mixed": 1.35, "neutral": 1.15, "fossil": 2.80, "fossil_high": 3.60},
    "fragmented_world":   {"green": 1.15, "mixed": 1.30, "neutral": 1.10, "fossil": 2.00, "fossil_high": 2.60},
    "ndcs":               {"green": 0.95, "mixed": 1.05, "neutral": 1.00, "fossil": 1.25, "fossil_high": 1.50},
    # Hot-house: little extra transition risk for fossil, but physical risk
    # weighs on weather-dependent renewables (green 1.10).
    "current_policies":   {"green": 1.10, "mixed": 1.05, "neutral": 1.00, "fossil": 1.00, "fossil_high": 1.00},
}
SECTOR_CLASS: Dict[str, str] = {
    "Solar IPP": "green", "Wind IPP": "green", "Hydro IPP": "green", "Geothermal": "green",
    "Storage + Solar hybrid": "green", "Biomass / WtE": "mixed",
    "Gas CCGT (transition)": "fossil", "Coal power": "fossil_high", "Oil & Gas": "fossil_high",
    "Grid / Networks": "neutral", "Other": "neutral",
}

# PCAF data-quality ladder (PCAF Global GHG Standard, Part A, Table 5-2 style
# criteria — paraphrased).
PCAF_DQ_LADDER = {
    1: "Audited/verified reported emissions (highest quality)",
    2: "Unverified company-reported emissions",
    3: "Physical-activity-based estimate (production x emission factor)",
    4: "Economic-activity-based estimate (revenue x sector factor)",
    5: "Asset-class/sector average proxy (lowest quality)",
}

# Hand-authored sector default implied-temperature-rise (ITR) proxies, °C.
# Used only when the caller supplies no borrower-level ITR — labeled proxy.
SECTOR_ITR_DEFAULT: Dict[str, float] = {
    "Solar IPP": 1.6, "Wind IPP": 1.6, "Hydro IPP": 1.7, "Geothermal": 1.7,
    "Storage + Solar hybrid": 1.7, "Biomass / WtE": 2.1,
    "Gas CCGT (transition)": 2.6, "Coal power": 3.2, "Oil & Gas": 3.0,
    "Grid / Networks": 2.0, "Other": 2.4,
}

# Basel III SA corporate risk weights by rating (CRE20.16 / CRR Art 122,
# hand-transcribed — used server-side where no live IRB weight is supplied).
SA_RW_BY_RATING: Dict[str, float] = {"AAA": 0.20, "AA": 0.20, "A": 0.50, "BBB": 1.00, "BB": 1.00, "B": 1.50, "CCC": 1.50}

FOSSIL_CLASSES = {"fossil", "fossil_high"}
MAX_YEARS = 10


# ─────────────────────────────────────────────────────────────────────────────
# Core math (pure, deterministic)
# ─────────────────────────────────────────────────────────────────────────────
@lru_cache(maxsize=1)
def baseline_matrix() -> tuple:
    """Baseline matrix as row-normalized fractions; row-stochastic asserted."""
    rows = []
    for i, row in enumerate(BASELINE_MATRIX_PCT):
        s = sum(row)
        if abs(s - 100.0) > 1e-6:
            raise RuntimeError(f"Baseline matrix row {RATINGS[i]} sums to {s}, expected 100")
        rows.append(tuple(c / s for c in row))
    for i, row in enumerate(rows):
        assert abs(sum(row) - 1.0) < 1e-12, f"row {RATINGS[i]} not stochastic"
    return tuple(rows)


def stress_matrix(multiplier: float) -> List[List[float]]:
    """
    Climate-stress overlay: every downgrade cell (columns to the right of the
    diagonal, i.e. worse ratings incl. default) is multiplied by `multiplier`;
    upgrade cells are unchanged; the diagonal absorbs the difference so each
    row sums to exactly 1. If the scaled downgrades would exceed the available
    mass (diagonal floor 0), they are proportionally rescaled to fit — this
    caps extreme multipliers without breaking row-stochasticity. Rows are
    asserted to sum to 1.
    """
    m = max(float(multiplier), 0.0)
    base = baseline_matrix()
    out: List[List[float]] = []
    for i in range(len(RATINGS)):
        row = list(base[i])
        if i == D_IDX:  # default row stays absorbing
            out.append(row)
            continue
        upgrades = sum(row[j] for j in range(0, i))
        downgrades = [row[j] * m for j in range(i + 1, len(RATINGS))]
        dg_total = sum(downgrades)
        available = 1.0 - upgrades  # mass available for diagonal + downgrades
        if dg_total > available:    # cap: rescale downgrades, diagonal -> 0
            scale = available / dg_total if dg_total > 0 else 0.0
            downgrades = [d * scale for d in downgrades]
            dg_total = available
        new_row = [row[j] for j in range(0, i)] + [available - dg_total] + downgrades
        out.append(new_row)
    for i, row in enumerate(out):
        s = sum(row)
        assert abs(s - 1.0) < 1e-9, f"stressed row {RATINGS[i]} sums to {s}"
        # exact re-normalization to machine precision
        out[i] = [c / s for c in row]
    return out


def evolve(matrix: List[List[float]], start_rating: str, years: int) -> List[List[float]]:
    """
    Rating-distribution evolution: v_t = v_{t-1} @ M (matrix powers applied to
    the one-hot starting vector). Returns [v_1 .. v_years]; each distribution
    is asserted to sum to 1.
    """
    v = [0.0] * len(RATINGS)
    v[RATINGS.index(start_rating)] = 1.0
    path = []
    for t in range(years):
        v = [sum(v[i] * matrix[i][j] for i in range(len(RATINGS))) for j in range(len(RATINGS))]
        s = sum(v)
        assert abs(s - 1.0) < 1e-9, f"year {t+1} distribution sums to {s}"
        v = [x / s for x in v]
        path.append(list(v))
    return path


def cum_pd_curve(rating: str, years: int = MAX_YEARS) -> List[float]:
    """Cumulative PD (fraction) for years 1..years, linearly interpolated
    between the hand-authored anchors; flat extrapolation beyond year 10."""
    anchors = CUM_PD_ANCHORS_PCT.get(rating)
    if anchors is None:
        raise HTTPException(status_code=422, detail=f"Unknown rating '{rating}'. Valid: {NON_DEFAULT}")
    xs, ys = PD_ANCHOR_YEARS, anchors
    out = []
    for t in range(1, years + 1):
        if t <= xs[0]:
            v = ys[0]
        elif t >= xs[-1]:
            v = ys[-1]
        else:
            for k in range(len(xs) - 1):
                if xs[k] <= t <= xs[k + 1]:
                    w = (t - xs[k]) / (xs[k + 1] - xs[k])
                    v = ys[k] + w * (ys[k + 1] - ys[k])
                    break
        out.append(v / 100.0)
    return out


def ead_profile(ead: float, tenor: int, amort: str, custom: Optional[List[float]]) -> List[float]:
    """EAD outstanding during each year 1..tenor. bullet = constant; linear =
    straight-line amortization measured mid-year; custom = caller-supplied."""
    if amort == "custom":
        if not custom or len(custom) < tenor:
            raise HTTPException(status_code=422, detail=f"custom_ead must supply {tenor} values")
        return [max(float(x), 0.0) for x in custom[:tenor]]
    if amort == "linear":
        return [ead * (tenor - t + 0.5) / tenor for t in range(1, tenor + 1)]
    return [ead] * tenor  # bullet


def lifetime_el_rows(marginal_pds: List[float], lgd: float, eads: List[float], rate: float) -> List[dict]:
    """Per-year EL rows with mid-year discounting: EL_t = mPD_t x LGD x EAD_t x DF(t-0.5)."""
    rows = []
    cum = 0.0
    for t, (mpd, e) in enumerate(zip(marginal_pds, eads), start=1):
        cum += mpd
        surv_prev = 1.0 - (cum - mpd)
        df = (1.0 + rate) ** -(t - 0.5)
        el = mpd * lgd * e * df
        rows.append({
            "year": t, "marginal_pd_pct": mpd * 100, "cumulative_pd_pct": cum * 100,
            "conditional_pd_pct": (mpd / surv_prev * 100) if surv_prev > 1e-12 else None,
            "ead": e, "discount_factor": df, "el": el,
        })
    return rows


def sa_risk_weight(rating: str) -> float:
    return SA_RW_BY_RATING.get(rating, 1.0)


def raroc_calc(rw: float, ead: float, margin_bps: float, el_bps: float, opex_bps: float,
               cap_ratio: float, hurdle: float) -> dict:
    rwa = rw * ead
    capital = rwa * cap_ratio
    net_bps = margin_bps - el_bps - opex_bps
    net_income = net_bps / 1e4 * ead
    raroc = (net_income / capital * 100) if capital > 0 else None
    floor_bps = el_bps + opex_bps + hurdle * cap_ratio * rw * 1e4
    return {"rwa": rwa, "capital": capital, "net_bps": net_bps, "net_income": net_income,
            "raroc_pct": raroc, "floor_bps": floor_bps,
            "meets_hurdle": raroc is not None and raroc >= hurdle * 100}


def sector_multiplier(scenario: str, sector: str) -> float:
    cls = SECTOR_CLASS.get(sector, "neutral")
    if scenario not in CLASS_MULTIPLIERS:
        raise HTTPException(status_code=422, detail=f"Unknown scenario '{scenario}'. Valid: {SCENARIO_IDS}")
    return CLASS_MULTIPLIERS[scenario][cls]


def matrix_lifetime_el(matrix: List[List[float]], rating: str, lgd: float,
                       eads: List[float], rate: float) -> dict:
    """Lifetime EL from a migration matrix: marginal PD_t = cumD_t - cumD_{t-1}
    where cumD_t is the default-state mass of the year-t distribution."""
    path = evolve(matrix, rating, len(eads))
    cum_prev, marginals = 0.0, []
    for v in path:
        marginals.append(max(v[D_IDX] - cum_prev, 0.0))
        cum_prev = v[D_IDX]
    rows = lifetime_el_rows(marginals, lgd, eads, rate)
    disc_ead = sum((1.0 + rate) ** -(t - 0.5) * e for t, e in enumerate(eads, start=1))
    total = sum(r["el"] for r in rows)
    return {"rows": rows, "lifetime_el": total, "cumulative_pd_pct": cum_prev * 100,
            "annualized_el_bps": (total / disc_ead * 1e4) if disc_ead > 0 else None,
            "distribution_path": path}


@lru_cache(maxsize=1)
def _ngfs_carbon_prices() -> dict:
    """{scenario_id: {year: carbon_price}} from the seeded NGFS Phase 5 extract (World)."""
    if not _NGFS_FILE.exists():
        return {}
    with open(_NGFS_FILE, "r", encoding="utf-8") as fh:
        ex = json.load(fh)
    years = ex["years"]
    out = {}
    for sid, regions in ex["data"].items():
        series = regions.get("World", {}).get("carbon_price")
        if series:
            out[sid] = {y: p for y, p in zip(years, series)}
    return out


# ─────────────────────────────────────────────────────────────────────────────
# Request models
# ─────────────────────────────────────────────────────────────────────────────
Amort = Literal["bullet", "linear", "custom"]


class LifetimeElRequest(BaseModel):
    rating: str = Field("BBB", description="AAA..CCC")
    lgd_pct: float = Field(45.0, ge=0, le=100)
    ead: float = Field(420.0, gt=0, description="$M at t=0")
    tenor_years: int = Field(10, ge=1, le=MAX_YEARS)
    amortization: Amort = "bullet"
    custom_ead: Optional[List[float]] = None
    discount_rate_pct: float = Field(6.0, ge=0, le=50, description="Effective interest rate (IFRS 9 EIR)")


class ClimateMatrixRequest(BaseModel):
    scenario: str = Field("net_zero_2050")
    sector: str = Field("Gas CCGT (transition)")
    rating: str = Field("BBB")
    years: int = Field(10, ge=1, le=MAX_YEARS)
    lgd_pct: float = Field(45.0, ge=0, le=100)
    ead: float = Field(420.0, gt=0)
    amortization: Amort = "bullet"
    custom_ead: Optional[List[float]] = None
    discount_rate_pct: float = Field(6.0, ge=0, le=50)
    multiplier_override: Optional[float] = Field(None, ge=0, le=10, description="Override the documented sector multiplier")
    include_all_scenarios: bool = Field(True, description="Also return lifetime EL under all six NGFS scenarios")


class PcafExposure(BaseModel):
    name: str
    sector: str = "Other"
    outstanding_m: float = Field(..., gt=0)
    evic_m: Optional[float] = Field(None, gt=0, description="Enterprise value incl. cash (listed) — PCAF option 1a")
    total_equity_debt_m: Optional[float] = Field(None, gt=0, description="Total equity + debt (unlisted) — PCAF option 1b")
    revenue_m: Optional[float] = Field(None, gt=0)
    emissions_tco2: float = Field(..., ge=0, description="Borrower scope 1+2, tCO2e/yr")
    scope3_tco2: Optional[float] = Field(None, ge=0)
    data_quality: int = Field(3, ge=1, le=5, description="PCAF score 1 (best) - 5 (worst)")
    itr_c: Optional[float] = Field(None, ge=0.5, le=6, description="Borrower ITR °C; sector default proxy if omitted")


class PcafRequest(BaseModel):
    exposures: List[PcafExposure]
    attribution_basis: Literal["evic", "total_equity_debt"] = "evic"


class SllTerms(BaseModel):
    step_up_bps: float = Field(25.0, ge=0)
    step_down_bps: float = Field(10.0, ge=0)
    prob_meet: float = Field(0.6, ge=0, le=1, description="Annual probability the KPI target is met")
    kpi_baseline: float = Field(400.0, description="e.g. tCO2e/GWh today")
    kpi_target_reduction_pct_pa: float = Field(5.0, description="Target trajectory, %/yr reduction")
    kpi_projected_reduction_pct_pa: float = Field(3.5, description="Borrower plan, %/yr reduction")


class PricingRequest(BaseModel):
    rating: str = "BBB"
    sector: str = "Gas CCGT (transition)"
    ead: float = Field(420.0, gt=0)
    tenor_years: int = Field(10, ge=1, le=MAX_YEARS)
    lgd_pct: float = Field(45.0, ge=0, le=100)
    margin_bps: float = Field(250.0)
    opex_bps: float = Field(60.0, ge=0)
    cap_ratio_pct: float = Field(10.5, gt=0)
    hurdle_pct: float = Field(12.0, gt=0)
    risk_weight: Optional[float] = Field(None, gt=0, description="Live IRB RW if available; SA table otherwise")
    amortization: Amort = "bullet"
    custom_ead: Optional[List[float]] = None
    discount_rate_pct: float = Field(6.0, ge=0, le=50)
    scenario_probs: Dict[str, float] = Field(
        default_factory=lambda: {"net_zero_2050": 0.25, "below_2c": 0.20, "delayed_transition": 0.20,
                                 "fragmented_world": 0.10, "ndcs": 0.15, "current_policies": 0.10},
        description="User scenario weights — must sum to 1 (±0.01)")
    horizon_year: int = Field(2035, description="NGFS carbon-price horizon for the carbon-cost panel")
    emissions_tco2: float = Field(180000.0, ge=0, description="Borrower scope 1+2, tCO2e/yr")
    ebitda_m: float = Field(65.0, gt=0)
    interest_m: float = Field(21.0, gt=0)
    carbon_cost_absorption: float = Field(0.6, ge=0, le=1, description="Share of carbon cost NOT passed to customers")
    current_carbon_cost_usd_t: float = Field(0.0, ge=0, description="Carbon price already paid today, $/t")
    green_rw_factor_pct: float = Field(25.0, ge=0, le=75, description="Supporting/penalizing factor half-width, ±%")
    sll: SllTerms = Field(default_factory=SllTerms)


class PortfolioBorrower(BaseModel):
    name: str
    sector: str = "Other"
    rating: str = "BBB"
    ead_m: float = Field(..., gt=0)
    margin_bps: float = 250.0
    lgd_pct: float = Field(45.0, ge=0, le=100)
    tenor_years: int = Field(7, ge=1, le=MAX_YEARS)
    revenue_m: Optional[float] = Field(None, gt=0)
    evic_m: Optional[float] = Field(None, gt=0)
    emissions_tco2: float = Field(0.0, ge=0)
    data_quality: int = Field(3, ge=1, le=5)
    itr_c: Optional[float] = None


class PortfolioRequest(BaseModel):
    borrowers: List[PortfolioBorrower]
    opex_bps: float = Field(60.0, ge=0)
    cap_ratio_pct: float = Field(10.5, gt=0)
    hurdle_pct: float = Field(12.0, gt=0)
    discount_rate_pct: float = Field(6.0, ge=0, le=50)


# ─────────────────────────────────────────────────────────────────────────────
# Reference endpoints
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/ref/pd-term-structure", summary="Hand-authored cumulative PD curves 1-10y per rating")
def ref_pd_term_structure():
    curves = {}
    for r in NON_DEFAULT:
        cum = cum_pd_curve(r)
        curves[r] = {
            "cumulative_pd_pct": [round(c * 100, 4) for c in cum],
            "marginal_pd_pct": [round((cum[t] - (cum[t - 1] if t else 0.0)) * 100, 4) for t in range(len(cum))],
        }
    return {
        "basis": "Hand-authored approximation of S&P Global 'Default, Transition and Recovery' 1981-2023 "
                 "global corporate cumulative default rates; anchors at years 1/3/5/7/10, linear interpolation "
                 "in between. APPROXIMATE — refresh from the published study for production.",
        "anchor_years": PD_ANCHOR_YEARS, "anchors_pct": CUM_PD_ANCHORS_PCT,
        "years": list(range(1, MAX_YEARS + 1)), "curves": curves,
    }


@router.get("/ref/transition-matrix", summary="Baseline annual rating-migration matrix (hand-authored)")
def ref_transition_matrix():
    base = baseline_matrix()
    return {
        "basis": "Hand-authored approximation of the S&P Global 1981-2023 NR-adjusted global corporate average "
                 "one-year transition matrix; default column matches this desk's 1-yr PD ladder exactly. "
                 "APPROXIMATE — refresh from the published study for production.",
        "ratings": RATINGS,
        "matrix_pct": [[round(c * 100, 4) for c in row] for row in base],
        "row_sums": [round(sum(row), 12) for row in base],
    }


@router.get("/ref/climate-multipliers", summary="NGFS scenario x sector downgrade-intensity multipliers")
def ref_climate_multipliers():
    table = {sid: {sector: CLASS_MULTIPLIERS[sid][cls] for sector, cls in SECTOR_CLASS.items()}
             for sid in SCENARIO_IDS}
    return {
        "basis": "Hand-authored judgment overlay in the spirit of NGFS/ECB climate stress-test practice: the "
                 "multiplier scales every downgrade probability (incl. default) in the migration-matrix row; the "
                 "diagonal absorbs the difference (row re-normalized). >1 raises downgrade intensity; <1 is an "
                 "orderly-transition tailwind for green generators. Editable via multiplier_override.",
        "scenario_ids": SCENARIO_IDS, "sector_class": SECTOR_CLASS,
        "class_multipliers": CLASS_MULTIPLIERS, "sector_multipliers": table,
        "pcaf_dq_ladder": PCAF_DQ_LADDER, "sector_itr_defaults": SECTOR_ITR_DEFAULT,
        "sa_rw_by_rating": SA_RW_BY_RATING,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 1) PD term structure & multi-period EL (IFRS 9 stage 1 vs stage 2)
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/lifetime-el", summary="Multi-period EL: 12-month vs lifetime ECL (IFRS 9-style)")
def lifetime_el(req: LifetimeElRequest):
    if req.rating not in CUM_PD_ANCHORS_PCT:
        raise HTTPException(status_code=422, detail=f"Unknown rating '{req.rating}'. Valid: {NON_DEFAULT}")
    lgd, rate = req.lgd_pct / 100, req.discount_rate_pct / 100
    cum = cum_pd_curve(req.rating, req.tenor_years)
    marginals = [cum[t] - (cum[t - 1] if t else 0.0) for t in range(len(cum))]
    eads = ead_profile(req.ead, req.tenor_years, req.amortization, req.custom_ead)
    rows = lifetime_el_rows(marginals, lgd, eads, rate)
    ecl_12m = rows[0]["el"]
    ecl_lifetime = sum(r["el"] for r in rows)
    return {
        "inputs": req.model_dump(),
        "term_structure": rows,
        "ecl_12m": ecl_12m,
        "ecl_lifetime": ecl_lifetime,
        "lifetime_to_12m_ratio": (ecl_lifetime / ecl_12m) if ecl_12m > 0 else None,
        "methodology": "IFRS 9-style: stage-1 ECL = year-1 marginal PD x LGD x EAD_1 x DF(0.5); stage-2 lifetime "
                       "ECL = sum over the remaining tenor of marginal PD_t x LGD x EAD_t x DF(t-0.5), mid-year "
                       "discounting at the effective interest rate. Cumulative PD curve: hand-authored S&P-study "
                       "approximation (see /ref/pd-term-structure). EAD profile: " + req.amortization + ".",
    }


# ─────────────────────────────────────────────────────────────────────────────
# 2) Climate-adjusted transition matrix (the analytical core)
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/climate-matrix", summary="Climate-stressed migration matrix + rating-distribution evolution")
def climate_matrix(req: ClimateMatrixRequest):
    if req.rating not in CUM_PD_ANCHORS_PCT:
        raise HTTPException(status_code=422, detail=f"Unknown rating '{req.rating}'. Valid: {NON_DEFAULT}")
    mult = req.multiplier_override if req.multiplier_override is not None else sector_multiplier(req.scenario, req.sector)
    lgd, rate = req.lgd_pct / 100, req.discount_rate_pct / 100
    eads = ead_profile(req.ead, req.years, req.amortization, req.custom_ead)

    base = [list(r) for r in baseline_matrix()]
    stressed = stress_matrix(mult)
    base_res = matrix_lifetime_el(base, req.rating, lgd, eads, rate)
    stress_res = matrix_lifetime_el(stressed, req.rating, lgd, eads, rate)

    start_idx = RATINGS.index(req.rating)

    def downgrade_prob(path: List[List[float]], year: int) -> float:
        """P(rating worse than start, incl. default) at the given year."""
        v = path[min(year, len(path)) - 1]
        return sum(v[j] for j in range(start_idx + 1, len(RATINGS)))

    evolution = []
    for t in range(req.years):
        evolution.append({
            "year": t + 1,
            "baseline": {RATINGS[j]: base_res["distribution_path"][t][j] for j in range(len(RATINGS))},
            "stressed": {RATINGS[j]: stress_res["distribution_path"][t][j] for j in range(len(RATINGS))},
        })

    all_scen = None
    if req.include_all_scenarios:
        all_scen = []
        for sid in SCENARIO_IDS:
            sm = sector_multiplier(sid, req.sector)
            res = matrix_lifetime_el(stress_matrix(sm), req.rating, lgd, eads, rate)
            all_scen.append({"scenario": sid, "multiplier": sm,
                             "cumulative_pd_pct": res["cumulative_pd_pct"],
                             "lifetime_el": res["lifetime_el"],
                             "annualized_el_bps": res["annualized_el_bps"]})

    y5 = min(5, req.years)
    return {
        "scenario": req.scenario, "sector": req.sector,
        "sector_class": SECTOR_CLASS.get(req.sector, "neutral"), "multiplier": mult,
        "ratings": RATINGS,
        "baseline_matrix_pct": [[c * 100 for c in row] for row in base],
        "stressed_matrix_pct": [[c * 100 for c in row] for row in stressed],
        "stressed_row_sums": [sum(row) for row in stressed],
        "evolution": evolution,
        "downgrade_prob": {
            "horizon_years": y5,
            "baseline_pct": downgrade_prob(base_res["distribution_path"], y5) * 100,
            "stressed_pct": downgrade_prob(stress_res["distribution_path"], y5) * 100,
        },
        "lifetime_el": {
            "baseline": {k: base_res[k] for k in ("lifetime_el", "cumulative_pd_pct", "annualized_el_bps")},
            "stressed": {k: stress_res[k] for k in ("lifetime_el", "cumulative_pd_pct", "annualized_el_bps")},
            "baseline_rows": base_res["rows"], "stressed_rows": stress_res["rows"],
        },
        "all_scenarios": all_scen,
        "methodology": "Stress overlay: downgrade cells x multiplier, diagonal absorbs the difference, rows "
                       "re-normalized (asserted row-stochastic). Evolution: v_t = v_{t-1} @ M applied to the "
                       "one-hot start vector (each v_t asserted to sum to 1). Scenario-conditional lifetime EL "
                       "uses marginal default mass per year with mid-year EIR discounting.",
    }


# ─────────────────────────────────────────────────────────────────────────────
# 3) PCAF financed emissions
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/pcaf", summary="PCAF financed-emissions attribution + data quality + ITR proxy")
def pcaf(req: PcafRequest):
    if not req.exposures:
        raise HTTPException(status_code=422, detail="At least one exposure required")
    rows, warnings = [], []
    tot_out = tot_fin12 = tot_fin3 = 0.0
    waci_num = dq_num = itr_num = 0.0
    waci_den = 0.0
    for e in req.exposures:
        denom = e.evic_m if req.attribution_basis == "evic" else e.total_equity_debt_m
        basis_used = req.attribution_basis
        if denom is None:  # fall back to the other basis if supplied
            denom = e.total_equity_debt_m if req.attribution_basis == "evic" else e.evic_m
            basis_used = "total_equity_debt" if req.attribution_basis == "evic" else "evic"
            if denom is None:
                raise HTTPException(status_code=422, detail=f"{e.name}: supply evic_m or total_equity_debt_m")
            warnings.append(f"{e.name}: {req.attribution_basis} missing — used {basis_used}")
        af = min(e.outstanding_m / denom, 1.0)
        fin12 = af * e.emissions_tco2
        fin3 = af * e.scope3_tco2 if e.scope3_tco2 is not None else None
        # PCAF check: attributed = attribution factor x borrower total (asserted)
        assert abs(fin12 - af * e.emissions_tco2) < 1e-9
        itr = e.itr_c if e.itr_c is not None else SECTOR_ITR_DEFAULT.get(e.sector, SECTOR_ITR_DEFAULT["Other"])
        rows.append({
            "name": e.name, "sector": e.sector, "outstanding_m": e.outstanding_m,
            "attribution_basis": basis_used, "attribution_denominator_m": denom,
            "attribution_factor": af, "financed_scope12_tco2": fin12, "financed_scope3_tco2": fin3,
            "intensity_tco2_per_outstanding_m": fin12 / e.outstanding_m if e.outstanding_m > 0 else None,
            "revenue_intensity_tco2_per_m": (e.emissions_tco2 / e.revenue_m) if e.revenue_m else None,
            "data_quality": e.data_quality, "data_quality_criteria": PCAF_DQ_LADDER[e.data_quality],
            "itr_c": itr, "itr_source": "borrower" if e.itr_c is not None else "sector default proxy (hand-authored)",
        })
        tot_out += e.outstanding_m
        tot_fin12 += fin12
        if fin3 is not None:
            tot_fin3 += fin3
        if e.revenue_m:
            waci_num += e.outstanding_m * (e.emissions_tco2 / e.revenue_m)
            waci_den += e.outstanding_m
        dq_num += e.outstanding_m * e.data_quality
        itr_num += e.outstanding_m * itr
    return {
        "attribution_basis": req.attribution_basis, "warnings": warnings, "exposures": rows,
        "portfolio": {
            "total_outstanding_m": tot_out,
            "financed_scope12_tco2": tot_fin12,
            "financed_scope3_tco2": tot_fin3 if tot_fin3 > 0 else None,
            "intensity_tco2_per_outstanding_m": tot_fin12 / tot_out if tot_out > 0 else None,
            "waci_tco2_per_revenue_m": waci_num / waci_den if waci_den > 0 else None,
            "weighted_data_quality": dq_num / tot_out if tot_out > 0 else None,
            "weighted_itr_c": itr_num / tot_out if tot_out > 0 else None,
        },
        "pcaf_dq_ladder": PCAF_DQ_LADDER,
        "methodology": "PCAF Global GHG Standard Part A (business loans): attribution factor = outstanding / EVIC "
                       "(listed, option 1a) or outstanding / (total equity + debt) (unlisted, option 1b), capped at "
                       "1. Financed emissions = factor x borrower emissions (checked per borrower). WACI = "
                       "outstanding-weighted (scope1+2 / revenue). ITR: borrower value if supplied, else hand-"
                       "authored sector proxy (labeled). Weighted DQ = outstanding-weighted PCAF score.",
    }


# ─────────────────────────────────────────────────────────────────────────────
# 4) Sustainability-adjusted pricing lab
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/pricing", summary="Climate-adjusted RAROC, carbon-cost margin erosion, green RW panel, SLL ratchet")
def pricing(req: PricingRequest):
    if req.rating not in CUM_PD_ANCHORS_PCT:
        raise HTTPException(status_code=422, detail=f"Unknown rating '{req.rating}'. Valid: {NON_DEFAULT}")
    psum = sum(req.scenario_probs.values())
    if abs(psum - 1.0) > 0.01:
        raise HTTPException(status_code=422, detail=f"scenario_probs must sum to 1 (got {psum:.4f})")
    unknown = [s for s in req.scenario_probs if s not in SCENARIO_IDS]
    if unknown:
        raise HTTPException(status_code=422, detail=f"Unknown scenarios {unknown}. Valid: {SCENARIO_IDS}")

    lgd, rate = req.lgd_pct / 100, req.discount_rate_pct / 100
    cap_ratio, hurdle = req.cap_ratio_pct / 100, req.hurdle_pct / 100
    rw = req.risk_weight if req.risk_weight is not None else sa_risk_weight(req.rating)
    rw_source = "caller (live IRB engine)" if req.risk_weight is not None else "SA table by rating (CRE20.16, hand-transcribed)"
    eads = ead_profile(req.ead, req.tenor_years, req.amortization, req.custom_ead)

    # Base: annualized baseline-matrix lifetime EL (same convention as climate side)
    base_matrix = [list(r) for r in baseline_matrix()]
    base_res = matrix_lifetime_el(base_matrix, req.rating, lgd, eads, rate)
    base_el_bps = base_res["annualized_el_bps"]
    base = raroc_calc(rw, req.ead, req.margin_bps, base_el_bps, req.opex_bps, cap_ratio, hurdle)

    # Climate-adjusted RAROC: scenario-probability-weighted annualized EL
    scen_rows, weighted_el_bps = [], 0.0
    for sid in SCENARIO_IDS:
        p = req.scenario_probs.get(sid, 0.0)
        mult = sector_multiplier(sid, req.sector)
        res = matrix_lifetime_el(stress_matrix(mult), req.rating, lgd, eads, rate)
        weighted_el_bps += p * res["annualized_el_bps"]
        scen_rows.append({"scenario": sid, "prob": p, "multiplier": mult,
                          "annualized_el_bps": res["annualized_el_bps"],
                          "lifetime_el": res["lifetime_el"],
                          "cumulative_pd_pct": res["cumulative_pd_pct"]})
    climate = raroc_calc(rw, req.ead, req.margin_bps, weighted_el_bps, req.opex_bps, cap_ratio, hurdle)

    # Carbon-cost-adjusted margin: NGFS scenario carbon price at the horizon
    carbon_prices = _ngfs_carbon_prices()
    ladder = list(CUM_PD_ANCHORS_PCT.keys())
    r_idx = ladder.index(req.rating)
    carbon_rows = []
    for sid in SCENARIO_IDS:
        p_scen = carbon_prices.get(sid, {}).get(req.horizon_year)
        if p_scen is None:
            carbon_rows.append({"scenario": sid, "carbon_price_usd_t": None,
                                "note": f"No NGFS carbon price for {req.horizon_year}"})
            continue
        incr_price = max(p_scen - req.current_carbon_cost_usd_t, 0.0)
        cost_m = req.emissions_tco2 * incr_price * req.carbon_cost_absorption / 1e6
        erosion_bps = cost_m / req.ead * 1e4 if req.ead > 0 else 0.0
        icr_base = req.ebitda_m / req.interest_m
        icr_adj = max(req.ebitda_m - cost_m, 0.0) / req.interest_m
        # Documented coverage->rating elasticity: 1 notch down per 20% relative
        # ICR deterioration, capped at 4 notches (hand-authored approximation
        # of agency coverage-band medians).
        rel_drop = 1.0 - (icr_adj / icr_base) if icr_base > 0 else 0.0
        notches = min(int(rel_drop / 0.20), 4)
        adj_rating = ladder[min(r_idx + notches, len(ladder) - 1)]
        carbon_rows.append({
            "scenario": sid, "carbon_price_usd_t": p_scen,
            "incremental_price_usd_t": incr_price, "absorbed_carbon_cost_m": cost_m,
            "margin_erosion_bps": erosion_bps,
            "icr_base": icr_base, "icr_adjusted": icr_adj, "icr_rel_drop_pct": rel_drop * 100,
            "notches_down": notches, "adjusted_rating": adj_rating,
            "adjusted_pd_1y_pct": CUM_PD_ANCHORS_PCT[adj_rating][0],
            "effective_margin_bps": req.margin_bps - erosion_bps,
        })

    # Green supporting / penalizing risk-weight sensitivity panel
    f = req.green_rw_factor_pct / 100
    rw_panel = []
    for label, factor in [("penalizing +", 1 + f), ("current", 1.0), ("supporting -", 1 - f)]:
        rr = raroc_calc(rw * factor, req.ead, req.margin_bps, base_el_bps, req.opex_bps, cap_ratio, hurdle)
        rw_panel.append({"case": f"{label}{abs(req.green_rw_factor_pct):.0f}%" if label != "current" else "current",
                         "rw_factor": factor, "risk_weight": rw * factor,
                         "capital": rr["capital"], "raroc_pct": rr["raroc_pct"], "floor_bps": rr["floor_bps"]})

    # SLL margin-ratchet valuation (deterministic expected path)
    s = req.sll
    kpi_target, kpi_proj, sll_rows, pv = [], [], [], 0.0
    for t in range(1, req.tenor_years + 1):
        tgt = s.kpi_baseline * (1 - s.kpi_target_reduction_pct_pa / 100) ** t
        prj = s.kpi_baseline * (1 - s.kpi_projected_reduction_pct_pa / 100) ** t
        exp_adj = s.prob_meet * (-s.step_down_bps) + (1 - s.prob_meet) * s.step_up_bps
        df = (1.0 + rate) ** -(t - 0.5)
        cash = exp_adj / 1e4 * eads[t - 1] * df
        pv += cash
        kpi_target.append(tgt)
        kpi_proj.append(prj)
        sll_rows.append({"year": t, "kpi_target": tgt, "kpi_projected": prj,
                         "on_track": prj <= tgt, "expected_adjustment_bps": exp_adj,
                         "expected_margin_bps": req.margin_bps + exp_adj, "pv_contribution_m": cash})

    return {
        "risk_weight": rw, "risk_weight_source": rw_source,
        "base": {"annualized_el_bps": base_el_bps, **base},
        "climate_adjusted": {"scenario_rows": scen_rows, "weighted_el_bps": weighted_el_bps, **climate,
                             "raroc_delta_pct": (climate["raroc_pct"] - base["raroc_pct"])
                             if climate["raroc_pct"] is not None and base["raroc_pct"] is not None else None},
        "carbon_margin": {
            "horizon_year": req.horizon_year, "rows": carbon_rows,
            "ngfs_source": "Seeded NGFS Phase 5 extract (IIASA Scenario Explorer, CC BY 4.0) — approximate, labeled",
            "methodology": "Absorbed carbon cost = emissions x max(P_scenario - P_today, 0) x absorption share. "
                           "Margin erosion = cost / EAD. Coverage link: ICR' = (EBITDA - cost) / interest; "
                           "1 notch down per 20% relative ICR deterioration, capped at 4 (hand-authored).",
        },
        "green_rw_panel": {
            "rows": rw_panel,
            "framing": "POLICY-DEBATE WHAT-IF, not current law: EU green supporting factor / fossil penalizing "
                       "factor proposals would scale the risk weight by the shown factor. Labeled sensitivity only.",
        },
        "sll_ratchet": {
            "terms": s.model_dump(), "rows": sll_rows, "pv_expected_ratchet_m": pv,
            "methodology": "Expected annual adjustment = p_meet x (-step_down) + (1-p_meet) x step_up, applied to "
                           "the EAD profile and discounted mid-year at the EIR. Positive PV = expected extra "
                           "margin income to the lender (borrower off-track).",
        },
        "methodology": "Base and climate RAROC use the same annualized-lifetime-EL convention (baseline vs "
                       "scenario-probability-weighted stressed matrices) so the climate delta isolates the "
                       "transition-risk effect. RAROC = (margin - EL - opex) x EAD / (RW x EAD x capital ratio).",
    }


# ─────────────────────────────────────────────────────────────────────────────
# 5) Portfolio mode + TCFD/ISSB disclosure metrics
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/portfolio", summary="Book-level EL / RAROC / financed emissions + scenario EL + OLS + disclosure")
def portfolio(req: PortfolioRequest):
    if not req.borrowers:
        raise HTTPException(status_code=422, detail="At least one borrower required")
    cap_ratio, hurdle, rate = req.cap_ratio_pct / 100, req.hurdle_pct / 100, req.discount_rate_pct / 100

    per, tot_ead = [], 0.0
    tot_el1 = tot_capital = tot_net = tot_fin = 0.0
    waci_num = waci_den = dq_num = itr_num = 0.0
    sector_ead: Dict[str, float] = {}
    rating_ead: Dict[str, float] = {}
    fossil_ead = 0.0
    scen_book: Dict[str, float] = {sid: 0.0 for sid in SCENARIO_IDS}
    base_book_el = 0.0
    base_matrix = [list(r) for r in baseline_matrix()]

    for b in req.borrowers:
        if b.rating not in CUM_PD_ANCHORS_PCT:
            raise HTTPException(status_code=422, detail=f"{b.name}: unknown rating '{b.rating}'")
        lgd = b.lgd_pct / 100
        pd1 = CUM_PD_ANCHORS_PCT[b.rating][0] / 100
        el1 = pd1 * lgd * b.ead_m
        el_bps = el1 / b.ead_m * 1e4
        rw = sa_risk_weight(b.rating)
        rr = raroc_calc(rw, b.ead_m, b.margin_bps, el_bps, req.opex_bps, cap_ratio, hurdle)
        eads = ead_profile(b.ead_m, b.tenor_years, "bullet", None)
        base_res = matrix_lifetime_el(base_matrix, b.rating, lgd, eads, rate)
        base_book_el += base_res["lifetime_el"]
        scen_el = {}
        for sid in SCENARIO_IDS:
            mult = sector_multiplier(sid, b.sector)
            res = matrix_lifetime_el(stress_matrix(mult), b.rating, lgd, eads, rate)
            scen_el[sid] = res["lifetime_el"]
            scen_book[sid] += res["lifetime_el"]
        # Financed emissions (PCAF option 1a/1b; EVIC fallback = EAD x 2 proxy, labeled)
        denom = b.evic_m if b.evic_m else b.ead_m * 2.0
        af = min(b.ead_m / denom, 1.0)
        fin = af * b.emissions_tco2
        itr = b.itr_c if b.itr_c is not None else SECTOR_ITR_DEFAULT.get(b.sector, SECTOR_ITR_DEFAULT["Other"])
        cls = SECTOR_CLASS.get(b.sector, "neutral")
        per.append({
            "name": b.name, "sector": b.sector, "sector_class": cls, "rating": b.rating,
            "ead_m": b.ead_m, "margin_bps": b.margin_bps, "pd_1y_pct": pd1 * 100, "el_1y_m": el1,
            "el_bps": el_bps, "risk_weight_sa": rw, "capital_m": rr["capital"], "raroc_pct": rr["raroc_pct"],
            "lifetime_el_baseline_m": base_res["lifetime_el"], "scenario_lifetime_el_m": scen_el,
            "attribution_factor": af,
            "attribution_note": "outstanding / EVIC" if b.evic_m else "EVIC missing — proxy denom = 2 x EAD (labeled)",
            "financed_scope12_tco2": fin,
            "intensity_tco2_per_ead_m": fin / b.ead_m if b.ead_m > 0 else None,
            "itr_c": itr, "data_quality": b.data_quality,
        })
        tot_ead += b.ead_m
        tot_el1 += el1
        tot_capital += rr["capital"]
        tot_net += rr["net_income"]
        tot_fin += fin
        sector_ead[b.sector] = sector_ead.get(b.sector, 0.0) + b.ead_m
        rating_ead[b.rating] = rating_ead.get(b.rating, 0.0) + b.ead_m
        if cls in FOSSIL_CLASSES:
            fossil_ead += b.ead_m
        if b.revenue_m:
            waci_num += b.ead_m * (b.emissions_tco2 / b.revenue_m)
            waci_den += b.ead_m
        dq_num += b.ead_m * b.data_quality
        itr_num += b.ead_m * itr

    # OLS: margin (bps) on financed-emissions intensity (tCO2e per $M EAD).
    pts = [(p["intensity_tco2_per_ead_m"], p["margin_bps"], p["name"]) for p in per
           if p["intensity_tco2_per_ead_m"] is not None]
    ols = None
    if len(pts) >= 3:
        xs, ys = [p[0] for p in pts], [p[1] for p in pts]
        n = len(xs)
        mx, my = sum(xs) / n, sum(ys) / n
        sxx = sum((x - mx) ** 2 for x in xs)
        sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
        syy = sum((y - my) ** 2 for y in ys)
        if sxx > 1e-12 and syy > 1e-12:
            slope = sxy / sxx
            intercept = my - slope * mx
            r2 = (sxy * sxy) / (sxx * syy)
            ols = {"n": n, "slope_bps_per_tco2_ead_m": slope, "intercept_bps": intercept, "r2": r2,
                   "points": [{"name": nm, "intensity": x, "margin_bps": y} for x, y, nm in pts],
                   "fit_line": [{"intensity": min(xs), "margin_bps": intercept + slope * min(xs)},
                                {"intensity": max(xs), "margin_bps": intercept + slope * max(xs)}],
                   "interpretation": "Positive slope with meaningful R² = the book prices transition risk "
                                     "(dirtier borrowers pay more); flat/negative = mispricing candidate."}

    hhi = lambda d: sum((v / tot_ead) ** 2 for v in d.values()) if tot_ead > 0 else None  # noqa: E731
    scen_rows = [{"scenario": sid, "book_lifetime_el_m": scen_book[sid],
                  "delta_vs_baseline_m": scen_book[sid] - base_book_el,
                  "el_pct_of_ead": scen_book[sid] / tot_ead * 100 if tot_ead > 0 else None}
                 for sid in SCENARIO_IDS]
    el_vals = [r["book_lifetime_el_m"] for r in scen_rows]
    return {
        "per_borrower": per,
        "book": {
            "n_borrowers": len(per), "total_ead_m": tot_ead, "el_1y_m": tot_el1,
            "el_1y_bps": tot_el1 / tot_ead * 1e4 if tot_ead > 0 else None,
            "capital_m": tot_capital, "net_income_m": tot_net,
            "raroc_pct": tot_net / tot_capital * 100 if tot_capital > 0 else None,
            "baseline_lifetime_el_m": base_book_el,
            "financed_scope12_tco2": tot_fin,
            "intensity_tco2_per_ead_m": tot_fin / tot_ead if tot_ead > 0 else None,
            "waci_tco2_per_revenue_m": waci_num / waci_den if waci_den > 0 else None,
            "weighted_data_quality": dq_num / tot_ead if tot_ead > 0 else None,
            "weighted_itr_c": itr_num / tot_ead if tot_ead > 0 else None,
            "hhi_sector": hhi(sector_ead), "hhi_rating": hhi(rating_ead),
            "sector_breakdown": [{"sector": k, "ead_m": v, "share_pct": v / tot_ead * 100} for k, v in sorted(sector_ead.items(), key=lambda kv: -kv[1])],
            "rating_breakdown": [{"rating": k, "ead_m": v, "share_pct": v / tot_ead * 100} for k, v in sorted(rating_ead.items(), key=lambda kv: RATINGS.index(kv[0]))],
        },
        "scenario_book_el": scen_rows,
        "ols_intensity_vs_margin": ols,
        "disclosure": {
            "standard_note": "TCFD Metrics & Targets / ISSB IFRS S2 style panel — auto-computed from the book. "
                             "Financed emissions = borrower scope 1+2 attributed per PCAF (scope 3 not included "
                             "here; disclose separately with double-counting caveats).",
            "financed_scope12_tco2": tot_fin,
            "financed_intensity_tco2_per_ead_m": tot_fin / tot_ead if tot_ead > 0 else None,
            "waci_tco2_per_revenue_m": waci_num / waci_den if waci_den > 0 else None,
            "weighted_itr_c": itr_num / tot_ead if tot_ead > 0 else None,
            "weighted_pcaf_dq": dq_num / tot_ead if tot_ead > 0 else None,
            "carbon_related_assets_pct": fossil_ead / tot_ead * 100 if tot_ead > 0 else None,
            "carbon_related_definition": "EAD in fossil / fossil_high climate classes (TCFD 'carbon-related assets' proxy)",
            "climate_var_proxy": {
                "definition": "Scenario lifetime-EL range across the six NGFS scenarios (max - min), a labeled "
                              "climate-VaR proxy — not a distributional VaR.",
                "min_el_m": min(el_vals), "max_el_m": max(el_vals),
                "range_m": max(el_vals) - min(el_vals),
                "range_pct_of_ead": (max(el_vals) - min(el_vals)) / tot_ead * 100 if tot_ead > 0 else None,
            },
        },
        "methodology": "Per-borrower: 1-yr EL from the PD ladder; RAROC on the SA risk-weight table (CRE20.16) — "
                       "book RAROC = sum(net income) / sum(capital). Scenario book EL = sum of borrower lifetime "
                       "ELs under each scenario-stressed migration matrix (bullet EAD, EIR-discounted). OLS: "
                       "margin_bps ~ financed-emissions intensity. HHI on EAD shares.",
    }
