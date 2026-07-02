"""
Loss & Damage Finance Engine — E70
Standards: COP28 Fund for Response to Loss & Damage (FRLD, Decision 2/CP.28),
WIM Santiago Network for Averting, Minimizing and Addressing Loss and Damage,
Global Shield Against Climate Risks v2 (G7 2023), V20 Vulnerable 20 Group,
Warsaw International Mechanism (WIM 2013), Parametric Insurance Design (IAIS 2022)

Data-integrity policy (no "random-as-data"):
Every RETURNED metric is either a REAL computation from caller-supplied inputs
(threaded through optional, None-defaulting keys on the input dicts) or an
HONEST NULL (None) with an accompanying note/flag when the required input is
absent. No entity-reported figure (ND-GAIN score, GDP, realised loss, insurance
penetration, WIM capacity scores, contract sizing, exceedance probability) is
ever fabricated by a PRNG. Deterministic model calibration constants (e.g. the
non-economic-loss share, insurer loading factor, WIM function weights) are the
only non-input numbers used, and only as MODEL parameters — never as stand-ins
for entity data.
"""
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
import math

# ---------------------------------------------------------------------------
# Reference Data
# ---------------------------------------------------------------------------

V20_MEMBERS: List[str] = [
    "AFG", "BGD", "BEN", "BHU", "BFA", "KHM", "CMR", "CAF", "COD", "COG",
    "CIV", "DJI", "ETH", "FJI", "GMB", "GHA", "GTM", "GNB", "HTI", "HND",
    "KEN", "KIR", "MDG", "MWI", "MDV", "MLI", "MHL", "FSM", "MNG", "MOZ",
    "NPL", "NER", "NGA", "PAK", "PNG", "PHL", "RWA", "WSM", "SEN", "SLB",
    "SOM", "LKA", "SDN", "SYR", "TLS", "TON", "TUN", "TUV", "TZA", "UGA",
    "VUT", "VNM", "YEM", "ZMB", "ZWE", "NIC", "MAR", "SLE",
]

LOSS_EVENT_TYPES: Dict[str, Dict] = {
    "cyclone": {
        "description": "Tropical cyclone including hurricane and typhoon",
        "wim_relevance": "high",
        "economic_loss_multiplier": 3.5,
        "non_economic_share": 0.35,
        "insurance_penetration_typical": 0.25,
        "parametric_suitable": True,
        "average_return_period_yr": 15,
        "recovery_years": 5,
    },
    "flood": {
        "description": "River flooding, flash floods, coastal inundation",
        "wim_relevance": "high",
        "economic_loss_multiplier": 2.0,
        "non_economic_share": 0.25,
        "insurance_penetration_typical": 0.15,
        "parametric_suitable": True,
        "average_return_period_yr": 10,
        "recovery_years": 3,
    },
    "drought": {
        "description": "Agricultural drought, hydrological drought, water stress",
        "wim_relevance": "high",
        "economic_loss_multiplier": 1.5,
        "non_economic_share": 0.45,
        "insurance_penetration_typical": 0.08,
        "parametric_suitable": True,
        "average_return_period_yr": 8,
        "recovery_years": 2,
    },
    "sea_level_rise": {
        "description": "Permanent inundation and saltwater intrusion",
        "wim_relevance": "very_high",
        "economic_loss_multiplier": 5.0,
        "non_economic_share": 0.70,
        "insurance_penetration_typical": 0.02,
        "parametric_suitable": False,  # slow-onset
        "average_return_period_yr": None,
        "recovery_years": None,  # permanent
    },
    "slow_onset": {
        "description": "Desertification, ocean acidification, permafrost thaw, species loss",
        "wim_relevance": "very_high",
        "economic_loss_multiplier": 2.5,
        "non_economic_share": 0.80,
        "insurance_penetration_typical": 0.01,
        "parametric_suitable": False,
        "average_return_period_yr": None,
        "recovery_years": None,
    },
    "compound": {
        "description": "Concurrent/sequential events (flood + storm surge, drought + heatwave)",
        "wim_relevance": "high",
        "economic_loss_multiplier": 4.0,
        "non_economic_share": 0.40,
        "insurance_penetration_typical": 0.12,
        "parametric_suitable": True,
        "average_return_period_yr": 20,
        "recovery_years": 7,
    },
}

FRLD_ACCESS_CRITERIA: Dict[str, Dict] = {
    "sids": {
        "description": "Small Island Developing States",
        "eligibility_threshold": "UNOHRLLS SIDS list membership",
        "access_modality": "simplified_procedures",
        "indicative_annual_allocation_usd_mn": 50,
        "co_financing_requirement_pct": 0,
        "access_window": "direct",
    },
    "ldc": {
        "description": "Least Developed Countries",
        "eligibility_threshold": "UN CDP LDC list",
        "access_modality": "simplified_procedures",
        "indicative_annual_allocation_usd_mn": 30,
        "co_financing_requirement_pct": 0,
        "access_window": "direct",
    },
    "developing_country": {
        "description": "Developing countries particularly vulnerable to climate change",
        "eligibility_threshold": "ND-GAIN vulnerability score >= 0.55",
        "access_modality": "standard_procedures",
        "indicative_annual_allocation_usd_mn": 15,
        "co_financing_requirement_pct": 15,
        "access_window": "standard",
    },
}

