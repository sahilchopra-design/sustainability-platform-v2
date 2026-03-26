"""
Nature Capital Accounting Engine — E116
SEEA Ecosystem Accounts (UN 2021): Extent / Condition / Services / Monetary
Natural Capital Protocol (NCC 2016): Frame / Scope / Measure / Value
Total Economic Value (TEV) framework
ENCORE sub-industry × ecosystem service dependency matrix
TNFD LEAP scoring (0-100)
SBTN 5-step readiness assessment
"""
from __future__ import annotations
from typing import Any
import math
import random

# ---------------------------------------------------------------------------
# SEEA Ecosystem Account Reference Data
# ---------------------------------------------------------------------------

SEEA_ECOSYSTEM_TYPES: dict[str, dict[str, Any]] = {
    "cultivated": {
        "label": "Cultivated & Managed Land",
        "description": "Agricultural land, plantations, managed forests under cultivation",
        "iucn_habitat": "14",
        "typical_services": ["food_provisioning", "fiber_provisioning", "water_regulation"],
        "avg_condition_index_baseline": 0.55,
    },
    "urban": {
        "label": "Urban & Built-Up Land",
        "description": "Cities, towns, transport infrastructure, industrial zones",
        "iucn_habitat": "15",
        "typical_services": ["recreation_cultural", "noise_attenuation", "urban_cooling"],
        "avg_condition_index_baseline": 0.30,
    },
    "inland_water": {
        "label": "Inland Water Bodies",
        "description": "Rivers, lakes, reservoirs, streams, ponds",
        "iucn_habitat": "5",
        "typical_services": ["water_provisioning", "freshwater_regulation", "fisheries"],
        "avg_condition_index_baseline": 0.62,
    },
    "coastal_marine": {
        "label": "Coastal & Marine Ecosystems",
        "description": "Seagrass, coral reefs, estuaries, open ocean, continental shelf",
        "iucn_habitat": "9",
        "typical_services": ["fisheries", "storm_protection", "carbon_sequestration", "recreation_cultural"],
        "avg_condition_index_baseline": 0.58,
    },
    "forest": {
        "label": "Forest & Woodland",
        "description": "Tropical, subtropical, temperate and boreal forests",
        "iucn_habitat": "1",
        "typical_services": ["carbon_sequestration", "water_regulation", "timber", "biodiversity_maintenance"],
        "avg_condition_index_baseline": 0.72,
    },
    "shrub_grassland": {
        "label": "Shrubland & Grassland",
        "description": "Savannas, shrublands, grasslands, heathlands, tundra",
        "iucn_habitat": "2",
        "typical_services": ["carbon_sequestration", "pollination", "grazing_provisioning"],
        "avg_condition_index_baseline": 0.65,
    },
    "wetland_other": {
        "label": "Wetland & Other Land",
        "description": "Marshes, bogs, fens, mangroves, peatlands, bare land",
        "iucn_habitat": "3",
        "typical_services": ["water_purification", "flood_regulation", "carbon_sequestration", "biodiversity_maintenance"],
        "avg_condition_index_baseline": 0.68,
    },
}

# 12 condition indicators across biotic / abiotic / landscape dimensions
SEEA_CONDITION_INDICATORS: dict[str, dict[str, Any]] = {
    "C01_species_richness":         {"dimension": "biotic",   "unit": "species/ha",         "weight": 0.12},
    "C02_tree_cover_density":       {"dimension": "biotic",   "unit": "%",                  "weight": 0.10},
    "C03_leaf_area_index":          {"dimension": "biotic",   "unit": "m2/m2",              "weight": 0.08},
    "C04_invasive_species_cover":   {"dimension": "biotic",   "unit": "% reverse",          "weight": 0.08},
    "C05_soil_organic_carbon":      {"dimension": "abiotic",  "unit": "t C/ha",             "weight": 0.10},
    "C06_water_quality_index":      {"dimension": "abiotic",  "unit": "0-1 index",          "weight": 0.10},
    "C07_erosion_rate":             {"dimension": "abiotic",  "unit": "t/ha/yr reverse",    "weight": 0.08},
    "C08_fire_frequency":           {"dimension": "abiotic",  "unit": "events/yr reverse",  "weight": 0.06},
    "C09_connectivity_index":       {"dimension": "landscape","unit": "0-1 index",          "weight": 0.10},
    "C10_fragmentation_index":      {"dimension": "landscape","unit": "0-1 reverse",        "weight": 0.08},
    "C11_protected_area_overlap":   {"dimension": "landscape","unit": "%",                  "weight": 0.06},
    "C12_restoration_potential":    {"dimension": "landscape","unit": "0-1 index",          "weight": 0.04},
}

# CICES v5.1 — 3 sections × representative services
CICES_ECOSYSTEM_SERVICES: dict[str, dict[str, Any]] = {
    # Provisioning
    "food_provisioning":        {"section": "provisioning", "class": "nutrition",        "cices_code": "1.1.1"},
    "fiber_provisioning":       {"section": "provisioning", "class": "materials",        "cices_code": "1.2.1"},
    "water_provisioning":       {"section": "provisioning", "class": "water",            "cices_code": "1.3.1"},
    "timber":                   {"section": "provisioning", "class": "materials",        "cices_code": "1.2.2"},
    "fisheries":                {"section": "provisioning", "class": "nutrition",        "cices_code": "1.1.2"},
    "grazing_provisioning":     {"section": "provisioning", "class": "nutrition",        "cices_code": "1.1.3"},
    "genetic_resources":        {"section": "provisioning", "class": "materials",        "cices_code": "1.2.3"},
    # Regulation & Maintenance
    "carbon_sequestration":     {"section": "regulation",   "class": "climate",          "cices_code": "2.2.1"},
    "water_regulation":         {"section": "regulation",   "class": "hydrology",        "cices_code": "2.1.1"},
    "water_purification":       {"section": "regulation",   "class": "water quality",    "cices_code": "2.1.2"},
    "flood_regulation":         {"section": "regulation",   "class": "hydrology",        "cices_code": "2.1.3"},
    "storm_protection":         {"section": "regulation",   "class": "hazard",           "cices_code": "2.3.1"},
    "pollination":              {"section": "regulation",   "class": "lifecycle",        "cices_code": "2.4.1"},
    "biodiversity_maintenance": {"section": "regulation",   "class": "lifecycle",        "cices_code": "2.4.2"},
    "noise_attenuation":        {"section": "regulation",   "class": "physical",         "cices_code": "2.5.1"},
    "urban_cooling":            {"section": "regulation",   "class": "climate",          "cices_code": "2.2.2"},
    "freshwater_regulation":    {"section": "regulation",   "class": "hydrology",        "cices_code": "2.1.4"},
    # Cultural
    "recreation_cultural":      {"section": "cultural",     "class": "physical_use",     "cices_code": "3.1.1"},
    "tourism":                  {"section": "cultural",     "class": "physical_use",     "cices_code": "3.1.2"},
    "aesthetic_experience":     {"section": "cultural",     "class": "intellectual",     "cices_code": "3.2.1"},
    "spiritual_cultural":       {"section": "cultural",     "class": "spiritual",        "cices_code": "3.3.1"},
}

