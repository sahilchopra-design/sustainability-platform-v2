"""
E107 — Sustainable Sovereign & SWF Engine
Covers: 25 major SWF profiles, IWG-SWF Santiago Principles (24 GAPP),
Norwegian GPFG exclusion model, portfolio temperature alignment (PACTA),
fossil-fuel divestment pathways, and Hartwick Rule intergenerational equity.
No DB calls — all reference data hardcoded.
"""

from __future__ import annotations

import math
from typing import Any

# ---------------------------------------------------------------------------
# Reference Data
# ---------------------------------------------------------------------------

# 25 Major Sovereign Wealth Fund Profiles
SWF_PROFILES: dict[str, dict[str, Any]] = {
    "GPFG": {
        "full_name": "Government Pension Fund Global (Norway)",
        "country": "NO",
        "manager": "Norges Bank Investment Management (NBIM)",
        "aum_usd_bn": 1700,
        "established_year": 1990,
        "mandate": "fiscal_stabilisation_and_intergenerational_savings",
        "esg_policy": True,
        "exclusion_policy": True,
        "climate_commitment": "leading",
        "santiago_principles_score": 22,
        "fossil_fuel_exposure_pct": 4.2,
        "portfolio_temp_c": 2.1,
        "divestment_commitment": True,
        "net_zero_target_year": 2050,
        "green_bond_allocation_usd_bn": 28,
        "active_ownership": True,
        "reporting_standard": "PRI + TCFD + ISSB S2",
        "asset_allocation": {"equities_pct": 72, "bonds_pct": 26, "real_estate_pct": 2, "infra_pct": 0},
    },
    "ADIA": {
        "full_name": "Abu Dhabi Investment Authority",
        "country": "AE",
        "manager": "ADIA",
        "aum_usd_bn": 900,
        "established_year": 1976,
        "mandate": "fiscal_stabilisation_and_intergenerational_savings",
        "esg_policy": True,
        "exclusion_policy": False,
        "climate_commitment": "partial",
        "santiago_principles_score": 18,
        "fossil_fuel_exposure_pct": 12.5,
        "portfolio_temp_c": 2.8,
        "divestment_commitment": False,
        "net_zero_target_year": None,
        "green_bond_allocation_usd_bn": 5,
        "active_ownership": False,
        "reporting_standard": "TCFD_partial",
        "asset_allocation": {"equities_pct": 55, "bonds_pct": 20, "real_estate_pct": 12, "infra_pct": 13},
    },
    "KIA": {
        "full_name": "Kuwait Investment Authority",
        "country": "KW",
        "manager": "KIA",
        "aum_usd_bn": 750,
        "established_year": 1953,
        "mandate": "fiscal_stabilisation_and_intergenerational_savings",
        "esg_policy": False,
        "exclusion_policy": False,
        "climate_commitment": "none",
        "santiago_principles_score": 14,
        "fossil_fuel_exposure_pct": 18.0,
        "portfolio_temp_c": 3.2,
        "divestment_commitment": False,
        "net_zero_target_year": None,
        "green_bond_allocation_usd_bn": 0,
        "active_ownership": False,
        "reporting_standard": "none",
        "asset_allocation": {"equities_pct": 60, "bonds_pct": 25, "real_estate_pct": 10, "infra_pct": 5},
    },
    "PIF": {
        "full_name": "Public Investment Fund (Saudi Arabia)",
        "country": "SA",
        "manager": "PIF",
        "aum_usd_bn": 700,
        "established_year": 1971,
        "mandate": "economic_diversification",
        "esg_policy": True,
        "exclusion_policy": False,
        "climate_commitment": "partial",
        "santiago_principles_score": 16,
        "fossil_fuel_exposure_pct": 22.0,
        "portfolio_temp_c": 3.0,
        "divestment_commitment": False,
        "net_zero_target_year": 2060,
        "green_bond_allocation_usd_bn": 8,
        "active_ownership": False,
        "reporting_standard": "TCFD_partial",
        "asset_allocation": {"equities_pct": 50, "bonds_pct": 10, "real_estate_pct": 20, "infra_pct": 20},
    },
    "GIC": {
        "full_name": "GIC Private Limited (Singapore)",
        "country": "SG",
        "manager": "GIC",
        "aum_usd_bn": 770,
        "established_year": 1981,
        "mandate": "long_term_investment_of_foreign_reserves",
        "esg_policy": True,
        "exclusion_policy": True,
        "climate_commitment": "committed",
        "santiago_principles_score": 21,
        "fossil_fuel_exposure_pct": 5.5,
        "portfolio_temp_c": 2.3,
        "divestment_commitment": True,
        "net_zero_target_year": 2050,
        "green_bond_allocation_usd_bn": 12,
        "active_ownership": True,
        "reporting_standard": "PRI + TCFD",
        "asset_allocation": {"equities_pct": 46, "bonds_pct": 30, "real_estate_pct": 9, "infra_pct": 15},
    },
    "Temasek": {
        "full_name": "Temasek Holdings (Singapore)",
        "country": "SG",
        "manager": "Temasek",
        "aum_usd_bn": 290,
        "established_year": 1974,
        "mandate": "shareholder_value_creation",
        "esg_policy": True,
        "exclusion_policy": True,
        "climate_commitment": "leading",
        "santiago_principles_score": 20,
        "fossil_fuel_exposure_pct": 3.0,
        "portfolio_temp_c": 1.9,
        "divestment_commitment": True,
        "net_zero_target_year": 2050,
        "green_bond_allocation_usd_bn": 7,
        "active_ownership": True,
        "reporting_standard": "TCFD + GRI + ISSB S2",
        "asset_allocation": {"equities_pct": 75, "bonds_pct": 5, "real_estate_pct": 12, "infra_pct": 8},
    },
    "CPPIB": {
        "full_name": "CPP Investments (Canada)",
        "country": "CA",
        "manager": "CPP Investments",
        "aum_usd_bn": 570,
        "established_year": 1997,
        "mandate": "pension_benefit_security",
        "esg_policy": True,
        "exclusion_policy": False,
        "climate_commitment": "committed",
        "santiago_principles_score": 22,
        "fossil_fuel_exposure_pct": 7.8,
        "portfolio_temp_c": 2.4,
        "divestment_commitment": False,
        "net_zero_target_year": 2050,
        "green_bond_allocation_usd_bn": 18,
        "active_ownership": True,
        "reporting_standard": "TCFD + PRI + ISSB S2",
        "asset_allocation": {"equities_pct": 35, "bonds_pct": 20, "real_estate_pct": 13, "infra_pct": 32},
    },
    "CIC": {
        "full_name": "China Investment Corporation",
        "country": "CN",
        "manager": "CIC",
        "aum_usd_bn": 1300,
        "established_year": 2007,
        "mandate": "foreign_exchange_reserve_diversification",
        "esg_policy": True,
        "exclusion_policy": False,
        "climate_commitment": "partial",
        "santiago_principles_score": 17,
        "fossil_fuel_exposure_pct": 10.5,
        "portfolio_temp_c": 2.9,
        "divestment_commitment": False,
        "net_zero_target_year": 2060,
        "green_bond_allocation_usd_bn": 20,
        "active_ownership": False,
        "reporting_standard": "TCFD_partial",
        "asset_allocation": {"equities_pct": 45, "bonds_pct": 35, "real_estate_pct": 10, "infra_pct": 10},
    },
    "QIA": {
        "full_name": "Qatar Investment Authority",
        "country": "QA",
        "manager": "QIA",
        "aum_usd_bn": 475,
        "established_year": 2005,
        "mandate": "fiscal_stabilisation_and_diversification",
        "esg_policy": True,
        "exclusion_policy": False,
        "climate_commitment": "partial",
        "santiago_principles_score": 17,
        "fossil_fuel_exposure_pct": 14.0,
        "portfolio_temp_c": 2.9,
        "divestment_commitment": False,
        "net_zero_target_year": None,
        "green_bond_allocation_usd_bn": 3,
        "active_ownership": False,
        "reporting_standard": "TCFD_partial",
        "asset_allocation": {"equities_pct": 55, "bonds_pct": 15, "real_estate_pct": 20, "infra_pct": 10},
    },
    "AlaskaPF": {
        "full_name": "Alaska Permanent Fund",
        "country": "US",
        "manager": "APFC",
        "aum_usd_bn": 80,
        "established_year": 1976,
        "mandate": "intergenerational_savings_from_oil_revenues",
        "esg_policy": True,
        "exclusion_policy": False,
        "climate_commitment": "partial",
        "santiago_principles_score": 18,
        "fossil_fuel_exposure_pct": 8.5,
        "portfolio_temp_c": 2.7,
        "divestment_commitment": False,
        "net_zero_target_year": None,
        "green_bond_allocation_usd_bn": 1,
        "active_ownership": False,
        "reporting_standard": "PRI",
        "asset_allocation": {"equities_pct": 38, "bonds_pct": 22, "real_estate_pct": 13, "infra_pct": 27},
    },
    "SAFE": {
        "full_name": "SAFE Investment Company (China)",
        "country": "CN",
        "manager": "SAFE",
        "aum_usd_bn": 1050,
        "established_year": 1997,
        "mandate": "foreign_exchange_reserve_management",
        "esg_policy": False,
        "exclusion_policy": False,
        "climate_commitment": "none",
        "santiago_principles_score": 10,
        "fossil_fuel_exposure_pct": 9.0,
        "portfolio_temp_c": 3.1,
        "divestment_commitment": False,
        "net_zero_target_year": None,
        "green_bond_allocation_usd_bn": 5,
        "active_ownership": False,
        "reporting_standard": "none",
        "asset_allocation": {"equities_pct": 40, "bonds_pct": 55, "real_estate_pct": 3, "infra_pct": 2},
    },
    "Mubadala": {
        "full_name": "Mubadala Investment Company (Abu Dhabi)",
        "country": "AE",
        "manager": "Mubadala",
        "aum_usd_bn": 280,
        "established_year": 2002,
        "mandate": "economic_diversification",
        "esg_policy": True,
        "exclusion_policy": False,
        "climate_commitment": "committed",
        "santiago_principles_score": 17,
        "fossil_fuel_exposure_pct": 15.0,
        "portfolio_temp_c": 2.6,
        "divestment_commitment": False,
        "net_zero_target_year": 2050,
        "green_bond_allocation_usd_bn": 6,
        "active_ownership": True,
        "reporting_standard": "TCFD",
        "asset_allocation": {"equities_pct": 40, "bonds_pct": 10, "real_estate_pct": 20, "infra_pct": 30},
    },
    "AFF": {
        "full_name": "Australian Future Fund",
        "country": "AU",
        "manager": "Future Fund Board",
        "aum_usd_bn": 150,
        "established_year": 2006,
        "mandate": "pension_liability_pre_funding",
        "esg_policy": True,
        "exclusion_policy": True,
        "climate_commitment": "committed",
        "santiago_principles_score": 21,
        "fossil_fuel_exposure_pct": 3.5,
        "portfolio_temp_c": 2.2,
        "divestment_commitment": True,
        "net_zero_target_year": 2050,
        "green_bond_allocation_usd_bn": 4,
        "active_ownership": True,
        "reporting_standard": "TCFD + PRI",
        "asset_allocation": {"equities_pct": 25, "bonds_pct": 10, "real_estate_pct": 8, "infra_pct": 57},
    },
    "NZSF": {
        "full_name": "New Zealand Superannuation Fund",
        "country": "NZ",
        "manager": "Guardians of NZ Super",
        "aum_usd_bn": 55,
        "established_year": 2001,
        "mandate": "partial_pre_funding_of_superannuation",
        "esg_policy": True,
        "exclusion_policy": True,
        "climate_commitment": "leading",
        "santiago_principles_score": 22,
        "fossil_fuel_exposure_pct": 1.8,
        "portfolio_temp_c": 1.7,
        "divestment_commitment": True,
        "net_zero_target_year": 2050,
        "green_bond_allocation_usd_bn": 3,
        "active_ownership": True,
        "reporting_standard": "TCFD + PRI + ISSB S2",
        "asset_allocation": {"equities_pct": 62, "bonds_pct": 10, "real_estate_pct": 8, "infra_pct": 20},
    },
    "Khazanah": {
        "full_name": "Khazanah Nasional (Malaysia)",
        "country": "MY",
        "manager": "Khazanah",
        "aum_usd_bn": 35,
        "established_year": 1993,
        "mandate": "strategic_investment_and_commercial_returns",
        "esg_policy": True,
        "exclusion_policy": False,
        "climate_commitment": "partial",
        "santiago_principles_score": 16,
        "fossil_fuel_exposure_pct": 9.0,
        "portfolio_temp_c": 2.7,
        "divestment_commitment": False,
        "net_zero_target_year": 2050,
        "green_bond_allocation_usd_bn": 1,
        "active_ownership": True,
        "reporting_standard": "GRI",
        "asset_allocation": {"equities_pct": 70, "bonds_pct": 10, "real_estate_pct": 15, "infra_pct": 5},
    },
    "ISIF": {
        "full_name": "Ireland Strategic Investment Fund",
        "country": "IE",
        "manager": "NTMA",
        "aum_usd_bn": 14,
        "established_year": 2014,
        "mandate": "economic_impact_investment",
        "esg_policy": True,
        "exclusion_policy": True,
        "climate_commitment": "committed",
        "santiago_principles_score": 20,
        "fossil_fuel_exposure_pct": 2.0,
        "portfolio_temp_c": 2.0,
        "divestment_commitment": True,
        "net_zero_target_year": 2050,
        "green_bond_allocation_usd_bn": 1,
        "active_ownership": True,
        "reporting_standard": "TCFD + PRI",
        "asset_allocation": {"equities_pct": 30, "bonds_pct": 20, "real_estate_pct": 15, "infra_pct": 35},
    },
    "BpiFrance": {
        "full_name": "Bpifrance (France)",
        "country": "FR",
        "manager": "Bpifrance",
        "aum_usd_bn": 30,
        "established_year": 2012,
        "mandate": "development_finance_and_strategic_investment",
        "esg_policy": True,
        "exclusion_policy": True,
        "climate_commitment": "committed",
        "santiago_principles_score": 19,
        "fossil_fuel_exposure_pct": 3.5,
        "portfolio_temp_c": 2.1,
        "divestment_commitment": True,
        "net_zero_target_year": 2050,
        "green_bond_allocation_usd_bn": 4,
        "active_ownership": True,
        "reporting_standard": "TCFD + SFDR Art.8 + ISSB S2",
        "asset_allocation": {"equities_pct": 55, "bonds_pct": 15, "real_estate_pct": 10, "infra_pct": 20},
    },
    "TexasPSF": {
        "full_name": "Texas Permanent School Fund",
        "country": "US",
        "manager": "Texas Education Agency",
        "aum_usd_bn": 52,
        "established_year": 1854,
        "mandate": "school_funding_endowment",
        "esg_policy": False,
        "exclusion_policy": False,
        "climate_commitment": "none",
        "santiago_principles_score": 11,
        "fossil_fuel_exposure_pct": 20.0,
        "portfolio_temp_c": 3.5,
        "divestment_commitment": False,
        "net_zero_target_year": None,
        "green_bond_allocation_usd_bn": 0,
        "active_ownership": False,
        "reporting_standard": "none",
        "asset_allocation": {"equities_pct": 55, "bonds_pct": 35, "real_estate_pct": 7, "infra_pct": 3},
    },
    "CalPERS": {
        "full_name": "California Public Employees' Retirement System",
        "country": "US",
        "manager": "CalPERS",
        "aum_usd_bn": 460,
        "established_year": 1932,
        "mandate": "pension_benefit_security",
        "esg_policy": True,
        "exclusion_policy": True,
        "climate_commitment": "committed",
        "santiago_principles_score": 21,
        "fossil_fuel_exposure_pct": 5.0,
        "portfolio_temp_c": 2.3,
        "divestment_commitment": True,
        "net_zero_target_year": 2050,
        "green_bond_allocation_usd_bn": 15,
        "active_ownership": True,
        "reporting_standard": "TCFD + PRI + ISSB S2",
        "asset_allocation": {"equities_pct": 50, "bonds_pct": 28, "real_estate_pct": 13, "infra_pct": 9},
    },
    "CalSTRS": {
        "full_name": "California State Teachers' Retirement System",
        "country": "US",
        "manager": "CalSTRS",
        "aum_usd_bn": 320,
        "established_year": 1913,
        "mandate": "pension_benefit_security",
        "esg_policy": True,
        "exclusion_policy": True,
        "climate_commitment": "committed",
        "santiago_principles_score": 21,
        "fossil_fuel_exposure_pct": 4.5,
        "portfolio_temp_c": 2.2,
        "divestment_commitment": True,
        "net_zero_target_year": 2050,
        "green_bond_allocation_usd_bn": 12,
        "active_ownership": True,
        "reporting_standard": "TCFD + PRI",
        "asset_allocation": {"equities_pct": 55, "bonds_pct": 15, "real_estate_pct": 15, "infra_pct": 15},
    },
    "AP1": {
        "full_name": "AP1 First Swedish National Pension Fund",
        "country": "SE",
        "manager": "AP1",
        "aum_usd_bn": 48,
        "established_year": 2001,
        "mandate": "national_pension_buffer_fund",
        "esg_policy": True,
        "exclusion_policy": True,
        "climate_commitment": "leading",
        "santiago_principles_score": 22,
        "fossil_fuel_exposure_pct": 1.5,
        "portfolio_temp_c": 1.8,
        "divestment_commitment": True,
        "net_zero_target_year": 2050,
        "green_bond_allocation_usd_bn": 5,
        "active_ownership": True,
        "reporting_standard": "TCFD + PRI + CSRD + ISSB S2",
        "asset_allocation": {"equities_pct": 60, "bonds_pct": 20, "real_estate_pct": 10, "infra_pct": 10},
    },
    "NBIM": {
        "full_name": "Norges Bank Investment Management (NBIM)",
        "country": "NO",
        "manager": "NBIM",
        "aum_usd_bn": 1700,
        "established_year": 1998,
        "mandate": "management_of_GPFG",
        "esg_policy": True,
        "exclusion_policy": True,
        "climate_commitment": "leading",
        "santiago_principles_score": 22,
        "fossil_fuel_exposure_pct": 4.2,
        "portfolio_temp_c": 2.1,
        "divestment_commitment": True,
        "net_zero_target_year": 2050,
        "green_bond_allocation_usd_bn": 28,
        "active_ownership": True,
        "reporting_standard": "PRI + TCFD + ISSB S2 + GRI",
        "asset_allocation": {"equities_pct": 72, "bonds_pct": 26, "real_estate_pct": 2, "infra_pct": 0},
    },
    "BCI": {
        "full_name": "British Columbia Investment Management Corporation",
        "country": "CA",
        "manager": "BCI",
        "aum_usd_bn": 200,
        "established_year": 1999,
        "mandate": "pension_and_public_fund_management",
        "esg_policy": True,
        "exclusion_policy": True,
        "climate_commitment": "committed",
        "santiago_principles_score": 21,
        "fossil_fuel_exposure_pct": 5.2,
        "portfolio_temp_c": 2.3,
        "divestment_commitment": True,
        "net_zero_target_year": 2050,
        "green_bond_allocation_usd_bn": 8,
        "active_ownership": True,
        "reporting_standard": "TCFD + PRI + ISSB S2",
        "asset_allocation": {"equities_pct": 40, "bonds_pct": 25, "real_estate_pct": 15, "infra_pct": 20},
    },
    "IPIC": {
        "full_name": "Abu Dhabi Investment Council (now Mubadala unit)",
        "country": "AE",
        "manager": "Mubadala / IPIC",
        "aum_usd_bn": 120,
        "established_year": 2007,
        "mandate": "strategic_investment",
        "esg_policy": False,
        "exclusion_policy": False,
        "climate_commitment": "none",
        "santiago_principles_score": 12,
        "fossil_fuel_exposure_pct": 30.0,
        "portfolio_temp_c": 3.6,
        "divestment_commitment": False,
        "net_zero_target_year": None,
        "green_bond_allocation_usd_bn": 0,
        "active_ownership": False,
        "reporting_standard": "none",
        "asset_allocation": {"equities_pct": 35, "bonds_pct": 10, "real_estate_pct": 25, "infra_pct": 30},
    },
    "NSIA": {
        "full_name": "Nigeria Sovereign Investment Authority",
        "country": "NG",
        "manager": "NSIA",
        "aum_usd_bn": 3,
        "established_year": 2011,
        "mandate": "stabilisation_future_generations_infrastructure",
        "esg_policy": False,
        "exclusion_policy": False,
        "climate_commitment": "none",
        "santiago_principles_score": 13,
        "fossil_fuel_exposure_pct": 25.0,
        "portfolio_temp_c": 3.3,
        "divestment_commitment": False,
        "net_zero_target_year": None,
        "green_bond_allocation_usd_bn": 0,
        "active_ownership": False,
        "reporting_standard": "none",
        "asset_allocation": {"equities_pct": 20, "bonds_pct": 30, "real_estate_pct": 20, "infra_pct": 30},
    },
}

