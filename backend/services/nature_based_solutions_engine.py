"""
Nature-Based Solutions & Carbon Sequestration Engine (E52)
==========================================================
IUCN Global Standard v2.0, REDD+ VCS VM0007, Blue Carbon VM0033/VM0024,
Soil Carbon IPCC Tier 1-3, ARR (afforestation), AFOLU net GHG balance.

Sub-modules:
  1. IUCN GS Assessment     — 8 criteria, Gold/Silver/Bronze tier
  2. REDD+ VM0007           — Avoided deforestation net credits
  3. Blue Carbon            — Mangrove/seagrass/saltmarsh/tidal_flat
  4. Soil Carbon            — IPCC Tier 1-3 delta methodology
  5. ARR                    — Afforestation, Reforestation, Revegetation
  6. AFOLU Balance          — Net GHG accounting (CO2 - N2O - CH4)
  7. Credit Quality         — ICVCM CCP-compatible rating + price
  8. Sequestration Timeseries — 30-year project-level projection

References:
  - IUCN Global Standard for Nature-based Solutions v2.0 (2020)
  - Verra VCS VM0007: REDD+ Methodology Framework
  - Verra VCS VM0033: Tidal Wetland and Seagrass Restoration
  - Verra VCS VM0024: Applied Research for Tidal Wetland Carbon
  - IPCC 2006 GL for NGHGI Vol 4 Agriculture, Forestry & Other Land Use
  - SBTi FLAG Guidance (Forests, Land & Agriculture)
  - ICVCM Core Carbon Principles (CCP) 2023
"""
from __future__ import annotations

from typing import Optional


# ---------------------------------------------------------------------------
# Reference Data
# ---------------------------------------------------------------------------

IUCN_CRITERIA = [
    "Effectiveness",
    "Additionality",
    "Inclusivity & Equity",
    "No Net Loss to Biodiversity",
    "Mitigation of trade-offs",
    "Adaptive Management",
    "Sustainability & Scalability",
    "Governance",
]

BLUE_CARBON_RATES: dict[str, float] = {
    "mangrove": 6.2,
    "seagrass": 1.8,
    "saltmarsh": 2.4,
    "tidal_flat": 0.8,
}

BLUE_CARBON_PERMANENCE: dict[str, str] = {
    "mangrove": "low",
    "seagrass": "medium",
    "saltmarsh": "low",
    "tidal_flat": "high",
}

BLUE_CARBON_METHODOLOGY: dict[str, str] = {
    "mangrove": "VM0033",
    "seagrass": "VM0024",
    "saltmarsh": "VM0033",
    "tidal_flat": "VM0024",
}

IPCC_TIER_PARAMS: dict[int, dict] = {
    1: {"delta_tco2_ha_pa": 0.5, "uncertainty_pct": 30.0, "permanence_risk": "high"},
    2: {"delta_tco2_ha_pa": 0.8, "uncertainty_pct": 20.0, "permanence_risk": "medium"},
    3: {"delta_tco2_ha_pa": 1.2, "uncertainty_pct": 10.0, "permanence_risk": "low"},
}

CERTIFICATION_SCHEMES: list[str] = [
    "Verra VCS",
    "Gold Standard",
    "Plan Vivo",
    "American Carbon Registry",
    "Climate Action Reserve",
]

ICVCM_CCP_SCHEMES: list[str] = ["Verra VCS", "Gold Standard", "American Carbon Registry"]

CO_BENEFIT_CERTIFICATIONS: list[str] = [
    "CCBA Climate, Community & Biodiversity",
    "SD Vista",
    "Rainforest Alliance",
]

# ---------------------------------------------------------------------------
# Documented model-calibration constants (methodology defaults, NOT entity data)
# Used only when the caller does not supply the corresponding project-specific
# value; each is flagged in the output via an *_estimated / *_source field so
# callers know the figure is a conservative default rather than measured data.
# ---------------------------------------------------------------------------

# VCS VM0007 REDD+ — conservative default deductions used when the project
# monitoring report does not supply measured values.
#   Leakage belt: VCS AFOLU Non-Permanence Risk Tool typical primary-forest
#   leakage discount; buffer pool: AFOLU risk-rating buffer allocation.
REDD_DEFAULT_LEAKAGE_BELT_PCT: float = 10.0
REDD_DEFAULT_BUFFER_POOL_PCT: dict[bool, float] = {
    True: 15.0,   # jurisdictional programme (lower buffer)
    False: 20.0,  # project-level (higher buffer)
}

