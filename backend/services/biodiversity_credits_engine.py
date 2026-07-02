"""
Biodiversity Credits Engine — Sprint 26
=========================================
Standards covered:
- UK BNG Environment Act 2021 (DEFRA Metric 4.0)
- EU Nature Restoration Law 2024/1991
- Science Based Targets for Nature (SBTN) v1.1
- TNFD LEAP v1.0 advanced metrics
- Biodiversity Credit Alliance (BCA) 2023
- IPBES Global Assessment
- Living Planet Index
- IUCN Red List

Remediation note (random-as-data removal)
-----------------------------------------
Every RETURNED metric is now either (a) a real deterministic computation from
reference data + caller-supplied inputs, or (b) an explicit honest null when the
required observation is not supplied (with a ``*_basis`` / ``data_sufficiency``
flag). No metric is produced by a random draw. New inputs are all optional and
default to ``None`` for backward compatibility. Deterministic attenuation factors
in the SBTN cascade are documented model assumptions, flagged as ``"modeled"``.
"""
from __future__ import annotations

from typing import Any, Optional

# ---------------------------------------------------------------------------
# Reference data
# ---------------------------------------------------------------------------

HABITAT_DISTINCTIVENESS: dict[str, float] = {
    "woodland": 6.0,
    "grassland": 5.0,
    "heathland": 5.5,
    "wetland": 6.0,
    "marine": 6.0,
    "freshwater": 5.5,
    "agroforestry": 4.0,
    "urban_greenspace": 2.5,
    "hedgerows": 4.5,
    "rivers": 5.0,
}

HABITAT_CONDITION_MULTIPLIERS: dict[str, float] = {
    "poor": 0.5,
    "moderate": 0.7,
    "good": 1.0,
    "excellent": 1.3,
}

# DEFRA Metric 4.0 strategic significance multipliers (documented model constants).
# Used only when the caller does not supply an observed strategic_significance.
# "Low" (1.0) = area not in a strategically significant location — the neutral baseline.
DEFRA_STRATEGIC_SIGNIFICANCE_DEFAULT: float = 1.0

SBTN_FRESHWATER_TARGETS: dict[str, dict[str, Any]] = {
    "abstraction": {
        "description": "Water abstraction levels relative to environmental flow requirements",
        "2030_target_reduction_pct": 30.0,
        "unit": "% above EFR",
    },
    "pollution": {
        "description": "Reduction in nutrient / chemical pollution loads",
        "2030_target_reduction_pct": 50.0,
        "unit": "kg N/P per ha",
    },
    "hydromorphology": {
        "description": "Restoration of natural flow regimes and channel morphology",
        "2030_target_restoration_pct": 25.0,
        "unit": "% channel naturalised",
    },
    "invasives": {
        "description": "Control and removal of invasive non-native species",
        "2030_target_control_pct": 40.0,
        "unit": "% coverage controlled",
    },
    "overexploitation": {
        "description": "Fisheries and aquatic species harvesting limits",
        "2030_target_reduction_pct": 20.0,
        "unit": "% above MSY",
    },
}

