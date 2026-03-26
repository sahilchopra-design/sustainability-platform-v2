"""
DME 4-Branch Probability of Default Engine
Source: dme-platform/lib/calculations.ts

4 PD Methods:
  A. Exponential  -- Real-time monitoring: PD = PD_base x exp(alpha x v_transition)
  B. Merton DD    -- IFRS 9 compliance: Distance-to-default with stranded asset haircut
  C. Tabular      -- ESG band multipliers: low=1.05, medium=1.30, high=2.00, severe=3.25
  D. Multi-factor -- Portfolio aggregation: PD = PD_base x exp(alpha*v_T + beta*v_P + gamma*v_SG)

Dispatch logic selects method based on context:
  - 'realtime'  -> Branch A (Exponential)
  - 'ifrs9'     -> Branch B (Merton DD)
  - 'portfolio' -> Branch D (Multi-factor)
  - 'fallback'  -> Branch C (Tabular)
"""
import math
from typing import Dict, Optional, Tuple

# ---------------------------------------------------------------------------
# Sector risk coefficients (alpha_transition, beta_physical, gamma_sg)
# ---------------------------------------------------------------------------
SECTOR_COEFFICIENTS: Dict[str, Dict[str, float]] = {
    "Energy": {
        "alpha": 0.45, "beta": 0.30, "gamma": 0.15,
        "carbon_sensitivity": 0.85, "stranded_risk": 0.75,
    },
    "Materials": {
        "alpha": 0.35, "beta": 0.25, "gamma": 0.12,
        "carbon_sensitivity": 0.72, "stranded_risk": 0.55,
    },
    "Industrials": {
        "alpha": 0.25, "beta": 0.20, "gamma": 0.10,
        "carbon_sensitivity": 0.45, "stranded_risk": 0.30,
    },
    "Consumer Discretionary": {
        "alpha": 0.15, "beta": 0.15, "gamma": 0.12,
        "carbon_sensitivity": 0.25, "stranded_risk": 0.15,
    },
    "Consumer Staples": {
        "alpha": 0.12, "beta": 0.18, "gamma": 0.10,
        "carbon_sensitivity": 0.30, "stranded_risk": 0.10,
    },
    "Health Care": {
        "alpha": 0.08, "beta": 0.10, "gamma": 0.15,
        "carbon_sensitivity": 0.12, "stranded_risk": 0.05,
    },
    "Financials": {
        "alpha": 0.18, "beta": 0.12, "gamma": 0.20,
        "carbon_sensitivity": 0.30, "stranded_risk": 0.20,
    },
    "IT": {
        "alpha": 0.06, "beta": 0.08, "gamma": 0.12,
        "carbon_sensitivity": 0.10, "stranded_risk": 0.03,
    },
    "Communication Services": {
        "alpha": 0.05, "beta": 0.06, "gamma": 0.10,
        "carbon_sensitivity": 0.08, "stranded_risk": 0.02,
    },
    "Utilities": {
        "alpha": 0.40, "beta": 0.35, "gamma": 0.12,
        "carbon_sensitivity": 0.80, "stranded_risk": 0.65,
    },
    "Real Estate": {
        "alpha": 0.20, "beta": 0.30, "gamma": 0.08,
        "carbon_sensitivity": 0.35, "stranded_risk": 0.25,
    },
}

_DEFAULT_SECTOR = "Financials"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def normal_cdf(x: float) -> float:
    """Abramowitz-Stegun approximation of the standard normal CDF.

    Maximum absolute error ~7.5e-8 across the real line.  Mirrors the
    implementation used in dme-platform/lib/calculations.ts.
    """
    sign = 1.0
    if x < 0:
        sign = -1.0
        x = -x

    # Constants (Abramowitz & Stegun 26.2.17)
    p = 0.2316419
    b1 = 0.319381530
    b2 = -0.356563782
    b3 = 1.781477937
    b4 = -1.821255978
    b5 = 1.330274429

    t = 1.0 / (1.0 + p * x)
    t2 = t * t
    t3 = t2 * t
    t4 = t3 * t
    t5 = t4 * t

    pdf = math.exp(-0.5 * x * x) / math.sqrt(2.0 * math.pi)
    cdf_positive = 1.0 - pdf * (b1 * t + b2 * t2 + b3 * t3 + b4 * t4 + b5 * t5)

    if sign < 0:
        return 1.0 - cdf_positive
    return cdf_positive


# ---------------------------------------------------------------------------
# Branch A -- Exponential PD
# ---------------------------------------------------------------------------

def pd_exponential(pd_base: float, alpha: float, velocity_transition: float) -> float:
    """Branch A: PD = PD_base x exp(alpha x v_transition)"""
    return pd_base * math.exp(alpha * velocity_transition)


# ---------------------------------------------------------------------------
# Branch B -- Merton Distance-to-Default
# ---------------------------------------------------------------------------

