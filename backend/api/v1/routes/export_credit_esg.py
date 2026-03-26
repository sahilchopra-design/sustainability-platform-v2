"""
API Routes: E110 — Export Credit & Blended Trade Finance ESG Engine
====================================================================
POST /api/v1/export-credit-esg/assess              — Full transaction ESG assessment
POST /api/v1/export-credit-esg/fossil-fuel-screen  — ECA-level fossil fuel screening
POST /api/v1/export-credit-esg/equator-principles  — Equator Principles applicability check
POST /api/v1/export-credit-esg/green-classification — Green trade instrument classification
GET  /api/v1/export-credit-esg/ref/eca-profiles    — 15 ECA sustainability profiles
GET  /api/v1/export-credit-esg/ref/oecd-arrangement — OECD Arrangement sector understandings
GET  /api/v1/export-credit-esg/ref/ifc-performance-standards — IFC PS 1-8 checklist
GET  /api/v1/export-credit-esg/ref/fossil-fuel-exclusions — ECA fossil fuel exclusion matrix
"""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional

from services.export_credit_esg_engine import (
    ExportCreditTransactionData,
    ExportCreditESGEngine,
    ECA_PROFILES,
    OECD_SECTOR_UNDERSTANDINGS,
    IFC_PERFORMANCE_STANDARDS,
    FOSSIL_FUEL_EXCLUSION_MATRIX,
    OECD_COMMON_APPROACHES,
    EQUATOR_PRINCIPLES,
    EP_SIGNATORY_BANKS,
    GREEN_TRADE_INSTRUMENTS,
    BERNE_UNION_ESG,
    MIGA_ESG,
    SECTOR_RISK_MATRIX,
)

router = APIRouter(prefix="/api/v1/export-credit-esg", tags=["Export Credit ESG"])
_engine = ExportCreditESGEngine()


# ---------------------------------------------------------------------------
# Request Models
# ---------------------------------------------------------------------------

class FossilFuelScreenRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    sector: str
    subsector: str = ""
    eca_name: str
    project_value_usd: float = Field(0.0, ge=0)


class EquatorPrinciplesRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    project_value_usd: float = Field(..., ge=0)
    country_iso2: str
    sector: str
    has_existing_esia: bool = False
    community_affected: bool = False
    indigenous_peoples_affected: bool = False
    cultural_heritage_affected: bool = False


class GreenInstrumentRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    instrument_type: str
    use_of_proceeds: str
    sector: str
    project_value_usd: float = Field(0.0, ge=0)
    eca_name: str = ""


# ---------------------------------------------------------------------------
# POST Routes
# ---------------------------------------------------------------------------

@router.post("/assess", summary="Full export credit transaction ESG assessment")
def assess_export_credit(data: ExportCreditTransactionData):
    """
    Perform a comprehensive ESG assessment of an export credit or trade finance
    transaction covering:
    - ECA eligibility and Paris alignment
    - OECD Common Approaches environmental category (A/B/C)
    - IFC Performance Standards compliance gap analysis
    - Fossil fuel classification and ECA exclusion check
    - Green instrument and CCSU eligibility
    - Equator Principles IV applicability
    - Overall ESG risk tier and action items
    """
    return _engine.assess(data)


@router.post("/fossil-fuel-screen", summary="ECA-level fossil fuel exposure screening")
def fossil_fuel_screen(req: FossilFuelScreenRequest):
    """
    Screen a sector/subsector combination for fossil fuel classification and
    check the specific ECA's exclusion policy. Returns restriction status
    across all 15 ECAs in the reference set.

    Fossil fuel types covered:
    - coal_mining, coal_power, oil_sands, upstream_oil_gas,
      lng_infrastructure, petrochemicals
    """
    return _engine.fossil_fuel_screen(req.sector, req.subsector, req.eca_name)


@router.post("/equator-principles", summary="Equator Principles IV applicability check")
def equator_principles(req: EquatorPrinciplesRequest):
    """
    Determine whether Equator Principles IV apply to a project and which of
    the 10 principles are required based on:
    - Project value vs $10M threshold
    - OECD Common Approaches category (A/B/C)
    - Designated vs non-Designated country (IFC PS vs host law)
    - Community, indigenous peoples, and cultural heritage sensitivities
    """
    return _engine.equator_principles(
        req.project_value_usd,
        req.country_iso2,
        req.sector,
        req.has_existing_esia,
        req.community_affected,
        req.indigenous_peoples_affected,
        req.cultural_heritage_affected,
    )


@router.post("/green-classification", summary="Green trade instrument classification")
def green_classification(req: GreenInstrumentRequest):
    """
    Classify a trade finance instrument for green eligibility under:
    - ITFC Green Trade Finance Standards
    - OECD CCSU (extended 18-year repayment terms)
    - EU Taxonomy alignment
    - ICMA Green Bond Principles

    Instruments: green_letter_of_credit, sustainable_supply_chain_finance,
    green_trade_receivables, climate_export_credit, blue_bond_trade_finance
    """
    return _engine.green_classification(
        req.instrument_type,
        req.use_of_proceeds,
        req.sector,
        req.project_value_usd,
        req.eca_name,
    )


# ---------------------------------------------------------------------------
# GET Reference Routes
# ---------------------------------------------------------------------------

