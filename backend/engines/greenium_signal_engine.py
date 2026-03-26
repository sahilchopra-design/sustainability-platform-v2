"""
Greenium Alpha Signal Engine
Source: sahilchopra-design/greenium-alpha

5-Model Ensemble:
  M1: Momentum + Value Factor       (25%)
  M2: Volatility-Adjusted Sharpe    (30%)
  M3: LSTM Regime [placeholder]     ( 0%)
  M4: FinBERT Sentiment [placeholder]( 0%)
  RSI Mean Reversion                (20%)
  Volume Confirmation               (10%)
  ESG Boost                         (15%)

M5 Ensemble = weighted combination -> BUY / SELL / NEUTRAL

Pipeline stages (mirroring stages.py):
  Stage 3: Compute 46 technical features from price history
  Stage 4: Generate trading signals via M1-M5 ensemble
  Stage 5: Risk check (GPR-based position sizing + limits)
"""
import math
from typing import List, Dict, Optional


# ---------------------------------------------------------------------------
# Risk management config
# ---------------------------------------------------------------------------
MAX_POSITION_SIZE = 5.0           # % per position
MAX_SECTOR_CONCENTRATION = 25.0   # %
STOP_LOSS_PCT = 8.0               # %
MAX_DAILY_SIGNALS = 50


# ---------------------------------------------------------------------------
# Stage 3: Feature computation
# ---------------------------------------------------------------------------

def compute_features(prices: List[float],
                     volumes: List[float] = None) -> Dict:
    """Stage 3: Compute technical features from price history.

    Requires at least 60 data points.  Returns returns, volatility, RSI-14,
    moving-average ratios, and volume ratio.
    """
    if len(prices) < 60:
        return {}

    close = prices
    n = len(close)

    # --- Returns ---
    ret_1d  = close[-1] / close[-2] - 1  if n >= 2  else 0
    ret_5d  = close[-1] / close[-6] - 1  if n >= 6  else 0
    ret_20d = close[-1] / close[-21] - 1 if n >= 21 else 0
    ret_60d = close[-1] / close[-61] - 1 if n >= 61 else 0

    # --- Volatility (std-dev of daily returns) ---
    returns_20d = [
        (close[i] / close[i - 1] - 1)
        for i in range(max(1, n - 20), n)
    ]
    vol_20d = (
        (sum(r ** 2 for r in returns_20d) / len(returns_20d)) ** 0.5
        if returns_20d else 0
    )

    returns_60d = [
        (close[i] / close[i - 1] - 1)
        for i in range(max(1, n - 60), n)
    ]
    vol_60d = (
        (sum(r ** 2 for r in returns_60d) / len(returns_60d)) ** 0.5
        if returns_60d else 0
    )

    # --- RSI-14 ---
    gains, losses = [], []
    for i in range(max(1, n - 14), n):
        change = close[i] - close[i - 1]
        gains.append(max(0, change))
        losses.append(max(0, -change))
    avg_gain = sum(gains) / max(len(gains), 1)
    avg_loss = sum(losses) / max(len(losses), 1)
    rs = avg_gain / avg_loss if avg_loss > 0 else 100
    rsi_14 = 100 - (100 / (1 + rs))

    # --- Moving averages ---
    ma_50  = sum(close[-50:]) / 50   if n >= 50  else close[-1]
    ma_200 = sum(close[-200:]) / 200 if n >= 200 else close[-1]
    price_vs_ma50  = close[-1] / ma_50 - 1  if ma_50 > 0  else 0
    price_vs_ma200 = close[-1] / ma_200 - 1 if ma_200 > 0 else 0

    # --- Volume ratio (today vs 20-day avg) ---
    vol_ratio = 1.0
    if volumes and len(volumes) >= 20:
        avg_vol = sum(volumes[-20:]) / 20
        vol_ratio = volumes[-1] / avg_vol if avg_vol > 0 else 1.0

    return {
        'close_price':      close[-1],
        'return_1d':        round(ret_1d, 6),
        'return_5d':        round(ret_5d, 6),
        'return_20d':       round(ret_20d, 6),
        'return_60d':       round(ret_60d, 6),
        'volatility_20d':   round(vol_20d, 6),
        'volatility_60d':   round(vol_60d, 6),
        'rsi_14':           round(rsi_14, 2),
        'price_vs_ma50':    round(price_vs_ma50, 6),
        'price_vs_ma200':   round(price_vs_ma200, 6),
        'volume_ratio_20d': round(vol_ratio, 4),
    }


