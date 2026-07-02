"""
Climate-Linked Sovereign Debt Engine — E69
Standards: Climate Resilience Debt Clauses (CRDC, Commonwealth Secretariat 2022),
Debt-for-Nature Swaps (DfN, IMF/World Bank 2023), IMF Resilience & Sustainability Trust,
Paris Club MOU on Climate 2021, SIDS Vulnerability Index (UN-OHRLLS),
Catastrophe-Deferred Payment Clauses (CDPC)
"""
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
import math

# ---------------------------------------------------------------------------
# Model calibration constants (documented model parameters — NOT entity data).
# These are deterministic structuring assumptions used only when the caller does
# not supply a real deal-specific value. They are flagged in each result via the
# `assumptions`/`data_flags` fields so consumers know a metric is model-derived
# rather than sourced from the specific transaction.
# ---------------------------------------------------------------------------

# CRDC (Climate Resilience Debt Clause) structuring defaults
DEFAULT_ANNUAL_DEBT_SERVICE_RATE = 0.06   # ~6% of principal p.a. (coupon + amortisation midpoint)
DEFAULT_CRDC_DEFERRAL_FRACTION = 0.30     # 20-40% of debt service typically deferred; midpoint
DEFAULT_CRDC_STRUCTURING_COST_RATE = 0.003  # legal/structuring cost ~30bps of principal
DEFAULT_BASE_RETURN_PERIOD_YEARS = 15.0   # base climate-event return period before vulnerability scaling

# Debt-for-Nature swap structuring defaults
DEFAULT_DFN_SWAP_SHARE = 0.10             # share of eligible debt typically restructured via swap
DEFAULT_CO2_SEQUESTRATION_INTENSITY = 100.0  # tCO2/yr per USD 1mn conservation fund (nature-based midpoint)
DEFAULT_MDB_GUARANTEE_COVERAGE = 0.50    # MDB guarantee as fraction of conservation fund (when MDB involved)
DEFAULT_CARBON_PRICE_USD_PER_TCO2 = 20.0  # nature-based carbon credit price midpoint (VCS/GS range)

# IMF RST / portfolio model defaults
DEFAULT_PORTFOLIO_CLIMATE_VAR_LOSS_FACTOR = 0.10  # loss-given-stress factor applied to vuln-weighted exposure

# ---------------------------------------------------------------------------
# Reference Data
# ---------------------------------------------------------------------------

SIDS_LIST: Dict[str, Dict] = {
    "ATG": {"name": "Antigua and Barbuda", "vulnerability_score": 0.78, "region": "Caribbean", "gdp_usd_bn": 1.7},
    "BHS": {"name": "Bahamas", "vulnerability_score": 0.71, "region": "Caribbean", "gdp_usd_bn": 12.0},
    "BRB": {"name": "Barbados", "vulnerability_score": 0.74, "region": "Caribbean", "gdp_usd_bn": 5.0},
    "BLZ": {"name": "Belize", "vulnerability_score": 0.70, "region": "Caribbean", "gdp_usd_bn": 2.5},
    "COM": {"name": "Comoros", "vulnerability_score": 0.85, "region": "Indian Ocean", "gdp_usd_bn": 1.3},
    "CPV": {"name": "Cape Verde", "vulnerability_score": 0.76, "region": "Atlantic", "gdp_usd_bn": 2.0},
    "CUB": {"name": "Cuba", "vulnerability_score": 0.62, "region": "Caribbean", "gdp_usd_bn": 107.0},
    "DMA": {"name": "Dominica", "vulnerability_score": 0.82, "region": "Caribbean", "gdp_usd_bn": 0.6},
    "DOM": {"name": "Dominican Republic", "vulnerability_score": 0.65, "region": "Caribbean", "gdp_usd_bn": 94.0},
    "FJI": {"name": "Fiji", "vulnerability_score": 0.77, "region": "Pacific", "gdp_usd_bn": 4.6},
    "GRD": {"name": "Grenada", "vulnerability_score": 0.79, "region": "Caribbean", "gdp_usd_bn": 1.2},
    "GNB": {"name": "Guinea-Bissau", "vulnerability_score": 0.88, "region": "Atlantic", "gdp_usd_bn": 1.7},
    "GUY": {"name": "Guyana", "vulnerability_score": 0.68, "region": "Caribbean", "gdp_usd_bn": 15.0},
    "HTI": {"name": "Haiti", "vulnerability_score": 0.92, "region": "Caribbean", "gdp_usd_bn": 21.0},
    "JAM": {"name": "Jamaica", "vulnerability_score": 0.72, "region": "Caribbean", "gdp_usd_bn": 17.0},
    "KIR": {"name": "Kiribati", "vulnerability_score": 0.95, "region": "Pacific", "gdp_usd_bn": 0.2},
    "MDV": {"name": "Maldives", "vulnerability_score": 0.90, "region": "Indian Ocean", "gdp_usd_bn": 5.7},
    "MHL": {"name": "Marshall Islands", "vulnerability_score": 0.93, "region": "Pacific", "gdp_usd_bn": 0.3},
    "MUS": {"name": "Mauritius", "vulnerability_score": 0.60, "region": "Indian Ocean", "gdp_usd_bn": 13.0},
    "FSM": {"name": "Micronesia", "vulnerability_score": 0.87, "region": "Pacific", "gdp_usd_bn": 0.4},
    "NRU": {"name": "Nauru", "vulnerability_score": 0.85, "region": "Pacific", "gdp_usd_bn": 0.1},
    "NIU": {"name": "Niue", "vulnerability_score": 0.82, "region": "Pacific", "gdp_usd_bn": 0.02},
    "PLW": {"name": "Palau", "vulnerability_score": 0.80, "region": "Pacific", "gdp_usd_bn": 0.3},
    "PNG": {"name": "Papua New Guinea", "vulnerability_score": 0.75, "region": "Pacific", "gdp_usd_bn": 30.0},
    "LCA": {"name": "Saint Lucia", "vulnerability_score": 0.78, "region": "Caribbean", "gdp_usd_bn": 2.3},
    "VCT": {"name": "Saint Vincent & Grenadines", "vulnerability_score": 0.80, "region": "Caribbean", "gdp_usd_bn": 0.9},
    "WSM": {"name": "Samoa", "vulnerability_score": 0.81, "region": "Pacific", "gdp_usd_bn": 0.8},
    "STP": {"name": "Sao Tome & Principe", "vulnerability_score": 0.84, "region": "Atlantic", "gdp_usd_bn": 0.5},
    "SYC": {"name": "Seychelles", "vulnerability_score": 0.65, "region": "Indian Ocean", "gdp_usd_bn": 1.6},
    "SLB": {"name": "Solomon Islands", "vulnerability_score": 0.88, "region": "Pacific", "gdp_usd_bn": 1.6},
    "SUR": {"name": "Suriname", "vulnerability_score": 0.70, "region": "Caribbean", "gdp_usd_bn": 3.6},
    "TLS": {"name": "Timor-Leste", "vulnerability_score": 0.80, "region": "Pacific", "gdp_usd_bn": 3.1},
    "TON": {"name": "Tonga", "vulnerability_score": 0.86, "region": "Pacific", "gdp_usd_bn": 0.5},
    "TTO": {"name": "Trinidad and Tobago", "vulnerability_score": 0.58, "region": "Caribbean", "gdp_usd_bn": 23.0},
    "TUV": {"name": "Tuvalu", "vulnerability_score": 0.97, "region": "Pacific", "gdp_usd_bn": 0.06},
    "VUT": {"name": "Vanuatu", "vulnerability_score": 0.89, "region": "Pacific", "gdp_usd_bn": 1.0},
    "VEN": {"name": "Venezuela", "vulnerability_score": 0.68, "region": "Caribbean", "gdp_usd_bn": 98.0},
    "MDG": {"name": "Madagascar", "vulnerability_score": 0.83, "region": "Indian Ocean", "gdp_usd_bn": 15.0},
    "MOZ": {"name": "Mozambique", "vulnerability_score": 0.86, "region": "Indian Ocean", "gdp_usd_bn": 16.0},
}

