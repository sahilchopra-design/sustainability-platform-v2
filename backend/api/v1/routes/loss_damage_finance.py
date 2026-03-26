"""
API Routes: Loss & Damage Finance Engine — E113
================================================
POST /api/v1/loss-damage/assess              — L&D finance assessment (FAR + WIM + COP28)
POST /api/v1/loss-damage/protection-gap     — Protection gap analysis
POST /api/v1/loss-damage/parametric-trigger — Parametric trigger design
POST /api/v1/loss-damage/regional-mechanism — Regional risk pool eligibility
GET  /api/v1/loss-damage/ref/v20-profiles         — Vulnerable country profiles (25)
GET  /api/v1/loss-damage/ref/wim-structure         — Warsaw Mechanism 5 pillars
GET  /api/v1/loss-damage/ref/cop28-fund            — COP28 L&D Fund details
GET  /api/v1/loss-damage/ref/attribution-science   — FAR by event type
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.loss_damage_finance_engine import (
    CLIMATE_ATTRIBUTION_FAR,
    COP28_LD_FUND,
    LossDamageFinanceEngine,
    LossDamageRequest,
    PARAMETRIC_TRIGGER_TYPES,
    ProtectionGapRequest,
    ParametricTriggerRequest,
    REGIONAL_RISK_POOLS,
    RegionalMechanismRequest,
    VULNERABLE_COUNTRY_PROFILES,
    WIM_PILLARS,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/loss-damage",
    tags=["Loss & Damage Finance (E113)"],
)

_engine = LossDamageFinanceEngine()


# ---------------------------------------------------------------------------
# POST /assess
# ---------------------------------------------------------------------------


@router.post(
    "/assess",
    summary="Loss & Damage Finance Assessment",
    description=(
        "Assesses climate loss and damage for a vulnerable country event. "
        "Returns FAR attribution (World Weather Attribution), protection gap, "
        "Warsaw Mechanism eligibility, COP28 L&D Fund eligibility, and "
        "recommended rapid response financing options."
    ),
)
def assess_loss_damage(request: LossDamageRequest) -> Dict[str, Any]:
    try:
        result = _engine.assess_loss_damage_finance(
            country_iso=request.country_iso,
            event_type=request.event_type,
            economic_loss_usd=request.economic_loss_usd,
        )
        return {"status": "success", "data": result}
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("Error in assess_loss_damage: %s", exc)
        raise HTTPException(status_code=500, detail="Internal server error during L&D assessment.")


# ---------------------------------------------------------------------------
# POST /protection-gap
# ---------------------------------------------------------------------------


@router.post(
    "/protection-gap",
    summary="Protection Gap Analysis",
    description=(
        "Calculates the insurance protection gap for a climate loss event. "
        "Returns gap_usd, gap_pct, feasible penetration benchmark, estimated "
        "annual premium, and policy recommendations for gap closure."
    ),
)
def protection_gap(request: ProtectionGapRequest) -> Dict[str, Any]:
    try:
        if request.insured_loss_usd > request.total_loss_usd:
            raise ValueError("insured_loss_usd cannot exceed total_loss_usd.")
        result = _engine.calculate_protection_gap(
            country_iso=request.country_iso,
            total_loss_usd=request.total_loss_usd,
            insured_loss_usd=request.insured_loss_usd,
            sector=request.sector,
        )
        return {"status": "success", "data": result}
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("Error in protection_gap: %s", exc)
        raise HTTPException(status_code=500, detail="Internal server error during protection gap analysis.")


# ---------------------------------------------------------------------------
# POST /parametric-trigger
# ---------------------------------------------------------------------------


@router.post(
    "/parametric-trigger",
    summary="Parametric Trigger Design",
    description=(
        "Designs a parametric insurance trigger for a given country and peril. "
        "Returns recommended trigger type, threshold specification, basis risk score, "
        "payout structure, and basis risk mitigation measures."
    ),
)
def parametric_trigger(request: ParametricTriggerRequest) -> Dict[str, Any]:
    try:
        result = _engine.design_parametric_trigger(
            country_iso=request.country_iso,
            peril=request.peril,
            coverage_amount_usd_mn=request.coverage_amount_usd_mn,
            preferred_payout_speed_days=request.preferred_payout_speed_days,
        )
        return {"status": "success", "data": result}
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("Error in parametric_trigger: %s", exc)
        raise HTTPException(status_code=500, detail="Internal server error during parametric trigger design.")


# ---------------------------------------------------------------------------
# POST /regional-mechanism
# ---------------------------------------------------------------------------


@router.post(
    "/regional-mechanism",
    summary="Regional Risk Pool Eligibility",
    description=(
        "Assesses eligibility and suitability of regional climate risk pools "
        "(CCRIF, ARC, PCRAFI) for a given country. Returns pool membership status, "
        "premium estimates, peril coverage match, and join recommendations."
    ),
)
def regional_mechanism(request: RegionalMechanismRequest) -> Dict[str, Any]:
    try:
        result = _engine.assess_regional_mechanism(
            country_iso=request.country_iso,
            annual_exposure_usd_mn=request.annual_exposure_usd_mn,
            desired_perils=request.desired_perils,
        )
        return {"status": "success", "data": result}
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("Error in regional_mechanism: %s", exc)
        raise HTTPException(status_code=500, detail="Internal server error during regional mechanism assessment.")


# ---------------------------------------------------------------------------
# GET /ref/v20-profiles
# ---------------------------------------------------------------------------


@router.get(
    "/ref/v20-profiles",
    summary="Vulnerable Country Profiles (V20/SIDS/LDC)",
    description=(
        "Returns the 25 hardcoded vulnerable country profiles used by the engine. "
        "Each profile includes annual economic loss, insured loss %, vulnerability score, "
        "primary peril, V20/SIDS/LDC membership, and protection gap %."
    ),
)
def ref_v20_profiles() -> Dict[str, Any]:
    summary = []
    for iso, profile in VULNERABLE_COUNTRY_PROFILES.items():
        summary.append({
            "iso": iso,
            "name": profile["name"],
            "region": profile["region"],
            "annual_economic_loss_usd_bn": profile["annual_economic_loss_usd_bn"],
            "insured_loss_pct": profile["insured_loss_pct"],
            "climate_vulnerability_score": profile["climate_vulnerability_score"],
            "primary_peril": profile["primary_peril"],
            "V20_member": profile["V20_member"],
            "SIDS_member": profile["SIDS_member"],
            "LDC_member": profile["LDC_member"],
            "protection_gap_pct": profile["protection_gap_pct"],
        })
    summary.sort(key=lambda x: x["climate_vulnerability_score"], reverse=True)
    return {
        "status": "success",
        "count": len(summary),
        "source": "V20 Vulnerable Twenty Group; UNFCCC SIDS/LDC registry; World Bank CRED EM-DAT",
        "data": summary,
    }


# ---------------------------------------------------------------------------
# GET /ref/wim-structure
# ---------------------------------------------------------------------------


@router.get(
    "/ref/wim-structure",
    summary="Warsaw International Mechanism — 5 Pillars",
    description=(
        "Returns the 5 pillars of the Warsaw International Mechanism (WIM) "
        "established at COP19 (Decision 2/CP.19). Covers knowledge, coordination, "
        "finance/technology/capacity, non-economic losses, and slow-onset events."
    ),
)
def ref_wim_structure() -> Dict[str, Any]:
    return {
        "status": "success",
        "mechanism": "Warsaw International Mechanism for Loss and Damage (WIM)",
        "established": "COP19, Warsaw, November 2013 — Decision 2/CP.19",
        "legal_basis": "Paris Agreement Article 8",
        "executive_committee": "WIM ExCom — reports to COP/CMA",
        "count": len(WIM_PILLARS),
        "data": WIM_PILLARS,
    }


# ---------------------------------------------------------------------------
# GET /ref/cop28-fund
# ---------------------------------------------------------------------------


@router.get(
    "/ref/cop28-fund",
    summary="COP28 Loss and Damage Fund",
    description=(
        "Returns details of the Fund for responding to Loss and Damage established "
        "at COP28 (Decision 5/CP.28), including eligibility criteria, grant size range, "
        "loan terms, access modalities, and Santiago Network linkage."
    ),
)
def ref_cop28_fund() -> Dict[str, Any]:
    return {
        "status": "success",
        "data": COP28_LD_FUND,
    }


# ---------------------------------------------------------------------------
# GET /ref/attribution-science
# ---------------------------------------------------------------------------


@router.get(
    "/ref/attribution-science",
    summary="Climate Attribution Science — FAR by Event Type",
    description=(
        "Returns the Fraction of Attributable Risk (FAR) for each supported climate "
        "event type, sourced from World Weather Attribution (WWA) studies and IPCC AR6. "
        "Includes confidence levels, methods, and key references."
    ),
)
def ref_attribution_science() -> Dict[str, Any]:
    enriched = []
    for event_type, data in CLIMATE_ATTRIBUTION_FAR.items():
        enriched.append({
            "event_type": event_type,
            "far": data["far"],
            "far_pct": round(data["far"] * 100.0, 1),
            "confidence_level": data["confidence_level"],
            "method": data["method"],
            "reference": data["reference"],
            "notes": data["notes"],
        })
    enriched.sort(key=lambda x: x["far"], reverse=True)
    return {
        "status": "success",
        "framework": "World Weather Attribution (WWA) — Fraction of Attributable Risk (FAR)",
        "description": (
            "FAR measures the fraction of observed hazard probability attributable to "
            "anthropogenic climate change. FAR = 1 − (P0 / P1), where P0 is probability "
            "in a world without climate change and P1 is current-climate probability."
        ),
        "count": len(enriched),
        "data": enriched,
    }
