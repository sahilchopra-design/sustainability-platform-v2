"""
Sustainability-Linked Loan & Bond v2 Engine — E115
===================================================

Comprehensive engine covering:
- ICMA Sustainability-Linked Bond Principles 2023 (5 components)
- LMA/APLMA Sustainability-Linked Loan Principles 2023 (5 components)
- SPT Calibration Framework (5 criteria × 0-20 each)
- SBTi Sectoral Decarbonization Approach (SDA) trajectories (8 sectors)
- KPI Materiality Matrix (40 KPIs × 20 sectors)
- Margin Ratchet Mechanics (step-up / bidirectional / pure ratchet)
- Verification Agent Protocol (6 SPO providers + ISAE 3000)
- Greenwashing Red Flag Screening

References:
- ICMA Sustainability-Linked Bond Principles 2023 (June 2023)
- LMA/APLMA Sustainability-Linked Loan Principles 2023 (February 2023)
- Science Based Targets initiative — Sectoral Decarbonization Approach (SDA) Technical Summary
- ISAE 3000 (Revised) — Assurance Engagements other than Audits or Reviews
- ESMA Supervisory Brief on Greenwashing (May 2023)
- CBI Sustainable Bonds Market Summary 2023
"""
from __future__ import annotations

import math
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# ICMA SUSTAINABILITY-LINKED BOND PRINCIPLES 2023
# ---------------------------------------------------------------------------

ICMA_SLBP_COMPONENTS: dict[str, dict] = {
    "kpi_selection": {
        "component": 1,
        "name": "Selection of Key Performance Indicators (KPIs)",
        "principle": "KPIs should be material to the issuer's core sustainability and business strategy, "
                     "measurable or quantifiable on a consistent basis, externally verifiable, "
                     "able to be benchmarked (external reference or definition), and consistent "
                     "with the issuer's sustainability strategy.",
        "assessment_criteria": [
            "Materiality: KPI is core to issuer's business model and sustainability strategy",
            "Measurability: KPI can be quantified consistently over time",
            "Externally verifiable: Third-party verification feasible",
            "Benchmarkability: Industry benchmark or absolute reference exists",
            "Consistency: Methodology unchanged over bond lifetime",
        ],
        "scoring_rubric": {
            "0-20": "KPI not material; cannot be verified; no benchmark",
            "21-40": "Partially material; self-assessed; limited benchmark",
            "41-60": "Material; third-party verifiable; peer benchmark available",
            "61-80": "Core material; external verification committed; science-based benchmark",
            "81-100": "Highly material; SBTI or regulatory benchmark; real-time monitoring",
        },
        "max_score": 25,
        "icma_guidance": "ICMA SLBP 2023, Chapter 1 — KPI Selection",
    },
    "spt_calibration": {
        "component": 2,
        "name": "Calibration of Sustainability Performance Targets (SPTs)",
        "principle": "SPTs should represent a material improvement in the respective KPIs, "
                     "be set against a base year or base period, be consistent with the issuer's "
                     "overall sustainability/ESG strategy, and ideally be aligned with "
                     "a recognized science-based trajectory (e.g., SBTi SDA, Paris Agreement).",
        "assessment_criteria": [
            "Ambitious: Goes beyond Business-as-Usual (BAU) trajectory",
            "Credible: Achievable with material effort; internally resourced",
            "Predefined: Set at issuance; not adjustable post-issuance",
            "Science-aligned: Consistent with SBTi SDA or Paris Agreement trajectory",
            "Base year validated: Historical base year independently verified",
        ],
        "scoring_rubric": {
            "0-20": "SPT at or below BAU; no external reference",
            "21-40": "SPT slightly above BAU; no science-basis",
            "41-60": "SPT above BAU; benchmarked but not SBTi-aligned",
            "61-80": "SPT clearly ambitious; SBTi-consistent; predefined at issuance",
            "81-100": "SPT exceeds SDA trajectory; approved SBTi target; 3rd-party base year verification",
        },
        "max_score": 30,
        "icma_guidance": "ICMA SLBP 2023, Chapter 2 — SPT Calibration",
    },
    "bond_characteristics": {
        "component": 3,
        "name": "Bond Characteristics",
        "principle": "The bond's financial and/or structural characteristics vary depending on whether "
                     "the SPT(s) are met. The variation in financial characteristics should be meaningful "
                     "and significant (typically 5-25bps coupon step-up/step-down). The trigger event "
                     "and observation date must be clearly defined.",
        "assessment_criteria": [
            "Financial variation meaningful: Step-up/step-down >= 5bps",
            "Trigger event clearly defined: Specific SPT observation date and period",
            "Bilateral mechanism preferred over step-up only",
            "Cap on total adjustment: Maximum 50bps recommended",
            "Non-call on green-use misrepresentation: Investor protection clause",
        ],
        "scoring_rubric": {
            "0-20": "No financial variation or purely cosmetic (< 3bps)",
            "21-40": "Step-up only; 3-5bps; limited trigger clarity",
            "41-60": "Step-up 5-15bps; defined observation date; annual reporting",
            "61-80": "Step-up 15-25bps; bidirectional mechanism; robust trigger",
            "81-100": "Bidirectional; 20-25bps; investor ESG committee sign-off; early repayment option",
        },
        "max_score": 20,
        "icma_guidance": "ICMA SLBP 2023, Chapter 3 — Bond Characteristics",
    },
    "reporting": {
        "component": 4,
        "name": "Reporting",
        "principle": "Issuers should publish and maintain readily available and up-to-date information "
                     "on KPI performance, SPT progress, and any event that may affect SPT achievement. "
                     "Reporting should be annual (or more frequent).",
        "assessment_criteria": [
            "Annual KPI performance report published",
            "SPT progress disclosed including baseline",
            "Methodology and calculation basis disclosed",
            "Material events affecting SPT disclosed promptly",
            "Accessible via issuer website or regulatory platform",
        ],
        "scoring_rubric": {
            "0-20": "No dedicated reporting; only in annual report footnote",
            "21-40": "Annual KPI report; limited methodology disclosure",
            "41-60": "Annual report with full KPI + SPT progress; methodology disclosed",
            "61-80": "Semi-annual or quarterly reporting; ESAP/CDP filing; clear baseline",
            "81-100": "Real-time dashboard; ESAP + CDP; third-party assured; SFDR PAI mapped",
        },
        "max_score": 15,
        "icma_guidance": "ICMA SLBP 2023, Chapter 4 — Reporting",
    },
    "verification": {
        "component": 5,
        "name": "Verification",
        "principle": "Issuers should obtain independent and external verification by a qualified external "
                     "reviewer (e.g., auditor, environmental consultant, SPO provider) of the SPT level "
                     "against each SPT at least once a year. Verification should be to at least a limited "
                     "assurance standard (ISAE 3000).",
        "assessment_criteria": [
            "External verifier appointed (SPO provider or auditor)",
            "ISAE 3000 limited assurance minimum",
            "Annual SPT observation verified",
            "Verifier methodology and independence disclosed",
            "Second Party Opinion (SPO) obtained at issuance",
        ],
        "scoring_rubric": {
            "0-20": "No independent verification",
            "21-40": "Self-certification or internal audit only",
            "41-60": "SPO at issuance; no ongoing annual verification",
            "61-80": "SPO at issuance + annual third-party ISAE 3000 limited assurance",
            "81-100": "SPO at issuance + annual reasonable assurance (ISSA 5000 / ISAE 3410); "
                       "verifier on ICMA SPO register",
        },
        "max_score": 10,
        "icma_guidance": "ICMA SLBP 2023, Chapter 5 — Verification",
    },
}

