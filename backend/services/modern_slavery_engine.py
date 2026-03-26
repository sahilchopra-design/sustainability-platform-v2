"""
Modern Slavery & Forced Labour Engine — E114
=============================================

Comprehensive engine covering:
- ILO 11 Forced Labour Indicators (ILO 2012 Guidelines)
- UFLPA — Uyghur Forced Labor Prevention Act (June 2022), rebuttable presumption
- EU Forced Labour Regulation 2024/3015 (effective Jan 2027)
- UK Modern Slavery Act 2015 — Section 54 transparency statements
- 25 high-risk sector / commodity / country profiles
- 15 audit scheme effectiveness ratings
- CAHRA — Conflict-Affected and High-Risk Areas (OECD Annex II)

References:
- ILO (2012) Hard to See, Harder to Count — Survey Guidelines for Estimating Forced Labour
- Uyghur Forced Labor Prevention Act, Pub. L. 117-78 (22 June 2022)
- Regulation (EU) 2024/3015 of the European Parliament and of the Council
- UK Modern Slavery Act 2015, Section 54 — Transparency in Supply Chains
- OECD Due Diligence Guidance for Responsible Supply Chains in Conflict-Affected Areas (Annex II)
"""
from __future__ import annotations

import math
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Pydantic config helper
# ---------------------------------------------------------------------------
_CFG: dict = {"protected_namespaces": ()}

# ---------------------------------------------------------------------------
# ILO 11 FORCED LABOUR INDICATORS
# ---------------------------------------------------------------------------

ILO_INDICATORS: dict[str, dict] = {
    "abuse_of_vulnerability": {
        "number": 1,
        "name": "Abuse of Vulnerability",
        "description": "Exploitation of workers in vulnerable situations (migrants, minorities, women, children)",
        "ilo_reference": "ILO 2012 — Indicator 1",
        "weight": 0.10,
        "scoring_criteria": {
            "0": "No vulnerable workers; documented recruitment from regulated channels",
            "1": "Some vulnerable workers present but no exploitative conditions identified",
            "2": "Systemic use of vulnerable workers with limited safeguards",
            "3": "Clear exploitation of vulnerability — coercive recruitment, irregular status workers",
        },
        "evidence_requirements": [
            "Worker demographic records",
            "Recruitment agency contracts and licences",
            "Proof of legal right to work",
            "Anti-discrimination policy",
        ],
        "sector_prevalence": {
            "garments_textiles": "very_high",
            "domestic_work": "very_high",
            "agriculture": "high",
            "fishing_seafood": "high",
            "construction": "high",
            "electronics": "medium",
            "mining_cobalt": "high",
        },
    },
    "deception": {
        "number": 2,
        "name": "Deception",
        "description": "Deception about nature of work, location, employer identity, or working/living conditions",
        "ilo_reference": "ILO 2012 — Indicator 2",
        "weight": 0.10,
        "scoring_criteria": {
            "0": "Written contracts in worker language; pre-departure orientation provided",
            "1": "Minor discrepancies between offered and actual conditions",
            "2": "Systematic contract substitution or misleading job advertisements",
            "3": "Fraudulent recruitment with material false representations",
        },
        "evidence_requirements": [
            "Original employment contracts (worker language)",
            "Job advertisements and offer letters",
            "Worker onboarding records",
            "Grievance case logs relating to contract terms",
        ],
        "sector_prevalence": {
            "domestic_work": "very_high",
            "fishing_seafood": "very_high",
            "garments_textiles": "high",
            "construction": "high",
            "agriculture": "medium",
        },
    },
    "restriction_of_movement": {
        "number": 3,
        "name": "Restriction of Movement",
        "description": "Workers unable to leave workplace, accommodation, or country freely",
        "ilo_reference": "ILO 2012 — Indicator 3",
        "weight": 0.09,
        "scoring_criteria": {
            "0": "Workers free to leave; no curfews; voluntary accommodation",
            "1": "Administrative restrictions documented but contestable",
            "2": "Locked dormitories or mandatory employer-provided housing with exit controls",
            "3": "Physical confinement; confiscated travel documents; sponsored visa abuse",
        },
        "evidence_requirements": [
            "Worker exit interview records",
            "Accommodation inspection reports",
            "Visa sponsorship policies",
            "Labour audit findings on dormitory conditions",
        ],
        "sector_prevalence": {
            "fishing_seafood": "very_high",
            "domestic_work": "very_high",
            "construction": "high",
            "garments_textiles": "medium",
            "agriculture": "medium",
        },
    },
    "isolation": {
        "number": 4,
        "name": "Isolation",
        "description": "Social isolation: communication restriction, remote location, ban on outside contact",
        "ilo_reference": "ILO 2012 — Indicator 4",
        "weight": 0.08,
        "scoring_criteria": {
            "0": "Workers have unrestricted access to phones and outside communication",
            "1": "Remote location but regular supervised contact permitted",
            "2": "Phone confiscation; restricted internet; scheduled communication windows",
            "3": "Complete information blackout; no independent union or NGO access",
        },
        "evidence_requirements": [
            "Worker communication access policy",
            "NGO access records",
            "Grievance mechanism accessibility reports",
            "Third-party welfare audit",
        ],
        "sector_prevalence": {
            "fishing_seafood": "very_high",
            "construction": "high",
            "agriculture": "high",
            "domestic_work": "very_high",
        },
    },
    "physical_sexual_violence": {
        "number": 5,
        "name": "Physical / Sexual Violence",
        "description": "Acts or threats of physical or sexual violence against workers or their families",
        "ilo_reference": "ILO 2012 — Indicator 5",
        "weight": 0.12,
        "scoring_criteria": {
            "0": "Zero-tolerance policy; documented grievance resolution; no substantiated incidents",
            "1": "Policy exists; isolated incidents; corrective action taken",
            "2": "Recurring incidents; inadequate response; culture of impunity",
            "3": "Systematic violence; violence used as control mechanism",
        },
        "evidence_requirements": [
            "Grievance/complaint register",
            "Disciplinary action records",
            "Worker wellbeing surveys",
            "Audit finding reports",
        ],
        "sector_prevalence": {
            "domestic_work": "very_high",
            "fishing_seafood": "high",
            "agriculture": "medium",
            "garments_textiles": "medium",
        },
    },
    "intimidation_threats": {
        "number": 6,
        "name": "Intimidation and Threats",
        "description": "Use of threats (dismissal, violence, legal action, reporting to authorities) to control workers",
        "ilo_reference": "ILO 2012 — Indicator 6",
        "weight": 0.09,
        "scoring_criteria": {
            "0": "Workers can leave without penalty; no documented threat incidents",
            "1": "Informal pressure observed but no systemic pattern",
            "2": "Documented threats of deportation/blacklisting; anti-union intimidation",
            "3": "Systematic threatening behaviour; organised intimidation",
        },
        "evidence_requirements": [
            "Freedom of association policy",
            "Worker interview transcripts (audit)",
            "Collective bargaining agreements",
            "Grievance case analysis",
        ],
        "sector_prevalence": {
            "agriculture": "high",
            "garments_textiles": "high",
            "construction": "medium",
            "fishing_seafood": "high",
        },
    },
    "retention_of_identity_documents": {
        "number": 7,
        "name": "Retention of Identity Documents",
        "description": "Confiscation or retention of passports, identity cards, visas, or work permits",
        "ilo_reference": "ILO 2012 — Indicator 7",
        "weight": 0.10,
        "scoring_criteria": {
            "0": "Workers retain own documents; certified copies only if consent given",
            "1": "Employer holds documents temporarily for administrative processes",
            "2": "Documents held without worker consent or indefinitely",
            "3": "Systematic document confiscation as coercive control",
        },
        "evidence_requirements": [
            "Document retention policy",
            "Worker consent records",
            "Audit checklist findings on document control",
            "Immigration compliance records",
        ],
        "sector_prevalence": {
            "domestic_work": "very_high",
            "construction": "very_high",
            "garments_textiles": "high",
            "fishing_seafood": "high",
            "agriculture": "medium",
        },
    },
    "withholding_of_wages": {
        "number": 8,
        "name": "Withholding of Wages",
        "description": "Non-payment, delayed payment, illegal wage deductions, or payment in kind",
        "ilo_reference": "ILO 2012 — Indicator 8",
        "weight": 0.10,
        "scoring_criteria": {
            "0": "Timely payment; payslips provided; no unlawful deductions",
            "1": "Minor delays; documented wage disputes resolved promptly",
            "2": "Systematic late payment; excessive deductions for housing/food",
            "3": "Wages withheld as control; workers cannot accrue enough to leave",
        },
        "evidence_requirements": [
            "Payroll records",
            "Payslip samples",
            "Wage deduction policy",
            "Worker wage survey results",
        ],
        "sector_prevalence": {
            "garments_textiles": "high",
            "agriculture": "high",
            "construction": "high",
            "fishing_seafood": "very_high",
            "domestic_work": "high",
        },
    },
    "debt_bondage": {
        "number": 9,
        "name": "Debt Bondage",
        "description": "Workers compelled to work to repay inflated or fabricated recruitment debts",
        "ilo_reference": "ILO 2012 — Indicator 9",
        "weight": 0.12,
        "scoring_criteria": {
            "0": "No recruitment fees charged to workers; employer-pays policy enforced",
            "1": "Small permissible fees; transparent repayment schedule",
            "2": "Fees exceed one month salary; unclear repayment terms",
            "3": "Debt bondage — fee exceeds multiple months salary; debt grows over time",
        },
        "evidence_requirements": [
            "Recruitment fee policy (employer-pays)",
            "Migrant worker contracts",
            "Recruitment agency audit records",
            "Responsible recruitment certification",
        ],
        "sector_prevalence": {
            "domestic_work": "very_high",
            "fishing_seafood": "very_high",
            "construction": "high",
            "garments_textiles": "high",
            "agriculture": "high",
            "electronics": "medium",
        },
    },
    "abusive_working_living_conditions": {
        "number": 10,
        "name": "Abusive Working and Living Conditions",
        "description": "Conditions below minimum legal standards; dangerous, degrading, or inhumane conditions",
        "ilo_reference": "ILO 2012 — Indicator 10",
        "weight": 0.05,
        "scoring_criteria": {
            "0": "Conditions meet or exceed legal standards; regular OSH inspections",
            "1": "Minor violations; corrective action plans in place",
            "2": "Systematic OSH violations; overcrowded dormitories; inadequate food",
            "3": "Conditions constitute cruel, inhuman, or degrading treatment",
        },
        "evidence_requirements": [
            "OSH inspection records",
            "Accommodation audit reports",
            "Worker health and welfare surveys",
            "National labour authority compliance certificates",
        ],
        "sector_prevalence": {
            "fishing_seafood": "very_high",
            "brick_kilns": "very_high",
            "mining_cobalt": "high",
            "construction": "high",
            "agriculture": "medium",
        },
    },
    "excessive_overtime": {
        "number": 11,
        "name": "Excessive Overtime",
        "description": "Compulsory or coerced overtime beyond legal limits; workers cannot refuse",
        "ilo_reference": "ILO 2012 — Indicator 11",
        "weight": 0.05,
        "scoring_criteria": {
            "0": "Working hours within legal limits; voluntary overtime with premium pay",
            "1": "Occasional excess with worker consent and premium pay",
            "2": "Regular overtime above legal limits; penalties for refusal",
            "3": "Extreme hours (>80 hrs/week); workers unable to refuse; health impacts",
        },
        "evidence_requirements": [
            "Time-and-attendance records",
            "Payroll overtime records",
            "Worker interview evidence on voluntary nature",
            "Working time compliance audit",
        ],
        "sector_prevalence": {
            "garments_textiles": "very_high",
            "electronics": "high",
            "agriculture": "medium",
            "construction": "medium",
        },
    },
}