# IWG-SWF Santiago Principles — 24 GAPP Principles (2008 + 2023 ESG update)
SANTIAGO_PRINCIPLES: list[dict[str, Any]] = [
    # Pillar 1: Legal Framework (GAPP 1-8)
    {"gapp": "GAPP-01", "pillar": "legal_framework", "title": "Legal framework, objectives, and coordination",
     "description": "SWF activities should be set up on a sound legal basis; purpose and objectives clearly defined.",
     "esg_relevance": "low", "esg_update_2023": False,
     "compliance_criteria": ["legal_basis_documented", "objectives_published", "coordination_with_fiscal_policy"]},
    {"gapp": "GAPP-02", "pillar": "legal_framework", "title": "Policy purpose",
     "description": "Purpose of the SWF should be clearly defined and publicly disclosed.",
     "esg_relevance": "medium", "esg_update_2023": False,
     "compliance_criteria": ["purpose_published_annually", "investment_mandate_stated"]},
    {"gapp": "GAPP-03", "pillar": "legal_framework", "title": "Home country fiscal rules",
     "description": "Where applicable, SWF should have clear rules regarding transfers and withdrawals.",
     "esg_relevance": "low", "esg_update_2023": False,
     "compliance_criteria": ["withdrawal_rules_documented", "fiscal_rule_linkage"]},
    {"gapp": "GAPP-04", "pillar": "legal_framework", "title": "Disclosure of investment policies",
     "description": "Investment policies and risk management should be disclosed to the public.",
     "esg_relevance": "high", "esg_update_2023": True,
     "compliance_criteria": ["esg_policy_published", "exclusion_list_published", "climate_policy_published"]},
    {"gapp": "GAPP-05", "pillar": "legal_framework", "title": "Ownership rights protection",
     "description": "SWF should protect its assets from political interference; arms-length investment.",
     "esg_relevance": "low", "esg_update_2023": False,
     "compliance_criteria": ["governance_independence", "no_political_interference_clause"]},
    {"gapp": "GAPP-06", "pillar": "legal_framework", "title": "Accountability and auditing",
     "description": "SWF operations should be subject to auditing and reporting obligations.",
     "esg_relevance": "medium", "esg_update_2023": True,
     "compliance_criteria": ["independent_audit", "annual_report_published", "esg_audited"]},
    {"gapp": "GAPP-07", "pillar": "legal_framework", "title": "Spending rules",
     "description": "If applicable, rules for annual spending from SWF should be clearly established.",
     "esg_relevance": "low", "esg_update_2023": False,
     "compliance_criteria": ["spending_rule_documented"]},
    {"gapp": "GAPP-08", "pillar": "legal_framework", "title": "Cross-entity coordination",
     "description": "Coordination between SWF, central bank, and ministry of finance should be formalized.",
     "esg_relevance": "low", "esg_update_2023": False,
     "compliance_criteria": ["mou_with_central_bank_or_finance_ministry"]},
    # Pillar 2: Institutional Framework & Governance (GAPP 9-15)
    {"gapp": "GAPP-09", "pillar": "institutional_governance", "title": "Governance framework",
     "description": "SWF should have a sound governance structure with clear roles and responsibilities.",
     "esg_relevance": "medium", "esg_update_2023": True,
     "compliance_criteria": ["board_charter_published", "esg_committee_exists", "cio_accountability"]},
    {"gapp": "GAPP-10", "pillar": "institutional_governance", "title": "Accountability to owner",
     "description": "Operational management should be accountable to the governing body.",
     "esg_relevance": "low", "esg_update_2023": False,
     "compliance_criteria": ["performance_review_annual"]},
    {"gapp": "GAPP-11", "pillar": "institutional_governance", "title": "Annual reports",
     "description": "SWF should prepare timely, comprehensive annual reports.",
     "esg_relevance": "high", "esg_update_2023": True,
     "compliance_criteria": ["annual_report_timely", "esg_data_in_report", "tcfd_aligned_report"]},
    {"gapp": "GAPP-12", "pillar": "institutional_governance", "title": "Investment committee",
     "description": "Investment decisions should be based on economic and financial considerations.",
     "esg_relevance": "high", "esg_update_2023": True,
     "compliance_criteria": ["esg_in_investment_process", "exclusion_criteria_applied", "stewardship_policy"]},
    {"gapp": "GAPP-13", "pillar": "institutional_governance", "title": "Risk management",
     "description": "Professional and sound risk management framework should be established.",
     "esg_relevance": "high", "esg_update_2023": True,
     "compliance_criteria": ["climate_risk_integrated", "paris_alignment_measured", "scenario_analysis_conducted"]},
    {"gapp": "GAPP-14", "pillar": "institutional_governance", "title": "Leverage",
     "description": "Leverage and derivative use should be disclosed and governed by clear policy.",
     "esg_relevance": "low", "esg_update_2023": False,
     "compliance_criteria": ["leverage_policy_documented", "derivative_use_policy"]},
    {"gapp": "GAPP-15", "pillar": "institutional_governance", "title": "Custody of assets",
     "description": "SWF should have robust custody and asset-management procedures.",
     "esg_relevance": "low", "esg_update_2023": False,
     "compliance_criteria": ["custodian_arrangement_documented"]},
    # Pillar 3: Investment Policies (GAPP 16-24)
    {"gapp": "GAPP-16", "pillar": "investment_policies", "title": "Investment framework",
     "description": "Investment framework should be clear and consistent with the SWF's objectives.",
     "esg_relevance": "high", "esg_update_2023": True,
     "compliance_criteria": ["esg_integrated_in_saa", "climate_tilts_applied", "green_allocation_target"]},
    {"gapp": "GAPP-17", "pillar": "investment_policies", "title": "Return and risk objectives",
     "description": "SWF's investment policy should address risk/return objectives and horizon.",
     "esg_relevance": "medium", "esg_update_2023": True,
     "compliance_criteria": ["long_horizon_climate_risk_priced"]},
    {"gapp": "GAPP-18", "pillar": "investment_policies", "title": "Investment restrictions",
     "description": "Any restrictions on eligible investments should be clearly stated.",
     "esg_relevance": "high", "esg_update_2023": True,
     "compliance_criteria": ["coal_exclusion_applied", "cluster_munitions_exclusion", "tobacco_exclusion"]},
    {"gapp": "GAPP-19", "pillar": "investment_policies", "title": "Disclosure of performance",
     "description": "Investment performance should be measured and reported.",
     "esg_relevance": "high", "esg_update_2023": True,
     "compliance_criteria": ["esg_performance_reported", "portfolio_temperature_disclosed"]},
    {"gapp": "GAPP-20", "pillar": "investment_policies", "title": "Publicly listed company investments",
     "description": "Shareholder rights should be exercised and engagement policy published.",
     "esg_relevance": "high", "esg_update_2023": True,
     "compliance_criteria": ["voting_policy_published", "engagement_reported", "nzami_signatory"]},
    {"gapp": "GAPP-21", "pillar": "investment_policies", "title": "Non-publicly listed investments",
     "description": "Governance policy for unlisted/private equity investments should be defined.",
     "esg_relevance": "medium", "esg_update_2023": True,
     "compliance_criteria": ["private_equity_esg_dd", "ilpa_reporting"]},
    {"gapp": "GAPP-22", "pillar": "investment_policies", "title": "Principle on behavior",
     "description": "SWF investments should not undermine the stability of host countries.",
     "esg_relevance": "low", "esg_update_2023": False,
     "compliance_criteria": ["no_destabilising_investments"]},
    {"gapp": "GAPP-23", "pillar": "investment_policies", "title": "Macro implications",
     "description": "SWF should be mindful of systemic and macroeconomic implications.",
     "esg_relevance": "medium", "esg_update_2023": True,
     "compliance_criteria": ["systemic_risk_assessment", "jsg_member"]},
    {"gapp": "GAPP-24", "pillar": "investment_policies", "title": "ESG considerations",
     "description": "[2023 ESG Update] SWF should integrate ESG factors including climate change into investment decisions.",
     "esg_relevance": "high", "esg_update_2023": True,
     "compliance_criteria": [
         "esg_policy_documented", "exclusion_criteria_applied", "climate_scenario_analysis",
         "paris_alignment_tracked", "net_zero_commitment", "active_ownership_policy",
     ]},
]

