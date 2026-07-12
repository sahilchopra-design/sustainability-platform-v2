## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — the engine docstring is the methodology statement; nothing to reconcile.)*

### 7.1 What the module computes

`backend/services/model_validation_framework.py` (class `ModelValidationFramework`) is the platform's **second-line model-risk-management layer**: a model inventory, a generalised backtesting harness, lifecycle governance, champion–challenger comparison and a compliance dashboard, aligned (per docstring) to BCBS 239, EBA GL/2023/04 and Fed SR 11-7. Exposed via `api/v1/routes/model_validation.py`: `POST /backtest`, `GET /inventory`, `GET /dashboard`, and `GET /ref/{catalog, lifecycle-states, lifecycle-transitions, validation-tests, regulatory-frameworks}`.

**Model inventory** (`MODEL_INVENTORY`): 17 registered platform models across credit risk (PD/LGD/EAD/staging), climate risk (physical HEV, transition CPRS/NGFS, scenario analysis, sovereign), valuation (real estate, stranded assets), emissions (GHG calculator, PCAF), market risk (VaR, stress testing), regulatory (CBAM, EU Taxonomy) and ESG (factor overlay) — each with risk tier (1–3), model type, owning team, validation frequency and mapped engine module.

### 7.2 Validation test suite & thresholds (`VALIDATION_TESTS` — 12 tests, green/amber/red traffic lights)

| Test | Category | Green | Amber | Direction |
|---|---|---|---|---|
| RMSE | accuracy | ≤ 0.05 | ≤ 0.10 | lower better |
| MAE | accuracy | ≤ 0.03 | ≤ 0.07 | lower better |
| MAPE | accuracy | ≤ 10.0 | ≤ 20.0 | lower better |
| R² | accuracy | ≥ 0.70 | ≥ 0.50 | higher better |
| Hit rate (direction) | discriminatory power | ≥ 70% | ≥ 55% | higher better |
| AUC-ROC | discriminatory power | ≥ 0.75 | ≥ 0.65 | higher better |
| KS statistic | calibration | ≥ 0.40 | ≥ 0.25 | higher better |
| Hosmer–Lemeshow p | calibration | ≥ 0.05 | ≥ 0.01 | higher better |
| Binomial test p | calibration | ≥ 0.05 | ≥ 0.01 | higher better |
| Basel traffic-light breaches (250d) | backtesting | ≤ 4 | ≤ 9 | lower better |
| PSI | stability | ≤ 0.10 | ≤ 0.25 | lower better |
| CSI | stability | ≤ 0.10 | ≤ 0.25 | lower better |

Provenance: the Basel breach bands (green ≤ 4, amber 5–9, red ≥ 10 exceptions in 250 days) match the BCBS backtesting traffic-light framework; the PSI 0.10/0.25 bands are the industry-standard convention; KS ≥ 0.40 "good discrimination" and AUC ≥ 0.75 follow common IRB-validation rules of thumb; RMSE/MAE/MAPE thresholds are platform conventions (they are scale-dependent, so fixed cut-offs implicitly assume rate-like 0–1 targets).

**Lifecycle governance:** 6 states (DEVELOPMENT → VALIDATION → APPROVED → MONITORING → UNDER_REVIEW → RETIRED) with an explicit transition whitelist (e.g. MONITORING → {UNDER_REVIEW, RETIRED}; UNDER_REVIEW → {VALIDATION, MONITORING, RETIRED}).

### 7.3 Calculation walkthrough

**Backtest (`run_backtest`):** given `predicted[]` and `actual[]` (truncated to common length n), every requested test is computed by `_compute_test`, banded green/amber/red per direction, and aggregated worst-case: any red → overall red / "fail" / regulatory `non_compliant`; any amber → amber / `under_observation`; else green / `compliant`. Deterministic run id = first 16 hex chars of SHA-256 of `bt:{model}:{window}`. Recommendations cite the frameworks — red overall → "Immediate review required per EBA GL/2023/04" + transition to UNDER_REVIEW; Tier-1 model not green → "escalate to Model Risk Committee per SR 11-7".

