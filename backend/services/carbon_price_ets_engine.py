"""
Carbon Price Forecasting & ETS Analytics Engine — E71
Standards: EU ETS Phase 4 Directive 2023/958 (LRF 4.3% post-2027, MSR),
UK ETS (May 2021, diverging from EU), California Cap-and-Trade (Scoping Plan 2022),
China ETS MRVP 2021 (8 sectors, intensity-based), RGGI Model Rule 2023,
Korea ETS Phase 3, IEA WEO 2023 SDS/APS/NZE carbon price pathways,
EU CBAM Regulation 2023/956 (full phase-in 2026), Cross-Border Leakage Risk
"""
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any, Tuple
import math

# ---------------------------------------------------------------------------
# Reference Data
# ---------------------------------------------------------------------------

ETS_SYSTEMS: Dict[str, Dict] = {
    "eu_ets": {
        "name": "EU Emissions Trading System",
        "jurisdiction": "European Union",
        "current_price_usd": 68.0,
        "current_price_local": 62.0,
        "local_currency": "EUR",
        "cap_mt_co2": 1_382,
        "sectors_covered": ["power", "industry", "aviation", "maritime_2024"],
        "phase": "Phase 4 (2021-2030)",
        "lrf_pct": 4.3,
        "free_allocation": True,
        "msr_intake_pct": 24.0,
        "msr_release_mt": 100,
        "cbam_linked": True,
        "innovation_fund_bn_eur": 38.0,
        "url": "https://ec.europa.eu/clima/policies/ets",
    },
    "uk_ets": {
        "name": "UK Emissions Trading Scheme",
        "jurisdiction": "United Kingdom",
        "current_price_usd": 47.0,
        "current_price_local": 37.0,
        "local_currency": "GBP",
        "cap_mt_co2": 148,
        "sectors_covered": ["power", "industry", "aviation"],
        "phase": "Phase 1 (2021-2030)",
        "lrf_pct": 4.2,
        "free_allocation": True,
        "msr_intake_pct": 24.0,
        "msr_release_mt": 20,
        "cbam_linked": False,
        "innovation_fund_bn_eur": 0,
        "url": "https://www.gov.uk/guidance/uk-emissions-trading-scheme",
    },
    "california": {
        "name": "California Cap-and-Trade",
        "jurisdiction": "California, USA (WCI linkage)",
        "current_price_usd": 38.0,
        "current_price_local": 38.0,
        "local_currency": "USD",
        "cap_mt_co2": 298,
        "sectors_covered": ["power", "industry", "transportation_2015", "natural_gas"],
        "phase": "Phase 4 (2021-2030)",
        "lrf_pct": 3.5,
        "free_allocation": True,
        "msr_intake_pct": 0,
        "msr_release_mt": 0,
        "cbam_linked": False,
        "price_floor_usd": 19.70,
        "price_ceiling_usd": 65.00,
        "url": "https://ww2.arb.ca.gov/our-work/programs/cap-and-trade-program",
    },
    "china_ets": {
        "name": "China National ETS",
        "jurisdiction": "People's Republic of China",
        "current_price_usd": 11.5,
        "current_price_local": 83.0,
        "local_currency": "CNY",
        "cap_mt_co2": 4_500,  # power sector only
        "sectors_covered": ["power"],  # expanding to 7 more sectors
        "phase": "Phase 1 (2021-ongoing, intensity-based)",
        "lrf_pct": 0,  # intensity-based not absolute cap
        "free_allocation": True,
        "msr_intake_pct": 0,
        "msr_release_mt": 0,
        "cbam_linked": False,
        "intensity_based": True,
        "url": "https://www.mee.gov.cn/",
    },
    "rggi": {
        "name": "Regional Greenhouse Gas Initiative",
        "jurisdiction": "12 US Northeast States",
        "current_price_usd": 14.5,
        "current_price_local": 14.5,
        "local_currency": "USD",
        "cap_mt_co2": 91,
        "sectors_covered": ["power"],
        "phase": "Post-2023 revised cap",
        "lrf_pct": 3.0,
        "free_allocation": False,
        "msr_intake_pct": 0,
        "msr_release_mt": 0,
        "cbam_linked": False,
        "price_floor_usd": 2.38,
        "url": "https://www.rggi.org",
    },
    "korea_ets": {
        "name": "Korea Emissions Trading Scheme (K-ETS)",
        "jurisdiction": "Republic of Korea",
        "current_price_usd": 8.5,
        "current_price_local": 11_400,
        "local_currency": "KRW",
        "cap_mt_co2": 598,
        "sectors_covered": ["power", "industry", "buildings", "waste", "transport", "aviation"],
        "phase": "Phase 3 (2021-2025)",
        "lrf_pct": 2.5,
        "free_allocation": True,
        "msr_intake_pct": 0,
        "msr_release_mt": 0,
        "cbam_linked": False,
        "url": "https://www.gir.go.kr/",
    },
}