# Norwegian GPFG Exclusion Criteria
GPFG_EXCLUSION_CRITERIA: dict[str, Any] = {
    "coal": {
        "criterion": "Coal mining or coal-based power production",
        "threshold": "Revenue >30% from coal mining OR >30% coal power capacity",
        "legal_basis": "Government Pension Fund Act § 2 + GPFG Guidelines § 2-3",
        "effective_date": "2016-01-01",
        "review_body": "Council on Ethics → Ministry of Finance",
    },
    "oil_sands": {
        "criterion": "Oil sands extraction",
        "threshold": "Significant production from oil sands (no absolute threshold; case-by-case)",
        "legal_basis": "GPFG Guidelines § 2-3 (environmental criteria)",
        "effective_date": "2019-03-01",
        "review_body": "Council on Ethics",
    },
    "tobacco": {
        "criterion": "Production of tobacco",
        "threshold": "Any production of tobacco products",
        "legal_basis": "GPFG Guidelines § 2-2 (product-based exclusion)",
        "effective_date": "2010-01-01",
        "review_body": "NBIM (product screen)",
    },
    "cluster_munitions": {
        "criterion": "Production of cluster munitions",
        "threshold": "Any production of cluster munitions or key components",
        "legal_basis": "GPFG Guidelines § 2-2; Oslo Convention (2008)",
        "effective_date": "2005-01-01",
        "review_body": "NBIM (product screen)",
    },
    "nuclear_weapons": {
        "criterion": "Production of nuclear weapons",
        "threshold": "Companies producing nuclear weapons outside NPT framework",
        "legal_basis": "GPFG Guidelines § 2-2",
        "effective_date": "2005-01-01",
        "review_body": "NBIM (product screen)",
    },
    "anti_personnel_mines": {
        "criterion": "Production of anti-personnel mines",
        "threshold": "Any production",
        "legal_basis": "Ottawa Treaty (1997); GPFG Guidelines § 2-2",
        "effective_date": "2005-01-01",
        "review_body": "NBIM (product screen)",
    },
    "human_rights": {
        "criterion": "Serious or systematic human rights violations",
        "threshold": "Unacceptable risk of serious/systematic violations (ILO core conventions)",
        "legal_basis": "GPFG Guidelines § 2-3 (conduct-based)",
        "effective_date": "2005-01-01",
        "review_body": "Council on Ethics → Ministry of Finance",
    },
    "severe_environmental_damage": {
        "criterion": "Severe environmental damage",
        "threshold": "Unacceptable risk of severe environmental damage (deforestation, pollution, biodiversity)",
        "legal_basis": "GPFG Guidelines § 2-3 (conduct-based)",
        "effective_date": "2010-01-01",
        "review_body": "Council on Ethics",
    },
    "corruption": {
        "criterion": "Gross corruption",
        "threshold": "Unacceptable risk of involvement in gross corruption",
        "legal_basis": "GPFG Guidelines § 2-3 (conduct-based)",
        "effective_date": "2005-01-01",
        "review_body": "Council on Ethics",
    },
    "controversial_weapons": {
        "criterion": "Biological or chemical weapons",
        "threshold": "Any production of biological or chemical weapons",
        "legal_basis": "GPFG Guidelines § 2-2; CWC/BWC",
        "effective_date": "2005-01-01",
        "review_body": "NBIM (product screen)",
    },
}

