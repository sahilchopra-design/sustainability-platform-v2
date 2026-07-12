"""BESS Revenue Stacking Engine — deterministic multi-stream battery economics.

Route prefix: /api/v1/bess-stacking

Endpoints
---------
POST /stack                 — per-year revenue stack (arbitrage + frequency response +
                              capacity market), calendar+cycle degradation, warranty
                              envelope checks, augmentation schedule, opex, net margin,
                              optional intraday switching layer and carbon-arbitrage
                              analytics. Pure deterministic math from the request
                              inputs; NO PRNG anywhere.
POST /dispatch-compare      — one-day optimal (dynamic-programming) dispatch vs the
                              greedy screening dispatch: margins, uplift %, hourly
                              SoC path (documented; deterministic).
POST /fr-cooptimize         — frequency-response MW-reservation sweep: reserve X MW
                              for FR (24/7), run optimal arbitrage on the remaining
                              power, report the forgone-arbitrage opportunity cost
                              and the profit-maximising split (documented sweep).
POST /structures            — toll vs merchant vs hybrid (floor + upside share)
                              comparison at P50 and P90 price-spread inputs.
POST /augmentation-optimize — augmentation-trigger sweep minimising $ per MWh of
                              lifetime delivered energy (documented sweep, not PRNG).
GET  /ref/defaults          — documented default 24-hour price shape and market
                              parameter defaults (labeled modeling conventions).
GET  /ref/market-menus      — capacity-derating-by-duration tables (GB / PJM style,
                              labeled) + ancillary product menu ($/MW-yr, labeled).

Arbitrage dispatch algorithms (documented; returned in the response under
`methodology.arbitrage_dispatch`)
--------------------------------------------------------------------------
GREEDY (screening, default — unchanged legacy behaviour):

1. FR carve-out: `fr_committed_hours_per_day` hours are removed from the
   arbitrage window. Convention: the operator schedules the FR commitment in
   the hours whose prices sit closest to the daily mean (shoulder hours),
   which are the least valuable for arbitrage. The remaining hours form the
   arbitrage window.
2. Sort the window's hours by price ascending. Greedily pair the cheapest
   remaining hour (charge) with the dearest remaining hour (discharge).
3. Each pair moves one hour of charging at full power P (MW): energy stored
   and re-delivered = P x RTE (round-trip efficiency applied once, on
   delivered energy). Delivered energy per pair is additionally capped by the
   remaining daily throughput budget = cycles_per_day_cap x usable_mwh.
4. A pair is dispatched only if its margin is positive:
       margin = e_out x P_discharge - (e_out / RTE) x P_charge
   Pairing stops at the first non-positive-margin pair (prices sorted, so all
   later pairs are worse) or when the throughput budget is exhausted.
5. Chronological simplification: hour pairing ignores intra-day ordering
   (charge hours are assumed schedulable before their paired discharge
   hours). This is the standard screening-model simplification and is exact
   for shapes with an overnight trough preceding the evening peak (the
   default shape). The greedy also under-uses discharge power (it delivers at
   most P x RTE per discharge hour, one hour per pair) — the DP below fixes
   both limitations.

DP_OPTIMAL (LP-equivalent daily optimisation on a quantized SoC grid):

Backward dynamic programme over state (hour h = 0..23, SoC s, cumulative
delivered energy u), maximising daily arbitrage profit subject to the true
intra-day constraints:
  * SoC bounds:       0 <= SoC <= usable_mwh at EVERY hour (asserted on the
                      reconstructed path);
  * power limits:     grid draw per hour <= P (charge), delivered per hour <= P
                      (discharge);
  * efficiency:       charging e_in MWh from the grid stores e_in x RTE of
                      deliverable energy (RTE applied once, on delivered
                      energy — same convention as the greedy);
  * cycle budget:     total delivered per day <= cycles_per_day_cap x usable_mwh;
  * FR carve-out:     the same shoulder-hour blocking convention as the greedy
                      (hours committed to FR force the idle action), so the two
                      methods are directly comparable;
  * SoC starts at 0;  leftover end-of-day SoC has zero terminal value, so the
                      programme never charges without a profitable discharge.
QUANTIZATION (documented): the SoC axis is discretised in quanta
q = P x RTE / 8 (so one full-power charge-hour = exactly 8 grid steps), with
q floored so the grid never exceeds ~1500 SoC steps / ~2000 budget steps for
extreme power/energy ratios. Capacity and the cycle budget round DOWN to the
grid (conservative, <= one quantum lost). The DP is exact on this grid and is
solved with vectorised value iteration — deterministic, no sampling. The DP
typically BEATS the greedy because it can discharge at full power P (the
greedy caps each discharge hour at P x RTE) and can re-cycle intra-day; on
price shapes that violate the trough-before-peak convention the greedy's
no-chronology relaxation can overstate revenue, which the DP corrects.

Degradation & augmentation
--------------------------
CYCLE fade: SoH declines by `degradation_pct_per_1000_cycles` per 1000
equivalent full cycles (equivalent full cycles per day = delivered MWh /
usable MWh) — equivalently a per-kWh-of-throughput fade of
deg%/1000 / usable_kWh. CALENDAR fade: `calendar_fade_pct_per_year` percentage
points of SoH per year, independent of cycling (0 by default for backward
compatibility; typical LFP convention 1.0-1.5 %/yr — see /ref/defaults).
Total fade per year = calendar + cycle (additive convention, documented).
Usable energy for a year = nameplate x SoH at start of year. At the start of
each year, if SoH has fallen below `augmentation_trigger_pct`, the project
augments back to 100% of nameplate; cost = (nameplate_mwh - usable_mwh) x
1000 x augmentation_cost_usd_per_kwh, booked in that year.

WARRANTY ENVELOPE (optional inputs): if `warranty_max_cycles_per_year` /
`warranty_max_dod_pct` are supplied, each year is checked against the caps.
Cycle check: annual equivalent full cycles vs the cap. DoD check: with the DP
dispatch the true max intra-day SoC / usable is used; with the greedy (which
has no SoC path) the documented proxy min(1, cycles_per_day) x 100 is used.
Breach years are flagged in `per_year` and summarised in `warranty_check`.

Intraday switching layer (optional, documented)
-----------------------------------------------
A second 24-hour intraday (ID) price shape is supplied directly or derived
from the day-ahead (DA) shape by the documented convention
    p_id(h) = mean(DA) + (p_da(h) - mean(DA)) x intraday_spread_multiplier
(intraday peaks/troughs are typically more extreme than DA). Switching logic:
the physical schedule is fixed by the DA dispatch; for every scheduled hour
the operator settles the delta in whichever market is better —
    charge hours:    gain = e_in x max(0, p_da - p_id) x capture
    discharge hours: gain = e_out x max(0, p_id - p_da) x capture
`intraday_capture_pct` scales the theoretical best-switching gain to reflect
imperfect foresight/liquidity (labeled modeling convention). The layer is
additive on top of the DA arbitrage margin, computed per year on that year's
dispatch plan.

Carbon-arbitrage analytics (optional, documented)
-------------------------------------------------
Given a 24-hour grid carbon-intensity shape (gCO2/kWh — e.g. the wired
/api/v1/grid-carbon UK NESO forecast, or user-supplied), the engine computes
per year from the dispatch plan:
    net tCO2e displaced = [ sum_dis e_out x I(h) - sum_chg e_in x I(h) ] x 365 / 1000
(discharging displaces marginal generation at discharge-hour intensity;
charging adds load at charge-hour intensity — round-trip losses are therefore
automatically charged at charge-hour intensity, and are also reported
separately as `round_trip_loss_emissions_tco2e`). If net displacement is
positive, `carbon_value_usd_per_tco2e` = arbitrage margin / net tCO2e — the
market revenue earned per tonne displaced (a value metric, NOT an abatement
cost). All labeled: this is a marginal-intensity screening convention.

Other streams (annual, deterministic)
-------------------------------------
FR/ancillary : fr_price_usd_per_mw_yr is a full-availability (24/7)
               annualized rate; revenue = rate x MW x committed_hours / 24,
               so committing more hours earns more FR but removes arbitrage
               hours (the real trade-off).
Capacity     : capacity_price_usd_per_mw_yr x MW x derating_factor
               (derating reflects duration-limited de-rating conventions,
               e.g. GB T-4 style class derating for a 4h asset). The response
               also reports duration-interpolated GB/PJM-style reference
               derating factors (labeled tables in /ref/market-menus).
Opex         : fixed_opex_usd_per_mw_yr x MW
               + variable_opex_usd_per_mwh x annual delivered MWh.
Net margin   : arbitrage (+ intraday layer) + FR + capacity - opex
               - augmentation cost.

All defaults are hand-authored modeling conventions with a stated basis (see
/ref/defaults) — not live market quotes.
"""

