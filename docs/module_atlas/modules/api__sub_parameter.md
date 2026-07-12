# Api::Sub_Parameter
**Module ID:** `api::sub_parameter` · **Route:** `/api/v1/sub-parameter` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/sub-parameter/parameters` | `list_analyzable_parameters` | api/v1/routes/sub_parameter.py |
| POST | `/api/v1/sub-parameter/sensitivity-analysis` | `sensitivity_analysis` | api/v1/routes/sub_parameter.py |
| POST | `/api/v1/sub-parameter/what-if` | `what_if_analysis` | api/v1/routes/sub_parameter.py |
| POST | `/api/v1/sub-parameter/what-if/batch` | `what_if_batch` | api/v1/routes/sub_parameter.py |
| POST | `/api/v1/sub-parameter/attribution` | `attribution_analysis` | api/v1/routes/sub_parameter.py |
| GET | `/api/v1/sub-parameter/interactions/{scenario_id}` | `interaction_analysis` | api/v1/routes/sub_parameter.py |
| POST | `/api/v1/sub-parameter/interaction-matrix` | `interaction_matrix` | api/v1/routes/sub_parameter.py |
| GET | `/api/v1/sub-parameter/visualization/tornado/{scenario_id}` | `viz_tornado` | api/v1/routes/sub_parameter.py |
| GET | `/api/v1/sub-parameter/visualization/waterfall/{scenario_id}` | `viz_waterfall` | api/v1/routes/sub_parameter.py |
| POST | `/api/v1/sub-parameter/elasticity` | `elasticity_analysis` | api/v1/routes/sub_parameter.py |
| POST | `/api/v1/sub-parameter/partial-correlation` | `partial_corr` | api/v1/routes/sub_parameter.py |
| POST | `/api/v1/sub-parameter/ols-attribution` | `ols_attribution` | api/v1/routes/sub_parameter.py |
| POST | `/api/v1/sub-parameter/shapley` | `shapley_attribution` | api/v1/routes/sub_parameter.py |
| POST | `/api/v1/sub-parameter/export` | `export_analyses` | api/v1/routes/sub_parameter.py |
| POST | `/api/v1/sub-parameter/custom-scenario/{cs_id}/analysis` | `analyze_custom_scenario` | api/v1/routes/sub_parameter.py |
| GET | `/api/v1/sub-parameter/custom-scenario/{cs_id}/key-drivers` | `custom_key_drivers` | api/v1/routes/sub_parameter.py |

### 2.3 Engine `analysis_export` (services/analysis_export.py)
| Function | Args | Purpose |
|---|---|---|
| `export_analysis_excel` | analyses | Export analysis results to Excel. |
| `export_analysis_pdf` | analyses | Export analysis results to PDF. |
| `export_analysis_json` | analyses | Export raw analysis data as JSON. |

### 2.3 Engine `sub_parameter_engine` (services/sub_parameter_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_extract_metric` | impacts, metric_key | Extract a metric value from nested impacts dict. |
| `_get_matching_trajs` | base_trajs, param_name | Find trajectories matching a parameter name pattern. |
| `run_sensitivity_analysis` | base_trajs, target_metric, parameters, variation_range, analysis_type | Run sensitivity analysis on scenario parameters. Varies each parameter ±variation_range and measures impact on target metric. |
| `run_what_if` | base_trajs, changes | What-if analysis: apply changes and compare to baseline. changes: [{"parameter": str, "change_type": "absolute"/"relative", "change_value": float, "apply_year": int}] |
| `run_attribution` | base_trajs, outcome_metric | Shapley-inspired attribution: estimate each parameter's contribution to outcome. Uses marginal contribution approach. |
| `run_interaction_analysis` | base_trajs, parameters | Pairwise interaction analysis between parameters. Tests if joint effect differs from sum of individual effects. |
| `get_visualization_tornado` | base_trajs, target_metric, top_n | Pre-formatted tornado chart data. |
| `get_visualization_waterfall` | base_trajs, customizations | Waterfall chart showing step-by-step parameter impact. |
| `run_elasticity_analysis` | base_trajs, target_metric, parameters, delta_pct | Elasticity analysis: (% change in outcome) / (% change in parameter). A 1% increase in each parameter → how much does the outcome change? |
| `_interpret_elasticity` | e, param |  |
| `run_partial_correlation` | base_trajs, target_metric, parameters | Partial correlation: isolate each parameter's independent effect, controlling for all other parameters. Uses sequential residualization approach. |
| `run_ols_attribution` | base_trajs, target_metric, parameters | OLS regression-based attribution. Fits a linear model: outcome = β₀ + β₁x₁ + β₂x₂ + ... + ε Returns coefficients as attribution weights. |
| `_solve_linear` | A, b, n | Solve Ax = b via Gaussian elimination. |
| `run_enhanced_shapley` | base_trajs, target_metric, parameters, n_permutations | Enhanced Shapley attribution with permutation sampling. Approximates Shapley values by sampling random orderings. |
| `get_key_drivers` | base_trajs, top_n | Get top N parameters driving scenario outcomes across all metrics. |

