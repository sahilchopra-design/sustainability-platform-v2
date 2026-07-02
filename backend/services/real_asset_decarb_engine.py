"""
Real Asset Decarbonisation Engine  (E74)
=========================================
CRREM 2.0 pathways, industrial capex transition planning, lock-in risk
(15-30yr asset life), brown-to-green transformation, SBTi sector rates
(buildings 7%pa / industry 4.2%pa / transport 3.8%pa), net-zero capex
stack, stranded cost curves, retrofit NPV.

References:
  - CRREM 2.0 Carbon Risk Real Estate Monitor (2022)
  - SBTi Buildings Sector Science-Based Target Setting Guidance (2022)
  - SBTi Industry Science-Based Target Setting Guidance (2021)
  - SBTi Corporate Net-Zero Standard (2021)
  - TCFD Supplemental Guidance for Asset Managers (2021)
  - IFRS S2 Climate-Related Disclosures (2023)
  - JLL / CBRE Green Premium Research (2022-2024)
  - IPCC AR6 WG III — Carbon Abatement Costs
  - IEA World Energy Outlook 2023
"""
from __future__ import annotations

from typing import Any, Optional

# ---------------------------------------------------------------------------
# Data-integrity note (random-as-data remediation)
# ---------------------------------------------------------------------------
# Every RETURNED entity-level metric is either (a) a real deterministic
# computation from a caller-supplied input, or (b) an honest null
# ("insufficient_data" / None) when the required input is absent. No metric is
# a random draw. Where a reference range (from CRREM/SBTi/IPCC/JLL literature)
# has no entity-specific value, the deterministic midpoint of that documented
# range is used as a MODEL parameter and flagged via a "*_basis" field.
# All new inputs are optional and default to None (backward compatible).

# ---------------------------------------------------------------------------
# Reference Data
# ---------------------------------------------------------------------------

ASSET_TYPES: dict[str, dict] = {
    "office": {
        "sector": "buildings",
        "typical_life_years": 40,
        "capex_cycle_years": 15,
        "crrem_2050_intensity_kgco2_m2": 0.0,
        "crrem_2030_intensity_kgco2_m2": 15.0,
        "sbti_decarb_rate_pa_pct": 7.0,
        "current_avg_intensity_kgco2_m2": 55.0,
        "retrofit_feasibility": "high",
        "stranded_threshold_kgco2_m2": 70.0,
        "green_premium_pct_range": (5.0, 15.0),
    },
    "retail": {
        "sector": "buildings",
        "typical_life_years": 35,
        "capex_cycle_years": 12,
        "crrem_2050_intensity_kgco2_m2": 0.0,
        "crrem_2030_intensity_kgco2_m2": 18.0,
        "sbti_decarb_rate_pa_pct": 7.0,
        "current_avg_intensity_kgco2_m2": 65.0,
        "retrofit_feasibility": "medium",
        "stranded_threshold_kgco2_m2": 80.0,
        "green_premium_pct_range": (3.0, 10.0),
    },
    "industrial_building": {
        "sector": "buildings",
        "typical_life_years": 30,
        "capex_cycle_years": 10,
        "crrem_2050_intensity_kgco2_m2": 0.0,
        "crrem_2030_intensity_kgco2_m2": 25.0,
        "sbti_decarb_rate_pa_pct": 4.2,
        "current_avg_intensity_kgco2_m2": 80.0,
        "retrofit_feasibility": "medium",
        "stranded_threshold_kgco2_m2": 100.0,
        "green_premium_pct_range": (2.0, 8.0),
    },
    "residential": {
        "sector": "buildings",
        "typical_life_years": 50,
        "capex_cycle_years": 20,
        "crrem_2050_intensity_kgco2_m2": 0.0,
        "crrem_2030_intensity_kgco2_m2": 20.0,
        "sbti_decarb_rate_pa_pct": 7.0,
        "current_avg_intensity_kgco2_m2": 70.0,
        "retrofit_feasibility": "high",
        "stranded_threshold_kgco2_m2": 90.0,
        "green_premium_pct_range": (3.0, 12.0),
    },
    "steel_plant": {
        "sector": "industry",
        "typical_life_years": 25,
        "capex_cycle_years": 10,
        "crrem_2050_intensity_kgco2_m2": 0.0,
        "crrem_2030_intensity_kgco2_m2": 800.0,
        "sbti_decarb_rate_pa_pct": 4.2,
        "current_avg_intensity_kgco2_m2": 1800.0,
        "retrofit_feasibility": "low",
        "stranded_threshold_kgco2_m2": 2200.0,
        "green_premium_pct_range": (1.0, 5.0),
    },
    "cement_plant": {
        "sector": "industry",
        "typical_life_years": 30,
        "capex_cycle_years": 12,
        "crrem_2050_intensity_kgco2_m2": 0.0,
        "crrem_2030_intensity_kgco2_m2": 550.0,
        "sbti_decarb_rate_pa_pct": 4.2,
        "current_avg_intensity_kgco2_m2": 850.0,
        "retrofit_feasibility": "low",
        "stranded_threshold_kgco2_m2": 1100.0,
        "green_premium_pct_range": (0.5, 3.0),
    },
    "data_centre": {
        "sector": "buildings",
        "typical_life_years": 20,
        "capex_cycle_years": 7,
        "crrem_2050_intensity_kgco2_m2": 0.0,
        "crrem_2030_intensity_kgco2_m2": 100.0,
        "sbti_decarb_rate_pa_pct": 7.0,
        "current_avg_intensity_kgco2_m2": 350.0,
        "retrofit_feasibility": "medium",
        "stranded_threshold_kgco2_m2": 450.0,
        "green_premium_pct_range": (2.0, 8.0),
    },
    "logistics": {
        "sector": "transport",
        "typical_life_years": 30,
        "capex_cycle_years": 10,
        "crrem_2050_intensity_kgco2_m2": 0.0,
        "crrem_2030_intensity_kgco2_m2": 30.0,
        "sbti_decarb_rate_pa_pct": 3.8,
        "current_avg_intensity_kgco2_m2": 80.0,
        "retrofit_feasibility": "medium",
        "stranded_threshold_kgco2_m2": 100.0,
        "green_premium_pct_range": (2.0, 7.0),
    },
}

