"""
Insurance Climate Risk Routes
POST /api/v1/insurance/calculate
GET  /api/v1/insurance/reference-data
GET  /api/v1/insurance/assessments
GET  /api/v1/insurance/assessments/{assessment_id}

Aligned with Solvency II Art. 44a / EIOPA ORSA Climate Guide 2022 /
Swiss Re sigma Physical Risk Model.

NOTE (2026-07-03 remediation): this route previously constructed
InsuranceCATInput / read InsuranceCATResult using field names that do not
exist on either dataclass (e.g. `entity_type`, `gross_cat_loss_1in100_climate`)
and wrote to insurance_climate_assessments columns that do not exist in the
migration 027 schema (e.g. `tp_climate_uplift_eur`). Every call raised a
TypeError before this fix — the route was never actually callable. Rewritten
below to match services/insurance_climate_risk.py exactly and to persist into
the real insurance_climate_entities / insurance_climate_assessments columns.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from db.base import get_db
from services.insurance_climate_risk import (
    InsuranceCATInput,
    calculate_insurance_climate_risk,
    get_reference_data as get_insurance_reference,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/insurance",
    tags=["Insurance Climate Risk"],
)


# ── Request / Response models ──────────────────────────────────────────────────

class InsuranceCalculateRequest(BaseModel):
    entity_id: Optional[str] = None              # link to existing insurance_climate_entities
    entity_name: str
    insurer_type: str = "primary"                  # primary | reinsurer | captive
    domicile_country: str = "GB"                   # ISO-3 preferred, truncated to 3 chars for storage
    cat_peril: str = "flood"                       # flood | tropical_cyclone | wildfire | drought | winter_storm | hail | earthquake

    gross_written_premium_eur: float = 0.0
    technical_provisions_eur: float = 0.0
    scr_eur: float = 0.0
    own_funds_eur: float = 0.0

    # Baseline loss estimates (current climate, pre-climate adjustment)
    gross_loss_1in100_baseline_eur: float = 0.0
    gross_loss_1in250_baseline_eur: float = 0.0
    average_annual_loss_baseline_eur: float = 0.0
    probable_max_loss_baseline_eur: float = 0.0

    # Reinsurance structure
    reinsurance_retention_pct: float = 0.30
    reinsurance_limit_eur: Optional[float] = None

    # Underwriting policies
    coal_exclusion: bool = False
    oil_sands_exclusion: bool = False
    arctic_drilling_exclusion: bool = False
    fossil_fuel_new_business_cap_pct: float = 100.0

    # Protection gap context
    total_economic_loss_baseline_eur: Optional[float] = None

    scenario: str = Field(default="2C")            # 1.5C | 2C | 3C
    horizon_year: int = 2050
    save_to_db: bool = True


class InsuranceCalculateResponse(BaseModel):
    assessment_id: Optional[str]
    entity_id: str
    entity_name: str
    peril: str
    scenario: str
    horizon_year: int

    # Climate-adjusted CAT losses
    gross_loss_1in100_eur: float
    gross_loss_1in250_eur: float
    net_loss_1in100_eur: float
    net_loss_1in250_eur: float
    average_annual_loss_eur: float
    probable_max_loss_eur: float
    cat_loss_change_pct: float

    # Technical provisions
    technical_provisions_eur: float
    climate_adjusted_tp_eur: float
    tp_uplift_pct: float

    # SCR
    scr_baseline_eur: float
    scr_climate_addon_eur: float
    total_scr_eur: float
    solvency_ratio_pre_addon: float
    solvency_ratio_post_addon: float

    # Reserve adequacy
    reserve_adequacy: str
    reserve_deficiency_eur: float

    # Protection gap
    insured_loss_eur: float
    economic_loss_eur: float
    protection_gap_eur: float
    protection_gap_pct: float

    # ESG underwriting
    esg_underwriting_score: float

    # Reinsurance
    reinsurance_adequate: bool
    reinsurance_gap_eur: float

    methodology_ref: str
    warnings: List[str]
    computed_at: str


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/calculate", response_model=InsuranceCalculateResponse)
def calculate_insurance(
    req: InsuranceCalculateRequest,
    db: Session = Depends(get_db),
) -> InsuranceCalculateResponse:
    """
    Calculate climate-adjusted CAT risk, technical provisions uplift,
    SCR add-on, reserve adequacy, protection gap and reinsurance sufficiency.
    """
    entity_id = req.entity_id or str(uuid.uuid4())

    inp = InsuranceCATInput(
        entity_id=entity_id,
        entity_name=req.entity_name,
        insurer_type=req.insurer_type,
        cat_peril=req.cat_peril,
        gross_written_premium_eur=req.gross_written_premium_eur,
        technical_provisions_eur=req.technical_provisions_eur,
        scr_eur=req.scr_eur,
        own_funds_eur=req.own_funds_eur,
        gross_loss_1in100_baseline_eur=req.gross_loss_1in100_baseline_eur,
        gross_loss_1in250_baseline_eur=req.gross_loss_1in250_baseline_eur,
        average_annual_loss_baseline_eur=req.average_annual_loss_baseline_eur,
        probable_max_loss_baseline_eur=req.probable_max_loss_baseline_eur,
        reinsurance_retention_pct=req.reinsurance_retention_pct,
        reinsurance_limit_eur=req.reinsurance_limit_eur,
        coal_exclusion=req.coal_exclusion,
        oil_sands_exclusion=req.oil_sands_exclusion,
        arctic_drilling_exclusion=req.arctic_drilling_exclusion,
        fossil_fuel_new_business_cap_pct=req.fossil_fuel_new_business_cap_pct,
        total_economic_loss_baseline_eur=req.total_economic_loss_baseline_eur,
    )

    result = calculate_insurance_climate_risk(inp, req.scenario, req.horizon_year)

    assessment_id: Optional[str] = None

    if req.save_to_db:
        try:
            if not req.entity_id:
                db.execute(
                    text("""
                        INSERT INTO insurance_climate_entities
                            (id, entity_name, country_iso, insurer_type,
                             total_gross_written_premium_eur, scr_eur, created_at)
                        VALUES
                            (:id, :name, :country, :itype,
                             :gwp, :scr, NOW())
                        ON CONFLICT DO NOTHING
                    """),
                    {
                        "id": entity_id,
                        "name": req.entity_name,
                        "country": (req.domicile_country or "GB")[:3].upper(),
                        "itype": req.insurer_type,
                        "gwp": req.gross_written_premium_eur,
                        "scr": req.scr_eur,
                    },
                )

            assessment_id = str(uuid.uuid4())
            db.execute(
                text("""
                    INSERT INTO insurance_climate_assessments
                        (id, entity_id, scenario, horizon_year,
                         cat_peril, gross_loss_1_in_100_eur, gross_loss_1_in_250_eur,
                         net_loss_1_in_100_eur, net_loss_1_in_250_eur,
                         probable_max_loss_eur, average_annual_loss_eur, cat_risk_change_2050_pct,
                         technical_provisions_eur, climate_adjusted_tp_eur, tp_climate_uplift_pct,
                         scr_climate_addon_eur, scr_coverage_ratio_post_addon,
                         reserve_adequacy_2c, reserve_deficiency_eur,
                         coal_exclusion_policy, oil_sands_exclusion, arctic_drilling_exclusion,
                         new_fossil_fuel_underwriting_limit_pct,
                         total_economic_loss_eur, insured_loss_eur, protection_gap_eur, protection_gap_pct,
                         reinsurance_retention_pct, reinsurance_coverage_adequate,
                         methodology_ref)
                    VALUES
                        (:id, :eid, :scenario, :year,
                         :peril, :g100, :g250,
                         :n100, :n250,
                         :pml, :aal, :chg_pct,
                         :tp, :tp_adj, :tp_pct,
                         :scr_addon, :sol_post,
                         :reserve_adq, :reserve_def,
                         :coal, :oilsands, :arctic,
                         :ff_cap,
                         :econ_loss, :insured_loss, :prot_gap_eur, :prot_gap_pct,
                         :ri_retention, :ri_adequate,
                         :methodology)
                """),
                {
                    "id": assessment_id,
                    "eid": entity_id,
                    "scenario": result.scenario,
                    "year": result.horizon_year,
                    "peril": result.peril,
                    "g100": result.gross_loss_1in100_eur,
                    "g250": result.gross_loss_1in250_eur,
                    "n100": result.net_loss_1in100_eur,
                    "n250": result.net_loss_1in250_eur,
                    "pml": result.probable_max_loss_eur,
                    "aal": result.average_annual_loss_eur,
                    "chg_pct": result.cat_loss_change_pct,
                    "tp": result.technical_provisions_eur,
                    "tp_adj": result.climate_adjusted_tp_eur,
                    "tp_pct": result.tp_uplift_pct,
                    "scr_addon": result.scr_climate_addon_eur,
                    "sol_post": result.solvency_ratio_post_addon,
                    "reserve_adq": result.reserve_adequacy,
                    "reserve_def": result.reserve_deficiency_eur,
                    "coal": req.coal_exclusion,
                    "oilsands": req.oil_sands_exclusion,
                    "arctic": req.arctic_drilling_exclusion,
                    "ff_cap": req.fossil_fuel_new_business_cap_pct,
                    "econ_loss": result.economic_loss_eur,
                    "insured_loss": result.insured_loss_eur,
                    "prot_gap_eur": result.protection_gap_eur,
                    "prot_gap_pct": result.protection_gap_pct,
                    "ri_retention": req.reinsurance_retention_pct,
                    "ri_adequate": result.reinsurance_adequate,
                    "methodology": result.methodology_ref,
                },
            )
            db.commit()
        except Exception as exc:
            logger.warning("DB write failed for insurance assessment: %s", exc)
            db.rollback()
            assessment_id = None

    return InsuranceCalculateResponse(
        assessment_id=assessment_id,
        entity_id=entity_id,
        entity_name=result.entity_name,
        peril=result.peril,
        scenario=result.scenario,
        horizon_year=result.horizon_year,
        gross_loss_1in100_eur=result.gross_loss_1in100_eur,
        gross_loss_1in250_eur=result.gross_loss_1in250_eur,
        net_loss_1in100_eur=result.net_loss_1in100_eur,
        net_loss_1in250_eur=result.net_loss_1in250_eur,
        average_annual_loss_eur=result.average_annual_loss_eur,
        probable_max_loss_eur=result.probable_max_loss_eur,
        cat_loss_change_pct=result.cat_loss_change_pct,
        technical_provisions_eur=result.technical_provisions_eur,
        climate_adjusted_tp_eur=result.climate_adjusted_tp_eur,
        tp_uplift_pct=result.tp_uplift_pct,
        scr_baseline_eur=result.scr_baseline_eur,
        scr_climate_addon_eur=result.scr_climate_addon_eur,
        total_scr_eur=result.total_scr_eur,
        solvency_ratio_pre_addon=result.solvency_ratio_pre_addon,
        solvency_ratio_post_addon=result.solvency_ratio_post_addon,
        reserve_adequacy=result.reserve_adequacy,
        reserve_deficiency_eur=result.reserve_deficiency_eur,
        insured_loss_eur=result.insured_loss_eur,
        economic_loss_eur=result.economic_loss_eur,
        protection_gap_eur=result.protection_gap_eur,
        protection_gap_pct=result.protection_gap_pct,
        esg_underwriting_score=result.esg_underwriting_score,
        reinsurance_adequate=result.reinsurance_adequate,
        reinsurance_gap_eur=result.reinsurance_gap_eur,
        methodology_ref=result.methodology_ref,
        warnings=result.warnings,
        computed_at=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/reference-data")
def reference_data() -> Dict[str, Any]:
    """Return peril multipliers, SCR factors, TP uplift table."""
    return get_insurance_reference()


@router.get("/assessments")
def list_assessments(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """List recent insurance climate assessments."""
    try:
        rows = db.execute(
            text("""
                SELECT a.id, e.entity_name, a.scenario, a.horizon_year,
                       a.gross_loss_1_in_100_eur, a.climate_adjusted_tp_eur,
                       a.scr_climate_addon_eur, a.reserve_adequacy_2c,
                       a.reinsurance_coverage_adequate, a.created_at
                FROM insurance_climate_assessments a
                JOIN insurance_climate_entities e ON e.id = a.entity_id
                ORDER BY a.created_at DESC
                LIMIT :lim OFFSET :off
            """),
            {"lim": limit, "off": offset},
        ).fetchall()
        return [dict(r._mapping) for r in rows]
    except Exception as exc:
        logger.warning("insurance assessments list failed: %s", exc)
        return []


@router.get("/assessments/{assessment_id}")
def get_assessment(
    assessment_id: str,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Return a single insurance climate assessment."""
    try:
        row = db.execute(
            text("""
                SELECT a.*, e.entity_name, e.insurer_type, e.country_iso AS domicile_country
                FROM insurance_climate_assessments a
                JOIN insurance_climate_entities e ON e.id = a.entity_id
                WHERE a.id = :aid
            """),
            {"aid": assessment_id},
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Assessment not found")
        return dict(row._mapping)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