**Engine `sub_parameter_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `ANALYZABLE_PARAMS` | `[{'name': 'Emissions\|CO2', 'label': 'CO2 Emissions', 'unit': 'Gt/yr', 'default_range': 0.3}, {'name': 'Price\|Carbon', 'label': 'Carbon Price', 'unit': 'USD/tCO2', 'default_range': 0.4}, {'name': 'GDP\|PPP', 'label': 'GDP', 'unit': 'billion USD', 'default_range': 0.15}, {'name': 'Primary Energy', '` |
| `TARGET_METRICS` | `{'temperature': 'temperature_outcome.by_2100', 'risk_physical': 'risk_indicators.physical_risk_score', 'risk_transition': 'risk_indicators.transition_risk_score', 'risk_overall': 'risk_indicators.overall_climate_risk'}` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`

**Database tables:** `db` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sub-parameter/custom-scenario/{cs_id}/key-drivers** — status `failed`, provenance ['db-empty'], source tables: `custom_scenarios_v2`
Output: `None`

**GET /api/v1/sub-parameter/interactions/{scenario_id}** — status `failed`, provenance ['db-empty'], source tables: `hub_scenarios`
Output: `None`

**GET /api/v1/sub-parameter/parameters** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['parameters'], 'n_keys': 1}`

**GET /api/v1/sub-parameter/visualization/tornado/{scenario_id}** — status `failed`, provenance ['db-empty'], source tables: `hub_scenarios`
Output: `None`

**GET /api/v1/sub-parameter/visualization/waterfall/{scenario_id}** — status `failed`, provenance ['db-empty'], source tables: `hub_scenarios`
Output: `None`

**POST /api/v1/sub-parameter/attribution** — status `failed`, provenance ['db-empty'], source tables: `hub_scenarios`
Output: `None`

**POST /api/v1/sub-parameter/custom-scenario/{cs_id}/analysis** — status `failed`, provenance ['db-empty'], source tables: `custom_scenarios_v2`
Output: `None`

**POST /api/v1/sub-parameter/elasticity** — status `failed`, provenance ['db-empty'], source tables: `hub_scenarios`
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `analysis_export` — extracted transformation lines:**
```python
doc = SimpleDocTemplate(filepath, pagesize=A4, leftMargin=25*mm, rightMargin=25*mm)
```

**Engine `sub_parameter_engine` — extracted transformation lines:**
```python
low_vals = {y: round(v * (1 - variation_range), 4) for y, v in ts.items() if isinstance(v, (int, float))}
high_vals = {y: round(v * (1 + variation_range), 4) for y, v in ts.items() if isinstance(v, (int, float))}
swing = abs(high_val - low_val)
contribution = baseline_val - zero_val
unexplained = max(0, abs(baseline_val) - explained) if baseline_val != 0 else 0
high_vals = {y: round(v * (1 + variation), 4) for y, v in ts.items() if isinstance(v, (int, float))}
expected = e1 + e2
high_vals = {y: round(v * (1 + variation), 4) for y, v in ts.items() if isinstance(v, (int, float))}
joint_val = (_extract_metric(joint_impacts, metric_key) or baseline_val) - baseline_val
interaction_effect = joint_val - expected
strength = abs(interaction_effect) / max(abs(expected), 0.001)
delta = new_val - baseline_temp
perturbed = {y: round(v * (1 + delta_pct / 100), 4) for y, v in ts.items() if isinstance(v, (int, float))}
outcome_pct_change = (new_val - baseline_val) / abs(baseline_val) * 100
elasticity = outcome_pct_change / delta_pct
cov = sum((x - x_mean) * (y - y_mean) for x, y in zip(x_vals, Y)) / (len(Y) - 1)
corr = cov / (x_std * y_std)
X_aug = [[1.0] + row for row in X_data]
XtX = [[sum(X_aug[i][r] * X_aug[i][c] for i in range(n)) for c in range(m)] for r in range(m)]
XtY = [sum(X_aug[i][r] * Y_data[i] for i in range(n)) for r in range(m)]
beta = [0.0] * m
y_mean = sum(Y_data) / n
ss_tot = sum((y - y_mean) ** 2 for y in Y_data)
y_pred = [sum(X_aug[i][j] * beta[j] for j in range(m)) for i in range(n)]
ss_res = sum((Y_data[i] - y_pred[i]) ** 2 for i in range(n))
r_squared = 1 - ss_res / ss_tot if ss_tot > 0 else 0
b = beta[i + 1]
aug = [A[i][:] + [b[i]] for i in range(n)]
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the domain computes

`/api/v1/sub-parameter` (`sub_parameter_engine.py`, plus `analysis_export.py` for CSV/JSON export)
is the **sensitivity / attribution toolkit** layered on the scenario hub: every method perturbs a
scenario's variable trajectories and re-runs the hub's impact model
(`builder_engine.calculate_impacts`) to measure the response of a target metric. Seven analytical
methods:

| Method | Core computation |
|---|---|
| Sensitivity / tornado | ±20 % (default) on each parameter's full time-series; `swing = \|high − low\|`; `sensitivity_score = swing/\|baseline\| × 100` |
| What-if | Apply absolute or from-year-onwards relative changes; report Δ for all 4 target metrics + auto-insights (\|Δ%\| > 5) |
| Attribution (leave-one-out) | Zero a parameter's trajectory; `contribution = baseline − zeroed`; normalise by Σ\|contributions\| |
| Elasticity | 1 % bump; `elasticity = %Δoutcome / %Δparameter`, banded negligible/inelastic/unit/elastic (0.01/0.5/1.5) |
| Partial correlation | 50 Monte-Carlo samples, factors U(0.8, 1.2), Pearson correlation factor↔outcome |
| OLS attribution | 80 samples, factors U(0.7, 1.3); normal-equation OLS with intercept via Gaussian elimination; R², coefficient weights |
| Shapley (permutation) | 20 random orderings; average marginal contribution of switching each parameter to +20 % |

Visualisation endpoints pre-shape tornado (top-10 bars) and waterfall (per-customisation
temperature deltas, cumulated) payloads; `key-drivers` sums sensitivity scores across the
temperature and overall-risk metrics.

### 7.2 Parameterisation

**Analysable parameters** (`ANALYZABLE_PARAMS`, IAMC-style variable names with default variation
ranges): `Emissions\|CO2` 0.3, `Price\|Carbon` 0.4, `GDP\|PPP` 0.15, `Primary Energy` 0.2, Coal
0.4, Gas 0.25, Solar 0.5, Wind 0.5, `Emissions\|CO2\|Energy` 0.3. (Note: the per-parameter
`default_range` values are declared but the analysis methods use a single global
`variation_range`, default 0.2.)

**Target metrics** (`TARGET_METRICS` → paths in the hub impact output): temperature
(`temperature_outcome.by_2100`), physical / transition / overall climate-risk scores.

**Sampling constants:** partial correlation `Random(123)`, n = 50, U(0.8, 1.2); OLS `Random(456)`,
n = 80, U(0.7, 1.3); Shapley `Random(789)`, 20 permutations, +20 % switch-on. Interaction analysis:
first 5 parameters, +20 %, `strength = \|joint − (e1+e2)\|/\|e1+e2\|`, type synergistic/antagonistic
when strength > 0.1 else independent. Attribution confidence is a hard-coded 0.7 per row.

### 7.3 Calculation walkthrough

1. Parameter matching is a case-insensitive substring match of the parameter name against the
   scenario's trajectory variable names; the **first** match is perturbed.
2. Every method builds `customized_values` dicts (year → scaled value) and calls
   `calculate_impacts(base_trajs, customizations)` — the impact model itself (temperature and risk
   scoring) lives in `builder_engine`, so this engine measures *that model's* local response
   surface, not the climate system's.
3. Division guards use `max(\|x\|, 0.001)` throughout; missing metrics fall back to the baseline
   value, so absent trajectories degrade to zero swing rather than errors.
4. `analysis_export.py` serialises any analysis result to CSV/JSON for download.

### 7.4 Worked example — elasticity of temperature to carbon price

Suppose the hub's baseline gives `temperature_outcome.by_2100 = 2.400 °C`, and raising the entire
`Price\|Carbon` trajectory by 1 % re-runs to 2.394 °C:

| Step | Computation | Result |
|---|---|---|
| Outcome % change | (2.394 − 2.400)/2.400 × 100 | −0.25 % |
| Elasticity | −0.25 / 1.0 | **−0.25** |
| Interpretation band | \|−0.25\| < 0.5 | "Inelastic: 1 % change in Price\|Carbon decreases outcome by 0.25 %" |

In a tornado run at ±20 % the same parameter would produce `low = 2.46`, `high = 2.35`
(say), `swing = 0.11`, `sensitivity_score = 0.11/2.40 × 100 = 4.58`, ranked against the other
eight parameters.

### 7.5 Data provenance & limitations

- **Seeded `random.Random` sampling (123/456/789)** is used for the partial-correlation, OLS, and
  Shapley estimators. This is *legitimate Monte-Carlo experimental design* (deterministic,
  reproducible), not the `sr(seed)` data-fabrication pattern — the randomness generates
  perturbation factors, and every outcome is a real model evaluation. Fixed seeds mean repeated
  API calls return identical estimates.
- Results are only as good as the underlying `calculate_impacts` reduced-form model; sensitivities
  are local (one-at-a-time or small samples) and can miss strong non-linearities beyond ±20–30 %.
- "Partial correlation" is actually *simple* Pearson correlation on jointly-varied factors
  (independent uniform draws make this a reasonable proxy, but no residualisation is performed
  despite the docstring's claim).
- Shapley with 20 permutations over ≤9 parameters is a coarse approximation (no convergence
  diagnostics); leave-one-out attribution "zeroing" a trajectory is a structural counterfactual
  (zero coal energy) rather than a marginal one, and `unexplained_pct` conflates level vs change
  attribution.
- Substring parameter matching can silently pick the wrong trajectory (e.g. `Primary Energy`
  matches `Primary Energy\|Coal` first if ordering differs).

### 7.6 Framework alignment

- **IAMC / NGFS variable taxonomy** — parameter names (`Emissions\|CO2`, `Price\|Carbon`,
  `Primary Energy\|Solar`…) follow the IAMC template used by the NGFS Scenario Explorer, so the
  toolkit plugs directly into ingested NGFS trajectories.
- **Tornado / one-at-a-time sensitivity analysis** — the standard first-line global-sensitivity
  screen in model risk management (SR 11-7 expects sensitivity testing of key model parameters).
- **Shapley value attribution** — the game-theoretic allocation (average marginal contribution
  over orderings) approximated here by permutation sampling, the same estimator popularised by
  SHAP in ML explainability.
- **OLS-based factor attribution and elasticity analysis** — conventional econometric
  decomposition tools; elasticity banding (inelastic <0.5 <unit <1.5 <elastic) follows the
  standard microeconomic vocabulary.
- **TCFD scenario-analysis guidance** — what-if and key-driver outputs support the "understand
  drivers of scenario outcomes" step of disclosure-grade scenario analysis.

## 9 · Future Evolution

### 9.1 Evolution A — Proper experimental design and repaired scenario-hub reads (analytics ladder: rung 2 → 4)

**What.** The sensitivity/attribution toolkit layered on the scenario hub: every method perturbs a
scenario's trajectories and re-runs `builder_engine.calculate_impacts` — tornado (±20% swings),
what-if, leave-one-out attribution, elasticity (1% bump, banded), partial correlation (50 MC
samples, U(0.8,1.2) factors), and OLS attribution (80 samples, normal-equation OLS via Gaussian
elimination), plus CSV/JSON/PDF export. It's a real sensitivity lab, but the sample counts (50/80)
are small for stable correlation/OLS estimates, the OLS is hand-rolled, and §4.2 shows the
scenario-keyed reads (`/interactions/{id}`, tornado/waterfall visualizations, custom-scenario
key-drivers) all trace **failed / db-empty**. Evolution A hardens the statistics and the reads.

**How.** (1) Fix the failing `hub_scenarios`/`custom_scenarios_v2` reads so the visualization and
interaction endpoints work against stored scenarios. (2) Upgrade the sampling: Latin-hypercube or
Sobol sequences (the QMC pattern from Financial Modeling Studio the roadmap names) with convergence
diagnostics, replacing 50–80 uniform draws; swap the hand-rolled OLS for numpy/statsmodels with
standard errors. (3) Add global sensitivity indices (Sobol first-order/total) so interaction
effects are measured rigorously rather than via pairwise joint-run heuristics. (4) Bench-pin the
tornado swings and attribution normalisation.

**Prerequisites.** Scenario-hub reads repaired; numpy/statsmodels wiring (already in the
environment); the underlying `builder_engine` fidelity (its own Evolution A). **Acceptance:**
tornado/waterfall/interactions return `passed` for stored scenarios; correlation/OLS report
standard errors and converge under doubled samples; Sobol indices available; results bench-pinned.

### 9.2 Evolution B — Driver-analysis copilot over the scenario hub (LLM tier 2)

**What.** A copilot that answers the analyst's core question — "what drives this scenario's
outcome?" — by running the tornado (`/sensitivity-analysis`), attribution (`/attribution`), and
elasticity tools and narrating the ranked drivers: "temperature outcome is most sensitive to the
coal-phase-out trajectory (swing 0.4°C); carbon price is unit-elastic; the interaction between gas
and renewables shares is weak."

**How.** Seven analytical POST/GET methods form an ideal tier-2 tool set because each returns a
structured decomposition the copilot can rank and narrate; `/parameters` grounds what can be
analysed. The what-if endpoint powers conversational perturbations ("bump 2030 carbon price 20%")
and the auto-insights (|Δ%| > 5) seed the narrative. Export endpoints deliver the artifact. This
copilot naturally chains with the `scenario_builder_v2` copilot — build, then explain.

**Prerequisites.** Evolution A's read repairs (most scenario-keyed endpoints currently fail);
statistical hardening before narrating correlation/OLS attributions as findings. **Acceptance:**
every swing, elasticity, and contribution traces to a tool response; driver rankings match the
returned decomposition ordering; the copilot discloses sample sizes and uncertainty on
correlation/OLS attributions and refuses causal language for what are perturbation sensitivities.