IEA_CARBON_PRICE_PATHWAYS: Dict[str, Dict[int, Dict]] = {
    "NZE": {
        2025: {"advanced_usd": 90, "emerging_usd": 25, "developing_usd": 5},
        2030: {"advanced_usd": 130, "emerging_usd": 45, "developing_usd": 20},
        2035: {"advanced_usd": 200, "emerging_usd": 80, "developing_usd": 40},
        2040: {"advanced_usd": 250, "emerging_usd": 120, "developing_usd": 65},
        2050: {"advanced_usd": 250, "emerging_usd": 200, "developing_usd": 140},
    },
    "APS": {
        2025: {"advanced_usd": 75, "emerging_usd": 15, "developing_usd": 3},
        2030: {"advanced_usd": 105, "emerging_usd": 30, "developing_usd": 10},
        2035: {"advanced_usd": 150, "emerging_usd": 55, "developing_usd": 25},
        2040: {"advanced_usd": 185, "emerging_usd": 80, "developing_usd": 45},
        2050: {"advanced_usd": 210, "emerging_usd": 140, "developing_usd": 90},
    },
    "SDS": {
        2025: {"advanced_usd": 60, "emerging_usd": 10, "developing_usd": 2},
        2030: {"advanced_usd": 85, "emerging_usd": 25, "developing_usd": 7},
        2035: {"advanced_usd": 120, "emerging_usd": 45, "developing_usd": 18},
        2040: {"advanced_usd": 155, "emerging_usd": 65, "developing_usd": 30},
        2050: {"advanced_usd": 180, "emerging_usd": 110, "developing_usd": 65},
    },
    "STEPS": {
        2025: {"advanced_usd": 35, "emerging_usd": 5, "developing_usd": 1},
        2030: {"advanced_usd": 45, "emerging_usd": 10, "developing_usd": 3},
        2035: {"advanced_usd": 55, "emerging_usd": 15, "developing_usd": 5},
        2040: {"advanced_usd": 65, "emerging_usd": 20, "developing_usd": 8},
        2050: {"advanced_usd": 75, "emerging_usd": 30, "developing_usd": 15},
    },
}

CBAM_SECTORS: Dict[str, Dict] = {
    "cement": {
        "hs_chapters": ["2523"],
        "embedded_carbon_intensity_tco2_t": 0.83,
        "eu_benchmark_tco2_t": 0.766,
        "free_allocation_phase_out_yr": 2034,
        "cbam_phase_in_start": 2023,
        "cbam_full_phase_in": 2026,
        "leakage_risk": 0.90,
        "import_bn_eur_from_noneu": 2.8,
    },
    "iron_steel": {
        "hs_chapters": ["7201", "7202", "7206", "7207", "7208-7215", "7216", "7217", "7218-7229"],
        "embedded_carbon_intensity_tco2_t": 1.89,
        "eu_benchmark_tco2_t": 1.328,
        "free_allocation_phase_out_yr": 2034,
        "cbam_phase_in_start": 2023,
        "cbam_full_phase_in": 2026,
        "leakage_risk": 0.80,
        "import_bn_eur_from_noneu": 8.6,
    },
    "aluminium": {
        "hs_chapters": ["7601", "7602", "7603", "7604-7614", "7616"],
        "embedded_carbon_intensity_tco2_t": 16.5,
        "eu_benchmark_tco2_t": 6.7,
        "free_allocation_phase_out_yr": 2034,
        "cbam_phase_in_start": 2023,
        "cbam_full_phase_in": 2026,
        "leakage_risk": 0.85,
        "import_bn_eur_from_noneu": 5.1,
    },
    "fertilisers": {
        "hs_chapters": ["2808", "2814", "2833", "3102", "3105"],
        "embedded_carbon_intensity_tco2_t": 2.60,
        "eu_benchmark_tco2_t": 2.14,
        "free_allocation_phase_out_yr": 2034,
        "cbam_phase_in_start": 2023,
        "cbam_full_phase_in": 2026,
        "leakage_risk": 0.75,
        "import_bn_eur_from_noneu": 3.2,
    },
    "electricity": {
        "hs_chapters": ["2716"],
        "embedded_carbon_intensity_tco2_mwh": 0.45,
        "eu_benchmark_tco2_mwh": 0.00,  # full CBAM certificate required
        "free_allocation_phase_out_yr": 2030,
        "cbam_phase_in_start": 2023,
        "cbam_full_phase_in": 2026,
        "leakage_risk": 0.95,
        "import_bn_eur_from_noneu": 1.5,
    },
    "hydrogen": {
        "hs_chapters": ["2804"],
        "embedded_carbon_intensity_tco2_t": 10.0,
        "eu_benchmark_tco2_t": 0.00,  # green hydrogen target
        "free_allocation_phase_out_yr": 2030,
        "cbam_phase_in_start": 2023,
        "cbam_full_phase_in": 2026,
        "leakage_risk": 0.70,
        "import_bn_eur_from_noneu": 0.3,
    },
}

EU_ETS_PHASE4_PARAMS: Dict[str, Any] = {
    "lrf_pct": 4.3,
    "lrf_start_year": 2024,
    "lrf_pre_2024_pct": 2.2,
    "msr_intake_pct": 24.0,
    "msr_release_threshold_mt": 833,
    "msr_release_mt": 100,
    "msr_upper_threshold_mt": 1_096,
    "innovation_fund_bn_eur": 38.0,
    "modernisation_fund_bn_eur": 14.0,
    "cbam_phase_in_2023_to_2025": "reporting_only",
    "cbam_certificates_start": 2026,
    "free_allocation_industry_end": 2034,
    "maritime_inclusion_year": 2024,
    "buildings_road_fuel_ets2_start": 2027,
}

