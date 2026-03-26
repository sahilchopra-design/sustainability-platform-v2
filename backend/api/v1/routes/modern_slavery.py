"""
API Routes: Modern Slavery & Forced Labour Engine — E114
=========================================================
POST /api/v1/modern-slavery/assess              — Full forced labour risk assessment
POST /api/v1/modern-slavery/supply-chain-screen — Tier-by-tier supply chain screening
POST /api/v1/modern-slavery/msa-statement       — UK MSA Section 54 statement quality evaluation
POST /api/v1/modern-slavery/uflpa-exposure      — UFLPA Xinjiang exposure check
GET  /api/v1/modern-slavery/ref/ilo-indicators  — 11 ILO forced labour indicators
GET  /api/v1/modern-slavery/ref/high-risk-sectors — 25 sector/commodity risk profiles
GET  /api/v1/modern-slavery/ref/audit-schemes   — 15 audit scheme effectiveness ratings
GET  /api/v1/modern-slavery/ref/uflpa-criteria  — UFLPA enforcement criteria and reference data
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from services.modern_slavery_engine import (
    ModernSlaveryEngine,
    AssessForcedLabourRequest,
    SupplierScreenRequest,
    MsaStatementData,
    UflpaProductData,
    ILO_INDICATORS,
    UFLPA_DATA,
    EU_FLR_DATA,
    UK_MSA_DATA,
    HIGH_RISK_SECTORS,
    AUDIT_SCHEMES,
    CAHRA_COUNTRIES,
)

router = APIRouter(prefix="/api/v1/modern-slavery", tags=["Modern Slavery & Forced Labour — E114"])
_engine = ModernSlaveryEngine()


# ---------------------------------------------------------------------------
# POST endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/assess",
    summary="Full forced labour risk assessment",
    description=(
        "Assesses forced labour risk for an entity based on sector, supply chain countries, and commodities. "
        "Returns UK MSA score, EU FLR 2024/3015 readiness, UFLPA Xinjiang exposure, ILO 11-indicator "
        "composite score, child labour risk, debt bondage risk, CAHRA flags, and overall risk tier."
    ),
)
def assess_forced_labour(request: AssessForcedLabourRequest):
    try:
        result = _engine.assess_forced_labour_risk(request)
        return result.model_dump()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post(
    "/supply-chain-screen",
    summary="Tier-by-tier supply chain screening",
    description=(
        "Screens each supplier in a tiered supply chain for ILO risk flags, UFLPA flags, CAHRA flags, "
        "audit status, and recommended audit scheme. Returns prioritised supplier list."
    ),
)
def screen_supply_chain(request: SupplierScreenRequest):
    try:
        if not request.suppliers:
            raise HTTPException(status_code=400, detail="At least one supplier must be provided")
        result = _engine.screen_supply_chain(request)
        return result.model_dump()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post(
    "/msa-statement",
    summary="UK Modern Slavery Act — Section 54 statement quality evaluation",
    description=(
        "Evaluates a UK MSA Section 54 transparency statement against the six prescribed areas and "
        "Home Office quality criteria. Returns tier (poor → leading), area scores, "
        "improvement recommendations, and best-practice gaps."
    ),
)
def evaluate_msa_statement(request: MsaStatementData):
    try:
        result = _engine.evaluate_msa_statement(request)
        return result.model_dump()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post(
    "/uflpa-exposure",
    summary="UFLPA Xinjiang exposure check",
    description=(
        "Calculates Xinjiang exposure percentage, CBP enforcement risk level, and rebuttable presumption "
        "trigger status under the Uyghur Forced Labor Prevention Act (Pub. L. 117-78). "
        "Returns documentation met/missing and recommended actions."
    ),
)
def uflpa_exposure(request: UflpaProductData):
    try:
        result = _engine.calculate_uflpa_exposure(request)
        return result.model_dump()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ---------------------------------------------------------------------------
# GET reference endpoints
# ---------------------------------------------------------------------------

@router.get(
    "/ref/ilo-indicators",
    summary="ILO 11 Forced Labour Indicators",
    description=(
        "Returns all 11 ILO forced labour indicators (ILO 2012 Hard to See, Harder to Count) "
        "with scoring criteria, evidence requirements, and sector prevalence ratings."
    ),
)
def ref_ilo_indicators():
    return {
        "source": "ILO (2012) Hard to See, Harder to Count — Survey Guidelines",
        "ilo_conventions": ["C29 Forced Labour Convention 1930", "C105 Abolition of Forced Labour 1957"],
        "count": len(ILO_INDICATORS),
        "indicators": {
            key: {
                "number": val["number"],
                "name": val["name"],
                "description": val["description"],
                "ilo_reference": val["ilo_reference"],
                "weight": val["weight"],
                "scoring_criteria": val["scoring_criteria"],
                "evidence_requirements": val["evidence_requirements"],
                "sector_prevalence": val["sector_prevalence"],
            }
            for key, val in ILO_INDICATORS.items()
        },
    }


@router.get(
    "/ref/high-risk-sectors",
    summary="25 High-Risk Sector / Commodity Profiles",
    description=(
        "Returns 25 sector + geography combinations with forced labour risk, child labour risk, "
        "debt bondage risk, applicable regulations (UFLPA / UK MSA / EU FLR / CAHRA), "
        "and recommended audit schemes."
    ),
)
def ref_high_risk_sectors():
    return {
        "count": len(HIGH_RISK_SECTORS),
        "note": "Risk ratings are indicative based on ILO, ITUC, and U.S. DoL research",
        "sectors": HIGH_RISK_SECTORS,
        "cahra_countries": {
            k: {"name": v["name"], "risk_type": v["risk_type"]}
            for k, v in CAHRA_COUNTRIES.items()
        },
    }


@router.get(
    "/ref/audit-schemes",
    summary="15 Social Audit Scheme Effectiveness Ratings",
    description=(
        "Returns profiles for 15 social compliance audit and certification schemes including "
        "SMETA, SA8000, BSCI, Fair Trade, Rainforest Alliance, RSPO, FLA, WRC, CCC, and others. "
        "Each entry includes effectiveness rating, forced labour coverage, worker interview practice, "
        "announcement type, and cost ranges."
    ),
)
def ref_audit_schemes():
    return {
        "count": len(AUDIT_SCHEMES),
        "effectiveness_scale": {
            "very_high": "Rigorous; unannounced; strong worker voice; certification with surveillance",
            "high": "Solid coverage; semi-announced; good corrective action follow-up",
            "medium": "Baseline compliance; announced; limited remedy mechanism",
            "low": "Narrow scope or advocacy only",
        },
        "schemes": AUDIT_SCHEMES,
    }


@router.get(
    "/ref/uflpa-criteria",
    summary="UFLPA Enforcement Criteria and Reference Data",
    description=(
        "Returns UFLPA (Pub. L. 117-78) enforcement criteria including rebuttable presumption mechanism, "
        "8 entity categories, CBP statistics, high-risk commodity list (with HS codes), "
        "approved importer criteria, and documentation requirements."
    ),
)
def ref_uflpa_criteria():
    return {
        "legislation": UFLPA_DATA["legislation"],
        "enacted": UFLPA_DATA["enacted"],
        "enforcing_body": UFLPA_DATA["enforcing_body"],
        "rebuttable_presumption": UFLPA_DATA["rebuttable_presumption"],
        "entity_categories": UFLPA_DATA["entity_categories"],
        "high_risk_commodities": UFLPA_DATA["high_risk_commodities"],
        "approved_importer_criteria": UFLPA_DATA["approved_importer_criteria"],
        "cbp_enforcement_statistics": UFLPA_DATA["cbp_enforcement_statistics"],
        "documentation_requirements": UFLPA_DATA["documentation_requirements"],
        "eu_flr_summary": {
            "regulation": EU_FLR_DATA["regulation"],
            "scope": EU_FLR_DATA["scope"],
            "effective_date": EU_FLR_DATA["effective_date"],
            "prohibition": EU_FLR_DATA["prohibition"],
        },
        "uk_msa_summary": {
            "legislation": UK_MSA_DATA["legislation"],
            "reporting_threshold_gbp": UK_MSA_DATA["reporting_threshold_gbp"],
            "six_prescribed_areas": [
                {"id": a["id"], "name": a["name"], "weight": a["home_office_weight"]}
                for a in UK_MSA_DATA["six_prescribed_areas"]
            ],
            "quality_tiers": list(UK_MSA_DATA["home_office_quality_tiers"].keys()),
        },
    }
