"""
Sustainable Trade Finance Engine — E75
========================================
Implements Equator Principles 4 (EP4) compliance, OECD Common Approaches 2016
(Recommendation on Environment), ECA green classification, ICC Sustainable Trade
Finance Principles (2019), ESG-linked margin calculation, and supply chain ESG
screening (OECD Due Diligence Guidance, EUDR overlay, modern slavery, conflict minerals).

References:
- Equator Principles 4 (July 2020) — 10 Principles, IFC Performance Standards
- OECD Recommendation on Common Approaches for ECA-Supported Transactions
  and Environmental and Social Due Diligence (2016)
- OECD CRE Arrangement (2023 revision) — Sustainable Lending
- ICC Sustainable Trade Finance Principles (ICC Publication No. 908E, 2019)
- IFC Performance Standards on Environmental and Social Sustainability (2012)
- WTO Aid for Trade — Sustainable Trade metrics
- UNCTAD Trade and Development Report 2023
- OECD Due Diligence Guidance for Responsible Business Conduct
- UK Modern Slavery Act 2015 / Australia Modern Slavery Act 2018
- EU Conflict Minerals Regulation (EU) 2017/821
- Responsible Business Alliance Code of Conduct v9.0
"""
from __future__ import annotations

from typing import Any, List, Optional
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------

class EP4ComplianceResult(BaseModel):
    class Config:
        extra = "allow"
    entity_id: str
    project_name: str
    ep4_category: str
    category_rationale: str
    applicable_standards: list
    compliance_checklist: list
    overall_score: Optional[float]
    esap_required: bool
    esap_requirements: list
    independent_review_required: bool
    designated_country: bool
    compliance_status: str
    critical_gaps: list

class ECAGreenResult(BaseModel):
    class Config:
        extra = "allow"
    entity_id: str
    sector: str
    technology: str
    country: str
    oecd_classification: str
    environmental_review_score: Optional[float]
    sector_sustainability_standard: str
    oecd_common_approaches_tier: str
    cre_arrangement_applicable: bool
    eca_risk_rating: int
    green_classification_tier: str
    requirements: list
    recommendations: list

class ESGLinkedMarginResult(BaseModel):
    class Config:
        extra = "allow"
    entity_id: str
    base_margin_bps: float
    adjusted_margin_bps: Optional[float]
    margin_adjustment_bps: Optional[float]
    kpi_results: list
    icc_stf_principles_assessment: list
    spt_calibration: str
    overall_kpi_score: Optional[float]
    margin_step_schedule: list
    covenants: list

class SupplyChainESGResult(BaseModel):
    class Config:
        extra = "allow"
    entity_id: str
    commodity: str
    origin_country: str
    tier1_supplier: str
    eudr_overlay: dict
    modern_slavery_risk: str
    deforestation_risk: str
    conflict_minerals_risk: str
    rba_alignment_score: float
    oecd_dd_guidance_met: bool
    overall_esg_score: float
    risk_tier: str
    certifications_verified: list
    remediation_actions: list

class TradefinanceReportResult(BaseModel):
    class Config:
        extra = "allow"
    entity_id: str
    icc_stf_principles: dict
    oecd_arrangement: dict
    ifc_performance_standards: dict
    unctad_metrics: dict
    platform_summary: dict
    recommendations: list

# ---------------------------------------------------------------------------
# Reference Data
# ---------------------------------------------------------------------------

EP4_CATEGORIES = {
    "A": {
        "description": "Projects with potential significant adverse environmental and social (E&S) impacts that are diverse, irreversible or unprecedented",
        "threshold_usd": 10_000_000,
        "ifc_ps_required": [1, 2, 3, 4, 5, 6, 7, 8],
        "independent_review": True,
        "esap_required": True,
        "examples": ["large mining", "oil & gas extraction", "large hydropower", "large infrastructure"],
    },
    "B": {
        "description": "Projects with potential limited adverse E&S impacts that are few in number, generally site-specific, largely reversible and readily addressed",
        "threshold_usd": 10_000_000,
        "ifc_ps_required": [1, 2, 3, 4],
        "independent_review": False,
        "esap_required": True,
        "examples": ["manufacturing", "agriculture", "small/mid infrastructure", "renewable energy"],
    },
    "C": {
        "description": "Projects with minimal or no adverse E&S impacts",
        "threshold_usd": 0,
        "ifc_ps_required": [],
        "independent_review": False,
        "esap_required": False,
        "examples": ["software", "financial services", "light manufacturing", "trading"],
    },
}

IFC_PERFORMANCE_STANDARDS = {
    1: {"name": "Assessment and Management of E&S Risks and Impacts", "mandatory": True},
    2: {"name": "Labor and Working Conditions", "mandatory": True},
    3: {"name": "Resource Efficiency and Pollution Prevention and Management", "mandatory": False},
    4: {"name": "Community Health, Safety and Security", "mandatory": False},
    5: {"name": "Land Acquisition and Involuntary Resettlement", "mandatory": False},
    6: {"name": "Biodiversity Conservation and Sustainable Management of Living Natural Resources", "mandatory": False},
    7: {"name": "Indigenous Peoples", "mandatory": False},
    8: {"name": "Cultural Heritage", "mandatory": False},
}