CHINA_ETS_SECTORS: Dict[str, Dict] = {
    "power_generation": {
        "benchmark_tco2_mwh_coal": 0.877,
        "benchmark_tco2_mwh_gas": 0.392,
        "coverage_mt_co2": 4_500,
        "entities": 2_225,
        "phase": "Phase 1+2",
    },
    "iron_steel": {"benchmark_tco2_t": 1.80, "coverage_mt_co2": 1_800, "entities": 600, "phase": "Expanding 2024"},
    "nonferrous_metals": {"benchmark_tco2_t": 12.0, "coverage_mt_co2": 500, "entities": 300, "phase": "Expanding 2024"},
    "cement": {"benchmark_tco2_t": 0.82, "coverage_mt_co2": 1_400, "entities": 1_800, "phase": "Expanding 2024"},
    "chemicals": {"benchmark_tco2_t": 1.50, "coverage_mt_co2": 700, "entities": 500, "phase": "Expanding 2024"},
    "petrochemicals": {"benchmark_tco2_t": 0.52, "coverage_mt_co2": 800, "entities": 200, "phase": "Expanding 2024"},
    "paper_pulp": {"benchmark_tco2_t": 0.48, "coverage_mt_co2": 220, "entities": 400, "phase": "Expanding 2024"},
    "civil_aviation": {"benchmark_tco2_rtk": 0.0915, "coverage_mt_co2": 60, "entities": 45, "phase": "Expanding 2024"},
}

LEAKAGE_RISK_SECTORS: Dict[str, Dict] = {
    "cement": {"leakage_risk": 0.90, "trade_intensity": 0.35, "cbam_covered": True},
    "steel": {"leakage_risk": 0.80, "trade_intensity": 0.55, "cbam_covered": True},
    "aluminium": {"leakage_risk": 0.85, "trade_intensity": 0.70, "cbam_covered": True},
    "fertilisers": {"leakage_risk": 0.75, "trade_intensity": 0.45, "cbam_covered": True},
    "chemicals": {"leakage_risk": 0.60, "trade_intensity": 0.50, "cbam_covered": False},
    "glass": {"leakage_risk": 0.55, "trade_intensity": 0.25, "cbam_covered": False},
    "paper_pulp": {"leakage_risk": 0.45, "trade_intensity": 0.40, "cbam_covered": False},
    "refining": {"leakage_risk": 0.50, "trade_intensity": 0.30, "cbam_covered": False},
    "ceramics": {"leakage_risk": 0.70, "trade_intensity": 0.35, "cbam_covered": False},
    "lime": {"leakage_risk": 0.65, "trade_intensity": 0.20, "cbam_covered": False},
}

# ---------------------------------------------------------------------------
# Dataclasses
# ---------------------------------------------------------------------------

@dataclass
class ETSComplianceCost:
    entity_id: str
    entity_name: str
    sector: str
    annual_emissions_tco2: Optional[float]
    eu_ets_allocation_tco2: Optional[float]
    eu_ets_shortfall_tco2: Optional[float]
    eu_ets_cost_eur: Optional[float]
    uk_ets_cost_gbp: Optional[float]
    california_cost_usd: Optional[float]
    china_ets_cost_cny: Optional[float]
    rggi_cost_usd: Optional[float]
    total_carbon_cost_usd: Optional[float]
    carbon_cost_pct_ebitda: Optional[float]
    hedging_recommendation: str
    abatement_cost_breakeven_usd_tco2: Optional[float]
    data_quality_flag: str = "complete"
    notes: List[str] = field(default_factory=list)


@dataclass
class EUETSForecast:
    scenario: str
    base_price_eur: float
    price_path: Dict[int, float]
    price_2030_eur: float
    price_2050_eur: float
    msr_impact_eur: float
    lrf_impact_eur: float
    cbam_spillover_eur: float
    confidence_interval_low: Dict[int, float]
    confidence_interval_high: Dict[int, float]
    key_drivers: List[str]


@dataclass
class CBAMExposure:
    entity_id: str
    exporter_country: str
    importer_country: str
    sector: str
    import_volume_t: Optional[float]
    embedded_carbon_tco2: Optional[float]
    default_carbon_intensity_tco2_t: float
    eu_benchmark_tco2_t: float
    cbam_certificate_cost_eur: Optional[float]
    cbam_phase_in_pct: float
    effective_cbam_cost_eur: Optional[float]
    competitiveness_impact_pct: Optional[float]
    leakage_risk_score: float
    mitigation_options: List[str]
    data_quality_flag: str = "complete"
    notes: List[str] = field(default_factory=list)


@dataclass
class PortfolioCarbonCost:
    portfolio_id: str
    total_financed_emissions_tco2: Optional[float]
    weighted_carbon_cost_usd: Optional[float]
    ets_exposure_breakdown: Dict[str, float]
    transition_risk_score: Optional[float]
    stranding_probability: Optional[float]
    carbon_var_1yr_usd: Optional[float]
    paris_alignment_temperature: Optional[float]
    high_carbon_concentration_pct: Optional[float]
    abatement_pathway_cost_usd: Optional[float]
    recommendations: List[str]
    data_quality_flag: str = "complete"
    notes: List[str] = field(default_factory=list)


