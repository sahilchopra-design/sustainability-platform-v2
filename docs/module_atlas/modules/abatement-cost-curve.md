# Abatement Cost Curve
**Module ID:** `abatement-cost-curve` · **Route:** `/abatement-cost-curve` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Marginal abatement cost (MAC) curves ranking decarbonisation technologies from cheapest (negative cost) to most expensive (DAC $300+/tCO2). Covers 50+ abatement measures across energy, transport, buildings, industry, and land use.

> **Business value:** The MAC curve is the foundational tool for cost-optimal decarbonisation planning. It shows where to invest first (negative-cost measures) and what level of carbon price is needed to unlock progressively more expensive abatement options.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CARBON_PRICES`, `CarbonPriceScenariosTab`, `KpiCard`, `MACCTooltip`, `MACCVisualisationTab`, `MEASURES`, `MeasureLibraryTab`, `PortfolioBuilderTab`, `SBTI_TARGET_GAP`, `SECTOR_COLORS`, `SectorBadge`, `SectorComparisonTab`, `TRLBadge`, `TabBar`, `TimelineBadge`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `SBTI_TARGET_GAP` | `12.6; // GtCO2e/yr remaining gap` |
| `map` | `{ near: { label:'Near-term', color: T.green }, medium: { label:'Medium', color: T.amber }, long: { label:'Long-term', color: T.red } };` |
| `sorted` | `useMemo(() => [...measures].sort((a, b) => a.mac - b.mac), [measures]);` |
| `radarData` | `useMemo(() => sectorStats.map(s => ({` |
| `viabilityData` | `useMemo(() => scenarioPrices.map(price => {` |
| `totalPotential` | `viable.reduce((s, m) => s + m.potential, 0);` |
| `totalPot` | `viable.reduce((s, m) => s + m.potential, 0);` |
| `pct` | `Math.round((viable.length / (measures.length \|\| 1)) * 100);` |
| `totalPotential` | `portfolio.reduce((s, m) => s + m.potential, 0);` |
| `totalCost` | `portfolio.reduce((s, m) => s + m.mac * m.potential, 0);` |
| `portfolioMAC` | `totalPotential > 0 ? Math.round(totalCost / totalPotential) : 0;` |
| `sbtiCoverage` | `Math.min(100, Math.round((totalPotential / sbtiGap) * 100));` |
| `entries` | `Object.entries(sMap).sort((a, b) => b[1] - a[1]);` |
| `highestPotential` | `MEASURES.reduce((a, b) => a.potential > b.potential ? a : b);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CARBON_PRICES`, `MEASURES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Measures | — | IPCC AR6 | From negative-cost efficiency to high-cost CDR |
| Cost Range | — | Literature | Wide range from negative to high-cost abatement |
- **Technology cost data** → Annualised cost calculation → **MAC per technology**
- **Emission reduction potential** → Opportunity ranking → **MACC visualisation**

## 5 · Intermediate Transformation Logic
**Methodology:** Marginal abatement cost ranking
**Headline formula:** `MAC = Annualised_cost_change / Annual_emission_reduction`
**Standards:** ['McKinsey MACC', 'IPCC AR6 WGIII']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).