"""Regulatory Horizon Scanning — E117 routes"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Optional
from services.regulatory_horizon_engine import get_engine

router = APIRouter(prefix="/api/v1/regulatory-horizon", tags=["Regulatory Horizon Scanning"])
engine = get_engine()


# ---------------------------------------------------------------------------
# Pydantic request models
# ---------------------------------------------------------------------------

class HorizonScanRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    entity_type: str = Field(
        ...,
        description="One of: bank | insurer | asset_manager | corporate | pension | all",
    )
    jurisdiction: str = Field(
        ...,
        description="Primary jurisdiction e.g. EU, UK, Australia, USA, Singapore, Global",
    )
    sectors: list[str] = Field(
        default_factory=list,
        description="Sector codes the entity operates in (NACE / GICS / free text)",
    )
    time_horizon_years: int = Field(
        5,
        ge=1,
        le=10,
        description="Years ahead to scan (1-10, default 5)",
    )


class ReadinessRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    entity_type: str = Field(..., description="bank | insurer | asset_manager | corporate | pension")
    current_capabilities: dict[str, bool] = Field(
        default_factory=dict,
        description=(
            "Map of capability_name → True/False. "
            "E.g. {\"pai_calculation\": true, \"xbrl_tagging\": false}. "
            "Unknown capabilities default to False (gap)."
        ),
    )
    target_regulation: str = Field(
        ...,
        description="regulation_id to assess readiness for (e.g. EU_CSRD_ESRS, EU_SFDR_L3)",
    )


class BurdenRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    entity_type: str = Field(..., description="bank | insurer | asset_manager | corporate | pension")
    aum_usd_bn: float = Field(..., gt=0, description="Assets under management or balance sheet total in USD billions")
    jurisdiction: str = Field(..., description="Primary jurisdiction for applicability filter")


class SynergiesRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    regulation_list: list[str] = Field(
        ...,
        min_length=2,
        description="List of regulation_ids to analyse for synergies (minimum 2)",
        example=["EU_CSRD_ESRS", "EU_SFDR_L3", "EU_TAXONOMY_DA", "EU_EBA_PILLAR3_ESG"],
    )


# ---------------------------------------------------------------------------
# POST endpoints
# ---------------------------------------------------------------------------

@router.post("/scan")
def scan(req: HorizonScanRequest):
    """
    Horizon scan for an entity: returns applicable regulations sorted by deadline + impact,
    compliance cost estimate, change velocity score, and top-5 priorities.
    """
    try:
        result = engine.scan_horizon(
            entity_type=req.entity_type,
            jurisdiction=req.jurisdiction,
            sectors=req.sectors,
            time_horizon_years=req.time_horizon_years,
        )
        return {"status": "ok", "horizon_scan": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/readiness")
def readiness(req: ReadinessRequest):
    """
    Implementation readiness for a specific regulation.
    Returns gap analysis per requirement, effort estimate (months + FTE), timeline,
    dependency chain, and readiness tier.
    """
    try:
        result = engine.assess_implementation_readiness(
            entity_type=req.entity_type,
            current_capabilities=req.current_capabilities,
            target_regulation=req.target_regulation,
        )
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return {"status": "ok", "readiness": result}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/regulatory-burden")
def regulatory_burden(req: BurdenRequest):
    """
    Compliance cost estimation across all applicable regulations for the entity.
    Returns total one-time cost, annual ongoing cost, FTE requirements,
    technology investment, external advisor cost, and breakdown by topic.
    """
    try:
        result = engine.calculate_regulatory_burden(
            entity_type=req.entity_type,
            aum_usd_bn=req.aum_usd_bn,
            jurisdiction=req.jurisdiction,
        )
        return {"status": "ok", "regulatory_burden": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/synergies")
def synergies(req: SynergiesRequest):
    """
    Cross-regulation synergy analysis for a specified set of regulation_ids.
    Returns shared data requirements, process overlaps, combined implementation savings,
    and sequencing recommendations.
    """
    try:
        result = engine.identify_synergies(regulation_list=req.regulation_list)
        return {"status": "ok", "synergies": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ---------------------------------------------------------------------------
# GET reference endpoints
# ---------------------------------------------------------------------------

@router.get("/ref/regulation-pipeline")
def ref_regulation_pipeline():
    """
    Full 60-regulation pipeline with status, deadlines, topics, entity types,
    impact scores and compliance cost categories.
    """
    try:
        return {"status": "ok", "reference": engine.ref_regulation_pipeline()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/ref/entity-applicability")
def ref_entity_applicability():
    """
    Entity type × regulation applicability matrix (6 entity types × 60 regulations).
    """
    try:
        return {"status": "ok", "reference": engine.ref_entity_applicability()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/ref/cost-benchmarks")
def ref_cost_benchmarks():
    """
    Compliance cost benchmarks by regulation cost category and entity size
    (small <$1B, medium $1-50B, large >$50B AUM).
    """
    try:
        return {"status": "ok", "reference": engine.ref_cost_benchmarks()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/ref/interconnection-map")
def ref_interconnection_map():
    """
    Regulatory data dependency map: which regulations require output/data from other regulations.
    Also includes per-regulation capability requirement lists.
    """
    try:
        return {"status": "ok", "reference": engine.ref_interconnection_map()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
