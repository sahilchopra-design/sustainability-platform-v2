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
| `PDBacktester.backtest` | observations | Run full PD backtest suite. Parameters ---------- observations : list of ObservedDefault Minimum 30 observations required. Returns ------- BacktestMetrics Raises ------ ValueError If fewer than 30 observations provided. |
| `PDBacktester._compute_auroc` | pds, defaults | Compute AUROC using trapezoidal rule on ROC curve. Sort by predicted PD descending. Higher PD = more likely default. Returns (auroc, roc_points) where roc_points = [(fpr, tpr), ...]. |
| `PDBacktester._compute_ks` | pds, defaults | Compute Kolmogorov-Smirnov statistic. Maximum separation between cumulative default and non-default PD distributions. Uses scipy.stats.ks_2samp. |
| `PDBacktester._compute_brier` | pds, defaults, base_rate | Compute Brier Score and Brier Skill Score. Brier = mean((predicted_pd - actual_default)^2) Brier_reference = base_rate * (1 - base_rate) Brier Skill Score = 1 - Brier / Brier_reference |
| `PDBacktester._compute_hosmer_lemeshow` | pds, defaults, n_buckets | Compute Hosmer-Lemeshow chi-squared goodness-of-fit test. Groups observations into n_buckets by predicted PD, then compares observed vs expected defaults per bucket using chi2 distribution. |
| `PDBacktester._compute_information_value` | pds, defaults, n_bins | Compute Information Value (IV) for PD ranking power. IV = SUM[ (pct_non_default_i - pct_default_i) * WoE_i ] WoE_i = ln(pct_non_default_i / pct_default_i) Laplace smoothing applied (0.5) to avoid log(0). |
| `PDBacktester._backtest_by_grade` | observations | Run per-grade binomial backtest with traffic light assignment. P(X >= observed_defaults / n, predicted_pd) using scipy.stats.binom. Traffic light per EBA GL/2017/16: GREEN => p-value >= 0.05 YELLOW => 0.01 <= p-value < 0.05 RED => p-value < 0.01 |
| `PDBacktester._overall_traffic_light` | grade_results | Determine overall traffic light per EBA GL/2017/16. RED if any grade is RED. YELLOW if > 25% of grades are YELLOW. GREEN otherwise. |
| `PDBacktester._compute_cap_curve` | pds, defaults | Compute Cumulative Accuracy Profile (CAP) curve. Sort by PD descending, plot (cumulative % of population, cumulative % of defaults). |
| `PDBacktester.get_gini_thresholds` |  | Return Gini coefficient quality thresholds. excellent >= 0.60, good >= 0.40, acceptable >= 0.25, poor < 0.25 |
| `PDBacktester.get_iv_thresholds` |  | Return Information Value interpretation thresholds. very_strong >= 0.50, strong >= 0.30, medium >= 0.10, weak >= 0.02, useless < 0.02 |
| `PDBacktester.get_traffic_light_rules` |  | Return EBA GL/2017/16 traffic light rules. |
| `PDBacktester.get_minimum_sample_sizes` |  | Return recommended minimum sample sizes per EBA/ECB. |

### 2.3 Engine `stress_test_runner` (services/stress_test_runner.py)
| Function | Args | Purpose |
|---|---|---|
| `_get_sector_risk_level` | sector | Map sector name to risk level; default 'medium' if unknown. |
| `_irb_risk_weight` | pd, lgd | Simplified IRB risk-weight function per CRR Article 153. Uses Vasicek single-factor model correlation and maturity adjustment. Floored at RISK_WEIGHT_FLOOR per CRR2 output floor. |
| `_compute_ecl` | pd_12m, pd_lifetime, lgd, ead, stage | Compute ECL per IFRS 9. Stage 1 -> 12-month ECL = PD_12m * LGD * EAD Stage 2 -> Lifetime ECL = PD_lifetime * LGD * EAD Stage 3 -> Lifetime ECL = LGD * EAD (PD effectively 1.0) Returns (ecl_12m, ecl_lifetime, ecl_applied). |
| `_determine_new_stage` | current_stage, pd_delta_bps, stressed_pd | Determine post-stress IFRS 9 stage. SICR trigger: PD increase > SICR_THRESHOLD_BPS => Stage 1 -> 2 Default trigger: stressed PD >= 1.0 => Stage -> 3 Returns (new_stage, sicr_triggered, default_triggered). |
| `StressTestRunner.run` | loan_book, portfolio_name, run_id | Execute stress test across all configured scenarios. Parameters ---------- loan_book : list of LoanBookExposure portfolio_name : str run_id : str, optional -- auto-generated UUID if omitted Returns ------- StressTestResult with full breakdown. |
| `StressTestRunner._run_scenario` | scenario, loan_book, total_ead, base_ecl_total | Run a single scenario across the whole loan book. |
| `StressTestRunner._stress_exposure` | scenario, exp | Apply scenario stress to a single exposure. |
| `StressTestRunner._compute_base_ecl` | loan_book | Compute total ECL under BASE (un-stressed) conditions. |
| `StressTestRunner._compute_rwa_delta` | loan_book, scenario | Compute change in RWA for a scenario vs baseline. RWA_impact = sum(EAD_i * (RW_stressed_i - RW_base_i)) |
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

