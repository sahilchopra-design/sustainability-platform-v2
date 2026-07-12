"""
PF Credit Rating Engine — agency-methodology-style project finance scorecard
============================================================================
Prefix: /api/v1/pf-rating
Tags:   PF Credit Rating

Scorecard (NEXT_USE_CASES_2.md row #9): construction/operation phase risk,
resource risk (P90/P50 spread), revenue contract quality (contracted share +
offtaker rating), financial structure (min DSCR, gearing, DSRA, sweep),
counterparty/contractor, country — weighted 0-100 score mapped to an
indicative rating notch and a PD term structure.

Methodology — legacy flat scorecard (kept bit-identical for old payloads)
-------------------------------------------------------------------------
1.  Each factor is scored 0-100 via documented knot tables (piecewise-linear
    interpolation for continuous inputs, lookup for categorical inputs).
2.  Weighted score = sum(weight_i * factor_score_i); weights sum to 1.0 and
    are exposed at GET /ref/scorecard.
3.  Score -> rating notch via the documented band map (~6 points per notch,
    anchored so that 60 = BBB- investment-grade floor, consistent with the
    project-finance market where most rated deals cluster BBB-/BB+).
4.  Driver decomposition: contribution_i = weight_i * (factor_score_i - 60);
    notches_i = contribution_i / 6. This shows which factor gained/cost
    notches versus the BBB- anchor.
5.  PD mapping: hand-authored cumulative default-probability table per rating
    notch (1y / 5y / 10y). INDICATIVE, derived from published agency
    project-finance default study aggregates (Moody's "Default and Recovery
    Rates for Project Finance Bank Loans" and S&P annual PF default studies)
    — approximate interpolations, refresh from the studies for production.
6.  Expected loss = PD(horizon) x LGD x exposure. Moody's PF studies report
    ~80% average ultimate recovery on defaulted PF bank loans (LGD ~20-35%
    senior secured); LGD is a user input, default 35%.

Extension modules (v2 — each documented in its own section below)
-----------------------------------------------------------------
FACTOR TREE   Three-level scorecard mirroring the shape of the published
              agency PF methodologies (Moody's "Generic Project Finance",
              S&P "Project Finance Framework" — INTERPRETATION, hand-authored,
              not the agencies' actual tables):
                Level 1  Operations & asset risk (40%) / Financial risk (40%)
                         / Country & system (20%)
                Level 2  Operations: resource risk, technology, opex risk,
                         counterparty/O&M, contract mix.
                         Financial: DSCR level, DSCR volatility, leverage,
                         refinancing risk, structural protections.
                         Country: sovereign tier, legal/PF framework.
                Level 3  Component blends inside contract mix (contracted
                         share 60 / offtaker 40) and structural protections
                         (DSRA 60 / sweep 40).
              All weights are editable per request (weight_overrides, dotted
              paths); sibling groups are re-normalised to sum to 1 and the
              normalised weights are echoed back.
DSCR VOL.     Coefficient of variation of DSCR. Three input routes, first
              available wins: (a) user scalar dscr_cov_pct; (b) P50 DSCR path
              -> CoV_ts = stdev/mean, and if a P90 path is also given the
              implied one-sided sigma = mean((P50-P90)/P50) / 1.2816 (P90 is
              the 1.2816-sigma lower tail under a normal approximation,
              documented) with CoV = max(CoV_ts, implied) — conservative;
              (c) fallback: proxy from the P90/P50 CFADS ratio,
              CoV ≈ (1 - ratio) / 1.2816. Mapped to a 0-100 score via
              KNOTS_DSCR_COV (documented).
NOTCHING      Applied to the TREE rating in a documented order:
                1. Phase: construction -1 (tier-1 fixed-price full wrap)
                   or -2 (any weaker EPC package) — agencies typically rate
                   construction-phase PF 1-2 notches below operating
                   equivalents.
                2. Structural subordination: mezzanine -1 when senior debt
                   ahead < 60% of the stack, -2 when >= 60% (deep
                   subordination).
                3. External support: guarantee uplift 0 / +1 (partial) /
                   +2 (full wrap), CAPPED at the guarantor rating when given.
                4. Cap/floor: net notching clamped to [-3, +2]; final rating
                   clamped to the modelled scale (A ... B-).
ESG OVERLAY   Transition/ESG notching, framed on the agencies' published ESG
              credit-factor approach (Moody's ESG Issuer Profile Scores /
              S&P ESG credit factors) — LABELED INTERPRETATION, monotone in
              carbon intensity percentile:
                penalty (half-notches): pctile <50 -> 0; 50-70 -> 0.5;
                70-85 -> 1.0; 85-95 -> 1.5; >=95 -> 2.0
                mitigants: SBTi-aligned target -0.5; taxonomy-aligned
                revenue >=66% -0.5 (or >=33% -0.25) — larger one applies.
                overlay = -round(max(0, penalty - mitigants)), floored at -2,
                never positive. Rating WITH vs WITHOUT overlay both returned.
PD CURVE      Full 1-10y cumulative PD per rating: log-survival interpolation
              of the hand-authored 1/5/10y anchors (constant hazard between
              anchors: H(t) = -ln(1-PD(t)) linear in t) — LABELED
              interpolation, not published data. Marginal PD_t = cum_t -
              cum_{t-1}; EL profile = cum PD x LGD (x exposure when given).
PEERS         GET /ref/peers — 12 hand-authored, anonymised-but-realistic PF
              credit profiles (sector, contracted %, DSCR, gearing, rating)
              for the frontend scatter benchmark. Illustrative, not real
              transactions.

No PRNG, no fabricated randomness — every number is a documented mapping of
the inputs, and every table is exposed via /ref/scorecard and /ref/peers.
"""
from __future__ import annotations

import copy
import logging
import math
from statistics import mean, pstdev
from typing import Dict, List, Literal, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/pf-rating", tags=["PF Credit Rating"])

# ─────────────────────────────────────────────────────────────────────────────
# Legacy flat scorecard definition (all exposed at /ref/scorecard)
# ─────────────────────────────────────────────────────────────────────────────
WEIGHTS: Dict[str, float] = {
    "phase": 0.10,             # construction vs operation
    "resource_risk": 0.15,     # P90/P50 CFADS (or energy) ratio
    "revenue_contract": 0.25,  # contracted share + offtaker credit quality
    "structure": 0.30,         # min DSCR, gearing, DSRA, cash sweep
    "counterparty": 0.10,      # EPC contractor / O&M operator quality
    "country": 0.10,           # sovereign / jurisdiction tier
}
NEUTRAL_SCORE = 60.0   # BBB- anchor
POINTS_PER_NOTCH = 6.0

