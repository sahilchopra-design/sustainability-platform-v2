"""
Climate Data & MRV Infrastructure Engine  (E73)
================================================
ISO 14064-3:2019 verification, CDP CDSB data standards, satellite-based
GHG MRV (TROPOMI, GHGSat, Copernicus Sentinel-5P), OGMP 2.0 measurement,
AI-assisted quality scoring, digital MRV tiers 1-5, IPCC uncertainty
reporting, ISAE 3410 / ISSA 5000 assurance preparation.

References:
  - ISO 14064-3:2019 Specification with guidance for the verification and
    validation of GHG statements
  - IPCC 2006 Guidelines for National GHG Inventories (Tier 1/2/3)
  - CDP CDSB Framework Application Guidance (2022)
  - Oil & Gas Methane Partnership (OGMP) 2.0 Framework (2020)
  - ESA Copernicus Sentinel-5P / TROPOMI product documentation
  - GHGSat Ultra-High Resolution Methane Detection specifications
  - ISAE 3410 Assurance Engagements on GHG Statements
  - ISSA 5000 (IAASB, 2024) Sustainability Assurance Standard
  - PCAF Data Quality Score (DQS) framework

Data-integrity policy
---------------------
Every RETURNED metric is either a REAL computation from reference data and
caller-supplied inputs, or an HONEST NULL (``None`` / a note flag) when the
required input is absent. No entity metric is fabricated from a random draw.
Where an entity-specific measurement is not supplied, the engine falls back to
the published IPCC / MRV-tier *typical* value for the relevant tier and flags
it as a class-average estimate (``*_is_estimate = True``) rather than inventing
a facility-specific figure.
"""
from __future__ import annotations

from typing import Any, Optional

# ---------------------------------------------------------------------------
# Reference Data
# ---------------------------------------------------------------------------

MRV_TIERS: dict[int, dict] = {
    1: {
        "name": "Manual / Spreadsheet",
        "description": "Activity-data-based estimates using default emission factors; Excel/manual entry",
        "iso14064_level": "limited",
        "data_sources": ["manual_records", "invoices", "utility_bills"],
        "upgrade_cost_usd_range": (20_000, 80_000),
        "typical_uncertainty_pct": (20.0, 35.0),
        "ipcc_tier": 1,
    },
    2: {
        "name": "Automated / ERP-Integrated",
        "description": "Automated data collection via ERP/SCADA; facility-specific emission factors",
        "iso14064_level": "limited",
        "data_sources": ["erp_system", "scada", "smart_meters"],
        "upgrade_cost_usd_range": (80_000, 250_000),
        "typical_uncertainty_pct": (10.0, 20.0),
        "ipcc_tier": 2,
    },
    3: {
        "name": "Satellite-Augmented",
        "description": "Satellite-based CH4/CO2 plume detection combined with ground monitoring",
        "iso14064_level": "reasonable",
        "data_sources": ["tropomi", "ghgsat", "sentinel5p", "ground_monitors"],
        "upgrade_cost_usd_range": (150_000, 500_000),
        "typical_uncertainty_pct": (5.0, 12.0),
        "ipcc_tier": 2,
    },
    4: {
        "name": "AI-Enhanced",
        "description": "AI/ML anomaly detection, predictive gap-filling, near-real-time dashboards",
        "iso14064_level": "reasonable",
        "data_sources": ["iot_sensors", "cems", "satellite", "ai_models"],
        "upgrade_cost_usd_range": (300_000, 900_000),
        "typical_uncertainty_pct": (2.0, 7.0),
        "ipcc_tier": 3,
    },
    5: {
        "name": "Blockchain-Attested",
        "description": "Immutable on-chain audit trail; DLT-attested emission records; real-time",
        "iso14064_level": "reasonable",
        "data_sources": ["iot_sensors", "cems", "satellite", "blockchain_ledger"],
        "upgrade_cost_usd_range": (500_000, 2_000_000),
        "typical_uncertainty_pct": (1.0, 4.0),
        "ipcc_tier": 3,
    },
}