**POST /api/v1/stress-testing/backtest** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/stress-testing/run** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

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
end = (i + 1) * bucket_size if i < n_buckets - 1 else n
df = max(valid_buckets - 2, 1)
p_value = float(1.0 - scipy_stats.chi2.cdf(chi2, df))
IV = SUM[ (pct_non_default_i - pct_default_i) * WoE_i ]
WoE_i = ln(pct_non_default_i / pct_default_i)
n_non_defaults = float(len(defaults) - n_defaults)
bin_size = len(pds) // n_bins
end = (i + 1) * bin_size if i < n_bins - 1 else len(pds)
nd = max(float(len(bin_defaults) - bin_defaults.sum()), 0.5)
pct_nd = nd / n_non_defaults
woe = math.log(pct_nd / pct_d)
YELLOW => 0.01 <= p-value < 0.05
order = np.argsort(-pds)
cum_pop = np.arange(1, n + 1) / n
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
stressed_lgd = max(min(exp.baseline_lgd + lgd_add, 1.0), 0.0)
pd_delta_bps = (stressed_pd - exp.baseline_pd) * 10_000.0
pd_lifetime = min(stressed_pd * LIFETIME_PD_FACTOR, 1.0)
pd_lt = min(exp.baseline_pd * LIFETIME_PD_FACTOR, 1.0)
RWA_impact = sum(EAD_i * (RW_stressed_i - RW_base_i))
stressed_pd = min(exp.baseline_pd * pd_mult, 1.0)
stressed_lgd = max(min(exp.baseline_lgd + lgd_add, 1.0), 0.0)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the domain computes

`/api/v1/stress-testing` couples the platform's two most regulator-shaped credit engines:

1. **`StressTestRunner`** (`stress_test_runner.py`) — a multi-scenario climate loan-book stress
   test: PD multipliers × sector risk tier, additive LGD haircuts × collateral class, IFRS 9 stage
   migration with SICR, 12-month vs lifetime ECL, probability-weighted ECL, Vasicek IRB risk
   weights and capital shortfall.
2. **`PDBacktester`** (`pd_backtester.py`) — a PD-model validation suite: Gini/AUROC, KS, Brier
   and Brier skill, Hosmer–Lemeshow, Information Value, per-grade binomial traffic lights, CAP/ROC
   curves.

```
stressed_PD  = min(PD_base × mult(scenario, sector_tier), 1)
stressed_LGD = clamp(LGD_base + haircut(scenario, collateral), 0, 1)
ECL: stage1 = PD_12m·LGD·EAD;  stage2 = min(PD×3.5, 1)·LGD·EAD;  stage3 = LGD·EAD
SICR: stage 1→2 when ΔPD > 100 bps;  default: stage→3 when PD ≥ 1
PW-ECL = Σ w_s · ECL_s        w = {OPT 0.10, BASE 0.40, ADV 0.35, SEV 0.15}
RW (CRR Art.153): ρ = 0.12·f(PD) + 0.24·(1−f);  K = LGD·(Φ((Φ⁻¹PD+√ρ·Φ⁻¹0.999)/√(1−ρ)) − PD)·MA
RWA impact = Σ EAD·(RW_stressed − RW_base);  shortfall = ΔRWA × 8 %
Gini = 2·AUROC − 1;  binomial p = 1 − BinomCDF(d−1; n, PD̄)
```

### 7.2 Parameterisation

**PD multipliers** (comment: "Calibrated from EBA 2023 adverse scenario + NGFS Phase IV"):

| Scenario (weight) | low | medium | high | very_high |
|---|---|---|---|---|
| OPTIMISTIC (0.10) | 0.85 | 0.90 | 0.95 | 0.97 |
| BASE (0.40) | 1.00 | 1.00 | 1.00 | 1.00 |
| ADVERSE (0.35) | 1.30 | 1.80 | 2.50 | 3.50 |
| SEVERE (0.15) | 1.80 | 2.60 | 3.80 | 5.00 |

