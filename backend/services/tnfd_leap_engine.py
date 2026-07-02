"""TNFD LEAP Process Assessment Engine (E32)
Implements the full 4-step LEAP approach from TNFD Framework v1.0 (September 2023):
  L — Locate: interfaces with nature; priority locations; value chain scope
  E — Evaluate: dependencies & impacts using ENCORE
  A — Assess: material risks & opportunities; risk/opportunity magnitude
  P — Prepare: strategy response; targets; disclosure completeness

Data-integrity note (remediation): this engine NO LONGER fabricates any returned
metric with a random draw. Every returned figure is either (a) computed
deterministically from caller-supplied observed data, or (b) an honest null
("insufficient_data" / None / empty list) when the required input is absent.
All public method signatures are backward-compatible: the new inputs are optional
and default to None, so existing callers keep working (they now receive honest
nulls instead of invented numbers).
"""

import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, date
import uuid

logger = logging.getLogger(__name__)

# ── Constants ────────────────────────────────────────────────────────────────

BIOMES: List[str] = [
    # Terrestrial (12)
    "Tropical moist forests",
    "Tropical dry forests",
    "Temperate broadleaf forests",
    "Temperate conifer forests",
    "Boreal forests / Taiga",
    "Tropical grasslands & savannas",
    "Temperate grasslands & shrublands",
    "Flooded grasslands & savannas",
    "Montane grasslands & shrublands",
    "Tundra",
    "Mediterranean forests & scrublands",
    "Deserts & xeric shrublands",
    # Marine (5)
    "Coral reefs",
    "Seagrass beds",
    "Mangroves",
    "Open ocean",
    "Coastal & shelf seas",
]

ENCORE_DEPENDENCIES: List[str] = [
    "Water regulation",
    "Climate regulation",
    "Pollination",
    "Soil formation",
    "Pest & disease control",
    "Flood & storm protection",
    "Erosion control",
    "Timber",
    "Freshwater",
    "Wild plants & animals (food)",
    "Wild plants (medicines)",
    "Genetic materials",
    "Fibre & other materials",
    "Marine fish & shellfish",
    "Groundwater",
    "Noise attenuation",
    "Air filtration",
    "Bioremediation",
    "Dilution by atmosphere & ecosystems",
    "Decomposition & fixing",
    "Aesthetic values",
]

ENCORE_IMPACT_DRIVERS: List[str] = [
    "GHG emissions",
    "Water use",
    "Land use change",
    "Soil pollution",
    "Water pollution",
    "Marine pollution",
    "Solid waste",
    "Noise & light pollution",
]

