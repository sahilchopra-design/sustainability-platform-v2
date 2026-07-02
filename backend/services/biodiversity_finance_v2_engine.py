"""
Biodiversity Finance v2 Engine — E44
=====================================
TNFD v1.0 full 14-step LEAP · PBAF attribution · ENCORE 23 ecosystem services
GBF/COP15 30×30 · MSA footprint · BFFI · BNG Metric 4.0

References:
  - TNFD v1.0 Framework (September 2023)
  - PBAF Standard v2 (2023) — Portfolio Biodiversity Accounting and Assessment
  - ENCORE tool — Exploring Natural Capital Opportunities, Risks and Exposure
  - Kunming-Montreal Global Biodiversity Framework (COP15, December 2022)
  - IUCN Mean Species Abundance (MSA) methodology
  - BFFI — Biodiversity Footprint for Financial Institutions
  - Natural England BNG Metric 4.0 (2023)
  - SBTN — Science Based Targets for Nature v1.0 (2023)
"""
from __future__ import annotations

import math
import uuid
from datetime import date
from typing import Any, Optional


# ---------------------------------------------------------------------------
# ENCORE — 23 Ecosystem Services
# ---------------------------------------------------------------------------

ENCORE_ECOSYSTEM_SERVICES: dict[str, dict] = {
    "water_flow_regulation":       {"category": "regulating",  "encore_id": "ES01", "default_weight": 0.08},
    "soil_quality":                {"category": "regulating",  "encore_id": "ES02", "default_weight": 0.06},
    "climate_regulation":          {"category": "regulating",  "encore_id": "ES03", "default_weight": 0.09},
    "pollination":                 {"category": "regulating",  "encore_id": "ES04", "default_weight": 0.07},
    "habitat_maintenance":         {"category": "regulating",  "encore_id": "ES05", "default_weight": 0.08},
    "disease_control":             {"category": "regulating",  "encore_id": "ES06", "default_weight": 0.04},
    "pest_control":                {"category": "regulating",  "encore_id": "ES07", "default_weight": 0.04},
    "noise_attenuation":           {"category": "regulating",  "encore_id": "ES08", "default_weight": 0.02},
    "flood_mitigation":            {"category": "regulating",  "encore_id": "ES09", "default_weight": 0.06},
    "storm_protection":            {"category": "regulating",  "encore_id": "ES10", "default_weight": 0.04},
    "erosion_control":             {"category": "regulating",  "encore_id": "ES11", "default_weight": 0.05},
    "water_purification":          {"category": "regulating",  "encore_id": "ES12", "default_weight": 0.05},
    "solid_waste_decomposition":   {"category": "regulating",  "encore_id": "ES13", "default_weight": 0.03},
    "bio_remediation":             {"category": "regulating",  "encore_id": "ES14", "default_weight": 0.03},
    "timber_provision":            {"category": "provisioning", "encore_id": "ES15", "default_weight": 0.05},
    "crop_provision":              {"category": "provisioning", "encore_id": "ES16", "default_weight": 0.07},
    "water_provision":             {"category": "provisioning", "encore_id": "ES17", "default_weight": 0.06},
    "raw_material_provision":      {"category": "provisioning", "encore_id": "ES18", "default_weight": 0.04},
    "fibre_provision":             {"category": "provisioning", "encore_id": "ES19", "default_weight": 0.03},
    "energy_provision":            {"category": "provisioning", "encore_id": "ES20", "default_weight": 0.03},
    "medicinal_resources":         {"category": "provisioning", "encore_id": "ES21", "default_weight": 0.03},
    "genetic_resources":           {"category": "provisioning", "encore_id": "ES22", "default_weight": 0.04},
    "recreation":                  {"category": "cultural",    "encore_id": "ES23", "default_weight": 0.02},
}

# ---------------------------------------------------------------------------
# Sector → ENCORE Dependencies (12 NACE sector codes)
# very_high / high / medium / low / very_low
# ---------------------------------------------------------------------------

SECTOR_ENCORE_DEPENDENCIES: dict[str, list[tuple[str, str]]] = {
    "A01": [  # Crop and animal production
        ("water_provision", "very_high"), ("soil_quality", "very_high"),
        ("pollination", "very_high"), ("climate_regulation", "high"),
        ("pest_control", "high"), ("flood_mitigation", "medium"),
        ("erosion_control", "medium"), ("genetic_resources", "high"),
    ],
    "A02": [  # Forestry and logging
        ("timber_provision", "very_high"), ("water_flow_regulation", "high"),
        ("climate_regulation", "very_high"), ("habitat_maintenance", "high"),
        ("erosion_control", "high"), ("flood_mitigation", "medium"),
        ("raw_material_provision", "high"),
    ],
    "B": [  # Mining and quarrying
        ("water_provision", "high"), ("erosion_control", "medium"),
        ("bio_remediation", "medium"), ("solid_waste_decomposition", "low"),
        ("flood_mitigation", "low"),
    ],
    "C10": [  # Food manufacturing
        ("crop_provision", "very_high"), ("water_provision", "high"),
        ("pollination", "high"), ("soil_quality", "medium"),
        ("genetic_resources", "medium"),
    ],
    "D35": [  # Electricity, gas, steam
        ("water_provision", "high"), ("water_flow_regulation", "high"),
        ("climate_regulation", "medium"), ("energy_provision", "medium"),
    ],
    "E36": [  # Water collection/supply
        ("water_provision", "very_high"), ("water_purification", "very_high"),
        ("water_flow_regulation", "very_high"), ("flood_mitigation", "high"),
    ],
    "F": [  # Construction
        ("raw_material_provision", "high"), ("water_provision", "medium"),
        ("erosion_control", "medium"), ("flood_mitigation", "medium"),
        ("noise_attenuation", "low"),
    ],
    "G": [  # Wholesale/retail trade
        ("crop_provision", "medium"), ("timber_provision", "medium"),
        ("fibre_provision", "medium"), ("raw_material_provision", "medium"),
    ],
    "H": [  # Transportation and storage
        ("water_provision", "low"), ("storm_protection", "medium"),
        ("flood_mitigation", "medium"), ("noise_attenuation", "low"),
    ],
    "I": [  # Accommodation and food services
        ("water_provision", "high"), ("crop_provision", "high"),
        ("recreation", "medium"), ("climate_regulation", "low"),
    ],
    "K": [  # Financial and insurance activities
        ("water_provision", "low"), ("climate_regulation", "low"),
        ("habitat_maintenance", "low"),
    ],
    "M": [  # Professional, scientific, technical
        ("genetic_resources", "medium"), ("medicinal_resources", "medium"),
        ("water_provision", "low"),
    ],
}

