"""
DME Financial Risk Engine -- VaR, WACC, LCR, ECL, IFRS 9
Source: dme-platform/lib/calculations.ts

Provides:
  - Value-at-Risk (additive real-time & structural TCFD CVaR)
  - WACC with ESG / climate-risk adjustments
  - LCR with ESG-adjusted HQLA haircuts and outflow premiums
  - Expected Credit Loss (PD x LGD x EAD)
  - IFRS 9 staging via SICR z-score trigger
  - Cross-pillar amplification multipliers
  - Full single-entity risk assessment orchestration
"""
import math
from typing import Dict, Optional

from .dme_pd_engine import dispatch_pd, SECTOR_COEFFICIENTS

# =========================================================================
# VaR
# =========================================================================

def var_realtime(
    var_base: float,
    exposure: float,
    beta_reputational: float,
    acceleration_reputational: float,
) -> float:
    """Additive VaR: VaR_adjusted = VaR_base + Exposure x beta_rep x accel."""
    return var_base + exposure * beta_reputational * acceleration_reputational


def var_structural(
    cvar_transition: float,
    cvar_physical: float,
    cvar_opportunity: float,
) -> float:
    """TCFD structural CVaR components (net of opportunity offset)."""
    return cvar_transition + cvar_physical - cvar_opportunity


# =========================================================================
# WACC
# =========================================================================

def climate_risk_premium(
    beta_carbon: float,
    carbon_intensity: float,
    beta_physical: float,
    physical_score: float,
) -> float:
    """Climate component of cost-of-equity premium.

    CRP = beta_carbon x (carbon_intensity / 1000)
        + beta_physical x (physical_score / 100)
    """
    return beta_carbon * carbon_intensity / 1000.0 + beta_physical * physical_score / 100.0


def wacc_adjusted(
    w_equity: float,
    c_equity: float,
    esg_equity_premium: float,
    w_debt: float,
    c_debt: float,
    esg_debt_spread: float,
    tax_rate: float,
) -> Dict[str, float]:
    """WACC with ESG adjustments.

    Returns dict with 'wacc', 'baseline_wacc', 'bps_change'.
    """
    wacc = (
        w_equity * (c_equity + esg_equity_premium)
        + w_debt * (c_debt + esg_debt_spread) * (1.0 - tax_rate)
    )
    baseline = w_equity * c_equity + w_debt * c_debt * (1.0 - tax_rate)
    return {
        "wacc": round(wacc, 6),
        "baseline_wacc": round(baseline, 6),
        "bps_change": round((wacc - baseline) * 10_000),
    }


# =========================================================================
# LCR
# =========================================================================

def lcr_adjusted(
    hqla: float,
    hqla_haircut: float,
    net_outflows: float,
    outflow_premium: float,
) -> float:
    """Liquidity Coverage Ratio with ESG adjustments.

    LCR% = adjusted_HQLA / adjusted_outflows x 100
    """
    adjusted_hqla = hqla * (1.0 - hqla_haircut)
    adjusted_outflows = net_outflows * (1.0 + outflow_premium)
    if adjusted_outflows <= 0:
        return 999.99
    return round(adjusted_hqla / adjusted_outflows * 100.0, 2)


def lcr_activation(
    velocity_physical: float,
    sigma_historical: float,
    k: float = 2.0,
) -> bool:
    """Check if LCR monitoring should be activated.

    Triggered when |velocity_physical| > k x sigma_historical.
    """
    return abs(velocity_physical) > k * sigma_historical


# =========================================================================
# ECL
# =========================================================================

def ecl_calculate(
    adjusted_pd: float,
    lgd: float = 0.45,
    ead_usd: float = 0.0,
) -> float:
    """Expected Credit Loss = PD x LGD x EAD."""
    return round(adjusted_pd * lgd * ead_usd, 2)


# =========================================================================
# IFRS 9
# =========================================================================

def ifrs9_stage(
    z_score: float,
    sicr_threshold: float = 2.0,
) -> Dict:
    """IFRS 9 staging based on SICR trigger.

    Stage 3: z > 3.0   -- Credit-impaired
    Stage 2: z > sicr   -- Significant increase in credit risk
    Stage 1: otherwise  -- Performing
    """
    if z_score > 3.0:
        return {
            "stage": "stage_3",
            "sicr_triggered": True,
            "description": "Credit-impaired",
        }
    if z_score > sicr_threshold:
        return {
            "stage": "stage_2",
            "sicr_triggered": True,
            "description": "Significant increase in credit risk",
        }
    return {
        "stage": "stage_1",
        "sicr_triggered": False,
        "description": "Performing",
    }


