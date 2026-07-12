"""
PPA Structuring Desk — term-sheet structuring & valuation engine
================================================================
Prefix: /api/v1/ppa-structuring
Tags:   PPA Structuring

Module NX2-01 (`/ppa-structuring-desk`). Structures and values a single-asset
renewable PPA term sheet at annual granularity: pay-as-produced vs baseload vs
solar-shaped delivery, contract vs merchant-tail value split, capture-price /
cannibalization discounting, REC/GoO and ancillary revenue stacking.

All math is deterministic and documented below — NO PRNG anywhere.

Methodology
-----------
Generation (per year t = 1..N, N = ppa_tenor + merchant_tail):

    gen_t = capacity_mw x 8760 x (CF / 100) x (1 - deg) ** (t - 1)

computed for both the P50 (median) and P90 (1-in-10 downside) net capacity
factors supplied by the caller (or fetched from the platform's
/api/v1/renewable-ppa yield engines, which publish P50/P90 directly).

PPA price path:

    ppa_price_t = ppa_price x (1 + escalation) ** (t - 1)

Merchant price: a FLAT nominal forward (industry convention for long-dated
uncontracted energy where no liquid curve exists beyond ~5y) multiplied by a
technology capture rate:

    capture_price = merchant_forward x capture_rate

The capture rate (a.k.a. value factor) reflects price cannibalization — VRE
output is correlated across plants of the same technology, so it sells into
below-average prices. Defaults by same-technology penetration tier are
hand-authored MODELING DEFAULTS calibrated to the published literature:
Hirth (2013), "The market value of variable renewables", Energy Economics 38
(solar value factor ~1.0 at low share falling to ~0.5-0.8 at 15% share;
wind to ~0.5-0.8 at 30% share), and Millstein, Wiser et al. (2021),
"Solar and wind grid system value in the United States", Joule 5(7) / LBNL.
See GET /ref/capture-rates. Callers may override with an explicit
capture_rate_pct.

Delivery structures
-------------------
1. pay_as_produced — offtaker takes contracted_volume_pct of metered output
   as generated. No shape risk retained by the seller.

       ppa_mwh_t      = gen_t x cv
       merchant_mwh_t = gen_t x (1 - cv)

2. baseload — seller commits to a FLAT block sized off year-1 P50 output
   (fixed obligation; it does not degrade and does not vary between the P50
   and P90 case — that asymmetry IS the shape risk):

       block_mwh = capacity_mw x 8760 x (p50_cf_yr1 / 100) x cv

   Only part of the block coincides hour-by-hour with the plant's own
   production. The shape-match factor (share of a flat block a technology's
   unconstrained profile can serve directly, hand-authored default: solar
   0.30 — daylight-only production against a 24/7 block; wind 0.55 — broader
   duration curve) splits flows:

       matched_mwh_t   = min(gen_t, block_mwh) x match
       shortfall_mwh_t = block_mwh - matched_mwh_t          (bought to firm)
       surplus_mwh_t   = gen_t - matched_mwh_t              (sold merchant)

   Firming (shape/basis) cost — the documented formula surfaced in the API:

       firming_cost_t = shortfall_mwh_t x (merchant_forward + firming_premium)

   i.e. shortfall energy is procured at the flat hub forward plus a
   balancing/trading premium (default 2 $/MWh, editable), while surplus
   energy earns only the capture price. The gap between the two is the
   economic cost of shaping an intermittent profile into a firm block.

3. solar_shaped — offtaker takes a fixed solar-shaped profile. For a solar
   asset the profile is nearly self-matching (match 0.95); for a wind asset
   selling a solar shape the match is poor (0.35). The unmatched contracted
   share slips to merchant; per the module spec an explicit firming charge
   is only assessed for baseload:

       ppa_mwh_t      = gen_t x cv x match
       merchant_mwh_t = gen_t - ppa_mwh_t

Post-tenor (merchant tail): 100% of generation sells at the capture price.

Revenue stacking (all years):

    rec_revenue_t       = gen_t x rec_volume x rec_price      (t <= rec_tenor)
    ancillary_revenue_t = ancillary_usd_mw_yr x capacity_mw

Summary metrics per case:

    realized_price   = (sum of net revenue) / (sum of generation)
    contract share   = PPA revenue / gross revenue (nominal and PV)
    NPV              = sum( net_revenue_t / (1 + r) ** t )

Every default is labeled; every number ties to an input or a formula above.

Extended analytics (2026-07 refinement)
---------------------------------------
POST /shape-analysis    — 24h x 4-season (96-point) parametric generation /
                          price / load shapes; capture rate computed FROM the
                          shapes (an OUTPUT, no longer only an input);
                          shape vs seasonal decomposition; negative-price-hour
                          modeling; hourly curtailment vs a connection cap;
                          24/7 CFE hourly matching; avoided emissions and a
                          carbon-adjusted effective PPA price; EU Taxonomy
                          100 gCO2e/kWh screen. All shapes are DOCUMENTED
                          PARAMETRIC MODELING ARCHETYPES (see
                          GET /ref/shape-archetypes), not metered data.
POST /settlement        — two-way CfD / virtual-PPA cash settlement over the
                          96-point shapes: (strike - market)·volume per point,
                          negative-price clause, collar/floor on the market
                          reference, hub-vs-node basis line (documented +/-2
                          sigma band from a user basis vol — NO PRNG).
POST /credit-exposure   — CSA terms (threshold / IA / MTA) against a potential
                          settlement exposure profile PE_t = 2·sigma·sqrt(t) x
                          remaining contract volume (documented +/-2-sigma
                          diffusion band, no simulation), plus a
                          downgrade-trigger table.
POST /term-sheet-score  — multi-attribute deal score with VISIBLE weights
                          (price vs capture-adjusted market, tenor, credit,
                          structure flexibility, sustainability) and an NPV
                          sensitivity table (+/-10% on 6 drivers, re-running
                          the exact /structure math).
GET  /ref/shape-archetypes — every parametric shape constant with its basis.
GET  /ref/rec-forward   — REC/GoO vintage-forward strip from a spot + drift
                          (documented compounding formula, labeled).
"""
from __future__ import annotations

import math
from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/ppa-structuring", tags=["PPA Structuring"])

HOURS_PER_YEAR = 8760

# ---------------------------------------------------------------------------
# Reference data — capture rates & shape-match factors (hand-authored,
# labeled modeling defaults; basis cited per tier)
# ---------------------------------------------------------------------------

CAPTURE_RATE_BASIS = (
    "Hand-authored MODELING DEFAULTS calibrated to published value-factor "
    "literature: Hirth (2013) 'The market value of variable renewables', "
    "Energy Economics 38, pp. 218-236 (German/European market data: solar "
    "value factor ~1.0 at <2% share declining to ~0.5-0.8 at 15% share; wind "
    "~1.1 at low share to ~0.5-0.8 at 30%); Millstein, Wiser et al. (2021) "
    "'Solar and wind grid system value in the United States', Joule 5(7) "
    "(LBNL: CAISO solar value factor fell from ~1.2 to ~0.8 as solar share "
    "reached ~15%). NOT live market data — override with a market quote for "
    "transaction work."
)

# Tiers keyed by same-technology penetration (share of annual demand served
# by the SAME technology in the bidding zone). capture_rate_pct = value
# factor x 100 applied to the flat hub forward.
CAPTURE_RATE_TIERS: Dict[str, List[dict]] = {
    "solar": [
        {"tier": "<5%",   "min_pen_pct": 0.0,  "max_pen_pct": 5.0,   "capture_rate_pct": 98.0,
         "note": "Near system-average price; midday peak still price-supportive (Hirth 2013 fig. 4)."},
        {"tier": "5-10%", "min_pen_pct": 5.0,  "max_pen_pct": 10.0,  "capture_rate_pct": 90.0,
         "note": "Early cannibalization of the midday block (LBNL 2021, CAISO trajectory)."},
        {"tier": "10-15%", "min_pen_pct": 10.0, "max_pen_pct": 15.0, "capture_rate_pct": 82.0,
         "note": "Duck-curve regime; midday prices materially depressed."},
        {"tier": "15-25%", "min_pen_pct": 15.0, "max_pen_pct": 25.0, "capture_rate_pct": 72.0,
         "note": "Deep midday depression, frequent zero/negative hours (Hirth 2013 ~0.5-0.8 band at 15%)."},
        {"tier": ">25%",  "min_pen_pct": 25.0, "max_pen_pct": 100.0, "capture_rate_pct": 60.0,
         "note": "Structural saturation absent storage; lower bound of published band."},
    ],
    "wind": [
        {"tier": "<10%",  "min_pen_pct": 0.0,  "max_pen_pct": 10.0,  "capture_rate_pct": 97.0,
         "note": "Weak diurnal correlation keeps wind near system-average price (Hirth 2013)."},
        {"tier": "10-20%", "min_pen_pct": 10.0, "max_pen_pct": 20.0, "capture_rate_pct": 90.0,
         "note": "Windy-hour price depression emerges (German market ~0.9 at mid-2010s shares)."},
        {"tier": "20-30%", "min_pen_pct": 20.0, "max_pen_pct": 30.0, "capture_rate_pct": 84.0,
         "note": "Correlated output across the fleet; Hirth 2013 ~0.5-0.8 band reached near 30%."},
        {"tier": "30-40%", "min_pen_pct": 30.0, "max_pen_pct": 40.0, "capture_rate_pct": 78.0,
         "note": "High-penetration regime (DK/IE-like); frequent surplus hours."},
        {"tier": ">40%",  "min_pen_pct": 40.0, "max_pen_pct": 100.0, "capture_rate_pct": 70.0,
         "note": "Saturation absent interconnection/storage; lower published band."},
    ],
}