# ---------------------------------------------------------------------------
# Sector → ENCORE Impacts
# ---------------------------------------------------------------------------

SECTOR_ENCORE_IMPACTS: dict[str, dict] = {
    "A01": {"drivers": ["land_use_change", "water_use", "pollution", "invasive_species"], "magnitude": "very_high"},
    "A02": {"drivers": ["land_use_change", "habitat_fragmentation", "water_use"], "magnitude": "high"},
    "B":   {"drivers": ["land_use_change", "pollution", "water_use", "noise_vibration"], "magnitude": "very_high"},
    "C10": {"drivers": ["water_use", "pollution", "resource_extraction"], "magnitude": "medium"},
    "D35": {"drivers": ["water_use", "land_use_change", "pollution", "climate_change"], "magnitude": "high"},
    "E36": {"drivers": ["water_use", "water_flow_alteration", "pollution"], "magnitude": "medium"},
    "F":   {"drivers": ["land_use_change", "pollution", "noise_vibration", "resource_extraction"], "magnitude": "high"},
    "G":   {"drivers": ["pollution", "resource_extraction", "waste"], "magnitude": "medium"},
    "H":   {"drivers": ["pollution", "noise_vibration", "land_use_change"], "magnitude": "medium"},
    "I":   {"drivers": ["water_use", "pollution", "land_use_change"], "magnitude": "medium"},
    "K":   {"drivers": ["indirect_via_financing"], "magnitude": "low"},
    "M":   {"drivers": ["resource_extraction", "water_use"], "magnitude": "low"},
}

# ---------------------------------------------------------------------------
# GBF — Kunming-Montreal 23 Targets
# ---------------------------------------------------------------------------

GBF_TARGETS: dict[str, str] = {
    "T01": "30×30 — Protect 30% of land and oceans by 2030",
    "T02": "Restore 30% of degraded ecosystems by 2030",
    "T03": "Halt human-induced species extinction; reduce extinction rate 10-fold",
    "T04": "Recovery of wild species populations and genetic diversity",
    "T05": "Sustainable use and harvest of wild species",
    "T06": "Reduce invasive alien species introduction and establishment by 50%",
    "T07": "Reduce pollution risks from all sources to levels not harmful to biodiversity",
    "T08": "Minimise climate change impact; increase resilience of biodiversity",
    "T09": "Manage wild species sustainably to benefit people",
    "T10": "Sustainable management of agriculture, aquaculture, fisheries and forestry",
    "T11": "Restore, maintain and enhance nature's contributions to people",
    "T12": "Increase green and blue urban space by 2030",
    "T13": "Equitable sharing of genetic resources benefits (ABS)",
    "T14": "Integrate biodiversity into decision-making",
    "T15": "Assess, disclose and reduce biodiversity-related risks in business and finance",
    "T16": "Sustainable consumption — reduce food waste 50%; ecological footprint",
    "T17": "Establish biological safety framework for biotechnology",
    "T18": "Phase out harmful subsidies by at least USD 500 bn by 2030",
    "T19": "Mobilise USD 200 bn/yr for biodiversity by 2030",
    "T20": "Capacity-building and technology transfer to developing countries",
    "T21": "Ensure availability of knowledge and information on biodiversity",
    "T22": "Meaningful participation of indigenous peoples in governance",
    "T23": "Gender equality in biodiversity governance and implementation",
}

# ---------------------------------------------------------------------------
# MSA Land-Use Fractions
# ---------------------------------------------------------------------------

MSA_LAND_USE_LOOKUP: dict[str, float] = {
    "primary_veg":      0.90,
    "secondary_veg":    0.50,
    "extensive_ag":     0.30,
    "intensive_ag":     0.05,
    "plantation":       0.15,
    "urban":            0.02,
    "mining":           0.08,
    "aquaculture":      0.35,
    "wetland_managed":  0.45,
    "degraded_land":    0.10,
}

# ---------------------------------------------------------------------------
# BNG Habitat Condition Multipliers (Natural England Metric 4.0)
# ---------------------------------------------------------------------------

BNG_HABITAT_CONDITION_MULTIPLIERS: dict[str, float] = {
    "outstanding": 6.0,
    "good":        4.0,
    "moderate":    2.0,
    "poor":        1.0,
    "very_poor":   0.5,
    "n_a":         0.0,
}

# BNG Metric 4.0 distinctiveness bands (fixed scores by habitat distinctiveness
# class — a reference-data lookup, NOT an entity-chosen value).
BNG_DISTINCTIVENESS_SCORES: dict[str, float] = {
    "very_high": 8.0,
    "high":      6.0,
    "medium":    4.0,
    "low":       2.0,
    "very_low":  0.0,
}

