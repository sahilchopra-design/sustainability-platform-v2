"""
E106 — Climate-Linked Structured Products API Routes
Prefix: /api/v1/climate-derivatives
No DB calls — all computation is in-memory via climate_derivatives_engine.
"""

from __future__ import annotations

from typing import Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, model_validator

from services.climate_derivatives_engine import (
    price_weather_derivative,
    price_eua_option,
    structure_cat_bond,
    classify_regulatory,
    get_product_templates,
    WEATHER_STATIONS,
    EUA_MARKET_DATA,
    PERIL_MODELS,
    CCP_ELIGIBILITY,
    ISDA_SLD_CHECKLIST,
    REGULATORY_CLASSIFICATION,
)

router = APIRouter(prefix="/api/v1/climate-derivatives", tags=["climate-derivatives"])


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------

class WeatherDerivativePriceRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    underlying: str = Field(
        ...,
        description="Underlying index: hdd, cdd, rainfall_mm, wind_ms, sunshine_hrs",
        examples=["hdd"],
    )
    city_station: str = Field(
        ...,
        description="Reference station key (e.g. london, chicago, tokyo)",
        examples=["london"],
    )
    contract_type: str = Field(
        ...,
        description="Contract type: call, put, swap, cap, floor",
        examples=["call"],
    )
    strike: float = Field(..., gt=0, description="Strike level in underlying units", examples=[2400.0])
    notional_usd: float = Field(..., gt=0, description="Notional in USD", examples=[10_000_000.0])
    tenor_days: int = Field(..., gt=0, le=730, description="Contract tenor in days", examples=[90])
    risk_premium_loading: float = Field(
        default=0.20,
        ge=0.10,
        le=0.35,
        description="Risk premium as fraction of expected payout (0.10–0.35)",
    )

    @model_validator(mode="after")
    def validate_contract_type(self) -> "WeatherDerivativePriceRequest":
        valid = {"call", "put", "swap", "cap", "floor"}
        if self.contract_type.lower() not in valid:
            raise ValueError(f"contract_type must be one of {valid}")
        return self


class EUAOptionPriceRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    option_type: str = Field(
        ...,
        description="'call' or 'put'",
        examples=["call"],
    )
    strike: float = Field(..., gt=0, description="Strike price EUR/tCO2", examples=[70.0])
    spot: Optional[float] = Field(
        default=None,
        gt=0,
        description="Spot price EUR/tCO2 (defaults to market data ~€65)",
    )
    tenor_years: float = Field(
        default=1.0,
        gt=0,
        le=5.0,
        description="Time to expiry in years",
        examples=[1.0],
    )
    volatility: Optional[float] = Field(
        default=None,
        gt=0,
        le=2.0,
        description="Annual volatility as decimal (defaults to 0.35)",
    )
    risk_free_rate: Optional[float] = Field(
        default=None,
        description="Risk-free rate as decimal (defaults to 0.035)",
    )

    @model_validator(mode="after")
    def validate_option_type(self) -> "EUAOptionPriceRequest":
        if self.option_type.lower() not in {"call", "put"}:
            raise ValueError("option_type must be 'call' or 'put'")
        return self


class CatBondStructureRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    peril: str = Field(
        ...,
        description="Peril type: wind, flood, earthquake, wildfire, storm_surge, hail",
        examples=["wind"],
    )
    country: str = Field(
        ...,
        min_length=2,
        max_length=2,
        description="ISO-2 country code",
        examples=["US"],
    )
    attachment_point_usd_m: float = Field(
        ..., gt=0,
        description="Industry loss attachment point (USD millions)",
        examples=[500.0],
    )
    exhaustion_point_usd_m: float = Field(
        ..., gt=0,
        description="Industry loss exhaustion point (USD millions)",
        examples=[1500.0],
    )
    notional_usd_m: float = Field(
        ..., gt=0,
        description="Cat bond notional (USD millions)",
        examples=[250.0],
    )
    tenor_years: float = Field(
        default=3.0,
        gt=0,
        le=10.0,
        description="Bond tenor in years",
    )
    trigger_type: str = Field(
        ...,
        description="Trigger: indemnity, parametric, index, modelled_loss",
        examples=["parametric"],
    )
    peril_model: str = Field(
        ...,
        description="Catastrophe model provider: RMS, AIR, Verisk, JBA, Aon, SwissRe, MunichRe, GuyCarpenter",
        examples=["RMS"],
    )

    @model_validator(mode="after")
    def validate_attachment_exhaustion(self) -> "CatBondStructureRequest":
        if self.attachment_point_usd_m >= self.exhaustion_point_usd_m:
            raise ValueError("attachment_point_usd_m must be less than exhaustion_point_usd_m")
        return self


class RegulatoryClassifyRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    product_type: str = Field(
        ...,
        description="Product template ID (see /ref/product-templates)",
        examples=["weather_swap"],
    )
    counterparty_type: str = Field(
        ...,
        description="financial_counterparty, non_financial_counterparty, nfc_plus, third_country",
        examples=["financial_counterparty"],
    )
    jurisdiction: str = Field(
        ...,
        description="Regulatory jurisdiction: EU, UK, US, APAC",
        examples=["EU"],
    )

    @model_validator(mode="after")
    def validate_fields(self) -> "RegulatoryClassifyRequest":
        valid_cp = {"financial_counterparty", "non_financial_counterparty", "nfc_plus", "third_country"}
        valid_jur = {"EU", "UK", "US", "APAC"}
        if self.counterparty_type not in valid_cp:
            raise ValueError(f"counterparty_type must be one of {valid_cp}")
        if self.jurisdiction not in valid_jur:
            raise ValueError(f"jurisdiction must be one of {valid_jur}")
        return self


# ---------------------------------------------------------------------------
# POST Endpoints — Pricing / Structuring
# ---------------------------------------------------------------------------

@router.post(
    "/price-weather",
    summary="Weather derivative pricing (burn analysis)",
    response_model=dict,
)
def price_weather_endpoint(request: WeatherDerivativePriceRequest) -> dict[str, Any]:
    """
    Price a weather derivative (HDD / CDD / rainfall / wind / sunshine) using
    20-year burn analysis with risk-premium loading (15–35%).

    Returns fair value, Greeks (delta / gamma / vega), payout distribution,
    and confidence intervals.
    """
    try:
        result = price_weather_derivative(
            underlying=request.underlying,
            city_station=request.city_station,
            contract_type=request.contract_type,
            strike=request.strike,
            notional_usd=request.notional_usd,
            tenor_days=request.tenor_days,
            risk_premium_loading=request.risk_premium_loading,
        )
        return {"status": "success", "data": result}
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Pricing error: {exc}") from exc


@router.post(
    "/price-eua-option",
    summary="EUA option pricing (Black-Scholes-Merton + Greeks)",
    response_model=dict,
)
def price_eua_option_endpoint(request: EUAOptionPriceRequest) -> dict[str, Any]:
    """
    Price an EU Allowance (EUA) call or put option using Black-Scholes-Merton
    adapted for commodity underlyings.

    Returns fair value, intrinsic/time-value split, full Greeks (delta, gamma,
    vega, theta, rho), and vol surface reference point.
    """
    try:
        result = price_eua_option(
            option_type=request.option_type,
            strike=request.strike,
            spot=request.spot,
            tenor_years=request.tenor_years,
            volatility=request.volatility,
            risk_free_rate=request.risk_free_rate,
        )
        return {"status": "success", "data": result}
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Pricing error: {exc}") from exc


@router.post(
    "/structure-cat-bond",
    summary="Catastrophe bond structuring (EL + spread)",
    response_model=dict,
)
def structure_cat_bond_endpoint(request: CatBondStructureRequest) -> dict[str, Any]:
    """
    Structure a catastrophe bond:
    - Expected loss % (frequency × severity, log-normal layer)
    - Fair spread bps = EL + risk premium + liquidity premium + basis risk adj
    - SPV structure (Cayman, Rule 144A/Reg S, trustee)
    - Survival function at 8 return periods
    - EMIR / MiFID II / Solvency II classification

    Trigger types: indemnity (no basis risk adj), parametric (+150bps),
    industry_index (+100bps), modelled_loss (+50bps).
    """
    try:
        result = structure_cat_bond(
            peril=request.peril,
            country=request.country,
            attachment_point_usd_m=request.attachment_point_usd_m,
            exhaustion_point_usd_m=request.exhaustion_point_usd_m,
            notional_usd_m=request.notional_usd_m,
            tenor_years=request.tenor_years,
            trigger_type=request.trigger_type,
            peril_model=request.peril_model,
        )
        return {"status": "success", "data": result}
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Structuring error: {exc}") from exc


@router.post(
    "/classify-regulatory",
    summary="EMIR / MiFID II regulatory classification",
    response_model=dict,
)
def classify_regulatory_endpoint(request: RegulatoryClassifyRequest) -> dict[str, Any]:
    """
    Classify a climate-linked derivative under EMIR, MiFID II, and ISDA
    documentation framework.

    Returns:
    - EMIR asset class and clearing threshold
    - MiFID II product category + appropriateness / suitability requirements
    - Clearing obligation assessment
    - Bilateral margin requirements
    - Eligible CCPs
    - ISDA confirmation template
    - Jurisdiction-specific regulatory note (EU / UK / US / APAC)
    - ISDA 2022 SLD 12-point checklist (for sustainability-linked products)
    """
    try:
        result = classify_regulatory(
            product_type=request.product_type,
            counterparty_type=request.counterparty_type,
            jurisdiction=request.jurisdiction,
        )
        return {"status": "success", "data": result}
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Classification error: {exc}") from exc


