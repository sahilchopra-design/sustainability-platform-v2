"""
Regulatory Horizon Scanning Engine — E117
60 upcoming/recent sustainability regulations (2024-2030)
Entity applicability matrix (6 entity types × 60 regulations)
Compliance cost benchmarks by entity size
Regulatory interconnection / dependency map
"""
from __future__ import annotations
from typing import Any
import math
import random

# ---------------------------------------------------------------------------
# Regulation pipeline — 60 entries
# ---------------------------------------------------------------------------
# Fields: regulation_id, regulation_name, short_name, jurisdiction, regulator,
#         topic, current_status, expected_in_force_date, compliance_deadline,
#         entity_types_affected, impact_score (1-5),
#         estimated_compliance_cost_category (low/medium/high/very_high),
#         description

REGULATION_PIPELINE: list[dict[str, Any]] = [
    # --- EU ---------------------------------------------------------------
    {
        "regulation_id": "EU_CSDDD",
        "regulation_name": "Corporate Sustainability Due Diligence Directive",
        "short_name": "CS3D / CSDDD",
        "jurisdiction": "EU",
        "regulator": "European Commission",
        "topic": "social",
        "current_status": "adopted",
        "expected_in_force_date": "2024-07-25",
        "compliance_deadline": "2027-07-26",
        "entity_types_affected": ["corporate"],
        "impact_score": 5,
        "estimated_compliance_cost_category": "very_high",
        "description": "Mandatory human rights and environmental due diligence along value chains; civil liability; 5% turnover fines.",
    },
    {
        "regulation_id": "EU_EUDR",
        "regulation_name": "EU Deforestation Regulation",
        "short_name": "EUDR",
        "jurisdiction": "EU",
        "regulator": "European Commission",
        "topic": "biodiversity",
        "current_status": "in_force",
        "expected_in_force_date": "2023-06-29",
        "compliance_deadline": "2025-12-30",
        "entity_types_affected": ["corporate"],
        "impact_score": 4,
        "estimated_compliance_cost_category": "high",
        "description": "Due diligence for 7 commodities (cattle, cocoa, coffee, oil palm, rubber, soy, wood) — deforestation-free verification.",
    },
    {
        "regulation_id": "EU_NRL",
        "regulation_name": "EU Nature Restoration Law",
        "short_name": "NRL",
        "jurisdiction": "EU",
        "regulator": "European Commission / Member States",
        "topic": "biodiversity",
        "current_status": "adopted",
        "expected_in_force_date": "2024-08-18",
        "compliance_deadline": "2030-01-01",
        "entity_types_affected": ["corporate", "all"],
        "impact_score": 3,
        "estimated_compliance_cost_category": "medium",
        "description": "Legally binding restoration targets for at least 20% of EU land and sea areas by 2030.",
    },
    {
        "regulation_id": "EU_SFDR_L3",
        "regulation_name": "SFDR Level 3 (revised RTS)",
        "short_name": "SFDR L3",
        "jurisdiction": "EU",
        "regulator": "ESMA / EBA / EIOPA",
        "topic": "reporting",
        "current_status": "consultation",
        "expected_in_force_date": "2026-01-01",
        "compliance_deadline": "2026-06-30",
        "entity_types_affected": ["asset_manager", "bank", "insurer", "pension"],
        "impact_score": 5,
        "estimated_compliance_cost_category": "high",
        "description": "Revised SFDR regulatory technical standards; new product categorisation; revised PAI indicators; EU labelling alignment.",
    },
    {
        "regulation_id": "EU_AI_ACT",
        "regulation_name": "EU Artificial Intelligence Act",
        "short_name": "AI Act",
        "jurisdiction": "EU",
        "regulator": "European Commission / AI Office",
        "topic": "AI",
        "current_status": "adopted",
        "expected_in_force_date": "2024-08-01",
        "compliance_deadline": "2026-08-01",
        "entity_types_affected": ["all"],
        "impact_score": 4,
        "estimated_compliance_cost_category": "high",
        "description": "Risk-based AI regulation; high-risk AI systems in financial services require conformity assessments, transparency, human oversight.",
    },
    {
        "regulation_id": "EU_TAXONOMY_DA",
        "regulation_name": "EU Taxonomy Delegated Acts Updates",
        "short_name": "EU Taxonomy DA",
        "jurisdiction": "EU",
        "regulator": "European Commission",
        "topic": "reporting",
        "current_status": "proposed",
        "expected_in_force_date": "2025-01-01",
        "compliance_deadline": "2025-12-31",
        "entity_types_affected": ["bank", "asset_manager", "insurer", "corporate"],
        "impact_score": 4,
        "estimated_compliance_cost_category": "medium",
        "description": "Updated technical screening criteria for remaining 4 environmental objectives; social taxonomy development.",
    },
    {
        "regulation_id": "EU_ESAP",
        "regulation_name": "European Single Access Point",
        "short_name": "ESAP",
        "jurisdiction": "EU",
        "regulator": "ESMA",
        "topic": "reporting",
        "current_status": "adopted",
        "expected_in_force_date": "2026-07-10",
        "compliance_deadline": "2026-07-10",
        "entity_types_affected": ["bank", "asset_manager", "insurer", "corporate", "pension"],
        "impact_score": 3,
        "estimated_compliance_cost_category": "medium",
        "description": "Central EU portal for public financial and sustainability data; machine-readable structured reporting required.",
    },
    {
        "regulation_id": "EU_PRIIPS_OVERHAUL",
        "regulation_name": "PRIIPs KID Overhaul",
        "short_name": "PRIIPs v2",
        "jurisdiction": "EU",
        "regulator": "ESMA / ESAs",
        "topic": "reporting",
        "current_status": "consultation",
        "expected_in_force_date": "2026-01-01",
        "compliance_deadline": "2026-06-30",
        "entity_types_affected": ["asset_manager", "insurer"],
        "impact_score": 3,
        "estimated_compliance_cost_category": "medium",
        "description": "Revised KID format with enhanced sustainability information, revised performance scenarios, cost disclosure methodology.",
    },
    {
        "regulation_id": "EU_MIFID3_ESG",
        "regulation_name": "MiFID III ESG Suitability",
        "short_name": "MiFID III ESG",
        "jurisdiction": "EU",
        "regulator": "ESMA",
        "topic": "reporting",
        "current_status": "proposed",
        "expected_in_force_date": "2026-01-01",
        "compliance_deadline": "2026-12-31",
        "entity_types_affected": ["bank", "asset_manager"],
        "impact_score": 3,
        "estimated_compliance_cost_category": "medium",
        "description": "Enhanced sustainability preference integration into suitability assessments; product governance refresh.",
    },
    {
        "regulation_id": "EU_UCITS_ESG",
        "regulation_name": "UCITS V ESG Amendments",
        "short_name": "UCITS ESG",
        "jurisdiction": "EU",
        "regulator": "European Commission / ESMA",
        "topic": "reporting",
        "current_status": "proposed",
        "expected_in_force_date": "2026-06-01",
        "compliance_deadline": "2027-01-01",
        "entity_types_affected": ["asset_manager"],
        "impact_score": 3,
        "estimated_compliance_cost_category": "medium",
        "description": "ESG risk integration requirements for UCITS funds; liquidity risk provisions; KID alignment.",
    },
    {
        "regulation_id": "EU_AIFMD2_ESG",
        "regulation_name": "AIFMD II ESG Requirements",
        "short_name": "AIFMD II ESG",
        "jurisdiction": "EU",
        "regulator": "ESMA",
        "topic": "reporting",
        "current_status": "in_force",
        "expected_in_force_date": "2024-04-15",
        "compliance_deadline": "2026-04-16",
        "entity_types_affected": ["asset_manager"],
        "impact_score": 3,
        "estimated_compliance_cost_category": "medium",
        "description": "AIFMD recast; enhanced sustainability reporting for AIFMs; delegation rules tightened; leveraged loan sustainability disclosures.",
    },
    {
        "regulation_id": "EU_CRA_ESG",
        "regulation_name": "EU Credit Rating Agency ESG Regulation",
        "short_name": "EU CRA ESG",
        "jurisdiction": "EU",
        "regulator": "ESMA",
        "topic": "reporting",
        "current_status": "level2",
        "expected_in_force_date": "2025-07-01",
        "compliance_deadline": "2025-12-31",
        "entity_types_affected": ["bank", "asset_manager"],
        "impact_score": 2,
        "estimated_compliance_cost_category": "low",
        "description": "Mandatory disclosure and transparency requirements for ESG rating providers; ESMA registration.",
    },
    {
        "regulation_id": "EU_BASEL3_FINAL",
        "regulation_name": "Basel III.1 Final EU Implementation (CRR3)",
        "short_name": "Basel III.1 EU",
        "jurisdiction": "EU",
        "regulator": "EBA / ECB",
        "topic": "governance",
        "current_status": "adopted",
        "expected_in_force_date": "2025-01-01",
        "compliance_deadline": "2025-01-01",
        "entity_types_affected": ["bank"],
        "impact_score": 5,
        "estimated_compliance_cost_category": "very_high",
        "description": "CRR3/CRD6 implementation: SA-CCR, revised credit risk standardised approach, output floor, Pillar 3 ESG disclosure.",
    },
    {
        "regulation_id": "EU_EBA_PILLAR3_ESG",
        "regulation_name": "EBA Pillar 3 ESG Disclosure Update",
        "short_name": "Pillar 3 ESG v2",
        "jurisdiction": "EU",
        "regulator": "EBA",
        "topic": "reporting",
        "current_status": "level2",
        "expected_in_force_date": "2025-06-01",
        "compliance_deadline": "2025-12-31",
        "entity_types_affected": ["bank"],
        "impact_score": 4,
        "estimated_compliance_cost_category": "high",
        "description": "Revised GL/2022/03; expanded templates T1-T10; portfolio alignment, GAR/BTAR, financed emissions scope expansion.",
    },
    {
        "regulation_id": "EU_RCF",
        "regulation_name": "EU Resilience and Crisis Framework",
        "short_name": "EU RCF",
        "jurisdiction": "EU",
        "regulator": "European Commission",
        "topic": "climate",
        "current_status": "proposed",
        "expected_in_force_date": "2027-01-01",
        "compliance_deadline": "2027-12-31",
        "entity_types_affected": ["bank", "insurer", "corporate"],
        "impact_score": 3,
        "estimated_compliance_cost_category": "medium",
        "description": "Climate and nature resilience stress testing for systemic FIs; mandatory climate scenario integration.",
    },
    # --- UK ---------------------------------------------------------------
    {
        "regulation_id": "UK_TCFD_MANDATORY",
        "regulation_name": "UK Mandatory TCFD-Aligned Disclosures",
        "short_name": "UK TCFD Mandatory",
        "jurisdiction": "UK",
        "regulator": "FCA / BEIS / TPR",
        "topic": "climate",
        "current_status": "in_force",
        "expected_in_force_date": "2022-04-06",
        "compliance_deadline": "2025-04-06",
        "entity_types_affected": ["bank", "asset_manager", "insurer", "pension", "corporate"],
        "impact_score": 4,
        "estimated_compliance_cost_category": "high",
        "description": "Mandatory TCFD-aligned disclosures extended to all large UK companies >500 employees; premium listed companies since 2021.",
    },
    {
        "regulation_id": "UK_SDR_FULL",
        "regulation_name": "UK Sustainability Disclosure Requirements — Full Implementation",
        "short_name": "UK SDR Full",
        "jurisdiction": "UK",
        "regulator": "FCA",
        "topic": "reporting",
        "current_status": "in_force",
        "expected_in_force_date": "2024-05-31",
        "compliance_deadline": "2025-07-31",
        "entity_types_affected": ["asset_manager"],
        "impact_score": 4,
        "estimated_compliance_cost_category": "high",
        "description": "4 sustainability labels (Focus/Improvers/Impact/Mixed); Anti-Greenwashing Rule in force; naming & marketing requirements.",
    },
    {
        "regulation_id": "UK_TNFD_MANDATORY",
        "regulation_name": "UK TNFD Mandatory Consideration",
        "short_name": "UK TNFD",
        "jurisdiction": "UK",
        "regulator": "FCA / DEFRA",
        "topic": "biodiversity",
        "current_status": "proposed",
        "expected_in_force_date": "2025-01-01",
        "compliance_deadline": "2025-12-31",
        "entity_types_affected": ["bank", "asset_manager", "insurer", "corporate"],
        "impact_score": 3,
        "estimated_compliance_cost_category": "medium",
        "description": "UK government commitment to mandate TNFD-aligned nature disclosures for large companies and financial institutions.",
    },
    {
        "regulation_id": "UK_BASEL3_FINAL",
        "regulation_name": "Basel III.1 UK (PRA near-final rules)",
        "short_name": "Basel III.1 UK",
        "jurisdiction": "UK",
        "regulator": "PRA / FCA",
        "topic": "governance",
        "current_status": "adopted",
        "expected_in_force_date": "2025-01-01",
        "compliance_deadline": "2025-01-01",
        "entity_types_affected": ["bank"],
        "impact_score": 5,
        "estimated_compliance_cost_category": "very_high",
        "description": "PRA near-final rules: credit risk standardised approach, IRB reforms, operational risk, market risk, output floor phased in.",
    },
    {
        "regulation_id": "UK_ISSB_ADOPTION",
        "regulation_name": "UK ISSB S1/S2 Adoption (UKSSDS)",
        "short_name": "UK SSDS",
        "jurisdiction": "UK",
        "regulator": "FRC / BEIS",
        "topic": "reporting",
        "current_status": "proposed",
        "expected_in_force_date": "2025-01-01",
        "compliance_deadline": "2026-01-01",
        "entity_types_affected": ["corporate", "bank", "insurer", "asset_manager"],
        "impact_score": 4,
        "estimated_compliance_cost_category": "high",
        "description": "UK-endorsed ISSB S1/S2 as UK Sustainability Disclosure Standards; FRC consultation ongoing.",
    },
    # --- Australia --------------------------------------------------------
    {
        "regulation_id": "AU_AASB_S1_S2",
        "regulation_name": "Australia AASB S1/S2 Mandatory Climate Disclosures",
        "short_name": "AU AASB S1/S2",
        "jurisdiction": "Australia",
        "regulator": "ASIC / AASB / AUASB",
        "topic": "climate",
        "current_status": "adopted",
        "expected_in_force_date": "2025-01-01",
        "compliance_deadline": "2025-06-30",
        "entity_types_affected": ["corporate", "bank", "insurer", "asset_manager"],
        "impact_score": 5,
        "estimated_compliance_cost_category": "high",
        "description": "Mandatory ISSB-aligned climate disclosures phased by entity size; Group 1 (>$500M) from FY2025; assurance required.",
    },
    {
        "regulation_id": "AU_TNFD_MANDATORY",
        "regulation_name": "Australia TNFD Mandatory Consideration",
        "short_name": "AU TNFD",
        "jurisdiction": "Australia",
        "regulator": "ASIC / DCCEEW",
        "topic": "biodiversity",
        "current_status": "proposed",
        "expected_in_force_date": "2024-10-01",
        "compliance_deadline": "2025-06-30",
        "entity_types_affected": ["bank", "asset_manager", "corporate"],
        "impact_score": 3,
        "estimated_compliance_cost_category": "medium",
        "description": "Treasury consultation on mandatory TNFD adoption for large entities alongside climate disclosure regime.",
    },
    # --- Canada -----------------------------------------------------------
    {
        "regulation_id": "CA_ISSB_ADOPTION",
        "regulation_name": "Canada ISSB S1/S2 Adoption (CSDS)",
        "short_name": "CA CSDS",
        "jurisdiction": "Canada",
        "regulator": "CSA / OSFI",
        "topic": "reporting",
        "current_status": "proposed",
        "expected_in_force_date": "2025-01-01",
        "compliance_deadline": "2025-12-31",
        "entity_types_affected": ["corporate", "bank", "insurer"],
        "impact_score": 4,
        "estimated_compliance_cost_category": "high",
        "description": "Canadian Securities Administrators ISSB-aligned disclosure rules; OSFI mandatory for banks and insurers.",
    },
    # --- Japan ------------------------------------------------------------
    {
        "regulation_id": "JP_ISSB_ADOPTION",
        "regulation_name": "Japan ISSB Adoption (SSBJ Standards)",
        "short_name": "JP SSBJ",
        "jurisdiction": "Japan",
        "regulator": "SSBJ / FSA",
        "topic": "reporting",
        "current_status": "adopted",
        "expected_in_force_date": "2025-03-31",
        "compliance_deadline": "2025-03-31",
        "entity_types_affected": ["corporate", "bank", "insurer", "asset_manager"],
        "impact_score": 4,
        "estimated_compliance_cost_category": "high",
        "description": "SSBJ issued Japan sustainability standards (JSSB S1/S2); Tokyo Prime Market companies mandatory from FY2025.",
    },
    # --- Brazil -----------------------------------------------------------
    {
        "regulation_id": "BR_ISSB_ADOPTION",
        "regulation_name": "Brazil ISSB S1/S2 Adoption (CPC)",
        "short_name": "BR CPC ISSB",
        "jurisdiction": "Brazil",
        "regulator": "CVM / CPC",
        "topic": "reporting",
        "current_status": "proposed",
        "expected_in_force_date": "2026-01-01",
        "compliance_deadline": "2026-12-31",
        "entity_types_affected": ["corporate", "bank"],
        "impact_score": 3,
        "estimated_compliance_cost_category": "medium",
        "description": "CVM resolution adopting ISSB standards for Brazilian listed companies; phased implementation.",
    },
    # --- USA --------------------------------------------------------------
    {
        "regulation_id": "US_SEC_CLIMATE",
        "regulation_name": "SEC Climate-Related Disclosure Rule",
        "short_name": "SEC Climate",
        "jurisdiction": "USA",
        "regulator": "SEC",
        "topic": "climate",
        "current_status": "proposed",
        "expected_in_force_date": "2025-01-01",
        "compliance_deadline": "2026-01-01",
        "entity_types_affected": ["corporate"],
        "impact_score": 5,
        "estimated_compliance_cost_category": "very_high",
        "description": "Final rule adopted March 2024; subject to legal challenges; Scope 1/2/3 material disclosures; financial statement footnotes.",
    },
    {
        "regulation_id": "US_CA_SB253",
        "regulation_name": "California Climate Corporate Data Accountability Act (SB 253)",
        "short_name": "CA SB 253",
        "jurisdiction": "USA-California",
        "regulator": "CARB / California Legislature",
        "topic": "climate",
        "current_status": "adopted",
        "expected_in_force_date": "2026-01-01",
        "compliance_deadline": "2026-01-01",
        "entity_types_affected": ["corporate"],
        "impact_score": 4,
        "estimated_compliance_cost_category": "high",
        "description": "Mandatory Scope 1/2/3 GHG reporting for companies >$1B revenue doing business in California; CARB rulemaking underway.",
    },
    {
        "regulation_id": "US_CA_SB261",
        "regulation_name": "California Climate-Related Financial Risk Act (SB 261)",
        "short_name": "CA SB 261",
        "jurisdiction": "USA-California",
        "regulator": "CARB / California Legislature",
        "topic": "climate",
        "current_status": "adopted",
        "expected_in_force_date": "2026-01-01",
        "compliance_deadline": "2026-01-01",
        "entity_types_affected": ["corporate"],
        "impact_score": 3,
        "estimated_compliance_cost_category": "medium",
        "description": "TCFD-aligned climate financial risk reports every 2 years for companies >$500M revenue in California.",
    },
    # --- Singapore --------------------------------------------------------
    {
        "regulation_id": "SG_ISSB_MANDATORY",
        "regulation_name": "Singapore Mandatory ISSB Disclosures",
        "short_name": "SG ISSB",
        "jurisdiction": "Singapore",
        "regulator": "MAS / SGX",
        "topic": "reporting",
        "current_status": "adopted",
        "expected_in_force_date": "2025-01-01",
        "compliance_deadline": "2025-12-31",
        "entity_types_affected": ["corporate", "bank", "asset_manager"],
        "impact_score": 4,
        "estimated_compliance_cost_category": "high",
        "description": "SGX-listed companies mandatory ISSB S1/S2 from FY2025; TCFD mandatory since 2022 for financial sector.",
    },
    # --- Global / Basel ---------------------------------------------------
    {
        "regulation_id": "GLOBAL_BASEL_CLIMATE_PILLAR2",
        "regulation_name": "Global Basel III Climate Pillar 2 Guidance",
        "short_name": "BCBS Climate P2",
        "jurisdiction": "Global",
        "regulator": "BCBS",
        "topic": "climate",
        "current_status": "adopted",
        "expected_in_force_date": "2024-05-01",
        "compliance_deadline": "2026-01-01",
        "entity_types_affected": ["bank"],
        "impact_score": 4,
        "estimated_compliance_cost_category": "high",
        "description": "BCBS SCO17: 18 principles for effective climate risk management and supervision; Pillar 2 ICAAP / SREP integration.",
    },
    {
        "regulation_id": "GLOBAL_TNFD_VOLUNTARY",
        "regulation_name": "TNFD Framework v1.0 Voluntary Adoption",
        "short_name": "TNFD v1.0",
        "jurisdiction": "Global",
        "regulator": "TNFD",
        "topic": "biodiversity",
        "current_status": "in_force",
        "expected_in_force_date": "2023-09-18",
        "compliance_deadline": "2024-12-31",
        "entity_types_affected": ["bank", "asset_manager", "insurer", "corporate", "pension"],
        "impact_score": 3,
        "estimated_compliance_cost_category": "medium",
        "description": "TNFD LEAP framework; 14 core metrics; voluntary adoption ahead of mandatory regimes in UK/AU.",
    },
    # --- Additional regulations -------------------------------------------
    {
        "regulation_id": "EU_CSRD_ESRS",
        "regulation_name": "EU Corporate Sustainability Reporting Directive — ESRS",
        "short_name": "CSRD ESRS",
        "jurisdiction": "EU",
        "regulator": "EFRAG / European Commission",
        "topic": "reporting",
        "current_status": "in_force",
        "expected_in_force_date": "2023-01-05",
        "compliance_deadline": "2025-01-01",
        "entity_types_affected": ["corporate", "bank", "insurer", "asset_manager"],
        "impact_score": 5,
        "estimated_compliance_cost_category": "very_high",
        "description": "330+ ESRS data points across E1-E5, S1-S4, G1; double materiality; ISAE 3000 assurance; XBRL tagging.",
    },
    {
        "regulation_id": "GLOBAL_ISSB_S1_S2",
        "regulation_name": "IFRS S1/S2 ISSB Standards",
        "short_name": "ISSB S1/S2",
        "jurisdiction": "Global",
        "regulator": "ISSB / IFRS Foundation",
        "topic": "reporting",
        "current_status": "in_force",
        "expected_in_force_date": "2023-06-26",
        "compliance_deadline": "2024-01-01",
        "entity_types_affected": ["corporate", "bank", "insurer", "asset_manager"],
        "impact_score": 5,
        "estimated_compliance_cost_category": "high",
        "description": "General sustainability (S1) and climate-related (S2) disclosure standards; effective 1 Jan 2024; TCFD superseded.",
    },
    {
        "regulation_id": "EU_ETS_REFORM",
        "regulation_name": "EU ETS Reform — ETS2 / CBAM Phase-in",
        "short_name": "ETS2 / CBAM",
        "jurisdiction": "EU",
        "regulator": "European Commission",
        "topic": "climate",
        "current_status": "in_force",
        "expected_in_force_date": "2023-05-16",
        "compliance_deadline": "2026-01-01",
        "entity_types_affected": ["corporate"],
        "impact_score": 5,
        "estimated_compliance_cost_category": "very_high",
        "description": "ETS2 extends carbon pricing to buildings/road transport; CBAM full implementation 2026; importers need CBAM declarations.",
    },
    {
        "regulation_id": "EU_GREEN_BOND_STANDARD",
        "regulation_name": "EU Green Bond Standard (EU GBS)",
        "short_name": "EU GBS",
        "jurisdiction": "EU",
        "regulator": "ESMA / EBA",
        "topic": "reporting",
        "current_status": "in_force",
        "expected_in_force_date": "2024-12-21",
        "compliance_deadline": "2024-12-21",
        "entity_types_affected": ["bank", "asset_manager", "corporate"],
        "impact_score": 3,
        "estimated_compliance_cost_category": "medium",
        "description": "Voluntary EU GBS label with 100% taxonomy alignment; ESAP registration; external reviewer accreditation.",
    },
    {
        "regulation_id": "EU_BENCHMARK_REGULATION",
        "regulation_name": "EU Benchmark Regulation — ESG Benchmark Standards",
        "short_name": "EU BMR ESG",
        "jurisdiction": "EU",
        "regulator": "ESMA",
        "topic": "reporting",
        "current_status": "in_force",
        "expected_in_force_date": "2020-04-30",
        "compliance_deadline": "2025-01-01",
        "entity_types_affected": ["asset_manager", "bank"],
        "impact_score": 2,
        "estimated_compliance_cost_category": "low",
        "description": "PAB/CTB benchmark definitions; revised disclosure requirements post-2024 review.",
    },
    {
        "regulation_id": "EU_SOLVENCY2_SUSTAINABILITY",
        "regulation_name": "Solvency II Sustainability Review",
        "short_name": "SII Sustainability",
        "jurisdiction": "EU",
        "regulator": "EIOPA / European Commission",
        "topic": "climate",
        "current_status": "level2",
        "expected_in_force_date": "2026-01-01",
        "compliance_deadline": "2026-12-31",
        "entity_types_affected": ["insurer"],
        "impact_score": 4,
        "estimated_compliance_cost_category": "high",
        "description": "Art 45a ORSA climate stress test; prudential treatment of sustainable assets; ORSA sustainability scenario requirements.",
    },
    {
        "regulation_id": "EU_IORP2_CLIMATE",
        "regulation_name": "IORP II Pension Sustainability Enhancement",
        "short_name": "IORP II Climate",
        "jurisdiction": "EU",
        "regulator": "EIOPA",
        "topic": "climate",
        "current_status": "level2",
        "expected_in_force_date": "2025-01-01",
        "compliance_deadline": "2026-01-01",
        "entity_types_affected": ["pension"],
        "impact_score": 4,
        "estimated_compliance_cost_category": "high",
        "description": "Enhanced IORP II ORA climate stress test; ESG integration in investment policy; SFDR FMP classification.",
    },
    {
        "regulation_id": "IN_BRSR_CORE",
        "regulation_name": "India BRSR Core — Assurance Framework",
        "short_name": "BRSR Core",
        "jurisdiction": "India",
        "regulator": "SEBI",
        "topic": "reporting",
        "current_status": "adopted",
        "expected_in_force_date": "2023-06-01",
        "compliance_deadline": "2025-03-31",
        "entity_types_affected": ["corporate"],
        "impact_score": 3,
        "estimated_compliance_cost_category": "medium",
        "description": "BRSR Core KPIs for top 150 BSE/NSE companies from FY2023-24; third-party assurance from FY2025.",
    },
    {
        "regulation_id": "CN_ESG_DISCLOSURE",
        "regulation_name": "China Mandatory ESG Disclosure (CSRC/HKEX)",
        "short_name": "CN ESG",
        "jurisdiction": "China/HK",
        "regulator": "CSRC / HKEX / NFRA",
        "topic": "reporting",
        "current_status": "proposed",
        "expected_in_force_date": "2026-01-01",
        "compliance_deadline": "2026-12-31",
        "entity_types_affected": ["corporate", "bank"],
        "impact_score": 4,
        "estimated_compliance_cost_category": "high",
        "description": "HKEX mandatory climate disclosure from 2025; CSRC draft sustainability standards aligned to ISSB.",
    },
    {
        "regulation_id": "US_CFTC_CLIMATE",
        "regulation_name": "CFTC Climate Risk Guidance for Derivatives",
        "short_name": "CFTC Climate",
        "jurisdiction": "USA",
        "regulator": "CFTC",
        "topic": "climate",
        "current_status": "proposed",
        "expected_in_force_date": "2025-01-01",
        "compliance_deadline": "2026-01-01",
        "entity_types_affected": ["bank"],
        "impact_score": 3,
        "estimated_compliance_cost_category": "medium",
        "description": "Climate risk guidance for derivatives market participants; physical and transition risk in FCM margin frameworks.",
    },
    {
        "regulation_id": "EU_PENSION_IORP_SFDR",
        "regulation_name": "Pension SFDR Article 6/8/9 FMP Classification",
        "short_name": "Pension SFDR",
        "jurisdiction": "EU",
        "regulator": "EIOPA / ESMA",
        "topic": "reporting",
        "current_status": "in_force",
        "expected_in_force_date": "2021-03-10",
        "compliance_deadline": "2025-06-30",
        "entity_types_affected": ["pension"],
        "impact_score": 3,
        "estimated_compliance_cost_category": "medium",
        "description": "IORPs as FMPs under SFDR; Article 8/9 classification; PAI statement; product-level periodic reports.",
    },
    {
        "regulation_id": "EU_TRANSITION_FINANCE",
        "regulation_name": "EU Transition Finance Framework",
        "short_name": "EU TFF",
        "jurisdiction": "EU",
        "regulator": "European Commission / Platform on Sustainable Finance",
        "topic": "climate",
        "current_status": "consultation",
        "expected_in_force_date": "2026-01-01",
        "compliance_deadline": "2027-01-01",
        "entity_types_affected": ["bank", "asset_manager", "corporate"],
        "impact_score": 3,
        "estimated_compliance_cost_category": "medium",
        "description": "Definition and standards for credible transition finance instruments; TPT alignment; ESRS E1 transition plan linkage.",
    },
    {
        "regulation_id": "GLOBAL_NGFS_SCENARIO",
        "regulation_name": "NGFS Climate Scenario v4 Supervisory Integration",
        "short_name": "NGFS v4",
        "jurisdiction": "Global",
        "regulator": "NGFS / FSB",
        "topic": "climate",
        "current_status": "in_force",
        "expected_in_force_date": "2024-09-01",
        "compliance_deadline": "2025-06-30",
        "entity_types_affected": ["bank", "insurer", "pension", "asset_manager"],
        "impact_score": 3,
        "estimated_compliance_cost_category": "medium",
        "description": "NGFS v4 scenarios with updated 1.5°C/2°C/current policies pathways; supervisors expect use in ICAAP/ORSA/ILAAP.",
    },
    {
        "regulation_id": "EU_SFDR_L2_PAI",
        "regulation_name": "SFDR L2 PAI Reporting — Enhanced",
        "short_name": "SFDR PAI v2",
        "jurisdiction": "EU",
        "regulator": "ESMA / ESAs",
        "topic": "reporting",
        "current_status": "in_force",
        "expected_in_force_date": "2023-01-01",
        "compliance_deadline": "2025-06-30",
        "entity_types_affected": ["asset_manager", "bank", "insurer", "pension"],
        "impact_score": 4,
        "estimated_compliance_cost_category": "high",
        "description": "14 mandatory + 4 optional PAI indicators; annual entity-level statement; product-level periodic reports.",
    },
    {
        "regulation_id": "EU_CSRD_SME_VSME",
        "regulation_name": "CSRD for SMEs — VSME Standard",
        "short_name": "VSME",
        "jurisdiction": "EU",
        "regulator": "EFRAG",
        "topic": "reporting",
        "current_status": "adopted",
        "expected_in_force_date": "2026-01-01",
        "compliance_deadline": "2027-01-01",
        "entity_types_affected": ["corporate"],
        "impact_score": 3,
        "estimated_compliance_cost_category": "medium",
        "description": "Voluntary SME standard (VSME) for non-listed SMEs supplying data to CSRD reporters; simplified ESRS.",
    },
    {
        "regulation_id": "UK_GREENWASHING_FCA",
        "regulation_name": "UK FCA Anti-Greenwashing Rule",
        "short_name": "UK AGR",
        "jurisdiction": "UK",
        "regulator": "FCA",
        "topic": "governance",
        "current_status": "in_force",
        "expected_in_force_date": "2024-05-31",
        "compliance_deadline": "2024-05-31",
        "entity_types_affected": ["bank", "asset_manager", "insurer"],
        "impact_score": 3,
        "estimated_compliance_cost_category": "low",
        "description": "PS23/16: sustainability claims must be fair, clear, not misleading; FCA review powers; Consumer Duty linkage.",
    },
    {
        "regulation_id": "EU_ESRS_E1_TARGETS",
        "regulation_name": "ESRS E1 Net Zero Target Reporting",
        "short_name": "ESRS E1 NZ",
        "jurisdiction": "EU",
        "regulator": "EFRAG",
        "topic": "climate",
        "current_status": "in_force",
        "expected_in_force_date": "2023-01-05",
        "compliance_deadline": "2026-01-01",
        "entity_types_affected": ["corporate", "bank", "insurer"],
        "impact_score": 4,
        "estimated_compliance_cost_category": "high",
        "description": "ESRS E1 GHG reduction targets with SBTi cross-reference; Scope 3 complete categories; Paris pathway alignment.",
    },
    {
        "regulation_id": "GLOBAL_TCFD_SUPERSEDED",
        "regulation_name": "TCFD Final Status Report — Handover to ISSB",
        "short_name": "TCFD→ISSB",
        "jurisdiction": "Global",
        "regulator": "FSB / ISSB",
        "topic": "climate",
        "current_status": "in_force",
        "expected_in_force_date": "2023-10-12",
        "compliance_deadline": "2025-01-01",
        "entity_types_affected": ["all"],
        "impact_score": 2,
        "estimated_compliance_cost_category": "low",
        "description": "TCFD disbanded Oct 2023; ISSB S2 incorporates TCFD; jurisdictions transitioning TCFD requirements to ISSB S2.",
    },
    {
        "regulation_id": "EU_AI_LIABILITY",
        "regulation_name": "EU AI Liability Directive",
        "short_name": "AI Liability",
        "jurisdiction": "EU",
        "regulator": "European Commission",
        "topic": "AI",
        "current_status": "proposed",
        "expected_in_force_date": "2026-01-01",
        "compliance_deadline": "2028-01-01",
        "entity_types_affected": ["all"],
        "impact_score": 3,
        "estimated_compliance_cost_category": "medium",
        "description": "Civil liability rules for AI systems; rebuttable presumption of causality; disclosure obligations for high-risk AI.",
    },
    {
        "regulation_id": "EU_DATA_ACT",
        "regulation_name": "EU Data Act",
        "short_name": "EU Data Act",
        "jurisdiction": "EU",
        "regulator": "European Commission / EDPB",
        "topic": "AI",
        "current_status": "in_force",
        "expected_in_force_date": "2024-09-12",
        "compliance_deadline": "2025-09-12",
        "entity_types_affected": ["all"],
        "impact_score": 3,
        "estimated_compliance_cost_category": "medium",
        "description": "Data sharing obligations; IoT data access; cloud provider switching; B2G data sharing for ESG metrics.",
    },
    {
        "regulation_id": "AU_SFDR_EQUIVALENT",
        "regulation_name": "Australia Product Sustainability Disclosure (Consultation)",
        "short_name": "AU Product Disclosure",
        "jurisdiction": "Australia",
        "regulator": "ASIC / Treasury",
        "topic": "reporting",
        "current_status": "consultation",
        "expected_in_force_date": "2026-07-01",
        "compliance_deadline": "2027-01-01",
        "entity_types_affected": ["asset_manager", "insurer"],
        "impact_score": 3,
        "estimated_compliance_cost_category": "medium",
        "description": "SFDR-equivalent product-level sustainability disclosures for managed funds; greenwashing guardrails.",
    },
    {
        "regulation_id": "GLOBAL_SBTN_CORPORATE",
        "regulation_name": "SBTN Corporate Target Validation Launch",
        "short_name": "SBTN Corporate",
        "jurisdiction": "Global",
        "regulator": "SBTN / SBTi",
        "topic": "biodiversity",
        "current_status": "in_force",
        "expected_in_force_date": "2023-09-19",
        "compliance_deadline": "2025-12-31",
        "entity_types_affected": ["corporate"],
        "impact_score": 3,
        "estimated_compliance_cost_category": "medium",
        "description": "SBTN v1.1 land/freshwater targets open for validation; step-based approach aligned to TNFD LEAP.",
    },
    {
        "regulation_id": "EU_BIOMETHANE_HYDROGEN",
        "regulation_name": "EU Renewable Energy Directive III (RED III)",
        "short_name": "RED III",
        "jurisdiction": "EU",
        "regulator": "European Commission",
        "topic": "climate",
        "current_status": "in_force",
        "expected_in_force_date": "2023-10-20",
        "compliance_deadline": "2030-01-01",
        "entity_types_affected": ["corporate"],
        "impact_score": 3,
        "estimated_compliance_cost_category": "medium",
        "description": "42.5% renewable target by 2030; hydrogen and biomethane sub-targets; additionality and 24h matching for PPA/PPAs.",
    },
    {
        "regulation_id": "EU_CSRD_PHASE2",
        "regulation_name": "CSRD Wave 2 — Non-EU Parents of EU Subsidiaries",
        "short_name": "CSRD Wave 2",
        "jurisdiction": "EU",
        "regulator": "EFRAG / Member States",
        "topic": "reporting",
        "current_status": "in_force",
        "expected_in_force_date": "2024-01-01",
        "compliance_deadline": "2026-01-01",
        "entity_types_affected": ["corporate"],
        "impact_score": 4,
        "estimated_compliance_cost_category": "high",
        "description": "Large EU companies + first year of listed SMEs; non-EU parents >€150M EU net turnover from FY2028.",
    },
    {
        "regulation_id": "GLOBAL_PCAF_STANDARD_V2",
        "regulation_name": "PCAF Global GHG Accounting Standard v2",
        "short_name": "PCAF v2",
        "jurisdiction": "Global",
        "regulator": "PCAF",
        "topic": "reporting",
        "current_status": "in_force",
        "expected_in_force_date": "2024-01-01",
        "compliance_deadline": "2025-01-01",
        "entity_types_affected": ["bank", "asset_manager", "insurer"],
        "impact_score": 3,
        "estimated_compliance_cost_category": "medium",
        "description": "PCAF v2 with expanded sovereign bonds (Part D), insurance (Part B), facilitated emissions (Part C).",
    },
    {
        "regulation_id": "EU_ECODESIGN",
        "regulation_name": "EU Ecodesign for Sustainable Products Regulation (ESPR)",
        "short_name": "ESPR",
        "jurisdiction": "EU",
        "regulator": "European Commission",
        "topic": "reporting",
        "current_status": "adopted",
        "expected_in_force_date": "2024-07-18",
        "compliance_deadline": "2027-01-01",
        "entity_types_affected": ["corporate"],
        "impact_score": 3,
        "estimated_compliance_cost_category": "medium",
        "description": "Digital Product Passport; ecodesign requirements for 31 product categories; durability, repairability, recyclability.",
    },
    {
        "regulation_id": "EU_CORPORATE_GOVERNANCE",
        "regulation_name": "EU Corporate Governance Directive Revisions",
        "short_name": "EU Corp Gov",
        "jurisdiction": "EU",
        "regulator": "European Commission",
        "topic": "governance",
        "current_status": "consultation",
        "expected_in_force_date": "2026-01-01",
        "compliance_deadline": "2027-01-01",
        "entity_types_affected": ["corporate", "bank"],
        "impact_score": 2,
        "estimated_compliance_cost_category": "low",
        "description": "Long-term sustainable value creation; revised stewardship codes; remuneration linked to sustainability.",
    },
    {
        "regulation_id": "IN_SEBI_ESG_RATING",
        "regulation_name": "India SEBI ESG Rating Providers Regulation",
        "short_name": "SEBI ERPs",
        "jurisdiction": "India",
        "regulator": "SEBI",
        "topic": "governance",
        "current_status": "adopted",
        "expected_in_force_date": "2024-01-31",
        "compliance_deadline": "2025-01-01",
        "entity_types_affected": ["asset_manager", "corporate"],
        "impact_score": 2,
        "estimated_compliance_cost_category": "low",
        "description": "Registration and conduct of business rules for ESG rating providers in India.",
    },
]

