"""
Sustainable Trade Finance Engine  (E75)
=========================================
Equator Principles v4 (2020), ECA OECD Arrangement on export credits,
ICC Sustainable Trade Finance Principles 2022, supply-chain ESG-linked
dynamic discounting, SBLC green instruments, trade flow GHG attribution
(Scope 3 Cat 1/4), reverse factoring ESG tiers.

References:
  - Equator Principles IV (2020) — 10 principles, ESIA, IFC PS
  - OECD Arrangement on Officially Supported Export Credits (2023 revision)
  - ICC Sustainable Trade Finance Principles (2022)
  - GHG Protocol Corporate Value Chain Standard (2011)
  - ILO Core Labour Standards
  - OECD Guidelines for Multinational Enterprises (2023)
  - PCAF Part C — Facilitated Emissions (investment banking)

Data-integrity note (2026-07 remediation)
------------------------------------------
Every RETURNED metric is either a real, deterministic computation from
caller-supplied inputs (reference-data lookups + documented formulas) or an
explicit honest null (``None`` / ``"insufficient_data"``) accompanied by a
note. No metric is drawn from a random number generator. Entity-specific
scores (EP principle scores, grievance scores, supplier ESG scores, ILO
standards, climate-compatibility, STF alignment, pricing point estimates)
must be supplied by the caller via the optional, backward-compatible
parameters documented below; when absent they resolve to null rather than a
fabricated value. Documented model/policy constants (reference risk bands,
neutral grid-intensity default) are used only where flagged.
"""
from __future__ import annotations

from typing import Any, Optional

# ---------------------------------------------------------------------------
# Reference Data
# ---------------------------------------------------------------------------

EP4_CATEGORISATION: dict[str, dict] = {
    "A": {
        "description": "Significant adverse social or environmental impacts that are diverse, irreversible or unprecedented",
        "esia_required": True,
        "independent_consultant": True,
        "public_consultation": True,
        "monitoring_reporting": "annual",
        "covenants": ["ESAP_required", "third_party_monitoring", "complaint_mechanism"],
    },
    "B": {
        "description": "Limited adverse social or environmental impacts that are few in number, generally site-specific, largely reversible",
        "esia_required": True,
        "independent_consultant": False,
        "public_consultation": False,
        "monitoring_reporting": "annual",
        "covenants": ["ESAP_recommended", "borrower_reporting"],
    },
    "C": {
        "description": "Minimal or no adverse social or environmental impacts",
        "esia_required": False,
        "independent_consultant": False,
        "public_consultation": False,
        "monitoring_reporting": "biennial",
        "covenants": [],
    },
}

EP4_PRINCIPLES: list[dict] = [
    {"id": "EP1", "name": "Review and Categorisation", "weight": 0.12},
    {"id": "EP2", "name": "Environmental and Social Assessment", "weight": 0.14},
    {"id": "EP3", "name": "Applicable Environmental and Social Standards", "weight": 0.12},
    {"id": "EP4", "name": "Environmental and Social Management System and EP Action Plan", "weight": 0.10},
    {"id": "EP5", "name": "Stakeholder Engagement", "weight": 0.10},
    {"id": "EP6", "name": "Grievance Mechanism", "weight": 0.08},
    {"id": "EP7", "name": "Independent Review", "weight": 0.10},
    {"id": "EP8", "name": "Covenants", "weight": 0.08},
    {"id": "EP9", "name": "Independent Monitoring and Reporting", "weight": 0.08},
    {"id": "EP10", "name": "Reporting and Transparency", "weight": 0.08},
]

# High-risk country list (IFC Performance Standard applicability)
EP4_HIGH_RISK_COUNTRIES = {
    "Myanmar", "Sudan", "South Sudan", "Somalia", "Yemen", "Central African Republic",
    "DRC", "Libya", "Syria", "Afghanistan", "Haiti", "Venezuela",
}

# OECD CRC (Country Risk Classification) 0-7
OECD_COUNTRY_RISK: dict[str, int] = {
    "Germany": 0, "France": 0, "United States": 0, "Japan": 0, "United Kingdom": 0,
    "Australia": 0, "Canada": 0, "Singapore": 1, "South Korea": 2, "China": 2,
    "Brazil": 3, "India": 3, "Indonesia": 3, "South Africa": 4, "Nigeria": 5,
    "Kenya": 5, "Pakistan": 5, "Bangladesh": 5, "Egypt": 4, "Vietnam": 4,
    "Colombia": 4, "Peru": 3, "Philippines": 4, "Ghana": 5, "Tanzania": 5,
    "Ethiopia": 6, "Zambia": 6, "DRC": 7, "Somalia": 7, "Afghanistan": 7,
}

OECD_ARRANGEMENT_SECTORS: dict[str, dict] = {
    "coal_power": {
        "climate_change_su": "RESTRICTED",
        "excluded_since": "2022-01-01",
        "restriction_type": "full_exclusion",
        "max_repayment_years": 0,
        "min_premium_pct": None,
    },
    "renewable_energy": {
        "climate_change_su": "PREFERRED",
        "excluded_since": None,
        "restriction_type": "none",
        "max_repayment_years": 18,
        "min_premium_pct": 0.15,
    },
    "nuclear": {
        "climate_change_su": "PERMITTED",
        "excluded_since": None,
        "restriction_type": "none",
        "max_repayment_years": 18,
        "min_premium_pct": 0.20,
    },
    "infrastructure": {
        "climate_change_su": "STANDARD",
        "excluded_since": None,
        "restriction_type": "none",
        "max_repayment_years": 15,
        "min_premium_pct": 0.25,
    },
    "manufacturing": {
        "climate_change_su": "STANDARD",
        "excluded_since": None,
        "restriction_type": "none",
        "max_repayment_years": 10,
        "min_premium_pct": 0.30,
    },
    "ships": {
        "climate_change_su": "STANDARD",
        "excluded_since": None,
        "restriction_type": "sector_understanding",
        "max_repayment_years": 12,
        "min_premium_pct": 0.22,
    },
    "aircraft": {
        "climate_change_su": "STANDARD",
        "excluded_since": None,
        "restriction_type": "sector_understanding",
        "max_repayment_years": 12,
        "min_premium_pct": 0.22,
    },
}

