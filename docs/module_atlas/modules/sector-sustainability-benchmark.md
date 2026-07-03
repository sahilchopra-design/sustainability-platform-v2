# Sector Sustainability Benchmarking
**Module ID:** `sector-sustainability-benchmark` · **Route:** `/sector-sustainability-benchmark` · **Tier:** B (frontend-computed) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Benchmarks portfolio companies against GICS sector peers on a comprehensive set of ESG KPIs including carbon intensity, energy intensity, water use, waste generation, gender diversity, board independence, and supply chain audit coverage. Draws on MSCI ESG, S&P Global CSA, and CDP sector-level benchmarks.

> **Business value:** Used by portfolio managers, sustainability analysts, and corporate strategy teams to identify sector-relative ESG strengths and weaknesses and set science-based improvement targets.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BEST_PRACTICES`, `COMPANIES`, `ESG_DIMS`, `MATURITY_DIMS`, `MATURITY_LEVELS`, `REGIONS`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `si * 100 + ci * 37 + 2000;` |
| `sectorRadarData` | `useMemo => SECTORS.map((s,si) => {` |
| `seed` | `si * 200 + 3000;` |
| `REGIONS` | `['EU Leaders','North America','Asia-Pacific','India','LatAm & Africa'];` |
| `sectorChartData` | `useMemo(() => SECTORS.map((s,i) => ({` |
| `seed` | `si * 200 + di * 7 + 3000;` |
| `seed` | `ri * 300 + 4000;` |
| `vals` | `MATURITY_DIMS.map(d => getMaturity(d));` |
| `sorted` | `[...sectorComps].sort((a,b)=>b[key]-a[key]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BEST_PRACTICES`, `COLORS`, `ESG_DIMS`, `MATURITY_DIMS`, `MATURITY_LEVELS`, `REGIONS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Carbon Intensity Percentile | `company tCO2e/M$ revenue vs peer distribution` | CDP + MSCI ESG data | Above 75th percentile (lower intensity) indicates best-in-class climate performance; used in SBTi sector pathw |
| ESG Composite Benchmark Score | `weighted avg of normalised KPI scores across E/S/G pillars` | MSCI ESG + S&P CSA combined | Overall relative ESG performance within the sector; <40 signals laggard status, >70 signals sector leader. |
| Supply Chain Audit Coverage | `tier_1_suppliers_audited / tier_1_suppliers_total × 100` | Company-reported supply chain data | Reflects operational visibility and supply chain ESG risk management maturity; sector benchmark varies 20–80%  |
- **MSCI ESG + S&P CSA + CDP sector data → peer KPI distributions** → IQR normalisation → SASB materiality weighting → composite score → **Company vs peer benchmark scorecard with percentile rankings**

## 5 · Intermediate Transformation Logic
**Methodology:** Normalised ESG KPI Benchmarking
**Headline formula:** `benchmark_score = (company_kpi − peer_p25) / (peer_p75 − peer_p25) × 100`
**Standards:** ['MSCI ESG Research Sector Benchmarks', 'S&P Global Corporate Sustainability Assessment (CSA)', 'CDP Technical Notes Sector-Specific Guidance']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).