# ---------------------------------------------------------------------------
# Entity applicability matrix — 6 entity types
# Derived from entity_types_affected field above
# ---------------------------------------------------------------------------

ENTITY_TYPES = ["bank", "insurer", "asset_manager", "corporate", "pension", "all"]


def _build_applicability_matrix() -> dict[str, dict[str, bool]]:
    matrix: dict[str, dict[str, bool]] = {}
    for reg in REGULATION_PIPELINE:
        affected = reg["entity_types_affected"]
        row: dict[str, bool] = {}
        for et in ENTITY_TYPES:
            row[et] = (et in affected or "all" in affected)
        matrix[reg["regulation_id"]] = row
    return matrix


ENTITY_APPLICABILITY_MATRIX = _build_applicability_matrix()

# ---------------------------------------------------------------------------
# Compliance cost benchmarks (USD, one-time + first-year ongoing)
# Size buckets: small (<$1B AUM), medium ($1-50B), large (>$50B)
# ---------------------------------------------------------------------------

COMPLIANCE_COST_BENCHMARKS: dict[str, dict[str, dict[str, Any]]] = {
    "very_high": {
        "small":  {"one_time_usd": 2_000_000,  "annual_ongoing_usd": 800_000,  "fte_equiv": 8},
        "medium": {"one_time_usd": 8_000_000,  "annual_ongoing_usd": 3_000_000, "fte_equiv": 25},
        "large":  {"one_time_usd": 25_000_000, "annual_ongoing_usd": 10_000_000,"fte_equiv": 80},
    },
    "high": {
        "small":  {"one_time_usd": 500_000,    "annual_ongoing_usd": 200_000,  "fte_equiv": 3},
        "medium": {"one_time_usd": 2_000_000,  "annual_ongoing_usd": 800_000,  "fte_equiv": 10},
        "large":  {"one_time_usd": 8_000_000,  "annual_ongoing_usd": 3_000_000, "fte_equiv": 30},
    },
    "medium": {
        "small":  {"one_time_usd": 150_000,    "annual_ongoing_usd": 60_000,   "fte_equiv": 1},
        "medium": {"one_time_usd": 600_000,    "annual_ongoing_usd": 250_000,  "fte_equiv": 4},
        "large":  {"one_time_usd": 2_000_000,  "annual_ongoing_usd": 800_000,  "fte_equiv": 12},
    },
    "low": {
        "small":  {"one_time_usd": 30_000,     "annual_ongoing_usd": 15_000,   "fte_equiv": 0},
        "medium": {"one_time_usd": 120_000,    "annual_ongoing_usd": 50_000,   "fte_equiv": 1},
        "large":  {"one_time_usd": 400_000,    "annual_ongoing_usd": 150_000,  "fte_equiv": 2},
    },
}

