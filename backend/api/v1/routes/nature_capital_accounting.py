"""Nature Capital Accounting — E116 routes"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Optional
from services.nature_capital_accounting_engine import get_engine

router = APIRouter(prefix="/api/v1/nature-capital-accounting", tags=["Nature Capital Accounting"])
engine = get_engine()


# ---------------------------------------------------------------------------
# Pydantic request models
# ---------------------------------------------------------------------------

class EntityData(BaseModel):
    model_config = {"protected_namespaces": ()}
    entity_id: str
    entity_name: str
    sector: Optional[str] = "food_beverage"
    annual_revenue_usd: Optional[float] = None


class SeeaAccountsRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    entity_data: EntityData
    land_area_ha: float = Field(..., gt=0, description="Total land area in hectares")
    ecosystem_types: dict[str, float] = Field(
        ...,
        description="Ecosystem type fractions summing to ~1.0. Keys must be valid SEEA ecosystem types.",
        example={
            "forest": 0.50,
            "wetland_other": 0.20,
            "shrub_grassland": 0.20,
            "cultivated": 0.10,
        },
    )


class NcpAssessRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    entity_data: EntityData
    scope: dict[str, Any] = Field(
        default_factory=dict,
        description="NCP scope inputs: land_area_ha, spatial_boundary_km2, time_horizon_yr, decision_type",
    )
    assessment_type: str = Field("direct", description="direct | indirect | benefit_transfer")


class TevRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    ecosystem_type: str = Field(..., description="One of the 7 SEEA ecosystem types")
    land_area_ha: float = Field(..., gt=0)
    country_iso: str = Field("USA", description="ISO-3166-1 alpha-3 country code")


class TnfdLeapRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    locate_data: dict[str, Any] = Field(
        default_factory=dict,
        description="Boolean/float (0-1) flags per criterion: asset_mapping, sensitive_areas, value_chain_scope, data_quality_locate",
    )
    evaluate_data: dict[str, Any] = Field(
        default_factory=dict,
        description="Flags: dependency_assessment, impact_assessment, trend_analysis, data_quality_evaluate",
    )
    assess_data: dict[str, Any] = Field(
        default_factory=dict,
        description="Flags: physical_risk_assess, transition_risk_assess, opportunity_assess, materiality_thresh",
    )
    prepare_data: dict[str, Any] = Field(
        default_factory=dict,
        description="Flags: governance_disclosure, strategy_disclosure, risk_mgmt_disclosure, metrics_disclosure",
    )


class SbtnReadinessRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    entity_data: dict[str, Any] = Field(
        ...,
        description=(
            "Entity data with step completion flags: entity_id, entity_name, "
            "step_1_complete...step_5_complete, step_N_partial_score (0-1), "
            "freshwater_targets_set, land_baseline_established, etc."
        ),
    )
    target_types: Optional[list[str]] = Field(
        default=None,
        description="List of target biomes: freshwater | land | ocean",
    )


# ---------------------------------------------------------------------------
# POST endpoints
# ---------------------------------------------------------------------------

@router.post("/seea-accounts")
def seea_accounts(req: SeeaAccountsRequest):
    """
    Produce SEEA Ecosystem Accounts (Extent / Condition / Services / Monetary).
    Returns annual service flows (USD/yr) and capitalised ecosystem asset value.
    """
    try:
        result = engine.conduct_seea_accounting(
            entity_data=req.entity_data.model_dump(),
            land_area_ha=req.land_area_ha,
            ecosystem_types=req.ecosystem_types,
        )
        return {"status": "ok", "seea_accounts": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/ncp-assess")
def ncp_assess(req: NcpAssessRequest):
    """
    Natural Capital Protocol (NCC 2016) 4-step assessment.
    Returns revenue at risk, dependency value, social value, material issues.
    """
    try:
        result = engine.apply_natural_capital_protocol(
            entity_data=req.entity_data.model_dump(),
            scope=req.scope,
            assessment_type=req.assessment_type,
        )
        return {"status": "ok", "ncp_assessment": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/tev")
def tev(req: TevRequest):
    """
    Total Economic Value (TEV) calculation.
    Decomposes into direct use / indirect use / option / existence / bequest values.
    Returns annual flows, capitalised TEV, uncertainty range, and method mix.
    """
    try:
        result = engine.calculate_tev(
            ecosystem_type=req.ecosystem_type,
            land_area_ha=req.land_area_ha,
            country_iso=req.country_iso,
        )
        return {"status": "ok", "tev": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/tnfd-leap")
def tnfd_leap(req: TnfdLeapRequest):
    """
    TNFD LEAP scoring: Locate / Evaluate / Assess / Prepare (25 pts each = 100 total).
    Returns per-step scores, total score, disclosure readiness tier, priority areas.
    """
    try:
        result = engine.score_tnfd_leap(
            locate_data=req.locate_data,
            evaluate_data=req.evaluate_data,
            assess_data=req.assess_data,
            prepare_data=req.prepare_data,
        )
        return {"status": "ok", "tnfd_leap": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/sbtn-readiness")
def sbtn_readiness(req: SbtnReadinessRequest):
    """
    SBTN 5-step readiness: Assess / Interpret / Set / Act / Track.
    Returns step-level scores, SET alignment status, target completeness by biome.
    """
    try:
        result = engine.assess_sbtn_readiness(
            entity_data=req.entity_data,
            target_types=req.target_types,
        )
        return {"status": "ok", "sbtn_readiness": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ---------------------------------------------------------------------------
# GET reference endpoints
# ---------------------------------------------------------------------------

@router.get("/ref/seea-ecosystem-types")
def ref_seea_ecosystem_types():
    """
    7 SEEA ecosystem types with condition indicators (SEEA EA 2021),
    CICES v5.1 service catalog, and monetary valuation methods.
    """
    try:
        return {"status": "ok", "reference": engine.ref_seea_ecosystem_types()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/ref/encore-dependencies")
def ref_encore_dependencies():
    """
    ENCORE v2.0 sub-industry × ecosystem service dependency matrix
    (20 sub-industries, VH/H/M/L dependency scale).
    """
    try:
        return {"status": "ok", "reference": engine.ref_encore_dependencies()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/ref/valuation-benchmarks")
def ref_valuation_benchmarks():
    """
    50 unit value benchmarks (USD/ha/yr) from peer-reviewed literature,
    covering 7 ecosystem types × 21 ecosystem services with min/mid/max ranges.
    """
    try:
        return {"status": "ok", "reference": engine.ref_valuation_benchmarks()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/ref/tnfd-leap-framework")
def ref_tnfd_leap_framework():
    """
    TNFD LEAP step requirements (v1.0), criterion scoring rubric,
    tools per step, and IPBES NCP category mapping.
    """
    try:
        return {"status": "ok", "reference": engine.ref_tnfd_leap_framework()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