EU_NRL_ECOSYSTEM_TARGETS: dict[str, dict[str, Any]] = {
    "coastal_lagoons": {"article": 4, "2030_pct": 30, "2040_pct": 60, "2050_pct": 90, "condition_metric": "IES"},
    "saltmarsh": {"article": 4, "2030_pct": 30, "2040_pct": 60, "2050_pct": 90, "condition_metric": "IES"},
    "dunes": {"article": 4, "2030_pct": 30, "2040_pct": 60, "2050_pct": 90, "condition_metric": "IES"},
    "mires_bogs": {"article": 4, "2030_pct": 30, "2040_pct": 60, "2050_pct": 90, "condition_metric": "IES"},
    "temperate_heath": {"article": 4, "2030_pct": 30, "2040_pct": 60, "2050_pct": 90, "condition_metric": "IES"},
    "alpine_heath": {"article": 4, "2030_pct": 30, "2040_pct": 60, "2050_pct": 90, "condition_metric": "IES"},
    "natural_grassland": {"article": 4, "2030_pct": 30, "2040_pct": 60, "2050_pct": 90, "condition_metric": "IES"},
    "calcareous_grassland": {"article": 4, "2030_pct": 30, "2040_pct": 60, "2050_pct": 90, "condition_metric": "IES"},
    "atlantic_oak_woodland": {"article": 4, "2030_pct": 30, "2040_pct": 60, "2050_pct": 90, "condition_metric": "IES"},
    "riparian_forest": {"article": 4, "2030_pct": 30, "2040_pct": 60, "2050_pct": 90, "condition_metric": "IES"},
    "rivers_lakes": {"article": 7, "2030_pct": 30, "2040_pct": 60, "2050_pct": 90, "condition_metric": "EQR"},
    "floodplains": {"article": 7, "2030_pct": 30, "2040_pct": 60, "2050_pct": 90, "condition_metric": "EQR"},
    "alluvial_forests": {"article": 7, "2030_pct": 30, "2040_pct": 60, "2050_pct": 90, "condition_metric": "IES"},
    "farmland": {"article": 9, "2030_pct": 10, "2040_pct": 20, "2050_pct": 30, "condition_metric": "FBI"},
    "forest": {"article": 10, "2030_pct": 20, "2040_pct": 40, "2050_pct": 60, "condition_metric": "IES"},
    "urban_ecosystem": {"article": 6, "2030_pct": 0, "2040_pct": 10, "2050_pct": 20, "condition_metric": "UGI"},
    "marine_benthic": {"article": 12, "2030_pct": 20, "2040_pct": 40, "2050_pct": 60, "condition_metric": "BHQ"},
    "seagrass": {"article": 12, "2030_pct": 30, "2040_pct": 60, "2050_pct": 90, "condition_metric": "BHQ"},
    "kelp_forest": {"article": 12, "2030_pct": 30, "2040_pct": 60, "2050_pct": 90, "condition_metric": "BHQ"},
    "coral_reef": {"article": 12, "2030_pct": 30, "2040_pct": 60, "2050_pct": 90, "condition_metric": "BHQ"},
}

BIODIVERSITY_CREDIT_PRICES: dict[str, dict[str, Any]] = {
    "woodland": {"uk_bng_gbp": 28000.0, "eu_habitat_eur": 32000.0, "voluntary_usd": 20000.0, "liquidity": "high"},
    "grassland": {"uk_bng_gbp": 15000.0, "eu_habitat_eur": 18000.0, "voluntary_usd": 12000.0, "liquidity": "medium"},
    "heathland": {"uk_bng_gbp": 18000.0, "eu_habitat_eur": 20000.0, "voluntary_usd": 14000.0, "liquidity": "medium"},
    "wetland": {"uk_bng_gbp": 32000.0, "eu_habitat_eur": 38000.0, "voluntary_usd": 28000.0, "liquidity": "high"},
    "marine": {"uk_bng_gbp": 22000.0, "eu_habitat_eur": 26000.0, "voluntary_usd": 18000.0, "liquidity": "low"},
    "freshwater": {"uk_bng_gbp": 20000.0, "eu_habitat_eur": 24000.0, "voluntary_usd": 16000.0, "liquidity": "medium"},
    "agroforestry": {"uk_bng_gbp": 12000.0, "eu_habitat_eur": 14000.0, "voluntary_usd": 9000.0, "liquidity": "medium"},
    "urban_greenspace": {"uk_bng_gbp": 8000.0, "eu_habitat_eur": 9000.0, "voluntary_usd": 6000.0, "liquidity": "high"},
    "hedgerows": {"uk_bng_gbp": 10000.0, "eu_habitat_eur": 12000.0, "voluntary_usd": 8000.0, "liquidity": "medium"},
    "rivers": {"uk_bng_gbp": 25000.0, "eu_habitat_eur": 30000.0, "voluntary_usd": 22000.0, "liquidity": "medium"},
}