SATELLITE_PLATFORMS: dict[str, dict] = {
    "TROPOMI": {
        "full_name": "TROPOspheric Monitoring Instrument",
        "operator": "ESA / Copernicus",
        "satellite": "Sentinel-5P",
        "gases": ["CH4", "CO2", "NO2", "SO2", "CO", "O3"],
        "spatial_resolution_km": 3.5,
        "revisit_days": 1,
        "detection_limit_ppb": {"CH4": 1.0, "CO2": 0.5},
        "min_facility_size_ha": 50.0,
        "open_access": True,
    },
    "GHGSat": {
        "full_name": "GHGSat Ultra-High Resolution",
        "operator": "GHGSat Inc.",
        "satellite": "GHGSat-C1/C2/C3",
        "gases": ["CH4", "CO2"],
        "spatial_resolution_km": 0.025,
        "revisit_days": 3,
        "detection_limit_ppb": {"CH4": 0.3},
        "min_facility_size_ha": 0.5,
        "open_access": False,
        "cost_per_pass_usd": 2_000,
    },
    "Sentinel5P": {
        "full_name": "Copernicus Sentinel-5 Precursor",
        "operator": "ESA",
        "satellite": "Sentinel-5P",
        "gases": ["CH4", "NO2", "SO2", "CO", "O3"],
        "spatial_resolution_km": 7.0,
        "revisit_days": 1,
        "detection_limit_ppb": {"CH4": 2.0},
        "min_facility_size_ha": 100.0,
        "open_access": True,
    },
    "Carbon_Mapper": {
        "full_name": "Carbon Mapper Coalition",
        "operator": "Planet Labs / Carbon Mapper",
        "satellite": "Tanager-1",
        "gases": ["CH4", "CO2"],
        "spatial_resolution_km": 0.030,
        "revisit_days": 3,
        "detection_limit_ppb": {"CH4": 0.5},
        "min_facility_size_ha": 1.0,
        "open_access": False,
    },
}

VERIFICATION_BODIES: list[dict] = [
    {"name": "Bureau Veritas", "accreditation": ["ISO_14064_3", "ISAE_3410", "GHG_Protocol"], "tier": "tier1"},
    {"name": "SGS", "accreditation": ["ISO_14064_3", "ISAE_3410", "CDP"], "tier": "tier1"},
    {"name": "DNV", "accreditation": ["ISO_14064_3", "ISAE_3410", "ISSA_5000"], "tier": "tier1"},
    {"name": "KPMG", "accreditation": ["ISAE_3410", "ISSA_5000", "CSRD"], "tier": "big4"},
    {"name": "PwC", "accreditation": ["ISAE_3410", "ISSA_5000", "CSRD"], "tier": "big4"},
    {"name": "Deloitte", "accreditation": ["ISAE_3410", "ISSA_5000", "CSRD"], "tier": "big4"},
    {"name": "ERM CVS", "accreditation": ["ISO_14064_3", "GHG_Protocol", "SBTi"], "tier": "specialist"},
    {"name": "South Pole", "accreditation": ["ISO_14064_3", "VCS", "Gold_Standard"], "tier": "specialist"},
]

CDP_CDSB_REQUIREMENTS: dict[str, list] = {
    "materiality": ["climate_risk_disclosure", "natural_capital_impact"],
    "management": ["governance_structure", "risk_management_process", "targets_metrics"],
    "performance": ["scope1_emissions", "scope2_emissions", "scope3_emissions",
                    "energy_consumption", "water_usage"],
    "targets": ["sbti_alignment", "net_zero_commitment", "interim_milestones"],
    "verification": ["third_party_assurance", "methodology_disclosure", "boundary_statement"],
}

IPCC_UNCERTAINTY_TIERS: dict[str, dict] = {
    "Tier1": {
        "method": "Default emission factors from IPCC inventory guidelines",
        "typical_uncertainty_pct": 30.0,
        "data_requirements": "Low — national average activity data",
        "suitable_for": "reporting_only",
    },
    "Tier2": {
        "method": "Country/facility-specific emission factors with measured activity data",
        "typical_uncertainty_pct": 15.0,
        "data_requirements": "Medium — facility metering required",
        "suitable_for": "limited_assurance",
    },
    "Tier3": {
        "method": "Direct measurement (CEMS, continuous monitoring, mass balance)",
        "typical_uncertainty_pct": 5.0,
        "data_requirements": "High — continuous automated monitoring",
        "suitable_for": "reasonable_assurance",
    },
}

DQS_MAPPING: dict[int, dict] = {
    1: {"label": "Verified primary data", "min_ipcc_tier": "Tier3", "max_uncertainty_pct": 5.0},
    2: {"label": "Verified secondary data", "min_ipcc_tier": "Tier2", "max_uncertainty_pct": 15.0},
    3: {"label": "Calculated from activity data", "min_ipcc_tier": "Tier2", "max_uncertainty_pct": 25.0},
    4: {"label": "Modelled / estimated", "min_ipcc_tier": "Tier1", "max_uncertainty_pct": 40.0},
    5: {"label": "Proxies / industry averages", "min_ipcc_tier": "Tier1", "max_uncertainty_pct": 60.0},
}

