# FI Net-Zero Pathway Analytics
**Module ID:** `fi-net-zero-pathways` · **Route:** `/fi-net-zero-pathways` · **Tier:** B (frontend-computed) · **EP code:** EP-DW1 · **Sprint:** DW

## 1 · Overview
Net-zero pathway analytics for financial institutions covering PCAF financed emissions baseline, NZBA sector alignment pathways across nine sectors, 2030 interim targets and portfolio decarbonisation lever analysis.

> **Business value:** FI net-zero analytics requires PCAF-compliant financed emissions baselines (DQ 1–5), NZBA sector pathway alignment across nine sectors and 2030 interim targets; decarbonisation levers span divestment, engagement and new green finance allocation.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ENGAGEMENT_STRATEGY`, `INTERIM_TARGETS`, `NZ_ALLIANCES`, `PATHWAY_YEARS`, `PCAF_SCORES`, `PORTFOLIO_SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `total` | `loans.reduce((s, l) => s + l.loanExposure, 0);` |
| `pathwayData` | `useMemo(() => PATHWAY_YEARS.map((year, i) => {` |
| `progress` | `(year - 2020) / 30;` |
| `currentEmissions` | `totalFinancedEmissions * Math.max(0.05, 1 - progress * portfolioReduction);` |
| `parisPath` | `totalFinancedEmissions * Math.max(0.02, 1 - progress * 0.65);` |
| `ndc` | `totalFinancedEmissions * Math.max(0.15, 1 - progress * 0.45);` |
| `waciByYear` | `useMemo(() => PATHWAY_YEARS.map((year, i) => {` |
| `tempByYear` | `useMemo(() => waciByYear.map(d => ({` |
| `sectorGapData` | `useMemo(() => activeSectors.map(s => ({` |
| `waciVal` | `Math.round(180 + sr(i * 23) * 350);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ENGAGEMENT_STRATEGY`, `INTERIM_TARGETS`, `NZ_ALLIANCES`, `PATHWAY_YEARS`, `PCAF_SCORES`, `PORTFOLIO_SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| PCAF Data Quality Score | `DQ = Weighted average of holding-level data quality scores` | PCAF Standard 2022 | Higher DQ scores indicate proxy/estimation-based emissions; DQ1 uses audited primary data. |
| NZBA 2030 Power Sector Target | `Financed Emissions Intensity = Weighted Avg Grid Intensity of Financed Power Assets` | NZBA Power Sector Guidance | Consistent with IEA NZE power sector pathway; absolute emissions reduction required simultaneously. |
| Portfolio Temperature Score | `PTS = Weighted Avg Company ITR from SBTI/MSCI/ISS methodologies` | MSCI Climate Value-at-Risk / SBTI SBTi Tool | Headline metric for investor and regulator communication of portfolio alignment. |
- **PCAF asset-class emissions data + NZBA sector pathways** → Financed emissions model → lever analysis → interim target dashboard → **FI net-zero pathway analytics platform**

## 5 · Intermediate Transformation Logic
**Methodology:** Portfolio Decarbonisation Rate
**Headline formula:** `PDR = (Baseline Emissions − Current Emissions) / Baseline Emissions × 100`
**Standards:** ['NZBA — Guidelines for Climate Target Setting for Banks 2021', 'PCAF — Global GHG Accounting Standard 2022']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).