# 8 monetary valuation methods with applicability and reliability notes
MONETARY_VALUATION_METHODS: dict[str, dict[str, Any]] = {
    "market_price":          {"type": "revealed_preference", "reliability": "high",   "typical_use": ["food_provisioning","timber","fisheries","water_provisioning"]},
    "cost_of_production":    {"type": "revealed_preference", "reliability": "medium", "typical_use": ["water_provisioning","water_purification"]},
    "hedonic_pricing":       {"type": "revealed_preference", "reliability": "medium", "typical_use": ["recreation_cultural","aesthetic_experience","noise_attenuation"]},
    "travel_cost":           {"type": "revealed_preference", "reliability": "medium", "typical_use": ["recreation_cultural","tourism"]},
    "replacement_cost":      {"type": "cost_based",          "reliability": "medium", "typical_use": ["flood_regulation","storm_protection","water_purification"]},
    "avoided_cost":          {"type": "cost_based",          "reliability": "medium", "typical_use": ["carbon_sequestration","flood_regulation","urban_cooling"]},
    "contingent_valuation":  {"type": "stated_preference",   "reliability": "low",   "typical_use": ["biodiversity_maintenance","spiritual_cultural","genetic_resources"]},
    "benefit_transfer":      {"type": "meta_analysis",       "reliability": "low_medium", "typical_use": ["all_services"]},
}

# ---------------------------------------------------------------------------
# Ecosystem Service Valuation Benchmarks — 50 unit values (USD/ha/yr)
# Source: TEEB, Costanza et al. 2014, de Groot et al. 2012, peer-reviewed meta-analyses
# ---------------------------------------------------------------------------