@router.get("/ref/eca-profiles", summary="All 15 ECA sustainability profiles")
def ref_eca_profiles():
    """
    Return sustainability profiles for all 15 ECAs:
    UKEF, COFACE, Euler Hermes/AGA, SACE, EKF, GIEK, EDC, EXIM-USA,
    JBIC/NEXI, K-EXIM, SINOSURE, ECGD, Atradius, CESCE, EXIM-India.

    Each profile includes: Paris alignment commitment and year, OECD Arrangement
    membership, fossil fuel exclusions (coal/oil_sands/upstream/LNG),
    green products, Berne Union membership, Equator Principles alignment.
    """
    profiles = {}
    for eca_key, profile in ECA_PROFILES.items():
        ff = profile.get("fossil_fuel_exclusions", {})
        excluded = [c for c, v in ff.items() if v is True and not c.endswith("_year")]
        profiles[eca_key] = {
            "full_name": profile.get("full_name", ""),
            "country": profile.get("country", ""),
            "paris_alignment_commitment": profile.get("paris_alignment_commitment", False),
            "paris_alignment_year": profile.get("paris_alignment_year"),
            "oecd_arrangement_member": profile.get("oecd_arrangement_member", False),
            "green_bond_eligible": profile.get("green_bond_eligible", False),
            "excluded_commodities": excluded,
            "exclusion_policy_summary": profile.get("exclusion_policy", ""),
            "green_products": profile.get("green_products", []),
            "equator_principles_aligned": profile.get("equator_principles_aligned", False),
            "ifc_ps_required": profile.get("ifc_ps_required", False),
            "berne_union_member": profile.get("berne_union_member", False),
        }
    return {
        "count": len(profiles),
        "eca_profiles": profiles,
        "berne_union_framework": BERNE_UNION_ESG,
        "miga_overview": MIGA_ESG,
    }


@router.get("/ref/oecd-arrangement", summary="OECD Arrangement Sector Understandings")
def ref_oecd_arrangement():
    """
    Return OECD Arrangement on Officially Supported Export Credits sector understandings:
    - OSS: Ships
    - CCSU: Renewable Energy, Climate Change Mitigation & Adaptation, Water
    - RSU: Rail Infrastructure
    - NSU: Nuclear Power Plants
    - WSU: Water Projects

    Includes concessional terms, climate criteria, ESG requirements, and
    green eligibility criteria for each Sector Understanding.
    """
    return {
        "sector_understandings": OECD_SECTOR_UNDERSTANDINGS,
        "common_approaches": OECD_COMMON_APPROACHES,
        "ep_signatory_banks": EP_SIGNATORY_BANKS,
        "ep_threshold_usd": 10_000_000,
        "green_trade_instruments": GREEN_TRADE_INSTRUMENTS,
        "sector_risk_matrix": SECTOR_RISK_MATRIX,
    }


@router.get("/ref/ifc-performance-standards", summary="IFC Performance Standards PS1-PS8 checklist")
def ref_ifc_performance_standards():
    """
    Return IFC Performance Standards (2012 edition) reference data for PS1-PS8:
    - PS1: Assessment and Management of E&S Risks
    - PS2: Labor and Working Conditions
    - PS3: Resource Efficiency and Pollution Prevention
    - PS4: Community Health, Safety, and Security
    - PS5: Land Acquisition and Involuntary Resettlement
    - PS6: Biodiversity Conservation
    - PS7: Indigenous Peoples
    - PS8: Cultural Heritage

    Each PS includes key requirements, trigger conditions, disclosure requirements,
    and monitoring KPIs.
    """
    return {
        "count": len(IFC_PERFORMANCE_STANDARDS),
        "standards": IFC_PERFORMANCE_STANDARDS,
        "equator_principles": EQUATOR_PRINCIPLES,
        "designated_country_note": (
            "For projects in OECD/EU/EEA Designated Countries, host country laws apply. "
            "For non-Designated Countries, IFC PS and EHS Guidelines apply per EP3."
        ),
        "ep_applicability_threshold_usd": 10_000_000,
    }


@router.get("/ref/fossil-fuel-exclusions", summary="ECA fossil fuel exclusion matrix")
def ref_fossil_fuel_exclusions():
    """
    Return the ECA fossil fuel exclusion matrix covering 6 fossil fuel types:
    coal_mining, coal_power, oil_sands, upstream_oil_gas,
    lng_infrastructure, petrochemicals.

    For each type: per-ECA restriction status (excluded_YYYY / eligible /
    transitional / under_review), EU taxonomy eligibility, Paris alignment
    assessment, and OECD Arrangement eligibility.
    """
    summary = {}
    for ff_key, ff_data in FOSSIL_FUEL_EXCLUSION_MATRIX.items():
        eca_restrictions = ff_data.get("eca_restrictions", {})
        excluded_ecas = [k for k, v in eca_restrictions.items() if v.startswith("excluded")]
        eligible_ecas = [k for k, v in eca_restrictions.items() if v == "eligible"]
        summary[ff_key] = {
            "description": ff_data.get("description", ""),
            "eu_taxonomy_eligible": ff_data.get("eu_taxonomy_eligible", False),
            "paris_aligned": ff_data.get("paris_aligned", False),
            "oecd_arrangement_eligible": ff_data.get("oecd_arrangement_eligible", False),
            "eca_restrictions": eca_restrictions,
            "ecas_with_exclusion": excluded_ecas,
            "ecas_still_eligible": eligible_ecas,
            "exclusion_rate_pct": round(len(excluded_ecas) / len(eca_restrictions) * 100, 1) if eca_restrictions else 0,
        }
    return {
        "fossil_fuel_types": list(summary.keys()),
        "exclusion_matrix": summary,
        "notes": {
            "excluded_YYYY": "ECA excluded this commodity from year YYYY",
            "eligible": "ECA still provides cover for this commodity",
            "transitional": "ECA permits under transitional/energy security justification",
            "under_review": "ECA policy under active review",
            "eligible_case_by_case": "ECA applies case-by-case enhanced ESG due diligence",
        },
    }