# BNG Metric 4.0 strategic significance multipliers (fixed by the site's
# position in the Local Nature Recovery Strategy — a reference-data lookup).
BNG_STRATEGIC_SIGNIFICANCE_MULTIPLIERS: dict[str, float] = {
    "high":     1.15,  # within a formally identified strategic location
    "location": 1.10,  # location ecologically desirable but not formally identified
    "low":      1.00,  # area/compensation not in local strategy
}

# ---------------------------------------------------------------------------
# PBAF Attribution Methods
# ---------------------------------------------------------------------------

PBAF_METHODS: dict[str, dict] = {
    "outstanding_amount": {
        "description": "Attribution = (outstanding_amount / total_enterprise_value) × exposure",
        "formula": "ev_ratio × outstanding_amount",
        "applicable_to": ["corporate_bonds", "loans", "corporate_debt"],
    },
    "equity_ownership": {
        "description": "Attribution = ownership_pct × total_footprint",
        "formula": "ownership_pct × company_footprint",
        "applicable_to": ["listed_equity", "private_equity"],
    },
    "total_assets": {
        "description": "Attribution = (outstanding_amount / total_assets) × footprint",
        "formula": "asset_ratio × footprint",
        "applicable_to": ["mortgages", "project_finance"],
    },
}

# ---------------------------------------------------------------------------
# TNFD LEAP Step Labels
# ---------------------------------------------------------------------------

TNFD_LEAP_STEPS: dict[str, list[str]] = {
    "locate": [
        "L1_identify_business_activities",
        "L2_screen_assets_and_value_chain",
        "L3_identify_natural_ecosystem_interfaces",
        "L4_prioritise_locations",
    ],
    "evaluate": [
        "E1_assess_dependencies_on_nature",
        "E2_assess_impacts_on_nature",
        "E3_screen_for_material_dep_impact",
        "E4_assess_scope_of_impacts",
    ],
    "assess": [
        "A1_identify_material_risks_and_opportunities",
        "A2_assess_existing_risk_management",
        "A3_assess_materiality",
        "A4_prioritise_risks_and_opportunities",
    ],
    "prepare": [
        "P1_strategy_and_resource_allocation",
        "P2_targets_and_performance_metrics",
        "P3_engagement_and_stakeholder_disclosure",
        "P4_reporting_and_assurance",
    ],
}


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------

