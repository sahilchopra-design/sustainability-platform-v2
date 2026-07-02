"""
CSRD Double Materiality Assessment (DMA) Engine
================================================
ESRS 1 Sections 42-49 — Double materiality methodology.

Models both dimensions of materiality:
- Impact materiality (inside-out): company's impacts on people and environment
- Financial materiality (outside-in): sustainability matters that generate
  financial risks and opportunities for the company

Cross-framework linkage:
- TCFD (materiality basis for climate risks)
- GRI 3 (material topics process)
- ISSB S1 (significance vs materiality thresholds)
- EU Taxonomy (environmental material topics)
- OECD Guidelines (due diligence for adverse impacts)
"""
from __future__ import annotations

import math
from datetime import datetime
from typing import Optional

# ---------------------------------------------------------------------------
# Reference Data
# ---------------------------------------------------------------------------

ESRS_TOPICS = {
    "E1": {
        "name": "Climate Change",
        "standard": "ESRS E1",
        "sub_topics": ["climate_adaptation", "climate_mitigation", "energy"],
    },
    "E2": {
        "name": "Pollution",
        "standard": "ESRS E2",
        "sub_topics": ["air_pollution", "water_pollution", "soil_pollution", "microplastics"],
    },
    "E3": {
        "name": "Water and Marine",
        "standard": "ESRS E3",
        "sub_topics": ["water_consumption", "water_withdrawal", "marine_ecosystems"],
    },
    "E4": {
        "name": "Biodiversity",
        "standard": "ESRS E4",
        "sub_topics": ["land_use_change", "species_loss", "ecosystem_degradation"],
    },
    "E5": {
        "name": "Circular Economy",
        "standard": "ESRS E5",
        "sub_topics": ["resource_inflows", "resource_outflows", "waste"],
    },
    "S1": {
        "name": "Own Workforce",
        "standard": "ESRS S1",
        "sub_topics": ["working_conditions", "equal_treatment", "other_work_rights"],
    },
    "S2": {
        "name": "Workers in Value Chain",
        "standard": "ESRS S2",
        "sub_topics": ["working_conditions_vc", "human_rights_vc"],
    },
    "S3": {
        "name": "Affected Communities",
        "standard": "ESRS S3",
        "sub_topics": ["community_economic_impacts", "civil_political_rights", "cultural_rights"],
    },
    "S4": {
        "name": "Consumers and End-users",
        "standard": "ESRS S4",
        "sub_topics": ["information_impacts", "personal_safety", "social_inclusion"],
    },
    "G1": {
        "name": "Business Conduct",
        "standard": "ESRS G1",
        "sub_topics": ["corporate_culture", "whistleblower", "corruption_bribery", "supplier_relations"],
    },
}

# ESRS 1 section 43 — Severity criteria for negative impacts
SEVERITY_CRITERIA = {
    "scale": {
        "weight": 0.35,
        "description": "Breadth of impact — how many affected",
    },
    "scope": {
        "weight": 0.35,
        "description": "Depth of impact — how seriously affected",
    },
    "irremediability": {
        "weight": 0.30,
        "description": "Ease of remediation — irreversibility",
    },
}

# ESRS 1 section 47 — Financial materiality risk types
FINANCIAL_RISK_TYPES = {
    "physical_risk": "Chronic or acute physical climate risk affecting asset value or operations",
    "transition_risk": "Policy, regulatory, technology or market shift risk",
    "systemic_risk": "Broader systemic risks (biodiversity loss, social instability)",
    "legal_risk": "Litigation, liability, enforcement risk",
    "reputational_risk": "Stakeholder perception and brand value risk",
}

# Stakeholder types for engagement
STAKEHOLDER_TYPES = {
    "employees":         {"salience_weight": 0.20},
    "investors":         {"salience_weight": 0.20},
    "customers":         {"salience_weight": 0.15},
    "suppliers":         {"salience_weight": 0.10},
    "local_communities": {"salience_weight": 0.10},
    "ngos":              {"salience_weight": 0.10},
    "regulators":        {"salience_weight": 0.10},
    "media":             {"salience_weight": 0.05},
}