VALUATION_BENCHMARKS: list[dict[str, Any]] = [
    # Forest × services
    {"ecosystem": "forest",         "service": "carbon_sequestration",   "min_usd_ha_yr": 50,     "max_usd_ha_yr": 200,    "mid_usd_ha_yr": 120,    "biome": "tropical",   "source": "Costanza 2014"},
    {"ecosystem": "forest",         "service": "carbon_sequestration",   "min_usd_ha_yr": 20,     "max_usd_ha_yr": 80,     "mid_usd_ha_yr": 45,     "biome": "temperate",  "source": "de Groot 2012"},
    {"ecosystem": "forest",         "service": "water_regulation",       "min_usd_ha_yr": 30,     "max_usd_ha_yr": 150,    "mid_usd_ha_yr": 75,     "biome": "tropical",   "source": "TEEB 2010"},
    {"ecosystem": "forest",         "service": "water_regulation",       "min_usd_ha_yr": 20,     "max_usd_ha_yr": 100,    "mid_usd_ha_yr": 55,     "biome": "temperate",  "source": "TEEB 2010"},
    {"ecosystem": "forest",         "service": "recreation_cultural",    "min_usd_ha_yr": 100,    "max_usd_ha_yr": 500,    "mid_usd_ha_yr": 280,    "biome": "temperate",  "source": "CICES 2021"},
    {"ecosystem": "forest",         "service": "biodiversity_maintenance","min_usd_ha_yr": 80,     "max_usd_ha_yr": 300,    "mid_usd_ha_yr": 170,    "biome": "tropical",   "source": "Brander 2021"},
    {"ecosystem": "forest",         "service": "timber",                 "min_usd_ha_yr": 50,     "max_usd_ha_yr": 250,    "mid_usd_ha_yr": 130,    "biome": "tropical",   "source": "FAO 2020"},
    {"ecosystem": "forest",         "service": "pollination",            "min_usd_ha_yr": 10,     "max_usd_ha_yr": 60,     "mid_usd_ha_yr": 30,     "biome": "all",        "source": "Gallai 2009"},
    # Wetland × services
    {"ecosystem": "wetland_other",  "service": "water_purification",     "min_usd_ha_yr": 500,    "max_usd_ha_yr": 3000,   "mid_usd_ha_yr": 1500,   "biome": "freshwater", "source": "Costanza 2014"},
    {"ecosystem": "wetland_other",  "service": "flood_regulation",       "min_usd_ha_yr": 200,    "max_usd_ha_yr": 1200,   "mid_usd_ha_yr": 650,    "biome": "freshwater", "source": "TEEB 2010"},
    {"ecosystem": "wetland_other",  "service": "carbon_sequestration",   "min_usd_ha_yr": 100,    "max_usd_ha_yr": 500,    "mid_usd_ha_yr": 280,    "biome": "peatland",   "source": "Parish 2008"},
    {"ecosystem": "wetland_other",  "service": "biodiversity_maintenance","min_usd_ha_yr": 150,    "max_usd_ha_yr": 600,    "mid_usd_ha_yr": 350,    "biome": "freshwater", "source": "Brander 2021"},
    {"ecosystem": "wetland_other",  "service": "fisheries",              "min_usd_ha_yr": 100,    "max_usd_ha_yr": 400,    "mid_usd_ha_yr": 230,    "biome": "freshwater", "source": "de Groot 2012"},
    {"ecosystem": "wetland_other",  "service": "water_provisioning",     "min_usd_ha_yr": 80,     "max_usd_ha_yr": 300,    "mid_usd_ha_yr": 170,    "biome": "freshwater", "source": "TEEB 2010"},
    # Coastal marine × services
    {"ecosystem": "coastal_marine", "service": "storm_protection",       "min_usd_ha_yr": 5000,   "max_usd_ha_yr": 50000,  "mid_usd_ha_yr": 22000,  "biome": "mangrove",   "source": "Spalding 2014"},
    {"ecosystem": "coastal_marine", "service": "fisheries",              "min_usd_ha_yr": 200,    "max_usd_ha_yr": 1500,   "mid_usd_ha_yr": 750,    "biome": "coral_reef", "source": "Costanza 2014"},
    {"ecosystem": "coastal_marine", "service": "carbon_sequestration",   "min_usd_ha_yr": 80,     "max_usd_ha_yr": 400,    "mid_usd_ha_yr": 210,    "biome": "mangrove",   "source": "Blue Carbon 2020"},
    {"ecosystem": "coastal_marine", "service": "recreation_cultural",    "min_usd_ha_yr": 300,    "max_usd_ha_yr": 3000,   "mid_usd_ha_yr": 1400,   "biome": "coral_reef", "source": "Cesar 2003"},
    {"ecosystem": "coastal_marine", "service": "biodiversity_maintenance","min_usd_ha_yr": 400,    "max_usd_ha_yr": 2000,   "mid_usd_ha_yr": 1100,   "biome": "coral_reef", "source": "TEEB 2010"},
    {"ecosystem": "coastal_marine", "service": "water_purification",     "min_usd_ha_yr": 100,    "max_usd_ha_yr": 600,    "mid_usd_ha_yr": 320,    "biome": "seagrass",   "source": "Costanza 2014"},
    # Inland water × services
    {"ecosystem": "inland_water",   "service": "water_provisioning",     "min_usd_ha_yr": 300,    "max_usd_ha_yr": 2000,   "mid_usd_ha_yr": 950,    "biome": "river_lake", "source": "TEEB 2010"},
    {"ecosystem": "inland_water",   "service": "fisheries",              "min_usd_ha_yr": 150,    "max_usd_ha_yr": 700,    "mid_usd_ha_yr": 400,    "biome": "river_lake", "source": "de Groot 2012"},
    {"ecosystem": "inland_water",   "service": "water_purification",     "min_usd_ha_yr": 200,    "max_usd_ha_yr": 1000,   "mid_usd_ha_yr": 550,    "biome": "river_lake", "source": "Costanza 2014"},
    {"ecosystem": "inland_water",   "service": "recreation_cultural",    "min_usd_ha_yr": 100,    "max_usd_ha_yr": 800,    "mid_usd_ha_yr": 400,    "biome": "river_lake", "source": "CICES 2021"},
    {"ecosystem": "inland_water",   "service": "flood_regulation",       "min_usd_ha_yr": 100,    "max_usd_ha_yr": 500,    "mid_usd_ha_yr": 280,    "biome": "river",      "source": "TEEB 2010"},
    # Grassland/shrubland × services
    {"ecosystem": "shrub_grassland","service": "carbon_sequestration",   "min_usd_ha_yr": 10,     "max_usd_ha_yr": 60,     "mid_usd_ha_yr": 30,     "biome": "grassland",  "source": "de Groot 2012"},
    {"ecosystem": "shrub_grassland","service": "pollination",            "min_usd_ha_yr": 20,     "max_usd_ha_yr": 120,    "mid_usd_ha_yr": 65,     "biome": "grassland",  "source": "Gallai 2009"},
    {"ecosystem": "shrub_grassland","service": "grazing_provisioning",   "min_usd_ha_yr": 30,     "max_usd_ha_yr": 150,    "mid_usd_ha_yr": 85,     "biome": "grassland",  "source": "FAO 2020"},
    {"ecosystem": "shrub_grassland","service": "water_regulation",       "min_usd_ha_yr": 10,     "max_usd_ha_yr": 80,     "mid_usd_ha_yr": 40,     "biome": "grassland",  "source": "TEEB 2010"},
    {"ecosystem": "shrub_grassland","service": "biodiversity_maintenance","min_usd_ha_yr": 30,     "max_usd_ha_yr": 200,    "mid_usd_ha_yr": 100,    "biome": "savanna",    "source": "Brander 2021"},
    # Cultivated × services
    {"ecosystem": "cultivated",     "service": "food_provisioning",      "min_usd_ha_yr": 200,    "max_usd_ha_yr": 2000,   "mid_usd_ha_yr": 900,    "biome": "cropland",   "source": "FAO 2020"},
    {"ecosystem": "cultivated",     "service": "fiber_provisioning",     "min_usd_ha_yr": 50,     "max_usd_ha_yr": 400,    "mid_usd_ha_yr": 200,    "biome": "cropland",   "source": "FAO 2020"},
    {"ecosystem": "cultivated",     "service": "pollination",            "min_usd_ha_yr": 40,     "max_usd_ha_yr": 200,    "mid_usd_ha_yr": 110,    "biome": "cropland",   "source": "Gallai 2009"},
    {"ecosystem": "cultivated",     "service": "water_regulation",       "min_usd_ha_yr": 15,     "max_usd_ha_yr": 80,     "mid_usd_ha_yr": 40,     "biome": "cropland",   "source": "TEEB 2010"},
    # Urban × services
    {"ecosystem": "urban",          "service": "recreation_cultural",    "min_usd_ha_yr": 500,    "max_usd_ha_yr": 5000,   "mid_usd_ha_yr": 2200,   "biome": "urban_park", "source": "Czembrowski 2016"},
    {"ecosystem": "urban",          "service": "urban_cooling",          "min_usd_ha_yr": 200,    "max_usd_ha_yr": 2000,   "mid_usd_ha_yr": 900,    "biome": "urban_tree", "source": "Loughner 2012"},
    {"ecosystem": "urban",          "service": "noise_attenuation",      "min_usd_ha_yr": 100,    "max_usd_ha_yr": 800,    "mid_usd_ha_yr": 380,    "biome": "urban_green","source": "WHO 2018"},
    {"ecosystem": "urban",          "service": "flood_regulation",       "min_usd_ha_yr": 300,    "max_usd_ha_yr": 2000,   "mid_usd_ha_yr": 900,    "biome": "urban_wet",  "source": "EEA 2019"},
    # Additional mixed
    {"ecosystem": "forest",         "service": "food_provisioning",      "min_usd_ha_yr": 20,     "max_usd_ha_yr": 100,    "mid_usd_ha_yr": 55,     "biome": "agroforest", "source": "FAO 2020"},
    {"ecosystem": "coastal_marine", "service": "food_provisioning",      "min_usd_ha_yr": 500,    "max_usd_ha_yr": 3000,   "mid_usd_ha_yr": 1500,   "biome": "aquaculture","source": "FAO 2020"},
    {"ecosystem": "wetland_other",  "service": "recreation_cultural",    "min_usd_ha_yr": 80,     "max_usd_ha_yr": 400,    "mid_usd_ha_yr": 200,    "biome": "freshwater", "source": "CICES 2021"},
    {"ecosystem": "shrub_grassland","service": "tourism",                "min_usd_ha_yr": 20,     "max_usd_ha_yr": 150,    "mid_usd_ha_yr": 75,     "biome": "savanna",    "source": "TEEB 2010"},
    {"ecosystem": "forest",         "service": "spiritual_cultural",     "min_usd_ha_yr": 10,     "max_usd_ha_yr": 80,     "mid_usd_ha_yr": 40,     "biome": "all",        "source": "Millenium EA 2005"},
    {"ecosystem": "wetland_other",  "service": "carbon_sequestration",   "min_usd_ha_yr": 200,    "max_usd_ha_yr": 1200,   "mid_usd_ha_yr": 650,    "biome": "mangrove",   "source": "Blue Carbon 2020"},
    {"ecosystem": "inland_water",   "service": "biodiversity_maintenance","min_usd_ha_yr": 100,    "max_usd_ha_yr": 500,    "mid_usd_ha_yr": 280,    "biome": "river_lake", "source": "Brander 2021"},
    {"ecosystem": "coastal_marine", "service": "water_purification",     "min_usd_ha_yr": 150,    "max_usd_ha_yr": 800,    "mid_usd_ha_yr": 430,    "biome": "estuary",    "source": "Costanza 2014"},
    {"ecosystem": "cultivated",     "service": "carbon_sequestration",   "min_usd_ha_yr": 5,      "max_usd_ha_yr": 40,     "mid_usd_ha_yr": 18,     "biome": "cropland",   "source": "de Groot 2012"},
    {"ecosystem": "shrub_grassland","service": "water_purification",     "min_usd_ha_yr": 15,     "max_usd_ha_yr": 100,    "mid_usd_ha_yr": 50,     "biome": "grassland",  "source": "TEEB 2010"},
    {"ecosystem": "urban",          "service": "carbon_sequestration",   "min_usd_ha_yr": 30,     "max_usd_ha_yr": 200,    "mid_usd_ha_yr": 100,    "biome": "urban_tree", "source": "Nowak 2014"},
    {"ecosystem": "forest",         "service": "genetic_resources",      "min_usd_ha_yr": 20,     "max_usd_ha_yr": 120,    "mid_usd_ha_yr": 60,     "biome": "tropical",   "source": "Costanza 2014"},
]

# ---------------------------------------------------------------------------
# ENCORE — 20 key sub-industries × dependency strength on ecosystem services
# Dependency scale: VH=Very High, H=High, M=Medium, L=Low
# ---------------------------------------------------------------------------