IMF_RST_ELIGIBILITY: Dict[str, Dict] = {
    "BHS": {"access_limit_pct_quota": 150, "reform_area": "climate_resilience", "approved": True},
    "BRB": {"access_limit_pct_quota": 150, "reform_area": "climate_resilience", "approved": True},
    "CRI": {"access_limit_pct_quota": 150, "reform_area": "climate_resilience", "approved": True},
    "ECU": {"access_limit_pct_quota": 150, "reform_area": "climate_resilience", "approved": False},
    "EGY": {"access_limit_pct_quota": 150, "reform_area": "energy_transition", "approved": True},
    "FJI": {"access_limit_pct_quota": 150, "reform_area": "climate_resilience", "approved": True},
    "GHA": {"access_limit_pct_quota": 150, "reform_area": "climate_resilience", "approved": False},
    "JAM": {"access_limit_pct_quota": 150, "reform_area": "climate_resilience", "approved": True},
    "KEN": {"access_limit_pct_quota": 150, "reform_area": "climate_resilience", "approved": True},
    "MDV": {"access_limit_pct_quota": 150, "reform_area": "climate_resilience", "approved": True},
    "MAR": {"access_limit_pct_quota": 150, "reform_area": "energy_transition", "approved": True},
    "MUS": {"access_limit_pct_quota": 150, "reform_area": "climate_resilience", "approved": True},
    "MNG": {"access_limit_pct_quota": 150, "reform_area": "climate_resilience", "approved": False},
    "NIC": {"access_limit_pct_quota": 150, "reform_area": "climate_resilience", "approved": False},
    "NGA": {"access_limit_pct_quota": 150, "reform_area": "energy_transition", "approved": False},
    "PAK": {"access_limit_pct_quota": 150, "reform_area": "climate_resilience", "approved": True},
    "PNG": {"access_limit_pct_quota": 150, "reform_area": "climate_resilience", "approved": False},
    "PHL": {"access_limit_pct_quota": 150, "reform_area": "climate_resilience", "approved": True},
    "RWA": {"access_limit_pct_quota": 150, "reform_area": "climate_resilience", "approved": True},
    "SEN": {"access_limit_pct_quota": 150, "reform_area": "climate_resilience", "approved": True},
    "LCA": {"access_limit_pct_quota": 150, "reform_area": "climate_resilience", "approved": True},
    "TZA": {"access_limit_pct_quota": 150, "reform_area": "climate_resilience", "approved": True},
    "TTO": {"access_limit_pct_quota": 150, "reform_area": "energy_transition", "approved": True},
    "UGA": {"access_limit_pct_quota": 150, "reform_area": "climate_resilience", "approved": True},
    "URY": {"access_limit_pct_quota": 150, "reform_area": "climate_resilience", "approved": True},
    "ZMB": {"access_limit_pct_quota": 150, "reform_area": "climate_resilience", "approved": False},
}