# ---------------------------------------------------------------------------
# Regulatory interconnection / dependency map
# reg_id → list of reg_ids whose output is required as input
# ---------------------------------------------------------------------------

REGULATORY_INTERCONNECTION_MAP: dict[str, list[str]] = {
    "EU_SFDR_L3":            ["EU_CSRD_ESRS", "EU_TAXONOMY_DA", "EU_SFDR_L2_PAI"],
    "EU_SFDR_L2_PAI":        ["EU_CSRD_ESRS", "GLOBAL_ISSB_S1_S2"],
    "EU_EBA_PILLAR3_ESG":    ["EU_SFDR_L2_PAI", "EU_TAXONOMY_DA", "EU_CSRD_ESRS"],
    "EU_PRIIPS_OVERHAUL":    ["EU_SFDR_L3", "EU_CSRD_ESRS"],
    "EU_MIFID3_ESG":         ["EU_SFDR_L3", "EU_TAXONOMY_DA"],
    "EU_UCITS_ESG":          ["EU_SFDR_L3", "EU_TAXONOMY_DA"],
    "EU_AIFMD2_ESG":         ["EU_SFDR_L3", "EU_CSRD_ESRS"],
    "EU_CSRD_ESRS":          ["EU_TAXONOMY_DA", "GLOBAL_ISSB_S1_S2"],
    "EU_CSRD_PHASE2":        ["EU_CSRD_ESRS"],
    "EU_CSRD_SME_VSME":      ["EU_CSRD_ESRS"],
    "EU_ESRS_E1_TARGETS":    ["EU_CSRD_ESRS", "GLOBAL_ISSB_S1_S2"],
    "EU_TAXONOMY_DA":        ["EU_CSRD_ESRS"],
    "EU_ESAP":               ["EU_CSRD_ESRS", "EU_SFDR_L3", "EU_TAXONOMY_DA"],
    "EU_GREEN_BOND_STANDARD":["EU_TAXONOMY_DA", "EU_CSRD_ESRS"],
    "EU_TRANSITION_FINANCE": ["EU_CSRD_ESRS", "GLOBAL_ISSB_S1_S2"],
    "EU_SOLVENCY2_SUSTAINABILITY":["EU_SFDR_L3", "GLOBAL_NGFS_SCENARIO"],
    "EU_IORP2_CLIMATE":      ["EU_SFDR_L2_PAI", "GLOBAL_NGFS_SCENARIO"],
    "EU_PENSION_IORP_SFDR":  ["EU_SFDR_L2_PAI"],
    "EU_CSDDD":              ["EU_CSRD_ESRS", "EU_EUDR"],
    "EU_NRL":                ["EU_EUDR", "EU_CSRD_ESRS"],
    "EU_EUDR":               ["EU_CSRD_ESRS"],
    "EU_BASEL3_FINAL":       ["EU_EBA_PILLAR3_ESG"],
    "EU_RCF":                ["EU_BASEL3_FINAL", "GLOBAL_NGFS_SCENARIO"],
    "GLOBAL_ISSB_S1_S2":     ["GLOBAL_TCFD_SUPERSEDED"],
    "GLOBAL_TCFD_SUPERSEDED":["GLOBAL_ISSB_S1_S2"],
    "UK_SDR_FULL":           ["GLOBAL_ISSB_S1_S2", "EU_SFDR_L3"],
    "UK_TCFD_MANDATORY":     ["GLOBAL_TCFD_SUPERSEDED", "GLOBAL_ISSB_S1_S2"],
    "UK_ISSB_ADOPTION":      ["GLOBAL_ISSB_S1_S2"],
    "UK_TNFD_MANDATORY":     ["GLOBAL_TNFD_VOLUNTARY", "UK_TCFD_MANDATORY"],
    "AU_AASB_S1_S2":         ["GLOBAL_ISSB_S1_S2"],
    "AU_TNFD_MANDATORY":     ["GLOBAL_TNFD_VOLUNTARY", "AU_AASB_S1_S2"],
    "CA_ISSB_ADOPTION":      ["GLOBAL_ISSB_S1_S2"],
    "JP_ISSB_ADOPTION":      ["GLOBAL_ISSB_S1_S2"],
    "BR_ISSB_ADOPTION":      ["GLOBAL_ISSB_S1_S2"],
    "SG_ISSB_MANDATORY":     ["GLOBAL_ISSB_S1_S2"],
    "US_SEC_CLIMATE":        ["GLOBAL_TCFD_SUPERSEDED", "GLOBAL_ISSB_S1_S2"],
    "US_CA_SB253":           ["US_SEC_CLIMATE"],
    "US_CA_SB261":           ["GLOBAL_TCFD_SUPERSEDED"],
    "GLOBAL_BCBS_CLIMATE_P2":["GLOBAL_NGFS_SCENARIO"],
    "GLOBAL_TNFD_VOLUNTARY": [],
    "GLOBAL_NGFS_SCENARIO":  [],
    "GLOBAL_SBTN_CORPORATE": ["GLOBAL_TNFD_VOLUNTARY"],
    "GLOBAL_PCAF_STANDARD_V2":["EU_SFDR_L2_PAI"],
    "EU_AI_ACT":             [],
    "EU_AI_LIABILITY":       ["EU_AI_ACT"],
    "EU_DATA_ACT":           ["EU_AI_ACT"],
}

