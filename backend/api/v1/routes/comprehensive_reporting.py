"""
API Routes: Comprehensive Reporting Aggregator Engine (E119)
============================================================
POST /api/v1/comprehensive-reporting/compile            — Full multi-framework report compilation
POST /api/v1/comprehensive-reporting/esrs-report        — CSRD ESRS report generation
POST /api/v1/comprehensive-reporting/xbrl-tag           — XBRL tagging for quantitative DPs
POST /api/v1/comprehensive-reporting/consistency-check  — Cross-framework consistency validation (20 rules)
POST /api/v1/comprehensive-reporting/readiness-score    — Reporting readiness assessment
GET  /api/v1/comprehensive-reporting/ref/framework-mapping   — 200+ cross-framework DP mappings
GET  /api/v1/comprehensive-reporting/ref/esrs-checklist      — ESRS IG3 quantitative DPs
GET  /api/v1/comprehensive-reporting/ref/xbrl-concepts       — ESRS XBRL taxonomy concepts (top 50)
GET  /api/v1/comprehensive-reporting/ref/consistency-rules   — 20 cross-framework consistency rules
"""
from __future__ import annotations

import dataclasses
from fastapi import APIRouter, Query
from pydantic import BaseModel, Field
from typing import Optional

from services.comprehensive_reporting_engine import (
    ComprehensiveReportingEngine,
    CROSS_FRAMEWORK_MAPPINGS,
    ESRS_IG3_CHECKLIST,
    ESRS_XBRL_CONCEPTS,
    CONSISTENCY_RULES,
    IFRS_S1_S2_CHECKLIST,
    CSRD_WAVES,
)

router = APIRouter(prefix="/api/v1/comprehensive-reporting", tags=["ComprehensiveReporting"])


# ---------------------------------------------------------------------------
# Request Models
# ---------------------------------------------------------------------------

class CompileReportRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    entity_id: str = Field(..., description="Unique entity identifier (LEI, internal ID, or company name)")
    frameworks: list[str] = Field(
        default=["CSRD", "IFRS_S2", "TCFD"],
        description="Frameworks to compile: CSRD | IFRS_S1 | IFRS_S2 | TCFD | TNFD | GRI | SFDR",
    )
    engine_outputs: dict = Field(
        default_factory=dict,
        description="Dict of dp_id → value pairs from upstream E1-E118 engines (e.g. {'E1-6_s1': 12500.0, 'E1-5_ren_src': 45000.0})",
    )
    reporting_year: int = Field(2024, ge=2020, le=2035, description="Reporting period year")


class ESRSReportRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    entity_id: str
    engine_outputs: dict = Field(
        default_factory=dict,
        description="Dict of ESRS DP IDs → values from upstream engines",
    )
    wave: str = Field(
        "wave_1",
        description="CSRD wave: wave_1 (2024, large PIEs) | wave_2 (2025) | wave_3 (2026 SMEs) | wave_4 (2028 non-EU)",
    )
    reporting_year: int = Field(2024, ge=2020, le=2035)


class XBRLTagRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    entity_id: str
    quantitative_dps: dict = Field(
        ...,
        description="Dict of ESRS DP IDs → numeric values to be tagged in XBRL (e.g. {'E1-6_s1': 12500.0})",
    )
    reporting_year: int = Field(2024, ge=2020, le=2035)


class ConsistencyCheckRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    entity_id: str
    multi_framework_data: dict = Field(
        ...,
        description="Dict of DP IDs → values collected from all framework disclosures for consistency validation",
    )


class ReadinessScoreRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    entity_id: str
    frameworks: list[str] = Field(
        default=["CSRD", "IFRS_S2", "TCFD", "GRI"],
        description="Frameworks to assess readiness for",
    )
    engine_outputs: dict = Field(
        default_factory=dict,
        description="Currently available DP values — missing DPs drive gap analysis",
    )
    wave: str = Field("wave_1", description="CSRD wave for phase-in relief determination")


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _dc(obj) -> dict:
    if dataclasses.is_dataclass(obj):
        return dataclasses.asdict(obj)
    return obj