# LMA/APLMA SLLP 2023 — same 5 component structure adapted for loan format
LMA_SLLP_COMPONENTS: dict[str, dict] = {
    "kpi_selection": {
        "component": 1,
        "name": "Relationship to Borrower's Overall Corporate Social Sustainability Strategy",
        "principle": "KPIs should be material to the borrower's core sustainability and business strategy. "
                     "Borrower should communicate its sustainability strategy before or concurrent with "
                     "any SLL transaction.",
        "loan_specific": "KPIs may be negotiated bilateral between borrower and lender(s); "
                         "less standardised than SLBs but must be material and measurable.",
        "max_score": 25,
        "lma_guidance": "LMA SLLP 2023, Principle 1",
    },
    "spt_calibration": {
        "component": 2,
        "name": "Target Setting — Calibrating SPTs",
        "principle": "SPTs should be ambitious — representing a material improvement on business-as-usual "
                     "trajectory, credible, predefined at loan signing, and ideally benchmarked "
                     "against external sustainability frameworks (SBTi, TCFD, UN SDGs).",
        "loan_specific": "SPTs may be set per tranche; ratchet applies to margin typically ±5-25bps "
                         "per KPI for syndicated loans; bilateral loans may use tighter ranges.",
        "max_score": 30,
        "lma_guidance": "LMA SLLP 2023, Principle 2",
    },
    "loan_characteristics": {
        "component": 3,
        "name": "Loan Characteristics",
        "principle": "The economic outcomes of the loan (margin, fees) should vary based on whether "
                     "SPTs are met. For SLLs, this is typically a margin adjustment rather than "
                     "structural bond features.",
        "loan_specific": "Margin ratchet is the primary mechanism; step-down on target achievement; "
                         "step-up on miss; bidirectional ratchets increasingly standard for ESG loans.",
        "max_score": 20,
        "lma_guidance": "LMA SLLP 2023, Principle 3",
    },
    "reporting": {
        "component": 4,
        "name": "Reporting",
        "principle": "Borrower should provide KPI performance information to lenders at least annually. "
                     "For syndicated SLLs, agent bank coordinates distribution. "
                     "Public disclosure recommended but not required.",
        "loan_specific": "Private bank reporting acceptable; public disclosure encouraged via "
                         "sustainability report or loan market disclosure.",
        "max_score": 15,
        "lma_guidance": "LMA SLLP 2023, Principle 4",
    },
    "verification": {
        "component": 5,
        "name": "Verification",
        "principle": "Borrower should obtain independent external verification of SPT performance. "
                     "For material KPIs, ISAE 3000 limited assurance or stronger recommended. "
                     "Verification frequency aligned with SPT observation date.",
        "loan_specific": "External auditor or ESG specialist acceptable; SPO not mandatory for loans "
                         "but increasingly expected by lenders and investors.",
        "max_score": 10,
        "lma_guidance": "LMA SLLP 2023, Principle 5",
    },
}

# ---------------------------------------------------------------------------
# SPT CALIBRATION FRAMEWORK (5 criteria × 0-20)
# ---------------------------------------------------------------------------

SPT_CRITERIA: dict[str, dict] = {
    "ambitious": {
        "name": "Ambitious",
        "description": "Goes beyond Business-as-Usual (BAU) trajectory; consistent with issuer's "
                       "long-term sustainability strategy",
        "max_score": 20,
        "scoring": {
            "0": "At or below BAU; effectively no improvement required",
            "5": "Marginal improvement (1-5% above BAU trajectory)",
            "10": "Moderate improvement (5-15% above BAU); some effort required",
            "15": "Significant improvement (15-30% above BAU); meaningful effort needed",
            "20": "Transformational improvement (>30% above BAU); consistent with 1.5°C pathway",
        },
    },
    "credible": {
        "name": "Credible",
        "description": "Achievable with material effort; supported by capex plan or operational changes; "
                       "internally resourced",
        "max_score": 20,
        "scoring": {
            "0": "No implementation plan; purely aspirational",
            "5": "High-level plan only; no committed capex",
            "10": "Detailed plan; some committed capex; technology available",
            "15": "Full implementation plan; board-approved capex; interim milestones",
            "20": "Detailed roadmap; committed capex; technology deployed; interim milestones verified",
        },
    },
    "measurable": {
        "name": "Measurable",
        "description": "Quantifiable, externally verifiable on a consistent basis; "
                       "methodology stable over bond/loan lifetime",
        "max_score": 20,
        "scoring": {
            "0": "Qualitative only; not quantifiable",
            "5": "Quantifiable but self-assessed; methodology not disclosed",
            "10": "Quantifiable; disclosed methodology; ISAE 3000 feasible",
            "15": "Quantifiable; published methodology; ISAE 3000 limited assurance",
            "20": "Quantifiable; ISO/IEC or GHG Protocol aligned; ISSA 5000 reasonable assurance",
        },
    },
    "predefined": {
        "name": "Predefined",
        "description": "SPTs set at issuance of bond or signing of loan; not adjustable post-issuance "
                       "except for pre-defined corporate events",
        "max_score": 20,
        "scoring": {
            "0": "SPTs not set at issuance; determined later",
            "5": "SPTs set post-issuance within 6 months",
            "10": "SPTs set at issuance; adjustment allowed without threshold",
            "15": "SPTs set at issuance; adjustment only for M&A/spin-off events",
            "20": "SPTs set at issuance; no adjustment permitted; waiver process disclosed",
        },
    },
    "relevant": {
        "name": "Relevant",
        "description": "Material to issuer's core business; addresses most significant sustainability "
                       "impact or dependency of the issuer",
        "max_score": 20,
        "scoring": {
            "0": "KPI not material to issuer's business; peripheral issue",
            "5": "Tangentially material; addresses minor sustainability aspect",
            "10": "Material to issuer but not primary sustainability impact",
            "15": "Highly material; in top 3 sustainability issues for sector",
            "20": "Core material; issuer's most significant sustainability impact; SASB aligned",
        },
    },
}

# ---------------------------------------------------------------------------
# SBTi SECTORAL DECARBONIZATION APPROACH (SDA) TRAJECTORIES
# ---------------------------------------------------------------------------

SDA_TRAJECTORIES: dict[str, dict] = {
    "power": {
        "sector": "Power Generation",
        "unit": "gCO2e/kWh",
        "baseline_2020": 450.0,
        "targets": {
            "2025": 340.0,
            "2030": 180.0,
            "2035": 80.0,
            "2040": 25.0,
            "2050": 5.0,
        },
        "required_reduction_by_2030_pct": 60.0,
        "required_reduction_by_2050_pct": 98.9,
        "sbti_sector": "Power",
        "methodology": "SBTi Power Sector Science-Based Target Setting Manual v1.0",
        "notes": "Aligned with IEA NZE 2050; grid decarbonisation trajectory",
    },
    "buildings": {
        "sector": "Buildings (Commercial & Residential)",
        "unit": "kgCO2e/m2/year",
        "baseline_2020": 35.0,
        "targets": {
            "2025": 28.0,
            "2030": 20.0,
            "2035": 12.0,
            "2040": 6.0,
            "2050": 0.0,
        },
        "required_reduction_by_2030_pct": 42.9,
        "required_reduction_by_2050_pct": 100.0,
        "sbti_sector": "Buildings",
        "methodology": "SBTi Buildings Science-Based Target Setting Guidance v1.0",
        "notes": "CRREM pathways for real estate; whole-life carbon",
    },
    "transport": {
        "sector": "Transport (Road, Rail, Aviation, Shipping)",
        "unit": "gCO2e/tonne-km",
        "baseline_2020": 85.0,
        "targets": {
            "2025": 72.0,
            "2030": 55.0,
            "2035": 38.0,
            "2040": 20.0,
            "2050": 3.0,
        },
        "required_reduction_by_2030_pct": 35.3,
        "required_reduction_by_2050_pct": 96.5,
        "sbti_sector": "Transport",
        "methodology": "SBTi Transport Science-Based Target Setting Guidance",
        "notes": "Mixed mode; aviation and shipping have separate sub-pathways",
    },
    "industry": {
        "sector": "Industry (Steel, Cement, Chemicals, Aluminium)",
        "unit": "tCO2e/tonne product",
        "baseline_2020": 1.85,
        "targets": {
            "2025": 1.62,
            "2030": 1.30,
            "2035": 0.95,
            "2040": 0.60,
            "2050": 0.10,
        },
        "required_reduction_by_2030_pct": 29.7,
        "required_reduction_by_2050_pct": 94.6,
        "sbti_sector": "Industry",
        "methodology": "SBTi Industry — Steel/Cement Sectoral Pathways",
        "notes": "Sector-specific sub-pathways for steel (DRI-EAF), cement (CCU), chemicals",
    },
    "agriculture": {
        "sector": "Agriculture (Crop and Livestock)",
        "unit": "tCO2e/tonne food product",
        "baseline_2020": 2.50,
        "targets": {
            "2025": 2.30,
            "2030": 2.00,
            "2035": 1.65,
            "2040": 1.25,
            "2050": 0.70,
        },
        "required_reduction_by_2030_pct": 20.0,
        "required_reduction_by_2050_pct": 72.0,
        "sbti_sector": "Agriculture",
        "methodology": "SBTi FLAG (Forest, Land and Agriculture) Guidance v1.0",
        "notes": "FLAG guidance covers AFOLU emissions; includes land-use change",
    },
    "afolu": {
        "sector": "AFOLU (Agriculture, Forestry, Other Land Use)",
        "unit": "MtCO2e net",
        "baseline_2020": 12000.0,
        "targets": {
            "2025": 10800.0,
            "2030": 8500.0,
            "2035": 5000.0,
            "2040": 2000.0,
            "2050": 0.0,
        },
        "required_reduction_by_2030_pct": 29.2,
        "required_reduction_by_2050_pct": 100.0,
        "sbti_sector": "FLAG",
        "methodology": "SBTi FLAG Guidance v1.0 — Science-Based Targets for Land",
        "notes": "Carbon sink restoration; deforestation elimination by 2030",
    },
    "waste": {
        "sector": "Waste Management",
        "unit": "kgCO2e/tonne waste",
        "baseline_2020": 340.0,
        "targets": {
            "2025": 290.0,
            "2030": 220.0,
            "2035": 150.0,
            "2040": 90.0,
            "2050": 20.0,
        },
        "required_reduction_by_2030_pct": 35.3,
        "required_reduction_by_2050_pct": 94.1,
        "sbti_sector": "Waste",
        "methodology": "SBTi Waste Sector Guidance (Draft)",
        "notes": "Methane from landfill primary driver; circular economy imperative",
    },
    "other": {
        "sector": "Other / Cross-Sector (Absolute Contraction)",
        "unit": "% absolute reduction from base year",
        "baseline_2020": 100.0,
        "targets": {
            "2025": 90.0,
            "2030": 72.5,
            "2035": 55.0,
            "2040": 37.5,
            "2050": 10.0,
        },
        "required_reduction_by_2030_pct": 27.5,
        "required_reduction_by_2050_pct": 90.0,
        "sbti_sector": "Cross-sector",
        "methodology": "SBTi Cross-Sector Pathway (Absolute Contraction Approach)",
        "notes": "Applicable where sector-specific pathway unavailable; 4.2% per year",
    },
}