HIGH_RISK_SECTORS = [
    "mining_extractives", "oil_gas", "large_scale_agriculture", "hydropower",
    "large_infrastructure", "chemical_manufacturing", "textile_garment",
    "electronics_manufacturing", "forestry", "fishing", "construction",
    "waste_management", "food_processing", "automotive", "steel_metals",
]

# OECD country risk classifications (0=best, 7=highest risk)
ECA_COUNTRY_RISK_RATINGS = {
    "DE": 0, "FR": 0, "UK": 0, "US": 0, "JP": 0, "AU": 0, "CA": 0, "NL": 0, "SE": 0, "NO": 0,
    "SG": 0, "HK": 0, "KR": 2, "TW": 2, "CZ": 2, "PL": 2, "HU": 3, "SK": 3,
    "BR": 3, "MX": 3, "ZA": 3, "TR": 4, "IN": 4, "ID": 4, "PH": 4, "TH": 4,
    "VN": 4, "EG": 4, "MA": 5, "CO": 5, "PE": 5, "KE": 5, "GH": 5, "TN": 5,
    "NG": 6, "PK": 6, "BD": 6, "MM": 6, "KH": 6, "UG": 6, "TZ": 6, "ET": 6,
    "SD": 7, "YE": 7, "AF": 7, "LY": 7, "SO": 7, "SS": 7, "BI": 7, "CF": 7,
    "HT": 7, "MZ": 6, "ZM": 6, "MW": 6, "ZW": 7,
}

COMMODITY_SUPPLY_CHAIN_RISKS = {
    "cotton": {
        "deforestation_risk": "medium",
        "modern_slavery_risk": "high",
        "water_stress_risk": "high",
        "conflict_minerals_risk": "low",
        "eudr_regulated": False,
        "key_risks": ["child_labour", "forced_labour", "water_depletion", "pesticide_use"],
    },
    "cocoa": {
        "deforestation_risk": "high",
        "modern_slavery_risk": "high",
        "water_stress_risk": "medium",
        "conflict_minerals_risk": "low",
        "eudr_regulated": True,
        "key_risks": ["deforestation", "child_labour", "land_grabbing"],
    },
    "palm_oil": {
        "deforestation_risk": "very_high",
        "modern_slavery_risk": "high",
        "water_stress_risk": "medium",
        "conflict_minerals_risk": "low",
        "eudr_regulated": True,
        "key_risks": ["deforestation", "peatland_destruction", "biodiversity_loss", "forced_labour"],
    },
    "cobalt": {
        "deforestation_risk": "low",
        "modern_slavery_risk": "very_high",
        "water_stress_risk": "medium",
        "conflict_minerals_risk": "very_high",
        "eudr_regulated": False,
        "key_risks": ["artisanal_mining_risks", "child_labour", "conflict_finance", "health_hazards"],
    },
    "tin_tantalum_tungsten_gold": {
        "deforestation_risk": "medium",
        "modern_slavery_risk": "high",
        "water_stress_risk": "medium",
        "conflict_minerals_risk": "very_high",
        "eudr_regulated": False,
        "key_risks": ["conflict_minerals_3TG", "armed_group_finance", "mercury_pollution"],
    },
    "soy": {
        "deforestation_risk": "very_high",
        "modern_slavery_risk": "medium",
        "water_stress_risk": "high",
        "conflict_minerals_risk": "low",
        "eudr_regulated": True,
        "key_risks": ["cerrado_deforestation", "amazon_conversion", "pesticide_runoff", "land_conflict"],
    },
    "timber_paper": {
        "deforestation_risk": "high",
        "modern_slavery_risk": "medium",
        "water_stress_risk": "medium",
        "conflict_minerals_risk": "low",
        "eudr_regulated": True,
        "key_risks": ["illegal_logging", "forest_conversion", "indigenous_rights"],
    },
    "coffee": {
        "deforestation_risk": "high",
        "modern_slavery_risk": "medium",
        "water_stress_risk": "high",
        "conflict_minerals_risk": "low",
        "eudr_regulated": True,
        "key_risks": ["deforestation", "water_stress", "smallholder_vulnerability"],
    },
}

ICC_STF_PRINCIPLES = {
    1: {
        "principle": "Do No Harm",
        "description": "Trade finance transactions should not finance activities that cause significant harm to people or the planet",
        "requirements": ["negative_screening", "environmental_social_review", "sanctions_check"],
    },
    2: {
        "principle": "Promote Sustainability",
        "description": "Actively promote sustainable trade and ESG-aligned business practices",
        "requirements": ["esg_linked_pricing", "sustainability_kpis", "positive_impact_assessment"],
    },
    3: {
        "principle": "Engage and Influence",
        "description": "Engage with counterparties to improve ESG performance along the trade supply chain",
        "requirements": ["supplier_engagement", "capacity_building", "dialogue_with_producers"],
    },
    4: {
        "principle": "Measure and Report",
        "description": "Measure and transparently report on the ESG impact of trade finance portfolios",
        "requirements": ["portfolio_esg_reporting", "kpi_tracking", "annual_disclosure"],
    },
}