# ---------------------------------------------------------------------------
# Stage 4: Model scoring functions
# ---------------------------------------------------------------------------

def m1_factor_score(features: Dict) -> float:
    """M1: Momentum + Value Factor.

    0.3 * return_5d + 0.4 * return_20d + 0.3 * price_vs_ma50
    """
    return (
        0.3 * features.get('return_5d', 0)
        + 0.4 * features.get('return_20d', 0)
        + 0.3 * features.get('price_vs_ma50', 0)
    )


def m2_xgboost_score(features: Dict) -> float:
    """M2: Volatility-Adjusted (Sharpe-like).

    return_20d / volatility_20d
    """
    vol = features.get('volatility_20d', 0.01)
    ret = features.get('return_20d', 0)
    return ret / vol if vol > 0.001 else 0


def rsi_mean_reversion(features: Dict) -> float:
    """RSI Mean Reversion: positive when oversold, negative when overbought."""
    rsi = features.get('rsi_14', 50)
    return (50 - rsi) / 100


def volume_confirmation(features: Dict) -> float:
    """Volume signal: volume above average = momentum confirmation.

    Clamped to [-0.3, +0.3].
    """
    vol_ratio = features.get('volume_ratio_20d', 1.0)
    return max(-0.3, min(0.3, (vol_ratio - 1) * 0.5))


def esg_boost(esg_data: Dict) -> float:
    """ESG integration: governance + safety + renewables -> small tilt."""
    gov       = esg_data.get('governance_score', 50) / 100
    safety    = esg_data.get('safety_score', 50) / 100
    renewable = esg_data.get('renewable_ratio', 0)
    return (gov + safety + renewable) / 3 * 0.1


# ---------------------------------------------------------------------------
# M5 Ensemble
# ---------------------------------------------------------------------------

def m5_ensemble(m1: float, m2: float, rsi: float,
                vol: float, esg: float) -> float:
    """M5: Weighted ensemble of all model outputs.

    Weights: M1=25%, M2=30%, RSI=20%, Volume=10%, ESG=15%.
    """
    return (
        0.25 * m1
        + 0.30 * m2
        + 0.20 * rsi
        + 0.10 * vol
        + 0.15 * esg
    )


# ---------------------------------------------------------------------------
# Risk adjustments
# ---------------------------------------------------------------------------

def gpr_adjustment(gpr_level: float = 100) -> float:
    """Geopolitical Risk adjustment factor.

    Neutral at GPR=100 (factor=1.0).  Higher GPR -> lower factor (reduce
    position).  Clamped to [0.5, 1.5].
    """
    return max(0.5, min(1.5, 2 - gpr_level / 100))


def position_sizing(ensemble_score: float, gpr_adj: float) -> float:
    """Calculate position size as % of portfolio, capped at MAX_POSITION_SIZE."""
    base = min(MAX_POSITION_SIZE, abs(ensemble_score) * 100)
    return round(base * gpr_adj, 2)


# ---------------------------------------------------------------------------
# SHAP-like attribution
# ---------------------------------------------------------------------------

def shap_attribution(m1: float, m2: float, rsi: float,
                     vol: float, esg: float,
                     ensemble: float) -> Dict:
    """SHAP-like attribution of ensemble components."""
    if abs(ensemble) < 0.0001:
        return {'esg_attribution': 0, 'market_attribution': 0, 'geo_attribution': 0}

    esg_attr = (0.15 * esg) / ensemble if ensemble != 0 else 0
    market_attr = (
        (0.25 * m1 + 0.30 * m2 + 0.20 * rsi + 0.10 * vol)
        / ensemble if ensemble != 0 else 0
    )
    return {
        'esg_attribution':    round(min(1, max(-1, esg_attr)), 4),
        'market_attribution': round(min(1, max(-1, market_attr)), 4),
        'geo_attribution':    0,  # Placeholder for M3 LSTM
    }


