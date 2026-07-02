"""
Blue Economy & Ocean Finance Engine — E68
Standards: ICMA Blue Bond Principles 2023, Sustainable Ocean Finance (UNEP-FI SOF),
Blue Carbon Initiative (mangroves/seagrass/saltmarsh), High Seas Treaty BBNJ 2023,
OECD Ocean Finance Framework, Ocean Acidification (IPCC AR6 Chapter 3)
"""
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
import math

# ---------------------------------------------------------------------------
# Model calibration constants (deterministic model parameters — NOT
# entity-reported figures). Documented so they are auditable.
# ---------------------------------------------------------------------------

# Adaptation cost as a fraction of ocean-acidification VaR. Central estimate
# used when the caller does not supply a project-specific adaptation ratio.
# Source: OECD Ocean Finance Framework 2022 adaptation-cost guidance (~25% of
# quantified loss). Applied to a computed VaR, so this is a model parameter.
DEFAULT_ADAPTATION_COST_RATIO = 0.25

# ---------------------------------------------------------------------------
# Reference Data
# ---------------------------------------------------------------------------

BLUE_BOND_USE_OF_PROCEEDS: Dict[str, Dict] = {
    "sustainable_fisheries": {
        "description": "MSC-certified and FIP-supported fisheries, IUU elimination",
        "icma_alignment_score": 0.92,
        "sof_pillar": "sustainable_ocean_economy",
        "sdg_targets": ["SDG14.4", "SDG14.6"],
        "typical_allocation_pct": 18,
    },
    "marine_conservation": {
        "description": "MPA establishment and management, coral reef restoration, seagrass beds",
        "icma_alignment_score": 0.95,
        "sof_pillar": "ocean_health",
        "sdg_targets": ["SDG14.2", "SDG14.5"],
        "typical_allocation_pct": 20,
    },
    "ocean_based_renewable_energy": {
        "description": "Offshore wind, wave energy, tidal power, OTEC",
        "icma_alignment_score": 0.88,
        "sof_pillar": "blue_energy",
        "sdg_targets": ["SDG7.2", "SDG13.1"],
        "typical_allocation_pct": 22,
    },
    "coastal_resilience": {
        "description": "Mangrove restoration, coastal wetland protection, sea-wall alternatives",
        "icma_alignment_score": 0.90,
        "sof_pillar": "climate_adaptation",
        "sdg_targets": ["SDG13.1", "SDG14.2"],
        "typical_allocation_pct": 15,
    },
    "marine_pollution_prevention": {
        "description": "Plastics reduction, port waste facilities, wastewater treatment",
        "icma_alignment_score": 0.85,
        "sof_pillar": "ocean_health",
        "sdg_targets": ["SDG14.1", "SDG12.4"],
        "typical_allocation_pct": 10,
    },
    "sustainable_aquaculture": {
        "description": "ASC-certified aquaculture, low-impact integrated multi-trophic systems",
        "icma_alignment_score": 0.80,
        "sof_pillar": "sustainable_ocean_economy",
        "sdg_targets": ["SDG14.2", "SDG2.3"],
        "typical_allocation_pct": 8,
    },
    "marine_protected_areas": {
        "description": "30x30 Kunming-Montreal target MPA financing, OECM designation",
        "icma_alignment_score": 0.93,
        "sof_pillar": "ocean_governance",
        "sdg_targets": ["SDG14.5", "SDG15.1"],
        "typical_allocation_pct": 5,
    },
    "ocean_acidification_mitigation": {
        "description": "Enhanced weathering, alkalinity addition pilots, seagrass buffers",
        "icma_alignment_score": 0.75,
        "sof_pillar": "climate_mitigation",
        "sdg_targets": ["SDG14.3", "SDG13.2"],
        "typical_allocation_pct": 2,
    },
}

BLUE_CARBON_ECOSYSTEMS: Dict[str, Dict] = {
    "mangrove": {
        "sequestration_rate_min_tco2_ha_yr": 6.0,
        "sequestration_rate_max_tco2_ha_yr": 8.0,
        "sequestration_rate_mean_tco2_ha_yr": 7.0,
        "soil_carbon_stock_tco2_ha": 860,
        "above_ground_carbon_tco2_ha": 120,
        "permanence_risk": "medium",  # saltwater intrusion, storm damage
        "additionality_baseline": "Deforestation rate 0.35%/yr (Hamilton & Friess 2018)",
        "verra_methodology": "VM0007",
        "co2_verra_methodology": "VM0033",
        "co_benefits": ["coastal_protection", "fisheries_habitat", "biodiversity", "livelihood"],
        "typical_project_lifetime_years": 30,
        "verification_cycle_years": 5,
        "monitoring_cost_usd_ha_yr": 45,
    },
    "seagrass": {
        "sequestration_rate_min_tco2_ha_yr": 0.4,
        "sequestration_rate_max_tco2_ha_yr": 0.8,
        "sequestration_rate_mean_tco2_ha_yr": 0.6,
        "soil_carbon_stock_tco2_ha": 140,
        "above_ground_carbon_tco2_ha": 2.5,
        "permanence_risk": "high",  # fragile, difficult monitoring
        "additionality_baseline": "Decline 7%/yr (IPCC 2022 AR6)",
        "verra_methodology": "VM0033",
        "co2_verra_methodology": "VM0033",
        "co_benefits": ["water_quality", "fisheries_nursery", "dugong_habitat"],
        "typical_project_lifetime_years": 20,
        "verification_cycle_years": 3,
        "monitoring_cost_usd_ha_yr": 80,
    },
    "saltmarsh": {
        "sequestration_rate_min_tco2_ha_yr": 2.0,
        "sequestration_rate_max_tco2_ha_yr": 4.0,
        "sequestration_rate_mean_tco2_ha_yr": 3.0,
        "soil_carbon_stock_tco2_ha": 430,
        "above_ground_carbon_tco2_ha": 15,
        "permanence_risk": "medium-low",
        "additionality_baseline": "Coastal squeeze losses (IPCC 2019 SROCC)",
        "verra_methodology": "VM0033",
        "co2_verra_methodology": "VM0033",
        "co_benefits": ["storm_surge_reduction", "bird_habitat", "water_filtration"],
        "typical_project_lifetime_years": 25,
        "verification_cycle_years": 5,
        "monitoring_cost_usd_ha_yr": 35,
    },
    "kelp": {
        "sequestration_rate_min_tco2_ha_yr": 0.2,
        "sequestration_rate_max_tco2_ha_yr": 0.4,
        "sequestration_rate_mean_tco2_ha_yr": 0.3,
        "soil_carbon_stock_tco2_ha": 0,  # exported to deep ocean
        "above_ground_carbon_tco2_ha": 5,
        "permanence_risk": "high",  # uncertain permanence pathway
        "additionality_baseline": "OA and warming-driven range contraction",
        "verra_methodology": "Under development",
        "co2_verra_methodology": "Under development",
        "co_benefits": ["fish_habitat", "urchin_grazing_control", "OA_buffer"],
        "typical_project_lifetime_years": 15,
        "verification_cycle_years": 2,
        "monitoring_cost_usd_ha_yr": 120,
    },
}