# Continuous-factor knot tables (piecewise-linear interpolation, clamped)
KNOTS_P90_P50 = [(0.60, 20.0), (0.70, 35.0), (0.80, 55.0), (0.85, 70.0), (0.90, 85.0), (0.95, 95.0)]
KNOTS_MIN_DSCR = [(1.00, 10.0), (1.05, 30.0), (1.15, 45.0), (1.30, 60.0), (1.50, 75.0), (1.80, 88.0), (2.00, 95.0)]
KNOTS_GEARING = [(50.0, 95.0), (60.0, 90.0), (70.0, 75.0), (75.0, 65.0), (80.0, 50.0), (90.0, 30.0), (95.0, 20.0)]
KNOTS_DSRA = [(0.0, 30.0), (3.0, 55.0), (6.0, 75.0), (12.0, 90.0)]
KNOTS_SWEEP = [(0.0, 50.0), (25.0, 70.0), (50.0, 85.0), (100.0, 92.0)]
KNOTS_CONTRACTED = [(0.0, 30.0), (25.0, 45.0), (50.0, 62.0), (75.0, 78.0), (90.0, 88.0), (100.0, 95.0)]

PHASE_SCORES = {"operation": 85.0, "construction": 50.0}
OFFTAKER_SCORES = {"AAA": 95.0, "AA": 90.0, "A": 80.0, "BBB": 65.0, "BB": 45.0, "B": 30.0, "NR": 40.0}
CONTRACTOR_SCORES = {
    "tier1_fixed_price_wrap": 88.0,   # tier-1 EPC, fixed-price date-certain full wrap / proven O&M major
    "tier1_unwrapped": 72.0,
    "tier2_wrapped": 62.0,
    "tier2_unwrapped": 45.0,
    "unproven": 28.0,
}
COUNTRY_SCORES = {"aaa_aa": 90.0, "a": 75.0, "bbb": 60.0, "bb": 42.0, "b_or_below": 25.0}

# Revenue factor internal blend
REVENUE_BLEND = {"contracted_share": 0.60, "offtaker_quality": 0.40}
# Structure factor internal blend
STRUCTURE_BLEND = {"min_dscr": 0.50, "gearing": 0.25, "dsra": 0.15, "sweep": 0.10}

# Score -> indicative rating (descending bands, ~6 pts/notch, 60 = BBB-)
RATING_BANDS = [
    (90.0, "A"), (84.0, "A-"), (78.0, "BBB+"), (72.0, "BBB"), (66.0, "BBB-"),
    (60.0, "BB+"), (54.0, "BB"), (48.0, "BB-"), (42.0, "B+"), (36.0, "B"), (0.0, "B-"),
]
# NOTE: band floor semantics — score >= floor maps to that rating; the BBB-
# floor sits at 66 so that the NEUTRAL_SCORE 60 anchor maps to BB+, matching
# the PF market where the median rated deal is crossover BBB-/BB+.

RATING_SCALE = ["A", "A-", "BBB+", "BBB", "BBB-", "BB+", "BB", "BB-", "B+", "B", "B-"]  # index 0 = best

# Cumulative PD per rating notch (%, 1y / 5y / 10y).
# INDICATIVE — hand-authored, derived from Moody's / S&P project-finance
# default study aggregates (approximate; refresh from studies for production).
PD_TABLE: Dict[str, Dict[str, float]] = {
    "A":    {"pd_1y_pct": 0.05, "pd_5y_pct": 0.55, "pd_10y_pct": 1.40},
    "A-":   {"pd_1y_pct": 0.07, "pd_5y_pct": 0.75, "pd_10y_pct": 1.80},
    "BBB+": {"pd_1y_pct": 0.11, "pd_5y_pct": 1.05, "pd_10y_pct": 2.30},
    "BBB":  {"pd_1y_pct": 0.17, "pd_5y_pct": 1.50, "pd_10y_pct": 3.00},
    "BBB-": {"pd_1y_pct": 0.30, "pd_5y_pct": 2.40, "pd_10y_pct": 4.50},
    "BB+":  {"pd_1y_pct": 0.55, "pd_5y_pct": 4.20, "pd_10y_pct": 7.50},
    "BB":   {"pd_1y_pct": 0.95, "pd_5y_pct": 6.50, "pd_10y_pct": 11.00},
    "BB-":  {"pd_1y_pct": 1.60, "pd_5y_pct": 9.50, "pd_10y_pct": 15.00},
    "B+":   {"pd_1y_pct": 2.40, "pd_5y_pct": 12.50, "pd_10y_pct": 19.00},
    "B":    {"pd_1y_pct": 3.20, "pd_5y_pct": 15.50, "pd_10y_pct": 23.00},
    "B-":   {"pd_1y_pct": 4.50, "pd_5y_pct": 20.00, "pd_10y_pct": 28.00},
}
PD_BASIS_NOTE = ("Indicative, derived from Moody's/S&P project-finance default study aggregates "
                 "(Moody's 'Default and Recovery Rates for Project Finance Bank Loans', S&P annual PF "
                 "default studies) — approximate, refresh from the studies for production. Moody's PF "
                 "studies also report ~80% average ultimate recovery on defaulted PF bank loans "
                 "(senior-secured LGD typically 20-35%).")

# ─────────────────────────────────────────────────────────────────────────────
# v2 — factor tree definition (3 levels; all weights editable via
# weight_overrides and re-normalised per sibling group)
# ─────────────────────────────────────────────────────────────────────────────
TECHNOLOGY_SCORES = {
    "proven_conventional": 88.0,      # solar PV / onshore wind / CCGT — long fleet history
    "proven_new_vintage": 72.0,       # proven class, new vintage/scale (large offshore turbine, 8h LFP BESS)
    "limited_track_record": 50.0,     # <5 yrs commercial fleet data (green H2 electrolysis at scale)
    "first_of_a_kind": 28.0,          # FOAK process risk
}
OPEX_RISK_SCORES = {
    "fixed_price_om_contract": 85.0,  # full-scope fixed-price O&M with availability LDs
    "budgeted_with_reserves": 65.0,   # owner-managed budget + maintenance reserve account
    "variable_exposed": 40.0,         # material uncontracted opex exposure (fuel, water, chemicals)
}
LEGAL_FRAMEWORK_SCORES = {
    "mature": 85.0,                   # tested PF/security law, creditor-friendly enforcement
    "developing": 55.0,               # PF precedents exist, enforcement slower/less predictable
    "untested": 30.0,                 # no meaningful PF enforcement precedent
}
KNOTS_REFI_SHARE = [(0.0, 90.0), (20.0, 75.0), (40.0, 60.0), (60.0, 45.0), (80.0, 32.0), (100.0, 22.0)]
# DSCR coefficient of variation, % — documented mapping to 0-100 score
KNOTS_DSCR_COV = [(0.0, 95.0), (5.0, 82.0), (10.0, 68.0), (15.0, 55.0), (20.0, 45.0), (30.0, 32.0), (40.0, 22.0)]

