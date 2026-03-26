"""
E107 — Sustainable Sovereign & SWF API Routes
Prefix: /api/v1/sovereign-swf
No DB calls — all computation is in-memory via sovereign_swf_engine.
"""

from __future__ import annotations

from typing import Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, model_validator

from services.sovereign_swf_engine import (
    assess_swf_esg,
    apply_gpfg_exclusion_screen,
    calculate_portfolio_temperature,
    model_divestment_pathway,
    assess_intergenerational_equity,
    SWF_PROFILES,
    SANTIAGO_PRINCIPLES,
    GPFG_EXCLUSION_CRITERIA,
    GPFG_EXCLUDED_COMPANIES_SAMPLE,
    DIVESTMENT_PATHWAYS,
)

router = APIRouter(prefix="/api/v1/sovereign-swf", tags=["sovereign-swf"])


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------

class ExclusionDataModel(BaseModel):
    model_config = {"protected_namespaces": ()}

    has_exclusion_policy: bool = Field(default=False, description="Does the fund have a formal exclusion policy?")
    coal_excluded: bool = Field(default=False, description="Is coal (>30% revenue threshold) excluded?")
    tobacco_excluded: bool = Field(default=False, description="Is tobacco production excluded?")
    weapons_excluded: bool = Field(default=False, description="Are cluster munitions / nuclear weapons excluded?")
    exclusion_list_public: bool = Field(default=False, description="Is the exclusion list publicly disclosed?")


class ClimateDataModel(BaseModel):
    model_config = {"protected_namespaces": ()}

    has_net_zero_target: bool = Field(default=False, description="Does the fund have a net-zero commitment?")
    target_year: Optional[int] = Field(default=None, description="Net-zero target year (e.g. 2050)")
    portfolio_temp_c: float = Field(default=3.0, ge=1.0, le=6.0, description="Portfolio implied temperature (°C)")
    green_bond_alloc_pct: float = Field(default=0.0, ge=0.0, le=100.0, description="Green bond allocation % of AUM")
    tcfd_reporting: bool = Field(default=False, description="Does the fund publish TCFD-aligned reports?")
    pacta_assessed: bool = Field(default=False, description="Has the fund undergone PACTA assessment?")


class GovernanceDataModel(BaseModel):
    model_config = {"protected_namespaces": ()}

    has_esg_policy: bool = Field(default=False, description="Does the fund have a formal ESG policy?")
    active_ownership: bool = Field(default=False, description="Does the fund exercise active ownership / stewardship?")
    reporting_standard: str = Field(default="none", description="Reporting standard (e.g. TCFD, PRI, GRI, none)")
    independent_audit: bool = Field(default=False, description="Is ESG data independently audited?")
    annual_report: bool = Field(default=False, description="Does the fund publish an annual report?")


class SWFAssessRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    fund_name: str = Field(
        ...,
        description="Fund name or short code (e.g. GPFG, ADIA, CPPIB)",
        examples=["GPFG"],
    )
    aum_usd_bn: float = Field(
        ..., gt=0,
        description="Fund AUM in USD billions",
        examples=[1700.0],
    )
    exclusion_data: ExclusionDataModel = Field(default_factory=ExclusionDataModel)
    climate_data: ClimateDataModel = Field(default_factory=ClimateDataModel)
    governance_data: GovernanceDataModel = Field(default_factory=GovernanceDataModel)


