"""
Infrastructure Finance Engine
================================
Equator Principles IV (2020) · IFC Performance Standards 1-8 ·
OECD Common Approaches 2022 · Paris Alignment for DFIs (IDFC framework) ·
Blended Finance structures · DSCR climate stress

Sub-modules:
  1. Equator Principles IV   — Category A/B/C + 10 principles scoring
  2. IFC Performance Standards — PS 1-8 compliance assessment
  3. OECD Common Approaches 2022 — Tier-based screening
  4. Paris Alignment (DFI)   — Mitigation, adaptation, governance
  5. DSCR Climate Stress     — Physical + transition haircut modelling
  6. Blended Finance         — Structure selection and crowding-in ratio
  7. Climate Label           — CBI Standard v4 / ICMA GBF eligibility
  8. Full Assessment         — Consolidated infrastructure project report

References:
  - Equator Principles IV (2020 EP4)
  - IFC Performance Standards (2012)
  - OECD Common Approaches on Environment and Officially Supported Export Credits (2022)
  - IDFC Paris Alignment Framework (2021)
  - Climate Bonds Standard v4.0 (2022)
  - ICMA Green Bond Principles (2021)
  - OECD Blended Finance Toolkit (2018)
"""
from __future__ import annotations

import math
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

# ---------------------------------------------------------------------------
# Reference Data
# ---------------------------------------------------------------------------

EP_CATEGORIES: dict[str, dict] = {
    "A": {
        "label": "Significant adverse social or environmental impacts",
        "description": "Projects with potential significant adverse impacts that are diverse, irreversible, or unprecedented",
        "esia_required": True,
        "review_level": "full",
    },
    "B": {
        "label": "Limited adverse social or environmental impacts",
        "description": "Projects with limited adverse social or environmental impacts that are few, generally site-specific, largely reversible",
        "esia_required": True,
        "review_level": "limited",
    },
    "C": {
        "label": "Minimal or no social or environmental impacts",
        "description": "Projects with minimal or no adverse social or environmental impacts",
        "esia_required": False,
        "review_level": "none",
    },
}

EP_10_PRINCIPLES: list[dict] = [
    {"id": 1,  "name": "Review and Categorisation",             "weight": 0.1, "description": "Categorise project as A, B or C based on potential E&S impacts"},
    {"id": 2,  "name": "Environmental and Social Assessment",   "weight": 0.1, "description": "Conduct ESIA or equivalent assessment proportionate to category"},
    {"id": 3,  "name": "Applicable E&S Standards",             "weight": 0.1, "description": "Apply host country laws and IFC PS as applicable"},
    {"id": 4,  "name": "Environmental and Social Management System and EP Action Plan", "weight": 0.1, "description": "Develop ESMS and ESAP for Cat A and B projects"},
    {"id": 5,  "name": "Stakeholder Engagement",               "weight": 0.1, "description": "Meaningful consultation with affected communities"},
    {"id": 6,  "name": "Grievance Mechanism",                  "weight": 0.1, "description": "Establish project-level grievance mechanism"},
    {"id": 7,  "name": "Independent Review",                   "weight": 0.1, "description": "Independent E&S consultant for Cat A and high-risk B"},
    {"id": 8,  "name": "Covenants",                            "weight": 0.1, "description": "EP compliance covenants in loan documentation"},
    {"id": 9,  "name": "Independent Monitoring and Reporting", "weight": 0.1, "description": "Annual monitoring and public reporting"},
    {"id": 10, "name": "Reporting and Transparency",           "weight": 0.1, "description": "Public reporting of EP implementation"},
]

EP_SECTOR_RISKS: dict[str, str] = {
    "extractives":        "A",
    "oil_gas":            "A",
    "mining":             "A",
    "large_hydro":        "A",
    "coal_power":         "A",
    "nuclear":            "A",
    "chemical":           "A",
    "infrastructure":     "B",
    "transport":          "B",
    "manufacturing":      "B",
    "agriculture":        "B",
    "water":              "B",
    "waste":              "B",
    "real_estate":        "B",
    "renewables":         "B",
    "telecom":            "B",
    "education":          "C",
    "healthcare":         "C",
    "finance":            "C",
    "software":           "C",
}

