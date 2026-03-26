"""
API Routes: Climate Tech Investment Engine (E118)
=================================================
POST /api/v1/climate-tech/assess-technology       — Single technology assessment (TRL, costs, MAC, NZE gap)
POST /api/v1/climate-tech/investment-opportunity  — VC/PE investment opportunity analysis
POST /api/v1/climate-tech/portfolio-analysis      — Climate tech portfolio diversification + abatement
POST /api/v1/climate-tech/learning-curve          — Cost reduction projection via Wright's Law
GET  /api/v1/climate-tech/ref/ctvc-taxonomy       — 11-sector CTVC taxonomy
GET  /api/v1/climate-tech/ref/iea-deployment      — IEA NZE 2030 deployment targets (20 technologies)
GET  /api/v1/climate-tech/ref/mac-curves          — IEA Marginal Abatement Cost curves (25 technologies)
GET  /api/v1/climate-tech/ref/vc-market-data      — VC/PE deal statistics by CTVC sector and funding stage
"""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional

from services.climate_tech_engine import (
    ClimateTechEngine,
    CTVC_TAXONOMY,
    IEA_TECHNOLOGIES,
    MAC_CURVES,
    VC_PE_DEAL_DATA,
    BNEF_LEARNING_CURVES,
    PATENT_INTENSITY,
    TRL_DEFINITIONS,
    GREEN_TAXONOMY_ALIGNMENT,
)

router = APIRouter(prefix="/api/v1/climate-tech", tags=["ClimateTech"])


# ---------------------------------------------------------------------------
# Request Models
# ---------------------------------------------------------------------------

class TechnologyAssessRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    technology_name: str = Field(..., description="Name of the climate technology (e.g. 'solar_pv_utility', 'green_hydrogen')")
    category: str = Field("", description="Optional category hint (e.g. 'energy', 'transportation', 'industry')")


class InvestmentOpportunityRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    technology: str = Field(..., description="Technology name or key (e.g. 'offshore_wind', 'direct_air_capture')")
    stage: str = Field("growth", description="Funding stage: seed | early | growth | late")
    geography: str = Field("USA", description="Target geography (e.g. 'USA', 'EU', 'China', 'UK')")
    investment_size_usd: float = Field(..., gt=0, description="Proposed investment size in USD")


class PortfolioAnalysisRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    technology_list: list[str] = Field(..., min_length=1, description="List of technology names")
    investment_amounts: list[float] = Field(..., min_length=1, description="Corresponding USD investment amounts")


class LearningCurveRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    technology: str = Field(..., description="Technology name (matched against BNEF / IEA databases)")
    current_cumulative_capacity: float = Field(..., gt=0, description="Current cumulative deployed capacity (GW, GWh, Mt, etc.)")
    target_cumulative_capacity: float = Field(..., gt=0, description="Target cumulative capacity for cost projection")


# ---------------------------------------------------------------------------
# Response helper — convert dataclass to dict
# ---------------------------------------------------------------------------

def _dc(obj) -> dict:
    """Shallow dataclass → dict."""
    import dataclasses
    if dataclasses.is_dataclass(obj):
        return dataclasses.asdict(obj)
    return obj


# ---------------------------------------------------------------------------
# POST Endpoints
# ---------------------------------------------------------------------------

@router.post("/assess-technology")
def assess_technology(req: TechnologyAssessRequest):
    """
    Assess a single climate technology.

    Returns TRL, deployment stage, learning rate, cost trajectory (2024/2030/2040/2050),
    abatement potential (GtCO2/yr), MAC (USD/tCO2), IEA NZE deployment gap,
    EU Taxonomy alignment, and investment attractiveness score (0-100).
    """
    engine = ClimateTechEngine()
    result = engine.assess_technology(req.technology_name, req.category)
    return _dc(result)


@router.post("/investment-opportunity")
def analyse_investment_opportunity(req: InvestmentOpportunityRequest):
    """
    Analyse a climate tech investment opportunity for VC/PE context.

    Returns: market size, YoY growth, median comparable deal size, EV/Revenue and
    EV/EBITDA multiples, patent intensity in target geography, risk-return profile,
    and recommended investment thesis.
    """
    engine = ClimateTechEngine()
    result = engine.analyse_investment_opportunity(
        technology=req.technology,
        stage=req.stage,
        geography=req.geography,
        investment_size_usd=req.investment_size_usd,
    )
    return _dc(result)


@router.post("/portfolio-analysis")
def build_portfolio_analysis(req: PortfolioAnalysisRequest):
    """
    Analyse a climate tech investment portfolio.

    Returns: CTVC sector allocation, diversification score (HHI-based),
    combined abatement potential (GtCO2/yr by 2030 and 2050), portfolio-weighted MAC,
    EU Taxonomy alignment %, temperature contribution estimate, TRL distribution,
    and rebalancing suggestions.
    """
    engine = ClimateTechEngine()
    result = engine.build_portfolio_analysis(
        technology_list=req.technology_list,
        investment_amounts=req.investment_amounts,
    )
    return _dc(result)


