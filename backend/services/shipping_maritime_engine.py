"""
Shipping & Maritime Climate Engine
====================================
IMO GHG Strategy 2023 · CII A-E Rating · EEXI · Poseidon Principles ·
FuelEU Maritime · Sea Cargo Charter · EU ETS Shipping

Sub-modules:
  1. CII Annual Rating       — Carbon Intensity Indicator attained vs required
  2. EEXI Assessment         — Energy Efficiency Existing Ship Index
  3. Poseidon Principles     — Portfolio climate alignment scoring
  4. FuelEU Maritime         — GHG intensity compliance & penalty (EU 2023/1805)
  5. EU ETS Shipping         — Phase-in allowance obligation 2024-2026+
  6. Fuel Switch Modelling   — Alternative fuel transition economics
  7. Fleet Portfolio         — Fleet-level aggregated assessment
  8. Full Assessment         — Consolidated vessel + fleet report

References:
  - IMO GHG Strategy 2023 (MEPC 80)
  - MARPOL Annex VI Regulation 24 — CII framework
  - MARPOL Annex VI Regulation 21 — EEXI framework
  - Poseidon Principles (2019, rev 2023)
  - FuelEU Maritime Regulation (EU) 2023/1805
  - EU ETS Directive 2003/87/EC as amended by 2023/959
  - Sea Cargo Charter (2020)
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

# ---------------------------------------------------------------------------
# Reference Data
# ---------------------------------------------------------------------------

# CII reference line parameters (a, c) for CIIref = a * Capacity^(-c).
# Source: IMO Resolution MEPC.353(78), "2022 Guidelines on the Reference Lines for
# use with Operational Carbon Intensity Indicators (CII Reference Lines Guidelines,
# G2)", Annex, Table 1 (adopted 10 June 2022). Values below use the single
# representative DWT/GT bracket closest to the fleet segment this engine models
# (e.g. the <65,000 DWT bracket for gas carriers, the <20,000 DWT bracket for
# general cargo); ships far outside that bracket would need the bracket-specific
# a/c pair per the official table. "cii_reference_c" is the exponent c; previously
# this engine assumed c=0.5 for every ship type (i.e. coeff / sqrt(DWT)), which is
# not the MEPC.353(78) formula and materially over/understates the reference line
# since the true c ranges 0.383-0.639 by ship type. Cross-checked against
# services/shipping_calculator.py CII_REFERENCE_PARAMS, whose container (1984.60,
# 0.489) and cruise (930.44, 0.383) entries match Table 1 exactly.
VESSEL_TYPES: dict[str, dict] = {
    "bulk_carrier": {
        "imo_category": "Bulk carrier",
        "cii_reference_line_coeff": 4745.0,      # a  (MEPC.353(78) Table 1: <279,000 DWT)
        "cii_reference_c": 0.622,                # c
        "eexi_required_gco2_dwt": 3.00,
        "fueleu_ghg_base": 91.16,
    },
    "tanker": {
        "imo_category": "Tanker",
        "cii_reference_line_coeff": 5247.0,      # a  (MEPC.353(78) Table 1)
        "cii_reference_c": 0.610,                # c
        "eexi_required_gco2_dwt": 2.50,
        "fueleu_ghg_base": 91.16,
    },
    "container": {
        "imo_category": "Container ship",
        "cii_reference_line_coeff": 1984.0,      # a  (MEPC.353(78) Table 1)
        "cii_reference_c": 0.489,                # c
        "eexi_required_gco2_dwt": 2.20,
        "fueleu_ghg_base": 91.16,
    },
    "gas_carrier": {
        "imo_category": "Gas carrier",
        # a  (MEPC.353(78) Table 1: <65,000 DWT bracket; the >=65,000 DWT bracket
        # uses a different regression, a=14405E7, c=2.071 — not modelled here)
        "cii_reference_line_coeff": 8104.0,
        "cii_reference_c": 0.639,                # c
        "eexi_required_gco2_dwt": 4.00,
        "fueleu_ghg_base": 91.16,
    },
    "ro_ro": {
        "imo_category": "Ro-ro cargo ship",
        "cii_reference_line_coeff": 1967.0,      # a  (MEPC.353(78) Table 1: Ro-ro cargo ship, GT)
        "cii_reference_c": 0.485,                # c
        "eexi_required_gco2_dwt": 3.50,
        "fueleu_ghg_base": 91.16,
    },
    "cruise": {
        "imo_category": "Cruise passenger ship",
        "cii_reference_line_coeff": 930.0,       # a  (MEPC.353(78) Table 1, GT)
        "cii_reference_c": 0.383,                # c
        "eexi_required_gco2_dwt": 5.00,
        "fueleu_ghg_base": 91.16,
    },
    "general_cargo": {
        "imo_category": "General cargo ship",
        "cii_reference_line_coeff": 588.0,       # a  (MEPC.353(78) Table 1: <20,000 DWT bracket)
        "cii_reference_c": 0.3885,               # c
        "eexi_required_gco2_dwt": 3.80,
        "fueleu_ghg_base": 91.16,
    },
    "ferry": {
        "imo_category": "Ferry/ro-pax",
        "cii_reference_line_coeff": 2023.0,      # a  (MEPC.353(78) Table 1: Ro-ro passenger ship, GT)
        "cii_reference_c": 0.460,                # c
        "eexi_required_gco2_dwt": 4.20,
        "fueleu_ghg_base": 91.16,
    },
}

# Cumulative reduction percentage from 2008 baseline
CII_REQUIRED_REDUCTION: dict[int, float] = {
    2023: 5.0,
    2024: 7.0,
    2025: 9.0,
    2026: 11.0,
    2027: 13.0,
    2028: 15.0,
    2029: 17.0,
    2030: 20.0,
}

# Simplified rating boundaries: ratio of attained/required
# <0.85: A, <0.95: B, <1.05: C, <1.15: D, >=1.15: E
CII_RATING_BOUNDARIES = {
    "A": (0.0, 0.85),
    "B": (0.85, 0.95),
    "C": (0.95, 1.05),
    "D": (1.05, 1.15),
    "E": (1.15, float("inf")),
}

# Poseidon Principles: required gCO2/DWT·nm by vessel type and year (2025–2050)
PP_REQUIRED_TRAJECTORY: dict[str, dict[int, float]] = {
    "bulk_carrier":   {2025: 5.5, 2030: 4.8, 2035: 4.0, 2040: 3.0, 2045: 2.0, 2050: 1.0},
    "tanker":         {2025: 6.0, 2030: 5.2, 2035: 4.3, 2040: 3.2, 2045: 2.1, 2050: 1.1},
    "container":      {2025: 9.0, 2030: 7.8, 2035: 6.5, 2040: 4.8, 2045: 3.2, 2050: 1.6},
    "gas_carrier":    {2025: 7.5, 2030: 6.5, 2035: 5.4, 2040: 4.0, 2045: 2.7, 2050: 1.3},
    "ro_ro":          {2025: 12.0, 2030: 10.4, 2035: 8.6, 2040: 6.4, 2045: 4.3, 2050: 2.1},
    "cruise":         {2025: 20.0, 2030: 17.4, 2035: 14.4, 2040: 10.7, 2045: 7.1, 2050: 3.6},
    "general_cargo":  {2025: 10.0, 2030: 8.7, 2035: 7.2, 2040: 5.3, 2045: 3.6, 2050: 1.8},
    "ferry":          {2025: 15.0, 2030: 13.0, 2035: 10.8, 2040: 8.0, 2045: 5.3, 2050: 2.7},
}

# FuelEU Maritime GHG intensity targets (gCO2eq/MJ, WtW) per EU 2023/1805
# Baseline: 91.16 gCO2eq/MJ (2020 fossil reference)
FUELEU_GHG_TARGETS: dict[int, float] = {
    2025: 89.34,   # 2% reduction
    2030: 80.43,   # 6% reduction
    2035: 71.53,   # 14.5% reduction
    2040: 53.65,   # 31% reduction (ONRES sub-target)
    2045: 35.76,   # 60.75% reduction
    2050: 17.88,   # 80% reduction
}

# Fuel emission factors: co2_per_tonne (tCO2/t fuel), ghg_wtw_per_mj (gCO2eq/MJ), lcv (MJ/t)
FUEL_EMISSION_FACTORS: dict[str, dict] = {
    "HFO": {
        "co2_per_tonne": 3.114,
        "ghg_wtw_per_mj": 91.16,
        "lcv_mj_per_tonne": 40200.0,
        "name": "Heavy Fuel Oil",
    },
    "VLSFO": {
        "co2_per_tonne": 3.151,
        "ghg_wtw_per_mj": 91.50,
        "lcv_mj_per_tonne": 40800.0,
        "name": "Very Low Sulphur Fuel Oil",
    },
    "LNG": {
        "co2_per_tonne": 2.750,
        "ghg_wtw_per_mj": 79.00,
        "lcv_mj_per_tonne": 48000.0,
        "name": "Liquefied Natural Gas",
    },
    "methanol": {
        "co2_per_tonne": 1.375,
        "ghg_wtw_per_mj": 89.50,
        "lcv_mj_per_tonne": 19700.0,
        "name": "Methanol (conventional)",
    },
    "ammonia": {
        "co2_per_tonne": 0.0,
        "ghg_wtw_per_mj": 18.00,
        "lcv_mj_per_tonne": 18600.0,
        "name": "Ammonia (green)",
    },
    "hydrogen": {
        "co2_per_tonne": 0.0,
        "ghg_wtw_per_mj": 10.00,
        "lcv_mj_per_tonne": 120000.0,
        "name": "Hydrogen (green)",
    },
    "e-methanol": {
        "co2_per_tonne": 0.035,
        "ghg_wtw_per_mj": 2.50,
        "lcv_mj_per_tonne": 19700.0,
        "name": "E-Methanol (power-to-X)",
    },
    "biodiesel": {
        "co2_per_tonne": 2.800,
        "ghg_wtw_per_mj": 19.00,
        "lcv_mj_per_tonne": 37200.0,
        "name": "Biodiesel (FAME/HVO blend)",
    },
}

# Sea Cargo Charter: AER benchmarks by vessel type (gCO2/tonne-mile)
SEA_CARGO_CHARTER_BENCHMARKS: dict[str, dict[int, float]] = {
    "bulk_carrier":   {2025: 8.0,  2030: 6.8,  2040: 4.5},
    "tanker":         {2025: 9.5,  2030: 8.0,  2040: 5.5},
    "container":      {2025: 14.5, 2030: 12.0, 2040: 8.0},
    "gas_carrier":    {2025: 11.0, 2030: 9.3,  2040: 6.2},
    "ro_ro":          {2025: 18.0, 2030: 15.2, 2040: 10.1},
    "cruise":         {2025: 30.0, 2030: 25.4, 2040: 16.9},
    "general_cargo":  {2025: 14.0, 2030: 11.8, 2040: 7.9},
    "ferry":          {2025: 22.0, 2030: 18.6, 2040: 12.4},
}

# Alternative fuel readiness
ALTERNATIVE_FUEL_READINESS: dict[str, dict] = {
    "LNG":        {"technology_readiness": 9, "capex_premium_pct": 20.0, "opex_premium_pct": 10.0, "availability_score": 0.80},
    "methanol":   {"technology_readiness": 7, "capex_premium_pct": 15.0, "opex_premium_pct": 30.0, "availability_score": 0.45},
    "ammonia":    {"technology_readiness": 5, "capex_premium_pct": 25.0, "opex_premium_pct": 40.0, "availability_score": 0.20},
    "hydrogen":   {"technology_readiness": 4, "capex_premium_pct": 35.0, "opex_premium_pct": 50.0, "availability_score": 0.15},
    "biofuel":    {"technology_readiness": 8, "capex_premium_pct": 5.0,  "opex_premium_pct": 20.0, "availability_score": 0.55},
    "e-methanol": {"technology_readiness": 5, "capex_premium_pct": 18.0, "opex_premium_pct": 45.0, "availability_score": 0.10},
}

# ETS phase-in for shipping: % of verified emissions to surrender
ETS_SHIPPING_PHASE_IN: dict[int, float] = {
    2024: 0.40,
    2025: 0.70,
    2026: 1.00,
}

# ---------------------------------------------------------------------------
# Dataclasses
# ---------------------------------------------------------------------------

@dataclass
class CIIResult:
    entity_id: str
    vessel_type: str
    year: int
    cii_attained: float
    cii_required: float
    ratio: float
    rating: str
    reduction_target_pct: float
    year_to_d_rating: Optional[int]
    fuel_type: str
    co2_emitted_t: float

@dataclass
class EEXIResult:
    entity_id: str
    vessel_type: str
    eexi_attained: float
    eexi_required: float
    compliant: bool
    margin_pct: float
    epl_applied: bool
    epl_power_kw: float

@dataclass
class PoseidonResult:
    entity_id: str
    vessel_type: str
    year: int
    actual_intensity: float
    required_intensity: float
    alignment_score: float
    climate_score: float
    delta_pct: float
    trajectory_gap: float
    aligned: bool

@dataclass
class FuelEUResult:
    entity_id: str
    year: int
    ghg_intensity: float
    target: float
    compliant: bool
    deficit_gco2eq_mj: float
    deficit_energy_mj: float
    penalty_eur: float

@dataclass
class ETSResult:
    entity_id: str
    year: int
    co2_tonne_pa: float
    phase_in_pct: float
    obligation_allowances: float
    free_allocation: float
    surrender_gap: float
    cost_eur: Optional[float]  # None when no EUA carbon price supplied

@dataclass
class FuelSwitchResult:
    entity_id: str
    vessel_type: str
    current_fuel: str
    target_fuel: str
    fleet_size: int
    capex_usd: float
    opex_delta_usd_pa: Optional[float]  # None when no fuel price supplied
    co2_reduction_tpa: float
    payback_yrs: Optional[float]        # None when no fuel price supplied
    npv_usd: Optional[float]            # None when no fuel price supplied
    technology_readiness: int
    availability_score: float

@dataclass
class FleetPortfolioResult:
    entity_id: str
    total_vessels: int
    cii_distribution: dict
    cii_a_pct: float
    cii_d_or_e_pct: float
    pp_alignment_pct: float
    fueleu_total_penalty: float
    ets_total_obligation: float
    stranding_risk_summary: dict
    sea_cargo_charter_aligned: bool
    avg_cii_ratio: float

# ---------------------------------------------------------------------------
# Engine Class
# ---------------------------------------------------------------------------

class ShippingMaritimeEngine:
    """Pure computation — no DB calls."""

    # ------------------------------------------------------------------
    # 1. CII Rating
    # ------------------------------------------------------------------
    def calculate_cii(
        self,
        entity_id: str,
        vessel_type: str,
        dwt: float,
        distance_nm: float,
        fuel_consumed_t: float,
        fuel_type: str = "HFO",
        year: int = 2025,
    ) -> CIIResult:
        vt = VESSEL_TYPES.get(vessel_type, VESSEL_TYPES["bulk_carrier"])
        fuel = FUEL_EMISSION_FACTORS.get(fuel_type, FUEL_EMISSION_FACTORS["HFO"])

        co2_emitted = fuel_consumed_t * fuel["co2_per_tonne"]  # tCO2
        # CII attained = CO2 (g) / (DWT * distance)
        cii_attained = (co2_emitted * 1_000_000) / (dwt * distance_nm)

        # CII reference line: CIIref = a x Capacity^(-c)  (IMO MEPC.353(78) Annex,
        # Table 1). Previously approximated as coeff / sqrt(DWT) — i.e. assumed
        # c=0.5 for every ship type — which deviates from the real per-ship-type
        # exponent (0.383-0.639) and mis-states the reference line. See VESSEL_TYPES
        # comment above for parameter sourcing.
        ref_coeff = vt["cii_reference_line_coeff"]
        ref_exponent = vt["cii_reference_c"]
        cii_reference = ref_coeff * (max(dwt, 1.0) ** -ref_exponent)

        # Annual reduction applied
        reduction_pct = CII_REQUIRED_REDUCTION.get(year, CII_REQUIRED_REDUCTION[2030])
        cii_required = cii_reference * (1.0 - reduction_pct / 100.0)

        ratio = cii_attained / max(cii_required, 0.001)

        # Determine rating
        if ratio < 0.85:
            rating = "A"
        elif ratio < 0.95:
            rating = "B"
        elif ratio < 1.05:
            rating = "C"
        elif ratio < 1.15:
            rating = "D"
        else:
            rating = "E"

        # Estimate years until D rating if currently A/B/C
        year_to_d: Optional[int] = None
        if rating in ("A", "B", "C"):
            # Each future year adds ~2% degradation pressure
            current_ratio = ratio
            for future_year in range(year + 1, 2051):
                # Required tightens; assume intensity constant
                future_reduction = CII_REQUIRED_REDUCTION.get(
                    future_year,
                    CII_REQUIRED_REDUCTION[2030] + (future_year - 2030) * 0.5,
                )
                future_required = cii_reference * (1.0 - future_reduction / 100.0)
                future_ratio = cii_attained / max(future_required, 0.001)
                if future_ratio >= 1.05:  # D boundary
                    year_to_d = future_year
                    break

        return CIIResult(
            entity_id=entity_id,
            vessel_type=vessel_type,
            year=year,
            cii_attained=round(cii_attained, 4),
            cii_required=round(cii_required, 4),
            ratio=round(ratio, 4),
            rating=rating,
            reduction_target_pct=reduction_pct,
            year_to_d_rating=year_to_d,
            fuel_type=fuel_type,
            co2_emitted_t=round(co2_emitted, 2),
        )

    # ------------------------------------------------------------------
    # 2. EEXI
    # ------------------------------------------------------------------
    def calculate_eexi(
        self,
        entity_id: str,
        vessel_type: str,
        dwt: float,
        installed_power_kw: float,
        service_speed_knots: float,
        epl_applied: bool = False,
        epl_power_kw: float = 0.0,
    ) -> EEXIResult:
        vt = VESSEL_TYPES.get(vessel_type, VESSEL_TYPES["bulk_carrier"])

        effective_power = epl_power_kw if (epl_applied and epl_power_kw > 0) else installed_power_kw
        # EEXI attained ≈ (CF × SFC × P_ME) / (v_ref × DWT × 24)
        # Simplified formula used in practice:
        # EEXI_attained = (0.00349 × SFCref × P_eff) / (DWT × v^0.3)
        sfcref = 195.0  # g/kWh reference SFOC for VLSFO
        eexi_attained = (0.00349 * sfcref * effective_power) / (dwt * (service_speed_knots ** 0.3))

        eexi_required = vt["eexi_required_gco2_dwt"]
        compliant = eexi_attained <= eexi_required
        margin_pct = round((eexi_required - eexi_attained) / max(eexi_required, 0.001) * 100.0, 2)

        return EEXIResult(
            entity_id=entity_id,
            vessel_type=vessel_type,
            eexi_attained=round(eexi_attained, 4),
            eexi_required=eexi_required,
            compliant=compliant,
            margin_pct=margin_pct,
            epl_applied=epl_applied,
            epl_power_kw=epl_power_kw,
        )

    # ------------------------------------------------------------------
    # 3. Poseidon Principles
    # ------------------------------------------------------------------
    def assess_poseidon_principles(
        self,
        entity_id: str,
        vessel_type: str,
        dwt: float,
        actual_intensity: float,
        pp_year: int = 2025,
    ) -> PoseidonResult:
        trajectory = PP_REQUIRED_TRAJECTORY.get(vessel_type, PP_REQUIRED_TRAJECTORY["bulk_carrier"])

        # Interpolate required for year
        years_sorted = sorted(trajectory.keys())
        required = trajectory[years_sorted[-1]]
        for i in range(len(years_sorted) - 1):
            y0, y1 = years_sorted[i], years_sorted[i + 1]
            if y0 <= pp_year <= y1:
                t = (pp_year - y0) / (y1 - y0)
                required = trajectory[y0] + t * (trajectory[y1] - trajectory[y0])
                break
        if pp_year <= years_sorted[0]:
            required = trajectory[years_sorted[0]]

        delta_pct = (actual_intensity - required) / max(required, 0.001) * 100.0
        trajectory_gap = actual_intensity - required

        # Climate score: 100 = at required, 0 = 30% above required
        alignment_score = max(0.0, min(100.0, (1.0 - delta_pct / 30.0) * 100.0))
        climate_score = alignment_score

        return PoseidonResult(
            entity_id=entity_id,
            vessel_type=vessel_type,
            year=pp_year,
            actual_intensity=round(actual_intensity, 4),
            required_intensity=round(required, 4),
            alignment_score=round(alignment_score, 2),
            climate_score=round(climate_score, 2),
            delta_pct=round(delta_pct, 2),
            trajectory_gap=round(trajectory_gap, 4),
            aligned=delta_pct <= 0.0,
        )

    # ------------------------------------------------------------------
    # 4. FuelEU Maritime
    # ------------------------------------------------------------------
    def assess_fueleu(
        self,
        entity_id: str,
        annual_energy_mj: float,
        ghg_intensity_wtw: float,
        year: int = 2025,
    ) -> FuelEUResult:
        # Find applicable target
        target_years = sorted(FUELEU_GHG_TARGETS.keys())
        target = FUELEU_GHG_TARGETS[target_years[-1]]
        for ty in target_years:
            if year <= ty:
                target = FUELEU_GHG_TARGETS[ty]
                break

        compliant = ghg_intensity_wtw <= target
        deficit_gco2eq_mj = max(0.0, ghg_intensity_wtw - target)
        deficit_energy_mj = deficit_gco2eq_mj * annual_energy_mj / 1_000_000  # tCO2eq

        # Penalty: EUR 2400 per tonne CO2eq above limit × proportion of non-compliant energy
        penalty_eur = deficit_energy_mj * 2400.0

        return FuelEUResult(
            entity_id=entity_id,
            year=year,
            ghg_intensity=round(ghg_intensity_wtw, 3),
            target=round(target, 3),
            compliant=compliant,
            deficit_gco2eq_mj=round(deficit_gco2eq_mj, 4),
            deficit_energy_mj=round(deficit_energy_mj, 2),
            penalty_eur=round(penalty_eur, 2),
        )

    # ------------------------------------------------------------------
    # 5. EU ETS Obligation
    # ------------------------------------------------------------------
    def calculate_ets_obligation(
        self,
        entity_id: str,
        co2_tonne_pa: float,
        voyage_types: list[str],
        year: int = 2025,
        eua_price_eur: Optional[float] = None,
    ) -> ETSResult:
        # Phase-in factor
        phase_in = ETS_SHIPPING_PHASE_IN.get(year, 1.0)

        # Voyage type adjustments: only intra-EU/EEA + 50% of inbound/outbound
        intra_eu_pct = 0.6  # default
        if voyage_types:
            intra_count = sum(1 for v in voyage_types if "intra" in v.lower())
            intra_eu_pct = intra_count / len(voyage_types) if voyage_types else 0.6

        eligible_co2 = co2_tonne_pa * (intra_eu_pct + (1 - intra_eu_pct) * 0.5)
        obligation_allowances = eligible_co2 * phase_in

        # Free allocation: zero for shipping (unlike aviation)
        free_allocation = 0.0
        surrender_gap = max(0.0, obligation_allowances - free_allocation)

        # EUA cost requires a caller-supplied market carbon price (EUR/tCO2).
        # No default is fabricated: without a live/assumed EUA price the monetary
        # cost is an honest null. The physical surrender obligation above is real.
        cost_eur: Optional[float] = (
            round(surrender_gap * eua_price_eur, 2) if eua_price_eur is not None else None
        )

        return ETSResult(
            entity_id=entity_id,
            year=year,
            co2_tonne_pa=round(co2_tonne_pa, 2),
            phase_in_pct=round(phase_in * 100.0, 1),
            obligation_allowances=round(obligation_allowances, 2),
            free_allocation=round(free_allocation, 2),
            surrender_gap=round(surrender_gap, 2),
            cost_eur=cost_eur,
        )

    # ------------------------------------------------------------------
    # 6. Fuel Switch Modelling
    # ------------------------------------------------------------------
    def model_fuel_switch(
        self,
        entity_id: str,
        vessel_type: str,
        current_fuel: str,
        target_fuel: str,
        fleet_size: int,
        voyage_profile: dict,
        current_fuel_price_usd_t: Optional[float] = None,
    ) -> FuelSwitchResult:
        current_ef = FUEL_EMISSION_FACTORS.get(current_fuel, FUEL_EMISSION_FACTORS["HFO"])
        target_ef = FUEL_EMISSION_FACTORS.get(target_fuel, FUEL_EMISSION_FACTORS["HFO"])
        readiness = ALTERNATIVE_FUEL_READINESS.get(target_fuel, ALTERNATIVE_FUEL_READINESS["LNG"])

        annual_fuel_t = voyage_profile.get("annual_fuel_t_per_vessel", 3000.0)
        vessel_value_usd = voyage_profile.get("vessel_value_usd", 30_000_000.0)

        # CAPEX: retrofit or newbuild delta
        capex_premium = readiness["capex_premium_pct"] / 100.0
        capex_per_vessel = vessel_value_usd * capex_premium
        capex_usd = capex_per_vessel * fleet_size

        target_fuel_lcv_ratio = current_ef["lcv_mj_per_tonne"] / max(target_ef["lcv_mj_per_tonne"], 1.0)

        # CO2 reduction — independent of fuel price, always a real computation
        co2_current = annual_fuel_t * current_ef["co2_per_tonne"]
        co2_target = annual_fuel_t * target_ef["co2_per_tonne"] * target_fuel_lcv_ratio
        co2_reduction_pa = max(0.0, (co2_current - co2_target) * fleet_size)

        # OPEX delta, payback and NPV all depend on the current market fuel price
        # (USD/t). This is an entity/market input, not a model constant: source it
        # from the explicit param or from voyage_profile. Without it, the monetary
        # metrics are honest nulls rather than fabricated draws.
        fuel_price = current_fuel_price_usd_t
        if fuel_price is None:
            fuel_price = voyage_profile.get("current_fuel_price_usd_t")

        opex_delta_usd_pa: Optional[float] = None
        payback_yrs: Optional[float] = None
        npv: Optional[float] = None

        if fuel_price is not None:
            # Price premium for alternative fuels
            opex_premium = readiness["opex_premium_pct"] / 100.0
            opex_delta_per_vessel = annual_fuel_t * fuel_price * opex_premium
            opex_delta_usd_pa = opex_delta_per_vessel * fleet_size

            # Payback (simple)
            if opex_delta_usd_pa > 0:
                payback_yrs = capex_usd / opex_delta_usd_pa
            else:
                co2_price = 65.0
                carbon_saving_value = co2_reduction_pa * co2_price
                payback_yrs = capex_usd / max(carbon_saving_value, 1.0)
            payback_yrs = min(payback_yrs, 50.0)

            # NPV (15-year, 8% discount rate)
            discount_rate = 0.08
            npv = -capex_usd
            annual_saving = co2_reduction_pa * 65.0 - opex_delta_usd_pa
            for yr in range(1, 16):
                npv += annual_saving / ((1 + discount_rate) ** yr)

        return FuelSwitchResult(
            entity_id=entity_id,
            vessel_type=vessel_type,
            current_fuel=current_fuel,
            target_fuel=target_fuel,
            fleet_size=fleet_size,
            capex_usd=round(capex_usd, 0),
            opex_delta_usd_pa=round(opex_delta_usd_pa, 0) if opex_delta_usd_pa is not None else None,
            co2_reduction_tpa=round(co2_reduction_pa, 2),
            payback_yrs=round(payback_yrs, 1) if payback_yrs is not None else None,
            npv_usd=round(npv, 0) if npv is not None else None,
            technology_readiness=readiness["technology_readiness"],
            availability_score=readiness["availability_score"],
        )

    # ------------------------------------------------------------------
    # 7. Fleet Portfolio Assessment
    # ------------------------------------------------------------------
    def assess_fleet_portfolio(
        self,
        entity_id: str,
        vessel_list: list[dict],
    ) -> FleetPortfolioResult:
        cii_dist = {"A": 0, "B": 0, "C": 0, "D": 0, "E": 0}
        pp_aligned_count = 0
        total_fueleu_penalty = 0.0
        total_ets_obligation = 0.0
        cii_ratios = []

        for i, v in enumerate(vessel_list):
            vid = f"{entity_id}_v{i}"
            vtype = v.get("vessel_type", "bulk_carrier")
            dwt = v.get("dwt", 50000.0)
            dist = v.get("distance_nm", 80000.0)
            fuel_t = v.get("fuel_consumed_t", 3000.0)
            fuel_type = v.get("fuel_type", "HFO")
            year = v.get("year", 2025)

            cii_r = self.calculate_cii(vid, vtype, dwt, dist, fuel_t, fuel_type, year)
            cii_dist[cii_r.rating] += 1
            cii_ratios.append(cii_r.ratio)

            intensity = v.get("intensity_gco2_dwt_nm", cii_r.cii_attained / max(dwt, 1.0) * 1000.0)
            pp_r = self.assess_poseidon_principles(vid, vtype, dwt, intensity, year)
            if pp_r.aligned:
                pp_aligned_count += 1

            ghg_wtw = v.get("ghg_intensity_wtw", FUEL_EMISSION_FACTORS.get(fuel_type, FUEL_EMISSION_FACTORS["HFO"])["ghg_wtw_per_mj"])
            annual_energy = v.get("annual_energy_mj", fuel_t * FUEL_EMISSION_FACTORS.get(fuel_type, FUEL_EMISSION_FACTORS["HFO"])["lcv_mj_per_tonne"])
            fu_r = self.assess_fueleu(vid, annual_energy, ghg_wtw, year)
            total_fueleu_penalty += fu_r.penalty_eur

            co2_pa = cii_r.co2_emitted_t
            ets_r = self.calculate_ets_obligation(vid, co2_pa, [], year)
            total_ets_obligation += ets_r.obligation_allowances

        total = max(len(vessel_list), 1)
        de_count = cii_dist["D"] + cii_dist["E"]
        pp_pct = pp_aligned_count / total * 100.0
        avg_ratio = sum(cii_ratios) / len(cii_ratios) if cii_ratios else 1.0

        stranding_risk_summary = {
            "high_risk_vessels": de_count,
            "stranding_risk_pct": round(de_count / total * 100.0, 1),
            "avg_cii_ratio": round(avg_ratio, 3),
            "recommended_action": "urgent_retrofit" if de_count / total > 0.3 else "monitoring",
        }

        return FleetPortfolioResult(
            entity_id=entity_id,
            total_vessels=total,
            cii_distribution=cii_dist,
            cii_a_pct=round(cii_dist["A"] / total * 100.0, 1),
            cii_d_or_e_pct=round(de_count / total * 100.0, 1),
            pp_alignment_pct=round(pp_pct, 1),
            fueleu_total_penalty=round(total_fueleu_penalty, 2),
            ets_total_obligation=round(total_ets_obligation, 2),
            stranding_risk_summary=stranding_risk_summary,
            sea_cargo_charter_aligned=pp_pct >= 60.0,
            avg_cii_ratio=round(avg_ratio, 3),
        )

    # ------------------------------------------------------------------
    # 8. Full Assessment
    # ------------------------------------------------------------------
    def generate_full_assessment(
        self,
        entity_id: str,
        vessel_data: dict,
    ) -> dict:
        vessel_type = vessel_data.get("vessel_type", "bulk_carrier")
        dwt = vessel_data.get("dwt", 50000.0)
        fuel_type = vessel_data.get("fuel_type", "HFO")
        year = vessel_data.get("year", 2025)
        distance_nm = vessel_data.get("distance_nm", 80000.0)
        fuel_consumed_t = vessel_data.get("fuel_consumed_t", 3000.0)
        installed_power_kw = vessel_data.get("installed_power_kw", 8000.0)
        service_speed = vessel_data.get("service_speed_knots", 13.0)
        annual_energy_mj = vessel_data.get("annual_energy_mj", fuel_consumed_t * FUEL_EMISSION_FACTORS.get(fuel_type, FUEL_EMISSION_FACTORS["HFO"])["lcv_mj_per_tonne"])
        ghg_intensity_wtw = FUEL_EMISSION_FACTORS.get(fuel_type, FUEL_EMISSION_FACTORS["HFO"])["ghg_wtw_per_mj"]

        cii = self.calculate_cii(entity_id, vessel_type, dwt, distance_nm, fuel_consumed_t, fuel_type, year)
        eexi = self.calculate_eexi(entity_id, vessel_type, dwt, installed_power_kw, service_speed)
        pp = self.assess_poseidon_principles(entity_id, vessel_type, dwt, cii.cii_attained, year)
        fueleu = self.assess_fueleu(entity_id, annual_energy_mj, ghg_intensity_wtw, year)
        ets = self.calculate_ets_obligation(
            entity_id,
            cii.co2_emitted_t,
            vessel_data.get("voyage_types", []),
            year,
            eua_price_eur=vessel_data.get("eua_price_eur"),
        )

        # Sea Cargo Charter AER
        scc_bench = SEA_CARGO_CHARTER_BENCHMARKS.get(vessel_type, {})
        scc_bench_val = scc_bench.get(2025, 10.0)
        aer = (cii.co2_emitted_t * 1_000_000) / (dwt * distance_nm)
        scc_aligned = aer <= scc_bench_val

        return {
            "assessment_id": str(uuid.uuid4()),
            "entity_id": entity_id,
            "vessel_type": vessel_type,
            "year": year,
            "cii": {
                "attained": cii.cii_attained,
                "required": cii.cii_required,
                "ratio": cii.ratio,
                "rating": cii.rating,
                "year_to_d_rating": cii.year_to_d_rating,
            },
            "eexi": {
                "attained": eexi.eexi_attained,
                "required": eexi.eexi_required,
                "compliant": eexi.compliant,
                "margin_pct": eexi.margin_pct,
            },
            "poseidon_principles": {
                "alignment_score": pp.alignment_score,
                "climate_score": pp.climate_score,
                "delta_pct": pp.delta_pct,
                "aligned": pp.aligned,
            },
            "fueleu_maritime": {
                "ghg_intensity": fueleu.ghg_intensity,
                "target": fueleu.target,
                "compliant": fueleu.compliant,
                "penalty_eur": fueleu.penalty_eur,
            },
            "eu_ets": {
                "obligation_allowances": ets.obligation_allowances,
                "surrender_gap": ets.surrender_gap,
                "cost_eur": ets.cost_eur,
                "phase_in_pct": ets.phase_in_pct,
            },
            "sea_cargo_charter": {
                "aer_attained": round(aer, 4),
                "aer_benchmark_2025": scc_bench_val,
                "aligned": scc_aligned,
            },
            "overall_compliance_score": round(
                (100.0 if cii.rating in ("A", "B", "C") else 50.0) * 0.25
                + pp.alignment_score * 0.25
                + (100.0 if fueleu.compliant else max(0.0, 100.0 - fueleu.penalty_eur / 10000.0)) * 0.25
                + (100.0 if eexi.compliant else 40.0) * 0.25,
                2,
            ),
            "generated_at": datetime.utcnow().isoformat() + "Z",
        }