MRV_UPGRADE_TECHNOLOGIES: dict[str, dict] = {
    "iot_sensors": {
        "description": "IoT-connected emissions sensors (CH4, CO2, NOx)",
        "capex_per_point_usd": 3_500,
        "annual_opex_usd": 800,
        "uncertainty_improvement_pct": 8.0,
        "min_tier_enabled": 4,
    },
    "cems": {
        "description": "Continuous Emissions Monitoring System",
        "capex_per_point_usd": 45_000,
        "annual_opex_usd": 12_000,
        "uncertainty_improvement_pct": 15.0,
        "min_tier_enabled": 3,
    },
    "satellite_subscription": {
        "description": "GHGSat / Planet subscription for methane detection",
        "capex_per_point_usd": 0,
        "annual_opex_usd": 25_000,
        "uncertainty_improvement_pct": 10.0,
        "min_tier_enabled": 3,
    },
    "ai_analytics_platform": {
        "description": "AI/ML platform for anomaly detection and gap-filling",
        "capex_per_point_usd": 0,
        "annual_opex_usd": 60_000,
        "uncertainty_improvement_pct": 5.0,
        "min_tier_enabled": 4,
    },
    "blockchain_registry": {
        "description": "DLT-based immutable emissions registry",
        "capex_per_point_usd": 0,
        "annual_opex_usd": 40_000,
        "uncertainty_improvement_pct": 1.5,
        "min_tier_enabled": 5,
    },
    "erp_integration": {
        "description": "ERP/SAP integration for automated data feeds",
        "capex_per_point_usd": 0,
        "annual_opex_usd": 30_000,
        "uncertainty_improvement_pct": 7.0,
        "min_tier_enabled": 2,
    },
}

# Deterministic MODEL calibration constants (documented; not entity metrics).
# Typical elapsed months to implement a single tier upgrade step, from MRV
# vendor deployment benchmarks. Used only when the caller does not supply an
# entity-specific project timeline.
_TIER_STEP_DURATION_MONTHS: dict[int, int] = {2: 6, 3: 9, 4: 10, 5: 8}
# Default number of measurement points per technology when the caller does not
# provide a facility-specific deployment plan (conservative single-point basis).
_DEFAULT_POINTS_PER_TECHNOLOGY = 1


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def _tier_midpoint_uncertainty(tier: int) -> float:
    """Midpoint of the published typical-uncertainty range for an MRV tier.

    This is a documented class-average (per MRV_TIERS reference data), NOT a
    facility-specific measurement. Callers that surface it must flag it as an
    estimate.
    """
    lo, hi = MRV_TIERS[tier]["typical_uncertainty_pct"]
    return (lo + hi) / 2.0