BBNJ_ARTICLES: Dict[str, Dict] = {
    "article_9_mgbr": {
        "title": "Marine Genetic Resources & Benefit Sharing",
        "description": "Access and benefit sharing for MGRs in ABNJ; multilateral mechanism",
        "compliance_indicators": ["mgr_access_policy", "benefit_sharing_agreement", "clearing_house_registration"],
        "weight": 0.25,
        "entry_into_force_target": "2025",
    },
    "article_17_eias": {
        "title": "Environmental Impact Assessments",
        "description": "EIA obligation for activities likely to have more than minor/transitory effect",
        "compliance_indicators": ["eia_screening_process", "cumulative_impact_assessment", "transboundary_notification"],
        "weight": 0.25,
        "entry_into_force_target": "2025",
    },
    "article_22_abmt": {
        "title": "Area-Based Management Tools including MPAs",
        "description": "Proposals for ABMTs/MPAs in ABNJ; global ocean governance architecture",
        "compliance_indicators": ["abmt_proposal_contributed", "mpa_management_plan", "monitoring_reporting"],
        "weight": 0.20,
        "entry_into_force_target": "2026",
    },
    "article_43_capacity_building": {
        "title": "Capacity Building & Technology Transfer",
        "description": "Obligations on developed parties to support developing states",
        "compliance_indicators": ["cb_program_active", "technology_transfer_mou", "financial_contribution"],
        "weight": 0.15,
        "entry_into_force_target": "2025",
    },
    "article_52_financial_mechanism": {
        "title": "Financial Mechanism & Special Fund",
        "description": "Voluntary fund and assessed contributions for BBNJ implementation",
        "compliance_indicators": ["fund_contribution_made", "access_to_fund_assessed", "reporting_submitted"],
        "weight": 0.15,
        "entry_into_force_target": "2026",
    },
}

SOF_PILLARS: Dict[str, Dict] = {
    "ocean_health": {
        "description": "Reducing pollution, restoring ecosystems, addressing ocean acidification",
        "key_indicators": ["mpa_coverage_pct", "plastic_reduction_targets", "wqi_score"],
        "financing_instruments": ["blue_bonds", "blue_carbon_credits", "impact_loans"],
        "weight": 0.22,
    },
    "sustainable_ocean_economy": {
        "description": "Sustainable fisheries, aquaculture, shipping decarbonisation",
        "key_indicators": ["msc_certified_pct", "poseidon_principles_alignment", "iuu_risk_score"],
        "financing_instruments": ["sustainability_linked_bonds", "green_shipping_finance"],
        "weight": 0.20,
    },
    "climate_adaptation": {
        "description": "Coastal resilience, mangrove/wetland finance, sea-level rise adaptation",
        "key_indicators": ["coastal_protection_coverage", "ecosystem_restoration_ha", "adaptation_finance_usd"],
        "financing_instruments": ["resilience_bonds", "debt_for_nature", "climate_insurance"],
        "weight": 0.20,
    },
    "climate_mitigation": {
        "description": "Ocean-based NbS, blue carbon sequestration, offshore renewables",
        "key_indicators": ["blue_carbon_tco2_yr", "offshore_renewable_gw", "shipping_ghg_reduction"],
        "financing_instruments": ["blue_carbon_credits", "green_bonds", "blended_finance"],
        "weight": 0.18,
    },
    "ocean_governance": {
        "description": "BBNJ Treaty implementation, high seas MPA, SDG14 financing",
        "key_indicators": ["bbnj_ratification", "sdg14_oda_usd", "high_seas_mpa_coverage"],
        "financing_instruments": ["sovereign_blue_bonds", "multilateral_ocean_funds"],
        "weight": 0.12,
    },
    "blue_energy": {
        "description": "Offshore wind, wave, tidal, OTEC, green hydrogen from ocean sources",
        "key_indicators": ["offshore_wind_gw", "wave_tidal_mw", "h2_blue_production_mt"],
        "financing_instruments": ["project_finance", "infrastructure_bonds", "blended_finance"],
        "weight": 0.08,
    },
}

