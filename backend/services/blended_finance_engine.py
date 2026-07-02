"""
Blended Finance & DFI Instruments Engine  (E72)
================================================
IFC Performance Standards 1-8, MIGA, EBRD, ADB, AIIB, AfDB mobilisation
ratios (Convergence 2023), concessional layer sizing, first-loss tranche
modelling, guarantee structures, OECD DAC ODA/OOF eligibility, DFI EDGE.

References:
  - IFC Performance Standards 1-8 (2012 / 2021)
  - Convergence Blended Finance State of the Market 2023
  - OECD DAC Blended Finance Principles (2018)
  - MDB Harmonised Framework for Additionality (2018)
  - OECD DAC ODA/OOF definitions
  - DFI EDGE Green Building Certification
  - MIGA Environmental & Social Policy (2013)
  - EBRD Environmental & Social Policy (2019)
  - ADB Safeguard Policy Statement (2009)
"""
from __future__ import annotations

from typing import Any, Optional

# ---------------------------------------------------------------------------
# Reference Data
# ---------------------------------------------------------------------------

IFC_PS_CATEGORIES: dict[str, dict] = {
    "PS1": {"name": "Assessment & Management of E&S Risks", "weight": 0.18},
    "PS2": {"name": "Labor and Working Conditions", "weight": 0.14},
    "PS3": {"name": "Resource Efficiency and Pollution Prevention", "weight": 0.14},
    "PS4": {"name": "Community Health, Safety and Security", "weight": 0.12},
    "PS5": {"name": "Land Acquisition and Involuntary Resettlement", "weight": 0.10},
    "PS6": {"name": "Biodiversity Conservation and Sustainable Management", "weight": 0.12},
    "PS7": {"name": "Indigenous Peoples", "weight": 0.10},
    "PS8": {"name": "Cultural Heritage", "weight": 0.10},
}

DFI_PROFILES: dict[str, dict] = {
    "IFC": {
        "full_name": "International Finance Corporation",
        "group": "World Bank Group",
        "focus_sectors": ["infrastructure", "manufacturing", "agribusiness", "financial_markets"],
        "min_project_size_usd": 10_000_000,
        "max_project_size_usd": 2_000_000_000,
        "concessional_window": "IFC MCPP",
        "mobilisation_target_ratio": 5.0,
        "oda_eligible": False,
        "country_focus": "emerging_markets",
        "es_framework": "IFC_PS_2012",
    },
    "MIGA": {
        "full_name": "Multilateral Investment Guarantee Agency",
        "group": "World Bank Group",
        "focus_sectors": ["infrastructure", "extractives", "manufacturing", "services"],
        "min_project_size_usd": 5_000_000,
        "max_project_size_usd": 1_500_000_000,
        "concessional_window": "MIGA Guarantee",
        "mobilisation_target_ratio": 6.0,
        "oda_eligible": False,
        "country_focus": "frontier_markets",
        "es_framework": "MIGA_ESP_2013",
    },
    "EBRD": {
        "full_name": "European Bank for Reconstruction and Development",
        "group": "EBRD",
        "focus_sectors": ["energy", "infrastructure", "agribusiness", "financial_institutions"],
        "min_project_size_usd": 5_000_000,
        "max_project_size_usd": 500_000_000,
        "concessional_window": "EBRD Green Economy Transition",
        "mobilisation_target_ratio": 4.5,
        "oda_eligible": True,
        "country_focus": "transition_economies",
        "es_framework": "EBRD_ESP_2019",
    },
    "ADB": {
        "full_name": "Asian Development Bank",
        "group": "ADB",
        "focus_sectors": ["transport", "energy", "water", "urban", "agriculture"],
        "min_project_size_usd": 2_000_000,
        "max_project_size_usd": 800_000_000,
        "concessional_window": "ADB Technical Assistance",
        "mobilisation_target_ratio": 3.8,
        "oda_eligible": True,
        "country_focus": "asia_pacific",
        "es_framework": "ADB_SPS_2009",
    },
    "AIIB": {
        "full_name": "Asian Infrastructure Investment Bank",
        "group": "AIIB",
        "focus_sectors": ["infrastructure", "energy", "transport", "telecom"],
        "min_project_size_usd": 10_000_000,
        "max_project_size_usd": 1_000_000_000,
        "concessional_window": "AIIB Project Preparation Fund",
        "mobilisation_target_ratio": 4.2,
        "oda_eligible": False,
        "country_focus": "asia",
        "es_framework": "AIIB_ESP_2021",
    },
    "AfDB": {
        "full_name": "African Development Bank",
        "group": "AfDB",
        "focus_sectors": ["agriculture", "infrastructure", "energy", "social"],
        "min_project_size_usd": 1_000_000,
        "max_project_size_usd": 300_000_000,
        "concessional_window": "ADF Concessional Window",
        "mobilisation_target_ratio": 3.2,
        "oda_eligible": True,
        "country_focus": "africa",
        "es_framework": "ISSP_2014",
    },
}