SECTOR_SUSTAINABILITY_STANDARDS = {
    "power": "OECD SSS for Power Sector (2016)",
    "water": "OECD SSS for Water and Sanitation (2018)",
    "transport": "OECD SSS for Transport (2020)",
    "mining": "OECD Due Diligence Guidance for Responsible Mining",
    "agriculture": "OECD-FAO Guidance for Responsible Agricultural Supply Chains",
    "forestry": "OECD Due Diligence Guidance for Responsible Forest Supply Chains",
    "garment": "OECD Due Diligence Guidance for Responsible Supply Chains in Garment",
    "general": "OECD Due Diligence Guidance for Responsible Business Conduct",
}

# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def _get_eca_risk_rating(country: str) -> int:
    return ECA_COUNTRY_RISK_RATINGS.get(country, 4)

# ---------------------------------------------------------------------------
# Core Engine Functions
# ---------------------------------------------------------------------------

def assess_ep4_compliance(
    entity_id: str,
    project_name: str,
    sector: str,
    country: str,
    total_cost_usd: float,
    principle_scores: Optional[dict] = None,
) -> dict:
    """
    Assess EP4 compliance: category A/B/C, IFC PS 1-8 applicability,
    10-requirement compliance checklist, ESAP requirements.

    `principle_scores` (optional): mapping of EP4 principle number (1-10, as int
    or str) to an assessed compliance score (0-100) sourced from the caller's E&S
    review. When absent, per-principle scores are reported as an honest null
    ("not_assessed") rather than fabricated — the category/standards/ESAP logic
    is fully deterministic and unaffected.
    """
    # Normalise caller-supplied principle scores to {int: float}
    scores_in: dict = {}
    if principle_scores:
        for k, v in principle_scores.items():
            try:
                scores_in[int(k)] = float(v)
            except (TypeError, ValueError):
                continue

    # Determine EP4 category
    country_risk = _get_eca_risk_rating(country)
    is_high_risk_sector = sector in HIGH_RISK_SECTORS

    if total_cost_usd >= 10_000_000 and (is_high_risk_sector or country_risk >= 5):
        ep4_category = "A"
    elif total_cost_usd >= 10_000_000:
        ep4_category = "B"
    elif is_high_risk_sector and total_cost_usd >= 1_000_000:
        ep4_category = "B"
    else:
        ep4_category = "C"

    cat_info = EP4_CATEGORIES[ep4_category]
    category_rationale = (
        f"Category {ep4_category}: {cat_info['description']}. "
        f"Sector: {sector} ({'high-risk' if is_high_risk_sector else 'standard'}), "
        f"Country risk: {country_risk}/7, Total cost: ${total_cost_usd:,.0f}"
    )

    # Applicable IFC Performance Standards
    applicable_ps = cat_info["ifc_ps_required"]
    applicable_standards = []
    for ps_num in applicable_ps:
        ps_info = IFC_PERFORMANCE_STANDARDS[ps_num]
        applicable_standards.append({
            "ps_number": ps_num,
            "name": ps_info["name"],
            "mandatory": ps_info["mandatory"],
        })
    # Always add ILO core conventions
    applicable_standards.append({
        "ps_number": None,
        "name": "ILO Core Labour Conventions (C87, C98, C29, C105, C138, C182)",
        "mandatory": True,
    })
    if country_risk <= 2:
        applicable_standards.append({
            "ps_number": None,
            "name": "Host country E&S law — Designated Country per EP4 Annex II",
            "mandatory": True,
        })

    # EP4 10-principle compliance checklist
    principles = [
        "1. Review and Categorisation",
        "2. Environmental and Social Assessment",
        "3. Applicable E&S Standards",
        "4. Environmental and Social Management System (ESMS)",
        "5. Stakeholder Engagement",
        "6. Grievance Mechanism",
        "7. Independent Review",
        "8. Covenants",
        "9. Independent Monitoring and Reporting",
        "10. Reporting and Transparency",
    ]
    compliance_checklist = []
    scored_total = 0.0
    scored_count = 0
    for p in principles:
        p_num = int(p.split(".")[0])
        applicable = not (ep4_category == "C" and p_num in [2, 3, 4, 7, 9])
        # Cat C: E&S assessment principles (2,3,4) are not applicable -> full marks by rule.
        if ep4_category == "C" and p_num in [2, 3, 4]:
            score: Optional[float] = 100.0
        elif p_num in scores_in:
            score = round(max(0.0, min(100.0, scores_in[p_num])), 1)
        else:
            score = None  # Honest null: no assessed score supplied by caller.

        if score is not None and applicable:
            scored_total += score
            scored_count += 1

        if score is None:
            status = "not_assessed"
        elif score >= 70.0:
            status = "compliant"
        else:
            status = "non_compliant"

        compliance_checklist.append({
            "principle": p,
            "score": score,
            "status": status,
            "applicable": applicable,
        })
    # Overall score only where genuine principle scores exist; else honest null.
    overall_score: Optional[float] = round(scored_total / scored_count, 1) if scored_count else None

    # ESAP requirements
    esap_required = cat_info["esap_required"]
    esap_requirements = []
    if esap_required:
        esap_requirements = [
            "E&S Management Plan (ESMP) per IFC PS 1",
            "Labor Management Procedures per IFC PS 2",
            "Pollution Prevention and Abatement Handbook compliance per IFC PS 3",
            "Emergency Preparedness and Response Plan per IFC PS 4",
            "Community engagement and disclosure process per IFC PS 1",
        ]
        if ep4_category == "A":
            esap_requirements.extend([
                "Resettlement Action Plan (RAP) if land acquisition required — IFC PS 5",
                "Biodiversity Management Plan if critical habitat present — IFC PS 6",
                "Indigenous Peoples Plan if IP communities present — IFC PS 7",
                "Cultural Heritage Management Plan — IFC PS 8",
            ])

    # Designated country
    designated_country = country_risk <= 1

    # Critical gaps — only genuinely assessed principles that failed (never nulls).
    critical_gaps = [
        item["principle"] for item in compliance_checklist
        if item["status"] == "non_compliant" and item["applicable"]
    ]

    # Number of applicable principles still awaiting an assessed score.
    unassessed_count = sum(
        1 for item in compliance_checklist
        if item["status"] == "not_assessed" and item["applicable"]
    )

    if overall_score is None:
        compliance_status = "insufficient_data"
    elif overall_score >= 80.0 and len(critical_gaps) == 0 and unassessed_count == 0:
        compliance_status = "compliant"
    elif overall_score >= 65.0:
        compliance_status = "substantially_compliant"
    else:
        compliance_status = "non_compliant"

    return EP4ComplianceResult(
        entity_id=entity_id,
        project_name=project_name,
        ep4_category=ep4_category,
        category_rationale=category_rationale,
        applicable_standards=applicable_standards,
        compliance_checklist=compliance_checklist,
        overall_score=overall_score,
        esap_required=esap_required,
        esap_requirements=esap_requirements,
        independent_review_required=cat_info["independent_review"],
        designated_country=designated_country,
        compliance_status=compliance_status,
        critical_gaps=critical_gaps[:5],
    ).dict()