# Supplier ESG tiers and dynamic discounting parameters
ESG_TIERS: dict[str, dict] = {
    "A": {
        "description": "Exemplary ESG performance — top 10% cohort",
        "esg_score_range": (85, 100),
        "discount_rate_bps": (0, 25),
        "reverse_factoring_eligible": True,
        "due_diligence_level": "light",
        "monitoring_frequency": "annual",
    },
    "B": {
        "description": "Above-average ESG performance",
        "esg_score_range": (70, 85),
        "discount_rate_bps": (25, 50),
        "reverse_factoring_eligible": True,
        "due_diligence_level": "standard",
        "monitoring_frequency": "annual",
    },
    "C": {
        "description": "Average ESG performance — improvement plan required",
        "esg_score_range": (55, 70),
        "discount_rate_bps": (50, 75),
        "reverse_factoring_eligible": True,
        "due_diligence_level": "enhanced",
        "monitoring_frequency": "semi-annual",
    },
    "D": {
        "description": "Below-average ESG performance — remediation required",
        "esg_score_range": (35, 55),
        "discount_rate_bps": (75, 150),
        "reverse_factoring_eligible": False,
        "due_diligence_level": "intensive",
        "monitoring_frequency": "quarterly",
    },
    "E": {
        "description": "Poor ESG performance — probationary status",
        "esg_score_range": (0, 35),
        "discount_rate_bps": (150, 300),
        "reverse_factoring_eligible": False,
        "due_diligence_level": "exclusion_review",
        "monitoring_frequency": "monthly",
    },
}

# Transport mode emission factors (kgCO2e per tonne-km)
TRANSPORT_EMISSION_FACTORS: dict[str, dict] = {
    "air_freight":      {"kgco2e_per_tonne_km": 0.602, "scope3_category": "Cat4_upstream_transport"},
    "sea_freight":      {"kgco2e_per_tonne_km": 0.016, "scope3_category": "Cat4_upstream_transport"},
    "road_truck_hgv":   {"kgco2e_per_tonne_km": 0.108, "scope3_category": "Cat4_upstream_transport"},
    "road_truck_lgv":   {"kgco2e_per_tonne_km": 0.158, "scope3_category": "Cat4_upstream_transport"},
    "rail_freight":     {"kgco2e_per_tonne_km": 0.028, "scope3_category": "Cat4_upstream_transport"},
    "inland_waterway":  {"kgco2e_per_tonne_km": 0.031, "scope3_category": "Cat4_upstream_transport"},
}

# Product lifecycle GHG intensities (kgCO2e per tonne of product)
PRODUCT_GHG_INTENSITY: dict[str, float] = {
    "steel": 1_800.0,
    "cement": 850.0,
    "aluminium": 11_500.0,
    "plastics": 2_500.0,
    "textiles": 5_900.0,
    "electronics": 28_000.0,
    "food_agriculture": 2_100.0,
    "chemicals": 3_200.0,
    "paper": 1_100.0,
    "automotive_parts": 4_500.0,
    "crude_oil": 430.0,
    "natural_gas": 2_800.0,
}

# ICC STF Principles 2022 requirements
ICC_STF_PRINCIPLES: list[dict] = [
    {"id": "P1", "name": "Governance & Accountability", "weight": 0.15},
    {"id": "P2", "name": "Risk Assessment & ESG Screening", "weight": 0.15},
    {"id": "P3", "name": "Environmental Standards", "weight": 0.12},
    {"id": "P4", "name": "Social Standards", "weight": 0.12},
    {"id": "P5", "name": "Climate & Transition Finance", "weight": 0.12},
    {"id": "P6", "name": "Circular Economy", "weight": 0.10},
    {"id": "P7", "name": "Reporting & Disclosure", "weight": 0.12},
    {"id": "P8", "name": "Capacity Building", "weight": 0.12},
]

