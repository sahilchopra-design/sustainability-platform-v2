## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code (and frontend↔backend) mismatch flag.** The guide names an *Alert Priority Score*
> `APS = Materiality × Momentumβ × Coverage`. The **backend engine** (`dme_alert_engine.py`) actually
> implements a rigorous, different model — a **four-tier z-score velocity framework** with a
> 30/20/30/20 priority score. But the **frontend page does not call that engine**: it generates alerts
> client-side from `GLOBAL_COMPANY_MASTER` fields using threshold rules and a hash-seeded PRNG, and
> fabricates `estimated_pd_impact` / `estimated_var_impact` with ad-hoc scaling constants. Below,
> §7.1–7.3 document the real backend engine (the production logic) and §7.4 the frontend's heuristic
> alert generation. The PD/VaR impacts shown on-screen have **no validated model behind them** →
> triggers the §8 spec.

### 7.1 Backend engine — four-tier velocity framework (real)

```python
classify_tier(z, acceleration, thresholds):
    if acceleration is not None and acceleration <= 0: return None   # compound gate: A>0 required
    abs_z = |z|
    EXTREME  if abs_z ≥ 4.0   ; CRITICAL if abs_z ≥ 3.0
    ELEVATED if abs_z ≥ 2.0   ; WATCH    if abs_z ≥ 1.5   ; else None
priority_score = 0.30·norm(Z_V) + 0.20·norm(Z_A) + 0.30·norm(exposure) + 0.20·norm(sensitivity)
    norm(Z_V)=min(|Z_V|,4)/4·100 ; norm(Z_A)=min(|Z_A|,3)/3·100 ;
    norm(exp)=exposure_share·100 ; norm(sens)=min(α,0.30)/0.30·100
priority_band: ≤25 LOW, ≤50 MEDIUM, ≤75 HIGH, else CRITICAL
SLA_hours = {LOW 72, MEDIUM 24, HIGH 4, CRITICAL 0}
```

This is a **compound velocity+acceleration alert**: a metric's rate-of-change z-score must exceed the
tier threshold *and* its acceleration must be positive (worsening) — a genuine, defensible signal
design with suppression windows (WATCH 48h → EXTREME 0h) to prevent alert fatigue.

### 7.2 Backend parameterisation

| Element | Value | Provenance |
|---|---|---|
| Tier thresholds (σ) | WATCH 1.5, ELEVATED 2.0, CRITICAL 3.0, EXTREME 4.0 | standard control-chart z-bands |
| Priority weights | Z_V 0.30, Z_A 0.20, exposure 0.30, sensitivity 0.20 | engine design |
| Priority bands | 0-25 / 26-50 / 51-75 / 76-100 | engine |
| SLA hours | 72 / 24 / 4 / 0 | ops policy |
| Suppression hours | 48 / 24 / 4 / 0 | ops policy |

### 7.3 Backend calculation walkthrough

`process_signal` looks up any per-factor rule (thresholds override), classifies the tier from
`z_velocity` + `acceleration`, computes the priority score from the four normalised inputs, maps to a
band and SLA, and emits an `AlertRecord` with a UUID alert id. `process_batch` runs many signals and
returns tier-breakdown counts. The engine is **stateless** — suppression state lives in the DB.

### 7.4 Frontend — heuristic alert generation (what the page shows)

The page **does not** post to `/process-batch`. Instead `generateAlerts(companies)` scans
`GLOBAL_COMPANY_MASTER` and emits alerts on fixed field thresholds, deriving impacts by ad-hoc scaling:

| Rule | trigger | tier logic | est_pd_impact | est_var_impact |
|---|---|---|---|---|
| Transition risk | `transition_risk_score > 70` | >85 Extreme, >78 Critical, else Elevated | `TR × 0.5` | `exposure × 0.01 × TR/100` |
| ESG critically low | `esg_score < 30` | Critical | `(50−ESG) × 0.3` | `exposure × 0.015` |
| GHG intensity | `ghgInt > 500` | >1000 Extreme else Elevated | `ghgInt × 0.002` | `exposure × ghgInt × 1e-5` |
| No SBTi + high S1 | `!sbti ∧ scope1 > 5` | Watch | `0.5` (flat) | `exposure × 0.005` |

`exposure = market_cap × (0.01 + sr(hash)·0.04)` — the exposure base is **seeded** (1–5% of market cap
via `sr(hashStr(ticker))`). The `trigger_z_score` fields are pseudo-z's (`(score−50)/15` etc.), not the
backend's true velocity z-scores. The PD/VaR scaling constants (0.5, 0.3, 0.002, 0.01…) are arbitrary.