IFC_PS_DESCRIPTIONS: dict[str, dict] = {
    "PS1": {
        "name": "Assessment and Management of E&S Risks and Impacts",
        "description": "Establish, maintain and improve ESMS; assess and manage E&S risks",
        "key_requirements": ["ESIA", "ESMS", "stakeholder engagement", "monitoring"],
        "weight": 0.20,
    },
    "PS2": {
        "name": "Labour and Working Conditions",
        "description": "Fair treatment, non-discrimination, equal opportunity for workers",
        "key_requirements": ["working conditions", "supply chain labour", "grievance mechanism", "no forced labour"],
        "weight": 0.15,
    },
    "PS3": {
        "name": "Resource Efficiency and Pollution Prevention",
        "description": "Promote efficient use of resources and pollution prevention",
        "key_requirements": ["GHG accounting", "pollution prevention", "hazardous waste management", "energy efficiency"],
        "weight": 0.12,
    },
    "PS4": {
        "name": "Community Health, Safety, and Security",
        "description": "Avoid or minimise impacts on health and safety of affected communities",
        "key_requirements": ["infrastructure safety", "emergency preparedness", "security forces management"],
        "weight": 0.12,
    },
    "PS5": {
        "name": "Land Acquisition and Involuntary Resettlement",
        "description": "Avoid or minimise displacement; restore livelihoods of displaced persons",
        "key_requirements": ["resettlement plan", "livelihood restoration", "compensation at replacement cost"],
        "weight": 0.10,
    },
    "PS6": {
        "name": "Biodiversity Conservation and Sustainable Management of Living Natural Resources",
        "description": "Protect and conserve biodiversity and natural habitats",
        "key_requirements": ["habitat assessment", "no net loss", "critical habitat protection", "biodiversity management plan"],
        "weight": 0.12,
    },
    "PS7": {
        "name": "Indigenous Peoples",
        "description": "Respect and preserve indigenous peoples' culture, rights, and livelihoods",
        "key_requirements": ["FPIC", "indigenous peoples plan", "grievance mechanism", "benefit sharing"],
        "weight": 0.10,
    },
    "PS8": {
        "name": "Cultural Heritage",
        "description": "Protect cultural heritage from adverse impacts",
        "key_requirements": ["chance find procedure", "cultural heritage assessment", "community consultation"],
        "weight": 0.09,
    },
}

OECD_TIERS: dict[str, dict] = {
    "Tier1": {
        "label": "Significant impact — Cat A equivalent",
        "screening_required": True,
        "review_required": True,
        "notification_required": True,
        "esia_equivalent": True,
    },
    "Tier2": {
        "label": "Limited impact — Cat B equivalent",
        "screening_required": True,
        "review_required": True,
        "notification_required": False,
        "esia_equivalent": False,
    },
    "Tier3": {
        "label": "Minimal impact — Cat C equivalent",
        "screening_required": True,
        "review_required": False,
        "notification_required": False,
        "esia_equivalent": False,
    },
}

PARIS_ALIGNMENT_CRITERIA: dict[str, dict] = {
    "mitigation": {
        "weight": 0.40,
        "sub_criteria": [
            {"name": "sector_benchmark_alignment",      "description": "GHG intensity vs IFC/SBTi sector benchmark"},
            {"name": "emissions_trajectory",            "description": "Trajectory consistent with 1.5/2°C pathway"},
            {"name": "technology_compatibility",        "description": "No lock-in of high-carbon technology"},
            {"name": "scope3_considerations",           "description": "Scope 3 emissions assessed for material sectors"},
        ],
    },
    "adaptation": {
        "weight": 0.30,
        "sub_criteria": [
            {"name": "climate_vulnerability_assessment","description": "Physical climate risk assessment conducted"},
            {"name": "resilience_measures",             "description": "Adaptation measures integrated in project design"},
            {"name": "climate_proofing",                "description": "Infrastructure designed to future climate parameters"},
            {"name": "adaptive_management",             "description": "Ongoing adaptive management framework"},
        ],
    },
    "governance": {
        "weight": 0.30,
        "sub_criteria": [
            {"name": "climate_policy_alignment",        "description": "Aligned with host country NDC and climate policy"},
            {"name": "climate_disclosure",              "description": "Climate risks and opportunities disclosed (TCFD)"},
            {"name": "capacity_building",               "description": "Counterpart capacity building on climate"},
            {"name": "mne_monitoring",                  "description": "Monitoring of climate-related KPIs"},
        ],
    },
}

DSCR_CLIMATE_HAIRCUTS: dict[str, dict] = {
    "power":        {"physical_risk_haircut_orderly": 0.05, "physical_risk_haircut_disorderly": 0.12, "transition_capex_pct": 0.15, "revenue_reduction_pct": 0.10},
    "oil_gas":      {"physical_risk_haircut_orderly": 0.08, "physical_risk_haircut_disorderly": 0.20, "transition_capex_pct": 0.25, "revenue_reduction_pct": 0.30},
    "mining":       {"physical_risk_haircut_orderly": 0.07, "physical_risk_haircut_disorderly": 0.15, "transition_capex_pct": 0.12, "revenue_reduction_pct": 0.18},
    "transport":    {"physical_risk_haircut_orderly": 0.06, "physical_risk_haircut_disorderly": 0.14, "transition_capex_pct": 0.10, "revenue_reduction_pct": 0.08},
    "water":        {"physical_risk_haircut_orderly": 0.10, "physical_risk_haircut_disorderly": 0.22, "transition_capex_pct": 0.05, "revenue_reduction_pct": 0.05},
    "agriculture":  {"physical_risk_haircut_orderly": 0.12, "physical_risk_haircut_disorderly": 0.28, "transition_capex_pct": 0.08, "revenue_reduction_pct": 0.15},
    "real_estate":  {"physical_risk_haircut_orderly": 0.08, "physical_risk_haircut_disorderly": 0.18, "transition_capex_pct": 0.12, "revenue_reduction_pct": 0.12},
    "renewables":   {"physical_risk_haircut_orderly": 0.04, "physical_risk_haircut_disorderly": 0.09, "transition_capex_pct": 0.02, "revenue_reduction_pct": 0.03},
}

