"""
Water Risk & Security Engine (E53)
===================================
WRI Aqueduct 4.0, CDP Water Security A-List, CSRD ESRS E3,
TNFD Water Dependency (ENCORE), CEO Water Mandate, UN SDG 6.

Sub-modules:
  1. Aqueduct Risk       — WRI Aqueduct 4.0 indicator-based scoring
  2. CDP Water           — CDP Water Security grade + A-list eligibility
  3. ESRS E3             — CSRD mandatory water disclosure assessment
  4. TNFD Water Dependency — ENCORE database dependency rating
  5. Water Footprint     — Blue/Green/Grey water accounting
  6. Financial Impact    — Revenue-at-risk, compliance cost, capex
  7. Physical Risk Scenarios — RCP 2.6/4.5/8.5 per country
  8. Overall Materiality — Aggregated water materiality score

References:
  - WRI Aqueduct 4.0 (2023)
  - CDP Water Security Questionnaire (2024)
  - CSRD ESRS E3 — Water & Marine Resources (EFRAG 2023)
  - TNFD v1.0 — Nature-related disclosures + ENCORE water services
  - CEO Water Mandate — Corporate Water Stewardship
  - UN SDG 6 — Clean Water and Sanitation
  - IPCC AR6 — Physical Risk Projections (2021)
"""
from __future__ import annotations

from typing import Optional


# ---------------------------------------------------------------------------
# Reference Data
# ---------------------------------------------------------------------------

AQUEDUCT_INDICATORS = [
    "water_stress",
    "water_depletion",
    "interannual_variability",
    "seasonal_variability",
    "groundwater_decline",
    "coastal_eutrophication",
    "untreated_wastewater",
]

AQUEDUCT_WEIGHTS: dict[str, float] = {
    "water_stress": 0.40,
    "water_depletion": 0.25,
    "interannual_variability": 0.10,
    "seasonal_variability": 0.10,
    "groundwater_decline": 0.15,
}

RISK_TIER_BANDS: list[tuple[float, float, str]] = [
    (0.0, 1.0, "Low"),
    (1.0, 2.0, "Low-Medium"),
    (2.0, 3.0, "Medium-High"),
    (3.0, 4.0, "High"),
    (4.0, 5.0, "Extremely High"),
]

# Country-specific base stress multipliers (0-1 applied to 0-5 scale)
COUNTRY_STRESS: dict[str, float] = {
    "IN": 0.85, "CN": 0.75, "US": 0.50, "GB": 0.30,
    "BR": 0.40, "ZA": 0.70, "AU": 0.65, "DE": 0.35,
    "FR": 0.38, "MX": 0.60, "ID": 0.45, "SA": 0.95,
    "EG": 0.90, "PK": 0.88, "NG": 0.55, "JP": 0.40,
    "IT": 0.48, "TR": 0.62, "IR": 0.82, "PL": 0.36,
}

HIGH_WATER_DEPENDENCY_SECTORS = {
    "agriculture", "beverages", "textiles", "mining",
    "semiconductor", "food_processing", "paper", "chemicals",
}

ENCORE_WATER_SERVICES = [
    "Surface water regulation",
    "Groundwater recharge",
    "Water purification",
    "Flood regulation",
    "Sediment regulation",
    "Coastal wetland services",
]

# Sector water footprint multipliers (m3/unit)
SECTOR_WATER_INTENSITY: dict[str, dict[str, float]] = {
    "agriculture":    {"blue": 500.0, "green": 1200.0, "grey": 200.0},
    "beverages":      {"blue": 80.0,  "green": 150.0,  "grey": 30.0},
    "textiles":       {"blue": 200.0, "green": 50.0,   "grey": 100.0},
    "mining":         {"blue": 300.0, "green": 0.0,    "grey": 80.0},
    "semiconductor":  {"blue": 15.0,  "green": 0.0,    "grey": 5.0},
    "food_processing":{"blue": 60.0,  "green": 200.0,  "grey": 40.0},
    "manufacturing":  {"blue": 30.0,  "green": 10.0,   "grey": 20.0},
    "energy":         {"blue": 40.0,  "green": 0.0,    "grey": 15.0},
    "other":          {"blue": 20.0,  "green": 10.0,   "grey": 10.0},
}