class HoldingItem(BaseModel):
    model_config = {"protected_namespaces": ()}

    company: str = Field(..., description="Company name")
    country: str = Field(default="", min_length=0, max_length=2, description="ISO-2 country code")
    market_value_usd_m: float = Field(default=0.0, ge=0, description="Market value USD millions")
    revenue_coal_pct: float = Field(default=0.0, ge=0.0, le=100.0, description="Revenue from coal (%)")
    revenue_tobacco_pct: float = Field(default=0.0, ge=0.0, le=100.0, description="Revenue from tobacco (%)")
    produces_weapons: bool = Field(default=False)
    produces_cluster_munitions: bool = Field(default=False)
    produces_nuclear_weapons: bool = Field(default=False)
    produces_anti_personnel_mines: bool = Field(default=False)
    environmental_controversy: Optional[str] = Field(
        default=None,
        description="Controversy level: none, moderate, severe",
    )
    human_rights_violation: Optional[str] = Field(
        default=None,
        description="Violation level: none, alleged, systematic",
    )
    corruption_allegation: bool = Field(default=False)


class ExclusionScreenRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    holdings: list[HoldingItem] = Field(
        ...,
        min_length=1,
        description="List of portfolio holdings to screen",
    )

    @model_validator(mode="after")
    def validate_holdings(self) -> "ExclusionScreenRequest":
        if len(self.holdings) > 500:
            raise ValueError("Maximum 500 holdings per request.")
        return self


class EquityHolding(BaseModel):
    model_config = {"protected_namespaces": ()}

    company: str
    sector: str = Field(default="unknown", description="NACE / GICS sector (e.g. oil_gas, utilities_renewables)")
    weight_pct: float = Field(..., gt=0, le=100, description="Portfolio weight (%)")
    company_temp_c: Optional[float] = Field(
        default=None, ge=1.0, le=5.0,
        description="Company implied temperature (°C); auto-estimated from sector if omitted",
    )


class SovereignBondAllocation(BaseModel):
    model_config = {"protected_namespaces": ()}

    country: str = Field(..., min_length=2, max_length=2, description="ISO-2 country code")
    weight_pct: float = Field(..., gt=0, le=100, description="Portfolio weight (%)")
    country_temp_c: float = Field(
        default=2.5, ge=1.0, le=5.0,
        description="Country implied temperature (°C) from NDC/PACTA",
    )


class PortfolioTemperatureRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    holdings: list[EquityHolding] = Field(
        default_factory=list,
        description="Equity / credit holdings list",
    )
    sovereign_bond_allocations: list[SovereignBondAllocation] = Field(
        default_factory=list,
        description="Sovereign bond holdings",
    )

    @model_validator(mode="after")
    def validate_at_least_one(self) -> "PortfolioTemperatureRequest":
        if not self.holdings and not self.sovereign_bond_allocations:
            raise ValueError("At least one of holdings or sovereign_bond_allocations must be provided.")
        return self


class DivestmentPathwayRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    fund_name: str = Field(..., examples=["GPFG"])
    aum_usd_bn: float = Field(..., gt=0, examples=[1700.0])
    fossil_fuel_exposure_pct: float = Field(
        ..., ge=0.0, le=100.0,
        description="Current fossil fuel exposure as % of AUM",
        examples=[4.2],
    )
    pathway_type: str = Field(
        ...,
        description="Divestment pathway: immediate, phase_out_2030, phase_out_2050, engagement_first",
        examples=["phase_out_2030"],
    )

    @model_validator(mode="after")
    def validate_pathway(self) -> "DivestmentPathwayRequest":
        valid = {"immediate", "phase_out_2030", "phase_out_2050", "engagement_first"}
        if self.pathway_type not in valid:
            raise ValueError(f"pathway_type must be one of {valid}")
        return self


class IntergenerationalEquityRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    fund_name: str = Field(..., examples=["GPFG"])
    aum_usd_bn: float = Field(..., gt=0, examples=[1700.0])
    annual_withdrawal_pct: float = Field(
        ..., ge=0.0, le=20.0,
        description="Annual withdrawal as % of fund AUM (GPFG 4%-rule benchmark)",
        examples=[4.0],
    )
    resource_revenue_dependency: float = Field(
        ..., ge=0.0, le=100.0,
        description="% of government revenue from resource extraction",
        examples=[15.0],
    )


