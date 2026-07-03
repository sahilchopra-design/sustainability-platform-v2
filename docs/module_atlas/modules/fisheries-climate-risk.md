# Fisheries Climate Risk Analytics
**Module ID:** `fisheries-climate-risk` · **Route:** `/fisheries-climate-risk` · **Tier:** B (frontend-computed) · **EP code:** EP-DJ6 · **Sprint:** DJ

## 1 · Overview
Analyses climate impacts on fisheries productivity including species range shifts, ocean acidification, hypoxia, and temperature stress. Models fisheries revenue at risk, aquaculture investment resilience, and sovereign food security exposure for fishing-dependent economies.

> **Business value:** Critical for fisheries finance institutions, sovereign wealth funds of fishing-dependent nations (Iceland, Norway, Pacific SIDS), aquaculture investors, and food security analysts. Provides IPCC SROCC-aligned revenue risk quantification for both wild capture and aquaculture investment decisions.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `FISHERIES`, `FISHERY_NAMES`, `KpiCard`, `REGIONS`, `STOCK_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `stockHealth` | `+(1 + sr(i * 7) * 9).toFixed(1);` |
| `catchVol` | `+(0.1 + sr(i * 3) * 9.9).toFixed(2);` |
| `totalCatch` | `filtered.reduce((a, f) => a + f.catchVolume, 0).toFixed(2);` |
| `totalSmallScale` | `filtered.reduce((a, f) => a + f.smallScaleFishersDependence, 0).toFixed(2);` |
| `catchByRegion` | `REGIONS.map(r => ({` |
| `climateVsStock` | `filtered.map(f => ({` |
| `projectedChangeData` | `[...filtered].sort((a, b) => a.climateProjectedCatchChange - b.climateProjectedCatchChange).slice(0, 20).map(f => ({` |
| `aquacultureByRegion` | `REGIONS.map(r => {` |
| `smallScaleData` | `[...filtered].sort((a, b) => b.smallScaleFishersDependence - a.smallScaleFishersDependence).slice(0, 15).map(f => ({` |
| `adaptData` | `[...filtered].sort((a, b) => a.adaptationCapacity - b.adaptationCapacity).slice(0, 15).map(f => ({` |
| `subsidyData` | `[...filtered].sort((a, b) => b.subsidiesM - a.subsidiesM).slice(0, 15).map(f => ({` |
| `overexploitData` | `[...filtered].sort((a, b) => b.overexploitationRisk - a.overexploitationRisk).slice(0, 15).map(f => ({` |
| `pct` | `filtered.length ? ((fs.length / filtered.length) * 100).toFixed(1) : '0';` |
| `catchPct` | `+totalCatch > 0 ? ((fs.reduce((a, f) => a + f.catchVolume, 0) / +totalCatch) * 100).toFixed(1) : '0';` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FISHERY_NAMES`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Fisheries Catch | — | FAO SOFIA 2022 | Total global fisheries and aquaculture production — aquaculture now exceeds wild catch for human consumption |
| Fisheries Yield Change by 2100 | — | IPCC SROCC 2019 | Global marine fisheries maximum catch potential declines 3–25% under high emission scenario by 2100 |
| Fishing-Dependent Livelihoods | — | FAO SOFIA 2022 | 600M people depend on fisheries/aquaculture for livelihoods — predominantly in developing coastal countries |
- **FAO fisheries catch data by species/EEZ** → Baseline yield and revenue → **Species-level revenue at risk from climate scenarios**
- **Ocean physical/chemical projections (SST, pH, O2)** → Yield change modelling → **Species yield sensitivity to temperature/acidification/hypoxia**
- **Aquaculture site data + species thermal tolerances** → Aquaculture viability → **Site suitability under future ocean conditions**

## 5 · Intermediate Transformation Logic
**Methodology:** Fisheries Climate Yield Model
**Headline formula:** `YieldChange = BaseYield × (1 + β_T × ΔTemp + β_pH × ΔpH + β_O2 × ΔO2); RevenueAtRisk = ΔYield × CatchPrice × FleetDependency`
**Standards:** ['IPCC SROCC Chapter 5 — Changing Ocean, Marine Ecosystems and Dependent Communities', 'FAO State of World Fisheries and Aquaculture 2022', 'FishMIP Climate Impact Model', 'RCP-driven Stock Assessment Models']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).