GREEN_INSTRUMENT_CRITERIA: dict[str, dict] = {
    "green_lc": {
        "full_name": "Green Letter of Credit",
        "use_of_proceeds_required": True,
        "eligible_sectors": ["renewable_energy", "clean_tech", "sustainable_agriculture", "green_building"],
        "icma_gbs_aligned": True,
        "icc_stf_aligned": True,
        "pricing_benefit_bps_range": (5, 25),
        "documentation": ["green_framework", "eligible_project_list", "annual_reporting"],
    },
    "green_sblc": {
        "full_name": "Green Standby Letter of Credit",
        "use_of_proceeds_required": True,
        "eligible_sectors": ["renewable_energy", "sustainability_linked", "water_management"],
        "icma_gbs_aligned": True,
        "icc_stf_aligned": True,
        "pricing_benefit_bps_range": (5, 20),
        "documentation": ["green_framework", "second_party_opinion", "annual_impact_report"],
    },
    "sustainability_linked_trade_loan": {
        "full_name": "Sustainability-Linked Trade Loan",
        "use_of_proceeds_required": False,
        "eligible_sectors": ["any"],
        "icma_gbs_aligned": False,
        "icc_stf_aligned": True,
        "pricing_benefit_bps_range": (10, 50),
        "documentation": ["kpi_framework", "spт_calibration", "annual_kpi_verification"],
    },
    "sustainable_supply_chain_finance": {
        "full_name": "Sustainable Supply Chain Finance Facility",
        "use_of_proceeds_required": False,
        "eligible_sectors": ["any"],
        "icma_gbs_aligned": False,
        "icc_stf_aligned": True,
        "pricing_benefit_bps_range": (15, 75),
        "documentation": ["supplier_esg_assessment", "dynamic_pricing_ratchet", "reporting_framework"],
    },
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def _assign_ep_category(project_type: str, country: str, project_cost_usd: float) -> str:
    """Assign EP category A/B/C based on project characteristics.

    Deterministic rule set. For medium-risk projects that could fall in either
    A or B, the precautionary category "A" is assigned (never a random draw) so
    the higher assurance regime governs until finer characterisation is provided.
    """
    high_risk_types = {"mining", "dam", "large_hydro", "oil_gas", "petrochemical", "smelter", "port_expansion"}
    medium_risk_types = {"manufacturing", "agro_industrial", "transport_infrastructure", "power_plant"}

    if project_type in high_risk_types or country in EP4_HIGH_RISK_COUNTRIES:
        return "A"
    elif project_type in medium_risk_types or project_cost_usd >= 50_000_000:
        # Precautionary default: the more conservative category governs.
        return "A"
    elif project_cost_usd >= 10_000_000:
        return "B"
    return "C"


def _esg_tier_from_score(score: float) -> str:
    for tier, d in ESG_TIERS.items():
        lo, hi = d["esg_score_range"]
        if lo <= score <= hi:
            return tier
    return "E"


def _discount_bps_from_score(score: float, tier: str) -> float:
    """Locate the dynamic-discounting margin within the tier's reference band.

    Deterministic linear interpolation: a supplier at the top of its ESG band
    receives the lower (better) discount bps, at the bottom the higher bps.
    Both the band and the interpolation are documented reference-data policy —
    no random component.
    """
    lo_score, hi_score = ESG_TIERS[tier]["esg_score_range"]
    lo_bps, hi_bps = ESG_TIERS[tier]["discount_rate_bps"]
    span = hi_score - lo_score
    # position: 0.0 at top of band (best), 1.0 at bottom of band (worst)
    pos = 0.0 if span <= 0 else _clamp((hi_score - score) / span, 0.0, 1.0)
    return round(lo_bps + pos * (hi_bps - lo_bps), 1)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def assess_equator_principles(
    entity_id: str,
    project_type: str,
    project_cost_usd: float,
    country: str,
    sector: str,
    principle_assessments: Optional[dict[str, float]] = None,
    grievance_data: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """
    Assess Equator Principles v4 compliance.

    Returns EP categorisation (A/B/C), 10 principle scores,
    ESIA requirements, IESC requirement, grievance mechanism,
    and IFC Performance Standard applicability.

    Optional inputs (backward-compatible; default ``None``):
      - ``principle_assessments``: mapping of EP id (``"EP1"``..``"EP10"``) to a
        real 0-100 compliance score. Only supplied principles are scored; the
        weighted EP4 score is computed from supplied principles only. When a
        principle is not supplied its ``score`` is ``None`` / ``"insufficient_data"``.
      - ``grievance_data``: dict with ``score`` (0-100) and/or ``channels``
        (list of grievance channels). Absent fields resolve to null.

    The EP categorisation, ESIA regime, IFC PS applicability and OECD CRC are
    deterministic reference-data derivations and are always returned.
    """
    ep_category = _assign_ep_category(project_type, country, project_cost_usd)
    cat_data = EP4_CATEGORISATION[ep_category]

    principle_assessments = principle_assessments or {}
    notes: list[str] = []

    # Score each of the 10 EP principles from supplied assessments only.
    principle_scores = []
    supplied_any = False
    for p in EP4_PRINCIPLES:
        raw = principle_assessments.get(p["id"])
        if raw is None:
            score: Optional[float] = None
            status = "insufficient_data"
        else:
            score = round(_clamp(float(raw), 0.0, 100.0), 1)
            status = "compliant" if score >= 70 else ("partial" if score >= 50 else "non_compliant")
            supplied_any = True
        principle_scores.append({
            "id": p["id"],
            "name": p["name"],
            "weight": p["weight"],
            "score": score,
            "status": status,
        })

    if supplied_any:
        # Weight the supplied principles, renormalising over the supplied weight mass.
        supplied_weight = sum(p["weight"] for p in principle_scores if p["score"] is not None)
        weighted_raw = sum(
            p["score"] * p["weight"] for p in principle_scores if p["score"] is not None
        )
        weighted_score: Optional[float] = round(weighted_raw / supplied_weight, 1) if supplied_weight > 0 else None
        if weighted_score is None:
            overall_status = "insufficient_data"
        elif weighted_score >= 70:
            overall_status = "compliant"
        elif weighted_score >= 55:
            overall_status = "partial"
        else:
            overall_status = "non_compliant"
    else:
        weighted_score = None
        overall_status = "insufficient_data"
        notes.append(
            "EP principle scores: insufficient_data — no principle assessments supplied; "
            "provide principle_assessments={EP1..EP10: 0-100} to compute the weighted EP4 score."
        )

    # ESIA requirements
    esia_type = {
        "A": "Full ESIA with independent review",
        "B": "Limited ESIA or focused environmental study",
        "C": "Desk-based review only",
    }.get(ep_category, "desk_review")

    # Country-specific considerations
    host_country_in_high_risk = country in EP4_HIGH_RISK_COUNTRIES
    ifc_ps_applicable = ep_category in {"A", "B"}

    # Grievance mechanism — from supplied data only.
    grievance_data = grievance_data or {}
    g_score_raw = grievance_data.get("score")
    grievance_score: Optional[float] = round(_clamp(float(g_score_raw), 0.0, 100.0), 1) if g_score_raw is not None else None
    grievance_channels = grievance_data.get("channels")
    if grievance_score is None and grievance_channels is None:
        grievance_status = "insufficient_data"
        notes.append(
            "Grievance mechanism: insufficient_data — supply grievance_data={score, channels} to assess."
        )
    else:
        grievance_status = (
            "insufficient_data" if grievance_score is None
            else ("adequate" if grievance_score >= 70 else "needs_improvement")
        )

    return {
        "entity_id": entity_id,
        "project_type": project_type,
        "project_cost_usd": project_cost_usd,
        "country": country,
        "sector": sector,
        "ep4_category": ep_category,
        "category_description": cat_data["description"],
        "principle_scores": principle_scores,
        "weighted_ep4_score": weighted_score,
        "overall_status": overall_status,
        "esia_required": cat_data["esia_required"],
        "esia_type": esia_type,
        "independent_environmental_social_consultant_required": cat_data["independent_consultant"],
        "public_consultation_required": cat_data["public_consultation"],
        "monitoring_reporting": cat_data["monitoring_reporting"],
        "covenants": cat_data["covenants"],
        "grievance_mechanism": {
            "score": grievance_score,
            "channels": grievance_channels,
            "status": grievance_status,
        },
        "ifc_performance_standards_applicable": ifc_ps_applicable,
        "host_country_high_risk": host_country_in_high_risk,
        "oecd_crc": OECD_COUNTRY_RISK.get(country, None),
        "notes": notes,
    }


def evaluate_eca_standards(
    entity_id: str,
    export_credit_type: str,
    oecd_sector: str,
    country: Optional[str] = None,
    climate_compatibility_score: Optional[float] = None,
) -> dict[str, Any]:
    """
    Evaluate ECA standards under OECD Arrangement on export credits.

    Returns sector understanding thresholds, coal exclusion assessment,
    OECD CRC country risk classification, and premium calculation.

    Optional inputs (backward-compatible; default ``None``):
      - ``country``: host/buyer country used to look up the real OECD CRC
        (``OECD_COUNTRY_RISK``) that drives the CRC premium adjustment. When
        absent, CRC and the CRC-derived premium components are ``None`` and the
        total premium falls back to the sector's reference base premium only.
      - ``climate_compatibility_score``: a real 0-100 climate-compatibility
        assessment for the transaction. When absent it is ``None`` — the
        qualitative sector understanding (``su_status``) is still returned as it
        is reference data. A ``RESTRICTED`` sector always scores 0.0 by rule.
    """
    notes: list[str] = []
    sector_data = OECD_ARRANGEMENT_SECTORS.get(oecd_sector, OECD_ARRANGEMENT_SECTORS["manufacturing"])
    is_excluded = sector_data["restriction_type"] == "full_exclusion"

    # Premium calculation — base premium is reference data; CRC adjustment needs a real country.
    base_premium_pct = sector_data.get("min_premium_pct") or 0.0
    crc_country: Optional[int] = OECD_COUNTRY_RISK.get(country) if country else None
    if crc_country is None:
        crc_premium_adj: Optional[float] = None
        total_premium_pct: Optional[float] = round(base_premium_pct, 3)
        annual_cost_per_100m: Optional[float] = round((total_premium_pct or 0.0) * 1_000_000, 0)
        notes.append(
            "OECD CRC: insufficient_data — supply country to derive the CRC premium adjustment; "
            "total premium reflects the sector base premium only."
        )
    else:
        crc_premium_adj = round(crc_country * 0.05, 3)
        total_premium_pct = round(base_premium_pct + crc_premium_adj, 3)
        annual_cost_per_100m = round(total_premium_pct * 1_000_000, 0)

    # Climate change sector understanding (reference data) + optional real score.
    su_status = sector_data["climate_change_su"]
    if su_status == "RESTRICTED":
        climate_score: Optional[float] = 0.0
    elif climate_compatibility_score is not None:
        climate_score = round(_clamp(float(climate_compatibility_score), 0.0, 100.0), 1)
    else:
        climate_score = None
        notes.append(
            "Climate compatibility score: insufficient_data — supply climate_compatibility_score (0-100) "
            "to quantify; sector understanding classification is provided as reference data."
        )

    # Paris alignment check (qualitative, reference-data driven).
    paris_aligned = su_status in {"PREFERRED", "PERMITTED"} and not is_excluded

    # Maximum repayment terms
    max_repayment = sector_data.get("max_repayment_years", 10)

    crc_description = (
        f"OECD CRC {crc_country} — "
        f"{'low risk' if crc_country <= 2 else 'medium risk' if crc_country <= 5 else 'high risk'}"
        if crc_country is not None else "insufficient_data — country not supplied"
    )

    return {
        "entity_id": entity_id,
        "export_credit_type": export_credit_type,
        "oecd_sector": oecd_sector,
        "country": country,
        "sector_data": sector_data,
        "is_coal_excluded": is_excluded,
        "restriction_type": sector_data["restriction_type"],
        "climate_change_sector_understanding": su_status,
        "climate_compatibility_score": climate_score,
        "paris_aligned": paris_aligned,
        "max_repayment_years": max_repayment,
        "country_risk_classification": {
            "oecd_crc": crc_country,
            "description": crc_description,
        },
        "premium_calculation": {
            "base_premium_pct": base_premium_pct,
            "crc_adjustment_pct": crc_premium_adj,
            "total_premium_pct": total_premium_pct,
            "annual_cost_per_100m_usd": annual_cost_per_100m,
        },
        "oecd_arrangement_2023": {
            "version": "2023 revision",
            "applicable": True,
            "reporting_required": True,
        },
        "notes": notes,
    }


def score_supply_chain_esg(
    entity_id: str,
    suppliers: list[dict],
    product_category: str,
) -> dict[str, Any]:
    """
    Score supplier ESG tiers and model dynamic discounting ratchet.

    Returns supplier ESG tier (A-E), dynamic discounting margin (0-300bps),
    Scope 3 Cat 1 attribution per supplier, reverse factoring eligibility,
    and ILO labour standards compliance.

    Each supplier dict may carry (all optional; missing → honest null):
      - ``supplier_id``, ``supplier_name``, ``country``
      - ``annual_spend_usd``, ``revenue_usd`` — drive PCAF-style Cat 1 attribution
      - ``esg_score`` (0-100) — real ESG score; drives tier, discount bps and
        reverse-factoring eligibility. Absent → tier/discount are null and
        ``esg_status`` = ``"insufficient_data"``.
      - ``ilo_standards`` — dict of the four ILO core standards to booleans
        (``freedom_of_association``, ``forced_labour_free``, ``child_labour_free``,
        ``non_discrimination``). Absent → ``ilo_compliant`` is ``None``.

    No supplier attributes are fabricated: when ``suppliers`` is empty the
    result is an explicit empty portfolio with a note.
    """
    notes: list[str] = []
    if not suppliers:
        notes.append(
            "Supplier portfolio: insufficient_data — no suppliers supplied. Provide a "
            "suppliers list (supplier_id, country, annual_spend_usd, revenue_usd, esg_score, "
            "ilo_standards) to score ESG tiers and Scope 3 Cat 1 attribution."
        )
        return {
            "entity_id": entity_id,
            "product_category": product_category,
            "supplier_results": [],
            "portfolio_summary": {
                "total_suppliers": 0,
                "total_annual_spend_usd": 0.0,
                "total_scope3_cat1_tco2e": None,
                "weighted_avg_discount_bps": None,
                "pct_reverse_factoring_eligible": None,
                "tier_distribution": {},
            },
            "icc_stf_compliance": {
                "principles_assessed": [p["name"] for p in ICC_STF_PRINCIPLES[:4]],
                "overall_score": None,
                "status": "insufficient_data",
            },
            "notes": notes,
        }

    product_ghg = PRODUCT_GHG_INTENSITY.get(product_category, 2500.0)
    supplier_results = []
    total_scope3_cat1: Optional[float] = 0.0
    total_spend = 0.0
    discount_weight_sum = 0.0   # spend of suppliers that HAVE a discount, for weighted avg

    for sup in suppliers:
        # Real ESG score → tier + discount. Absent → honest null.
        esg_raw = sup.get("esg_score")
        if esg_raw is None:
            esg_score: Optional[float] = None
            tier: Optional[str] = None
            tier_data = None
            discount_bps: Optional[float] = None
            reverse_factoring_eligible: Optional[bool] = None
            due_diligence_level: Optional[str] = None
            monitoring_frequency: Optional[str] = None
            esg_status = "insufficient_data"
        else:
            esg_score = round(_clamp(float(esg_raw), 0.0, 100.0), 1)
            tier = _esg_tier_from_score(esg_score)
            tier_data = ESG_TIERS[tier]
            discount_bps = _discount_bps_from_score(esg_score, tier)
            reverse_factoring_eligible = tier_data["reverse_factoring_eligible"]
            due_diligence_level = tier_data["due_diligence_level"]
            monitoring_frequency = tier_data["monitoring_frequency"]
            esg_status = "scored"

        spend = float(sup.get("annual_spend_usd", 0.0) or 0.0)
        total_spend += spend
        revenue = float(sup.get("revenue_usd", 0.0) or 0.0)

        # PCAF-style Scope 3 Cat 1 attribution (deterministic; needs spend & revenue).
        if spend > 0 and revenue > 0:
            attribution_ratio: Optional[float] = min(spend / max(revenue, 1.0), 1.0)
            proxy_volume_tonnes = spend / max(product_ghg * 0.5, 1.0)
            scope3_cat1: Optional[float] = round(proxy_volume_tonnes * product_ghg * attribution_ratio, 1)
            if total_scope3_cat1 is not None:
                total_scope3_cat1 += scope3_cat1
        else:
            attribution_ratio = None
            scope3_cat1 = None
            total_scope3_cat1 = None  # portfolio total is incomplete if any supplier lacks spend/revenue

        # ILO labour standards — from supplied assessment only.
        ilo_in = sup.get("ilo_standards")
        if isinstance(ilo_in, dict) and ilo_in:
            ilo_standards: Optional[dict] = {
                "freedom_of_association": bool(ilo_in.get("freedom_of_association", False)),
                "forced_labour_free": bool(ilo_in.get("forced_labour_free", False)),
                "child_labour_free": bool(ilo_in.get("child_labour_free", False)),
                "non_discrimination": bool(ilo_in.get("non_discrimination", False)),
            }
            ilo_compliant: Optional[bool] = all(ilo_standards.values())
        else:
            ilo_standards = None
            ilo_compliant = None

        if discount_bps is not None and spend > 0:
            discount_weight_sum += spend

        supplier_results.append({
            "supplier_id": sup.get("supplier_id", "unknown"),
            "supplier_name": sup.get("supplier_name", "Unknown"),
            "country": sup.get("country", "Unknown"),
            "esg_score": esg_score,
            "esg_tier": tier,
            "esg_status": esg_status,
            "tier_description": tier_data["description"] if tier_data else None,
            "dynamic_discount_bps": discount_bps,
            "reverse_factoring_eligible": reverse_factoring_eligible,
            "due_diligence_level": due_diligence_level,
            "scope3_cat1_tco2e": scope3_cat1,
            "attribution_ratio": round(attribution_ratio, 4) if attribution_ratio is not None else None,
            "ilo_labour_standards": ilo_standards,
            "ilo_compliant": ilo_compliant,
            "annual_spend_usd": spend,
            "monitoring_frequency": monitoring_frequency,
        })

    # Weighted average discount over suppliers that carry a discount (real ESG score).
    if discount_weight_sum > 0:
        weighted_discount: Optional[float] = round(sum(
            s["dynamic_discount_bps"] * s["annual_spend_usd"] / discount_weight_sum
            for s in supplier_results
            if s["dynamic_discount_bps"] is not None and s["annual_spend_usd"] > 0
        ), 1)
    else:
        weighted_discount = None
        notes.append(
            "Weighted-average discount: insufficient_data — no supplier supplied both an ESG "
            "score and annual spend."
        )

    # ESG tier distribution (scored suppliers only).
    tier_distribution: dict[str, int] = {}
    scored = 0
    rf_eligible = 0
    for s in supplier_results:
        if s["esg_tier"] is not None:
            scored += 1
            t = s["esg_tier"]
            tier_distribution[t] = tier_distribution.get(t, 0) + 1
            if s["reverse_factoring_eligible"]:
                rf_eligible += 1

    pct_rf: Optional[float] = round(rf_eligible / scored * 100, 1) if scored > 0 else None

    if total_scope3_cat1 is None:
        notes.append(
            "Total Scope 3 Cat 1: insufficient_data — one or more suppliers lack annual_spend_usd "
            "or revenue_usd required for PCAF attribution."
        )

    return {
        "entity_id": entity_id,
        "product_category": product_category,
        "supplier_results": supplier_results,
        "portfolio_summary": {
            "total_suppliers": len(supplier_results),
            "total_annual_spend_usd": total_spend,
            "total_scope3_cat1_tco2e": round(total_scope3_cat1, 1) if total_scope3_cat1 is not None else None,
            "weighted_avg_discount_bps": weighted_discount,
            "pct_reverse_factoring_eligible": pct_rf,
            "tier_distribution": tier_distribution,
        },
        "icc_stf_compliance": {
            "principles_assessed": [p["name"] for p in ICC_STF_PRINCIPLES[:4]],
            "overall_score": None,
            "status": "insufficient_data",
            "note": "ICC STF overall score requires a supplied per-principle assessment; not fabricated.",
        },
        "notes": notes,
    }


def calculate_trade_flow_emissions(
    entity_id: str,
    trade_lanes: list[dict],
    commodity_type: str,
    volume_tonnes: float,
    grid_intensity_factors: Optional[dict[str, float]] = None,
) -> dict[str, Any]:
    """
    Calculate GHG emissions for trade flows.

    Returns Scope 3 Cat 4 (upstream transport) + Cat 1 (purchased goods),
    emission factors per transport mode, lifecycle GHG intensity.

    ``trade_lanes`` items: ``from_country``, ``to_country``, ``transport_mode``,
    ``distance_km``, ``volume_pct``. When empty, an explicit empty result with a
    note is returned — no synthetic lanes are fabricated.

    Optional ``grid_intensity_factors`` (default ``None``): mapping of origin
    country to a Cat 1 grid-intensity multiplier (>= 1.0). When a country is not
    supplied, a neutral multiplier of 1.0 is applied (documented model default —
    Cat 1 then reflects pure product lifecycle intensity with no origin uplift),
    and the fact is flagged per lane via ``grid_intensity_source``.
    """
    notes: list[str] = []
    grid_intensity_factors = grid_intensity_factors or {}

    if not trade_lanes:
        notes.append(
            "Trade lanes: insufficient_data — no trade lanes supplied. Provide a trade_lanes list "
            "(from_country, to_country, transport_mode, distance_km, volume_pct) to compute emissions."
        )
        return {
            "entity_id": entity_id,
            "commodity_type": commodity_type,
            "total_volume_tonnes": volume_tonnes,
            "product_ghg_intensity_kgco2e_tonne": PRODUCT_GHG_INTENSITY.get(commodity_type, 2500.0),
            "trade_lanes": [],
            "summary": {
                "total_scope3_cat4_tco2e": None,
                "total_scope3_cat1_tco2e": None,
                "combined_tco2e": None,
                "emission_intensity_tco2e_per_tonne": None,
            },
            "optimisation": {
                "current_cat4_tco2e": None,
                "minimum_possible_cat4_tco2e": None,
                "reduction_potential_pct": None,
                "recommended_mode": min(
                    TRANSPORT_EMISSION_FACTORS.items(), key=lambda x: x[1]["kgco2e_per_tonne_km"]
                )[0],
            },
            "ghg_protocol_references": ["GHG Protocol Corporate Value Chain Std 2011", "ISO 14083:2023"],
            "notes": notes,
        }

    product_ghg = PRODUCT_GHG_INTENSITY.get(commodity_type, 2500.0)

    lane_results = []
    total_scope3_cat4 = 0.0
    total_scope3_cat1 = 0.0

    for lane in trade_lanes:
        mode = lane.get("transport_mode", "sea_freight")
        if mode not in TRANSPORT_EMISSION_FACTORS:
            mode = "sea_freight"
        ef_data = TRANSPORT_EMISSION_FACTORS[mode]

        distance_km = float(lane.get("distance_km", 10000))
        lane_volume = volume_tonnes * float(lane.get("volume_pct", 1.0))

        # Scope 3 Cat 4: upstream transport (deterministic physical formula).
        cat4_tco2e = lane_volume * distance_km * ef_data["kgco2e_per_tonne_km"] / 1000.0

        # Country-of-origin grid intensity: use supplied factor, else neutral 1.0.
        origin_country = lane.get("from_country", "Unknown")
        supplied_gif = grid_intensity_factors.get(origin_country)
        if supplied_gif is not None:
            grid_intensity_factor = max(1.0, float(supplied_gif))
            gif_source = "supplied"
        else:
            grid_intensity_factor = 1.0  # documented neutral model default (no fabricated uplift)
            gif_source = "default_neutral_1.0"

        # Scope 3 Cat 1: purchased goods (lifecycle-based).
        cat1_tco2e = lane_volume * product_ghg * grid_intensity_factor / 1000.0

        total_scope3_cat4 += cat4_tco2e
        total_scope3_cat1 += cat1_tco2e

        lane_results.append({
            "from_country": origin_country,
            "to_country": lane.get("to_country", "Unknown"),
            "transport_mode": mode,
            "distance_km": distance_km,
            "volume_tonnes": round(lane_volume, 1),
            "volume_pct": lane.get("volume_pct", 1.0),
            "emission_factor_kgco2e_per_tkm": ef_data["kgco2e_per_tonne_km"],
            "scope3_cat4_transport_tco2e": round(cat4_tco2e, 2),
            "scope3_cat1_purchased_goods_tco2e": round(cat1_tco2e, 2),
            "grid_intensity_factor": round(grid_intensity_factor, 3),
            "grid_intensity_source": gif_source,
        })

    if any(l["grid_intensity_source"] == "default_neutral_1.0" for l in lane_results):
        notes.append(
            "Cat 1 grid-intensity uplift: neutral 1.0 applied for origins without a supplied factor "
            "(no fabricated uplift). Provide grid_intensity_factors={country: >=1.0} to refine."
        )

    # Mode comparison (what if all lowest-emission mode).
    best_mode = min(TRANSPORT_EMISSION_FACTORS.items(), key=lambda x: x[1]["kgco2e_per_tonne_km"])
    avg_distance = sum(l["distance_km"] for l in lane_results) / max(len(lane_results), 1)
    min_cat4 = volume_tonnes * avg_distance * best_mode[1]["kgco2e_per_tonne_km"] / 1000.0

    return {
        "entity_id": entity_id,
        "commodity_type": commodity_type,
        "total_volume_tonnes": volume_tonnes,
        "product_ghg_intensity_kgco2e_tonne": product_ghg,
        "trade_lanes": lane_results,
        "summary": {
            "total_scope3_cat4_tco2e": round(total_scope3_cat4, 2),
            "total_scope3_cat1_tco2e": round(total_scope3_cat1, 2),
            "combined_tco2e": round(total_scope3_cat4 + total_scope3_cat1, 2),
            "emission_intensity_tco2e_per_tonne": round(
                (total_scope3_cat4 + total_scope3_cat1) / max(volume_tonnes, 1), 4
            ),
        },
        "optimisation": {
            "current_cat4_tco2e": round(total_scope3_cat4, 2),
            "minimum_possible_cat4_tco2e": round(min_cat4, 2),
            "reduction_potential_pct": round(
                (total_scope3_cat4 - min_cat4) / max(total_scope3_cat4, 1) * 100, 1
            ),
            "recommended_mode": best_mode[0],
        },
        "ghg_protocol_references": ["GHG Protocol Corporate Value Chain Std 2011", "ISO 14083:2023"],
        "notes": notes,
    }


def generate_green_instrument(
    entity_id: str,
    instrument_type: str,
    use_of_proceeds: str,
    counterparty_country: str,
    stf_principle_scores: Optional[dict[str, float]] = None,
    esg_performance_score: Optional[float] = None,
) -> dict[str, Any]:
    """
    Generate green trade finance instrument assessment.

    Returns green LC/SBLC/trade loan criteria, ICC STF Principles alignment,
    ICMA Green Bond linkage, documentation requirements, pricing benefit.

    Optional inputs (backward-compatible; default ``None``):
      - ``stf_principle_scores``: mapping of ICC STF principle id (``"P1"``..``"P8"``)
        to a real 0-100 score. The weighted STF score is computed over the
        supplied principles only; when none are supplied it is ``None`` /
        ``"insufficient_data"``.
      - ``esg_performance_score`` (0-100): locates the pricing benefit within the
        instrument's reference bps band (documented policy band) via linear
        interpolation (higher performance → larger benefit). When absent the
        point estimate is ``None`` and the reference band is exposed instead —
        no midpoint is fabricated.

    An unknown ``instrument_type`` is reported as an explicit error result
    (never resolved to a random instrument).
    """
    notes: list[str] = []

    if instrument_type not in GREEN_INSTRUMENT_CRITERIA:
        return {
            "entity_id": entity_id,
            "instrument_type": instrument_type,
            "error": "unknown_instrument_type",
            "valid_instrument_types": list(GREEN_INSTRUMENT_CRITERIA.keys()),
            "notes": [
                f"Instrument type '{instrument_type}' is not recognised. Supply one of "
                f"{list(GREEN_INSTRUMENT_CRITERIA.keys())}."
            ],
        }
    instrument = GREEN_INSTRUMENT_CRITERIA[instrument_type]

    # Eligibility check (deterministic reference-data logic).
    eligible_sectors = instrument["eligible_sectors"]
    eligible = "any" in eligible_sectors or use_of_proceeds in eligible_sectors

    # ICC STF Principles scoring — from supplied assessments only.
    stf_principle_scores = stf_principle_scores or {}
    stf_scores = []
    stf_supplied_any = False
    for principle in ICC_STF_PRINCIPLES:
        raw = stf_principle_scores.get(principle["id"])
        if raw is None:
            s_score: Optional[float] = None
        else:
            s_score = round(_clamp(float(raw), 0.0, 100.0), 1)
            stf_supplied_any = True
        stf_scores.append({
            "id": principle["id"],
            "name": principle["name"],
            "weight": principle["weight"],
            "score": s_score,
        })

    if stf_supplied_any:
        supplied_weight = sum(s["weight"] for s in stf_scores if s["score"] is not None)
        stf_weighted: Optional[float] = round(sum(
            s["score"] * s["weight"] for s in stf_scores if s["score"] is not None
        ) / supplied_weight, 1) if supplied_weight > 0 else None
        stf_aligned: Optional[bool] = (stf_weighted >= 70) if stf_weighted is not None else None
    else:
        stf_weighted = None
        stf_aligned = None
        notes.append(
            "ICC STF alignment: insufficient_data — supply stf_principle_scores={P1..P8: 0-100} "
            "to compute the weighted STF score."
        )

    # Pricing benefit — reference band always exposed; point estimate needs a real ESG score.
    bps_lo, bps_hi = instrument["pricing_benefit_bps_range"]
    if not eligible:
        pricing_benefit_bps: Optional[float] = 0.0
    elif esg_performance_score is not None:
        perf = _clamp(float(esg_performance_score), 0.0, 100.0)
        # Higher ESG performance → larger benefit within the reference band.
        pricing_benefit_bps = round(bps_lo + (perf / 100.0) * (bps_hi - bps_lo), 1)
    else:
        pricing_benefit_bps = None
        notes.append(
            "Pricing benefit: insufficient_data — supply esg_performance_score (0-100) to locate the "
            f"benefit within the reference band {bps_lo}-{bps_hi} bps; the band is returned as reference."
        )

    # ICMA Green Bond linkage (deterministic reference-data logic).
    icma_eligible_use_of_proceeds = use_of_proceeds in [
        "renewable_energy", "energy_efficiency", "clean_transport", "sustainable_water",
        "green_building", "sustainable_agriculture", "climate_adaptation",
    ]
    icma_category = (
        "Green" if icma_eligible_use_of_proceeds
        else "Sustainability-Linked" if not instrument["use_of_proceeds_required"]
        else "Not Eligible"
    )

    # Country risk and documentation requirements.
    counterparty_crc = OECD_COUNTRY_RISK.get(counterparty_country, None)
    additional_docs = []
    if counterparty_crc is not None and counterparty_crc >= 5:
        additional_docs.append("Enhanced KYC / country risk assessment")
    if counterparty_crc is not None and counterparty_crc >= 6:
        additional_docs.append("Export control compliance sign-off")
    if counterparty_crc is None:
        additional_docs.append("Counterparty country risk assessment required (country not in OECD CRC table)")
    if not eligible:
        additional_docs.append("Use of proceeds re-assessment required")

    risk_level = (
        "insufficient_data" if counterparty_crc is None
        else ("low" if counterparty_crc <= 2 else ("medium" if counterparty_crc <= 5 else "high"))
    )

    return {
        "entity_id": entity_id,
        "instrument_type": instrument_type,
        "instrument_name": instrument["full_name"],
        "use_of_proceeds": use_of_proceeds,
        "counterparty_country": counterparty_country,
        "eligibility": {
            "eligible": eligible,
            "eligible_sectors": eligible_sectors,
            "ineligibility_reason": None if eligible else f"{use_of_proceeds} not in eligible sector list",
        },
        "pricing": {
            "pricing_benefit_bps": pricing_benefit_bps,
            "pricing_benefit_bps_reference_band": {"low": bps_lo, "high": bps_hi},
            "use_of_proceeds_required": instrument["use_of_proceeds_required"],
            "icma_gbs_aligned": instrument["icma_gbs_aligned"],
        },
        "icc_stf_principles": {
            "principle_scores": stf_scores,
            "weighted_score": stf_weighted,
            "aligned": stf_aligned,
        },
        "icma_classification": icma_category,
        "documentation_requirements": instrument["documentation"] + additional_docs,
        "counterparty_risk": {
            "country": counterparty_country,
            "oecd_crc": counterparty_crc,
            "risk_level": risk_level,
        },
        "notes": notes,
    }