CRDC_TRIGGER_TYPES: Dict[str, Dict] = {
    "cyclone_wind_speed": {
        "description": "Tropical cyclone maximum sustained wind speed",
        "unit": "km/h",
        "typical_threshold": 119,  # Category 1 threshold
        "deferred_period_months": 24,
        "source": "WMO / National Met Services",
        "basis_risk": "low",
    },
    "rainfall_deficit": {
        "description": "Cumulative rainfall below seasonal mean (drought trigger)",
        "unit": "mm",
        "typical_threshold": -30,  # 30% below seasonal mean
        "deferred_period_months": 12,
        "source": "CHIRPS / GPCP satellite data",
        "basis_risk": "medium",
    },
    "temperature_anomaly": {
        "description": "Annual average temperature deviation above baseline",
        "unit": "degrees_C",
        "typical_threshold": 1.5,
        "deferred_period_months": 12,
        "source": "HadCRUT5 / NOAA",
        "basis_risk": "medium",
    },
    "sea_level": {
        "description": "Annual mean sea level above pre-industrial baseline",
        "unit": "cm",
        "typical_threshold": 20,
        "deferred_period_months": 36,
        "source": "PSMSL tide gauge / satellite altimetry",
        "basis_risk": "low",
    },
    "drought_index": {
        "description": "Standardised Precipitation-Evapotranspiration Index (SPEI-12)",
        "unit": "SPEI_score",
        "typical_threshold": -1.5,  # Severe drought
        "deferred_period_months": 18,
        "source": "Global Drought Observatory",
        "basis_risk": "medium-high",
    },
}

DFN_SWAP_FRAMEWORKS: Dict[str, Dict] = {
    "bilateral": {
        "description": "Creditor government to debtor swap with conservation earmark",
        "precedents": ["Seychelles 2016 (TNC/NatWest)", "Belize 2021 (TNC)"],
        "discount_range_pct": [15, 40],
        "conservation_commitment_min_pct_gdp": 1.0,
        "mdb_involvement": False,
        "typical_size_usd_mn": [50, 500],
        "carbon_credit_linkage": False,
    },
    "multilateral": {
        "description": "IMF/World Bank facilitated swap with policy conditionality",
        "precedents": ["Ecuador 2023 (Galapagos)", "Sri Lanka ongoing"],
        "discount_range_pct": [20, 50],
        "conservation_commitment_min_pct_gdp": 1.5,
        "mdb_involvement": True,
        "typical_size_usd_mn": [200, 2000],
        "carbon_credit_linkage": True,
    },
    "commercial": {
        "description": "Commercial bank debt restructured through conservation trust",
        "precedents": ["Seychelles 2015 (DBSA)"],
        "discount_range_pct": [10, 25],
        "conservation_commitment_min_pct_gdp": 0.5,
        "mdb_involvement": False,
        "typical_size_usd_mn": [20, 200],
        "carbon_credit_linkage": False,
    },
    "paris_club": {
        "description": "Paris Club bilateral creditor group climate MOU debt treatment",
        "precedents": ["MOU on Climate 2021 (G7)"],
        "discount_range_pct": [5, 20],
        "conservation_commitment_min_pct_gdp": 0.5,
        "mdb_involvement": True,
        "typical_size_usd_mn": [100, 5000],
        "carbon_credit_linkage": True,
    },
}

PARIS_CLUB_CATEGORIES: Dict[str, Dict] = {
    "poorest": {
        "description": "IDA-eligible, HIPC countries — most concessional treatment",
        "per_capita_gni_threshold_usd": 1135,
        "debt_service_relief_pct": 90,
        "climate_conditionality": "NDC_update + NbS_commitment",
        "cutoff_date_policy": "pre_cutoff_only",
    },
    "vulnerable_middle_income": {
        "description": "Middle income with high climate vulnerability (MVI or SIDS)",
        "per_capita_gni_threshold_usd": 4465,
        "debt_service_relief_pct": 50,
        "climate_conditionality": "CRDC_incorporation + climate_action_plan",
        "cutoff_date_policy": "case_by_case",
    },
    "standard": {
        "description": "Standard Paris Club debtor terms with climate addendum",
        "per_capita_gni_threshold_usd": 99999,
        "debt_service_relief_pct": 20,
        "climate_conditionality": "voluntary_CRDC",
        "cutoff_date_policy": "post_cutoff_eligible",
    },
}

# ---------------------------------------------------------------------------
# Dataclasses
# ---------------------------------------------------------------------------

@dataclass
class CRDCAssessment:
    country_iso: str
    country_name: str
    debt_amount_usd: Optional[float]
    crdc_eligible: bool
    trigger_type: str
    trigger_threshold: float
    trigger_probability_pct: float
    deferred_amount_usd: Optional[float]
    deferred_period_months: int
    basis_risk_rating: str
    climate_event_return_period_years: float
    debt_relief_score: float
    implementation_cost_usd: Optional[float]
    recommendations: List[str]
    data_flags: List[str] = field(default_factory=list)


@dataclass
class DebtForNatureResult:
    country_iso: str
    country_name: str
    total_debt_usd: Optional[float]
    swap_framework: str
    swap_amount_usd: Optional[float]
    discount_pct: float
    conservation_fund_usd: Optional[float]
    conservation_commitment_text: str
    co2_sequestration_tco2_yr: Optional[float]
    mdb_guarantee_usd: Optional[float]
    carbon_credit_revenue_usd_yr: Optional[float]
    biodiversity_targets: List[str]
    imf_rst_linkage: bool
    net_debt_reduction_usd: Optional[float]
    data_flags: List[str] = field(default_factory=list)