# ---------------------------------------------------------------------------
# UFLPA — Uyghur Forced Labor Prevention Act (June 2022)
# ---------------------------------------------------------------------------

UFLPA_DATA: dict = {
    "legislation": "Uyghur Forced Labor Prevention Act, Pub. L. 117-78",
    "enacted": "2022-06-21",
    "enforcing_body": "U.S. Customs and Border Protection (CBP)",
    "rebuttable_presumption": {
        "description": (
            "Any goods mined, produced, or manufactured wholly or in part in the Xinjiang Uyghur "
            "Autonomous Region (XUAR), or by entities on the UFLPA Entity List, are presumed to "
            "have been made with forced labour and are prohibited from import into the United States "
            "under Section 307 of the Tariff Act of 1930 (19 U.S.C. § 1307)."
        ),
        "standard_of_proof": (
            "Importer must show by clear and convincing evidence that goods were not made with forced labour"
        ),
        "trigger_regions": ["Xinjiang Uyghur Autonomous Region (XUAR)", "China (XUAR supply links)"],
        "effective_date": "2022-06-21",
    },
    "entity_categories": [
        {
            "category": "Government_entities",
            "description": "Chinese government entities involved in Xinjiang labour programmes",
            "examples": ["Xinjiang Production and Construction Corps (XPCC)"],
        },
        {
            "category": "State_owned_enterprises",
            "description": "SOEs operating in Xinjiang with forced labour links",
            "examples": ["Xinjiang state cotton farms"],
        },
        {
            "category": "Labour_transfer_participants",
            "description": "Companies participating in government-directed surplus labour transfer",
            "examples": ["Companies receiving XPCC transfers"],
        },
        {
            "category": "Raw_material_producers",
            "description": "Cotton, polysilicon, tomato, and other raw material producers in XUAR",
            "examples": ["Cotton gin operators", "polysilicon manufacturers"],
        },
        {
            "category": "Mid_chain_processors",
            "description": "Processors and manufacturers receiving XUAR inputs",
            "examples": ["Spinning mills", "solar panel manufacturers"],
        },
        {
            "category": "Downstream_brands",
            "description": "Brands or retailers sourcing from XUAR-linked supply chains",
            "examples": ["Apparel brands", "solar project developers"],
        },
        {
            "category": "Financial_intermediaries",
            "description": "Banks and investors financing XUAR forced-labour operations",
            "examples": ["Project finance lenders to XUAR facilities"],
        },
        {
            "category": "Technology_enablers",
            "description": "Technology companies providing surveillance or tracking used in XUAR",
            "examples": ["Biometric surveillance vendors"],
        },
    ],
    "high_risk_commodities": [
        "Cotton (HS 5201-5212)",
        "Polysilicon / Solar PV (HS 2804.61, 8541.40)",
        "Tomato products (HS 2002)",
        "Aluminium (HS 7601-7606)",
        "Textiles and apparel (HS 50-63)",
        "Electronics / semiconductors (HS 8541-8542)",
        "Steel (HS 7201-7229)",
        "Lithium-ion batteries (HS 8507.60)",
        "Gloves / PPE (HS 6116)",
    ],
    "approved_importer_criteria": [
        "Complete supply chain mapping to raw material origin",
        "Third-party social compliance audit (SMETA or SA8000) within 12 months",
        "No supplier on UFLPA Entity List or OFAC SDN list",
        "Documented evidence that no XUAR labour programme workers used",
        "Robust traceability system (lot-level or batch-level)",
        "Voluntary importer self-disclosure and CBP cooperation",
        "Due diligence programme aligned with OECD DDG",
        "Clear and convincing evidence package for CBP review",
    ],
    "cbp_enforcement_statistics": {
        "fy2023_value_detained_usd": 3_200_000_000,
        "fy2023_shipments_detained": 4285,
        "top_detained_commodities": ["solar panels", "apparel", "electronics"],
        "average_cbp_review_days": 30,
        "denial_rate_pct": 22.0,
    },
    "documentation_requirements": [
        "Mill certificates tracing fibre to farm origin",
        "Supplier declarations under penalty of perjury",
        "Transaction documents: invoices, bills of lading, packing lists",
        "Lab test results (isotope testing for cotton origin)",
        "Audit reports dated within 12 months",
        "Supply chain mapping (visual diagram with entity names)",
        "Evidence of XUAR labour programme non-participation",
    ],
}

# ---------------------------------------------------------------------------
# EU FORCED LABOUR REGULATION 2024/3015
# ---------------------------------------------------------------------------

EU_FLR_DATA: dict = {
    "regulation": "Regulation (EU) 2024/3015",
    "scope": "All products placed or made available on EU market or exported from EU; no size or revenue threshold",
    "effective_date": "2027-01-01",
    "prohibition": (
        "Products made with forced labour (ILO C29/C105) are prohibited from the EU market. "
        "Competent authorities may order withdrawal and disposal of non-compliant products."
    ),
    "investigation_procedure": {
        "phase_1_preliminary": {
            "duration_days": 30,
            "trigger": "Substantiated concern based on information from any source",
            "outcome": "Decision to open formal investigation or close",
        },
        "phase_2_formal_investigation": {
            "duration_days": 9 * 30,
            "trigger": "Phase 1 finding of reasonable grounds",
            "powers": [
                "Request information from operators",
                "Conduct checks and inspections",
                "Commission studies and expert assessments",
            ],
        },
        "phase_3_decision": {
            "outcomes": ["Prohibition decision", "Closure", "Withdrawal of market access"],
            "appeal_right": "EU Court of Justice (Art 263 TFEU)",
        },
    },
    "enforcement_bodies": {
        "lead": "European Commission (for products with significant trade flows across multiple MS)",
        "national_authorities": "Designated by each EU Member State",
        "coordination": "Network of national authorities; Commission acts as coordinator",
    },
    "due_diligence_requirements": [
        "Map supply chain to identify forced labour risk country/sector combinations",
        "Conduct risk-based due diligence aligned with OECD DDG or UN Guiding Principles",
        "Obtain and verify supplier declarations on no forced labour",
        "Implement grievance mechanism accessible to supply chain workers",
        "Maintain records for 5 years",
        "Publish annual transparency statement (aligned with UK MSA/CSDDD)",
    ],
    "documentation_standards": [
        "Supply chain mapping documentation (tier 1 to raw material)",
        "Audit reports from accredited social compliance bodies",
        "Worker interview protocols and results",
        "Corrective Action Plans (CAPs) and closure evidence",
        "Supplier code of conduct acknowledgement records",
    ],
    "linkage_to_csddd": (
        "EU FLR 2024/3015 and EU CSDDD (Directive 2024/1760) are complementary; CSDDD DD "
        "framework satisfies EU FLR due diligence obligations for in-scope companies"
    ),
}

# ---------------------------------------------------------------------------
# UK MODERN SLAVERY ACT 2015 — SECTION 54
# ---------------------------------------------------------------------------

UK_MSA_DATA: dict = {
    "legislation": "Modern Slavery Act 2015, Section 54 — Transparency in Supply Chains",
    "reporting_threshold_gbp": 36_000_000,
    "deadline": "Within 6 months of financial year end",
    "publication_requirement": "Prominent link on homepage; signed by director; board approval",
    "six_prescribed_areas": [
        {
            "id": "area_1",
            "name": "Organisation Structure and Supply Chains",
            "description": "Description of structure, business, and supply chains",
            "home_office_weight": 0.15,
        },
        {
            "id": "area_2",
            "name": "Policies in Relation to Slavery and Human Trafficking",
            "description": "Policies addressing slavery and human trafficking risk",
            "home_office_weight": 0.20,
        },
        {
            "id": "area_3",
            "name": "Due Diligence Processes",
            "description": "Due diligence processes in business and supply chains",
            "home_office_weight": 0.20,
        },
        {
            "id": "area_4",
            "name": "Risk Assessment and Management",
            "description": "Parts of business/supply chain where risk is highest; steps taken to manage",
            "home_office_weight": 0.20,
        },
        {
            "id": "area_5",
            "name": "Key Performance Indicators",
            "description": "KPIs to measure effectiveness; description of what the organisation is doing",
            "home_office_weight": 0.15,
        },
        {
            "id": "area_6",
            "name": "Training on Modern Slavery",
            "description": "Training about slavery and human trafficking available to staff",
            "home_office_weight": 0.10,
        },
    ],
    "home_office_quality_tiers": {
        "tier_1_poor": {
            "score_range": [0, 20],
            "description": "Statement does not meet minimum statutory requirements",
            "areas_covered": 0,
        },
        "tier_2_basic": {
            "score_range": [21, 40],
            "description": "Minimal compliance; statement covers some areas superficially",
            "areas_covered": "1-2",
        },
        "tier_3_developing": {
            "score_range": [41, 55],
            "description": "Moderate compliance; some meaningful content; gaps remain",
            "areas_covered": "3-4",
        },
        "tier_4_good": {
            "score_range": [56, 70],
            "description": "Good compliance; covers all 6 areas with reasonable depth",
            "areas_covered": "5-6",
        },
        "tier_5_advanced": {
            "score_range": [71, 85],
            "description": "Advanced; specific actions, data, and measurable KPIs",
            "areas_covered": "all_6_with_depth",
        },
        "tier_6_leading": {
            "score_range": [86, 100],
            "description": "Leading practice; worker voice, remedy, continuous improvement",
            "areas_covered": "all_6_plus_best_practice",
        },
    },
    "home_office_guidance_criteria": {
        "worker_voice": "Evidence that workers in supply chain were consulted or surveyed",
        "specific_actions": "Named specific actions taken (not just policies stated)",
        "measurable_kpis": "Quantified KPIs with year-over-year comparison",
        "remedy": "Description of how remedy is provided to identified victims",
        "supplier_engagement": "Supplier assessment and engagement documented",
        "continuous_improvement": "Year-on-year improvement clearly evidenced",
    },
}