@router.post("/learning-curve")
def calculate_learning_curve(req: LearningCurveRequest):
    """
    Project technology cost at a target cumulative capacity using Wright's Law.

    Returns: projected cost, cost reduction %, capacity doublings, LCOE/LCOS
    trajectory (where applicable), cost milestones, key cost reduction levers,
    and estimated years to reach target.
    """
    engine = ClimateTechEngine()
    result = engine.calculate_learning_curve(
        technology=req.technology,
        current_cumulative_capacity=req.current_cumulative_capacity,
        target_cumulative_capacity=req.target_cumulative_capacity,
    )
    return _dc(result)


# ---------------------------------------------------------------------------
# GET Reference Endpoints
# ---------------------------------------------------------------------------

@router.get("/ref/ctvc-taxonomy")
def get_ctvc_taxonomy():
    """
    Return the full CTVC Climate Tech Taxonomy — 11 sectors with sub-sectors,
    key technologies, investment stage distribution, EU Taxonomy eligibility,
    and SFDR PAI coverage.
    """
    return {
        "source": "CTVC Climate Tech Taxonomy 2024",
        "sector_count": len(CTVC_TAXONOMY),
        "sectors": CTVC_TAXONOMY,
    }


@router.get("/ref/iea-deployment")
def get_iea_deployment():
    """
    Return IEA Clean Energy Investment data (2024) for 20 technology categories.

    Includes: current global capacity/deployment, 2024 annual investment (USD bn),
    IEA NZE 2030 target, deployment gap %, cost trajectory (2020-2050),
    abatement potential (GtCO2/yr), MAC (USD/tCO2), and TRL.
    """
    return {
        "source": "IEA World Energy Investment 2024 / Net Zero by 2050 (NZE 2023)",
        "reporting_year": 2024,
        "technology_count": len(IEA_TECHNOLOGIES),
        "technologies": IEA_TECHNOLOGIES,
    }


@router.get("/ref/mac-curves")
def get_mac_curves():
    """
    Return IEA Marginal Abatement Cost (MAC) curves for 25 technologies.

    Each entry includes: abatement potential (GtCO2/yr by 2030 and 2050),
    MAC (USD/tCO2) — negative values indicate net cost-savings,
    sector, TRL, and implementation notes.
    Sorted by MAC from most negative (cheapest) to most expensive.
    """
    sorted_curves = sorted(MAC_CURVES, key=lambda x: x["mac_usd_tco2"])
    total_abatement_2030 = round(sum(t["abatement_2030_gtco2"] for t in MAC_CURVES), 2)
    total_abatement_2050 = round(sum(t["abatement_2050_gtco2"] for t in MAC_CURVES), 2)
    return {
        "source": "IEA Net Zero by 2050 — MAC Curve (2023 edition)",
        "technology_count": len(MAC_CURVES),
        "total_abatement_potential_2030_gtco2": total_abatement_2030,
        "total_abatement_potential_2050_gtco2": total_abatement_2050,
        "cost_tiers": {
            "negative_cost": [t["technology"] for t in MAC_CURVES if t["mac_usd_tco2"] < 0],
            "low_cost_0_50": [t["technology"] for t in MAC_CURVES if 0 <= t["mac_usd_tco2"] <= 50],
            "medium_cost_50_150": [t["technology"] for t in MAC_CURVES if 50 < t["mac_usd_tco2"] <= 150],
            "high_cost_150_plus": [t["technology"] for t in MAC_CURVES if t["mac_usd_tco2"] > 150],
        },
        "curves": sorted_curves,
    }


@router.get("/ref/vc-market-data")
def get_vc_market_data():
    """
    Return VC/PE climate tech deal statistics by CTVC sector and funding stage (2024).

    Includes: total capital deployed, deal count, median deal sizes, EV multiples,
    top 5 geographies, and YoY growth rates for all 11 CTVC sectors.
    """
    summary = {
        sector: {
            "total_capital_2024_usd_bn": data["total_capital_2024_usd_bn"],
            "deal_count_2024": data["deal_count_2024"],
            "yoy_growth_pct": data["yoy_growth_pct"],
            "top_geographies": data["top_geographies"],
            "stages": data["stages"],
        }
        for sector, data in VC_PE_DEAL_DATA.items()
    }
    total_capital = round(sum(d["total_capital_2024_usd_bn"] for d in VC_PE_DEAL_DATA.values()), 1)
    total_deals = sum(d["deal_count_2024"] for d in VC_PE_DEAL_DATA.values())
    return {
        "source": "CTVC State of Climate Tech 2024 / BloombergNEF Energy Transition Investment Trends 2024",
        "reporting_year": 2024,
        "total_climate_tech_investment_usd_bn": total_capital,
        "total_deal_count": total_deals,
        "sectors": summary,
        "bnef_learning_curve_count": len(BNEF_LEARNING_CURVES),
        "patent_intensity_technologies": len(PATENT_INTENSITY),
        "trl_definitions": TRL_DEFINITIONS,
        "green_taxonomy_mappings": len(GREEN_TAXONOMY_ALIGNMENT),
    }
