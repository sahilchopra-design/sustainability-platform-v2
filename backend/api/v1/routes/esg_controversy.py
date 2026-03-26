"""
API Routes: E111 — ESG Controversy & Incident Tracking Engine
=============================================================
POST /api/v1/esg-controversy/assess               — Entity controversy assessment
POST /api/v1/esg-controversy/score-incident       — Single incident scoring
POST /api/v1/esg-controversy/remediation-score    — Remediation quality assessment
POST /api/v1/esg-controversy/portfolio-exposure   — Portfolio controversy exposure (SFDR PAI 10-11)
GET  /api/v1/esg-controversy/ref/controversy-levels — Sustainalytics 5-level framework
GET  /api/v1/esg-controversy/ref/reprisk-methodology — RepRisk RRI methodology
GET  /api/v1/esg-controversy/ref/incident-types   — 50 incident types with financial materiality
GET  /api/v1/esg-controversy/ref/ungc-violations  — UNGC violation triggers by incident type
"""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional

from services.esg_controversy_engine import (
    ControversyAssessRequest,
    IncidentScoreRequest,
    RemediationScoreRequest,
    PortfolioControveryRequest,
    ControveryTrendRequest,
    ESGControversyEngine,
    SUSTAINALYTICS_CONTROVERSY_LEVELS,
    REPRISK_METHODOLOGY,
    ESG_INCIDENT_TYPES,
    UNGC_PRINCIPLES,
    MSCI_CONTROVERSY_IMPACT,
    SFDR_PAI_CONTROVERSY,
    INDUSTRY_EXPOSURE_FACTORS,
)

router = APIRouter(prefix="/api/v1/esg-controversy", tags=["ESG Controversy"])
_engine = ESGControversyEngine()


# ---------------------------------------------------------------------------
# POST Routes
# ---------------------------------------------------------------------------

@router.post("/assess", summary="Entity-level ESG controversy assessment")
def assess_entity_controversy(req: ControversyAssessRequest):
    """
    Comprehensive ESG controversy assessment for a single entity covering:
    - Sustainalytics controversy level 1-5 (Low → Catastrophic)
    - RepRisk RRI score (0-100) and RepRisk rating (AAA → CCC)
    - UNGC principles violation flags (10 principles)
    - Financial materiality: revenue at risk %, litigation risk
    - MSCI ESG rating impact (notch adjustment)
    - SFDR PAI 10 flag (UNGC/OECD violations) and PAI 14 (controversial weapons)
    - Remediation adequacy and investor action recommendation

    active_incidents: list of incident type keys (see /ref/incident-types)
    incident_severities: optional dict {incident_type: "critical"|"high"|"medium"|"low"}
    remediation_status: none | acknowledged | partial | substantial | full | verified
    """
    return _engine.assess(req)


@router.post("/score-incident", summary="Score a single ESG incident")
def score_incident(req: IncidentScoreRequest):
    """
    Score a single ESG incident for:
    - ESG category (E/S/G) and subcategory
    - UNGC violation flag and principles breached
    - Sustainalytics controversy level floor contribution
    - RepRisk RRI contribution estimate (novelty × reach × severity)
    - Financial materiality: revenue at risk range, litigation cost, regulatory fines
    - Brand damage multiplier

    severity: critical | high | medium | low
    remediation_status: none | acknowledged | partial | substantial | full | verified
    jurisdiction: ISO2 country code (affects jurisdiction risk multiplier)
    """
    return _engine.score_incident(req)


@router.post("/remediation-score", summary="Calculate remediation quality score (0-100)")
def remediation_score(req: RemediationScoreRequest):
    """
    Score the quality of an entity's remediation response to an ESG incident
    using 5 criteria (0-20 each, total 0-100):

    1. Acknowledgement (0-20) — public admission, apology, board-level statement
    2. Compensation (0-20) — payment/restitution to affected parties
    3. Structural Change (0-20) — policy reform, governance restructuring
    4. Monitoring (0-20) — ongoing tracking and public progress reporting
    5. Third-party Verification (0-20) — independent audit of remediation

    Adequacy tiers:
    - 80-100: Fully adequate
    - 60-79:  Substantially adequate
    - 40-59:  Partially adequate
    - 20-39:  Insufficient
    - 0-19:   None

    Returns Sustainalytics controversy level deduction (0-2 levels).
    """
    return _engine.remediation_score(req)