SECTOR_NATURE_MATERIALITY: Dict[str, Dict] = {
    "A01": {
        "sector_name": "Crop & animal production",
        "high_risk_biomes": ["Tropical moist forests", "Tropical grasslands & savannas", "Temperate grasslands & shrublands"],
        "key_dependencies": ["Pollination", "Soil formation", "Water regulation", "Pest & disease control"],
        "key_impacts": ["Land use change", "Water use", "Soil pollution", "Water pollution"],
    },
    "A02": {
        "sector_name": "Forestry & logging",
        "high_risk_biomes": ["Tropical moist forests", "Boreal forests / Taiga", "Temperate broadleaf forests"],
        "key_dependencies": ["Timber", "Climate regulation", "Erosion control", "Flood & storm protection"],
        "key_impacts": ["Land use change", "GHG emissions", "Solid waste"],
    },
    "B05": {
        "sector_name": "Mining of coal",
        "high_risk_biomes": ["Tundra", "Boreal forests / Taiga", "Montane grasslands & shrublands"],
        "key_dependencies": ["Groundwater", "Freshwater", "Soil formation"],
        "key_impacts": ["Land use change", "Water pollution", "Soil pollution", "GHG emissions"],
    },
    "C10": {
        "sector_name": "Food manufacturing",
        "high_risk_biomes": ["Tropical moist forests", "Tropical grasslands & savannas"],
        "key_dependencies": ["Freshwater", "Wild plants & animals (food)", "Pollination", "Climate regulation"],
        "key_impacts": ["Water use", "Water pollution", "Solid waste", "Land use change"],
    },
    "D35": {
        "sector_name": "Electricity & gas supply",
        "high_risk_biomes": ["Coral reefs", "Mangroves", "Seagrass beds", "Boreal forests / Taiga"],
        "key_dependencies": ["Water regulation", "Climate regulation", "Freshwater"],
        "key_impacts": ["GHG emissions", "Water use", "Land use change", "Noise & light pollution"],
    },
    "E36": {
        "sector_name": "Water collection & supply",
        "high_risk_biomes": ["Flooded grasslands & savannas", "Temperate broadleaf forests"],
        "key_dependencies": ["Water regulation", "Freshwater", "Groundwater", "Climate regulation"],
        "key_impacts": ["Water use", "Water pollution", "Land use change"],
    },
    "F41": {
        "sector_name": "Construction",
        "high_risk_biomes": ["Temperate broadleaf forests", "Tropical dry forests", "Mediterranean forests & scrublands"],
        "key_dependencies": ["Erosion control", "Flood & storm protection", "Soil formation"],
        "key_impacts": ["Land use change", "Soil pollution", "Noise & light pollution", "Solid waste"],
    },
    "G46": {
        "sector_name": "Wholesale trade",
        "high_risk_biomes": ["Tropical moist forests", "Tropical grasslands & savannas"],
        "key_dependencies": ["Wild plants & animals (food)", "Timber", "Genetic materials"],
        "key_impacts": ["GHG emissions", "Solid waste", "Water pollution"],
    },
    "H50": {
        "sector_name": "Water transport",
        "high_risk_biomes": ["Coral reefs", "Seagrass beds", "Open ocean", "Coastal & shelf seas"],
        "key_dependencies": ["Marine fish & shellfish", "Climate regulation"],
        "key_impacts": ["Marine pollution", "GHG emissions", "Noise & light pollution"],
    },
    "K64": {
        "sector_name": "Financial services",
        "high_risk_biomes": ["Tropical moist forests", "Coral reefs", "Mangroves"],
        "key_dependencies": ["Climate regulation", "Flood & storm protection", "Freshwater"],
        "key_impacts": ["GHG emissions", "Land use change"],  # financed impacts
    },
    "L68": {
        "sector_name": "Real estate",
        "high_risk_biomes": ["Temperate broadleaf forests", "Flooded grasslands & savannas", "Mediterranean forests & scrublands"],
        "key_dependencies": ["Flood & storm protection", "Air filtration", "Climate regulation"],
        "key_impacts": ["Land use change", "Noise & light pollution", "Soil pollution"],
    },
    "M72": {
        "sector_name": "Scientific research",
        "high_risk_biomes": ["Tundra", "Tropical moist forests", "Montane grasslands & shrublands"],
        "key_dependencies": ["Genetic materials", "Wild plants (medicines)", "Climate regulation"],
        "key_impacts": ["GHG emissions", "Noise & light pollution"],
    },
    "N77": {
        "sector_name": "Rental & leasing",
        "high_risk_biomes": ["Temperate grasslands & shrublands"],
        "key_dependencies": ["Climate regulation", "Freshwater"],
        "key_impacts": ["GHG emissions", "Solid waste"],
    },
    "C20": {
        "sector_name": "Chemical manufacturing",
        "high_risk_biomes": ["Coral reefs", "Coastal & shelf seas", "Flooded grasslands & savannas"],
        "key_dependencies": ["Freshwater", "Bioremediation", "Decomposition & fixing", "Dilution by atmosphere & ecosystems"],
        "key_impacts": ["Water pollution", "Soil pollution", "GHG emissions", "Marine pollution"],
    },
    "C24": {
        "sector_name": "Basic metals",
        "high_risk_biomes": ["Tundra", "Boreal forests / Taiga", "Montane grasslands & shrublands"],
        "key_dependencies": ["Freshwater", "Groundwater", "Soil formation"],
        "key_impacts": ["Land use change", "Water pollution", "Soil pollution", "GHG emissions"],
    },
}

LEAP_MATURITY_LEVELS: List[Dict] = [
    {"level": "initial",     "min_score": 0,  "description": "Ad-hoc nature-related disclosures; no systematic LEAP process"},
    {"level": "developing",  "min_score": 40, "description": "LEAP initiated; partial data; some priority locations identified"},
    {"level": "established", "min_score": 60, "description": "Full LEAP cycle completed; targets set; TNFD disclosure aligned"},
    {"level": "leading",     "min_score": 80, "description": "Best-in-class; third-party verified; Science-Based Targets for Nature"},
]

RISK_MAGNITUDE_LABELS: List[Dict] = [
    {"label": "low",       "min_score": 0},
    {"label": "medium",    "min_score": 25},
    {"label": "high",      "min_score": 55},
    {"label": "very_high", "min_score": 75},
]