BLENDED_FINANCE_STRUCTURES: dict[str, dict] = {
    "first_loss": {
        "description": "Junior equity or debt tranche absorbs first losses to de-risk senior tranches",
        "typical_components": ["grant", "junior_equity", "concessional_debt"],
        "crowding_in_min": 3.0,
        "crowding_in_max": 8.0,
        "use_case": "High-risk frontier markets, early-stage climate sectors",
    },
    "guarantee": {
        "description": "MDB/DFI partial credit guarantee on senior debt",
        "typical_components": ["partial_credit_guarantee", "risk_sharing_facility"],
        "crowding_in_min": 4.0,
        "crowding_in_max": 10.0,
        "use_case": "Established markets with perceived sovereign/credit risk",
    },
    "concessional_debt": {
        "description": "Below-market rate debt from DFI/MDB alongside commercial debt",
        "typical_components": ["concessional_loan", "technical_assistance_grant"],
        "crowding_in_min": 2.0,
        "crowding_in_max": 5.0,
        "use_case": "Infrastructure with high social returns but insufficient financial returns",
    },
    "grant_component": {
        "description": "Grant for non-revenue-generating components (e.g. pre-feasibility, TA)",
        "typical_components": ["technical_assistance", "feasibility_grant", "results_based_finance"],
        "crowding_in_min": 1.5,
        "crowding_in_max": 4.0,
        "use_case": "Enabling environment, capacity building, high public goods",
    },
    "equity_plus": {
        "description": "DFI equity anchor alongside commercial equity with upside sharing",
        "typical_components": ["anchor_equity", "co_investment_facility", "performance_incentives"],
        "crowding_in_min": 2.5,
        "crowding_in_max": 6.0,
        "use_case": "Venture/growth equity in climate tech, last-mile infrastructure",
    },
}

CBI_STANDARD_V4_SECTORS: list[str] = [
    "solar_energy",
    "wind_energy",
    "geothermal_energy",
    "sustainable_water",
    "low_carbon_transport",
    "low_carbon_buildings",
    "sustainable_land_use",
    "marine_resources",
    "waste_management",
    "climate_adaptation",
    "biodiversity_conservation",
    "industry_energy_efficiency",
]

CROWDING_IN_RATIOS: dict[str, dict] = {
    "first_loss":        {"min": 3.0, "max": 8.0,  "typical": 5.0},
    "guarantee":         {"min": 4.0, "max": 10.0, "typical": 7.0},
    "concessional_debt": {"min": 2.0, "max": 5.0,  "typical": 3.5},
    "grant_component":   {"min": 1.5, "max": 4.0,  "typical": 2.5},
    "equity_plus":       {"min": 2.5, "max": 6.0,  "typical": 4.0},
}

# ---------------------------------------------------------------------------
# Dataclasses
# ---------------------------------------------------------------------------

@dataclass
class EPResult:
    entity_id: str
    project_type: str
    sector: str
    country: str
    total_cost_usd: float
    category: str
    principle_scores: dict  # values are per-principle score or None (insufficient_data)
    overall_score: Optional[float]  # None when no per-principle scores supplied
    esap_required: bool
    compliant: bool
    key_gaps: list[str]

@dataclass
class IFCPSResult:
    entity_id: str
    sector: str
    ps_scores: dict  # values are per-PS score or None (insufficient_data)
    composite_score: Optional[float]  # None when no PS scores supplied
    compliant: bool
    gaps: list[str]

@dataclass
class OECDResult:
    entity_id: str
    sector: str
    country: str
    tier: str
    tier_label: str
    screening_required: bool
    review_required: bool
    notification_required: bool

@dataclass
class ParisAlignmentResult:
    entity_id: str
    sector: str
    alignment_score: Optional[float]  # None when no sub-criteria supplied
    mitigation_aligned: bool
    adaptation_aligned: bool
    governance_aligned: bool
    overall_aligned: bool
    ghg_reduction_pa: Optional[float]  # None when mitigation not scored
    sub_scores: dict  # dimension/component values are score or None

@dataclass
class DSCRStressResult:
    entity_id: str
    sector: str
    baseline_dscr: float
    dscr_physical: float
    dscr_transition: float
    dscr_combined: float
    breaches_covenant: bool
    covenant_threshold: float
    physical_haircut_applied: float
    transition_capex_impact: float