@router.post("/portfolio-exposure", summary="Portfolio-level controversy exposure (SFDR PAI 10-11-14)")
def portfolio_exposure(req: PortfolioControveryRequest):
    """
    Assess portfolio-level ESG controversy exposure for SFDR RTS 2022/1288
    Principal Adverse Impact (PAI) Indicator reporting:

    - PAI 10: UNGC/OECD violations — % of portfolio by market value
    - PAI 11: Lack of UNGC compliance mechanisms
    - PAI 14: Controversial weapons exposure — % of portfolio by market value

    Also returns:
    - Portfolio-weighted Sustainalytics controversy level
    - Portfolio-weighted RepRisk RRI
    - High-risk holdings (Level ≥3 or RRI ≥50)
    - Overall portfolio controversy tier

    Each holding requires: entity_name, market_value_usd, active_incidents list.
    Optional: controversy_level (pre-computed), rri_score, sector, ungc_compliant.
    """
    return _engine.portfolio_exposure(req)


@router.post("/controversy-trend", summary="Entity controversy trend (12-month trajectory)")
def controversy_trend(req: ControveryTrendRequest):
    """
    Derive the controversy trend for an entity based on incident history.

    incident_history items:
    - date: ISO date string (YYYY-MM-DD)
    - incident_type: incident type key
    - resolved: boolean

    Returns: trend (improving/stable/deteriorating), resolution rate,
    peak controversy period, 12-month incident count.
    """
    return _engine.controversy_trend(req)


# ---------------------------------------------------------------------------
# GET Reference Routes
# ---------------------------------------------------------------------------

@router.get("/ref/controversy-levels", summary="Sustainalytics 5-level controversy framework")
def ref_controversy_levels():
    """
    Return the Sustainalytics controversy level framework (1-5):

    - Level 1 — Low: No significant controversy
    - Level 2 — Moderate: Real but contained controversy
    - Level 3 — Significant: Systemic management deficiency
    - Level 4 — High: Severe impacts, major regulatory penalties
    - Level 5 — Catastrophic: Irreversible damage, business viability risk

    Each level includes: ESG risk rating impact, review cycle, upgrade/downgrade
    triggers, MSCI rating impact, investor action guidance, financial materiality.
    """
    return {
        "framework": "Sustainalytics ESG Risk Rating Controversy Assessment (2023)",
        "levels": SUSTAINALYTICS_CONTROVERSY_LEVELS,
        "msci_controversy_impact": MSCI_CONTROVERSY_IMPACT,
        "sfdr_pai_definitions": SFDR_PAI_CONTROVERSY,
        "industry_exposure_factors": INDUSTRY_EXPOSURE_FACTORS,
    }


@router.get("/ref/reprisk-methodology", summary="RepRisk RRI methodology")
def ref_reprisk_methodology():
    """
    Return RepRisk RRI (RepRisk Index) methodology:

    - RRI scale: 0-100 (0 = no risk, 100 = maximum risk exposure)
    - Peak RRI: highest RRI in past 2 years
    - RepRisk Rating: AAA (0-25) through CCC (86-100)
    - Scoring dimensions: Novelty × Reach × Severity
    - Source weights: NGO > regulatory > international media > national media > company
    - 28 ESG topics tracked
    - Country and sector sensitivity factors

    Used for: SFDR PAI 10 assessment, portfolio screening,
    controversy trend analysis, RepRisk Rating derivation.
    """
    return {
        "methodology": REPRISK_METHODOLOGY,
        "total_esg_topics": len(REPRISK_METHODOLOGY.get("esg_topics_tracked", [])),
        "note": "RRI scores shown are estimates derived from incident severity/sector. Live RRI requires RepRisk data feed.",
    }