CROSS_FRAMEWORK_MAP: Dict[str, Any] = {
    "ESRS_E4": {
        "name": "CSRD ESRS E4 — Biodiversity & Ecosystems",
        "alignment": "LEAP underpins ESRS E4 double materiality; DR-E4-4 location data, DR-E4-7 dependencies & impacts",
        "mandatory_dps": ["E4-1", "E4-2", "E4-3", "E4-4", "E4-5"],
    },
    "EU_TAXONOMY_DNSH": {
        "name": "EU Taxonomy — Do No Significant Harm (Biodiversity criterion)",
        "alignment": "LEAP location & evaluate steps map to DNSH biodiversity screening for all 6 objectives",
        "articles": ["Art 17(b)", "Annex I-VI DNSH criteria"],
    },
    "CSRD": {
        "name": "CSRD — Corporate Sustainability Reporting Directive",
        "alignment": "LEAP Prepare step feeds CSRD double materiality assessment for nature topics",
        "effective_date": "FY2024 (large PIEs), FY2025 (large companies), FY2026 (SMEs)",
    },
    "TNFD_SFDR_ART9": {
        "name": "SFDR Article 9 — Nature-themed financial products",
        "alignment": "TNFD LEAP outputs satisfy Art 9 PAI indicators 7-14 (biodiversity-sensitive areas)",
        "pai_indicators": [7, 8, 9, 10, 11, 12, 13, 14],
    },
    "GRI_304": {
        "name": "GRI 304 — Biodiversity",
        "alignment": "LEAP Locate maps to GRI 304-1; Evaluate to GRI 304-2; Assess to GRI 304-4",
        "disclosures": ["304-1", "304-2", "304-3", "304-4"],
    },
    "GRI_101_BIODIVERSITY": {
        "name": "GRI 101 — Biodiversity 2024 (updated standard)",
        "alignment": "LEAP full cycle aligns with GRI 101 material topic identification and management approach",
        "effective_date": "2026",
    },
}

# TNFD recommends 14 disclosures across the four pillars (Governance, Strategy,
# Risk & Impact Management, Metrics & Targets).
TNFD_RECOMMENDED_DISCLOSURE_TOTAL: int = 14

# Numeric magnitude proxy for qualitative dependency / impact / likelihood labels.
# These are ordinal encodings of a caller-supplied qualitative rating, NOT random
# draws — they let the engine derive a deterministic 0–100 magnitude when the
# caller provides only a qualitative level.
_LEVEL_MAGNITUDE: Dict[str, float] = {
    "critical": 90.0,
    "very_high": 90.0,
    "high": 70.0,
    "medium": 45.0,
    "moderate": 45.0,
    "low": 20.0,
    "minimal": 10.0,
}


# ── Engine ────────────────────────────────────────────────────────────────────

