"""
API Routes: CRREM & Green Buildings Engine — E112
==================================================
POST /api/v1/crrem/assess               — CRREM pathway alignment assessment
POST /api/v1/crrem/retrofit-plan        — Retrofit plan ranked by NPV
POST /api/v1/crrem/green-premium        — Green certification premium & brown discount
POST /api/v1/crrem/gresb-score          — GRESB score calculation
GET  /api/v1/crrem/ref/crrem-pathways   — Full CRREM pathway reference data
GET  /api/v1/crrem/ref/retrofit-measures — 12 retrofit measure specifications
GET  /api/v1/crrem/ref/epc-benchmarks   — EPC A-G energy intensity thresholds by country
GET  /api/v1/crrem/ref/certifications   — BREEAM / LEED / NABERS / DGNB comparison
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.crrem_green_buildings_engine import (
    CRREM_PATHWAYS,
    EPC_THRESHOLDS,
    GRESB_ASPECTS,
    RETROFIT_MEASURES,
    CRREMAssessRequest,
    GRESBRequest,
    GreenPremiumRequest,
    RetrofitPlanRequest,
    assess_crrem_alignment,
    assess_gresb_score,
    calculate_green_premium,
    calculate_retrofit_plan,
)

router = APIRouter(prefix="/api/v1/crrem", tags=["CRREM Green Buildings"])

# ---------------------------------------------------------------------------
# POST endpoints
# ---------------------------------------------------------------------------


@router.post("/assess")
def crrem_assess(req: CRREMAssessRequest):
    """
    Assess a real estate asset against CRREM 1.5°C and 2°C decarbonisation pathways.
    Returns energy/carbon gap %, stranding year, risk tier, and optional financial risk.
    """
    try:
        result = assess_crrem_alignment(req.model_dump())
        return {"status": "ok", "data": result}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/retrofit-plan")
def retrofit_plan(req: RetrofitPlanRequest):
    """
    Generate a sequenced retrofit plan ranked by NPV to reach the target EPC rating.
    All 12 measures are scored; a greedy selection subset is returned to meet the target.
    """
    try:
        asset_data = req.model_dump()
        result = calculate_retrofit_plan(asset_data, target_epc=req.target_epc)
        return {"status": "ok", "data": result}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/green-premium")
def green_premium(req: GreenPremiumRequest):
    """
    Return the green rent premium, capital value uplift, and brown discount risk
    for a given building type, country, and EPC rating.
    """
    try:
        result = calculate_green_premium(
            building_type=req.building_type,
            country_iso3=req.country_iso3,
            epc_rating=req.epc_rating,
        )
        # Augment with absolute EUR figures if provided
        if req.asset_value_eur and result["value_uplift_pct"] > 0:
            result["value_uplift_eur"] = round(req.asset_value_eur * result["value_uplift_pct"] / 100, 0)
            result["brown_discount_eur"] = round(req.asset_value_eur * result["brown_discount_risk_pct"] / 100, 0)
        if req.annual_rent_eur and result["rent_premium_pct"] > 0:
            result["rent_premium_eur"] = round(req.annual_rent_eur * result["rent_premium_pct"] / 100, 0)
        return {"status": "ok", "data": result}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/gresb-score")
def gresb_score(req: GRESBRequest):
    """
    Calculate GRESB total score, star rating, and improvement priorities
    from aspect-level scores (Management / Policy / Reporting / Risk / Opportunities).
    """
    try:
        result = assess_gresb_score(req.aspect_scores)
        result["entity_name"] = req.entity_name
        result["peer_count"] = req.peer_count
        return {"status": "ok", "data": result}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


# ---------------------------------------------------------------------------
# GET reference endpoints
# ---------------------------------------------------------------------------


@router.get("/ref/crrem-pathways")
def ref_crrem_pathways(building_type: Optional[str] = None, country_iso3: Optional[str] = None):
    """
    Return CRREM pathway targets (energy kWh/m²/yr and carbon kgCO2/m²/yr) for
    years 2025-2050 under 1.5°C and 2°C scenarios.
    Optionally filter by building_type and/or country_iso3.
    """
    data = CRREM_PATHWAYS
    if building_type:
        if building_type not in data:
            raise HTTPException(status_code=404, detail=f"building_type '{building_type}' not found. "
                                f"Valid: {list(data.keys())}")
        data = {building_type: data[building_type]}
    if country_iso3:
        filtered = {}
        for bt, countries in data.items():
            if country_iso3 in countries:
                filtered[bt] = {country_iso3: countries[country_iso3]}
        if not filtered:
            raise HTTPException(status_code=404, detail=f"country_iso3 '{country_iso3}' not found.")
        data = filtered
    return {
        "status": "ok",
        "description": "CRREM v2.0 (2023) pathway targets — energy intensity kWh/m²/yr and carbon intensity kgCO2/m²/yr",
        "scenarios": ["1.5C", "2.0C"],
        "waypoint_years": [2025, 2030, 2035, 2040, 2050],
        "data": data,
    }


@router.get("/ref/retrofit-measures")
def ref_retrofit_measures():
    """
    Return all 12 retrofit measures with energy/carbon saving %, capex, lifetime, and payback.
    """
    return {
        "status": "ok",
        "description": "Retrofit measure specifications — EPBD 2024, RICS Sustainability Guidance, BPIE 2023",
        "count": len(RETROFIT_MEASURES),
        "measures": RETROFIT_MEASURES,
        "notes": {
            "energy_saving_pct": "% reduction applied to current energy use intensity",
            "carbon_saving_pct": "% reduction in direct + indirect carbon emissions",
            "capex_eur_m2": "Typical installed cost EUR per m² gross floor area",
            "lifetime_yr": "Expected measure lifetime before replacement",
            "payback_yr": "Simple payback assuming typical energy cost EUR 12/m²/yr",
        },
    }


@router.get("/ref/epc-benchmarks")
def ref_epc_benchmarks():
    """
    Return EPC A-G energy intensity upper bounds (kWh/m²/yr) for DEU, GBR, FRA, USA, AUS.
    """
    return {
        "status": "ok",
        "description": "EPC energy intensity rating thresholds — EU EPBD recast 2024, UK DECs, ADEME DPE 2021, DOE 2023",
        "rating_order": ["A", "B", "C", "D", "E", "F", "G"],
        "unit": "kWh/m²/yr (upper bound for each band)",
        "thresholds": EPC_THRESHOLDS,
        "regulatory_context": {
            "DEU": "Gebäudeenergiegesetz (GEG) 2023 + EU EPBD recast Art.9",
            "GBR": "UK Display Energy Certificates + MEES Regulations SI 2015/962",
            "FRA": "DPE réformé Arrêté 31 mars 2021 (ADEME)",
            "USA": "DOE EnergyGuide / ENERGY STAR Portfolio Manager 2023",
            "AUS": "NABERS Energy 2023 + NCC 2022 Section J",
        },
    }


@router.get("/ref/certifications")
def ref_certifications():
    """
    Return a comparative overview of BREEAM, LEED, NABERS, and DGNB green building certifications.
    """
    return {
        "status": "ok",
        "certifications": {
            "BREEAM": {
                "full_name": "Building Research Establishment Environmental Assessment Method",
                "origin": "UK (BRE Global)",
                "applicable_regions": ["Europe", "Middle East", "Asia"],
                "rating_scale": ["Unclassified", "Pass", "Good", "Very Good", "Excellent", "Outstanding"],
                "categories": ["Energy", "Health & Wellbeing", "Innovation", "Land Use", "Materials",
                               "Management", "Pollution", "Transport", "Waste", "Water"],
                "eu_taxonomy_recognition": True,
                "tcfd_alignment": "Partial — climate risk in Management/Innovation categories",
                "typical_capex_premium_pct": 1.5,
                "website": "https://www.breeam.com",
            },
            "LEED": {
                "full_name": "Leadership in Energy and Environmental Design",
                "origin": "USA (USGBC)",
                "applicable_regions": ["Global — 180+ countries"],
                "rating_scale": ["Certified (40-49)", "Silver (50-59)", "Gold (60-79)", "Platinum (80+)"],
                "categories": ["Location & Transportation", "Sustainable Sites", "Water Efficiency",
                               "Energy & Atmosphere", "Materials & Resources", "Indoor Environmental Quality",
                               "Innovation", "Regional Priority"],
                "eu_taxonomy_recognition": True,
                "tcfd_alignment": "Indirect via Energy & Atmosphere credits",
                "typical_capex_premium_pct": 2.0,
                "website": "https://www.usgbc.org/leed",
            },
            "NABERS": {
                "full_name": "National Australian Built Environment Rating System",
                "origin": "Australia (NSW Government)",
                "applicable_regions": ["Australia", "NZ (pilot)", "UK (pilot)"],
                "rating_scale": ["1 Star (poor)", "2 Star", "3 Star (average)", "4 Star", "5 Star", "6 Star (market leading)"],
                "categories": ["Energy", "Water", "Waste", "Indoor Environment"],
                "eu_taxonomy_recognition": False,
                "tcfd_alignment": "Strong — mandatory climate risk disclosure for 5/6-star",
                "typical_capex_premium_pct": 1.0,
                "website": "https://www.nabers.gov.au",
            },
            "DGNB": {
                "full_name": "Deutsche Gesellschaft für Nachhaltiges Bauen",
                "origin": "Germany (DGNB e.V.)",
                "applicable_regions": ["Germany", "Austria", "Denmark", "Bulgaria", "China", "Thailand"],
                "rating_scale": ["Bronze", "Silver", "Gold", "Platinum"],
                "categories": ["Environmental Quality", "Economic Quality", "Sociocultural & Functional Quality",
                               "Technical Quality", "Process Quality", "Site Quality"],
                "eu_taxonomy_recognition": True,
                "tcfd_alignment": "Strong — EU Taxonomy climate criteria integrated",
                "typical_capex_premium_pct": 1.8,
                "website": "https://www.dgnb.de",
            },
        },
        "comparison_note": (
            "All four schemes are recognised under the EU Green Bond Standard (EU GBS 2023/2631) "
            "as proxy indicators for EU Taxonomy substantial contribution to climate mitigation. "
            "BREEAM Excellent+ / LEED Gold+ / NABERS 5+ / DGNB Gold+ broadly map to "
            "EU Taxonomy energy performance threshold (EPC class A or top 15% national stock)."
        ),
    }
