"""Net Zero Target Setting Engine (E33)
Covers: SBTi Corporate Standard (near-term 1.5C/WB2C), SBTi FLAG Guidance,
NZBA (Net Zero Banking Alliance 2021), NZAMI (Net Zero Asset Managers 2021),
NZAOA (Net Zero Asset Owner Alliance 2022)
"""

import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, date
import uuid

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────

FRAMEWORK_CONFIGS: Dict[str, Dict] = {
    "sbti": {
        "name": "Science Based Targets initiative — Corporate Standard",
        "version": "SBTi Corporate Standard v2.0 (2023)",
        "near_term_year": 2030,
        "long_term_year": 2050,
        "scope_requirements": {
            "scope1": "mandatory",
            "scope2": "mandatory",
            "scope3": "mandatory_if_15pct_of_total",
        },
        "pathway_options": ["1_5c", "well_below_2c", "2c"],
        "validation_required": True,
        "allowed_entity_types": ["corporate"],
        "near_term_min_reduction_pct": 42,
        "long_term_min_reduction_pct": 90,
        "offset_allowed_after_pct": 10,
    },
    "sbti_flag": {
        "name": "SBTi FLAG Guidance — Forest, Land & Agriculture",
        "version": "SBTi FLAG Guidance v1.0 (2022)",
        "near_term_year": 2030,
        "long_term_year": 2050,
        "scope_requirements": {
            "scope1": "mandatory",
            "scope2": "mandatory",
            "scope3": "flag_emissions_mandatory",
        },
        "pathway_options": ["1_5c"],
        "validation_required": True,
        "allowed_entity_types": ["corporate"],
        "near_term_min_reduction_pct": 30,
        "long_term_min_reduction_pct": 72,
        "land_sink_credits_allowed": True,
    },
    "nzba": {
        "name": "Net Zero Banking Alliance",
        "version": "NZBA Guidelines v2 (2022)",
        "near_term_year": 2030,
        "long_term_year": 2050,
        "scope_requirements": {
            "scope1": "mandatory",
            "scope2": "mandatory",
            "scope3_financed": "mandatory_by_2030",
        },
        "pathway_options": ["1_5c", "well_below_2c"],
        "validation_required": False,
        "allowed_entity_types": ["bank"],
        "portfolio_coverage_pct_2030": 100,
        "interim_targets_required": True,
        "pcaf_alignment": True,
    },
    "nzami": {
        "name": "Net Zero Asset Managers Initiative",
        "version": "NZAMI Commitment (2021)",
        "near_term_year": 2030,
        "long_term_year": 2050,
        "scope_requirements": {
            "scope1": "portfolio_companies",
            "scope2": "portfolio_companies",
            "scope3": "financed_emissions_pari_passu",
        },
        "pathway_options": ["1_5c", "well_below_2c"],
        "validation_required": False,
        "allowed_entity_types": ["asset_manager"],
        "aum_alignment_interim_pct": 50,
        "net_zero_aum_target_pct": 100,
        "engagement_requirement": True,
    },
    "nzaoa": {
        "name": "Net Zero Asset Owner Alliance",
        "version": "NZAOA Protocol v4 (2022)",
        "near_term_year": 2025,
        "long_term_year": 2050,
        "scope_requirements": {
            "scope1": "portfolio_companies",
            "scope2": "portfolio_companies",
            "scope3_financed": "mandatory",
        },
        "pathway_options": ["1_5c"],
        "validation_required": False,
        "allowed_entity_types": ["asset_owner"],
        "five_year_interim_targets": True,
        "portfolio_temperature_target_c": 1.5,
        "engagement_voting_required": True,
    },
    "combined": {
        "name": "Combined Multi-Framework Assessment",
        "version": "Cross-framework (2024)",
        "near_term_year": 2030,
        "long_term_year": 2050,
        "scope_requirements": {
            "scope1": "mandatory",
            "scope2": "mandatory",
            "scope3": "mandatory",
        },
        "pathway_options": ["1_5c", "well_below_2c", "2c"],
        "validation_required": True,
        "allowed_entity_types": ["corporate", "bank", "asset_manager", "asset_owner"],
        "near_term_min_reduction_pct": 42,
        "long_term_min_reduction_pct": 90,
    },
}