# label + default weight per node; children weights sum to 1 within each group
FACTOR_TREE_DEF: Dict[str, dict] = {
    "operations": {
        "label": "Operations & asset risk", "weight": 0.40,
        "children": {
            "resource_risk":   {"label": "Resource / volume risk (P90/P50)", "weight": 0.25, "basis": "KNOTS_P90_P50"},
            "technology":      {"label": "Technology track record", "weight": 0.20, "basis": "TECHNOLOGY_SCORES lookup"},
            "opex_risk":       {"label": "Opex risk / cost predictability", "weight": 0.15, "basis": "OPEX_RISK_SCORES lookup"},
            "counterparty_om": {"label": "Counterparty — EPC / O&M quality", "weight": 0.20, "basis": "CONTRACTOR_SCORES lookup"},
            "contract_mix":    {"label": "Contract mix & offtake quality", "weight": 0.20,
                                "basis": "blend: contracted share 60% (KNOTS_CONTRACTED) + offtaker 40% (OFFTAKER_SCORES)"},
        },
    },
    "financial": {
        "label": "Financial risk", "weight": 0.40,
        "children": {
            "dscr_level":            {"label": "DSCR level (min)", "weight": 0.35, "basis": "KNOTS_MIN_DSCR"},
            "dscr_volatility":       {"label": "DSCR volatility (CoV)", "weight": 0.15, "basis": "KNOTS_DSCR_COV on CoV%"},
            "leverage":              {"label": "Leverage (gearing)", "weight": 0.20, "basis": "KNOTS_GEARING"},
            "refi_risk":             {"label": "Refinancing risk (bullet/balloon share)", "weight": 0.10, "basis": "KNOTS_REFI_SHARE"},
            "structure_protections": {"label": "Structural protections", "weight": 0.20,
                                      "basis": "blend: DSRA 60% (KNOTS_DSRA) + cash sweep 40% (KNOTS_SWEEP)"},
        },
    },
    "country_system": {
        "label": "Country & system risk", "weight": 0.20,
        "children": {
            "sovereign_tier":  {"label": "Sovereign / jurisdiction tier", "weight": 0.70, "basis": "COUNTRY_SCORES lookup"},
            "legal_framework": {"label": "Legal / PF enforcement framework", "weight": 0.30, "basis": "LEGAL_FRAMEWORK_SCORES lookup"},
        },
    },
}
# Level-3 component blends (weights also visible/editable)
CONTRACT_MIX_BLEND = {"contracted_share": 0.60, "offtaker_quality": 0.40}
PROTECTIONS_BLEND = {"dsra": 0.60, "sweep": 0.40}

TREE_BASIS_NOTE = ("Three-level factor tree mirroring the SHAPE of the published agency PF methodologies "
                   "(Moody's 'Generic Project Finance', S&P 'Project Finance Framework'). Hand-authored "
                   "INTERPRETATION — weights and knot tables are NOT the agencies' actual tables. "
                   "All weights editable per request via weight_overrides; sibling groups re-normalised to 1.")

# Notching rules (documented; applied to the TREE rating in this order)
NOTCHING_RULES = {
    "phase": "construction: -1 with tier-1 fixed-price full wrap, else -2 (operating: 0). Agencies typically "
             "rate construction-phase PF 1-2 notches below operating equivalents.",
    "structural_subordination": "mezzanine: -1 when senior debt ahead < 60% of the debt stack, -2 when >= 60% "
                                "(deep subordination). Senior: 0.",
    "external_support": "guarantee uplift: none 0 / partial +1 / full wrap +2; uplifted rating CAPPED at the "
                        "guarantor rating when provided.",
    "caps_floors": "net notching clamped to [-3, +2]; final rating clamped to the modelled scale (A ... B-).",
}
ESG_OVERLAY_RULES = {
    "carbon_intensity_penalty_half_notches": [
        {"percentile_lt": 50, "penalty": 0.0}, {"percentile_lt": 70, "penalty": 0.5},
        {"percentile_lt": 85, "penalty": 1.0}, {"percentile_lt": 95, "penalty": 1.5},
        {"percentile_lte": 100, "penalty": 2.0},
    ],
    "mitigants_half_notches": {"sbti_aligned_target": 0.5, "taxonomy_revenue_gte_66pct": 0.5, "taxonomy_revenue_gte_33pct": 0.25},
    "rule": "overlay_notches = -round(max(0, penalty - max applicable mitigants)); floor -2, never positive. "
            "Monotone: worse (higher) carbon-intensity percentile can only worsen the overlay.",
    "basis": "Framed on the agencies' published ESG credit-factor approach (Moody's ESG Issuer Profile Scores, "
             "S&P ESG credit factors) — LABELED INTERPRETATION, not the agencies' actual criteria.",
}


def _interp(knots, x: float) -> float:
    """Piecewise-linear interpolation over sorted (x, score) knots, clamped."""
    if x <= knots[0][0]:
        return knots[0][1]
    if x >= knots[-1][0]:
        return knots[-1][1]
    for (x0, y0), (x1, y1) in zip(knots, knots[1:]):
        if x0 <= x <= x1:
            return y0 + (y1 - y0) * (x - x0) / (x1 - x0)
    return knots[-1][1]


def _score_to_rating(score: float) -> str:
    for floor, rating in RATING_BANDS:
        if score >= floor:
            return rating
    return "B-"


def _apply_notches(rating: str, notches: int) -> str:
    """Move a rating by `notches` (negative = down). Clamped to the modelled scale."""
    idx = RATING_SCALE.index(rating)
    return RATING_SCALE[max(0, min(len(RATING_SCALE) - 1, idx - notches))]


