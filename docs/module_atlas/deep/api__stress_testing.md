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
