"""
E110 — Export Credit & Blended Trade Finance ESG Engine
========================================================
Full ESG assessment engine for Export Credit Agencies (ECAs), blended
trade finance instruments, and project finance under OECD Arrangement,
IFC Performance Standards, and Equator Principles IV.

Sub-modules:
  1. ECA Sustainability Profiling — 15 ECA profiles, Paris alignment, fossil exclusions
  2. OECD Common Approaches (2016 rev) — Category A/B/C environmental screening
  3. OECD Arrangement Sector Understandings — CCSU, OSS, RSU, NSU, WSU
  4. IFC Performance Standards (2012) — PS1-PS8 compliance checklist
  5. Equator Principles IV (2020) — 10 principles, project finance applicability
  6. Fossil Fuel Screening — ECA-level exclusion matrix by commodity
  7. Green Trade Finance Classification — ITFC, CCSU-eligible instruments
  8. Berne Union ESG Framework — Prague Club + London Club ESG principles 2022

References:
  - OECD Arrangement on Officially Supported Export Credits (TAD/PG(2022)1)
  - OECD Common Approaches for Officially Supported Export Credits (TAD/ECG(2016)3)
  - IFC Performance Standards on Environmental and Social Sustainability (2012)
  - Equator Principles IV (July 2020)
  - Berne Union ESG Principles (2022)
  - ITFC Green Trade Finance Standards
  - MIGA ESG eligibility framework
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Reference Data — 15 ECA Profiles
# ---------------------------------------------------------------------------

ECA_PROFILES: dict[str, dict] = {
    "UKEF": {
        "full_name": "UK Export Finance",
        "country": "GB",
        "green_bond_eligible": True,
        "paris_alignment_commitment": True,
        "paris_alignment_year": 2021,
        "oecd_arrangement_member": True,
        "fossil_fuel_exclusions": {
            "coal": True,
            "coal_year": 2021,
            "oil_sands": True,
            "oil_sands_year": 2021,
            "upstream_oil_gas": False,
            "lng": False,
        },
        "green_products": ["UKEF Clean Growth Financing Initiative", "Export Development Guarantee (EDG) green tranche"],
        "exclusion_policy": "UKEF Export Finance for International Coal Finance ban (2021); no new direct support for coal exploration/extraction/power",
        "equator_principles_aligned": True,
        "ifc_ps_required": True,
        "berne_union_member": True,
    },
    "COFACE": {
        "full_name": "Compagnie Française d'Assurance pour le Commerce Extérieur",
        "country": "FR",
        "green_bond_eligible": True,
        "paris_alignment_commitment": True,
        "paris_alignment_year": 2021,
        "oecd_arrangement_member": True,
        "fossil_fuel_exclusions": {
            "coal": True,
            "coal_year": 2021,
            "oil_sands": True,
            "oil_sands_year": 2022,
            "upstream_oil_gas": False,
            "lng": False,
        },
        "green_products": ["COFACE Green Export Guarantee", "Climate Finance Facility"],
        "exclusion_policy": "No new coal mining or coal-fired power plant cover from 2021; oil sands excluded from 2022",
        "equator_principles_aligned": True,
        "ifc_ps_required": True,
        "berne_union_member": True,
    },
    "EULER_HERMES_AGA": {
        "full_name": "Euler Hermes/AGA (Germany — Hermes Cover)",
        "country": "DE",
        "green_bond_eligible": True,
        "paris_alignment_commitment": True,
        "paris_alignment_year": 2022,
        "oecd_arrangement_member": True,
        "fossil_fuel_exclusions": {
            "coal": True,
            "coal_year": 2022,
            "oil_sands": True,
            "oil_sands_year": 2022,
            "upstream_oil_gas": False,
            "lng": False,
        },
        "green_products": ["Hermes Renewable Energy Cover", "Green Hermit Guarantee"],
        "exclusion_policy": "No new coal financing cover from 2022 per German coalition agreement; LNG remains eligible pending energy security review",
        "equator_principles_aligned": True,
        "ifc_ps_required": True,
        "berne_union_member": True,
    },
    "SACE": {
        "full_name": "SACE S.p.A.",
        "country": "IT",
        "green_bond_eligible": True,
        "paris_alignment_commitment": True,
        "paris_alignment_year": 2022,
        "oecd_arrangement_member": True,
        "fossil_fuel_exclusions": {
            "coal": True,
            "coal_year": 2021,
            "oil_sands": True,
            "oil_sands_year": 2022,
            "upstream_oil_gas": False,
            "lng": False,
        },
        "green_products": ["SACE Green", "SACE Green Export Guarantee", "Blue Economy Finance"],
        "exclusion_policy": "Coal phaseout by 2021; oil sands added 2022; LNG strategic carve-out for Italian energy security",
        "equator_principles_aligned": True,
        "ifc_ps_required": True,
        "berne_union_member": True,
    },
    "EKF": {
        "full_name": "EKF Denmark's Export Credit Agency",
        "country": "DK",
        "green_bond_eligible": True,
        "paris_alignment_commitment": True,
        "paris_alignment_year": 2020,
        "oecd_arrangement_member": True,
        "fossil_fuel_exclusions": {
            "coal": True,
            "coal_year": 2019,
            "oil_sands": True,
            "oil_sands_year": 2020,
            "upstream_oil_gas": True,
            "upstream_oil_gas_year": 2023,
            "lng": False,
        },
        "green_products": ["EKF Green Guarantee", "Offshore Wind Export Finance"],
        "exclusion_policy": "Pioneering ECA — upstream oil & gas excluded from 2023; coal since 2019; ambitious climate mandate",
        "equator_principles_aligned": True,
        "ifc_ps_required": True,
        "berne_union_member": True,
    },
    "GIEK": {
        "full_name": "Eksfin (formerly GIEK — Guarantee Institute for Export Credits)",
        "country": "NO",
        "green_bond_eligible": True,
        "paris_alignment_commitment": True,
        "paris_alignment_year": 2021,
        "oecd_arrangement_member": True,
        "fossil_fuel_exclusions": {
            "coal": True,
            "coal_year": 2020,
            "oil_sands": True,
            "oil_sands_year": 2021,
            "upstream_oil_gas": False,
            "lng": False,
        },
        "green_products": ["Eksfin Green Guarantee", "Maritime Low-Carbon Finance"],
        "exclusion_policy": "Coal excluded; LNG permitted as transitional fuel; upstream O&G still eligible reflecting Norway's export base",
        "equator_principles_aligned": True,
        "ifc_ps_required": True,
        "berne_union_member": True,
    },
    "EDC": {
        "full_name": "Export Development Canada",
        "country": "CA",
        "green_bond_eligible": True,
        "paris_alignment_commitment": True,
        "paris_alignment_year": 2021,
        "oecd_arrangement_member": True,
        "fossil_fuel_exclusions": {
            "coal": True,
            "coal_year": 2022,
            "oil_sands": False,
            "upstream_oil_gas": False,
            "lng": False,
        },
        "green_products": ["EDC Clean Technology Finance", "Sustainable Finance Guarantee"],
        "exclusion_policy": "New coal financing ended 2022 per Canadian climate commitments; oil sands excluded from direct cover after 2023 review",
        "equator_principles_aligned": True,
        "ifc_ps_required": True,
        "berne_union_member": True,
    },
    "EXIM_USA": {
        "full_name": "Export-Import Bank of the United States",
        "country": "US",
        "green_bond_eligible": True,
        "paris_alignment_commitment": True,
        "paris_alignment_year": 2021,
        "oecd_arrangement_member": True,
        "fossil_fuel_exclusions": {
            "coal": True,
            "coal_year": 2021,
            "oil_sands": False,
            "upstream_oil_gas": False,
            "lng": False,
        },
        "green_products": ["EXIM Clean Energy Financing Initiative", "Make More in America Clean Energy"],
        "exclusion_policy": "Coal power plant financing banned per Biden EO 14008 (2021); LNG and upstream O&G remain eligible; climate review ongoing",
        "equator_principles_aligned": True,
        "ifc_ps_required": True,
        "berne_union_member": True,
    },
    "JBIC_NEXI": {
        "full_name": "JBIC / NEXI (Japan Bank for International Cooperation / Nippon Export and Investment Insurance)",
        "country": "JP",
        "green_bond_eligible": True,
        "paris_alignment_commitment": True,
        "paris_alignment_year": 2022,
        "oecd_arrangement_member": True,
        "fossil_fuel_exclusions": {
            "coal": False,
            "oil_sands": False,
            "upstream_oil_gas": False,
            "lng": False,
        },
        "green_products": ["JBIC Green Finance Initiative", "NEXI Sustainability Bond", "Transition Finance Framework"],
        "exclusion_policy": "No blanket coal exclusion as of 2024; G7 pressure for phaseout; transition finance framing for high-efficiency coal (ultra-supercritical); LNG strategic for energy security",
        "equator_principles_aligned": True,
        "ifc_ps_required": True,
        "berne_union_member": True,
    },
    "K_EXIM": {
        "full_name": "Export-Import Bank of Korea",
        "country": "KR",
        "green_bond_eligible": True,
        "paris_alignment_commitment": True,
        "paris_alignment_year": 2021,
        "oecd_arrangement_member": True,
        "fossil_fuel_exclusions": {
            "coal": True,
            "coal_year": 2021,
            "oil_sands": False,
            "upstream_oil_gas": False,
            "lng": False,
        },
        "green_products": ["K-EXIM Green New Deal Finance", "Sustainable Export Finance Package"],
        "exclusion_policy": "New overseas coal power plant financing banned under Green New Deal 2021; existing contracts grandfathered; LNG permitted",
        "equator_principles_aligned": True,
        "ifc_ps_required": True,
        "berne_union_member": True,
    },
    "SINOSURE": {
        "full_name": "China Export & Credit Insurance Corporation",
        "country": "CN",
        "green_bond_eligible": False,
        "paris_alignment_commitment": False,
        "paris_alignment_year": None,
        "oecd_arrangement_member": False,
        "fossil_fuel_exclusions": {
            "coal": False,
            "oil_sands": False,
            "upstream_oil_gas": False,
            "lng": False,
        },
        "green_products": ["Green Insurance (limited scope)", "BRI Green Development Guidelines"],
        "exclusion_policy": "No official fossil fuel exclusion policy; Belt & Road Initiative includes coal; voluntary BRI Green Guidelines (non-binding) adopted 2021",
        "equator_principles_aligned": False,
        "ifc_ps_required": False,
        "berne_union_member": True,
    },
    "ECGD": {
        "full_name": "Export Credits Guarantee Department (UK — legacy designation for UKEF)",
        "country": "GB",
        "green_bond_eligible": True,
        "paris_alignment_commitment": True,
        "paris_alignment_year": 2021,
        "oecd_arrangement_member": True,
        "fossil_fuel_exclusions": {
            "coal": True,
            "coal_year": 2021,
            "oil_sands": True,
            "oil_sands_year": 2021,
            "upstream_oil_gas": False,
            "lng": False,
        },
        "green_products": ["Clean Growth Financing Initiative"],
        "exclusion_policy": "Legacy ECGD designation; now operating as UKEF with same exclusion policy",
        "equator_principles_aligned": True,
        "ifc_ps_required": True,
        "berne_union_member": True,
    },
    "ATRADIUS": {
        "full_name": "Atradius Dutch State Business (Netherlands)",
        "country": "NL",
        "green_bond_eligible": True,
        "paris_alignment_commitment": True,
        "paris_alignment_year": 2021,
        "oecd_arrangement_member": True,
        "fossil_fuel_exclusions": {
            "coal": True,
            "coal_year": 2021,
            "oil_sands": True,
            "oil_sands_year": 2021,
            "upstream_oil_gas": False,
            "lng": False,
        },
        "green_products": ["Dutch State Guarantee for Renewable Energy Exports", "Green Export Insurance"],
        "exclusion_policy": "Dutch coalition agreement mandates coal exclusion; Paris-aligned strategy; upstream O&G under review per Dutch climate policy",
        "equator_principles_aligned": True,
        "ifc_ps_required": True,
        "berne_union_member": True,
    },
    "CESCE": {
        "full_name": "Compañía Española de Seguros de Crédito a la Exportación",
        "country": "ES",
        "green_bond_eligible": True,
        "paris_alignment_commitment": True,
        "paris_alignment_year": 2022,
        "oecd_arrangement_member": True,
        "fossil_fuel_exclusions": {
            "coal": True,
            "coal_year": 2022,
            "oil_sands": True,
            "oil_sands_year": 2022,
            "upstream_oil_gas": False,
            "lng": False,
        },
        "green_products": ["CESCE Green Line", "Sustainable Export Guarantee"],
        "exclusion_policy": "Coal export credit ban 2022 per Spanish PNIEC; aligned with EU taxonomy; LNG transitional status maintained",
        "equator_principles_aligned": True,
        "ifc_ps_required": True,
        "berne_union_member": True,
    },
    "EXIM_INDIA": {
        "full_name": "Export-Import Bank of India",
        "country": "IN",
        "green_bond_eligible": True,
        "paris_alignment_commitment": True,
        "paris_alignment_year": 2022,
        "oecd_arrangement_member": False,
        "fossil_fuel_exclusions": {
            "coal": False,
            "oil_sands": False,
            "upstream_oil_gas": False,
            "lng": False,
        },
        "green_products": ["EXIM India Green Bond Framework (2022)", "Lines of Credit for Renewable Energy Projects"],
        "exclusion_policy": "No blanket fossil fuel exclusion; green bond framework includes solar, wind, clean transport; coal remains eligible under Indian energy security policy",
        "equator_principles_aligned": False,
        "ifc_ps_required": False,
        "berne_union_member": False,
    },
}

# ---------------------------------------------------------------------------
# Reference Data — OECD Arrangement Sector Understandings
# ---------------------------------------------------------------------------

OECD_SECTOR_UNDERSTANDINGS: dict[str, dict] = {
    "OSS": {
        "name": "Sector Understanding on Export Credits for Ships",
        "abbreviation": "OSS",
        "sectors": ["commercial_vessels", "fishing_vessels", "offshore_platforms"],
        "max_repayment_years": 12,
        "green_eligibility": ["LNG-powered vessels", "hydrogen fuel cell ships", "electric/hybrid vessels", "wind-assisted propulsion"],
        "climate_criteria": "IMO 2030/2050 GHG strategy alignment; CII rating A-B eligible for concessional terms",
        "esg_requirements": "IFC PS3 resource efficiency; IFC PS4 community health for offshore; Marpol compliance",
    },
    "CCSU": {
        "name": "Sector Understanding on Export Credits for Renewable Energy, Climate Change Mitigation and Adaptation, and Water Projects",
        "abbreviation": "CCSU",
        "sectors": [
            "solar_pv", "wind_onshore", "wind_offshore", "hydropower_small",
            "geothermal", "biomass", "ocean_energy", "energy_efficiency",
            "energy_storage", "smart_grids", "green_hydrogen", "ccs_ccus",
            "climate_adaptation_infrastructure", "sustainable_water_management"
        ],
        "max_repayment_years": 18,
        "green_eligibility": ["All listed sectors qualify for extended CCSU terms"],
        "climate_criteria": (
            "Renewable energy generation; GHG emission reduction ≥30% vs baseline; "
            "climate adaptation co-benefits; aligned with Paris Agreement goals"
        ),
        "esg_requirements": (
            "Full IFC PS 1-8 compliance; ESIA Cat A/B requirements; "
            "community consultation for affected communities; biodiversity offsets for PS6"
        ),
        "concessional_terms": {
            "maximum_repayment_years": 18,
            "minimum_interest_rate": "CIRR minus 0.2%",
            "premium_discount": "Up to 20% reduction for high climate ambition"
        },
    },
    "RSU": {
        "name": "Sector Understanding on Export Credits for Rail Infrastructure",
        "abbreviation": "RSU",
        "sectors": ["high_speed_rail", "urban_metro", "freight_rail", "rail_signalling"],
        "max_repayment_years": 12,
        "green_eligibility": ["Electric rail", "hydrogen rail", "modal shift from road/air"],
        "climate_criteria": "GHG reduction vs modal alternative; electrification; ridership modal shift",
        "esg_requirements": "IFC PS1/PS2/PS5; land acquisition per PS5; labor standards per PS2; community engagement",
    },
    "NSU": {
        "name": "Sector Understanding on Export Credits for Nuclear Power Plants",
        "abbreviation": "NSU",
        "sectors": ["nuclear_power_generation", "nuclear_fuel_cycle", "nuclear_decommissioning"],
        "max_repayment_years": 18,
        "green_eligibility": ["Gen III+ reactors with passive safety", "SMRs (emerging)"],
        "climate_criteria": "Low-carbon baseload; IAEA safety standards compliance; waste management plan",
        "esg_requirements": (
            "IAEA safety conventions; IFC PS1 ESIA including radiological impact; "
            "PS4 emergency planning; PS5 exclusion zones; full nuclear liability convention compliance"
        ),
    },
    "WSU": {
        "name": "Sector Understanding on Export Credits for Water Projects",
        "abbreviation": "WSU",
        "sectors": ["water_treatment", "wastewater", "desalination", "irrigation", "flood_defence", "water_distribution"],
        "max_repayment_years": 15,
        "green_eligibility": ["Water efficiency ≥20% improvement", "NBS integration", "circular water economy"],
        "climate_criteria": "Climate-resilient design; water stress adaptation; SDG 6 contribution; IWRM principles",
        "esg_requirements": "IFC PS1/PS3/PS4/PS7; stakeholder consultation; indigenous water rights; pollution prevention",
    },
}

# ---------------------------------------------------------------------------
# Reference Data — OECD Common Approaches Environmental Categories
# ---------------------------------------------------------------------------

OECD_COMMON_APPROACHES: dict[str, dict] = {
    "Category_A": {
        "category": "A",
        "description": "Projects with significant adverse environmental and/or social impacts that are diverse, irreversible, or unprecedented",
        "esia_required": True,
        "esia_scope": "Full Environmental and Social Impact Assessment",
        "ifc_ps_required": [1, 2, 3, 4, 5, 6, 7, 8],
        "equator_principles_required": True,
        "public_disclosure_days": 120,
        "independent_review": True,
        "typical_sectors": [
            "large_hydropower", "mining", "oil_gas_extraction",
            "large_scale_manufacturing", "port_infrastructure",
            "large_thermal_power", "petrochemicals", "major_pipelines"
        ],
        "monitoring_requirements": "Annual environmental and social monitoring reports; independent audit every 3 years",
        "review_cycle_years": 1,
    },
    "Category_B": {
        "category": "B",
        "description": "Projects with limited adverse impacts, typically site-specific, reversible, and manageable through mitigation measures",
        "esia_required": True,
        "esia_scope": "Environmental and Social Due Diligence (ESDD) or limited ESIA",
        "ifc_ps_required": [1, 2, 3, 4],
        "equator_principles_required": True,
        "public_disclosure_days": 60,
        "independent_review": False,
        "typical_sectors": [
            "small_scale_renewables", "light_manufacturing",
            "telecommunications", "agribusiness_medium",
            "road_rehabilitation", "water_distribution_small"
        ],
        "monitoring_requirements": "Annual environmental and social monitoring reports",
        "review_cycle_years": 2,
    },
    "Category_C": {
        "category": "C",
        "description": "Projects with minimal or no adverse environmental or social impacts",
        "esia_required": False,
        "esia_scope": "Desk review only; no formal ESIA required",
        "ifc_ps_required": [],
        "equator_principles_required": False,
        "public_disclosure_days": 0,
        "independent_review": False,
        "typical_sectors": [
            "software_services", "financial_advisory", "consumer_goods_low_impact",
            "professional_services", "education_equipment", "healthcare_supplies"
        ],
        "monitoring_requirements": "Standard commercial monitoring only",
        "review_cycle_years": 5,
    },
}

# ---------------------------------------------------------------------------
# Reference Data — IFC Performance Standards (2012)
# ---------------------------------------------------------------------------

IFC_PERFORMANCE_STANDARDS: dict[str, dict] = {
    "PS1": {
        "number": 1,
        "title": "Assessment and Management of Environmental and Social Risks and Impacts",
        "key_requirements": [
            "Environmental and Social Assessment (ESA) commensurate with project risks",
            "Environmental and Social Management System (ESMS)",
            "Stakeholder engagement plan (SEP)",
            "Grievance mechanism for project-affected communities",
            "External communications procedure",
        ],
        "triggers": "All Category A and B projects; baseline for all PS applicability",
        "disclosure_requirement": True,
        "monitoring_kpis": ["ESMS implementation rate", "Grievance resolution time", "Stakeholder engagement quality"],
    },
    "PS2": {
        "number": 2,
        "title": "Labor and Working Conditions",
        "key_requirements": [
            "Human resources policies consistent with national law and ILO core conventions",
            "No child labor (ILO C138/C182) or forced labor (ILO C29/C105)",
            "Workers' organizations rights",
            "Non-discrimination and equal opportunity",
            "Retrenchment policy compliant with national law",
            "Occupational Health and Safety (OHS) management",
            "Supply chain labor risk assessment for primary suppliers",
        ],
        "triggers": "All projects with direct employees or contracted workers",
        "disclosure_requirement": True,
        "monitoring_kpis": ["Lost Time Injury Frequency Rate (LTIFR)", "Child/forced labor incidents", "Wage compliance rate"],
    },
    "PS3": {
        "number": 3,
        "title": "Resource Efficiency and Pollution Prevention",
        "key_requirements": [
            "Energy efficiency measures and GHG accounting (>25,000 t CO2e/yr mandatory)",
            "Water withdrawal and wastewater management",
            "Waste management hierarchy (reduce, reuse, recycle)",
            "Hazardous materials management",
            "Pesticide use in line with FAO guidelines",
            "Pollution prevention to meet EHS Guidelines",
        ],
        "triggers": "All projects with material resource use or pollution potential",
        "disclosure_requirement": True,
        "monitoring_kpis": ["GHG emissions tCO2e", "Water withdrawal m3", "Hazardous waste kg", "EHS Guidelines compliance %"],
    },
    "PS4": {
        "number": 4,
        "title": "Community Health, Safety, and Security",
        "key_requirements": [
            "Infrastructure and equipment design to prevent community health impacts",
            "Emergency preparedness and response plan",
            "Traffic and road safety management",
            "Prevention of disease (communicable disease vector control)",
            "Security management — voluntary principles on security and human rights (VPSHR)",
            "Arms/weapons prohibition for private security exceeding proportionate use of force",
        ],
        "triggers": "Projects in proximity to communities or with significant traffic/hazard",
        "disclosure_requirement": True,
        "monitoring_kpis": ["Community health incidents", "Security incidents", "Emergency response drills"],
    },
    "PS5": {
        "number": 5,
        "title": "Land Acquisition and Involuntary Resettlement",
        "key_requirements": [
            "Avoid involuntary resettlement where feasible",
            "Resettlement Action Plan (RAP) when displacement unavoidable",
            "Compensation at replacement cost",
            "Livelihood restoration program",
            "Negotiated settlement preferred over expropriation",
            "Grievance mechanism specific to resettlement",
        ],
        "triggers": "Projects requiring physical or economic displacement of people",
        "disclosure_requirement": True,
        "monitoring_kpis": ["Number of displaced households", "RAP implementation rate", "Livelihood restoration index"],
    },
    "PS6": {
        "number": 6,
        "title": "Biodiversity Conservation and Sustainable Management of Living Natural Resources",
        "key_requirements": [
            "Biodiversity assessment of project area",
            "Critical habitat identification (legally protected, KBA, high biodiversity significance)",
            "No net loss in natural habitats; net gain in critical habitats",
            "No significant conversion of critical habitats",
            "Biodiversity offset plan where residual impact remains",
            "Invasive species management",
            "Sustainable management of living natural resources (FSC/MSC equivalent)",
        ],
        "triggers": "Projects in or near natural/critical habitats or with significant land use change",
        "disclosure_requirement": True,
        "monitoring_kpis": ["Species habitat area (ha)", "Offset credit equivalence", "Deforestation ha", "KBA proximity score"],
    },
    "PS7": {
        "number": 7,
        "title": "Indigenous Peoples",
        "key_requirements": [
            "Identify indigenous peoples (IPs) in project area",
            "Free, Prior, and Informed Consent (FPIC) when impacts on IPs lands/resources",
            "IP-specific engagement process respecting customary decision-making",
            "Benefit sharing with affected IP communities",
            "Avoid adverse impacts on IP cultural heritage",
        ],
        "triggers": "Projects affecting identified indigenous peoples or their traditional territories",
        "disclosure_requirement": True,
        "monitoring_kpis": ["FPIC process completion", "Benefit-sharing disbursement", "IP grievance resolution rate"],
    },
    "PS8": {
        "number": 8,
        "title": "Cultural Heritage",
        "key_requirements": [
            "Chance finds procedure for physical cultural resources",
            "Avoid significant damage to cultural heritage",
            "Consultation with heritage authorities and local communities",
            "No commercialisation of cultural heritage without community consent",
            "Heritage impact assessment for Cat A projects near known sites",
        ],
        "triggers": "Projects with ground disturbance or near known cultural heritage sites",
        "disclosure_requirement": True,
        "monitoring_kpis": ["Chance finds incidents", "Heritage mitigation measures implemented", "Community satisfaction score"],
    },
}

# ---------------------------------------------------------------------------
# Reference Data — Equator Principles IV (2020)
# ---------------------------------------------------------------------------

EQUATOR_PRINCIPLES: dict[str, dict] = {
    "EP1": {
        "number": 1,
        "title": "Review and Categorisation",
        "description": "EPFI categorises projects as A, B, or C based on the type, location, sensitivity, and scale of the project and the nature and magnitude of its potential environmental and social impacts and risks.",
        "applicability": "All EP transactions",
    },
    "EP2": {
        "number": 2,
        "title": "Environmental and Social Assessment",
        "description": "Borrower or third party conducts ESIA for Category A/B projects. Assessment addresses baseline conditions, impacts, mitigation, monitoring, and stakeholder engagement.",
        "applicability": "Category A and B",
    },
    "EP3": {
        "number": 3,
        "title": "Applicable Environmental and Social Standards",
        "description": "For projects in Designated Countries (OECD/EU/EEA), host country laws apply. For non-Designated Countries, IFC Performance Standards and EHS Guidelines apply.",
        "applicability": "All projects",
    },
    "EP4": {
        "number": 4,
        "title": "Environmental and Social Management System and Equator Principles Action Plan",
        "description": "Borrower develops ESMS and, where applicable, an ESAP to address gaps to IFC PS or host country standards.",
        "applicability": "Category A and B",
    },
    "EP5": {
        "number": 5,
        "title": "Stakeholder Engagement",
        "description": "For Category A and high-risk B projects, borrower undertakes meaningful consultation with affected communities in a culturally appropriate and free of external manipulation manner.",
        "applicability": "Category A and high-risk B",
    },
    "EP6": {
        "number": 6,
        "title": "Grievance Mechanism",
        "description": "Borrower establishes a grievance mechanism scaled to project risks for affected communities to raise concerns about ES performance, distinct from legal processes.",
        "applicability": "Category A and B",
    },
    "EP7": {
        "number": 7,
        "title": "Independent Review",
        "description": "For Category A and high-risk B projects, an independent environmental and social consultant reviews ESIA, ESMS, and Stakeholder Engagement Plan.",
        "applicability": "Category A and high-risk B",
    },
    "EP8": {
        "number": 8,
        "title": "Covenants",
        "description": "Loan documentation includes covenants requiring compliance with ES laws and EP Action Plan; right of EPFI to conduct site visits; annual ES monitoring reports.",
        "applicability": "Category A and B",
    },
    "EP9": {
        "number": 9,
        "title": "Independent Monitoring and Reporting",
        "description": "For Category A and high-risk B, independent monitor verifies ongoing compliance. Borrower provides annual ES monitoring reports publicly available.",
        "applicability": "Category A and high-risk B",
    },
    "EP10": {
        "number": 10,
        "title": "Reporting and Transparency",
        "description": "EPFI publicly discloses its EP implementation processes, EP transactions financed (category), and annual EP reporting including sector/region statistics.",
        "applicability": "All EPFIs",
    },
}

EP_SIGNATORY_BANKS = [
    {"name": "HSBC", "country": "GB", "signatory_year": 2003},
    {"name": "Citigroup", "country": "US", "signatory_year": 2003},
    {"name": "BNP Paribas", "country": "FR", "signatory_year": 2003},
    {"name": "Société Générale", "country": "FR", "signatory_year": 2003},
    {"name": "Barclays", "country": "GB", "signatory_year": 2003},
    {"name": "BNDES (Banco Nacional de Desenvolvimento)", "country": "BR", "signatory_year": 2011},
    {"name": "Standard Chartered", "country": "GB", "signatory_year": 2003},
    {"name": "ING", "country": "NL", "signatory_year": 2003},
    {"name": "Deutsche Bank", "country": "DE", "signatory_year": 2003},
    {"name": "Credit Agricole CIB", "country": "FR", "signatory_year": 2003},
    {"name": "ABN AMRO", "country": "NL", "signatory_year": 2003},
    {"name": "Mizuho Financial Group", "country": "JP", "signatory_year": 2003},
    {"name": "Sumitomo Mitsui Banking Corporation", "country": "JP", "signatory_year": 2005},
    {"name": "MUFG", "country": "JP", "signatory_year": 2005},
]

EP_APPLICABILITY_THRESHOLD_USD = 10_000_000  # $10M project finance

# ---------------------------------------------------------------------------
# Reference Data — Fossil Fuel Export Credit Exclusion Matrix
# ---------------------------------------------------------------------------

FOSSIL_FUEL_EXCLUSION_MATRIX: dict[str, dict] = {
    "coal_mining": {
        "commodity": "coal_mining",
        "description": "Coal exploration, extraction, and mine development",
        "eca_restrictions": {
            "UKEF": "excluded_2021", "COFACE": "excluded_2021", "EULER_HERMES_AGA": "excluded_2022",
            "SACE": "excluded_2021", "EKF": "excluded_2019", "GIEK": "excluded_2020",
            "EDC": "excluded_2022", "EXIM_USA": "excluded_2021", "JBIC_NEXI": "eligible",
            "K_EXIM": "excluded_2021", "SINOSURE": "eligible", "ECGD": "excluded_2021",
            "ATRADIUS": "excluded_2021", "CESCE": "excluded_2022", "EXIM_INDIA": "eligible",
        },
        "eu_taxonomy_eligible": False,
        "paris_aligned": False,
        "oecd_arrangement_eligible": False,
    },
    "coal_power": {
        "commodity": "coal_power",
        "description": "Coal-fired power generation (all technologies including USC/ultra-supercritical)",
        "eca_restrictions": {
            "UKEF": "excluded_2021", "COFACE": "excluded_2021", "EULER_HERMES_AGA": "excluded_2022",
            "SACE": "excluded_2021", "EKF": "excluded_2019", "GIEK": "excluded_2020",
            "EDC": "excluded_2022", "EXIM_USA": "excluded_2021", "JBIC_NEXI": "transitional_usc_only",
            "K_EXIM": "excluded_2021", "SINOSURE": "eligible", "ECGD": "excluded_2021",
            "ATRADIUS": "excluded_2021", "CESCE": "excluded_2022", "EXIM_INDIA": "eligible",
        },
        "eu_taxonomy_eligible": False,
        "paris_aligned": False,
        "oecd_arrangement_eligible": False,
    },
    "oil_sands": {
        "commodity": "oil_sands",
        "description": "Oil sands / tar sands extraction and upgrading",
        "eca_restrictions": {
            "UKEF": "excluded_2021", "COFACE": "excluded_2022", "EULER_HERMES_AGA": "excluded_2022",
            "SACE": "excluded_2022", "EKF": "excluded_2020", "GIEK": "excluded_2021",
            "EDC": "under_review", "EXIM_USA": "eligible", "JBIC_NEXI": "eligible",
            "K_EXIM": "eligible", "SINOSURE": "eligible", "ECGD": "excluded_2021",
            "ATRADIUS": "excluded_2021", "CESCE": "excluded_2022", "EXIM_INDIA": "eligible",
        },
        "eu_taxonomy_eligible": False,
        "paris_aligned": False,
        "oecd_arrangement_eligible": False,
    },
    "upstream_oil_gas": {
        "commodity": "upstream_oil_gas",
        "description": "Upstream oil and gas exploration and production",
        "eca_restrictions": {
            "UKEF": "eligible_review", "COFACE": "eligible_review", "EULER_HERMES_AGA": "eligible_review",
            "SACE": "eligible_lng_carveout", "EKF": "excluded_2023", "GIEK": "eligible",
            "EDC": "eligible", "EXIM_USA": "eligible", "JBIC_NEXI": "eligible",
            "K_EXIM": "eligible", "SINOSURE": "eligible", "ECGD": "eligible_review",
            "ATRADIUS": "eligible_review", "CESCE": "eligible", "EXIM_INDIA": "eligible",
        },
        "eu_taxonomy_eligible": False,
        "paris_aligned": False,
        "oecd_arrangement_eligible": False,
    },
    "lng_infrastructure": {
        "commodity": "lng_infrastructure",
        "description": "LNG liquefaction, regasification terminals, and LNG carriers",
        "eca_restrictions": {
            "UKEF": "eligible_energy_security", "COFACE": "eligible_transitional",
            "EULER_HERMES_AGA": "eligible_transitional", "SACE": "eligible_strategic",
            "EKF": "eligible_review", "GIEK": "eligible_energy_security",
            "EDC": "eligible", "EXIM_USA": "eligible", "JBIC_NEXI": "eligible",
            "K_EXIM": "eligible", "SINOSURE": "eligible", "ECGD": "eligible_energy_security",
            "ATRADIUS": "eligible_review", "CESCE": "eligible", "EXIM_INDIA": "eligible",
        },
        "eu_taxonomy_eligible": False,
        "paris_aligned": "transitional_debate",
        "oecd_arrangement_eligible": False,
    },
    "petrochemicals": {
        "commodity": "petrochemicals",
        "description": "Petrochemical plants, refineries, and chemical feedstock facilities",
        "eca_restrictions": {
            "UKEF": "eligible_case_by_case", "COFACE": "eligible_case_by_case",
            "EULER_HERMES_AGA": "eligible_case_by_case", "SACE": "eligible_case_by_case",
            "EKF": "eligible_case_by_case", "GIEK": "eligible_case_by_case",
            "EDC": "eligible", "EXIM_USA": "eligible", "JBIC_NEXI": "eligible",
            "K_EXIM": "eligible", "SINOSURE": "eligible", "ECGD": "eligible_case_by_case",
            "ATRADIUS": "eligible_case_by_case", "CESCE": "eligible", "EXIM_INDIA": "eligible",
        },
        "eu_taxonomy_eligible": False,
        "paris_aligned": False,
        "oecd_arrangement_eligible": False,
    },
}

# ---------------------------------------------------------------------------
# Reference Data — Sector Risk Matrix
# ---------------------------------------------------------------------------

SECTOR_RISK_MATRIX: dict[str, dict] = {
    "fossil_fuel_energy": {
        "eca_restriction_level": "high",
        "common_approaches_default_category": "A",
        "ifc_ps_triggered": [1, 2, 3, 4, 5, 6],
        "ep_applicable": True,
        "esg_risk_tier": "very_high",
        "paris_alignment_risk": "high",
    },
    "petrochemicals": {
        "eca_restriction_level": "medium_high",
        "common_approaches_default_category": "A",
        "ifc_ps_triggered": [1, 2, 3, 4, 5],
        "ep_applicable": True,
        "esg_risk_tier": "high",
        "paris_alignment_risk": "high",
    },
    "mining": {
        "eca_restriction_level": "medium_high",
        "common_approaches_default_category": "A",
        "ifc_ps_triggered": [1, 2, 3, 4, 5, 6, 7, 8],
        "ep_applicable": True,
        "esg_risk_tier": "high",
        "paris_alignment_risk": "medium",
    },
    "agriculture": {
        "eca_restriction_level": "medium",
        "common_approaches_default_category": "B",
        "ifc_ps_triggered": [1, 2, 3, 4, 5, 6, 7],
        "ep_applicable": True,
        "esg_risk_tier": "medium",
        "paris_alignment_risk": "low",
    },
    "infrastructure": {
        "eca_restriction_level": "low_medium",
        "common_approaches_default_category": "B",
        "ifc_ps_triggered": [1, 2, 3, 4, 5],
        "ep_applicable": True,
        "esg_risk_tier": "medium",
        "paris_alignment_risk": "low",
    },
    "manufacturing": {
        "eca_restriction_level": "low",
        "common_approaches_default_category": "B",
        "ifc_ps_triggered": [1, 2, 3, 4],
        "ep_applicable": False,
        "esg_risk_tier": "low_medium",
        "paris_alignment_risk": "low",
    },
    "renewable_energy": {
        "eca_restriction_level": "none",
        "common_approaches_default_category": "B",
        "ifc_ps_triggered": [1, 2, 3, 4, 5, 6],
        "ep_applicable": True,
        "esg_risk_tier": "low",
        "paris_alignment_risk": "aligned",
    },
    "services": {
        "eca_restriction_level": "none",
        "common_approaches_default_category": "C",
        "ifc_ps_triggered": [1, 2],
        "ep_applicable": False,
        "esg_risk_tier": "low",
        "paris_alignment_risk": "neutral",
    },
}

# ---------------------------------------------------------------------------
# Reference Data — Green Trade Finance Instruments
# ---------------------------------------------------------------------------

GREEN_TRADE_INSTRUMENTS: dict[str, dict] = {
    "green_letter_of_credit": {
        "instrument": "Green Letter of Credit",
        "standard": "ITFC Green LC Standard (IDB Group 2019/IFC GFSNF)",
        "eligible_use_of_proceeds": [
            "renewable_energy_equipment", "energy_efficiency_products",
            "green_building_materials", "clean_technology_exports",
            "sustainable_agriculture_inputs", "clean_transportation_equipment"
        ],
        "itfc_compliant": True,
        "ccsu_eligible": True,
        "eu_taxonomy_aligned": True,
        "icma_principles": "Green Bond Principles framework adapted for trade",
        "reporting_requirement": "Annual use-of-proceeds reporting",
    },
    "sustainable_supply_chain_finance": {
        "instrument": "Sustainable Supply Chain Finance (SSCF)",
        "standard": "LMA/APLMA Sustainability-Linked Loan Principles + IFC GFSNF",
        "eligible_use_of_proceeds": [
            "supplier_sustainability_programme", "scope3_reduction_financing",
            "deforestation_free_commodity_supply_chains", "fair_trade_supplier_support"
        ],
        "itfc_compliant": False,
        "ccsu_eligible": False,
        "eu_taxonomy_aligned": True,
        "icma_principles": "Sustainability-Linked Bond Principles (margin ratchet variant)",
        "reporting_requirement": "KPI-linked reporting (supplier sustainability scores)",
    },
    "green_trade_receivables": {
        "instrument": "Green Trade Receivables / Green Trade Receivables Securitisation",
        "standard": "ICMA Green Bond Principles 2021 + GFSNF eligibility criteria",
        "eligible_use_of_proceeds": [
            "green_commodity_exports", "renewable_energy_project_receivables",
            "sustainable_infrastructure_receivables", "clean_technology_receivables"
        ],
        "itfc_compliant": False,
        "ccsu_eligible": True,
        "eu_taxonomy_aligned": True,
        "icma_principles": "Green Bond Principles — Use of Proceeds category (receivables SPV)",
        "reporting_requirement": "Allocation and impact reporting per ICMA GBP",
    },
    "climate_export_credit": {
        "instrument": "Climate Export Credit (CCSU-eligible)",
        "standard": "OECD CCSU (TAD/PG(2022)1 Annex II)",
        "eligible_use_of_proceeds": [
            "solar_pv_systems", "wind_turbines", "energy_storage_systems",
            "smart_grid_technology", "green_hydrogen_equipment",
            "ccs_ccus_equipment", "energy_efficiency_industrial", "ev_charging_infrastructure"
        ],
        "itfc_compliant": True,
        "ccsu_eligible": True,
        "eu_taxonomy_aligned": True,
        "icma_principles": "Green Bond Principles — Use of Proceeds; CCSU extended 18-year repayment terms",
        "reporting_requirement": "GHG reduction impact reporting; annual CCSU compliance certificate",
    },
    "blue_bond_trade_finance": {
        "instrument": "Blue Bond Trade Finance",
        "standard": "ICMA Blue Bond Principles (draft) + IFC Blue Finance Guidelines",
        "eligible_use_of_proceeds": [
            "sustainable_fisheries_equipment", "marine_conservation_projects",
            "ocean_renewable_energy", "sustainable_aquaculture", "port_decarbonisation"
        ],
        "itfc_compliant": False,
        "ccsu_eligible": False,
        "eu_taxonomy_aligned": True,
        "icma_principles": "Blue Bond Principles (ocean SDG 14 alignment)",
        "reporting_requirement": "Ocean impact metrics; SDG 14 contribution reporting",
    },
}

# ---------------------------------------------------------------------------
# Reference Data — Berne Union ESG Framework
# ---------------------------------------------------------------------------

BERNE_UNION_ESG: dict[str, dict] = {
    "prague_club": {
        "name": "Prague Club",
        "description": "Short-term ECA members (export credit insurance up to 2 years)",
        "esg_principles_version": "2022",
        "esg_principles_year": 2022,
        "esg_classification_criteria": [
            "Environmental impact screening for >$5M transactions",
            "Social impact assessment for transactions in fragile states",
            "Governance review for state-owned enterprise borrowers",
            "ILO core labour standards reference",
        ],
        "member_esg_scoring": {
            "methodology": "Self-assessment against 10 ESG criteria (0-10 scale each)",
            "aggregate_max": 100,
            "green_threshold": 70,
            "reporting_frequency": "Annual to Berne Union Secretariat",
        },
        "alignment": "Non-binding ESG principles; member-level discretion",
    },
    "london_club": {
        "name": "London Club",
        "description": "Medium/long-term ECA members (MLT export credit and investment insurance)",
        "esg_principles_version": "2022",
        "esg_principles_year": 2022,
        "esg_classification_criteria": [
            "Full OECD Common Approaches alignment for Category A/B",
            "IFC Performance Standards compliance for non-Designated Countries",
            "Equator Principles alignment for project finance >$10M",
            "Paris Agreement alignment commitment",
            "Fossil fuel exclusion policy disclosure",
        ],
        "member_esg_scoring": {
            "methodology": "15 criteria assessment: Environment (6), Social (5), Governance (4) — weighted 40/35/25",
            "aggregate_max": 100,
            "green_threshold": 75,
            "reporting_frequency": "Annual; public disclosure of scores by member",
        },
        "alignment": "Binding for Cat A/B transactions; strong OECD Common Approaches alignment",
    },
}

# ---------------------------------------------------------------------------
# MIGA Reference Data
# ---------------------------------------------------------------------------

MIGA_ESG: dict[str, dict] = {
    "political_risk_coverage_types": [
        "currency_transfer_and_convertibility",
        "expropriation",
        "breach_of_contract",
        "war_civil_disturbance_terrorism",
        "non_honoring_of_sovereign_financial_obligations",
    ],
    "esg_eligibility_criteria": [
        "IFC Performance Standards compliance (PS1-PS8)",
        "World Bank Group Environmental Health and Safety (EHS) Guidelines",
        "MIGA Environmental and Social Policy (2013)",
        "IFC Access to Information Policy compliance",
        "Anti-corruption and anti-bribery declaration",
    ],
    "green_certification": {
        "green_bond_eligible": True,
        "green_bond_framework": "MIGA Green Bond Framework (2019, updated 2022)",
        "eligible_categories": [
            "renewable_energy", "energy_efficiency", "clean_transportation",
            "sustainable_water", "green_buildings", "biodiversity_conservation"
        ],
    },
    "blue_bond_certification": {
        "eligible": True,
        "categories": ["sustainable_fisheries", "ocean_renewable_energy", "marine_conservation"],
    },
}

# ---------------------------------------------------------------------------
# Pydantic Request/Response Models
# ---------------------------------------------------------------------------

class ExportCreditTransactionData(BaseModel):
    model_config = {"protected_namespaces": ()}

    transaction_id: str = ""
    eca_name: str
    project_value_usd: float = Field(..., ge=0)
    sector: str
    subsector: str = ""
    country_iso2: str
    project_name: str = ""
    use_of_proceeds: str = ""
    certifications: list[str] = []
    has_esia: bool = False
    ifc_ps_checked: list[int] = []
    equator_principles_applied: bool = False
    fossil_fuel_involved: bool = False
    fossil_fuel_type: str = ""
    green_instrument_type: str = ""


class FossilFuelScreenRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    sector: str
    subsector: str = ""
    eca_name: str
    project_value_usd: float = Field(0.0, ge=0)


class EquatorPrinciplesRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    project_value_usd: float = Field(..., ge=0)
    country_iso2: str
    sector: str
    has_existing_esia: bool = False
    community_affected: bool = False
    indigenous_peoples_affected: bool = False
    cultural_heritage_affected: bool = False


class GreenInstrumentRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    instrument_type: str
    use_of_proceeds: str
    sector: str
    project_value_usd: float = Field(0.0, ge=0)
    eca_name: str = ""


class ECAProfileRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    eca_name: str


# ---------------------------------------------------------------------------
# Helper Utilities
# ---------------------------------------------------------------------------

_DESIGNATED_COUNTRIES = {
    "AT", "AU", "BE", "CA", "CH", "CY", "CZ", "DE", "DK", "EE", "ES", "FI",
    "FR", "GB", "GR", "HR", "HU", "IE", "IS", "IT", "JP", "KR", "LI", "LT",
    "LU", "LV", "MT", "NL", "NO", "NZ", "PL", "PT", "RO", "SE", "SI", "SK",
    "US", "BG",
}

_HIGH_RISK_COUNTRIES = {
    "SD", "SS", "MM", "AF", "YE", "CD", "CF", "SO", "LY", "ML", "NE", "TD",
    "NG", "KP", "IR", "SY", "VE",
}


def _is_designated_country(country_iso2: str) -> bool:
    return country_iso2.upper() in _DESIGNATED_COUNTRIES


def _resolve_oecd_category(sector: str, project_value_usd: float, country_iso2: str) -> str:
    """Heuristic OECD Common Approaches category based on sector and project size."""
    sector_profile = SECTOR_RISK_MATRIX.get(sector.lower().replace(" ", "_"), {})
    default_cat = sector_profile.get("common_approaches_default_category", "B")
    # Small project in low-risk sector in Designated Country → Category C
    if (
        project_value_usd < 10_000_000
        and default_cat in ("B", "C")
        and _is_designated_country(country_iso2)
    ):
        return "C"
    # Very high-risk in sensitive country → promote to A if B
    if country_iso2.upper() in _HIGH_RISK_COUNTRIES and default_cat == "B":
        return "A"
    return default_cat


def _check_ifc_ps_compliance(sector: str, ps_checked: list[int]) -> dict:
    """Check IFC PS compliance given sector and which standards were reviewed."""
    sector_profile = SECTOR_RISK_MATRIX.get(sector.lower().replace(" ", "_"), {})
    required = sector_profile.get("ifc_ps_triggered", [1, 2])
    missing = [ps for ps in required if ps not in ps_checked]
    compliance_pct = (
        round((len(required) - len(missing)) / len(required) * 100, 1)
        if required else 100.0
    )
    return {
        "required_standards": required,
        "checked_standards": ps_checked,
        "missing_standards": missing,
        "compliance_percentage": compliance_pct,
        "compliant": len(missing) == 0,
    }


def _classify_fossil_fuel(sector: str, subsector: str) -> Optional[str]:
    """Map sector/subsector to fossil fuel exclusion matrix key."""
    mapping = {
        ("fossil_fuel_energy", "coal"): "coal_power",
        ("fossil_fuel_energy", "coal_mining"): "coal_mining",
        ("fossil_fuel_energy", "coal_power"): "coal_power",
        ("fossil_fuel_energy", "oil_sands"): "oil_sands",
        ("fossil_fuel_energy", "upstream_oil"): "upstream_oil_gas",
        ("fossil_fuel_energy", "upstream_gas"): "upstream_oil_gas",
        ("fossil_fuel_energy", "lng"): "lng_infrastructure",
        ("petrochemicals", ""): "petrochemicals",
    }
    key = (sector.lower(), subsector.lower())
    if key in mapping:
        return mapping[key]
    for k, v in mapping.items():
        if k[0] == sector.lower() and (k[1] in subsector.lower() or subsector.lower() in k[1]):
            return v
    return None


def _derive_esg_risk_tier(
    oecd_category: str,
    fossil_fuel_classified: bool,
    ifc_compliant: bool,
    country_iso2: str,
) -> str:
    if fossil_fuel_classified and oecd_category == "A":
        return "very_high"
    if oecd_category == "A" or (fossil_fuel_classified and not ifc_compliant):
        return "high"
    if oecd_category == "B" or country_iso2.upper() in _HIGH_RISK_COUNTRIES:
        return "medium"
    return "low"


# ---------------------------------------------------------------------------
# Engine Functions
# ---------------------------------------------------------------------------

def assess_export_credit_esg(transaction: ExportCreditTransactionData) -> dict:
    """
    Full ESG assessment for an export credit / trade finance transaction.

    Returns:
        ECA eligibility, OECD Common Approaches category, IFC PS compliance,
        fossil fuel classification, green classification, ESG risk tier, action items.
    """
    eca_name = transaction.eca_name.upper().replace(" ", "_")
    eca_profile = ECA_PROFILES.get(eca_name, {})
    eca_found = bool(eca_profile)

    # 1. OECD Common Approaches Category
    oecd_category = _resolve_oecd_category(
        transaction.sector, transaction.project_value_usd, transaction.country_iso2
    )
    ca_details = OECD_COMMON_APPROACHES.get(f"Category_{oecd_category}", {})

    # 2. IFC PS Compliance
    ifc_result = _check_ifc_ps_compliance(transaction.sector, transaction.ifc_ps_checked)

    # 3. Fossil Fuel Classification
    ff_key = _classify_fossil_fuel(transaction.sector, transaction.subsector)
    ff_data = FOSSIL_FUEL_EXCLUSION_MATRIX.get(ff_key, {}) if ff_key else {}
    eca_ff_restriction = ff_data.get("eca_restrictions", {}).get(eca_name, "eligible") if ff_data else "not_applicable"
    fossil_excluded = eca_ff_restriction.startswith("excluded")

    # 4. Green Classification
    green_instrument = GREEN_TRADE_INSTRUMENTS.get(
        transaction.green_instrument_type.lower().replace(" ", "_"), {}
    )
    is_green = bool(green_instrument) and not fossil_excluded

    # 5. Equator Principles applicability
    ep_applicable = (
        transaction.project_value_usd >= EP_APPLICABILITY_THRESHOLD_USD
        and SECTOR_RISK_MATRIX.get(transaction.sector.lower().replace(" ", "_"), {}).get("ep_applicable", True)
    )

    # 6. ESG Risk Tier
    esg_risk_tier = _derive_esg_risk_tier(
        oecd_category,
        fossil_excluded or bool(ff_key),
        ifc_result["compliant"],
        transaction.country_iso2,
    )

    # 7. Paris Alignment
    paris_aligned = (
        eca_profile.get("paris_alignment_commitment", False)
        and not fossil_excluded
        and transaction.sector.lower() not in ("fossil_fuel_energy", "petrochemicals")
    )

    # 8. Action Items
    actions: list[str] = []
    if oecd_category in ("A", "B") and not transaction.has_esia:
        actions.append(f"ESIA required (Category {oecd_category}) — initiate Environmental and Social Impact Assessment")
    if ifc_result["missing_standards"]:
        missing_titles = [f"PS{n}: {IFC_PERFORMANCE_STANDARDS[f'PS{n}']['title']}" for n in ifc_result["missing_standards"] if f"PS{n}" in IFC_PERFORMANCE_STANDARDS]
        actions.append(f"IFC PS gap: complete review of {', '.join(missing_titles)}")
    if ep_applicable and not transaction.equator_principles_applied:
        actions.append("Equator Principles IV apply — engage EP signatory bank; document EP categorisation")
    if fossil_excluded:
        actions.append(f"Transaction BLOCKED: {eca_name} excludes '{ff_key}' under current exclusion policy")
    if not paris_aligned and eca_profile.get("paris_alignment_commitment"):
        actions.append("Paris alignment risk — verify project GHG trajectory aligns with 1.5°C pathway")

    return {
        "transaction_id": transaction.transaction_id,
        "eca_name": eca_name,
        "eca_found": eca_found,
        "eca_paris_aligned": eca_profile.get("paris_alignment_commitment", False),
        "oecd_category": oecd_category,
        "oecd_esia_required": ca_details.get("esia_required", False),
        "oecd_public_disclosure_days": ca_details.get("public_disclosure_days", 0),
        "ifc_ps_compliance": ifc_result,
        "fossil_fuel_key": ff_key,
        "fossil_fuel_eca_restriction": eca_ff_restriction,
        "fossil_fuel_excluded": fossil_excluded,
        "eu_taxonomy_eligible": ff_data.get("eu_taxonomy_eligible", True) if ff_data else True,
        "green_instrument_found": bool(green_instrument),
        "green_instrument_name": green_instrument.get("instrument", ""),
        "green_classification": is_green,
        "ccsu_eligible": green_instrument.get("ccsu_eligible", False),
        "equator_principles_applicable": ep_applicable,
        "equator_principles_applied": transaction.equator_principles_applied,
        "paris_aligned": paris_aligned,
        "esg_risk_tier": esg_risk_tier,
        "action_items": actions,
        "assessment_date": datetime.utcnow().isoformat() + "Z",
    }


def screen_fossil_fuel_exposure(sector: str, subsector: str, eca_name: str) -> dict:
    """
    Screen a transaction for fossil fuel exposure and ECA exclusion status.

    Returns:
        Exclusion status by ECA, fossil fuel classification, green taxonomy eligibility.
    """
    ff_key = _classify_fossil_fuel(sector, subsector)
    if not ff_key:
        return {
            "fossil_fuel_classified": False,
            "fossil_fuel_key": None,
            "eca_restriction": "not_applicable",
            "excluded": False,
            "eu_taxonomy_eligible": True,
            "paris_aligned": True,
            "message": "No fossil fuel classification identified for this sector/subsector combination",
        }

    ff_data = FOSSIL_FUEL_EXCLUSION_MATRIX.get(ff_key, {})
    eca_upper = eca_name.upper().replace(" ", "_")
    restriction = ff_data.get("eca_restrictions", {}).get(eca_upper, "eligible")

    # All ECA restrictions
    all_restrictions = {}
    for eca, status in ff_data.get("eca_restrictions", {}).items():
        all_restrictions[eca] = {
            "status": status,
            "excluded": status.startswith("excluded"),
            "year": int(status.split("_")[-1]) if "_" in status and status.split("_")[-1].isdigit() else None,
        }

    return {
        "fossil_fuel_classified": True,
        "fossil_fuel_key": ff_key,
        "fossil_fuel_description": ff_data.get("description", ""),
        "eca_restriction": restriction,
        "excluded": restriction.startswith("excluded"),
        "all_eca_restrictions": all_restrictions,
        "eu_taxonomy_eligible": ff_data.get("eu_taxonomy_eligible", False),
        "paris_aligned": ff_data.get("paris_aligned", False),
        "oecd_arrangement_eligible": ff_data.get("oecd_arrangement_eligible", False),
        "screening_date": datetime.utcnow().isoformat() + "Z",
    }


def apply_equator_principles(
    project_value_usd: float,
    country_iso2: str,
    sector: str,
    has_existing_esia: bool = False,
    community_affected: bool = False,
    indigenous_peoples_affected: bool = False,
    cultural_heritage_affected: bool = False,
) -> dict:
    """
    Determine Equator Principles IV applicability and requirements.

    Returns:
        EP applicability flag, category (A/B/C), required principles,
        ESIA scope, signatory EPFIs, required standards.
    """
    sector_profile = SECTOR_RISK_MATRIX.get(sector.lower().replace(" ", "_"), {})
    ep_sector_applicable = sector_profile.get("ep_applicable", True)
    above_threshold = project_value_usd >= EP_APPLICABILITY_THRESHOLD_USD
    ep_applicable = above_threshold and ep_sector_applicable

    # Determine category
    is_designated = _is_designated_country(country_iso2)
    oecd_category = _resolve_oecd_category(sector, project_value_usd, country_iso2)

    # Applicable Principles by category
    if oecd_category == "A":
        applicable_principles = list(EQUATOR_PRINCIPLES.keys())
        high_risk_b = False
    elif oecd_category == "B":
        # High-risk B: large community/IP impacts
        high_risk_b = community_affected or indigenous_peoples_affected
        if high_risk_b:
            applicable_principles = list(EQUATOR_PRINCIPLES.keys())
        else:
            applicable_principles = ["EP1", "EP2", "EP3", "EP4", "EP5", "EP6", "EP7", "EP8", "EP10"]
    else:  # Category C
        applicable_principles = ["EP1", "EP10"]
        high_risk_b = False

    # Build requirements
    requirements: list[str] = []
    if oecd_category in ("A", "B") and not has_existing_esia:
        requirements.append("Commission full ESIA (Category A) or Environmental and Social Due Diligence (Category B)")
    if not is_designated:
        requirements.append("IFC Performance Standards apply (non-Designated Country)")
    if indigenous_peoples_affected:
        requirements.append("FPIC required — IFC PS7 and EP5 indigenous peoples engagement mandatory")
    if cultural_heritage_affected:
        requirements.append("Cultural heritage impact assessment required — IFC PS8")
    if oecd_category == "A" or high_risk_b:
        requirements.append("Independent Environmental and Social Consultant (IESC) review required")

    return {
        "ep_applicable": ep_applicable,
        "project_value_usd": project_value_usd,
        "threshold_usd": EP_APPLICABILITY_THRESHOLD_USD,
        "above_threshold": above_threshold,
        "country_designated": is_designated,
        "ep_category": oecd_category,
        "applicable_principles": applicable_principles,
        "principle_details": [EQUATOR_PRINCIPLES[p] for p in applicable_principles],
        "required_standards": ["IFC Performance Standards"] if not is_designated else ["Host Country Law"],
        "esia_scope": OECD_COMMON_APPROACHES.get(f"Category_{oecd_category}", {}).get("esia_scope", ""),
        "independent_review_required": oecd_category == "A" or high_risk_b,
        "requirements": requirements,
        "signatory_epfis_available": len(EP_SIGNATORY_BANKS),
        "ep_signatory_sample": EP_SIGNATORY_BANKS[:5],
        "assessment_date": datetime.utcnow().isoformat() + "Z",
    }


def classify_green_trade_instrument(
    instrument_type: str,
    use_of_proceeds: str,
    sector: str,
    project_value_usd: float = 0.0,
    eca_name: str = "",
) -> dict:
    """
    Classify a trade finance instrument for green eligibility.

    Returns:
        Green eligibility, ITFC standard compliance, eligible green categories,
        CCSU eligibility, EU taxonomy alignment, ICMA principles alignment.
    """
    key = instrument_type.lower().replace(" ", "_").replace("-", "_")
    instrument = GREEN_TRADE_INSTRUMENTS.get(key, {})
    instrument_found = bool(instrument)

    # Check use of proceeds alignment
    uop_lower = use_of_proceeds.lower()
    uop_match = any(
        eligible.replace("_", " ") in uop_lower or uop_lower in eligible.replace("_", " ")
        for eligible in (instrument.get("eligible_use_of_proceeds", []) if instrument else [])
    )

    # CCSU eligibility check
    ccsu_sectors = OECD_SECTOR_UNDERSTANDINGS["CCSU"]["sectors"]
    sector_in_ccsu = any(
        s.replace("_", " ") in sector.lower() or sector.lower() in s.replace("_", " ")
        for s in ccsu_sectors
    )

    # Fossil fuel filter
    is_fossil = sector.lower() in ("fossil_fuel_energy", "petrochemicals") and "coal" in sector.lower()

    green_eligible = (
        instrument_found
        and (uop_match or sector_in_ccsu)
        and not is_fossil
    )

    return {
        "instrument_type": instrument_type,
        "instrument_found": instrument_found,
        "instrument_name": instrument.get("instrument", instrument_type),
        "standard": instrument.get("standard", ""),
        "green_eligible": green_eligible,
        "itfc_compliant": instrument.get("itfc_compliant", False),
        "ccsu_eligible": instrument.get("ccsu_eligible", False) or sector_in_ccsu,
        "eu_taxonomy_aligned": instrument.get("eu_taxonomy_aligned", False) and not is_fossil,
        "icma_principles": instrument.get("icma_principles", ""),
        "eligible_use_of_proceeds": instrument.get("eligible_use_of_proceeds", []),
        "use_of_proceeds_match": uop_match,
        "sector_ccsu_eligible": sector_in_ccsu,
        "reporting_requirement": instrument.get("reporting_requirement", ""),
        "classification_date": datetime.utcnow().isoformat() + "Z",
    }


def get_eca_sustainability_profile(eca_name: str) -> dict:
    """
    Retrieve full ECA sustainability profile.

    Returns:
        Paris alignment, fossil fuel exclusions, green products, Berne Union membership,
        Equator Principles alignment, IFC PS requirements.
    """
    key = eca_name.upper().replace(" ", "_")
    profile = ECA_PROFILES.get(key)
    if not profile:
        # Try partial match
        for k, v in ECA_PROFILES.items():
            if eca_name.upper() in k or k in eca_name.upper():
                profile = v
                key = k
                break

    if not profile:
        return {
            "eca_name": eca_name,
            "found": False,
            "message": f"ECA '{eca_name}' not found. Available: {list(ECA_PROFILES.keys())}",
        }

    fossil_excl = profile.get("fossil_fuel_exclusions", {})
    excluded_commodities = [c for c, v in fossil_excl.items() if v is True and c != "coal_year" and c != "oil_sands_year" and c != "upstream_oil_gas_year"]

    return {
        "eca_name": key,
        "found": True,
        "full_name": profile.get("full_name", ""),
        "country": profile.get("country", ""),
        "paris_alignment_commitment": profile.get("paris_alignment_commitment", False),
        "paris_alignment_year": profile.get("paris_alignment_year"),
        "oecd_arrangement_member": profile.get("oecd_arrangement_member", False),
        "green_bond_eligible": profile.get("green_bond_eligible", False),
        "fossil_fuel_exclusions_detail": fossil_excl,
        "excluded_commodities_summary": excluded_commodities,
        "exclusion_policy": profile.get("exclusion_policy", ""),
        "green_products": profile.get("green_products", []),
        "equator_principles_aligned": profile.get("equator_principles_aligned", False),
        "ifc_ps_required": profile.get("ifc_ps_required", False),
        "berne_union_member": profile.get("berne_union_member", False),
        "profile_date": datetime.utcnow().isoformat() + "Z",
    }


# ---------------------------------------------------------------------------
# Engine Class Wrapper (for route imports)
# ---------------------------------------------------------------------------

class ExportCreditESGEngine:
    """Facade wrapping all E110 engine functions."""

    def assess(self, data: ExportCreditTransactionData) -> dict:
        return assess_export_credit_esg(data)

    def fossil_fuel_screen(self, sector: str, subsector: str, eca_name: str) -> dict:
        return screen_fossil_fuel_exposure(sector, subsector, eca_name)

    def equator_principles(
        self, project_value_usd: float, country_iso2: str, sector: str,
        has_existing_esia: bool = False, community_affected: bool = False,
        indigenous_peoples_affected: bool = False, cultural_heritage_affected: bool = False,
    ) -> dict:
        return apply_equator_principles(
            project_value_usd, country_iso2, sector,
            has_existing_esia, community_affected,
            indigenous_peoples_affected, cultural_heritage_affected,
        )

    def green_classification(
        self, instrument_type: str, use_of_proceeds: str, sector: str,
        project_value_usd: float = 0.0, eca_name: str = "",
    ) -> dict:
        return classify_green_trade_instrument(
            instrument_type, use_of_proceeds, sector, project_value_usd, eca_name
        )

    def eca_profile(self, eca_name: str) -> dict:
        return get_eca_sustainability_profile(eca_name)