OCEAN_ACIDIFICATION_RISK: Dict[str, Dict] = {
    "RCP2.6": {
        "ph_change_by_2100": -0.06,
        "aragonite_saturation_omega": 2.8,
        "risk_level": "low",
        "coral_bleaching_freq_multiplier": 1.3,
        "fisheries_revenue_impact_pct": -2.5,
    },
    "RCP4.5": {
        "ph_change_by_2100": -0.14,
        "aragonite_saturation_omega": 2.2,
        "risk_level": "moderate",
        "coral_bleaching_freq_multiplier": 2.0,
        "fisheries_revenue_impact_pct": -6.0,
    },
    "RCP6.0": {
        "ph_change_by_2100": -0.22,
        "aragonite_saturation_omega": 1.8,
        "risk_level": "high",
        "coral_bleaching_freq_multiplier": 3.5,
        "fisheries_revenue_impact_pct": -11.0,
    },
    "RCP8.5": {
        "ph_change_by_2100": -0.33,
        "aragonite_saturation_omega": 1.2,
        "risk_level": "very_high",
        "coral_bleaching_freq_multiplier": 6.0,
        "fisheries_revenue_impact_pct": -18.5,
    },
}

# ---------------------------------------------------------------------------
# Dataclasses
# ---------------------------------------------------------------------------

@dataclass
class BlueBondScreeningResult:
    bond_id: str
    issuer: str
    bond_amount_usd: float
    icma_alignment_score: float
    eligible_categories: List[str]
    ineligible_categories: List[str]
    sof_pillar_coverage: Dict[str, float]
    use_of_proceeds_breakdown: Dict[str, float]
    greenium_bps: Optional[float]
    external_review_required: bool
    reporting_frequency: str
    overall_verdict: str  # fully_aligned | partially_aligned | not_aligned
    recommendations: List[str]
    data_flags: List[str] = field(default_factory=list)


@dataclass
class BlueCarbonResult:
    project_id: str
    ecosystem_type: str
    area_hectares: Optional[float]
    sequestration_rate_tco2_ha_yr: float
    total_annual_sequestration_tco2: Optional[float]
    project_lifetime_years: int
    total_lifetime_sequestration_tco2: Optional[float]
    additionality_score: Optional[float]
    permanence_score: Optional[float]
    co_benefits: List[str]
    verra_vcs_eligible: Optional[bool]
    gold_standard_eligible: Optional[bool]
    carbon_credit_value_usd: Optional[float]
    monitoring_cost_usd_yr: Optional[float]
    net_revenue_usd_yr: Optional[float]
    verification_cycle_years: int
    risk_buffer_pct: Optional[float]
    data_flags: List[str] = field(default_factory=list)


@dataclass
class BBNJComplianceResult:
    entity_id: str
    entity_type: str
    article_scores: Dict[str, Optional[float]]
    overall_compliance_score: Optional[float]
    compliance_level: str  # compliant | partial | non_compliant | insufficient_data
    gaps: List[str]
    priority_actions: List[str]
    bbnj_readiness_timeline: str
    data_flags: List[str] = field(default_factory=list)


@dataclass
class OceanAcidificationRisk:
    portfolio_id: str
    rcp_scenario: str
    ph_change_2100: float
    aragonite_saturation: float
    risk_level: str
    ocean_economy_exposure_usd: Optional[float]
    fisheries_revenue_at_risk_usd: Optional[float]
    coral_reef_asset_at_risk_usd: Optional[float]
    aquaculture_at_risk_usd: Optional[float]
    total_oa_var_usd: Optional[float]
    adaptation_cost_estimate_usd: Optional[float]
    data_flags: List[str] = field(default_factory=list)


