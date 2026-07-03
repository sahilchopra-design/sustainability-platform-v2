# Climate Conditional Value-at-Risk Suite
**Module ID:** `climate-cvar-suite` · **Route:** `/climate-cvar-suite` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Climate-adjusted Conditional Value-at-Risk (CVaR) engine for portfolio risk management. Integrates physical and transition scenario losses into tail risk metrics using NGFS scenario set, Expected Shortfall methodology, and climate factor augmented Monte Carlo simulation.

> **Business value:** Climate CVaR augments standard VaR/ES with NGFS scenario losses. Probability-weighted across 5 scenarios. Physical risk dominates tail in RCP8.5 late-century; transition risk dominates under disorderly 1.5°C.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSET_CLASSES`, `BACKTEST_DATA`, `Badge`, `Btn`, `COPULA_PARAMS`, `COPULA_TYPES`, `CVAR_PARAMS`, `DEFAULT_WEIGHTS`, `EFFICIENT_FRONTIER`, `FACTORS`, `FACTOR_RETURNS`, `HORIZONS`, `KpiCard`, `MONTHS`, `NGFS_SCENARIOS`, `PHYS_SOURCES`, `SectionHeader`, `Sel`, `TABS`, `TRANS_SOURCES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `COPULA_TYPES` | `['Gaussian', 'Student-t', 'Clayton'];` |
| `seed` | `ai * 200 + si * 40 + hi * 10;` |
| `basePhys` | `0.03 + sr(seed + 1) * 0.18;` |
| `baseTrans` | `0.02 + sr(seed + 2) * 0.22;` |
| `hrScale` | `1 + hi * 0.25;` |
| `physCVaR95` | `basePhys  * sc.physMult  * hrScale;` |
| `physCVaR99` | `physCVaR95  * (1.25 + sr(seed + 3) * 0.3);` |
| `transCVaR95` | `baseTrans * sc.transMult * hrScale;` |
| `transCVaR99` | `transCVaR95 * (1.20 + sr(seed + 4) * 0.3);` |
| `correlation` | `0.1 + sr(seed + 5) * 0.5;` |
| `combinedCVaR95` | `Math.sqrt(physCVaR95 ** 2 + transCVaR95 ** 2 + 2 * correlation * physCVaR95 * transCVaR95);` |
| `combinedCVaR99` | `Math.sqrt(physCVaR99 ** 2 + transCVaR99 ** 2 + 2 * correlation * physCVaR99 * transCVaR99);` |
| `esValue` | `combinedCVaR99 * (1.15 + sr(seed + 9) * 0.20);` |
| `gpdTailIndex` | `0.10 + sr(seed + 10) * 0.35;` |
| `tailDepCoeff` | `0.05 + sr(seed + 11) * 0.55;` |
| `flPhysAcute` | `0.10 + sr(seed + 12) * 0.60;` |
| `flPhysChronic` | `0.05 + sr(seed + 13) * 0.45;` |
| `flTransPolicy` | `0.08 + sr(seed + 14) * 0.55;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_CLASSES`, `COPULA_TYPES`, `CVAR_PARAMS`, `DEFAULT_WEIGHTS`, `FACTORS`, `HORIZONS`, `MONTHS`, `NGFS_SCENARIOS`, `PHYS_SOURCES`, `RENDERERS`, `TABS`, `TRANS_SOURCES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate CVaR (95%) | `E[Loss|Loss>VaR_95] × π_s` | Monte Carlo + NGFS | Expected portfolio loss in worst 5% of outcomes under climate scenarios |
| Physical Risk Contribution | `Physical factor share of tail loss` | Model decomposition | Fraction of climate CVaR attributable to physical hazard factors |
| Transition Risk Contribution | `Transition factor share of tail loss` | Model decomposition | Fraction of climate CVaR attributable to transition risk factors |
| Scenario Probability Weights | `NGFS likelihood assessment` | NGFS Phase 5 | Probability assigned to each of 5 NGFS climate scenarios |
- **NGFS scenario database** → Carbon price + warming trajectories → risk factors → **Climate scenario loss factors**
- **Portfolio return data** → Historical covariance + climate factor loading → Monte Carlo → **Climate-adjusted tail loss distribution**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-augmented CVaR via scenario-weighted Expected Shortfall
**Headline formula:** `CVaR_climate(q) = E[Loss | Loss > VaR_q] weighted by π_s for s ∈ {NGFS scenarios}; π_s from scenario probability weights`
**Standards:** ['NGFS Phase 5 Scenarios', 'BCBS d532', 'ECB Climate Stress Test', 'Basel III CVaR Framework']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).