WATER_FOOTPRINT_THRESHOLD: dict[str, float] = {
    "agriculture": 5_000_000.0,
    "beverages": 500_000.0,
    "textiles": 1_000_000.0,
    "mining": 2_000_000.0,
    "semiconductor": 100_000.0,
    "food_processing": 800_000.0,
    "manufacturing": 300_000.0,
    "energy": 400_000.0,
    "other": 200_000.0,
}

PHYSICAL_RISK_BY_COUNTRY: dict[str, dict[str, str]] = {
    "IN": {"rcp26": "High", "rcp45": "Very High", "rcp85": "Extreme"},
    "CN": {"rcp26": "Medium-High", "rcp45": "High", "rcp85": "Very High"},
    "US": {"rcp26": "Medium", "rcp45": "Medium-High", "rcp85": "High"},
    "GB": {"rcp26": "Low", "rcp45": "Low-Medium", "rcp85": "Medium"},
    "BR": {"rcp26": "Medium", "rcp45": "High", "rcp85": "Very High"},
    "ZA": {"rcp26": "High", "rcp45": "Very High", "rcp85": "Extreme"},
    "AU": {"rcp26": "Medium-High", "rcp45": "High", "rcp85": "Very High"},
    "DE": {"rcp26": "Low", "rcp45": "Low-Medium", "rcp85": "Medium"},
    "SA": {"rcp26": "Very High", "rcp45": "Extreme", "rcp85": "Extreme"},
    "EG": {"rcp26": "Very High", "rcp45": "Extreme", "rcp85": "Extreme"},
}

ADAPTATION_OPTIONS = [
    "Water recycling and reuse systems",
    "Rainwater harvesting",
    "Efficiency upgrades (drip irrigation, low-flow)",
    "Groundwater recharge programs",
    "Water rights diversification",
    "Supplier watershed stewardship programs",
    "Real-time monitoring and leakage detection",
    "Product reformulation to reduce water intensity",
]

# ---------------------------------------------------------------------------
# Physical-risk model calibration (deterministic model parameters, NOT reported
# figures). Central-estimate water-stress increase (%) and flood-frequency
# multiplier by RCP scenario and horizon, indexed to a Medium baseline hazard.
# Sourced from IPCC AR6 WGI Ch.8 and WRI Aqueduct climate projections; a country's
# qualitative hazard tier (PHYSICAL_RISK_BY_COUNTRY) scales these central estimates.
# ---------------------------------------------------------------------------

_RCP_SCENARIO_CENTRAL: dict[str, dict[str, dict[str, float]]] = {
    "2030": {
        "rcp26": {"water_stress_change_pct": 5.5, "flood_frequency_multiplier": 1.20},
        "rcp45": {"water_stress_change_pct": 11.5, "flood_frequency_multiplier": 1.35},
        "rcp85": {"water_stress_change_pct": 20.0, "flood_frequency_multiplier": 1.60},
    },
    "2050": {
        "rcp26": {"water_stress_change_pct": 8.5, "flood_frequency_multiplier": 1.35},
        "rcp45": {"water_stress_change_pct": 20.0, "flood_frequency_multiplier": 1.60},
        "rcp85": {"water_stress_change_pct": 40.0, "flood_frequency_multiplier": 2.15},
    },
}

# Hazard-tier scaling applied to the central estimate above (Medium = 1.0).
_HAZARD_TIER_SCALE: dict[str, float] = {
    "Low": 0.55,
    "Low-Medium": 0.75,
    "Medium": 1.00,
    "Medium-High": 1.20,
    "High": 1.40,
    "Very High": 1.65,
    "Extreme": 1.90,
}


# ---------------------------------------------------------------------------
# Engine Class
# ---------------------------------------------------------------------------