# ---------------------------------------------------------------------------
# POST Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/assess",
    summary="Full SWF ESG assessment (IWG-SWF 24 GAPP principles)",
    response_model=dict,
)
def assess_swf_endpoint(request: SWFAssessRequest) -> dict[str, Any]:
    """
    Perform a comprehensive IWG-SWF ESG assessment scoring all 24 GAPP Santiago
    Principles (2008 + 2023 ESG update) across 3 pillars:
    - Legal Framework (GAPP 1-8)
    - Institutional Governance (GAPP 9-15)
    - Investment Policies (GAPP 16-24)

    Returns overall IWG score (0-24), tier (leader / advanced / developing / laggard),
    sub-scores (ESG policy / exclusion / climate integration), per-principle scores,
    and key gaps.

    If the fund_name matches a known SWF profile (e.g. GPFG, ADIA, CPPIB),
    reference data is merged automatically.
    """
    try:
        result = assess_swf_esg(
            fund_name=request.fund_name,
            aum_usd_bn=request.aum_usd_bn,
            exclusion_data=request.exclusion_data.model_dump(),
            climate_data=request.climate_data.model_dump(),
            governance_data=request.governance_data.model_dump(),
        )
        return {"status": "success", "data": result}
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Assessment error: {exc}") from exc


@router.post(
    "/exclusion-screen",
    summary="GPFG-model exclusion screening for a holdings list",
    response_model=dict,
)
def exclusion_screen_endpoint(request: ExclusionScreenRequest) -> dict[str, Any]:
    """
    Apply the Norwegian GPFG exclusion model (Council on Ethics guidelines 2024)
    to a portfolio holdings list.

    Screens for:
    - Coal revenue >30% (product-based)
    - Tobacco production (product-based)
    - Cluster munitions / nuclear weapons / anti-personnel mines (product-based)
    - Severe environmental damage (conduct-based)
    - Systematic human rights violations (conduct-based)
    - Gross corruption (conduct-based — observation list)

    Returns excluded, observation, and cleared lists with exclusion criteria codes.
    Max 500 holdings per request.
    """
    try:
        holdings_dicts = [h.model_dump() for h in request.holdings]
        result = apply_gpfg_exclusion_screen(holdings_dicts)
        return {"status": "success", "data": result}
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Screening error: {exc}") from exc


@router.post(
    "/portfolio-temperature",
    summary="Portfolio implied temperature alignment (PACTA proxy)",
    response_model=dict,
)
def portfolio_temperature_endpoint(request: PortfolioTemperatureRequest) -> dict[str, Any]:
    """
    Calculate portfolio implied temperature rise using MSCI PACTA proxy methodology
    (weighted average temperature score across equity and sovereign bond holdings).

    Sector benchmarks derived from PACTA 2024 / MSCI reference data:
    oil_gas (3.8°C), coal (4.5°C), utilities_renewables (1.6°C), etc.

    Returns: portfolio_implied_temp_c, Paris alignment classification,
    sector breakdown vs benchmark, and sovereign bond contribution.
    """
    try:
        holdings_dicts = [h.model_dump() for h in request.holdings]
        sovereign_dicts = [sb.model_dump() for sb in request.sovereign_bond_allocations]
        result = calculate_portfolio_temperature(holdings_dicts, sovereign_dicts)
        return {"status": "success", "data": result}
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Temperature calculation error: {exc}") from exc


