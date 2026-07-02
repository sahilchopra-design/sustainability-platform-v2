"""
climate_finance_engine.py — E78 Climate Finance Flows
OECD CRS Rio Markers | UNFCCC Art 2.1(c) | CPI Global Landscape 2023
NCQG $300bn COP29 Baku | MDB Joint Tracking | OECD TOSSD | Convergence Blending

Data-integrity policy: every RETURNED metric is either a REAL computation from
caller-supplied inputs (OECD CRS marker counting, OECD DAC mobilisation
multipliers, CPI/NCQG reference data) or an HONEST NULL when the required input
is absent. No metric is drawn from a random number generator.
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, Optional

# ── Reference Data ─────────────────────────────────────────────────────────────

OECD_RIO_MARKERS = [
    {"id": "RM-01", "name": "Climate Change Mitigation", "code": "CCM", "marker_values": [0, 1, 2], "description": "0=not targeted, 1=significant objective, 2=principal objective"},
    {"id": "RM-02", "name": "Climate Change Adaptation", "code": "CCA", "marker_values": [0, 1, 2], "description": "0=not targeted, 1=significant objective, 2=principal objective"},
    {"id": "RM-03", "name": "Biodiversity", "code": "BD", "marker_values": [0, 1, 2], "description": "Rio Convention on Biological Diversity"},
    {"id": "RM-04", "name": "Desertification", "code": "DESER", "marker_values": [0, 1, 2], "description": "UN Convention to Combat Desertification"},
    {"id": "RM-05", "name": "Water", "code": "WTR", "marker_values": [0, 1, 2], "description": "OECD water policy marker"},
    {"id": "RM-06", "name": "Nutrition", "code": "NUTR", "marker_values": [0, 1, 2], "description": "Nutrition policy marker"},
    {"id": "RM-07", "name": "Trade Development", "code": "TRADE", "marker_values": [0, 1, 2], "description": "Trade development marker"},
    {"id": "RM-08", "name": "Digital Technology", "code": "DIG", "marker_values": [0, 1, 2], "description": "Digital technology marker 2023"},
    {"id": "RM-09", "name": "Disaster Risk Reduction", "code": "DRR", "marker_values": [0, 1, 2], "description": "Sendai Framework alignment"},
    {"id": "RM-10", "name": "Inclusion & Equity", "code": "IE", "marker_values": [0, 1, 2], "description": "Inclusion and equity marker"},
    {"id": "RM-11", "name": "Gender Equality", "code": "GEN", "marker_values": [0, 1, 2], "description": "DAC gender equality marker"},
    {"id": "RM-12", "name": "Environment", "code": "ENV", "marker_values": [0, 1, 2], "description": "General environment marker"},
]

# CPI Global Landscape of Climate Finance 2023 data
CPI_2023_DATA = {
    "total_climate_finance_usd_bn": 1265,
    "private_finance_usd_bn": 626,
    "public_finance_usd_bn": 639,
    "adaptation_usd_bn": 63,
    "mitigation_usd_bn": 1202,
    "annual_need_2030_usd_bn": 4300,
    "annual_gap_usd_bn": 3035,
    "by_instrument": {
        "debt": {"amount_usd_bn": 680, "share_pct": 53.7},
        "equity": {"amount_usd_bn": 330, "share_pct": 26.1},
        "grants": {"amount_usd_bn": 143, "share_pct": 11.3},
        "guarantees_insurance": {"amount_usd_bn": 62, "share_pct": 4.9},
        "mixed_instruments": {"amount_usd_bn": 50, "share_pct": 4.0},
    },
    "by_geography": {
        "east_asia_pacific": {"amount_usd_bn": 682, "share_pct": 53.9},
        "western_europe": {"amount_usd_bn": 262, "share_pct": 20.7},
        "north_america": {"amount_usd_bn": 108, "share_pct": 8.5},
        "developing_countries": {"amount_usd_bn": 213, "share_pct": 16.9},
    },
    "by_sector": {
        "energy_systems": {"amount_usd_bn": 870, "share_pct": 68.8},
        "transport": {"amount_usd_bn": 212, "share_pct": 16.8},
        "buildings": {"amount_usd_bn": 85, "share_pct": 6.7},
        "agriculture_land_use": {"amount_usd_bn": 45, "share_pct": 3.6},
        "water_oceans": {"amount_usd_bn": 28, "share_pct": 2.2},
        "other": {"amount_usd_bn": 25, "share_pct": 2.0},
    },
}

# MDB institutions with climate shares
MDB_INSTITUTIONS = [
    {"name": "World Bank Group", "code": "WBG", "total_finance_usd_bn": 85, "climate_share_pct": 35, "adaptation_target_pct": 50, "paris_aligned_since": 2023},
    {"name": "Asian Development Bank", "code": "ADB", "total_finance_usd_bn": 22, "climate_share_pct": 44, "adaptation_target_pct": 30, "paris_aligned_since": 2021},
    {"name": "European Investment Bank", "code": "EIB", "total_finance_usd_bn": 88, "climate_share_pct": 50, "adaptation_target_pct": 15, "paris_aligned_since": 2020},
    {"name": "African Development Bank", "code": "AfDB", "total_finance_usd_bn": 10, "climate_share_pct": 40, "adaptation_target_pct": 50, "paris_aligned_since": 2022},
    {"name": "Inter-American Development Bank", "code": "IADB", "total_finance_usd_bn": 20, "climate_share_pct": 30, "adaptation_target_pct": 25, "paris_aligned_since": 2021},
    {"name": "European Bank for Reconstruction and Development", "code": "EBRD", "total_finance_usd_bn": 15, "climate_share_pct": 45, "adaptation_target_pct": 20, "paris_aligned_since": 2021},
    {"name": "Asian Infrastructure Investment Bank", "code": "AIIB", "total_finance_usd_bn": 12, "climate_share_pct": 38, "adaptation_target_pct": 20, "paris_aligned_since": 2023},
    {"name": "Islamic Development Bank", "code": "IsDB", "total_finance_usd_bn": 8, "climate_share_pct": 25, "adaptation_target_pct": 30, "paris_aligned_since": 2022},
]

# Recipient countries by income group (sample 40)
RECIPIENT_COUNTRIES = [
    {"iso": "BD", "country": "Bangladesh", "income_group": "lower_middle", "climate_vulnerable": True, "v20": True},
    {"iso": "ET", "country": "Ethiopia", "income_group": "low", "climate_vulnerable": True, "v20": True},
    {"iso": "KE", "country": "Kenya", "income_group": "lower_middle", "climate_vulnerable": True, "v20": False},
    {"iso": "MX", "country": "Mexico", "income_group": "upper_middle", "climate_vulnerable": False, "v20": False},
    {"iso": "IN", "country": "India", "income_group": "lower_middle", "climate_vulnerable": True, "v20": False},
    {"iso": "ID", "country": "Indonesia", "income_group": "upper_middle", "climate_vulnerable": True, "v20": False},
    {"iso": "PK", "country": "Pakistan", "income_group": "lower_middle", "climate_vulnerable": True, "v20": True},
    {"iso": "VN", "country": "Vietnam", "income_group": "lower_middle", "climate_vulnerable": True, "v20": False},
    {"iso": "PH", "country": "Philippines", "income_group": "lower_middle", "climate_vulnerable": True, "v20": True},
    {"iso": "NG", "country": "Nigeria", "income_group": "lower_middle", "climate_vulnerable": True, "v20": False},
    {"iso": "TZ", "country": "Tanzania", "income_group": "low", "climate_vulnerable": True, "v20": True},
    {"iso": "GH", "country": "Ghana", "income_group": "lower_middle", "climate_vulnerable": False, "v20": False},
    {"iso": "EG", "country": "Egypt", "income_group": "lower_middle", "climate_vulnerable": True, "v20": False},
    {"iso": "MA", "country": "Morocco", "income_group": "lower_middle", "climate_vulnerable": False, "v20": False},
    {"iso": "CO", "country": "Colombia", "income_group": "upper_middle", "climate_vulnerable": True, "v20": False},
    {"iso": "PE", "country": "Peru", "income_group": "upper_middle", "climate_vulnerable": True, "v20": False},
    {"iso": "TH", "country": "Thailand", "income_group": "upper_middle", "climate_vulnerable": True, "v20": False},
    {"iso": "MM", "country": "Myanmar", "income_group": "lower_middle", "climate_vulnerable": True, "v20": True},
    {"iso": "KH", "country": "Cambodia", "income_group": "lower_middle", "climate_vulnerable": True, "v20": True},
    {"iso": "SN", "country": "Senegal", "income_group": "lower_middle", "climate_vulnerable": True, "v20": True},
    {"iso": "UG", "country": "Uganda", "income_group": "low", "climate_vulnerable": True, "v20": True},
    {"iso": "ZM", "country": "Zambia", "income_group": "lower_middle", "climate_vulnerable": True, "v20": True},
    {"iso": "LK", "country": "Sri Lanka", "income_group": "lower_middle", "climate_vulnerable": True, "v20": True},
    {"iso": "NP", "country": "Nepal", "income_group": "lower_middle", "climate_vulnerable": True, "v20": True},
    {"iso": "MZ", "country": "Mozambique", "income_group": "low", "climate_vulnerable": True, "v20": True},
    {"iso": "MW", "country": "Malawi", "income_group": "low", "climate_vulnerable": True, "v20": True},
    {"iso": "HT", "country": "Haiti", "income_group": "low", "climate_vulnerable": True, "v20": True},
    {"iso": "MG", "country": "Madagascar", "income_group": "low", "climate_vulnerable": True, "v20": True},
    {"iso": "BF", "country": "Burkina Faso", "income_group": "low", "climate_vulnerable": True, "v20": True},
    {"iso": "ML", "country": "Mali", "income_group": "low", "climate_vulnerable": True, "v20": True},
    {"iso": "BR", "country": "Brazil", "income_group": "upper_middle", "climate_vulnerable": True, "v20": False},
    {"iso": "ZA", "country": "South Africa", "income_group": "upper_middle", "climate_vulnerable": False, "v20": False},
    {"iso": "UA", "country": "Ukraine", "income_group": "lower_middle", "climate_vulnerable": False, "v20": False},
    {"iso": "JO", "country": "Jordan", "income_group": "upper_middle", "climate_vulnerable": True, "v20": False},
    {"iso": "TN", "country": "Tunisia", "income_group": "lower_middle", "climate_vulnerable": True, "v20": False},
    {"iso": "CI", "country": "Côte d'Ivoire", "income_group": "lower_middle", "climate_vulnerable": True, "v20": False},
    {"iso": "CM", "country": "Cameroon", "income_group": "lower_middle", "climate_vulnerable": True, "v20": False},
    {"iso": "AO", "country": "Angola", "income_group": "lower_middle", "climate_vulnerable": True, "v20": False},
    {"iso": "EC", "country": "Ecuador", "income_group": "upper_middle", "climate_vulnerable": True, "v20": False},
    {"iso": "BO", "country": "Bolivia", "income_group": "lower_middle", "climate_vulnerable": True, "v20": False},
]

# NCQG structure (COP29 Baku 2024)
NCQG_STRUCTURE = {
    "headline_goal_usd_bn_per_year": 300,
    "target_year": 2035,
    "cop_decision": "COP29 Baku 2024",
    "goal_layers": {
        "core_goal": {
            "amount_usd_bn": 300,
            "contributors": "Developed country parties (Annex II)",
            "description": "Public and private finance mobilised by developed countries",
        },
        "broader_goal": {
            "amount_usd_bn": 1300,
            "contributors": "All parties including voluntary",
            "description": "Includes voluntary contributions from developing nations with capacity",
        },
    },
    "instrument_split": {
        "grants_and_grant_equivalent": {"target_pct": 40, "ldcs_sids_pct": 50},
        "concessional_loans": {"target_pct": 35},
        "private_mobilised": {"target_pct": 25, "mdb_leverage": 3.5},
    },
    "predecessor_goal": {
        "amount_usd_bn": 100,
        "target_year": 2020,
        "achieved_year": 2022,
        "achieved_usd_bn": 115.9,
        "source": "OECD 2024 Climate Finance Report",
    },
}

# IPCC-compatible pathways
IPCC_PATHWAYS = [
    {"pathway": "1.5C_no_overshoot", "description": "Net zero CO2 by 2050, immediate steep reductions", "peak_warming_c": 1.5, "annual_investment_usd_tn": 4.3},
    {"pathway": "well_below_2C", "description": "Net zero CO2 by 2070, rapid near-term reductions", "peak_warming_c": 1.8, "annual_investment_usd_tn": 3.2},
    {"pathway": "2C_with_overshoot", "description": "Net zero CO2 by 2075, moderate reductions", "peak_warming_c": 2.0, "annual_investment_usd_tn": 2.5},
    {"pathway": "ndc_current_policies", "description": "Current NDC policies sustained", "peak_warming_c": 2.7, "annual_investment_usd_tn": 1.7},
]

# Mobilisation multipliers (OECD DAC methodology)
MOBILISATION_MULTIPLIERS = {
    "guarantees": {"min": 3.0, "max": 8.0, "typical": 5.0, "methodology": "OECD DAC Converged Statistical Reporting Directives"},
    "equity": {"min": 2.0, "max": 4.0, "typical": 2.8, "methodology": "OECD DCD/DAC(2019)34/FINAL"},
    "concessional_loans": {"min": 1.5, "max": 3.0, "typical": 2.0, "methodology": "Convergence Blending Finance Report 2023"},
    "grants": {"min": 1.0, "max": 2.5, "typical": 1.5, "methodology": "OECD MDB mobilisation ratio"},
    "technical_assistance": {"min": 1.0, "max": 2.0, "typical": 1.3, "methodology": "OECD DAC"},
    "risk_sharing": {"min": 4.0, "max": 10.0, "typical": 6.5, "methodology": "First-loss provisions / MIGA"},
}

# Convergence "State of Blended Finance" — reported median private-finance
# mobilisation leverage for blended climate finance vehicles (~4.0x). Used as a
# fixed external comparison benchmark, not as an entity-specific figure.
CONVERGENCE_BLENDED_FINANCE_MEDIAN_MULTIPLIER = 4.0


# ── Core Engine Functions ──────────────────────────────────────────────────────

def track_climate_finance(
    entity_id: str,
    portfolio_name: str,
    year: int,
    instruments: list[dict[str, Any]],
) -> dict[str, Any]:
    total_mitigation = 0.0
    total_adaptation = 0.0
    total_cross_cutting = 0.0
    fossil_exposure = 0.0            # sum of caller-supplied fossil-fuel amounts
    fossil_exposure_reported = False  # True once any instrument flags fossil exposure
    instrument_breakdown: list[dict] = []

    for inst in instruments:
        # HONEST NULL: an instrument with no reported amount contributes 0, not a
        # fabricated random figure.
        amount = float(inst.get("amount_usd", 0) or 0)

        # OECD CRS Rio markers default to 0 (not targeted) when unreported — the
        # conservative, honest position rather than a random 0/1/2 draw.
        ccm_marker = int(inst.get("ccm_marker", 0) or 0)
        cca_marker = int(inst.get("cca_marker", 0) or 0)

        # CRS counting methodology: principal=100%, significant=50%
        mitigation_counted = amount if ccm_marker == 2 else amount * 0.5 if ccm_marker == 1 else 0
        adaptation_counted = amount if cca_marker == 2 else amount * 0.5 if cca_marker == 1 else 0

        if mitigation_counted > 0 and adaptation_counted > 0:
            total_cross_cutting += min(mitigation_counted, adaptation_counted)
            total_mitigation += mitigation_counted - min(mitigation_counted, adaptation_counted)
            total_adaptation += adaptation_counted - min(mitigation_counted, adaptation_counted)
        else:
            total_mitigation += mitigation_counted
            total_adaptation += adaptation_counted

        # Fossil-fuel exposure from caller-supplied signals only. Accepts an
        # explicit fossil_fuel_amount_usd, or a boolean fossil_fuel flag meaning
        # the full instrument amount is fossil-exposed.
        inst_fossil = inst.get("fossil_fuel_amount_usd")
        if inst_fossil is not None:
            fossil_exposure += float(inst_fossil or 0)
            fossil_exposure_reported = True
        elif inst.get("fossil_fuel") is not None:
            if bool(inst.get("fossil_fuel")):
                fossil_exposure += amount
            fossil_exposure_reported = True

        instrument_breakdown.append({
            "name": inst.get("name", f"instrument_{len(instrument_breakdown)+1}"),
            "amount_usd": amount,
            "instrument_type": inst.get("instrument_type", "loan"),
            "ccm_marker": ccm_marker,
            "cca_marker": cca_marker,
            "climate_relevant_amount_usd": round(mitigation_counted + adaptation_counted, 0),
            "sector": inst.get("sector", "unspecified"),
            "recipient_country": inst.get("recipient_country", "unspecified"),
        })

    total_climate_finance = total_mitigation + total_adaptation + total_cross_cutting

    # Paris alignment check — computed only when fossil exposure is actually
    # reported; otherwise returned as an HONEST NULL rather than a random draw.
    if fossil_exposure_reported and total_climate_finance > 0:
        paris_alignment_score: Optional[float] = round(max(0.0, 1 - fossil_exposure / total_climate_finance), 3)
    else:
        paris_alignment_score = None

    # CPI methodology alignment — these are properties of THIS engine's
    # methodology, not entity-reported figures, so they are deterministic facts:
    # the engine tracks the public/private split, uses Rio markers, reports the
    # adaptation/mitigation split, and follows MDB joint-tracking methodology.
    # Private-mobilisation coverage depends on whether the caller supplied the
    # data needed to compute it (see measure_mobilisation).
    cpi_aligned = {
        "tracks_public_private_split": True,
        "uses_rio_markers": True,
        "reports_adaptation_mitigation_split": True,
        "follows_mdb_tracking_methodology": True,
        "includes_private_mobilisation": False,
    }

    return {
        "entity_id": entity_id,
        "portfolio_name": portfolio_name,
        "reporting_year": year,
        "total_climate_finance_usd": round(total_climate_finance, 0),
        "mitigation_finance_usd": round(total_mitigation, 0),
        "adaptation_finance_usd": round(total_adaptation, 0),
        "cross_cutting_finance_usd": round(total_cross_cutting, 0),
        "adaptation_share_pct": round(total_adaptation / total_climate_finance * 100, 1) if total_climate_finance else 0,
        "cpi_global_landscape_2023_reference": CPI_2023_DATA,
        "paris_alignment_score": paris_alignment_score,
        "fossil_fuel_exposure_usd": round(fossil_exposure, 0) if fossil_exposure_reported else None,
        "fossil_exposure_reported": fossil_exposure_reported,
        "data_sufficiency_note": (
            None if fossil_exposure_reported
            else "Paris alignment / fossil exposure not computed: no instrument supplied "
                 "fossil_fuel_amount_usd or fossil_fuel flag."
        ),
        "instrument_breakdown": instrument_breakdown,
        "cpi_methodology_alignment": cpi_aligned,
        "oecd_crs_aligned": all(cpi_aligned.values()),
        "assessed_at": datetime.now(timezone.utc).isoformat(),
    }


def assess_article21c_alignment(
    entity_id: str,
    portfolio: dict[str, Any],
    financial_flows: list[dict[str, Any]],
) -> dict[str, Any]:
    total_flows = sum(float(f.get("amount_usd", 0) or 0) for f in financial_flows)
    # HONEST classification: only flows the caller explicitly tags as
    # climate_aligned / fossil_fuel are counted. An unflagged flow is neither
    # green nor brown (previously a random coin flip decided its colour).
    green_flows = sum(
        float(f.get("amount_usd", 0) or 0)
        for f in financial_flows
        if bool(f.get("climate_aligned", False))
    )
    fossil_flows = sum(
        float(f.get("amount_usd", 0) or 0)
        for f in financial_flows
        if bool(f.get("fossil_fuel", False))
    )

    has_flows = total_flows > 0
    # HONEST NULL: with no reported flows there is nothing to score; ratios and
    # the alignment score are null rather than a fabricated random range.
    green_ratio: Optional[float] = green_flows / total_flows if has_flows else None
    brown_ratio: Optional[float] = fossil_flows / total_flows if has_flows else None
    alignment_score: Optional[float] = (
        min(100.0, round((green_ratio - brown_ratio * 2) * 100, 1))
        if has_flows else None
    )

    pathway_alignment: list[dict] = []
    for path in IPCC_PATHWAYS:
        threshold = 90 if "1.5" in path["pathway"] else 70 if "well_below" in path["pathway"] else 50 if "2C" in path["pathway"] else 30
        # None-safe: compatibility is undetermined when there is no score.
        compatible: Optional[bool] = (alignment_score >= threshold) if alignment_score is not None else None
        pathway_alignment.append({
            "pathway": path["pathway"],
            "description": path["description"],
            "peak_warming_c": path["peak_warming_c"],
            "portfolio_compatible": compatible,
            "annual_investment_needed_usd_tn": path["annual_investment_usd_tn"],
        })

    art9_public_finance = {
        "developed_country_commitment": "$100bn/year by 2020 (achieved 2022: $115.9bn OECD)",
        "ncqg_successor": "$300bn/year by 2035 (COP29 Baku)",
        "ldcs_sids_prioritisation": True,
        "grants_preference": "≥40% grant equivalent recommended",
    }

    return {
        "entity_id": entity_id,
        "unfccc_article": "2.1(c) — Making finance flows consistent with low GHG development and climate resilience",
        "total_portfolio_flows_usd": round(total_flows, 0),
        "green_aligned_flows_usd": round(green_flows, 0),
        "fossil_fuel_flows_usd": round(fossil_flows, 0),
        "green_ratio": round(green_ratio, 3) if green_ratio is not None else None,
        "brown_ratio": round(brown_ratio, 3) if brown_ratio is not None else None,
        "alignment_score_0_100": max(0.0, alignment_score) if alignment_score is not None else None,
        "article_21c_aligned": (alignment_score >= 60) if alignment_score is not None else None,
        "data_sufficiency_note": (
            None if has_flows
            else "Alignment not computed: no financial_flows with amount_usd supplied."
        ),
        "paris_article9_public_finance": art9_public_finance,
        "ipcc_pathway_alignment": pathway_alignment,
        "recommended_actions": [
            "Phase out fossil fuel financing by 2030 (IEA Net Zero pathway)",
            "Increase adaptation finance to ≥50% of climate finance portfolio",
            "Adopt Science-Based Targets for financial institutions (SBTi FI)",
            "Align investment mandates with EU Taxonomy green finance criteria",
        ],
        "assessed_at": datetime.now(timezone.utc).isoformat(),
    }


def calculate_ncqg_contribution(
    entity_id: str,
    institution_type: str,
    baseline_finance_usd: float,
    planned_uplift_pct: Optional[float] = None,
    mobilisation_multiplier: Optional[float] = None,
    guarantee_share_of_contribution: Optional[float] = None,
    equity_share_of_contribution: Optional[float] = None,
    grant_equivalent_pct: Optional[float] = None,
    ldcs_sids_share_pct: Optional[float] = None,
) -> dict[str, Any]:
    """
    All entity-specific figures (planned uplift over baseline, realised
    mobilisation multiplier, guarantee/equity split, grant-equivalent share,
    LDCs/SIDS earmark) must be supplied by the caller. When omitted they are
    returned as HONEST NULLs — the previous version fabricated them via a
    hash-seeded RNG. Contributor-tier logic and the $300bn core-goal share are
    genuine deterministic computations and are preserved.
    """
    # NCQG contributor tiers
    is_annex2 = institution_type.lower() in ["developed_country_dfi", "annex_ii_party", "oecd_member_mdb"]
    is_voluntary = institution_type.lower() in ["voluntary_contributor", "emerging_economy_mdb", "sovereign_wealth_fund"]

    # Goal layer assignment (deterministic from contributor tier).
    if is_annex2:
        goal_layer = "core_goal"
    elif is_voluntary:
        goal_layer = "broader_goal"
    else:
        goal_layer = "observer"

    core_goal = NCQG_STRUCTURE["headline_goal_usd_bn_per_year"] * 1e9

    # Contribution = baseline plus any caller-declared planned uplift. With no
    # declared plan the contribution equals the baseline (no fabricated growth).
    effective_uplift_pct = float(planned_uplift_pct) if planned_uplift_pct is not None else 0.0
    contribution_usd = baseline_finance_usd * (1 + effective_uplift_pct / 100)

    # Total mobilised requires a caller-supplied (or reported) mobilisation
    # multiplier; otherwise HONEST NULL.
    mob_mult = float(mobilisation_multiplier) if mobilisation_multiplier is not None else None
    total_mobilised_usd: Optional[float] = contribution_usd * mob_mult if mob_mult is not None else None

    # Private finance mobilisation via OECD DAC typical multipliers — computed
    # only when the caller specifies how the contribution is split across
    # guarantees and equity instruments. Otherwise HONEST NULL.
    if guarantee_share_of_contribution is not None or equity_share_of_contribution is not None:
        g_share = float(guarantee_share_of_contribution or 0)
        e_share = float(equity_share_of_contribution or 0)
        guarantee_amount = contribution_usd * g_share
        equity_amount = contribution_usd * e_share
        private_mobilised: Optional[float] = (
            guarantee_amount * MOBILISATION_MULTIPLIERS["guarantees"]["typical"]
            + equity_amount * MOBILISATION_MULTIPLIERS["equity"]["typical"]
        )
    else:
        private_mobilised = None

    # Grant equivalent — real computation from a supplied grant-equivalent share.
    grant_pct = float(grant_equivalent_pct) if grant_equivalent_pct is not None else None
    grant_equivalent_usd: Optional[float] = contribution_usd * grant_pct / 100 if grant_pct is not None else None

    # LDCs/SIDS earmark is an entity-reported figure — null unless supplied.
    ldcs_share = float(ldcs_sids_share_pct) if ldcs_sids_share_pct is not None else None

    # Gap to $300bn commitment (genuine deterministic math).
    share_of_core_goal_pct = contribution_usd / core_goal * 100

    return {
        "entity_id": entity_id,
        "institution_type": institution_type,
        "is_annex2_contributor": is_annex2,
        "goal_layer": goal_layer,
        "ncqg_structure": NCQG_STRUCTURE,
        "baseline_finance_usd": round(baseline_finance_usd, 0),
        "planned_uplift_pct": round(effective_uplift_pct, 2),
        "ncqg_contribution_usd": round(contribution_usd, 0),
        "share_of_300bn_core_goal_pct": round(share_of_core_goal_pct, 4),
        "mdb_mobilisation_multiplier": round(mob_mult, 2) if mob_mult is not None else None,
        "total_mobilised_usd": round(total_mobilised_usd, 0) if total_mobilised_usd is not None else None,
        "private_finance_mobilised_usd": round(private_mobilised, 0) if private_mobilised is not None else None,
        "grant_equivalent_pct": round(grant_pct, 1) if grant_pct is not None else None,
        "grant_equivalent_usd": round(grant_equivalent_usd, 0) if grant_equivalent_usd is not None else None,
        "ldcs_sids_share_pct": round(ldcs_share, 1) if ldcs_share is not None else None,
        "tossd_eligible": is_annex2 or is_voluntary,
        "oecd_dac_reporting_required": is_annex2,
        "data_sufficiency_note": (
            "Mobilisation, private-finance, grant-equivalent and LDCs/SIDS figures "
            "are null unless supplied by the caller (mobilisation_multiplier, "
            "guarantee/equity shares, grant_equivalent_pct, ldcs_sids_share_pct)."
        ),
        "assessed_at": datetime.now(timezone.utc).isoformat(),
    }


def measure_mobilisation(
    entity_id: str,
    public_finance_usd: float,
    instruments: list[dict[str, Any]],
) -> dict[str, Any]:
    total_mobilised = 0.0
    additionality_score = 0.0
    instrument_results: list[dict] = []
    any_observed_multiplier = False

    for inst in instruments:
        inst_type = inst.get("type", "guarantees").lower().replace(" ", "_")
        # HONEST NULL: an instrument with no reported public finance contributes 0.
        amount = float(inst.get("amount_usd", 0) or 0)

        mult_data = MOBILISATION_MULTIPLIERS.get(inst_type, MOBILISATION_MULTIPLIERS["guarantees"])

        # Prefer the caller's OBSERVED/realised mobilisation multiplier. When
        # none is reported, fall back to the OECD DAC *typical* calibration
        # constant for the instrument type (a documented model parameter, not a
        # fabricated entity figure) and flag it as such.
        reported_mult = inst.get("observed_multiplier", inst.get("mobilisation_multiplier"))
        if reported_mult is not None:
            actual_multiplier = float(reported_mult)
            multiplier_basis = "reported"
            any_observed_multiplier = True
        else:
            actual_multiplier = float(mult_data["typical"])
            multiplier_basis = "oecd_dac_typical_assumption"

        mobilised = amount * actual_multiplier

        total_mobilised += mobilised
        additionality_score += (1.0 if inst_type in ["guarantees", "risk_sharing"] else 0.7 if inst_type == "equity" else 0.5) * amount

        instrument_results.append({
            "instrument_type": inst_type,
            "public_finance_usd": amount,
            "mobilisation_multiplier": round(actual_multiplier, 2),
            "multiplier_basis": multiplier_basis,
            "private_mobilised_usd": round(mobilised, 0),
            "methodology": mult_data["methodology"],
            "additionality_assessment": "high" if actual_multiplier >= mult_data["typical"] else "medium",
        })

    weighted_avg_multiplier = total_mobilised / public_finance_usd if public_finance_usd > 0 else 0
    additionality_avg = additionality_score / public_finance_usd if public_finance_usd > 0 else 0

    # Fixed external benchmark (not an entity metric). Convergence's State of
    # Blended Finance reports a ~4.0x median private mobilisation leverage for
    # blended climate finance vehicles — used deterministically for comparison.
    convergence_benchmark = CONVERGENCE_BLENDED_FINANCE_MEDIAN_MULTIPLIER

    # OECD TOSSD. Portal readiness is a deterministic data-completeness check:
    # the submission is ready only if every instrument carries a reported
    # (non-assumed) mobilisation multiplier.
    tossd = {
        "total_official_support_usd": round(public_finance_usd + total_mobilised * 0.3, 0),
        "provider_perspective": round(public_finance_usd, 0),
        "recipient_perspective": round(total_mobilised, 0),
        "reporting_year": datetime.now(timezone.utc).year,
        "tossd_portal_ready": bool(instruments) and any_observed_multiplier and all(
            r["multiplier_basis"] == "reported" for r in instrument_results
        ),
    }

    return {
        "entity_id": entity_id,
        "total_public_finance_usd": round(public_finance_usd, 0),
        "total_private_mobilised_usd": round(total_mobilised, 0),
        "weighted_average_multiplier": round(weighted_avg_multiplier, 2),
        "additionality_score_0_1": round(min(additionality_avg, 1.0), 3),
        "convergence_benchmark_multiplier": round(convergence_benchmark, 2),
        "vs_convergence_benchmark": "above" if weighted_avg_multiplier >= convergence_benchmark else "below",
        "multipliers_reported": any_observed_multiplier,
        "instrument_results": instrument_results,
        "tossd": tossd,
        "oecd_dac_methodology": "OECD DAC Converged Statistical Reporting Directives (2023)",
        "assessed_at": datetime.now(timezone.utc).isoformat(),
    }


def generate_climate_finance_report(
    entity_id: str,
    year: int,
    total_finance_usd: Optional[float] = None,
    adaptation_finance_usd: Optional[float] = None,
    private_mobilised_usd: Optional[float] = None,
    carbon_pricing_coverage_pct: Optional[float] = None,
    fossil_subsidies_usd_bn: Optional[float] = None,
    green_budget_tagging_adopted: Optional[bool] = None,
    grants_pct: Optional[float] = None,
    technology_finance_usd: Optional[float] = None,
    capacity_building_usd: Optional[float] = None,
    mdb_contribution_usd: Optional[float] = None,
) -> dict[str, Any]:
    """
    Builds the UNFCCC Biennial Finance Report structure from CALLER-SUPPLIED
    reported figures. Every entity-level flow is null unless provided (the
    previous version fabricated the entire headline and all section figures with
    a hash-seeded RNG). The reference blocks — $100bn commitment tracking, CPI
    2023 gap analysis, and MDB joint tracking — are genuine, data-driven and
    unchanged.
    """
    # Reported headline flows (HONEST NULL when absent).
    total_finance: Optional[float] = float(total_finance_usd) if total_finance_usd is not None else None
    adaptation: Optional[float] = float(adaptation_finance_usd) if adaptation_finance_usd is not None else None
    # Mitigation is derived only when both total and adaptation are known.
    mitigation: Optional[float] = (
        total_finance - adaptation
        if (total_finance is not None and adaptation is not None) else None
    )
    private_mobilised: Optional[float] = float(private_mobilised_usd) if private_mobilised_usd is not None else None

    # MDB contribution to private mobilisation: use reported figure if given.
    # Otherwise leave null (previously assumed a fixed 60% of a random total).
    mdb_contribution: Optional[float] = (
        float(mdb_contribution_usd) if mdb_contribution_usd is not None else None
    )

    def _r(v: Optional[float]) -> Optional[float]:
        return round(v, 0) if v is not None else None

    # UNFCCC Biennial Finance Report structure — every value is a reported input
    # or HONEST NULL.
    bfr_sections = {
        "section_1_domestic_policy": {
            "carbon_pricing_coverage_pct": (
                round(float(carbon_pricing_coverage_pct), 1) if carbon_pricing_coverage_pct is not None else None
            ),
            "fossil_subsidies_usd_bn": (
                round(float(fossil_subsidies_usd_bn), 2) if fossil_subsidies_usd_bn is not None else None
            ),
            "green_budget_tagging_adopted": (
                bool(green_budget_tagging_adopted) if green_budget_tagging_adopted is not None else None
            ),
        },
        "section_2_finance_to_developing": {
            "total_usd": _r(total_finance),
            "adaptation_usd": _r(adaptation),
            "mitigation_usd": _r(mitigation),
            "grants_pct": round(float(grants_pct), 1) if grants_pct is not None else None,
        },
        "section_3_private_mobilised": {
            "private_mobilised_usd": _r(private_mobilised),
            "mobilisation_methodology": "OECD DAC converged",
            "mdb_contribution_usd": _r(mdb_contribution),
        },
        "section_4_technology_transfer": {
            "technology_finance_usd": (
                round(float(technology_finance_usd), 0) if technology_finance_usd is not None else None
            ),
            "capacity_building_usd": (
                round(float(capacity_building_usd), 0) if capacity_building_usd is not None else None
            ),
        },
    }

    # $100bn commitment tracking (2020-2025)
    commitment_tracking = {
        "commitment_usd_bn": 100,
        "actual_2020_usd_bn": 83.3,
        "actual_2021_usd_bn": 89.6,
        "actual_2022_usd_bn": 115.9,
        "actual_2023_estimate_usd_bn": 130.0,
        "source": "OECD Climate Finance Report 2024",
        "first_achieved": 2022,
        "ncqg_successor_usd_bn": 300,
        "ncqg_target_year": 2035,
    }

    # CPI gap analysis
    cpi_gap = {
        "total_climate_finance_2023_usd_bn": CPI_2023_DATA["total_climate_finance_usd_bn"],
        "annual_need_2030_usd_bn": CPI_2023_DATA["annual_need_2030_usd_bn"],
        "gap_usd_bn": CPI_2023_DATA["annual_gap_usd_bn"],
        "gap_fill_rate_pct": round(CPI_2023_DATA["total_climate_finance_usd_bn"] / CPI_2023_DATA["annual_need_2030_usd_bn"] * 100, 1),
        "adaptation_gap_usd_bn": round(400 - CPI_2023_DATA["adaptation_usd_bn"], 0),
    }

    # MDB joint tracking — genuine: climate finance = total × climate share.
    mdb_tracking = []
    for mdb in MDB_INSTITUTIONS[:4]:
        climate_finance = mdb["total_finance_usd_bn"] * mdb["climate_share_pct"] / 100
        mdb_tracking.append({
            "mdb": mdb["name"],
            "code": mdb["code"],
            "total_finance_usd_bn": mdb["total_finance_usd_bn"],
            "climate_finance_usd_bn": round(climate_finance, 1),
            "climate_share_pct": mdb["climate_share_pct"],
            "adaptation_target_pct": mdb["adaptation_target_pct"],
            "paris_aligned_since": mdb["paris_aligned_since"],
        })

    # NCQG progress vs the $300bn/year goal — computed only when the entity's
    # reported total finance is available; otherwise HONEST NULL.
    if total_finance is not None:
        ncqg_progress: dict[str, Any] = {
            "goal_usd_bn": 300,
            "current_trajectory_usd_bn": round(total_finance / 1e9, 1),
            "gap_usd_bn": round(max(0.0, 300 - total_finance / 1e9), 1),
            "on_track": total_finance >= 100e9,
        }
    else:
        ncqg_progress = {
            "goal_usd_bn": 300,
            "current_trajectory_usd_bn": None,
            "gap_usd_bn": None,
            "on_track": None,
        }

    reported_any = any(
        v is not None for v in (total_finance, adaptation, private_mobilised)
    )

    return {
        "entity_id": entity_id,
        "reporting_year": year,
        "unfccc_biennial_finance_report": bfr_sections,
        "total_climate_finance_usd": _r(total_finance),
        "adaptation_finance_usd": _r(adaptation),
        "mitigation_finance_usd": _r(mitigation),
        "private_mobilised_usd": _r(private_mobilised),
        "reported_figures_provided": reported_any,
        "data_sufficiency_note": (
            None if reported_any
            else "No entity finance figures supplied; headline flows and NCQG "
                 "progress are null. Reference blocks (100bn tracking, CPI gap, "
                 "MDB joint tracking) reflect published data only."
        ),
        "commitment_tracking_100bn": commitment_tracking,
        "cpi_gap_analysis": cpi_gap,
        "mdb_joint_tracking": mdb_tracking,
        "ncqg_progress": ncqg_progress,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