def score_eca_green_classification(
    entity_id: str,
    sector: str,
    technology: str,
    country: str,
    oecd_classification: str,
    environmental_review_score: Optional[float] = None,
) -> dict:
    """
    Score ECA green classification: OECD Common Approaches 2016,
    OECD CRE 2023 revision, sector sustainability standards, ECA review score.

    `environmental_review_score` (optional): the caller's assessed 0-100 OECD
    Common Approaches environmental review score. When provided, deterministic
    sector adjustments (renewables/coal) are applied on top. When absent, the
    score is reported as an honest null and the green-tier is derived from the
    deterministic reference-data rules alone (sector exclusions), never fabricated.
    """
    eca_risk_rating = _get_eca_risk_rating(country)
    sector_std = SECTOR_SUSTAINABILITY_STANDARDS.get(sector, SECTOR_SUSTAINABILITY_STANDARDS["general"])

    # Determine OECD Common Approaches tier
    if sector in ["power", "water", "transport"] and eca_risk_rating >= 5:
        ca_tier = "Tier_A_Full_Environmental_Review"
    elif sector in HIGH_RISK_SECTORS or eca_risk_rating >= 4:
        ca_tier = "Tier_B_Limited_Environmental_Review"
    else:
        ca_tier = "Tier_C_Basic_Screening"

    # Environmental review score — deterministic sector adjustment applied to the
    # caller-supplied base score; honest null when no base score is provided.
    if environmental_review_score is not None:
        env_review_score: Optional[float] = round(
            float(environmental_review_score)
            + (5.0 if sector in ["renewable_energy", "solar", "wind", "energy_efficiency"] else 0.0)
            - (5.0 if sector in ["coal", "oil_gas"] else 0.0),
            1
        )
        env_review_score = max(25.0, min(100.0, env_review_score))
    else:
        env_review_score = None

    # CRE Arrangement applicability
    cre_applicable = sector in ["power", "water", "transport", "agriculture", "climate_smart"] and eca_risk_rating <= 5

    # Green classification tier (score-driven tiers require an assessed score;
    # sector exclusions are rule-based and apply regardless).
    if sector in ["coal"]:
        green_tier = "excluded"
    elif env_review_score is None:
        green_tier = "pending_environmental_review"
    elif env_review_score >= 80.0 and sector in ["renewable_energy", "energy_efficiency", "sustainable_agriculture"]:
        green_tier = "green_eligible"
    elif env_review_score >= 65.0:
        green_tier = "conditionally_green"
    else:
        green_tier = "standard"

    requirements = [
        f"OECD Common Approaches 2016 — Category {ca_tier.split('_')[1]} environmental due diligence",
        f"Sector Sustainability Standard: {sector_std}",
        f"ECA country risk rating {eca_risk_rating}/7 — {'enhanced' if eca_risk_rating >= 5 else 'standard'} due diligence",
        "Host country E&S law compliance verification",
        "Annual E&S monitoring report submission to ECA",
    ]
    if ca_tier == "Tier_A_Full_Environmental_Review":
        requirements.extend([
            "Full EIA/ESIA with independent review",
            "Stakeholder consultation process (min. 30 days public disclosure)",
            "Biodiversity impact assessment",
        ])
    if cre_applicable:
        requirements.append("OECD CRE Arrangement 2023 — sustainable lending terms applicable")

    recommendations = []
    if env_review_score is None:
        recommendations.append("Supply an OECD Common Approaches environmental review score to finalise green classification")
    elif env_review_score < 70.0:
        recommendations.append("Strengthen environmental management plan to meet OECD Common Approaches Tier A requirements")
    if green_tier == "conditionally_green":
        recommendations.append("Obtain independent sustainability certification to qualify for green ECA pricing")
    if eca_risk_rating >= 5:
        recommendations.append("Engage local civil society in E&S consultation process per IFC PS 1")
    if sector in ["coal"]:
        recommendations.append("Sector excluded from green ECA classification — consider transition plan")

    return ECAGreenResult(
        entity_id=entity_id,
        sector=sector,
        technology=technology,
        country=country,
        oecd_classification=oecd_classification,
        environmental_review_score=env_review_score,
        sector_sustainability_standard=sector_std,
        oecd_common_approaches_tier=ca_tier,
        cre_arrangement_applicable=cre_applicable,
        eca_risk_rating=eca_risk_rating,
        green_classification_tier=green_tier,
        requirements=requirements,
        recommendations=recommendations,
    ).dict()