class BiodiversityFinanceV2Engine:

    # ------------------------------------------------------------------
    # 1. TNFD LEAP Assessment
    # ------------------------------------------------------------------

    def assess_tnfd_leap(
        self,
        entity_id: str,
        sectors: list[str],
        locations: list[dict],
        financial_exposure: float,
        financial_year: int = 2024,
        location_hazard_multiplier: Optional[float] = None,
        disclosure_readiness_score: Optional[float] = None,
        connectivity_score: Optional[float] = None,
    ) -> dict[str, Any]:
        # ------------------------------------------------------------------
        # Locate step — sector × location hazard overlay.
        # Sector impact scores come from the ENCORE impact reference table.
        # The location hazard multiplier is a caller-supplied physical-hazard
        # overlay (e.g. WWF Water Risk / protected-area proximity). When it is
        # not supplied we apply a NEUTRAL 1.0 (no overlay) rather than
        # fabricating a hazard — and flag that the overlay was absent.
        # ------------------------------------------------------------------
        data_flags: list[str] = []

        sector_impact_scores = []
        for s in sectors:
            impact_info = SECTOR_ENCORE_IMPACTS.get(s, {"magnitude": "medium", "drivers": []})
            score_map = {"very_high": 90, "high": 70, "medium": 50, "low": 30, "very_low": 15}
            sector_impact_scores.append(score_map.get(impact_info["magnitude"], 50))

        locate_score: Optional[float]
        if sector_impact_scores:
            locate_raw = sum(sector_impact_scores) / len(sector_impact_scores)
            hazard = location_hazard_multiplier if location_hazard_multiplier is not None else 1.0
            if location_hazard_multiplier is None:
                data_flags.append("location_hazard_multiplier_absent_neutral_applied")
            locate_score = min(100.0, round(locate_raw * hazard, 1))
        else:
            locate_score = None
            data_flags.append("locate_insufficient_sector_impact_data")

        # Evaluate step — ENCORE dependency + impact scoring
        dep_scores = []
        for s in sectors:
            deps = SECTOR_ENCORE_DEPENDENCIES.get(s, [])
            dep_level_map = {"very_high": 9, "high": 7, "medium": 5, "low": 3, "very_low": 1}
            if deps:
                dep_scores.append(sum(dep_level_map.get(lvl, 5) for _, lvl in deps) / len(deps) * 10)
        evaluate_score: Optional[float]
        if dep_scores:
            evaluate_score = round(sum(dep_scores) / len(dep_scores), 1)
        else:
            evaluate_score = None
            data_flags.append("evaluate_insufficient_dependency_data")

        # Assess step — materiality (locate + evaluate) plus an optional
        # ecological-connectivity input. If connectivity is not supplied we
        # blend only locate+evaluate (re-normalised) instead of inventing it.
        assess_score: Optional[float]
        if locate_score is not None and evaluate_score is not None:
            if connectivity_score is not None:
                conn = max(0.0, min(100.0, connectivity_score))
                assess_score = round(min(100.0, locate_score * 0.4 + evaluate_score * 0.4 + conn * 0.2), 1)
            else:
                assess_score = round(min(100.0, locate_score * 0.5 + evaluate_score * 0.5), 1)
                data_flags.append("connectivity_score_absent_locate_evaluate_only")
        else:
            assess_score = None
            data_flags.append("assess_insufficient_upstream_scores")

        # Prepare step — disclosure readiness / target-gap. This is an
        # entity-reported figure; use the caller-supplied score or return null.
        prepare_score: Optional[float]
        if disclosure_readiness_score is not None:
            prepare_score = round(max(0.0, min(100.0, disclosure_readiness_score)), 1)
        else:
            prepare_score = None
            data_flags.append("prepare_disclosure_readiness_not_provided")

        available = [v for v in (locate_score, evaluate_score, assess_score, prepare_score) if v is not None]
        composite = round(sum(available) / len(available), 1) if available else None
        if composite is None:
            materiality = "insufficient_data"
        else:
            materiality = "high" if composite >= 65 else ("medium" if composite >= 40 else "low")

        # Per-phase headline scores only — sub-step scores are NOT fabricated.
        # Each phase reports its computed score (or null) plus the step labels
        # that remain to be individually assessed.
        step_details: dict[str, Any] = {}
        phase_score_map = {
            "locate": locate_score,
            "evaluate": evaluate_score,
            "assess": assess_score,
            "prepare": prepare_score,
        }
        for phase, steps in TNFD_LEAP_STEPS.items():
            step_details[phase] = {
                "_phase_score": phase_score_map.get(phase),
                "steps_pending_detailed_assessment": list(steps),
            }

        top_dependencies = []
        for s in sectors:
            deps = SECTOR_ENCORE_DEPENDENCIES.get(s, [])
            for svc, lvl in deps:
                if lvl in ("very_high", "high"):
                    top_dependencies.append({"service": svc, "level": lvl, "sector": s})

        return {
            "entity_id": entity_id,
            "financial_year": financial_year,
            "sectors_assessed": sectors,
            "locations_assessed": len(locations),
            "financial_exposure_musd": round(financial_exposure / 1_000_000, 2),
            "leap_scores": {
                "locate":   locate_score,
                "evaluate": evaluate_score,
                "assess":   assess_score,
                "prepare":  prepare_score,
                "composite": composite,
            },
            "step_details": step_details,
            "materiality_rating": materiality,
            "top_nature_dependencies": top_dependencies[:8],
            "data_completeness_flags": data_flags,
            "cross_framework_links": [
                "TNFD v1.0 Core Metrics", "ESRS E4 Biodiversity & Ecosystems",
                "GRI 304 Biodiversity", "EU Taxonomy DNSH", "SBTN v1.0",
            ],
            "assessment_id": str(uuid.uuid4()),
            "generated_at": date.today().isoformat(),
        }

    # ------------------------------------------------------------------
    # 2. PBAF Portfolio Attribution
    # ------------------------------------------------------------------

    def calculate_pbaf_attribution(
        self,
        entity_id: str,
        portfolio_holdings: list[dict],
        method: str = "outstanding_amount",
    ) -> dict[str, Any]:
        # PBAF attribution requires entity-reported denominators (enterprise
        # value / total assets) and a company biodiversity footprint. These
        # are NEVER fabricated — a holding missing the required inputs is
        # reported with null attribution and an explicit reason.
        method_info = PBAF_METHODS.get(method, PBAF_METHODS["outstanding_amount"])

        total_exposure = sum(h.get("exposure", 0) for h in portfolio_holdings)
        attribution_results = []
        total_attributed_footprint = 0.0
        attributed_exposure = 0.0
        holdings_with_data = 0

        for holding in portfolio_holdings:
            h_id = holding.get("holding_id", str(uuid.uuid4()))
            exposure = holding.get("exposure", 0)
            ev = holding.get("enterprise_value")
            ownership_pct = holding.get("ownership_pct")
            company_footprint = holding.get("biodiversity_footprint_pdf_m2yr")

            missing: list[str] = []

            # Attribution factor per selected method (denominators must be real)
            attr_factor: Optional[float] = None
            if method == "outstanding_amount":
                if ev is not None and ev > 0:
                    attr_factor = exposure / ev
                else:
                    missing.append("enterprise_value")
            elif method == "equity_ownership":
                if ownership_pct is not None:
                    attr_factor = min(ownership_pct, 1.0)
                elif ev is not None and ev > 0:
                    attr_factor = min(exposure / ev, 1.0)
                else:
                    missing.append("ownership_pct_or_enterprise_value")
            else:  # total_assets
                total_assets = holding.get("total_assets")
                if total_assets is not None and total_assets > 0:
                    attr_factor = exposure / total_assets
                else:
                    missing.append("total_assets")

            if company_footprint is None:
                missing.append("biodiversity_footprint_pdf_m2yr")

            if attr_factor is not None and company_footprint is not None:
                attributed_footprint = attr_factor * company_footprint
                total_attributed_footprint += attributed_footprint
                attributed_exposure += exposure
                holdings_with_data += 1
                attribution_results.append({
                    "holding_id": h_id,
                    "exposure_usd": exposure,
                    "attribution_factor": round(attr_factor, 6),
                    "company_footprint_pdf_m2yr": round(company_footprint, 0),
                    "attributed_footprint_pdf_m2yr": round(attributed_footprint, 0),
                    "footprint_intensity_per_musd": round(attributed_footprint / max(exposure / 1e6, 0.001), 2),
                    "data_status": "computed",
                })
            else:
                attribution_results.append({
                    "holding_id": h_id,
                    "exposure_usd": exposure,
                    "attribution_factor": round(attr_factor, 6) if attr_factor is not None else None,
                    "company_footprint_pdf_m2yr": round(company_footprint, 0) if company_footprint is not None else None,
                    "attributed_footprint_pdf_m2yr": None,
                    "footprint_intensity_per_musd": None,
                    "data_status": "insufficient_data",
                    "missing_inputs": missing,
                })

        # Portfolio intensity is only meaningful across holdings with real data.
        portfolio_intensity: Optional[float]
        if holdings_with_data > 0 and attributed_exposure > 0:
            portfolio_intensity = round(total_attributed_footprint / (attributed_exposure / 1e6), 2)
        else:
            portfolio_intensity = None

        return {
            "entity_id": entity_id,
            "method_used": method,
            "method_description": method_info["description"],
            "holdings_count": len(portfolio_holdings),
            "holdings_with_sufficient_data": holdings_with_data,
            "total_exposure_usd": total_exposure,
            "attributed_exposure_usd": round(attributed_exposure, 2),
            "total_attributed_footprint_pdf_m2yr": round(total_attributed_footprint, 0) if holdings_with_data else None,
            "portfolio_intensity_pdf_m2yr_per_musd": portfolio_intensity,
            "coverage_note": "Attribution computed only for holdings with reported EV/total-assets and company footprint." if holdings_with_data < len(portfolio_holdings) else "Full data coverage.",
            "holdings": attribution_results,
            "assessment_id": str(uuid.uuid4()),
        }

    # ------------------------------------------------------------------
    # 3. ENCORE Services Scoring
    # ------------------------------------------------------------------

    def score_encore_services(
        self,
        entity_id: str,
        nace_sectors: list[str],
        company_revenue_split: Optional[dict[str, float]] = None,
    ) -> dict[str, Any]:
        if company_revenue_split is None and nace_sectors:
            company_revenue_split = {s: 1.0 / len(nace_sectors) for s in nace_sectors}
        elif company_revenue_split is None:
            company_revenue_split = {}

        service_scores: dict[str, dict] = {}
        for svc_id in ENCORE_ECOSYSTEM_SERVICES:
            service_scores[svc_id] = {"dependency_score": 0.0, "impact_score": 0.0, "sectors_contributing": []}

        dep_map = {"very_high": 9, "high": 7, "medium": 5, "low": 3, "very_low": 1}

        for sector in nace_sectors:
            weight = company_revenue_split.get(sector, 0.0)
            deps = SECTOR_ENCORE_DEPENDENCIES.get(sector, [])
            impacts = SECTOR_ENCORE_IMPACTS.get(sector, {})
            impact_mag = impacts.get("magnitude", "medium")
            mag_score = dep_map.get(impact_mag, 5)

            for svc, lvl in deps:
                if svc in service_scores:
                    service_scores[svc]["dependency_score"] += dep_map[lvl] * weight
                    # Impact score is the revenue-weighted ENCORE impact
                    # magnitude for the sector — a deterministic reference-table
                    # lookup, no stochastic jitter.
                    service_scores[svc]["impact_score"] += mag_score * weight
                    service_scores[svc]["sectors_contributing"].append(sector)

        # normalise to 0-10
        for svc_id, scores in service_scores.items():
            scores["dependency_score"] = min(10.0, round(scores["dependency_score"], 2))
            scores["impact_score"] = min(10.0, round(scores["impact_score"], 2))
            scores["category"] = ENCORE_ECOSYSTEM_SERVICES[svc_id]["category"]

        # top 5 by dependency
        sorted_svcs = sorted(service_scores.items(), key=lambda x: x[1]["dependency_score"], reverse=True)
        top5 = [
            {"service_id": k, "service_name": k.replace("_", " ").title(),
             "dependency_score": v["dependency_score"], "impact_score": v["impact_score"],
             "category": v["category"]}
            for k, v in sorted_svcs[:5]
        ]

        materiality_flags = [
            {"service_id": k, "flag": "material"}
            for k, v in service_scores.items()
            if v["dependency_score"] >= 6.0 or v["impact_score"] >= 6.0
        ]

        return {
            "entity_id": entity_id,
            "nace_sectors": nace_sectors,
            "service_scores": service_scores,
            "top_5_high_dependency": top5,
            "materiality_flags": materiality_flags,
            "total_material_services": len(materiality_flags),
            "assessment_id": str(uuid.uuid4()),
        }

    # ------------------------------------------------------------------
    # 4. MSA Footprint
    # ------------------------------------------------------------------

    def calculate_msa_footprint(
        self,
        entity_id: str,
        land_use_data: list[dict],
    ) -> dict[str, Any]:
        total_area_km2 = 0.0
        msa_preserved_km2 = 0.0
        hotspot_count = 0
        breakdown = []

        for entry in land_use_data:
            land_type = entry.get("land_use_type", "intensive_ag")
            area_km2 = float(entry.get("area_km2", 0))
            msa_fraction = MSA_LAND_USE_LOOKUP.get(land_type, 0.10)
            msa_area = area_km2 * msa_fraction
            is_hotspot = msa_fraction < 0.15 and area_km2 > 1.0
            if is_hotspot:
                hotspot_count += 1

            total_area_km2 += area_km2
            msa_preserved_km2 += msa_area
            breakdown.append({
                "land_use_type": land_type,
                "area_km2": area_km2,
                "msa_fraction": msa_fraction,
                "msa_preserved_km2": round(msa_area, 3),
                "is_hotspot": is_hotspot,
            })

        msa_footprint = total_area_km2 - msa_preserved_km2
        msa_loss_fraction = msa_footprint / max(total_area_km2, 0.001)

        return {
            "entity_id": entity_id,
            "total_area_km2": round(total_area_km2, 3),
            "msa_preserved_km2": round(msa_preserved_km2, 3),
            "msa_footprint_km2": round(msa_footprint, 3),
            "msa_loss_fraction": round(msa_loss_fraction, 4),
            "hotspot_count": hotspot_count,
            "breakdown": breakdown,
            "assessment_id": str(uuid.uuid4()),
        }

    # ------------------------------------------------------------------
    # 5. GBF / COP15 30×30 Alignment
    # ------------------------------------------------------------------

    def assess_gbf_alignment(
        self,
        entity_id: str,
        portfolio_data: dict,
        reporting_year: int = 2024,
    ) -> dict[str, Any]:
        # All GBF alignment inputs are entity-reported figures. Scores are
        # computed ONLY for targets whose underlying metric is supplied; every
        # other target is reported as insufficient_data rather than fabricated.
        protected_area_pct = portfolio_data.get("protected_area_pct")
        restored_area_pct = portfolio_data.get("restored_area_pct")
        t15_disclosure = portfolio_data.get("t15_disclosure")
        pollution_reduction_pct = portfolio_data.get("pollution_reduction_pct")

        cop15_30x30_contribution_pct = round(protected_area_pct, 1) if protected_area_pct is not None else None
        # T15 alignment is directly the disclosure flag (no random gating).
        gbf_target15_aligned = bool(t15_disclosure) if t15_disclosure is not None else None

        target_assessments: dict[str, dict] = {}
        if protected_area_pct is not None:
            target_assessments["T01"] = {
                "score": round(min(100.0, protected_area_pct * 100 / 30), 1),
                "gap": round(max(0.0, 30 - protected_area_pct), 1),
            }
        if restored_area_pct is not None:
            target_assessments["T02"] = {
                "score": round(min(100.0, restored_area_pct * 100 / 30), 1),
                "gap": round(max(0.0, 30 - restored_area_pct), 1),
            }
        if pollution_reduction_pct is not None:
            target_assessments["T07"] = {
                "score": round(min(100.0, pollution_reduction_pct * 2.5), 1),
                "gap": round(max(0.0, 40 - pollution_reduction_pct), 1),
            }
        if t15_disclosure is not None:
            target_assessments["T15"] = {
                "score": 80 if t15_disclosure else 20,
                "gap": 0 if t15_disclosure else 60,
            }

        # Remaining targets: no supplied metric -> honest insufficient_data.
        targets_insufficient_data = [tid for tid in GBF_TARGETS if tid not in target_assessments]

        target_gaps = [
            {"target_id": tid, "description": GBF_TARGETS[tid], "gap_score": v["gap"]}
            for tid, v in target_assessments.items()
            if v["gap"] > 20
        ]

        overall_score: Optional[float]
        if target_assessments:
            overall_score = round(
                sum(v["score"] for v in target_assessments.values()) / len(target_assessments), 1
            )
        else:
            overall_score = None

        return {
            "entity_id": entity_id,
            "reporting_year": reporting_year,
            "gbf_target15_aligned": gbf_target15_aligned,
            "cop15_30x30_contribution_pct": cop15_30x30_contribution_pct,
            "overall_gbf_alignment_score": overall_score,
            "overall_score_basis": "Computed over targets with reported metrics only." if target_assessments else "No target metrics supplied.",
            "target_assessments": target_assessments,
            "targets_assessed": sorted(target_assessments.keys()),
            "targets_insufficient_data": targets_insufficient_data,
            "target_gaps": target_gaps,
            "targets_on_track": len([v for v in target_assessments.values() if v["score"] >= 50]),
            "targets_off_track": len([v for v in target_assessments.values() if v["score"] < 50]),
            "assessment_id": str(uuid.uuid4()),
        }

    # ------------------------------------------------------------------
    # 6. BNG Metric 4.0 Calculation
    # ------------------------------------------------------------------

    def calculate_bng(
        self,
        entity_id: str,
        pre_development: float,
        post_development: float,
        habitat_type: str,
        condition_before: str,
        condition_after: str,
        distinctiveness_band: Optional[str] = None,
        distinctiveness_band_after: Optional[str] = None,
        strategic_significance: Optional[str] = None,
    ) -> dict[str, Any]:
        # Condition, distinctiveness and strategic significance are Metric 4.0
        # reference-table lookups keyed on caller-supplied classifications —
        # none are random draws.
        cond_before = BNG_HABITAT_CONDITION_MULTIPLIERS.get(condition_before, 1.0)
        cond_after = BNG_HABITAT_CONDITION_MULTIPLIERS.get(condition_after, 1.0)

        data_flags: list[str] = []

        # Strategic significance: default to the conservative "low" (not in a
        # local nature strategy) baseline = 1.0 per Metric 4.0 when unspecified.
        if strategic_significance is not None:
            strategic_multiplier = BNG_STRATEGIC_SIGNIFICANCE_MULTIPLIERS.get(strategic_significance, 1.0)
        else:
            strategic_multiplier = 1.0
            data_flags.append("strategic_significance_defaulted_to_low_baseline")

        # Distinctiveness band(s) are intrinsic to the habitat. Absolute
        # habitat-unit counts require them; when absent we still report the
        # net-gain % (which is invariant to a constant multiplier), but leave
        # the absolute unit counts null instead of fabricating a band.
        dist_before = BNG_DISTINCTIVENESS_SCORES.get(distinctiveness_band) if distinctiveness_band is not None else None
        # Post-development distinctiveness defaults to the same band as baseline
        # when the created/retained habitat class is not separately specified.
        _band_after = distinctiveness_band_after if distinctiveness_band_after is not None else distinctiveness_band
        dist_after = BNG_DISTINCTIVENESS_SCORES.get(_band_after) if _band_after is not None else None

        baseline_units: Optional[float]
        post_units: Optional[float]
        deficit_units: Optional[float]
        if dist_before is not None and dist_after is not None:
            baseline_units = round(pre_development * cond_before * dist_before * strategic_multiplier, 3)
            post_units = round(post_development * cond_after * dist_after * strategic_multiplier, 3)
            deficit_units = max(0.0, round(baseline_units * 1.10 - post_units, 3))
        else:
            baseline_units = None
            post_units = None
            deficit_units = None
            data_flags.append("distinctiveness_band_not_provided_absolute_units_null")

        # Net-gain % — computed from the condition-weighted area change. When a
        # distinctiveness band is supplied (and unchanged) it cancels; we use
        # the condition-only proxy so the mandatory-threshold check is always
        # available from area + condition alone.
        base_proxy = pre_development * cond_before
        post_proxy = post_development * cond_after
        if base_proxy > 0:
            net_gain_pct: Optional[float] = round(((post_proxy - base_proxy) / base_proxy) * 100, 2)
            threshold_met: Optional[bool] = net_gain_pct >= 10.0
            credit_required: Optional[bool] = net_gain_pct < 10.0  # 10% mandatory BNG (Environment Act 2021)
        else:
            net_gain_pct = None
            threshold_met = None
            credit_required = None
            data_flags.append("net_gain_undefined_zero_baseline")

        return {
            "entity_id": entity_id,
            "habitat_type": habitat_type,
            "pre_development_ha": pre_development,
            "post_development_ha": post_development,
            "condition_before": condition_before,
            "condition_after": condition_after,
            "condition_multiplier_before": cond_before,
            "condition_multiplier_after": cond_after,
            "distinctiveness_band_before": distinctiveness_band,
            "distinctiveness_band_after": _band_after,
            "distinctiveness_multiplier_before": dist_before,
            "distinctiveness_multiplier_after": dist_after,
            "strategic_significance": strategic_significance,
            "strategic_significance_multiplier": strategic_multiplier,
            "baseline_habitat_units": baseline_units,
            "post_development_units": post_units,
            "net_gain_pct": net_gain_pct,
            "mandatory_10pct_threshold_met": threshold_met,
            "credit_required": credit_required,
            "deficit_units": deficit_units,
            "data_completeness_flags": data_flags,
            "bng_standard": "Natural England Metric 4.0",
            "assessment_id": str(uuid.uuid4()),
        }

    # ------------------------------------------------------------------
    # 7. BFFI Portfolio Score
    # ------------------------------------------------------------------

    # Deterministic BFFI intensity model: revenue/exposure-based footprint
    # proxy per unit exposure, calibrated by ENCORE sector impact magnitude.
    # These are MODEL calibration constants, not entity-reported figures.
    _BFFI_MAG_INTENSITY = {"very_high": 1.5, "high": 1.0, "medium": 0.6, "low": 0.3, "very_low": 0.1}
    _BFFI_INTENSITY_SCALE = 10.0  # pdf.m2.yr per USD per unit magnitude intensity

    def calculate_bffi(
        self,
        entity_id: str,
        portfolio_holdings: list[dict],
    ) -> dict[str, Any]:
        asset_class_breakdown: dict[str, dict] = {}
        total_footprint = 0.0
        total_exposure = 0.0
        holdings_reported = 0
        holdings_modelled = 0

        for holding in portfolio_holdings:
            asset_class = holding.get("asset_class", "corporate_equity")
            exposure = float(holding.get("exposure", 0))
            sector = holding.get("nace_sector", "K")

            reported_fp = holding.get("biodiversity_footprint_pdf_m2yr")
            if reported_fp is not None:
                # Use the entity-reported footprint when supplied.
                footprint_pdf_m2yr = float(reported_fp)
                holdings_reported += 1
            else:
                # Deterministic sector-magnitude model estimate (no jitter).
                impact_info = SECTOR_ENCORE_IMPACTS.get(sector, {"magnitude": "medium"})
                base_intensity = self._BFFI_MAG_INTENSITY.get(impact_info.get("magnitude", "medium"), 0.6)
                footprint_pdf_m2yr = exposure * base_intensity * self._BFFI_INTENSITY_SCALE
                holdings_modelled += 1

            if asset_class not in asset_class_breakdown:
                asset_class_breakdown[asset_class] = {"exposure": 0.0, "footprint": 0.0, "holdings": 0}
            asset_class_breakdown[asset_class]["exposure"] += exposure
            asset_class_breakdown[asset_class]["footprint"] += footprint_pdf_m2yr
            asset_class_breakdown[asset_class]["holdings"] += 1
            total_footprint += footprint_pdf_m2yr
            total_exposure += exposure

        bffi_score: Optional[float]
        if total_exposure > 0:
            bffi_score = round(total_footprint / (total_exposure / 1e6), 2)
        else:
            bffi_score = None

        for ac in asset_class_breakdown.values():
            ac["intensity_pdf_m2yr_per_musd"] = round(
                ac["footprint"] / max(ac["exposure"] / 1e6, 0.001), 2
            )
            ac["exposure"] = round(ac["exposure"], 2)
            ac["footprint"] = round(ac["footprint"], 2)

        if bffi_score is None:
            bffi_rating = "insufficient_data"
        else:
            bffi_rating = "high_impact" if bffi_score > 5000 else ("medium_impact" if bffi_score > 1000 else "low_impact")

        return {
            "entity_id": entity_id,
            "bffi_score_pdf_m2yr_per_musd": bffi_score,
            "total_portfolio_footprint_pdf_m2yr": round(total_footprint, 0),
            "total_exposure_usd": round(total_exposure, 2),
            "asset_class_breakdown": asset_class_breakdown,
            "holdings_count": len(portfolio_holdings),
            "holdings_reported_footprint": holdings_reported,
            "holdings_modelled_footprint": holdings_modelled,
            "footprint_basis": "reported where available, deterministic ENCORE sector-magnitude model otherwise",
            "bffi_rating": bffi_rating,
            "assessment_id": str(uuid.uuid4()),
        }

    # ------------------------------------------------------------------
    # 8. Full Assessment
    # ------------------------------------------------------------------

    def generate_full_assessment(
        self,
        entity_id: str,
        portfolio_data: dict,
    ) -> dict[str, Any]:
        sectors = portfolio_data.get("sectors", ["A01", "C10"])
        holdings = portfolio_data.get("holdings", [
            {"holding_id": "H001", "exposure": 5_000_000, "enterprise_value": 15_000_000,
             "asset_class": "corporate_equity", "nace_sector": sectors[0] if sectors else "K"},
        ])
        locations = portfolio_data.get("locations", [{"lat": 51.5, "lng": -0.1, "country": "GB"}])
        financial_exposure = portfolio_data.get("total_exposure", sum(h.get("exposure", 0) for h in holdings))
        reporting_year = portfolio_data.get("reporting_year", 2024)

        data_flags: list[str] = []

        leap = self.assess_tnfd_leap(
            entity_id, sectors, locations, financial_exposure, reporting_year,
            location_hazard_multiplier=portfolio_data.get("location_hazard_multiplier"),
            disclosure_readiness_score=portfolio_data.get("disclosure_readiness_score"),
            connectivity_score=portfolio_data.get("connectivity_score"),
        )
        pbaf = self.calculate_pbaf_attribution(entity_id, holdings, "outstanding_amount")
        encore = self.score_encore_services(entity_id, sectors)
        gbf = self.assess_gbf_alignment(entity_id, portfolio_data, reporting_year)
        bffi = self.calculate_bffi(entity_id, holdings)

        # MSA footprint only when real land-use data is supplied — no synthetic areas.
        land_use_data = portfolio_data.get("land_use_data")
        if land_use_data:
            msa = self.calculate_msa_footprint(entity_id, land_use_data)
        else:
            msa = None
            data_flags.append("msa_skipped_no_land_use_data")

        # BNG only when BOTH real pre AND post development areas are provided.
        bng = None
        if portfolio_data.get("pre_development_ha") is not None and portfolio_data.get("post_development_ha") is not None:
            bng = self.calculate_bng(
                entity_id,
                portfolio_data["pre_development_ha"],
                portfolio_data["post_development_ha"],
                portfolio_data.get("habitat_type", "grassland"),
                portfolio_data.get("condition_before", "moderate"),
                portfolio_data.get("condition_after", "good"),
                distinctiveness_band=portfolio_data.get("distinctiveness_band"),
                distinctiveness_band_after=portfolio_data.get("distinctiveness_band_after"),
                strategic_significance=portfolio_data.get("strategic_significance"),
            )
        elif portfolio_data.get("pre_development_ha") is not None:
            data_flags.append("bng_skipped_post_development_ha_missing")

        # Composite score — weighted blend over available (non-null) sub-scores,
        # re-normalised. If nothing is available, report insufficient_data.
        components: list[tuple[float, float]] = []  # (value, weight)
        if leap["leap_scores"]["composite"] is not None:
            components.append((leap["leap_scores"]["composite"], 0.35))
        if msa is not None:
            components.append((100 - msa["msa_loss_fraction"] * 100, 0.20))
        if gbf["overall_gbf_alignment_score"] is not None:
            components.append((gbf["overall_gbf_alignment_score"], 0.25))
        if bffi["bffi_score_pdf_m2yr_per_musd"] is not None:
            components.append((100 - min(bffi["bffi_score_pdf_m2yr_per_musd"] / 100, 100), 0.20))

        composite_score: Optional[float]
        if components:
            wsum = sum(w for _, w in components)
            composite_score = round(sum(v * w for v, w in components) / wsum, 1)
        else:
            composite_score = None

        if composite_score is None:
            materiality_rating = "insufficient_data"
        else:
            materiality_rating = "high" if composite_score >= 65 else ("medium" if composite_score >= 40 else "low")

        # Key risks — only include lines whose underlying metric is available.
        key_risks: list[str] = []
        if encore["top_5_high_dependency"]:
            key_risks.append(f"High ENCORE dependency: {encore['top_5_high_dependency'][0]['service_name']}")
        else:
            key_risks.append("Dependency data insufficient")
        if msa is not None:
            key_risks.append(f"MSA loss fraction: {msa['msa_loss_fraction']:.1%}")
        else:
            key_risks.append("MSA loss: insufficient land-use data")
        if gbf["cop15_30x30_contribution_pct"] is not None:
            key_risks.append(f"GBF 30x30 gap: {max(0.0, 30 - gbf['cop15_30x30_contribution_pct']):.1f}pp to target")
        else:
            key_risks.append("GBF 30x30 gap: protected-area data not reported")

        return {
            "entity_id": entity_id,
            "reporting_year": reporting_year,
            "assessment_id": str(uuid.uuid4()),
            "generated_at": date.today().isoformat(),
            "composite_biodiversity_score": composite_score,
            "composite_score_basis": "Weighted over available module scores; missing modules excluded and weights re-normalised.",
            "materiality_rating": materiality_rating,
            "data_completeness_flags": data_flags,
            "modules": {
                "tnfd_leap": leap,
                "pbaf_attribution": pbaf,
                "encore_services": encore,
                "msa_footprint": msa,
                "gbf_alignment": gbf,
                "bffi": bffi,
                "bng": bng,
            },
            "cross_framework_links": {
                "TNFD": "v1.0 Core Metrics — all 4 LEAP pillars",
                "ESRS_E4": "Biodiversity & Ecosystems — material topics, targets, KPIs",
                "GRI_304": "Biodiversity — significant impacts, area affected",
                "EU_Taxonomy_DNSH": "Do Not Significantly Harm — biodiversity criterion",
                "SBTN": "Science Based Targets for Nature v1.0 — steps 1-5",
            },
            "key_risks": key_risks,
            "recommendations": [
                "Conduct site-level TNFD LEAP for top-3 high-impact locations",
                "Adopt PBAF equity_ownership method for listed equity holdings",
                "Set SBTN freshwater and land targets aligned to GBF T01/T02",
                "Disclose ENCORE high-dependency services in ESRS E4 SBM-3",
            ],
        }


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------

_engine: Optional[BiodiversityFinanceV2Engine] = None


def get_engine() -> BiodiversityFinanceV2Engine:
    global _engine
    if _engine is None:
        _engine = BiodiversityFinanceV2Engine()
    return _engine