# ---------------------------------------------------------------------------
# 25 HIGH-RISK SECTOR PROFILES
# ---------------------------------------------------------------------------

HIGH_RISK_SECTORS: dict[str, dict] = {
    "garments_textiles_bangladesh": {
        "sector": "Garments & Textiles",
        "geography": "Bangladesh",
        "forced_labour_risk": "very_high",
        "child_labour_risk": "high",
        "debt_bondage_risk": "high",
        "key_ilo_indicators": [1, 2, 8, 9, 11],
        "primary_commodities": ["cotton", "polyester", "garments"],
        "applicable_regulations": ["UK MSA 2015", "EU FLR 2024/3015", "UFLPA (cotton links)"],
        "recommended_audit": "SMETA 4-Pillar",
        "ilo_conventions_at_risk": ["C29", "C138", "C182"],
        "notes": "Rana Plaza legacy; homeworkers remain outside audit scope",
    },
    "garments_textiles_vietnam": {
        "sector": "Garments & Textiles",
        "geography": "Vietnam",
        "forced_labour_risk": "high",
        "child_labour_risk": "medium",
        "debt_bondage_risk": "medium",
        "key_ilo_indicators": [1, 6, 8, 11],
        "primary_commodities": ["garments", "footwear", "textiles"],
        "applicable_regulations": ["UK MSA 2015", "EU FLR 2024/3015"],
        "recommended_audit": "SMETA or BSCI",
        "ilo_conventions_at_risk": ["C29", "C87"],
        "notes": "Freedom of association restrictions; migrant worker vulnerability",
    },
    "garments_textiles_cambodia": {
        "sector": "Garments & Textiles",
        "geography": "Cambodia",
        "forced_labour_risk": "high",
        "child_labour_risk": "medium",
        "debt_bondage_risk": "high",
        "key_ilo_indicators": [1, 9, 10, 11],
        "primary_commodities": ["garments", "footwear"],
        "applicable_regulations": ["UK MSA 2015", "EU FLR 2024/3015"],
        "recommended_audit": "SMETA 4-Pillar",
        "ilo_conventions_at_risk": ["C29", "C138"],
        "notes": "Informal subcontracting chain is primary risk vector",
    },
    "garments_textiles_myanmar": {
        "sector": "Garments & Textiles",
        "geography": "Myanmar",
        "forced_labour_risk": "critical",
        "child_labour_risk": "very_high",
        "debt_bondage_risk": "very_high",
        "key_ilo_indicators": [1, 5, 6, 9, 10],
        "primary_commodities": ["garments", "textiles"],
        "applicable_regulations": ["UK MSA 2015", "EU FLR 2024/3015", "CAHRA"],
        "recommended_audit": "SA8000 (where feasible); SMETA suspended post-coup",
        "ilo_conventions_at_risk": ["C29", "C105", "C138", "C182"],
        "notes": "Post-2021 coup: military-linked businesses; ILO on-site access restricted",
    },
    "electronics_china": {
        "sector": "Electronics",
        "geography": "China",
        "forced_labour_risk": "very_high",
        "child_labour_risk": "medium",
        "debt_bondage_risk": "medium",
        "key_ilo_indicators": [1, 4, 6, 11],
        "primary_commodities": ["polysilicon", "electronics", "semiconductors", "batteries"],
        "applicable_regulations": ["UFLPA", "UK MSA 2015", "EU FLR 2024/3015"],
        "recommended_audit": "SMETA; RBA VAP (electronics specific)",
        "ilo_conventions_at_risk": ["C29", "C87", "C98"],
        "notes": "UFLPA rebuttable presumption applies to XUAR-origin inputs",
    },
    "electronics_malaysia": {
        "sector": "Electronics",
        "geography": "Malaysia",
        "forced_labour_risk": "high",
        "child_labour_risk": "low",
        "debt_bondage_risk": "very_high",
        "key_ilo_indicators": [1, 7, 9, 11],
        "primary_commodities": ["semiconductors", "electronics", "rubber gloves"],
        "applicable_regulations": ["UFLPA (forced labour goods)", "UK MSA 2015", "EU FLR 2024/3015"],
        "recommended_audit": "SMETA; RBA VAP",
        "ilo_conventions_at_risk": ["C29", "C181"],
        "notes": "Migrant worker debt bondage; Top Glove case precedent",
    },
    "electronics_philippines": {
        "sector": "Electronics",
        "geography": "Philippines",
        "forced_labour_risk": "medium",
        "child_labour_risk": "medium",
        "debt_bondage_risk": "medium",
        "key_ilo_indicators": [1, 8, 9],
        "primary_commodities": ["electronics", "semiconductors"],
        "applicable_regulations": ["UK MSA 2015", "EU FLR 2024/3015"],
        "recommended_audit": "SMETA 2-Pillar or BSCI",
        "ilo_conventions_at_risk": ["C29", "C138"],
        "notes": "Subcontracting and homework risk in electronics assembly",
    },
    "mining_cobalt_drc": {
        "sector": "Mining — Cobalt",
        "geography": "Democratic Republic of Congo",
        "forced_labour_risk": "critical",
        "child_labour_risk": "critical",
        "debt_bondage_risk": "high",
        "key_ilo_indicators": [1, 5, 9, 10],
        "primary_commodities": ["cobalt", "copper", "coltan"],
        "applicable_regulations": ["UK MSA 2015", "EU FLR 2024/3015", "CAHRA", "OECD DDG Annex II"],
        "recommended_audit": "OECD DDG Step-by-Step; RMAP (Responsible Minerals Assurance Process)",
        "ilo_conventions_at_risk": ["C29", "C138", "C182"],
        "notes": "ASM (artisanal small-scale mining) — child labour endemic; CAHRA zone",
    },
    "mining_cobalt_congo": {
        "sector": "Mining — Cobalt",
        "geography": "Republic of Congo",
        "forced_labour_risk": "high",
        "child_labour_risk": "high",
        "debt_bondage_risk": "medium",
        "key_ilo_indicators": [1, 5, 10],
        "primary_commodities": ["cobalt", "copper"],
        "applicable_regulations": ["UK MSA 2015", "EU FLR 2024/3015", "CAHRA"],
        "recommended_audit": "RMAP; OECD DDG",
        "ilo_conventions_at_risk": ["C29", "C182"],
        "notes": "Conflict-affected; governance gaps",
    },
    "agriculture_brazil": {
        "sector": "Agriculture — Sugarcane & Soy",
        "geography": "Brazil",
        "forced_labour_risk": "high",
        "child_labour_risk": "medium",
        "debt_bondage_risk": "very_high",
        "key_ilo_indicators": [2, 9, 10, 11],
        "primary_commodities": ["sugarcane", "soy", "cattle"],
        "applicable_regulations": ["UK MSA 2015", "EU FLR 2024/3015", "EUDR"],
        "recommended_audit": "Bonsucro; RSPO; Rainforest Alliance",
        "ilo_conventions_at_risk": ["C29", "C105"],
        "notes": "Lista Suja (Dirty List) — MTE enforcement; rural labour intermediaries",
    },
    "agriculture_india": {
        "sector": "Agriculture — Cotton & Tea",
        "geography": "India",
        "forced_labour_risk": "high",
        "child_labour_risk": "high",
        "debt_bondage_risk": "very_high",
        "key_ilo_indicators": [1, 9, 10],
        "primary_commodities": ["cotton", "tea", "sugar", "mica"],
        "applicable_regulations": ["UK MSA 2015", "EU FLR 2024/3015"],
        "recommended_audit": "Better Cotton; Rainforest Alliance; Fair Labor Association",
        "ilo_conventions_at_risk": ["C29", "C138", "C182"],
        "notes": "Sumangali scheme; bonded labour in agriculture; mica mining",
    },
    "agriculture_west_africa": {
        "sector": "Agriculture — Cocoa",
        "geography": "West Africa (Ghana, Côte d'Ivoire)",
        "forced_labour_risk": "very_high",
        "child_labour_risk": "critical",
        "debt_bondage_risk": "high",
        "key_ilo_indicators": [1, 8, 9, 10],
        "primary_commodities": ["cocoa", "coffee", "palm oil"],
        "applicable_regulations": ["UK MSA 2015", "EU FLR 2024/3015", "EUDR"],
        "recommended_audit": "Rainforest Alliance; Fair Trade; UTZ",
        "ilo_conventions_at_risk": ["C29", "C138", "C182"],
        "notes": "Child labour in cocoa estimated 1.5M children (ILO 2020); CLMRS systems",
    },
    "fishing_seafood_thailand": {
        "sector": "Fishing & Seafood",
        "geography": "Thailand",
        "forced_labour_risk": "very_high",
        "child_labour_risk": "medium",
        "debt_bondage_risk": "very_high",
        "key_ilo_indicators": [1, 3, 4, 7, 9],
        "primary_commodities": ["shrimp", "tuna", "fishmeal"],
        "applicable_regulations": ["UK MSA 2015", "EU FLR 2024/3015"],
        "recommended_audit": "SMETA 4-Pillar; MSC CoC",
        "ilo_conventions_at_risk": ["C29", "C188"],
        "notes": "ILO C188 Work in Fishing; at-sea abuse; Thai government TIP reform",
    },
    "fishing_seafood_indonesia": {
        "sector": "Fishing & Seafood",
        "geography": "Indonesia",
        "forced_labour_risk": "high",
        "child_labour_risk": "medium",
        "debt_bondage_risk": "high",
        "key_ilo_indicators": [1, 3, 4, 9, 10],
        "primary_commodities": ["tuna", "shrimp", "palm oil"],
        "applicable_regulations": ["UK MSA 2015", "EU FLR 2024/3015", "EUDR"],
        "recommended_audit": "SMETA 4-Pillar; RSPO",
        "ilo_conventions_at_risk": ["C29", "C188"],
        "notes": "Distant water fishing fleets; transhipment at sea",
    },
    "fishing_seafood_china": {
        "sector": "Fishing & Seafood",
        "geography": "China",
        "forced_labour_risk": "high",
        "child_labour_risk": "low",
        "debt_bondage_risk": "medium",
        "key_ilo_indicators": [4, 6, 11],
        "primary_commodities": ["seafood", "fishmeal"],
        "applicable_regulations": ["UFLPA (XUAR links)", "UK MSA 2015", "EU FLR 2024/3015"],
        "recommended_audit": "SMETA 4-Pillar",
        "ilo_conventions_at_risk": ["C29"],
        "notes": "Distant water fleet; North Korean forced workers documented on vessels",
    },
    "construction_gulf_states": {
        "sector": "Construction",
        "geography": "Gulf States (UAE, Qatar, Saudi Arabia, Kuwait, Bahrain)",
        "forced_labour_risk": "very_high",
        "child_labour_risk": "low",
        "debt_bondage_risk": "very_high",
        "key_ilo_indicators": [1, 7, 9, 10],
        "primary_commodities": ["construction labour services"],
        "applicable_regulations": ["UK MSA 2015", "EU FLR 2024/3015"],
        "recommended_audit": "SMETA 4-Pillar; PSCI (migrant workers focus)",
        "ilo_conventions_at_risk": ["C29", "C97", "C143"],
        "notes": "Kafala sponsorship system; Qatar World Cup 2022 migrant deaths; ILO reform MOU",
    },
    "construction_singapore": {
        "sector": "Construction",
        "geography": "Singapore",
        "forced_labour_risk": "medium",
        "child_labour_risk": "very_low",
        "debt_bondage_risk": "high",
        "key_ilo_indicators": [1, 7, 9],
        "primary_commodities": ["construction labour services"],
        "applicable_regulations": ["UK MSA 2015"],
        "recommended_audit": "SMETA 2-Pillar",
        "ilo_conventions_at_risk": ["C29"],
        "notes": "Work Permit system; MOM enforcement improving; recruitment fee risk",
    },
    "domestic_work_middle_east": {
        "sector": "Domestic Work",
        "geography": "Middle East (Lebanon, Jordan, Kuwait, UAE)",
        "forced_labour_risk": "critical",
        "child_labour_risk": "medium",
        "debt_bondage_risk": "critical",
        "key_ilo_indicators": [1, 3, 4, 5, 7, 9],
        "primary_commodities": ["domestic labour services"],
        "applicable_regulations": ["UK MSA 2015", "EU FLR 2024/3015"],
        "recommended_audit": "ILO C189 compliance assessment; UN Special Procedures",
        "ilo_conventions_at_risk": ["C29", "C189"],
        "notes": "Kafala; exclusion from labour law; confiscated passports; Lebanon crisis",
    },
    "brick_kilns_india": {
        "sector": "Brick Kilns",
        "geography": "India",
        "forced_labour_risk": "critical",
        "child_labour_risk": "critical",
        "debt_bondage_risk": "critical",
        "key_ilo_indicators": [1, 9, 10, 11],
        "primary_commodities": ["bricks", "construction materials"],
        "applicable_regulations": ["UK MSA 2015", "EU FLR 2024/3015"],
        "recommended_audit": "GoodWeave-style traceability; SA8000",
        "ilo_conventions_at_risk": ["C29", "C105", "C138", "C182"],
        "notes": "Peshgi advance-payment system; entire family units bonded",
    },
    "brick_kilns_pakistan": {
        "sector": "Brick Kilns",
        "geography": "Pakistan",
        "forced_labour_risk": "critical",
        "child_labour_risk": "critical",
        "debt_bondage_risk": "critical",
        "key_ilo_indicators": [1, 9, 10],
        "primary_commodities": ["bricks"],
        "applicable_regulations": ["UK MSA 2015", "EU FLR 2024/3015"],
        "recommended_audit": "ILO Better Work adaptation; SA8000",
        "ilo_conventions_at_risk": ["C29", "C105", "C138", "C182"],
        "notes": "Estimated 4.5M bonded workers in brick kilns (ILO 2019)",
    },
    "brick_kilns_nepal": {
        "sector": "Brick Kilns",
        "geography": "Nepal",
        "forced_labour_risk": "high",
        "child_labour_risk": "high",
        "debt_bondage_risk": "high",
        "key_ilo_indicators": [1, 9, 10],
        "primary_commodities": ["bricks"],
        "applicable_regulations": ["UK MSA 2015"],
        "recommended_audit": "SA8000; ILO national programme",
        "ilo_conventions_at_risk": ["C29", "C138", "C182"],
        "notes": "Post-earthquake reconstruction demand; migrant worker exploitation",
    },
    "sugar_cocoa_west_africa": {
        "sector": "Sugar & Cocoa Farming",
        "geography": "West Africa",
        "forced_labour_risk": "very_high",
        "child_labour_risk": "critical",
        "debt_bondage_risk": "high",
        "key_ilo_indicators": [1, 8, 9],
        "primary_commodities": ["cocoa", "sugar"],
        "applicable_regulations": ["UK MSA 2015", "EU FLR 2024/3015", "EUDR"],
        "recommended_audit": "Rainforest Alliance; Fair Trade; CLMRS",
        "ilo_conventions_at_risk": ["C29", "C138", "C182"],
        "notes": "Child Labour Monitoring and Remediation Systems (CLMRS) — industry standard",
    },
    "palm_oil_indonesia": {
        "sector": "Palm Oil",
        "geography": "Indonesia",
        "forced_labour_risk": "high",
        "child_labour_risk": "high",
        "debt_bondage_risk": "medium",
        "key_ilo_indicators": [1, 10, 11],
        "primary_commodities": ["palm oil", "palm kernel oil"],
        "applicable_regulations": ["UK MSA 2015", "EU FLR 2024/3015", "EUDR", "UFLPA potential"],
        "recommended_audit": "RSPO; ISPO; SMETA 4-Pillar",
        "ilo_conventions_at_risk": ["C29", "C138"],
        "notes": "Smallholder risk; no-deforestation–no-forced-labour nexus",
    },
    "palm_oil_malaysia": {
        "sector": "Palm Oil",
        "geography": "Malaysia",
        "forced_labour_risk": "very_high",
        "child_labour_risk": "medium",
        "debt_bondage_risk": "very_high",
        "key_ilo_indicators": [1, 7, 9, 11],
        "primary_commodities": ["palm oil"],
        "applicable_regulations": ["UFLPA", "UK MSA 2015", "EU FLR 2024/3015", "EUDR"],
        "recommended_audit": "RSPO; SMETA 4-Pillar",
        "ilo_conventions_at_risk": ["C29", "C181"],
        "notes": "CBP WRO (Withhold Release Order) on FGV Holdings — precedent case",
    },
}