@dataclass
class CarbonPricePathway:
    scenario: str
    economy_type: str
    year_prices: Dict[int, float]
    annual_growth_rate_pct: float
    uncertainty_range_pct: float
    key_policy_milestones: List[str]
    price_2030_usd: float
    price_2050_usd: float


# ---------------------------------------------------------------------------
# Engine Functions
# ---------------------------------------------------------------------------

def forecast_eu_ets_price(horizon_years: int, scenario: str, entity_id: str = "default") -> EUETSForecast:
    """Forecast EU ETS price path using LRF, MSR dynamics, and supply/demand fundamentals.

    Deterministic supply-tightening model. MSR intake/release and CBAM pass-through
    are represented by fixed model calibration constants (not entity-reported figures).
    The confidence band is a scenario-dependent deterministic model uncertainty width,
    not a random draw.
    """
    base_price = ETS_SYSTEMS["eu_ets"]["current_price_usd"]
    params = EU_ETS_PHASE4_PARAMS
    lrf = params["lrf_pct"] / 100

    # Supply tightening — deterministic MODEL calibration constants (EUR/t/yr).
    # MSR removes ~24% of surplus into the reserve; mid-point of historical 1.5-3.5 range.
    msr_tightening = 2.5  # EUR per tonne per year of MSR operation
    # CBAM pass-through pressure — mid-point of 2.0-6.0 modelled range.
    cbam_spillover = 4.0

    # Scenario multipliers
    scenario_mult = {"NZE": 1.8, "APS": 1.4, "SDS": 1.2, "STEPS": 0.9, "current_policies": 0.7}.get(scenario, 1.0)
    # Scenario-dependent deterministic model uncertainty band half-width (fraction of price).
    uncertainty_frac = {"NZE": 0.15, "APS": 0.12, "SDS": 0.10, "STEPS": 0.13, "current_policies": 0.13}.get(scenario, 0.12)

    current_year = 2026
    price_path: Dict[int, float] = {}
    ci_low: Dict[int, float] = {}
    ci_high: Dict[int, float] = {}

    price = base_price
    for yr in range(current_year, current_year + horizon_years + 1):
        # LRF-driven supply constraint → price increase
        lrf_effect = price * lrf * scenario_mult
        # MSR removes surplus allowances → tightening (halved after 2030 as surplus depletes)
        msr_effect = msr_tightening if yr <= 2030 else msr_tightening * 0.5
        price = price + lrf_effect + msr_effect
        price = max(20, price)  # floor
        price_path[yr] = round(price, 2)
        uncertainty = price * uncertainty_frac
        ci_low[yr] = round(price - uncertainty, 2)
        ci_high[yr] = round(price + uncertainty, 2)

    price_2030 = price_path.get(2030, price_path.get(current_year + 4, base_price * 1.5))
    price_2050 = price_path.get(2050, price_path.get(current_year + horizon_years, base_price * 2.5))

    drivers = [
        f"LRF {lrf * 100:.1f}% annual supply reduction driving structural price rise",
        f"MSR removing excess allowances (intake {params['msr_intake_pct']}%)",
        "CBAM phase-in 2026 eliminating carbon leakage arbitrage",
        f"ETS2 (buildings/road fuel) expected 2027 — additional demand",
    ]
    if scenario in ["NZE", "APS"]:
        drivers.append("Strong net-zero policy signals tightening long-dated supply")
    if scenario in ["STEPS", "current_policies"]:
        drivers.append("Weaker policy ambition = lower demand from voluntary abatement")

    return EUETSForecast(
        scenario=scenario,
        base_price_eur=base_price,
        price_path=price_path,
        price_2030_eur=round(price_2030, 2),
        price_2050_eur=round(price_2050, 2),
        msr_impact_eur=round(msr_tightening * horizon_years, 2),
        lrf_impact_eur=round(base_price * lrf * horizon_years * scenario_mult, 2),
        cbam_spillover_eur=round(cbam_spillover, 2),
        confidence_interval_low=ci_low,
        confidence_interval_high=ci_high,
        key_drivers=drivers,
    )