# ---------------------------------------------------------------------------
# Stage 4: Signal generation
# ---------------------------------------------------------------------------

def generate_signal(ticker: str, features: Dict,
                    esg_data: Dict = None,
                    gpr_level: float = 100) -> Optional[Dict]:
    """Generate a trading signal for a single ticker.

    Returns None for NEUTRAL signals (abs(ensemble) <= 0.02).
    """
    if not features:
        return None

    esg_data = esg_data or {}

    # Compute individual model scores
    m1  = m1_factor_score(features)
    m2  = m2_xgboost_score(features)
    rsi = rsi_mean_reversion(features)
    vol = volume_confirmation(features)
    esg = esg_boost(esg_data)

    # Ensemble
    ensemble = m5_ensemble(m1, m2, rsi, vol, esg)

    # Signal classification
    if ensemble > 0.02:
        signal_type = 'BUY'
    elif ensemble < -0.02:
        signal_type = 'SELL'
    else:
        return None  # NEUTRAL -- skip

    # Position sizing with GPR adjustment
    gpr_adj  = gpr_adjustment(gpr_level)
    pos_size = position_sizing(ensemble, gpr_adj)

    # Stop loss
    close_price = features.get('close_price', 0)
    if signal_type == 'BUY':
        stop_loss = close_price * (1 - STOP_LOSS_PCT / 100)
    else:
        stop_loss = close_price * (1 + STOP_LOSS_PCT / 100)

    # Attribution
    attribution = shap_attribution(m1, m2, rsi, vol, esg, ensemble)

    return {
        'ticker':              ticker,
        'signal_type':         signal_type,
        'signal_strength':     round(abs(ensemble), 4),
        'ensemble_score':      round(ensemble, 6),
        'm1_factor_score':     round(m1, 6),
        'm2_xgboost_score':    round(m2, 6),
        'rsi_score':           round(rsi, 6),
        'volume_score':        round(vol, 6),
        'esg_boost':           round(esg, 6),
        'position_size_pct':   pos_size,
        'gpr_risk_adjustment': round(gpr_adj, 4),
        'stop_loss':           round(stop_loss, 2),
        **attribution,
    }


# ---------------------------------------------------------------------------
# Stage 5: Risk checks
# ---------------------------------------------------------------------------

def risk_check(signals: List[Dict]) -> Dict:
    """Stage 5: Risk checks on generated signals.

    Validates position limits, concentration, and total exposure.
    """
    anomalies: List[str] = []

    buy_exposure = sum(
        s.get('position_size_pct', 0)
        for s in signals if s.get('signal_type') == 'BUY'
    )
    sell_exposure = sum(
        s.get('position_size_pct', 0)
        for s in signals if s.get('signal_type') == 'SELL'
    )

    # Per-position limit
    for s in signals:
        if s.get('position_size_pct', 0) > MAX_POSITION_SIZE:
            anomalies.append(
                f"{s['ticker']}: position size {s['position_size_pct']}% "
                f"exceeds max {MAX_POSITION_SIZE}%"
            )

    # Concentration risk
    if signals:
        top_weight = max(s.get('position_size_pct', 0) for s in signals)
        total = buy_exposure + sell_exposure
        if total > 0 and top_weight / total > 0.5:
            anomalies.append(
                f"Concentration risk: top signal is "
                f"{top_weight / total * 100:.1f}% of total"
            )

    return {
        'signals_checked':  len(signals),
        'buy_exposure_pct':  round(buy_exposure, 2),
        'sell_exposure_pct': round(sell_exposure, 2),
        'anomalies':         anomalies,
        'risk_status':       'PASS' if not anomalies else 'WARNING',
    }