# ---------------------------------------------------------------------------
# POST Endpoints
# ---------------------------------------------------------------------------

@router.post("/compile")
def compile_report(req: CompileReportRequest):
    """
    Compile a full multi-framework sustainability report.

    Aggregates disclosures across selected frameworks (CSRD ESRS, IFRS S1/S2, TCFD,
    TNFD, GRI, SFDR), scores completeness per framework, runs all 20 cross-framework
    consistency rules, identifies blocking vs advisory gaps, and returns assurance
    readiness score and ESAP eligibility flag.
    """
    engine = ComprehensiveReportingEngine()
    result = engine.compile_report(
        entity_id=req.entity_id,
        frameworks=req.frameworks,
        engine_outputs=req.engine_outputs,
        reporting_year=req.reporting_year,
    )
    return _dc(result)


@router.post("/esrs-report")
def generate_esrs_report(req: ESRSReportRequest):
    """
    Generate a full CSRD ESRS disclosure report.

    Evaluates the 330 ESRS IG3 quantitative mandatory datapoints against provided
    engine outputs. Returns per-topic completeness, phase-in DP status (wave-specific),
    weighted gap analysis, assurance readiness tier, and top priority actions.
    """
    engine = ComprehensiveReportingEngine()
    result = engine.generate_esrs_report(
        entity_id=req.entity_id,
        engine_outputs=req.engine_outputs,
        wave=req.wave,
        reporting_year=req.reporting_year,
    )
    return _dc(result)


@router.post("/xbrl-tag")
def generate_xbrl_tagging(req: XBRLTagRequest):
    """
    Generate an XBRL instance document for ESRS quantitative datapoints.

    Maps provided DP IDs to EFRAG ESRS XBRL Taxonomy 2024 concepts. Returns a
    structured instance document (as dict), tagged fact count, validation warnings
    (type mismatches, null values), and list of untaggable DPs not in the taxonomy.
    """
    engine = ComprehensiveReportingEngine()
    result = engine.generate_xbrl_tagging(
        entity_id=req.entity_id,
        quantitative_dps=req.quantitative_dps,
    )
    r = _dc(result)
    r["reporting_year"] = req.reporting_year
    return r


@router.post("/consistency-check")
def check_cross_framework_consistency(req: ConsistencyCheckRequest):
    """
    Run 20 cross-framework consistency validation rules.

    Checks that the same underlying metric (e.g. Scope 1 GHG, gender pay gap,
    water withdrawal) is consistent across CSRD, IFRS S2, TCFD, TNFD, GRI, and SFDR
    disclosures within defined tolerance bands. Returns consistency score, blocking
    failures with remediation guidance, and advisory warnings.
    """
    engine = ComprehensiveReportingEngine()
    result = engine.check_cross_framework_consistency(
        entity_id=req.entity_id,
        multi_framework_data=req.multi_framework_data,
    )
    return _dc(result)


@router.post("/readiness-score")
def calculate_readiness_score(req: ReadinessScoreRequest):
    """
    Calculate reporting readiness score across selected frameworks.

    Returns overall readiness % (0-100), readiness tier (ready / nearly_ready /
    requires_remediation / not_ready), per-framework scores, blocking gaps vs advisory
    gaps, wave-specific CSRD readiness, top 10 priority actions, and estimated weeks
    to achieve >90% readiness.
    """
    engine = ComprehensiveReportingEngine()
    result = engine.calculate_readiness_score(
        entity_id=req.entity_id,
        frameworks=req.frameworks,
        engine_outputs=req.engine_outputs,
        wave=req.wave,
    )
    return _dc(result)


# ---------------------------------------------------------------------------
# GET Reference Endpoints
# ---------------------------------------------------------------------------