def _pd_curve(rating: str) -> List[dict]:
    """1-10y cumulative + marginal PD by log-survival interpolation of the
    1/5/10y anchors (constant hazard between anchors) — LABELED interpolation."""
    row = PD_TABLE[rating]
    h1 = -math.log(max(1e-12, 1.0 - row["pd_1y_pct"] / 100.0))
    h5 = -math.log(max(1e-12, 1.0 - row["pd_5y_pct"] / 100.0))
    h10 = -math.log(max(1e-12, 1.0 - row["pd_10y_pct"] / 100.0))
    curve, prev = [], 0.0
    for t in range(1, 11):
        if t <= 1:
            h = h1 * t
        elif t <= 5:
            h = h1 + (h5 - h1) * (t - 1) / 4.0
        else:
            h = h5 + (h10 - h5) * (t - 5) / 5.0
        cum = (1.0 - math.exp(-h)) * 100.0
        curve.append({"year": t, "cum_pd_pct": round(cum, 4), "marginal_pd_pct": round(cum - prev, 4)})
        prev = cum
    return curve


def _normalized_tree(overrides: Optional[Dict[str, float]]) -> Dict[str, dict]:
    """Apply dotted-path weight overrides ('financial', 'financial.dscr_level')
    then re-normalise each sibling group so weights sum to 1."""
    tree = copy.deepcopy(FACTOR_TREE_DEF)
    if overrides:
        for path, w in overrides.items():
            if w is None or w < 0:
                continue
            parts = path.split(".")
            if len(parts) == 1 and parts[0] in tree:
                tree[parts[0]]["weight"] = float(w)
            elif len(parts) == 2 and parts[0] in tree and parts[1] in tree[parts[0]]["children"]:
                tree[parts[0]]["children"][parts[1]]["weight"] = float(w)
    l1_sum = sum(g["weight"] for g in tree.values())
    for g in tree.values():
        g["weight_normalized"] = (g["weight"] / l1_sum) if l1_sum > 0 else 1.0 / len(tree)
        c_sum = sum(c["weight"] for c in g["children"].values())
        for c in g["children"].values():
            c["weight_normalized"] = (c["weight"] / c_sum) if c_sum > 0 else 1.0 / len(g["children"])
    return tree


# ─────────────────────────────────────────────────────────────────────────────
# Request model (v2 fields all optional — legacy payloads unchanged)
# ─────────────────────────────────────────────────────────────────────────────
class EsgOverlayParams(BaseModel):
    """Transition/ESG notching overlay inputs (documented interpretation of the
    agencies' published ESG credit-factor approach)."""
    carbon_intensity_percentile: float = Field(ge=0, le=100,
                                               description="Deal's carbon-intensity percentile vs its SECTOR "
                                                           "(user input; 0 = cleanest, 100 = most carbon-intensive)")
    sbti_aligned: bool = Field(default=False, description="Sponsor/project has an SBTi-aligned emissions target")
    taxonomy_revenue_pct: float = Field(default=0.0, ge=0, le=100,
                                        description="Share of revenue aligned to a green taxonomy (EU Taxonomy or equivalent), %")


class RateRequest(BaseModel):
    project_name: str = Field(default="Unnamed project", max_length=200)
    phase: Literal["construction", "operation"] = "operation"
    p90_p50_ratio: float = Field(default=0.85, gt=0.3, le=1.0,
                                 description="P90/P50 CFADS (or annual energy) ratio — resource risk")
    contracted_revenue_pct: float = Field(default=80.0, ge=0, le=100, description="Contracted share of revenue, %")
    offtaker_rating: Literal["AAA", "AA", "A", "BBB", "BB", "B", "NR"] = "BBB"
    min_dscr: float = Field(default=1.30, gt=0.5, le=5.0, description="Minimum DSCR (sizing / covenant case)")
    gearing_pct: float = Field(default=75.0, gt=0, le=98, description="Debt / total capitalisation, %")
    dsra_months: float = Field(default=6.0, ge=0, le=24, description="DSRA, months of forward debt service")
    cash_sweep_pct: float = Field(default=0.0, ge=0, le=100, description="Cash sweep, % of excess cash")
    contractor_quality: Literal["tier1_fixed_price_wrap", "tier1_unwrapped", "tier2_wrapped",
                                "tier2_unwrapped", "unproven"] = "tier1_unwrapped"
    country_tier: Literal["aaa_aa", "a", "bbb", "bb", "b_or_below"] = "aaa_aa"
    # EL panel (optional)
    lgd_pct: Optional[float] = Field(default=35.0, ge=0, le=100,
                                     description="Loss given default, % (Moody's PF ultimate recovery ~80% => LGD 20-35% typical)")
    exposure_usd: Optional[float] = Field(default=None, gt=0, description="Exposure at default for EL in USD")

    # ── v2: factor-tree extras ───────────────────────────────────────────────
    technology: Literal["proven_conventional", "proven_new_vintage",
                        "limited_track_record", "first_of_a_kind"] = "proven_conventional"
    opex_risk: Literal["fixed_price_om_contract", "budgeted_with_reserves", "variable_exposed"] = "budgeted_with_reserves"
    legal_framework: Literal["mature", "developing", "untested"] = "mature"
    refi_share_pct: float = Field(default=0.0, ge=0, le=100,
                                  description="Bullet/balloon share of debt at maturity, % (refinancing risk sub-factor)")
    weight_overrides: Optional[Dict[str, float]] = Field(
        default=None,
        description="Editable tree weights, dotted paths: 'operations', 'financial.dscr_level', … "
                    "Sibling groups are re-normalised to sum to 1.")

    # ── v2: DSCR volatility ─────────────────────────────────────────────────
    dscr_p50_path: Optional[List[float]] = Field(default=None, description="Per-period P50 DSCR array (from the debt sizer)")
    dscr_p90_path: Optional[List[float]] = Field(default=None, description="Per-period P90 DSCR array (optional, with P50)")
    dscr_cov_pct: Optional[float] = Field(default=None, ge=0, le=100,
                                          description="Direct DSCR coefficient-of-variation input, % (overrides arrays)")

    # ── v2: notching module ─────────────────────────────────────────────────
    seniority: Literal["senior", "mezzanine"] = "senior"
    subordination_depth_pct: float = Field(default=0.0, ge=0, le=100,
                                           description="Senior debt ahead / total debt stack, % (mezzanine only)")
    guarantee: Literal["none", "partial", "full"] = "none"
    guarantor_rating: Optional[Literal["A", "A-", "BBB+", "BBB", "BBB-", "BB+", "BB", "BB-", "B+", "B", "B-"]] = \
        Field(default=None, description="Caps the support uplift at the guarantor's rating")

    # ── v2: ESG overlay ─────────────────────────────────────────────────────
    esg: Optional[EsgOverlayParams] = None