@router.post(
    "/divestment-pathway",
    summary="Fossil fuel divestment pathway modelling (NPV + reallocation)",
    response_model=dict,
)
def divestment_pathway_endpoint(request: DivestmentPathwayRequest) -> dict[str, Any]:
    """
    Model a fossil fuel divestment pathway for a sovereign wealth fund, including:

    - Annual divestment schedule (year-by-year USD bn and %)
    - NPV transaction loss (price discount during liquidation)
    - Avoided stranded asset losses (2°C scenario proxy)
    - Net NPV impact (avoided loss - transaction loss)
    - Green bond market absorption capacity
    - Reallocation opportunities

    Pathways: immediate (12m), phase_out_2030 (6yr), phase_out_2050 (25yr),
    engagement_first (3yr engagement → escalate).
    """
    try:
        result = model_divestment_pathway(
            fund_name=request.fund_name,
            aum_usd_bn=request.aum_usd_bn,
            fossil_fuel_exposure_pct=request.fossil_fuel_exposure_pct,
            pathway_type=request.pathway_type,
        )
        return {"status": "success", "data": result}
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Pathway modelling error: {exc}") from exc


@router.post(
    "/intergenerational-equity",
    summary="Hartwick Rule / intergenerational equity sustainability assessment",
    response_model=dict,
)
def intergenerational_equity_endpoint(request: IntergenerationalEquityRequest) -> dict[str, Any]:
    """
    Assess intergenerational equity sustainability of a sovereign wealth fund using:

    - **Hartwick Rule (1977)**: sustainable if annual withdrawal ≤ long-run real return
      (GPFG benchmark: 4% rule)
    - **Hotelling optimal depletion rate**: r = ρ + θ×g (discount + elasticity × growth)
    - **Fiscal sustainability score** (0-100): penalises excess withdrawal and resource dependency
    - **SDG 17 blended finance contribution**: potential mobilisation at 4:1 leverage ratio

    Intergenerational fairness ratings: excellent / good / fair / poor.
    """
    try:
        result = assess_intergenerational_equity(
            fund_name=request.fund_name,
            aum_usd_bn=request.aum_usd_bn,
            annual_withdrawal_pct=request.annual_withdrawal_pct,
            resource_revenue_dependency=request.resource_revenue_dependency,
        )
        return {"status": "success", "data": result}
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Equity assessment error: {exc}") from exc


# ---------------------------------------------------------------------------
# GET Reference Endpoints
# ---------------------------------------------------------------------------

@router.get(
    "/ref/swf-profiles",
    summary="25 major SWF profiles with ESG and climate data",
    response_model=dict,
)
def get_swf_profiles() -> dict[str, Any]:
    """
    Return reference profiles for 25 major sovereign wealth funds including:
    GPFG, ADIA, KIA, PIF, GIC, Temasek, CPPIB, CIC, QIA, Alaska PF,
    SAFE, Mubadala, AFF, NZSF, Khazanah, ISIF, BpiFrance, TexasPSF,
    CalPERS, CalSTRS, AP1, NBIM, BCI, IPIC, NSIA.

    Per fund: AUM, established year, ESG policy, exclusion policy,
    climate commitment tier, Santiago principles score, fossil fuel exposure %,
    portfolio temperature °C, divestment commitment, net-zero target year,
    green bond allocation, active ownership, reporting standard,
    strategic asset allocation.
    """
    return {
        "status": "success",
        "count": len(SWF_PROFILES),
        "profiles": SWF_PROFILES,
        "climate_commitment_tiers": {
            "leading": "Net-zero target + <2°C portfolio + active exclusions + TCFD + stewardship",
            "committed": "Net-zero target + TCFD + some exclusions",
            "partial": "TCFD reporting only or partial exclusions",
            "none": "No formal ESG or climate policy",
        },
    }


