"""
EBA Pillar 3 ESG Disclosures Engine — E20
EBA GL/2022/03 + CRR Art 449a
10 Templates: T1 Physical Risk, T2 Non-Financial, T3 Carbon-Related Assets,
              T4-T6 Alignment metrics, T7 Financed Emissions, T8-T10 KPIs
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any
import math


# ---------------------------------------------------------------------------
# Reference data
# ---------------------------------------------------------------------------

INSTITUTION_TYPES = {
    "G-SII": {"min_assets_bn": 300, "mandatory_templates": list(range(1, 11))},
    "O-SII": {"min_assets_bn": 30,  "mandatory_templates": list(range(1, 9))},
    "Other": {"min_assets_bn": 0,   "mandatory_templates": [1, 3, 7]},
}

TEMPLATES = {
    "T1":  {"name": "Physical Climate Risk Heatmap",       "mandatory": True,  "effective": "Jun-2022"},
    "T2":  {"name": "Non-Financial KPIs",                  "mandatory": True,  "effective": "Jun-2022"},
    "T3":  {"name": "Carbon-Related Assets",               "mandatory": True,  "effective": "Jun-2022"},
    "T4":  {"name": "Climate Risk Exposure",               "mandatory": True,  "effective": "Jun-2022"},
    "T5":  {"name": "Mitigation Actions",                  "mandatory": True,  "effective": "Jun-2022"},
    "T6":  {"name": "Green Asset Ratio (GAR)",             "mandatory": True,  "effective": "Jun-2022"},
    "T7":  {"name": "Financed Emissions",                  "mandatory": True,  "effective": "Jun-2023"},
    "T8":  {"name": "Scope 1/2 Taxonomy-Eligible Assets",  "mandatory": True,  "effective": "Jun-2023"},
    "T9":  {"name": "Banking Book BTAR",                   "mandatory": False, "effective": "Jun-2024"},
    "T10": {"name": "Taxonomy KPIs",                       "mandatory": False, "effective": "Jun-2024"},
}

NACE_SECTORS = [
    "A01", "B05", "C10", "C20", "C24", "C25", "D35",
    "E36", "F41", "G45", "H49", "I55", "J58", "K64", "L68",
]

CLIMATE_HAZARDS = [
    "heat_stress", "cold_wave", "drought", "wildfire",
    "coastal_flood", "riverine_flood", "wind_storm", "sea_level_rise",
]


# ---------------------------------------------------------------------------
# Dataclasses
# ---------------------------------------------------------------------------

@dataclass
class PhysicalRiskHeatmap:
    """T1 — NACE sector × climate hazard exposure matrix."""
    sector_hazard_matrix: dict[str, dict[str, float]] = field(default_factory=dict)
    high_risk_sectors: list[str] = field(default_factory=list)
    portfolio_physical_risk_score: float = 0.0
    exposure_bn: dict[str, float] = field(default_factory=dict)


@dataclass
class FinancedEmissions:
    """T7 — Scope 1/2/3 financed emissions per sector."""
    total_tco2e: float = 0.0
    intensity_tco2e_per_mn_eur: float = 0.0
    by_sector: dict[str, float] = field(default_factory=dict)
    pcaf_dqs_weighted: float = 0.0
    year_on_year_change_pct: float = 0.0


@dataclass
class TaxonomyKPIs:
    """T10 — GAR / BTAR / taxonomy-aligned."""
    gar_pct: float = 0.0
    btar_pct: float = 0.0
    taxonomy_aligned_total_bn: float = 0.0
    by_objective: dict[str, float] = field(default_factory=dict)


@dataclass
class EBAPillar3Assessment:
    assessment_id: str = ""
    entity_id: str = ""
    entity_name: str = ""
    institution_type: str = "Other"
    total_assets_bn: float = 0.0
    templates_completed: list[str] = field(default_factory=list)
    compliance_score: float = 0.0
    missing_mandatory: list[str] = field(default_factory=list)
    template_scores: dict[str, float] = field(default_factory=dict)
    next_disclosure_date: str = ""
    financed_emissions: FinancedEmissions = field(default_factory=FinancedEmissions)
    carbon_related_assets_pct: float = 0.0
    taxonomy_aligned_pct: float = 0.0
    physical_risk_heatmap: PhysicalRiskHeatmap = field(default_factory=PhysicalRiskHeatmap)
    taxonomy_kpis: TaxonomyKPIs = field(default_factory=TaxonomyKPIs)
    financed_emissions_by_sector: dict[str, float] = field(default_factory=dict)
    warnings: list[str] = field(default_factory=list)
    recommendations: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------

class EBAPillar3Engine:
    """EBA GL/2022/03 Pillar 3 ESG disclosure assessment."""

    def assess(
        self,
        entity_id: str,
        entity_name: str,
        institution_type: str,
        total_assets_bn: float,
        templates_submitted: list[str],
        portfolio_data: dict[str, Any] | None = None,
    ) -> EBAPillar3Assessment:
        # These are BINDING regulatory disclosures — every figure must come from real
        # portfolio data, never a random draw. When an input is absent we emit an honest
        # null + an "insufficient_data" warning rather than fabricating a plausible number.
        pdata = portfolio_data or {}
        result = EBAPillar3Assessment(
            assessment_id=f"EBA-P3-{entity_id[:8].upper()}-2024",
            entity_id=entity_id,
            entity_name=entity_name,
            institution_type=institution_type,
            total_assets_bn=total_assets_bn,
            templates_completed=templates_submitted,
        )

        # Determine mandatory templates
        inst = INSTITUTION_TYPES.get(institution_type, INSTITUTION_TYPES["Other"])
        mandatory = [f"T{n}" for n in inst["mandatory_templates"]]

        # Compliance scoring (real: set arithmetic)
        missing = [t for t in mandatory if t not in templates_submitted]
        result.missing_mandatory = missing
        completed_mandatory = len(mandatory) - len(missing)
        result.compliance_score = round((completed_mandatory / max(len(mandatory), 1)) * 100, 1)

        # Per-template scores: caller-supplied real completeness if present, else presence-based
        # (submitted -> 100.0; payload-level scoring would need the template contents). No randomness.
        supplied_scores = pdata.get("template_scores") or {}
        for t in TEMPLATES:
            if t in supplied_scores:
                result.template_scores[t] = round(float(supplied_scores[t]), 1)
            elif t in templates_submitted:
                result.template_scores[t] = 100.0
            elif t in mandatory:
                result.template_scores[t] = 0.0

        # Physical risk heatmap (T1) — from real per-sector hazard scores + exposures
        hazard_scores = pdata.get("hazard_scores") or {}
        nace_exposure = pdata.get("nace_exposure") or {}
        heatmap = PhysicalRiskHeatmap()
        if hazard_scores:
            for sector, hz in hazard_scores.items():
                heatmap.sector_hazard_matrix[sector] = {h: round(float(hz.get(h, 0.0)), 3) for h in CLIMATE_HAZARDS}
                if sector in nace_exposure:
                    heatmap.exposure_bn[sector] = round(float(nace_exposure[sector]), 2)
            heatmap.high_risk_sectors = [
                s for s, v in heatmap.sector_hazard_matrix.items()
                if v and sum(v.values()) / len(v) > 0.6
            ]
            if heatmap.sector_hazard_matrix:
                heatmap.portfolio_physical_risk_score = round(
                    sum(sum(v.values()) / len(v) for v in heatmap.sector_hazard_matrix.values())
                    / len(heatmap.sector_hazard_matrix) * 10, 2
                )
            else:
                heatmap.portfolio_physical_risk_score = None
        else:
            heatmap.portfolio_physical_risk_score = None
            result.warnings.append("insufficient_data: T1 physical hazard scores not provided")
        result.physical_risk_heatmap = heatmap

        # Financed emissions (T7) — PCAF: Σ exposure × sector emission factor, else null
        fe = FinancedEmissions()
        fe_by_sector = pdata.get("financed_emissions_by_sector") or {}
        efs = pdata.get("sector_emission_factors") or {}
        if not fe_by_sector and nace_exposure and efs:
            fe_by_sector = {s: round(float(nace_exposure[s]) * 1_000 * float(efs[s]), 0)
                            for s in nace_exposure if s in efs}
        if fe_by_sector:
            fe.by_sector = {s: round(float(v), 0) for s, v in fe_by_sector.items()}
            fe.total_tco2e = round(sum(fe.by_sector.values()), 0)
            fe.intensity_tco2e_per_mn_eur = round(fe.total_tco2e / max(total_assets_bn * 1_000, 1), 2)
            prior = pdata.get("prior_year_tco2e")
            fe.year_on_year_change_pct = (
                round((fe.total_tco2e - float(prior)) / float(prior) * 100, 1)
                if prior else None
            )
            dqs = pdata.get("pcaf_dqs_weighted")
            fe.pcaf_dqs_weighted = round(float(dqs), 2) if dqs is not None else None
        else:
            fe.total_tco2e = None
            fe.intensity_tco2e_per_mn_eur = None
            fe.pcaf_dqs_weighted = None
            fe.year_on_year_change_pct = None
            result.warnings.append("insufficient_data: T7 financed emissions require exposures + emission factors")
        result.financed_emissions = fe
        result.financed_emissions_by_sector = fe.by_sector

        # Carbon-related assets (T3)
        crv = pdata.get("carbon_related_assets_pct")
        result.carbon_related_assets_pct = round(float(crv), 1) if crv is not None else None

        # Taxonomy (T6/T10) — GAR/BTAR from real aligned assets, else null
        tkpis = TaxonomyKPIs()
        gar = pdata.get("gar_pct")
        if gar is not None:
            tkpis.gar_pct = round(float(gar), 1)
            tkpis.taxonomy_aligned_total_bn = round(total_assets_bn * tkpis.gar_pct / 100, 2)
        else:
            tkpis.gar_pct = None
            tkpis.taxonomy_aligned_total_bn = None
            result.warnings.append("insufficient_data: T10 Green Asset Ratio not provided")
        btar = pdata.get("btar_pct")
        tkpis.btar_pct = round(float(btar), 1) if btar is not None else None
        tobj = pdata.get("taxonomy_by_objective")
        if tobj:
            tkpis.by_objective = {k: round(float(v), 1) for k, v in tobj.items()}
        result.taxonomy_kpis = tkpis
        tap = pdata.get("taxonomy_aligned_pct")
        result.taxonomy_aligned_pct = (
            round(float(tap), 1) if tap is not None
            else (tkpis.gar_pct if gar is not None else None)
        )

        result.next_disclosure_date = "2025-06-30"

        # Warnings & recommendations (guard the honest nulls)
        if missing:
            result.warnings.append(f"Missing mandatory templates: {', '.join(missing)}")
        if result.compliance_score < 80:
            result.recommendations.append("Prioritise completion of mandatory EBA templates before next reporting cycle")
        if fe.intensity_tco2e_per_mn_eur is not None and fe.intensity_tco2e_per_mn_eur > 2_000:
            result.recommendations.append("Financed emissions intensity exceeds sector peer median — review decarbonisation pathway")
        if result.carbon_related_assets_pct is not None and result.carbon_related_assets_pct > 20:
            result.recommendations.append("Carbon-related assets > 20% — consider climate scenario stress-test for T4")

        return result

    def score_template_completeness(
        self, templates_submitted: list[str], institution_type: str = "G-SII"
    ) -> dict[str, Any]:
        inst = INSTITUTION_TYPES.get(institution_type, INSTITUTION_TYPES["Other"])
        mandatory = [f"T{n}" for n in inst["mandatory_templates"]]
        present = [t for t in mandatory if t in templates_submitted]
        missing = [t for t in mandatory if t not in templates_submitted]
        return {
            "mandatory_count": len(mandatory),
            "completed_count": len(present),
            "missing": missing,
            "completeness_pct": round(len(present) / max(len(mandatory), 1) * 100, 1),
            "template_detail": {
                t: {"name": TEMPLATES[t]["name"], "status": "submitted" if t in templates_submitted else "missing"}
                for t in TEMPLATES
            },
        }

    def generate_physical_risk_heatmap(
        self, entity_id: str, portfolio_nace_exposure: dict[str, float],
        hazard_scores: dict[str, dict[str, float]] | None = None,
    ) -> PhysicalRiskHeatmap:
        # Hazard scores must come from a real source (e.g. WRI Aqueduct / ND-GAIN per
        # NACE×hazard); exposures are real. The hazard axis is never fabricated — a sector
        # with no supplied hazard data is left out of the matrix (its exposure still shown).
        hazard_scores = hazard_scores or {}
        heatmap = PhysicalRiskHeatmap()
        for sector, exposure in portfolio_nace_exposure.items():
            heatmap.exposure_bn[sector] = exposure
            if sector in hazard_scores:
                hz = hazard_scores[sector]
                heatmap.sector_hazard_matrix[sector] = {h: round(float(hz.get(h, 0.0)), 3) for h in CLIMATE_HAZARDS}
        heatmap.high_risk_sectors = [
            s for s, v in heatmap.sector_hazard_matrix.items()
            if v and sum(v.values()) / len(v) > 0.55
        ]
        heatmap.portfolio_physical_risk_score = (
            round(sum(sum(v.values()) / len(v) for v in heatmap.sector_hazard_matrix.values())
                  / len(heatmap.sector_hazard_matrix) * 10, 2)
            if heatmap.sector_hazard_matrix else None
        )
        return heatmap

    def ref_templates(self) -> dict[str, Any]:
        return TEMPLATES

    def ref_institution_types(self) -> dict[str, Any]:
        return INSTITUTION_TYPES

    def ref_nace_sectors(self) -> list[str]:
        return NACE_SECTORS

    def ref_climate_hazards(self) -> list[str]:
        return CLIMATE_HAZARDS


_engine = EBAPillar3Engine()


def get_engine() -> EBAPillar3Engine:
    return _engine
