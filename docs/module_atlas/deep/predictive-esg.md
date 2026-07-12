## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry sells this as an *ML rating-forecast*:
> `R̂(t+12) = ΣβᵢXᵢ(t) + ε`, "trained on 5-year panel", "L2 regularisation", MAE 4.2 pts from
> walk-forward validation, XGBoost/LightGBM ensemble with R²=0.871. **No model is trained in the
> code.** The page ships a `linearRegression()` / `solveLinearSystem()` (Gaussian-elimination OLS
> with ridge term) but **never calls it on real data** — every "model performance" figure (R², RMSE,
> MAE, calibration, residual scatter, learning curves) is either a hard-coded literal or a seeded
> synthetic draw. The actual score is a **deterministic weighted sum of 15 features with fixed SHAP
> weights** (`computeScore`), and the "12-month forecast", "momentum", and "pathway divergence" are
> `sr()`-generated. Sections below document the code as it behaves.

### 7.1 What the module computes

The live scoring engine (`computeScore`) is a **directed, weight-normalised feature aggregate**, not
a regression:

```js
norm      = (val − f.min) / (f.max − f.min)                         // 0–1 feature normalisation
directed  = f.direction===1 ? norm : f.direction===−1 ? 1−norm : 0.5  // "higher is better" flip
contrib   = directed × f.shapW                                       // weighted contribution
raw       = Σ contrib / Σ f.shapW                                    // weight-normalised aggregate
noise     = {xgboost:0.97, lightgbm:0.94, ensemble:1.00}[model]      // "model" is a flat scalar
base      = clamp(raw × 100 × noise, 5, 97)                          // headline ESG score
ci        = [base − ciW, base + ciW],  ciW = {xgboost:6, lightgbm:8, ensemble:5}[model]
```

So the three "models" differ only by a multiplicative constant (0.94/0.97/1.00) and a fixed
confidence-band half-width — there is no distinct fitted model behind XGBoost vs LightGBM.

### 7.2 Feature weights (the "SHAP" rubric)

15 features across three groups, each with a fixed weight `shapW` and a direction. Weights sum to
1.10 (not 1.0 — the aggregate divides by `Σ shapW` so this is harmless).

| Feature | Group | Dir | Range | shapW | Provenance |
|---|---|---|---|---|---|
| GHG Intensity | Climate | −1 | 0–500 tCO₂e/$M | 0.14 | synthetic weight |
| SBTi Commitment | Climate | +1 | 0–2 | 0.12 | synthetic weight |
| Transition Risk | Climate | −1 | 0–100 | 0.10 | synthetic weight |
| Net-Zero Proximity | Climate | +1 | −10…30 | 0.09 | synthetic weight |
| Scope 3 Coverage | Climate | +1 | 0–100 % | 0.08 | synthetic weight |
| Physical Risk | Climate | −1 | 0–100 | 0.07 | synthetic weight |
| TCFD Alignment | Climate | +1 | 0–4 | 0.06 | synthetic weight |
| Board Independence | Governance | +1 | 0–100 % | 0.09 | synthetic weight |
| ESG Controversy Count | Governance | −1 | 0–5 | 0.07 | synthetic weight |
| Sector ESG Average | Governance | +1 | 20–80 | 0.06 | synthetic weight |
| Biodiversity Commitment | Governance | +1 | 0–2 | 0.05 | synthetic weight |
| CDP Score | Data Quality | +1 | 0–100 | 0.08 | synthetic weight |
| Data Quality | Data Quality | +1 | 0–100 % | 0.05 | synthetic weight |
| Revenue (log) | Data Quality | 0 | 0–6 | 0.03 | direction 0 → flat 0.5 |
| Workforce (log) | Data Quality | 0 | 1–6 | 0.01 | direction 0 → flat 0.5 |

`direction:0` features (revenue, workforce) contribute a constant 0.5 regardless of value — they
add scale but no signal. The hard-coded "model metrics" (R² 0.847/0.831/0.871, RMSE 4.2/4.6/3.9,
MAE 3.1/3.4/2.9) in `TabModelPerformance` have **no derivation** in code.

### 7.3 Calculation walkthrough

1. **Feature entry** — user sets 15 sliders (Prediction Studio) or a seeded company is loaded.
2. **Directed normalisation** — each feature mapped to [0,1] then flipped for `direction −1`.
3. **Weighted aggregate** → `raw` ∈ [0,1]; ×100×noise → `base` (clamped 5–97).
4. **Tier** — `scoreTier`: ≥80 AAA, ≥70 AA, ≥60 A, ≥50 BBB, ≥40 BB, ≥30 B, else CCC.
5. **Consensus & delta** — for the 20-company table, `consensus = clamp(score + (sr(i·13+99)−0.5)·16, 10, 95)`; `delta = score − consensus` — i.e. the "consensus vs model" gap is pure noise.
6. **Forecast / momentum / pathway** — `pathwayData`, `divergenceScores`, residual scatter, learning curves are all `sr()`-seeded; none is produced by the scoring engine.

### 7.4 Worked example (Prediction Studio defaults, Ensemble)

Using the shipped defaults (GHG 100, SBTi 0, TransRisk 50, NZ 10, Scope3 40, Phys 35, TCFD 2, Board
55, Biodiv 0, Controv 1, SectorAvg 50, DataQ 50, CDP 45, Rev 3, Emp 3.5):