# Share of a delivery shape a technology's unconstrained annual profile can
# serve coincidentally (hand-authored defaults, documented in module docstring).
SHAPE_MATCH_FACTORS: Dict[str, Dict[str, float]] = {
    "baseload": {
        "solar": 0.30,   # daylight-only production vs a 24/7 flat block (~30% of hours near/above block rate)
        "wind": 0.55,    # broader duration curve covers more block hours
    },
    "solar_shaped": {
        "solar": 0.95,   # own profile vs fixed solar shape — residual is weather deviation
        "wind": 0.35,    # wind profile poorly matches a solar shape
    },
    "pay_as_produced": {"solar": 1.0, "wind": 1.0},
}

VALID_TECHNOLOGIES = ("solar", "wind")
VALID_STRUCTURES = ("pay_as_produced", "baseload", "solar_shaped")

# Default net degradation if caller omits it (labeled defaults: solar module
# degradation per NREL/manufacturer warranties ~0.4%/yr; wind assumed 0 net
# of availability which is already in the net CF).
DEFAULT_DEGRADATION_PCT_YR = {"solar": 0.4, "wind": 0.0}

DEFAULT_FIRMING_PREMIUM_USD_MWH = 2.0  # balancing/trading cost adder, editable


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class PPAStructureRequest(BaseModel):
    """Full PPA term sheet + merchant/REC/ancillary assumptions."""

    # Generation
    technology: str = Field("solar", description="solar | wind")
    capacity_mw: float = Field(100.0, gt=0, le=10000)
    p50_capacity_factor_pct: float = Field(24.0, gt=0, le=80,
                                           description="P50 NET capacity factor, %")
    p90_capacity_factor_pct: float = Field(21.5, gt=0, le=80,
                                           description="P90 NET capacity factor, % (must be <= P50)")
    degradation_pct_yr: Optional[float] = Field(
        None, ge=0, le=5,
        description="Annual net output degradation %; default 0.4 solar / 0.0 wind")

    # PPA term sheet
    structure: str = Field("pay_as_produced",
                           description="pay_as_produced | baseload | solar_shaped")
    ppa_price_usd_mwh: float = Field(45.0, ge=0)
    ppa_tenor_years: int = Field(15, ge=1, le=35)
    contracted_volume_pct: float = Field(80.0, ge=0, le=100,
                                         description="Share of P50 output (baseload block sizing) or of metered output (as-produced/shaped)")
    escalation_pct_yr: float = Field(1.5, ge=-5, le=10)

    # Merchant assumptions
    merchant_forward_usd_mwh: float = Field(42.0, ge=0,
                                            description="Flat nominal hub forward, $/MWh")
    capture_rate_pct: Optional[float] = Field(
        None, gt=0, le=120,
        description="Value factor x100. None -> tier default from vre_penetration_pct (see /ref/capture-rates)")
    vre_penetration_pct: float = Field(12.0, ge=0, le=100,
                                       description="Same-technology share of annual demand; selects the default capture-rate tier")
    merchant_tail_years: int = Field(10, ge=0, le=25)

    # Revenue stacking
    rec_price_usd_mwh: float = Field(3.0, ge=0, description="REC/GoO price per MWh generated")
    rec_volume_pct: float = Field(100.0, ge=0, le=100)
    rec_tenor_years: Optional[int] = Field(None, ge=0, le=50,
                                           description="Years RECs are monetized; None = full project life")
    ancillary_usd_mw_yr: float = Field(0.0, ge=0, description="Ancillary/grid-services revenue, $/MW-yr")

    # Valuation
    discount_rate_pct: float = Field(7.0, ge=0, le=25)
    firming_premium_usd_mwh: float = Field(DEFAULT_FIRMING_PREMIUM_USD_MWH, ge=0, le=50,
                                           description="Balancing/trading adder on firming purchases (baseload only)")


# ---------------------------------------------------------------------------
# Core math
# ---------------------------------------------------------------------------

def _resolve_capture_rate(technology: str, penetration_pct: float) -> dict:
    """Look up the tiered capture-rate default for a technology/penetration.

    Deterministic table lookup against CAPTURE_RATE_TIERS (documented,
    hand-authored defaults — see CAPTURE_RATE_BASIS).
    """
    for tier in CAPTURE_RATE_TIERS[technology]:
        if tier["min_pen_pct"] <= penetration_pct < tier["max_pen_pct"]:
            return tier
    return CAPTURE_RATE_TIERS[technology][-1]