# ─────────────────────────────────────────────────────────────────────────────
# v2 computation helpers
# ─────────────────────────────────────────────────────────────────────────────
def _dscr_volatility(req: RateRequest) -> dict:
    """CoV of DSCR from (in priority order) direct input, P50/P90 arrays, or a
    documented P90/P50-ratio proxy. Returns CoV %, score, and basis text."""
    if req.dscr_cov_pct is not None:
        cov = req.dscr_cov_pct / 100.0
        basis = "user CoV input"
        detail = None
    elif req.dscr_p50_path and len(req.dscr_p50_path) >= 2 and all(x > 0 for x in req.dscr_p50_path):
        m = mean(req.dscr_p50_path)
        cov_ts = (pstdev(req.dscr_p50_path) / m) if m > 0 else 0.0
        detail = {"cov_time_series_pct": round(cov_ts * 100.0, 3), "n_periods": len(req.dscr_p50_path),
                  "mean_dscr_p50": round(m, 4)}
        if req.dscr_p90_path and len(req.dscr_p90_path) == len(req.dscr_p50_path):
            gaps = [(a - b) / a for a, b in zip(req.dscr_p50_path, req.dscr_p90_path) if a > 0]
            implied = (mean(gaps) / 1.2816) if gaps else 0.0   # P90 = 1.2816σ lower tail, normal approx (documented)
            detail["implied_sigma_from_p90_gap_pct"] = round(implied * 100.0, 3)
            cov = max(cov_ts, implied)
            basis = "max(time-series CoV of P50 DSCR path, implied sigma from mean P50-P90 gap / 1.2816) — conservative"
        else:
            cov = cov_ts
            basis = "time-series CoV (stdev/mean) of the P50 DSCR path"
    else:
        cov = max(0.0, (1.0 - req.p90_p50_ratio) / 1.2816)
        basis = "proxy: (1 - P90/P50 CFADS ratio) / 1.2816 (no DSCR path supplied; normal-approx one-sided sigma)"
        detail = None
    score = _interp(KNOTS_DSCR_COV, cov * 100.0)
    return {"cov_pct": round(cov * 100.0, 3), "score": round(score, 2), "basis": basis, "detail": detail,
            "mapping": "KNOTS_DSCR_COV (documented, /ref/scorecard)"}


def _build_factor_tree(req: RateRequest, dscr_vol: dict) -> dict:
    """Score every leaf, roll up the 3-level tree, return tree + score."""
    tree = _normalized_tree(req.weight_overrides)

    contract_mix_components = {
        "contracted_share": {"input": f"{req.contracted_revenue_pct:.0f}% contracted",
                             "score": round(_interp(KNOTS_CONTRACTED, req.contracted_revenue_pct), 2),
                             "weight": CONTRACT_MIX_BLEND["contracted_share"]},
        "offtaker_quality": {"input": f"offtaker {req.offtaker_rating}",
                             "score": OFFTAKER_SCORES[req.offtaker_rating],
                             "weight": CONTRACT_MIX_BLEND["offtaker_quality"]},
    }
    protections_components = {
        "dsra": {"input": f"DSRA {req.dsra_months:.0f}m", "score": round(_interp(KNOTS_DSRA, req.dsra_months), 2),
                 "weight": PROTECTIONS_BLEND["dsra"]},
        "sweep": {"input": f"sweep {req.cash_sweep_pct:.0f}%", "score": round(_interp(KNOTS_SWEEP, req.cash_sweep_pct), 2),
                  "weight": PROTECTIONS_BLEND["sweep"]},
    }
    leaf_scores = {
        "resource_risk": (round(_interp(KNOTS_P90_P50, req.p90_p50_ratio), 2), f"P90/P50 = {req.p90_p50_ratio:.2f}", None),
        "technology": (TECHNOLOGY_SCORES[req.technology], req.technology, None),
        "opex_risk": (OPEX_RISK_SCORES[req.opex_risk], req.opex_risk, None),
        "counterparty_om": (CONTRACTOR_SCORES[req.contractor_quality], req.contractor_quality, None),
        "contract_mix": (round(sum(c["weight"] * c["score"] for c in contract_mix_components.values()), 2),
                         f"{req.contracted_revenue_pct:.0f}% contracted, offtaker {req.offtaker_rating}",
                         contract_mix_components),
        "dscr_level": (round(_interp(KNOTS_MIN_DSCR, req.min_dscr), 2), f"min DSCR {req.min_dscr:.2f}x", None),
        "dscr_volatility": (dscr_vol["score"], f"CoV {dscr_vol['cov_pct']}% ({dscr_vol['basis']})", None),
        "leverage": (round(_interp(KNOTS_GEARING, req.gearing_pct), 2), f"gearing {req.gearing_pct:.0f}%", None),
        "refi_risk": (round(_interp(KNOTS_REFI_SHARE, req.refi_share_pct), 2), f"balloon share {req.refi_share_pct:.0f}%", None),
        "structure_protections": (round(sum(c["weight"] * c["score"] for c in protections_components.values()), 2),
                                  f"DSRA {req.dsra_months:.0f}m, sweep {req.cash_sweep_pct:.0f}%",
                                  protections_components),
        "sovereign_tier": (COUNTRY_SCORES[req.country_tier], req.country_tier, None),
        "legal_framework": (LEGAL_FRAMEWORK_SCORES[req.legal_framework], req.legal_framework, None),
    }

    groups_out, tree_score = [], 0.0
    for gk, g in tree.items():
        children_out, g_score = [], 0.0
        for ck, c in g["children"].items():
            score, inp, components = leaf_scores[ck]
            g_score += c["weight_normalized"] * score
            eff_w = g["weight_normalized"] * c["weight_normalized"]
            children_out.append({
                "key": ck, "label": c["label"], "input": inp, "score": score,
                "weight": round(c["weight"], 4), "weight_normalized": round(c["weight_normalized"], 4),
                "effective_weight": round(eff_w, 4),
                "notches_vs_anchor": round(eff_w * (score - NEUTRAL_SCORE) / POINTS_PER_NOTCH, 3),
                "basis": c["basis"],
                "components": ([{"key": k, **v} for k, v in components.items()] if components else None),
            })
        tree_score += g["weight_normalized"] * g_score
        groups_out.append({
            "key": gk, "label": g["label"], "score": round(g_score, 2),
            "weight": round(g["weight"], 4), "weight_normalized": round(g["weight_normalized"], 4),
            "notches_vs_anchor": round(g["weight_normalized"] * (g_score - NEUTRAL_SCORE) / POINTS_PER_NOTCH, 3),
            "children": children_out,
        })
    return {"groups": groups_out, "tree_score": round(tree_score, 2),
            "tree_rating": _score_to_rating(tree_score), "basis_note": TREE_BASIS_NOTE}


