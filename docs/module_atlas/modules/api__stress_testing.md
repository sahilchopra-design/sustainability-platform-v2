# Api::Stress_Testing
**Module ID:** `api::stress_testing` · **Route:** `/api/v1/stress-testing` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/stress-testing/run` | `run_stress_test` | api/v1/routes/stress_testing.py |
| GET | `/api/v1/stress-testing/scenarios` | `get_scenarios` | api/v1/routes/stress_testing.py |
| GET | `/api/v1/stress-testing/pd-multipliers` | `get_pd_multipliers` | api/v1/routes/stress_testing.py |
| GET | `/api/v1/stress-testing/lgd-haircuts` | `get_lgd_haircuts` | api/v1/routes/stress_testing.py |
| GET | `/api/v1/stress-testing/sector-risk-levels` | `get_sector_risk_levels` | api/v1/routes/stress_testing.py |
| POST | `/api/v1/stress-testing/backtest` | `run_pd_backtest` | api/v1/routes/stress_testing.py |
| GET | `/api/v1/stress-testing/backtest/thresholds` | `get_backtest_thresholds` | api/v1/routes/stress_testing.py |

### 2.3 Engine `pd_backtester` (services/pd_backtester.py)
| Function | Args | Purpose |
|---|---|---|
| `PDBacktester.backtest` | observations | Run full PD backtest suite. |
| `PDBacktester._compute_auroc` | pds, defaults | Compute AUROC using trapezoidal rule on ROC curve. |
| `PDBacktester._compute_ks` | pds, defaults | Compute Kolmogorov-Smirnov statistic. |
| `PDBacktester._compute_brier` | pds, defaults, base_rate | Compute Brier Score and Brier Skill Score. |
| `PDBacktester._compute_hosmer_lemeshow` | pds, defaults, n_buckets | Compute Hosmer-Lemeshow chi-squared goodness-of-fit test. |
| `PDBacktester._compute_information_value` | pds, defaults, n_bins | Compute Information Value (IV) for PD ranking power. |
| `PDBacktester._backtest_by_grade` | observations | Run per-grade binomial backtest with traffic light assignment. |
| `PDBacktester._overall_traffic_light` | grade_results | Determine overall traffic light per EBA GL/2017/16. |
| `PDBacktester._compute_cap_curve` | pds, defaults | Compute Cumulative Accuracy Profile (CAP) curve. |
| `PDBacktester.get_gini_thresholds` |  | Return Gini coefficient quality thresholds. |
| `PDBacktester.get_iv_thresholds` |  | Return Information Value interpretation thresholds. |
| `PDBacktester.get_traffic_light_rules` |  | Return EBA GL/2017/16 traffic light rules. |
| `PDBacktester.get_minimum_sample_sizes` |  | Return recommended minimum sample sizes per EBA/ECB. |

### 2.3 Engine `stress_test_runner` (services/stress_test_runner.py)
| Function | Args | Purpose |
|---|---|---|
| `_get_sector_risk_level` | sector | Map sector name to risk level; default 'medium' if unknown. |
| `_irb_risk_weight` | pd, lgd | Simplified IRB risk-weight function per CRR Article 153. |
| `_compute_ecl` | pd_12m, pd_lifetime, lgd, ead, stage | Compute ECL per IFRS 9. |
| `_determine_new_stage` | current_stage, pd_delta_bps, stressed_pd | Determine post-stress IFRS 9 stage. |
| `StressTestRunner.run` | loan_book, portfolio_name, run_id | Execute stress test across all configured scenarios. |
| `StressTestRunner._run_scenario` | scenario, loan_book, total_ead, base_ecl_total | Run a single scenario across the whole loan book. |
| `StressTestRunner._stress_exposure` | scenario, exp | Apply scenario stress to a single exposure. |
| `StressTestRunner._compute_base_ecl` | loan_book | Compute total ECL under BASE (un-stressed) conditions. |
| `StressTestRunner._compute_rwa_delta` | loan_book, scenario | Compute change in RWA for a scenario vs baseline. |
| `StressTestRunner._build_sector_concentrations` | sector_acc, scenario, total_ead | Build SectorConcentration list from accumulator dictionary. |
| `StressTestRunner._compute_capital_impact` | result | Aggregate capital impact metrics across scenarios. |
| `StressTestRunner._build_methodology_notes` |  | Return list of methodology notes explaining the calculations. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `mock-sample`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/stress-testing/backtest/thresholds** — status `passed`, provenance ['mock-sample'], source tables: —
Output: `{'type': 'object', 'keys': ['gini_thresholds', 'iv_thresholds', 'traffic_light_rules', 'minimum_sample_sizes'], 'n_keys': 4}`

**GET /api/v1/stress-testing/lgd-haircuts** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['lgd_haircuts'], 'n_keys': 1}`

**GET /api/v1/stress-testing/pd-multipliers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pd_multipliers'], 'n_keys': 1}`

**GET /api/v1/stress-testing/scenarios** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['scenarios', 'weights'], 'n_keys': 2}`

**GET /api/v1/stress-testing/sector-risk-levels** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector_risk_levels'], 'n_keys': 1}`

## 5 · Intermediate Transformation Logic

**Engine `pd_backtester` — extracted transformation lines:**
```python
overall_dr = n_defaults / n if n > 0 else 0.0
gini = 2.0 * auroc - 1.0
order = np.argsort(-pds)
n_neg = float(n - n_pos)
tpr_arr = np.cumsum(sorted_defaults) / n_pos
fpr_arr = np.cumsum(1 - sorted_defaults) / n_neg
step = max(1, len(tpr_arr) // 100)
Brier = mean((predicted_pd - actual_default)^2)
Brier_reference = base_rate * (1 - base_rate)
brier = float(np.mean((pds - defaults) ** 2))
brier_ref = base_rate * (1.0 - base_rate)
skill = 1.0 - (brier / brier_ref) if brier_ref > 0 else 0.0
n_buckets = max(2, n // 5)
bucket_size = n // n_buckets
```

**Engine `stress_test_runner` — extracted transformation lines:**
```python
pd = max(pd, 1e-6)
pd = min(pd, 1.0 - 1e-6)
rho = (0.12 * (1.0 - math.exp(-50.0 * pd)) / (1.0 - math.exp(-50.0))
b = (0.11852 - 0.05478 * math.log(pd)) ** 2
ma = (1.0 + (2.5 - 1.0) * b) / (1.0 - 1.5 * b)
k = lgd * (conditional_pd - pd) * ma
ecl_12m = pd_12m * lgd * ead
ecl_lifetime = pd_lifetime * lgd * ead
ecl_applied = lgd * ead
base_ecl_exp = exp.baseline_pd * exp.baseline_lgd * exp.ead
summary.weighted_avg_pd = pd_ead_sum / total_ead if total_ead > 0 else 0.0
summary.weighted_avg_lgd = lgd_ead_sum / total_ead if total_ead > 0 else 0.0
summary.capital_shortfall = rwa_impact * MIN_CAPITAL_RATIO
stressed_pd = min(exp.baseline_pd * pd_mult, 1.0)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).