@dataclass
class BlendedFinanceResult:
    entity_id: str
    total_cost_usd: float
    structure_type: str
    tranche_breakdown: dict  # tranche amounts None when mdb_share_pct not supplied
    crowding_in_ratio: float  # deal override or published central estimate
    private_finance_mobilised: Optional[float]  # None when MDB share not supplied
    blended_irr: Optional[float]  # None when concessional uplift not supplied
    oecd_additionality_score: Optional[float]
    mdb_share_pct: Optional[float]  # None when not supplied

@dataclass
class ClimateLabelResult:
    entity_id: str
    sector: str
    cbi_certified: bool
    icma_gbf_aligned: bool
    sdg_label: list[str]
    eligible_taxonomies: list[str]
    annual_ghg_reduction: float
    eligible_cbi_sector: Optional[str]

# ---------------------------------------------------------------------------
# Engine Class
# ---------------------------------------------------------------------------

class InfrastructureFinanceEngine:
    """Pure computation — no DB calls."""

    # ------------------------------------------------------------------
    # 1. Equator Principles IV
    # ------------------------------------------------------------------
    def assess_equator_principles(
        self,
        entity_id: str,
        project_type: str,
        sector: str,
        country: str,
        total_cost_usd: float,
        e_s_data: dict,
    ) -> EPResult:
        # Determine category
        default_cat = EP_SECTOR_RISKS.get(sector, "B")
        # Override if e_s_data provides explicit category
        category = e_s_data.get("category", default_cat)

        principle_scores = {}
        key_gaps = []
        total_score = 0.0
        supplied_weight = 0.0

        for p in EP_10_PRINCIPLES:
            pid = f"P{p['id']}"
            # Score only from caller-supplied e_s_data; otherwise honest null.
            # A principle compliance score is an entity-specific assessment and
            # cannot be fabricated when no per-principle input is provided.
            if pid in e_s_data:
                score = min(100.0, max(0.0, float(e_s_data[pid])))
                principle_scores[pid] = round(score, 1)
                total_score += score * p["weight"]
                supplied_weight += p["weight"]
                if score < 60.0:
                    key_gaps.append(f"{pid}: {p['name']} — below threshold ({score:.0f}/100)")
            else:
                principle_scores[pid] = None  # insufficient_data — no score supplied

        # Overall score is the weight-normalised mean of supplied principle
        # scores only; None (insufficient_data) when no per-principle inputs given.
        if supplied_weight > 0.0:
            overall_score = round(total_score / supplied_weight, 2)
        else:
            overall_score = None

        esap_required = category in ("A", "B")
        # Compliance requires a computed score and no identified gaps; when the
        # overall score is unknown, compliance cannot be asserted.
        compliant = overall_score is not None and overall_score >= 70.0 and len(key_gaps) == 0

        return EPResult(
            entity_id=entity_id,
            project_type=project_type,
            sector=sector,
            country=country,
            total_cost_usd=total_cost_usd,
            category=category,
            principle_scores=principle_scores,
            overall_score=overall_score,
            esap_required=esap_required,
            compliant=compliant,
            key_gaps=key_gaps,
        )

    # ------------------------------------------------------------------
    # 2. IFC Performance Standards
    # ------------------------------------------------------------------
    def assess_ifc_ps(
        self,
        entity_id: str,
        sector: str,
        country: str,
        workforce_size: int,
        biodiversity_sensitive: bool,
        land_acquisition: bool,
        indigenous_peoples_present: bool,
        cultural_heritage: bool,
        ps_data: Optional[dict] = None,
    ) -> IFCPSResult:
        # ps_data: optional caller-supplied mapping {ps_id -> 0..100 compliance
        # score}. A Performance Standard compliance score is an entity-specific
        # assessment; when not supplied it is reported as insufficient_data (None)
        # rather than fabricated. Project-characteristic flags (workforce size,
        # land acquisition, biodiversity/indigenous/cultural-heritage presence)
        # are surfaced as qualitative applicability gaps, not synthetic scores.
        ps_data = ps_data or {}

        ps_scores = {}
        gaps = []
        composite = 0.0
        supplied_weight = 0.0

        # Map PS -> the project-characteristic that makes it high-attention.
        elevated_attention = {
            "PS2": workforce_size > 500,
            "PS5": land_acquisition,
            "PS6": biodiversity_sensitive,
            "PS7": indigenous_peoples_present,
            "PS8": cultural_heritage,
        }

        for ps_id, ps in IFC_PS_DESCRIPTIONS.items():
            if ps_id in ps_data:
                score = min(100.0, max(0.0, float(ps_data[ps_id])))
                ps_scores[ps_id] = round(score, 1)
                composite += score * ps["weight"]
                supplied_weight += ps["weight"]
                if score < 60.0:
                    gaps.append(f"{ps_id}: {ps['name']} ({score:.0f}/100)")
            else:
                ps_scores[ps_id] = None  # insufficient_data — no score supplied
                if elevated_attention.get(ps_id):
                    gaps.append(
                        f"{ps_id}: {ps['name']} — elevated attention "
                        "(project characteristic present); no score supplied"
                    )

        # Weight-normalised mean of supplied scores; None when none supplied.
        composite = round(composite / supplied_weight, 2) if supplied_weight > 0.0 else None
        compliant = composite is not None and composite >= 70.0 and len(gaps) == 0

        return IFCPSResult(
            entity_id=entity_id,
            sector=sector,
            ps_scores=ps_scores,
            composite_score=composite,
            compliant=compliant,
            gaps=gaps,
        )

    # ------------------------------------------------------------------
    # 3. OECD Common Approaches
    # ------------------------------------------------------------------
    def assess_oecd(
        self,
        entity_id: str,
        sector: str,
        country: str,
        project_type: str,
    ) -> OECDResult:
        # Map sector to tier
        cat = EP_SECTOR_RISKS.get(sector, "B")
        if cat == "A":
            tier = "Tier1"
        elif cat == "B":
            tier = "Tier2"
        else:
            tier = "Tier3"

        tier_data = OECD_TIERS[tier]

        return OECDResult(
            entity_id=entity_id,
            sector=sector,
            country=country,
            tier=tier,
            tier_label=tier_data["label"],
            screening_required=tier_data["screening_required"],
            review_required=tier_data["review_required"],
            notification_required=tier_data["notification_required"],
        )

    # ------------------------------------------------------------------
    # 4. Paris Alignment (DFI)
    # ------------------------------------------------------------------
    def assess_paris_alignment(
        self,
        entity_id: str,
        sector: str,
        country: str,
        annual_ghg_tco2: float,
        project_lifetime_yrs: int,
        climate_vulnerability_score: float,
        criteria_scores: Optional[dict] = None,
    ) -> ParisAlignmentResult:
        # criteria_scores: optional caller-supplied mapping of sub-criteria
        # scores keyed as "{dim}_{sub_criteria_name}" (0..100), e.g.
        # "mitigation_emissions_trajectory". A Paris-alignment sub-score is an
        # entity-specific assessment; unsupplied sub-criteria are omitted and
        # a dimension score is None (insufficient_data) when none of its
        # sub-criteria are supplied. No scores are fabricated.
        criteria_scores = criteria_scores or {}

        sub_scores = {}
        dim_scores = {}

        for dim, dim_cfg in PARIS_ALIGNMENT_CRITERIA.items():
            dim_total = 0.0
            supplied = 0
            for sc in dim_cfg["sub_criteria"]:
                sc_name = sc["name"]
                key = f"{dim}_{sc_name}"
                if key in criteria_scores:
                    sc_score = min(100.0, max(0.0, float(criteria_scores[key])))
                    sub_scores[key] = round(sc_score, 1)
                    dim_total += sc_score
                    supplied += 1
                else:
                    sub_scores[key] = None  # insufficient_data — no score supplied
            dim_scores[dim] = round(dim_total / supplied, 2) if supplied > 0 else None

        # Weight-normalise the overall score across dimensions that have a value.
        aligned_weight = sum(
            PARIS_ALIGNMENT_CRITERIA[d]["weight"]
            for d in dim_scores if dim_scores[d] is not None
        )
        if aligned_weight > 0.0:
            alignment_score = round(
                sum(
                    dim_scores[d] * PARIS_ALIGNMENT_CRITERIA[d]["weight"]
                    for d in dim_scores if dim_scores[d] is not None
                ) / aligned_weight,
                2,
            )
        else:
            alignment_score = None

        # Null-guarded thresholds: alignment cannot be asserted without a score.
        mit = dim_scores.get("mitigation")
        adp = dim_scores.get("adaptation")
        gov = dim_scores.get("governance")
        mitigation_aligned = mit is not None and mit >= 65.0
        adaptation_aligned = adp is not None and adp >= 60.0
        governance_aligned = gov is not None and gov >= 65.0
        overall_aligned = alignment_score is not None and alignment_score >= 65.0

        # GHG reduction estimate derives from the mitigation alignment score;
        # None (insufficient_data) when mitigation was not scored.
        if mit is not None:
            ghg_reduction_pa = round(annual_ghg_tco2 * (mit / 100.0) * 0.3, 2)
        else:
            ghg_reduction_pa = None

        return ParisAlignmentResult(
            entity_id=entity_id,
            sector=sector,
            alignment_score=alignment_score,
            mitigation_aligned=mitigation_aligned,
            adaptation_aligned=adaptation_aligned,
            governance_aligned=governance_aligned,
            overall_aligned=overall_aligned,
            ghg_reduction_pa=ghg_reduction_pa,
            sub_scores={**dim_scores, "components": sub_scores},
        )

    # ------------------------------------------------------------------
    # 5. DSCR Climate Stress
    # ------------------------------------------------------------------
    def calculate_dscr_climate_stress(
        self,
        entity_id: str,
        sector: str,
        baseline_dscr: float,
        debt_service_usd_pa: float,
        physical_risk_level: str = "medium",
        transition_risk_level: str = "medium",
    ) -> DSCRStressResult:
        haircuts = DSCR_CLIMATE_HAIRCUTS.get(sector, DSCR_CLIMATE_HAIRCUTS["infrastructure"] if "infrastructure" in DSCR_CLIMATE_HAIRCUTS else DSCR_CLIMATE_HAIRCUTS["transport"])

        # Physical risk haircut on DSCR
        phys_factor = {"low": 0.5, "medium": 1.0, "high": 1.5, "very_high": 2.0}.get(physical_risk_level, 1.0)
        trans_factor = {"low": 0.5, "medium": 1.0, "high": 1.5, "very_high": 2.0}.get(transition_risk_level, 1.0)

        is_disorderly = physical_risk_level in ("high", "very_high")
        phys_haircut = (
            haircuts["physical_risk_haircut_disorderly"] if is_disorderly
            else haircuts["physical_risk_haircut_orderly"]
        ) * phys_factor

        # Transition capex reduces free cash flow → reduces DSCR
        transition_capex_impact = haircuts["transition_capex_pct"] * trans_factor * 0.5
        revenue_reduction = haircuts["revenue_reduction_pct"] * trans_factor * 0.5

        # Stressed DSCRs
        dscr_physical = baseline_dscr * (1.0 - phys_haircut)
        dscr_transition = baseline_dscr * (1.0 - transition_capex_impact - revenue_reduction)
        dscr_combined = baseline_dscr * (1.0 - phys_haircut - transition_capex_impact * 0.5 - revenue_reduction * 0.5)

        covenant_threshold = 1.20  # standard infrastructure covenant
        breaches_covenant = dscr_combined < covenant_threshold

        return DSCRStressResult(
            entity_id=entity_id,
            sector=sector,
            baseline_dscr=round(baseline_dscr, 3),
            dscr_physical=round(dscr_physical, 3),
            dscr_transition=round(dscr_transition, 3),
            dscr_combined=round(dscr_combined, 3),
            breaches_covenant=breaches_covenant,
            covenant_threshold=covenant_threshold,
            physical_haircut_applied=round(phys_haircut, 4),
            transition_capex_impact=round(transition_capex_impact, 4),
        )

    # ------------------------------------------------------------------
    # 6. Blended Finance Structuring
    # ------------------------------------------------------------------
    def structure_blended_finance(
        self,
        entity_id: str,
        total_cost_usd: float,
        sector: str,
        country: str,
        target_private_irr_pct: float,
        mdb_participation: bool,
        mdb_share_pct: Optional[float] = None,
        crowding_in_ratio_override: Optional[float] = None,
        concessional_irr_uplift_pct: Optional[float] = None,
    ) -> BlendedFinanceResult:
        # Optional caller-supplied deal terms (all entity-specific):
        #   mdb_share_pct               — MDB/DFI share of total (0..100). Drives
        #                                 the tranche split and mobilisation; when
        #                                 absent the tranche breakdown and private
        #                                 finance mobilised are insufficient_data.
        #   crowding_in_ratio_override  — deal-specific crowding-in ratio. When
        #                                 absent we fall back to the structure's
        #                                 documented central estimate ("typical")
        #                                 from CROWDING_IN_RATIOS (OECD Blended
        #                                 Finance Toolkit) — a published model
        #                                 constant, not an entity measurement.
        #   concessional_irr_uplift_pct — the concessional uplift (pp) added to
        #                                 the target private IRR to obtain the
        #                                 blended IRR. When absent the blended IRR
        #                                 is insufficient_data (not fabricated).

        # Select structure based on sector and risk profile (deterministic).
        sector_cat = EP_SECTOR_RISKS.get(sector, "B")
        if sector_cat == "A" or target_private_irr_pct < 8.0:
            structure_type = "first_loss"
        elif mdb_participation and target_private_irr_pct < 12.0:
            structure_type = "guarantee"
        elif target_private_irr_pct < 10.0:
            structure_type = "concessional_debt"
        else:
            structure_type = "equity_plus"

        struct = BLENDED_FINANCE_STRUCTURES[structure_type]
        ci_data = CROWDING_IN_RATIOS[structure_type]
        # Deal-specific override if provided, else published central estimate.
        crowding_in = (
            float(crowding_in_ratio_override)
            if crowding_in_ratio_override is not None
            else ci_data["typical"]
        )

        # Tranche breakdown — requires a caller-supplied MDB share; no default
        # capital structure is fabricated when the share is unknown.
        if mdb_share_pct is not None:
            mdb_pct = min(1.0, max(0.0, float(mdb_share_pct) / 100.0))
            private_pct = 1.0 - mdb_pct
            mdb_amount = total_cost_usd * mdb_pct
            tranche_breakdown = {
                "mdb_dfi_tranche_usd": round(mdb_amount, 0),
                "private_tranche_usd": round(total_cost_usd * private_pct, 0),
                "mdb_share_pct": round(mdb_pct * 100.0, 1),
                "structure": structure_type,
                "components": struct["typical_components"],
            }
            private_finance_mobilised = round(mdb_amount * crowding_in, 0)
            mdb_share_out = round(mdb_pct * 100.0, 1)
        else:
            tranche_breakdown = {
                "mdb_dfi_tranche_usd": None,
                "private_tranche_usd": None,
                "mdb_share_pct": None,
                "structure": structure_type,
                "components": struct["typical_components"],
                "note": "insufficient_data — mdb_share_pct not supplied",
            }
            private_finance_mobilised = None
            mdb_share_out = None

        # Blended IRR = target private IRR + supplied concessional uplift; None
        # when the uplift is not supplied.
        if concessional_irr_uplift_pct is not None:
            blended_irr = round(target_private_irr_pct + float(concessional_irr_uplift_pct), 2)
        else:
            blended_irr = None

        # OECD additionality proxy is a deterministic function of the crowding-in
        # ratio (mobilisation leverage); reported when a ratio is available.
        oecd_additionality_score = (
            round(min(100.0, crowding_in * 12.0), 1) if crowding_in is not None else None
        )

        return BlendedFinanceResult(
            entity_id=entity_id,
            total_cost_usd=total_cost_usd,
            structure_type=structure_type,
            tranche_breakdown=tranche_breakdown,
            crowding_in_ratio=round(crowding_in, 2),
            private_finance_mobilised=private_finance_mobilised,
            blended_irr=blended_irr,
            oecd_additionality_score=oecd_additionality_score,
            mdb_share_pct=mdb_share_out,
        )

    # ------------------------------------------------------------------
    # 7. Climate Label Eligibility
    # ------------------------------------------------------------------
    def assess_climate_label(
        self,
        entity_id: str,
        sector: str,
        annual_ghg_reduction: float,
        project_type: str,
    ) -> ClimateLabelResult:
        # Map sector to CBI eligible sector
        sector_map = {
            "solar_energy":   "solar_energy",
            "wind_energy":    "wind_energy",
            "renewables":     "solar_energy",
            "transport":      "low_carbon_transport",
            "water":          "sustainable_water",
            "real_estate":    "low_carbon_buildings",
            "agriculture":    "sustainable_land_use",
            "waste":          "waste_management",
            "geothermal":     "geothermal_energy",
            "biodiversity":   "biodiversity_conservation",
        }
        eligible_cbi_sector = sector_map.get(sector)
        cbi_certified = eligible_cbi_sector is not None and annual_ghg_reduction > 0

        # ICMA GBF: any use of proceeds for green projects qualifies
        icma_gbf_aligned = project_type in ("green_bond", "sustainability_bond", "climate_bond") or cbi_certified

        # SDG labels
        sdg_labels = []
        if sector in ("renewables", "solar_energy", "wind_energy"):
            sdg_labels.extend(["SDG7_clean_energy", "SDG13_climate_action"])
        if sector == "water":
            sdg_labels.extend(["SDG6_clean_water", "SDG13_climate_action"])
        if sector == "transport":
            sdg_labels.extend(["SDG11_sustainable_cities", "SDG13_climate_action"])
        if sector in ("agriculture", "sustainable_land_use"):
            sdg_labels.extend(["SDG2_zero_hunger", "SDG15_life_on_land"])

        eligible_taxonomies = []
        if cbi_certified:
            eligible_taxonomies.append("CBI_Standard_v4")
        if icma_gbf_aligned:
            eligible_taxonomies.append("ICMA_GBP")
        if sector in ("renewables", "solar_energy", "wind_energy", "water", "transport"):
            eligible_taxonomies.extend(["EU_Taxonomy", "ASEAN_Taxonomy"])
        if sector in ("transport", "real_estate"):
            eligible_taxonomies.append("PBOC_Green_Bond_Catalogue")

        return ClimateLabelResult(
            entity_id=entity_id,
            sector=sector,
            cbi_certified=cbi_certified,
            icma_gbf_aligned=icma_gbf_aligned,
            sdg_label=sdg_labels,
            eligible_taxonomies=eligible_taxonomies,
            annual_ghg_reduction=round(annual_ghg_reduction, 2),
            eligible_cbi_sector=eligible_cbi_sector,
        )

    # ------------------------------------------------------------------
    # 8. Full Assessment
    # ------------------------------------------------------------------
    def generate_full_assessment(
        self,
        entity_id: str,
        project_data: dict,
    ) -> dict:
        sector = project_data.get("sector", "renewables")
        country = project_data.get("country", "IN")
        total_cost_usd = project_data.get("total_cost_usd", 200_000_000.0)
        project_type = project_data.get("project_type", "greenfield")
        workforce_size = project_data.get("workforce_size", 200)
        baseline_dscr = project_data.get("baseline_dscr", 1.45)
        debt_service = project_data.get("debt_service_usd_pa", 15_000_000.0)
        annual_ghg = project_data.get("annual_ghg_tco2", 50_000.0)
        ghg_reduction = project_data.get("annual_ghg_reduction", 30_000.0)
        lifetime_yrs = project_data.get("project_lifetime_yrs", 25)
        vulnerability = project_data.get("climate_vulnerability_score", 5.0)
        target_irr = project_data.get("target_private_irr_pct", 12.0)
        mdb_participation = project_data.get("mdb_participation", True)
        biodiversity_sensitive = project_data.get("biodiversity_sensitive", False)
        land_acquisition = project_data.get("land_acquisition", False)
        indigenous_peoples = project_data.get("indigenous_peoples_present", False)
        cultural_heritage = project_data.get("cultural_heritage", False)

        ep = self.assess_equator_principles(entity_id, project_type, sector, country, total_cost_usd, project_data.get("e_s_data", {}))
        ifc_ps = self.assess_ifc_ps(entity_id, sector, country, workforce_size, biodiversity_sensitive, land_acquisition, indigenous_peoples, cultural_heritage, ps_data=project_data.get("ps_data"))
        oecd = self.assess_oecd(entity_id, sector, country, project_type)
        paris = self.assess_paris_alignment(entity_id, sector, country, annual_ghg, lifetime_yrs, vulnerability, criteria_scores=project_data.get("paris_criteria_scores"))
        dscr = self.calculate_dscr_climate_stress(entity_id, sector, baseline_dscr, debt_service, project_data.get("physical_risk_level", "medium"), project_data.get("transition_risk_level", "medium"))
        blended = self.structure_blended_finance(entity_id, total_cost_usd, sector, country, target_irr, mdb_participation, mdb_share_pct=project_data.get("mdb_share_pct"), crowding_in_ratio_override=project_data.get("crowding_in_ratio"), concessional_irr_uplift_pct=project_data.get("concessional_irr_uplift_pct"))
        label = self.assess_climate_label(entity_id, sector, ghg_reduction, project_type)

        # Weighted compliance over available score components; the DSCR covenant
        # component is always deterministic. Missing score components (None /
        # insufficient_data) are excluded and the remaining weights renormalised.
        _components = [
            (ep.overall_score, 0.20),
            (ifc_ps.composite_score, 0.20),
            (paris.alignment_score, 0.30),
            (100.0 if not dscr.breaches_covenant else 40.0, 0.30),
        ]
        _avail = [(v, w) for v, w in _components if v is not None]
        _wsum = sum(w for _, w in _avail)
        overall_compliance = (
            round(sum(v * w for v, w in _avail) / _wsum, 2) if _wsum > 0.0 else None
        )

        return {
            "assessment_id": str(uuid.uuid4()),
            "entity_id": entity_id,
            "sector": sector,
            "country": country,
            "total_cost_usd": total_cost_usd,
            "equator_principles": {
                "category": ep.category,
                "overall_score": ep.overall_score,
                "esap_required": ep.esap_required,
                "compliant": ep.compliant,
                "gaps_count": len(ep.key_gaps),
            },
            "ifc_ps": {
                "composite_score": ifc_ps.composite_score,
                "compliant": ifc_ps.compliant,
                "gaps_count": len(ifc_ps.gaps),
            },
            "oecd": {
                "tier": oecd.tier,
                "tier_label": oecd.tier_label,
                "review_required": oecd.review_required,
            },
            "paris_alignment": {
                "alignment_score": paris.alignment_score,
                "overall_aligned": paris.overall_aligned,
                "mitigation_aligned": paris.mitigation_aligned,
                "adaptation_aligned": paris.adaptation_aligned,
                "ghg_reduction_pa_tco2": paris.ghg_reduction_pa,
            },
            "dscr_stress": {
                "baseline_dscr": dscr.baseline_dscr,
                "dscr_combined": dscr.dscr_combined,
                "breaches_covenant": dscr.breaches_covenant,
                "covenant_threshold": dscr.covenant_threshold,
            },
            "blended_finance": {
                "structure_type": blended.structure_type,
                "crowding_in_ratio": blended.crowding_in_ratio,
                "private_finance_mobilised": blended.private_finance_mobilised,
                "blended_irr": blended.blended_irr,
            },
            "climate_label": {
                "cbi_certified": label.cbi_certified,
                "icma_gbf_aligned": label.icma_gbf_aligned,
                "eligible_taxonomies": label.eligible_taxonomies,
                "sdg_labels": label.sdg_label,
            },
            "overall_compliance_score": overall_compliance,
            "generated_at": datetime.utcnow().isoformat() + "Z",
        }