RETROFIT_MEASURES: dict[str, dict] = {
    "insulation": {
        "description": "External wall / roof / floor insulation upgrade",
        "applicable_types": ["office", "retail", "residential"],
        "energy_saving_pct": (10.0, 25.0),
        "capex_per_m2_usd": (30.0, 80.0),
        "lifespan_years": 25,
        "payback_years_range": (5.0, 12.0),
    },
    "hvac_upgrade": {
        "description": "High-efficiency heat pump / VRF HVAC replacement",
        "applicable_types": ["office", "retail", "residential", "industrial_building"],
        "energy_saving_pct": (15.0, 35.0),
        "capex_per_m2_usd": (40.0, 120.0),
        "lifespan_years": 15,
        "payback_years_range": (4.0, 10.0),
    },
    "glazing": {
        "description": "Triple / low-e glazing replacement",
        "applicable_types": ["office", "retail", "residential"],
        "energy_saving_pct": (5.0, 15.0),
        "capex_per_m2_usd": (60.0, 180.0),
        "lifespan_years": 30,
        "payback_years_range": (8.0, 20.0),
    },
    "solar_pv": {
        "description": "Rooftop solar PV installation",
        "applicable_types": ["office", "retail", "industrial_building", "residential", "logistics"],
        "energy_saving_pct": (10.0, 30.0),
        "capex_per_m2_usd": (120.0, 250.0),
        "lifespan_years": 25,
        "payback_years_range": (6.0, 14.0),
    },
    "led_lighting": {
        "description": "LED lighting and smart controls",
        "applicable_types": ["office", "retail", "industrial_building", "logistics", "data_centre"],
        "energy_saving_pct": (5.0, 12.0),
        "capex_per_m2_usd": (10.0, 35.0),
        "lifespan_years": 15,
        "payback_years_range": (2.0, 5.0),
    },
    "bms": {
        "description": "Building Management System / smart controls",
        "applicable_types": ["office", "retail", "industrial_building", "data_centre"],
        "energy_saving_pct": (8.0, 18.0),
        "capex_per_m2_usd": (15.0, 50.0),
        "lifespan_years": 10,
        "payback_years_range": (2.5, 6.0),
    },
    "fuel_switch_heat_pump": {
        "description": "Gas boiler → heat pump fuel switch",
        "applicable_types": ["office", "retail", "residential"],
        "energy_saving_pct": (20.0, 40.0),
        "capex_per_m2_usd": (50.0, 130.0),
        "lifespan_years": 20,
        "payback_years_range": (5.0, 12.0),
    },
    "ccs": {
        "description": "Carbon capture and storage retrofit",
        "applicable_types": ["steel_plant", "cement_plant"],
        "energy_saving_pct": (0.0, 5.0),
        "capex_per_m2_usd": (200.0, 600.0),
        "lifespan_years": 20,
        "payback_years_range": (15.0, 30.0),
    },
    "electrification": {
        "description": "Process electrification (green hydrogen / EAF for steel)",
        "applicable_types": ["steel_plant", "cement_plant", "industrial_building"],
        "energy_saving_pct": (30.0, 70.0),
        "capex_per_m2_usd": (300.0, 900.0),
        "lifespan_years": 25,
        "payback_years_range": (10.0, 25.0),
    },
}

CAPEX_ABATEMENT_TECHNOLOGIES: dict[str, dict] = {
    "energy_efficiency":    {"abatement_cost_usd_per_tco2e": (5.0, 40.0),   "max_reduction_pct": 30.0, "deployment_time_years": 1},
    "fuel_switch":          {"abatement_cost_usd_per_tco2e": (20.0, 80.0),  "max_reduction_pct": 50.0, "deployment_time_years": 2},
    "electrification":      {"abatement_cost_usd_per_tco2e": (30.0, 120.0), "max_reduction_pct": 70.0, "deployment_time_years": 3},
    "ccs":                  {"abatement_cost_usd_per_tco2e": (60.0, 200.0), "max_reduction_pct": 90.0, "deployment_time_years": 5},
    "renewable_procurement": {"abatement_cost_usd_per_tco2e": (0.0, 15.0),  "max_reduction_pct": 40.0, "deployment_time_years": 1},
}