# Capability requirements per regulation for readiness assessment
REGULATION_REQUIREMENTS: dict[str, list[str]] = {
    "EU_CSRD_ESRS":       ["data_collection_esrs", "double_materiality", "xbrl_tagging", "assurance_isae3000", "value_chain_data"],
    "EU_SFDR_L3":         ["pai_calculation", "taxonomy_alignment", "product_templates", "data_vendors", "entity_pai_statement"],
    "EU_EBA_PILLAR3_ESG": ["financed_emissions_t7", "nace_sector_mapping", "gsr_btar_calc", "carbon_related_assets", "climate_var"],
    "EU_CSDDD":           ["value_chain_mapping", "human_rights_assessment", "grievance_mechanism", "remediation_process", "reporting"],
    "GLOBAL_ISSB_S1_S2":  ["governance_disclosures", "scenario_analysis", "scope3_categories", "sasb_metrics", "risk_opportunities"],
    "AU_AASB_S1_S2":      ["governance_disclosures", "scenario_analysis", "scope3_categories", "third_party_assurance"],
    "UK_SDR_FULL":        ["sustainability_label_criteria", "anti_greenwashing", "ongoing_product_reports", "naming_marketing"],
    "EU_AI_ACT":          ["ai_risk_classification", "conformity_assessment", "technical_documentation", "human_oversight"],
    "EU_TAXONOMY_DA":     ["taxonomy_eligibility_screening", "substantial_contribution", "dnsh_assessment", "min_safeguards"],
    "US_SEC_CLIMATE":     ["scope1_2_ghg", "material_scope3", "climate_risk_governance", "financial_statement_footnotes"],
}