from __future__ import annotations

import math
from typing import List, Optional

import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator

router = APIRouter(prefix="/api/v1/bess-stacking", tags=["BESS Revenue Stacking"])


# ---------------------------------------------------------------------------
# Reference defaults (labeled modeling conventions, hand-authored)
# ---------------------------------------------------------------------------

# Default 24-hour day-ahead price shape ($/MWh). Hand-authored two-peak shape
# typical of a thermal-marginal system with meaningful solar penetration:
# overnight trough (h0-5), morning ramp (h6-9), midday solar depression
# (h10-15), evening peak (h17-20). Levels are indicative of 2023-2025 GB/ERCOT
# day-ahead averages — a MODELING CONVENTION for screening, not market data.
DEFAULT_PRICE_SHAPE_USD_MWH: List[float] = [
    42.0, 38.0, 35.0, 33.0, 32.0, 33.0,   # 00-05 overnight trough
    45.0, 62.0, 75.0, 68.0,               # 06-09 morning ramp + peak
    55.0, 48.0, 45.0, 44.0, 46.0, 52.0,   # 10-15 midday solar depression
    68.0, 95.0, 118.0, 110.0, 88.0,       # 16-20 evening ramp + peak
    70.0, 58.0, 48.0,                     # 21-23 decline
]

MARKET_PARAMETER_DEFAULTS = {
    "round_trip_efficiency_pct": {
        "value": 88.0,
        "basis": "AC-AC round-trip efficiency typical of current LFP grid batteries (NREL ATB 2024 utility-scale BESS: 85-90%).",
    },
    "cycles_per_day_cap": {
        "value": 1.5,
        "basis": "Warranty-style throughput cap; 1-2 cycles/day is the common augmentation-warranty envelope for merchant BESS.",
    },
    "degradation_pct_per_1000_cycles": {
        "value": 2.5,
        "basis": "Cycle-driven capacity fade convention for LFP (~2-3% per 1000 equivalent full cycles at moderate DoD/temperature).",
    },
    "calendar_fade_pct_per_year": {
        "value": 0.0,
        "recommended": 1.0,
        "basis": "Calendar (time-driven) capacity fade, %SoH/yr. Typical LFP convention 1.0-1.5%/yr at moderate temperature/SoC. Default 0 preserves the legacy cycle-only behaviour; set explicitly for combined calendar+cycle aging.",
    },
    "augmentation_trigger_pct": {
        "value": 80.0,
        "basis": "Augment when usable energy falls below 80% of nameplate — common contract/warranty end-of-life threshold.",
    },
    "augmentation_cost_usd_per_kwh": {
        "value": 150.0,
        "basis": "Installed DC augmentation cost convention (BNEF/NREL 2024-25 pack+BOS ranges $120-180/kWh).",
    },
    "fr_price_usd_per_mw_yr": {
        "value": 45000.0,
        "basis": "Frequency-response availability rate: ~= GBP 5/MW/h GB Dynamic Containment style pricing annualized (~$45k/MW-yr at 24/7). Prorated by committed hours in the model.",
    },
    "fr_committed_hours_per_day": {
        "value": 4.0,
        "basis": "Hours/day of power committed to FR and removed from the arbitrage window (scheduled in shoulder-price hours).",
    },
    "capacity_price_usd_per_mw_yr": {
        "value": 30000.0,
        "basis": "Capacity-market clearing convention (~GBP 20-35/kW-yr GB T-4 2024-27 range mid-point, converted).",
    },
    "capacity_derating_factor": {
        "value": 0.60,
        "basis": "Duration-based derating for a ~4h battery (GB capacity market class derating ~55-68% for 4h storage). See /ref/market-menus for the labeled duration tables.",
    },
    "fixed_opex_usd_per_mw_yr": {
        "value": 10000.0,
        "basis": "Fixed O&M convention ~$10/kW-yr (NREL ATB utility BESS fixed O&M band).",
    },
    "variable_opex_usd_per_mwh": {
        "value": 2.0,
        "basis": "Variable O&M per delivered MWh (auxiliary load, wear items) — screening convention.",
    },
    "intraday_spread_multiplier": {
        "value": 1.15,
        "basis": "Intraday peaks/troughs are typically 10-25% more extreme than day-ahead (GB/DE ID1-vs-DA observation range) — labeled derivation convention when no explicit ID shape is supplied.",
    },
    "intraday_capture_pct": {
        "value": 60.0,
        "basis": "Fraction of the theoretical best-market switching gain actually captured (imperfect foresight/liquidity haircut) — labeled modeling convention.",
    },
}

PRICE_SHAPE_BASIS = (
    "Hand-authored two-peak day-ahead shape (overnight trough, morning ramp, "
    "midday solar depression, evening peak). Levels indicative of 2023-2025 "
    "GB/ERCOT day-ahead averages. This is a labeled MODELING CONVENTION for "
    "screening, not live or historical market data — supply your own 24-hour "
    "array for site-specific analysis."
)

# ── Capacity-market derating-by-duration reference tables ────────────────────
# HAND-AUTHORED, labeled: factors approximate published class-derating ranges;
# refresh from the latest auction guidelines for production use.
CAPACITY_DERATING_TABLES = {
    "GB_T4_style": {
        "basis": (
            "GB Capacity Market T-4 style storage class derating, hand-authored "
            "from 2024-27 auction guideline ranges (EMR Delivery Body): ~10% at "
            "0.5h rising to ~95% at 8h+. Approximate, labeled."
        ),
        "by_duration_h": {0.5: 0.10, 1.0: 0.205, 2.0: 0.41, 4.0: 0.62, 6.0: 0.78, 8.0: 0.95},
    },
    "PJM_ELCC_style": {
        "basis": (
            "PJM ELCC-class style storage accreditation, hand-authored from "
            "published 2025/26 ELCC class ratings (higher short-duration credit "
            "than GB, saturating near 90-95% at 8-10h). Approximate, labeled."
        ),
        "by_duration_h": {1.0: 0.52, 2.0: 0.66, 4.0: 0.78, 6.0: 0.85, 8.0: 0.90, 10.0: 0.95},
    },
}

# ── Ancillary product menu ($/MW-yr availability-rate conventions) ───────────
# HAND-AUTHORED, labeled: annualized availability rates for screening.
ANCILLARY_PRODUCT_MENU = [
    {"product": "frequency_response_dynamic", "name": "Dynamic frequency response",
     "usd_per_mw_yr": 45000.0,
     "basis": "GB Dynamic Containment style ~GBP 5/MW/h annualized 24/7 (~$45k/MW-yr). Same rate as the stack's FR stream."},
    {"product": "regulation", "name": "Regulation / AGC",
     "usd_per_mw_yr": 30000.0,
     "basis": "PJM RegD-flavoured regulation revenue convention, approximate 2023-25 average net of mileage variability."},
    {"product": "spinning_reserve", "name": "Spinning / synchronized reserve",
     "usd_per_mw_yr": 12000.0,
     "basis": "Synchronized-reserve availability convention (~$1-2/MW/h across US RTOs, annualized mid-point)."},
    {"product": "reactive_power", "name": "Reactive power / voltage support",
     "usd_per_mw_yr": 3000.0,
     "basis": "Reactive/voltage tariff convention $/MVAr-yr, quoted per MW assuming ~1:1 MVAr:MW inverter capability."},
]

_HOURS_PER_YEAR_DAYS = 365  # non-leap convention, documented

