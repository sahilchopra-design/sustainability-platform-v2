"""
API Routes: Sustainability-Linked Loan & Bond v2 Engine — E115
==============================================================
POST /api/v1/sll-slb-v2/assess              — Full SLL/SLB quality assessment
POST /api/v1/sll-slb-v2/calibrate-spt       — SPT calibration vs SBTi SDA trajectory
POST /api/v1/sll-slb-v2/margin-impact       — Margin ratchet NPV/scenario analysis
POST /api/v1/sll-slb-v2/greenwashing-screen — Greenwashing flag detection
GET  /api/v1/sll-slb-v2/ref/icma-principles — ICMA SLBP 2023 components + LMA SLLP 2023
GET  /api/v1/sll-slb-v2/ref/sda-trajectories — SBTi SDA by sector
GET  /api/v1/sll-slb-v2/ref/kpi-materiality — KPI × sector materiality matrix
GET  /api/v1/sll-slb-v2/ref/verification-agents — SPO provider profiles + ISAE 3000 guidance
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from services.sll_slb_v2_engine import (
    SllSlbV2Engine,
    AssessSllSlbRequest,
    CalibrateSptRequest,
    MarginImpactRequest,
    GreenwashingScreenRequest,
    ICMA_SLBP_COMPONENTS,
    LMA_SLLP_COMPONENTS,
    SDA_TRAJECTORIES,
    KPI_DEFINITIONS,
    KPI_MATERIALITY_MATRIX,
    SPT_CRITERIA,
    SPO_PROVIDERS,
    MARGIN_RATCHET_TYPES,
    MARGIN_RATCHET_MARKET,
    GREENWASHING_FLAGS,
    MARKET_DATA,
    SECTORS_LIST,
)

router = APIRouter(prefix="/api/v1/sll-slb-v2", tags=["SLL & SLB v2 — E115"])
_engine = SllSlbV2Engine()


# ---------------------------------------------------------------------------
# POST endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/assess",
    summary="Full SLL/SLB quality assessment",
    description=(
        "Comprehensive quality assessment of a Sustainability-Linked Bond (SLB) or Loan (SLL) against "
        "ICMA SLBP 2023 / LMA SLLP 2023. Scores 5 components (KPI selection, SPT calibration, "
        "bond/loan characteristics, reporting, verification), flags greenwashing risks, "
        "and assigns quality grade A–D."
    ),
)
def assess_sll_slb(request: AssessSllSlbRequest):
    try:
        if not request.kpis:
            raise HTTPException(status_code=400, detail="At least one KPI must be provided")
        if not request.spts:
            raise HTTPException(status_code=400, detail="At least one SPT must be provided")
        if request.instrument.instrument_type.upper() not in ("SLB", "SLL"):
            raise HTTPException(status_code=400, detail="instrument_type must be 'SLB' or 'SLL'")
        result = _engine.assess_sll_slb_quality(request)
        return result.model_dump()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post(
    "/calibrate-spt",
    summary="SPT calibration against SBTi SDA trajectory",
    description=(
        "Calibrates a Sustainability Performance Target against the SBTi Sectoral Decarbonization "
        "Approach (SDA) trajectory for the issuer's sector. Returns ambition level "
        "(leading/aligned/lagging/insufficient), SBTi compatibility flag, performance vs SDA delta, "
        "and recommended tightening percentage."
    ),
)
def calibrate_spt(request: CalibrateSptRequest):
    try:
        if request.target_year <= request.baseline_year:
            raise HTTPException(
                status_code=400,
                detail="target_year must be after baseline_year"
            )
        result = _engine.calibrate_spt(request)
        return result.model_dump()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post(
    "/margin-impact",
    summary="Margin ratchet NPV and scenario analysis",
    description=(
        "Calculates the expected P&L impact of a margin ratchet mechanism (step-up only / bidirectional / "
        "pure ratchet) under SPT hit and miss scenarios. Returns annual and lifetime cost by scenario, "
        "expected value of mechanism, and BPS summary."
    ),
)
def margin_impact(request: MarginImpactRequest):
    try:
        if request.notional_usd <= 0:
            raise HTTPException(status_code=400, detail="notional_usd must be positive")
        if request.step_up_bps < 0 or request.step_down_bps < 0:
            raise HTTPException(status_code=400, detail="step_up_bps and step_down_bps must be non-negative")
        if request.step_up_bps + request.step_down_bps > 50:
            raise HTTPException(
                status_code=400,
                detail="Total ratchet adjustment (step_up + step_down) exceeds 50bps market cap"
            )
        result = _engine.calculate_margin_impact(request)
        return result.model_dump()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post(
    "/greenwashing-screen",
    summary="Greenwashing flag detection for SLL/SLB",
    description=(
        "Screens an SLL or SLB for greenwashing red flags based on ICMA SLBP 2023, "
        "ESMA Supervisory Brief (May 2023), and LMA SLLP 2023. "
        "Flags include: intensity SPT allowing absolute growth, BAU trajectory, "
        "opaque verification, short observation period, cherry-picked base year, and others. "
        "Returns flags with severity (major/moderate/minor) and overall greenwashing risk (low/medium/high/critical)."
    ),
)
def greenwashing_screen(request: GreenwashingScreenRequest):
    try:
        result = _engine.screen_greenwashing_flags(request)
        return result.model_dump()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ---------------------------------------------------------------------------
# GET reference endpoints
# ---------------------------------------------------------------------------

@router.get(
    "/ref/icma-principles",
    summary="ICMA SLBP 2023 + LMA SLLP 2023 components",
    description=(
        "Returns all 5 components of the ICMA Sustainability-Linked Bond Principles 2023 "
        "and LMA/APLMA Sustainability-Linked Loan Principles 2023, including assessment criteria, "
        "scoring rubrics, SPT calibration framework (5 criteria × 0-20), "
        "and margin ratchet mechanics reference data."
    ),
)
def ref_icma_principles(
    instrument_type: str = Query("SLB", description="SLB or SLL")
):
    if instrument_type.upper() not in ("SLB", "SLL"):
        raise HTTPException(status_code=400, detail="instrument_type must be SLB or SLL")
    components = ICMA_SLBP_COMPONENTS if instrument_type.upper() == "SLB" else LMA_SLLP_COMPONENTS
    return {
        "instrument_type": instrument_type.upper(),
        "source": (
            "ICMA Sustainability-Linked Bond Principles (June 2023)"
            if instrument_type.upper() == "SLB"
            else "LMA/APLMA Sustainability-Linked Loan Principles (February 2023)"
        ),
        "components": components,
        "spt_calibration_criteria": SPT_CRITERIA,
        "margin_ratchet_types": MARGIN_RATCHET_TYPES,
        "margin_ratchet_market_data": MARGIN_RATCHET_MARKET,
        "greenwashing_red_flags": GREENWASHING_FLAGS,
        "market_reference": {
            "issuance_by_year": MARKET_DATA["issuance_2020_2024_usd_bn"],
            "top_kpi_types_2023": MARKET_DATA["top_kpi_types_2023_slb"],
            "quality_grades": MARKET_DATA["quality_grade_descriptions"],
        },
    }


@router.get(
    "/ref/sda-trajectories",
    summary="SBTi Sectoral Decarbonization Approach (SDA) trajectories",
    description=(
        "Returns SBTi SDA 1.5°C-aligned decarbonization trajectories for 8 sectors: "
        "power, buildings, transport, industry, agriculture, AFOLU, waste, and other (cross-sector). "
        "Each entry includes baseline 2020 value, 2025/2030/2035/2040/2050 targets, "
        "required % reductions, unit, and methodology reference."
    ),
)
def ref_sda_trajectories(
    sector: Optional[str] = Query(None, description="Filter to specific sector key")
):
    if sector:
        if sector not in SDA_TRAJECTORIES:
            raise HTTPException(
                status_code=404,
                detail=f"Sector '{sector}' not found. Valid sectors: {list(SDA_TRAJECTORIES.keys())}"
            )
        return {"sector": sector, "trajectory": SDA_TRAJECTORIES[sector]}
    return {
        "source": "Science Based Targets initiative — SDA Technical Summary 2023",
        "methodology": "Paris Agreement 1.5°C-consistent decarbonization pathway",
        "sectors_count": len(SDA_TRAJECTORIES),
        "trajectories": SDA_TRAJECTORIES,
    }


@router.get(
    "/ref/kpi-materiality",
    summary="KPI × sector materiality matrix",
    description=(
        "Returns a materiality matrix of 40 KPIs × 20 sectors with materiality scores 0-3 "
        "(0=not material, 1=emerging, 2=material, 3=highly material). "
        "Based on SASB industry standards, GRI 300/400 series, and ICMA SLBP KPI guidance."
    ),
)
def ref_kpi_materiality(
    sector: Optional[str] = Query(None, description="Filter to one sector"),
    kpi_key: Optional[str] = Query(None, description="Filter to one KPI"),
):
    if sector and sector not in SECTORS_LIST:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid sector. Valid sectors: {SECTORS_LIST}"
        )
    if kpi_key and kpi_key not in KPI_DEFINITIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid kpi_key. Valid keys: {list(KPI_DEFINITIONS.keys())}"
        )

    materiality_labels = {0: "not_material", 1: "emerging", 2: "material", 3: "highly_material"}

    if kpi_key:
        matrix_row = KPI_MATERIALITY_MATRIX.get(kpi_key, {})
        return {
            "kpi_key": kpi_key,
            "kpi_definition": KPI_DEFINITIONS[kpi_key],
            "materiality_by_sector": {
                s: {
                    "score": matrix_row.get(s, 1),
                    "label": materiality_labels.get(matrix_row.get(s, 1), "emerging"),
                }
                for s in SECTORS_LIST
            },
        }

    if sector:
        return {
            "sector": sector,
            "kpi_materiality": {
                k: {
                    "kpi_name": KPI_DEFINITIONS.get(k, {}).get("name", k),
                    "score": KPI_MATERIALITY_MATRIX.get(k, {}).get(sector, 1),
                    "label": materiality_labels.get(
                        KPI_MATERIALITY_MATRIX.get(k, {}).get(sector, 1), "emerging"
                    ),
                }
                for k in KPI_DEFINITIONS
            },
        }

    # Full matrix
    return {
        "note": "Materiality scores: 0=not material, 1=emerging, 2=material, 3=highly material",
        "source": "SASB Industry Standards, GRI 300/400, ICMA SLBP KPI guidance",
        "kpi_count": len(KPI_DEFINITIONS),
        "sector_count": len(SECTORS_LIST),
        "sectors": SECTORS_LIST,
        "kpi_definitions": KPI_DEFINITIONS,
        "matrix": {
            k: KPI_MATERIALITY_MATRIX.get(k, {kpi_s: 1 for kpi_s in SECTORS_LIST})
            for k in KPI_DEFINITIONS
        },
    }


@router.get(
    "/ref/verification-agents",
    summary="SPO provider profiles and verification standards",
    description=(
        "Returns profiles for 6 ICMA-registered Second Party Opinion (SPO) providers: "
        "Sustainalytics, ISS ESG, Vigeo Eiris, DNV, Bureau Veritas, CICERO. "
        "Each entry includes methodology, ISAE 3000 capability, market share, cost ranges, "
        "turnaround time, and limitations. Also returns ISAE 3000 / ISSA 5000 verification "
        "standards overview."
    ),
)
def ref_verification_agents():
    return {
        "spo_providers": SPO_PROVIDERS,
        "spo_market_share_2023": MARKET_DATA["spo_market_share_2023"],
        "verification_standards": {
            "isae_3000": {
                "name": "ISAE 3000 (Revised) — Assurance Engagements other than Audits or Reviews",
                "standard_setter": "IAASB (International Auditing and Assurance Standards Board)",
                "assurance_level_limited": "ICMA SLBP minimum — practitioner obtains sufficient evidence "
                                           "to conclude no cause for concern",
                "assurance_level_reasonable": "Higher standard — practitioner positively confirms SPT achievement",
                "icma_slbp_minimum": "Limited assurance (ISAE 3000)",
                "preferred": "Reasonable assurance or ISSA 5000",
            },
            "issa_5000": {
                "name": "ISSA 5000 — Sustainability Assurance Standard (effective 2024)",
                "standard_setter": "IAASB",
                "notes": "New standard covering sustainability information; supersedes ad hoc approaches; "
                         "CSRD Art 26a requires ISSA 5000 for EU large entities from FY2024",
                "icma_alignment": "ISSA 5000 reasonable assurance aligns with ICMA best practice verification",
            },
        },
        "external_reviewer_requirements": {
            "icma_requirements": [
                "Independence from issuer",
                "Methodology disclosure",
                "ICMA SPO alignment confirmation",
                "Annual post-issuance verification commitment",
            ],
            "lma_requirements": [
                "Independence from borrower",
                "Competence in sustainability/ESG matters",
                "Annual SPT performance verification",
                "Confidential bilateral verification acceptable",
            ],
        },
    }


# Import Optional for query params
from typing import Optional