# ---------------------------------------------------------------------------
# Engine class
# ---------------------------------------------------------------------------

class RegulatoryHorizonEngine:
    """
    E117 — Regulatory Horizon Scanning Engine
    60-regulation pipeline; entity applicability; compliance cost; synergy analysis.
    No database calls — all data is in-memory.
    """

    # ------------------------------------------------------------------
    # Horizon Scan
    # ------------------------------------------------------------------

    def scan_horizon(
        self,
        entity_type: str,
        jurisdiction: str,
        sectors: list[str],
        time_horizon_years: int = 5,
    ) -> dict[str, Any]:
        """
        Identify applicable regulations, sort by deadline + impact, estimate compliance cost,
        produce change velocity score and top-5 priority list.
        """
        import datetime
        today = datetime.date(2026, 3, 18)
        cutoff_year = today.year + time_horizon_years

        applicable: list[dict[str, Any]] = []
        for reg in REGULATION_PIPELINE:
            applies = (
                entity_type in reg["entity_types_affected"]
                or "all" in reg["entity_types_affected"]
            )
            # Jurisdiction filter — match if jurisdiction is "Global" or matches
            jur_match = (
                reg["jurisdiction"] == "Global"
                or jurisdiction.upper() in reg["jurisdiction"].upper()
                or reg["jurisdiction"].upper() in jurisdiction.upper()
            )
            try:
                deadline_year = int(reg["compliance_deadline"][:4])
            except Exception:
                deadline_year = 9999

            if applies and jur_match and deadline_year <= cutoff_year:
                applicable.append(reg)

        # Sort: first by deadline, then by impact_score descending
        applicable.sort(key=lambda r: (r["compliance_deadline"], -r["impact_score"]))

        # Compliance cost estimate (medium entity size default)
        total_one_time = 0
        total_annual = 0
        for reg in applicable:
            cat = reg["estimated_compliance_cost_category"]
            bench = COMPLIANCE_COST_BENCHMARKS.get(cat, {}).get("medium", {})
            total_one_time += bench.get("one_time_usd", 0)
            total_annual += bench.get("annual_ongoing_usd", 0)

        # Change velocity score: regulations per year in horizon
        regs_per_yr: dict[int, int] = {}
        for reg in applicable:
            yr = int(reg["compliance_deadline"][:4])
            regs_per_yr[yr] = regs_per_yr.get(yr, 0) + 1
        max_per_yr = max(regs_per_yr.values()) if regs_per_yr else 0
        change_velocity = round(min(10.0, max_per_yr * 1.5), 1)

        top5 = applicable[:5]

        return {
            "entity_type": entity_type,
            "jurisdiction": jurisdiction,
            "sectors": sectors,
            "time_horizon_years": time_horizon_years,
            "scan_date": str(today),
            "applicable_regulation_count": len(applicable),
            "applicable_regulations": [
                {
                    "regulation_id": r["regulation_id"],
                    "short_name": r["short_name"],
                    "topic": r["topic"],
                    "compliance_deadline": r["compliance_deadline"],
                    "impact_score": r["impact_score"],
                    "current_status": r["current_status"],
                    "cost_category": r["estimated_compliance_cost_category"],
                    "jurisdiction": r["jurisdiction"],
                }
                for r in applicable
            ],
            "compliance_cost_estimate": {
                "total_one_time_usd": total_one_time,
                "total_annual_ongoing_usd": total_annual,
                "basis": "medium entity size ($1-50B AUM)",
            },
            "change_velocity_score": change_velocity,
            "change_velocity_label": (
                "Very High" if change_velocity >= 8
                else "High" if change_velocity >= 6
                else "Moderate" if change_velocity >= 4
                else "Low"
            ),
            "regs_per_year_heatmap": regs_per_yr,
            "top_5_priorities": [
                {
                    "rank": i + 1,
                    "regulation_id": r["regulation_id"],
                    "short_name": r["short_name"],
                    "compliance_deadline": r["compliance_deadline"],
                    "impact_score": r["impact_score"],
                    "description": r["description"],
                }
                for i, r in enumerate(top5)
            ],
        }

    # ------------------------------------------------------------------
    # Implementation readiness
    # ------------------------------------------------------------------

    def assess_implementation_readiness(
        self,
        entity_type: str,
        current_capabilities: dict[str, bool],
        target_regulation: str,
    ) -> dict[str, Any]:
        """
        Gap analysis for a specific regulation.
        current_capabilities: {capability_name: bool}
        Returns readiness gap, effort estimate, timeline, dependency chain.
        """
        reg = next((r for r in REGULATION_PIPELINE if r["regulation_id"] == target_regulation), None)
        if not reg:
            return {"error": f"Unknown regulation_id: {target_regulation}"}

        required = REGULATION_REQUIREMENTS.get(target_regulation, [
            "data_collection", "reporting_system", "governance_update"
        ])

        gaps: list[dict[str, Any]] = []
        met_count = 0
        for req in required:
            has_it = current_capabilities.get(req, False)
            if has_it:
                met_count += 1
            else:
                effort = _estimate_effort(req, reg["estimated_compliance_cost_category"])
                gaps.append({
                    "requirement": req,
                    "status": "gap",
                    "effort_months": effort["months"],
                    "fte_months": effort["fte_months"],
                    "estimated_cost_usd": effort["cost_usd"],
                    "priority": "critical" if req in required[:2] else "important",
                })

        readiness_pct = round(met_count / max(len(required), 1) * 100, 1)
        total_months = max((g["effort_months"] for g in gaps), default=0)
        total_fte_months = sum(g["fte_months"] for g in gaps)

        # Dependency chain
        deps = REGULATORY_INTERCONNECTION_MAP.get(target_regulation, [])
        dependency_chain = []
        for dep_id in deps:
            dep_reg = next((r for r in REGULATION_PIPELINE if r["regulation_id"] == dep_id), None)
            if dep_reg:
                dependency_chain.append({
                    "regulation_id": dep_id,
                    "short_name": dep_reg["short_name"],
                    "status": dep_reg["current_status"],
                    "compliance_deadline": dep_reg["compliance_deadline"],
                })

        return {
            "target_regulation": target_regulation,
            "short_name": reg["short_name"],
            "entity_type": entity_type,
            "compliance_deadline": reg["compliance_deadline"],
            "readiness_pct": readiness_pct,
            "readiness_tier": (
                "Ready" if readiness_pct >= 80
                else "Nearly Ready" if readiness_pct >= 60
                else "Requires Work" if readiness_pct >= 30
                else "Not Started"
            ),
            "requirements_met": met_count,
            "requirements_total": len(required),
            "gaps": gaps,
            "total_effort_months_critical_path": total_months,
            "total_fte_months": total_fte_months,
            "estimated_completion_months": total_months,
            "dependency_chain": dependency_chain,
            "recommendation": (
                f"Address {len(gaps)} gaps. Critical path: {total_months} months. "
                f"Start with {gaps[0]['requirement'] if gaps else 'maintain current state'}."
            ),
        }

    # ------------------------------------------------------------------
    # Regulatory burden
    # ------------------------------------------------------------------

    def calculate_regulatory_burden(
        self,
        entity_type: str,
        aum_usd_bn: float,
        jurisdiction: str,
    ) -> dict[str, Any]:
        """
        Estimate total compliance cost across all applicable regulations.
        """
        size_bucket = "small" if aum_usd_bn < 1 else "medium" if aum_usd_bn <= 50 else "large"
        applicable_regs = [
            r for r in REGULATION_PIPELINE
            if entity_type in r["entity_types_affected"] or "all" in r["entity_types_affected"]
        ]

        cost_breakdown: list[dict[str, Any]] = []
        total_one_time = 0
        total_annual = 0
        total_fte = 0

        for reg in applicable_regs:
            cat = reg["estimated_compliance_cost_category"]
            bench = COMPLIANCE_COST_BENCHMARKS.get(cat, {}).get(size_bucket, {})
            ot = bench.get("one_time_usd", 0)
            ann = bench.get("annual_ongoing_usd", 0)
            fte = bench.get("fte_equiv", 0)
            total_one_time += ot
            total_annual += ann
            total_fte += fte
            cost_breakdown.append({
                "regulation_id": reg["regulation_id"],
                "short_name": reg["short_name"],
                "cost_category": cat,
                "one_time_usd": ot,
                "annual_ongoing_usd": ann,
                "fte_equiv": fte,
            })

        # External advisor cost estimate (typically 30-40% of internal cost for large FIs)
        ext_advisor_pct = 0.35 if size_bucket == "large" else 0.25
        external_advisor_usd = round((total_one_time + total_annual) * ext_advisor_pct, 0)

        # Technology investment (40-60% of one-time for data/systems)
        tech_investment_usd = round(total_one_time * 0.50, 0)

        return {
            "entity_type": entity_type,
            "aum_usd_bn": aum_usd_bn,
            "size_bucket": size_bucket,
            "jurisdiction": jurisdiction,
            "applicable_regulation_count": len(applicable_regs),
            "cost_breakdown": cost_breakdown,
            "summary": {
                "total_one_time_usd": total_one_time,
                "total_annual_ongoing_usd": total_annual,
                "total_fte_equivalent": total_fte,
                "technology_investment_usd": tech_investment_usd,
                "external_advisor_cost_usd": external_advisor_usd,
                "total_year1_cost_usd": total_one_time + total_annual + external_advisor_usd,
                "cost_as_pct_aum": round(
                    (total_one_time + total_annual + external_advisor_usd)
                    / max(aum_usd_bn * 1e9, 1) * 100, 4
                ),
            },
            "by_cost_category": {
                cat: sum(r["one_time_usd"] for r in cost_breakdown if r["cost_category"] == cat)
                for cat in ("very_high", "high", "medium", "low")
            },
            "by_topic": _aggregate_by(cost_breakdown, applicable_regs, "topic"),
        }

    # ------------------------------------------------------------------
    # Synergy analysis
    # ------------------------------------------------------------------

    def identify_synergies(
        self,
        regulation_list: list[str],
    ) -> dict[str, Any]:
        """
        Identify shared data requirements, process overlaps, implementation savings,
        and sequencing recommendations across a set of regulations.
        """
        selected_regs = [
            r for r in REGULATION_PIPELINE
            if r["regulation_id"] in regulation_list
        ]

        # Shared requirements
        all_req_sets: dict[str, set] = {}
        for reg in selected_regs:
            reqs = set(REGULATION_REQUIREMENTS.get(reg["regulation_id"], []))
            all_req_sets[reg["regulation_id"]] = reqs

        shared_requirements: dict[str, list[str]] = {}
        all_req_list = [req for reqs in all_req_sets.values() for req in reqs]
        for req in set(all_req_list):
            regs_using = [rid for rid, reqs in all_req_sets.items() if req in reqs]
            if len(regs_using) > 1:
                shared_requirements[req] = regs_using

        # Process overlaps from interconnection map
        dependency_overlaps: list[dict[str, Any]] = []
        for reg_id in regulation_list:
            deps = REGULATORY_INTERCONNECTION_MAP.get(reg_id, [])
            for dep in deps:
                if dep in regulation_list:
                    dep_reg = next((r for r in REGULATION_PIPELINE if r["regulation_id"] == dep), None)
                    if dep_reg:
                        dependency_overlaps.append({
                            "regulation": reg_id,
                            "uses_output_of": dep,
                            "short_name_dep": dep_reg["short_name"],
                            "data_reuse_possible": True,
                        })

        # Savings estimate — 20% saving per shared requirement
        savings_pct_per_shared = 0.20
        total_shared = len(shared_requirements)
        combined_savings_pct = min(45.0, total_shared * savings_pct_per_shared * 100)

        # Sequencing recommendations — order by dependency and deadline
        seq_order = _topological_sort(regulation_list)

        return {
            "regulation_count": len(selected_regs),
            "regulations_analysed": [
                {"id": r["regulation_id"], "short_name": r["short_name"]}
                for r in selected_regs
            ],
            "shared_data_requirements": shared_requirements,
            "shared_requirement_count": len(shared_requirements),
            "process_overlaps": dependency_overlaps,
            "combined_implementation_savings_pct": round(combined_savings_pct, 1),
            "combined_savings_note": f"Estimated {combined_savings_pct:.0f}% saving vs. siloed implementation",
            "sequencing_recommendations": seq_order,
            "quick_wins": [
                req for req, regs in shared_requirements.items() if len(regs) >= 3
            ],
            "advice": (
                "Implement CSRD/ESRS data infrastructure first — it feeds SFDR PAI, "
                "EU Taxonomy, Pillar 3 ESG and ISSB S1/S2 simultaneously. "
                "A single ESRS data platform reduces regulatory data cost by ~30%."
            ),
        }

    # ------------------------------------------------------------------
    # Reference data helpers
    # ------------------------------------------------------------------

    def ref_regulation_pipeline(self) -> dict[str, Any]:
        return {
            "count": len(REGULATION_PIPELINE),
            "entity_types": ENTITY_TYPES,
            "status_values": ["consultation", "proposed", "level2", "adopted", "in_force"],
            "topic_values": ["climate", "biodiversity", "social", "governance", "AI", "reporting"],
            "regulations": REGULATION_PIPELINE,
        }

    def ref_entity_applicability(self) -> dict[str, Any]:
        return {
            "entity_types": ENTITY_TYPES,
            "applicability_matrix": ENTITY_APPLICABILITY_MATRIX,
        }

    def ref_cost_benchmarks(self) -> dict[str, Any]:
        return {
            "size_buckets": {
                "small": "<$1B AUM / <€50M revenue",
                "medium": "$1-50B AUM / €50M-€1B revenue",
                "large": ">$50B AUM / >€1B revenue",
            },
            "benchmarks": COMPLIANCE_COST_BENCHMARKS,
            "note": "One-time costs include system build, training, policy update. Annual ongoing includes data, reporting, governance.",
        }

    def ref_interconnection_map(self) -> dict[str, Any]:
        return {
            "description": "regulation_id → list of regulation_ids whose output/data is required as input",
            "interconnection_map": REGULATORY_INTERCONNECTION_MAP,
            "requirement_map": REGULATION_REQUIREMENTS,
        }


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def _estimate_effort(requirement: str, cost_cat: str) -> dict[str, Any]:
    base_months = {"very_high": 9, "high": 6, "medium": 3, "low": 1}.get(cost_cat, 4)
    fte_ratio = {"very_high": 3.0, "high": 2.0, "medium": 1.5, "low": 0.5}.get(cost_cat, 1.5)
    cost_map = {"very_high": 400_000, "high": 150_000, "medium": 60_000, "low": 15_000}
    return {
        "months": base_months,
        "fte_months": round(base_months * fte_ratio, 1),
        "cost_usd": cost_map.get(cost_cat, 50_000),
    }