def calculate_ets_compliance_cost(entity_data: Dict[str, Any]) -> ETSComplianceCost:
    """Calculate compliance cost across all 6 ETS systems for a given entity.

    All figures are computed from caller-supplied entity data using published ETS
    reference prices (ETS_SYSTEMS). When a required entity input is absent it is
    treated as an honest null / zero-exposure rather than fabricated:
      - annual_emissions_tco2 absent  -> insufficient_data (costs return None)
      - free_allocation_pct absent    -> assume zero free allocation (full shortfall)
      - <jurisdiction>_operations_pct absent -> assume zero exposure to that scheme
      - ebitda_usd absent             -> carbon_cost_pct_ebitda returns None
    """
    entity_id = entity_data.get("entity_id", "default")
    entity_name = entity_data.get("entity_name", "Unknown Entity")
    sector = entity_data.get("sector", "steel")
    notes: List[str] = []

    raw_emissions = entity_data.get("annual_emissions_tco2")
    if raw_emissions is None:
        # No reported emissions — cannot compute any compliance cost. Honest null.
        return ETSComplianceCost(
            entity_id=str(entity_id),
            entity_name=entity_name,
            sector=sector,
            annual_emissions_tco2=None,
            eu_ets_allocation_tco2=None,
            eu_ets_shortfall_tco2=None,
            eu_ets_cost_eur=None,
            uk_ets_cost_gbp=None,
            california_cost_usd=None,
            china_ets_cost_cny=None,
            rggi_cost_usd=None,
            total_carbon_cost_usd=None,
            carbon_cost_pct_ebitda=None,
            hedging_recommendation="Provide annual_emissions_tco2 to compute compliance exposure.",
            abatement_cost_breakeven_usd_tco2=None,
            data_quality_flag="insufficient_data",
            notes=["annual_emissions_tco2 not provided; no compliance cost computed."],
        )

    annual_emissions = float(raw_emissions)
    ebitda = entity_data.get("ebitda_usd")
    ebitda = float(ebitda) if ebitda is not None else None

    # EU ETS — free allocation share must be supplied; absent => 0% free (conservative full shortfall)
    free_alloc_pct = entity_data.get("free_allocation_pct")
    if free_alloc_pct is None:
        eu_allocation = 0.0
        notes.append("free_allocation_pct not provided; assumed 0% free allocation (full shortfall).")
    else:
        eu_allocation = annual_emissions * max(0.0, min(1.0, float(free_alloc_pct)))
    eu_shortfall = max(0.0, annual_emissions - eu_allocation)
    eu_price = ETS_SYSTEMS["eu_ets"]["current_price_usd"]  # published reference price
    eu_cost_eur = eu_shortfall * eu_price

    # UK ETS — exposure share from reported operations; absent => 0
    uk_pct = entity_data.get("uk_operations_pct")
    uk_exposed = (float(uk_pct) if uk_pct is not None else 0.0) * annual_emissions
    uk_price = ETS_SYSTEMS["uk_ets"]["current_price_usd"]
    uk_cost_gbp = uk_exposed * uk_price * 0.78  # USD to GBP

    # California
    ca_pct = entity_data.get("california_operations_pct")
    ca_exposed = (float(ca_pct) if ca_pct is not None else 0.0) * annual_emissions
    ca_price = ETS_SYSTEMS["california"]["current_price_usd"]
    ca_cost_usd = ca_exposed * ca_price

    # China ETS (intensity-based: excess intensity share × covered production)
    china_pct = entity_data.get("china_operations_pct")
    china_exposed = (float(china_pct) if china_pct is not None else 0.0) * annual_emissions
    china_intensity_excess_in = entity_data.get("china_intensity_excess_pct")
    china_intensity_excess = float(china_intensity_excess_in) if china_intensity_excess_in is not None else 0.0
    if china_exposed > 0 and china_intensity_excess_in is None:
        notes.append("china_intensity_excess_pct not provided; China ETS liability assumed 0 (at benchmark).")
    china_price = ETS_SYSTEMS["china_ets"]["current_price_usd"]
    china_cost_cny = china_exposed * china_intensity_excess * china_price * 7.1

    # RGGI (power sector only)
    rggi_pct = entity_data.get("rggi_operations_pct")
    if sector == "power":
        rggi_exposed = (float(rggi_pct) if rggi_pct is not None else 0.0) * annual_emissions
    else:
        rggi_exposed = 0.0
    rggi_price = ETS_SYSTEMS["rggi"]["current_price_usd"]
    rggi_cost_usd = rggi_exposed * rggi_price

    # Convert all to USD
    total_usd = (eu_cost_eur * 1.09) + (uk_cost_gbp * 1.27) + ca_cost_usd + (china_cost_cny / 7.1) + rggi_cost_usd

    carbon_pct_ebitda = round(total_usd / ebitda * 100, 2) if ebitda else None
    if ebitda is None:
        notes.append("ebitda_usd not provided; carbon_cost_pct_ebitda unavailable.")

    # Abatement breakeven = average carbon cost per tonne of total emissions
    abatement_breakeven = total_usd / annual_emissions if annual_emissions else None

    hedge_rec = (
        "Lock in 60-70% of forward EU ETS exposure via Phase 4 December futures"
        if eu_shortfall > 100_000
        else "Spot purchasing sufficient; monitor MSR dynamics quarterly"
    )

    return ETSComplianceCost(
        entity_id=str(entity_id),
        entity_name=entity_name,
        sector=sector,
        annual_emissions_tco2=round(annual_emissions, 2),
        eu_ets_allocation_tco2=round(eu_allocation, 2),
        eu_ets_shortfall_tco2=round(eu_shortfall, 2),
        eu_ets_cost_eur=round(eu_cost_eur, 2),
        uk_ets_cost_gbp=round(uk_cost_gbp, 2),
        california_cost_usd=round(ca_cost_usd, 2),
        china_ets_cost_cny=round(china_cost_cny, 2),
        rggi_cost_usd=round(rggi_cost_usd, 2),
        total_carbon_cost_usd=round(total_usd, 2),
        carbon_cost_pct_ebitda=carbon_pct_ebitda,
        hedging_recommendation=hedge_rec,
        abatement_cost_breakeven_usd_tco2=round(abatement_breakeven, 2) if abatement_breakeven is not None else None,
        data_quality_flag="complete" if not notes else "partial",
        notes=notes,
    )