### 7.5 Worked example (frontend)

Company with `transition_risk_score = 82`, `market_cap = 4000`, `sr(hash)=0.5`:
- `exposure = 4000 × (0.01 + 0.5·0.04) = 4000 × 0.03 = $120M`.
- Tier: 82 > 78 → **Critical**. `trigger_z = (82−50)/15 = 2.13`.
- `est_pd_impact = 82 × 0.5 = 41.0` (bp? %? — units undefined).
- `est_var_impact = 120 × 0.01 × 82/100 = 120 × 0.0082 = $0.98M`.
These numbers populate the KPIs (`totalPD`, `totalVaR`) — but they are heuristic scalings, not outputs
of any credit model. A model-validation team would reject `PD = transition_risk × 0.5` outright.

### 7.6 Data provenance & limitations

- Backend engine is **real and sound** but **not wired to the page**. Frontend alerts run off
  `GLOBAL_COMPANY_MASTER` (mixed real/curated) with `sr()`-seeded exposure and hard-coded impact
  scalings.
- PD/VaR "impacts" have no term structure, no calibration, and undefined units — purely illustrative.
- The two systems use different methodologies (compound velocity z-score vs static field thresholds),
  so the on-screen figures are not what the documented engine would produce.

## 8 · Model Specification

**Status: specification — not yet implemented in code (on the frontend path).** The backend engine's
tiering is production-grade for *signal detection*, but the **PD/VaR impact translation** shown to
users is unmodelled. This spec covers the missing link: converting a materiality velocity alert into a
calibrated credit-risk repricing.

**8.1 Purpose & scope.** Given a DME velocity alert on an entity/factor, estimate the ΔPD and ΔVaR it
implies for exposures to that entity, for risk-owner triage and limit management.

**8.2 Conceptual approach.** Map the alert's z-scored materiality shock to a rating/PD migration via a
**factor-sensitivity (beta) model**, then to VaR via exposure × LGD × ΔPD — mirroring Moody's
climate-adjusted EDF (materiality shock → asset-value drift → PD) and Aladdin transition-risk
repricing. Wire the frontend to the real backend `process_batch` for tiering; add this repricing layer
on top.

**8.3 Mathematical specification.**
```
shock_z   = alert.velocity_z_score                       # from backend engine
ΔPD       = PD₀ · (exp(β_f · shock_z · σ_f) − 1)         # factor-beta PD lift, capped
            β_f = entity's sensitivity to factor f (sensitivity_alpha), σ_f = factor vol
ΔVaR      = EAD · LGD · ΔPD · horizon_adj                # incremental credit VaR
priority  = backend PS (0.30 Z_V + 0.20 Z_A + 0.30 exp + 0.20 sens)   # already implemented
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Baseline PD | PD₀ | internal rating / Moody's EDF |
| Factor beta | β_f | regression of PD moves on ESG-factor shocks (NGFS/EBA data) |
| Factor volatility | σ_f | historical materiality-score vol |
| LGD | LGD | Basel/IFRS 9 downturn LGD |
| Exposure | EAD | portfolio holdings (`portfolio_holdings`) |

**8.4 Data requirements.** Entity PD₀, factor betas, EAD/LGD from `portfolio_holdings`, and the live
velocity signals feeding the backend engine. Reuse `climate-credit-integration` for the PD/LGD
conditioning machinery.

**8.5 Validation & benchmarking.** Backtest: do entities that triggered CRITICAL/EXTREME alerts show
subsequent rating downgrades or spread widening? Reconcile ΔPD against Moody's climate-adjusted EDF and
ΔVaR against the platform's `climate-credit-integration` ECL uplift for the same shock.

**8.6 Limitations & model risk.** Factor betas are noisy and regime-dependent; cap ΔPD and floor at
zero. Alert velocity z-scores can spike on data artefacts — require the compound A>0 gate (already in
the engine) plus a minimum coverage threshold before repricing. Conservative fallback: surface the
tier/priority (validated) and label PD/VaR as "indicative, pending model calibration" until betas are
backtested.

**Framework alignment:** the backend engine reflects statistical process-control z-banding; the
repricing spec aligns with **NGFS** transition-risk transmission, **Moody's/KMV EDF** structural PD,
Basel/**IFRS 9** ECL (EAD × LGD × PD), and BlackRock Aladdin-style factor repricing — the frameworks
the guide's APS gestures at but does not implement.