# ---------------------------------------------------------------------------
# KPI MATERIALITY MATRIX (40 KPIs × 20 sectors)
# Materiality: 0=not material, 1=emerging, 2=material, 3=highly material
# ---------------------------------------------------------------------------

KPI_DEFINITIONS: dict[str, dict] = {
    "ghg_scope1_intensity": {"name": "GHG Scope 1 Emissions Intensity", "unit": "tCO2e/unit revenue or production"},
    "ghg_scope1_absolute": {"name": "GHG Scope 1 Absolute Emissions", "unit": "tCO2e"},
    "ghg_scope2_intensity": {"name": "GHG Scope 2 Emissions Intensity", "unit": "tCO2e/unit"},
    "ghg_scope3_upstream": {"name": "GHG Scope 3 Upstream Emissions", "unit": "tCO2e"},
    "ghg_scope3_downstream": {"name": "GHG Scope 3 Downstream Emissions", "unit": "tCO2e"},
    "renewable_energy_pct": {"name": "Renewable Energy Procurement (%)", "unit": "%"},
    "energy_intensity": {"name": "Energy Intensity", "unit": "MWh/unit"},
    "water_withdrawal_intensity": {"name": "Water Withdrawal Intensity", "unit": "m3/unit"},
    "water_recycled_pct": {"name": "Water Recycled / Reused (%)", "unit": "%"},
    "waste_to_landfill_pct": {"name": "Waste to Landfill (%)", "unit": "%"},
    "recycled_content_pct": {"name": "Recycled Content in Products (%)", "unit": "%"},
    "biodiversity_no_net_loss": {"name": "Biodiversity: No Net Loss Commitment", "unit": "binary/score"},
    "deforestation_free_pct": {"name": "Deforestation-Free Supply Chain (%)", "unit": "%"},
    "female_leadership_pct": {"name": "Women in Senior Positions (%)", "unit": "%"},
    "pay_gap_adjusted_pct": {"name": "Gender Pay Gap (adjusted) (%)", "unit": "%"},
    "lost_time_injury_rate": {"name": "Lost Time Injury Frequency Rate (LTIFR)", "unit": "per million hours"},
    "employee_training_hours": {"name": "Average Employee Training Hours", "unit": "hours/employee/year"},
    "living_wage_compliance_pct": {"name": "Suppliers Paying Living Wage (%)", "unit": "%"},
    "supplier_esg_audit_pct": {"name": "Suppliers Audited for ESG (%)", "unit": "%"},
    "human_rights_dd_score": {"name": "Human Rights Due Diligence Score", "unit": "0-100"},
    "board_independence_pct": {"name": "Board Independence (%)", "unit": "%"},
    "board_diversity_pct": {"name": "Board Gender Diversity (%)", "unit": "%"},
    "ceo_pay_ratio": {"name": "CEO Pay Ratio (median worker)", "unit": "x"},
    "anti_bribery_training_pct": {"name": "Anti-Bribery Training Completion (%)", "unit": "%"},
    "data_breach_count": {"name": "Material Data Breaches (count)", "unit": "count/year"},
    "tax_transparency_score": {"name": "Tax Transparency Score (GRI 207)", "unit": "0-100"},
    "green_revenue_pct": {"name": "Green / Sustainable Revenue (%)", "unit": "%"},
    "capex_green_pct": {"name": "Green CapEx as % of Total CapEx", "unit": "%"},
    "eu_taxonomy_alignment_pct": {"name": "EU Taxonomy-Aligned Revenue (%)", "unit": "%"},
    "sbti_approved_target": {"name": "SBTi Approved Science-Based Target", "unit": "binary"},
    "net_zero_commitment": {"name": "Net Zero Commitment with Interim Targets", "unit": "binary/year"},
    "carbon_price_internal": {"name": "Internal Carbon Price (USD/tCO2e)", "unit": "USD/tCO2e"},
    "methane_intensity": {"name": "Methane Emissions Intensity", "unit": "tCH4/unit"},
    "nox_sox_emissions": {"name": "NOx/SOx Emissions Intensity", "unit": "tNOx/unit"},
    "plastic_packaging_pct": {"name": "Recyclable Plastic Packaging (%)", "unit": "%"},
    "food_waste_reduction_pct": {"name": "Food Waste Reduction (%)", "unit": "%"},
    "sustainable_sourcing_pct": {"name": "Sustainably Certified Sourced Materials (%)", "unit": "%"},
    "worker_health_engagement_pct": {"name": "Worker Health & Wellbeing Programme Coverage (%)", "unit": "%"},
    "community_investment_usd": {"name": "Community Investment (USD/year)", "unit": "USD"},
    "tnfd_nature_risk_score": {"name": "TNFD Nature-Related Risk Score", "unit": "0-100"},
}

SECTORS_LIST = [
    "oil_gas", "utilities_power", "metals_mining", "chemicals",
    "automotive", "aviation", "shipping", "real_estate",
    "agriculture_food", "retail_apparel", "technology_telecom",
    "financial_services", "healthcare_pharma", "construction",
    "forest_paper", "consumer_goods", "logistics_transport",
    "waste_management", "water_utilities", "tourism_hospitality",
]