GLOBAL_SHIELD_PILLARS: Dict[str, Dict] = {
    "pre_arranged_finance": {
        "description": "Pre-arranged financial instruments activated at trigger events",
        "instruments": ["catastrophe_bonds", "contingent_credit", "parametric_insurance", "shock_responsive_social_protection"],
        "committed_usd_bn": 9.0,
        "coverage_countries": 58,
    },
    "risk_analytics": {
        "description": "Enhanced climate risk data, modelling and early warning systems",
        "instruments": ["INFORM_risk_index", "CLIMADA_model", "WMO_early_warning", "CCRI"],
        "committed_usd_bn": 0.5,
        "coverage_countries": 120,
    },
    "technical_assistance": {
        "description": "Capacity building for DRM, actuarial skills, insurance regulation",
        "instruments": ["InsuResilience_TA", "V20_technical_facility", "regulatory_sandboxes"],
        "committed_usd_bn": 0.3,
        "coverage_countries": 80,
    },
    "knowledge_platform": {
        "description": "Global knowledge exchange on parametric insurance and risk transfer",
        "instruments": ["TCIR", "GIZ_knowledge_hub", "research_partnerships"],
        "committed_usd_bn": 0.1,
        "coverage_countries": 130,
    },
}

PARAMETRIC_TRIGGERS: Dict[str, Dict] = {
    "wind_speed_kmh": {
        "description": "Maximum sustained wind speed (1-min average)",
        "data_source": "WMO RSMC tropical cyclone bulletins",
        "typical_attachment": 89,
        "typical_exhaustion": 185,
        "unit": "km/h",
        "settlement_days": 10,
        "basis_risk_score": 0.15,
    },
    "rainfall_mm": {
        "description": "72-hour or seasonal cumulative rainfall anomaly",
        "data_source": "CHIRPS v2.0 / GPCC satellite + gauge",
        "typical_attachment": -25,
        "typical_exhaustion": -50,
        "unit": "pct_of_seasonal_mean",
        "settlement_days": 21,
        "basis_risk_score": 0.35,
    },
    "temperature_c": {
        "description": "Maximum daily temperature above seasonal threshold",
        "data_source": "ERA5 reanalysis / NMHSs",
        "typical_attachment": 2.0,
        "typical_exhaustion": 4.0,
        "unit": "degrees_C_above_baseline",
        "settlement_days": 14,
        "basis_risk_score": 0.25,
    },
    "sea_level_cm": {
        "description": "Annual mean sea level above pre-industrial baseline",
        "data_source": "PSMSL tide gauges / AVISO satellite altimetry",
        "typical_attachment": 15,
        "typical_exhaustion": 30,
        "unit": "cm",
        "settlement_days": 45,
        "basis_risk_score": 0.10,
    },
    "drought_spei": {
        "description": "Standardised Precipitation Evapotranspiration Index (SPEI-12)",
        "data_source": "Global Drought Observatory / CRU TS4",
        "typical_attachment": -1.28,
        "typical_exhaustion": -2.0,
        "unit": "SPEI_score",
        "settlement_days": 30,
        "basis_risk_score": 0.30,
    },
    "gdp_shock_pct": {
        "description": "GDP contraction trigger for compound economic shocks",
        "data_source": "IMF Article IV / national statistics",
        "typical_attachment": -5.0,
        "typical_exhaustion": -15.0,
        "unit": "pct_gdp_change",
        "settlement_days": 60,
        "basis_risk_score": 0.45,
    },
}

# ---------------------------------------------------------------------------
# Model calibration constants (MODEL parameters — NOT entity-reported data)
# ---------------------------------------------------------------------------
# Insurer loading applied to expected payout when a caller does not supply an
# explicit loading factor. Central-case gross-to-net loading for catastrophe
# risk transfer (~1.30x expected loss before basis-risk adjustment).
DEFAULT_PREMIUM_LOADING_FACTOR: float = 1.30
# Additional loading per unit of basis risk (IAIS 2022: higher basis risk
# commands a higher risk margin).
BASIS_RISK_LOADING_COEFF: float = 0.15
# WIM composite function weights (COP19 mechanism function weighting).
WIM_WEIGHT_RISK_KNOWLEDGE: float = 0.35
WIM_WEIGHT_RETENTION_TRANSFER: float = 0.35
WIM_WEIGHT_REHABILITATION: float = 0.30
# Fixed multiplier converting a 1-in-N event return-period losses to an
# expected-annual-loss basis in the FRLD screening formula (0.01 = 1% of GDP
# per unit economic-loss-multiplier at the modal return period).
FRLD_GDP_LOSS_BASE_FRACTION: float = 0.01


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _as_float(value: Any) -> Optional[float]:
    """Coerce to float, returning None for missing/blank/uncoercible inputs."""
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