# ---------------------------------------------------------------------------
# 15 AUDIT SCHEMES
# ---------------------------------------------------------------------------

AUDIT_SCHEMES: dict[str, dict] = {
    "smeta": {
        "name": "SMETA (Sedex Members Ethical Trade Audit)",
        "organisation": "Sedex",
        "scope": "Labour, health & safety, environment, business ethics",
        "pillars_2": ["Labour", "Health & Safety"],
        "pillars_4": ["Labour", "Health & Safety", "Environment", "Business Ethics"],
        "accreditation_body": "Sedex",
        "effectiveness_rating": "high",
        "forced_labour_coverage": "strong",
        "worker_interview": True,
        "announcement": "semi-announced",
        "global_recognition": "very_high",
        "limitations": "Audit capture rate; announced audits gaming; corrective action follow-up",
        "cost_usd": {"2_pillar": 800, "4_pillar": 1200},
    },
    "sa8000": {
        "name": "SA8000 Social Accountability Standard",
        "organisation": "Social Accountability International (SAI)",
        "scope": "9 elements: child labour, forced labour, OSH, freedom of association, discrimination, "
                 "disciplinary practices, working hours, remuneration, management systems",
        "accreditation_body": "SAI — SAAS (Social Accountability Accreditation Services)",
        "effectiveness_rating": "very_high",
        "forced_labour_coverage": "very_strong",
        "worker_interview": True,
        "announcement": "unannounced_possible",
        "global_recognition": "high",
        "limitations": "Certification cost; limited uptake in fast fashion; annual recertification",
        "cost_usd": {"certification": 3000, "annual_surveillance": 1500},
    },
    "bsci": {
        "name": "BSCI (Business Social Compliance Initiative)",
        "organisation": "amfori",
        "scope": "11 rights of workers: workers' involvement, freedom of association, "
                 "no discrimination, fair remuneration, decent working hours, "
                 "occupational safety, no child labour, no forced labour, "
                 "no precarious employment, access to remedy, social management",
        "accreditation_body": "amfori",
        "effectiveness_rating": "medium",
        "forced_labour_coverage": "moderate",
        "worker_interview": True,
        "announcement": "announced",
        "global_recognition": "high",
        "limitations": "Announced audits; primarily EU-centric; no certification — assessment only",
        "cost_usd": {"assessment": 600},
    },
    "amfori": {
        "name": "amfori BEPI (Environmental Performance Index)",
        "organisation": "amfori",
        "scope": "Environmental sustainability in supply chains",
        "accreditation_body": "amfori",
        "effectiveness_rating": "medium",
        "forced_labour_coverage": "low",
        "worker_interview": False,
        "announcement": "announced",
        "global_recognition": "medium",
        "limitations": "Environmental focus; limited forced labour coverage",
        "cost_usd": {"assessment": 500},
    },
    "wrap": {
        "name": "WRAP (Worldwide Responsible Accredited Production)",
        "organisation": "WRAP",
        "scope": "12 principles: laws/regulations, prohibition of forced/child labour, "
                 "harassment/abuse, compensation, working hours, freedom of association, "
                 "environment, customs compliance, security, no forced labour",
        "accreditation_body": "WRAP",
        "effectiveness_rating": "medium",
        "forced_labour_coverage": "moderate",
        "worker_interview": True,
        "announcement": "announced",
        "global_recognition": "medium",
        "limitations": "Factory self-certified; less rigorous than SA8000; apparel-focused",
        "cost_usd": {"certification": 1200},
    },
    "icti": {
        "name": "ICTI (International Council of Toy Industries) CARE Process",
        "organisation": "ICTI CARE",
        "scope": "Toy and play industry: labour standards, wages, hours, safety",
        "accreditation_body": "ICTI CARE Foundation",
        "effectiveness_rating": "medium",
        "forced_labour_coverage": "moderate",
        "worker_interview": True,
        "announcement": "semi-announced",
        "global_recognition": "medium",
        "limitations": "Toy sector only; China-heavy coverage",
        "cost_usd": {"audit": 900},
    },
    "psci": {
        "name": "PSCI (Pharmaceutical Supply Chain Initiative)",
        "organisation": "PSCI",
        "scope": "Pharma supply chain: ethics, labour, health & safety, environment, management",
        "accreditation_body": "PSCI",
        "effectiveness_rating": "medium",
        "forced_labour_coverage": "moderate",
        "worker_interview": True,
        "announcement": "announced",
        "global_recognition": "medium",
        "limitations": "Pharma sector only; limited Asia coverage",
        "cost_usd": {"audit": 1000},
    },
    "fair_trade": {
        "name": "Fair Trade Certification",
        "organisation": "Fairtrade International / Fair Trade USA",
        "scope": "Smallholder farmers and workers: fair prices, labour standards, community development",
        "accreditation_body": "FLOCERT",
        "effectiveness_rating": "high",
        "forced_labour_coverage": "strong",
        "worker_interview": True,
        "announcement": "unannounced",
        "global_recognition": "very_high",
        "limitations": "Premium cost; farmer cooperative only — not large estates in some cases",
        "cost_usd": {"certification": 1500, "annual": 800},
    },
    "rainforest_alliance": {
        "name": "Rainforest Alliance Certification",
        "organisation": "Rainforest Alliance",
        "scope": "Agriculture & forestry: environment, social (labour), economic sustainability",
        "accreditation_body": "Rainforest Alliance",
        "effectiveness_rating": "high",
        "forced_labour_coverage": "strong",
        "worker_interview": True,
        "announcement": "semi-announced",
        "global_recognition": "very_high",
        "limitations": "Grievance mechanism uptake; complex smallholder supply chains",
        "cost_usd": {"certification": 1200},
    },
    "fsc": {
        "name": "FSC (Forest Stewardship Council) Chain of Custody",
        "organisation": "FSC",
        "scope": "Forestry and wood products: environmental and social standards",
        "accreditation_body": "FSC Accreditation Services International (ASI)",
        "effectiveness_rating": "high",
        "forced_labour_coverage": "moderate",
        "worker_interview": False,
        "announcement": "unannounced",
        "global_recognition": "very_high",
        "limitations": "Labour standards secondary to environmental; CoC not always site-visit",
        "cost_usd": {"coc_certification": 1000},
    },
    "rspo": {
        "name": "RSPO (Roundtable on Sustainable Palm Oil)",
        "organisation": "RSPO",
        "scope": "Palm oil: no deforestation, no exploitation, free prior informed consent, labour rights",
        "accreditation_body": "RSPO Secretariat / accredited CBs",
        "effectiveness_rating": "high",
        "forced_labour_coverage": "strong",
        "worker_interview": True,
        "announcement": "semi-announced",
        "global_recognition": "very_high",
        "limitations": "Smallholder inclusion; mass balance traceability dilution",
        "cost_usd": {"certification": 1500, "annual": 750},
    },
    "better_cotton": {
        "name": "Better Cotton Initiative (BCI)",
        "organisation": "Better Cotton",
        "scope": "Cotton: water, soil, natural habitats, fibres quality, labour, community",
        "accreditation_body": "Better Cotton",
        "effectiveness_rating": "medium",
        "forced_labour_coverage": "moderate",
        "worker_interview": True,
        "announcement": "announced",
        "global_recognition": "high",
        "limitations": "Mass balance — no physical separation guarantee; UFLPA Xinjiang cotton risk",
        "cost_usd": {"membership": 500},
    },
    "fair_labor_association": {
        "name": "Fair Labor Association (FLA)",
        "organisation": "Fair Labor Association",
        "scope": "Apparel, footwear, agriculture: FLA Workplace Code of Conduct (9 elements)",
        "accreditation_body": "FLA",
        "effectiveness_rating": "high",
        "forced_labour_coverage": "strong",
        "worker_interview": True,
        "announcement": "unannounced",
        "global_recognition": "high",
        "limitations": "Brand-driven; multi-year accreditation cycle",
        "cost_usd": {"accreditation": 5000, "annual": 2500},
    },
    "workers_rights_consortium": {
        "name": "Workers Rights Consortium (WRC)",
        "organisation": "Workers Rights Consortium",
        "scope": "Collegiate apparel: factory disclosure, independent investigation, remediation",
        "accreditation_body": "WRC",
        "effectiveness_rating": "high",
        "forced_labour_coverage": "strong",
        "worker_interview": True,
        "announcement": "unannounced",
        "global_recognition": "medium",
        "limitations": "Collegiate apparel focus; US market primarily",
        "cost_usd": {"affiliation": 2500},
    },
    "clean_clothes_campaign": {
        "name": "Clean Clothes Campaign (CCC)",
        "organisation": "Clean Clothes Campaign",
        "scope": "Advocacy + emergency response: wages, working conditions, union rights in garments",
        "accreditation_body": "N/A (advocacy body, not certification scheme)",
        "effectiveness_rating": "high",
        "forced_labour_coverage": "strong",
        "worker_interview": True,
        "announcement": "n/a",
        "global_recognition": "high",
        "limitations": "Advocacy not certification; no formal audit cycle; complaint-driven",
        "cost_usd": {},
    },
}