DP_C_STEPS = 8              # SoC quanta per full-power charge-hour (documented)
DP_MAX_SOC_STEPS = 1500     # grid-size guards for extreme power/energy ratios
DP_MAX_BUDGET_STEPS = 2000


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class StackRequest(BaseModel):
    """Inputs for the per-year BESS revenue stack."""

    power_mw: float = Field(100.0, gt=0, le=5000, description="Nameplate power (MW)")
    energy_mwh: float = Field(400.0, gt=0, le=50000, description="Nameplate energy (MWh)")
    round_trip_efficiency_pct: float = Field(88.0, ge=50, le=100)
    cycles_per_day_cap: float = Field(1.5, ge=0.1, le=4.0)
    degradation_pct_per_1000_cycles: float = Field(2.5, ge=0.0, le=20.0)
    calendar_fade_pct_per_year: float = Field(
        0.0, ge=0.0, le=10.0,
        description="Calendar (time-driven) SoH fade, %/yr, additive to cycle fade. 0 = legacy cycle-only behaviour; typical LFP 1.0-1.5.",
    )
    augmentation_trigger_pct: float = Field(80.0, ge=50.0, le=99.0)
    augmentation_cost_usd_per_kwh: float = Field(150.0, ge=0.0, le=1000.0)
    price_shape_usd_mwh: Optional[List[float]] = Field(
        None,
        description="24 hourly prices $/MWh (h0..h23). Omit to use the documented default shape. Negative prices allowed.",
    )
    fr_price_usd_per_mw_yr: float = Field(45000.0, ge=0.0)
    fr_committed_hours_per_day: float = Field(4.0, ge=0.0, le=24.0)
    capacity_price_usd_per_mw_yr: float = Field(30000.0, ge=0.0)
    capacity_derating_factor: float = Field(0.60, ge=0.0, le=1.0)
    fixed_opex_usd_per_mw_yr: float = Field(10000.0, ge=0.0)
    variable_opex_usd_per_mwh: float = Field(2.0, ge=0.0)
    years: int = Field(15, ge=1, le=40)
    dispatch_method: str = Field(
        "greedy",
        description="'greedy' (legacy screening pairing) or 'dp_optimal' (SoC-grid dynamic programme — see module docstring).",
    )
    # Warranty envelope (optional — checks only run when supplied)
    warranty_max_cycles_per_year: Optional[float] = Field(
        None, gt=0, le=2000, description="Warranty cap on equivalent full cycles per year; per-year breach flags when supplied.",
    )
    warranty_max_dod_pct: Optional[float] = Field(
        None, gt=0, le=100, description="Warranty depth-of-discharge cap, %. DP uses the true max intra-day SoC/usable; greedy uses the documented proxy min(1, cycles/day).",
    )
    # Intraday switching layer (optional)
    intraday_shape_usd_mwh: Optional[List[float]] = Field(
        None, description="Optional 24h intraday price shape $/MWh. If omitted but intraday_spread_multiplier is set, ID shape is derived from the DA shape (documented convention).",
    )
    intraday_spread_multiplier: Optional[float] = Field(
        None, gt=0, le=3.0, description="Derive ID shape as mean + (DA - mean) x multiplier when no explicit ID shape is given.",
    )
    intraday_capture_pct: float = Field(60.0, ge=0.0, le=100.0)
    # Carbon-arbitrage analytics (optional)
    intensity_shape_gco2_kwh: Optional[List[float]] = Field(
        None, description="Optional 24h grid carbon-intensity shape (gCO2/kWh), e.g. from /api/v1/grid-carbon/forecast. Enables carbon-arbitrage analytics.",
    )

    @field_validator("price_shape_usd_mwh", "intraday_shape_usd_mwh")
    @classmethod
    def _validate_shape(cls, v):
        if v is None:
            return v
        if len(v) != 24:
            raise ValueError("price shapes must contain exactly 24 hourly values")
        for p in v:
            if not math.isfinite(p):
                raise ValueError("price shape values must be finite numbers")
            if p < -1000 or p > 10000:
                raise ValueError("price shape values must be within [-1000, 10000] $/MWh")
        return [float(p) for p in v]

    @field_validator("intensity_shape_gco2_kwh")
    @classmethod
    def _validate_intensity(cls, v):
        if v is None:
            return v
        if len(v) != 24:
            raise ValueError("intensity_shape_gco2_kwh must contain exactly 24 hourly values")
        for p in v:
            if not math.isfinite(p) or p < 0 or p > 2000:
                raise ValueError("intensity values must be finite and within [0, 2000] gCO2/kWh")
        return [float(p) for p in v]

    @field_validator("dispatch_method")
    @classmethod
    def _validate_method(cls, v):
        if v not in ("greedy", "dp_optimal"):
            raise ValueError("dispatch_method must be 'greedy' or 'dp_optimal'")
        return v


class StructuresRequest(StackRequest):
    """Toll vs merchant vs hybrid comparison inputs (extends the stack inputs)."""

    toll_fee_usd_per_kw_yr: float = Field(85.0, ge=0.0, description="Fixed full-toll availability payment, $/kW-yr.")
    floor_usd_per_kw_yr: float = Field(50.0, ge=0.0, description="Hybrid structure: guaranteed floor payment, $/kW-yr.")
    upside_share_pct: float = Field(50.0, ge=0.0, le=100.0, description="Hybrid structure: owner share of merchant gross revenue above the floor.")
    p90_spread_scalar: float = Field(
        0.70, gt=0.0, le=1.0,
        description="P90 price-spread input: the P90 daily shape compresses hourly deviations from the daily mean by this scalar (documented convention: P90 spread-capture year = scalar x P50).",
    )


class FrCooptimizeRequest(StackRequest):
    """FR MW-reservation sweep inputs."""

    fr_sweep_points: int = Field(11, ge=3, le=41, description="Number of evenly spaced FR MW reservation points in [0, power_mw].")


# ---------------------------------------------------------------------------
# Core dispatch — greedy (deterministic screening pairing; legacy, unchanged)
# ---------------------------------------------------------------------------

def _fr_blocked_hours(prices: List[float], fr_hours: float) -> set:
    """Shoulder-hour FR carve-out shared by both dispatch methods."""
    n_fr_blocked = int(round(min(24.0, max(0.0, fr_hours))))
    mean_price = sum(prices) / len(prices)
    by_shoulder = sorted(range(24), key=lambda h: (abs(prices[h] - mean_price), h))
    return set(by_shoulder[:n_fr_blocked])


def _daily_greedy_dispatch(
    prices: List[float],
    power_mw: float,
    usable_mwh: float,
    rte: float,
    cycles_cap: float,
    fr_hours: float,
) -> dict:
    """One representative day's arbitrage dispatch on a 24h price shape.

    Returns delivered MWh, charged MWh, gross margin ($/day), equivalent full
    cycles, and the hour-by-hour plan (for UI inspection).
    """
    fr_blocked = _fr_blocked_hours(prices, fr_hours)
    window = [h for h in range(24) if h not in fr_blocked]

    # Greedy pairing: cheapest remaining hour charges, dearest discharges.
    asc = sorted(window, key=lambda h: (prices[h], h))
    lo, hi = 0, len(asc) - 1
    budget_mwh = cycles_cap * usable_mwh  # daily delivered-energy budget
    plan = {h: {"hour": h, "price_usd_mwh": prices[h], "action": "idle", "mwh": 0.0}
            for h in range(24)}
    for h in fr_blocked:
        plan[h]["action"] = "fr_committed"

    delivered = 0.0
    charged = 0.0
    margin = 0.0
    pairs = []
    while lo < hi and budget_mwh > 1e-9:
        h_c, h_d = asc[lo], asc[hi]
        p_c, p_d = prices[h_c], prices[h_d]
        # One charge-hour at full power stores/re-delivers P x RTE, capped by
        # the remaining daily budget (discharge power cap P > P x RTE, so the
        # RTE-side binds first).
        e_out = min(power_mw * rte, budget_mwh)
        e_in = e_out / rte
        pair_margin = e_out * p_d - e_in * p_c
        if pair_margin <= 0:
            break  # sorted prices: every later pair is worse
        plan[h_c]["action"] = "charge"
        plan[h_c]["mwh"] = round(-e_in, 3)
        plan[h_d]["action"] = "discharge"
        plan[h_d]["mwh"] = round(e_out, 3)
        pairs.append({
            "charge_hour": h_c, "charge_price": p_c,
            "discharge_hour": h_d, "discharge_price": p_d,
            "delivered_mwh": round(e_out, 3),
            "margin_usd": round(pair_margin, 2),
        })
        delivered += e_out
        charged += e_in
        margin += pair_margin
        budget_mwh -= e_out
        lo += 1
        hi -= 1

    cycles = delivered / usable_mwh if usable_mwh > 0 else 0.0
    return {
        "method": "greedy",
        "delivered_mwh": delivered,
        "charged_mwh": charged,
        "gross_margin_usd": margin,
        "equivalent_full_cycles": cycles,
        "max_dod_pct": min(1.0, cycles) * 100.0,  # documented proxy — greedy has no SoC path
        "fr_blocked_hours": sorted(fr_blocked),
        "pairs": pairs,
        "hourly_plan": [plan[h] for h in range(24)],
    }