# Top 20 reference excluded companies (illustrative; based on public NBIM 2024 list)
GPFG_EXCLUDED_COMPANIES_SAMPLE: list[dict[str, str]] = [
    {"company": "China National Nuclear Power Co", "criterion": "nuclear_weapons", "country": "CN"},
    {"company": "CNOOC Limited", "criterion": "severe_environmental_damage", "country": "CN"},
    {"company": "Adaro Energy", "criterion": "coal", "country": "ID"},
    {"company": "Alliance Resource Partners", "criterion": "coal", "country": "US"},
    {"company": "Alpha Metallurgical Resources", "criterion": "coal", "country": "US"},
    {"company": "Arch Resources", "criterion": "coal", "country": "US"},
    {"company": "CONSOL Energy", "criterion": "coal", "country": "US"},
    {"company": "China Shenhua Energy", "criterion": "coal", "country": "CN"},
    {"company": "Exxaro Resources", "criterion": "coal", "country": "ZA"},
    {"company": "Glencore", "criterion": "coal", "country": "CH"},
    {"company": "Guangdong Electric Power Dev", "criterion": "coal", "country": "CN"},
    {"company": "Huolinhe Opencut Coal Industry", "criterion": "coal", "country": "CN"},
    {"company": "Larsen & Toubro", "criterion": "cluster_munitions", "country": "IN"},
    {"company": "Northrop Grumman", "criterion": "cluster_munitions", "country": "US"},
    {"company": "Philip Morris International", "criterion": "tobacco", "country": "US"},
    {"company": "Altria Group", "criterion": "tobacco", "country": "US"},
    {"company": "British American Tobacco", "criterion": "tobacco", "country": "GB"},
    {"company": "Imperial Brands", "criterion": "tobacco", "country": "GB"},
    {"company": "Japan Tobacco", "criterion": "tobacco", "country": "JP"},
    {"company": "Korean Air Lines", "criterion": "cluster_munitions", "country": "KR"},
]

