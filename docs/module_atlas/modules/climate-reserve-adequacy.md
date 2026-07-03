# Climate Reserve Adequacy
**Module ID:** `climate-reserve-adequacy` · **Route:** `/climate-reserve-adequacy` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Assesses the adequacy of insurer technical reserves under physical and transition climate scenarios, quantifying reserve shortfalls and capital implications across product lines.

> **Business value:** Supports actuarial teams and prudential supervisors in identifying climate-driven reserve gaps before they crystallise into solvency issues, enabling proactive capital and product management.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `HORIZONS`, `KpiCard`, `LOBS`, `LOB_NAMES`, `NGFS_SCENARIOS`, `SCEN_COLORS`, `SCEN_MULTS`, `TabBtn`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `LOBS` | `LOB_NAMES.map((name, i) => {` |
| `premiumIncome` | `+(sr(i * 23 + 1) * 800 + 100).toFixed(0);` |
| `paidLoss` | `+(sr(i * 23 + 2) * 55 + 35).toFixed(1);` |
| `incurredLoss` | `+(paidLoss + sr(i * 23 + 3) * 8).toFixed(1);` |
| `devFactors` | `Array.from({ length: 7 }, (_, j) => +(1 + sr(i * 23 + 4 + j) * 0.15).toFixed(4));` |
| `cumulativeFactor` | `devFactors.reduce((a, b) => a * b, 1);` |
| `baseIBNR` | `+(premiumIncome * (sr(i * 23 + 11) * 0.25 + 0.05)).toFixed(0);` |
| `climateDevFactor` | `+(sr(i * 23 + 12) * 0.15 + 0.02).toFixed(4);` |
| `tailFactor` | `+(sr(i * 23 + 13) * 0.08 + 1.01).toFixed(4);` |
| `discountRate` | `+(sr(i * 23 + 14) * 0.03 + 0.01).toFixed(4);` |
| `reportingLag` | `Math.round(sr(i * 23 + 15) * 48 + 6);` |
| `ceded` | `+(sr(i * 23 + 16) * 0.45 + 0.05).toFixed(3);` |
| `longtail` | `sr(i * 23 + 17) > 0.5;` |
| `pvReserve` | `+(baseIBNR / Math.pow(1 + discountRate, reportingLag / 12)).toFixed(0);` |
| `scoreFactor` | `(1 - climateDevFactor * 3) * (1 - sr(i * 23 + 18) * 0.3);` |
| `lossTriangle` | `Array.from({ length: 8 }, (_, p) => +(premiumIncome * paidLoss / 100 * (p + 1) / 8 * (1 + sr(i * 23 + 19 + p) * 0.1)).toFixed(0));` |
| `expUltimate` | `lob.premiumIncome * lob.ultimateLossRatio / 100;` |
| `paid` | `lob.paidLossRatio / 100 * lob.premiumIncome;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `HORIZONS`, `LOB_NAMES`, `NGFS_SCENARIOS`, `SCEN_COLORS`, `SCEN_MULTS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Reserve Uplift (RCP 8.5, 2050) | — | EIOPA 2022 | Range of reserve increases for property and liability lines under high-warming scenario by 2050. |
| CBES Reserve Shortfall Signal | — | Bank of England CBES 2021 | Estimated aggregate reserve gap identified in Bank of England Climate Biennial Exploratory Scenario for the UK |
- **Policy data, historical loss triangles, climate hazard severity projections** → Scenario-adjusted loss development, chain-ladder/BF repricing, reserve gap quantification → **Reserve adequacy ratios by line, capital shortfall estimates, regulatory stress outputs**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate Reserve Adequacy Ratio
**Headline formula:** `CRAR = ClimateAdjustedReserves / UnadjustedReserves`
**Standards:** ['EIOPA Climate Sensitivity Analysis 2022', 'Bank of England CBES 2021']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).