ENCORE_DEPENDENCIES: dict[str, dict[str, str]] = {
    "crop_production": {
        "water_provisioning": "VH", "pollination": "VH", "soil_quality": "VH",
        "climate_regulation": "H",  "pest_regulation": "H", "water_purification": "M",
        "flood_regulation": "M",    "genetic_resources": "H",
    },
    "livestock_production": {
        "water_provisioning": "VH", "grazing_provisioning": "VH", "water_purification": "H",
        "climate_regulation": "M",  "disease_regulation": "H",    "biodiversity_maintenance": "M",
    },
    "fishing_aquaculture": {
        "fisheries": "VH",          "water_quality": "VH",        "water_provisioning": "H",
        "flood_regulation": "M",    "biodiversity_maintenance": "H","climate_regulation": "M",
    },
    "forestry_logging": {
        "timber": "VH",             "water_regulation": "H",      "biodiversity_maintenance": "H",
        "carbon_sequestration": "H","soil_quality": "M",          "climate_regulation": "M",
    },
    "mining_metals": {
        "water_provisioning": "H",  "water_purification": "M",    "flood_regulation": "L",
        "biodiversity_maintenance": "M", "climate_regulation": "L",
    },
    "oil_gas_extraction": {
        "water_provisioning": "H",  "climate_regulation": "VH",   "biodiversity_maintenance": "M",
        "water_purification": "M",  "flood_regulation": "L",
    },
    "electric_utilities": {
        "water_provisioning": "VH", "climate_regulation": "H",    "flood_regulation": "H",
        "water_purification": "M",  "biodiversity_maintenance": "M",
    },
    "water_utilities": {
        "water_provisioning": "VH", "water_purification": "VH",   "flood_regulation": "H",
        "water_regulation": "H",    "biodiversity_maintenance": "M",
    },
    "construction": {
        "water_provisioning": "H",  "flood_regulation": "H",      "biodiversity_maintenance": "M",
        "soil_quality": "M",        "water_purification": "M",    "climate_regulation": "L",
    },
    "real_estate": {
        "flood_regulation": "H",    "water_provisioning": "M",    "urban_cooling": "M",
        "noise_attenuation": "M",   "recreation_cultural": "M",   "biodiversity_maintenance": "L",
    },
    "food_beverage": {
        "water_provisioning": "VH", "food_provisioning": "VH",    "pollination": "H",
        "climate_regulation": "H",  "water_purification": "H",    "genetic_resources": "M",
    },
    "pharmaceuticals": {
        "genetic_resources": "VH",  "water_provisioning": "H",    "biodiversity_maintenance": "H",
        "climate_regulation": "M",  "water_purification": "M",
    },
    "textiles_apparel": {
        "water_provisioning": "H",  "fiber_provisioning": "VH",   "water_purification": "M",
        "pollination": "M",         "climate_regulation": "M",
    },
    "paper_packaging": {
        "timber": "VH",             "water_provisioning": "H",    "water_regulation": "H",
        "biodiversity_maintenance": "M", "climate_regulation": "M",
    },
    "chemicals": {
        "water_provisioning": "H",  "water_purification": "H",    "biodiversity_maintenance": "M",
        "climate_regulation": "M",  "genetic_resources": "L",
    },
    "tourism_hospitality": {
        "recreation_cultural": "VH","aesthetic_experience": "VH", "biodiversity_maintenance": "H",
        "water_provisioning": "H",  "fisheries": "M",             "climate_regulation": "H",
    },
    "banking_finance": {
        "climate_regulation": "M",  "water_provisioning": "L",    "flood_regulation": "M",
        "biodiversity_maintenance": "L",
    },
    "insurance": {
        "flood_regulation": "H",    "storm_protection": "H",      "climate_regulation": "H",
        "biodiversity_maintenance": "M", "water_purification": "L",
    },
    "transport_logistics": {
        "water_provisioning": "M",  "flood_regulation": "H",      "climate_regulation": "M",
        "biodiversity_maintenance": "L",
    },
    "telecoms_technology": {
        "climate_regulation": "M",  "water_provisioning": "M",    "urban_cooling": "L",
        "biodiversity_maintenance": "L",
    },
}

# ---------------------------------------------------------------------------
# Natural Capital Protocol — 4 steps
# ---------------------------------------------------------------------------

NCP_STEPS: dict[str, dict[str, Any]] = {
    "frame": {
        "step": 1, "label": "Frame",
        "questions": ["Why conduct the assessment?", "What type of decision?", "Who are the stakeholders?"],
        "outputs": ["business_case", "decision_type", "stakeholder_map"],
        "assessment_types": ["direct_use", "indirect_use", "benefit_transfer"],
    },
    "scope": {
        "step": 2, "label": "Scope",
        "questions": ["What natural capital to include?", "What spatial/temporal boundaries?", "Which stakeholders affected?"],
        "outputs": ["natural_capital_inventory", "spatial_boundary", "time_horizon"],
    },
    "measure": {
        "step": 3, "label": "Measure & Value",
        "questions": ["What metrics to use?", "What is current state/trend?", "What are dependencies and impacts?"],
        "outputs": ["baseline_metrics", "trend_analysis", "dependency_map", "impact_assessment"],
    },
    "value": {
        "step": 4, "label": "Apply",
        "questions": ["What does the value mean for decisions?", "What actions to take?", "How to integrate?"],
        "outputs": ["decision_recommendations", "action_plan", "integration_roadmap", "monitoring_plan"],
    },
}

# ---------------------------------------------------------------------------
# Total Economic Value (TEV) framework
# ---------------------------------------------------------------------------

TEV_FRAMEWORK: dict[str, Any] = {
    "use_values": {
        "direct_use": {
            "description": "Direct consumptive/non-consumptive use",
            "examples": ["food", "fiber", "water", "timber", "recreation"],
            "valuation_methods": ["market_price", "cost_of_production", "travel_cost"],
        },
        "indirect_use": {
            "description": "Functional benefits / ecosystem services",
            "examples": ["flood control", "water purification", "carbon sequestration", "pollination"],
            "valuation_methods": ["replacement_cost", "avoided_cost", "hedonic_pricing"],
        },
        "option_value": {
            "description": "Future potential use value",
            "examples": ["pharmaceutical discovery", "genetic resources", "future tourism"],
            "valuation_methods": ["contingent_valuation", "option_pricing"],
        },
    },
    "non_use_values": {
        "existence_value": {
            "description": "Value of knowing ecosystem exists regardless of use",
            "examples": ["rare species", "pristine wilderness", "cultural heritage landscapes"],
            "valuation_methods": ["contingent_valuation", "benefit_transfer"],
        },
        "bequest_value": {
            "description": "Value of preserving for future generations",
            "examples": ["biodiversity hotspots", "old-growth forests", "coral reefs"],
            "valuation_methods": ["contingent_valuation"],
        },
    },
}

# ---------------------------------------------------------------------------
# TNFD LEAP framework — 4 steps with scoring rubric
# ---------------------------------------------------------------------------