# ---------------------------------------------------------------------------
# Dataclasses
# ---------------------------------------------------------------------------

@dataclass
class FRLDEligibilityResult:
    country_iso: str
    country_name: str
    eligibility_tier: str  # sids | ldc | developing_country | ineligible
    frld_eligibility_score: Optional[float]
    indicative_allocation_usd: Optional[float]
    access_window: str
    v20_member: bool
    co_financing_required_pct: float
    priority_event_types: List[str]
    wim_functions_applicable: List[str]
    estimated_annual_ld_usd: Optional[float]
    frld_coverage_ratio: Optional[float]
    data_flags: List[str] = field(default_factory=list)


@dataclass
class ParametricTriggerDesign:
    trigger_id: str
    trigger_index: str
    trigger_threshold: float
    payout_structure: str  # binary | linear | step
    attachment_point: float
    exhaustion_point: float
    max_payout_usd: Optional[float]
    premium_estimate_usd: Optional[float]
    basis_risk_score: float
    settlement_days: int
    data_source: str
    payout_at_attachment_usd: Optional[float]
    expected_annual_payout_usd: Optional[float]
    data_flags: List[str] = field(default_factory=list)


@dataclass
class WIMAccessResult:
    country_iso: str
    wim_access_score: Optional[float]
    risk_knowledge_score: Optional[float]
    retention_transfer_score: Optional[float]
    rehabilitation_score: Optional[float]
    santiago_network_eligible: bool
    capacity_needs: List[str]
    wim_action_areas: List[str]
    recommended_technical_providers: List[str]
    data_flags: List[str] = field(default_factory=list)


@dataclass
class LDGapAnalysis:
    country_iso: str
    country_name: str
    event_type: str
    total_economic_loss_usd: Optional[float]
    non_economic_loss_score: Optional[float]
    insurance_covered_usd: Optional[float]
    frld_eligible_usd: Optional[float]
    global_shield_allocation_usd: Optional[float]
    wim_support_usd: Optional[float]
    residual_ld_gap_usd: Optional[float]
    insurance_coverage_ratio: Optional[float]
    gap_financing_instruments: List[str]
    data_flags: List[str] = field(default_factory=list)