def _notching(req: RateRequest, base_rating: str) -> dict:
    """Documented notching chain on the tree rating: phase, structural
    subordination, external support (capped at guarantor), caps/floors."""
    steps = []
    # 1. Phase
    if req.phase == "construction":
        n_phase = -1 if req.contractor_quality == "tier1_fixed_price_wrap" else -2
        steps.append({"step": "phase", "notches": n_phase,
                      "rationale": f"Construction phase with {req.contractor_quality} EPC package "
                                   f"({'-1: tier-1 fixed-price full wrap' if n_phase == -1 else '-2: weaker EPC package'})"})
    else:
        n_phase = 0
        steps.append({"step": "phase", "notches": 0, "rationale": "Operating phase — no construction notching"})
    # 2. Structural subordination
    if req.seniority == "mezzanine":
        n_sub = -2 if req.subordination_depth_pct >= 60.0 else -1
        steps.append({"step": "structural_subordination", "notches": n_sub,
                      "rationale": f"Mezzanine with {req.subordination_depth_pct:.0f}% senior debt ahead "
                                   f"({'-2: deep subordination >= 60%' if n_sub == -2 else '-1: subordination < 60%'})"})
    else:
        n_sub = 0
        steps.append({"step": "structural_subordination", "notches": 0, "rationale": "Senior ranking — no subordination notching"})
    # 3. External support (uplift capped at guarantor rating)
    n_sup = {"none": 0, "partial": 1, "full": 2}[req.guarantee]
    sup_note = {"none": "No external support", "partial": "+1: partial guarantee",
                "full": "+2: full-wrap guarantee"}[req.guarantee]
    steps.append({"step": "external_support", "notches": n_sup, "rationale": sup_note})

    net = max(-3, min(2, n_phase + n_sub + n_sup))     # cap/floor rule
    notched = _apply_notches(base_rating, net)
    guarantor_cap_applied = False
    if n_sup > 0 and req.guarantor_rating is not None:
        if RATING_SCALE.index(notched) < RATING_SCALE.index(req.guarantor_rating):
            notched = req.guarantor_rating
            guarantor_cap_applied = True
    return {
        "base_rating": base_rating, "steps": steps,
        "net_notches": net, "net_notches_uncapped": n_phase + n_sub + n_sup,
        "cap_floor_rule": NOTCHING_RULES["caps_floors"],
        "guarantor_cap_applied": guarantor_cap_applied,
        "guarantor_rating": req.guarantor_rating,
        "notched_rating": notched,
    }


def _esg_overlay(esg: Optional[EsgOverlayParams], base_rating: str) -> dict:
    """0 to -2 notch transition/ESG overlay — monotone in carbon-intensity
    percentile; documented interpretation of the agencies' ESG credit factors."""
    if esg is None:
        return {"available": False, "overlay_notches": 0, "rating_without_overlay": base_rating,
                "rating_with_overlay": base_rating,
                "note": "Provide esg inputs (carbon_intensity_percentile, sbti_aligned, taxonomy_revenue_pct) to activate."}
    p = esg.carbon_intensity_percentile
    if p < 50:
        penalty = 0.0
    elif p < 70:
        penalty = 0.5
    elif p < 85:
        penalty = 1.0
    elif p < 95:
        penalty = 1.5
    else:
        penalty = 2.0
    mitigants, mitigant_texts = 0.0, []
    if esg.sbti_aligned:
        mitigants += 0.5
        mitigant_texts.append("SBTi-aligned target (-0.5 half-notch penalty)")
    if esg.taxonomy_revenue_pct >= 66.0:
        mitigants += 0.5
        mitigant_texts.append(f"taxonomy-aligned revenue {esg.taxonomy_revenue_pct:.0f}% >= 66% (-0.5)")
    elif esg.taxonomy_revenue_pct >= 33.0:
        mitigants += 0.25
        mitigant_texts.append(f"taxonomy-aligned revenue {esg.taxonomy_revenue_pct:.0f}% >= 33% (-0.25)")
    net_half = max(0.0, penalty - mitigants)
    overlay = -min(2, int(net_half + 0.5))             # round half up, floor -2, never positive
    with_overlay = _apply_notches(base_rating, overlay)
    rationale = (f"Carbon-intensity percentile {p:.0f} vs sector => penalty {penalty:g} half-notches"
                 + (f"; mitigants: {', '.join(mitigant_texts)}" if mitigant_texts else "; no mitigants")
                 + f" => net {net_half:g} half-notches => overlay {overlay} notch(es). "
                 + ESG_OVERLAY_RULES["basis"])
    return {
        "available": True,
        "carbon_intensity_percentile": p,
        "penalty_half_notches": penalty,
        "mitigants_half_notches": mitigants,
        "net_half_notches": net_half,
        "overlay_notches": overlay,
        "rating_without_overlay": base_rating,
        "rating_with_overlay": with_overlay,
        "rationale": rationale,
        "rules": ESG_OVERLAY_RULES,
    }


def _el_profile(rating: str, lgd: float, exposure: Optional[float]) -> dict:
    """1-10y PD curve + EL term profile for one rating."""
    curve = _pd_curve(rating)
    out = []
    for row in curve:
        el_pct = row["cum_pd_pct"] * lgd
        out.append({**row, "cum_el_pct": round(el_pct, 4),
                    "cum_el_usd": round(exposure * el_pct / 100.0, 2) if exposure else None})
    return {"rating": rating, "curve": out,
            "interpolation_note": "Log-survival (constant hazard between anchors) interpolation of the "
                                  "hand-authored 1/5/10y cumulative PD anchors — LABELED interpolation."}