# =========================================================================
# Cross-Pillar Amplification
# =========================================================================

AMPLIFICATION_MULTIPLIERS: Dict[str, float] = {
    "G_to_E": 2.5,    # Governance failure amplifies environmental risk
    "X_to_EL": 4.3,   # Cross-cutting amplifies expected loss
    "X_to_VaR": 4.5,  # Cross-cutting amplifies VaR
    "X_to_ES": 3.2,   # Cross-cutting amplifies expected shortfall
    "S_to_P": 2.3,    # Social amplifies political risk
}


def apply_amplification(
    base_impact: float,
    pillar_from: str,
    pillar_to: str,
) -> float:
    """Apply cross-pillar amplification multiplier."""
    key = f"{pillar_from}_to_{pillar_to}"
    mult = AMPLIFICATION_MULTIPLIERS.get(key, 1.0)
    return base_impact * mult


# =========================================================================
# Full Risk Assessment
# =========================================================================

def assess_entity_risk(
    entity_data: Dict,
    velocity_data: Optional[Dict] = None,
) -> Dict:
    """Run complete risk assessment for a single entity.

    Orchestrates PD, VaR, WACC, LCR, ECL, and IFRS 9 calculations into a
    single consolidated result dictionary.

    Parameters
    ----------
    entity_data : dict
        Entity-level fields: ticker, sector, baseline_pd, market_cap_usd_mn,
        total_debt_usd_mn, volatility, esg_score, ghg_intensity_tco2e_per_mn,
        physical_risk_score, exposure_usd_mn.
    velocity_data : dict or None
        Velocity fields: velocity_transition, velocity_physical, velocity_sg,
        acceleration_reputational, z_score.
    """
    if velocity_data is None:
        velocity_data = {
            "velocity_transition": 0,
            "velocity_physical": 0,
            "velocity_sg": 0,
        }

    # --- PD ---
    pd_result = dispatch_pd(entity_data, velocity_data, context="realtime")

    # --- VaR ---
    exposure = entity_data.get(
        "exposure_usd_mn", entity_data.get("market_cap_usd_mn", 0)
    )
    base_var = exposure * 0.05  # 5% base VaR
    adjusted_var = var_realtime(
        base_var,
        exposure,
        0.02,
        velocity_data.get("acceleration_reputational", 0),
    )

    # --- WACC ---
    esg_score = entity_data.get("esg_score", 50)
    esg_premium = max(0, (60 - esg_score) / 1000.0)  # Higher premium for lower ESG
    carbon_int = entity_data.get("ghg_intensity_tco2e_per_mn", 0)
    crp = climate_risk_premium(
        0.003, carbon_int, 0.002, entity_data.get("physical_risk_score", 50)
    )
    wacc_result = wacc_adjusted(
        0.6, 0.10, esg_premium + crp,
        0.4, 0.05, esg_premium * 0.5,
        0.25,
    )

    # --- LCR ---
    lcr = lcr_adjusted(
        exposure * 0.15,
        0.05,
        exposure * 0.10,
        esg_premium * 2,
    )

    # --- ECL ---
    total_debt = entity_data.get(
        "total_debt_usd_mn",
        entity_data.get("market_cap_usd_mn", 0) * 0.4,
    )
    ecl = ecl_calculate(pd_result["adjusted_pd"], 0.45, total_debt * 1e6)

    # --- IFRS 9 ---
    z_score = velocity_data.get(
        "z_score",
        abs(velocity_data.get("velocity_transition", 0)) * 2,
    )
    ifrs9 = ifrs9_stage(z_score)

    return {
        "entity": entity_data.get("ticker", "UNKNOWN"),
        "pd": pd_result,
        "var": {
            "baseline_usd_mn": round(base_var, 2),
            "adjusted_usd_mn": round(adjusted_var, 2),
        },
        "wacc": wacc_result,
        "lcr_pct": lcr,
        "ecl_usd": ecl,
        "ifrs9": ifrs9,
        "z_score": round(z_score, 3),
    }