@router.get("/ref/incident-types", summary="50 ESG incident types with financial materiality")
def ref_incident_types():
    """
    Return all 50 ESG incident types organized by E/S/G category:

    Environmental (E): oil_spill, deforestation, toxic_waste, air_pollution,
      water_contamination, climate_change_obstruction, biodiversity_loss,
      land_rights_violation, nuclear_incident, environmental_non_compliance,
      greenwashing, animal_welfare, illegal_mining, misuse_of_pesticides,
      pipeline_leak, climate_litigation

    Social (S): child_labor, forced_labor, health_safety_fatality,
      health_safety_incident, discrimination, community_opposition,
      human_rights_abuse, supply_chain_labor, indigenous_rights,
      data_privacy_breach, product_safety, freedom_of_association,
      community_health_impact, resettlement_failure, modern_slavery,
      wage_theft, conflict_minerals, discriminatory_lending,
      food_contamination, sexual_harassment, forced_displacement_war

    Governance (G): bribery, corruption, accounting_fraud, tax_evasion,
      executive_misconduct, board_failures, lobbying_misconduct,
      insider_trading, sanctions_violation, money_laundering,
      controversial_weapons, anti_competitive, shareholder_rights_violation,
      cybersecurity_failure, social_media_censorship, regulatory_non_disclosure,
      excessive_executive_pay

    Each type includes: UNGC violation flag, Sustainalytics level floor,
    financial materiality ranges, sector exposure, RepRisk severity.
    """
    by_category: dict[str, dict] = {"E": {}, "S": {}, "G": {}}
    for inc_key, inc_data in ESG_INCIDENT_TYPES.items():
        cat = inc_data.get("category", "G")
        if cat in by_category:
            by_category[cat][inc_key] = inc_data

    return {
        "total_incident_types": len(ESG_INCIDENT_TYPES),
        "by_category": by_category,
        "all_incidents": ESG_INCIDENT_TYPES,
        "ungc_violation_incidents": [
            k for k, v in ESG_INCIDENT_TYPES.items() if v.get("ungc_violation", False)
        ],
        "catastrophic_incidents": [
            k for k, v in ESG_INCIDENT_TYPES.items()
            if v.get("sustainalytics_level_floor", 1) == 5
        ],
    }


@router.get("/ref/ungc-violations", summary="UNGC violation triggers by incident type")
def ref_ungc_violations():
    """
    Return which incident types trigger UNGC (UN Global Compact) principle
    violations and which of the 10 UNGC principles each incident violates.

    UNGC 10 Principles:
    - P1-P2: Human Rights (protect and not be complicit)
    - P3-P6: Labor (freedom of association, forced labor, child labor, discrimination)
    - P7-P9: Environment (precautionary, responsibility, clean technology)
    - P10: Anti-Corruption (work against all forms of corruption)

    SFDR relevance:
    - PAI 10: UNGC violations → reportable metric (% portfolio by market value)
    - PAI 11: Lack of compliance mechanisms to monitor UNGC compliance
    """
    ungc_violations_by_incident = {}
    for inc_key, inc_data in ESG_INCIDENT_TYPES.items():
        if inc_data.get("ungc_violation", False):
            ungc_violations_by_incident[inc_key] = {
                "incident_description": inc_data.get("description", ""),
                "category": inc_data.get("category", ""),
                "ungc_principles_violated": inc_data.get("ungc_principles", []),
                "principle_details": [
                    UNGC_PRINCIPLES[p]
                    for p in inc_data.get("ungc_principles", [])
                    if p in UNGC_PRINCIPLES
                ],
                "sustainalytics_level_floor": inc_data.get("sustainalytics_level_floor", 1),
                "reprisk_severity": inc_data.get("reprisk_severity", "medium"),
            }

    # Group by principle
    by_principle: dict[int, list[str]] = {i: [] for i in range(1, 11)}
    for inc_key, inc_data in ESG_INCIDENT_TYPES.items():
        for p in inc_data.get("ungc_principles", []):
            if p in by_principle:
                by_principle[p].append(inc_key)

    return {
        "ungc_principles": UNGC_PRINCIPLES,
        "total_violation_incident_types": len(ungc_violations_by_incident),
        "violations_by_incident_type": ungc_violations_by_incident,
        "incident_types_by_principle": by_principle,
        "sfdr_pai_10_definition": SFDR_PAI_CONTROVERSY["PAI_10"],
        "sfdr_pai_11_definition": SFDR_PAI_CONTROVERSY["PAI_11"],
        "sfdr_pai_14_definition": SFDR_PAI_CONTROVERSY["PAI_14"],
        "oecd_guidelines_reference": "OECD Guidelines for Multinational Enterprises (2023 update) — aligned with UNGC on human rights, labour, environment, anti-corruption",
    }
