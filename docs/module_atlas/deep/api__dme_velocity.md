## 7 · Methodology Deep Dive

### 7.1 What the module computes

`/api/v1/dme-velocity` exposes the **DME Velocity Engine** (`backend/services/dme_velocity_engine.py`),
an EWMA-based rate-of-change monitor for ESG/materiality metric time series, ported from the Dynamic
Materiality Engine (DME). The engine's own docstring cites *FRS Section 3.1 — Velocity & Alert
Compound Conditions* as its design reference. A raw materiality series `M(t)` passes through a
six-stage pipeline; the formulas below are quoted from the code:

```
Stage 2  V(t)   = [M(t) − M(t−Δt)] / Δt                      (_canonical_velocity)
Stage 3  EWMA(t) = α·V(t) + (1−α)·EWMA(t−1)                  (_ewma, optional)
Stage 4  V%(t)  = [M(t) − M(t−1)] / M(t−1)                   (_percentage_velocity; 0 if M(t−1)=0)
Stage 5  z(t)   = [V(t) − mean(V)] / std(V, ddof=1)          (_z_score; 0 if std=0)
Stage 6  A(t)   = [M(t) − 2·M(t−1) + M(t−2)] / Δt²           (_canonical_acceleration)
         regime = f(|z|)                                      (classify_regime)
```

The engine is stateless: every request carries its own series/history, and outputs are per-point
`VelocityOutput` records (raw value, raw/pct/smoothed velocity, acceleration, z-score, regime,
`"{|z|:.1f}sigma"` label).

### 7.2 Parameterisation

Defaults come from the `VelocityConfig` Pydantic model (also returned by `GET /ref/config-defaults`):

| Parameter | Default | Bounds | Role |
|---|---|---|---|
| `ewma_alpha` | 0.2 | 0.01–1.0 | EWMA smoothing weight on the newest velocity |
| `lookback_days` | 252 | ≥ 10 | Nominal rolling window (declared; the series call actually uses the full submitted series) |
| `z_threshold_elevated` | 1.0 | — | ELEVATED regime boundary |
| `z_threshold_critical` | 2.0 | — | CRITICAL regime boundary |
| `z_threshold_extreme` | 3.0 | — | EXTREME regime boundary |
| `delta_t` | 1.0 | > 0 | Time step for velocity/acceleration denominators |

Regime rubric (`classify_regime`, mirrored by `GET /ref/regimes`):

| Regime | Condition |
|---|---|
| NORMAL | \|z\| < 1.0 |
| ELEVATED | 1.0 ≤ \|z\| < 2.0 |
| CRITICAL | 2.0 ≤ \|z\| < 3.0 |
| EXTREME | \|z\| ≥ 3.0 |

Alert rubric (`classify_alert_level`, `POST /classify-alert`) implements the FRS §3.1 **compound
condition** `V > k·σ AND A > 0`: if `acceleration ≤ 0` the function returns `None` (no alert
regardless of z); otherwise \|z\| ≥ 4.0 → EXTREME, ≥ 3.0 → CRITICAL, ≥ 2.0 → ELEVATED, ≥ 1.5 → WATCH,
else `None`. Note the alert tiers (1.5/2/3/4σ) are deliberately stricter than the regime tiers
(1/2/3σ) — an alert requires both a large z **and** positive acceleration (the metric is still
speeding up, not decelerating after a jump).

### 7.3 Calculation walkthrough

**`POST /process-series`** — sorts the submitted `data_points` by timestamp (≥ 2 required, else empty
result), computes velocities for indices 1…n−1, applies EWMA only when `apply_smoothing=true` **and**
there are ≥ 3 velocities, computes percentage velocities, then z-scores. Z-scores need ≥ 20
velocity observations (`min_obs = 20`); with fewer, every z is forced to 0.0 and all points read
NORMAL. Acceleration is `None` for the first velocity point (no `M(t−2)` yet). The route wraps the
per-point outputs with `get_regime_summary`: regime counts, percentage distribution
(`count/total×100`, guarded by `total = len(outputs) or 1`), latest regime and latest z.

**`POST /process-single`** — real-time mode: caller supplies `current_value`, `previous_value` and
an optional `historical_velocities` array. z is computed only if ≥ 20 historical velocities are
supplied (mean/std over that array, `ddof=1`); otherwise z = 0 → NORMAL. No acceleration or
smoothing in this mode (both stay `None`).

### 7.4 Worked example (process-single)

Current value 78, previous 72, Δt = 1, historical velocities: 20 observations with mean 1.0 and
sample std 2.0.

| Step | Computation | Result |
|---|---|---|
| Canonical velocity | (78 − 72) / 1 | **+6.0** |
| Percentage velocity | (78 − 72) / 72 | **+8.33%** |
| z-score | (6.0 − 1.0) / 2.0 | **2.50** |
| Regime | 2.0 ≤ 2.50 < 3.0 | **CRITICAL** |
| Sigma label | `f"{2.5:.1f}sigma"` | **"2.5sigma"** |

If the same point were fed to `/classify-alert` with `acceleration = +1.2`: \|z\| = 2.5 falls in
[2.0, 3.0) → **ELEVATED** alert (stricter alert ladder). With `acceleration = −0.4` the compound
condition fails and the alert level is `None` even though the regime is CRITICAL.

### 7.5 API surface

| Endpoint | Behaviour |
|---|---|
| `POST /process-series` | Full 6-stage pipeline + regime summary over a submitted series |
| `POST /process-single` | One observation vs caller-supplied velocity history |
| `POST /classify-alert` | FRS §3.1 compound alert tier from (velocity, acceleration, z) |
| `GET /ref/config-defaults` | Default `VelocityConfig` |
| `GET /ref/regimes` | Regime thresholds + pipeline-stage description |

### 7.6 Data provenance & limitations

- The engine carries **no seed data at all** — it is a pure calculator; all series are
  caller-supplied. There is consequently no `sr(seed)` synthetic-data concern on the backend
  (any demo series originate in the calling frontend).
- The z-score uses the **whole submitted series** as the normalisation window, not a rolling
  `lookback_days` window — `lookback_days=252` is declared in config but never consumed in
  `process_series`. A production rolling-window implementation would give time-varying z.
- `ddof=1` (sample std) is used consistently; std = 0 or `M(t−1) = 0` are guarded to 0.
- The < 20-observation fallback silently reports NORMAL/0σ, which can mask genuine spikes in
  short series — a limitation, not a bug, but worth flagging to consumers.
- "FRS Section 3.1" is an internal DME functional-requirements spec, not a public standard; its
  compound-condition thresholds (1.5/2/3/4σ) are design choices, not calibrated from data.

### 7.7 Framework alignment

- **EWMA volatility/monitoring practice (RiskMetrics tradition):** the α-weighted recursive
  smoother is the same estimator J.P. Morgan RiskMetrics popularised for volatility (there with
  λ = 1 − α = 0.94 daily); here it smooths metric velocity rather than squared returns.
- **Statistical process control (SPC / Shewhart-style σ bands):** the 1σ/2σ/3σ regime ladder
  mirrors classic control-chart zones; the compound alert (level shift + positive acceleration)
  resembles Western-Electric-style run rules adapted to first/second derivatives.
- **Double materiality monitoring (CSRD/ESRS context):** the engine operationalises "dynamic
  materiality" — detecting when an ESG topic's materiality score is moving fast enough to warrant
  reassessment — a concept discussed by WEF/Accountancy Europe, though no disclosure standard
  prescribes this specific velocity mathematics.