def calculate_esg_linked_margin(
    entity_id: str,
    base_margin_bps: float,
    kpis: Optional[list] = None,
    performance_data: Optional[dict] = None,
    icc_principle_scores: Optional[dict] = None,
) -> dict:
    """
    Calculate ESG-linked margin: KPI materiality scoring, margin step-up/step-down
    (±5-15 bps), SPT calibration, ICC STF Principles 4 components.

    `performance_data` (optional): mapping of kpi_id -> observed current value. KPIs
    without an observed value are reported with a null current_value/performance_score
    and contribute nothing to the margin (honest null, never a random draw).
    `icc_principle_scores` (optional): mapping of ICC STF principle number (1-4) to an
    assessed 0-100 score. When absent, ICC principle scores are reported as null.
    """
    # Normalise caller-supplied ICC principle scores to {int: float}
    icc_scores_in: dict = {}
    if icc_principle_scores:
        for k, v in icc_principle_scores.items():
            try:
                icc_scores_in[int(k)] = float(v)
            except (TypeError, ValueError):
                continue

    if not kpis:
        kpis = [
            {"kpi_id": "GHG_INTENSITY", "name": "GHG Emissions Intensity", "unit": "tCO2e/unit",
             "baseline": 100.0, "target": 70.0, "weight": 0.40},
            {"kpi_id": "WATER_USE", "name": "Water Consumption Intensity", "unit": "m3/unit",
             "baseline": 50.0, "target": 35.0, "weight": 0.30},
            {"kpi_id": "SUPPLY_ESG", "name": "Supply Chain ESG Score", "unit": "score_0_100",
             "baseline": 55.0, "target": 75.0, "weight": 0.30},
        ]

    if not performance_data:
        performance_data = {}

    # Score KPIs. Only KPIs with an observed current value are scored; the rest are
    # reported as honest nulls and excluded from the weighted score/margin.
    kpi_results = []
    total_weighted_score = 0.0
    scored_weight = 0.0
    margin_adjustment = 0.0

    for kpi in kpis:
        current = performance_data.get(kpi["kpi_id"])
        if current is None:
            # No observed value — do not fabricate. Report null, contribute nothing.
            kpi_results.append({
                "kpi_id": kpi["kpi_id"],
                "name": kpi["name"],
                "unit": kpi["unit"],
                "baseline": kpi["baseline"],
                "target": kpi["target"],
                "current_value": None,
                "performance_score": None,
                "weight": kpi["weight"],
                "margin_adjustment_bps": 0.0,
                "target_met": None,
                "data_available": False,
            })
            continue

        current = float(current)
        # Performance: 0-100 scale where 100 = met target
        if kpi["target"] < kpi["baseline"]:  # Reduction KPI
            if current <= kpi["target"]:
                performance_score = 100.0
            elif current >= kpi["baseline"]:
                performance_score = 0.0
            else:
                performance_score = round((kpi["baseline"] - current) / (kpi["baseline"] - kpi["target"]) * 100.0, 1)
        else:  # Increase KPI
            if current >= kpi["target"]:
                performance_score = 100.0
            elif current <= kpi["baseline"]:
                performance_score = 0.0
            else:
                performance_score = round((current - kpi["baseline"]) / (kpi["target"] - kpi["baseline"]) * 100.0, 1)

        # Margin impact: -15 bps (outperform) to +15 bps (underperform)
        kpi_margin_adj = round((50.0 - performance_score) / 50.0 * 10.0 * kpi["weight"], 2)
        margin_adjustment += kpi_margin_adj
        total_weighted_score += performance_score * kpi["weight"]
        scored_weight += kpi["weight"]

        kpi_results.append({
            "kpi_id": kpi["kpi_id"],
            "name": kpi["name"],
            "unit": kpi["unit"],
            "baseline": kpi["baseline"],
            "target": kpi["target"],
            "current_value": round(current, 2),
            "performance_score": round(performance_score, 1),
            "weight": kpi["weight"],
            "margin_adjustment_bps": round(kpi_margin_adj, 2),
            "target_met": performance_score >= 80.0,
            "data_available": True,
        })

    # Overall weighted score is renormalised over the scored weight; honest null when
    # no KPI has observed data. Margin adjustment likewise only reflects scored KPIs.
    if scored_weight > 0:
        overall_kpi_score: Optional[float] = round(total_weighted_score / scored_weight, 1)
        margin_adjustment = max(-15.0, min(15.0, round(margin_adjustment, 2)))
        adjusted_margin_bps: Optional[float] = round(base_margin_bps + margin_adjustment, 2)
    else:
        overall_kpi_score = None
        margin_adjustment = 0.0
        adjusted_margin_bps = None

    # SPT calibration
    if overall_kpi_score is None:
        spt_calibration = "insufficient_data"
    elif overall_kpi_score >= 80.0:
        spt_calibration = "ambitious"
    elif overall_kpi_score >= 60.0:
        spt_calibration = "credible"
    else:
        spt_calibration = "requires_strengthening"

    # ICC STF Principles assessment — scores come from the caller's assessment
    # (icc_principle_scores) or are reported as honest nulls. Requirements are the
    # full published requirement list per principle; met/gap classification is only
    # asserted when a score is supplied (never guessed).
    icc_assessment = []
    for p_num, p_info in ICC_STF_PRINCIPLES.items():
        score = icc_scores_in.get(p_num)
        if score is not None:
            score = round(max(0.0, min(100.0, score)), 1)
            status = "met" if score >= 65.0 else "not_met"
        else:
            status = "not_assessed"
        icc_assessment.append({
            "principle": p_num,
            "name": p_info["principle"],
            "description": p_info["description"],
            "score": score,
            "requirements": list(p_info["requirements"]),
            "status": status,
        })

    # Margin step schedule (annual observation dates). Forward KPI trajectories are
    # not fabricated; projected fields are null pending a caller-supplied trajectory.
    step_schedule = []
    for year_offset in range(1, 4):
        step_schedule.append({
            "observation_year": 2024 + year_offset,
            "projected_kpi_score": None,
            "projected_margin_bps": None,
            "projected_adjustment_bps": None,
            "note": "Projection requires forward KPI trajectory input",
        })

    _step = f"{abs(margin_adjustment):.1f}" if margin_adjustment is not None else "N/A"
    covenants = [
        f"Annual KPI reporting within 120 days of financial year end",
        f"KPI verification by independent third party (Auditor or Rating Agency)",
        f"Margin step-up of {_step} bps if KPI targets missed",
        f"Margin step-down of {_step} bps if KPI targets exceeded by ≥10%",
        "ICC STF Principles annual compliance report",
    ]

    return ESGLinkedMarginResult(
        entity_id=entity_id,
        base_margin_bps=base_margin_bps,
        adjusted_margin_bps=adjusted_margin_bps,
        margin_adjustment_bps=margin_adjustment,
        kpi_results=kpi_results,
        icc_stf_principles_assessment=icc_assessment,
        spt_calibration=spt_calibration,
        overall_kpi_score=overall_kpi_score,
        margin_step_schedule=step_schedule,
        covenants=covenants,
    ).dict()