class WaterRiskEngine:
    """Water Risk & Security Engine (E53)."""

    # ------------------------------------------------------------------
    # 1. WRI Aqueduct 4.0 Risk Assessment
    # ------------------------------------------------------------------

    def assess_aqueduct_risk(
        self,
        entity_id: str,
        country_code: str,
        sector: str,
        basin_name: Optional[str] = None,
        indicator_scores: Optional[dict[str, float]] = None,
    ) -> dict:
        """
        WRI Aqueduct 4.0 — 7 physical risk indicators on 0-5 scale.
        Weighted composite determines risk tier.

        `indicator_scores` accepts caller-supplied Aqueduct 0-5 raw scores keyed by
        indicator name (from a real Aqueduct basin lookup). Any indicator not supplied
        falls back to the country's reference base-stress level (COUNTRY_STRESS × 5),
        which is a documented deterministic proxy — never a random draw.
        """
        base_mult = COUNTRY_STRESS.get(country_code.upper(), 0.50)
        country_base = round(base_mult * 5.0, 2)

        supplied = indicator_scores or {}

        # Indicator scores: caller-supplied Aqueduct raw values where available,
        # else the country reference base-stress level (deterministic proxy).
        indicators: dict[str, float] = {}
        proxied: list[str] = []
        for ind in AQUEDUCT_INDICATORS:
            if ind in supplied and supplied[ind] is not None:
                indicators[ind] = round(max(0.0, min(5.0, float(supplied[ind]))), 2)
            else:
                indicators[ind] = country_base
                proxied.append(ind)

        # Weighted overall score using primary indicators
        overall = sum(
            indicators[k] * v
            for k, v in AQUEDUCT_WEIGHTS.items()
        )
        overall = round(overall, 2)

        risk_tier = "Low"
        for lo, hi, label in RISK_TIER_BANDS:
            if lo <= overall < hi:
                risk_tier = label
                break
        if overall >= 4.0:
            risk_tier = "Extremely High"

        basin_factors: list[str] = []
        if indicators["groundwater_decline"] > 3.0:
            basin_factors.append("Groundwater over-exploitation risk")
        if indicators["water_stress"] > 3.5:
            basin_factors.append("High competition for water resources")
        if indicators["coastal_eutrophication"] > 3.0:
            basin_factors.append("Coastal eutrophication concern")
        if indicators["untreated_wastewater"] > 3.0:
            basin_factors.append("Inadequate wastewater treatment infrastructure")

        data_note = None
        if proxied:
            data_note = (
                "proxy: indicators "
                + ", ".join(proxied)
                + " use country reference base-stress (COUNTRY_STRESS); "
                "supply indicator_scores from an Aqueduct basin lookup for entity-specific values"
            )

        return {
            "entity_id": entity_id,
            "country_code": country_code.upper(),
            "sector": sector,
            "basin_name": basin_name or f"{country_code.upper()}_primary_basin",
            "indicators": indicators,
            "country_base_stress": country_base,
            "proxied_indicators": proxied,
            "overall_score": overall,
            "risk_tier": risk_tier,
            "basin_specific_factors": basin_factors,
            "data_note": data_note,
            "source": "WRI Aqueduct 4.0 (2023)",
        }

    # ------------------------------------------------------------------
    # 2. CDP Water Security Assessment
    # ------------------------------------------------------------------

    def assess_cdp_water(
        self,
        entity_id: str,
        governance_score: float,
        risk_score: float,
        target_score: float,
    ) -> dict:
        """
        CDP Water Security questionnaire scoring.
        Grade bands: A(90+), A-(80+), B+(70+), B(60+), C(50+), D(<50).
        """
        cdp_weighted = round(
            governance_score * 0.4 + risk_score * 0.3 + target_score * 0.3, 2
        )
        a_list_eligible = cdp_weighted >= 80.0

        if cdp_weighted >= 90.0:
            grade = "A"
        elif cdp_weighted >= 80.0:
            grade = "A-"
        elif cdp_weighted >= 70.0:
            grade = "B+"
        elif cdp_weighted >= 60.0:
            grade = "B"
        elif cdp_weighted >= 50.0:
            grade = "C"
        else:
            grade = "D"

        gap_to_a_list = round(max(0.0, 80.0 - cdp_weighted), 2)

        return {
            "entity_id": entity_id,
            "governance_score": round(governance_score, 2),
            "risk_score": round(risk_score, 2),
            "target_score": round(target_score, 2),
            "weighted_score": cdp_weighted,
            "grade": grade,
            "a_list_eligible": a_list_eligible,
            "gap_to_a_list": gap_to_a_list,
            "methodology": "CDP Water Security Questionnaire 2024",
        }

    # ------------------------------------------------------------------
    # 3. CSRD ESRS E3 Disclosure Assessment
    # ------------------------------------------------------------------

    def assess_esrs_e3(
        self,
        entity_id: str,
        withdrawal_m3_pa: float,
        consumption_m3_pa: float,
        discharge_m3_pa: float,
        recycled_pct: float,
        water_stress_areas_disclosed: Optional[bool] = None,
        targets_set: Optional[bool] = None,
        water_policy_documented: Optional[bool] = None,
    ) -> dict:
        """
        CSRD ESRS E3 mandatory water disclosure completeness and compliance.

        The quantitative components (withdrawal/consumption/discharge/recycled) are
        derived directly from the supplied figures. The three qualitative components
        (water-stress-area disclosure, targets set, water policy documented) are
        entity-reported facts — they must be supplied by the caller. When absent they
        are treated as not-yet-disclosed (False) and the completeness score is flagged
        as a floor via `disclosure_note`; they are never fabricated.
        """
        efficiency_ratio = round(consumption_m3_pa / withdrawal_m3_pa, 4) if withdrawal_m3_pa > 0 else 0.0
        water_intensive = withdrawal_m3_pa > 10_000_000 or recycled_pct < 20.0

        qualitative_supplied = all(
            v is not None
            for v in (water_stress_areas_disclosed, targets_set, water_policy_documented)
        )

        # Disclosure completeness scoring (0-100). Quantitative components are
        # objectively derivable; qualitative components use caller-reported flags,
        # defaulting to False (not-yet-disclosed) rather than a random draw.
        components = {
            "withdrawal_disclosed": withdrawal_m3_pa > 0,
            "consumption_disclosed": consumption_m3_pa > 0,
            "discharge_disclosed": discharge_m3_pa > 0,
            "recycled_pct_disclosed": recycled_pct >= 0,
            "water_stress_areas": bool(water_stress_areas_disclosed) if water_stress_areas_disclosed is not None else False,
            "targets_set": bool(targets_set) if targets_set is not None else False,
            "water_policy_documented": bool(water_policy_documented) if water_policy_documented is not None else False,
        }
        disclosure_score = round(sum(components.values()) / len(components) * 100, 2)
        esrs_e3_compliant = disclosure_score >= 70.0

        disclosure_note = None
        if not qualitative_supplied:
            disclosure_note = (
                "insufficient_data: qualitative disclosure flags "
                "(water_stress_areas_disclosed / targets_set / water_policy_documented) "
                "not fully supplied; missing flags counted as not-disclosed, so "
                "disclosure_score is a lower bound"
            )

        return {
            "entity_id": entity_id,
            "withdrawal_m3_pa": round(withdrawal_m3_pa, 1),
            "consumption_m3_pa": round(consumption_m3_pa, 1),
            "discharge_m3_pa": round(discharge_m3_pa, 1),
            "recycled_pct": round(recycled_pct, 2),
            "water_intensive": water_intensive,
            "efficiency_ratio": efficiency_ratio,
            "disclosure_components": components,
            "disclosure_score": disclosure_score,
            "esrs_e3_compliant": esrs_e3_compliant,
            "disclosure_note": disclosure_note,
            "mandatory_disclosures": ["E3-1", "E3-2", "E3-3", "E3-4", "E3-5"],
            "standard": "CSRD ESRS E3 Water & Marine Resources",
        }

    # ------------------------------------------------------------------
    # 4. TNFD Water Dependency (ENCORE)
    # ------------------------------------------------------------------

    def assess_tnfd_water_dependency(
        self,
        entity_id: str,
        sector: str,
        value_chain_stage: str,
        dependency_score: Optional[float] = None,
    ) -> dict:
        """
        TNFD ENCORE-based water dependency assessment.
        Rates dependency by sector and value chain position.

        `dependency_score` accepts a caller-supplied 0-100 ENCORE materiality-of-
        dependency rating. When absent, the score is left null and the rating is
        derived qualitatively from ENCORE's high-water-dependency sector list
        (deterministic band), rather than a random draw. ENCORE water services are
        the full set of ecosystem services relevant to the sector's dependency band.
        """
        is_high_dep = sector.lower() in HIGH_WATER_DEPENDENCY_SECTORS

        if dependency_score is not None:
            score = round(max(0.0, min(100.0, float(dependency_score))), 1)
            if score >= 75.0:
                dependency_rating = "Very High"
            elif score >= 55.0:
                dependency_rating = "High"
            elif score >= 35.0:
                dependency_rating = "Medium"
            else:
                dependency_rating = "Low"
            score_note = None
        else:
            # No entity-reported score: qualitative rating from ENCORE sector band.
            score = None
            dependency_rating = "High" if is_high_dep else "Low"
            score_note = (
                "insufficient_data: dependency_score not supplied; dependency_rating "
                "derived from ENCORE high-water-dependency sector classification only"
            )

        # ENCORE water ecosystem services: high-dependency sectors relate to the full
        # set of freshwater provisioning/regulating services; others to core
        # regulation services. Deterministic mapping (no sampling).
        if is_high_dep:
            encore_services = list(ENCORE_WATER_SERVICES)
        else:
            encore_services = [
                "Surface water regulation",
                "Groundwater recharge",
                "Water purification",
            ]

        hotspots = []
        if value_chain_stage.lower() in ["upstream", "raw_material"]:
            hotspots.append("Primary production water extraction")
        if sector.lower() in ["agriculture", "food_processing"]:
            hotspots.append("Irrigation water demand")
        if is_high_dep:
            hotspots.append(f"High water intensity in {sector} operations")

        return {
            "entity_id": entity_id,
            "sector": sector,
            "value_chain_stage": value_chain_stage,
            "dependency_score": score,
            "dependency_rating": dependency_rating,
            "score_note": score_note,
            "encore_water_services": encore_services,
            "value_chain_hotspots": hotspots,
            "assessment_framework": "TNFD v1.0 + ENCORE database",
        }

    # ------------------------------------------------------------------
    # 5. Water Footprint (Blue/Green/Grey)
    # ------------------------------------------------------------------

    def calculate_water_footprint(
        self,
        entity_id: str,
        product_name: str,
        annual_volume: float,
        sector: str,
        blue_m3_per_unit: Optional[float] = None,
        green_m3_per_unit: Optional[float] = None,
        grey_m3_per_unit: Optional[float] = None,
        scarcity_multiplier: Optional[float] = None,
    ) -> dict:
        """
        Water footprint accounting: Blue (surface/ground), Green (rain), Grey (dilution).

        Per-unit blue/green/grey intensities default to the sector reference
        (SECTOR_WATER_INTENSITY) but can be overridden with entity-specific measured
        values. `scarcity_multiplier` is the AWARE/Aqueduct water-scarcity
        characterisation factor for the operating basin; when absent the
        scarcity-adjusted footprint is returned as null (not fabricated).
        """
        sec = sector.lower() if sector.lower() in SECTOR_WATER_INTENSITY else "other"
        wf = SECTOR_WATER_INTENSITY[sec]

        # Per-unit footprint: caller-measured values where supplied, else the
        # sector reference intensity (deterministic — no random variation).
        blue_m3 = round(float(blue_m3_per_unit) if blue_m3_per_unit is not None else wf["blue"], 3)
        green_m3 = round(float(green_m3_per_unit) if green_m3_per_unit is not None else wf["green"], 3)
        grey_m3 = round(float(grey_m3_per_unit) if grey_m3_per_unit is not None else wf["grey"], 3)
        total_m3 = round(blue_m3 + green_m3 + grey_m3, 3)

        annual_total = round(total_m3 * annual_volume, 1)
        threshold = WATER_FOOTPRINT_THRESHOLD.get(sec, 200_000.0)
        hotspot_flag = annual_total > threshold

        # Water scarcity adjusted footprint requires a real characterisation factor.
        if scarcity_multiplier is not None:
            stress_multiplier = round(max(0.0, float(scarcity_multiplier)), 2)
            water_scarcity_adjusted = round(annual_total * stress_multiplier, 1)
            scarcity_note = None
        else:
            stress_multiplier = None
            water_scarcity_adjusted = None
            scarcity_note = (
                "insufficient_data: scarcity_multiplier (AWARE/Aqueduct characterisation "
                "factor) not supplied; scarcity-adjusted footprint unavailable"
            )

        return {
            "entity_id": entity_id,
            "product_name": product_name,
            "sector": sec,
            "annual_volume": annual_volume,
            "blue_m3_per_unit": blue_m3,
            "green_m3_per_unit": green_m3,
            "grey_m3_per_unit": grey_m3,
            "total_m3_per_unit": total_m3,
            "annual_total_m3": annual_total,
            "hotspot_flag": hotspot_flag,
            "hotspot_threshold_m3": threshold,
            "scarcity_multiplier": stress_multiplier,
            "water_scarcity_adjusted_m3": water_scarcity_adjusted,
            "scarcity_note": scarcity_note,
            "methodology": "ISO 14046 Water Footprint + WFN v2",
        }

    # ------------------------------------------------------------------
    # 6. Financial Impact Assessment
    # ------------------------------------------------------------------

    def assess_financial_impact(
        self,
        entity_id: str,
        water_stress_score: float,
        annual_revenue_usd: float,
        withdrawal_m3_pa: float,
    ) -> dict:
        """
        Financial materiality of water risk: revenue-at-risk, compliance costs,
        capex resilience, and insurance premium impact.

        All outputs are deterministic functions of the supplied water-stress score,
        revenue, and withdrawal volume using documented model coefficients.
        """
        # Revenue at risk
        revenue_at_risk_pct = round(min(water_stress_score * 0.6, 3.0), 3)
        revenue_at_risk_usd = round(annual_revenue_usd * revenue_at_risk_pct / 100.0, 0)

        # Compliance cost (water abstraction charges + treatment)
        compliance_cost_usd_pa = round(withdrawal_m3_pa * 0.05, 0)

        # Resilience capex
        capex_resilience_usd = round(revenue_at_risk_pct / 100.0 * annual_revenue_usd * 0.3, 0)

        # Insurance premium uplift — deterministic in water-stress score
        # (1.5 pp per stress point). Model coefficient, not a reported figure.
        insurance_premium_uplift_pct = round(water_stress_score * 1.5, 2)

        stress_norm = water_stress_score / 5.0 if water_stress_score <= 5.0 else 1.0
        if stress_norm >= 0.8:
            stranded_asset_risk = "High"
        elif stress_norm >= 0.5:
            stranded_asset_risk = "Medium"
        else:
            stranded_asset_risk = "Low"

        return {
            "entity_id": entity_id,
            "water_stress_score": round(water_stress_score, 2),
            "annual_revenue_usd": annual_revenue_usd,
            "revenue_at_risk_pct": revenue_at_risk_pct,
            "revenue_at_risk_usd": revenue_at_risk_usd,
            "compliance_cost_usd_pa": compliance_cost_usd_pa,
            "capex_resilience_usd": capex_resilience_usd,
            "insurance_premium_uplift_pct": insurance_premium_uplift_pct,
            "stranded_asset_risk": stranded_asset_risk,
            "tcfd_category": "Physical Risk — Chronic",
        }

    # ------------------------------------------------------------------
    # 7. Physical Risk Scenarios (RCP)
    # ------------------------------------------------------------------

    def assess_physical_risk_scenarios(
        self,
        entity_id: str,
        country_code: str,
        sector: str,
    ) -> dict:
        """
        IPCC AR6 RCP 2.6/4.5/8.5 physical water risk projections per country.

        Scenario deltas are deterministic central estimates from the calibrated
        RCP model tables (_RCP_SCENARIO_CENTRAL), scaled by the country's
        qualitative hazard tier (_HAZARD_TIER_SCALE). These are documented model
        parameters, not random draws or entity-reported figures.
        """
        pr = PHYSICAL_RISK_BY_COUNTRY.get(
            country_code.upper(),
            {"rcp26": "Medium", "rcp45": "Medium-High", "rcp85": "High"},
        )

        def _scenario_delta(horizon: str) -> dict[str, dict[str, float]]:
            out: dict[str, dict[str, float]] = {}
            for rcp in ("rcp26", "rcp45", "rcp85"):
                central = _RCP_SCENARIO_CENTRAL[horizon][rcp]
                scale = _HAZARD_TIER_SCALE.get(pr[rcp], 1.0)
                out[rcp] = {
                    "water_stress_change_pct": round(central["water_stress_change_pct"] * scale, 1),
                    # Flood multiplier scales its excess above 1.0 by the hazard tier.
                    "flood_frequency_multiplier": round(
                        1.0 + (central["flood_frequency_multiplier"] - 1.0) * scale, 2
                    ),
                }
            return out

        scenario_delta_2030 = _scenario_delta("2030")
        scenario_delta_2050 = _scenario_delta("2050")

        return {
            "entity_id": entity_id,
            "country_code": country_code.upper(),
            "sector": sector,
            "rcp26": pr["rcp26"],
            "rcp45": pr["rcp45"],
            "rcp85": pr["rcp85"],
            "scenario_delta_2030": scenario_delta_2030,
            "scenario_delta_2050": scenario_delta_2050,
            "adaptation_options": list(ADAPTATION_OPTIONS),
            "source": "IPCC AR6 WGI Chapter 8 + WRI Aqueduct Climate Projections",
        }

    # ------------------------------------------------------------------
    # 8. Overall Water Materiality
    # ------------------------------------------------------------------

    def compute_overall_water_materiality(
        self,
        entity_id: str,
        aqueduct_score: float,
        cdp_score: float,
        esrs_score: float,
        tnfd_score: float,
        ceo_water_mandate_score: Optional[float] = None,
    ) -> dict:
        """
        Aggregated water materiality score across four frameworks.

        `ceo_water_mandate_score` is an entity self-assessment against the CEO Water
        Mandate's six commitment areas (0-100). It is caller-supplied; when absent it
        is returned as null (never fabricated). SDG 6 alignment is derived
        deterministically from the computed materiality score.
        """
        # Normalise aqueduct (0-5 → 0-100): higher raw = higher risk = lower score
        aqueduct_norm = round((aqueduct_score / 5.0) * 100.0, 2)

        materiality_score = round(
            aqueduct_norm * 0.35
            + cdp_score * 0.25
            + esrs_score * 0.20
            + tnfd_score * 0.20,
            2,
        )

        if materiality_score >= 70.0:
            materiality_rating = "High"
        elif materiality_score >= 50.0:
            materiality_rating = "Medium"
        elif materiality_score >= 30.0:
            materiality_rating = "Low"
        else:
            materiality_rating = "Negligible"

        priority_actions: list[str] = []
        if aqueduct_norm > 60.0:
            priority_actions.append("Relocate/diversify water sources in stressed basins")
        if cdp_score < 60.0:
            priority_actions.append("Improve CDP Water governance and target-setting")
        if esrs_score < 70.0:
            priority_actions.append("Enhance ESRS E3 disclosure completeness")
        if tnfd_score > 60.0:
            priority_actions.append("Develop TNFD water dependency transition plan")

        # SDG 6 alignment: deterministic inverse of materiality (higher water
        # materiality/risk => lower alignment). No noise term.
        sdg6_alignment = round(max(0.0, min(100.0, 100.0 - materiality_score * 0.5)), 2)

        if ceo_water_mandate_score is not None:
            ceo_score = round(max(0.0, min(100.0, float(ceo_water_mandate_score))), 1)
            ceo_note = None
        else:
            ceo_score = None
            ceo_note = (
                "insufficient_data: ceo_water_mandate_score (entity self-assessment "
                "against the CEO Water Mandate's six commitment areas) not supplied"
            )

        return {
            "entity_id": entity_id,
            "input_scores": {
                "aqueduct_raw": round(aqueduct_score, 2),
                "aqueduct_normalised": aqueduct_norm,
                "cdp": round(cdp_score, 2),
                "esrs": round(esrs_score, 2),
                "tnfd": round(tnfd_score, 2),
            },
            "materiality_score": materiality_score,
            "materiality_rating": materiality_rating,
            "priority_actions": priority_actions,
            "sdg6_alignment": sdg6_alignment,
            "ceo_water_mandate_score": ceo_score,
            "ceo_water_mandate_note": ceo_note,
            "frameworks_assessed": ["WRI Aqueduct 4.0", "CDP Water", "CSRD ESRS E3", "TNFD v1.0"],
        }


# ---------------------------------------------------------------------------
# Module-level instance
# ---------------------------------------------------------------------------

_engine = WaterRiskEngine()

assess_aqueduct_risk = _engine.assess_aqueduct_risk
assess_cdp_water = _engine.assess_cdp_water
assess_esrs_e3 = _engine.assess_esrs_e3
assess_tnfd_water_dependency = _engine.assess_tnfd_water_dependency
calculate_water_footprint = _engine.calculate_water_footprint
assess_financial_impact = _engine.assess_financial_impact
assess_physical_risk_scenarios = _engine.assess_physical_risk_scenarios
compute_overall_water_materiality = _engine.compute_overall_water_materiality