# NACE sector materiality profiles — typical material topics per sector
SECTOR_MATERIALITY = {
    "financial_services": ["E1", "S1", "G1", "S2"],
    "energy":             ["E1", "E2", "E3", "S1", "G1"],
    "manufacturing":      ["E1", "E2", "E5", "S1", "S2", "G1"],
    "real_estate":        ["E1", "E3", "E4", "S1", "S3"],
    "agriculture":        ["E1", "E2", "E3", "E4", "S2", "S3"],
    "technology":         ["E1", "S1", "S4", "G1"],
    "retail":             ["E1", "E5", "S1", "S2", "S4"],
    "healthcare":         ["E1", "S1", "S4", "G1"],
    "transport":          ["E1", "E2", "S1", "S3"],
    "mining":             ["E1", "E2", "E3", "E4", "S1", "S2", "S3", "G1"],
}

# Impact type taxonomy
IMPACT_TYPES = ["actual_negative", "potential_negative", "actual_positive", "potential_positive"]

# Value chain locations
VALUE_CHAIN_LOCATIONS = ["own_operations", "upstream", "downstream", "all"]

# DMA process steps
DMA_PROCESS_STEPS = [
    "context_setting",
    "impact_identification",
    "impact_assessment",
    "topic_prioritisation",
]