# Fossil Fuel Divestment Pathways
DIVESTMENT_PATHWAYS: dict[str, dict[str, Any]] = {
    "immediate": {
        "name": "Immediate Full Divestment",
        "description": "All fossil fuel holdings liquidated within 12 months.",
        "timeline_years": 1,
        "annual_divestment_schedule_pct": [100],
        "market_impact": "high",
        "price_discount_pct": 5.0,
        "reallocation_priority": ["green_bonds", "renewables_equity", "climate_solutions_fund"],
        "legal_constraint": "potential_breach_of_fiduciary_duty_without_hedging",
        "npv_impact_methodology": "immediate_book_loss_minus_avoided_stranded_asset_loss",
    },
    "phase_out_2030": {
        "name": "Phase-Out by 2030",
        "description": "Gradual divestment over 5-6 years aligned with SBTi 2030 milestones.",
        "timeline_years": 6,
        "annual_divestment_schedule_pct": [10, 15, 15, 20, 20, 20],
        "market_impact": "medium",
        "price_discount_pct": 2.0,
        "reallocation_priority": ["green_bonds", "clean_energy_infra", "sustainable_real_assets"],
        "legal_constraint": "none_if_documented_as_prudent_transition",
        "npv_impact_methodology": "discounted_cash_flow_over_transition_with_stranded_asset_adjustment",
    },
    "phase_out_2050": {
        "name": "Phase-Out by 2050",
        "description": "Long-term managed transition aligned with Paris Agreement 2050 trajectory.",
        "timeline_years": 25,
        "annual_divestment_schedule_pct": [2, 2, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 5],
        "market_impact": "low",
        "price_discount_pct": 0.5,
        "reallocation_priority": ["diversified_esg_equities", "green_bonds", "real_assets"],
        "legal_constraint": "lowest_fiduciary_risk",
        "npv_impact_methodology": "long_run_carbon_price_path_adjusted_dcf",
    },
    "engagement_first": {
        "name": "Engagement-First (Active Ownership)",
        "description": "No divestment; instead, CA100+ engagement + escalation to divestment if no progress by 2028.",
        "timeline_years": 3,
        "annual_divestment_schedule_pct": [0, 0, 0],
        "market_impact": "none_unless_escalated",
        "price_discount_pct": 0.0,
        "reallocation_priority": ["engagement", "proxy_voting", "collaborative_initiative"],
        "legal_constraint": "requires_documented_engagement_milestones",
        "npv_impact_methodology": "engagement_uplift_vs_divestment_npv_comparison",
        "escalation_trigger": "company_fails_CA100+_net_zero_benchmark_by_2028",
    },
}


# ---------------------------------------------------------------------------
# Internal Helpers
# ---------------------------------------------------------------------------