def _dqs_from_uncertainty(uncertainty_pct: float) -> int:
    for dqs_level in sorted(DQS_MAPPING.keys()):
        if uncertainty_pct <= DQS_MAPPING[dqs_level]["max_uncertainty_pct"]:
            return dqs_level
    return 5


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def assess_mrv_tier(
    entity_id: str,
    facility_type: str,
    current_capabilities: dict,
    measured_uncertainty_pct: Optional[float] = None,
) -> dict[str, Any]:
    """
    Assess MRV tier (1-5) and generate upgrade roadmap.

    Covers ISO 14064-3:2019 verification requirements, gap analysis,
    and IPCC uncertainty tiers for each capability level.

    ``measured_uncertainty_pct`` (optional): the facility's actual reported
    inventory uncertainty. When supplied, the DQS score is computed from it.
    When absent, the tier's published typical-range midpoint is used and
    flagged (``current_uncertainty_is_estimate = True``) — no facility-specific
    figure is fabricated.
    """
    # Infer current tier from capabilities
    has_erp = current_capabilities.get("erp_integrated", False)
    has_sensors = current_capabilities.get("iot_sensors", False)
    has_satellite = current_capabilities.get("satellite", False)
    has_ai = current_capabilities.get("ai_analytics", False)
    has_blockchain = current_capabilities.get("blockchain", False)

    if has_blockchain and has_ai and has_satellite:
        current_tier = 5
    elif has_ai and has_satellite:
        current_tier = 4
    elif has_satellite:
        current_tier = 3
    elif has_erp or has_sensors:
        current_tier = 2
    else:
        current_tier = 1

    current_tier_data = MRV_TIERS[current_tier]

    # Uncertainty: real measurement if supplied, else class-average estimate
    # from the tier's published typical range (flagged as an estimate).
    if measured_uncertainty_pct is not None:
        current_uncertainty = _clamp(float(measured_uncertainty_pct), 0.0, 100.0)
        uncertainty_is_estimate = False
    else:
        current_uncertainty = _tier_midpoint_uncertainty(current_tier)
        uncertainty_is_estimate = True

    # Gap analysis: what's missing for tier+1 and tier+2
    gaps = []
    recommendations = []
    if current_tier < 2:
        gaps.append("No ERP/automated data collection")
        recommendations.append("Implement ERP integration or smart metering")
    if current_tier < 3:
        gaps.append("No satellite monitoring coverage")
        recommendations.append("Procure GHGSat or subscribe to Copernicus Sentinel-5P")
    if current_tier < 4:
        gaps.append("No AI-enhanced anomaly detection")
        recommendations.append("Deploy AI/ML platform for emissions quality scoring")
    if current_tier < 5:
        gaps.append("No blockchain attestation")
        recommendations.append("Implement DLT-based immutable registry (optional — Tier 5)")

    # ISO 14064-3 verification requirements per tier
    iso_level = current_tier_data["iso14064_level"]
    iso_requirements = {
        "limited": [
            "Boundary and base year documentation",
            "Quantification methodology disclosure",
            "Limited assurance statement from accredited body",
        ],
        "reasonable": [
            "Full boundary and base year documentation",
            "Direct measurement or facility-specific factors",
            "Independent verifier site visits",
            "Reasonable assurance statement (ISAE 3410 equivalent)",
        ],
    }.get(iso_level, [])

    return {
        "entity_id": entity_id,
        "facility_type": facility_type,
        "current_tier": current_tier,
        "current_tier_name": current_tier_data["name"],
        "current_tier_description": current_tier_data["description"],
        "current_uncertainty_pct": round(current_uncertainty, 1),
        "current_uncertainty_is_estimate": uncertainty_is_estimate,
        "ipcc_tier": current_tier_data["ipcc_tier"],
        "iso_14064_level": iso_level,
        "iso_14064_requirements": iso_requirements,
        "data_sources": current_tier_data["data_sources"],
        "dqs_score": _dqs_from_uncertainty(current_uncertainty),
        "gaps": gaps,
        "recommendations": recommendations,
        "tier_profiles": {
            str(k): {
                "name": v["name"],
                "iso14064_level": v["iso14064_level"],
                "typical_uncertainty_range_pct": list(v["typical_uncertainty_pct"]),
            }
            for k, v in MRV_TIERS.items()
        },
    }


def calculate_data_quality(
    entity_id: str,
    emission_sources: list[dict],
    measurement_methods: list[str],
    cdp_disclosures: Optional[dict] = None,
    ai_anomaly_report: Optional[dict] = None,
) -> dict[str, Any]:
    """
    Score MRV data quality using IPCC uncertainty tiers, PCAF DQS 1-5,
    CDP CDSB compliance, and AI-assisted anomaly detection.

    Uncertainty per source is taken from a caller-supplied ``uncertainty_pct``
    on the source dict when present, otherwise from the published IPCC typical
    uncertainty for the source's method tier (a documented class-average, NOT a
    random draw).

    ``cdp_disclosures`` (optional): ``{category: bool}`` map of which CDP CDSB
    requirement categories the entity has disclosed. When absent, CDP
    compliance is reported as ``None`` / ``insufficient_data`` — never guessed.

    ``ai_anomaly_report`` (optional): output of a real anomaly-detection run,
    e.g. ``{"score": 0-100, "anomalies_detected": int,
    "anomaly_types": [...]}``. When absent, the AI assessment is reported as
    ``None`` / ``insufficient_data`` — never fabricated.
    """
    if not emission_sources:
        # No fabricated sources: return an explicit insufficient-data result.
        return {
            "entity_id": entity_id,
            "source_quality_scores": [],
            "portfolio": {
                "total_tco2e": 0.0,
                "weighted_uncertainty_pct": None,
                "portfolio_dqs": None,
                "dqs_label": None,
                "status": "insufficient_data",
                "note": "No emission_sources supplied; provide sources with method (Tier1/2/3) and value_tco2e.",
            },
            "ai_quality_assessment": _build_ai_assessment(ai_anomaly_report),
            "cdp_cdsb_compliance": _build_cdp_compliance(cdp_disclosures),
            "measurement_methods": measurement_methods,
        }

    source_scores = []
    total_tco2e = 0.0
    weighted_uncertainty = 0.0

    for src in emission_sources:
        ipcc_tier = src.get("method", "Tier2")
        tier_data = IPCC_UNCERTAINTY_TIERS.get(ipcc_tier, IPCC_UNCERTAINTY_TIERS["Tier2"])
        # Real per-source uncertainty if supplied; else published IPCC typical
        # value for the tier (documented class-average, flagged as estimate).
        supplied_unc = src.get("uncertainty_pct")
        if supplied_unc is not None:
            actual_unc = _clamp(float(supplied_unc), 1.0, 70.0)
            unc_is_estimate = False
        else:
            actual_unc = _clamp(float(tier_data["typical_uncertainty_pct"]), 1.0, 70.0)
            unc_is_estimate = True
        dqs = _dqs_from_uncertainty(actual_unc)
        value = float(src.get("value_tco2e", 0))
        total_tco2e += value
        weighted_uncertainty += actual_unc * value
        source_scores.append({
            "source": src.get("source", "unknown"),
            "ipcc_tier": ipcc_tier,
            "value_tco2e": value,
            "uncertainty_pct": round(actual_unc, 1),
            "uncertainty_is_estimate": unc_is_estimate,
            "dqs_score": dqs,
            "quality_label": DQS_MAPPING[dqs]["label"],
        })

    if total_tco2e > 0:
        portfolio_uncertainty: Optional[float] = weighted_uncertainty / total_tco2e
        portfolio_dqs: Optional[int] = _dqs_from_uncertainty(portfolio_uncertainty)
        portfolio_dqs_label: Optional[str] = DQS_MAPPING[portfolio_dqs]["label"]
    else:
        # Sources present but no positive tonnage → cannot weight; be honest.
        portfolio_uncertainty = None
        portfolio_dqs = None
        portfolio_dqs_label = None

    return {
        "entity_id": entity_id,
        "source_quality_scores": source_scores,
        "portfolio": {
            "total_tco2e": round(total_tco2e, 1),
            "weighted_uncertainty_pct": (
                round(portfolio_uncertainty, 1) if portfolio_uncertainty is not None else None
            ),
            "portfolio_dqs": portfolio_dqs,
            "dqs_label": portfolio_dqs_label,
        },
        "ai_quality_assessment": _build_ai_assessment(ai_anomaly_report),
        "cdp_cdsb_compliance": _build_cdp_compliance(cdp_disclosures),
        "measurement_methods": measurement_methods,
    }