def assess_cbam_exposure(trade_data: Dict[str, Any]) -> CBAMExposure:
    """Assess CBAM certificate liability and competitiveness impact for a trade flow.

    Uses caller-supplied trade data and the published CBAM sector benchmarks
    (CBAM_SECTORS) plus the EU ETS reference price. Honest fallbacks:
      - import_volume_t absent -> insufficient_data (volume-dependent costs return None)
      - actual_carbon_intensity_tco2_t absent -> published sector default intensity
        (reference-data value, flagged in notes)
      - exporter_carbon_price_usd_tco2 absent -> 0 (no offset assumed)
      - trade_unit_price_usd_t absent -> competitiveness_impact_pct returns None
    """
    entity_id = trade_data.get("entity_id", "default")
    sector = trade_data.get("sector", "steel")
    exporter_country = trade_data.get("exporter_country", "IN")
    importer_country = trade_data.get("importer_country", "DE")
    notes: List[str] = []

    cbam_data = CBAM_SECTORS.get(sector)
    if not cbam_data:
        cbam_data = CBAM_SECTORS["iron_steel"]  # default
        notes.append(f"Sector '{sector}' not in CBAM scope table; using iron_steel benchmarks.")

    default_intensity = cbam_data.get("embedded_carbon_intensity_tco2_t", 1.89)
    eu_benchmark = cbam_data.get("eu_benchmark_tco2_t", 1.328)

    # Actual carbon intensity: use reported value; else fall back to published sector default.
    actual_in = trade_data.get("actual_carbon_intensity_tco2_t")
    if actual_in is not None:
        actual_intensity = float(actual_in)
    else:
        actual_intensity = float(default_intensity)
        notes.append("actual_carbon_intensity_tco2_t not provided; using published sector default intensity.")

    # Exporter carbon price already paid (reduces CBAM); absent => no offset.
    exp_price_in = trade_data.get("exporter_carbon_price_usd_tco2")
    exporter_carbon_price = float(exp_price_in) if exp_price_in is not None else 0.0
    if exp_price_in is None:
        notes.append("exporter_carbon_price_usd_tco2 not provided; assumed 0 (no offset).")
    eu_ets_price = ETS_SYSTEMS["eu_ets"]["current_price_usd"]

    # CBAM certificate rate = (EU ETS price - exporter price offset), floored at 0.
    cbam_per_tco2 = max(0.0, eu_ets_price - exporter_carbon_price)
    cbam_phase_in = float(trade_data.get("cbam_phase_in_pct", 100.0))  # 0-100%

    raw_volume = trade_data.get("import_volume_t")
    if raw_volume is None:
        # Volume-dependent quantities cannot be computed without an import volume.
        mitigation = ["Provide import_volume_t to quantify CBAM certificate liability."]
        if actual_intensity > eu_benchmark * 1.1:
            mitigation.append(f"Reduce carbon intensity to EU benchmark {eu_benchmark:.3f} tCO2/t through DRI-EAF switch")
        return CBAMExposure(
            entity_id=str(entity_id),
            exporter_country=exporter_country,
            importer_country=importer_country,
            sector=sector,
            import_volume_t=None,
            embedded_carbon_tco2=None,
            default_carbon_intensity_tco2_t=round(default_intensity, 4),
            eu_benchmark_tco2_t=round(eu_benchmark, 4),
            cbam_certificate_cost_eur=None,
            cbam_phase_in_pct=cbam_phase_in,
            effective_cbam_cost_eur=None,
            competitiveness_impact_pct=None,
            leakage_risk_score=LEAKAGE_RISK_SECTORS.get(sector, {}).get("leakage_risk", 0.5),
            mitigation_options=mitigation,
            data_quality_flag="insufficient_data",
            notes=notes + ["import_volume_t not provided; certificate/effective cost not computed."],
        )

    import_volume_t = float(raw_volume)
    embedded_carbon = import_volume_t * actual_intensity
    gross_cbam_cost = embedded_carbon * cbam_per_tco2
    effective_cbam = gross_cbam_cost * cbam_phase_in / 100

    # Competitiveness impact requires a reported unit trade price; else honest null.
    unit_price_in = trade_data.get("trade_unit_price_usd_t")
    if unit_price_in is not None and float(unit_price_in) > 0:
        revenue_from_trade = import_volume_t * float(unit_price_in)
        comp_impact_pct = round(effective_cbam / revenue_from_trade * 100, 2)
    else:
        comp_impact_pct = None
        notes.append("trade_unit_price_usd_t not provided; competitiveness_impact_pct unavailable.")

    leakage_data = LEAKAGE_RISK_SECTORS.get(sector, {})
    leakage_risk = leakage_data.get("leakage_risk", 0.5)

    mitigation = []
    if actual_intensity > eu_benchmark * 1.1:
        mitigation.append(f"Reduce carbon intensity to EU benchmark {eu_benchmark:.3f} tCO2/t through DRI-EAF switch")
    if exporter_carbon_price < 10:
        mitigation.append("Implement domestic carbon pricing in exporter country for CBAM credit offset")
    if cbam_phase_in == 100:
        mitigation.append("Prepare MRV documentation per Implementing Regulation (EU) 2023/1773")
    mitigation.append("Consider relocation of finishing operations inside EU single market")

    return CBAMExposure(
        entity_id=str(entity_id),
        exporter_country=exporter_country,
        importer_country=importer_country,
        sector=sector,
        import_volume_t=round(import_volume_t, 2),
        embedded_carbon_tco2=round(embedded_carbon, 2),
        default_carbon_intensity_tco2_t=round(default_intensity, 4),
        eu_benchmark_tco2_t=round(eu_benchmark, 4),
        cbam_certificate_cost_eur=round(gross_cbam_cost, 2),
        cbam_phase_in_pct=cbam_phase_in,
        effective_cbam_cost_eur=round(effective_cbam, 2),
        competitiveness_impact_pct=comp_impact_pct,
        leakage_risk_score=leakage_risk,
        mitigation_options=mitigation,
        data_quality_flag="complete" if not notes else "partial",
        notes=notes,
    )