@dataclass
class IMFRSTAssessment:
    country_iso: str
    rst_eligible: bool
    access_limit_pct_quota: float
    reform_area: str
    resilience_score: Optional[float]
    reform_measures: List[str]
    indicative_drawing_usd: Optional[float]
    conditionality_met: bool
    disbursement_timeline: str
    data_flags: List[str] = field(default_factory=list)


@dataclass
class SIDSVulnerabilityResult:
    country_iso: str
    country_name: str
    vulnerability_score: float
    vulnerability_tier: str  # critical | high | medium
    inform_component: float
    nd_gain_component: float
    fiscal_resilience_component: float
    cdpc_eligible: bool
    cdpc_deferred_pct: float
    paris_club_category: str
    climate_debt_relief_score: float
    priority_interventions: List[str]
    data_flags: List[str] = field(default_factory=list)


@dataclass
class SovereignClimatePortfolioResult:
    portfolio_id: str
    total_sovereign_exposure_usd: Optional[float]
    climate_adjusted_exposure_usd: Optional[float]
    weighted_vulnerability_score: Optional[float]
    weighted_debt_relief_score: Optional[float]
    crdc_eligible_exposure_usd: float
    dfn_eligible_exposure_usd: float
    sids_exposure_pct: float
    high_risk_country_concentration: float
    portfolio_climate_var_usd: Optional[float]
    recommendations: List[str]
    data_flags: List[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Engine Functions
# ---------------------------------------------------------------------------

def assess_crdc_eligibility(country_data: Dict[str, Any], debt_terms: Dict[str, Any]) -> CRDCAssessment:
    """Assess eligibility and design of Climate Resilience Debt Clauses.

    Entity-specific figures (debt principal) are honest nulls when the caller does
    not supply them. Structuring fractions (debt-service rate, deferral fraction,
    structuring cost rate) accept caller inputs and otherwise fall back to
    documented model constants that are flagged in `data_flags`.
    """
    country_iso = country_data.get("country_iso", "MDV")

    country_name = country_data.get("country_name") or SIDS_LIST.get(country_iso, {}).get("name", country_iso)
    trigger_type = debt_terms.get("trigger_type", "cyclone_wind_speed")
    if trigger_type not in CRDC_TRIGGER_TYPES:
        trigger_type = "cyclone_wind_speed"

    trigger_info = CRDC_TRIGGER_TYPES[trigger_type]
    trigger_threshold = float(debt_terms.get("trigger_threshold") or trigger_info["typical_threshold"])

    data_flags: List[str] = []

    # Debt principal: real entity figure — honest null if not supplied by caller.
    _debt_in = debt_terms.get("debt_amount_usd")
    debt_amount: Optional[float] = float(_debt_in) if _debt_in is not None else None
    if debt_amount is None:
        data_flags.append("debt_amount_usd: no caller-supplied principal — dependent USD figures returned as null")

    # Climate-event return period: derived deterministically from vulnerability.
    # base_return_period scaled by (1 - vuln); more vulnerable => shorter return period.
    vuln_score = SIDS_LIST.get(country_iso, {}).get("vulnerability_score", 0.70)
    base_return_period = float(debt_terms.get("base_return_period_years") or DEFAULT_BASE_RETURN_PERIOD_YEARS)
    if debt_terms.get("base_return_period_years") is None:
        data_flags.append(
            f"return_period: base {DEFAULT_BASE_RETURN_PERIOD_YEARS}yr model constant scaled by vulnerability"
        )
    return_period = max(1.0, base_return_period * (1 - vuln_score + 0.2))
    trigger_prob_pct = round(100 / return_period, 2)

    # Structuring fractions: caller inputs preferred, else documented model constants.
    ds_rate = debt_terms.get("annual_debt_service_rate")
    if ds_rate is None:
        ds_rate = DEFAULT_ANNUAL_DEBT_SERVICE_RATE
        data_flags.append(f"annual_debt_service_rate: model constant {DEFAULT_ANNUAL_DEBT_SERVICE_RATE}")
    ds_rate = float(ds_rate)

    deferred_pct = debt_terms.get("deferred_fraction")
    if deferred_pct is None:
        deferred_pct = DEFAULT_CRDC_DEFERRAL_FRACTION
        data_flags.append(f"deferred_fraction: model constant {DEFAULT_CRDC_DEFERRAL_FRACTION}")
    deferred_pct = float(deferred_pct)

    struct_rate = debt_terms.get("structuring_cost_rate")
    if struct_rate is None:
        struct_rate = DEFAULT_CRDC_STRUCTURING_COST_RATE
        data_flags.append(f"structuring_cost_rate: model constant {DEFAULT_CRDC_STRUCTURING_COST_RATE}")
    struct_rate = float(struct_rate)

    # USD figures only when a real principal is known; otherwise honest nulls.
    if debt_amount is not None:
        annual_debt_service = debt_amount * ds_rate
        deferred_amount: Optional[float] = round(
            annual_debt_service * deferred_pct * trigger_info["deferred_period_months"] / 12, 2
        )
        implementation_cost: Optional[float] = round(debt_amount * struct_rate, 2)  # legal/structuring cost
    else:
        deferred_amount = None
        implementation_cost = None

    # CRDC eligibility: climate-vulnerable countries with Commonwealth/bilateral creditors
    is_eligible = (
        country_iso in SIDS_LIST
        or vuln_score >= 0.65
        or country_data.get("is_sids", False)
        or country_data.get("is_ldc", False)
    )

    debt_relief_score = round(min(1.0, vuln_score * 0.6 + (deferred_pct) * 0.4), 4)

    recommendations = []
    if not is_eligible:
        recommendations.append("Country does not meet CRDC eligibility; consider standard CDPC")
    if return_period > 20:
        recommendations.append(f"Long return period ({return_period:.1f} yr) — consider dual-trigger design")
    if trigger_info["basis_risk"] in ["medium", "medium-high"]:
        recommendations.append(f"Mitigate {trigger_info['basis_risk']} basis risk with parametric index verification")
    recommendations.append(f"Incorporate {trigger_type} trigger at {trigger_threshold} threshold per Commonwealth Secretariat CRDC template")

    return CRDCAssessment(
        country_iso=country_iso,
        country_name=country_name,
        debt_amount_usd=round(debt_amount, 2) if debt_amount is not None else None,
        crdc_eligible=is_eligible,
        trigger_type=trigger_type,
        trigger_threshold=trigger_threshold,
        trigger_probability_pct=trigger_prob_pct,
        deferred_amount_usd=deferred_amount,
        deferred_period_months=trigger_info["deferred_period_months"],
        basis_risk_rating=trigger_info["basis_risk"],
        climate_event_return_period_years=round(return_period, 1),
        debt_relief_score=debt_relief_score,
        implementation_cost_usd=implementation_cost,
        recommendations=recommendations,
        data_flags=data_flags,
    )


def assess_debt_for_nature(country_data: Dict[str, Any], deal_terms: Dict[str, Any]) -> DebtForNatureResult:
    """Assess and design a Debt-for-Nature swap transaction.

    Total eligible debt is a real entity figure (honest null if not supplied).
    Deal structuring fractions accept caller inputs and otherwise default to
    documented model constants (flagged in `data_flags`). The framework discount
    default is the midpoint of the published framework discount range, which is
    itself reference data.
    """
    country_iso = country_data.get("country_iso", "SYC")

    country_name = country_data.get("country_name") or SIDS_LIST.get(country_iso, {}).get("name", country_iso)
    framework = deal_terms.get("swap_framework", "multilateral")
    if framework not in DFN_SWAP_FRAMEWORKS:
        framework = "multilateral"
    fw = DFN_SWAP_FRAMEWORKS[framework]

    data_flags: List[str] = []

    # Total eligible debt: real entity figure — honest null if not supplied.
    _debt_in = deal_terms.get("total_eligible_debt_usd")
    total_debt: Optional[float] = float(_debt_in) if _debt_in is not None else None
    if total_debt is None:
        data_flags.append("total_eligible_debt_usd: no caller-supplied debt — dependent USD figures returned as null")

    # Discount: caller input, else midpoint of published framework discount range (reference data).
    _disc_in = deal_terms.get("discount_pct")
    if _disc_in is not None:
        discount_pct = float(_disc_in)
    else:
        discount_pct = (fw["discount_range_pct"][0] + fw["discount_range_pct"][1]) / 2
        data_flags.append(
            f"discount_pct: midpoint of {framework} framework range {fw['discount_range_pct']}"
        )

    # Structuring fractions: caller inputs preferred, else documented model constants.
    swap_share = deal_terms.get("swap_share")
    if swap_share is None:
        swap_share = DEFAULT_DFN_SWAP_SHARE
        data_flags.append(f"swap_share: model constant {DEFAULT_DFN_SWAP_SHARE}")
    swap_share = float(swap_share)

    co2_intensity = deal_terms.get("co2_sequestration_intensity")
    if co2_intensity is None:
        co2_intensity = DEFAULT_CO2_SEQUESTRATION_INTENSITY
        data_flags.append(f"co2_sequestration_intensity: model constant {DEFAULT_CO2_SEQUESTRATION_INTENSITY} tCO2/yr per USD 1mn")
    co2_intensity = float(co2_intensity)

    mdb_coverage = deal_terms.get("mdb_guarantee_coverage")
    if mdb_coverage is None:
        mdb_coverage = DEFAULT_MDB_GUARANTEE_COVERAGE
        data_flags.append(f"mdb_guarantee_coverage: model constant {DEFAULT_MDB_GUARANTEE_COVERAGE}")
    mdb_coverage = float(mdb_coverage)

    carbon_price = deal_terms.get("carbon_price_usd_per_tco2")
    if carbon_price is None:
        carbon_price = DEFAULT_CARBON_PRICE_USD_PER_TCO2
        data_flags.append(f"carbon_price_usd_per_tco2: model constant {DEFAULT_CARBON_PRICE_USD_PER_TCO2}")
    carbon_price = float(carbon_price)

    imf_rst_linked = country_iso in IMF_RST_ELIGIBILITY and IMF_RST_ELIGIBILITY[country_iso]["approved"]

    # USD/emissions figures only when a real eligible-debt figure is known.
    if total_debt is not None:
        swap_amount: Optional[float] = total_debt * swap_share
        conservation_fund: Optional[float] = swap_amount * (discount_pct / 100)
        gdp = SIDS_LIST.get(country_iso, {}).get("gdp_usd_bn", 5.0) * 1e9
        commitment_pct_gdp = conservation_fund / gdp * 100 if gdp else 0.0
        co2_seq: Optional[float] = conservation_fund / 1e6 * co2_intensity
        mdb_guarantee: Optional[float] = conservation_fund * mdb_coverage if fw["mdb_involvement"] else 0.0
        carbon_revenue: Optional[float] = co2_seq * carbon_price if fw["carbon_credit_linkage"] else 0.0
        net_debt_reduction: Optional[float] = round(swap_amount * discount_pct / 100, 2)
        commitment_text = f"Commit {commitment_pct_gdp:.2f}% of GDP to conservation per {fw['description']}"
    else:
        swap_amount = None
        conservation_fund = None
        co2_seq = None
        mdb_guarantee = None
        carbon_revenue = None
        net_debt_reduction = None
        commitment_text = (
            f"Conservation commitment per {fw['description']} "
            f"(quantify once eligible-debt figure is provided)"
        )

    biodiversity_targets = [
        "30x30 Kunming-Montreal MPA target coverage",
        "Restore degraded mangrove/coral reef ecosystems",
        "Eliminate IUU fishing in EEZ within 5 years",
    ]
    # Habitat-protection hectare target: only stated when caller supplies a real figure.
    _habitat_ha = deal_terms.get("conservation_area_target_ha")
    if _habitat_ha is not None:
        biodiversity_targets.insert(1, f"Protect {float(_habitat_ha)/1e3:.0f}k ha marine and terrestrial habitat")

    return DebtForNatureResult(
        country_iso=country_iso,
        country_name=country_name,
        total_debt_usd=round(total_debt, 2) if total_debt is not None else None,
        swap_framework=framework,
        swap_amount_usd=round(swap_amount, 2) if swap_amount is not None else None,
        discount_pct=round(discount_pct, 2),
        conservation_fund_usd=round(conservation_fund, 2) if conservation_fund is not None else None,
        conservation_commitment_text=commitment_text,
        co2_sequestration_tco2_yr=round(co2_seq, 2) if co2_seq is not None else None,
        mdb_guarantee_usd=round(mdb_guarantee, 2) if mdb_guarantee is not None else None,
        carbon_credit_revenue_usd_yr=round(carbon_revenue, 2) if carbon_revenue is not None else None,
        biodiversity_targets=biodiversity_targets,
        imf_rst_linkage=imf_rst_linked,
        net_debt_reduction_usd=net_debt_reduction,
        data_flags=data_flags,
    )


def assess_imf_rst(country_data: Dict[str, Any]) -> IMFRSTAssessment:
    """Assess IMF Resilience and Sustainability Trust access and reform requirements.

    The IMF quota is a real published entity figure — honest null if not supplied,
    with the indicative drawing left null in that case. The resilience score is a
    documented deterministic proxy derived from published vulnerability and RST
    approval status (or a caller-supplied score), flagged in `data_flags`.
    """
    country_iso = country_data.get("country_iso", "JAM")

    rst_info = IMF_RST_ELIGIBILITY.get(country_iso)
    is_eligible = rst_info is not None
    access_limit = rst_info["access_limit_pct_quota"] if rst_info else 0
    reform_area = rst_info["reform_area"] if rst_info else "not_eligible"

    data_flags: List[str] = []

    # Resilience score: caller input preferred; else deterministic proxy from
    # published vulnerability (inverse) blended with RST approval status.
    _score_in = country_data.get("resilience_score")
    if _score_in is not None:
        resilience_score: Optional[float] = round(float(_score_in), 4)
    else:
        vuln = SIDS_LIST.get(country_iso, {}).get("vulnerability_score", 0.60)
        approval_bonus = 0.15 if (rst_info and rst_info.get("approved")) else 0.0
        resilience_score = round(max(0.0, min(1.0, (1 - vuln) * 0.85 + approval_bonus)), 4)
        data_flags.append(
            "resilience_score: deterministic proxy = (1 - vulnerability)*0.85 + approval_bonus"
        )

    # IMF quota: real published entity figure — honest null if not supplied.
    _quota_in = country_data.get("imf_quota_usd")
    quota_usd: Optional[float] = float(_quota_in) if _quota_in is not None else None
    if quota_usd is not None:
        indicative_drawing: Optional[float] = round(quota_usd * access_limit / 100, 2)
    else:
        indicative_drawing = None
        data_flags.append("imf_quota_usd: no caller-supplied quota — indicative_drawing_usd returned as null")

    reform_measures = []
    if reform_area == "climate_resilience":
        reform_measures = [
            "Develop and implement National Adaptation Plan aligned with IPCC AR6",
            "Establish climate contingency fund (>=2% GDP)",
            "Reform disaster risk management legislation",
            "Carbon pricing mechanism or equivalent fiscal instrument",
        ]
    elif reform_area == "energy_transition":
        reform_measures = [
            "Renewable energy target >=40% by 2030",
            "Fossil fuel subsidy reform with social protection safeguards",
            "Grid modernisation investment plan",
            "Green hydrogen feasibility study",
        ]
    else:
        reform_measures = ["Country not currently RST-eligible; engage IMF Article IV dialogue"]

    conditionality_met = bool(
        is_eligible
        and rst_info is not None
        and rst_info.get("approved", False)
        and resilience_score is not None
        and resilience_score >= 0.55
    )

    return IMFRSTAssessment(
        country_iso=country_iso,
        rst_eligible=is_eligible,
        access_limit_pct_quota=access_limit,
        reform_area=reform_area,
        resilience_score=resilience_score,
        reform_measures=reform_measures,
        indicative_drawing_usd=indicative_drawing,
        conditionality_met=conditionality_met,
        disbursement_timeline="12-18 months from LOI submission" if conditionality_met else "Not currently eligible",
    )


def assess_sids_vulnerability(
    country_iso: str, overrides: Optional[Dict[str, Any]] = None
) -> SIDSVulnerabilityResult:
    """Assess SIDS vulnerability and CDPC eligibility using composite index.

    Component sub-scores (INFORM / ND-GAIN / fiscal resilience) are, by default,
    a documented DETERMINISTIC decomposition of the published composite
    vulnerability score and GDP band — not random draws. A caller may supply
    real sub-scores or a population via `overrides` to replace the model
    decomposition and derive a real GNI-per-capita Paris Club classification;
    otherwise classification falls back to the vulnerability tier and is flagged.
    """
    overrides = overrides or {}
    data_flags: List[str] = []

    sids_data = SIDS_LIST.get(country_iso)
    if not sids_data:
        return SIDSVulnerabilityResult(
            country_iso=country_iso,
            country_name=country_iso,
            vulnerability_score=0.0,
            vulnerability_tier="not_sids",
            inform_component=0.0,
            nd_gain_component=0.0,
            fiscal_resilience_component=0.0,
            cdpc_eligible=False,
            cdpc_deferred_pct=0.0,
            paris_club_category="standard",
            climate_debt_relief_score=0.0,
            priority_interventions=[],
            data_flags=["country not in SIDS reference list"],
        )

    vuln = sids_data["vulnerability_score"]
    gdp = sids_data["gdp_usd_bn"]

    # Deterministic component decomposition from published vulnerability + GDP band.
    # INFORM risk tracks the published vulnerability directly.
    _inform_in = overrides.get("inform_component")
    if _inform_in is not None:
        inform = round(float(_inform_in), 4)
    else:
        inform = round(vuln, 4)
        data_flags.append("inform_component: model decomposition = published vulnerability_score")

    # ND-GAIN readiness is inversely related to vulnerability (lower for more vulnerable).
    _ndg_in = overrides.get("nd_gain_component")
    if _ndg_in is not None:
        nd_gain = round(float(_ndg_in), 4)
    else:
        nd_gain = round(0.5 * (1 - vuln), 4)
        data_flags.append("nd_gain_component: model decomposition = 0.5*(1 - vulnerability)")

    # Fiscal resilience: inverse of vulnerability with a small-economy (GDP < USD 5bn) penalty.
    _fisc_in = overrides.get("fiscal_resilience_component")
    if _fisc_in is not None:
        fiscal_res = round(float(_fisc_in), 4)
    else:
        fiscal_res = round(0.4 * (1 - vuln) + (0.05 if gdp < 5 else 0.15), 4)
        data_flags.append("fiscal_resilience_component: model decomposition from vulnerability + GDP band")

    composite = round(inform * 0.35 + (1 - nd_gain) * 0.35 + (1 - fiscal_res) * 0.30, 4)

    if composite >= 0.75:
        tier = "critical"
        cdpc_deferred = 40.0
    elif composite >= 0.55:
        tier = "high"
        cdpc_deferred = 25.0
    else:
        tier = "medium"
        cdpc_deferred = 10.0

    cdpc_eligible = composite >= 0.55

    # Paris Club category: use a REAL GNI-per-capita when population is supplied;
    # otherwise classify from the vulnerability tier (no fabricated population).
    _population = overrides.get("population")
    if _population is not None and float(_population) > 0:
        gdp_per_capita = gdp * 1e9 / float(_population)
        paris_cat = (
            "poorest" if gdp_per_capita < PARIS_CLUB_CATEGORIES["poorest"]["per_capita_gni_threshold_usd"]
            else "vulnerable_middle_income" if gdp_per_capita < PARIS_CLUB_CATEGORIES["vulnerable_middle_income"]["per_capita_gni_threshold_usd"]
            else "standard"
        )
    else:
        # Vulnerability-tier fallback (documented) — no synthetic per-capita income.
        paris_cat = "vulnerable_middle_income" if cdpc_eligible else "standard"
        data_flags.append(
            "paris_club_category: no population supplied — classified from vulnerability tier, not GNI per capita"
        )

    relief_score = round(composite * 0.6 + (cdpc_deferred / 40) * 0.4, 4)

    interventions = []
    if fiscal_res < 0.35:
        interventions.append("Establish climate contingency fund (IMF RST Article IV recommendation)")
    if inform > 0.75:
        interventions.append("Priority access to FRLD/Global Shield financing instruments")
    if nd_gain < 0.40:
        interventions.append("ND-GAIN adaptation readiness investment — governance and infrastructure")
    if cdpc_eligible:
        interventions.append(f"Incorporate CDPC in {cdpc_deferred}% of new bilateral debt instruments")

    return SIDSVulnerabilityResult(
        country_iso=country_iso,
        country_name=sids_data["name"],
        vulnerability_score=round(composite, 4),
        vulnerability_tier=tier,
        inform_component=round(inform, 4),
        nd_gain_component=round(nd_gain, 4),
        fiscal_resilience_component=round(fiscal_res, 4),
        cdpc_eligible=cdpc_eligible,
        cdpc_deferred_pct=cdpc_deferred,
        paris_club_category=paris_cat,
        climate_debt_relief_score=round(relief_score, 4),
        priority_interventions=interventions,
        data_flags=data_flags,
    )


def aggregate_sovereign_climate_portfolio(holdings: List[Dict[str, Any]]) -> SovereignClimatePortfolioResult:
    """Aggregate climate-linked sovereign debt metrics across a portfolio of sovereign holdings.

    Holdings with neither a SIDS-reference vulnerability nor a caller-supplied
    `vulnerability_score` are excluded from vulnerability-weighted metrics (and
    flagged) rather than assigned a random score. Weighted averages are computed
    over the covered exposure so the weights are honest. With no exposure, USD and
    weighted metrics are returned as null.
    """
    portfolio_id = "portfolio_default"
    if holdings:
        portfolio_id = str(hash(tuple(h.get("country_iso", "") for h in holdings)) & 0xFFFFFFFF)

    data_flags: List[str] = []

    total_exposure = sum(float(h.get("exposure_usd", 0)) for h in holdings)
    if total_exposure == 0:
        # Honest null — no synthetic exposure fabricated.
        data_flags.append("total_sovereign_exposure_usd: no exposure supplied — USD and weighted metrics null")
        return SovereignClimatePortfolioResult(
            portfolio_id=portfolio_id,
            total_sovereign_exposure_usd=None,
            climate_adjusted_exposure_usd=None,
            weighted_vulnerability_score=None,
            weighted_debt_relief_score=None,
            crdc_eligible_exposure_usd=0.0,
            dfn_eligible_exposure_usd=0.0,
            sids_exposure_pct=0.0,
            high_risk_country_concentration=0.0,
            portfolio_climate_var_usd=None,
            recommendations=[],
            data_flags=data_flags,
        )

    weighted_vuln_num = 0.0   # numerator: sum(vuln * exposure) over covered holdings
    weighted_relief_num = 0.0
    covered_exposure = 0.0    # exposure with a known vulnerability
    crdc_eligible = 0.0
    dfn_eligible = 0.0
    sids_exposure = 0.0
    high_risk_exposure = 0.0
    uncovered_count = 0

    for h in holdings:
        iso = h.get("country_iso", "")
        exp = float(h.get("exposure_usd", 0))
        sids_data = SIDS_LIST.get(iso)

        # Vulnerability: SIDS reference data, else a caller-supplied score. No fabrication.
        if sids_data:
            vuln: Optional[float] = sids_data["vulnerability_score"]
        elif h.get("vulnerability_score") is not None:
            vuln = float(h["vulnerability_score"])
        else:
            vuln = None

        if vuln is not None:
            covered_exposure += exp
            weighted_vuln_num += vuln * exp
            relief = min(1.0, vuln * 0.7)  # deterministic; no random jitter
            weighted_relief_num += relief * exp
            if sids_data or vuln >= 0.65:
                crdc_eligible += exp * 0.6
                dfn_eligible += exp * 0.3
            if vuln >= 0.80:
                high_risk_exposure += exp
        else:
            uncovered_count += 1

        if sids_data:
            sids_exposure += exp

    if uncovered_count:
        data_flags.append(
            f"{uncovered_count} holding(s) lacked a vulnerability score and were excluded from weighted metrics"
        )

    if covered_exposure > 0:
        weighted_vuln: Optional[float] = weighted_vuln_num / covered_exposure
        weighted_relief: Optional[float] = weighted_relief_num / covered_exposure
        climate_adjusted: Optional[float] = total_exposure * (1 - weighted_vuln * 0.15)
        # Climate VaR: documented model loss factor applied to vuln-weighted exposure.
        climate_var: Optional[float] = total_exposure * weighted_vuln * DEFAULT_PORTFOLIO_CLIMATE_VAR_LOSS_FACTOR
        data_flags.append(
            f"portfolio_climate_var_usd: loss factor {DEFAULT_PORTFOLIO_CLIMATE_VAR_LOSS_FACTOR} (model constant)"
        )
    else:
        weighted_vuln = None
        weighted_relief = None
        climate_adjusted = None
        climate_var = None
        data_flags.append("no holding had a known vulnerability — weighted/VaR metrics null")

    recommendations = []
    if sids_exposure / total_exposure > 0.30:
        recommendations.append("High SIDS concentration — diversify or hedge with catastrophe instruments")
    if crdc_eligible / total_exposure > 0.50:
        recommendations.append("Proactively incorporate CRDC clauses in primary market issuance")
    if weighted_vuln is not None and weighted_vuln > 0.70:
        recommendations.append("Portfolio-level vulnerability above threshold — engage Paris Club MOU")
    if dfn_eligible > 5e8:
        recommendations.append(f"USD {dfn_eligible/1e6:.0f}M eligible for Debt-for-Nature structuring")

    return SovereignClimatePortfolioResult(
        portfolio_id=portfolio_id,
        total_sovereign_exposure_usd=round(total_exposure, 2),
        climate_adjusted_exposure_usd=round(climate_adjusted, 2) if climate_adjusted is not None else None,
        weighted_vulnerability_score=round(weighted_vuln, 4) if weighted_vuln is not None else None,
        weighted_debt_relief_score=round(weighted_relief, 4) if weighted_relief is not None else None,
        crdc_eligible_exposure_usd=round(crdc_eligible, 2),
        dfn_eligible_exposure_usd=round(dfn_eligible, 2),
        sids_exposure_pct=round(sids_exposure / total_exposure * 100, 2),
        high_risk_country_concentration=round(high_risk_exposure / total_exposure, 4),
        portfolio_climate_var_usd=round(climate_var, 2) if climate_var is not None else None,
        recommendations=recommendations,
        data_flags=data_flags,
    )