def pd_merton_dd(
    asset_value: float,
    total_debt: float,
    risk_free_rate: float,
    volatility: float,
    time_horizon: float,
    stranded_haircut: float = 0.0,
) -> Dict[str, float]:
    """Branch B: Merton Distance-to-Default with stranded asset haircut.

    Returns dict with keys 'dd' (distance-to-default) and 'pd'.
    """
    adjusted_asset = asset_value * (1.0 - stranded_haircut)

    if adjusted_asset <= 0 or total_debt <= 0:
        return {"dd": 0.0, "pd": 1.0}

    sqrt_t = math.sqrt(time_horizon)
    d1 = (
        math.log(adjusted_asset / total_debt)
        + (risk_free_rate + 0.5 * volatility ** 2) * time_horizon
    ) / (volatility * sqrt_t)
    d2 = d1 - volatility * sqrt_t

    dd = d2
    pd = normal_cdf(-dd)
    return {
        "dd": round(dd, 4),
        "pd": min(0.9999, max(0.0001, round(pd, 6))),
    }


# ---------------------------------------------------------------------------
# Branch C -- Tabular (ESG band multiplier)
# ---------------------------------------------------------------------------

_ESG_BAND_MULTIPLIERS: Dict[str, float] = {
    "low": 1.05,
    "medium": 1.30,
    "high": 2.00,
    "severe": 3.25,
}


def pd_tabular(pd_base: float, esg_band: str) -> float:
    """Branch C: ESG band multiplier."""
    return pd_base * _ESG_BAND_MULTIPLIERS.get(esg_band, 1.0)


# ---------------------------------------------------------------------------
# Branch D -- Multi-factor
# ---------------------------------------------------------------------------

def pd_multifactor(
    pd_base: float,
    alpha_t: float, vel_t: float,
    beta_p: float, vel_p: float,
    gamma_s: float, vel_s: float,
) -> float:
    """Branch D: PD = PD_base x exp(alpha*v_T + beta*v_P + gamma*v_SG)"""
    return pd_base * math.exp(alpha_t * vel_t + beta_p * vel_p + gamma_s * vel_s)


# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------

def _esg_to_band(esg_score: float) -> str:
    """Map a 0-100 ESG score to a risk band label."""
    if esg_score >= 70:
        return "low"
    if esg_score >= 50:
        return "medium"
    if esg_score >= 30:
        return "high"
    return "severe"


def dispatch_pd(
    entity_data: Dict,
    velocity_data: Dict,
    context: str = "realtime",
    sector_coeffs: Optional[Dict[str, float]] = None,
) -> Dict:
    """Dispatch to the appropriate PD branch based on *context*.

    Parameters
    ----------
    entity_data : dict
        Must contain at least 'sector' and 'baseline_pd'.  For IFRS-9 also
        needs 'market_cap_usd_mn', 'total_debt_usd_mn', 'volatility', and
        optionally 'stranded_haircut'.
    velocity_data : dict
        Velocity inputs keyed as 'velocity_transition', 'velocity_physical',
        'velocity_sg', 'acceleration_reputational'.
    context : str
        One of 'realtime', 'ifrs9', 'portfolio', or anything else (fallback).
    sector_coeffs : dict or None
        Override for sector coefficients; looked up from SECTOR_COEFFICIENTS
        when *None*.

    Returns
    -------
    dict with method, baseline_pd, adjusted_pd, adjustment_bps, sector,
    coefficients.
    """
    sector = entity_data.get("sector", _DEFAULT_SECTOR)
    coeffs = sector_coeffs or SECTOR_COEFFICIENTS.get(
        sector, SECTOR_COEFFICIENTS[_DEFAULT_SECTOR]
    )
    pd_base: float = entity_data.get("baseline_pd", 0.02)  # 200 bps default

    if context == "realtime":
        vel_t = velocity_data.get("velocity_transition", 0)
        adjusted = pd_exponential(pd_base, coeffs["alpha"], vel_t)
        method = "exponential"

    elif context == "ifrs9":
        result = pd_merton_dd(
            entity_data.get("market_cap_usd_mn", 1000) * 1e6,
            entity_data.get("total_debt_usd_mn", 500) * 1e6,
            0.04,  # risk-free rate
            entity_data.get("volatility", 0.25),
            1.0,   # 1-year horizon
            entity_data.get(
                "stranded_haircut", coeffs["stranded_risk"] * 0.3
            ),
        )
        adjusted = result["pd"]
        method = "merton_dd"

    elif context == "portfolio":
        adjusted = pd_multifactor(
            pd_base,
            coeffs["alpha"], velocity_data.get("velocity_transition", 0),
            coeffs["beta"],  velocity_data.get("velocity_physical", 0),
            coeffs["gamma"], velocity_data.get("velocity_sg", 0),
        )
        method = "multifactor"

    else:
        # Fallback -- tabular
        esg = entity_data.get("esg_score", 50)
        band = _esg_to_band(esg)
        adjusted = pd_tabular(pd_base, band)
        method = "tabular"

    adjustment_bps = round((adjusted - pd_base) * 10_000)

    return {
        "method": method,
        "baseline_pd": pd_base,
        "adjusted_pd": min(0.9999, max(0.0001, round(adjusted, 6))),
        "adjustment_bps": adjustment_bps,
        "sector": sector,
        "coefficients": coeffs,
    }