# Materiality matrix: KPI × sector → 0/1/2/3
KPI_MATERIALITY_MATRIX: dict[str, dict[str, int]] = {
    "ghg_scope1_intensity":      {"oil_gas": 3, "utilities_power": 3, "metals_mining": 3, "chemicals": 3, "automotive": 2, "aviation": 3, "shipping": 3, "real_estate": 2, "agriculture_food": 2, "retail_apparel": 1, "technology_telecom": 1, "financial_services": 1, "healthcare_pharma": 1, "construction": 2, "forest_paper": 2, "consumer_goods": 1, "logistics_transport": 3, "waste_management": 2, "water_utilities": 1, "tourism_hospitality": 1},
    "ghg_scope1_absolute":       {"oil_gas": 3, "utilities_power": 3, "metals_mining": 3, "chemicals": 3, "automotive": 2, "aviation": 3, "shipping": 3, "real_estate": 2, "agriculture_food": 2, "retail_apparel": 1, "technology_telecom": 1, "financial_services": 1, "healthcare_pharma": 1, "construction": 2, "forest_paper": 2, "consumer_goods": 1, "logistics_transport": 3, "waste_management": 2, "water_utilities": 1, "tourism_hospitality": 1},
    "ghg_scope2_intensity":      {"oil_gas": 2, "utilities_power": 2, "metals_mining": 3, "chemicals": 2, "automotive": 2, "aviation": 1, "shipping": 1, "real_estate": 3, "agriculture_food": 1, "retail_apparel": 2, "technology_telecom": 3, "financial_services": 2, "healthcare_pharma": 2, "construction": 2, "forest_paper": 2, "consumer_goods": 2, "logistics_transport": 2, "waste_management": 2, "water_utilities": 3, "tourism_hospitality": 2},
    "ghg_scope3_upstream":       {"oil_gas": 2, "utilities_power": 1, "metals_mining": 2, "chemicals": 2, "automotive": 3, "aviation": 2, "shipping": 2, "real_estate": 2, "agriculture_food": 3, "retail_apparel": 3, "technology_telecom": 2, "financial_services": 3, "healthcare_pharma": 2, "construction": 2, "forest_paper": 3, "consumer_goods": 3, "logistics_transport": 2, "waste_management": 1, "water_utilities": 1, "tourism_hospitality": 1},
    "renewable_energy_pct":      {"oil_gas": 2, "utilities_power": 3, "metals_mining": 3, "chemicals": 3, "automotive": 3, "aviation": 2, "shipping": 2, "real_estate": 3, "agriculture_food": 2, "retail_apparel": 2, "technology_telecom": 3, "financial_services": 2, "healthcare_pharma": 2, "construction": 2, "forest_paper": 3, "consumer_goods": 2, "logistics_transport": 2, "waste_management": 2, "water_utilities": 3, "tourism_hospitality": 2},
    "energy_intensity":          {"oil_gas": 3, "utilities_power": 3, "metals_mining": 3, "chemicals": 3, "automotive": 2, "aviation": 2, "shipping": 3, "real_estate": 3, "agriculture_food": 2, "retail_apparel": 1, "technology_telecom": 3, "financial_services": 1, "healthcare_pharma": 2, "construction": 2, "forest_paper": 3, "consumer_goods": 1, "logistics_transport": 3, "waste_management": 2, "water_utilities": 3, "tourism_hospitality": 2},
    "water_withdrawal_intensity": {"oil_gas": 3, "utilities_power": 3, "metals_mining": 3, "chemicals": 3, "automotive": 2, "aviation": 1, "shipping": 1, "real_estate": 2, "agriculture_food": 3, "retail_apparel": 3, "technology_telecom": 2, "financial_services": 1, "healthcare_pharma": 3, "construction": 2, "forest_paper": 3, "consumer_goods": 2, "logistics_transport": 1, "waste_management": 2, "water_utilities": 3, "tourism_hospitality": 2},
    "deforestation_free_pct":    {"oil_gas": 1, "utilities_power": 1, "metals_mining": 1, "chemicals": 1, "automotive": 1, "aviation": 1, "shipping": 1, "real_estate": 1, "agriculture_food": 3, "retail_apparel": 2, "technology_telecom": 1, "financial_services": 2, "healthcare_pharma": 1, "construction": 2, "forest_paper": 3, "consumer_goods": 3, "logistics_transport": 1, "waste_management": 1, "water_utilities": 1, "tourism_hospitality": 1},
    "female_leadership_pct":     {"oil_gas": 2, "utilities_power": 2, "metals_mining": 2, "chemicals": 2, "automotive": 2, "aviation": 2, "shipping": 1, "real_estate": 2, "agriculture_food": 2, "retail_apparel": 2, "technology_telecom": 3, "financial_services": 3, "healthcare_pharma": 2, "construction": 2, "forest_paper": 1, "consumer_goods": 2, "logistics_transport": 2, "waste_management": 2, "water_utilities": 2, "tourism_hospitality": 2},
    "lost_time_injury_rate":     {"oil_gas": 3, "utilities_power": 3, "metals_mining": 3, "chemicals": 3, "automotive": 3, "aviation": 3, "shipping": 3, "real_estate": 2, "agriculture_food": 2, "retail_apparel": 1, "technology_telecom": 1, "financial_services": 1, "healthcare_pharma": 2, "construction": 3, "forest_paper": 2, "consumer_goods": 1, "logistics_transport": 3, "waste_management": 3, "water_utilities": 2, "tourism_hospitality": 2},
    "supplier_esg_audit_pct":    {"oil_gas": 2, "utilities_power": 2, "metals_mining": 2, "chemicals": 2, "automotive": 3, "aviation": 2, "shipping": 2, "real_estate": 1, "agriculture_food": 3, "retail_apparel": 3, "technology_telecom": 2, "financial_services": 2, "healthcare_pharma": 3, "construction": 2, "forest_paper": 3, "consumer_goods": 3, "logistics_transport": 2, "waste_management": 2, "water_utilities": 1, "tourism_hospitality": 1},
    "sbti_approved_target":      {"oil_gas": 3, "utilities_power": 3, "metals_mining": 3, "chemicals": 3, "automotive": 3, "aviation": 3, "shipping": 3, "real_estate": 3, "agriculture_food": 3, "retail_apparel": 2, "technology_telecom": 2, "financial_services": 3, "healthcare_pharma": 2, "construction": 2, "forest_paper": 2, "consumer_goods": 2, "logistics_transport": 3, "waste_management": 2, "water_utilities": 2, "tourism_hospitality": 2},
    "eu_taxonomy_alignment_pct": {"oil_gas": 1, "utilities_power": 3, "metals_mining": 2, "chemicals": 2, "automotive": 3, "aviation": 2, "shipping": 2, "real_estate": 3, "agriculture_food": 2, "retail_apparel": 1, "technology_telecom": 2, "financial_services": 3, "healthcare_pharma": 2, "construction": 3, "forest_paper": 2, "consumer_goods": 1, "logistics_transport": 2, "waste_management": 3, "water_utilities": 3, "tourism_hospitality": 1},
    "capex_green_pct":           {"oil_gas": 3, "utilities_power": 3, "metals_mining": 2, "chemicals": 2, "automotive": 3, "aviation": 2, "shipping": 2, "real_estate": 3, "agriculture_food": 1, "retail_apparel": 1, "technology_telecom": 2, "financial_services": 2, "healthcare_pharma": 1, "construction": 3, "forest_paper": 2, "consumer_goods": 1, "logistics_transport": 2, "waste_management": 3, "water_utilities": 3, "tourism_hospitality": 2},
    "waste_to_landfill_pct":     {"oil_gas": 2, "utilities_power": 2, "metals_mining": 2, "chemicals": 2, "automotive": 2, "aviation": 1, "shipping": 1, "real_estate": 2, "agriculture_food": 3, "retail_apparel": 2, "technology_telecom": 2, "financial_services": 1, "healthcare_pharma": 2, "construction": 3, "forest_paper": 3, "consumer_goods": 2, "logistics_transport": 1, "waste_management": 3, "water_utilities": 1, "tourism_hospitality": 2},
}

# Fallback materiality for KPIs not in matrix
DEFAULT_MATERIALITY: dict[str, int] = {kpi: 1 for kpi in KPI_DEFINITIONS}

# ---------------------------------------------------------------------------
# MARGIN RATCHET MECHANICS
# ---------------------------------------------------------------------------

MARGIN_RATCHET_TYPES: dict[str, dict] = {
    "step_up_only": {
        "name": "Step-Up Only",
        "description": "Margin increases if SPT(s) are missed; no benefit for exceeding SPTs",
        "prevalence": "Most common for legacy SLLs and early SLBs (pre-2022)",
        "incentive_structure": "Penalty-only — creates floor incentive but no additional reward",
        "typical_step_up_bps": {"min": 5, "typical": 12.5, "max": 25},
        "typical_step_down_bps": {"min": 0, "typical": 0, "max": 0},
        "greenwashing_risk": "medium",
        "icma_preference": "acceptable but bidirectional preferred",
    },
    "bidirectional": {
        "name": "Bidirectional (Step-Up & Step-Down)",
        "description": "Margin increases on SPT miss AND decreases on SPT achievement/outperformance",
        "prevalence": "Increasingly standard for 2022+ SLBs and ESG-linked revolving credit facilities",
        "incentive_structure": "Balanced — reward for outperformance + penalty for underperformance",
        "typical_step_up_bps": {"min": 5, "typical": 12.5, "max": 25},
        "typical_step_down_bps": {"min": 5, "typical": 10, "max": 15},
        "greenwashing_risk": "low",
        "icma_preference": "preferred",
    },
    "pure_ratchet": {
        "name": "Pure Ratchet (Cascading)",
        "description": "Multiple step levels based on degree of SPT achievement vs target; "
                       "e.g., 50%=+5bps, 75%=0, 100%=-5bps, 110%=-10bps",
        "prevalence": "Used in performance-linked sustainability RCFs; rare in SLBs",
        "incentive_structure": "Nuanced — rewards incremental progress and outperformance proportionally",
        "typical_step_up_bps": {"min": 5, "typical": 15, "max": 30},
        "typical_step_down_bps": {"min": 5, "typical": 10, "max": 20},
        "greenwashing_risk": "low",
        "icma_preference": "acceptable — more complex but good incentive alignment",
    },
}

MARGIN_RATCHET_MARKET: dict = {
    "max_total_adjustment_bps": 50,
    "typical_distribution": {
        "0_5bps": 0.15,
        "5_10bps": 0.28,
        "10_15bps": 0.32,
        "15_25bps": 0.20,
        "25_50bps": 0.05,
    },
    "market_context_2023": {
        "average_step_up_bps": 12.5,
        "average_step_down_bps": 9.0,
        "pct_bidirectional": 0.58,
        "pct_step_up_only": 0.38,
        "pct_pure_ratchet": 0.04,
    },
}