@router.get("/ref/framework-mapping")
def get_framework_mapping(
    framework: Optional[str] = Query(None, description="Filter by framework: CSRD | IFRS_S2 | TCFD | TNFD | GRI | SFDR"),
    mandatory_only: bool = Query(False, description="Return only mandatory DPs"),
    source_engine: Optional[str] = Query(None, description="Filter by source engine (e.g. 'E13_TCFD', 'E21_Scope3')"),
):
    """
    Return 200+ cross-framework data point mappings.

    Each entry maps a DP across CSRD ESRS ↔ IFRS S1/S2 ↔ TCFD ↔ TNFD ↔ GRI 2021 ↔
    SFDR RTS Annex III, with disclosure type (quantitative/qualitative), mandatory flag,
    source engine reference, and data type (metric/narrative/table).

    Use `framework` query param to filter to a specific framework's DPs.
    """
    mappings = CROSS_FRAMEWORK_MAPPINGS

    if framework:
        fw_field_map = {
            "CSRD": "esrs_ref", "IFRS_S2": "ifrs_s2_ref", "TCFD": "tcfd_ref",
            "TNFD": "tnfd_ref", "GRI": "gri_ref", "SFDR": "sfdr_ref",
        }
        fw_field = fw_field_map.get(framework.upper())
        if fw_field:
            mappings = [m for m in mappings if m.get(fw_field)]

    if mandatory_only:
        mappings = [m for m in mappings if m.get("mandatory")]

    if source_engine:
        mappings = [m for m in mappings if source_engine.lower() in m.get("source_engine", "").lower()]

    source_engines = sorted({m["source_engine"] for m in mappings})
    frameworks_covered = [
        fw for fw in ["CSRD", "IFRS_S2", "TCFD", "TNFD", "GRI", "SFDR"]
        if any(m.get({"CSRD": "esrs_ref", "IFRS_S2": "ifrs_s2_ref", "TCFD": "tcfd_ref",
                       "TNFD": "tnfd_ref", "GRI": "gri_ref", "SFDR": "sfdr_ref"}[fw])
               for m in mappings)
    ]

    return {
        "source": "CSRD Delegated Regulation (EU) 2023/2772 + IFRS S1/S2 + TCFD 2021 + TNFD v1.0 + GRI 2021 + SFDR RTS 2022/1288",
        "total_dp_mappings": len(mappings),
        "mandatory_dps": sum(1 for m in mappings if m.get("mandatory")),
        "frameworks_covered": frameworks_covered,
        "source_engines_referenced": source_engines,
        "filter_applied": {"framework": framework, "mandatory_only": mandatory_only, "source_engine": source_engine},
        "mappings": mappings,
    }


@router.get("/ref/esrs-checklist")
def get_esrs_checklist(
    standard: Optional[str] = Query(None, description="Filter by ESRS standard: E1 | E2 | E3 | E4 | E5 | S1 | G1 | EU_TAX"),
    mandatory_only: bool = Query(False, description="Return only mandatory DPs (excluding voluntary)"),
    phase_in_filter: Optional[str] = Query(None, description="Filter: 'none' = no phase-in relief | '2025' = first-year relief available"),
):
    """
    Return the ESRS IG3 quantitative mandatory datapoint checklist.

    Covers 330 quantitative DPs from EFRAG Implementation Guidance 3, spanning
    ESRS E1 (climate), E2 (pollution), E3 (water), E4 (biodiversity), E5 (circular),
    S1 (workforce), G1 (governance), and EU Taxonomy Article 8 KPIs.

    Each DP includes: standard, description, mandatory flag, phase-in year relief
    (wave-specific), and topic materiality weight.
    """
    checklist = ESRS_IG3_CHECKLIST

    if standard:
        checklist = [dp for dp in checklist if dp["standard"] == standard.upper()]
    if mandatory_only:
        checklist = [dp for dp in checklist if dp["mandatory"]]
    if phase_in_filter == "none":
        checklist = [dp for dp in checklist if dp["phase_in"] is None]
    elif phase_in_filter:
        checklist = [dp for dp in checklist if dp["phase_in"] == phase_in_filter]

    standards_summary = {}
    for dp in checklist:
        std = dp["standard"]
        if std not in standards_summary:
            standards_summary[std] = {"total": 0, "mandatory": 0, "phase_in_relief": 0}
        standards_summary[std]["total"] += 1
        if dp["mandatory"]:
            standards_summary[std]["mandatory"] += 1
        if dp["phase_in"]:
            standards_summary[std]["phase_in_relief"] += 1

    return {
        "source": "EFRAG IG3 — Quantitative Mandatory Datapoints (2024); CSRD Delegated Regulation (EU) 2023/2772",
        "total_dps_in_checklist": len(checklist),
        "mandatory_dps": sum(1 for dp in checklist if dp["mandatory"]),
        "phase_in_relief_dps": sum(1 for dp in checklist if dp.get("phase_in")),
        "standards_summary": standards_summary,
        "csrd_waves": CSRD_WAVES,
        "checklist": checklist,
    }