SBTI_PATHWAYS: Dict[str, Dict] = {
    "1_5c": {
        "name": "1.5°C pathway",
        "near_term_min_pct": 50,
        "long_term_min_pct": 90,
        "residual_emissions_max_pct": 10,
        "offset_limit_pct": 10,
        "temperature_outcome_c": 1.5,
        "overshoot": False,
    },
    "well_below_2c": {
        "name": "Well-below 2°C pathway",
        "near_term_min_pct": 30,
        "long_term_min_pct": 80,
        "residual_emissions_max_pct": 20,
        "offset_limit_pct": 20,
        "temperature_outcome_c": 1.7,
        "overshoot": True,
    },
    "2c": {
        "name": "2°C pathway",
        "near_term_min_pct": 25,
        "long_term_min_pct": 70,
        "residual_emissions_max_pct": 30,
        "offset_limit_pct": 30,
        "temperature_outcome_c": 2.0,
        "overshoot": True,
    },
}

# Implied temperature by 2030 reduction percentage (approximate lookup)
TEMPERATURE_SCORE_BENCHMARKS: List[Dict] = [
    {"min_reduction_pct_2030": 60, "implied_temp_c": 1.5,  "classification": "1.5°C aligned"},
    {"min_reduction_pct_2030": 45, "implied_temp_c": 1.7,  "classification": "Well-below 2°C"},
    {"min_reduction_pct_2030": 30, "implied_temp_c": 2.0,  "classification": "2°C aligned"},
    {"min_reduction_pct_2030": 20, "implied_temp_c": 2.5,  "classification": "Below 3°C"},
    {"min_reduction_pct_2030": 10, "implied_temp_c": 3.0,  "classification": "3°C pathway"},
    {"min_reduction_pct_2030":  0, "implied_temp_c": 4.0,  "classification": "No credible target"},
]

SECTOR_PATHWAYS: Dict[str, Dict] = {
    "power_generation": {
        "decarbonisation_by_2030_pct": 45,
        "decarbonisation_by_2040_pct": 80,
        "decarbonisation_by_2050_pct": 100,
        "key_lever": "Renewable energy transition",
        "sbti_sectoral_pathway": "Science-Based Methodology (SBM-EPS)",
    },
    "buildings": {
        "decarbonisation_by_2030_pct": 35,
        "decarbonisation_by_2040_pct": 65,
        "decarbonisation_by_2050_pct": 97,
        "key_lever": "Energy efficiency & electrification",
        "sbti_sectoral_pathway": "Buildings Sector Science-Based Target Setting Guidance",
    },
    "transport": {
        "decarbonisation_by_2030_pct": 25,
        "decarbonisation_by_2040_pct": 60,
        "decarbonisation_by_2050_pct": 100,
        "key_lever": "Fleet electrification & modal shift",
        "sbti_sectoral_pathway": "Transport Science-Based Target Setting Guidance",
    },
    "steel": {
        "decarbonisation_by_2030_pct": 20,
        "decarbonisation_by_2040_pct": 50,
        "decarbonisation_by_2050_pct": 90,
        "key_lever": "Green hydrogen DRI & EAF transition",
        "sbti_sectoral_pathway": "SBTi Steel Sector Guidance",
    },
    "cement": {
        "decarbonisation_by_2030_pct": 22,
        "decarbonisation_by_2040_pct": 48,
        "decarbonisation_by_2050_pct": 85,
        "key_lever": "Clinker substitution & CCUS",
        "sbti_sectoral_pathway": "SBTi Cement Guidance (SDA)",
    },
    "chemicals": {
        "decarbonisation_by_2030_pct": 28,
        "decarbonisation_by_2040_pct": 55,
        "decarbonisation_by_2050_pct": 90,
        "key_lever": "Green feedstocks & electrification",
        "sbti_sectoral_pathway": "SBTi Chemicals Sector Guidance (SDA)",
    },
    "oil_gas": {
        "decarbonisation_by_2030_pct": 15,
        "decarbonisation_by_2040_pct": 40,
        "decarbonisation_by_2050_pct": 60,
        "key_lever": "Methane reduction & CCS; managed decline",
        "sbti_sectoral_pathway": "IEA NZE Reference (no dedicated SBTi sector pathway yet)",
    },
    "agriculture": {
        "decarbonisation_by_2030_pct": 20,
        "decarbonisation_by_2040_pct": 40,
        "decarbonisation_by_2050_pct": 72,
        "key_lever": "Enteric methane reduction & land sink",
        "sbti_sectoral_pathway": "SBTi FLAG Guidance",
    },
    "financial_services": {
        "decarbonisation_by_2030_pct": 30,
        "decarbonisation_by_2040_pct": 60,
        "decarbonisation_by_2050_pct": 100,
        "key_lever": "Portfolio decarbonisation & engagement",
        "sbti_sectoral_pathway": "SBTi Finance Sector (SBTN-FI)",
    },
    "real_estate": {
        "decarbonisation_by_2030_pct": 40,
        "decarbonisation_by_2040_pct": 70,
        "decarbonisation_by_2050_pct": 100,
        "key_lever": "CRREM pathway; net zero building standards",
        "sbti_sectoral_pathway": "SBTi Buildings Sector Guidance",
    },
    "technology": {
        "decarbonisation_by_2030_pct": 55,
        "decarbonisation_by_2040_pct": 85,
        "decarbonisation_by_2050_pct": 100,
        "key_lever": "Renewable electricity & supply chain engagement",
        "sbti_sectoral_pathway": "SBTi ICT Sector Guidance",
    },
    "retail": {
        "decarbonisation_by_2030_pct": 42,
        "decarbonisation_by_2040_pct": 72,
        "decarbonisation_by_2050_pct": 100,
        "key_lever": "Supply chain engagement & Scope 3 Cat 1",
        "sbti_sectoral_pathway": "SBTi Corporate Standard",
    },
}