# ---------------------------------------------------------------------------
# Core dispatch — dynamic programme on a quantized SoC grid (documented)
# ---------------------------------------------------------------------------

def _daily_dp_dispatch(
    prices: List[float],
    power_mw: float,
    usable_mwh: float,
    rte: float,
    cycles_cap: float,
    fr_hours: float,
) -> dict:
    """LP-equivalent daily dispatch: backward DP over (hour, SoC, delivered budget).

    See the module docstring ('DP_OPTIMAL') for the full documented method and
    quantization convention. Deterministic; vectorised value iteration; the
    reconstructed path asserts the SoC bounds at every hour.
    """
    fr_blocked = _fr_blocked_hours(prices, fr_hours)

    empty_plan = [{"hour": h, "price_usd_mwh": prices[h],
                   "action": "fr_committed" if h in fr_blocked else "idle",
                   "mwh": 0.0, "soc_mwh": 0.0} for h in range(24)]
    base = {
        "method": "dp_optimal", "delivered_mwh": 0.0, "charged_mwh": 0.0,
        "gross_margin_usd": 0.0, "equivalent_full_cycles": 0.0, "max_dod_pct": 0.0,
        "fr_blocked_hours": sorted(fr_blocked), "pairs": [], "hourly_plan": empty_plan,
        "soc_path_mwh": [0.0] * 25, "grid": None,
    }
    if usable_mwh <= 0 or power_mw <= 0 or rte <= 0:
        return base

    # Quantization: one full-power charge-hour = DP_C_STEPS grid steps, with a
    # floor so extreme power/energy ratios cannot blow up the grid (documented).
    q = (power_mw * rte) / DP_C_STEPS
    q = max(q, usable_mwh / DP_MAX_SOC_STEPS, (cycles_cap * usable_mwh) / DP_MAX_BUDGET_STEPS)
    S = int(usable_mwh // q)                      # max SoC in steps (rounded down)
    U = int((cycles_cap * usable_mwh) // q)       # daily delivered budget in steps
    chg_max = int((power_mw * rte) // q)          # max charge steps/hour
    dis_max = int(power_mw // q)                  # max discharge steps/hour
    if S < 1 or U < 1 or chg_max < 1 or dis_max < 1:
        return base

    NEG = -1e18
    V = np.zeros((S + 1, U + 1))                  # terminal value: leftover SoC worthless
    best_a = np.zeros((24, S + 1, U + 1), dtype=np.int16)

    for h in range(23, -1, -1):
        if h in fr_blocked:
            # forced idle: V unchanged, action 0
            continue
        p = prices[h]
        best = V.copy()                            # action 0 (idle)
        act = np.zeros((S + 1, U + 1), dtype=np.int16)
        for a in range(1, chg_max + 1):            # charge a steps: cost = (a q / rte) p
            cand = np.full((S + 1, U + 1), NEG)
            cand[: S + 1 - a, :] = V[a:, :] - (a * q / rte) * p
            m = cand > best
            best = np.where(m, cand, best)
            act = np.where(m, np.int16(a), act)
        for k in range(1, dis_max + 1):            # discharge k steps: revenue = k q p
            cand = np.full((S + 1, U + 1), NEG)
            cand[k:, : U + 1 - k] = V[: S + 1 - k, k:] + (k * q) * p
            m = cand > best
            best = np.where(m, cand, best)
            act = np.where(m, np.int16(-k), act)
        V = best
        best_a[h] = act

    # Forward reconstruction from SoC 0, budget 0 — assert bounds per hour.
    plan = []
    soc_path = [0.0]
    s = 0
    u = 0
    delivered = 0.0
    charged = 0.0
    margin = 0.0
    for h in range(24):
        a = int(best_a[h, s, u]) if h not in fr_blocked else 0
        row = {"hour": h, "price_usd_mwh": prices[h], "action": "idle", "mwh": 0.0}
        if h in fr_blocked:
            row["action"] = "fr_committed"
        elif a > 0:
            e_in = a * q / rte
            row["action"] = "charge"
            row["mwh"] = round(-e_in, 3)
            charged += e_in
            margin -= e_in * prices[h]
            s += a
        elif a < 0:
            k = -a
            e_out = k * q
            row["action"] = "discharge"
            row["mwh"] = round(e_out, 3)
            delivered += e_out
            margin += e_out * prices[h]
            s -= k
            u += k
        soc_mwh = s * q
        # SoC bounds assertion — must hold at EVERY hour by construction.
        if soc_mwh < -1e-6 or soc_mwh > usable_mwh + 1e-6:
            raise RuntimeError(f"DP SoC bound violated at hour {h}: {soc_mwh} not in [0, {usable_mwh}]")
        row["soc_mwh"] = round(soc_mwh, 3)
        soc_path.append(soc_mwh)
        plan.append(row)

    cycles = delivered / usable_mwh if usable_mwh > 0 else 0.0
    max_dod = (max(soc_path) / usable_mwh * 100.0) if usable_mwh > 0 else 0.0
    return {
        "method": "dp_optimal",
        "delivered_mwh": delivered,
        "charged_mwh": charged,
        "gross_margin_usd": margin,
        "equivalent_full_cycles": cycles,
        "max_dod_pct": max_dod,
        "fr_blocked_hours": sorted(fr_blocked),
        "pairs": [],  # DP schedules hours directly; no notional pairing
        "hourly_plan": plan,
        "soc_path_mwh": [round(x, 3) for x in soc_path],
        "grid": {"quantum_mwh": round(q, 4), "soc_steps": S, "budget_steps": U,
                 "charge_steps_per_hour": chg_max, "discharge_steps_per_hour": dis_max},
    }


def _dispatch(method: str, prices, power_mw, usable_mwh, rte, cycles_cap, fr_hours) -> dict:
    if method == "dp_optimal":
        return _daily_dp_dispatch(prices, power_mw, usable_mwh, rte, cycles_cap, fr_hours)
    return _daily_greedy_dispatch(prices, power_mw, usable_mwh, rte, cycles_cap, fr_hours)


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _interp_derating(style: str, duration_h: float) -> Optional[float]:
    """Linear interpolation of a labeled derating-by-duration table (clamped)."""
    table = CAPACITY_DERATING_TABLES.get(style)
    if not table:
        return None
    pts = sorted(table["by_duration_h"].items())
    if duration_h <= pts[0][0]:
        return pts[0][1]
    if duration_h >= pts[-1][0]:
        return pts[-1][1]
    for (d0, f0), (d1, f1) in zip(pts, pts[1:]):
        if d0 <= duration_h <= d1:
            return f0 + (f1 - f0) * (duration_h - d0) / (d1 - d0)
    return pts[-1][1]


def _derive_intraday_shape(da: List[float], mult: float) -> List[float]:
    mean = sum(da) / len(da)
    return [mean + (p - mean) * mult for p in da]


def _plan_energy(plan: List[dict]):
    """Extract (hour, e_in) charge and (hour, e_out) discharge lists from a plan."""
    chg = [(r["hour"], -r["mwh"]) for r in plan if r["action"] == "charge"]
    dis = [(r["hour"], r["mwh"]) for r in plan if r["action"] == "discharge"]
    return chg, dis


def _intraday_gain_per_day(plan: List[dict], da: List[float], idp: List[float], capture: float) -> float:
    """Documented switching logic: settle each scheduled hour in the better market."""
    chg, dis = _plan_energy(plan)
    gain = 0.0
    for h, e_in in chg:
        gain += e_in * max(0.0, da[h] - idp[h]) * capture
    for h, e_out in dis:
        gain += e_out * max(0.0, idp[h] - da[h]) * capture
    return gain


def _carbon_day(plan: List[dict], intensity: List[float]) -> dict:
    """Documented marginal-intensity carbon accounting for one dispatch day.

    net kgCO2e displaced/day = sum_dis e_out x I(h) - sum_chg e_in x I(h)
    (MWh x gCO2/kWh = kgCO2e). Round-trip-loss emissions are the charge-side
    emissions attributable to (charged - delivered) MWh at the charge-weighted
    intensity — reported separately, already inside the net figure.
    """
    chg, dis = _plan_energy(plan)
    e_chg = sum(e for _, e in chg)
    e_dis = sum(e for _, e in dis)
    chg_emis_kg = sum(e * intensity[h] for h, e in chg)
    dis_disp_kg = sum(e * intensity[h] for h, e in dis)
    chg_wavg = (chg_emis_kg / e_chg) if e_chg > 0 else None
    dis_wavg = (dis_disp_kg / e_dis) if e_dis > 0 else None
    loss_kg = ((e_chg - e_dis) * chg_wavg) if (chg_wavg is not None and e_chg > e_dis) else 0.0
    return {
        "charged_mwh": e_chg, "delivered_mwh": e_dis,
        "charge_wavg_intensity_g_kwh": chg_wavg, "discharge_wavg_intensity_g_kwh": dis_wavg,
        "net_displaced_kg_per_day": dis_disp_kg - chg_emis_kg,
        "round_trip_loss_kg_per_day": loss_kg,
    }


# ---------------------------------------------------------------------------
# Core per-year stack computation (shared by /stack and /structures)
# ---------------------------------------------------------------------------

def _compute_stack(req: StackRequest, prices: List[float]) -> dict:
    rte = req.round_trip_efficiency_pct / 100.0
    deg_per_cycle = (req.degradation_pct_per_1000_cycles / 100.0) / 1000.0  # SoH loss per cycle
    cal_fade = req.calendar_fade_pct_per_year / 100.0                       # SoH loss per year
    trigger = req.augmentation_trigger_pct / 100.0

    # Intraday layer setup (optional)
    id_shape = None
    id_source = None
    if req.intraday_shape_usd_mwh is not None:
        id_shape = req.intraday_shape_usd_mwh
        id_source = "user_supplied"
    elif req.intraday_spread_multiplier is not None:
        id_shape = _derive_intraday_shape(prices, req.intraday_spread_multiplier)
        id_source = f"derived: mean + (DA - mean) x {req.intraday_spread_multiplier} (documented convention)"
    capture = req.intraday_capture_pct / 100.0

    intensity = req.intensity_shape_gco2_kwh

    soh = 1.0
    per_year = []
    augmentation_years = []
    year1_dispatch = None
    warranty_breach_years = []
    tot = {"arbitrage": 0.0, "intraday": 0.0, "fr": 0.0, "capacity": 0.0,
           "opex": 0.0, "augmentation": 0.0, "net": 0.0}
    carbon_tot = {"net_displaced_tco2e": 0.0, "loss_tco2e": 0.0, "delivered_mwh": 0.0}
    carbon_year1 = None

    for year in range(1, req.years + 1):
        # Start-of-year augmentation check
        aug_cost = 0.0
        if soh < trigger:
            restored_mwh = (1.0 - soh) * req.energy_mwh
            aug_cost = restored_mwh * 1000.0 * req.augmentation_cost_usd_per_kwh
            augmentation_years.append({
                "year": year,
                "soh_before_pct": round(soh * 100.0, 2),
                "restored_mwh": round(restored_mwh, 1),
                "cost_usd": round(aug_cost, 0),
            })
            soh = 1.0

        usable_mwh = req.energy_mwh * soh
        day = _dispatch(
            req.dispatch_method, prices, req.power_mw, usable_mwh, rte,
            req.cycles_per_day_cap, req.fr_committed_hours_per_day,
        )
        if year == 1:
            year1_dispatch = day

        annual_delivered = day["delivered_mwh"] * _HOURS_PER_YEAR_DAYS
        annual_cycles = day["equivalent_full_cycles"] * _HOURS_PER_YEAR_DAYS

        arb_rev = day["gross_margin_usd"] * _HOURS_PER_YEAR_DAYS
        id_rev = 0.0
        if id_shape is not None:
            id_rev = _intraday_gain_per_day(day["hourly_plan"], prices, id_shape, capture) * _HOURS_PER_YEAR_DAYS
        fr_rev = req.fr_price_usd_per_mw_yr * req.power_mw * (req.fr_committed_hours_per_day / 24.0)
        cap_rev = req.capacity_price_usd_per_mw_yr * req.power_mw * req.capacity_derating_factor
        opex = (req.fixed_opex_usd_per_mw_yr * req.power_mw
                + req.variable_opex_usd_per_mwh * annual_delivered)
        net = arb_rev + id_rev + fr_rev + cap_rev - opex - aug_cost

        if day["pairs"]:
            avg_charge = sum(p["charge_price"] * p["delivered_mwh"] for p in day["pairs"]) / day["delivered_mwh"] if day["delivered_mwh"] > 0 else None
            avg_discharge = sum(p["discharge_price"] * p["delivered_mwh"] for p in day["pairs"]) / day["delivered_mwh"] if day["delivered_mwh"] > 0 else None
        else:
            chg, dis = _plan_energy(day["hourly_plan"])
            e_chg = sum(e for _, e in chg)
            e_dis = sum(e for _, e in dis)
            avg_charge = (sum(e * prices[h] for h, e in chg) / e_chg) if e_chg > 0 else None
            avg_discharge = (sum(e * prices[h] for h, e in dis) / e_dis) if e_dis > 0 else None

        # Warranty envelope checks (optional)
        breach_cycles = (req.warranty_max_cycles_per_year is not None
                         and annual_cycles > req.warranty_max_cycles_per_year + 1e-9)
        breach_dod = (req.warranty_max_dod_pct is not None
                      and day["max_dod_pct"] > req.warranty_max_dod_pct + 1e-9)
        if breach_cycles or breach_dod:
            warranty_breach_years.append({
                "year": year,
                "annual_cycles": round(annual_cycles, 0),
                "cycles_cap": req.warranty_max_cycles_per_year,
                "breach_cycles": bool(breach_cycles),
                "max_dod_pct": round(day["max_dod_pct"], 1),
                "dod_cap_pct": req.warranty_max_dod_pct,
                "breach_dod": bool(breach_dod),
            })

        # Carbon accounting (optional)
        if intensity is not None:
            cday = _carbon_day(day["hourly_plan"], intensity)
            net_t = cday["net_displaced_kg_per_day"] * _HOURS_PER_YEAR_DAYS / 1000.0
            loss_t = cday["round_trip_loss_kg_per_day"] * _HOURS_PER_YEAR_DAYS / 1000.0
            carbon_tot["net_displaced_tco2e"] += net_t
            carbon_tot["loss_tco2e"] += loss_t
            carbon_tot["delivered_mwh"] += annual_delivered
            if year == 1:
                carbon_year1 = {
                    "charge_wavg_intensity_g_kwh": round(cday["charge_wavg_intensity_g_kwh"], 1) if cday["charge_wavg_intensity_g_kwh"] is not None else None,
                    "discharge_wavg_intensity_g_kwh": round(cday["discharge_wavg_intensity_g_kwh"], 1) if cday["discharge_wavg_intensity_g_kwh"] is not None else None,
                    "net_displaced_tco2e_yr": round(net_t, 1),
                    "round_trip_loss_tco2e_yr": round(loss_t, 1),
                    "carbon_value_usd_per_tco2e": round((arb_rev + id_rev) / net_t, 2) if net_t > 0 else None,
                }

        row = {
            "year": year,
            "soh_start_pct": round(soh * 100.0, 2),
            "usable_mwh": round(usable_mwh, 1),
            "cycles_per_day": round(day["equivalent_full_cycles"], 3),
            "annual_cycles": round(annual_cycles, 0),
            "annual_delivered_mwh": round(annual_delivered, 0),
            "avg_charge_price_usd_mwh": round(avg_charge, 2) if avg_charge is not None else None,
            "avg_discharge_price_usd_mwh": round(avg_discharge, 2) if avg_discharge is not None else None,
            "arbitrage_revenue_usd": round(arb_rev, 0),
            "fr_revenue_usd": round(fr_rev, 0),
            "capacity_revenue_usd": round(cap_rev, 0),
            "gross_revenue_usd": round(arb_rev + id_rev + fr_rev + cap_rev, 0),
            "opex_usd": round(opex, 0),
            "augmentation_cost_usd": round(aug_cost, 0),
            "net_margin_usd": round(net, 0),
        }
        if id_shape is not None:
            row["intraday_revenue_usd"] = round(id_rev, 0)
        if req.warranty_max_cycles_per_year is not None or req.warranty_max_dod_pct is not None:
            row["warranty_breach"] = bool(breach_cycles or breach_dod)
        per_year.append(row)

        tot["arbitrage"] += arb_rev
        tot["intraday"] += id_rev
        tot["fr"] += fr_rev
        tot["capacity"] += cap_rev
        tot["opex"] += opex
        tot["augmentation"] += aug_cost
        tot["net"] += net

        # End-of-year fade: cycle-driven + calendar (additive convention)
        soh = max(0.0, soh - deg_per_cycle * annual_cycles - cal_fade)

    result = {
        "per_year": per_year,
        "augmentation_years": augmentation_years,
        "year1_dispatch": year1_dispatch,
        "totals": tot,
        "warranty_breach_years": warranty_breach_years,
        "intraday": None,
        "carbon": None,
    }
    if id_shape is not None:
        result["intraday"] = {
            "id_shape_usd_mwh": [round(p, 2) for p in id_shape],
            "source": id_source,
            "capture_pct": req.intraday_capture_pct,
            "total_uplift_usd": round(tot["intraday"], 0),
            "methodology": (
                "Physical schedule fixed by the DA dispatch; each scheduled hour settles in the better market: "
                "charge gain = e_in x max(0, DA - ID) x capture; discharge gain = e_out x max(0, ID - DA) x capture. "
                "Capture % is a labeled foresight/liquidity haircut on the theoretical best-switching gain."
            ),
        }
    if intensity is not None:
        result["carbon"] = {
            "intensity_shape_gco2_kwh": intensity,
            "year1": carbon_year1,
            "lifetime_net_displaced_tco2e": round(carbon_tot["net_displaced_tco2e"], 0),
            "lifetime_round_trip_loss_tco2e": round(carbon_tot["loss_tco2e"], 0),
            "lifetime_carbon_value_usd_per_tco2e": (
                round((tot["arbitrage"] + tot["intraday"]) / carbon_tot["net_displaced_tco2e"], 2)
                if carbon_tot["net_displaced_tco2e"] > 0 else None
            ),
            "methodology": (
                "Marginal-intensity screening convention: net tCO2e displaced = "
                "[sum_dis e_out x I(h) - sum_chg e_in x I(h)] x 365/1000. Discharging displaces marginal generation at "
                "discharge-hour intensity; charging adds load at charge-hour intensity (round-trip losses therefore carry "
                "charge-hour emissions, reported separately). carbon_value = arbitrage (+ID) margin / net tCO2e displaced — "
                "market revenue per tonne displaced (value metric, not an abatement cost). Labeled convention; pair with the "
                "live /api/v1/grid-carbon shape for GB or supply a local marginal-intensity curve."
            ),
        }
    return result


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

def _methodology(req: StackRequest) -> dict:
    m = {
        "arbitrage_dispatch": (
            "Greedy daily pairing: FR hours carved out at shoulder prices; remaining hours "
            "sorted by price; cheapest hour charges / dearest discharges at full power; "
            "delivered energy per pair = P x RTE, capped by daily throughput budget "
            "(cycles_cap x usable MWh); pairs dispatched while margin "
            "e_out*P_dis - (e_out/RTE)*P_chg > 0. Chronological intra-day ordering ignored "
            "(screening-model convention)."
        ) if req.dispatch_method == "greedy" else (
            "Dynamic programme over (hour, SoC, delivered budget) on a quantized SoC grid "
            "(quantum = P x RTE / 8, capacity/budget rounded down — documented). Enforces per-hour "
            "SoC bounds [0, usable], charge power P (grid side), discharge power P (delivered side), "
            "RTE on delivered energy, the daily cycle budget and the same shoulder-hour FR carve-out "
            "as the greedy. SoC starts at 0; leftover SoC has zero terminal value. Deterministic "
            "vectorised value iteration — exact on the grid (LP-equivalent)."
        ),
        "degradation": (
            "Cycle fade: SoH -= (deg%/1000 cycles) x equivalent full cycles. Calendar fade: "
            "SoH -= calendar_fade_pct_per_year (additive convention; 0 = legacy cycle-only). "
            "Usable = nameplate x SoH (start-of-year, held for the year)."
        ),
        "augmentation": "Start-of-year check: if SoH < trigger, restore to 100% nameplate at augmentation_cost_usd_per_kwh x restored kWh.",
        "fr": "fr_price is a 24/7 annualized $/MW-yr rate, prorated by committed hours/24; committed hours are removed from the arbitrage window.",
        "capacity": "capacity_price x MW x derating_factor. Duration-interpolated GB/PJM-style reference factors returned under derating_reference (labeled tables).",
        "warranty": (
            "Optional envelope check: annual equivalent full cycles vs warranty_max_cycles_per_year; max DoD vs "
            "warranty_max_dod_pct (DP: true max intra-day SoC/usable; greedy: documented proxy min(1, cycles/day))."
        ),
        "year_convention": "365-day year; single representative daily shape held flat across the horizon (no escalation).",
        "determinism": "Pure closed-form arithmetic + deterministic dynamic programming on the inputs; no random number generation.",
    }
    return m


@router.post("/stack", summary="Per-year BESS revenue stack (arbitrage + FR + capacity, optional intraday + carbon layers)")
def stack(req: StackRequest) -> dict:
    prices = req.price_shape_usd_mwh or DEFAULT_PRICE_SHAPE_USD_MWH
    shape_source = "user_supplied" if req.price_shape_usd_mwh else "default_shape"

    if req.fr_committed_hours_per_day >= 23:
        raise HTTPException(status_code=422, detail="fr_committed_hours_per_day leaves no arbitrage window (need >= 2 free hours)")

    core = _compute_stack(req, prices)
    tot = core["totals"]

    # Dispatch-method comparison (year-1, both methods) when DP requested.
    dispatch_comparison = None
    if req.dispatch_method == "dp_optimal":
        rte = req.round_trip_efficiency_pct / 100.0
        g = _daily_greedy_dispatch(prices, req.power_mw, req.energy_mwh, rte,
                                   req.cycles_per_day_cap, req.fr_committed_hours_per_day)
        d = core["year1_dispatch"]
        uplift = ((d["gross_margin_usd"] - g["gross_margin_usd"]) / abs(g["gross_margin_usd"]) * 100.0) if g["gross_margin_usd"] else None
        dispatch_comparison = {
            "greedy_margin_usd_day": round(g["gross_margin_usd"], 2),
            "dp_margin_usd_day": round(d["gross_margin_usd"], 2),
            "uplift_pct": round(uplift, 2) if uplift is not None else None,
            "greedy_delivered_mwh_day": round(g["delivered_mwh"], 1),
            "dp_delivered_mwh_day": round(d["delivered_mwh"], 1),
            "dp_grid": d.get("grid"),
            "note": (
                "DP beats greedy chiefly by discharging at full power P (greedy caps each discharge hour at P x RTE) and by "
                "true intra-day recycling; on shapes violating the trough-before-peak convention the greedy's no-chronology "
                "relaxation overstates revenue, which the DP corrects."
            ),
        }

    daily_spread = (max(prices) - min(prices))
    duration_h = req.energy_mwh / req.power_mw if req.power_mw > 0 else None
    resp = {
        "inputs": req.model_dump(),
        "price_shape_used": {"source": shape_source, "values_usd_mwh": prices,
                             "basis": PRICE_SHAPE_BASIS if shape_source == "default_shape" else "user-supplied 24h array",
                             "min": min(prices), "max": max(prices),
                             "peak_trough_spread_usd_mwh": round(daily_spread, 2)},
        "methodology": _methodology(req),
        "per_year": core["per_year"],
        "augmentation_years": core["augmentation_years"],
        "totals_usd": {
            "arbitrage": round(tot["arbitrage"], 0),
            "fr": round(tot["fr"], 0),
            "capacity": round(tot["capacity"], 0),
            "gross": round(tot["arbitrage"] + tot["intraday"] + tot["fr"] + tot["capacity"], 0),
            "opex": round(tot["opex"], 0),
            "augmentation": round(tot["augmentation"], 0),
            "net": round(tot["net"], 0),
        },
        "year1_dispatch": core["year1_dispatch"],
        "derating_reference": {
            "duration_h": round(duration_h, 2) if duration_h else None,
            "gb_t4_style_factor": round(_interp_derating("GB_T4_style", duration_h), 3) if duration_h else None,
            "pjm_elcc_style_factor": round(_interp_derating("PJM_ELCC_style", duration_h), 3) if duration_h else None,
            "used_factor": req.capacity_derating_factor,
            "note": "Reference factors interpolated from the labeled GB/PJM-style duration tables (/ref/market-menus); the stack uses capacity_derating_factor as supplied.",
        },
    }
    if tot["intraday"]:
        resp["totals_usd"]["intraday"] = round(tot["intraday"], 0)
    if dispatch_comparison is not None:
        resp["dispatch_comparison"] = dispatch_comparison
    if core["intraday"] is not None:
        resp["intraday_layer"] = core["intraday"]
    if core["carbon"] is not None:
        resp["carbon_analytics"] = core["carbon"]
    if req.warranty_max_cycles_per_year is not None or req.warranty_max_dod_pct is not None:
        resp["warranty_check"] = {
            "cycles_cap_per_year": req.warranty_max_cycles_per_year,
            "dod_cap_pct": req.warranty_max_dod_pct,
            "breach_years": core["warranty_breach_years"],
            "any_breach": bool(core["warranty_breach_years"]),
            "note": "DoD basis: DP = true max intra-day SoC/usable; greedy = documented proxy min(1, cycles/day) x 100.",
        }
    return resp


@router.post("/dispatch-compare", summary="One-day optimal (DP) vs greedy dispatch comparison")
def dispatch_compare(req: StackRequest) -> dict:
    prices = req.price_shape_usd_mwh or DEFAULT_PRICE_SHAPE_USD_MWH
    if req.fr_committed_hours_per_day >= 23:
        raise HTTPException(status_code=422, detail="fr_committed_hours_per_day leaves no arbitrage window (need >= 2 free hours)")
    rte = req.round_trip_efficiency_pct / 100.0
    g = _daily_greedy_dispatch(prices, req.power_mw, req.energy_mwh, rte,
                               req.cycles_per_day_cap, req.fr_committed_hours_per_day)
    d = _daily_dp_dispatch(prices, req.power_mw, req.energy_mwh, rte,
                           req.cycles_per_day_cap, req.fr_committed_hours_per_day)
    uplift = ((d["gross_margin_usd"] - g["gross_margin_usd"]) / abs(g["gross_margin_usd"]) * 100.0) if g["gross_margin_usd"] else None
    return {
        "inputs": req.model_dump(),
        "greedy": {k: (round(v, 2) if isinstance(v, float) else v) for k, v in g.items() if k != "hourly_plan"},
        "dp_optimal": {k: (round(v, 2) if isinstance(v, float) else v) for k, v in d.items() if k != "hourly_plan"},
        "greedy_hourly_plan": g["hourly_plan"],
        "dp_hourly_plan": d["hourly_plan"],
        "uplift_pct": round(uplift, 2) if uplift is not None else None,
        "annualized_uplift_usd": round((d["gross_margin_usd"] - g["gross_margin_usd"]) * _HOURS_PER_YEAR_DAYS, 0),
        "methodology": {
            "greedy": "Legacy screening pairing (see /stack methodology).",
            "dp_optimal": (
                "Backward dynamic programme over (hour, SoC, delivered budget) on a quantized SoC grid "
                "(quantum = P x RTE / 8; capacity & budget rounded down). Enforces per-hour SoC bounds, power limits, "
                "RTE, cycle budget and the same FR carve-out. SoC starts 0; leftover SoC worthless. Deterministic."
            ),
        },
    }


@router.post("/fr-cooptimize", summary="FR MW-reservation sweep — optimal FR vs arbitrage power split")
def fr_cooptimize(req: FrCooptimizeRequest) -> dict:
    """Reserve X MW for FR 24/7 (power split), run OPTIMAL (DP) arbitrage on the
    remaining P - X MW, and sweep X across [0, P] to find the profit-maximising
    split. Forgone-arbitrage opportunity cost(X) = arb(0) - arb(X). This is the
    power-split alternative to the hours-carve-out model in /stack (there, FR
    takes hours; here it takes megawatts). Documented deterministic sweep.
    """
    prices = req.price_shape_usd_mwh or DEFAULT_PRICE_SHAPE_USD_MWH
    rte = req.round_trip_efficiency_pct / 100.0
    n = req.fr_sweep_points
    rows = []
    arb_full = None
    for i in range(n):
        fr_mw = req.power_mw * i / (n - 1)
        arb_mw = req.power_mw - fr_mw
        if arb_mw <= 1e-9:
            arb_margin_yr = 0.0
        else:
            day = _daily_dp_dispatch(prices, arb_mw, req.energy_mwh, rte,
                                     req.cycles_per_day_cap, 0.0)  # no hour carve-out in the power-split model
            arb_margin_yr = day["gross_margin_usd"] * _HOURS_PER_YEAR_DAYS
        if arb_full is None:
            arb_full = arb_margin_yr
        fr_rev_yr = req.fr_price_usd_per_mw_yr * fr_mw  # full 24/7 availability on the reserved MW
        rows.append({
            "fr_mw": round(fr_mw, 1),
            "arb_mw": round(arb_mw, 1),
            "arbitrage_usd_yr": round(arb_margin_yr, 0),
            "fr_usd_yr": round(fr_rev_yr, 0),
            "opportunity_cost_usd_yr": round(arb_full - arb_margin_yr, 0),
            "total_usd_yr": round(arb_margin_yr + fr_rev_yr, 0),
        })
    best = max(rows, key=lambda r: r["total_usd_yr"])
    return {
        "inputs": req.model_dump(),
        "sweep": rows,
        "optimal": best,
        "methodology": (
            "Power-split FR co-optimisation: X MW reserved for FR earns fr_price x X (24/7 availability on dedicated "
            "megawatts — unlike /stack's hours model, no proration and no hour carve-out); arbitrage runs the DP-optimal "
            "dispatch on P - X MW with the full energy capacity. opportunity_cost(X) = arbitrage(0 reserved) - arbitrage(X). "
            "Optimal split = argmax over the deterministic sweep. Quantized-DP arbitrage — see /dispatch-compare methodology."
        ),
    }


@router.post("/structures", summary="Toll vs merchant vs hybrid (floor + share) at P50 / P90 spreads")
def structures(req: StructuresRequest) -> dict:
    """Risk-adjusted contract-structure comparison.

    P50 = the supplied/default shape. P90 (documented convention): hourly
    deviations from the daily mean are compressed by p90_spread_scalar —
    p90(h) = mean + (p50(h) - mean) x scalar — i.e. a weak-spread year with the
    same average price level. Structures:
      merchant : keeps all market streams (arbitrage + intraday + FR + capacity).
      toll     : fixed toll_fee x kW replaces ALL market streams (toller takes
                 market risk); owner keeps opex + augmentation.
      hybrid   : floor x kW guaranteed + upside_share% of merchant GROSS revenue
                 above the floor; owner keeps opex + augmentation.
    """
    prices = req.price_shape_usd_mwh or DEFAULT_PRICE_SHAPE_USD_MWH
    if req.fr_committed_hours_per_day >= 23:
        raise HTTPException(status_code=422, detail="fr_committed_hours_per_day leaves no arbitrage window (need >= 2 free hours)")
    mean = sum(prices) / len(prices)
    p90_prices = [mean + (p - mean) * req.p90_spread_scalar for p in prices]

    kw = req.power_mw * 1000.0
    toll_yr = req.toll_fee_usd_per_kw_yr * kw
    floor_yr = req.floor_usd_per_kw_yr * kw
    share = req.upside_share_pct / 100.0

    def structures_for(shape: List[float]) -> dict:
        core = _compute_stack(req, shape)
        merchant_net = core["totals"]["net"]
        toll_net = 0.0
        hybrid_net = 0.0
        for y in core["per_year"]:
            cost_y = y["opex_usd"] + y["augmentation_cost_usd"]
            gross_y = y["gross_revenue_usd"]
            toll_net += toll_yr - cost_y
            hybrid_net += floor_yr + share * max(0.0, gross_y - floor_yr) - cost_y
        return {
            "merchant_net_usd": round(merchant_net, 0),
            "toll_net_usd": round(toll_net, 0),
            "hybrid_net_usd": round(hybrid_net, 0),
            "merchant_gross_usd": round(sum(y["gross_revenue_usd"] for y in core["per_year"]), 0),
        }

    p50 = structures_for(prices)
    p90 = structures_for(p90_prices)
    names = ["merchant", "toll", "hybrid"]
    worst = {n: min(p50[f"{n}_net_usd"], p90[f"{n}_net_usd"]) for n in names}
    recommended = max(names, key=lambda n: worst[n])
    return {
        "inputs": req.model_dump(),
        "p50": p50,
        "p90": p90,
        "p90_shape_usd_mwh": [round(p, 2) for p in p90_prices],
        "structure_terms": {
            "toll_fee_usd_per_kw_yr": req.toll_fee_usd_per_kw_yr,
            "floor_usd_per_kw_yr": req.floor_usd_per_kw_yr,
            "upside_share_pct": req.upside_share_pct,
            "p90_spread_scalar": req.p90_spread_scalar,
        },
        "recommended_structure_maximin": recommended,
        "methodology": (
            "P90 convention: p90(h) = mean + (p50(h) - mean) x scalar (weak-spread year, same average level — labeled). "
            "Toll: fee x kW replaces all market streams; owner keeps opex + augmentation. Hybrid: floor x kW + share% of "
            "merchant gross above the floor, owner keeps costs. Recommendation = maximin (best worst-case across P50/P90) — "
            "a conservative screening rule, not investment advice."
        ),
    }


@router.post("/augmentation-optimize", summary="Augmentation-trigger sweep minimising $ per MWh delivered")
def augmentation_optimize(req: StackRequest) -> dict:
    """Sweep the augmentation trigger over [60%, 95%] (2.5pp grid) plus a
    'never augment' case; for each candidate simulate the full horizon and
    report total augmentation cost, lifetime delivered MWh, the cost-efficiency
    metric usd_per_mwh_delivered = aug cost / lifetime delivered MWh, and net
    margin. Optimum reported both by max net margin and by min $/MWh metric.
    Deterministic sweep (greedy dispatch for sweep speed — documented).
    """
    prices = req.price_shape_usd_mwh or DEFAULT_PRICE_SHAPE_USD_MWH
    if req.fr_committed_hours_per_day >= 23:
        raise HTTPException(status_code=422, detail="fr_committed_hours_per_day leaves no arbitrage window (need >= 2 free hours)")
    candidates = [None] + [60.0 + 2.5 * i for i in range(15)]  # None = never augment
    rows = []
    for trig in candidates:
        r = req.model_copy(update={
            "augmentation_trigger_pct": trig if trig is not None else 50.0,
            "dispatch_method": "greedy",  # sweep speed; relative ranking preserved (documented)
        })
        if trig is None:
            # 'never': trigger below any reachable SoH (SoH floor 0 → use 50 and
            # additionally strip augmentation by zeroing its cost effect via a
            # dedicated run with trigger 50 only if SoH never crosses it; to be
            # exact we simulate with trigger 50 and discard runs that augmented.
            r = req.model_copy(update={"augmentation_trigger_pct": 50.0, "dispatch_method": "greedy"})
        core = _compute_stack(r, prices)
        aug_cost = core["totals"]["augmentation"]
        delivered = sum(y["annual_delivered_mwh"] for y in core["per_year"])
        if trig is None and core["augmentation_years"]:
            # SoH crossed even 50% within the horizon — 'never' not representable; skip.
            continue
        rows.append({
            "trigger_pct": trig,
            "label": "never (within horizon)" if trig is None else f"{trig:.1f}%",
            "augmentations": len(core["augmentation_years"]),
            "first_augmentation_year": core["augmentation_years"][0]["year"] if core["augmentation_years"] else None,
            "total_augmentation_cost_usd": round(aug_cost, 0),
            "lifetime_delivered_mwh": round(delivered, 0),
            "aug_usd_per_mwh_delivered": round(aug_cost / delivered, 3) if delivered > 0 else None,
            "net_margin_usd": round(core["totals"]["net"], 0),
        })
    if not rows:
        raise HTTPException(status_code=422, detail="No feasible augmentation candidates for these inputs")
    best_net = max(rows, key=lambda r: r["net_margin_usd"])
    with_metric = [r for r in rows if r["aug_usd_per_mwh_delivered"] is not None]
    best_metric = min(with_metric, key=lambda r: (r["aug_usd_per_mwh_delivered"], -r["net_margin_usd"])) if with_metric else None
    return {
        "inputs": req.model_dump(),
        "sweep": rows,
        "optimal_by_net_margin": best_net,
        "optimal_by_cost_per_mwh": best_metric,
        "methodology": (
            "Deterministic trigger sweep 60-95% (2.5pp grid) + never-augment case. Each candidate runs the full per-year "
            "simulation (greedy dispatch for sweep speed — rankings are preserved because all candidates share the dispatch). "
            "aug_usd_per_mwh_delivered = total augmentation capex / lifetime delivered MWh (cost of retaining throughput). "
            "Both the margin-maximising and the $/MWh-minimising triggers are reported."
        ),
    }


@router.get("/ref/defaults", summary="Default price shape + market parameter defaults (labeled conventions)")
def ref_defaults() -> dict:
    return {
        "price_shape_usd_mwh": DEFAULT_PRICE_SHAPE_USD_MWH,
        "price_shape_basis": PRICE_SHAPE_BASIS,
        "market_parameters": MARKET_PARAMETER_DEFAULTS,
        "note": (
            "All values are hand-authored modeling conventions with stated bases "
            "(NREL ATB 2024, GB capacity-market and Dynamic Containment ranges, "
            "BNEF cost surveys) — NOT live market quotes. Override any input in POST /stack."
        ),
    }


@router.get("/ref/market-menus", summary="Capacity-derating duration tables + ancillary product menu (labeled)")
def ref_market_menus() -> dict:
    return {
        "capacity_derating_tables": CAPACITY_DERATING_TABLES,
        "ancillary_product_menu": ANCILLARY_PRODUCT_MENU,
        "note": (
            "HAND-AUTHORED reference tables, labeled with their basis: derating factors approximate GB T-4 / PJM ELCC "
            "class-rating ranges; ancillary $/MW-yr rates are annualized availability conventions for screening — "
            "NOT live auction or market results. Refresh from the latest auction guidelines for production."
        ),
    }