def _score_principle(principle: dict[str, Any], fund_data: dict[str, Any]) -> float:
    """Score a single GAPP principle 0-1 based on fund data."""
    criteria = principle["compliance_criteria"]
    score = 0.0
    for c in criteria:
        if c == "esg_policy_documented" and fund_data.get("esg_policy"):
            score += 1
        elif c == "exclusion_list_published" and fund_data.get("exclusion_policy"):
            score += 1
        elif c == "climate_policy_published" and fund_data.get("climate_commitment") in ("committed", "leading"):
            score += 1
        elif c == "net_zero_commitment" and fund_data.get("divestment_commitment"):
            score += 1
        elif c == "tcfd_aligned_report" and "TCFD" in fund_data.get("reporting_standard", ""):
            score += 1
        elif c == "paris_alignment_tracked" and fund_data.get("portfolio_temp_c", 4.0) < 2.5:
            score += 1
        elif c == "esg_integrated_in_saa" and fund_data.get("esg_policy"):
            score += 1
        elif c == "coal_exclusion_applied" and fund_data.get("fossil_fuel_exposure_pct", 100) < 5.0:
            score += 1
        elif c == "green_allocation_target" and fund_data.get("green_bond_allocation_usd_bn", 0) > 0:
            score += 1
        elif c == "nzami_signatory" and fund_data.get("active_ownership"):
            score += 1
        elif c == "annual_report_published" and fund_data.get("reporting_standard") != "none":
            score += 1
        elif c == "climate_risk_integrated" and fund_data.get("climate_commitment") != "none":
            score += 1
        else:
            # default: give partial credit for higher santiago score
            score += min(1.0, fund_data.get("santiago_principles_score", 0) / 24.0)
    return min(1.0, score / max(1, len(criteria)))


def _tier_from_score(total_score: float, max_score: float) -> str:
    pct = total_score / max_score
    if pct >= 0.85:
        return "leader"
    elif pct >= 0.65:
        return "advanced"
    elif pct >= 0.40:
        return "developing"
    else:
        return "laggard"


# ---------------------------------------------------------------------------
# Core Engine Functions
# ---------------------------------------------------------------------------

def assess_swf_esg(
    fund_name: str,
    aum_usd_bn: float,
    exclusion_data: dict[str, Any],
    climate_data: dict[str, Any],
    governance_data: dict[str, Any],
) -> dict[str, Any]:
    """
    Full IWG-SWF ESG assessment for a sovereign wealth fund.

    Parameters
    ----------
    fund_name : str
        Name or identifier of the fund (checked against SWF_PROFILES if available)
    aum_usd_bn : float
        AUM in USD billions
    exclusion_data : dict
        Keys: has_exclusion_policy (bool), coal_excluded (bool), tobacco_excluded (bool),
              weapons_excluded (bool), exclusion_list_public (bool)
    climate_data : dict
        Keys: has_net_zero_target (bool), target_year (int|None), portfolio_temp_c (float),
              green_bond_alloc_pct (float), tcfd_reporting (bool), pacta_assessed (bool)
    governance_data : dict
        Keys: has_esg_policy (bool), active_ownership (bool), reporting_standard (str),
              independent_audit (bool), annual_report (bool)
    """
    # Try to pull reference profile
    profile_key = fund_name.upper().replace(" ", "_")
    ref_profile = SWF_PROFILES.get(fund_name, SWF_PROFILES.get(profile_key))

    # Build unified fund_data dict
    fund_data = {
        "esg_policy": governance_data.get("has_esg_policy", False),
        "exclusion_policy": exclusion_data.get("has_exclusion_policy", False),
        "climate_commitment": (
            "leading" if (climate_data.get("has_net_zero_target") and climate_data.get("portfolio_temp_c", 4.0) < 2.0)
            else "committed" if climate_data.get("has_net_zero_target")
            else "partial" if climate_data.get("tcfd_reporting")
            else "none"
        ),
        "fossil_fuel_exposure_pct": ref_profile.get("fossil_fuel_exposure_pct", 10.0) if ref_profile else 10.0,
        "portfolio_temp_c": climate_data.get("portfolio_temp_c", 3.0),
        "reporting_standard": governance_data.get("reporting_standard", "none"),
        "active_ownership": governance_data.get("active_ownership", False),
        "green_bond_allocation_usd_bn": aum_usd_bn * climate_data.get("green_bond_alloc_pct", 0.0) / 100.0,
        "divestment_commitment": exclusion_data.get("coal_excluded", False),
        "santiago_principles_score": ref_profile.get("santiago_principles_score", 12) if ref_profile else 12,
    }

    # Score each of 24 GAPP principles
    principle_scores = {}
    total_score = 0.0
    for principle in SANTIAGO_PRINCIPLES:
        s = _score_principle(principle, fund_data)
        principle_scores[principle["gapp"]] = {
            "title": principle["title"],
            "pillar": principle["pillar"],
            "score_0_1": round(s, 2),
            "esg_relevant": principle["esg_relevance"] in ("medium", "high"),
            "esg_update_2023": principle["esg_update_2023"],
        }
        total_score += s

    iwg_score_24 = round(total_score, 2)

    # Sub-scores
    esg_policy_score = 100.0 if fund_data["esg_policy"] else 30.0
    exclusion_score = (
        100.0 if (exclusion_data.get("coal_excluded") and exclusion_data.get("weapons_excluded"))
        else 60.0 if exclusion_data.get("has_exclusion_policy")
        else 10.0
    )
    climate_score = min(100.0, (
        (30.0 if climate_data.get("has_net_zero_target") else 0.0) +
        (20.0 if climate_data.get("tcfd_reporting") else 0.0) +
        (20.0 if climate_data.get("pacta_assessed") else 0.0) +
        (15.0 if climate_data.get("portfolio_temp_c", 4.0) < 2.5 else 0.0) +
        (15.0 if climate_data.get("green_bond_alloc_pct", 0.0) > 2.0 else 0.0)
    ))

    overall_pct = iwg_score_24 / 24.0
    tier = _tier_from_score(iwg_score_24, 24.0)

    return {
        "fund_name": fund_name,
        "aum_usd_bn": aum_usd_bn,
        "iwg_swf_score_out_of_24": iwg_score_24,
        "iwg_swf_score_pct": round(overall_pct * 100, 1),
        "overall_tier": tier,
        "sub_scores": {
            "esg_policy_score_100": round(esg_policy_score, 1),
            "exclusion_policy_score_100": round(exclusion_score, 1),
            "climate_integration_score_100": round(climate_score, 1),
        },
        "pillar_scores": {
            "legal_framework": round(sum(v["score_0_1"] for k, v in principle_scores.items() if v["pillar"] == "legal_framework"), 2),
            "institutional_governance": round(sum(v["score_0_1"] for k, v in principle_scores.items() if v["pillar"] == "institutional_governance"), 2),
            "investment_policies": round(sum(v["score_0_1"] for k, v in principle_scores.items() if v["pillar"] == "investment_policies"), 2),
        },
        "principle_scores": principle_scores,
        "reference_profile_found": ref_profile is not None,
        "key_gaps": [
            p["gapp"] for p, s in zip(SANTIAGO_PRINCIPLES, [v["score_0_1"] for v in principle_scores.values()])
            if s < 0.5
        ],
    }


