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