@dataclass
class LDPortfolioResult:
    portfolio_id: str
    total_portfolio_exposure_usd: Optional[float]
    total_ld_exposure_usd: Optional[float]
    v20_concentration_pct: Optional[float]
    parametric_coverage_ratio: Optional[float]
    residual_ld_gap_usd: Optional[float]
    expected_annual_ld_payout_usd: Optional[float]
    top_loss_event_types: List[str]
    uninsured_countries: List[str]
    recommendations: List[str]
    data_flags: List[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Engine Functions
# ---------------------------------------------------------------------------

def calculate_frld_eligibility(country_data: Dict[str, Any], loss_event: Dict[str, Any]) -> FRLDEligibilityResult:
    """Calculate FRLD fund eligibility and indicative allocation for a country/loss event.

    Real inputs (optional, None-safe): ``nd_gain_score`` (ND-GAIN vulnerability,
    0..1), ``gdp_usd`` (national GDP). When ``nd_gain_score`` is absent the
    eligibility score and vulnerability-weighted allocation are returned as None
    (honest null) with a data flag, since both depend on the reported
    vulnerability. When ``gdp_usd`` is absent the estimated annual L&D and
    coverage ratio are returned as None. Tier classification (sids/ldc/
    developing_country/ineligible) is deterministic from membership lists and,
    where available, the reported ND-GAIN score.
    """
    country_iso = country_data.get("country_iso", "BGD")
    data_flags: List[str] = []

    country_name = country_data.get("country_name") or country_iso
    is_sids = bool(country_data.get("is_sids", False))
    is_ldc = country_data.get("is_ldc", None)
    if is_ldc is None:
        is_ldc = country_iso in ["BGD", "ETH", "NER", "MWI", "NPL", "UGA", "TZA", "MDG",
                                 "MLI", "MOZ", "GNB", "SLE", "ZMB", "AFG", "BFA", "CAF",
                                 "COD", "DJI", "GMB", "HTI", "KHM", "KIR", "TLS", "TUV"]
    is_ldc = bool(is_ldc)

    nd_gain_score = _as_float(country_data.get("nd_gain_score"))
    if nd_gain_score is None:
        data_flags.append("nd_gain_score_missing: eligibility score and vulnerability-weighted allocation returned as null (no reported ND-GAIN vulnerability)")

    v20_member = country_iso in V20_MEMBERS

    # Tier classification. Developing-country tier requires either a reported
    # ND-GAIN score >= 0.55 or V20 membership; without a score V20 still qualifies.
    if is_sids:
        tier = "sids"
    elif is_ldc:
        tier = "ldc"
    elif (nd_gain_score is not None and nd_gain_score >= 0.55) or v20_member:
        tier = "developing_country"
    else:
        tier = "ineligible"

    criteria = FRLD_ACCESS_CRITERIA.get(tier, {})
    base_alloc = criteria.get("indicative_annual_allocation_usd_mn", 0) * 1e6

    # Indicative allocation is the tier base scaled by a deterministic
    # vulnerability multiplier. Requires the reported ND-GAIN score; null when absent.
    if nd_gain_score is not None:
        vuln_mult = 1 + (1 - nd_gain_score) * 0.5
        indicative_alloc: Optional[float] = base_alloc * vuln_mult
    else:
        indicative_alloc = None

    # Eligibility score combines tier weight, reported vulnerability, and V20
    # status. The vulnerability term is required; null when the score is absent.
    if nd_gain_score is not None:
        eligibility_score: Optional[float] = round(
            (0.3 if is_sids else 0.2 if is_ldc else 0.1 if tier == "developing_country" else 0)
            + (1 - nd_gain_score) * 0.5
            + (0.2 if v20_member else 0),
            4
        )
    else:
        eligibility_score = None

    event_type = loss_event.get("event_type", "flood")
    event_info = LOSS_EVENT_TYPES.get(event_type, LOSS_EVENT_TYPES["flood"])

    # Estimated annual L&D requires reported GDP; null when absent.
    gdp_usd = _as_float(country_data.get("gdp_usd"))
    if gdp_usd is None:
        data_flags.append("gdp_usd_missing: estimated annual L&D and FRLD coverage ratio returned as null")
        annual_ld: Optional[float] = None
        frld_coverage_ratio: Optional[float] = None
    else:
        event_multiplier = event_info["economic_loss_multiplier"]
        freq = 1 / (event_info.get("average_return_period_yr") or 25)
        annual_ld = gdp_usd * FRLD_GDP_LOSS_BASE_FRACTION * event_multiplier * freq
        if indicative_alloc is not None and annual_ld and annual_ld > 0:
            frld_coverage_ratio = min(0.80, indicative_alloc / annual_ld)
        else:
            frld_coverage_ratio = None

    wim_functions = ["risk_knowledge_function", "risk_transfer_and_retention_function"]
    if event_info["wim_relevance"] == "very_high":
        wim_functions.append("rehabilitation_function")
        wim_functions.append("santiago_network_technical_support")

    priority_events = [
        et for et, ed in LOSS_EVENT_TYPES.items()
        if ed["wim_relevance"] in ["high", "very_high"] and ed.get("insurance_penetration_typical", 0) < 0.15
    ]

    return FRLDEligibilityResult(
        country_iso=country_iso,
        country_name=country_name,
        eligibility_tier=tier,
        frld_eligibility_score=eligibility_score,
        indicative_allocation_usd=round(indicative_alloc, 2) if indicative_alloc is not None else None,
        access_window=criteria.get("access_window", "none"),
        v20_member=v20_member,
        co_financing_required_pct=criteria.get("co_financing_requirement_pct", 0),
        priority_event_types=priority_events[:3],
        wim_functions_applicable=wim_functions,
        estimated_annual_ld_usd=round(annual_ld, 2) if annual_ld is not None else None,
        frld_coverage_ratio=round(frld_coverage_ratio, 4) if frld_coverage_ratio is not None else None,
        data_flags=data_flags,
    )


def design_parametric_trigger(trigger_data: Dict[str, Any]) -> ParametricTriggerDesign:
    """Design a parametric insurance trigger with payout structure and basis risk assessment.

    Real inputs (optional, None-safe): ``max_payout_usd`` (contract limit),
    ``trigger_probability`` (annual exceedance / attachment probability of the
    index, 0..1), ``loading_factor`` (insurer gross-to-net loading multiplier).
    Basis-risk score is taken directly from the calibrated index reference data
    (deterministic). Premium and expected-payout figures require BOTH a contract
    limit and a trigger probability — when either is absent they are returned as
    null (honest) with a data flag, because premium is a real actuarial output,
    not a number to be guessed.
    """
    trigger_id = trigger_data.get("trigger_id", "default")
    data_flags: List[str] = []

    trigger_index = trigger_data.get("trigger_index", "wind_speed_kmh")
    if trigger_index not in PARAMETRIC_TRIGGERS:
        trigger_index = "wind_speed_kmh"
    ti = PARAMETRIC_TRIGGERS[trigger_index]

    attachment = _as_float(trigger_data.get("attachment_point"))
    if attachment is None:
        attachment = float(ti["typical_attachment"])
    exhaustion = _as_float(trigger_data.get("exhaustion_point"))
    if exhaustion is None:
        exhaustion = float(ti["typical_exhaustion"])

    max_payout = _as_float(trigger_data.get("max_payout_usd"))
    if max_payout is None:
        data_flags.append("max_payout_usd_missing: premium and expected-payout figures returned as null (contract limit not supplied)")

    payout_structure = trigger_data.get("payout_structure", "linear")

    # Basis risk is the calibrated index reference value (deterministic, from the
    # index data source); no random jitter.
    basis_risk = max(0.05, min(0.60, ti["basis_risk_score"]))

    # Annual trigger/attachment probability is an actuarial input. Without it the
    # loss cost (and hence premium) cannot be computed honestly.
    trigger_prob = _as_float(trigger_data.get("trigger_probability"))
    if trigger_prob is not None:
        trigger_prob = max(0.0, min(1.0, trigger_prob))
    else:
        data_flags.append("trigger_probability_missing: premium and expected-payout figures returned as null (annual exceedance probability not supplied)")

    expected_payout: Optional[float] = None
    payout_at_attach: Optional[float] = None
    premium: Optional[float] = None

    if max_payout is not None and trigger_prob is not None:
        # Loss-cost method. Payout shape depends on structure.
        if payout_structure == "binary":
            expected_payout = max_payout * trigger_prob
            payout_at_attach = max_payout
        elif payout_structure == "linear":
            # Linear payout from 0 at attachment to max at exhaustion; expected
            # severity conditional on attachment ~ 0.5 of the limit.
            expected_payout = max_payout * trigger_prob * 0.5
            payout_at_attach = 0.0
        else:  # step
            expected_payout = max_payout * trigger_prob * 0.6
            payout_at_attach = max_payout * 0.3

        # Insurer loading: caller-supplied multiplier if provided, else the
        # documented central-case loading plus a basis-risk risk margin.
        loading_input = _as_float(trigger_data.get("loading_factor"))
        if loading_input is not None:
            loading_factor = loading_input
        else:
            loading_factor = DEFAULT_PREMIUM_LOADING_FACTOR + basis_risk * BASIS_RISK_LOADING_COEFF
        premium = expected_payout * loading_factor
    elif max_payout is not None and trigger_prob is None:
        # Structure-dependent payout at attachment can still be stated from the
        # limit alone (it is a contract-design figure, not a loss estimate).
        if payout_structure == "binary":
            payout_at_attach = max_payout
        elif payout_structure == "linear":
            payout_at_attach = 0.0
        else:  # step
            payout_at_attach = max_payout * 0.3

    return ParametricTriggerDesign(
        trigger_id=str(trigger_id),
        trigger_index=trigger_index,
        trigger_threshold=attachment,
        payout_structure=payout_structure,
        attachment_point=attachment,
        exhaustion_point=exhaustion,
        max_payout_usd=round(max_payout, 2) if max_payout is not None else None,
        premium_estimate_usd=round(premium, 2) if premium is not None else None,
        basis_risk_score=round(basis_risk, 4),
        settlement_days=ti["settlement_days"],
        data_source=ti["data_source"],
        payout_at_attachment_usd=round(payout_at_attach, 2) if payout_at_attach is not None else None,
        expected_annual_payout_usd=round(expected_payout, 2) if expected_payout is not None else None,
        data_flags=data_flags,
    )


def assess_wim_access(country_data: Dict[str, Any]) -> WIMAccessResult:
    """Assess WIM function scores and Santiago Network eligibility.

    Real inputs (optional, None-safe, each 0..1): ``risk_knowledge_score``,
    ``retention_transfer_score``, ``rehabilitation_score`` — reported WIM
    function capacity indicators. Each is an entity-reported figure and is
    returned as None (honest null) when not supplied; the composite WIM access
    score is computed only from the sub-scores that are present (re-normalised
    weights), or None if none are supplied. Capacity-need and action-area
    recommendations are driven only by sub-scores that are actually reported.
    Santiago Network eligibility falls back to structural vulnerability
    (V20/LDC/SIDS) when the composite score is unavailable.
    """
    country_iso = country_data.get("country_iso", "FJI")
    data_flags: List[str] = []

    v20 = country_iso in V20_MEMBERS

    risk_knowledge = _as_float(country_data.get("risk_knowledge_score"))
    retention_transfer = _as_float(country_data.get("retention_transfer_score"))
    rehabilitation = _as_float(country_data.get("rehabilitation_score"))

    def _clamp01(v: Optional[float]) -> Optional[float]:
        return None if v is None else max(0.0, min(1.0, v))

    risk_knowledge = _clamp01(risk_knowledge)
    retention_transfer = _clamp01(retention_transfer)
    rehabilitation = _clamp01(rehabilitation)

    missing = [name for name, v in (
        ("risk_knowledge_score", risk_knowledge),
        ("retention_transfer_score", retention_transfer),
        ("rehabilitation_score", rehabilitation),
    ) if v is None]
    if missing:
        data_flags.append(
            "wim_function_scores_missing: " + ", ".join(missing) +
            " not supplied; composite computed from reported sub-scores only (null if none reported)"
        )

    # Composite over reported sub-scores only, with re-normalised weights.
    weighted_sum = 0.0
    weight_total = 0.0
    for value, weight in (
        (risk_knowledge, WIM_WEIGHT_RISK_KNOWLEDGE),
        (retention_transfer, WIM_WEIGHT_RETENTION_TRANSFER),
        (rehabilitation, WIM_WEIGHT_REHABILITATION),
    ):
        if value is not None:
            weighted_sum += value * weight
            weight_total += weight
    wim_score: Optional[float] = round(weighted_sum / weight_total, 4) if weight_total > 0 else None

    structurally_vulnerable = bool(v20 or country_data.get("is_ldc", False) or country_data.get("is_sids", False))
    if wim_score is not None:
        santiago_eligible = wim_score < 0.65 and structurally_vulnerable
    else:
        # No reported capacity scores — fall back to structural eligibility.
        santiago_eligible = structurally_vulnerable

    capacity_needs: List[str] = []
    if risk_knowledge is not None and risk_knowledge < 0.50:
        capacity_needs.append("Climate risk data collection and INFORM methodology training")
    if retention_transfer is not None and retention_transfer < 0.45:
        capacity_needs.append("Parametric insurance market development — actuarial and regulatory capacity")
    if rehabilitation is not None and rehabilitation < 0.45:
        capacity_needs.append("Post-disaster recovery financing frameworks (PDNA standards)")
    if wim_score is not None and wim_score < 0.40:
        capacity_needs.append("Comprehensive DRM institutional strengthening")

    action_areas = [
        "WIM Action Area 7: Non-economic loss and damage",
        "WIM Action Area 8: Risk transfer and insurance",
    ]
    if risk_knowledge is not None and risk_knowledge < 0.55:
        action_areas.append("WIM Action Area 1: Risk knowledge, early warning, risk information")
    if rehabilitation is not None and rehabilitation < 0.50:
        action_areas.append("WIM Action Area 6: Rehabilitation, recovery and reintegration")

    providers = ["UNDP CREWS", "InsuResilience Global Partnership", "V20 TF", "World Bank GFDRR"]
    if santiago_eligible:
        providers.insert(0, "Santiago Network Technical Assistance (SNLD)")

    return WIMAccessResult(
        country_iso=country_iso,
        wim_access_score=wim_score,
        risk_knowledge_score=risk_knowledge,
        retention_transfer_score=retention_transfer,
        rehabilitation_score=rehabilitation,
        santiago_network_eligible=santiago_eligible,
        capacity_needs=capacity_needs,
        wim_action_areas=action_areas,
        recommended_technical_providers=providers,
        data_flags=data_flags,
    )


def calculate_residual_ld_gap(country_data: Dict[str, Any], coverage_data: Dict[str, Any]) -> LDGapAnalysis:
    """Calculate total L&D and residual gap after insurance, FRLD, and WIM support.

    Real inputs (optional, None-safe): ``total_economic_loss_usd`` (realised or
    modelled event loss) OR ``gdp_usd`` + ``loss_pct_gdp`` (from which the loss is
    computed); ``non_economic_loss_score`` (0..1 reported); ``insurance_penetration``,
    ``frld_share``, ``global_shield_share``, ``wim_support_share`` (coverage
    fractions, 0..1). When the total economic loss cannot be established from
    inputs, ALL monetary coverage components and the residual gap are returned as
    null (honest) with a data flag — no loss is fabricated. Coverage fractions
    default to the calibrated event-type reference penetration (insurance) or 0
    (FRLD / Global Shield / WIM) rather than random draws.
    """
    country_iso = country_data.get("country_iso", "PHL")
    data_flags: List[str] = []

    country_name = country_data.get("country_name") or country_iso
    event_type = country_data.get("event_type", "cyclone")
    event_info = LOSS_EVENT_TYPES.get(event_type, LOSS_EVENT_TYPES["cyclone"])

    # Total economic loss: prefer an explicit reported figure, else derive from
    # reported GDP and a reported loss-%-of-GDP. No random fallback.
    total_economic_loss = _as_float(country_data.get("total_economic_loss_usd"))
    if total_economic_loss is None:
        gdp = _as_float(country_data.get("gdp_usd"))
        loss_pct_gdp = _as_float(country_data.get("loss_pct_gdp"))
        if gdp is not None and loss_pct_gdp is not None:
            total_economic_loss = gdp * loss_pct_gdp / 100
        else:
            data_flags.append(
                "loss_input_missing: supply total_economic_loss_usd, or gdp_usd + loss_pct_gdp; "
                "all monetary coverage components and residual gap returned as null"
            )

    # Non-economic loss score: reported input only (null when absent).
    non_economic_score = _as_float(country_data.get("non_economic_loss_score"))
    if non_economic_score is not None:
        non_economic_score = round(max(0.0, min(2.0, non_economic_score)), 4)
    else:
        data_flags.append("non_economic_loss_score_missing: non-economic loss returned as null")

    # Insurance penetration: reported input, else the calibrated event-type
    # reference penetration (deterministic reference value, not a random draw).
    ins_penetration = _as_float(coverage_data.get("insurance_penetration"))
    if ins_penetration is None:
        ins_penetration = event_info["insurance_penetration_typical"]
    ins_penetration = max(0.0, min(0.95, ins_penetration))

    # Support/coverage fractions: reported inputs, else 0 (no assumed coverage).
    frld_share = _as_float(coverage_data.get("frld_share"))
    if frld_share is None:
        frld_share = 0.0
    frld_share = max(0.0, min(1.0, frld_share))

    gs_covered = coverage_data.get("global_shield_covered", None)
    global_shield_share = _as_float(coverage_data.get("global_shield_share"))
    if global_shield_share is None:
        global_shield_share = 0.0
    global_shield_share = max(0.0, min(1.0, global_shield_share))
    if gs_covered is False:
        global_shield_share = 0.0

    wim_support_share = _as_float(coverage_data.get("wim_support_share"))
    if wim_support_share is None:
        wim_support_share = 0.0
    wim_support_share = max(0.0, min(1.0, wim_support_share))

    if total_economic_loss is None:
        insurance_covered: Optional[float] = None
        frld_eligible: Optional[float] = None
        global_shield: Optional[float] = None
        wim_support: Optional[float] = None
        residual_gap: Optional[float] = None
        coverage_ratio: Optional[float] = None
    else:
        insurance_covered = total_economic_loss * ins_penetration
        frld_eligible = total_economic_loss * frld_share
        global_shield = total_economic_loss * global_shield_share
        wim_support = total_economic_loss * wim_support_share
        residual_gap = max(0.0, total_economic_loss - insurance_covered - frld_eligible - global_shield - wim_support)
        coverage_ratio = round((total_economic_loss - residual_gap) / total_economic_loss, 4) if total_economic_loss else None

    gap_instruments: List[str] = []
    if residual_gap is not None and residual_gap > 1e8:
        gap_instruments.append("Sovereign catastrophe bond")
        gap_instruments.append("IMF RST contingent credit line")
    if residual_gap is not None and residual_gap > 5e8:
        gap_instruments.append("Paris Club CDPC clause")
        gap_instruments.append("Debt-for-Nature swap with conservation fund")
    if event_info["parametric_suitable"]:
        gap_instruments.append(f"Parametric {event_type} trigger insurance (IAIS 2022 framework)")
    gap_instruments.append("FRLD simplified access grant window (Decision 2/CP.28)")

    return LDGapAnalysis(
        country_iso=country_iso,
        country_name=country_name,
        event_type=event_type,
        total_economic_loss_usd=round(total_economic_loss, 2) if total_economic_loss is not None else None,
        non_economic_loss_score=non_economic_score,
        insurance_covered_usd=round(insurance_covered, 2) if insurance_covered is not None else None,
        frld_eligible_usd=round(frld_eligible, 2) if frld_eligible is not None else None,
        global_shield_allocation_usd=round(global_shield, 2) if global_shield is not None else None,
        wim_support_usd=round(wim_support, 2) if wim_support is not None else None,
        residual_ld_gap_usd=round(residual_gap, 2) if residual_gap is not None else None,
        insurance_coverage_ratio=coverage_ratio,
        gap_financing_instruments=gap_instruments,
        data_flags=data_flags,
    )


def aggregate_ld_portfolio(portfolio: Dict[str, Any]) -> LDPortfolioResult:
    """Aggregate L&D exposure and coverage metrics across a multi-country portfolio.

    Real inputs (optional, None-safe): ``total_aum_usd`` (portfolio size);
    per-holding ``country_iso``, ``exposure_usd`` (required per holding — a
    holding without a reported exposure is skipped and flagged rather than
    fabricated), ``dominant_event_type``, and optional ``ld_rate`` /
    ``insurance_penetration`` overrides. When per-holding L&D rate or insurance
    penetration are not supplied they default to calibrated event-type reference
    values (deterministic), NOT random draws. Ratios against portfolio size are
    computed only when a portfolio size is available or can be summed from
    holdings; otherwise ratio metrics are null.
    """
    portfolio_id = portfolio.get("portfolio_id", "default")
    data_flags: List[str] = []

    holdings = portfolio.get("holdings") or []

    total_ld = 0.0
    v20_exposure = 0.0
    parametric_covered = 0.0
    residual_gap = 0.0
    expected_payout = 0.0
    loss_event_counts: Dict[str, int] = {}
    uninsured: List[str] = []
    summed_exposure = 0.0
    valued_holdings = 0
    skipped_holdings = 0

    for h in holdings:
        iso = h.get("country_iso", "")
        exp = _as_float(h.get("exposure_usd"))
        if exp is None:
            # No reported exposure — cannot be fabricated; skip and flag.
            skipped_holdings += 1
            continue
        valued_holdings += 1
        summed_exposure += exp

        event_type = h.get("dominant_event_type")
        if event_type not in LOSS_EVENT_TYPES:
            # Deterministic default (most common insured peril) rather than a
            # random choice; flag the substitution.
            if event_type is not None:
                data_flags.append(f"holding {iso or '?'}: unknown dominant_event_type '{event_type}' -> defaulted to 'flood'")
            event_type = "flood"
        event_info = LOSS_EVENT_TYPES[event_type]

        # Per-holding L&D rate: reported override, else calibrated deterministic
        # baseline from the event-type economic-loss multiplier (annualised).
        ld_rate = _as_float(h.get("ld_rate"))
        if ld_rate is None:
            ret = event_info.get("average_return_period_yr") or 25
            ld_rate = FRLD_GDP_LOSS_BASE_FRACTION * event_info["economic_loss_multiplier"] * (1 / ret)
        ld = exp * ld_rate
        total_ld += ld

        if iso in V20_MEMBERS:
            v20_exposure += exp

        # Insurance penetration: reported override, else calibrated reference.
        ins_pen = _as_float(h.get("insurance_penetration"))
        if ins_pen is None:
            ins_pen = event_info["insurance_penetration_typical"]
        ins_pen = max(0.0, min(0.8, ins_pen))

        par_cov = exp * ins_pen if event_info["parametric_suitable"] else 0.0
        parametric_covered += par_cov

        # Residual gap = uninsured share of modelled L&D (deterministic).
        res_gap = ld * (1 - ins_pen)
        residual_gap += res_gap

        # Expected annual payout = insured share of modelled L&D (deterministic).
        ann_payout = ld * ins_pen
        expected_payout += ann_payout

        loss_event_counts[event_type] = loss_event_counts.get(event_type, 0) + 1

        if ins_pen < 0.05:
            uninsured.append(iso)

    if skipped_holdings:
        data_flags.append(f"{skipped_holdings} holding(s) skipped: missing exposure_usd (not fabricated)")

    # Portfolio size: reported total, else the sum of valued holdings.
    total_exposure = _as_float(portfolio.get("total_aum_usd"))
    if total_exposure is None:
        if summed_exposure > 0:
            total_exposure = summed_exposure
        else:
            data_flags.append("portfolio_size_missing: supply total_aum_usd or per-holding exposure_usd; ratio metrics returned as null")

    top_events = sorted(loss_event_counts.items(), key=lambda x: x[1], reverse=True)[:3]
    top_event_types = [e[0] for e in top_events]

    if total_exposure and total_exposure > 0:
        parametric_coverage_ratio: Optional[float] = parametric_covered / total_exposure
        v20_concentration: Optional[float] = v20_exposure / total_exposure
    else:
        parametric_coverage_ratio = None
        v20_concentration = None

    recommendations: List[str] = []
    if v20_concentration is not None and v20_concentration > 0.40:
        recommendations.append("High V20 concentration — consider Global Shield portfolio insurance facility")
    if parametric_coverage_ratio is not None and parametric_coverage_ratio < 0.30:
        recommendations.append("Increase parametric coverage; target 30%+ per IAIS 2022 guidance")
    if len(uninsured) > 3:
        recommendations.append(f"{len(uninsured)} countries uninsured — engage InsuResilience for structured solutions")
    if total_ld > 0 and (residual_gap / total_ld) > 0.50:
        recommendations.append("Residual L&D gap >50% — pursue FRLD grants and IMF RST for top exposures")
    recommendations.append("Integrate WIM Santiago Network TA for capacity building in uninsured markets")

    have_data = valued_holdings > 0
    return LDPortfolioResult(
        portfolio_id=portfolio_id,
        total_portfolio_exposure_usd=round(total_exposure, 2) if total_exposure is not None else None,
        total_ld_exposure_usd=round(total_ld, 2) if have_data else None,
        v20_concentration_pct=round(v20_concentration * 100, 2) if v20_concentration is not None else None,
        parametric_coverage_ratio=round(parametric_coverage_ratio, 4) if parametric_coverage_ratio is not None else None,
        residual_ld_gap_usd=round(residual_gap, 2) if have_data else None,
        expected_annual_ld_payout_usd=round(expected_payout, 2) if have_data else None,
        top_loss_event_types=top_event_types,
        uninsured_countries=uninsured[:10],
        recommendations=recommendations,
        data_flags=data_flags,
    )