# Cross-framework mapping
CROSS_FRAMEWORK_MAP = {
    "TCFD": "DMA climate topics align with TCFD Governance, Strategy, Risk Management, Metrics pillars",
    "GRI_3": "GRI 3 material topics process requires stakeholder engagement and impact assessment",
    "ISSB_S1": "ISSB S1 uses significance threshold (investor focus) vs ESRS double materiality",
    "EU_Taxonomy": "Material E topics feed into EU Taxonomy substantial contribution assessment",
    "OECD_Guidelines": "OECD Guidelines Ch II-VI inform adverse impact identification (ESRS 1 section 43)",
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _opt_float(value) -> Optional[float]:
    """Coerce a supplied value to float, returning None when absent/invalid.

    Used so that a missing assessment input yields an honest null rather than
    a fabricated number.
    """
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _round_opt(value: Optional[float], ndigits: int = 2) -> Optional[float]:
    """Round a float, passing None through unchanged."""
    return None if value is None else round(value, ndigits)


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------


class CSRDDMAEngine:
    """CSRD Double Materiality Assessment engine per ESRS 1 sections 42-49."""

    IMPACT_MATERIALITY_THRESHOLD = 40.0
    FINANCIAL_MATERIALITY_THRESHOLD = 40.0

    # -----------------------------------------------------------------------
    # 1. Impact Materiality Assessment
    # -----------------------------------------------------------------------

    def assess_impact_materiality(
        self,
        entity_id: str,
        sector: str,
        topic_id: str,
        impact_data: dict,
    ) -> dict:
        """
        Score impact materiality per ESRS 1 section 43.

        Severity = weighted average of scale, scope, irremediability (0-100 each).
        Positive impacts use likelihood x magnitude instead of severity.

        Scores must be supplied in ``impact_data`` (scale_score, scope_score,
        irremediability_score, likelihood_pct, and for positive impacts
        magnitude_score). When the inputs needed for a score are absent the
        derived metric is returned as ``None`` rather than a fabricated value —
        materiality is a binding disclosure and must not be invented.
        """
        scale_score = _opt_float(impact_data.get("scale_score"))
        scope_score = _opt_float(impact_data.get("scope_score"))
        irremediability_score = _opt_float(impact_data.get("irremediability_score"))
        likelihood_pct = _opt_float(impact_data.get("likelihood_pct"))
        impact_type = impact_data.get("impact_type")
        value_chain_location = impact_data.get("value_chain_location")
        magnitude = _opt_float(impact_data.get("magnitude_score"))

        # Severity for negative impacts (ESRS 1 section 43(a)) — requires all
        # three severity dimensions.
        if None not in (scale_score, scope_score, irremediability_score):
            severity_score = (
                scale_score * SEVERITY_CRITERIA["scale"]["weight"]
                + scope_score * SEVERITY_CRITERIA["scope"]["weight"]
                + irremediability_score * SEVERITY_CRITERIA["irremediability"]["weight"]
            )
        else:
            severity_score = None

        # Derive the impact materiality score from the supplied dimensions.
        impact_materiality_score: Optional[float] = None
        if impact_type and "potential" in impact_type:
            # Potential impacts multiply severity by likelihood.
            if severity_score is not None and likelihood_pct is not None:
                impact_materiality_score = severity_score * (likelihood_pct / 100)
        elif impact_type and "positive" in impact_type:
            # Positive impacts: magnitude x likelihood.
            if magnitude is not None and likelihood_pct is not None:
                impact_materiality_score = magnitude * (likelihood_pct / 100)
        else:
            # Actual negative impact (or unspecified type): severity as-is.
            impact_materiality_score = severity_score

        if impact_materiality_score is not None:
            impact_materiality_score = min(100.0, round(impact_materiality_score, 2))
            is_material: Optional[bool] = (
                impact_materiality_score >= self.IMPACT_MATERIALITY_THRESHOLD
            )
        else:
            is_material = None

        # Check sector-typical materiality
        sector_typical = SECTOR_MATERIALITY.get(sector, [])
        sector_flag = topic_id in sector_typical

        return {
            "entity_id": entity_id,
            "topic_id": topic_id,
            "topic_name": ESRS_TOPICS.get(topic_id, {}).get("name", "Unknown"),
            "sector": sector,
            "scale_score": _round_opt(scale_score),
            "scope_score": _round_opt(scope_score),
            "irremediability_score": _round_opt(irremediability_score),
            "severity_score": _round_opt(severity_score),
            "likelihood_pct": _round_opt(likelihood_pct),
            "impact_type": impact_type,
            "value_chain_location": value_chain_location,
            "impact_materiality_score": impact_materiality_score,
            "is_material": is_material,
            "sector_typical_material": sector_flag,
            "assessment_basis": "ESRS_1_section_43",
            "assessed_at": datetime.utcnow().isoformat(),
        }

    # -----------------------------------------------------------------------
    # 2. Financial Materiality Assessment
    # -----------------------------------------------------------------------

    def assess_financial_materiality(
        self,
        entity_id: str,
        topic_id: str,
        financial_data: dict,
    ) -> dict:
        """
        Score financial materiality per ESRS 1 section 47.

        financial_materiality_score = magnitude x likelihood (0-100 each).

        Magnitude and likelihood must be supplied in ``financial_data``. When
        absent, the derived materiality score is returned as ``None`` — no
        fabricated risk figures.
        """
        financial_magnitude_score = _opt_float(
            financial_data.get("financial_magnitude_score")
        )
        financial_likelihood_score = _opt_float(
            financial_data.get("financial_likelihood_score")
        )
        financial_risk_type = financial_data.get("financial_risk_type")
        time_horizon = financial_data.get("time_horizon")
        revenue_at_risk_pct = _opt_float(financial_data.get("revenue_at_risk_pct"))
        capex_implications_mn = _opt_float(financial_data.get("capex_implications_mn"))

        if financial_magnitude_score is not None and financial_likelihood_score is not None:
            financial_materiality_score: Optional[float] = min(
                100.0,
                round(financial_magnitude_score * financial_likelihood_score / 100, 2),
            )
            is_material: Optional[bool] = (
                financial_materiality_score >= self.FINANCIAL_MATERIALITY_THRESHOLD
            )
        else:
            financial_materiality_score = None
            is_material = None

        return {
            "entity_id": entity_id,
            "topic_id": topic_id,
            "topic_name": ESRS_TOPICS.get(topic_id, {}).get("name", "Unknown"),
            "financial_magnitude_score": _round_opt(financial_magnitude_score),
            "financial_likelihood_score": _round_opt(financial_likelihood_score),
            "financial_materiality_score": financial_materiality_score,
            "financial_risk_type": financial_risk_type,
            "financial_risk_description": FINANCIAL_RISK_TYPES.get(
                financial_risk_type or "", ""
            ),
            "time_horizon": time_horizon,
            "revenue_at_risk_pct": _round_opt(revenue_at_risk_pct),
            "capex_implications_mn": _round_opt(capex_implications_mn),
            "is_material": is_material,
            "assessment_basis": "ESRS_1_section_47",
            "assessed_at": datetime.utcnow().isoformat(),
        }

    # -----------------------------------------------------------------------
    # 3. Stakeholder Engagement
    # -----------------------------------------------------------------------

    def run_stakeholder_engagement(
        self,
        entity_id: str,
        stakeholder_data: dict,
    ) -> dict:
        """
        Score stakeholder engagement quality across 5 elements:
        identification, dialogue, documentation, integration, feedback.

        ``engaged_types`` and the per-element scores must be supplied in
        ``stakeholder_data``. Coverage is a real salience-weighted computation
        over the engaged stakeholder types. The engagement quality score is the
        average of whichever element scores are supplied; if none are supplied
        it is returned as ``None`` (insufficient data) rather than fabricated.
        """
        engaged_types: list = stakeholder_data.get("engaged_types", []) or []

        # Five engagement quality elements (0-100 each). Only include elements
        # that were actually supplied — no invented quality scores.
        element_keys = {
            "identification": "identification_score",
            "dialogue": "dialogue_score",
            "documentation": "documentation_score",
            "integration": "integration_score",
            "feedback": "feedback_score",
        }
        element_scores: dict[str, float] = {}
        for element, key in element_keys.items():
            val = _opt_float(stakeholder_data.get(key))
            if val is not None:
                element_scores[element] = val

        if element_scores:
            engagement_quality_score: Optional[float] = round(
                sum(element_scores.values()) / len(element_scores), 2
            )
        else:
            engagement_quality_score = None

        # Salience-weighted coverage — real computation over engaged types.
        total_salience = sum(
            STAKEHOLDER_TYPES.get(t, {}).get("salience_weight", 0.05)
            for t in engaged_types
        )
        coverage_pct = round(min(100.0, total_salience * 100 / 1.0), 2)

        if engagement_quality_score is None:
            engagement_quality_tier: Optional[str] = None
        elif engagement_quality_score >= 80:
            engagement_quality_tier = "excellent"
        elif engagement_quality_score >= 60:
            engagement_quality_tier = "good"
        elif engagement_quality_score >= 40:
            engagement_quality_tier = "adequate"
        else:
            engagement_quality_tier = "insufficient"

        return {
            "entity_id": entity_id,
            "stakeholders_engaged": len(engaged_types),
            "stakeholder_types": engaged_types,
            "coverage_pct": coverage_pct,
            "element_scores": {k: round(v, 2) for k, v in element_scores.items()},
            "engagement_quality_score": engagement_quality_score,
            "engagement_quality_tier": engagement_quality_tier,
            "assessment_basis": "ESRS_1_section_45_stakeholder_engagement",
            "assessed_at": datetime.utcnow().isoformat(),
        }

    # -----------------------------------------------------------------------
    # 4. Topic Prioritisation
    # -----------------------------------------------------------------------

    def prioritise_topics(
        self,
        entity_id: str,
        sector: str,
        impact_scores: dict,
        financial_scores: dict,
        stakeholder_scores: dict,
    ) -> dict:
        """
        Rank topics by combined score and assign materiality_basis.

        combined_score = max(impact_score, financial_score) x stakeholder_weight

        Only topics with a supplied impact or financial score are ranked; topics
        with no supplied dimension are excluded rather than assigned fabricated
        scores. The stakeholder score is a genuine salience input when supplied;
        when absent, no stakeholder uplift is applied (neutral multiplier).
        """
        all_topics = list(ESRS_TOPICS.keys())
        ranked: list[dict] = []

        for topic_id in all_topics:
            imp = _opt_float(impact_scores.get(topic_id))
            fin = _opt_float(financial_scores.get(topic_id))
            stk = _opt_float(stakeholder_scores.get(topic_id))

            # A topic can only be ranked if at least one materiality dimension
            # was actually assessed. Absent -> excluded (not fabricated).
            if imp is None and fin is None:
                continue

            # Double materiality: material if either dimension is material.
            imp_material = imp is not None and imp >= self.IMPACT_MATERIALITY_THRESHOLD
            fin_material = fin is not None and fin >= self.FINANCIAL_MATERIALITY_THRESHOLD

            if imp_material and fin_material:
                materiality_basis = "both"
            elif imp_material:
                materiality_basis = "impact_only"
            elif fin_material:
                materiality_basis = "financial_only"
            else:
                materiality_basis = "neither"

            # Combined score: average of assessed dimensions, weighted by
            # stakeholder salience (neutral 1.0 multiplier when stk absent).
            present = [v for v in (imp, fin) if v is not None]
            dim_avg = sum(present) / len(present)
            stk_mult = 0.7 + 0.3 * stk / 100 if stk is not None else 1.0
            combined_score = round(dim_avg * stk_mult, 2)

            ranked.append(
                {
                    "topic_id": topic_id,
                    "topic_name": ESRS_TOPICS[topic_id]["name"],
                    "standard": ESRS_TOPICS[topic_id]["standard"],
                    "impact_score": _round_opt(imp),
                    "financial_score": _round_opt(fin),
                    "stakeholder_score": _round_opt(stk),
                    "combined_score": combined_score,
                    "impact_material": imp_material,
                    "financial_material": fin_material,
                    "materiality_basis": materiality_basis,
                    "sector_typical": topic_id in SECTOR_MATERIALITY.get(sector, []),
                    "is_material": materiality_basis != "neither",
                }
            )

        ranked.sort(key=lambda x: x["combined_score"], reverse=True)
        for i, row in enumerate(ranked, start=1):
            row["priority_rank"] = i

        material_topics = [r for r in ranked if r["is_material"]]

        return {
            "entity_id": entity_id,
            "sector": sector,
            "total_topics_assessed": len(ranked),
            "material_topics_count": len(material_topics),
            "prioritised_topics": ranked,
            "top5_material_topics": [r["topic_id"] for r in ranked[:5]],
            "assessment_basis": "ESRS_1_section_49_topic_prioritisation",
            "assessed_at": datetime.utcnow().isoformat(),
        }

    # -----------------------------------------------------------------------
    # 5. DMA Process Assessment
    # -----------------------------------------------------------------------

    def assess_dma_process(
        self,
        entity_id: str,
        process_data: dict,
    ) -> dict:
        """
        Assess completeness of the DMA process across 4 steps (25% each).

        Also derives applicable ESRS standards and assurance readiness.

        Per-step scores and the documentation score must be supplied in
        ``process_data``. Completeness is the average of supplied step scores;
        if no step scores are supplied it (and the derived tier / assurance
        readiness) are returned as ``None`` rather than fabricated.
        """
        step_scores: dict[str, float] = {}
        for step in DMA_PROCESS_STEPS:
            val = _opt_float(process_data.get(f"{step}_score"))
            if val is not None:
                step_scores[step] = val

        if step_scores:
            dma_process_completeness_pct: Optional[float] = round(
                sum(step_scores.values()) / len(step_scores), 2
            )
        else:
            dma_process_completeness_pct = None

        sector = process_data.get("sector", "financial_services")
        material_topics = process_data.get(
            "material_topics",
            SECTOR_MATERIALITY.get(sector, ["E1", "S1", "G1"]),
        )

        # Derive applicable ESRS standards
        esrs_standards_applicable = sorted(
            {ESRS_TOPICS[t]["standard"] for t in material_topics if t in ESRS_TOPICS}
        )

        # Assurance readiness — based on documentation and completeness. Only
        # computed when both inputs are present.
        documentation_score = _opt_float(process_data.get("documentation_score"))
        if dma_process_completeness_pct is not None and documentation_score is not None:
            assurance_readiness_pct: Optional[float] = round(
                (dma_process_completeness_pct * 0.6 + documentation_score * 0.4), 2
            )
        else:
            assurance_readiness_pct = None

        if dma_process_completeness_pct is None:
            process_tier: Optional[str] = None
        elif dma_process_completeness_pct >= 80:
            process_tier = "advanced"
        elif dma_process_completeness_pct >= 60:
            process_tier = "developing"
        elif dma_process_completeness_pct >= 40:
            process_tier = "initial"
        else:
            process_tier = "not_started"

        return {
            "entity_id": entity_id,
            "step_scores": {k: round(v, 2) for k, v in step_scores.items()},
            "dma_process_completeness_pct": dma_process_completeness_pct,
            "process_tier": process_tier,
            "sector": sector,
            "material_topics": material_topics,
            "esrs_standards_applicable": esrs_standards_applicable,
            "documentation_score": _round_opt(documentation_score),
            "assurance_readiness_pct": assurance_readiness_pct,
            "assessment_basis": "ESRS_1_sections_42_to_49",
            "assessed_at": datetime.utcnow().isoformat(),
        }

    # -----------------------------------------------------------------------
    # 6. Full Assessment
    # -----------------------------------------------------------------------

    def full_assessment(
        self,
        entity_id: str,
        entity_name: str,
        sector: str,
        nace_code: str,
        reporting_period: str,
        full_data: dict,
    ) -> dict:
        """
        Comprehensive DMA covering both materiality dimensions, stakeholder
        engagement, topic prioritisation and process completeness.

        Per-topic impact/financial/stakeholder scores must be supplied in
        ``full_data`` (impact_scores, financial_scores, stakeholder_scores keyed
        by ESRS topic id). Topics without a supplied score are not fabricated —
        they are simply excluded from the prioritisation. When no materiality
        inputs are supplied at all, the overall DMA score is returned as ``None``.
        """
        sector_topics = SECTOR_MATERIALITY.get(sector, ["E1", "S1", "G1"])
        all_topics = list(ESRS_TOPICS.keys())

        # Impact/financial/stakeholder scores come only from supplied data —
        # no fabricated base scores.
        impact_scores: dict[str, float] = dict(full_data.get("impact_scores", {}))
        financial_scores: dict[str, float] = dict(full_data.get("financial_scores", {}))
        stakeholder_scores_map: dict[str, float] = dict(
            full_data.get("stakeholder_scores", {})
        )

        prioritisation = self.prioritise_topics(
            entity_id, sector, impact_scores, financial_scores, stakeholder_scores_map
        )

        stakeholder_result = self.run_stakeholder_engagement(
            entity_id, full_data.get("stakeholder_data", {})
        )

        process_result = self.assess_dma_process(
            entity_id,
            {
                "sector": sector,
                "material_topics": [
                    r["topic_id"]
                    for r in prioritisation["prioritised_topics"]
                    if r["is_material"]
                ],
                **full_data.get("process_data", {}),
            },
        )

        material_topics = [
            r for r in prioritisation["prioritised_topics"] if r["is_material"]
        ]

        # Overall DMA score is a weighted blend of process completeness (0.4),
        # engagement quality (0.3) and material-topic breadth (0.3). Components
        # that could not be assessed (None) are dropped and the remaining
        # weights renormalised — never substituted with a fabricated value.
        # Material-topic breadth only counts when topics were actually assessed
        # (a genuine "zero material topics" is a real signal; "no topics
        # assessed" is not — it stays None).
        topics_assessed = len(prioritisation["prioritised_topics"])
        material_ratio_score: Optional[float] = (
            min(100.0, len(material_topics) / len(all_topics) * 100)
            if topics_assessed > 0
            else None
        )
        components = [
            (process_result["dma_process_completeness_pct"], 0.4),
            (stakeholder_result["engagement_quality_score"], 0.3),
            (material_ratio_score, 0.3),
        ]
        available = [(v, w) for v, w in components if v is not None]
        total_weight = sum(w for _, w in available)
        if total_weight > 0:
            overall_dma_score: Optional[float] = round(
                sum(v * w for v, w in available) / total_weight, 2
            )
        else:
            overall_dma_score = None

        cross_framework = {
            "TCFD": CROSS_FRAMEWORK_MAP["TCFD"],
            "GRI_3": CROSS_FRAMEWORK_MAP["GRI_3"],
            "ISSB_S1": CROSS_FRAMEWORK_MAP["ISSB_S1"],
            "EU_Taxonomy": CROSS_FRAMEWORK_MAP["EU_Taxonomy"],
            "OECD_Guidelines": CROSS_FRAMEWORK_MAP["OECD_Guidelines"],
        }

        return {
            "entity_id": entity_id,
            "entity_name": entity_name,
            "sector": sector,
            "nace_code": nace_code,
            "reporting_period": reporting_period,
            "assessment_standard": "ESRS_1_Double_Materiality",
            "overall_dma_score": overall_dma_score,
            "dma_tier": (
                None if overall_dma_score is None
                else "advanced" if overall_dma_score >= 75
                else "developing" if overall_dma_score >= 55
                else "initial"
            ),
            "material_topics_count": len(material_topics),
            "top_material_topics": prioritisation["top5_material_topics"],
            "esrs_standards_applicable": process_result["esrs_standards_applicable"],
            "impact_materiality": {
                "scores": impact_scores,
                "material_topics": [
                    r["topic_id"]
                    for r in prioritisation["prioritised_topics"]
                    if r["impact_material"]
                ],
            },
            "financial_materiality": {
                "scores": financial_scores,
                "material_topics": [
                    r["topic_id"]
                    for r in prioritisation["prioritised_topics"]
                    if r["financial_material"]
                ],
            },
            "stakeholder_engagement": stakeholder_result,
            "topic_prioritisation": prioritisation,
            "dma_process": process_result,
            "cross_framework": cross_framework,
            "sector_typical_material_topics": sector_topics,
            "assurance_readiness_pct": process_result["assurance_readiness_pct"],
            "assessed_at": datetime.utcnow().isoformat(),
        }

    # -----------------------------------------------------------------------
    # Static reference methods
    # -----------------------------------------------------------------------

    @staticmethod
    def get_esrs_topics() -> dict:
        return ESRS_TOPICS

    @staticmethod
    def get_severity_criteria() -> dict:
        return SEVERITY_CRITERIA

    @staticmethod
    def get_financial_risk_types() -> dict:
        return FINANCIAL_RISK_TYPES

    @staticmethod
    def get_sector_materiality() -> dict:
        return SECTOR_MATERIALITY