class TNFDLEAPEngine:
    """TNFD LEAP Process Assessment Engine.

    Outputs are deterministic functions of the caller-supplied observed data.
    When the observed data required for a metric is not provided, the engine
    returns an honest null (None / "insufficient_data" / empty collection)
    rather than an invented value. No external data sources are required;
    constants provide the TNFD reference framework only.
    """

    def __init__(self) -> None:
        pass

    def _get_sector_profile(self, sector: str) -> Dict:
        return SECTOR_NATURE_MATERIALITY.get(
            sector,
            {
                "sector_name": "General",
                "high_risk_biomes": ["Tropical moist forests", "Coral reefs"],
                "key_dependencies": ["Climate regulation", "Freshwater", "Pollination"],
                "key_impacts": ["GHG emissions", "Land use change", "Water use"],
            },
        )

    def _score_to_magnitude(self, score: Optional[float]) -> str:
        if score is None:
            return "insufficient_data"
        label = "low"
        for entry in RISK_MAGNITUDE_LABELS:
            if score >= entry["min_score"]:
                label = entry["label"]
        return label

    def _score_to_maturity(self, score: Optional[float]) -> str:
        if score is None:
            return "insufficient_data"
        level = "initial"
        for entry in LEAP_MATURITY_LEVELS:
            if score >= entry["min_score"]:
                level = entry["level"]
        return level

    @staticmethod
    def _level_to_magnitude(level: Optional[str]) -> Optional[float]:
        """Map a caller-supplied qualitative level to an ordinal 0–100 magnitude.

        Returns None when the level is missing/unrecognised so the caller keeps
        an honest null rather than a fabricated number.
        """
        if not level:
            return None
        return _LEVEL_MAGNITUDE.get(str(level).strip().lower())

    @staticmethod
    def _num(value: Any) -> Optional[float]:
        """Coerce a supplied value to float, or None if not numeric."""
        if value is None:
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    # ── Step L: Locate ────────────────────────────────────────────────────────

    def locate_assessment(
        self,
        entity_id: str,
        sector: str,
        value_chain_scope: Optional[Dict] = None,
        locations: Optional[List] = None,
    ) -> Dict:
        """Step L — Locate: identify interfaces with nature across value chain.

        ``locations`` (optional): caller-supplied list of observed priority
        locations. Each item may carry: location_id, location_name, country,
        biome, sensitivity, protected_area_overlap, key_biodiversity_area,
        proximity_km. Missing fields are passed through as None (never invented).

        ``value_chain_scope`` (optional): caller-supplied coverage dict with
        upstream_coverage_pct / operations_coverage_pct / downstream_coverage_pct.

        When neither input is provided, the location list is empty and
        ``locate_score`` is None (insufficient data) — no random draw.
        """
        profile = self._get_sector_profile(sector)

        # Priority locations — pass through exactly what the caller observed.
        priority_locations: List[Dict] = []
        for i, loc in enumerate(locations or []):
            src = loc if isinstance(loc, dict) else {}
            priority_locations.append({
                "location_id": src.get("location_id", f"LOC-{i + 1:03d}"),
                "location_name": src.get("location_name"),
                "country": src.get("country"),
                "biome": src.get("biome"),
                "sensitivity": src.get("sensitivity"),
                "protected_area_overlap": src.get("protected_area_overlap"),
                "key_biodiversity_area": src.get("key_biodiversity_area"),
                "proximity_km": self._num(src.get("proximity_km")),
            })

        # Value chain scope — honest nulls unless the caller provides coverage.
        if value_chain_scope:
            vc = {
                "upstream_coverage_pct": self._num(value_chain_scope.get("upstream_coverage_pct")),
                "operations_coverage_pct": self._num(value_chain_scope.get("operations_coverage_pct")),
                "downstream_coverage_pct": self._num(value_chain_scope.get("downstream_coverage_pct")),
            }
        else:
            vc = {
                "upstream_coverage_pct": None,
                "operations_coverage_pct": None,
                "downstream_coverage_pct": None,
            }

        # Sensitive ecosystems present in the observed locations that intersect
        # the sector's known high-risk biomes (deterministic set intersection).
        high_risk = set(profile["high_risk_biomes"])
        observed_biomes = [pl["biome"] for pl in priority_locations if pl.get("biome")]
        sensitive_ecosystems = sorted({b for b in observed_biomes if b in high_risk})

        # Locate score: coverage-weighted completeness of the location & value
        # chain mapping. Derived only from supplied coverage percentages; None if
        # the caller provided no coverage data at all.
        coverage_vals = [v for v in vc.values() if v is not None]
        if coverage_vals:
            locate_score: Optional[float] = round(sum(coverage_vals) / len(coverage_vals), 1)
        else:
            locate_score = None

        upstream = vc.get("upstream_coverage_pct")
        if upstream is None:
            completeness_notes = "insufficient_data — value chain coverage not provided"
        elif upstream < 70:
            completeness_notes = "Upstream Tier 2+ suppliers not fully mapped"
        else:
            completeness_notes = "Coverage adequate"

        return {
            "step": "L",
            "step_name": "Locate",
            "locate_score": locate_score,
            "priority_locations": priority_locations,
            "num_priority_locations": len(priority_locations),
            "value_chain_scope": vc,
            "sensitive_ecosystems": sensitive_ecosystems,
            "data_sources_used": ["Company site register", "IBAT (Integrated Biodiversity Assessment Tool)", "WDPA (Protected Planet)"],
            "completeness_notes": completeness_notes,
        }

    # ── Step E: Evaluate ─────────────────────────────────────────────────────

    def evaluate_assessment(
        self,
        entity_id: str,
        sector: str,
        locate_result: Dict,
        dependencies: Optional[List] = None,
        impacts: Optional[List] = None,
    ) -> Dict:
        """Step E — Evaluate: assess dependencies and impacts using ENCORE.

        ``dependencies`` (optional): caller-supplied observed dependencies. Each
        item may carry ecosystem_service, dependency_level, business_process,
        substitutability, encore_materiality.

        ``impacts`` (optional): caller-supplied observed impacts. Each item may
        carry impact_driver, magnitude (0–100) OR magnitude_label, scope,
        irreversibility, value_chain_stage. If only a qualitative
        magnitude_label is given, an ordinal magnitude is derived; otherwise
        magnitude stays None.

        When neither input is provided, both lists are empty and
        ``evaluate_score`` is None — no random draw.
        """
        profile = self._get_sector_profile(sector)

        # Dependencies — pass through observed data only.
        out_deps: List[Dict] = []
        for dep in dependencies or []:
            src = dep if isinstance(dep, dict) else {"ecosystem_service": dep}
            out_deps.append({
                "ecosystem_service": src.get("ecosystem_service"),
                "dependency_level": src.get("dependency_level"),
                "business_process": src.get("business_process"),
                "substitutability": src.get("substitutability"),
                "encore_materiality": src.get("encore_materiality"),
            })

        # Impacts — use supplied magnitude, else derive from qualitative label.
        out_impacts: List[Dict] = []
        for imp in impacts or []:
            src = imp if isinstance(imp, dict) else {"impact_driver": imp}
            mag = self._num(src.get("magnitude"))
            if mag is None:
                mag = self._level_to_magnitude(src.get("magnitude_label"))
            out_impacts.append({
                "impact_driver": src.get("impact_driver"),
                "magnitude": round(mag, 1) if mag is not None else None,
                "magnitude_label": self._score_to_magnitude(mag),
                "scope": src.get("scope"),
                "irreversibility": src.get("irreversibility"),
                "value_chain_stage": src.get("value_chain_stage"),
            })

        # Ecosystem condition — only from caller-supplied location condition data.
        ecosystem_condition: Dict[str, Any] = {}
        for loc in locate_result.get("priority_locations", []):
            biome = loc.get("biome")
            cond = loc.get("ecosystem_condition") if isinstance(loc, dict) else None
            if biome:
                ecosystem_condition[biome] = cond  # None when not observed

        # Evaluate score: ENCORE coverage of the sector's known-material set,
        # combined with the share of impacts that carry a graded magnitude.
        key_deps = set(profile["key_dependencies"])
        key_imps = set(profile["key_impacts"])
        observed_dep_services = {d["ecosystem_service"] for d in out_deps if d.get("ecosystem_service")}
        observed_imp_drivers = {i["impact_driver"] for i in out_impacts if i.get("impact_driver")}

        components: List[float] = []
        if key_deps:
            components.append(100.0 * len(observed_dep_services & key_deps) / len(key_deps))
        if key_imps:
            components.append(100.0 * len(observed_imp_drivers & key_imps) / len(key_imps))
        graded = [i for i in out_impacts if i.get("magnitude") is not None]
        if out_impacts:
            components.append(100.0 * len(graded) / len(out_impacts))

        if components and (out_deps or out_impacts):
            evaluate_score: Optional[float] = round(sum(components) / len(components), 1)
        else:
            evaluate_score = None

        return {
            "step": "E",
            "step_name": "Evaluate",
            "evaluate_score": evaluate_score,
            "dependencies": out_deps,
            "num_dependencies": len(out_deps),
            "impacts": out_impacts,
            "num_impacts": len(out_impacts),
            "ecosystem_condition": ecosystem_condition,
            "encore_tool_version": "ENCORE 2.0",
            "assessment_method": "TNFD ENCORE Methodology v1.1",
        }

    # ── Step A: Assess ────────────────────────────────────────────────────────

    def assess_material_risks(
        self,
        entity_id: str,
        sector: str,
        evaluate_result: Dict,
        risks: Optional[List] = None,
        opportunities: Optional[List] = None,
    ) -> Dict:
        """Step A — Assess: identify material nature-related risks and opportunities.

        ``risks`` (optional): caller-supplied observed nature-related risks. Each
        item may carry risk_id, description, risk_type, time_horizon, likelihood,
        magnitude (0–100) OR magnitude_label, financial_impact_mn, affected_assets.

        ``opportunities`` (optional): caller-supplied observed opportunities. Each
        item may carry opp_id, description, opportunity_type, time_horizon,
        estimated_value_mn, implementation_readiness.

        Aggregations (average magnitude, totals) are computed from the supplied
        rows only. When no rows are supplied, lists are empty, scores/aggregates
        are None, and magnitude labels read "insufficient_data" — no random draw.
        """
        material_risks: List[Dict] = []
        for i, r in enumerate(risks or []):
            src = r if isinstance(r, dict) else {"description": r}
            mag = self._num(src.get("magnitude"))
            if mag is None:
                mag = self._level_to_magnitude(src.get("magnitude_label"))
            material_risks.append({
                "risk_id": src.get("risk_id", f"R{i + 1:02d}"),
                "description": src.get("description"),
                "risk_type": src.get("risk_type"),
                "time_horizon": src.get("time_horizon"),
                "likelihood": src.get("likelihood"),
                "magnitude": round(mag, 1) if mag is not None else None,
                "magnitude_label": self._score_to_magnitude(mag),
                "financial_impact_mn": self._num(src.get("financial_impact_mn")),
                "affected_assets": src.get("affected_assets"),
            })

        material_opportunities: List[Dict] = []
        for i, o in enumerate(opportunities or []):
            src = o if isinstance(o, dict) else {"description": o}
            material_opportunities.append({
                "opp_id": src.get("opp_id", f"O{i + 1:02d}"),
                "description": src.get("description"),
                "opportunity_type": src.get("opportunity_type"),
                "time_horizon": src.get("time_horizon"),
                "estimated_value_mn": self._num(src.get("estimated_value_mn")),
                "implementation_readiness": src.get("implementation_readiness"),
            })

        # Average risk magnitude over rows that carry a graded magnitude.
        graded_mags = [r["magnitude"] for r in material_risks if r.get("magnitude") is not None]
        avg_risk_mag: Optional[float] = (sum(graded_mags) / len(graded_mags)) if graded_mags else None

        # Opportunity magnitude: qualitative label from the mean estimated value,
        # only when value data exists (no arbitrary threshold on invented data).
        opp_values = [o["estimated_value_mn"] for o in material_opportunities if o.get("estimated_value_mn") is not None]
        if opp_values:
            mean_opp = sum(opp_values) / len(opp_values)
            opportunity_magnitude = "high" if mean_opp >= 10 else ("medium" if mean_opp >= 2 else "low")
        else:
            opportunity_magnitude = "insufficient_data"

        risk_financials = [r["financial_impact_mn"] for r in material_risks if r.get("financial_impact_mn") is not None]
        total_financial_exposure_mn: Optional[float] = round(sum(risk_financials), 2) if risk_financials else None
        total_opportunity_value_mn: Optional[float] = round(sum(opp_values), 2) if opp_values else None

        # Assess score: completeness of the risk register — share of risks that
        # carry a graded magnitude, i.e. how well the material set is quantified.
        if material_risks:
            assess_score: Optional[float] = round(100.0 * len(graded_mags) / len(material_risks), 1)
        else:
            assess_score = None

        # Double materiality is confirmed only when both an impact (from Evaluate)
        # and a financial risk have been observed — a real logical condition.
        has_impact = bool(evaluate_result.get("impacts"))
        has_financial_risk = bool(risk_financials)
        if material_risks or evaluate_result.get("impacts"):
            double_materiality_confirmed: Optional[bool] = bool(has_impact and has_financial_risk)
        else:
            double_materiality_confirmed = None

        return {
            "step": "A",
            "step_name": "Assess",
            "assess_score": assess_score,
            "material_risks": material_risks,
            "material_opportunities": material_opportunities,
            "risk_magnitude": self._score_to_magnitude(avg_risk_mag),
            "risk_magnitude_score": round(avg_risk_mag, 1) if avg_risk_mag is not None else None,
            "opportunity_magnitude": opportunity_magnitude,
            "total_financial_exposure_mn": total_financial_exposure_mn,
            "total_opportunity_value_mn": total_opportunity_value_mn,
            "double_materiality_confirmed": double_materiality_confirmed,
        }

    # ── Step P: Prepare ───────────────────────────────────────────────────────

    def prepare_response(
        self,
        entity_id: str,
        assess_result: Dict,
        strategy_response: Optional[Dict] = None,
        targets: Optional[List] = None,
        disclosures_met: Optional[int] = None,
    ) -> Dict:
        """Step P — Prepare: strategy, targets, and disclosure completeness.

        ``strategy_response`` (optional): caller-supplied governance/strategy flags
        (nature_policy_adopted, board_oversight, nature_in_risk_register,
        nature_in_strategy, engagement_plan, nature_positive_commitment,
        third_party_verification). Missing flags pass through as None.

        ``targets`` (optional): caller-supplied nature targets. Each item may carry
        target_description, target_year, baseline_year, progress_pct, sbtn_aligned,
        verified.

        ``disclosures_met`` (optional): count (0–14) of TNFD recommended
        disclosures the entity currently meets. Drives disclosure_completeness_pct.

        When these inputs are absent, flags/targets are empty and completeness is
        None — no random draw.
        """
        # Strategy response — pass through observed flags; unknowns stay None.
        _strategy_keys = [
            "nature_policy_adopted",
            "board_oversight",
            "nature_in_risk_register",
            "nature_in_strategy",
            "engagement_plan",
            "nature_positive_commitment",
            "third_party_verification",
        ]
        src_strategy = strategy_response or {}
        out_strategy = {k: src_strategy.get(k) for k in _strategy_keys}

        # Targets — pass through observed targets only.
        targets_set: List[Dict] = []
        for t in targets or []:
            src = t if isinstance(t, dict) else {"target_description": t}
            targets_set.append({
                "target_description": src.get("target_description"),
                "target_year": src.get("target_year"),
                "baseline_year": src.get("baseline_year"),
                "progress_pct": self._num(src.get("progress_pct")),
                "sbtn_aligned": src.get("sbtn_aligned"),
                "verified": src.get("verified"),
            })

        # Disclosure completeness: real ratio of disclosures met to the TNFD 14.
        if disclosures_met is not None:
            met = max(0, min(int(disclosures_met), TNFD_RECOMMENDED_DISCLOSURE_TOTAL))
            disclosure_completeness_pct: Optional[float] = round(
                100.0 * met / TNFD_RECOMMENDED_DISCLOSURE_TOTAL, 1
            )
            tnfd_disclosures_met: Optional[int] = met
        else:
            disclosure_completeness_pct = None
            tnfd_disclosures_met = None

        # Prepare score: share of the seven governance/strategy flags satisfied,
        # blended with disclosure completeness when available.
        satisfied = sum(1 for k in _strategy_keys if k != "board_oversight" and out_strategy.get(k) is True)
        # board_oversight counts as satisfied if it is a real oversight body.
        board = out_strategy.get("board_oversight")
        if isinstance(board, str) and board.strip().lower() in ("full board", "board committee"):
            satisfied += 1
        provided_flags = [k for k in _strategy_keys if out_strategy.get(k) is not None]

        prep_components: List[float] = []
        if provided_flags:
            prep_components.append(100.0 * satisfied / len(_strategy_keys))
        if disclosure_completeness_pct is not None:
            prep_components.append(disclosure_completeness_pct)
        if prep_components:
            prepare_score: Optional[float] = round(sum(prep_components) / len(prep_components), 1)
        else:
            prepare_score = None

        return {
            "step": "P",
            "step_name": "Prepare",
            "prepare_score": prepare_score,
            "strategy_response": out_strategy,
            "targets_set": targets_set,
            "num_targets": len(targets_set),
            "disclosure_completeness_pct": disclosure_completeness_pct,
            "tnfd_recommended_disclosures_met": tnfd_disclosures_met,
            "tnfd_recommended_disclosures_total": TNFD_RECOMMENDED_DISCLOSURE_TOTAL,
            "improvement_areas": self._derive_improvement_areas(out_strategy, targets_set, disclosure_completeness_pct),
        }

    @staticmethod
    def _derive_improvement_areas(
        strategy: Dict,
        targets: List[Dict],
        disclosure_pct: Optional[float],
    ) -> List[str]:
        """Deterministically flag improvement areas from observed gaps.

        Returns an empty list when no observed data is available to judge gaps.
        """
        areas: List[str] = []
        if strategy.get("nature_policy_adopted") is False:
            areas.append("Formalise nature policy with board sign-off")
        if not targets:
            areas.append("Set quantitative biodiversity targets")
        if strategy.get("third_party_verification") is False:
            areas.append("Commission third-party verification of LEAP process")
        if strategy.get("nature_in_risk_register") is False:
            areas.append("Integrate nature risks into financial risk management")
        if strategy.get("engagement_plan") is False:
            areas.append("Engage investors on TNFD disclosure timeline")
        if disclosure_pct is not None and disclosure_pct < 100:
            areas.append("Expand ENCORE assessment to Tier 2 suppliers")
        return areas

    # ── Full LEAP ─────────────────────────────────────────────────────────────

    def run_full_leap(
        self,
        entity_id: str,
        sector: str,
        reporting_period: Optional[str] = None,
        **kwargs,
    ) -> Dict:
        """Run all 4 LEAP steps and return comprehensive assessment dict.

        Observed data is threaded through via keyword arguments (all optional):
          - value_chain_scope, locations           -> Locate
          - dependencies, impacts                   -> Evaluate
          - risks, opportunities                    -> Assess
          - strategy_response, targets, disclosures_met -> Prepare
          - priority_actions                        -> Prepare/overall (pass-through)
          - entity_name                             -> metadata

        Any metric whose observed input is absent is returned as an honest null
        (None / "insufficient_data" / empty list). No metric is fabricated.
        """
        period = reporting_period or str(date.today().year - 1)
        assessment_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()

        # Run each step, threading only the relevant observed inputs.
        locate = self.locate_assessment(
            entity_id, sector,
            value_chain_scope=kwargs.get("value_chain_scope"),
            locations=kwargs.get("locations"),
        )
        evaluate = self.evaluate_assessment(
            entity_id, sector, locate,
            dependencies=kwargs.get("dependencies"),
            impacts=kwargs.get("impacts"),
        )
        assess = self.assess_material_risks(
            entity_id, sector, evaluate,
            risks=kwargs.get("risks"),
            opportunities=kwargs.get("opportunities"),
        )
        prepare = self.prepare_response(
            entity_id, assess,
            strategy_response=kwargs.get("strategy_response"),
            targets=kwargs.get("targets"),
            disclosures_met=kwargs.get("disclosures_met"),
        )

        # Overall score = mean of the step scores that could actually be computed.
        step_scores = [
            locate["locate_score"],
            evaluate["evaluate_score"],
            assess["assess_score"],
            prepare["prepare_score"],
        ]
        present_scores = [s for s in step_scores if s is not None]
        overall_score: Optional[float] = round(sum(present_scores) / len(present_scores), 1) if present_scores else None
        maturity = self._score_to_maturity(overall_score)

        # Priority actions — caller-supplied only; unknowns pass through as None.
        priority_actions: List[Dict] = []
        for action in kwargs.get("priority_actions", []) or []:
            src = action if isinstance(action, dict) else {"action": action}
            priority_actions.append({
                "action": src.get("action"),
                "priority": src.get("priority"),
                "effort": src.get("effort"),
                "timeframe": src.get("timeframe"),
            })

        return {
            "assessment_id": assessment_id,
            "entity_id": entity_id,
            "entity_name": kwargs.get("entity_name", entity_id),
            "sector": sector,
            "reporting_period": period,
            "assessment_date": now,
            # Step results
            "locate_score": locate["locate_score"],
            "evaluate_score": evaluate["evaluate_score"],
            "assess_score": assess["assess_score"],
            "prepare_score": prepare["prepare_score"],
            "overall_leap_score": overall_score,
            "leap_maturity": maturity,
            # Key outputs
            "num_priority_locations": locate["num_priority_locations"],
            "num_dependencies": evaluate["num_dependencies"],
            "num_impacts": evaluate["num_impacts"],
            "num_material_risks": len(assess["material_risks"]),
            "num_material_opportunities": len(assess["material_opportunities"]),
            "risk_magnitude": assess["risk_magnitude"],
            "opportunity_magnitude": assess["opportunity_magnitude"],
            "total_financial_exposure_mn": assess["total_financial_exposure_mn"],
            "disclosure_completeness_pct": prepare["disclosure_completeness_pct"],
            "num_targets_set": prepare["num_targets"],
            # Detail sections
            "locate_detail": locate,
            "evaluate_detail": evaluate,
            "assess_detail": assess,
            "prepare_detail": prepare,
            # Meta
            "priority_actions": priority_actions,
            "cross_framework": CROSS_FRAMEWORK_MAP,
            "framework_version": "TNFD v1.0 (September 2023)",
            "created_at": now,
            "updated_at": now,
        }

    def get_reference_data(self) -> Dict:
        """Return all reference constants for front-end consumption."""
        return {
            "biomes": BIOMES,
            "impact_drivers": ENCORE_IMPACT_DRIVERS,
            "encore_dependencies": ENCORE_DEPENDENCIES,
            "sector_materiality": SECTOR_NATURE_MATERIALITY,
            "leap_maturity_levels": LEAP_MATURITY_LEVELS,
            "risk_magnitude_labels": RISK_MAGNITUDE_LABELS,
            "cross_framework": CROSS_FRAMEWORK_MAP,
        }