def calculate_portfolio_carbon_cost(portfolio: Dict[str, Any]) -> PortfolioCarbonCost:
    """Calculate sector-weighted carbon cost, transition risk, and stranding probability.

    Computes financed emissions per PCAF from caller-supplied holdings. Each holding
    should provide exposure_usd, sector, waci_tco2_mn_revenue and revenue_mn (or
    financed_emissions_tco2 directly). Missing per-holding figures are skipped (not
    fabricated) and flagged. With no usable holdings the result is an honest null.
    Stranding factor and carbon-VaR scalar are deterministic MODEL calibration
    constants (NGFS-style), not entity-reported figures.
    """
    portfolio_id = portfolio.get("portfolio_id", "default")
    holdings = portfolio.get("holdings") or []
    raw_aum = portfolio.get("total_aum_usd")
    notes: List[str] = []

    ets_breakdown: Dict[str, float] = {k: 0.0 for k in ETS_SYSTEMS}

    def _empty(reason: str) -> PortfolioCarbonCost:
        return PortfolioCarbonCost(
            portfolio_id=portfolio_id,
            total_financed_emissions_tco2=None,
            weighted_carbon_cost_usd=None,
            ets_exposure_breakdown={k: 0.0 for k in ETS_SYSTEMS},
            transition_risk_score=None,
            stranding_probability=None,
            carbon_var_1yr_usd=None,
            paris_alignment_temperature=None,
            high_carbon_concentration_pct=None,
            abatement_pathway_cost_usd=None,
            recommendations=[reason],
            data_quality_flag="insufficient_data",
            notes=[reason],
        )

    if not holdings:
        return _empty("No holdings provided; portfolio carbon cost not computed.")
    if raw_aum is None or float(raw_aum) <= 0:
        return _empty("total_aum_usd not provided or non-positive; portfolio metrics require AUM.")

    total_aum = float(raw_aum)

    total_financed_emissions = 0.0
    weighted_carbon_cost = 0.0
    high_carbon_exposure = 0.0
    used_exposure = 0.0
    counted = 0

    for idx, h in enumerate(holdings):
        exp_in = h.get("exposure_usd")
        if exp_in is None:
            notes.append(f"holding[{idx}] missing exposure_usd; skipped.")
            continue
        exp = float(exp_in)
        sector = h.get("sector")
        if not sector:
            notes.append(f"holding[{idx}] missing sector; skipped.")
            continue

        # Financed emissions: use reported value, else derive from WACI × revenue × attribution.
        fe_in = h.get("financed_emissions_tco2")
        if fe_in is not None:
            financed_emissions = float(fe_in)
        else:
            waci_in = h.get("waci_tco2_mn_revenue")
            revenue_mn_in = h.get("revenue_mn")
            if waci_in is None or revenue_mn_in is None:
                notes.append(
                    f"holding[{idx}] missing financed_emissions_tco2 and (waci_tco2_mn_revenue, revenue_mn); "
                    "emissions contribution skipped."
                )
                continue
            waci = float(waci_in)
            revenue_mn = float(revenue_mn_in)
            # PCAF attribution factor = exposure / total AUM
            financed_emissions = waci * revenue_mn * (exp / total_aum)

        total_financed_emissions += financed_emissions
        used_exposure += exp
        counted += 1

        leakage = LEAKAGE_RISK_SECTORS.get(sector, {})
        # Carbon price: reported per-holding price, else published EU ETS reference price.
        cp_in = h.get("carbon_price_usd_tco2")
        carbon_price = float(cp_in) if cp_in is not None else ETS_SYSTEMS["eu_ets"]["current_price_usd"]
        carbon_cost = financed_emissions * carbon_price
        weighted_carbon_cost += carbon_cost

        if leakage.get("cbam_covered", False) or leakage.get("leakage_risk", 0) > 0.70:
            high_carbon_exposure += exp

        # Assign carbon cost to the primary ETS the holding reports; else EU ETS default.
        primary_ets = h.get("primary_ets")
        if primary_ets not in ets_breakdown:
            primary_ets = "eu_ets"
        ets_breakdown[primary_ets] += carbon_cost

    if counted == 0:
        return _empty("No holdings had sufficient data (exposure_usd, sector, emissions) to compute cost.")

    # Portfolio-level metrics.
    transition_risk = round(min(1.0, total_financed_emissions / (total_aum / 1e6) / 500), 4)
    # Deterministic NGFS-style disorderly-transition stranding factor (model calibration).
    STRANDING_FACTOR = 0.45
    stranding_prob = round(transition_risk * STRANDING_FACTOR, 4)
    # Carbon VaR: deterministic 1-in-x price-shock scalar on carbon cost (model calibration).
    CARBON_VAR_SHOCK = 0.25
    carbon_var = weighted_carbon_cost * CARBON_VAR_SHOCK
    # Implied temperature: deterministic transition-risk-to-temperature mapping.
    paris_temp = round(1.5 + transition_risk * 2.0, 1)
    paris_temp = max(1.5, min(4.0, paris_temp))

    # Abatement pathway cost — 50% abatement target at published EU ETS reference price.
    abatement_tco2 = total_financed_emissions * 0.50
    abatement_price = ETS_SYSTEMS["eu_ets"]["current_price_usd"]
    abatement_cost = abatement_tco2 * abatement_price

    high_carbon_pct = round(high_carbon_exposure / total_aum * 100, 2)

    recommendations = []
    if paris_temp > 2.5:
        recommendations.append(f"Portfolio temperature {paris_temp:.1f}°C — requires significant decarbonisation")
    if high_carbon_exposure / total_aum > 0.25:
        recommendations.append("High-carbon concentration >25% — diversify into clean sectors")
    if stranding_prob > 0.30:
        recommendations.append("Elevated stranding risk — stress-test assets under IEA NZE scenario")
    recommendations.append("Implement Paris-aligned benchmark or CTB index tilt")
    recommendations.append("Engage portfolio companies on SBTi targets and CBAM compliance")

    return PortfolioCarbonCost(
        portfolio_id=portfolio_id,
        total_financed_emissions_tco2=round(total_financed_emissions, 2),
        weighted_carbon_cost_usd=round(weighted_carbon_cost, 2),
        ets_exposure_breakdown={k: round(v, 2) for k, v in ets_breakdown.items()},
        transition_risk_score=transition_risk,
        stranding_probability=stranding_prob,
        carbon_var_1yr_usd=round(carbon_var, 2),
        paris_alignment_temperature=paris_temp,
        high_carbon_concentration_pct=high_carbon_pct,
        abatement_pathway_cost_usd=round(abatement_cost, 2),
        recommendations=recommendations,
        data_quality_flag="complete" if not notes else "partial",
        notes=notes,
    )


