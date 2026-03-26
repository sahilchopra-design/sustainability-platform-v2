"""
E111 — ESG Controversy & Incident Tracking Engine
===================================================
Comprehensive controversy assessment, incident scoring, and portfolio
exposure analysis engine aligned with Sustainalytics, RepRisk, MSCI,
UNGC/OECD guidelines, and SFDR PAI indicators 10-11.

Sub-modules:
  1. Controversy Level Assessment — Sustainalytics 5-level framework
  2. RepRisk RRI Scoring — 0-100 index with novelty/reach/severity
  3. Incident Scoring — 50 incident types, E/S/G classification
  4. Remediation Quality Assessment — 5-criteria 0-100 scoring
  5. Portfolio Controversy Exposure — SFDR PAI 10-11, weighted exposure
  6. Controversy Trend Analysis — 12-month trajectory

References:
  - Sustainalytics ESG Risk Rating Methodology (2023 rev)
  - RepRisk Methodology: RRI and RepRisk Rating (2023)
  - UNGC Ten Principles (1999, rev 2004)
  - OECD Guidelines for Multinational Enterprises (2011, updated 2023)
  - SFDR RTS 2022/1288 — PAI Indicators 10 and 11
  - MSCI ESG Ratings Methodology (2023)
  - GRI 102-16/17 (Business Ethics and Compliance)
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Reference Data — Sustainalytics Controversy Levels
# ---------------------------------------------------------------------------

SUSTAINALYTICS_CONTROVERSY_LEVELS: dict[int, dict] = {
    1: {
        "level": 1,
        "label": "Low",
        "description": "No significant controversy; minor isolated incidents with negligible stakeholder impact",
        "esg_risk_rating_impact": 0,
        "review_cycle_months": 6,
        "upgrade_trigger": "Continued absence of incidents for 24 consecutive months",
        "downgrade_trigger": "Single moderate-severity incident with media/NGO coverage",
        "msci_impact": "No ESG rating adjustment",
        "investor_action": "Standard ESG monitoring",
        "financial_materiality": "Negligible",
    },
    2: {
        "level": 2,
        "label": "Moderate",
        "description": "Controversy is real but contained; limited stakeholder impact; company response adequate",
        "esg_risk_rating_impact": 2,
        "review_cycle_months": 6,
        "upgrade_trigger": "Incident resolution + 18-month clean record",
        "downgrade_trigger": "Recurrence of similar incidents; inadequate management response",
        "msci_impact": "Up to 1 notch ESG rating reduction",
        "investor_action": "Engagement recommended; monitor management response",
        "financial_materiality": "Low (0-2% revenue at risk)",
    },
    3: {
        "level": 3,
        "label": "Significant",
        "description": "Significant controversy with measurable stakeholder impact; systemic management deficiency indicated",
        "esg_risk_rating_impact": 5,
        "review_cycle_months": 3,
        "upgrade_trigger": "Full remediation confirmed by third party + 12-month clean record",
        "downgrade_trigger": "Escalation to regulatory action; class action litigation; multiple incidents",
        "msci_impact": "1-2 notch ESG rating reduction; potential exclusion from ESG indices",
        "investor_action": "Formal engagement; escalation to board level; proxy voting consideration",
        "financial_materiality": "Moderate (2-5% revenue at risk)",
    },
    4: {
        "level": 4,
        "label": "High",
        "description": "Controversy with severe impacts; major regulatory penalties; significant reputational damage",
        "esg_risk_rating_impact": 10,
        "review_cycle_months": 1,
        "upgrade_trigger": "Multi-year clean record + demonstrable structural reform",
        "downgrade_trigger": "Criminal prosecution; fatalities; widespread environmental contamination",
        "msci_impact": "2-3 notch ESG rating reduction; exclusion from multiple ESG indices",
        "investor_action": "Exclusion consideration; mandatory escalation to investment committee; public statement",
        "financial_materiality": "High (5-15% revenue at risk)",
    },
    5: {
        "level": 5,
        "label": "Catastrophic",
        "description": "Catastrophic controversy with irreversible societal/environmental damage; fundamental business model challenge",
        "esg_risk_rating_impact": 20,
        "review_cycle_months": 1,
        "upgrade_trigger": "Near-impossible — requires structural transformation + multi-year evidence",
        "downgrade_trigger": "Not applicable (maximum level)",
        "msci_impact": "Maximum ESG rating downgrade; exclusion from all major ESG indices",
        "investor_action": "Immediate divestment consideration; public exclusion announcement; regulatory reporting",
        "financial_materiality": "Very High (>15% revenue at risk; potential business viability risk)",
    },
}

# ---------------------------------------------------------------------------
# Reference Data — RepRisk RRI Methodology
# ---------------------------------------------------------------------------

REPRISK_METHODOLOGY: dict[str, dict] = {
    "rri_definition": {
        "name": "RepRisk Index (RRI)",
        "scale": "0-100",
        "description": "Quantified reputational risk exposure; 0 = no ESG risk exposure, 100 = maximum risk exposure",
        "peak_rri": "Highest RRI recorded in the past 2 years — indicates worst-case exposure",
        "current_rri": "RRI at current date — reflects recent controversy intensity",
        "trend": "Change from current to 2 years prior: Improving (↓), Stable (±2), Deteriorating (↑)",
    },
    "reprisk_rating": {
        "AAA": {"rri_range": [0, 25], "label": "No or low risk exposure"},
        "AA": {"rri_range": [26, 45], "label": "Low to medium risk exposure"},
        "A": {"rri_range": [46, 55], "label": "Medium risk exposure"},
        "BBB": {"rri_range": [56, 65], "label": "Medium to high risk exposure"},
        "BB": {"rri_range": [66, 75], "label": "High risk exposure"},
        "B": {"rri_range": [76, 85], "label": "Very high risk exposure"},
        "CCC": {"rri_range": [86, 100], "label": "Highest risk exposure"},
    },
    "scoring_dimensions": {
        "novelty": {
            "description": "First-time vs repeated incident (diminishing weighting for repeat stories)",
            "weight_first_occurrence": 1.0,
            "weight_repeat_14_days": 0.5,
            "weight_repeat_30_days": 0.25,
        },
        "reach": {
            "description": "Media reach and audience size of the information source",
            "international_media_multiplier": 1.5,
            "national_media_multiplier": 1.0,
            "regional_media_multiplier": 0.7,
            "local_media_multiplier": 0.4,
            "ngo_reports_multiplier": 1.3,
        },
        "severity": {
            "description": "Severity of the ESG issue reported",
            "critical": 3,
            "high": 2,
            "medium": 1,
        },
    },
    "source_weights": {
        "ngo_reports": 1.4,
        "international_media": 1.3,
        "national_media": 1.0,
        "government_regulatory": 1.2,
        "academic_research": 1.1,
        "company_disclosures": 0.8,
        "local_media": 0.7,
        "social_media": 0.6,
    },
    "sensitivity_factors": {
        "country_risk": "Higher weighting for incidents in high-governance-risk countries",
        "sector_exposure": "Structural sector exposure multiplier (e.g., mining ×1.3, financial services ×0.9)",
        "topic_sensitivity": "28 ESG topics tracked; some carry higher structural sensitivity (e.g., forced labor ×1.5)",
    },
    "esg_topics_tracked": [
        "Corruption and bribery", "Fraud and financial irregularities", "Money laundering",
        "Tax evasion / aggressive tax avoidance", "Anti-competitive practices",
        "Human rights concerns", "Child labor", "Forced labor",
        "Discrimination in employment", "Freedom of association",
        "Excessive executive compensation", "Board composition and independence",
        "Shareholder rights", "Transparency and disclosure",
        "Local pollution", "Climate change", "Biodiversity loss",
        "Deforestation / land conversion", "Water issues", "Waste management",
        "Animal welfare", "Environmental non-compliance",
        "Community relations", "Indigenous peoples rights",
        "Occupational health and safety", "Products and services controversies",
        "Data privacy and security", "Supply chain labor issues",
    ],
}

# ---------------------------------------------------------------------------
# Reference Data — 50 ESG Incident Types
# ---------------------------------------------------------------------------

ESG_INCIDENT_TYPES: dict[str, dict] = {
    # --- Environmental ---
    "oil_spill": {
        "category": "E",
        "subcategory": "Pollution",
        "description": "Oil spill or petroleum product release into water bodies or land",
        "ungc_violation": True,
        "ungc_principles": [7, 8],
        "sustainalytics_level_floor": 3,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [2.0, 20.0],
            "litigation_cost_range_usd": [10_000_000, 500_000_000],
            "regulatory_fine_range_usd": [1_000_000, 100_000_000],
            "brand_damage_multiplier": 1.5,
        },
        "sector_exposure": ["oil_gas", "shipping", "chemicals", "mining"],
        "reprisk_severity": "critical",
    },
    "deforestation": {
        "category": "E",
        "subcategory": "Biodiversity",
        "description": "Illegal or unsustainable deforestation linked to company operations or supply chain",
        "ungc_violation": True,
        "ungc_principles": [7, 8, 9],
        "sustainalytics_level_floor": 3,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [1.0, 10.0],
            "litigation_cost_range_usd": [500_000, 50_000_000],
            "regulatory_fine_range_usd": [100_000, 10_000_000],
            "brand_damage_multiplier": 1.4,
        },
        "sector_exposure": ["agriculture", "food_beverage", "paper_forest", "retail"],
        "reprisk_severity": "high",
    },
    "toxic_waste": {
        "category": "E",
        "subcategory": "Pollution",
        "description": "Illegal dumping, improper disposal, or accidental release of toxic/hazardous waste",
        "ungc_violation": True,
        "ungc_principles": [7, 8],
        "sustainalytics_level_floor": 3,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [1.5, 15.0],
            "litigation_cost_range_usd": [5_000_000, 200_000_000],
            "regulatory_fine_range_usd": [500_000, 50_000_000],
            "brand_damage_multiplier": 1.4,
        },
        "sector_exposure": ["chemicals", "mining", "manufacturing", "electronics"],
        "reprisk_severity": "critical",
    },
    "air_pollution": {
        "category": "E",
        "subcategory": "Pollution",
        "description": "Excessive air emissions (NOx, SOx, PM2.5, VOCs) exceeding regulatory limits",
        "ungc_violation": True,
        "ungc_principles": [7, 8],
        "sustainalytics_level_floor": 2,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [0.5, 8.0],
            "litigation_cost_range_usd": [1_000_000, 100_000_000],
            "regulatory_fine_range_usd": [100_000, 20_000_000],
            "brand_damage_multiplier": 1.2,
        },
        "sector_exposure": ["energy", "mining", "transport", "manufacturing"],
        "reprisk_severity": "high",
    },
    "water_contamination": {
        "category": "E",
        "subcategory": "Water",
        "description": "Contamination of water sources (rivers, groundwater, lakes) affecting communities or ecosystems",
        "ungc_violation": True,
        "ungc_principles": [7, 8],
        "sustainalytics_level_floor": 3,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [2.0, 15.0],
            "litigation_cost_range_usd": [5_000_000, 300_000_000],
            "regulatory_fine_range_usd": [1_000_000, 80_000_000],
            "brand_damage_multiplier": 1.5,
        },
        "sector_exposure": ["mining", "agriculture", "chemicals", "food_beverage"],
        "reprisk_severity": "critical",
    },
    "climate_change_obstruction": {
        "category": "E",
        "subcategory": "Climate",
        "description": "Active lobbying against climate action, misleading climate disclosures, or greenwashing",
        "ungc_violation": False,
        "ungc_principles": [],
        "sustainalytics_level_floor": 2,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [1.0, 10.0],
            "litigation_cost_range_usd": [1_000_000, 50_000_000],
            "regulatory_fine_range_usd": [100_000, 5_000_000],
            "brand_damage_multiplier": 1.3,
        },
        "sector_exposure": ["oil_gas", "coal", "automotive", "chemicals"],
        "reprisk_severity": "high",
    },
    "biodiversity_loss": {
        "category": "E",
        "subcategory": "Biodiversity",
        "description": "Destruction of critical habitats, protected areas, or significant species loss",
        "ungc_violation": True,
        "ungc_principles": [7, 8],
        "sustainalytics_level_floor": 3,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [1.0, 12.0],
            "litigation_cost_range_usd": [2_000_000, 100_000_000],
            "regulatory_fine_range_usd": [500_000, 20_000_000],
            "brand_damage_multiplier": 1.3,
        },
        "sector_exposure": ["mining", "agriculture", "infrastructure", "real_estate"],
        "reprisk_severity": "high",
    },
    "land_rights_violation": {
        "category": "E",
        "subcategory": "Land",
        "description": "Illegal land acquisition, failure to obtain FPIC, or forcible displacement of communities",
        "ungc_violation": True,
        "ungc_principles": [1, 2, 7],
        "sustainalytics_level_floor": 3,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [1.5, 15.0],
            "litigation_cost_range_usd": [5_000_000, 200_000_000],
            "regulatory_fine_range_usd": [1_000_000, 30_000_000],
            "brand_damage_multiplier": 1.4,
        },
        "sector_exposure": ["mining", "agriculture", "infrastructure", "real_estate"],
        "reprisk_severity": "critical",
    },
    "nuclear_incident": {
        "category": "E",
        "subcategory": "Pollution",
        "description": "Nuclear accident, radioactive leak, or failure of nuclear safety systems",
        "ungc_violation": True,
        "ungc_principles": [7, 8],
        "sustainalytics_level_floor": 5,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [10.0, 100.0],
            "litigation_cost_range_usd": [100_000_000, 50_000_000_000],
            "regulatory_fine_range_usd": [10_000_000, 1_000_000_000],
            "brand_damage_multiplier": 3.0,
        },
        "sector_exposure": ["nuclear_power", "utilities"],
        "reprisk_severity": "critical",
    },
    "environmental_non_compliance": {
        "category": "E",
        "subcategory": "Regulatory",
        "description": "Breach of environmental permits, licenses, or regulatory environmental standards",
        "ungc_violation": True,
        "ungc_principles": [7, 8, 9],
        "sustainalytics_level_floor": 2,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [0.5, 6.0],
            "litigation_cost_range_usd": [500_000, 50_000_000],
            "regulatory_fine_range_usd": [100_000, 10_000_000],
            "brand_damage_multiplier": 1.2,
        },
        "sector_exposure": ["manufacturing", "energy", "mining", "chemicals"],
        "reprisk_severity": "medium",
    },
    # --- Social ---
    "child_labor": {
        "category": "S",
        "subcategory": "Labor Rights",
        "description": "Use of child labor (under ILO C138/C182 minimum age) in operations or supply chain",
        "ungc_violation": True,
        "ungc_principles": [1, 2, 5],
        "sustainalytics_level_floor": 4,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [3.0, 20.0],
            "litigation_cost_range_usd": [5_000_000, 200_000_000],
            "regulatory_fine_range_usd": [1_000_000, 50_000_000],
            "brand_damage_multiplier": 2.0,
        },
        "sector_exposure": ["garments", "agriculture", "electronics", "cocoa_coffee"],
        "reprisk_severity": "critical",
    },
    "forced_labor": {
        "category": "S",
        "subcategory": "Labor Rights",
        "description": "Forced, compulsory, or bonded labor in operations or supply chain (ILO C29/C105)",
        "ungc_violation": True,
        "ungc_principles": [1, 2, 4],
        "sustainalytics_level_floor": 4,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [3.0, 25.0],
            "litigation_cost_range_usd": [10_000_000, 500_000_000],
            "regulatory_fine_range_usd": [2_000_000, 100_000_000],
            "brand_damage_multiplier": 2.5,
        },
        "sector_exposure": ["garments", "electronics", "agriculture", "fishing"],
        "reprisk_severity": "critical",
    },
    "health_safety_fatality": {
        "category": "S",
        "subcategory": "OHS",
        "description": "Worker fatality or serious injury due to inadequate occupational health and safety systems",
        "ungc_violation": True,
        "ungc_principles": [1, 2],
        "sustainalytics_level_floor": 4,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [1.0, 10.0],
            "litigation_cost_range_usd": [2_000_000, 100_000_000],
            "regulatory_fine_range_usd": [500_000, 20_000_000],
            "brand_damage_multiplier": 1.8,
        },
        "sector_exposure": ["mining", "construction", "oil_gas", "manufacturing"],
        "reprisk_severity": "critical",
    },
    "health_safety_incident": {
        "category": "S",
        "subcategory": "OHS",
        "description": "Serious workplace injury, illness outbreak, or systemic OHS non-compliance",
        "ungc_violation": True,
        "ungc_principles": [1, 2],
        "sustainalytics_level_floor": 2,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [0.5, 5.0],
            "litigation_cost_range_usd": [500_000, 30_000_000],
            "regulatory_fine_range_usd": [100_000, 5_000_000],
            "brand_damage_multiplier": 1.3,
        },
        "sector_exposure": ["manufacturing", "logistics", "construction", "healthcare"],
        "reprisk_severity": "high",
    },
    "discrimination": {
        "category": "S",
        "subcategory": "Labor Rights",
        "description": "Systemic workplace discrimination (gender, race, religion, disability) or pay gap violations",
        "ungc_violation": True,
        "ungc_principles": [1, 2, 6],
        "sustainalytics_level_floor": 2,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [0.5, 5.0],
            "litigation_cost_range_usd": [500_000, 50_000_000],
            "regulatory_fine_range_usd": [100_000, 5_000_000],
            "brand_damage_multiplier": 1.3,
        },
        "sector_exposure": ["financial_services", "technology", "retail", "pharma"],
        "reprisk_severity": "high",
    },
    "community_opposition": {
        "category": "S",
        "subcategory": "Community",
        "description": "Significant community opposition, protests, or blockades to company operations",
        "ungc_violation": False,
        "ungc_principles": [],
        "sustainalytics_level_floor": 2,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [1.0, 10.0],
            "litigation_cost_range_usd": [1_000_000, 50_000_000],
            "regulatory_fine_range_usd": [0, 5_000_000],
            "brand_damage_multiplier": 1.2,
        },
        "sector_exposure": ["mining", "oil_gas", "infrastructure", "agriculture"],
        "reprisk_severity": "high",
    },
    "human_rights_abuse": {
        "category": "S",
        "subcategory": "Human Rights",
        "description": "Direct or facilitated human rights violations in operations or supply chain (UNGP)",
        "ungc_violation": True,
        "ungc_principles": [1, 2],
        "sustainalytics_level_floor": 4,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [2.0, 20.0],
            "litigation_cost_range_usd": [5_000_000, 500_000_000],
            "regulatory_fine_range_usd": [500_000, 50_000_000],
            "brand_damage_multiplier": 2.0,
        },
        "sector_exposure": ["oil_gas", "mining", "defense", "technology"],
        "reprisk_severity": "critical",
    },
    "supply_chain_labor": {
        "category": "S",
        "subcategory": "Supply Chain",
        "description": "Labor violations in supply chain (wages, hours, conditions) not directly remediated",
        "ungc_violation": True,
        "ungc_principles": [2, 3, 4, 5],
        "sustainalytics_level_floor": 2,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [1.0, 8.0],
            "litigation_cost_range_usd": [1_000_000, 80_000_000],
            "regulatory_fine_range_usd": [200_000, 10_000_000],
            "brand_damage_multiplier": 1.4,
        },
        "sector_exposure": ["garments", "electronics", "retail", "food_beverage"],
        "reprisk_severity": "high",
    },
    "indigenous_rights": {
        "category": "S",
        "subcategory": "Indigenous Peoples",
        "description": "Violation of indigenous peoples' rights, FPIC failure, sacred site destruction",
        "ungc_violation": True,
        "ungc_principles": [1, 2],
        "sustainalytics_level_floor": 4,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [2.0, 18.0],
            "litigation_cost_range_usd": [5_000_000, 200_000_000],
            "regulatory_fine_range_usd": [500_000, 20_000_000],
            "brand_damage_multiplier": 1.8,
        },
        "sector_exposure": ["mining", "oil_gas", "infrastructure", "agriculture"],
        "reprisk_severity": "critical",
    },
    "data_privacy_breach": {
        "category": "S",
        "subcategory": "Data Privacy",
        "description": "Major data breach or misuse of personal data (GDPR or equivalent violation)",
        "ungc_violation": False,
        "ungc_principles": [],
        "sustainalytics_level_floor": 2,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [1.0, 10.0],
            "litigation_cost_range_usd": [5_000_000, 500_000_000],
            "regulatory_fine_range_usd": [1_000_000, 4_000_000_000],
            "brand_damage_multiplier": 1.5,
        },
        "sector_exposure": ["technology", "financial_services", "telecom", "healthcare"],
        "reprisk_severity": "critical",
    },
    "product_safety": {
        "category": "S",
        "subcategory": "Product Liability",
        "description": "Product defect causing consumer harm, safety recall, or liability claims",
        "ungc_violation": False,
        "ungc_principles": [],
        "sustainalytics_level_floor": 2,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [1.0, 15.0],
            "litigation_cost_range_usd": [5_000_000, 50_000_000_000],
            "regulatory_fine_range_usd": [1_000_000, 1_000_000_000],
            "brand_damage_multiplier": 1.8,
        },
        "sector_exposure": ["pharma", "automotive", "food_beverage", "consumer_goods"],
        "reprisk_severity": "critical",
    },
    "freedom_of_association": {
        "category": "S",
        "subcategory": "Labor Rights",
        "description": "Suppression of workers' rights to organize, unionize, or engage in collective bargaining (ILO C87/C98)",
        "ungc_violation": True,
        "ungc_principles": [3],
        "sustainalytics_level_floor": 2,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [0.5, 5.0],
            "litigation_cost_range_usd": [500_000, 30_000_000],
            "regulatory_fine_range_usd": [100_000, 5_000_000],
            "brand_damage_multiplier": 1.2,
        },
        "sector_exposure": ["manufacturing", "logistics", "retail", "food_beverage"],
        "reprisk_severity": "medium",
    },
    "community_health_impact": {
        "category": "S",
        "subcategory": "Community",
        "description": "Operations causing measurable community health impacts (disease, contamination, accidents)",
        "ungc_violation": True,
        "ungc_principles": [1, 7, 8],
        "sustainalytics_level_floor": 3,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [2.0, 15.0],
            "litigation_cost_range_usd": [5_000_000, 200_000_000],
            "regulatory_fine_range_usd": [1_000_000, 30_000_000],
            "brand_damage_multiplier": 1.6,
        },
        "sector_exposure": ["mining", "oil_gas", "chemicals", "agriculture"],
        "reprisk_severity": "high",
    },
    "resettlement_failure": {
        "category": "S",
        "subcategory": "Community",
        "description": "Inadequate resettlement process, below replacement cost compensation, livelihood failure",
        "ungc_violation": True,
        "ungc_principles": [1, 2],
        "sustainalytics_level_floor": 3,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [1.5, 10.0],
            "litigation_cost_range_usd": [2_000_000, 100_000_000],
            "regulatory_fine_range_usd": [500_000, 20_000_000],
            "brand_damage_multiplier": 1.4,
        },
        "sector_exposure": ["mining", "infrastructure", "real_estate", "energy"],
        "reprisk_severity": "high",
    },
    "modern_slavery": {
        "category": "S",
        "subcategory": "Labor Rights",
        "description": "Evidence of modern slavery in operations or supply chain per Modern Slavery Act 2015/similar legislation",
        "ungc_violation": True,
        "ungc_principles": [1, 2, 4],
        "sustainalytics_level_floor": 4,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [3.0, 25.0],
            "litigation_cost_range_usd": [10_000_000, 500_000_000],
            "regulatory_fine_range_usd": [2_000_000, 100_000_000],
            "brand_damage_multiplier": 2.5,
        },
        "sector_exposure": ["garments", "agriculture", "fishing", "construction"],
        "reprisk_severity": "critical",
    },
    # --- Governance ---
    "bribery": {
        "category": "G",
        "subcategory": "Anti-Corruption",
        "description": "Payment or receipt of bribes to/from public officials or business partners (FCPA/UK Bribery Act/OECD Anti-Bribery Convention)",
        "ungc_violation": True,
        "ungc_principles": [10],
        "sustainalytics_level_floor": 4,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [3.0, 20.0],
            "litigation_cost_range_usd": [10_000_000, 1_000_000_000],
            "regulatory_fine_range_usd": [5_000_000, 4_000_000_000],
            "brand_damage_multiplier": 2.2,
        },
        "sector_exposure": ["oil_gas", "construction", "defense", "pharma", "financial_services"],
        "reprisk_severity": "critical",
    },
    "corruption": {
        "category": "G",
        "subcategory": "Anti-Corruption",
        "description": "Systemic corruption, embezzlement, or abuse of power in company governance",
        "ungc_violation": True,
        "ungc_principles": [10],
        "sustainalytics_level_floor": 4,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [3.0, 25.0],
            "litigation_cost_range_usd": [10_000_000, 2_000_000_000],
            "regulatory_fine_range_usd": [5_000_000, 5_000_000_000],
            "brand_damage_multiplier": 2.5,
        },
        "sector_exposure": ["all"],
        "reprisk_severity": "critical",
    },
    "accounting_fraud": {
        "category": "G",
        "subcategory": "Fraud",
        "description": "Accounting fraud, financial statement manipulation, or material misstatement (SOX, IFRS violations)",
        "ungc_violation": False,
        "ungc_principles": [],
        "sustainalytics_level_floor": 4,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [5.0, 50.0],
            "litigation_cost_range_usd": [20_000_000, 10_000_000_000],
            "regulatory_fine_range_usd": [10_000_000, 5_000_000_000],
            "brand_damage_multiplier": 3.0,
        },
        "sector_exposure": ["financial_services", "all"],
        "reprisk_severity": "critical",
    },
    "tax_evasion": {
        "category": "G",
        "subcategory": "Tax",
        "description": "Illegal tax evasion or aggressive tax avoidance crossing into abuse (OECD BEPS violation)",
        "ungc_violation": False,
        "ungc_principles": [],
        "sustainalytics_level_floor": 3,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [1.0, 10.0],
            "litigation_cost_range_usd": [5_000_000, 500_000_000],
            "regulatory_fine_range_usd": [2_000_000, 1_000_000_000],
            "brand_damage_multiplier": 1.6,
        },
        "sector_exposure": ["technology", "financial_services", "retail", "pharma"],
        "reprisk_severity": "high",
    },
    "executive_misconduct": {
        "category": "G",
        "subcategory": "Governance",
        "description": "CEO/C-suite misconduct (sexual harassment, financial fraud, abuse of position)",
        "ungc_violation": False,
        "ungc_principles": [],
        "sustainalytics_level_floor": 3,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [2.0, 15.0],
            "litigation_cost_range_usd": [5_000_000, 200_000_000],
            "regulatory_fine_range_usd": [500_000, 20_000_000],
            "brand_damage_multiplier": 1.8,
        },
        "sector_exposure": ["all"],
        "reprisk_severity": "high",
    },
    "board_failures": {
        "category": "G",
        "subcategory": "Governance",
        "description": "Board independence failures, conflicts of interest, inadequate oversight of material risks",
        "ungc_violation": False,
        "ungc_principles": [],
        "sustainalytics_level_floor": 2,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [0.5, 5.0],
            "litigation_cost_range_usd": [1_000_000, 50_000_000],
            "regulatory_fine_range_usd": [200_000, 5_000_000],
            "brand_damage_multiplier": 1.2,
        },
        "sector_exposure": ["financial_services", "all"],
        "reprisk_severity": "medium",
    },
    "lobbying_misconduct": {
        "category": "G",
        "subcategory": "Political",
        "description": "Undisclosed lobbying, regulatory capture, or political interference beyond legal bounds",
        "ungc_violation": False,
        "ungc_principles": [],
        "sustainalytics_level_floor": 2,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [0.5, 5.0],
            "litigation_cost_range_usd": [1_000_000, 30_000_000],
            "regulatory_fine_range_usd": [100_000, 5_000_000],
            "brand_damage_multiplier": 1.2,
        },
        "sector_exposure": ["oil_gas", "pharma", "financial_services", "tobacco"],
        "reprisk_severity": "medium",
    },
    "insider_trading": {
        "category": "G",
        "subcategory": "Securities",
        "description": "Trading on material non-public information; market manipulation",
        "ungc_violation": False,
        "ungc_principles": [],
        "sustainalytics_level_floor": 3,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [1.0, 10.0],
            "litigation_cost_range_usd": [5_000_000, 200_000_000],
            "regulatory_fine_range_usd": [1_000_000, 500_000_000],
            "brand_damage_multiplier": 1.7,
        },
        "sector_exposure": ["financial_services", "all"],
        "reprisk_severity": "high",
    },
    "sanctions_violation": {
        "category": "G",
        "subcategory": "Compliance",
        "description": "Breach of international sanctions (US OFAC, EU, UN) involving prohibited entities/transactions",
        "ungc_violation": False,
        "ungc_principles": [],
        "sustainalytics_level_floor": 4,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [5.0, 30.0],
            "litigation_cost_range_usd": [50_000_000, 10_000_000_000],
            "regulatory_fine_range_usd": [10_000_000, 9_000_000_000],
            "brand_damage_multiplier": 2.8,
        },
        "sector_exposure": ["financial_services", "oil_gas", "defense", "shipping"],
        "reprisk_severity": "critical",
    },
    "money_laundering": {
        "category": "G",
        "subcategory": "Anti-Corruption",
        "description": "AML compliance failures; facilitating proceeds of crime through financial systems (FATF violation)",
        "ungc_violation": True,
        "ungc_principles": [10],
        "sustainalytics_level_floor": 4,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [3.0, 25.0],
            "litigation_cost_range_usd": [20_000_000, 5_000_000_000],
            "regulatory_fine_range_usd": [5_000_000, 9_000_000_000],
            "brand_damage_multiplier": 2.5,
        },
        "sector_exposure": ["financial_services", "real_estate", "casinos"],
        "reprisk_severity": "critical",
    },
    "controversial_weapons": {
        "category": "G",
        "subcategory": "Weapons",
        "description": "Production, sale, or financing of controversial weapons (cluster munitions, anti-personnel mines, biological/chemical/nuclear weapons banned by treaty)",
        "ungc_violation": True,
        "ungc_principles": [1, 2],
        "sustainalytics_level_floor": 5,
        "sfdr_pai_indicator": "PAI 14",
        "financial_materiality": {
            "revenue_at_risk_pct_range": [0.0, 100.0],
            "litigation_cost_range_usd": [0, 10_000_000_000],
            "regulatory_fine_range_usd": [0, 1_000_000_000],
            "brand_damage_multiplier": 3.0,
        },
        "sector_exposure": ["defense", "industrial"],
        "reprisk_severity": "critical",
    },
    "anti_competitive": {
        "category": "G",
        "subcategory": "Competition",
        "description": "Cartel behavior, price fixing, bid rigging, or abuse of dominant market position (EU Art 101/102, Sherman Act)",
        "ungc_violation": False,
        "ungc_principles": [],
        "sustainalytics_level_floor": 3,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [2.0, 15.0],
            "litigation_cost_range_usd": [10_000_000, 2_000_000_000],
            "regulatory_fine_range_usd": [5_000_000, 5_000_000_000],
            "brand_damage_multiplier": 1.6,
        },
        "sector_exposure": ["technology", "pharma", "automotive", "financial_services"],
        "reprisk_severity": "high",
    },
    "shareholder_rights_violation": {
        "category": "G",
        "subcategory": "Governance",
        "description": "Disenfranchisement of minority shareholders, dual-class share abuse, related-party transactions",
        "ungc_violation": False,
        "ungc_principles": [],
        "sustainalytics_level_floor": 2,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [0.5, 5.0],
            "litigation_cost_range_usd": [2_000_000, 100_000_000],
            "regulatory_fine_range_usd": [500_000, 10_000_000],
            "brand_damage_multiplier": 1.3,
        },
        "sector_exposure": ["all"],
        "reprisk_severity": "medium",
    },
    "cybersecurity_failure": {
        "category": "G",
        "subcategory": "Technology Risk",
        "description": "Material cybersecurity breach, ransomware attack, or critical infrastructure compromise",
        "ungc_violation": False,
        "ungc_principles": [],
        "sustainalytics_level_floor": 3,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [2.0, 15.0],
            "litigation_cost_range_usd": [5_000_000, 1_000_000_000],
            "regulatory_fine_range_usd": [1_000_000, 500_000_000],
            "brand_damage_multiplier": 1.7,
        },
        "sector_exposure": ["technology", "financial_services", "telecom", "healthcare"],
        "reprisk_severity": "high",
    },
    # Additional 15 to reach 50 total
    "greenwashing": {
        "category": "E",
        "subcategory": "Disclosure",
        "description": "Misleading environmental claims, false green certifications, or deceptive sustainability marketing",
        "ungc_violation": False,
        "ungc_principles": [],
        "sustainalytics_level_floor": 2,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [1.0, 8.0],
            "litigation_cost_range_usd": [1_000_000, 100_000_000],
            "regulatory_fine_range_usd": [200_000, 10_000_000],
            "brand_damage_multiplier": 1.5,
        },
        "sector_exposure": ["financial_services", "food_beverage", "fashion", "energy"],
        "reprisk_severity": "high",
    },
    "social_media_censorship": {
        "category": "G",
        "subcategory": "Governance",
        "description": "Suppression of legitimate speech, censorship at government request, or abuse of content moderation",
        "ungc_violation": True,
        "ungc_principles": [1, 2],
        "sustainalytics_level_floor": 2,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [0.5, 5.0],
            "litigation_cost_range_usd": [1_000_000, 50_000_000],
            "regulatory_fine_range_usd": [100_000, 5_000_000],
            "brand_damage_multiplier": 1.3,
        },
        "sector_exposure": ["technology", "telecom", "media"],
        "reprisk_severity": "medium",
    },
    "animal_welfare": {
        "category": "E",
        "subcategory": "Biodiversity",
        "description": "Inhumane treatment of animals in farming, testing, or product supply chains",
        "ungc_violation": False,
        "ungc_principles": [],
        "sustainalytics_level_floor": 2,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [0.5, 5.0],
            "litigation_cost_range_usd": [500_000, 30_000_000],
            "regulatory_fine_range_usd": [100_000, 5_000_000],
            "brand_damage_multiplier": 1.3,
        },
        "sector_exposure": ["food_beverage", "pharma", "cosmetics", "fashion"],
        "reprisk_severity": "medium",
    },
    "wage_theft": {
        "category": "S",
        "subcategory": "Labor Rights",
        "description": "Systematic underpayment of wages, unpaid overtime, illegal deductions from workers' pay",
        "ungc_violation": True,
        "ungc_principles": [1, 2, 5],
        "sustainalytics_level_floor": 3,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [0.5, 5.0],
            "litigation_cost_range_usd": [1_000_000, 50_000_000],
            "regulatory_fine_range_usd": [200_000, 10_000_000],
            "brand_damage_multiplier": 1.3,
        },
        "sector_exposure": ["retail", "food_beverage", "hospitality", "logistics"],
        "reprisk_severity": "high",
    },
    "illegal_mining": {
        "category": "E",
        "subcategory": "Regulatory",
        "description": "Illegal artisanal/industrial mining, or operations in prohibited areas without permits",
        "ungc_violation": True,
        "ungc_principles": [7, 8],
        "sustainalytics_level_floor": 3,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [2.0, 20.0],
            "litigation_cost_range_usd": [5_000_000, 200_000_000],
            "regulatory_fine_range_usd": [1_000_000, 50_000_000],
            "brand_damage_multiplier": 1.5,
        },
        "sector_exposure": ["mining", "metals", "gems"],
        "reprisk_severity": "critical",
    },
    "conflict_minerals": {
        "category": "S",
        "subcategory": "Supply Chain",
        "description": "Use of conflict minerals (3TG: tin, tungsten, tantalum, gold) from conflict-affected areas without adequate OECD DD",
        "ungc_violation": True,
        "ungc_principles": [1, 2],
        "sustainalytics_level_floor": 3,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [1.0, 10.0],
            "litigation_cost_range_usd": [2_000_000, 100_000_000],
            "regulatory_fine_range_usd": [500_000, 20_000_000],
            "brand_damage_multiplier": 1.4,
        },
        "sector_exposure": ["electronics", "automotive", "aerospace", "jewelry"],
        "reprisk_severity": "high",
    },
    "discriminatory_lending": {
        "category": "S",
        "subcategory": "Financial Conduct",
        "description": "Discriminatory lending practices (redlining, predatory loans targeting minorities/vulnerable groups)",
        "ungc_violation": True,
        "ungc_principles": [1, 2, 6],
        "sustainalytics_level_floor": 3,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [1.0, 8.0],
            "litigation_cost_range_usd": [5_000_000, 200_000_000],
            "regulatory_fine_range_usd": [1_000_000, 50_000_000],
            "brand_damage_multiplier": 1.5,
        },
        "sector_exposure": ["financial_services", "real_estate"],
        "reprisk_severity": "high",
    },
    "misuse_of_pesticides": {
        "category": "E",
        "subcategory": "Pollution",
        "description": "Illegal use of banned pesticides, exceeding safe application limits, contaminating food supply",
        "ungc_violation": True,
        "ungc_principles": [7, 8],
        "sustainalytics_level_floor": 2,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [1.0, 10.0],
            "litigation_cost_range_usd": [2_000_000, 100_000_000],
            "regulatory_fine_range_usd": [500_000, 20_000_000],
            "brand_damage_multiplier": 1.4,
        },
        "sector_exposure": ["agriculture", "food_beverage", "chemicals"],
        "reprisk_severity": "high",
    },
    "excessive_executive_pay": {
        "category": "G",
        "subcategory": "Governance",
        "description": "Unjustified excessive executive compensation disconnected from company or ESG performance",
        "ungc_violation": False,
        "ungc_principles": [],
        "sustainalytics_level_floor": 1,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [0.0, 2.0],
            "litigation_cost_range_usd": [0, 10_000_000],
            "regulatory_fine_range_usd": [0, 1_000_000],
            "brand_damage_multiplier": 1.1,
        },
        "sector_exposure": ["financial_services", "all"],
        "reprisk_severity": "medium",
    },
    "forced_displacement_war": {
        "category": "S",
        "subcategory": "Human Rights",
        "description": "Company operations contributing to or benefiting from forced displacement in conflict zones",
        "ungc_violation": True,
        "ungc_principles": [1, 2],
        "sustainalytics_level_floor": 5,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [5.0, 50.0],
            "litigation_cost_range_usd": [10_000_000, 1_000_000_000],
            "regulatory_fine_range_usd": [5_000_000, 200_000_000],
            "brand_damage_multiplier": 3.0,
        },
        "sector_exposure": ["oil_gas", "mining", "defense", "financial_services"],
        "reprisk_severity": "critical",
    },
    "regulatory_non_disclosure": {
        "category": "G",
        "subcategory": "Transparency",
        "description": "Failure to disclose material information to regulators, shareholders, or the public as required",
        "ungc_violation": False,
        "ungc_principles": [],
        "sustainalytics_level_floor": 2,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [1.0, 10.0],
            "litigation_cost_range_usd": [5_000_000, 500_000_000],
            "regulatory_fine_range_usd": [1_000_000, 200_000_000],
            "brand_damage_multiplier": 1.5,
        },
        "sector_exposure": ["financial_services", "all"],
        "reprisk_severity": "high",
    },
    "pipeline_leak": {
        "category": "E",
        "subcategory": "Pollution",
        "description": "Oil/gas pipeline leak or rupture causing significant environmental contamination",
        "ungc_violation": True,
        "ungc_principles": [7, 8],
        "sustainalytics_level_floor": 3,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [2.0, 15.0],
            "litigation_cost_range_usd": [10_000_000, 500_000_000],
            "regulatory_fine_range_usd": [1_000_000, 100_000_000],
            "brand_damage_multiplier": 1.5,
        },
        "sector_exposure": ["oil_gas", "chemicals", "utilities"],
        "reprisk_severity": "critical",
    },
    "food_contamination": {
        "category": "S",
        "subcategory": "Product Liability",
        "description": "Food contamination incident affecting consumer safety (pathogens, adulterants, allergens)",
        "ungc_violation": False,
        "ungc_principles": [],
        "sustainalytics_level_floor": 3,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [3.0, 30.0],
            "litigation_cost_range_usd": [5_000_000, 500_000_000],
            "regulatory_fine_range_usd": [1_000_000, 100_000_000],
            "brand_damage_multiplier": 2.0,
        },
        "sector_exposure": ["food_beverage", "agriculture", "retail"],
        "reprisk_severity": "critical",
    },
    "climate_litigation": {
        "category": "E",
        "subcategory": "Climate",
        "description": "Climate change liability litigation — failure to align business with Paris targets or misrepresenting climate risks",
        "ungc_violation": False,
        "ungc_principles": [],
        "sustainalytics_level_floor": 3,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [2.0, 20.0],
            "litigation_cost_range_usd": [10_000_000, 5_000_000_000],
            "regulatory_fine_range_usd": [1_000_000, 500_000_000],
            "brand_damage_multiplier": 1.8,
        },
        "sector_exposure": ["oil_gas", "coal", "utilities", "financial_services"],
        "reprisk_severity": "high",
    },
    "sexual_harassment": {
        "category": "S",
        "subcategory": "Labor Rights",
        "description": "Systematic sexual harassment, assault, or gender-based violence in the workplace (#MeToo pattern)",
        "ungc_violation": True,
        "ungc_principles": [1, 2, 6],
        "sustainalytics_level_floor": 3,
        "financial_materiality": {
            "revenue_at_risk_pct_range": [1.0, 10.0],
            "litigation_cost_range_usd": [2_000_000, 200_000_000],
            "regulatory_fine_range_usd": [200_000, 10_000_000],
            "brand_damage_multiplier": 1.8,
        },
        "sector_exposure": ["all"],
        "reprisk_severity": "high",
    },
}

# ---------------------------------------------------------------------------
# Reference Data — UNGC Principles
# ---------------------------------------------------------------------------

UNGC_PRINCIPLES: dict[int, dict] = {
    1: {"principle": 1, "area": "Human Rights", "text": "Support and respect the protection of internationally proclaimed human rights"},
    2: {"principle": 2, "area": "Human Rights", "text": "Make sure they are not complicit in human rights abuses"},
    3: {"principle": 3, "area": "Labor", "text": "Uphold the freedom of association and the effective recognition of the right to collective bargaining"},
    4: {"principle": 4, "area": "Labor", "text": "Uphold the elimination of all forms of forced and compulsory labour"},
    5: {"principle": 5, "area": "Labor", "text": "Uphold the effective abolition of child labour"},
    6: {"principle": 6, "area": "Labor", "text": "Uphold the elimination of discrimination in respect of employment and occupation"},
    7: {"principle": 7, "area": "Environment", "text": "Support a precautionary approach to environmental challenges"},
    8: {"principle": 8, "area": "Environment", "text": "Undertake initiatives to promote greater environmental responsibility"},
    9: {"principle": 9, "area": "Environment", "text": "Encourage the development and diffusion of environmentally friendly technologies"},
    10: {"principle": 10, "area": "Anti-Corruption", "text": "Work against corruption in all its forms, including extortion and bribery"},
}

# ---------------------------------------------------------------------------
# Reference Data — Industry Exposure Factors
# ---------------------------------------------------------------------------

INDUSTRY_EXPOSURE_FACTORS: dict[str, dict] = {
    "mining": {"structural_controversy_exposure": "very_high", "rri_sector_multiplier": 1.3, "top_incident_types": ["health_safety_fatality", "water_contamination", "land_rights_violation", "indigenous_rights"]},
    "oil_gas": {"structural_controversy_exposure": "very_high", "rri_sector_multiplier": 1.3, "top_incident_types": ["oil_spill", "pipeline_leak", "climate_change_obstruction", "climate_litigation"]},
    "garments": {"structural_controversy_exposure": "high", "rri_sector_multiplier": 1.2, "top_incident_types": ["forced_labor", "child_labor", "supply_chain_labor", "modern_slavery"]},
    "electronics": {"structural_controversy_exposure": "high", "rri_sector_multiplier": 1.2, "top_incident_types": ["forced_labor", "conflict_minerals", "data_privacy_breach", "supply_chain_labor"]},
    "food_beverage": {"structural_controversy_exposure": "medium_high", "rri_sector_multiplier": 1.1, "top_incident_types": ["deforestation", "food_contamination", "misuse_of_pesticides", "supply_chain_labor"]},
    "financial_services": {"structural_controversy_exposure": "medium_high", "rri_sector_multiplier": 1.0, "top_incident_types": ["money_laundering", "sanctions_violation", "discriminatory_lending", "accounting_fraud"]},
    "pharma": {"structural_controversy_exposure": "medium", "rri_sector_multiplier": 1.0, "top_incident_types": ["product_safety", "anti_competitive", "bribery", "animal_welfare"]},
    "defense": {"structural_controversy_exposure": "high", "rri_sector_multiplier": 1.2, "top_incident_types": ["controversial_weapons", "human_rights_abuse", "bribery", "sanctions_violation"]},
    "technology": {"structural_controversy_exposure": "medium", "rri_sector_multiplier": 0.9, "top_incident_types": ["data_privacy_breach", "cybersecurity_failure", "anti_competitive", "social_media_censorship"]},
    "agriculture": {"structural_controversy_exposure": "medium", "rri_sector_multiplier": 1.0, "top_incident_types": ["deforestation", "biodiversity_loss", "misuse_of_pesticides", "land_rights_violation"]},
}

# ---------------------------------------------------------------------------
# Reference Data — MSCI Controversy Score Impact
# ---------------------------------------------------------------------------

MSCI_CONTROVERSY_IMPACT: dict[str, dict] = {
    "no_controversy": {"sustainalytics_level": [1], "msci_adjustment": 0, "esg_rating_impact": "None"},
    "minor": {"sustainalytics_level": [2], "msci_adjustment": -1, "esg_rating_impact": "Up to 1 notch reduction (e.g., AAA→AA)"},
    "moderate": {"sustainalytics_level": [3], "msci_adjustment": -2, "esg_rating_impact": "1-2 notch reduction; potential ESG index exclusion"},
    "severe": {"sustainalytics_level": [4], "msci_adjustment": -3, "esg_rating_impact": "2-3 notch reduction; exclusion from MSCI ESG Leaders, MSCI SRI"},
    "very_severe": {"sustainalytics_level": [5], "msci_adjustment": -4, "esg_rating_impact": "Maximum downgrade; exclusion from all ESG indices"},
}

# ---------------------------------------------------------------------------
# Reference Data — SFDR PAI Indicator 10-11
# ---------------------------------------------------------------------------

SFDR_PAI_CONTROVERSY: dict[str, dict] = {
    "PAI_10": {
        "indicator_number": 10,
        "indicator_name": "Violations of UN Global Compact principles and Organisation for Economic Co-operation and Development (OECD) Guidelines for Multinational Enterprises",
        "metric": "Share of investments in investee companies that have been involved in violations of the UNGC principles or OECD Guidelines for Multinational Enterprises",
        "unit": "% of portfolio by market value",
        "threshold_for_violation": "Sustainalytics Level 4+ OR RepRisk RRI > 75 with UNGC-principle incident",
        "data_source": "Sustainalytics Global Standards Screening; RepRisk; ISS",
        "calculation": "Weighted market value of non-compliant holdings / Total portfolio market value × 100",
    },
    "PAI_11": {
        "indicator_number": 11,
        "indicator_name": "Lack of processes and compliance mechanisms to monitor compliance with UN Global Compact principles and OECD Guidelines",
        "metric": "Share of investments in investee companies lacking processes and compliance mechanisms to monitor compliance with UNGC/OECD Guidelines",
        "unit": "% of portfolio by market value",
        "threshold_for_violation": "No published UNGC commitment OR no supplier code of conduct AND no grievance mechanism",
        "data_source": "Company disclosures; Sustainalytics ESG Risk Ratings",
        "calculation": "Weighted market value of non-compliant holdings / Total portfolio market value × 100",
    },
    "PAI_14": {
        "indicator_number": 14,
        "indicator_name": "Exposure to controversial weapons (anti-personnel mines, cluster munitions, chemical weapons and biological weapons)",
        "metric": "Share of investments in companies involved in the manufacture or selling of controversial weapons",
        "unit": "% of portfolio by market value",
        "threshold_for_violation": "Any revenue from treaty-banned weapons (Ottawa Treaty, Oslo Convention, CWC, BWC)",
        "data_source": "MSCI Controversial Weapons; Sustainalytics Weapons Involvement Screen",
        "calculation": "Weighted market value of controversial weapons holdings / Total portfolio market value × 100",
    },
}

# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------

class ControversyAssessRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    entity_id: str = ""
    entity_name: str
    sector: str = ""
    active_incidents: list[str] = []
    incident_severities: dict[str, str] = {}
    financial_impact_usd: float = Field(0.0, ge=0)
    remediation_status: str = "none"


class IncidentScoreRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    incident_type: str
    severity: str = "medium"
    jurisdiction: str = ""
    financial_impact_usd: float = Field(0.0, ge=0)
    remediation_status: str = "none"


class RemediationScoreRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    acknowledgement: float = Field(0.0, ge=0, le=20)
    compensation: float = Field(0.0, ge=0, le=20)
    structural_change: float = Field(0.0, ge=0, le=20)
    monitoring: float = Field(0.0, ge=0, le=20)
    third_party_verification: float = Field(0.0, ge=0, le=20)
    entity_name: str = ""
    incident_type: str = ""


class PortfolioHolding(BaseModel):
    model_config = {"protected_namespaces": ()}

    entity_id: str = ""
    entity_name: str
    sector: str = ""
    market_value_usd: float = Field(..., ge=0)
    active_incidents: list[str] = []
    controversy_level: Optional[int] = None
    rri_score: Optional[float] = None
    ungc_compliant: bool = True


class PortfolioControveryRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    portfolio_id: str = ""
    portfolio_name: str = ""
    holdings: list[PortfolioHolding]


class ControveryTrendRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    entity_id: str
    entity_name: str = ""
    incident_history: list[dict] = []


# ---------------------------------------------------------------------------
# Scoring Helper Functions
# ---------------------------------------------------------------------------

_SEVERITY_MAP = {"critical": 3, "high": 2, "medium": 1, "low": 0}
_REPRISK_SEVERITY_TO_SCORE = {"critical": 20, "high": 13, "medium": 7, "low": 2}


def _compute_rri(incidents: list[str], sector: str, severity_override: dict | None = None) -> float:
    """Approximate RRI from incident types and sector multiplier."""
    if not incidents:
        return 0.0
    sector_mult = INDUSTRY_EXPOSURE_FACTORS.get(sector.lower(), {}).get("rri_sector_multiplier", 1.0)
    total = 0.0
    for inc in incidents:
        inc_data = ESG_INCIDENT_TYPES.get(inc, {})
        sev = (severity_override or {}).get(inc, inc_data.get("reprisk_severity", "medium"))
        base = _REPRISK_SEVERITY_TO_SCORE.get(sev, 7)
        # Source weight: default to national_media = 1.0
        total += base * REPRISK_METHODOLOGY["source_weights"]["national_media"]
    rri = min(round(total * sector_mult, 1), 100.0)
    return rri


def _rri_to_reprisk_rating(rri: float) -> str:
    for rating, data in REPRISK_METHODOLOGY["reprisk_rating"].items():
        low, high = data["rri_range"]
        if low <= rri <= high:
            return rating
    return "CCC"


def _compute_sustainalytics_level(incidents: list[str], rri: float) -> int:
    if not incidents:
        return 1
    floor_levels = [
        ESG_INCIDENT_TYPES.get(inc, {}).get("sustainalytics_level_floor", 1)
        for inc in incidents
    ]
    max_floor = max(floor_levels) if floor_levels else 1
    # Escalate by number of incidents
    n = len(incidents)
    if n >= 5 and max_floor < 4:
        max_floor = min(max_floor + 1, 5)
    # RRI-driven escalation
    if rri >= 75 and max_floor < 4:
        max_floor = 4
    elif rri >= 60 and max_floor < 3:
        max_floor = 3
    return max_floor


def _check_ungc_violations(incidents: list[str]) -> list[dict]:
    violations = []
    seen_principles: set[int] = set()
    for inc in incidents:
        inc_data = ESG_INCIDENT_TYPES.get(inc, {})
        if inc_data.get("ungc_violation", False):
            for p in inc_data.get("ungc_principles", []):
                if p not in seen_principles:
                    seen_principles.add(p)
                    violations.append({
                        "principle": p,
                        "incident": inc,
                        "principle_text": UNGC_PRINCIPLES[p]["text"],
                        "area": UNGC_PRINCIPLES[p]["area"],
                    })
    return violations


def _compute_revenue_at_risk(incidents: list[str], financial_impact_usd: float) -> float:
    if not incidents:
        return 0.0
    max_pct = max(
        ESG_INCIDENT_TYPES.get(inc, {}).get("financial_materiality", {}).get("revenue_at_risk_pct_range", [0, 1])[1]
        for inc in incidents
    )
    return round(max_pct, 1)


def _derive_overall_controversy_tier(level: int) -> str:
    mapping = {1: "minimal", 2: "low", 3: "moderate", 4: "high", 5: "severe"}
    return mapping.get(level, "moderate")


# ---------------------------------------------------------------------------
# Engine Functions
# ---------------------------------------------------------------------------

def assess_controversy(
    entity_id: str,
    entity_name: str,
    sector: str,
    active_incidents: list[str],
    incident_severities: dict | None = None,
    financial_impact_usd: float = 0.0,
    remediation_status: str = "none",
) -> dict:
    """
    Comprehensive controversy assessment for a single entity.

    Returns:
        Sustainalytics level 1-5, RepRisk RRI, RepRisk rating,
        media intensity, litigation risk, revenue at risk %,
        UNGC violations, remediation adequacy, overall controversy tier.
    """
    rri = _compute_rri(active_incidents, sector, incident_severities)
    reprisk_rating = _rri_to_reprisk_rating(rri)
    level = _compute_sustainalytics_level(active_incidents, rri)
    ungc_violations = _check_ungc_violations(active_incidents)
    revenue_at_risk = _compute_revenue_at_risk(active_incidents, financial_impact_usd)
    controversy_tier = _derive_overall_controversy_tier(level)

    # Categorise incidents
    e_incidents = [i for i in active_incidents if ESG_INCIDENT_TYPES.get(i, {}).get("category") == "E"]
    s_incidents = [i for i in active_incidents if ESG_INCIDENT_TYPES.get(i, {}).get("category") == "S"]
    g_incidents = [i for i in active_incidents if ESG_INCIDENT_TYPES.get(i, {}).get("category") == "G"]

    # Litigation risk estimate
    litigation_risk = "low"
    if any(ESG_INCIDENT_TYPES.get(i, {}).get("reprisk_severity") == "critical" for i in active_incidents):
        litigation_risk = "high"
    elif level >= 3:
        litigation_risk = "medium"

    # MSCI impact
    msci_impact = "No ESG rating adjustment"
    for tier_key, tier_data in MSCI_CONTROVERSY_IMPACT.items():
        if level in tier_data["sustainalytics_level"]:
            msci_impact = tier_data["esg_rating_impact"]
            break

    # Remediation score (simple heuristic)
    rem_score_heuristic = {
        "none": 0,
        "acknowledged": 20,
        "partial": 40,
        "substantial": 65,
        "full": 85,
        "verified": 100,
    }.get(remediation_status.lower(), 0)

    # Sustainalytics level details
    level_details = SUSTAINALYTICS_CONTROVERSY_LEVELS.get(level, {})

    # SFDR PAI flags
    sfdr_pai_10_flag = bool(ungc_violations) or level >= 4
    sfdr_pai_14_flag = "controversial_weapons" in active_incidents

    return {
        "entity_id": entity_id,
        "entity_name": entity_name,
        "sector": sector,
        "sustainalytics_controversy_level": level,
        "sustainalytics_level_label": level_details.get("label", ""),
        "sustainalytics_level_description": level_details.get("description", ""),
        "reprisk_rri": rri,
        "reprisk_rating": reprisk_rating,
        "rri_trend": "stable",
        "incident_count": len(active_incidents),
        "incidents_by_category": {"E": e_incidents, "S": s_incidents, "G": g_incidents},
        "ungc_violations": ungc_violations,
        "ungc_violation_count": len(ungc_violations),
        "revenue_at_risk_pct_max": revenue_at_risk,
        "litigation_risk": litigation_risk,
        "media_intensity": "high" if rri >= 60 else ("medium" if rri >= 30 else "low"),
        "remediation_heuristic_score": rem_score_heuristic,
        "remediation_adequate": rem_score_heuristic >= 65,
        "msci_esg_rating_impact": msci_impact,
        "overall_controversy_tier": controversy_tier,
        "sfdr_pai_10_violation_flag": sfdr_pai_10_flag,
        "sfdr_pai_14_controversial_weapons": sfdr_pai_14_flag,
        "investor_action_recommendation": level_details.get("investor_action", "Monitor"),
        "review_cycle_months": level_details.get("review_cycle_months", 6),
        "assessment_date": datetime.utcnow().isoformat() + "Z",
    }


def score_incident(
    incident_type: str,
    severity: str = "medium",
    jurisdiction: str = "",
    financial_impact_usd: float = 0.0,
    remediation_status: str = "none",
) -> dict:
    """
    Score a single ESG incident for controversy level contribution and financial materiality.

    Returns:
        ESG category, UNGC violation flag, financial materiality,
        RepRisk source weighting, controversy level contribution.
    """
    inc_data = ESG_INCIDENT_TYPES.get(incident_type, {})
    if not inc_data:
        return {
            "incident_type": incident_type,
            "found": False,
            "message": f"Incident type '{incident_type}' not found. Available: {list(ESG_INCIDENT_TYPES.keys())}",
        }

    sev_override_score = _REPRISK_SEVERITY_TO_SCORE.get(severity.lower(), 7)
    # Jurisdiction: high-risk country adds +20% weight
    jurisdiction_mult = 1.2 if jurisdiction.upper() in {"CN", "RU", "IN", "NG", "CO", "PH", "BD", "KH", "ET"} else 1.0
    rri_contribution = round(
        sev_override_score
        * REPRISK_METHODOLOGY["source_weights"]["national_media"]
        * jurisdiction_mult,
        2,
    )

    fm = inc_data.get("financial_materiality", {})
    rev_at_risk = fm.get("revenue_at_risk_pct_range", [0, 0])
    lit_range = fm.get("litigation_cost_range_usd", [0, 0])
    fine_range = fm.get("regulatory_fine_range_usd", [0, 0])

    return {
        "incident_type": incident_type,
        "found": True,
        "esg_category": inc_data.get("category", ""),
        "subcategory": inc_data.get("subcategory", ""),
        "description": inc_data.get("description", ""),
        "ungc_violation": inc_data.get("ungc_violation", False),
        "ungc_principles_violated": inc_data.get("ungc_principles", []),
        "sustainalytics_level_floor": inc_data.get("sustainalytics_level_floor", 1),
        "severity_input": severity,
        "reprisk_severity_default": inc_data.get("reprisk_severity", "medium"),
        "rri_contribution_estimate": rri_contribution,
        "financial_materiality": {
            "revenue_at_risk_pct_low": rev_at_risk[0],
            "revenue_at_risk_pct_high": rev_at_risk[1],
            "litigation_cost_low_usd": lit_range[0],
            "litigation_cost_high_usd": lit_range[1],
            "regulatory_fine_low_usd": fine_range[0],
            "regulatory_fine_high_usd": fine_range[1],
            "brand_damage_multiplier": fm.get("brand_damage_multiplier", 1.0),
        },
        "sector_exposure": inc_data.get("sector_exposure", []),
        "jurisdiction": jurisdiction,
        "jurisdiction_multiplier": jurisdiction_mult,
        "remediation_status": remediation_status,
        "sfdr_pai_indicator": inc_data.get("sfdr_pai_indicator", ""),
        "scoring_date": datetime.utcnow().isoformat() + "Z",
    }


def calculate_remediation_score(
    acknowledgement: float,
    compensation: float,
    structural_change: float,
    monitoring: float,
    third_party_verification: float,
    entity_name: str = "",
    incident_type: str = "",
) -> dict:
    """
    Score remediation quality on a 0-100 scale (5 criteria × 0-20 each).

    Criteria:
      1. Acknowledgement — public admission of fault, apology (0-20)
      2. Compensation — payment to affected parties (0-20)
      3. Structural Change — policy, process, or governance reforms (0-20)
      4. Monitoring — ongoing monitoring and progress reporting (0-20)
      5. Third-party Verification — independent audit of remediation (0-20)
    """
    total = acknowledgement + compensation + structural_change + monitoring + third_party_verification
    total = min(round(total, 1), 100.0)

    # Adequacy tiers
    if total >= 80:
        adequacy = "fully_adequate"
        adequacy_label = "Remediation fully adequate — investor engagement can be concluded"
    elif total >= 60:
        adequacy = "substantially_adequate"
        adequacy_label = "Remediation substantially adequate — continued monitoring recommended"
    elif total >= 40:
        adequacy = "partially_adequate"
        adequacy_label = "Remediation partially adequate — escalation recommended"
    elif total >= 20:
        adequacy = "insufficient"
        adequacy_label = "Remediation insufficient — formal engagement required"
    else:
        adequacy = "none"
        adequacy_label = "No meaningful remediation — maximum controversy contribution maintained"

    # Sustainalytics level adjustment from remediation
    sustainalytics_deduction = 0
    if total >= 80:
        sustainalytics_deduction = 2
    elif total >= 60:
        sustainalytics_deduction = 1

    return {
        "entity_name": entity_name,
        "incident_type": incident_type,
        "criteria_scores": {
            "acknowledgement": acknowledgement,
            "compensation": compensation,
            "structural_change": structural_change,
            "monitoring": monitoring,
            "third_party_verification": third_party_verification,
        },
        "total_remediation_score": total,
        "adequacy": adequacy,
        "adequacy_label": adequacy_label,
        "adequacy_flag": total >= 65,
        "sustainalytics_level_deduction": sustainalytics_deduction,
        "scoring_date": datetime.utcnow().isoformat() + "Z",
    }


def assess_portfolio_controversy_exposure(holdings: list[dict]) -> dict:
    """
    Assess portfolio-level controversy exposure for SFDR PAI 10-11.

    Returns:
        Portfolio-weighted controversy score, high-risk holdings,
        SFDR PAI 10 and PAI 11 values, PAI 14 (controversial weapons).
    """
    total_value = sum(h.get("market_value_usd", 0) for h in holdings)
    if total_value <= 0:
        return {"error": "Total portfolio market value must be > 0"}

    weighted_level = 0.0
    weighted_rri = 0.0
    high_risk_holdings = []
    sfdr_pai_10_value_usd = 0.0
    sfdr_pai_14_value_usd = 0.0
    ungc_non_compliant_count = 0

    for h in holdings:
        mv = h.get("market_value_usd", 0.0)
        weight = mv / total_value
        incidents = h.get("active_incidents", [])
        entity_level = h.get("controversy_level") or _compute_sustainalytics_level(
            incidents,
            h.get("rri_score") or _compute_rri(incidents, h.get("sector", "")),
        )
        entity_rri = h.get("rri_score") or _compute_rri(incidents, h.get("sector", ""))
        weighted_level += entity_level * weight
        weighted_rri += entity_rri * weight

        ungc_violations = _check_ungc_violations(incidents)
        has_ungc_violation = bool(ungc_violations) or entity_level >= 4
        if has_ungc_violation:
            sfdr_pai_10_value_usd += mv
            ungc_non_compliant_count += 1

        if "controversial_weapons" in incidents:
            sfdr_pai_14_value_usd += mv

        if entity_level >= 3 or entity_rri >= 50:
            high_risk_holdings.append({
                "entity_id": h.get("entity_id", ""),
                "entity_name": h.get("entity_name", ""),
                "market_value_usd": mv,
                "weight_pct": round(weight * 100, 2),
                "controversy_level": entity_level,
                "rri": entity_rri,
                "active_incidents": incidents,
                "ungc_violation": has_ungc_violation,
            })

    sfdr_pai_10_pct = round(sfdr_pai_10_value_usd / total_value * 100, 2)
    sfdr_pai_14_pct = round(sfdr_pai_14_value_usd / total_value * 100, 2)

    return {
        "portfolio_id": "",
        "total_holdings": len(holdings),
        "total_portfolio_value_usd": total_value,
        "portfolio_weighted_controversy_level": round(weighted_level, 2),
        "portfolio_weighted_rri": round(weighted_rri, 2),
        "high_risk_holdings_count": len(high_risk_holdings),
        "high_risk_holdings": sorted(high_risk_holdings, key=lambda x: x["controversy_level"], reverse=True),
        "sfdr_pai_10_pct": sfdr_pai_10_pct,
        "sfdr_pai_10_description": SFDR_PAI_CONTROVERSY["PAI_10"]["indicator_name"],
        "sfdr_pai_10_value_usd": sfdr_pai_10_value_usd,
        "sfdr_pai_14_pct": sfdr_pai_14_pct,
        "sfdr_pai_14_description": SFDR_PAI_CONTROVERSY["PAI_14"]["indicator_name"],
        "sfdr_pai_14_value_usd": sfdr_pai_14_value_usd,
        "ungc_non_compliant_holdings": ungc_non_compliant_count,
        "portfolio_controversy_tier": _derive_overall_controversy_tier(int(round(weighted_level))),
        "assessment_date": datetime.utcnow().isoformat() + "Z",
    }


def get_controversy_trend(entity_id: str, incident_history: list[dict]) -> dict:
    """
    Derive controversy trend from incident history (12-month trajectory).

    incident_history items: {date: ISO str, incident_type: str, resolved: bool}

    Returns:
        trend (improving/stable/deteriorating), 12-month trajectory,
        peak period, resolution rate.
    """
    if not incident_history:
        return {
            "entity_id": entity_id,
            "trend": "stable",
            "trajectory": "No incident history provided",
            "incident_count_12m": 0,
            "resolved_count": 0,
            "resolution_rate_pct": 100.0,
            "peak_period": None,
            "assessment_date": datetime.utcnow().isoformat() + "Z",
        }

    total = len(incident_history)
    resolved = sum(1 for i in incident_history if i.get("resolved", False))
    unresolved = total - resolved
    resolution_rate = round(resolved / total * 100, 1) if total else 100.0

    # Recent vs older split (first half vs second half as proxy for 6M/12M)
    mid = total // 2
    recent_unresolved = sum(1 for i in incident_history[mid:] if not i.get("resolved", False))
    older_unresolved = sum(1 for i in incident_history[:mid] if not i.get("resolved", False))

    if recent_unresolved < older_unresolved and resolution_rate >= 60:
        trend = "improving"
    elif recent_unresolved > older_unresolved:
        trend = "deteriorating"
    else:
        trend = "stable"

    # Approximate peak period
    critical_periods = [
        i.get("date", "")
        for i in incident_history
        if ESG_INCIDENT_TYPES.get(i.get("incident_type", ""), {}).get("reprisk_severity") == "critical"
    ]
    peak_period = critical_periods[0] if critical_periods else None

    return {
        "entity_id": entity_id,
        "trend": trend,
        "trajectory": f"{'Improving' if trend == 'improving' else 'Deteriorating' if trend == 'deteriorating' else 'Stable'} — {resolved}/{total} incidents resolved",
        "incident_count_12m": total,
        "resolved_count": resolved,
        "unresolved_count": unresolved,
        "resolution_rate_pct": resolution_rate,
        "recent_unresolved": recent_unresolved,
        "older_unresolved": older_unresolved,
        "peak_period": peak_period,
        "2yr_trend": "current_rri_direction_not_computable_without_timeseries",
        "assessment_date": datetime.utcnow().isoformat() + "Z",
    }


# ---------------------------------------------------------------------------
# Engine Class Wrapper
# ---------------------------------------------------------------------------

class ESGControversyEngine:
    """Facade wrapping all E111 engine functions."""

    def assess(self, req: ControversyAssessRequest) -> dict:
        return assess_controversy(
            req.entity_id, req.entity_name, req.sector,
            req.active_incidents, req.incident_severities,
            req.financial_impact_usd, req.remediation_status,
        )

    def score_incident(self, req: IncidentScoreRequest) -> dict:
        return score_incident(
            req.incident_type, req.severity, req.jurisdiction,
            req.financial_impact_usd, req.remediation_status,
        )

    def remediation_score(self, req: RemediationScoreRequest) -> dict:
        return calculate_remediation_score(
            req.acknowledgement, req.compensation, req.structural_change,
            req.monitoring, req.third_party_verification,
            req.entity_name, req.incident_type,
        )

    def portfolio_exposure(self, req: PortfolioControveryRequest) -> dict:
        holdings_dicts = [h.model_dump() for h in req.holdings]
        result = assess_portfolio_controversy_exposure(holdings_dicts)
        result["portfolio_id"] = req.portfolio_id
        result["portfolio_name"] = req.portfolio_name
        return result

    def controversy_trend(self, req: ControveryTrendRequest) -> dict:
        return get_controversy_trend(req.entity_id, req.incident_history)