def apply_gpfg_exclusion_screen(
    holdings_list: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    Apply the Norwegian GPFG exclusion model to a holdings list.

    Each holding dict should have: company (str), country (str),
    revenue_coal_pct (float), revenue_tobacco_pct (float),
    produces_weapons (bool), produces_cluster_munitions (bool),
    produces_nuclear_weapons (bool), environmental_controversy (str|None).

    Returns excluded, observation, and cleared lists.
    """
    excluded: list[dict[str, Any]] = []
    observation: list[dict[str, Any]] = []
    cleared: list[dict[str, Any]] = []

    # Build lookup for sample exclusion reference
    excluded_ref = {c["company"].lower() for c in GPFG_EXCLUDED_COMPANIES_SAMPLE}

    for holding in holdings_list:
        company = holding.get("company", "Unknown")
        reasons: list[str] = []
        obs_reasons: list[str] = []

        # Product-based exclusions
        if holding.get("revenue_coal_pct", 0.0) > 30.0:
            reasons.append("coal_revenue_>30pct")
        if holding.get("revenue_tobacco_pct", 0.0) > 0.0:
            reasons.append("tobacco_production")
        if holding.get("produces_cluster_munitions"):
            reasons.append("cluster_munitions")
        if holding.get("produces_nuclear_weapons"):
            reasons.append("nuclear_weapons_outside_npt")
        if holding.get("produces_anti_personnel_mines"):
            reasons.append("anti_personnel_mines")

        # Conduct-based exclusions
        if holding.get("environmental_controversy") == "severe":
            reasons.append("severe_environmental_damage")
        elif holding.get("environmental_controversy") == "moderate":
            obs_reasons.append("environmental_controversy_under_review")

        if holding.get("human_rights_violation") == "systematic":
            reasons.append("systematic_human_rights_violation")
        elif holding.get("human_rights_violation") == "alleged":
            obs_reasons.append("human_rights_allegation_under_review")

        if holding.get("corruption_allegation"):
            obs_reasons.append("corruption_allegation_under_investigation")

        # Check against NBIM sample list
        if company.lower() in excluded_ref and not reasons:
            reasons.append("on_nbim_exclusion_list")

        # Observation: coal 10-30% revenue
        if 10.0 <= holding.get("revenue_coal_pct", 0.0) <= 30.0 and "coal_revenue_>30pct" not in reasons:
            obs_reasons.append("coal_revenue_10_30pct_watch")

        entry = {"company": company, "country": holding.get("country", ""),
                 "market_value_usd_m": holding.get("market_value_usd_m", 0)}

        if reasons:
            excluded.append({**entry, "exclusion_criteria": reasons, "exclusion_source": "GPFG_model"})
        elif obs_reasons:
            observation.append({**entry, "observation_reasons": obs_reasons})
        else:
            cleared.append(entry)

    total_value = sum(h.get("market_value_usd_m", 0) for h in holdings_list)
    excluded_value = sum(h["market_value_usd_m"] for h in excluded)

    return {
        "total_holdings": len(holdings_list),
        "excluded_count": len(excluded),
        "observation_count": len(observation),
        "cleared_count": len(cleared),
        "excluded_value_usd_m": round(excluded_value, 2),
        "excluded_pct_portfolio": round(excluded_value / max(total_value, 1e-6) * 100, 2),
        "excluded_holdings": excluded,
        "observation_holdings": observation,
        "cleared_holdings": cleared,
        "methodology": "GPFG_Council_on_Ethics_guidelines_2024",
        "criteria_applied": list(GPFG_EXCLUSION_CRITERIA.keys()),
    }


def calculate_portfolio_temperature(
    holdings: list[dict[str, Any]],
    sovereign_bond_allocations: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    Calculate portfolio implied temperature rise using MSCI PACTA proxy methodology.

    Each holding: company (str), sector (str), weight_pct (float),
                  company_temp_c (float, estimated 1.5–4.5)
    Each sovereign bond: country (str), weight_pct (float), country_temp_c (float)

    Returns portfolio-weighted implied temperature and sector breakdown.
    """
    # SECTOR TEMPERATURE BENCHMARKS (PACTA / MSCI reference 2024)
    sector_bench: dict[str, float] = {
        "oil_gas": 3.8, "coal": 4.5, "utilities_fossil": 3.2,
        "utilities_renewables": 1.6, "steel": 2.9, "cement": 2.7,
        "automotive": 2.1, "aviation": 3.1, "shipping": 2.8,
        "real_estate": 2.0, "agriculture": 2.5, "technology": 1.7,
        "financials": 2.2, "healthcare": 1.8, "consumer": 2.0,
        "industrials": 2.4, "materials": 2.6, "telecom": 1.9,
    }

    total_weight = 0.0
    weighted_temp = 0.0
    sector_data: dict[str, list[float]] = {}

    for h in holdings:
        w = h.get("weight_pct", 0.0) / 100.0
        sector = h.get("sector", "unknown").lower()
        t = h.get("company_temp_c", sector_bench.get(sector, 2.5))
        weighted_temp += w * t
        total_weight += w
        if sector not in sector_data:
            sector_data[sector] = []
        sector_data[sector].append((w, t))

    # Sovereign bonds
    sovereign_weight = 0.0
    sovereign_weighted_temp = 0.0
    for sb in sovereign_bond_allocations:
        w = sb.get("weight_pct", 0.0) / 100.0
        t = sb.get("country_temp_c", 2.5)
        sovereign_weighted_temp += w * t
        sovereign_weight += w
        total_weight += w
        weighted_temp += w * t

    portfolio_temp = weighted_temp / max(total_weight, 1e-9)

    # Sector breakdown
    sector_summary: dict[str, dict[str, float]] = {}
    for sec, pairs in sector_data.items():
        sec_w = sum(p[0] for p in pairs)
        sec_t = sum(p[0] * p[1] for p in pairs) / max(sec_w, 1e-9)
        sector_summary[sec] = {
            "portfolio_weight_pct": round(sec_w * 100, 2),
            "implied_temp_c": round(sec_t, 2),
            "sector_benchmark_c": round(sector_bench.get(sec, 2.5), 2),
            "vs_benchmark_c": round(sec_t - sector_bench.get(sec, 2.5), 2),
        }

    alignment = (
        "paris_1_5c" if portfolio_temp <= 1.65
        else "below_2c" if portfolio_temp <= 2.0
        else "above_2c_but_below_3c" if portfolio_temp <= 3.0
        else "above_3c"
    )

    return {
        "portfolio_implied_temp_c": round(portfolio_temp, 2),
        "paris_alignment": alignment,
        "equity_holdings_count": len(holdings),
        "sovereign_bond_holdings_count": len(sovereign_bond_allocations),
        "sovereign_weighted_temp_c": round(sovereign_weighted_temp / max(sovereign_weight, 1e-9), 2) if sovereign_weight > 0 else None,
        "sector_breakdown": sector_summary,
        "methodology": "PACTA_MSCI_proxy_weighted_average_temperature_score",
        "caveats": [
            "company_temp_c estimates are proxies; MSCI/Trucost data required for precision",
            "Sovereign bond temperatures use ND-GAIN/UNFCCC NDC proxies",
            "WACI (Scope1+2 only) not included; Scope 3 adds material uplift",
        ],
    }


def model_divestment_pathway(
    fund_name: str,
    aum_usd_bn: float,
    fossil_fuel_exposure_pct: float,
    pathway_type: str,
) -> dict[str, Any]:
    """
    Model a fossil fuel divestment pathway with annual schedule and NPV impact.

    Parameters
    ----------
    fund_name : str
    aum_usd_bn : float
    fossil_fuel_exposure_pct : float
        Current portfolio allocation to fossil fuels (%)
    pathway_type : str
        One of: immediate, phase_out_2030, phase_out_2050, engagement_first
    """
    if pathway_type not in DIVESTMENT_PATHWAYS:
        raise ValueError(f"pathway_type must be one of {list(DIVESTMENT_PATHWAYS.keys())}")

    pathway = DIVESTMENT_PATHWAYS[pathway_type]
    fossil_value_usd_bn = aum_usd_bn * fossil_fuel_exposure_pct / 100.0

    schedule = pathway["annual_divestment_schedule_pct"]
    price_discount = pathway["price_discount_pct"] / 100.0

    annual_schedule: list[dict[str, Any]] = []
    remaining_bn = fossil_value_usd_bn
    cumulative_divested_bn = 0.0
    npv_loss_bn = 0.0
    base_year = 2026

    for i, pct in enumerate(schedule):
        divest_this_year_bn = fossil_value_usd_bn * pct / 100.0
        net_proceeds_bn = divest_this_year_bn * (1.0 - price_discount)
        discount_factor = 1.0 / (1.0 + 0.05) ** (i + 1)
        npv_loss_bn += (divest_this_year_bn - net_proceeds_bn) * discount_factor
        remaining_bn = max(0.0, remaining_bn - divest_this_year_bn)
        cumulative_divested_bn += divest_this_year_bn
        annual_schedule.append({
            "year": base_year + i,
            "divestment_pct_of_fossil": round(pct, 1),
            "divested_usd_bn": round(divest_this_year_bn, 3),
            "net_proceeds_usd_bn": round(net_proceeds_bn, 3),
            "remaining_fossil_usd_bn": round(remaining_bn, 3),
            "cumulative_divested_pct": round(cumulative_divested_bn / max(fossil_value_usd_bn, 1e-9) * 100, 1),
        })

    # Stranded asset avoided loss (simplified: 20% of remaining exposure under 2°C scenario)
    avoided_stranded_asset_loss_bn = fossil_value_usd_bn * 0.20
    net_npv_impact_bn = avoided_stranded_asset_loss_bn - npv_loss_bn

    # Green bond absorption capacity estimate
    green_bond_market_annual_issuance_bn = 600  # global green bond market ~$600bn/yr
    absorption_capacity_pct = min(100.0, (cumulative_divested_bn / green_bond_market_annual_issuance_bn) * 100)

    # Reallocation opportunities
    reallocation = pathway["reallocation_priority"]

    return {
        "fund_name": fund_name,
        "aum_usd_bn": aum_usd_bn,
        "fossil_fuel_exposure_pct": fossil_fuel_exposure_pct,
        "fossil_fuel_value_usd_bn": round(fossil_value_usd_bn, 3),
        "pathway_type": pathway_type,
        "pathway_name": pathway["name"],
        "description": pathway["description"],
        "timeline_years": pathway["timeline_years"],
        "market_impact": pathway["market_impact"],
        "annual_divestment_schedule": annual_schedule,
        "total_divested_usd_bn": round(cumulative_divested_bn, 3),
        "npv_transaction_loss_usd_bn": round(npv_loss_bn, 3),
        "avoided_stranded_asset_loss_usd_bn": round(avoided_stranded_asset_loss_bn, 3),
        "net_npv_impact_usd_bn": round(net_npv_impact_bn, 3),
        "green_bond_absorption_capacity_pct": round(absorption_capacity_pct, 1),
        "reallocation_opportunities": reallocation,
        "legal_constraint": pathway["legal_constraint"],
        "methodology": pathway.get("npv_impact_methodology", "dcf_analysis"),
    }


def assess_intergenerational_equity(
    fund_name: str,
    aum_usd_bn: float,
    annual_withdrawal_pct: float,
    resource_revenue_dependency: float,
) -> dict[str, Any]:
    """
    Assess intergenerational equity compliance using Hartwick Rule + GPFG 4%-rule.

    Parameters
    ----------
    fund_name : str
    aum_usd_bn : float
    annual_withdrawal_pct : float
        Annual withdrawal as % of fund AUM
    resource_revenue_dependency : float
        % of government revenue from resource extraction (0-100)
    """
    # Real return assumption (GPFG long-run real return ~4%)
    gpfg_real_return_pct = 4.0
    sustainable_withdrawal_pct = gpfg_real_return_pct

    # Hartwick Rule: reinvest resource rents ≥ Hotelling rent (depletion cost)
    # Simplified: sustainable if withdrawal ≤ expected real return
    hartwick_compliant = annual_withdrawal_pct <= gpfg_real_return_pct

    # Optimal depletion rate (Hotelling Rule): r = ρ + θg (resource price growth)
    # Simplified with rho=0.03 (discount rate), theta=1.5 (elasticity), g=0.02 (growth)
    rho = 0.03
    theta = 1.5
    g = 0.02
    optimal_depletion_rate_pct = (rho + theta * g) * 100  # ~6%

    # Fiscal sustainability score
    fiscal_gap = max(0.0, annual_withdrawal_pct - gpfg_real_return_pct)
    sustainability_score = max(0.0, 100.0 - fiscal_gap * 20.0 - resource_revenue_dependency * 0.5)

    # SDG 17 Partnership Finance contribution
    sdg17_contribution_usd_bn = aum_usd_bn * max(0.0, min(0.05, (sustainability_score / 100.0) * 0.05))
    blended_finance_leverage = 4.0  # $4 private : $1 public typical ratio

    # Intergenerational fairness rating
    if sustainability_score >= 80:
        fairness_rating = "excellent"
    elif sustainability_score >= 60:
        fairness_rating = "good"
    elif sustainability_score >= 40:
        fairness_rating = "fair"
    else:
        fairness_rating = "poor"

    # Buffer adequacy (sovereign fund target: >10 years fiscal cover at current withdrawal)
    fiscal_cover_years = aum_usd_bn / max(aum_usd_bn * annual_withdrawal_pct / 100.0, 1e-9)
    adequate_buffer = fiscal_cover_years >= 10.0

    return {
        "fund_name": fund_name,
        "aum_usd_bn": aum_usd_bn,
        "annual_withdrawal_pct": annual_withdrawal_pct,
        "resource_revenue_dependency_pct": resource_revenue_dependency,
        "hartwick_rule_compliant": hartwick_compliant,
        "hartwick_rule_explanation": (
            f"Fund withdraws {annual_withdrawal_pct:.1f}%/yr vs sustainable {gpfg_real_return_pct:.1f}%/yr (GPFG 4%-rule). "
            f"{'COMPLIANT — rents reinvested at ≥ depletion rate.' if hartwick_compliant else 'NON-COMPLIANT — fiscal drawdown exceeds sustainable real return.'}"
        ),
        "optimal_depletion_rate_pct": round(optimal_depletion_rate_pct, 2),
        "optimal_depletion_rate_formula": f"r = ρ({rho}) + θ({theta}) × g({g}) = {optimal_depletion_rate_pct:.2f}%",
        "sustainability_score_100": round(sustainability_score, 1),
        "intergenerational_fairness_rating": fairness_rating,
        "fiscal_cover_years": round(fiscal_cover_years, 1),
        "adequate_buffer_10yr": adequate_buffer,
        "sdg17_contribution": {
            "potential_blended_finance_usd_bn": round(sdg17_contribution_usd_bn, 2),
            "private_capital_mobilised_usd_bn": round(sdg17_contribution_usd_bn * blended_finance_leverage, 2),
            "leverage_ratio": blended_finance_leverage,
        },
        "recommendations": [
            r for r, cond in [
                ("Reduce annual withdrawal to ≤4% to comply with Hartwick Rule", not hartwick_compliant),
                ("Diversify revenue base to reduce resource dependency below 30%", resource_revenue_dependency > 30),
                ("Increase green bond allocation for climate-aligned SDG 17 financing", True),
                ("Publish TCFD-aligned report including portfolio temperature", True),
                ("Consider NZAMI commitment to enhance intergenerational climate alignment", True),
            ] if cond
        ],
        "methodology": "Hartwick_Rule_1977 + GPFG_4pct_rule + Hotelling_1931",
    }