def _aggregate_by(
    cost_breakdown: list[dict[str, Any]],
    regulations: list[dict[str, Any]],
    field: str,
) -> dict[str, float]:
    topic_map = {r["regulation_id"]: r[field] for r in regulations}
    totals: dict[str, float] = {}
    for row in cost_breakdown:
        topic = topic_map.get(row["regulation_id"], "other")
        totals[topic] = totals.get(topic, 0) + row["one_time_usd"] + row["annual_ongoing_usd"]
    return totals


def _topological_sort(regulation_ids: list[str]) -> list[dict[str, Any]]:
    """Simple dependency-aware sort — regulations with more dependents come last."""
    dependent_count: dict[str, int] = {r: 0 for r in regulation_ids}
    for reg_id in regulation_ids:
        deps = REGULATORY_INTERCONNECTION_MAP.get(reg_id, [])
        for dep in deps:
            if dep in dependent_count:
                dependent_count[reg_id] = dependent_count.get(reg_id, 0) + 1

    sorted_ids = sorted(regulation_ids, key=lambda r: dependent_count.get(r, 0))
    result = []
    for i, reg_id in enumerate(sorted_ids):
        reg = next((r for r in REGULATION_PIPELINE if r["regulation_id"] == reg_id), None)
        if reg:
            result.append({
                "sequence": i + 1,
                "regulation_id": reg_id,
                "short_name": reg["short_name"],
                "compliance_deadline": reg["compliance_deadline"],
                "rationale": "Feeds downstream regulations — implement early" if dependent_count.get(reg_id, 0) == 0 else "Has dependencies — implement after prerequisites",
            })
    return result


def get_engine() -> RegulatoryHorizonEngine:
    return RegulatoryHorizonEngine()