@router.get("/ref/xbrl-concepts")
def get_xbrl_concepts(
    standard: Optional[str] = Query(None, description="Filter by ESRS standard prefix in DP ID (e.g. 'E1', 'S1', 'G1')"),
    period_type: Optional[str] = Query(None, description="Filter by XBRL period type: duration | instant"),
):
    """
    Return ESRS XBRL taxonomy concepts (EFRAG ESRS-XBRL-2024-01-01) for the top 50 quantitative DPs.

    Each entry includes: XBRL concept name (esrs: prefix), mapped DP ID, xbrli data type,
    period type (duration/instant), measurement unit, and balance type.
    """
    concepts = ESRS_XBRL_CONCEPTS

    if standard:
        concepts = [c for c in concepts if c["dp_id"].upper().startswith(standard.upper())]
    if period_type:
        concepts = [c for c in concepts if c["period_type"] == period_type]

    data_type_counts = {}
    for c in concepts:
        dt = c["data_type"]
        data_type_counts[dt] = data_type_counts.get(dt, 0) + 1

    return {
        "taxonomy_version": "ESRS-XBRL-2024-01-01",
        "taxonomy_ref": "https://xbrl.efrag.org/taxonomy/ESRS-XBRL-2024-01-01/esrs-all.xsd",
        "source": "EFRAG ESRS XBRL Taxonomy (published 2024-01-01); ESAP Regulation (EU) 2023/2869",
        "esap_mandate": "Large companies must submit iXBRL-tagged ESRS reports from 2026 (first CSRD wave filings)",
        "concept_count": len(concepts),
        "data_type_distribution": data_type_counts,
        "filter_applied": {"standard": standard, "period_type": period_type},
        "concepts": concepts,
    }


@router.get("/ref/consistency-rules")
def get_consistency_rules(
    severity: Optional[str] = Query(None, description="Filter by severity: blocking | advisory"),
    framework: Optional[str] = Query(None, description="Filter rules involving a specific framework"),
):
    """
    Return the 20 cross-framework consistency validation rules.

    Each rule defines: the DPs involved across frameworks, the numeric tolerance
    band (%), severity (blocking = fails assurance / advisory = flagged for review),
    and remediation guidance.

    Blocking rules are those where inconsistency would constitute a material
    misstatement under ISAE 3000 / ISSA 5000.
    """
    rules = CONSISTENCY_RULES

    if severity:
        rules = [r for r in rules if r["severity"] == severity.lower()]
    if framework:
        rules = [r for r in rules if framework.upper() in [fw.upper() for fw in r["frameworks"]]]

    return {
        "source": "EFRAG IG Consistency Guidance; ISAE 3000 / ISSA 5000 assurance standards; CSRD Art 26a",
        "total_rules": len(rules),
        "blocking_rules": sum(1 for r in rules if r["severity"] == "blocking"),
        "advisory_rules": sum(1 for r in rules if r["severity"] == "advisory"),
        "frameworks_covered": ["CSRD", "IFRS_S2", "TCFD", "TNFD", "GRI", "SFDR", "PCAF", "EU_TAXONOMY"],
        "filter_applied": {"severity": severity, "framework": framework},
        "ifrs_s1_s2_checklist_count": len(IFRS_S1_S2_CHECKLIST),
        "rules": rules,
    }