@router.get(
    "/ref/santiago-principles",
    summary="24 IWG-SWF GAPP Santiago Principles (2008 + 2023 ESG update)",
    response_model=dict,
)
def get_santiago_principles() -> dict[str, Any]:
    """
    Return all 24 Generally Accepted Principles and Practices (GAPP) of the
    International Working Group of Sovereign Wealth Funds (IWG-SWF) Santiago
    Principles framework (2008, updated with ESG guidance 2023).

    Principles are organised across 3 pillars:
    - Legal Framework (GAPP 1-8)
    - Institutional Framework & Governance (GAPP 9-15)
    - Investment Policies (GAPP 16-24)

    Each principle includes: title, description, ESG relevance, 2023 update flag,
    and compliance criteria used in scoring.
    """
    return {
        "status": "success",
        "count": len(SANTIAGO_PRINCIPLES),
        "pillars": {
            "legal_framework": {"gapp_range": "GAPP-01 to GAPP-08", "count": 8},
            "institutional_governance": {"gapp_range": "GAPP-09 to GAPP-15", "count": 7},
            "investment_policies": {"gapp_range": "GAPP-16 to GAPP-24", "count": 9},
        },
        "principles": SANTIAGO_PRINCIPLES,
        "scoring_methodology": (
            "Each GAPP principle scored 0-1 against fund characteristics; "
            "total score 0-24; tier: leader (≥85%), advanced (≥65%), "
            "developing (≥40%), laggard (<40%)."
        ),
    }


@router.get(
    "/ref/gpfg-exclusion-criteria",
    summary="GPFG Council on Ethics exclusion criteria + top excluded companies",
    response_model=dict,
)
def get_gpfg_exclusion_criteria() -> dict[str, Any]:
    """
    Return the Norwegian Government Pension Fund Global (GPFG) exclusion framework
    as administered by the Council on Ethics and NBIM.

    Covers:
    - 10 exclusion criteria (coal, oil sands, tobacco, cluster munitions,
      nuclear weapons, anti-personnel mines, human rights, environmental damage,
      corruption, biological/chemical weapons)
    - Each criterion includes threshold, legal basis, effective date, and review body
    - Top 20 illustrative excluded companies (based on public NBIM 2024 list)

    Product-based exclusions are applied by NBIM directly; conduct-based
    exclusions require Council on Ethics recommendation → Ministry of Finance approval.
    """
    return {
        "status": "success",
        "exclusion_criteria": GPFG_EXCLUSION_CRITERIA,
        "sample_excluded_companies": {
            "count": len(GPFG_EXCLUDED_COMPANIES_SAMPLE),
            "note": "Illustrative sample; full list at nbim.no",
            "companies": GPFG_EXCLUDED_COMPANIES_SAMPLE,
        },
        "process": {
            "product_based": "NBIM screens independently; no recommendation needed",
            "conduct_based": "Council on Ethics issues recommendation → Ministry of Finance decides",
            "observation_list": "Companies under investigation; not yet excluded",
            "review_frequency": "Ongoing; formal annual review published",
        },
    }


@router.get(
    "/ref/divestment-pathways",
    summary="4 fossil fuel divestment pathway definitions",
    response_model=dict,
)
def get_divestment_pathways() -> dict[str, Any]:
    """
    Return the 4 fossil fuel divestment pathway definitions used by the engine:

    1. **immediate** — full liquidation within 12 months; high market impact;
       5% price discount; immediate NPV loss vs stranded-asset avoidance
    2. **phase_out_2030** — 6-year phased divestment (SBTi 2030 aligned);
       medium market impact; 2% price discount
    3. **phase_out_2050** — 25-year managed transition (Paris Agreement);
       low market impact; 0.5% price discount; lowest fiduciary risk
    4. **engagement_first** — no immediate divestment; CA100+ engagement;
       escalation trigger if company fails net-zero benchmark by 2028

    Each pathway includes: annual divestment schedule (%), market impact,
    price discount, reallocation priority list, legal constraint assessment,
    and NPV impact methodology.
    """
    return {
        "status": "success",
        "count": len(DIVESTMENT_PATHWAYS),
        "pathways": DIVESTMENT_PATHWAYS,
        "npv_methodology_note": (
            "NPV impact = avoided stranded asset losses (20% of fossil exposure under 2°C) "
            "minus transaction costs (price discount × divested value, discounted at 5%). "
            "Positive NPV indicates divestment is value-accretive on a risk-adjusted basis."
        ),
    }
