"""
Forced Labour Risk Assessment Engine
======================================

Comprehensive forced labour risk assessment engine covering:
- ILO 11 forced labour indicators (ILO Special Action Programme to Combat Forced Labour)
- EU Forced Labour Regulation (EU) 2024/3015 — Art 5-8 risk assessment framework
- UK Modern Slavery Act 2015 — Section 54 transparency in supply chain disclosure
- LKSG (German Supply Chain Due Diligence Act) — prohibited practices alignment
- SA8000 Social Accountability Standard — audit framework integration
- CSRD ESRS S1 (own workforce) and S2 (value chain workers) cross-linkage
- CSDDD HR-01 to HR-10 adverse impact cross-linkage

References:
- ILO (2012) — Hard to See, Harder to Count: Survey Guidelines for Forced Labour
- Regulation (EU) 2024/3015 on prohibiting products made with forced labour
- UK Modern Slavery Act 2015, Section 54 — Transparency in Supply Chains
- Lieferkettensorgfaltspflichtengesetz (LKSG) 2021 — German Supply Chain Due Diligence Act
- SA8000:2014 Social Accountability International Standard
- ILO Conventions 29, 105 (Forced Labour and Abolition of Forced Labour)
- ILO Convention 182 (Worst Forms of Child Labour)
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

# ---------------------------------------------------------------------------
# Reference Data Constants
# ---------------------------------------------------------------------------

ILO_INDICATORS: dict = {
    "abuse_of_vulnerability": {
        "description": "Exploitation of workers in vulnerable situations",
        "ilo_reference": "ILO Indicator 1",
        "weight": 0.10,
        "examples": ["migrant workers in irregular status", "debt bondage recruitment", "fraudulent contracts"],
    },
    "deception": {
        "description": "Deception about nature of work, location, employer, or working conditions",
        "ilo_reference": "ILO Indicator 2",
        "weight": 0.10,
        "examples": ["false job advertisements", "contract substitution on arrival", "withheld salary information"],
    },
    "restriction_of_movement": {
        "description": "Workers unable to leave workplace or accommodation freely",
        "ilo_reference": "ILO Indicator 3",
        "weight": 0.09,
        "examples": ["locked dormitories", "surveillance", "movement permission requirements"],
    },
    "isolation": {
        "description": "Social isolation or communication restriction",
        "ilo_reference": "ILO Indicator 4",
        "weight": 0.08,
        "examples": ["phone confiscation", "ban on outside contact", "remote location isolation"],
    },
    "physical_violence": {
        "description": "Physical abuse, threats of violence against workers or families",
        "ilo_reference": "ILO Indicator 5",
        "weight": 0.10,
        "examples": ["assault", "threat of deportation", "family threats"],
    },
    "intimidation_threats": {
        "description": "Non-physical threats used to compel work",
        "ilo_reference": "ILO Indicator 6",
        "weight": 0.09,
        "examples": ["threat of denunciation to immigration", "blackmail", "reputational threats"],
    },
    "retention_of_id_documents": {
        "description": "Confiscation of identity documents by employers",
        "ilo_reference": "ILO Indicator 7",
        "weight": 0.09,
        "examples": ["passports held by employer", "work permits retained", "insurance cards withheld"],
    },
    "retention_of_wages": {
        "description": "Non-payment, underpayment or illegal deduction of wages",
        "ilo_reference": "ILO Indicator 8",
        "weight": 0.10,
        "examples": ["wage theft", "inflated deductions for accommodation/food", "delayed wage payments"],
    },
    "debt_bondage": {
        "description": "Excessive recruitment fees or imposed debts used as control mechanism",
        "ilo_reference": "ILO Indicator 9",
        "weight": 0.10,
        "examples": ["recruitment fees in origin country", "transport cost debts", "housing debt bondage"],
    },
    "abusive_working_conditions": {
        "description": "Working conditions that violate basic labour standards",
        "ilo_reference": "ILO Indicator 10",
        "weight": 0.08,
        "examples": ["excessive hours beyond legal limits", "unsafe conditions", "denied rest periods"],
    },
    "excessive_overtime": {
        "description": "Compulsory overtime beyond legal or ILO maximum hours",
        "ilo_reference": "ILO Indicator 11",
        "weight": 0.07,
        "examples": ["mandatory 80+ hour weeks", "no rest days", "denied leave entitlements"],
    },
}

EU_FLR_HIGH_RISK_COUNTRIES: list = [
    "CN", "BY", "KP", "ER", "UZ", "TM",  # Tier 1 — systemic state-imposed forced labour
    "MM", "LY", "QA", "AE", "SA", "OM",  # Tier 1 — severe documented cases
    "IN", "PK", "BD", "KH", "VN", "TH",  # Tier 2 — sector-specific high risk
    "GH", "CI", "NG", "MR", "ML", "BF",  # Tier 2 — agriculture/mining high risk
    "BR", "BO", "CO", "PY", "PE",         # Tier 2 — agriculture/mining South America
    "ID", "PH", "NP", "LK", "AF",         # Tier 2 — migrant worker risks
]

EU_FLR_HIGH_RISK_SECTORS: dict = {
    "apparel_textiles": {
        "description": "Garment, textile, and footwear manufacturing",
        "supply_chain_vulnerability": "high",
        "high_risk_regions": ["South Asia", "Southeast Asia", "Central Asia"],
        "eu_flr_priority": True,
    },
    "electronics": {
        "description": "Electronics assembly and raw material mining (cobalt, coltan)",
        "supply_chain_vulnerability": "high",
        "high_risk_regions": ["East Asia", "Central Africa"],
        "eu_flr_priority": True,
    },
    "agriculture_food": {
        "description": "Agricultural production including cocoa, coffee, palm oil, sugar",
        "supply_chain_vulnerability": "very_high",
        "high_risk_regions": ["West Africa", "South America", "Southeast Asia"],
        "eu_flr_priority": True,
    },
    "mining_minerals": {
        "description": "Artisanal and small-scale mining (ASM) — gold, diamonds, cobalt",
        "supply_chain_vulnerability": "very_high",
        "high_risk_regions": ["Central Africa", "South America", "Central Asia"],
        "eu_flr_priority": True,
    },
    "construction": {
        "description": "Construction and real estate development (migrant workers)",
        "supply_chain_vulnerability": "high",
        "high_risk_regions": ["Middle East", "North Africa", "South Asia"],
        "eu_flr_priority": False,
    },
    "fishing": {
        "description": "Deep-sea fishing and aquaculture",
        "supply_chain_vulnerability": "very_high",
        "high_risk_regions": ["Southeast Asia", "Pacific Islands"],
        "eu_flr_priority": True,
    },
}

UK_MSA_AREAS: dict = {
    "organisation_structure": {
        "description": "Organisation structure, business and supply chains",
        "max_score": 5,
        "criteria": ["org_chart_published", "supply_chain_tiers_mapped", "key_suppliers_identified", "geographic_risk_mapped", "business_model_risks_identified"],
    },
    "policies": {
        "description": "Policies in relation to slavery and human trafficking",
        "max_score": 5,
        "criteria": ["modern_slavery_policy_exists", "policy_board_approved", "policy_supplier_communicated", "policy_updated_annually", "policy_covers_recruitment"],
    },
    "due_diligence": {
        "description": "Due diligence processes in business and supply chains",
        "max_score": 5,
        "criteria": ["supplier_questionnaires", "third_party_audits", "corrective_action_process", "audit_frequency_risk_based", "improvement_plans_tracked"],
    },
    "risk_assessment": {
        "description": "Risk assessment and management processes",
        "max_score": 5,
        "criteria": ["risk_register_maintained", "hotspot_countries_identified", "vulnerable_worker_groups_mapped", "risk_scoring_methodology", "annual_risk_review"],
    },
    "kpis": {
        "description": "Key performance indicators and measurement",
        "max_score": 5,
        "criteria": ["suppliers_screened_pct_reported", "audits_completed_reported", "incidents_reported", "remediation_cases_tracked", "training_completion_reported"],
    },
    "training": {
        "description": "Training and capacity building",
        "max_score": 5,
        "criteria": ["staff_training_programme", "procurement_team_trained", "supplier_training_offered", "awareness_campaigns", "specialist_training_hr"],
    },
}

LKSG_PROHIBITED: dict = {
    "forced_labour": {"ilo_indicator": "abuse_of_vulnerability", "ilo_convention": "ILO 29/105"},
    "child_labour": {"ilo_indicator": None, "ilo_convention": "ILO 138/182", "min_age": 15},
    "slavery": {"ilo_indicator": "physical_violence", "ilo_convention": "UN Slavery Convention 1926"},
    "debt_bondage_lksg": {"ilo_indicator": "debt_bondage", "ilo_convention": "ILO 29"},
    "physical_punishment": {"ilo_indicator": "physical_violence", "ilo_convention": "UN CAT"},
    "freedom_of_association_violation": {"ilo_indicator": None, "ilo_convention": "ILO 87/98"},
    "non_equal_pay": {"ilo_indicator": None, "ilo_convention": "ILO 100"},
    "racial_discrimination": {"ilo_indicator": None, "ilo_convention": "ILO 111"},
    "id_document_retention": {"ilo_indicator": "retention_of_id_documents", "ilo_convention": "ILO 29"},
    "movement_restriction": {"ilo_indicator": "restriction_of_movement", "ilo_convention": "ILO 29"},
    "denial_of_safe_conditions": {"ilo_indicator": "abusive_working_conditions", "ilo_convention": "ILO 155"},
}

COMPLIANCE_MATURITY_LEVELS: dict = {
    "initial": {"range": (0, 20), "label": "Initial", "description": "Ad hoc, undocumented processes"},
    "developing": {"range": (21, 40), "label": "Developing", "description": "Basic policies but inconsistent implementation"},
    "defined": {"range": (41, 60), "label": "Defined", "description": "Documented processes, systematic approach"},
    "managed": {"range": (61, 80), "label": "Managed", "description": "Measured and controlled with quantitative targets"},
    "optimising": {"range": (81, 100), "label": "Optimising", "description": "Continuous improvement, industry leadership"},
}

# ---------------------------------------------------------------------------
# Result Dataclasses
# ---------------------------------------------------------------------------

@dataclass
class ILOScreeningResult:
    entity_id: str
    assessment_date: str
    ilo_indicator_flags: dict = field(default_factory=dict)
    ilo_aggregate_risk_score: Optional[float] = None
    triggered_indicators: list = field(default_factory=list)
    risk_level: str = ""
    indicators_assessed: int = 0
    data_completeness: str = "insufficient_data"
    notes: list = field(default_factory=list)


@dataclass
class EUFLRResult:
    entity_id: str
    assessment_date: str
    country_code: str = ""
    sector: str = ""
    eu_flr_risk_level: str = ""
    art7_investigation_trigger: bool = False
    art8_database_match: bool = False
    risk_justification: list = field(default_factory=list)
    recommended_actions: list = field(default_factory=list)
    notes: list = field(default_factory=list)


@dataclass
class UKMSAResult:
    entity_id: str
    assessment_date: str
    uk_msa_score: int = 0
    uk_msa_disclosure_areas_met: int = 0
    area_scores: dict = field(default_factory=dict)
    disclosure_grade: str = ""
    notes: list = field(default_factory=list)


@dataclass
class ComplianceProgrammeResult:
    entity_id: str
    assessment_date: str
    policy_commitment_score: Optional[float] = None
    due_diligence_process_score: Optional[float] = None
    grievance_mechanism_score: Optional[float] = None
    remediation_capacity_score: Optional[float] = None
    monitoring_review_score: Optional[float] = None
    overall_programme_score: Optional[float] = None
    compliance_programme_maturity: str = ""
    audit_coverage_pct: Optional[float] = None
    remediation_cases_open: Optional[int] = None
    notes: list = field(default_factory=list)


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------

class ForcedLabourEngine:
    """Forced labour risk assessment engine — ILO indicators, EU FLR, UK MSA, LKSG."""

    def __init__(self) -> None:
        self._today = datetime.utcnow().strftime("%Y-%m-%d")

    # ── ILO 11-Indicator Screening ─────────────────────────────────────────

    def screen_ilo_indicators(
        self,
        entity_id: str,
        supplier_data: dict,
    ) -> ILOScreeningResult:
        """Score all 11 ILO forced labour indicators (0-10 risk each).

        Each indicator score MUST be supplied in ``supplier_data`` keyed by the
        indicator name (e.g. ``{"debt_bondage": 7.5}``). Indicators with no
        supplied value are recorded as "not assessed" (score ``None``) and are
        excluded from the weighted aggregate rather than fabricated. If no
        indicator is assessed, the aggregate risk score is returned as ``None``
        (honest null) with ``risk_level`` = ``"insufficient_data"``.
        """
        indicator_flags: dict = {}
        triggered: list = []
        aggregate = 0.0
        assessed_weight = 0.0
        assessed_count = 0

        for ind_key, ind_def in ILO_INDICATORS.items():
            raw_score = supplier_data.get(ind_key)
            if raw_score is None:
                # No input for this indicator — record honestly, do not fabricate.
                indicator_flags[ind_key] = {
                    "score": None,
                    "triggered": False,
                    "assessed": False,
                    "description": ind_def["description"],
                    "ilo_reference": ind_def["ilo_reference"],
                    "weight": ind_def["weight"],
                }
                continue

            score = min(10.0, max(0.0, float(raw_score)))
            triggered_flag = score > 6.0
            indicator_flags[ind_key] = {
                "score": round(score, 1),
                "triggered": triggered_flag,
                "assessed": True,
                "description": ind_def["description"],
                "ilo_reference": ind_def["ilo_reference"],
                "weight": ind_def["weight"],
            }
            aggregate += score * ind_def["weight"]
            assessed_weight += ind_def["weight"]
            assessed_count += 1
            if triggered_flag:
                triggered.append(ind_key)

        total_weight = sum(v["weight"] for v in ILO_INDICATORS.values())

        if assessed_count == 0:
            # Honest null — no assessed indicators, no basis for a score.
            return ILOScreeningResult(
                entity_id=entity_id,
                assessment_date=self._today,
                ilo_indicator_flags=indicator_flags,
                ilo_aggregate_risk_score=None,
                triggered_indicators=[],
                risk_level="insufficient_data",
                indicators_assessed=0,
                data_completeness="insufficient_data",
                notes=[
                    "ILO aggregate risk score: insufficient_data — no indicator "
                    f"scores supplied (0 of {len(ILO_INDICATORS)} indicators assessed)",
                    "Supply per-indicator scores (0-10) keyed by indicator name to "
                    "compute a real ILO forced-labour risk score.",
                ],
            )

        # Renormalise over the weights of assessed indicators only.
        agg_score = aggregate / assessed_weight if assessed_weight > 0 else 0.0

        if agg_score >= 7:
            risk_level = "critical"
        elif agg_score >= 5:
            risk_level = "high"
        elif agg_score >= 3:
            risk_level = "medium"
        else:
            risk_level = "low"

        completeness = "complete" if assessed_count == len(ILO_INDICATORS) else "partial"
        coverage_pct = round(assessed_weight / total_weight * 100, 1) if total_weight > 0 else 0.0

        return ILOScreeningResult(
            entity_id=entity_id,
            assessment_date=self._today,
            ilo_indicator_flags=indicator_flags,
            ilo_aggregate_risk_score=round(agg_score, 2),
            triggered_indicators=triggered,
            risk_level=risk_level,
            indicators_assessed=assessed_count,
            data_completeness=completeness,
            notes=[
                f"ILO aggregate risk score: {round(agg_score, 2)}/10 ({risk_level})",
                f"Indicators triggered (>6): {len(triggered)} of {assessed_count} assessed",
                f"Data completeness: {completeness} — {assessed_count} of "
                f"{len(ILO_INDICATORS)} indicators assessed ({coverage_pct}% of ILO weight)",
            ],
        )

    # ── EU FLR Assessment ───────────────────────────────────────────────────

    def assess_eu_flr(
        self,
        entity_id: str,
        country_code: str,
        sector: str,
        products: list,
        audit_evidence: dict,
    ) -> EUFLRResult:
        """EU Forced Labour Regulation 2024/3015 — import risk assessment."""
        risk_factors: list = []
        risk_points = 0

        # Country risk
        country_upper = country_code.upper()
        if country_upper in EU_FLR_HIGH_RISK_COUNTRIES[:14]:  # Tier 1 (systemic/severe)
            risk_points += 3
            risk_factors.append(f"Country {country_code} classified Tier 1 high-risk (systemic/severe forced labour)")
        elif country_upper in EU_FLR_HIGH_RISK_COUNTRIES[14:]:  # Tier 2
            risk_points += 2
            risk_factors.append(f"Country {country_code} classified Tier 2 elevated risk")
        else:
            risk_factors.append(f"Country {country_code} not in EU FLR high-risk list")

        # Sector risk
        sector_lower = sector.lower().replace(" ", "_")
        if sector_lower in EU_FLR_HIGH_RISK_SECTORS:
            sector_def = EU_FLR_HIGH_RISK_SECTORS[sector_lower]
            if sector_def["supply_chain_vulnerability"] == "very_high":
                risk_points += 3
            else:
                risk_points += 2
            risk_factors.append(f"Sector '{sector}' flagged as high-risk: {sector_def['description']}")

        # Audit evidence quality. Absence of audit evidence is itself an
        # elevated-risk signal under EU FLR (importer cannot demonstrate the
        # absence of forced labour) — never substitute a fabricated score.
        audit_score = audit_evidence.get("audit_score")
        if audit_score is None:
            risk_points += 2
            risk_factors.append(
                "No audit evidence supplied — cannot demonstrate absence of "
                "forced labour (treated as elevated risk under EU FLR)"
            )
        else:
            audit_score = float(audit_score)
            if audit_score < 40:
                risk_points += 2
                risk_factors.append("Inadequate audit evidence (score <40)")
            elif audit_score < 60:
                risk_points += 1

        # Risk level determination
        if risk_points >= 7:
            risk_level = "critical"
        elif risk_points >= 5:
            risk_level = "high"
        elif risk_points >= 3:
            risk_level = "medium"
        else:
            risk_level = "low"

        art7_trigger = risk_level == "critical"
        art8_match = country_upper in ("CN", "KP", "BY") and sector_lower in EU_FLR_HIGH_RISK_SECTORS

        recommended = []
        if risk_level in ("critical", "high"):
            recommended.append("Commission independent third-party audit at supplier level")
            recommended.append("Suspend imports pending satisfactory remediation evidence")
        if risk_level == "critical":
            recommended.append("File notification with competent authority under Art 5(3)")
        if art8_match:
            recommended.append("Cross-check against EU Forced Labour Products Database (Art 8)")

        return EUFLRResult(
            entity_id=entity_id,
            assessment_date=self._today,
            country_code=country_code,
            sector=sector,
            eu_flr_risk_level=risk_level,
            art7_investigation_trigger=art7_trigger,
            art8_database_match=art8_match,
            risk_justification=risk_factors,
            recommended_actions=recommended,
            notes=[f"EU FLR 2024/3015 risk assessment: {risk_level} (risk points: {risk_points})"],
        )

    # ── UK MSA Scoring ─────────────────────────────────────────────────────

    def assess_uk_msa(
        self,
        entity_id: str,
        disclosure_data: dict,
    ) -> UKMSAResult:
        """UK Modern Slavery Act Section 54 — disclosure scoring (0-30).

        Scoring reflects only affirmatively disclosed criteria: a criterion is
        credited only when its flag in ``disclosure_data`` is ``True``. Absent
        (``None``) or falsy criteria earn no point — undisclosed is not credited
        (never fabricated).
        """
        area_scores: dict = {}
        total_score = 0
        areas_met = 0

        for area_key, area_def in UK_MSA_AREAS.items():
            score = 0
            for criterion in area_def["criteria"]:
                val = disclosure_data.get(criterion)
                if val is True:
                    score += 1
            area_score = min(area_def["max_score"], score)
            area_scores[area_key] = {
                "score": area_score,
                "max": area_def["max_score"],
                "description": area_def["description"],
            }
            total_score += area_score
            if area_score >= 3:
                areas_met += 1

        if total_score >= 25:
            grade = "A — Leading"
        elif total_score >= 18:
            grade = "B — Good"
        elif total_score >= 12:
            grade = "C — Developing"
        elif total_score >= 6:
            grade = "D — Basic"
        else:
            grade = "E — Minimal"

        return UKMSAResult(
            entity_id=entity_id,
            assessment_date=self._today,
            uk_msa_score=total_score,
            uk_msa_disclosure_areas_met=areas_met,
            area_scores=area_scores,
            disclosure_grade=grade,
            notes=[f"UK MSA Section 54 score: {total_score}/30 — {grade}"],
        )

    # ── Compliance Programme Assessment ────────────────────────────────────

    def assess_compliance_programme(
        self,
        entity_id: str,
        programme_data: dict,
    ) -> ComplianceProgrammeResult:
        """5-pillar compliance programme maturity assessment.

        Each pillar score (0-100) is read from ``programme_data``; unsupplied
        pillars are returned as ``None`` (not fabricated) and excluded from the
        weighted overall score, which is renormalised over the supplied pillars.
        If no pillar is supplied, ``overall_programme_score`` is ``None`` and
        maturity is ``"insufficient_data"``. Operational metrics
        (``audit_coverage_pct``, ``remediation_cases_open``) are honest nulls
        when absent.
        """
        def get_score(key: str) -> Optional[float]:
            val = programme_data.get(key)
            if val is None:
                return None
            return min(100.0, max(0.0, float(val)))

        pillar_weights = {
            "policy_commitment_score": 0.20,
            "due_diligence_process_score": 0.25,
            "grievance_mechanism_score": 0.20,
            "remediation_capacity_score": 0.20,
            "monitoring_review_score": 0.15,
        }
        pillar_scores = {k: get_score(k) for k in pillar_weights}

        supplied_weight = sum(
            w for k, w in pillar_weights.items() if pillar_scores[k] is not None
        )
        if supplied_weight > 0:
            weighted_sum = sum(
                pillar_scores[k] * w
                for k, w in pillar_weights.items()
                if pillar_scores[k] is not None
            )
            overall: Optional[float] = weighted_sum / supplied_weight
        else:
            overall = None

        if overall is None:
            maturity = "insufficient_data"
        else:
            maturity = "initial"
            for level_key, level_def in COMPLIANCE_MATURITY_LEVELS.items():
                low, high = level_def["range"]
                if low <= overall <= high:
                    maturity = level_def["label"]
                    break

        raw_coverage = programme_data.get("audit_coverage_pct")
        audit_coverage = round(float(raw_coverage), 1) if raw_coverage is not None else None
        raw_cases = programme_data.get("remediation_cases_open")
        open_cases = int(raw_cases) if raw_cases is not None else None

        supplied_pillars = sum(1 for v in pillar_scores.values() if v is not None)
        if overall is None:
            note = (
                "Compliance programme maturity: insufficient_data — no pillar "
                f"scores supplied (0 of {len(pillar_weights)} pillars)"
            )
        else:
            note = (
                f"Compliance programme maturity: {maturity} (overall score: "
                f"{round(overall, 1)}/100; {supplied_pillars} of "
                f"{len(pillar_weights)} pillars supplied)"
            )

        def _round(v: Optional[float]) -> Optional[float]:
            return round(v, 1) if v is not None else None

        return ComplianceProgrammeResult(
            entity_id=entity_id,
            assessment_date=self._today,
            policy_commitment_score=_round(pillar_scores["policy_commitment_score"]),
            due_diligence_process_score=_round(pillar_scores["due_diligence_process_score"]),
            grievance_mechanism_score=_round(pillar_scores["grievance_mechanism_score"]),
            remediation_capacity_score=_round(pillar_scores["remediation_capacity_score"]),
            monitoring_review_score=_round(pillar_scores["monitoring_review_score"]),
            overall_programme_score=_round(overall),
            compliance_programme_maturity=maturity,
            audit_coverage_pct=audit_coverage,
            remediation_cases_open=open_cases,
            notes=[note],
        )

    # ── Supplier Network Screening ─────────────────────────────────────────

    def screen_supplier_network(
        self,
        assessment_id: str,
        suppliers: list,
    ) -> list:
        """Per-supplier forced labour risk screening."""
        results = []
        for supplier in suppliers:
            supplier_id = supplier.get("supplier_id", assessment_id + "_sup")

            ilo_r = self.screen_ilo_indicators(supplier_id, supplier.get("supplier_data", {}))

            eu_flr_risk = ilo_r.risk_level
            if supplier.get("country_code", "") in EU_FLR_HIGH_RISK_COUNTRIES:
                # A high-risk sourcing country floors residual risk at "medium".
                # This applies whether or not ILO indicators were assessed.
                if eu_flr_risk in ("low", "insufficient_data"):
                    eu_flr_risk = "medium"

            # Audit / certification status is taken as supplied. When absent, use
            # the truthful default (not audited / not certified) — never a random
            # draw, since these feed regulatory audit-coverage metrics.
            audit_status = supplier.get("audit_status") or "not_audited"
            sa8000 = supplier.get("sa8000_certified")
            if sa8000 is None:
                sa8000 = False

            results.append({
                "supplier_id": supplier_id,
                "supplier_name": supplier.get("supplier_name", supplier_id),
                "country_code": supplier.get("country_code", ""),
                "tier": supplier.get("tier", 1),
                "ilo_risk_score": ilo_r.ilo_aggregate_risk_score,
                "eu_flr_risk_level": eu_flr_risk,
                "ilo_indicators_triggered": ilo_r.triggered_indicators,
                "audit_status": audit_status,
                "sa8000_certified": bool(sa8000),
                "last_audit_date": supplier.get("last_audit_date", ""),
            })
        return results

    # ── Full Assessment ─────────────────────────────────────────────────────

    def full_assessment(
        self,
        entity_id: str,
        entity_name: str,
        sector: str,
        country_code: str = "",
        products: Optional[list] = None,
        audit_evidence: Optional[dict] = None,
        supplier_data: Optional[dict] = None,
        disclosure_data: Optional[dict] = None,
        programme_data: Optional[dict] = None,
        suppliers: Optional[list] = None,
    ) -> dict:
        """Full forced labour risk assessment."""
        ilo_r = self.screen_ilo_indicators(entity_id, supplier_data or {})
        eu_flr_r = self.assess_eu_flr(entity_id, country_code, sector, products or [], audit_evidence or {})
        uk_msa_r = self.assess_uk_msa(entity_id, disclosure_data or {})
        prog_r = self.assess_compliance_programme(entity_id, programme_data or {})

        supplier_nodes = []
        if suppliers:
            supplier_nodes = self.screen_supplier_network(entity_id, suppliers)

        # CSRD S2 and CSDDD cross-linkage
        csrd_s2_linkage = {
            "esrs_s2": "ESRS S2 — Workers in Value Chain: supply chain labour conditions assessment",
            "s2_c3_indicator": "S2-C3 — Incidents and complaints concerning violations of workers rights",
            "s2_c4_indicator": "S2-C4 — Freedom of association and collective bargaining coverage",
            "data_points": [
                "Percentage of suppliers audited for forced labour risk",
                "Number of ILO indicator triggers in supply chain",
                "Remediation rate for confirmed forced labour cases",
            ],
        }

        csddd_hr01_linkage = {
            "adverse_impact": "HR-01 — Forced and compulsory labour",
            "csddd_article": "Art 6 — Identifying actual and potential adverse impacts",
            "ilo_indicators_mapped": list(LKSG_PROHIBITED.keys()),
            "prevention_obligation": "Art 7 — Preventing potential adverse impacts",
            "remediation_obligation": "Art 8-9 — Bringing actual adverse impacts to an end",
        }

        priority_actions = []
        if ilo_r.risk_level in ("critical", "high"):
            priority_actions.append("Immediate supplier audit for triggered ILO indicators")
        if eu_flr_r.art7_investigation_trigger:
            priority_actions.append("File Art 7 investigation notification with competent authority")
        if uk_msa_r.uk_msa_score < 12:
            priority_actions.append("Enhance UK MSA Section 54 disclosure — address areas scoring <3/5")
        if prog_r.compliance_programme_maturity in ("Initial", "Developing"):
            priority_actions.append("Develop formal forced labour policy and due diligence process")
        if not priority_actions:
            priority_actions.append("Maintain current programme and conduct annual review")

        return {
            "entity_id": entity_id,
            "entity_name": entity_name,
            "sector": sector,
            "assessment_date": self._today,
            "ilo_screening": {
                "aggregate_risk_score": ilo_r.ilo_aggregate_risk_score,
                "risk_level": ilo_r.risk_level,
                "triggered_indicators": ilo_r.triggered_indicators,
                "indicator_flags": ilo_r.ilo_indicator_flags,
            },
            "eu_flr": {
                "risk_level": eu_flr_r.eu_flr_risk_level,
                "art7_investigation_trigger": eu_flr_r.art7_investigation_trigger,
                "art8_database_match": eu_flr_r.art8_database_match,
                "risk_justification": eu_flr_r.risk_justification,
                "recommended_actions": eu_flr_r.recommended_actions,
            },
            "uk_msa": {
                "score": uk_msa_r.uk_msa_score,
                "areas_met": uk_msa_r.uk_msa_disclosure_areas_met,
                "grade": uk_msa_r.disclosure_grade,
                "area_scores": uk_msa_r.area_scores,
            },
            "compliance_programme": {
                "overall_score": prog_r.overall_programme_score,
                "maturity": prog_r.compliance_programme_maturity,
                "audit_coverage_pct": prog_r.audit_coverage_pct,
                "grievance_mechanism_score": prog_r.grievance_mechanism_score,
                "remediation_cases_open": prog_r.remediation_cases_open,
            },
            "supplier_nodes": supplier_nodes,
            "csrd_s2_linkage": csrd_s2_linkage,
            "csddd_hr01_linkage": csddd_hr01_linkage,
            "priority_actions": priority_actions,
        }

    # ── Reference Data (static) ────────────────────────────────────────────

    @staticmethod
    def get_ilo_indicators() -> dict:
        return ILO_INDICATORS

    @staticmethod
    def get_eu_flr_country_risk() -> dict:
        return {
            "tier_1_systemic": EU_FLR_HIGH_RISK_COUNTRIES[:14],
            "tier_2_elevated": EU_FLR_HIGH_RISK_COUNTRIES[14:],
            "regulation": "Regulation (EU) 2024/3015",
            "note": "Country list is indicative based on ILO forced labour data and EC risk assessments",
        }

    @staticmethod
    def get_uk_msa_areas() -> dict:
        return UK_MSA_AREAS

    @staticmethod
    def get_lksg_prohibited_practices() -> dict:
        return LKSG_PROHIBITED

    @staticmethod
    def get_high_risk_sectors() -> dict:
        return EU_FLR_HIGH_RISK_SECTORS