# ---------------------------------------------------------------------------
# VERIFICATION AGENT PROTOCOL (SPO PROVIDERS)
# ---------------------------------------------------------------------------

SPO_PROVIDERS: dict[str, dict] = {
    "sustainalytics": {
        "name": "Sustainalytics (Morningstar)",
        "type": "Second Party Opinion (SPO)",
        "icma_registered": True,
        "market_share_pct": 28.0,
        "methodology": "ICMA SLBP + proprietary ESG research",
        "isae_3000_capable": True,
        "typical_turnaround_weeks": 4,
        "cost_range_usd": {"min": 35_000, "max": 90_000},
        "strengths": ["Largest SPO market share", "Strong sector data", "Listed company coverage"],
        "limitations": ["Turnaround time for complex structures", "Proprietary data limited disclosure"],
    },
    "iss_esg": {
        "name": "ISS ESG",
        "type": "Second Party Opinion (SPO)",
        "icma_registered": True,
        "market_share_pct": 18.0,
        "methodology": "ICMA SLBP + ISS ESG Governance ratings",
        "isae_3000_capable": True,
        "typical_turnaround_weeks": 3,
        "cost_range_usd": {"min": 30_000, "max": 75_000},
        "strengths": ["Governance integration", "Listed equities data", "Rapid turnaround"],
        "limitations": ["Less strong for private companies"],
    },
    "vigeo_eiris": {
        "name": "Vigeo Eiris (Moody's)",
        "type": "Second Party Opinion (SPO)",
        "icma_registered": True,
        "market_share_pct": 12.0,
        "methodology": "ICMA SLBP + Vigeo ESG scoring",
        "isae_3000_capable": True,
        "typical_turnaround_weeks": 4,
        "cost_range_usd": {"min": 30_000, "max": 70_000},
        "strengths": ["European coverage", "Social KPI expertise"],
        "limitations": ["Moody's consolidation impact"],
    },
    "dnv": {
        "name": "DNV Business Assurance",
        "type": "Verification / Assurance Body",
        "icma_registered": True,
        "market_share_pct": 15.0,
        "methodology": "ISAE 3000 / ISAE 3410 assurance; ISO 14064 for GHG",
        "isae_3000_capable": True,
        "typical_turnaround_weeks": 5,
        "cost_range_usd": {"min": 40_000, "max": 100_000},
        "strengths": ["Deep GHG assurance expertise", "ISAE 3000 reasonable assurance", "Energy sector"],
        "limitations": ["Higher cost for complex engagements"],
    },
    "bureau_veritas": {
        "name": "Bureau Veritas",
        "type": "Verification / Assurance Body",
        "icma_registered": True,
        "market_share_pct": 10.0,
        "methodology": "ISAE 3000 / GHG assurance; sustainability audit",
        "isae_3000_capable": True,
        "typical_turnaround_weeks": 5,
        "cost_range_usd": {"min": 35_000, "max": 85_000},
        "strengths": ["Global footprint", "Supply chain expertise", "Physical asset verification"],
        "limitations": ["Less strong on financial KPIs"],
    },
    "cicero": {
        "name": "CICERO Shades of Green",
        "type": "Second Party Opinion (SPO)",
        "icma_registered": True,
        "market_share_pct": 8.0,
        "methodology": "ICMA SLBP + CICERO science-based climate assessment",
        "isae_3000_capable": False,
        "typical_turnaround_weeks": 4,
        "cost_range_usd": {"min": 25_000, "max": 60_000},
        "strengths": ["Science credibility", "Norwegian climate institute backing", "Green bond taxonomy"],
        "limitations": ["Limited to climate KPIs", "No ISAE 3000 assurance"],
    },
}

# ---------------------------------------------------------------------------
# GREENWASHING RED FLAGS
# ---------------------------------------------------------------------------

GREENWASHING_FLAGS: list[dict] = [
    {
        "flag_id": "GW-01",
        "name": "Intensity SPT allows absolute emissions growth",
        "description": "SPT is set on an intensity basis (e.g., tCO2e/revenue) without an absolute cap, "
                       "allowing total emissions to increase if production grows",
        "severity": "major",
        "icma_slbp_ref": "ICMA SLBP 2023 — SPT Calibration guidance",
        "detection": "Check if absolute emissions trajectory is consistent with Paris Agreement even if SPT met",
    },
    {
        "flag_id": "GW-02",
        "name": "BAU SPT — target achievable without additional action",
        "description": "SPT is at or below the Business-as-Usual trajectory based on historical performance",
        "severity": "major",
        "icma_slbp_ref": "ICMA SLBP 2023 — Ambition requirement",
        "detection": "Compare SPT with 5-year historical improvement rate and SDA trajectory",
    },
    {
        "flag_id": "GW-03",
        "name": "No step-up for environmental KPI miss",
        "description": "SPT is set on a social or governance KPI with no financial consequence for "
                       "missing the most material environmental KPI",
        "severity": "moderate",
        "icma_slbp_ref": "ICMA SLBP 2023 — KPI materiality",
        "detection": "Review KPI list against SASB materiality map for issuer sector",
    },
    {
        "flag_id": "GW-04",
        "name": "Opaque or non-independent verification",
        "description": "SPT achievement verified by management only; no third-party ISAE 3000 assurance",
        "severity": "major",
        "icma_slbp_ref": "ICMA SLBP 2023 — Verification component",
        "detection": "Check if external verifier named; confirm ISAE 3000 scope",
    },
    {
        "flag_id": "GW-05",
        "name": "Short observation period (< 2 years)",
        "description": "SPT observation date is less than 2 years from issuance, insufficient to demonstrate "
                       "genuine transformation",
        "severity": "moderate",
        "icma_slbp_ref": "ICMA SLBP 2023 — SPT Calibration",
        "detection": "Check SPT observation date vs issuance date in bond documentation",
    },
    {
        "flag_id": "GW-06",
        "name": "Non-material KPI",
        "description": "KPI does not relate to the issuer's most significant ESG risk or impact "
                       "based on SASB/GRI sector materiality",
        "severity": "moderate",
        "icma_slbp_ref": "ICMA SLBP 2023 — KPI Selection",
        "detection": "Cross-reference KPI against SASB industry standards for sector",
    },
    {
        "flag_id": "GW-07",
        "name": "Cherry-picked favourable base year",
        "description": "Base year selected corresponds to unusually high emissions or poor performance, "
                       "making the SPT trajectory artificially steep",
        "severity": "major",
        "icma_slbp_ref": "ICMA SLBP 2023 — Base Year Verification",
        "detection": "Request 5-year historical data; check base year against sector average",
    },
    {
        "flag_id": "GW-08",
        "name": "Step-up below market threshold (< 5bps)",
        "description": "Financial incentive is too small to create genuine behavioural change (< 5bps step-up)",
        "severity": "minor",
        "icma_slbp_ref": "ICMA SLBP 2023 — Bond Characteristics",
        "detection": "Check coupon step-up magnitude in final terms",
    },
    {
        "flag_id": "GW-09",
        "name": "No remedy or cure period disclosed",
        "description": "Bond terms do not specify what happens if SPT is missed — no step-up confirmation "
                       "or repayment option",
        "severity": "moderate",
        "icma_slbp_ref": "ICMA SLBP 2023 — Bond Characteristics",
        "detection": "Review terms and conditions for trigger event and consequence clause",
    },
    {
        "flag_id": "GW-10",
        "name": "Post-issuance SPT adjustment without investor consent",
        "description": "SPT adjusted after bond issuance without bondholder or lender consent; "
                       "defeats predefined SPT requirement",
        "severity": "major",
        "icma_slbp_ref": "ICMA SLBP 2023 — SPT Calibration (predefined)",
        "detection": "Check amendment provisions in bond indenture or loan agreement",
    },
]

# ---------------------------------------------------------------------------
# MARKET REFERENCE DATA
# ---------------------------------------------------------------------------

MARKET_DATA: dict = {
    "issuance_2020_2024_usd_bn": {
        "SLB": {"2020": 95, "2021": 188, "2022": 158, "2023": 135, "2024_est": 145},
        "SLL": {"2020": 290, "2021": 520, "2022": 450, "2023": 380, "2024_est": 400},
    },
    "top_sectors_slb_2023": [
        "Utilities (27%)", "Real Estate (14%)", "Industrials (12%)",
        "Consumer Staples (11%)", "Energy (9%)", "Financials (8%)"
    ],
    "top_geographies_slb_2023": [
        "Europe (54%)", "Asia-Pacific (21%)", "North America (15%)", "Latin America (7%)", "Other (3%)"
    ],
    "top_kpi_types_2023_slb": [
        "GHG emissions reduction (68%)", "Renewable energy (42%)",
        "Energy efficiency (28%)", "Waste reduction (15%)",
        "Water reduction (12%)", "Gender diversity (10%)",
        "Biodiversity (5%)", "Social KPIs (8%)"
    ],
    "spo_market_share_2023": {
        "Sustainalytics": "28%", "ISS ESG": "18%", "DNV": "15%",
        "Vigeo Eiris": "12%", "Bureau Veritas": "10%", "CICERO": "8%", "Other": "9%"
    },
    "quality_grade_descriptions": {
        "A": "Best-in-class SLL/SLB — ICMA/LMA fully aligned, ambitious SPTs, ISAE 3000 assured, bidirectional",
        "B": "Good quality — ICMA/LMA substantially aligned, SPTs above BAU, external verification",
        "C": "Acceptable — ICMA/LMA partially aligned, SPTs marginal, limited verification",
        "D": "Below standard — significant greenwashing flags, BAU SPTs, no independent verification",
    },
}

# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------

class InstrumentData(BaseModel):
    model_config = {"protected_namespaces": ()}
    instrument_name: str
    instrument_type: str = Field(..., description="SLB or SLL")
    issuer_sector: str = Field(..., description="One of SECTORS_LIST")
    notional_usd: float
    base_margin_bps: float
    step_up_bps: float = 0.0
    step_down_bps: float = 0.0
    margin_type: str = Field("step_up_only", description="step_up_only / bidirectional / pure_ratchet")
    observation_period_years: float = 3.0
    issuance_year: int = 2024
    has_spo: bool = False
    spo_provider: Optional[str] = None
    has_annual_verification: bool = False
    verification_standard: Optional[str] = None

class KpiData(BaseModel):
    model_config = {"protected_namespaces": ()}
    kpi_key: str = Field(..., description="Key from KPI_DEFINITIONS")
    kpi_name: str
    unit: str
    baseline_year: int
    baseline_value: float
    is_externally_verifiable: bool = False
    has_science_based_benchmark: bool = False

class SptData(BaseModel):
    model_config = {"protected_namespaces": ()}
    kpi_key: str
    target_value: float
    target_year: int
    base_year: int
    base_year_value: float
    current_performance: Optional[float] = None
    is_predefined_at_issuance: bool = True
    has_independent_base_year_verification: bool = False

class AssessSllSlbRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    instrument: InstrumentData
    kpis: list[KpiData]
    spts: list[SptData]

class AssessSllSlbResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    instrument_name: str
    instrument_type: str
    assessment_date: str
    icma_lma_alignment_pct: float
    component_scores: dict[str, float]
    kpi_materiality_scores: list[dict]
    spt_ambition_scores: list[dict]
    margin_mechanism_assessment: dict
    verification_quality: str
    greenwashing_risk_score: float
    greenwashing_flags_count: int
    overall_quality_grade: str
    overall_quality_description: str
    recommendations: list[str]


class CalibrateSptRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    sector: str
    kpi_name: str
    baseline_year: int
    current_performance: float
    target_value: float
    target_year: int
    unit: str

class CalibrateSptResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    sector: str
    kpi_name: str
    sda_trajectory: Optional[dict]
    sda_target_at_target_year: Optional[float]
    required_reduction_pct: float
    target_reduction_pct: float
    ambition_level: str
    sbti_compatible: bool
    performance_vs_sda_pct: float
    recommended_tightening_pct: Optional[float]
    calibration_narrative: str


class MarginImpactRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    notional_usd: float
    base_margin_bps: float
    step_up_bps: float
    step_down_bps: float
    spt_hit_probability: float = Field(..., ge=0.0, le=1.0)
    tenor_years: float = 5.0
    margin_type: str = "bidirectional"

class MarginImpactResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    base_case_annual_cost_usd: float
    spt_hit_scenario_annual_cost_usd: float
    spt_miss_scenario_annual_cost_usd: float
    expected_annual_cost_usd: float
    expected_value_of_mechanism_usd: float
    cost_by_scenario: dict[str, float]
    bps_summary: dict[str, float]
    mechanism_type: str
    tenor_years: float


class GreenwashingScreenRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    instrument_name: str
    instrument_type: str
    spt_is_intensity_based: bool = False
    spt_allows_absolute_growth: bool = False
    spt_above_bau: bool = True
    step_up_bps: float = 0.0
    has_independent_verification: bool = False
    observation_period_years: float = 3.0
    kpi_is_material: bool = True
    base_year_independently_verified: bool = False
    post_issuance_spt_adjusted: bool = False
    has_cure_period: bool = True

class GreenwashingScreenResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    instrument_name: str
    flags_triggered: list[dict]
    major_flags: int
    moderate_flags: int
    minor_flags: int
    greenwashing_risk: str
    overall_risk_score: float
    summary: str


# ---------------------------------------------------------------------------
# Engine Class
# ---------------------------------------------------------------------------