# IPCC 2006 GL Vol 4 above-ground biomass accumulation defaults (tCO2/ha/yr)
# for young ARR stands, by species class. Model default when no site-specific
# growth curve (MAI/yield table) is supplied by the caller.
ARR_DEFAULT_AG_RATE_TCO2_HA_PA: dict[str, float] = {
    "native": 3.0,
    "mixed": 3.0,
    "exotic": 3.5,   # faster-growing exotics accumulate AGB quicker
}


# ---------------------------------------------------------------------------
# Engine Class
# ---------------------------------------------------------------------------

class NatureBasedSolutionsEngine:
    """Nature-Based Solutions & Carbon Sequestration Engine (E52)."""

    # ------------------------------------------------------------------
    # 1. IUCN Global Standard v2.0
    # ------------------------------------------------------------------

    def assess_iucn_gs(
        self,
        entity_id: str,
        criteria_scores: list[float],
    ) -> dict:
        """
        IUCN GS v2.0 — 8 criteria, each scored 0-100.
        Returns composite score, tier, and ICVCM compatibility flag.

        Only the criteria scores actually supplied by the caller are used;
        missing criteria are reported as null rather than fabricated. If fewer
        than all 8 criteria are provided the assessment is marked incomplete
        and tier/compatibility are returned as null (insufficient data).
        """
        # Use only supplied scores; do not fabricate missing criteria.
        supplied = [round(float(s), 1) for s in criteria_scores[:8]]
        criteria_supplied = len(supplied)
        # Report per-criterion scores aligned to the 8 IUCN criteria, null where absent.
        scores: list[Optional[float]] = list(supplied) + [None] * (8 - criteria_supplied)

        complete = criteria_supplied == 8

        if criteria_supplied == 0:
            composite: Optional[float] = None
            safeguards_score: Optional[float] = None
            standard_met: Optional[bool] = None
            tier: Optional[str] = None
            icvcm_compatible: Optional[bool] = None
        else:
            composite = round(sum(supplied) / criteria_supplied, 2)
            safeguards_score = round(min(supplied), 2)
            if complete:
                standard_met = composite >= 70.0
                if composite >= 85.0:
                    tier = "Gold"
                elif composite >= 70.0:
                    tier = "Silver"
                else:
                    tier = "Bronze"
                icvcm_compatible = bool(standard_met and safeguards_score >= 55.0)
            else:
                # Partial submission: composite is provisional, but the IUCN GS
                # standard-met / tier / ICVCM determinations require all 8 criteria.
                standard_met = None
                tier = None
                icvcm_compatible = None

        return {
            "entity_id": entity_id,
            "criteria_names": IUCN_CRITERIA,
            "criteria_scores": scores,
            "criteria_supplied": criteria_supplied,
            "assessment_complete": complete,
            "composite_score": composite,
            "safeguards_score": safeguards_score,
            "standard_met": standard_met,
            "tier": tier,
            "icvcm_compatible": icvcm_compatible,
            "data_note": (
                None if complete
                else "insufficient_data: IUCN GS v2.0 requires all 8 criteria; "
                     "tier and ICVCM compatibility withheld until complete."
            ),
            "methodology": "IUCN Global Standard v2.0",
            "assessment_version": "2020",
        }

    # ------------------------------------------------------------------
    # 2. REDD+ VM0007
    # ------------------------------------------------------------------

    def assess_redd_plus(
        self,
        entity_id: str,
        area_ha: float,
        reference_level_tco2_pa: float,
        actual_emissions_tco2_pa: float,
        jurisdictional: bool = False,
        leakage_belt_pct: Optional[float] = None,
        buffer_pool_pct: Optional[float] = None,
    ) -> dict:
        """
        VCS VM0007 REDD+ avoided deforestation methodology.
        Returns net credits after leakage belt and buffer pool deductions.

        ``leakage_belt_pct`` and ``buffer_pool_pct`` are project-specific
        deductions from the VCS monitoring report / AFOLU Non-Permanence Risk
        Tool. When not supplied, conservative documented methodology defaults
        are applied and flagged via ``deductions_estimated``.
        """
        avoided_deforestation = reference_level_tco2_pa - actual_emissions_tco2_pa

        # Track whether deductions came from the caller (measured) or defaults.
        leakage_supplied = leakage_belt_pct is not None
        buffer_supplied = buffer_pool_pct is not None

        leakage = float(leakage_belt_pct) if leakage_supplied else REDD_DEFAULT_LEAKAGE_BELT_PCT
        buffer = float(buffer_pool_pct) if buffer_supplied else REDD_DEFAULT_BUFFER_POOL_PCT[bool(jurisdictional)]
        leakage = round(max(0.0, leakage), 2)
        buffer = round(max(0.0, buffer), 2)

        net_credits = avoided_deforestation * (1 - leakage / 100) * (1 - buffer / 100)
        net_credits = round(max(0.0, net_credits), 2)

        per_ha = round(net_credits / area_ha, 2) if area_ha > 0 else 0.0

        deductions_estimated = (not leakage_supplied) or (not buffer_supplied)

        return {
            "entity_id": entity_id,
            "project_area_ha": round(area_ha, 2),
            "reference_level_tco2_pa": round(reference_level_tco2_pa, 2),
            "actual_emissions_tco2_pa": round(actual_emissions_tco2_pa, 2),
            "avoided_deforestation_tco2_pa": round(avoided_deforestation, 2),
            "leakage_belt_pct": leakage,
            "buffer_pool_pct": buffer,
            "deductions_estimated": deductions_estimated,
            "deductions_source": (
                "caller-supplied VCS monitoring report"
                if not deductions_estimated
                else "VCS VM0007 / AFOLU Non-Permanence Risk Tool conservative default"
            ),
            "net_credits_tco2_pa": net_credits,
            "net_credits_per_ha": per_ha,
            "methodology": "VM0007",
            "permanence_years": 100,
            "jurisdictional": jurisdictional,
            "vcs_validated": True,
        }

    # ------------------------------------------------------------------
    # 3. Blue Carbon
    # ------------------------------------------------------------------

    def assess_blue_carbon(
        self,
        entity_id: str,
        ecosystem_type: str,
        area_ha: float,
        tidal_hydrology_restored: Optional[bool] = None,
        co_benefit_score: Optional[float] = None,
    ) -> dict:
        """
        Blue carbon accounting for coastal/marine ecosystems.
        Methodology: VM0033 (mangrove/saltmarsh) or VM0024 (seagrass/tidal_flat).

        ``tidal_hydrology_restored`` (project design attribute) and
        ``co_benefit_score`` (0-100, from a co-benefit assessment) are
        project-specific inputs; when not supplied they are reported as null
        rather than fabricated.
        """
        eco = ecosystem_type.lower() if ecosystem_type.lower() in BLUE_CARBON_RATES else "mangrove"

        seq_rate = BLUE_CARBON_RATES[eco]
        total_seq = round(area_ha * seq_rate, 2)
        permanence_risk = BLUE_CARBON_PERMANENCE[eco]
        methodology = BLUE_CARBON_METHODOLOGY[eco]

        # Additionality / buffer adjustments (deterministic from permanence risk)
        buffer_pct = 12.0 if permanence_risk == "low" else (18.0 if permanence_risk == "medium" else 25.0)
        net_credits = round(total_seq * (1 - buffer_pct / 100), 2)

        co_benefit_out: Optional[float] = (
            round(float(co_benefit_score), 1) if co_benefit_score is not None else None
        )

        return {
            "entity_id": entity_id,
            "ecosystem_type": eco,
            "area_ha": round(area_ha, 2),
            "seq_rate_tco2_ha_pa": seq_rate,
            "total_seq_tco2_pa": total_seq,
            "permanence_risk": permanence_risk,
            "buffer_pct": buffer_pct,
            "net_credits_tco2_pa": net_credits,
            "methodology": methodology,
            "tidal_hydrology_restored": tidal_hydrology_restored,
            "co_benefit_score": co_benefit_out,
            "co_benefit_note": (
                None if co_benefit_out is not None
                else "insufficient_data: co-benefit score not supplied"
            ),
            "blue_carbon_standard": "Verra VCS",
        }

    # ------------------------------------------------------------------
    # 4. Soil Carbon (IPCC Tier 1-3)
    # ------------------------------------------------------------------

    def assess_soil_carbon(
        self,
        entity_id: str,
        area_ha: float,
        land_use_change: str,
        ipcc_tier: int = 1,
    ) -> dict:
        """
        IPCC Tier 1-3 soil organic carbon methodology.
        Higher tiers = lower uncertainty + higher sequestration rates.
        """
        tier = max(1, min(3, ipcc_tier))
        params = IPCC_TIER_PARAMS[tier]

        delta = params["delta_tco2_ha_pa"]
        uncertainty_pct = params["uncertainty_pct"]
        permanence_risk = params["permanence_risk"]

        total_tco2_pa = round(area_ha * delta, 2)
        reversal_buffer_pct = 15.0

        # Crediting period and uncertainty range
        lower_bound = round(total_tco2_pa * (1 - uncertainty_pct / 100), 2)
        upper_bound = round(total_tco2_pa * (1 + uncertainty_pct / 100), 2)

        return {
            "entity_id": entity_id,
            "ipcc_tier": tier,
            "land_use_change": land_use_change,
            "area_ha": round(area_ha, 2),
            "delta_tco2_ha_pa": delta,
            "total_tco2_pa": total_tco2_pa,
            "permanence_risk": permanence_risk,
            "measurement_uncertainty_pct": uncertainty_pct,
            "reversal_buffer_pct": reversal_buffer_pct,
            "confidence_range": {"lower": lower_bound, "upper": upper_bound},
            "crediting_period_years": 20,
            "monitoring_frequency": "Annual" if tier == 3 else "Biennial",
        }

    # ------------------------------------------------------------------
    # 5. ARR — Afforestation, Reforestation, Revegetation
    # ------------------------------------------------------------------

    def assess_arr(
        self,
        entity_id: str,
        area_ha: float,
        species_type: str = "mixed",
        above_ground_rate_tco2_ha_pa: Optional[float] = None,
        co_benefit_score: Optional[float] = None,
    ) -> dict:
        """
        ARR carbon accounting: above-ground, below-ground, soil.
        Species type (native/mixed/exotic) affects buffer and co-benefit context.

        ``above_ground_rate_tco2_ha_pa`` is the site-specific AGB accumulation
        rate (from a MAI/yield table); when not supplied a documented IPCC 2006
        GL default for the species class is used and flagged via
        ``above_ground_rate_estimated``. ``co_benefit_score`` (0-100) is a
        project-specific input reported as null when not supplied.
        """
        species = species_type.lower()
        native_species = species in ["native", "mixed"]

        rate_supplied = above_ground_rate_tco2_ha_pa is not None
        if rate_supplied:
            above_ground_rate = round(float(above_ground_rate_tco2_ha_pa), 3)
        else:
            above_ground_rate = ARR_DEFAULT_AG_RATE_TCO2_HA_PA.get(species, ARR_DEFAULT_AG_RATE_TCO2_HA_PA["mixed"])

        above_ground = round(area_ha * above_ground_rate, 2)
        below_ground = round(above_ground * 0.26, 2)  # IPCC root-to-shoot ratio
        soil_carbon = round(area_ha * 0.5, 2)
        total = round(above_ground + below_ground + soil_carbon, 2)

        co_benefit_out: Optional[float] = (
            round(float(co_benefit_score), 1) if co_benefit_score is not None else None
        )

        # Buffer and net credits (deterministic from species class)
        buffer_pct = 10.0 if native_species else 15.0
        net_credits = round(total * (1 - buffer_pct / 100), 2)

        return {
            "entity_id": entity_id,
            "area_ha": round(area_ha, 2),
            "species_type": species,
            "above_ground_rate_tco2_ha_pa": above_ground_rate,
            "above_ground_rate_estimated": not rate_supplied,
            "above_ground_rate_source": (
                "caller-supplied site MAI/yield table"
                if rate_supplied
                else "IPCC 2006 GL Vol 4 default AGB accumulation (species class)"
            ),
            "above_ground_tco2_pa": above_ground,
            "below_ground_tco2_pa": below_ground,
            "soil_carbon_tco2_pa": soil_carbon,
            "total_tco2_pa": total,
            "net_credits_tco2_pa": net_credits,
            "buffer_pct": buffer_pct,
            "native_species": native_species,
            "co_benefit_score": co_benefit_out,
            "co_benefit_note": (
                None if co_benefit_out is not None
                else "insufficient_data: co-benefit score not supplied"
            ),
            "methodology": "VCS VM0047 / Gold Standard IFM",
            "permanence_years": 40,
        }

    # ------------------------------------------------------------------
    # 6. AFOLU Net GHG Balance
    # ------------------------------------------------------------------

    def compute_afolu_balance(
        self,
        entity_id: str,
        sequestration_tco2_pa: float,
        land_area_ha: float,
    ) -> dict:
        """
        AFOLU (Agriculture, Forestry & Other Land Use) net GHG accounting.
        Includes N2O and CH4 non-CO2 emissions per IPCC EFs.
        """
        # IPCC Tier 1 default emission factors
        n2o_emissions = round(land_area_ha * 0.018, 4)  # tCO2e/ha (soil N2O)
        ch4_emissions = round(land_area_ha * 0.008, 4)  # tCO2e/ha (wetland CH4)
        total_non_co2 = n2o_emissions + ch4_emissions

        net_balance = round(sequestration_tco2_pa - total_non_co2, 4)
        afolu_ratio = round(sequestration_tco2_pa / total_non_co2, 2) if total_non_co2 > 0 else 999.0

        return {
            "entity_id": entity_id,
            "land_area_ha": round(land_area_ha, 2),
            "sequestration_tco2_pa": round(sequestration_tco2_pa, 4),
            "n2o_emissions_tco2e_pa": n2o_emissions,
            "ch4_emissions_tco2e_pa": ch4_emissions,
            "total_non_co2_tco2e_pa": round(total_non_co2, 4),
            "net_balance_tco2e_pa": net_balance,
            "afolu_ratio": afolu_ratio,
            "net_positive": net_balance > 0,
            "ipcc_ef_source": "IPCC 2006 GLs Vol 4 Chapter 11",
        }

    # ------------------------------------------------------------------
    # 7. Credit Quality Assessment
    # ------------------------------------------------------------------

    def assess_credit_quality(
        self,
        entity_id: str,
        iucn_score: float,
        redd_net_credits: float,
        co_benefits: dict,
    ) -> dict:
        """
        Credit quality rating combining IUCN score, co-benefits, and volume.
        Derives ICVCM CCP-compatible rating and USD price range.

        Co-benefit sub-scores (biodiversity/water/livelihoods, 0-100) are taken
        only from the caller-supplied ``co_benefits`` mapping; dimensions that
        are absent are reported as null and excluded from the average rather
        than fabricated. If no co-benefit dimensions are supplied the quality
        score, ICVCM flag and price are returned as null (insufficient data).
        """
        # Co-benefit scoring — only use dimensions actually supplied.
        def _get(key: str) -> Optional[float]:
            v = co_benefits.get(key)
            return float(v) if v is not None else None

        bio_score = _get("biodiversity")
        water_score = _get("water")
        livelihoods_score = _get("livelihoods")

        supplied_scores = [s for s in (bio_score, water_score, livelihoods_score) if s is not None]

        if supplied_scores:
            cobenefit_avg: Optional[float] = sum(supplied_scores) / len(supplied_scores)
            cobenefit_premium_pct: Optional[float] = round(cobenefit_avg / 10.0, 2)  # 0-10%

            overall_quality: Optional[float] = round((iucn_score * 0.4 + cobenefit_avg * 0.3 + 30.0), 2)
            overall_quality = min(100.0, max(0.0, overall_quality))

            icvcm_compatible: Optional[bool] = overall_quality >= 65.0

            # Pricing model
            base_price = 8.0 + (overall_quality - 40.0) / 60.0 * 27.0 if overall_quality > 40 else 8.0
            price_usd: Optional[float] = round(base_price * (1 + cobenefit_premium_pct / 100.0), 2)
            price_usd = round(max(8.0, min(35.0, price_usd)), 2)
            price_min: Optional[float] = round(price_usd * 0.85, 2)
            price_max: Optional[float] = round(price_usd * 1.20, 2)

            # Eligible certifications
            eligible = list(CERTIFICATION_SCHEMES)
            if icvcm_compatible:
                eligible += ICVCM_CCP_SCHEMES
            if cobenefit_avg >= 70:
                eligible += CO_BENEFIT_CERTIFICATIONS
            eligible = list(dict.fromkeys(eligible))  # deduplicate preserving order
            data_note: Optional[str] = None
        else:
            # No co-benefit data supplied — do not fabricate a quality score.
            cobenefit_avg = None
            cobenefit_premium_pct = None
            overall_quality = None
            icvcm_compatible = None
            price_usd = None
            price_min = None
            price_max = None
            eligible = list(CERTIFICATION_SCHEMES)  # baseline schemes only
            data_note = ("insufficient_data: no co-benefit dimensions supplied; "
                         "quality score, ICVCM compatibility and price withheld.")

        return {
            "entity_id": entity_id,
            "iucn_score": round(iucn_score, 2),
            "co_benefits": {
                "biodiversity": round(bio_score, 1) if bio_score is not None else None,
                "water": round(water_score, 1) if water_score is not None else None,
                "livelihoods": round(livelihoods_score, 1) if livelihoods_score is not None else None,
            },
            "cobenefit_avg": round(cobenefit_avg, 2) if cobenefit_avg is not None else None,
            "cobenefit_premium_pct": cobenefit_premium_pct,
            "overall_quality_score": overall_quality,
            "icvcm_ccp_compatible": icvcm_compatible,
            "redd_net_credits_tco2_pa": round(redd_net_credits, 2),
            "estimated_price_usd": price_usd,
            "price_range": {"min": price_min, "max": price_max},
            "certification_eligible": eligible,
            "data_note": data_note,
        }

    # ------------------------------------------------------------------
    # 8. Sequestration Timeseries
    # ------------------------------------------------------------------

    def project_sequestration_timeseries(
        self,
        entity_id: str,
        annual_seq_tco2: float,
        project_years: int = 30,
        annual_variation_pct: Optional[list[float]] = None,
    ) -> list[dict]:
        """
        Project-level sequestration projection with a deterministic ramp-up
        capacity curve (VCS crediting-period convention: reduced early
        establishment yield, full yield once the stand matures).

        The projection is deterministic: no synthetic noise is injected. An
        optional ``annual_variation_pct`` list (one signed fraction per year,
        e.g. from a monitoring record or a calibrated scenario) can be supplied
        to apply real per-year deviations to the central sequestration path.
        """
        cumulative = 0.0
        timeseries: list[dict] = []
        buffer_pool_total = 0.0

        for year in range(1, project_years + 1):
            # Ramp-up capacity factor (deterministic establishment curve)
            if year <= 5:
                capacity = 0.60
            elif year <= 10:
                capacity = 0.85
            else:
                capacity = 1.00

            # Apply caller-supplied per-year deviation if provided; else central path.
            variation = 0.0
            variation_supplied = False
            if annual_variation_pct is not None and year <= len(annual_variation_pct) and annual_variation_pct[year - 1] is not None:
                variation = float(annual_variation_pct[year - 1])
                variation_supplied = True
            raw_seq = annual_seq_tco2 * capacity * (1 + variation)

            # Non-CO2 emissions (small fraction)
            emissions_tco2e = round(raw_seq * 0.03, 4)
            net_balance = round(raw_seq - emissions_tco2e, 4)

            # Buffer pool contribution (10% of gross)
            buffer_contribution = round(raw_seq * 0.10, 4)
            buffer_pool_total += buffer_contribution

            # Credits issued after buffer
            credits_issued = round(net_balance * 0.90, 4)
            cumulative += credits_issued

            # Reversal risk flag: elevated during early establishment years, or
            # when a supplied deviation indicates a material shortfall in yield.
            reversal_risk_flag = year <= 3 or (variation_supplied and variation < -0.04)

            timeseries.append({
                "year": year,
                "capacity_factor": round(capacity, 2),
                "sequestration_tco2": round(raw_seq, 4),
                "emissions_tco2e": emissions_tco2e,
                "net_balance_tco2e": net_balance,
                "cumulative_tco2e": round(cumulative, 2),
                "buffer_pool_contribution": buffer_contribution,
                "credits_issued_tco2": credits_issued,
                "reversal_risk_flag": reversal_risk_flag,
            })

        return timeseries


# ---------------------------------------------------------------------------
# Module-level instance
# ---------------------------------------------------------------------------

_engine = NatureBasedSolutionsEngine()

assess_iucn_gs = _engine.assess_iucn_gs
assess_redd_plus = _engine.assess_redd_plus
assess_blue_carbon = _engine.assess_blue_carbon
assess_soil_carbon = _engine.assess_soil_carbon
assess_arr = _engine.assess_arr
compute_afolu_balance = _engine.compute_afolu_balance
assess_credit_quality = _engine.assess_credit_quality
project_sequestration_timeseries = _engine.project_sequestration_timeseries