# Convergence 2023 benchmarks
CONVERGENCE_BENCHMARKS: dict[str, dict] = {
    "infrastructure":     {"mean_ratio": 5.5, "median_ratio": 4.8, "p25": 3.2, "p75": 7.1},
    "climate":            {"mean_ratio": 4.2, "median_ratio": 3.9, "p25": 2.5, "p75": 5.8},
    "agriculture":        {"mean_ratio": 3.1, "median_ratio": 2.8, "p25": 1.9, "p75": 4.3},
    "health":             {"mean_ratio": 2.8, "median_ratio": 2.5, "p25": 1.5, "p75": 3.9},
    "education":          {"mean_ratio": 2.2, "median_ratio": 2.0, "p25": 1.3, "p75": 3.1},
    "financial_inclusion": {"mean_ratio": 4.8, "median_ratio": 4.2, "p25": 2.9, "p75": 6.4},
    "water":              {"mean_ratio": 3.6, "median_ratio": 3.2, "p25": 2.1, "p75": 4.9},
    "energy":             {"mean_ratio": 5.1, "median_ratio": 4.6, "p25": 3.0, "p75": 6.8},
}

INSTRUMENT_CONFIGS: dict[str, dict] = {
    "guarantees": {
        "description": "Risk guarantee covering private investor losses",
        "concessional_share_range": (0.05, 0.20),
        "typical_coverage_pct": (0.50, 0.85),
        "return_enhancement_bps": (50, 200),
        "oda_eligible": True,
        "risk_mitigant": "credit_default",
    },
    "first_loss": {
        "description": "First-loss tranche absorbing initial losses",
        "concessional_share_range": (0.10, 0.25),
        "typical_coverage_pct": (0.10, 0.30),
        "return_enhancement_bps": (100, 350),
        "oda_eligible": True,
        "risk_mitigant": "first_loss_buffer",
    },
    "concessional_loans": {
        "description": "Below-market rate loans from public/philanthropic sources",
        "concessional_share_range": (0.15, 0.40),
        "typical_coverage_pct": (0.15, 0.40),
        "return_enhancement_bps": (150, 400),
        "oda_eligible": True,
        "risk_mitigant": "interest_rate_subsidy",
    },
    "equity": {
        "description": "Concessional equity or quasi-equity stake",
        "concessional_share_range": (0.10, 0.30),
        "typical_coverage_pct": (0.10, 0.30),
        "return_enhancement_bps": (80, 280),
        "oda_eligible": False,
        "risk_mitigant": "dilution_protection",
    },
    "technical_assistance": {
        "description": "Grant-funded technical assistance and capacity building",
        "concessional_share_range": (0.02, 0.10),
        "typical_coverage_pct": (1.0, 1.0),
        "return_enhancement_bps": (20, 80),
        "oda_eligible": True,
        "risk_mitigant": "preparation_risk",
    },
}

ODA_SECTOR_CODES: dict[str, str] = {
    "agriculture": "31110", "energy": "23110", "infrastructure": "21010",
    "health": "12110", "education": "11110", "water": "14010",
    "climate": "41010", "financial_inclusion": "24030",
}

INSTRUMENT_SDG_MAP: dict[str, list] = {
    "guarantees": ["SDG_17", "SDG_8"],
    "first_loss": ["SDG_13", "SDG_17"],
    "concessional_loans": ["SDG_13", "SDG_17", "SDG_1"],
    "equity": ["SDG_8", "SDG_9"],
    "technical_assistance": ["SDG_17", "SDG_4"],
}

SECTOR_SDG_MAP: dict[str, list] = {
    "energy": ["SDG_7", "SDG_13"],
    "agriculture": ["SDG_2", "SDG_15"],
    "infrastructure": ["SDG_9", "SDG_11"],
    "health": ["SDG_3"],
    "education": ["SDG_4"],
    "water": ["SDG_6"],
    "climate": ["SDG_13"],
    "financial_inclusion": ["SDG_1", "SDG_8"],
}

SECTOR_MDB_MAP: dict[str, list] = {
    "agriculture": ["IFC", "AfDB", "ADB"],
    "energy": ["IFC", "EBRD", "AIIB", "ADB"],
    "infrastructure": ["IFC", "AIIB", "ADB", "AfDB"],
    "health": ["IFC", "ADB", "AfDB"],
    "education": ["ADB", "AfDB", "IFC"],
    "water": ["ADB", "AfDB", "EBRD"],
    "climate": ["IFC", "EBRD", "ADB", "AIIB"],
    "financial_inclusion": ["IFC", "ADB", "AfDB"],
}

# World Bank FY24 income classification + UN LDC status for a set of common
# DFI recipient countries. Used to derive OECD DAC ODA eligibility from a real
# reference table rather than a synthetic hash. Countries absent here resolve to
# "unknown" (honest null) unless the caller supplies an explicit income group.
COUNTRY_INCOME_GROUPS: dict[str, str] = {
    "Kenya": "LMIC", "Indonesia": "UMIC", "Colombia": "UMIC", "Nigeria": "LMIC",
    "Vietnam": "LMIC", "Bangladesh": "LMIC", "Ghana": "LMIC", "Peru": "UMIC",
    "Philippines": "LMIC", "Tanzania": "LMIC", "India": "LMIC", "Pakistan": "LMIC",
    "Ethiopia": "LDC", "Mozambique": "LDC", "Uganda": "LDC", "Rwanda": "LDC",
    "Senegal": "LDC", "Nepal": "LDC", "Cambodia": "LDC", "Myanmar": "LDC",
    "Egypt": "LMIC", "Morocco": "LMIC", "South Africa": "UMIC", "Brazil": "UMIC",
    "Mexico": "UMIC", "Turkey": "UMIC", "Thailand": "UMIC", "Malaysia": "UMIC",
    "Chile": "HIC", "Poland": "HIC", "Romania": "HIC", "Croatia": "HIC",
    "Ukraine": "LMIC", "Georgia": "UMIC", "Armenia": "UMIC", "Kazakhstan": "UMIC",
}