**LGD haircuts** (additive; "Based on ECB/SSM 2022 collateral devaluation assumptions"): ADVERSE
property +0.05 / equipment +0.07 / financial +0.03 / unsecured +0.10; SEVERE +0.10/+0.12/+0.06/
+0.15; OPTIMISTIC small negatives. **Sector tiers**: 20 sectors — Oil & Gas, Coal, Steel
very_high; Cement, Chemicals, Aviation, Shipping, Power Generation high; Agriculture → Construction
medium; Retail, Tech, Healthcare, Telecoms, Renewables, Food low; unknown → medium.
**Other constants**: SICR 100 bps (cites IFRS 9.B5.5.9 / EBA GL/2017/06); lifetime-PD factor 3.5
("average residual maturity ~4 years"); minimum capital ratio 8 % (CRR Art. 92); risk-weight floor
0.15; IRB maturity M = 2.5 yr.

**Backtester thresholds**: Gini excellent ≥ 0.60 / good ≥ 0.40 / acceptable ≥ 0.25; IV
very-strong ≥ 0.50 … weak ≥ 0.02 (Laplace-smoothed WoE); traffic lights GREEN p ≥ 0.05, YELLOW
0.01–0.05, RED < 0.01 (attributed to EBA GL/2017/16 Annex I); overall light RED if any grade RED,
YELLOW if > 25 % of grades YELLOW; minimum 30 observations; HL test on `n_buckets` (default 10)
deciles; model_valid requires Gini ≥ 0.25 AND overall light ≠ RED AND HL p ≥ 0.01.

### 7.3 Calculation walkthrough

**Runner**: baseline ECL is computed per current stage; each scenario stresses every exposure,
re-stages it (stage 2 cures to 1 if ΔPD ≤ 0; stage 3 cures to 2 only if ΔPD < −100 bps), books
stage-appropriate ECL, tracks the 8-cell migration matrix and SICR/default trigger counts,
accumulates EAD-weighted PD/LGD, sector concentrations (EAD share, ECL uplift, simple-average
PDs), and RWA delta via the full Vasicek formula (`scipy.stats.norm`). Capital summary reports
probability-weighted and worst-case RWA impact/shortfall. 15 `methodology_notes` strings document
every choice in the payload itself.

**Backtester**: AUROC by trapezoidal integration of the ROC; KS via `ks_2samp` on PD distributions
of defaulters vs non-defaulters; Brier skill vs the constant-base-rate reference; HL chi-squared
over PD-sorted deciles; IV over WoE bins; per-grade one-sided binomial exceedance test
`P(X ≥ d | n, PD̄)` — the standard "Jeffreys/binomial" conservatism check for PD under-estimation.

### 7.4 Worked example — one exposure, ADVERSE

Oil & Gas obligor (tier very_high), PD 2 %, LGD 45 %, EAD $10M, property collateral, stage 1:

| Step | Computation | Result |
|---|---|---|
| Stressed PD | 0.02 × 3.50 | **7.0 %** |
| Stressed LGD | 0.45 + 0.05 | **50 %** |
| ΔPD | (0.07 − 0.02) × 10⁴ = 500 bps > 100 | **SICR → stage 2** |
| Lifetime PD | min(0.07 × 3.5, 1) | 24.5 % |
| ECL applied (stage 2) | 0.245 × 0.50 × 10,000,000 | **$1,225,000** |
| ECL base (stage 1) | 0.02 × 0.45 × 10M | $90,000 → uplift ≈ ×13.6 |
| Scenario contribution to PW-ECL | 0.35 × 1,225,000 | $428,750 |

Note the stage migration itself (12-month → lifetime ECL) contributes far more uplift than the PD
multiplier alone — the intended IFRS 9 cliff effect.

### 7.5 Data provenance & limitations

- **No PRNG, no seed data** — both engines are pure functions of the caller's loan book /
  observation set; the API also exposes the parameter tables (`GET /pd-multipliers`,
  `/lgd-haircuts`, `/sector-risk-levels`, `/scenarios`, `/backtest/thresholds`) as reference data.
- Multipliers/haircuts are *stated* as EBA-2023/ECB-2022-calibrated but are embedded constants —
  no traceable mapping to published scenario paths; scenario weights (10/40/35/15) are a platform
  judgement, as IFRS 9 does not prescribe weights.
- Lifetime ECL uses a flat ×3.5 PD scalar — no PD term structure, discounting, prepayment or EAD
  amortisation; stage-3 ECL ignores recoveries timing.
- The IRB formula uses the corporate correlation function and a fixed M = 2.5 (no
  firm-size adjustment, no maturity input despite `maturity_years` existing on the exposure); the
  0.15 risk-weight floor is described as the CRR2 output floor but applied per-exposure rather
  than at aggregate 72.5 % of SA.
- The binomial test treats the grade's *average* predicted PD as the null — standard but assumes
  independence of defaults (no asset-correlation adjustment à la Vasicek one-factor test).

### 7.6 Framework alignment