# ---------------------------------------------------------------------------
# GET Reference Endpoints
# ---------------------------------------------------------------------------

@router.get(
    "/ref/weather-stations",
    summary="20 reference weather-derivative stations with historical parameters",
    response_model=dict,
)
def get_weather_stations() -> dict[str, Any]:
    """
    Return all 20 reference weather-derivative stations (London, Chicago, Tokyo, …).
    Each station includes: city, country, lat/lon, and per-underlying (HDD, CDD,
    rainfall_mm, wind_ms, sunshine_hrs) annual mean, std dev, and quarterly seasonal
    multipliers.
    """
    return {
        "status": "success",
        "count": len(WEATHER_STATIONS),
        "stations": {
            key: {
                "city": v["city"],
                "country": v["country"],
                "lat": v["lat"],
                "lon": v["lon"],
                "underlyings": {
                    und: {
                        "annual_mean": v[und]["annual_mean"],
                        "std_dev": v[und]["std_dev"],
                        "seasonal_multipliers": v[und]["seasonal"],
                    }
                    for und in ("hdd", "cdd", "rainfall_mm", "wind_ms", "sunshine_hrs")
                },
            }
            for key, v in WEATHER_STATIONS.items()
        },
    }


@router.get(
    "/ref/eua-market",
    summary="EUA spot price, volatility, correlation, and futures curve",
    response_model=dict,
)
def get_eua_market() -> dict[str, Any]:
    """
    Return EUA (EU Allowance) market reference data including spot price (~€65/t),
    historical volatility (35%), mean reversion parameters, futures curve
    (Dec-2025 to Dec-2030), vol surface (3m / 6m / 12m / 24m) and
    cross-asset correlations (TTF gas, Brent, EuroStoxx50, coal, power).
    """
    return {"status": "success", "data": EUA_MARKET_DATA}


@router.get(
    "/ref/product-templates",
    summary="12 climate-linked structured product templates",
    response_model=dict,
)
def get_product_templates_endpoint() -> dict[str, Any]:
    """
    Return all 12 climate-linked structured product templates with term-sheet
    summaries, EMIR/MiFID classification, ISDA template reference, typical
    tenor/notional, key risks, and eligible investor base.

    Products: cat_bond, weather_swap, eua_call_spread, temperature_floor,
    rainfall_cap, carbon_credit_repo, green_total_return_swap,
    sustainability_linked_swap, parametric_insurance_swap,
    climate_index_note, transition_risk_put, biodiversity_credit_forward.
    """
    templates = get_product_templates()
    return {
        "status": "success",
        "count": len(templates),
        "templates": templates,
    }


@router.get(
    "/ref/peril-models",
    summary="8 catastrophe model providers",
    response_model=dict,
)
def get_peril_models() -> dict[str, Any]:
    """
    Return reference data for the 8 cat-bond peril model providers:
    RMS (Moody's), AIR (Verisk), Verisk, JBA, Aon Impact Forecasting,
    Swiss Re CatNet, Munich Re NATHAN, Guy Carpenter GC Catview.

    Includes covered perils, geographic coverage, model versions,
    AEP return periods, data vintage, and Solvency II approval status.
    """
    return {
        "status": "success",
        "count": len(PERIL_MODELS),
        "peril_models": PERIL_MODELS,
    }


@router.get(
    "/ref/ccp-eligibility",
    summary="CCP clearing eligibility by product and venue",
    response_model=dict,
)
def get_ccp_eligibility() -> dict[str, Any]:
    """
    Return CCP clearing eligibility information for:
    - ICE (EUAs, weather derivatives)
    - CME (HDD/CDD weather futures and options)
    - LCH (sustainability-linked swaps, green TRS)
    - Eurex (EUA futures/options, carbon credit repos)

    Includes cleared product lists, margin models, initial margin indicatives,
    and membership requirements.

    Also returns ISDA 2022 Sustainability-Linked Derivatives 12-point checklist.
    """
    return {
        "status": "success",
        "ccp_eligibility": CCP_ELIGIBILITY,
        "isda_sld_checklist": ISDA_SLD_CHECKLIST,
        "regulatory_classification_reference": {
            "emir_classes": REGULATORY_CLASSIFICATION["emir_classes"],
            "hedging_exemption_criteria": REGULATORY_CLASSIFICATION["hedging_exemption_criteria"],
            "reporting_obligations": REGULATORY_CLASSIFICATION["reporting_obligations"],
        },
    }
