"""
API Routes: IFRS S2 Climate-Related Disclosures Engine
========================================================
POST /api/v1/issb-s2/assess                 — Full IFRS S2 assessment
POST /api/v1/issb-s2/scenario-analysis      — 3-scenario resilience analysis
POST /api/v1/issb-s2/risk-identification    — Physical + transition risk identification
GET  /api/v1/issb-s2/ref/pillars            — IFRS S2 four-pillar reference data
GET  /api/v1/issb-s2/ref/scenarios          — Climate scenario definitions
GET  /api/v1/issb-s2/ref/physical-risks     — Physical risk taxonomy
GET  /api/v1/issb-s2/ref/transition-risks   — Transition risk taxonomy
GET  /api/v1/issb-s2/ref/sasb-sectors       — SASB industry-based climate metrics
GET  /api/v1/issb-s2/ref/tcfd-crossref      — TCFD to IFRS S2 cross-reference table
"""
from __future__ import annotations

import dataclasses
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.issb_s2_engine import get_engine

router = APIRouter(prefix="/api/v1/issb-s2", tags=["ISSB S2 Climate Disclosures"])


# ---------------------------------------------------------------------------
# Request Models
# ---------------------------------------------------------------------------

class ISSBS2AssessRequest(BaseModel):
    entity_id: str
    entity_name: str
    industry_sector: str = "financials"
    reporting_period: str = "2024"
    scope1_tco2e: float = Field(0.0, ge=0)
    scope2_tco2e: float = Field(0.0, ge=0)
    scope3_tco2e: float = Field(0.0, ge=0)
    financed_emissions_tco2e: Optional[float] = None
    internal_carbon_price: Optional[float] = None
    climate_capex_pct: float = Field(0.0, ge=0, le=100)
    revenue_usd_mn: float = Field(1000.0, gt=0)
    # Qualitative disclosure-item evidence (see IFRS_S2_PILLARS in the engine
    # for the authoritative key catalog). Previously accepted by
    # ISSBS2Engine.assess() but never exposed on this request model or
    # forwarded by the route below, so governance/strategy/risk_management
    # pillar scores were silently pinned to 0 for every caller.
    governance_disclosures: Optional[list[str]] = None
    strategy_disclosures: Optional[list[str]] = None
    risk_mgmt_disclosures: Optional[list[str]] = None
    metrics_targets_disclosures: Optional[list[str]] = None
    physical_risk_score: Optional[float] = Field(None, ge=0, le=10)
    transition_risk_score: Optional[float] = Field(None, ge=0, le=10)
    sasb_metric_values: Optional[dict] = None


class ScenarioAnalysisRequest(BaseModel):
    entity_id: str
    entity_type: str = "corporate"
    scenarios: Optional[list[str]] = None
    # Balance-sheet exposures the engine needs to turn a scenario pathway into
    # entity-level impacts (see ISSBS2Engine.run_scenario_analysis docstring).
    # Previously accepted by the engine but not exposed here, so every
    # scenario-analysis call silently returned impacts of None.
    entity_financials: Optional[dict] = None


class RiskIdentificationRequest(BaseModel):
    entity_id: str
    sector: str = "financials"
    include_opportunities: bool = True
    # entity-specific likelihood/impact scores keyed by risk_key, and
    # opportunity USD-mn potential keyed by opportunity name. Previously
    # accepted by the engine but not exposed here.
    risk_scores: Optional[dict] = None
    opportunity_values: Optional[dict] = None


# ---------------------------------------------------------------------------
# Assessment Endpoints
# ---------------------------------------------------------------------------

@router.post("/assess")
def assess_issb_s2(req: ISSBS2AssessRequest):
    """Full IFRS S2 Climate-Related Disclosures assessment across all four pillars."""
    try:
        engine = get_engine()
        result = engine.assess(
            entity_id=req.entity_id,
            entity_name=req.entity_name,
            industry_sector=req.industry_sector,
            reporting_period=req.reporting_period,
            scope1_tco2e=req.scope1_tco2e,
            scope2_tco2e=req.scope2_tco2e,
            scope3_tco2e=req.scope3_tco2e,
            financed_emissions_tco2e=req.financed_emissions_tco2e,
            internal_carbon_price=req.internal_carbon_price,
            climate_capex_pct=req.climate_capex_pct,
            revenue_usd_mn=req.revenue_usd_mn,
            governance_disclosures=req.governance_disclosures,
            strategy_disclosures=req.strategy_disclosures,
            risk_mgmt_disclosures=req.risk_mgmt_disclosures,
            metrics_targets_disclosures=req.metrics_targets_disclosures,
            physical_risk_score=req.physical_risk_score,
            transition_risk_score=req.transition_risk_score,
            sasb_metric_values=req.sasb_metric_values,
        )
        return {"status": "ok", "result": dataclasses.asdict(result)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/scenario-analysis")
def scenario_analysis(req: ScenarioAnalysisRequest):
    """Run IFRS S2 §22-24 climate scenario analysis across 1.5C / 2C / current_policies pathways."""
    try:
        engine = get_engine()
        result = engine.run_scenario_analysis(
            entity_id=req.entity_id,
            entity_type=req.entity_type,
            scenarios=req.scenarios,
            entity_financials=req.entity_financials,
        )
        return {"status": "ok", "result": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/risk-identification")
def risk_identification(req: RiskIdentificationRequest):
    """Identify physical and transition climate risks per IFRS S2 §10-12."""
    try:
        engine = get_engine()
        result = engine.identify_risks(
            entity_id=req.entity_id,
            sector=req.sector,
            include_opportunities=req.include_opportunities,
            risk_scores=req.risk_scores,
            opportunity_values=req.opportunity_values,
        )
        return {"status": "ok", "result": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ---------------------------------------------------------------------------
# Reference Data Endpoints
# ---------------------------------------------------------------------------

@router.get("/ref/pillars")
def ref_pillars():
    """IFRS S2 four-pillar disclosure framework reference data."""
    try:
        return {"status": "ok", "result": get_engine().ref_pillars()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/ref/scenarios")
def ref_scenarios():
    """Climate scenario definitions for IFRS S2 scenario analysis (1.5C, 2C, current_policies)."""
    try:
        return {"status": "ok", "result": get_engine().ref_scenarios()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/ref/physical-risks")
def ref_physical_risks():
    """Physical climate risk taxonomy — acute and chronic risk types per IFRS S2."""
    try:
        return {"status": "ok", "result": get_engine().ref_physical_risks()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/ref/transition-risks")
def ref_transition_risks():
    """Transition climate risk taxonomy — policy, technology, market, reputational risks."""
    try:
        return {"status": "ok", "result": get_engine().ref_transition_risks()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/ref/sasb-sectors")
def ref_sasb_sectors():
    """SASB SICS industry-based climate metrics for 8 sectors."""
    try:
        return {"status": "ok", "result": get_engine().ref_sasb_sectors()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/ref/tcfd-crossref")
def ref_tcfd_crossref():
    """TCFD recommendation to IFRS S2 paragraph cross-reference table."""
    try:
        return {"status": "ok", "result": get_engine().ref_tcfd_crossref()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