def forecast_carbon_price_pathway(scenario: str, horizon: int, economy_type: str = "advanced",
                                   entity_id: str = "default") -> CarbonPricePathway:
    """Interpolate the published IEA WEO carbon price pathway with scenario uncertainty bands.

    Prices are the published IEA anchor values linearly interpolated between anchor
    years — no random perturbation is applied. The uncertainty_range_pct is a
    deterministic scenario band width, not a random draw.
    """
    if scenario not in IEA_CARBON_PRICE_PATHWAYS:
        scenario = "APS"
    pathway = IEA_CARBON_PRICE_PATHWAYS[scenario]

    price_key = f"{economy_type}_usd"
    anchor_years = sorted(pathway.keys())

    year_prices: Dict[int, float] = {}
    current_year = 2026

    # Linear interpolation between anchor years
    for yr in range(current_year, current_year + horizon + 1):
        # Find bracketing anchor years
        lower_yr = max([y for y in anchor_years if y <= yr], default=anchor_years[0])
        upper_yr = min([y for y in anchor_years if y >= yr], default=anchor_years[-1])

        if lower_yr == upper_yr:
            base_price = pathway[lower_yr][price_key]
        else:
            alpha = (yr - lower_yr) / (upper_yr - lower_yr)
            p_low = pathway[lower_yr][price_key]
            p_high = pathway[upper_yr][price_key]
            base_price = p_low + alpha * (p_high - p_low)

        year_prices[yr] = round(max(1.0, base_price), 2)

    prices_list = list(year_prices.values())
    growth_rate = round(
        ((prices_list[-1] / prices_list[0]) ** (1 / max(1, horizon)) - 1) * 100, 2
    ) if prices_list[0] > 0 else 0

    uncertainty_pct = {"NZE": 20, "APS": 15, "SDS": 12, "STEPS": 18}.get(scenario, 15)

    milestones = []
    if current_year <= 2026:
        milestones.append("2026: EU CBAM certificates fully in force")
    if current_year <= 2027:
        milestones.append("2027: EU ETS2 (buildings/road fuel) launch")
    if current_year <= 2030:
        milestones.append("2030: EU 55% GHG reduction milestone (Fit for 55)")
    if current_year <= 2035:
        milestones.append("2035: EU combustion engine car ban effective")
    if current_year <= 2050:
        milestones.append("2050: EU climate neutrality target")

    p2030 = year_prices.get(2030, year_prices.get(current_year + 4, prices_list[-1]))
    p2050 = year_prices.get(2050, year_prices.get(current_year + horizon, prices_list[-1]))

    return CarbonPricePathway(
        scenario=scenario,
        economy_type=economy_type,
        year_prices=year_prices,
        annual_growth_rate_pct=growth_rate,
        uncertainty_range_pct=float(uncertainty_pct),
        key_policy_milestones=milestones,
        price_2030_usd=round(p2030, 2),
        price_2050_usd=round(p2050, 2),
    )