- **EBA EU-wide stress test methodology (GL/2023 cycle)** — constrained bottom-up projection of
  credit losses under supervisory scenarios; the runner reproduces the PD/LGD-path-to-ECL
  mechanics at a stylised sector-tier level.
- **ECB/SSM Climate Risk Stress Test 2022** — source of the collateral-devaluation haircut design
  and the sector-tiered transition-risk framing.
- **NGFS Phase IV** — the four platform scenarios map onto NGFS narrative severity, and sector
  tiers follow NGFS transition-vulnerability assessments.
- **IFRS 9 §5.5** — staging, SICR (B5.5.9's rebuttable presumptions approximated by the 100 bps
  rule), 12-month vs lifetime ECL, and §5.5.17's probability-weighted multi-scenario ECL.
- **CRR Art. 92/153 (Basel IRB)** — Vasicek 99.9 % conditional-PD capital formula with maturity
  adjustment; shortfall at the 8 % Pillar-1 minimum.
- **EBA GL/2017/16 & ECB TRIM ch. 4 / BCBS CRE 36** — the backtester's metric suite
  (discrimination: Gini/AUROC/KS; calibration: binomial traffic lights, HL, Brier) is exactly the
  validation toolkit those texts require for IRB PD models; the GREEN/YELLOW/RED banding follows
  supervisory binomial-test practice.

## 9 · Future Evolution

### 9.1 Evolution A — Portfolio-wired stress runs with NGFS-derived multipliers (analytics ladder: rung 3 → 4)

**What.** The domain couples the platform's two most regulator-shaped credit engines:
`StressTestRunner` (multi-scenario loan-book stress with PD multipliers × sector tier, LGD
haircuts × collateral, IFRS 9 stage migration with SICR at ΔPD > 100bps, probability-weighted ECL,
and proper Vasicek/CRR Art. 153 IRB risk weights) and `PDBacktester` (Gini/AUROC, KS, Brier skill,
Hosmer-Lemeshow with real scipy chi-square tails, IV/WoE, binomial traffic lights). This is genuine
rung-3 machinery. The limits: the scenario PD multipliers/LGD haircuts and the probability weights
(OPT 0.10 / BASE 0.40 / ADV 0.35 / SEV 0.15) are static reference tables, the stage-2 lifetime ECL
uses a flat `PD × 3.5` proxy, and the loan book is caller-supplied per request.

**How.** (1) Derive the scenario multipliers from the platform's NGFS data and the
`prudential_climate_risk`/`pcaf_ecl_bridge` transformations rather than static tables, with vintage
provenance. (2) Replace the `PD × 3.5` lifetime-ECL proxy with a term-structure lifetime PD (the
`lgd_vintage` cohort machinery provides the shape). (3) Wire `/run` to `portfolios_pg` so a stress
test runs on the stored book, persisting results for the `portfolio_health` scores that already
read ECL staging. (4) Backtest loop: feed realized outcomes to `PDBacktester` automatically so
model drift surfaces without manual runs. (5) Bench-pin the Vasicek K and PW-ECL.

**Prerequisites.** NGFS/credit-engine linkage; `portfolios_pg` integration; an outcomes store for
the backtest loop. **Acceptance:** multipliers carry an NGFS-derivation provenance; stage-2 ECL
uses a term-structure PD; a stored portfolio stresses by ID; Vasicek and PW-ECL bench-pinned to a
worked CRR example.

### 9.2 Evolution B — Stress-testing and model-validation copilot (LLM tier 2)

**What.** A copilot for risk teams: "stress my book under the severe scenario — what's the ECL
uplift, stage migration, and capital shortfall?" (calling `/run` and citing the PW-ECL and RWA
decompositions), and "backtest the PD model on this outcome set" (calling `/backtest` and narrating
Gini, Brier skill, and the per-grade traffic lights against `/backtest/thresholds`).

**How.** Two POST engines plus five reference GETs (scenarios with weights, pd-multipliers,
lgd-haircuts, sector-risk-levels, backtest thresholds) that ground every constant. The copilot
explains stage-migration mechanics (why an exposure moved to stage 2 under SICR) and which
statistical test drove a YELLOW/RED traffic light — the reference thresholds make the verdicts
citable. What-ifs across scenarios re-run statelessly. Central node for a credit-risk desk,
pairing with `model_validation` and `prudential_climate_risk`.

**Prerequisites.** None hard — both engines are honest and well-parameterised; portfolio-wired
answers need Evolution A. **Acceptance:** every ECL, RWA, and test statistic traces to a tool
response; traffic-light verdicts cite the threshold table; the copilot labels the stage-2 `×3.5`
proxy as such until Evolution A, and refuses to assert regulatory capital adequacy beyond the
computed shortfall.