def screen_supply_chain_esg(
    entity_id: str,
    commodity: str,
    origin_country: str,
    tier1_supplier: str,
    certifications: Optional[list] = None,
) -> dict:
    """
    Screen supply chain ESG: OECD DD Guidance, EUDR overlay, modern slavery risk
    (UK MSA/Australia MSA), deforestation risk, conflict minerals (3TG+cobalt), RBA.
    """
    if not certifications:
        certifications = []

    commodity_info = COMMODITY_SUPPLY_CHAIN_RISKS.get(
        commodity, {"deforestation_risk": "medium", "modern_slavery_risk": "medium",
                     "conflict_minerals_risk": "low", "eudr_regulated": False, "key_risks": []}
    )

    country_risk = _get_eca_risk_rating(origin_country)

    # EUDR overlay
    eudr_overlay = {
        "eudr_regulated": commodity_info.get("eudr_regulated", False),
        "regulation": "EU Regulation 2023/1115",
        "applicable_commodities": ["cocoa", "coffee", "soy", "palm_oil", "wood", "cattle", "rubber"],
        "commodity_in_scope": commodity in ["cocoa", "coffee", "soy", "palm_oil", "wood", "cattle", "rubber"],
        "country_risk_tier": "high" if country_risk >= 5 else "standard" if country_risk >= 3 else "low",
        "geolocation_required": commodity_info.get("eudr_regulated", False),
        "cutoff_date": "31 December 2020",
    }

    # Modern slavery risk
    ms_risk_factors = []
    if country_risk >= 5:
        ms_risk_factors.append("High-risk origin country per OECD country risk ratings")
    if commodity_info.get("modern_slavery_risk") in ["high", "very_high"]:
        ms_risk_factors.append(f"Commodity '{commodity}' high modern slavery risk per KnowTheChain benchmarks")
    if "forced_labour" in commodity_info.get("key_risks", []) or "child_labour" in commodity_info.get("key_risks", []):
        ms_risk_factors.append("Commodity-specific labour rights violations documented")
    modern_slavery_risk = commodity_info.get("modern_slavery_risk", "medium")

    # UK MSA / Australia MSA compliance requirements
    uk_msa_applicable = True  # Any company with £36M+ turnover supplying UK market
    aus_msa_applicable = country_risk >= 3  # Australian entities with $100M+ revenue

    # Deforestation risk
    deforestation_risk = commodity_info.get("deforestation_risk", "medium")

    # Conflict minerals (3TG + cobalt)
    conflict_minerals_risk = commodity_info.get("conflict_minerals_risk", "low")
    if commodity in ["cobalt", "tin", "tantalum", "tungsten", "gold", "tin_tantalum_tungsten_gold"]:
        conflict_minerals_risk = "very_high"

    # RBA alignment score — deterministic function of OECD country risk (0-7).
    # Higher country risk lowers the baseline Responsible Business Alliance alignment.
    rba_score = round(100.0 - (country_risk * 8.0), 1)
    rba_score = max(20.0, min(100.0, rba_score))

    # OECD DD compliance
    oecd_dd_met = rba_score >= 60.0 and not ms_risk_factors

    # Verify certifications
    valid_certs = [
        "FSC", "RSPO", "PEFC", "RA_Rainforest_Alliance", "Fairtrade", "UTZ",
        "GRSB", "SAI_SAN", "RTRS", "ISCC", "4C_Coffee", "ASC", "MSC",
    ]
    certs_verified = [c for c in certifications if c in valid_certs]

    # Certification bonus
    if certs_verified:
        rba_score = min(100.0, rba_score + len(certs_verified) * 5.0)

    # Overall ESG score
    risk_deduction = {
        "low": 0, "medium": 10, "high": 20, "very_high": 35
    }
    overall_esg = round(
        rba_score
        - risk_deduction.get(deforestation_risk, 10)
        - risk_deduction.get(modern_slavery_risk, 10) * 0.5
        - risk_deduction.get(conflict_minerals_risk, 0) * 0.3
        + len(certs_verified) * 3.0,
        1
    )
    overall_esg = max(10.0, min(100.0, overall_esg))

    risk_tier = (
        "critical" if overall_esg < 40.0 else
        "high" if overall_esg < 60.0 else
        "medium" if overall_esg < 75.0 else
        "low"
    )

    # Remediation actions
    remediation_actions = []
    if deforestation_risk in ["high", "very_high"]:
        remediation_actions.append("Require EUDR-compliant geolocation data and supply chain traceability to farm level")
    if modern_slavery_risk in ["high", "very_high"]:
        remediation_actions.append("Conduct supply chain audit to ILO/SA8000 standards; require supplier code of conduct sign-off")
    if conflict_minerals_risk in ["high", "very_high"]:
        remediation_actions.append("Commission OECD Annex II conflict minerals due diligence; require RMAP/RASI certification")
    if not certs_verified:
        commodity_certs = {
            "cocoa": "UTZ/RA certification", "palm_oil": "RSPO certification",
            "timber_paper": "FSC/PEFC certification", "coffee": "4C/RA certification",
            "soy": "RTRS certification", "cobalt": "OECD/RBA CMRT submission",
        }
        rec_cert = commodity_certs.get(commodity, "relevant sustainability certification")
        remediation_actions.append(f"Require supplier to obtain {rec_cert} within 12 months")
    if oecd_dd_met is False:
        remediation_actions.append("Develop OECD Due Diligence Guidance action plan with supplier engagement timeline")

    return SupplyChainESGResult(
        entity_id=entity_id,
        commodity=commodity,
        origin_country=origin_country,
        tier1_supplier=tier1_supplier,
        eudr_overlay=eudr_overlay,
        modern_slavery_risk=modern_slavery_risk,
        deforestation_risk=deforestation_risk,
        conflict_minerals_risk=conflict_minerals_risk,
        rba_alignment_score=round(rba_score, 1),
        oecd_dd_guidance_met=oecd_dd_met,
        overall_esg_score=overall_esg,
        risk_tier=risk_tier,
        certifications_verified=certs_verified,
        remediation_actions=remediation_actions,
    ).dict()


