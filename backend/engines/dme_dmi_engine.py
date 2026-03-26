"""
DME Dynamic Materiality Index Engine
Source: dme-platform/lib/calculations.ts

DMI = 40% Impact + 40% Risk + 20% Opportunity

Regime classification via z-score:
  z <= 1.0  -> Normal
  z <= 2.0  -> Elevated
  z <= 3.0  -> Critical
  z >  3.0  -> Extreme

Provides velocity / acceleration helpers, EMA smoothing, portfolio-level
aggregation (weighted DMI, HHI concentration, regime rollup), and
Brinson-style marginal contribution decomposition.
"""
import math
from typing import Dict, List, Optional

# =========================================================================
# Time-series helpers
# =========================================================================

def calculate_velocity(current: float, previous: float, delta_t: float = 1.0) -> float:
    """First derivative: (current - previous) / delta_t."""
    if delta_t <= 0:
        return 0.0
    return (current - previous) / delta_t


def calculate_acceleration(
    current_vel: float,
    prev_vel: float,
    delta_t: float = 1.0,
) -> float:
    """Second derivative: (current_vel - prev_vel) / delta_t."""
    if delta_t <= 0:
        return 0.0
    return (current_vel - prev_vel) / delta_t


def ema_smooth(raw_value: float, prev_ema: float, alpha: float = 0.2) -> float:
    """Exponential moving average: alpha x raw + (1 - alpha) x prev."""
    return alpha * raw_value + (1.0 - alpha) * prev_ema


def calculate_z_score(value: float, mean: float, std_dev: float) -> float:
    """Standard z-score: (value - mean) / std_dev."""
    if std_dev <= 0:
        return 0.0
    return (value - mean) / std_dev


# =========================================================================
# Regime classification
# =========================================================================

def classify_regime(z_score: float) -> str:
    """Map z-score to regime label.

    Normal   : z <= 1.0
    Elevated : z <= 2.0
    Critical : z <= 3.0
    Extreme  : z >  3.0
    """
    if z_score <= 1.0:
        return "Normal"
    if z_score <= 2.0:
        return "Elevated"
    if z_score <= 3.0:
        return "Critical"
    return "Extreme"


# =========================================================================
# DMI calculation
# =========================================================================

_DEFAULT_WEIGHTS: Dict[str, float] = {
    "impact": 0.40,
    "risk": 0.40,
    "opportunity": 0.20,
}


def calculate_dmi(
    impact_score: float,
    risk_score: float,
    opportunity_score: float,
    weights: Optional[Dict[str, float]] = None,
) -> float:
    """DMI = w_impact x Impact + w_risk x Risk + w_opp x Opportunity."""
    w = weights or _DEFAULT_WEIGHTS
    return (
        impact_score * w.get("impact", 0.40)
        + risk_score * w.get("risk", 0.40)
        + opportunity_score * w.get("opportunity", 0.20)
    )


def concentration_adjusted_dmi(
    dmi: float,
    hhi: float,
    alpha_conc: float = 0.001,
) -> float:
    """Adjust DMI for portfolio concentration: DMI x (1 + alpha x HHI)."""
    return dmi * (1.0 + alpha_conc * hhi)


# =========================================================================
# Portfolio aggregation
# =========================================================================

def portfolio_weighted_dmi(holdings: List[Dict]) -> float:
    """Weight-averaged DMI across portfolio holdings.

    Each holding dict should contain 'weight' and 'dmi'.
    """
    total_weight = sum(h.get("weight", 0) for h in holdings) or 100.0
    return sum(
        h.get("weight", 0) / total_weight * h.get("dmi", 50)
        for h in holdings
    )


def portfolio_hhi(holdings: List[Dict]) -> float:
    """Herfindahl-Hirschman Index for portfolio concentration.

    HHI = sum( (w_i / total_w x 100)^2 ) for all holdings.
    """
    total_weight = sum(h.get("weight", 0) for h in holdings) or 100.0
    return sum(
        (h.get("weight", 0) / total_weight * 100.0) ** 2
        for h in holdings
    )


def portfolio_regime(holdings: List[Dict]) -> str:
    """Weight-averaged regime classification for a portfolio.

    Regime scores: Normal=1, Elevated=2, Critical=3, Extreme=4.
    Weighted average mapped back to regime label.
    """
    _scores = {"Normal": 1, "Elevated": 2, "Critical": 3, "Extreme": 4}
    total_weight = sum(h.get("weight", 0) for h in holdings) or 100.0
    weighted = sum(
        h.get("weight", 0)
        / total_weight
        * _scores.get(h.get("regime", "Normal"), 1)
        for h in holdings
    )
    if weighted >= 3.5:
        return "Extreme"
    if weighted >= 2.5:
        return "Critical"
    if weighted >= 1.5:
        return "Elevated"
    return "Normal"


# =========================================================================
# Marginal contribution (Brinson-style decomposition)
# =========================================================================

def marginal_contribution(
    holding_dmi: float,
    portfolio_dmi: float,
    holding_weight: float,
    benchmark_weight: float,
    benchmark_dmi: float,
) -> Dict[str, float]:
    """Brinson-style attribution of a single holding's DMI contribution.

    Returns selection, allocation, interaction, and total effects.
    """
    selection = (holding_dmi - benchmark_dmi) * holding_weight
    allocation = (holding_weight - benchmark_weight) * (benchmark_dmi - portfolio_dmi)
    interaction = (holding_weight - benchmark_weight) * (holding_dmi - benchmark_dmi)
    return {
        "selection": round(selection, 4),
        "allocation": round(allocation, 4),
        "interaction": round(interaction, 4),
        "total": round(selection + allocation + interaction, 4),
    }


# =========================================================================
# Entity-level DMI computation
# =========================================================================

def compute_entity_dmi(entity_data: Dict) -> Dict[str, float]:
    """Compute DMI for a single entity from its ESG / risk data.

    Inputs (from entity_data):
      - esg_score           : 0-100 (default 50)
      - transition_risk_score : 0-100 (default 50)
      - sbti_committed      : bool

    Returns dict with dmi, impact_score, risk_score, opportunity_score.
    """
    esg = entity_data.get("esg_score", 50)
    t_risk = entity_data.get("transition_risk_score", 50)
    sbti = 1 if entity_data.get("sbti_committed") else 0

    # Lower ESG + higher transition risk = higher impact
    impact_score = min(100, (100 - esg) * 0.6 + t_risk * 0.4)

    risk_score = min(100, t_risk * 0.5 + (100 - esg) * 0.3 + (1 - sbti) * 20)

    opportunity_score = min(
        100, esg * 0.5 + sbti * 30 + max(0, 100 - t_risk) * 0.2
    )

    dmi = calculate_dmi(impact_score, risk_score, opportunity_score)

    return {
        "dmi": round(dmi, 2),
        "impact_score": round(impact_score, 2),
        "risk_score": round(risk_score, 2),
        "opportunity_score": round(opportunity_score, 2),
    }