TNFD_METRICS: list[dict[str, Any]] = [
    {"name": "species_richness_delta", "unit": "index", "description": "Change in native species richness per km²"},
    {"name": "mean_species_abundance", "unit": "MSA 0-1", "description": "Mean species abundance relative to pristine baseline"},
    {"name": "habitat_intactness_index", "unit": "HII 0-1", "description": "Intactness of natural habitat relative to intact reference"},
    {"name": "functional_diversity", "unit": "FDiv", "description": "Functional trait diversity of ecological community"},
    {"name": "connectivity_index", "unit": "0-100", "description": "Habitat connectivity and fragmentation score"},
    {"name": "ecosystem_services_value", "unit": "USD/ha/yr", "description": "Total ecosystem services economic value per hectare"},
    {"name": "invasive_species_pressure", "unit": "0-10", "description": "Pressure from invasive non-native species"},
    {"name": "water_quality_index", "unit": "WQI 0-100", "description": "Freshwater quality composite index"},
    {"name": "soil_organic_carbon", "unit": "tC/ha", "description": "Soil organic carbon stock"},
    {"name": "pollinator_diversity", "unit": "species count", "description": "Number of wild pollinator species recorded"},
    {"name": "edge_effect_ratio", "unit": "km edge/km²", "description": "Ratio of habitat edge to core area"},
    {"name": "natural_disturbance_regime", "unit": "0-10", "description": "Naturalness of disturbance regime (fire, flood)"},
    {"name": "protected_area_overlap", "unit": "%", "description": "Percentage of operations within protected areas"},
    {"name": "iucn_species_threat_index", "unit": "0-10", "description": "Weighted IUCN threat score for dependent species"},
]

IUCN_ECOSYSTEM_RED_LIST: dict[str, dict[str, Any]] = {
    "Collapsed": {"code": "CO", "description": "Ecosystem no longer functionally active", "priority": 1},
    "Critical": {"code": "CR", "description": "Facing extremely high risk of collapse", "priority": 2},
    "Endangered": {"code": "EN", "description": "Facing very high risk of collapse", "priority": 3},
    "Vulnerable": {"code": "VU", "description": "Facing high risk of collapse", "priority": 4},
    "Near_Threatened": {"code": "NT", "description": "Close to qualifying for threatened category", "priority": 5},
    "Least_Concern": {"code": "LC", "description": "Not facing elevated risk of collapse", "priority": 6},
    "Data_Deficient": {"code": "DD", "description": "Inadequate information to assess risk", "priority": 7},
    "Not_Evaluated": {"code": "NE", "description": "Not yet evaluated against criteria", "priority": 8},
}


# ---------------------------------------------------------------------------
# Engine class
# ---------------------------------------------------------------------------