_VALID_INCOME_GROUPS = {"LDC", "LMIC", "UMIC", "HIC"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def _mid(rng_tuple: tuple[float, float]) -> float:
    """Midpoint of a documented model-config range (structuring assumption)."""
    lo, hi = rng_tuple
    return (lo + hi) / 2.0


def _score_ifc_ps(
    project_category: str,
    sector: str,
    reported_scores: Optional[dict[str, float]] = None,
) -> dict:
    """
    Score the 8 IFC Performance Standards.

    IFC PS scores are entity-assessed E&S compliance figures. They are NOT
    modelled here: when the caller supplies ``reported_scores`` (a mapping of
    PS id -> 0-100 score from a real E&S assessment) the weighted average is
    computed deterministically; otherwise every score is returned as ``None``
    with an ``insufficient_data`` status and no weighted average is fabricated.
    """
    reported_scores = reported_scores or {}
    scores: dict[str, dict] = {}
    have_any = False
    weighted_num = 0.0
    weight_den = 0.0
    for ps_id, ps_data in IFC_PS_CATEGORIES.items():
        raw = reported_scores.get(ps_id)
        if raw is not None:
            raw = _clamp(float(raw), 0.0, 100.0)
            have_any = True
            weighted_num += raw * ps_data["weight"]
            weight_den += ps_data["weight"]
            status = "compliant" if raw >= 70 else ("partial" if raw >= 50 else "non_compliant")
            scores[ps_id] = {
                "name": ps_data["name"],
                "score": round(raw, 1),
                "weight": ps_data["weight"],
                "status": status,
            }
        else:
            scores[ps_id] = {
                "name": ps_data["name"],
                "score": None,
                "weight": ps_data["weight"],
                "status": "insufficient_data",
            }
    weighted = round(weighted_num / weight_den, 1) if weight_den > 0 else None
    return {
        "scores": scores,
        "weighted_average": weighted,
        "data_available": have_any,
    }


def _es_risk_tier(ifc_score: Optional[float], sector: str) -> Optional[str]:
    """E&S risk tier (EP4 A/B/C). Sector alone forces Category A; otherwise a
    real IFC score is required — returns None when the score is unavailable."""
    if sector in {"extractives", "mining", "chemicals", "large_hydro"}:
        return "A"
    if ifc_score is None:
        return None
    if ifc_score < 60:
        return "A"
    elif ifc_score < 78:
        return "B"
    return "C"


def _country_income_group(
    country: str,
    reported_income_group: Optional[str] = None,
) -> Optional[str]:
    """
    Resolve World Bank / UN income classification for ODA eligibility.

    Uses the caller-supplied ``reported_income_group`` when provided, else a
    real reference table (:data:`COUNTRY_INCOME_GROUPS`). Returns ``None`` for
    countries not in the table so ODA eligibility is not fabricated.
    """
    if reported_income_group:
        rig = str(reported_income_group).upper()
        if rig in _VALID_INCOME_GROUPS:
            return rig
    return COUNTRY_INCOME_GROUPS.get(country)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def assess_blended_structure(
    entity_id: str,
    instrument_type: str,
    project_size_usd: float,
    sector: str,
    country: str,
    concessional_pct: Optional[float] = None,
    first_loss_share_of_concessional: Optional[float] = None,
    guarantee_coverage_pct: Optional[float] = None,
    mobilisation_ratio: Optional[float] = None,
    return_enhancement_bps: Optional[float] = None,
    mdb_partner: Optional[str] = None,
    reported_ps_scores: Optional[dict[str, float]] = None,
    edge_score: Optional[float] = None,
    country_income_group: Optional[str] = None,
) -> dict[str, Any]:
    """
    Assess a blended finance structure.

    Returns concessional layer sizing, MDB partner match, IFC PS compliance,
    mobilisation ratio benchmarks, OECD DAC ODA eligibility, SDG alignment.

    Structuring inputs (``concessional_pct``, ``first_loss_share_of_concessional``,
    ``guarantee_coverage_pct``, ``mobilisation_ratio``, ``return_enhancement_bps``)
    are DEAL-SPECIFIC: when omitted they are returned as ``None`` (no config-midpoint
    stand-in) and every figure derived from them (layer sizes, mobilised private
    capital) is ``None`` too; the omitted inputs are listed in
    ``estimation_basis.structuring_inputs_not_supplied``. Entity-assessed figures
    (IFC PS scores, EDGE rating) are likewise only returned when supplied by the
    caller, otherwise ``None`` / ``insufficient_data``.
    """
    if instrument_type not in INSTRUMENT_CONFIGS:
        instrument_type = "guarantees"
    cfg = INSTRUMENT_CONFIGS[instrument_type]

    assumptions: list[str] = []

    # Structuring parameters are DEAL-SPECIFIC. When the caller doesn't supply one we
    # return an honest null (no config-midpoint stand-in), and every figure derived from
    # it (layer size, mobilised private capital) is null too.
    conc_pct = _clamp(float(concessional_pct), 0.0, 1.0) if concessional_pct is not None else None
    concessional_usd = round(project_size_usd * conc_pct, 0) if conc_pct is not None else None
    if concessional_pct is None:
        assumptions.append("concessional_pct")

    fl_share = (_clamp(float(first_loss_share_of_concessional), 0.0, 1.0)
                if first_loss_share_of_concessional is not None else None)
    if first_loss_share_of_concessional is None:
        assumptions.append("first_loss_share_of_concessional")
    first_loss_pct = (conc_pct * fl_share) if (conc_pct is not None and fl_share is not None) else None
    first_loss_usd = round(project_size_usd * first_loss_pct, 0) if first_loss_pct is not None else None

    guarantee_coverage = (_clamp(float(guarantee_coverage_pct), 0.0, 1.0)
                          if guarantee_coverage_pct is not None else None)
    if guarantee_coverage_pct is None:
        assumptions.append("guarantee_coverage_pct")

    # MDB partner — deterministic first eligible partner for the sector unless supplied
    candidates = SECTOR_MDB_MAP.get(sector, list(DFI_PROFILES.keys()))
    if mdb_partner and mdb_partner in DFI_PROFILES:
        chosen_partner = mdb_partner
    else:
        chosen_partner = candidates[0] if candidates else list(DFI_PROFILES.keys())[0]
    mdb_profile = DFI_PROFILES[chosen_partner]

    # Mobilisation ratio (Convergence 2023 band) — deal-specific, null unless supplied
    bench = CONVERGENCE_BENCHMARKS.get(sector, CONVERGENCE_BENCHMARKS["infrastructure"])
    mob_ratio = float(mobilisation_ratio) if mobilisation_ratio is not None else None
    if mobilisation_ratio is None:
        assumptions.append("mobilisation_ratio")
    private_co_finance = (round(concessional_usd * mob_ratio, 0)
                          if (concessional_usd is not None and mob_ratio is not None) else None)

    # IFC PS compliance — entity-assessed; null unless real scores supplied
    ps_result = _score_ifc_ps(
        project_category="B",
        sector=sector,
        reported_scores=reported_ps_scores,
    )
    dfi_standards_score = ps_result["weighted_average"]
    project_category = _es_risk_tier(dfi_standards_score, sector)

    oda_sector_code = ODA_SECTOR_CODES.get(sector, "43010")
    income_group = _country_income_group(country, country_income_group)
    if income_group is None:
        oda_eligible: Optional[bool] = None
    else:
        oda_eligible = cfg["oda_eligible"] and income_group in {"LDC", "LMIC", "UMIC"}

    sdgs = sorted(set(
        INSTRUMENT_SDG_MAP.get(instrument_type, []) +
        SECTOR_SDG_MAP.get(sector, [])
    ))

    edge_applicable = sector in {"infrastructure", "real_estate", "urban"}
    edge_score_out = (
        round(float(edge_score), 1)
        if (edge_applicable and edge_score is not None)
        else None
    )

    # Return enhancement (structuring parameter) — deal-specific, null unless supplied
    ret_bps = round(float(return_enhancement_bps), 0) if return_enhancement_bps is not None else None
    if return_enhancement_bps is None:
        assumptions.append("return_enhancement_bps")

    return {
        "entity_id": entity_id,
        "instrument_type": instrument_type,
        "instrument_description": cfg["description"],
        "project_size_usd": project_size_usd,
        "sector": sector,
        "country": country,
        "concessional_layer": {
            "percentage": round(conc_pct * 100, 2) if conc_pct is not None else None,
            "amount_usd": concessional_usd,
        },
        "first_loss": {
            "percentage": round(first_loss_pct * 100, 2) if first_loss_pct is not None else None,
            "amount_usd": first_loss_usd,
        },
        "guarantee_coverage_pct": round(guarantee_coverage * 100, 2) if guarantee_coverage is not None else None,
        "mdb_partner": chosen_partner,
        "mdb_profile": mdb_profile,
        "mobilisation_ratio": round(mob_ratio, 2) if mob_ratio is not None else None,
        "private_co_finance_usd": private_co_finance,
        "convergence_benchmark": bench,
        "dfi_standards_score": (
            round(dfi_standards_score, 1) if dfi_standards_score is not None else None
        ),
        "ifc_ps_compliance": ps_result,
        "es_risk_tier": project_category,
        "return_enhancement_bps": ret_bps,
        "oda_eligibility": {
            "eligible": oda_eligible,
            "sector_code": oda_sector_code,
            "country_income_group": income_group,
            "instrument_oda_eligible": cfg["oda_eligible"],
        },
        "sdg_alignment": sdgs,
        "edge_green_building": {"applicable": edge_applicable, "score": edge_score_out},
        "risk_mitigant": cfg["risk_mitigant"],
        "estimation_basis": {
            "structuring_inputs_not_supplied": assumptions,
            "note": (
                "Deal-specific structuring parameters not supplied by the caller are returned "
                "as null (no config-midpoint stand-in); figures derived from them (layer sizes, "
                "mobilised private capital) are null too. IFC PS scores and EDGE ratings are null "
                "unless supplied from a real assessment. Provide concessional_pct, "
                "mobilisation_ratio, etc. for a fully-costed structure."
            ),
        },
    }


def analyse_dfi_standards(
    entity_id: str,
    dfi_partner: str,
    project_category: str,
    reported_ps_scores: Optional[dict[str, float]] = None,
    grievance_score: Optional[float] = None,
    grievance_channels: Optional[list[str]] = None,
    edge_energy_saving_pct: Optional[float] = None,
    edge_water_saving_pct: Optional[float] = None,
    edge_embodied_saving_pct: Optional[float] = None,
) -> dict[str, Any]:
    """
    Analyse DFI E&S standards compliance across 8 IFC PS categories.

    Returns IFC PS scores, E&S risk tier, EDGE criteria and DFI partner profile.

    All figures here are entity-assessed E&S metrics, not model outputs: IFC PS
    scores, the grievance-mechanism score/channels and EDGE savings percentages
    are only returned when supplied by the caller. When absent they are reported
    as ``None`` / ``insufficient_data`` and the overall composite is not computed
    from fabricated inputs.
    """
    if dfi_partner not in DFI_PROFILES:
        dfi_partner = "IFC"
    profile = DFI_PROFILES[dfi_partner]

    ps_result = _score_ifc_ps(
        project_category=project_category,
        sector="infrastructure",
        reported_scores=reported_ps_scores,
    )
    ps_weighted = ps_result["weighted_average"]
    es_tier = _es_risk_tier(ps_weighted, "infrastructure")

    # ESIA triggers are regulatory rules (EP4): Category A always requires ESIA;
    # Category B requires it only where a real weighted PS score is below 70.
    esia_required = project_category == "A" or (
        project_category == "B" and ps_weighted is not None and ps_weighted < 70
    )
    esia_independent = project_category == "A"

    # Grievance mechanism (entity-assessed)
    if grievance_score is not None:
        g_score: Optional[float] = round(_clamp(float(grievance_score), 0.0, 100.0), 1)
        grievance_status = "adequate" if g_score >= 70 else "needs_improvement"
    else:
        g_score = None
        grievance_status = "insufficient_data"

    # EDGE green-building savings (entity-reported measurements)
    edge_energy = round(float(edge_energy_saving_pct), 1) if edge_energy_saving_pct is not None else None
    edge_water = round(float(edge_water_saving_pct), 1) if edge_water_saving_pct is not None else None
    edge_embodied = round(float(edge_embodied_saving_pct), 1) if edge_embodied_saving_pct is not None else None
    if edge_energy is not None and edge_water is not None and edge_embodied is not None:
        edge_certified: Optional[bool] = (
            edge_energy >= 20 and edge_water >= 20 and edge_embodied >= 20
        )
    else:
        edge_certified = None

    monitoring_freq = {"A": "semi-annual", "B": "annual", "C": "biennial"}.get(
        project_category, "annual"
    )

    # Overall composite only when every real component is available
    if ps_weighted is not None and g_score is not None and edge_energy is not None and edge_water is not None:
        overall: Optional[float] = round(
            ps_weighted * 0.60
            + g_score * 0.20
            + (edge_energy + edge_water) / 2 * 0.20,
            1,
        )
    else:
        overall = None

    return {
        "entity_id": entity_id,
        "dfi_partner": dfi_partner,
        "dfi_profile": profile,
        "project_category": project_category,
        "ifc_ps_compliance": ps_result,
        "es_risk_tier": es_tier,
        "esia_required": esia_required,
        "esia_independent_consultant_required": esia_independent,
        "grievance_mechanism": {
            "score": g_score,
            "status": grievance_status,
            "channels": grievance_channels if grievance_channels is not None else None,
        },
        "edge_green_building": {
            "energy_saving_pct": edge_energy,
            "water_saving_pct": edge_water,
            "embodied_energy_saving_pct": edge_embodied,
            "certified": edge_certified,
        },
        "monitoring_frequency": monitoring_freq,
        "disclosure": {
            "project_disclosure": True,
            "esia_public": project_category in {"A", "B"},
            "monitoring_reports_public": project_category == "A",
            "comment_period_days": 60 if project_category == "A" else 30,
        },
        "overall_compliance_score": overall,
    }


def model_concessional_layers(
    entity_id: str,
    total_size_usd: float,
    sectors: list[str],
    tranche_shares: Optional[dict[str, float]] = None,
    tranche_return_targets: Optional[dict[str, float]] = None,
    tranche_ratings: Optional[dict[str, str]] = None,
) -> dict[str, Any]:
    """
    Model tranche waterfall: senior / mezzanine / first-loss / grant.

    Returns return targets per tier, investor type mapping, blended IRR.

    The capital-stack shares and per-tranche return targets are structuring
    parameters. When ``tranche_shares`` / ``tranche_return_targets`` are supplied
    (keys: ``senior``/``mezzanine``/``first_loss``/``grant``) they drive the model
    directly; otherwise the midpoint of the documented structuring range is used
    and flagged as a ``config_midpoint`` assumption. Per-tranche credit ratings
    are entity-specific and returned as ``None`` unless supplied via
    ``tranche_ratings``. The blended IRR, leverage ratio and investor mix are then
    computed deterministically from these shares.
    """
    assumptions: list[str] = []
    shares = tranche_shares or {}

    def _share(key: str, rng_tuple: tuple[float, float]) -> float:
        v = shares.get(key)
        if v is None:
            assumptions.append(f"{key}_share=config_midpoint")
            return _mid(rng_tuple)
        return _clamp(float(v), 0.0, 1.0)

    grant_pct = _share("grant", (0.02, 0.08))
    first_loss_pct = _share("first_loss", (0.08, 0.18))
    mezzanine_pct = _share("mezzanine", (0.12, 0.25))
    if "senior" in shares and shares["senior"] is not None:
        senior_pct = _clamp(float(shares["senior"]), 0.0, 1.0)
    else:
        senior_pct = max(0.35, 1.0 - grant_pct - first_loss_pct - mezzanine_pct)
        assumptions.append("senior_share=residual")

    total_pct = grant_pct + first_loss_pct + mezzanine_pct + senior_pct
    if total_pct > 0:
        grant_pct /= total_pct
        first_loss_pct /= total_pct
        mezzanine_pct /= total_pct
        senior_pct /= total_pct

    ret = tranche_return_targets or {}

    def _ret(key: str, rng_tuple: tuple[float, float]) -> float:
        v = ret.get(key)
        if v is None:
            assumptions.append(f"{key}_return_target=config_midpoint")
            return round(_mid(rng_tuple), 2)
        return round(float(v), 2)

    ratings = tranche_ratings or {}

    tranches = [
        {
            "tranche_name": "Senior Debt",
            "tranche_type": "senior",
            "size_usd": round(total_size_usd * senior_pct, 0),
            "pct_of_total": round(senior_pct * 100, 1),
            "return_target_pct": _ret("senior", (4.5, 8.0)),
            "risk_tier": "low",
            "investor_type": "institutional",
            "rating_equivalent": ratings.get("senior"),
        },
        {
            "tranche_name": "Mezzanine",
            "tranche_type": "mezzanine",
            "size_usd": round(total_size_usd * mezzanine_pct, 0),
            "pct_of_total": round(mezzanine_pct * 100, 1),
            "return_target_pct": _ret("mezzanine", (8.0, 14.0)),
            "risk_tier": "medium",
            "investor_type": "DFI",
            "rating_equivalent": ratings.get("mezzanine"),
        },
        {
            "tranche_name": "First-Loss Junior",
            "tranche_type": "first_loss",
            "size_usd": round(total_size_usd * first_loss_pct, 0),
            "pct_of_total": round(first_loss_pct * 100, 1),
            "return_target_pct": _ret("first_loss", (2.0, 6.0)),
            "risk_tier": "high",
            "investor_type": "philanthropic",
            "rating_equivalent": ratings.get("first_loss", "NR"),
        },
        {
            "tranche_name": "Grant / Technical Assistance",
            "tranche_type": "grant",
            "size_usd": round(total_size_usd * grant_pct, 0),
            "pct_of_total": round(grant_pct * 100, 1),
            "return_target_pct": 0.0,
            "risk_tier": "none",
            "investor_type": "government",
            "rating_equivalent": ratings.get("grant", "N/A"),
        },
    ]

    non_grant_total = sum(t["size_usd"] for t in tranches if t["tranche_type"] != "grant")
    blended_irr = (
        sum(
            t["return_target_pct"] * t["size_usd"] / non_grant_total
            for t in tranches if t["tranche_type"] != "grant"
        )
        if non_grant_total > 0 else 0.0
    )

    all_sdgs: set[str] = set()
    for s in sectors:
        all_sdgs.update(SECTOR_SDG_MAP.get(s, []))

    return {
        "entity_id": entity_id,
        "total_size_usd": total_size_usd,
        "sectors": sectors,
        "tranches": tranches,
        "blended_irr_pct": round(blended_irr, 2),
        "concessional_share_pct": round((grant_pct + first_loss_pct) * 100, 1),
        "leverage_ratio": round(senior_pct / max(grant_pct + first_loss_pct, 0.01), 2),
        "investor_type_mix": {
            "institutional_pct": round(senior_pct * 100, 1),
            "dfi_pct": round(mezzanine_pct * 100, 1),
            "philanthropic_pct": round(first_loss_pct * 100, 1),
            "government_pct": round(grant_pct * 100, 1),
        },
        "sdg_alignment": sorted(all_sdgs),
        "estimation_basis": {
            "config_midpoint_assumptions": assumptions,
            "note": (
                "Capital-stack shares and per-tranche return targets not supplied "
                "by the caller default to the midpoint of the documented structuring "
                "range; per-tranche credit ratings are null unless supplied."
            ),
        },
    }


def calculate_mobilisation_metrics(
    entity_id: str,
    public_finance_usd: float,
    private_co_finance_usd: float,
    sector: Optional[str] = None,
    financial_additionality: Optional[float] = None,
    es_additionality: Optional[float] = None,
    knowledge_additionality: Optional[float] = None,
    crowding_in_score: Optional[float] = None,
    mdb_harmonised_framework_score: Optional[float] = None,
) -> dict[str, Any]:
    """
    Calculate MDB mobilisation metrics, additionality and crowding assessment.

    Benchmarks per Convergence 2023; methodology per MDB Harmonised Framework.

    The direct mobilisation ratio and OECD DAC public share are computed directly
    from the supplied finance amounts. The achieved ratio is compared against each
    Convergence 2023 sector benchmark using the *actual* ratio (no per-sector
    figure is fabricated). Additionality dimensions, the crowding-in score and the
    MDB Harmonised Framework score are entity-assessed inputs: they are returned as
    ``None`` / ``insufficient_data`` unless supplied by the caller.
    """
    total = public_finance_usd + private_co_finance_usd
    direct_ratio = private_co_finance_usd / public_finance_usd if public_finance_usd > 0 else 0.0

    # Compare the entity's *actual* achieved mobilisation ratio to each benchmark.
    sector_ratios: dict[str, dict] = {}
    for sec, bench in CONVERGENCE_BENCHMARKS.items():
        sector_ratios[sec] = {
            "achieved_ratio": round(direct_ratio, 2),
            "benchmark_mean": bench["mean_ratio"],
            "benchmark_median": bench["median_ratio"],
            "benchmark_p25": bench["p25"],
            "benchmark_p75": bench["p75"],
            "vs_benchmark": "above" if direct_ratio > bench["mean_ratio"] else "below",
        }

    # Additionality (entity-assessed dimensions per MDB Harmonised Framework)
    fin_add = round(_clamp(float(financial_additionality), 0.0, 100.0), 1) if financial_additionality is not None else None
    es_add = round(_clamp(float(es_additionality), 0.0, 100.0), 1) if es_additionality is not None else None
    know_add = round(_clamp(float(knowledge_additionality), 0.0, 100.0), 1) if knowledge_additionality is not None else None
    if fin_add is not None and es_add is not None and know_add is not None:
        additionality_score: Optional[float] = round(fin_add * 0.50 + es_add * 0.30 + know_add * 0.20, 1)
        add_level: Optional[str] = (
            "high" if additionality_score >= 70 else ("medium" if additionality_score >= 50 else "low")
        )
    else:
        additionality_score = None
        add_level = "insufficient_data"

    # Crowding assessment (entity-assessed)
    if crowding_in_score is not None:
        crowding_in: Optional[float] = round(_clamp(float(crowding_in_score), 0.0, 100.0), 1)
        crowding_out_risk: Optional[float] = round(100 - crowding_in, 1)
        crowding_assessment = (
            "crowding_in" if crowding_in >= 65 else ("neutral" if crowding_in >= 45 else "crowding_out")
        )
    else:
        crowding_in = None
        crowding_out_risk = None
        crowding_assessment = "insufficient_data"

    mdb_hf_score = (
        round(_clamp(float(mdb_harmonised_framework_score), 0.0, 100.0), 1)
        if mdb_harmonised_framework_score is not None
        else None
    )

    result = {
        "entity_id": entity_id,
        "public_finance_usd": public_finance_usd,
        "private_co_finance_usd": private_co_finance_usd,
        "total_finance_usd": total,
        "direct_mobilisation_ratio": round(direct_ratio, 2),
        "sector_benchmarks": sector_ratios,
        "additionality": {
            "financial": fin_add,
            "environmental_social": es_add,
            "knowledge": know_add,
            "composite_score": additionality_score,
            "level": add_level,
        },
        "crowding_assessment": {
            "crowding_in_score": crowding_in,
            "crowding_out_risk": crowding_out_risk,
            "assessment": crowding_assessment,
        },
        "mdb_harmonised_framework_score": mdb_hf_score,
        "oecd_dac": {
            "reporting_required": True,
            "methodology": "Survey on Amounts Mobilised from the Private Sector",
            "public_share_pct": round(
                min(public_finance_usd / total * 100, 100) if total > 0 else 0, 1
            ),
        },
    }
    if sector and sector in CONVERGENCE_BENCHMARKS:
        b = CONVERGENCE_BENCHMARKS[sector]
        result["primary_sector_benchmark"] = {
            "sector": sector,
            "achieved_ratio": round(direct_ratio, 2),
            "benchmark_mean": b["mean_ratio"],
            "vs_benchmark": "above" if direct_ratio > b["mean_ratio"] else "below",
        }
    return result


def generate_blended_portfolio(
    entity_id: str,
    instruments: list[dict],
) -> dict[str, Any]:
    """
    Aggregate blended finance instruments into portfolio-level analytics.

    Returns risk-return frontier, SDG alignment, impact metrics,
    sector exposures and Convergence-style portfolio analytics.

    Portfolio totals (concessional layer, private mobilised, mobilisation ratio,
    sector exposures, average deal size) are computed directly from the supplied
    ``instruments``. Per-instrument concessional share and mobilisation ratio use
    caller-supplied values (``concessional_pct`` / ``mobilisation_ratio`` keys) or,
    when absent, the midpoint of the documented model range (disclosed per item).

    Impact metrics (CO2 avoided, jobs, beneficiaries) and the risk-return frontier
    are entity outcomes: they are aggregated from per-instrument fields when the
    caller supplies them, otherwise returned as ``None`` rather than fabricated. No
    synthetic portfolio is generated when ``instruments`` is empty — the response is
    flagged ``insufficient_data``.
    """
    if not instruments:
        return {
            "entity_id": entity_id,
            "status": "insufficient_data",
            "message": "No instruments supplied; portfolio analytics require instrument-level inputs.",
            "portfolio_summary": {
                "total_instruments": 0,
                "total_portfolio_usd": 0.0,
                "total_concessional_usd": None,
                "total_private_mobilised_usd": None,
                "portfolio_mobilisation_ratio": None,
                "concessional_share_pct": None,
            },
            "sector_exposures_pct": {},
            "sdg_alignment": [],
            "risk_return_frontier": None,
            "impact_metrics": {
                "co2_avoided_tco2e_pa": None,
                "jobs_created": None,
                "beneficiaries": None,
                "sdgs_addressed": 0,
            },
            "portfolio_items": [],
            "convergence_analytics": {
                "blended_finance_type": "structured_finance",
                "vehicles": None,
                "preparation_funding_pct": None,
                "average_deal_size_usd": None,
            },
        }

    total_portfolio_usd = sum(float(i.get("size_usd", 10_000_000)) for i in instruments)
    total_concessional = 0.0
    total_private_mobilised = 0.0
    sdg_set: set[str] = set()
    sector_exposures: dict[str, float] = {}
    portfolio_items = []
    item_assumptions: list[str] = []

    # Impact aggregation only if instrument-level figures are provided
    co2_total = 0.0
    jobs_total = 0.0
    benef_total = 0.0
    have_co2 = have_jobs = have_benef = False

    for idx, inst in enumerate(instruments):
        itype = inst.get("instrument_type", "guarantees")
        if itype not in INSTRUMENT_CONFIGS:
            itype = "guarantees"
        cfg = INSTRUMENT_CONFIGS[itype]
        size = float(inst.get("size_usd", 10_000_000))
        sector = inst.get("sector", "infrastructure")
        bench = CONVERGENCE_BENCHMARKS.get(sector, CONVERGENCE_BENCHMARKS["infrastructure"])

        # Concessional share: caller value or config-range midpoint (disclosed)
        if inst.get("concessional_pct") is not None:
            conc_pct = _clamp(float(inst["concessional_pct"]), 0.0, 1.0)
        else:
            conc_pct = _mid(cfg["concessional_share_range"])
            item_assumptions.append(f"item{idx}:concessional_pct=config_midpoint")

        # Mobilisation ratio: caller value or Convergence band midpoint (disclosed)
        if inst.get("mobilisation_ratio") is not None:
            mob_ratio = float(inst["mobilisation_ratio"])
        else:
            mob_ratio = _mid((bench["p25"], bench["p75"]))
            item_assumptions.append(f"item{idx}:mobilisation_ratio=convergence_band_midpoint")

        conc_usd = size * conc_pct
        priv_mob = conc_usd * mob_ratio
        total_concessional += conc_usd
        total_private_mobilised += priv_mob

        for sdg in INSTRUMENT_SDG_MAP.get(itype, []) + SECTOR_SDG_MAP.get(sector, []):
            sdg_set.add(sdg)
        sector_exposures[sector] = sector_exposures.get(sector, 0.0) + size

        if inst.get("co2_avoided_tco2e_pa") is not None:
            co2_total += float(inst["co2_avoided_tco2e_pa"]); have_co2 = True
        if inst.get("jobs_created") is not None:
            jobs_total += float(inst["jobs_created"]); have_jobs = True
        if inst.get("beneficiaries") is not None:
            benef_total += float(inst["beneficiaries"]); have_benef = True

        portfolio_items.append({
            "index": idx,
            "instrument_type": itype,
            "size_usd": size,
            "sector": sector,
            "country": inst.get("country", "Unknown"),
            "concessional_pct": round(conc_pct * 100, 1),
            "mobilisation_ratio": round(mob_ratio, 2),
            "private_mobilised_usd": round(priv_mob, 0),
        })

    portfolio_mob_ratio = (
        total_private_mobilised / total_concessional if total_concessional > 0 else 0.0
    )

    return {
        "entity_id": entity_id,
        "portfolio_summary": {
            "total_instruments": len(instruments),
            "total_portfolio_usd": total_portfolio_usd,
            "total_concessional_usd": round(total_concessional, 0),
            "total_private_mobilised_usd": round(total_private_mobilised, 0),
            "portfolio_mobilisation_ratio": round(portfolio_mob_ratio, 2),
            "concessional_share_pct": round(
                total_concessional / total_portfolio_usd * 100 if total_portfolio_usd > 0 else 0, 1
            ),
        },
        "sector_exposures_pct": {
            k: round(v / total_portfolio_usd * 100, 1) if total_portfolio_usd > 0 else 0
            for k, v in sector_exposures.items()
        },
        "sdg_alignment": sorted(sdg_set),
        "risk_return_frontier": None,
        "impact_metrics": {
            "co2_avoided_tco2e_pa": round(co2_total, 0) if have_co2 else None,
            "jobs_created": round(jobs_total, 0) if have_jobs else None,
            "beneficiaries": round(benef_total, 0) if have_benef else None,
            "sdgs_addressed": len(sdg_set),
        },
        "portfolio_items": portfolio_items,
        "convergence_analytics": {
            "blended_finance_type": "structured_finance",
            "vehicles": None,
            "preparation_funding_pct": None,
            "average_deal_size_usd": round(total_portfolio_usd / len(instruments), 0),
        },
        "estimation_basis": {
            "config_midpoint_assumptions": item_assumptions,
            "note": (
                "Per-instrument concessional share / mobilisation ratio default to the "
                "midpoint of the documented model range when not supplied. Impact metrics "
                "and the risk-return frontier are null unless instrument-level figures are provided."
            ),
        },
    }