def _build_ai_assessment(ai_anomaly_report: Optional[dict]) -> dict[str, Any]:
    """Build the AI quality-assessment block from a real anomaly report, or an
    honest insufficient-data block when none is supplied."""
    if not ai_anomaly_report:
        return {
            "score": None,
            "anomalies_detected": None,
            "anomaly_types": [],
            "status": "insufficient_data",
            "note": "No ai_anomaly_report supplied; connect an anomaly-detection run to populate this.",
        }
    score = ai_anomaly_report.get("score")
    anomalies_detected = ai_anomaly_report.get("anomalies_detected")
    anomaly_types = ai_anomaly_report.get("anomaly_types", []) or []
    return {
        "score": round(float(score), 1) if score is not None else None,
        "anomalies_detected": (
            int(anomalies_detected) if anomalies_detected is not None else None
        ),
        "anomaly_types": list(anomaly_types),
        "status": "reported",
    }


def _build_cdp_compliance(cdp_disclosures: Optional[dict]) -> dict[str, Any]:
    """Build the CDP CDSB compliance block from caller-supplied disclosure
    flags, or an honest insufficient-data block when none is supplied.

    ``cdp_disclosures`` maps CDP_CDSB_REQUIREMENTS category names to booleans
    indicating whether the entity has disclosed that category. Categories not
    present in the map are treated as not disclosed (False)."""
    if cdp_disclosures is None:
        return {
            "category_compliance": {c: None for c in CDP_CDSB_REQUIREMENTS},
            "overall_score_pct": None,
            "status": "insufficient_data",
            "note": "No cdp_disclosures supplied; provide a {category: bool} disclosure map.",
        }
    category_compliance: dict[str, bool] = {
        category: bool(cdp_disclosures.get(category, False))
        for category in CDP_CDSB_REQUIREMENTS
    }
    cdp_overall = (
        sum(category_compliance.values()) / len(category_compliance) * 100
        if category_compliance else 0.0
    )
    return {
        "category_compliance": category_compliance,
        "overall_score_pct": round(cdp_overall, 1),
        "status": "compliant" if cdp_overall >= 70 else "partial",
    }