Test implementations worth noting (all pure-Python, self-labelled "simplified"): AUC = concordant-pairs (Mann–Whitney) statistic; KS = max CDF separation of predicted scores between actual 1s and 0s; Hosmer–Lemeshow builds deciles and converts χ² to an **approximate** p via `exp(−χ²/(2·dof))` (not the true χ² tail); binomial test uses a normal z with p ≈ `2·exp(−z²/2)`; PSI compares *sorted* predicted vs actual decile shares; hit rate = fraction of consecutive-step direction agreements.

**Champion–challenger (`compare_models`):** computes RMSE/MAE/MAPE/R²/hit-rate for both models, picks a winner on the chosen metric, then a paired squared-error difference test: `t = mean(diff)/(sd(diff)/√n)` with approximate `p = 2·exp(−|t|/2)`… precisely, `2·exp(−0.5·|t|)`, floored at 0.001. Challenger promotion is recommended only when it wins **and** p < 0.05.

**Dashboard:** counts models by state/tier/category; `bcbs239_compliance_pct` = share of models with a periodic validation frequency **and** documented key outputs; `eba_gl_2023_04_compliant` checks all Tier-1/2 models are validated (currently assumed true — in-code comment: "production reads from DB").

### 7.4 Worked example — backtesting a PD model on 5 observations

`predicted = [0.02, 0.03, 0.05, 0.04, 0.06]`, `actual = [0.025, 0.028, 0.06, 0.035, 0.055]`, tests = RMSE, MAE, hit rate.

| Test | Computation | Value | Light |
|---|---|---|---|
| RMSE | errors −0.005, 0.002, −0.01, 0.005, 0.005 → mse = (25+4+100+25+25)/5 ×10⁻⁶ = 35.8×10⁻⁶ | **0.00598** | green (≤ 0.05) |
| MAE | (5+2+10+5+5)/5 ×10⁻³ | **0.0054** | green (≤ 0.03) |
| Hit rate | steps: pred +,+,−,+ vs act +,+,−,+ → 4/4 | **100%** | green (≥ 70) |

Overall: green / pass / `compliant`; no recommendations beyond none. Had actual step 4 moved up instead (breaking one direction), hit rate = 75% (still green); two breaks → 50% → red → overall red → EBA GL/2023/04 critical recommendation + SR-11-7 escalation for this Tier-1 model.

### 7.5 Data provenance & limitations

- **No PRNG** — deterministic throughout (even run ids are content-hashed); all data is caller-supplied prediction/actual series.
- **Statistical approximations:** the Hosmer–Lemeshow, binomial and paired-t p-values use exponential approximations rather than proper χ²/normal/t distributions — fine for traffic-light triage, not for formal hypothesis testing; PSI on sorted arrays measures distributional shift only coarsely (equal-count deciles of each series make within-bucket shares nearly identical by construction, so the implemented PSI is systematically near zero).
- **Governance is stateless in this layer:** lifecycle current-state is hard-coded to MONITORING, dashboard overdue/findings lists are empty, and EBA Tier-1/2 validation is assumed complete — the in-code comments explicitly defer persistence to the database layer. Treat the dashboard as a schema demonstration until wired.
- Fixed accuracy thresholds (RMSE ≤ 0.05 etc.) presume probability-scaled outputs; backtesting a €-denominated model against them would misclassify.
- Inventory metadata (owners, frameworks, engine modules) is a curated registry, not auto-discovered from code.

### 7.6 Framework alignment

- **SR 11-7 (Fed, 2011):** the canonical three-pillar MRM guidance — development documentation, *independent* validation, ongoing monitoring, governed by a model inventory — mirrored by the inventory registry, lifecycle state machine and Tier-1 escalation language.
- **EBA GL/2023/04 (Model Risk Management):** model inventory, annual independent validation of material models, change management — encoded as validation frequencies, the Tier-1/2 annual-validation compliance check and red-result review triggers.
- **BCBS 239 (2013):** risk-data aggregation principles (completeness, accuracy, timeliness, governance) proxied by the metadata-completeness compliance percentage.
- **Basel III CRE 35 / backtesting traffic lights:** the IRB validation triad (discriminatory power / calibration / stability) structures the test categories, and the 4/9-breach VaR traffic-light bands are reproduced exactly (BCBS's zones derive from binomial probabilities of exceptions at 99% VaR over 250 days).
- **IFRS 9 ECL validation (EBA/GL/2017/16):** stage-classification and PD/LGD/EAD backtesting named in the framework catalogue; the registered ECL models carry it as their governing framework.