# ---------------------------------------------------------------------------
# CAHRA — Conflict-Affected and High-Risk Areas (OECD Annex II)
# ---------------------------------------------------------------------------

CAHRA_COUNTRIES: dict[str, dict] = {
    "DRC": {"name": "Democratic Republic of Congo", "risk_type": ["armed_conflict", "child_labour", "forced_labour"], "primary_commodities": ["cobalt", "coltan", "gold", "diamonds"]},
    "Myanmar": {"name": "Myanmar", "risk_type": ["state_imposed_forced_labour", "armed_conflict", "ethnic_persecution"], "primary_commodities": ["jade", "garments", "teak", "natural_gas"]},
    "CAR": {"name": "Central African Republic", "risk_type": ["armed_conflict", "forced_labour"], "primary_commodities": ["diamonds", "timber", "gold"]},
    "South_Sudan": {"name": "South Sudan", "risk_type": ["armed_conflict", "forced_labour"], "primary_commodities": ["oil", "cattle"]},
    "Somalia": {"name": "Somalia", "risk_type": ["armed_conflict", "piracy_at_sea", "forced_labour"], "primary_commodities": ["charcoal", "seafood", "livestock"]},
    "Mali": {"name": "Mali", "risk_type": ["armed_conflict", "forced_labour", "child_labour"], "primary_commodities": ["gold", "cotton"]},
    "Burkina_Faso": {"name": "Burkina Faso", "risk_type": ["armed_conflict", "forced_labour"], "primary_commodities": ["gold", "cotton"]},
    "Nigeria": {"name": "Nigeria (Delta / North-East)", "risk_type": ["armed_conflict", "forced_labour"], "primary_commodities": ["oil", "cocoa"]},
    "Sudan": {"name": "Sudan", "risk_type": ["armed_conflict", "state_imposed_forced_labour"], "primary_commodities": ["gold", "cotton", "gum_arabic"]},
    "Ethiopia": {"name": "Ethiopia (Tigray / Oromia)", "risk_type": ["armed_conflict", "forced_labour"], "primary_commodities": ["coffee", "sesame", "gold"]},
    "Eritrea": {"name": "Eritrea", "risk_type": ["state_imposed_forced_labour"], "primary_commodities": ["mining", "copper", "gold"]},
    "North_Korea": {"name": "North Korea", "risk_type": ["state_imposed_forced_labour", "overseas_worker_export"], "primary_commodities": ["minerals", "seafood", "textiles"]},
    "Xinjiang_China": {"name": "Xinjiang Uyghur Autonomous Region (China)", "risk_type": ["state_imposed_forced_labour", "surveillance_state"], "primary_commodities": ["cotton", "polysilicon", "tomatoes", "aluminium"]},
    "Tibet_China": {"name": "Tibet Autonomous Region (China)", "risk_type": ["state_imposed_forced_labour"], "primary_commodities": ["minerals", "livestock"]},
    "Afghanistan": {"name": "Afghanistan", "risk_type": ["armed_conflict", "forced_labour"], "primary_commodities": ["opium", "minerals", "cotton"]},
    "Yemen": {"name": "Yemen", "risk_type": ["armed_conflict", "forced_labour"], "primary_commodities": ["fishing", "oil"]},
    "Syria": {"name": "Syria", "risk_type": ["armed_conflict", "forced_labour", "displacement"], "primary_commodities": ["phosphate", "oil"]},
    "Iraq": {"name": "Iraq (certain regions)", "risk_type": ["armed_conflict", "forced_labour"], "primary_commodities": ["oil", "dates"]},
    "Libya": {"name": "Libya", "risk_type": ["armed_conflict", "migrant_trafficking"], "primary_commodities": ["oil", "transit_route"]},
    "Venezuela": {"name": "Venezuela", "risk_type": ["forced_labour", "economic_collapse"], "primary_commodities": ["gold", "oil", "coltan"]},
    "Bolivia": {"name": "Bolivia (mining regions)", "risk_type": ["child_labour", "forced_labour"], "primary_commodities": ["tin", "silver", "gold"]},
    "Colombia": {"name": "Colombia (FARC regions)", "risk_type": ["armed_conflict", "forced_labour"], "primary_commodities": ["gold", "coal", "palm_oil"]},
    "Philippines_Mindanao": {"name": "Philippines (Mindanao)", "risk_type": ["armed_conflict", "forced_labour"], "primary_commodities": ["pineapple", "palm_oil", "nickel"]},
    "Lebanon": {"name": "Lebanon", "risk_type": ["economic_crisis", "kafala_migrant_exploitation"], "primary_commodities": ["domestic_labour_import"]},
    "Haiti": {"name": "Haiti", "risk_type": ["armed_conflict", "child_servitude_restavek"], "primary_commodities": ["garments", "agricultural_produce"]},
}

# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------

class AssessForcedLabourRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    entity_name: str = Field(..., description="Company or entity name")
    sector: str = Field(..., description="Primary sector from HIGH_RISK_SECTORS keys")
    supply_chain_countries: list[str] = Field(default_factory=list, description="ISO-2 country codes or country names")
    commodities: list[str] = Field(default_factory=list, description="Commodities sourced")
    annual_turnover_gbp: Optional[float] = Field(None, description="Annual turnover in GBP for UK MSA threshold check")
    has_msa_statement: bool = Field(False)
    has_eu_flr_programme: bool = Field(False)
    has_uflpa_compliance_programme: bool = Field(False)
    existing_audit_schemes: list[str] = Field(default_factory=list)
    tier1_supplier_count: Optional[int] = Field(None)
    tier2_supplier_count: Optional[int] = Field(None)
    known_xinjiang_links: bool = Field(False)
    known_cahra_links: bool = Field(False)

class AssessForcedLabourResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    entity_name: str
    assessment_date: str
    uk_msa_score: float
    uk_msa_tier: str
    eu_flr_readiness_score: float
    eu_flr_status: str
    uflpa_exposure_score: float
    uflpa_risk_level: str
    ilo_composite_score: float
    child_labour_risk: str
    debt_bondage_risk: str
    overall_risk_tier: str
    sector_profile: Optional[dict]
    cahra_flags: list[str]
    top_ilo_indicators_triggered: list[dict]
    recommended_actions: list[str]
    recommended_audit_schemes: list[str]


class SupplierTierData(BaseModel):
    model_config = {"protected_namespaces": ()}
    supplier_id: str
    supplier_name: str
    tier: int = Field(..., ge=1, le=4)
    country: str
    commodities: list[str]
    sector: str
    existing_audits: list[str] = Field(default_factory=list)
    last_audit_year: Optional[int] = None

class SupplierScreenRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    suppliers: list[SupplierTierData]

class SupplierScreenResult(BaseModel):
    model_config = {"protected_namespaces": ()}
    supplier_id: str
    supplier_name: str
    tier: int
    country: str
    ilo_risk_flags: list[str]
    uflpa_flag: bool
    cahra_flag: bool
    forced_labour_risk: str
    child_labour_risk: str
    audit_status: str
    recommended_audit_scheme: str
    priority_score: float

class SupplierScreenResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    total_suppliers: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    uflpa_flagged: int
    cahra_flagged: int
    results: list[SupplierScreenResult]


class MsaStatementData(BaseModel):
    model_config = {"protected_namespaces": ()}
    entity_name: str
    financial_year: str
    turnover_gbp: Optional[float] = None
    covers_area_1_structure: bool = False
    covers_area_2_policies: bool = False
    covers_area_3_due_diligence: bool = False
    covers_area_4_risk_management: bool = False
    covers_area_5_kpis: bool = False
    covers_area_6_training: bool = False
    has_quantified_kpis: bool = False
    has_worker_voice_evidence: bool = False
    has_remedy_description: bool = False
    has_specific_named_actions: bool = False
    has_supplier_engagement: bool = False
    has_year_on_year_improvement: bool = False
    board_approved: bool = False
    homepage_link: bool = False
    director_signed: bool = False

class MsaStatementResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    entity_name: str
    is_above_threshold: Optional[bool]
    total_score: float
    areas_covered: int
    home_office_tier: str
    home_office_tier_description: str
    area_scores: dict[str, float]
    improvement_recommendations: list[str]
    best_practice_gaps: list[str]


class UflpaProductData(BaseModel):
    model_config = {"protected_namespaces": ()}
    product_name: str
    hs_code: Optional[str] = None
    commodities: list[str]
    supplier_countries: list[str]
    has_xinjiang_links: bool = False
    entity_list_checked: bool = False
    has_supply_chain_mapping: bool = False
    has_third_party_audit: bool = False
    has_mill_certificates: bool = False
    has_isotope_testing: bool = False
    has_supplier_declarations: bool = False

class UflpaExposureResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    product_name: str
    xinjiang_exposure_pct: float
    cbp_enforcement_risk: str
    rebuttable_presumption_triggered: bool
    high_risk_commodities_present: list[str]
    documentation_gap_count: int
    documentation_requirements: list[str]
    documentation_met: list[str]
    documentation_missing: list[str]
    recommended_actions: list[str]
    import_risk_summary: str


# ---------------------------------------------------------------------------
# Engine Class
# ---------------------------------------------------------------------------