# ─────────────────────────────────────────────────────────────────────────────
# Peer benchmark table (hand-authored, anonymised-but-realistic — labeled)
# ─────────────────────────────────────────────────────────────────────────────
PEER_PROFILES = [
    {"peer": "Peer A", "sector": "Solar PV (contracted)", "contracted_pct": 100, "min_dscr": 1.35, "gearing_pct": 80, "rating": "BBB",  "note": "20y IG-utility PPA, mature market"},
    {"peer": "Peer B", "sector": "Onshore wind", "contracted_pct": 90, "min_dscr": 1.40, "gearing_pct": 75, "rating": "BBB-", "note": "Corporate PPA, modest merchant tail"},
    {"peer": "Peer C", "sector": "Offshore wind (CfD)", "contracted_pct": 95, "min_dscr": 1.45, "gearing_pct": 70, "rating": "BBB",  "note": "Government CfD, proven turbine class"},
    {"peer": "Peer D", "sector": "Solar PV (merchant-heavy)", "contracted_pct": 30, "min_dscr": 1.85, "gearing_pct": 55, "rating": "BB",   "note": "Merchant exposure sized on P90"},
    {"peer": "Peer E", "sector": "CCGT (tolling)", "contracted_pct": 100, "min_dscr": 1.30, "gearing_pct": 78, "rating": "BBB-", "note": "Full tolling, fuel pass-through"},
    {"peer": "Peer F", "sector": "Availability PPP (road)", "contracted_pct": 100, "min_dscr": 1.20, "gearing_pct": 88, "rating": "A-",   "note": "Government-grade availability payments"},
    {"peer": "Peer G", "sector": "BESS (tolled)", "contracted_pct": 80, "min_dscr": 1.60, "gearing_pct": 65, "rating": "BB+",  "note": "7y toll + merchant arbitrage tail"},
    {"peer": "Peer H", "sector": "Geothermal", "contracted_pct": 95, "min_dscr": 1.50, "gearing_pct": 70, "rating": "BB+",  "note": "Resource decline risk priced in"},
    {"peer": "Peer I", "sector": "Regulated transmission", "contracted_pct": 100, "min_dscr": 1.25, "gearing_pct": 85, "rating": "A-",   "note": "RAB-style regulated revenue"},
    {"peer": "Peer J", "sector": "LNG terminal", "contracted_pct": 90, "min_dscr": 1.40, "gearing_pct": 72, "rating": "BBB",  "note": "Take-or-pay capacity contracts"},
    {"peer": "Peer K", "sector": "Gas peaker (merchant)", "contracted_pct": 15, "min_dscr": 2.10, "gearing_pct": 45, "rating": "BB-",  "note": "Energy-margin volatility, low leverage"},
    {"peer": "Peer L", "sector": "Hydro (EM, contracted)", "contracted_pct": 90, "min_dscr": 1.55, "gearing_pct": 65, "rating": "BB",   "note": "Sovereign ceiling caps the rating"},
]
PEER_BASIS_NOTE = ("Hand-authored, anonymised-but-realistic PF credit profiles reflecting typical "
                   "sector rating outcomes (2023-2025 vintage market observation). ILLUSTRATIVE — "
                   "not real transactions, not agency data.")


