# EM Sovereign Climate Debt Analytics
**Module ID:** `em-sovereign-climate-debt` · **Route:** `/em-sovereign-climate-debt` · **Tier:** B (frontend-computed) · **EP code:** EP-DH1 · **Sprint:** DH

## 1 · Overview
Analyses the intersection of climate vulnerability and sovereign debt sustainability for emerging market countries. Models climate-adjusted debt service capacity, Paris-aligned debt restructuring mechanisms, and climate debt swap frameworks using IMF DSA with climate overlays.

> **Business value:** Critical for EM sovereign debt investors pricing climate risk into emerging market bonds, multilateral creditors designing debt relief mechanisms, and finance ministries of climate-vulnerable countries seeking fiscal space for adaptation. Directly addresses V20 agenda and IMF Climate-Debt nexus work.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `NAMES`, `RATINGS`, `RATING_BUCKET_MAP`, `REGIONS`, `SOVEREIGNS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['Sub-Saharan Africa', 'South Asia', 'East Asia & Pacific', 'Latin America', 'MENA', 'Eastern Europe & CA', 'Caribbean'];` |
| `RATINGS` | `['AAA-AA', 'A-BBB', 'BB-B', 'CCC-C', 'Distressed'];` |
| `ratingIdx` | `Math.floor(sr(i * 7) * RATINGS.length);` |
| `gdpBn` | `+(20 + sr(i * 11) * 980).toFixed(1);` |
| `debtGdpPct` | `+(35 + sr(i * 13) * 95).toFixed(1);` |
| `climateVulnerabilityIndex` | `Math.round(20 + sr(i * 17) * 75);` |
| `totalGreenBond` | `filtered.reduce((a, s) => a + s.greenBondIssuance, 0);` |
| `avgVuln` | `filtered.length ? filtered.reduce((a, s) => a + s.climateVulnerabilityIndex, 0) / filtered.length : 0;` |
| `totalAdaptGap` | `filtered.reduce((a, s) => a + s.adaptationFinanceGap, 0);` |
| `dnEligiblePct` | `filtered.length ? (filtered.filter(s => s.debtForNatureSwapEligible).length / filtered.length * 100).toFixed(1) : '0.0';` |
| `greenBondByRegion` | `REGIONS.map(r => ({` |
| `scatterData` | `filtered.map(s => ({ x: s.debtGdpPct, y: s.climateVulnerabilityIndex, name: s.name }));` |
| `top15AdaptGap` | `[...filtered].sort((a, b) => b.adaptationFinanceGap - a.adaptationFinanceGap).slice(0, 15).map(s => ({` |
| `defaultByRegion` | `REGIONS.map(r => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `NAMES`, `RATINGS`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate-Vulnerable EM Debt | — | IMF Climate and Sovereign Debt 2023 | EM sovereign debt at elevated risk due to climate vulnerability — V20 countries average 250 bps climate premiu |
| V20 Climate Premium | — | V20 Climate Vulnerability Monitor 2023 | Climate-vulnerable countries pay 117 bps more on sovereign bonds than climate-resilient peers, controlling for |
| Climate Debt Swap Market | — | Debt Relief for Green Recovery Initiative | Debt-for-climate/nature swaps executed globally — growing mechanism to free fiscal space for adaptation |
- **IMF WEO sovereign fiscal + growth data** → Climate-adjusted DSA → **Climate-adjusted debt service ratio by scenario/decade**
- **Climate vulnerability indices (ND-GAIN, INFORM)** → Spread premium calculation → **Climate component of sovereign bond spread**
- **Debt swap deal database + creditor terms** → Swap feasibility modelling → **Debt service savings and climate investment unlocked per swap structure**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-Adjusted Debt Sustainability
**Headline formula:** `ClimateAdjustedDSR = DebtService / (GDPgrowth_base - GDPloss_climate × β_climate); ClimatePremium_spread = BaseSpread × (1 + PhysicalVuln × 0.5 + TransitionRisk × 0.3)`
**Standards:** ['IMF Debt Sustainability Analysis Framework', 'V20 Vulnerable Twenty Climate & Debt Initiative', 'Climate Bonds Initiative Sovereign Debt Framework', 'UNFCCC High Level Champion Resilience Finance']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).