VALIDATION_STATUSES: List[str] = ["committed", "submitted", "approved", "achieved"]

ENTITY_TYPES: List[str] = ["corporate", "bank", "asset_manager", "asset_owner"]


# ── Engine ────────────────────────────────────────────────────────────────────

class NetZeroTargetsEngine:
    """Net Zero Target Setting Engine.

    Validates targets against SBTi/NZBA/NZAMI/NZAOA frameworks,
    generates decarbonisation pathways, and scores temperature alignment.

    All returned metrics are deterministic functions of the caller-supplied
    inputs (emissions, reduction targets, validation state). Metrics that
    require data the caller has not provided (e.g. Scope-3 category coverage,
    marginal abatement cost, achieved-vs-required projection) are returned as
    an honest ``None`` / ``"insufficient_data"`` rather than fabricated.
    """

    def __init__(self) -> None:
        pass

    def _derive_temperature_score(self, reduction_pct_2030: float) -> Dict:
        temp = 4.0
        classification = "No credible target"
        for bench in TEMPERATURE_SCORE_BENCHMARKS:
            if reduction_pct_2030 >= bench["min_reduction_pct_2030"]:
                temp = bench["implied_temp_c"]
                classification = bench["classification"]
                break
        return {"temperature_c": temp, "classification": classification}

    def _derive_pathway(self, reduction_pct_near: float) -> str:
        if reduction_pct_near >= SBTI_PATHWAYS["1_5c"]["near_term_min_pct"]:
            return "1_5c"
        if reduction_pct_near >= SBTI_PATHWAYS["well_below_2c"]["near_term_min_pct"]:
            return "well_below_2c"
        if reduction_pct_near >= SBTI_PATHWAYS["2c"]["near_term_min_pct"]:
            return "2c"
        return "insufficient"

    def _derive_validation_status(
        self,
        cfg: Dict,
        validation_issues: List[str],
        supplied_status: Optional[str],
    ) -> str:
        """Deterministic SBTi commitment-lifecycle stage.

        Uses the caller-supplied status when given (must be one of
        VALIDATION_STATUSES). Otherwise reports the earliest honest stage:
        an entity that has set targets but not obtained third-party validation
        is 'committed'; if the framework does not require validation and there
        are no open issues, the targets are considered 'submitted'. Never a
        random draw.
        """
        if supplied_status in VALIDATION_STATUSES:
            return supplied_status
        if not cfg.get("validation_required", False) and not validation_issues:
            return "submitted"
        return "committed"

    # ── assess_targets ────────────────────────────────────────────────────────

    def assess_targets(
        self,
        entity_id: str,
        entity_type: str,
        framework: str,
        base_year: int,
        base_year_emissions: float,
        scope1: float,
        scope2: float,
        scope3: float,
        net_zero_target_year: int,
        near_term_target_year: int,
        near_term_reduction_pct: float,
        **kwargs,
    ) -> Dict:
        """Validate targets and derive pathway classification.

        Optional keyword inputs (all default to None → honest null when absent):
          long_term_reduction_pct : entity's stated long-term reduction %
          scope3_coverage_pct     : % of Scope-3 categories covered by targets
          offset_reliance_pct     : % of the target met via offsets/removals
          validation_status       : reported SBTi lifecycle stage
          sbti_validated          : True only if third-party SBTi approval obtained
        """
        cfg = FRAMEWORK_CONFIGS.get(framework, FRAMEWORK_CONFIGS["combined"])
        assessment_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()

        sbti_pathway = self._derive_pathway(near_term_reduction_pct)
        temp_result = self._derive_temperature_score(near_term_reduction_pct)

        # Long-term reduction: real caller input, else honest null.
        long_term_reduction = kwargs.get("long_term_reduction_pct")
        pathway_gap_pct = max(0.0, cfg.get("near_term_min_reduction_pct", 42) - near_term_reduction_pct)

        # Scope-3 category coverage and offset reliance are entity-reported data
        # points, not derivable from emissions totals alone. Use real input, else null.
        scope3_coverage_pct = kwargs.get("scope3_coverage_pct")
        offset_reliance_pct = kwargs.get("offset_reliance_pct")

        # Validation checks
        validation_issues = []
        if near_term_reduction_pct < cfg.get("near_term_min_reduction_pct", 30):
            validation_issues.append(f"Near-term reduction {near_term_reduction_pct:.1f}% below {framework.upper()} minimum of {cfg['near_term_min_reduction_pct']}%")
        if long_term_reduction is not None and long_term_reduction < cfg.get("long_term_min_reduction_pct", 80):
            validation_issues.append(f"Long-term reduction {long_term_reduction:.1f}% below {framework.upper()} minimum of {cfg['long_term_min_reduction_pct']}%")
        if entity_type not in cfg.get("allowed_entity_types", ENTITY_TYPES):
            validation_issues.append(f"Entity type '{entity_type}' not covered by {framework.upper()} framework")
        if net_zero_target_year > cfg.get("long_term_year", 2050):
            validation_issues.append(f"Net zero year {net_zero_target_year} exceeds {framework.upper()} long-term deadline of {cfg['long_term_year']}")

        validation_status = self._derive_validation_status(
            cfg, validation_issues, kwargs.get("validation_status")
        )
        # Third-party SBTi validation is an external fact — only True if the
        # caller confirms it. Never inferred, never random.
        sbti_validated = bool(kwargs.get("sbti_validated", False))

        return {
            "assessment_id": assessment_id,
            "entity_id": entity_id,
            "entity_name": kwargs.get("entity_name", entity_id),
            "entity_type": entity_type,
            "framework": framework,
            "base_year": base_year,
            "base_year_emissions_tco2e": base_year_emissions,
            "scope1_tco2e": scope1,
            "scope2_tco2e": scope2,
            "scope3_tco2e": scope3,
            "near_term_target_year": near_term_target_year,
            "near_term_reduction_pct": round(near_term_reduction_pct, 2),
            "long_term_reduction_pct": round(long_term_reduction, 2) if long_term_reduction is not None else None,
            "net_zero_target_year": net_zero_target_year,
            "sbti_pathway": sbti_pathway,
            "temperature_score_c": temp_result["temperature_c"],
            "temperature_classification": temp_result["classification"],
            "pathway_gap_pct": round(pathway_gap_pct, 2),
            "validation_status": validation_status,
            "sbti_validated": sbti_validated,
            "validation_issues": validation_issues,
            "framework_compliant": len(validation_issues) == 0,
            "scope3_coverage_pct": round(scope3_coverage_pct, 1) if scope3_coverage_pct is not None else None,
            "offset_reliance_pct": round(offset_reliance_pct, 1) if offset_reliance_pct is not None else None,
            "assessment_date": now,
            "created_at": now,
            "updated_at": now,
        }

    # ── generate_pathway ──────────────────────────────────────────────────────

    def generate_pathway(
        self,
        entity_id: str,
        assessment_id: str,
        base_year: int,
        base_emissions: float,
        net_zero_year: int,
        reduction_pct_2030: float,
        reduction_pct_2050: float,
        projected_emissions_by_year: Optional[Dict[int, float]] = None,
        offset_plan_by_year: Optional[Dict[int, float]] = None,
        abatement_cost_by_year: Optional[Dict[int, float]] = None,
    ) -> List[Dict]:
        """Generate year-by-year decarbonisation pathway records.

        The REQUIRED pathway is computed deterministically by linear
        interpolation between the base year, the 2030 milestone, and net-zero.

        Optional caller inputs (default None → honest neutral / null):
          projected_emissions_by_year : entity's own emissions projection per
              year. When absent, the projection equals the required pathway
              (on-track baseline, gap = 0) rather than a fabricated deviation.
          offset_plan_by_year         : planned offset/removal volume per year.
          abatement_cost_by_year      : marginal abatement cost ($/tCO2e) per
              year. Entity/sector-specific; null when not provided.
        """
        records = []
        years = list(range(base_year + 5, net_zero_year + 1, 5))
        if net_zero_year not in years:
            years.append(net_zero_year)

        total_years = max(1, net_zero_year - base_year)

        projected_emissions_by_year = projected_emissions_by_year or {}
        offset_plan_by_year = offset_plan_by_year or {}
        abatement_cost_by_year = abatement_cost_by_year or {}

        for yr in years:
            # Linear interpolation between base, 2030 milestone, and net zero
            if yr <= 2030:
                frac = (yr - base_year) / max(1, 2030 - base_year)
                required_reduction = reduction_pct_2030 * frac
            else:
                frac = (yr - 2030) / max(1, net_zero_year - 2030)
                required_reduction = reduction_pct_2030 + (reduction_pct_2050 - reduction_pct_2030) * frac

            required_reduction = min(100.0, required_reduction)
            required_emissions = base_emissions * (1 - required_reduction / 100)

            # Projection: real caller input if provided, else assume on-track
            # (projected == required). No fabricated noise.
            if yr in projected_emissions_by_year:
                projected_emissions = max(0.0, float(projected_emissions_by_year[yr]))
            else:
                projected_emissions = required_emissions
            gap = projected_emissions - required_emissions
            on_track = gap <= 0

            # Offsets: real plan input, else 0 (no assumed offsetting).
            offset_used = offset_plan_by_year.get(yr)
            offset_used_tco2e = round(float(offset_used), 0) if offset_used is not None else 0

            # Marginal abatement cost: real input, else honest null.
            abatement_cost = abatement_cost_by_year.get(yr)
            abatement_cost_usd = round(float(abatement_cost), 0) if abatement_cost is not None else None

            records.append({
                "record_id": str(uuid.uuid4()),
                "assessment_id": assessment_id,
                "entity_id": entity_id,
                "year": yr,
                "required_reduction_pct": round(required_reduction, 2),
                "required_emissions_tco2e": round(required_emissions, 0),
                "projected_emissions_tco2e": round(projected_emissions, 0),
                "gap_tco2e": round(gap, 0),
                "on_track": on_track,
                "offset_used_tco2e": offset_used_tco2e,
                "abatement_cost_usd_per_tco2e": abatement_cost_usd,
                "created_at": datetime.utcnow().isoformat(),
            })
        return records

    # ── calculate_temperature_score ───────────────────────────────────────────

    def calculate_temperature_score(
        self,
        entity_id: str,
        scope1: float,
        scope2: float,
        scope3: float,
        reduction_targets: Dict,
        portfolio_coverage_pct: Optional[float] = None,
    ) -> Dict:
        """Calculate implied portfolio/entity temperature score.

        The implied temperature is driven by the 2030 reduction target. If the
        caller supplies no reduction target, the score cannot be computed and an
        honest ``insufficient_data`` result is returned rather than a fabricated
        temperature derived from a random reduction figure.

        Optional:
          portfolio_coverage_pct : % of AUM/portfolio covered by the target set.
              Real caller input; null when not provided.
        """
        reduction_targets = reduction_targets or {}
        reduction_pct_2030 = reduction_targets.get("pct_2030")
        reduction_pct_2050 = reduction_targets.get("pct_2050")

        total_emissions = scope1 + scope2 + scope3
        scope3_share = (scope3 / total_emissions * 100) if total_emissions > 0 else 0
        coverage = round(portfolio_coverage_pct, 1) if portfolio_coverage_pct is not None else None

        # Without a 2030 reduction target the temperature score is undefined.
        if reduction_pct_2030 is None:
            return {
                "entity_id": entity_id,
                "total_emissions_tco2e": round(total_emissions, 0),
                "scope1_tco2e": round(scope1, 0),
                "scope2_tco2e": round(scope2, 0),
                "scope3_tco2e": round(scope3, 0),
                "scope3_share_pct": round(scope3_share, 1),
                "reduction_pct_2030": None,
                "reduction_pct_2050": round(reduction_pct_2050, 1) if reduction_pct_2050 is not None else None,
                "implied_temperature_c": None,
                "temperature_classification": "insufficient_data",
                "sbti_pathway": "insufficient",
                "alignment_status": "insufficient_data",
                "warming_gap_c": None,
                "portfolio_coverage_pct": coverage,
                "calculated_at": datetime.utcnow().isoformat(),
            }

        temp_result = self._derive_temperature_score(reduction_pct_2030)
        sbti_pathway = self._derive_pathway(reduction_pct_2030)

        alignment = "Paris aligned" if temp_result["temperature_c"] <= 1.7 else (
            "Below 2°C" if temp_result["temperature_c"] <= 2.0 else "Not aligned"
        )

        return {
            "entity_id": entity_id,
            "total_emissions_tco2e": round(total_emissions, 0),
            "scope1_tco2e": round(scope1, 0),
            "scope2_tco2e": round(scope2, 0),
            "scope3_tco2e": round(scope3, 0),
            "scope3_share_pct": round(scope3_share, 1),
            "reduction_pct_2030": round(reduction_pct_2030, 1),
            "reduction_pct_2050": round(reduction_pct_2050, 1) if reduction_pct_2050 is not None else None,
            "implied_temperature_c": temp_result["temperature_c"],
            "temperature_classification": temp_result["classification"],
            "sbti_pathway": sbti_pathway,
            "alignment_status": alignment,
            "warming_gap_c": round(max(0, temp_result["temperature_c"] - 1.5), 2),
            "portfolio_coverage_pct": coverage,
            "calculated_at": datetime.utcnow().isoformat(),
        }

    # ── check_framework_compliance ────────────────────────────────────────────

    def check_framework_compliance(
        self,
        entity_id: str,
        entity_type: str,
        framework: str,
        assessment_data: Dict,
    ) -> Dict:
        """Check detailed compliance against a specific framework."""
        cfg = FRAMEWORK_CONFIGS.get(framework, FRAMEWORK_CONFIGS["combined"])

        gaps = []
        warnings = []

        reduction_pct = assessment_data.get("near_term_reduction_pct", 0)
        lt_pct = assessment_data.get("long_term_reduction_pct")
        scope3_cov = assessment_data.get("scope3_coverage_pct")

        min_near = cfg.get("near_term_min_reduction_pct", 42)
        min_long = cfg.get("long_term_min_reduction_pct", 90)

        if reduction_pct < min_near:
            gaps.append(f"Near-term reduction {reduction_pct:.1f}% is below {framework.upper()} minimum of {min_near}%")
        if lt_pct is not None and lt_pct < min_long:
            gaps.append(f"Long-term reduction {lt_pct:.1f}% is below {framework.upper()} minimum of {min_long}%")
        elif lt_pct is None:
            warnings.append(f"Long-term reduction target not provided — cannot confirm {framework.upper()} long-term alignment")
        if scope3_cov is None:
            warnings.append(f"Scope 3 coverage not provided — recommend reporting coverage for full {framework.upper()} alignment")
        elif scope3_cov < 67:
            warnings.append(f"Scope 3 coverage {scope3_cov:.1f}% — recommend >67% for full {framework.upper()} alignment")
        if not assessment_data.get("sbti_validated", False) and cfg.get("validation_required", False):
            gaps.append(f"{framework.upper()} requires third-party SBTi validation — not yet obtained")

        # Deterministic compliance score: 100 minus penalties per open item.
        compliance_pct = max(0, 100 - len(gaps) * 20 - len(warnings) * 5)
        compliance_pct = round(min(100, compliance_pct), 1)

        return {
            "entity_id": entity_id,
            "framework": framework,
            "compliance_pct": compliance_pct,
            "compliant": compliance_pct >= 80,
            "gaps": gaps,
            "warnings": warnings,
            "next_steps": [
                "Increase near-term target ambition to meet SBTi minimums" if gaps else "Maintain trajectory",
                "Submit to SBTi for validation" if not assessment_data.get("sbti_validated") else "Validation complete",
                "Expand Scope 3 supplier engagement programme",
            ],
            "assessment_date": datetime.utcnow().isoformat(),
        }

    # ── run_full_assessment ───────────────────────────────────────────────────

    def run_full_assessment(
        self,
        entity_id: str,
        entity_type: str,
        framework: str,
        **kwargs,
    ) -> Dict:
        """Orchestrate full assessment including pathway generation.

        All quantitative inputs (emissions, scope split, reduction targets) must
        be supplied by the caller. Missing inputs are treated as honest zeros /
        nulls rather than fabricated with random values, so an under-specified
        request yields an under-specified (but truthful) assessment.
        """
        base_year = kwargs.get("base_year") or 2019

        # Emissions inputs: real caller values, else honest zero (no fabrication).
        base_emissions = kwargs.get("base_year_emissions")
        if base_emissions is None:
            base_emissions = 0.0
        scope1 = kwargs.get("scope1_tco2e")
        scope2 = kwargs.get("scope2_tco2e")
        scope3 = kwargs.get("scope3_tco2e")
        # If a scope split is not provided, do not invent one. Leave missing
        # scopes at 0 and, when at least one scope is given, treat scope3 as the
        # residual of the base total only if that keeps the sum non-negative.
        s1 = scope1 if scope1 is not None else 0.0
        s2 = scope2 if scope2 is not None else 0.0
        if scope3 is not None:
            s3 = scope3
        elif base_emissions and (scope1 is not None or scope2 is not None):
            s3 = max(0.0, base_emissions - s1 - s2)
        else:
            s3 = 0.0

        net_zero_year = kwargs.get("net_zero_target_year") or 2050
        near_term_year = kwargs.get("near_term_target_year") or 2030
        # Near-term reduction target: real caller value, else 0 (no target set).
        near_term_pct = kwargs.get("near_term_reduction_pct")
        if near_term_pct is None:
            near_term_pct = 0.0

        # Strip inputs we consume explicitly so assess_targets kwargs stay clean,
        # but preserve optional pass-through fields (entity_name, coverage, etc.).
        passthrough = {
            k: v for k, v in kwargs.items()
            if k not in {
                "base_year", "base_year_emissions", "scope1_tco2e", "scope2_tco2e",
                "scope3_tco2e", "net_zero_target_year", "near_term_target_year",
                "near_term_reduction_pct",
            }
        }

        assessment = self.assess_targets(
            entity_id=entity_id,
            entity_type=entity_type,
            framework=framework,
            base_year=base_year,
            base_year_emissions=base_emissions,
            scope1=s1,
            scope2=s2,
            scope3=s3,
            net_zero_target_year=net_zero_year,
            near_term_target_year=near_term_year,
            near_term_reduction_pct=near_term_pct,
            **passthrough,
        )

        # Long-term reduction: real caller value, else the assessment's null.
        reduction_2050 = kwargs.get("long_term_reduction_pct")

        pathway_records = self.generate_pathway(
            entity_id=entity_id,
            assessment_id=assessment["assessment_id"],
            base_year=base_year,
            base_emissions=base_emissions,
            net_zero_year=net_zero_year,
            reduction_pct_2030=near_term_pct,
            # Long-term pathway endpoint: use stated long-term target if given,
            # else fall back to the near-term reduction (flat beyond 2030) so the
            # pathway never invents deeper cuts than the entity has committed to.
            reduction_pct_2050=reduction_2050 if reduction_2050 is not None else near_term_pct,
            projected_emissions_by_year=kwargs.get("projected_emissions_by_year"),
            offset_plan_by_year=kwargs.get("offset_plan_by_year"),
            abatement_cost_by_year=kwargs.get("abatement_cost_by_year"),
        )

        compliance = self.check_framework_compliance(entity_id, entity_type, framework, assessment)

        return {
            **assessment,
            "pathway_records": pathway_records,
            "pathway_years": len(pathway_records),
            "compliance_check": compliance,
        }

    def get_reference_data(self) -> Dict:
        """Return all reference constants."""
        return {
            "frameworks": FRAMEWORK_CONFIGS,
            "pathways": SBTI_PATHWAYS,
            "temperature_benchmarks": TEMPERATURE_SCORE_BENCHMARKS,
            "sector_pathways": SECTOR_PATHWAYS,
            "validation_statuses": VALIDATION_STATUSES,
            "entity_types": ENTITY_TYPES,
        }
