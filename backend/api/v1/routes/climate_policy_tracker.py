"""
API Routes — Climate Policy Tracking Engine
=============================================
POST /api/v1/climate-policy/assess-jurisdiction   — Full jurisdiction policy assessment
POST /api/v1/climate-policy/score-ndc             — NDC ambition scoring
POST /api/v1/climate-policy/portfolio-impact      — Portfolio-level policy transition risk
POST /api/v1/climate-policy/carbon-price-gap      — Carbon price gap vs IEA NZE corridor
POST /api/v1/climate-policy/policy-pipeline       — Regulation pipeline for jurisdiction + sector
GET  /api/v1/climate-policy/ref/jurisdictions     — 40 jurisdiction profiles
GET  /api/v1/climate-policy/ref/fit-for-55        — EU Fit for 55 package (13 regulations)
GET  /api/v1/climate-policy/ref/ira-credits       — US IRA tax credits (26 items)
GET  /api/v1/climate-policy/ref/repowereu         — REPowerEU 10 measures
GET  /api/v1/climate-policy/ref/carbon-price-corridor — IEA NZE price corridor by region/year
GET  /api/v1/climate-policy/ref/ngfs-policy-scenarios — NGFS carbon price trajectories
GET  /api/v1/climate-policy/ref/g20-carbon-pricing    — G20 carbon pricing tracker
GET  /api/v1/climate-policy/ref/sector-policy-map     — Sector to policy applicability mapping
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from services.climate_policy_tracker_engine import (
    ClimatePolicyTrackerEngine,
    JURISDICTION_PROFILES,
    FIT_FOR_55_PACKAGE,
    IRA_CREDITS,
    REPOWEREU_MEASURES,
    IEA_NZE_CARBON_PRICE,
    NGFS_POLICY_SCENARIOS,
    G20_CARBON_PRICING,
    SECTOR_POLICY_MAP,
    ADVANCED_ECONOMY_JURISDICTIONS,
)

router = APIRouter(prefix="/api/v1/climate-policy", tags=["Climate Policy Tracker"])


# ---------------------------------------------------------------------------
# Pydantic Request Models
# ---------------------------------------------------------------------------

class JurisdictionRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    jurisdiction: str = Field(
        ...,
        description="ISO2 country/jurisdiction code (e.g. EU, USA, GBR, CHN)",
        min_length=2,
        max_length=3,
    )


class NDCScoringRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    jurisdiction: str = Field(..., min_length=2, max_length=3)
    target_pct: Optional[float] = Field(
        None,
        ge=0,
        le=100,
        description="Override NDC reduction target %. If not provided, uses profile data.",
    )
    base_year: Optional[int] = Field(
        None,
        ge=1990,
        le=2025,
        description="Override base year. If not provided, uses profile data.",
    )
    conditional: bool = Field(
        False,
        description="Whether the NDC target is conditional on international support",
    )


class CarbonPriceGapRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    jurisdiction: str = Field(..., min_length=2, max_length=3)
    current_price_usd: Optional[float] = Field(
        None,
        ge=0,
        description="Override current carbon price in USD/tCO2e. If not provided, uses profile data.",
    )


class PolicyPipelineRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    jurisdiction: str = Field(..., min_length=2, max_length=3)
    entity_sector: str = Field(
        ...,
        description=(
            "Entity sector for applicable regulation mapping. Options: "
            "energy, transport, buildings, industry, agriculture, finance, "
            "real_estate, shipping, aviation, waste"
        ),
    )


class PortfolioImpactRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    portfolio_countries: list[str] = Field(
        ...,
        min_length=1,
        description="List of ISO2 country codes representing portfolio geographic exposure",
    )
    portfolio_sectors: list[str] = Field(
        ...,
        min_length=1,
        description="List of sectors present in the portfolio",
    )
    weights: Optional[list[float]] = Field(
        None,
        description=(
            "Exposure weights corresponding to portfolio_countries. "
            "Must have the same length as portfolio_countries and sum to ~1.0. "
            "If not provided, equal weights are applied."
        ),
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/assess-jurisdiction")
def assess_jurisdiction(req: JurisdictionRequest):
    """
    Full jurisdiction policy assessment.
    Returns NDC ambition, carbon price gap vs IEA NZE, policy stringency,
    transition risk score, regulatory pipeline, and upcoming compliance deadlines.
    """
    engine = ClimatePolicyTrackerEngine()
    return engine.assess_jurisdiction_policy(req.jurisdiction)


@router.post("/score-ndc")
def score_ndc(req: NDCScoringRequest):
    """
    Score NDC ambition (0-100) and assess Paris 1.5°C / 2°C consistency.
    Returns ambition tier, gap vs benchmark, and conditional flag.
    """
    engine = ClimatePolicyTrackerEngine()
    return engine.score_ndc_ambition(
        jurisdiction=req.jurisdiction,
        target_pct=req.target_pct,
        base_year=req.base_year,
        conditional=req.conditional,
    )


@router.post("/carbon-price-gap")
def carbon_price_gap(req: CarbonPriceGapRequest):
    """
    Calculate carbon price gap vs IEA NZE corridor (2022-2050).
    Returns per-year trajectory, gap amounts, and economic risk estimate.
    """
    engine = ClimatePolicyTrackerEngine()
    return engine.calculate_carbon_price_gap(
        jurisdiction=req.jurisdiction,
        current_price=req.current_price_usd,
    )


@router.post("/policy-pipeline")
def policy_pipeline(req: PolicyPipelineRequest):
    """
    Track applicable regulations and compliance deadlines for a jurisdiction + sector.
    Returns regulation list, nearest deadline year, and compliance impact score.
    """
    engine = ClimatePolicyTrackerEngine()
    return engine.track_policy_pipeline(
        jurisdiction=req.jurisdiction,
        entity_sector=req.entity_sector,
    )


@router.post("/portfolio-impact")
def portfolio_impact(req: PortfolioImpactRequest):
    """
    Portfolio-level climate policy transition risk assessment.
    Returns jurisdiction-weighted transition risk, policy stringency score,
    stranded asset exposure countries, and risk tier.
    """
    engine = ClimatePolicyTrackerEngine()
    return engine.assess_policy_portfolio_impact(
        portfolio_countries=req.portfolio_countries,
        portfolio_sectors=req.portfolio_sectors,
        weights=req.weights,
    )


# ---------------------------------------------------------------------------
# Reference Data Endpoints
# ---------------------------------------------------------------------------

@router.get("/ref/jurisdictions")
def get_jurisdictions():
    """
    40 jurisdiction profiles: NDC targets, carbon prices, net-zero laws,
    policy stringency, transition risk scores, and policy reversal risk.
    """
    return {
        "total_jurisdictions": len(JURISDICTION_PROFILES),
        "advanced_economies": sorted(ADVANCED_ECONOMY_JURISDICTIONS),
        "jurisdictions": {
            iso: {
                "name": p["name"],
                "region": p["region"],
                "ndc_target_pct": p["ndc_target_pct"],
                "ndc_base_year": p["ndc_base_year"],
                "ndc_target_year": p["ndc_target_year"],
                "ndc_status": p["ndc_status"],
                "carbon_price_usd": p["carbon_price_usd"],
                "carbon_price_coverage_pct": p["carbon_price_coverage_pct"],
                "ets_coverage_pct": p["ets_coverage_pct"],
                "climate_law": p["climate_law"],
                "net_zero_target_year": p.get("net_zero_target_year"),
                "policy_stringency": p["policy_stringency"],
                "transition_risk_score": p["transition_risk_score"],
                "policy_reversal_risk": p["policy_reversal_risk"],
                "key_policies": p["key_policies"],
            }
            for iso, p in JURISDICTION_PROFILES.items()
        },
    }


@router.get("/ref/fit-for-55")
def get_fit_for_55():
    """
    EU Fit for 55 package — 13 regulations.
    Includes adopted dates, scope, effective years, and emission reduction contributions.
    """
    return {
        "package": "EU Fit for 55",
        "overarching_target": "55% net GHG reduction vs 1990 by 2030 (EU Climate Law Reg 2021/1119)",
        "regulation_count": len(FIT_FOR_55_PACKAGE),
        "regulations": FIT_FOR_55_PACKAGE,
        "total_reduction_potential_mtco2": sum(
            r["emissions_reduction_contribution_mtco2"] for r in FIT_FOR_55_PACKAGE
        ),
        "notes": [
            "Regulations adopted 2023; most effective 2024-2027",
            "ETS + ETS2 provide price signal across 65% of EU emissions by 2027",
            "CBAM phased in 2026-2034; full effect by 2034",
            "RED III sets 42.5% binding renewable target for EU by 2030",
        ],
    }


@router.get("/ref/ira-credits")
def get_ira_credits():
    """
    US Inflation Reduction Act (IRA, signed Aug 2022) — 26 tax credits and incentives.
    Covers energy, transport, buildings, industry, agriculture, and manufacturing.
    """
    sector_summary: dict[str, int] = {}
    for credit in IRA_CREDITS:
        sec = credit["sector"]
        sector_summary[sec] = sector_summary.get(sec, 0) + 1

    return {
        "legislation": "Inflation Reduction Act of 2022 (Pub.L. 117-169)",
        "signed": "2022-08-16",
        "estimated_climate_investment_10yr_usd_bn": 369,
        "credit_count": len(IRA_CREDITS),
        "sector_breakdown": sector_summary,
        "credits": IRA_CREDITS,
        "notes": [
            "IRA contains largest US climate investment in history",
            "Domestic content bonus: +10% credit for qualifying US manufacturing",
            "Energy community bonus: +10% for projects in fossil fuel communities",
            "Prevailing wage + apprenticeship required for full credit rates post-2022",
            "Treasury/IRS guidance ongoing; some provisions subject to rulemaking",
        ],
    }


@router.get("/ref/repowereu")
def get_repowereu():
    """
    REPowerEU Plan (May 2022) — 10 key measures to reduce EU dependence on Russian fossil fuels.
    """
    return {
        "plan": "REPowerEU",
        "published": "2022-05-18",
        "target": "End dependence on Russian fossil fuels before 2030",
        "total_investment_eur_bn": 300,
        "measure_count": len(REPOWEREU_MEASURES),
        "measures": REPOWEREU_MEASURES,
        "eu_hydrogen_target_mt_2030": 10,
        "renewable_target_gw_2030": 1236,
        "notes": [
            "REPowerEU integrated into EU cohesion/structural funds and NextGenerationEU",
            "Solar Rooftop mandate is binding obligation under revised EED/EPB directives",
            "EU Hydrogen Bank operational from 2023; auctions ongoing",
            "Gas demand reduction regulation (EU) 2022/1369 — voluntary 15% target, mandatory trigger",
        ],
    }


@router.get("/ref/carbon-price-corridor")
def get_carbon_price_corridor():
    """
    IEA Net Zero Emissions (NZE) scenario carbon price corridor.
    Two tracks: Advanced Economies and Emerging/Developing Economies.
    Annual values 2022-2050.
    """
    return {
        "source": "IEA World Energy Outlook 2023 — Net Zero Emissions by 2050 scenario",
        "currency": "USD / tCO2e (2023 real terms)",
        "tracks": {
            "advanced_economies": {
                "jurisdictions_note": "EU, USA, GBR, JPN, CAN, AUS, KOR, NOR, CHE, NZL, SWE, DNK, DEU, FRA, ITA, ESP, POL",
                "prices_by_year": IEA_NZE_CARBON_PRICE["advanced_economies"],
            },
            "emerging_developing_economies": {
                "jurisdictions_note": "CHN, IND, BRA, ZAF, IDN, MEX, and other non-AE jurisdictions",
                "prices_by_year": IEA_NZE_CARBON_PRICE["emerging_developing_economies"],
            },
        },
        "notes": [
            "IEA NZE corridor represents minimum carbon prices needed for 1.5°C consistency",
            "Current global average carbon price ~$10-20/tCO2e (World Bank 2024) — well below corridor",
            "Prices assume full implementation; jurisdictional mix and coverage gaps reduce actual impact",
        ],
    }


@router.get("/ref/ngfs-policy-scenarios")
def get_ngfs_policy_scenarios():
    """
    NGFS (Network for Greening the Financial System) policy scenarios:
    orderly / disorderly / hot-house / below 2°C.
    Includes carbon price trajectories by economy type and risk profiles.
    """
    return {
        "source": "NGFS Climate Scenarios Phase IV (2023)",
        "scenario_count": len(NGFS_POLICY_SCENARIOS),
        "scenarios": NGFS_POLICY_SCENARIOS,
        "scenario_matrix": {
            "orderly":    {"physical_risk": "low",       "transition_risk": "high",      "warming_C": "1.5"},
            "below_2c":   {"physical_risk": "medium_low","transition_risk": "medium_high","warming_C": "≤2.0"},
            "disorderly": {"physical_risk": "medium",    "transition_risk": "very_high", "warming_C": "1.5-1.8"},
            "hot_house":  {"physical_risk": "very_high", "transition_risk": "low",       "warming_C": "3+"},
        },
        "notes": [
            "NGFS scenarios are used by >130 central banks for climate stress testing",
            "Orderly: early, smooth policy action; Disorderly: late disruptive tightening",
            "Hot House World: current policies only — insufficient to meet Paris targets",
            "Carbon prices are indicative; actual policy instruments vary by jurisdiction",
        ],
    }


@router.get("/ref/g20-carbon-pricing")
def get_g20_carbon_pricing():
    """
    G20 carbon pricing tracker: ETS coverage, headline carbon price,
    and aviation sector coverage.
    """
    return {
        "source": "World Bank Carbon Pricing Dashboard 2024 + ICAP Status Report 2024",
        "g20_coverage_count": len(G20_CARBON_PRICING),
        "global_coverage_note": "~23% of global GHG emissions covered by carbon pricing (2024)",
        "jurisdictions": G20_CARBON_PRICING,
        "notes": [
            "Carbon price reported as headline ETS/carbon tax price (USD/tCO2e, 2024)",
            "Aviation coverage: whether ETS/carbon price applies to aviation sector",
            "USA coverage is RGGI + California cap-and-trade (no federal carbon price)",
            "EU ETS price highly volatile (range $40-100); reported as approximate 2024 avg",
        ],
    }


@router.get("/ref/sector-policy-map")
def get_sector_policy_map():
    """
    Sector-to-policy applicability mapping.
    Shows which climate policies apply to each economic sector.
    """
    return {
        "sectors": list(SECTOR_POLICY_MAP.keys()),
        "sector_policy_map": SECTOR_POLICY_MAP,
        "notes": [
            "Policy IDs correspond to key_policies fields in jurisdiction profiles",
            "Overlap between sector and jurisdiction key_policies determines applicable regulations",
            "Finance sector subject to disclosure (not emissions) regulations primarily",
        ],
    }
