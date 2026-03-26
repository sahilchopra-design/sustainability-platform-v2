"""
Climate Policy Tracking Engine
================================

Comprehensive jurisdiction-level climate policy assessment covering:
- 40 jurisdiction profiles (NDC targets, carbon prices, net-zero laws, policy stringency)
- EU Fit for 55 package: 13 regulations (ETS reform → Social Climate Fund)
- US Inflation Reduction Act: 26 tax credits and incentives
- REPowerEU: 10 measures
- IEA NZE carbon price corridor (2022-2050 by economy type)
- NGFS policy scenarios: orderly / disorderly / hot-house carbon price trajectories
- Climate policy risk scoring (reversal, implementation, legal challenge)
- G20 carbon pricing tracker

Core functions:
- assess_jurisdiction_policy()  → NDC ambition, policy stringency, transition risk
- score_ndc_ambition()          → ambition score 0-100, Paris-alignment flag
- track_policy_pipeline()       → applicable regulations, timelines, impact scores
- calculate_carbon_price_gap()  → gap vs IEA NZE corridor, trajectory
- assess_policy_portfolio_impact() → portfolio-level transition risk aggregation

All reference data is hardcoded; no database calls.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Optional

# ---------------------------------------------------------------------------
# 40 Jurisdiction Profiles
# ---------------------------------------------------------------------------
# Fields per jurisdiction:
#   name               — display name
#   region             — region grouping
#   ndc_target_pct     — GHG reduction target vs base year (%)
#   ndc_base_year      — NDC base year (or baseline year)
#   ndc_target_year    — Target year for NDC commitment
#   ndc_status         — "first" | "updated" | "enhanced"
#   carbon_price_usd   — current headline carbon price (USD/tCO2e, 2024)
#   carbon_price_coverage_pct — % of national GHG covered by carbon pricing
#   climate_law        — climate legislation enacted (bool)
#   net_zero_target_year — official net-zero target year (None if not set)
#   policy_stringency  — ClimPol index 0-100 (higher = more stringent)
#   transition_risk_score — 0.0-1.0 (higher = greater near-term transition risk)
#   policy_reversal_risk  — "low" | "medium" | "high"
#   ets_coverage       — % of emissions under ETS
#   key_policies       — list of flagship policy identifiers

JURISDICTION_PROFILES: dict[str, dict] = {
    "EU": {
        "name": "European Union",
        "region": "Europe",
        "ndc_target_pct": 55,
        "ndc_base_year": 1990,
        "ndc_target_year": 2030,
        "ndc_status": "enhanced",
        "carbon_price_usd": 65,
        "carbon_price_coverage_pct": 45,
        "climate_law": True,
        "net_zero_target_year": 2050,
        "policy_stringency": 82,
        "transition_risk_score": 0.75,
        "policy_reversal_risk": "low",
        "ets_coverage_pct": 45,
        "key_policies": ["eu_ets", "fit_for_55", "cbam", "eu_taxonomy", "csrd"],
    },
    "USA": {
        "name": "United States",
        "region": "North America",
        "ndc_target_pct": 50,
        "ndc_base_year": 2005,
        "ndc_target_year": 2030,
        "ndc_status": "enhanced",
        "carbon_price_usd": 17,
        "carbon_price_coverage_pct": 12,
        "climate_law": True,
        "net_zero_target_year": 2050,
        "policy_stringency": 58,
        "transition_risk_score": 0.65,
        "policy_reversal_risk": "high",
        "ets_coverage_pct": 12,
        "key_policies": ["ira_2022", "regional_ets_rggi", "ca_cap_trade"],
    },
    "GBR": {
        "name": "United Kingdom",
        "region": "Europe",
        "ndc_target_pct": 68,
        "ndc_base_year": 1990,
        "ndc_target_year": 2030,
        "ndc_status": "enhanced",
        "carbon_price_usd": 50,
        "carbon_price_coverage_pct": 30,
        "climate_law": True,
        "net_zero_target_year": 2050,
        "policy_stringency": 76,
        "transition_risk_score": 0.70,
        "policy_reversal_risk": "low",
        "ets_coverage_pct": 30,
        "key_policies": ["uk_ets", "climate_change_act", "uk_sdr", "tcfd_mandatory"],
    },
    "CHN": {
        "name": "China",
        "region": "Asia-Pacific",
        "ndc_target_pct": 65,
        "ndc_base_year": 2005,
        "ndc_target_year": 2030,
        "ndc_status": "updated",
        "carbon_price_usd": 9,
        "carbon_price_coverage_pct": 40,
        "climate_law": False,
        "net_zero_target_year": 2060,
        "policy_stringency": 52,
        "transition_risk_score": 0.55,
        "policy_reversal_risk": "medium",
        "ets_coverage_pct": 40,
        "key_policies": ["china_ets", "14th_five_year_plan", "dual_carbon_goals"],
    },
    "JPN": {
        "name": "Japan",
        "region": "Asia-Pacific",
        "ndc_target_pct": 46,
        "ndc_base_year": 2013,
        "ndc_target_year": 2030,
        "ndc_status": "enhanced",
        "carbon_price_usd": 3,
        "carbon_price_coverage_pct": 55,
        "climate_law": True,
        "net_zero_target_year": 2050,
        "policy_stringency": 61,
        "transition_risk_score": 0.60,
        "policy_reversal_risk": "low",
        "ets_coverage_pct": 55,
        "key_policies": ["gx_league_ets", "green_transformation", "carbon_neutral_declaration"],
    },
    "IND": {
        "name": "India",
        "region": "Asia-Pacific",
        "ndc_target_pct": 45,
        "ndc_base_year": 2005,
        "ndc_target_year": 2030,
        "ndc_status": "updated",
        "carbon_price_usd": 0,
        "carbon_price_coverage_pct": 0,
        "climate_law": False,
        "net_zero_target_year": 2070,
        "policy_stringency": 38,
        "transition_risk_score": 0.35,
        "policy_reversal_risk": "medium",
        "ets_coverage_pct": 0,
        "key_policies": ["national_action_plan_cc", "perform_achieve_trade", "solar_mission"],
    },
    "BRA": {
        "name": "Brazil",
        "region": "Latin America",
        "ndc_target_pct": 50,
        "ndc_base_year": 2005,
        "ndc_target_year": 2030,
        "ndc_status": "enhanced",
        "carbon_price_usd": 0,
        "carbon_price_coverage_pct": 0,
        "climate_law": True,
        "net_zero_target_year": 2050,
        "policy_stringency": 44,
        "transition_risk_score": 0.40,
        "policy_reversal_risk": "medium",
        "ets_coverage_pct": 0,
        "key_policies": ["lula_green_transition", "amazon_fund", "proarco"],
    },
    "AUS": {
        "name": "Australia",
        "region": "Asia-Pacific",
        "ndc_target_pct": 43,
        "ndc_base_year": 2005,
        "ndc_target_year": 2030,
        "ndc_status": "updated",
        "carbon_price_usd": 29,
        "carbon_price_coverage_pct": 28,
        "climate_law": True,
        "net_zero_target_year": 2050,
        "policy_stringency": 55,
        "transition_risk_score": 0.58,
        "policy_reversal_risk": "medium",
        "ets_coverage_pct": 28,
        "key_policies": ["safeguard_mechanism", "climate_change_act_2022", "rewiring_nation"],
    },
    "CAN": {
        "name": "Canada",
        "region": "North America",
        "ndc_target_pct": 40,
        "ndc_base_year": 2005,
        "ndc_target_year": 2030,
        "ndc_status": "updated",
        "carbon_price_usd": 65,
        "carbon_price_coverage_pct": 80,
        "climate_law": True,
        "net_zero_target_year": 2050,
        "policy_stringency": 68,
        "transition_risk_score": 0.68,
        "policy_reversal_risk": "medium",
        "ets_coverage_pct": 80,
        "key_policies": ["federal_carbon_tax", "clean_fuel_regulation", "net_zero_emissions_act"],
    },
    "KOR": {
        "name": "South Korea",
        "region": "Asia-Pacific",
        "ndc_target_pct": 40,
        "ndc_base_year": 2018,
        "ndc_target_year": 2030,
        "ndc_status": "updated",
        "carbon_price_usd": 7,
        "carbon_price_coverage_pct": 73,
        "climate_law": True,
        "net_zero_target_year": 2050,
        "policy_stringency": 62,
        "transition_risk_score": 0.62,
        "policy_reversal_risk": "low",
        "ets_coverage_pct": 73,
        "key_policies": ["k_ets", "carbon_neutrality_act", "green_new_deal"],
    },
    "ZAF": {
        "name": "South Africa",
        "region": "Africa",
        "ndc_target_pct": 43,
        "ndc_base_year": 2000,
        "ndc_target_year": 2030,
        "ndc_status": "updated",
        "carbon_price_usd": 10,
        "carbon_price_coverage_pct": 80,
        "climate_law": False,
        "net_zero_target_year": None,
        "policy_stringency": 42,
        "transition_risk_score": 0.45,
        "policy_reversal_risk": "medium",
        "ets_coverage_pct": 80,
        "key_policies": ["carbon_tax", "just_transition_ipp"],
    },
    "MEX": {
        "name": "Mexico",
        "region": "Latin America",
        "ndc_target_pct": 35,
        "ndc_base_year": 2000,
        "ndc_target_year": 2030,
        "ndc_status": "first",
        "carbon_price_usd": 3,
        "carbon_price_coverage_pct": 40,
        "climate_law": True,
        "net_zero_target_year": None,
        "policy_stringency": 35,
        "transition_risk_score": 0.38,
        "policy_reversal_risk": "high",
        "ets_coverage_pct": 40,
        "key_policies": ["carbon_tax_fuel", "pilot_ets"],
    },
    "ARG": {
        "name": "Argentina",
        "region": "Latin America",
        "ndc_target_pct": 19,
        "ndc_base_year": 2005,
        "ndc_target_year": 2030,
        "ndc_status": "updated",
        "carbon_price_usd": 5,
        "carbon_price_coverage_pct": 20,
        "climate_law": False,
        "net_zero_target_year": None,
        "policy_stringency": 28,
        "transition_risk_score": 0.28,
        "policy_reversal_risk": "high",
        "ets_coverage_pct": 20,
        "key_policies": ["carbon_levy"],
    },
    "TUR": {
        "name": "Türkiye",
        "region": "Europe",
        "ndc_target_pct": 41,
        "ndc_base_year": 2012,
        "ndc_target_year": 2030,
        "ndc_status": "first",
        "carbon_price_usd": 0,
        "carbon_price_coverage_pct": 0,
        "climate_law": False,
        "net_zero_target_year": 2053,
        "policy_stringency": 30,
        "transition_risk_score": 0.32,
        "policy_reversal_risk": "medium",
        "ets_coverage_pct": 0,
        "key_policies": ["paris_ratification_2021", "voluntary_ets_pilot"],
    },
    "IDN": {
        "name": "Indonesia",
        "region": "Asia-Pacific",
        "ndc_target_pct": 32,
        "ndc_base_year": 2010,
        "ndc_target_year": 2030,
        "ndc_status": "updated",
        "carbon_price_usd": 2,
        "carbon_price_coverage_pct": 5,
        "climate_law": False,
        "net_zero_target_year": 2060,
        "policy_stringency": 30,
        "transition_risk_score": 0.30,
        "policy_reversal_risk": "medium",
        "ets_coverage_pct": 5,
        "key_policies": ["carbon_tax_coal", "indonesia_ets_pilot"],
    },
    "SAU": {
        "name": "Saudi Arabia",
        "region": "Middle East",
        "ndc_target_pct": 30,
        "ndc_base_year": 2019,
        "ndc_target_year": 2030,
        "ndc_status": "updated",
        "carbon_price_usd": 0,
        "carbon_price_coverage_pct": 0,
        "climate_law": False,
        "net_zero_target_year": 2060,
        "policy_stringency": 22,
        "transition_risk_score": 0.25,
        "policy_reversal_risk": "high",
        "ets_coverage_pct": 0,
        "key_policies": ["vision_2030_green", "saudi_green_initiative"],
    },
    "ARE": {
        "name": "United Arab Emirates",
        "region": "Middle East",
        "ndc_target_pct": 40,
        "ndc_base_year": 2019,
        "ndc_target_year": 2030,
        "ndc_status": "enhanced",
        "carbon_price_usd": 0,
        "carbon_price_coverage_pct": 0,
        "climate_law": False,
        "net_zero_target_year": 2050,
        "policy_stringency": 35,
        "transition_risk_score": 0.38,
        "policy_reversal_risk": "medium",
        "ets_coverage_pct": 0,
        "key_policies": ["uae_ndc_2030", "hydrogen_strategy"],
    },
    "SGP": {
        "name": "Singapore",
        "region": "Asia-Pacific",
        "ndc_target_pct": 60,
        "ndc_base_year": 2005,
        "ndc_target_year": 2030,
        "ndc_status": "enhanced",
        "carbon_price_usd": 25,
        "carbon_price_coverage_pct": 80,
        "climate_law": False,
        "net_zero_target_year": 2050,
        "policy_stringency": 64,
        "transition_risk_score": 0.65,
        "policy_reversal_risk": "low",
        "ets_coverage_pct": 80,
        "key_policies": ["carbon_tax", "green_plan_2030", "mas_green_finance"],
    },
    "NOR": {
        "name": "Norway",
        "region": "Europe",
        "ndc_target_pct": 55,
        "ndc_base_year": 1990,
        "ndc_target_year": 2030,
        "ndc_status": "enhanced",
        "carbon_price_usd": 85,
        "carbon_price_coverage_pct": 85,
        "climate_law": True,
        "net_zero_target_year": 2050,
        "policy_stringency": 80,
        "transition_risk_score": 0.72,
        "policy_reversal_risk": "low",
        "ets_coverage_pct": 85,
        "key_policies": ["eu_ets_participation", "carbon_tax_petroleum", "climate_act"],
    },
    "CHE": {
        "name": "Switzerland",
        "region": "Europe",
        "ndc_target_pct": 50,
        "ndc_base_year": 1990,
        "ndc_target_year": 2030,
        "ndc_status": "enhanced",
        "carbon_price_usd": 130,
        "carbon_price_coverage_pct": 33,
        "climate_law": True,
        "net_zero_target_year": 2050,
        "policy_stringency": 78,
        "transition_risk_score": 0.70,
        "policy_reversal_risk": "low",
        "ets_coverage_pct": 33,
        "key_policies": ["co2_act", "swiss_ets", "climate_innovation_fund"],
    },
    "NZL": {
        "name": "New Zealand",
        "region": "Asia-Pacific",
        "ndc_target_pct": 50,
        "ndc_base_year": 2005,
        "ndc_target_year": 2030,
        "ndc_status": "updated",
        "carbon_price_usd": 50,
        "carbon_price_coverage_pct": 50,
        "climate_law": True,
        "net_zero_target_year": 2050,
        "policy_stringency": 65,
        "transition_risk_score": 0.63,
        "policy_reversal_risk": "medium",
        "ets_coverage_pct": 50,
        "key_policies": ["nz_ets", "zero_carbon_act", "ccr_nz_disclosure"],
    },
    "THA": {
        "name": "Thailand",
        "region": "Asia-Pacific",
        "ndc_target_pct": 30,
        "ndc_base_year": 2005,
        "ndc_target_year": 2030,
        "ndc_status": "updated",
        "carbon_price_usd": 1,
        "carbon_price_coverage_pct": 5,
        "climate_law": False,
        "net_zero_target_year": 2065,
        "policy_stringency": 32,
        "transition_risk_score": 0.33,
        "policy_reversal_risk": "medium",
        "ets_coverage_pct": 5,
        "key_policies": ["t_ver", "carbon_credit_program"],
    },
    "MYS": {
        "name": "Malaysia",
        "region": "Asia-Pacific",
        "ndc_target_pct": 45,
        "ndc_base_year": 2005,
        "ndc_target_year": 2030,
        "ndc_status": "updated",
        "carbon_price_usd": 3,
        "carbon_price_coverage_pct": 3,
        "climate_law": False,
        "net_zero_target_year": 2050,
        "policy_stringency": 30,
        "transition_risk_score": 0.33,
        "policy_reversal_risk": "medium",
        "ets_coverage_pct": 3,
        "key_policies": ["bursa_voluntary_carbon", "green_climate_bond"],
    },
    "VNM": {
        "name": "Vietnam",
        "region": "Asia-Pacific",
        "ndc_target_pct": 27,
        "ndc_base_year": 2014,
        "ndc_target_year": 2030,
        "ndc_status": "updated",
        "carbon_price_usd": 0,
        "carbon_price_coverage_pct": 0,
        "climate_law": False,
        "net_zero_target_year": 2050,
        "policy_stringency": 28,
        "transition_risk_score": 0.30,
        "policy_reversal_risk": "medium",
        "ets_coverage_pct": 0,
        "key_policies": ["national_climate_change_strategy", "just_energy_transition"],
    },
    "EGY": {
        "name": "Egypt",
        "region": "Africa",
        "ndc_target_pct": 33,
        "ndc_base_year": 2015,
        "ndc_target_year": 2030,
        "ndc_status": "updated",
        "carbon_price_usd": 0,
        "carbon_price_coverage_pct": 0,
        "climate_law": False,
        "net_zero_target_year": None,
        "policy_stringency": 25,
        "transition_risk_score": 0.26,
        "policy_reversal_risk": "medium",
        "ets_coverage_pct": 0,
        "key_policies": ["cop27_host_climate_pledge", "renewable_energy_strategy"],
    },
    "NGA": {
        "name": "Nigeria",
        "region": "Africa",
        "ndc_target_pct": 47,
        "ndc_base_year": 2005,
        "ndc_target_year": 2030,
        "ndc_status": "updated",
        "carbon_price_usd": 2,
        "carbon_price_coverage_pct": 5,
        "climate_law": True,
        "net_zero_target_year": 2060,
        "policy_stringency": 30,
        "transition_risk_score": 0.32,
        "policy_reversal_risk": "high",
        "ets_coverage_pct": 5,
        "key_policies": ["climate_change_act_2021", "carbon_market_draft"],
    },
    "COL": {
        "name": "Colombia",
        "region": "Latin America",
        "ndc_target_pct": 51,
        "ndc_base_year": 2005,
        "ndc_target_year": 2030,
        "ndc_status": "enhanced",
        "carbon_price_usd": 5,
        "carbon_price_coverage_pct": 24,
        "climate_law": True,
        "net_zero_target_year": 2050,
        "policy_stringency": 42,
        "transition_risk_score": 0.43,
        "policy_reversal_risk": "medium",
        "ets_coverage_pct": 24,
        "key_policies": ["carbon_tax", "climate_law_2021"],
    },
    "CHL": {
        "name": "Chile",
        "region": "Latin America",
        "ndc_target_pct": 30,
        "ndc_base_year": 2007,
        "ndc_target_year": 2030,
        "ndc_status": "updated",
        "carbon_price_usd": 5,
        "carbon_price_coverage_pct": 45,
        "climate_law": True,
        "net_zero_target_year": 2050,
        "policy_stringency": 50,
        "transition_risk_score": 0.50,
        "policy_reversal_risk": "medium",
        "ets_coverage_pct": 45,
        "key_policies": ["green_tax", "climate_framework_law", "net_zero_2050"],
    },
    "PER": {
        "name": "Peru",
        "region": "Latin America",
        "ndc_target_pct": 30,
        "ndc_base_year": 2010,
        "ndc_target_year": 2030,
        "ndc_status": "updated",
        "carbon_price_usd": 0,
        "carbon_price_coverage_pct": 0,
        "climate_law": False,
        "net_zero_target_year": None,
        "policy_stringency": 28,
        "transition_risk_score": 0.30,
        "policy_reversal_risk": "medium",
        "ets_coverage_pct": 0,
        "key_policies": ["redd_plus", "national_strategy_cc"],
    },
    "PHL": {
        "name": "Philippines",
        "region": "Asia-Pacific",
        "ndc_target_pct": 75,
        "ndc_base_year": 2020,
        "ndc_target_year": 2030,
        "ndc_status": "updated",
        "carbon_price_usd": 0,
        "carbon_price_coverage_pct": 0,
        "climate_law": False,
        "net_zero_target_year": None,
        "policy_stringency": 25,
        "transition_risk_score": 0.26,
        "policy_reversal_risk": "medium",
        "ets_coverage_pct": 0,
        "key_policies": ["climate_change_act_phl", "renewable_energy_act"],
    },
    "PAK": {
        "name": "Pakistan",
        "region": "Asia-Pacific",
        "ndc_target_pct": 50,
        "ndc_base_year": 2015,
        "ndc_target_year": 2030,
        "ndc_status": "updated",
        "carbon_price_usd": 0,
        "carbon_price_coverage_pct": 0,
        "climate_law": False,
        "net_zero_target_year": None,
        "policy_stringency": 20,
        "transition_risk_score": 0.22,
        "policy_reversal_risk": "high",
        "ets_coverage_pct": 0,
        "key_policies": ["national_climate_change_policy"],
    },
    "BGD": {
        "name": "Bangladesh",
        "region": "Asia-Pacific",
        "ndc_target_pct": 22,
        "ndc_base_year": 2012,
        "ndc_target_year": 2030,
        "ndc_status": "updated",
        "carbon_price_usd": 0,
        "carbon_price_coverage_pct": 0,
        "climate_law": False,
        "net_zero_target_year": None,
        "policy_stringency": 18,
        "transition_risk_score": 0.20,
        "policy_reversal_risk": "high",
        "ets_coverage_pct": 0,
        "key_policies": ["national_adaptation_programme"],
    },
    "UKR": {
        "name": "Ukraine",
        "region": "Europe",
        "ndc_target_pct": 65,
        "ndc_base_year": 1990,
        "ndc_target_year": 2030,
        "ndc_status": "updated",
        "carbon_price_usd": 1,
        "carbon_price_coverage_pct": 10,
        "climate_law": False,
        "net_zero_target_year": None,
        "policy_stringency": 28,
        "transition_risk_score": 0.30,
        "policy_reversal_risk": "high",
        "ets_coverage_pct": 10,
        "key_policies": ["kyoto_protocol_legacy", "eu_approximation"],
    },
    "POL": {
        "name": "Poland",
        "region": "Europe",
        "ndc_target_pct": 55,
        "ndc_base_year": 1990,
        "ndc_target_year": 2030,
        "ndc_status": "enhanced",
        "carbon_price_usd": 65,
        "carbon_price_coverage_pct": 45,
        "climate_law": True,
        "net_zero_target_year": 2050,
        "policy_stringency": 60,
        "transition_risk_score": 0.62,
        "policy_reversal_risk": "medium",
        "ets_coverage_pct": 45,
        "key_policies": ["eu_ets", "fit_for_55", "just_transition_fund"],
    },
    "SWE": {
        "name": "Sweden",
        "region": "Europe",
        "ndc_target_pct": 55,
        "ndc_base_year": 1990,
        "ndc_target_year": 2030,
        "ndc_status": "enhanced",
        "carbon_price_usd": 130,
        "carbon_price_coverage_pct": 40,
        "climate_law": True,
        "net_zero_target_year": 2045,
        "policy_stringency": 88,
        "transition_risk_score": 0.78,
        "policy_reversal_risk": "low",
        "ets_coverage_pct": 40,
        "key_policies": ["eu_ets", "carbon_tax_highest", "climate_act"],
    },
    "DNK": {
        "name": "Denmark",
        "region": "Europe",
        "ndc_target_pct": 55,
        "ndc_base_year": 1990,
        "ndc_target_year": 2030,
        "ndc_status": "enhanced",
        "carbon_price_usd": 185,
        "carbon_price_coverage_pct": 50,
        "climate_law": True,
        "net_zero_target_year": 2050,
        "policy_stringency": 85,
        "transition_risk_score": 0.76,
        "policy_reversal_risk": "low",
        "ets_coverage_pct": 50,
        "key_policies": ["eu_ets", "carbon_tax_dk_2022", "climate_act_2019"],
    },
    "DEU": {
        "name": "Germany",
        "region": "Europe",
        "ndc_target_pct": 65,
        "ndc_base_year": 1990,
        "ndc_target_year": 2030,
        "ndc_status": "enhanced",
        "carbon_price_usd": 65,
        "carbon_price_coverage_pct": 55,
        "climate_law": True,
        "net_zero_target_year": 2045,
        "policy_stringency": 80,
        "transition_risk_score": 0.74,
        "policy_reversal_risk": "low",
        "ets_coverage_pct": 55,
        "key_policies": ["eu_ets", "ets2_heating_transport", "klimaschutzgesetz", "energiewende"],
    },
    "FRA": {
        "name": "France",
        "region": "Europe",
        "ndc_target_pct": 55,
        "ndc_base_year": 1990,
        "ndc_target_year": 2030,
        "ndc_status": "enhanced",
        "carbon_price_usd": 65,
        "carbon_price_coverage_pct": 45,
        "climate_law": True,
        "net_zero_target_year": 2050,
        "policy_stringency": 78,
        "transition_risk_score": 0.72,
        "policy_reversal_risk": "low",
        "ets_coverage_pct": 45,
        "key_policies": ["eu_ets", "loi_energie_climat", "taxonomie_verte"],
    },
    "ITA": {
        "name": "Italy",
        "region": "Europe",
        "ndc_target_pct": 55,
        "ndc_base_year": 1990,
        "ndc_target_year": 2030,
        "ndc_status": "enhanced",
        "carbon_price_usd": 65,
        "carbon_price_coverage_pct": 45,
        "climate_law": False,
        "net_zero_target_year": 2050,
        "policy_stringency": 65,
        "transition_risk_score": 0.65,
        "policy_reversal_risk": "medium",
        "ets_coverage_pct": 45,
        "key_policies": ["eu_ets", "pnrr_green", "superbonus_110"],
    },
    "ESP": {
        "name": "Spain",
        "region": "Europe",
        "ndc_target_pct": 55,
        "ndc_base_year": 1990,
        "ndc_target_year": 2030,
        "ndc_status": "enhanced",
        "carbon_price_usd": 65,
        "carbon_price_coverage_pct": 45,
        "climate_law": True,
        "net_zero_target_year": 2050,
        "policy_stringency": 70,
        "transition_risk_score": 0.68,
        "policy_reversal_risk": "low",
        "ets_coverage_pct": 45,
        "key_policies": ["eu_ets", "ley_cambio_climatico", "pniec_2030"],
    },
}

# ---------------------------------------------------------------------------
# EU Fit for 55 Package — 13 Regulations
# ---------------------------------------------------------------------------

FIT_FOR_55_PACKAGE: list[dict] = [
    {
        "id": "ets_reform",
        "name": "EU ETS Reform (Revised ETS Directive)",
        "regulation": "Directive 2023/959/EU (amending 2003/87/EC)",
        "adopted_date": "2023-05-10",
        "scope": "Industry and power sector GHG emissions",
        "emissions_reduction_contribution_mtco2": 360,
        "mechanism": "Linear Reduction Factor increased to 4.3% (2024-2027) then 4.4% (2028+); MSR reform",
        "effective_year": 2024,
    },
    {
        "id": "ets2",
        "name": "ETS2 — Buildings and Road Transport (Fuel Combustion)",
        "regulation": "Directive 2023/959/EU — new Chapter IVa",
        "adopted_date": "2023-05-10",
        "scope": "Fuel combustion in buildings and road transport",
        "emissions_reduction_contribution_mtco2": 220,
        "mechanism": "Separate cap-and-trade system; starts 2027 with safety valve price cap €45",
        "effective_year": 2027,
    },
    {
        "id": "cbam",
        "name": "Carbon Border Adjustment Mechanism (CBAM)",
        "regulation": "Regulation (EU) 2023/956",
        "adopted_date": "2023-05-10",
        "scope": "Imports of cement, iron/steel, aluminium, fertilisers, electricity, hydrogen",
        "emissions_reduction_contribution_mtco2": 50,
        "mechanism": "Importers purchase CBAM certificates at prevailing ETS price; phased-in 2026-2034",
        "effective_year": 2026,
    },
    {
        "id": "red_iii",
        "name": "Renewable Energy Directive III (RED III)",
        "regulation": "Directive 2023/2413/EU",
        "adopted_date": "2023-10-09",
        "scope": "EU energy mix; biomass sustainability; renewable targets by sector",
        "emissions_reduction_contribution_mtco2": 310,
        "mechanism": "Overall 42.5% renewables target by 2030 (indicative 45%); sector-specific sub-targets",
        "effective_year": 2023,
    },
    {
        "id": "eed",
        "name": "Energy Efficiency Directive (EED recast)",
        "regulation": "Directive 2023/1791/EU",
        "adopted_date": "2023-09-13",
        "scope": "Final and primary energy consumption across all sectors",
        "emissions_reduction_contribution_mtco2": 240,
        "mechanism": "Binding target: 11.7% reduction in final energy consumption by 2030 vs 2020 baseline",
        "effective_year": 2023,
    },
    {
        "id": "co2_standards_cars",
        "name": "CO2 Standards for Cars and Vans",
        "regulation": "Regulation (EU) 2023/851",
        "adopted_date": "2023-04-19",
        "scope": "New passenger cars and light commercial vehicles",
        "emissions_reduction_contribution_mtco2": 130,
        "mechanism": "100% CO2 reduction for new cars by 2035; 55% by 2030 (cars), 50% (vans)",
        "effective_year": 2025,
    },
    {
        "id": "fueleu_maritime",
        "name": "FuelEU Maritime",
        "regulation": "Regulation (EU) 2023/1805",
        "adopted_date": "2023-10-04",
        "scope": "GHG intensity of energy used by ships ≥5,000 GT on EU voyages",
        "emissions_reduction_contribution_mtco2": 45,
        "mechanism": "GHG intensity limits: -2% (2025) → -6% (2030) → -80% (2050) vs 2020 baseline",
        "effective_year": 2025,
    },
    {
        "id": "refueleu_aviation",
        "name": "ReFuelEU Aviation (SAF Mandate)",
        "regulation": "Regulation (EU) 2023/2405",
        "adopted_date": "2023-10-18",
        "scope": "Sustainable aviation fuels (SAF) blending mandate at EU airports",
        "emissions_reduction_contribution_mtco2": 30,
        "mechanism": "SAF mandate rising to 6% (2030), 20% (2035), 70% (2050); H2/synthetic minimum",
        "effective_year": 2025,
    },
    {
        "id": "lulucf",
        "name": "LULUCF Regulation (Land Use, Land-Use Change and Forestry)",
        "regulation": "Regulation (EU) 2023/839",
        "adopted_date": "2023-05-10",
        "scope": "Land sector net GHG removals and emissions",
        "emissions_reduction_contribution_mtco2": 310,
        "mechanism": "EU-wide target of 310 MtCO2e net removals by 2030; per-MS targets",
        "effective_year": 2021,
    },
    {
        "id": "effort_sharing",
        "name": "Effort Sharing Regulation (ESR)",
        "regulation": "Regulation (EU) 2023/857 amending 2018/842",
        "adopted_date": "2023-05-10",
        "scope": "Non-ETS sectors: buildings, transport, agriculture, small industry, waste",
        "emissions_reduction_contribution_mtco2": 560,
        "mechanism": "Member State targets: -10% (lowest) to -50% (highest) vs 2005; EU avg -40%",
        "effective_year": 2021,
    },
    {
        "id": "afir",
        "name": "Alternative Fuels Infrastructure Regulation (AFIR)",
        "regulation": "Regulation (EU) 2023/1804",
        "adopted_date": "2023-10-04",
        "scope": "EV charging and hydrogen refuelling infrastructure on TEN-T network",
        "emissions_reduction_contribution_mtco2": 20,
        "mechanism": "Mandatory recharging pools every 60 km on motorways by 2025 (EV), 2030 (H2)",
        "effective_year": 2025,
    },
    {
        "id": "social_climate_fund",
        "name": "Social Climate Fund (SCF)",
        "regulation": "Regulation (EU) 2023/955",
        "adopted_date": "2023-05-10",
        "scope": "Vulnerable households, micro-enterprises and transport users under ETS2",
        "emissions_reduction_contribution_mtco2": 0,
        "mechanism": "EUR 86.7bn fund (2026-2032) to cushion ETS2 social impacts; funded by ETS2 revenues",
        "effective_year": 2026,
    },
    {
        "id": "methane_regulation",
        "name": "EU Methane Regulation (Energy Sector)",
        "regulation": "Regulation (EU) 2024/1787",
        "adopted_date": "2024-06-11",
        "scope": "Methane emissions from upstream fossil fuel operations",
        "emissions_reduction_contribution_mtco2": 35,
        "mechanism": "LDAR surveys, venting/flaring limits, MRV obligations; imports methane intensity standard",
        "effective_year": 2024,
    },
]

# ---------------------------------------------------------------------------
# US Inflation Reduction Act — 26 Credits/Incentives
# ---------------------------------------------------------------------------

IRA_CREDITS: list[dict] = [
    {"id": "itc_solar",            "section": "§48",   "name": "Investment Tax Credit (ITC) — Solar",               "sector": "energy",         "value_usd_per_unit": None, "credit_rate_pct": 30, "unit": "% of project cost", "bonus_pct_adders": "10% domestic content; 10% energy community; 10% low-income", "cliff_date": "2033-12-31"},
    {"id": "ptc_wind",             "section": "§45",   "name": "Production Tax Credit (PTC) — Wind",                "sector": "energy",         "value_usd_per_unit": 2.75, "credit_rate_pct": None, "unit": "USD/MWh (2024 indexed)", "bonus_pct_adders": "10% domestic content; 10% energy community", "cliff_date": "2033-12-31"},
    {"id": "ptc_nuclear",          "section": "§45U",  "name": "Nuclear Production Tax Credit",                     "sector": "energy",         "value_usd_per_unit": 15.0, "credit_rate_pct": None, "unit": "USD/MWh (price-adjusted)", "bonus_pct_adders": None, "cliff_date": "2032-12-31"},
    {"id": "ccs_45q",              "section": "§45Q",  "name": "Carbon Capture & Storage (45Q)",                    "sector": "industry",       "value_usd_per_unit": 85.0, "credit_rate_pct": None, "unit": "USD/tCO2 (geologic storage)", "bonus_pct_adders": "Utilisation: $60/t", "cliff_date": "2033-01-01"},
    {"id": "clean_hydrogen_45v",   "section": "§45V",  "name": "Clean Hydrogen Production Credit (45V)",            "sector": "energy",         "value_usd_per_unit": 3.0,  "credit_rate_pct": None, "unit": "USD/kg H2 (tier 1: <0.45 kg CO2/kg H2)", "bonus_pct_adders": None, "cliff_date": "2033-01-01"},
    {"id": "manufacturing_45x",    "section": "§45X",  "name": "Advanced Manufacturing Production Credit (45X)",    "sector": "manufacturing",  "value_usd_per_unit": None, "credit_rate_pct": None, "unit": "per unit (varies by product)", "bonus_pct_adders": "Solar modules $0.07/W; batteries $35/kWh; wind blades/nacelles", "cliff_date": "2032-12-31"},
    {"id": "ev_credit_30d",        "section": "§30D",  "name": "Clean Vehicle Credit (30D) — Consumer EV",         "sector": "transport",      "value_usd_per_unit": 7500, "credit_rate_pct": None, "unit": "USD per vehicle", "bonus_pct_adders": None, "cliff_date": "2032-12-31"},
    {"id": "commercial_ev_45w",    "section": "§45W",  "name": "Commercial Clean Vehicle Credit (45W)",             "sector": "transport",      "value_usd_per_unit": 40000, "credit_rate_pct": None, "unit": "USD per commercial vehicle", "bonus_pct_adders": None, "cliff_date": "2032-12-31"},
    {"id": "used_ev_25e",          "section": "§25E",  "name": "Used Clean Vehicle Credit",                        "sector": "transport",      "value_usd_per_unit": 4000, "credit_rate_pct": None, "unit": "USD per used EV", "bonus_pct_adders": None, "cliff_date": "2032-12-31"},
    {"id": "ev_charging_30c",      "section": "§30C",  "name": "Alternative Fuel Vehicle Refuelling (EV Charging)", "sector": "transport",      "value_usd_per_unit": None, "credit_rate_pct": 30, "unit": "% of cost (max $100k commercial)", "bonus_pct_adders": None, "cliff_date": "2032-12-31"},
    {"id": "home_efficiency_25c",  "section": "§25C",  "name": "Energy Efficient Home Improvement Credit",         "sector": "buildings",      "value_usd_per_unit": None, "credit_rate_pct": 30, "unit": "% of cost (max $3,200/yr)", "bonus_pct_adders": None, "cliff_date": "2032-12-31"},
    {"id": "residential_solar_25d","section": "§25D",  "name": "Residential Clean Energy Credit",                  "sector": "buildings",      "value_usd_per_unit": None, "credit_rate_pct": 30, "unit": "% of solar/storage/geothermal cost", "bonus_pct_adders": None, "cliff_date": "2034-12-31"},
    {"id": "new_homes_45l",        "section": "§45L",  "name": "Energy Efficient New Home Credit (45L)",            "sector": "buildings",      "value_usd_per_unit": 5000, "credit_rate_pct": None, "unit": "USD per home (zero-energy)", "bonus_pct_adders": None, "cliff_date": "2032-12-31"},
    {"id": "commercial_buildings_179d","section": "§179D","name": "Commercial Buildings Energy Efficiency Deduction","sector": "buildings",   "value_usd_per_unit": 5.0,  "credit_rate_pct": None, "unit": "USD/sq ft (max)", "bonus_pct_adders": None, "cliff_date": None},
    {"id": "geothermal_itc",       "section": "§48",   "name": "Investment Tax Credit — Geothermal",               "sector": "energy",         "value_usd_per_unit": None, "credit_rate_pct": 30, "unit": "% of project cost", "bonus_pct_adders": "Same adders as solar ITC", "cliff_date": "2033-12-31"},
    {"id": "offshore_wind_itc",    "section": "§48",   "name": "Investment Tax Credit — Offshore Wind",            "sector": "energy",         "value_usd_per_unit": None, "credit_rate_pct": 30, "unit": "% of project cost", "bonus_pct_adders": "Standalone storage also eligible from 2023", "cliff_date": "2033-12-31"},
    {"id": "battery_storage_itc",  "section": "§48",   "name": "Investment Tax Credit — Standalone Battery Storage","sector": "energy",        "value_usd_per_unit": None, "credit_rate_pct": 30, "unit": "% of project cost", "bonus_pct_adders": "Min capacity 5 kWh; 10% domestic content bonus", "cliff_date": "2033-12-31"},
    {"id": "clean_electricity_ptc","section": "§45Y",  "name": "Clean Electricity PTC (technology-neutral post-2025)","sector": "energy",    "value_usd_per_unit": 2.75, "credit_rate_pct": None, "unit": "USD/MWh indexed", "bonus_pct_adders": "Prevailing wage + apprenticeship required", "cliff_date": "2033-12-31"},
    {"id": "clean_electricity_itc","section": "§48E",  "name": "Clean Electricity ITC (technology-neutral post-2025)","sector": "energy",   "value_usd_per_unit": None, "credit_rate_pct": 30, "unit": "% of project cost", "bonus_pct_adders": "10% domestic content", "cliff_date": "2033-12-31"},
    {"id": "biogas_45z",           "section": "§45Z",  "name": "Clean Fuel Production Credit (45Z) — SAF & Biodiesel","sector": "transport", "value_usd_per_unit": 1.75, "credit_rate_pct": None, "unit": "USD/gallon SAF", "bonus_pct_adders": None, "cliff_date": "2027-12-31"},
    {"id": "rural_energy_9007",    "section": "§9007", "name": "Rural Energy for America Program (REAP) Grant",    "sector": "agriculture",    "value_usd_per_unit": None, "credit_rate_pct": 50, "unit": "% of project cost (grant)", "bonus_pct_adders": None, "cliff_date": "2031-09-30"},
    {"id": "agriculture_methane",  "section": "§136",  "name": "High Energy Cost Grant — Agricultural Biogas",      "sector": "agriculture",    "value_usd_per_unit": None, "credit_rate_pct": None, "unit": "Grant programme (not tax credit)", "bonus_pct_adders": None, "cliff_date": "2031-09-30"},
    {"id": "dac_45q_direct",       "section": "§45Q",  "name": "Direct Air Capture — 45Q Enhanced Credit",         "sector": "industry",       "value_usd_per_unit": 180, "credit_rate_pct": None, "unit": "USD/tCO2 (DAC geologic storage)", "bonus_pct_adders": "Utilisation: $130/t", "cliff_date": "2033-01-01"},
    {"id": "nuclear_civics",       "section": "§48C",  "name": "Advanced Energy Project Credit (§48C) — Nuclear Mfg","sector": "manufacturing", "value_usd_per_unit": None, "credit_rate_pct": 30, "unit": "% of investment", "bonus_pct_adders": "Additional 10% for fossil fuel communities", "cliff_date": "2032-12-31"},
    {"id": "industrial_efficiency","section": "§48C",  "name": "Advanced Energy Project Credit — Industrial Efficiency","sector": "industry",  "value_usd_per_unit": None, "credit_rate_pct": 30, "unit": "% of investment", "bonus_pct_adders": None, "cliff_date": "2032-12-31"},
    {"id": "doe_loan_programs",    "section": "§1703", "name": "DOE Loan Programs — Clean Energy Loan Guarantees",  "sector": "energy",         "value_usd_per_unit": None, "credit_rate_pct": None, "unit": "Loan guarantee (not credit)", "bonus_pct_adders": "Up to $400bn in loan authority under IRA", "cliff_date": None},
]

# ---------------------------------------------------------------------------
# REPowerEU — 10 Measures
# ---------------------------------------------------------------------------

REPOWEREU_MEASURES: list[dict] = [
    {"id": "solar_rooftop",         "name": "Solar Rooftop Mandate",                "target": "Mandatory solar on new buildings from 2026; all commercial by 2027", "contribution_gw": 320},
    {"id": "biomethane_target",     "name": "Biomethane Production Target",          "target": "35 bcm biomethane by 2030",                                         "contribution_gw": None},
    {"id": "hydrogen_import",       "name": "Hydrogen Import Corridors",             "target": "10 Mt H2 imports by 2030 via pipelines and terminals",               "contribution_gw": None},
    {"id": "wind_permitting",       "name": "Wind Permitting Fast-Track",            "target": "18-month permitting limit for wind/solar projects",                  "contribution_gw": 510},
    {"id": "eu_hydrogen_bank",      "name": "EU Hydrogen Bank",                      "target": "EUR 800m first auction (2023); scale to EUR 3bn by 2030",           "contribution_gw": None},
    {"id": "fossil_import_diversification","name": "Fossil Fuel Import Diversification","target": "Reduce Russian gas from 40% (2021) to <10% by 2030",             "contribution_gw": None},
    {"id": "demand_reduction",      "name": "EU Gas Demand Reduction Regulation",   "target": "Voluntary 15% gas demand reduction; mandatory mechanism trigger",    "contribution_gw": None},
    {"id": "heat_pump_acceleration","name": "Heat Pump Deployment Plan",             "target": "10 million additional heat pumps by 2027",                          "contribution_gw": None},
    {"id": "energy_savings_acceleration","name": "Energy Savings Fast-Track",       "target": "Temporary derogation for RES permitting under EU Nature Directives", "contribution_gw": None},
    {"id": "strategic_energy_tech", "name": "Strategic Energy Technology Plan",      "target": "EUR 375bn REPowerEU investment plan integrated into EU cohesion", "contribution_gw": None},
]

# ---------------------------------------------------------------------------
# IEA NZE Carbon Price Corridor (2022-2050)
# ---------------------------------------------------------------------------
# Two tracks: advanced economies (AE) and emerging/developing economies (EMDE)

IEA_NZE_CARBON_PRICE: dict[str, dict[int, int]] = {
    "advanced_economies": {
        2022: 40,
        2025: 75,
        2030: 130,
        2035: 175,
        2040: 215,
        2045: 230,
        2050: 250,
    },
    "emerging_developing_economies": {
        2022: 25,
        2025: 45,
        2030: 90,
        2035: 130,
        2040: 160,
        2045: 180,
        2050: 200,
    },
}

# Advanced economy jurisdictions (for IEA corridor assignment)
ADVANCED_ECONOMY_JURISDICTIONS = {
    "EU", "USA", "GBR", "JPN", "AUS", "CAN", "KOR",
    "NOR", "CHE", "NZL", "SWE", "DNK", "DEU", "FRA", "ITA", "ESP", "POL",
}

# ---------------------------------------------------------------------------
# NGFS Policy Scenarios — Carbon Price Trajectories (USD/tCO2e)
# ---------------------------------------------------------------------------

NGFS_POLICY_SCENARIOS: dict[str, dict] = {
    "orderly": {
        "name": "Net Zero 2050 (Orderly)",
        "description": "Paris-consistent, ambitious early action, smooth transition",
        "carbon_prices": {
            "advanced_economies": {2020: 25, 2025: 100, 2030: 200, 2035: 300, 2040: 450, 2050: 700},
            "emerging_economies": {2020: 5,  2025: 30,  2030: 80,  2035: 130, 2040: 200, 2050: 350},
        },
        "physical_risk": "low",
        "transition_risk": "high",
        "gdp_impact_2100_pct": -1.5,
    },
    "disorderly": {
        "name": "Delayed Transition (Disorderly)",
        "description": "Late action after 2030, disruptive policy tightening",
        "carbon_prices": {
            "advanced_economies": {2020: 10, 2025: 20, 2030: 200, 2035: 400, 2040: 600, 2050: 900},
            "emerging_economies": {2020: 2,  2025: 5,  2030: 60,  2035: 150, 2040: 250, 2050: 450},
        },
        "physical_risk": "medium",
        "transition_risk": "very_high",
        "gdp_impact_2100_pct": -4.2,
    },
    "hot_house": {
        "name": "Current Policies (Hot House World)",
        "description": "Current policies only — 3°C+ warming scenario",
        "carbon_prices": {
            "advanced_economies": {2020: 10, 2025: 15, 2030: 20, 2035: 25, 2040: 30, 2050: 40},
            "emerging_economies": {2020: 2,  2025: 4,  2030: 6,  2035: 8,  2040: 10, 2050: 15},
        },
        "physical_risk": "very_high",
        "transition_risk": "low",
        "gdp_impact_2100_pct": -10.0,
    },
    "below_2c": {
        "name": "Below 2°C",
        "description": "Consistent with Paris Agreement ≤2°C; moderate ambition",
        "carbon_prices": {
            "advanced_economies": {2020: 15, 2025: 60, 2030: 120, 2035: 200, 2040: 300, 2050: 500},
            "emerging_economies": {2020: 3,  2025: 20, 2030: 55,  2035: 95,  2040: 150, 2050: 280},
        },
        "physical_risk": "medium_low",
        "transition_risk": "medium_high",
        "gdp_impact_2100_pct": -2.8,
    },
}

# ---------------------------------------------------------------------------
# G20 Carbon Pricing Tracker
# ---------------------------------------------------------------------------

G20_CARBON_PRICING: dict[str, dict] = {
    "EU":  {"ets_coverage_pct": 45, "carbon_price_usd": 65,  "aviation_coverage": True},
    "USA": {"ets_coverage_pct": 12, "carbon_price_usd": 17,  "aviation_coverage": False},
    "GBR": {"ets_coverage_pct": 30, "carbon_price_usd": 50,  "aviation_coverage": True},
    "CHN": {"ets_coverage_pct": 40, "carbon_price_usd": 9,   "aviation_coverage": False},
    "JPN": {"ets_coverage_pct": 55, "carbon_price_usd": 3,   "aviation_coverage": False},
    "KOR": {"ets_coverage_pct": 73, "carbon_price_usd": 7,   "aviation_coverage": False},
    "CAN": {"ets_coverage_pct": 80, "carbon_price_usd": 65,  "aviation_coverage": False},
    "AUS": {"ets_coverage_pct": 28, "carbon_price_usd": 29,  "aviation_coverage": False},
    "ZAF": {"ets_coverage_pct": 80, "carbon_price_usd": 10,  "aviation_coverage": False},
    "IND": {"ets_coverage_pct": 0,  "carbon_price_usd": 0,   "aviation_coverage": False},
    "BRA": {"ets_coverage_pct": 0,  "carbon_price_usd": 0,   "aviation_coverage": False},
    "MEX": {"ets_coverage_pct": 40, "carbon_price_usd": 3,   "aviation_coverage": False},
    "ARG": {"ets_coverage_pct": 20, "carbon_price_usd": 5,   "aviation_coverage": False},
    "TUR": {"ets_coverage_pct": 0,  "carbon_price_usd": 0,   "aviation_coverage": False},
    "IDN": {"ets_coverage_pct": 5,  "carbon_price_usd": 2,   "aviation_coverage": False},
    "SAU": {"ets_coverage_pct": 0,  "carbon_price_usd": 0,   "aviation_coverage": False},
    "NOR": {"ets_coverage_pct": 85, "carbon_price_usd": 85,  "aviation_coverage": True},
    "CHE": {"ets_coverage_pct": 33, "carbon_price_usd": 130, "aviation_coverage": False},
    "SWE": {"ets_coverage_pct": 40, "carbon_price_usd": 130, "aviation_coverage": False},
    "DNK": {"ets_coverage_pct": 50, "carbon_price_usd": 185, "aviation_coverage": False},
}

# ---------------------------------------------------------------------------
# Paris 1.5°C Benchmark NDC Reductions by 2030 (IPCC AR6 median)
# ---------------------------------------------------------------------------
# Minimum % reduction from 2010 levels to be 1.5°C-consistent
PARIS_15C_BENCHMARK_PCT_FROM_2010 = 43  # ~43% reduction from 2010 GHG levels

# ---------------------------------------------------------------------------
# Sector-to-Policy Applicability Mapping
# ---------------------------------------------------------------------------

SECTOR_POLICY_MAP: dict[str, list[str]] = {
    "energy":          ["eu_ets", "fit_for_55", "red_iii", "eed", "ira_2022", "cbam", "gx_league_ets"],
    "transport":       ["co2_standards_cars", "afir", "refueleu_aviation", "fueleu_maritime", "ira_2022"],
    "buildings":       ["eed", "ets2", "social_climate_fund", "ira_2022"],
    "industry":        ["eu_ets", "cbam", "ira_2022", "carbon_tax", "safeguard_mechanism"],
    "agriculture":     ["lulucf", "effort_sharing", "ira_2022", "national_action_plan_cc"],
    "finance":         ["eu_taxonomy", "csrd", "tcfd_mandatory", "sfdr", "uk_sdr", "mas_green_finance"],
    "real_estate":     ["ets2", "eed", "social_climate_fund"],
    "shipping":        ["fueleu_maritime", "eu_ets"],
    "aviation":        ["refueleu_aviation", "eu_ets"],
    "waste":           ["effort_sharing"],
}

# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------


@dataclass
class JurisdictionAssessment:
    jurisdiction: str
    name: str
    ndc_target_pct: int
    ndc_status: str
    carbon_price_usd: float
    carbon_price_coverage_pct: float
    policy_stringency: int
    transition_risk_score: float
    net_zero_target_year: Optional[int]
    policy_reversal_risk: str
    climate_law: bool
    nze_corridor_2030: int
    carbon_price_gap_usd: float
    ambition_score: float
    paris_consistent: bool


@dataclass
class NDCAmbitiionScore:
    jurisdiction: str
    raw_target_pct: int
    base_year: int
    ambition_score: float
    paris_consistent: bool
    gap_vs_15c_pp: float
    ndc_status: str
    conditional: bool


@dataclass
class PolicyImpactResult:
    jurisdiction: str
    sector: str
    applicable_regulations: list[str]
    nearest_deadline_year: Optional[int]
    compliance_impact_score: float
    transition_risk_contribution: float


class ClimatePolicyTrackerEngine:
    """
    Climate Policy Tracking Engine.
    All reference data is hardcoded; no database calls.
    """

    def _get_jurisdiction(self, iso: str) -> Optional[dict]:
        return JURISDICTION_PROFILES.get(iso.upper())

    def _is_advanced_economy(self, iso: str) -> bool:
        return iso.upper() in ADVANCED_ECONOMY_JURISDICTIONS

    def _get_nze_price(self, iso: str, year: int = 2030) -> int:
        track = (
            "advanced_economies"
            if self._is_advanced_economy(iso)
            else "emerging_developing_economies"
        )
        corridor = IEA_NZE_CARBON_PRICE[track]
        # Interpolate between available years
        years = sorted(corridor.keys())
        if year <= years[0]:
            return corridor[years[0]]
        if year >= years[-1]:
            return corridor[years[-1]]
        for i in range(len(years) - 1):
            y0, y1 = years[i], years[i + 1]
            if y0 <= year <= y1:
                p0, p1 = corridor[y0], corridor[y1]
                frac = (year - y0) / (y1 - y0)
                return int(p0 + frac * (p1 - p0))
        return corridor[years[-1]]

    # ------------------------------------------------------------------
    # Public: assess_jurisdiction_policy
    # ------------------------------------------------------------------

    def assess_jurisdiction_policy(self, jurisdiction: str) -> dict:
        """
        Full jurisdiction policy assessment:
        NDC ambition, carbon price gap vs IEA NZE, policy stringency, transition risk.
        """
        iso = jurisdiction.upper()
        profile = self._get_jurisdiction(iso)
        if not profile:
            return {"error": f"Jurisdiction '{jurisdiction}' not found in profiles. Use ISO2 code."}

        nze_2030 = self._get_nze_price(iso, 2030)
        carbon_price_gap = max(nze_2030 - profile["carbon_price_usd"], 0)

        # NDC ambition score (0-100)
        ambition_score = self._compute_ambition_score(
            profile["ndc_target_pct"],
            profile["ndc_base_year"],
            profile["ndc_status"],
            profile.get("net_zero_target_year"),
        )

        paris_consistent = ambition_score >= 60  # rough threshold

        # Policy pipeline
        applicable_policies = self._get_applicable_policies(iso)
        upcoming_deadlines = self._get_upcoming_deadlines(iso)

        # Regulatory pipeline (EU-specific)
        pipeline: list[dict] = []
        if iso == "EU":
            for reg in FIT_FOR_55_PACKAGE:
                pipeline.append({
                    "regulation": reg["name"],
                    "effective_year": reg["effective_year"],
                    "mechanism": reg["mechanism"][:80],
                })
        elif iso == "USA":
            pipeline.append({
                "regulation": "IRA 2022 — credits through 2032-2033",
                "effective_year": 2022,
                "mechanism": "26 tax credits; total ~$369bn 10yr cost estimate",
            })

        return {
            "jurisdiction": iso,
            "name": profile["name"],
            "region": profile["region"],
            "ndc": {
                "target_pct": profile["ndc_target_pct"],
                "base_year": profile["ndc_base_year"],
                "target_year": profile["ndc_target_year"],
                "status": profile["ndc_status"],
                "ambition_score": round(ambition_score, 1),
                "paris_consistent": paris_consistent,
            },
            "carbon_pricing": {
                "current_price_usd": profile["carbon_price_usd"],
                "coverage_pct": profile["carbon_price_coverage_pct"],
                "nze_corridor_2030_usd": nze_2030,
                "gap_vs_nze_usd": carbon_price_gap,
                "ets_coverage_pct": profile["ets_coverage_pct"],
            },
            "policy_framework": {
                "climate_law": profile["climate_law"],
                "net_zero_target_year": profile["net_zero_target_year"],
                "policy_stringency_score": profile["policy_stringency"],
                "transition_risk_score": profile["transition_risk_score"],
                "policy_reversal_risk": profile["policy_reversal_risk"],
            },
            "key_policies": profile["key_policies"],
            "applicable_regulations": applicable_policies,
            "upcoming_deadlines": upcoming_deadlines,
            "regulatory_pipeline": pipeline,
        }

    # ------------------------------------------------------------------
    # Public: score_ndc_ambition
    # ------------------------------------------------------------------

    def score_ndc_ambition(
        self,
        jurisdiction: str,
        target_pct: Optional[float] = None,
        base_year: Optional[int] = None,
        conditional: bool = False,
    ) -> dict:
        """
        Score NDC ambition 0-100 and assess Paris 1.5°C consistency.

        Uses provided target_pct/base_year if given, otherwise falls back
        to jurisdiction profile data.
        """
        iso = jurisdiction.upper()
        profile = self._get_jurisdiction(iso)
        if not profile:
            return {"error": f"Jurisdiction '{iso}' not found"}

        t_pct = target_pct if target_pct is not None else profile["ndc_target_pct"]
        b_year = base_year if base_year is not None else profile["ndc_base_year"]
        ndc_status = profile["ndc_status"]
        net_zero = profile.get("net_zero_target_year")

        ambition_score = self._compute_ambition_score(t_pct, b_year, ndc_status, net_zero)

        # Adjust for conditionality
        if conditional:
            ambition_score *= 0.85  # conditional NDCs less reliable

        # Paris gap — compare to IPCC AR6 1.5°C benchmark adjusted to base year
        # Simple heuristic: 43% from 2010 levels. Adjust for base year difference.
        base_year_adjustment = max(0, (b_year - 2010) * 0.5)
        adjusted_paris_benchmark = PARIS_15C_BENCHMARK_PCT_FROM_2010 - base_year_adjustment
        gap_vs_15c = max(adjusted_paris_benchmark - t_pct, 0)

        return {
            "jurisdiction": iso,
            "name": profile["name"],
            "ndc_target_pct": t_pct,
            "ndc_base_year": b_year,
            "ndc_status": ndc_status,
            "conditional": conditional,
            "ambition_score": round(ambition_score, 1),
            "ambition_tier": (
                "high"        if ambition_score >= 70
                else "medium" if ambition_score >= 45
                else "low"    if ambition_score >= 25
                else "insufficient"
            ),
            "paris_consistent_15c": ambition_score >= 65,
            "paris_consistent_2c": ambition_score >= 45,
            "gap_vs_15c_pp": round(gap_vs_15c, 1),
            "net_zero_target_year": net_zero,
            "climate_law": profile["climate_law"],
            "notes": (
                f"NDC {ndc_status}; 1.5°C benchmark requires ~{adjusted_paris_benchmark:.0f}% "
                f"reduction from {b_year} baseline. "
                + ("Conditional on international support." if conditional else "")
            ),
        }

    def _compute_ambition_score(
        self,
        target_pct: float,
        base_year: int,
        ndc_status: str,
        net_zero_year: Optional[int],
    ) -> float:
        """Internal ambition score computation (0-100)."""
        # Base score from target level normalised to 0-80 range
        # Higher is more ambitious: benchmark 30% → 30pts; 55%+ → 70pts
        target_score = min(70.0, (target_pct / 55) * 70)

        # Bonus for updated/enhanced NDC
        status_bonus = {"first": 0, "updated": 5, "enhanced": 10}.get(ndc_status, 0)

        # Bonus for net-zero law
        nz_bonus = 0
        if net_zero_year is not None:
            if net_zero_year <= 2050:
                nz_bonus = 15
            elif net_zero_year <= 2060:
                nz_bonus = 8
            else:
                nz_bonus = 3

        # Base year penalty: older base year inflates headline %
        base_year_penalty = max(0, (base_year - 2010) * 0.3)

        return max(0.0, min(100.0, target_score + status_bonus + nz_bonus - base_year_penalty))

    # ------------------------------------------------------------------
    # Public: track_policy_pipeline
    # ------------------------------------------------------------------

    def track_policy_pipeline(self, jurisdiction: str, entity_sector: str) -> dict:
        """
        Track applicable regulations and compliance deadlines for a given
        jurisdiction + sector combination.
        """
        iso = jurisdiction.upper()
        sector = entity_sector.lower()
        profile = self._get_jurisdiction(iso)
        if not profile:
            return {"error": f"Jurisdiction '{iso}' not found"}

        # Find applicable regulations from sector map
        sector_policies = SECTOR_POLICY_MAP.get(sector, [])
        jurisdiction_policies = set(profile["key_policies"])
        applicable = [p for p in sector_policies if p in jurisdiction_policies]

        # Build regulation detail list
        reg_details = []
        if iso == "EU":
            for reg in FIT_FOR_55_PACKAGE:
                if any(
                    kw in reg["id"]
                    for kw in self._sector_to_fit55_keywords(sector)
                ):
                    reg_details.append({
                        "id": reg["id"],
                        "name": reg["name"],
                        "effective_year": reg["effective_year"],
                        "mechanism": reg["mechanism"][:100],
                        "compliance_deadline": str(reg["effective_year"]),
                    })

        if iso == "USA" and sector in ("energy", "buildings", "transport", "industry", "agriculture"):
            for credit in IRA_CREDITS:
                if credit["sector"] == sector:
                    reg_details.append({
                        "id": credit["id"],
                        "name": credit["name"],
                        "effective_year": 2022,
                        "mechanism": f"Section {credit['section']} tax credit",
                        "compliance_deadline": credit.get("cliff_date", "Open-ended"),
                    })

        deadlines = sorted(
            [r["effective_year"] for r in reg_details if isinstance(r.get("effective_year"), int)]
        )
        nearest_deadline = deadlines[0] if deadlines else None

        # Impact score 0-10
        n_regs = len(reg_details) if reg_details else len(applicable)
        impact_score = min(10.0, n_regs * 1.5 + profile["policy_stringency"] / 20)

        return {
            "jurisdiction": iso,
            "jurisdiction_name": profile["name"],
            "sector": sector,
            "applicable_policy_ids": applicable,
            "regulation_count": n_regs,
            "nearest_compliance_deadline_year": nearest_deadline,
            "compliance_impact_score": round(impact_score, 1),
            "transition_risk_score": profile["transition_risk_score"],
            "policy_reversal_risk": profile["policy_reversal_risk"],
            "regulation_details": reg_details[:10],  # cap output
        }

    def _sector_to_fit55_keywords(self, sector: str) -> list[str]:
        mapping = {
            "energy":       ["ets", "red", "eed", "methane"],
            "transport":    ["co2_standards", "afir", "fueleu", "refueleu"],
            "buildings":    ["ets2", "eed", "social_climate"],
            "industry":     ["ets", "cbam"],
            "agriculture":  ["lulucf", "effort"],
            "shipping":     ["fueleu"],
            "aviation":     ["refueleu"],
        }
        return mapping.get(sector, [])

    def _get_applicable_policies(self, iso: str) -> list[str]:
        profile = self._get_jurisdiction(iso)
        return profile["key_policies"] if profile else []

    def _get_upcoming_deadlines(self, iso: str) -> list[dict]:
        deadlines = []
        if iso == "EU":
            for reg in FIT_FOR_55_PACKAGE:
                if reg["effective_year"] >= 2024:
                    deadlines.append({
                        "regulation": reg["name"],
                        "year": reg["effective_year"],
                    })
            deadlines.sort(key=lambda x: x["year"])
        return deadlines[:5]

    # ------------------------------------------------------------------
    # Public: calculate_carbon_price_gap
    # ------------------------------------------------------------------

    def calculate_carbon_price_gap(
        self,
        jurisdiction: str,
        current_price: Optional[float] = None,
    ) -> dict:
        """
        Calculate gap between jurisdiction's carbon price and IEA NZE corridor.

        Returns gap amount, trajectory analysis, and economic impact estimate.
        """
        iso = jurisdiction.upper()
        profile = self._get_jurisdiction(iso)
        if not profile:
            return {"error": f"Jurisdiction '{iso}' not found"}

        actual_price = current_price if current_price is not None else profile["carbon_price_usd"]
        is_ae = self._is_advanced_economy(iso)
        track = "advanced_economies" if is_ae else "emerging_developing_economies"

        corridor = IEA_NZE_CARBON_PRICE[track]
        trajectory: list[dict] = []
        for year, nze_price in sorted(corridor.items()):
            if year >= 2022:
                gap = max(nze_price - actual_price, 0)
                # Linear catch-up required ($/year) to close gap by 2030
                years_to_close = max(2030 - 2024, 1)
                annual_increase_required = gap / years_to_close if year == 2030 else None
                trajectory.append({
                    "year": year,
                    "nze_corridor_usd": nze_price,
                    "current_price_usd": actual_price,
                    "gap_usd": gap,
                    "annual_increase_to_close_by_2030": (
                        round(annual_increase_required, 1)
                        if annual_increase_required is not None else None
                    ),
                })

        gap_2030 = max(self._get_nze_price(iso, 2030) - actual_price, 0)
        gap_2050 = max(self._get_nze_price(iso, 2050) - actual_price, 0)

        # Economic impact proxy: GDP% impact of carbon price gap (rough)
        # Assume 1% GDP risk per $50 gap by 2030
        gdp_risk_pct = gap_2030 / 50 * 1.0 if is_ae else gap_2030 / 50 * 0.5

        return {
            "jurisdiction": iso,
            "name": profile["name"],
            "economy_track": track.replace("_", " ").title(),
            "current_carbon_price_usd": actual_price,
            "carbon_price_coverage_pct": profile["carbon_price_coverage_pct"],
            "nze_corridor_2030_usd": self._get_nze_price(iso, 2030),
            "nze_corridor_2050_usd": self._get_nze_price(iso, 2050),
            "gap_vs_nze_2030_usd": gap_2030,
            "gap_vs_nze_2050_usd": gap_2050,
            "gap_pct_of_nze_2030": round(gap_2030 / self._get_nze_price(iso, 2030) * 100, 1) if self._get_nze_price(iso, 2030) > 0 else 0,
            "estimated_gdp_risk_from_gap_pct": round(gdp_risk_pct, 2),
            "trajectory": trajectory,
            "policy_reversal_risk": profile["policy_reversal_risk"],
            "notes": (
                "IEA NZE = Net Zero Emissions scenario (IEA World Energy Outlook 2023). "
                "Gap is indicative — actual competitiveness impact depends on sector mix and border adjustments."
            ),
        }

    # ------------------------------------------------------------------
    # Public: assess_policy_portfolio_impact
    # ------------------------------------------------------------------

    def assess_policy_portfolio_impact(
        self,
        portfolio_countries: list[str],
        portfolio_sectors: list[str],
        weights: Optional[list[float]] = None,
    ) -> dict:
        """
        Assess portfolio-level transition risk from climate policy exposure.

        Parameters
        ----------
        portfolio_countries : list of ISO2 country codes
        portfolio_sectors   : list of sector names (matching SECTOR_POLICY_MAP keys)
        weights             : exposure weights (must sum to 1); defaults to equal weight
        """
        n = len(portfolio_countries)
        if n == 0:
            return {"error": "No portfolio countries provided"}

        if weights is None:
            weights = [1.0 / n] * n
        elif abs(sum(weights) - 1.0) > 0.01:
            # Normalise
            total = sum(weights)
            weights = [w / total for w in weights]

        weighted_transition_risk = 0.0
        weighted_stringency = 0.0
        country_results = []

        for i, iso in enumerate(portfolio_countries):
            iso = iso.upper()
            w = weights[i] if i < len(weights) else 1.0 / n
            profile = self._get_jurisdiction(iso)

            if not profile:
                country_results.append({
                    "country": iso,
                    "weight_pct": round(w * 100, 1),
                    "error": "Jurisdiction not found",
                })
                continue

            # Sector-specific risk modifier
            sector_risk_modifier = 1.0
            for sector in portfolio_sectors:
                sector_policies = SECTOR_POLICY_MAP.get(sector.lower(), [])
                overlap = len([p for p in sector_policies if p in profile["key_policies"]])
                sector_risk_modifier = max(sector_risk_modifier, 1.0 + overlap * 0.05)

            effective_transition_risk = min(1.0, profile["transition_risk_score"] * sector_risk_modifier)
            weighted_transition_risk += w * effective_transition_risk
            weighted_stringency += w * profile["policy_stringency"]

            gap_2030 = max(self._get_nze_price(iso, 2030) - profile["carbon_price_usd"], 0)

            country_results.append({
                "country": iso,
                "country_name": profile["name"],
                "weight_pct": round(w * 100, 1),
                "transition_risk_score": profile["transition_risk_score"],
                "effective_transition_risk": round(effective_transition_risk, 3),
                "policy_stringency": profile["policy_stringency"],
                "carbon_price_usd": profile["carbon_price_usd"],
                "nze_gap_2030_usd": gap_2030,
                "policy_reversal_risk": profile["policy_reversal_risk"],
                "net_zero_target_year": profile.get("net_zero_target_year"),
            })

        # Stranded asset exposure — high-risk jurisdictions with high reversal risk
        stranded_asset_exposure_countries = [
            r["country"] for r in country_results
            if r.get("policy_reversal_risk") == "high"
            and r.get("effective_transition_risk", 0) > 0.5
        ]

        # Overall risk tier
        if weighted_transition_risk >= 0.70:
            risk_tier = "very_high"
        elif weighted_transition_risk >= 0.55:
            risk_tier = "high"
        elif weighted_transition_risk >= 0.40:
            risk_tier = "medium"
        elif weighted_transition_risk >= 0.25:
            risk_tier = "low_medium"
        else:
            risk_tier = "low"

        return {
            "portfolio_summary": {
                "country_count": len(portfolio_countries),
                "sector_count": len(portfolio_sectors),
                "weighted_transition_risk": round(weighted_transition_risk, 4),
                "weighted_policy_stringency": round(weighted_stringency, 1),
                "portfolio_risk_tier": risk_tier,
                "stranded_asset_exposure_countries": stranded_asset_exposure_countries,
            },
            "sectors_assessed": portfolio_sectors,
            "country_breakdown": country_results,
            "ngfs_scenario_context": {
                "orderly_transition_risk_modifier": 1.0,
                "disorderly_transition_risk_modifier": 1.4,
                "hot_house_physical_risk_modifier": 1.8,
            },
        }