class ModernSlaveryEngine:
    """
    E114 — Modern Slavery & Forced Labour Risk Engine.
    Covers UFLPA, EU FLR 2024/3015, UK MSA 2015, ILO 11 indicators, CAHRA.
    No DB calls — deterministic scoring from reference data.
    """

    # ------------------------------------------------------------------
    # 1. Full forced labour risk assessment
    # ------------------------------------------------------------------

    def assess_forced_labour_risk(
        self,
        entity_data: AssessForcedLabourRequest,
    ) -> AssessForcedLabourResponse:
        ed = entity_data

        # --- ILO composite score ---
        sector_profile = HIGH_RISK_SECTORS.get(ed.sector)
        ilo_score, triggered = self._score_ilo_indicators(ed, sector_profile)

        # --- Child / debt bondage risks ---
        child_labour_risk = self._child_labour_risk(sector_profile, ed.supply_chain_countries)
        debt_bondage_risk = self._debt_bondage_risk(sector_profile, ed.supply_chain_countries)

        # --- UK MSA score ---
        uk_msa_score, uk_msa_tier = self._uk_msa_baseline(ed)

        # --- EU FLR readiness ---
        eu_flr_score, eu_flr_status = self._eu_flr_readiness(ed, sector_profile)

        # --- UFLPA exposure ---
        uflpa_score, uflpa_level = self._uflpa_baseline(ed)

        # --- CAHRA flags ---
        cahra_flags = self._check_cahra(ed.supply_chain_countries)

        # --- Overall risk tier ---
        overall_tier = self._overall_risk_tier(
            ilo_score, uflpa_score, child_labour_risk, debt_bondage_risk, cahra_flags
        )

        # --- Actions & audit recommendations ---
        actions = self._recommended_actions(
            overall_tier, eu_flr_status, uflpa_level, uk_msa_tier, ed
        )
        audit_rec = self._recommend_audit_schemes(ed.sector, ed.supply_chain_countries, ed.commodities)

        return AssessForcedLabourResponse(
            entity_name=ed.entity_name,
            assessment_date=datetime.utcnow().strftime("%Y-%m-%d"),
            uk_msa_score=round(uk_msa_score, 1),
            uk_msa_tier=uk_msa_tier,
            eu_flr_readiness_score=round(eu_flr_score, 1),
            eu_flr_status=eu_flr_status,
            uflpa_exposure_score=round(uflpa_score, 1),
            uflpa_risk_level=uflpa_level,
            ilo_composite_score=round(ilo_score, 1),
            child_labour_risk=child_labour_risk,
            debt_bondage_risk=debt_bondage_risk,
            overall_risk_tier=overall_tier,
            sector_profile=sector_profile,
            cahra_flags=cahra_flags,
            top_ilo_indicators_triggered=triggered[:5],
            recommended_actions=actions,
            recommended_audit_schemes=audit_rec,
        )

    # ------------------------------------------------------------------
    # 2. Supply chain screening
    # ------------------------------------------------------------------

    def screen_supply_chain(self, request: SupplierScreenRequest) -> SupplierScreenResponse:
        results: list[SupplierScreenResult] = []
        risk_counts: dict[str, int] = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        uflpa_count = 0
        cahra_count = 0

        for sup in request.suppliers:
            sp = HIGH_RISK_SECTORS.get(sup.sector) or HIGH_RISK_SECTORS.get(
                next((k for k in HIGH_RISK_SECTORS if sup.sector.lower() in k), None) or "", {}
            )

            forced_labour_risk = sp.get("forced_labour_risk", "medium") if sp else "medium"
            child_labour_risk = sp.get("child_labour_risk", "medium") if sp else "medium"

            # ILO flags
            ilo_flags: list[str] = []
            if sp:
                for ind_key in ILO_INDICATORS:
                    ind = ILO_INDICATORS[ind_key]
                    prev = ind.get("sector_prevalence", {})
                    sector_clean = sup.sector.lower().replace(" ", "_").replace("-", "_")
                    # match any key
                    if any(
                        sector_clean in k or k in sector_clean
                        for k, v in prev.items()
                        if v in ("very_high", "high")
                    ):
                        ilo_flags.append(f"{ind['name']} (ILO {ind['ilo_reference']})")

            # UFLPA flag
            uflpa_flag = any(
                c.lower() in ["china", "cn", "xuar", "xinjiang"]
                for c in ([sup.country] + sup.commodities)
            ) or any(
                com.lower() in ["cotton", "polysilicon", "tomatoes", "aluminium", "textiles", "electronics"]
                for com in sup.commodities
            )
            if uflpa_flag:
                uflpa_count += 1

            # CAHRA flag
            cahra_flag = any(
                sup.country.lower() in k.lower() or k.lower() in sup.country.lower()
                for k in CAHRA_COUNTRIES
            )
            if cahra_flag:
                cahra_count += 1

            # Audit status
            audit_status = "no_audit" if not sup.existing_audits else (
                "current" if sup.last_audit_year and sup.last_audit_year >= 2023 else "outdated"
            )

            # Recommended audit
            audit_rec = self._recommend_audit_schemes(sup.sector, [sup.country], sup.commodities)
            rec_audit = audit_rec[0] if audit_rec else "SMETA 4-Pillar"

            # Priority score (0-100)
            risk_map = {"very_high": 4, "high": 3, "medium": 2, "low": 1, "very_low": 0}
            base = risk_map.get(forced_labour_risk, 2) * 20
            priority = min(100.0, base + (10 if uflpa_flag else 0) + (10 if cahra_flag else 0)
                           + (5 if audit_status == "no_audit" else 0))

            if forced_labour_risk in ("critical", "very_high") or (uflpa_flag and cahra_flag):
                effective_risk = "critical"
            elif forced_labour_risk == "high" or uflpa_flag or cahra_flag:
                effective_risk = "high"
            elif forced_labour_risk == "medium":
                effective_risk = "medium"
            else:
                effective_risk = "low"

            risk_counts[effective_risk if effective_risk in risk_counts else "medium"] += 1

            results.append(SupplierScreenResult(
                supplier_id=sup.supplier_id,
                supplier_name=sup.supplier_name,
                tier=sup.tier,
                country=sup.country,
                ilo_risk_flags=ilo_flags[:6],
                uflpa_flag=uflpa_flag,
                cahra_flag=cahra_flag,
                forced_labour_risk=effective_risk,
                child_labour_risk=child_labour_risk,
                audit_status=audit_status,
                recommended_audit_scheme=rec_audit,
                priority_score=round(priority, 1),
            ))

        results.sort(key=lambda r: r.priority_score, reverse=True)

        return SupplierScreenResponse(
            total_suppliers=len(results),
            critical_count=risk_counts["critical"],
            high_count=risk_counts["high"],
            medium_count=risk_counts["medium"],
            low_count=risk_counts["low"],
            uflpa_flagged=uflpa_count,
            cahra_flagged=cahra_count,
            results=results,
        )

    # ------------------------------------------------------------------
    # 3. UK MSA Statement evaluation
    # ------------------------------------------------------------------

    def evaluate_msa_statement(self, statement: MsaStatementData) -> MsaStatementResponse:
        area_weights = {a["id"]: a["home_office_weight"] for a in UK_MSA_DATA["six_prescribed_areas"]}
        area_flags = {
            "area_1": statement.covers_area_1_structure,
            "area_2": statement.covers_area_2_policies,
            "area_3": statement.covers_area_3_due_diligence,
            "area_4": statement.covers_area_4_risk_management,
            "area_5": statement.covers_area_5_kpis,
            "area_6": statement.covers_area_6_training,
        }
        areas_covered = sum(1 for v in area_flags.values() if v)

        # Base score from area coverage
        base_score = sum(
            area_weights.get(aid, 0) * 60 for aid, covered in area_flags.items() if covered
        )

        # Best practice bonus (up to 40 extra points over base)
        bonus = 0.0
        if statement.has_quantified_kpis:
            bonus += 8.0
        if statement.has_worker_voice_evidence:
            bonus += 8.0
        if statement.has_remedy_description:
            bonus += 7.0
        if statement.has_specific_named_actions:
            bonus += 7.0
        if statement.has_supplier_engagement:
            bonus += 5.0
        if statement.has_year_on_year_improvement:
            bonus += 5.0

        # Procedural checks
        if not statement.board_approved:
            bonus -= 5.0
        if not statement.homepage_link:
            bonus -= 5.0
        if not statement.director_signed:
            bonus -= 5.0

        total_score = max(0.0, min(100.0, base_score + bonus))

        # Determine tier
        tier_key, tier_obj = "tier_1_poor", UK_MSA_DATA["home_office_quality_tiers"]["tier_1_poor"]
        for tk, tv in UK_MSA_DATA["home_office_quality_tiers"].items():
            lo, hi = tv["score_range"]
            if lo <= total_score <= hi:
                tier_key, tier_obj = tk, tv
                break

        # Improvement recommendations
        recs: list[str] = []
        bp_gaps: list[str] = []

        if not statement.covers_area_1_structure:
            recs.append("Add Section 54 Area 1: Describe organisational structure and supply chains")
        if not statement.covers_area_2_policies:
            recs.append("Add Section 54 Area 2: Document your modern slavery and human trafficking policy")
        if not statement.covers_area_3_due_diligence:
            recs.append("Add Section 54 Area 3: Describe due diligence processes including supplier audits")
        if not statement.covers_area_4_risk_management:
            recs.append("Add Section 54 Area 4: Identify highest-risk parts of supply chain and mitigation steps")
        if not statement.covers_area_5_kpis:
            recs.append("Add Section 54 Area 5: Publish KPIs to measure effectiveness of your programme")
        if not statement.covers_area_6_training:
            recs.append("Add Section 54 Area 6: Detail modern slavery training provided to staff")

        if not statement.board_approved:
            recs.append("Ensure statement is approved by the board of directors")
        if not statement.director_signed:
            recs.append("Statement must be signed by a director (or equivalent)")
        if not statement.homepage_link:
            recs.append("Publish prominent link to statement on company homepage")

        if not statement.has_quantified_kpis:
            bp_gaps.append("Include quantified KPIs with year-on-year comparison (leading practice)")
        if not statement.has_worker_voice_evidence:
            bp_gaps.append("Evidence worker voice — surveys or interviews of supply chain workers")
        if not statement.has_remedy_description:
            bp_gaps.append("Describe how remedy is provided when forced labour is identified")
        if not statement.has_specific_named_actions:
            bp_gaps.append("Name specific actions taken (not just policies) — e.g. supplier audits completed")
        if not statement.has_year_on_year_improvement:
            bp_gaps.append("Demonstrate year-on-year improvement clearly in the statement")

        is_above_threshold = (
            statement.turnover_gbp >= UK_MSA_DATA["reporting_threshold_gbp"]
            if statement.turnover_gbp is not None else None
        )

        return MsaStatementResponse(
            entity_name=statement.entity_name,
            is_above_threshold=is_above_threshold,
            total_score=round(total_score, 1),
            areas_covered=areas_covered,
            home_office_tier=tier_key,
            home_office_tier_description=tier_obj["description"],
            area_scores={aid: (area_weights.get(aid, 0) * 60 if covered else 0.0) for aid, covered in area_flags.items()},
            improvement_recommendations=recs,
            best_practice_gaps=bp_gaps,
        )

    # ------------------------------------------------------------------
    # 4. UFLPA exposure calculation
    # ------------------------------------------------------------------

    def calculate_uflpa_exposure(self, product: UflpaProductData) -> UflpaExposureResponse:
        # Check high-risk commodities
        high_risk_hit: list[str] = []
        uflpa_commodities_lower = [c.lower() for c in UFLPA_DATA["high_risk_commodities"]]
        for com in product.commodities:
            if any(com.lower() in uc for uc in uflpa_commodities_lower):
                high_risk_hit.append(com)

        # Xinjiang exposure calculation
        xinjiang_exposure = 0.0
        if product.has_xinjiang_links:
            xinjiang_exposure = 90.0
        else:
            china_count = sum(
                1 for c in product.supplier_countries
                if c.lower() in ("china", "cn", "prc")
            )
            if china_count > 0 and high_risk_hit:
                # Estimate probabilistic Xinjiang exposure
                commodity_exposure_map = {
                    "cotton": 85.0, "polysilicon": 45.0, "tomatoes": 30.0,
                    "aluminium": 35.0, "solar panels": 40.0, "textiles": 25.0,
                }
                max_exposure = max(
                    (commodity_exposure_map.get(c.lower(), 15.0) for c in high_risk_hit),
                    default=15.0
                )
                xinjiang_exposure = max_exposure * (china_count / max(1, len(product.supplier_countries)))

        rebuttable_presumption = product.has_xinjiang_links or xinjiang_exposure >= 30.0

        # CBP enforcement risk
        if rebuttable_presumption and not (
            product.has_supply_chain_mapping and product.has_third_party_audit
        ):
            cbp_risk = "very_high"
        elif xinjiang_exposure >= 15.0:
            cbp_risk = "high"
        elif high_risk_hit:
            cbp_risk = "medium"
        else:
            cbp_risk = "low"

        # Documentation check
        all_docs = UFLPA_DATA["documentation_requirements"]
        doc_mapping = {
            "Mill certificates tracing fibre to farm origin": product.has_mill_certificates,
            "Supplier declarations under penalty of perjury": product.has_supplier_declarations,
            "Transaction documents: invoices, bills of lading, packing lists": True,  # assumed
            "Lab test results (isotope testing for cotton origin)": product.has_isotope_testing,
            "Audit reports dated within 12 months": product.has_third_party_audit,
            "Supply chain mapping (visual diagram with entity names)": product.has_supply_chain_mapping,
            "Evidence of XUAR labour programme non-participation": product.entity_list_checked,
        }
        met = [d for d, v in doc_mapping.items() if v]
        missing = [d for d, v in doc_mapping.items() if not v]

        actions = []
        if not product.has_supply_chain_mapping:
            actions.append("Commission full supply chain mapping to raw material origin (UFLPA criterion)")
        if not product.has_third_party_audit:
            actions.append("Engage SMETA or SA8000-accredited auditor for all China-based suppliers")
        if not product.has_mill_certificates:
            actions.append("Obtain mill certificates tracing textile fibre to farm level")
        if not product.has_isotope_testing and "cotton" in [c.lower() for c in product.commodities]:
            actions.append("Commission cotton origin isotope testing to exclude Xinjiang origin")
        if not product.entity_list_checked:
            actions.append("Screen all suppliers against UFLPA Entity List (CBP.gov)")
        if rebuttable_presumption:
            actions.append(
                "Prepare clear and convincing evidence package for CBP review (19 U.S.C. § 1307)"
            )

        summary = (
            f"Xinjiang exposure estimated at {xinjiang_exposure:.1f}%. "
            f"CBP enforcement risk: {cbp_risk}. "
            f"Rebuttable presumption {'TRIGGERED' if rebuttable_presumption else 'not triggered'}. "
            f"{len(missing)} documentation gaps identified."
        )

        return UflpaExposureResponse(
            product_name=product.product_name,
            xinjiang_exposure_pct=round(xinjiang_exposure, 1),
            cbp_enforcement_risk=cbp_risk,
            rebuttable_presumption_triggered=rebuttable_presumption,
            high_risk_commodities_present=high_risk_hit,
            documentation_gap_count=len(missing),
            documentation_requirements=all_docs,
            documentation_met=met,
            documentation_missing=missing,
            recommended_actions=actions,
            import_risk_summary=summary,
        )

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _score_ilo_indicators(
        self, ed: AssessForcedLabourRequest, sector_profile: Optional[dict]
    ) -> tuple[float, list[dict]]:
        triggered: list[dict] = []
        weighted_score = 0.0
        total_weight = sum(ind["weight"] for ind in ILO_INDICATORS.values())

        for key, ind in ILO_INDICATORS.items():
            sector_prev = ind.get("sector_prevalence", {})
            # Map sector key to prevalence
            raw_prevalence = "low"
            if sector_profile:
                for prev_key, prev_val in sector_prev.items():
                    if any(w in ed.sector.lower() for w in prev_key.split("_")):
                        raw_prevalence = prev_val
                        break
                # Also check key_ilo_indicators in profile
                if sector_profile and ind["number"] in sector_profile.get("key_ilo_indicators", []):
                    raw_prevalence = "high"

            risk_map = {"very_high": 0.9, "high": 0.7, "medium": 0.45, "low": 0.2, "very_low": 0.05}
            raw_score = risk_map.get(raw_prevalence, 0.2)

            # Adjust for CAHRA / Xinjiang
            if ed.known_cahra_links:
                raw_score = min(1.0, raw_score * 1.3)
            if ed.known_xinjiang_links and key in ("restriction_of_movement", "isolation", "abusive_working_living_conditions"):
                raw_score = min(1.0, raw_score * 1.5)

            weighted_score += ind["weight"] * raw_score

            if raw_score >= 0.5:
                triggered.append({
                    "indicator": ind["name"],
                    "ilo_reference": ind["ilo_reference"],
                    "estimated_risk": raw_prevalence,
                    "score": round(raw_score * 100, 1),
                    "weight": ind["weight"],
                })

        # Normalise to 0-100
        composite = (weighted_score / total_weight) * 100
        triggered.sort(key=lambda x: x["score"], reverse=True)
        return composite, triggered

    def _child_labour_risk(
        self, sector_profile: Optional[dict], countries: list[str]
    ) -> str:
        if sector_profile:
            return sector_profile.get("child_labour_risk", "medium")
        cahra_hit = any(
            c.lower() in k.lower() for c in countries for k in CAHRA_COUNTRIES
        )
        return "high" if cahra_hit else "medium"

    def _debt_bondage_risk(
        self, sector_profile: Optional[dict], countries: list[str]
    ) -> str:
        if sector_profile:
            return sector_profile.get("debt_bondage_risk", "medium")
        return "medium"

    def _uk_msa_baseline(self, ed: AssessForcedLabourRequest) -> tuple[float, str]:
        if not ed.has_msa_statement:
            score = 10.0
        else:
            score = 45.0  # Has statement — developing tier baseline
            if ed.existing_audit_schemes:
                score += 10.0
            if ed.has_eu_flr_programme:
                score += 5.0

        # Determine tier
        tier = "tier_1_poor"
        for tk, tv in UK_MSA_DATA["home_office_quality_tiers"].items():
            lo, hi = tv["score_range"]
            if lo <= score <= hi:
                tier = tk
                break
        return score, tier

    def _eu_flr_readiness(
        self, ed: AssessForcedLabourRequest, sector_profile: Optional[dict]
    ) -> tuple[float, str]:
        score = 0.0
        if ed.has_eu_flr_programme:
            score += 40.0
        if ed.has_msa_statement:
            score += 20.0
        if ed.existing_audit_schemes:
            score += min(30.0, len(ed.existing_audit_schemes) * 10.0)
        if ed.tier1_supplier_count and ed.tier1_supplier_count > 0:
            # Penalise if no mapping
            score -= 5.0 if not ed.has_uflpa_compliance_programme else 0.0

        score = max(0.0, min(100.0, score))
        status = (
            "compliant_ready" if score >= 75 else
            "partially_ready" if score >= 40 else
            "not_ready"
        )
        return score, status

    def _uflpa_baseline(self, ed: AssessForcedLabourRequest) -> tuple[float, str]:
        score = 0.0
        if ed.known_xinjiang_links:
            score += 70.0
        china_count = sum(
            1 for c in ed.supply_chain_countries
            if c.lower() in ("china", "cn", "prc")
        )
        uflpa_commodities = {"cotton", "polysilicon", "solar panels", "aluminium", "textiles", "electronics"}
        commodity_match = sum(1 for c in ed.commodities if c.lower() in uflpa_commodities)
        score += min(20.0, china_count * 5.0) + min(10.0, commodity_match * 5.0)
        if not ed.has_uflpa_compliance_programme:
            score = min(100.0, score + 10.0)

        score = max(0.0, min(100.0, score))
        level = (
            "critical" if score >= 70 else
            "high" if score >= 40 else
            "medium" if score >= 20 else
            "low"
        )
        return score, level

    def _check_cahra(self, countries: list[str]) -> list[str]:
        flags: list[str] = []
        for c in countries:
            for ckey, cval in CAHRA_COUNTRIES.items():
                if c.lower() in ckey.lower() or c.lower() in cval["name"].lower():
                    flags.append(f"{cval['name']} — {', '.join(cval['risk_type'])}")
                    break
        return list(set(flags))

    def _overall_risk_tier(
        self,
        ilo_score: float,
        uflpa_score: float,
        child_labour_risk: str,
        debt_bondage_risk: str,
        cahra_flags: list[str],
    ) -> str:
        risk_val = {"critical": 4, "very_high": 4, "high": 3, "medium": 2, "low": 1, "very_low": 0}
        aggregate = (
            ilo_score * 0.4
            + uflpa_score * 0.25
            + risk_val.get(child_labour_risk, 2) * 5
            + risk_val.get(debt_bondage_risk, 2) * 5
            + len(cahra_flags) * 10
        )
        if aggregate >= 60 or cahra_flags:
            return "critical"
        elif aggregate >= 40:
            return "high"
        elif aggregate >= 20:
            return "medium"
        else:
            return "low"

    def _recommended_actions(
        self,
        overall_tier: str,
        eu_flr_status: str,
        uflpa_level: str,
        uk_msa_tier: str,
        ed: AssessForcedLabourRequest,
    ) -> list[str]:
        actions: list[str] = []
        if overall_tier in ("critical", "high"):
            actions.append("Conduct enhanced due diligence (EDD) on all Tier 1 and Tier 2 suppliers immediately")
            actions.append("Commission independent SMETA 4-Pillar or SA8000 audit on highest-risk sites within 90 days")
        if eu_flr_status == "not_ready":
            actions.append("Develop EU Forced Labour Regulation 2024/3015 compliance programme (effective Jan 2027)")
            actions.append("Map supply chain to raw material origin and document forced labour risk assessment")
        if uflpa_level in ("critical", "high"):
            actions.append("Commission UFLPA Entity List screening and Xinjiang origin attestation")
            actions.append("Engage specialised legal counsel for CBP rebuttable presumption response")
        if uk_msa_tier in ("tier_1_poor", "tier_2_basic") and ed.annual_turnover_gbp and ed.annual_turnover_gbp >= 36_000_000:
            actions.append("Upgrade UK MSA Section 54 statement to cover all 6 prescribed areas")
            actions.append("Ensure MSA statement is board-approved, director-signed, and linked from homepage")
        if not ed.existing_audit_schemes:
            actions.append("Enrol at least one Tier 1 supplier in a recognised social audit scheme")
        if ed.known_cahra_links:
            actions.append("Apply OECD Annex II CAHRA due diligence guidance for conflict-affected sourcing regions")
        return actions

    def _recommend_audit_schemes(
        self, sector: str, countries: list[str], commodities: list[str]
    ) -> list[str]:
        recs: list[str] = []
        sector_lower = sector.lower()
        commodities_lower = [c.lower() for c in commodities]

        if "palm_oil" in sector_lower or "palm oil" in commodities_lower:
            recs.append("RSPO")
        if "cocoa" in commodities_lower or "coffee" in commodities_lower or "agriculture" in sector_lower:
            recs.append("Rainforest Alliance")
        if "cotton" in commodities_lower:
            recs.append("Better Cotton (BCI)")
        if "garment" in sector_lower or "apparel" in sector_lower or "textile" in sector_lower:
            recs.append("SMETA 4-Pillar")
            recs.append("Fair Labor Association")
        if "electronics" in sector_lower:
            recs.append("SMETA 4-Pillar")
        if "mining" in sector_lower or "cobalt" in commodities_lower:
            recs.append("OECD DDG RMAP (Responsible Minerals Assurance Process)")
        if "construction" in sector_lower:
            recs.append("SMETA 4-Pillar")
        if any(c.lower() in ("china", "cn") for c in countries):
            if "SMETA 4-Pillar" not in recs:
                recs.append("SMETA 4-Pillar")

        # Universal fallback
        if not recs:
            recs.append("SMETA 2-Pillar")

        # Always append SA8000 for critical sectors
        if sector_lower in ("brick_kilns", "domestic_work", "fishing_seafood"):
            recs.append("SA8000")

        return list(dict.fromkeys(recs))  # deduplicate preserving order