TNFD_LEAP_FRAMEWORK: dict[str, Any] = {
    "locate": {
        "step": 1, "max_score": 25,
        "description": "Identify business units and value chain in interface with nature",
        "criteria": {
            "asset_mapping":         {"max_pts": 6, "tools": ["IBAT", "GlobCover", "WDPA", "ENCORE"]},
            "sensitive_areas":       {"max_pts": 6, "tools": ["IBAT", "KBA", "WDPA", "Ramsar"]},
            "value_chain_scope":     {"max_pts": 7, "tools": ["GloBE", "ENCORE", "supply_chain_DB"]},
            "data_quality_locate":   {"max_pts": 6, "tools": ["satellite_data", "field_survey"]},
        },
    },
    "evaluate": {
        "step": 2, "max_score": 25,
        "description": "Evaluate dependencies and impacts on nature across all priority locations",
        "criteria": {
            "dependency_assessment": {"max_pts": 7, "tools": ["ENCORE", "TNFD_guidance"]},
            "impact_assessment":     {"max_pts": 7, "tools": ["LCA", "IPBES", "ENCORE"]},
            "trend_analysis":        {"max_pts": 5, "tools": ["ESA_CCI", "GEE", "GBIF"]},
            "data_quality_evaluate": {"max_pts": 6, "tools": ["third_party_data", "internal_monitoring"]},
        },
    },
    "assess": {
        "step": 3, "max_score": 25,
        "description": "Assess material risks and opportunities from nature across TNFD pillars",
        "criteria": {
            "physical_risk_assess":  {"max_pts": 7, "tools": ["scenario_analysis", "IPBES_scenarios"]},
            "transition_risk_assess":{"max_pts": 6, "tools": ["SBTN", "regulatory_pipeline"]},
            "opportunity_assess":    {"max_pts": 6, "tools": ["NCP", "TNFD_guidance"]},
            "materiality_thresh":    {"max_pts": 6, "tools": ["double_materiality", "financial_materiality"]},
        },
    },
    "prepare": {
        "step": 4, "max_score": 25,
        "description": "Prepare TNFD-aligned disclosures under Governance / Strategy / Risk Mgmt / Metrics",
        "criteria": {
            "governance_disclosure": {"max_pts": 7, "framework": "TNFD_Pillar_1"},
            "strategy_disclosure":   {"max_pts": 6, "framework": "TNFD_Pillar_2"},
            "risk_mgmt_disclosure":  {"max_pts": 6, "framework": "TNFD_Pillar_3"},
            "metrics_disclosure":    {"max_pts": 6, "framework": "TNFD_Pillar_4"},
        },
    },
}

# ---------------------------------------------------------------------------
# SBTN 5-step readiness framework
# ---------------------------------------------------------------------------

SBTN_READINESS: dict[str, Any] = {
    1: {
        "name": "Assess",
        "description": "Screen and prioritise using ENCORE and sector lists; identify hotspots",
        "target_types": ["freshwater", "land", "ocean"],
        "readiness_indicators": ["encore_screening", "sector_hotspot_map", "value_chain_prioritisation"],
        "max_score": 20,
    },
    2: {
        "name": "Interpret",
        "description": "Understand current state and trends; select relevant targets and metrics",
        "target_types": ["freshwater", "land", "ocean"],
        "readiness_indicators": ["baseline_established", "pressure_analysis", "target_type_selected"],
        "max_score": 20,
    },
    3: {
        "name": "Set",
        "description": "Set science-based targets using SBTN methods; align to freshwater/land/ocean guidance",
        "target_types": ["freshwater", "land", "ocean"],
        "readiness_indicators": ["target_drafted", "science_basis_documented", "board_approved"],
        "max_score": 20,
    },
    4: {
        "name": "Act",
        "description": "Implement mitigation hierarchy and value chain actions",
        "target_types": ["freshwater", "land", "ocean"],
        "readiness_indicators": ["mitigation_hierarchy", "site_action_plans", "supplier_engagement"],
        "max_score": 20,
    },
    5: {
        "name": "Track",
        "description": "Monitor, verify and publicly disclose progress against targets",
        "target_types": ["freshwater", "land", "ocean"],
        "readiness_indicators": ["monitoring_system", "third_party_verification", "public_disclosure"],
        "max_score": 20,
    },
}

# IPBES — 18 ecosystem services mapped to 5 NCP categories
IPBES_NCP_MAPPING: dict[str, str] = {
    "food_provisioning":         "material_non_material",
    "water_provisioning":        "material_non_material",
    "timber":                    "material_non_material",
    "fiber_provisioning":        "material_non_material",
    "fisheries":                 "material_non_material",
    "grazing_provisioning":      "material_non_material",
    "genetic_resources":         "material_non_material",
    "carbon_sequestration":      "regulating",
    "water_regulation":          "regulating",
    "water_purification":        "regulating",
    "flood_regulation":          "regulating",
    "storm_protection":          "regulating",
    "pollination":               "regulating",
    "biodiversity_maintenance":  "regulating",
    "climate_regulation":        "regulating",
    "noise_attenuation":         "non_material",
    "recreation_cultural":       "non_material",
    "spiritual_cultural":        "non_material",
}

# ---------------------------------------------------------------------------
# Country risk multipliers for TEV (simplified)
# ---------------------------------------------------------------------------

COUNTRY_RISK_MULTIPLIERS: dict[str, float] = {
    "BRA": 1.20, "IDN": 1.25, "COD": 1.30, "IND": 1.15, "CHN": 1.10,
    "USA": 0.90, "DEU": 0.88, "FRA": 0.87, "GBR": 0.89, "AUS": 0.92,
    "ZAF": 1.12, "NGA": 1.28, "ETH": 1.35, "ARG": 1.18, "MEX": 1.14,
    "CAN": 0.91, "SWE": 0.85, "NOR": 0.86, "NZL": 0.90, "JPN": 0.92,
}


# ---------------------------------------------------------------------------
# Engine class
# ---------------------------------------------------------------------------