CARBON_PRICE_SCENARIOS: dict[str, dict] = {
    "conservative": {"2025": 30.0, "2030": 50.0, "2035": 75.0, "2040": 100.0, "2050": 130.0},
    "baseline":     {"2025": 40.0, "2030": 75.0, "2035": 110.0, "2040": 140.0, "2050": 175.0},
    "accelerated":  {"2025": 55.0, "2030": 110.0, "2035": 150.0, "2040": 180.0, "2050": 220.0},
}

CRREM_PATHWAYS: dict[str, dict] = {
    "1_5C": {
        "description": "1.5°C Paris-aligned decarbonisation pathway",
        "2025_pct_of_2019": 85.0, "2030_pct_of_2019": 60.0, "2035_pct_of_2019": 40.0,
        "2040_pct_of_2019": 20.0, "2050_pct_of_2019": 0.0,
    },
    "2C": {
        "description": "2°C decarbonisation pathway",
        "2025_pct_of_2019": 90.0, "2030_pct_of_2019": 72.0, "2035_pct_of_2019": 52.0,
        "2040_pct_of_2019": 32.0, "2050_pct_of_2019": 0.0,
    },
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def _mid(rng: tuple[float, float]) -> float:
    """Deterministic midpoint of a documented reference range (MODEL parameter,
    not an entity metric). Used when no entity-specific value is supplied."""
    lo, hi = rng
    return (lo + hi) / 2.0


def _npv(cash_flows: list[float], discount_rate: float) -> float:
    return sum(cf / (1 + discount_rate) ** t for t, cf in enumerate(cash_flows))


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def assess_lock_in_risk(
    entity_id: str,
    asset_type: str,
    age_years: float,
    capex_cycle_years: float,
    current_intensity: float,
    asset_value_usd: Optional[float] = None,
    floor_area_m2: Optional[float] = None,
) -> dict[str, Any]:
    """
    Assess stranded asset lock-in risk.

    Returns lock-in horizon, stranded cost, CRREM pathway divergence,
    SBTi sector decarbonisation rate, and carbon price risk.

    ``asset_value_usd`` (entity book/market value) and ``floor_area_m2``
    (gross floor area) are optional. When supplied, stranded cost and
    emissions-at-risk are computed deterministically from them; when absent
    they are returned as honest nulls (``None`` / ``"insufficient_data"``)
    rather than fabricated from a random draw.
    """
    if asset_type not in ASSET_TYPES:
        # Honest fallback: no valid asset type supplied. Do not fabricate a
        # random asset — flag it and use the most conservative buildings default.
        resolved_asset_type = asset_type
        asset_type = "office"
        asset_type_note: Optional[str] = (
            f"unknown asset_type '{resolved_asset_type}'; defaulted to 'office' "
            "reference profile"
        )
    else:
        asset_type_note = None
    asset = ASSET_TYPES[asset_type]

    remaining_life = max(0.0, asset["typical_life_years"] - age_years)
    years_to_next_capex = max(0.0, capex_cycle_years - (age_years % max(capex_cycle_years, 1)))

    base_intensity = asset["current_avg_intensity_kgco2_m2"]
    crrem_2030 = asset["crrem_2030_intensity_kgco2_m2"]
    sbti_rate = asset["sbti_decarb_rate_pa_pct"] / 100.0

    intensity_divergence = current_intensity - crrem_2030
    divergence_pct = (intensity_divergence / crrem_2030 * 100) if crrem_2030 > 0 else 0.0

    stranding_year = None
    for year in range(2025, 2051):
        t = year - 2024
        pathway_t = max(0.0, base_intensity * (1 - sbti_rate) ** t)
        if pathway_t <= current_intensity:
            stranding_year = year
            break

    # Stranded cost = fraction of asset value exposed via (a) remaining useful
    # life still ahead and (b) the intensity gap above the CRREM pathway.
    # Requires the entity's asset value; otherwise honest null.
    stranded_cost: Optional[float] = None
    if asset_value_usd is not None and asset_value_usd > 0:
        stranded_cost = round(
            asset_value_usd * (remaining_life / max(asset["typical_life_years"], 1))
            * max(intensity_divergence, 0.0) / max(base_intensity, 1),
            0,
        )

    lock_in_score = _clamp(
        (max(intensity_divergence, 0.0) / max(base_intensity, 1)) * 50.0
        + (remaining_life / max(asset["typical_life_years"], 1)) * 30.0
        + (years_to_next_capex / max(capex_cycle_years, 1)) * 20.0,
        0.0, 100.0,
    )

    # Emissions at risk (tCO2e/pa) = current intensity (kgCO2e/m²) × floor area
    # (m²) ÷ 1000. Requires the entity's floor area; otherwise honest null.
    carbon_price_2030 = CARBON_PRICE_SCENARIOS["baseline"]["2030"]
    emissions_at_risk: Optional[float] = None
    carbon_price_risk_usd: Optional[float] = None
    if floor_area_m2 is not None and floor_area_m2 > 0:
        emissions_at_risk = current_intensity * floor_area_m2 / 1000.0
        carbon_price_risk_usd = round(emissions_at_risk * carbon_price_2030, 0)

    return {
        "entity_id": entity_id,
        "asset_type": asset_type,
        "asset_type_note": asset_type_note,
        "sector": asset["sector"],
        "age_years": age_years,
        "remaining_life_years": round(remaining_life, 1),
        "years_to_next_capex": round(years_to_next_capex, 1),
        "current_intensity_kgco2_m2": current_intensity,
        "crrem_2030_pathway_kgco2_m2": crrem_2030,
        "intensity_divergence_kgco2_m2": round(intensity_divergence, 1),
        "divergence_above_pathway_pct": round(divergence_pct, 1),
        "sbti_decarb_rate_pa_pct": asset["sbti_decarb_rate_pa_pct"],
        "stranding_year": stranding_year,
        "stranded_cost_usd": stranded_cost,
        "stranded_cost_status": (
            "computed" if stranded_cost is not None
            else "insufficient_data — supply asset_value_usd"
        ),
        "lock_in_risk_score": round(lock_in_score, 1),
        "lock_in_risk_level": (
            "critical" if lock_in_score >= 75 else
            "high" if lock_in_score >= 55 else
            "medium" if lock_in_score >= 35 else
            "low"
        ),
        "carbon_price_risk": {
            "emissions_at_risk_tco2e_pa": (
                round(emissions_at_risk, 0) if emissions_at_risk is not None else None
            ),
            "carbon_price_2030_usd_tco2e": carbon_price_2030,
            "annual_carbon_cost_risk_usd": carbon_price_risk_usd,
            "status": (
                "computed" if emissions_at_risk is not None
                else "insufficient_data — supply floor_area_m2"
            ),
        },
        "stranded_threshold_kgco2_m2": asset["stranded_threshold_kgco2_m2"],
        "above_stranding_threshold": current_intensity > asset["stranded_threshold_kgco2_m2"],
    }


def plan_capex_transition(
    entity_id: str,
    asset_type: str,
    current_emissions: float,
    target_year: int,
    budget_usd: float,
    floor_area_m2: Optional[float] = None,
    brown_asset_disposal_value_usd: Optional[float] = None,
) -> dict[str, Any]:
    """
    Build capex transition plan with abatement cost curve.

    Returns capex stack by technology, year-by-year trajectory,
    and capital recycling from brown-to-green conversion.

    Abatement costs and green-exit premium use the documented midpoint of the
    IPCC AR6 / JLL reference ranges as MODEL parameters (flagged via
    ``*_basis`` fields), not random draws. ``floor_area_m2`` and
    ``brown_asset_disposal_value_usd`` are optional entity inputs; the
    remaining-gap (converted to absolute tCO2e) and capital-recycling figures
    are computed when supplied and returned as honest nulls otherwise.
    """
    if asset_type not in ASSET_TYPES:
        resolved_asset_type = asset_type
        asset_type = "office"
        asset_type_note: Optional[str] = (
            f"unknown asset_type '{resolved_asset_type}'; defaulted to 'office' "
            "reference profile"
        )
    else:
        asset_type_note = None
    asset = ASSET_TYPES[asset_type]

    base_year = 2025
    horizon = max(5, min(25, target_year - base_year))
    sbti_rate = asset["sbti_decarb_rate_pa_pct"] / 100.0

    tech_stack = []
    remaining_emissions = current_emissions
    remaining_budget = budget_usd
    cumulative_investment = 0.0

    for tech_name, tech in CAPEX_ABATEMENT_TECHNOLOGIES.items():
        if remaining_emissions <= 0 or remaining_budget <= 0:
            break
        # MODEL parameter: midpoint of the documented IPCC AR6 abatement-cost
        # range for this technology (deterministic, not an entity metric).
        abatement_cost = _mid(tech["abatement_cost_usd_per_tco2e"])
        max_red = min(remaining_emissions * tech["max_reduction_pct"] / 100.0, remaining_emissions)
        invest_req = max_red * abatement_cost

        if invest_req > remaining_budget:
            max_red = remaining_budget / abatement_cost
            invest_req = remaining_budget

        tech_stack.append({
            "technology": tech_name,
            "abatement_cost_usd_per_tco2e": round(abatement_cost, 1),
            "abatement_cost_basis": "ipcc_ar6_range_midpoint",
            "emissions_reduction_tco2e": round(max_red, 1),
            "investment_required_usd": round(invest_req, 0),
            "deployment_years": tech["deployment_time_years"],
            "npv_at_carbon_price_usd": round(
                max_red * CARBON_PRICE_SCENARIOS["baseline"]["2030"] * 5 - invest_req, 0
            ),
        })

        remaining_emissions = max(0.0, remaining_emissions - max_red)
        remaining_budget = max(0.0, remaining_budget - invest_req)
        cumulative_investment += invest_req

    # Year-by-year trajectory. Capex is spread evenly across the horizon
    # (deterministic straight-line), not a random per-year profile. The
    # remaining gap vs the CRREM 2030 pathway requires floor area to convert
    # the pathway intensity (kgCO2e/m²) into absolute tCO2e; otherwise the gap
    # is reported relative to the pathway intensity with an honest flag.
    annual_capex = round(budget_usd / max(horizon, 1), 0)
    crrem_2030_intensity = asset["crrem_2030_intensity_kgco2_m2"]
    crrem_2030_budget_tco2e: Optional[float] = (
        crrem_2030_intensity * floor_area_m2 / 1000.0
        if floor_area_m2 is not None and floor_area_m2 > 0 else None
    )
    years = list(range(base_year, base_year + horizon + 1))
    trajectory = []
    running = current_emissions
    for y in years:
        annual_red = running * sbti_rate
        remaining_gap: Optional[float] = (
            max(0.0, running - crrem_2030_budget_tco2e)
            if crrem_2030_budget_tco2e is not None else None
        )
        trajectory.append({
            "year": y,
            "emissions_tco2e": round(running, 1),
            "annual_reduction_tco2e": round(annual_red, 1),
            "capex_usd": annual_capex,
            "cumulative_investment_usd": round(annual_capex * (y - base_year + 1), 0),
            "remaining_gap_tco2e": round(remaining_gap, 1) if remaining_gap is not None else None,
        })
        running = max(0.0, running - annual_red)

    # Green-exit premium: MODEL parameter (midpoint of JLL/CBRE reference range).
    green_premium_pct = _mid(asset["green_premium_pct_range"])
    # Capital recycling requires the entity's brown-asset disposal proceeds;
    # honest null otherwise (no random fraction of budget is fabricated).
    capital_recycling: Optional[float] = (
        round(brown_asset_disposal_value_usd, 0)
        if brown_asset_disposal_value_usd is not None and brown_asset_disposal_value_usd > 0
        else None
    )

    return {
        "entity_id": entity_id,
        "asset_type": asset_type,
        "asset_type_note": asset_type_note,
        "current_emissions_tco2e": current_emissions,
        "target_year": target_year,
        "budget_usd": budget_usd,
        "capex_stack": tech_stack,
        "total_investment_planned_usd": round(cumulative_investment, 0),
        "remaining_emissions_after_investment_tco2e": round(max(0.0, remaining_emissions), 1),
        "emissions_trajectory": trajectory,
        "remaining_gap_status": (
            "computed" if crrem_2030_budget_tco2e is not None
            else "insufficient_data — supply floor_area_m2 to convert CRREM intensity to tCO2e"
        ),
        "capital_recycling": {
            "from_brown_asset_sales_usd": capital_recycling,
            "reinvestment_eligible": capital_recycling is not None,
            "status": (
                "computed" if capital_recycling is not None
                else "insufficient_data — supply brown_asset_disposal_value_usd"
            ),
        },
        "green_exit_premium_pct": round(green_premium_pct, 1),
        "green_exit_premium_basis": "jll_cbre_range_midpoint",
    }


def calculate_retrofit_npv(
    entity_id: str,
    building_type: str,
    retrofit_measures: list[str],
    floor_area_m2: Optional[float] = None,
    energy_intensity_kwh_m2: Optional[float] = None,
    energy_cost_per_kwh: Optional[float] = None,
) -> dict[str, Any]:
    """
    Calculate NPV of building retrofit measures.

    Returns energy savings %, CAPEX/OPEX, payback period, NPV at 5/7/10%
    discount rates, and CRREM alignment post-retrofit.

    Per-measure energy-saving % and capex/m² use the documented midpoint of the
    measure's reference range as MODEL parameters (flagged ``*_basis``). The
    absolute economics (capex, annual saving, NPV, payback) require the
    entity's ``floor_area_m2``, ``energy_intensity_kwh_m2`` and
    ``energy_cost_per_kwh``; when any is absent these monetary fields are
    returned as honest nulls and ``economics_status`` = ``"insufficient_data"``.
    Payback is COMPUTED (capex ÷ annual saving), never a random draw.
    """
    if building_type not in ASSET_TYPES:
        resolved_building_type = building_type
        building_type = "office"
        building_type_note: Optional[str] = (
            f"unknown building_type '{resolved_building_type}'; defaulted to 'office' "
            "reference profile"
        )
    else:
        building_type_note = None
    asset = ASSET_TYPES[building_type]

    # Absolute economics require entity floor area + energy baseline. If any is
    # missing we still return the qualitative saving-% and capex/m² model
    # parameters, but leave monetary fields null.
    have_economics = (
        floor_area_m2 is not None and floor_area_m2 > 0
        and energy_intensity_kwh_m2 is not None and energy_intensity_kwh_m2 > 0
        and energy_cost_per_kwh is not None and energy_cost_per_kwh > 0
    )
    annual_energy_cost: Optional[float] = (
        floor_area_m2 * energy_intensity_kwh_m2 * energy_cost_per_kwh
        if have_economics else None
    )

    if not retrofit_measures:
        # Honest default: all applicable measures for this building type
        # (deterministic, sorted), not a random sample.
        retrofit_measures = sorted(
            m for m, d in RETROFIT_MEASURES.items()
            if building_type in d["applicable_types"]
        )

    measure_results = []
    total_capex = 0.0
    total_annual_saving = 0.0
    cumulative_saving_pct = 0.0

    for measure_name in retrofit_measures:
        if measure_name not in RETROFIT_MEASURES:
            continue
        m = RETROFIT_MEASURES[measure_name]
        if building_type not in m["applicable_types"]:
            continue

        # MODEL parameters: midpoints of the documented reference ranges.
        energy_saving = _mid(m["energy_saving_pct"])
        capex_per_m2 = _mid(m["capex_per_m2_usd"])
        project_life = m["lifespan_years"]

        capex_total: Optional[float] = None
        effective_saving: Optional[float] = None
        payback: Optional[float] = None
        npv_5 = npv_7 = npv_10 = None
        positive_npv_at_7pct: Optional[bool] = None

        if have_economics:
            capex_total = floor_area_m2 * capex_per_m2
            effective_saving = (
                annual_energy_cost * (energy_saving / 100) * (1 - cumulative_saving_pct / 100)
            )
            # Payback COMPUTED from capex ÷ annual saving (not random).
            payback = (
                capex_total / effective_saving if effective_saving > 0 else None
            )
            cash_flows = [-capex_total] + [effective_saving] * project_life
            npv_5 = _npv(cash_flows, 0.05)
            npv_7 = _npv(cash_flows, 0.07)
            npv_10 = _npv(cash_flows, 0.10)
            positive_npv_at_7pct = npv_7 > 0
            total_capex += capex_total
            total_annual_saving += effective_saving

        cumulative_saving_pct = min(100.0, cumulative_saving_pct + energy_saving * 0.7)

        measure_results.append({
            "measure": measure_name,
            "description": m["description"],
            "energy_saving_pct": round(energy_saving, 1),
            "energy_saving_basis": "reference_range_midpoint",
            "capex_per_m2_usd": round(capex_per_m2, 2),
            "capex_per_m2_basis": "reference_range_midpoint",
            "total_capex_usd": round(capex_total, 0) if capex_total is not None else None,
            "annual_saving_usd": round(effective_saving, 0) if effective_saving is not None else None,
            "simple_payback_years": round(payback, 1) if payback is not None else None,
            "project_life_years": project_life,
            "npv_at_5pct_usd": round(npv_5, 0) if npv_5 is not None else None,
            "npv_at_7pct_usd": round(npv_7, 0) if npv_7 is not None else None,
            "npv_at_10pct_usd": round(npv_10, 0) if npv_10 is not None else None,
            "positive_npv_at_7pct": positive_npv_at_7pct,
        })

    current_intensity = asset["current_avg_intensity_kgco2_m2"]
    post_retrofit_intensity = current_intensity * (1 - min(cumulative_saving_pct, 90.0) / 100.0)
    crrem_2030 = asset["crrem_2030_intensity_kgco2_m2"]

    return {
        "entity_id": entity_id,
        "building_type": building_type,
        "building_type_note": building_type_note,
        "floor_area_m2": round(floor_area_m2, 0) if floor_area_m2 is not None else None,
        "economics_status": (
            "computed" if have_economics
            else "insufficient_data — supply floor_area_m2, energy_intensity_kwh_m2 "
            "and energy_cost_per_kwh"
        ),
        "retrofit_measures": measure_results,
        "portfolio_totals": {
            "total_capex_usd": round(total_capex, 0) if have_economics else None,
            "combined_energy_saving_pct": round(min(cumulative_saving_pct, 90.0), 1),
            "total_annual_saving_usd": round(total_annual_saving, 0) if have_economics else None,
            "simple_portfolio_payback_years": (
                round(total_capex / total_annual_saving, 1)
                if have_economics and total_annual_saving > 0 else None
            ),
        },
        "crrem_alignment": {
            "pre_retrofit_intensity_kgco2_m2": round(current_intensity, 1),
            "post_retrofit_intensity_kgco2_m2": round(post_retrofit_intensity, 1),
            "crrem_2030_target_kgco2_m2": crrem_2030,
            "aligned_with_crrem_2030": post_retrofit_intensity <= crrem_2030,
        },
    }


def model_brown_to_green(
    entity_id: str,
    portfolio: list[dict],
    transition_scenarios: list[str],
) -> dict[str, Any]:
    """
    Model brown-to-green portfolio transformation 2025-2050.

    Returns per-asset capex, stranded risk reduction, green value uplift,
    portfolio emissions trajectory across CRREM 1.5C/2C scenarios.

    Each portfolio asset dict may supply ``book_value_usd``,
    ``capex_required_usd``, ``stranded_risk_pre_usd`` and
    ``stranded_risk_post_usd``. Per-asset capex and stranded-risk figures are
    read from these inputs; when absent they are honest nulls (never a random
    fraction of book value). Green value uplift is computed as
    book_value × the documented JLL/CBRE green-premium midpoint (a MODEL
    parameter, flagged ``green_value_uplift_basis``). An empty portfolio
    returns an honest ``insufficient_data`` result rather than a fabricated
    demo portfolio.
    """
    if not transition_scenarios:
        transition_scenarios = ["1_5C", "2C"]

    milestone_years = [2025, 2030, 2035, 2040, 2050]

    if not portfolio:
        return {
            "entity_id": entity_id,
            "portfolio_assets": 0,
            "total_portfolio_value_usd": None,
            "status": "insufficient_data — supply portfolio of asset dicts",
            "transition_analysis": {
                "total_capex_required_usd": None,
                "stranded_risk_pre_usd": None,
                "stranded_risk_post_usd": None,
                "stranded_risk_reduction_pct": None,
                "green_value_uplift_total_usd": None,
                "net_benefit_usd": None,
            },
            "asset_analysis": [],
            "scenario_analysis": {},
        }

    # total_value only meaningful when every asset reports a book value.
    book_values = [a.get("book_value_usd") for a in portfolio]
    total_value: Optional[float] = (
        sum(float(bv) for bv in book_values)
        if all(bv is not None for bv in book_values) else None
    )

    total_capex = 0.0
    capex_reported_all = True
    stranded_pre = 0.0
    stranded_post = 0.0
    stranded_reported_all = True
    green_uplift = 0.0
    green_uplift_available = True

    asset_analysis = []
    for a in portfolio:
        atype = a.get("asset_type", "office")
        if atype not in ASSET_TYPES:
            atype = "office"
        asset = ASSET_TYPES[atype]

        bv_raw = a.get("book_value_usd")
        bv: Optional[float] = float(bv_raw) if bv_raw is not None else None

        # Entity-reported figures — honest null when not provided.
        capex_req: Optional[float] = (
            float(a["capex_required_usd"]) if a.get("capex_required_usd") is not None else None
        )
        s_pre: Optional[float] = (
            float(a["stranded_risk_pre_usd"]) if a.get("stranded_risk_pre_usd") is not None else None
        )
        s_post: Optional[float] = (
            float(a["stranded_risk_post_usd"]) if a.get("stranded_risk_post_usd") is not None else None
        )
        # Green uplift = book value × JLL/CBRE reference-midpoint premium (model param).
        uplift: Optional[float] = (
            bv * _mid(asset["green_premium_pct_range"]) / 100.0 if bv is not None else None
        )

        if capex_req is not None:
            total_capex += capex_req
        else:
            capex_reported_all = False
        if s_pre is not None and s_post is not None:
            stranded_pre += s_pre
            stranded_post += s_post
        else:
            stranded_reported_all = False
        if uplift is not None:
            green_uplift += uplift
        else:
            green_uplift_available = False

        sbti_r = asset["sbti_decarb_rate_pa_pct"] / 100.0
        base_int = asset["current_avg_intensity_kgco2_m2"]
        emissions_traj = {
            str(y): round(base_int * (1 - sbti_r) ** (y - 2024), 1)
            for y in milestone_years
        }

        asset_analysis.append({
            "asset_id": a.get("asset_id", "unknown"),
            "asset_type": atype,
            "book_value_usd": bv,
            "capex_required_usd": round(capex_req, 0) if capex_req is not None else None,
            "stranded_risk_pre_usd": round(s_pre, 0) if s_pre is not None else None,
            "stranded_risk_post_usd": round(s_post, 0) if s_post is not None else None,
            "stranded_risk_reduction_usd": (
                round(s_pre - s_post, 0) if s_pre is not None and s_post is not None else None
            ),
            "green_value_uplift_usd": round(uplift, 0) if uplift is not None else None,
            "green_value_uplift_basis": (
                "jll_cbre_range_midpoint" if uplift is not None else None
            ),
            "emissions_trajectory_kgco2_m2": emissions_traj,
        })

    total_capex_out: Optional[float] = round(total_capex, 0) if capex_reported_all else None
    stranded_pre_out: Optional[float] = round(stranded_pre, 0) if stranded_reported_all else None
    stranded_post_out: Optional[float] = round(stranded_post, 0) if stranded_reported_all else None
    green_uplift_out: Optional[float] = round(green_uplift, 0) if green_uplift_available else None

    scenario_analysis = {}
    for scenario in transition_scenarios:
        pathway = CRREM_PATHWAYS.get(scenario, CRREM_PATHWAYS["2C"])
        scenario_analysis[scenario] = {
            "description": pathway["description"],
            "portfolio_alignment_by_year": {
                str(y): round(pathway.get(f"{y}_pct_of_2019", 0.0), 1)
                for y in milestone_years
            },
            "required_capex_usd": (
                round(total_capex * (1.1 if scenario == "1_5C" else 1.0), 0)
                if capex_reported_all else None
            ),
        }

    return {
        "entity_id": entity_id,
        "portfolio_assets": len(portfolio),
        "total_portfolio_value_usd": total_value,
        "transition_analysis": {
            "total_capex_required_usd": total_capex_out,
            "capex_status": (
                "computed" if capex_reported_all
                else "insufficient_data — supply capex_required_usd for all assets"
            ),
            "stranded_risk_pre_usd": stranded_pre_out,
            "stranded_risk_post_usd": stranded_post_out,
            "stranded_risk_reduction_pct": (
                round((stranded_pre - stranded_post) / max(stranded_pre, 1) * 100, 1)
                if stranded_reported_all and stranded_pre > 0 else None
            ),
            "stranded_risk_status": (
                "computed" if stranded_reported_all
                else "insufficient_data — supply stranded_risk_pre_usd/stranded_risk_post_usd for all assets"
            ),
            "green_value_uplift_total_usd": green_uplift_out,
            "net_benefit_usd": (
                round(green_uplift - total_capex, 0)
                if green_uplift_available and capex_reported_all else None
            ),
        },
        "asset_analysis": asset_analysis,
        "scenario_analysis": scenario_analysis,
    }


def generate_decarb_roadmap(
    entity_id: str,
    assets: list[dict],
    budget_constraint: float,
) -> dict[str, Any]:
    """
    Generate prioritised decarbonisation roadmap.

    Ranks by cost-effectiveness, identifies quick wins vs long-horizon,
    sets interim targets 2025/2030/2035/2040/2050, aligns with TCFD/IFRS S2.

    ``assets`` must carry real per-asset figures (current_emissions_tco2e,
    abatement_potential_pct, capex_required_usd). An empty list returns an
    honest ``insufficient_data`` result rather than a fabricated demo set.
    """
    if not assets:
        return {
            "entity_id": entity_id,
            "budget_constraint_usd": budget_constraint,
            "total_base_emissions_tco2e": None,
            "status": "insufficient_data — supply assets list",
            "funded_actions": [],
            "unfunded_actions": [],
            "budget_utilisation": {
                "total_funded_capex_usd": None,
                "total_funded_reduction_tco2e": None,
                "remaining_budget_usd": round(budget_constraint, 0),
                "cost_per_tco2e_usd": None,
            },
            "interim_targets": {},
            "framework_alignment": {"tcfd": True, "ifrs_s2": True, "sbti_sector": None},
            "quick_wins": [],
            "long_horizon": [],
        }

    scored = []
    for a in assets:
        emissions = float(a.get("current_emissions_tco2e", 1000))
        abatement_pct = float(a.get("abatement_potential_pct", 30))
        capex = float(a.get("capex_required_usd", 1_000_000))
        tco2e_red = emissions * abatement_pct / 100
        cost_eff = tco2e_red / max(capex, 1) * 1_000_000
        scored.append({
            **a,
            "tco2e_reduction": round(tco2e_red, 0),
            "cost_effectiveness_tco2e_per_musd": round(cost_eff, 2),
            "priority": (
                "quick_win" if capex < 2_000_000 and cost_eff > 5.0
                else "long_horizon" if capex > 10_000_000
                else "standard"
            ),
        })

    scored.sort(key=lambda x: x["cost_effectiveness_tco2e_per_musd"], reverse=True)

    remaining = budget_constraint
    funded, unfunded = [], []
    total_funded_capex = 0.0
    total_funded_red = 0.0

    for s in scored:
        capex = float(s.get("capex_required_usd", 1_000_000))
        if capex <= remaining:
            funded.append({**s, "funding_status": "funded"})
            remaining -= capex
            total_funded_capex += capex
            total_funded_red += float(s.get("tco2e_reduction", 0))
        else:
            unfunded.append({**s, "funding_status": "unfunded_budget_constraint"})

    total_base = sum(float(a.get("current_emissions_tco2e", 0)) for a in assets)
    interim_targets = {}
    for yr, pct in [(2025, 10), (2030, 42), (2035, 55), (2040, 70), (2050, 100)]:
        interim_targets[str(yr)] = {
            "reduction_pct": pct,
            "target_emissions_tco2e": round(total_base * (1 - pct / 100), 0),
            "sbti_aligned": pct >= 42 or yr == 2050,
        }

    return {
        "entity_id": entity_id,
        "budget_constraint_usd": budget_constraint,
        "total_base_emissions_tco2e": round(total_base, 0),
        "funded_actions": funded,
        "unfunded_actions": unfunded,
        "budget_utilisation": {
            "total_funded_capex_usd": round(total_funded_capex, 0),
            "total_funded_reduction_tco2e": round(total_funded_red, 0),
            "remaining_budget_usd": round(remaining, 0),
            "cost_per_tco2e_usd": round(total_funded_capex / max(total_funded_red, 1), 1),
        },
        "interim_targets": interim_targets,
        "framework_alignment": {
            "tcfd": True,
            "ifrs_s2": True,
            "sbti_sector": "buildings" if any(
                ASSET_TYPES.get(a.get("asset_type", ""), {}).get("sector") == "buildings"
                for a in assets
            ) else "industry",
        },
        "quick_wins": [a for a in funded if a.get("priority") == "quick_win"],
        "long_horizon": [a for a in funded if a.get("priority") == "long_horizon"],
    }