def generate_trade_finance_report(
    entity_id: str,
    portfolio_data: Optional[dict] = None,
) -> dict:
    """
    Generate comprehensive sustainable trade finance report: ICC STF Principles (2019),
    WTO Aid for Trade, OECD Arrangement on Export Credits, IFC PS cross-reference,
    UNCTAD sustainable trade metrics.

    `portfolio_data` (optional): dict of pre-aggregated portfolio metrics keyed by the
    field names below. Any value not supplied is reported as an honest null rather than
    a fabricated figure; the framework descriptions/reference structures are always
    populated deterministically. Recognised keys mirror each output field, e.g.
    "entity_alignment_score", "esg_screened_transactions_pct", "total_transactions_assessed".
    """
    pd_in: dict = portfolio_data or {}

    def _num(key: str) -> Optional[float]:
        """Return a rounded numeric portfolio input, or None if not supplied/invalid."""
        v = pd_in.get(key)
        if v is None:
            return None
        try:
            return round(float(v), 1)
        except (TypeError, ValueError):
            return None

    def _int(key: str) -> Optional[int]:
        v = pd_in.get(key)
        if v is None:
            return None
        try:
            return int(v)
        except (TypeError, ValueError):
            return None

    def _bool(key: str) -> Optional[bool]:
        v = pd_in.get(key)
        return bool(v) if v is not None else None

    data_status = "reported" if pd_in else "insufficient_data"

    icc_stf_principles = {
        "publication": "ICC Sustainable Trade Finance Principles (ICC Publication No. 908E, 2019)",
        "principles_count": 4,
        "principles": {
            str(num): {"name": p["principle"], "description": p["description"]}
            for num, p in ICC_STF_PRINCIPLES.items()
        },
        "entity_alignment_score": _num("entity_alignment_score"),
        "key_metrics": {
            "esg_screened_transactions_pct": _num("esg_screened_transactions_pct"),
            "esg_linked_transactions_pct": _num("esg_linked_transactions_pct"),
            "supply_chain_engagements": _int("supply_chain_engagements"),
        },
        "data_status": data_status,
    }

    oecd_arrangement = {
        "regulation": "OECD Arrangement on Officially Supported Export Credits",
        "common_approaches_year": 2016,
        "cre_revision_year": 2023,
        "entity_compliance_score": _num("entity_compliance_score"),
        "country_risk_profiles_assessed": _int("country_risk_profiles_assessed"),
        "tier_a_transactions_pct": _num("tier_a_transactions_pct"),
        "coal_exclusion_policy": True,
        "fossil_fuel_phaseout_committed": _bool("fossil_fuel_phaseout_committed"),
        "data_status": data_status,
    }

    ifc_performance_standards = {
        "framework": "IFC Performance Standards on Environmental and Social Sustainability (2012)",
        "standards_count": 8,
        "standards": {
            str(num): {"name": info["name"], "mandatory": info["mandatory"]}
            for num, info in IFC_PERFORMANCE_STANDARDS.items()
        },
        "entity_average_compliance_score": _num("entity_average_compliance_score"),
        "cat_a_transactions_reviewed": _int("cat_a_transactions_reviewed"),
        "independent_monitor_engaged": _bool("independent_monitor_engaged"),
        "data_status": data_status,
    }

    unctad_metrics = {
        "framework": "UNCTAD Sustainable Trade Metrics 2023",
        "sustainable_trade_finance_volume_usd_mn": _num("sustainable_trade_finance_volume_usd_mn"),
        "share_of_green_trade_finance_pct": _num("share_of_green_trade_finance_pct"),
        "developing_country_trade_supported_pct": _num("developing_country_trade_supported_pct"),
        "sdg_aligned_transactions_pct": _num("sdg_aligned_transactions_pct"),
        "wto_aid_for_trade_contribution_usd_mn": _num("wto_aid_for_trade_contribution_usd_mn"),
        "data_status": data_status,
    }

    platform_summary = {
        "total_transactions_assessed": _int("total_transactions_assessed"),
        "total_value_assessed_usd_mn": _num("total_value_assessed_usd_mn"),
        "ep4_category_a_pct": _num("ep4_category_a_pct"),
        "ep4_category_b_pct": _num("ep4_category_b_pct"),
        "ep4_category_c_pct": _num("ep4_category_c_pct"),
        "avg_esg_supply_chain_score": _num("avg_esg_supply_chain_score"),
        "avg_eca_green_score": _num("avg_eca_green_score"),
        "esg_linked_facilities": _int("esg_linked_facilities"),
        "data_status": data_status,
    }

    recommendations = [
        "Adopt ICC STF Principles framework as official policy and disclose alignment annually",
        "Integrate OECD Common Approaches 2016 into E&S due diligence for all ECA-backed transactions",
        "Expand supply chain ESG screening to 100% of high-risk commodity transactions",
        "Launch ESG-linked trade finance product with ICC STF-compliant KPI framework",
        "Engage suppliers in deforestation-free supply chain commitments aligned with EUDR",
        "Publish annual Trade Finance Sustainability Report aligned with UNCTAD metrics",
    ]

    return TradefinanceReportResult(
        entity_id=entity_id,
        icc_stf_principles=icc_stf_principles,
        oecd_arrangement=oecd_arrangement,
        ifc_performance_standards=ifc_performance_standards,
        unctad_metrics=unctad_metrics,
        platform_summary=platform_summary,
        recommendations=recommendations,
    ).dict()