def _build_case(req: PPAStructureRequest, cf_pct: float, case: str,
                capture_rate: float, degradation_pct: float) -> dict:
    """Compute the period-by-period revenue build for one probability case.

    Implements exactly the formulas in the module docstring:
      gen_t        = MW x 8760 x CF x (1-deg)^(t-1)
      ppa_price_t  = P0 x (1+esc)^(t-1)
      capture      = forward x capture_rate
      baseload firming_cost_t = shortfall_t x (forward + premium)
    """
    n_years = req.ppa_tenor_years + req.merchant_tail_years
    cv = req.contracted_volume_pct / 100.0
    esc = req.escalation_pct_yr / 100.0
    deg = degradation_pct / 100.0
    capture_price = req.merchant_forward_usd_mwh * capture_rate
    match = SHAPE_MATCH_FACTORS[req.structure][req.technology]
    rec_tenor = req.rec_tenor_years if req.rec_tenor_years is not None else n_years
    r = req.discount_rate_pct / 100.0

    # Baseload block sized once, off year-1 P50 (fixed contractual obligation)
    block_mwh = (req.capacity_mw * HOURS_PER_YEAR
                 * (req.p50_capacity_factor_pct / 100.0) * cv)

    periods = []
    npv_net = 0.0
    pv_ppa = 0.0
    pv_gross = 0.0
    for t in range(1, n_years + 1):
        gen = req.capacity_mw * HOURS_PER_YEAR * (cf_pct / 100.0) * ((1.0 - deg) ** (t - 1))
        in_tenor = t <= req.ppa_tenor_years
        ppa_price_t = req.ppa_price_usd_mwh * ((1.0 + esc) ** (t - 1))

        firming_cost = 0.0
        if not in_tenor:
            ppa_mwh, merchant_mwh, ppa_rev = 0.0, gen, 0.0
            merchant_rev = merchant_mwh * capture_price
        elif req.structure == "baseload":
            matched = min(gen, block_mwh) * match
            shortfall = block_mwh - matched                     # bought to firm the block
            surplus = gen - matched                             # own energy sold merchant
            ppa_mwh = block_mwh
            merchant_mwh = surplus
            ppa_rev = block_mwh * ppa_price_t
            merchant_rev = surplus * capture_price
            firming_cost = shortfall * (req.merchant_forward_usd_mwh + req.firming_premium_usd_mwh)
        elif req.structure == "solar_shaped":
            ppa_mwh = gen * cv * match                          # unmatched contracted share slips to merchant
            merchant_mwh = gen - ppa_mwh
            ppa_rev = ppa_mwh * ppa_price_t
            merchant_rev = merchant_mwh * capture_price
        else:  # pay_as_produced
            ppa_mwh = gen * cv
            merchant_mwh = gen * (1.0 - cv)
            ppa_rev = ppa_mwh * ppa_price_t
            merchant_rev = merchant_mwh * capture_price

        rec_rev = gen * (req.rec_volume_pct / 100.0) * req.rec_price_usd_mwh if t <= rec_tenor else 0.0
        anc_rev = req.ancillary_usd_mw_yr * req.capacity_mw
        gross = ppa_rev + merchant_rev + rec_rev + anc_rev
        net = gross - firming_cost

        df = 1.0 / ((1.0 + r) ** t)
        npv_net += net * df
        pv_ppa += ppa_rev * df
        pv_gross += gross * df

        periods.append({
            "year": t,
            "in_ppa_tenor": in_tenor,
            "generation_mwh": round(gen, 1),
            "ppa_mwh": round(ppa_mwh, 1),
            "merchant_mwh": round(merchant_mwh, 1),
            "ppa_price_usd_mwh": round(ppa_price_t, 2),
            "capture_price_usd_mwh": round(capture_price, 2),
            "ppa_revenue_usd": round(ppa_rev, 0),
            "merchant_revenue_usd": round(merchant_rev, 0),
            "rec_revenue_usd": round(rec_rev, 0),
            "ancillary_revenue_usd": round(anc_rev, 0),
            "firming_cost_usd": round(firming_cost, 0),
            "net_revenue_usd": round(net, 0),
        })

    tot = lambda k: sum(p[k] for p in periods)  # noqa: E731
    total_gen = tot("generation_mwh")
    total_ppa = tot("ppa_revenue_usd")
    total_merchant = tot("merchant_revenue_usd")
    total_rec = tot("rec_revenue_usd")
    total_anc = tot("ancillary_revenue_usd")
    total_firming = tot("firming_cost_usd")
    total_gross = total_ppa + total_merchant + total_rec + total_anc
    total_net = total_gross - total_firming

    return {
        "case": case,
        "capacity_factor_pct": cf_pct,
        "periods": periods,
        "totals": {
            "generation_mwh": round(total_gen, 0),
            "ppa_revenue_usd": round(total_ppa, 0),
            "merchant_revenue_usd": round(total_merchant, 0),
            "rec_revenue_usd": round(total_rec, 0),
            "ancillary_revenue_usd": round(total_anc, 0),
            "firming_cost_usd": round(total_firming, 0),
            "gross_revenue_usd": round(total_gross, 0),
            "net_revenue_usd": round(total_net, 0),
        },
        "value_split": {
            # nominal shares of GROSS revenue by stream
            "contracted_share_pct": round(100.0 * total_ppa / total_gross, 2) if total_gross else 0.0,
            "merchant_share_pct": round(100.0 * total_merchant / total_gross, 2) if total_gross else 0.0,
            "rec_share_pct": round(100.0 * total_rec / total_gross, 2) if total_gross else 0.0,
            "ancillary_share_pct": round(100.0 * total_anc / total_gross, 2) if total_gross else 0.0,
            # PV-basis contract share (discounting shifts value toward early, contracted years)
            "pv_contracted_share_pct": round(100.0 * pv_ppa / pv_gross, 2) if pv_gross else 0.0,
        },
        "weighted_avg_realized_price_usd_mwh": round(total_net / total_gen, 2) if total_gen else 0.0,
        "npv_net_revenue_usd": round(npv_net, 0),
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/structure", summary="Structure & value a PPA term sheet (P50/P90, revenue by stream)")
def structure_ppa(req: PPAStructureRequest):
    """Period-by-period PPA valuation for both P50 and P90 generation cases.

    Returns annual revenue arrays split by stream (PPA / merchant / REC /
    ancillary), firming cost when structure=baseload, contract-vs-merchant
    value shares (nominal and PV), weighted-average realized price and NPV.
    All formulas are documented in the module docstring; every default used
    is echoed back under `assumptions`.
    """
    tech = req.technology.lower().strip()
    if tech not in VALID_TECHNOLOGIES:
        raise HTTPException(422, f"technology must be one of {VALID_TECHNOLOGIES}")
    struct = req.structure.lower().strip()
    if struct not in VALID_STRUCTURES:
        raise HTTPException(422, f"structure must be one of {VALID_STRUCTURES}")
    if req.p90_capacity_factor_pct > req.p50_capacity_factor_pct:
        raise HTTPException(422, "p90_capacity_factor_pct must be <= p50_capacity_factor_pct "
                                 "(P90 is the 1-in-10 downside case)")
    req.technology, req.structure = tech, struct

    degradation = (req.degradation_pct_yr if req.degradation_pct_yr is not None
                   else DEFAULT_DEGRADATION_PCT_YR[tech])

    if req.capture_rate_pct is not None:
        capture_rate = req.capture_rate_pct / 100.0
        capture_source = "user_override"
        tier = None
    else:
        tier = _resolve_capture_rate(tech, req.vre_penetration_pct)
        capture_rate = tier["capture_rate_pct"] / 100.0
        capture_source = f"tier_default:{tier['tier']} penetration"

    p50 = _build_case(req, req.p50_capacity_factor_pct, "P50", capture_rate, degradation)
    p90 = _build_case(req, req.p90_capacity_factor_pct, "P90", capture_rate, degradation)

    match = SHAPE_MATCH_FACTORS[struct][tech]
    firming_block = None
    if struct == "baseload":
        firming_block = {
            "block_mwh_yr": round(req.capacity_mw * HOURS_PER_YEAR
                                  * (req.p50_capacity_factor_pct / 100.0)
                                  * (req.contracted_volume_pct / 100.0), 1),
            "shape_match_factor": match,
            "firming_premium_usd_mwh": req.firming_premium_usd_mwh,
            "formula": ("firming_cost_t = (block_mwh - min(gen_t, block_mwh) x match) "
                        "x (merchant_forward + firming_premium); block sized off year-1 "
                        "P50 x contracted volume %, fixed for the tenor"),
            "basis": ("Shape-match factors are hand-authored modeling defaults: solar 0.30 "
                      "(daylight-only vs 24/7 block), wind 0.55 (broader duration curve). "
                      "Shortfall energy is procured at the flat hub forward + premium; "
                      "surplus own-generation earns only the capture price."),
        }

    return {
        "module": "ppa-structuring-desk",
        "assumptions": {
            "technology": tech,
            "structure": struct,
            "capacity_mw": req.capacity_mw,
            "project_years": req.ppa_tenor_years + req.merchant_tail_years,
            "ppa_tenor_years": req.ppa_tenor_years,
            "merchant_tail_years": req.merchant_tail_years,
            "degradation_pct_yr": degradation,
            "degradation_source": ("user_input" if req.degradation_pct_yr is not None
                                   else "labeled_default (solar 0.4%/yr NREL-warranty-class, wind 0.0%)"),
            "merchant_forward_usd_mwh": req.merchant_forward_usd_mwh,
            "merchant_price_note": "Flat nominal forward across all merchant years (stated model assumption)",
            "capture_rate_pct": round(capture_rate * 100.0, 2),
            "capture_rate_source": capture_source,
            "capture_rate_tier": tier,
            "capture_rate_basis": CAPTURE_RATE_BASIS,
            "capture_price_usd_mwh": round(req.merchant_forward_usd_mwh * capture_rate, 2),
            "shape_match_factor": match,
            "discount_rate_pct": req.discount_rate_pct,
        },
        "firming": firming_block,
        "p50": p50,
        "p90": p90,
        "p90_vs_p50_net_revenue_pct": (
            round(100.0 * p90["totals"]["net_revenue_usd"] / p50["totals"]["net_revenue_usd"], 2)
            if p50["totals"]["net_revenue_usd"] else None),
    }


@router.get("/ref/capture-rates", summary="Technology capture-rate defaults by penetration tier (documented modeling defaults)")
def ref_capture_rates():
    """Hand-authored capture-rate (value-factor) defaults with cited basis.

    These are MODELING DEFAULTS, not live market data — see `basis` for the
    published studies they are calibrated to. Also returns the shape-match
    factors and firming premium used by the baseload firming-cost formula.
    """
    return {
        "label": "Modeling defaults — hand-authored, calibrated to published value-factor literature",
        "basis": CAPTURE_RATE_BASIS,
        "capture_rate_tiers": CAPTURE_RATE_TIERS,
        "shape_match_factors": SHAPE_MATCH_FACTORS,
        "default_degradation_pct_yr": DEFAULT_DEGRADATION_PCT_YR,
        "default_firming_premium_usd_mwh": DEFAULT_FIRMING_PREMIUM_USD_MWH,
        "firming_formula": ("firming_cost_t = (block_mwh - min(gen_t, block_mwh) x match) "
                            "x (merchant_forward + firming_premium)"),
    }


# ===========================================================================
# EXTENDED ANALYTICS — hourly shape engine, CfD settlement, credit/CSA,
# sustainability overlay, term-sheet scoring (2026-07 refinement)
# ===========================================================================
#
# All shapes below are hand-authored PARAMETRIC MODELING ARCHETYPES for a
# mid-latitude system (labeled, editable via custom 96-point arrays). They
# are deterministic closed-form curves — no PRNG, no metered data.

SEASONS = ["winter", "spring", "summer", "autumn"]
SEASON_DAYS = {"winter": 90, "spring": 92, "summer": 92, "autumn": 91}  # = 365
HOURS_PER_DAY = 24
N_SHAPE_POINTS = 96  # 24 h x 4 seasons, season-major order (winter..autumn)

# Solar archetype: half-sine bell raised to 1.5 between seasonal sunrise and
# sunset (mid-latitude ~40-50N daylight windows), scaled by a seasonal
# insolation amplitude. Basis: standard clear-sky PV production shape
# (bell ~ sin^1.5 approximates GHI-driven AC output incl. clipping).
SOLAR_SHAPE_PARAMS = {
    "winter": {"sunrise": 8.0, "sunset": 16.5, "amplitude": 0.55},
    "spring": {"sunrise": 6.5, "sunset": 18.5, "amplitude": 1.10},
    "summer": {"sunrise": 5.5, "sunset": 20.5, "amplitude": 1.35},
    "autumn": {"sunrise": 7.0, "sunset": 17.5, "amplitude": 0.90},
}
SOLAR_BELL_EXPONENT = 1.5

# Wind archetype: mild night-peaking diurnal cosine (onshore boundary-layer
# decoupling — output peaks overnight) + winter-peaking seasonal multiplier.
# Basis: typical N-hemisphere onshore wind diurnal/seasonal climatology
# (e.g. IEA Wind / TSO fleet averages) — hand-authored archetype.
WIND_SHAPE_PARAMS = {
    "diurnal_amplitude": 0.15,   # +/-15% around the seasonal mean
    "diurnal_peak_hour": 3,      # 03:00 local — nocturnal jet archetype
    "seasonal": {"winter": 1.25, "spring": 1.00, "summer": 0.75, "autumn": 1.05},
}

# Price archetype: hand-authored day-ahead hourly multiplier ladder (morning
# shoulder, midday solar dip, evening peak) x seasonal level, normalized so
# the time-weighted annual mean equals the flat forward EXACTLY. Basis:
# stylized European/US day-ahead shape in a mid-solar-penetration system.
PRICE_HOUR_MULT = [
    0.80, 0.78, 0.76, 0.76, 0.78, 0.84,   # 00-05  overnight trough
    0.95, 1.12, 1.18, 1.08, 0.98, 0.90,   # 06-11  morning ramp then solar dip
    0.85, 0.83, 0.85, 0.92, 1.02, 1.18,   # 12-17  midday dip -> evening ramp
    1.32, 1.28, 1.15, 1.02, 0.92, 0.85,   # 18-23  evening peak decay
]
PRICE_SEASON_MULT = {"winter": 1.14, "spring": 0.95, "summer": 0.98, "autumn": 0.93}

# Load archetypes (dimensionless, normalized to the annual load input).
LOAD_SHAPE_ARCHETYPES: Dict[str, List[float]] = {
    # flat: 24/7 constant offtake (data-center / electrolyzer baseload)
    "flat": [1.0] * 24,
    # daytime commercial: 07-19 business load, low nights/weekends-averaged
    "daytime_commercial": [0.55, 0.52, 0.50, 0.50, 0.52, 0.60,
                           0.75, 0.95, 1.20, 1.35, 1.40, 1.42,
                           1.40, 1.38, 1.38, 1.35, 1.28, 1.15,
                           1.00, 0.85, 0.75, 0.68, 0.62, 0.58],
    # evening residential: morning bump + strong 18-22 peak
    "evening_residential": [0.70, 0.62, 0.58, 0.56, 0.58, 0.68,
                            0.90, 1.05, 1.00, 0.92, 0.88, 0.90,
                            0.92, 0.90, 0.90, 0.95, 1.08, 1.30,
                            1.48, 1.50, 1.40, 1.20, 1.00, 0.82],
}
LOAD_ARCHETYPE_BASIS = (
    "Hand-authored dimensionless load archetypes (flat 24/7, daytime "
    "commercial 07-19, evening residential 18-22 peak) — stylized profiles "
    "for 24/7 CFE screening, not metered load. Supply a custom 96-point "
    "array for transaction work."
)

# Lifecycle carbon intensity defaults (median, gCO2e/kWh) — IPCC AR5 Annex III
# / NREL LCA harmonization medians. Used only for the EU Taxonomy 100 g screen.
LIFECYCLE_G_CO2_KWH = {"solar": 41.0, "wind": 12.0}
EU_TAXONOMY_THRESHOLD_G_KWH = 100.0  # EU Taxonomy Climate Delegated Act, electricity generation TSC

# CSA downgrade-trigger grid: threshold multiplier applied to the negotiated
# base threshold by counterparty rating (hand-authored MARKET-CONVENTION
# archetype of a ratings-based CSA — actual CSAs are negotiated).
CSA_DOWNGRADE_GRID = [
    {"rating": "AAA", "threshold_multiplier": 2.0, "ia_multiplier": 0.0},
    {"rating": "AA",  "threshold_multiplier": 1.5, "ia_multiplier": 0.0},
    {"rating": "A",   "threshold_multiplier": 1.0, "ia_multiplier": 0.5},
    {"rating": "BBB", "threshold_multiplier": 0.5, "ia_multiplier": 1.0},
    {"rating": "BB",  "threshold_multiplier": 0.1, "ia_multiplier": 1.5},
    {"rating": "B",   "threshold_multiplier": 0.0, "ia_multiplier": 2.0},
    {"rating": "CCC", "threshold_multiplier": 0.0, "ia_multiplier": 3.0},
]

# Term-sheet scoring weights (visible, overridable; re-normalized if edited).
DEFAULT_SCORE_WEIGHTS = {
    "price_vs_market": 0.30,
    "tenor": 0.15,
    "credit": 0.20,
    "structure_flexibility": 0.15,
    "sustainability": 0.20,
}
CREDIT_SCORE_MAP = {"AAA": 100, "AA": 92, "A": 82, "BBB": 68, "BB": 45, "B": 30,
                    "CCC": 15, "unrated_ig": 55, "unrated_sub_ig": 30, "unrated": 40,
                    "sovereign": 90, "utility": 75}
STRUCTURE_FLEX_BASE = {"pay_as_produced": 90.0, "solar_shaped": 65.0, "baseload": 40.0}


def _season_hour_weight(season: str) -> float:
    """Hours per year represented by one (season, hour) shape point."""
    return float(SEASON_DAYS[season])  # 1 h/day x days in season


def _solar_unit_shape(season: str) -> List[float]:
    """Unnormalized solar bell for one season (24 values).

    bell(h) = amplitude x sin(pi * (h+0.5 - sunrise)/(sunset - sunrise)) ^ 1.5
    inside the daylight window, else 0. Documented parametric archetype.
    """
    p = SOLAR_SHAPE_PARAMS[season]
    out = []
    for h in range(HOURS_PER_DAY):
        hc = h + 0.5  # hour-center convention
        if p["sunrise"] < hc < p["sunset"]:
            x = math.sin(math.pi * (hc - p["sunrise"]) / (p["sunset"] - p["sunrise"]))
            out.append(p["amplitude"] * (x ** SOLAR_BELL_EXPONENT))
        else:
            out.append(0.0)
    return out


def _wind_unit_shape(season: str) -> List[float]:
    """Unnormalized wind diurnal shape for one season (24 values).

    shape(h) = seasonal_mult x (1 + a x cos(2*pi*(h - peak)/24)),  a = 0.15.
    """
    p = WIND_SHAPE_PARAMS
    sm = p["seasonal"][season]
    return [sm * (1.0 + p["diurnal_amplitude"]
                  * math.cos(2.0 * math.pi * (h - p["diurnal_peak_hour"]) / 24.0))
            for h in range(HOURS_PER_DAY)]


def _normalize_component(unit: Dict[str, List[float]], capacity_mw: float,
                         cf_pct: float) -> Dict[str, List[float]]:
    """Scale a unit shape so its annual energy = MW x 8760 x CF (exact)."""
    annual_unit = sum(_season_hour_weight(s) * sum(unit[s]) for s in SEASONS)
    target = capacity_mw * HOURS_PER_YEAR * (cf_pct / 100.0)
    k = target / annual_unit if annual_unit > 0 else 0.0
    return {s: [v * k for v in unit[s]] for s in SEASONS}


def _default_price_shape(forward: float) -> Dict[str, List[float]]:
    """Archetype price shape normalized so time-weighted mean == forward."""
    raw = {s: [PRICE_HOUR_MULT[h] * PRICE_SEASON_MULT[s] for h in range(HOURS_PER_DAY)]
           for s in SEASONS}
    mean = (sum(_season_hour_weight(s) * sum(raw[s]) for s in SEASONS)
            / float(HOURS_PER_YEAR / HOURS_PER_DAY * HOURS_PER_DAY))  # = 8760 pts
    return {s: [forward * v / mean for v in raw[s]] for s in SEASONS}


def _unflatten_96(arr: List[float]) -> Dict[str, List[float]]:
    """Season-major 96-array -> {season: [24]} (winter, spring, summer, autumn)."""
    return {s: [float(x) for x in arr[i * 24:(i + 1) * 24]] for i, s in enumerate(SEASONS)}


def _flatten_96(shape: Dict[str, List[float]]) -> List[float]:
    return [shape[s][h] for s in SEASONS for h in range(HOURS_PER_DAY)]


def _apply_negative_hours(price: Dict[str, List[float]], share_pct: float,
                          level: float) -> Dict[str, List[float]]:
    """Force the lowest-priced share_pct of annual hours to `level` (<= 0).

    Deterministic: points ranked by price ascending, converted until the
    cumulative hour share reaches share_pct. Models negative-price hours
    that the default archetype (a mean-anchored shape) does not contain.
    """
    if share_pct <= 0:
        return price
    pts = [(price[s][h], s, h) for s in SEASONS for h in range(HOURS_PER_DAY)]
    pts.sort(key=lambda x: x[0])
    out = {s: list(price[s]) for s in SEASONS}
    cum_hours = 0.0
    for p, s, h in pts:
        if cum_hours / HOURS_PER_YEAR * 100.0 >= share_pct:
            break
        out[s][h] = level
        cum_hours += _season_hour_weight(s)
    return out


def _shape_stats(gen: Dict[str, List[float]], price: Dict[str, List[float]]) -> dict:
    """Capture rate + seasonal table + shape/seasonal decomposition.

    capture_price = sum(gen_hs x price_hs x days_s) / sum(gen_hs x days_s)
    avg_price     = time-weighted mean price
    capture_rate  = capture_price / avg_price
    Decomposition: seasonal component uses season-average gen & price only
    (kills the diurnal structure); diurnal residual = total / seasonal.
    """
    tot_gen_mwh = 0.0
    tot_gen_rev = 0.0
    tot_price_hours = 0.0
    seasonal = []
    seas_gen, seas_price = {}, {}
    for s in SEASONS:
        w = _season_hour_weight(s)
        g_mwh = w * sum(gen[s])
        rev = w * sum(gen[s][h] * price[s][h] for h in range(HOURS_PER_DAY))
        p_avg = sum(price[s]) / HOURS_PER_DAY
        cap_s = (rev / g_mwh / p_avg) if g_mwh > 0 and p_avg != 0 else None
        seasonal.append({
            "season": s,
            "generation_mwh": round(g_mwh, 1),
            "avg_price_usd_mwh": round(p_avg, 2),
            "capture_price_usd_mwh": round(rev / g_mwh, 2) if g_mwh > 0 else None,
            "capture_rate": round(cap_s, 4) if cap_s is not None else None,
        })
        seas_gen[s], seas_price[s] = g_mwh, p_avg
        tot_gen_mwh += g_mwh
        tot_gen_rev += rev
        tot_price_hours += w * sum(price[s])
    avg_price = tot_price_hours / HOURS_PER_YEAR
    capture_price = tot_gen_rev / tot_gen_mwh if tot_gen_mwh > 0 else 0.0
    capture_rate = capture_price / avg_price if avg_price != 0 else 0.0
    # seasonal-only capture (season-average gen vs season-average price)
    seas_num = sum(seas_gen[s] * seas_price[s] for s in SEASONS)
    seasonal_capture = (seas_num / tot_gen_mwh / avg_price) if tot_gen_mwh > 0 and avg_price != 0 else 0.0
    diurnal_capture = capture_rate / seasonal_capture if seasonal_capture != 0 else 0.0
    return {
        "annual_generation_mwh": round(tot_gen_mwh, 0),
        "time_weighted_avg_price_usd_mwh": round(avg_price, 3),
        "capture_price_usd_mwh": round(capture_price, 3),
        "capture_rate": round(capture_rate, 4),
        "capture_rate_pct": round(capture_rate * 100.0, 2),
        "decomposition": {
            "seasonal_component": round(seasonal_capture, 4),
            "diurnal_component": round(diurnal_capture, 4),
            "identity": "capture_rate = seasonal_component x diurnal_component",
            "note": ("seasonal_component prices season-average generation at "
                     "season-average prices (no diurnal detail); the diurnal "
                     "residual isolates within-day shape/cannibalization."),
        },
        "seasonal_table": seasonal,
    }


class ShapeAnalysisRequest(BaseModel):
    """Inputs for the 96-point shape engine + sustainability overlay."""

    technology: str = Field("solar", description="solar | wind | hybrid")
    # single-technology sizing
    capacity_mw: float = Field(100.0, gt=0, le=10000)
    capacity_factor_pct: float = Field(24.0, gt=0, le=80)
    # hybrid sizing (used when technology='hybrid')
    solar_mw: Optional[float] = Field(None, ge=0, le=10000)
    solar_cf_pct: float = Field(24.0, gt=0, le=80)
    wind_mw: Optional[float] = Field(None, ge=0, le=10000)
    wind_cf_pct: float = Field(32.0, gt=0, le=80)

    # price shape
    merchant_forward_usd_mwh: float = Field(42.0, ge=0)
    price_shape_usd_mwh: Optional[List[float]] = Field(
        None, description="Custom 96-point price array (season-major winter/spring/summer/autumn x 24h); None -> documented archetype anchored to the flat forward")
    negative_hour_share_pct: float = Field(0.0, ge=0, le=40,
                                           description="Share of annual hours forced to the negative price level (lowest-priced points first, deterministic)")
    negative_price_level_usd_mwh: float = Field(-10.0, le=0)
    strike_usd_mwh: float = Field(45.0, ge=0,
                                  description="CfD strike used to value the negative-price clause")

    # hourly curtailment vs a shared connection
    connection_cap_mw: Optional[float] = Field(None, gt=0,
                                               description="Grid connection cap; enables hourly curtailment block")

    # sustainability overlay
    load_shape: str = Field("flat", description="flat | daytime_commercial | evening_residential | custom")
    load_shape_custom: Optional[List[float]] = Field(None, description="Custom 96-point load shape (dimensionless)")
    annual_load_mwh: Optional[float] = Field(None, gt=0,
                                             description="Annual load for CFE matching; None -> equals annual (net) generation")
    grid_intensity_tco2_mwh: float = Field(0.35, ge=0, le=2,
                                           description="User grid MARGINAL emission factor, tCO2e/MWh (labeled input)")
    carbon_shadow_price_usd_t: float = Field(85.0, ge=0, le=1000,
                                             description="Shadow carbon price for the carbon-adjusted effective price (labeled)")
    rec_price_usd_mwh: float = Field(3.0, ge=0)
    ppa_price_usd_mwh: float = Field(45.0, ge=0)
    lifecycle_intensity_g_kwh: Optional[float] = Field(
        None, ge=0, le=2000,
        description="Lifecycle gCO2e/kWh for the EU Taxonomy screen; None -> IPCC/NREL median by technology")


@router.post("/shape-analysis", summary="96-point shape engine: capture rate as OUTPUT, curtailment, 24/7 CFE, carbon overlay")
def shape_analysis(req: ShapeAnalysisRequest):
    """Build 24h x 4-season generation/price/load shapes and derive analytics.

    Shapes are documented parametric archetypes (GET /ref/shape-archetypes);
    every derived figure is a closed-form function of the shapes and user
    inputs. NO PRNG. Capture rate here is an OUTPUT — pass it back into
    POST /structure as capture_rate_pct (the input path remains an override).
    """
    tech = req.technology.lower().strip()
    if tech not in ("solar", "wind", "hybrid"):
        raise HTTPException(422, "technology must be solar | wind | hybrid")
    if req.price_shape_usd_mwh is not None and len(req.price_shape_usd_mwh) != N_SHAPE_POINTS:
        raise HTTPException(422, f"price_shape_usd_mwh must have exactly {N_SHAPE_POINTS} points")
    if req.load_shape_custom is not None and len(req.load_shape_custom) != N_SHAPE_POINTS:
        raise HTTPException(422, f"load_shape_custom must have exactly {N_SHAPE_POINTS} points")

    # -- generation shape (MW by season-hour) --------------------------------
    components = {}
    if tech in ("solar", "hybrid"):
        s_mw = req.solar_mw if tech == "hybrid" else req.capacity_mw
        s_cf = req.solar_cf_pct if tech == "hybrid" else req.capacity_factor_pct
        if s_mw and s_mw > 0:
            components["solar"] = _normalize_component(
                {s: _solar_unit_shape(s) for s in SEASONS}, s_mw, s_cf)
    if tech in ("wind", "hybrid"):
        w_mw = req.wind_mw if tech == "hybrid" else req.capacity_mw
        w_cf = req.wind_cf_pct if tech == "hybrid" else req.capacity_factor_pct
        if w_mw and w_mw > 0:
            components["wind"] = _normalize_component(
                {s: _wind_unit_shape(s) for s in SEASONS}, w_mw, w_cf)
    if not components:
        raise HTTPException(422, "hybrid requires solar_mw and/or wind_mw > 0")
    gen = {s: [sum(c[s][h] for c in components.values()) for h in range(HOURS_PER_DAY)]
           for s in SEASONS}

    # -- price shape ----------------------------------------------------------
    if req.price_shape_usd_mwh is not None:
        price = _unflatten_96(req.price_shape_usd_mwh)
        price_source = "user_96_point_array"
    else:
        price = _default_price_shape(req.merchant_forward_usd_mwh)
        price_source = "documented_archetype (normalized so time-weighted mean == flat forward)"
    price = _apply_negative_hours(price, req.negative_hour_share_pct,
                                  req.negative_price_level_usd_mwh)

    stats = _shape_stats(gen, price)

    # -- negative-price clause value ------------------------------------------
    # Two-way CfD: in hours with price < 0 the seller would RECEIVE
    # (strike - price) > strike. A negative-price clause suspends settlement
    # there, so its value TO THE OFFTAKER (= cost to the seller) is:
    #   sum over p<0 points of gen_hs x (strike - p_hs) x days_s   >= 0
    neg_hours = 0.0
    neg_gen_mwh = 0.0
    clause_value = 0.0
    for s in SEASONS:
        w = _season_hour_weight(s)
        for h in range(HOURS_PER_DAY):
            if price[s][h] < 0:
                neg_hours += w
                neg_gen_mwh += w * gen[s][h]
                clause_value += w * gen[s][h] * (req.strike_usd_mwh - price[s][h])
    negative_block = {
        "negative_hour_share_input_pct": req.negative_hour_share_pct,
        "negative_hours_per_year": round(neg_hours, 0),
        "generation_in_negative_hours_mwh": round(neg_gen_mwh, 1),
        "clause_value_usd_yr": round(clause_value, 0),
        "clause_value_usd_mwh_of_total_gen": (
            round(clause_value / stats["annual_generation_mwh"], 3)
            if stats["annual_generation_mwh"] else 0.0),
        "convention": ("Value to the OFFTAKER (= settlement the seller forgoes): "
                       "sum_{p<0} gen x (strike - p) x hours. Always >= 0 and "
                       "non-decreasing in the negative-hour share."),
    }

    # -- hourly curtailment vs connection cap ---------------------------------
    curtailment_block = None
    net_gen = gen
    if req.connection_cap_mw is not None:
        cap = req.connection_cap_mw
        curt = {s: [max(0.0, gen[s][h] - cap) for h in range(HOURS_PER_DAY)] for s in SEASONS}
        net_gen = {s: [gen[s][h] - curt[s][h] for h in range(HOURS_PER_DAY)] for s in SEASONS}
        annual_curt = sum(_season_hour_weight(s) * sum(curt[s]) for s in SEASONS)
        per_season = [{
            "season": s,
            "daily_curtailed_mwh": round(sum(curt[s]), 2),
            "curtailed_hours_per_day": sum(1 for v in curt[s] if v > 0),
            "peak_exceedance_mw": round(max(curt[s]) if curt[s] else 0.0, 2),
        } for s in SEASONS]
        peak_combined = max(max(gen[s]) for s in SEASONS)
        curtailment_block = {
            "connection_cap_mw": cap,
            "peak_combined_output_mw": round(peak_combined, 2),
            "annual_curtailed_mwh": round(annual_curt, 0),
            "curtailment_pct_of_gen": (
                round(100.0 * annual_curt / stats["annual_generation_mwh"], 3)
                if stats["annual_generation_mwh"] else 0.0),
            "per_season": per_season,
            "method": ("Hourly overlap math on the 96-point archetype: "
                       "curtailed_hs = max(0, gen_hs - cap); annual = "
                       "sum(curtailed_hs x days_s). Replaces the coincidence-"
                       "factor screening estimate with shape-resolved overlap."),
        }

    # -- 24/7 CFE hourly matching ---------------------------------------------
    net_annual = sum(_season_hour_weight(s) * sum(net_gen[s]) for s in SEASONS)
    if req.load_shape == "custom" and req.load_shape_custom is not None:
        load_unit = _unflatten_96(req.load_shape_custom)
        load_source = "user_96_point_array"
    else:
        key = req.load_shape if req.load_shape in LOAD_SHAPE_ARCHETYPES else "flat"
        load_unit = {s: list(LOAD_SHAPE_ARCHETYPES[key]) for s in SEASONS}
        load_source = f"archetype:{key} ({LOAD_ARCHETYPE_BASIS})"
    annual_load = req.annual_load_mwh if req.annual_load_mwh else net_annual
    load_energy_unit = sum(_season_hour_weight(s) * sum(load_unit[s]) for s in SEASONS)
    kL = annual_load / load_energy_unit if load_energy_unit > 0 else 0.0
    load = {s: [v * kL for v in load_unit[s]] for s in SEASONS}

    matched_mwh = 0.0
    cfe_seasonal = []
    for s in SEASONS:
        w = _season_hour_weight(s)
        m = w * sum(min(net_gen[s][h], load[s][h]) for h in range(HOURS_PER_DAY))
        l = w * sum(load[s])
        matched_mwh += m
        cfe_seasonal.append({"season": s, "matched_mwh": round(m, 0),
                             "load_mwh": round(l, 0),
                             "cfe_pct": round(100.0 * m / l, 2) if l > 0 else None})
    cfe_pct = 100.0 * matched_mwh / annual_load if annual_load > 0 else 0.0
    surplus_mwh = net_annual - matched_mwh

    # -- emissions & carbon-adjusted effective price ---------------------------
    avoided_tco2 = matched_mwh * req.grid_intensity_tco2_mwh
    avoided_value = avoided_tco2 * req.carbon_shadow_price_usd_t
    # Carbon-adjusted effective PPA price (BUYER view, labeled): headline
    # price net of the bundled REC value and the shadow-priced avoided carbon
    # per matched MWh. NOT a cash price — a comparability metric.
    carbon_credit_per_mwh = (avoided_value / matched_mwh) if matched_mwh > 0 else 0.0
    effective_price = req.ppa_price_usd_mwh - req.rec_price_usd_mwh - carbon_credit_per_mwh
    if req.lifecycle_intensity_g_kwh is not None:
        lci = req.lifecycle_intensity_g_kwh
        lci_source = "user_input"
    elif tech == "hybrid":
        tot_e = sum(sum(_season_hour_weight(s) * sum(c[s]) for s in SEASONS)
                    for c in components.values())
        lci = (sum(LIFECYCLE_G_CO2_KWH[k]
                   * sum(_season_hour_weight(s) * sum(c[s]) for s in SEASONS)
                   for k, c in components.items()) / tot_e) if tot_e > 0 else 0.0
        lci_source = "generation-weighted IPCC AR5 / NREL LCA medians (solar 41, wind 12 gCO2e/kWh)"
    else:
        lci = LIFECYCLE_G_CO2_KWH[tech]
        lci_source = "IPCC AR5 Annex III / NREL LCA harmonization median (labeled default)"

    sustainability_block = {
        "cfe": {
            "load_shape_source": load_source,
            "annual_load_mwh": round(annual_load, 0),
            "hourly_matched_mwh": round(matched_mwh, 0),
            "cfe_score_pct": round(cfe_pct, 2),
            "surplus_gen_mwh": round(surplus_mwh, 0),
            "seasonal": cfe_seasonal,
            "method": "24/7 CFE = sum(min(gen_hs, load_hs) x days) / annual load — hourly matching on the 96-point shapes",
        },
        "emissions": {
            "grid_marginal_intensity_tco2_mwh": req.grid_intensity_tco2_mwh,
            "avoided_tco2e_yr": round(avoided_tco2, 1),
            "formula": "avoided tCO2e/yr = hourly-MATCHED volume x user grid marginal intensity",
            "carbon_shadow_price_usd_t": req.carbon_shadow_price_usd_t,
            "avoided_carbon_value_usd_yr": round(avoided_value, 0),
        },
        "carbon_adjusted_price": {
            "headline_ppa_usd_mwh": req.ppa_price_usd_mwh,
            "less_rec_usd_mwh": req.rec_price_usd_mwh,
            "less_avoided_carbon_usd_mwh": round(carbon_credit_per_mwh, 3),
            "effective_ppa_usd_mwh": round(effective_price, 2),
            "label": ("Comparability metric, not a cash price: headline - REC - "
                      "(avoided tCO2 x shadow price)/matched MWh"),
        },
        "eu_taxonomy_screen": {
            "lifecycle_intensity_g_co2e_kwh": round(lci, 1),
            "intensity_source": lci_source,
            "threshold_g_co2e_kwh": EU_TAXONOMY_THRESHOLD_G_KWH,
            "pass": lci < EU_TAXONOMY_THRESHOLD_G_KWH,
            "basis": "EU Taxonomy Climate Delegated Act (2021/2139) electricity generation TSC: lifecycle < 100 gCO2e/kWh",
        },
    }

    return {
        "module": "ppa-structuring-desk/shape-engine",
        "label": ("DOCUMENTED PARAMETRIC MODELING ARCHETYPES (mid-latitude) — "
                  "not metered data; see GET /ref/shape-archetypes"),
        "technology": tech,
        "components_mw": {
            k: (req.solar_mw if (k == "solar" and tech == "hybrid")
                else req.wind_mw if (k == "wind" and tech == "hybrid")
                else req.capacity_mw)
            for k in components
        },
        "season_days": SEASON_DAYS,
        "shapes": {
            "generation_mw": {s: [round(v, 3) for v in gen[s]] for s in SEASONS},
            "net_generation_mw": ({s: [round(v, 3) for v in net_gen[s]] for s in SEASONS}
                                  if curtailment_block else None),
            "price_usd_mwh": {s: [round(v, 3) for v in price[s]] for s in SEASONS},
            "load_mw": {s: [round(v, 3) for v in load[s]] for s in SEASONS},
            "generation_mw_96": [round(v, 4) for v in _flatten_96(gen)],
            "price_usd_mwh_96": [round(v, 4) for v in _flatten_96(price)],
            "price_source": price_source,
        },
        "capture": stats,
        "negative_price": negative_block,
        "curtailment": curtailment_block,
        "sustainability": sustainability_block,
    }


# ---------------------------------------------------------------------------
# CfD / virtual-PPA settlement
# ---------------------------------------------------------------------------

class SettlementRequest(BaseModel):
    """Two-way CfD settlement over the 96-point shapes (or flat fallbacks)."""

    strike_usd_mwh: float = Field(50.0, ge=0)
    strike_escalation_pct_yr: float = Field(0.0, ge=-5, le=10)
    tenor_years: int = Field(10, ge=1, le=35)
    annual_volume_mwh: float = Field(250000.0, gt=0,
                                     description="Settled contract volume per year (distributed pro-rata to the generation shape)")
    merchant_forward_usd_mwh: float = Field(42.0, ge=0)
    price_shape_usd_mwh: Optional[List[float]] = Field(
        None, description="96-point market reference shape (e.g. shapes.price_usd_mwh_96 from /shape-analysis); None -> flat forward")
    gen_shape_mw: Optional[List[float]] = Field(
        None, description="96-point volume-weighting shape (shapes.generation_mw_96); None -> flat")
    negative_price_clause: bool = Field(False, description="No settlement in hours with market price < 0")
    floor_usd_mwh: Optional[float] = Field(None, description="Collar floor on the market reference")
    cap_usd_mwh: Optional[float] = Field(None, description="Collar cap on the market reference")
    basis_usd_mwh: float = Field(0.0, ge=-50, le=50,
                                 description="Expected node - hub basis, $/MWh (user input, labeled)")
    basis_vol_usd_mwh: float = Field(2.0, ge=0, le=50,
                                     description="Basis sigma, $/MWh — band reported as +/-2 sigma (documented, no PRNG)")
    discount_rate_pct: float = Field(7.0, ge=0, le=25)


@router.post("/settlement", summary="Virtual PPA / two-way CfD settlement: per-period cash, negative-price clause, collar, basis")
def cfd_settlement(req: SettlementRequest):
    """Cash-settle a two-way CfD against the shape engine's price shape.

    Per shape point (season s, hour h), with volume v_hs pro-rata to the
    generation shape:  settle_hs = (strike_t - clamp(p_hs, floor, cap)) x v_hs
    Positive = offtaker pays seller. With the negative-price clause, points
    with p_hs < 0 settle 0. Flat-shape identity (verified in QA): the annual
    settlement equals (strike - avg_price) x annual_volume.
    """
    if req.floor_usd_mwh is not None and req.cap_usd_mwh is not None \
            and req.floor_usd_mwh > req.cap_usd_mwh:
        raise HTTPException(422, "floor_usd_mwh must be <= cap_usd_mwh")
    if req.price_shape_usd_mwh is not None and len(req.price_shape_usd_mwh) != N_SHAPE_POINTS:
        raise HTTPException(422, f"price_shape_usd_mwh must have exactly {N_SHAPE_POINTS} points")
    if req.gen_shape_mw is not None and len(req.gen_shape_mw) != N_SHAPE_POINTS:
        raise HTTPException(422, f"gen_shape_mw must have exactly {N_SHAPE_POINTS} points")

    price = (_unflatten_96(req.price_shape_usd_mwh) if req.price_shape_usd_mwh is not None
             else {s: [req.merchant_forward_usd_mwh] * HOURS_PER_DAY for s in SEASONS})
    gshape = (_unflatten_96(req.gen_shape_mw) if req.gen_shape_mw is not None
              else {s: [1.0] * HOURS_PER_DAY for s in SEASONS})

    # volume weights: v_hs = V x (gen_hs x days_s) / sum(gen x days)
    denom = sum(_season_hour_weight(s) * sum(gshape[s]) for s in SEASONS)
    if denom <= 0:
        raise HTTPException(422, "gen_shape_mw must contain positive energy")

    # annual settlement at strike = 1 $/MWh decomposed into a constant part
    # and a price-linked part so escalation reprices cheaply per year
    vol_price_sum = 0.0     # sum(v_hs x clamped_price)
    vol_active = 0.0        # sum(v_hs) over settling points
    avg_price_num = 0.0
    n_hours = 0.0
    for s in SEASONS:
        w = _season_hour_weight(s)
        for h in range(HOURS_PER_DAY):
            p = price[s][h]
            avg_price_num += w * p
            n_hours += w
            v = req.annual_volume_mwh * (gshape[s][h] * w) / denom
            if req.negative_price_clause and p < 0:
                continue  # clause: no settlement in negative-price hours
            p_eff = p
            if req.floor_usd_mwh is not None:
                p_eff = max(p_eff, req.floor_usd_mwh)
            if req.cap_usd_mwh is not None:
                p_eff = min(p_eff, req.cap_usd_mwh)
            vol_active += v
            vol_price_sum += v * p_eff
    avg_price = avg_price_num / n_hours

    r = req.discount_rate_pct / 100.0
    esc = req.strike_escalation_pct_yr / 100.0
    years = []
    total = 0.0
    npv = 0.0
    for t in range(1, req.tenor_years + 1):
        strike_t = req.strike_usd_mwh * ((1.0 + esc) ** (t - 1))
        settle = strike_t * vol_active - vol_price_sum
        total += settle
        npv += settle / ((1.0 + r) ** t)
        years.append({
            "year": t,
            "strike_usd_mwh": round(strike_t, 2),
            "settled_volume_mwh": round(vol_active, 1),
            "settlement_usd": round(settle, 0),
            "direction": "offtaker pays seller" if settle >= 0 else "seller pays offtaker",
        })

    basis_expected = req.basis_usd_mwh * req.annual_volume_mwh
    basis_band = 2.0 * req.basis_vol_usd_mwh * req.annual_volume_mwh
    return {
        "module": "ppa-structuring-desk/settlement",
        "mechanics": ("Two-way CfD per shape point: settle = (strike - clamp(p, floor, cap)) x volume; "
                      "volume pro-rata to the generation shape; negative-price clause skips p<0 points."),
        "inputs_echo": {
            "strike_usd_mwh": req.strike_usd_mwh,
            "annual_volume_mwh": req.annual_volume_mwh,
            "negative_price_clause": req.negative_price_clause,
            "floor_usd_mwh": req.floor_usd_mwh,
            "cap_usd_mwh": req.cap_usd_mwh,
            "price_shape": "user_96_point" if req.price_shape_usd_mwh is not None else "flat_forward",
            "volume_shape": "user_96_point" if req.gen_shape_mw is not None else "flat",
        },
        "reference": {
            "time_weighted_avg_price_usd_mwh": round(avg_price, 3),
            "flat_shape_identity_usd_yr1": round((req.strike_usd_mwh - avg_price) * req.annual_volume_mwh, 0),
            "note": ("On flat gen+price shapes with no clause/collar, year-1 settlement "
                     "== (strike - avg_price) x volume exactly (QA-asserted)."),
        },
        "settled_volume_mwh_yr": round(vol_active, 1),
        "excluded_volume_mwh_yr": round(req.annual_volume_mwh - vol_active, 1),
        "per_year": years,
        "totals": {
            "settlement_usd": round(total, 0),
            "npv_usd": round(npv, 0),
            "avg_settlement_usd_yr": round(total / req.tenor_years, 0),
        },
        "basis_risk": {
            "hub_vs_node_basis_usd_mwh": req.basis_usd_mwh,
            "expected_basis_pnl_usd_yr": round(basis_expected, 0),
            "band_usd_yr": round(basis_band, 0),
            "band_convention": ("+/-2 x basis sigma x volume — documented two-sigma band on the "
                                "user basis-vol input; deterministic, NO PRNG / simulation."),
            "note": ("Virtual PPAs settle at a hub while the project sells at its node; the "
                     "seller keeps node-hub basis. Basis level and vol are USER INPUTS."),
        },
    }


# ---------------------------------------------------------------------------
# Credit & collateral (CSA)
# ---------------------------------------------------------------------------

class CreditExposureRequest(BaseModel):
    """CSA terms vs a documented +/-2-sigma potential-exposure profile."""

    annual_volume_mwh: float = Field(250000.0, gt=0)
    tenor_years: int = Field(10, ge=1, le=35)
    price_sigma_usd_mwh_yr: float = Field(8.0, gt=0, le=100,
                                          description="Annualized forward-price sigma, $/MWh (user percentile input)")
    threshold_usd: float = Field(5_000_000.0, ge=0, description="CSA unsecured threshold")
    independent_amount_usd: float = Field(0.0, ge=0, description="CSA independent amount (IA)")
    mta_usd: float = Field(250_000.0, ge=0, description="Minimum transfer amount")
    counterparty_rating: str = Field("BBB", description="Rating key for the downgrade grid")


@router.post("/credit-exposure", summary="CSA credit support: potential settlement exposure profile + downgrade-trigger table")
def credit_exposure(req: CreditExposureRequest):
    """Potential settlement exposure under a documented 2-sigma price band.

    PE_t = 2 x sigma x sqrt(t) x remaining_volume_t
    where remaining_volume_t = annual_volume x (tenor - t + 1) at the start of
    year t. The sqrt(t) diffusion scaling and the 2-sigma (~97.7th pct one-
    sided) band are stated conventions on the USER sigma input — closed-form,
    no simulation. Collateral call = max(0, PE - threshold) + IA; transfers
    move only in MTA increments (reported, not netted here).
    """
    profile = []
    peak_pe, peak_year = 0.0, 1
    for t in range(1, req.tenor_years + 1):
        remaining = req.annual_volume_mwh * (req.tenor_years - t + 1)
        pe = 2.0 * req.price_sigma_usd_mwh_yr * math.sqrt(t) * remaining
        call = max(0.0, pe - req.threshold_usd) + req.independent_amount_usd
        if pe > peak_pe:
            peak_pe, peak_year = pe, t
        profile.append({
            "year": t,
            "remaining_volume_mwh": round(remaining, 0),
            "price_band_usd_mwh": round(2.0 * req.price_sigma_usd_mwh_yr * math.sqrt(t), 2),
            "potential_exposure_usd": round(pe, 0),
            "collateral_call_usd": round(call, 0),
        })

    downgrade = []
    for row in CSA_DOWNGRADE_GRID:
        thr = req.threshold_usd * row["threshold_multiplier"]
        ia = max(req.independent_amount_usd,
                 req.independent_amount_usd * row["ia_multiplier"]) if req.independent_amount_usd > 0 \
            else req.independent_amount_usd * row["ia_multiplier"]
        call_at_peak = max(0.0, peak_pe - thr) + ia
        downgrade.append({
            "rating": row["rating"],
            "threshold_usd": round(thr, 0),
            "independent_amount_usd": round(ia, 0),
            "collateral_at_peak_pe_usd": round(call_at_peak, 0),
            "is_current": row["rating"] == req.counterparty_rating.upper(),
        })

    return {
        "module": "ppa-structuring-desk/credit-exposure",
        "method": ("PE_t = 2 x sigma x sqrt(t) x remaining_volume_t — documented +/-2-sigma "
                   "diffusion band on the user annual price sigma; deterministic, NO PRNG."),
        "csa_terms": {
            "threshold_usd": req.threshold_usd,
            "independent_amount_usd": req.independent_amount_usd,
            "mta_usd": req.mta_usd,
            "mta_note": "Collateral transfers occur only in MTA-sized increments; profile shows raw calls.",
        },
        "peak": {"year": peak_year, "potential_exposure_usd": round(peak_pe, 0),
                 "collateral_call_usd": round(max(0.0, peak_pe - req.threshold_usd)
                                              + req.independent_amount_usd, 0)},
        "exposure_profile": profile,
        "downgrade_trigger_table": downgrade,
        "downgrade_basis": ("Hand-authored MARKET-CONVENTION archetype of a ratings-based CSA "
                            "grid (threshold shrinks / IA grows on downgrade) — actual CSAs are "
                            "negotiated; edit threshold/IA for transaction work."),
    }


# ---------------------------------------------------------------------------
# Term-sheet scoring & sensitivity
# ---------------------------------------------------------------------------

class TermSheetScoreRequest(BaseModel):
    """Multi-attribute deal score (seller view) with visible weights."""

    structure_request: PPAStructureRequest
    counterparty_rating: str = Field("BBB")
    cfe_score_pct: float = Field(0.0, ge=0, le=100,
                                 description="24/7 CFE score from /shape-analysis (0 if not run)")
    taxonomy_pass: bool = Field(True)
    recs_bundled: bool = Field(True)
    has_collar: bool = Field(False)
    negative_price_clause: bool = Field(False)
    weights: Optional[Dict[str, float]] = Field(
        None, description=f"Override scoring weights; default {DEFAULT_SCORE_WEIGHTS} (re-normalized)")


def _resolved_capture(req: PPAStructureRequest) -> float:
    if req.capture_rate_pct is not None:
        return req.capture_rate_pct / 100.0
    tech = req.technology.lower().strip()
    return _resolve_capture_rate(tech, req.vre_penetration_pct)["capture_rate_pct"] / 100.0


def _npv_for(req: PPAStructureRequest) -> float:
    """P50 NPV via the exact /structure math (used by the sensitivity grid)."""
    tech = req.technology.lower().strip()
    degradation = (req.degradation_pct_yr if req.degradation_pct_yr is not None
                   else DEFAULT_DEGRADATION_PCT_YR[tech])
    capture = _resolved_capture(req)
    return _build_case(req, req.p50_capacity_factor_pct, "P50", capture, degradation)["npv_net_revenue_usd"]


@router.post("/term-sheet-score", summary="Multi-attribute term-sheet score (visible weights) + NPV sensitivity on 6 drivers")
def term_sheet_score(req: TermSheetScoreRequest):
    """Score a term sheet 0-100 (seller view) across five weighted attributes.

    Attribute formulas (all documented, deterministic):
      price_vs_market: 50 at parity with the capture-adjusted market price,
                       +25 points per +10% premium (clamped 0-100)
      tenor:           tenor / 20y x 100 (clamped)
      credit:          rating map (AAA 100 ... CCC 15; see CREDIT_SCORE_MAP)
      structure_flexibility: base by delivery structure (as-produced 90,
                       solar-shaped 65, baseload 40) +10 collar, -10 negative-
                       price clause (clause shifts risk to the seller)
      sustainability:  0.5 x CFE score + 25 x taxonomy pass + 25 x RECs bundled
    Composite = sum(weight_i x score_i), weights visible and overridable.
    """
    sreq = req.structure_request
    tech = sreq.technology.lower().strip()
    if tech not in VALID_TECHNOLOGIES:
        raise HTTPException(422, f"technology must be one of {VALID_TECHNOLOGIES}")
    struct = sreq.structure.lower().strip()
    if struct not in VALID_STRUCTURES:
        raise HTTPException(422, f"structure must be one of {VALID_STRUCTURES}")
    sreq.technology, sreq.structure = tech, struct

    w = dict(DEFAULT_SCORE_WEIGHTS)
    if req.weights:
        for k, v in req.weights.items():
            if k in w and v >= 0:
                w[k] = float(v)
    wsum = sum(w.values()) or 1.0
    w = {k: v / wsum for k, v in w.items()}

    capture = _resolved_capture(sreq)
    capture_price = sreq.merchant_forward_usd_mwh * capture
    ratio = (sreq.ppa_price_usd_mwh / capture_price) if capture_price > 0 else 1.0
    clamp = lambda x: max(0.0, min(100.0, x))  # noqa: E731
    scores = {
        "price_vs_market": clamp(50.0 + (ratio - 1.0) * 250.0),
        "tenor": clamp(sreq.ppa_tenor_years / 20.0 * 100.0),
        "credit": float(CREDIT_SCORE_MAP.get(req.counterparty_rating.upper(),
                                             CREDIT_SCORE_MAP.get(req.counterparty_rating, 40))),
        "structure_flexibility": clamp(STRUCTURE_FLEX_BASE[struct]
                                       + (10.0 if req.has_collar else 0.0)
                                       - (10.0 if req.negative_price_clause else 0.0)),
        "sustainability": clamp(0.5 * req.cfe_score_pct
                                + (25.0 if req.taxonomy_pass else 0.0)
                                + (25.0 if req.recs_bundled else 0.0)),
    }
    composite = sum(w[k] * scores[k] for k in scores)
    band = ("strong" if composite >= 75 else "solid" if composite >= 60
            else "mixed" if composite >= 45 else "weak")

    # -- NPV sensitivity: +/-10% on 6 drivers, re-running the /structure math --
    base_npv = _npv_for(sreq)
    resolved_capture_pct = capture * 100.0
    drivers = [
        ("ppa_price_usd_mwh", "PPA price"),
        ("merchant_forward_usd_mwh", "Merchant forward"),
        ("capture_rate_pct", "Capture rate"),
        ("p50_capacity_factor_pct", "P50 capacity factor"),
        ("discount_rate_pct", "Discount rate"),
        ("rec_price_usd_mwh", "REC price"),
    ]
    sensitivity = []
    for field, label in drivers:
        row = {"driver": label, "field": field}
        for direction, mult in (("down_10", 0.90), ("up_10", 1.10)):
            r2 = sreq.model_copy(deep=True)
            if field == "capture_rate_pct":
                r2.capture_rate_pct = min(120.0, resolved_capture_pct * mult)
            elif field == "p50_capacity_factor_pct":
                new_p50 = min(80.0, sreq.p50_capacity_factor_pct * mult)
                r2.p50_capacity_factor_pct = new_p50
                r2.p90_capacity_factor_pct = min(r2.p90_capacity_factor_pct, new_p50)
            else:
                setattr(r2, field, getattr(sreq, field) * mult)
            npv = _npv_for(r2)
            row[direction + "_npv_usd"] = round(npv, 0)
            row[direction + "_delta_pct"] = (round(100.0 * (npv - base_npv) / base_npv, 2)
                                             if base_npv else None)
        sensitivity.append(row)

    return {
        "module": "ppa-structuring-desk/term-sheet-score",
        "weights": {k: round(v, 4) for k, v in w.items()},
        "attribute_scores": {k: round(v, 1) for k, v in scores.items()},
        "attribute_formulas": {
            "price_vs_market": f"50 + (ppa/capture_price - 1) x 250 -> ratio {round(ratio, 3)} vs capture price ${round(capture_price, 2)}/MWh",
            "tenor": f"tenor/20y x 100 -> {sreq.ppa_tenor_years}y",
            "credit": f"rating map [{req.counterparty_rating}]",
            "structure_flexibility": f"base[{struct}] {STRUCTURE_FLEX_BASE[struct]} +10 collar / -10 neg-price clause",
            "sustainability": f"0.5 x CFE({req.cfe_score_pct}%) + 25 x taxonomy({req.taxonomy_pass}) + 25 x RECs({req.recs_bundled})",
        },
        "composite_score": round(composite, 1),
        "band": band,
        "sensitivity": {
            "base_npv_usd": round(base_npv, 0),
            "method": "+/-10% on each driver, P50 case, exact /structure math re-run (capture resolved to its tier default before shocking)",
            "table": sensitivity,
        },
    }


# ---------------------------------------------------------------------------
# Reference endpoints for the extended analytics
# ---------------------------------------------------------------------------

@router.get("/ref/shape-archetypes", summary="Every parametric shape constant with its basis (documented modeling archetypes)")
def ref_shape_archetypes():
    """Full disclosure of the shape engine's parametric archetypes."""
    return {
        "label": "Hand-authored parametric modeling archetypes (mid-latitude) — NOT metered data",
        "season_days": SEASON_DAYS,
        "solar": {
            "params": SOLAR_SHAPE_PARAMS,
            "bell_exponent": SOLAR_BELL_EXPONENT,
            "formula": "gen(h) = amplitude x sin(pi x (h+0.5 - sunrise)/(sunset - sunrise))^1.5 inside daylight, else 0; normalized so annual energy = MW x 8760 x CF",
        },
        "wind": {
            "params": WIND_SHAPE_PARAMS,
            "formula": "gen(h) = seasonal x (1 + 0.15 x cos(2pi(h - 3)/24)); night-peaking onshore archetype; normalized to MW x 8760 x CF",
        },
        "price": {
            "hour_multipliers": PRICE_HOUR_MULT,
            "season_multipliers": PRICE_SEASON_MULT,
            "normalization": "scaled so the time-weighted annual mean equals the flat forward exactly (capture of a flat generator = 1.0 by construction)",
        },
        "load_archetypes": LOAD_SHAPE_ARCHETYPES,
        "load_basis": LOAD_ARCHETYPE_BASIS,
        "lifecycle_g_co2e_kwh": LIFECYCLE_G_CO2_KWH,
        "eu_taxonomy_threshold_g_kwh": EU_TAXONOMY_THRESHOLD_G_KWH,
        "csa_downgrade_grid": CSA_DOWNGRADE_GRID,
        "score_weights_default": DEFAULT_SCORE_WEIGHTS,
    }


@router.get("/ref/rec-forward", summary="REC/GoO vintage-forward strip from spot + drift (documented compounding, labeled)")
def ref_rec_forward(
    spot_usd_mwh: float = Query(3.0, ge=0, le=100),
    drift_pct_yr: float = Query(3.0, ge=-20, le=30),
    vintages: int = Query(6, ge=1, le=15),
):
    """Vintage-forward REC/GoO strip: forward_k = spot x (1 + drift)^k.

    The drift is a USER assumption (labeled) — GoO/REC markets have no deep
    liquid long-dated curve; this is a stated compounding convention, not a
    market quote.
    """
    strip = [{"vintage_offset_years": k,
              "vintage_label": f"Y+{k}",
              "forward_usd_mwh": round(spot_usd_mwh * ((1.0 + drift_pct_yr / 100.0) ** k), 3)}
             for k in range(vintages)]
    return {
        "label": "Documented compounding convention on USER spot + drift inputs — not market quotes",
        "formula": "forward_k = spot x (1 + drift)^k",
        "spot_usd_mwh": spot_usd_mwh,
        "drift_pct_yr": drift_pct_yr,
        "strip": strip,
    }