| Feature | norm | directed | ×shapW |
|---|---|---|---|
| GHG (−1) | 100/500=0.20 | 0.80 | 0.112 |
| SBTi (+1) | 0/2=0 | 0 | 0 |
| TransRisk (−1) | 0.50 | 0.50 | 0.050 |
| NZ (+1) | (10+10)/40=0.50 | 0.50 | 0.045 |
| Scope3 (+1) | 0.40 | 0.40 | 0.032 |
| Phys (−1) | 0.35 | 0.65 | 0.0455 |
| TCFD (+1) | 2/4=0.50 | 0.50 | 0.030 |
| Board (+1) | 0.55 | 0.55 | 0.0495 |
| Controv (−1) | 1/5=0.20 | 0.80 | 0.056 |
| SectorAvg (+1) | 30/60=0.50 | 0.50 | 0.030 |
| Biodiv (+1) | 0 | 0 | 0 |
| CDP (+1) | 0.45 | 0.45 | 0.036 |
| DataQ (+1) | 0.50 | 0.50 | 0.025 |
| Rev (0) | – | 0.50 | 0.015 |
| Emp (0) | – | 0.50 | 0.005 |

Σcontrib ≈ **0.5315**; Σ shapW = 1.10 → raw = 0.5315/1.10 = **0.483**. base = 0.483×100×1.00 =
**48.3** → tier **BBB**, CI [43.3, 53.3]. The "scenario improved" panel bumps SBTi +1, CDP +20,
TCFD +1 and recomputes: SBTi 0.06, CDP +0.016, TCFD +0.015 → +0.091 to Σcontrib → raw 0.567 → base
**56.7** (+8.4 pts), i.e. the what-if is fully deterministic.

### 7.5 Data provenance & limitations

- **All 20 companies, all forecasts, all model diagnostics are synthetic**, seeded by
  `sr(seed) = frac(sin(seed+1)×10⁴)`. Company feature vectors use `sr(i·37+fi·7)`.
- The OLS solver (`linearRegression`, ridge λ=0.001) is dead code — never fitted to a panel, so
  the guide's "trained on 5-year panel / L2 regularisation / walk-forward MAE 4.2" is aspirational.
- No time dimension: there is no `X(t)` → `R̂(t+12)`; "12-month forecast" bands are `sr()` offsets.
- Controversy "early warning" (guide) and RepRisk/NLP pipeline are not present in code.

**Framework alignment:** The rubric gestures at **MSCI ESG Ratings** (industry-relative key-issue
scoring) and **CDP/SBTi/TCFD** inputs as features, but implements none of their methodologies.
SHAP (Lundberg & Lee 2017) is invoked by name (`shapW`) yet the weights are fixed constants, not
Shapley values computed from a model. A genuine forecast would need §8.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Produce a 12-month-ahead ESG rating forecast `R̂(t+12)` and a controversy
early-warning probability for a coverage universe of listed issuers, supporting active-ownership
prioritisation and pre-emptive risk flags. Coverage: any issuer with ≥3 years of pillar history.

**8.2 Conceptual approach.** A **gradient-boosted panel regressor** on lagged ESG features, mirroring
(i) MSCI ESG momentum research and (ii) RepRisk/Sustainalytics controversy scoring, with **true SHAP
attribution** (TreeSHAP) for the per-feature contributions the UI already draws. Controversy warning
is a separate calibrated classifier on text-derived signals, benchmarked to RepRisk RRI dynamics.

**8.3 Mathematical specification.**
Regression target: change in rating, `Δ = R(t+12) − R(t)`, modelled by boosted trees
`Δ̂ = F_M(X(t)) = Σ_{m=1}^{M} ν·h_m(X(t))`, learning rate ν, M trees. Forecast `R̂(t+12) = clip(R(t)+Δ̂, 0,100)`.
Feature vector `X(t)` = current 15 features **plus** their 12- and 24-month deltas and a
controversy-velocity term `cv = (#events_{t−3m..t} − #events_{t−6m..t−3m})`.
Attribution: `φ_i = TreeSHAP_i(X)`, `Σφ_i + φ_0 = Δ̂` (exact additive, replaces `shapW`).
Controversy classifier: `p_ctrl = σ(w·z)`, `z` = NLP sentiment slope + event count + severity; calibrate with isotonic regression. Uncertainty: quantile boosting for the 10th/90th forecast band (replaces the fixed ±ciW).

| Parameter | Symbol | Value/source |
|---|---|---|
| Trees / depth / ν | M, d, ν | tune via CV; start M=500, d=4, ν=0.03 |
| Ridge/L2 on leaf | λ | grid-search 0.1–10 |
| History window | – | 5-yr monthly panel (guide's stated design) |
| Controversy source | – | RepRisk RRI / GDELT event stream |
| Pillar inputs | – | CDP, SBTi, TCFD alignment, MSCI key issues |

**8.4 Data requirements.** Monthly issuer panel: 15 pillar features + realised MSCI/Sustainalytics
rating history (label); controversy event log with date/severity; sector membership. Platform
already holds seeded analogues (`FEATURES`, `SECTORS`); production needs a real ratings feed
(MSCI/Sustainalytics) and RepRisk-equivalent event stream — neither present in `reference_data`.

**8.5 Validation & benchmarking.** Walk-forward CV (expanding window, 12-month test folds); report
MAE and rank-IC of `R̂(t+12)` vs realised rating; reconcile ordering against MSCI momentum tercile
returns. Controversy classifier: precision@k and Brier score vs realised downgrades. Stability:
PSI on feature distributions across folds.

**8.6 Limitations & model risk.** Ratings agencies revise methodology (label drift); boosted trees
extrapolate poorly on regime breaks → cap `Δ̂` and widen bands out-of-distribution. Controversy NLP
is language/coverage-biased. Conservative fallback: if inputs are stale (>6m), freeze `R̂ = R(t)`
and suppress the early-warning flag rather than emit a synthetic band.