def verify_satellite_coverage(
    entity_id: str,
    lat: float,
    lng: float,
    facility_size_ha: float,
    cloud_cover_pct: Optional[float] = None,
) -> dict[str, Any]:
    """
    Assess satellite GHG detection coverage for a facility location.

    Evaluates TROPOMI, GHGSat, Sentinel-5P and Carbon Mapper against
    facility size and location-specific revisit frequencies.

    ``cloud_cover_pct`` (optional): mean annual cloud cover at the site (0-100),
    e.g. from a climatology dataset. When supplied, effective coverage days per
    year are derived from it. When absent, effective coverage days are reported
    as ``None`` (``cloud_cover_pct`` is ``None``) — the deterministic
    revisit/detectability geometry is still fully computed and returned.
    """
    have_cloud = cloud_cover_pct is not None
    cc_value = _clamp(float(cloud_cover_pct), 0.0, 100.0) if have_cloud else None

    coverage: dict[str, dict] = {}
    for platform_name, platform in SATELLITE_PLATFORMS.items():
        detectable = facility_size_ha >= platform["min_facility_size_ha"]

        # Latitude affects revisit due to orbit geometry (deterministic)
        orbit_factor = 1.0 + abs(lat) / 90.0 * 0.5
        effective_revisit = round(platform["revisit_days"] * orbit_factor, 1)

        # Effective coverage days require a real cloud-cover input; else null.
        if have_cloud and effective_revisit > 0:
            effective_coverage_days_pa: Optional[int] = max(
                0, int(365 / effective_revisit * (1 - cc_value / 100))
            )
        else:
            effective_coverage_days_pa = None

        detection_limits = platform.get("detection_limit_ppb", {})
        cost_per_year = (
            platform.get("cost_per_pass_usd", 0) * (365 / effective_revisit)
            if effective_revisit > 0 else 0
        )

        coverage[platform_name] = {
            "detectable": detectable,
            "gases_monitored": platform["gases"],
            "spatial_resolution_km": platform["spatial_resolution_km"],
            "revisit_days_nominal": platform["revisit_days"],
            "revisit_days_effective": effective_revisit,
            "cloud_cover_pct": cc_value,
            "effective_coverage_days_pa": effective_coverage_days_pa,
            "detection_limits_ppb": detection_limits,
            "open_access": platform.get("open_access", True),
            "annual_cost_estimate_usd": round(cost_per_year, 0),
            "min_facility_size_ha": platform["min_facility_size_ha"],
        }

    # Best platform recommendation (highest spatial resolution among detectable)
    detectable_platforms = [p for p, d in coverage.items() if d["detectable"]]
    best_platform = min(
        detectable_platforms,
        key=lambda p: coverage[p]["spatial_resolution_km"],
    ) if detectable_platforms else None

    return {
        "entity_id": entity_id,
        "facility_location": {"lat": lat, "lng": lng},
        "facility_size_ha": facility_size_ha,
        "cloud_cover_pct_input": cc_value,
        "platform_coverage": coverage,
        "recommendation": {
            "best_platform": best_platform,
            "rationale": (
                f"{best_platform} provides highest spatial resolution for facility size {facility_size_ha}ha"
                if best_platform
                else "Facility too small for current satellite detection limits"
            ),
            "ogmp_2_level": 5 if best_platform in {"GHGSat", "Carbon_Mapper"} else (3 if best_platform == "TROPOMI" else 2),
        },
    }