# ─────────────────────────────────────────────────────────────────────────────
# POST /rate
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/rate", summary="Score a project-finance transaction: factor tree + notching + ESG overlay + PD term structure")
async def rate_project(req: RateRequest):
    """Legacy flat scorecard (kept bit-identical) + v2 factor tree -> tree
    rating -> notching chain (phase / subordination / support, capped) ->
    transition/ESG overlay (with vs without) -> 1-10y PD curve + EL profile.
    All weights, knot tables, notching and overlay rules documented in this
    module and exposed at GET /ref/scorecard and /ref/peers."""
    try:
        # ── Legacy flat scorecard (unchanged computation) ────────────────────
        phase_score = PHASE_SCORES[req.phase]
        resource_score = _interp(KNOTS_P90_P50, req.p90_p50_ratio)
        revenue_score = (REVENUE_BLEND["contracted_share"] * _interp(KNOTS_CONTRACTED, req.contracted_revenue_pct)
                         + REVENUE_BLEND["offtaker_quality"] * OFFTAKER_SCORES[req.offtaker_rating])
        structure_parts = {
            "min_dscr": _interp(KNOTS_MIN_DSCR, req.min_dscr),
            "gearing": _interp(KNOTS_GEARING, req.gearing_pct),
            "dsra": _interp(KNOTS_DSRA, req.dsra_months),
            "sweep": _interp(KNOTS_SWEEP, req.cash_sweep_pct),
        }
        structure_score = sum(STRUCTURE_BLEND[k] * v for k, v in structure_parts.items())
        counterparty_score = CONTRACTOR_SCORES[req.contractor_quality]
        country_score = COUNTRY_SCORES[req.country_tier]

        factor_scores = {
            "phase": phase_score,
            "resource_risk": resource_score,
            "revenue_contract": revenue_score,
            "structure": structure_score,
            "counterparty": counterparty_score,
            "country": country_score,
        }
        weighted_score = sum(WEIGHTS[f] * s for f, s in factor_scores.items())
        rating = _score_to_rating(weighted_score)
        pd_row = PD_TABLE[rating]

        # Driver decomposition vs the BBB- anchor (60)
        factor_inputs = {
            "phase": req.phase,
            "resource_risk": f"P90/P50 = {req.p90_p50_ratio:.2f}",
            "revenue_contract": f"{req.contracted_revenue_pct:.0f}% contracted, offtaker {req.offtaker_rating}",
            "structure": f"min DSCR {req.min_dscr:.2f}x, gearing {req.gearing_pct:.0f}%, DSRA {req.dsra_months:.0f}m, sweep {req.cash_sweep_pct:.0f}%",
            "counterparty": req.contractor_quality,
            "country": req.country_tier,
        }
        drivers: List[dict] = []
        for f, s in factor_scores.items():
            contribution = WEIGHTS[f] * (s - NEUTRAL_SCORE)
            drivers.append({
                "factor": f,
                "input": factor_inputs[f],
                "factor_score": round(s, 2),
                "weight": WEIGHTS[f],
                "weighted_points": round(WEIGHTS[f] * s, 3),
                "contribution_vs_anchor_points": round(contribution, 3),
                "notches_vs_anchor": round(contribution / POINTS_PER_NOTCH, 3),
            })
        drivers.sort(key=lambda d: d["contribution_vs_anchor_points"])

        # Expected loss (legacy 1/5/10y panel)
        lgd = (req.lgd_pct if req.lgd_pct is not None else 35.0) / 100.0
        el = {
            "lgd_pct": round(lgd * 100.0, 2),
            "el_1y_pct": round(pd_row["pd_1y_pct"] * lgd, 4),
            "el_5y_pct": round(pd_row["pd_5y_pct"] * lgd, 4),
            "el_10y_pct": round(pd_row["pd_10y_pct"] * lgd, 4),
        }
        if req.exposure_usd:
            el["exposure_usd"] = req.exposure_usd
            el["el_10y_usd"] = round(req.exposure_usd * pd_row["pd_10y_pct"] / 100.0 * lgd, 2)

        # ── v2 EXTENSION 1+2: DSCR volatility + factor tree ──────────────────
        dscr_vol = _dscr_volatility(req)
        factor_tree = _build_factor_tree(req, dscr_vol)
        tree_rating = factor_tree["tree_rating"]

        # ── v2 EXTENSION 3: notching chain on the tree rating ────────────────
        notching = _notching(req, tree_rating)
        notched_rating = notching["notched_rating"]

        # ── v2 EXTENSION 5: transition/ESG overlay (with vs without) ─────────
        esg_overlay = _esg_overlay(req.esg, notched_rating)
        final_rating = esg_overlay["rating_with_overlay"]

        # ── v2 EXTENSION 6: PD term structure + EL profile (both ratings) ────
        pd_term_structure = {
            "without_esg_overlay": _el_profile(notched_rating, lgd, req.exposure_usd),
            "with_esg_overlay": (_el_profile(final_rating, lgd, req.exposure_usd)
                                 if final_rating != notched_rating else None),
            "lgd_pct": round(lgd * 100.0, 2),
            "exposure_usd": req.exposure_usd,
            "basis": PD_BASIS_NOTE,
        }

        rating_summary = {
            "legacy_flat_scorecard": rating,
            "tree_scorecard": tree_rating,
            "after_notching": notched_rating,
            "final_with_esg_overlay": final_rating,
            "esg_overlay_notches": esg_overlay["overlay_notches"],
            "chain": f"tree {tree_rating} -> notching ({notching['net_notches']:+d}) {notched_rating}"
                     + (f" -> ESG overlay ({esg_overlay['overlay_notches']:+d}) {final_rating}"
                        if esg_overlay["available"] else " (no ESG overlay inputs)"),
        }

        return {
            # ── legacy keys (computation unchanged) ──────────────────────────
            "project_name": req.project_name,
            "weighted_score": round(weighted_score, 2),
            "indicative_rating": rating,
            "rating_scale_note": f"~{POINTS_PER_NOTCH:.0f} points per notch; anchor {NEUTRAL_SCORE:.0f} = BB+ "
                                 "(crossover), documented band map at /ref/scorecard. Indicative only — "
                                 "NOT an agency rating.",
            "structure_subscores": {k: round(v, 2) for k, v in structure_parts.items()},
            "drivers": drivers,
            "key_strengths": [d["factor"] for d in drivers if d["notches_vs_anchor"] > 0.15][-3:][::-1],
            "key_weaknesses": [d["factor"] for d in drivers if d["notches_vs_anchor"] < -0.15][:3],
            "pd": {**pd_row, "basis": PD_BASIS_NOTE},
            "expected_loss": el,
            # ── v2 keys ──────────────────────────────────────────────────────
            "factor_tree": factor_tree,
            "dscr_volatility": dscr_vol,
            "notching": notching,
            "esg_overlay": esg_overlay,
            "rating_summary": rating_summary,
            "pd_term_structure": pd_term_structure,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("pf-rating /rate error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────────────────────
# GET /ref/scorecard — full transparency (legacy keys kept, v2 tables added)
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/ref/scorecard", summary="Scorecard weights, knot tables, factor tree, notching/ESG rules, rating map and PD table")
async def scorecard_reference():
    return {
        "weights": WEIGHTS,
        "internal_blends": {"revenue_contract": REVENUE_BLEND, "structure": STRUCTURE_BLEND},
        "knot_tables": {
            "p90_p50_ratio": KNOTS_P90_P50,
            "min_dscr": KNOTS_MIN_DSCR,
            "gearing_pct": KNOTS_GEARING,
            "dsra_months": KNOTS_DSRA,
            "cash_sweep_pct": KNOTS_SWEEP,
            "contracted_revenue_pct": KNOTS_CONTRACTED,
            "refi_share_pct": KNOTS_REFI_SHARE,
            "dscr_cov_pct": KNOTS_DSCR_COV,
        },
        "categorical_scores": {
            "phase": PHASE_SCORES,
            "offtaker_rating": OFFTAKER_SCORES,
            "contractor_quality": CONTRACTOR_SCORES,
            "country_tier": COUNTRY_SCORES,
            "technology": TECHNOLOGY_SCORES,
            "opex_risk": OPEX_RISK_SCORES,
            "legal_framework": LEGAL_FRAMEWORK_SCORES,
        },
        "rating_bands": [{"score_floor": f, "rating": rating} for f, rating in RATING_BANDS],
        "points_per_notch": POINTS_PER_NOTCH,
        "anchor": {"score": NEUTRAL_SCORE, "meaning": "driver-decomposition anchor (maps to BB+ crossover)"},
        "pd_table": PD_TABLE,
        "pd_basis_note": PD_BASIS_NOTE,
        # ── v2 reference blocks ──────────────────────────────────────────────
        "factor_tree": {
            "definition": FACTOR_TREE_DEF,
            "level3_blends": {"contract_mix": CONTRACT_MIX_BLEND, "structure_protections": PROTECTIONS_BLEND},
            "basis_note": TREE_BASIS_NOTE,
        },
        "notching_rules": NOTCHING_RULES,
        "esg_overlay_rules": ESG_OVERLAY_RULES,
        "pd_curve_interpolation": "1-10y cumulative PD by log-survival (constant hazard between anchors) "
                                  "interpolation of the 1/5/10y anchors — labeled interpolation, not published data.",
        "methodology_note": "Agency-methodology-style scorecard: factor scores 0-100 via the knot/lookup tables "
                            "above, weighted sum, band-mapped to an indicative notch. Hand-authored weights and "
                            "tables — transparent, editable, indicative only.",
    }


# ─────────────────────────────────────────────────────────────────────────────
# GET /ref/peers — hand-authored peer benchmark profiles (labeled)
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/ref/peers", summary="12 anonymised-but-realistic PF credit profiles for the peer scatter benchmark (hand-authored, labeled)")
async def peer_reference():
    return {"peers": PEER_PROFILES, "basis_note": PEER_BASIS_NOTE, "as_of": "2026-07 (authored)"}
