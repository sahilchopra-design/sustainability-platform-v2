"""
API Routes: Physical Climate Risk Pricing Engine — E104
========================================================
POST /api/v1/physical-risk-pricing/price              — Full physical risk assessment
POST /api/v1/physical-risk-pricing/price-with-geo     — Country-level pricing + point-level PostGIS hazard-grid overlay
POST /api/v1/physical-risk-pricing/return-period-losses — NatCat loss table by peril × RP
POST /api/v1/physical-risk-pricing/stranding          — Stranding probability (NGFS scenario)
GET  /api/v1/physical-risk-pricing/ref/country-profiles  — 30 country baseline risk profiles
GET  /api/v1/physical-risk-pricing/ref/damage-functions  — NatCat damage functions by asset class
GET  /api/v1/physical-risk-pricing/ref/ngfs-amplifiers   — NGFS scenario × horizon multipliers
GET  /api/v1/physical-risk-pricing/ref/insurance-gaps    — Insurance protection gaps by country/peril
GET  /api/v1/physical-risk-pricing/ref/risk-premium-table — Spread bps by risk tier
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from db.base import get_db
from services.physical_risk_pricing_engine import (
    price_physical_risk,
    calculate_return_period_losses,
    calculate_stranding_probability,
    get_country_physical_risk_profile,
    get_all_country_profiles,
    get_damage_functions,
    get_ngfs_amplifiers,
    get_insurance_gaps,
    get_risk_premium_table,
    VALID_ASSET_CLASSES,
    VALID_SCENARIOS,
    VALID_HORIZONS,
)
from services.global_physical_risk_engine import (
    get_point_hazard_profile,
    build_risk_narrative,
)

router = APIRouter(prefix="/api/v1/physical-risk-pricing", tags=["Physical Risk Pricing (E104)"])


# ---------------------------------------------------------------------------
# Request Models
# ---------------------------------------------------------------------------

class PhysicalRiskPriceRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    entity_id: str = Field(..., description="Entity or asset identifier")
    asset_class: str = Field(..., description=f"One of: {VALID_ASSET_CLASSES}")
    country_iso: str = Field(..., description="ISO 3166-1 alpha-3 country code (e.g. GBR)")
    asset_value_usd: float = Field(..., gt=0, description="Asset value in USD")
    ngfs_scenario: str = Field("orderly", description=f"NGFS physical scenario: {VALID_SCENARIOS}")
    time_horizon: str = Field("2050", description=f"Assessment horizon: {VALID_HORIZONS}")
    lat: Optional[float] = Field(None, ge=-90, le=90, description="Asset latitude (optional enrichment)")
    lng: Optional[float] = Field(None, ge=-180, le=180, description="Asset longitude (optional enrichment)")


class GeoEnhancedPriceRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    entity_id: str = Field(..., description="Entity or asset identifier")
    asset_class: str = Field(..., description=f"One of: {VALID_ASSET_CLASSES}")
    country_iso: str = Field(..., description="ISO 3166-1 alpha-3 country code (e.g. GBR)")
    asset_value_usd: float = Field(..., gt=0, description="Asset value in USD")
    ngfs_scenario: str = Field("orderly", description=f"NGFS physical scenario: {VALID_SCENARIOS}")
    time_horizon: str = Field("2050", description=f"Assessment horizon: {VALID_HORIZONS}")
    lat: float = Field(..., ge=-90, le=90, description="Asset latitude (required for this endpoint)")
    lng: float = Field(..., ge=-180, le=180, description="Asset longitude (required for this endpoint)")
    radius_km: float = Field(25.0, ge=0.1, le=200.0, description="Search radius for the point-level PostGIS hazard grids")


class ReturnPeriodLossRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    country_iso: str = Field(..., description="ISO 3166-1 alpha-3 country code")
    asset_class: str = Field(..., description=f"One of: {VALID_ASSET_CLASSES}")
    asset_value_usd: float = Field(..., gt=0, description="Asset value in USD")


class StrandingRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    country_iso: str = Field(..., description="ISO 3166-1 alpha-3 country code")
    asset_class: str = Field(..., description=f"One of: {VALID_ASSET_CLASSES}")
    ngfs_scenario: str = Field("hot_house", description=f"NGFS scenario: {VALID_SCENARIOS}")
    time_horizon: str = Field("2050", description=f"Assessment horizon: {VALID_HORIZONS}")


class CountryProfileRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    country_iso: str = Field(..., description="ISO 3166-1 alpha-3 country code")


# ---------------------------------------------------------------------------
# Response Models
# ---------------------------------------------------------------------------

class PhysicalRiskPriceResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    entity_id: str
    country_iso: str
    asset_class: str
    asset_value_usd: float
    ngfs_scenario: str
    time_horizon: str
    composite_physical_risk_score: float
    baseline_composite_score: float
    risk_tier: str
    expected_annual_loss_usd: float
    pml_100yr_usd: float
    climate_var_95pct_usd: float
    insurance_gap_usd: float
    avg_insured_ratio: float
    risk_premium_bps: float
    climate_var_pct_asset_value: float
    acute_peril_breakdown: dict
    chronic_stressor_breakdown: dict
    methodology: dict


class ReturnPeriodLossResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    country_iso: str
    country_name: str
    asset_class: str
    asset_value_usd: float
    peril_loss_table: dict


class StrandingResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    country_iso: str
    country_name: str
    asset_class: str
    ngfs_scenario: str
    time_horizon: str
    stranding_probability: float
    stranding_risk_category: str
    composite_chronic_score: float
    stressor_detail: dict
    methodology: str
    references: list


# ---------------------------------------------------------------------------
# POST /price
# ---------------------------------------------------------------------------

@router.post(
    "/price",
    response_model=PhysicalRiskPriceResponse,
    summary="Full Physical Risk Pricing Assessment",
    description=(
        "Prices acute and chronic physical climate risk for a single asset. "
        "Returns composite risk score, Expected Annual Loss (EAL), PML at 100yr return period, "
        "insurance protection gap, Climate VaR (95%), risk premium spread (bps), and risk tier. "
        "Applies NGFS physical damage amplifiers by scenario and time horizon. "
        "Perils covered: flood, cyclone, wildfire, earthquake, heatwave (acute); "
        "sea level rise, drought, temperature increase (chronic). "
        "Source references: NGFS CGFI 2023, Swiss Re sigma 1/2024, RMS/AIR/Verisk."
    ),
)
def price_asset_physical_risk(request: PhysicalRiskPriceRequest) -> dict:
    return price_physical_risk(
        entity_id=request.entity_id,
        asset_class=request.asset_class,
        country_iso=request.country_iso,
        asset_value_usd=request.asset_value_usd,
        ngfs_scenario=request.ngfs_scenario,
        time_horizon=request.time_horizon,
        lat=request.lat,
        lng=request.lng,
    )


# ---------------------------------------------------------------------------
# POST /price-with-geo — additive: country-level pricing + point-level PostGIS overlay
# ---------------------------------------------------------------------------

@router.post(
    "/price-with-geo",
    summary="Physical Risk Pricing enriched with point-level global hazard-grid data",
    description=(
        "Runs the existing country-level physical risk pricing assessment (identical to "
        "POST /price) AND, additively, calls the new Global Physical Risk Engine "
        "(services/global_physical_risk_engine.py) to fetch a point-level composite hazard "
        "score from the real PostGIS hazard grids (earthquake, cyclone, wildfire, flood, "
        "sea-level-rise) at the given lat/lng. Returns both: `country_level_pricing` "
        "(unchanged EAL/PML/VaR/premium methodology) and `point_level_hazard_profile` "
        "(the composite digital-twin score + per-hazard breakdown + data_availability + "
        "narrative for the exact coordinates). Does not alter or replace the existing "
        "/price endpoint or its country-level methodology in any way — purely additive."
    ),
)
def price_asset_physical_risk_with_geo(
    request: GeoEnhancedPriceRequest,
    db: Session = Depends(get_db),
) -> dict:
    country_level = price_physical_risk(
        entity_id=request.entity_id,
        asset_class=request.asset_class,
        country_iso=request.country_iso,
        asset_value_usd=request.asset_value_usd,
        ngfs_scenario=request.ngfs_scenario,
        time_horizon=request.time_horizon,
        lat=request.lat,
        lng=request.lng,
    )

    point_level = get_point_hazard_profile(db, lat=request.lat, lon=request.lng, radius_km=request.radius_km)
    point_level["risk_narrative"] = build_risk_narrative(point_level)

    return {
        "entity_id": request.entity_id,
        "lat": request.lat,
        "lng": request.lng,
        "country_level_pricing": country_level,
        "point_level_hazard_profile": point_level,
        "note": (
            "country_level_pricing uses the 30-country baseline reference dataset "
            "(INFORM/ND-GAIN/Swiss Re CatNet); point_level_hazard_profile uses the live "
            "PostGIS global hazard grids at the exact coordinates. The two are independent "
            "methodologies shown side by side, not blended into a single number."
        ),
    }


# ---------------------------------------------------------------------------
# POST /return-period-losses
# ---------------------------------------------------------------------------

@router.post(
    "/return-period-losses",
    response_model=ReturnPeriodLossResponse,
    summary="NatCat Return-Period Loss Table",
    description=(
        "Calculates expected loss in USD for each peril (flood, cyclone, wildfire, earthquake, heatwave) "
        "at return periods 10yr / 25yr / 50yr / 100yr / 200yr / 500yr. "
        "Each cell reports gross loss, insured portion, and uninsured portion based on country-specific "
        "insurance protection gap ratios from Swiss Re sigma. "
        "Baseline loss percentages are scaled by country risk score and asset vulnerability coefficient."
    ),
)
def return_period_losses(request: ReturnPeriodLossRequest) -> dict:
    return calculate_return_period_losses(
        country_iso=request.country_iso,
        asset_class=request.asset_class,
        asset_value_usd=request.asset_value_usd,
    )


# ---------------------------------------------------------------------------
# POST /stranding
# ---------------------------------------------------------------------------

@router.post(
    "/stranding",
    response_model=StrandingResponse,
    summary="Physical Stranding Probability under NGFS Scenario",
    description=(
        "Estimates the probability of physical stranding for an asset under a given NGFS physical scenario "
        "and time horizon. Uses chronic stressor composite (sea level rise, drought, heatwave, flood) "
        "mapped through asset-class sensitivity weights and a logistic stranding function. "
        "Returns probability 0-1 and stranding risk category (negligible/low/moderate/high/very_high). "
        "Relevant for TCFD physical risk scenario analysis and IFRS S2 physical risk disclosures."
    ),
)
def stranding_probability(request: StrandingRequest) -> dict:
    return calculate_stranding_probability(
        country_iso=request.country_iso,
        asset_class=request.asset_class,
        ngfs_scenario=request.ngfs_scenario,
        time_horizon=request.time_horizon,
    )


# ---------------------------------------------------------------------------
# GET /ref/country-profiles
# ---------------------------------------------------------------------------

@router.get(
    "/ref/country-profiles",
    summary="30-Country Physical Risk Baseline Profiles",
    description=(
        "Returns baseline physical risk scores for all 30 reference countries. "
        "Each country profile includes: flood, cyclone, wildfire, drought, heatwave baselines (0-1), "
        "sea_level_risk, earthquake_baseline, ND-GAIN score, INFORM hazard index, "
        "composite risk score, and baseline risk tier. "
        "Data sources: INFORM Risk Index 2023, ND-GAIN Country Index 2023, Swiss Re CatNet, IPCC AR6."
    ),
)
def ref_country_profiles() -> dict:
    return {
        "count": 30,
        "countries": get_all_country_profiles(),
        "metadata": {
            "score_range": "0.0 (no risk) to 1.0 (maximum risk)",
            "composite_method": "Weighted average of 7 peril baselines",
            "sources": [
                "INFORM Risk Index 2023",
                "ND-GAIN Country Index 2023",
                "Swiss Re CatNet",
                "IPCC AR6 WGI",
            ],
        },
    }


# ---------------------------------------------------------------------------
# GET /ref/damage-functions
# ---------------------------------------------------------------------------

@router.get(
    "/ref/damage-functions",
    summary="NatCat Damage Functions by Asset Class",
    description=(
        "Returns NatCat depth-damage curves and vulnerability coefficients for "
        "5 perils × 5 asset classes × 6 return periods. "
        "Loss percentages represent industry-consensus benchmarks (RMS/AIR/Verisk style). "
        "Effective loss = table_loss_pct × country_baseline_score × vulnerability_coefficient. "
        "Also returns return-period to annual exceedance probability mapping."
    ),
)
def ref_damage_functions() -> dict:
    return get_damage_functions()


# ---------------------------------------------------------------------------
# GET /ref/ngfs-amplifiers
# ---------------------------------------------------------------------------

@router.get(
    "/ref/ngfs-amplifiers",
    summary="NGFS Physical Damage Amplifiers by Scenario × Horizon",
    description=(
        "Returns NGFS scenario × time horizon amplifier multipliers for each acute peril. "
        "Multipliers are applied to country baseline risk scores to derive forward-looking stressed scores. "
        "Three scenarios: orderly (NZ2050), disorderly (delayed transition), hot_house (current policies). "
        "Three horizons: 2030, 2040, 2050. "
        "Sources: NGFS CGFI Phase IV 2023, IPCC AR6 WGI Table SPM.2."
    ),
)
def ref_ngfs_amplifiers() -> dict:
    return get_ngfs_amplifiers()


# ---------------------------------------------------------------------------
# GET /ref/insurance-gaps
# ---------------------------------------------------------------------------

@router.get(
    "/ref/insurance-gaps",
    summary="Insurance Protection Gaps by Country and Peril",
    description=(
        "Returns the ratio of insured to total economic loss (0=uninsured, 1=fully insured) "
        "for all 30 reference countries across 6 perils: flood, cyclone, wildfire, earthquake, "
        "heatwave, drought. "
        "Emerging markets typically show protection gaps of 90-98% (ratios 0.02-0.10). "
        "Sources: Swiss Re sigma No. 1/2024; Munich Re NatCatSERVICE 2023."
    ),
)
def ref_insurance_gaps() -> dict:
    return get_insurance_gaps()


# ---------------------------------------------------------------------------
# GET /ref/risk-premium-table
# ---------------------------------------------------------------------------

@router.get(
    "/ref/risk-premium-table",
    summary="Physical Risk Premium Table — Spread bps by Risk Tier",
    description=(
        "Returns the risk premium spread (bps above risk-free rate) attributable to physical climate risk "
        "for each risk tier: low / moderate / elevated / high / very_high / extreme. "
        "Also returns Climate VaR percentage (95th percentile as % of asset value) per tier. "
        "Sources: PRA SS3/19, ECB Supervisory Expectations 2022, NGFS CGFI 2023."
    ),
)
def ref_risk_premium_table() -> dict:
    return get_risk_premium_table()