def score_verification_readiness(
    entity_id: str,
    standard: str,
    scope_1_2_3: dict,
    readiness_inputs: Optional[dict] = None,
    issa_requirements_met: Optional[int] = None,
) -> dict[str, Any]:
    """
    Score verification readiness against ISO 14064-3, ISAE 3410, ISSA 5000.

    Returns assurance level achievable, verifier qualification requirements,
    and ISSA 5000 preparation score.

    ``readiness_inputs`` (optional): ``{criterion: score_0_to_10}`` map of the
    eight readiness dimensions (``boundary_documentation``,
    ``methodology_disclosure``, ``data_management_system``, ``internal_qa_qc``,
    ``scope3_coverage``, ``prior_year_comparative``, ``management_sign_off``,
    ``verifier_access``). Criteria the caller does not score are reported as
    ``None``. If no criterion is scored at all, the overall readiness score and
    achievable assurance level are ``None`` / ``insufficient_data`` — never
    fabricated.

    ``issa_requirements_met`` (optional): count (0-24) of ISSA 5000 requirements
    the entity meets. When absent, the ISSA 5000 preparation score is ``None``.

    Missing scope figures are reported as ``None`` (not random draws); only
    supplied scope values contribute to the emissions boundary total.
    """
    # Only real, caller-supplied scope figures contribute; missing → None.
    scope1 = _opt_float(scope_1_2_3.get("scope1_tco2e"))
    scope2 = _opt_float(scope_1_2_3.get("scope2_tco2e"))
    scope3 = _opt_float(scope_1_2_3.get("scope3_tco2e"))
    supplied = [s for s in (scope1, scope2, scope3) if s is not None]
    total: Optional[float] = sum(supplied) if supplied else None

    # Readiness criteria dimensions (all eight).
    criteria_keys = [
        "boundary_documentation",
        "methodology_disclosure",
        "data_management_system",
        "internal_qa_qc",
        "scope3_coverage",
        "prior_year_comparative",
        "management_sign_off",
        "verifier_access",
    ]
    inputs = readiness_inputs or {}
    criteria: dict[str, Optional[float]] = {}
    for key in criteria_keys:
        raw = inputs.get(key)
        criteria[key] = round(_clamp(float(raw), 0.0, 10.0), 1) if raw is not None else None

    scored_values = [v for v in criteria.values() if v is not None]
    if scored_values:
        overall_score: Optional[float] = round(sum(scored_values) / len(scored_values), 1)
        achievable_assurance = (
            "reasonable" if overall_score >= 7.5
            else ("limited" if overall_score >= 5.5 else "none")
        )
        iso_equiv = achievable_assurance != "none"
        isae_equiv = achievable_assurance == "reasonable"
    else:
        overall_score = None
        achievable_assurance = "insufficient_data"
        iso_equiv = None
        isae_equiv = None

    # ISSA 5000 preparation — requires a real count; else honest null.
    if issa_requirements_met is not None:
        met = int(_clamp(float(issa_requirements_met), 0, 24))
        issa_score: Optional[float] = round(met / 24 * 100, 1)
        issa_readiness = (
            "ready" if issa_score >= 80 else ("nearly_ready" if issa_score >= 60 else "requires_work")
        )
        issa_block: dict[str, Any] = {
            "requirements_met": met,
            "total_requirements": 24,
            "score_pct": issa_score,
            "readiness": issa_readiness,
        }
    else:
        issa_block = {
            "requirements_met": None,
            "total_requirements": 24,
            "score_pct": None,
            "readiness": "insufficient_data",
            "note": "No issa_requirements_met supplied; provide a count (0-24).",
        }

    # Verifier qualification (deterministic filter on accreditation)
    suitable_verifiers = [
        vb for vb in VERIFICATION_BODIES
        if standard in vb["accreditation"] or "ISO_14064_3" in vb["accreditation"]
    ]

    return {
        "entity_id": entity_id,
        "standard": standard,
        "emissions_boundary": {
            "scope1_tco2e": round(scope1, 1) if scope1 is not None else None,
            "scope2_tco2e": round(scope2, 1) if scope2 is not None else None,
            "scope3_tco2e": round(scope3, 1) if scope3 is not None else None,
            "total_tco2e": round(total, 1) if total is not None else None,
        },
        "readiness_criteria": criteria,
        "overall_readiness_score": overall_score,
        "achievable_assurance_level": achievable_assurance,
        "iso_14064_3_equivalence": iso_equiv,
        "isae_3410_equivalence": isae_equiv,
        "issa_5000_preparation": issa_block,
        "suitable_verifiers": suitable_verifiers[:3],
        "blocking_issues": [
            k for k, v in criteria.items() if v is not None and v < 5.0
        ],
    }