class NatureCapitalAccountingEngine:
    """
    E116 — Nature Capital Accounting Engine
    Implements SEEA EA 2021, NCP 2016, TEV, TNFD LEAP, SBTN readiness.
    No database calls — all computations are in-memory.
    """

    # ------------------------------------------------------------------
    # SEEA Ecosystem Accounting
    # ------------------------------------------------------------------

    def conduct_seea_accounting(
        self,
        entity_data: dict[str, Any],
        land_area_ha: float,
        ecosystem_types: dict[str, float],
    ) -> dict[str, Any]:
        """
        Produce SEEA Ecosystem Accounts for an entity.
        ecosystem_types: {eco_type: fraction_of_total_area} — must sum to ~1.0
        Returns extent accounts, condition indices, service flows (physical + monetary), total asset value.
        """
        seed = abs(hash(entity_data.get("entity_id", "default"))) % 10_000
        rng = random.Random(seed)

        # Normalise fractions
        total_frac = sum(ecosystem_types.values()) or 1.0
        normalised = {k: v / total_frac for k, v in ecosystem_types.items()}

        # --- Extent Accounts ---
        extent_accounts: dict[str, dict[str, Any]] = {}
        for eco, frac in normalised.items():
            meta = SEEA_ECOSYSTEM_TYPES.get(eco, SEEA_ECOSYSTEM_TYPES["forest"])
            area = round(land_area_ha * frac, 2)
            extent_accounts[eco] = {
                "label": meta["label"],
                "area_ha": area,
                "fraction_pct": round(frac * 100, 2),
                "typical_services": meta["typical_services"],
            }

        # --- Condition Accounts ---
        condition_accounts: dict[str, dict[str, Any]] = {}
        for eco, frac in normalised.items():
            meta = SEEA_ECOSYSTEM_TYPES.get(eco, SEEA_ECOSYSTEM_TYPES["forest"])
            base_ci = meta["avg_condition_index_baseline"]
            indicator_scores: dict[str, float] = {}
            weighted_sum = 0.0
            for ind_code, ind_meta in SEEA_CONDITION_INDICATORS.items():
                noise = rng.uniform(-0.08, 0.08)
                raw_score = max(0.0, min(1.0, base_ci + noise))
                indicator_scores[ind_code] = round(raw_score, 3)
                weighted_sum += raw_score * ind_meta["weight"]
            condition_index = round(weighted_sum, 3)
            condition_grade = (
                "Excellent" if condition_index >= 0.75
                else "Good" if condition_index >= 0.60
                else "Moderate" if condition_index >= 0.45
                else "Poor"
            )
            condition_accounts[eco] = {
                "condition_index": condition_index,
                "condition_grade": condition_grade,
                "indicator_scores": indicator_scores,
            }

        # --- Ecosystem Services Flow Accounts ---
        service_flows: dict[str, dict[str, Any]] = {}
        total_monetary_value_usd = 0.0

        for eco, frac in normalised.items():
            area = land_area_ha * frac
            meta = SEEA_ECOSYSTEM_TYPES.get(eco, SEEA_ECOSYSTEM_TYPES["forest"])
            for svc in meta["typical_services"]:
                bench_entries = [
                    b for b in VALUATION_BENCHMARKS
                    if b["ecosystem"] == eco and b["service"] == svc
                ]
                if bench_entries:
                    bench = bench_entries[0]
                    mid_rate = bench["mid_usd_ha_yr"]
                else:
                    mid_rate = rng.uniform(50, 300)

                ci = condition_accounts[eco]["condition_index"]
                physical_flow = round(area * ci * rng.uniform(0.85, 1.15), 1)  # unit-less index units
                monetary_flow = round(area * mid_rate * ci, 0)
                total_monetary_value_usd += monetary_flow
                svc_key = f"{eco}::{svc}"
                service_flows[svc_key] = {
                    "ecosystem": eco,
                    "service": svc,
                    "area_ha": round(area, 2),
                    "condition_index": ci,
                    "physical_flow_units": physical_flow,
                    "monetary_flow_usd_yr": monetary_flow,
                    "valuation_method": "benefit_transfer",
                    "benchmark_source": bench_entries[0]["source"] if bench_entries else "internal_estimate",
                }

        # --- Total Ecosystem Asset Value ---
        discount_rate = 0.04
        time_horizon_yr = 30
        annuity_factor = (1 - (1 + discount_rate) ** -time_horizon_yr) / discount_rate
        total_asset_value_usd = round(total_monetary_value_usd * annuity_factor, 0)

        # Weighted average condition
        weighted_condition = round(
            sum(
                condition_accounts[eco]["condition_index"] * normalised[eco]
                for eco in normalised
            ), 3
        )

        return {
            "entity_id": entity_data.get("entity_id"),
            "entity_name": entity_data.get("entity_name"),
            "total_land_area_ha": land_area_ha,
            "seea_version": "UN SEEA EA 2021",
            "extent_accounts": extent_accounts,
            "condition_accounts": condition_accounts,
            "ecosystem_service_flows": service_flows,
            "summary": {
                "total_annual_service_value_usd": round(total_monetary_value_usd, 0),
                "total_ecosystem_asset_value_usd": total_asset_value_usd,
                "weighted_avg_condition_index": weighted_condition,
                "number_of_ecosystem_types": len(normalised),
                "number_of_service_flows": len(service_flows),
                "discount_rate_pct": discount_rate * 100,
                "time_horizon_yr": time_horizon_yr,
                "annuity_factor": round(annuity_factor, 4),
            },
        }

    # ------------------------------------------------------------------
    # Natural Capital Protocol
    # ------------------------------------------------------------------

    def apply_natural_capital_protocol(
        self,
        entity_data: dict[str, Any],
        scope: dict[str, Any],
        assessment_type: str = "direct",
    ) -> dict[str, Any]:
        """
        NCP 2016 — 4-step assessment.
        Returns business value (revenue at risk / dependency), social value, material issues.
        """
        seed = abs(hash(str(entity_data.get("entity_id", "")) + assessment_type)) % 10_000
        rng = random.Random(seed)

        revenue_usd = entity_data.get("annual_revenue_usd", 10_000_000)
        sector = entity_data.get("sector", "food_beverage")
        land_ha = scope.get("land_area_ha", 1000.0)

        # Step 1 — Frame
        frame_result = {
            "decision_type": scope.get("decision_type", "corporate_strategy"),
            "assessment_type": assessment_type,
            "stakeholder_map": {
                "primary": ["investors", "regulators", "local_communities"],
                "secondary": ["suppliers", "customers", "NGOs"],
                "tertiary": ["media", "academia"],
            },
            "business_case_score": rng.randint(60, 95),
        }

        # Step 2 — Scope
        encore_deps = ENCORE_DEPENDENCIES.get(sector, ENCORE_DEPENDENCIES["banking_finance"])
        high_deps = [k for k, v in encore_deps.items() if v in ("VH", "H")]
        scope_result = {
            "natural_capital_inventory": list(encore_deps.keys()),
            "high_dependency_services": high_deps,
            "spatial_boundary_km2": scope.get("spatial_boundary_km2", land_ha * 0.01),
            "time_horizon_yr": scope.get("time_horizon_yr", 10),
        }

        # Step 3 — Measure
        dependency_scores: dict[str, float] = {}
        for svc, strength in encore_deps.items():
            dep_val = {"VH": 0.90, "H": 0.65, "M": 0.40, "L": 0.20}.get(strength, 0.10)
            dependency_scores[svc] = round(dep_val + rng.uniform(-0.05, 0.05), 3)

        weighted_dep = sum(dependency_scores.values()) / max(len(dependency_scores), 1)
        impact_score = round(rng.uniform(0.3, 0.8), 3)

        measure_result = {
            "dependency_scores": dependency_scores,
            "weighted_dependency_index": round(weighted_dep, 3),
            "impact_score": impact_score,
            "trend": rng.choice(["declining", "stable", "improving"]),
        }

        # Step 4 — Value
        revenue_at_risk_pct = weighted_dep * 0.25 * rng.uniform(0.8, 1.2)
        revenue_at_risk_usd = round(revenue_usd * revenue_at_risk_pct, 0)
        social_value_usd = round(land_ha * rng.uniform(200, 1500), 0)
        dependency_value_usd = round(revenue_usd * weighted_dep * 0.15, 0)

        material_issues = []
        for svc in high_deps[:4]:
            material_issues.append({
                "service": svc,
                "dependency_strength": encore_deps.get(svc, "M"),
                "financial_materiality": dependency_scores.get(svc, 0.5) > 0.6,
                "action_recommended": f"Integrate {svc} dependency into procurement strategy",
            })

        value_result = {
            "revenue_at_risk_usd": revenue_at_risk_usd,
            "revenue_at_risk_pct": round(revenue_at_risk_pct * 100, 2),
            "dependency_value_usd": dependency_value_usd,
            "social_value_usd": social_value_usd,
            "total_ncp_business_value_usd": revenue_at_risk_usd + dependency_value_usd,
            "material_issues": material_issues,
            "action_recommendations": [
                "Map tier-1 supplier dependencies on water and soil",
                "Integrate NCP into annual reporting",
                "Set science-based targets for nature (SBTN)",
                "Engage with watershed stewardship programmes",
            ][:len(high_deps)],
        }

        return {
            "entity_id": entity_data.get("entity_id"),
            "entity_name": entity_data.get("entity_name"),
            "sector": sector,
            "assessment_type": assessment_type,
            "ncp_version": "NCC 2016",
            "frame": frame_result,
            "scope": scope_result,
            "measure": measure_result,
            "value": value_result,
            "overall_materiality": "high" if revenue_at_risk_pct > 0.10 else "medium" if revenue_at_risk_pct > 0.04 else "low",
        }

    # ------------------------------------------------------------------
    # Total Economic Value
    # ------------------------------------------------------------------

    def calculate_tev(
        self,
        ecosystem_type: str,
        land_area_ha: float,
        country_iso: str = "USA",
    ) -> dict[str, Any]:
        """
        TEV decomposition: direct use + indirect use + option + existence + bequest.
        Returns value breakdown, method mix, uncertainty range.
        """
        seed = abs(hash(f"{ecosystem_type}{land_area_ha:.0f}{country_iso}")) % 10_000
        rng = random.Random(seed)

        country_mult = COUNTRY_RISK_MULTIPLIERS.get(country_iso.upper(), 1.0)
        eco_meta = SEEA_ECOSYSTEM_TYPES.get(ecosystem_type, SEEA_ECOSYSTEM_TYPES["forest"])

        # Build service benchmarks for this ecosystem type
        eco_benches = [b for b in VALUATION_BENCHMARKS if b["ecosystem"] == ecosystem_type]

        # Direct use value
        du_services = [s for s in eco_meta["typical_services"] if s in (
            "food_provisioning", "water_provisioning", "timber", "fisheries",
            "grazing_provisioning", "fiber_provisioning", "recreation_cultural", "tourism"
        )]
        direct_use_usd_yr = 0.0
        direct_use_breakdown: list[dict] = []
        for svc in du_services:
            benches = [b for b in eco_benches if b["service"] == svc]
            mid = benches[0]["mid_usd_ha_yr"] if benches else rng.uniform(50, 300)
            val = land_area_ha * mid * country_mult * rng.uniform(0.9, 1.1)
            direct_use_usd_yr += val
            direct_use_breakdown.append({
                "service": svc,
                "usd_ha_yr": round(mid * country_mult, 2),
                "total_usd_yr": round(val, 0),
                "method": "market_price" if svc in ("food_provisioning", "timber", "fisheries") else "travel_cost",
            })

        # Indirect use value (ecosystem services)
        iu_services = [s for s in eco_meta["typical_services"] if s not in (
            "food_provisioning", "timber", "fisheries", "grazing_provisioning",
            "fiber_provisioning", "recreation_cultural", "tourism"
        )]
        indirect_use_usd_yr = 0.0
        indirect_use_breakdown: list[dict] = []
        for svc in iu_services:
            benches = [b for b in eco_benches if b["service"] == svc]
            mid = benches[0]["mid_usd_ha_yr"] if benches else rng.uniform(100, 800)
            val = land_area_ha * mid * country_mult * rng.uniform(0.85, 1.15)
            indirect_use_usd_yr += val
            indirect_use_breakdown.append({
                "service": svc,
                "usd_ha_yr": round(mid * country_mult, 2),
                "total_usd_yr": round(val, 0),
                "method": "replacement_cost",
            })

        # Option value (20-35% of direct+indirect use)
        option_rate = rng.uniform(0.20, 0.35)
        option_value_usd_yr = (direct_use_usd_yr + indirect_use_usd_yr) * option_rate

        # Non-use values
        existence_rate = rng.uniform(0.10, 0.25)
        bequest_rate = rng.uniform(0.08, 0.18)
        existence_value_usd_yr = (direct_use_usd_yr + indirect_use_usd_yr) * existence_rate
        bequest_value_usd_yr = (direct_use_usd_yr + indirect_use_usd_yr) * bequest_rate

        total_usd_yr = (
            direct_use_usd_yr + indirect_use_usd_yr +
            option_value_usd_yr + existence_value_usd_yr + bequest_value_usd_yr
        )

        # Capitalised TEV (30-yr @ 4%)
        annuity_factor = (1 - 1.04 ** -30) / 0.04
        tev_capitalised = total_usd_yr * annuity_factor

        uncertainty_low = total_usd_yr * 0.60
        uncertainty_high = total_usd_yr * 1.80

        return {
            "ecosystem_type": ecosystem_type,
            "land_area_ha": land_area_ha,
            "country_iso": country_iso.upper(),
            "country_risk_multiplier": country_mult,
            "use_values": {
                "direct_use": {
                    "total_usd_yr": round(direct_use_usd_yr, 0),
                    "breakdown": direct_use_breakdown,
                },
                "indirect_use": {
                    "total_usd_yr": round(indirect_use_usd_yr, 0),
                    "breakdown": indirect_use_breakdown,
                },
                "option_value": {
                    "total_usd_yr": round(option_value_usd_yr, 0),
                    "rate_applied_pct": round(option_rate * 100, 1),
                    "method": "contingent_valuation",
                },
            },
            "non_use_values": {
                "existence_value": {
                    "total_usd_yr": round(existence_value_usd_yr, 0),
                    "rate_applied_pct": round(existence_rate * 100, 1),
                    "method": "contingent_valuation",
                },
                "bequest_value": {
                    "total_usd_yr": round(bequest_value_usd_yr, 0),
                    "rate_applied_pct": round(bequest_rate * 100, 1),
                    "method": "contingent_valuation",
                },
            },
            "tev_summary": {
                "total_tev_usd_yr": round(total_usd_yr, 0),
                "tev_per_ha_usd_yr": round(total_usd_yr / max(land_area_ha, 1), 2),
                "tev_capitalised_usd": round(tev_capitalised, 0),
                "annuity_factor": round(annuity_factor, 4),
                "discount_rate_pct": 4.0,
                "time_horizon_yr": 30,
            },
            "uncertainty": {
                "low_estimate_usd_yr": round(uncertainty_low, 0),
                "high_estimate_usd_yr": round(uncertainty_high, 0),
                "confidence_level": "medium",
                "note": "±40% uncertainty typical for benefit transfer approaches",
            },
            "valuation_method_mix": {
                "market_price_pct": 30,
                "replacement_cost_pct": 25,
                "travel_cost_pct": 15,
                "contingent_valuation_pct": 20,
                "benefit_transfer_pct": 10,
            },
            "framework": "Total Economic Value — Pearce & Turner 1990 / TEEB 2010",
        }

    # ------------------------------------------------------------------
    # TNFD LEAP Scoring
    # ------------------------------------------------------------------

    def score_tnfd_leap(
        self,
        locate_data: dict[str, Any],
        evaluate_data: dict[str, Any],
        assess_data: dict[str, Any],
        prepare_data: dict[str, Any],
    ) -> dict[str, Any]:
        """
        TNFD LEAP scoring: 4 steps × 25 points each = 0-100 total.
        Inputs are dictionaries with boolean/numeric flags for each criterion.
        """
        all_step_data = {
            "locate": locate_data,
            "evaluate": evaluate_data,
            "assess": assess_data,
            "prepare": prepare_data,
        }

        step_scores: dict[str, dict[str, Any]] = {}
        grand_total = 0

        for step_name, step_cfg in TNFD_LEAP_FRAMEWORK.items():
            step_input = all_step_data[step_name]
            step_max = step_cfg["max_score"]
            criteria = step_cfg["criteria"]
            step_earned = 0
            criterion_results: dict[str, Any] = {}

            for crit_name, crit_cfg in criteria.items():
                crit_max = crit_cfg["max_pts"]
                # Score based on boolean present in input or fraction complete
                completed = step_input.get(crit_name, False)
                if isinstance(completed, bool):
                    pts = crit_max if completed else 0
                elif isinstance(completed, (int, float)):
                    pts = min(crit_max, int(completed * crit_max))
                else:
                    pts = 0
                step_earned += pts
                criterion_results[crit_name] = {"earned": pts, "max": crit_max, "pct": round(pts / crit_max * 100, 1)}

            step_scores[step_name] = {
                "step": step_cfg["step"],
                "description": step_cfg["description"],
                "score_earned": step_earned,
                "score_max": step_max,
                "score_pct": round(step_earned / step_max * 100, 1),
                "criteria": criterion_results,
            }
            grand_total += step_earned

        total_pct = round(grand_total / 100 * 100, 1)
        disclosure_readiness = (
            "Advanced" if grand_total >= 80
            else "Progressing" if grand_total >= 55
            else "Developing" if grand_total >= 30
            else "Initial"
        )

        # Priority areas — lowest-scoring steps
        sorted_steps = sorted(step_scores.items(), key=lambda x: x[1]["score_pct"])
        priority_areas = [s[0] for s in sorted_steps[:2]]

        return {
            "tnfd_version": "v1.0 (Sept 2023)",
            "step_scores": step_scores,
            "total_score": grand_total,
            "total_score_max": 100,
            "total_score_pct": total_pct,
            "disclosure_readiness": disclosure_readiness,
            "disclosure_readiness_tiers": {
                "Advanced": ">=80: Ready for full TNFD disclosure",
                "Progressing": "55-79: Most elements in place; gaps to close",
                "Developing": "30-54: Foundation established; significant work required",
                "Initial": "<30: Early stage; prioritise Locate and Evaluate steps",
            },
            "priority_areas": priority_areas,
            "next_steps": [
                f"Improve '{pa}' step — current score {step_scores[pa]['score_earned']}/{step_scores[pa]['score_max']}"
                for pa in priority_areas
            ],
        }

    # ------------------------------------------------------------------
    # SBTN Readiness
    # ------------------------------------------------------------------

    def assess_sbtn_readiness(
        self,
        entity_data: dict[str, Any],
        target_types: list[str] | None = None,
    ) -> dict[str, Any]:
        """
        SBTN 5-step readiness assessment.
        entity_data should contain per-step flags: step_1_complete, step_2_complete, etc.
        target_types: list of ["freshwater", "land", "ocean"]
        """
        if target_types is None:
            target_types = ["freshwater", "land"]

        step_results: dict[str, Any] = {}
        total_score = 0
        highest_complete_step = 0

        for step_num, step_cfg in SBTN_READINESS.items():
            step_complete = entity_data.get(f"step_{step_num}_complete", False)
            partial_score = entity_data.get(f"step_{step_num}_partial_score", None)

            if step_complete:
                earned = step_cfg["max_score"]
                highest_complete_step = max(highest_complete_step, step_num)
            elif partial_score is not None:
                earned = min(step_cfg["max_score"], int(partial_score * step_cfg["max_score"]))
            else:
                earned = 0

            total_score += earned
            indicator_status: dict[str, str] = {}
            for ind in step_cfg["readiness_indicators"]:
                flag = entity_data.get(ind, False)
                indicator_status[ind] = "complete" if flag else "pending"

            step_results[f"step_{step_num}"] = {
                "name": step_cfg["name"],
                "description": step_cfg["description"],
                "score_earned": earned,
                "score_max": step_cfg["max_score"],
                "score_pct": round(earned / step_cfg["max_score"] * 100, 1),
                "complete": step_complete,
                "indicators": indicator_status,
            }

        # Target completeness per biome
        target_completeness: dict[str, dict[str, Any]] = {}
        for tt in target_types:
            targets_set = entity_data.get(f"{tt}_targets_set", False)
            baseline_est = entity_data.get(f"{tt}_baseline_established", False)
            target_completeness[tt] = {
                "baseline_established": baseline_est,
                "target_set": targets_set,
                "actions_implemented": entity_data.get(f"{tt}_actions_implemented", False),
                "monitoring_active": entity_data.get(f"{tt}_monitoring_active", False),
                "completeness_pct": round(
                    sum([baseline_est, targets_set,
                         entity_data.get(f"{tt}_actions_implemented", False),
                         entity_data.get(f"{tt}_monitoring_active", False)]) / 4 * 100, 1
                ),
            }

        # SET (Science-Based Targets) alignment
        set_alignment = "not_started"
        if highest_complete_step >= 5:
            set_alignment = "fully_aligned"
        elif highest_complete_step >= 3:
            set_alignment = "target_set"
        elif highest_complete_step >= 2:
            set_alignment = "baseline_established"
        elif highest_complete_step >= 1:
            set_alignment = "screened"

        readiness_level = (
            "Advanced" if total_score >= 80
            else "Progressing" if total_score >= 50
            else "Early Stage" if total_score >= 20
            else "Not Started"
        )

        return {
            "entity_id": entity_data.get("entity_id"),
            "entity_name": entity_data.get("entity_name"),
            "sbtn_version": "SBTN v1.1 (2023)",
            "target_types_assessed": target_types,
            "step_results": step_results,
            "step_reached": highest_complete_step,
            "total_score": total_score,
            "total_score_max": 100,
            "readiness_level": readiness_level,
            "set_alignment": set_alignment,
            "target_completeness_by_biome": target_completeness,
            "recommended_next_step": (
                SBTN_READINESS.get(highest_complete_step + 1, {}).get("name", "Maintain & Improve Track")
            ),
            "framework": "SBTN 5-Step Process v1.1 / Science Based Targets for Nature",
        }

    # ------------------------------------------------------------------
    # Reference data helpers
    # ------------------------------------------------------------------

    def ref_seea_ecosystem_types(self) -> dict[str, Any]:
        return {
            "seea_version": "UN SEEA EA 2021",
            "ecosystem_types": SEEA_ECOSYSTEM_TYPES,
            "condition_indicators": SEEA_CONDITION_INDICATORS,
            "cices_services": CICES_ECOSYSTEM_SERVICES,
            "valuation_methods": MONETARY_VALUATION_METHODS,
        }

    def ref_encore_dependencies(self) -> dict[str, Any]:
        return {
            "source": "ENCORE v2.0 — Natural Capital Finance Alliance",
            "dependency_scale": {"VH": "Very High (>80%)", "H": "High (60-80%)", "M": "Medium (30-60%)", "L": "Low (<30%)"},
            "sub_industries": list(ENCORE_DEPENDENCIES.keys()),
            "dependency_matrix": ENCORE_DEPENDENCIES,
        }

    def ref_valuation_benchmarks(self) -> dict[str, Any]:
        return {
            "source_list": ["Costanza 2014", "de Groot 2012", "TEEB 2010", "CICES 2021", "Brander 2021"],
            "unit": "USD/ha/yr (2020 prices)",
            "count": len(VALUATION_BENCHMARKS),
            "benchmarks": VALUATION_BENCHMARKS,
        }

    def ref_tnfd_leap_framework(self) -> dict[str, Any]:
        return {
            "tnfd_version": "v1.0 September 2023",
            "total_score_max": 100,
            "steps": TNFD_LEAP_FRAMEWORK,
            "ipbes_ncp_mapping": IPBES_NCP_MAPPING,
        }


def get_engine() -> NatureCapitalAccountingEngine:
    return NatureCapitalAccountingEngine()