class BiodiversityCreditsEngine:
    """Sprint 26 Biodiversity Credits Engine implementing BNG / SBTN / EU NRL / TNFD."""

    # ------------------------------------------------------------------
    # 1. BNG (Biodiversity Net Gain) assessment
    # ------------------------------------------------------------------
    def assess_bng(
        self,
        entity_id: str,
        habitat_type: str,
        area_ha: float,
        baseline_condition: str,
        post_condition: str,
        distinctiveness_override: Optional[float] = None,
        strategic_significance: Optional[float] = None,
    ) -> dict:
        distinctiveness = distinctiveness_override if distinctiveness_override is not None else HABITAT_DISTINCTIVENESS.get(habitat_type, 3.0)
        baseline_cond_mult = HABITAT_CONDITION_MULTIPLIERS.get(baseline_condition, 0.7)
        post_cond_mult = HABITAT_CONDITION_MULTIPLIERS.get(post_condition, 1.0)

        # DEFRA Metric 4.0 strategic significance multiplier (1.0-1.5). When the
        # caller supplies an observed value we use it directly; otherwise we apply
        # the documented neutral baseline of 1.0 ("Low" strategic significance) —
        # a model default, not a fabricated per-entity figure.
        if strategic_significance is not None:
            ss = round(max(1.0, min(1.5, float(strategic_significance))), 2)
            strategic_significance_basis = "provided"
        else:
            ss = DEFRA_STRATEGIC_SIGNIFICANCE_DEFAULT
            strategic_significance_basis = "default_defra_low"

        baseline_units = round(area_ha * distinctiveness * baseline_cond_mult * ss, 2)
        post_units = round(area_ha * distinctiveness * post_cond_mult * ss, 2)
        net_gain_units = round(post_units - baseline_units, 2)
        net_gain_pct = round((net_gain_units / max(0.001, baseline_units)) * 100, 2)

        compliant_10pct = net_gain_pct >= 10.0

        prices = BIODIVERSITY_CREDIT_PRICES.get(habitat_type, BIODIVERSITY_CREDIT_PRICES["grassland"])
        credit_value_gbp = round(net_gain_units * prices["uk_bng_gbp"], 2) if net_gain_units > 0 else 0.0

        return {
            "entity_id": entity_id,
            "habitat_type": habitat_type,
            "area_ha": round(area_ha, 2),
            "baseline_units": baseline_units,
            "post_units": post_units,
            "net_gain_units": net_gain_units,
            "net_gain_pct": net_gain_pct,
            "compliant_10pct": compliant_10pct,
            "credit_value_gbp": credit_value_gbp,
            "strategic_significance_score": ss,
            "strategic_significance_basis": strategic_significance_basis,
            "distinctiveness_score": distinctiveness,
            "condition_improvement": post_condition,
        }

    # ------------------------------------------------------------------
    # 2. SBTN assessment
    # ------------------------------------------------------------------
    def assess_sbtn(
        self,
        entity_id: str,
        sector: str,
        freshwater_pressures: dict,
        land_footprint_ha: float,
        species_impact_score: float,
        sbtn_commit_progress: Optional[float] = None,
        sbtn_transform_progress: Optional[float] = None,
        sbtn_track_progress: Optional[float] = None,
        no_conversion_commitment: Optional[bool] = None,
    ) -> dict:
        # Step 1 — Assess: deterministic gap of current pressure vs SBTN 2030 target.
        pressure_scores = []
        for pressure, val in freshwater_pressures.items():
            target_data = SBTN_FRESHWATER_TARGETS.get(pressure, {})
            target_pct = target_data.get("2030_target_reduction_pct", 30.0)
            score = round(max(0, min(100, (target_pct - val) / target_pct * 100)), 2)
            pressure_scores.append(score)
        sbtn_assess_score = round(sum(pressure_scores) / max(1, len(pressure_scores)), 2) if pressure_scores else None

        # Steps 2-4 — Commit / Transform / Track.
        # If the caller supplies observed self-reported completion (0-100) we use
        # it directly. Otherwise the value is modeled by a documented deterministic
        # attenuation of the prior stage (readiness typically decays through the
        # SBTN process); flagged as "modeled" so it is never mistaken for observed.
        def _stage(prior: Optional[float], provided: Optional[float], factor: float) -> tuple[Optional[float], str]:
            if provided is not None:
                return round(max(0.0, min(100.0, float(provided))), 2), "provided"
            if prior is None:
                return None, "insufficient_data"
            return round(max(0.0, min(100.0, prior * factor)), 2), "modeled"

        sbtn_commit_score, commit_basis = _stage(sbtn_assess_score, sbtn_commit_progress, 0.8)
        sbtn_transform_score, transform_basis = _stage(sbtn_commit_score, sbtn_transform_progress, 0.85)
        sbtn_track_score, track_basis = _stage(sbtn_transform_score, sbtn_track_progress, 0.9)

        stage_vals = [v for v in (sbtn_assess_score, sbtn_commit_score, sbtn_transform_score, sbtn_track_score) if v is not None]
        sbtn_overall = round(sum(stage_vals) / len(stage_vals), 2) if stage_vals else None

        # No-conversion compliance: real observed commitment when supplied; else honest null.
        if no_conversion_commitment is not None:
            no_conversion_compliant: Optional[bool] = bool(no_conversion_commitment)
            no_conversion_basis = "provided"
        else:
            no_conversion_compliant = None
            no_conversion_basis = "insufficient_data"

        priority_actions = []
        if sbtn_assess_score is not None and sbtn_assess_score < 50:
            priority_actions.append("Complete baseline freshwater pressure assessment")
        if no_conversion_compliant is False:
            priority_actions.append("Commit to no net loss of native ecosystems")
        elif no_conversion_compliant is None:
            priority_actions.append("Provide no-conversion / no-net-loss commitment evidence")
        if species_impact_score > 5:
            priority_actions.append("Develop species recovery plan for high-impact footprint")
        if sbtn_commit_score is not None and sbtn_commit_score < 40:
            priority_actions.append("Set science-based freshwater targets by 2025")

        return {
            "entity_id": entity_id,
            "sector": sector,
            "sbtn_assess_score": sbtn_assess_score,
            "sbtn_commit_score": sbtn_commit_score,
            "sbtn_transform_score": sbtn_transform_score,
            "sbtn_track_score": sbtn_track_score,
            "sbtn_overall": sbtn_overall,
            "score_basis": {
                "commit": commit_basis,
                "transform": transform_basis,
                "track": track_basis,
            },
            "priority_actions": priority_actions,
            "no_conversion_compliant": no_conversion_compliant,
            "no_conversion_basis": no_conversion_basis,
            "land_footprint_ha": round(land_footprint_ha, 2),
            "species_impact_score": round(species_impact_score, 2),
        }

    # ------------------------------------------------------------------
    # 3. EU NRL assessment
    # ------------------------------------------------------------------
    def assess_eu_nrl(
        self,
        entity_id: str,
        country_code: str,
        ecosystem_type: str,
        current_area_ha: float,
        degraded_area_ha: float,
        restoration_plan: bool,
        cost_per_ha_eur: Optional[float] = None,
        biodiversity_uplift_score: Optional[float] = None,
    ) -> dict:
        nrl_meta = EU_NRL_ECOSYSTEM_TARGETS.get(ecosystem_type, EU_NRL_ECOSYSTEM_TARGETS["forest"])

        degraded_pct = (degraded_area_ha / max(1, current_area_ha)) * 100
        restoration_target_ha = round(degraded_area_ha * nrl_meta["2030_pct"] / 100, 2)

        # Compliance checks: share of ecosystem currently in non-degraded condition,
        # derived deterministically from the supplied degraded area (no random noise).
        current_restored_pct = round(max(0, min(100, 100 - degraded_pct)), 2)
        compliant_2030 = current_restored_pct >= nrl_meta["2030_pct"] and restoration_plan
        compliant_2040 = current_restored_pct >= nrl_meta["2040_pct"]

        compliance_score = (current_restored_pct / max(1, nrl_meta["2050_pct"])) * 100 + (10.0 if restoration_plan else 0)
        compliance_score = round(max(0, min(100, compliance_score)), 2)

        # Cost estimation: requires an entity-specific unit cost. EU NRL restoration
        # runs ~€5,000-50,000/ha depending on ecosystem, so a single midpoint would
        # be misleading — return an honest null unless the caller supplies a rate.
        if cost_per_ha_eur is not None and cost_per_ha_eur > 0:
            estimated_restoration_cost_eur: Optional[float] = round(restoration_target_ha * float(cost_per_ha_eur), 2)
            cost_basis = "provided"
        else:
            estimated_restoration_cost_eur = None
            cost_basis = "insufficient_data"

        # Biodiversity uplift is a measured / modeled ecological outcome (condition
        # metric such as IES/EQR/FBI). Return the observed value when supplied; else null.
        if biodiversity_uplift_score is not None:
            biodiversity_uplift: Optional[float] = round(max(0, min(100, float(biodiversity_uplift_score))), 2)
            uplift_basis = "provided"
        else:
            biodiversity_uplift = None
            uplift_basis = "insufficient_data"

        return {
            "entity_id": entity_id,
            "country_code": country_code,
            "ecosystem_type": ecosystem_type,
            "nrl_article": nrl_meta["article"],
            "restoration_target_ha": restoration_target_ha,
            "current_restored_pct": current_restored_pct,
            "compliant_2030": compliant_2030,
            "compliant_2040": compliant_2040,
            "compliance_score": compliance_score,
            "estimated_restoration_cost_eur": estimated_restoration_cost_eur,
            "cost_basis": cost_basis,
            "biodiversity_uplift_score": biodiversity_uplift,
            "biodiversity_uplift_basis": uplift_basis,
            "condition_metric": nrl_meta["condition_metric"],
            "milestone_targets": {
                "2030_pct": nrl_meta["2030_pct"],
                "2040_pct": nrl_meta["2040_pct"],
                "2050_pct": nrl_meta["2050_pct"],
            },
        }

    # ------------------------------------------------------------------
    # 4. TNFD advanced metrics
    # ------------------------------------------------------------------
    def assess_tnfd_advanced(
        self,
        entity_id: str,
        sector: str,
        location_lat: float,
        location_lng: float,
        operations_ha: float,
        location_metrics: Optional[dict] = None,
    ) -> dict:
        # TNFD LEAP location metrics (MSA / HII / species richness delta /
        # connectivity / ecosystem-service value) are site observations that must
        # come from a spatial data provider (e.g. IBAT, GLOBIO, ENCORE). We only
        # report values supplied by the caller in ``location_metrics``; anything
        # absent is an explicit honest null rather than a fabricated draw.
        loc = location_metrics or {}

        def _clamp(value: Any, lo: float, hi: float) -> Optional[float]:
            if value is None:
                return None
            try:
                return round(max(lo, min(hi, float(value))), 2)
            except (TypeError, ValueError):
                return None

        msa_score = _clamp(loc.get("mean_species_abundance"), 0.0, 1.0)
        hii_score = _clamp(loc.get("habitat_intactness_index"), 0.0, 1.0)
        species_richness_delta = _clamp(loc.get("species_richness_delta"), -1.0, 1.0)
        connectivity_index = _clamp(loc.get("connectivity_index"), 0.0, 100.0)

        # Ecosystem-service value: computed only if a per-ha base value is supplied
        # together with intactness signals; otherwise null.
        esv_base = loc.get("ecosystem_services_value_base_usd_ha")
        if esv_base is not None and msa_score is not None and hii_score is not None:
            try:
                ecosystem_services_value_usd_ha: Optional[float] = round(
                    float(esv_base) * (msa_score + hii_score) / 2, 2
                )
            except (TypeError, ValueError):
                ecosystem_services_value_usd_ha = None
        elif loc.get("ecosystem_services_value") is not None:
            ecosystem_services_value_usd_ha = _clamp(loc.get("ecosystem_services_value"), 0.0, 1e9)
        else:
            ecosystem_services_value_usd_ha = None

        direct_map = {
            "mean_species_abundance": msa_score,
            "habitat_intactness_index": hii_score,
            "species_richness_delta": species_richness_delta,
            "connectivity_index": connectivity_index,
            "ecosystem_services_value": ecosystem_services_value_usd_ha,
        }

        tnfd_metric_scores: dict[str, Optional[float]] = {}
        for metric in TNFD_METRICS:
            name = metric["name"]
            if name in direct_map:
                tnfd_metric_scores[name] = direct_map[name]
            else:
                # Remaining core metrics require their own field in location_metrics;
                # honest null when not supplied.
                tnfd_metric_scores[name] = _clamp(loc.get(name), -1e9, 1e9) if loc.get(name) is not None else None

        metrics_supplied = sum(1 for v in tnfd_metric_scores.values() if v is not None)

        return {
            "entity_id": entity_id,
            "sector": sector,
            "location_lat": location_lat,
            "location_lng": location_lng,
            "operations_ha": round(operations_ha, 2),
            "msa_score": msa_score,
            "hii_score": hii_score,
            "species_richness_delta": species_richness_delta,
            "connectivity_index": connectivity_index,
            "ecosystem_services_value_usd_ha": ecosystem_services_value_usd_ha,
            "tnfd_metric_scores": tnfd_metric_scores,
            "total_metrics_assessed": len(TNFD_METRICS),
            "metrics_supplied": metrics_supplied,
            "data_sufficiency": "complete" if metrics_supplied == len(TNFD_METRICS) else (
                "partial" if metrics_supplied > 0 else "insufficient_data"
            ),
        }

    # ------------------------------------------------------------------
    # 5. Credit value calculation
    # ------------------------------------------------------------------
    def calculate_credit_value(
        self,
        entity_id: str,
        habitat_type: str,
        bng_net_units: float,
        sbtn_score: float,
        eu_nrl_score: float,
        market_type: str = "blended",
    ) -> dict:
        prices = BIODIVERSITY_CREDIT_PRICES.get(habitat_type, BIODIVERSITY_CREDIT_PRICES["grassland"])

        # Deterministic quality adjustment: 40% base + 30% weight on each of the
        # SBTN and EU NRL scores, clamped to [0.5, 1.5]. No random jitter.
        quality_adj = (sbtn_score / 100) * 0.3 + (eu_nrl_score / 100) * 0.3 + 0.4
        quality_adj = round(max(0.5, min(1.5, quality_adj)), 2)

        bng_credit_value_gbp = round(bng_net_units * prices["uk_bng_gbp"] * quality_adj, 2)
        eu_credit_value_eur = round(bng_net_units * prices["eu_habitat_eur"] * quality_adj, 2)
        voluntary_credit_value_usd = round(bng_net_units * prices["voluntary_usd"] * quality_adj, 2)

        # Blended (simplified: GBP≈1.25 USD, EUR≈1.08 USD)
        blended_value_usd = round(
            bng_credit_value_gbp * 1.25 * 0.4
            + eu_credit_value_eur * 1.08 * 0.4
            + voluntary_credit_value_usd * 0.2,
            2,
        )

        return {
            "entity_id": entity_id,
            "habitat_type": habitat_type,
            "bng_net_units": round(bng_net_units, 2),
            "bng_credit_value_gbp": bng_credit_value_gbp,
            "eu_credit_value_eur": eu_credit_value_eur,
            "voluntary_credit_value_usd": voluntary_credit_value_usd,
            "blended_value_usd": blended_value_usd,
            "market_liquidity": prices["liquidity"],
            "quality_adjustment_factor": quality_adj,
            "market_type": market_type,
        }

    # ------------------------------------------------------------------
    # 6. Portfolio assessment
    # ------------------------------------------------------------------
    def assess_portfolio(self, entity_id: str, projects: list) -> dict:
        if not projects:
            return {
                "entity_id": entity_id,
                "total_bng_units": 0.0,
                "total_credit_value_usd": 0.0,
                "weighted_sbtn_score": 0.0,
                "eu_nrl_aligned_pct": 0.0,
                "portfolio_biodiversity_rating": "N/A",
                "project_count": 0,
            }

        total_bng = sum(p.get("bng_net_units", 0) for p in projects)
        total_value = sum(p.get("credit_value_usd", 0) for p in projects)
        sbtn_scores = [p.get("sbtn_score", 50) for p in projects]
        weighted_sbtn = round(sum(sbtn_scores) / len(sbtn_scores), 2)
        eu_aligned = sum(1 for p in projects if p.get("eu_nrl_compliant", False))
        eu_nrl_aligned_pct = round(eu_aligned / len(projects) * 100, 2)

        score = weighted_sbtn * 0.5 + eu_nrl_aligned_pct * 0.3 + min(40, total_bng / 10) * 0.2
        if score >= 75:
            rating = "Platinum"
        elif score >= 60:
            rating = "Gold"
        elif score >= 45:
            rating = "Silver"
        else:
            rating = "Bronze"

        return {
            "entity_id": entity_id,
            "total_bng_units": round(total_bng, 2),
            "total_credit_value_usd": round(total_value, 2),
            "weighted_sbtn_score": weighted_sbtn,
            "eu_nrl_aligned_pct": eu_nrl_aligned_pct,
            "portfolio_biodiversity_rating": rating,
            "project_count": len(projects),
            "composite_score": round(score, 2),
        }
