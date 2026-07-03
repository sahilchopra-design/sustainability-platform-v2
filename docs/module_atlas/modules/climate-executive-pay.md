# Climate Executive Pay Analytics
**Module ID:** `climate-executive-pay` · **Route:** `/climate-executive-pay` · **Tier:** B (frontend-computed) · **EP code:** EP-DK4 · **Sprint:** DK

## 1 · Overview
Analyses the design and effectiveness of climate-linked executive remuneration. Evaluates metric selection, target ambition, weighting, and vesting verification against TCFD, SBTi, and Paris Agreement benchmarks. Models incentive alignment and greenwashing risk in executive pay structures.

> **Business value:** Directly applicable to active ownership teams engaging company boards on remuneration committee decisions, governance-focused ESG analysts rating executive accountability, and SRI mandates requiring demonstrated climate pay alignment. Aligned with PRI/IIGCC stewardship toolkit standards.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COUNTRIES`, `EXECS`, `KpiCard`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sector` | `SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];` |
| `country` | `COUNTRIES[Math.floor(sr(i * 11) * COUNTRIES.length)];` |
| `totalComp` | `parseFloat((2 + sr(i * 13) * 48).toFixed(1));` |
| `climateKpiWeight` | `parseFloat((5 + sr(i * 17) * 35).toFixed(1));` |
| `climateBonusActual` | `parseFloat((totalComp * climateKpiWeight / 100 * (0.5 + sr(i * 19) * 0.7)).toFixed(2));` |
| `scope1Reduction` | `parseFloat((sr(i * 23) * 30).toFixed(1));` |
| `scope1Target` | `parseFloat((5 + sr(i * 29) * 25).toFixed(1));` |
| `climateMetricMet` | `scope1Reduction >= scope1Target * 0.9;` |
| `carbonPricingIncentive` | `sr(i * 31) > 0.45;` |
| `longTermClimateVesting` | `sr(i * 37) > 0.4;` |
| `peerBenchmarkPct` | `parseFloat((70 + sr(i * 41) * 60).toFixed(0));` |
| `payRatio` | `Math.round(50 + sr(i * 43) * 350);` |
| `targetStatus` | `scope1Reduction >= scope1Target ? 'Met' : scope1Reduction >= scope1Target * 0.7 ? 'Partial' : 'Missed';` |
| `avgKpiWeight` | `(filtered.reduce((a, e) => a + e.climateKpiWeight, 0) / n).toFixed(1);` |
| `totalBonusPool` | `filtered.reduce((a, e) => a + e.climateBonusActual, 0).toFixed(1);` |
| `pctMet` | `((filtered.filter(e => e.targetStatus === 'Met').length / n) * 100).toFixed(0);` |
| `avgPayScore` | `(filtered.reduce((a, e) => a + e.climatePayScore, 0) / n).toFixed(1);` |
| `bySector` | `SECTORS.map(s => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate in FTSE 100 LTIPs | — | Willis Towers Watson Global Executive Pay 2023 | 78% of FTSE 100 companies include ESG/climate metric in long-term incentive plan |
| Typical Climate Pay Weight | — | PRI Climate Pay Survey 2023 | Average climate metric weight in executive LTIP is 5–15% — PRI recommends minimum 20% for materiality |
| Climate Metric Verification | — | Minerva Analytics 2023 | Only 32% of climate pay metrics are independently verified — high greenwashing risk |
- **Executive remuneration reports + proxy statements** → Climate pay structure analysis → **Metric, target, weight, and vesting conditions for climate components**
- **Company emissions data + SBTi targets** → Ambition verification → **Target trajectory vs SBTi-required reductions**
- **PRI/IIGCC climate pay quality frameworks** → Benchmark scoring → **Company score vs PRI recommended best practice**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate Pay Alignment Score
**Headline formula:** `PayAlignScore = MetricQuality × TargetAmbition × WeightMateriality × VerificationRigor; EffectiveClimateWeight = ExplicitClimateMetric% × TotalPay`
**Standards:** ['TCFD Implementation Guide — Executive Remuneration 2021', 'PRI Guidance on Climate-Linked Remuneration 2022', 'IIGCC Net Zero Stewardship Toolkit 2023', 'SBTi Corporate Net Zero Standard — Remuneration Section']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).