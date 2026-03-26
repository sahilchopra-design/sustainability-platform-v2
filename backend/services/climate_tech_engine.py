"""
Climate Tech Investment Engine (E118)
======================================
Comprehensive climate technology investment analysis engine covering:
  1. CTVC Climate Tech Taxonomy — 11 sectors with sub-sectors and technology maps
  2. IEA Clean Energy Investment Data (2024) — 20 categories, NZE 2030 targets
  3. BloombergNEF Learning Curves — historical cost data (2010-2024) + projections to 2050
  4. VC/PE Climate Tech Deal Data — 11 CTVC sectors × 4 stages
  5. Patent Intensity Index — 20 technologies × 5 jurisdictions
  6. IEA Marginal Abatement Cost (MAC) Curves — 25 technologies
  7. Technology Readiness Levels (TRL 1-9)
  8. Green Taxonomy Alignment — EU Taxonomy, SFDR PAI, ICMA GBP

Sub-modules:
  - Technology Assessment (TRL, deployment, learning rate, cost trajectory, MAC)
  - Investment Opportunity Analysis (VC/PE comps, patent position, risk-return)
  - Portfolio Analysis (CTVC diversification, abatement potential, EU Taxonomy alignment)
  - Learning Curve Calculator (cost projection, LCOE/LCOS, cost levers)

References:
  - CTVC Climate Tech Taxonomy 2024
  - IEA World Energy Investment 2024 / Net Zero by 2050 (NZE 2023)
  - BloombergNEF Energy Transition Investment Trends 2024
  - GHG Protocol / Science Based Targets initiative
  - EU Taxonomy Climate Delegated Act 2021/2139 + 2023/2485
  - ICMA Green Bond Principles 2021 / Climate Transition Finance Handbook 2023
  - SFDR RTS 2022/1288 — PAI indicators
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Optional


# ---------------------------------------------------------------------------
# Reference Data — CTVC Climate Tech Taxonomy (11 Sectors)
# ---------------------------------------------------------------------------

CTVC_TAXONOMY: dict[str, dict] = {
    "energy": {
        "description": "Clean energy generation, storage and infrastructure",
        "sub_sectors": ["solar_pv", "onshore_wind", "offshore_wind", "battery_storage",
                        "green_hydrogen", "nuclear_smr", "long_duration_storage",
                        "smart_grid", "virtual_power_plants", "geothermal"],
        "key_technologies": {
            "solar_pv": "Utility-scale and rooftop photovoltaic generation",
            "onshore_wind": "Land-based wind turbines",
            "offshore_wind": "Fixed and floating offshore wind",
            "battery_storage": "Li-ion and flow battery BESS",
            "green_hydrogen": "Electrolysis-based H2 from renewable power",
            "nuclear_smr": "Small modular reactors (<300 MWe)",
            "long_duration_storage": "Multi-day/week energy storage (LDES)",
            "smart_grid": "Grid digitalisation, demand response, flexibility",
            "virtual_power_plants": "Aggregated distributed energy resources",
            "geothermal": "Hydrothermal and EGS geothermal",
        },
        "stage_distribution": {"seed": 0.12, "early": 0.28, "growth": 0.38, "late": 0.22},
        "typical_deal_size_usd_m": {"seed": 3.5, "early": 18.0, "growth": 95.0, "late": 320.0},
        "eu_taxonomy_eligible": True,
        "sfdr_pai_relevant": ["pai_1", "pai_2", "pai_3"],
    },
    "transportation": {
        "description": "Zero-emission mobility and logistics",
        "sub_sectors": ["ev_passenger", "ev_commercial", "sustainable_aviation_fuel",
                        "maritime_green_fuels", "rail_electrification", "micro_mobility",
                        "autonomous_ev", "hydrogen_mobility"],
        "key_technologies": {
            "ev_passenger": "Battery electric passenger vehicles",
            "ev_commercial": "Electric trucks, vans and buses",
            "sustainable_aviation_fuel": "SAF from HEFA, PtL, waste",
            "maritime_green_fuels": "Ammonia, methanol and LNG for shipping",
            "rail_electrification": "Overhead line and battery rail",
            "micro_mobility": "E-scooters and e-bikes",
            "autonomous_ev": "Self-driving electric vehicles",
            "hydrogen_mobility": "FCEV trucks and buses",
        },
        "stage_distribution": {"seed": 0.10, "early": 0.22, "growth": 0.40, "late": 0.28},
        "typical_deal_size_usd_m": {"seed": 4.0, "early": 22.0, "growth": 110.0, "late": 380.0},
        "eu_taxonomy_eligible": True,
        "sfdr_pai_relevant": ["pai_1", "pai_3"],
    },
    "buildings": {
        "description": "Low-carbon construction, retrofits and building systems",
        "sub_sectors": ["heat_pumps", "building_automation", "green_materials",
                        "smart_windows", "passive_house", "retrofits", "district_heating"],
        "key_technologies": {
            "heat_pumps": "Air-source and ground-source heat pumps",
            "building_automation": "BEMS, IoT sensors, demand flexibility",
            "green_materials": "Low-carbon concrete, timber, insulation",
            "smart_windows": "Electrochromic and thermochromic glazing",
            "passive_house": "Ultra-low energy design and air tightness",
            "retrofits": "Deep energy renovation of existing stock",
            "district_heating": "Low-temperature district heating networks",
        },
        "stage_distribution": {"seed": 0.15, "early": 0.30, "growth": 0.35, "late": 0.20},
        "typical_deal_size_usd_m": {"seed": 2.5, "early": 12.0, "growth": 60.0, "late": 200.0},
        "eu_taxonomy_eligible": True,
        "sfdr_pai_relevant": ["pai_1", "pai_3", "pai_6"],
    },
    "industry": {
        "description": "Deep decarbonisation of hard-to-abate industrial processes",
        "sub_sectors": ["steel_dri_h2", "cement_ccus", "chemicals_green",
                        "industrial_heat", "electrification", "process_efficiency",
                        "ccs_ccus", "industrial_hydrogen"],
        "key_technologies": {
            "steel_dri_h2": "Hydrogen-based direct reduced iron steelmaking",
            "cement_ccus": "CCS/oxy-fuel for cement kilns",
            "chemicals_green": "Bio-based and electrified chemical feedstocks",
            "industrial_heat": "Electric and H2 industrial furnaces",
            "electrification": "Electrification of industrial process heat",
            "process_efficiency": "Motor systems, waste heat recovery",
            "ccs_ccus": "Carbon capture, utilisation and storage",
            "industrial_hydrogen": "H2 as industrial reductant or fuel",
        },
        "stage_distribution": {"seed": 0.08, "early": 0.20, "growth": 0.42, "late": 0.30},
        "typical_deal_size_usd_m": {"seed": 5.0, "early": 30.0, "growth": 150.0, "late": 500.0},
        "eu_taxonomy_eligible": True,
        "sfdr_pai_relevant": ["pai_1", "pai_2", "pai_3"],
    },
    "food_land_use": {
        "description": "Sustainable agriculture, food systems and land management",
        "sub_sectors": ["precision_agriculture", "alternative_proteins", "sustainable_forestry",
                        "soil_carbon", "regenerative_ag", "vertical_farming", "food_waste_tech"],
        "key_technologies": {
            "precision_agriculture": "IoT sensors, satellite and AI for crop optimisation",
            "alternative_proteins": "Plant-based, fermentation and cultivated meat",
            "sustainable_forestry": "FSC-certified managed forestry",
            "soil_carbon": "Soil health measurement and carbon sequestration",
            "regenerative_ag": "Cover crops, no-till and agroforestry",
            "vertical_farming": "Controlled environment agriculture",
            "food_waste_tech": "Cold-chain, biodigesters, redistribution platforms",
        },
        "stage_distribution": {"seed": 0.18, "early": 0.32, "growth": 0.30, "late": 0.20},
        "typical_deal_size_usd_m": {"seed": 3.0, "early": 14.0, "growth": 55.0, "late": 175.0},
        "eu_taxonomy_eligible": True,
        "sfdr_pai_relevant": ["pai_7", "pai_8", "pai_9", "pai_10"],
    },
    "carbon_removal": {
        "description": "Engineered and nature-based carbon dioxide removal",
        "sub_sectors": ["direct_air_capture", "beccs", "biochar", "enhanced_weathering",
                        "ocean_alkalinity", "afforestation", "soil_carbon_capture"],
        "key_technologies": {
            "direct_air_capture": "Solid/liquid sorbent DAC",
            "beccs": "Bioenergy with CCS",
            "biochar": "Pyrolysis-derived stable carbon",
            "enhanced_weathering": "Mineral carbonation in soils",
            "ocean_alkalinity": "Ocean-based alkalinity enhancement",
            "afforestation": "Tree planting and reforestation programmes",
            "soil_carbon_capture": "Agricultural soil carbon sequestration",
        },
        "stage_distribution": {"seed": 0.20, "early": 0.35, "growth": 0.30, "late": 0.15},
        "typical_deal_size_usd_m": {"seed": 4.0, "early": 20.0, "growth": 80.0, "late": 250.0},
        "eu_taxonomy_eligible": True,
        "sfdr_pai_relevant": ["pai_1"],
    },
    "climate_finance": {
        "description": "Financial instruments, ESG data and carbon markets",
        "sub_sectors": ["carbon_markets", "esg_data_analytics", "green_bonds_platforms",
                        "climate_risk_insurance", "blended_finance", "sustainability_linked_loans"],
        "key_technologies": {
            "carbon_markets": "Voluntary and compliance carbon registry platforms",
            "esg_data_analytics": "AI-powered ESG scoring and disclosure",
            "green_bonds_platforms": "Digital green bond issuance infrastructure",
            "climate_risk_insurance": "Parametric and index-based climate insurance",
            "blended_finance": "First-loss, guarantee and concessional finance",
            "sustainability_linked_loans": "KPI-linked lending platforms",
        },
        "stage_distribution": {"seed": 0.22, "early": 0.35, "growth": 0.28, "late": 0.15},
        "typical_deal_size_usd_m": {"seed": 2.0, "early": 10.0, "growth": 45.0, "late": 150.0},
        "eu_taxonomy_eligible": False,
        "sfdr_pai_relevant": ["pai_1", "pai_2", "pai_3"],
    },
    "climate_adaptation": {
        "description": "Resilience and adaptation to physical climate impacts",
        "sub_sectors": ["water_management", "flood_defence", "heat_resilience",
                        "climate_analytics", "disaster_risk", "coastal_protection"],
        "key_technologies": {
            "water_management": "Water recycling, desalination, smart water networks",
            "flood_defence": "Nature-based and engineered flood barriers",
            "heat_resilience": "Cool roofs, urban greening, passive cooling",
            "climate_analytics": "Physical risk modelling and scenario tools",
            "disaster_risk": "Early warning systems, parametric triggers",
            "coastal_protection": "Mangrove restoration, living shorelines",
        },
        "stage_distribution": {"seed": 0.18, "early": 0.30, "growth": 0.33, "late": 0.19},
        "typical_deal_size_usd_m": {"seed": 3.0, "early": 15.0, "growth": 65.0, "late": 220.0},
        "eu_taxonomy_eligible": True,
        "sfdr_pai_relevant": ["pai_6", "pai_8"],
    },
    "biodiversity": {
        "description": "Nature-positive technologies and ecosystem services",
        "sub_sectors": ["biodiversity_credits", "habitat_monitoring", "rewilding_tech",
                        "species_tracking", "nature_based_solutions", "blue_carbon"],
        "key_technologies": {
            "biodiversity_credits": "Voluntary biodiversity credit generation and trading",
            "habitat_monitoring": "eDNA, satellite and drone-based habitat assessment",
            "rewilding_tech": "Ecosystem restoration technology",
            "species_tracking": "AI-powered wildlife monitoring",
            "nature_based_solutions": "Wetland restoration, urban green infrastructure",
            "blue_carbon": "Mangrove, seagrass and saltmarsh carbon",
        },
        "stage_distribution": {"seed": 0.25, "early": 0.38, "growth": 0.25, "late": 0.12},
        "typical_deal_size_usd_m": {"seed": 2.5, "early": 10.0, "growth": 38.0, "late": 120.0},
        "eu_taxonomy_eligible": True,
        "sfdr_pai_relevant": ["pai_7", "pai_8", "pai_9", "pai_10", "pai_11"],
    },
    "circular_economy": {
        "description": "Waste reduction, recycling and circular business models",
        "sub_sectors": ["battery_recycling", "plastics_recycling", "waste_to_energy",
                        "industrial_symbiosis", "product_as_service", "textile_recycling"],
        "key_technologies": {
            "battery_recycling": "Li-ion battery hydrometallurgical and mechanical recycling",
            "plastics_recycling": "Chemical and advanced mechanical plastics recycling",
            "waste_to_energy": "Anaerobic digestion, pyrolysis and gasification",
            "industrial_symbiosis": "Industrial waste exchange and co-processing",
            "product_as_service": "Leasing and servitisation business models",
            "textile_recycling": "Fibre-to-fibre textile chemical recycling",
        },
        "stage_distribution": {"seed": 0.16, "early": 0.28, "growth": 0.36, "late": 0.20},
        "typical_deal_size_usd_m": {"seed": 3.0, "early": 14.0, "growth": 62.0, "late": 190.0},
        "eu_taxonomy_eligible": True,
        "sfdr_pai_relevant": ["pai_2", "pai_11"],
    },
    "water": {
        "description": "Water security, quality and efficiency technologies",
        "sub_sectors": ["desalination", "water_recycling", "smart_water_networks",
                        "water_quality", "irrigation_efficiency", "stormwater_management"],
        "key_technologies": {
            "desalination": "Reverse osmosis and forward osmosis desalination",
            "water_recycling": "Wastewater treatment and reuse",
            "smart_water_networks": "Leak detection, pressure management IoT",
            "water_quality": "Advanced filtration and monitoring",
            "irrigation_efficiency": "Precision irrigation and soil moisture",
            "stormwater_management": "Green infrastructure and retention systems",
        },
        "stage_distribution": {"seed": 0.14, "early": 0.28, "growth": 0.38, "late": 0.20},
        "typical_deal_size_usd_m": {"seed": 3.0, "early": 13.0, "growth": 55.0, "late": 180.0},
        "eu_taxonomy_eligible": True,
        "sfdr_pai_relevant": ["pai_5", "pai_6"],
    },
}


# ---------------------------------------------------------------------------
# Reference Data — IEA Clean Energy Investment (2024)
# 20 technology categories: capacity, annual investment, NZE 2030 target,
# deployment gap %, cost trajectory 2020-2050 (USD/kW or $/kWh or $/kg)
# ---------------------------------------------------------------------------

IEA_TECHNOLOGIES: dict[str, dict] = {
    "solar_pv_utility": {
        "display_name": "Solar PV (Utility-Scale)",
        "ctvc_sector": "energy",
        "current_capacity_gw": 1800.0,
        "annual_investment_2024_usd_bn": 290.0,
        "iea_nze_2030_gw": 5500.0,
        "deployment_gap_pct": 67.3,
        "cost_trajectory": {2020: 820, 2024: 380, 2030: 200, 2040: 110, 2050: 65},
        "cost_unit": "USD/kW",
        "abatement_potential_gtco2_2030": 2.8,
        "abatement_potential_gtco2_2050": 6.5,
        "mac_usd_per_tco2": -15,
        "trl": 9,
        "deployment_stage": "commercial",
    },
    "solar_pv_rooftop": {
        "display_name": "Solar PV (Rooftop/Distributed)",
        "ctvc_sector": "energy",
        "current_capacity_gw": 700.0,
        "annual_investment_2024_usd_bn": 120.0,
        "iea_nze_2030_gw": 2200.0,
        "deployment_gap_pct": 68.2,
        "cost_trajectory": {2020: 1200, 2024: 620, 2030: 340, 2040: 200, 2050: 130},
        "cost_unit": "USD/kW",
        "abatement_potential_gtco2_2030": 1.4,
        "abatement_potential_gtco2_2050": 3.2,
        "mac_usd_per_tco2": -5,
        "trl": 9,
        "deployment_stage": "commercial",
    },
    "onshore_wind": {
        "display_name": "Onshore Wind",
        "ctvc_sector": "energy",
        "current_capacity_gw": 1100.0,
        "annual_investment_2024_usd_bn": 130.0,
        "iea_nze_2030_gw": 3100.0,
        "deployment_gap_pct": 64.5,
        "cost_trajectory": {2020: 1350, 2024: 1050, 2030: 820, 2040: 650, 2050: 520},
        "cost_unit": "USD/kW",
        "abatement_potential_gtco2_2030": 1.8,
        "abatement_potential_gtco2_2050": 4.0,
        "mac_usd_per_tco2": -10,
        "trl": 9,
        "deployment_stage": "commercial",
    },
    "offshore_wind": {
        "display_name": "Offshore Wind",
        "ctvc_sector": "energy",
        "current_capacity_gw": 75.0,
        "annual_investment_2024_usd_bn": 60.0,
        "iea_nze_2030_gw": 380.0,
        "deployment_gap_pct": 80.3,
        "cost_trajectory": {2020: 4800, 2024: 3800, 2030: 2500, 2040: 1800, 2050: 1200},
        "cost_unit": "USD/kW",
        "abatement_potential_gtco2_2030": 0.9,
        "abatement_potential_gtco2_2050": 3.5,
        "mac_usd_per_tco2": 20,
        "trl": 9,
        "deployment_stage": "commercial",
    },
    "battery_storage_liion": {
        "display_name": "Battery Storage (Li-ion)",
        "ctvc_sector": "energy",
        "current_capacity_gwh": 800.0,
        "annual_investment_2024_usd_bn": 85.0,
        "iea_nze_2030_gwh": 3500.0,
        "deployment_gap_pct": 77.1,
        "cost_trajectory": {2020: 280, 2024: 130, 2030: 75, 2040: 45, 2050: 30},
        "cost_unit": "USD/kWh",
        "abatement_potential_gtco2_2030": 0.6,
        "abatement_potential_gtco2_2050": 2.0,
        "mac_usd_per_tco2": 15,
        "trl": 9,
        "deployment_stage": "commercial",
    },
    "battery_storage_flow": {
        "display_name": "Battery Storage (Flow/LDES)",
        "ctvc_sector": "energy",
        "current_capacity_gwh": 5.0,
        "annual_investment_2024_usd_bn": 3.0,
        "iea_nze_2030_gwh": 150.0,
        "deployment_gap_pct": 96.7,
        "cost_trajectory": {2020: 700, 2024: 450, 2030: 250, 2040: 130, 2050: 70},
        "cost_unit": "USD/kWh",
        "abatement_potential_gtco2_2030": 0.2,
        "abatement_potential_gtco2_2050": 1.0,
        "mac_usd_per_tco2": 40,
        "trl": 7,
        "deployment_stage": "demonstration",
    },
    "green_hydrogen": {
        "display_name": "Green Hydrogen (Electrolysis)",
        "ctvc_sector": "energy",
        "current_capacity_mtpa": 0.2,
        "annual_investment_2024_usd_bn": 8.0,
        "iea_nze_2030_mtpa": 30.0,
        "deployment_gap_pct": 99.3,
        "cost_trajectory": {2020: 6.0, 2024: 4.5, 2030: 2.5, 2040: 1.8, 2050: 1.2},
        "cost_unit": "USD/kg_H2",
        "abatement_potential_gtco2_2030": 0.4,
        "abatement_potential_gtco2_2050": 3.8,
        "mac_usd_per_tco2": 120,
        "trl": 8,
        "deployment_stage": "demonstration",
    },
    "blue_hydrogen": {
        "display_name": "Blue Hydrogen (SMR+CCS)",
        "ctvc_sector": "industry",
        "current_capacity_mtpa": 0.4,
        "annual_investment_2024_usd_bn": 4.0,
        "iea_nze_2030_mtpa": 20.0,
        "deployment_gap_pct": 98.0,
        "cost_trajectory": {2020: 1.8, 2024: 1.5, 2030: 1.2, 2040: 1.0, 2050: 0.9},
        "cost_unit": "USD/kg_H2",
        "abatement_potential_gtco2_2030": 0.3,
        "abatement_potential_gtco2_2050": 1.5,
        "mac_usd_per_tco2": 60,
        "trl": 8,
        "deployment_stage": "demonstration",
    },
    "ccs_ccus": {
        "display_name": "CCS/CCUS (Industrial)",
        "ctvc_sector": "industry",
        "current_capacity_mtpa_co2": 45.0,
        "annual_investment_2024_usd_bn": 5.0,
        "iea_nze_2030_mtpa_co2": 1200.0,
        "deployment_gap_pct": 96.3,
        "cost_trajectory": {2020: 120, 2024: 95, 2030: 70, 2040: 50, 2050: 35},
        "cost_unit": "USD/tCO2",
        "abatement_potential_gtco2_2030": 0.7,
        "abatement_potential_gtco2_2050": 5.8,
        "mac_usd_per_tco2": 95,
        "trl": 8,
        "deployment_stage": "demonstration",
    },
    "direct_air_capture": {
        "display_name": "Direct Air Capture (DAC)",
        "ctvc_sector": "carbon_removal",
        "current_capacity_ktpa_co2": 0.01,
        "annual_investment_2024_usd_bn": 1.0,
        "iea_nze_2030_mtpa_co2": 90.0,
        "deployment_gap_pct": 99.99,
        "cost_trajectory": {2020: 1000, 2024: 600, 2030: 300, 2040: 150, 2050: 80},
        "cost_unit": "USD/tCO2",
        "abatement_potential_gtco2_2030": 0.1,
        "abatement_potential_gtco2_2050": 1.0,
        "mac_usd_per_tco2": 600,
        "trl": 7,
        "deployment_stage": "demonstration",
    },
    "beccs": {
        "display_name": "BECCS (Bioenergy + CCS)",
        "ctvc_sector": "carbon_removal",
        "current_capacity_mtpa_co2": 2.0,
        "annual_investment_2024_usd_bn": 1.5,
        "iea_nze_2030_mtpa_co2": 225.0,
        "deployment_gap_pct": 99.1,
        "cost_trajectory": {2020: 180, 2024: 150, 2030: 110, 2040: 80, 2050: 60},
        "cost_unit": "USD/tCO2",
        "abatement_potential_gtco2_2030": 0.5,
        "abatement_potential_gtco2_2050": 2.5,
        "mac_usd_per_tco2": 150,
        "trl": 7,
        "deployment_stage": "demonstration",
    },
    "nuclear_smr": {
        "display_name": "Nuclear SMR (<300 MWe)",
        "ctvc_sector": "energy",
        "current_capacity_gw": 0.0,
        "annual_investment_2024_usd_bn": 2.5,
        "iea_nze_2030_gw": 8.0,
        "deployment_gap_pct": 100.0,
        "cost_trajectory": {2020: 12000, 2024: 9000, 2030: 5000, 2040: 3500, 2050: 2500},
        "cost_unit": "USD/kW",
        "abatement_potential_gtco2_2030": 0.1,
        "abatement_potential_gtco2_2050": 1.2,
        "mac_usd_per_tco2": 80,
        "trl": 6,
        "deployment_stage": "pilot",
    },
    "nuclear_large_scale": {
        "display_name": "Nuclear (Large-Scale, >1 GWe)",
        "ctvc_sector": "energy",
        "current_capacity_gw": 417.0,
        "annual_investment_2024_usd_bn": 28.0,
        "iea_nze_2030_gw": 600.0,
        "deployment_gap_pct": 30.5,
        "cost_trajectory": {2020: 8000, 2024: 7500, 2030: 7000, 2040: 6500, 2050: 6000},
        "cost_unit": "USD/kW",
        "abatement_potential_gtco2_2030": 0.5,
        "abatement_potential_gtco2_2050": 2.0,
        "mac_usd_per_tco2": 70,
        "trl": 9,
        "deployment_stage": "commercial",
    },
    "ev_passenger": {
        "display_name": "Electric Vehicles (Passenger)",
        "ctvc_sector": "transportation",
        "current_units_m": 40.0,
        "annual_investment_2024_usd_bn": 180.0,
        "iea_nze_2030_units_m": 240.0,
        "deployment_gap_pct": 83.3,
        "cost_trajectory": {2020: 38000, 2024: 28000, 2030: 20000, 2040: 16000, 2050: 13000},
        "cost_unit": "USD/vehicle",
        "abatement_potential_gtco2_2030": 1.4,
        "abatement_potential_gtco2_2050": 4.5,
        "mac_usd_per_tco2": 5,
        "trl": 9,
        "deployment_stage": "commercial",
    },
    "ev_commercial": {
        "display_name": "Electric Vehicles (Commercial/Trucks)",
        "ctvc_sector": "transportation",
        "current_units_m": 0.8,
        "annual_investment_2024_usd_bn": 35.0,
        "iea_nze_2030_units_m": 12.0,
        "deployment_gap_pct": 93.3,
        "cost_trajectory": {2020: 400000, 2024: 280000, 2030: 180000, 2040: 130000, 2050: 100000},
        "cost_unit": "USD/vehicle",
        "abatement_potential_gtco2_2030": 0.5,
        "abatement_potential_gtco2_2050": 2.5,
        "mac_usd_per_tco2": 25,
        "trl": 8,
        "deployment_stage": "demonstration",
    },
    "heat_pumps": {
        "display_name": "Heat Pumps (Buildings)",
        "ctvc_sector": "buildings",
        "current_units_m": 220.0,
        "annual_investment_2024_usd_bn": 85.0,
        "iea_nze_2030_units_m": 600.0,
        "deployment_gap_pct": 63.3,
        "cost_trajectory": {2020: 2500, 2024: 1800, 2030: 1200, 2040: 800, 2050: 550},
        "cost_unit": "USD/unit",
        "abatement_potential_gtco2_2030": 0.8,
        "abatement_potential_gtco2_2050": 2.2,
        "mac_usd_per_tco2": -20,
        "trl": 9,
        "deployment_stage": "commercial",
    },
    "sustainable_aviation_fuel": {
        "display_name": "Sustainable Aviation Fuel (SAF)",
        "ctvc_sector": "transportation",
        "current_share_pct": 0.1,
        "annual_investment_2024_usd_bn": 3.0,
        "iea_nze_2030_share_pct": 5.0,
        "deployment_gap_pct": 98.0,
        "cost_trajectory": {2020: 3.5, 2024: 2.8, 2030: 2.0, 2040: 1.5, 2050: 1.1},
        "cost_unit": "USD/litre",
        "abatement_potential_gtco2_2030": 0.1,
        "abatement_potential_gtco2_2050": 0.6,
        "mac_usd_per_tco2": 300,
        "trl": 8,
        "deployment_stage": "demonstration",
    },
    "steel_dri_h2": {
        "display_name": "Green Steel (DRI-H2)",
        "ctvc_sector": "industry",
        "current_capacity_mtpa": 2.0,
        "annual_investment_2024_usd_bn": 4.5,
        "iea_nze_2030_mtpa": 70.0,
        "deployment_gap_pct": 97.1,
        "cost_trajectory": {2020: 820, 2024: 700, 2030: 520, 2040: 380, 2050: 280},
        "cost_unit": "USD/tonne_steel",
        "abatement_potential_gtco2_2030": 0.3,
        "abatement_potential_gtco2_2050": 1.8,
        "mac_usd_per_tco2": 80,
        "trl": 7,
        "deployment_stage": "demonstration",
    },
    "cement_ccus": {
        "display_name": "Low-Carbon Cement (CCUS/Oxyfuel)",
        "ctvc_sector": "industry",
        "current_capacity_mtpa": 0.5,
        "annual_investment_2024_usd_bn": 1.5,
        "iea_nze_2030_mtpa": 60.0,
        "deployment_gap_pct": 99.2,
        "cost_trajectory": {2020: 160, 2024: 130, 2030: 95, 2040: 70, 2050: 55},
        "cost_unit": "USD/tonne_cement",
        "abatement_potential_gtco2_2030": 0.2,
        "abatement_potential_gtco2_2050": 1.4,
        "mac_usd_per_tco2": 90,
        "trl": 6,
        "deployment_stage": "pilot",
    },
    "long_duration_storage": {
        "display_name": "Long-Duration Energy Storage (LDES)",
        "ctvc_sector": "energy",
        "current_capacity_gwh": 2.0,
        "annual_investment_2024_usd_bn": 2.0,
        "iea_nze_2030_gwh": 120.0,
        "deployment_gap_pct": 98.3,
        "cost_trajectory": {2020: 1000, 2024: 500, 2030: 200, 2040: 100, 2050: 60},
        "cost_unit": "USD/kWh",
        "abatement_potential_gtco2_2030": 0.15,
        "abatement_potential_gtco2_2050": 0.8,
        "mac_usd_per_tco2": 50,
        "trl": 6,
        "deployment_stage": "pilot",
    },
    "smart_grid": {
        "display_name": "Smart Grid & Digitalisation",
        "ctvc_sector": "energy",
        "current_investment_usd_bn": 40.0,
        "annual_investment_2024_usd_bn": 55.0,
        "iea_nze_2030_investment_usd_bn": 180.0,
        "deployment_gap_pct": 69.4,
        "cost_trajectory": {2020: 100, 2024: 80, 2030: 60, 2040: 45, 2050: 35},
        "cost_unit": "USD/MWh_enabled",
        "abatement_potential_gtco2_2030": 0.5,
        "abatement_potential_gtco2_2050": 1.5,
        "mac_usd_per_tco2": -5,
        "trl": 9,
        "deployment_stage": "commercial",
    },
}


# ---------------------------------------------------------------------------
# Reference Data — BloombergNEF Learning Curves
# Historical cost data 2010-2024 + projections to 2050
# ---------------------------------------------------------------------------

BNEF_LEARNING_CURVES: dict[str, dict] = {
    "solar_pv_utility": {
        "display_name": "Solar PV (Utility Module Cost)",
        "unit": "USD/W",
        "learning_rate_pct": 23.5,  # % cost reduction per doubling of cumulative capacity
        "historical": {
            2010: 1.80, 2012: 0.95, 2014: 0.65, 2016: 0.45, 2018: 0.30,
            2020: 0.22, 2022: 0.28, 2023: 0.18, 2024: 0.15,
        },
        "projections": {2025: 0.13, 2027: 0.11, 2030: 0.09, 2035: 0.07, 2040: 0.06, 2050: 0.05},
        "cost_levers": ["silicon_purification", "cell_efficiency", "manufacturing_scale",
                        "bos_reduction", "labour_automation"],
        "cumulative_capacity_gw_2024": 2500.0,
        "learning_exponent": -0.358,
    },
    "liion_battery": {
        "display_name": "Li-ion Battery Pack Cost",
        "unit": "USD/kWh",
        "learning_rate_pct": 18.0,
        "historical": {
            2010: 1200, 2012: 850, 2014: 600, 2016: 380, 2018: 220,
            2020: 145, 2022: 152, 2023: 140, 2024: 115,
        },
        "projections": {2025: 95, 2027: 80, 2030: 65, 2035: 50, 2040: 40, 2050: 30},
        "cost_levers": ["cathode_materials", "cell_format", "gigafactory_scale",
                        "supply_chain", "bms_optimisation"],
        "cumulative_capacity_gwh_2024": 2000.0,
        "learning_exponent": -0.263,
    },
    "green_hydrogen": {
        "display_name": "Green Hydrogen (PEM Electrolyser + RE)",
        "unit": "USD/kg_H2",
        "learning_rate_pct": 15.0,
        "historical": {
            2010: 10.0, 2012: 8.5, 2014: 7.5, 2016: 7.0, 2018: 6.5,
            2020: 5.8, 2022: 4.8, 2023: 4.5, 2024: 4.2,
        },
        "projections": {2025: 3.8, 2027: 3.2, 2030: 2.5, 2035: 2.0, 2040: 1.7, 2050: 1.3},
        "cost_levers": ["electrolyser_capex", "renewable_electricity_cost",
                        "stack_efficiency", "water_treatment", "compression_storage"],
        "cumulative_capacity_gw_2024": 1.2,
        "learning_exponent": -0.234,
    },
    "offshore_wind": {
        "display_name": "Offshore Wind (LCOE)",
        "unit": "USD/MWh",
        "learning_rate_pct": 11.0,
        "historical": {
            2010: 180, 2012: 165, 2014: 150, 2016: 130, 2018: 105,
            2020: 84, 2022: 90, 2023: 92, 2024: 86,
        },
        "projections": {2025: 78, 2027: 68, 2030: 55, 2035: 45, 2040: 38, 2050: 30},
        "cost_levers": ["turbine_size", "installation_vessel", "foundation_design",
                        "supply_chain", "floating_technology"],
        "cumulative_capacity_gw_2024": 75.0,
        "learning_exponent": -0.167,
    },
    "direct_air_capture": {
        "display_name": "Direct Air Capture",
        "unit": "USD/tCO2",
        "learning_rate_pct": 12.0,
        "historical": {
            2010: 2000, 2012: 1800, 2014: 1600, 2016: 1400, 2018: 1200,
            2020: 1000, 2022: 800, 2023: 700, 2024: 600,
        },
        "projections": {2025: 520, 2027: 430, 2030: 300, 2035: 200, 2040: 140, 2050: 80},
        "cost_levers": ["sorbent_cost", "heat_integration", "modular_manufacturing",
                        "renewable_heat", "scale"],
        "cumulative_capacity_ktpa_2024": 0.01,
        "learning_exponent": -0.193,
    },
    "onshore_wind": {
        "display_name": "Onshore Wind (LCOE)",
        "unit": "USD/MWh",
        "learning_rate_pct": 9.0,
        "historical": {
            2010: 95, 2012: 85, 2014: 72, 2016: 60, 2018: 50,
            2020: 41, 2022: 46, 2023: 44, 2024: 40,
        },
        "projections": {2025: 37, 2027: 33, 2030: 28, 2035: 23, 2040: 20, 2050: 17},
        "cost_levers": ["turbine_capacity_factor", "hub_height", "rotor_diameter",
                        "logistics", "grid_connection"],
        "cumulative_capacity_gw_2024": 1100.0,
        "learning_exponent": -0.137,
    },
    "ev_battery_pack": {
        "display_name": "EV Battery Pack",
        "unit": "USD/kWh",
        "learning_rate_pct": 21.0,
        "historical": {
            2010: 1100, 2012: 800, 2014: 550, 2016: 380, 2018: 250,
            2020: 155, 2022: 160, 2023: 145, 2024: 120,
        },
        "projections": {2025: 100, 2027: 82, 2030: 65, 2035: 50, 2040: 40, 2050: 32},
        "cost_levers": ["cathode_chemistry", "cell_to_pack", "gigafactory_utilisation",
                        "material_cost", "recycling"],
        "cumulative_capacity_gwh_2024": 1800.0,
        "learning_exponent": -0.321,
    },
    "heat_pumps": {
        "display_name": "Heat Pump (Air Source)",
        "unit": "USD/unit",
        "learning_rate_pct": 8.0,
        "historical": {
            2010: 3500, 2012: 3200, 2014: 2900, 2016: 2700, 2018: 2500,
            2020: 2200, 2022: 2000, 2023: 1850, 2024: 1700,
        },
        "projections": {2025: 1580, 2027: 1420, 2030: 1200, 2035: 1000, 2040: 850, 2050: 700},
        "cost_levers": ["refrigerant_technology", "heat_exchanger", "compressor_efficiency",
                        "manufacturing_volume", "installation"],
        "cumulative_units_m_2024": 180.0,
        "learning_exponent": -0.122,
    },
    "sustainable_aviation_fuel": {
        "display_name": "Sustainable Aviation Fuel (HEFA/PtL)",
        "unit": "USD/litre",
        "learning_rate_pct": 10.0,
        "historical": {
            2010: 4.5, 2012: 4.2, 2014: 4.0, 2016: 3.8, 2018: 3.5,
            2020: 3.2, 2022: 3.0, 2023: 2.9, 2024: 2.7,
        },
        "projections": {2025: 2.5, 2027: 2.2, 2030: 1.9, 2035: 1.6, 2040: 1.4, 2050: 1.1},
        "cost_levers": ["feedstock_cost", "process_efficiency", "co_processing",
                        "policy_incentives", "scale"],
        "cumulative_production_bn_litres_2024": 0.6,
        "learning_exponent": -0.152,
    },
    "electrolyser_capex": {
        "display_name": "PEM Electrolyser CAPEX",
        "unit": "USD/kW",
        "learning_rate_pct": 14.0,
        "historical": {
            2010: 2000, 2012: 1700, 2014: 1500, 2016: 1200, 2018: 1000,
            2020: 800, 2022: 650, 2023: 600, 2024: 550,
        },
        "projections": {2025: 490, 2027: 420, 2030: 320, 2035: 220, 2040: 170, 2050: 120},
        "cost_levers": ["membrane_durability", "bipolar_plate", "stack_size",
                        "manufacturing_automation", "supply_chain"],
        "cumulative_capacity_gw_2024": 2.0,
        "learning_exponent": -0.213,
    },
}


# ---------------------------------------------------------------------------
# Reference Data — VC/PE Climate Tech Deal Data (2024)
# 11 CTVC sectors × 4 funding stages
# ---------------------------------------------------------------------------

VC_PE_DEAL_DATA: dict[str, dict] = {
    "energy": {
        "total_capital_2024_usd_bn": 42.0,
        "deal_count_2024": 380,
        "stages": {
            "seed":   {"deal_count": 85,  "median_deal_usd_m": 3.5,  "total_usd_bn": 0.8,  "ev_revenue_multiple": None,  "ev_ebitda_multiple": None},
            "early":  {"deal_count": 120, "median_deal_usd_m": 18.0, "total_usd_bn": 5.5,  "ev_revenue_multiple": 8.5,   "ev_ebitda_multiple": None},
            "growth": {"deal_count": 110, "median_deal_usd_m": 95.0, "total_usd_bn": 18.0, "ev_revenue_multiple": 12.0,  "ev_ebitda_multiple": 22.0},
            "late":   {"deal_count": 65,  "median_deal_usd_m": 320.0,"total_usd_bn": 17.7, "ev_revenue_multiple": 8.0,   "ev_ebitda_multiple": 15.0},
        },
        "top_geographies": ["USA", "China", "Germany", "UK", "India"],
        "yoy_growth_pct": 18.0,
    },
    "transportation": {
        "total_capital_2024_usd_bn": 35.0,
        "deal_count_2024": 290,
        "stages": {
            "seed":   {"deal_count": 50,  "median_deal_usd_m": 4.0,  "total_usd_bn": 0.5,  "ev_revenue_multiple": None,  "ev_ebitda_multiple": None},
            "early":  {"deal_count": 85,  "median_deal_usd_m": 22.0, "total_usd_bn": 3.5,  "ev_revenue_multiple": 7.0,   "ev_ebitda_multiple": None},
            "growth": {"deal_count": 95,  "median_deal_usd_m": 110.0,"total_usd_bn": 15.5, "ev_revenue_multiple": 10.5,  "ev_ebitda_multiple": 20.0},
            "late":   {"deal_count": 60,  "median_deal_usd_m": 380.0,"total_usd_bn": 15.5, "ev_revenue_multiple": 7.5,   "ev_ebitda_multiple": 14.0},
        },
        "top_geographies": ["USA", "China", "Germany", "South Korea", "UK"],
        "yoy_growth_pct": 12.0,
    },
    "buildings": {
        "total_capital_2024_usd_bn": 12.0,
        "deal_count_2024": 180,
        "stages": {
            "seed":   {"deal_count": 45,  "median_deal_usd_m": 2.5,  "total_usd_bn": 0.3,  "ev_revenue_multiple": None,  "ev_ebitda_multiple": None},
            "early":  {"deal_count": 65,  "median_deal_usd_m": 12.0, "total_usd_bn": 1.8,  "ev_revenue_multiple": 6.0,   "ev_ebitda_multiple": None},
            "growth": {"deal_count": 50,  "median_deal_usd_m": 60.0, "total_usd_bn": 5.2,  "ev_revenue_multiple": 9.0,   "ev_ebitda_multiple": 17.0},
            "late":   {"deal_count": 20,  "median_deal_usd_m": 200.0,"total_usd_bn": 4.7,  "ev_revenue_multiple": 6.5,   "ev_ebitda_multiple": 13.0},
        },
        "top_geographies": ["USA", "Germany", "UK", "France", "Netherlands"],
        "yoy_growth_pct": 22.0,
    },
    "industry": {
        "total_capital_2024_usd_bn": 18.0,
        "deal_count_2024": 150,
        "stages": {
            "seed":   {"deal_count": 25,  "median_deal_usd_m": 5.0,  "total_usd_bn": 0.3,  "ev_revenue_multiple": None,  "ev_ebitda_multiple": None},
            "early":  {"deal_count": 40,  "median_deal_usd_m": 30.0, "total_usd_bn": 2.0,  "ev_revenue_multiple": 9.0,   "ev_ebitda_multiple": None},
            "growth": {"deal_count": 55,  "median_deal_usd_m": 150.0,"total_usd_bn": 9.0,  "ev_revenue_multiple": 14.0,  "ev_ebitda_multiple": 25.0},
            "late":   {"deal_count": 30,  "median_deal_usd_m": 500.0,"total_usd_bn": 6.7,  "ev_revenue_multiple": 9.5,   "ev_ebitda_multiple": 18.0},
        },
        "top_geographies": ["Germany", "USA", "Sweden", "UK", "Japan"],
        "yoy_growth_pct": 35.0,
    },
    "food_land_use": {
        "total_capital_2024_usd_bn": 14.0,
        "deal_count_2024": 220,
        "stages": {
            "seed":   {"deal_count": 65,  "median_deal_usd_m": 3.0,  "total_usd_bn": 0.5,  "ev_revenue_multiple": None,  "ev_ebitda_multiple": None},
            "early":  {"deal_count": 80,  "median_deal_usd_m": 14.0, "total_usd_bn": 2.5,  "ev_revenue_multiple": 7.5,   "ev_ebitda_multiple": None},
            "growth": {"deal_count": 55,  "median_deal_usd_m": 55.0, "total_usd_bn": 6.0,  "ev_revenue_multiple": 10.0,  "ev_ebitda_multiple": 19.0},
            "late":   {"deal_count": 20,  "median_deal_usd_m": 175.0,"total_usd_bn": 5.0,  "ev_revenue_multiple": 7.0,   "ev_ebitda_multiple": 14.0},
        },
        "top_geographies": ["USA", "Netherlands", "Israel", "UK", "Singapore"],
        "yoy_growth_pct": 8.0,
    },
    "carbon_removal": {
        "total_capital_2024_usd_bn": 5.5,
        "deal_count_2024": 95,
        "stages": {
            "seed":   {"deal_count": 30,  "median_deal_usd_m": 4.0,  "total_usd_bn": 0.3,  "ev_revenue_multiple": None,  "ev_ebitda_multiple": None},
            "early":  {"deal_count": 35,  "median_deal_usd_m": 20.0, "total_usd_bn": 1.2,  "ev_revenue_multiple": 15.0,  "ev_ebitda_multiple": None},
            "growth": {"deal_count": 22,  "median_deal_usd_m": 80.0, "total_usd_bn": 2.5,  "ev_revenue_multiple": 20.0,  "ev_ebitda_multiple": 35.0},
            "late":   {"deal_count": 8,   "median_deal_usd_m": 250.0,"total_usd_bn": 1.5,  "ev_revenue_multiple": 12.0,  "ev_ebitda_multiple": 22.0},
        },
        "top_geographies": ["USA", "Canada", "Iceland", "Switzerland", "UK"],
        "yoy_growth_pct": 65.0,
    },
    "climate_finance": {
        "total_capital_2024_usd_bn": 8.0,
        "deal_count_2024": 160,
        "stages": {
            "seed":   {"deal_count": 50,  "median_deal_usd_m": 2.0,  "total_usd_bn": 0.2,  "ev_revenue_multiple": None,  "ev_ebitda_multiple": None},
            "early":  {"deal_count": 60,  "median_deal_usd_m": 10.0, "total_usd_bn": 1.3,  "ev_revenue_multiple": 12.0,  "ev_ebitda_multiple": None},
            "growth": {"deal_count": 38,  "median_deal_usd_m": 45.0, "total_usd_bn": 3.5,  "ev_revenue_multiple": 18.0,  "ev_ebitda_multiple": 28.0},
            "late":   {"deal_count": 12,  "median_deal_usd_m": 150.0,"total_usd_bn": 3.0,  "ev_revenue_multiple": 12.0,  "ev_ebitda_multiple": 20.0},
        },
        "top_geographies": ["USA", "UK", "Singapore", "Luxembourg", "Germany"],
        "yoy_growth_pct": 42.0,
    },
    "climate_adaptation": {
        "total_capital_2024_usd_bn": 7.0,
        "deal_count_2024": 110,
        "stages": {
            "seed":   {"deal_count": 28,  "median_deal_usd_m": 3.0,  "total_usd_bn": 0.2,  "ev_revenue_multiple": None,  "ev_ebitda_multiple": None},
            "early":  {"deal_count": 38,  "median_deal_usd_m": 15.0, "total_usd_bn": 1.0,  "ev_revenue_multiple": 8.0,   "ev_ebitda_multiple": None},
            "growth": {"deal_count": 32,  "median_deal_usd_m": 65.0, "total_usd_bn": 3.5,  "ev_revenue_multiple": 11.0,  "ev_ebitda_multiple": 20.0},
            "late":   {"deal_count": 12,  "median_deal_usd_m": 220.0,"total_usd_bn": 2.3,  "ev_revenue_multiple": 8.5,   "ev_ebitda_multiple": 16.0},
        },
        "top_geographies": ["USA", "Netherlands", "Germany", "Australia", "UK"],
        "yoy_growth_pct": 28.0,
    },
    "biodiversity": {
        "total_capital_2024_usd_bn": 3.5,
        "deal_count_2024": 70,
        "stages": {
            "seed":   {"deal_count": 25,  "median_deal_usd_m": 2.5,  "total_usd_bn": 0.15, "ev_revenue_multiple": None,  "ev_ebitda_multiple": None},
            "early":  {"deal_count": 28,  "median_deal_usd_m": 10.0, "total_usd_bn": 0.5,  "ev_revenue_multiple": 12.0,  "ev_ebitda_multiple": None},
            "growth": {"deal_count": 13,  "median_deal_usd_m": 38.0, "total_usd_bn": 1.5,  "ev_revenue_multiple": 16.0,  "ev_ebitda_multiple": 28.0},
            "late":   {"deal_count": 4,   "median_deal_usd_m": 120.0,"total_usd_bn": 1.35, "ev_revenue_multiple": 10.0,  "ev_ebitda_multiple": 19.0},
        },
        "top_geographies": ["UK", "USA", "Australia", "Netherlands", "Canada"],
        "yoy_growth_pct": 75.0,
    },
    "circular_economy": {
        "total_capital_2024_usd_bn": 10.0,
        "deal_count_2024": 140,
        "stages": {
            "seed":   {"deal_count": 32,  "median_deal_usd_m": 3.0,  "total_usd_bn": 0.25, "ev_revenue_multiple": None,  "ev_ebitda_multiple": None},
            "early":  {"deal_count": 48,  "median_deal_usd_m": 14.0, "total_usd_bn": 1.5,  "ev_revenue_multiple": 7.0,   "ev_ebitda_multiple": None},
            "growth": {"deal_count": 42,  "median_deal_usd_m": 62.0, "total_usd_bn": 4.5,  "ev_revenue_multiple": 10.0,  "ev_ebitda_multiple": 18.0},
            "late":   {"deal_count": 18,  "median_deal_usd_m": 190.0,"total_usd_bn": 3.75, "ev_revenue_multiple": 7.5,   "ev_ebitda_multiple": 14.0},
        },
        "top_geographies": ["Germany", "USA", "France", "UK", "Sweden"],
        "yoy_growth_pct": 18.0,
    },
    "water": {
        "total_capital_2024_usd_bn": 6.0,
        "deal_count_2024": 95,
        "stages": {
            "seed":   {"deal_count": 22,  "median_deal_usd_m": 3.0,  "total_usd_bn": 0.15, "ev_revenue_multiple": None,  "ev_ebitda_multiple": None},
            "early":  {"deal_count": 32,  "median_deal_usd_m": 13.0, "total_usd_bn": 0.8,  "ev_revenue_multiple": 6.5,   "ev_ebitda_multiple": None},
            "growth": {"deal_count": 30,  "median_deal_usd_m": 55.0, "total_usd_bn": 2.8,  "ev_revenue_multiple": 9.0,   "ev_ebitda_multiple": 17.0},
            "late":   {"deal_count": 11,  "median_deal_usd_m": 180.0,"total_usd_bn": 2.25, "ev_revenue_multiple": 7.0,   "ev_ebitda_multiple": 13.0},
        },
        "top_geographies": ["Israel", "USA", "Singapore", "Australia", "Germany"],
        "yoy_growth_pct": 14.0,
    },
}


# ---------------------------------------------------------------------------
# Reference Data — Patent Intensity Index
# 20 technologies × 5 jurisdictions: annual patent applications + growth rate
# ---------------------------------------------------------------------------

PATENT_INTENSITY: dict[str, dict] = {
    "solar_pv_utility":     {"USA": {"apps": 3800, "yoy_pct": 8,  "leaders": ["First Solar", "SunPower", "NREL"]},        "EU": {"apps": 2200, "yoy_pct": 10, "leaders": ["Fraunhofer ISE", "imec", "EPFL"]},              "China": {"apps": 12000, "yoy_pct": 22, "leaders": ["LONGi", "JA Solar", "CATL"]},           "Japan": {"apps": 1800, "yoy_pct": 4,  "leaders": ["Sharp", "Panasonic", "Kyocera"]},         "Korea": {"apps": 1200, "yoy_pct": 6,  "leaders": ["Hanwha Q CELLS", "Samsung SDI"]}},
    "liion_battery":        {"USA": {"apps": 4500, "yoy_pct": 12, "leaders": ["Tesla", "A123", "QuantumScape"]},           "EU": {"apps": 2800, "yoy_pct": 15, "leaders": ["Northvolt", "BASF", "Umicore"]},               "China": {"apps": 18000, "yoy_pct": 28, "leaders": ["CATL", "BYD", "GANFENG"]},              "Japan": {"apps": 3500, "yoy_pct": 5,  "leaders": ["Panasonic", "TDK", "Murata"]},            "Korea": {"apps": 4000, "yoy_pct": 9,  "leaders": ["LG Energy", "Samsung SDI", "SK On"]}},
    "green_hydrogen":       {"USA": {"apps": 1200, "yoy_pct": 25, "leaders": ["ITM Power", "Bloom Energy", "Nel"]},        "EU": {"apps": 1800, "yoy_pct": 32, "leaders": ["Nel", "Siemens Energy", "McPhy"]},             "China": {"apps": 3500, "yoy_pct": 45, "leaders": ["Sinohydro", "PERIC", "Sungrow"]},         "Japan": {"apps": 900,  "yoy_pct": 18, "leaders": ["Asahi Kasei", "Honda", "Toyota"]},         "Korea": {"apps": 600,  "yoy_pct": 22, "leaders": ["Hyundai", "Doosan", "POSCO"]}},
    "offshore_wind":        {"USA": {"apps": 850,  "yoy_pct": 18, "leaders": ["GE Vernova", "Envision", "Vineyard Wind"]}, "EU": {"apps": 2400, "yoy_pct": 14, "leaders": ["Vestas", "Siemens Gamesa", "Ørsted"]},          "China": {"apps": 5500, "yoy_pct": 35, "leaders": ["Mingyang", "CSSC", "Goldwind"]},           "Japan": {"apps": 300,  "yoy_pct": 8,  "leaders": ["Mitsubishi", "Japan Wind", "MHPS"]},       "Korea": {"apps": 280,  "yoy_pct": 12, "leaders": ["Doosan", "LS Electric", "Unison"]}},
    "direct_air_capture":   {"USA": {"apps": 420,  "yoy_pct": 38, "leaders": ["Carbon Engineering", "Global Thermostat"]}, "EU": {"apps": 380,  "yoy_pct": 42, "leaders": ["Climeworks", "Carbon Collect", "Sustaera"]},    "China": {"apps": 200,  "yoy_pct": 55, "leaders": ["GEAPP China", "Tsinghua Univ"]},           "Japan": {"apps": 120,  "yoy_pct": 20, "leaders": ["Toshiba", "Kawasaki"]},                    "Korea": {"apps": 85,   "yoy_pct": 15, "leaders": ["KAIST", "Hyundai R&D"]}},
    "ev_passenger":         {"USA": {"apps": 5200, "yoy_pct": 15, "leaders": ["Tesla", "Ford", "GM"]},                     "EU": {"apps": 4800, "yoy_pct": 18, "leaders": ["VW", "BMW", "Stellantis"]},                    "China": {"apps": 22000, "yoy_pct": 32, "leaders": ["BYD", "SAIC", "NIO"]},                  "Japan": {"apps": 8500, "yoy_pct": 8,  "leaders": ["Toyota", "Honda", "Nissan"]},               "Korea": {"apps": 5500, "yoy_pct": 12, "leaders": ["Hyundai", "Kia", "Samsung"]},},
    "heat_pumps":           {"USA": {"apps": 1100, "yoy_pct": 12, "leaders": ["Carrier", "Trane", "York"]},                "EU": {"apps": 2200, "yoy_pct": 20, "leaders": ["Bosch", "Daikin", "Viessmann"]},                "China": {"apps": 6000, "yoy_pct": 28, "leaders": ["Midea", "Gree", "Haier"]},                 "Japan": {"apps": 2500, "yoy_pct": 6,  "leaders": ["Daikin", "Mitsubishi", "Panasonic"]},      "Korea": {"apps": 1800, "yoy_pct": 10, "leaders": ["LG", "Samsung", "Hyundai"]}},
    "ccs_ccus":             {"USA": {"apps": 1500, "yoy_pct": 20, "leaders": ["ExxonMobil", "Schlumberger", "Honeywell"]}, "EU": {"apps": 1100, "yoy_pct": 18, "leaders": ["Shell", "TotalEnergies", "Equinor"]},           "China": {"apps": 2800, "yoy_pct": 38, "leaders": ["Sinopec", "CNPC", "CNOOC"]},              "Japan": {"apps": 600,  "yoy_pct": 12, "leaders": ["Mitsubishi Heavy", "JGC", "Toshiba"]},    "Korea": {"apps": 400,  "yoy_pct": 10, "leaders": ["POSCO", "Korea CCS", "GS"]}},
    "nuclear_smr":          {"USA": {"apps": 680,  "yoy_pct": 28, "leaders": ["NuScale", "TerraPower", "X-energy"]},       "EU": {"apps": 520,  "yoy_pct": 22, "leaders": ["Rolls-Royce", "Newcleo", "Last Energy"]},       "China": {"apps": 1500, "yoy_pct": 42, "leaders": ["CGN", "CNNC", "SPIC"]},                   "Japan": {"apps": 320,  "yoy_pct": 15, "leaders": ["Mitsubishi", "Toshiba", "IHI"]},            "Korea": {"apps": 280,  "yoy_pct": 18, "leaders": ["KAERI", "KEPCO", "Doosan"]}},
    "sustainable_aviation_fuel": {"USA": {"apps": 580, "yoy_pct": 22, "leaders": ["LanzaJet", "World Energy", "Gevo"]},   "EU": {"apps": 720,  "yoy_pct": 28, "leaders": ["Neste", "TotalEnergies", "Repsol"]},            "China": {"apps": 1200, "yoy_pct": 45, "leaders": ["Sinopec", "COMAC", "CAAC"]},              "Japan": {"apps": 380,  "yoy_pct": 18, "leaders": ["IHI", "JGC", "All Nippon Airways"]},      "Korea": {"apps": 220,  "yoy_pct": 14, "leaders": ["SK Innovation", "GS Caltex"]}},
    "steel_dri_h2":         {"USA": {"apps": 320,  "yoy_pct": 32, "leaders": ["Nucor", "Cleveland-Cliffs", "USS"]},        "EU": {"apps": 580,  "yoy_pct": 38, "leaders": ["ArcelorMittal", "SSAB", "ThyssenKrupp"]},       "China": {"apps": 1800, "yoy_pct": 52, "leaders": ["Baosteel", "HBIS", "Shougang"]},           "Japan": {"apps": 420,  "yoy_pct": 22, "leaders": ["JFE", "Nippon Steel", "Kobe Steel"]},      "Korea": {"apps": 350,  "yoy_pct": 28, "leaders": ["POSCO", "Hyundai Steel"]}},
    "cement_ccus":          {"USA": {"apps": 280,  "yoy_pct": 25, "leaders": ["Calix", "CarbonCure", "SkyMine"]},          "EU": {"apps": 420,  "yoy_pct": 30, "leaders": ["HeidelbergMaterials", "Holcim", "Buzzi"]},      "China": {"apps": 1400, "yoy_pct": 48, "leaders": ["China National Building", "Sinoma"]},     "Japan": {"apps": 220,  "yoy_pct": 15, "leaders": ["Taiheiyo Cement", "Sumitomo Osaka"]},      "Korea": {"apps": 180,  "yoy_pct": 12, "leaders": ["Ssangyong Cement", "Asia Cement"]}},
    "battery_recycling":    {"USA": {"apps": 950,  "yoy_pct": 32, "leaders": ["Li-Cycle", "Redwood Materials", "Ascend"]}, "EU": {"apps": 1200, "yoy_pct": 38, "leaders": ["Umicore", "Veolia", "Retriev"]},                 "China": {"apps": 5500, "yoy_pct": 50, "leaders": ["GEM", "Ganfeng", "CATL"]},                 "Japan": {"apps": 680,  "yoy_pct": 18, "leaders": ["JX Nippon", "Toyota", "Honda"]},            "Korea": {"apps": 580,  "yoy_pct": 22, "leaders": ["LG Chem", "Samsung SDI", "SungEel"]}},
    "precision_agriculture": {"USA": {"apps": 2200, "yoy_pct": 15, "leaders": ["John Deere", "Trimble", "Raven"]},          "EU": {"apps": 1400, "yoy_pct": 18, "leaders": ["AGCO", "CNH Industrial", "Climate Corp"]},      "China": {"apps": 4500, "yoy_pct": 35, "leaders": ["DJI", "XAG", "Alibaba"]},                  "Japan": {"apps": 1100, "yoy_pct": 10, "leaders": ["Kubota", "Yanmar", "Iseki"]},               "Korea": {"apps": 650,  "yoy_pct": 12, "leaders": ["LS Mtron", "Daedong"]}},
    "long_duration_storage": {"USA": {"apps": 580,  "yoy_pct": 45, "leaders": ["Form Energy", "ESS Tech", "Malta Inc"]},   "EU": {"apps": 420,  "yoy_pct": 38, "leaders": ["Invinity", "CMBlu", "EnergyVault"]},            "China": {"apps": 1500, "yoy_pct": 60, "leaders": ["CNREC", "CESI", "BYD"]},                  "Japan": {"apps": 320,  "yoy_pct": 25, "leaders": ["Sumitomo", "NGK", "Furukawa"]},             "Korea": {"apps": 250,  "yoy_pct": 20, "leaders": ["Hyundai", "LG", "Samsung"]}},
    "smart_grid":           {"USA": {"apps": 2800, "yoy_pct": 12, "leaders": ["GE", "ABB", "Itron"]},                      "EU": {"apps": 2400, "yoy_pct": 14, "leaders": ["Schneider Electric", "Siemens", "ABB"]},        "China": {"apps": 9000, "yoy_pct": 30, "leaders": ["SGCC", "CSG", "Huawei"]},                  "Japan": {"apps": 1500, "yoy_pct": 8,  "leaders": ["Toshiba", "Fujitsu", "Hitachi"]},           "Korea": {"apps": 1200, "yoy_pct": 10, "leaders": ["KEPCO", "LS", "Hyundai"]}},
    "water_management":     {"USA": {"apps": 1800, "yoy_pct": 10, "leaders": ["Xylem", "Veolia NA", "Evoqua"]},             "EU": {"apps": 1500, "yoy_pct": 12, "leaders": ["Veolia", "Suez", "Danaher"]},                    "China": {"apps": 5000, "yoy_pct": 28, "leaders": ["Origin Water", "Sound Global", "BEWG"]},    "Japan": {"apps": 900,  "yoy_pct": 5,  "leaders": ["Toray", "Ebara", "Kurita"]},                "Korea": {"apps": 650,  "yoy_pct": 8,  "leaders": ["Doosan Heavy", "Hyosung", "Kolon"]}},
    "onshore_wind":         {"USA": {"apps": 1400, "yoy_pct": 8,  "leaders": ["GE Vernova", "Vestas", "Siemens Gamesa"]},  "EU": {"apps": 1800, "yoy_pct": 10, "leaders": ["Vestas", "Siemens Gamesa", "Enercon"]},          "China": {"apps": 8000, "yoy_pct": 25, "leaders": ["Goldwind", "Envision", "Mingyang"]},       "Japan": {"apps": 320,  "yoy_pct": 5,  "leaders": ["Hitachi", "Mitsubishi", "PNEG"]},           "Korea": {"apps": 280,  "yoy_pct": 7,  "leaders": ["Doosan", "Hyundai", "Unison"]}},
    "beccs":                {"USA": {"apps": 280,  "yoy_pct": 28, "leaders": ["ADM", "Drax", "Enviva"]},                   "EU": {"apps": 220,  "yoy_pct": 25, "leaders": ["Drax", "Orion", "Stockholm Exergi"]},           "China": {"apps": 550,  "yoy_pct": 42, "leaders": ["CEPCI", "Tsinghua", "Wuhan Bio"]},         "Japan": {"apps": 120,  "yoy_pct": 15, "leaders": ["Mitsubishi", "Sumitomo", "IHI"]},           "Korea": {"apps": 80,   "yoy_pct": 12, "leaders": ["KEPCO", "Korea Forest Service"]}},
    "biochar":              {"USA": {"apps": 420,  "yoy_pct": 35, "leaders": ["Indigo Ag", "Carbon by Indigo", "Diacarbon"]}, "EU": {"apps": 380,  "yoy_pct": 38, "leaders": ["PYREG", "Biochar Now", "Swiss Biochar"]},    "China": {"apps": 950,  "yoy_pct": 55, "leaders": ["SINOPEC", "CIMB", "Tsinghua"]},            "Japan": {"apps": 180,  "yoy_pct": 20, "leaders": ["Kobe Steel", "Mitsubishi"]},                "Korea": {"apps": 120,  "yoy_pct": 18, "leaders": ["POSCO", "SK Chemicals"]}},
}


# ---------------------------------------------------------------------------
# Reference Data — IEA Marginal Abatement Cost (MAC) Curves
# 25 technologies: abatement potential GtCO2/yr by 2030/2050, MAC USD/tCO2
# ---------------------------------------------------------------------------

MAC_CURVES: list[dict] = [
    {"technology": "building_energy_efficiency",   "mac_usd_tco2": -80,  "abatement_2030_gtco2": 1.8,  "abatement_2050_gtco2": 3.5,  "sector": "buildings",       "trl": 9, "notes": "Insulation, LED, HVAC — net negative cost"},
    {"technology": "industrial_energy_efficiency", "mac_usd_tco2": -45,  "abatement_2030_gtco2": 1.2,  "abatement_2050_gtco2": 2.8,  "sector": "industry",        "trl": 9, "notes": "Motor systems, waste heat recovery"},
    {"technology": "fuel_switching_gas_to_re",     "mac_usd_tco2": -30,  "abatement_2030_gtco2": 1.5,  "abatement_2050_gtco2": 4.0,  "sector": "energy",          "trl": 9, "notes": "Replacing gas peakers with solar+storage"},
    {"technology": "heat_pumps",                   "mac_usd_tco2": -20,  "abatement_2030_gtco2": 0.8,  "abatement_2050_gtco2": 2.2,  "sector": "buildings",       "trl": 9, "notes": "Negative cost at EU carbon prices >€60/t"},
    {"technology": "solar_pv_utility",             "mac_usd_tco2": -15,  "abatement_2030_gtco2": 2.8,  "abatement_2050_gtco2": 6.5,  "sector": "energy",          "trl": 9, "notes": "LCOE below gas in most markets"},
    {"technology": "smart_grid",                   "mac_usd_tco2": -5,   "abatement_2030_gtco2": 0.5,  "abatement_2050_gtco2": 1.5,  "sector": "energy",          "trl": 9, "notes": "Demand response and flexibility"},
    {"technology": "onshore_wind",                 "mac_usd_tco2": -10,  "abatement_2030_gtco2": 1.8,  "abatement_2050_gtco2": 4.0,  "sector": "energy",          "trl": 9, "notes": "LCOE competitive in windy regions"},
    {"technology": "ev_passenger",                 "mac_usd_tco2": 5,    "abatement_2030_gtco2": 1.4,  "abatement_2050_gtco2": 4.5,  "sector": "transportation",  "trl": 9, "notes": "Near cost-parity with ICE by 2025-2027"},
    {"technology": "methane_flaring_reduction",    "mac_usd_tco2": -15,  "abatement_2030_gtco2": 0.9,  "abatement_2050_gtco2": 1.5,  "sector": "energy",          "trl": 9, "notes": "Oil & gas sector methane capture"},
    {"technology": "forest_conservation_redd",     "mac_usd_tco2": 5,    "abatement_2030_gtco2": 3.5,  "abatement_2050_gtco2": 5.5,  "sector": "food_land_use",   "trl": 9, "notes": "REDD+ and avoided deforestation"},
    {"technology": "battery_storage_liion",        "mac_usd_tco2": 15,   "abatement_2030_gtco2": 0.6,  "abatement_2050_gtco2": 2.0,  "sector": "energy",          "trl": 9, "notes": "Short-duration grid storage"},
    {"technology": "offshore_wind",                "mac_usd_tco2": 20,   "abatement_2030_gtco2": 0.9,  "abatement_2050_gtco2": 3.5,  "sector": "energy",          "trl": 9, "notes": "Higher CAPEX but growing rapidly"},
    {"technology": "ev_commercial",                "mac_usd_tco2": 25,   "abatement_2030_gtco2": 0.5,  "abatement_2050_gtco2": 2.5,  "sector": "transportation",  "trl": 8, "notes": "Truck electrification at growing scale"},
    {"technology": "soil_carbon_agriculture",      "mac_usd_tco2": 30,   "abatement_2030_gtco2": 1.0,  "abatement_2050_gtco2": 2.0,  "sector": "food_land_use",   "trl": 8, "notes": "Regenerative and precision agriculture"},
    {"technology": "blue_hydrogen",                "mac_usd_tco2": 60,   "abatement_2030_gtco2": 0.3,  "abatement_2050_gtco2": 1.5,  "sector": "industry",        "trl": 8, "notes": "SMR+CCS bridge technology"},
    {"technology": "nuclear_large",                "mac_usd_tco2": 70,   "abatement_2030_gtco2": 0.5,  "abatement_2050_gtco2": 2.0,  "sector": "energy",          "trl": 9, "notes": "High capital cost but low-carbon baseload"},
    {"technology": "ccs_ccus_industrial",          "mac_usd_tco2": 95,   "abatement_2030_gtco2": 0.7,  "abatement_2050_gtco2": 5.8,  "sector": "industry",        "trl": 8, "notes": "Hard-to-abate sectors cement/steel"},
    {"technology": "green_hydrogen",               "mac_usd_tco2": 120,  "abatement_2030_gtco2": 0.4,  "abatement_2050_gtco2": 3.8,  "sector": "industry",        "trl": 8, "notes": "Cost declining rapidly with RE + scale"},
    {"technology": "long_duration_storage",        "mac_usd_tco2": 50,   "abatement_2030_gtco2": 0.15, "abatement_2050_gtco2": 0.8,  "sector": "energy",          "trl": 6, "notes": "Seasonal and multi-day storage"},
    {"technology": "steel_dri_h2",                 "mac_usd_tco2": 80,   "abatement_2030_gtco2": 0.3,  "abatement_2050_gtco2": 1.8,  "sector": "industry",        "trl": 7, "notes": "Hydrogen-based steelmaking (HYBRIT)"},
    {"technology": "cement_ccus",                  "mac_usd_tco2": 90,   "abatement_2030_gtco2": 0.2,  "abatement_2050_gtco2": 1.4,  "sector": "industry",        "trl": 6, "notes": "Oxyfuel and post-combustion CCS"},
    {"technology": "beccs",                        "mac_usd_tco2": 150,  "abatement_2030_gtco2": 0.5,  "abatement_2050_gtco2": 2.5,  "sector": "carbon_removal",  "trl": 7, "notes": "Sustainable biomass constraint critical"},
    {"technology": "sustainable_aviation_fuel",    "mac_usd_tco2": 300,  "abatement_2030_gtco2": 0.1,  "abatement_2050_gtco2": 0.6,  "sector": "transportation",  "trl": 8, "notes": "Green premium vs conventional jet fuel"},
    {"technology": "direct_air_capture",           "mac_usd_tco2": 600,  "abatement_2030_gtco2": 0.1,  "abatement_2050_gtco2": 1.0,  "sector": "carbon_removal",  "trl": 7, "notes": "High cost now, declining with scale"},
    {"technology": "ocean_alkalinity_enhancement", "mac_usd_tco2": 200,  "abatement_2030_gtco2": 0.05, "abatement_2050_gtco2": 0.5,  "sector": "carbon_removal",  "trl": 4, "notes": "Early stage — ecological risks uncertain"},
]


# ---------------------------------------------------------------------------
# Reference Data — TRL / Deployment Stage Definitions
# ---------------------------------------------------------------------------

TRL_DEFINITIONS: dict[int, dict] = {
    1: {"stage": "lab",          "label": "Basic principles",          "description": "Scientific research begins"},
    2: {"stage": "lab",          "label": "Technology concept",        "description": "Applied research begins"},
    3: {"stage": "lab",          "label": "Proof of concept",          "description": "Experimental proof of concept"},
    4: {"stage": "pilot",        "label": "Technology validated lab",  "description": "Technology validated in lab environment"},
    5: {"stage": "pilot",        "label": "Technology validated relevant env", "description": "Technology validated in relevant environment"},
    6: {"stage": "pilot",        "label": "Technology demonstrated",   "description": "Technology demonstrated in relevant environment"},
    7: {"stage": "demonstration","label": "System prototype demo",     "description": "System prototype demonstration in operational environment"},
    8: {"stage": "demonstration","label": "System complete and qualified", "description": "System complete and qualified"},
    9: {"stage": "commercial",   "label": "Actual system proven",      "description": "Full commercial deployment"},
}


# ---------------------------------------------------------------------------
# Reference Data — Green Taxonomy Alignment per Technology
# ---------------------------------------------------------------------------

GREEN_TAXONOMY_ALIGNMENT: dict[str, dict] = {
    "solar_pv_utility":          {"eu_taxonomy_eligible": True, "eu_taxonomy_objectives": ["CCM_1.1"], "sfdr_pai_indicators": ["pai_1", "pai_2"], "icma_gbp_categories": ["RE", "Energy_Efficiency"], "do_no_significant_harm": ["biodiversity_land_use_screen"]},
    "solar_pv_rooftop":          {"eu_taxonomy_eligible": True, "eu_taxonomy_objectives": ["CCM_1.1"], "sfdr_pai_indicators": ["pai_1"], "icma_gbp_categories": ["RE"], "do_no_significant_harm": []},
    "onshore_wind":              {"eu_taxonomy_eligible": True, "eu_taxonomy_objectives": ["CCM_1.2"], "sfdr_pai_indicators": ["pai_1", "pai_2"], "icma_gbp_categories": ["RE"], "do_no_significant_harm": ["biodiversity_screen", "noise_impact"]},
    "offshore_wind":             {"eu_taxonomy_eligible": True, "eu_taxonomy_objectives": ["CCM_1.2"], "sfdr_pai_indicators": ["pai_1", "pai_2"], "icma_gbp_categories": ["RE"], "do_no_significant_harm": ["marine_biodiversity"]},
    "battery_storage_liion":     {"eu_taxonomy_eligible": True, "eu_taxonomy_objectives": ["CCM_4.9"], "sfdr_pai_indicators": ["pai_1"], "icma_gbp_categories": ["Energy_Efficiency", "Clean_Transport"], "do_no_significant_harm": ["e_waste_recycling"]},
    "green_hydrogen":            {"eu_taxonomy_eligible": True, "eu_taxonomy_objectives": ["CCM_4.13"], "sfdr_pai_indicators": ["pai_1", "pai_2"], "icma_gbp_categories": ["RE", "Clean_Transport"], "do_no_significant_harm": ["water_stress_screen"]},
    "ccs_ccus":                  {"eu_taxonomy_eligible": True, "eu_taxonomy_objectives": ["CCM_5.12"], "sfdr_pai_indicators": ["pai_1"], "icma_gbp_categories": ["CCA_CCM"], "do_no_significant_harm": ["geological_storage_integrity"]},
    "direct_air_capture":        {"eu_taxonomy_eligible": True, "eu_taxonomy_objectives": ["CCM_5.12"], "sfdr_pai_indicators": ["pai_1"], "icma_gbp_categories": ["CCA_CCM"], "do_no_significant_harm": ["energy_consumption_screen"]},
    "nuclear_smr":               {"eu_taxonomy_eligible": True, "eu_taxonomy_objectives": ["CCM_4.26"], "sfdr_pai_indicators": ["pai_1"], "icma_gbp_categories": [], "do_no_significant_harm": ["radioactive_waste", "thermal_discharge"]},
    "ev_passenger":              {"eu_taxonomy_eligible": True, "eu_taxonomy_objectives": ["CCM_6.5"], "sfdr_pai_indicators": ["pai_1", "pai_3"], "icma_gbp_categories": ["Clean_Transport"], "do_no_significant_harm": ["battery_recycling"]},
    "heat_pumps":                {"eu_taxonomy_eligible": True, "eu_taxonomy_objectives": ["CCM_7.4"], "sfdr_pai_indicators": ["pai_1"], "icma_gbp_categories": ["Energy_Efficiency"], "do_no_significant_harm": ["refrigerant_gwp"]},
    "steel_dri_h2":              {"eu_taxonomy_eligible": True, "eu_taxonomy_objectives": ["CCM_3.3"], "sfdr_pai_indicators": ["pai_1", "pai_2"], "icma_gbp_categories": ["CCA_CCM"], "do_no_significant_harm": ["water_use"]},
    "sustainable_aviation_fuel": {"eu_taxonomy_eligible": True, "eu_taxonomy_objectives": ["CCM_6.19"], "sfdr_pai_indicators": ["pai_1"], "icma_gbp_categories": ["Clean_Transport"], "do_no_significant_harm": ["land_use_change"]},
}


# ---------------------------------------------------------------------------
# Data classes — Results
# ---------------------------------------------------------------------------

@dataclass
class TechnologyAssessmentResult:
    technology_name: str
    category: str
    ctvc_sector: str
    trl: int
    trl_label: str
    deployment_stage: str
    learning_rate_pct: float
    cost_2024: float
    cost_2030: float
    cost_2040: float
    cost_2050: float
    cost_unit: str
    cost_reduction_to_2030_pct: float
    cost_reduction_to_2050_pct: float
    abatement_potential_2030_gtco2: float
    abatement_potential_2050_gtco2: float
    mac_usd_per_tco2: float
    iea_nze_deployment_gap_pct: float
    investment_2024_usd_bn: float
    eu_taxonomy_eligible: bool
    eu_taxonomy_objectives: list[str]
    sfdr_pai_indicators: list[str]
    investment_attractiveness_score: float
    investment_attractiveness_tier: str
    key_risk_factors: list[str]
    key_opportunity_factors: list[str]


@dataclass
class InvestmentOpportunityResult:
    technology: str
    stage: str
    geography: str
    investment_size_usd: float
    ctvc_sector: str
    total_market_size_usd_bn: float
    sector_yoy_growth_pct: float
    median_comparable_deal_usd_m: float
    stage_deal_count: int
    ev_revenue_multiple: Optional[float]
    ev_ebitda_multiple: Optional[float]
    patent_applications_target_geo: int
    patent_growth_yoy_pct: float
    leading_patent_holders: list[str]
    trl: int
    deployment_stage: str
    risk_level: str
    return_potential: str
    risk_return_profile: str
    recommended_investment_thesis: str
    comparable_deals: list[dict]
    key_risks: list[str]


@dataclass
class PortfolioAnalysisResult:
    technologies: list[str]
    total_investment_usd: float
    ctvc_sector_allocation: dict[str, float]
    sector_count: int
    diversification_score: float
    total_abatement_potential_2030_gtco2: float
    total_abatement_potential_2050_gtco2: float
    weighted_mac_usd_per_tco2: float
    eu_taxonomy_aligned_pct: float
    eu_taxonomy_objectives_covered: list[str]
    temperature_contribution_c: float
    avg_trl: float
    trl_distribution: dict[str, int]
    investment_stage_mix: dict[str, float]
    top_patent_jurisdictions: list[str]
    portfolio_risk_tier: str
    portfolio_return_potential: str
    rebalancing_suggestions: list[str]


@dataclass
class LearningCurveResult:
    technology: str
    learning_rate_pct: float
    current_cumulative_capacity: float
    target_cumulative_capacity: float
    current_cost: float
    projected_cost_at_target: float
    cost_reduction_pct: float
    cost_unit: str
    lcoe_or_lcos_current: Optional[float]
    lcoe_or_lcos_target: Optional[float]
    capacity_doublings: float
    key_cost_reduction_levers: list[str]
    cost_milestones: list[dict]
    years_to_target_estimate: int


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------

class ClimateTechEngine:
    """E118 — Climate Tech Investment Engine."""

    # ------------------------------------------------------------------
    # 1. Technology Assessment
    # ------------------------------------------------------------------

    def assess_technology(self, technology_name: str, category: str) -> TechnologyAssessmentResult:
        """Assess a climate technology: TRL, costs, abatement, MAC, IEA NZE gap, attractiveness."""
        tech_key = technology_name.lower().replace(" ", "_").replace("-", "_")
        iea_data = IEA_TECHNOLOGIES.get(tech_key)
        bnef_data = BNEF_LEARNING_CURVES.get(tech_key)
        tax_data = GREEN_TAXONOMY_ALIGNMENT.get(tech_key, {})

        # Fallback if tech_key not directly matched
        if iea_data is None:
            for k, v in IEA_TECHNOLOGIES.items():
                if technology_name.lower() in v.get("display_name", "").lower():
                    iea_data = v
                    tech_key = k
                    break

        # Determine CTVC sector
        ctvc_sector = "energy"
        if iea_data:
            ctvc_sector = iea_data.get("ctvc_sector", "energy")
        else:
            # infer from category
            for sector, sdata in CTVC_TAXONOMY.items():
                if category.lower() in sector or tech_key in sdata.get("sub_sectors", []):
                    ctvc_sector = sector
                    break

        # Cost trajectory
        cost_traj = iea_data.get("cost_trajectory", {2020: 100, 2024: 80, 2030: 60, 2040: 45, 2050: 35}) if iea_data else {2020: 100, 2024: 80, 2030: 60, 2040: 45, 2050: 35}
        cost_unit = iea_data.get("cost_unit", "USD/kW") if iea_data else "USD/unit"
        cost_2024 = cost_traj.get(2024, cost_traj.get(2023, list(cost_traj.values())[0]))
        cost_2030 = cost_traj.get(2030, cost_2024)
        cost_2040 = cost_traj.get(2040, cost_2030)
        cost_2050 = cost_traj.get(2050, cost_2040)

        cost_reduction_2030 = round((cost_2024 - cost_2030) / max(cost_2024, 1) * 100, 1)
        cost_reduction_2050 = round((cost_2024 - cost_2050) / max(cost_2024, 1) * 100, 1)

        trl = iea_data.get("trl", 7) if iea_data else 7
        deployment_stage = iea_data.get("deployment_stage", "pilot") if iea_data else "pilot"
        trl_info = TRL_DEFINITIONS.get(trl, TRL_DEFINITIONS[7])
        trl_label = trl_info["label"]

        learning_rate = bnef_data.get("learning_rate_pct", 10.0) if bnef_data else 10.0

        abatement_2030 = iea_data.get("abatement_potential_gtco2_2030", 0.1) if iea_data else 0.1
        abatement_2050 = iea_data.get("abatement_potential_gtco2_2050", 0.5) if iea_data else 0.5
        mac = iea_data.get("mac_usd_per_tco2", 50) if iea_data else 50
        deployment_gap = iea_data.get("deployment_gap_pct", 80.0) if iea_data else 80.0
        investment_2024 = iea_data.get("annual_investment_2024_usd_bn", 1.0) if iea_data else 1.0

        # Investment attractiveness scoring (0-100)
        score = 0.0
        score += min(30, abatement_2030 * 8)           # Abatement potential weight 30
        score += min(20, max(0, (200 - mac) / 10))      # Lower MAC → higher score, weight 20
        score += (trl / 9) * 20                         # TRL maturity weight 20
        score += min(15, learning_rate * 0.75)          # Learning rate weight 15
        score += min(15, investment_2024 * 0.5)         # Market size weight 15

        score = min(100, round(score, 1))
        if score >= 75:
            attractiveness_tier = "high"
        elif score >= 50:
            attractiveness_tier = "medium"
        elif score >= 30:
            attractiveness_tier = "low"
        else:
            attractiveness_tier = "early_stage"

        key_risks = self._get_technology_risks(tech_key, trl, mac, deployment_gap)
        key_opportunities = self._get_technology_opportunities(tech_key, abatement_2030, learning_rate, trl)

        return TechnologyAssessmentResult(
            technology_name=technology_name,
            category=category,
            ctvc_sector=ctvc_sector,
            trl=trl,
            trl_label=trl_label,
            deployment_stage=deployment_stage,
            learning_rate_pct=learning_rate,
            cost_2024=cost_2024,
            cost_2030=cost_2030,
            cost_2040=cost_2040,
            cost_2050=cost_2050,
            cost_unit=cost_unit,
            cost_reduction_to_2030_pct=cost_reduction_2030,
            cost_reduction_to_2050_pct=cost_reduction_2050,
            abatement_potential_2030_gtco2=abatement_2030,
            abatement_potential_2050_gtco2=abatement_2050,
            mac_usd_per_tco2=mac,
            iea_nze_deployment_gap_pct=deployment_gap,
            investment_2024_usd_bn=investment_2024,
            eu_taxonomy_eligible=tax_data.get("eu_taxonomy_eligible", False),
            eu_taxonomy_objectives=tax_data.get("eu_taxonomy_objectives", []),
            sfdr_pai_indicators=tax_data.get("sfdr_pai_indicators", []),
            investment_attractiveness_score=score,
            investment_attractiveness_tier=attractiveness_tier,
            key_risk_factors=key_risks,
            key_opportunity_factors=key_opportunities,
        )

    # ------------------------------------------------------------------
    # 2. Investment Opportunity Analysis
    # ------------------------------------------------------------------

    def analyse_investment_opportunity(
        self,
        technology: str,
        stage: str,
        geography: str,
        investment_size_usd: float,
    ) -> InvestmentOpportunityResult:
        """VC/PE market context, comparable deal multiples, patent position, risk-return."""
        tech_key = technology.lower().replace(" ", "_").replace("-", "_")
        iea_data = IEA_TECHNOLOGIES.get(tech_key, {})
        ctvc_sector = iea_data.get("ctvc_sector", "energy")

        vc_sector = VC_PE_DEAL_DATA.get(ctvc_sector, VC_PE_DEAL_DATA["energy"])
        stage_data = vc_sector["stages"].get(stage, vc_sector["stages"]["growth"])

        # Patent data
        patent_data = PATENT_INTENSITY.get(tech_key, PATENT_INTENSITY.get("solar_pv_utility", {}))
        geo_upper = geography.upper()
        geo_patent = patent_data.get(geo_upper, list(patent_data.values())[0] if patent_data else {"apps": 0, "yoy_pct": 0, "leaders": []})

        trl = iea_data.get("trl", 7)
        deployment_stage = iea_data.get("deployment_stage", "pilot")

        # Risk-return mapping
        risk_map = {"seed": "very_high", "early": "high", "growth": "medium", "late": "medium_low"}
        return_map = {"seed": "very_high_potential", "early": "high_potential", "growth": "moderate_high", "late": "moderate"}
        risk_level = risk_map.get(stage, "high")
        return_potential = return_map.get(stage, "moderate_high")

        if risk_level in ("very_high", "high") and return_potential in ("very_high_potential", "high_potential"):
            profile = "high_risk_high_reward"
        elif risk_level == "medium":
            profile = "balanced_growth"
        else:
            profile = "moderate_yield"

        thesis = self._build_investment_thesis(tech_key, stage, ctvc_sector, trl)
        key_risks = self._get_technology_risks(tech_key, trl, iea_data.get("mac_usd_per_tco2", 50), iea_data.get("deployment_gap_pct", 80))

        # Comparable deal examples
        comparables = [
            {"deal_type": "comparable_" + stage, "median_size_usd_m": stage_data["median_deal_usd_m"],
             "ev_revenue_multiple": stage_data.get("ev_revenue_multiple"),
             "ev_ebitda_multiple": stage_data.get("ev_ebitda_multiple"),
             "total_deployed_usd_bn": stage_data["total_usd_bn"],
             "deal_count": stage_data["deal_count"]},
        ]

        return InvestmentOpportunityResult(
            technology=technology,
            stage=stage,
            geography=geography,
            investment_size_usd=investment_size_usd,
            ctvc_sector=ctvc_sector,
            total_market_size_usd_bn=vc_sector["total_capital_2024_usd_bn"],
            sector_yoy_growth_pct=vc_sector["yoy_growth_pct"],
            median_comparable_deal_usd_m=stage_data["median_deal_usd_m"],
            stage_deal_count=stage_data["deal_count"],
            ev_revenue_multiple=stage_data.get("ev_revenue_multiple"),
            ev_ebitda_multiple=stage_data.get("ev_ebitda_multiple"),
            patent_applications_target_geo=geo_patent.get("apps", 0),
            patent_growth_yoy_pct=geo_patent.get("yoy_pct", 0),
            leading_patent_holders=geo_patent.get("leaders", []),
            trl=trl,
            deployment_stage=deployment_stage,
            risk_level=risk_level,
            return_potential=return_potential,
            risk_return_profile=profile,
            recommended_investment_thesis=thesis,
            comparable_deals=comparables,
            key_risks=key_risks,
        )

    # ------------------------------------------------------------------
    # 3. Portfolio Analysis
    # ------------------------------------------------------------------

    def build_portfolio_analysis(
        self,
        technology_list: list[str],
        investment_amounts: list[float],
    ) -> PortfolioAnalysisResult:
        """Diversification across CTVC sectors, combined abatement, portfolio MAC, EU Taxonomy alignment."""
        if len(technology_list) != len(investment_amounts):
            raise ValueError("technology_list and investment_amounts must be same length")

        total_investment = sum(investment_amounts)
        if total_investment == 0:
            total_investment = 1.0

        sector_allocation: dict[str, float] = {}
        total_abatement_2030 = 0.0
        total_abatement_2050 = 0.0
        weighted_mac = 0.0
        eu_taxonomy_count = 0
        eu_objectives: set[str] = set()
        trl_values: list[int] = []
        trl_stage_counts: dict[str, int] = {"lab": 0, "pilot": 0, "demonstration": 0, "commercial": 0}
        patent_geos: dict[str, int] = {}

        for tech, amount in zip(technology_list, investment_amounts):
            tech_key = tech.lower().replace(" ", "_").replace("-", "_")
            iea_data = IEA_TECHNOLOGIES.get(tech_key, {})
            tax_data = GREEN_TAXONOMY_ALIGNMENT.get(tech_key, {})
            weight = amount / total_investment

            ctvc_sector = iea_data.get("ctvc_sector", "energy")
            sector_allocation[ctvc_sector] = sector_allocation.get(ctvc_sector, 0.0) + weight

            total_abatement_2030 += iea_data.get("abatement_potential_gtco2_2030", 0.1) * weight
            total_abatement_2050 += iea_data.get("abatement_potential_gtco2_2050", 0.5) * weight
            weighted_mac += iea_data.get("mac_usd_per_tco2", 50) * weight

            if tax_data.get("eu_taxonomy_eligible", False):
                eu_taxonomy_count += 1
                eu_objectives.update(tax_data.get("eu_taxonomy_objectives", []))

            trl = iea_data.get("trl", 7)
            trl_values.append(trl)
            stage = iea_data.get("deployment_stage", "pilot")
            trl_stage_counts[stage] = trl_stage_counts.get(stage, 0) + 1

            # Patent jurisdiction tallying
            patent_data = PATENT_INTENSITY.get(tech_key, {})
            for geo, pdata in patent_data.items():
                patent_geos[geo] = patent_geos.get(geo, 0) + pdata.get("apps", 0)

        eu_taxonomy_pct = round(eu_taxonomy_count / max(len(technology_list), 1) * 100, 1)

        # HHI-based diversification score
        hhi = sum(v ** 2 for v in sector_allocation.values())
        diversification_score = round((1 - hhi) * 100, 1)

        sector_count = len(sector_allocation)
        avg_trl = round(sum(trl_values) / max(len(trl_values), 1), 1)

        # Temperature contribution estimate: rough approximation
        temperature_contribution = round(max(0.05, 2.0 - total_abatement_2050 * 0.15), 2)

        top_patent_jurisdictions = sorted(patent_geos, key=lambda x: patent_geos[x], reverse=True)[:5]

        # Portfolio risk / return
        commercial_pct = trl_stage_counts.get("commercial", 0) / max(len(technology_list), 1)
        if commercial_pct >= 0.6:
            portfolio_risk = "medium"
            portfolio_return = "moderate_stable"
        elif commercial_pct >= 0.3:
            portfolio_risk = "medium_high"
            portfolio_return = "moderate_high_growth"
        else:
            portfolio_risk = "high"
            portfolio_return = "high_potential_growth"

        # Rebalancing suggestions
        suggestions = self._generate_rebalancing_suggestions(
            sector_allocation, eu_taxonomy_pct, avg_trl, total_abatement_2030
        )

        return PortfolioAnalysisResult(
            technologies=technology_list,
            total_investment_usd=total_investment,
            ctvc_sector_allocation={k: round(v * 100, 1) for k, v in sector_allocation.items()},
            sector_count=sector_count,
            diversification_score=diversification_score,
            total_abatement_potential_2030_gtco2=round(total_abatement_2030, 3),
            total_abatement_potential_2050_gtco2=round(total_abatement_2050, 3),
            weighted_mac_usd_per_tco2=round(weighted_mac, 1),
            eu_taxonomy_aligned_pct=eu_taxonomy_pct,
            eu_taxonomy_objectives_covered=sorted(eu_objectives),
            temperature_contribution_c=temperature_contribution,
            avg_trl=avg_trl,
            trl_distribution=trl_stage_counts,
            investment_stage_mix={},
            top_patent_jurisdictions=top_patent_jurisdictions,
            portfolio_risk_tier=portfolio_risk,
            portfolio_return_potential=portfolio_return,
            rebalancing_suggestions=suggestions,
        )

    # ------------------------------------------------------------------
    # 4. Learning Curve Calculator
    # ------------------------------------------------------------------

    def calculate_learning_curve(
        self,
        technology: str,
        current_cumulative_capacity: float,
        target_cumulative_capacity: float,
    ) -> LearningCurveResult:
        """Project cost at target cumulative capacity using Wright's Law."""
        tech_key = technology.lower().replace(" ", "_").replace("-", "_")
        bnef_data = BNEF_LEARNING_CURVES.get(tech_key, {})
        iea_data = IEA_TECHNOLOGIES.get(tech_key, {})

        learning_rate = bnef_data.get("learning_rate_pct", 12.0)
        learning_exp = bnef_data.get("learning_exponent", -math.log2(1 - learning_rate / 100))

        # Current cost from BNEF historical or IEA cost_trajectory
        historical = bnef_data.get("historical", {})
        current_cost = historical.get(2024, list(historical.values())[-1] if historical else 100.0)
        cost_unit = bnef_data.get("unit", iea_data.get("cost_unit", "USD/unit"))

        # Wright's Law: cost = current_cost * (target/current)^learning_exp
        if current_cumulative_capacity <= 0:
            current_cumulative_capacity = 1.0
        capacity_ratio = target_cumulative_capacity / current_cumulative_capacity
        projected_cost = current_cost * (capacity_ratio ** learning_exp)
        projected_cost = round(projected_cost, 4)
        cost_reduction_pct = round((current_cost - projected_cost) / max(current_cost, 1) * 100, 1)
        capacity_doublings = round(math.log2(capacity_ratio), 2)

        # LCOE/LCOS approximation
        lcoe_current = None
        lcoe_target = None
        tech_name_lower = tech_key
        if "solar" in tech_name_lower or "wind" in tech_name_lower:
            lcoe_factor = 1.8  # rough CAPEX→LCOE multiplier
            lcoe_current = round(current_cost * lcoe_factor / 1000, 2)
            lcoe_target = round(projected_cost * lcoe_factor / 1000, 2)
        elif "battery" in tech_name_lower or "storage" in tech_name_lower:
            lcoe_current = round(current_cost * 0.12, 2)
            lcoe_target = round(projected_cost * 0.12, 2)

        # Cost milestones (doublings 0.5 to 10)
        milestones = []
        for d in [0.5, 1.0, 2.0, 3.0, 5.0, 10.0]:
            cap_at_d = current_cumulative_capacity * (2 ** d)
            cost_at_d = round(current_cost * ((2 ** d) ** learning_exp), 4)
            milestones.append({
                "capacity_doublings": d,
                "cumulative_capacity": round(cap_at_d, 2),
                "projected_cost": cost_at_d,
                "cost_unit": cost_unit,
            })

        # Years estimate: assume 20% annual growth
        years_est = 0
        if capacity_ratio > 1:
            years_est = max(1, int(math.log(capacity_ratio) / math.log(1.20)))

        cost_levers = bnef_data.get("cost_levers", ["manufacturing_scale", "technology_improvement", "supply_chain"])

        return LearningCurveResult(
            technology=technology,
            learning_rate_pct=learning_rate,
            current_cumulative_capacity=current_cumulative_capacity,
            target_cumulative_capacity=target_cumulative_capacity,
            current_cost=current_cost,
            projected_cost_at_target=projected_cost,
            cost_reduction_pct=cost_reduction_pct,
            cost_unit=cost_unit,
            lcoe_or_lcos_current=lcoe_current,
            lcoe_or_lcos_target=lcoe_target,
            capacity_doublings=capacity_doublings,
            key_cost_reduction_levers=cost_levers,
            cost_milestones=milestones,
            years_to_target_estimate=years_est,
        )

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _get_technology_risks(self, tech_key: str, trl: int, mac: float, deployment_gap: float) -> list[str]:
        risks = []
        if trl <= 6:
            risks.append("Technology risk: pre-commercial TRL, may require further R&D")
        if mac > 150:
            risks.append("High abatement cost: MAC >$150/tCO2 limits near-term commercial competitiveness")
        if deployment_gap > 90:
            risks.append("Massive deployment gap vs IEA NZE: execution risk on scale-up")
        if "hydrogen" in tech_key:
            risks.append("Infrastructure risk: requires hydrogen pipeline/storage buildout")
        if "ccs" in tech_key or "capture" in tech_key:
            risks.append("Permitting and liability risk for geological storage")
        if "nuclear" in tech_key:
            risks.append("Regulatory and public acceptance risk; long construction timelines")
        if "aviation" in tech_key or "saf" in tech_key:
            risks.append("Feedstock availability and sustainability certification risk")
        if not risks:
            risks.append("Market competition risk as technology matures")
        return risks[:5]

    def _get_technology_opportunities(self, tech_key: str, abatement: float, learning_rate: float, trl: int) -> list[str]:
        opps = []
        if abatement > 1.0:
            opps.append(f"High abatement potential: {abatement:.1f} GtCO2/yr by 2030 creates large market")
        if learning_rate > 15:
            opps.append(f"Rapid cost decline ({learning_rate:.0f}% per doubling): early movers capture structural advantage")
        if trl == 9:
            opps.append("Commercial maturity: proven technology with investable risk profile")
        if trl in (7, 8):
            opps.append("Demonstration-stage: first-mover advantage at pre-commercial scale")
        opps.append("Policy tailwinds: IRA (USA), EU Green Deal, COP28 commitments driving deployment")
        return opps[:5]

    def _build_investment_thesis(self, tech_key: str, stage: str, ctvc_sector: str, trl: int) -> str:
        stage_text = {"seed": "seed-stage venture", "early": "early-stage growth equity", "growth": "growth equity", "late": "late-stage / pre-IPO"}
        trl_text = "commercial" if trl == 9 else "pre-commercial" if trl <= 6 else "near-commercial"
        return (
            f"This {stage_text.get(stage, 'growth equity')} opportunity in {ctvc_sector.replace('_', ' ')} "
            f"targets a {trl_text} technology with strong policy support. "
            f"Investment thesis: capture scale-up economics as deployment accelerates toward IEA NZE 2030 targets, "
            f"leveraging learning curve cost reductions and growing voluntary/compliance carbon market demand."
        )

    def _generate_rebalancing_suggestions(
        self, sector_alloc: dict[str, float], eu_pct: float, avg_trl: float, abatement: float
    ) -> list[str]:
        suggestions = []
        if len(sector_alloc) < 4:
            suggestions.append("Increase CTVC sector diversification — target ≥5 sectors to reduce concentration risk")
        max_sector = max(sector_alloc, key=sector_alloc.__getitem__, default="energy") if sector_alloc else "energy"
        if sector_alloc.get(max_sector, 0) > 0.5:
            suggestions.append(f"Reduce overweight in {max_sector} (>{sector_alloc[max_sector]*100:.0f}%) — cap single-sector at 40%")
        if eu_pct < 60:
            suggestions.append("Increase EU Taxonomy-aligned technologies to improve regulatory positioning for EU LPs")
        if avg_trl < 7:
            suggestions.append("Portfolio skews early-stage (avg TRL <7) — consider adding commercial-stage (TRL 9) anchor positions")
        if abatement < 0.5:
            suggestions.append("Add higher-abatement technologies (solar PV, wind, EV) to strengthen climate impact credentials")
        if "carbon_removal" not in sector_alloc:
            suggestions.append("Consider 5-10% allocation to carbon removal (DAC/biochar/BECCS) as portfolio climate hedge")
        return suggestions[:6]