def _opt_float(value: Any) -> Optional[float]:
    """Coerce to float if a real value is present; else None (no fabrication)."""
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def generate_mrv_improvement_plan(
    entity_id: str,
    current_tier: int,
    target_tier: int,
    budget_usd: float,
    points_per_technology: Optional[dict] = None,
    data_quality_uplift_usd_pa: Optional[float] = None,
) -> dict[str, Any]:
    """
    Generate MRV upgrade plan from current_tier to target_tier.

    Models technology costs, timeline, and uncertainty reduction from the
    published MRV_UPGRADE_TECHNOLOGIES reference data across the roadmap.

    ``points_per_technology`` (optional): ``{technology_name: n_points}`` map of
    how many measurement points the entity will deploy per technology. When a
    technology is not specified, a conservative single-point basis
    (``_DEFAULT_POINTS_PER_TECHNOLOGY``) is used — a documented model default,
    not a random draw.

    ``data_quality_uplift_usd_pa`` (optional): the entity's estimated annual
    financial benefit from improved data quality (lower audit cost + carbon
    credit premium). ROI/payback are computed only when this is supplied;
    otherwise they are reported as ``None`` / ``insufficient_data`` — never
    invented.

    Timelines use documented per-tier-step deployment benchmarks
    (``_TIER_STEP_DURATION_MONTHS``), a model calibration constant, not a random
    draw. Current/target uncertainty are the published tier typical-range
    midpoints (class-averages, flagged ``*_is_estimate``).
    """
    current_tier = max(1, min(5, current_tier))
    target_tier = max(current_tier + 1, min(5, target_tier))
    points_map = points_per_technology or {}

    steps = []
    cumulative_cost = 0.0
    cumulative_uncertainty_reduction = 0.0
    month = 0

    # Technologies needed for each tier step
    tier_technology_map: dict[int, list] = {
        2: ["erp_integration"],
        3: ["satellite_subscription", "cems"],
        4: ["iot_sensors", "ai_analytics_platform"],
        5: ["blockchain_registry"],
    }

    for tier_step in range(current_tier + 1, target_tier + 1):
        techs = tier_technology_map.get(tier_step, [])
        tier_cost = 0.0
        tier_unc_reduction = 0.0
        tech_details = []

        for tech_name in techs:
            if tech_name not in MRV_UPGRADE_TECHNOLOGIES:
                continue
            tech = MRV_UPGRADE_TECHNOLOGIES[tech_name]
            # Deployment size: caller-supplied per-technology point count, else
            # documented single-point default (not a random draw).
            raw_points = points_map.get(tech_name, _DEFAULT_POINTS_PER_TECHNOLOGY)
            try:
                n_points = max(1, int(raw_points))
            except (TypeError, ValueError):
                n_points = _DEFAULT_POINTS_PER_TECHNOLOGY
            capex = tech["capex_per_point_usd"] * n_points
            annual_opex = tech["annual_opex_usd"]
            total_3yr = capex + annual_opex * 3
            tier_cost += total_3yr
            tier_unc_reduction += tech["uncertainty_improvement_pct"]
            tech_details.append({
                "technology": tech_name,
                "description": tech["description"],
                "points_deployed": n_points,
                "capex_usd": round(capex, 0),
                "annual_opex_usd": annual_opex,
                "3yr_total_usd": round(total_3yr, 0),
                "uncertainty_improvement_pct": tech["uncertainty_improvement_pct"],
            })

        # Deterministic timeline from documented per-step benchmark.
        duration_months = _TIER_STEP_DURATION_MONTHS.get(tier_step, 9)
        month += duration_months
        cumulative_cost += tier_cost
        cumulative_uncertainty_reduction += tier_unc_reduction

        within_budget = cumulative_cost <= budget_usd
        steps.append({
            "from_tier": tier_step - 1,
            "to_tier": tier_step,
            "tier_name": MRV_TIERS[tier_step]["name"],
            "duration_months": duration_months,
            "cumulative_month": month,
            "technologies": tech_details,
            "step_cost_usd": round(tier_cost, 0),
            "cumulative_cost_usd": round(cumulative_cost, 0),
            "within_budget": within_budget,
            "uncertainty_reduction_pct": round(tier_unc_reduction, 1),
            "cumulative_uncertainty_reduction_pct": round(cumulative_uncertainty_reduction, 1),
        })

    # Uncertainty endpoints: published tier typical-range midpoints (documented
    # class-averages, flagged as estimates — not facility measurements).
    current_unc = _tier_midpoint_uncertainty(current_tier)
    target_unc = _tier_midpoint_uncertainty(target_tier)

    # ROI: only computed from a real, caller-supplied uplift figure; else null.
    if data_quality_uplift_usd_pa is not None:
        uplift = float(data_quality_uplift_usd_pa)
        roi_analysis: dict[str, Any] = {
            "data_quality_uplift_usd_pa": round(uplift, 0),
            "payback_years": round(cumulative_cost / uplift, 1) if uplift > 0 else None,
            "3yr_net_benefit_usd": round(uplift * 3 - cumulative_cost, 0),
        }
    else:
        roi_analysis = {
            "data_quality_uplift_usd_pa": None,
            "payback_years": None,
            "3yr_net_benefit_usd": None,
            "status": "insufficient_data",
            "note": "No data_quality_uplift_usd_pa supplied; provide the estimated annual benefit to compute ROI.",
        }

    return {
        "entity_id": entity_id,
        "current_tier": current_tier,
        "target_tier": target_tier,
        "budget_usd": budget_usd,
        "total_estimated_cost_usd": round(cumulative_cost, 0),
        "within_budget": cumulative_cost <= budget_usd,
        "total_duration_months": month,
        "current_uncertainty_pct": round(current_unc, 1),
        "current_uncertainty_is_estimate": True,
        "target_uncertainty_pct": round(target_unc, 1),
        "target_uncertainty_is_estimate": True,
        "uncertainty_reduction_pct": round(current_unc - target_unc, 1),
        "roadmap_steps": steps,
        "roi_analysis": roi_analysis,
    }
