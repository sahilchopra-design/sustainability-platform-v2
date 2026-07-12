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
