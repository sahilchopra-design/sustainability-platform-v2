# Damage Function Calculator
**Module ID:** `damage-function-calculator` · **Route:** `/damage-function-calculator` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Models climate economic damage functions from the DICE, PAGE, and FUND Integrated Assessment Models, computing GDP loss under different warming trajectories and allowing comparison of damage function parameterisations, discount rates, and socioeconomic scenarios.

> **Business value:** Enables economists, risk managers, and policy analysts to understand the range of economic damage estimates under different climate scenarios, assess the sensitivity of impact estimates to model choice and discount rate, and quantify the economic case for transition investment.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSET_CLASSES`, `DF_STANDARDS`, `KpiCard`, `RETURN_PERIODS`, `SCENARIOS`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n) => n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${n.toFixed(0)}`;` |
| `intensity` | `(i / (numPoints - 1)) * maxIntensity;` |
| `baseLossFrac` | `Math.min(0.9, 0.02 * Math.pow(rp, 0.55) * (1 + sr(i * 7) * 0.15));` |
| `adjLoss` | `baseLossFrac * scenarioMult;` |
| `lossUsd` | `assetValue * Math.min(0.95, adjLoss);` |
| `pointLossUsd` | `assetValue * pointDR.dr;` |
| `probBand` | `(1 / epCurve[i - 1].returnPeriod) - (1 / epCurve[i].returnPeriod);` |
| `standardComparison` | `useMemo(() => Object.keys(DF_STANDARDS).map(s => {` |
| `pmlPct` | `(pml / assetValue) * 100;` |
| `label` | `rp === 100 ? '1-in-100 (Insurance standard)' : rp === 250 ? '1-in-250 (Solvency II / ECB CST)' : rp === 500 ? '1-in-500 (Severe stress)' : '1-in-1000 ` |
| `lossUsd` | `ac.value * pt.dr * scenarioMult;` |
| `val` | `Math.round(pml100 * pcts[i]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_CLASSES`, `RETURN_PERIODS`, `SCENARIOS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Damage at 2°C (DICE) | — | Nordhaus DICE-2023R | Estimated annual GDP loss at 2°C warming; considered an underestimate by many economists |
| Global Damage at 4°C (Burke) | — | Burke et al. 2015 | Empirical damage estimate at 4°C using GDP-temperature panel regression with country fixed effects |
| Social Cost of Carbon (DICE, 3% disc.) | — | Nordhaus DICE-2023R | Present value of future GDP damages from one additional tonne of CO₂ emissions |
| Fat-Tail Probability (PAGE) | — | Hope PAGE09 | Probability of catastrophic damage scenarios (>20% GDP loss) under PAGE probabilistic model |
| Regional Heterogeneity | — | FUND 3.9 | Tropical developing regions experience 2–5× higher per-capita damage than global average |
- **NGFS/RCP temperature pathways** → Input decadal temperature trajectories to damage function models → **GDP loss trajectory per warming scenario**
- **DICE/PAGE/FUND model parameters** → Calibrate damage functions, compute annual GDP damage and SCC → **Damage function curves and SCC estimates**
- **World Bank regional GDP data** → Apply FUND regional damage weights, compute heterogeneous impacts → **Regional GDP damage by country group**

## 5 · Intermediate Transformation Logic
**Methodology:** IAM Damage Function Modelling
**Headline formula:** `D(T) = 1 - 1/(1 + α₁T + α₂T²)`
**Standards:** ['Nordhaus DICE-2023R', 'Hope PAGE09', 'Anthoff & Tol FUND 3.9', 'Burke et al. 2015']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).