@dataclass
class OceanPortfolioResult:
    portfolio_id: str
    total_blue_assets_usd: Optional[float]
    sof_score: Optional[float]
    sof_pillar_scores: Dict[str, Optional[float]]
    blue_bond_allocation_pct: Optional[float]
    blue_carbon_credits_tco2: Optional[float]
    mpa_financing_usd: Optional[float]
    ocean_risk_score: Optional[float]
    oa_risk_var_usd: Optional[float]
    top_blue_economy_sectors: List[Dict]
    sdg14_alignment_score: Optional[float]
    recommendations: List[str]
    data_flags: List[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Engine Functions
# ---------------------------------------------------------------------------

def screen_blue_bond(bond_data: Dict[str, Any]) -> BlueBondScreeningResult:
    """Screen a bond against ICMA Blue Bond Principles 2023 and SOF framework.

    ICMA alignment is computed deterministically from the reference alignment
    scores of the declared eligible categories (BLUE_BOND_USE_OF_PROCEEDS).
    ``greenium_bps`` is a market-observed figure: it is returned only when the
    caller supplies ``observed_greenium_bps`` (or a target), otherwise None.
    """
    entity_id = bond_data.get("entity_id", "default")
    data_flags: List[str] = []

    raw_bond_id = bond_data.get("bond_id")
    # Deterministic, stable synthetic label when no bond_id is provided.
    bond_id = raw_bond_id if raw_bond_id else f"BB-{(hash(str(entity_id)) & 0xFFFF):04d}"
    issuer = bond_data.get("issuer") or "Unknown Issuer"
    bond_amount_usd = float(bond_data.get("bond_amount_usd") or 500_000_000)
    declared_categories = bond_data.get("use_of_proceeds_categories") or list(BLUE_BOND_USE_OF_PROCEEDS.keys())[:4]

    # Optional caller-supplied per-category allocation percentages (real data).
    supplied_alloc = bond_data.get("use_of_proceeds_allocation_pct") or {}

    eligible_categories = []
    ineligible_categories = []
    weighted_alignment = 0.0
    sof_pillar_coverage: Dict[str, float] = {p: 0.0 for p in SOF_PILLARS}
    use_of_proceeds_breakdown: Dict[str, float] = {}
    used_reference_allocation = False

    n = len(declared_categories) if declared_categories else 0
    for cat in declared_categories:
        if cat in BLUE_BOND_USE_OF_PROCEEDS:
            cat_data = BLUE_BOND_USE_OF_PROCEEDS[cat]
            # Reference ICMA alignment score for the category (real reference data).
            final_score = max(0.0, min(1.0, cat_data["icma_alignment_score"]))
            eligible_categories.append(cat)
            weighted_alignment += final_score / n
            pillar = cat_data["sof_pillar"]
            if pillar in sof_pillar_coverage:
                sof_pillar_coverage[pillar] += 1.0 / n
            # Use caller-supplied allocation when present, else the ICMA
            # reference typical allocation. No random perturbation.
            if cat in supplied_alloc and supplied_alloc[cat] is not None:
                use_of_proceeds_breakdown[cat] = round(float(supplied_alloc[cat]), 1)
            else:
                use_of_proceeds_breakdown[cat] = round(float(cat_data["typical_allocation_pct"]), 1)
                used_reference_allocation = True
        else:
            ineligible_categories.append(cat)

    if used_reference_allocation:
        data_flags.append("use_of_proceeds_breakdown uses ICMA reference typical allocations (no issuer-declared split supplied)")

    # Normalise sof pillar coverage
    total_pillar = sum(sof_pillar_coverage.values())
    if total_pillar > 0:
        sof_pillar_coverage = {k: round(v / total_pillar, 3) for k, v in sof_pillar_coverage.items()}

    # Normalise use of proceeds to 100%
    total_alloc = sum(use_of_proceeds_breakdown.values())
    if total_alloc > 0:
        use_of_proceeds_breakdown = {k: round(v / total_alloc * 100, 1) for k, v in use_of_proceeds_breakdown.items()}

    # Greenium is a market/pricing observation, not derivable from alignment.
    # Return the caller-supplied value if present, otherwise an honest null.
    observed_greenium = bond_data.get("observed_greenium_bps")
    if observed_greenium is None:
        observed_greenium = bond_data.get("greenium_bps")
    if observed_greenium is not None:
        greenium_bps = round(float(observed_greenium), 2)
    else:
        greenium_bps = None
        data_flags.append("greenium_bps unavailable: no observed/target greenium supplied (market-priced input)")

    external_review_required = bond_amount_usd >= 100_000_000 or weighted_alignment < 0.75

    if weighted_alignment >= 0.85:
        verdict = "fully_aligned"
        reporting_freq = "annual"
    elif weighted_alignment >= 0.65:
        verdict = "partially_aligned"
        reporting_freq = "semi-annual"
    else:
        verdict = "not_aligned"
        reporting_freq = "quarterly"

    recommendations = []
    if len(eligible_categories) < 3:
        recommendations.append("Diversify use-of-proceeds across at least 3 ICMA-eligible blue categories")
    if weighted_alignment < 0.85:
        recommendations.append("Engage second-party opinion provider (Sustainalytics/DNV/Vigeo)")
    if "marine_conservation" not in eligible_categories:
        recommendations.append("Include marine conservation category to strengthen SDG14 alignment")
    if external_review_required:
        recommendations.append("Obtain external review per ICMA Blue Bond Principles Section 3")
    if greenium_bps is not None and greenium_bps < 3.0:
        recommendations.append("Improve use-of-proceeds specificity to capture higher greenium")

    return BlueBondScreeningResult(
        bond_id=bond_id,
        issuer=issuer,
        bond_amount_usd=bond_amount_usd,
        icma_alignment_score=round(weighted_alignment, 4),
        eligible_categories=eligible_categories,
        ineligible_categories=ineligible_categories,
        sof_pillar_coverage=sof_pillar_coverage,
        use_of_proceeds_breakdown=use_of_proceeds_breakdown,
        greenium_bps=greenium_bps,
        external_review_required=external_review_required,
        reporting_frequency=reporting_freq,
        overall_verdict=verdict,
        recommendations=recommendations,
        data_flags=data_flags,
    )


def assess_blue_carbon(project_data: Dict[str, Any]) -> BlueCarbonResult:
    """Calculate blue carbon sequestration, additionality, permanence, and credit economics.

    Sequestration uses the ecosystem reference mean rate (IPCC/Blue Carbon
    Initiative — a deterministic model parameter). Area, project quality
    scores (threat/tenure/baseline/governance) and carbon price are
    caller-supplied inputs; when absent the dependent metrics are returned as
    honest nulls with a data flag rather than fabricated.
    """
    project_id = project_data.get("project_id", "default")
    data_flags: List[str] = []

    ecosystem_type = project_data.get("ecosystem_type") or "mangrove"
    if ecosystem_type not in BLUE_CARBON_ECOSYSTEMS:
        ecosystem_type = "mangrove"
    eco = BLUE_CARBON_ECOSYSTEMS[ecosystem_type]

    # Sequestration rate: reference mean for the ecosystem (real reference data,
    # deterministic model parameter).
    seq_rate = eco["sequestration_rate_mean_tco2_ha_yr"]
    lifetime_years = eco["typical_project_lifetime_years"]

    # Area is a caller-supplied input; without it, sequestration volume and all
    # downstream economics are indeterminate.
    area_raw = project_data.get("area_hectares")
    area_ha = float(area_raw) if area_raw is not None else None
    if area_ha is not None:
        total_annual = area_ha * seq_rate
        total_lifetime = total_annual * lifetime_years
    else:
        total_annual = None
        total_lifetime = None
        data_flags.append("area_hectares not supplied: sequestration volumes and credit economics unavailable")

    # Additionality score: only computed when all component inputs are supplied.
    threat_level = project_data.get("threat_level")
    tenure_clarity = project_data.get("tenure_clarity")
    baseline_quality = project_data.get("baseline_quality")
    if None not in (threat_level, tenure_clarity, baseline_quality):
        additionality_score = round(
            (float(threat_level) * 0.4 + float(tenure_clarity) * 0.3 + float(baseline_quality) * 0.3), 4
        )
    else:
        additionality_score = None
        data_flags.append("additionality_score unavailable: requires threat_level, tenure_clarity, baseline_quality")

    # Permanence score: ecosystem fragility (reference) + governance (input).
    eco_stability = 1.0 - (0.3 if eco["permanence_risk"] == "high" else 0.15 if eco["permanence_risk"] == "medium" else 0.05)
    governance_score = project_data.get("governance_score")
    if governance_score is not None:
        permanence_score = round((eco_stability * 0.5 + float(governance_score) * 0.5), 4)
        # Risk buffer per Verra (typically 10-30% depending on permanence).
        risk_buffer_pct = round(max(10.0, min(30.0, (1 - permanence_score) * 60)), 1)
    else:
        permanence_score = None
        risk_buffer_pct = None
        data_flags.append("permanence_score / risk_buffer_pct unavailable: requires governance_score")

    # Credit economics — require area, risk buffer and a carbon price.
    carbon_price_usd_tco2 = project_data.get("carbon_price_usd_tco2")
    monitoring_cost = round(area_ha * eco["monitoring_cost_usd_ha_yr"], 2) if area_ha is not None else None

    if area_ha is not None and risk_buffer_pct is not None and carbon_price_usd_tco2 is not None:
        net_sequestration = total_annual * (1 - risk_buffer_pct / 100)
        carbon_credit_value_usd = round(net_sequestration * float(carbon_price_usd_tco2), 2)
        net_revenue = round(carbon_credit_value_usd - (monitoring_cost or 0.0), 2)
    else:
        carbon_credit_value_usd = None
        net_revenue = None
        if carbon_price_usd_tco2 is None:
            data_flags.append("carbon_credit_value / net_revenue unavailable: no carbon_price_usd_tco2 supplied")

    # Eligibility — determinable only when the driving scores exist.
    methodology_available = eco["verra_methodology"] not in ["Under development"]
    if additionality_score is not None and permanence_score is not None:
        verra_eligible = (additionality_score >= 0.6 and permanence_score >= 0.5 and methodology_available)
        gs_eligible = bool(verra_eligible and additionality_score >= 0.70 and eco_stability >= 0.75)
    else:
        verra_eligible = None
        gs_eligible = None
        data_flags.append("verra_vcs_eligible / gold_standard_eligible unavailable: additionality and permanence scores required")

    return BlueCarbonResult(
        project_id=str(project_id),
        ecosystem_type=ecosystem_type,
        area_hectares=round(area_ha, 2) if area_ha is not None else None,
        sequestration_rate_tco2_ha_yr=round(seq_rate, 3),
        total_annual_sequestration_tco2=round(total_annual, 2) if total_annual is not None else None,
        project_lifetime_years=lifetime_years,
        total_lifetime_sequestration_tco2=round(total_lifetime, 2) if total_lifetime is not None else None,
        additionality_score=additionality_score,
        permanence_score=permanence_score,
        co_benefits=eco["co_benefits"],
        verra_vcs_eligible=verra_eligible,
        gold_standard_eligible=gs_eligible,
        carbon_credit_value_usd=carbon_credit_value_usd,
        monitoring_cost_usd_yr=monitoring_cost,
        net_revenue_usd_yr=net_revenue,
        verification_cycle_years=eco["verification_cycle_years"],
        risk_buffer_pct=risk_buffer_pct,
        data_flags=data_flags,
    )


def assess_bbnj_compliance(entity_data: Dict[str, Any]) -> BBNJComplianceResult:
    """Assess compliance with the High Seas Treaty BBNJ 2023 across 5 key article areas.

    Article scores are entity-disclosed data. Only articles for which the
    caller supplies a score are scored; undisclosed articles are returned as
    None (honest null) and the overall score is the weight-renormalised
    aggregate over disclosed articles. If nothing is disclosed the overall
    score is None and the level is ``insufficient_data``.
    """
    entity_id = entity_data.get("entity_id", "default")
    entity_type = entity_data.get("entity_type") or "flag_state"  # flag_state | coastal_state | financial_institution
    disclosed_scores = entity_data.get("article_scores") or {}

    article_scores: Dict[str, Optional[float]] = {}
    gaps: List[str] = []
    data_flags: List[str] = []
    scored_keys: List[str] = []

    for art_key, art_data in BBNJ_ARTICLES.items():
        indicators = art_data["compliance_indicators"]
        if art_key in disclosed_scores and disclosed_scores[art_key] is not None:
            score = round(min(1.0, max(0.0, float(disclosed_scores[art_key]))), 4)
            article_scores[art_key] = score
            scored_keys.append(art_key)
            if score < 0.6:
                gaps.append(f"{art_data['title']}: score {score:.2f} — review indicators: {', '.join(indicators[:2])}")
        else:
            article_scores[art_key] = None
            gaps.append(f"{art_data['title']}: not disclosed — provide article_scores['{art_key}'] to assess")

    undisclosed = [k for k in BBNJ_ARTICLES if k not in scored_keys]
    if undisclosed:
        data_flags.append(f"{len(undisclosed)} of {len(BBNJ_ARTICLES)} BBNJ articles not disclosed; overall score covers disclosed articles only")

    if scored_keys:
        weight_sum = sum(BBNJ_ARTICLES[k]["weight"] for k in scored_keys)
        # Renormalise weights across disclosed articles so the aggregate stays on [0,1].
        overall = round(
            sum(article_scores[k] * BBNJ_ARTICLES[k]["weight"] for k in scored_keys) / weight_sum, 4
        ) if weight_sum > 0 else None
    else:
        overall = None

    if overall is None:
        level = "insufficient_data"
        timeline = "Disclose BBNJ article compliance scores to enable assessment"
    elif overall >= 0.75:
        level = "compliant"
        timeline = "Maintain current practices; update on treaty entry into force"
    elif overall >= 0.50:
        level = "partial"
        timeline = "12-18 months to full compliance post treaty ratification"
    else:
        level = "non_compliant"
        timeline = "24-36 months; requires structural governance changes"

    priority_actions = []
    sorted_gaps = sorted(
        [(k, article_scores[k], BBNJ_ARTICLES[k]["weight"]) for k in scored_keys],
        key=lambda x: x[1] * x[2]
    )
    for art_key, score, weight in sorted_gaps[:3]:
        priority_actions.append(
            f"Prioritise {BBNJ_ARTICLES[art_key]['title']} (score {score:.2f}, weight {weight})"
        )

    return BBNJComplianceResult(
        entity_id=str(entity_id),
        entity_type=entity_type,
        article_scores=article_scores,
        overall_compliance_score=overall,
        compliance_level=level,
        gaps=gaps,
        priority_actions=priority_actions,
        bbnj_readiness_timeline=timeline,
        data_flags=data_flags,
    )


def assess_ocean_acidification_risk(portfolio_data: Dict[str, Any]) -> OceanAcidificationRisk:
    """Assess portfolio exposure to ocean acidification under IPCC AR6 RCP scenarios.

    The physical impact factors (pH change, aragonite saturation, fisheries
    revenue impact, coral mortality) are drawn from the IPCC AR6 RCP reference
    table — the genuine core. Portfolio exposure and its sector split are
    caller inputs; when exposure is absent all VaR figures are honest nulls.
    ``adaptation_cost_ratio`` defaults to a documented OECD central estimate.
    """
    portfolio_id = portfolio_data.get("portfolio_id", "default")
    data_flags: List[str] = []

    rcp_scenario = portfolio_data.get("rcp_scenario") or "RCP4.5"
    if rcp_scenario not in OCEAN_ACIDIFICATION_RISK:
        rcp_scenario = "RCP4.5"
    oa = OCEAN_ACIDIFICATION_RISK[rcp_scenario]

    exposure_raw = portfolio_data.get("ocean_economy_exposure_usd")

    if exposure_raw is None:
        # No exposure supplied: physical scenario factors are still reported,
        # but monetary VaR cannot be computed without an exposure base.
        data_flags.append("ocean_economy_exposure_usd not supplied: VaR and adaptation cost unavailable")
        return OceanAcidificationRisk(
            portfolio_id=str(portfolio_id),
            rcp_scenario=rcp_scenario,
            ph_change_2100=oa["ph_change_by_2100"],
            aragonite_saturation=oa["aragonite_saturation_omega"],
            risk_level=oa["risk_level"],
            ocean_economy_exposure_usd=None,
            fisheries_revenue_at_risk_usd=None,
            coral_reef_asset_at_risk_usd=None,
            aquaculture_at_risk_usd=None,
            total_oa_var_usd=None,
            adaptation_cost_estimate_usd=None,
            data_flags=data_flags,
        )

    total_ocean_economy_exposure = float(exposure_raw)

    # Sector breakdown of ocean economy — caller-supplied shares. When a share
    # is not provided its exposure is treated as 0 (not fabricated) and flagged.
    def _share(key: str) -> float:
        v = portfolio_data.get(key)
        if v is None:
            data_flags.append(f"{key} not supplied; treated as 0 exposure share")
            return 0.0
        return float(v)

    fisheries_pct = _share("fisheries_pct")
    coral_reef_pct = _share("coral_reef_pct")
    aquaculture_pct = _share("aquaculture_pct")

    fisheries_exposure = total_ocean_economy_exposure * fisheries_pct
    coral_reef_exposure = total_ocean_economy_exposure * coral_reef_pct
    aquaculture_exposure = total_ocean_economy_exposure * aquaculture_pct

    fisheries_at_risk = fisheries_exposure * abs(oa["fisheries_revenue_impact_pct"]) / 100
    # Coral reef: severe bleaching → asset value decline; aragonite saturation drives mortality
    coral_mortality_factor = max(0, (2.5 - oa["aragonite_saturation_omega"]) / 2.5) * 0.8
    coral_at_risk = coral_reef_exposure * coral_mortality_factor
    # Aquaculture: shellfish particularly vulnerable
    aquaculture_at_risk = aquaculture_exposure * max(0, (2.5 - oa["aragonite_saturation_omega"]) / 2.0) * 0.5

    total_oa_var = fisheries_at_risk + coral_at_risk + aquaculture_at_risk

    # Adaptation cost as a fraction of VaR — model parameter (documented),
    # overridable by the caller.
    adaptation_ratio = portfolio_data.get("adaptation_cost_ratio")
    adaptation_ratio = float(adaptation_ratio) if adaptation_ratio is not None else DEFAULT_ADAPTATION_COST_RATIO
    adaptation_cost = total_oa_var * adaptation_ratio

    return OceanAcidificationRisk(
        portfolio_id=str(portfolio_id),
        rcp_scenario=rcp_scenario,
        ph_change_2100=oa["ph_change_by_2100"],
        aragonite_saturation=oa["aragonite_saturation_omega"],
        risk_level=oa["risk_level"],
        ocean_economy_exposure_usd=round(total_ocean_economy_exposure, 2),
        fisheries_revenue_at_risk_usd=round(fisheries_at_risk, 2),
        coral_reef_asset_at_risk_usd=round(coral_at_risk, 2),
        aquaculture_at_risk_usd=round(aquaculture_at_risk, 2),
        total_oa_var_usd=round(total_oa_var, 2),
        adaptation_cost_estimate_usd=round(adaptation_cost, 2),
        data_flags=data_flags,
    )


def aggregate_ocean_portfolio(portfolio_data: Dict[str, Any]) -> OceanPortfolioResult:
    """Aggregate portfolio-level SOF score, blue bond allocation, and ocean risk metrics.

    Every returned figure is derived from caller-supplied holdings and
    disclosed data, or returned as an honest null. Holdings drive
    total_blue_assets and the top-sector table; SOF pillar scores come from
    caller-disclosed ``sof_pillar_scores``; blue-bond allocation, blue-carbon
    credits and MPA financing are entity-reported inputs. Nothing is
    fabricated with random draws.
    """
    portfolio_id = portfolio_data.get("portfolio_id", "default")
    data_flags: List[str] = []

    holdings = portfolio_data.get("holdings") or []
    if not holdings:
        data_flags.append("no holdings supplied: total_blue_assets, MPA financing and top sectors unavailable")

    total_blue: Optional[float] = sum(h.get("exposure_usd", 0) or 0 for h in holdings) if holdings else None

    # Blue-bond allocation — entity-reported.
    blue_bond_alloc_pct = portfolio_data.get("blue_bond_allocation_pct")
    if blue_bond_alloc_pct is None:
        data_flags.append("blue_bond_allocation_pct not disclosed")

    # SOF pillar scores — disclosed by the entity; not fabricated.
    disclosed_pillars = portfolio_data.get("sof_pillar_scores") or portfolio_data.get("declared_sof_scores") or {}
    pillar_scores: Dict[str, Optional[float]] = {}
    scored_pillars: List[str] = []
    for pillar in SOF_PILLARS:
        v = disclosed_pillars.get(pillar) if isinstance(disclosed_pillars, dict) else None
        if v is not None:
            pillar_scores[pillar] = round(float(v), 4)
            scored_pillars.append(pillar)
        else:
            pillar_scores[pillar] = None

    if scored_pillars:
        weight_sum = sum(SOF_PILLARS[p]["weight"] for p in scored_pillars)
        sof_score = round(
            sum(pillar_scores[p] * SOF_PILLARS[p]["weight"] for p in scored_pillars) / weight_sum, 4
        ) if weight_sum > 0 else None
        if len(scored_pillars) < len(SOF_PILLARS):
            data_flags.append(f"{len(SOF_PILLARS) - len(scored_pillars)} SOF pillar scores not disclosed; sof_score covers disclosed pillars only")
    else:
        sof_score = None
        data_flags.append("no SOF pillar scores disclosed: sof_score, ocean_risk_score and sdg14 alignment unavailable")

    # Blue carbon credits — entity-reported quantity.
    blue_carbon_credits = portfolio_data.get("blue_carbon_credits_tco2")
    if blue_carbon_credits is not None:
        blue_carbon_credits = round(float(blue_carbon_credits), 2)
    else:
        data_flags.append("blue_carbon_credits_tco2 not disclosed")

    # MPA financing — use disclosed value, or derive from disclosed MPA share
    # of blue assets; otherwise null (no random fraction).
    mpa_financing = portfolio_data.get("mpa_financing_usd")
    if mpa_financing is not None:
        mpa_financing = round(float(mpa_financing), 2)
    else:
        mpa_share = portfolio_data.get("mpa_financing_share")
        if mpa_share is not None and total_blue is not None:
            mpa_financing = round(total_blue * float(mpa_share), 2)
        else:
            mpa_financing = None
            data_flags.append("mpa_financing_usd not disclosed and no mpa_financing_share to derive it")

    ocean_risk_score = round(1 - sof_score * 0.7, 4) if sof_score is not None else None

    oa_risk = assess_ocean_acidification_risk({
        "portfolio_id": portfolio_id,
        "rcp_scenario": portfolio_data.get("rcp_scenario", "RCP4.5"),
        "ocean_economy_exposure_usd": total_blue,
        "fisheries_pct": portfolio_data.get("fisheries_pct"),
        "coral_reef_pct": portfolio_data.get("coral_reef_pct"),
        "aquaculture_pct": portfolio_data.get("aquaculture_pct"),
    })
    oa_var = round(oa_risk.total_oa_var_usd, 2) if oa_risk.total_oa_var_usd is not None else None

    top_sectors = sorted(holdings, key=lambda h: h.get("exposure_usd", 0) or 0, reverse=True)[:5]
    top_sectors_out = [
        {"sector": h.get("sector", "unknown"), "exposure_usd": round(h.get("exposure_usd", 0) or 0, 2)}
        for h in top_sectors
    ]

    # SDG14 alignment derived deterministically from the (disclosed) SOF score.
    sdg14_score = round(sof_score * 0.85, 4) if sof_score is not None else None

    recommendations = []
    if blue_bond_alloc_pct is not None and blue_bond_alloc_pct < 15:
        recommendations.append("Increase blue bond allocation to >=15% for SDG14 alignment")
    if pillar_scores.get("ocean_health") is not None and pillar_scores["ocean_health"] < 0.6:
        recommendations.append("Strengthen ocean health pillar through MPA and pollution finance")
    if blue_carbon_credits is not None and blue_carbon_credits < 50000:
        recommendations.append("Scale blue carbon credit procurement to offset portfolio OA risk")
    if ocean_risk_score is not None and ocean_risk_score > 0.4:
        recommendations.append("Apply UNEP-FI SOF framework to reduce portfolio ocean risk score")

    return OceanPortfolioResult(
        portfolio_id=str(portfolio_id),
        total_blue_assets_usd=round(total_blue, 2) if total_blue is not None else None,
        sof_score=sof_score,
        sof_pillar_scores=pillar_scores,
        blue_bond_allocation_pct=round(float(blue_bond_alloc_pct), 2) if blue_bond_alloc_pct is not None else None,
        blue_carbon_credits_tco2=blue_carbon_credits,
        mpa_financing_usd=mpa_financing,
        ocean_risk_score=ocean_risk_score,
        oa_risk_var_usd=oa_var,
        top_blue_economy_sectors=top_sectors_out,
        sdg14_alignment_score=sdg14_score,
        recommendations=recommendations,
        data_flags=data_flags,
    )


def assess_sof_alignment(entity_data: Dict[str, Any]) -> Dict[str, Any]:
    """Comprehensive UNEP-FI Sustainable Ocean Finance alignment assessment.

    Pillar scores are entity-disclosed (``declared_sof_scores``). Undisclosed
    pillars carry a null score; the overall SOF score is the weight-
    renormalised aggregate over disclosed pillars, or None if nothing is
    disclosed. ``entity_contribution_pct`` is returned only when supplied.
    """
    entity_id = entity_data.get("entity_id", "default")
    declared = entity_data.get("declared_sof_scores") or entity_data.get("sof_pillar_scores") or {}
    if not isinstance(declared, dict):
        declared = {}
    data_flags: List[str] = []

    pillar_assessments = {}
    scored_pillars: List[str] = []
    for pillar, pdata in SOF_PILLARS.items():
        v = declared.get(pillar)
        score = round(float(v), 4) if v is not None else None
        if score is not None:
            scored_pillars.append(pillar)
        pillar_assessments[pillar] = {
            "score": score,
            "description": pdata["description"],
            "key_indicators": pdata["key_indicators"],
            "financing_instruments": pdata["financing_instruments"],
            "contribution_weight": pdata["weight"],
        }

    if scored_pillars:
        weight_sum = sum(SOF_PILLARS[p]["weight"] for p in scored_pillars)
        overall_sof = round(
            sum(pillar_assessments[p]["score"] * SOF_PILLARS[p]["weight"] for p in scored_pillars) / weight_sum, 4
        ) if weight_sum > 0 else None
        if len(scored_pillars) < len(SOF_PILLARS):
            data_flags.append(f"{len(SOF_PILLARS) - len(scored_pillars)} SOF pillars not disclosed; overall_sof_score covers disclosed pillars only")
    else:
        overall_sof = None
        data_flags.append("no SOF pillar scores disclosed: overall_sof_score and derived flags unavailable")

    if overall_sof is None:
        sof_tier = "insufficient_data"
    elif overall_sof >= 0.75:
        sof_tier = "leader"
    elif overall_sof >= 0.50:
        sof_tier = "progressing"
    else:
        sof_tier = "emerging"

    sdg14_financing_gap_bn = 175  # OECD estimated annual SDG14 gap (reference figure)

    contribution_raw = entity_data.get("entity_contribution_pct")
    if contribution_raw is not None:
        entity_contribution_pct = round(float(contribution_raw), 4)
    else:
        entity_contribution_pct = None
        data_flags.append("entity_contribution_pct not supplied")

    return {
        "entity_id": entity_id,
        "overall_sof_score": overall_sof,
        "sof_tier": sof_tier,
        "pillar_assessments": pillar_assessments,
        "sdg14_financing_gap_bn_usd": sdg14_financing_gap_bn,
        "entity_contribution_pct": entity_contribution_pct,
        "poseidon_principles_aligned": (overall_sof >= 0.65) if overall_sof is not None else None,
        "sea_pledge_eligible": (overall_sof >= 0.70) if overall_sof is not None else None,
        "priority_pillars": [
            p for p, d in pillar_assessments.items() if d["score"] is not None and d["score"] < 0.55
        ],
        "reference_frameworks": [
            "UNEP-FI Sustainable Ocean Finance 2021",
            "ICMA Blue Bond Principles 2023",
            "OECD Ocean Finance Framework 2022",
            "Poseidon Principles 2019",
        ],
        "data_flags": data_flags,
    }