class SllSlbV2Engine:
    """
    E115 — Sustainability-Linked Loan & Bond v2 Engine.
    Covers ICMA SLBP 2023, LMA/APLMA SLLP 2023, SPT calibration vs SDA,
    KPI materiality, margin ratchet mechanics, SPO verification, and greenwashing flags.
    No DB calls — deterministic scoring from reference data.
    """

    # ------------------------------------------------------------------
    # 1. Full SLL/SLB quality assessment
    # ------------------------------------------------------------------

    def assess_sll_slb_quality(self, request: AssessSllSlbRequest) -> AssessSllSlbResponse:
        inst = request.instrument
        kpis = request.kpis
        spts = request.spts

        components = ICMA_SLBP_COMPONENTS if inst.instrument_type.upper() == "SLB" else LMA_SLLP_COMPONENTS

        # --- Component scores ---
        comp_scores: dict[str, float] = {}

        # Component 1: KPI Selection
        kpi_mat_scores = self._score_kpi_materiality(kpis, inst.issuer_sector)
        avg_mat = (sum(k["materiality_score"] for k in kpi_mat_scores) / max(1, len(kpi_mat_scores)))
        kpi_verif = sum(1 for k in kpis if k.is_externally_verifiable) / max(1, len(kpis))
        kpi_sci_bench = sum(1 for k in kpis if k.has_science_based_benchmark) / max(1, len(kpis))
        comp_scores["kpi_selection"] = round(
            (avg_mat / 3.0) * 60 + kpi_verif * 25 + kpi_sci_bench * 15, 1
        )

        # Component 2: SPT Calibration
        spt_amb_scores = [self._score_spt_ambition(s, inst.issuer_sector) for s in spts]
        avg_spt_amb = sum(s["ambition_score"] for s in spt_amb_scores) / max(1, len(spt_amb_scores))
        predefined_pct = sum(1 for s in spts if s.is_predefined_at_issuance) / max(1, len(spts))
        base_verified_pct = sum(1 for s in spts if s.has_independent_base_year_verification) / max(1, len(spts))
        comp_scores["spt_calibration"] = round(avg_spt_amb * 60 + predefined_pct * 25 + base_verified_pct * 15, 1)

        # Component 3: Bond/Loan Characteristics
        mech_assess = self._assess_margin_mechanism(inst)
        comp_scores["bond_characteristics" if inst.instrument_type.upper() == "SLB" else "loan_characteristics"] = round(mech_assess["mechanism_score"], 1)

        # Component 4: Reporting
        # Proxy: having SPO = good reporting signal; observation period > 2 years
        rep_score = 50.0
        if inst.has_spo:
            rep_score += 20.0
        if inst.observation_period_years >= 3:
            rep_score += 15.0
        if inst.has_annual_verification:
            rep_score += 15.0
        comp_scores["reporting"] = min(100.0, rep_score)

        # Component 5: Verification
        ver_score = self._score_verification(inst)
        comp_scores["verification"] = round(ver_score, 1)
        verif_quality = (
            "leading" if ver_score >= 80 else
            "good" if ver_score >= 60 else
            "adequate" if ver_score >= 40 else
            "insufficient"
        )

        # --- ICMA/LMA alignment (weighted average of component scores)
        max_scores = [c.get("max_score", 20) for c in components.values()]
        weights = [m / sum(max_scores) for m in max_scores]
        named_components = list(comp_scores.values())
        alignment_pct = sum(w * s for w, s in zip(weights, named_components))

        # --- Greenwashing
        gw_result = self._quick_greenwash_check(inst, spts, kpi_mat_scores)

        # --- Overall grade
        net_score = alignment_pct - gw_result["penalty"]
        grade = (
            "A" if net_score >= 80 else
            "B" if net_score >= 60 else
            "C" if net_score >= 40 else
            "D"
        )

        # --- Recommendations
        recs = self._build_recommendations(
            comp_scores, gw_result["flags"], inst, kpi_mat_scores, spt_amb_scores
        )

        return AssessSllSlbResponse(
            instrument_name=inst.instrument_name,
            instrument_type=inst.instrument_type,
            assessment_date=datetime.utcnow().strftime("%Y-%m-%d"),
            icma_lma_alignment_pct=round(alignment_pct, 1),
            component_scores=comp_scores,
            kpi_materiality_scores=kpi_mat_scores,
            spt_ambition_scores=spt_amb_scores,
            margin_mechanism_assessment=mech_assess,
            verification_quality=verif_quality,
            greenwashing_risk_score=round(gw_result["risk_score"], 1),
            greenwashing_flags_count=len(gw_result["flags"]),
            overall_quality_grade=grade,
            overall_quality_description=MARKET_DATA["quality_grade_descriptions"][grade],
            recommendations=recs,
        )

    # ------------------------------------------------------------------
    # 2. SPT Calibration vs SDA
    # ------------------------------------------------------------------

    def calibrate_spt(self, request: CalibrateSptRequest) -> CalibrateSptResponse:
        sector_lower = request.sector.lower().replace(" ", "_").replace("-", "_")
        sda = None
        for sda_key, sda_val in SDA_TRAJECTORIES.items():
            if sda_key in sector_lower or sector_lower in sda_key:
                sda = sda_val
                break

        # Calculate required reduction
        if request.current_performance == 0.0:
            required_reduction_pct = 0.0
        else:
            required_reduction_pct = (
                (request.current_performance - request.target_value) / request.current_performance * 100
            )

        # SDA target at target year
        sda_target_at_year: Optional[float] = None
        if sda:
            targets = sda.get("targets", {})
            target_year_str = str(request.target_year)
            if target_year_str in targets:
                sda_target_at_year = targets[target_year_str]
            else:
                # Linear interpolation
                years = sorted(int(y) for y in targets.keys())
                if request.target_year <= years[0]:
                    sda_target_at_year = targets[str(years[0])]
                elif request.target_year >= years[-1]:
                    sda_target_at_year = targets[str(years[-1])]
                else:
                    for i in range(len(years) - 1):
                        if years[i] <= request.target_year <= years[i + 1]:
                            frac = (request.target_year - years[i]) / (years[i + 1] - years[i])
                            sda_target_at_year = (
                                targets[str(years[i])] + frac * (
                                    targets[str(years[i + 1])] - targets[str(years[i])]
                                )
                            )
                            break

        # Ambition vs SDA
        if sda_target_at_year is not None and sda and sda.get("baseline_2020", 0) > 0:
            baseline = sda["baseline_2020"]
            sda_reduction_required = (baseline - sda_target_at_year) / baseline * 100
            issuer_baseline = request.current_performance or baseline
            issuer_reduction = (
                (issuer_baseline - request.target_value) / issuer_baseline * 100
                if issuer_baseline != 0 else 0.0
            )
            performance_vs_sda = issuer_reduction - sda_reduction_required
        else:
            sda_reduction_required = 0.0
            issuer_reduction = required_reduction_pct
            performance_vs_sda = 0.0

        # Ambition level
        if performance_vs_sda >= 5:
            ambition_level = "leading"
            sbti_compatible = True
        elif performance_vs_sda >= -2:
            ambition_level = "aligned"
            sbti_compatible = True
        elif performance_vs_sda >= -10:
            ambition_level = "lagging"
            sbti_compatible = False
        else:
            ambition_level = "insufficient"
            sbti_compatible = False

        # Recommended tightening
        rec_tightening: Optional[float] = None
        if ambition_level in ("lagging", "insufficient") and sda_target_at_year is not None:
            rec_tightening = round(abs(performance_vs_sda) + 2.0, 1)

        narrative = (
            f"SPT requires a {required_reduction_pct:.1f}% reduction in {request.kpi_name} "
            f"by {request.target_year}. "
            f"{'SDA pathway requires ' + str(round(sda_reduction_required, 1)) + '% reduction for ' + request.sector + '. ' if sda else ''}"
            f"SPT is classified as '{ambition_level}' "
            f"({'SBTi-compatible' if sbti_compatible else 'not SBTi-compatible'})."
        )

        return CalibrateSptResponse(
            sector=request.sector,
            kpi_name=request.kpi_name,
            sda_trajectory=sda,
            sda_target_at_target_year=round(sda_target_at_year, 2) if sda_target_at_year else None,
            required_reduction_pct=round(required_reduction_pct, 1),
            target_reduction_pct=round(required_reduction_pct, 1),
            ambition_level=ambition_level,
            sbti_compatible=sbti_compatible,
            performance_vs_sda_pct=round(performance_vs_sda, 2),
            recommended_tightening_pct=rec_tightening,
            calibration_narrative=narrative,
        )

    # ------------------------------------------------------------------
    # 3. Margin Impact Calculation
    # ------------------------------------------------------------------

    def calculate_margin_impact(self, request: MarginImpactRequest) -> MarginImpactResponse:
        notional = request.notional_usd
        base_bps = request.base_margin_bps
        step_up = request.step_up_bps
        step_down = request.step_down_bps
        p_hit = request.spt_hit_probability
        p_miss = 1.0 - p_hit

        base_annual = notional * (base_bps / 10_000)

        if request.margin_type == "bidirectional":
            hit_margin_bps = base_bps - step_down
            miss_margin_bps = base_bps + step_up
        elif request.margin_type == "step_up_only":
            hit_margin_bps = base_bps
            miss_margin_bps = base_bps + step_up
        else:  # pure_ratchet — use midpoint
            hit_margin_bps = base_bps - step_down * 0.5
            miss_margin_bps = base_bps + step_up * 0.5

        hit_annual = notional * (hit_margin_bps / 10_000)
        miss_annual = notional * (miss_margin_bps / 10_000)
        expected_annual = p_hit * hit_annual + p_miss * miss_annual
        ev_mechanism = expected_annual - base_annual

        scenarios = {
            "base_case": round(base_annual, 0),
            "all_spts_hit": round(hit_annual, 0),
            "all_spts_missed": round(miss_annual, 0),
            "expected_value": round(expected_annual, 0),
            "lifetime_base": round(base_annual * request.tenor_years, 0),
            "lifetime_hit": round(hit_annual * request.tenor_years, 0),
            "lifetime_miss": round(miss_annual * request.tenor_years, 0),
            "lifetime_expected": round(expected_annual * request.tenor_years, 0),
        }

        bps_summary = {
            "base_margin_bps": base_bps,
            "step_up_bps": step_up,
            "step_down_bps": step_down,
            "hit_effective_bps": hit_margin_bps,
            "miss_effective_bps": miss_margin_bps,
            "expected_effective_bps": round(p_hit * hit_margin_bps + p_miss * miss_margin_bps, 2),
        }

        return MarginImpactResponse(
            base_case_annual_cost_usd=round(base_annual, 0),
            spt_hit_scenario_annual_cost_usd=round(hit_annual, 0),
            spt_miss_scenario_annual_cost_usd=round(miss_annual, 0),
            expected_annual_cost_usd=round(expected_annual, 0),
            expected_value_of_mechanism_usd=round(ev_mechanism, 0),
            cost_by_scenario=scenarios,
            bps_summary=bps_summary,
            mechanism_type=request.margin_type,
            tenor_years=request.tenor_years,
        )

    # ------------------------------------------------------------------
    # 4. Greenwashing Flag Screening
    # ------------------------------------------------------------------

    def screen_greenwashing_flags(
        self, request: GreenwashingScreenRequest
    ) -> GreenwashingScreenResponse:
        triggered: list[dict] = []

        # GW-01: Intensity + absolute growth
        if request.spt_is_intensity_based and request.spt_allows_absolute_growth:
            triggered.append({**GREENWASHING_FLAGS[0], "triggered": True})

        # GW-02: BAU SPT
        if not request.spt_above_bau:
            triggered.append({**GREENWASHING_FLAGS[1], "triggered": True})

        # GW-04: No independent verification
        if not request.has_independent_verification:
            triggered.append({**GREENWASHING_FLAGS[3], "triggered": True})

        # GW-05: Short observation period
        if request.observation_period_years < 2:
            triggered.append({**GREENWASHING_FLAGS[4], "triggered": True})

        # GW-06: Non-material KPI
        if not request.kpi_is_material:
            triggered.append({**GREENWASHING_FLAGS[5], "triggered": True})

        # GW-07: Cherry-picked base year
        if not request.base_year_independently_verified:
            triggered.append({**GREENWASHING_FLAGS[6], "triggered": True})

        # GW-08: Step-up below 5bps
        if 0 < request.step_up_bps < 5:
            triggered.append({**GREENWASHING_FLAGS[7], "triggered": True})

        # GW-09: No cure period
        if not request.has_cure_period:
            triggered.append({**GREENWASHING_FLAGS[8], "triggered": True})

        # GW-10: Post-issuance adjustment
        if request.post_issuance_spt_adjusted:
            triggered.append({**GREENWASHING_FLAGS[9], "triggered": True})

        major = sum(1 for f in triggered if f["severity"] == "major")
        moderate = sum(1 for f in triggered if f["severity"] == "moderate")
        minor = sum(1 for f in triggered if f["severity"] == "minor")

        # Risk score
        risk_score = min(100.0, major * 20 + moderate * 10 + minor * 5)

        greenwashing_risk = (
            "critical" if risk_score >= 60 else
            "high" if risk_score >= 40 else
            "medium" if risk_score >= 20 else
            "low"
        )

        summary = (
            f"{len(triggered)} flag(s) triggered ({major} major, {moderate} moderate, {minor} minor). "
            f"Greenwashing risk: {greenwashing_risk}. Risk score: {risk_score:.0f}/100."
        )

        return GreenwashingScreenResponse(
            instrument_name=request.instrument_name,
            flags_triggered=triggered,
            major_flags=major,
            moderate_flags=moderate,
            minor_flags=minor,
            greenwashing_risk=greenwashing_risk,
            overall_risk_score=round(risk_score, 1),
            summary=summary,
        )

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _score_kpi_materiality(
        self, kpis: list[KpiData], sector: str
    ) -> list[dict]:
        results: list[dict] = []
        for kpi in kpis:
            matrix_row = KPI_MATERIALITY_MATRIX.get(kpi.kpi_key, {})
            mat_score = matrix_row.get(sector, DEFAULT_MATERIALITY.get(kpi.kpi_key, 1))
            results.append({
                "kpi_key": kpi.kpi_key,
                "kpi_name": kpi.kpi_name,
                "materiality_score": mat_score,
                "materiality_label": ["not_material", "emerging", "material", "highly_material"][mat_score],
                "sector": sector,
                "externally_verifiable": kpi.is_externally_verifiable,
                "science_based_benchmark": kpi.has_science_based_benchmark,
            })
        return results

    def _score_spt_ambition(self, spt: SptData, sector: str) -> dict:
        # Find SDA trajectory
        sda = None
        for k, v in SDA_TRAJECTORIES.items():
            if k in sector.lower() or sector.lower() in k:
                sda = v
                break

        if spt.base_year_value == 0:
            reduction_pct = 0.0
        else:
            reduction_pct = (spt.base_year_value - spt.target_value) / spt.base_year_value * 100

        # Compare to SDA
        if sda:
            year_str = str(spt.target_year)
            target_years = sda.get("targets", {})
            sda_target = target_years.get(year_str, sda["baseline_2020"] * 0.72)
            sda_reduction = (sda["baseline_2020"] - sda_target) / sda["baseline_2020"] * 100
            delta = reduction_pct - sda_reduction
        else:
            sda_reduction = 27.5  # default ACA assumption
            delta = reduction_pct - sda_reduction

        ambition_score = max(0.0, min(100.0, 50.0 + delta * 2.0))
        ambition_level = (
            "leading" if delta >= 5 else
            "aligned" if delta >= -2 else
            "lagging" if delta >= -10 else
            "insufficient"
        )

        return {
            "kpi_key": spt.kpi_key,
            "target_year": spt.target_year,
            "reduction_pct_required": round(reduction_pct, 1),
            "sda_reduction_pct_required": round(sda_reduction, 1),
            "delta_vs_sda_pct": round(delta, 1),
            "ambition_score": round(ambition_score, 1),
            "ambition_level": ambition_level,
            "predefined": spt.is_predefined_at_issuance,
            "base_verified": spt.has_independent_base_year_verification,
        }

    def _assess_margin_mechanism(self, inst: InstrumentData) -> dict:
        step_up = inst.step_up_bps
        step_down = inst.step_down_bps
        mtype = inst.margin_type

        score = 0.0

        # Step-up threshold
        if step_up >= 20:
            score += 35.0
        elif step_up >= 10:
            score += 25.0
        elif step_up >= 5:
            score += 15.0
        else:
            score += 0.0

        # Mechanism type
        if mtype == "bidirectional":
            score += 35.0
        elif mtype == "pure_ratchet":
            score += 25.0
        else:
            score += 10.0

        # Step-down
        if step_down >= 10:
            score += 20.0
        elif step_down >= 5:
            score += 10.0

        # Observation period
        if inst.observation_period_years >= 3:
            score += 10.0
        elif inst.observation_period_years >= 2:
            score += 5.0

        return {
            "mechanism_score": round(min(100.0, score), 1),
            "step_up_bps": step_up,
            "step_down_bps": step_down,
            "mechanism_type": mtype,
            "icma_preference": MARGIN_RATCHET_TYPES.get(mtype, {}).get("icma_preference", "acceptable"),
            "total_adjustment_cap_bps": 50,
            "within_market_norms": step_up <= 25 and step_down <= 15,
        }

    def _score_verification(self, inst: InstrumentData) -> float:
        score = 0.0
        if inst.has_spo:
            score += 40.0
            if inst.spo_provider and inst.spo_provider.lower() in SPO_PROVIDERS:
                if SPO_PROVIDERS[inst.spo_provider.lower()].get("icma_registered"):
                    score += 10.0
        if inst.has_annual_verification:
            score += 30.0
        if inst.verification_standard:
            if "isae 3000" in inst.verification_standard.lower() or "isae3000" in inst.verification_standard.lower():
                score += 15.0
            elif "issa 5000" in inst.verification_standard.lower():
                score += 20.0
        return min(100.0, score)

    def _quick_greenwash_check(
        self,
        inst: InstrumentData,
        spts: list[SptData],
        kpi_mat_scores: list[dict],
    ) -> dict:
        flags: list[str] = []
        risk_score = 0.0

        if inst.step_up_bps < 5:
            flags.append("GW-08: Step-up below 5bps threshold")
            risk_score += 5
        if not inst.has_spo:
            flags.append("GW-04: No independent SPO at issuance")
            risk_score += 20
        if not inst.has_annual_verification:
            flags.append("GW-04b: No annual independent verification")
            risk_score += 15
        if inst.observation_period_years < 2:
            flags.append("GW-05: Observation period < 2 years")
            risk_score += 10
        if any(s["materiality_score"] == 0 for s in kpi_mat_scores):
            flags.append("GW-06: At least one KPI not material for sector")
            risk_score += 10
        if any(not s.is_predefined_at_issuance for s in spts):
            flags.append("GW-10: SPT not predefined at issuance")
            risk_score += 20

        return {"flags": flags, "risk_score": min(100.0, risk_score), "penalty": min(30.0, risk_score * 0.3)}

    def _build_recommendations(
        self,
        comp_scores: dict,
        gw_flags: list[str],
        inst: InstrumentData,
        kpi_mat_scores: list[dict],
        spt_amb_scores: list[dict],
    ) -> list[str]:
        recs: list[str] = []

        if comp_scores.get("kpi_selection", 100) < 60:
            recs.append(
                "Improve KPI selection: ensure all KPIs are externally verifiable and benchmarked "
                "against SASB sector standards"
            )
        if comp_scores.get("spt_calibration", 100) < 60:
            recs.append(
                "Strengthen SPT calibration: align SPTs with SBTi SDA trajectory; "
                "obtain independent base year verification"
            )
        if inst.step_up_bps < 10:
            recs.append(
                f"Increase step-up from {inst.step_up_bps}bps to at least 12.5bps "
                "to meet market norms and ICMA expectations"
            )
        if inst.margin_type == "step_up_only":
            recs.append(
                "Convert to bidirectional mechanism (step-up + step-down) to align "
                "with ICMA preferred structure and investor expectations"
            )
        if not inst.has_spo:
            recs.append(
                "Appoint an ICMA-registered SPO provider (e.g., Sustainalytics, ISS ESG, DNV) "
                "at issuance"
            )
        if not inst.has_annual_verification:
            recs.append(
                "Commit to annual ISAE 3000 limited assurance on SPT performance by an "
                "independent verifier"
            )
        low_mat = [k["kpi_name"] for k in kpi_mat_scores if k["materiality_score"] <= 1]
        if low_mat:
            recs.append(
                f"Replace low-materiality KPI(s) ({', '.join(low_mat)}) with sector-core KPIs "
                f"from SASB {inst.issuer_sector} standard"
            )
        lagging_spts = [s for s in spt_amb_scores if s["ambition_level"] in ("lagging", "insufficient")]
        if lagging_spts:
            recs.append(
                f"{len(lagging_spts)} SPT(s) classified as lagging/insufficient vs SDA pathway — "
                "tighten targets to at least SDA-aligned level"
            )
        for flag in gw_flags:
            if flag.startswith("GW-07"):
                recs.append(
                    "Commission independent verification of base year data to eliminate "
                    "cherry-picked base year risk (GW-07)"
                )

        return recs
